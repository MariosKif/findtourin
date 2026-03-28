# Firebase to Supabase Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Firebase services (Auth, Firestore, Storage) with Supabase equivalents (Auth, PostgreSQL, Storage).

**Architecture:** Supabase Auth handles user authentication with JWT sessions (replacing Firebase session cookies). PostgreSQL tables replace Firestore collections. Supabase Storage replaces Firebase Storage for tour images. The server-side Supabase client uses the service role key; the client-side uses the anon key.

**Tech Stack:** @supabase/supabase-js, Supabase Auth (email/password + Google OAuth), PostgreSQL, Supabase Storage

---

## File Structure

### New files
- `src/lib/supabase.ts` — Server-side Supabase client (service role)
- `src/lib/supabase-client.ts` — Client-side Supabase client (anon key)

### Files to modify (rewrite internals)
- `src/lib/auth-helpers.ts` — Use Supabase session verification
- `src/lib/storage.ts` — Use Supabase Storage
- `src/lib/search.ts` — Use Supabase PostgreSQL queries
- `src/lib/stripe.ts` — Replace Firestore config read with Supabase
- `src/types/index.ts` — Standalone types (no Firestore dependency)
- `src/middleware.ts` — Use Supabase session verification
- `src/pages/api/auth/login.ts` — Supabase email/password sign-in
- `src/pages/api/auth/register.ts` — Supabase sign-up
- `src/pages/api/auth/google.ts` — Supabase Google OAuth
- `src/pages/api/auth/complete-profile.ts` — Supabase profile upsert
- `src/pages/api/auth/change-password.ts` — Supabase password update
- `src/pages/api/auth/update-profile.ts` — Supabase profile update
- `src/pages/api/auth/logout.ts` — Supabase sign-out
- `src/pages/api/tours/index.ts` — Supabase queries
- `src/pages/api/tours/[id].ts` — Supabase queries
- `src/pages/api/tours/[id]/images.ts` — Supabase queries
- `src/pages/api/favourites/index.ts` — Supabase queries
- `src/pages/api/favourites/[tourId].ts` — Supabase queries
- `src/pages/api/contact.ts` — Supabase insert
- `src/pages/api/cities.ts` — Supabase query
- `src/pages/api/stripe/checkout.ts` — Supabase query
- `src/pages/api/stripe/webhook.ts` — Supabase queries
- `src/pages/api/admin/users/[id].ts` — Supabase queries + auth admin
- `src/pages/api/admin/tours/[id].ts` — Supabase queries
- `src/pages/tours/[slug].astro` — Supabase queries
- `src/pages/tours/index.astro` — (already uses searchTours, just needs search.ts update)
- `src/pages/account/settings.astro` — Supabase queries
- `src/pages/account/favourites.astro` — Supabase queries
- `src/pages/dashboard/index.astro` — Supabase queries
- `src/pages/dashboard/tours/index.astro` — Supabase queries
- `src/pages/admin/index.astro` — Supabase queries
- `src/pages/admin/users.astro` — Supabase queries
- `src/pages/admin/listings.astro` — Supabase queries
- `src/pages/auth/callback.astro` — Supabase OAuth callback
- `src/pages/auth/complete-profile.astro` — Supabase session check
- `src/components/auth/LoginForm.astro` — Supabase client auth
- `src/components/auth/RegisterForm.astro` — Supabase client auth
- `.env` — Already updated with Supabase keys
- `.env.example` — Update template
- `package.json` — Remove firebase/firebase-admin, add @supabase/supabase-js

### Files to delete
- `src/lib/firebase.ts`
- `src/lib/firebase-client.ts`
- `src/lib/firestore.ts`
- `firestore.indexes.json`

---

## Database Schema

The following SQL creates the PostgreSQL tables equivalent to the Firestore collections.

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profiles table (linked to auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'user' check (role in ('user', 'agency', 'admin')),
  phone text,
  website text,
  company_name text,
  company_desc text,
  avatar_url text,
  is_verified boolean not null default false,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tours table
create table public.tours (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text not null,
  country text not null,
  city text not null,
  departure_country text,
  departure_city text,
  price numeric not null,
  currency text not null default 'EUR',
  start_date timestamptz,
  end_date timestamptz,
  duration_days integer,
  max_participants integer,
  category text not null,
  contact_email text,
  contact_phone text,
  contact_website text,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'active', 'inactive', 'deleted')),
  stripe_payment_id text,
  images jsonb not null default '[]'::jsonb,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Favourites table
create table public.favourites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, tour_id)
);

