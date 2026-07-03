/**
 * POST /api/ai/resolve
 *
 * Resolve ambiguity in a PML model — fills missing fields, suggests
 * completions, and marks uncertain items with status=queried.
 *
 * Request body:
 *   { pmlSnippet: string, focusType?: string, focusId?: string }
 *
 * Response:
 *   { patches: PmlPatchOp[], observations: string[], confidence: 'high'|'medium'|'low' }
 */

import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { PML_RESOLVE_PROMPT } from '@/lib/ai/prompts';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI is not configured. Set ANTHROPIC_API_KEY.', patches: [], observations: [] }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const pmlSnippet = typeof body.pmlSnippet === 'string' ? body.pmlSnippet : '';
    const focusType = typeof body.focusType === 'string' ? body.focusType : 'full';
    const focusId = typeof body.focusId === 'string' ? body.focusId : undefined;

    if (!pmlSnippet.trim()) {
      return new Response(
        JSON.stringify({ error: 'PML snippet is required', patches: [], observations: [] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      system: PML_RESOLVE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyse this PML process and suggest completions:\n\`\`\`pml\n${pmlSnippet}\n\`\`\`\n\nFocus: ${focusType}${focusId ? ` on '${focusId}'` : ''}`,
        },
      ],
      temperature: 0.2,
    });

    const text = result.text.trim();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // If not valid JSON, wrap the text as an observation
      return new Response(
        JSON.stringify({
          patches: [],
          observations: [text],
          confidence: 'low',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        patches: parsed.patches ?? [],
        observations: parsed.observations ?? [],
        confidence: parsed.confidence ?? 'medium',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('AI resolve error:', err);
    return new Response(
      JSON.stringify({
        error: 'AI resolution failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
        patches: [],
        observations: [],
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
