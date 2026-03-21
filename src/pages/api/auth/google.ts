import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);
  const origin = new URL(context.request.url).origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return context.redirect('/auth/login?error=oauth_failed');
  }

  return context.redirect(data.url);
};
