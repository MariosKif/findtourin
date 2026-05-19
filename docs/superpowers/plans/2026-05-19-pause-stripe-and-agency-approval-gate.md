# Pause Stripe + Agency Approval Gate + Ultimate Default — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take Stripe payments offline by commenting out the checkout routes and CTAs, gate tour creation behind a new admin-approval flag, and auto-grant every agency the Ultimate plan on registration so the platform is fully usable without paid subscriptions.

**Architecture:** A new `users.is_approved` boolean (separate from the public `is_verified` trust badge) controls whether an agency can submit tours. The existing `subscriptions` table is reused for the auto-granted Ultimate plan via a new `source='auto_grant'` value. Stripe route bodies are commented out and replaced with a 503 response so the routes stay registered but inert; pricing-page CTAs are visually neutralised. The existing tour-status flow (`pending_payment` → admin approves → `active`) is simplified so approved agencies create tours directly as `active` — per-tour approval becomes per-agency approval, repurposing `/admin/approvals` for the agency queue.

**Tech Stack:** Astro 5 (server endpoints + .astro pages), Supabase Postgres (REST + RPC), Tailwind, Vercel adapter.

**Why no automated tests:** This repo has no test runner (`npm test` is not defined, no vitest/jest). Verification at each task = build passes (`npm run build`) + a focused smoke check; the final task is an end-to-end smoke test.

---

## File Map

| Path | Action | Responsibility |
|---|---|---|
| `scripts/migrations/2026-05-19-agency-approval-and-ultimate-default.sql` | Create | Adds `is_approved`, backfills existing agencies, widens subscription `source` check, inserts Ultimate subs for existing agencies |
| `src/pages/api/stripe/checkout-plan.ts` | Modify | Comment body, return 503 |
| `src/pages/api/stripe/webhook.ts` | Modify | Comment body, return 503 |
| `src/pages/dashboard/pricing.astro` | Modify | Replace Subscribe form with "Billing paused — included on Ultimate" note |
| `src/pages/pricing.astro` | Modify | Replace public-facing Subscribe/CTA buttons with a soft "Coming soon" state |
| `src/pages/dashboard/subscription.astro` | Modify | Hide Stripe-source labels; show "Ultimate (granted)" instead |
| `src/pages/api/auth/register.ts` | Modify | On agency signup, insert an active Ultimate subscription with `source='auto_grant'` |
| `src/pages/api/tours/index.ts` | Modify | Gate POST behind `is_approved`; default new tour `status='active'` |
| `src/lib/subscriptions.ts` | Modify | `countLiveListings` counts only `status='active'` (pending_payment retired) |
| `src/pages/dashboard/tours/new.astro` | Modify | Show "Pending approval" banner when `!user.is_approved`; hide form |
| `src/pages/dashboard/index.astro` | Modify | Surface pending-approval banner to agency users |
| `src/pages/admin/approvals.astro` | Modify | Repurpose: list pending **agencies** instead of pending tours |
| `src/pages/api/admin/users/[id].ts` | Modify | Accept `isApproved` in PUT body |
| `src/types/index.ts` & `src/env.d.ts` | Modify | Add `is_approved` to User type and `Astro.locals.user` shape |
| `src/lib/auth-helpers.ts` | Modify | Include `is_approved` in the fetched user record |

---

## Task 1: DB Migration — `is_approved`, Ultimate Backfill, `auto_grant` Source

**Files:**
- Create: `scripts/migrations/2026-05-19-agency-approval-and-ultimate-default.sql`

- [ ] **Step 1: Write the migration SQL**

Create `scripts/migrations/2026-05-19-agency-approval-and-ultimate-default.sql`:

```sql
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
```

- [ ] **Step 2: Apply the migration in Supabase**

Open the Supabase SQL editor for this project and paste the file contents. Confirm it runs without error.

- [ ] **Step 3: Verify in Supabase**

In the SQL editor, run:

```sql
select count(*) filter (where is_approved) as approved,
       count(*) filter (where not is_approved) as pending
from users where role = 'agency';

select plan_id, source, count(*)
from subscriptions where is_active = true
group by 1, 2 order by 1, 2;
```

