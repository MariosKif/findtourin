-- scripts/migrations/2026-04-28-subscription-expiry.sql

alter table subscriptions
  add column if not exists expires_at timestamptz;

alter table discount_codes
  add column if not exists grants_duration_days integer
    check (grants_duration_days is null or grants_duration_days > 0);

-- Speeds up the cron sweep and the defensive filter in getActivePlanForUser.
create index if not exists subscriptions_expires_active_idx
  on subscriptions (expires_at)
  where is_active = true and expires_at is not null;
