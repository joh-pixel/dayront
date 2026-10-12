/**
 * src/components/conversion/FileHero.tsx
 * ----------------------------------------------------------------------------
 * Inline preview of the uploaded file(s), shown above the settings button.
 *
 *   • Audio  → canvas waveform + inline play/pause
 *   • Video  → inline <video> player (muted autoplay off)
 *   • Image  → inline <img>
 *   • Other  → filename-only card
 *
 * Multi-file selections render as a compact list with one row per file.
 * Purely presentational — removal is delegated to onRemove().
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { formatBytes } from '../../lib/utils';

interface Props {
  files: File[];
  onRemove?: (index: number) => void;
  multiple?: boolean;
}

type Kind = 'audio' | 'video' | 'image' | 'unknown';

const AUDIO_EXTS = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg', 'oga', 'opus', 'flac', 'aiff', 'aif', 'amr', 'ape']);
const VIDEO_EXTS = new Set(['mp4', 'm4v', 'mov', 'mkv', 'avi', 'webm', 'flv']);
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic']);

function kindOf(file: File): Kind {
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (AUDIO_EXTS.has(ext)) return 'audio';
  if (VIDEO_EXTS.has(ext)) return 'video';
  if (IMAGE_EXTS.has(ext)) return 'image';
  return 'unknown';
}

/* ═══════════════════════════════════════════════════════════
   Audio waveform
   ═══════════════════════════════════════════════════════════ */

function AudioPreview({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [url, setUrl] = useState<string>('');
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    setReady(false);
    setPlaying(false);
    setCurrent(0);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    (async () => {
      try {
        const ab = await file.arrayBuffer();
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const buf = await ctx.decodeAudioData(ab.slice(0));
        try { await ctx.close(); } catch {}

        if (cancelled) return;

        const sampleCount = 400;
        const data = buf.getChannelData(0);
        const step = Math.max(1, Math.floor(data.length / sampleCount));
        const peaks: number[] = [];
        let max = 0;
        for (let i = 0; i < sampleCount; i++) {
          const start = i * step;
          const end = Math.min(start + step, data.length);
          let peak = 0;
          for (let j = start; j < end; j++) {
            const v = Math.abs(data[j]);
            if (v > peak) peak = v;
          }
          if (peak > max) max = peak;
          peaks.push(peak);
        }
        if (max > 0) for (let i = 0; i < peaks.length; i++) peaks[i] /= max;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.clientWidth || 640;
        const h = canvas.clientHeight || 96;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const c = canvas.getContext('2d');
        if (!c) return;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.clearRect(0, 0, w, h);

        const barW = Math.max(1, (w - (peaks.length - 1)) / peaks.length);
        const midY = h / 2;
        for (let i = 0; i < peaks.length; i++) {
          const x = i * (barW + 1);
          const barH = Math.max(2, peaks[i] * (h * 0.85));
          c.fillStyle = '#38bdf8';
          c.fillRect(x, midY - barH / 2, barW, barH);
        }

        setDuration(buf.duration);
        setReady(true);
      } catch (err) {
        console.warn('[FileHero] waveform decode failed:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [file, url]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }

  function seek(e: MouseEvent) {
    const a = audioRef.current;
    const canvas = canvasRef.current;
    if (!a || !canvas || !duration) return;
    const rect = canvas.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = frac * duration;
  }

  return (
    <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
        onTimeUpdate={(e) => setCurrent((e.target as HTMLAudioElement).currentTime)}
      />

      <div
        class="relative h-24 overflow-hidden rounded-xl bg-gray-950"
        role="button"
        tabindex={0}
        onClick={seek}
        aria-label="Waveform — click to seek"
      >
        <canvas
          ref={canvasRef}
          class="block h-full w-full"
          style="width:100%;height:100%;"
        />
        {!ready && (
          <div class="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            Reading audio…
          </div>
        )}
      </div>

      <div class="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm transition hover:bg-sky-600 active:scale-[0.95]"
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div class="flex-1 text-xs font-medium tabular-nums text-gray-600 dark:text-gray-400">
          {fmtTime(current)} / {fmtTime(duration)}
        </div>
      </div>
    </div>
  );
}

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/* ═══════════════════════════════════════════════════════════
   Video / image preview
   ═══════════════════════════════════════════════════════════ */

function VideoPreview({ file }: { file: File }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!url) return null;
  return (
    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-black dark:border-gray-700">
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        class="block w-full max-h-80"
        style="width:100%;max-height:20rem;background:#000;"
      />
    </div>
  );
}

function ImagePreview({ file }: { file: File }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!url) return null;
  return (
    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
      <img
        src={url}
        alt={file.name}
        class="block w-full max-h-80 object-contain"
        style="max-height:20rem;"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main
   ═══════════════════════════════════════════════════════════ */

export default function FileHero({ files, onRemove, multiple = false }: Props) {
  if (files.length === 0) return null;

  // Multi-file or multiple selected → compact rows
  if (files.length > 1 || multiple) {
    return (
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <p class="text-sm font-bold text-gray-900 dark:text-white">
            {files.length} {files.length === 1 ? 'file' : 'files'} selected
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {formatBytes(files.reduce((s, f) => s + f.size, 0))}
          </p>
        </div>
        <ul class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${i}`}
              class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 dark:border-gray-800"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {f.name}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {formatBytes(f.size)} · {kindOf(f).toUpperCase()}
                </p>
              </div>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label={`Remove ${f.name}`}
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 active:scale-[0.94] dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Single file → hero preview
  const file = files[0];
  const kind = kindOf(file);

  return (
    <div class="space-y-2">
      {kind === 'audio' && <AudioPreview file={file} />}
      {kind === 'video' && <VideoPreview file={file} />}
      {kind === 'image' && <ImagePreview file={file} />}
      {kind === 'unknown' && (
        <div class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl dark:bg-gray-800">📄</div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">{file.name}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{formatBytes(file.size)}</p>
          </div>
        </div>
      )}

      <div class="flex items-center justify-between px-1">
        <p class="min-w-0 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
          {file.name}
        </p>
        <div class="flex items-center gap-3">
          <p class="shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {formatBytes(file.size)}
          </p>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(0)}
              aria-label="Remove file"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 active:scale-[0.94] dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}