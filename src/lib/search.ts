import { db } from './db';
import { tours, tourImages } from './db/schema';
import { eq, and, ilike, or, sql, desc, asc, count, gte, lte } from 'drizzle-orm';

const ITEMS_PER_PAGE = 12;

export interface SearchParams {
  q?: string;
  country?: string;
  city?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'name';
  page?: number;
  departureCountry?: string;
  departureCity?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function searchTours(params: SearchParams) {
  const page = params.page || 1;
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const conditions = [eq(tours.status, 'active')];

  if (params.q) {
    const searchTerm = `%${params.q}%`;
    conditions.push(
      or(
        ilike(tours.name, searchTerm),
        ilike(tours.description, searchTerm),
        ilike(tours.country, searchTerm),
        ilike(tours.city, searchTerm),
        ilike(tours.category, searchTerm),
        ilike(tours.departureCountry, searchTerm),
        ilike(tours.departureCity, searchTerm),
      )!
    );
  }

  if (params.destination) {
    const destTerm = `%${params.destination}%`;
    conditions.push(
      or(
        ilike(tours.country, destTerm),
        ilike(tours.city, destTerm),
      )!
    );
  }

  if (params.departureCountry) {
    const depCountryTerm = `%${params.departureCountry}%`;
    conditions.push(
      or(
        ilike(tours.departureCountry, depCountryTerm),
        ilike(tours.departureCity, depCountryTerm),
      )!
    );
  }

  if (params.departureCity) {
    conditions.push(ilike(tours.departureCity, `%${params.departureCity}%`));
  }

  if (params.country) {
    conditions.push(ilike(tours.country, params.country));
  }

  if (params.city) {
    conditions.push(ilike(tours.city, params.city));
  }

  if (params.category) {
    conditions.push(eq(tours.category, params.category));
  }

  if (params.minPrice !== undefined) {
    conditions.push(sql`${tours.price}::numeric >= ${params.minPrice}`);
  }

  if (params.maxPrice !== undefined) {
    conditions.push(sql`${tours.price}::numeric <= ${params.maxPrice}`);
  }

  if (params.dateFrom) {
    conditions.push(gte(tours.startDate, new Date(params.dateFrom)));
  }

  if (params.dateTo) {
    conditions.push(lte(tours.startDate, new Date(params.dateTo)));
  }

  const where = and(...conditions);

  let orderBy;
  switch (params.sort) {
    case 'price_asc':
      orderBy = asc(sql`${tours.price}::numeric`);
      break;
    case 'price_desc':
      orderBy = desc(sql`${tours.price}::numeric`);
      break;
    case 'name':
      orderBy = asc(tours.name);
      break;
    case 'newest':
    default:
      orderBy = desc(tours.createdAt);
  }

  const [results, totalResult] = await Promise.all([
    db
      .select()
      .from(tours)
      .where(where)
      .orderBy(orderBy)
      .limit(ITEMS_PER_PAGE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(tours)
      .where(where),
  ]);

  const total = totalResult[0]?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Fetch first image for each tour
  const tourIds = results.map((t) => t.id);
  const images = tourIds.length
    ? await db
        .select()
        .from(tourImages)
        .where(sql`${tourImages.tourId} IN ${tourIds}`)
        .orderBy(asc(tourImages.position))
    : [];

  const imagesByTour = new Map<string, typeof images>();
  for (const img of images) {
    if (!imagesByTour.has(img.tourId)) {
      imagesByTour.set(img.tourId, []);
    }
    imagesByTour.get(img.tourId)!.push(img);
  }

  const toursWithImages = results.map((tour) => ({
    ...tour,
    images: imagesByTour.get(tour.id) || [],
    thumbnail: imagesByTour.get(tour.id)?.[0]?.url || null,
  }));

  return {
    tours: toursWithImages,
    total,
    totalPages,
    page,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export const CATEGORIES = [
  'Adventure',
  'Cultural',
  'Food & Wine',
  'Nature',
  'City Tours',
  'Beach & Island',
  'Historical',
  'Wildlife',
  'Hiking & Trekking',
  'Photography',
  'Wellness & Spa',
  'Cruise',
] as const;

export const COUNTRIES = [
  'Argentina', 'Australia', 'Austria', 'Brazil', 'Cambodia',
  'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica',
  'Croatia', 'Czech Republic', 'Ecuador', 'Egypt', 'Fiji',
  'France', 'Germany', 'Greece', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Ireland', 'Italy', 'Japan',
  'Jordan', 'Kenya', 'Malaysia', 'Maldives', 'Mexico',
  'Morocco', 'Nepal', 'Netherlands', 'New Zealand', 'Norway',
  'Peru', 'Philippines', 'Poland', 'Portugal', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Switzerland', 'Tanzania',
  'Thailand', 'Turkey', 'UAE', 'UK', 'USA', 'Vietnam',
] as const;
