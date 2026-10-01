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

/* ── Multi-file tool registry ────────────────────────────── */

/** Tool types that accept multiple input files. */
const MULTI_FILE_TYPES = new Set(['merge', 'video-merge']);

export function isMultiFileTool(tool: RunnerTool): boolean {
  return MULTI_FILE_TYPES.has(tool.type ?? '');
}

/* ── Main dispatcher ─────────────────────────────────────── */

export async function runTool(tool: RunnerTool, opts: RunnerOptions): Promise<Blob> {
  const { files, settings, onProgress } = opts;
  const format = tool.outputFormat ?? 'mp3';

  if (!files.length) throw new Error('No input file selected.');

  /* ── Native fast path ───────────────────────────────────
     Fires only inside a Capacitor or Tauri shell where a real
     FFmpeg binary is available. On web, this branch is skipped
     and the code falls through to the WASM implementation. */
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
      console.warn(
        '[toolRunner] Native FFmpeg failed, falling back to WASM:',
        err,
      );
      // Fall through to the WASM branch below
    }
  }

  /* ── WASM fallback (web) ─────────────────────────────── */

  const file = files[0];

  const num = (k: string, fallback: number): number => {
    const v = settings[k];
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : fallback;
  };
  const str = (k: string, fallback: string): string => {
    const v = settings[k];
    return v === undefined || v === null ? fallback : String(v);
  };

  switch (tool.type) {
    /* ── Audio utilities ─────────────────────────── */
    case 'cut':
      return cutAudio(file, num('start', 0), num('duration', 30), format, false, onProgress);

    case 'merge':
      return mergeAudio(files, format, false, onProgress);

    case 'compress':
      return compressAudio(file, num('quality', 3), format, false, onProgress);

    case 'boost':
      return boostVolume(file, num('gain', 6), format, false, onProgress);

    case 'speed':
      return changeSpeed(file, num('factor', 1.5), format, false, onProgress);

    case 'reverse':
      return reverseAudio(file, format, false, onProgress);

    case 'stereo-to-mono':
      return stereoToMono(file, format, false, onProgress);

    /* ── Format conversion ───────────────────────── */
    case 'convert':
      return convertFile(file, format, false, onProgress, str('bitrate', '192k'));

    case 'convert-video':
      return convertFile(file, format, false, onProgress);

    /* ── Video utilities ─────────────────────────── */
    case 'video-cut':
      return cutVideo(file, num('start', 0), num('duration', 30), format, false, onProgress);

    case 'video-merge':
      return mergeVideos(files, format, false, onProgress);

    case 'video-compress':
      return compressVideo(file, num('crf', 23), str('preset', 'medium'), format, false, onProgress);

    case 'video-to-gif':
      return videoToGif(file, num('fps', 10), num('width', 320), false, onProgress);

    case 'gif-to-video':
      return gifToMp4(file, false, onProgress);

    case 'resize-video':
      return resizeVideo(file, num('width', 1280), num('height', 720), format, false, onProgress);

    case 'crop-video':
      return cropVideo(
        file,
        num('x', 0),
        num('y', 0),
        num('w', 640),
        num('h', 480),
        format,
        false,
        onProgress,
      );

    case 'change-fps':
      return changeFPS(file, num('fps', 30), format, false, onProgress);

    case 'mute-video':
      return muteVideo(file, format, false, onProgress);

    case 'extract-audio':
      return extractAudio(file, str('format', 'mp3'), false, onProgress);

    /* ── Resolution conversion ───────────────────── */
    case 'resolution-convert': {
      const w = tool.presetWidth ?? num('width', 1920);
      const h = tool.presetHeight ?? num('height', 1080);
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
 * Mirrors the WASM operations in src/core/ffmpeg.ts, but uses placeholder
 * input/output filenames — the native layer rewrites them to real paths
 * before invoking the FFmpeg binary.
 *
 * Always ends with `-y output.<format>`.
 */
export function buildNativeArgsFor(
  tool: RunnerTool,
  files: File[],
  settings: Record<string, string | number>,
  format: string,
): string[] {
  const input = files[0];

  const num = (k: string, fallback: number): number => {
    const v = settings[k];
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : fallback;
  };
  const str = (k: string, fallback: string): string => {
    const v = settings[k];
    return v === undefined || v === null ? fallback : String(v);
  };

  switch (tool.type) {
    /* ── Audio utilities ─────────────────────── */
    case 'cut':
      return [
        '-ss', String(num('start', 0)),
        '-i', input.name,
        '-t', String(num('duration', 30)),
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
        '-q:a', String(num('quality', 3)),
        '-y', `output.${format}`,
      ];

    case 'boost':
      return [
        '-i', input.name,
        '-af', `volume=${num('gain', 6)}dB`,
        '-y', `output.${format}`,
      ];

    case 'speed':
      return [
        '-i', input.name,
        '-filter:a', `atempo=${num('factor', 1.5)}`,
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
      const bitrate = str('bitrate', '');
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
        '-ss', String(num('start', 0)),
        '-i', input.name,
        '-t', String(num('duration', 30)),
        '-c', 'copy',
        '-y', `output.${format}`,
      ];

    case 'video-merge':
      return [
        ...files.flatMap((f) => ['-i', f.name]),
        '-filter_complex',
        `${files.map((_, i) => `[${i}:v:0]`).join('')}concat=n=${files.length}:v=1:a=0[outv]`,
        '-map', '[outv]',
        '-f', 'lavfi',
        '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-map', '1:a',
        '-shortest',
        '-movflags', '+faststart',
        '-y', `output.${format}`,
      ];

    case 'video-compress':
      return [
        '-i', input.name,
        '-c:v', 'libx264',
        '-crf', String(num('crf', 23)),
        '-preset', str('preset', 'medium'),
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y', `output.${format}`,
      ];

    case 'video-to-gif':
      return [
        '-i', input.name,
        '-vf', `fps=${num('fps', 10)},scale=${num('width', 320)}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
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
        '-vf', `scale=${num('width', 1280)}:${num('height', 720)}`,
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
        '-vf', `crop=${num('w', 640)}:${num('h', 480)}:${num('x', 0)}:${num('y', 0)}`,
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
        '-filter:v', `fps=${num('fps', 30)}`,
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
      const outFormat = str('format', 'mp3');
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
      const w = tool.presetWidth ?? num('width', 1920);
      const h = tool.presetHeight ?? num('height', 1080);
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