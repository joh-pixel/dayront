/**
 * src/ui/mobile/screens/ToolScreen.tsx
 * Full-screen tool — pick file → options → process → download.
 *
 * In the native app: uses @capawesome/capacitor-file-picker to read
 * real file bytes (fixes "File could not be read! Code=-1" on Android).
 * On the web: falls back to <input type="file">.
 */
import { useMemo, useRef, useState } from 'preact/hooks';
import ProgressBar from '../../shared/ProgressBar';
import { runTool, isMultiFileTool, type RunnerTool } from '../../../core/toolRunner';
import { saveBlob, shareBlob, makeOutputName } from '../../../core/save';
import { addRecent, pushRecentTool } from '../../../core/storage';

interface SettingDef {
  name: string;
  label: string;
  type: 'range' | 'number' | 'select';
  min?: number;
  max?: number;
  options?: string[];
  default: string | number;
}

interface Tool {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  type?: string;
  from?: string;
  to?: string;
  settings?: SettingDef[];
  outputFormat?: string;
  presetWidth?: number;
  presetHeight?: number;
  faq?: Array<{ question: string; answer: string }>;
}

interface Props {
  tool: Tool;
}

type State = 'idle' | 'ready' | 'processing' | 'done' | 'error';

const MAX_WEB_MB = 300;

/* ── Environment ────────────────────────────────────────────── */

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return (
    w.Capacitor?.isNativePlatform?.() === true ||
    w.__TAURI__ !== undefined
  );
}

/* ── File size / name helpers ───────────────────────────────── */

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function haptic(ms = 8) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch {}
  }
}

function base64ToFile(base64: string, name: string, mime: string): File {
  // Strip data URL prefix if present (e.g. "data:video/mp4;base64,")
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: mime || 'application/octet-stream' });
}

function mimeForExt(ext: string): string {
  const m: Record<string, string> = {
    mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
    aac: 'audio/aac', ogg: 'audio/ogg', opus: 'audio/ogg',
    flac: 'audio/flac', mp4: 'video/mp4', webm: 'video/webm',
    mov: 'video/quicktime', avi: 'video/x-msvideo',
    mkv: 'video/x-matroska', flv: 'video/x-flv',
    gif: 'image/gif',
  };
  return m[ext.toLowerCase()] || 'application/octet-stream';
}

/* ── Component ──────────────────────────────────────────────── */

