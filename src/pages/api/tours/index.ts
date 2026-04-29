import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { searchTours, type SearchParams } from '../../../lib/search';
import { slugify } from '../../../lib/utils';
import { assertCanCreateListing } from '../../../lib/subscriptions';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const params: SearchParams = {
      q: url.searchParams.get('q') || undefined,
      country: url.searchParams.get('country') || undefined,
      city: url.searchParams.get('city') || undefined,
      category: url.searchParams.get('category') || undefined,
      minPrice: url.searchParams.get('minPrice') ? Number(url.searchParams.get('minPrice')) : undefined,
      maxPrice: url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined,
      sort: (url.searchParams.get('sort') as SearchParams['sort']) || undefined,
      page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
      departureCountry: url.searchParams.get('departureCountry') || undefined,
      departureCity: url.searchParams.get('departureCity') || undefined,
      destination: url.searchParams.get('destination') || undefined,
      dateFrom: url.searchParams.get('dateFrom') || undefined,
      dateTo: url.searchParams.get('dateTo') || undefined,
    };

    const results = await searchTours(params);
    return json(results);
  } catch (error) {
    console.error('Error searching tours:', error);
    return json({ error: 'Failed to search tours' }, 500);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'agency' && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    // Plan-cap gate — admins are exempt so they can create tours for testing
    // and on behalf of agencies during onboarding.
    if (user.role === 'agency') {
      try {
        await assertCanCreateListing(user.id);
      } catch (err: any) {
        return json({ error: err?.message || 'Listing cap reached' }, 403);
      }
    }

    const body = await context.request.json();
    const { name, description, country, city, price, currency, category,
            contactEmail, contactPhone, contactWebsite, startDate, endDate,
            durationDays, maxParticipants, departureCountry, departureCity } = body;

    if (!name || !description || !country || !city || !price || !category) {
      return json({ error: 'Missing required fields' }, 400);
    }

    let slug = slugify(name);
    const { data: existing } = await supabase
      .from('tours')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (existing && existing.length > 0) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    const tourData = {
      agency_id: user.id,
      name,
      slug,
      description,
      country,
      city,
      price: Number(price),
      currency: currency || 'EUR',
      category,
      departure_country: departureCountry || null,
      departure_city: departureCity || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      contact_website: contactWebsite || null,
      start_date: startDate || null,
      end_date: endDate || null,
      duration_days: durationDays || null,
      max_participants: maxParticipants || null,
      status: 'pending_payment',
      stripe_payment_id: null,
      images: [],
    };

    const { data: tour, error } = await supabase
      .from('tours')
      .insert(tourData)
      .select()
      .single();

    if (error) throw error;

    // After creation, send the agency to the edit page so they can attach
    // images using <ImageUpload> (which needs a tourId). The edit page
    // already enforces the plan-aware image cap.
    return json({ tour, redirect: `/dashboard/tours/${tour.id}/edit?new=1` }, 201);
  } catch (error) {
    console.error('Error creating tour:', error);
    return json({ error: 'Failed to create tour' }, 500);
  }
};
