/**
 * src/ui/mobile/layouts/MobileLayout.tsx
 * Native-app shell with horizontal swipe between tabs.
 *
 * Gesture model:
 *   - Touch on content area
 *   - Detect horizontal vs vertical movement (direction lock after 8px)
 *   - Horizontal: translate content by the drag delta, show peek indicator
 *   - Release past 26% of viewport width: navigate to adjacent tab
 *   - Release before that: snap back
 *   - Vertical: let the browser handle normal scrolling
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import BottomNav from '../components/BottomNav';

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

const SWIPE_THRESHOLD_RATIO = 0.26;

function haptic(ms = 8) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch {}
  }
}

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

  useEffect(() => {
    const el = contentRef.current;
    if (!el || hideNav) return;

    const idx = TAB_ORDER.indexOf(current);
    const canGoPrev = idx > 0;
    const canGoNext = idx < TAB_ORDER.length - 1;

    let startX = 0;
    let startY = 0;
    let locked: 'none' | 'horizontal' | 'vertical' = 'none';
    let committed = false;

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
      startX = t.clientX;
      startY = t.clientY;
      locked = 'none';
      committed = false;
      setDragging(false);
    };

    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (locked === 'none') {
        if (Math.abs(dx) > Math.abs(dy) + 6) locked = 'horizontal';
        else if (Math.abs(dy) > Math.abs(dx) + 6) locked = 'vertical';
      }

      if (locked !== 'horizontal') return;

      e.preventDefault();
      if (!dragging) setDragging(true);

      // Edge rubber band — if trying to swipe past the first/last tab
      let effective = dx;
      if ((dx > 0 && !canGoPrev) || (dx < 0 && !canGoNext)) {
        effective = dx * 0.28;
      }

      const max = window.innerWidth;
      const intensity = Math.min(1, Math.abs(effective) / (max * SWIPE_THRESHOLD_RATIO));

      // Commit feedback once
      if (!committed && intensity >= 1) {
        committed = true;
        haptic(10);
      } else if (committed && intensity < 0.85) {
        committed = false;
      }

      setOffset(effective, effective > 0 ? 'left' : 'right', intensity);
    };

    const onEnd = () => {
      if (locked !== 'horizontal') {
        setDragging(false);
        return;
      }

      const dx = offsetRef.current;
      const threshold = window.innerWidth * SWIPE_THRESHOLD_RATIO;

      setDragging(false);
      setOffset(0, null, 0);

      if (dx > threshold && canGoPrev) {
        haptic(14);
        navigateTo(TAB_ORDER[idx - 1], 'back');
      } else if (dx < -threshold && canGoNext) {
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

  return (
    <div class={`d-app ${hideNav ? 'd-app--no-nav' : ''}`}>
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

      <main
        ref={contentRef}
        class={`d-app__content ${dragging ? 'd-app__content--dragging' : ''}`}
      >
        {children}
      </main>

      {/* Peek indicators during swipe */}
      {peek && (
        <>
          {peek.side === 'left' && (
            <div class="d-app__peek d-app__peek--left d-app__peek--visible" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </div>
          )}
          {peek.side === 'right' && (
            <div class="d-app__peek d-app__peek--right d-app__peek--visible" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          )}
        </>
      )}

      {!hideNav && <BottomNav current={current} />}
    </div>
  );
}

/* ── Navigation helper ──────────────────────────────────── */

function navigateTo(tab: TabKey, direction: 'forward' | 'back') {
  const url = TAB_URLS[tab];
  if (typeof document === 'undefined') return;

  // Tell the View Transition CSS which direction we're going
  document.documentElement.dataset.navDir = direction;

  // Astro intercepts same-origin navigations and uses view transitions
  // if the browser supports it. Fallback to standard navigation.
  window.location.href = url;
}