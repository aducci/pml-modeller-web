import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/superAdmin';
import { invalidateSkillPromptCache, type SkillKey } from '@/lib/ai/skillPrompts';
import { getActiveUser } from '@/lib/activeUser';

/**
 * "Revert to version X" — creates a NEW version carrying X's content,
 * rather than deleting anything after X. History stays append-only and
 * fully auditable (you can always see that a revert happened and when),
 * matching how the rest of this app treats versioned data.
 */
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const versionId = typeof body.versionId === 'string' ? body.versionId : '';
  if (!versionId) {
    return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
  }

  const target = await db.promptSkillVersion.findUnique({
    where: { id: versionId },
    include: { skill: true },
  });
  if (!target || target.skill.organizationId !== null) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  const activeUser = await getActiveUser();
  const restored = await db.promptSkillVersion.create({
    data: {
      skillId: target.skillId,
      content: target.content,
      label: `Reverted to ${new Date(target.createdAt).toLocaleString()}`,
      createdByUserId: activeUser?.id,
    },
  });

  invalidateSkillPromptCache(target.skill.key as SkillKey);

  return NextResponse.json({ version: restored });
}
