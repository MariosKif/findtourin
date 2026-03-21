import Stripe from 'stripe';

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia',
});

export const LISTING_FEE_CENTS = Number(import.meta.env.LISTING_FEE_CENTS || process.env.LISTING_FEE_CENTS || 4900);

export async function createCheckoutSession(params: {
  tourId: string;
  tourName: string;
  agencyEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
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
          unit_amount: LISTING_FEE_CENTS,
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
