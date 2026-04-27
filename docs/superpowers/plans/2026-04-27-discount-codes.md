# Discount Codes (Free Access) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Admin-managed codes that grant agency users free access to a chosen plan, **bypassing Stripe entirely**. Admin can deactivate granted access at any time.

**Architecture:**
- Two new Supabase tables: `discount_codes` (admin-managed) and `subscriptions` (per-agency plan grants).
- Library `src/lib/discount-codes.ts` owns validation + redemption helpers.
- Customer enters code on `/dashboard/pricing` → `/api/discount-codes/validate` previews eligibility → eligible plan card switches CTA to "Activate Free" which posts to `/api/discount-codes/redeem` → server creates a `subscriptions` row with `source='discount_code'` and redirects to dashboard.
- Admin CRUD lives under `/admin/discount-codes`. Admin can also toggle any subscription's `is_active` flag at `/admin/subscriptions`.
- **Stripe checkout (`src/pages/api/stripe/checkout.ts`) and webhook are NOT touched.** They remain the path for paid plans (when partial-discount codes ship later).

**Tech Stack:** Astro 6 SSR + Supabase (service role) + TypeScript. No test framework — verify each task with `curl` + manual smoke.

## Codebase facts (verified during pre-flight)

- API auth: `await getAuthenticatedUser(context)` from `src/lib/auth-helpers.ts`. Middleware (`src/middleware.ts:5-7`) short-circuits `/api/*`, so `locals.user` is **not set** in API routes.
- Admin pages use `DashboardLayout from '../../layouts/DashboardLayout.astro'` (NOT a separate AdminLayout). Astro frontmatter under `/admin/*` and `/dashboard/*` does get `Astro.locals.user` from middleware.
- Existing admin pages live at flat paths: `src/pages/admin/listings.astro`, `users.astro`, etc. New nested folders (`/admin/discount-codes/...`) are fine; the middleware already gates `/admin`.
- Sidebar lives at `src/components/dashboard/Sidebar.astro:24-34` (`adminLinks` array).
- `User` type (`src/types/index.ts`) has no `current_plan` field — plan grants are tracked entirely in the new `subscriptions` table.
- Pricing page at `src/pages/dashboard/pricing.astro` already has: `data-plan-id` on each card, `.billing-period-input` hidden field, `.price-monthly .text-4xl` price element, billing toggle, and a `<form method="POST" action="/api/stripe/checkout">` per card. We only ADD code-input UI and a script that swaps the form action when a valid code is applied — never touch the existing Stripe form fields.

## Decisions captured

| Question | Decision |
|---|---|
| What's discounted | Agency subscription plan access (`starter`, `professional`, `enterprise`, `ultimate`) |
| Type | 100%-bypass codes only (free access). Stripe partial-discount path is out of scope. |
| Limits | Multi-use up to N total redemptions; `null` = unlimited |
| Time bounds on access | None. Admin toggles `subscriptions.is_active` to revoke. |
| Plan restrictions | Per-code `applies_to_plans: text[]`. Empty array = any plan. |
| Who creates codes | Admin only |
| One-active-sub-per-agency | Yes. Redeeming a new code deactivates the previous active row for that user. |
| Code immutability | `code` itself is immutable (preserves redemption history). PATCH allowlist: `is_active`, `description`, `max_redemptions`, `applies_to_plans`. |

---

### Task 1: Create database tables

**Files:**
- Create: `scripts/migrations/2026-04-27-discount-codes.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
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
```

- [ ] **Step 2: Apply the migration**

Open Supabase Studio → SQL editor → paste → Run. Verify both tables in Table Editor.

- [ ] **Step 3: Commit**

```bash
git add scripts/migrations/2026-04-27-discount-codes.sql
git commit -m "feat(db): add discount_codes and subscriptions tables"
```

---

### Task 2: Discount-codes library

**Files:**
- Create: `src/lib/discount-codes.ts`

- [ ] **Step 1: Write the helper module**

