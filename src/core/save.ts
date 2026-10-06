/**
 * src/core/save.ts
 * ----------------------------------------------------------------------------
 * Save + share utilities that work on both web and native.
 *
 *   saveBlob   → writes to Documents/ (native) or triggers a download (web)
 *   shareBlob  → native share sheet (native) or Web Share API (web)
 *   makeOutputName → generates a user-friendly output filename
 *
 * Uses @capacitor/filesystem + @capacitor/share on native, with graceful
 * fallback to plain browser APIs on web.
 */

/* ── Environment ─────────────────────────────────────────── */

function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return w.Capacitor?.isNativePlatform?.() === true;
}

/* ── Blob → base64 helper ─────────────────────────────────── */

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      // Strip the "data:*/*;base64," prefix — Capacitor Filesystem wants raw base64
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/* ── Filename sanitization ─────────────────────────────────── */

/**
 * Clean a filename coming from a native file picker.
 * Android often returns a cache filename like:
 *   1fe1b7284582461dd13491ee4a532624_1790997802297.mp4
 * We strip the hex+timestamp prefix so the user sees "my-file.mp4"
 * instead of a wall of characters.
 */
export function cleanFileName(rawName: string): string {
  if (!rawName) return 'my-file';

  // Split off the extension
  const lastDot = rawName.lastIndexOf('.');
  const hasExt = lastDot > 0 && lastDot < rawName.length - 1;
  const ext = hasExt ? rawName.slice(lastDot) : '';
  const base = hasExt ? rawName.slice(0, lastDot) : rawName;

  let cleaned = base;

  // Strip Android cache pattern: 32-char hex + underscore + 13-digit timestamp
  cleaned = cleaned.replace(/^[a-f0-9]{32}_\d{10,}/i, '');

  // Strip any remaining long hex prefix (16+ chars followed by _ or -)
  cleaned = cleaned.replace(/^[a-f0-9]{16,}[_-]?/i, '');

  // Strip a leading timestamp
  cleaned = cleaned.replace(/^\d{10,}[_-]?/, '');

  // Trim leftover separators
  cleaned = cleaned.replace(/^[_\-\s]+|[_\-\s]+$/g, '');

  // If nothing meaningful is left, fall back
  if (!cleaned.trim() || cleaned.length < 2) {
    cleaned = 'my-file';
  }

  return cleaned + ext;
}

/* ── makeOutputName ───────────────────────────────────────── */

/**
 * Produce a clean output filename:
 *   "mytrack.mp3" → "mytrack-mp4-to-mp3.mp3"
 */
export function makeOutputName(
  toolSlug: string,
  originalName: string,
  format: string,
): string {
  const cleaned = cleanFileName(originalName);
  const lastDot = cleaned.lastIndexOf('.');
  const base = lastDot > 0 ? cleaned.slice(0, lastDot) : cleaned;
  const slugSafe = toolSlug.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  return `${base}-${slugSafe}.${format}`;
}

/* ── saveBlob ─────────────────────────────────────────────── */

/**
 * Save a blob to the user's device.
 *   Native → writes to Documents/ via Capacitor Filesystem
 *   Web    → triggers a download via an anchor tag
 */
export async function saveBlob(blob: Blob, filename: string): Promise<void> {
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import(
        /* @vite-ignore */ '@capacitor/filesystem'
      );
      const base64 = await blobToBase64(blob);
      await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });
      return;
    } catch (err) {
      console.warn('[saveBlob] Native filesystem failed, falling back:', err);
      // Fall through to web download
    }
  }

  // Web fallback — trigger a download
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ── shareBlob ────────────────────────────────────────────── */

/**
 * Open the native share sheet (Android / iOS).
 * Returns `true` if the user picked something, `false` if they cancelled
 * or if the platform doesn't support it.
 *
 * On native:   writes to Cache/ then shares the file URI via @capacitor/share
 * On web:      uses the Web Share API with files (if supported)
 */
export async function shareBlob(
  blob: Blob,
  filename: string,
  title: string,
): Promise<boolean> {
  /* ── Native path ── */
  if (isNative()) {
    let writtenUri = '';
    try {
      const { Filesystem, Directory } = await import(
        /* @vite-ignore */ '@capacitor/filesystem'
      );
      const { Share } = await import(
        /* @vite-ignore */ '@capacitor/share'
      );

      const base64 = await blobToBase64(blob);
      const written = await Filesystem.writeFile({
        path: `share/${filename}`,
        data: base64,
        directory: Directory.Cache,
        recursive: true,
      });
      writtenUri = written.uri;

      /* ★ Use `files:` (plural), not `url:` (singular).
       *
       * The `url` parameter is documented for web links. On Android,
       * passing a `file://` URI through `url` throws (FileUriExposed),
       * the plugin's catch swallows it, and our caller silently fell
       * back to saveBlob — producing a "Saved to your device" toast
       * and no share sheet.
       *
       * `files` is the canonical way to hand local file URIs to the
       * share sheet. Passing `text` as well ensures apps that only
       * accept plain text still get a useful fallback. */
      await Share.share({
        title,
        text: filename,
        files: [written.uri],
        dialogTitle: 'Share your file',
      });

      return true;
    } catch (err: any) {
      const msg = String(err?.message || err || '').toLowerCase();
      const code = String(err?.code || '');

      // User dismissed the share sheet — not an error, and definitely
      // not something we should silently convert into a save.
      if (
        msg.includes('cancel') ||
        msg.includes('abort') ||
        msg.includes('dismiss') ||
        code === 'USER_CANCELLED' ||
        code === 'CANCELLED'
      ) {
        return false;
      }

      // Real failure — log everything so it appears in logcat when
      // webContentsDebuggingEnabled is enabled for debugging.
      console.error('[shareBlob] Native share failed:');
      console.error('  message:', msg);
      console.error('  code:', code);
      console.error('  uri:', writtenUri);
      console.error('  full error:', err);
      return false;
    }
  }

  /* ── Web path ── */
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, {
        type: blob.type || 'application/octet-stream',
      });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text: filename,
        });
        return true;
      }
    } catch (err: any) {
      const msg = String(err?.message || err || '').toLowerCase();
      if (msg.includes('cancel') || msg.includes('abort')) return false;
    }
  }

  return false;
}