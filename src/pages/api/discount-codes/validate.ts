// src/pages/api/discount-codes/validate.ts
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { getPlan } from '../../../lib/pricing';
import { validateForPlan } from '../../../lib/discount-codes';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { code, planId } = body || {};
  if (!code || !planId) return json({ error: 'code and planId required' }, 400);
  if (!getPlan(planId)) return json({ error: 'Unknown plan' }, 400);

  const result = await validateForPlan(code, planId);
  return json(result);
};
