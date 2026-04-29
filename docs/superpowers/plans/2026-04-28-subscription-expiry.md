# Subscription Expiry & Auto-Deactivation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Time-bound subscriptions so a discount-code grant can expire after N days, and a Vercel Cron job deactivates expired subs daily without admin intervention. Stays compatible with admin grants that have no expiry (set `expires_at` null).

**Architecture:** Add `expires_at` to `subscriptions` (nullable). Add `grants_duration_days` to `discount_codes` (nullable). The redeem RPC sets `expires_at = now() + grants_duration_days * '1 day'` on insert when the code defines a duration. A Vercel Cron hits `/api/cron/expire-subscriptions` daily; the endpoint updates rows where `is_active=true AND expires_at < now()` to `is_active=false, deactivated_at=now()`. Defensive: `getActivePlanForUser` also filters out expired rows in case the cron is delayed.

**Tech Stack:** Supabase (Postgres + RPC), Astro 6 SSR, Vercel Cron, no test framework.

## Codebase facts (verified during pre-flight)

- `subscriptions` columns today: `id, user_id, plan_id, source, discount_code_id, is_active, started_at, deactivated_at, created_at, updated_at`. No expiry column yet.
- The `redeem_discount_code` RPC handles all writes for discount-code subscriptions.
- `getActivePlanForUser` (`src/lib/subscriptions.ts`) reads where `is_active=true` and falls back to starter when none match. We extend this with an `expires_at` check.
- Vercel Cron is configured via `vercel.json`. The repo currently has none — we'll add one.
- Astro adapter is `@astrojs/vercel`; SSR endpoints work via `export const POST: APIRoute`.
- Stripe checkout still uses `mode: 'payment'` (one-time). True Stripe-driven recurring billing is out of scope.

## Decisions captured

| Question | Decision |
|---|---|
| Default expiry | Null (no expiry). Existing admin-toggled grants stay forever. |
| Per-code duration | New column `discount_codes.grants_duration_days int null`. Null = no expiry. Positive int = days from redemption. |
| Cron cadence | Daily at 03:00 UTC. Late deactivation (up to 24h) is acceptable. |
| Cron auth | Vercel Cron sets the `Authorization: Bearer <CRON_SECRET>` header (project env var). The endpoint validates against `CRON_SECRET`. |
| Expired display | Sub stays in DB with `is_active=false, deactivated_at=now()`. Admin sees it as "Inactive" alongside other deactivated rows. |
| Reactivation | Admin can flip `is_active=true` via existing PATCH endpoint. We do NOT auto-extend `expires_at` — the admin must clear it or set a new value. Add `expires_at` to the PATCH allowlist. |
| Defensive filter | `getActivePlanForUser` also requires `(expires_at IS NULL OR expires_at > now())` so that a sub the cron hasn't yet processed still falls through to the starter default. |

---

### Task 1: DB migration — `subscriptions.expires_at` + `discount_codes.grants_duration_days`

**Files:**
- Create: `scripts/migrations/2026-04-28-subscription-expiry.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply via Supabase Management API**

Use a fresh PAT, run the same one-liner pattern as the prior plan's Task 1 Step 2, pointing at this file.

- [ ] **Step 3: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add scripts/migrations/2026-04-28-subscription-expiry.sql
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(db): subscriptions.expires_at + discount_codes.grants_duration_days"
```

---

### Task 2: Update redeem RPC to set `expires_at` from `grants_duration_days`

**Files:**
- Create: `scripts/migrations/2026-04-28-redeem-rpc-expiry.sql`

- [ ] **Step 1: Write the new RPC body**

This builds on the per-user-cap version from the discount-code-enhancements plan. If both plans run, this is the LATER migration. If you're running this plan independently, replace the `v_user_redemptions` block with the original RPC body's checks.

```sql
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
```

- [ ] **Step 2: Apply + commit**

Apply via Management API. Commit:

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add scripts/migrations/2026-04-28-redeem-rpc-expiry.sql
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(db): redeem RPC sets expires_at from grants_duration_days"
```

---

### Task 3: Defensive filter in `getActivePlanForUser`

**Files:**
- Modify: `src/lib/subscriptions.ts`

- [ ] **Step 1: Update the query**

In `src/lib/subscriptions.ts`, find:

```typescript
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, plan_id, source')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
```

Replace with:

```typescript
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, plan_id, source, expires_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .limit(1)
    .maybeSingle();
```

This lands the defensive filter even if the cron hasn't fired yet. The `expires_at` is selected so it's part of the `ActivePlan` shape if you ever want to surface it in the dashboard.

- [ ] **Step 2: Type-check + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npx tsc --noEmit 2>&1 | grep "subscriptions.ts" || echo "OK"
git -C /Users/marios/Desktop/Cursor/worldoftours add src/lib/subscriptions.ts
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(subscriptions): exclude expired rows from active-plan lookup"
```

---

### Task 4: Cron endpoint that deactivates expired subscriptions

