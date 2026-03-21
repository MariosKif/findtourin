import type { APIRoute } from 'astro';
import { toursCol, Timestamp } from '../../../lib/firestore';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { searchTours, type SearchParams } from '../../../lib/search';
import { slugify } from '../../../lib/utils';

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

    const body = await context.request.json();
    const { name, description, country, city, price, currency, category,
            contactEmail, contactPhone, contactWebsite, startDate, endDate,
            durationDays, maxParticipants, departureCountry, departureCity } = body;

    if (!name || !description || !country || !city || !price || !category) {
      return json({ error: 'Missing required fields' }, 400);
    }

    let slug = slugify(name);
    const existing = await toursCol().where('slug', '==', slug).limit(1).get();
    if (!existing.empty) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    const now = Timestamp.now();
    const tourData = {
      agencyId: user.id,
      name,
      slug,
      description,
      country,
      city,
      price: Number(price),
      currency: currency || 'EUR',
      category,
      departureCountry: departureCountry || null,
      departureCity: departureCity || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      contactWebsite: contactWebsite || null,
      startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : null,
      endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
      durationDays: durationDays || null,
      maxParticipants: maxParticipants || null,
      status: 'pending_payment',
      stripePaymentId: null,
      images: [],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await toursCol().add(tourData);

    return json({ id: docRef.id, ...tourData }, 201);
  } catch (error) {
    console.error('Error creating tour:', error);
    return json({ error: 'Failed to create tour' }, 500);
  }
};
