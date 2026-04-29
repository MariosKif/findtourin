# Remove Pay-Per-Listing Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the per-listing payment feature (one-time Stripe checkout per tour, admin-configurable listing fee, "cost per listing" displays, dead `/api/stripe/checkout` endpoint) so the only purchase path is plan-based subscriptions.

**Architecture:** Pure code/data deletion across 8 files plus a 1-row DB safety update for `tours.status='pending_payment'`. No new abstractions. The plan-checkout (`/api/stripe/checkout-plan`) is the single remaining purchase path; the legacy `/api/stripe/checkout` endpoint and `lib/stripe.ts:createCheckoutSession()` are removed entirely. Display labels of the form "€X.XX per listing" are removed from the marketing and dashboard pricing pages because they imply a per-listing pricing model that no longer exists.

**Tech Stack:** Astro 6 SSR, Supabase Postgres (service role via `src/lib/supabase.ts` Proxy), Tailwind, Stripe SDK.

**Discovery already done:**
- `pending_payment` tours in production: **0** (verified 2026-04-29 via service role)
- `lib/stripe.ts:createCheckoutSession()` has zero callers (legacy)
- `/api/stripe/checkout` is only POSTed to from `ListingsTable.astro` for `pending_payment` rows, which don't exist
- Plan checkout uses `/api/stripe/checkout-plan` (different file, stays)

---

## File Map

| File | Change |
|---|---|
| `src/lib/stripe.ts` | Delete `getListingFeeCents`, `createCheckoutSession`. Keep `stripe` client + `verifyWebhookSignature`. |
| `src/lib/pricing.ts` | Delete `getCostPerListing` helper. |
| `src/components/dashboard/ListingsTable.astro` | Remove `pending_payment` "Pay" button branch. |
| `src/pages/api/stripe/checkout.ts` | Delete the file (legacy duplicate of checkout-plan). |
| `src/pages/admin/settings.astro` | Remove "Tour listing fee" form field + helper text + form-submit value. |
| `src/pages/api/admin/config.ts` | Remove `listing_fee_cents` from default config. |
| `src/pages/pricing.astro` | Remove `getCostPerListing` import + usages, `.cost-per-listing-*` spans, and the JS toggle that hides them. |
| `src/pages/dashboard/pricing.astro` | Same as `src/pages/pricing.astro`. |
| `src/pages/dashboard/subscription.astro` | Replace "pay per listing to publish" copy with plan-based copy. |
| `memory/project_pricing.md` | Update memory body to reflect plan-only pricing (no per-listing). |
| Production DB | One-time UPDATE: any `tours.status='pending_payment'` → `status='draft'` (currently 0 rows; safety net for any that arrive between writing the plan and shipping). |

---

## Task 1: Remove dead per-listing helpers from stripe.ts

**Files:**
- Modify: `src/lib/stripe.ts`

- [ ] **Step 1: Edit `src/lib/stripe.ts` — replace full contents with:**

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '', {
  // Pinned API version — the value is intentionally older than the Stripe SDK's
  // current LatestApiVersion type, so cast to keep TS happy without changing
  // the wire version (response shapes stay stable).
  apiVersion: '2025-01-27.acacia' as Stripe.StripeConfig['apiVersion'],
});

export async function verifyWebhookSignature(body: string, signature: string) {
  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';
  return stripe.webhooks.constructEvent(body, signature, secret);
}
```

This removes `getListingFeeCents` (the only reader of `config.listing_fee_cents`) and `createCheckoutSession` (the per-listing one-time checkout). The `supabase` import is also no longer needed in this file — drop it.

- [ ] **Step 2: Run typecheck**

Run: `npm run build`
Expected: `[build] Complete!` with no TS errors. Build must succeed; if any file still imports `createCheckoutSession` or `getListingFeeCents`, this step fails — go fix those imports before moving on.

- [ ] **Step 3: Commit**

```bash
git add src/lib/stripe.ts
git commit -m "refactor(stripe): drop per-listing checkout helpers (feature removed)"
```

---

## Task 2: Delete the legacy `/api/stripe/checkout` endpoint

**Files:**
- Delete: `src/pages/api/stripe/checkout.ts`

This endpoint is a near-duplicate of `/api/stripe/checkout-plan.ts`. The pricing page form posts to `/api/stripe/checkout-plan`; only the dead `pending_payment` "Pay" button in `ListingsTable.astro` posts to `/api/stripe/checkout`, and that branch is being removed in Task 3.

- [ ] **Step 1: Delete the file**

```bash
git rm src/pages/api/stripe/checkout.ts
```

- [ ] **Step 2: Run typecheck**

Run: `npm run build`
Expected: `[build] Complete!`. If anything still imports from `../stripe/checkout`, fix it (most likely the upcoming Task 3 file).

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(stripe): remove legacy /api/stripe/checkout endpoint"
```

