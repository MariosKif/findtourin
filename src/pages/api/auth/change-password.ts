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
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return json({ error: 'New password must be at least 8 characters' }, 400);
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error) {
      return json({ error: 'Failed to update password' }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return json({ error: 'Failed to update password' }, 500);
  }
};
