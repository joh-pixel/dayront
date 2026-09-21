import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;
let operationQueue: Promise<void> = Promise.resolve();

/* -------------------------------------------------------------------------- */
/* MIME TYPES                                                                 */
/* -------------------------------------------------------------------------- */

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
    bin: 'application/octet-stream',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

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
  try { await ff.deleteFile(filename); } catch {}
}

/**
 * H.264 requires even dimensions (width and height must be divisible by 2).
 * Rounds odd values down to the nearest even number.
 */
function ensureEven(value: number): number {
  const rounded = Math.floor(Math.abs(value));
  return rounded % 2 === 0 ? rounded : rounded - 1;
}

/**
 * Enforces sane limits for resolution conversion.
 * Returns an error message if the operation is likely to fail, or null if OK.
 */
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
  const totalPixels = width * height;
  if (totalPixels > 7680 * 4320) {
    return 'Resolution exceeds 8K limits.';
  }
  return null;
}

/** Wrap a promise with a timeout so it can't hang forever */
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

/* -------------------------------------------------------------------------- */
/* FFmpeg LOADER — mobile-friendly with extended timeouts                     */
/* -------------------------------------------------------------------------- */

const CORE_VERSION = '0.12.6';

/**
 * Multiple CDN bases to try in order. If one fails (blocked, slow, 404),
 * we fall back to the next. This dramatically improves reliability on
 * mobile networks where some CDNs may be blocked or rate-limited.
 */
const CDN_BASES: string[] = [
  `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/esm`,
  `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/esm`,
  `https://esm.sh/@ffmpeg/core@${CORE_VERSION}/dist/esm`,
];

/** Detect mobile devices — phones need longer timeouts for WASM init */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
}

/**
 * Timeouts are intentionally generous on mobile. Phones on 4G can take
 * 60-180 seconds to download + compile 30MB of WASM.
 * Desktop connections are much faster but we still allow headroom.
 */
const TIMEOUTS = {
  coreJs: 60_000,                                              // 1 min
  wasm: isMobileDevice() ? 300_000 : 180_000,                  // 5 min mobile / 3 min desktop
  init: isMobileDevice() ? 180_000 : 90_000,                   // 3 min mobile / 90s desktop
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

    // Detailed log output for debugging
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
        // Continue to next CDN
      }
    }

    ffmpeg = null;

    // ★ Mobile-friendly error message
    if (isMobileDevice()) {
      throw new Error(
        `FFmpeg couldn't load on this device. Mobile browsers often struggle with the 30MB WASM download needed for in-browser video processing. ` +
        `Try a Wi-Fi connection, keep the tab open, or use a desktop computer for large files.`
      );
    }

    throw new Error(
      `FFmpeg failed to load from all CDNs. Last error: ${lastError?.message || 'Unknown'}. ` +
      `Please check your internet connection and try again.`
    );
  })().finally(() => {
    loadingPromise = null;
  });

  return loadingPromise;
}

/* -------------------------------------------------------------------------- */
/* SERIALIZED EXECUTION                                                       */
/* -------------------------------------------------------------------------- */

async function execute(
  args: string[],
  onProgress?: (percent: number) => void,
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
      failure = error;
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
  return new Blob([data], { type: getMimeType(format) });
}

/* ========================================================================== */
/* CONVERTER FUNCTIONS                                                        */
/* ========================================================================== */

export async function convertFile(
  inputFile: File,
  outputFormat: string,
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void,
  bitrate?: string
): Promise<Blob> {
  if (!inputFile || inputFile.size === 0) throw new Error('Please select a valid media file.');
  const format = normalizeFormat(outputFormat);
  if (!format) throw new Error('Output format is required.');
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
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
  if (!Number.isFinite(startSec) || startSec < 0) throw new Error('Start time cannot be negative.');
  if (!Number.isFinite(durationSec) || durationSec <= 0) throw new Error('Duration must be greater than zero.');
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('cut-input', getExtension(file.name));
  const outName = makeName('cut-output', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-ss', String(startSec), '-i', inName, '-t', String(durationSec), '-c', 'copy'];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
  if (!files.length) throw new Error('No audio files were provided.');
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
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
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
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
  if (!Number.isFinite(gainDb)) throw new Error('Volume gain must be a valid number.');
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('volume-input', getExtension(file.name));
  const outName = makeName('boosted', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-af', `volume=${gainDb}dB`];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
  if (!Number.isFinite(factor) || factor <= 0) throw new Error('Speed factor must be greater than zero.');
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
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('reverse-input', getExtension(file.name));
  const outName = makeName('reversed', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-af', 'areverse'];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('mono-input', getExtension(file.name));
  const outName = makeName('mono-output', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = ['-i', inName, '-ac', '1'];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}

/* ========================================================================== */
/* VIDEO PROCESSING FUNCTIONS                                                 */
/* ========================================================================== */

export async function compressVideo(
  file: File,
  crf = 23,
  preset = 'medium',
  outputFormat = 'mp4',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void
): Promise<Blob> {
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
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('vcut-in', getExtension(file.name));
  const outName = makeName('vcut-out', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = [
      '-ss', String(startSec),
      '-i', inName,
      '-t', String(durationSec),
      '-c', 'copy'
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
  const format = normalizeFormat(outputFormat);
  if (files.length < 2) throw new Error('Need at least 2 videos to merge.');

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

    await execute(args, onProgress);

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
  onProgress?: (p: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  const inName = makeName('vgif-in', getExtension(file.name));
  const paletteName = makeName('palette', 'png');
  const outName = makeName('vgif-out', 'gif');
  try {
    await ff.writeFile(inName, await fetchFile(file));
    await execute([
      '-i', inName,
      '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`,
      '-y', paletteName
    ]);
    const args = [
      '-i', inName,
      '-i', paletteName,
      '-lavfi', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  const inName = makeName('gif-in', 'gif');
  const outName = makeName('gif-out', 'mp4');
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = [
      '-i', inName,
      '-movflags', 'faststart',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress);
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
    await execute(args, onProgress);
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

  return resizeVideo(
    file,
    width,
    height,
    outputFormat,
    cleanMetadata,
    onProgress,
    preset,
    crf,
  );
}

export async function cropVideo(
  file: File,
  x: number, y: number, w: number, h: number,
  outputFormat = 'mp4',
  cleanMetadata: boolean = false,
  onProgress?: (p: number) => void
): Promise<Blob> {
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
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
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
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
  const format = normalizeFormat(outputFormat);
  const ff = await getFFmpeg();
  const inName = makeName('mute-in', getExtension(file.name));
  const outName = makeName('muted', format);
  try {
    await ff.writeFile(inName, await fetchFile(file));
    const args = [
      '-i', inName,
      '-an',
      '-c:v', 'copy'
    ];
    if (cleanMetadata) args.push('-map_metadata', '-1');
    args.push('-y', outName);
    await execute(args, onProgress);
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
  onProgress?: (p: number) => void
): Promise<Blob> {
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
    await execute(args, onProgress);
    return await readBlob(ff, outName, format);
  } finally {
    await deleteFile(ff, inName);
    await deleteFile(ff, outName);
  }
}