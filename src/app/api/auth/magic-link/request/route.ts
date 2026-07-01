import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

type MagicPayload = {
  email: string;
  exp: number;
  from: string;
  nonce: string;
};

function base64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function isMagicLinkEnabled() {
  if (process.env.PML_ENABLE_DEV_MAGIC_LINK === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

export async function POST(request: NextRequest) {
  if (!isMagicLinkEnabled()) {
    return NextResponse.json({ error: 'Magic link is disabled.' }, { status: 403 });
  }

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Missing AUTH_SECRET or NEXTAUTH_SECRET.' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body?.email ?? '').trim().toLowerCase();
  const from = String(body?.from ?? 'marketing').trim();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  const payload: MagicPayload = {
    email,
    from,
    exp: Date.now() + 1000 * 60 * 15,
    nonce: crypto.randomBytes(8).toString('hex'),
  };

  const payloadString = JSON.stringify(payload);
  const encodedPayload = base64url(payloadString);
  const signature = signPayload(encodedPayload, secret);
  const token = `${encodedPayload}.${signature}`;

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const magicLink = `${origin}/api/auth/magic-link/consume?token=${encodeURIComponent(token)}`;

  return NextResponse.json({ magicLink, expiresAt: payload.exp });
}