export default function ToolScreen({ tool }: Props) {
  const [state, setState] = useState<State>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('');
  const [settings, setSettings] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    (tool.settings ?? []).forEach((s) => {
      initial[s.name] = s.default;
    });
    return initial;
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const native = isNativeApp();
  const multi = isMultiFileTool(tool);
  const outputFormat = tool.outputFormat ?? 'mp3';

  const accept = useMemo(() => {
    const f = tool.from;
    if (!f) return '*/*';
    const audio = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'opus', 'flac', 'aiff', 'amr', 'ape'];
    const video = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'flv'];
    const image = ['gif', 'png', 'jpg', 'jpeg', 'webp'];
    if (audio.includes(f)) return 'audio/*';
    if (video.includes(f)) return 'video/*';
    if (image.includes(f)) return 'image/*';
    return '*/*';
  }, [tool.from]);

  /* ── File picking ─────────────────────────────────────── */

  function addFiles(arr: File[]) {
    if (arr.length === 0) return;
    if (!multi) {
      setFiles([arr[0]]);
    } else {
      setFiles((prev) => [...prev, ...arr]);
    }
    setState('ready');
    setErrorMsg('');
    haptic();
  }

  async function handlePickNative() {
    try {
      const mod: any = await import(/* @vite-ignore */ '@capawesome/capacitor-file-picker');
      const FilePicker = mod.FilePicker;
      const result = await FilePicker.pickFiles({
        types: [accept],
        readData: true, // returns base64
        limit: multi ? 0 : 1,
      });

      if (!result.files || result.files.length === 0) return;

      const files: File[] = [];
      for (const f of result.files) {
        if (!f.data) {
          console.warn('[picker] No base64 data returned for', f.name);
          continue;
        }
        const ext = (f.name.split('.').pop() || tool.from || 'bin').toLowerCase();
        const mime = f.mimeType || mimeForExt(ext);
        files.push(base64ToFile(f.data, f.name, mime));
      }

      addFiles(files);
    } catch (err: any) {
      console.error('[picker] Failed:', err);
      // Fall back to the web input if the plugin isn't available
      inputRef.current?.click();
    }
  }

  function handlePickWeb() {
    inputRef.current?.click();
  }

  function onWebInput(e: Event) {
    const list = (e.target as HTMLInputElement).files;
    if (list && list.length > 0) {
      addFiles(Array.from(list));
    }
  }

  function handlePick() {
    if (native) handlePickNative();
    else handlePickWeb();
  }

  function removeFile(idx: number) {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) setState('idle');
      return next;
    });
    haptic();
  }

  function clearFiles() {
    setFiles([]);
    setState('idle');
    setErrorMsg('');
    setResultBlob(null);
    setResultName('');
    if (inputRef.current) inputRef.current.value = '';
    haptic();
  }

  /* ── Processing ───────────────────────────────────────── */

  async function start() {
    if (files.length === 0) return;

    const totalMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
    // Native apps can handle much bigger files
    const maxMB = native ? 2000 : MAX_WEB_MB;
    if (totalMB > maxMB) {
      setState('error');
      setErrorMsg(
        `File too large (${totalMB.toFixed(0)} MB). ` +
        `Max is ${maxMB} MB on this device.`
      );
      return;
    }

    haptic();
    setState('processing');
    setProgress(0);
    setErrorMsg('');

    try { pushRecentTool(tool.slug); } catch {}

    try {
      const runner: RunnerTool = {
        slug: tool.slug,
        name: tool.name,
        type: tool.type,
        outputFormat: tool.outputFormat,
        presetWidth: tool.presetWidth,
        presetHeight: tool.presetHeight,
      };

      const blob = await runTool(runner, {
        files,
        settings,
        onProgress: (p) => setProgress(p),
      });

      const name = makeOutputName(tool.slug, files[0].name, outputFormat);
      setResultBlob(blob);
      setResultName(name);
      setProgress(100);
      setState('done');

      try {
        addRecent({
          tool: tool.slug,
          toolName: tool.name,
          icon: tool.icon,
          fileName: files[0].name,
          fileSize: blob.size,
        });
      } catch {}

      haptic(20);
    } catch (err: any) {
      console.error('[ToolScreen] Processing failed:', err);
      setState('error');
      setErrorMsg(err?.message || 'Something went wrong. Try again.');
    }
  }

  async function handleDownload() {
    if (!resultBlob) return;
    haptic();
    await saveBlob(resultBlob, resultName);
  }

  async function handleShare() {
    if (!resultBlob) return;
    haptic();
    const ok = await shareBlob(resultBlob, resultName, tool.name);
    if (!ok) await saveBlob(resultBlob, resultName);
  }

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div class="d-tool">
      {/* Hero */}
      <div class="d-tool__hero">
        <div class="d-tool__hero-icon" aria-hidden="true">{tool.icon}</div>
        <div class="d-tool__hero-body">
          <h1 class="d-tool__hero-name">{tool.name}</h1>
          <p class="d-tool__hero-desc">{tool.description}</p>
        </div>
      </div>

      {/* Hidden web input — always in the DOM as fallback */}
      <input
        ref={inputRef}
        type="file"
        class="d-tool__file-input"
        accept={accept}
        multiple={multi}
        style="display:none"
        onChange={onWebInput}
      />

      {/* Idle: pick a file */}
      {state === 'idle' && (
        <button
          type="button"
          class="d-tool__file"
          onClick={handlePick}
        >
          <span class="d-tool__file-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5-5 5 5" />
              <path d="M12 5v13" />
            </svg>
          </span>
          <p class="d-tool__file-title">
            {multi ? 'Tap to add files' : 'Tap to select file'}
          </p>
          <p class="d-tool__file-sub">
            {tool.from
              ? `Accepts ${tool.from.toUpperCase()} files${multi ? ' · select multiple' : ''}`
              : 'Choose any supported file'}
          </p>
        </button>
      )}

      {/* Selected files */}
      {files.length > 0 && state !== 'idle' && (
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} class="d-tool__fileinfo">
              <span class="d-tool__fileinfo-icon" aria-hidden="true">{tool.icon}</span>
              <div class="d-tool__fileinfo-body">
                <div class="d-tool__fileinfo-name">{f.name}</div>
                <div class="d-tool__fileinfo-size">
                  {humanSize(f.size)} · {f.type || 'unknown type'}
                </div>
              </div>
              {(state === 'ready' || state === 'error') && (
                <button
                  type="button"
                  class="d-tool__fileinfo-remove"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => removeFile(i)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {multi && state === 'ready' && (
            <button type="button" class="d-tool__addmore" onClick={handlePick}>
              + Add another file
            </button>
          )}
        </div>
      )}

      {/* Options */}
      {state === 'ready' && (tool.settings?.length ?? 0) > 0 && (
        <div class="d-tool__options">
          <p class="d-tool__options-title">Options</p>
          {tool.settings!.map((s) => (
            <div key={s.name} class="d-tool__option">
              <label class="d-tool__option-label" for={`opt-${s.name}`}>{s.label}</label>

              {s.type === 'number' && (
                <div class="d-tool__option-control">
                  <input
                    id={`opt-${s.name}`}
                    type="number"
                    class="d-tool__option-input"
                    min={s.min}
                    max={s.max}
                    value={settings[s.name] as number}
                    onInput={(e) =>
                      setSettings((prev) => ({ ...prev, [s.name]: Number((e.target as HTMLInputElement).value) }))
                    }
                  />
                </div>
              )}

              {s.type === 'range' && (
                <div class="d-tool__option-range">
                  <input
                    id={`opt-${s.name}`}
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={settings[s.name] as number}
                    onInput={(e) =>
                      setSettings((prev) => ({ ...prev, [s.name]: Number((e.target as HTMLInputElement).value) }))
                    }
                  />
                  <span class="d-tool__option-range-value">{settings[s.name]}</span>
                </div>
              )}

              {s.type === 'select' && (
                <div class="d-tool__option-control">
                  <select
                    id={`opt-${s.name}`}
                    class="d-tool__option-select"
                    value={settings[s.name] as string}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, [s.name]: (e.target as HTMLSelectElement).value }))
                    }
                  >
                    {(s.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      {state === 'processing' && (
        <div class="d-tool__progress">
          <div class="d-tool__progress-head">
            <div class="d-tool__progress-spinner" aria-hidden="true" />
            <div class="d-tool__progress-body">
              <p class="d-tool__progress-title">Processing…</p>
              <p class="d-tool__progress-sub">
                {tool.name} · {native ? 'runs on your device' : 'runs in your browser'}
              </p>
            </div>
          </div>
          <ProgressBar value={progress} showPercent />
        </div>
      )}

      {/* Success */}
      {state === 'done' && resultBlob && (
        <div class="d-tool__success">
          <div class="d-tool__success-icon" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p class="d-tool__success-title">Done!</p>
          <p class="d-tool__success-sub">
            {resultName} · {humanSize(resultBlob.size)}
          </p>
          <div class="d-tool__success-actions">
            <button type="button" class="d-tool__success-btn d-tool__success-btn--primary" onClick={handleShare}>
              Share / Save
            </button>
            <button type="button" class="d-tool__success-btn d-tool__success-btn--ghost" onClick={handleDownload}>
              Download
            </button>
            <button type="button" class="d-tool__success-btn d-tool__success-btn--ghost" onClick={clearFiles}>
              Process another file
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div class="d-tool__error">
          <div class="d-tool__error-icon" aria-hidden="true">⚠️</div>
          <p class="d-tool__error-title">Something went wrong</p>
          <p class="d-tool__error-msg">{errorMsg}</p>
          <div class="d-tool__success-actions">
            <button
              type="button"
              class="d-tool__success-btn d-tool__success-btn--primary"
              onClick={() => { setState('ready'); setErrorMsg(''); }}
            >
              Try again
            </button>
            <button type="button" class="d-tool__success-btn d-tool__success-btn--ghost" onClick={clearFiles}>
              Choose another file
            </button>
          </div>
        </div>
      )}

      {/* Start */}
      {state === 'ready' && files.length > 0 && (
        <button type="button" class="d-tool__start" onClick={start}>
          {multi ? `Merge ${files.length} files` : `Start ${tool.name}`}
        </button>
      )}

      {state === 'processing' && (
        <button type="button" class="d-tool__success-btn d-tool__success-btn--ghost" onClick={clearFiles}>
          Cancel
        </button>
      )}
    </div>
  );
}