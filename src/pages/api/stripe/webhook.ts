import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { stripe, verifyWebhookSignature } from '../../../lib/stripe';

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
      const agencyId = session.metadata?.agencyId;
      const planId = session.metadata?.planId;
      const billingPeriod = session.metadata?.billingPeriod;

      if (tourId) {
        // Existing tour-listing payment flow — unchanged behaviour
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
      } else if (agencyId && planId) {
        // Agency-plan subscription completion
        const now = new Date().toISOString();
        let expiresAt: string | null = null;

        // If this was a recurring Stripe subscription, retrieve current_period_end.
        // Otherwise fall back to a calculated expiry from the billing period.
        try {
          if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string);
            const cpe = (sub as any)?.current_period_end;
            if (typeof cpe === 'number') {
              expiresAt = new Date(cpe * 1000).toISOString();
            }
          } else if (billingPeriod === 'annual') {
            expiresAt = new Date(Date.now() + 365 * 86400 * 1000).toISOString();
          } else if (billingPeriod === 'monthly') {
            expiresAt = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
          }
        } catch (subErr) {
          console.error('webhook: failed to retrieve stripe subscription', subErr);
        }

        // Deactivate any prior active subscription for this user.
        await supabase
          .from('subscriptions')
          .update({ is_active: false, deactivated_at: now, updated_at: now })
          .eq('user_id', agencyId)
          .eq('is_active', true);

        // Insert the new active row with source='stripe'.
        const { error: insertErr } = await supabase.from('subscriptions').insert({
          user_id: agencyId,
          plan_id: planId,
          source: 'stripe',
          is_active: true,
          started_at: now,
          expires_at: expiresAt,
        });
        if (insertErr) {
          console.error('webhook: failed to insert stripe subscription', insertErr);
        }

        // Record the payment for the admin payments table.
        await supabase.from('payments').insert({
          agency_id: agencyId,
          tour_id: null,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent || session.subscription,
          amount: session.amount_total || 0,
          currency: session.currency || 'eur',
          status: 'completed',
        });
      } else {
        // Unknown checkout shape. Log and acknowledge so Stripe doesn't retry forever.
        console.warn('webhook: unrecognised checkout.session.completed metadata', session.metadata);
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
