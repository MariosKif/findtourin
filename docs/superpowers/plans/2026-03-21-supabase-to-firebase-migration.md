# Supabase to Firebase Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Supabase services (Auth, Database, Storage) with Firebase equivalents (Firebase Auth, Firestore, Firebase Storage) while preserving all existing functionality.

**Architecture:** Server-side Firebase Admin SDK for auth verification, Firestore queries, and storage management. Client-side Firebase SDK for auth (login/register/Google sign-in). Session cookies for SSR auth state. All Drizzle ORM / PostgreSQL code replaced with Firestore document operations.

**Tech Stack:** `firebase-admin` (server), `firebase` (client), Firestore (NoSQL database), Firebase Storage (images), Firebase Auth (email/password + Google)

---

## File Structure

### Files to Create
- `src/lib/firebase.ts` — Firebase Admin SDK initialization (server-side)
- `src/lib/firebase-client.ts` — Firebase Client SDK initialization (browser-side)
- `src/lib/firestore.ts` — Firestore helper functions (CRUD for all collections)

### Files to Modify
- `src/middleware.ts` — Replace Supabase session check with Firebase session cookie verification
- `src/lib/auth-helpers.ts` — Replace Supabase auth with Firebase Admin auth
- `src/lib/cloudinary.ts` — Rename to `src/lib/storage.ts`, replace Supabase Storage with Firebase Storage
- `src/lib/search.ts` — Replace Drizzle/SQL queries with Firestore queries
- `src/types/index.ts` — Replace Drizzle InferSelectModel types with Firestore-based types
- `src/pages/api/auth/login.ts` — Firebase Auth sign-in + session cookie
- `src/pages/api/auth/register.ts` — Firebase Auth create user
- `src/pages/api/auth/logout.ts` — Clear session cookie
- `src/pages/api/auth/google.ts` — Firebase Google OAuth flow
- `src/pages/api/auth/change-password.ts` — Firebase Admin password update
- `src/pages/api/auth/complete-profile.ts` — Firestore profile creation
- `src/pages/api/auth/update-profile.ts` — Firestore profile update
- `src/pages/api/tours/index.ts` — Firestore tour queries
- `src/pages/api/tours/[id].ts` — Firestore tour CRUD
- `src/pages/api/tours/[id]/images.ts` — Firestore image records + Firebase Storage
- `src/pages/api/upload/signature.ts` — Firebase Storage upload
- `src/pages/api/favourites/index.ts` — Firestore favourites
- `src/pages/api/favourites/[tourId].ts` — Firestore favourite delete
- `src/pages/api/contact.ts` — Firestore contact messages
- `src/pages/api/stripe/checkout.ts` — Firestore tour lookup
- `src/pages/api/stripe/webhook.ts` — Firestore tour/payment update
- `src/pages/api/admin/users/[id].ts` — Firestore user admin
- `src/pages/api/admin/tours/[id].ts` — Firestore tour admin
- `src/pages/auth/callback.astro` — Firebase OAuth callback
- `src/pages/auth/complete-profile.astro` — Firebase auth user check
- `src/pages/account/settings.astro` — Firebase auth provider check
- `src/pages/account/favourites.astro` — Firestore favourites query
- `src/pages/tours/index.astro` — Uses search.ts (already handled)
- `src/pages/tours/[slug].astro` — Firestore tour/images/agency query
- `src/pages/dashboard/index.astro` — Firestore stats queries
- `src/pages/dashboard/tours/index.astro` — Firestore tour listing
- `src/pages/dashboard/tours/[id]/edit.astro` — Firestore tour fetch
- `src/pages/dashboard/billing.astro` — Firestore payments + tour name lookup
- `src/pages/admin/index.astro` — Firestore admin stats
- `src/pages/admin/users.astro` — Firestore all users
- `src/pages/admin/listings.astro` — Firestore all tours
- `src/env.d.ts` — Keep as-is (Locals type unchanged)
- `package.json` — Remove Supabase/Drizzle deps, add Firebase
- `.env` — Replace Supabase vars with Firebase vars
- `.env.example` — Update template
- `.mcp.json` — Remove Supabase MCP server

### Files to Delete
- `src/lib/supabase.ts`
- `src/lib/db/index.ts`
- `src/lib/db/schema.ts`
- `src/lib/db/migrate.ts`
- `drizzle.config.ts`
- `drizzle/` directory (migration files)
- `.agents/skills/supabase-postgres-best-practices/` directory

### Firestore Collections Schema

```
users/{uid}
  - email: string
  - name: string
  - role: "user" | "agency" | "admin"
  - phone?: string
  - website?: string
  - companyName?: string
  - companyDesc?: string
  - avatarUrl?: string
  - isVerified: boolean
  - stripeCustomerId?: string
  - createdAt: Timestamp
  - updatedAt: Timestamp

tours/{tourId}
  - agencyId: string (ref to users)
  - name: string
  - slug: string
  - description: string
  - country: string
  - city: string
  - departureCountry?: string
  - departureCity?: string
  - price: number
  - currency: string (default "EUR")
  - startDate?: Timestamp
  - endDate?: Timestamp
  - durationDays?: number
  - maxParticipants?: number
  - category: string
  - contactEmail?: string
  - contactPhone?: string
  - contactWebsite?: string
  - status: string (default "pending_payment")
  - stripePaymentId?: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - images: Array<{ url: string, storagePath: string, position: number, altText?: string }>

favourites/{visautoId}
  - userId: string
  - tourId: string
  - createdAt: Timestamp

payments/{autoId}
  - agencyId: string
  - tourId: string
  - stripeSessionId?: string
  - stripePaymentIntent?: string
  - amount: number
  - currency: string
  - status: string
  - createdAt: Timestamp

contactMessages/{autoId}
  - name: string
  - email: string
  - subject: string
  - message: string
  - isRead: boolean
  - createdAt: Timestamp
```

Note: `tour_images` becomes an `images` array field on the tour document (max 5 images, always fetched with tour). This eliminates subcollection joins and simplifies queries.

---

### Task 1: Install Firebase, Remove Supabase Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Uninstall Supabase and Drizzle packages**

```bash
npm uninstall @supabase/ssr @supabase/supabase-js drizzle-orm postgres drizzle-kit
```

- [ ] **Step 2: Install Firebase packages**

```bash
npm install firebase firebase-admin
```

- [ ] **Step 3: Remove Drizzle scripts from package.json**

Remove the `db:generate`, `db:migrate`, `db:push`, `db:studio` scripts from package.json.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap Supabase/Drizzle deps for Firebase"
```

---

### Task 2: Create Firebase Server & Client Initialization

**Files:**
- Create: `src/lib/firebase.ts`
- Create: `src/lib/firebase-client.ts`
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Update .env with Firebase config**

Replace the Supabase env vars with:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app

PUBLIC_FIREBASE_API_KEY=your-api-key
PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your-project-id
PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
PUBLIC_FIREBASE_APP_ID=your-app-id

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
LISTING_FEE_CENTS=4900
SITE_URL=http://localhost:4321
```