**Files:**
- Create: `src/pages/api/cron/expire-subscriptions.ts`

- [ ] **Step 1: Write the endpoint**

```typescript
// src/pages/api/cron/expire-subscriptions.ts
// Vercel Cron POSTs here daily with Authorization: Bearer ${CRON_SECRET}.
// Deactivates subscriptions where expires_at has passed and is_active is true.
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('authorization') || '';
  const expected = `Bearer ${import.meta.env.CRON_SECRET || process.env.CRON_SECRET || ''}`;
  if (!process.env.CRON_SECRET && !import.meta.env.CRON_SECRET) {
    return json({ error: 'CRON_SECRET not configured' }, 500);
  }
  if (authHeader !== expected) {
    return json({ error: 'Forbidden' }, 403);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ is_active: false, deactivated_at: now, updated_at: now })
    .eq('is_active', true)
    .lt('expires_at', now)
    .select('id, user_id, plan_id, expires_at');

  if (error) {
    console.error('expire-subscriptions failed', error);
    return json({ error: error.message }, 500);
  }

  return json({ deactivated: data?.length ?? 0, ids: (data || []).map(r => r.id) });
};

// Also accept GET for manual smoke testing — returns the same shape but only counts.
export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('authorization') || '';
  const expected = `Bearer ${import.meta.env.CRON_SECRET || process.env.CRON_SECRET || ''}`;
  if (authHeader !== expected) return json({ error: 'Forbidden' }, 403);
  const { count } = await supabase
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .lt('expires_at', new Date().toISOString());
  return json({ would_deactivate: count ?? 0 });
};
```

- [ ] **Step 2: Type-check + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npx tsc --noEmit 2>&1 | grep "expire-subscriptions.ts" || echo "OK"
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/api/cron/expire-subscriptions.ts
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(cron): expire-subscriptions endpoint"
```

---

### Task 5: Wire Vercel Cron via `vercel.json`

**Files:**
- Create: `vercel.json` (the repo currently has none)

- [ ] **Step 1: Write the config**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/expire-subscriptions",
      "schedule": "0 3 * * *"
    }
  ]
}
```

`0 3 * * *` is daily at 03:00 UTC. Vercel sends a POST to the path with `Authorization: Bearer <CRON_SECRET>`. The secret is configured per-project via Vercel's `CRON_SECRET` environment variable. **You must set it in the Vercel dashboard** before the deploy that ships this — without the secret, Vercel will still call the endpoint but the endpoint will 403, which is the correct fail-closed behaviour.

- [ ] **Step 2: Set CRON_SECRET in Vercel**

In your terminal (not in chat — secret), with a Vercel access token from https://vercel.com/account/tokens:

```sh
! npx vercel env add CRON_SECRET production
# Paste a long random value (e.g. `openssl rand -hex 32`)
! npx vercel env pull .env.local
```

Or set it from the Vercel dashboard: Project → Settings → Environment Variables → Add `CRON_SECRET` (Production). Use `openssl rand -hex 32` to generate.

- [ ] **Step 3: Commit + push**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add vercel.json
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(cron): vercel.json with daily expire-subscriptions schedule"
```

Push happens at the end of the plan with the rest.

---

### Task 6: Admin UI — show expiry, allow editing it on subscriptions

**Files:**
- Modify: `src/pages/admin/subscriptions.astro`
- Modify: `src/pages/api/admin/subscriptions/[id].ts`

- [ ] **Step 1: API — accept `expires_at` in PATCH**

In `src/pages/api/admin/subscriptions/[id].ts`, find the PATCH handler. Add an `expires_at` branch alongside `is_active`:

```typescript
  if (typeof body.is_active !== 'boolean' && body.expires_at === undefined) {
    return json({ error: 'is_active boolean or expires_at required' }, 400);
  }

  const now = new Date().toISOString();
  const updates: Record<string, any> = { updated_at: now };

  if (typeof body.is_active === 'boolean') {
    updates.is_active = body.is_active;
    updates.deactivated_at = body.is_active ? null : now;
  }
  if (body.expires_at !== undefined) {
    if (body.expires_at === null || body.expires_at === '') {
      updates.expires_at = null;
    } else {
      const t = Date.parse(String(body.expires_at));
      if (Number.isNaN(t)) return json({ error: 'expires_at must be ISO timestamp or null' }, 400);
      updates.expires_at = new Date(t).toISOString();
    }
  }
```

(Keep the existing 23505 unique-violation handling on insert/update.)

- [ ] **Step 2: Admin page — show `expires_at` column + simple inline editor**

In `src/pages/admin/subscriptions.astro`, add an "Expires" column to the table. Pull `expires_at` in the SELECT:

```typescript
const { data: subs } = await supabase
  .from('subscriptions')
  .select('id, user_id, plan_id, source, discount_code_id, is_active, started_at, deactivated_at, expires_at')
  .order('started_at', { ascending: false });
```

Add the column header after "Started":

```astro
            <th class="text-left px-4 py-3 font-medium text-gray-600">Expires</th>
