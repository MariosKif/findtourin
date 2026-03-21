import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase';
import { usersCol, docToObj, Timestamp, type UserDoc } from '../../../lib/firestore';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { idToken } = body;

    if (!idToken) {
      return json({ error: 'ID token is required' }, 400);
    }

    const decoded = await adminAuth.verifyIdToken(idToken);

    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    context.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000,
    });

    const userDoc = await usersCol().doc(decoded.uid).get();
    const profile = docToObj<UserDoc>(userDoc);

    if (profile) {
      return json({ success: true, role: profile.role, needsProfile: false });
    }

    return json({ success: true, needsProfile: true });
  } catch (error) {
    console.error('Google auth error:', error);
    return json({ error: 'Authentication failed' }, 500);
  }
};
