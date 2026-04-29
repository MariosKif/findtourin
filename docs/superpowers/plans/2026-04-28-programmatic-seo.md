# Programmatic SEO for Tour Landing Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Sharpen the SEO of the existing country/city/category landing pages so Google indexes the strong combos and ignores the thin ones, surfaces aggregate signals (price ranges, tour counts, geo), and gets internally linked from blog posts and other landing pages so they accumulate link equity.

**Architecture:** Five focused improvements layered on top of `src/pages/tours/in/[country].astro`, `src/pages/tours/in/[country]/[city].astro`, `src/pages/tours/category/[category]/in/[country].astro`, and `src/lib/destinations.ts`. (1) Index-or-noindex gate by tour count to kill thin pages. (2) Backfill `COUNTRY_COPY` for every country we have ≥3 tours in. (3) Add `Place` / geo schema and price-range aggregate. (4) Cross-link existing Greece blogs to country/city landing pages instead of `/tours?country=Greece`. (5) Refresh `llms.txt` and `llms-full.txt` with the canonical landing URLs so AI citation surfaces them.

**Tech Stack:** Astro 6 SSR + Supabase + TypeScript. JSON-LD via `<script type="application/ld+json">` (already the project's pattern).

## Codebase facts (verified during pre-flight)

- The three landing pages already render: hero, intro, cities/categories grid, tour grid, FAQ, plus 4 JSON-LD blocks (`TouristDestination`, `BreadcrumbList`, `ItemList`, `FAQPage`).
- `lib/destinations.ts` exports `COUNTRY_COPY` (currently 4 entries — Greece, Bulgaria, Albania, plus a default fallback) and `CITY_COPY` (~20 cities). The fallback `getCountryCopy` returns a generic stub for missing countries — pages still render but with vague copy.
- `PublicLayout` already supports `noIndex` and `canonical` props (used by auth pages and the layout itself).
- `public/llms.txt` and `public/llms-full.txt` exist and are surfaced to AI crawlers.
- New blog posts created earlier link to `/tours?country=Greece` (filter URL). The richer landing pages live at `/tours/in/greece` etc.
- Sitemap-dynamic at `/sitemap-dynamic.xml` already enumerates country / city / category landing URLs from active tours.

## Decisions captured

| Question | Decision |
|---|---|
| Thin-content threshold | <3 tours in a combo → `<meta name="robots" content="noindex, follow">` so the page still passes link equity but doesn't compete for queries. |
| When to redirect vs render-noindex | Tour count 0 → redirect to `/tours` (existing behaviour). 1-2 tours → render with `noindex,follow`. ≥3 → fully indexable. |
| Country copy coverage | Add entries for any country with ≥3 active tours in production. Skip ones with <3 (they're noindex anyway). |
| Schema enrichment | Add `Place` with `name` + `addressCountry`, `priceRange` from min/max tour price, `numberOfItems` on the ItemList. Keep `TouristDestination` block. |
| Blog → landing internal links | Replace at least 2 `/tours?country=Greece` instances per Greece blog with `/tours/in/greece`. Don't strip the filter URLs entirely — the existing filter UX is fine. |
| llms.txt | Add canonical landing URLs for the top countries (≥10 tours) so LLM crawlers cite the rich landing pages, not the filter URL. |

---

### Task 1: Indexability gate by tour count

**Files:**
- Modify: `src/pages/tours/in/[country].astro`
- Modify: `src/pages/tours/in/[country]/[city].astro`
- Modify: `src/pages/tours/category/[category]/in/[country].astro`

- [ ] **Step 1: Country page — derive `noIndex` and pass to layout**

In `src/pages/tours/in/[country].astro`, just after `const tourCount = tours.length;` (around line 46), add:

```typescript
const INDEX_MIN_TOURS = 3;
const noIndex = tourCount < INDEX_MIN_TOURS;
```

Then change the layout invocation:

```astro
<PublicLayout title={pageTitle} description={metaDescription} image={copy.heroImage} noIndex={noIndex}>
```

- [ ] **Step 2: City page — same change**

Open `src/pages/tours/in/[country]/[city].astro`. Add the same `INDEX_MIN_TOURS` constant and `noIndex` derivation after the tour-count is computed, then pass `noIndex={noIndex}` to `<PublicLayout>`.

- [ ] **Step 3: Category × country page — same change**

Open `src/pages/tours/category/[category]/in/[country].astro`. Same pattern.

- [ ] **Step 4: Verify `PublicLayout` honors `noIndex`**

```bash
grep -n "noIndex" src/layouts/PublicLayout.astro src/layouts/Layout.astro
```

If `PublicLayout` already passes `noIndex` to `Layout` (which renders the meta robots tag at `Layout.astro:46`), no change needed. If not, add the prop wiring.

- [ ] **Step 5: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add "src/pages/tours/in/[country].astro" "src/pages/tours/in/[country]/[city].astro" "src/pages/tours/category/[category]/in/[country].astro"
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(seo): noindex thin landing pages (<3 tours)"
```

---

### Task 2: Backfill `COUNTRY_COPY` for production countries with ≥3 tours

**Files:**
- Modify: `src/lib/destinations.ts`

- [ ] **Step 1: Discover which countries need copy**

Via Supabase Management API (with a fresh PAT — revoke after):

```bash
SUPABASE_PAT=<token> node -e '
const url = "https://api.supabase.com/v1/projects/fyhdsmeiystsehdsipar/database/query";
const sql = `select country, count(*) c from tours where status = '"'"'active'"'"' group by 1 order by 2 desc;`;
fetch(url, { method: "POST", headers: { Authorization: `Bearer ${process.env.SUPABASE_PAT}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) })
  .then(r => r.json()).then(rows => rows.forEach(r => console.log(`${r.c}\t${r.country}`)));
'
```

Capture the output. Any country with `c >= 3` that isn't in `COUNTRY_COPY` needs an entry.

- [ ] **Step 2: Add the missing entries**

For each missing country, add to the `COUNTRY_COPY` map in `src/lib/destinations.ts`. Use the existing entries (Greece, Bulgaria, Albania) as a template. Each entry needs:
- `name` — canonical name as it appears in the DB
- `tagline` — 50-80 chars
- `intro` — 2-3 sentences, mentions FindToursIn naturally, ends with a CTA hook
- `whenToVisit` — 1-2 sentences with month windows
- `mustSee` — 4-6 short attraction names
- `heroImage` — Unsplash URL with `?w=2000&h=900&fit=crop` query, or a local `/images/<slug>.jpg` if you've uploaded one

Concrete shape (don't paste this verbatim — write actual copy for each country):

```typescript
turkey: {
  name: 'Turkey',
  tagline: 'Bridging Europe and Asia, from Istanbul to Cappadocia',
  intro:
    "Turkey packs Roman ruins, Ottoman palaces, and surreal volcanic landscapes into a single trip. Local agencies on FindToursIn run small-group tours from Istanbul's bazaars to the hot-air-balloon dawns of Cappadocia and the Lycian coast's blue-cruise sailing.",
  whenToVisit:
    'April-June and September-October offer the best weather for sightseeing. July-August is ideal for the Aegean coast but very hot inland.',
  mustSee: ['Hagia Sophia', 'Cappadocia balloon flights', 'Ephesus ruins', 'Pamukkale', 'Lycian Way trek', 'Bosphorus cruise'],
  heroImage: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=2000&h=900&fit=crop',
},
```

- [ ] **Step 3: Type-check + build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add src/lib/destinations.ts
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(seo): backfill country SEO copy for production countries"
```

---

### Task 3: Schema enrichment — `Place`, price range, ItemList numberOfItems

**Files:**
- Modify: `src/pages/tours/in/[country].astro`
- Modify: `src/pages/tours/in/[country]/[city].astro` (mirror)
- Modify: `src/pages/tours/category/[category]/in/[country].astro` (mirror)

- [ ] **Step 1: Compute `priceRange` and `priceMax`**

In `src/pages/tours/in/[country].astro`, after the existing `priceFrom` line (around line 47), add:

```typescript
const priceMax = Math.max(...tours.map((t: any) => Number(t.price) || 0));
const priceRange = isFinite(priceFrom) && priceMax > 0
  ? (priceFrom === priceMax ? `€${priceFrom}` : `€${priceFrom}-€${priceMax}`)
  : null;
```

- [ ] **Step 2: Add a `Place` JSON-LD block**

In the same file, after the existing `TouristDestination` script tag, add:

```astro
  <!-- Place / geo for the destination -->
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Place",
    "name": countryName,
    "address": { "@type": "PostalAddress", "addressCountry": countryName },
    ...(priceRange ? { "priceRange": priceRange } : {}),
  })} />
```

- [ ] **Step 3: Update `ItemList` to include `numberOfItems`**

Change the existing ItemList block:

```astro
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": tourCount,
    "itemListElement": toursGridData.slice(0, 10).map((t: any, i: number) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `https://www.findtoursin.com/tours/${t.slug}`,
      "name": t.name,
    })),
  })} />
