import type { APIRoute } from 'astro';
import { toursCol } from '../../lib/firestore';

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
    const countryField = field === 'departureCity' ? 'departureCountry' : 'country';
    const cityField = field === 'departureCity' ? 'departureCity' : 'city';

    const snapshot = await toursCol()
      .where('status', '==', 'active')
      .where(countryField, '==', country)
      .get();

    const cities = new Set<string>();
    snapshot.docs.forEach(doc => {
      const val = doc.data()[cityField];
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
