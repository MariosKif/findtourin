import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { tours } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
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

  const [updated] = await db
    .update(tours)
    .set({ status, updatedAt: new Date() })
    .where(eq(tours.id, id))
    .returning();

  if (!updated) return json({ error: 'Tour not found' }, 404);
  return json(updated);
};

export const DELETE: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing tour ID' }, 400);

  await db.delete(tours).where(eq(tours.id, id));
  return json({ success: true });
};
