import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { createCheckoutSession } from '../../../lib/stripe';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'agency') return json({ error: 'Forbidden' }, 403);

    const body = await context.request.json();
    const { tourId } = body;
    if (!tourId) return json({ error: 'Missing tourId' }, 400);

    const { data: tour } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .single();

    if (!tour) return json({ error: 'Tour not found' }, 404);
    if (tour.agency_id !== user.id) return json({ error: 'Forbidden' }, 403);

    const origin = new URL(context.request.url).origin;
    const checkoutSession = await createCheckoutSession({
      tourId: tour.id,
      tourName: tour.name,
      agencyEmail: user.email,
      successUrl: `${origin}/dashboard/tours/${tour.id}?payment=success`,
      cancelUrl: `${origin}/dashboard/tours/${tour.id}?payment=cancelled`,
    });

    return json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return json({ error: 'Failed to create checkout session' }, 500);
  }
};
