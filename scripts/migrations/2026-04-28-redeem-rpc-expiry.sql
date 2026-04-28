-- scripts/migrations/2026-04-28-redeem-rpc-expiry.sql

create or replace function redeem_discount_code(
  p_raw_code text,
  p_plan_id text,
  p_user_id uuid
)
returns table (subscription_id uuid, code_id uuid)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_code discount_codes%rowtype;
  v_now timestamptz := now();
  v_subscription_id uuid;
  v_user_redemptions int;
  v_expires_at timestamptz;
begin
  select *
    into v_code
    from discount_codes
   where code = upper(btrim(p_raw_code))
   for update;

  if not found then
    raise exception 'Code not found.' using errcode = 'P0001';
  end if;
  if not v_code.is_active then
    raise exception 'This code is currently disabled.' using errcode = 'P0001';
  end if;
  if v_code.max_redemptions is not null
     and v_code.current_redemptions >= v_code.max_redemptions then
    raise exception 'This code has reached its redemption limit.' using errcode = 'P0001';
  end if;
  if cardinality(v_code.applies_to_plans) > 0
     and not (p_plan_id = any(v_code.applies_to_plans)) then
    raise exception 'This code does not apply to the selected plan.' using errcode = 'P0001';
  end if;

  -- Per-user cap (counts all past redemptions, including deactivated subs).
  if v_code.max_per_user is not null then
    select count(*) into v_user_redemptions
      from subscriptions
     where user_id = p_user_id
       and discount_code_id = v_code.id;
    if v_user_redemptions >= v_code.max_per_user then
      raise exception 'You have already redeemed this code the maximum number of times.' using errcode = 'P0001';
    end if;
  end if;

  if v_code.grants_duration_days is not null then
    v_expires_at := v_now + (v_code.grants_duration_days || ' days')::interval;
  end if;

  update subscriptions
     set is_active = false,
         deactivated_at = v_now,
         updated_at = v_now
   where user_id = p_user_id
     and is_active = true;

  insert into subscriptions (
    user_id, plan_id, source, discount_code_id, is_active, started_at, expires_at
  ) values (
    p_user_id, p_plan_id, 'discount_code', v_code.id, true, v_now, v_expires_at
  ) returning id into v_subscription_id;

  return query select v_subscription_id, v_code.id;
end;
$$;
