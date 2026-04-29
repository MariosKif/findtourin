// src/pages/api/stripe/checkout-plan.ts
// Creates a Stripe Checkout Session in subscription mode for an agency plan.
// Authenticated agency/admin only — unauthenticated users are redirected to
// /auth/register?plan=<id> so they can create an account first.
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { stripe } from '../../../lib/stripe';
import { getPlan } from '../../../lib/pricing';

export const prerender = false;

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

async function parseInputs(request: Request) {
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const fd = await request.formData();
    return {
      planId: String(fd.get('planId') || ''),
      billingPeriod: (fd.get('billingPeriod') === 'annual' ? 'annual' : 'monthly') as 'monthly' | 'annual',
      isForm: true,
    };
  }
  const body = await request.json().catch(() => ({}));
  return {
    planId: String(body.planId || ''),
    billingPeriod: body.billingPeriod === 'annual' ? 'annual' : 'monthly' as 'monthly' | 'annual',
    isForm: false,
  };
}

export const POST: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  const { planId, billingPeriod, isForm } = await parseInputs(context.request);

  if (!user) {
    // Bounce them to register, baking the plan into the URL.
    return context.redirect(`/auth/register?plan=${encodeURIComponent(planId)}`, 303);
  }
  if (user.role !== 'agency' && user.role !== 'admin') {
    return json({ error: 'Forbidden' }, 403);
  }

  const plan = getPlan(planId);
  if (!plan) return json({ error: 'Unknown plan' }, 400);

  const unitAmount = billingPeriod === 'annual' ? plan.annualPriceCents : plan.monthlyPriceCents;
  const interval = billingPeriod === 'annual' ? 'year' : 'month';
  const origin = new URL(context.request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `FindToursIn ${plan.name}` },
          unit_amount: unitAmount,
          recurring: { interval },
        },
        quantity: 1,
      }],
      metadata: {
        agencyId: user.id,
        planId: plan.id,
        planName: plan.name,
        billingPeriod,
      },
      success_url: `${origin}/dashboard/subscription?activated=${plan.id}`,
      cancel_url: `${origin}/pricing?cancelled=1`,
    });

    if (isForm) return context.redirect(session.url!, 303);
    return json({ url: session.url });
  } catch (err: any) {
    console.error('checkout-plan: stripe error', err);
    return json({ error: err?.message || 'Failed to create checkout session' }, 500);
  }
};
