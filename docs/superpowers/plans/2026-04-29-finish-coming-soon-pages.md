# Finish "Coming Soon" Pages + Latent-Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Replace every stub / "Coming Soon" page on findtoursin.com with a fully functional implementation, fix the two latent bugs from prior reviews (subscription page reads hardcoded data; Stripe webhook 400s on agency-plan checkouts), and wire the public `/pricing` Get Started CTA into a real Stripe upgrade flow. Verify each task with Playwright before moving on.

**Architecture:** Most "Coming Soon" pages are admin reporting surfaces — analytics, revenue, payments, settings. They become real Supabase queries rendered into existing-style dashboard cards/tables, all read-only with no schema changes. Two functional gaps require code: the dashboard subscription card must read `subscriptions.plan_id` for the live user, and the Stripe webhook must accept agency-plan completions and write a `subscriptions` row with `source='stripe'`. The public `/pricing` page's Get Started button gets a small server endpoint that signs the user in (or registers them) then redirects to Stripe checkout in subscription mode.

**Tech Stack:** Astro 6 SSR + Supabase (service role) + Stripe + Playwright for verification. No test framework — verify each task with `npm run build`, the dev server, and Playwright smoke from `/tmp/smoke-*.mjs` files we add per task.

## Verified findings — what's broken or missing

| # | Symptom | File | Status |
|---|---|---|---|
| 1 | "Admin settings coming soon" 14-line stub | `src/pages/admin/settings.astro` | Empty stub |
| 2 | "Analytics dashboard coming soon" 14-line stub | `src/pages/admin/analytics.astro` | Empty stub |
| 3 | "Revenue analytics coming soon" 14-line stub | `src/pages/admin/revenue.astro` | Empty stub |
| 4 | Payments page only shows count, no table | `src/pages/admin/payments.astro` | Partial |
| 5 | Admin index has a "Blog Management" tab that's a "coming soon" placeholder | `src/pages/admin/index.astro:359-369` | Partial |
| 6 | Dashboard subscription card hardcoded "FindToursIn Agency" | `src/pages/dashboard/subscription.astro:45` | Bug — ignores `subscriptions` table |
| 7 | Stripe webhook 400s on `checkout.session.completed` events that lack `metadata.tourId` (i.e., agency-plan checkouts) | `src/pages/api/stripe/webhook.ts:32-36` | Bug — agency-plan completions never persist |
| 8 | Public `/pricing` Get Started → `/auth/register?plan=…` but `?plan` is ignored by register and no Stripe checkout flow exists | `src/pages/pricing.astro:150` + `src/pages/api/auth/register.ts` | Missing flow |

## Decisions captured

| Question | Decision |
|---|---|
| Admin analytics scope | Site-wide totals + 30-day trend on tours, users, payments, blog views (if available). No real-time charting library — render with a simple SVG sparkline component or a static Tailwind bar list. |
| Admin revenue scope | Total revenue from `payments` (status='completed'), 30/90/all-time windows, breakdown by plan_id from active subscriptions. No forecasting. |
| Admin settings scope | Read + edit a single `config` table row keyed by `pricing` (it already exists per `scripts/setup-db.mjs` references): listing fee in cents, support email, maintenance toggle. Other fields TBD by usage. |
| Admin payments table | Real table with agency name, tour name, amount, currency, status, date. Admin can mark a payment as refunded via PATCH (admin-only, future Stripe refund API integration is out of scope). |
| Admin blog management | A list view of all `src/content/blog/*.mdx` posts with title, date, tags, draft toggle (read-only initially — content is in MDX files, not DB). Just exposes the existing files; full CMS is out of scope. |
| Subscription card real data | Read `getActivePlanForUser(user.id)`. Show plan name, source ('discount_code'/'stripe'), expires_at, and the same info the existing template shows. |
| Stripe webhook plan path | When `metadata.agencyId` is present and `metadata.tourId` is absent, treat as a plan checkout: insert a `subscriptions` row with `source='stripe'`, deactivate any prior active sub for that user, and use `stripe.subscriptions.retrieve` to compute `expires_at` if the session was a recurring sub. For one-time payments fall back to `null` expiry. |
| Public /pricing flow | Get Started button → POST `/api/stripe/checkout-plan` (new endpoint). If user is already authenticated as agency, server creates a Stripe Checkout Session in `mode: 'subscription'` for the requested plan and redirects. If unauthenticated, redirect to `/auth/login?redirect=/pricing&plan=X` with the plan baked in for post-login resume. |
| Playwright smoke | Each task has a small `.mjs` file in `/tmp/smoke-*.mjs` that exercises the new surface against a local dev server. We do NOT commit these — they're throwaway verification scripts. The task is "done" when Playwright reports zero failures. |

---

### Task 1: Fix the dashboard subscription card to read real data

**Files:**
- Modify: `src/pages/dashboard/subscription.astro`

**Why first:** It's the smallest and unblocks visual sanity — agencies will see their actual plan after this lands.

- [ ] **Step 1: Read the existing file**

Use the Read tool. Note the existing structure (header, plan card, billing-history link, etc.) and where line 45's hardcoded "FindToursIn Agency" lives.

- [ ] **Step 2: Add the active-plan lookup in the frontmatter**