-- Payments table
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid not null references public.users(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  stripe_session_id text,
  stripe_payment_intent text,
  amount integer not null,
  currency text not null default 'eur',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

-- Contact messages table
create table public.contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Config table (for pricing etc)
create table public.config (
  key text primary key,
  value jsonb not null
);

-- Insert default pricing config
insert into public.config (key, value) values ('pricing', '{"listing_fee_cents": 4900}');

-- Indexes for common queries
create index idx_tours_status on public.tours(status);
create index idx_tours_agency on public.tours(agency_id);
create index idx_tours_slug on public.tours(slug);
create index idx_tours_category on public.tours(category);
create index idx_tours_country on public.tours(country);
create index idx_tours_created on public.tours(created_at desc);
create index idx_favourites_user on public.favourites(user_id);
create index idx_favourites_tour on public.favourites(tour_id);
create index idx_payments_agency on public.payments(agency_id);
create index idx_payments_status on public.payments(status);

-- RLS policies
alter table public.users enable row level security;
alter table public.tours enable row level security;
alter table public.favourites enable row level security;
alter table public.payments enable row level security;
alter table public.contact_messages enable row level security;
alter table public.config enable row level security;

-- Users: anyone can read, users can update own profile
create policy "Users are viewable by everyone" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Tours: active tours are public, agencies manage their own
create policy "Active tours are viewable by everyone" on public.tours for select using (status = 'active' or agency_id = auth.uid());
create policy "Agencies can insert own tours" on public.tours for insert with check (agency_id = auth.uid());
create policy "Agencies can update own tours" on public.tours for update using (agency_id = auth.uid());

-- Favourites: users manage their own
create policy "Users can view own favourites" on public.favourites for select using (user_id = auth.uid());
create policy "Users can insert own favourites" on public.favourites for insert with check (user_id = auth.uid());
create policy "Users can delete own favourites" on public.favourites for delete using (user_id = auth.uid());

-- Payments: agencies can view their own
create policy "Agencies can view own payments" on public.payments for select using (agency_id = auth.uid());

-- Contact messages: anyone can insert
create policy "Anyone can send contact messages" on public.contact_messages for insert with check (true);

-- Config: anyone can read
create policy "Config is readable" on public.config for select using (true);

-- Create storage bucket for tour images
-- (Done via Supabase dashboard or API: bucket name = 'tour-images', public)

-- Favourite count view for efficient tour queries
create or replace function public.get_favourite_count(tour_uuid uuid)
returns bigint as $$
  select count(*) from public.favourites where tour_id = tour_uuid;
$$ language sql stable;
```

---

### Task 1: Install dependencies and create Supabase clients

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/supabase-client.ts`
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Install @supabase/supabase-js and remove Firebase packages**

```bash
npm install @supabase/supabase-js
npm uninstall firebase firebase-admin
```

- [ ] **Step 2: Create server-side Supabase client**

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
```

- [ ] **Step 3: Create client-side Supabase client**

Create `src/lib/supabase-client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 4: Update .env.example**

Replace Firebase variables with Supabase variables.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts src/lib/supabase-client.ts package.json package-lock.json .env.example
git commit -m "feat: add Supabase clients, remove Firebase deps"
```

---

### Task 2: Create database schema in Supabase

- [ ] **Step 1: Run the SQL schema**

Execute the SQL from the "Database Schema" section above in the Supabase SQL editor (dashboard) or via the Supabase client.

- [ ] **Step 2: Create 'tour-images' storage bucket**

In Supabase dashboard: Storage > New Bucket > name: `tour-images`, Public: true.

Or via SQL/API.

- [ ] **Step 3: Verify tables exist**

Check that all tables (users, tours, favourites, payments, contact_messages, config) are created.

---

### Task 3: Replace types and delete Firestore helpers

**Files:**
- Modify: `src/types/index.ts`
- Delete: `src/lib/firestore.ts`
- Delete: `src/lib/firebase.ts`
- Delete: `src/lib/firebase-client.ts`
- Delete: `firestore.indexes.json`

- [ ] **Step 1: Rewrite types/index.ts**

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'agency' | 'admin';
  phone?: string | null;
  website?: string | null;
  company_name?: string | null;
  company_desc?: string | null;
  avatar_url?: string | null;
  is_verified: boolean;
  stripe_customer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TourImage {
  url: string;
  storage_path: string;
  position: number;
  alt_text?: string | null;
}

export interface Tour {
  id: string;
  agency_id: string;
  name: string;
  slug: string;
  description: string;
  country: string;
  city: string;
  departure_country?: string | null;
  departure_city?: string | null;
  price: number;
  currency: string;
  start_date?: string | null;
  end_date?: string | null;
  duration_days?: number | null;
  max_participants?: number | null;
  category: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_website?: string | null;
  status: string;
  stripe_payment_id?: string | null;
  images: TourImage[];
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Favourite {
  id: string;
  user_id: string;
  tour_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  agency_id: string;
  tour_id: string;
  stripe_session_id?: string | null;
  stripe_payment_intent?: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export type TourWithImages = Tour & {
  thumbnail: string | null;
};

export type UserRole = 'user' | 'agency' | 'admin';
export type TourStatus = 'pending_payment' | 'active' | 'inactive' | 'deleted';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
```

- [ ] **Step 2: Delete Firebase files**

```bash
rm src/lib/firebase.ts src/lib/firebase-client.ts src/lib/firestore.ts firestore.indexes.json
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: replace Firestore types with standalone types, delete Firebase files"
```

---

### Task 4: Rewrite auth-helpers.ts and middleware.ts

**Files:**
- Modify: `src/lib/auth-helpers.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Rewrite auth-helpers.ts**

```typescript
import { supabase } from './supabase';
import type { AstroCookies } from 'astro';
import type { User } from '../types';

interface AuthContext {
  request: Request;
  cookies: AstroCookies;
}

export async function getAuthenticatedUser(context: AuthContext): Promise<User | null> {
  const accessToken = context.cookies.get('sb-access-token')?.value;
  const refreshToken = context.cookies.get('sb-refresh-token')?.value;
  if (!accessToken) return null;

  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser(accessToken);
    if (error || !authUser) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    return profile;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Rewrite middleware.ts**

```typescript
import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';
import type { User } from './types';

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
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth-helpers.ts src/middleware.ts
git commit -m "feat: rewrite auth-helpers and middleware for Supabase"
```

---

### Task 5: Rewrite storage.ts

**Files:**
- Modify: `src/lib/storage.ts`

- [ ] **Step 1: Rewrite storage.ts**

```typescript
import { supabase } from './supabase';

const BUCKET = 'tour-images';

export async function uploadImage(file: Buffer, fileName: string): Promise<{ url: string; storagePath: string }> {
  const storagePath = `tours/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: getContentType(fileName),
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return { url: publicUrl, storagePath };
}

export async function deleteImage(storagePath: string) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error && !error.message.includes('Not found')) {
    throw new Error(`Delete failed: ${error.message}`);
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

- [ ] **Step 2: Commit**

```bash
git add src/lib/storage.ts
git commit -m "feat: rewrite storage.ts for Supabase Storage"
```

---

### Task 6: Rewrite search.ts

**Files:**
- Modify: `src/lib/search.ts`

- [ ] **Step 1: Rewrite search.ts**

```typescript
import { supabase } from './supabase';
import type { Tour } from '../types';

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
  const offset = (page - 1) * ITEMS_PER_PAGE;

  let query = supabase
    .from('tours')
    .select('*, favourites(count)', { count: 'exact' })
    .eq('status', 'active');

  if (params.category) query = query.eq('category', params.category);
  if (params.country) query = query.eq('country', params.country);
  if (params.city) query = query.eq('city', params.city);
  if (params.departureCountry) query = query.eq('departure_country', params.departureCountry);
  if (params.departureCity) query = query.eq('departure_city', params.departureCity);
  if (params.minPrice !== undefined) query = query.gte('price', params.minPrice);
  if (params.maxPrice !== undefined) query = query.lte('price', params.maxPrice);
  if (params.dateFrom) query = query.gte('start_date', params.dateFrom);
  if (params.dateTo) query = query.lte('start_date', params.dateTo);

  if (params.q) {
    const q = `%${params.q}%`;
    query = query.or(`name.ilike.${q},description.ilike.${q},country.ilike.${q},city.ilike.${q},category.ilike.${q}`);
  }

  if (params.destination) {
    const dest = `%${params.destination}%`;
    query = query.or(`country.ilike.${dest},city.ilike.${dest}`);
  }

  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + ITEMS_PER_PAGE - 1);

  const { data: tours, count, error } = await query;
  if (error) throw error;

  const total = count || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const toursWithImages = (tours || []).map((tour: any) => {
    const favouriteCount = tour.favourites?.[0]?.count || 0;
    const { favourites: _fav, ...rest } = tour;
    return {
      ...rest,
      images: rest.images || [],
      thumbnail: rest.images?.[0]?.url || null,
      favouriteCount,
    };
  });

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

- [ ] **Step 2: Commit**

```bash
git add src/lib/search.ts
git commit -m "feat: rewrite search.ts for Supabase PostgreSQL"
```

---

### Task 7: Rewrite stripe.ts

**Files:**
- Modify: `src/lib/stripe.ts`

- [ ] **Step 1: Rewrite stripe.ts**

Replace `adminDb` config read with Supabase query:

```typescript
import Stripe from 'stripe';
import { supabase } from './supabase';

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia',
});

