import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">PML Modeller</h1>
          <span className="text-sm text-gray-500">/ Settings</span>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">Sign out</button>
        </form>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-2 text-gray-600">Account and billing preferences.</p>
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Billing</h3>
            <p className="mt-1 text-sm text-gray-600">Manage your subscription and invoices.</p>
            <form action="/api/stripe/portal" method="POST" className="mt-4">
              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
              >
                Open Customer Portal
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
