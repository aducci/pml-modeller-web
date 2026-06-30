import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const session = await auth();
  if (!session?.user) return redirect('/auth/signin');

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      {/* Top bar with project name and save status */}
      <div className="flex h-10 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="text-sm font-semibold text-gray-900">
          Project: {params.projectId}
        </div>
        <div className="text-xs text-gray-500">Saved</div>
      </div>

      {/* Editor / Canvas workspace placeholder */}
      <div className="h-[calc(100vh-40px)]">
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
