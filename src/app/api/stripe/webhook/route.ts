import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (!userId) break;

      await db.user.update({
        where: { id: userId },
        data: { stripeId: customerId },
      });

      const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
      const sub = subResponse as unknown as Stripe.Subscription;
      const priceId = sub.items.data[0].price.id;
      const currentPeriodEnd = sub.items.data[0].current_period_end;

      await db.subscription.create({
        data: {
          userId,
          stripeSubId: subscriptionId,
          stripePriceId: priceId,
          status: sub.status.toUpperCase() as any,
          currentPeriodEnd: new Date(currentPeriodEnd * 1000),
        },
      });
      break;
    }
    case 'customer.subscription.updated': {
      const rawSub = event.data.object as Stripe.Subscription;
      const sub = rawSub as unknown as Stripe.Subscription & { current_period_end?: number };
      await db.subscription.update({
        where: { stripeSubId: sub.id },
        data: {
          status: sub.status.toUpperCase() as any,
          currentPeriodEnd: new Date((sub.current_period_end ?? rawSub.items?.data?.[0]?.current_period_end ?? 0) * 1000),
        },
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await db.subscription.deleteMany({
        where: { stripeSubId: sub.id },
      });
      await db.user.updateMany({
        where: { stripeId: sub.customer as string },
        data: { plan: 'FREE' },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
