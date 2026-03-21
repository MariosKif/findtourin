import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
import { db } from '../../../lib/db';
import { profiles } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';

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

    const supabase = createSupabaseServerClient(context);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return json({ error: 'Invalid email or password' }, 401);
    }

    // Get user role from profiles
    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, data.user.id))
      .limit(1);

    return json({ success: true, role: profile?.role || 'user' });
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Login failed' }, 500);
  }
};