```typescript
// src/lib/discount-codes.ts
// Server-side helpers for discount code validation and redemption.
// The service-role Supabase client bypasses RLS — never call these from the browser.
import { supabase } from './supabase';

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  max_redemptions: number | null;
  current_redemptions: number;
  applies_to_plans: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ValidationFailureReason =
  | 'not_found'
  | 'inactive'
  | 'exhausted'
  | 'plan_not_eligible';

export interface ValidationResult {
  valid: true;
  code: DiscountCode;
}

export interface ValidationFailure {
  valid: false;
  reason: ValidationFailureReason;
  message: string;
}

export async function findByCode(rawCode: string): Promise<DiscountCode | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  const { data } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code)
    .limit(1)
    .maybeSingle();
  return (data as DiscountCode) || null;
}

export async function validateForPlan(
  rawCode: string,
  planId: string,
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
  return { valid: true, code };
}

/**
 * Atomically redeem a code: deactivate any prior active subscription for this user,
 * then insert a new active subscription (source='discount_code').
 * The DB trigger bumps discount_codes.current_redemptions.
 * Throws if validation fails (re-checked here to prevent races).
 */
export async function redeemForUser(args: {
  rawCode: string;
  planId: string;
  userId: string;
}): Promise<{ subscriptionId: string; code: DiscountCode }> {
  const validation = await validateForPlan(args.rawCode, args.planId);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  const now = new Date().toISOString();

  await supabase
    .from('subscriptions')
    .update({ is_active: false, deactivated_at: now, updated_at: now })
    .eq('user_id', args.userId)
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: args.userId,
      plan_id: args.planId,
      source: 'discount_code',
      discount_code_id: validation.code.id,
      is_active: true,
      started_at: now,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(error?.message || 'Failed to create subscription');
  }
  return { subscriptionId: data.id, code: validation.code };
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "discount-codes.ts" || echo "OK"
```
Expected: `OK` (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/lib/discount-codes.ts
git commit -m "feat: add discount-codes library with validate + redeem helpers"
```

---

### Task 3: Validate API endpoint (customer-facing JSON)

**Files:**
- Create: `src/pages/api/discount-codes/validate.ts`

- [ ] **Step 1: Write the endpoint**

```typescript
// src/pages/api/discount-codes/validate.ts
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { getPlan } from '../../../lib/pricing';
import { validateForPlan } from '../../../lib/discount-codes';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { code, planId } = body || {};
  if (!code || !planId) return json({ error: 'code and planId required' }, 400);
  if (!getPlan(planId)) return json({ error: 'Unknown plan' }, 400);

  const result = await validateForPlan(code, planId);
  return json(result);
};
```

- [ ] **Step 2: Smoke test (DevTools console while logged in)**

```js
fetch('/api/discount-codes/validate', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'NONEXISTENT', planId: 'professional' }),
}).then(r => r.json()).then(console.log);
```
Expected: `{ valid: false, reason: 'not_found', message: 'Code not found.' }`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/discount-codes/validate.ts
git commit -m "feat: add /api/discount-codes/validate endpoint"
```

---

### Task 4: Redeem API endpoint

**Files:**
- Create: `src/pages/api/discount-codes/redeem.ts`

- [ ] **Step 1: Write the endpoint**

```typescript
// src/pages/api/discount-codes/redeem.ts
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { getPlan } from '../../../lib/pricing';
import { redeemForUser } from '../../../lib/discount-codes';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  if (user.role !== 'agency' && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  const contentType = context.request.headers.get('content-type') || '';
  let code = '', planId = '';
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const fd = await context.request.formData();
    code = String(fd.get('discountCode') || fd.get('code') || '');
    planId = String(fd.get('planId') || '');
  } else {
    const body = await context.request.json().catch(() => ({}));
    code = String(body.code || body.discountCode || '');
    planId = String(body.planId || '');
  }

  if (!code || !planId) return json({ error: 'code and planId required' }, 400);
  if (!getPlan(planId)) return json({ error: 'Unknown plan' }, 400);

  try {
    const { subscriptionId } = await redeemForUser({ rawCode: code, planId, userId: user.id });
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      return context.redirect(`/dashboard?activated=${planId}`);
    }
    return json({ success: true, subscriptionId, planId });
  } catch (err: any) {
    return json({ error: err?.message || 'Failed to redeem code' }, 400);
  }
};
```

- [ ] **Step 2: Smoke (after Task 5 creates a TEST100 code; can defer until then)**

