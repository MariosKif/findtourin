// src/pages/api/admin/config.ts
// GET / PATCH a single config row keyed by 'pricing'. Admin only.
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { supabase } from '../../../lib/supabase';

export const prerender = false;
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { data, error } = await supabase.from('config').select('*').eq('key', 'pricing').maybeSingle();
  if (error) return json({ error: error.message }, 500);
  return json(data || { key: 'pricing', value: { support_email: 'info@findtoursin.com', maintenance_mode: false } });
};

export const PATCH: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!body || typeof body.value !== 'object') return json({ error: 'value object required' }, 400);

  const { data, error } = await supabase
    .from('config')
    .upsert({ key: 'pricing', value: body.value }, { onConflict: 'key' })
    .select()
    .single();
  if (error) return json({ error: error.message }, 500);
  return json(data);
};
