import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { findByCode } from '../../../lib/discount-codes';
import { getPlan } from '../../../lib/pricing';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { email, password, name, role, companyName, phone, website } = body;
    const discountCode: string = String(body.discountCode || '').trim();

    if (!email || !password || !name) {
      return json({ error: 'Missing required fields: email, password, name' }, 400);
    }

    if (role && !['user', 'agency'].includes(role)) {
      return json({ error: 'Invalid role' }, 400);
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      if (authError.message.includes('already') || authError.message.includes('exists')) {
        return json({ error: 'Email already in use' }, 400);
      }
      return json({ error: 'Registration failed' }, 500);
    }

    // Create user profile
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      name,
      role: role || 'user',
      phone: phone || null,
      website: website || null,
      company_name: companyName || null,
      company_desc: null,
      avatar_url: null,
      is_verified: false,
      stripe_customer_id: null,
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // Optional discount-code redemption (agency role only)
    let activatedPlan: string | null = null;
    let codeFailedReason: string | null = null;
    if (discountCode && (role || 'user') === 'agency') {
      try {
        const code = await findByCode(discountCode);
        if (!code) {
          codeFailedReason = 'not_found';
        } else if (!code.is_active) {
          codeFailedReason = 'inactive';
        } else {
          // Pick plan: single allowed → use it; empty (any) → professional; multi → first.
          const planId = code.applies_to_plans.length === 1
            ? code.applies_to_plans[0]
            : code.applies_to_plans.length === 0
              ? 'professional'
              : code.applies_to_plans[0];
          if (!getPlan(planId)) {
            codeFailedReason = 'plan_not_eligible';
          } else {
            const { error: rpcError } = await supabase.rpc('redeem_discount_code', {
              p_raw_code: discountCode,
              p_plan_id: planId,
              p_user_id: authData.user.id,
            });
            if (rpcError) {
              // RPC returns P0001 with user-facing messages for known failures.
              const msg = String(rpcError.message || '');
              if (msg.includes('Code not found')) codeFailedReason = 'not_found';
              else if (msg.includes('disabled')) codeFailedReason = 'inactive';
              else if (msg.includes('redemption limit')) codeFailedReason = 'exhausted';
              else if (msg.includes('does not apply')) codeFailedReason = 'plan_not_eligible';
              else if (msg.includes('maximum number of times')) codeFailedReason = 'per_user_exhausted';
              else codeFailedReason = 'rpc_failed';
              console.error('register: redeem failed', rpcError);
            } else {
              activatedPlan = planId;
            }
          }
        }
      } catch (err) {
        console.error('register: discount-code lookup failed', err);
        codeFailedReason = 'rpc_failed';
      }
    }

    // Sign in to get session
    const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });

    if (signInData?.session) {
      context.cookies.set('sb-access-token', signInData.session.access_token, {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 14,
      });

      context.cookies.set('sb-refresh-token', signInData.session.refresh_token, {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 14,
      });
    }

    return json({ success: true, role: role || 'user', activatedPlan, codeFailedReason });
  } catch (error: any) {
    console.error('Registration error:', error);
    return json({ error: 'Registration failed' }, 500);
  }
};