```js
fetch('/api/discount-codes/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'TEST100', planId: 'starter' }) }).then(r => r.json()).then(console.log);
```
Expected: `{ success: true, subscriptionId: '...', planId: 'starter' }`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/discount-codes/redeem.ts
git commit -m "feat: add /api/discount-codes/redeem endpoint"
```

---

### Task 5: Admin API — list + create discount codes

**Files:**
- Create: `src/pages/api/admin/discount-codes/index.ts`

- [ ] **Step 1: Write the endpoint**

```typescript
// src/pages/api/admin/discount-codes/index.ts
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const VALID_PLAN_IDS = new Set(['starter', 'professional', 'enterprise', 'ultimate']);

export const GET: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { data, error } = await supabase
    .from('discount_codes').select('*')
    .order('created_at', { ascending: false });
  if (error) return json({ error: error.message }, 500);
  return json(data);
};

export const POST: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const code = String(body.code || '').trim().toUpperCase();
  const max_redemptions =
    body.max_redemptions === null || body.max_redemptions === undefined || body.max_redemptions === ''
      ? null
      : Number(body.max_redemptions);
  const applies_to_plans: string[] = Array.isArray(body.applies_to_plans) ? body.applies_to_plans : [];
  const description = body.description ? String(body.description) : null;
  const is_active = body.is_active !== false;

  if (!/^[A-Z0-9-]{3,32}$/.test(code))
    return json({ error: 'Code must be 3–32 chars [A-Z0-9-]' }, 400);
  if (max_redemptions !== null && (!Number.isInteger(max_redemptions) || max_redemptions < 1))
    return json({ error: 'max_redemptions must be null or positive integer' }, 400);
  if (applies_to_plans.some((p) => !VALID_PLAN_IDS.has(p)))
    return json({ error: 'applies_to_plans contains unknown plan id' }, 400);

  const { data, error } = await supabase
    .from('discount_codes')
    .insert({ code, description, max_redemptions, applies_to_plans, is_active, created_by: user.id })
    .select().single();
  if (error) {
    if ((error as any).code === '23505') return json({ error: 'Code already exists' }, 409);
    return json({ error: error.message }, 500);
  }
  return json(data, 201);
};
```

- [ ] **Step 2: Smoke (admin only)**

```js
fetch('/api/admin/discount-codes', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'TEST100', max_redemptions: 5, applies_to_plans: [] }) })
  .then(r => r.json()).then(console.log);
```
Expected: row JSON with `id` and `current_redemptions: 0`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/discount-codes/index.ts
git commit -m "feat: admin API GET/POST /api/admin/discount-codes"
```

---

### Task 6: Admin API — single code (GET / PATCH / DELETE)

**Files:**
- Create: `src/pages/api/admin/discount-codes/[id].ts`

- [ ] **Step 1: Write the endpoint**

```typescript
// src/pages/api/admin/discount-codes/[id].ts
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
const VALID_PLAN_IDS = new Set(['starter', 'professional', 'enterprise', 'ultimate']);

export const GET: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { data: code } = await supabase
    .from('discount_codes').select('*').eq('id', context.params.id).maybeSingle();
  if (!code) return json({ error: 'Not found' }, 404);
  const { data: redemptions } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_id, is_active, started_at, deactivated_at')
    .eq('discount_code_id', context.params.id)
    .order('started_at', { ascending: false });
  return json({ code, redemptions: redemptions || [] });
};

export const PATCH: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.is_active !== undefined) updates.is_active = !!body.is_active;
  if (body.description !== undefined) updates.description = body.description ? String(body.description) : null;
  if (body.max_redemptions !== undefined) {
    if (body.max_redemptions === null || body.max_redemptions === '') updates.max_redemptions = null;
    else {
      const n = Number(body.max_redemptions);
      if (!Number.isInteger(n) || n < 1) return json({ error: 'max_redemptions must be null or positive integer' }, 400);
      updates.max_redemptions = n;
    }
  }
  if (body.applies_to_plans !== undefined) {
    if (!Array.isArray(body.applies_to_plans)) return json({ error: 'applies_to_plans must be array' }, 400);
    if (body.applies_to_plans.some((p: string) => !VALID_PLAN_IDS.has(p)))
      return json({ error: 'applies_to_plans contains unknown plan id' }, 400);
    updates.applies_to_plans = body.applies_to_plans;
  }

  const { data, error } = await supabase
    .from('discount_codes').update(updates).eq('id', context.params.id).select().maybeSingle();
  if (error || !data) return json({ error: error?.message || 'Not found' }, 404);
  return json(data);
};

export const DELETE: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  const { error } = await supabase.from('discount_codes').delete().eq('id', context.params.id);
  if (error) return json({ error: error.message }, 500);
  return json({ success: true });
};
```

