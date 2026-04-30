import type { APIRoute } from 'astro';

// Hand-rolled sitemap index so /sitemap-index.xml references BOTH the
// Astro-generated static sitemap (sitemap-0.xml) AND our DB-backed
// dynamic sitemap. Without this, Google Search Console only follows the
// static sitemap and misses every tour, agency, and hub URL.
//
// Robots.txt declares both, but consolidating them under a single index
// removes ambiguity and keeps Search Console's coverage report accurate.

export const prerender = true;

const SITE = 'https://www.findtoursin.com';

export const GET: APIRoute = () => {
  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE}/sitemap-0.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
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
