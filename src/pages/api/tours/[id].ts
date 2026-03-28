import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { deleteImage } from '../../../lib/storage';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) return json({ error: 'Tour ID is required' }, 400);

    const { data: tour, error } = await supabase
      .from('tours')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !tour) return json({ error: 'Tour not found' }, 404);

    return json(tour);
  } catch (error) {
    console.error('Error fetching tour:', error);
    return json({ error: 'Failed to fetch tour' }, 500);
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { id } = context.params;
    if (!id) return json({ error: 'Tour ID is required' }, 400);

    const { data: existing } = await supabase
      .from('tours')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) return json({ error: 'Tour not found' }, 404);
    if (existing.agency_id !== user.id && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    const body = await context.request.json();
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    const fields = ['name', 'description', 'country', 'city', 'currency', 'category',
                    'departure_country', 'departure_city', 'contact_email', 'contact_phone',
                    'contact_website', 'duration_days', 'max_participants'];

    // Map camelCase body keys to snake_case DB columns
    const keyMap: Record<string, string> = {
      departureCountry: 'departure_country',
      departureCity: 'departure_city',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      contactWebsite: 'contact_website',
      durationDays: 'duration_days',
      maxParticipants: 'max_participants',
    };

    for (const [bodyKey, dbKey] of Object.entries(keyMap)) {
      if (body[bodyKey] !== undefined) updateData[dbKey] = body[bodyKey] || null;
    }

    // Direct fields (same name in body and DB)
    for (const field of ['name', 'description', 'country', 'city', 'currency', 'category']) {
      if (body[field] !== undefined) updateData[field] = body[field] || null;
    }

    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.startDate !== undefined) updateData.start_date = body.startDate || null;
    if (body.endDate !== undefined) updateData.end_date = body.endDate || null;

    const { data: updated, error } = await supabase
      .from('tours')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return json(updated);
  } catch (error) {
    console.error('Error updating tour:', error);
    return json({ error: 'Failed to update tour' }, 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { id } = context.params;
    if (!id) return json({ error: 'Tour ID is required' }, 400);

    const { data: existing } = await supabase
      .from('tours')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) return json({ error: 'Tour not found' }, 404);
    if (existing.agency_id !== user.id && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    for (const image of (existing.images || [])) {
      try { await deleteImage(image.storage_path); } catch (err) {
        console.error('Failed to delete image:', err);
      }
    }

    await supabase
      .from('tours')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', id);

    return json({ success: true, message: 'Tour deleted' });
  } catch (error) {
    console.error('Error deleting tour:', error);
    return json({ error: 'Failed to delete tour' }, 500);
  }
};