Add `import { getActivePlanForUser } from '../../lib/subscriptions';` to the frontmatter imports.

After the existing `payments` query, add:

```typescript
const activePlan = user.role === 'agency' ? await getActivePlanForUser(user.id) : null;
```

- [ ] **Step 3: Replace the hardcoded plan name + features**

Find the line `<h3 class="text-2xl font-bold text-gray-900">FindToursIn Agency</h3>` (line ~45). Replace with:

```astro
        <h3 class="text-2xl font-bold text-gray-900">{activePlan?.plan?.name || 'No active plan'}</h3>
        {activePlan && (
          <p class="text-sm text-gray-500 mt-1">
            {activePlan.source === 'discount_code' ? 'Granted via code' : activePlan.source === 'stripe' ? 'Active Stripe subscription' : 'Default tier'}
            {activePlan.subscriptionId ? '' : ' (no active subscription row — falling back to starter)'}
          </p>
        )}
```

If the existing template renders specific `maxListings` / `maxImagesPerTour` from a hardcoded structure, replace those references with `activePlan?.plan?.maxListings` and `activePlan?.plan?.maxImagesPerTour` (with `?? 0` fallback for non-agency users).

If the existing template has a "renew/upgrade" button that hardcodes a price, change it to read from `activePlan?.plan?.monthlyPriceCents` formatted via `formatCents` (already imported elsewhere in the project — see `src/lib/pricing.ts`).

- [ ] **Step 4: Build + smoke**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
```

Then a Playwright check (run from project root after `npm install --no-save playwright`):

```bash
cat > /tmp/smoke-task-1.mjs <<'EOF'
import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext();
const page = await ctx.newPage();
// We can't drive auth without creds; just confirm the page compiles + redirects to login when unauthed
const r = await ctx.request.get('http://localhost:4321/dashboard/subscription', { maxRedirects: 0 });
console.log('unauth status:', r.status(), '— expected 302');
await b.close();
EOF
npm run dev > /tmp/dev-task-1.log 2>&1 & DEVPID=$!
sleep 7
node /tmp/smoke-task-1.mjs
kill $DEVPID 2>/dev/null
```

Expected: `unauth status: 302 — expected 302`. Authenticated rendering verified visually by the controller after deploy.

- [ ] **Step 5: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/dashboard/subscription.astro
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "fix(dashboard/subscription): show real active plan from subscriptions table"
```

---

### Task 2: Admin payments page with real table

**Files:**
- Modify: `src/pages/admin/payments.astro`

- [ ] **Step 1: Replace the file**

Overwrite `src/pages/admin/payments.astro` with:

```astro
---
export const prerender = false;
import DashboardLayout from '../../layouts/DashboardLayout.astro';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/utils';

const user = Astro.locals.user;
if (!user || user.role !== 'admin') return Astro.redirect('/');

const { data: paymentsData } = await supabase
  .from('payments')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(200);

const payments = paymentsData || [];

const agencyIds = [...new Set(payments.map(p => p.agency_id).filter(Boolean))];
const tourIds = [...new Set(payments.map(p => p.tour_id).filter(Boolean))];

const agencyMap = new Map<string, { name: string; email: string }>();
const tourMap = new Map<string, { name: string }>();

if (agencyIds.length > 0) {
  const { data: users } = await supabase.from('users').select('id, name, email, company_name').in('id', agencyIds);
  (users || []).forEach(u => agencyMap.set(u.id, { name: u.company_name || u.name || '—', email: u.email }));
}
if (tourIds.length > 0) {
  const { data: tours } = await supabase.from('tours').select('id, name').in('id', tourIds);
  (tours || []).forEach(t => tourMap.set(t.id, { name: t.name }));
}

const totalRevenueCents = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
const completedCount = payments.filter(p => p.status === 'completed').length;
const pendingCount = payments.filter(p => p.status === 'pending').length;
const failedCount = payments.filter(p => p.status === 'failed').length;

const statusVariant: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};
---

<DashboardLayout title="Payments">
  <h1 class="text-xl font-semibold text-gray-900 mb-6">Payments</h1>

  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-sm text-gray-500">Total revenue</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">€{(totalRevenueCents / 100).toFixed(2)}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-sm text-gray-500">Completed</p>
      <p class="text-2xl font-bold text-green-700 mt-1">{completedCount}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-sm text-gray-500">Pending</p>
      <p class="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-sm text-gray-500">Failed</p>
      <p class="text-2xl font-bold text-red-700 mt-1">{failedCount}</p>
    </div>
  </div>

  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Agency</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Tour</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Date</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {payments.map((p) => {
            const a = agencyMap.get(p.agency_id);
            const t = tourMap.get(p.tour_id);
            return (
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <p class="text-gray-900">{a?.name || '—'}</p>
                  <p class="text-gray-400 text-xs">{a?.email}</p>
                </td>
                <td class="px-4 py-3 text-gray-700">{t?.name || '—'}</td>
                <td class="px-4 py-3 text-gray-900 font-medium">{formatPrice((p.amount || 0) / 100, p.currency || 'eur')}</td>
                <td class="px-4 py-3">
                  <span class:list={['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', statusVariant[p.status] || 'bg-gray-100 text-gray-600']}>
                    {p.status}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            );
          })}
          {payments.length === 0 && (
            <tr><td colspan="5" class="px-4 py-12 text-center text-gray-400">No payments yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</DashboardLayout>
```