Expected:
- `approved` equals the existing agency count, `pending` = 0.
- `plan_id='ultimate', source='auto_grant'` count equals the number of agencies that previously had no active sub.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrations/2026-05-19-agency-approval-and-ultimate-default.sql
git commit -m "feat(db): add is_approved gate + auto_grant ultimate for existing agencies"
```

---

## Task 2: Surface `is_approved` Through Types & Auth Helper

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/env.d.ts`
- Modify: `src/lib/auth-helpers.ts`

- [ ] **Step 1: Add `is_approved` to the User type**

Edit `src/types/index.ts`. Find the existing User interface (around line 11 where `is_verified: boolean;` lives) and add right after it:

```ts
  is_approved: boolean;
```

- [ ] **Step 2: Add `is_approved` to `Astro.locals.user`**

Edit `src/env.d.ts`. Find the `user?:` namespace block (around line 15 where `is_verified?: boolean;` lives) and add right after it:

```ts
      is_approved?: boolean;
```

- [ ] **Step 3: Include `is_approved` in the auth helper select**

Open `src/lib/auth-helpers.ts` and locate the `.select('...')` call that fetches the user profile (search for `is_verified` in the file). Add `is_approved` to that select string so the returned user object includes the flag.

If the helper uses `select('*')`, no change is needed — verify by reading the file and skip to Step 4.

- [ ] **Step 4: Type-check**

Run:

```bash
npx astro check 2>&1 | tail -20
```

Expected: no errors related to `is_approved`. Warnings unrelated to this change are fine.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/env.d.ts src/lib/auth-helpers.ts
git commit -m "types: add is_approved to User + Astro.locals.user"
```

---

## Task 3: Comment Out Stripe API Route Bodies

**Files:**
- Modify: `src/pages/api/stripe/checkout-plan.ts`
- Modify: `src/pages/api/stripe/webhook.ts`

- [ ] **Step 1: Neutralise `checkout-plan.ts`**

Replace the file body so the route stays registered but returns 503:

```ts
import type { APIRoute } from 'astro';

export const prerender = false;

