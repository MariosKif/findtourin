import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase';
import { db } from './lib/db';
import { profiles } from './lib/db/schema';
import { eq } from 'drizzle-orm';

export const onRequest = defineMiddleware(async (context, next) => {
  // Skip API routes
  if (context.url.pathname.startsWith('/api/')) {
    return next();
  }

  // Resolve user from Supabase session
  try {
    const supabase = createSupabaseServerClient(context);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);

      if (profile) {
        context.locals.user = profile;
      }
    }
  } catch {
    // No valid session, continue without user
  }

  // Protect dashboard routes
  if (context.url.pathname.startsWith('/dashboard')) {
    if (!context.locals.user) {
      return context.redirect('/auth/login?redirect=' + encodeURIComponent(context.url.pathname));
    }
    if (context.locals.user.role !== 'agency' && context.locals.user.role !== 'admin') {
      return context.redirect('/');
    }
  }

  // Protect admin routes
  if (context.url.pathname.startsWith('/admin')) {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
      return context.redirect('/auth/login');
    }
  }

  // Protect account routes
  if (context.url.pathname.startsWith('/account')) {
    if (!context.locals.user) {
      return context.redirect('/auth/login?redirect=' + encodeURIComponent(context.url.pathname));
    }
  }

  return next();
});
