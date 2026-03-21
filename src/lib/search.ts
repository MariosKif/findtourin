import { toursCol, docsToArray, type TourDoc } from './firestore';

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

  let query: FirebaseFirestore.Query = toursCol().where('status', '==', 'active');

  if (params.category) {
    query = query.where('category', '==', params.category);
  }

  if (params.country) {
    query = query.where('country', '==', params.country);
  }

  if (params.city) {
    query = query.where('city', '==', params.city);
  }

  if (params.departureCountry) {
    query = query.where('departureCountry', '==', params.departureCountry);
  }

  if (params.departureCity) {
    query = query.where('departureCity', '==', params.departureCity);
  }

  switch (params.sort) {
    case 'price_asc':
      query = query.orderBy('price', 'asc');
      break;
    case 'price_desc':
      query = query.orderBy('price', 'desc');
      break;
    case 'name':
      query = query.orderBy('name', 'asc');
      break;
    case 'newest':
    default:
      query = query.orderBy('createdAt', 'desc');
  }

  const snapshot = await query.get();
  let allTours = docsToArray<TourDoc>(snapshot);

  if (params.q) {
    const q = params.q.toLowerCase();
    allTours = allTours.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.departureCountry || '').toLowerCase().includes(q) ||
      (t.departureCity || '').toLowerCase().includes(q)
    );
  }

  if (params.destination) {
    const dest = params.destination.toLowerCase();
    allTours = allTours.filter(t =>
      t.country.toLowerCase().includes(dest) ||
      t.city.toLowerCase().includes(dest)
    );
  }

  if (params.minPrice !== undefined) {
    allTours = allTours.filter(t => t.price >= params.minPrice!);
  }
  if (params.maxPrice !== undefined) {
    allTours = allTours.filter(t => t.price <= params.maxPrice!);
  }

  if (params.dateFrom) {
    const fromDate = new Date(params.dateFrom);
    allTours = allTours.filter(t => t.startDate && new Date(t.startDate as any) >= fromDate);
  }
  if (params.dateTo) {
    const toDate = new Date(params.dateTo);
    allTours = allTours.filter(t => t.startDate && new Date(t.startDate as any) <= toDate);
  }

  const total = allTours.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const paginatedTours = allTours.slice(offset, offset + ITEMS_PER_PAGE);

  const toursWithImages = paginatedTours.map(tour => ({
    ...tour,
    images: tour.images || [],
    thumbnail: tour.images?.[0]?.url || null,
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
  'Adventure', 'Cultural', 'Food & Wine', 'Nature', 'City Tours',
  'Beach & Island', 'Historical', 'Wildlife', 'Hiking & Trekking',
  'Photography', 'Wellness & Spa', 'Cruise',
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
