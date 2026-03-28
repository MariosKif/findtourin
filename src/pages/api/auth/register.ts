import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

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

    return json({ success: true, role: role || 'user' });
  } catch (error: any) {
    console.error('Registration error:', error);
    return json({ error: 'Registration failed' }, 500);
  }
};
