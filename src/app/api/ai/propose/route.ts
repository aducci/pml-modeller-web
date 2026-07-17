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
 * Also computes contractGuards.ts's computeProcessSuggestions() on whichever
 * graph is in scope (windowed or full) and passes it to generatePatches —
 * the AI reasons over the validator's structured findings instead of
 * re-scanning raw PML for the same gaps.
 *
 * Request body:
 *   { message: string, pmlSnippet: string, focusType?: string, focusId?: string,
 *     conversationHistory?: Array<{ role: 'user'|'assistant', content: string }> }
 *
 * Response:
 *   { explanation: string, patches: PmlPatchOp[], confidence: 'high'|'medium'|'low' }
 */

import { NextRequest } from 'next/server';
import { parsePml, extractGraphWindow, serializeWindow, computeProcessSuggestions } from 'pml-core';
import { generatePatches, isAiAvailable, type ProcessSuggestion } from '@/lib/ai/client';

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

    // ── Graph context windowing + validator suggestions ──────────────
    // Parse once, reused for both: (a) if focusType + focusId are provided,
    // scope the PML snippet to a subgraph window so the AI reasons over a
    // focused slice; (b) always compute the validator's structured
    // "suggestion" facts (contractGuards.ts) for whichever graph ends up in
    // scope — windowed if focus was given, full otherwise — so the AI gets
    // known issues as data instead of re-deriving them from raw text (Phase
    // 2, docs/FINAL/06_AI_Modelling_Engine.md §2.C).
    let suggestions: ProcessSuggestion[] | undefined;
    try {
      // pmlToNormalizedGraph expects an already-parsed PmlProcessModel, not
      // raw text — calling it directly on the string silently produced an
      // empty graph (no error, no warning), so this must go through parsePml.
      const { graph } = parsePml(pmlSnippet, { validationMode: 'loose' });
      let scopedGraph = graph;

      if (focusType && focusId && focusType !== 'full') {
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
        scopedGraph = window.graph;
        console.log(`Context windowed: ${focusType}='${focusId}' → ${window.nodeCount} nodes, ${window.edgeCount} edges`);
      }

      suggestions = computeProcessSuggestions(scopedGraph).map((s) => ({
        code: s.code,
        message: s.message,
        nodeId: s.data?.nodeId as string | undefined,
        edgeId: s.data?.edgeId as string | undefined,
      }));
    } catch (err) {
      console.warn('Graph windowing/suggestions failed, falling back to raw snippet:', err);
      // Fall through with the original pmlSnippet and no suggestions
    }

    const result = await generatePatches(message, pmlSnippet, conversationHistory, suggestions);

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
