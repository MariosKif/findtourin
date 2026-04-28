// src/pages/api/admin/discount-codes/index.ts
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const VALID_PLAN_IDS = new Set(['starter', 'professional', 'enterprise', 'ultimate']);

export const GET: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { data, error } = await supabase
    .from('discount_codes').select('*')
    .order('created_at', { ascending: false });
  if (error) return json({ error: error.message }, 500);
  return json(data);
};

export const POST: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const code = String(body.code || '').trim().toUpperCase();
  const max_redemptions =
    body.max_redemptions === null || body.max_redemptions === undefined || body.max_redemptions === ''
      ? null
      : Number(body.max_redemptions);
  const max_per_user =
    body.max_per_user === null || body.max_per_user === undefined || body.max_per_user === ''
      ? null
      : Number(body.max_per_user);
  const grants_duration_days =
    body.grants_duration_days === null || body.grants_duration_days === undefined || body.grants_duration_days === ''
      ? null
      : Number(body.grants_duration_days);
  const applies_to_plans: string[] = Array.isArray(body.applies_to_plans) ? body.applies_to_plans : [];
  const description = body.description ? String(body.description) : null;
  const is_active = body.is_active !== false;

  if (!/^[A-Z0-9-]{3,32}$/.test(code))
    return json({ error: 'Code must be 3–32 chars [A-Z0-9-]' }, 400);
  if (max_redemptions !== null && (!Number.isInteger(max_redemptions) || max_redemptions < 1))
    return json({ error: 'max_redemptions must be null or positive integer' }, 400);
  if (max_per_user !== null && (!Number.isInteger(max_per_user) || max_per_user < 1))
    return json({ error: 'max_per_user must be null or positive integer' }, 400);
  if (grants_duration_days !== null && (!Number.isInteger(grants_duration_days) || grants_duration_days < 1))
    return json({ error: 'grants_duration_days must be null or positive integer' }, 400);
  if (applies_to_plans.some((p) => !VALID_PLAN_IDS.has(p)))
    return json({ error: 'applies_to_plans contains unknown plan id' }, 400);

  const { data, error } = await supabase
    .from('discount_codes')
    .insert({ code, description, max_redemptions, max_per_user, grants_duration_days, applies_to_plans, is_active, created_by: user.id })
    .select().single();
  if (error) {
    if ((error as { code?: string }).code === '23505') return json({ error: 'Code already exists' }, 409);
    return json({ error: error.message }, 500);
  }
  return json(data, 201);
};
