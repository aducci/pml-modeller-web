import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { CircleUserRound } from 'lucide-react';
import { PlatformHeader } from '@/components/PlatformHeader';
import { DashboardWorkspace } from '@/components/DashboardWorkspace';

const entryLabels: Record<string, string> = {
  demo: 'You are now in your full workspace. Demo changes can be saved here.',
  marketing: 'Welcome to your workspace. Start by creating your first project.',
  pricing: 'Welcome in. You can explore the workspace before selecting a plan.',
  about: 'Welcome in. You now have access to your process workspace.',
  home: 'Welcome in. You now have access to your process workspace.',
  magiclink: 'Signed in with temporary magic link access for testing.',
};

export default async function Dashboard({ searchParams }: { searchParams: { entry?: string; upgraded?: string } }) {
  const session = await auth();
  const cookieStore = await cookies();
  const hasDevMagicAccess = cookieStore.get('pml-dev-magic-auth')?.value === '1';
  if (!session?.user && !hasDevMagicAccess) return redirect('/auth/signin');

  const entry = searchParams.entry;
  const entryMessage = entry ? entryLabels[entry] ?? 'Welcome to your process workspace.' : null;
  const upgraded = searchParams.upgraded === 'true';
  const displayName = session?.user?.name?.trim() || session?.user?.email?.trim() || 'there';

  return (
    <div className="min-h-screen bg-gray-50/60 page-enter">
      <PlatformHeader
        section="Dashboard"
        rightSlot={(
          <>
            <a href="/api/stripe/portal" className="text-sm font-medium text-gray-600 hover:text-teal">Billing</a>
            <Link
              href="/dashboard/settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-teal hover:text-teal"
              aria-label="Account preferences"
              title="Account preferences"
            >
              <CircleUserRound className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/settings" className="text-sm font-medium text-gray-600 hover:text-teal">Settings</Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm font-medium text-gray-600 hover:text-teal">Sign out</button>
            </form>
          </>
        )}
      />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {entryMessage ? (
          <div className="mb-5 rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-teal page-enter-delay">
            <span className="font-semibold">Welcome, {displayName}.</span>{' '}
            {entryMessage}
          </div>
        ) : null}
        {upgraded ? (
          <div className="mb-5 rounded-xl border border-honeydew/30 bg-honeydew/70 px-4 py-3 text-sm text-gray-800 page-enter-delay">
            Upgrade confirmed. Your billing changes are now active.
          </div>
        ) : null}
        <DashboardWorkspace />
      </main>
    </div>
  );
}
