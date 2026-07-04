/**
 * PML AI — Response Schemas
 *
 * Zod schemas for validating AI responses.
 * Used by the AI SDK's structured output mode.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Patch operation schemas
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
    status: z.string().optional(),
  }),
  after: z.string().optional(),
});

const updateNodeSchema = z.object({
  op: z.literal('update-node'),
  nodeId: z.string().min(1),
  field: z.enum(['label', 'actor', 'scope', 'taskType', 'direction', 'eventType', 'status', 'metadata']),
  value: z.any(),
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
  }),
});

const removeEdgeSchema = z.object({
  op: z.literal('remove-edge'),
  source: z.string().min(1),
  target: z.string().min(1),
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
  removeEdgeSchema,
  updateProcessSchema,
]);

// ---------------------------------------------------------------------------
// AI response schema
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Observation schema
// ---------------------------------------------------------------------------

const observationSchema = z.object({
  severity: z.enum(['error', 'warning', 'info']),
  category: z.string().max(30).optional(),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  /** Index into the patches array (if this observation has a corresponding fix). */
  patchRef: z.number().int().min(0).optional(),
});

// ---------------------------------------------------------------------------
// AI response schema
// ---------------------------------------------------------------------------

export const aiResponseSchema = z.object({
  explanation: z.string().min(1),
  patches: z.array(pmlPatchSchema).max(20).default([]),
  observations: z.array(observationSchema).max(30).default([]),
  confidence: z.enum(['high', 'medium', 'low']),
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