- [ ] **Step 2: Build + smoke**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
```

- [ ] **Step 3: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/admin/payments.astro
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(admin/payments): real payments table with stats and agency/tour joins"
```

---

### Task 3: Admin revenue page

**Files:**
- Modify: `src/pages/admin/revenue.astro`

- [ ] **Step 1: Replace the file**

Overwrite with:

```astro
---
export const prerender = false;
import DashboardLayout from '../../layouts/DashboardLayout.astro';
import { supabase } from '../../lib/supabase';

const user = Astro.locals.user;
if (!user || user.role !== 'admin') return Astro.redirect('/');

const now = new Date();
const day30 = new Date(now.getTime() - 30 * 86400 * 1000).toISOString();
const day90 = new Date(now.getTime() - 90 * 86400 * 1000).toISOString();

const { data: completed } = await supabase
  .from('payments')
  .select('amount, currency, created_at')
  .eq('status', 'completed')
  .order('created_at', { ascending: false });

const all = completed || [];
const sum = (rows: typeof all) => rows.reduce((s, r) => s + (r.amount || 0), 0);
const totalAll = sum(all);
const total30 = sum(all.filter(r => r.created_at >= day30));
const total90 = sum(all.filter(r => r.created_at >= day90));

// Subscriptions breakdown
const { data: subs } = await supabase
  .from('subscriptions')
  .select('plan_id, source, is_active');
const activeSubs = (subs || []).filter(s => s.is_active);
const planCount: Record<string, number> = {};
activeSubs.forEach(s => { planCount[s.plan_id] = (planCount[s.plan_id] || 0) + 1; });
const sourceCount: Record<string, number> = {};
activeSubs.forEach(s => { sourceCount[s.source] = (sourceCount[s.source] || 0) + 1; });

// Daily revenue for last 30 days
const buckets: Record<string, number> = {};
for (let i = 29; i >= 0; i--) {
  const d = new Date(now.getTime() - i * 86400 * 1000);
  buckets[d.toISOString().slice(0, 10)] = 0;
}
all.filter(r => r.created_at >= day30).forEach(r => {
  const k = r.created_at.slice(0, 10);
  if (k in buckets) buckets[k] += r.amount || 0;
});
const maxDaily = Math.max(1, ...Object.values(buckets));
---

<DashboardLayout title="Revenue">
  <h1 class="text-xl font-semibold text-gray-900 mb-6">Revenue</h1>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <p class="text-sm text-gray-500">Last 30 days</p>
      <p class="text-3xl font-bold text-gray-900 mt-2">€{(total30 / 100).toFixed(2)}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <p class="text-sm text-gray-500">Last 90 days</p>
      <p class="text-3xl font-bold text-gray-900 mt-2">€{(total90 / 100).toFixed(2)}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <p class="text-sm text-gray-500">All time</p>
      <p class="text-3xl font-bold text-gray-900 mt-2">€{(totalAll / 100).toFixed(2)}</p>
    </div>
  </div>

  <div class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Daily revenue (last 30 days)</h2>
    <div class="flex items-end gap-1 h-32">
      {Object.entries(buckets).map(([day, cents]) => (
        <div class="flex-1 flex flex-col items-center justify-end">
          <div
            class:list={['w-full rounded-t', cents > 0 ? 'bg-primary-500' : 'bg-gray-100']}
            style={`height: ${Math.max(2, (cents / maxDaily) * 100)}%`}
            title={`${day}: €${(cents / 100).toFixed(2)}`}
          ></div>
        </div>
      ))}
    </div>
    <div class="flex justify-between mt-2 text-xs text-gray-400">
      <span>{Object.keys(buckets)[0]}</span>
      <span>{Object.keys(buckets).slice(-1)[0]}</span>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Active subscriptions by plan</h2>
      {Object.keys(planCount).length === 0 ? (
        <p class="text-sm text-gray-400">No active subscriptions.</p>
      ) : (
        <ul class="space-y-2 text-sm">
          {Object.entries(planCount).sort((a,b) => b[1] - a[1]).map(([plan, n]) => (
            <li class="flex items-center justify-between">
              <span class="capitalize text-gray-700">{plan}</span>
              <span class="font-semibold text-gray-900">{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Active subscriptions by source</h2>
      {Object.keys(sourceCount).length === 0 ? (
        <p class="text-sm text-gray-400">No active subscriptions.</p>
      ) : (
        <ul class="space-y-2 text-sm">
          {Object.entries(sourceCount).sort((a,b) => b[1] - a[1]).map(([src, n]) => (
            <li class="flex items-center justify-between">
              <span class="text-gray-700">{src}</span>
              <span class="font-semibold text-gray-900">{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
</DashboardLayout>
```

- [ ] **Step 2: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/admin/revenue.astro
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(admin/revenue): real revenue dashboard with 30-day chart and subscription breakdown"
```

---

### Task 4: Admin analytics page

**Files:**
- Modify: `src/pages/admin/analytics.astro`

- [ ] **Step 1: Replace the file**

Overwrite with:

```astro
---
export const prerender = false;
import DashboardLayout from '../../layouts/DashboardLayout.astro';
import { supabase } from '../../lib/supabase';

