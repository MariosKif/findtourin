import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const country = url.searchParams.get('country');
  const field = url.searchParams.get('field') || 'city';

  if (!country) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const countryField = field === 'departureCity' ? 'departure_country' : 'country';
    const cityField = field === 'departureCity' ? 'departure_city' : 'city';

    const { data: tours } = await supabase
      .from('tours')
      .select(cityField)
      .eq('status', 'active')
      .eq(countryField, country);

    const cities = new Set<string>();
    (tours || []).forEach((tour: Record<string, string | null>) => {
      const val = tour[cityField];
      if (val) cities.add(val);
    });

    const sorted = Array.from(cities).sort();

    return new Response(JSON.stringify(sorted), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
