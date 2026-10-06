/**
 * src/core/toolRunner.ts
 * ----------------------------------------------------------------------------
 * Dispatches a tool + user options → the right FFmpeg operation.
 *
 * Strategy:
 *   1. If a native FFmpeg backend is available (Capacitor / Tauri) → use it.
 *      This gives 5 GB files, 10× speed, and no WASM download.
 *   2. Otherwise fall back to WASM FFmpeg (web).
 *
 * ToolScreen calls runTool() and gets back a Blob. No UI logic here.
 *
 * ── Smart fallback ──────────────────────────────────────────────────────
 * When the browser is asked to do something it clearly can't handle
 * (huge files, out-of-memory WASM crashes), we throw a ToolFallbackError
 * instead of a generic Error. Callers can then render the NativeAppPromo
 * card pointing to download.dayront.com instead of a scary red error box.
 */

import {
  convertFile,
  cutAudio,
  mergeAudio,
  compressAudio,
  boostVolume,
  changeSpeed,
  reverseAudio,
  stereoToMono,
  compressVideo,
  cutVideo,
  mergeVideos,
  videoToGif,
  gifToMp4,
  resizeVideo,
  resolutionConvert,
  cropVideo,
  changeFPS,
  muteVideo,
  extractAudio,
} from './ffmpeg';

import { isNativeFFmpegAvailable, runNativeFFmpeg } from './ffmpeg-native';

/* ── Public types ─────────────────────────────────────────── */

export interface RunnerTool {
  slug: string;
  name: string;
  type?: string;
  outputFormat?: string;
  presetWidth?: number;
  presetHeight?: number;
}

export interface RunnerOptions {
  /** Single file for most tools; multiple for merge tools. */
  files: File[];
  /** Settings values keyed by setting name. */
  settings: Record<string, string | number>;
  onProgress?: (percent: number) => void;
}

/* ── Fallback signalling ─────────────────────────────────── */

export type FallbackReason =
  | 'file-too-large'
  | 'out-of-memory'
  | 'timeout'
  | 'unknown';

/**
 * Thrown when we know the browser can't do the job and the native app
 * (or a desktop) is the right answer. The UI catches this and shows the
 * "Get the Dayront App" promo card instead of a generic error.
 */
export class ToolFallbackError extends Error {
  reason: FallbackReason;
  fileSizeMB: number;

  constructor(message: string, reason: FallbackReason, fileSizeMB = 0) {
    super(message);
    this.name = 'ToolFallbackError';
    this.reason = reason;
    this.fileSizeMB = fileSizeMB;
  }
}

/* ── Size + environment detection ────────────────────────── */

const VIDEO_EXTENSIONS = new Set([
  'mp4', 'mov', 'mkv', 'avi', 'webm', 'flv', 'm4v', 'wmv', '3gp', 'mpg', 'mpeg',
]);

function isVideoFile(file: File): boolean {
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (VIDEO_EXTENSIONS.has(ext)) return true;
  return file.type.startsWith('video/');
}

/**
 * Rough capacity limits for WASM FFmpeg in a browser tab.
 *
 * These are deliberately conservative. Native FFmpeg (in the Dayront App)
 * handles 5 GB without breaking a sweat, so nudging users earlier is
 * strictly better UX than letting their tab crash at 90%.
 */
export const WEB_LIMITS_MB = {
  audio: { mobile: 100, desktop: 300 },
  video: { mobile: 250, desktop: 500 },
} as const;

/**
 * Check whether the current files are likely too big for the browser.
 * Returns null if they're fine, or a reason to nudge the user to the app.
 */
export function checkWebCapacity(
  files: File[],
  isMobile: boolean,
): { reason: FallbackReason; totalMB: number; isVideo: boolean } | null {
  if (!files.length) return null;

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const totalMB = totalBytes / (1024 * 1024);
  const hasVideo = files.some(isVideoFile);

  const limit = hasVideo
    ? (isMobile ? WEB_LIMITS_MB.video.mobile : WEB_LIMITS_MB.video.desktop)
    : (isMobile ? WEB_LIMITS_MB.audio.mobile : WEB_LIMITS_MB.audio.desktop);

  if (totalMB > limit) {
    return { reason: 'file-too-large', totalMB, isVideo: hasVideo };
  }
  return null;
}

/**
 * Detect whether an error thrown by WASM FFmpeg is likely caused by
 * memory pressure. WASM OOM errors surface as any of a dozen different
 * messages depending on the browser, so we cast a wide net.
 */
