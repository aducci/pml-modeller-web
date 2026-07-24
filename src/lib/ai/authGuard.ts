import { getActiveUser } from '@/lib/activeUser';
import { checkRateLimit } from '@/lib/ai/rateLimit';

/**
 * Shared guard for /api/ai/* routes: requires a signed-in user and applies
 * a per-user rate limit. Previously these routes had no auth check at all —
 * only the site-wide SITE_PASSWORD cookie gated access, so any visitor with
 * that shared secret could drive unbounded Anthropic API spend.
 *
 * Uses getActiveUser() rather than calling auth() directly — auth() only
 * resolves a real NextAuth session, which requires OAuth provider secrets
 * (Google/GitHub) to be configured. Every other authenticated page in the
 * app (dashboard, settings) already goes through getActiveUser(), which
 * also accepts the pml-dev-magic-auth cookie set by the magic-link flow —
 * that's how local development works without OAuth secrets set. This guard
 * previously didn't follow that fallback, so AI chat/propose 401'd locally
 * even when every other page recognized the same magic-link session.
 */
export async function requireAiSession(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: Response }
> {
  const user = await getActiveUser();
  const userId = user?.id;

  if (!userId) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }

  const { allowed, retryAfterSeconds } = checkRateLimit(userId);
  if (!allowed) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSeconds ?? 60),
          },
        }
      ),
    };
  }

  return { ok: true, userId };
}
