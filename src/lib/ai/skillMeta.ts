/**
 * Skill display metadata (key, label, description) — split out from
 * skillPrompts.ts so client components (SkillsPanel.tsx) can import labels
 * without pulling in skillPrompts.ts's `db` (Prisma) import, which must
 * never end up in a browser bundle. This is the one place a skill's
 * display name/description is defined; skillPrompts.ts re-exports SKILL_KEYS
 * from here and adds the server-only fallbackContent/DB-backed pieces.
 */
export const SKILL_KEYS = {
  systemPrompt: 'pml-system-prompt',
  chatPrompt: 'pml-chat-prompt',
} as const;

export type SkillKey = (typeof SKILL_KEYS)[keyof typeof SKILL_KEYS];

export interface SkillDisplayMeta {
  key: SkillKey;
  label: string;
  description: string;
}

export const SKILL_DISPLAY_META: Record<SkillKey, SkillDisplayMeta> = {
  [SKILL_KEYS.systemPrompt]: {
    key: SKILL_KEYS.systemPrompt,
    label: 'PML System Prompt',
    description: 'Structured JSON-mode prompt used by /api/ai/propose (patch proposals, findings, clarifying questions).',
  },
  [SKILL_KEYS.chatPrompt]: {
    key: SKILL_KEYS.chatPrompt,
    label: 'PML Chat Prompt',
    description: 'Free-text prompt used by /api/ai/chat (conversational Q&A, no patch output).',
  },
};
