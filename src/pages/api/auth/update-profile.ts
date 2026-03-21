import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { db } from '../../../lib/db';
import { profiles } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';

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

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (website !== undefined) updateData.website = website || null;
    if (companyName !== undefined) updateData.companyName = companyName || null;
    if (companyDesc !== undefined) updateData.companyDesc = companyDesc || null;

    const [updated] = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.id, user.id))
      .returning();

    return json({ success: true, user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    return json({ error: 'Failed to update profile' }, 500);
  }
};
