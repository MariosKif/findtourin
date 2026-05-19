# Internal Linking Audit — findtoursin.com

Audited: 2026-05-09 against the live sitemap (153 URLs) and Astro page templates in `src/pages/`. Goal: surface URLs the on-page link graph reaches weakly or not at all, and flag anchor-text patterns that throw away keyword equity.

This is the kind of work that doesn't move the needle until you act on it — the recommendations at the end are ordered by impact-per-line-of-code.

---

## 1. URL inventory by template (153 total)

| Count | Template | Route |
|---:|---|---|
| 39 | Tour detail | `/tours/{slug}` |
| 22 | Attraction | `/attractions/{country}/{city}/{slug}` |
| 17 | Blog post | `/blog/{slug}` |
| 11 | Neighborhood | `/tours/in/{country}/{city}/neighborhood/{slug}` |
| 11 | Static / hubs | `/`, `/about`, `/about/by-the-numbers`, `/blog`, `/contact`, `/cookies`, `/pricing`, `/press`, `/privacy`, `/terms`, `/trust` |
| 7 | Category × country | `/tours/category/{cat}/in/{country}` |
| 6 | Editorial guide | `/guide/{slug}` |
| 5 | Country hub | `/tours/in/{country}` |
| 5 | City hub | `/tours/in/{country}/{city}` |
| 5 | Agency profile | `/agencies/{slug}` |
| 6 | Section hubs | `/attractions`, `/best`, `/compare`, `/alternatives`, `/guide`, `/itineraries` |
| 4 | Itinerary | `/itineraries/{country}/{days}-days` |
| 4 | Compare | `/compare/findtoursin-vs-{competitor}` |
| 4 | Alternative | `/alternatives/{competitor}-alternatives` |
| 3 | Best-of | `/best/{slug}` |
| 2 | Day-trips-from | `/day-trips-from/{city}` |
| 1 | Author | `/authors/{slug}` |
| 1 | Tours grid | `/tours` |

Plus a handful of intent pages (`/tours/in/{country}/{city}/{intent}`) — sitemap count of these depends on live tour data; not visible in today's snapshot.

---

## 2. The link graph in one paragraph

Every public page renders the global **header** (`/`, `/tours`, `/pricing`, `/blog`, `/about`, `/contact`) and the **mega-footer** in `src/components/common/Footer.astro:66`. The footer is the dominant equity-distribution surface on the site: ~150 inbound links per URL it lists, vs. 1–6 inbound from any single template-level cross-link block. That asymmetry means **the footer is the lever** — anything not in it ranks against a 150× headwind.

Beyond the footer, link concentration follows the entity graph: tour detail pages get fed by hubs (country / city / category-country / attraction / neighborhood / day-trip / itinerary / best-of), and hubs get fed by tour pages and by each other through breadcrumb + "more to explore" pills. Editorial surfaces (guides, blog, compare, alternatives, attractions, neighborhoods, itineraries) are largely siloed: they link out to `/tours` but seldom to specific country/city hubs — and the entity surfaces almost never link *back* to editorial.

---

## 3. Orphans and near-orphans (the headline finding)

### Pure orphans — only inbound is the sitemap

These pages exist, are in the sitemap, but **no public template links to them**. Crawl budget gets spent finding them; PageRank flows out but nothing flows in.

| URLs | Count | Why they're orphans |
|---|---:|---|
| `/tours/in/{country}/{city}/neighborhood/{slug}` | **11** | No template references the route. Verified via grep — only `sitemap-dynamic.xml.ts` and the route file itself reference `/neighborhood/`. Even the city hub at `src/pages/tours/in/[country]/[city].astro` doesn't surface them. |
| `/authors/{slug}` | **1** | Blog posts render the author byline as **plain text** in `src/layouts/BlogLayout.astro:173` (`<span class="font-medium text-gray-700">{author}</span>`). The author page's own breadcrumb schema also references `/authors` (a hub URL that doesn't exist) — a structured-data soft-404. |

### Near-orphans — only inbound is the section hub

These templates have exactly one indexable inbound link (their own `/section/index` page) and miss out on the long tail of cross-linking that the entity surfaces enjoy.

| URLs | Count | Inbound surface |
|---|---:|---|
| `/attractions/{country}/{city}/{slug}` | 22 | `/attractions` hub only |
| `/itineraries/{country}/{days}-days` | 4 | `/itineraries` hub only |
| `/best/{slug}` | 3 | `/best` hub only |
| `/tours/category/{cat}/in/{country}` | 7 | Country hub "Browse by category" only — and **not in the footer** (footer links the search-filter URL instead, see §4) |

### What this looks like in practice

