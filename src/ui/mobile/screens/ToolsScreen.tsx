/**
 * src/ui/mobile/screens/ToolsScreen.tsx
 * Searchable grid of all tools.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { pushRecentTool } from '../../../core/storage';

interface Tool {
  slug: string;
  name: string;
  description: string;
  icon: string;
  from?: string;
  to?: string;
  category: string;
  tier?: 'light' | 'medium' | 'heavy';
}

interface Props {
  tools: Tool[];
}

type Category = 'all' | 'audio' | 'video' | 'convert' | 'ai';

const CHIPS: Array<{ key: Category; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
  { key: 'convert', label: 'Convert' },
  { key: 'ai', label: 'AI' },
];

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

function haptic(ms = 6) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch {}
  }
}

export default function ToolsScreen({ tools }: Props) {
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

  const hasQuery = query.trim().length > 0;

  function openTool(slug: string) {
    haptic();
    pushRecentTool(slug);
  }

  return (
    <div class="d-tools">
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
              onClick={() => {
                haptic(8);
                setCategory(c.key);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div class="d-tools__meta">
        {filtered.length} {filtered.length === 1 ? 'tool' : 'tools'}
        {hasQuery ? ` matching "${query}"` : ''}
      </div>

      {filtered.length > 0 ? (
        <div class="d-tools__grid">
          {filtered.map((tool) => {
            const tier = tool.tier ?? 'medium';
            const tierLabel =
              tier === 'light' ? '⚡ Fast' :
              tier === 'heavy' ? '📱 App' :
              null;

            return (
              <a
                key={tool.slug}
                href={toolUrl(tool)}
                class="d-toolcard"
                onClick={() => openTool(tool.slug)}
              >
                <span class="d-toolcard__icon" aria-hidden="true">{tool.icon}</span>
                <span class="d-toolcard__name">{tool.name}</span>
                <span class="d-toolcard__desc">{tool.description}</span>
                {tierLabel && (
                  <span class={`d-toolcard__badge d-toolcard__badge--${tier}`}>
                    {tierLabel}
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
            Try a shorter keyword or tap <strong>All</strong>
          </p>
        </div>
      )}
    </div>
  );
}