- [ ] **Step 2: Smoke**

```js
fetch('/api/admin/discount-codes/<id>', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ is_active: false }) }).then(r => r.json()).then(console.log);
```
Expected: row JSON with `is_active: false`.

- [ ] **Step 3: Commit**

```bash
git add "src/pages/api/admin/discount-codes/[id].ts"
git commit -m "feat: admin API GET/PATCH/DELETE /api/admin/discount-codes/[id]"
```

---

### Task 7: Admin API — toggle subscription active

**Files:**
- Create: `src/pages/api/admin/subscriptions/[id].ts`

- [ ] **Step 1: Write the endpoint**

```typescript
// src/pages/api/admin/subscriptions/[id].ts
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { supabase } from '../../../../lib/supabase';

export const prerender = false;
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

export const PATCH: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user || user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (typeof body.is_active !== 'boolean') return json({ error: 'is_active boolean required' }, 400);

  const now = new Date().toISOString();
  const updates: Record<string, any> = { is_active: body.is_active, updated_at: now };
  if (!body.is_active) updates.deactivated_at = now;
  else updates.deactivated_at = null;

  const { data, error } = await supabase
    .from('subscriptions').update(updates).eq('id', context.params.id).select().maybeSingle();
  if (error) {
    // Unique partial index may reject re-activation if another active row exists
    if ((error as any).code === '23505')
      return json({ error: 'User already has an active subscription' }, 409);
    return json({ error: error.message }, 500);
  }
  if (!data) return json({ error: 'Not found' }, 404);
  return json(data);
};
```

- [ ] **Step 2: Smoke** (after Task 4 has created a subscription)

```js
fetch('/api/admin/subscriptions/<id>', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ is_active: false }) }).then(r => r.json()).then(console.log);
```
Expected: row with `is_active: false` and `deactivated_at` set.

- [ ] **Step 3: Commit**

```bash
git add "src/pages/api/admin/subscriptions/[id].ts"
git commit -m "feat: admin API PATCH /api/admin/subscriptions/[id]"
```

---

### Task 8: Admin discount-codes list page

**Files:**
- Create: `src/pages/admin/discount-codes/index.astro`

- [ ] **Step 1: Write the page**

```astro
---
export const prerender = false;
import DashboardLayout from '../../../layouts/DashboardLayout.astro';
import { supabase } from '../../../lib/supabase';

const user = Astro.locals.user;
if (!user || user.role !== 'admin') return Astro.redirect('/auth/login');

const { data: codes } = await supabase
  .from('discount_codes')
  .select('*')
  .order('created_at', { ascending: false });
---

<DashboardLayout title="Discount Codes">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Discount Codes</h1>
    <a href="/admin/discount-codes/new" class="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700">+ New code</a>
  </div>

  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Code</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Used / Cap</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Plans</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Created</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {(codes || []).map((c: any) => (
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono font-semibold">
                <a href={`/admin/discount-codes/${c.id}`} class="text-primary-600 hover:underline">{c.code}</a>
              </td>
              <td class="px-4 py-3 text-gray-600">{c.current_redemptions} / {c.max_redemptions ?? '∞'}</td>
              <td class="px-4 py-3 text-gray-600 text-xs">{c.applies_to_plans.length === 0 ? 'All plans' : c.applies_to_plans.join(', ')}</td>
              <td class="px-4 py-3">
                <span class:list={['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600']}>
                  {c.is_active ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {(codes || []).length === 0 && (
            <tr><td colspan="5" class="px-4 py-12 text-center text-gray-400">No codes yet. Create one to get started.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</DashboardLayout>
```

