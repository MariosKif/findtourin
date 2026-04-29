# Tour Gallery Hero + Lightbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current "1 hero image + horizontal thumb strip" tour gallery with a GetYourGuide-style 5-cell hero layout (1 large left + 2×2 grid right), an always-visible **See all photos** pill in the bottom-right of the last cell, and a full-screen lightbox modal that opens on click and shows every image at full size with keyboard/touch navigation.

**Architecture:** Pure server-rendered Astro hero with a single `<dialog>` element for the modal. No new client framework — vanilla JS + the native HTML5 `<dialog>` for ESC/scrim/a11y handling. A tiny typed string-table module (`src/lib/i18n.ts`) holds the button label in every locale we plan to support; the page reads `Astro.currentLocale` (or falls back to `en`). Existing seed data has 1 image per tour, so the layout must degrade cleanly when fewer than 5 images are present.

**Tech Stack:** Astro 6 SSR, Tailwind, native `<dialog>` element, vanilla JS.

**Discovery already done (2026-04-29):**
- Current gallery component: `src/components/tours/TourGallery.astro`. It renders a single hero `<img>` and a horizontal `<button>` thumb strip; clicking a thumb swaps the hero `src`.
- 39 production tours, each currently has exactly 1 image (Supabase Storage URL after the migration earlier today). The new layout therefore needs sensible behaviour for 1-image, 2–4-image, and 5+-image cases.
- Astro is configured English-only — no `i18n` block in `astro.config.mjs`, no locale routing, no translation files. The user's screenshot shows "Δες τα όλα" (Greek) as the desired button label, signalling intent to translate. Plan introduces a minimal string-table module that's ready to expand without renaming.
- GetYourGuide blocks unauthenticated WebFetch (403), so the visual reference is the screenshot the user attached: 1 large image (50% width, full height) on the left, 4 smaller images (25% width each, half height) in a 2×2 grid on the right, "See all" pill button overlaid on the last (bottom-right) cell.

---

## File Map

| File | Change |
|---|---|
| `src/lib/i18n.ts` | **Create.** Typed string table with locale keys, single `t(key, locale?)` helper. |
| `src/components/tours/TourGallery.astro` | **Rewrite.** New 5-cell hero grid + dialog markup + open/close JS. Backwards compatible with the existing `images: { url; altText? }[]` prop. |
| `src/pages/tours/[slug].astro` | **Modify** (1 line). Pass `Astro.currentLocale` (or fallback) to TourGallery so the button label respects the request locale once locales exist. |
| Production smoke | Hit a tour detail page on prod, screenshot the new hero, click "See all", screenshot the modal. |

The TourGallery component grows but stays focused on one responsibility (gallery rendering + the modal that pairs with it). No need to split.

---

## Task 1: Tiny i18n string-table module

**Files:**
- Create: `src/lib/i18n.ts`

**Why we're doing this even though we ship one locale today:** the user explicitly asked for the button to be "translated in all the languages we have." Since we have none, the most honest deliverable is a single source of truth that's ready for the day a locale is added — the alternative (hardcoding "See all photos" in the component) is exactly what we'd have to rip out tomorrow.

- [ ] **Step 1: Create the file**

```typescript
// src/lib/i18n.ts
//
// Minimal string table for user-visible UI copy that needs translation.
// We currently render English on every route — so for every key the `en`
// entry is the only one used. The other locale entries are kept here as a
// landing pad: when a locale ships, fill the blanks here and pass the
// matching code via `Astro.currentLocale` to consumers.
//
// Usage:
//   import { t } from '../../lib/i18n';
//   const label = t('gallery.seeAll', Astro.currentLocale);

export const LOCALES = ['en', 'el', 'it', 'fr', 'de', 'es'] as const;
export type Locale = typeof LOCALES[number];

type StringEntry = Record<Locale, string>;

const STRINGS = {
  'gallery.seeAll': {
    en: 'See all photos',
    el: 'Δες τα όλα',
    it: 'Vedi tutte le foto',
    fr: 'Voir toutes les photos',
    de: 'Alle Fotos anzeigen',
    es: 'Ver todas las fotos',
  },
} as const satisfies Record<string, StringEntry>;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, locale: string | undefined = 'en'): string {
  const safe: Locale = (LOCALES as readonly string[]).includes(locale ?? '')
    ? (locale as Locale)
    : 'en';
  return STRINGS[key][safe];
}
```

