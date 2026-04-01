import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { stripe } from '../../../lib/stripe';
import { calculateTotal, formatCents, type BillingPeriod } from '../../../lib/pricing';

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

    // Support both form data and JSON
    const contentType = context.request.headers.get('content-type') || '';
    let listingCount = 1;
    let billingPeriod: BillingPeriod = 'monthly';
    let tourId: string | null = null;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await context.request.formData();
      listingCount = parseInt(formData.get('listingCount') as string) || 1;
      billingPeriod = (formData.get('billingPeriod') as BillingPeriod) || 'monthly';
    } else {
      const body = await context.request.json();
      listingCount = body.listingCount || 1;
      billingPeriod = body.billingPeriod || 'monthly';
      tourId = body.tourId || null;
    }

    // Clamp listing count
    listingCount = Math.max(1, Math.min(100, listingCount));

    const pricing = calculateTotal(listingCount, billingPeriod);
    const origin = new URL(context.request.url).origin;

    const periodLabel = billingPeriod === 'annual' ? 'year' : 'month';
    const description = `${listingCount} tour listing${listingCount > 1 ? 's' : ''} — €${formatCents(pricing.pricePerListingCents)}/listing/${periodLabel === 'year' ? 'mo (billed annually)' : 'mo'}`;

    if (pricing.tier.discount > 0) {
      // Include discount info
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `FindToursIn — ${listingCount} Tour Listing${listingCount > 1 ? 's' : ''}`,
              description,
            },
            unit_amount: pricing.totalCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        agencyId: user.id,
        listingCount: String(listingCount),
        billingPeriod,
        pricePerListing: String(pricing.pricePerListingCents),
        tierLabel: pricing.tier.label,
        tourId: tourId || '',
      },
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/dashboard/pricing?payment=cancelled`,
    });

    // If form submission, redirect directly
    if (contentType.includes('application/x-www-form-urlencoded')) {
      return context.redirect(session.url!);
    }

    return json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return json({ error: 'Failed to create checkout session' }, 500);
  }
};