// Billing is paused — Stripe checkout is disabled.
// Restore the original implementation when payments come back online.
// See git history (pre-2026-05-19) for the previous logic.
export const POST: APIRoute = async () =>
  new Response(
    JSON.stringify({ error: 'Billing is currently paused.' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  );

/*
=== ORIGINAL IMPLEMENTATION (paused 2026-05-19) ===
<paste the entire previous file content here, wrapped in this block comment>
*/
```

Before saving, read the original file contents and paste them inside the `/* ... */` block so we don't lose the logic.

- [ ] **Step 2: Neutralise `webhook.ts` the same way**

Replace its body with:

```ts
import type { APIRoute } from 'astro';

export const prerender = false;

// Webhook is paused — Stripe is offline. Return 200 so Stripe's retry queue
// doesn't pile up if any test webhook reaches us; log the event for visibility.
export const POST: APIRoute = async ({ request }) => {
  console.warn('Stripe webhook hit while billing is paused', {
    headers: Object.fromEntries(request.headers),
  });
  return new Response(null, { status: 200 });
};

/*
=== ORIGINAL IMPLEMENTATION (paused 2026-05-19) ===
<paste the entire previous file content here, wrapped in this block comment>
*/
```

- [ ] **Step 3: Verify the build**

```bash
npm run build 2>&1 | tail -10
```

Expected: `[build] Complete!` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/stripe/
git commit -m "chore(stripe): comment out checkout + webhook routes (billing paused)"
```

---

## Task 4: Hide Stripe CTAs in Pricing Pages

**Files:**
- Modify: `src/pages/dashboard/pricing.astro`
- Modify: `src/pages/pricing.astro`
- Modify: `src/pages/dashboard/subscription.astro`

- [ ] **Step 1: Replace the dashboard Subscribe form**

In `src/pages/dashboard/pricing.astro` find the `<form method="POST" action="/api/stripe/checkout-plan">` (around line 127) and wrap the whole form in an HTML comment, then add a static note in its place:

```astro
{/* Subscribe form paused — Stripe is offline.
<form method="POST" action="/api/stripe/checkout-plan" class="mt-auto">
  ...original form here...
</form>
*/}
<div class="mt-auto rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
  Paid billing is paused. Every agency is on the Ultimate plan while we finalise our payments rollout.
</div>
```

Also find the JS line `if (form) form.action = '/api/stripe/checkout-plan';` (around line 346) and comment it out:

```ts
// if (form) form.action = '/api/stripe/checkout-plan'; // paused 2026-05-19
```

- [ ] **Step 2: Neutralise the public pricing page CTAs**

Open `src/pages/pricing.astro`. Find every Stripe-bound CTA (search the file for `stripe`, `Subscribe`, `Checkout`, and `checkout-plan`). For each: wrap the button/form in an Astro comment block (`{/* ... */}`) and replace it with a disabled button:

```astro
<button type="button" disabled class="w-full rounded-xl bg-gray-200 text-gray-500 font-semibold px-6 py-3 cursor-not-allowed">
  Coming soon
</button>
```

If the page contains no Stripe references, skip this step.

- [ ] **Step 3: Hide the Stripe-source label**

In `src/pages/dashboard/subscription.astro` find the ternary on line 51 that distinguishes `discount_code` / `stripe` / default. Replace with:

```astro
{activePlan.source === 'discount_code' ? 'Granted via code'
  : activePlan.source === 'auto_grant' ? 'Included plan (billing paused)'
  : activePlan.source === 'stripe' ? 'Included plan (billing paused)'
  : 'Default tier'}
```

This stops the UI from claiming there's an "Active Stripe subscription".

- [ ] **Step 4: Verify**

```bash
npm run build 2>&1 | tail -10
```

Expected: build complete, no errors.

Open the dev server and visit `/dashboard/pricing` and `/pricing` as an agency user to confirm the Stripe CTAs are gone (smoke check, no need to start a session yet — happens fully in Task 10).

- [ ] **Step 5: Commit**

```bash
git add src/pages/dashboard/pricing.astro src/pages/pricing.astro src/pages/dashboard/subscription.astro
git commit -m "feat(pricing): hide Stripe CTAs while billing is paused"
```

---

## Task 5: Auto-Grant Ultimate on Agency Registration

**Files:**
- Modify: `src/pages/api/auth/register.ts`

- [ ] **Step 1: Insert an Ultimate subscription for new agencies**

In `src/pages/api/auth/register.ts`, find the block that creates the user profile (around lines 46-58). Directly after that insert (and before the existing discount-code redemption block, around line 64), add:

```ts
    // Auto-grant Ultimate plan to every new agency. Billing is paused — agencies
    // can post tours once an admin flips is_approved to true.
    let autoGrantedPlan: string | null = null;
    if ((role || 'user') === 'agency') {
      const { error: subError } = await supabase.from('subscriptions').insert({
        user_id: authData.user.id,
        plan_id: 'ultimate',
        source: 'auto_grant',
        is_active: true,
        started_at: new Date().toISOString(),
      });
      if (subError) {
        console.error('register: auto-grant ultimate failed', subError);
      } else {
        autoGrantedPlan = 'ultimate';
      }
    }
```

- [ ] **Step 2: Update the discount-code branch to skip auto-grant collision**

The discount-code redemption RPC (`redeem_discount_code`) already deactivates any prior active subscription for the user before inserting the code-granted one (per `2026-04-27-discount-codes-redeem-rpc.sql`). No code change needed; this step is just a visual confirmation. Run:

```bash
grep -nA2 "deactivate" scripts/migrations/2026-04-27-discount-codes-redeem-rpc.sql | head -20
```

Expected: shows the RPC deactivating prior subs. If not, file a follow-up note (don't block this plan).

- [ ] **Step 3: Surface the auto-granted plan in the response**

In the `return json(...)` call near line 149, add `autoGrantedPlan` to the response:

```ts
    return json({ success: true, role: role || 'user', activatedPlan, autoGrantedPlan, codeFailedReason });
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build complete.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/auth/register.ts
git commit -m "feat(auth): auto-grant Ultimate plan to new agencies on register"
```

---

## Task 6: Gate Tour Creation API Behind `is_approved`

**Files:**
- Modify: `src/pages/api/tours/index.ts`
- Modify: `src/lib/subscriptions.ts`

- [ ] **Step 1: Block unapproved agencies in POST /api/tours**

In `src/pages/api/tours/index.ts` find the role check around line 47:

```ts
    if (user.role !== 'agency' && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
```

Immediately after it, add the approval gate (admins remain exempt):

```ts
    if (user.role === 'agency' && !user.is_approved) {
      return json({ error: 'Your agency account is pending admin approval. You will be notified once approved.' }, 403);
    }
```

- [ ] **Step 2: Default new tours to `active` instead of `pending_payment`**

In the same file, find the `tourData` object literal (around line 79). Change:

```ts
      status: 'pending_payment',
      stripe_payment_id: null,
```

to:

```ts
      status: 'active',
      stripe_payment_id: null,
```

Also update the comment block right above the `return json(...)` at line 112-113 so it no longer says "you'll need to pay the listing fee to make it visible".

- [ ] **Step 3: Remove `pending_payment` from listing-cap count**

In `src/lib/subscriptions.ts` line 84, change:

```ts
    .in('status', ['active', 'pending_payment']);
```

to:

```ts
    .eq('status', 'active');
```

(Older `pending_payment` rows in the DB will simply stop counting toward the cap; with the Ultimate default that's fine.)

- [ ] **Step 4: Update the dashboard tour-creation page hint**

In `src/pages/dashboard/tours/new.astro` line 30, change the help text:

```astro
<p class="text-gray-600 mb-6">Fill in the details below to create a new tour listing. Your tour goes live as soon as you save it.</p>
```

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build complete.

- [ ] **Step 6: Commit**

```bash
git add src/pages/api/tours/index.ts src/lib/subscriptions.ts src/pages/dashboard/tours/new.astro
git commit -m "feat(tours): gate creation behind is_approved + tours go live immediately"
```

---

## Task 7: Pending-Approval Banner on Dashboard

**Files:**
- Modify: `src/pages/dashboard/tours/new.astro`
- Modify: `src/pages/dashboard/index.astro`

- [ ] **Step 1: Block `/dashboard/tours/new` for unapproved agencies**

In `src/pages/dashboard/tours/new.astro`, right after the `if (!user) return Astro.redirect('/auth/login');` line (line 8), add:

```astro
const isPendingApproval = user.role === 'agency' && !user.is_approved;
```

Wrap the existing render so the pending banner shows first. Change the outer JSX to:

```astro
<DashboardLayout title="Add New Tour">
  {isPendingApproval ? (
    <div class="max-w-xl mx-auto bg-white rounded-2xl border border-amber-200 p-8 text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-4">
        <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Your agency is pending approval</h1>
      <p class="text-gray-600 mb-6">An admin needs to approve your agency before you can publish tours. We will notify you by email once you are approved.</p>
      <a href="/dashboard" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700">
        Back to dashboard
      </a>
    </div>
  ) : capState.atCap && user.role !== 'admin' ? (
    {/* existing cap-reached block stays here */}
  ) : (
    {/* existing form block stays here */}
  )}
</DashboardLayout>
```

Keep the existing two branches exactly as they are; only the new `isPendingApproval` branch is added on top.

- [ ] **Step 2: Surface a banner on the dashboard home**

Open `src/pages/dashboard/index.astro`. Near the top of the page render (right after the `<DashboardLayout>` opening tag or above the first content card), add:

```astro
{user?.role === 'agency' && !user.is_approved && (
  <div class="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
    <strong class="font-semibold">Pending admin approval.</strong> Once approved you will be able to publish tours. We will email you when you're approved.
  </div>
)}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build complete.

- [ ] **Step 4: Commit**

```bash
git add src/pages/dashboard/tours/new.astro src/pages/dashboard/index.astro
git commit -m "feat(dashboard): show pending-approval state for unapproved agencies"
```

---

## Task 8: Admin Agency-Approval Queue

**Files:**
- Modify: `src/pages/admin/approvals.astro`
- Modify: `src/pages/api/admin/users/[id].ts`

- [ ] **Step 1: Extend the admin user PUT to accept `isApproved`**

In `src/pages/api/admin/users/[id].ts` find the existing update-data builder (line 42-44). Add a third line so the body looks like:

```ts
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.role !== undefined) updateData.role = body.role;
  if (body.isVerified !== undefined) updateData.is_verified = body.isVerified;
  if (body.isApproved !== undefined) updateData.is_approved = body.isApproved;
```

- [ ] **Step 2: Repurpose `/admin/approvals` for pending agencies**

Open `src/pages/admin/approvals.astro` and rewrite the data fetch + table. Replace the existing top frontmatter block (lines 1-14) with:

```astro
---
export const prerender = false;
import DashboardLayout from '../../layouts/DashboardLayout.astro';
import { supabase } from '../../lib/supabase';

const user = Astro.locals.user;
if (!user || user.role !== 'admin') return Astro.redirect('/');

const { data: pendingAgencies } = await supabase
  .from('users')
  .select('id, email, name, company_name, website, phone, created_at')
  .eq('role', 'agency')
  .eq('is_approved', false)
  .order('created_at', { ascending: false });
---
```

Replace the table body (lines 16-48) with:

```astro
<DashboardLayout title="Agency Approvals">
  <h1 class="text-xl font-semibold text-gray-900 mb-6">Pending Agency Approvals</h1>
  {(pendingAgencies || []).length > 0 ? (
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Agency</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Email</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Website</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Registered</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {(pendingAgencies || []).map((a) => (
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-900">{a.company_name || a.name}</td>
              <td class="px-4 py-3 text-gray-600">{a.email}</td>
              <td class="px-4 py-3 text-gray-600">{a.website || '—'}</td>
              <td class="px-4 py-3 text-gray-500 text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
              <td class="px-4 py-3">
                <button class="approve-agency-btn text-xs text-green-600 hover:underline mr-3" data-user-id={a.id}>Approve</button>
                <a class="text-xs text-gray-500 hover:underline" href={`/admin/users`}>View all</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div class="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
      No agencies awaiting approval
    </div>
  )}

  <script>
    document.querySelectorAll('.approve-agency-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = (btn as HTMLElement).dataset.userId;
        const res = await fetch('/api/admin/users/' + userId, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isApproved: true }),
        });
        if (res.ok) location.reload();
        else alert('Failed to approve agency');
      });
    });
  </script>
