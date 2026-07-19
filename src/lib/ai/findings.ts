/**
 * findUnresolvedIssues — a standalone, UI-triggerable capability wrapping
 * pml-core's computeProcessSuggestions(), independent of any AI turn.
 *
 * This is the same call ConversationContext.tsx's startInterview() already
 * makes internally (coverage-driven interview lookup) — exposed here as a
 * reusable function so E.2's FindingCard UI can fetch findings directly,
 * without going through a chat turn at all. Satisfies
 * docs/FINAL/11_AI_Conversational_Layer_Discussion.md §4.5/§5.3: "the UI can
 * call the exact same function independent of any AI turn."
 *
 * docs/FINAL/13_Phase_E_Findings_Drive_Canvas_Plan.md E.2, step 4.
 */

import { parsePml, computeProcessSuggestions, type ProcessDiagnostic } from 'pml-core';

export function findUnresolvedIssues(pmlSnippet: string): ProcessDiagnostic[] {
  if (!pmlSnippet?.trim()) return [];
  try {
    const { graph } = parsePml(pmlSnippet, { validationMode: 'loose' });
    if (!graph) return [];
    return computeProcessSuggestions(graph);
  } catch {
    // A parse failure here shouldn't crash whatever UI is asking for
    // findings — same "fail soft" precedent as startInterview()'s own
    // try/catch around this exact call.
    return [];
  }
}
