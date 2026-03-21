import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { favouritesCol, Timestamp } from '../../../lib/firestore';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const snapshot = await favouritesCol().where('userId', '==', user.id).get();
    const tourIds = snapshot.docs.map(doc => doc.data().tourId);

    return json(tourIds);
  } catch (error) {
    console.error('Error fetching favourites:', error);
    return json({ error: 'Failed to fetch favourites' }, 500);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await context.request.json();
    const { tourId } = body;
    if (!tourId) return json({ error: 'tourId is required' }, 400);

    const existing = await favouritesCol()
      .where('userId', '==', user.id)
      .where('tourId', '==', tourId)
      .limit(1)
      .get();

    if (existing.empty) {
      await favouritesCol().add({
        userId: user.id,
        tourId,
        createdAt: Timestamp.now(),
      });
    }

    return json({ success: true }, 201);
  } catch (error) {
    console.error('Error adding favourite:', error);
    return json({ error: 'Failed to add favourite' }, 500);
  }
};
