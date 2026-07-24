import { getActiveUser } from '@/lib/activeUser';

/**
 * Platform-level super-admin check — gates the global /admin route (Theme,
 * Layout, Skills: tool-wide configuration, not any one tenant's data).
 *
 * Deliberately NOT based on OrganizationRole: every user automatically owns
 * a personal organization (see activeTenant.ts's ensureMemberships), so an
 * OWNER/ADMIN role check would let any signed-in user in — they're always
 * the owner of their own personal org. Super-admin is a distinct, narrower
 * concept: the one or few people who configure the platform itself.
 *
 * A future per-tenant admin surface (each organization's own OWNER/ADMIN
 * managing THEIR org's settings) is a separate concern from this — it
 * would check OrganizationRole against a specific organizationId, not this
 * email allowlist. Don't conflate the two when building that later.
 *
 * Uses getActiveUser() rather than calling auth() directly — auth() only
 * resolves a real NextAuth session and returns null for a magic-link
 * session (a separate cookie-based identity, see activeUser.ts), which
 * previously made this redirect a magic-link-signed-in user straight back
 * to /auth/signin even though /dashboard already accepted them.
 * getActiveUser() already unifies both into one ActiveUser.
 *
 * SUPER_ADMIN_EMAILS is a comma-separated allowlist so this can name more
 * than one person without a schema change; a real per-user "isSuperAdmin"
 * flag can replace this once there's a reason to manage it outside env vars.
 */
function getSuperAdminEmails(): Set<string> {
  const raw = process.env.SUPER_ADMIN_EMAILS ?? '';
  return new Set(
    raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
}

export async function isSuperAdmin(): Promise<boolean> {
  const user = await getActiveUser();
  if (!user?.email) return false;
  return getSuperAdminEmails().has(user.email.toLowerCase());
}
