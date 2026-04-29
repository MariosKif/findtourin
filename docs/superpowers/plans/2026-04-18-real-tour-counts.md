# Real View & Favourite Counts on Tour Cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every hardcoded `favouriteCount: 0` across the site with the real count from the `favourites` table, and confirm `view_count` flows through from the `tours` table on every surface that renders a `TourCard`.

**Architecture:** Create one shared helper (`src/lib/tour-helpers.ts`) that owns (a) the canonical Supabase `SELECT` string to use when listing tours and (b) a `normalizeTour()` mapper that converts a raw row into the `TourWithImages` shape `TourCard` expects — including the real `favouriteCount` read from the joined `favourites(count)` aggregate. Every page currently hardcoding `favouriteCount: 0` switches to this helper. `view_count` is already stored and incremented on `/tours/[slug]`; it flows through unchanged because we `SELECT *`.

**Tech Stack:** Astro 6 (SSR), Supabase JS client, TypeScript. No test framework is installed — each task verifies with `curl` + `grep`/`python` on dev-server output (port 4322).

**DB facts (confirmed in current code):**
- `tours.view_count` — integer, incremented in `src/pages/tours/[slug].astro` via `.update({ view_count: (tour.view_count || 0) + 1 })`.
- `favourites` table — rows of `(user_id, tour_id)`, unique composite. Count per tour is obtained via the Supabase nested aggregate `select('*, favourites(count)')`. This is the exact pattern already used in `src/lib/search.ts:27`.
- The aggregate comes back as `tour.favourites[0].count` (or missing if zero).

**Hardcoded sites replaced (7 total):**
1. `src/pages/index.astro:30` — homepage featured tours
2. `src/pages/tours/index.astro:60` — `/tours` category-browse mode
3. `src/pages/tours/in/[country].astro:55` — country hub
4. `src/pages/tours/in/[country]/[city].astro:50` — city hub
5. `src/pages/tours/category/[category]/in/[country].astro:50` — category × country
6. `src/pages/agencies/[slug].astro:35` — agency profile
7. `src/pages/tours/[slug].astro:79` — related tours on tour detail

`/tours` filtered mode already uses `searchTours()` from `src/lib/search.ts` which already joins `favourites(count)` correctly — no change needed there.

---

## File Structure

**New:**
- `src/lib/tour-helpers.ts` — single source of truth for tour-list queries

**Modified:**
- 7 pages listed above, each swaps its hardcoded mapper for `normalizeTour()` and its `SELECT '*'` for `SELECT TOUR_LIST_SELECT`

No changes to: `TourCard.astro`, `types.ts`, `lib/search.ts` (already correct), DB schema, API routes.

---

### Task 1: Create shared tour helpers

**Files:**
- Create: `src/lib/tour-helpers.ts`

- [ ] **Step 1: Create the helper file**

```typescript
// src/lib/tour-helpers.ts
// Single source of truth for turning raw Supabase `tours` rows into the
// shape consumed by `TourCard.astro` (which expects `favouriteCount`,
// `thumbnail`, and `images`). All list queries should use TOUR_LIST_SELECT
// so the favourites aggregate is present on every row.

export const TOUR_LIST_SELECT = '*, favourites(count)';

export interface RawTour {
  id: string;
  slug: string;
  name: string;
  description: string;
  country: string;
  city: string;
  price: string | number;
  currency: string;
  category: string;
  duration_days?: number | null;
  view_count?: number | null;
  images?: { url: string; position?: number; storage_path?: string }[] | null;
  favourites?: { count: number }[] | null;
  [key: string]: any;
}

export interface NormalizedTour extends RawTour {
  images: { url: string; position?: number; storage_path?: string }[];
  thumbnail: string | null;
  favouriteCount: number;
  view_count: number;
}

export function normalizeTour(row: RawTour): NormalizedTour {
  const { favourites, ...rest } = row;
  const images = rest.images || [];
  return {
    ...rest,
    images,
    thumbnail: images[0]?.url || null,
    favouriteCount: favourites?.[0]?.count ?? 0,
    view_count: rest.view_count ?? 0,
  };
}

export function normalizeTours(rows: RawTour[] | null | undefined): NormalizedTour[] {
  return (rows || []).map(normalizeTour);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: exits 0, or at most pre-existing errors (no new ones from this file).

- [ ] **Step 3: Commit**

```bash
git add src/lib/tour-helpers.ts
git commit -m "feat: add tour-helpers with TOUR_LIST_SELECT + normalizeTour"
```

---

### Task 2: Wire homepage featured tours

**Files:**
- Modify: `src/pages/index.astro:16-32` (the first Supabase query + its mapper)

- [ ] **Step 1: Update imports and query**

Replace lines 11-32 of `src/pages/index.astro` — the top of the frontmatter where `toursData` is fetched and mapped — with:

```typescript
import { supabase } from '../lib/supabase';
import { TOUR_LIST_SELECT, normalizeTour } from '../lib/tour-helpers';