Update `.env.example` to match (with placeholder values).

- [ ] **Step 2: Create Firebase Admin SDK init**

Create `src/lib/firebase.ts`:

```typescript
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const serviceAccount: ServiceAccount = {
  projectId: import.meta.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  clientEmail: import.meta.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (import.meta.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

const app = getApps().length === 0
  ? initializeApp({
      credential: cert(serviceAccount),
      storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
    })
  : getApps()[0];

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
```

- [ ] **Step 3: Create Firebase Client SDK init**

Create `src/lib/firebase-client.ts`:

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const clientAuth = getAuth(app);
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/firebase.ts src/lib/firebase-client.ts .env.example
git commit -m "feat: add Firebase Admin and Client SDK initialization"
```

---

### Task 3: Create Firestore Helper Functions

**Files:**
- Create: `src/lib/firestore.ts`

- [ ] **Step 1: Create Firestore helpers**

Create `src/lib/firestore.ts` with typed helper functions for all collections:

```typescript
import { adminDb } from './firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Collection references
export const usersCol = () => adminDb.collection('users');
export const toursCol = () => adminDb.collection('tours');
export const favouritesCol = () => adminDb.collection('favourites');
export const paymentsCol = () => adminDb.collection('payments');
export const contactMessagesCol = () => adminDb.collection('contactMessages');

// Type definitions
export interface UserDoc {
  email: string;
  name: string;
  role: 'user' | 'agency' | 'admin';
  phone?: string | null;
  website?: string | null;
  companyName?: string | null;
  companyDesc?: string | null;
  avatarUrl?: string | null;
  isVerified: boolean;
  stripeCustomerId?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TourImage {
  url: string;
  storagePath: string;
  position: number;
  altText?: string | null;
}

export interface TourDoc {
  agencyId: string;
  name: string;
  slug: string;
  description: string;
  country: string;
  city: string;
  departureCountry?: string | null;
  departureCity?: string | null;
  price: number;
  currency: string;
  startDate?: Timestamp | null;
  endDate?: Timestamp | null;
  durationDays?: number | null;
  maxParticipants?: number | null;
  category: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactWebsite?: string | null;
  status: string;
  stripePaymentId?: string | null;
  images: TourImage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FavouriteDoc {
  userId: string;
  tourId: string;
  createdAt: Timestamp;
}

export interface PaymentDoc {
  agencyId: string;
  tourId: string;
  stripeSessionId?: string | null;
  stripePaymentIntent?: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: Timestamp;
}

export interface ContactMessageDoc {
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}

// Helper to convert Firestore doc to plain object with id
export function docToObj<T>(doc: FirebaseFirestore.DocumentSnapshot): (T & { id: string }) | null {
  if (!doc.exists) return null;
  const data = doc.data()!;
  // Convert Timestamps to Date strings for JSON serialization
  const converted: Record<string, any> = { id: doc.id };
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      converted[key] = value.toDate().toISOString();
    } else {
      converted[key] = value;
    }
  }
  return converted as T & { id: string };
}

export function docsToArray<T>(snapshot: FirebaseFirestore.QuerySnapshot): (T & { id: string })[] {
  return snapshot.docs.map(doc => docToObj<T>(doc)!);
}

export { FieldValue, Timestamp };
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/firestore.ts
git commit -m "feat: add Firestore typed helper functions for all collections"
```

---

### Task 4: Migrate Auth — Middleware & Auth Helpers

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/lib/auth-helpers.ts`

- [ ] **Step 1: Rewrite auth-helpers.ts**

Replace contents of `src/lib/auth-helpers.ts`:

```typescript
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
```

- [ ] **Step 2: Rewrite middleware.ts**

Replace contents of `src/middleware.ts`:

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts src/lib/auth-helpers.ts
git commit -m "feat: migrate middleware and auth helpers to Firebase Admin"
```

---

### Task 5: Migrate Auth API Routes

**Files:**
- Modify: `src/pages/api/auth/login.ts`
- Modify: `src/pages/api/auth/register.ts`
- Modify: `src/pages/api/auth/logout.ts`
- Modify: `src/pages/api/auth/google.ts`
- Modify: `src/pages/api/auth/change-password.ts`
- Modify: `src/pages/api/auth/complete-profile.ts`
- Modify: `src/pages/api/auth/update-profile.ts`

- [ ] **Step 1: Rewrite login.ts**

The login flow: client sends Firebase ID token (obtained via client SDK signInWithEmailAndPassword), server creates session cookie.

```typescript
import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase';
import { usersCol, docToObj, type UserDoc } from '../../../lib/firestore';

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

    // Verify the ID token
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Create session cookie (14 days)
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    context.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000,
    });

    // Get user role from Firestore
    const userDoc = await usersCol().doc(decoded.uid).get();
    const profile = docToObj<UserDoc>(userDoc);

    return json({ success: true, role: profile?.role || 'user' });
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Login failed' }, 500);
  }
};
```

- [ ] **Step 2: Rewrite register.ts**

```typescript
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

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    });

    // Create Firestore profile
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

    // Create session cookie from the idToken sent by the client
    // The client will sign in after registration and send the token
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
```

- [ ] **Step 3: Rewrite logout.ts**

```typescript
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  context.cookies.delete('session', { path: '/' });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 4: Rewrite google.ts**

With Firebase, Google sign-in happens on the client side. The server route receives the ID token and creates a session cookie. Change this to handle the token exchange:

```typescript
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

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    context.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000,
    });

    // Check if profile exists
    const userDoc = await usersCol().doc(decoded.uid).get();
    const profile = docToObj<UserDoc>(userDoc);

    if (profile) {
      return json({ success: true, role: profile.role, needsProfile: false });
    }

    // No profile yet — signal the client to redirect to complete-profile
    return json({ success: true, needsProfile: true });
  } catch (error) {
    console.error('Google auth error:', error);
    return json({ error: 'Authentication failed' }, 500);
  }
};
```

- [ ] **Step 5: Rewrite change-password.ts**

```typescript
import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = await context.request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return json({ error: 'New password must be at least 8 characters' }, 400);
    }

    await adminAuth.updateUser(user.id, { password: newPassword });

    return json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return json({ error: 'Failed to update password' }, 500);
  }
};
```

Note: Firebase Admin `updateUser` doesn't require current password verification. The user is already authenticated via session cookie. If you want current password verification, that must happen on the client side via `reauthenticateWithCredential` before calling this endpoint.

- [ ] **Step 6: Rewrite complete-profile.ts**

```typescript
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
```

- [ ] **Step 7: Rewrite update-profile.ts**

```typescript
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { usersCol, Timestamp } from '../../../lib/firestore';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const body = await context.request.json();
    const { name, phone, website, companyName, companyDesc } = body;

    const updateData: Record<string, any> = { updatedAt: Timestamp.now() };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (website !== undefined) updateData.website = website || null;
    if (companyName !== undefined) updateData.companyName = companyName || null;
    if (companyDesc !== undefined) updateData.companyDesc = companyDesc || null;

    await usersCol().doc(user.id).update(updateData);

    const updated = await usersCol().doc(user.id).get();

    return json({ success: true, user: { id: updated.id, ...updated.data() } });
  } catch (error) {
    console.error('Update profile error:', error);
    return json({ error: 'Failed to update profile' }, 500);
  }
};
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/api/auth/
git commit -m "feat: migrate all auth API routes to Firebase"
```