---

## Task 3: Remove `pending_payment` "Pay" button from ListingsTable

**Files:**
- Modify: `src/components/dashboard/ListingsTable.astro:84-89`

- [ ] **Step 1: Edit `src/components/dashboard/ListingsTable.astro`**

Remove this block (lines 84–89):

```astro
                {tour.status === 'pending_payment' && (
                  <form method="POST" action="/api/stripe/checkout">
                    <input type="hidden" name="tourId" value={tour.id} />
                    <Button type="submit" variant="primary" size="sm">Pay</Button>
                  </form>
                )}
```

The remaining sibling buttons (Edit, Delete) stay unchanged — the surrounding `<div class="flex items-center justify-end gap-2">` keeps them aligned.

- [ ] **Step 2: Run typecheck**

Run: `npm run build`
Expected: `[build] Complete!`. No references to `/api/stripe/checkout` should remain anywhere.

Verification:

```bash
grep -rn "/api/stripe/checkout[^-]" src/ --include="*.astro" --include="*.ts"
```

Expected: no output (only matches should be for `/api/stripe/checkout-plan`).

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ListingsTable.astro
git commit -m "refactor(dashboard): remove dead pending_payment Pay button"
```

---

## Task 4: Remove `listing_fee_cents` from admin settings

**Files:**
- Modify: `src/pages/admin/settings.astro`
- Modify: `src/pages/api/admin/config.ts`

- [ ] **Step 1: Edit `src/pages/admin/settings.astro`**

In the `---` frontmatter block, change the type cast and remove the `listingFeeCents` constant:

```astro
const value = ((config as any)?.value || {}) as { support_email?: string; maintenance_mode?: boolean };
const supportEmail = value.support_email ?? 'support@findtoursin.com';
const maintenanceMode = value.maintenance_mode ?? false;
```

In the form, delete the entire `<div>` containing the `listing_fee_cents` input (lines 20–24 of the original file):

```astro
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Tour listing fee (cents)</label>
      <input name="listing_fee_cents" type="number" min="0" value={listingFeeCents} class="w-full border border-gray-300 rounded-lg px-3 py-2" />
      <p class="mt-1 text-xs text-gray-500">Charged once per tour listing via Stripe Checkout. Currently used by `src/lib/stripe.ts`.</p>
    </div>
```

In the `<script>` block, in the form-submit handler, change the `value` payload to drop `listing_fee_cents`:

```typescript
    const value = {
      support_email: String(fd.get('support_email') || ''),
      maintenance_mode: fd.get('maintenance_mode') === 'on',
    };
```

- [ ] **Step 2: Edit `src/pages/api/admin/config.ts:16`**

Change the default config to drop `listing_fee_cents`:

```typescript
  return json(data || { key: 'pricing', value: { support_email: 'support@findtoursin.com', maintenance_mode: false } });
```

- [ ] **Step 3: Run typecheck**

Run: `npm run build`
Expected: `[build] Complete!`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/settings.astro src/pages/api/admin/config.ts
git commit -m "refactor(admin): drop listing fee from admin settings + config defaults"
```

---

## Task 5: Remove `getCostPerListing` from pricing lib

**Files:**
- Modify: `src/lib/pricing.ts:97-100`

- [ ] **Step 1: Edit `src/lib/pricing.ts`**

Delete lines 97–100:

```typescript
export function getCostPerListing(plan: PricingPlan, period: BillingPeriod): number {
  const monthly = getMonthlyEquivalentCents(plan, period);
  return Math.round(monthly / plan.maxListings);
}
```

- [ ] **Step 2: Run typecheck — this WILL fail**

Run: `npm run build`
Expected: build fails with two errors — `getCostPerListing` not exported, referenced from `src/pages/pricing.astro` and `src/pages/dashboard/pricing.astro`. Those are fixed in Task 6. Do not commit yet.

---

## Task 6: Remove "€X per listing" displays from both pricing pages

**Files:**
- Modify: `src/pages/pricing.astro`
- Modify: `src/pages/dashboard/pricing.astro`

- [ ] **Step 1: Edit `src/pages/pricing.astro`**

Change the import (line 3):

```astro
import { PLANS, formatCents, getAnnualSavingsCents, getMonthlyEquivalentCents } from '../lib/pricing';
```

In the plan-card map (lines 78–79), remove these two lines:

```astro
        const costPerListingMonthly = getCostPerListing(plan, 'monthly');
        const costPerListingAnnual = getCostPerListing(plan, 'annual');
```

Remove the entire "Cost per listing" `<div>` (lines 120–127 of the original):

