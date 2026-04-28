// src/pages/api/cron/expire-subscriptions.ts
// Vercel Cron POSTs here daily with Authorization: Bearer ${CRON_SECRET}.
// Deactivates subscriptions where expires_at has passed and is_active is true.
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

function checkAuth(request: Request): { ok: true } | { ok: false; reason: string } {
  const expected = import.meta.env.CRON_SECRET || process.env.CRON_SECRET || '';
  if (!expected) return { ok: false, reason: 'CRON_SECRET not configured' };
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader !== `Bearer ${expected}`) return { ok: false, reason: 'Forbidden' };
  return { ok: true };
}

export const POST: APIRoute = async ({ request }) => {
  const auth = checkAuth(request);
  if (!auth.ok) return json({ error: auth.reason }, auth.reason === 'CRON_SECRET not configured' ? 500 : 403);

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ is_active: false, deactivated_at: now, updated_at: now })
    .eq('is_active', true)
    .lt('expires_at', now)
    .select('id, user_id, plan_id, expires_at');

  if (error) {
    console.error('expire-subscriptions failed', error);
    return json({ error: error.message }, 500);
  }

  return json({ deactivated: data?.length ?? 0, ids: (data || []).map(r => r.id) });
};

// Manual smoke / dry-run — returns the count that WOULD be deactivated.
export const GET: APIRoute = async ({ request }) => {
  const auth = checkAuth(request);
  if (!auth.ok) return json({ error: auth.reason }, auth.reason === 'CRON_SECRET not configured' ? 500 : 403);
  const { count } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .lt('expires_at', new Date().toISOString());
  return json({ would_deactivate: count ?? 0 });
};