---

### Task 6: Migrate Auth Pages (Callback, Complete Profile, Settings)

**Files:**
- Modify: `src/pages/auth/callback.astro`
- Modify: `src/pages/auth/complete-profile.astro`
- Modify: `src/pages/account/settings.astro`

- [ ] **Step 1: Rewrite callback.astro**

With Firebase, OAuth happens client-side. The callback page is no longer needed for server-side code exchange. Convert it to handle the client-side redirect after Google sign-in:

```astro
---
export const prerender = false;

// Firebase OAuth is handled client-side.
// This page acts as a landing page after Google sign-in redirect.
// The client-side JS will extract the result and call our API.
---

<html>
<head><title>Authenticating...</title></head>
<body>
  <p>Authenticating, please wait...</p>
  <script type="module">
    import { getAuth, getRedirectResult } from 'firebase/auth';

    const auth = getAuth();
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        const idToken = await result.user.getIdToken();
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        const data = await res.json();
        if (data.needsProfile) {
          window.location.href = '/auth/complete-profile';
        } else if (data.role === 'agency' || data.role === 'admin') {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/account/favourites';
        }
      } else {
        window.location.href = '/auth/login?error=no_result';
      }
    } catch {
      window.location.href = '/auth/login?error=callback_failed';
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: Update complete-profile.astro**

Replace the Supabase auth check with Firebase session cookie check:

```astro
---
export const prerender = false;

import PublicLayout from '../../layouts/PublicLayout.astro';
import Input from '../../components/ui/Input.astro';
import Select from '../../components/ui/Select.astro';
import Button from '../../components/ui/Button.astro';
import { adminAuth } from '../../lib/firebase';

const sessionCookie = Astro.cookies.get('session')?.value;
if (!sessionCookie) {
  return Astro.redirect('/auth/login');
}

let firebaseUser;
try {
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  firebaseUser = await adminAuth.getUser(decoded.uid);
} catch {
  return Astro.redirect('/auth/login');
}

const defaultName = firebaseUser.displayName || '';

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'agency', label: 'Agency' },
];
---
```

Keep the rest of the template and script exactly as-is (it already POSTs to `/api/auth/complete-profile`).

- [ ] **Step 3: Update settings.astro**

Replace the Supabase provider check with Firebase:

```astro
---
export const prerender = false;
import AccountLayout from '../../layouts/AccountLayout.astro';
import Button from '../../components/ui/Button.astro';
import { adminAuth } from '../../lib/firebase';

const user = Astro.locals.user;
if (!user) return Astro.redirect('/auth/login');

// Check if user signed up with Google
let isOAuthUser = false;
try {
  const firebaseUser = await adminAuth.getUser(user.id);
  isOAuthUser = firebaseUser.providerData.some(p => p.providerId === 'google.com')
    && !firebaseUser.providerData.some(p => p.providerId === 'password');
} catch {
  // If we can't check, assume not OAuth
}
---
```

Keep the rest of the template and scripts exactly as-is.

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/ src/pages/account/settings.astro
git commit -m "feat: migrate auth pages to Firebase session cookies"
```

---

### Task 7: Update Client-Side Auth (Login & Register Pages)

**Files:**
- Modify: `src/pages/auth/login.astro` (the client-side script)
- Modify: `src/pages/auth/register.astro` (the client-side script if it exists)

- [ ] **Step 1: Update login page script**

The login page needs to use Firebase Client SDK to sign in, get an ID token, then send it to the server. Find the login form's submit handler and update it.

The login form currently POSTs `{ email, password }`. It needs to:
1. Use `signInWithEmailAndPassword` from Firebase Client SDK
2. Get the ID token from the result
3. POST `{ idToken }` to `/api/auth/login`

Update the `<script>` tag in the login page to import and use Firebase:

```html
<script type="module">
  import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
  import { initializeApp } from 'firebase/app';

  // Initialize Firebase (inline config since this is client-side)
  const app = initializeApp({
    apiKey: document.querySelector('meta[name="firebase-api-key"]')?.getAttribute('content'),
    authDomain: document.querySelector('meta[name="firebase-auth-domain"]')?.getAttribute('content'),
    projectId: document.querySelector('meta[name="firebase-project-id"]')?.getAttribute('content'),
  });
  const auth = getAuth(app);

  // ... form submit handler using signInWithEmailAndPassword
  // ... Google button handler using signInWithPopup(auth, new GoogleAuthProvider())
</script>
```

Add `<meta>` tags in the `<head>` of the login page to pass Firebase config to the client:

```astro
<meta name="firebase-api-key" content={import.meta.env.PUBLIC_FIREBASE_API_KEY} />
<meta name="firebase-auth-domain" content={import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN} />
<meta name="firebase-project-id" content={import.meta.env.PUBLIC_FIREBASE_PROJECT_ID} />
```

- [ ] **Step 2: Update register page script similarly**

The register page needs to:
1. POST `{ email, password, name, role, ... }` to `/api/auth/register` (creates Firebase user + Firestore profile server-side)
2. Then sign in client-side with `signInWithEmailAndPassword` to get ID token
3. POST `{ idToken }` to `/api/auth/login` to create session cookie

- [ ] **Step 3: Update Google sign-in button**

Replace the `<a href="/api/auth/google">` link with a button that triggers `signInWithPopup`:

```javascript
const googleBtn = document.getElementById('google-login-btn');
googleBtn?.addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    const idToken = await result.user.getIdToken();
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (data.needsProfile) {
      window.location.href = '/auth/complete-profile';
    } else if (data.role === 'agency' || data.role === 'admin') {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/account/favourites';
    }
  } catch (err) {
    console.error('Google sign-in error:', err);
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/
git commit -m "feat: update client-side auth to use Firebase SDK"
```

---

### Task 8: Migrate Storage (Image Upload/Delete)

**Files:**
- Rename & rewrite: `src/lib/cloudinary.ts` → `src/lib/storage.ts`
- Modify: `src/pages/api/upload/signature.ts`
- Modify: `src/pages/api/tours/[id]/images.ts`

- [ ] **Step 1: Rename cloudinary.ts to storage.ts and rewrite for Firebase Storage**

```bash
git mv src/lib/cloudinary.ts src/lib/storage.ts
```

Replace contents of `src/lib/storage.ts`:

