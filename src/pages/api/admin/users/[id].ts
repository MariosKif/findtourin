import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  });

async function requireAdmin(context: Parameters<APIRoute>[0]) {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export const GET: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing user ID' }, 400);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !user) return json({ error: 'User not found' }, 404);

  return json(user);
};

export const PUT: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing user ID' }, 400);

  let body: any = {};
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.role !== undefined) updateData.role = body.role;
  if (body.isVerified !== undefined) updateData.is_verified = body.isVerified;

  const { data: updated, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('PUT /api/admin/users/[id] update error', { id, updateData, error });
    return json({ error: error.message, code: error.code }, 500);
  }
  if (!updated) {
    console.error('PUT /api/admin/users/[id] no row updated', { id, updateData });
    return json({ error: 'User not found', id }, 404);
  }

  return json(updated);
};

export const DELETE: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing user ID' }, 400);

  // Delete from auth (also cascades to users table due to FK)
  try { await supabase.auth.admin.deleteUser(id); } catch { /* user may not exist in Auth */ }

  // Also explicitly delete from users table in case cascade didn't fire
  await supabase.from('users').delete().eq('id', id);

  return json({ success: true });
};