- [ ] **Step 2: Smoke**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:4322/admin/discount-codes
```
Expected: `302` (redirect to login without admin cookie). Manual verify with admin login: list renders.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/discount-codes/index.astro
git commit -m "feat: admin discount-codes list page"
```

---

### Task 9: Admin "new code" page

**Files:**
- Create: `src/pages/admin/discount-codes/new.astro`

- [ ] **Step 1: Write the page**

```astro
---
export const prerender = false;
import DashboardLayout from '../../../layouts/DashboardLayout.astro';
import { PLANS } from '../../../lib/pricing';

const user = Astro.locals.user;
if (!user || user.role !== 'admin') return Astro.redirect('/auth/login');
---

<DashboardLayout title="New Discount Code">
  <div class="max-w-2xl">
    <a href="/admin/discount-codes" class="text-sm text-gray-500 hover:text-gray-700">← Back</a>
    <h1 class="text-2xl font-bold text-gray-900 mt-2 mb-6">New Discount Code</h1>

    <form id="new-code-form" class="space-y-5 bg-white rounded-xl border border-gray-200 p-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Code</label>
        <input name="code" required pattern="[A-Za-z0-9-]{3,32}" class="w-full border border-gray-300 rounded-lg px-3 py-2 uppercase" placeholder="WELCOME-FREE" />
        <p class="mt-1 text-xs text-gray-500">3–32 chars (letters, digits, dashes). Will be stored uppercased.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Max redemptions</label>
        <input name="max_redemptions" type="number" min="1" class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Leave blank for unlimited" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Applies to plans</label>
        <div class="space-y-2">
          {PLANS.map((p) => (
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" name="plan" value={p.id} class="rounded" />
              <span>{p.name} <span class="text-gray-400 text-xs">({p.id})</span></span>
            </label>
          ))}
        </div>
        <p class="mt-1 text-xs text-gray-500">Leave all unchecked to allow any plan.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Description (internal)</label>
        <textarea name="description" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="What is this code for?"></textarea>
      </div>

      <div class="flex items-center gap-2">
        <input type="checkbox" name="is_active" checked id="is_active" />
        <label for="is_active" class="text-sm">Active immediately</label>
      </div>

      <div id="form-error" class="hidden text-sm text-red-600"></div>

      <div class="flex gap-3">
        <button type="submit" class="px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700">Create code</button>
        <a href="/admin/discount-codes" class="px-4 py-2 rounded-lg border border-gray-200 text-sm">Cancel</a>
      </div>
    </form>
  </div>
</DashboardLayout>

<script>
  const form = document.getElementById('new-code-form') as HTMLFormElement;
  const errBox = document.getElementById('form-error') as HTMLDivElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.classList.add('hidden');
    const fd = new FormData(form);
    const planChecks = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="plan"]:checked')).map(i => i.value);
    const body = {
      code: String(fd.get('code') || ''),
      max_redemptions: fd.get('max_redemptions') ? Number(fd.get('max_redemptions')) : null,
      applies_to_plans: planChecks,
      description: String(fd.get('description') || '') || null,
      is_active: fd.get('is_active') === 'on',
    };
    const res = await fetch('/api/admin/discount-codes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) { window.location.href = '/admin/discount-codes'; return; }
    const data = await res.json().catch(() => ({}));
    errBox.textContent = data.error || 'Failed to create code';
    errBox.classList.remove('hidden');
  });
</script>
```

- [ ] **Step 2: Smoke**

Visit `/admin/discount-codes/new` as admin → submit a TEST100 code with empty plan checkboxes → confirm redirect back and row appears.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/discount-codes/new.astro
git commit -m "feat: admin new discount-code form"
```

---

### Task 10: Admin code-detail page (toggle, delete, redemption history)

**Files:**
- Create: `src/pages/admin/discount-codes/[id].astro`

- [ ] **Step 1: Write the page**

```astro
---
export const prerender = false;
import DashboardLayout from '../../../layouts/DashboardLayout.astro';
import { supabase } from '../../../lib/supabase';
import { PLANS } from '../../../lib/pricing';

const user = Astro.locals.user;
if (!user || user.role !== 'admin') return Astro.redirect('/auth/login');

