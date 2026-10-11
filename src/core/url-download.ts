/**
 * src/core/url-download.ts
 * ----------------------------------------------------------------------------
 * Client-side URL download helpers.
 *
 * Design contract:
 *   • No server. Every fetch happens from the user's browser.
 *   • No proxy. URLs are never sent anywhere except the destination host.
 *   • Allowlist-aware, not allowlist-gated — we warn about known-good
 *     sources, block known-impossible ones, and attempt anything else.
 *
 * If the source refuses CORS, the fetch fails in the browser and the UI
 * shows a helpful message. We never route around it.
 */

export interface KnownSource {
  pattern: RegExp;
  label: string;
}

export interface BlockedSource {
  pattern: RegExp;
  label: string;
  reason: string;
}

/**
 * Sources we're confident serve media with permissive CORS headers.
 * These render a "verified source" hint in the UI. They are not the only
 * URLs that work — they're the ones we know about.
 */
export const KNOWN_GOOD_SOURCES: KnownSource[] = [
  { pattern: /(^|\.)archive\.org$/i,    label: 'Internet Archive' },
  { pattern: /\.us\.archive\.org$/i,    label: 'Internet Archive' },
  { pattern: /(^|\.)wikimedia\.org$/i,  label: 'Wikimedia' },
  { pattern: /(^|\.)wikipedia\.org$/i,  label: 'Wikipedia' },
  { pattern: /(^|\.)blender\.org$/i,    label: 'Blender Foundation' },
  { pattern: /(^|\.)xiph\.org$/i,       label: 'Xiph.org' },
  { pattern: /(^|\.)libsyn\.com$/i,     label: 'Libsyn (podcast CDN)' },
  { pattern: /(^|\.)podtrac\.com$/i,    label: 'Podtrac (podcast CDN)' },
  { pattern: /(^|\.)buzzsprout\.com$/i, label: 'Buzzsprout (podcast CDN)' },
  { pattern: /(^|\.)megaphone\.fm$/i,   label: 'Megaphone (podcast CDN)' },
  { pattern: /(^|\.)simplecast\.com$/i, label: 'Simplecast (podcast CDN)' },
  { pattern: /(^|\.)transistor\.fm$/i,  label: 'Transistor (podcast CDN)' },
];

/**
 * Sources that categorically cannot work from a browser fetch. Blocked
 * pre-flight so the user gets a specific reason instead of a generic
 * CORS error three seconds later.
 */
export const BLOCKED_SOURCES: BlockedSource[] = [
  {
    pattern: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i,
    label: 'YouTube',
    reason: 'YouTube requires a signed URL that only their own apps can generate. Browser-based downloads are blocked at the network level.',
  },
  {
    pattern: /(^|\.)tiktok\.com$/i,
    label: 'TikTok',
    reason: 'TikTok blocks cross-origin requests from third-party sites.',
  },
  {
    pattern: /(^|\.)instagram\.com$/i,
    label: 'Instagram',
    reason: 'Instagram blocks cross-origin requests from third-party sites.',
  },
  {
    pattern: /(^|\.)twitter\.com$|(^|\.)x\.com$/i,
    label: 'X / Twitter',
    reason: 'X blocks cross-origin requests from third-party sites.',
  },
  {
    pattern: /(^|\.)facebook\.com$|(^|\.)fb\.watch$/i,
    label: 'Facebook',
    reason: 'Facebook blocks cross-origin requests from third-party sites.',
  },
  {
    pattern: /(^|\.)spotify\.com$/i,
    label: 'Spotify',
    reason: 'Spotify audio is DRM-protected and cannot be downloaded.',
  },
  {
    pattern: /(^|\.)netflix\.com$/i,
    label: 'Netflix',
    reason: 'Netflix content is DRM-protected and cannot be downloaded.',
  },
];

export interface UrlCheckResult {
  kind: 'ok' | 'blocked' | 'invalid';
  hostname?: string;
  knownSource?: string;
  reason?: string;
}

/** Classify a URL before we attempt to fetch it. */
export function checkUrl(rawUrl: string): UrlCheckResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { kind: 'invalid', reason: 'Enter a URL.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { kind: 'invalid', reason: 'That is not a valid URL.' };
  }

  if (parsed.protocol !== 'https:') {
    return { kind: 'invalid', reason: 'Only HTTPS URLs are supported.' };
  }

  const hostname = parsed.hostname;

  for (const blocked of BLOCKED_SOURCES) {
    if (blocked.pattern.test(hostname)) {
      return {
        kind: 'blocked',
        hostname,
        reason: `${blocked.label} — ${blocked.reason}`,
      };
    }
  }

  for (const known of KNOWN_GOOD_SOURCES) {
    if (known.pattern.test(hostname)) {
      return { kind: 'ok', hostname, knownSource: known.label };
    }
  }

  return { kind: 'ok', hostname };
}

/** Best-effort filename from the URL's last path segment. */
export function filenameFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const last = url.pathname.split('/').filter(Boolean).pop() || '';
    if (!last) return 'download';
    const decoded = decodeURIComponent(last);
    return decoded.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'download';
  } catch {
    return 'download';
  }
}

/** Map a MIME type to a file extension when the filename lacks one. */
export function extensionForMime(contentType: string): string {
  const map: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/opus': 'opus',
    'audio/flac': 'flac',
    'audio/aac': 'aac',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-matroska': 'mkv',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
  };
  return map[contentType] || '';
}

/** Lowercase extension from a URL path, without the leading dot. */
export function extensionFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const last = url.pathname.split('/').pop() || '';
    const dot = last.lastIndexOf('.');
    if (dot < 0) return '';
    return last.slice(dot + 1).toLowerCase();
  } catch {
    return '';
  }
}

export type PreviewKind = 'video' | 'audio' | 'image' | 'none';

/**
 * Decide what preview element to render. Uses MIME when informative,
 * falls back to URL extension when the server sends a generic type.
 */
export function previewKind(contentType: string, urlExt: string): PreviewKind {
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType.startsWith('image/')) return 'image';

  if (['mp4', 'webm', 'mov', 'mkv', 'm4v'].includes(urlExt)) return 'video';
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'opus', 'flac'].includes(urlExt)) return 'audio';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(urlExt)) return 'image';

  return 'none';
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}