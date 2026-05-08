import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    updatedDate: z.string().optional(),
    author: z.string().default('FindToursIn'),
    // Hero image. Optional because BlogLayout falls back to a dynamic
    // OG-generated image when missing, so newly-published posts work
    // immediately without waiting on static JPG uploads. The blog rules
    // still mandate a static hero for production (see docs/blog-rules.md);
    // this just stops the build breaking when the JPG hasn't landed yet.
    image: z.string().optional(),
    category: z.string().default('Travel Tips'),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
