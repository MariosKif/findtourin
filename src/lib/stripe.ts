import Stripe from 'stripe';
import { supabase } from './supabase';

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '', {
  // Pinned API version — the value is intentionally older than the Stripe SDK's
  // current LatestApiVersion type, so cast to keep TS happy without changing
  // the wire version (response shapes stay stable).
  apiVersion: '2025-01-27.acacia' as Stripe.StripeConfig['apiVersion'],
});

async function getListingFeeCents(): Promise<number> {
  try {
    const { data } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'pricing')
      .single();
    return data?.value?.listing_fee_cents ?? 4900;
  } catch {
    return 4900;
  }
}

export async function createCheckoutSession(params: {
  tourId: string;
  tourName: string;
  agencyEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const listingFeeCents = await getListingFeeCents();

  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.agencyEmail,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Listing Fee: ${params.tourName}`,
            description: 'One-time fee to publish your tour listing on FindToursIn',
          },
          unit_amount: listingFeeCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      tourId: params.tourId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}

export async function verifyWebhookSignature(body: string, signature: string) {
  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';
  return stripe.webhooks.constructEvent(body, signature, secret);
}
