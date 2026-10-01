/**
 * src/core/search.ts
 * ----------------------------------------------------------------------------
 * Search index builder + query engine.
 *
 * Used by:
 *   - src/pages/search.astro (the /search route)
 *   - src/ui/mobile/screens/ToolsScreen.tsx (for local filtering)
 *
 * Index is built at Astro build time from tools + blog + static pages.
 * Query is fast: simple tokenisation + weighted scoring. No fuzzy library.
 */

import { tools as allTools, type Tool } from './tools';

/* ── Types ────────────────────────────────────────────────── */

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
  /** Extra terms matched alongside title/description. */
  keywords?: string[];
  /** Ranking multiplier — higher = more prominent. */
  weight?: number;
}

export interface BlogEntry {
  id: string;
  data: {
    title: string;
    description: string;
    tags?: string[];
  };
}

/* ── Category resolution ──────────────────────────────────── */

function toolCategory(tool: Tool): SearchCategory {
  if (tool.category === 'ai') return 'ai';
  if (tool.category === 'audio-utility' || tool.category === 'video-utility') return 'utility';
  if (
    tool.category === 'audio-conversion' ||
    tool.category === 'video-conversion' ||
    tool.category === 'video-to-audio'
  ) {
    return 'conversion';
  }
  return 'tool';
}

function toolUrl(tool: Tool): string {
  return tool.from && tool.to ? `/convert/${tool.slug}` : `/tools/${tool.slug}`;
}

/* ── Static pages ─────────────────────────────────────────── */

const STATIC_PAGES: Array<Omit<SearchItem, 'id'>> = [
  {
    title: 'All Tools',
    description: 'Browse every free media tool on Dayront.',
    url: '/tools',
    category: 'page',
    icon: '🧰',
    keywords: ['tools', 'browse', 'list', 'directory', 'all'],
    weight: 4,
  },
  {
    title: 'Search',
    description: 'Search across all tools, blog articles, and answers.',
    url: '/search',
    category: 'page',
    icon: '🔍',
    keywords: ['search', 'find'],
    weight: 3,
  },
  {
    title: 'Download the App',
    description: 'Get Dayront for Windows, macOS, Linux, Android, or iOS.',
    url: '/download',
    category: 'page',
    icon: '⬇️',
    keywords: ['app', 'download', 'install', 'desktop', 'mobile', 'apk', 'pwa', 'android', 'ios'],
    weight: 4,
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
    title: 'Status',
    description: 'Live status of Dayront services.',
    url: '/status',
    category: 'page',
    icon: '🟢',
    keywords: ['status', 'uptime', 'operational'],
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
    title: 'Blog',
    description: 'Guides, tips, and privacy-first how-tos for creators.',
    url: '/blog/en',
    category: 'blog',
    icon: '📝',
    keywords: ['blog', 'articles', 'guides', 'news', 'tutorials'],
  },
  {
    title: 'Contact',
    description: 'Get in touch with the Dayront team.',
    url: 'mailto:hello@dayront.com',
    category: 'page',
    icon: '✉️',
    keywords: ['contact', 'support', 'email', 'help'],
  },
];

/* ── Builder ──────────────────────────────────────────────── */

interface BuildOptions {
  lang?: string;
  blogPosts?: BlogEntry[];
  /** Skip these slugs (e.g. resolution converters you don't want searchable). */
  excludeSlugs?: Set<string>;
}

export function buildSearchIndex(opts: BuildOptions = {}): SearchItem[] {
  const { lang = 'en', blogPosts = [], excludeSlugs } = opts;
  const items: SearchItem[] = [];

  /* 1. Tools */
  for (const tool of allTools) {
    if (excludeSlugs?.has(tool.slug)) continue;

    const keywords: string[] = [tool.slug, tool.category.replace(/-/g, ' ')];
    if (tool.from) keywords.push(tool.from);
    if (tool.to) keywords.push(tool.to);
    if (tool.type) keywords.push(tool.type.replace(/-/g, ' '));
    for (const faq of tool.faq ?? []) {
      keywords.push(faq.question.toLowerCase());
    }

    const isResolution =
      tool.category === 'video-conversion' && tool.type === 'resolution-convert';

    items.push({
      id: `tool:${tool.slug}`,
      title: tool.name,
      description: tool.description,
      url: toolUrl(tool),
      category: toolCategory(tool),
      icon: tool.icon || '🧰',
      keywords,
      // Resolution converters are numerous; lower weight so they don't drown
      // results on generic queries like "convert".
      weight: isResolution ? 1 : 3,
    });
  }

  /* 2. Blog posts */
  for (const post of blogPosts) {
    const cleanId = post.id
      .replace(/^[a-z]{2}\//, '')
      .replace(/\.mdx$/, '');
    items.push({
      id: `blog:${post.id}`,
      title: post.data.title,
      description: post.data.description,
      url: `/blog/${lang}/${cleanId}`,
      category: 'blog',
      icon: '📝',
      keywords: post.data.tags ?? [],
      weight: 2,
    });
  }

  /* 3. Static pages */
  for (const page of STATIC_PAGES) {
    items.push({ id: `page:${page.url}`, ...page });
  }

  /* 4. FAQs — each question individually searchable */
  for (const tool of allTools) {
    const faqs = tool.faq ?? [];
    for (let i = 0; i < faqs.length; i++) {
      const faq = faqs[i];
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

/* ── Query engine ─────────────────────────────────────────── */

interface ScoredItem {
  item: SearchItem;
  score: number;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function scoreItem(item: SearchItem, q: string): number {
  const title = normalize(item.title);
  const desc = normalize(item.description);
  const kw = (item.keywords ?? []).map(normalize).join(' ');
  const weight = item.weight ?? 1;

  let score = 0;

  if (title === q) score += 1000;
  if (title.startsWith(q)) score += 300;
  if (new RegExp(`\\b${escapeRegex(q)}\\b`).test(title)) score += 200;
  if (title.includes(q)) score += 100;

  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => title.includes(w))) score += 150;

  if (desc.includes(q)) score += 30;
  if (kw.includes(q)) score += 40;
  if (item.url.toLowerCase().includes(q)) score += 20;

  return score * weight;
}

export interface SearchOptions {
  /** Cap results (default 40). */
  limit?: number;
  /** Restrict to a specific category. */
  category?: SearchCategory | 'all';
}

export function search(
  index: SearchItem[],
  query: string,
  opts: SearchOptions = {},
): SearchItem[] {
  const q = normalize(query);
  if (!q) return [];

  const { limit = 40, category = 'all' } = opts;
  const pool = category === 'all' ? index : index.filter((i) => i.category === category);

  return pool
    .map((item) => ({ item, score: scoreItem(item, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}

/** Simple HTML-escaped highlighter for query terms in title/description. */
export function highlight(text: string, query: string): string {
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const safe = escapeHtml(text);
  if (!query.trim()) return safe;

  const safeQ = escapeHtml(query.trim());
  try {
    return safe.replace(new RegExp(`(${escapeRegex(safeQ)})`, 'gi'), '<mark>$1</mark>');
  } catch {
    return safe;
  }
}