```astro
            <div class="mt-2 mb-2">
              <span class="cost-per-listing-monthly text-sm font-medium text-primary-600">
                &euro;{formatCents(costPerListingMonthly)} per listing
              </span>
              <span class="cost-per-listing-annual hidden text-sm font-medium text-primary-600">
                &euro;{formatCents(costPerListingAnnual)} per listing
              </span>
            </div>
```

In the `<script>` block, remove the two cost-per-listing toggle lines:

```typescript
    document.querySelectorAll('.cost-per-listing-monthly').forEach(el => el.classList.toggle('hidden', isAnnual));
    document.querySelectorAll('.cost-per-listing-annual').forEach(el => el.classList.toggle('hidden', !isAnnual));
```

- [ ] **Step 2: Edit `src/pages/dashboard/pricing.astro`**

Apply the same three edits in this file:
- Drop `getCostPerListing` from the import on line 4.
- Remove the `costPerListingMonthly` / `costPerListingAnnual` derivations (lines 53–54).
- Remove the "Cost per listing" `<div>` (lines 99–107 of the original — the comment + both spans + wrapper).
- Remove the two `.cost-per-listing-*` toggle lines from the `<script>` (lines 316–318 of the original — the comment + both forEach calls).

- [ ] **Step 3: Run typecheck**

Run: `npm run build`
Expected: `[build] Complete!`.

Verification — should be no remaining hits:

```bash
grep -rn "cost-per-listing\|getCostPerListing\|per listing" src/ --include="*.astro" --include="*.ts"
```

Expected: no `cost-per-listing` matches, no `getCostPerListing` matches. (`per listing` may still match in `dashboard/subscription.astro` — fixed in Task 7.)

- [ ] **Step 4: Commit (rolls Task 5 + Task 6 together since they must land atomically)**

```bash
git add src/lib/pricing.ts src/pages/pricing.astro src/pages/dashboard/pricing.astro
git commit -m "refactor(pricing): remove cost-per-listing helper and display"
```

---

## Task 7: Replace "pay per listing to publish" copy in dashboard subscription

**Files:**
- Modify: `src/pages/dashboard/subscription.astro:68`

- [ ] **Step 1: Edit `src/pages/dashboard/subscription.astro:68`**

Change:

```astro
                <span class="text-sm font-medium text-gray-500">No active listings — pay per listing to publish</span>
```

To:

```astro
                <span class="text-sm font-medium text-gray-500">No active subscription — choose a plan to publish</span>
```

The line at `:110` (`Up to {activePlan?.plan?.maxImagesPerTour ?? '—'} photos per listing`) stays — "photos per listing" is a per-tour cap label, not a pricing claim.

- [ ] **Step 2: Run typecheck**

Run: `npm run build`
Expected: `[build] Complete!`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/dashboard/subscription.astro
git commit -m "refactor(dashboard): drop pay-per-listing copy from subscription page"
```

---

## Task 8: DB safety — clear any `pending_payment` tours

**Why:** With the Pay button gone, a tour stuck in `pending_payment` would have no path to publish. Currently 0 such rows exist (verified 2026-04-29), but a small race could land one between writing the plan and the deploy.

- [ ] **Step 1: Create the cleanup script**

Create `scripts/_clear-pending-payment.mjs`:

```javascript
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const { data, error } = await admin.from('tours').update({ status: 'draft' }).eq('status', 'pending_payment').select('id, name');
if (error) { console.error('update error:', error.message); process.exit(1); }
console.log(`reset ${data?.length || 0} tours from pending_payment to draft`);
for (const t of data || []) console.log(`  - ${t.id} ${t.name}`);
```

- [ ] **Step 2: Run the script (one-shot, against production)**

```bash
node scripts/_clear-pending-payment.mjs
```

Expected: `reset 0 tours from pending_payment to draft` (or a small N if any landed since plan-time). If N > 0, verify the affected tours read sensibly as drafts; the agency owners can edit and re-list under their plan.

- [ ] **Step 3: Delete the one-shot script — it has no recurring use**

```bash
rm scripts/_clear-pending-payment.mjs
```

This task does not produce a commit (script never enters the tree).

---

## Task 9: Update auto-memory `project_pricing.md`

**Files:**
- Modify: `/Users/marios/.claude/projects/-Users-marios-Desktop-Cursor-worldoftours/memory/project_pricing.md`

The current memory line in `MEMORY.md` reads:

> Pricing model — €3.99/listing/month + VAT, volume discounts (10%/15%/20%/25%), annual 10% extra discount

That description is now wrong: there is no per-listing pricing.

- [ ] **Step 1: Read the existing memory file**

Run: `cat /Users/marios/.claude/projects/-Users-marios-Desktop-Cursor-worldoftours/memory/project_pricing.md`

This shows the current frontmatter and body so you can preserve the file shape.

- [ ] **Step 2: Replace the file body**

Write to `/Users/marios/.claude/projects/-Users-marios-Desktop-Cursor-worldoftours/memory/project_pricing.md`:

```markdown
---
name: Pricing model
description: FindToursIn pricing — plan-based subscriptions only, no per-listing payment
type: project
---

