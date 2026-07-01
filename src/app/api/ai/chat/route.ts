/**
 * POST /api/ai/chat
 *
 * Streaming chat completion with Claude Sonnet.
 * Provides the AI with the current PML subgraph as context.
 *
 * Request body:
 *   { message: string, pmlSnippet?: string, focusType?: string, focusId?: string, conversationId?: string }
 *
 * Response: Server-Sent Events stream
 */

import { NextRequest } from 'next/server';
import { createChatStream, isAiAvailable } from '@/lib/ai/client';

export async function POST(req: NextRequest) {
  try {
    if (!isAiAvailable()) {
      return new Response(
        JSON.stringify({ error: 'AI is not configured. Set ANTHROPIC_API_KEY.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message : '';
    const pmlSnippet = typeof body.pmlSnippet === 'string' ? body.pmlSnippet : '';

    if (!message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build messages array — include PML context as system message
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    if (pmlSnippet) {
      messages.push({
        role: 'user',
        content: `I'm looking at this PML process:\n\`\`\`pml\n${pmlSnippet}\n\`\`\``,
      });
    }

    messages.push({ role: 'user', content: message });

    const result = createChatStream(messages);

    // Return the streaming response
  return result.toTextStreamResponse();
  } catch (err) {
    console.error('AI chat error:', err);
    return new Response(
      JSON.stringify({
        error: 'AI request failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