```

- [ ] **Step 4: Mirror to city + category pages**

Apply Steps 1-3 to `src/pages/tours/in/[country]/[city].astro` and `src/pages/tours/category/[category]/in/[country].astro`. The `Place.name` for the city page is the city name; for the category × country page, use `${categoryName} tours in ${countryName}` as the Place.name and keep the address as the country.

- [ ] **Step 5: Build + commit**

```bash
cd /Users/marios/Desktop/Cursor/worldoftours && npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours add "src/pages/tours/in/[country].astro" "src/pages/tours/in/[country]/[city].astro" "src/pages/tours/category/[category]/in/[country].astro"
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(seo): add Place schema and price range to landing pages"
```

---

### Task 4: Cross-link Greece blogs to landing pages instead of filter URLs

**Files:**
- Modify: `src/content/blog/best-greece-tours-summer-2026.mdx`
- Modify: `src/content/blog/crete-travel-guide-2026.mdx`
- Modify: `src/content/blog/santorini-tours-2026.mdx`
- Modify: `src/content/blog/greek-island-hopping-routes-2026.mdx`
- Modify: `src/content/blog/athens-day-trips-2026.mdx`
- Modify: `src/content/blog/greek-food-tours-2026.mdx`

- [ ] **Step 1: Replace filter-URL anchors with landing-page anchors**

For each Greece blog, replace ONE OR TWO occurrences of `https://www.findtoursin.com/tours?country=Greece` with `https://www.findtoursin.com/tours/in/greece`. Pick the most natural ones (the broad "explore tours in Greece" anchor, not the specific category filters).

