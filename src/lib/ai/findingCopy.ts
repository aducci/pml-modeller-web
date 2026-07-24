/**
 * Hardcoded default title/summary per Finding code — used as the seed value
 * and the fallback when no admin-edited FindingCopy row exists for a code
 * yet (same "seed from code, DB overrides" shape as skillPrompts.ts's
 * SKILL_REGISTRY). `title` is a short noun phrase with no node id or PML
 * jargon; `summary` is one plain sentence a non-technical user can act on.
 * The rule's own `message` field (contractGuards.ts) is untouched — it still
 * carries the full technical explanation used as AI context and shown to
 * power users behind FindingCard's "Details" disclosure.
 */
export interface FindingCopyEntry {
  title: string;
  summary: string;
}

export const FINDING_COPY_DEFAULTS: Record<string, FindingCopyEntry> = {
  OUTBOUND_HAS_OUTGOING: {
    title: 'Dead-end step continues',
    summary: "This is meant to be an ending point, but something happens after it.",
  },
  INBOUND_HAS_INCOMING: {
    title: 'Starting step has something before it',
    summary: 'This is meant to be where the process begins, but something leads into it.',
  },
  IMPLICIT_PARALLEL_FORK: {
    title: 'Unclear branching',
    summary: "This step splits into multiple paths, but it isn't marked as a decision point.",
  },
  DECISION_SINGLE_OUTCOME: {
    title: 'Decision with only one option',
    summary: 'This decision only has one possible outcome — another path may be missing.',
  },
  TASK_NO_ACTOR: {
    title: 'Missing actor',
    summary: "No one is assigned to do this step.",
  },
  NODE_ORPHANED: {
    title: 'Disconnected step',
    summary: "This step isn't linked to anything else in the process.",
  },
  CROSS_ACTOR_EDGE_UNTAGGED: {
    title: 'Unclear handoff',
    summary: 'Work passes between two people or teams here, but the handoff is not labeled.',
  },
};

export function getFindingCopyDefault(code: string): FindingCopyEntry | undefined {
  return FINDING_COPY_DEFAULTS[code];
}
