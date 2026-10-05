/**
 * src/ui/mobile/layouts/MobileLayout.tsx
 * ----------------------------------------------------------------------------
 * Native-app shell with:
 *   • Client-side navigation via Astro ClientRouter
 *   • Horizontal swipe between bottom-nav tabs (velocity-aware)
 *   • History guard that only re-arms at ROOT tabs — never blocks real back nav
 *   • Native Android back-button interceptor (app never closes at a root tab)
 *   • Direction-aware View Transitions
 *   • iOS-style peek indicator
 *   • Deep link handling (dayront://…) — cold and warm start
 *
 * IMPORTANT: this component MUST be rendered with `client:load` in the
 * parent .astro file. Without it, none of the useEffect hooks run and
 * swipes, history guard, and back-button interception are all dead.
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

/** Root routes — the back button is swallowed here. */
const ROOT_PATHS = new Set(['/', '/tools', '/recent', '/settings']);

/** Distance threshold (fraction of viewport width) to commit a swipe. */
const SWIPE_DISTANCE_RATIO = 0.22;

/** Velocity threshold (px/ms) — fast flicks commit sooner. */
const SWIPE_VELOCITY_THRESHOLD = 0.55;

/** Direction lock — horizontal kicks in after this much more horizontal
    than vertical. Deliberately small (4px) so we can intercept the
    gesture before the browser decides it's a scroll/back gesture. */
const DIRECTION_LOCK_PX = 4;

/** Rubber band factor when swiping past the first/last tab. */
const EDGE_RESISTANCE = 0.28;

/* ── Environment ─────────────────────────────────────────── */

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return w.Capacitor?.isNativePlatform?.() === true || w.__TAURI__ !== undefined;
}

/**
 * Normalize the current URL path to a root slug, or 'other' when it's
 * a detail page (like /app/tool/xxx).
 */
function currentRoot(): string {
  const clean = location.pathname.replace(/\/$/, '').replace(/^\/app/, '') || '/';
  return ROOT_PATHS.has(clean) ? clean : 'other';
}

/**
 * Navigate to a tab with correct direction + client-side routing when available.
 */
function navigateTo(tab: TabKey, direction: 'forward' | 'back') {
  const url = TAB_URLS[tab];
  if (typeof document === 'undefined') return;

  document.documentElement.dataset.navDir = direction;

  setTimeout(() => {
    delete document.documentElement.dataset.navDir;
  }, 320);

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
      window.location.href = url;
    });
}

