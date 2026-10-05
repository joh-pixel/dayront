/**
 * src/ui/mobile/screens/ToolScreen.tsx
 * ----------------------------------------------------------------------------
 * Mobile-first tool screen with:
 *   • Real file thumbnails (video poster / image / audio icon)
 *   • Tap-to-preview full screen before processing
 *   • Wrong-file-type warning (checks category when `from` is missing)
 *   • Sanitized filenames (strips Android cache hashes)
 *   • Segmented pill options (CapCut-style)
 *   • Inline preview of the result before saving
 *   • Local notification when a job completes (settings-gated)
 *   • Keep-awake during processing (settings-gated)
 *   • Auto-save result (settings-gated)
 *   • Shared haptic feedback (settings-gated)
 *   • Prominent "don't close" warning while processing
 *   • Silent navigation guard — blocks back nav while processing
 *     WITHOUT the ugly native "Confirm Navigation" dialog.
 *
 * SSR NOTE: the default export is a thin wrapper. Astro bundles all
 * `client:load` components for a route into a single shared chunk; when
 * that chunk is evaluated on a page that doesn't render ToolScreen
 * (like /app/tools), the inner component must never be invoked. The
 * wrapper guards against a missing `tool` prop so SSR never crashes.
 */
import { useMemo, useRef, useState, useEffect } from 'preact/hooks';
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
import { NativeAppPromo, type SettingOption } from '../../../components/conversion/Converter';
import { haptic } from '../haptic';
import { setNavigationGuard, clearNavigationGuard } from '../navigation-guard';

/* ── Types ─────────────────────────────────────────────── */

interface SettingDef {
  name: string;
  label: string;
  type: 'range' | 'number' | 'select';
  min?: number;
  max?: number;
  options?: Array<string | SettingOption>;
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
const MAX_NATIVE_MB = 5000;

/* ── Environment ─────────────────────────────────────────── */

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return w.Capacitor?.isNativePlatform?.() === true || w.__TAURI__ !== undefined;
}

/* ── Helpers ─────────────────────────────────────────────── */

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function base64ToFile(base64: string, name: string, mime: string): File {
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
    mkv: 'video/x-matroska', flv: 'video/x-flv', gif: 'image/gif',
  };
  return m[ext.toLowerCase()] || 'application/octet-stream';
}

function isAudioMime(m: string): boolean { return m.startsWith('audio/'); }
function isVideoMime(m: string): boolean { return m.startsWith('video/'); }
function isImageMime(m: string): boolean { return m.startsWith('image/'); }

/** Detect media kind from a File object */
function fileKind(file: File): 'video' | 'audio' | 'image' | 'unknown' {
  if (isVideoMime(file.type)) return 'video';
  if (isAudioMime(file.type)) return 'audio';
  if (isImageMime(file.type)) return 'image';
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (['mp4','mov','webm','mkv','avi','flv','m4v'].includes(ext)) return 'video';
  if (['mp3','wav','m4a','aac','ogg','opus','flac','aiff','amr','ape'].includes(ext)) return 'audio';
  if (['jpg','jpeg','png','webp','gif','bmp','heic'].includes(ext)) return 'image';
  return 'unknown';
}

/**
 * Validate a picked file against the tool's expected input type.
 *
 * Prefers the explicit `tool.from` field. When it's missing (many
 * tools like Audio Compressor don't set it), we fall back to the
 * tool's category:
 *   audio-utility / audio-conversion    → expects audio
 *   video-utility / video-to-audio / video-conversion → expects video
 *   ai                                  → accepts any (images, videos, etc.)
 */
function validateFileForTool(file: File, tool: Tool): { ok: boolean; reason?: string } {
  const kind = fileKind(file);
  const audioFormats = ['mp3','wav','m4a','aac','ogg','opus','flac','aiff','amr','ape'];
  const videoFormats = ['mp4','mov','mkv','avi','webm','flv','m4v'];
  const imageFormats = ['gif','png','jpg','jpeg','webp'];

  // What does this tool expect?
  let expects: 'audio' | 'video' | 'image' | 'any' = 'any';

  if (tool.from) {
    const f = tool.from.toLowerCase();
    if (audioFormats.includes(f)) expects = 'audio';
    else if (videoFormats.includes(f)) expects = 'video';
    else if (imageFormats.includes(f)) expects = 'image';
  } else {
    const cat = (tool.category || '').toLowerCase();
    if (cat === 'audio-utility' || cat === 'audio-conversion') {
      expects = 'audio';
    } else if (
      cat === 'video-utility' ||
      cat === 'video-to-audio' ||
      cat === 'video-conversion'
    ) {
      expects = 'video';
    }
    // AI tools accept anything — leave as 'any'
  }

  if (expects === 'any') return { ok: true };
  if (kind === expects) return { ok: true };
  if (kind === 'unknown') return { ok: true }; // can't classify → let it through

  const label = expects.charAt(0).toUpperCase() + expects.slice(1);
  return {
    ok: false,
    reason: `This tool expects ${label.toLowerCase()} files. You picked a ${kind}. Tap the × to remove it and choose the correct file.`,
  };
}