Pricing is plan-based. Four tiers (Starter / Professional / Enterprise / Ultimate) defined in `src/lib/pricing.ts`, each with `monthlyPriceCents`, `annualPriceCents` (≈15% annual saving baked in), `maxListings`, and `maxImagesPerTour=10` for all plans. Plan checkout goes through `/api/stripe/checkout-plan`; the per-listing payment flow (one-time Stripe checkout per tour, admin-configurable listing fee) was removed on 2026-04-29.

**Why:** The original model was €3.99/listing/month with volume tiers; it was replaced with subscription plans, and the legacy per-listing code (helpers, admin field, "€X per listing" labels, dead Pay button) was deleted on 2026-04-29 to stop confusing users.

**How to apply:** When discussing pricing or writing checkout code, treat subscription plans as the only purchase path. Do not reintroduce per-listing fees, "cost per listing" displays, or `listing_fee_cents` config. Discount codes (separate system, `discount_codes` table) can grant a plan free for a configured duration.
```

- [ ] **Step 3: Update `MEMORY.md` index entry**

Edit `/Users/marios/.claude/projects/-Users-marios-Desktop-Cursor-worldoftours/memory/MEMORY.md`. Replace the existing pricing line:

```
- [Pricing model](project_pricing.md) — €3.99/listing/month + VAT, volume discounts (10%/15%/20%/25%), annual 10% extra discount
```

With:

```
- [Pricing model](project_pricing.md) — plan-only subscriptions (Starter/Professional/Enterprise/Ultimate); per-listing payment removed 2026-04-29
```

This task does not produce a git commit (memory lives outside the repo).

---

## Task 10: Push and smoke

- [ ] **Step 1: Push the local commits to origin**

```bash
git push 'https://MariosKif:${GH_PAT}@github.com/MariosKif/findtourin.git' main
```

Where `${GH_PAT}` is the GitHub PAT used in this session. Expected output ends with `... main -> main`.

- [ ] **Step 2: Wait ~90s for Vercel to redeploy, then smoke**

Create `scripts/_smoke-pricing.mjs`:

```javascript
import { chromium } from 'playwright';
const SITE = 'https://www.findtoursin.com';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const probes = [
  { url: '/pricing', mustNotInclude: ['per listing', 'cost-per-listing'] },
  { url: '/auth/register', mustInclude: ['Create Account'] },
];

let pass = 0, fail = 0;
for (const p of probes) {
  const r = await page.goto(`${SITE}${p.url}`, { waitUntil: 'domcontentloaded' });
  const html = await page.content();
  const status = r?.status();
  const ok = status === 200
    && (p.mustNotInclude || []).every(s => !html.toLowerCase().includes(s.toLowerCase()))
    && (p.mustInclude || []).every(s => html.includes(s));
  console.log(ok ? '✅' : '❌', p.url, `status=${status}`);
  ok ? pass++ : fail++;
}
console.log(`pass=${pass} fail=${fail}`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
```

Run: `node scripts/_smoke-pricing.mjs`
Expected: both `✅`, exit 0. The `/pricing` probe asserts the page no longer renders any "per listing" copy or `cost-per-listing` CSS classes.

- [ ] **Step 3: Delete the one-shot smoke script**

```bash
rm scripts/_smoke-pricing.mjs
```

This task does not produce a commit.

---

## Self-Review

**Spec coverage:** "Delete pay-per-listing from everywhere" ⇒
- Stripe per-listing checkout helper deleted (Task 1) ✅
- Legacy `/api/stripe/checkout` endpoint deleted (Task 2) ✅
- Dashboard `pending_payment` Pay button deleted (Task 3) ✅
- Admin listing-fee field + config default deleted (Task 4) ✅
- `getCostPerListing` helper deleted (Task 5) ✅
- "€X per listing" labels deleted from both pricing pages (Task 6) ✅
- "pay per listing to publish" copy fixed (Task 7) ✅
- DB safety net for stranded `pending_payment` rows (Task 8) ✅
- Memory updated to reflect new pricing reality (Task 9) ✅
- Push + smoke verifies it on production (Task 10) ✅

**Placeholder scan:** No "TBD", "implement later", "add error handling", or "similar to Task N" placeholders. Every step has the actual code or command.

**Type/name consistency:** All files referenced match their actual paths (`src/lib/stripe.ts`, `src/lib/pricing.ts`, etc). Function names referenced (`getListingFeeCents`, `createCheckoutSession`, `getCostPerListing`) match what exists today. The replacement copy in Task 7 is internally consistent with the plan-only stance described in the memory update.
