/**
 * src/ui/mobile/layouts/MobileLayout.tsx
 * ----------------------------------------------------------------------------
 * Native-app shell with:
 *   • Client-side navigation via Astro ClientRouter (instant tab switches)
 *   • Horizontal swipe between bottom-nav tabs (velocity-aware)
 *   • History guard so the app never closes from a back-swipe at root
 *   • Direction-aware View Transitions
 *   • iOS-style peek indicator
 *   • Shared haptic feedback (respects Settings toggle)
 *   • Deep link handling (dayront://…) — cold and warm start
 *
 * NOTE: Header + bottom nav are pinned during View Transitions via CSS
 * `view-transition-name` (see mobile.css). Do NOT add `transition:persist`
 * here — that directive is Astro-only and breaks the Preact JSX parser.
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import BottomNav from '../components/BottomNav';
import { haptic } from '../haptic';

type TabKey = 'home' | 'tools' | 'recent' | 'settings';

interface Props {
  children: ComponentChildren;
  current?: TabKey;
  title?: string;
  backTo?: string;
  hideNav?: boolean;
}

const TAB_ORDER: TabKey[] = ['home', 'tools', 'recent', 'settings'];
const TAB_URLS: Record<TabKey, string> = {
  home: '/app',
  tools: '/app/tools',
  recent: '/app/recent',
  settings: '/app/settings',
};

/** Distance threshold (fraction of viewport width) to commit a swipe. */
const SWIPE_DISTANCE_RATIO = 0.22;

/** Velocity threshold (px/ms) — fast flicks commit sooner. */
const SWIPE_VELOCITY_THRESHOLD = 0.55;

/** Direction lock — horizontal kicks in after this much more horizontal than vertical. */
const DIRECTION_LOCK_PX = 8;

/** Rubber band factor when swiping past the first/last tab. */
const EDGE_RESISTANCE = 0.28;

/* ── Environment ─────────────────────────────────────────── */

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return w.Capacitor?.isNativePlatform?.() === true || w.__TAURI__ !== undefined;
}

/**
 * Navigate to a tab with correct direction + client-side routing when available.
 * Falls back to a full page load if `astro:transitions/client` isn't ready yet.
 */
function navigateTo(tab: TabKey, direction: 'forward' | 'back') {
  const url = TAB_URLS[tab];
  if (typeof document === 'undefined') return;

  // Tell the View Transition CSS which direction we're going
  document.documentElement.dataset.navDir = direction;

  // Clear the direction flag once the transition is done
  setTimeout(() => {
    delete document.documentElement.dataset.navDir;
  }, 320);

  // Prefer Astro's client-side navigation (instant, no white flash)
  import('astro:transitions/client')
    .then((mod) => {
      const nav = (mod as any).navigate;
      if (typeof nav === 'function') {
        nav(url);
      } else {
        window.location.href = url;
      }
    })
    .catch(() => {
      // Router not available (e.g. before ClientRouter is set up) — hard nav
      window.location.href = url;
    });
}

/**
 * Handle an incoming dayront:// deep link.
 *
 * Supported shapes:
 *   dayront://tool/<slug>          → /app/tool/<slug>
 *   dayront://tools                → /app/tools
 *   dayront://recent               → /app/recent
 *   dayront://settings             → /app/settings
 *   dayront://home                 → /app
 *   dayront://anything-else        → /app
 */
