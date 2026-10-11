import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import {
  getToolBySlug,
  isFileSafeForTool,
  detectPlatform,
  type PlatformInfo,
  type Tool,
} from './tools';

/* ========================================================================== */
/* 1. PLATFORM STATE                                                          */
/* ========================================================================== */

export const PLATFORM: PlatformInfo = detectPlatform();

const NATIVE_ENGINE_IMPLEMENTED = false;

function isNativeActive(): boolean {
  return PLATFORM.engine === 'native' && NATIVE_ENGINE_IMPLEMENTED;
}

/* ========================================================================== */
/* 2. GLOBAL STATE                                                            */
/* ========================================================================== */

let ffmpeg: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;
let operationQueue: Promise<void> = Promise.resolve();

/* ========================================================================== */
/* 3. MIME TYPES                                                              */
/* ========================================================================== */

function getMimeType(format: string): string {
  const ext = format.toLowerCase().replace(/^\./, '');
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    opus: 'audio/ogg; codecs=opus',
    flac: 'audio/flac',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    gif: 'image/gif',
    png: 'image/png',
    txt: 'text/plain',
    bin: 'application/octet-stream',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/* ========================================================================== */
/* 4. HELPERS                                                                 */
/* ========================================================================== */

function normalizeFormat(format: string): string {
  return format.toLowerCase().replace(/^\./, '').trim();
}

function getExtension(filename: string, fallback = 'bin'): string {
  const cleanName = filename.split(/[?#]/)[0];
  const parts = cleanName.split('.');
  if (parts.length < 2) return fallback;
  const extension = parts.pop()?.toLowerCase().trim();
  return extension || fallback;
}

function makeName(prefix: string, extension: string): string {
  let random: string;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    random = crypto.randomUUID();
  } else {
    random = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return `${prefix}-${random}.${extension}`;
}

async function deleteFile(ff: FFmpeg, filename: string): Promise<void> {
  try {
    await ff.deleteFile(filename);
  } catch {
    /* ignore */
  }
}

function ensureEven(value: number): number {
  const rounded = Math.floor(Math.abs(value));
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

function validateResolution(width: number, height: number): string | null {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return 'Resolution dimensions must be valid numbers.';
  }
  if (width < 16 || height < 16) {
    return 'Resolution must be at least 16×16 pixels.';
  }
  if (width > 7680 || height > 4320) {
    return 'Maximum supported resolution is 8K (7680×4320).';
  }
  if (width * height > 7680 * 4320) {
    return 'Resolution exceeds 8K limits.';
  }
  return null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s.`));
    }, ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

/**
 * Pick the correct PCM codec for a WAV output at the requested bit depth.
 */
function codecForBitDepth(bitDepth: number): string {
  if (bitDepth === 24) return 'pcm_s24le';
  if (bitDepth === 32) return 'pcm_s32le';
  return 'pcm_s16le';
}

/* ========================================================================== */
/* 5. PER-TOOL FILE SIZE VALIDATION                                           */
/* ========================================================================== */

function checkFileSize(file: File, toolSlug: string): Tool {
  const tool = getToolBySlug(toolSlug);

  if (!tool) {
    const maxMB = PLATFORM.maxMB || 200;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxMB) {
      throw new Error(
        `File too large (${sizeMB.toFixed(1)}MB). Limit for ${PLATFORM.label} is ${maxMB}MB.`,
      );
    }
    return {
      slug: toolSlug, name: toolSlug, category: 'video-utility',
      description: '', metaTitle: '', metaDescription: '', icon: '',
      faq: [], howTo: [], relatedTools: [],
      webMaxMB: maxMB,
    } as Tool;
  }

  const sizeMB = file.size / (1024 * 1024);
  const native = isNativeActive();

  if (!isFileSafeForTool(tool, sizeMB, native)) {
    const limit = native ? 5000 : (tool.webMaxMB ?? 250);
    const appAdvice = native
      ? 'This file exceeds even the app limit — try splitting it into parts.'
      : `For files up to 5 GB, install the Dayront ${
          PLATFORM.type === 'mobile-web' ? 'Mobile' : 'Desktop'
        } App.`;

    throw new Error(
      `${tool.name}: file too large (${sizeMB.toFixed(1)} MB). ` +
      `${PLATFORM.label} limit is ${limit} MB. ${appAdvice}`,
    );
  }

  return tool;
}

/* ========================================================================== */
/* 5b. FILE KIND DETECTION (magic-byte sniffing)                              */
/* ========================================================================== */

export type FileKind = 'audio' | 'video' | 'image' | 'unknown';

interface SniffResult {
  kind: FileKind;
  format: string | null;
}

async function readMagicBytes(file: File, byteCount = 32): Promise<Uint8Array> {
  const slice = file.slice(0, byteCount);
  const buf = await slice.arrayBuffer();
  return new Uint8Array(buf);
}

function matches(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) return false;
  }
  return true;
}

async function sniffFile(file: File): Promise<SniffResult> {
  let bytes: Uint8Array;
  try {
    bytes = await readMagicBytes(file, 32);
  } catch {
    return { kind: 'unknown', format: null };
  }

  if (matches(bytes, [0x49, 0x44, 0x33])) return { kind: 'audio', format: 'MP3' };
  if (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) return { kind: 'audio', format: 'MP3/AAC' };
  if (matches(bytes, [0x66, 0x4C, 0x61, 0x43])) return { kind: 'audio', format: 'FLAC' };
  if (matches(bytes, [0x4F, 0x67, 0x67, 0x53])) return { kind: 'audio', format: 'OGG/Opus' };
  if (matches(bytes, [0x23, 0x21, 0x41, 0x4D, 0x52])) return { kind: 'audio', format: 'AMR' };
  if (matches(bytes, [0x4D, 0x41, 0x43, 0x20])) return { kind: 'audio', format: 'APE' };

  if (matches(bytes, [0x52, 0x49, 0x46, 0x46])) {
    if (matches(bytes, [0x57, 0x41, 0x56, 0x45], 8)) return { kind: 'audio', format: 'WAV' };
    if (matches(bytes, [0x41, 0x56, 0x49, 0x20], 8)) return { kind: 'video', format: 'AVI' };
    if (matches(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return { kind: 'image', format: 'WebP' };
    return { kind: 'unknown', format: 'RIFF container' };
  }

  if (bytes.length >= 12 && matches(bytes, [0x66, 0x74, 0x79, 0x70], 4)) {
    if (file.type === 'audio/mp4' || file.type === 'audio/x-m4a') {
      return { kind: 'audio', format: 'M4A' };
    }
    const ext = getExtension(file.name);
    if (ext === 'm4a' || ext === 'm4b' || ext === 'm4r') {
      return { kind: 'audio', format: 'M4A' };
    }
    return { kind: 'video', format: 'MP4/MOV' };
  }

  if (matches(bytes, [0x1A, 0x45, 0xDF, 0xA3])) return { kind: 'video', format: 'MKV/WebM' };
  if (matches(bytes, [0x46, 0x4C, 0x56, 0x01])) return { kind: 'video', format: 'FLV' };

  if (matches(bytes, [0xFF, 0xD8, 0xFF])) return { kind: 'image', format: 'JPEG' };
  if (matches(bytes, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) return { kind: 'image', format: 'PNG' };
  if (matches(bytes, [0x47, 0x49, 0x46, 0x38])) return { kind: 'image', format: 'GIF' };
  if (matches(bytes, [0x42, 0x4D])) return { kind: 'image', format: 'BMP' };

  if (matches(bytes, [0x25, 0x50, 0x44, 0x46])) return { kind: 'unknown', format: 'PDF document' };
  if (matches(bytes, [0x50, 0x4B, 0x03, 0x04])) return { kind: 'unknown', format: 'ZIP archive' };
  if (matches(bytes, [0x1F, 0x8B])) return { kind: 'unknown', format: 'GZIP archive' };
  if (matches(bytes, [0x52, 0x61, 0x72, 0x21])) return { kind: 'unknown', format: 'RAR archive' };
  if (matches(bytes, [0x37, 0x7A, 0xBC, 0xAF])) return { kind: 'unknown', format: '7-Zip archive' };
  if (matches(bytes, [0x4D, 0x5A])) return { kind: 'unknown', format: 'Windows executable' };
  if (matches(bytes, [0x7F, 0x45, 0x4C, 0x46])) return { kind: 'unknown', format: 'Linux executable' };

  return { kind: 'unknown', format: null };
}

function mimeKindFrom(mime: string): FileKind | null {
  if (!mime) return null;
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  return null;
}

const AUDIO_EXTS = new Set([
  'mp3', 'wav', 'm4a', 'm4b', 'm4r', 'aac', 'ogg', 'oga', 'opus',
  'flac', 'aiff', 'aif', 'amr', 'ape',
]);

const VIDEO_EXTS = new Set([
  'mp4', 'mov', 'm4v', 'mkv', 'avi', 'webm', 'flv', 'mpeg', 'mpg', 'wmv', '3gp',
]);

const IMAGE_EXTS = new Set([
  'gif', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'tif', 'heic',
]);

function kindForExtension(ext: string): FileKind | null {
  const e = ext.toLowerCase();
  if (AUDIO_EXTS.has(e)) return 'audio';
  if (VIDEO_EXTS.has(e)) return 'video';
  if (IMAGE_EXTS.has(e)) return 'image';
  return null;
}

const TYPE_ACCEPTS: Record<string, FileKind[]> = {
  // Audio-only utilities
  'cut': ['audio'],
  'merge': ['audio'],
  'compress': ['audio'],
  'boost': ['audio'],
  'speed': ['audio'],
  'reverse': ['audio'],
  'stereo-to-mono': ['audio'],

  // New audio production — audio only
  'dynamic-compress': ['audio'],
  'gate': ['audio'],
  'limit': ['audio'],
  'silence-remove': ['audio'],
  'equalize': ['audio'],
  'resample': ['audio'],
  'channels': ['audio'],
  'crossfade': ['audio'],
  'reverb': ['audio'],
  'karaoke': ['audio'],

  // Accept audio OR video (video stream copied)
  'denoise': ['audio', 'video'],
  'fade': ['audio', 'video'],
  'normalize': ['audio', 'video'],
  'dehum': ['audio', 'video'],
  'ringtone': ['audio', 'video'],
  'loudness-meter': ['audio', 'video'],

  // Video-only utilities
  'video-cut': ['video'],
  'video-merge': ['video'],
  'video-compress': ['video'],
  'video-to-gif': ['video'],
  'gif-to-video': ['image'],
  'resize-video': ['video'],
  'crop-video': ['video'],
  'change-fps': ['video'],
  'mute-video': ['video'],
  'extract-audio': ['video'],
  'resolution-convert': ['video'],
  'convert-video': ['video'],

  // AI
  'ai-captions': ['video'],
  'ai-remove-bg': ['video', 'image'],
  'ai-photo-editor': ['image'],
  'burn-subtitles': ['video'],
};

function getExpectedKinds(tool: Tool): FileKind[] | null {
  if (tool.from) {
    const kind = kindForExtension(tool.from);
    if (kind) return [kind];
  }
  if (tool.type && TYPE_ACCEPTS[tool.type]) {
    return TYPE_ACCEPTS[tool.type];
  }
  return null;
}

async function assertFileKind(file: File, tool: Tool): Promise<void> {
  const expected = getExpectedKinds(tool);
  if (!expected || expected.length === 0) return;

  const { kind: magicKind, format: magicFormat } = await sniffFile(file);
  const mimeKind = mimeKindFrom(file.type);

  if (mimeKind && expected.includes(mimeKind)) return;
  if (magicKind !== 'unknown' && expected.includes(magicKind)) return;

  const actual = magicKind !== 'unknown' ? magicKind : mimeKind;
  if (actual && actual !== 'unknown') {
    const expectedLabel = expected.join(' or ');
    const actualLabel = magicFormat
      ? magicFormat
      : actual === 'audio' ? 'an audio file'
      : actual === 'video' ? 'a video file'
      : actual === 'image' ? 'an image file'
      : 'a file';
    throw new Error(
      `${tool.name} only accepts ${expectedLabel} files. "${file.name}" is ${actualLabel}.`,
    );
  }

  console.warn(
    `[validate] Could not determine kind of "${file.name}" (MIME: ${file.type || 'none'}). Passing through.`,
  );
}

/* ========================================================================== */
/* 5c. PUBLIC VALIDATORS                                                      */
/* ========================================================================== */

async function validateInputFile(file: File, toolSlug: string): Promise<Tool> {
  if (!file || file.size === 0) {
    throw new Error('Please select a valid file.');
  }
  const tool = checkFileSize(file, toolSlug);
  await assertFileKind(file, tool);
  return tool;
}

async function validateInputFiles(files: File[], toolSlug: string): Promise<Tool> {
  if (files.length === 0) throw new Error('No files provided.');

  const tool = checkFileSize(files[0], toolSlug);
  await assertFileKind(files[0], tool);

  for (let i = 1; i < files.length; i++) {
    checkFileSize(files[i], toolSlug);
    await assertFileKind(files[i], tool);
  }

  const native = isNativeActive();
  const singleLimit = native ? 5000 : (tool.webMaxMB ?? 250);
  const totalLimit = singleLimit * 1.5;
  const totalMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);

  if (totalMB > totalLimit) {
    throw new Error(
      `Combined size too large (${totalMB.toFixed(1)} MB). ` +
      `${tool.name} needs a total under ${Math.round(totalLimit)} MB on ${PLATFORM.label}.`,
    );
  }

  return tool;
}

/* ========================================================================== */
/* 6. FRIENDLY ERROR TRANSLATION                                              */
/* ========================================================================== */

function translateFFmpegError(error: unknown, toolSlug?: string): Error {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  const tool = toolSlug ? getToolBySlug(toolSlug) : undefined;
  const toolName = tool?.name ?? 'This tool';

  if (
    lower.includes('fs error') ||
    lower.includes('enomem') ||
    lower.includes('out of memory') ||
    lower.includes('cannot allocate') ||
    lower.includes('memory access out of bounds') ||
    lower.includes('array buffer allocation failed')
  ) {
    const advice =
      PLATFORM.type === 'mobile-web'
        ? 'Mobile browsers have strict memory limits. Close other tabs, try a smaller file, or install the Dayront Mobile App for unlimited processing.'
        : 'Your device ran out of memory. Try a smaller file, reduce resolution, or restart your browser.';
    return new Error(`${toolName}: not enough memory. ${advice}`);
  }

  if (lower.includes('timed out') || lower.includes('aborted')) {
    return new Error(
      `${toolName}: processing took too long. Try a smaller file or a faster connection.`,
    );
  }

  if (
    lower.includes('invalid data') ||
    lower.includes('decoder not found') ||
    lower.includes('unknown codec') ||
    lower.includes('codec not supported')
  ) {
    return new Error(
      `${toolName}: this file uses a codec we cannot process in the browser. Try converting it with a desktop tool first.`,
    );
  }

  return error instanceof Error ? error : new Error(msg);
}

/* ========================================================================== */
/* 7. FFmpeg LOADER — multi-CDN, mobile-friendly                              */
/* ========================================================================== */

const CORE_VERSION = '0.12.6';

const CDN_BASES: string[] = [
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`,
  `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`,
  `https://esm.sh/@ffmpeg/core@${CORE_VERSION}/dist/esm`,
];

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
}

const TIMEOUTS = {
  coreJs: 60_000,
  wasm: isMobileDevice() ? 300_000 : 180_000,
  init: isMobileDevice() ? 180_000 : 90_000,
};

async function loadFromCDN(baseUrl: string, instance: FFmpeg): Promise<void> {
  console.log(`[FFmpeg] Trying CDN: ${baseUrl}`);

  const coreURL = await withTimeout(
    toBlobURL(`${baseUrl}/ffmpeg-core.js`, 'text/javascript'),
    TIMEOUTS.coreJs,
    'ffmpeg-core.js download',
  );
  console.log('[FFmpeg] ✅ ffmpeg-core.js downloaded');

  const wasmURL = await withTimeout(
    toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, 'application/wasm'),
    TIMEOUTS.wasm,
    'ffmpeg-core.wasm download (~30MB — slower on mobile)',
  );
  console.log('[FFmpeg] ✅ ffmpeg-core.wasm downloaded — initializing runtime…');

  await withTimeout(
    instance.load({ coreURL, wasmURL }),
    TIMEOUTS.init,
    'FFmpeg runtime initialization',
  );

  console.log(`[FFmpeg] ✅ Fully loaded from ${baseUrl}`);
}

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  if (typeof window === 'undefined') {
    throw new Error('FFmpeg can only run in the browser.');
  }
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const instance = new FFmpeg();

    instance.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    let lastError: Error | null = null;

    for (const baseUrl of CDN_BASES) {
      try {
        await loadFromCDN(baseUrl, instance);
        ffmpeg = instance;
        return instance;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[FFmpeg] ❌ CDN failed (${baseUrl}):`, lastError.message);
      }
    }

    ffmpeg = null;

    if (isMobileDevice()) {
      throw new Error(
        `FFmpeg couldn't load on this device. Mobile browsers often struggle with the ~30MB WASM download needed for in-browser video processing. ` +
        `Try a Wi-Fi connection, keep the tab open, or use the Dayront Mobile App for offline, unlimited processing.`,
      );
    }

    throw new Error(
      `FFmpeg failed to load from all CDNs. Last error: ${lastError?.message || 'Unknown'}. ` +
      `Please check your internet connection and try again.`,
    );
  })().finally(() => {
    loadingPromise = null;
  });

  return loadingPromise;
}

