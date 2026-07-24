import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/superAdmin';
import { getActiveUser } from '@/lib/activeUser';
import { SKILL_KEYS, SKILL_REGISTRY, invalidateSkillPromptCache } from '@/lib/ai/skillPrompts';

/**
 * Lazily creates a PromptSkill + its first PromptSkillVersion (seeded from
 * prompts.ts's hardcoded fallback) the first time a given global skill key
 * is requested and no row exists yet — see the design discussion in
 * skillPrompts.ts. Idempotent: a second call finds the existing row and
 * does nothing.
 */
async function ensureSkillSeeded(key: string) {
  const existing = await db.promptSkill.findFirst({ where: { key, organizationId: null } });
  if (existing) return;

  const meta = SKILL_REGISTRY[key as keyof typeof SKILL_REGISTRY];
  await db.promptSkill.create({
    data: {
      key,
      organizationId: null,
      description: meta?.description,
      versions: {
        create: {
          content: meta?.fallbackContent ?? '',
          label: 'Initial (from prompts.ts)',
        },
      },
    },
  });
}

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  for (const key of Object.values(SKILL_KEYS)) {
    await ensureSkillSeeded(key);
  }

  const skills = await db.promptSkill.findMany({
    where: { organizationId: null },
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
        include: { createdByUser: { select: { name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({ skills });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const key = typeof body.key === 'string' ? body.key : '';
  const content = typeof body.content === 'string' ? body.content : '';
  const label = typeof body.label === 'string' ? body.label : undefined;

  if (!key || !Object.values(SKILL_KEYS).includes(key as any)) {
    return NextResponse.json({ error: 'Unknown skill key' }, { status: 400 });
  }
  if (!content.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  await ensureSkillSeeded(key);
  const skill = await db.promptSkill.findFirstOrThrow({ where: { key, organizationId: null } });

  // getActiveUser() rather than auth() directly — resolves a magic-link
  // session too, not just a real NextAuth one (see superAdmin.ts).
  const activeUser = await getActiveUser();

  const version = await db.promptSkillVersion.create({
    data: {
      skillId: skill.id,
      content,
      label,
      createdByUserId: activeUser?.id,
    },
  });

  invalidateSkillPromptCache(key as any);

  return NextResponse.json({ version });
}
