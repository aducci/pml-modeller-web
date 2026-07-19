/**
 * AI Turn Event Log
 *
 * The canonical, replayable record of an AI turn — not just a rendering
 * mechanism (docs/FINAL/11_AI_Conversational_Layer_Discussion.md §4.8).
 * Extends, rather than replaces, the minimal audit log introduced in
 * controlPlane.ts (Phase C) — that log's four event kinds
 * (validated/authorized/committed/rejected) mapped onto this fuller
 * vocabulary's ActionValidated/UserApproved/ActionCommitted/TurnFailed;
 * controlPlane.ts's commit()/rejectProposal() now emit directly into *this*
 * log instead of keeping a separate one
 * (docs/FINAL/12_AI_Layer_Reconciliation_and_Build_Plan.md Phase D, step 12:
 * "no separate instrumentation path").
 *
 * Deliberately in-memory for this phase, not the unused Conversation/
 * ConversationMessage Prisma models — those are a different, still
 * deliberately-deferred concern (conversation *content* persistence); this
 * is turn *event* history, and persisting it is future work, not this phase.
 *
 * Built to directly answer 11_...md §8's metrics questions (patch acceptance
 * rate per mode, inferred-value correction latency, tool/action failure
 * rate) rather than as a generic logging framework — see the query helpers
 * at the bottom.
 */

import type { TurnMode } from '@/components/chat/ConversationContext';

export type TurnEventType =
  | 'TurnStarted'
  | 'ContextResolved'
  | 'GraphQueried'
  | 'FindingsRetrieved'
  | 'ChangeProposed'
  | 'ActionValidated'
  | 'PreviewRendered'
  | 'UserApproved'
  | 'UserRejected'
  | 'ActionCommitted'
  | 'GraphChanged'
  | 'PatchConflictDetected'
  | 'TurnFailed'
  | 'TurnComplete';

export interface TurnEvent {
  type: TurnEventType;
  turnId: string;
  mode?: TurnMode;
  proposalId?: string;
  timestamp: number;
  /** Free-form detail specific to the event type — kept loose deliberately;
   *  this is a log, not a second schema to keep in sync with every caller. */
  detail?: Record<string, unknown>;
}

const events: TurnEvent[] = [];

let turnCounter = 0;
/** New turn id — call once per user-initiated AI turn (one sendMessage/startInterview call). */
export function newTurnId(): string {
  return `turn-${Date.now()}-${++turnCounter}`;
}

export function emit(event: TurnEvent): void {
  events.push(event);
}

/** Read-only snapshot of the full event log. */
export function getEventLog(): ReadonlyArray<TurnEvent> {
  return events;
}

// ---------------------------------------------------------------------------
// Query helpers — answer 11_...md §8's metrics questions directly, rather
// than leaving every consumer to re-derive them from raw events.
// ---------------------------------------------------------------------------

/** Patch/action acceptance rate, overall or scoped to one mode. */
export function acceptanceRate(mode?: TurnMode): number {
  const relevant = events.filter(
    (e) => (e.type === 'UserApproved' || e.type === 'UserRejected') && (!mode || e.mode === mode)
  );
  if (relevant.length === 0) return NaN;
  const approved = relevant.filter((e) => e.type === 'UserApproved').length;
  return approved / relevant.length;
}

/** Tool/action failure rate — TurnFailed events as a fraction of all turns started. */
export function failureRate(): number {
  const started = events.filter((e) => e.type === 'TurnStarted').length;
  if (started === 0) return NaN;
  const failed = events.filter((e) => e.type === 'TurnFailed').length;
  return failed / started;
}

/** Number of PatchConflictDetected events — a live signal for Phase E's reconciliation protocol once it exists. */
export function conflictCount(): number {
  return events.filter((e) => e.type === 'PatchConflictDetected').length;
}