export function isMemoryError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('out of memory') ||
    msg.includes('out-of-memory') ||
    msg.includes('oom') ||
    msg.includes('cannot enlarge memory') ||
    msg.includes('allocation failed') ||
    msg.includes('runtimeerror') ||
    msg.includes('aborted') ||
    msg.includes('abort(') ||
    msg.includes('memory access out of bounds') ||
    msg.includes('maximum call stack')
  );
}

/* ── Multi-file tool registry ────────────────────────────── */

/** Tool types that accept multiple input files. */
const MULTI_FILE_TYPES = new Set(['merge', 'video-merge']);

export function isMultiFileTool(tool: RunnerTool): boolean {
  return MULTI_FILE_TYPES.has(tool.type ?? '');
}

/* ── Settings helpers ────────────────────────────────────── */

function num(
  settings: Record<string, string | number>,
  key: string,
  fallback: number,
): number {
  const v = settings[key];
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

function str(
  settings: Record<string, string | number>,
  key: string,
  fallback: string,
): string {
  const v = settings[key];
  return v === undefined || v === null ? fallback : String(v);
}

/* ── Main dispatcher ─────────────────────────────────────── */

export async function runTool(
  tool: RunnerTool,
  opts: RunnerOptions,
): Promise<Blob> {
  const { files, settings, onProgress } = opts;
  const format = tool.outputFormat ?? 'mp3';

  if (!files.length) throw new Error('No input file selected.');

  /* ── Native fast path ───────────────────────────────────
     Fires only inside a Capacitor or Tauri shell where a real
     FFmpeg binary is available. On web, this branch is skipped
     and the code falls through to the WASM implementation.

     ★ IMPORTANT: on failure, we do NOT fall through to WASM.

     WASM FFmpeg needs a ~30MB core download from the network and
     cannot work offline. Native failures almost always happen in
     situations where WASM would also fail (offline, low storage,
     missing permissions). Falling through silently produced a
     misleading experience: the user saw a web-only "please use
     the Dayront app" message from inside the native app itself.

     Instead, wrap and re-throw the native error so the real cause
     surfaces in the error sheet. */
  if (isNativeFFmpegAvailable()) {
    try {
      const nativeResult = await runNativeFFmpeg({
        args: buildNativeArgsFor(tool, files, settings, format),
        inputs: files,
        outputName: `output.${format}`,
        outputMime: mimeForFormat(format),
        onProgress,
      });
      return nativeResult.blob;
    } catch (err) {
      const nativeMsg = err instanceof Error ? err.message : String(err);
      console.error('[toolRunner] Native FFmpeg failed:', err);
      throw new Error(
        `Processing failed on this device: ${nativeMsg || 'unknown error'}`,
      );
    }
  }

  /* ── WASM fallback (web) ───────────────────────────────
     Wrap the WASM path so we can convert memory/OOM crashes into
     a ToolFallbackError, which the UI knows how to present as a
     "use the app instead" recommendation. */
  try {
    return await runWasm(tool, files, settings, format, onProgress);
  } catch (err) {
    if (err instanceof ToolFallbackError) throw err;

    if (isMemoryError(err)) {
      const totalMB =
        files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);
      throw new ToolFallbackError(
        'The browser ran out of memory while processing this file.',
        'out-of-memory',
        totalMB,
      );
    }
    throw err;
  }
}

/* ── WASM implementation ─────────────────────────────────── */

