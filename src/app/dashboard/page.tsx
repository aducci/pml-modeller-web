import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) return redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">PML Modeller</h1>
          <span className="text-sm text-gray-500">/ Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/api/stripe/portal" className="text-sm text-gray-600 hover:text-gray-900">Billing</a>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900">Your diagrams</h2>
        <p className="mt-2 text-gray-600">Select a project to edit, or create a new one.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <a href="#" className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 hover:border-gray-400">
            + New project
          </a>
          <div className="rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            demo-diagram.pml
          </div>
        </div>
      </main>
    </div>
  );
}
