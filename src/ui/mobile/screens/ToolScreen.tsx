/**
 * src/ui/mobile/screens/ToolScreen.tsx
 * Full-screen tool — pick file → options → process → download.
 *
 * Storage: uses src/core/storage.ts for Recent entries and preferences.
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

  function pickFiles(list: FileList) {
    const arr = Array.from(list);
    if (!multi) {
      setFiles([arr[0]]);
    } else {
      setFiles((prev) => [...prev, ...arr]);
    }
    setState('ready');
    setErrorMsg('');
    haptic();
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

  async function start() {
    if (files.length === 0) return;

    const totalMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
    if (totalMB > MAX_WEB_MB) {
      setState('error');
      setErrorMsg(
        `File too large for web processing (${totalMB.toFixed(0)} MB). ` +
        `Max is ${MAX_WEB_MB} MB on this device. The native app supports up to 5 GB.`
      );
      return;
    }

    haptic();
    setState('processing');
    setProgress(0);
    setErrorMsg('');

    // Mark this tool as recently used
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

      // Record in Recent — storage.ts handles serialization
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
    if (!ok) {
      await saveBlob(resultBlob, resultName);
    }
  }

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

      {/* Pick file */}
      {state === 'idle' && (
        <label class="d-tool__file">
          <input
            ref={inputRef}
            type="file"
            class="d-tool__file-input"
            accept={accept}
            multiple={multi}
            onChange={(e) => {
              const list = (e.target as HTMLInputElement).files;
              if (list && list.length > 0) pickFiles(list);
            }}
          />
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
        </label>
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
            <label class="d-tool__addmore">
              <input
                type="file"
                accept={accept}
                multiple
                style="display:none"
                onChange={(e) => {
                  const list = (e.target as HTMLInputElement).files;
                  if (list && list.length > 0) pickFiles(list);
                }}
              />
              + Add another file
            </label>
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
                {tool.name} · runs in your browser
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M16 6l-4-4-4 4" />
                <path d="M12 2v13" />
              </svg>
              Share / Save
            </button>
            <button type="button" class="d-tool__success-btn d-tool__success-btn--ghost" onClick={handleDownload}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {multi ? `Merge ${files.length} files` : `Start ${tool.name}`}
        </button>
      )}

      {state === 'processing' && (
        <button
          type="button"
          class="d-tool__success-btn d-tool__success-btn--ghost"
          onClick={clearFiles}
        >
          Cancel
        </button>
      )}
    </div>
  );
}