// src/pages/api/discount-codes/redeem.ts
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { getPlan } from '../../../lib/pricing';
import { redeemForUser } from '../../../lib/discount-codes';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  if (user.role !== 'agency' && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  const contentType = context.request.headers.get('content-type') || '';
  const isForm = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');

  let code = '';
  let planId = '';
  if (isForm) {
    const fd = await context.request.formData();
    code = String(fd.get('discountCode') || fd.get('code') || '');
    planId = String(fd.get('planId') || '');
  } else {
    const body = await context.request.json().catch(() => ({}));
    code = String(body.code || body.discountCode || '');
    planId = String(body.planId || '');
  }

  if (!code || !planId) return json({ error: 'code and planId required' }, 400);
  if (!getPlan(planId)) return json({ error: 'Unknown plan' }, 400);

  try {
    const { subscriptionId } = await redeemForUser({ rawCode: code, planId, userId: user.id });
    if (isForm) {
      return context.redirect(`/dashboard?activated=${planId}`);
    }
    return json({ success: true, subscriptionId, planId });
  } catch (err: any) {
    console.error('discount-code redeem failed', err);
    return json({ error: err?.message || 'Failed to redeem code' }, 400);
  }
};
