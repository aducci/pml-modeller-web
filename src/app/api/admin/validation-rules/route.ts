import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSuperAdmin } from '@/lib/superAdmin';
import { getActiveUser } from '@/lib/activeUser';
import { DEFAULT_RULE_CONFIGS } from 'pml-core';

/**
 * Admin CRUD for the rule-shape framework's per-rule overrides (see
 * ValidationRule model + pml-core's contractGuards.ts RuleConfig). GET
 * returns every known rule code (from DEFAULT_RULE_CONFIGS, so a rule added
 * to pml-core shows up immediately, defaulted to its hardcoded config)
 * merged with any saved override. POST upserts one code's enabled flag
 * (phase one — full param editing is a later admin UI, the schema already
 * supports it via the `params` JSON column).
 */
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const overrides = await db.validationRule.findMany({
    include: { updatedByUser: { select: { name: true, email: true } } },
  });
  const overrideByCode = new Map(overrides.map((o) => [o.code, o]));

  const rules = DEFAULT_RULE_CONFIGS.map((defaultConfig) => {
    const override = overrideByCode.get(defaultConfig.code);
    return {
      code: defaultConfig.code,
      shape: defaultConfig.shape,
      category: defaultConfig.category,
      defaultConfig,
      enabled: override?.enabled ?? defaultConfig.enabled,
      isOverridden: !!override,
      updatedAt: override?.updatedAt ?? null,
      updatedByUser: override?.updatedByUser ?? null,
    };
  });

  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const code = typeof body.code === 'string' ? body.code : '';
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : undefined;

  if (!code || !DEFAULT_RULE_CONFIGS.some((c) => c.code === code)) {
    return NextResponse.json({ error: 'Unknown rule code' }, { status: 400 });
  }
  if (enabled === undefined) {
    return NextResponse.json({ error: 'enabled is required' }, { status: 400 });
  }

  const activeUser = await getActiveUser();

  const saved = await db.validationRule.upsert({
    where: { code },
    create: { code, enabled, updatedByUserId: activeUser?.id },
    update: { enabled, updatedByUserId: activeUser?.id },
  });

  return NextResponse.json({ rule: saved });
}