/**
 * Handle an incoming dayront:// deep link.
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

    if (first === 'tool' && segments[1]) {
      window.location.href = `/app/tool/${segments[1]}${query}`;
      return;
    }

    if (first === 'tools' || first === 'recent' || first === 'settings' || first === 'home') {
      window.location.href = `/app${first === 'home' ? '' : `/${first}`}${query}`;
      return;
    }

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
  const [peek, setPeek] = useState<{ side: 'left' | 'right'; intensity: number } | null>(null);

  /* ── History guard ── */
  useEffect(() => {
    if (hideNav) return;

    if (currentRoot() !== 'other' && history.state?.dayrontGuard !== true) {
      history.pushState({ dayrontGuard: true, ts: Date.now() }, '', location.href);
    }

    const onPop = () => {
      if (currentRoot() === 'other') return;

      history.pushState({ dayrontGuard: true, ts: Date.now() }, '', location.href);
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

  /* ── Native Android back button + deep links ── */
  useEffect(() => {
    if (!isNativeApp()) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const mod: any = await import(/* @vite-ignore */ '@capacitor/app');
        const App = mod.App;
        if (!App || cancelled) return;

        let backHandle: any;
        try {
          backHandle = await App.addListener('backButton', (info: any) => {
            if (currentRoot() === 'other') {
              if (info?.canGoBack !== false) {
                window.history.back();
              }
              return;
            }

            haptic(4);
            const el = contentRef.current;
            if (el) {
              el.animate(
                [
                  { transform: 'translateX(0)' },
                  { transform: 'translateX(10px)' },
                  { transform: 'translateX(0)' },
                ],
                { duration: 240, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
              );
            }
          });
        } catch {}

        try {
          const launch = await App.getLaunchUrl();
          if (launch?.url && !cancelled) handleDeepLink(launch.url);
        } catch {}

        let urlHandle: any;
        try {
          urlHandle = await App.addListener('appUrlOpen', (event: any) => {
            if (event?.url) handleDeepLink(event.url);
          });
        } catch {}

        cleanup = () => {
          try { backHandle?.remove(); } catch {}
          try { urlHandle?.remove(); } catch {}
        };
      } catch {}
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  /* ── Swipe between tabs ──
     KEY FIX: call preventDefault() as soon as ANY horizontal movement is
     detected — before the direction lock is decided. Otherwise Chrome
     commits to a scroll/back gesture and cancels our touch events.

     The `.d-app__content` element also has `touch-action: pan-y` in CSS,
     which lets the browser know we own horizontal gestures. */
  useEffect(() => {
    const el = contentRef.current;
    if (!el || hideNav) return;

    const idx = TAB_ORDER.indexOf(current);
    const canGoPrev = idx > 0;
    const canGoNext = idx >= 0 && idx < TAB_ORDER.length - 1;

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let locked: 'none' | 'horizontal' | 'vertical' = 'none';
    let committed = false;
    let active = false;
    let draggingLocal = false;

    const setDraggingClass = (on: boolean) => {
      if (draggingLocal === on) return;
      draggingLocal = on;
      el.classList.toggle('d-app__content--dragging', on);
    };

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
      lastT = performance.now();
      velocity = 0;
      locked = 'none';
      committed = false;
      active = true;

      // Lock horizontal gestures on the element for the duration of this
      // touch. This forces the browser to defer to us for horizontal pans
      // and only handle vertical scrolls itself.
      el.style.touchAction = 'pan-y';
    };

    const onMove = (e: TouchEvent) => {
      if (!active || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      // Direction lock: decide ONCE, as early as possible.
      if (locked === 'none') {
        if (Math.abs(dx) > Math.abs(dy) + DIRECTION_LOCK_PX) locked = 'horizontal';
        else if (Math.abs(dy) > Math.abs(dx) + DIRECTION_LOCK_PX) locked = 'vertical';
      }

      // Vertical → hand off to the browser, do nothing.
      if (locked === 'vertical') return;

      // If we have ANY horizontal intent, freeze the browser's gesture
      // immediately. Without this, Chrome treats the pan as a scroll
      // or an edge-swipe and cancels our touch sequence.
      if (Math.abs(dx) > 1 && e.cancelable) {
        e.preventDefault();
      }

      // Not yet locked → waiting for the tiny threshold to pass.
      if (locked !== 'horizontal') return;

      setDraggingClass(true);

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

      // Restore the default touch behavior for next time.
      el.style.touchAction = '';

      if (locked !== 'horizontal') {
        setDraggingClass(false);
        return;
      }

      const dx = offsetRef.current;
      const dist = Math.abs(dx);
      const threshold = window.innerWidth * SWIPE_DISTANCE_RATIO;

      const passedDistance = dist > threshold;
      const passedVelocity =
        Math.abs(velocity) > SWIPE_VELOCITY_THRESHOLD &&
        Math.sign(velocity) === Math.sign(dx);

      setDraggingClass(false);
      setOffset(0, null, 0);

      if (dx > 0 && canGoPrev && (passedDistance || passedVelocity)) {
        haptic(14);
        navigateTo(TAB_ORDER[idx - 1], 'back');
      } else if (dx < 0 && canGoNext && (passedDistance || passedVelocity)) {
        haptic(14);
        navigateTo(TAB_ORDER[idx + 1], 'forward');
      }
    };

    // touchstart is passive:false so we *could* preventDefault there if needed.
    // touchmove MUST be passive:false so our preventDefault is honored.
    el.addEventListener('touchstart', onStart, { passive: false });
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
      el.style.touchAction = '';
      el.classList.remove('d-app__content--dragging');
    };
  }, [current, hideNav]);

  /* ── Bottom-nav tap handler ── */
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

      <main ref={contentRef} class="d-app__content">
        {children}
      </main>

      {peek && (
        <>
          {peek.side === 'left' && (
            <div class="d-app__peek d-app__peek--left d-app__peek--visible" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
          )}
          {peek.side === 'right' && (
            <div class="d-app__peek d-app__peek--right d-app__peek--visible" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          )}
        </>
      )}

      {!hideNav && <BottomNav current={current} onNavigate={handleNavTap} />}
    </div>
  );
}