```typescript
import { adminStorage } from './firebase';

const bucket = adminStorage.bucket();

export async function uploadImage(file: Buffer, fileName: string): Promise<{ url: string; storagePath: string }> {
  const storagePath = `tours/${Date.now()}-${fileName}`;
  const fileRef = bucket.file(storagePath);

  await fileRef.save(file, {
    metadata: {
      contentType: getContentType(fileName),
    },
  });

  await fileRef.makePublic();

  const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  return { url, storagePath };
}

export async function deleteImage(storagePath: string) {
  try {
    await bucket.file(storagePath).delete();
  } catch (error: any) {
    if (error.code !== 404) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
}

function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const types: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  return types[ext || ''] || 'application/octet-stream';
}
```

- [ ] **Step 2: Update upload/signature.ts**

Update to use `storagePath` instead of `publicId`:

```typescript
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { uploadImage } from '../../../lib/storage';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    if (user.role !== 'agency' && user.role !== 'admin') {
      return json({ error: 'Forbidden: agency or admin role required' }, 403);
    }

    const formData = await context.request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return json({ error: 'No file provided' }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const result = await uploadImage(buffer, sanitizedName);

    return json({ url: result.url, publicId: result.storagePath }, 201);
  } catch (error) {
    console.error('Error uploading image:', error);
    return json({ error: 'Failed to upload image' }, 500);
  }
};
```

- [ ] **Step 3: Rewrite tours/[id]/images.ts for Firestore**

```typescript
import type { APIRoute } from 'astro';
import { toursCol, docToObj, Timestamp, type TourDoc } from '../../../../lib/firestore';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { deleteImage } from '../../../../lib/storage';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { id: tourId } = context.params;
    if (!tourId) return json({ error: 'Tour ID is required' }, 400);

    const tourDoc = await toursCol().doc(tourId).get();
    const tour = docToObj<TourDoc>(tourDoc);
    if (!tour) return json({ error: 'Tour not found' }, 404);
    if (tour.agencyId !== user.id) return json({ error: 'Forbidden' }, 403);

    const images = tour.images || [];
    if (images.length >= 5) return json({ error: 'Maximum 5 images allowed per tour' }, 400);

    const body = await context.request.json();
    const { url, publicId, altText } = body;
    if (!url || !publicId) return json({ error: 'Missing required fields: url, publicId' }, 400);

    const newImage = {
      url,
      storagePath: publicId,
      position: images.length,
      altText: altText || null,
    };

    await toursCol().doc(tourId).update({
      images: [...images, newImage],
      updatedAt: Timestamp.now(),
    });

    return json(newImage, 201);
  } catch (error) {
    console.error('Error adding tour image:', error);
    return json({ error: 'Failed to add image' }, 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { id: tourId } = context.params;
    if (!tourId) return json({ error: 'Tour ID is required' }, 400);

    const tourDoc = await toursCol().doc(tourId).get();
    const tour = docToObj<TourDoc>(tourDoc);
    if (!tour) return json({ error: 'Tour not found' }, 404);
    if (tour.agencyId !== user.id) return json({ error: 'Forbidden' }, 403);

    const body = await context.request.json();
    const { publicId } = body;
    if (!publicId) return json({ error: 'Missing required field: publicId' }, 400);

    const images = tour.images || [];
    const imageToDelete = images.find(img => img.storagePath === publicId);
    if (!imageToDelete) return json({ error: 'Image not found' }, 404);

    try { await deleteImage(publicId); } catch (err) {
      console.error(`Failed to delete image from storage:`, err);
    }

    const updatedImages = images
      .filter(img => img.storagePath !== publicId)
      .map((img, i) => ({ ...img, position: i }));

    await toursCol().doc(tourId).update({
      images: updatedImages,
      updatedAt: Timestamp.now(),
    });

    return json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Error deleting tour image:', error);
    return json({ error: 'Failed to delete image' }, 500);
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/cloudinary.ts src/pages/api/upload/signature.ts src/pages/api/tours/\[id\]/images.ts
git commit -m "feat: migrate image storage from Supabase to Firebase Storage"
```

---

### Task 9: Migrate Tour API Routes & Search

**Files:**
- Modify: `src/pages/api/tours/index.ts`
- Modify: `src/pages/api/tours/[id].ts`
- Modify: `src/lib/search.ts`

- [ ] **Step 1: Rewrite search.ts for Firestore**

```typescript
import { toursCol, docsToArray, type TourDoc } from './firestore';

const ITEMS_PER_PAGE = 12;

export interface SearchParams {
  q?: string;
  country?: string;
  city?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'name';
  page?: number;
  departureCountry?: string;
  departureCity?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function searchTours(params: SearchParams) {
  const page = params.page || 1;

  let query: FirebaseFirestore.Query = toursCol().where('status', '==', 'active');

  if (params.category) {
    query = query.where('category', '==', params.category);
  }

  if (params.country) {
    query = query.where('country', '==', params.country);
  }

  if (params.city) {
    query = query.where('city', '==', params.city);
  }

  if (params.departureCountry) {
    query = query.where('departureCountry', '==', params.departureCountry);
  }

  if (params.departureCity) {
    query = query.where('departureCity', '==', params.departureCity);
  }

  // Sorting
  switch (params.sort) {
    case 'price_asc':
      query = query.orderBy('price', 'asc');
      break;
    case 'price_desc':
      query = query.orderBy('price', 'desc');
      break;
    case 'name':
      query = query.orderBy('name', 'asc');
      break;
    case 'newest':
    default:
      query = query.orderBy('createdAt', 'desc');
  }

  // Fetch all matching docs for filtering + pagination
  // (Firestore doesn't support ILIKE or text search natively)
  const snapshot = await query.get();
  let allTours = docsToArray<TourDoc>(snapshot);

  // Client-side text filtering (Firestore has no full-text search)
  if (params.q) {
    const q = params.q.toLowerCase();
    allTours = allTours.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.departureCountry || '').toLowerCase().includes(q) ||
      (t.departureCity || '').toLowerCase().includes(q)
    );
  }

  if (params.destination) {
    const dest = params.destination.toLowerCase();
    allTours = allTours.filter(t =>
      t.country.toLowerCase().includes(dest) ||
      t.city.toLowerCase().includes(dest)
    );
  }

  // Price filtering
  if (params.minPrice !== undefined) {
    allTours = allTours.filter(t => t.price >= params.minPrice!);
  }
  if (params.maxPrice !== undefined) {
    allTours = allTours.filter(t => t.price <= params.maxPrice!);
  }

  // Date filtering
  if (params.dateFrom) {
    const fromDate = new Date(params.dateFrom);
    allTours = allTours.filter(t => t.startDate && new Date(t.startDate as any) >= fromDate);
  }
  if (params.dateTo) {
    const toDate = new Date(params.dateTo);
    allTours = allTours.filter(t => t.startDate && new Date(t.startDate as any) <= toDate);
  }

  const total = allTours.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const paginatedTours = allTours.slice(offset, offset + ITEMS_PER_PAGE);

  const toursWithImages = paginatedTours.map(tour => ({
    ...tour,
    images: tour.images || [],
    thumbnail: tour.images?.[0]?.url || null,
  }));

  return {
    tours: toursWithImages,
    total,
    totalPages,
    page,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export const CATEGORIES = [
  'Adventure', 'Cultural', 'Food & Wine', 'Nature', 'City Tours',
  'Beach & Island', 'Historical', 'Wildlife', 'Hiking & Trekking',
  'Photography', 'Wellness & Spa', 'Cruise',
] as const;

export const COUNTRIES = [
  'Argentina', 'Australia', 'Austria', 'Brazil', 'Cambodia',
  'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica',
  'Croatia', 'Czech Republic', 'Ecuador', 'Egypt', 'Fiji',
  'France', 'Germany', 'Greece', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Ireland', 'Italy', 'Japan',
  'Jordan', 'Kenya', 'Malaysia', 'Maldives', 'Mexico',
  'Morocco', 'Nepal', 'Netherlands', 'New Zealand', 'Norway',
  'Peru', 'Philippines', 'Poland', 'Portugal', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Switzerland', 'Tanzania',
  'Thailand', 'Turkey', 'UAE', 'UK', 'USA', 'Vietnam',
] as const;
```

