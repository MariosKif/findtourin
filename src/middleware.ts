import { defineMiddleware } from 'astro:middleware';
import { adminAuth } from './lib/firebase';
import { usersCol, docToObj, type UserDoc } from './lib/firestore';

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname.startsWith('/api/')) {
    return next();
  }

  try {
    const sessionCookie = context.cookies.get('session')?.value;
    if (sessionCookie) {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      const userDoc = await usersCol().doc(decoded.uid).get();
      const profile = docToObj<UserDoc>(userDoc);
      if (profile) {
        context.locals.user = profile;
      }
    }
  } catch {
    // Invalid or expired session cookie, continue without user
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