const user = Astro.locals.user;
if (!user || user.role !== 'admin') return Astro.redirect('/');

const now = new Date();
const day30 = new Date(now.getTime() - 30 * 86400 * 1000).toISOString();

const [usersResp, toursResp, paymentsResp, codesResp, subsResp, favsResp] = await Promise.all([
  supabase.from('users').select('id, role, created_at'),
  supabase.from('tours').select('id, status, view_count, created_at, agency_id, country, category, name, slug'),
  supabase.from('payments').select('id, status, created_at'),
  supabase.from('discount_codes').select('id, current_redemptions'),
  supabase.from('subscriptions').select('id, is_active'),
  supabase.from('favourites').select('id, tour_id'),
]);

const users = usersResp.data || [];
const tours = toursResp.data || [];
const payments = paymentsResp.data || [];
const codes = codesResp.data || [];
const subs = subsResp.data || [];
const favs = favsResp.data || [];

const agencyCount = users.filter(u => u.role === 'agency').length;
const userCount = users.filter(u => u.role === 'user').length;
const adminCount = users.filter(u => u.role === 'admin').length;
const last30Users = users.filter(u => u.created_at >= day30).length;

const activeTours = tours.filter(t => t.status === 'active').length;
const pendingTours = tours.filter(t => t.status === 'pending_payment').length;
const last30Tours = tours.filter(t => t.created_at >= day30).length;

const totalViews = tours.reduce((s, t) => s + (t.view_count || 0), 0);
const topTours = [...tours].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 10);

const favCounts: Record<string, number> = {};
favs.forEach(f => { if (f.tour_id) favCounts[f.tour_id] = (favCounts[f.tour_id] || 0) + 1; });
const topFavTours = [...tours]
  .map(t => ({ ...t, favs: favCounts[t.id] || 0 }))
  .sort((a, b) => b.favs - a.favs)
  .slice(0, 5);

const codeRedemptions = codes.reduce((s, c) => s + (c.current_redemptions || 0), 0);
const activeSubs = subs.filter(s => s.is_active).length;

const countryCount: Record<string, number> = {};
tours.forEach(t => { if (t.country) countryCount[t.country] = (countryCount[t.country] || 0) + 1; });
const topCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

const categoryCount: Record<string, number> = {};
tours.forEach(t => { if (t.category) categoryCount[t.category] = (categoryCount[t.category] || 0) + 1; });
const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
---

<DashboardLayout title="Analytics">
  <h1 class="text-xl font-semibold text-gray-900 mb-6">Analytics</h1>

  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-sm text-gray-500">Agencies</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{agencyCount}</p>
      <p class="text-xs text-gray-400 mt-1">{userCount} users · {adminCount} admins</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-sm text-gray-500">Active tours</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{activeTours}</p>
      <p class="text-xs text-gray-400 mt-1">{pendingTours} pending</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-sm text-gray-500">Active subscriptions</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{activeSubs}</p>
      <p class="text-xs text-gray-400 mt-1">{codeRedemptions} code redemptions</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-sm text-gray-500">Total views</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{totalViews.toLocaleString()}</p>
      <p class="text-xs text-gray-400 mt-1">{favs.length} favourites</p>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-sm text-gray-500">New in last 30 days</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{last30Tours} tours · {last30Users} users</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-sm text-gray-500">Payments</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{payments.length} total</p>
      <p class="text-xs text-gray-400 mt-1">{payments.filter(p => p.status === 'completed').length} completed</p>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Top tours by views</h2>
      <ul class="space-y-2 text-sm">
        {topTours.map((t) => (
          <li class="flex items-center justify-between gap-3">
            <a href={`/tours/${t.slug}`} class="text-gray-700 hover:text-primary-600 truncate">{t.name}</a>
            <span class="font-semibold text-gray-900 shrink-0">{(t.view_count || 0).toLocaleString()}</span>
          </li>
        ))}
        {topTours.length === 0 && <li class="text-gray-400">No tours yet.</li>}
      </ul>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Top tours by favourites</h2>
      <ul class="space-y-2 text-sm">
        {topFavTours.map((t) => (
          <li class="flex items-center justify-between gap-3">
            <a href={`/tours/${t.slug}`} class="text-gray-700 hover:text-primary-600 truncate">{t.name}</a>
            <span class="font-semibold text-gray-900 shrink-0">{t.favs}</span>
          </li>
        ))}
        {topFavTours.length === 0 && <li class="text-gray-400">No favourites yet.</li>}
      </ul>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Top countries</h2>
      <ul class="space-y-2 text-sm">
        {topCountries.map(([c, n]) => (
          <li class="flex items-center justify-between"><span class="text-gray-700">{c}</span><span class="font-semibold text-gray-900">{n}</span></li>
        ))}
      </ul>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Top categories</h2>
      <ul class="space-y-2 text-sm">
        {topCategories.map(([c, n]) => (
          <li class="flex items-center justify-between"><span class="text-gray-700">{c}</span><span class="font-semibold text-gray-900">{n}</span></li>
        ))}
      </ul>
    </div>
  </div>
