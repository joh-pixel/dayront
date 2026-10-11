/**
 * src/components/UrlDownloader.tsx
 * ----------------------------------------------------------------------------
 * Client-side URL downloader UI.
 *
 * Streams a fetch with progress, previews the result inline where the
 * content type supports it, and offers a download button.
 *
 * Everything runs in the browser. No server, no proxy, no logging.
 */
import { useRef, useState } from 'preact/hooks';
import {
  checkUrl,
  extensionForMime,
  extensionFromUrl,
  filenameFromUrl,
  humanSize,
  previewKind,
  type PreviewKind,
} from '../core/url-download';

type State = 'idle' | 'fetching' | 'done' | 'error';

interface FetchedFile {
  blob: Blob;
  filename: string;
  size: number;
  contentType: string;
  objectUrl: string;
  preview: PreviewKind;
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getSizeLimits() {
  const mobile = isMobileDevice();
  return {
    warnBytes: (mobile ? 100 : 250) * 1024 * 1024,
    hardBytes: (mobile ? 300 : 800) * 1024 * 1024,
  };
}

export default function UrlDownloader() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<State>('idle');
  const [progress, setProgress] = useState(0);
  const [received, setReceived] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [knownSource, setKnownSource] = useState('');
  const [result, setResult] = useState<FetchedFile | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  function reset(clearUrl: boolean = false) {
    if (result?.objectUrl) URL.revokeObjectURL(result.objectUrl);
    setResult(null);
    setError('');
    setNotice('');
    setProgress(0);
    setReceived(0);
    setKnownSource('');
    setState('idle');
    if (clearUrl) setUrl('');
  }

