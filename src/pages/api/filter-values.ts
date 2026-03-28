import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

const ALLOWED_FIELDS = ['country', 'category', 'departure_country', 'departure_city', 'city'];

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const field = url.searchParams.get('field');
  const q = url.searchParams.get('q') || '';
  const country = url.searchParams.get('country') || '';

  if (!field || !ALLOWED_FIELDS.includes(field)) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let query = supabase
      .from('tours')
      .select(field)
      .eq('status', 'active');

    // For departure_city, filter by departure_country
    if (field === 'departure_city' && country) {
      query = query.eq('departure_country', country);
    }

    // For city, filter by country
    if (field === 'city' && country) {
      query = query.eq('country', country);
    }

    // Server-side text filtering
    if (q) {
      query = query.ilike(field, `%${q}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Deduplicate and sort
    const values = new Set<string>();
    (data || []).forEach(row => {
      const val = row[field];
      if (val) values.add(val);
    });

    const sorted = Array.from(values).sort();

    return new Response(JSON.stringify(sorted), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching filter values:', error);
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
