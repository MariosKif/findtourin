# Plan-Limit Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Cap each agency's listing count and images-per-tour based on the `plan_id` on their active row in `subscriptions`. Today the limits in `src/lib/pricing.ts` are display-only.

**Architecture:**
- New shared helper module `src/lib/subscriptions.ts` exports `getActivePlanForUser(userId)`, `countLiveListings(agencyId)`, and `assertCanCreateListing(userId)`. The first treats "no active subscription row" as the **starter plan** (15 listings, 5 images per tour) so existing agencies without a subscription continue to work; admins promote them by activating a `subscriptions` row (already wired via the discount-code redeem flow and the admin subscriptions page from the previous plan).
- Tour creation API (`src/pages/api/tours/index.ts`) calls `assertCanCreateListing(user.id)` before insert; on cap-hit returns 403 with a user-facing message.
- Image upload API (`src/pages/api/tours/[id]/images.ts`) replaces the hard-coded `images.length >= 5` check with the active plan's `maxImagesPerTour`.
- Dashboard surfaces the cap usage so agencies see "X / N listings used" and "Y / M images this tour".
- The new-tour page hides the form and shows an "Upgrade your plan" CTA when the agency is at cap.
- The edit-tour page shows the plan-aware image limit text instead of the hard-coded "Upload up to 5 images".

**Tech Stack:** Astro 6 SSR + Supabase (service role) + TypeScript. No test framework — verify each task with `curl` + manual smoke.

## Codebase facts (verified during pre-flight)

- Tour creation: `src/pages/api/tours/index.ts:42-105` (POST). Default `status: 'pending_payment'` (line 87). Single insert site.
- Status transitions: Stripe webhook `src/pages/api/stripe/webhook.ts:46-51` flips `pending_payment → active`; admin PUT `src/pages/api/admin/tours/[id].ts:28-29`; soft-delete via `src/pages/api/tours/[id].ts:123-124` sets `status='deleted'`.
- Tour images live in a single `tours.images` JSONB column (default `[]`). The 5-image cap is hard-coded at `src/pages/api/tours/[id]/images.ts:32`.
- `getPlan(planId)` and `PLANS` already exist in `src/lib/pricing.ts:77-79`. No code currently reads `maxListings` or `maxImagesPerTour` for gating.
- Dashboard at `src/pages/dashboard/index.astro:17-19` already counts `totalListings`, `activeListings`, `pendingPayment`. No "X/N used" UI yet.
- `subscriptions` table has a partial unique index `(user_id) where is_active=true`. One active row per user. No helper exists to fetch it.
- `User` type has no plan field. Active plan is derived from the join `subscriptions WHERE user_id=? AND is_active=true`.
- Auth in API routes: `await getAuthenticatedUser(context)` from `src/lib/auth-helpers.ts`. Astro pages under `/dashboard/*` get `Astro.locals.user` from middleware.

## Decisions captured

| Question | Decision |
|---|---|
| What's enforced | Listing count (status `'active'` + `'pending_payment'` count toward cap; `'deleted'` and `'inactive'` do not) and images per tour. |
| Default when no active subscription | **Starter** plan (15 listings, 5 images). Existing agencies without a subscription continue to work. Admins promote via discount-code redeem or `/admin/subscriptions`. |
| Over-cap state | Existing tours stay; new creation blocked. Dashboard shows "25 / 15" if an admin downgrades a heavy user. Acceptable for MVP. |
| Stripe payment flow | **Untouched.** Tours still go `pending_payment → Stripe → active`. Plan caps work alongside the existing pay-per-listing flow. |
| Cap check race | Single user creating two tours in parallel could both pass an `n < cap` check and insert. For an admin tool with one user per session this is acceptable; document as known TOCTOU and revisit if it bites. |

---

### Task 1: Subscriptions helper library

**Files:**
- Create: `src/lib/subscriptions.ts`

- [ ] **Step 1: Write the helper module**

