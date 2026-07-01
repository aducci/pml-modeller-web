import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getActiveTenant } from '@/lib/activeTenant';
import { buildProjectScopeWhere } from '@/lib/projectScope';

type RouteParams = {
  params: {
    projectId: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const tenant = await getActiveTenant();
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = await db.project.findFirst({
    where: {
      id: params.projectId,
      ...buildProjectScopeWhere(tenant.user.id, tenant.organization.id, tenant.mode === 'personal'),
    },
    select: {
      id: true,
      name: true,
      pmlSource: true,
      updatedAt: true,
      organizationId: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const tenant = await getActiveTenant();
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const nextName = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : undefined;
  const nextPmlSource = typeof body?.pmlSource === 'string' ? body.pmlSource : undefined;

  if (nextName === undefined && nextPmlSource === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const existing = await db.project.findFirst({
    where: {
      id: params.projectId,
      ...buildProjectScopeWhere(tenant.user.id, tenant.organization.id, tenant.mode === 'personal'),
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const project = await db.project.update({
    where: { id: params.projectId },
    data: {
      ...(nextName !== undefined ? { name: nextName || 'Untitled process' } : {}),
      ...(nextPmlSource !== undefined ? { pmlSource: nextPmlSource } : {}),
    },
    select: {
      id: true,
      name: true,
      pmlSource: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ project });
}
