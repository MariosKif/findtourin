// src/lib/discount-codes.ts
// Server-side helpers for discount code validation and redemption.
// The service-role Supabase client bypasses RLS — never call these from the browser.
import { supabase } from './supabase';

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  max_redemptions: number | null;
  current_redemptions: number;
  applies_to_plans: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ValidationFailureReason =
  | 'not_found'
  | 'inactive'
  | 'exhausted'
  | 'plan_not_eligible';

export interface ValidationResult {
  valid: true;
  code: DiscountCode;
}

export interface ValidationFailure {
  valid: false;
  reason: ValidationFailureReason;
  message: string;
}

export async function findByCode(rawCode: string): Promise<DiscountCode | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  const { data } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code)
    .limit(1)
    .maybeSingle();
  return (data as DiscountCode) || null;
}

export async function validateForPlan(
  rawCode: string,
  planId: string,
): Promise<ValidationResult | ValidationFailure> {
  const code = await findByCode(rawCode);
  if (!code) return { valid: false, reason: 'not_found', message: 'Code not found.' };
  if (!code.is_active) return { valid: false, reason: 'inactive', message: 'This code is currently disabled.' };
  if (code.max_redemptions !== null && code.current_redemptions >= code.max_redemptions) {
    return { valid: false, reason: 'exhausted', message: 'This code has reached its redemption limit.' };
  }
  if (code.applies_to_plans.length > 0 && !code.applies_to_plans.includes(planId)) {
    return { valid: false, reason: 'plan_not_eligible', message: 'This code does not apply to the selected plan.' };
  }
  return { valid: true, code };
}

/**
 * Atomically redeem a code: deactivate any prior active subscription for this user,
 * then insert a new active subscription (source='discount_code').
 * The DB trigger bumps discount_codes.current_redemptions.
 * Throws if validation fails (re-checked here to prevent races).
 */
export async function redeemForUser(args: {
  rawCode: string;
  planId: string;
  userId: string;
}): Promise<{ subscriptionId: string; code: DiscountCode }> {
  const validation = await validateForPlan(args.rawCode, args.planId);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  const now = new Date().toISOString();

  await supabase
    .from('subscriptions')
    .update({ is_active: false, deactivated_at: now, updated_at: now })
    .eq('user_id', args.userId)
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: args.userId,
      plan_id: args.planId,
      source: 'discount_code',
      discount_code_id: validation.code.id,
      is_active: true,
      started_at: now,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(error?.message || 'Failed to create subscription');
  }
  return { subscriptionId: data.id, code: validation.code };
}
