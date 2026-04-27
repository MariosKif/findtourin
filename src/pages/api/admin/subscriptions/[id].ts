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
  if (typeof body.is_active !== 'boolean') return json({ error: 'is_active boolean required' }, 400);

  const now = new Date().toISOString();
  const updates: Record<string, any> = { is_active: body.is_active, updated_at: now };
  if (!body.is_active) updates.deactivated_at = now;
  else updates.deactivated_at = null;

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
