import type { APIRoute } from 'astro';

// Sitemap index pointing at our SSR-generated sitemap. SSR (not
// prerender) so the file is never baked into dist/client/ where it would
// be served as a stale static asset by Vercel's CDN ahead of this route.
// The index pattern is kept for future expansion (image/news sitemaps).
export const prerender = false;

const SITE = 'https://www.findtoursin.com';

export const GET: APIRoute = () => {
  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE}/sitemap-dynamic.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
