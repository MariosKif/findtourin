import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  const site = 'https://www.findtoursin.com';

  const items = sortedPosts.map(post => `
    <item>
      <title><![CDATA[${post.data.title}]]></title>
      <description><![CDATA[${post.data.description}]]></description>
      <link>${site}/blog/${post.id}</link>
      <guid isPermaLink="true">${site}/blog/${post.id}</guid>
      <pubDate>${new Date(post.data.date).toUTCString()}</pubDate>
      <author>${post.data.author}</author>
      ${post.data.tags.map(tag => `<category>${tag}</category>`).join('\n      ')}
    </item>`).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FindToursIn Blog</title>
    <description>Travel tips, destination guides, and expert advice for your next adventure.</description>
    <link>${site}/blog</link>
    <atom:link href="${site}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
