import { NextRequest, NextResponse } from 'next/server';
import { getCookieConfig } from '@/lib/site-gate';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/enter-password', request.url));

  // Clear the site_access cookie
  const isProduction = process.env.NODE_ENV === 'production';
  const config = getCookieConfig(isProduction);

  response.cookies.set(config.name, '', {
    httpOnly: config.httpOnly,
    secure: config.secure,
    sameSite: config.sameSite,
    maxAge: 0,
    path: config.path,
  });

  return response;
}
