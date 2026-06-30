import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: session.user });
}
