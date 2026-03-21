import type { APIRoute } from 'astro';
import { createSupabaseServerClient, supabaseAdmin } from '../../../lib/supabase';
import { db } from '../../../lib/db';
import { profiles } from '../../../lib/db/schema';

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

    // Create auth user via admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return json({ error: authError.message }, 400);
    }

    // Insert profile row
    await db.insert(profiles).values({
      id: authData.user.id,
      email,
      name,
      role: role || 'user',
      phone: phone || null,
      website: website || null,
      companyName: companyName || null,
    });

    // Sign in to set session cookies
    const supabase = createSupabaseServerClient(context);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return json({ error: 'Account created but sign-in failed. Please log in.' }, 500);
    }

    return json({ success: true, role: role || 'user' });
  } catch (error) {
    console.error('Registration error:', error);
    return json({ error: 'Registration failed' }, 500);
  }
};
