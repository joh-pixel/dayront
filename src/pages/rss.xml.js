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
    items: sortedPosts.map(post => {
      // 1. Clean slug: Remove the 'en/' prefix and the file extension from the ID
      const cleanSlug = post.id.replace(/\.(mdx|md)$/, '').replace(/^en\//, '');
      
      // 2. Build the absolute URL with the /en/ prefix
      const absoluteLink = new URL(`/blog/en/${cleanSlug}`, context.site).toString();
      
      // 3. Fetch the external online image URL
      const imageSrc = post.data.image || '';

      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: absoluteLink,
        // 4. Inject media enclosure so Pinterest successfully auto-generates the visual Pin image
        ...(imageSrc && {
          enclosure: {
            url: imageSrc,
            length: 0,
            type: 'image/jpeg', // Works perfectly for jpeg, png, or webp online images
          }
        }),
      };
    }),
    customData: `<language>en-us</language>`,
  });
}