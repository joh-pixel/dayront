/**
 * src/ui/mobile/components/BottomNav.tsx
 * Fixed bottom navigation with gradient pill indicator.
 */
interface Props {
  current?: 'home' | 'tools' | 'recent' | 'settings';
}

const ITEMS = [
  {
    key: 'home',
    label: 'Home',
    href: '/app',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    key: 'tools',
    label: 'Tools',
    href: '/app/tools',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14.7 6.3a4 4 0 1 0 5 5L21 13l-8 8-2-2 8-8z" />
        <path d="M3 21l3.5-3.5" />
      </svg>
    ),
  },
  {
    key: 'recent',
    label: 'Recent',
    href: '/app/recent',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H10a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    ),
  },
];

function haptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(6); } catch {}
  }
}

export default function BottomNav({ current = 'home' }: Props) {
  function handleNav(e: MouseEvent, key: string) {
    if (key === current) {
      e.preventDefault();
      haptic();
      return;
    }
    // Direction hint for view transitions
    const order = ITEMS.map((i) => i.key);
    const from = order.indexOf(current);
    const to = order.indexOf(key);
    document.documentElement.dataset.navDir = to > from ? 'forward' : 'back';
    haptic();
  }

  return (
    <nav class="d-bottomnav" aria-label="Primary">
      {ITEMS.map((item) => {
        const active = item.key === current;
        return (
          <a
            key={item.key}
            href={item.href}
            class={`d-bottomnav__item ${active ? 'd-bottomnav__item--active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => handleNav(e as any, item.key)}
          >
            <span class="d-bottomnav__icon">{item.icon}</span>
            <span class="d-bottomnav__label">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}