import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { generateUploadSignature } from '../../../lib/cloudinary';

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

    if (user.role !== 'agency' && user.role !== 'admin') {
      return json({ error: 'Forbidden: agency or admin role required' }, 403);
    }

    const signatureData = generateUploadSignature();
    return json(signatureData);
  } catch (error) {
    console.error('Error generating upload signature:', error);
    return json({ error: 'Failed to generate upload signature' }, 500);
  }
};