- [ ] **Step 2: Rewrite tours/index.ts (POST)**

```typescript
import type { APIRoute } from 'astro';
import { toursCol, Timestamp } from '../../../lib/firestore';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { searchTours, type SearchParams } from '../../../lib/search';
import { slugify } from '../../../lib/utils';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const params: SearchParams = {
      q: url.searchParams.get('q') || undefined,
      country: url.searchParams.get('country') || undefined,
      city: url.searchParams.get('city') || undefined,
      category: url.searchParams.get('category') || undefined,
      minPrice: url.searchParams.get('minPrice') ? Number(url.searchParams.get('minPrice')) : undefined,
      maxPrice: url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined,
      sort: (url.searchParams.get('sort') as SearchParams['sort']) || undefined,
      page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
      departureCountry: url.searchParams.get('departureCountry') || undefined,
      departureCity: url.searchParams.get('departureCity') || undefined,
      destination: url.searchParams.get('destination') || undefined,
      dateFrom: url.searchParams.get('dateFrom') || undefined,
      dateTo: url.searchParams.get('dateTo') || undefined,
    };

    const results = await searchTours(params);
    return json(results);
  } catch (error) {
    console.error('Error searching tours:', error);
    return json({ error: 'Failed to search tours' }, 500);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'agency' && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    const body = await context.request.json();
    const { name, description, country, city, price, currency, category,
            contactEmail, contactPhone, contactWebsite, startDate, endDate,
            durationDays, maxParticipants, departureCountry, departureCity } = body;

    if (!name || !description || !country || !city || !price || !category) {
      return json({ error: 'Missing required fields' }, 400);
    }

    // Generate slug, check uniqueness
    let slug = slugify(name);
    const existing = await toursCol().where('slug', '==', slug).limit(1).get();
    if (!existing.empty) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    const now = Timestamp.now();
    const tourData = {
      agencyId: user.id,
      name,
      slug,
      description,
      country,
      city,
      price: Number(price),
      currency: currency || 'EUR',
      category,
      departureCountry: departureCountry || null,
      departureCity: departureCity || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      contactWebsite: contactWebsite || null,
      startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : null,
      endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
      durationDays: durationDays || null,
      maxParticipants: maxParticipants || null,
      status: 'pending_payment',
      stripePaymentId: null,
      images: [],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await toursCol().add(tourData);

    return json({ id: docRef.id, ...tourData }, 201);
  } catch (error) {
    console.error('Error creating tour:', error);
    return json({ error: 'Failed to create tour' }, 500);
  }
};
```

- [ ] **Step 3: Rewrite tours/[id].ts**

```typescript
import type { APIRoute } from 'astro';
import { toursCol, docToObj, Timestamp, type TourDoc } from '../../../lib/firestore';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { deleteImage } from '../../../lib/storage';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) return json({ error: 'Tour ID is required' }, 400);

    const tourDoc = await toursCol().doc(id).get();
    const tour = docToObj<TourDoc>(tourDoc);
    if (!tour) return json({ error: 'Tour not found' }, 404);

    return json(tour);
  } catch (error) {
    console.error('Error fetching tour:', error);
    return json({ error: 'Failed to fetch tour' }, 500);
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { id } = context.params;
    if (!id) return json({ error: 'Tour ID is required' }, 400);

    const tourDoc = await toursCol().doc(id).get();
    const existing = docToObj<TourDoc>(tourDoc);
    if (!existing) return json({ error: 'Tour not found' }, 404);
    if (existing.agencyId !== user.id && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    const body = await context.request.json();
    const updateData: Record<string, any> = { updatedAt: Timestamp.now() };

    const fields = ['name', 'description', 'country', 'city', 'currency', 'category',
                    'departureCountry', 'departureCity', 'contactEmail', 'contactPhone',
                    'contactWebsite', 'durationDays', 'maxParticipants'];

    for (const field of fields) {
      if (body[field] !== undefined) updateData[field] = body[field] || null;
    }
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? Timestamp.fromDate(new Date(body.startDate)) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? Timestamp.fromDate(new Date(body.endDate)) : null;

    await toursCol().doc(id).update(updateData);
    const updated = await toursCol().doc(id).get();

    return json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('Error updating tour:', error);
    return json({ error: 'Failed to update tour' }, 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { id } = context.params;
    if (!id) return json({ error: 'Tour ID is required' }, 400);

    const tourDoc = await toursCol().doc(id).get();
    const existing = docToObj<TourDoc>(tourDoc);
    if (!existing) return json({ error: 'Tour not found' }, 404);
    if (existing.agencyId !== user.id && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    // Delete images from storage
    for (const image of (existing.images || [])) {
      try { await deleteImage(image.storagePath); } catch (err) {
        console.error(`Failed to delete image:`, err);
      }
    }

    // Soft delete
    await toursCol().doc(id).update({ status: 'deleted', updatedAt: Timestamp.now() });

    return json({ success: true, message: 'Tour deleted' });
  } catch (error) {
    console.error('Error deleting tour:', error);
    return json({ error: 'Failed to delete tour' }, 500);
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/search.ts src/pages/api/tours/
git commit -m "feat: migrate tour API routes and search to Firestore"
```

---

### Task 10: Migrate Favourites, Contact, Stripe, Admin API Routes

**Files:**
- Modify: `src/pages/api/favourites/index.ts`
- Modify: `src/pages/api/favourites/[tourId].ts`
- Modify: `src/pages/api/contact.ts`
- Modify: `src/pages/api/stripe/checkout.ts`
- Modify: `src/pages/api/stripe/webhook.ts`
- Modify: `src/pages/api/admin/users/[id].ts`
- Modify: `src/pages/api/admin/tours/[id].ts`

- [ ] **Step 1: Rewrite favourites/index.ts**

