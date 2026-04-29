# Remove Fake Social-Proof Numbers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate every hardcoded fake social-proof number/copy from the site (ratings, review counts, booking counts, view counts, favourite counts, fake review text, fake "verified" agency, fake response time) so users only see numbers backed by real data.

**Architecture:** Touches three layers:
1. Demo fallback library (`src/lib/demo-tours.ts`) — strip every baked-in counter and the entire DEMO_REVIEWS object.
2. Components that render fallback values (`AgencyContactCard.astro`, `tours/[slug].astro`, `TourCard.astro`) — when the underlying value is 0/null, render nothing or a neutral default rather than fabricated copy.
3. Production cache — purge `/tours/*` edge cache so the corrected pages show immediately rather than waiting for `s-maxage=120` to expire.

The DB itself is already clean (verified 2026-04-29): all 39 tours have `view_count=0` (one tour will be incremented to 1 by the next legitimate page hit), and `rating`/`review_count`/`booking_count` were never seeded with non-zero values.

**Tech Stack:** Astro 6 SSR, Supabase (read-only for this plan; the production data has already been reset), Tailwind, Vercel edge cache.

**Discovery already done (2026-04-29):**
- Production DB tour count: 39, all `view_count=0` after reset (1 tour now at 1 due to the screenshot visit).
- `src/lib/demo-tours.ts`: 998 lines; 122 hardcoded social-proof fields across DEMO_TOURS; DEMO_REVIEWS has hardcoded review text for ~10+ slugs; DEMO_AGENCY has `isVerified: true`.
- DEMO_TOURS is referenced only as a fallback in `src/pages/tours/index.astro:77` when the live DB query fails. With 39 real rows this code path doesn't fire today, but the fake values still ship in the JS bundle.
- DEMO_REVIEWS is read on **every** tour detail page (`src/pages/tours/[slug].astro:86`): `const reviews = DEMO_REVIEWS[slug] || [];` — any DB tour whose slug happens to match a DEMO_REVIEWS key gets fake reviews rendered. Currently no slug overlap exists, but this is a latent footgun.
- DEMO_AGENCY is used in the `tourWithAgency` build (`src/pages/tours/[slug].astro:90-91`) as the **fallback** for `agencyName` and `agencyVerified` when the real agency lookup returns nothing — meaning a tour with a missing agency would show as "World Tours Demo Agency" with a fake verified tick.
- `AgencyContactCard.astro:121` has the hardcoded "Response time: Usually within 2 hours" line, with no agency-side input backing it.

---

## File Map

| File | Change |
|---|---|
| `src/lib/demo-tours.ts` | Strip `rating`, `review_count`, `booking_count`, `view_count`, `favouriteCount` from every DEMO_TOURS entry. Replace DEMO_REVIEWS body with `{}`. Replace DEMO_AGENCY's `isVerified: true` with `false`, rename label so it can't masquerade as a real agency. |
| `src/pages/tours/[slug].astro` | When real agency lookup misses, do NOT fall back to DEMO_AGENCY — show the tour without an agency name/verified badge. Same for reviews — only render reviews from a real source (none yet). |
| `src/components/tours/AgencyContactCard.astro` | Remove the hardcoded "Response time" line. Hide the rating block entirely when `tour.rating` is null/0. |
| `src/components/tours/TourCard.astro` | Hide rating/review/favourite/view UI when the value is 0/null instead of rendering "0". |
| Production deploy + cache | Force-revalidate `/tours/*` after deploy so the new HTML shows immediately rather than after `s-maxage=120`. |

---

## Task 1: Strip social-proof fields from DEMO_TOURS entries

**Files:**
- Modify: `src/lib/demo-tours.ts`

The current shape of each DEMO_TOURS entry includes these fake fields:

```typescript
rating: 4.8,
review_count: 234,
booking_count: 412,
view_count: 1842,
favouriteCount: 156,
```

Strategy: keep the field names so callers don't break, but set every value to a falsy default — `rating: 0`, `review_count: 0`, `booking_count: 0`, `view_count: 0`, `favouriteCount: 0`. Components already check truthy/`> 0` before rendering, so 0 means "hide".

- [ ] **Step 1: Bulk-rewrite the file via sed**

Run from project root `/Users/marios/Desktop/Cursor/worldoftours`:

