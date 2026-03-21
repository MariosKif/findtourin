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
    const sessionCookie = context.cookies.get('session')?.value;
    if (!sessionCookie) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const firebaseUser = await adminAuth.getUser(decoded.uid);

    const body = await context.request.json();
    const { name, role, companyName, phone, website } = body;

    if (!name || !role) {
      return json({ error: 'Name and role are required' }, 400);
    }

    if (!['user', 'agency'].includes(role)) {
      return json({ error: 'Invalid role' }, 400);
    }

    const now = Timestamp.now();
    await usersCol().doc(decoded.uid).set({
      email: firebaseUser.email!,
      name,
      role,
      phone: phone || null,
      website: website || null,
      companyName: companyName || null,
      companyDesc: null,
      avatarUrl: firebaseUser.photoURL || null,
      isVerified: false,
      stripeCustomerId: null,
      createdAt: now,
      updatedAt: now,
    });

    return json({ success: true, role });
  } catch (error) {
    console.error('Complete profile error:', error);
    return json({ error: 'Failed to complete profile' }, 500);
  }
};
