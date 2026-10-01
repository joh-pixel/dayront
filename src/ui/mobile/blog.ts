/**
 * src/ui/mobile/blog.ts
 * Blog links always open on the web — never inside the mobile app shell.
 *
 * In Capacitor: opens the system browser (Safari / Chrome).
 * On the web: opens a new tab.
 */

const WEB_ORIGIN = 'https://dayront.com';

/**
 * Build a blog URL that should open in the system browser.
 * Returns an absolute URL pointing at the web version.
 */
export function blogHref(path: string): string {
  // Accept either a full path ("/blog/en/foo") or a slug ("foo")
  const clean = path.startsWith('/') ? path : `/blog/en/${path}`;
  return `${WEB_ORIGIN}${clean}`;
}

/**
 * Universal external open. Works in browser (new tab) and Capacitor
 * (system browser via window.open('_system')).
 */
export function openExternal(url: string): void {
  if (typeof window === 'undefined') return;

  // Capacitor: 'window.open(url, "_system")' launches the native browser
  const maybeCap = (window as any).Capacitor;
  if (maybeCap?.isNativePlatform?.()) {
    window.open(url, '_system', 'noopener');
    return;
  }

  // Plain browser: new tab
  window.open(url, '_blank', 'noopener,noreferrer');
}