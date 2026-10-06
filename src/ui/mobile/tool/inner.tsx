/**
 * src/ui/mobile/tool/inner.tsx
 * ----------------------------------------------------------------------------
 * Tool screen orchestrator. Owns all state and side effects; delegates leaf
 * rendering to the other modules under tool/.
 *
 * Public API: named export ToolScreenInner({ tool }).
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  runTool,
  isMultiFileTool,
  ToolFallbackError,
  isMemoryError,
  checkWebCapacity,
  type RunnerTool,
  type FallbackReason,
} from '../../../core/toolRunner';
import {
  saveBlob,
  shareBlob,
  makeOutputName,
  cleanFileName,
} from '../../../core/save';
import { addRecent, pushRecentTool, getSettings } from '../../../core/storage';
import { haptic } from '../haptic';
import { setNavigationGuard, clearNavigationGuard } from '../navigation-guard';

import {
  base64ToFile,
  humanSize,
  mimeForExt,
  shouldWarnLongJob,
  summarizeSettings,
  validateFileForTool,
} from './helpers';
import {
  ensureNotificationPermission,
  isNativeApp,
  keepAwakeOff,
  keepAwakeOn,
  notifyJobDone,
} from './native';
import { FileChip, FileHero, FilePreview } from './file-ui';
import {
  ErrorSheet,
  NativeLimitPromo,
  OptionsSheet,
  ProcessingOverlay,
  SaveToast,
  SuccessSheet,
  WebPromo,
} from './overlays';
import { PremiumButton } from './ui';
import type { State, Tool } from './types';

const MAX_WEB_MB = 300;
const MAX_NATIVE_MB = 5000;

export function ToolScreenInner({ tool }: { tool: Tool }) {
  const [state, setState] = useState<State>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const [promo, setPromo] = useState<
    { reason: FallbackReason | 'native-limit'; totalMB: number } | null
  >(null);
  const [bypassPromo, setBypassPromo] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [fileWarning, setFileWarning] = useState<string | null>(null);

  const [settings, setSettings] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    (tool.settings ?? []).forEach((s) => { initial[s.name] = s.default; });
    return initial;
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const native = isNativeApp();
  const multi = isMultiFileTool(tool);
  const outputFormat = tool.outputFormat ?? 'mp3';
  const hasSettings = (tool.settings?.length ?? 0) > 0;

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

  useEffect(() => {
    if (native) ensureNotificationPermission();
  }, [native]);

  useEffect(() => {
    return () => { if (resultUrl) URL.revokeObjectURL(resultUrl); };
  }, [resultUrl]);

  useEffect(() => {
    if (state !== 'processing') { setElapsed(0); return; }
    const start = Date.now();
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state !== 'processing') { clearNavigationGuard(); return; }
    setNavigationGuard(() => false);
    return () => { clearNavigationGuard(); };
  }, [state]);

  function addFiles(arr: File[]) {
    if (arr.length === 0) return;
    const first = arr[0];
    const check = validateFileForTool(first, tool);
    setFileWarning(!check.ok && check.reason ? check.reason : null);
    const next = multi ? [...files, ...arr] : [arr[0]];
    setFiles(next);
    setState('ready');
    setErrorMsg('');
    const totalMB = next.reduce((s, f) => s + f.size, 0) / (1024 * 1024);
    if (native) {
      if (totalMB > MAX_NATIVE_MB) {
        setPromo({ reason: 'native-limit', totalMB });
        setBypassPromo(true);
      } else { setPromo(null); setBypassPromo(false); }
    } else {
      const capacity = checkWebCapacity(next, true);
      if (capacity) {
        setPromo({ reason: capacity.reason, totalMB: capacity.totalMB });
        setBypassPromo(false);
      } else { setPromo(null); setBypassPromo(false); }
    }
    haptic();
  }

  async function handlePickNative() {
    try {
      const mod: any = await import(/* @vite-ignore */ '@capawesome/capacitor-file-picker');
      const FilePicker = mod.FilePicker;
      const result = await FilePicker.pickFiles({
        types: [accept], readData: true, limit: multi ? 0 : 1,
      });
      if (!result.files || result.files.length === 0) return;
      const picked: File[] = [];
      for (const f of result.files) {
        if (!f.data) continue;
        const ext = (f.name.split('.').pop() || tool.from || 'bin').toLowerCase();
        const mime = f.mimeType || mimeForExt(ext);
        const friendlyName = cleanFileName(f.name);
        picked.push(base64ToFile(f.data, friendlyName, mime));
      }
      addFiles(picked);
    } catch (err) {
      console.error('[picker] Failed:', err);
      inputRef.current?.click();
    }
  }

  function handlePickWeb() { inputRef.current?.click(); }

  function onWebInput(e: Event) {
    const list = (e.target as HTMLInputElement).files;
    if (list && list.length > 0) {
      const cleaned = Array.from(list).map((f) => {
        const n = cleanFileName(f.name);
        if (n === f.name) return f;
        try { return new File([f], n, { type: f.type }); } catch { return f; }
      });
      addFiles(cleaned);
    }
  }

  function handlePick() { if (native) handlePickNative(); else handlePickWeb(); }

  function removeFile(idx: number) {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) {
        setState('idle'); setPromo(null); setBypassPromo(false); setFileWarning(null);
      } else {
        const totalMB = next.reduce((s, f) => s + f.size, 0) / (1024 * 1024);
        if (native && totalMB > MAX_NATIVE_MB) setPromo({ reason: 'native-limit', totalMB });
        else if (!native) {
          const capacity = checkWebCapacity(next, true);
          if (capacity) setPromo({ reason: capacity.reason, totalMB: capacity.totalMB });
          else { setPromo(null); setBypassPromo(false); }
        } else { setPromo(null); setBypassPromo(false); }
      }
      return next;
    });
    haptic();
  }

  function clearFiles() {
    if (resultUrl) { URL.revokeObjectURL(resultUrl); setResultUrl(null); }
    setFiles([]); setState('idle'); setErrorMsg(''); setResultBlob(null); setResultName('');
    setPromo(null); setBypassPromo(false);
    setSuccessOpen(false); setErrorOpen(false); setOptionsOpen(false);
    setFileWarning(null);
    if (inputRef.current) inputRef.current.value = '';
    haptic();
  }

  function handleTryAnyway() { setBypassPromo(true); }

  function openPreview(file: File) {
    haptic();
    setPreviewFile(file);
    setPreviewOpen(true);
  }

  async function start() {
    if (files.length === 0) return;
    if (promo && !bypassPromo) return;

    const totalMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
    const hardLimit = native ? MAX_NATIVE_MB : 2000;
    if (totalMB > hardLimit) {
      setState('error');
      setErrorMsg(
        `File is ${totalMB >= 1024
          ? `${(totalMB / 1024).toFixed(2)} GB`
          : `${Math.round(totalMB)} MB`}. ` +
        `The maximum is ${hardLimit} MB on this device.`,
      );
      setErrorOpen(true);
      return;
    }

    haptic();
    setState('processing');
    setProgress(0);
    setErrorMsg('');
    await keepAwakeOn();
    try { pushRecentTool(tool.slug); } catch {}

    try {
      const runner: RunnerTool = {
        slug: tool.slug, name: tool.name, type: tool.type,
        outputFormat: tool.outputFormat,
        presetWidth: tool.presetWidth, presetHeight: tool.presetHeight,
      };
      const blob = await runTool(runner, {
        files, settings, onProgress: (p) => setProgress(p),
      });

      const name = makeOutputName(tool.slug, files[0].name, outputFormat);

      if (getSettings().autoDownload) {
        try { await saveBlob(blob, name); } catch (err) { console.warn('[auto-save] Failed:', err); }
      }

      setResultBlob(blob);
      setResultName(name);
      setProgress(100);
      setState('done');
      setPromo(null);

      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setSuccessOpen(true);
      notifyJobDone(tool.name, name);

      try {
        addRecent({
          tool: tool.slug, toolName: tool.name, icon: tool.icon,
          fileName: name, fileSize: blob.size,
        });
      } catch {}

      haptic(24);
    } catch (err: any) {
      console.error('[ToolScreen] Processing failed:', err);
      if (!native && (err instanceof ToolFallbackError || isMemoryError(err))) {
        const mb = files.reduce((s, f) => s + f.size, 0) / (1024 * 1024);
        setPromo({ reason: 'out-of-memory', totalMB: mb });
        setBypassPromo(false);
        setState('ready');
        return;
      }
      setState('error');
      setErrorMsg(err?.message || 'Something went wrong. Try again.');
      setErrorOpen(true);
    } finally {
      await keepAwakeOff();
    }
  }

  async function handleShare() {
    if (!resultBlob) return;
    haptic();
    try {
      const ok = await shareBlob(resultBlob, resultName, tool.name);
      if (ok) {
        setSaveFeedback('Shared successfully');
        setTimeout(() => setSaveFeedback(null), 2400);
      }
    } catch (err) {
      console.error('[share] Failed:', err);
      setSaveFeedback('Could not share — use Download');
      setTimeout(() => setSaveFeedback(null), 2400);
    }
  }

  async function handleDownload() {
    if (!resultBlob) return;
    haptic();
    try {
      await saveBlob(resultBlob, resultName);
      setSaveFeedback('Saved to your device');
    } catch (err) {
      console.error('[download] Failed:', err);
      setSaveFeedback('Could not save file');
    }
    setTimeout(() => setSaveFeedback(null), 2400);
  }

  const outputMime: string = (() => {
    if (outputFormat === 'mp3') return 'audio/mpeg';
    if (['wav', 'ogg', 'opus'].includes(outputFormat)) return 'audio/' + outputFormat;
    if (['m4a', 'aac'].includes(outputFormat)) return 'audio/mp4';
    if (outputFormat === 'flac') return 'audio/flac';
    if (['mp4', 'mov', 'm4v'].includes(outputFormat)) return 'video/mp4';
    if (outputFormat === 'webm') return 'video/webm';
    if (outputFormat === 'mkv') return 'video/x-matroska';
    if (outputFormat === 'avi') return 'video/x-msvideo';
    if (outputFormat === 'gif') return 'image/gif';
    if (['png', 'jpg', 'jpeg', 'webp'].includes(outputFormat)) return 'image/' + outputFormat;
    return 'application/octet-stream';
  })();

  const totalSize = files.reduce((s, f) => s + f.size, 0);
  const warnLongJob = shouldWarnLongJob(tool, totalSize);

  if (native && promo?.reason === 'native-limit') {
    return (
      <NativeLimitPromo
        tool={tool}
        totalMB={promo.totalMB}
        onClearFiles={clearFiles}
      />
    );
  }

  if (!native && promo && !bypassPromo) {
    return (
      <WebPromo
        tool={tool}
        reason={promo.reason}
        totalMB={promo.totalMB}
        files={files}
        onRemoveFile={removeFile}
        onPreview={openPreview}
        onClearFiles={clearFiles}
        onTryAnyway={handleTryAnyway}
      />
    );
  }

  /* Single-file tools get the hero; multi-file keeps the chip row */
  const showHero = files.length === 1 && !multi;

  return (
    <div class="d-tool" style={{
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <div class="d-tool__hero">
        <div class="d-tool__hero-icon" aria-hidden="true">{tool.icon}</div>
        <div class="d-tool__hero-body">
          <h1 class="d-tool__hero-name">{tool.name}</h1>
          <p class="d-tool__hero-desc">{tool.description}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        class="d-tool__file-input"
        accept={accept}
        multiple={multi}
        style="display:none"
        onChange={onWebInput}
      />

      <div style={{ flex: 1, paddingBottom: '124px' }}>

        {state === 'idle' && (
          <button
            type="button"
            onClick={handlePick}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: '2.75rem 1.5rem',
              borderRadius: '1.5rem',
              border: '2px dashed var(--line-strong, #cbd5e1)',
              background: 'var(--bg-soft, rgba(241,245,249,0.55))',
              color: 'inherit', gap: '0.75rem',
              minHeight: '240px', cursor: 'pointer',
            }}
          >
            <span aria-hidden="true" style={{
              width: '72px', height: '72px', borderRadius: '22px',
              background: 'linear-gradient(135deg,#38bdf8,#0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 28px rgba(2,132,199,0.4)',
            }}>
              <span style={{
                width: '44px', height: '44px', borderRadius: '14px',
                background: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </span>
            </span>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              {multi ? 'Add your first file' : 'Tap to choose a file'}
            </p>
            <p style={{ fontSize: '0.85rem', opacity: 0.6, margin: 0 }}>
              {tool.from
                ? `Accepts ${tool.from.toUpperCase()}${multi ? ' · multiple allowed' : ''}`
                : 'Any supported file'}
              {native ? ' · up to 5 GB' : ' · up to 300 MB'}
            </p>
          </button>
        )}

        {/* ★ Phase A: single-file tools get a hero; multi-file keeps chips */}
        {files.length > 0 && state !== 'idle' && state !== 'processing' && (
          showHero ? (
            <FileHero
              file={files[0]}
              tool={tool}
              onRemove={state === 'ready' ? () => removeFile(0) : undefined}
              onPreview={() => openPreview(files[0])}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {files.map((f, i) => (
                <FileChip
                  key={`${f.name}-${i}`}
                  file={f}
                  tool={tool}
                  onRemove={state === 'ready' ? () => removeFile(i) : undefined}
                  onPreview={() => openPreview(f)}
                />
              ))}
              {multi && state === 'ready' && (
                <button
                  type="button"
                  onClick={handlePick}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '1rem',
                    border: '2px dashed var(--line-strong, #cbd5e1)',
                    background: 'transparent',
                    color: 'inherit',
                    fontSize: '0.9rem', fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Add another file
                </button>
              )}
            </div>
          )
        )}

        {fileWarning && state === 'ready' && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.875rem 1rem',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(239,68,68,0.08))',
            border: '1px solid rgba(251,146,60,0.45)',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            display: 'flex',
            gap: '0.625rem',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1.15rem', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">⚠️</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.15rem' }}>Wrong file type</strong>
              <span style={{ opacity: 0.85 }}>{fileWarning}</span>
            </div>
          </div>
        )}

        {state === 'ready' && hasSettings && (
          <button
            type="button"
            onClick={() => { haptic(); setOptionsOpen(true); }}
            style={{
              width: '100%', marginTop: '0.875rem',
              padding: '1rem 1.125rem',
              borderRadius: '1.25rem',
              border: '1px solid var(--line, #e2e8f0)',
              background: 'var(--bg-elev, #fff)',
              color: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                Adjust settings
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: '2px' }}>
                {summarizeSettings(tool.settings ?? [], settings)}
              </div>
            </div>
            <span aria-hidden="true" style={{ opacity: 0.5 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        )}

        {state === 'ready' && files.length > 0 && !fileWarning && warnLongJob && (
          <div style={{
            marginTop: '0.875rem',
            padding: '1rem 1.1rem',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(239,68,68,0.08))',
            border: '1.5px solid rgba(251,146,60,0.45)',
            fontSize: '0.85rem',
            lineHeight: 1.55,
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">⏳</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.2rem' }}>This job takes time</strong>
              <span style={{ opacity: 0.85 }}>
                Keep the app open while it runs. Switching apps, locking the screen,
                or closing the app will pause processing.
              </span>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div style={{
            padding: '1rem 1.1rem',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, rgba(251,146,60,0.14), rgba(239,68,68,0.10))',
            border: '1.5px solid rgba(251,146,60,0.45)',
            fontSize: '0.85rem',
            lineHeight: 1.55,
            marginTop: '1rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }} aria-hidden="true">⚠️</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Don't close the app</strong>
              <span style={{ opacity: 0.85 }}>
                Processing runs on your device. Closing the app, locking the screen,
                or switching away for a long time will pause the job.
              </span>
            </div>
          </div>
        )}
      </div>

      {state === 'ready' && files.length > 0 && (
        <div style={{
          position: 'sticky', bottom: 0,
          paddingTop: '0.75rem',
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(to top, var(--bg, #fff) 55%, transparent)',
          zIndex: 20,
        }}>
          <PremiumButton variant="primary" onClick={start} disabled={!!fileWarning}>
            {multi ? `Merge ${files.length} files` : `Start ${tool.name}`}
          </PremiumButton>
          {totalSize > 0 && (
            <p style={{
              textAlign: 'center', fontSize: '0.72rem',
              opacity: 0.55, margin: '0.5rem 0 0',
            }}>
              {humanSize(totalSize)} · {native ? 'runs on your device' : 'runs in your browser'}
            </p>
          )}
        </div>
      )}

      {state === 'processing' && (
        <ProcessingOverlay
          toolName={tool.name}
          progress={progress}
          elapsed={elapsed}
          native={native}
        />
      )}

      {saveFeedback && <SaveToast message={saveFeedback} />}

      <FilePreview
        file={previewFile}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      <OptionsSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        settings={tool.settings ?? []}
        values={settings}
        onSettingChange={(name, value) =>
          setSettings((prev) => ({ ...prev, [name]: value }))
        }
        file={files[0] ?? null}
      />

      <SuccessSheet
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        resultName={resultName}
        resultBlob={resultBlob}
        resultUrl={resultUrl}
        outputMime={outputMime}
        onShare={handleShare}
        onDownload={handleDownload}
        onProcessAnother={clearFiles}
      />

      <ErrorSheet
        open={errorOpen && state === 'error'}
        onClose={() => { setErrorOpen(false); setState('ready'); }}
        errorMsg={errorMsg}
        onRetry={() => { haptic(); setErrorOpen(false); setState('ready'); setErrorMsg(''); }}
        onChooseAnother={clearFiles}
      />
    </div>
  );
}