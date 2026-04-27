import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { deleteImage } from '../../../../lib/storage';
import { getActivePlanForUser } from '../../../../lib/subscriptions';

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

    const { data: tour } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .single();

    if (!tour) return json({ error: 'Tour not found' }, 404);
    if (tour.agency_id !== user.id) return json({ error: 'Forbidden' }, 403);

    const images = tour.images || [];
    const { plan } = await getActivePlanForUser(tour.agency_id);
    if (images.length >= plan.maxImagesPerTour) {
      return json(
        { error: `Your ${plan.name} plan allows ${plan.maxImagesPerTour} image${plan.maxImagesPerTour === 1 ? '' : 's'} per tour. Upgrade your plan to add more.` },
        400,
      );
    }

    const body = await context.request.json();
    const { url, publicId, altText } = body;
    if (!url || !publicId) return json({ error: 'Missing required fields: url, publicId' }, 400);

    const newImage = {
      url,
      storage_path: publicId,
      position: images.length,
      alt_text: altText || null,
    };

    const { error } = await supabase
      .from('tours')
      .update({
        images: [...images, newImage],
        updated_at: new Date().toISOString(),
      })
      .eq('id', tourId);

    if (error) throw error;

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

    const { data: tour } = await supabase
      .from('tours')
      .select('*')
      .eq('id', tourId)
      .single();

    if (!tour) return json({ error: 'Tour not found' }, 404);
    if (tour.agency_id !== user.id) return json({ error: 'Forbidden' }, 403);

    const body = await context.request.json();
    const { publicId } = body;
    if (!publicId) return json({ error: 'Missing required field: publicId' }, 400);

    const images = tour.images || [];
    const imageToDelete = images.find((img: any) => img.storage_path === publicId);
    if (!imageToDelete) return json({ error: 'Image not found' }, 404);

    try { await deleteImage(publicId); } catch (err) {
      console.error('Failed to delete image from storage:', err);
    }

    const updatedImages = images
      .filter((img: any) => img.storage_path !== publicId)
      .map((img: any, i: number) => ({ ...img, position: i }));

    await supabase
      .from('tours')
      .update({
        images: updatedImages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tourId);

    return json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Error deleting tour image:', error);
    return json({ error: 'Failed to delete image' }, 500);
  }
};