For Crete, Santorini, and Athens-themed blogs, also replace one mid-article internal link with the more specific landing:

| Blog | One original link | Replacement |
|---|---|---|
| `crete-travel-guide-2026.mdx` | `https://www.findtoursin.com/tours?country=Greece` | `https://www.findtoursin.com/tours/in/greece/crete` |
| `santorini-tours-2026.mdx` | `https://www.findtoursin.com/tours?country=Greece` | `https://www.findtoursin.com/tours/in/greece/santorini` |
| `athens-day-trips-2026.mdx` | one filter URL | `https://www.findtoursin.com/tours/in/greece/athens` |
| `greek-island-hopping-routes-2026.mdx` | one filter URL | `https://www.findtoursin.com/tours/in/greece` |
| `greek-food-tours-2026.mdx` | one filter URL | `https://www.findtoursin.com/tours/in/greece` |
| `best-greece-tours-summer-2026.mdx` | one filter URL | `https://www.findtoursin.com/tours/in/greece` |

**Important:** preserve the existing 9+ internal-link count. Each blog should still have ≥9 internal links — you're swapping link targets, not removing them. After your edits, run a quick count to confirm:

```bash
for f in src/content/blog/*-2026.mdx; do
  cnt=$(grep -oE "https://www.findtoursin.com|/tours[^)]*|/blog/[^)]*|/about|/contact" "$f" | wc -l)
  printf "  %-50s  internal links: %d\n" "$(basename $f)" "$cnt"
done
```

Each line should still show ≥9.

- [ ] **Step 2: Spot-check the rendered pages**

```bash
npm run build 2>&1 | tail -3
# Then if you have a dev server running, visit /blog/crete-travel-guide-2026 and confirm the new "/tours/in/greece/crete" anchor renders as a link.
```

