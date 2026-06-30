import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = getStripe();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeId: true },
  });

  if (!user?.stripeId) {
    return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