const { id } = Astro.params;
const { data: code } = await supabase.from('discount_codes').select('*').eq('id', id).maybeSingle();
if (!code) return Astro.redirect('/admin/discount-codes');

const { data: subs } = await supabase
  .from('subscriptions')
  .select('id, user_id, plan_id, is_active, started_at, deactivated_at')
  .eq('discount_code_id', id)
  .order('started_at', { ascending: false });

const userIds = [...new Set((subs || []).map(s => s.user_id))];
const userMap = new Map<string, any>();
if (userIds.length > 0) {
  const { data: users } = await supabase.from('users').select('id, name, email, company_name').in('id', userIds);
  (users || []).forEach(u => userMap.set(u.id, u));
}
---

<DashboardLayout title={`Code ${code.code}`}>
  <a href="/admin/discount-codes" class="text-sm text-gray-500 hover:text-gray-700">← Back</a>

  <div class="flex items-start justify-between mt-2 mb-6">
    <div>
      <h1 class="font-mono text-3xl font-bold text-gray-900">{code.code}</h1>
      <p class="text-sm text-gray-500 mt-1">Free access · {code.current_redemptions}/{code.max_redemptions ?? '∞'} used</p>
      {code.description && <p class="text-sm text-gray-600 mt-2">{code.description}</p>}
    </div>
    <div class="flex gap-2">
      <button id="toggle-btn" class="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50" data-active={code.is_active.toString()}>
        {code.is_active ? 'Disable' : 'Enable'}
      </button>
      <button id="delete-btn" class="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50">Delete</button>
    </div>
  </div>

  <div class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Plans</h2>
    <p class="text-sm text-gray-700">{code.applies_to_plans.length === 0 ? 'All plans' : code.applies_to_plans.map((id: string) => PLANS.find(p => p.id === id)?.name || id).join(', ')}</p>
  </div>

  <h2 class="text-lg font-semibold text-gray-900 mb-3">Redemptions ({(subs || []).length})</h2>
  {subs && subs.length > 0 ? (
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Agency</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Activated</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {subs.map((s) => {
            const u = userMap.get(s.user_id);
            return (
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">{u?.company_name || u?.name || s.user_id}</td>
                <td class="px-4 py-3 text-gray-600">{s.plan_id}</td>
                <td class="px-4 py-3">
                  <span class:list={['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600']}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-gray-400 text-xs">{new Date(s.started_at).toLocaleDateString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ) : (
    <p class="text-gray-400 text-sm">No redemptions yet.</p>
  )}
</DashboardLayout>

<script define:vars={{ codeId: code.id }}>
  document.getElementById('toggle-btn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const wasActive = btn.dataset.active === 'true';
    const res = await fetch(`/api/admin/discount-codes/${codeId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !wasActive }),
    });
    if (res.ok) window.location.reload();
    else alert('Failed to toggle');
  });
  document.getElementById('delete-btn')?.addEventListener('click', async () => {
    if (!confirm('Delete this code? Redemption rows will lose their code reference but stay (subscriptions remain).')) return;
    const res = await fetch(`/api/admin/discount-codes/${codeId}`, { method: 'DELETE' });
    if (res.ok) window.location.href = '/admin/discount-codes';
    else alert('Failed to delete');
  });
</script>
```

- [ ] **Step 2: Smoke**

Visit `/admin/discount-codes/<id>`. Toggle Disable → reload → status flips.

- [ ] **Step 3: Commit**

```bash
git add "src/pages/admin/discount-codes/[id].astro"
git commit -m "feat: admin discount-code detail page with toggle and history"
```

---

### Task 11: Admin subscriptions page

**Files:**
- Create: `src/pages/admin/subscriptions.astro`

- [ ] **Step 1: Write the page**

```astro
---
export const prerender = false;
import DashboardLayout from '../../layouts/DashboardLayout.astro';
import { supabase } from '../../lib/supabase';

const user = Astro.locals.user;
if (!user || user.role !== 'admin') return Astro.redirect('/auth/login');

const { data: subs } = await supabase
  .from('subscriptions')
  .select('id, user_id, plan_id, source, discount_code_id, is_active, started_at, deactivated_at')
  .order('started_at', { ascending: false });

const userIds = [...new Set((subs || []).map(s => s.user_id))];
const codeIds = [...new Set((subs || []).map(s => s.discount_code_id).filter(Boolean) as string[])];

const userMap = new Map<string, any>();
if (userIds.length > 0) {
  const { data: users } = await supabase.from('users').select('id, name, email, company_name').in('id', userIds);
  (users || []).forEach(u => userMap.set(u.id, u));
}
const codeMap = new Map<string, string>();
if (codeIds.length > 0) {
  const { data: codes } = await supabase.from('discount_codes').select('id, code').in('id', codeIds);
  (codes || []).forEach(c => codeMap.set(c.id, c.code));
}
---

<DashboardLayout title="Subscriptions">
  <h1 class="text-2xl font-bold text-gray-900 mb-6">Subscriptions</h1>

  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Agency</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Source</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Code</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Started</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {(subs || []).map((s) => {
            const u = userMap.get(s.user_id);
            return (
              <tr class="hover:bg-gray-50" data-sub-id={s.id}>
                <td class="px-4 py-3">
                  <p class="text-gray-900">{u?.company_name || u?.name || '—'}</p>
                  <p class="text-gray-400 text-xs">{u?.email}</p>
                </td>
                <td class="px-4 py-3 text-gray-700">{s.plan_id}</td>
                <td class="px-4 py-3 text-gray-500 text-xs">{s.source}</td>
                <td class="px-4 py-3 font-mono text-xs">{s.discount_code_id ? codeMap.get(s.discount_code_id) || '—' : '—'}</td>
                <td class="px-4 py-3">
                  <span class:list={['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600']} data-status>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs">{new Date(s.started_at).toLocaleDateString()}</td>
                <td class="px-4 py-3 text-right">
                  <button class="toggle-sub text-xs font-semibold text-primary-600 hover:underline" data-sub-id={s.id} data-active={s.is_active.toString()}>
                    {s.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              </tr>
            );
          })}
          {(subs || []).length === 0 && (
            <tr><td colspan="7" class="px-4 py-12 text-center text-gray-400">No subscriptions yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</DashboardLayout>

<script>
  document.querySelectorAll('.toggle-sub').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const id = target.dataset.subId;
      const wasActive = target.dataset.active === 'true';
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !wasActive }),
      });
      if (res.ok) window.location.reload();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to toggle');
      }
    });
  });
</script>
```

- [ ] **Step 2: Smoke**

Visit `/admin/subscriptions` as admin. Click Deactivate on the row created during Task 4 smoke → reload → row shows Inactive.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/subscriptions.astro
git commit -m "feat: admin subscriptions page with activate/deactivate"
```

---

### Task 12: Pricing page — code input + redeem flow

**Files:**
- Modify: `src/pages/dashboard/pricing.astro`

- [ ] **Step 1: Add the code-entry block above the plan grid**

After the billing toggle (line ~36) and before the `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">` opening, insert:

```astro
<div class="max-w-md mx-auto mb-10 bg-white rounded-2xl border border-gray-200 p-4">
  <div class="flex gap-2">
    <input id="code-input" placeholder="Discount code" class="flex-1 px-3 py-2 rounded-lg border border-gray-200 uppercase text-sm" />
    <button id="code-apply" type="button" class="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800">Apply</button>
  </div>
  <p id="code-feedback" class="mt-2 text-sm hidden"></p>
</div>
```

- [ ] **Step 2: Add the validate-and-swap script**

Add a new `<script>` block at the bottom of the file (after the existing one):

```typescript
<script>
  const codeInput = document.getElementById('code-input') as HTMLInputElement;
  const applyBtn = document.getElementById('code-apply') as HTMLButtonElement;
  const feedback = document.getElementById('code-feedback') as HTMLParagraphElement;

  function showFeedback(msg: string, ok: boolean) {
    feedback.textContent = msg;
    feedback.className = `mt-2 text-sm ${ok ? 'text-green-700' : 'text-red-600'}`;
  }

  function resetCard(card: Element) {
    const form = card.querySelector('form') as HTMLFormElement | null;
    const btn = card.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    if (form) form.action = '/api/stripe/checkout';
    if (btn) btn.textContent = 'Get Started';
    // Strip strike-through preview
    card.querySelectorAll<HTMLSpanElement>('.discount-strike').forEach(s => s.remove());
    card.querySelectorAll<HTMLSpanElement>('.discount-free').forEach(s => s.remove());
    card.querySelectorAll<HTMLElement>('.original-price').forEach(el => el.classList.remove('original-price'));
  }

  async function applyCode() {
    const raw = codeInput.value.trim().toUpperCase();
    if (!raw) return;
    applyBtn.disabled = true;

    const cards = Array.from(document.querySelectorAll<HTMLDivElement>('[data-plan-id]'));
    cards.forEach(resetCard);

    const results = await Promise.all(cards.map(async (card) => {
      const planId = card.dataset.planId!;
      const res = await fetch('/api/discount-codes/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: raw, planId }),
      });
      return { planId, card, data: await res.json().catch(() => ({})) };
    }));
    applyBtn.disabled = false;

    const valid = results.filter(r => r.data?.valid === true);
    if (valid.length === 0) {
      const reason = results[0]?.data?.message || 'Code not valid';
      showFeedback(reason, false);
      return;
    }

    valid.forEach(({ card, planId }) => {
      const form = card.querySelector('form') as HTMLFormElement | null;
      const btn = card.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (form) {
        form.action = '/api/discount-codes/redeem';
        let hidden = form.querySelector<HTMLInputElement>('input[name="discountCode"]');
        if (!hidden) {
          hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = 'discountCode';
          form.appendChild(hidden);
        }
        hidden.value = raw;
      }
      if (btn) btn.textContent = 'Activate Free';
    });

    const total = cards.length;
    const ok = valid.length;
    showFeedback(
      ok === total
        ? `Code valid for all ${total} plans — click Activate Free.`
        : `Code valid for ${ok} of ${total} plans.`,
      true,
    );
  }

  applyBtn?.addEventListener('click', applyCode);
  codeInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyCode(); } });
</script>
```

- [ ] **Step 3: Smoke**

Log in as agency. Visit `/dashboard/pricing`. Enter `TEST100` → click Apply → feedback shows "valid for all 4 plans". Click "Activate Free" on Starter → redirects to `/dashboard?activated=starter` → check `subscriptions` table has new row, `discount_codes.current_redemptions` = 1.

- [ ] **Step 4: Commit**

```bash
git add src/pages/dashboard/pricing.astro
git commit -m "feat: discount-code input on pricing page swaps CTA to free-redeem"
```

---

### Task 13: Admin nav link + final verification

**Files:**
- Modify: `src/components/dashboard/Sidebar.astro`

- [ ] **Step 1: Add nav entries**

In `adminLinks` (around line 24), add two entries (e.g., before Settings):

```typescript
{ href: '/admin/discount-codes', label: 'Discount Codes', icon: 'euro' },
{ href: '/admin/subscriptions', label: 'Subscriptions', icon: 'credit-card' },
```

(Reuse existing icons; `euro` and `credit-card` are already in the icons map at lines 42 and 49.)

- [ ] **Step 2: Full smoke matrix**

```bash
# Admin pages
for url in /admin/discount-codes /admin/discount-codes/new /admin/subscriptions ; do
  curl -sS -o /dev/null -w "$url -> %{http_code}\n" "http://localhost:4322$url"
done

# Validate API (unauthenticated → 401)
curl -sS -X POST -H "Content-Type: application/json" \
  -d '{"code":"X","planId":"professional"}' \
  http://localhost:4322/api/discount-codes/validate -w "\n%{http_code}\n"

# Production build
npm run build 2>&1 | tail -5
```
Expected: `302` (admin redirect to login), `401` from validate, build "Complete!".

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/Sidebar.astro
git commit -m "feat: link discount codes and subscriptions from admin nav"
```

---

## Out of scope (intentionally — flag if you disagree)

- Plan-limit enforcement (capping listings/images by active subscription) — separate plan.
- Stripe path for partial-discount codes — separate plan.
- Per-customer redemption limits (same user can redeem the same code multiple times; each new redemption deactivates the previous active subscription).
- Time-bounded auto-expiry (admin toggles `is_active` manually).
- Email notification on activation/deactivation.
- Editing `code` string after creation (immutable to keep history honest).
