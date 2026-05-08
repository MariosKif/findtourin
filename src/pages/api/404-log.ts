// 404 hit logger. The 404 page beacons here on render so we can identify
// missing content opportunities and link rot.
//
// Public endpoint by design — anyone landing on a 404 page should be able
// to log it without authentication. We mitigate abuse by:
//   1. Rate-limiting to the request body (max 1 KB)
//   2. Only logging same-host paths (rejecting absolute URLs)
//   3. Hour-bucketing so a bot hitting the same 404 5,000 times in a row
//      writes one row, not 5,000
//   4. Silently failing if the not_found_log table doesn't exist (the
//      migration hasn't been applied yet)

import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

const MAX_BODY = 1024;
const MAX_PATH = 500;
const MAX_REFERER = 500;

interface LogBody {
  path?: string;
  referer?: string;
}

export const POST: APIRoute = async ({ request }) => {
  // Cap body size to avoid log-volume abuse.
  const text = await request.text();
  if (text.length > MAX_BODY) return new Response('Too large', { status: 413 });

  let body: LogBody;
  try { body = JSON.parse(text); } catch { return new Response('Bad JSON', { status: 400 }); }

  const path = (body.path || '').trim().slice(0, MAX_PATH);
  const referer = (body.referer || '').trim().slice(0, MAX_REFERER);
  // Reject if path is empty, includes scheme, or starts with //
  if (!path || path.startsWith('http') || path.startsWith('//') || !path.startsWith('/')) {
    return new Response('Bad path', { status: 400 });
  }

  const ua = (request.headers.get('user-agent') || '').slice(0, 300);
  const country = request.headers.get('x-vercel-ip-country') || null;

  // Upsert on (path, hour_bucket): first hit inserts a row with hits=1;
  // subsequent hits within the same hour increment hits and update
  // last_seen. The unique index on (path, hour_bucket) is required.
  try {
    const hourBucket = new Date();
    hourBucket.setMinutes(0, 0, 0);
    const hourIso = hourBucket.toISOString();

    // Atomic upsert via on-conflict. PostgREST translates this to:
    //   INSERT ... ON CONFLICT (path, hour_bucket) DO UPDATE SET hits = hits + 1, last_seen = now()
    const { error } = await supabase.rpc('log_not_found', {
      p_path: path,
      p_referer: referer || null,
      p_user_agent: ua || null,
      p_ip_country: country,
      p_hour_bucket: hourIso,
    });

    // RPC may not exist if migration was applied without the helper
    // function — fall back to a manual upsert.
    if (error) {
      const { error: insertErr } = await supabase
        .from('not_found_log')
        .upsert(
          {
            path,
            referer: referer || null,
            user_agent: ua || null,
            ip_country: country,
            hour_bucket: hourIso,
            hits: 1,
            last_seen: new Date().toISOString(),
          },
          { onConflict: 'path,hour_bucket', ignoreDuplicates: false },
        );
      if (insertErr) {
        // Silent failure — table missing is the expected state until the
        // migration is applied. We don't surface a 500 to the page that
        // beaconed because the user-facing 404 already rendered.
        return new Response(null, { status: 204 });
      }
    }
  } catch {
    // Silent failure
  }

  return new Response(null, { status: 204 });
};