- A user on the **Acropolis attraction page** can't click through to a related neighborhood (Plaka), to the "Things to do in Athens" intent pages, or to a 7-day Greece itinerary — even though all three exist and are topically perfect cross-references.
- A user on a **Rome tour detail page** can't click through to the Trastevere or Monti neighborhood pages, or to attractions like the Colosseum, even though both exist and the tour itself probably visits them.
- A user on the **"7 Days in Greece" itinerary** can't click through to specific city hubs (Athens, Meteora) named in the day plan — only to `/tours/in/greece`.

Every one of these gaps is also a missed AI-citation opportunity: AI engines lift passages plus their inbound link context; isolated pages don't accumulate that context.

---

## 4. Anchor-text findings

The site's anchor text is *usable* but consistently leaves money on the table — five concrete patterns:

### 4.1 Footer category links go to a noindex search URL — major leak

`src/components/common/Footer.astro:144-147`:

```astro
<li><a href={`/tours?category=${encodeURIComponent(c.name)}`} class="text-sm hover:text-white transition-colors">{c.name}</a></li>
```

The mega-footer has 6 of these on every page. They go to the search-filter URL (`/tours?category=...`) — which is a thin search-results page — instead of the indexable category-country pages at `/tours/category/{cat}/in/{country}`. **~150 pages × 6 footer links = ~900 internal links per crawl going to a non-canonical surface.** This is the single largest equity leak on the site.

The fix is to point each footer category to the highest-volume category-country page (e.g. `Cultural` → `/tours/category/cultural/in/greece` if Greece has the most cultural tours). Code can pick the destination automatically since the same loop already counts `categoryCounts`.

### 4.2 Footer country/city anchors lack a keyword

`src/components/common/Footer.astro:120, 133`: country links use bare names ("Greece", "Italy") and city links use bare names ("Athens", "Rome"). Both are reasonable, but the keyword that ranks is `tours in {country}` / `tours in {city}` — and the destination page H1 is exactly that. Today the strongest anchor signal on those URLs comes from the breadcrumb on tour pages, which says "{country}" / "{city}" too. The footer is the single most-repeated link on the site (the highest-leverage anchor change you can make in this codebase).

### 4.3 Footer compare links truncate the brand

`src/components/common/Footer.astro:170`: `vs {c.name}` — two characters of anchor for a compare page that targets queries like "FindToursIn vs GetYourGuide". Should match the page's H1: `FindToursIn vs {competitor}`. Same fix on `/compare/{slug}`'s "Other comparisons" section (`src/pages/compare/[slug].astro:163`).

### 4.4 Hardcoded blog links in the footer rot silently

`src/components/common/Footer.astro:188-190` lists three blog posts by slug. When any of those slugs change or the post is unpublished, the footer ships ~150 dead internal links until someone notices. Replace with a `getCollection('blog')` call that picks the 3 most-recent non-draft posts (same pattern as `Footer.astro:60–63` already does for guides).

### 4.5 Country hub "Cities" cards have no `aria-label`/title

`src/pages/tours/in/[country].astro:155–181`: each city card uses an image-wrapped link with the city name and a tiny tour-count subtitle. The crawled anchor text is "{City} {n} tour(s)" — fine, but it's a missed chance to phrase as "Tours in {City}" which both reads naturally and matches the destination page's title tag.

### 4.6 Generic "Explore further" / "View all →" anchors

Common pattern on attraction, neighborhood, day-trip pages: short link lists labelled "All tours in {City} →", "Browse all attractions →", "Tour-industry glossary →". The keyword anchors are fine; the **generic** ones ("Browse all attractions", "Editorially ranked tours →", "Other itineraries →") could be rewritten with the keyword they should rank for ("Top tour attractions in Europe", "Editor-ranked tours in Greece, Italy, Türkiye"). Smaller leverage than 4.1–4.4 — but free.

---

## 5. Recommended fixes, ranked by impact

Each fix lists the concrete file + line range so you can take it directly. Effort is `S` (under an hour), `M` (a few hours), `L` (half a day or more).

### Tier 1 — should ship this week

1. **Fix the footer category leak** *(S)* — `src/components/common/Footer.astro:144-147`. Change the loop to map each top-N category to the country with the highest count for that category, and link to `/tours/category/{slugify(category)}/in/{slugify(country)}`. Recovers ~900 internal links per crawl onto indexable URLs.

2. **De-orphan the 11 neighborhood pages** *(M)* — `src/pages/tours/in/[country]/[city].astro`. Add a "Neighborhoods to explore in {City}" section between the existing "Browse by category" and "Browse by interest" blocks. Source from `lib/seo/neighborhoods.ts` filtered by city. Anchor text: `{Neighborhood} in {City}` (matches H1 of the neighborhood page). Same change unlocks the city hub → neighborhood link path that the data already supports.