</DashboardLayout>
```

- [ ] **Step 2: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/admin/analytics.astro
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(admin/analytics): site-wide stats with top tours, countries, categories"
```

---

### Task 5: Admin settings page

**Files:**
- Modify: `src/pages/admin/settings.astro`
- Create: `src/pages/api/admin/config.ts`

- [ ] **Step 1: Write the API endpoint**

Create `src/pages/api/admin/config.ts`:

```typescript
// src/pages/api/admin/config.ts
// GET / PATCH a single config row keyed by 'pricing'. Admin only.
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { supabase } from '../../../lib/supabase';

export const prerender = false;
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

const isAdmin = async (context: any) => {
  const user = await getAuthenticatedUser(context);
  return user?.role === 'admin' ? user : null;
};

export const GET: APIRoute = async (context) => {
  const user = await isAdmin(context);
  if (!user) return json({ error: 'Forbidden' }, 403);
  const { data, error } = await supabase.from('config').select('*').eq('key', 'pricing').maybeSingle();
  if (error) return json({ error: error.message }, 500);
  return json(data || { key: 'pricing', value: { listing_fee_cents: 4900, support_email: 'support@findtoursin.com', maintenance_mode: false } });
};

export const PATCH: APIRoute = async (context) => {
  const user = await isAdmin(context);
  if (!user) return json({ error: 'Forbidden' }, 403);
  let body: any;
  try { body = await context.request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  if (!body || typeof body.value !== 'object') return json({ error: 'value object required' }, 400);

  const { data, error } = await supabase.from('config').upsert({ key: 'pricing', value: body.value }, { onConflict: 'key' }).select().single();
  if (error) return json({ error: error.message }, 500);
  return json(data);
};
```

- [ ] **Step 2: Replace the admin settings page**

Overwrite `src/pages/admin/settings.astro`:

```astro
---
export const prerender = false;
import DashboardLayout from '../../layouts/DashboardLayout.astro';
import { supabase } from '../../lib/supabase';

const user = Astro.locals.user;
if (!user || user.role !== 'admin') return Astro.redirect('/');

const { data: config } = await supabase.from('config').select('*').eq('key', 'pricing').maybeSingle();
const value = (config?.value || {}) as { listing_fee_cents?: number; support_email?: string; maintenance_mode?: boolean };
const listingFeeCents = value.listing_fee_cents ?? 4900;
const supportEmail = value.support_email ?? 'support@findtoursin.com';
const maintenanceMode = value.maintenance_mode ?? false;
---

<DashboardLayout title="Admin Settings">
  <h1 class="text-xl font-semibold text-gray-900 mb-6">Admin Settings</h1>

  <form id="settings-form" class="max-w-xl space-y-5 bg-white rounded-xl border border-gray-200 p-6">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Tour listing fee (cents)</label>
      <input name="listing_fee_cents" type="number" min="0" value={listingFeeCents} class="w-full border border-gray-300 rounded-lg px-3 py-2" />
      <p class="mt-1 text-xs text-gray-500">Charged once per tour listing via Stripe Checkout.</p>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Support email</label>
      <input name="support_email" type="email" value={supportEmail} class="w-full border border-gray-300 rounded-lg px-3 py-2" />
    </div>
    <div class="flex items-center gap-2">
      <input name="maintenance_mode" type="checkbox" id="mm" checked={maintenanceMode} />
      <label for="mm" class="text-sm">Maintenance mode (read-only across the site)</label>
    </div>
    <div id="form-error" class="hidden text-sm text-red-600"></div>
    <div id="form-ok" class="hidden text-sm text-green-700">Saved.</div>
    <div>
      <button type="submit" class="px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700">Save settings</button>
    </div>
  </form>
</DashboardLayout>

<script>
  const form = document.getElementById('settings-form') as HTMLFormElement;
  const err = document.getElementById('form-error') as HTMLDivElement;
  const ok = document.getElementById('form-ok') as HTMLDivElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.classList.add('hidden'); ok.classList.add('hidden');
    const fd = new FormData(form);
    const value = {
      listing_fee_cents: Number(fd.get('listing_fee_cents')) || 0,
      support_email: String(fd.get('support_email') || ''),
      maintenance_mode: fd.get('maintenance_mode') === 'on',
    };
    const res = await fetch('/api/admin/config', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value }),
    });
    if (res.ok) { ok.classList.remove('hidden'); return; }
    const data = await res.json().catch(() => ({}));
    err.textContent = data.error || 'Failed to save'; err.classList.remove('hidden');
  });
</script>
```

- [ ] **Step 3: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/admin/settings.astro src/pages/api/admin/config.ts
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(admin/settings): site config form (listing fee, support email, maintenance mode)"
```

---

### Task 6: Replace "Blog management coming soon" tab on admin home

**Files:**
- Modify: `src/pages/admin/index.astro`

- [ ] **Step 1: Read the file** to see the existing tab structure (the file has a tab system per Task 1 recon — `tab-blog` panel around line 358).

- [ ] **Step 2: Replace the placeholder panel**

Read all blog post `.mdx` files in the frontmatter (using Astro's `getCollection`) and render them as a list. Find the existing block:

```astro
  <!-- Tab Content: Blog -->
  <div id="tab-blog" class="tab-panel hidden">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
      ...
      <p class="text-sm text-gray-500">Blog management coming soon</p>
    </div>
  </div>