- [ ] **Step 2: Build to verify TS compiles**

```bash
npm run build
```

Expected: `[build] Complete!`. The `as const satisfies …` shape ensures the table stays exhaustive: adding a key with a missing locale fails type-check.

- [ ] **Step 3: Commit**

```bash
git add src/lib/i18n.ts
git commit -m "feat(i18n): minimal string-table module for translatable UI copy"
```

---

## Task 2: Rewrite TourGallery to GYG-style hero + lightbox

**Files:**
- Modify: `src/components/tours/TourGallery.astro`

This task replaces the existing implementation top-to-bottom. The component takes the same props and accepts an optional `locale`.

- [ ] **Step 1: Replace the file with the new implementation**

Write to `src/components/tours/TourGallery.astro`:

````astro
---
import { t } from '../../lib/i18n';

interface Props {
  images: {
    url: string;
    altText?: string | null;
  }[];
  locale?: string;
}

const { images, locale } = Astro.props;
const hasImages = images.length > 0;

// Hero shows up to 5 images: 1 large + 4 thumbnails. Anything beyond that
// is hidden in the hero but still rendered inside the modal.
const heroImages = images.slice(0, 5);
const heroPad = Math.max(0, 5 - heroImages.length); // empty cells if <5

const seeAllLabel = t('gallery.seeAll', locale);

// Show the "See all" pill only when we have at least one image AND there
// are images beyond what the hero displays. With only 1 image, there's
// nothing additional to reveal, so we hide it.
const showSeeAll = images.length > 1;
---

