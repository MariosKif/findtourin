// JSON Feed v1.1 alternative to the existing RSS feed.
// Modern AI feed readers and aggregators (Readwise, Feedbin, NetNewsWire)
// prefer JSON Feed for its simpler schema and built-in extension support.
// We expose both /blog/rss.xml and /blog/feed.json so legacy and modern
// clients are covered with no behavioural difference.
//
// Spec: https://jsonfeed.org/version/1.1

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = false;

const SITE = 'https://www.findtoursin.com';

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
    .slice(0, 50); // Cap at 50 most recent — readers don't need full history.

  const items = sortedPosts.map((post) => {
    const url = `${SITE}/blog/${post.id}`;
    // Hero image: explicit frontmatter image (when present), otherwise
    // the dynamic OG image so the feed entry never looks broken.
    const imageUrl = post.data.image
      ? (post.data.image.startsWith('http') ? post.data.image : `${SITE}${post.data.image}`)
      : `${SITE}/api/og?${new URLSearchParams({
          title: post.data.title.slice(0, 80),
          subtitle: post.data.description.slice(0, 90),
          eyebrow: post.data.category,
        }).toString()}`;
    return {
      id: url,
      url,
      title: post.data.title,
      content_text: post.data.description,
      summary: post.data.description,
      image: imageUrl,
      banner_image: imageUrl,
      date_published: new Date(post.data.date).toISOString(),
      ...(post.data.updatedDate ? { date_modified: new Date(post.data.updatedDate).toISOString() } : {}),
      authors: [{ name: post.data.author }],
      tags: post.data.tags,
      language: 'en',
    };
  });

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'FindToursIn Blog',
    home_page_url: `${SITE}/blog`,
    feed_url: `${SITE}/blog/feed.json`,
    description: 'Travel tips, destination guides, and expert advice for your next tour.',
    icon: `${SITE}/icon-512.png`,
    favicon: `${SITE}/favicon.ico`,
    language: 'en',
    authors: [{ name: 'FindToursIn', url: SITE }],
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
    },
  });
};