```bash
sed -i '' \
  -e 's/^\(\s*\)rating:\s*[0-9.]\+,/\1rating: 0,/' \
  -e 's/^\(\s*\)review_count:\s*[0-9]\+,/\1review_count: 0,/' \
  -e 's/^\(\s*\)booking_count:\s*[0-9]\+,/\1booking_count: 0,/' \
  -e 's/^\(\s*\)view_count:\s*[0-9]\+,/\1view_count: 0,/' \
  -e 's/^\(\s*\)favouriteCount:\s*[0-9]\+,/\1favouriteCount: 0,/' \
  src/lib/demo-tours.ts
```

(macOS BSD sed needs the `''` after `-i`. The leading `^\(\s*\)…\1` capture preserves indentation so the file stays clean.)

- [ ] **Step 2: Verify all occurrences are now 0**

```bash
grep -nE "rating: [^0]|review_count: [^0]|booking_count: [^0]|view_count: [^0]|favouriteCount: [^0]" src/lib/demo-tours.ts | head -10
```

Expected: no output (every counter line should now be `…: 0,`).

- [ ] **Step 3: Run typecheck**

```bash
npm run build
```

Expected: `[build] Complete!` with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/demo-tours.ts
git commit -m "refactor(demo-tours): zero out hardcoded social-proof counters"
```

---

## Task 2: Empty DEMO_REVIEWS

**Files:**
- Modify: `src/lib/demo-tours.ts`

DEMO_REVIEWS currently maps slugs to arrays of fake review objects (name, rating, text, date). It's read at `src/pages/tours/[slug].astro:86`:

```typescript
const reviews = DEMO_REVIEWS[slug] || [];
```

A tour whose slug matches a key in DEMO_REVIEWS gets fake reviews rendered. Replacing the body with `{}` makes every lookup miss and the page falls through to "no reviews" state.

- [ ] **Step 1: Find the export**

```bash
grep -n "^export const DEMO_REVIEWS" src/lib/demo-tours.ts
```

Expected: one line, around `:881`.

- [ ] **Step 2: Edit the file** — replace the entire DEMO_REVIEWS object body with `{}`

The current declaration looks like:

```typescript
export const DEMO_REVIEWS: Record<string, { name: string; rating: number; text: string; date: string }[]> = {
  'santorini-sunset-cruise': [
    { name: 'Sarah M.', rating: 5, text: '…', date: '2025-09-12' },
    …
  ],
  …
};
```

Use the Edit tool: `old_string` = the literal `export const DEMO_REVIEWS: Record<string, { name: string; rating: number; text: string; date: string }[]> = {` line through (and including) the closing `};` on the last review entry. `new_string` = a single line:

```typescript
export const DEMO_REVIEWS: Record<string, { name: string; rating: number; text: string; date: string }[]> = {};
```

If the multi-line replacement is unwieldy, an alternative is `sed -E` to match from the open brace through the file's terminal `};`. For safety prefer the Edit tool and accept that this will be a large `old_string`.

- [ ] **Step 3: Verify the file ends cleanly and there are no orphan review entries**

```bash
grep -c "^\s*'\S\+':\s*\[\s*$" src/lib/demo-tours.ts
```

Expected: `0`.

```bash
grep -n "^export const DEMO_REVIEWS" src/lib/demo-tours.ts
```

Expected: one line, the new single-line declaration.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/demo-tours.ts
git commit -m "refactor(demo-tours): empty DEMO_REVIEWS so detail pages stop rendering fake reviews"
```

---

## Task 3: Stop falling back to DEMO_AGENCY

**Files:**
- Modify: `src/pages/tours/[slug].astro` (the `tourWithAgency` build, around lines 88-94)
- Modify: `src/lib/demo-tours.ts` (set `DEMO_AGENCY.isVerified: false` for any code path that still touches it)

Current code (`src/pages/tours/[slug].astro:88-94`):

```astro
const tourWithAgency = {
  ...tour,
  agencyName: agency?.company_name || agency?.name || DEMO_AGENCY.companyName,
  agencyVerified: agency?.is_verified || DEMO_AGENCY.isVerified,
  rating: tour.rating,
  review_count: tour.review_count ?? tour.reviewCount,
};
```

The `|| DEMO_AGENCY.…` chain means a tour without an agency lookup gets a fake "World Tours Demo Agency" with a verified tick.

- [ ] **Step 1: Edit `src/pages/tours/[slug].astro`**

Replace the `tourWithAgency` block above with:

```astro
const tourWithAgency = {
  ...tour,
  agencyName: agency?.company_name || agency?.name || null,
  agencyVerified: Boolean(agency?.is_verified),
  rating: tour.rating,
  review_count: tour.review_count ?? tour.reviewCount,
};
```

Now: no real agency → `agencyName=null`, `agencyVerified=false`. The contact card already conditions its agency block on `tour.agencyName`, so it will simply omit the section.