/* ── Native integrations (lazy, safe on web, settings-gated) ── */

async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  if (!getSettings().notifications) return false;
  try {
    const mod: any = await import(/* @vite-ignore */ '@capacitor/local-notifications');
    const LocalNotifications = mod.LocalNotifications;
    const cur = await LocalNotifications.checkPermissions();
    if (cur.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch { return false; }
}

async function notifyJobDone(toolName: string, fileName: string) {
  if (!isNativeApp()) return;
  if (!getSettings().notifications) return;
  try {
    const mod: any = await import(/* @vite-ignore */ '@capacitor/local-notifications');
    await mod.LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Date.now() % 2147483647),
        title: 'Dayront — Done!',
        body: `${fileName} is ready`,
        schedule: { at: new Date(Date.now() + 100) },
        smallIcon: 'ic_stat_icon_config_sample',
        channelId: 'dayront-jobs',
      }],
    });
  } catch (err) { console.warn('[notify] Failed:', err); }
}

async function keepAwakeOn() {
  if (!isNativeApp()) return;
  if (!getSettings().keepAwake) return;
  try {
    const mod: any = await import(/* @vite-ignore */ '@capacitor-community/keep-awake');
    await mod.KeepAwake.keepAwake();
  } catch {}
}

async function keepAwakeOff() {
  if (!isNativeApp()) return;
  if (!getSettings().keepAwake) return;
  try {
    const mod: any = await import(/* @vite-ignore */ '@capacitor-community/keep-awake');
    await mod.KeepAwake.allowSleep();
  } catch {}
}

/* ── Bottom sheet wrapper ───────────────────────────────── */

function BottomSheet({
  open, onClose, children,
}: { open: boolean; onClose: () => void; children: any; }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(2px)',
        animation: 'd-fade-in 180ms ease-out',
      }} />
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: '560px',
        background: 'var(--bg-elev, #fff)',
        color: 'var(--fg, #0f172a)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.28)',
        animation: 'd-slide-up 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '4px' }}>
          <div style={{ width: '42px', height: '4px', borderRadius: '999px', background: 'rgba(120,120,120,0.4)' }} />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Premium curved button ──────────────────────────────── */

