/**
 * AI Control Plane
 *
 * Sits between AI-proposed changes and the PML runtime: "the AI proposes,
 * the control plane decides, the runtime executes"
 * (docs/FINAL/11_AI_Conversational_Layer_Discussion.md §4.2–§4.3).
 *
 * This is composition over what already exists, not a new validator or a
 * new patch-application engine (docs/FINAL/12_AI_Layer_Reconciliation_and_Build_Plan.md
 * Phase C):
 *   - validate() calls pml-core's existing applyPatches() — which is
 *     side-effect-free on its `currentPml` input (it parses into a fresh
 *     in-memory model and returns new text/graph, never mutating the
 *     caller's string) — so calling it and simply not committing the result
 *     *is* a dry-run. No new dry-run flag needed in pml-core.
 *   - authorize() reads ConversationContext's mode permission table
 *     (canModePropose / MODE_PERMISSIONS) — the single source of truth for
 *     what a mode may do, not a second copy of that policy.
 *   - commit() is the only place that's allowed to call the real,
 *     document-mutating side effect (controller.setPmlContent).
 *   - Every decision point emits into eventLog.ts's TurnStarted...
 *     TurnComplete stream directly (docs/FINAL/12_AI_Layer_Reconciliation_and_Build_Plan.md
 *     Phase D, step 12: "no separate instrumentation path") — this module
 *     used to keep its own minimal audit log; that's now folded into the
 *     one real event log rather than living alongside it.
 */

import { applyPatches, parsePml, type PmlPatch, type PatchResult } from 'pml-core';
import { canModePropose, type TurnMode } from '@/components/chat/ConversationContext';
import { emit } from './eventLog';
import { extractAffectedNodeIds } from './affectedNodes';

// ---------------------------------------------------------------------------
// Validate — dry-run against the existing validator/patch-applicator.
// Never touches the live document.
// ---------------------------------------------------------------------------

export interface ValidateResult {
  valid: boolean;
  error?: string;
  /** The PML text that *would* result — caller decides whether/when to commit it. */
  pml?: string;
}

export function validate(currentPml: string, patches: PmlPatch[]): ValidateResult {
  const result: PatchResult = applyPatches(currentPml, patches, 'accept-all');
  if (!result.success) {
    return { valid: false, error: result.error };
  }
  return { valid: true, pml: result.pml };
}

// ---------------------------------------------------------------------------
// Authorize — mode permission check. Delegates to the single permission
// table in ConversationContext rather than re-deciding policy here.
// ---------------------------------------------------------------------------

export interface AuthorizeResult {
  allowed: boolean;
  reason?: string;
}