/* ========================================================================== */
/* 8. SERIALIZED EXECUTION                                                    */
/* ========================================================================== */

async function execute(
  args: string[],
  onProgress?: (percent: number) => void,
  toolSlug?: string,
): Promise<FFmpeg> {
  let result: FFmpeg | null = null;
  let failure: unknown = null;

  const job = operationQueue.then(async () => {
    const ff = await getFFmpeg();
    const progressHandler = ({ progress }: { progress: number }) => {
      const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
      onProgress?.(percent);
    };
    if (onProgress) ff.on('progress', progressHandler);
    try {
      await ff.exec(args);
      onProgress?.(100);
      result = ff;
    } catch (error) {
      failure = translateFFmpegError(error, toolSlug);
    } finally {
      if (onProgress) ff.off('progress', progressHandler);
    }
  });

  operationQueue = job.then(() => undefined, () => undefined);
  await job;
  if (failure) throw failure;
  if (!result) throw new Error('FFmpeg execution failed.');
  return result;
}

/**
 * Same as `execute()` but also collects FFmpeg's log lines.
 * Used by the loudness meter, which parses `ebur128` output.
 */
async function executeCapture(
  args: string[],
  onProgress?: (percent: number) => void,
  toolSlug?: string,
): Promise<{ ff: FFmpeg; logs: string[] }> {
  const logs: string[] = [];
  let result: FFmpeg | null = null;
  let failure: unknown = null;

  const job = operationQueue.then(async () => {
    const ff = await getFFmpeg();

    const logHandler = ({ message }: { message: string }) => {
      logs.push(message);
    };
    ff.on('log', logHandler);

    const progressHandler = ({ progress }: { progress: number }) => {
      const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
      onProgress?.(percent);
    };
    if (onProgress) ff.on('progress', progressHandler);

    try {
      await ff.exec(args);
      onProgress?.(100);
      result = ff;
    } catch (error) {
      failure = translateFFmpegError(error, toolSlug);
    } finally {
      ff.off('log', logHandler);
      if (onProgress) ff.off('progress', progressHandler);
    }
  });

  operationQueue = job.then(() => undefined, () => undefined);
  await job;
  if (failure) throw failure;
  if (!result) throw new Error('FFmpeg execution failed.');
  return { ff: result, logs };
}

