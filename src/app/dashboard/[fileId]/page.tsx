import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { PlatformHeader } from '@/components/PlatformHeader';
import { ProcessWorkspaceShell } from '@/components/ProcessWorkspaceShell';
import { db } from '@/lib/db';
import { getActiveTenant } from '@/lib/activeTenant';
import { buildProjectScopeWhere } from '@/lib/projectScope';

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const tenant = await getActiveTenant();
  if (!tenant) return redirect('/auth/signin');

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
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50/70 page-enter">
      <PlatformHeader
        section={`Project: ${project.name}`}
        subtitle={new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(project.updatedAt)}
        rightSlot={<Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-teal">Back to dashboard</Link>}
      />

      <div className="h-[calc(100vh-56px)]">
        <ProcessWorkspaceShell initialPml={project.pmlSource} />
      </div>
    </div>
  );
}