function PremiumButton({
  children, onClick, variant = 'primary', disabled = false,
}: {
  children: any;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const styles: Record<string, any> = {
    primary: {
      background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
      color: '#fff',
      border: 'none',
      boxShadow: pressed
        ? '0 4px 12px rgba(2,132,199,0.35)'
        : '0 10px 24px rgba(2,132,199,0.40), inset 0 1px 0 rgba(255,255,255,0.25)',
    },
    secondary: {
      background: 'var(--bg-soft, #eef2f7)',
      color: 'inherit',
      border: '1px solid var(--line, rgba(148,163,184,0.35))',
      boxShadow: pressed
        ? '0 2px 6px rgba(0,0,0,0.06)'
        : '0 6px 14px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
    },
    ghost: {
      background: 'transparent',
      color: 'inherit',
      border: '1px solid var(--line, rgba(148,163,184,0.35))',
      boxShadow: 'none',
    },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: '100%',
        padding: '1rem 1.5rem',
        borderRadius: '999px',
        fontSize: '1rem',
        fontWeight: 800,
        letterSpacing: '0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 120ms ease-out, box-shadow 120ms ease-out',
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

/* ── File thumbnail helper — generates a preview URL ─────── */

function useFileThumbnail(file: File | null): string | null {
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

/* ── File chip with REAL thumbnail ──────────────────────────
   Shows:
     • video  → poster frame (works on most Android WebViews)
     • image  → actual image
     • audio  → tool icon + waveform glyph
     • tap    → opens full preview
   ─────────────────────────────────────────────────────────── */

function FileChip({
  file, tool, onRemove, onPreview,
}: {
  file: File;
  tool: Tool;
  onRemove?: () => void;
  onPreview?: () => void;
}) {
  const thumb = useFileThumbnail(file);
  const kind = fileKind(file);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      padding: '0.875rem',
      borderRadius: '1rem',
      border: '1px solid var(--line, #e2e8f0)',
      background: 'var(--bg-elev, #fff)',
    }}>
      {/* Thumbnail slot */}
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Preview ${file.name}`}
        style={{
          width: '56px',
          height: '56px',
          flexShrink: 0,
          borderRadius: '12px',
          background: kind === 'audio' ? 'var(--brand-soft, #e0f2fe)' : '#0A0E1A',
          color: '#fff',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
        }}
      >
        {kind === 'video' && thumb ? (
          <>
            <video
              src={thumb}
              preload="metadata"
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <span style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.28)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </>
        ) : kind === 'image' && thumb ? (
          <img
            src={thumb}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : kind === 'audio' ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        ) : (
          <span>{tool.icon}</span>
        )}
      </button>

      {/* Body */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: '0.9rem',
          fontWeight: 700,
          lineHeight: 1.35,
          wordBreak: 'break-all',
          overflowWrap: 'anywhere',
        }}>
          {file.name}
        </div>
        <div style={{
          fontSize: '0.75rem',
          opacity: 0.6,
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
        }}>
          <span>{humanSize(file.size)}</span>
          <span>·</span>
          <span style={{ textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em', fontWeight: 700 }}>
            {kind}
          </span>
        </div>
      </div>

      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${file.name}`}
          onClick={onRemove}
          style={{
            width: '32px', height: '32px', flexShrink: 0,
            borderRadius: '50%', border: 'none',
            background: 'rgba(120,120,120,0.12)',
            color: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ── Full-screen file preview ───────────────────────────── */

function FilePreview({
  file, open, onClose,
}: { file: File | null; open: boolean; onClose: () => void }) {
  const thumb = useFileThumbnail(file);
  if (!open || !file || !thumb) return null;
  const kind = fileKind(file);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 1rem', color: '#fff', flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          style={{
            width: '40px', height: '40px',
            borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div style={{
          fontSize: '0.85rem', fontWeight: 700,
          opacity: 0.75, maxWidth: '70%',
          textAlign: 'center', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {file.name}
        </div>
        <div style={{ width: '40px' }} />
      </div>

      <div style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 1rem 1rem',
        minHeight: 0,
      }}>
        {kind === 'video' ? (
          <video
            src={thumb}
            controls
            autoPlay
            playsInline
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '1rem' }}
          />
        ) : kind === 'image' ? (
          <img
            src={thumb}
            alt={file.name}
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '1rem', objectFit: 'contain' }}
          />
        ) : null}
      </div>

      <div style={{
        padding: '0.875rem 1.5rem 1.25rem',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.78rem',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {humanSize(file.size)} · {file.type || 'unknown type'}
      </div>
    </div>
  );
}

/* ── Segmented pill option (CapCut-style) ───────────────── */

function PillSetting({
  setting, value, onChange,
}: {
  setting: SettingDef;
  value: string | number;
  onChange: (v: string | number) => void;
}) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{
        fontSize: '0.78rem', fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        opacity: 0.55, marginBottom: '0.5rem',
      }}>
        {setting.label}
      </div>

      {setting.type === 'select' && setting.options && (
        <div style={{
          display: 'flex', gap: '0.5rem',
          overflowX: 'auto', paddingBottom: '0.25rem',
          scrollbarWidth: 'none',
        }}>
          {setting.options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lbl = typeof opt === 'string' ? opt : opt.label;
            const active = String(val) === String(value);
            return (
              <button
                key={String(val)}
                type="button"
                onClick={() => { haptic(); onChange(val); }}
                style={{
                  flexShrink: 0,
                  padding: '0.65rem 1rem',
                  borderRadius: '999px',
                  border: active ? 'none' : '1px solid var(--line, rgba(148,163,184,0.35))',
                  background: active ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'var(--bg-elev, #fff)',
                  color: active ? '#fff' : 'inherit',
                  fontSize: '0.85rem',
                  fontWeight: active ? 700 : 600,
                  cursor: 'pointer',
                  boxShadow: active ? '0 6px 14px rgba(2,132,199,0.35)' : '0 1px 2px rgba(0,0,0,0.04)',
                  transition: 'all 140ms ease-out',
                }}
              >
                {lbl}
              </button>
            );
          })}
        </div>
      )}

      {setting.type === 'range' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.5rem 0.75rem', borderRadius: '1rem',
          background: 'var(--bg-soft, rgba(241,245,249,0.6))',
        }}>
          <input
            type="range"
            min={setting.min}
            max={setting.max}
            value={Number(value)}
            onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: '52px', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
            {value}
          </span>
        </div>
      )}

      {setting.type === 'number' && (
        <input
          type="number"
          min={setting.min}
          max={setting.max}
          value={Number(value)}
          onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
          style={{
            width: '100%', padding: '0.875rem 1rem',
            fontSize: '1rem', fontWeight: 700,
            borderRadius: '1rem',
            border: '1px solid var(--line, rgba(148,163,184,0.35))',
            background: 'var(--bg-elev, #fff)',
            color: 'inherit',
          }}
        />
      )}
    </div>
  );
}

