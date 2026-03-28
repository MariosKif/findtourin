-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profiles table (linked to auth.users)
create table if not exists public.users (
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
create table if not exists public.tours (
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
create table if not exists public.favourites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  tour_id uuid not null references public.tours(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, tour_id)
);

-- Payments table
create table if not exists public.payments (
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
create table if not exists public.contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Config table (for pricing etc)
create table if not exists public.config (
  key text primary key,
  value jsonb not null
);

-- Insert default pricing config
insert into public.config (key, value) values ('pricing', '{"listing_fee_cents": 4900}') on conflict (key) do nothing;

-- Indexes for common queries
create index if not exists idx_tours_status on public.tours(status);
create index if not exists idx_tours_agency on public.tours(agency_id);
create index if not exists idx_tours_slug on public.tours(slug);
create index if not exists idx_tours_category on public.tours(category);
create index if not exists idx_tours_country on public.tours(country);
create index if not exists idx_tours_created on public.tours(created_at desc);
create index if not exists idx_favourites_user on public.favourites(user_id);
create index if not exists idx_favourites_tour on public.favourites(tour_id);
create index if not exists idx_payments_agency on public.payments(agency_id);
create index if not exists idx_payments_status on public.payments(status);

-- RLS policies
alter table public.users enable row level security;
alter table public.tours enable row level security;
alter table public.favourites enable row level security;
alter table public.payments enable row level security;
alter table public.contact_messages enable row level security;
alter table public.config enable row level security;

-- Users policies
create policy "Users are viewable by everyone" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Service role can insert users" on public.users for insert with check (true);

-- Tours policies
create policy "Active tours are viewable by everyone" on public.tours for select using (status = 'active' or agency_id = auth.uid());
create policy "Agencies can insert own tours" on public.tours for insert with check (agency_id = auth.uid());
create policy "Agencies can update own tours" on public.tours for update using (agency_id = auth.uid());

-- Favourites policies
create policy "Users can view own favourites" on public.favourites for select using (user_id = auth.uid());
create policy "Users can insert own favourites" on public.favourites for insert with check (user_id = auth.uid());
create policy "Users can delete own favourites" on public.favourites for delete using (user_id = auth.uid());

-- Payments policies
create policy "Agencies can view own payments" on public.payments for select using (agency_id = auth.uid());

-- Contact messages policies
create policy "Anyone can send contact messages" on public.contact_messages for insert with check (true);

-- Config policies
create policy "Config is readable" on public.config for select using (true);

-- Favourite count function
create or replace function public.get_favourite_count(tour_uuid uuid)
returns bigint as $$
  select count(*) from public.favourites where tour_id = tour_uuid;
$$ language sql stable;
