/**
 * src/ui/mobile/tool/helpers.ts
 * ----------------------------------------------------------------------------
 * Pure helpers used by the tool screen. No hooks, no JSX, no native imports —
 * every function here is deterministic and side-effect-free, which makes this
 * module safe to import anywhere and easy to unit-test.
 *
 * Extracted verbatim from ToolScreen.tsx. If any behaviour needs to change,
 * change it here and both the picker UI and the processing pipeline will pick
 * it up.
 */
import type { Tool, SettingDef } from './types';

/* ── Display formatting ─────────────────────────────────── */

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Format elapsed seconds as "45s" or "2m 15s" */
export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

/* ── File construction (native picker returns base64) ───── */

export function base64ToFile(base64: string, name: string, mime: string): File {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: mime || 'application/octet-stream' });
}

export function mimeForExt(ext: string): string {
  const m: Record<string, string> = {
    mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
    aac: 'audio/aac', ogg: 'audio/ogg', opus: 'audio/ogg',
    flac: 'audio/flac', mp4: 'video/mp4', webm: 'video/webm',
    mov: 'video/quicktime', avi: 'video/x-msvideo',
    mkv: 'video/x-matroska', flv: 'video/x-flv', gif: 'image/gif',
  };
  return m[ext.toLowerCase()] || 'application/octet-stream';
}

/* ── MIME predicates ────────────────────────────────────── */

export function isAudioMime(m: string): boolean { return m.startsWith('audio/'); }
export function isVideoMime(m: string): boolean { return m.startsWith('video/'); }
export function isImageMime(m: string): boolean { return m.startsWith('image/'); }

/* ── Media kind detection ───────────────────────────────── */

/** Detect media kind from a File object */
export function fileKind(file: File): 'video' | 'audio' | 'image' | 'unknown' {
  if (isVideoMime(file.type)) return 'video';
  if (isAudioMime(file.type)) return 'audio';
  if (isImageMime(file.type)) return 'image';
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (['mp4','mov','webm','mkv','avi','flv','m4v'].includes(ext)) return 'video';
  if (['mp3','wav','m4a','aac','ogg','opus','flac','aiff','amr','ape'].includes(ext)) return 'audio';
  if (['jpg','jpeg','png','webp','gif','bmp','heic'].includes(ext)) return 'image';
  return 'unknown';
}

/* ── File/tool compatibility check ──────────────────────── */

/**
 * Validate a picked file against the tool's expected input type.
 *
 * 3-stage check:
 *   1. If `tool.from` is a real format (mp4, mp3, jpg…), use it.
 *   2. If `tool.from` is a resolution preset (720p, 4k…) it won't match
 *      any format — fall through to stage 3.
 *   3. Fall back to `tool.category`:
 *        audio-utility / audio-conversion    → expects audio
 *        video-utility / video-to-audio / video-conversion → expects video
 *        ai                                  → accepts anything
 *
 * The `matched` flag is what makes this work. Without it, a resolution
 * preset like '720p' short-circuits the entire validation.
 */
export function validateFileForTool(file: File, tool: Tool): { ok: boolean; reason?: string } {
  const kind = fileKind(file);
  const audioFormats = ['mp3','wav','m4a','aac','ogg','opus','flac','aiff','amr','ape'];
  const videoFormats = ['mp4','mov','mkv','avi','webm','flv','m4v'];
  const imageFormats = ['gif','png','jpg','jpeg','webp'];

  let expects: 'audio' | 'video' | 'image' | 'any' = 'any';
  let matched = false;

  // Stage 1: explicit format from `tool.from`
  if (tool.from) {
    const f = tool.from.toLowerCase();
    if (audioFormats.includes(f)) { expects = 'audio'; matched = true; }
    else if (videoFormats.includes(f)) { expects = 'video'; matched = true; }
    else if (imageFormats.includes(f)) { expects = 'image'; matched = true; }
  }

  // Stage 2: category fallback (runs when from is missing OR is a preset)
  if (!matched) {
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

/* ── Long-job pre-flight warning ────────────────────────── */

/** Detect heavy jobs that need a "keep the app open" pre-flight warning. */
export function shouldWarnLongJob(tool: Tool, totalBytes: number): boolean {
  if (tool.recommendApp) return true;
  const mb = totalBytes / (1024 * 1024);
  if (mb > 100) return true;
  if (tool.type === 'resolution-convert' && (tool.presetWidth ?? 0) >= 3840) return true;
  return false;
}

/* ── Settings summary line ──────────────────────────────── */

/** One-line summary shown under the "Adjust settings" button. */
export function summarizeSettings(
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