import type { APIRoute } from 'astro';
import { toursCol, docToObj, Timestamp, type TourDoc } from '../../../lib/firestore';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { deleteImage } from '../../../lib/storage';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) return json({ error: 'Tour ID is required' }, 400);

    const tourDoc = await toursCol().doc(id).get();
    const tour = docToObj<TourDoc>(tourDoc);
    if (!tour) return json({ error: 'Tour not found' }, 404);

    return json(tour);
  } catch (error) {
    console.error('Error fetching tour:', error);
    return json({ error: 'Failed to fetch tour' }, 500);
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { id } = context.params;
    if (!id) return json({ error: 'Tour ID is required' }, 400);

    const tourDoc = await toursCol().doc(id).get();
    const existing = docToObj<TourDoc>(tourDoc);
    if (!existing) return json({ error: 'Tour not found' }, 404);
    if (existing.agencyId !== user.id && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    const body = await context.request.json();
    const updateData: Record<string, any> = { updatedAt: Timestamp.now() };

    const fields = ['name', 'description', 'country', 'city', 'currency', 'category',
                    'departureCountry', 'departureCity', 'contactEmail', 'contactPhone',
                    'contactWebsite', 'durationDays', 'maxParticipants'];

    for (const field of fields) {
      if (body[field] !== undefined) updateData[field] = body[field] || null;
    }
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? Timestamp.fromDate(new Date(body.startDate)) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? Timestamp.fromDate(new Date(body.endDate)) : null;

    await toursCol().doc(id).update(updateData);
    const updated = await toursCol().doc(id).get();

    return json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('Error updating tour:', error);
    return json({ error: 'Failed to update tour' }, 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { id } = context.params;
    if (!id) return json({ error: 'Tour ID is required' }, 400);

    const tourDoc = await toursCol().doc(id).get();
    const existing = docToObj<TourDoc>(tourDoc);
    if (!existing) return json({ error: 'Tour not found' }, 404);
    if (existing.agencyId !== user.id && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    for (const image of (existing.images || [])) {
      try { await deleteImage(image.storagePath); } catch (err) {
        console.error(`Failed to delete image:`, err);
      }
    }

    await toursCol().doc(id).update({ status: 'deleted', updatedAt: Timestamp.now() });

    return json({ success: true, message: 'Tour deleted' });
  } catch (error) {
    console.error('Error deleting tour:', error);
    return json({ error: 'Failed to delete tour' }, 500);
  }
};
