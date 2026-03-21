import { adminAuth } from './firebase';
import { usersCol, docToObj, type UserDoc } from './firestore';
import type { AstroCookies } from 'astro';

interface AuthContext {
  request: Request;
  cookies: AstroCookies;
}

export async function getAuthenticatedUser(context: AuthContext) {
  const sessionCookie = context.cookies.get('session')?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await usersCol().doc(decoded.uid).get();
    return docToObj<UserDoc>(userDoc);
  } catch {
    return null;
  }
}
