import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

type MagicPayload = {
  email: string;
  exp: number;
  from: string;
  nonce: string;
};

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function parseToken(token: string, secret: string): MagicPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expected = signPayload(payload, secret);

  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return null;

  const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
  const parsed = JSON.parse(decoded) as MagicPayload;

  if (!parsed.exp || Date.now() > parsed.exp) return null;
  if (!parsed.email) return null;

  return parsed;
}

function isMagicLinkEnabled() {
  if (process.env.PML_ENABLE_DEV_MAGIC_LINK === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

export async function GET(request: NextRequest) {
  if (!isMagicLinkEnabled()) {
    return NextResponse.redirect(new URL('/auth/signin?error=magic-disabled', request.url));
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL('/auth/signin?error=magic-config', request.url));
  }

  const token = request.nextUrl.searchParams.get('token') || '';
  const payload = parseToken(token, secret);

  if (!payload) {
    return NextResponse.redirect(new URL('/auth/signin?error=magic-invalid', request.url));
  }

  const redirectUrl = new URL(`/dashboard?entry=magiclink&temp=1`, request.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set('pml-dev-magic-auth', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  response.cookies.set('pml-dev-magic-email', payload.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
