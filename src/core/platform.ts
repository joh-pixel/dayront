/**
 * src/core/platform.ts
 * ----------------------------------------------------------------------------
 * Detects which environment the code is running in:
 *
 *   'web'        — normal browser (Vercel / mobile web)
 *   'mobile'     — Capacitor Android/iOS app
 *   'desktop'    — Tauri desktop app
 *   'extension'  — Chrome / Firefox / Edge extension
 *   'server'     — during Astro SSR / build (no window)
 *
 * Used to:
 *   - swap layouts
 *   - adjust file size limits
 *   - route FFmpeg to WASM vs native
 *   - decide whether to open external links in system browser
 */

export type PlatformType = 'web' | 'mobile' | 'desktop' | 'extension' | 'server';

export interface PlatformInfo {
  type: PlatformType;
  label: string;
  /** What FFmpeg engine this platform should use. */
  engine: 'wasm' | 'native';
  /** Max file size in MB (safe default for this platform). */
  maxMB: number;
  /** True if this platform has native file pickers / share sheets. */
  hasNativeFiles: boolean;
  /** True if this platform should open external URLs (blog, privacy) in a system browser. */
  opensExternal: boolean;
  /** True if this is a small screen (rough heuristic — good enough for layout). */
  isMobileViewport: boolean;
}

/* ── Internal detection helpers ──────────────────────────── */

function hasWindow(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

function isTauri(): boolean {
  if (!hasWindow()) return false;
  const w = window as any;
  return w.__TAURI__ !== undefined || w.__TAURI_INTERNALS__ !== undefined;
}

function isCapacitor(): boolean {
  if (!hasWindow()) return false;
  const w = window as any;
  return w.Capacitor?.isNativePlatform?.() === true;
}

function isExtension(): boolean {
  if (!hasWindow()) return false;
  const w = window as any;
  // Chrome extensions expose chrome.runtime.id
  if (typeof w.chrome !== 'undefined' && w.chrome.runtime?.id) return true;
  // Firefox extensions expose browser.runtime.id
  if (typeof w.browser !== 'undefined' && w.browser.runtime?.id) return true;
  return false;
}

function isMobileViewport(): boolean {
  if (!hasWindow()) return false;
  // Prefer the actual viewport width over user agent sniffing
  if (window.innerWidth && window.innerWidth < 768) return true;
  // Fallback: touch + small screen
  return (
    'ontouchstart' in window &&
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

function isMobileUA(): boolean {
  if (!hasWindow()) return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/* ── Public API ───────────────────────────────────────────── */

/**
 * Detect the current platform. Safe to call on server (returns 'server').
 * Cached after first call for performance.
 */
let cached: PlatformInfo | null = null;

export function getPlatform(): PlatformInfo {
  if (cached) return cached;

  if (!hasWindow()) {
    cached = {
      type: 'server',
      label: 'Server',
      engine: 'wasm',
      maxMB: 0,
      hasNativeFiles: false,
      opensExternal: false,
      isMobileViewport: false,
    };
    return cached;
  }

  const mobileViewport = isMobileViewport();
  const mobile = isMobileUA();
  const tauri = isTauri();
  const cap = isCapacitor();
  const ext = isExtension();

  /* Desktop app (Tauri) */
  if (tauri) {
    cached = {
      type: 'desktop',
      label: 'Dayront Desktop',
      engine: 'native',
      maxMB: 5000,
      hasNativeFiles: true,
      opensExternal: false,
      isMobileViewport: false,
    };
    return cached;
  }

  /* Mobile app (Capacitor) */
  if (cap) {
    cached = {
      type: 'mobile',
      label: 'Dayront App',
      engine: 'native',
      maxMB: 2000,
      hasNativeFiles: true,
      opensExternal: true,   // open blogs in Safari / Chrome
      isMobileViewport: true,
    };
    return cached;
  }

  /* Browser extension */
  if (ext) {
    cached = {
      type: 'extension',
      label: 'Dayront Extension',
      engine: 'wasm',
      maxMB: 50,
      hasNativeFiles: false,
      opensExternal: true,
      isMobileViewport: false,
    };
    return cached;
  }

  /* Web — split by mobile vs desktop viewport */
  if (mobile || mobileViewport) {
    cached = {
      type: 'web',
      label: 'Web (mobile)',
      engine: 'wasm',
      maxMB: 100,
      hasNativeFiles: false,
      opensExternal: false,
      isMobileViewport: true,
    };
    return cached;
  }

  cached = {
    type: 'web',
    label: 'Web',
    engine: 'wasm',
    maxMB: 500,
    hasNativeFiles: false,
    opensExternal: false,
    isMobileViewport: false,
  };
  return cached;
}

/** Is the current platform native (Capacitor or Tauri)? */
export function isNativePlatform(): boolean {
  const p = getPlatform().type;
  return p === 'mobile' || p === 'desktop';
}

/** Is the current platform running in a small viewport? */
export function isMobileViewportNow(): boolean {
  return getPlatform().isMobileViewport;
}

/** Should we open external links (blog, privacy) in a new system browser? */
export function shouldOpenExternal(): boolean {
  return getPlatform().opensExternal;
}

/** Reset the cache — useful in tests or after hot reload. */
export function resetPlatformCache(): void {
  cached = null;
}