```typescript
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { favouritesCol, Timestamp } from '../../../lib/firestore';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const snapshot = await favouritesCol().where('userId', '==', user.id).get();
    const tourIds = snapshot.docs.map(doc => doc.data().tourId);

    return json(tourIds);
  } catch (error) {
    console.error('Error fetching favourites:', error);
    return json({ error: 'Failed to fetch favourites' }, 500);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await context.request.json();
    const { tourId } = body;
    if (!tourId) return json({ error: 'tourId is required' }, 400);

    // Check if already favourited
    const existing = await favouritesCol()
      .where('userId', '==', user.id)
      .where('tourId', '==', tourId)
      .limit(1)
      .get();

    if (existing.empty) {
      await favouritesCol().add({
        userId: user.id,
        tourId,
        createdAt: Timestamp.now(),
      });
    }

    return json({ success: true }, 201);
  } catch (error) {
    console.error('Error adding favourite:', error);
    return json({ error: 'Failed to add favourite' }, 500);
  }
};
```

- [ ] **Step 2: Rewrite favourites/[tourId].ts**

```typescript
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { favouritesCol } from '../../../lib/firestore';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const DELETE: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { tourId } = context.params;
    if (!tourId) return json({ error: 'Tour ID is required' }, 400);

    const snapshot = await favouritesCol()
      .where('userId', '==', user.id)
      .where('tourId', '==', tourId)
      .get();

    const batch = favouritesCol().firestore.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return json({ success: true });
  } catch (error) {
    console.error('Error removing favourite:', error);
    return json({ error: 'Failed to remove favourite' }, 500);
  }
};
```

- [ ] **Step 3: Rewrite contact.ts**

```typescript
import type { APIRoute } from 'astro';
import { contactMessagesCol, Timestamp } from '../../lib/firestore';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return json({ error: 'Missing required fields' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Invalid email address' }, 400);
    }

    const docRef = await contactMessagesCol().add({
      name,
      email,
      subject,
      message,
      isRead: false,
      createdAt: Timestamp.now(),
    });

    return json({ success: true, message: 'Message sent successfully', id: docRef.id }, 201);
  } catch (error) {
    console.error('Error saving contact message:', error);
    return json({ error: 'Failed to send message' }, 500);
  }
};
```

- [ ] **Step 4: Rewrite stripe/checkout.ts**

```typescript
import type { APIRoute } from 'astro';
import { toursCol, docToObj, type TourDoc } from '../../../lib/firestore';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { createCheckoutSession } from '../../../lib/stripe';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async (context) => {
  try {
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'agency') return json({ error: 'Forbidden' }, 403);

    const body = await context.request.json();
    const { tourId } = body;
    if (!tourId) return json({ error: 'Missing tourId' }, 400);

    const tourDoc = await toursCol().doc(tourId).get();
    const tour = docToObj<TourDoc>(tourDoc);
    if (!tour) return json({ error: 'Tour not found' }, 404);
    if (tour.agencyId !== user.id) return json({ error: 'Forbidden' }, 403);

    const origin = new URL(context.request.url).origin;
    const checkoutSession = await createCheckoutSession({
      tourId: tour.id,
      tourName: tour.name,
      agencyEmail: user.email,
      successUrl: `${origin}/dashboard/tours/${tour.id}?payment=success`,
      cancelUrl: `${origin}/dashboard/tours/${tour.id}?payment=cancelled`,
    });

    return json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return json({ error: 'Failed to create checkout session' }, 500);
  }
};
```

- [ ] **Step 5: Rewrite stripe/webhook.ts**

```typescript
import type { APIRoute } from 'astro';
import { toursCol, paymentsCol, docToObj, Timestamp, type TourDoc } from '../../../lib/firestore';
import { verifyWebhookSignature } from '../../../lib/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    let event;
    try {
      event = await verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const tourId = session.metadata?.tourId;

      if (!tourId) {
        return new Response(JSON.stringify({ error: 'Missing tourId' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }

      const tourDoc = await toursCol().doc(tourId).get();
      const tour = docToObj<TourDoc>(tourDoc);

      if (tour) {
        await toursCol().doc(tourId).update({
          status: 'active',
          stripePaymentId: session.payment_intent,
          updatedAt: Timestamp.now(),
        });

        await paymentsCol().add({
          agencyId: tour.agencyId,
          tourId: tour.id,
          stripeSessionId: session.id,
          stripePaymentIntent: session.payment_intent,
          amount: session.amount_total || 0,
          currency: session.currency || 'eur',
          status: 'completed',
          createdAt: Timestamp.now(),
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

- [ ] **Step 6: Rewrite admin/users/[id].ts**

```typescript
import type { APIRoute } from 'astro';
import { adminAuth } from '../../../../lib/firebase';
import { usersCol, docToObj, Timestamp, type UserDoc } from '../../../../lib/firestore';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  });

async function requireAdmin(context: Parameters<APIRoute>[0]) {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export const GET: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing user ID' }, 400);

  const userDoc = await usersCol().doc(id).get();
  const user = docToObj<UserDoc>(userDoc);
  if (!user) return json({ error: 'User not found' }, 404);

  return json(user);
};

export const PUT: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing user ID' }, 400);

  const body = await context.request.json();
  const updateData: Record<string, any> = { updatedAt: Timestamp.now() };
  if (body.role !== undefined) updateData.role = body.role;
  if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;

  await usersCol().doc(id).update(updateData);
  const updated = await usersCol().doc(id).get();
  if (!updated.exists) return json({ error: 'User not found' }, 404);

  return json({ id: updated.id, ...updated.data() });
};

export const DELETE: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing user ID' }, 400);

  // Delete from both Firebase Auth and Firestore
  try { await adminAuth.deleteUser(id); } catch { /* user may not exist in Auth */ }
  await usersCol().doc(id).delete();
  return json({ success: true });
};
```

- [ ] **Step 7: Rewrite admin/tours/[id].ts**

```typescript
import type { APIRoute } from 'astro';
import { toursCol, Timestamp } from '../../../../lib/firestore';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  });

async function requireAdmin(context: Parameters<APIRoute>[0]) {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export const PUT: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing tour ID' }, 400);

  const body = await context.request.json();
  const { status } = body;

  await toursCol().doc(id).update({ status, updatedAt: Timestamp.now() });
  const updated = await toursCol().doc(id).get();
  if (!updated.exists) return json({ error: 'Tour not found' }, 404);

  return json({ id: updated.id, ...updated.data() });
};

export const DELETE: APIRoute = async (context) => {
  if (!await requireAdmin(context)) return json({ error: 'Forbidden' }, 403);
  const { id } = context.params;
  if (!id) return json({ error: 'Missing tour ID' }, 400);

  await toursCol().doc(id).delete();
  return json({ success: true });
};
```

- [ ] **Step 8: Commit**

```bash
git add src/pages/api/favourites/ src/pages/api/contact.ts src/pages/api/stripe/ src/pages/api/admin/
git commit -m "feat: migrate favourites, contact, stripe, admin API routes to Firestore"
```

---

### Task 11: Migrate Page Components (Dashboard, Account, Admin, Tours)

**Files:**
- Modify: `src/pages/account/favourites.astro`
- Modify: `src/pages/tours/[slug].astro`
- Modify: `src/pages/dashboard/index.astro`
- Modify: `src/pages/dashboard/tours/index.astro`
- Modify: `src/pages/dashboard/tours/[id]/edit.astro`
- Modify: `src/pages/admin/index.astro`
- Modify: `src/pages/admin/users.astro`
- Modify: `src/pages/admin/listings.astro`

- [ ] **Step 1: Update favourites.astro**

Replace Drizzle imports and queries with Firestore:

```astro
---
export const prerender = false;
import AccountLayout from '../../layouts/AccountLayout.astro';
import TourCard from '../../components/tours/TourCard.astro';
import { favouritesCol, toursCol, docToObj, type TourDoc, type FavouriteDoc } from '../../lib/firestore';

