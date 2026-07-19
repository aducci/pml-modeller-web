/**
 * POST /api/ai/resolve
 *
 * Resolve ambiguity in a PML model — fills missing fields, suggests
 * completions, and marks uncertain items with the `?` queried marker.
 *
 * Uses the shared AI client (consistent with /api/ai/propose), not
 * a duplicate Anthropic call path.
 *
 * Request body:
 *   { pmlSnippet: string, focusType?: string, focusId?: string }
 *
 * Response:
 *   { explanation: string, patches: PmlPatchOp[], confidence: 'high'|'medium'|'low', question?: ClarifyingQuestion }
 */

import { NextRequest } from 'next/server';
import { resolveAmbiguity, isAiAvailable } from '@/lib/ai/client';

export async function POST(req: NextRequest) {
  try {
    if (!isAiAvailable()) {
      return new Response(
        JSON.stringify({ error: 'AI is not configured. Set ANTHROPIC_API_KEY.', patches: [] }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const pmlSnippet = typeof body.pmlSnippet === 'string' ? body.pmlSnippet : '';
    const focusType = typeof body.focusType === 'string' ? body.focusType : 'full';
    const focusId = typeof body.focusId === 'string' ? body.focusId : undefined;

    if (!pmlSnippet.trim()) {
      return new Response(
        JSON.stringify({ error: 'PML snippet is required', patches: [] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await resolveAmbiguity(pmlSnippet, focusType, focusId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('AI resolve error:', err);
    return new Response(
      JSON.stringify({
        error: 'AI resolution failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
        patches: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