- [ ] **Step 3: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add src/content/blog/best-greece-tours-summer-2026.mdx src/content/blog/crete-travel-guide-2026.mdx src/content/blog/santorini-tours-2026.mdx src/content/blog/greek-island-hopping-routes-2026.mdx src/content/blog/athens-day-trips-2026.mdx src/content/blog/greek-food-tours-2026.mdx
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(seo): blog posts link to landing pages instead of filter URLs"
```

---

### Task 5: Refresh `llms.txt` with landing-page URLs

**Files:**
- Modify: `public/llms.txt`
- Modify: `public/llms-full.txt`

- [ ] **Step 1: Read current `llms.txt`**

```bash
cat public/llms.txt
```

Note the existing structure (likely a list of "## Section / - title - URL").

- [ ] **Step 2: Add a "Top destinations" section**

In `public/llms.txt`, add (or extend) a destinations section listing the top countries we have ≥10 tours in. Use the same format the existing sections use. Example:

```
## Top destinations

- Tours in Greece: https://www.findtoursin.com/tours/in/greece
- Tours in Albania: https://www.findtoursin.com/tours/in/albania
- Tours in Bulgaria: https://www.findtoursin.com/tours/in/bulgaria
- Tours in Italy: https://www.findtoursin.com/tours/in/italy
- Tours in Turkey: https://www.findtoursin.com/tours/in/turkey
```

(Replace with the actual top countries from the Task 2 query output.)

- [ ] **Step 3: Mirror to `llms-full.txt`** with one-paragraph blurbs from each `COUNTRY_COPY[country].intro`. Keep the file small enough to fit in an LLM context window — under ~10KB.

- [ ] **Step 4: Commit**

```bash
git -C /Users/marios/Desktop/Cursor/worldoftours add public/llms.txt public/llms-full.txt
git -C /Users/marios/Desktop/Cursor/worldoftours commit -m "feat(seo): add top-destination landing URLs to llms.txt"
```

---

### Task 6: Final smoke + push

- [ ] **Step 1: Spot-check rendered HTML**

Build and serve. Then check:

```bash
npm run build 2>&1 | tail -3
npm run dev > /tmp/dev.log 2>&1 &
sleep 6
node -e '
(async () => {
  const r = await fetch("http://localhost:4321/tours/in/greece");
  const html = await r.text();
  const checks = [
    ["Place schema", html.includes(`"@type":"Place"`) || html.includes(`@type": "Place"`)],
    ["priceRange in JSON-LD", /priceRange/.test(html)],
    ["numberOfItems in ItemList", /numberOfItems/.test(html)],
    ["No noindex (Greece has many tours)", !/<meta name="robots"[^>]*noindex/.test(html)],
  ];
  checks.forEach(([n,ok]) => console.log(ok ? "✓" : "✗", n));
})();
'
# kill the dev server
pkill -f "astro dev" 2>/dev/null || true
```

Expected: 4/4 ✓.

- [ ] **Step 2: Production build + push**

```bash
npm run build 2>&1 | tail -3
git -C /Users/marios/Desktop/Cursor/worldoftours push origin main
```

After deploy: in Google Search Console, request indexing on `/tours/in/greece`, `/tours/in/greece/santorini`, and a couple of category × country combos to nudge re-crawl.

---

## Out of scope (intentionally — flag if you disagree)

- Generating brand-new dynamic routes (e.g., a pure `/tours/category/[category]` without country pairing). Today's category pages always pair with a country, which is the better pattern for query-intent capture.
- Programmatic blog-post generation per country/city. Quality > quantity; the manually-written blog posts already cover Greece deep.
- AggregateRating schema on tours. Requires real review/rating data on the `tours` row; we don't have a review system yet.
- Multilingual / hreflang. Site is English only.
- Migrating filter URLs (`/tours?country=Greece`) to redirect to landing pages. Filter URLs serve a different intent (faceted browsing) and Google can resolve them via the canonical/sitemap signals.
- Auto-Pinging Google with IndexNow on every tour insert. Possible follow-up; the dynamic sitemap already covers daily indexing.
