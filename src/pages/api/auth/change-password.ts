import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase';
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

    await adminAuth.updateUser(user.id, { password: newPassword });

    return json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return json({ error: 'Failed to update password' }, 500);
  }
};
