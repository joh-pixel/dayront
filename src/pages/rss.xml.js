import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog', (entry) => entry.id.startsWith('en/'));
  // sort by date desc
  const sortedPosts = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  // ★ NEW: Dynamically map all images from your centralized content/images folder ★
  const allImages = import.meta.glob('/src/content/images/*.{jpg,jpeg,png,webp}');

  // CHANGED: Make the mapping async so we can resolve the local images
  const items = await Promise.all(sortedPosts.map(async (post) => {
    // 1. Clean slug: Remove the 'en/' prefix and the file extension from the ID
    const cleanSlug = post.id.replace(/\.(mdx|md)$/, '').replace(/^en\//, '');
    
    // 2. Build the absolute URL with the /en/ prefix
    const absoluteLink = new URL(`/blog/en/${cleanSlug}`, context.site).toString();
    
    // 3. Resolve the local image to a full absolute URL
    let imageUrl = '';
    if (post.data.image) {
      const imagePath = `/src/content/images/${post.data.image}`;
      if (allImages[imagePath]) {
        const imgModule = await allImages[imagePath]();
        // imgModule.default.src gives us the final hashed path (e.g., /_astro/image.abc123.jpg)
        imageUrl = new URL(imgModule.default.src, context.site).href;
      }
    }

    return {
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: absoluteLink,
      // 4. Inject media enclosure so Pinterest successfully auto-generates the visual Pin image
      ...(imageUrl && {
        enclosure: {
          url: imageUrl,
          length: 0,
          type: 'image/jpeg', // Works perfectly for jpeg, png, or webp online images
        }
      }),
    };
  }));

  return rss({
    title: 'Dayront Blog',
    description: 'Privacy-first media tools – updates, guides, and news.',
    site: context.site,
    items: items,
    customData: `<language>en-us</language>`,
  });
}