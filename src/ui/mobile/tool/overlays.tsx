/**
 * src/ui/mobile/tool/overlays.tsx
 * ----------------------------------------------------------------------------
 * Job-related UI, separated from file pickers and the tool hero:
 *
 *   • ProcessingOverlay  fullscreen progress ring + elapsed timer
 *   • SaveToast          transient save/share confirmation pill
 *   • OptionsSheet       bottom sheet: per-tool settings
 *   • SuccessSheet       bottom sheet: result preview + share/save/download
 *   • ErrorSheet         bottom sheet: error message + retry/clear
 *   • NativeLimitPromo   full-page state: file > 5 GB in the native app
 *   • WebPromo           full-page state: web-only fallback nudge
 *
 * None of these components own state — they receive what they need as props
 * so the screen's state machine stays in one place (inner.tsx).
 */
import { NativeAppPromo } from '../../../components/conversion/Converter';
import type { FallbackReason } from '../../../core/toolRunner';
import { haptic } from '../haptic';
import { FileChip } from './file-ui';
import {
  formatElapsed,
  humanSize,
  isAudioMime,
  isImageMime,
  isVideoMime,
} from './helpers';
import type { SettingDef, Tool } from './types';
import { BottomSheet, PillSetting, PremiumButton, ProgressRing } from './ui';

/* ── Processing fullscreen overlay ──────────────────────── */

export function ProcessingOverlay({
  toolName, progress, elapsed, native,
}: {
  toolName: string;
  progress: number;
  elapsed: number;
  native: boolean;
}) {
  return (
    <div role="status" aria-live="polite" style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: 'rgba(15,23,42,0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'white', padding: '2rem',
    }}>
      <ProgressRing percent={progress} />
      <p style={{ fontSize: '1.15rem', fontWeight: 800, margin: '1.5rem 0 0.5rem' }}>
        Processing…
      </p>
      <p style={{ fontSize: '0.85rem', opacity: 0.75, margin: 0, textAlign: 'center', maxWidth: '280px', lineHeight: 1.5 }}>
        {toolName}
        <br />
        {native ? 'runs on your device' : 'runs in your browser'}
      </p>
      {elapsed > 0 && (
        <p style={{ fontSize: '0.78rem', opacity: 0.55, margin: '0.75rem 0 0' }}>
          Elapsed: {formatElapsed(elapsed)}
        </p>
      )}
    </div>
  );
}

/* ── Save/share feedback toast ──────────────────────────── */

export function SaveToast({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
      transform: 'translateX(-50%)',
      background: 'rgba(15,23,42,0.92)',
      color: 'white',
      padding: '0.65rem 1.15rem',
      borderRadius: '999px',
      fontSize: '0.85rem',
      fontWeight: 600,
      zIndex: 200,
      boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
      animation: 'd-slide-up 200ms ease-out',
    }}>
      {message}
    </div>
  );
}

/* ── Options bottom sheet ───────────────────────────────── */

export function OptionsSheet({
  open, onClose, settings, values, onSettingChange,
}: {
  open: boolean;
  onClose: () => void;
  settings: SettingDef[];
  values: Record<string, string | number>;
  onSettingChange: (name: string, value: string | number) => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ padding: '0.5rem 1.25rem 0' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Options</h2>
        <p style={{ fontSize: '0.82rem', opacity: 0.6, margin: '4px 0 0' }}>
          Customize your output before processing.
        </p>
      </div>

      <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
        {settings.map((s) => (
          <PillSetting
            key={s.name}
            setting={s}
            value={values[s.name]}
            onChange={(v) => onSettingChange(s.name, v)}
          />
        ))}
      </div>

      <div style={{
        padding: '0.75rem 1.25rem calc(1rem + env(safe-area-inset-bottom, 0px))',
        borderTop: '1px solid var(--line, #e2e8f0)',
      }}>
        <PremiumButton variant="primary" onClick={() => { haptic(); onClose(); }}>
          Done
        </PremiumButton>
      </div>
    </BottomSheet>
  );
}

/* ── Success bottom sheet ───────────────────────────────── */

