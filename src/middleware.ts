import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname.startsWith('/api/')) {
    return next();
  }

  try {
    const accessToken = context.cookies.get('sb-access-token')?.value;
    if (accessToken) {
      const { data: { user: authUser } } = await supabase.auth.getUser(accessToken);
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          context.locals.user = profile;
        }
      }
    }
  } catch {
    // Invalid or expired session, continue without user
  }

  if (context.url.pathname.startsWith('/dashboard')) {
    if (!context.locals.user) {
      return context.redirect('/auth/login?redirect=' + encodeURIComponent(context.url.pathname));
    }
    if (context.locals.user.role !== 'agency' && context.locals.user.role !== 'admin') {
      return context.redirect('/');
    }
  }

  if (context.url.pathname.startsWith('/admin')) {
    if (!context.locals.user || context.locals.user.role !== 'admin') {
      return context.redirect('/auth/login');
    }
  }

  if (context.url.pathname.startsWith('/account')) {
    if (!context.locals.user) {
      return context.redirect('/auth/login?redirect=' + encodeURIComponent(context.url.pathname));
    }
  }

  return next();
});
