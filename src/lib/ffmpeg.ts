import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

// FFmpeg has a shared virtual filesystem.
// Queue operations so multiple conversions don't interfere.
let operationQueue: Promise<void> = Promise.resolve();

/* -------------------------------------------------------------------------- */
/* MIME TYPES                                                                  */
/* -------------------------------------------------------------------------- */

function getMimeType(format: string): string {
  const ext = format.toLowerCase().replace(/^\./, '');

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

    // Generic
    bin: 'application/octet-stream',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
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
  const cleanName = filename.split(/[?#]/)[0];
  const parts = cleanName.split('.');

  if (parts.length < 2) {
    return fallback;
  }

  const extension = parts
    .pop()
    ?.toLowerCase()
    .trim();

  return extension || fallback;
}

function makeName(
  prefix: string,
  extension: string,
): string {
  const random =
    typeof crypto !== 'undefined' &&
    'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return `${prefix}-${random}.${extension}`;
}

async function deleteFile(
  ff: FFmpeg,
  filename: string,
): Promise<void> {
  try {
    await ff.deleteFile(filename);
  } catch {
    // Ignore cleanup errors.
  }
}

/* -------------------------------------------------------------------------- */
/* FFmpeg LOADER                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Loads the LOCAL ESM FFmpeg core.
 *
 * IMPORTANT:
 *
 * public/ffmpeg/ffmpeg-core.js
 * public/ffmpeg/ffmpeg-core.wasm
 *
 * must come from:
 *
 * node_modules/@ffmpeg/core/dist/esm/
 *
 * We intentionally DO NOT use toBlobURL().
 *
 * We also DO NOT use the multi-thread core here.
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
      /*
       * IMPORTANT:
       *
       * These are runtime URLs.
       * They are NOT imported by Vite.
       */
      const coreURL =
        `${window.location.origin}/ffmpeg/ffmpeg-core.js`;

      const wasmURL =
        `${window.location.origin}/ffmpeg/ffmpeg-core.wasm`;

      console.log(
        '[Dayront FFmpeg] Loading core:',
        coreURL,
      );

      console.log(
        '[Dayront FFmpeg] Loading WASM:',
        wasmURL,
      );

      await instance.load({
        coreURL,
        wasmURL,
      });

      console.log(
        '[Dayront FFmpeg] Core loaded successfully.',
      );

      ffmpeg = instance;

      return instance;
    } catch (error: unknown) {
      ffmpeg = null;

      console.error(
        '[Dayront FFmpeg] Load error:',
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
/* SERIALIZED FFmpeg EXECUTION                                                 */
/* -------------------------------------------------------------------------- */

async function execute(
  args: string[],
  onProgress?: (percent: number) => void,
): Promise<FFmpeg> {
  let result: FFmpeg | null = null;
  let failure: unknown = null;

  const job = operationQueue.then(
    async () => {
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
            Math.round(progress * 100),
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
    },
  );

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
/* GENERAL MEDIA CONVERTER                                                     */
/* -------------------------------------------------------------------------- */

export async function convertFile(
  inputFile: File,
  outputFormat: string,
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  if (
    !inputFile ||
    inputFile.size === 0
  ) {
    throw new Error(
      'Please select a valid media file.',
    );
  }

  const ff = await getFFmpeg();

  const inputExtension =
    getExtension(inputFile.name);

  const format =
    normalizeFormat(outputFormat);

  if (!format) {
    throw new Error(
      'Output format is required.',
    );
  }

  const inputName = makeName(
    'input',
    inputExtension,
  );

  const outputName = makeName(
    'output',
    format,
  );

  try {
    await ff.writeFile(
      inputName,
      await fetchFile(inputFile),
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

    const data =
      await ff.readFile(outputName);

    return new Blob([data], {
      type: getMimeType(format),
    });
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
/* AUDIO CUTTER                                                                */
/* -------------------------------------------------------------------------- */

export async function cutAudio(
  file: File,
  startSec: number,
  durationSec: number,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  if (startSec < 0) {
    throw new Error(
      'Start time cannot be negative.',
    );
  }

  if (durationSec <= 0) {
    throw new Error(
      'Duration must be greater than zero.',
    );
  }

  const ff = await getFFmpeg();

  const inputExtension =
    getExtension(file.name);

  const format =
    normalizeFormat(outputFormat);

  const inputName = makeName(
    'cut-input',
    inputExtension,
  );

  const outputName = makeName(
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

    const data =
      await ff.readFile(outputName);

    return new Blob([data], {
      type: getMimeType(format),
    });
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
/* AUDIO MERGER                                                                */
/* -------------------------------------------------------------------------- */

export async function mergeAudio(
  files: File[],
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  if (!files.length) {
    throw new Error(
      'No audio files were provided.',
    );
  }

  const ff = await getFFmpeg();

  const format =
    normalizeFormat(outputFormat);

  const timestamp = Date.now();

  const inputs: string[] = [];

  try {
    for (
      let i = 0;
      i < files.length;
      i++
    ) {
      const extension =
        getExtension(files[i].name);

      const name = makeName(
        `merge-${timestamp}-${i}`,
        extension,
      );

      await ff.writeFile(
        name,
        await fetchFile(files[i]),
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

    const data =
      await ff.readFile(
        outputName,
      );

    await deleteFile(
      ff,
      outputName,
    );

    return new Blob([data], {
      type: getMimeType(format),
    });
  } finally {
    for (const input of inputs) {
      await deleteFile(
        ff,
        input,
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/* AUDIO COMPRESSION                                                           */
/* -------------------------------------------------------------------------- */

export async function compressAudio(
  file: File,
  quality = 3,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const ff = await getFFmpeg();

  const inputExtension =
    getExtension(file.name);

  const format =
    normalizeFormat(outputFormat);

  const inputName = makeName(
    'compress-input',
    inputExtension,
  );

  const outputName = makeName(
    'compressed',
    format,
  );

  try {
    const safeQuality =
      Math.max(
        0,
        Math.min(
          9,
          Math.round(quality),
        ),
      );

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
        String(safeQuality),
        '-y',
        outputName,
      ],
      onProgress,
    );

    const data =
      await ff.readFile(
        outputName,
      );

    return new Blob([data], {
      type: getMimeType(format),
    });
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
/* VOLUME BOOST                                                                */
/* -------------------------------------------------------------------------- */

export async function boostVolume(
  file: File,
  gainDb = 6,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  if (!Number.isFinite(gainDb)) {
    throw new Error(
      'Volume gain must be a valid number.',
    );
  }

  const ff = await getFFmpeg();

  const inputExtension =
    getExtension(file.name);

  const format =
    normalizeFormat(outputFormat);

  const inputName = makeName(
    'volume-input',
    inputExtension,
  );

  const outputName = makeName(
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

    const data =
      await ff.readFile(
        outputName,
      );

    return new Blob([data], {
      type: getMimeType(format),
    });
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
/* SPEED CHANGER                                                               */
/* -------------------------------------------------------------------------- */

export async function changeSpeed(
  file: File,
  factor = 1.5,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  if (
    !Number.isFinite(factor) ||
    factor <= 0
  ) {
    throw new Error(
      'Speed factor must be greater than zero.',
    );
  }

  const ff = await getFFmpeg();

  const inputExtension =
    getExtension(file.name);

  const format =
    normalizeFormat(outputFormat);

  const inputName = makeName(
    'speed-input',
    inputExtension,
  );

  const outputName = makeName(
    'speed-output',
    format,
  );

  try {
    let remaining = factor;

    const filters: string[] = [];

    while (remaining > 2) {
      filters.push(
        'atempo=2',
      );

      remaining /= 2;
    }

    while (remaining < 0.5) {
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

    const data =
      await ff.readFile(
        outputName,
      );

    return new Blob([data], {
      type: getMimeType(format),
    });
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
/* REVERSE AUDIO                                                               */
/* -------------------------------------------------------------------------- */

export async function reverseAudio(
  file: File,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const ff = await getFFmpeg();

  const inputExtension =
    getExtension(file.name);

  const format =
    normalizeFormat(outputFormat);

  const inputName = makeName(
    'reverse-input',
    inputExtension,
  );

  const outputName = makeName(
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

    const data =
      await ff.readFile(
        outputName,
      );

    return new Blob([data], {
      type: getMimeType(format),
    });
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
/* STEREO TO MONO                                                              */
/* -------------------------------------------------------------------------- */

export async function stereoToMono(
  file: File,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const ff = await getFFmpeg();

  const inputExtension =
    getExtension(file.name);

  const format =
    normalizeFormat(outputFormat);

  const inputName = makeName(
    'mono-input',
    inputExtension,
  );

  const outputName = makeName(
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

    const data =
      await ff.readFile(
        outputName,
      );

    return new Blob([data], {
      type: getMimeType(format),
    });
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
/* REMOVE METADATA                                                            */
/* -------------------------------------------------------------------------- */

export async function stripMetadata(
  file: File,
  outputFormat?: string,
): Promise<Blob> {
  const ff = await getFFmpeg();

  const inputExtension =
    getExtension(file.name);

  const format =
    normalizeFormat(
      outputFormat ||
        inputExtension,
    );

  const inputName = makeName(
    'metadata-input',
    inputExtension,
  );

  const outputName = makeName(
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

    const data =
      await ff.readFile(
        outputName,
      );

    return new Blob([data], {
      type: getMimeType(format),
    });
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