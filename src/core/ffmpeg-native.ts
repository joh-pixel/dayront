import { getPlatform } from './platform';

export interface NativeFFmpegResult {
  blob: Blob;
  filename: string;
}

export interface NativeRunOptions {
  args: string[];
  inputs: File[];
  outputName: string;
  outputMime: string;
  onProgress?: (p: number) => void;
}

let _available: boolean | null = null;

export function isNativeFFmpegAvailable(): boolean {
  if (_available !== null) return _available;

  const p = getPlatform();
  if (p.engine !== 'native') {
    _available = false;
    return _available;
  }

  if (typeof window === 'undefined') {
    _available = false;
    return _available;
  }

  const w = window as any;
  // Our custom plugin registers under the name "FFmpeg"
  if (w.Capacitor?.Plugins?.FFmpeg) {
    _available = true;
    return _available;
  }

  _available = false;
  return _available;
}

export function resetNativeAvailability(): void {
  _available = null;
}

export async function runNativeFFmpeg(
  opts: NativeRunOptions,
): Promise<NativeFFmpegResult> {
  if (typeof window === 'undefined') {
    throw new Error('Native FFmpeg is not available on the server.');
  }

  const w = window as any;
  if (!w.Capacitor?.Plugins?.FFmpeg) {
    throw new Error('Native FFmpeg plugin is not available.');
  }

  const plugin = w.Capacitor.Plugins.FFmpeg;

  // 1. Write input files to the native filesystem
  const { Filesystem, Directory } = await importCapacitorFilesystem();
  const tempDir = 'dayront-tmp';
  const inputPaths: string[] = [];

  for (let i = 0; i < opts.inputs.length; i++) {
    const file = opts.inputs[i];
    const name = `input-${i}-${file.name.replace(/[^\w.-]/g, '_')}`;
    const path = `${tempDir}/${name}`;

    const buffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
    });

    inputPaths.push(path);
  }

  // 2. Build the native argument array with the real file paths
  const nativeArgs = buildNativeArgs(
    opts.args,
    inputPaths,
    `${tempDir}/${opts.outputName}`,
  );

  // 3. Attach a progress listener
  let listenerHandle: any = null;
  if (opts.onProgress) {
    // We estimate total duration from the source file
    // FFmpegKit emits `timeProcessedMs` — we map it to a percentage
    // We'll track the maximum time seen, then compute progress
    // (best-effort heuristic)
    let maxMs = 0;
    listenerHandle = await plugin.addListener('progress', (e: any) => {
      const processed = e?.timeProcessedMs ?? 0;
      if (processed > maxMs) maxMs = processed;
      // We don't know the total, so we emit a logarithmic-ish progress
      // Once we exceed a threshold we assume ~50%, and so on.
      // A more accurate approach would use ffprobe to get duration.
      const approxPercent = Math.min(95, Math.round(Math.log10(processed / 1000 + 1) * 40));
      opts.onProgress?.(approxPercent);
    });
  }

  try {
    // 4. Execute FFmpeg natively
    const result = await plugin.exec({ args: nativeArgs });

    if (result.exitCode !== 0) {
      throw new Error(`FFmpeg exited with code ${result.exitCode}`);
    }

    opts.onProgress?.(100);

    // 5. Read the output file back as a Blob
    const read = await Filesystem.readFile({
      path: `${tempDir}/${opts.outputName}`,
      directory: Directory.Cache,
    });

    const blob = base64ToBlob(read.data as string, opts.outputMime);

    // 6. Cleanup temp files
    await Promise.all(
      [...inputPaths, `${tempDir}/${opts.outputName}`].map((p) =>
        Filesystem.deleteFile({ path: p, directory: Directory.Cache }).catch(() => {}),
      ),
    );

    return { blob, filename: opts.outputName };
  } finally {
    if (listenerHandle?.remove) listenerHandle.remove();
  }
}

async function importCapacitorFilesystem(): Promise<any> {
  const mod: any = await import(/* @vite-ignore */ '@capacitor/filesystem');
  return mod;
}

/**
 * Rewrite the FFmpeg argument array so that input paths point at the
 * native temp paths and the output path points at the native output path.
 */
function buildNativeArgs(
  args: string[],
  nativeInputs: string[],
  nativeOutput: string,
): string[] {
  const out: string[] = [];
  let inputIdx = 0;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];

    if (a === '-i') {
      out.push('-i', nativeInputs[inputIdx++] ?? args[++i]);
      continue;
    }

    // Last element = output filename
    if (i === args.length - 1) {
      out.push(nativeOutput);
      continue;
    }

    out.push(a);
  }

  return out;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}