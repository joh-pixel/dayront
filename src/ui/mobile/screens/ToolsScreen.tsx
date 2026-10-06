/**
 * src/ui/mobile/screens/ToolsScreen.tsx
 * ----------------------------------------------------------------------------
 * Tool GRID — the catalog of all 73+ tools with search + category filter.
 * Rendered at /app/tools.
 *
 * NOT to be confused with ToolScreen.tsx (singular), which renders one
 * tool's detail page at /app/tool/<slug>.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { pushRecentTool } from '../../../core/storage';
import { haptic } from '../haptic';
import IntakeSuggestor from '../components/IntakeSuggestor';

interface Tool {
  slug: string;
  name: string;
  description: string;
  icon: string;
  from?: string;
  to?: string;
  category: string;
  tier?: 'light' | 'medium' | 'heavy';
  recommendApp?: boolean;
  engine?: 'wasm' | 'native' | 'ai';
}

interface Props {
  tools: Tool[];
  recentSlugs?: string[];
}

type Category = 'all' | 'audio' | 'video' | 'convert' | 'ai';

const CHIPS: Array<{ key: Category; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
  { key: 'convert', label: 'Convert' },
  { key: 'ai', label: 'AI' },
];

/* ── Helpers ─────────────────────────────────────────────── */

function toolUrl(tool: Tool): string {
  return `/app/tool/${tool.slug}`;
}

function matchesCategory(tool: Tool, cat: Category): boolean {
  if (cat === 'all') return true;
  const c = tool.category;
  if (cat === 'audio') return c.startsWith('audio');
  if (cat === 'video') return c.startsWith('video') && c !== 'video-to-audio';
  if (cat === 'convert') return c === 'video-to-audio' || c.endsWith('conversion');
  if (cat === 'ai') return c === 'ai';
  return false;
}

function tierBadge(tier: Tool['tier']): { label: string; cls: string } | null {
  if (tier === 'light') return { label: '⚡ Fast', cls: 'light' };
  if (tier === 'heavy') return { label: '🔥 Pro', cls: 'heavy' };
  return null;
}

/* ── Component ───────────────────────────────────────────── */

export default function ToolsScreen({ tools, recentSlugs }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hasQuery = query.trim().length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t) => {
      if (!matchesCategory(t, category)) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.slug.includes(q) ||
        (t.from ?? '').includes(q) ||
        (t.to ?? '').includes(q)
      );
    });
  }, [tools, query, category]);

  const featured = useMemo(() => {
    if (category !== 'all' || hasQuery) return [];
    return tools
      .filter((t) => t.recommendApp || t.engine === 'ai')
      .slice(0, 6);
  }, [tools, category, hasQuery]);

  const recent = useMemo(() => {
    if (category !== 'all' || hasQuery || !recentSlugs?.length) return [];
    const map = new Map(tools.map((t) => [t.slug, t]));
    return recentSlugs
      .map((slug) => map.get(slug))
      .filter(Boolean)
      .slice(0, 6) as Tool[];
  }, [tools, category, hasQuery, recentSlugs]);

  function openTool(slug: string) {
    haptic();
    pushRecentTool(slug);
  }

  function selectCategory(key: Category) {
    haptic(8);
    // Tapping "All" clears any active search so the full catalog
    // is visible again (fixes: search → tap All → grid stays empty).
    if (key === 'all' && hasQuery) {
      setQuery('');
      inputRef.current?.blur();
    }
    setCategory(key);
  }

  return (
    <div class="d-tools">
      {/* Smart intake suggestion */}
      <div style={{ marginBottom: '0.75rem' }}>
        <IntakeSuggestor />
      </div>

      {/* Sticky search + chips */}
      <div class={`d-tools__searchwrap ${scrolled ? 'd-tools__searchwrap--scrolled' : ''}`}>
        <div class="d-tools__search">
          <span class="d-tools__searchicon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            class="d-tools__input"
            placeholder="Search tools…"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Search tools"
          />
          {hasQuery && (
            <button
              type="button"
              class="d-tools__clear"
              aria-label="Clear search"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
                haptic();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div class="d-tools__chips" role="tablist">
          {CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={category === c.key}
              class={`d-chip ${category === c.key ? 'd-chip--active' : ''}`}
              onClick={() => selectCategory(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured strip */}
      {featured.length > 0 && (
        <section class="d-tools__featured" aria-labelledby="d-featured-title">
          <h2 id="d-featured-title" class="d-tools__section-title">
            Recommended for your device
          </h2>
          <div class="d-tools__featured-row">
            {featured.map((tool) => (
              <a
                key={tool.slug}
                href={toolUrl(tool)}
                class="d-featurecard"
                onClick={() => openTool(tool.slug)}
              >
                <span class="d-featurecard__icon" aria-hidden="true">
                  {tool.icon}
                </span>
                <span class="d-featurecard__name">{tool.name}</span>
                <span class="d-featurecard__pill">In app</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Recently used strip */}
      {recent.length > 0 && (
        <section class="d-tools__featured" aria-labelledby="d-recent-title">
          <h2 id="d-recent-title" class="d-tools__section-title">
            Pick up where you left off
          </h2>
          <div class="d-tools__featured-row">
            {recent.map((tool) => (
              <a
                key={tool.slug}
                href={toolUrl(tool)}
                class="d-featurecard d-featurecard--recent"
                onClick={() => openTool(tool.slug)}
              >
                <span class="d-featurecard__icon" aria-hidden="true">
                  {tool.icon}
                </span>
                <span class="d-featurecard__name">{tool.name}</span>
                <span class="d-featurecard__pill d-featurecard__pill--recent">
                  Recently
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Grid / empty state */}
      {filtered.length > 0 ? (
        <div class="d-tools__grid">
          {filtered.map((tool) => {
            const badge = tierBadge(tool.tier);
            return (
              <a
                key={tool.slug}
                href={toolUrl(tool)}
                class="d-toolcard"
                onClick={() => openTool(tool.slug)}
              >
                <span class="d-toolcard__icon" aria-hidden="true">
                  {tool.icon}
                </span>
                <span class="d-toolcard__name">{tool.name}</span>
                {badge && (
                  <span class={`d-toolcard__badge d-toolcard__badge--${badge.cls}`}>
                    {badge.label}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      ) : (
        <div class="d-empty">
          <div class="d-empty__icon">🔍</div>
          <p class="d-empty__title">No tools found</p>
          <p class="d-empty__sub">
            Try a shorter keyword or{' '}
            <button
              type="button"
              class="d-empty__link"
              onClick={() => {
                setQuery('');
                setCategory('all');
                haptic();
              }}
            >
              tap All
            </button>
          </p>
        </div>
      )}
    </div>
  );
}