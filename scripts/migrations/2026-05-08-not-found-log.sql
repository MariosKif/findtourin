-- 404 hit log. The /api/404-log endpoint inserts here whenever a 404 page
-- is rendered. Aggregating these tells us which URLs people are reaching
-- that don't exist — strong signal for missing content opportunities and
-- for catching internal-link rot.
--
-- Apply with:
--   psql $DATABASE_URL -f scripts/migrations/2026-05-08-not-found-log.sql
-- or via the Supabase SQL editor.

create table if not exists not_found_log (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,
  referer     text,
  user_agent  text,
  ip_country  text,
  -- Hourly bucket — used to dedupe spammy bots without losing trend signal.
  -- We upsert on (path, hour_bucket) and increment hits.
  hour_bucket timestamptz not null default date_trunc('hour', now()),
  hits        integer not null default 1,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);

create unique index if not exists not_found_log_path_hour_idx on not_found_log(path, hour_bucket);
create index if not exists not_found_log_path_idx on not_found_log(path);
create index if not exists not_found_log_last_seen_idx on not_found_log(last_seen desc);

-- Row-Level Security: writes via service role only; no public read.
alter table not_found_log enable row level security;
-- No SELECT policy → public reads are blocked. Admins query via the
-- service-role client.

-- Convenience view: top missing paths in the last 7 days. Useful for the
-- editorial team — shows what people are searching for that doesn't exist.
create or replace view top_missing_paths_7d as
  select path,
         sum(hits) as total_hits,
         max(last_seen) as latest
    from not_found_log
   where last_seen > now() - interval '7 days'
   group by path
   having sum(hits) >= 2
   order by total_hits desc
   limit 100;

-- RPC for atomic upsert. Called from /api/404-log. Returning the row id
-- so the API can confirm success; callers ignore the return otherwise.
create or replace function log_not_found(
  p_path        text,
  p_referer     text,
  p_user_agent  text,
  p_ip_country  text,
  p_hour_bucket timestamptz
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  insert into not_found_log (path, referer, user_agent, ip_country, hour_bucket, hits, first_seen, last_seen)
  values (p_path, p_referer, p_user_agent, p_ip_country, p_hour_bucket, 1, now(), now())
  on conflict (path, hour_bucket) do update
    set hits      = not_found_log.hits + 1,
        last_seen = now(),
        referer   = coalesce(not_found_log.referer, excluded.referer),
        user_agent = coalesce(not_found_log.user_agent, excluded.user_agent),
        ip_country = coalesce(not_found_log.ip_country, excluded.ip_country)
  returning id into v_id;
  return v_id;
end;
$$;

-- Allow service-role and authenticated calls; anon should NOT call this
-- directly — the API endpoint runs with service-role privileges.
revoke all on function log_not_found(text, text, text, text, timestamptz) from public;
grant execute on function log_not_found(text, text, text, text, timestamptz) to service_role;