function handleDeepLink(rawUrl: string) {
  if (!rawUrl) return;

  try {
    const afterScheme = rawUrl.replace(/^dayront:\/\//, '').replace(/^\/+/, '');
    if (!afterScheme) {
      window.location.href = '/app';
      return;
    }

    const [pathPart, queryPart] = afterScheme.split('?');
    const segments = pathPart.split('/').filter(Boolean);
    const first = segments[0];
    const query = queryPart ? `?${queryPart}` : '';

    // tool/<slug>
    if (first === 'tool' && segments[1]) {
      window.location.href = `/app/tool/${segments[1]}${query}`;
      return;
    }

    // Known tabs
    if (first === 'tools' || first === 'recent' || first === 'settings' || first === 'home') {
      window.location.href = `/app${first === 'home' ? '' : `/${first}`}${query}`;
      return;
    }

    // Fallback — land on Home
    window.location.href = `/app${query}`;
  } catch {
    window.location.href = '/app';
  }
}

/* ══════════════════════════════════════════════════════════ */

export default function MobileLayout({
  children,
  current = 'home',
  title,
  backTo,
  hideNav = false,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [peek, setPeek] = useState<{ side: 'left' | 'right'; intensity: number } | null>(null);

  /* ── History guard: prevent the app from closing on swipe-back at root ── */
  useEffect(() => {
    if (hideNav) return;

    // Push a synthetic entry so there's always "somewhere to go back to".
    if (history.state?.dayrontGuard !== true) {
      history.pushState(
        { dayrontGuard: true, ts: Date.now() },
        '',
        location.href,
      );
    }

    const onPop = () => {
      // If we're still at a root tab, silently re-arm and nudge the UI.
      history.pushState(
        { dayrontGuard: true, ts: Date.now() },
        '',
        location.href,
      );
      haptic(4);

      const el = contentRef.current;
      if (el) {
        el.animate(
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' },
          ],
          { duration: 260, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
        );
      }
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [hideNav]);

  /* ── Deep links (dayront://…)
     Only runs inside the native app shell. On web, it's a no-op. */
  useEffect(() => {
    if (!isNativeApp()) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const mod: any = await import(/* @vite-ignore */ '@capacitor/app');
        const App = mod.App;
        if (!App || cancelled) return;

        // Cold start: the URL that launched the app (if any)
        try {
          const launch = await App.getLaunchUrl();
          if (launch?.url && !cancelled) {
            handleDeepLink(launch.url);
          }
        } catch {}

        // Warm start: listen for new links while the app runs
        try {
          const handle = await App.addListener('appUrlOpen', (event: any) => {
            if (event?.url) handleDeepLink(event.url);
          });
          cleanup = () => {
            try { handle.remove(); } catch {}
          };
        } catch {}
      } catch {
        // Plugin not installed — deep links simply don't fire. No harm done.
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  /* ── Swipe between tabs ── */
  useEffect(() => {
    const el = contentRef.current;
    if (!el || hideNav) return;

    const idx = TAB_ORDER.indexOf(current);
    const canGoPrev = idx > 0;
    const canGoNext = idx < TAB_ORDER.length - 1;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let locked: 'none' | 'horizontal' | 'vertical' = 'none';
    let committed = false;
    let active = false;

    const setOffset = (
      x: number,
      side: 'left' | 'right' | null,
      intensity = 0,
    ) => {
      offsetRef.current = x;
      el.style.setProperty('--drag-x', `${x}px`);
      el.style.setProperty('--drag-peek', String(intensity));
      if (side) setPeek({ side, intensity });
      else setPeek(null);
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      startX = lastX = t.clientX;
      startY = t.clientY;
      startT = lastT = performance.now();
      velocity = 0;
      locked = 'none';
      committed = false;
      active = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!active || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (locked === 'none') {
        if (Math.abs(dx) > Math.abs(dy) + DIRECTION_LOCK_PX) locked = 'horizontal';
        else if (Math.abs(dy) > Math.abs(dx) + DIRECTION_LOCK_PX) locked = 'vertical';
      }

      if (locked !== 'horizontal') return;

      e.preventDefault();
      if (!dragging) setDragging(true);

      // Track velocity
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) velocity = (t.clientX - lastX) / dt;
      lastX = t.clientX;
      lastT = now;

      // Rubber-band at edges
      let effective = dx;
      if ((dx > 0 && !canGoPrev) || (dx < 0 && !canGoNext)) {
        effective = dx * EDGE_RESISTANCE;
      }

      const max = window.innerWidth;
      const intensity = Math.min(
        1,
        Math.abs(effective) / (max * SWIPE_DISTANCE_RATIO),
      );

      if (!committed && intensity >= 1) {
        committed = true;
        haptic(10);
      } else if (committed && intensity < 0.85) {
        committed = false;
      }

      setOffset(effective, effective > 0 ? 'left' : 'right', intensity);
    };

    const onEnd = () => {
      if (!active) return;
      active = false;

      if (locked !== 'horizontal') {
        setDragging(false);
        return;
      }

      const dx = offsetRef.current;
      const dist = Math.abs(dx);
      const threshold = window.innerWidth * SWIPE_DISTANCE_RATIO;

      // Commit if distance OR velocity crosses threshold
      const passedDistance = dist > threshold;
      const passedVelocity =
        Math.abs(velocity) > SWIPE_VELOCITY_THRESHOLD &&
        // Velocity must agree with the drag direction
        Math.sign(velocity) === Math.sign(dx);

      setDragging(false);
      setOffset(0, null, 0);

      if (dx > 0 && canGoPrev && (passedDistance || passedVelocity)) {
        haptic(14);
        navigateTo(TAB_ORDER[idx - 1], 'back');
      } else if (dx < 0 && canGoNext && (passedDistance || passedVelocity)) {
        haptic(14);
        navigateTo(TAB_ORDER[idx + 1], 'forward');
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
      el.style.setProperty('--drag-x', '0px');
      el.style.setProperty('--drag-peek', '0');
    };
  }, [current, hideNav, dragging]);

  /* ── Bottom-nav tap handler — uses the same navigateTo helper ── */
  const handleNavTap = (tab: TabKey) => {
    const currentIdx = TAB_ORDER.indexOf(current);
    const targetIdx = TAB_ORDER.indexOf(tab);
    if (currentIdx === targetIdx) return;
    const direction: 'forward' | 'back' = targetIdx > currentIdx ? 'forward' : 'back';
    navigateTo(tab, direction);
  };

  return (
    <div
      class={`d-app ${hideNav ? 'd-app--no-nav' : ''}`}
      data-shell="mobile"
    >
      <header class="d-app__header">
        {backTo && (
          <a href={backTo} class="d-app__back" aria-label="Back">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </a>
        )}
        <div class={`d-app__title ${!title ? 'd-app__title--brand' : ''}`}>
          {title ?? 'Dayront'}
        </div>
        <div class="d-app__spacer" />
      </header>

      <main
        ref={contentRef}
        class={`d-app__content ${dragging ? 'd-app__content--dragging' : ''}`}
      >
        {children}
      </main>

      {peek && (
        <>
          {peek.side === 'left' && (
            <div
              class="d-app__peek d-app__peek--left d-app__peek--visible"
              aria-hidden="true"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
          )}
          {peek.side === 'right' && (
            <div
              class="d-app__peek d-app__peek--right d-app__peek--visible"
              aria-hidden="true"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          )}
        </>
      )}

      {!hideNav && (
        <BottomNav current={current} onNavigate={handleNavTap} />
      )}
    </div>
  );
}