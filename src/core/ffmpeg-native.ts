/**
 * src/core/ffmpeg-native.ts
 * ----------------------------------------------------------------------------
 * Native FFmpeg bridge for Capacitor (mobile) and Tauri (desktop).
 *
 * When running inside a native shell, ffmpeg runs as a real binary on the
 * device — no WASM, no 300 MB memory cap, 5 GB files, 10× speed.
 *
 * The bridge has two backends:
 *   - Capacitor: uses @capacitor-community/ffmpeg (or a custom Capacitor plugin)
 *   - Tauri: uses the tauri-plugin-shell to invoke a bundled FFmpeg binary
 *
 * On web, this module stays dormant — isNativeFFmpegAvailable() returns false
 * and the caller falls back to the WASM implementation in ffmpeg.ts.
 *
 * NOTE: All Capacitor/Tauri packages are loaded via `import(/* @vite-ignore *\/ ...)`
 * so Rollup doesn't try to bundle them at build time — they only exist inside
 * the native shell.
 */

import { getPlatform } from './platform';

export interface NativeFFmpegResult {
  /** Output file contents as a Blob, ready to save. */
  blob: Blob;
  /** Suggested filename for the output. */
  filename: string;
}

export interface NativeRunOptions {
  /** FFmpeg argument array (as you'd pass to the CLI). */
  args: string[];
  /** Input files, in the order they're referenced in `args` as -i paths. */
  inputs: File[];
  /** Output filename (last arg — usually 'output.mp4'). */
  outputName: string;
  /** MIME type for the resulting Blob. */
  outputMime: string;
  /** Progress callback (0–100). */
  onProgress?: (p: number) => void;
}

/* ── Availability check ──────────────────────────────────── */

let _available: boolean | null = null;

/**
 * Returns true if a native FFmpeg backend is available.
 * Cached after first check.
 */
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

  // Capacitor plugin available?
  if (w.Capacitor?.Plugins?.FFmpeg) {
    _available = true;
    return _available;
  }

  // Tauri shell available?
  if (w.__TAURI__?.shell?.Command) {
    _available = true;
    return _available;
  }

  // Platform says native but no plugin found — not yet wired.
  _available = false;
  return _available;
}

/** Reset the availability cache (use after installing a plugin). */
export function resetNativeAvailability(): void {
  _available = null;
}

/* ── Backend dispatch ─────────────────────────────────────── */

/**
 * Run FFmpeg using whichever native backend is available.
 * Throws if no native backend is present — callers should check
 * `isNativeFFmpegAvailable()` first.
 */
export async function runNativeFFmpeg(
  opts: NativeRunOptions,
): Promise<NativeFFmpegResult> {
  if (typeof window === 'undefined') {
    throw new Error('Native FFmpeg is not available on the server.');
  }

  const w = window as any;

  /* ── Capacitor backend ──────────────────────────────── */
  if (w.Capacitor?.Plugins?.FFmpeg) {
    return runCapacitorFFmpeg(w.Capacitor.Plugins.FFmpeg, opts);
  }

  /* ── Tauri backend ──────────────────────────────────── */
  if (w.__TAURI__?.shell?.Command) {
    return runTauriFFmpeg(opts);
  }

  throw new Error(
    'Native FFmpeg is not available. ' +
    'On web, use the WASM implementation in src/core/ffmpeg.ts instead.',
  );
}

/* ── Capacitor backend ───────────────────────────────────── */

async function runCapacitorFFmpeg(
  plugin: any,
  opts: NativeRunOptions,
): Promise<NativeFFmpegResult> {
  // 1. Write inputs to a temp directory using Capacitor Filesystem
  // 2. Call the FFmpeg plugin with the argument array
  // 3. Read the output file back as a Blob

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

  // 2. Build the argument array with the native input paths
  const nativeArgs = buildNativeArgs(opts.args, inputPaths, `${tempDir}/${opts.outputName}`);

  let unlistenProgress: (() => void) | null = null;
  if (opts.onProgress) {
    try {
      const handle = await plugin.addListener('progress', (e: any) => {
        const p = Math.max(0, Math.min(100, Math.round((e?.progress ?? 0) * 100)));
        opts.onProgress?.(p);
      });
      unlistenProgress = () => handle?.remove?.();
    } catch {
      // Progress events not supported — continue without them
    }
  }

  try {
    await plugin.exec({ args: nativeArgs });

    // 3. Read the output back
    const read = await Filesystem.readFile({
      path: `${tempDir}/${opts.outputName}`,
      directory: Directory.Cache,
    });

    const blob = base64ToBlob(read.data as string, opts.outputMime);

    // Cleanup temp files (best-effort)
    await Promise.all(
      [...inputPaths, `${tempDir}/${opts.outputName}`].map((p) =>
        Filesystem.deleteFile({ path: p, directory: Directory.Cache }).catch(() => {}),
      ),
    );

    return { blob, filename: opts.outputName };
  } finally {
    unlistenProgress?.();
  }
}

async function importCapacitorFilesystem(): Promise<any> {
  try {
    // @vite-ignore keeps Rollup from trying to resolve this at build time.
    // The package only exists inside the native shell.
    const mod: any = await import(/* @vite-ignore */ '@capacitor/filesystem');
    return mod;
  } catch {
    throw new Error(
      'Capacitor Filesystem plugin not installed. ' +
      'Run: npm install @capacitor/filesystem',
    );
  }
}

/* ── Tauri backend ───────────────────────────────────────── */

async function runTauriFFmpeg(
  opts: NativeRunOptions,
): Promise<NativeFFmpegResult> {
  const w = window as any;
  const { Command } = w.__TAURI__.shell;

  // In Tauri we can pass File objects via stdin or write to a temp dir
  // managed by tauri-plugin-fs. For simplicity, assume the Tauri shell
  // command has been set up to accept base64-encoded inputs on stdin.

  const inputsBase64 = await Promise.all(
    opts.inputs.map(async (f) => arrayBufferToBase64(await f.arrayBuffer())),
  );

  const payload = JSON.stringify({
    args: opts.args,
    inputs: inputsBase64,
    output: opts.outputName,
  });

  const cmd = Command.sidecar('binaries/ffmpeg');
  const child = await cmd.spawn();
  await child.write(payload + '\n');
  await child.write('\x04'); // EOT — signals end of stdin

  if (opts.onProgress) {
    child.stdout.on('data', (line: string) => {
      const m = /progress=(\d+)%/.exec(line);
      if (m) opts.onProgress?.(parseInt(m[1], 10));
    });
  }

  await child.kill(); // ensure cleanup
  const output = await child.wait(); // tauri returns the shell exit record

  if (output.code !== 0) {
    throw new Error(`FFmpeg exited with code ${output.code}`);
  }

  // Read the output blob from the temp file (must be exposed by the sidecar)
  const response = await Command.sidecar('binaries/ffmpeg-read')
    .execute([opts.outputName]);

  const base64 = (response.stdout || '').trim();
  const blob = base64ToBlob(base64, opts.outputMime);

  return { blob, filename: opts.outputName };
}

/* ── Argument rewriting ──────────────────────────────────── */

/**
 * Rewrite an FFmpeg argument array so that:
 *  - input paths (the token after each `-i`) point at the native temp paths
 *  - the output path (last arg) points at the native temp output path
 *
 * The `args` array arrives from the tool runner, e.g.:
 *   ['-i', 'input-abc.mp3', '-i', 'input-def.mp3', '-filter_complex', '...', 'output-xyz.mp3']
 *
 * We replace the input/output filenames but keep all flags intact.
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

/* ── Base64 helpers ──────────────────────────────────────── */

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