import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/superAdmin';
import { getActiveUser } from '@/lib/activeUser';
import { FINDING_COPY_DEFAULTS } from '@/lib/ai/findingCopy';

/**
 * Admin CRUD for Finding title/summary wording (see FindingCopy model —
 * mirrors admin/skills/route.ts's shape for PromptSkill, but for the
 * shorter two-field, no-version-history case). GET returns every known
 * code (from FINDING_COPY_DEFAULTS, so new codes show up with their
 * hardcoded default before anyone's edited them) merged with any saved
 * override. POST upserts one code's title/summary.
 */
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const overrides = await db.findingCopy.findMany({
    include: { updatedByUser: { select: { name: true, email: true } } },
  });
  const overrideByCode = new Map(overrides.map((o) => [o.code, o]));

  const entries = Object.entries(FINDING_COPY_DEFAULTS).map(([code, fallback]) => {
    const override = overrideByCode.get(code);
    return {
      code,
      title: override?.title ?? fallback.title,
      summary: override?.summary ?? fallback.summary,
      isOverridden: !!override,
      updatedAt: override?.updatedAt ?? null,
      updatedByUser: override?.updatedByUser ?? null,
    };
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const code = typeof body.code === 'string' ? body.code : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';

  if (!code || !(code in FINDING_COPY_DEFAULTS)) {
    return NextResponse.json({ error: 'Unknown finding code' }, { status: 400 });
  }
  if (!title || !summary) {
    return NextResponse.json({ error: 'Title and summary are required' }, { status: 400 });
  }

  const activeUser = await getActiveUser();

  const saved = await db.findingCopy.upsert({
    where: { code },
    create: { code, title, summary, updatedByUserId: activeUser?.id },
    update: { title, summary, updatedByUserId: activeUser?.id },
  });

  return NextResponse.json({ entry: saved });
}
