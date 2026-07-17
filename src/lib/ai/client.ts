/**
 * AI Client — Anthropic Claude via Vercel AI SDK
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateObject, streamText } from 'ai';
import { aiResponseSchema, type AiResponse } from './schemas';
import { PML_SYSTEM_PROMPT, PML_CHAT_PROMPT, PML_RESOLVE_PROMPT } from './prompts';

/**
 * Create a streaming chat completion with Claude.
 * Used by the /api/ai/chat route.
 *
 * Uses PML_CHAT_PROMPT, not PML_SYSTEM_PROMPT — the latter mandates a
 * raw-JSON-only response (correct for the schema-enforced generateObject
 * call sites below) but has no schema to enforce it here, so the model
 * would otherwise stream literal JSON text as the "answer".
 */
export function createChatStream(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) {
  return streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: PML_CHAT_PROMPT,
    messages,
    temperature: 0.3,
    // PML_CHAT_PROMPT is long and identical on every call — cache it so
    // repeat turns in the same session don't re-pay for the same system prompt.
    providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
  });
}

/**
 * Structured, addressable fact from the validator (contractGuards.ts's
 * computeProcessSuggestions) — the AI reasons over these instead of
 * re-scanning raw PML for the same gaps. See
 * PML_DSL/docs/FINAL/06_AI_Modelling_Engine.md §2.C / §3 principle 7.
 */
export interface ProcessSuggestion {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

// Mirrors the "one gap per turn" doctrine (02_PML_AI_Skill.md) — the AI
// doesn't need every outstanding issue, just the handful relevant to this turn.
const MAX_SUGGESTIONS_PER_TURN = 8;

function formatSuggestions(suggestions?: ProcessSuggestion[]): string {
  if (!suggestions || suggestions.length === 0) return '';
  const lines = suggestions
    .slice(0, MAX_SUGGESTIONS_PER_TURN)
    .map((s) => `- [${s.code}]${s.nodeId ? ` node "${s.nodeId}"` : ''}${s.edgeId ? ` edge "${s.edgeId}"` : ''}: ${s.message}`)
    .join('\n');
  return `\n\nKnown issues (already found by the validator — resolve or account for these; don't re-derive them by re-reading the PML):\n${lines}`;
}

/**
 * Generate a structured AI response with patch operations.
 * Used by the /api/ai/propose route.
 */
export async function generatePatches(
  userMessage: string,
  pmlSnippet: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  suggestions?: ProcessSuggestion[]
): Promise<AiResponse> {
  const messages = [
    ...(conversationHistory ?? []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    {
      role: 'user' as const,
      content: `Current process context (PML):\n\`\`\`pml\n${pmlSnippet}\n\`\`\`${formatSuggestions(suggestions)}\n\nUser request: ${userMessage}`,
    },
  ];

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      system: PML_SYSTEM_PROMPT,
      messages,
      temperature: 0.2,
      schema: aiResponseSchema,
      // PML_SYSTEM_PROMPT is long and static across every propose call —
      // cache it so back-to-back turns in a conversation don't re-pay for it.
      providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
    });

    return object as AiResponse;
  } catch (parseErr: any) {
    console.error('AI response error:', parseErr);
    const detail = parseErr instanceof Error ? parseErr.message : JSON.stringify(parseErr);
    // Zod's validation issues (e.g. "patches: too_big") are the useful part
    // when generateObject's schema check fails — keep them in the surfaced
    // error so a future schema-cap mismatch is diagnosable without needing
    // to dump the full raw model output.
    const zodIssues = parseErr?.cause?.issues ?? parseErr?.cause?.cause?.issues;
    throw new Error(
      `Failed to generate AI patch operations: ${detail}` +
      (zodIssues ? ` | issues: ${JSON.stringify(zodIssues)}` : '')
    );
  }
}

/**
 * Resolve ambiguity in a PML model.
 * Uses structured output (generateObject) like generatePatches, not manual JSON parsing.
 */
export async function resolveAmbiguity(
  pmlSnippet: string,
  focusType: string = 'full',
  focusId?: string
): Promise<AiResponse> {
  const focusStr = focusId ? ` on '${focusId}'` : '';

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      system: PML_RESOLVE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyse this PML process and suggest completions:\n\`\`\`pml\n${pmlSnippet}\n\`\`\`\n\nFocus: ${focusType}${focusStr}`,
        },
      ],
      temperature: 0.2,
      schema: aiResponseSchema,
      providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
    });

    return object as AiResponse;
  } catch (err) {
    console.error('AI resolve error:', err);
    return {
      explanation: 'Failed to analyse model',
      patches: [],
      observations: [],
      confidence: 'low',
    };
  }
}

/**
 * Validate whether AI is available (API key configured).
 */
export function isAiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
