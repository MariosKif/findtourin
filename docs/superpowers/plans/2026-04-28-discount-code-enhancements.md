# Discount-Code Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Two enhancements to the discount-codes system: per-customer redemption limits (fraud guard) and a "Got a code?" field at registration that bypasses payment and grants the matching plan immediately.

**Architecture:** Add `max_per_user` column to `discount_codes` and enforce it inside the existing `redeem_discount_code` Postgres function (atomic). Add an optional `discountCode` field to `RegisterForm`, validate + redeem after the agency profile is created so the new user lands on the dashboard with their plan already active.

**Tech Stack:** Supabase (Postgres + RPC), Astro 6 SSR + TypeScript, no test framework — verify with curl + manual smoke as in prior plans.

## Codebase facts (verified during pre-flight)

- `redeem_discount_code(p_raw_code, p_plan_id, p_user_id)` Postgres function (`scripts/migrations/2026-04-27-discount-codes-redeem-rpc.sql`) takes a row lock, re-validates, deactivates prior active sub, inserts new. P0001 errors carry user-facing messages.
- `discount_codes` has `max_redemptions` (global cap) but no per-user cap. The trigger on `subscriptions` insert bumps `discount_codes.current_redemptions` regardless of which user redeemed.
- `subscriptions.discount_code_id` (FK, on delete set null) is preserved across deactivations, so we can count past redemptions per (user_id, discount_code_id) even after admin toggles.
- Registration uses Supabase Auth via `src/components/auth/RegisterForm.astro` (client-side `<script>`, posts to `supabase.auth.signUp`) with a server-side profile-row insert. Two flows reach a profile: `/auth/register` (email+password) and `/auth/complete-profile` (OAuth callback). Both eventually create a `users` row and redirect to `/dashboard`.
- `getActivePlanForUser`, `validateForPlan`, etc. live in `src/lib/subscriptions.ts` and `src/lib/discount-codes.ts`.

## Decisions captured

