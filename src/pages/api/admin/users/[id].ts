import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { profiles } from '../../../../lib/db/schema';
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

export const GET: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing user ID' }, 400);

  const user = await db.select().from(profiles).where(eq(profiles.id, id)).then(r => r[0]);
  if (!user) return json({ error: 'User not found' }, 404);

  return json(user);
};

export const PUT: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing user ID' }, 400);

  const body = await context.request.json();
  const { role, isVerified } = body;

  const [updated] = await db
    .update(profiles)
    .set({
      ...(role !== undefined && { role }),
      ...(isVerified !== undefined && { isVerified }),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, id))
    .returning();

  if (!updated) return json({ error: 'User not found' }, 404);
  return json(updated);
};

export const DELETE: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing user ID' }, 400);

  await db.delete(profiles).where(eq(profiles.id, id));
  return json({ success: true });
};
