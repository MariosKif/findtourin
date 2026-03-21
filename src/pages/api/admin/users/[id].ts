import type { APIRoute } from 'astro';
import { adminAuth } from '../../../../lib/firebase';
import { usersCol, docToObj, Timestamp, type UserDoc } from '../../../../lib/firestore';
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

  const userDoc = await usersCol().doc(id).get();
  const user = docToObj<UserDoc>(userDoc);
  if (!user) return json({ error: 'User not found' }, 404);

  return json(user);
};

export const PUT: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing user ID' }, 400);

  const body = await context.request.json();
  const updateData: Record<string, any> = { updatedAt: Timestamp.now() };
  if (body.role !== undefined) updateData.role = body.role;
  if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;

  await usersCol().doc(id).update(updateData);
  const updated = await usersCol().doc(id).get();
  if (!updated.exists) return json({ error: 'User not found' }, 404);

  return json({ id: updated.id, ...updated.data() });
};

export const DELETE: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing user ID' }, 400);

  try { await adminAuth.deleteUser(id); } catch { /* user may not exist in Auth */ }
  await usersCol().doc(id).delete();
  return json({ success: true });
};
