import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  // 👇 Enable rendering so `post.render()` works
  render: true,
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    author: z.string().default('Dayront Team'),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    relatedPosts: z.array(z.string()).default([]),
    image: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};