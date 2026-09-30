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

/**
 * Flip to `true` once you've implemented the Capacitor/Tauri native bridge.
 * Until then, all size checks fall back to WASM limits even on native builds.
 */
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

/* ========================================================================== */
/* 5. PER-TOOL FILE SIZE VALIDATION                                           */
/* ========================================================================== */

/**
 * Validates a single file against the tool's platform-specific limit.
 * Throws a friendly error with app-install advice if the file is too big.
 */
function validateFileForTool(file: File, toolSlug: string): Tool {
  const tool = getToolBySlug(toolSlug);

  // If the tool isn't registered yet, allow it with a safe fallback limit.
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

/**
 * Validates the combined size of multiple files (for merge operations).
 * Merges need room for inputs + output, so we enforce a tighter total.
 */
function validateFilesForTool(files: File[], toolSlug: string): Tool {
  if (files.length === 0) throw new Error('No files provided.');

  // Check each file individually first
  const tool = validateFileForTool(files[0], toolSlug);
  for (let i = 1; i < files.length; i++) {
    validateFileForTool(files[i], toolSlug);
  }

  // Then check the combined total against 1.5× the single-file limit
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

  // Memory / FS errors — the main cause of mobile crashes
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

  // Timeouts
  if (lower.includes('timed out') || lower.includes('aborted')) {
    return new Error(
      `${toolName}: processing took too long. Try a smaller file or a faster connection.`,
    );
  }

  // Unsupported codec / bad input
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

  // Infer tool slug from in/out extensions if not given
  const inferredSlug = toolSlug ?? `${getExtension(inputFile.name)}-to-${format}`;
  validateFileForTool(inputFile, inferredSlug);

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
  validateFileForTool(file, 'audio-cutter');

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
  validateFilesForTool(files, 'audio-merger');

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
  validateFileForTool(file, 'audio-compressor');
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
  validateFileForTool(file, 'volume-booster');

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
  validateFileForTool(file, 'speed-changer');

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
  validateFileForTool(file, 'reverse-audio');
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
  validateFileForTool(file, 'stereo-to-mono');
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
  validateFileForTool(file, 'video-compressor');
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
  validateFileForTool(file, 'video-cutter');
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
  validateFilesForTool(files, 'video-merger');

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
  validateFileForTool(file, 'video-to-gif');
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
  validateFileForTool(file, 'gif-to-video');
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
  validateFileForTool(file, 'resize-video');

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

  // Resolution converters share the 'resolution-convert' entry for limits.
  // The specific slug (e.g. '1080p-to-4k') has its own limits in the registry,
  // but we don't know the source/target keys here — so use the generic entry.
  validateFileForTool(file, 'resolution-convert');

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
  validateFileForTool(file, 'crop-video');
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
  validateFileForTool(file, 'change-fps');
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
  validateFileForTool(file, 'mute-video');
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
  validateFileForTool(file, 'extract-audio');
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

/**
 * Preload FFmpeg proactively — call this when a tool page mounts so the
 * ~30MB WASM is downloaded in the background before the user picks a file.
 */
export async function preloadFFmpeg(): Promise<void> {
  try {
    await getFFmpeg();
  } catch (err) {
    console.warn('[FFmpeg] Preload failed:', err);
  }
}

/** Check whether FFmpeg is already loaded (for UI indicators). */
export function isFFmpegReady(): boolean {
  return ffmpeg !== null;
}

/** Manually reset the FFmpeg instance (useful for debugging). */
export async function resetFFmpeg(): Promise<void> {
  if (ffmpeg) {
    try { (ffmpeg as any).terminate?.(); } catch { /* ignore */ }
  }
  ffmpeg = null;
  loadingPromise = null;
  operationQueue = Promise.resolve();
}

/**
 * Return the currently active platform + the tool's effective web limit,
 * handy for UI hints like "Max file size on Web: 300MB".
 */
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