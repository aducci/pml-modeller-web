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
    let cookieSecret = process.env.COOKIE_SECRET;

    console.log('[Middleware] Password gate check for:', pathname, {
      hasCookie: !!siteAccessCookie,
      hasSecret: !!cookieSecret,
      cookieLength: siteAccessCookie?.length || 0,
    });

    // If no explicit secret in middleware context, derive from SITE_PASSWORD
    // (fallback for Edge Runtime where env vars might not propagate)
    if (!cookieSecret) {
      console.warn('[Middleware] COOKIE_SECRET not available, using SITE_PASSWORD as fallback');
      cookieSecret = sitePassword;
    }

    // If cookie not present, redirect to password gate
    if (!siteAccessCookie) {
      console.warn('[Middleware] No cookie found, redirecting to password gate');
      return NextResponse.redirect(new URL('/enter-password', request.url));
    }

    // Verify cookie signature
    if (!verifyAccessToken(siteAccessCookie, cookieSecret)) {
      console.warn('[Middleware] Cookie verification failed');
      return NextResponse.redirect(new URL('/enter-password', request.url));
    }

    console.log('[Middleware] Cookie verified, access granted');
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
