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
    const { email, password } = body;

    if (!email || !password) {
      return json({ error: 'Email and password are required' }, 400);
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return json({ error: 'Invalid email or password' }, 401);
    }

    const { session } = data;

    // Set auth cookies
    context.cookies.set('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14, // 14 days
    });

    context.cookies.set('sb-refresh-token', session.refresh_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });

    // Fetch user profile for role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    return json({ success: true, role: profile?.role || 'user' });
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Login failed' }, 500);
  }
};
