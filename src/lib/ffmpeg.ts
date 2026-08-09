import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  try {
    // Fetch the core files from our own public/ffmpeg folder
    const coreJS = await fetch('/ffmpeg/ffmpeg-core.js').then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} for ffmpeg-core.js`);
      return r.blob();
    });
    const coreWasm = await fetch('/ffmpeg/ffmpeg-core.wasm').then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} for ffmpeg-core.wasm`);
      return r.blob();
    });

    const coreURL = URL.createObjectURL(coreJS);
    const wasmURL = URL.createObjectURL(coreWasm);

    await ffmpeg.load({ coreURL, wasmURL });
  } catch (e: any) {
    ffmpeg = null;
    throw new Error(`FFmpeg load failed: ${e.message}`);
  }

  return ffmpeg;
}

// ── All conversion functions (unchanged) ──────────────────
export async function convertFile(
  inputFile: File,
  outputFormat: string,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  ff.on('progress', ({ progress }) => onProgress?.(Math.round(progress * 100)));

  const inputName = 'input.' + (inputFile.name.split('.').pop() || 'bin');
  const outputName = 'output.' + outputFormat;

  await ff.writeFile(inputName, await fetchFile(inputFile));
  await ff.exec(['-i', inputName, outputName]);
  const data = await ff.readFile(outputName);
  return new Blob([data], { type: `audio/${outputFormat}` });
}

export async function cutAudio(
  file: File,
  startSec: number,
  durationSec: number,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  ff.on('progress', ({ progress }) => onProgress?.(Math.round(progress * 100)));

  const inputName = 'input.' + (file.name.split('.').pop() || 'bin');
  const outputName = 'output.' + outputFormat;

  await ff.writeFile(inputName, await fetchFile(file));
  await ff.exec([
    '-i', inputName,
    '-ss', String(startSec),
    '-t', String(durationSec),
    '-c', 'copy',
    outputName,
  ]);
  const data = await ff.readFile(outputName);
  return new Blob([data], { type: `audio/${outputFormat}` });
}

export async function mergeAudio(
  files: File[],
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  ff.on('progress', ({ progress }) => onProgress?.(Math.round(progress * 100)));

  const inputs: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const name = `input${i}.${files[i].name.split('.').pop()}`;
    await ff.writeFile(name, await fetchFile(files[i]));
    inputs.push(name);
  }

  const filterInputs = inputs.map(f => `[${f}]`).join('');
  const concatFilter = `${filterInputs} concat=n=${inputs.length}:v=0:a=1 [out]`;
  const outputName = `merged.${outputFormat}`;

  await ff.exec([
    ...inputs.flatMap(f => ['-i', f]),
    '-filter_complex', concatFilter,
    '-map', '[out]',
    outputName,
  ]);
  const data = await ff.readFile(outputName);
  return new Blob([data], { type: `audio/${outputFormat}` });
}

export async function compressAudio(
  file: File,
  quality = 3,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  ff.on('progress', ({ progress }) => onProgress?.(Math.round(progress * 100)));

  const inputName = 'input.' + (file.name.split('.').pop() || 'bin');
  const outputName = 'compressed.' + outputFormat;

  await ff.writeFile(inputName, await fetchFile(file));
  await ff.exec([
    '-i', inputName,
    '-c:a', 'libmp3lame',
    '-q:a', String(quality),
    outputName,
  ]);
  const data = await ff.readFile(outputName);
  return new Blob([data], { type: `audio/${outputFormat}` });
}

export async function boostVolume(
  file: File,
  gainDb = 6,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  ff.on('progress', ({ progress }) => onProgress?.(Math.round(progress * 100)));

  const inputName = 'input.' + (file.name.split('.').pop() || 'bin');
  const outputName = 'boosted.' + outputFormat;

  await ff.writeFile(inputName, await fetchFile(file));
  await ff.exec([
    '-i', inputName,
    '-af', `volume=${gainDb}dB`,
    outputName,
  ]);
  const data = await ff.readFile(outputName);
  return new Blob([data], { type: `audio/${outputFormat}` });
}

export async function changeSpeed(
  file: File,
  factor = 1.5,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  ff.on('progress', ({ progress }) => onProgress?.(Math.round(progress * 100)));

  const inputName = 'input.' + (file.name.split('.').pop() || 'bin');
  const outputName = 'speed.' + outputFormat;

  await ff.writeFile(inputName, await fetchFile(file));
  await ff.exec([
    '-i', inputName,
    '-filter:a', `atempo=${factor}`,
    outputName,
  ]);
  const data = await ff.readFile(outputName);
  return new Blob([data], { type: `audio/${outputFormat}` });
}

export async function reverseAudio(
  file: File,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  ff.on('progress', ({ progress }) => onProgress?.(Math.round(progress * 100)));

  const inputName = 'input.' + (file.name.split('.').pop() || 'bin');
  const outputName = 'reversed.' + outputFormat;

  await ff.writeFile(inputName, await fetchFile(file));
  await ff.exec([
    '-i', inputName,
    '-af', 'areverse',
    outputName,
  ]);
  const data = await ff.readFile(outputName);
  return new Blob([data], { type: `audio/${outputFormat}` });
}

export async function stereoToMono(
  file: File,
  outputFormat = 'mp3',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  ff.on('progress', ({ progress }) => onProgress?.(Math.round(progress * 100)));

  const inputName = 'input.' + (file.name.split('.').pop() || 'bin');
  const outputName = 'mono.' + outputFormat;

  await ff.writeFile(inputName, await fetchFile(file));
  await ff.exec([
    '-i', inputName,
    '-ac', '1',
    outputName,
  ]);
  const data = await ff.readFile(outputName);
  return new Blob([data], { type: `audio/${outputFormat}` });
}

export async function stripMetadata(
  file: File,
  outputFormat?: string
): Promise<Blob> {
  const fmt = outputFormat || file.name.split('.').pop() || 'mp3';
  const ff = await getFFmpeg();
  const inputName = 'input.' + (file.name.split('.').pop() || 'bin');
  const outputName = 'clean.' + fmt;

  await ff.writeFile(inputName, await fetchFile(file));
  await ff.exec(['-i', inputName, '-map_metadata', '-1', '-c', 'copy', outputName]);
  const data = await ff.readFile(outputName);
  return new Blob([data], { type: `audio/${fmt}` });
}