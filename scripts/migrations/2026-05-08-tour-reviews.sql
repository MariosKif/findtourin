-- Tour reviews table — feeds AggregateRating + Review JSON-LD on tour pages.
-- Schema only fires on a tour when ≥3 verified=true rows exist (see
-- src/lib/reviews.ts MIN_REVIEWS_FOR_SCHEMA). Synthetic ratings are not
-- accepted; this table only ever holds real post-tour reviews.
--
-- Apply with:
--   psql $DATABASE_URL -f scripts/migrations/2026-05-08-tour-reviews.sql
-- or via the Supabase SQL editor.

create table if not exists tour_reviews (
  id              uuid primary key default gen_random_uuid(),
  tour_id         uuid not null references tours(id) on delete cascade,
  author          text not null,
  author_country  text,
  rating          smallint not null check (rating between 1 and 5),
  body            text,
  date_published  timestamptz not null default now(),
  verified        boolean not null default false,
  -- 'survey' | 'agency' | 'manual' | 'imported'. Reviews from external
  -- sources (Google Maps, etc.) carry the source for attribution.
  source          text not null default 'manual',
  -- Free-form moderation note — why this review was approved/rejected.
  -- Never surfaced to public consumers; for admin audit only.
  moderation_note text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists tour_reviews_tour_id_idx on tour_reviews(tour_id);
create index if not exists tour_reviews_verified_idx on tour_reviews(verified) where verified = true;
create index if not exists tour_reviews_date_idx on tour_reviews(date_published desc);

-- Row-Level Security. Public reads are restricted to verified reviews
-- only; writes require the service role.
alter table tour_reviews enable row level security;

-- Public can read verified reviews. The schema render path uses the
-- service-role client (see src/lib/supabase.ts), so this policy mostly
-- protects against accidental client-side queries that surface unverified
-- moderation-pending content.
drop policy if exists "tour_reviews public read verified" on tour_reviews;
create policy "tour_reviews public read verified"
  on tour_reviews for select
  using (verified = true);

-- Trigger to auto-update updated_at on row changes.
create or replace function tour_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tour_reviews_updated_at on tour_reviews;
create trigger tour_reviews_updated_at
  before update on tour_reviews
  for each row execute function tour_reviews_updated_at();

-- Optional: helper view for the schema-emit path. Keeps the read
-- contract stable even if we add columns later.
create or replace view verified_tour_reviews as
  select id, tour_id, author, author_country, rating, body, date_published, source
  from tour_reviews
  where verified = true
  order by date_published desc;