- [ ] **Step 2: Belt-and-braces** — also stop DEMO_AGENCY from declaring itself verified, in case any other call site reads it.

In `src/lib/demo-tours.ts:1-5`, change:

```typescript
export const DEMO_AGENCY = {
  name: 'World Tours Demo',
  companyName: 'World Tours Demo Agency',
  isVerified: true,
};
```

To:

```typescript
export const DEMO_AGENCY = {
  name: 'Independent Agency',
  companyName: 'Independent Agency',
  isVerified: false,
};
```

- [ ] **Step 3: Verify no other call site relies on the old "Demo" label**

```bash
grep -rn "DEMO_AGENCY\b" src/ --include="*.ts" --include="*.astro"
```

Expected: only the import + the `[slug].astro` reference (already updated to ignore the value), and the declaration in `demo-tours.ts`.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/tours/\[slug\].astro src/lib/demo-tours.ts
git commit -m "refactor(tours): stop falling back to DEMO_AGENCY (fake verified badge)"
```

---

## Task 4: Drop the hardcoded "Response time" copy

**Files:**
- Modify: `src/components/tours/AgencyContactCard.astro` lines 115–121

The current "Trust Signals" section opens with a hardcoded line that is not backed by any agency input:

```astro
    {/* Response Time */}
    <div class="flex items-center gap-2 text-sm text-gray-600">
      <svg class="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Response time: Usually within 2 hours</span>
    </div>
