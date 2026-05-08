// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://www.findtoursin.com',
  // Canonical URL form is no-trailing-slash; the vercel.json redirect 301s
  // any /path/ → /path, and Astro must agree so canonical/sitemap stop
  // disagreeing with the live response.
  trailingSlash: 'never',
  output: 'server',
  adapter: vercel(),
  // Prefetch links on hover by default. The 100-200ms window between
  // hover and click is enough to fetch the destination HTML, so the
  // tap-to-navigate transition feels instant. Per-link override is
  // possible via `data-astro-prefetch="false"`. We set the strategy to
  // `hover` (not `viewport` or `load`) to avoid bandwidth waste — only
  // the link the user is actually reaching for gets prefetched.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  // Sitemaps are hand-rolled in src/pages/sitemap-*.ts. The @astrojs/sitemap
  // integration wrote a static sitemap-index.xml into dist/client/ that
  // Vercel's CDN served ahead of our SSR route, hiding the dynamic sitemap
  // from Google.
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