async function readBlob(ff: FFmpeg, filename: string, format: string): Promise<Blob> {
  const data = await ff.readFile(filename);
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return new Blob([bytes as BlobPart], { type: getMimeType(format) });
}

/* ========================================================================== */
/* 9. AUDIO FUNCTIONS                                                         */
/* ========================================================================== */

export async function convertFile(
  inputFile: File,
  outputFormat: string,
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
  bitrate?: string,
  toolSlug?: string,
): Promise<Blob> {
  if (!inputFile || inputFile.size === 0) throw new Error('Please select a valid media file.');
  const format = normalizeFormat(outputFormat);
  if (!format) throw new Error('Output format is required.');

  const inferredSlug = toolSlug ?? `${getExtension(inputFile.name)}-to-${format}`;
  await validateInputFile(inputFile, inferredSlug);

  const ff = await getFFmpeg();
  const inName = makeName('input', getExtension(inputFile.name));
  const outName = makeName('output', format);
  try {
    await ff.writeFile(inName, await fetchFile(inputFile));
    const args = ['-i', inName];
    if (bitrate && (format === 'mp3' || format === 'aac')) {
      args.push('-b:a', bitrate);
    }
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, inferredSlug);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function cutAudio(
  file: File,
  startSec: number,
  durationSec: number,
  outputFormat = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!Number.isFinite(startSec) || startSec < 0) throw new Error('Start time cannot be negative.');
  if (!Number.isFinite(durationSec) || durationSec <= 0) throw new Error('Duration must be greater than zero.');
  await validateInputFile(file, 'audio-cutter');

  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('cut-input', getExtension(file.name));
  const outName = makeName('cut-output', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-ss', String(startSec), '-i', inName, '-t', String(durationSec), '-c', 'copy'];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'audio-cutter');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function mergeAudio(
  files: File[],
  outputFormat = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!files.length) throw new Error('No audio files were provided.');
  await validateInputFiles(files, 'audio-merger');

  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inputs: string[] = [];
  const ts = Date.now();
  try {
    for (let i = 0; i < files.length; i++) {
      const name = makeName(`merge-${ts}-${i}`, getExtension(files[i].name));
      await ff.writeFile(name, await fetchFile(files[i]));
      inputs.push(name);
    }
    const outName = makeName('merged', format);
    const filterInputs = inputs.map((_, idx) => `[${idx}:a]`).join('');
    const concatFilter = `${filterInputs}concat=n=${inputs.length}:v=0:a=1[out]`;
    const args = [...inputs.flatMap(n => ['-i', n]), '-filter_complex', concatFilter, '-map', '[out]'];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'audio-merger');
    return await readBlob(ff, outName, format);
  } finally {
    for (const inp of inputs) await deleteFile(ff, inp);
  }
}

