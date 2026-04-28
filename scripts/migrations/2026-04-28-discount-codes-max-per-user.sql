-- scripts/migrations/2026-04-28-discount-codes-max-per-user.sql

alter table discount_codes
  add column if not exists max_per_user integer;

-- Sanity index for the per-user count query inside the RPC
create index if not exists subscriptions_user_code_idx
  on subscriptions (user_id, discount_code_id)
  where discount_code_id is not null;