export function authorize(mode: TurnMode): AuthorizeResult {
  if (!canModePropose(mode)) {
    return { allowed: false, reason: `Mode '${mode}' is read-only and cannot commit changes.` };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Reconcile — detects whether the user made a direct edit to a node/edge
// the AI's proposal also touches, between when the proposal was created
// (originalPml) and when the user clicks Accept (currentPml). Implements
// docs/FINAL/11_AI_Conversational_Layer_Discussion.md §3.4's protocol:
//   1. No drift at all (originalPml === currentPml) → apply normally.
//   2. Drift, but not on any node the proposal touches → apply normally
//      (the user edited something unrelated while the proposal sat pending).
//   3. Drift on a touched node, but the specific field(s) the proposal
//      would change weren't the ones the user changed → merge (both land).
//   4. Drift on a touched node's *same* field the proposal would change →
//      genuine conflict. The user's current value wins; the conflicting op
//      is dropped from the patch set (not silently — a PatchConflictDetected
//      event is emitted); any non-conflicting ops in the same proposal still
//      apply, against currentPml (not the stale originalPml).
//
// This doesn't need CRDT-grade machinery for a single-user-plus-one-AI
// scenario (§3.4) — a snapshot diff at commit time is sufficient because
// there's no concurrent multi-user editing to reconcile against, only the
// same user acting on the canvas while a proposal sits pending in chat.
// ---------------------------------------------------------------------------

export interface ReconcileResult {
  /** Patches safe to apply against currentPml — conflicting ops removed. */
  patches: PmlPatch[];
  conflicts: Array<{ nodeId: string; field: string; aiValue: unknown; userValue: unknown }>;
}

const COMPARABLE_FIELDS = ['label', 'actor', 'scope', 'taskType', 'direction', 'eventType', 'process'] as const;

export function reconcile(originalPml: string, currentPml: string, patches: PmlPatch[]): ReconcileResult {
  if (originalPml === currentPml) {
    return { patches, conflicts: [] };
  }

  const touchedNodeIds = new Set(extractAffectedNodeIds(patches));
  if (touchedNodeIds.size === 0) {
    // Nothing node-addressable to conflict-check (e.g. a pure update-edge or
    // update-process op) — apply as-is against currentPml.
    return { patches, conflicts: [] };
  }

  let originalNodes: Map<string, Record<string, unknown>>;
  let currentNodes: Map<string, Record<string, unknown>>;
  try {
    const originalGraph = parsePml(originalPml, { validationMode: 'loose' }).graph;
    const currentGraph = parsePml(currentPml, { validationMode: 'loose' }).graph;
    if (!originalGraph || !currentGraph) return { patches, conflicts: [] };
    originalNodes = new Map(originalGraph.nodes.map((n: any) => [n.id, n]));
    currentNodes = new Map(currentGraph.nodes.map((n: any) => [n.id, n]));
  } catch {
    // A parse failure here shouldn't block the commit — fall through and
    // let validate()/applyPatches surface any real problem downstream.
    return { patches, conflicts: [] };
  }

  const conflicts: ReconcileResult['conflicts'] = [];
  const safePatches: PmlPatch[] = [];

  for (const patch of patches) {
    const nodeId = patch.op === 'add-node' ? patch.node.id
      : (patch.op === 'update-node' || patch.op === 'remove-node') ? patch.nodeId
      : undefined;

    // Only update-node has a specific single field to conflict-check against
    // — add-node/remove-node either don't exist yet in `original` (nothing
    // to conflict with) or are an outright removal (handled by rule 2/3: if
    // the user also changed that node, still let the removal proceed rather
    // than inventing a merge semantics no one asked for).
    if (patch.op === 'update-node' && nodeId && touchedNodeIds.has(nodeId)) {
      const field = patch.field;
      if ((COMPARABLE_FIELDS as readonly string[]).includes(field)) {
        const before = originalNodes.get(nodeId)?.[field];
        const after = currentNodes.get(nodeId)?.[field];
        // The user changed this exact field between originalPml and
        // currentPml, and their value differs from what the AI is also
        // trying to set here — genuine conflict (rule 4).
        if (after !== before && after !== patch.value) {
          conflicts.push({ nodeId, field, aiValue: patch.value, userValue: after });
          continue; // drop this op — user's direct edit wins
        }
      }
    }

    safePatches.push(patch);
  }

  return { patches: safePatches, conflicts };
}

// ---------------------------------------------------------------------------
// Commit — the only function allowed to call the real, document-mutating
// side effect. Runs validate() + authorize() itself rather than trusting the
// caller already did — a control plane that could be bypassed by skipping a
// step isn't actually a boundary.
// ---------------------------------------------------------------------------

export interface CommitParams {
  proposalId: string;
  mode: TurnMode;
  currentPml: string;
  patches: PmlPatch[];
  /** Called with the new PML text — the one place setPmlContent-equivalent side effects happen. */
  onCommit: (newPml: string) => void;
  /** Ties this commit's events back to the turn that produced the proposal
   *  (eventLog.newTurnId(), generated when the turn started). Optional so
   *  existing callers that haven't threaded a turnId through yet don't break —
   *  events without one just aren't attributable to a specific turn. */
  turnId?: string;
  /**
   * The PML this proposal's patches were generated against (PatchProposal.originalPml,
   * 13_Phase_E_Findings_Drive_Canvas_Plan.md E.4). Optional so any caller
   * that hasn't threaded it through yet still commits normally (no
   * reconciliation performed, same as before this field existed) rather
   * than failing closed.
   */
  originalPml?: string;
}

export interface CommitOutcome {
  success: boolean;
  error?: string;
  /** Set when reconcile() found and resolved conflicts — surfaced so the UI
   *  can tell the user what was overridden, rather than silently proceeding. */
  conflicts?: ReconcileResult['conflicts'];
}

export function commit(params: CommitParams): CommitOutcome {
  const { proposalId, mode, currentPml, patches, onCommit, turnId, originalPml } = params;
  const now = Date.now();
  const tid = turnId ?? proposalId;

  const auth = authorize(mode);
  if (!auth.allowed) {
    emit({ type: 'UserRejected', turnId: tid, mode, proposalId, timestamp: now, detail: { reason: auth.reason } });
    emit({ type: 'TurnFailed', turnId: tid, mode, proposalId, timestamp: now, detail: { reason: auth.reason } });
    return { success: false, error: auth.reason };
  }

  let effectivePatches = patches;
  let conflicts: ReconcileResult['conflicts'] = [];
  if (originalPml !== undefined) {
    const reconciled = reconcile(originalPml, currentPml, patches);
    effectivePatches = reconciled.patches;
    conflicts = reconciled.conflicts;
    for (const c of conflicts) {
      emit({ type: 'PatchConflictDetected', turnId: tid, mode, proposalId, timestamp: now, detail: c });
    }
  }

  const validation = validate(currentPml, effectivePatches);
  emit({ type: 'ActionValidated', turnId: tid, mode, proposalId, timestamp: now, detail: { valid: validation.valid, error: validation.error } });
  if (!validation.valid || !validation.pml) {
    emit({ type: 'TurnFailed', turnId: tid, mode, proposalId, timestamp: now, detail: { reason: validation.error } });
    return { success: false, error: validation.error ?? 'Validation failed', conflicts };
  }

  emit({ type: 'UserApproved', turnId: tid, mode, proposalId, timestamp: now });
  onCommit(validation.pml);
  emit({ type: 'ActionCommitted', turnId: tid, mode, proposalId, timestamp: now, detail: { patchesApplied: effectivePatches.length } });
  emit({ type: 'GraphChanged', turnId: tid, mode, proposalId, timestamp: now });
  emit({ type: 'TurnComplete', turnId: tid, mode, proposalId, timestamp: now });
  return { success: true, conflicts: conflicts.length > 0 ? conflicts : undefined };
}

export function rejectProposal(proposalId: string, mode: TurnMode, reason: string, turnId?: string): void {
  const tid = turnId ?? proposalId;
  emit({ type: 'UserRejected', turnId: tid, mode, proposalId, timestamp: Date.now(), detail: { reason } });
}