```

Replace with:

```astro
  <!-- Tab Content: Blog -->
  <div id="tab-blog" class="tab-panel hidden">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Title</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Category</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Date</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {blogPosts.map((p) => (
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-3"><a href={`/blog/${p.id}`} class="text-primary-600 hover:underline">{p.data.title}</a></td>
              <td class="px-4 py-3 text-gray-600">{p.data.category}</td>
              <td class="px-4 py-3">
                <span class:list={['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', p.data.draft ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700']}>
                  {p.data.draft ? 'Draft' : 'Published'}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-gray-500 text-xs">{new Date(p.data.date).toLocaleDateString()}</td>
            </tr>
          ))}
          {blogPosts.length === 0 && (
            <tr><td colspan="4" class="px-4 py-12 text-center text-gray-400">No blog posts yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
    <p class="mt-4 text-xs text-gray-500">Posts are stored as MDX files in <code>src/content/blog/</code>. Edit or add via Git.</p>
  </div>
```

- [ ] **Step 3: Add the blog data fetch in the frontmatter**

In the existing frontmatter add:

```typescript
import { getCollection } from 'astro:content';
const blogPosts = (await getCollection('blog'))
  .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
```

- [ ] **Step 4: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/admin/index.astro
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(admin/index): real blog posts list in the Blog tab"
```

---

### Task 7: Stripe webhook accepts agency-plan completions

**Files:**
- Modify: `src/pages/api/stripe/webhook.ts`

The webhook today returns 400 if `metadata.tourId` is missing, breaking agency-plan checkouts.

- [ ] **Step 1: Read the file**

```bash
cat src/pages/api/stripe/webhook.ts
```

- [ ] **Step 2: Replace the `if (!tourId) return 400` branch**

Find:

```typescript
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const tourId = session.metadata?.tourId;

      if (!tourId) {
        return new Response(JSON.stringify({ error: 'Missing tourId' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      // ... existing tour-payment logic ...
    }
```

Replace with:

```typescript
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const tourId = session.metadata?.tourId;
      const agencyId = session.metadata?.agencyId;
      const planId = session.metadata?.planId;
      const billingPeriod = session.metadata?.billingPeriod;

      if (tourId) {
        // Existing tour-listing payment flow — unchanged
        const { data: tour } = await supabase.from('tours').select('*').eq('id', tourId).single();
        if (tour) {
          await supabase.from('tours').update({
            status: 'active',
            stripe_payment_id: session.payment_intent,
            updated_at: new Date().toISOString(),
          }).eq('id', tourId);
          await supabase.from('payments').insert({
            agency_id: tour.agency_id,
            tour_id: tour.id,
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
            amount: session.amount_total || 0,
            currency: session.currency || 'eur',
            status: 'completed',
          });
        }
      } else if (agencyId && planId) {
        // Agency-plan subscription completion
        const now = new Date().toISOString();
        // Compute expires_at from the session if it's a recurring sub
        let expiresAt: string | null = null;
        try {
          if (session.subscription) {
            const { stripe } = await import('../../../lib/stripe');
            const sub = await stripe.subscriptions.retrieve(session.subscription as string);
            if (sub?.current_period_end) {
              expiresAt = new Date((sub.current_period_end as number) * 1000).toISOString();
            }
          } else if (billingPeriod === 'annual') {
            expiresAt = new Date(Date.now() + 365 * 86400 * 1000).toISOString();
          } else if (billingPeriod === 'monthly') {
            expiresAt = new Date(Date.now() + 30 * 86400 * 1000).toISOString();
          }
        } catch (e) {
          console.error('webhook: failed to retrieve stripe subscription', e);
        }

        // Deactivate any prior active sub
        await supabase.from('subscriptions').update({
          is_active: false, deactivated_at: now, updated_at: now,
        }).eq('user_id', agencyId).eq('is_active', true);

        // Insert the new active sub
        const { error: subErr } = await supabase.from('subscriptions').insert({
          user_id: agencyId,
          plan_id: planId,
          source: 'stripe',
          is_active: true,
          started_at: now,
          expires_at: expiresAt,
        });
        if (subErr) {
          console.error('webhook: failed to insert subscription', subErr);
        }

        // Record the payment for the admin payments table
        await supabase.from('payments').insert({
          agency_id: agencyId,
          tour_id: null,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent || session.subscription,
          amount: session.amount_total || 0,
          currency: session.currency || 'eur',
          status: 'completed',
        });
      } else {
        // Unknown checkout shape — log but acknowledge so Stripe doesn't retry forever
        console.warn('webhook: unrecognised checkout.session.completed metadata', session.metadata);
      }
    }
```

The 400 branch is removed — unrecognised events are logged + acknowledged with 200 (the surrounding return), so Stripe stops retrying them.

- [ ] **Step 3: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/api/stripe/webhook.ts
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "fix(stripe/webhook): handle agency-plan checkout completions, write subscriptions row"
```

---

### Task 8: Public /pricing → real Stripe checkout flow

**Files:**
- Create: `src/pages/api/stripe/checkout-plan.ts`
- Modify: `src/pages/pricing.astro`

- [ ] **Step 1: Write the new endpoint**

`src/pages/api/stripe/checkout-plan.ts`:

```typescript
// src/pages/api/stripe/checkout-plan.ts
// Creates a Stripe Checkout Session in subscription mode for an agency plan.
// Authenticated agency only — unauthenticated users are redirected to register first.
import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../../lib/auth-helpers';
import { stripe } from '../../../lib/stripe';
import { getPlan } from '../../../lib/pricing';

export const prerender = false;
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async (context) => {
  const user = await getAuthenticatedUser(context);
  if (!user) {
    // Redirect to register with the plan baked in
    const url = new URL(context.request.url);
    const planId = (await context.request.formData()).get('planId') || url.searchParams.get('planId') || '';
    return context.redirect(`/auth/register?plan=${encodeURIComponent(String(planId))}`);
  }
  if (user.role !== 'agency' && user.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  const contentType = context.request.headers.get('content-type') || '';
  let planId = '', billingPeriod: 'monthly' | 'annual' = 'monthly';
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const fd = await context.request.formData();
    planId = String(fd.get('planId') || '');
    billingPeriod = (fd.get('billingPeriod') === 'annual' ? 'annual' : 'monthly');
  } else {
    const body = await context.request.json().catch(() => ({}));
    planId = String(body.planId || '');
    billingPeriod = body.billingPeriod === 'annual' ? 'annual' : 'monthly';
  }

  const plan = getPlan(planId);
  if (!plan) return json({ error: 'Unknown plan' }, 400);

  const unitAmount = billingPeriod === 'annual' ? plan.annualPriceCents : plan.monthlyPriceCents;
  const interval = billingPeriod === 'annual' ? 'year' : 'month';
  const origin = new URL(context.request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    client_reference_id: user.id,
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: `FindToursIn ${plan.name}` },
        unit_amount: unitAmount,
        recurring: { interval },
      },
      quantity: 1,
    }],
    metadata: {
      agencyId: user.id,
      planId: plan.id,
      planName: plan.name,
      billingPeriod,
    },
    success_url: `${origin}/dashboard/subscription?activated=${plan.id}`,
    cancel_url: `${origin}/pricing?cancelled=1`,
  });

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    return context.redirect(session.url!, 303);
  }
  return json({ url: session.url });
};
```

- [ ] **Step 2: Wire the public /pricing page Get Started buttons**

In `src/pages/pricing.astro`, find the existing `<a href={\`/auth/register?plan=${plan.id}\`}>` Get Started link (line ~150). Replace each plan card's Get Started with a form posting to the new endpoint. The exact replacement (read the file with the Read tool first to confirm the context):

```astro
<form method="POST" action="/api/stripe/checkout-plan" class="mt-auto">
  <input type="hidden" name="planId" value={plan.id} />
  <input type="hidden" name="billingPeriod" value="monthly" class="billing-period-input" />
  <button type="submit" class="...same classes as the existing Get Started button..."> Get Started </button>
</form>
```

If the page has a billing-period toggle (monthly/annual), reuse the same script pattern as `src/pages/dashboard/pricing.astro` — it already syncs `.billing-period-input` values across all forms.

- [ ] **Step 3: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/pages/api/stripe/checkout-plan.ts src/pages/pricing.astro
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(pricing): public Get Started → Stripe subscription checkout"
```

---

### Task 9: Final Playwright walkthrough + push

This task uses the Supabase service role to create a temporary audit-admin user, drives an authenticated Playwright walkthrough of every previously-stub page, captures screenshots, and pushes if everything passes.

- [ ] **Step 1: Write `/tmp/smoke-final.mjs`**

```javascript
// /tmp/smoke-final.mjs
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const TEST_EMAIL = `audit-${Date.now()}@findtoursin.local`;
const TEST_PASS = 'AuditTemp-' + Math.random().toString(36).slice(2, 14);

console.log('Creating temp admin', TEST_EMAIL);
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email: TEST_EMAIL, password: TEST_PASS, email_confirm: true,
});
if (createErr) { console.error('createUser:', createErr); process.exit(1); }
const userId = created.user.id;
await admin.from('users').insert({ id: userId, email: TEST_EMAIL, name: 'Audit Bot', role: 'admin', is_verified: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const BASE = process.env.BASE || 'http://localhost:4321';
const OUT = '/tmp/smoke-out-final';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const pass = (n) => { results.push({ n, ok: true }); console.log('✓', n); };
const fail = (n, m) => { results.push({ n, ok: false, m }); console.log('✗', n, m); };

// Log in via the project's /api/auth/login endpoint (cookies set server-side)
const login = await ctx.request.post(`${BASE}/api/auth/login`, { headers: { 'Content-Type': 'application/json' }, data: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }) });
if (!login.ok()) { console.error('Login failed', login.status(), await login.text()); process.exit(1); }
console.log('Logged in as audit-admin');