export function SuccessSheet({
  open, onClose, resultName, resultBlob, resultUrl, outputMime,
  onShare, onDownload, onProcessAnother,
}: {
  open: boolean;
  onClose: () => void;
  resultName: string;
  resultBlob: Blob | null;
  resultUrl: string | null;
  outputMime: string;
  onShare: () => void;
  onDownload: () => void;
  onProcessAnother: () => void;
}) {
  return (
    <BottomSheet open={open && !!resultBlob} onClose={onClose}>
      <div style={{ padding: '0.5rem 1.25rem 0', textAlign: 'center' }}>
        <div style={{
          width: '68px', height: '68px', margin: '0.5rem auto 0.75rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#22c55e,#16a34a)',
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 28px rgba(22,163,74,0.4)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
          Your file is ready
        </h2>
        <p style={{
          fontSize: '0.85rem', opacity: 0.75,
          margin: '0.5rem 0 0',
          wordBreak: 'break-all', overflowWrap: 'anywhere',
          lineHeight: 1.4,
        }}>
          {resultName}
        </p>
        {resultBlob && (
          <p style={{ fontSize: '0.78rem', opacity: 0.55, margin: '0.25rem 0 0' }}>
            {humanSize(resultBlob.size)}
          </p>
        )}
      </div>

      {resultUrl && (
        <div style={{
          margin: '1rem 1.25rem 0',
          borderRadius: '1rem',
          overflow: 'hidden',
          background: '#000',
          maxHeight: '260px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isVideoMime(outputMime) ? (
            <video src={resultUrl} controls playsInline style={{ width: '100%', maxHeight: '260px', display: 'block' }} />
          ) : isAudioMime(outputMime) ? (
            <div style={{ padding: '1rem', width: '100%' }}>
              <audio src={resultUrl} controls style={{ width: '100%' }} />
            </div>
          ) : isImageMime(outputMime) ? (
            <img src={resultUrl} alt="Preview" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block' }} />
          ) : null}
        </div>
      )}

      <div style={{
        padding: '1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column', gap: '0.625rem',
      }}>
        <PremiumButton variant="primary" onClick={onShare}>
          Share / Save
        </PremiumButton>
        <PremiumButton variant="secondary" onClick={onDownload}>
          Download
        </PremiumButton>
        <PremiumButton variant="ghost" onClick={onProcessAnother}>
          Process another file
        </PremiumButton>
      </div>
    </BottomSheet>
  );
}

/* ── Error bottom sheet ─────────────────────────────────── */

export function ErrorSheet({
  open, onClose, errorMsg, onRetry, onChooseAnother,
}: {
  open: boolean;
  onClose: () => void;
  errorMsg: string;
  onRetry: () => void;
  onChooseAnother: () => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={{ padding: '0.5rem 1.25rem 0', textAlign: 'center' }}>
        <div style={{
          width: '68px', height: '68px', margin: '0.5rem auto 0.75rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#fb923c,#dc2626)',
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
        }}>
          ⚠️
        </div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
          Something went wrong
        </h2>
        <p style={{
          fontSize: '0.85rem', opacity: 0.75, margin: '0.5rem 0 0',
          wordBreak: 'break-word', lineHeight: 1.5,
        }}>
          {errorMsg}
        </p>
      </div>
      <div style={{
        padding: '1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px))',
        display: 'flex', flexDirection: 'column', gap: '0.625rem',
      }}>
        <PremiumButton variant="primary" onClick={onRetry}>
          Try again
        </PremiumButton>
        <PremiumButton variant="secondary" onClick={onChooseAnother}>
          Choose another file
        </PremiumButton>
      </div>
    </BottomSheet>
  );
}

/* ── Native file-limit promo (full page) ────────────────── */

export function NativeLimitPromo({
  tool, totalMB, onClearFiles,
}: {
  tool: Tool;
  totalMB: number;
  onClearFiles: () => void;
}) {
  const sizeLabel = totalMB >= 1024
    ? `${(totalMB / 1024).toFixed(2)} GB`
    : `${Math.round(totalMB)} MB`;
  return (
    <div class="d-tool">
      <div class="d-tool__hero">
        <div class="d-tool__hero-icon" aria-hidden="true">{tool.icon}</div>
        <div class="d-tool__hero-body">
          <h1 class="d-tool__hero-name">{tool.name}</h1>
          <p class="d-tool__hero-desc">{tool.description}</p>
        </div>
      </div>
      <div style={{
        padding: '1.25rem', borderRadius: '1.25rem',
        background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
        border: '1px solid #f59e0b', color: '#78350f',
      }}>
        <p style={{ fontWeight: 800, fontSize: '1.05rem', margin: '0 0 0.5rem' }}>
          File exceeds the 5 GB app limit
        </p>
        <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.9rem' }}>
          Your file is <strong>{sizeLabel}</strong>. The app processes up to 5 GB per file.
          For larger files, split them first with the Video Cutter or Audio Cutter.
        </p>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <PremiumButton variant="secondary" onClick={onClearFiles}>
          Choose another file
        </PremiumButton>
      </div>
    </div>
  );
}

/* ── Web fallback promo (full page) ─────────────────────── */

export function WebPromo({
  tool, reason, totalMB, files,
  onRemoveFile, onPreview, onClearFiles, onTryAnyway,
}: {
  tool: Tool;
  reason: FallbackReason | 'native-limit';
  totalMB: number;
  files: File[];
  onRemoveFile: (idx: number) => void;
  onPreview: (file: File) => void;
  onClearFiles: () => void;
  onTryAnyway: () => void;
}) {
  return (
    <div class="d-tool">
      <div class="d-tool__hero">
        <div class="d-tool__hero-icon" aria-hidden="true">{tool.icon}</div>
        <div class="d-tool__hero-body">
          <h1 class="d-tool__hero-name">{tool.name}</h1>
          <p class="d-tool__hero-desc">{tool.description}</p>
        </div>
      </div>
      <NativeAppPromo
        reason={reason}
        totalMB={totalMB}
        isMobile={true}
        canBypass={true}
        onTryAnyway={onTryAnyway}
      />
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {files.map((f, i) => (
            <FileChip
              key={`${f.name}-${i}`}
              file={f}
              tool={tool}
              onRemove={() => onRemoveFile(i)}
              onPreview={() => onPreview(f)}
            />
          ))}
        </div>
      )}
      <div style={{ marginTop: '1rem' }}>
        <PremiumButton variant="secondary" onClick={onClearFiles}>
          Choose different files
        </PremiumButton>
      </div>
    </div>
  );
}