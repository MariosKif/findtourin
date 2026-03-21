import type { APIRoute } from 'astro';
import { toursCol, Timestamp } from '../../../../lib/firestore';
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

export const PUT: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing tour ID' }, 400);

  const body = await context.request.json();
  const { status } = body;

  await toursCol().doc(id).update({ status, updatedAt: Timestamp.now() });
  const updated = await toursCol().doc(id).get();
  if (!updated.exists) return json({ error: 'Tour not found' }, 404);

  return json({ id: updated.id, ...updated.data() });
};

export const DELETE: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing tour ID' }, 400);

  await toursCol().doc(id).delete();
  return json({ success: true });
};
