// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.findtoursin.com',
  // Canonical URL form is no-trailing-slash; the vercel.json redirect 301s
  // any /path/ → /path, and Astro must agree so canonical/sitemap stop
  // disagreeing with the live response.
  trailingSlash: 'never',
  output: 'server',
  adapter: vercel(),
  integrations: [mdx(), sitemap({
    filter: (page) => {
      const excluded = ['/dashboard', '/admin', '/auth', '/account', '/api'];
      return !excluded.some(prefix => page.includes(prefix));
    },
    serialize: (item) => ({ ...item, lastmod: new Date().toISOString() }),
  })],
  vite: {
    plugins: [tailwindcss()],
  },
});
