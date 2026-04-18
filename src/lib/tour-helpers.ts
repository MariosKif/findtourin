// src/lib/tour-helpers.ts
// Single source of truth for turning raw Supabase `tours` rows into the
// shape consumed by `TourCard.astro` (which expects `favouriteCount`,
// `thumbnail`, and `images`). All list queries should use TOUR_LIST_SELECT
// so the favourites aggregate is present on every row.

export const TOUR_LIST_SELECT = '*, favourites(count)';

export interface RawTour {
  id: string;
  slug: string;
  name: string;
  description: string;
  country: string;
  city: string;
  price: string | number;
  currency: string;
  category: string;
  duration_days?: number | null;
  view_count?: number | null;
  images?: { url: string; position?: number; storage_path?: string }[] | null;
  favourites?: { count: number }[] | null;
  [key: string]: any;
}

export interface NormalizedTour extends RawTour {
  images: { url: string; position?: number; storage_path?: string }[];
  thumbnail: string | null;
  favouriteCount: number;
  view_count: number;
}

export function normalizeTour(row: RawTour): NormalizedTour {
  const { favourites, ...rest } = row;
  const images = rest.images || [];
  return {
    ...rest,
    images,
    thumbnail: images[0]?.url || null,
    favouriteCount: favourites?.[0]?.count ?? 0,
    view_count: rest.view_count ?? 0,
  };
}

export function normalizeTours(rows: RawTour[] | null | undefined): NormalizedTour[] {
  return (rows || []).map(normalizeTour);
}
