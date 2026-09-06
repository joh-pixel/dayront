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
      // 1. Ensure absolute URL for Pinterest redirection
      const absoluteLink = new URL(`/blog/${post.slug || post.id}`, context.site).toString();
      
      // 2. Fetch the external online image URL directly from your frontmatter
      const imageSrc = post.data.image || '';

      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: absoluteLink,
        // 3. Inject media enclosure so Pinterest successfully auto-generates the visual Pin image
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
