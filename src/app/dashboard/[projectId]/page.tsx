import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { PlatformHeader } from '@/components/PlatformHeader';

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const session = await auth();
  const cookieStore = await cookies();
  const hasDevMagicAccess = cookieStore.get('pml-dev-magic-auth')?.value === '1';
  if (!session?.user && !hasDevMagicAccess) return redirect('/auth/signin');

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50/70 page-enter">
      <PlatformHeader
        section={`Project: ${params.projectId}`}
        subtitle="Saved"
        rightSlot={<Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-teal">Back to dashboard</Link>}
      />

      {/* Editor / Canvas workspace placeholder */}
      <div className="h-[calc(100vh-56px)]">
        <div className="flex h-full items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">Editor placeholder</p>
            <p className="mt-1 text-sm">Import ProcessController + views from pml-core here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
