import { db } from '@/lib/db';
import { PML_SYSTEM_PROMPT, PML_CHAT_PROMPT } from './prompts';
import { SKILL_KEYS, SKILL_DISPLAY_META, type SkillKey } from './skillMeta';

export { SKILL_KEYS, SKILL_DISPLAY_META, type SkillKey };

/**
 * Structured, admin-editable "skill" prompt keys — each maps to a
 * PromptSkill row (see prisma/schema.prisma) whose current version's
 * content is what actually gets sent to the model. PML_SYSTEM_PROMPT/
 * PML_CHAT_PROMPT in prompts.ts are kept as the HARD-CODED FALLBACK
 * defaults, not deleted — resolveSkillPrompt() falls back to them if the
 * DB row is missing or the database is unreachable, so a DB hiccup
 * degrades to "today's behavior" rather than breaking every AI call.
 *
 * Display metadata (key/label/description) lives in skillMeta.ts, a module
 * with no server-only imports, so client components (SkillsPanel.tsx) can
 * import labels directly without pulling in this module's `db` (Prisma)
 * dependency into a browser bundle. SKILL_REGISTRY here adds the one
 * server-only piece (fallbackContent) on top of that shared display meta —
 * previously SKILL_KEYS/FALLBACK_CONTENT were separately duplicated in
 * /api/admin/skills/route.ts, and KEY_LABEL/SKILL_DESCRIPTIONS were split
 * across that route and SkillsPanel.tsx — four sources of truth for one
 * concept. Adding a new skill now means editing skillMeta.ts (+ this file's
 * fallbackContent mapping), nothing else.
 */
export interface SkillMeta {
  key: SkillKey;
  label: string;
  description: string;
  fallbackContent: string;
}

export const SKILL_REGISTRY: Record<SkillKey, SkillMeta> = {
  [SKILL_KEYS.systemPrompt]: { ...SKILL_DISPLAY_META[SKILL_KEYS.systemPrompt], fallbackContent: PML_SYSTEM_PROMPT },
  [SKILL_KEYS.chatPrompt]: { ...SKILL_DISPLAY_META[SKILL_KEYS.chatPrompt], fallbackContent: PML_CHAT_PROMPT },
};

const FALLBACK_CONTENT: Record<SkillKey, string> = {
  [SKILL_KEYS.systemPrompt]: SKILL_REGISTRY[SKILL_KEYS.systemPrompt].fallbackContent,
  [SKILL_KEYS.chatPrompt]: SKILL_REGISTRY[SKILL_KEYS.chatPrompt].fallbackContent,
};

// Short in-process cache so every /api/ai/propose or /api/ai/chat call
// doesn't round-trip the DB for prompt content that changes rarely (only
// when someone edits it in the admin Skills tab). A serverless instance's
// cache clears on cold start, and any instance picks up an edit within
// CACHE_TTL_MS of it happening — acceptable staleness for "I just edited a
// prompt in admin," not a correctness issue.
const CACHE_TTL_MS = 30_000;
const cache = new Map<SkillKey, { content: string; expiresAt: number }>();

/**
 * Resolves a skill key to its current live content — the version most
 * recently created for that key's global (organizationId: null) PromptSkill
 * row. Falls back to the hardcoded default in prompts.ts if no row/version
 * exists yet (e.g. before the seed script has run) or if the query throws.
 */
export async function resolveSkillPrompt(key: SkillKey): Promise<string> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.content;

  try {
    const skill = await db.promptSkill.findFirst({
      where: { key, organizationId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const content = skill?.versions[0]?.content ?? FALLBACK_CONTENT[key];
    cache.set(key, { content, expiresAt: Date.now() + CACHE_TTL_MS });
    return content;
  } catch (err) {
    console.error(`resolveSkillPrompt(${key}) failed, using hardcoded fallback:`, err);
    return FALLBACK_CONTENT[key];
  }
}

/** Called by the Skills admin tab right after a save, so the new content is
 *  live immediately instead of waiting out CACHE_TTL_MS. */
export function invalidateSkillPromptCache(key?: SkillKey): void {
  if (key) cache.delete(key);
  else cache.clear();
}