const pages = [
  { url: '/admin', name: 'Admin home', mustHave: ['Overview', 'Agencies', 'Active tours'], mustNotHave: ['Blog management coming soon'] },
  { url: '/admin/payments', name: 'Admin payments', mustHave: ['Total revenue', 'Status'], mustNotHave: ['No payments yet payments recorded'] },
  { url: '/admin/revenue', name: 'Admin revenue', mustHave: ['Last 30 days', 'Daily revenue'], mustNotHave: ['Revenue analytics coming soon'] },
  { url: '/admin/analytics', name: 'Admin analytics', mustHave: ['Active tours', 'Top tours'], mustNotHave: ['Analytics dashboard coming soon'] },
  { url: '/admin/settings', name: 'Admin settings', mustHave: ['Tour listing fee', 'Support email'], mustNotHave: ['Admin settings coming soon'] },
  { url: '/admin/users', name: 'Admin users (existing)', mustHave: ['email'] },
  { url: '/admin/listings', name: 'Admin listings (existing)' },
  { url: '/admin/discount-codes', name: 'Admin discount codes' },
  { url: '/admin/subscriptions', name: 'Admin subscriptions' },
  { url: '/admin/messages', name: 'Admin messages' },
  { url: '/admin/approvals', name: 'Admin approvals' },
];

