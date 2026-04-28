// src/lib/subscriptions.ts
// Server-side helpers for resolving an agency's active plan and gating
// plan-capped operations (listing count, images per tour).
// The service-role Supabase client bypasses RLS — never call from the browser.
import { supabase } from './supabase';
import { getPlan, type PricingPlan } from './pricing';

const DEFAULT_PLAN_ID = 'starter';

export interface ActivePlan {
  plan: PricingPlan;
  subscriptionId: string | null; // null when defaulted (no active row)
  source: 'discount_code' | 'stripe' | null;
}

/**
 * Resolve the active subscription plan for a user. If no active row exists,
 * fall back to the starter plan so existing agencies without a subscription
 * keep working. Admins promote via /admin/subscriptions or discount-code
 * redemption.
 */
export async function getActivePlanForUser(userId: string): Promise<ActivePlan> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, plan_id, source, expires_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to look up subscription: ${error.message}`);
  }
  if (!data) {
    const fallback = getPlan(DEFAULT_PLAN_ID);
    if (!fallback) throw new Error(`Default plan ${DEFAULT_PLAN_ID} not found in PLANS`);
    return { plan: fallback, subscriptionId: null, source: null };
  }
  const plan = getPlan(data.plan_id);
  if (!plan) {
    // Subscription points at a plan that no longer exists. Fall back to default
    // rather than crashing the dashboard; this also surfaces the broken state.
    const fallback = getPlan(DEFAULT_PLAN_ID);
    if (!fallback) throw new Error(`Default plan ${DEFAULT_PLAN_ID} not found in PLANS`);
    return { plan: fallback, subscriptionId: data.id, source: data.source as ActivePlan['source'] };
  }
  return { plan, subscriptionId: data.id, source: data.source as ActivePlan['source'] };
}

/**
 * Count tours that occupy a "slot" against the agency's plan cap.
 * 'active' and 'pending_payment' both count; 'deleted' and 'inactive' do not.
 */
export async function countLiveListings(agencyId: string): Promise<number> {
  const { count, error } = await supabase
    .from('tours')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .in('status', ['active', 'pending_payment']);
  if (error) {
    throw new Error(`Failed to count tours: ${error.message}`);
  }
  return count ?? 0;
}

export interface ListingCapState {
  used: number;
  max: number;
  atCap: boolean;
  plan: PricingPlan;
}

export async function getListingCapState(userId: string): Promise<ListingCapState> {
  const [{ plan }, used] = await Promise.all([
    getActivePlanForUser(userId),
    countLiveListings(userId),
  ]);
  return { used, max: plan.maxListings, atCap: used >= plan.maxListings, plan };
}

/**
 * Throws a descriptive Error when the user is at or above their listing cap.
 * Callers translate Error.message into a 403 response.
 */
export async function assertCanCreateListing(userId: string): Promise<void> {
  const state = await getListingCapState(userId);
  if (state.atCap) {
    throw new Error(
      `You have reached your ${state.plan.name} plan limit of ${state.max} active listings. Upgrade your plan to add more.`,
    );
  }
}
