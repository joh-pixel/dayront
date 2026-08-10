import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

/**
 * FFmpeg uses one shared virtual filesystem.
 * Queue all operations so conversions cannot collide.
 */
let operationQueue: Promise<void> = Promise.resolve();

/* -------------------------------------------------------------------------- */
/* CONFIGURATION                                                              */
/* -------------------------------------------------------------------------- */

const FFMPEG_CORE_PATH = '/ffmpeg/ffmpeg-core.js';
const FFMPEG_WASM_PATH = '/ffmpeg/ffmpeg-core.wasm';

/* -------------------------------------------------------------------------- */
/* MIME TYPES                                                                 */
/* -------------------------------------------------------------------------- */

function getMimeType(format: string): string {
  const ext = format
    .toLowerCase()
    .replace(/^\./, '');

  const mimeTypes: Record<string, string> = {
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    opus: 'audio/ogg; codecs=opus',
    flac: 'audio/flac',

    // Video
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',

    // Fallback
    bin: 'application/octet-stream',
  };

  return (
    mimeTypes[ext] ||
    'application/octet-stream'
  );
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeFormat(format: string): string {
  return format
    .toLowerCase()
    .replace(/^\./, '')
    .trim();
}

function getExtension(
  filename: string,
  fallback = 'bin',
): string {
  const cleanName =
    filename.split(/[?#]/)[0];

  const parts = cleanName.split('.');

  if (parts.length < 2) {
    return fallback;
  }

  const extension =
    parts
      .pop()
      ?.toLowerCase()
      .trim();

  return extension || fallback;
}

function makeName(
  prefix: string,
  extension: string,
): string {
  let random: string;

  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    random = crypto.randomUUID();
  } else {
    random =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
  }

  return `${prefix}-${random}.${extension}`;
}

async function deleteFile(
  ff: FFmpeg,
  filename: string,
): Promise<void> {
  try {
    await ff.deleteFile(filename);
  } catch {
    // Cleanup failure should never hide the real result.
  }
}

/* -------------------------------------------------------------------------- */
/* CHECK CORE FILES                                                            */
/* -------------------------------------------------------------------------- */

async function checkCoreFile(
  url: string,
  name: string,
): Promise<void> {
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `${name} could not be loaded (${response.status} ${response.statusText}). ` +
      `Expected file at ${url}`,
    );
  }

  const contentType =
    response.headers.get('content-type') || '';

  console.log(
    `[Dayront FFmpeg] ${name}:`,
    {
      url,
      status: response.status,
      contentType,
      size: response.headers.get('content-length'),
    },
  );
}

