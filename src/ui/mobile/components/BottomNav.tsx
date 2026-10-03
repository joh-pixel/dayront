/**
 * src/ui/mobile/components/BottomNav.tsx
 * ----------------------------------------------------------------------------
 * Bottom navigation bar for the mobile shell.
 *
 * • Uses the shared `haptic()` helper → respects the Settings toggle.
 * • Tapping a tab sets `data-nav-dir` on <html> so the View Transition
 *   slides in the correct direction (forward = left-slide, back = right-slide).
 * • If a parent (MobileLayout) passes `onNavigate`, we defer to it entirely
 *   so it can control navigation timing (e.g. swipe gestures).
 */
import { useEffect, useState } from 'preact/hooks';
import { haptic } from '../haptic';

type TabKey = 'home' | 'tools' | 'recent' | 'settings';

interface Props {
  current?: TabKey;
  /** Optional — parent can intercept to control transition direction. */
  onNavigate?: (tab: TabKey) => void;
}

const TABS: Array<{ key: TabKey; label: string; href: string; icon: JSX.Element }> = [
  {
    key: 'home',
    label: 'Home',
    href: '/app',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    key: 'tools',
    label: 'Tools',
    href: '/app/tools',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.7-2.7 2.3-2.3z" />
      </svg>
    ),
  },
  {
    key: 'recent',
    label: 'Recent',
    href: '/app/recent',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/app/settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    ),
  },
];

export default function BottomNav({ current = 'home', onNavigate }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <nav class="d-bottomnav" role="tablist" aria-label="Main navigation">
      {TABS.map((tab) => {
        const active = current === tab.key;
        return (
          <a
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={active}
            aria-current={active ? 'page' : undefined}
            class={`d-bottomnav__item ${active ? 'd-bottomnav__item--active' : ''}`}
            onClick={(e) => {
              // Tapping the current tab → do nothing (avoids a pointless transition)
              if (active) {
                e.preventDefault();
                haptic();
                return;
              }

              if (!mounted) return;

              if (onNavigate) {
                e.preventDefault();
                onNavigate(tab.key);
              } else {
                haptic();
                // Let ClientRouter handle it — set direction before navigating
                const currentIdx = TABS.findIndex((t) => t.key === current);
                const targetIdx  = TABS.findIndex((t) => t.key === tab.key);
                document.documentElement.dataset.navDir =
                  targetIdx > currentIdx ? 'forward' : 'back';
                setTimeout(() => {
                  delete document.documentElement.dataset.navDir;
                }, 300);
              }
            }}
          >
            <span class="d-bottomnav__icon">{tab.icon}</span>
            <span class="d-bottomnav__label">{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}