import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { db } from '../../../lib/db';
import { favourites } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const userFavourites = await db
      .select({ tourId: favourites.tourId })
      .from(favourites)
      .where(eq(favourites.userId, user.id));

    return json(userFavourites.map(f => f.tourId));
  } catch (error) {
    console.error('Error fetching favourites:', error);
    return json({ error: 'Failed to fetch favourites' }, 500);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = await context.request.json();
    const { tourId } = body;

    if (!tourId) {
      return json({ error: 'tourId is required' }, 400);
    }

    await db
      .insert(favourites)
      .values({ userId: user.id, tourId })
      .onConflictDoNothing();

    return json({ success: true }, 201);
  } catch (error) {
    console.error('Error adding favourite:', error);
    return json({ error: 'Failed to add favourite' }, 500);
  }
};
