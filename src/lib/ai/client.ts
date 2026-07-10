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
  });
}

/**
 * Generate a structured AI response with patch operations.
 * Used by the /api/ai/propose route.
 */
export async function generatePatches(
  userMessage: string,
  pmlSnippet: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<AiResponse> {
  const messages = [
    ...(conversationHistory ?? []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    {
      role: 'user' as const,
      content: `Current process context (PML):\n\`\`\`pml\n${pmlSnippet}\n\`\`\`\n\nUser request: ${userMessage}`,
    },
  ];

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-6'),
      system: PML_SYSTEM_PROMPT,
      messages,
      temperature: 0.2,
      schema: aiResponseSchema,
    });

    return object as AiResponse;
  } catch (parseErr) {
    console.error('AI response error:', parseErr);
    throw new Error('Failed to generate AI patch operations');
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
