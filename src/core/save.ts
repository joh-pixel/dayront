/**
 * src/core/save.ts
 * ----------------------------------------------------------------------------
 * Save a Blob to disk. Works on web (download), Capacitor (share sheet or
 * write to Documents), and falls back to a plain download everywhere.
 *
 * The Capacitor path is a no-op today — we'll wire it up when the shell is
 * built. Right now on web, this creates a download link and clicks it.
 */

/** Suggested filename for a tool's output. */
export function makeOutputName(toolSlug: string, originalName: string, format: string): string {
  const base = originalName.replace(/\.[^.]+$/, '');
  const ext = format.replace(/^\./, '');
  return `${base}-${toolSlug}.${ext}`;
}

/** Detect if we're running inside a native shell (Capacitor/Tauri). */
function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return (
    w.Capacitor?.isNativePlatform?.() === true ||
    w.__TAURI__ !== undefined
  );
}

/**
 * Save a Blob. Returns the suggested filename.
 * On native shells, this will eventually route to the share sheet.
 */
export async function saveBlob(blob: Blob, filename: string): Promise<void> {
  if (typeof window === 'undefined') return;

  // Native shell: placeholder for now — real share sheet comes later.
  if (isNative()) {
    // TODO: swap in @capacitor/filesystem + @capacitor/share
    // For now, fall through to the web download so the flow still works.
    console.log('[save] Native shell detected, falling back to web download');
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Share via Web Share API if available. Returns true on success. */
export async function shareBlob(blob: Blob, filename: string, title: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as any;
  if (!nav.share || !nav.canShare) return false;

  try {
    const file = new File([blob], filename, { type: blob.type });
    if (nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], title });
      return true;
    }
  } catch {
    // User cancelled or share failed
  }
  return false;
}