for (const p of pages) {
  try {
    const resp = await page.goto(BASE + p.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (!resp || !resp.ok()) { fail(p.name, `HTTP ${resp ? resp.status() : 'no response'}`); continue; }
    const html = await page.content();
    const errs = [];
    for (const s of p.mustHave || []) if (!html.includes(s)) errs.push(`missing "${s}"`);
    for (const s of p.mustNotHave || []) if (html.includes(s)) errs.push(`unexpected "${s}"`);
    await page.screenshot({ path: `${OUT}/${p.url.replace(/\W+/g, '-').replace(/^-|-$/g, '')}.png`, fullPage: true });
    if (errs.length) fail(p.name, errs.join('; ')); else pass(p.name);
  } catch (e) { fail(p.name, e.message); }
}

console.log('\nCleanup: deleting audit user');
await admin.auth.admin.deleteUser(userId).catch(() => {});
await admin.from('users').delete().eq('id', userId).catch(() => {});

await browser.close();
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.filter(r => r.ok).length}/${results.length} passed`);
if (failed) results.filter(r => !r.ok).forEach(r => console.log('  ✗', r.n, r.m));
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run the smoke**

```bash
# Prereqs (one-time): playwright is already installed transiently from prior smokes
[ -d node_modules/playwright ] || npm install --no-save playwright

cd /Users/marios/Desktop/Cursor/worldoftours
# Load env from .env into shell
set -a; source .env; set +a
# Start dev
npm run dev > /tmp/dev-final.log 2>&1 &
DEVPID=$!; sleep 8
# Run
SUPABASE_URL=$SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY BASE=http://localhost:4321 node /tmp/smoke-final.mjs
# Stop
kill $DEVPID 2>/dev/null
```

Expected: all 11 page checks pass. Screenshots in `/tmp/smoke-out-final/`.

- [ ] **Step 3: Production build**

```bash
npm run build 2>&1 | tail -3
```

Expected: `[build] Complete!`.

- [ ] **Step 4: Push**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours push origin main
```

(Use the GitHub PAT inline form if the keychain is still wrong: `git push 'https://MariosKif:<PAT>@github.com/MariosKif/findtourin.git' main`.)

After Vercel redeploys, **manually verify** in the browser:
1. Log in as `marioskifokeris@hotmail.com` (your real admin).
2. Visit each `/admin/*` page that was previously a stub. Confirm real data renders.
3. Visit `/dashboard/subscription` (in another browser logged in as the agency `mkifokeris@itdev.gr`). Confirm the plan name reflects the active subscription.
4. Test the public `/pricing` Get Started: as an unauthenticated visitor, click Get Started → land on `/auth/register?plan=…`. As an authenticated agency, click Get Started → redirect to Stripe Checkout in subscription mode.
5. Trigger a test Stripe subscription completion (`stripe trigger checkout.session.completed` with metadata, or use Stripe Dashboard → Test mode). Confirm the webhook returns 200 and a `subscriptions` row with `source='stripe'` appears in the DB.

---

## Out of scope (intentionally — flag if you disagree)

- Implementing a full blog CMS with WYSIWYG editor. The blog management tab in admin is read-only — content lives in `src/content/blog/*.mdx` and is edited via Git (matches the existing pattern).
- Stripe refund integration on the admin payments table. Today the table is read-only with no "Refund" button. Adding refund support requires the Stripe `refunds.create` API plus a confirmation flow.
- Auto-renewal email reminders (e.g., "your plan expires in 7 days"). The cron deactivates expired subs but doesn't notify; that's a future plan.
- Real-time charts on the analytics page (e.g., Chart.js). Today it uses simple SVG-bar visuals to avoid a charting dep.
- Internationalisation. Site is English only.
- Automated Stripe Customer Portal link. Today admins manage subscriptions via `/admin/subscriptions`; agencies cannot self-serve cancel/upgrade. Adding the Stripe Billing Portal API integration is a separate plan.
- Forgot-password / password-reset flow. Doesn't exist today; out of scope here.