```

Add the cell inside the row map (after the Started cell):

```astro
                <td class="px-4 py-3 text-gray-500 text-xs">
                  {s.expires_at
                    ? new Date(s.expires_at).toLocaleDateString()
                    : <span class="text-gray-400">never</span>}
                </td>
```

Update the empty-state row's `colspan` from `7` to `8`.

- [ ] **Step 3: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/admin/subscriptions.astro "src/pages/api/admin/subscriptions/[id].ts"
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(admin/subscriptions): show + patch expires_at"
```

---

### Task 7: Discount-code admin — `grants_duration_days`

**Files:**
- Modify: `src/pages/api/admin/discount-codes/index.ts` (POST)
- Modify: `src/pages/api/admin/discount-codes/[id].ts` (PATCH)
- Modify: `src/pages/admin/discount-codes/new.astro`

- [ ] **Step 1: Accept the field on POST**

In `src/pages/api/admin/discount-codes/index.ts`, in the POST handler, add the parsing alongside `max_redemptions`:

```typescript
  const grants_duration_days =
    body.grants_duration_days === null || body.grants_duration_days === undefined || body.grants_duration_days === ''
      ? null
      : Number(body.grants_duration_days);

  if (grants_duration_days !== null && (!Number.isInteger(grants_duration_days) || grants_duration_days < 1))
    return json({ error: 'grants_duration_days must be null or positive integer' }, 400);
```

Add to the insert payload: `grants_duration_days,`.

- [ ] **Step 2: Accept the field on PATCH**

In `src/pages/api/admin/discount-codes/[id].ts`, add to the updates block:

```typescript
  if (body.grants_duration_days !== undefined) {
    if (body.grants_duration_days === null || body.grants_duration_days === '') updates.grants_duration_days = null;
    else {
      const n = Number(body.grants_duration_days);
      if (!Number.isInteger(n) || n < 1) return json({ error: 'grants_duration_days must be null or positive integer' }, 400);
      updates.grants_duration_days = n;
    }
  }
```

- [ ] **Step 3: Add field to new-code form**

In `src/pages/admin/discount-codes/new.astro`, after the Max-redemptions block, insert:

```astro
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Grants duration (days)</label>
        <input name="grants_duration_days" type="number" min="1" class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Leave blank for no expiry" />
        <p class="mt-1 text-xs text-gray-500">If set, redemptions expire this many days after activation. The daily cron deactivates expired subscriptions automatically.</p>
      </div>
```

Add to the body-construction block:

```typescript
      grants_duration_days: fd.get('grants_duration_days') ? Number(fd.get('grants_duration_days')) : null,
```

- [ ] **Step 4: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/api/admin/discount-codes/index.ts "src/pages/api/admin/discount-codes/[id].ts" src/pages/admin/discount-codes/new.astro
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(admin/discount-codes): grants_duration_days for time-limited codes"
```

---

### Task 8: Final smoke + push

- [ ] **Step 1: Local cron-endpoint smoke**

With dev server running, test the cron endpoint manually:

```bash
# Set CRON_SECRET locally (optional — can also export in shell)
echo 'CRON_SECRET=local-test-secret' >> .env.local
# Restart dev so it picks up the env var. Then:
curl -sS -X GET -H "Authorization: Bearer local-test-secret" http://localhost:4321/api/cron/expire-subscriptions
# Expected: { "would_deactivate": <count> }
```

Add `.env.local` to `.gitignore` if not already (it almost certainly is).

- [ ] **Step 2: End-to-end with a 1-day code**

Via the admin UI, create a code `EXPIRES-FAST` with `grants_duration_days=1`. Redeem it as agency. Verify in `/admin/subscriptions` the new row has `Expires` shown as tomorrow's date. Manually trigger the cron with a near-future `expires_at` (set the row's `expires_at` to `now() - 1 minute` via Supabase Studio, then POST to the endpoint with the secret). Verify the row deactivates.

- [ ] **Step 3: Production build + push**

```bash
npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours push origin main
```

After deploy: confirm `CRON_SECRET` is set in Vercel (Production env). Vercel's first cron fire happens at 03:00 UTC.

---

## Out of scope (intentionally — flag if you disagree)

- Stripe-mode subscriptions with auto-renewal. That's a larger architectural shift (switch checkout to `mode: 'subscription'`, wire `customer.subscription.*` webhook events). This plan only covers fixed-duration discount-code grants and admin-driven expiry editing.
- Renewal reminders / email notifications before expiry.
- Self-service plan extension by the agency. Today the only path to extend is admin → flip `expires_at` via `/admin/subscriptions`, or a fresh discount-code redemption that creates a new active row.
- Refund of any unused time when an admin downgrades. Not relevant for free discount-code grants; will matter only when Stripe-mode subs ship.
- A `subscriptions.expires_at IS NULL` is treated as "never expires" — there's no separate "trial" / "perpetual" distinction. Add one only if business rules demand it.