/* -------------------------------------------------------------------------- */
/* FFmpeg LOADER                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Load FFmpeg in the browser.
 *
 * IMPORTANT:
 *
 * The files must exist at:
 *
 * public/ffmpeg/ffmpeg-core.js
 * public/ffmpeg/ffmpeg-core.wasm
 *
 * which become:
 *
 * /ffmpeg/ffmpeg-core.js
 * /ffmpeg/ffmpeg-core.wasm
 *
 * We use toBlobURL() because ffmpeg-core.js is an ESM WebAssembly loader.
 * This prevents the browser from treating the core as an application module
 * belonging to the Astro/Vite source graph.
 */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) {
    return ffmpeg;
  }

  if (typeof window === 'undefined') {
    throw new Error(
      'FFmpeg can only run in the browser.',
    );
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const instance = new FFmpeg();

    try {
      console.log(
        '[Dayront FFmpeg] Checking local core files...',
      );

      await checkCoreFile(
        FFMPEG_CORE_PATH,
        'FFmpeg core JavaScript',
      );

      await checkCoreFile(
        FFMPEG_WASM_PATH,
        'FFmpeg WASM',
      );

      console.log(
        '[Dayront FFmpeg] Local core files found.',
      );

      /**
       * Convert the local files to blob URLs.
       *
       * This is the important part.
       */
      const coreURL = await toBlobURL(
        FFMPEG_CORE_PATH,
        'text/javascript',
      );

      const wasmURL = await toBlobURL(
        FFMPEG_WASM_PATH,
        'application/wasm',
      );

      console.log(
        '[Dayront FFmpeg] Blob URLs created.',
      );

      console.log(
        '[Dayront FFmpeg] Loading FFmpeg core...',
      );

      await instance.load({
        coreURL,
        wasmURL,
      });

      console.log(
        '[Dayront FFmpeg] FFmpeg loaded successfully.',
      );

      ffmpeg = instance;

      return instance;
    } catch (error: unknown) {
      ffmpeg = null;

      console.error(
        '[Dayront FFmpeg] Complete load error:',
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      throw new Error(
        `FFmpeg load failed: ${message}`,
      );
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/* -------------------------------------------------------------------------- */
/* SERIALIZED EXECUTION                                                       */
/* -------------------------------------------------------------------------- */

async function execute(
  args: string[],
  onProgress?: (
    percent: number,
  ) => void,
): Promise<FFmpeg> {
  let result: FFmpeg | null = null;
  let failure: unknown = null;

  const job =
    operationQueue.then(async () => {
      const ff = await getFFmpeg();

      const progressHandler = ({
        progress,
      }: {
        progress: number;
      }) => {
        const percent = Math.max(
          0,
          Math.min(
            100,
            Math.round(
              progress * 100,
            ),
          ),
        );

        onProgress?.(percent);
      };

      if (onProgress) {
        ff.on(
          'progress',
          progressHandler,
        );
      }

      try {
        await ff.exec(args);

        onProgress?.(100);

        result = ff;
      } catch (error) {
        failure = error;
      } finally {
        if (onProgress) {
          ff.off(
            'progress',
            progressHandler,
          );
        }
      }
    });

  operationQueue = job.then(
    () => undefined,
    () => undefined,
  );

  await job;

  if (failure) {
    throw failure;
  }

  if (!result) {
    throw new Error(
      'FFmpeg execution failed.',
    );
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* READ OUTPUT                                                                */
/* -------------------------------------------------------------------------- */

async function readBlob(
  ff: FFmpeg,
  filename: string,
  format: string,
): Promise<Blob> {
  const data =
    await ff.readFile(filename);

  return new Blob(
    [data],
    {
      type: getMimeType(format),
    },
  );
}

/* -------------------------------------------------------------------------- */
/* GENERAL CONVERTER                                                          */
/* -------------------------------------------------------------------------- */

export async function convertFile(
  inputFile: File,
  outputFormat: string,
  onProgress?: (
    percent: number,
  ) => void,
): Promise<Blob> {
  if (
    !inputFile ||
    inputFile.size === 0
  ) {
    throw new Error(
      'Please select a valid media file.',
    );
  }

  const format =
    normalizeFormat(outputFormat);

  if (!format) {
    throw new Error(
      'Output format is required.',
    );
  }

  const ff =
    await getFFmpeg();

  const inputExtension =
    getExtension(
      inputFile.name,
    );

  const inputName =
    makeName(
      'input',
      inputExtension,
    );

  const outputName =
    makeName(
      'output',
      format,
    );

  try {
    await ff.writeFile(
      inputName,
      await fetchFile(
        inputFile,
      ),
    );

    await execute(
      [
        '-i',
        inputName,
        '-y',
        outputName,
      ],
      onProgress,
    );

    return await readBlob(
      ff,
      outputName,
      format,
    );
  } finally {
    await deleteFile(
      ff,
      inputName,
    );

    await deleteFile(
      ff,
      outputName,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* AUDIO CUTTER                                                               */
/* -------------------------------------------------------------------------- */

export async function cutAudio(
  file: File,
  startSec: number,
  durationSec: number,
  outputFormat = 'mp3',
  onProgress?: (
    percent: number,
  ) => void,
): Promise<Blob> {
  if (
    !Number.isFinite(startSec) ||
    startSec < 0
  ) {
    throw new Error(
      'Start time cannot be negative.',
    );
  }

  if (
    !Number.isFinite(durationSec) ||
    durationSec <= 0
  ) {
    throw new Error(
      'Duration must be greater than zero.',
    );
  }

  const format =
    normalizeFormat(
      outputFormat,
    );

  const ff =
    await getFFmpeg();

  const inputName =
    makeName(
      'cut-input',
      getExtension(
        file.name,
      ),
    );

  const outputName =
    makeName(
      'cut-output',
      format,
    );

  try {
    await ff.writeFile(
      inputName,
      await fetchFile(file),
    );

    await execute(
      [
        '-ss',
        String(startSec),
        '-i',
        inputName,
        '-t',
        String(durationSec),
        '-c',
        'copy',
        '-y',
        outputName,
      ],
      onProgress,
    );

    return await readBlob(
      ff,
      outputName,
      format,
    );
  } finally {
    await deleteFile(
      ff,
      inputName,
    );

    await deleteFile(
      ff,
      outputName,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* AUDIO MERGER                                                               */
/* -------------------------------------------------------------------------- */

export async function mergeAudio(
  files: File[],
  outputFormat = 'mp3',
  onProgress?: (
    percent: number,
  ) => void,
): Promise<Blob> {
  if (
    !files.length
  ) {
    throw new Error(
      'No audio files were provided.',
    );
  }

  const format =
    normalizeFormat(
      outputFormat,
    );

  const ff =
    await getFFmpeg();

  const inputs: string[] = [];

  const timestamp =
    Date.now();

  try {
    for (
      let i = 0;
      i < files.length;
      i++
    ) {
      const name =
        makeName(
          `merge-${timestamp}-${i}`,
          getExtension(
            files[i].name,
          ),
        );

      await ff.writeFile(
        name,
        await fetchFile(
          files[i],
        ),
      );

      inputs.push(name);
    }

    const outputName =
      makeName(
        'merged',
        format,
      );

    const filterInputs =
      inputs
        .map(
          (_, index) =>
            `[${index}:a]`,
        )
        .join('');

    const concatFilter =
      `${filterInputs}concat=n=${inputs.length}:v=0:a=1[out]`;

    await execute(
      [
        ...inputs.flatMap(
          (name) => [
            '-i',
            name,
          ],
        ),
        '-filter_complex',
        concatFilter,
        '-map',
        '[out]',
        '-y',
        outputName,
      ],
      onProgress,
    );

    return await readBlob(
      ff,
      outputName,
      format,
    );
  } finally {
    for (
      const input of inputs
    ) {
      await deleteFile(
        ff,
        input,
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/* AUDIO COMPRESSION                                                          */
/* -------------------------------------------------------------------------- */

export async function compressAudio(
  file: File,
  quality = 3,
  outputFormat = 'mp3',
  onProgress?: (
    percent: number,
  ) => void,
): Promise<Blob> {
  const format =
    normalizeFormat(
      outputFormat,
    );

  const safeQuality =
    Math.max(
      0,
      Math.min(
        9,
        Math.round(
          quality,
        ),
      ),
    );

  const ff =
    await getFFmpeg();

  const inputName =
    makeName(
      'compress-input',
      getExtension(
        file.name,
      ),
    );

  const outputName =
    makeName(
      'compressed',
      format,
    );

  try {
    await ff.writeFile(
      inputName,
      await fetchFile(file),
    );

    await execute(
      [
        '-i',
        inputName,
        '-c:a',
        'libmp3lame',
        '-q:a',
        String(
          safeQuality,
        ),
        '-y',
        outputName,
      ],
      onProgress,
    );

    return await readBlob(
      ff,
      outputName,
      format,
    );
  } finally {
    await deleteFile(
      ff,
      inputName,
    );

    await deleteFile(
      ff,
      outputName,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* VOLUME BOOST                                                               */
/* -------------------------------------------------------------------------- */

export async function boostVolume(
  file: File,
  gainDb = 6,
  outputFormat = 'mp3',
  onProgress?: (
    percent: number,
  ) => void,
): Promise<Blob> {
  if (
    !Number.isFinite(gainDb)
  ) {
    throw new Error(
      'Volume gain must be a valid number.',
    );
  }

  const format =
    normalizeFormat(
      outputFormat,
    );

  const ff =
    await getFFmpeg();

  const inputName =
    makeName(
      'volume-input',
      getExtension(
        file.name,
      ),
    );

  const outputName =
    makeName(
      'boosted',
      format,
    );

  try {
    await ff.writeFile(
      inputName,
      await fetchFile(file),
    );

    await execute(
      [
        '-i',
        inputName,
        '-af',
        `volume=${gainDb}dB`,
        '-y',
        outputName,
      ],
      onProgress,
    );

    return await readBlob(
      ff,
      outputName,
      format,
    );
  } finally {
    await deleteFile(
      ff,
      inputName,
    );

    await deleteFile(
      ff,
      outputName,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* SPEED CHANGER                                                              */
/* -------------------------------------------------------------------------- */

export async function changeSpeed(
  file: File,
  factor = 1.5,
  outputFormat = 'mp3',
  onProgress?: (
    percent: number,
  ) => void,
): Promise<Blob> {
  if (
    !Number.isFinite(factor) ||
    factor <= 0
  ) {
    throw new Error(
      'Speed factor must be greater than zero.',
    );
  }

  const format =
    normalizeFormat(
      outputFormat,
    );

  const ff =
    await getFFmpeg();

  const inputName =
    makeName(
      'speed-input',
      getExtension(
        file.name,
      ),
    );

  const outputName =
    makeName(
      'speed-output',
      format,
    );

  try {
    let remaining =
      factor;

    const filters: string[] =
      [];

    while (
      remaining > 2
    ) {
      filters.push(
        'atempo=2',
      );

      remaining /= 2;
    }

    while (
      remaining < 0.5
    ) {
      filters.push(
        'atempo=0.5',
      );

      remaining /= 0.5;
    }

    filters.push(
      `atempo=${remaining}`,
    );

    await ff.writeFile(
      inputName,
      await fetchFile(file),
    );

    await execute(
      [
        '-i',
        inputName,
        '-filter:a',
        filters.join(','),
        '-y',
        outputName,
      ],
      onProgress,
    );

    return await readBlob(
      ff,
      outputName,
      format,
    );
  } finally {
    await deleteFile(
      ff,
      inputName,
    );

    await deleteFile(
      ff,
      outputName,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* REVERSE AUDIO                                                              */
/* -------------------------------------------------------------------------- */

export async function reverseAudio(
  file: File,
  outputFormat = 'mp3',
  onProgress?: (
    percent: number,
  ) => void,
): Promise<Blob> {
  const format =
    normalizeFormat(
      outputFormat,
    );

  const ff =
    await getFFmpeg();

  const inputName =
    makeName(
      'reverse-input',
      getExtension(
        file.name,
      ),
    );

  const outputName =
    makeName(
      'reversed',
      format,
    );

  try {
    await ff.writeFile(
      inputName,
      await fetchFile(file),
    );

    await execute(
      [
        '-i',
        inputName,
        '-af',
        'areverse',
        '-y',
        outputName,
      ],
      onProgress,
    );

    return await readBlob(
      ff,
      outputName,
      format,
    );
  } finally {
    await deleteFile(
      ff,
      inputName,
    );

    await deleteFile(
      ff,
      outputName,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* STEREO TO MONO                                                            */
/* -------------------------------------------------------------------------- */

export async function stereoToMono(
  file: File,
  outputFormat = 'mp3',
  onProgress?: (
    percent: number,
  ) => void,
): Promise<Blob> {
  const format =
    normalizeFormat(
      outputFormat,
    );

  const ff =
    await getFFmpeg();

  const inputName =
    makeName(
      'mono-input',
      getExtension(
        file.name,
      ),
    );

  const outputName =
    makeName(
      'mono-output',
      format,
    );

  try {
    await ff.writeFile(
      inputName,
      await fetchFile(file),
    );

    await execute(
      [
        '-i',
        inputName,
        '-ac',
        '1',
        '-y',
        outputName,
      ],
      onProgress,
    );

    return await readBlob(
      ff,
      outputName,
      format,
    );
  } finally {
    await deleteFile(
      ff,
      inputName,
    );

    await deleteFile(
      ff,
      outputName,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* REMOVE METADATA                                                           */
/* -------------------------------------------------------------------------- */

export async function stripMetadata(
  file: File,
  outputFormat?: string,
): Promise<Blob> {
  const inputExtension =
    getExtension(
      file.name,
    );

  const format =
    normalizeFormat(
      outputFormat ||
      inputExtension,
    );

  const ff =
    await getFFmpeg();

  const inputName =
    makeName(
      'metadata-input',
      inputExtension,
    );

  const outputName =
    makeName(
      'clean',
      format,
    );

  try {
    await ff.writeFile(
      inputName,
      await fetchFile(file),
    );

    await execute([
      '-i',
      inputName,
      '-map_metadata',
      '-1',
      '-c',
      'copy',
      '-y',
      outputName,
    ]);

    return await readBlob(
      ff,
      outputName,
      format,
    );
  } finally {
    await deleteFile(
      ff,
      inputName,
    );

    await deleteFile(
      ff,
      outputName,
    );
  }
}