  function handleCancel() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    reset(false);
  }

  async function handleFetch() {
    reset(false);

    const check = checkUrl(url);
    if (check.kind === 'invalid' || check.kind === 'blocked') {
      setError(check.reason || 'Invalid URL.');
      setState('error');
      return;
    }

    setKnownSource(check.knownSource || '');
    setState('fetching');

    const limits = getSizeLimits();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch(url.trim(), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}.`);
      }

      const declaredSize = Number(response.headers.get('content-length')) || 0;

      if (declaredSize && declaredSize > limits.hardBytes) {
        controller.abort();
        throw new Error(
          `File is ${humanSize(declaredSize)}. Browser downloads are capped at ${humanSize(limits.hardBytes)} to avoid exhausting memory.`,
        );
      }

      if (declaredSize && declaredSize > limits.warnBytes) {
        setNotice(
          `Large file (${humanSize(declaredSize)}). This may use significant memory and bandwidth.`,
        );
      }

      if (!response.body) {
        throw new Error('The server did not return a readable stream.');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        total += value.length;
        if (total > limits.hardBytes) {
          controller.abort();
          throw new Error(
            `Download exceeded ${humanSize(limits.hardBytes)} and was cancelled.`,
          );
        }

        chunks.push(value);
        setReceived(total);

        if (declaredSize > 0) {
          setProgress(Math.min(100, Math.round((total / declaredSize) * 100)));
        }
      }

      const rawType = response.headers.get('content-type') || '';
      const contentType = rawType.split(';')[0].trim();

      // Prefer Content-Disposition filename when the server sends one.
      let filename = filenameFromUrl(url);
      const disposition = response.headers.get('content-disposition') || '';
      const dispMatch = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      if (dispMatch && dispMatch[1]) {
        try {
          filename = decodeURIComponent(dispMatch[1]).replace(/[/\\?%*:|"<>]/g, '-');
        } catch {
          /* keep the URL-derived name */
        }
      }

      // Add an extension if the filename has none and we can infer one.
      if (!filename.includes('.')) {
        const guessed = extensionForMime(contentType) || extensionFromUrl(url);
        if (guessed) filename = `${filename}.${guessed}`;
      }

      const urlExt = extensionFromUrl(url);
      const kind = previewKind(contentType, urlExt);

      const blob = new Blob(chunks as BlobPart[], {
        type: contentType || 'application/octet-stream',
      });
      const objectUrl = URL.createObjectURL(blob);

      setResult({
        blob,
        filename,
        size: blob.size,
        contentType: contentType || 'application/octet-stream',
        objectUrl,
        preview: kind,
      });
      setProgress(100);
      setState('done');
    } catch (err: unknown) {
      if ((err as any)?.name === 'AbortError') {
        // User cancelled or we aborted on size — message already handled.
        return;
      }

      const message = err instanceof Error ? err.message : String(err);
      const isCorsLike =
        (err as any)?.name === 'TypeError' &&
        !message.includes('Server returned') &&
        !message.includes('exceeded') &&
        !message.includes('capped') &&
        !message.includes('readable stream');

      if (isCorsLike) {
        setError(
          `${check.hostname || 'This host'} blocked the browser fetch (CORS). ` +
          `Try a direct link to a media file (.mp3, .mp4, .wav, .jpg, .png), ` +
          `a podcast episode from its RSS feed, or a page from Archive.org or Wikimedia Commons.`,
        );
      } else {
        setError(message);
      }
      setState('error');
    } finally {
      controllerRef.current = null;
    }
  }

  function handleDownload() {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.objectUrl;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const disabled = state === 'fetching';

  return (
    <div class="w-full space-y-5 text-gray-900 dark:text-gray-100">

      {/* Input row */}
      <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <label
          for="url-download-input"
          class="block text-sm font-semibold text-gray-900 dark:text-white"
        >
          Media URL
        </label>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Paste a direct HTTPS link to a media file, a podcast episode URL, or a page from a supported source.
        </p>

        <div class="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            id="url-download-input"
            type="url"
            value={url}
            disabled={disabled}
            onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && url && !disabled) handleFetch();
            }}
            placeholder="https://archive.org/download/…/track.mp3"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500"
          />

          {state !== 'fetching' ? (
            <button
              type="button"
              onClick={handleFetch}
              disabled={!url.trim()}
              class="inline-flex shrink-0 items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Fetch
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              class="inline-flex shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              Cancel
            </button>
          )}
        </div>

        {knownSource && state !== 'idle' && (
          <p class="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
            <span class="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
            Verified source: {knownSource}
          </p>
        )}
      </div>

      {/* Progress */}
      {state === 'fetching' && (
        <div
          class="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          role="status"
          aria-live="polite"
        >
          <div class="mb-3 flex items-center justify-between gap-4">
            <div class="flex min-w-0 items-center gap-2.5">
              <span class="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-sky-500" aria-hidden="true" />
              <span class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                Fetching…
              </span>
            </div>
            <span class="shrink-0 text-sm font-bold tabular-nums text-sky-600 dark:text-sky-400">
              {progress > 0 ? `${progress}%` : humanSize(received)}
            </span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              class="h-full bg-sky-500 transition-[width] duration-200 ease-out"
              style={{ width: progress > 0 ? `${progress}%` : '10%' }}
            />
          </div>
          {notice && (
            <p class="mt-3 text-xs text-amber-700 dark:text-amber-400">{notice}</p>
          )}
        </div>
      )}

      {/* Error */}
      {state === 'error' && error && (
        <div class="overflow-hidden rounded-2xl border border-red-200 bg-red-50 shadow-sm dark:border-red-900/70 dark:bg-red-950/40">
          <div class="p-5">
            <div class="flex gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600 dark:bg-red-900/50 dark:text-red-300">
                !
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-red-900 dark:text-red-100">Couldn't fetch that URL</p>
                <p class="mt-1 break-words text-sm leading-6 text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {state === 'done' && result && (
        <div class="overflow-hidden rounded-2xl border border-green-200 bg-green-50 shadow-sm dark:border-green-900/70 dark:bg-green-950/30">
          <div class="p-5">
            <div class="flex items-start gap-4">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700 dark:bg-green-900/50 dark:text-green-300">
                ✓
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="text-base font-bold text-green-900 dark:text-green-100">
                  Fetched
                </h2>
                <p class="mt-1 break-all text-sm font-medium text-green-700 dark:text-green-300">
                  {result.filename}
                </p>
                <p class="mt-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                  {humanSize(result.size)} · {result.contentType}
                </p>
              </div>
            </div>

            {result.preview !== 'none' && (
              <div class="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-black dark:border-gray-700">
                {result.preview === 'video' ? (
                  <video src={result.objectUrl} controls playsInline class="block w-full max-h-96" />
                ) : result.preview === 'audio' ? (
                  <div class="p-3">
                    <audio src={result.objectUrl} controls class="w-full" />
                  </div>
                ) : (
                  <img src={result.objectUrl} alt={result.filename} class="block w-full max-h-96 object-contain" />
                )}
              </div>
            )}
          </div>

          <div class="border-t border-green-200 bg-white p-4 dark:border-green-900/70 dark:bg-gray-900/60">
            <div class="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleDownload}
                class="w-full rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 active:scale-[0.98] dark:bg-sky-500 dark:hover:bg-sky-400"
              >
                Download file
              </button>
              <button
                type="button"
                onClick={() => reset(true)}
                class="w-full rounded-xl border border-gray-300 bg-gray-100 px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-200 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Fetch another URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help / suggestions */}
      {state === 'idle' && (
        <div class="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm dark:border-gray-700 dark:bg-gray-800/60">
          <p class="font-semibold text-gray-900 dark:text-white">Where this works</p>
          <ul class="mt-2 space-y-1.5 text-gray-700 dark:text-gray-300">
            <li>· Direct links to <code class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">.mp3</code>, <code class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">.mp4</code>, <code class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">.wav</code>, <code class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">.jpg</code>, <code class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">.png</code> on permissive servers</li>
            <li>· Archive.org — every item is a direct media link</li>
            <li>· Wikimedia Commons — images, audio, and video</li>
            <li>· Podcast episode URLs from Libsyn, Buzzsprout, Transistor, Megaphone, Simplecast</li>
            <li>· Self-hosted media on servers with permissive CORS</li>
          </ul>
          <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">
            YouTube, TikTok, Instagram, X, Facebook, Spotify, and Netflix are blocked by design — the fetch happens in your browser, and those platforms refuse cross-origin requests. Dayront never routes around it.
          </p>
        </div>
      )}

    </div>
  );
}