const user = Astro.locals.user;
if (!user) return Astro.redirect('/auth/login');

const favsSnapshot = await favouritesCol()
  .where('userId', '==', user.id)
  .orderBy('createdAt', 'asc')
  .get();

const tourIds = favsSnapshot.docs.map(doc => doc.data().tourId);

let toursWithThumbnails: any[] = [];
if (tourIds.length > 0) {
  // Firestore 'in' queries support max 10 items
  const chunks = [];
  for (let i = 0; i < tourIds.length; i += 10) {
    chunks.push(tourIds.slice(i, i + 10));
  }

  const allTours: any[] = [];
  for (const chunk of chunks) {
    const snapshot = await toursCol().where('__name__', 'in', chunk).get();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      allTours.push({
        id: doc.id,
        ...data,
        thumbnail: data.images?.[0]?.url || null,
      });
    });
  }
  toursWithThumbnails = allTours;
}
---
```

Keep the rest of the template exactly as-is.

- [ ] **Step 2: Update tours/[slug].astro**

Replace Drizzle queries with Firestore:

```astro
---
export const prerender = false;
import PublicLayout from '../../layouts/PublicLayout.astro';
import TourGallery from '../../components/tours/TourGallery.astro';
import TourInfo from '../../components/tours/TourInfo.astro';
import AgencyContactCard from '../../components/tours/AgencyContactCard.astro';
import { toursCol, usersCol, docToObj, type TourDoc, type UserDoc } from '../../lib/firestore';
import { getDemoTourBySlug, DEMO_AGENCY, DEMO_REVIEWS } from '../../lib/demo-tours';

const { slug } = Astro.params;
if (!slug) return Astro.redirect('/tours');

let tour: any = null;
let images: any[] = [];
let agency: any = null;

try {
  const snapshot = await toursCol().where('slug', '==', slug).limit(1).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    tour = { id: doc.id, ...doc.data() };
    images = (tour.images || []).map((img: any) => ({
      url: img.url,
      altText: img.altText || '',
    }));
  }
} catch {
  // DB unavailable
}

if (!tour || tour.status !== 'active') {
  const demoTour = getDemoTourBySlug(slug);
  if (!demoTour) return Astro.redirect('/tours');
  tour = demoTour;
}

try {
  if (tour.agencyId) {
    const agencyDoc = await usersCol().doc(tour.agencyId).get();
    agency = docToObj<UserDoc>(agencyDoc);
  }
} catch {
  // DB unavailable
}

const reviews = DEMO_REVIEWS[slug] || [];

const tourWithAgency = {
  ...tour,
  agencyName: agency?.companyName || agency?.name || DEMO_AGENCY.companyName,
  agencyVerified: agency?.isVerified || DEMO_AGENCY.isVerified,
  rating: tour.rating,
  reviewCount: tour.reviewCount,
};
---
```

Keep the rest of the template exactly as-is.

- [ ] **Step 3: Update dashboard/index.astro**

Replace Drizzle queries with Firestore for stats:

```astro
---
export const prerender = false;
import DashboardLayout from '../../layouts/DashboardLayout.astro';
import { toursCol, paymentsCol } from '../../lib/firestore';

const user = Astro.locals.user;
if (!user) return Astro.redirect('/auth/login');

const toursSnapshot = await toursCol().where('agencyId', '==', user.id).get();
const allTours = toursSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

const totalListings = allTours.length;
const activeListings = allTours.filter(t => t.status === 'active').length;
const pendingPayment = allTours.filter(t => t.status === 'pending_payment').length;

const paymentsSnapshot = await paymentsCol().where('agencyId', '==', user.id).where('status', '==', 'completed').get();
const totalSpent = paymentsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

const recentTours = allTours
  .sort((a: any, b: any) => {
    const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
    const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
    return bTime.getTime() - aTime.getTime();
  })
  .slice(0, 5);
---
```

Keep the rest of the template exactly as-is (the template references `totalListings`, `activeListings`, etc. which are unchanged).

- [ ] **Step 4: Update dashboard/tours/index.astro**

```astro
---
export const prerender = false;
import DashboardLayout from '../../../layouts/DashboardLayout.astro';
import ListingsTable from '../../../components/dashboard/ListingsTable.astro';
import Button from '../../../components/ui/Button.astro';
import { toursCol } from '../../../lib/firestore';

const user = Astro.locals.user;
if (!user) return Astro.redirect('/auth/login');

const snapshot = await toursCol()
  .where('agencyId', '==', user.id)
  .orderBy('createdAt', 'desc')
  .get();

const userTours = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
---
```

Keep the rest of the template exactly as-is.

- [ ] **Step 5: Update dashboard/tours/[id]/edit.astro**

Replace Drizzle tour fetch with Firestore. The tour images are now in the `images` array on the tour document:

```astro
---
// Replace the Drizzle imports and queries with:
import { toursCol, docToObj, type TourDoc } from '../../../../lib/firestore';

const tourDoc = await toursCol().doc(tourId).get();
const tour = docToObj<TourDoc>(tourDoc);
// Images are now: tour.images (array on the document)
const images = tour?.images || [];
---
```

- [ ] **Step 6: Update dashboard/billing.astro**

Replace Drizzle leftJoin with Firestore queries:

```astro
---
export const prerender = false;
import DashboardLayout from '../../layouts/DashboardLayout.astro';
import BillingHistory from '../../components/dashboard/BillingHistory.astro';
import { paymentsCol, toursCol, docToObj, type TourDoc } from '../../lib/firestore';
import { formatPrice } from '../../lib/utils';

const user = Astro.locals.user;
if (!user) return Astro.redirect('/auth/login');

const paymentsSnapshot = await paymentsCol()
  .where('agencyId', '==', user.id)
  .orderBy('createdAt', 'desc')
  .get();

// Fetch tour names for each payment
const userPayments = await Promise.all(
  paymentsSnapshot.docs.map(async (doc) => {
    const data = doc.data();
    let tourName = 'Unknown Tour';
    try {
      const tourDoc = await toursCol().doc(data.tourId).get();
      if (tourDoc.exists) tourName = tourDoc.data()!.name;
    } catch { /* tour may be deleted */ }
    return {
      id: doc.id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      tourName,
      tourId: data.tourId,
    };
  })
);

const totalSpent = userPayments
  .filter((p) => p.status === 'completed')
  .reduce((sum, p) => sum + p.amount, 0);
