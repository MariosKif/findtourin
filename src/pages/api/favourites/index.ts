import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { data: favourites } = await supabase
      .from('favourites')
      .select('tour_id')
      .eq('user_id', user.id);

    const tourIds = (favourites || []).map(f => f.tour_id);
    return json(tourIds);
  } catch (error) {
    console.error('Error fetching favourites:', error);
    return json({ error: 'Failed to fetch favourites' }, 500);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await context.request.json();
    const { tourId } = body;
    if (!tourId) return json({ error: 'tourId is required' }, 400);

    // Upsert to prevent duplicates (unique constraint on user_id, tour_id)
    await supabase
      .from('favourites')
      .upsert({ user_id: user.id, tour_id: tourId }, { onConflict: 'user_id,tour_id' });

    return json({ success: true }, 201);
  } catch (error) {
    console.error('Error adding favourite:', error);
    return json({ error: 'Failed to add favourite' }, 500);
  }
};
