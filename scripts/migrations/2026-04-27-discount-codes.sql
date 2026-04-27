-- scripts/migrations/2026-04-27-discount-codes.sql

create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  max_redemptions integer,                       -- null = unlimited
  current_redemptions integer not null default 0,
  applies_to_plans text[] not null default '{}', -- empty array = any plan
  is_active boolean not null default true,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Note: discount_codes.code already has a unique B-tree index from the UNIQUE
-- constraint above; no separate code lookup index is needed.
create index if not exists discount_codes_active_idx on discount_codes (is_active);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_id text not null,
  source text not null check (source in ('discount_code', 'stripe')),
  discount_code_id uuid references discount_codes(id) on delete set null,
  is_active boolean not null default true,
  started_at timestamptz not null default now(),
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on subscriptions (user_id);
create index if not exists subscriptions_active_idx on subscriptions (is_active);
create index if not exists subscriptions_code_idx on subscriptions (discount_code_id);

-- Enforce one active subscription per user
create unique index if not exists subscriptions_one_active_per_user
  on subscriptions (user_id) where is_active = true;

alter table discount_codes enable row level security;
alter table subscriptions enable row level security;
-- Service-role client bypasses RLS; no permissive policies needed.

create or replace function bump_discount_redemption_count()
returns trigger as $$
begin
  if new.source = 'discount_code' and new.discount_code_id is not null then
    update discount_codes
    set current_redemptions = current_redemptions + 1,
        updated_at = now()
    where id = new.discount_code_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists subscriptions_bump_redemption on subscriptions;
create trigger subscriptions_bump_redemption
after insert on subscriptions
for each row execute function bump_discount_redemption_count();
