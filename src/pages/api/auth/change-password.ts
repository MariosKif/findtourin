import type { APIRoute } from 'astro';
import { createSupabaseServerClient, supabaseAdmin } from '../../../lib/supabase';
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return json({ error: 'Current password and new password are required' }, 400);
    }

    if (newPassword.length < 8) {
      return json({ error: 'New password must be at least 8 characters' }, 400);
    }

    // Verify current password by attempting sign-in
    const supabase = createSupabaseServerClient(context);
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return json({ error: 'Current password is incorrect' }, 400);
    }

    // Update password via admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword },
    );

    if (updateError) {
      return json({ error: 'Failed to update password' }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return json({ error: 'Failed to change password' }, 500);
  }
};
