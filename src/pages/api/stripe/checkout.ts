import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { stripe } from '../../../lib/stripe';
import { getPlan, formatCents, type BillingPeriod } from '../../../lib/pricing';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'agency' && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    const contentType = context.request.headers.get('content-type') || '';
    let planId = 'starter';
    let billingPeriod: BillingPeriod = 'monthly';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await context.request.formData();
      planId = (formData.get('planId') as string) || 'starter';
      billingPeriod = (formData.get('billingPeriod') as BillingPeriod) || 'monthly';
    } else {
      const body = await context.request.json();
      planId = body.planId || 'starter';
      billingPeriod = body.billingPeriod || 'monthly';
    }

    const plan = getPlan(planId);
    if (!plan) return json({ error: 'Invalid plan' }, 400);

    const origin = new URL(context.request.url).origin;
    const priceCents = billingPeriod === 'annual' ? plan.annualPriceCents : plan.monthlyPriceCents;
    const periodLabel = billingPeriod === 'annual' ? 'year' : 'month';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `FindToursIn ${plan.name} Plan`,
              description: `${plan.maxListings} tour listings, ${plan.maxImagesPerTour >= 999 ? 'unlimited' : plan.maxImagesPerTour} images/tour — billed ${periodLabel}ly`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        agencyId: user.id,
        planId,
        planName: plan.name,
        billingPeriod,
        maxListings: String(plan.maxListings),
        maxImagesPerTour: String(plan.maxImagesPerTour),
      },
      success_url: `${origin}/dashboard?payment=success&plan=${planId}`,
      cancel_url: `${origin}/dashboard/pricing?payment=cancelled`,
    });

    if (contentType.includes('application/x-www-form-urlencoded')) {
      return context.redirect(session.url!);
    }

    return json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return json({ error: 'Failed to create checkout session' }, 500);
  }
};
