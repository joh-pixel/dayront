import rss from '@astrojs/rss';
import { g as getCollection } from '../chunks/_astro_content_lyMaeEuS.mjs';
export { renderers } from '../renderers.mjs';

async function GET(context) {
  const posts = await getCollection('blog', entry => entry.id.startsWith('en/'));
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
      link: `/blog/${post.slug}`
    })),
    customData: `<language>en-us</language>`
  });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