</DashboardLayout>
```

- [ ] **Step 3: Add an Approve toggle on `/admin/users`**

Open `src/pages/admin/users.astro`. Find the existing Verify/Unverify column (lines 51-60). Add a parallel approval cell immediately after it:

```astro
<td class="px-4 py-3">
  <Badge variant={u.is_approved ? 'success' : 'neutral'} size="sm">
    {u.is_approved ? 'Approved' : 'Pending'}
  </Badge>
</td>
<td class="px-4 py-3">
  <button class="approve-btn text-xs text-primary-600 hover:underline" data-user-id={u.id} data-approved={String(!u.is_approved)}>
    {u.is_approved ? 'Revoke' : 'Approve'}
  </button>
</td>
```

Add a matching column header (`<th>Approved</th>` and `<th>Action</th>`) and a small handler script that mirrors the existing `.verify-btn` logic but POSTs `{ isApproved: ... }`. Reuse the pattern verbatim from the existing verify handler so the file stays consistent.

Also ensure the SELECT statement at the top of the file fetches `is_approved` (read the file and add the column to the existing `.select(...)` list).

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build complete.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/approvals.astro src/pages/admin/users.astro src/pages/api/admin/users/\[id\].ts
git commit -m "feat(admin): agency-approval queue at /admin/approvals + toggle on /admin/users"
```

