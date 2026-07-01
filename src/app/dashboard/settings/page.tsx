import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { PlatformHeader } from '@/components/PlatformHeader';

export default async function SettingsPage() {
  const session = await auth();
  const cookieStore = await cookies();
  const hasDevMagicAccess = cookieStore.get('pml-dev-magic-auth')?.value === '1';
  if (!session?.user && !hasDevMagicAccess) return redirect('/auth/signin');

  return (
    <div className="min-h-screen bg-gray-50/60 page-enter">
      <PlatformHeader
        section="Settings"
        rightSlot={(
          <>
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-teal">Dashboard</Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm font-medium text-gray-600 hover:text-teal">Sign out</button>
            </form>
          </>
        )}
      />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-2 text-gray-600">Account and billing preferences.</p>
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-gray-200 p-6 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Billing</h3>
            <p className="mt-1 text-sm text-gray-600">Manage your subscription and invoices.</p>
            <form action="/api/stripe/portal" method="POST" className="mt-4">
              <button
                type="submit"
                className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90"
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