/* ── Progress ring ──────────────────────────────────────── */

function ProgressRing({ percent }: { percent: number }) {
  const size = 148, stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circ * (1 - clamped / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#38bdf8" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 300ms ease-out' }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill="white" fontSize="28" fontWeight="800">
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   INNER COMPONENT — all hooks + logic live here.
   Only rendered when `tool` is guaranteed present.
   ══════════════════════════════════════════════════════════ */

function ToolScreenInner({ tool }: { tool: Tool }) {
  const [state, setState] = useState<State>('idle');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultName, setResultName] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);

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

  /* ── Silent navigation guard ──
     Registers a guard with MobileLayout while a job is processing.
     The native back-button listener checks the guard BEFORE calling
     history.back() or exiting, so the browser's "Confirm Navigation"
     dialog NEVER appears. Replaces the previous `beforeunload` handler
     which produced that ugly native Android alert. */
  useEffect(() => {
    if (state !== 'processing') {
      clearNavigationGuard();
      return;
    }

    // Return false → block navigation (MobileLayout will silently swallow).
    setNavigationGuard(() => false);

    return () => {
      clearNavigationGuard();
    };
  }, [state]);

  /* ── File picking ─────────────────────────────────────── */

  function addFiles(arr: File[]) {
    if (arr.length === 0) return;

    const first = arr[0];
    const check = validateFileForTool(first, tool);
    if (!check.ok && check.reason) {
      setFileWarning(check.reason);
    } else {
      setFileWarning(null);
    }

    const next = multi ? [...files, ...arr] : [arr[0]];
    setFiles(next);
    setState('ready');
    setErrorMsg('');

    const totalMB = next.reduce((s, f) => s + f.size, 0) / (1024 * 1024);
    if (native) {
      if (totalMB > MAX_NATIVE_MB) {
        setPromo({ reason: 'native-limit', totalMB });
        setBypassPromo(true);
      } else {
        setPromo(null); setBypassPromo(false);
      }
    } else {
      const capacity = checkWebCapacity(next, true);
      if (capacity) {
        setPromo({ reason: capacity.reason, totalMB: capacity.totalMB });
        setBypassPromo(false);
      } else {
        setPromo(null); setBypassPromo(false);
      }
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

  /* ── Processing ───────────────────────────────────────── */

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

  /* ── Result actions ───────────────────────────────────── */

  async function handleShare() {
    if (!resultBlob) return;
    haptic();
    try {
      const ok = await shareBlob(resultBlob, resultName, tool.name);
      if (!ok) {
        await saveBlob(resultBlob, resultName);
        setSaveFeedback('Saved to your device');
      } else {
        setSaveFeedback('Shared successfully');
      }
    } catch (err) {
      console.error('[share] Failed:', err);
      setSaveFeedback('Could not share — try Download');
    }
    setTimeout(() => setSaveFeedback(null), 2400);
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

  /* ── Derived values ───────────────────────────────────── */

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

  /* ── Promo views ──────────────────────────────────────── */

  if (native && promo?.reason === 'native-limit') {
    const sizeLabel = promo.totalMB >= 1024
      ? `${(promo.totalMB / 1024).toFixed(2)} GB`
      : `${Math.round(promo.totalMB)} MB`;
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
          <PremiumButton variant="secondary" onClick={clearFiles}>
            Choose another file
          </PremiumButton>
        </div>
      </div>
    );
  }

  if (!native && promo && !bypassPromo) {
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
          reason={promo.reason}
          totalMB={promo.totalMB}
          isMobile={true}
          canBypass={true}
          onTryAnyway={handleTryAnyway}
        />
        {files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {files.map((f, i) => (
              <FileChip
                key={`${f.name}-${i}`}
                file={f}
                tool={tool}
                onRemove={() => removeFile(i)}
                onPreview={() => openPreview(f)}
              />
            ))}
          </div>
        )}
        <div style={{ marginTop: '1rem' }}>
          <PremiumButton variant="secondary" onClick={clearFiles}>
            Choose different files
          </PremiumButton>
        </div>
      </div>
    );
  }

  /* ── Main render ──────────────────────────────────────── */

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
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#38bdf8,#0284c7)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 28px rgba(2,132,199,0.4)',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
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

        {files.length > 0 && state !== 'idle' && state !== 'processing' && (
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
            {tool.name}
            <br />
            {native ? 'runs on your device' : 'runs in your browser'}
          </p>
        </div>
      )}

      {saveFeedback && (
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
          {saveFeedback}
        </div>
      )}

      <FilePreview
        file={previewFile}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      <BottomSheet open={optionsOpen} onClose={() => setOptionsOpen(false)}>
        <div style={{ padding: '0.5rem 1.25rem 0' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Options</h2>
          <p style={{ fontSize: '0.82rem', opacity: 0.6, margin: '4px 0 0' }}>
            Customize your output before processing.
          </p>
        </div>

        <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
          {(tool.settings ?? []).map((s) => (
            <PillSetting
              key={s.name}
              setting={s}
              value={settings[s.name]}
              onChange={(v) => setSettings((prev) => ({ ...prev, [s.name]: v }))}
            />
          ))}
        </div>

        <div style={{
          padding: '0.75rem 1.25rem calc(1rem + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid var(--line, #e2e8f0)',
        }}>
          <PremiumButton variant="primary" onClick={() => { haptic(); setOptionsOpen(false); }}>
            Done
          </PremiumButton>
        </div>
      </BottomSheet>

      <BottomSheet
        open={successOpen && !!resultBlob}
        onClose={() => setSuccessOpen(false)}
      >
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
          <PremiumButton variant="primary" onClick={handleShare}>
            Share / Save
          </PremiumButton>
          <PremiumButton variant="secondary" onClick={handleDownload}>
            Download
          </PremiumButton>
          <PremiumButton variant="ghost" onClick={clearFiles}>
            Process another file
          </PremiumButton>
        </div>
      </BottomSheet>

      <BottomSheet
        open={errorOpen && state === 'error'}
        onClose={() => { setErrorOpen(false); setState('ready'); }}
      >
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
          <PremiumButton
            variant="primary"
            onClick={() => { haptic(); setErrorOpen(false); setState('ready'); setErrorMsg(''); }}
          >
            Try again
          </PremiumButton>
          <PremiumButton variant="secondary" onClick={clearFiles}>
            Choose another file
          </PremiumButton>
        </div>
      </BottomSheet>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PUBLIC WRAPPER — SSR-safe.
   Astro bundles every `client:load` component for a route into
   one shared chunk. When that chunk is evaluated on a page that
   doesn't actually render ToolScreen (like /app/tools), the
   inner component must never be invoked with a missing prop.
   This wrapper guards against that — zero hooks, zero risk.
   ══════════════════════════════════════════════════════════ */

export default function ToolScreen(props: Props) {
  if (!props || !props.tool || typeof props.tool !== 'object') {
    return (
      <div
        class="d-tool"
        style={{ padding: '3rem 1.5rem', textAlign: 'center', opacity: 0.6 }}
      >
        <p style={{ fontSize: '0.9rem', margin: 0 }}>No tool selected.</p>
      </div>
    );
  }
  return <ToolScreenInner tool={props.tool} />;
}

/* ── Helper: one-line settings summary ──────────────────── */

function summarizeSettings(
  settings: SettingDef[],
  values: Record<string, string | number>,
): string {
  const parts: string[] = [];
  for (const s of settings.slice(0, 2)) {
    const val = values[s.name] ?? s.default;
    if (s.type === 'select' && s.options) {
      const match = s.options.find((o) =>
        typeof o !== 'string' && String(o.value) === String(val),
      );
      const label = typeof match === 'string' ? match : match?.label;
      parts.push(label ?? String(val));
    } else {
      parts.push(String(val));
    }
  }
  if (settings.length > 2) parts.push(`+${settings.length - 2}`);
  return parts.join(' · ');
}