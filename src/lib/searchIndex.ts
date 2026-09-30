/**
 * Search index builder
 * --------------------------------------------------------------------------
 * Aggregates every searchable item on the site into one flat array.
 * Called at build time by src/pages/search.astro (and any other consumer).
 *
 * To make a new feature searchable: add a branch in buildSearchIndex().
 */

import { tools as allTools, type Tool } from './tools';

export type SearchCategory =
  | 'tool'
  | 'conversion'
  | 'utility'
  | 'ai'
  | 'blog'
  | 'page'
  | 'faq';

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: SearchCategory;
  icon: string;
  /** Extra terms that should match (synonyms, alternate names, tags) */
  keywords?: string[];
  /** Optional ranking boost — higher = more prominent */
  weight?: number;
}

interface BuildOptions {
  lang: string;
  blogPosts?: Array<{
    id: string;
    data: { title: string; description: string; tags?: string[] };
  }>;
}

/* -------------------------------------------------------------------------- */
/* CATEGORY HELPERS                                                           */
/* -------------------------------------------------------------------------- */

function toolCategory(tool: Tool): SearchCategory {
  if (tool.category === 'ai') return 'ai';
  if (tool.category === 'audio-utility' || tool.category === 'video-utility') return 'utility';
  if (tool.category === 'audio-conversion' || tool.category === 'video-conversion' || tool.category === 'video-to-audio') return 'conversion';
  return 'tool';
}

function toolUrl(tool: Tool): string {
  // Mirrors BaseLayout logic: converters go to /convert, others to /tools
  return tool.from && tool.to ? `/convert/${tool.slug}` : `/tools/${tool.slug}`;
}

/* -------------------------------------------------------------------------- */
/* STATIC PAGES                                                               */
/* -------------------------------------------------------------------------- */

const STATIC_PAGES: Array<Omit<SearchItem, 'id'>> = [
  {
    title: 'All Tools',
    description: 'Browse every free media tool on Dayront.',
    url: '/tools',
    category: 'page',
    icon: '🧰',
    keywords: ['tools', 'browse', 'list', 'directory'],
    weight: 5,
  },
  {
    title: 'Download the App',
    description: 'Get Dayront for Windows, macOS, Linux, Android, or iOS.',
    url: '/download',
    category: 'page',
    icon: '⬇️',
    keywords: ['app', 'download', 'install', 'desktop', 'mobile', 'apk', 'pwa'],
    weight: 5,
  },
  {
    title: 'About Dayront',
    description: 'Learn about our privacy-first media tools.',
    url: '/about',
    category: 'page',
    icon: 'ℹ️',
    keywords: ['about', 'company', 'story', 'privacy-first'],
  },
  {
    title: 'Privacy Policy',
    description: 'How Dayront protects your data.',
    url: '/privacy',
    category: 'page',
    icon: '🔒',
    keywords: ['privacy', 'data', 'gdpr', 'policy'],
  },
  {
    title: 'Terms of Service',
    description: 'The rules for using Dayront.',
    url: '/terms',
    category: 'page',
    icon: '📜',
    keywords: ['terms', 'legal', 'service'],
  },
  {
    title: 'Advertise',
    description: 'Reach creators and privacy-conscious users.',
    url: '/advertise',
    category: 'page',
    icon: '📣',
    keywords: ['advertise', 'ads', 'sponsor', 'marketing'],
  },
  {
    title: 'Contact',
    description: 'Get in touch with the Dayront team.',
    url: 'mailto:hello@dayront.com',
    category: 'page',
    icon: '✉️',
    keywords: ['contact', 'support', 'email', 'help'],
  },
  {
    title: 'Blog',
    description: 'Guides, tips, and privacy-first how-tos for creators.',
    url: '/blog/en',
    category: 'blog',
    icon: '📝',
    keywords: ['blog', 'articles', 'guides', 'news'],
  },
];

/* -------------------------------------------------------------------------- */
/* MAIN BUILDER                                                               */
/* -------------------------------------------------------------------------- */

export function buildSearchIndex(options: BuildOptions): SearchItem[] {
  const { blogPosts = [] } = options;
  const items: SearchItem[] = [];

  /* ── 1. Tools ──────────────────────────────────────── */
  for (const tool of allTools) {
    // Skip resolution converters in search — too many, low search value.
    // Users search for "convert video" or "1080p" instead.
    if (tool.category === 'video-conversion' && tool.type === 'resolution-convert') {
      // Still index them but with lower weight, so they only match on
      // specific queries like "1080p to 4k"
      items.push({
        id: `tool:${tool.slug}`,
        title: tool.name,
        description: tool.description,
        url: toolUrl(tool),
        category: 'conversion',
        icon: '🎬',
        keywords: [tool.slug, tool.from || '', tool.to || '', 'resolution', 'upscale', 'downscale'],
        weight: 1,
      });
      continue;
    }

    const keywords: string[] = [
      tool.slug,
      tool.category.replace(/-/g, ' '),
    ];
    if (tool.from) keywords.push(tool.from);
    if (tool.to) keywords.push(tool.to);
    if (tool.type) keywords.push(tool.type.replace(/-/g, ' '));

    // Pull FAQ terms into the search index so questions match
    for (const faq of tool.faq || []) {
      keywords.push(faq.question.toLowerCase());
    }

    items.push({
      id: `tool:${tool.slug}`,
      title: tool.name,
      description: tool.description,
      url: toolUrl(tool),
      category: toolCategory(tool),
      icon: tool.icon || '🧰',
      keywords,
      weight: 3,
    });
  }

  /* ── 2. Blog posts ─────────────────────────────────── */
  for (const post of blogPosts) {
    const cleanId = post.id.replace(/^[a-z]{2}\//, '').replace(/\.mdx$/, '');
    items.push({
      id: `blog:${post.id}`,
      title: post.data.title,
      description: post.data.description,
      url: `/blog/en/${cleanId}`,
      category: 'blog',
      icon: '📝',
      keywords: post.data.tags || [],
      weight: 2,
    });
  }

  /* ── 3. Static pages ───────────────────────────────── */
  for (const page of STATIC_PAGES) {
    items.push({
      id: `page:${page.url}`,
      ...page,
    });
  }

  /* ── 4. FAQs (individual questions) ────────────────── */
  // Each tool's FAQ questions become individually searchable
  for (const tool of allTools) {
    for (let i = 0; i < (tool.faq?.length || 0); i++) {
      const faq = tool.faq[i];
      items.push({
        id: `faq:${tool.slug}:${i}`,
        title: faq.question,
        description: faq.answer,
        url: `${toolUrl(tool)}#faq-${i}`,
        category: 'faq',
        icon: '❓',
        keywords: [tool.name.toLowerCase(), tool.slug],
        weight: 1,
      });
    }
  }

  return items;
}