import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog', (entry) => entry.id.startsWith('en/'));
  // sort by date desc
  const sortedPosts = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Dayront Blog',
    description: 'Privacy-first media tools – updates, guides, and news.',
    site: context.site,
    items: sortedPosts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.slug}`,
    })),
    customData: `<language>en-us</language>`,
  });
}