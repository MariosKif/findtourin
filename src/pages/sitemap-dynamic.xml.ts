import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { supabase } from '../lib/supabase';
import { slugify } from '../lib/destinations';

export const prerender = false;

const SITE = 'https://www.findtoursin.com';

// Agency slugs that exist in the DB but should never appear in the sitemap —
// test/seed accounts left over from earlier development.
const AGENCY_BLOCKLIST = new Set(['test', 'travel-company-name', 'smoke-travel-co']);

const dateOnly = (s: string | undefined | null) =>
  s ? new Date(s).toISOString().slice(0, 10) : undefined;

export const GET: APIRoute = async () => {
  const urls: { loc: string; lastmod?: string }[] = [];

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
      .select('slug, country, city, category, agency_id, updated_at')
      .eq('status', 'active');
    if (toursErr) throw toursErr;

    const countryToursCount = new Map<string, number>();
    const countryCityCount = new Map<string, number>();
    const countryCategoryCount = new Map<string, number>();

    for (const t of tours || []) {
      if (t.slug) {
        urls.push({ loc: `${SITE}/tours/${t.slug}`, lastmod: dateOnly(t.updated_at) });
      }
      if (t.country) {
        const c = slugify(t.country);
        countryToursCount.set(c, (countryToursCount.get(c) || 0) + 1);
        if (t.city) {
          const key = `${c}|${slugify(t.city)}`;
          countryCityCount.set(key, (countryCityCount.get(key) || 0) + 1);
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
  } catch (err) {
    console.error('sitemap-dynamic: DB error', err);
    return new Response('Service Unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
