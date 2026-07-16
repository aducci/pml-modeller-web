/**
 * POST /api/ai/propose
 *
 * Generate structured PML patch proposals from a natural language request.
 * Uses Claude Sonnet with structured output mode.
 *
 * When focusType + focusId are provided, the PML snippet is scoped to a
 * subgraph window using the Graph Context Engine (extractGraphWindow +
 * serializeWindow). The AI receives a focused slice with boundary markers,
 * not raw text. This gives the AI meaningful context while keeping token
 * counts low and preventing hallucination of structure outside the window.
 *
 * Request body:
 *   { message: string, pmlSnippet: string, focusType?: string, focusId?: string,
 *     conversationHistory?: Array<{ role: 'user'|'assistant', content: string }> }
 *
 * Response:
 *   { explanation: string, patches: PmlPatchOp[], confidence: 'high'|'medium'|'low' }
 */

import { NextRequest } from 'next/server';
import { parsePml, extractGraphWindow, serializeWindow } from 'pml-core';
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
    let pmlSnippet = typeof body.pmlSnippet === 'string' ? body.pmlSnippet : '';
    const focusType: string | undefined = typeof body.focusType === 'string' ? body.focusType : undefined;
    const focusId: string | undefined = typeof body.focusId === 'string' ? body.focusId : undefined;
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> | undefined =
      Array.isArray(body.conversationHistory)
        ? body.conversationHistory.filter(
            (m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
          )
        : undefined;

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

    // ── Graph context windowing ──────────────────────────────────────
    // If focusType + focusId are provided, scope the PML snippet to a
    // subgraph window so the AI reasons over a focused slice.
    if (focusType && focusId && focusType !== 'full') {
      try {
        // Parse the snippet into a normalized graph. pmlToNormalizedGraph
        // expects an already-parsed PmlProcessModel, not raw text — calling
        // it directly on the string silently produced an empty graph (no
        // error, no warning), so windowing never actually scoped anything.
        const { graph } = parsePml(pmlSnippet, { validationMode: 'loose' });
        // Extract a focused subgraph window
        const window = extractGraphWindow(graph, {
          focusType: focusType as 'actor' | 'decision' | 'flow-path' | 'full',
          focusId,
          maxDepth: 2,
          includeMetadata: false,
          includeEdgeDetails: true,
        });
        // Serialize the window back to PML text with boundary markers
        pmlSnippet = serializeWindow(window, {
          includeMetadata: false,
          maxLines: 0,
          showTrimNote: true,
          includeHeader: true,
        });
        console.log(`Context windowed: ${focusType}='${focusId}' → ${window.nodeCount} nodes, ${window.edgeCount} edges`);
      } catch (err) {
        console.warn('Graph windowing failed, falling back to full snippet:', err);
        // Fall through with the original pmlSnippet
      }
    }

    const result = await generatePatches(message, pmlSnippet, conversationHistory);

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
