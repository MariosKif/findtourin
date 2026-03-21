import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase';
import { usersCol, Timestamp } from '../../../lib/firestore';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json();
    const { email, password, name, role, companyName, phone, website } = body;

    if (!email || !password || !name) {
      return json({ error: 'Missing required fields: email, password, name' }, 400);
    }

    if (role && !['user', 'agency'].includes(role)) {
      return json({ error: 'Invalid role' }, 400);
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    });

    const now = Timestamp.now();
    await usersCol().doc(userRecord.uid).set({
      email,
      name,
      role: role || 'user',
      phone: phone || null,
      website: website || null,
      companyName: companyName || null,
      companyDesc: null,
      avatarUrl: null,
      isVerified: false,
      stripeCustomerId: null,
      createdAt: now,
      updatedAt: now,
    });

    const { idToken } = body;
    if (idToken) {
      const expiresIn = 60 * 60 * 24 * 14 * 1000;
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      context.cookies.set('session', sessionCookie, {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        path: '/',
        maxAge: expiresIn / 1000,
      });
    }

    return json({ success: true, role: role || 'user' });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === 'auth/email-already-exists') {
      return json({ error: 'Email already in use' }, 400);
    }
    return json({ error: 'Registration failed' }, 500);
  }
};