```typescript
// src/lib/subscriptions.ts
// Server-side helpers for resolving an agency's active plan and gating
// plan-capped operations (listing count, images per tour).
// The service-role Supabase client bypasses RLS — never call from the browser.
import { supabase } from './supabase';
import { getPlan, type PricingPlan } from './pricing';

const DEFAULT_PLAN_ID = 'starter';

export interface ActivePlan {
  plan: PricingPlan;
  subscriptionId: string | null; // null when defaulted (no active row)
  source: 'discount_code' | 'stripe' | null;
}

/**
 * Resolve the active subscription plan for a user. If no active row exists,
 * fall back to the starter plan so existing agencies without a subscription
 * keep working. Admins promote via /admin/subscriptions or discount-code
 * redemption.
 */
export async function getActivePlanForUser(userId: string): Promise<ActivePlan> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, plan_id, source')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to look up subscription: ${error.message}`);
  }
  if (!data) {
    const fallback = getPlan(DEFAULT_PLAN_ID);
    if (!fallback) throw new Error(`Default plan ${DEFAULT_PLAN_ID} not found in PLANS`);
    return { plan: fallback, subscriptionId: null, source: null };
  }
  const plan = getPlan(data.plan_id);
  if (!plan) {
    // Subscription points at a plan that no longer exists. Fall back to default
    // rather than crashing the dashboard; this also surfaces the broken state.
    const fallback = getPlan(DEFAULT_PLAN_ID);
    if (!fallback) throw new Error(`Default plan ${DEFAULT_PLAN_ID} not found in PLANS`);
    return { plan: fallback, subscriptionId: data.id, source: data.source as ActivePlan['source'] };
  }
  return { plan, subscriptionId: data.id, source: data.source as ActivePlan['source'] };
}

/**
 * Count tours that occupy a "slot" against the agency's plan cap.
 * 'active' and 'pending_payment' both count; 'deleted' and 'inactive' do not.
 */
export async function countLiveListings(agencyId: string): Promise<number> {
  const { count, error } = await supabase
    .from('tours')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', agencyId)
    .in('status', ['active', 'pending_payment']);
  if (error) {
    throw new Error(`Failed to count tours: ${error.message}`);
  }
  return count ?? 0;
}

export interface ListingCapState {
  used: number;
  max: number;
  atCap: boolean;
  plan: PricingPlan;
}

export async function getListingCapState(userId: string): Promise<ListingCapState> {
  const [{ plan }, used] = await Promise.all([
    getActivePlanForUser(userId),
    countLiveListings(userId),
  ]);
  return { used, max: plan.maxListings, atCap: used >= plan.maxListings, plan };
}

/**
 * Throws a descriptive Error when the user is at or above their listing cap.
 * Callers translate Error.message into a 403 response.
 */