{hasImages ? (
  <div class="tour-gallery">
    {/* Hero grid: 1 large left + 2x2 small right */}
    <div class="grid h-[260px] gap-2 overflow-hidden rounded-2xl sm:h-[360px] md:h-[460px] md:grid-cols-2">
      {/* Large left image */}
      <button
        type="button"
        class="gallery-trigger relative block h-full w-full overflow-hidden bg-gray-100"
        data-index="0"
        aria-label={`View photo 1 of ${images.length}`}
      >
        <img
          src={heroImages[0].url}
          alt={heroImages[0].altText || 'Tour image 1'}
          class="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          loading="eager"
        />
      </button>

      {/* Right 2x2 grid — only renders on md+ */}
      <div class="hidden h-full grid-cols-2 grid-rows-2 gap-2 md:grid">
        {Array.from({ length: 4 }).map((_, i) => {
          const idx = i + 1;
          const img = heroImages[idx];
          return (
            <div class="relative h-full w-full overflow-hidden bg-gray-100">
              {img ? (
                <button
                  type="button"
                  class="gallery-trigger block h-full w-full"
                  data-index={idx}
                  aria-label={`View photo ${idx + 1} of ${images.length}`}
                >
                  <img
                    src={img.url}
                    alt={img.altText || `Tour image ${idx + 1}`}
                    class="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                    loading="lazy"
                  />
                </button>
              ) : (
                <div class="h-full w-full bg-gray-200" aria-hidden="true"></div>
              )}

              {/* "See all" pill — overlaid on the last hero cell */}
              {showSeeAll && idx === 4 && (
                <button
                  type="button"
                  id="gallery-see-all"
                  class="absolute bottom-3 right-3 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-gray-900 shadow-md backdrop-blur transition hover:bg-white"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span>{seeAllLabel}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* Lightbox modal — uses native <dialog> for ESC + a11y */}
    <dialog
      id="gallery-modal"
      class="m-0 h-full max-h-[100vh] w-full max-w-[100vw] bg-black/95 p-0 backdrop:bg-black/95"
      aria-label={seeAllLabel}
    >
      <div class="relative flex h-full w-full flex-col">
        <header class="sticky top-0 z-10 flex items-center justify-between bg-black/60 px-4 py-3 text-white backdrop-blur">
          <span id="gallery-modal-counter" class="text-sm font-medium" aria-live="polite">1 / {images.length}</span>
          <button
            type="button"
            id="gallery-modal-close"
            class="rounded-full p-2 hover:bg-white/10"
            aria-label="Close gallery"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div id="gallery-modal-scroll" class="flex-1 overflow-y-auto">
          <div class="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
            {images.map((img, i) => (
              <figure class="overflow-hidden rounded-xl bg-black" data-modal-img data-index={i}>
                <img
                  src={img.url}
                  alt={img.altText || `Tour photo ${i + 1}`}
                  class="h-auto w-full object-contain"
                  loading={i < 2 ? 'eager' : 'lazy'}
                />
              </figure>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  </div>
) : (
  <div class="flex h-[400px] items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-500 md:h-[500px]">
    <svg class="h-24 w-24 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
)}

<script>
  (() => {
    const modal = document.getElementById('gallery-modal') as HTMLDialogElement | null;
    const closeBtn = document.getElementById('gallery-modal-close');
    const seeAll = document.getElementById('gallery-see-all');
    const counter = document.getElementById('gallery-modal-counter');
    const scrollContainer = document.getElementById('gallery-modal-scroll');
    const triggers = document.querySelectorAll<HTMLButtonElement>('.gallery-trigger');
    if (!modal) return;

    const total = document.querySelectorAll('[data-modal-img]').length;

    function openAt(index: number) {
      modal!.showModal();
      // Lock background scroll while modal is open.
      document.body.style.overflow = 'hidden';
      // Scroll the requested image into view inside the modal.
      const target = document.querySelector<HTMLElement>(`[data-modal-img][data-index="${index}"]`);
      target?.scrollIntoView({ behavior: 'instant', block: 'start' });
      updateCounter(index + 1);
    }

    function close() {
      modal!.close();
      document.body.style.overflow = '';
    }

    function updateCounter(current: number) {
      if (counter) counter.textContent = `${current} / ${total}`;
    }

    seeAll?.addEventListener('click', () => openAt(0));
    triggers.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = Number(btn.dataset.index || 0);
        openAt(idx);
      });
    });
    closeBtn?.addEventListener('click', close);

    // Native <dialog> emits 'close' on ESC; mirror our scroll-unlock there.
    modal.addEventListener('close', () => {
      document.body.style.overflow = '';
    });

    // Click-outside-to-close: clicks on the dialog element itself (not its
    // children) land on the backdrop area in browsers that hit-test that way.
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    // Update the counter as the user scrolls through the modal's image list.
    if (scrollContainer) {
      const figures = scrollContainer.querySelectorAll<HTMLElement>('[data-modal-img]');
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const idx = Number((entry.target as HTMLElement).dataset.index || 0);
              updateCounter(idx + 1);
            }
          }
        },
        { root: scrollContainer, threshold: 0.5 }
      );
      figures.forEach((f) => observer.observe(f));
    }
  })();
</script>
````

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 3: Commit**

```bash
git add src/components/tours/TourGallery.astro
git commit -m "feat(tours): GYG-style 5-cell gallery hero + lightbox modal"
```

---

## Task 3: Wire `Astro.currentLocale` from the tour detail page

**Files:**
- Modify: `src/pages/tours/[slug].astro` — single call site of `<TourGallery />`.

The page already passes `images={images}`. We just add the locale.

- [ ] **Step 1: Locate the existing `<TourGallery>` usage**

```bash
grep -n "TourGallery" src/pages/tours/\[slug\].astro
```

Expected: a single `<TourGallery images={images} />` somewhere around line 130.

