import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { tourId } = context.params;
    if (!tourId) return json({ error: 'Tour ID is required' }, 400);

    await supabase
      .from('favourites')
      .delete()
      .eq('user_id', user.id)
      .eq('tour_id', tourId);

    return json({ success: true });
  } catch (error) {
    console.error('Error removing favourite:', error);
    return json({ error: 'Failed to remove favourite' }, 500);
  }
};
