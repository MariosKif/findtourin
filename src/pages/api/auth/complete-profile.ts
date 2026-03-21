import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';
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
    const supabase = createSupabaseServerClient(context);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = await context.request.json();
    const { name, role, companyName, phone, website } = body;

    if (!name || !role) {
      return json({ error: 'Name and role are required' }, 400);
    }

    if (!['user', 'agency'].includes(role)) {
      return json({ error: 'Invalid role' }, 400);
    }

    // Insert profile row
    await db.insert(profiles).values({
      id: user.id,
      email: user.email!,
      name,
      role,
      phone: phone || null,
      website: website || null,
      companyName: companyName || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
    });

    return json({ success: true, role });
  } catch (error) {
    console.error('Complete profile error:', error);
    return json({ error: 'Failed to complete profile' }, 500);
  }
};
