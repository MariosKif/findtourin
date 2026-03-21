import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { tours, tourImages } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { deleteImage } from '../../../lib/cloudinary';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return json({ error: 'Tour ID is required' }, 400);
    }

    const [tour] = await db
      .select()
      .from(tours)
      .where(eq(tours.id, id))
      .limit(1);

    if (!tour) {
      return json({ error: 'Tour not found' }, 404);
    }

    const images = await db
      .select()
      .from(tourImages)
      .where(eq(tourImages.tourId, id))
      .orderBy(tourImages.position);

    return json({ ...tour, images });
  } catch (error) {
    console.error('Error fetching tour:', error);
    return json({ error: 'Failed to fetch tour' }, 500);
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { id } = context.params;
    if (!id) {
      return json({ error: 'Tour ID is required' }, 400);
    }

    const [existing] = await db
      .select()
      .from(tours)
      .where(eq(tours.id, id))
      .limit(1);

    if (!existing) {
      return json({ error: 'Tour not found' }, 404);
    }

    if (existing.agencyId !== user.id && user.role !== 'admin') {
      return json({ error: 'Forbidden: you do not own this tour' }, 403);
    }

    const body = await context.request.json();
    const { name, description, country, city, price, currency, category,
            contactEmail, contactPhone, contactWebsite, startDate, endDate,
            durationDays, maxParticipants, departureCountry, departureCity } = body;

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (country !== undefined) updateData.country = country;
    if (city !== undefined) updateData.city = city;
    if (price !== undefined) updateData.price = String(price);
    if (currency !== undefined) updateData.currency = currency;
    if (category !== undefined) updateData.category = category;
    if (departureCountry !== undefined) updateData.departureCountry = departureCountry || null;
    if (departureCity !== undefined) updateData.departureCity = departureCity || null;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (contactWebsite !== undefined) updateData.contactWebsite = contactWebsite;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (durationDays !== undefined) updateData.durationDays = durationDays;
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants;

    const [updated] = await db
      .update(tours)
      .set(updateData)
      .where(eq(tours.id, id))
      .returning();

    return json(updated);
  } catch (error) {
    console.error('Error updating tour:', error);
    return json({ error: 'Failed to update tour' }, 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { id } = context.params;
    if (!id) {
      return json({ error: 'Tour ID is required' }, 400);
    }

    const [existing] = await db
      .select()
      .from(tours)
      .where(eq(tours.id, id))
      .limit(1);

    if (!existing) {
      return json({ error: 'Tour not found' }, 404);
    }

    if (existing.agencyId !== user.id && user.role !== 'admin') {
      return json({ error: 'Forbidden: you do not own this tour' }, 403);
    }

    // Delete images from Cloudinary
    const images = await db
      .select()
      .from(tourImages)
      .where(eq(tourImages.tourId, id));

    for (const image of images) {
      try {
        await deleteImage(image.publicId);
      } catch (err) {
        console.error(`Failed to delete image ${image.publicId} from Cloudinary:`, err);
      }
    }

    // Soft delete: set status to 'deleted'
    await db
      .update(tours)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(tours.id, id));

    return json({ success: true, message: 'Tour deleted' });
  } catch (error) {
    console.error('Error deleting tour:', error);
    return json({ error: 'Failed to delete tour' }, 500);
  }
};
