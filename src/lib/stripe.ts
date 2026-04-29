import Stripe from 'stripe';

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '', {
  // Pinned API version — the value is intentionally older than the Stripe SDK's
  // current LatestApiVersion type, so cast to keep TS happy without changing
  // the wire version (response shapes stay stable).
  apiVersion: '2025-01-27.acacia' as Stripe.StripeConfig['apiVersion'],
});

export async function verifyWebhookSignature(body: string, signature: string) {
  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';
  return stripe.webhooks.constructEvent(body, signature, secret);
}