// --- Real data from DB (with safe fallback) ---
let featuredTours: any[] = FEATURED_TOURS as any[];
let stats = { tours: 0, agencies: 0, countries: 0 };
let realDestinations: { city: string; country: string; image: string }[] | undefined = undefined;

try {
  const { data: toursData } = await supabase
    .from('tours')
    .select(TOUR_LIST_SELECT)
    .eq('status', 'active')
    .order('view_count', { ascending: false })
    .limit(50);

  if (toursData && toursData.length > 0) {
    // Featured: top 6 by views
    featuredTours = toursData.slice(0, 6).map(normalizeTour);
```

**Note:** Keep the rest of the `try` block (stats aggregation, destinations loop) exactly as it currently is — only the `featuredTours` mapping and the `.select()` call change. Remove the inline `images: t.images || [], thumbnail: ..., favouriteCount: 0` block.

- [ ] **Step 2: Verify with curl**

Run:
```bash
curl -sS http://localhost:4322/ | python3 -c "
import sys, re
h = sys.stdin.read()
# Homepage featured tours appear with class 'tour-card'; count SVG heart + number pairs
print('TOUR CARDS:', h.count('class=\"tour-card'))
# The featured tours rendering shows 'tour.favouriteCount' next to heart icon.
# Any non-zero count proves real data is flowing.
fav_counts = re.findall(r'fill=\"currentColor\" viewBox=\"0 0 24 24\">\s*<path d=\"M4.318 6.318.*?</svg>\s*(\d+)', h, re.S)
print('FAV COUNTS ON HOMEPAGE:', fav_counts[:6])
"
```

Expected: 6 tour cards; FAV COUNTS list of 6 numbers (may be all `['0','0',...]` if no user has favourited anything yet — that's still correct, it's real data; the point is the DB query ran).

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: homepage featured tours pull real favourite counts"
```

---

### Task 3: Wire /tours category-browse mode

**Files:**
- Modify: `src/pages/tours/index.astro:40-62` (category-browse branch, the `if (!hasFilters)` block)

- [ ] **Step 1: Update the query + mapper**

In `src/pages/tours/index.astro`, replace the body of the `if (!hasFilters)` block's `try` (around lines 40-80) with:

```typescript
if (!hasFilters) {
  try {
    const { data: allTours } = await supabase
      .from('tours')
      .select(TOUR_LIST_SELECT)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100);

    if (allTours && allTours.length > 0) {
      const normalized = allTours.map(normalizeTour);
      const grouped = new Map<string, any[]>();
      for (const tour of normalized) {
        const cat = tour.category || 'Other';
        if (!grouped.has(cat)) grouped.set(cat, []);
        const group = grouped.get(cat)!;
        if (group.length < 7) group.push(tour);
      }

      for (const cat of CATEGORIES) {
        const tours = grouped.get(cat);
        if (tours && tours.length > 0) {
          categoryGroups.push({ category: cat, tours });
          grouped.delete(cat);
        }
      }
      for (const [cat, tours] of grouped) {
        if (tours.length > 0) categoryGroups.push({ category: cat, tours });
      }
    }
  } catch {
    // Fallback: group demo tours by category
    const grouped = new Map<string, any[]>();
    for (const tour of DEMO_TOURS) {
      const cat = tour.category || 'Other';
      if (!grouped.has(cat)) grouped.set(cat, []);
      const group = grouped.get(cat)!;
      if (group.length < 7) group.push(tour);
    }
    for (const [cat, tours] of grouped) {
      if (tours.length > 0) categoryGroups.push({ category: cat, tours });
    }
  }
}
```

Add import near the top of the frontmatter:
```typescript
import { TOUR_LIST_SELECT, normalizeTour } from '../../lib/tour-helpers';
```

- [ ] **Step 2: Verify**

Run:
```bash
curl -sS http://localhost:4322/tours | grep -c 'class="tour-card'
```
Expected: a number > 10 (category browse renders up to 7 tours per category across ~12 categories).

Run:
```bash
curl -sS http://localhost:4322/tours | grep -oE '<svg class="w-3 h-3" fill="currentColor"' | wc -l
```
Expected: same number as tour cards (each card renders a favourites heart svg).

- [ ] **Step 3: Commit**

```bash
git add src/pages/tours/index.astro
git commit -m "feat: /tours category browse shows real favourite counts"
```

---

### Task 4: Wire country hub

**Files:**
- Modify: `src/pages/tours/in/[country].astro:10-60`

- [ ] **Step 1: Update query + mapper**

In `src/pages/tours/in/[country].astro`, change:

```typescript
const { data: allTours } = await supabase
  .from('tours')
  .select('*')
  .eq('status', 'active');
```

to:

```typescript
const { data: allTours } = await supabase
  .from('tours')
  .select(TOUR_LIST_SELECT)
  .eq('status', 'active');
```

Change the `toursGridData` mapper from:

```typescript
const toursGridData = tours
  .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
  .slice(0, 24)
  .map((t: any) => ({
    ...t,
    images: t.images || [],
    thumbnail: t.images?.[0]?.url || null,
    favouriteCount: 0,
  }));
```

to:

```typescript
const toursGridData = tours
  .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
  .slice(0, 24)
  .map(normalizeTour);
```

Add to imports:
```typescript
import { TOUR_LIST_SELECT, normalizeTour } from '../../../lib/tour-helpers';
```

- [ ] **Step 2: Verify**

Run:
```bash
curl -sS http://localhost:4322/tours/in/greece | python3 -c "
import sys, re
h = sys.stdin.read()
print('TOUR CARDS:', h.count('class=\"tour-card'))
# Extract favouriteCount numbers rendered next to heart svg (format: <svg...heart path...</svg>{count})
fav = re.findall(r'fill=\"currentColor\" viewBox=\"0 0 24 24\">\s*<path d=\"M4\.318 6\.318.*?</svg>\s*(\d+)', h, re.S)
print('COUNTS SEEN:', fav[:16])"
```
Expected: `TOUR CARDS: 16`, COUNTS SEEN list of 16 integers (mostly 0s, that's fine — it means the DB query succeeded and returned zero from the aggregate since no favourites exist yet).

- [ ] **Step 3: Commit**

```bash
git add src/pages/tours/in/\[country\].astro
git commit -m "feat: country hub shows real favourite counts"
```

---

### Task 5: Wire city hub

**Files:**
- Modify: `src/pages/tours/in/[country]/[city].astro:10-55`

- [ ] **Step 1: Update query + mapper**

Identical pattern to Task 4. Replace `.select('*')` with `.select(TOUR_LIST_SELECT)`, replace the inline mapper with `.map(normalizeTour)`, add the import:

```typescript
import { TOUR_LIST_SELECT, normalizeTour } from '../../../../lib/tour-helpers';
```

- [ ] **Step 2: Verify**

```bash
curl -sS http://localhost:4322/tours/in/greece/santorini | grep -c 'class="tour-card'
```
Expected: 3 (Santorini has 3 tours).

- [ ] **Step 3: Commit**

```bash
git add "src/pages/tours/in/[country]/[city].astro"
git commit -m "feat: city hub shows real favourite counts"
```

---

### Task 6: Wire category × country hub

**Files:**
- Modify: `src/pages/tours/category/[category]/in/[country].astro:10-55`

- [ ] **Step 1: Update query + mapper**

Same pattern. Replace `.select('*')` with `.select(TOUR_LIST_SELECT)`, replace inline mapper with `.map(normalizeTour)`, add the import:

```typescript
import { TOUR_LIST_SELECT, normalizeTour } from '../../../../../lib/tour-helpers';
```

- [ ] **Step 2: Verify**

```bash
curl -sS http://localhost:4322/tours/category/hiking-trekking/in/greece | grep -c 'class="tour-card'
```
Expected: 2 (Hiking & Trekking in Greece had 2 tours).

- [ ] **Step 3: Commit**

```bash
git add "src/pages/tours/category/[category]/in/[country].astro"
git commit -m "feat: category×country hub shows real favourite counts"
```

---

### Task 7: Wire agency profile

**Files:**
- Modify: `src/pages/agencies/[slug].astro:20-40`

- [ ] **Step 1: Update query + mapper**

Change:
```typescript
const { data: toursData } = await supabase
  .from('tours')
  .select('*')
  .eq('agency_id', agency.id)
  .eq('status', 'active')
  .order('view_count', { ascending: false });

const tours = (toursData || []).map((t: any) => ({
  ...t,
  images: t.images || [],
  thumbnail: t.images?.[0]?.url || null,
  favouriteCount: 0,
}));
```

to:

```typescript
const { data: toursData } = await supabase
  .from('tours')
  .select(TOUR_LIST_SELECT)
  .eq('agency_id', agency.id)
  .eq('status', 'active')
  .order('view_count', { ascending: false });

const tours = normalizeTours(toursData);
```

Add import:
```typescript
import { TOUR_LIST_SELECT, normalizeTours } from '../../lib/tour-helpers';
```

- [ ] **Step 2: Verify**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:4322/agencies/travel-company-name
```
Expected: `200`. (Visible render still shows "no active tours" for this seed agency because its ID doesn't match the seed tours' agency_id — that data mismatch is out of scope for this plan. The code path is exercised and doesn't throw.)

- [ ] **Step 3: Commit**

```bash
git add "src/pages/agencies/[slug].astro"
git commit -m "feat: agency profile shows real favourite counts"
```

---

### Task 8: Wire related-tours on tour detail

**Files:**
- Modify: `src/pages/tours/[slug].astro:57-85` (the `relatedTours` block)

- [ ] **Step 1: Update query + mapper**

Replace the `relatedTours` candidate fetch (currently around lines 60-85):

```typescript
  // Related tours: same country, different slug, prefer same category
  if (tour.country) {
    const { data: candidates } = await supabase
      .from('tours')
      .select('*')
      .eq('status', 'active')
      .eq('country', tour.country)
      .neq('slug', slug)
      .limit(20);
    if (candidates) {
      const scored = candidates
        .map((c: any) => ({
          t: c,
          score: (c.category === tour.category ? 2 : 0) + (c.city === tour.city ? 1 : 0),
        }))
        .sort((a, b) => b.score - a.score || (b.t.view_count || 0) - (a.t.view_count || 0))
        .slice(0, 4);
      relatedTours = scored.map((s) => ({
        ...s.t,
        images: s.t.images || [],
        thumbnail: s.t.images?.[0]?.url || null,
        favouriteCount: 0,
      }));
    }
  }
```

with:

```typescript
  if (tour.country) {
    const { data: candidates } = await supabase
      .from('tours')
      .select(TOUR_LIST_SELECT)
      .eq('status', 'active')
      .eq('country', tour.country)
      .neq('slug', slug)
      .limit(20);
    if (candidates) {
      const scored = candidates
        .map((c: any) => ({
          t: c,
          score: (c.category === tour.category ? 2 : 0) + (c.city === tour.city ? 1 : 0),
        }))
        .sort((a, b) => b.score - a.score || (b.t.view_count || 0) - (a.t.view_count || 0))
        .slice(0, 4);
      relatedTours = scored.map((s) => normalizeTour(s.t));
    }
  }
```

Add import:
```typescript
import { TOUR_LIST_SELECT, normalizeTour } from '../../lib/tour-helpers';
```

- [ ] **Step 2: Verify**

```bash
curl -sS http://localhost:4322/tours/corfu-yoga-retreat | grep -c "More tours in Greece"
```
Expected: `1` (the related-tours section renders with the heading).

```bash
curl -sS http://localhost:4322/tours/corfu-yoga-retreat | grep -oE 'href="/tours/[a-z-]+"' | grep -v corfu-yoga | head -4
```
Expected: 4 different related-tour slugs rendered.

- [ ] **Step 3: Commit**

```bash
git add "src/pages/tours/[slug].astro"
git commit -m "feat: related tours on detail page show real favourite counts"
```

---

### Task 9: Final verification + production build

- [ ] **Step 1: Grep the codebase — no hardcoded favouriteCount should remain**

Run:
```bash
grep -rn "favouriteCount:\s*0" src/ 2>&1 | grep -v "//\s*"
```
Expected: no output (or only comments).

- [ ] **Step 2: Smoke test every surface**

```bash
for url in / /tours /tours/in/greece /tours/in/greece/santorini /tours/category/hiking-trekking/in/greece /tours/corfu-yoga-retreat /agencies/travel-company-name; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "http://localhost:4322$url")
  echo "$code $url"
done
```
Expected: every line is `200 <url>`.

- [ ] **Step 3: Production build**

```bash
npm run build 2>&1 | tail -5
```
Expected: last line is `[build] Complete!` (Vercel externalization warnings are pre-existing and can be ignored).

- [ ] **Step 4: Final commit**

If grep step 1 found stragglers, fix them now and commit. Otherwise:

```bash
git commit --allow-empty -m "chore: real favourite counts complete — verified all surfaces"
```

---

## Out of scope (explicit, so reviewer doesn't ask)

- **Favouriting a tour in the seed DB to see non-zero counts** — requires seeding `favourites` rows, which is a data task, not a code task. The plan's "correct" state is: real query runs, 0 is a legitimate real answer when no one has favourited.
- **Seed-agency ↔ seed-tours ID mismatch** — noted in Task 7 Step 2; that's a data-seed issue, separate plan if ever needed.
- **`view_count` verification** — already real (set by the update in `/tours/[slug]`). A separate step isn't needed; it's just passed through by `normalizeTour`.
