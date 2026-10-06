/**
 * src/ui/mobile/tool/hooks.ts
 * ----------------------------------------------------------------------------
 * Preact hooks used by the tool screen. Kept separate from helpers.ts so
 * pure functions stay importable in non-component contexts (tests, SSR).
 */
import { useEffect, useState } from 'preact/hooks';
import { fileKind } from './helpers';

/**
 * Build an object URL for a File so <video>/<img> can render a thumbnail.
 *
 * Returns null for audio and unknown files — those fall back to an icon.
 * The object URL is revoked automatically on unmount or when the file changes,
 * so there is no leak even if the user picks many files in a row.
 */
export function useFileThumbnail(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const kind = fileKind(file);
    if (kind !== 'video' && kind !== 'image') { setUrl(null); return; }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}