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
    const accessToken = context.cookies.get('sb-access-token')?.value;
    if (!accessToken) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authUser) {
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

    const { error: upsertError } = await supabase.from('users').upsert({
      id: authUser.id,
      email: authUser.email!,
      name,
      role,
      phone: phone || null,
      website: website || null,
      company_name: companyName || null,
      company_desc: null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      is_verified: false,
      stripe_customer_id: null,
    });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return json({ error: 'Failed to complete profile' }, 500);
    }

    return json({ success: true, role });
  } catch (error) {
    console.error('Complete profile error:', error);
    return json({ error: 'Failed to complete profile' }, 500);
  }
};
