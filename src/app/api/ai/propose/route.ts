/**
 * POST /api/ai/propose
 *
 * Generate structured PML patch proposals from a natural language request.
 * Uses Claude Sonnet with structured output mode.
 *
 * Request body:
 *   { message: string, pmlSnippet: string, focusType?: string, focusId?: string }
 *
 * Response:
 *   { explanation: string, patches: PmlPatchOp[], confidence: 'high'|'medium'|'low' }
 */

import { NextRequest } from 'next/server';
import { generatePatches, isAiAvailable } from '@/lib/ai/client';

export async function POST(req: NextRequest) {
  try {
    if (!isAiAvailable()) {
      return new Response(
        JSON.stringify({ error: 'AI is not configured. Set ANTHROPIC_API_KEY.', patches: [] }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message : '';
    const pmlSnippet = typeof body.pmlSnippet === 'string' ? body.pmlSnippet : '';

    if (!message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required', patches: [] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!pmlSnippet.trim()) {
      return new Response(
        JSON.stringify({ error: 'PML snippet context is required', patches: [] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await generatePatches(message, pmlSnippet);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('AI propose error:', err);
    return new Response(
      JSON.stringify({
        error: 'AI proposal failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
        patches: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
