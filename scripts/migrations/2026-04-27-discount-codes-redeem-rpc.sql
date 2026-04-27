-- scripts/migrations/2026-04-27-discount-codes-redeem-rpc.sql
--
-- Atomic redemption: locks the discount_codes row, re-validates, deactivates
-- any prior active subscription for the user, and inserts the new active row,
-- all inside a single transaction. Closes the race window between deactivate
-- and insert, and the TOCTOU on max_redemptions, that the JS implementation
-- of redeemForUser had.
--
-- Errors are raised with sqlstate P0001 (raise_exception). The library
-- translates the message verbatim to a 400 response.

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
begin
  -- Lock the discount_codes row for the duration of the transaction so
  -- concurrent redeems serialize on the cap check + insert. Inserts on
  -- subscriptions go through the after-insert trigger that bumps
  -- current_redemptions, so a second redeem waiting on this lock will see
  -- the post-bumped count once the first commits.
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

  update subscriptions
     set is_active = false,
         deactivated_at = v_now,
         updated_at = v_now
   where user_id = p_user_id
     and is_active = true;

  insert into subscriptions (
    user_id, plan_id, source, discount_code_id, is_active, started_at
  ) values (
    p_user_id, p_plan_id, 'discount_code', v_code.id, true, v_now
  ) returning id into v_subscription_id;

  return query select v_subscription_id, v_code.id;
end;
$$;
