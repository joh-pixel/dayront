/**
 * src/ui/mobile/layouts/MobileLayout.tsx
 * ----------------------------------------------------------------------------
 * Native-app shell with:
 *   • Client-side navigation via Astro ClientRouter
 *   • Horizontal swipe between bottom-nav tabs
 *   • History guard + native back-button interceptor
 *   • Double-press back to exit (standard Android pattern)
 *   • Navigation guard (blocks back while a tool is processing)
 *   • Last-route memory — reopens where you left off
 *   • Deep link handling (dayront://…)
 *   • Service-worker purge inside the native shell (prevents stale-web
 *     fallbacks when offline)
 *
 * IMPORTANT: rendered with `client:load` in every parent .astro file.
 *
 * IMPORTANT: `@capacitor/app` is loaded via a DYNAMIC import inside a
 * useEffect — NOT a static top-level import. A static import breaks the
 * web bundle because the browser tries to resolve the bare specifier.
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import BottomNav from '../components/BottomNav';
import { haptic } from '../haptic';
import { canNavigate } from '../navigation-guard';

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

const ROOT_PATHS = new Set(['/', '/tools', '/recent', '/settings']);

const SWIPE_DISTANCE_RATIO = 0.22;
const SWIPE_VELOCITY_THRESHOLD = 0.55;
const DIRECTION_LOCK_PX = 4;
const EDGE_RESISTANCE = 0.28;

const ROUTE_KEY = 'dayront:last-route';
const SESSION_BOOT_KEY = 'dayront:session-boot';
const EXIT_CONFIRM_MS = 2000;

/* ── Environment ─────────────────────────────────────────── */

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return w.Capacitor?.isNativePlatform?.() === true || w.__TAURI__ !== undefined;
}

function currentRoot(): string {
  const clean = location.pathname.replace(/\/$/, '').replace(/^\/app/, '') || '/';
  return ROOT_PATHS.has(clean) ? clean : 'other';
}

/* ── Route memory ────────────────────────────────────────── */

function saveLastRoute(path: string): void {
  try { localStorage.setItem(ROUTE_KEY, path); } catch {}
}

function getLastRoute(): string | null {
  try { return localStorage.getItem(ROUTE_KEY); } catch { return null; }
}

/* ── Navigation helpers ──────────────────────────────────── */

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
      if (typeof nav === 'function') nav(url);
      else window.location.href = url;
    })
    .catch(() => {
      window.location.href = url;
    });
}

