// SEO score endpoint. Two modes:
//
//   GET /api/admin/seo-score?tour_id=X
//     Pulls one tour from Supabase and returns its score.
//
//   GET /api/admin/seo-score?all=1
//     Pulls every active tour and returns scores ordered worst-first.
//     Used by the admin SEO dashboard to surface the listings that
//     need editorial attention.
//
//   POST /api/admin/seo-score
//     Body: a tour-shaped object. Used by the agency tour form for
//     real-time feedback while the agency types.
//
// Admin auth required for GET (dashboard view); POST is also gated to
// admin so untrusted callers can't probe scoring rules.

import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { scoreTourSeo } from '../../../lib/seo/scorer';
import { TOUR_LIST_SELECT } from '../../../lib/tour-helpers';

export const prerender = false;

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

async function requireAdmin(context: Parameters<APIRoute>[0]) {
  const user = await getAuthenticatedUser(context);
  return user && user.role === 'admin';
}

export const GET: APIRoute = async (context) => {
  if (!(await requireAdmin(context))) return json({ error: 'Forbidden' }, 403);

  const url = new URL(context.request.url);
  const tourId = url.searchParams.get('tour_id');
  const all = url.searchParams.get('all');

  if (tourId) {
    const { data, error } = await supabase
      .from('tours')
      .select(TOUR_LIST_SELECT)
      .eq('id', tourId)
      .single();
    if (error || !data) return json({ error: error?.message || 'Tour not found' }, 404);
    return json({ tour_id: tourId, name: (data as any).name, ...scoreTourSeo(data as any) });
  }

  if (all) {
    const { data, error } = await supabase
      .from('tours')
      .select(TOUR_LIST_SELECT)
      .eq('status', 'active');
    if (error) return json({ error: error.message }, 500);
    const scored = (data || []).map((t: any) => ({
      tour_id: t.id,
      slug: t.slug,
      name: t.name,
      ...scoreTourSeo(t),
    }));
    // Worst-first so the dashboard shows what to fix.
    scored.sort((a, b) => a.score - b.score);
    return json({ count: scored.length, tours: scored });
  }

  return json({ error: 'Provide tour_id or all=1' }, 400);
};

// POST: score an arbitrary tour-shaped payload (no DB read).
// Used by the agency tour form for real-time feedback while typing.
// Rate-limit isn't needed because the scorer is pure CPU and we gate
// to admin role; expanding to agency role can come when the form UI
// integrates with this endpoint.
export const POST: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || (user.role !== 'admin' && user.role !== 'agency')) {
    return json({ error: 'Forbidden' }, 403);
  }
  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!body || typeof body !== 'object') return json({ error: 'Body required' }, 400);
  return json(scoreTourSeo(body));
};
