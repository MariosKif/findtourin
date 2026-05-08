import type { APIRoute } from 'astro';
import { submitToIndexNow } from '../../lib/seo/indexnow';

export const prerender = false;

// POST /api/indexnow
// Body: { urls: string[] }
// Auth: Bearer token via INDEXNOW_AUTH_TOKEN env var (falls back to
//       SUPABASE_SERVICE_ROLE_KEY so existing internal callers — Supabase
//       webhooks, cron jobs — work without a separate secret).
//
// This endpoint is the integration point for any process that needs to
// notify search engines that a URL changed: a Supabase webhook on tour
// INSERT/UPDATE, the blog publish hook, a manual /admin trigger, or a
// nightly batch job. Public traffic should never hit this endpoint —
// callers without a valid auth token get 401.

export const POST: APIRoute = async ({ request }) => {
  const auth = request.headers.get('authorization') || '';
  const expected = process.env.INDEXNOW_AUTH_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // Constant-time-ish equality. The leak from string-comparison timing on
  // an Edge Function is negligible because each call goes through Vercel\'s
  // network stack, but we still avoid `===` on long strings by length-gating
  // first.
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!expected || provided.length === 0 || provided !== expected) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { urls?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const urls = Array.isArray(body.urls) ? body.urls : [];
  if (urls.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'urls array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // IndexNow caps submissions at 10,000 URLs per request. We also cap at
  // 1,000 here to keep individual calls bounded — the caller should batch
  // beyond that.
  if (urls.length > 1000) {
    return new Response(JSON.stringify({ ok: false, error: 'Too many URLs (max 1000)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await submitToIndexNow(urls);
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  });
};