---

## Task 9: Quick Static Verification

**Files:** (none)

- [ ] **Step 1: Full build**

```bash
npm run build 2>&1 | tail -15
```

Expected: `[build] Complete!` with no TypeScript errors. Vite warnings about externalised Node modules are pre-existing and fine.

- [ ] **Step 2: Grep for stale Stripe imports**

```bash
grep -rnE "from .*lib/stripe|new Stripe\(|stripe\.checkout\." --include="*.ts" --include="*.astro" src/ | grep -v "/\*" | grep -v "//"
```

Expected: no hits outside of the commented-out blocks inside `src/pages/api/stripe/`. Anything else needs to be commented too.

- [ ] **Step 3: Confirm migration state**

In Supabase SQL editor:

```sql
select column_name from information_schema.columns
where table_name='users' and column_name='is_approved';

select source, count(*) from subscriptions group by 1;
```

Expected: `is_approved` row exists; `auto_grant` appears in the source counts.

---

## Task 10: End-to-End Smoke Test

**Files:** (none — manual test)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Wait for `astro` to print the local URL (usually `http://localhost:4321`).

- [ ] **Step 2: Register a fresh agency**

Open the local URL in a browser. Sign up as a new agency with a fresh email (e.g. `smoke-<timestamp>@example.com`). Confirm:

