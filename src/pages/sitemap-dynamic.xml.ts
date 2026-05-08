import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { supabase } from '../lib/supabase';
import { slugify, getCityIntentCopy, getDayTripCopy } from '../lib/destinations';
import { INTENT_SLUGS, tourMatchesIntent, MIN_TOURS_FOR_INDEX } from '../lib/programmatic';
import { GUIDES } from '../lib/seo/guides';
import { COMPETITORS } from '../lib/seo/competitors';
import { AUTHORS } from '../lib/seo/authors';
import { BEST_OF } from '../lib/seo/best-of';
import { ITINERARIES } from '../lib/seo/itineraries';
import { ATTRACTIONS } from '../lib/seo/attractions';
import { NEIGHBORHOODS } from '../lib/seo/neighborhoods';

export const prerender = false;

const SITE = 'https://www.findtoursin.com';

// Agency slugs that exist in the DB but should never appear in the sitemap —
// test/seed accounts left over from earlier development.
const AGENCY_BLOCKLIST = new Set(['test', 'travel-company-name', 'smoke-travel-co']);

const dateOnly = (s: string | undefined | null) =>
  s ? new Date(s).toISOString().slice(0, 10) : undefined;

// XML-escape strings used inside <loc> / <image:loc>. Image URLs that
// contain & (typical for Supabase render/image URLs with width and
// quality params) need to be encoded or sitemap parsers reject the file.
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Static, hand-curated public pages. Kept here (not in a separate sitemap)
// so a single sitemap is the source of truth for Search Console.
const STATIC_PAGES = [
  '',
  '/about',
  '/about/by-the-numbers',
  '/blog',
  '/contact',
  '/pricing',
  '/press',
  '/tours',
  '/guide',
  '/guide/glossary',
  '/compare',
  '/alternatives',
  '/best',
  '/itineraries',
  '/attractions',
  '/privacy',
  '/terms',
  '/cookies',
  '/trust',
];

interface UrlEntry {
  loc: string;
  lastmod?: string;
  /** Image URLs to attach via <image:image><image:loc> children. Used by
   *  Google Image Search to index the photos as part of the page. */
  images?: string[];
  /** Image caption / title used in the <image:title> child where
   *  available. Falls back to the URL alone. */
  imageTitle?: string;
}

