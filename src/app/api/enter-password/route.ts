import { NextRequest, NextResponse } from 'next/server';
import {
  generateAccessToken,
  verifyPassword,
  getCookieConfig,
} from '@/lib/site-gate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      console.error('[SiteGate] Password missing or invalid type');
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }

    // Check if SITE_PASSWORD is configured
    const sitePassword = process.env.SITE_PASSWORD;
    if (!sitePassword) {
      console.error('[SiteGate] SITE_PASSWORD environment variable not configured');
      return NextResponse.json(
        { error: 'Server configuration error: SITE_PASSWORD not set' },
        { status: 500 }
      );
    }

    // Verify password with detailed logging
    const passwordMatch = password === sitePassword;
    console.log('[SiteGate] Password verification:', {
      provided: password.length + ' chars',
      configured: sitePassword.length + ' chars',
      match: passwordMatch,
    });

    if (!passwordMatch) {
      console.warn('[SiteGate] Invalid password attempt');
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Use SITE_PASSWORD as the token secret (consistent with middleware)
    const cookieSecret = sitePassword;

    // Generate signed access token
    const token = generateAccessToken(cookieSecret);
    const tokenParts = token.split('.');
    console.log('[SiteGate] Token generated:', {
      firstPartLength: tokenParts[0]?.length || 0,
      hmacLength: tokenParts[1]?.length || 0,
      totalLength: token.length,
    });

    // Create response
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    // Set secure cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const config = getCookieConfig(isProduction);

    response.cookies.set(config.name, token, {
      httpOnly: config.httpOnly,
      secure: config.secure,
      sameSite: config.sameSite,
      maxAge: config.maxAge,
      path: config.path,
    });

    console.log('[SiteGate] Cookie set:', {
      name: config.name,
      httpOnly: config.httpOnly,
      secure: config.secure,
      sameSite: config.sameSite,
      maxAge: config.maxAge,
      path: config.path,
      nodeEnv: process.env.NODE_ENV,
    });

    console.log('[SiteGate] Response returned with cookie');
    return response;
  } catch (error) {
    console.error('[SiteGate] POST /api/enter-password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
