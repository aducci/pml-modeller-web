/**
 * AI Client — Anthropic Claude via Vercel AI SDK
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText, Output } from 'ai';
import { aiResponseSchema, type AiResponse } from './schemas';
import { PML_SYSTEM_PROMPT } from './prompts';

/**
 * Create a streaming chat completion with Claude.
 * Used by the /api/ai/chat route.
 */
export function createChatStream(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) {
  return streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: PML_SYSTEM_PROMPT,
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

  // Use structured output + JSON fallback for reliable patch extraction
  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      system: `${PML_SYSTEM_PROMPT}\n\nYou must respond with a valid JSON object matching the schema defined above.`,
      messages,
      temperature: 0.2,
    });

    const text = result.text.trim();
    const parsed = JSON.parse(text) as AiResponse;
    return aiResponseSchema.parse(parsed);
  } catch (parseErr) {
    console.error('AI response parse error:', parseErr);
    throw new Error('Failed to parse AI response as valid patch operations');
  }
}

/**
 * Validate whether AI is available (API key configured).
 */
export function isAiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
