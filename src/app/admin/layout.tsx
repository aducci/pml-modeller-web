import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/superAdmin';

// Gates the entire /admin route (Theme, Layout, Skills — global platform
// config) behind the super-admin allowlist. Previously unguarded entirely —
// anyone who could reach the URL could edit tool-wide theme/layout, and now
// the AI skill prompts too. See superAdmin.ts for why this isn't an
// OrganizationRole check.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isSuperAdmin())) {
    redirect('/auth/signin?callbackUrl=%2Fadmin');
  }

  return <>{children}</>;
}
