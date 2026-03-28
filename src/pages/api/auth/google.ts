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
    const { access_token, refresh_token } = body;

    if (!access_token || !refresh_token) {
      return json({ error: 'Tokens are required' }, 400);
    }

    // Verify the token
    const { data: { user: authUser }, error } = await supabase.auth.getUser(access_token);

    if (error || !authUser) {
      return json({ error: 'Authentication failed' }, 401);
    }

    // Set auth cookies
    context.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });

    context.cookies.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });

    // Check if profile exists
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (profile) {
      return json({ success: true, role: profile.role, needsProfile: false });
    }

    return json({ success: true, needsProfile: true });
  } catch (error) {
    console.error('Google auth error:', error);
    return json({ error: 'Authentication failed' }, 500);
  }
};
