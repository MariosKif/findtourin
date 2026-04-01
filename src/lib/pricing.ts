// Tour listing pricing model
// Base: €3.99/listing/month + VAT
// Volume discounts: 10+ = 10%, 20+ = 15%, 30+ = 20%, 40+ = 25%
// Annual billing: additional 10% discount

const BASE_PRICE_CENTS = 399; // €3.99 in cents
const VAT_RATE = 0.24; // 24% Greek VAT

export interface PricingTier {
  minListings: number;
  maxListings: number | null;
  discount: number;
  label: string;
}

export const PRICING_TIERS: PricingTier[] = [
  { minListings: 1, maxListings: 9, discount: 0, label: 'Starter' },
  { minListings: 10, maxListings: 19, discount: 0.10, label: 'Growth' },
  { minListings: 20, maxListings: 29, discount: 0.15, label: 'Professional' },
  { minListings: 30, maxListings: 39, discount: 0.20, label: 'Business' },
  { minListings: 40, maxListings: null, discount: 0.25, label: 'Enterprise' },
];

export const ANNUAL_DISCOUNT = 0.10; // 10% additional for annual billing

export type BillingPeriod = 'monthly' | 'annual';

export function getTier(listingCount: number): PricingTier {
  for (const tier of [...PRICING_TIERS].reverse()) {
    if (listingCount >= tier.minListings) return tier;
  }
  return PRICING_TIERS[0];
}

export function calculatePricePerListing(listingCount: number, period: BillingPeriod = 'monthly'): number {
  const tier = getTier(listingCount);
  let pricePerListing = BASE_PRICE_CENTS * (1 - tier.discount);

  if (period === 'annual') {
    pricePerListing = pricePerListing * (1 - ANNUAL_DISCOUNT);
  }

  return Math.round(pricePerListing);
}

export function calculateTotal(listingCount: number, period: BillingPeriod = 'monthly') {
  const pricePerListing = calculatePricePerListing(listingCount, period);
  const subtotal = pricePerListing * listingCount;
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;

  // For annual, multiply by 12
  const monthlySubtotal = subtotal;
  const monthlyVat = vat;
  const monthlyTotal = total;

  return {
    pricePerListingCents: pricePerListing,
    listingCount,
    period,
    tier: getTier(listingCount),
    subtotalCents: period === 'annual' ? monthlySubtotal * 12 : monthlySubtotal,
    vatCents: period === 'annual' ? monthlyVat * 12 : monthlyVat,
    totalCents: period === 'annual' ? monthlyTotal * 12 : monthlyTotal,
    monthlyCostCents: monthlyTotal,
    savings: period === 'annual' ? Math.round(monthlyTotal * 12 * ANNUAL_DISCOUNT) : 0,
  };
}

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
