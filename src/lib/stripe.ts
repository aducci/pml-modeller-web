import Stripe from 'stripe';

let _stripe: Stripe | null = null;
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {});
  }
  return _stripe;
}

export const PLANS = {
  STARTER: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    name: 'Starter',
    amount: 12,
  },
  PRO: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    name: 'Pro',
    amount: 29,
  },
} as const;
