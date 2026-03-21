import Stripe from 'stripe';
import { adminDb } from './firebase';

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia',
});

async function getListingFeeCents(): Promise<number> {
  try {
    const doc = await adminDb.collection('config').doc('pricing').get();
    if (doc.exists) {
      return doc.data()?.listingFeeCents ?? 4900;
    }
  } catch {
    // Fallback if Firestore is unavailable
  }
  return 4900;
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
