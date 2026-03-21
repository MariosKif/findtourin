import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { tours, tourImages } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { deleteImage } from '../../../../lib/cloudinary';

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

    const { id: tourId } = context.params;
    if (!tourId) {
      return json({ error: 'Tour ID is required' }, 400);
    }

    const [tour] = await db
      .select()
      .from(tours)
      .where(eq(tours.id, tourId))
      .limit(1);

    if (!tour) {
      return json({ error: 'Tour not found' }, 404);
    }

    if (tour.agencyId !== user.id) {
      return json({ error: 'Forbidden: you do not own this tour' }, 403);
    }

    // Check max 5 images
    const existingImages = await db
      .select()
      .from(tourImages)
      .where(eq(tourImages.tourId, tourId));

    if (existingImages.length >= 5) {
      return json({ error: 'Maximum 5 images allowed per tour' }, 400);
    }

    const body = await context.request.json();
    const { url, publicId, altText } = body;

    if (!url || !publicId) {
      return json({ error: 'Missing required fields: url, publicId' }, 400);
    }

    const position = existingImages.length;

    const [image] = await db
      .insert(tourImages)
      .values({
        tourId,
        url,
        publicId,
        altText: altText || null,
        position,
      })
      .returning();

    return json(image, 201);
  } catch (error) {
    console.error('Error adding tour image:', error);
    return json({ error: 'Failed to add image' }, 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { id: tourId } = context.params;
    if (!tourId) {
      return json({ error: 'Tour ID is required' }, 400);
    }

    const [tour] = await db
      .select()
      .from(tours)
      .where(eq(tours.id, tourId))
      .limit(1);

    if (!tour) {
      return json({ error: 'Tour not found' }, 404);
    }

    if (tour.agencyId !== user.id) {
      return json({ error: 'Forbidden: you do not own this tour' }, 403);
    }

    const body = await context.request.json();
    const { imageId } = body;

    if (!imageId) {
      return json({ error: 'Missing required field: imageId' }, 400);
    }

    const [image] = await db
      .select()
      .from(tourImages)
      .where(and(eq(tourImages.id, imageId), eq(tourImages.tourId, tourId)))
      .limit(1);

    if (!image) {
      return json({ error: 'Image not found' }, 404);
    }

    // Delete from Cloudinary
    try {
      await deleteImage(image.publicId);
    } catch (err) {
      console.error(`Failed to delete image ${image.publicId} from Cloudinary:`, err);
    }

    // Delete from DB
    await db
      .delete(tourImages)
      .where(eq(tourImages.id, imageId));

    return json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Error deleting tour image:', error);
    return json({ error: 'Failed to delete image' }, 500);
  }
};
