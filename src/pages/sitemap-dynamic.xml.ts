import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';
import { slugify } from '../lib/destinations';

export const prerender = false;

const SITE = 'https://www.findtoursin.com';

export const GET: APIRoute = async () => {
  const urls: { loc: string; lastmod?: string; changefreq?: string; priority?: number }[] = [];

  try {
    const { data: tours } = await supabase
      .from('tours')
      .select('slug, country, city, category, agency_id, updated_at')
      .eq('status', 'active');

    const countrySet = new Set<string>();
    const countryCitySet = new Set<string>();
    const countryCategorySet = new Set<string>();

    for (const t of tours || []) {
      if (t.slug) urls.push({ loc: `${SITE}/tours/${t.slug}`, lastmod: t.updated_at || undefined, changefreq: 'weekly', priority: 0.7 });

      if (t.country) {
        const c = slugify(t.country);
        countrySet.add(t.country);
        if (t.city) countryCitySet.add(`${c}|${slugify(t.city)}`);
        if (t.category) countryCategorySet.add(`${c}|${slugify(t.category)}|${t.country}|${t.category}`);
      }
    }

    for (const country of countrySet) {
      urls.push({ loc: `${SITE}/tours/in/${slugify(country)}`, changefreq: 'weekly', priority: 0.8 });
    }
    for (const entry of countryCitySet) {
      const [country, city] = entry.split('|');
      urls.push({ loc: `${SITE}/tours/in/${country}/${city}`, changefreq: 'weekly', priority: 0.7 });
    }
    for (const entry of countryCategorySet) {
      const [countrySlug, categorySlug] = entry.split('|');
      urls.push({ loc: `${SITE}/tours/category/${categorySlug}/in/${countrySlug}`, changefreq: 'weekly', priority: 0.7 });
    }

    // Agency pages — URL slug is derived from company_name (or name fallback)
    const { data: agencies } = await supabase
      .from('users')
      .select('id, name, company_name, updated_at')
      .eq('role', 'agency');
    for (const a of agencies || []) {
      const source = a.company_name || a.name;
      if (!source) continue;
      const agencySlug = slugify(source);
      if (agencySlug) {
        urls.push({ loc: `${SITE}/agencies/${agencySlug}`, lastmod: a.updated_at || undefined, changefreq: 'weekly', priority: 0.6 });
      }
    }
  } catch {
    // DB unavailable — still return a valid (empty) sitemap rather than erroring out
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority !== undefined ? `\n    <priority>${u.priority.toFixed(1)}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
