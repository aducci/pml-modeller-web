import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getActiveUser } from '@/lib/activeUser';
import { FINDING_COPY_DEFAULTS } from '@/lib/ai/findingCopy';

/**
 * Read-only runtime lookup for Finding title/summary wording — any signed-in
 * user modelling a process needs this (not just super-admins, unlike
 * /api/admin/finding-copy which is the edit surface). Returns a flat
 * code -> {title, summary} map, DB override merged over the hardcoded
 * default, for FindingCard to attach to each diagnostic client-side.
 */
export async function GET() {
  const user = await getActiveUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const overrides = await db.findingCopy.findMany();
  const overrideByCode = new Map(overrides.map((o) => [o.code, o]));

  const copy: Record<string, { title: string; summary: string }> = {};
  for (const [code, fallback] of Object.entries(FINDING_COPY_DEFAULTS)) {
    const override = overrideByCode.get(code);
    copy[code] = {
      title: override?.title ?? fallback.title,
      summary: override?.summary ?? fallback.summary,
    };
  }

  return NextResponse.json({ copy });
}
