import { createSupabaseServerClient } from './supabase';
import { db } from './db';
import { profiles } from './db/schema';
import { eq } from 'drizzle-orm';
import type { AstroCookies } from 'astro';

interface AuthContext {
  request: Request;
  cookies: AstroCookies;
}

export async function getAuthenticatedUser(context: AuthContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) return null;

  return profile;
}
