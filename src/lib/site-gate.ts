/**
 * Generate a signed value for site access cookie.
 * Uses HMAC-SHA256 with SITE_PASSWORD.
 * Uses Web Crypto API (works in Edge Runtime and Serverless Functions).
 */
export async function generateAccessToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const randomValue = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const hmacBuffer = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(randomValue)
  );

  const hmac = Array.from(new Uint8Array(hmacBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${randomValue}.${hmac}`;
}

/**
 * Verify a signed site access token.
 * Uses Web Crypto API for Edge Runtime compatibility.
 * Works in both Edge Runtime (middleware) and Serverless Functions (API).
 */
export async function verifyAccessToken(token: string, secret: string): Promise<boolean> {
  try {
    const [randomValue, hmac] = token.split('.');
    if (!randomValue || !hmac) {
      console.warn('[SiteGate] Invalid token format - missing parts');
      return false;
    }

    // Use Web Crypto API (available in Edge Runtime)
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedHmacBuffer = await crypto.subtle.sign(
      'HMAC',
      secretKey,
      encoder.encode(randomValue)
    );

    const expectedHmac = Array.from(new Uint8Array(expectedHmacBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const match = hmac === expectedHmac;
    
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
