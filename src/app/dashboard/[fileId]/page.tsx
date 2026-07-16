import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { PlatformHeader } from '@/components/PlatformHeader';
import { ProcessWorkspaceShell } from '@/components/ProcessWorkspaceShell';
import { db } from '@/lib/db';
import { getActiveTenant } from '@/lib/activeTenant';
import { buildProjectScopeWhere } from '@/lib/projectScope';

export default async function FilePage({ params }: { params: { fileId: string } }) {
  const tenant = await getActiveTenant();
  if (!tenant) return redirect('/auth/signin');

  const file = await db.projectFile.findFirst({
    where: {
      id: params.fileId,
      project: buildProjectScopeWhere(tenant.user.id, tenant.organization.id, tenant.mode === 'personal'),
    },
    select: {
      id: true,
      name: true,
      pmlSource: true,
      updatedAt: true,
      projectId: true,
      project: { select: { name: true } },
    },
  });

  if (!file) {
    notFound();
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50/70 page-enter">
      <PlatformHeader
        section={`${file.project.name} — ${file.name}`}
        subtitle={new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(file.updatedAt)}
        rightSlot={<Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-teal">Back to dashboard</Link>}
      />

      <div className="h-[calc(100vh-56px)]">
        <ProcessWorkspaceShell initialPml={file.pmlSource} fileId={file.id} projectId={file.projectId} />
      </div>
    </div>
  );
}
