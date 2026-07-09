import crypto from 'crypto';

/**
 * Generate a signed value for site access cookie.
 * Uses HMAC-SHA256 with COOKIE_SECRET.
 */
export function generateAccessToken(secret: string): string {
  const randomValue = crypto.randomBytes(32).toString('hex');
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(randomValue)
    .digest('hex');
  return `${randomValue}.${hmac}`;
}

/**
 * Verify a signed site access token.
 */
export function verifyAccessToken(token: string, secret: string): boolean {
  try {
    const [randomValue, hmac] = token.split('.');
    if (!randomValue || !hmac) {
      console.warn('[SiteGate] Invalid token format - missing parts');
      return false;
    }

    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(randomValue)
      .digest('hex');

    const match = crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(expectedHmac)
    );
    
    if (!match) {
      console.warn('[SiteGate] HMAC mismatch:', {
        receivedHmac: hmac.substring(0, 8) + '...',
        expectedHmac: expectedHmac.substring(0, 8) + '...',
      });
    }
    
    return match;
  } catch (error) {
    console.error('[SiteGate] Verification error:', error);
    return false;
  }
}

/**
 * Verify password against environment variable.
 */
export function verifyPassword(password: string): boolean {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    console.warn('[SiteGate] SITE_PASSWORD not configured');
    return false;
  }
  return password === sitePassword;
}

/**
 * Get cookie configuration for site access.
 */
export function getCookieConfig(isProduction: boolean) {
  return {
    name: 'site_access',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  };
}