| Question | Decision |
|---|---|
| Per-user limit semantics | Counts ALL redemptions of this code by this user, including deactivated ones. Caps repeat use of the same code by the same agency. |
| Per-user limit storage | New column `discount_codes.max_per_user int null`. Null = unlimited (matches today's behaviour). |
| Per-user limit enforcement | Inside the RPC, with the `for update` lock already in place. Throws `P0001 'You have already redeemed this code the maximum number of times.'` |
| Registration field | Optional, free text, normalised on the server. Field shows for `role='agency'` only (the toggle exists in the form). |
| Plan picked on registration | If the code's `applies_to_plans` has exactly one entry → use it. If empty → default to `'professional'` (the popular plan). If multiple → use the first. |
| Validation failure at registration | Registration **succeeds** even if the code is invalid; the user lands on dashboard with a flash query param `?code_failed=<reason>` so they see a banner. We don't reject the account. |
| Admin UI | `/admin/discount-codes/new` form gains a "Max per user" input. `/admin/discount-codes/[id]` PATCH allows updating it (immutable for code/plan still). |

---

### Task 1: Database migration — add `max_per_user`

**Files:**
- Create: `scripts/migrations/2026-04-28-discount-codes-max-per-user.sql`

- [ ] **Step 1: Write the migration**

```sql
-- scripts/migrations/2026-04-28-discount-codes-max-per-user.sql

alter table discount_codes
  add column if not exists max_per_user integer;

-- Sanity index for the per-user count query inside the RPC
create index if not exists subscriptions_user_code_idx
  on subscriptions (user_id, discount_code_id)
  where discount_code_id is not null;
```

- [ ] **Step 2: Apply via Supabase Management API**

The same workflow as the prior migrations. Run:

```bash
SUPABASE_PAT=<a fresh token from https://supabase.com/dashboard/account/tokens> node -e '
const fs = require("fs");
const sql = fs.readFileSync("scripts/migrations/2026-04-28-discount-codes-max-per-user.sql", "utf8");
fetch("https://api.supabase.com/v1/projects/fyhdsmeiystsehdsipar/database/query", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.SUPABASE_PAT}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
}).then(async r => { console.log(r.status, await r.text()); });
'
```

Expected: `201 []` for both statements. After running, **revoke the token**.

- [ ] **Step 3: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add scripts/migrations/2026-04-28-discount-codes-max-per-user.sql
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(db): add discount_codes.max_per_user + index for per-user count"
```

---

### Task 2: Update `redeem_discount_code` to enforce per-user cap

**Files:**
- Create: `scripts/migrations/2026-04-28-redeem-rpc-per-user-cap.sql`

- [ ] **Step 1: Write the new RPC body** (uses `create or replace`, so re-running is safe)

```sql
-- scripts/migrations/2026-04-28-redeem-rpc-per-user-cap.sql

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
```

- [ ] **Step 2: Apply via Management API** (same script as Task 1, just point at this file)

- [ ] **Step 3: Smoke test the new branch via Management API**

```bash
SUPABASE_PAT=<token> node -e '
const TOK = process.env.SUPABASE_PAT;
const url = "https://api.supabase.com/v1/projects/fyhdsmeiystsehdsipar/database/query";
const call = async (q) => {
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${TOK}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
  console.log(r.status, await r.text());
};
(async () => {
  // Find agency user id
  await call(`select id, email from users where role = '"'"'agency'"'"' limit 1;`);
  // (paste the id below as <agency-id>)
  await call(`insert into discount_codes (code, max_per_user, applies_to_plans) values ('"'"'PER-USER-TEST'"'"', 1, '"'"'{}'"'"') returning id;`);
  // (paste the code id below as <code-id>)
  // Redeem once — should succeed
  await call(`select * from redeem_discount_code('"'"'PER-USER-TEST'"'"', '"'"'professional'"'"', '"'"'<agency-id>'"'"');`);
  // Redeem again — should fail with P0001
  await call(`select * from redeem_discount_code('"'"'PER-USER-TEST'"'"', '"'"'professional'"'"', '"'"'<agency-id>'"'"');`);
  // Cleanup
  await call(`delete from subscriptions where discount_code_id = '"'"'<code-id>'"'"';`);
  await call(`delete from discount_codes where id = '"'"'<code-id>'"'"';`);
})();
'
```

Expected: first redeem returns 201 with subscription_id; second redeem returns 400 with `'P0001: You have already redeemed this code the maximum number of times.'`. Cleanup leaves zero rows.

- [ ] **Step 4: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add scripts/migrations/2026-04-28-redeem-rpc-per-user-cap.sql
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(db): redeem_discount_code enforces max_per_user cap"
```

---

### Task 3: Admin API — accept `max_per_user` on create + update

**Files:**
- Modify: `src/pages/api/admin/discount-codes/index.ts`
- Modify: `src/pages/api/admin/discount-codes/[id].ts`

- [ ] **Step 1: POST handler — accept new field**

In `src/pages/api/admin/discount-codes/index.ts`, find the body-parsing block in the POST handler. Add `max_per_user` parsing alongside `max_redemptions`. Replace the existing block with:

```typescript
  const code = String(body.code || '').trim().toUpperCase();
  const max_redemptions =
    body.max_redemptions === null || body.max_redemptions === undefined || body.max_redemptions === ''
      ? null
      : Number(body.max_redemptions);
  const max_per_user =
    body.max_per_user === null || body.max_per_user === undefined || body.max_per_user === ''
      ? null
      : Number(body.max_per_user);
  const applies_to_plans: string[] = Array.isArray(body.applies_to_plans) ? body.applies_to_plans : [];
  const description = body.description ? String(body.description) : null;
  const is_active = body.is_active !== false;

  if (!/^[A-Z0-9-]{3,32}$/.test(code))
    return json({ error: 'Code must be 3–32 chars [A-Z0-9-]' }, 400);
  if (max_redemptions !== null && (!Number.isInteger(max_redemptions) || max_redemptions < 1))
    return json({ error: 'max_redemptions must be null or positive integer' }, 400);
  if (max_per_user !== null && (!Number.isInteger(max_per_user) || max_per_user < 1))
    return json({ error: 'max_per_user must be null or positive integer' }, 400);
  if (applies_to_plans.some((p) => !VALID_PLAN_IDS.has(p)))
    return json({ error: 'applies_to_plans contains unknown plan id' }, 400);
```

Then update the insert to include the field:

```typescript
  const { data, error } = await supabase
    .from('discount_codes')
    .insert({
      code, description, max_redemptions, max_per_user,
      applies_to_plans, is_active, created_by: user.id,
    })
    .select().single();
```

- [ ] **Step 2: PATCH handler — accept new field**

In `src/pages/api/admin/discount-codes/[id].ts`, find the block that builds the `updates` object. Add a `max_per_user` branch alongside `max_redemptions`:

```typescript
  if (body.max_per_user !== undefined) {
    if (body.max_per_user === null || body.max_per_user === '') updates.max_per_user = null;
    else {
      const n = Number(body.max_per_user);
      if (!Number.isInteger(n) || n < 1) return json({ error: 'max_per_user must be null or positive integer' }, 400);
      updates.max_per_user = n;
    }
  }
```

- [ ] **Step 3: Type-check + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npx tsc --noEmit 2>&1 | grep "discount-codes" || echo "OK"
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/api/admin/discount-codes/index.ts "src/pages/api/admin/discount-codes/[id].ts"
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(admin/discount-codes): accept max_per_user on create + update"
```

---

### Task 4: Admin UI — show + edit `max_per_user`

**Files:**
- Modify: `src/pages/admin/discount-codes/new.astro`
- Modify: `src/pages/admin/discount-codes/[id].astro`
- Modify: `src/pages/admin/discount-codes/index.astro` (optional table column)

- [ ] **Step 1: New-code form — add the field**

In `src/pages/admin/discount-codes/new.astro`, immediately after the existing "Max redemptions" input block, insert:

```astro
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Max per user</label>
        <input name="max_per_user" type="number" min="1" class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Leave blank for unlimited per user" />
        <p class="mt-1 text-xs text-gray-500">Limits how many times a single agency can redeem this code (counts deactivated redemptions too).</p>
      </div>
```

Then in the script's body-construction block, add the field to the JSON body:

```typescript
    const body = {
      code: String(fd.get('code') || ''),
      max_redemptions: fd.get('max_redemptions') ? Number(fd.get('max_redemptions')) : null,
      max_per_user: fd.get('max_per_user') ? Number(fd.get('max_per_user')) : null,
      applies_to_plans: planChecks,
      description: String(fd.get('description') || '') || null,
      is_active: fd.get('is_active') === 'on',
    };
```

- [ ] **Step 2: Detail page — display value**

In `src/pages/admin/discount-codes/[id].astro`, find the header `<p>` line that shows the redemption count:

```astro
      <p class="text-sm text-gray-500 mt-1">Free access · {code.current_redemptions}/{code.max_redemptions ?? '∞'} used</p>
```

Replace with:

```astro
      <p class="text-sm text-gray-500 mt-1">Free access · {code.current_redemptions}/{code.max_redemptions ?? '∞'} used · {code.max_per_user ? `${code.max_per_user} per user` : 'unlimited per user'}</p>
```

- [ ] **Step 3: Astro check + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/admin/discount-codes/new.astro "src/pages/admin/discount-codes/[id].astro"
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(admin/discount-codes): edit and display max_per_user"
```

---

### Task 5: Validate API — return per-user state to clients

**Files:**
- Modify: `src/lib/discount-codes.ts`
- Modify: `src/pages/api/discount-codes/validate.ts`

- [ ] **Step 1: Update the library to surface per-user exhaustion**

In `src/lib/discount-codes.ts`, extend `validateForPlan` so the validate endpoint can preview per-user exhaustion before submit. The redeem RPC remains the source of truth — this is a UX hint.

Find:

```typescript
export type ValidationFailureReason =
  | 'not_found'
  | 'inactive'
  | 'exhausted'
  | 'plan_not_eligible';
```

Replace with:

```typescript
export type ValidationFailureReason =
  | 'not_found'
  | 'inactive'
  | 'exhausted'
  | 'plan_not_eligible'
  | 'per_user_exhausted';
```

Then update the `DiscountCode` interface to include the new column:

```typescript
export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  max_redemptions: number | null;
  current_redemptions: number;
  max_per_user: number | null;
  applies_to_plans: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

Add a new optional userId param to `validateForPlan`:

```typescript
export async function validateForPlan(
  rawCode: string,
  planId: string,
  userId?: string,
): Promise<ValidationResult | ValidationFailure> {
  const code = await findByCode(rawCode);
  if (!code) return { valid: false, reason: 'not_found', message: 'Code not found.' };
  if (!code.is_active) return { valid: false, reason: 'inactive', message: 'This code is currently disabled.' };
  if (code.max_redemptions !== null && code.current_redemptions >= code.max_redemptions) {
    return { valid: false, reason: 'exhausted', message: 'This code has reached its redemption limit.' };
  }
  if (code.applies_to_plans.length > 0 && !code.applies_to_plans.includes(planId)) {
    return { valid: false, reason: 'plan_not_eligible', message: 'This code does not apply to the selected plan.' };
  }
  if (userId && code.max_per_user !== null) {
    const { count } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('discount_code_id', code.id);
    if ((count ?? 0) >= code.max_per_user) {
      return { valid: false, reason: 'per_user_exhausted', message: 'You have already redeemed this code the maximum number of times.' };
    }
  }
  return { valid: true, code };
}
```

- [ ] **Step 2: Pass `user.id` to `validateForPlan` in the validate endpoint**

In `src/pages/api/discount-codes/validate.ts`, change the call to:

```typescript
  const result = await validateForPlan(code, planId, user.id);
```

- [ ] **Step 3: Type-check + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npx tsc --noEmit 2>&1 | grep -E "discount-codes" || echo "OK"
git -C /Users/marios/Desktop/Cursor/worldoftours add src/lib/discount-codes.ts src/pages/api/discount-codes/validate.ts
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(discount-codes): per-user exhaustion preview in validate"
```

---

### Task 6: Server-side register-with-code endpoint

**Files:**
- Create: `src/pages/api/auth/register-with-code.ts`

**Why a server endpoint:** Supabase `auth.signUp` from the browser doesn't insert a `users` profile row, doesn't accept role/company_name, and doesn't see a discount code. We already have a similar server-side flow in `src/pages/api/auth/register.ts` (or its equivalent — check current state first). This task adds an explicit "with-code" variant that wraps signUp + profile insert + redeem.

- [ ] **Step 1: Read the current `/api/auth/register.ts`** (use the Read tool) to see how user creation + profile insert works today. The endpoint we create will mirror that flow plus the redemption call.

- [ ] **Step 2: Write the endpoint**

```typescript
// src/pages/api/auth/register-with-code.ts
import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { findByCode, validateForPlan } from '../../../lib/discount-codes';
import { getPlan } from '../../../lib/pricing';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const DEFAULT_PLAN = 'professional';

function pickPlanForCode(applies: string[]): string {
  if (applies.length === 1) return applies[0];
  if (applies.length === 0) return DEFAULT_PLAN;
  return applies[0];
}

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const email = String(body.email || '').trim();
  const password = String(body.password || '');
  const name = String(body.name || '').trim();
  const role = body.role === 'agency' ? 'agency' : 'user';
  const company_name = role === 'agency' ? String(body.company_name || '').trim() || null : null;
  const phone = body.phone ? String(body.phone).trim() : null;
  const website = body.website ? String(body.website).trim() : null;
  const discountCode = String(body.discountCode || '').trim();

  if (!email || !password || !name) return json({ error: 'name, email, password required' }, 400);
  if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);

  // 1. Create the auth user (Supabase admin API)
  const { data: signUp, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (signUpError || !signUp?.user) {
    return json({ error: signUpError?.message || 'Failed to create account' }, 400);
  }
  const userId = signUp.user.id;

  // 2. Insert the profile row
  const { error: profileError } = await supabase.from('users').insert({
    id: userId, email, name, role,
    company_name, phone, website, is_verified: false,
  });
  if (profileError) {
    // Roll back the auth user so the address remains free for retry
    await supabase.auth.admin.deleteUser(userId).catch(() => {});
    return json({ error: profileError.message }, 500);
  }

  // 3. Optional code redemption (agency role only)
  let codeFailedReason: string | null = null;
  let activatedPlan: string | null = null;
  if (discountCode && role === 'agency') {
    const code = await findByCode(discountCode);
    if (!code) {
      codeFailedReason = 'not_found';
    } else {
      const planId = pickPlanForCode(code.applies_to_plans);
      if (!getPlan(planId)) {
        codeFailedReason = 'plan_not_eligible';
      } else {
        const validation = await validateForPlan(discountCode, planId, userId);
        if (!validation.valid) {
          codeFailedReason = validation.reason;
        } else {
          const { error: rpcError } = await supabase.rpc('redeem_discount_code', {
            p_raw_code: discountCode,
            p_plan_id: planId,
            p_user_id: userId,
          });
          if (rpcError) {
            codeFailedReason = 'rpc_failed';
            console.error('register-with-code redeem failed', rpcError);
          } else {
            activatedPlan = planId;
          }
        }
      }
    }
  }

  // 4. Issue a session so the client lands logged-in.
  // Supabase admin API doesn't return a session; sign in with password to get one.
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError || !session?.session) {
    return json({ error: 'Account created but session issuance failed', userId }, 500);
  }

  return json({
    success: true,
    userId,
    activatedPlan,
    codeFailedReason,
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
  }, 201);
};
```

- [ ] **Step 3: Type-check + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npx tsc --noEmit 2>&1 | grep "register-with-code.ts" || echo "OK"
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/api/auth/register-with-code.ts
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(auth): register-with-code endpoint that auto-activates plan"
```

---

### Task 7: Update RegisterForm to use the new endpoint when a code is provided

**Files:**
- Modify: `src/components/auth/RegisterForm.astro`

- [ ] **Step 1: Read the current form** with the Read tool to capture the existing structure. Add a "Have a discount code?" input inside the existing `#agency-fields` block (which only shows when `role='agency'`). Insert immediately before the closing `</div>` of the green commission box, OR after the existing agency fields — match the form's spacing class (`space-y-5`).

```astro
    <Input
      label="Discount code (optional)"
      name="discountCode"
      type="text"
      placeholder="WELCOME-FREE"
      autocomplete="off"
    />
    <p class="text-xs text-gray-500 -mt-3">If you have a code, we'll activate the matching plan immediately. No card needed.</p>
```

- [ ] **Step 2: Update the form's submit script**

The current script calls `supabase.auth.signUp` and then a separate profile-creation endpoint. Replace the agency-with-code branch so it posts to `/api/auth/register-with-code` instead. Keep the existing path for non-agency users (or for agencies with no code). Pseudocode shape — adapt to the actual `<script>` block:

```typescript
const role = (form.querySelector('select[name="role"]') as HTMLSelectElement).value;
const discountCode = (form.querySelector('input[name="discountCode"]') as HTMLInputElement | null)?.value.trim() || '';

if (role === 'agency' && discountCode) {
  const res = await fetch('/api/auth/register-with-code', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, password, name, role,
      company_name: companyName, phone, website,
      discountCode,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    showError(data.error || 'Registration failed');
    return;
  }
  // Set Supabase cookies so middleware sees us
  document.cookie = `sb-access-token=${data.accessToken}; path=/; max-age=3600; SameSite=Lax`;
  document.cookie = `sb-refresh-token=${data.refreshToken}; path=/; max-age=2592000; SameSite=Lax`;
  const dest = data.codeFailedReason
    ? `/dashboard?code_failed=${encodeURIComponent(data.codeFailedReason)}`
    : data.activatedPlan
      ? `/dashboard?activated=${encodeURIComponent(data.activatedPlan)}`
      : '/dashboard';
  window.location.href = dest;
  return;
}
// ...existing path: supabase.auth.signUp + post profile to /api/auth/register
```

If the existing form already has a single submit handler, branch inside it; don't duplicate the full handler.

- [ ] **Step 3: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/components/auth/RegisterForm.astro
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(auth): RegisterForm sends agency+code path to register-with-code"
```

---

### Task 8: Dashboard banner for `?code_failed=…` and `?activated=…`

**Files:**
- Modify: `src/pages/dashboard/index.astro`

- [ ] **Step 1: Read the URL search params in the frontmatter**

Add at the top of the existing frontmatter (after the user check):

```typescript
const url = new URL(Astro.request.url);
const activated = url.searchParams.get('activated');
const codeFailed = url.searchParams.get('code_failed');

const codeFailMessages: Record<string, string> = {
  not_found: 'The code you entered was not found.',
  inactive: 'That code is currently disabled.',
  exhausted: 'That code has reached its redemption limit.',
  plan_not_eligible: 'That code does not apply to your selected plan.',
  per_user_exhausted: 'You have already redeemed that code the maximum number of times.',
  rpc_failed: 'We could not activate the code. Contact support if this keeps happening.',
};
const codeFailedMessage = codeFailed ? codeFailMessages[codeFailed] || 'The discount code could not be applied.' : null;
```

- [ ] **Step 2: Render the banner above the main dashboard content**

Insert just inside `<DashboardLayout>`:

```astro
  {activated && (
    <div class="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">
      Your <strong>{activated}</strong> plan is now active. Welcome aboard!
    </div>
  )}
  {codeFailedMessage && (
    <div class="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
      {codeFailedMessage} Your account is set up — you can redeem a different code from <a href="/dashboard/pricing" class="underline">the pricing page</a>.
    </div>
  )}
```

- [ ] **Step 3: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/dashboard/index.astro
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(dashboard): banner for activated/code_failed query params"
```

---

### Task 9: Final smoke + push

- [ ] **Step 1: Local end-to-end**

Start dev server, walk through:
1. Admin → `/admin/discount-codes/new` → create `WELCOME-PRO`, max_per_user=1, applies_to_plans=[professional].
2. Log out. Visit `/auth/register`, role=agency, fill the form, paste `WELCOME-PRO` into the new field, submit.
3. Land on `/dashboard?activated=professional` with the green banner. Plan Usage card shows Professional.
4. Log out, sign back in. Visit `/dashboard/pricing`, enter `WELCOME-PRO` → "Apply" → feedback says "You have already redeemed this code the maximum number of times." (per-user cap working).
5. As admin, on `/admin/discount-codes/<id>`, the "1 per user" string is in the header.

- [ ] **Step 2: Production build**

```bash
npm run build 2>&1 | tail -3
```

Expected: `[build] Complete!`.

- [ ] **Step 3: Push**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours push origin main
```

Watch the Vercel deploy. The two SQL migrations need to be applied separately (Task 1 and Task 2 instructions) — they don't ride the deploy.

---

## Out of scope (intentionally — flag if you disagree)

- Promoting a USER role to AGENCY mid-registration. The form already lets the user choose at signup.
- Changing the way registered users without a code are billed. They still hit the plan cap at starter (15 listings) and can upgrade later via `/dashboard/pricing`.
- Cleanup of stale `subscriptions` rows whose `discount_code_id` was nulled by a code DELETE — the per-user count would still include those rows because their `discount_code_id` becomes null. Treat as a future hardening if it becomes an issue (today the FK is `on delete set null`).
- Email-verifying the new account (`email_confirm: true` skips Supabase's confirmation email). If you want a confirmation step, switch to `auth.signUp` instead of admin-create + manual session issuance.
