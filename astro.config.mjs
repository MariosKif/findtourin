// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.findtoursin.com',
  output: 'server',
  adapter: vercel(),
  integrations: [mdx(), sitemap({
    filter: (page) => {
      const excluded = ['/dashboard', '/admin', '/auth', '/account', '/api'];
      return !excluded.some(prefix => page.includes(prefix));
    },
  })],
  vite: {
    plugins: [tailwindcss()],
  },
});
