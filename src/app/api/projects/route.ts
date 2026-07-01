import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getActiveTenant } from '@/lib/activeTenant';
import { buildProjectScopeWhere } from '@/lib/projectScope';

const STARTER_PML = `@process L3 "New process"

event start inbound
event end outbound

actor Team
  task step1 as "define first step"

flow
start -> step1 -> end`;

export async function GET(request: NextRequest) {
  const tenant = await getActiveTenant({
    preferredOrganizationId: request.nextUrl.searchParams.get('orgId'),
  });

  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await db.project.findMany({
    where: buildProjectScopeWhere(tenant.user.id, tenant.organization.id, tenant.mode === 'personal'),
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
    take: 50,
  });

  return NextResponse.json({
    projects,
    tenant: {
      id: tenant.organization.id,
      name: tenant.organization.name,
      mode: tenant.mode,
      role: tenant.role,
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const requestedOrgId =
    typeof body?.orgId === 'string' ? body.orgId.trim() : request.nextUrl.searchParams.get('orgId');

  const tenant = await getActiveTenant({
    preferredOrganizationId: requestedOrgId,
  });

  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const proposedName = String(body?.name ?? '').trim();
  const template = String(body?.template ?? 'blank');
  const name = proposedName.length > 0 ? proposedName.slice(0, 120) : 'Untitled process';

  const pmlSource = buildTemplateSource(template, name);

  const project = await db.project.create({
    data: {
      userId: tenant.user.id,
      organizationId: tenant.organization.id,
      name,
      pmlSource,
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
}

function buildTemplateSource(template: string, name: string) {
  const safeName = name.replace(/"/g, '');

  if (template === 'onboarding') {
    return `@process L3 "${safeName}"

event start as "new customer request" inbound
event end as "customer onboarded" outbound

actor Sales
  task qualify as "qualify request"
actor Operations
  task setup as "setup account"
  task verify as "verify readiness"

flow
start -> qualify -> setup -> verify -> end`;
  }

  if (template === 'incident') {
    return `@process L3 "${safeName}"

event start as "incident raised" inbound
event end as "incident closed" outbound

actor ServiceDesk
  task triage as "triage incident"
actor Engineering
  task resolve as "resolve issue"
  task validate as "validate fix"

flow
start -> triage -> resolve -> validate -> end`;
  }

  return STARTER_PML.replace('"New process"', `"${safeName}"`);
}