export const GET: APIRoute = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const urls: UrlEntry[] = STATIC_PAGES.map((p) => ({
    loc: `${SITE}${p}`,
    lastmod: today,
  }));

  // Blog posts (collection on disk — always available).
  try {
    const posts = await getCollection('blog', ({ data }) => !data.draft);
    for (const p of posts) {
      const lastmod = dateOnly(p.data.updatedDate || p.data.date);
      urls.push({ loc: `${SITE}/blog/${p.id}`, lastmod });
    }
  } catch {
    // Collection failure should not nuke the whole sitemap; carry on.
  }

  // DB-backed URLs — if Supabase is unreachable we 503 the response so
  // Google retries instead of treating the empty sitemap as a deletion signal.
  try {
    const { data: tours, error: toursErr } = await supabase
      .from('tours')
      .select('slug, name, country, city, category, agency_id, updated_at, duration_days, images, description')
      .eq('status', 'active');
    if (toursErr) throw toursErr;

    const countryToursCount = new Map<string, number>();
    const countryCityCount = new Map<string, number>();
    const countryCategoryCount = new Map<string, number>();
    // (cityKey -> { countrySlug, citySlug, cityName, countryName, tours[] })
    // captured so we can compute intent / day-trip eligibility below
    // without a second query.
    const cityBucket = new Map<string, { countrySlug: string; citySlug: string; cityName: string; countryName: string; tours: any[] }>();

    for (const t of tours || []) {
      if (t.slug) {
        // Tour detail entries carry up to 4 image URLs each — surfaces
        // the gallery in Google Image Search and gives extra freshness
        // signal to the page itself.
        const tourImages = ((t.images as { url?: string }[] | null) || [])
          .map((img) => img?.url)
          .filter((u): u is string => typeof u === 'string' && u.length > 0)
          .slice(0, 4);
        urls.push({
          loc: `${SITE}/tours/${t.slug}`,
          lastmod: dateOnly(t.updated_at),
          images: tourImages,
          imageTitle: t.name as string | undefined,
        });
      }
      if (t.country) {
        const c = slugify(t.country);
        countryToursCount.set(c, (countryToursCount.get(c) || 0) + 1);
        if (t.city) {
          const key = `${c}|${slugify(t.city)}`;
          countryCityCount.set(key, (countryCityCount.get(key) || 0) + 1);
          if (!cityBucket.has(key)) {
            cityBucket.set(key, {
              countrySlug: c,
              citySlug: slugify(t.city),
              cityName: t.city,
              countryName: t.country,
              tours: [],
            });
          }
          cityBucket.get(key)!.tours.push(t);
        }
        if (t.category) {
          const key = `${slugify(t.category)}|${c}`;
          countryCategoryCount.set(key, (countryCategoryCount.get(key) || 0) + 1);
        }
      }
    }

    // Country / city / category hubs — only emit when there are at least 2
    // tours under the pair, otherwise the page is a thin 1-result doorway.
    for (const [country, count] of countryToursCount) {
      if (count >= 2) urls.push({ loc: `${SITE}/tours/in/${country}` });
    }
    for (const [entry, count] of countryCityCount) {
      if (count < 2) continue;
      const [country, city] = entry.split('|');
      urls.push({ loc: `${SITE}/tours/in/${country}/${city}` });
    }
    for (const [entry, count] of countryCategoryCount) {
      if (count < 2) continue;
      const [categorySlug, countrySlug] = entry.split('|');
      urls.push({ loc: `${SITE}/tours/category/${categorySlug}/in/${countrySlug}` });
    }

    // Traveler-intent pages — gated by exactly the same rule the route
    // uses (≥3 matching tours AND curated copy). Sitemap and route stay
    // in lockstep, so we never advertise a URL that 404s.
    for (const bucket of cityBucket.values()) {
      for (const intent of INTENT_SLUGS) {
        const matches = bucket.tours.filter((t: any) => tourMatchesIntent(t, intent)).length;
        if (matches < MIN_TOURS_FOR_INDEX) continue;
        const copy = getCityIntentCopy(bucket.cityName, bucket.countryName, intent);
        if (!copy.curated) continue;
        urls.push({ loc: `${SITE}/tours/in/${bucket.countrySlug}/${bucket.citySlug}/${intent}` });
      }

      // Day-trip pages — same gating logic. ≥3 single-day tours from the
      // city AND curated copy.
      const dayTripCount = bucket.tours.filter((t: any) => {
        const d = typeof t.duration_days === 'number' ? t.duration_days : null;
        return d !== null && d <= 1;
      }).length;
      if (dayTripCount >= MIN_TOURS_FOR_INDEX) {
        const dt = getDayTripCopy(bucket.cityName);
        if (dt.curated) {
          urls.push({ loc: `${SITE}/day-trips-from/${bucket.citySlug}` });
        }
      }
    }

    const { data: agencies, error: agErr } = await supabase
      .from('users')
      .select('id, name, company_name, updated_at')
      .eq('role', 'agency')
      .not('company_name', 'is', null);
    if (agErr) throw agErr;
    for (const a of agencies || []) {
      const source = a.company_name || a.name;
      if (!source) continue;
      const agencySlug = slugify(source);
      if (!agencySlug || AGENCY_BLOCKLIST.has(agencySlug)) continue;
      urls.push({ loc: `${SITE}/agencies/${agencySlug}`, lastmod: dateOnly(a.updated_at) });
    }

    // ----- Editorial / authority surfaces (no DB gate) -----
    // These are hand-curated and always indexable. The thin-content gate
    // doesn't apply because every entry here has been reviewed by us.
    for (const g of GUIDES) {
      urls.push({ loc: `${SITE}/guide/${g.slug}`, lastmod: g.updated });
    }
    for (const c of COMPETITORS) {
      urls.push({ loc: `${SITE}/compare/findtoursin-vs-${c.slug}`, lastmod: c.lastVerified });
      urls.push({ loc: `${SITE}/alternatives/${c.slug}-alternatives`, lastmod: c.lastVerified });
    }
    for (const a of AUTHORS) {
      urls.push({ loc: `${SITE}/authors/${a.slug}` });
    }
    // Best-of listicles — gated by the same ≥3 live picks rule the route
    // uses. We re-check against the tours we already pulled to avoid
    // surfacing a list whose picks have all gone offline.
    const liveSlugSet = new Set((tours || []).map((t: any) => t.slug).filter(Boolean));
    for (const list of BEST_OF) {
      const liveCount = list.picks.filter((p) => liveSlugSet.has(p.slug)).length;
      if (liveCount >= 3) {
        urls.push({ loc: `${SITE}/best/${list.slug}`, lastmod: list.updated });
      }
    }
    // Itineraries — always indexable (curated, no DB gate).
    for (const i of ITINERARIES) {
      urls.push({ loc: `${SITE}/itineraries/${i.countrySlug}/${i.days}-days`, lastmod: i.updated });
    }
    // Attractions — curated, always indexable. Each has hand-written
    // editorial content + schema, so no thin-content gate applies. The
    // hero image is attached for Google Image Search.
    for (const a of ATTRACTIONS) {
      urls.push({
        loc: `${SITE}/attractions/${slugify(a.country)}/${slugify(a.city)}/${a.slug}`,
        lastmod: a.updated,
        images: a.heroImage ? [a.heroImage] : undefined,
        imageTitle: a.name,
      });
    }
    // Neighborhoods — curated, always indexable.
    for (const n of NEIGHBORHOODS) {
      urls.push({
        loc: `${SITE}/tours/in/${slugify(n.country)}/${slugify(n.city)}/neighborhood/${n.slug}`,
        lastmod: n.updated,
        images: n.heroImage ? [n.heroImage] : undefined,
        imageTitle: `${n.name}, ${n.city}`,
      });
    }
  } catch (err) {
    console.error('sitemap-dynamic: DB error', err);
    return new Response('Service Unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // Image namespace is required because we emit <image:image> children
  // on URL entries that have hero/gallery images. Google Image Search
  // uses these to associate images with their landing page.
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls
  .map((u) => {
    const lastmodLine = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : '';
    const imageLines = (u.images || [])
      .map((img) => {
        const titleLine = u.imageTitle ? `\n      <image:title>${xmlEscape(u.imageTitle)}</image:title>` : '';
        return `    <image:image>\n      <image:loc>${xmlEscape(img)}</image:loc>${titleLine}\n    </image:image>`;
      })
      .join('\n');
    const imageBlock = imageLines ? `\n${imageLines}` : '';
    return `  <url>
    <loc>${xmlEscape(u.loc)}</loc>${lastmodLine}${imageBlock}
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