function handleDeepLink(rawUrl: string) {
  if (!rawUrl) return;
  try {
    const afterScheme = rawUrl.replace(/^dayront:\/\//, '').replace(/^\/+/, '');
    if (!afterScheme) { window.location.href = '/app'; return; }

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

  /* ── Remember the last visited route ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    saveLastRoute(location.pathname);
  }, [current]);

  /* ── Service-worker purge (native shell) ──
     Inside the Capacitor APK, a leftover service worker from a prior web
     visit will serve cached HTML/JS on offline boots. That cached bundle
     lacks the native bridge, so the app silently falls back to web
     behaviour: it "opens", lets you pick a file, then errors with
     "download Dayront" because runTool() routes to the WASM/web path.

     Fix: when running inside the native shell, actively tear down every
     registered SW and wipe Cache Storage on boot. On the web this is a
     no-op — the SW in BaseLayout.astro stays registered. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isNativeApp()) return;
    if (!('serviceWorker' in navigator)) return;

    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          try { await reg.unregister(); } catch {}
        }
      } catch {}

      try {
        if (window.caches && typeof caches.keys === 'function') {
          const keys = await caches.keys();
          for (const key of keys) {
            try { await caches.delete(key); } catch {}
          }
        }
      } catch {}
    })();
  }, []);

  /* ── Cold-start route restore ── */
  useEffect(() => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;

    if (sessionStorage.getItem(SESSION_BOOT_KEY) === '1') return;
    sessionStorage.setItem(SESSION_BOOT_KEY, '1');

    const here = location.pathname.replace(/\/$/, '') || '/app';
    const saved = (getLastRoute() || '').replace(/\/$/, '');
    if (!saved) return;

    if (here === '/app' && saved !== '/app') {
      window.location.replace(saved);
    }
  }, []);

  /* ── History guard (web fallback) ── */
  useEffect(() => {
    if (hideNav) return;

    if (currentRoot() !== 'other' && history.state?.dayrontGuard !== true) {
      history.pushState({ dayrontGuard: true, ts: Date.now() }, '', location.href);
    }

    const onPop = () => {
      if (currentRoot() === 'other') return;

      if (history.state?.dayrontGuard !== true) {
        history.pushState({ dayrontGuard: true, ts: Date.now() }, '', location.href);
      }
      haptic(4);
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [hideNav]);

  /* ── Native back button + deep links ──
     Loads @capacitor/app DYNAMICALLY so the browser never sees the bare
     specifier at parse time. The try/catch swallows the browser's failure. */
  useEffect(() => {
    let cancelled = false;
    let backHandle: any;
    let urlHandle: any;
    let lastBackPress = 0;

    (async () => {
      try {
        const mod = await import('@capacitor/app');
        const App = (mod as any).App;
        if (!App || cancelled) return;

        /* ── Back button ──
           Order of checks:
             1. Tool is processing → swallow entirely (no dialog, no exit)
             2. Detail page         → real back navigation
             3. Root tab            → double-press to exit */
        try {
          backHandle = await App.addListener('backButton', () => {
            // ★ Navigation guard — ToolScreen registers this while processing
            if (!canNavigate()) {
              haptic(4);
              return;  // silently ignore the back press
            }

            // Detail page → real back navigation
            if (currentRoot() === 'other') {
              window.history.back();
              return;
            }

            // Root tab → double-press to exit
            const now = Date.now();
            if (now - lastBackPress < EXIT_CONFIRM_MS) {
              try { App.exitApp(); } catch {}
              return;
            }
            lastBackPress = now;

            haptic(6);
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
        } catch (err) {
          console.warn('[MobileLayout] backButton listener failed:', err);
        }

        /* ── Cold-start deep link ── */
        try {
          const launch = await App.getLaunchUrl();
          if (launch?.url && !cancelled) handleDeepLink(launch.url);
        } catch {}

        /* ── Warm-start deep link ── */
        try {
          urlHandle = await App.addListener('appUrlOpen', (event: any) => {
            if (event?.url) handleDeepLink(event.url);
          });
        } catch {}
      } catch {
        // Not running inside Capacitor — history guard handles it.
      }
    })();

    return () => {
      cancelled = true;
      try { backHandle?.remove(); } catch {}
      try { urlHandle?.remove(); } catch {}
    };
  }, []);

  /* ── Swipe between tabs ── */
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

    const setOffset = (x: number, side: 'left' | 'right' | null, intensity = 0) => {
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
      el.style.touchAction = 'pan-y';
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

      if (locked === 'vertical') return;
      if (Math.abs(dx) > 1 && e.cancelable) e.preventDefault();
      if (locked !== 'horizontal') return;

      setDraggingClass(true);

      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) velocity = (t.clientX - lastX) / dt;
      lastX = t.clientX;
      lastT = now;

      let effective = dx;
      if ((dx > 0 && !canGoPrev) || (dx < 0 && !canGoNext)) {
        effective = dx * EDGE_RESISTANCE;
      }

      const max = window.innerWidth;
      const intensity = Math.min(1, Math.abs(effective) / (max * SWIPE_DISTANCE_RATIO));

      if (!committed && intensity >= 1) { committed = true; haptic(10); }
      else if (committed && intensity < 0.85) { committed = false; }

      setOffset(effective, effective > 0 ? 'left' : 'right', intensity);
    };

    const onEnd = () => {
      if (!active) return;
      active = false;
      el.style.touchAction = '';

      if (locked !== 'horizontal') { setDraggingClass(false); return; }

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

  const handleNavTap = (tab: TabKey) => {
    const currentIdx = TAB_ORDER.indexOf(current);
    const targetIdx = TAB_ORDER.indexOf(tab);
    if (currentIdx === targetIdx) return;
    navigateTo(tab, targetIdx > currentIdx ? 'forward' : 'back');
  };

  return (
    <div
      class={`d-app ${hideNav ? 'd-app--no-nav' : ''}`}
      data-shell="mobile"
    >
      <header class="d-app__header">
        {backTo && (
          <a href={backTo} class="d-app__back" aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
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