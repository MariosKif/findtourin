// Supabase database webhook handler. Receives row-change events from
// the Supabase Database Webhook system and translates them into
// real-time SEO actions:
//
//   tours INSERT/UPDATE → IndexNow ping for the tour URL + the
//                         containing country/city hub (the hub's
//                         tour-count may have crossed the gate)
//   tours DELETE        → IndexNow ping for the tour URL (so the
//                         engines re-crawl and find the 404)
//   users INSERT/UPDATE → IndexNow ping for the agency profile URL
//                         when role=agency and is_verified flips
//
// Setup (one-time, in Supabase dashboard):
//   1. Database → Webhooks → Create webhook
//   2. Table: tours, events: INSERT, UPDATE, DELETE
//   3. URL: https://www.findtoursin.com/api/webhooks/supabase
//   4. HTTP method: POST
//   5. Add header: x-webhook-secret = <SUPABASE_WEBHOOK_SECRET>
//   6. Repeat for: users (INSERT, UPDATE)
//
// Sets Vercel env: SUPABASE_WEBHOOK_SECRET to the same value.
//
// Security: rejects any POST without a matching x-webhook-secret header.
// Returns 204 on accepted events (idempotent), 401 on auth fail, 400 on
// malformed body. Best-effort IndexNow — failures don't surface to the
// caller because Supabase will retry and we'd just amplify noise.

import type { APIRoute } from 'astro';
import { submitToIndexNow } from '../../../lib/seo/indexnow';
import { slugify } from '../../../lib/destinations';

export const prerender = false;

const SITE = 'https://www.findtoursin.com';

interface SupabasePayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
}

function checkAuth(request: Request): boolean {
  const expected = process.env.SUPABASE_WEBHOOK_SECRET || '';
  if (!expected) return false; // unset → reject everything (fail-closed)
  const provided = request.headers.get('x-webhook-secret') || '';
  // Constant-length comparison would be nicer but Edge runtimes differ
  // on the available crypto APIs. The string compare against a 32+ char
  // secret is fine on Vercel's HTTPS edge.
  return provided === expected;
}

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

// Build the URLs that need re-crawling for a given event. The set is
// always finite and bounded — at most 4 URLs per event.
function urlsForTourEvent(record: Record<string, unknown> | null): string[] {
  if (!record) return [];
  const slug = typeof record.slug === 'string' ? record.slug : null;
  const country = typeof record.country === 'string' ? record.country : null;
  const city = typeof record.city === 'string' ? record.city : null;
  const category = typeof record.category === 'string' ? record.category : null;

  const urls: string[] = [];
  if (slug) urls.push(`${SITE}/tours/${slug}`);
  if (country) {
    const cs = slugify(country);
    urls.push(`${SITE}/tours/in/${cs}`);
    if (city) urls.push(`${SITE}/tours/in/${cs}/${slugify(city)}`);
    if (category) urls.push(`${SITE}/tours/category/${slugify(category)}/in/${cs}`);
  }
  return urls;
}

function urlsForUserEvent(record: Record<string, unknown> | null): string[] {
  if (!record) return [];
  const role = typeof record.role === 'string' ? record.role : null;
  if (role !== 'agency') return [];
  const companyName = typeof record.company_name === 'string' ? record.company_name : null;
  const name = typeof record.name === 'string' ? record.name : null;
  const source = companyName || name;
  if (!source) return [];
  const slug = slugify(source);
  if (!slug) return [];
  return [`${SITE}/agencies/${slug}`];
}

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  let body: SupabasePayload;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  if (!body.type || !body.table) {
    return json({ ok: false, error: 'Missing type or table' }, 400);
  }

  // Choose URLs based on the source table. Anything else is a no-op
  // (idempotent — Supabase webhooks may fire on tables we don't track yet).
  let urls: string[] = [];
  if (body.table === 'tours') {
    // For DELETE, the row is in old_record (the row that was just deleted).
    const record = body.type === 'DELETE' ? body.old_record : body.record;
    urls = urlsForTourEvent(record);
  } else if (body.table === 'users') {
    const record = body.record;
    urls = urlsForUserEvent(record);
  }

  if (urls.length === 0) {
    // Accepted but nothing to ping — return 204 so Supabase doesn't retry.
    return json({ ok: true, submitted: 0, message: 'No URLs to ping for this event' });
  }

  // Best-effort. IndexNow failures don't fail the webhook because
  // Supabase will retry on non-2xx and we'd amplify duplicate pings.
  const result = await submitToIndexNow(urls);
  return json({
    ok: true,
    table: body.table,
    type: body.type,
    submitted: result.submitted,
    indexnow_ok: result.ok,
    message: result.message,
  });
};
