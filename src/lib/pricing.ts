// Subscription pricing model
// 4 tiers with annual discount of 15%

export interface PricingPlan {
  id: string;
  name: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  maxListings: number;
  maxImagesPerTour: number;
  features: string[];
  popular?: boolean;
}

export const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPriceCents: 3999,
    annualPriceCents: 40790,
    maxListings: 15,
    maxImagesPerTour: 10,
    features: [
      'Up to 15 tour listings',
      '10 images per tour',
      'Full analytics',
      'Priority email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPriceCents: 6999,
    annualPriceCents: 71390,
    maxListings: 30,
    maxImagesPerTour: 10,
    popular: true,
    features: [
      'Up to 30 tour listings',
      '10 images per tour',
      'Full analytics + featured badge',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPriceCents: 12999,
    annualPriceCents: 132590,
    maxListings: 60,
    maxImagesPerTour: 10,
    features: [
      'Up to 60 tour listings',
      '10 images per tour',
      'Full analytics + priority placement',
      'Dedicated account manager',
    ],
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    monthlyPriceCents: 24999,
    annualPriceCents: 254990,
    maxListings: 140,
    maxImagesPerTour: 10,
    features: [
      'Up to 140 tour listings',
      '10 images per tour',
      'Full analytics + priority placement + homepage feature',
      'Dedicated account manager + custom branding',
    ],
  },
];

export type BillingPeriod = 'monthly' | 'annual';

export function getPlan(planId: string): PricingPlan | undefined {
  return PLANS.find(p => p.id === planId);
}

export function getPriceCents(plan: PricingPlan, period: BillingPeriod): number {
  return period === 'annual' ? plan.annualPriceCents : plan.monthlyPriceCents;
}

export function getMonthlyEquivalentCents(plan: PricingPlan, period: BillingPeriod): number {
  return period === 'annual' ? Math.round(plan.annualPriceCents / 12) : plan.monthlyPriceCents;
}

export function getAnnualSavingsCents(plan: PricingPlan): number {
  return (plan.monthlyPriceCents * 12) - plan.annualPriceCents;
}

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
