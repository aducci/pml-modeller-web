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
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }

    // Verify password
    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Get cookie secret
    const cookieSecret = process.env.COOKIE_SECRET;
    if (!cookieSecret) {
      console.error('[SiteGate] COOKIE_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Generate signed access token
    const token = generateAccessToken(cookieSecret);

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

    return response;
  } catch (error) {
    console.error('[SiteGate] POST /api/enter-password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
