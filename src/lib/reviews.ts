// Review aggregation helpers. Schema for AggregateRating + Review JSON-LD is
// emitted ONLY when verified reviews exist — synthetic ratings are a manual-
// action trigger, so the read path is gated and returns null until the
// `tour_reviews` table is populated.
//
// Today this module is a no-op (no reviews table yet). It provides the shape
// every consumer expects so when reviews arrive we light up rich snippets
// across the entire surface with no further code changes.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface VerifiedReview {
  author: string;
  ratingValue: number;
  reviewBody?: string;
  datePublished: string; // ISO-8601 date
}

export interface AggregateRating {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface ReviewBundle {
  aggregate: AggregateRating;
  reviews: VerifiedReview[];
}

/** Minimum verified reviews required before AggregateRating schema fires.
 *  Below this, the schema is suppressed entirely — we never round up to fake
 *  social proof. */
export const MIN_REVIEWS_FOR_SCHEMA = 3;

/** Fetch verified reviews for a tour. Returns null when:
 *  - the reviews table doesn't exist (current state — table is queued for P5.3)
 *  - there are fewer than MIN_REVIEWS_FOR_SCHEMA verified rows
 *  - the DB call errors
 *
 *  Callers MUST check for null and conditionally render the schema block.
 */
export async function getVerifiedReviewsForTour(
  supabase: SupabaseClient,
  tourId: string,
): Promise<ReviewBundle | null> {
  if (!tourId) return null;
  try {
    const { data, error } = await supabase
      .from('tour_reviews')
      .select('author, rating, body, date_published')
      .eq('tour_id', tourId)
      .eq('verified', true)
      .order('date_published', { ascending: false })
      .limit(20);

    // PGRST205 = relation does not exist. Until the table is created
    // (Phase 5), this is the expected path — silently return null.
    if (error) return null;
    if (!data || data.length < MIN_REVIEWS_FOR_SCHEMA) return null;

    const reviews: VerifiedReview[] = data.map((r: any) => ({
      author: r.author,
      ratingValue: Number(r.rating),
      reviewBody: r.body || undefined,
      datePublished: typeof r.date_published === 'string' ? r.date_published.slice(0, 10) : new Date(r.date_published).toISOString().slice(0, 10),
    }));

    const sum = reviews.reduce((acc, r) => acc + r.ratingValue, 0);
    const avg = Math.round((sum / reviews.length) * 10) / 10;

    return {
      aggregate: {
        ratingValue: avg,
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
      reviews: reviews.slice(0, 5),
    };
  } catch {
    return null;
  }
}

/** Build the AggregateRating + Review JSON-LD fragment that slots into a
 *  Product / TouristTrip / TravelAgency entity. Returns an empty object when
 *  bundle is null so callers can safely spread the result unconditionally. */
export function ratingSchemaFragment(bundle: ReviewBundle | null): Record<string, unknown> {
  if (!bundle) return {};
  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: bundle.aggregate.ratingValue,
      reviewCount: bundle.aggregate.reviewCount,
      bestRating: bundle.aggregate.bestRating ?? 5,
      worstRating: bundle.aggregate.worstRating ?? 1,
    },
    review: bundle.reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      datePublished: r.datePublished,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.ratingValue,
        bestRating: 5,
        worstRating: 1,
      },
      ...(r.reviewBody ? { reviewBody: r.reviewBody } : {}),
    })),
  };
}