async function runWasm(
  tool: RunnerTool,
  files: File[],
  settings: Record<string, string | number>,
  format: string,
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const file = files[0];

  switch (tool.type) {
    /* ── Audio utilities ─────────────────────────── */
    case 'cut':
      return cutAudio(file, num(settings, 'start', 0), num(settings, 'duration', 30), format, false, onProgress);

    case 'merge':
      return mergeAudio(files, format, false, onProgress);

    case 'compress':
      return compressAudio(file, num(settings, 'quality', 3), format, false, onProgress);

    case 'boost':
      return boostVolume(file, num(settings, 'gain', 6), format, false, onProgress);

    case 'speed':
      return changeSpeed(file, num(settings, 'factor', 1.5), format, false, onProgress);

    case 'reverse':
      return reverseAudio(file, format, false, onProgress);

    case 'stereo-to-mono':
      return stereoToMono(file, format, false, onProgress);

    /* ── Format conversion ───────────────────────── */
    case 'convert':
      return convertFile(file, format, false, onProgress, str(settings, 'bitrate', '192k'));

    case 'convert-video':
      return convertFile(file, format, false, onProgress);

    /* ── Video utilities ─────────────────────────── */
    case 'video-cut':
      return cutVideo(file, num(settings, 'start', 0), num(settings, 'duration', 30), format, false, onProgress);

    case 'video-merge':
      return mergeVideos(files, format, false, onProgress);

    case 'video-compress':
      return compressVideo(file, num(settings, 'crf', 23), str(settings, 'preset', 'medium'), format, false, onProgress);

    case 'video-to-gif':
      return videoToGif(file, num(settings, 'fps', 10), num(settings, 'width', 320), false, onProgress);

    case 'gif-to-video':
      return gifToMp4(file, false, onProgress);

    case 'resize-video':
      return resizeVideo(file, num(settings, 'width', 1280), num(settings, 'height', 720), format, false, onProgress);

    case 'crop-video':
      return cropVideo(
        file,
        num(settings, 'x', 0),
        num(settings, 'y', 0),
        num(settings, 'w', 640),
        num(settings, 'h', 480),
        format,
        false,
        onProgress,
      );

    case 'change-fps':
      return changeFPS(file, num(settings, 'fps', 30), format, false, onProgress);

    case 'mute-video':
      return muteVideo(file, format, false, onProgress);

    case 'extract-audio':
      return extractAudio(file, str(settings, 'format', 'mp3'), false, onProgress);

    /* ── Resolution conversion ───────────────────── */
    case 'resolution-convert': {
      const w = tool.presetWidth ?? num(settings, 'width', 1920);
      const h = tool.presetHeight ?? num(settings, 'height', 1080);
      return resolutionConvert(file, w, h, format, false, onProgress);
    }

    default:
      // Fall back to format conversion if we don't recognise the type.
      return convertFile(file, format, false, onProgress);
  }
}

/* ── Native argument builders ────────────────────────────── */

/**
 * Map an output format to its MIME type.
 * Used when building a native Blob from FFmpeg output.
 */
