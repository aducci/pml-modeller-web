import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/site-gate';

// Public routes that don't require site access
const PUBLIC_ROUTES = [
  '/enter-password',
  '/api/enter-password',
  '/favicon.ico',
  '/robots.txt',
];

// Static asset patterns that don't require site access
const STATIC_PATTERNS = [
  /^\/_next\/static\//,
  /\.css$/,
  /\.js$/,
  /\.mjs$/,
  /\.json$/,
  /\.woff$/,
  /\.woff2$/,
  /\.ttf$/,
  /\.eot$/,
  /\.otf$/,
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.webp$/,
  /\.ico$/,
  /\/public\//,
];

function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  // Check pattern matches
  for (const pattern of STATIC_PATTERNS) {
    if (pattern.test(pathname)) {
      return true;
    }
  }

  return false;
}

function isStaticAsset(pathname: string): boolean {
  return STATIC_PATTERNS.some(pattern => pattern.test(pathname));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip static assets and public routes
  if (isStaticAsset(pathname) || isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // ───────────────────────────────────────────────
  // Site password gate (if SITE_PASSWORD is set)
  // ───────────────────────────────────────────────
  const sitePassword = process.env.SITE_PASSWORD;
  if (sitePassword) {
    const siteAccessCookie = request.cookies.get('site_access')?.value;
    // Use SITE_PASSWORD as the token secret (consistent with API route)
    const cookieSecret = sitePassword;
    
    console.log('[Middleware] Using secret:', {
      secretLength: cookieSecret.length,
      secretFirstChar: cookieSecret[0],
      secretLastChar: cookieSecret[cookieSecret.length - 1],
    });

    // If cookie not present, redirect to password gate
    if (!siteAccessCookie) {
      console.warn('[Middleware] No cookie found');
      return NextResponse.redirect(new URL('/enter-password', request.url));
    }

    // Verify cookie signature
    const tokenParts = siteAccessCookie.split('.');
    console.log('[Middleware] Cookie received:', {
      firstPartLength: tokenParts[0]?.length || 0,
      hmacLength: tokenParts[1]?.length || 0,
      totalLength: siteAccessCookie.length,
      hasSecret: !!cookieSecret,
    });

    if (!verifyAccessToken(siteAccessCookie, cookieSecret)) {
      console.warn('[Middleware] Cookie verification failed - token invalid');
      return NextResponse.redirect(new URL('/enter-password', request.url));
    }

    console.log('[Middleware] Cookie verified ✓');
  }

  // ───────────────────────────────────────────────
  // Existing auth checks (dashboard access)
  // ───────────────────────────────────────────────
  const sessionCookie = request.cookies.get('next-auth.session-token') ||
                        request.cookies.get('__Secure-next-auth.session-token');
  const devMagicCookie = request.cookies.get('pml-dev-magic-auth');

  if (!sessionCookie && !devMagicCookie && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Add X-Robots-Tag header to prevent indexing
  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    '/((?!_next/|_static/|.*\\..*\\?.*)?.*)',
  ],
};
