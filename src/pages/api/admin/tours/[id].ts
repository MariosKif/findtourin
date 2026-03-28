import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  });

async function requireAdmin(context: Parameters<APIRoute>[0]) {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export const PUT: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing tour ID' }, 400);

  const body = await context.request.json();
  const { status } = body;

  const { data: updated, error } = await supabase
    .from('tours')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !updated) return json({ error: 'Tour not found' }, 404);

  return json(updated);
};

export const DELETE: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing tour ID' }, 400);

  await supabase.from('tours').delete().eq('id', id);
  return json({ success: true });
};