---
```

Keep the rest of the template exactly as-is.

- [ ] **Step 7: Update admin pages**

Update `src/pages/admin/index.astro`, `users.astro`, `listings.astro` to use Firestore queries. Replace `db.select().from(table)` with `collection().get()` and `docsToArray()`.

For `admin/listings.astro`, the current code joins tours with profiles — fetch tours first, then batch-fetch the agency profiles for the agencyIds found.

- [ ] **Step 8: Commit**

```bash
git add src/pages/account/ src/pages/tours/ src/pages/dashboard/ src/pages/admin/
git commit -m "feat: migrate all page components from Drizzle to Firestore"
```

---

### Task 12: Rewrite src/types/index.ts

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Replace Drizzle types with Firestore-based types**

```typescript
import type { UserDoc, TourDoc, TourImage, PaymentDoc, ContactMessageDoc, FavouriteDoc } from '../lib/firestore';

export type User = UserDoc & { id: string };
export type Tour = TourDoc & { id: string };
export type { TourImage };
export type Payment = PaymentDoc & { id: string };
export type ContactMessage = ContactMessageDoc & { id: string };
export type Favourite = FavouriteDoc & { id: string };

export type TourWithImages = Tour & {
  thumbnail: string | null;
};

export type UserRole = 'user' | 'agency' | 'admin';
export type TourStatus = 'pending_payment' | 'active' | 'inactive' | 'deleted';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: rewrite shared types to use Firestore interfaces"
```

---

### Task 13: Create Firestore Indexes

**Files:**
- Create: `firestore.indexes.json`

Firestore requires composite indexes for queries that combine `where` on one field with `orderBy` on another.

- [ ] **Step 1: Create firestore.indexes.json**

```json
{
  "indexes": [
    { "collectionGroup": "tours", "fields": [{ "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] },
    { "collectionGroup": "tours", "fields": [{ "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "price", "order": "ASCENDING" }] },
    { "collectionGroup": "tours", "fields": [{ "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "price", "order": "DESCENDING" }] },
    { "collectionGroup": "tours", "fields": [{ "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "name", "order": "ASCENDING" }] },
    { "collectionGroup": "tours", "fields": [{ "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "category", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] },
    { "collectionGroup": "tours", "fields": [{ "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "country", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] },
    { "collectionGroup": "tours", "fields": [{ "fieldPath": "agencyId", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] },
    { "collectionGroup": "favourites", "fields": [{ "fieldPath": "userId", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "ASCENDING" }] },
    { "collectionGroup": "payments", "fields": [{ "fieldPath": "agencyId", "order": "ASCENDING" }, { "fieldPath": "status", "order": "ASCENDING" }] },
    { "collectionGroup": "payments", "fields": [{ "fieldPath": "agencyId", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "DESCENDING" }] }
  ]
}
```

- [ ] **Step 2: Deploy indexes via Firebase CLI (or create manually in Firebase Console)**

```bash
npx firebase deploy --only firestore:indexes
```

Or create them manually in Firebase Console > Firestore > Indexes.

Note: Firestore will also auto-prompt you with index creation links in error messages when queries fail. You can click those links to create indexes on-demand.

- [ ] **Step 3: Commit**

```bash
git add firestore.indexes.json
git commit -m "feat: add Firestore composite indexes for tour queries"
```

---

### Task 14: Clean Up — Delete Supabase & Drizzle Files

**Files:**
- Delete: `src/lib/supabase.ts`
- Delete: `src/lib/db/index.ts`
- Delete: `src/lib/db/schema.ts`
- Delete: `drizzle.config.ts`
- Delete: `drizzle/` directory
- Delete: `.agents/skills/supabase-postgres-best-practices/` directory
- Modify: `.mcp.json` (remove Supabase MCP server)

- [ ] **Step 1: Delete Supabase and Drizzle files**

```bash
rm src/lib/supabase.ts
rm -rf src/lib/db/
rm drizzle.config.ts
rm -rf drizzle/
rm -rf .agents/skills/supabase-postgres-best-practices/
```

- [ ] **Step 2: Update .mcp.json — remove Supabase MCP**

Remove the `"supabase"` entry from `.mcp.json`, keeping only the Playwright server.

- [ ] **Step 3: Verify no remaining Supabase/Drizzle imports**

```bash
grep -r "supabase\|drizzle" src/ --include="*.ts" --include="*.astro" -l
```

Fix any remaining imports found.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove all Supabase and Drizzle files and config"
```

---

### Task 15: Build Verification & Fix TypeScript Errors

- [ ] **Step 1: Run the build**

```bash
npm run build
```

- [ ] **Step 2: Fix any TypeScript or import errors**

Iterate until the build passes. Common issues:
- Missing imports (old `db`, `schema`, `eq` imports)
- Type mismatches (Drizzle types → Firestore types)
- `price` field: was `numeric` string in Postgres, now `number` in Firestore — check comparisons

- [ ] **Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve build errors after Firebase migration"
```

---

### Task 16: Update Environment Variables on Vercel

- [ ] **Step 1: Remove old Supabase env vars from Vercel**

```bash
vercel env rm DATABASE_URL production
vercel env rm DATABASE_URL preview
vercel env rm DATABASE_URL development
vercel env rm PUBLIC_SUPABASE_URL production
vercel env rm PUBLIC_SUPABASE_URL preview
vercel env rm PUBLIC_SUPABASE_URL development
vercel env rm PUBLIC_SUPABASE_ANON_KEY production
vercel env rm PUBLIC_SUPABASE_ANON_KEY preview
vercel env rm PUBLIC_SUPABASE_ANON_KEY development
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
vercel env rm SUPABASE_SERVICE_ROLE_KEY preview
vercel env rm SUPABASE_SERVICE_ROLE_KEY development
```

- [ ] **Step 2: Add Firebase env vars to Vercel**

Add the following for all environments (production, preview, development):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `PUBLIC_FIREBASE_API_KEY`
- `PUBLIC_FIREBASE_AUTH_DOMAIN`
- `PUBLIC_FIREBASE_PROJECT_ID`
- `PUBLIC_FIREBASE_STORAGE_BUCKET`
- `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `PUBLIC_FIREBASE_APP_ID`

Get values from Firebase Console > Project Settings > Service Accounts (for admin keys) and General (for client config).

- [ ] **Step 3: Deploy and verify**

```bash
vercel --prod
```

---

## Known Limitations & Notes

**Search:** Firestore has no full-text search. The `searchTours` function fetches all active tours and filters in-memory. This is fine for hundreds of tours but will need a search service (Algolia, Typesense) if the catalogue grows to thousands.

**Data migration:** This plan is a fresh-start migration (code only). Existing Supabase data (users, tours, payments) will not be carried over. If data migration is needed, a separate script must be written to export from PostgreSQL, transform (e.g., `price` string→number, create Firebase Auth users), and import into Firestore.

**`publicId` vs `storagePath`:** The image upload API contract still returns `publicId` for backward compatibility with the ImageUpload component, but internally the field is `storagePath` in Firestore.
