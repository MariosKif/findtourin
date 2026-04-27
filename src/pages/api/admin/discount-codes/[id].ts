// src/pages/api/admin/discount-codes/[id].ts
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
const VALID_PLAN_IDS = new Set(['starter', 'professional', 'enterprise', 'ultimate']);

export const GET: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const id = context.params.id;
  if (!id) return json({ error: 'Not found' }, 404);
  const { data: code } = await supabase
    .from('discount_codes').select('*').eq('id', id).maybeSingle();
  if (!code) return json({ error: 'Not found' }, 404);
  const { data: redemptions } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_id, is_active, started_at, deactivated_at')
    .eq('discount_code_id', id)
    .order('started_at', { ascending: false });
  return json({ code, redemptions: redemptions || [] });
};

export const PATCH: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const id = context.params.id;
  if (!id) return json({ error: 'Not found' }, 404);
  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.is_active !== undefined) updates.is_active = !!body.is_active;
  if (body.description !== undefined) updates.description = body.description ? String(body.description) : null;
  if (body.max_redemptions !== undefined) {
    if (body.max_redemptions === null || body.max_redemptions === '') updates.max_redemptions = null;
    else {
      const n = Number(body.max_redemptions);
      if (!Number.isInteger(n) || n < 1) return json({ error: 'max_redemptions must be null or positive integer' }, 400);
      updates.max_redemptions = n;
    }
  }
  if (body.applies_to_plans !== undefined) {
    if (!Array.isArray(body.applies_to_plans)) return json({ error: 'applies_to_plans must be array' }, 400);
    if (body.applies_to_plans.some((p: string) => !VALID_PLAN_IDS.has(p)))
      return json({ error: 'applies_to_plans contains unknown plan id' }, 400);
    updates.applies_to_plans = body.applies_to_plans;
  }

  const { data, error } = await supabase
    .from('discount_codes').update(updates).eq('id', id).select().maybeSingle();
  if (error) {
    if ((error as { code?: string }).code === '23505') return json({ error: 'Code already exists' }, 409);
    return json({ error: error.message }, 500);
  }
  if (!data) return json({ error: 'Not found' }, 404);
  return json(data);
};

export const DELETE: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const id = context.params.id;
  if (!id) return json({ error: 'Not found' }, 404);
  const { data, error } = await supabase
    .from('discount_codes').delete().eq('id', id).select();
  if (error) return json({ error: error.message }, 500);
  if (!data || data.length === 0) return json({ error: 'Not found' }, 404);
  return json({ success: true });
};
