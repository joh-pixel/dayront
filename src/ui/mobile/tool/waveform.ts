/**
 * src/ui/mobile/tool/waveform.ts
 * ----------------------------------------------------------------------------
 * Waveform extraction + rendering for the mobile tool screen.
 *
 * Used by FileHero (audio preview) and TrimEditor (drag-to-trim).
 *
 * Everything here is safe on the web and inside the APK. On any failure
 * (unsupported codec, no AudioContext, decode error) extraction returns
 * null so callers can fall back to an icon-only UI.
 */

export interface WaveformData {
  peaks: number[];      // normalized 0..1
  duration: number;     // seconds
  sampleRate: number;
}

/** Decode a File → AudioBuffer via Web Audio. Returns null on failure. */
async function decodeAudioFile(file: File): Promise<AudioBuffer | null> {
  try {
    const ab = await file.arrayBuffer();
    const Ctx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const buf = await ctx.decodeAudioData(ab.slice(0));
    try { await ctx.close(); } catch {}
    return buf;
  } catch {
    return null;
  }
}

/** Downsample an AudioBuffer to N peak values in [0, 1]. */
function extractPeaks(buffer: AudioBuffer, sampleCount: number): number[] {
  const length = buffer.length;
  const channels = buffer.numberOfChannels;
  const windowSize = Math.max(1, Math.floor(length / sampleCount));
  const peaks: number[] = new Array(sampleCount).fill(0);

  const chans: Float32Array[] = [];
  for (let c = 0; c < channels; c++) chans.push(buffer.getChannelData(c));

  for (let i = 0; i < sampleCount; i++) {
    const start = i * windowSize;
    const end = Math.min(start + windowSize, length);
    let max = 0;
    for (let c = 0; c < channels; c++) {
      const data = chans[c];
      for (let j = start; j < end; j++) {
        const v = Math.abs(data[j]);
        if (v > max) max = v;
      }
    }
    peaks[i] = max;
  }

  let peakMax = 0;
  for (const p of peaks) if (p > peakMax) peakMax = p;
  if (peakMax > 0) {
    for (let i = 0; i < peaks.length; i++) peaks[i] /= peakMax;
  }
  return peaks;
}

export async function extractWaveform(
  file: File,
  sampleCount: number = 500,
): Promise<WaveformData | null> {
  const buffer = await decodeAudioFile(file);
  if (!buffer) return null;
  const peaks = extractPeaks(buffer, sampleCount);
  return {
    peaks,
    duration: buffer.duration,
    sampleRate: buffer.sampleRate,
  };
}

export interface WaveformStyle {
  fill: string;
  bg?: string;
  progress?: number;  // 0..1
  barGap?: number;
  dimOpacity?: number;
}

export function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: number[],
  style: WaveformStyle,
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || canvas.width;
  const cssH = canvas.clientHeight || canvas.height;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  if (style.bg) {
    ctx.fillStyle = style.bg;
    ctx.fillRect(0, 0, cssW, cssH);
  }

  if (!peaks.length) return;

  const n = peaks.length;
  const gap = style.barGap ?? 1;
  const barW = Math.max(1, (cssW - gap * (n - 1)) / n);
  const midY = cssH / 2;
  const progressX = (style.progress ?? 0) * cssW;
  const dimA = style.dimOpacity ?? 0.35;

  for (let i = 0; i < n; i++) {
    const x = i * (barW + gap);
    const h = Math.max(2, peaks[i] * (cssH * 0.9));
    const y = midY - h / 2;
    if (x + barW <= progressX) {
      ctx.fillStyle = style.fill;
    } else {
      ctx.globalAlpha = dimA;
      ctx.fillStyle = style.fill;
      ctx.globalAlpha = 1;
    }
    ctx.fillRect(x, y, barW, h);
  }
}