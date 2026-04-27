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
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code)
    .limit(1)
    .maybeSingle();
  if (error) {
    // Outage / schema drift / RLS quirk — caller should see a real error,
    // not a silent "not found".
    throw new Error(`Failed to look up discount code: ${error.message}`);
  }
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
 * Atomically redeem a code by delegating to the redeem_discount_code Postgres
 * function. The function takes a row lock on the discount_codes row, re-checks
 * is_active / max_redemptions / applies_to_plans, deactivates any prior active
 * subscription for the user, and inserts the new one — all in one transaction.
 * This closes the deactivate→insert race window and the cap TOCTOU that the
 * previous JS implementation had.
 *
 * Validation failures from the function arrive as Postgres P0001 errors with
 * the user-facing message in `error.message`, which we surface verbatim.
 */
export async function redeemForUser(args: {
  rawCode: string;
  planId: string;
  userId: string;
}): Promise<{ subscriptionId: string }> {
  const { data, error } = await supabase.rpc('redeem_discount_code', {
    p_raw_code: args.rawCode,
    p_plan_id: args.planId,
    p_user_id: args.userId,
  });
  if (error) {
    throw new Error(error.message || 'Failed to redeem code');
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.subscription_id) {
    throw new Error('Failed to redeem code');
  }
  return { subscriptionId: row.subscription_id as string };
}