export async function compressAudio(
  file: File,
  quality = 3,
  outputFormat = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  await validateInputFile(file, 'audio-compressor');
  const format = normalizeFormat(outputFormat);
  const safeQuality = Math.max(0, Math.min(9, Math.round(quality)));
  const ff = await getFFmpeg();
  const inName = makeName('compress-input', getExtension(file.name));
  const outName = makeName('compressed', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-c:a', 'libmp3lame', '-q:a', String(safeQuality)];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'audio-compressor');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function boostVolume(
  file: File,
  gainDb = 6,
  outputFormat = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!Number.isFinite(gainDb)) throw new Error('Volume gain must be a valid number.');
  await validateInputFile(file, 'volume-booster');

  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('volume-input', getExtension(file.name));
  const outName = makeName('boosted', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-af', `volume=${gainDb}dB`];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'volume-booster');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function changeSpeed(
  file: File,
  factor = 1.5,
  outputFormat = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!Number.isFinite(factor) || factor <= 0) throw new Error('Speed factor must be greater than zero.');
  await validateInputFile(file, 'speed-changer');

  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('speed-input', getExtension(file.name));
  const outName = makeName('speed-output', format);
  try {
    let remaining = factor;
    const filters: string[] = [];
    while (remaining > 2) { filters.push('atempo=2'); remaining /= 2; }
    while (remaining < 0.5) { filters.push('atempo=0.5'); remaining /= 0.5; }
    filters.push(`atempo=${remaining}`);
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-filter:a', filters.join(',')];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'speed-changer');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function reverseAudio(
  file: File,
  outputFormat = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  await validateInputFile(file, 'reverse-audio');
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('reverse-input', getExtension(file.name));
  const outName = makeName('reversed', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-af', 'areverse'];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'reverse-audio');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function stereoToMono(
  file: File,
  outputFormat = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  await validateInputFile(file, 'stereo-to-mono');
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('mono-input', getExtension(file.name));
  const outName = makeName('mono-output', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-ac', '1'];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'stereo-to-mono');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9b. AUDIO DENOISE                                                          */
/* ========================================================================== */

const DENOISE_STRENGTH_TO_NR: Record<string, number> = {
  light: 6,
  balanced: 12,
  strong: 20,
  aggressive: 30,
};

const VIDEO_INPUT_EXTENSIONS = new Set([
  'mp4', 'm4v', 'mov', 'mkv', 'avi', 'webm', 'flv',
]);

export async function denoiseAudio(
  inputFile: File,
  strength: string = 'balanced',
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!inputFile || inputFile.size === 0) {
    throw new Error('Please select a valid audio or video file.');
  }

  const nr = DENOISE_STRENGTH_TO_NR[strength] ?? DENOISE_STRENGTH_TO_NR.balanced;
  const inputExt = getExtension(inputFile.name);

  const isVideoInput =
    inputFile.type.startsWith('video/') ||
    VIDEO_INPUT_EXTENSIONS.has(inputExt);

  const format = isVideoInput
    ? (inputExt || 'mp4')
    : normalizeFormat(outputFormat);

  await validateInputFile(inputFile, 'audio-denoise');

  const ff = await getFFmpeg();
  const inName = makeName('denoise-in', inputExt);
  const outName = makeName('denoise-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(inputFile));

    const args: string[] = [
      '-i', inName,
      '-af', `afftdn=nr=${nr}:nf=-40`,
    ];

    if (isVideoInput) {
      args.push('-c:v', 'copy');
      args.push('-c:a', 'aac', '-b:a', '192k');
    } else if (format === 'mp3') {
      args.push('-c:a', 'libmp3lame', '-b:a', '192k');
    } else if (format === 'aac' || format === 'm4a') {
      args.push('-c:a', 'aac', '-b:a', '192k');
    } else if (format === 'ogg' || format === 'opus') {
      args.push('-c:a', 'libvorbis', '-q:a', '5');
    } else if (format === 'flac') {
      args.push('-c:a', 'flac');
    } else if (format === 'wav') {
      args.push('-c:a', 'pcm_s16le');
    }

    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-denoise');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9c. AUDIO FADE                                                             */
/* ========================================================================== */

export async function fadeAudio(
  file: File,
  fadeInSec: number = 0,
  fadeOutSec: number = 0,
  curve: string = 'tri',
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!file || file.size === 0) {
    throw new Error('Please select a valid audio or video file.');
  }
  if (!Number.isFinite(fadeInSec) || !Number.isFinite(fadeOutSec)) {
    throw new Error('Fade durations must be valid numbers.');
  }
  if (fadeInSec < 0 || fadeOutSec < 0) {
    throw new Error('Fade durations cannot be negative.');
  }
  if (fadeInSec === 0 && fadeOutSec === 0) {
    throw new Error('Set at least one fade duration.');
  }

  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'audio-fade');

  const ff = await getFFmpeg();
  const inName = makeName('fade-in', getExtension(file.name));
  const outName = makeName('fade-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));

    const filters: string[] = [];
    if (fadeInSec > 0) {
      filters.push(`afade=t=in:st=0:d=${fadeInSec}:curve=${curve}`);
    }
    if (fadeOutSec > 0) {
      filters.push(`afade=t=out:st=-${fadeOutSec}:d=${fadeOutSec}:curve=${curve}`);
    }

    const args: string[] = [
      '-i', inName,
      '-af', filters.join(','),
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-fade');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9d. LOUDNESS NORMALISER                                                    */
/* ========================================================================== */

export async function normalizeLoudness(
  file: File,
  targetLufs: number = -14,
  truePeakDb: number = -1.5,
  lra: number = 11,
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!file || file.size === 0) {
    throw new Error('Please select a valid audio or video file.');
  }
  if (!Number.isFinite(targetLufs) || targetLufs < -70 || targetLufs > -5) {
    throw new Error('Target loudness must be between -70 and -5 LUFS.');
  }
  if (!Number.isFinite(truePeakDb) || truePeakDb > 0 || truePeakDb < -20) {
    throw new Error('True peak limit must be between -20 and 0 dBTP.');
  }
  if (!Number.isFinite(lra) || lra < 1 || lra > 50) {
    throw new Error('Loudness range (LRA) must be between 1 and 50 LU.');
  }

  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'audio-normalize');

  const ff = await getFFmpeg();
  const inName = makeName('norm-in', getExtension(file.name));
  const outName = makeName('norm-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));

    const args: string[] = [
      '-i', inName,
      '-af', `loudnorm=I=${targetLufs}:TP=${truePeakDb}:LRA=${lra}`,
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-normalize');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9e. DYNAMIC RANGE COMPRESSOR                                               */
/* ========================================================================== */

export async function dynamicCompressAudio(
  file: File,
  threshold: number = -20,
  ratio: number = 4,
  attack: number = 20,
  release: number = 250,
  makeup: number = 0,
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!Number.isFinite(threshold) || threshold < -60 || threshold > 0) {
    throw new Error('Threshold must be between -60 and 0 dB.');
  }
  if (!Number.isFinite(ratio) || ratio < 1 || ratio > 20) {
    throw new Error('Ratio must be between 1 and 20.');
  }
  if (!Number.isFinite(attack) || attack < 0.01 || attack > 2000) {
    throw new Error('Attack must be between 0.01 and 2000 ms.');
  }
  if (!Number.isFinite(release) || release < 0.01 || release > 9000) {
    throw new Error('Release must be between 0.01 and 9000 ms.');
  }
  if (!Number.isFinite(makeup) || makeup < 0 || makeup > 30) {
    throw new Error('Makeup gain must be between 0 and 30 dB.');
  }

  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'audio-dynamic-compress');

  const ff = await getFFmpeg();
  const inName = makeName('drc-in', getExtension(file.name));
  const outName = makeName('drc-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const filter =
      `acompressor=threshold=${threshold}dB:ratio=${ratio}:attack=${attack}:release=${release}:makeup=${makeup}`;
    const args = ['-i', inName, '-af', filter];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-dynamic-compress');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9f. NOISE GATE                                                             */
/* ========================================================================== */

export async function gateAudio(
  file: File,
  threshold: number = -50,
  ratio: number = 4,
  attack: number = 10,
  release: number = 200,
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!Number.isFinite(threshold) || threshold < -90 || threshold > 0) {
    throw new Error('Threshold must be between -90 and 0 dB.');
  }
  if (!Number.isFinite(ratio) || ratio < 1 || ratio > 9000) {
    throw new Error('Ratio must be between 1 and 9000.');
  }
  if (!Number.isFinite(attack) || attack < 0.01 || attack > 9000) {
    throw new Error('Attack must be between 0.01 and 9000 ms.');
  }
  if (!Number.isFinite(release) || release < 0.01 || release > 9000) {
    throw new Error('Release must be between 0.01 and 9000 ms.');
  }

  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'audio-gate');

  const ff = await getFFmpeg();
  const inName = makeName('gate-in', getExtension(file.name));
  const outName = makeName('gate-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const filter =
      `agate=threshold=${threshold}dB:ratio=${ratio}:attack=${attack}:release=${release}`;
    const args = ['-i', inName, '-af', filter];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-gate');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9g. PEAK LIMITER                                                           */
/* ========================================================================== */

export async function limitAudio(
  file: File,
  ceiling: number = -1,
  attack: number = 5,
  release: number = 50,
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!Number.isFinite(ceiling) || ceiling > 0 || ceiling < -20) {
    throw new Error('Ceiling must be between -20 and 0 dB.');
  }
  if (!Number.isFinite(attack) || attack < 0.1 || attack > 80) {
    throw new Error('Attack must be between 0.1 and 80 ms.');
  }
  if (!Number.isFinite(release) || release < 1 || release > 8000) {
    throw new Error('Release must be between 1 and 8000 ms.');
  }

  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'audio-limit');

  const ff = await getFFmpeg();
  const inName = makeName('limit-in', getExtension(file.name));
  const outName = makeName('limit-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const filter = `alimiter=limit=${ceiling}dB:attack=${attack}:release=${release}`;
    const args = ['-i', inName, '-af', filter];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-limit');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9h. SILENCE REMOVER                                                        */
/* ========================================================================== */

export async function removeSilence(
  file: File,
  threshold: number = -40,
  minSilence: number = 0.5,
  keepSilence: number = 0.1,
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!Number.isFinite(threshold) || threshold < -90 || threshold > 0) {
    throw new Error('Threshold must be between -90 and 0 dB.');
  }
  if (!Number.isFinite(minSilence) || minSilence < 0.1 || minSilence > 30) {
    throw new Error('Minimum silence must be between 0.1 and 30 seconds.');
  }
  if (!Number.isFinite(keepSilence) || keepSilence < 0 || keepSilence > 5) {
    throw new Error('Kept silence must be between 0 and 5 seconds.');
  }

  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'audio-silence-remove');

  const ff = await getFFmpeg();
  const inName = makeName('silence-in', getExtension(file.name));
  const outName = makeName('silence-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const filter =
      `silenceremove=stop_periods=-1:stop_duration=${minSilence}:stop_threshold=${threshold}dB:stop_silence=${keepSilence}`;
    const args = ['-i', inName, '-af', filter];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-silence-remove');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9i. EQUALISER                                                              */
/* ========================================================================== */

export async function equalizeAudio(
  file: File,
  bass: number = 0,
  mid: number = 0,
  treble: number = 0,
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const clamp = (v: number) => Math.max(-15, Math.min(15, Number.isFinite(v) ? v : 0));
  const b = clamp(bass);
  const m = clamp(mid);
  const t = clamp(treble);

  if (b === 0 && m === 0 && t === 0) {
    throw new Error('Set at least one EQ band.');
  }

  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'audio-equalize');

  const filters: string[] = [];
  if (b !== 0) filters.push(`bass=g=${b}`);
  if (m !== 0) filters.push(`equalizer=f=1000:width_type=o:width=2:g=${m}`);
  if (t !== 0) filters.push(`treble=g=${t}`);

  const ff = await getFFmpeg();
  const inName = makeName('eq-in', getExtension(file.name));
  const outName = makeName('eq-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-af', filters.join(',')];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-equalize');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9j. SAMPLE RATE CONVERTER                                                  */
/* ========================================================================== */

export async function resampleAudio(
  file: File,
  sampleRate: number = 48000,
  bitDepth: number = 16,
  outputFormat: string = 'wav',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const allowedRates = [8000, 16000, 22050, 32000, 44100, 48000, 88200, 96000, 176400, 192000];
  if (!allowedRates.includes(sampleRate)) {
    throw new Error(`Sample rate must be one of: ${allowedRates.join(', ')} Hz.`);
  }
  const allowedDepths = [16, 24, 32];
  if (!allowedDepths.includes(bitDepth)) {
    throw new Error('Bit depth must be 16, 24, or 32.');
  }

  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'audio-resample');

  const ff = await getFFmpeg();
  const inName = makeName('resample-in', getExtension(file.name));
  const outName = makeName('resample-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-ar', String(sampleRate)];
    if (format === 'wav') {
      args.push('-c:a', codecForBitDepth(bitDepth));
    } else if (format === 'flac') {
      args.push('-c:a', 'flac');
    } else if (format === 'mp3') {
      args.push('-c:a', 'libmp3lame', '-b:a', '320k');
    } else if (format === 'aac' || format === 'm4a') {
      args.push('-c:a', 'aac', '-b:a', '256k');
    }
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-resample');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9k. CHANNEL UTILITIES                                                      */
/* ========================================================================== */

type ChannelMode = 'stereo-to-mono' | 'mono-to-stereo' | 'swap-lr' | 'invert-phase' | 'left-only' | 'right-only';

const CHANNEL_FILTERS: Record<ChannelMode, { filter: string | null; ac: number }> = {
  'stereo-to-mono': { filter: null, ac: 1 },
  'mono-to-stereo': { filter: 'pan=stereo|c0=c0|c1=c0', ac: 2 },
  'swap-lr':        { filter: 'pan=stereo|c0=c1|c1=c0', ac: 2 },
  'invert-phase':   { filter: 'pan=stereo|c0=-1*c0|c1=-1*c1', ac: 2 },
  'left-only':      { filter: 'pan=mono|c0=c0', ac: 1 },
  'right-only':     { filter: 'pan=mono|c0=c1', ac: 1 },
};

export async function changeChannels(
  file: File,
  mode: ChannelMode | string = 'stereo-to-mono',
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const safeMode = (mode as ChannelMode) in CHANNEL_FILTERS ? (mode as ChannelMode) : 'stereo-to-mono';
  const { filter, ac } = CHANNEL_FILTERS[safeMode];

  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'audio-channels');

  const ff = await getFFmpeg();
  const inName = makeName('chan-in', getExtension(file.name));
  const outName = makeName('chan-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args: string[] = ['-i', inName];
    if (filter) args.push('-af', filter);
    args.push('-ac', String(ac));
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-channels');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9l. CROSSFADE                                                              */
/* ========================================================================== */

export async function crossfadeAudio(
  files: File[],
  duration: number = 1.5,
  curve: string = 'tri',
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (files.length !== 2) {
    throw new Error('Crossfade requires exactly 2 audio files.');
  }
  if (!Number.isFinite(duration) || duration < 0.1 || duration > 30) {
    throw new Error('Crossfade duration must be between 0.1 and 30 seconds.');
  }

  const format = normalizeFormat(outputFormat);
  await validateInputFiles(files, 'audio-crossfade');

  const ff = await getFFmpeg();
  const ts = Date.now();
  const in1 = makeName(`xfd-a-${ts}`, getExtension(files[0].name));
  const in2 = makeName(`xfd-b-${ts}`, getExtension(files[1].name));
  const outName = makeName('crossfaded', format);

  try {
    await ff.writeFile(in1, await fetchFile(files[0]));
    await ff.writeFile(in2, await fetchFile(files[1]));

    const args = [
      '-i', in1,
      '-i', in2,
      '-filter_complex', `acrossfade=d=${duration}:c1=${curve}:c2=${curve}`,
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-crossfade');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, in1);
    await deleteFile(ff, in2);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9m. DE-HUM                                                                */
/* ========================================================================== */

export async function dehumAudio(
  file: File,
  frequency: number = 50,
  harmonics: number = 3,
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (frequency !== 50 && frequency !== 60) {
    throw new Error('Hum frequency must be 50 or 60 Hz.');
  }
  if (!Number.isFinite(harmonics) || harmonics < 1 || harmonics > 6) {
    throw new Error('Harmonics count must be between 1 and 6.');
  }

  const inputExt = getExtension(file.name);
  const isVideoInput = inputExt && VIDEO_INPUT_EXTENSIONS.has(inputExt);
  const format = isVideoInput ? inputExt : normalizeFormat(outputFormat);

  await validateInputFile(file, 'audio-dehum');

  const filters: string[] = [];
  for (let i = 1; i <= harmonics; i++) {
    const f = frequency * i;
    if (f > 20000) break;
    filters.push(`bandreject=f=${f}:width_type=h:w=4`);
  }

  const ff = await getFFmpeg();
  const inName = makeName('dehum-in', inputExt);
  const outName = makeName('dehum-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args: string[] = ['-i', inName, '-af', filters.join(',')];
    if (isVideoInput) {
      args.push('-c:v', 'copy');
      args.push('-c:a', 'aac', '-b:a', '192k');
    }
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-dehum');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9n. REVERB / ECHO                                                          */
/* ========================================================================== */

export async function reverbAudio(
  file: File,
  delayMs: number = 100,
  decay: number = 0.5,
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!Number.isFinite(delayMs) || delayMs < 1 || delayMs > 2000) {
    throw new Error('Delay must be between 1 and 2000 ms.');
  }
  if (!Number.isFinite(decay) || decay < 0 || decay > 0.95) {
    throw new Error('Decay must be between 0 and 0.95.');
  }

  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'audio-reverb');

  const ff = await getFFmpeg();
  const inName = makeName('reverb-in', getExtension(file.name));
  const outName = makeName('reverb-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const filter = `aecho=0.8:0.9:${delayMs}:${decay}`;
    const args = ['-i', inName, '-af', filter];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-reverb');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9o. KARAOKE / VOCAL REMOVER                                                */
/* ========================================================================== */

export async function karaokeAudio(
  file: File,
  outputFormat: string = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'audio-karaoke');

  const ff = await getFFmpeg();
  const inName = makeName('karaoke-in', getExtension(file.name));
  const outName = makeName('karaoke-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const filter = 'pan=stereo|c0=c0-c1|c1=c1-c0';
    const args = ['-i', inName, '-af', filter];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'audio-karaoke');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9p. RINGTONE MAKER                                                         */
/* ========================================================================== */

export async function makeRingtone(
  file: File,
  start: number = 0,
  duration: number = 30,
  fadeIn: number = 0.5,
  fadeOut: number = 0.5,
  outputFormat: string = 'm4a',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (!Number.isFinite(start) || start < 0) {
    throw new Error('Start time cannot be negative.');
  }
  if (!Number.isFinite(duration) || duration < 1 || duration > 60) {
    throw new Error('Ringtone duration must be between 1 and 60 seconds.');
  }
  if (!Number.isFinite(fadeIn) || fadeIn < 0 || fadeIn > 10) {
    throw new Error('Fade in must be between 0 and 10 seconds.');
  }
  if (!Number.isFinite(fadeOut) || fadeOut < 0 || fadeOut > 10) {
    throw new Error('Fade out must be between 0 and 10 seconds.');
  }

  const format = normalizeFormat(outputFormat);
  await validateInputFile(file, 'ringtone-maker');

  const ff = await getFFmpeg();
  const inName = makeName('ringtone-in', getExtension(file.name));
  const outName = makeName('ringtone-out', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));

    const filters: string[] = ['-vn'];
    const aFilters: string[] = [];
    if (fadeIn > 0) aFilters.push(`afade=t=in:st=0:d=${fadeIn}`);
    if (fadeOut > 0) aFilters.push(`afade=t=out:st=-${fadeOut}:d=${fadeOut}`);
    if (aFilters.length > 0) filters.push('-af', aFilters.join(','));

    const args: string[] = [
      '-ss', String(start),
      '-i', inName,
      '-t', String(duration),
      ...filters,
    ];
    if (format === 'm4a' || format === 'aac') {
      args.push('-c:a', 'aac', '-b:a', '128k');
    } else if (format === 'mp3') {
      args.push('-c:a', 'libmp3lame', '-b:a', '192k');
    } else if (format === 'wav') {
      args.push('-c:a', 'pcm_s16le');
    }
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'ringtone-maker');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 9q. LOUDNESS METER                                                         */
/* ========================================================================== */

export interface LoudnessReading {
  integratedLufs: number;
  truePeakDb: number;
  loudnessRangeLu: number;
}

function parseLoudnessLogs(logs: string[]): LoudnessReading {
  const text = logs.join('\n');

  const iMatch = text.match(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/);
  const tpMatch = text.match(/Peak:\s*(-?\d+(?:\.\d+)?)\s*dBFS/);
  const lraMatch = text.match(/LRA:\s*(-?\d+(?:\.\d+)?)\s*LU/);

  if (!iMatch || !tpMatch || !lraMatch) {
    throw new Error(
      'Could not read loudness values from FFmpeg output. The file may be silent or unsupported.',
    );
  }

  return {
    integratedLufs: parseFloat(iMatch[1]),
    truePeakDb: parseFloat(tpMatch[1]),
    loudnessRangeLu: parseFloat(lraMatch[1]),
  };
}

export async function meterLoudness(
  file: File,
  onProgress?: (p: number) => void,
): Promise<LoudnessReading> {
  if (!file || file.size === 0) {
    throw new Error('Please select a valid audio or video file.');
  }

  await validateInputFile(file, 'loudness-meter');

  const ff = await getFFmpeg();
  const inName = makeName('meter-in', getExtension(file.name));

  try {
    await ff.writeFile(inName, await fetchFile(file));

    const args = [
      '-i', inName,
      '-af', 'ebur128=peak=true:framelog=quiet',
      '-f', 'null',
      '-',
    ];

    const { logs } = await executeCapture(args, onProgress, 'loudness-meter');
    return parseLoudnessLogs(logs);
  } finally {
    await deleteFile(ff, inName);
  }
}

/* ========================================================================== */
/* 10. VIDEO FUNCTIONS                                                        */
/* ========================================================================== */

export async function compressVideo(
  file: File,
  crf = 23,
  preset = 'medium',
  outputFormat = 'mp4',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  await validateInputFile(file, 'video-compressor');
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('vcompress-in', getExtension(file.name));
  const outName = makeName('vcompress-out', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = [
      '-i', inName,
      '-c:v', 'libx264',
      '-crf', String(crf),
      '-preset', preset,
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'video-compressor');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function cutVideo(
  file: File,
  startSec: number,
  durationSec: number,
  outputFormat = 'mp4',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  await validateInputFile(file, 'video-cutter');
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('vcut-in', getExtension(file.name));
  const outName = makeName('vcut-out', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-ss', String(startSec), '-i', inName, '-t', String(durationSec), '-c', 'copy'];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'video-cutter');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function mergeVideos(
  files: File[],
  outputFormat = 'mp4',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  if (files.length < 2) throw new Error('Need at least 2 videos to merge.');
  await validateInputFiles(files, 'video-merger');

  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const ts = Date.now();
  const inputNames: string[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const name = makeName(`vmerge-${ts}-${i}`, getExtension(files[i].name));
      await ff.writeFile(name, await fetchFile(files[i]));
      inputNames.push(name);
    }

    const outName = makeName('merged', format);

    const filterParts: string[] = [];
    for (let i = 0; i < inputNames.length; i++) {
      filterParts.push(`[${i}:v:0]`);
    }
    const filterComplex = `${filterParts.join('')}concat=n=${inputNames.length}:v=1:a=0 [outv]`;

    const args = [
      ...inputNames.flatMap(n => ['-i', n]),
      '-filter_complex', filterComplex,
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
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);

    await execute(args, onProgress, 'video-merger');
    return await readBlob(ff, outName, format);
  } finally {
    for (const inp of inputNames) await deleteFile(ff, inp);
  }
}

export async function videoToGif(
  file: File,
  fps = 10,
  width = 320,
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  await validateInputFile(file, 'video-to-gif');
  const ff = await getFFmpeg();
  const inName = makeName('vgif-in', getExtension(file.name));
  const paletteName = makeName('palette', 'png');
  const outName = makeName('vgif-out', 'gif');
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute([
      '-i', inName,
      '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`,
      '-y', paletteName,
    ], undefined, 'video-to-gif');
    const args = [
      '-i', inName,
      '-i', paletteName,
      '-lavfi', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'video-to-gif');
    return await readBlob(ff, outName, 'gif');
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, paletteName);
    await deleteFile(ff, outName);
  }
}

export async function gifToMp4(
  file: File,
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  await validateInputFile(file, 'gif-to-video');
  const ff = await getFFmpeg();
  const inName = makeName('gif-in', 'gif');
  const outName = makeName('gif-out', 'mp4');
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = [
      '-i', inName,
      '-movflags', 'faststart',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'gif-to-video');
    return await readBlob(ff, outName, 'mp4');
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function resizeVideo(
  file: File,
  width: number,
  height: number,
  outputFormat = 'mp4',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
  preset: string = 'ultrafast',
  crf: number = 23,
): Promise<Blob> {
  const validationError = validateResolution(width, height);
  if (validationError) throw new Error(validationError);
  await validateInputFile(file, 'resize-video');

  const safeWidth = ensureEven(width);
  const safeHeight = ensureEven(height);

  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('resize-in', getExtension(file.name));
  const outName = makeName('resized', format);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const scaleFilter = `scale=${safeWidth}:${safeHeight}`;
    const args = [
      '-i', inName,
      '-vf', scaleFilter,
      '-c:v', 'libx264',
      '-preset', preset,
      '-crf', String(crf),
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'resize-video');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function resolutionConvert(
  file: File,
  width: number,
  height: number,
  outputFormat = 'mp4',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const isLarge = width >= 2560 || height >= 1440;
  const preset = isLarge ? 'ultrafast' : 'veryfast';
  const crf = isLarge ? 23 : 20;

  await validateInputFile(file, 'resolution-convert');

  return resizeVideo(
    file, width, height, outputFormat, cleanMetadata, onProgress, preset, crf,
  );
}

export async function cropVideo(
  file: File,
  x: number, y: number, w: number, h: number,
  outputFormat = 'mp4',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  await validateInputFile(file, 'crop-video');
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('crop-in', getExtension(file.name));
  const outName = makeName('cropped', format);

  const safeW = ensureEven(w);
  const safeH = ensureEven(h);
  const safeX = ensureEven(x);
  const safeY = ensureEven(y);

  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = [
      '-i', inName,
      '-vf', `crop=${safeW}:${safeH}:${safeX}:${safeY}`,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'crop-video');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function changeFPS(
  file: File,
  fps: number,
  outputFormat = 'mp4',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  await validateInputFile(file, 'change-fps');
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('fps-in', getExtension(file.name));
  const outName = makeName('fps-out', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = [
      '-i', inName,
      '-filter:v', `fps=${fps}`,
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'change-fps');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function muteVideo(
  file: File,
  outputFormat = 'mp4',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  await validateInputFile(file, 'mute-video');
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('mute-in', getExtension(file.name));
  const outName = makeName('muted', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-an', '-c:v', 'copy'];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'mute-video');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

export async function extractAudio(
  file: File,
  outputFormat = 'mp3',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  await validateInputFile(file, 'extract-audio');
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('extract-in', getExtension(file.name));
  const outName = makeName('extracted', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-vn'];
    if (format === 'mp3') {
      args.push('-c:a', 'libmp3lame');
    } else if (format === 'aac' || format === 'm4a') {
      args.push('-c:a', 'aac');
    } else if (format === 'ogg') {
      args.push('-c:a', 'libvorbis');
    } else if (format === 'flac') {
      args.push('-c:a', 'flac');
    } else {
      args.push('-c:a', 'copy');
    }
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress, 'extract-audio');
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* 11. PUBLIC UTILITIES                                                       */
/* ========================================================================== */

export async function preloadFFmpeg(): Promise<void> {
  try {
    await getFFmpeg();
  } catch (err) {
    console.warn('[FFmpeg] Preload failed:', err);
  }
}

export function isFFmpegReady(): boolean {
  return ffmpeg !== null;
}

export async function resetFFmpeg(): Promise<void> {
  if (ffmpeg) {
    try { (ffmpeg as any).terminate?.(); } catch { /* ignore */ }
  }
  ffmpeg = null;
  loadingPromise = null;
  operationQueue = Promise.resolve();
}

export function getToolLimitInfo(toolSlug: string) {
  const tool = getToolBySlug(toolSlug);
  const native = isNativeActive();
  return {
    platform: PLATFORM,
    toolName: tool?.name ?? toolSlug,
    tier: tool?.tier ?? 'medium',
    limitMB: native ? 5000 : (tool?.webMaxMB ?? 250),
    recommendApp: !native && (tool?.recommendApp ?? false),
    webNote: tool?.webNote,
  };
}