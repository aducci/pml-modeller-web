import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getActiveUser } from '@/lib/activeUser';
import { DEFAULT_RULE_CONFIGS } from 'pml-core';

/**
 * Read-only runtime lookup for validation-rule overrides — any signed-in
 * user modelling a process needs this (not just super-admins, unlike
 * /api/admin/validation-rules which is the edit surface). Returns a flat
 * code -> { enabled } map; a rule with no row here uses its hardcoded
 * default entirely (see findings.ts's withRuleOverrides).
 */
export async function GET() {
  const user = await getActiveUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const overrides = await db.validationRule.findMany();
  const overrideByCode = new Map(overrides.map((o) => [o.code, o]));

  const rules: Record<string, { enabled: boolean; params?: unknown }> = {};
  for (const defaultConfig of DEFAULT_RULE_CONFIGS) {
    const override = overrideByCode.get(defaultConfig.code);
    rules[defaultConfig.code] = {
      enabled: override?.enabled ?? defaultConfig.enabled,
      params: (override?.params as Record<string, unknown> | undefined) ?? undefined,
    };
  }

  return NextResponse.json({ rules });
}