```

- [ ] **Step 1: Edit `src/components/tours/AgencyContactCard.astro`** — delete those 7 lines.

Use the Edit tool with the exact block above as `old_string` and an empty `new_string` (or a single blank line if needed to keep adjacent spacing readable).

- [ ] **Step 2: Verify**

```bash
grep -n "Response time\|Usually within" src/components/tours/AgencyContactCard.astro
```

Expected: no output.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 4: Commit**

```bash
git add src/components/tours/AgencyContactCard.astro
git commit -m "refactor(tours): drop hardcoded 'Response time: Usually within 2 hours' line"
```

---

## Task 5: Hide rating block when tour has no rating

**Files:**
- Modify: `src/components/tours/AgencyContactCard.astro` lines 132-154

The current rating block renders whenever `tour.rating` is truthy. After Task 1, demo tours have `rating: 0` (falsy), so they correctly hide. But the `> 0` check is implicit; make it explicit so a future code change doesn't accidentally render an empty 5-star bar.

- [ ] **Step 1: Edit `src/components/tours/AgencyContactCard.astro`**

Find:

```astro
    {/* Tour Rating */}
    {tour.rating && (
      <div class="flex items-center gap-2 text-sm text-gray-600">
```

Replace with:

```astro
    {/* Tour Rating — only when there's an actual rating, not the field default */}
    {tour.rating && tour.rating > 0 && (
      <div class="flex items-center gap-2 text-sm text-gray-600">
```

- [ ] **Step 2: Same defensive change for the `review_count` sub-block within the rating block**

Find:

```astro
        {tour.review_count && (
          <span class="text-gray-400">({tour.review_count} reviews)</span>
        )}
```

Replace with:

```astro
        {tour.review_count && tour.review_count > 0 && (
          <span class="text-gray-400">({tour.review_count} reviews)</span>
        )}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 4: Commit**

```bash
git add src/components/tours/AgencyContactCard.astro
git commit -m "refactor(tours): make rating/review-count guards explicit (>0)"
```

---

## Task 6: Hide TourCard counters when zero

**Files:**
- Modify: `src/components/tours/TourCard.astro`

Currently the card renders raw zeros for `view_count` and `favouriteCount` (e.g. "0" beside an eye icon, "0" beside a heart icon). On a 0-views/0-favourites listing this looks wrong — better to omit the metric entirely until there's something to show.

- [ ] **Step 1: Read the relevant section of `src/components/tours/TourCard.astro`**

```bash
sed -n '155,175p' src/components/tours/TourCard.astro
```

Locate the spans rendering `{tour.view_count || 0}` (around line 160) and `{tour.favouriteCount || 0}` (around line 166). Each is wrapped in a flex container with an icon.

- [ ] **Step 2: Wrap both metric blocks in `value > 0 && (…)`**

For `view_count`, wrap the entire `<div>`/`<span>` (whatever the immediate parent of `{tour.view_count || 0}` is) in:

```astro
{(tour.view_count ?? 0) > 0 && (
  …existing block…
)}
```

For `favouriteCount`:

```astro
{(tour.favouriteCount ?? 0) > 0 && (
  …existing block…
)}
```

If `rating` (`{ratingValue}` at line 33) renders a star block whose value is 0, do the same wrap:

```astro
{ratingValue > 0 && (
  …existing rating block…
)}
```

(If a rating star block doesn't unconditionally render — e.g. it's already gated — leave it.)

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 4: Quick visual smoke**

```bash
grep -n "tour\\.view_count\\|tour\\.favouriteCount\\|ratingValue" src/components/tours/TourCard.astro
```

Inspect the surrounding code to confirm each render site is now conditional. No output is fine if you used `grep -E`.

- [ ] **Step 5: Commit**

```bash
git add src/components/tours/TourCard.astro
git commit -m "refactor(tours): hide TourCard counters when zero"
```

---

## Task 7: Final smoke + push + cache purge

- [ ] **Step 1: Push all commits**

```bash
git push 'https://MariosKif:${GH_PAT}@github.com/MariosKif/findtourin.git' main
```

Where `${GH_PAT}` is the GitHub PAT used in this session.

- [ ] **Step 2: Wait ~90s for Vercel to redeploy**

- [ ] **Step 3: Force a fresh fetch of `/tours/cinque-terre-trail` to bust the edge cache**

```bash
curl -s -o /dev/null -w "status=%{http_code} cache=%{header.x-vercel-cache}\n" "https://www.findtoursin.com/tours/cinque-terre-trail?cb=$(date +%s)"
```

Expected: `status=200`. The cache-buster query string forces a MISS so the next normal visit gets a fresh render. Repeat once more without the `?cb=` to populate the regular cache key:

```bash
curl -s -o /dev/null -w "status=%{http_code} cache=%{header.x-vercel-cache}\n" "https://www.findtoursin.com/tours/cinque-terre-trail"
```

The second call's `cache` header should now be MISS or PRERENDER on the first hit, then HIT on subsequent.

- [ ] **Step 4: Smoke**

Create `scripts/_smoke-no-fake.mjs`:

```javascript
import { chromium } from 'playwright';
const SITE = 'https://www.findtoursin.com';

const probes = [
  { url: '/tours/cinque-terre-trail', mustNotInclude: ['510 total views', 'Usually within 2 hours', 'Sarah M.', 'James K.', 'World Tours Demo'] },
  { url: '/tours', mustNotInclude: ['Usually within 2 hours'] },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
let pass = 0, fail = 0;
for (const p of probes) {
  const r = await page.goto(`${SITE}${p.url}?cb=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  const html = await page.content();
  const status = r?.status();
  const ok = status === 200 && p.mustNotInclude.every(s => !html.includes(s));
  console.log(ok ? '✅' : '❌', p.url, `status=${status}`);
  if (!ok) {
    for (const s of p.mustNotInclude) {
      if (html.includes(s)) console.log(`     STILL CONTAINS: ${s}`);
    }
  }
  ok ? pass++ : fail++;
}
console.log(`\npass=${pass} fail=${fail}`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
```

Run: `node scripts/_smoke-no-fake.mjs`
Expected: both `✅`, exit 0.

- [ ] **Step 5: Delete the one-shot smoke**

```bash
rm scripts/_smoke-no-fake.mjs
```

This task does not produce a commit (script never enters the tree).

---

## Self-Review

**Spec coverage:** "Eliminate fake social-proof from the whole project" ⇒
- Hardcoded counters in DEMO_TOURS → Task 1 ✅
- Hardcoded reviews in DEMO_REVIEWS → Task 2 ✅
- Fake "verified" agency fallback → Task 3 ✅
- "Response time: Usually within 2 hours" copy → Task 4 ✅
- Defensive `>0` guards on rating/review render → Task 5 ✅
- TourCard rendering raw zeros → Task 6 ✅
- Production cache invalidation + smoke → Task 7 ✅

**Out-of-scope (deliberately):**
- DB-backed real reviews — there's no UI/API to author reviews yet, so there's nothing to wire up. This plan deletes the fake reviews; building real ones is a separate feature.
- Removing DEMO_TOURS entirely — the fallback is unreachable today (39 real rows exist), so leaving the now-zeroed list as a defensive empty-state is fine.
- Vercel cache purge automation on every DB write — out of scope; the 120s `s-maxage` is acceptable for view-count drift.

**Placeholder scan:** No "TBD", no "implement later", no vague directives. Every step has the actual command or the actual code change.

**Type/name consistency:** All field names referenced (`rating`, `review_count`, `booking_count`, `view_count`, `favouriteCount`) match the existing TypeScript types and the existing DB column names.