3. **Link the author byline on blog posts** *(S)* — `src/layouts/BlogLayout.astro:173`. Wrap the author span in `<a href={`/authors/${slugify(author)}`}>`. Also fix `src/pages/authors/[slug].astro:108–112` so the breadcrumb schema doesn't claim a `/authors` hub that returns 404 (either ship a tiny hub page, or drop position-2 from the BreadcrumbList until it exists).

4. **Replace hardcoded blog footer links with a `getCollection` query** *(S)* — `src/components/common/Footer.astro:188-190`. Pull the latest 3 non-draft posts by `data.date`. Same pattern is already used on line 60 for guides.

### Tier 2 — should ship this month

5. **Cross-link attraction → neighborhood (and vice versa)** *(M)* — `src/pages/attractions/[country]/[city]/[attraction].astro:157-165` and `src/pages/tours/in/[country]/[city]/neighborhood/[slug].astro:135-143`. The "Explore further" lists currently point at `/attractions` and `/guide/glossary`; replace those slots with topically relevant siblings: an attraction in Plaka should link to the Plaka neighborhood page, and the Plaka page should link to the Acropolis attraction. Computable from `lib/seo/attractions.ts` + `lib/seo/neighborhoods.ts` by `(country, city)`.

6. **Wire itineraries to city + day-trip + attraction pages** *(M)* — `src/pages/itineraries/[country]/[duration].astro`. The day plan already names cities ("Base: Athens"); link the city name to `/tours/in/{country}/{city}`. The "Related" footer block on the page also misses day-trips and attractions in the country — add them.

7. **Cross-link compare ↔ alternative for the same competitor** *(S)* — `src/pages/compare/[slug].astro` and `src/pages/alternatives/[slug].astro`. Each page should link to its mirror (`/compare/findtoursin-vs-X` ↔ `/alternatives/X-alternatives`). Today they're parallel silos.

8. **Fix anchor text on the 4 highest-leverage footer link classes** *(S)* — country, city, compare, and (after fix #1) category. Pattern: prepend the keyword. `<a>{c.name}</a>` → `<a>Tours in {c.name}</a>`. **Side-effect**: site's most-repeated anchor changes from a bare entity name to a keyword phrase — measurable lift in Search Console queries within 4–6 weeks if anything is going to move at all.

9. **Surface curated guides in the country/city hub sidebars** *(M)* — `src/pages/tours/in/[country].astro` and `[country]/[city].astro`. Today the only path from a destination hub to an editorial guide is via the global footer. Add a "Plan your trip" block that renders 2–3 country-relevant guides (e.g. on `/tours/in/greece` show `/guide/booking-tours-safely`, `/guide/tour-vs-self-guided`, plus any guide whose `category` is `'destination'` and whose body mentions Greece).

### Tier 3 — nice to have

10. **Tour detail → agency contact card already links to `/agencies/{slug}`** ✓ (`src/components/tours/AgencyContactCard.astro:91-112`) — keep this as is, but consider adding `aria-label="View {agencyName} agency profile"` so the anchor text in crawl is `{agencyName}` rather than the visually concatenated "{agencyName} View agency profile →".

11. **Country hub: link "Other destinations" to itineraries when one exists** *(S)* — `src/pages/tours/in/[country].astro:227-232`. The chip says "Tours in {country} {count}" — when an itinerary exists for `{country}`, render a second chip "{n}-day {country} itinerary →" linking to the matching itinerary page.

12. **Add a `/authors` index hub** *(S)* — Even with one author today, the absence of `src/pages/authors/index.astro` breaks the BreadcrumbList schema on `/authors/{slug}` (it references a 404). Ship a one-screen index that lists known authors and points to their pages.

---

## 6. What this should accomplish

- **Indexability**: removes 11 + 1 = 12 orphan URLs from the "discovered, not crawled" / "discovered, not indexed" Search Console buckets within 1–2 crawl cycles.
- **Equity redistribution**: the footer category fix alone moves ~900 internal links per crawl from a noindex search filter onto 6 indexable category-country pages. Those pages today have effectively 1 inbound link; after the fix they have ~150.
- **Anchor diversity**: the site's top inbound anchor for `/tours/in/greece` shifts from `Greece` to `Tours in Greece` — closer to the page's actual H1 and target keyword.
- **AI-citation footprint**: cross-linking attractions ↔ neighborhoods ↔ city hubs ↔ itineraries gives each entity surface 3–4 contextually relevant siblings, which is the signal AI engines (Google AI Overviews, Perplexity, ChatGPT) use to lift a passage with confidence.

None of this is fast. Internal-link changes ride the next full crawl + reindex (typically 4–8 weeks for noticeable Search Console movement). Treat the change as the reset; track impressions per template (not per URL) to see whether equity actually flowed where you redirected it.
