// Admin moderation endpoint for tour reviews.
//
//   GET    /api/admin/reviews              — list pending (unverified) reviews
//   GET    /api/admin/reviews?status=all   — list all reviews
//   GET    /api/admin/reviews?tour_id=X    — list reviews for one tour
//   POST   /api/admin/reviews              — create a new review (manual entry)
//   PATCH  /api/admin/reviews?id=X         — verify / update a review
//   DELETE /api/admin/reviews?id=X         — remove a review
//
// All operations require an admin user (auth-helpers checks the JWT role).
// The schema fires automatically on tour pages once a tour has ≥3 verified
// reviews — no extra step needed after PATCH ?verified=true.
//
// This endpoint depends on the tour_reviews table existing (see
// scripts/migrations/2026-05-08-tour-reviews.sql). When the table is
// missing, every call returns 500 with a clear message.

import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { submitToIndexNow } from '../../../lib/seo/indexnow';

export const prerender = false;

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

async function requireAdmin(context: Parameters<APIRoute>[0]) {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export const GET: APIRoute = async (context) => {
  if (!(await requireAdmin(context))) return json({ error: 'Forbidden' }, 403);

  const url = new URL(context.request.url);
  const status = url.searchParams.get('status') || 'pending';
  const tourId = url.searchParams.get('tour_id');

  let query = supabase.from('tour_reviews').select('*');
  if (tourId) query = query.eq('tour_id', tourId);
  if (status === 'pending') query = query.eq('verified', false);
  if (status === 'verified') query = query.eq('verified', true);
  query = query.order('created_at', { ascending: false }).limit(200);

  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);
  return json({ reviews: data || [], count: data?.length || 0 });
};

interface CreateBody {
  tour_id?: string;
  author?: string;
  author_country?: string;
  rating?: number;
  body?: string;
  source?: string;
  date_published?: string;
  // Admin-created reviews can be auto-verified if the admin is confident
  // (e.g. transcribed from a verified email). Default false.
  verified?: boolean;
  moderation_note?: string;
}

export const POST: APIRoute = async (context) => {
  if (!(await requireAdmin(context))) return json({ error: 'Forbidden' }, 403);

  let body: CreateBody;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  if (!body.tour_id || !body.author || typeof body.rating !== 'number') {
    return json({ error: 'tour_id, author, and rating are required' }, 400);
  }
  if (body.rating < 1 || body.rating > 5) {
    return json({ error: 'rating must be 1-5' }, 400);
  }

  const insert = {
    tour_id: body.tour_id,
    author: String(body.author).trim(),
    author_country: body.author_country?.trim() || null,
    rating: Math.round(body.rating),
    body: body.body?.trim() || null,
    source: body.source || 'manual',
    date_published: body.date_published || new Date().toISOString(),
    verified: Boolean(body.verified),
    moderation_note: body.moderation_note || null,
  };

  const { data, error } = await supabase.from('tour_reviews').insert(insert).select().single();
  if (error) return json({ error: error.message }, 500);

  // If the new review is verified AND it tips a tour over the
  // ≥3-verified threshold, ping IndexNow so Bing/Yandex re-crawl the
  // tour page promptly. Best-effort — failures don't block the response.
  if (insert.verified) {
    await maybeIndexNowOnVerify(insert.tour_id);
  }

  return json({ review: data }, 201);
};

interface PatchBody {
  verified?: boolean;
  rating?: number;
  body?: string;
  author?: string;
  moderation_note?: string;
}

export const PATCH: APIRoute = async (context) => {
  if (!(await requireAdmin(context))) return json({ error: 'Forbidden' }, 403);

  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id query param required' }, 400);

  let body: PatchBody;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const update: Record<string, unknown> = {};
  if (typeof body.verified === 'boolean') update.verified = body.verified;
  if (typeof body.rating === 'number' && body.rating >= 1 && body.rating <= 5) update.rating = Math.round(body.rating);
  if (typeof body.body === 'string') update.body = body.body.trim() || null;
  if (typeof body.author === 'string' && body.author.trim()) update.author = body.author.trim();
  if (typeof body.moderation_note === 'string') update.moderation_note = body.moderation_note;
  if (Object.keys(update).length === 0) return json({ error: 'no updatable fields' }, 400);

  const { data, error } = await supabase
    .from('tour_reviews')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) return json({ error: error.message }, 500);

  // If we just flipped to verified, push the tour page to IndexNow.
  if (update.verified === true && data?.tour_id) {
    await maybeIndexNowOnVerify(data.tour_id);
  }
  return json({ review: data });
};

export const DELETE: APIRoute = async (context) => {
  if (!(await requireAdmin(context))) return json({ error: 'Forbidden' }, 403);
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id query param required' }, 400);

  const { error } = await supabase.from('tour_reviews').delete().eq('id', id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
};

// Helper: when a review is verified, look up the tour slug and submit to
// IndexNow so the new AggregateRating gets crawled within hours. Silent
// no-op when INDEXNOW_KEY isn't set (see src/lib/seo/indexnow.ts).
async function maybeIndexNowOnVerify(tourId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('tours')
      .select('slug')
      .eq('id', tourId)
      .single();
    if (data?.slug) {
      await submitToIndexNow([`https://www.findtoursin.com/tours/${data.slug}`]);
    }
  } catch {
    // best-effort
  }
}
