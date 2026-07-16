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
      files: {
        orderBy: { updatedAt: 'desc' },
        take: 4,
        select: { id: true, name: true },
      },
      _count: { select: { files: true } },
    },
    take: 50,
  });

  // Dashboard cards link straight to a file (the editor route is keyed by
  // file id, not project id — see /dashboard/[fileId]), so resolve each
  // project's most-recently-updated file here rather than making the client
  // do a second round trip. Also surface a few files directly so the
  // dashboard shows what's inside a project, not just its name.
  const projectsWithDefaultFile = projects.map(({ files, _count, ...project }) => ({
    ...project,
    defaultFileId: files[0]?.id ?? null,
    files,
    fileCount: _count.files,
  }));

  return NextResponse.json({
    projects: projectsWithDefaultFile,
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

  // A project is a workspace — it always starts with one file ("Main").
  // Created in the same transaction so there's never a moment where a
  // project exists with zero files (the dashboard always has a file to
  // link to, and the backfill script only needs to handle pre-existing rows).
  const file = await db.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        userId: tenant.user.id,
        organizationId: tenant.organization.id,
        name,
        pmlSource,
        createdByUserId: tenant.user.id,
        updatedByUserId: tenant.user.id,
      },
      select: { id: true },
    });

    return tx.projectFile.create({
      data: {
        projectId: project.id,
        name: 'Main',
        pmlSource,
        createdByUserId: tenant.user.id,
        updatedByUserId: tenant.user.id,
      },
      select: { id: true, name: true, updatedAt: true },
    });
  });

  return NextResponse.json({ file }, { status: 201 });
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
