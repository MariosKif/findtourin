import { supabase } from './supabase';

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

  let query = supabase
    .from('tours')
    .select('*, favourites(count)', { count: 'exact' })
    .eq('status', 'active');

  if (params.category) query = query.eq('category', params.category);
  if (params.country) query = query.eq('country', params.country);
  if (params.city) query = query.eq('city', params.city);
  if (params.departureCountry) query = query.eq('departure_country', params.departureCountry);
  if (params.departureCity) query = query.eq('departure_city', params.departureCity);
  if (params.minPrice !== undefined) query = query.gte('price', params.minPrice);
  if (params.maxPrice !== undefined) query = query.lte('price', params.maxPrice);
  if (params.dateFrom) query = query.gte('start_date', params.dateFrom);
  if (params.dateTo) query = query.lte('start_date', params.dateTo);

  if (params.q) {
    const q = `%${params.q}%`;
    query = query.or(`name.ilike.${q},description.ilike.${q},country.ilike.${q},city.ilike.${q},category.ilike.${q}`);
  }

  if (params.destination) {
    const dest = `%${params.destination}%`;
    query = query.or(`country.ilike.${dest},city.ilike.${dest}`);
  }

  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + ITEMS_PER_PAGE - 1);

  const { data: tours, count, error } = await query;
  if (error) throw error;

  const total = count || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const toursWithImages = (tours || []).map((tour: any) => {
    const favouriteCount = tour.favourites?.[0]?.count || 0;
    const { favourites: _fav, ...rest } = tour;
    return {
      ...rest,
      images: rest.images || [],
      thumbnail: rest.images?.[0]?.url || null,
      favouriteCount,
    };
  });

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