- Registration succeeds.
- You land in the dashboard.
- The dashboard home shows the amber "Pending admin approval" banner.

- [ ] **Step 3: Confirm the auto-grant**

In Supabase SQL editor:

```sql
select s.plan_id, s.source, s.is_active, u.is_approved, u.email
from subscriptions s join users u on u.id = s.user_id
where u.email = '<the email you just used>';
```

Expected: one row, `plan_id='ultimate'`, `source='auto_grant'`, `is_active=true`, `is_approved=false`.

- [ ] **Step 4: Confirm tour creation is blocked**

In the dashboard sidebar click **Add Tour**. Expected: the "Your agency is pending approval" full-page card renders and there is no TourForm. Then in another tab try:

```bash
curl -i -X POST http://localhost:4321/api/tours \
  -H "Content-Type: application/json" \
  -H "Cookie: <copy sb-access-token cookie from your browser>" \
  -d '{"name":"smoke","description":"x","country":"Greece","city":"Athens","price":10,"category":"Cultural"}'
```

Expected: `HTTP/1.1 403` with body `{"error":"Your agency account is pending admin approval. ..."}`.

- [ ] **Step 5: Approve the agency as admin**

Log in as an admin user in a different browser/profile (or use an incognito window). Visit `/admin/approvals`. Confirm the smoke-test agency appears. Click **Approve**. Page reloads; agency vanishes from the list.

In Supabase SQL editor re-run the query from Step 3. Expected: `is_approved=true` now.

- [ ] **Step 6: Confirm tour creation now works**

Refresh the smoke-test agency's `/dashboard/tours/new`. Expected: the TourForm is now visible (banner gone). Fill in the form and submit. Expected: redirect to the edit page (`/dashboard/tours/<id>/edit?new=1`), and in Supabase the new row has `status='active'`.

- [ ] **Step 7: Confirm Stripe is inert**

Visit `/pricing` and `/dashboard/pricing`. Expected: every paid-plan CTA is either a disabled "Coming soon" button or replaced by the "billing paused" note — no Subscribe form posts to `/api/stripe/checkout-plan`. As a final check:

```bash
curl -i -X POST http://localhost:4321/api/stripe/checkout-plan
```

Expected: `HTTP/1.1 503` with body `{"error":"Billing is currently paused."}`.

- [ ] **Step 8: Confirm existing agencies were grandfathered**

In Supabase, pick any pre-existing agency (one not created in this smoke run):

```sql
select email, is_approved from users where role='agency' and email <> '<smoke email>' limit 5;
```

Expected: all `is_approved=true`. They can still publish tours.

- [ ] **Step 9: Report**

Note in the conversation: which steps passed, which failed, anything unexpected. If everything passed, the change is ready for a final commit summary and (when the user asks) a PR.

---

## Self-Review

**Spec coverage:**
- "comment everything that is on the stripe payment" → Tasks 3 (routes) + 4 (CTAs). Stripe lib file and the npm dep are left intact per the clarification choice.
- "once the agencies register and the admin approve them to be able to to post their tours" → Tasks 1 (column + backfill), 6 (API gate), 7 (UI gate), 8 (admin approval UI).
- "each agency on register will get the big package" → Task 5 (new) + Task 1 step 4 (existing backfill).
- "monetize later" → leaving `/api/stripe/*` routes and `src/lib/stripe.ts` intact + original code preserved in comment blocks supports re-enabling later.
- "smoke test" → Task 10 covers register → block → approve → publish → confirm-Stripe-503.

**Placeholder scan:** No "TBD", "implement later", or "handle edge cases" tokens. Every code change has an exact code block; the only `<paste original here>` placeholders in Task 3 are operationally clear (read the file, paste in the block comment).

**Type consistency:** `is_approved` is added to `users` (Task 1), `User` type (Task 2), `Astro.locals.user` (Task 2), the API PUT body as `isApproved` (Task 8 — case matches the existing `isVerified` convention in `/api/admin/users/[id].ts`), and the dashboard guards (Tasks 6/7). The `auto_grant` source string is consistent across Task 1 (migration + check constraint), Task 5 (register insert), and Task 4 (subscription page label).