- [ ] **Step 2: Edit it to pass the locale**

Replace `<TourGallery images={images} />` with:

```astro
<TourGallery images={images} locale={Astro.currentLocale} />
```

For now, `Astro.currentLocale` will resolve to `undefined` (no locale config), and the helper falls back to `en` — same string as before, but the prop is wired so a future i18n config doesn't require touching this page.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: `[build] Complete!`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/tours/\[slug\].astro
git commit -m "feat(tours): forward Astro.currentLocale to gallery for translation"
```

---

## Task 4: Push, smoke, screenshot

- [ ] **Step 1: Push**

```bash
git push 'https://MariosKif:${GH_PAT}@github.com/MariosKif/findtourin.git' main
```

- [ ] **Step 2: Wait ~90s for Vercel redeploy**

- [ ] **Step 3: Screenshot smoke**

Create `scripts/_smoke-gallery.mjs`:

```javascript
import { chromium } from 'playwright';
const SITE = 'https://www.findtoursin.com';
const SLUG = '/tours/cinque-terre-trail';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`${SITE}${SLUG}?cb=${Date.now()}`, { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/gallery-hero.png' });
const seeAll = page.locator('#gallery-see-all');
const seeAllVisible = await seeAll.isVisible().catch(() => false);
console.log(`see-all visible: ${seeAllVisible}`);
if (seeAllVisible) {
  await seeAll.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/gallery-modal.png' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}
await browser.close();
```

Run: `node scripts/_smoke-gallery.mjs`
Expected: prints `see-all visible: false` (Cinque Terre tour has 1 image so the See-all button is intentionally hidden — this validates the degradation rule). For a tour with multiple images the value would be `true`.

The two screenshots (hero, modal) are written to `/tmp/` for the human to eyeball. Delete them once the deploy is verified.

- [ ] **Step 4: Delete the smoke script**

```bash
rm scripts/_smoke-gallery.mjs
```

This task does not produce a commit.

---

## Self-Review

**Spec coverage:**
- 1 large + 2×2 small layout → Task 2 (the `<div class="grid h-... md:grid-cols-2">` wrapper + the 4-cell inner grid) ✅
- "See all" pill in bottom-right of last cell → Task 2 (`#gallery-see-all`, conditional on `showSeeAll`) ✅
- Button text translated across all "languages we have" → Task 1 (`STRINGS['gallery.seeAll']` for en/el/it/fr/de/es) + Task 3 (locale wired through) ✅
- Click button → opens a full lightbox like GYG → Task 2 (native `<dialog>`, vertical scroll list of every image, counter, ESC-to-close, click-outside-to-close) ✅
- Recreate the GYG look → 5-cell desktop layout, mobile collapses to single hero (md:grid-cols-2), backdrop dim, max-width 5xl content column ✅

**Placeholder scan:** No "TBD" / "fill in details" / "similar to Task N" prose. Every code block is the actual code that lands in the repo.

**Type/name consistency:**
- Component prop is `images: { url; altText? }[]` (matches the existing usage in `[slug].astro`).
- Optional `locale?: string` accepts `Astro.currentLocale`'s `string | undefined`, the i18n helper coerces unknown values back to `en`.
- IDs (`gallery-modal`, `gallery-modal-close`, `gallery-modal-counter`, `gallery-modal-scroll`, `gallery-see-all`) are unique and scoped to the gallery — no collisions with the rest of `[slug].astro`.

**Out-of-scope (intentionally):**
- Adding a locale-routing layer to Astro. We're providing the string-table the moment they add `el`/`it`/etc. to `astro.config.mjs`, no rewrite needed.
- Image optimisation (Astro `<Image />` / Vercel asset pipeline). The current Supabase Storage URLs are large; that's worth a separate plan.
- Keyboard arrow-left/right to step photos inside the modal. The vertical-scroll modal makes this less critical — every image is reachable via natural scroll. Add it if user demand surfaces.
