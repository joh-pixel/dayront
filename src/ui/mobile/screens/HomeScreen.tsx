/**
 * src/ui/mobile/screens/HomeScreen.tsx
 * Mobile home — hero, quick actions, recents.
 * Uses shared haptic feedback (respects Settings toggle).
 */
import { useEffect, useState } from 'preact/hooks';
import { getRecentTools, pushRecentTool } from '../../../core/storage';
import { haptic } from '../haptic';

interface Tool {
  slug: string;
  name: string;
  description: string;
  icon: string;
  from?: string;
  to?: string;
  category: string;
}

interface Props {
  tools: Tool[];
}

function toolUrl(tool: { slug: string; from?: string; to?: string }): string {
  return `/app/tool/${tool.slug}`;
}

const QUICK_SLUGS = [
  'video-compressor',
  'video-merger',
  'mp4-to-mp3',
  'audio-cutter',
];

export default function HomeScreen({ tools }: Props) {
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  useEffect(() => {
    setRecentSlugs(getRecentTools().slice(0, 4));
  }, []);

  const quickTools = QUICK_SLUGS
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter(Boolean);

  const recentTools = recentSlugs
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter(Boolean);

  function handleToolClick(slug: string) {
    haptic();
    pushRecentTool(slug);
  }

  return (
    <div class="d-home">
      {/* Hero */}
      <section class="d-home__hero">
        <h1 class="d-h1">What do you want to do?</h1>
        <p class="d-sub">Fast, private media tools. Nothing leaves your device.</p>
      </section>

      {/* Search shortcut */}
      <a
        href="/app/tools"
        class="d-home__search"
        onClick={() => haptic()}
        aria-label="Search all tools"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <span>Search tools…</span>
      </a>

      {/* Quick actions */}
      <section class="d-home__section">
        <p class="d-eyebrow">Quick actions</p>
        <div class="d-home__quick">
          {quickTools.map((tool) => (
            <a
              key={tool!.slug}
              href={toolUrl(tool!)}
              class="d-quickcard"
              onClick={() => handleToolClick(tool!.slug)}
            >
              <span class="d-quickcard__icon" aria-hidden="true">{tool!.icon}</span>
              <span class="d-quickcard__label">{tool!.name}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Recent tools */}
      {recentTools.length > 0 && (
        <section class="d-home__section">
          <p class="d-eyebrow">Jump back in</p>
          <div class="d-home__list">
            {recentTools.map((tool) => (
              <a
                key={tool!.slug}
                href={toolUrl(tool!)}
                class="d-listrow"
                onClick={() => handleToolClick(tool!.slug)}
              >
                <span class="d-listrow__icon" aria-hidden="true">{tool!.icon}</span>
                <span class="d-listrow__body">
                  <span class="d-listrow__title">{tool!.name}</span>
                  <span class="d-listrow__sub">{tool!.description}</span>
                </span>
                <span class="d-listrow__arrow" aria-hidden="true">›</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Browse all */}
      <section class="d-home__section">
        <a
          href="/app/tools"
          class="d-home__browse"
          onClick={() => haptic()}
        >
          <span>Browse all tools</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </section>
    </div>
  );
}