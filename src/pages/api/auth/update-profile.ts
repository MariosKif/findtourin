import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = await context.request.json();
    const { name, phone, website, companyName, companyDesc } = body;

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (website !== undefined) updateData.website = website || null;
    if (companyName !== undefined) updateData.company_name = companyName || null;
    if (companyDesc !== undefined) updateData.company_desc = companyDesc || null;

    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return json({ error: 'Failed to update profile' }, 500);
    }

    return json({ success: true, user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    return json({ error: 'Failed to update profile' }, 500);
  }
};
