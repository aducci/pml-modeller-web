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

import { parsePml, computeProcessSuggestions, DEFAULT_RULE_CONFIGS, type ProcessDiagnostic, type RuleConfig } from 'pml-core';

/** A ProcessDiagnostic with app-layer user-facing copy attached (see
 *  lib/ai/findingCopy.ts) — title/summary live here, not on ProcessDiagnostic
 *  itself, since pml-core's diagnostic shape is an engine concern and this
 *  wording is presentational, admin-editable copy layered on top of it. */
export interface FindingWithCopy extends ProcessDiagnostic {
  title?: string;
  summary?: string;
}

/** configs defaults to pml-core's own DEFAULT_RULE_CONFIGS — passing the
 *  admin-overridden set (see /api/validation-rules) is opt-in per caller,
 *  same as computeProcessSuggestions() itself defaulting when omitted. */
export function findUnresolvedIssues(pmlSnippet: string, configs: RuleConfig[] = DEFAULT_RULE_CONFIGS): ProcessDiagnostic[] {
  if (!pmlSnippet?.trim()) return [];
  try {
    const { graph } = parsePml(pmlSnippet, { validationMode: 'loose' });
    if (!graph) return [];
    return computeProcessSuggestions(graph, configs);
  } catch {
    // A parse failure here shouldn't crash whatever UI is asking for
    // findings — same "fail soft" precedent as startInterview()'s own
    // try/catch around this exact call.
    return [];
  }
}

/** Merges DB-stored { code -> { enabled, params } } overrides onto
 *  DEFAULT_RULE_CONFIGS — a rule with no override row uses its hardcoded
 *  default entirely; a rule with a stored `enabled: false` is dropped from
 *  the effective set (still a valid RuleConfig, just filtered before this
 *  returns, so callers never need to check `.enabled` themselves); a rule
 *  with stored `params` has those fields shallow-merged over the default,
 *  ready for a future admin UI that edits individual parameters, not just
 *  on/off. */
export function withRuleOverrides(
  overridesByCode: Record<string, { enabled: boolean; params?: Partial<RuleConfig> }> | null
): RuleConfig[] {
  if (!overridesByCode) return DEFAULT_RULE_CONFIGS;
  return DEFAULT_RULE_CONFIGS
    .map((config) => {
      const override = overridesByCode[config.code];
      if (!override) return config;
      return { ...config, ...override.params, enabled: override.enabled } as RuleConfig;
    })
    .filter((config) => config.enabled);
}

/** Merges fetched {code: {title, summary}} copy onto each finding — falls
 *  back to leaving title/summary undefined (FindingCard then falls back
 *  further to the raw `message`) if the copy map hasn't loaded yet or is
 *  missing an entry for a given code. */
export function withFindingCopy(
  findings: ProcessDiagnostic[],
  copyByCode: Record<string, { title: string; summary: string }> | null
): FindingWithCopy[] {
  if (!copyByCode) return findings;
  return findings.map((f) => {
    const copy = copyByCode[f.code];
    return copy ? { ...f, title: copy.title, summary: copy.summary } : f;
  });
}
