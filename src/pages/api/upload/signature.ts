import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { uploadImage } from '../../../lib/cloudinary';

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

    if (user.role !== 'agency' && user.role !== 'admin') {
      return json({ error: 'Forbidden: agency or admin role required' }, 403);
    }

    const formData = await context.request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return json({ error: 'No file provided' }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const result = await uploadImage(buffer, sanitizedName);

    return json(result, 201);
  } catch (error) {
    console.error('Error uploading image:', error);
    return json({ error: 'Failed to upload image' }, 500);
  }
};
