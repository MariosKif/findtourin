import type { APIRoute } from 'astro';
import { toursCol, docToObj, Timestamp, type TourDoc } from '../../../../lib/firestore';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { deleteImage } from '../../../../lib/storage';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { id: tourId } = context.params;
    if (!tourId) return json({ error: 'Tour ID is required' }, 400);

    const tourDoc = await toursCol().doc(tourId).get();
    const tour = docToObj<TourDoc>(tourDoc);
    if (!tour) return json({ error: 'Tour not found' }, 404);
    if (tour.agencyId !== user.id) return json({ error: 'Forbidden' }, 403);

    const images = tour.images || [];
    if (images.length >= 5) return json({ error: 'Maximum 5 images allowed per tour' }, 400);

    const body = await context.request.json();
    const { url, publicId, altText } = body;
    if (!url || !publicId) return json({ error: 'Missing required fields: url, publicId' }, 400);

    const newImage = {
      url,
      storagePath: publicId,
      position: images.length,
      altText: altText || null,
    };

    await toursCol().doc(tourId).update({
      images: [...images, newImage],
      updatedAt: Timestamp.now(),
    });

    return json(newImage, 201);
  } catch (error) {
    console.error('Error adding tour image:', error);
    return json({ error: 'Failed to add image' }, 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { id: tourId } = context.params;
    if (!tourId) return json({ error: 'Tour ID is required' }, 400);

    const tourDoc = await toursCol().doc(tourId).get();
    const tour = docToObj<TourDoc>(tourDoc);
    if (!tour) return json({ error: 'Tour not found' }, 404);
    if (tour.agencyId !== user.id) return json({ error: 'Forbidden' }, 403);

    const body = await context.request.json();
    const { publicId } = body;
    if (!publicId) return json({ error: 'Missing required field: publicId' }, 400);

    const images = tour.images || [];
    const imageToDelete = images.find(img => img.storagePath === publicId);
    if (!imageToDelete) return json({ error: 'Image not found' }, 404);

    try { await deleteImage(publicId); } catch (err) {
      console.error(`Failed to delete image from storage:`, err);
    }

    const updatedImages = images
      .filter(img => img.storagePath !== publicId)
      .map((img, i) => ({ ...img, position: i }));

    await toursCol().doc(tourId).update({
      images: updatedImages,
      updatedAt: Timestamp.now(),
    });

    return json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Error deleting tour image:', error);
    return json({ error: 'Failed to delete image' }, 500);
  }
};
