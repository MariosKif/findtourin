-- scripts/migrations/2026-05-19-agency-approval-and-ultimate-default.sql
-- 1. Add admin-approval gate for agencies (separate from public is_verified badge)
alter table users
  add column if not exists is_approved boolean not null default false;

create index if not exists users_role_approved_idx
  on users (role, is_approved)
  where role = 'agency';

-- 2. Backfill: every existing agency is grandfathered as approved so the live
--    site keeps working. Only NEW registrations after this migration land as
--    is_approved=false.
update users set is_approved = true where role = 'agency';

-- 3. Widen subscriptions.source so we can record auto-granted Ultimate plans
--    without faking a discount_code redemption or a Stripe session.
alter table subscriptions
  drop constraint if exists subscriptions_source_check;
alter table subscriptions
  add constraint subscriptions_source_check
    check (source in ('discount_code', 'stripe', 'auto_grant'));

-- 4. Grant Ultimate to every existing agency that doesn't already hold an
--    active subscription. Skips anyone with a current code-granted or Stripe
--    sub so we don't double-grant.
insert into subscriptions (user_id, plan_id, source, is_active, started_at)
select u.id, 'ultimate', 'auto_grant', true, now()
from users u
where u.role = 'agency'
  and not exists (
    select 1 from subscriptions s
    where s.user_id = u.id
      and s.is_active = true
      and (s.expires_at is null or s.expires_at > now())
  );
