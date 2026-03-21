import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { tours, payments } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyWebhookSignature } from '../../../lib/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let event;
    try {
      event = await verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const tourId = session.metadata?.tourId;

      if (!tourId) {
        console.error('No tourId in session metadata');
        return new Response(JSON.stringify({ error: 'Missing tourId in metadata' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Update tour status to active
      const [tour] = await db
        .update(tours)
        .set({
          status: 'active',
          stripePaymentId: session.payment_intent,
          updatedAt: new Date(),
        })
        .where(eq(tours.id, tourId))
        .returning();

      if (tour) {
        // Create payment record
        await db.insert(payments).values({
          agencyId: tour.agencyId,
          tourId: tour.id,
          stripeSessionId: session.id,
          stripePaymentIntent: session.payment_intent,
          amount: session.amount_total || 0,
          currency: session.currency || 'eur',
          status: 'completed',
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
