import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { verifyWebhookSignature } from '../../../lib/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    let event;
    try {
      event = await verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const tourId = session.metadata?.tourId;

      if (!tourId) {
        return new Response(JSON.stringify({ error: 'Missing tourId' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data: tour } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .single();

      if (tour) {
        await supabase
          .from('tours')
          .update({
            status: 'active',
            stripe_payment_id: session.payment_intent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tourId);

        await supabase.from('payments').insert({
          agency_id: tour.agency_id,
          tour_id: tour.id,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          amount: session.amount_total || 0,
          currency: session.currency || 'eur',
          status: 'completed',
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