async function getListingFeeCents(): Promise<number> {
  try {
    const { data } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'pricing')
      .single();
    return data?.value?.listing_fee_cents ?? 4900;
  } catch {
    return 4900;
  }
}

export async function createCheckoutSession(params: {
  tourId: string;
  tourName: string;
  agencyEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const listingFeeCents = await getListingFeeCents();

  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.agencyEmail,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Listing Fee: ${params.tourName}`,
            description: 'One-time fee to publish your tour listing on FindToursIn',
          },
          unit_amount: listingFeeCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      tourId: params.tourId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}

export async function verifyWebhookSignature(body: string, signature: string) {
  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';
  return stripe.webhooks.constructEvent(body, signature, secret);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/stripe.ts
git commit -m "feat: rewrite stripe.ts for Supabase"
```

---

### Task 8: Rewrite auth API routes

**Files:**
- Modify: `src/pages/api/auth/login.ts`
- Modify: `src/pages/api/auth/register.ts`
- Modify: `src/pages/api/auth/google.ts`
- Modify: `src/pages/api/auth/complete-profile.ts`
- Modify: `src/pages/api/auth/change-password.ts`
- Modify: `src/pages/api/auth/update-profile.ts`
- Modify: `src/pages/api/auth/logout.ts`

- [ ] **Step 1: Rewrite login.ts**

Uses Supabase `signInWithPassword`, sets access/refresh token cookies.

- [ ] **Step 2: Rewrite register.ts**

Uses Supabase `auth.admin.createUser` + inserts profile into `users` table.

- [ ] **Step 3: Rewrite google.ts**

Handles Supabase OAuth token exchange, checks if user profile exists.

- [ ] **Step 4: Rewrite complete-profile.ts**

Verifies session, inserts/upserts profile into `users` table.

- [ ] **Step 5: Rewrite change-password.ts**

Uses `supabase.auth.admin.updateUserById` to change password.

- [ ] **Step 6: Rewrite update-profile.ts**

Updates `users` table row for authenticated user.

- [ ] **Step 7: Rewrite logout.ts**

Deletes auth cookies.

- [ ] **Step 8: Commit**

```bash
git add src/pages/api/auth/
git commit -m "feat: rewrite all auth API routes for Supabase"
```

---

### Task 9: Rewrite tours API routes

**Files:**
- Modify: `src/pages/api/tours/index.ts`
- Modify: `src/pages/api/tours/[id].ts`
- Modify: `src/pages/api/tours/[id]/images.ts`

- [ ] **Step 1: Rewrite tours/index.ts**

GET uses `searchTours`. POST uses `supabase.from('tours').insert()`.

- [ ] **Step 2: Rewrite tours/[id].ts**

GET/PUT/DELETE using `supabase.from('tours')` queries.

- [ ] **Step 3: Rewrite tours/[id]/images.ts**

POST/DELETE update the `images` JSONB column.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/tours/
git commit -m "feat: rewrite tours API routes for Supabase"
```

---

### Task 10: Rewrite favourites, contact, cities, stripe API routes

**Files:**
- Modify: `src/pages/api/favourites/index.ts`
- Modify: `src/pages/api/favourites/[tourId].ts`
- Modify: `src/pages/api/contact.ts`
- Modify: `src/pages/api/cities.ts`
- Modify: `src/pages/api/stripe/checkout.ts`
- Modify: `src/pages/api/stripe/webhook.ts`

- [ ] **Step 1: Rewrite favourites/index.ts**

GET/POST using `supabase.from('favourites')`.

- [ ] **Step 2: Rewrite favourites/[tourId].ts**

DELETE using `supabase.from('favourites').delete()`.

- [ ] **Step 3: Rewrite contact.ts**

POST uses `supabase.from('contact_messages').insert()`.

- [ ] **Step 4: Rewrite cities.ts**

GET uses `supabase.from('tours').select('city')` with filters.

- [ ] **Step 5: Rewrite stripe/checkout.ts**

Replace Firestore tour fetch with Supabase query.

- [ ] **Step 6: Rewrite stripe/webhook.ts**

Replace Firestore updates with Supabase updates/inserts.

- [ ] **Step 7: Commit**

```bash
git add src/pages/api/favourites/ src/pages/api/contact.ts src/pages/api/cities.ts src/pages/api/stripe/
git commit -m "feat: rewrite favourites, contact, cities, stripe API for Supabase"
```

---

### Task 11: Rewrite admin API routes

**Files:**
- Modify: `src/pages/api/admin/users/[id].ts`
- Modify: `src/pages/api/admin/tours/[id].ts`

- [ ] **Step 1: Rewrite admin/users/[id].ts**

GET/PUT/DELETE using `supabase.from('users')` and `supabase.auth.admin.deleteUser()`.

- [ ] **Step 2: Rewrite admin/tours/[id].ts**

PUT/DELETE using `supabase.from('tours')`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/
git commit -m "feat: rewrite admin API routes for Supabase"
```

---

### Task 12: Rewrite Astro pages with Firestore queries

**Files:**
- Modify: `src/pages/tours/[slug].astro`
- Modify: `src/pages/account/settings.astro`
- Modify: `src/pages/account/favourites.astro`
- Modify: `src/pages/dashboard/index.astro`
- Modify: `src/pages/dashboard/tours/index.astro`
- Modify: `src/pages/admin/index.astro`
- Modify: `src/pages/admin/users.astro`
- Modify: `src/pages/admin/listings.astro`

- [ ] **Step 1: Rewrite [slug].astro** — Replace Firestore queries with `supabase.from('tours')`.

- [ ] **Step 2: Rewrite account/settings.astro** — Replace `adminAuth.getUser` with Supabase auth check.

- [ ] **Step 3: Rewrite account/favourites.astro** — Replace Firestore favourites/tours queries with Supabase.

- [ ] **Step 4: Rewrite dashboard/index.astro** — Replace Firestore queries with Supabase.

- [ ] **Step 5: Rewrite dashboard/tours/index.astro** — Replace Firestore query with Supabase.

- [ ] **Step 6: Rewrite admin pages** (index, users, listings) — Replace Firestore queries with Supabase.

- [ ] **Step 7: Commit**

```bash
git add src/pages/tours/[slug].astro src/pages/account/ src/pages/dashboard/ src/pages/admin/
git commit -m "feat: rewrite all Astro pages for Supabase"
```

---

### Task 13: Rewrite client-side auth components

**Files:**
- Modify: `src/components/auth/LoginForm.astro`
- Modify: `src/components/auth/RegisterForm.astro`
- Modify: `src/pages/auth/callback.astro`
- Modify: `src/pages/auth/complete-profile.astro`

- [ ] **Step 1: Rewrite LoginForm.astro**

Replace Firebase client SDK with Supabase client. Email/password login calls server API. Google login uses `supabaseClient.auth.signInWithOAuth({ provider: 'google' })`.

- [ ] **Step 2: Rewrite RegisterForm.astro**

Replace Firebase client SDK with server-side registration via API. Google sign-up uses Supabase OAuth.

- [ ] **Step 3: Rewrite callback.astro**

Handle Supabase OAuth callback — exchange code for session, set cookies.

- [ ] **Step 4: Rewrite complete-profile.astro**

Replace `adminAuth.verifySessionCookie` with Supabase session verification.

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/ src/pages/auth/
git commit -m "feat: rewrite client auth components for Supabase"
```

---

### Task 14: Cleanup and verify

- [ ] **Step 1: Verify no Firebase imports remain**

```bash
grep -r "firebase" src/ --include="*.ts" --include="*.astro" -l
```

Should return no files.

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build
```

- [ ] **Step 3: Test locally**

```bash
npm run dev
```

Test: login, register, create tour, search tours, favourites, admin panel.

- [ ] **Step 4: Update all camelCase field references to snake_case**

Audit all components (TourCard, TourInfo, etc.) that reference tour/user properties and ensure they use snake_case (e.g., `tour.agencyId` → `tour.agency_id`, `tour.viewCount` → `tour.view_count`, `user.companyName` → `user.company_name`, etc.).

Key files to check:
- `src/components/tours/TourCard.astro`
- `src/components/tours/TourInfo.astro`
- `src/components/tours/AgencyContactCard.astro`
- `src/components/dashboard/ListingsTable.astro`
- `src/components/dashboard/StatsCards.astro`
- `src/lib/demo-tours.ts`

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: cleanup Firebase remnants, verify Supabase migration complete"
```
