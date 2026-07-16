import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getActiveTenant } from '@/lib/activeTenant';
import { buildProjectScopeWhere } from '@/lib/projectScope';

type RouteParams = {
  params: {
    fileId: string;
  };
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const tenant = await getActiveTenant();
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const file = await db.projectFile.findFirst({
    where: {
      id: params.fileId,
      project: buildProjectScopeWhere(tenant.user.id, tenant.organization.id, tenant.mode === 'personal'),
    },
    select: { id: true, name: true, pmlSource: true, updatedAt: true, projectId: true },
  });

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return NextResponse.json({ file });
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

  const existing = await db.projectFile.findFirst({
    where: {
      id: params.fileId,
      project: buildProjectScopeWhere(tenant.user.id, tenant.organization.id, tenant.mode === 'personal'),
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const file = await db.projectFile.update({
    where: { id: params.fileId },
    data: {
      ...(nextName !== undefined ? { name: nextName || 'Untitled file' } : {}),
      ...(nextPmlSource !== undefined ? { pmlSource: nextPmlSource } : {}),
      updatedByUserId: tenant.user.id,
    },
    select: { id: true, name: true, pmlSource: true, updatedAt: true },
  });

  return NextResponse.json({ file });
}
