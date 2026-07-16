import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getActiveTenant } from '@/lib/activeTenant';
import { buildProjectScopeWhere } from '@/lib/projectScope';

type RouteParams = {
  params: {
    projectId: string;
  };
};

const STARTER_FILE_PML = `@process L3 "New process"

event start inbound
event end outbound

actor Team
  task step1 as "define first step"

flow
start -> step1 -> end`;

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const tenant = await getActiveTenant();
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = await db.project.findFirst({
    where: {
      id: params.projectId,
      ...buildProjectScopeWhere(tenant.user.id, tenant.organization.id, tenant.mode === 'personal'),
    },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const files = await db.projectFile.findMany({
    where: { projectId: project.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, updatedAt: true },
  });

  return NextResponse.json({ files });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const tenant = await getActiveTenant();
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = await db.project.findFirst({
    where: {
      id: params.projectId,
      ...buildProjectScopeWhere(tenant.user.id, tenant.organization.id, tenant.mode === 'personal'),
    },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const proposedName = String(body?.name ?? '').trim();
  const name = proposedName.length > 0 ? proposedName.slice(0, 120) : 'Untitled file';

  const file = await db.projectFile.create({
    data: {
      projectId: project.id,
      name,
      pmlSource: STARTER_FILE_PML.replace('"New process"', `"${name.replace(/"/g, '')}"`),
      createdByUserId: tenant.user.id,
      updatedByUserId: tenant.user.id,
    },
    select: { id: true, name: true, updatedAt: true },
  });

  return NextResponse.json({ file }, { status: 201 });
}