export function mimeForFormat(format: string): string {
  const f = format.toLowerCase().replace(/^\./, '');
  if (f === 'mp3') return 'audio/mpeg';
  if (f === 'wav') return 'audio/wav';
  if (f === 'm4a' || f === 'aac') return 'audio/mp4';
  if (f === 'ogg' || f === 'opus') return 'audio/ogg';
  if (f === 'flac') return 'audio/flac';
  if (f === 'mp4' || f === 'mov' || f === 'm4v') return 'video/mp4';
  if (f === 'webm') return 'video/webm';
  if (f === 'mkv') return 'video/x-matroska';
  if (f === 'avi') return 'video/x-msvideo';
  if (f === 'gif') return 'image/gif';
  if (f === 'png') return 'image/png';
  if (f === 'jpg' || f === 'jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

/**
 * Build the FFmpeg argument array for the native bridge.
 *
 * Uses the input files' names as placeholders — `buildNativeArgs` in
 * `ffmpeg-native.ts` replaces each `-i <name>` with the real native path,
 * and the final argument (the output filename) with the real output path.
 *
 * IMPORTANT: `-f lavfi -i anullsrc=...` is a **virtual** input — its
 * placeholder is passed through untouched because it isn't a real file.
 */
export function buildNativeArgsFor(
  tool: RunnerTool,
  files: File[],
  settings: Record<string, string | number>,
  format: string,
): string[] {
  const input = files[0];

  switch (tool.type) {
    /* ── Audio utilities ─────────────────────── */
    case 'cut':
      return [
        '-ss', String(num(settings, 'start', 0)),
        '-i', input.name,
        '-t', String(num(settings, 'duration', 30)),
        '-c', 'copy',
        '-y', `output.${format}`,
      ];

    case 'merge':
      return [
        ...files.flatMap((f) => ['-i', f.name]),
        '-filter_complex',
        `${files.map((_, i) => `[${i}:a]`).join('')}concat=n=${files.length}:v=0:a=1[out]`,
        '-map', '[out]',
        '-y', `output.${format}`,
      ];

    case 'compress':
      return [
        '-i', input.name,
        '-c:a', 'libmp3lame',
        '-q:a', String(num(settings, 'quality', 3)),
        '-y', `output.${format}`,
      ];

    case 'boost':
      return [
        '-i', input.name,
        '-af', `volume=${num(settings, 'gain', 6)}dB`,
        '-y', `output.${format}`,
      ];

    case 'speed':
      return [
        '-i', input.name,
        '-filter:a', `atempo=${num(settings, 'factor', 1.5)}`,
        '-y', `output.${format}`,
      ];

    case 'reverse':
      return [
        '-i', input.name,
        '-af', 'areverse',
        '-y', `output.${format}`,
      ];

    case 'stereo-to-mono':
      return [
        '-i', input.name,
        '-ac', '1',
        '-y', `output.${format}`,
      ];

    /* ── Format conversion ───────────────────── */
    case 'convert': {
      const args = ['-i', input.name];
      const bitrate = str(settings, 'bitrate', '');
      if (bitrate && (format === 'mp3' || format === 'aac')) {
        args.push('-b:a', bitrate);
      }
      args.push('-y', `output.${format}`);
      return args;
    }

    case 'convert-video':
      return ['-i', input.name, '-y', `output.${format}`];

    /* ── Video utilities ─────────────────────── */
    case 'video-cut':
      return [
        '-ss', String(num(settings, 'start', 0)),
        '-i', input.name,
        '-t', String(num(settings, 'duration', 30)),
        '-c', 'copy',
        '-y', `output.${format}`,
      ];

    /* ── Video merge ────────────────────────────
       Concat all videos into one video-only stream, then merge in a
       silent audio track. Uses `anullsrc` as a lavfi virtual input so
       every output has valid audio (needed for playback on most players).

       The anullsrc input index is `files.length` (after all real videos). */
    case 'video-merge': {
      const n = files.length;
      const filterParts = files.map((_, i) => `[${i}:v:0]`).join('');
      const filterComplex = `${filterParts}concat=n=${n}:v=1:a=0[outv]`;

      return [
        ...files.flatMap((f) => ['-i', f.name]),
        '-f', 'lavfi',
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-filter_complex', filterComplex,
        '-map', '[outv]',
        '-map', `${n}:a`,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        '-movflags', '+faststart',
        '-y', `output.${format}`,
      ];
    }

    case 'video-compress':
      return [
        '-i', input.name,
        '-c:v', 'libx264',
        '-crf', String(num(settings, 'crf', 23)),
        '-preset', str(settings, 'preset', 'medium'),
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y', `output.${format}`,
      ];

    case 'video-to-gif':
      return [
        '-i', input.name,
        '-vf', `fps=${num(settings, 'fps', 10)},scale=${num(settings, 'width', 320)}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        '-y', `output.${format}`,
      ];

    case 'gif-to-video':
      return [
        '-i', input.name,
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-y', `output.${format}`,
      ];

    case 'resize-video':
      return [
        '-i', input.name,
        '-vf', `scale=${num(settings, 'width', 1280)}:${num(settings, 'height', 720)}`,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y', `output.${format}`,
      ];

    case 'crop-video':
      return [
        '-i', input.name,
        '-vf', `crop=${num(settings, 'w', 640)}:${num(settings, 'h', 480)}:${num(settings, 'x', 0)}:${num(settings, 'y', 0)}`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y', `output.${format}`,
      ];

    case 'change-fps':
      return [
        '-i', input.name,
        '-filter:v', `fps=${num(settings, 'fps', 30)}`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y', `output.${format}`,
      ];

    case 'mute-video':
      return [
        '-i', input.name,
        '-an',
        '-c:v', 'copy',
        '-y', `output.${format}`,
      ];

    case 'extract-audio': {
      const outFormat = str(settings, 'format', 'mp3');
      const args = ['-i', input.name, '-vn'];
      if (outFormat === 'mp3') args.push('-c:a', 'libmp3lame');
      else if (outFormat === 'aac' || outFormat === 'm4a') args.push('-c:a', 'aac');
      else if (outFormat === 'ogg') args.push('-c:a', 'libvorbis');
      else if (outFormat === 'flac') args.push('-c:a', 'flac');
      else args.push('-c:a', 'copy');
      args.push('-y', `output.${outFormat}`);
      return args;
    }

    /* ── Resolution conversion ───────────────── */
    case 'resolution-convert': {
      const w = tool.presetWidth ?? num(settings, 'width', 1920);
      const h = tool.presetHeight ?? num(settings, 'height', 1080);
      const isLarge = w >= 2560 || h >= 1440;
      return [
        '-i', input.name,
        '-vf', `scale=${w}:${h}`,
        '-c:v', 'libx264',
        '-preset', isLarge ? 'ultrafast' : 'veryfast',
        '-crf', isLarge ? '23' : '20',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y', `output.${format}`,
      ];
    }

    /* ── Fallback ────────────────────────────── */
    default:
      return ['-i', input.name, '-y', `output.${format}`];
  }
}