// src/pages/api/admin/env-check.ts
// Admin-only diagnostic. Reports whether the server has SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY set, and what role the JWT claims (service_role
// vs anon). Never returns the key itself.
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';

export const prerender = false;

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

function decodeJwtRole(jwt: string): string {
  if (!jwt || !jwt.includes('.')) return 'unset-or-malformed';
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
    return String(payload.role || 'no-role-claim');
  } catch {
    return 'decode-failed';
  }
}

export const GET: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  const url = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  return json({
    SUPABASE_URL_set: Boolean(url),
    SUPABASE_URL_value: url,
    SUPABASE_SERVICE_ROLE_KEY_set: Boolean(key),
    SUPABASE_SERVICE_ROLE_KEY_role: decodeJwtRole(key),
    SUPABASE_SERVICE_ROLE_KEY_prefix: key.slice(0, 10),
    SUPABASE_SERVICE_ROLE_KEY_length: key.length,
  });
};
