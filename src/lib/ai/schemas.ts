/**
 * PML AI — Response Schemas
 *
 * Zod schemas for validating AI responses.
 * Used by the AI SDK's structured output mode.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Patch operation schemas
//
// NOTE: patch ops deliberately do NOT carry a `provenance` field here.
// One was added to all 7 op schemas in Phase A
// (docs/FINAL/12_AI_Layer_Reconciliation_and_Build_Plan.md), then removed
// 2026-07-19 after a live 500: it pushed this discriminated union past
// Anthropic's structured-output limit ("Schemas contains too many optional
// parameters (39)... limit: 24"), breaking every /api/ai/propose call.
// Nothing was populating the field yet, so removing it cost nothing
// functionally. pml-core's `Provenance` type (diagnostics.ts) and
// `PmlPatch`'s `PatchProvenance` extension still exist for non-AI-facing use
// — if AI-authored provenance is needed again, budget it against the
// 24-optional-parameter ceiling rather than adding it back the same way
// (e.g. one shared provenance field on the AiResponse envelope instead of
// one per patch op, or a narrower shape than the full 3-field Provenance).
// ---------------------------------------------------------------------------

const addNodeSchema = z.object({
  op: z.literal('add-node'),
  node: z.object({
    id: z.string().min(1).max(100),
    type: z.enum(['event', 'task', 'decision', 'route', 'subprocess', 'actor']),
    label: z.string().optional(),
    actor: z.string().optional(),
    scope: z.enum(['inScope', 'external']).optional(),
    taskType: z.enum(['manual', 'user', 'service', 'script', 'business_rule']).optional(),
    direction: z.enum(['inbound', 'outbound', 'internal']).optional(),
    eventType: z.enum(['message', 'signal', 'timer', 'state']).optional(),
    outcomes: z.array(z.object({ name: z.string(), target: z.string(), primary: z.boolean().optional() })).optional(),
    process: z.string().optional(),
  }),
  // `after` was schema-only plumbing — pml-core's applyAddNode() (pmlPatch.ts)
  // never reads patch.after at all, so this optional field cost a slot in
  // Anthropic's 24-optional-parameter budget for zero real capability.
  // Removed 2026-07-19 as part of getting the union back under budget
  // (see the removeEdgeSchema-adjacent note above for the full incident).
});

const updateNodeSchema = z.object({
  op: z.literal('update-node'),
  nodeId: z.string().min(1),
  field: z.enum(['label', 'actor', 'scope', 'taskType', 'direction', 'eventType', 'metadata']),
  // Must be a concrete (non-empty) schema — Anthropic's structured-output API
  // rejects the whole request schema if any branch resolves to an
  // unconstrained `{}` (which is what z.any()/z.unknown() produce).
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.string())]),
});

const removeNodeSchema = z.object({
  op: z.literal('remove-node'),
  nodeId: z.string().min(1),
});

const addEdgeSchema = z.object({
  op: z.literal('add-edge'),
  edge: z.object({
    source: z.string().min(1),
    target: z.string().min(1),
    condition: z.string().optional(),
    label: z.string().optional(),
    keyFlow: z.boolean().optional(),
    loop: z.boolean().optional(),
    flowLayer: z.enum(['main', 'alternate', 'message', 'annotation', 'hidden']).optional(),
    semanticRole: z.enum(['normalFlow', 'messageFlow', 'exceptionFlow', 'compensationFlow', 'eventEscalation', 'boundaryInterrupt']).optional(),
  }),
});

const updateEdgeSchema = z.object({
  op: z.literal('update-edge'),
  edgeId: z.string().min(1),
  field: z.enum(['condition', 'label', 'keyFlow', 'loop', 'flowLayer', 'semanticRole']),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

const removeEdgeSchema = z.object({
  op: z.literal('remove-edge'),
  edgeId: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  target: z.string().min(1).optional(),
  condition: z.string().optional(),
});

const updateProcessSchema = z.object({
  op: z.literal('update-process'),
  field: z.enum(['name', 'level', 'parent', 'version', 'status']),
  value: z.string(),
});

export const pmlPatchSchema = z.discriminatedUnion('op', [
  addNodeSchema,
  updateNodeSchema,
  removeNodeSchema,
  addEdgeSchema,
  updateEdgeSchema,
  removeEdgeSchema,
  updateProcessSchema,
]);

// ---------------------------------------------------------------------------
// Clarifying question — resolve ambiguity before mutating
// (docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md E.3), and the
// mechanism E.4 reuses for multi-option resolution (see AI response schema
// note below — a second full `pmlPatchSchema` embedding for "candidates"
// was tried and confirmed live to blow the optional-parameter budget even
// harder than the original incident, since Anthropic's grammar compiler
// counts every reference to the union, not just its first appearance; a
// question with resolution-option labels sidesteps that entirely).
//
// When the model's interpretation depends on business intent the graph
// doesn't encode (e.g. whether a decision node represents a check or an
// activity) — or when a finding genuinely has multiple reasonable fixes
// (e.g. "remove the decision" vs. "make it a real decision with a
// backorder path") — it returns a fixed-choice question instead of
// guessing and emitting patches. Rendered as buttons, not a text input —
// selecting an option re-sends it as the next sendMessage call, and *that*
// turn produces an ordinary single-`patches` response for the chosen
// approach. No second patch schema ever needs to exist in one response.
// ---------------------------------------------------------------------------

export const clarifyingQuestionSchema = z.object({
  prompt: z.string().min(1).max(300),
  options: z.array(z.string().min(1).max(80)).min(2).max(6),
});

// ---------------------------------------------------------------------------
// AI response schema
//
// NOTE on things deliberately NOT here: no per-patch-op `provenance` field,
// no `observations` field, and no second embedding of `pmlPatchSchema` for
// multi-candidate proposals. All three were tried at points in this session
// and reverted after live incidents — Anthropic's structured-output API
// rejects the whole schema past a 24-optional-parameter limit, and it counts
// every reference to a union (including a second embedding inside a
// "candidates" array), not just the first. `observations` was also
// confirmed genuinely dead code while investigating (data.observations was
// never read anywhere, ModelObservation was defined-but-unpopulated, and
// E.2 replaced its UI surface with real Finding cards) so it stayed removed
// regardless. Full incident history in
// docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md. Multi-option
// resolution is handled entirely through `question` above instead — verify
// live against the real Anthropic API before adding anything back here,
// tsc/next build do not catch this class of failure.
// ---------------------------------------------------------------------------

export const aiResponseSchema = z.object({
  explanation: z.string().min(1),
  // 20 was too low for a genuine full-model rewrite (e.g. restructuring a
  // 2-node template into a multi-actor, multi-step process easily needs
  // 20+ ops) — the whole response was rejected by Zod with no partial
  // recovery, silently falling back to the prose-only chat route.
  patches: z.array(pmlPatchSchema).max(60).default([]),
  confidence: z.enum(['high', 'medium', 'low']),
  // Present only when resolving the request requires knowing business
  // intent the graph alone doesn't encode, or when there are genuinely
  // multiple reasonable resolutions to choose between — mutually exclusive
  // with a meaningful `patches` array in practice (the model should ask
  // first, then propose once answered), but not enforced structurally here
  // since a model could legitimately still want to state an explanation
  // either way.
  question: clarifyingQuestionSchema.optional(),
});

export type AiResponse = z.infer<typeof aiResponseSchema>;
export type PmlPatchOp = z.infer<typeof pmlPatchSchema>;

// ---------------------------------------------------------------------------
// Chat message schema
// ---------------------------------------------------------------------------

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  pmlSnippet: z.string().optional(),
  focusType: z.enum(['actor', 'decision', 'flow-path', 'full']).optional(),
  focusId: z.string().optional(),
  conversationId: z.string().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
