import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/ai/rateLimit';

/**
 * Shared guard for /api/ai/* routes: requires a signed-in user and applies
 * a per-user rate limit. Previously these routes had no auth check at all —
 * only the site-wide SITE_PASSWORD cookie gated access, so any visitor with
 * that shared secret could drive unbounded Anthropic API spend.
 */
export async function requireAiSession(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: Response }
> {
  const session = await auth();
  const userId = session?.user?.id;

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
