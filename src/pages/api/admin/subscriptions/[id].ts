// src/pages/api/admin/subscriptions/[id].ts
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

export const PATCH: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const id = context.params.id;
  if (!id) return json({ error: 'Not found' }, 404);

  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (typeof body.is_active !== 'boolean' && body.expires_at === undefined) {
    return json({ error: 'is_active boolean or expires_at required' }, 400);
  }

  const now = new Date().toISOString();
  const updates: Record<string, any> = { updated_at: now };

  if (typeof body.is_active === 'boolean') {
    updates.is_active = body.is_active;
    updates.deactivated_at = body.is_active ? null : now;
  }
  if (body.expires_at !== undefined) {
    if (body.expires_at === null || body.expires_at === '') {
      updates.expires_at = null;
    } else {
      const t = Date.parse(String(body.expires_at));
      if (Number.isNaN(t)) return json({ error: 'expires_at must be ISO timestamp or null' }, 400);
      updates.expires_at = new Date(t).toISOString();
    }
  }

  const { data, error } = await supabase
    .from('subscriptions').update(updates).eq('id', id).select().maybeSingle();
  if (error) {
    if ((error as { code?: string }).code === '23505')
      return json({ error: 'User already has an active subscription' }, 409);
    return json({ error: error.message }, 500);
  }
  if (!data) return json({ error: 'Not found' }, 404);
  return json(data);
};