export async function assertCanCreateListing(userId: string): Promise<void> {
  const state = await getListingCapState(userId);
  if (state.atCap) {
    throw new Error(
      `You have reached your ${state.plan.name} plan limit of ${state.max} active listings. Upgrade your plan to add more.`,
    );
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npx tsc --noEmit 2>&1 | grep "subscriptions.ts" || echo "OK"
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add src/lib/subscriptions.ts
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat: add subscriptions library for plan-aware caps"
```

---

### Task 2: Enforce listing cap on tour creation

**Files:**
- Modify: `src/pages/api/tours/index.ts`

- [ ] **Step 1: Add the cap check in the POST handler**

Open `src/pages/api/tours/index.ts`. Find the POST handler around line 42. Immediately after the role check (line 46) and BEFORE `const body = await context.request.json();` (line 48), add:

Old:
```typescript
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'agency' && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    const body = await context.request.json();
```

New:
```typescript
    const user = await getAuthenticatedUser(context);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    if (user.role !== 'agency' && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

    // Plan-cap gate — admins are exempt so they can create tours for testing
    // and on behalf of agencies during onboarding.
    if (user.role === 'agency') {
      try {
        await assertCanCreateListing(user.id);
      } catch (err: any) {
        return json({ error: err?.message || 'Listing cap reached' }, 403);
      }
    }

    const body = await context.request.json();
```

Also update the imports at the top of the file. The current import block ends with the `slugify` import. Add the new import on a new line:

```typescript
import { slugify } from '../../../lib/utils';
import { assertCanCreateListing } from '../../../lib/subscriptions';
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npx tsc --noEmit 2>&1 | grep "tours/index.ts" || echo "OK"
```

- [ ] **Step 3: Smoke**

In a browser DevTools console while logged in as an agency that's at cap (e.g., default starter, 15 active tours):

```js
fetch('/api/tours', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test', description: 'x', country: 'Greece', city: 'Athens', price: 100, category: 'Cultural' }) })
  .then(r => r.json()).then(console.log);
```

Expected response (under-cap): tour row JSON with `status: 'pending_payment'`.
Expected response (at-cap): `{ error: "You have reached your Starter plan limit of 15 active listings. Upgrade your plan to add more." }` with HTTP 403.

If you don't have 15 tours handy, reduce the cap temporarily by adding a TEST10 discount code that grants the starter plan and lower its `maxListings` in PLANS to 1 — but **do not commit that change**. Or just trust the unit-of-logic and verify the under-cap path works.

- [ ] **Step 4: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/api/tours/index.ts
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(tours): enforce plan listing cap on tour creation"
```

---

### Task 3: Enforce image cap on image upload

**Files:**
- Modify: `src/pages/api/tours/[id]/images.ts`

- [ ] **Step 1: Replace the hard-coded 5-image limit**

Open `src/pages/api/tours/[id]/images.ts`. Around line 31-32, replace the hard-coded `5` with the agency's plan limit. Also update the imports.

Add this import at the top of the file (after the `deleteImage` import on line 4):

```typescript
import { getActivePlanForUser } from '../../../../lib/subscriptions';
```

Then change the cap-check block. Old:

```typescript
    if (!tour) return json({ error: 'Tour not found' }, 404);
    if (tour.agency_id !== user.id) return json({ error: 'Forbidden' }, 403);

    const images = tour.images || [];
    if (images.length >= 5) return json({ error: 'Maximum 5 images allowed per tour' }, 400);
```

New:

```typescript
    if (!tour) return json({ error: 'Tour not found' }, 404);
    if (tour.agency_id !== user.id) return json({ error: 'Forbidden' }, 403);

    const images = tour.images || [];
    const { plan } = await getActivePlanForUser(tour.agency_id);
    if (images.length >= plan.maxImagesPerTour) {
      return json(
        { error: `Your ${plan.name} plan allows ${plan.maxImagesPerTour} image${plan.maxImagesPerTour === 1 ? '' : 's'} per tour. Upgrade your plan to add more.` },
        400,
      );
    }
```

The lookup uses `tour.agency_id` (not `user.id`) so admins uploading on behalf of an agency get the agency's cap, not their own. Admins can still upload because the per-tour cap is the agency's plan, but they aren't double-gated by their own user.

- [ ] **Step 2: Type-check**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npx tsc --noEmit 2>&1 | grep "images.ts" || echo "OK"
```

- [ ] **Step 3: Smoke**

DevTools console as agency, with a tour that has 4 images and plan = starter (cap 5):

```js
// Replace <tour-id> with a real tour id you own
fetch('/api/tours/<tour-id>/images', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com/x.jpg', publicId: 'test/x', altText: 'x' }) })
  .then(r => r.json()).then(console.log);
```

Expected (under cap): the new image row JSON.
Expected (at cap): `{ error: "Your Starter plan allows 5 images per tour. Upgrade your plan to add more." }` with HTTP 400.

- [ ] **Step 4: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add "src/pages/api/tours/[id]/images.ts"
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(tours): enforce plan image cap on image upload"
```

---

### Task 4: Plan-aware image limit text on edit-tour page

**Files:**
- Modify: `src/pages/dashboard/tours/[id]/edit.astro`

- [ ] **Step 1: Read the file to locate the hard-coded "Upload up to 5 images" string**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && grep -n "Upload up to" "src/pages/dashboard/tours/[id]/edit.astro"
```

Note the line number. Then read around it (use the Read tool) to see the surrounding context — the file's frontmatter likely already loads the user and the tour. You'll need to also load the agency's active plan in the frontmatter.

- [ ] **Step 2: Add the plan lookup in the frontmatter**

In the Astro frontmatter block (between the `---` lines at the top of the file), after the existing user / tour fetch, add:

```typescript
import { getActivePlanForUser } from '../../../../lib/subscriptions';

// ... existing user + tour loading ...

const { plan } = await getActivePlanForUser(tour.agency_id);
const maxImages = plan.maxImagesPerTour;
```

(Adjust the relative import path to whatever depth this file is at. The file lives at `src/pages/dashboard/tours/[id]/edit.astro` — that's 4 levels under `src/`, so `../../../../lib/subscriptions` is correct.)

- [ ] **Step 3: Replace the hard-coded "5" with `{maxImages}` in the template**

Find the literal text "Upload up to 5 images" in the template and change it to `Upload up to {maxImages} images`. If there are other places that reference the number 5 in the context of images, update them too. Leave the markup/style identical.

- [ ] **Step 4: Astro check**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npx astro check 2>&1 | grep "edit.astro" || echo "OK"
```

- [ ] **Step 5: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add "src/pages/dashboard/tours/[id]/edit.astro"
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(dashboard): plan-aware image limit text on edit page"
```

---

### Task 5: Dashboard listing-count display

**Files:**
- Modify: `src/pages/dashboard/index.astro`

- [ ] **Step 1: Load the listing-cap state in the frontmatter**

Open `src/pages/dashboard/index.astro`. Add this import to the existing frontmatter imports:

```typescript
import { getListingCapState } from '../../lib/subscriptions';
```

Then, in the frontmatter, after the existing tour count calculations (around line 17-19 per the recon), add:

```typescript
const capState = await getListingCapState(user.id);
const capUsedPercent = Math.min(100, Math.round((capState.used / capState.max) * 100));
```

- [ ] **Step 2: Render a "X / N used" stat card**

Find where the existing "Total Listings" / "Active Listings" stat cards are rendered (look for `totalListings` or `activeListings` in the template). Add a new card alongside them — match the existing card's styling exactly. Insert this block:

```astro
<div class="bg-white rounded-xl border border-gray-200 p-6">
  <div class="flex items-center justify-between mb-2">
    <p class="text-sm font-medium text-gray-500">Plan Usage</p>
    <span class="text-xs font-semibold uppercase tracking-wider text-primary-600">{capState.plan.name}</span>
  </div>
  <p class="text-2xl font-bold text-gray-900">
    {capState.used} <span class="text-base font-normal text-gray-400">/ {capState.max} listings</span>
  </p>
  <div class="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
    <div
      class:list={['h-full transition-all', capState.atCap ? 'bg-red-500' : capUsedPercent >= 80 ? 'bg-amber-500' : 'bg-primary-500']}
      style={`width: ${capUsedPercent}%`}
    ></div>
  </div>
  {capState.atCap && (
    <a href="/dashboard/pricing" class="mt-3 inline-block text-xs font-semibold text-red-600 hover:underline">
      Upgrade to add more listings →
    </a>
  )}
</div>
```

If the existing stats are inside a grid (`grid grid-cols-* gap-*`), make sure the new card is inside the same grid container and the grid columns expand to accommodate it (e.g., from `grid-cols-3` to `grid-cols-4` on `md:` breakpoint). Match the existing visual rhythm.

- [ ] **Step 3: Astro check**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npx astro check 2>&1 | grep "dashboard/index.astro" || echo "OK"
```

- [ ] **Step 4: Smoke**

Visit `/dashboard` as an agency. Confirm the new card shows the plan name, current usage, the bar, and the "Upgrade" link only when at cap.

- [ ] **Step 5: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/dashboard/index.astro
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(dashboard): show plan usage card on agency dashboard"
```

---

### Task 6: Gate the new-tour page when at cap

**Files:**
- Modify: `src/pages/dashboard/tours/new.astro`

- [ ] **Step 1: Load the cap state in frontmatter**

Open `src/pages/dashboard/tours/new.astro`. Add the import:

```typescript
import { getListingCapState } from '../../../lib/subscriptions';
```

Then in the frontmatter (after the existing user check), add:

```typescript
const capState = await getListingCapState(user.id);
```

- [ ] **Step 2: Conditionally render an upgrade CTA instead of the form when at cap**

Wrap the existing form/template content with a conditional. The page currently renders the TourForm directly inside the layout. Change it to:

```astro
<DashboardLayout title="Add Tour">
  {capState.atCap ? (
    <div class="max-w-xl mx-auto bg-white rounded-2xl border border-amber-200 p-8 text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-4">
        <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">You've reached your {capState.plan.name} plan limit</h1>
      <p class="text-gray-600 mb-6">You currently have {capState.used} of {capState.max} listings. Upgrade your plan to add more tours.</p>
      <a href="/dashboard/pricing" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700">
        See plans
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
      </a>
    </div>
  ) : (
    <!-- existing form/template content stays here, indented to fit -->
  )}
</DashboardLayout>
```

Take the existing content that was inside `<DashboardLayout>` and put it where the comment says "existing form/template content stays here". Don't remove or rewrite that content — just wrap it.

- [ ] **Step 3: Astro check**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npx astro check 2>&1 | grep "tours/new.astro" || echo "OK"
```

- [ ] **Step 4: Smoke**

Visit `/dashboard/tours/new` as an agency under cap → form renders. Then either temporarily lower a plan's `maxListings` (DO NOT commit) or seed enough tours to hit cap → page renders the "You've reached your plan limit" card with the See plans button.

- [ ] **Step 5: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/dashboard/tours/new.astro
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(dashboard): gate new-tour page when at plan cap"
```

---

### Task 7: Final verification

- [ ] **Step 1: Production build**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -5
```

Expected: `[build] Complete!`. Investigate any failures specific to the modified files.

- [ ] **Step 2: End-to-end smoke (against dev server)**

In your terminal, start dev: `npm run dev`. Then in a logged-in agency browser session:

1. Visit `/dashboard` → confirm the Plan Usage card appears with `{used} / {max}`.
2. Visit `/dashboard/tours/new` → form renders.
3. Submit a tour via the form (or via the API smoke from Task 2 step 3) → success.
4. Visit `/dashboard/tours/<id>/edit` → confirm the image-limit text says "Upload up to 5 images" (starter default) or whatever the active plan says.
5. As admin, visit `/admin/subscriptions` and reactivate / create a subscription with `plan_id = 'professional'` for that agency (or use the discount-code flow from the earlier feature).
6. Reload the dashboard → Plan Usage card should now read "Professional" with cap of 30.

- [ ] **Step 3: Final no-op commit if everything passes**

If you didn't need to make any code changes during the smoke, there's nothing to commit. If you did, commit it with an appropriately-scoped message.

---

## Out of scope (intentionally — flag if you disagree)

- Making tour creation **free** under a paid plan. Current Stripe pay-per-listing flow is preserved; the cap just gates how many slots an agency can occupy at once. Wiring "plan covers all tours, no per-tour payment" is a separate, larger refactor.
- Auto-creating a starter subscription on signup. Today the fallback is implicit ("no row = starter"). Making it explicit would require a webhook or a trigger and changes nothing user-visible.
- Refunding or auto-deactivating tours when an admin downgrades a heavy user. The dashboard will display "25 / 15" but tours stay live. The agency simply can't add more.
- Race-condition hardening on `assertCanCreateListing`. Two parallel inserts from the same user could both pass the check and exceed the cap by 1. For an admin tool with single-user sessions this is acceptable; revisit if the tour-creation rate ever justifies a Postgres advisory lock or `INSERT … WHERE NOT EXISTS` pattern.
- Per-image storage size limits. Plan caps cover **count**, not file size.
