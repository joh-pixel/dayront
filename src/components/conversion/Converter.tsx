import { useState, useEffect, useRef } from 'preact/hooks';
import FileDropzone from './FileDropzone';
import ProgressBar, { useSmoothProgress } from './ProgressBar';
import PrivacyToggle from './PrivacyToggle';
import SettingField from './SettingField';
import FileHero from './FileHero';
import SettingsSheet, { type SettingsPreset } from './SettingsSheet';

import {
  convertFile,
  cutAudio,
  mergeAudio,
  compressAudio,
  boostVolume,
  changeSpeed,
  reverseAudio,
  stereoToMono,
  denoiseAudio,
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
  // ── Audio-production batch ──
  fadeAudio,
  normalizeLoudness,
  dynamicCompressAudio,
  gateAudio,
  limitAudio,
  removeSilence,
  equalizeAudio,
  resampleAudio,
  changeChannels,
  crossfadeAudio,
  dehumAudio,
  reverbAudio,
  karaokeAudio,
  makeRingtone,
  meterLoudness,
  type LoudnessReading,
} from '../../lib/ffmpeg';

import {
  checkWebCapacity,
  isMemoryError,
  ToolFallbackError,
  type FallbackReason,
} from '../../core/toolRunner';

import { cleanFileName, makeOutputName } from '../../core/save';

import { saveFile } from '../../lib/db';
import { formatBytes } from '../../lib/utils';

type ToolType =
  | 'convert'
  | 'cut'
  | 'merge'
  | 'compress'
  | 'boost'
  | 'speed'
  | 'reverse'
  | 'stereo-to-mono'
  | 'denoise'
  | 'video-compress'
  | 'video-cut'
  | 'video-merge'
  | 'video-to-gif'
  | 'gif-to-video'
  | 'resize-video'
  | 'crop-video'
  | 'change-fps'
  | 'mute-video'
  | 'extract-audio'
  | 'convert-video'
  | 'resolution-convert'
  | 'fade'
  | 'normalize'
  | 'dynamic-compress'
  | 'gate'
  | 'limit'
  | 'silence-remove'
  | 'equalize'
  | 'resample'
  | 'channels'
  | 'crossfade'
  | 'dehum'
  | 'reverb'
  | 'karaoke'
  | 'ringtone'
  | 'loudness-meter';

/* ── Friendly option type ───────────────────────────────── */
export interface SettingOption {
  value: string | number;
  label: string;
}

export interface SettingDef {
  name: string;
  label: string;
  type: 'range' | 'number' | 'select';
  min?: number;
  max?: number;
  options?: Array<string | SettingOption>;
  default: string | number;
}

interface ToolConfig {
  type: ToolType;
  from?: string;
  to?: string;
  outputFormat?: string;
  label?: string;
  settings?: SettingDef[];
  presetWidth?: number;
  presetHeight?: number;
  requiresDesktop?: boolean;
}

/* ═══════════════════════════════════════════════════════════
   PRESETS — chips shown at the top of the settings sheet.
   Each preset is a full record of settings that get applied
   on tap. Only tools with a `type` key here get preset chips.
   ═══════════════════════════════════════════════════════════ */

const TOOL_PRESETS: Partial<Record<ToolType, SettingsPreset[]>> = {
  gate: [
    { name: 'Voice',   icon: '🎙️', settings: { threshold: -50, ratio: 4, attack: 10, release: 200 } },
    { name: 'Podcast', icon: '🎧', settings: { threshold: -45, ratio: 8, attack: 5,  release: 250 } },
    { name: 'Music',   icon: '🎵', settings: { threshold: -60, ratio: 3, attack: 20, release: 300 } },
  ],
  equalize: [
    { name: 'Voice',        icon: '🎙️', settings: { bass: -2, mid: 2, treble: 1 } },
    { name: 'Podcast',      icon: '🎧', settings: { bass: -3, mid: 2, treble: 2 } },
    { name: 'Music',        icon: '🎵', settings: { bass: 2,  mid: 0, treble: 1 } },
    { name: 'Bass Boost',   icon: '🔊', settings: { bass: 6,  mid: 0, treble: 0 } },
    { name: 'Treble Boost', icon: '✨', settings: { bass: 0,  mid: 0, treble: 5 } },
  ],
  normalize: [
    { name: 'Spotify',   icon: '🎵', settings: { targetLufs: -14, truePeak: -1.5, lra: 11 } },
    { name: 'YouTube',   icon: '📺', settings: { targetLufs: -14, truePeak: -1.5, lra: 11 } },
    { name: 'Podcasts',  icon: '🎧', settings: { targetLufs: -16, truePeak: -1.5, lra: 11 } },
    { name: 'Broadcast', icon: '📻', settings: { targetLufs: -23, truePeak: -1,   lra: 15 } },
  ],
  'dynamic-compress': [
    { name: 'Gentle',     icon: '🌿', settings: { threshold: -15, ratio: 2, attack: 30, release: 300, makeup: 1 } },
    { name: 'Standard',   icon: '⚖️', settings: { threshold: -20, ratio: 4, attack: 20, release: 250, makeup: 3 } },
    { name: 'Aggressive', icon: '🔥', settings: { threshold: -25, ratio: 8, attack: 10, release: 150, makeup: 6 } },
    { name: 'Voice-over', icon: '🎙️', settings: { threshold: -18, ratio: 3, attack: 15, release: 300, makeup: 3 } },
  ],
  limit: [
    { name: 'Streaming', icon: '🎵', settings: { ceiling: -1,   attack: 5, release: 50 } },
    { name: 'Video',     icon: '🎬', settings: { ceiling: -3,   attack: 5, release: 50 } },
    { name: 'Max Loud',  icon: '🔥', settings: { ceiling: -0.3, attack: 3, release: 80 } },
  ],
  fade: [
    { name: 'Short', icon: '⚡', settings: { fadeIn: 0.5, fadeOut: 0.5, curve: 'tri' } },
    { name: 'Music', icon: '🎵', settings: { fadeIn: 2,   fadeOut: 3,   curve: 'tri' } },
    { name: 'Long',  icon: '🌅', settings: { fadeIn: 5,   fadeOut: 5,   curve: 'qsin' } },
    { name: 'Bump',  icon: '💥', settings: { fadeIn: 0.2, fadeOut: 0.2, curve: 'exp' } },
  ],
  'silence-remove': [
    { name: 'Tight',    icon: '⚡', settings: { threshold: -40, minSilence: 0.3, keepSilence: 0.05 } },
    { name: 'Standard', icon: '⚖️', settings: { threshold: -40, minSilence: 0.5, keepSilence: 0.1  } },
    { name: 'Relaxed',  icon: '🌊', settings: { threshold: -40, minSilence: 1.0, keepSilence: 0.3  } },
  ],
  crossfade: [
    { name: 'Quick',    icon: '⚡', settings: { duration: 0.5, curve: 'tri'  } },
    { name: 'Standard', icon: '🎵', settings: { duration: 1.5, curve: 'tri'  } },
    { name: 'DJ Mix',   icon: '🎧', settings: { duration: 5,   curve: 'qsin' } },
    { name: 'Ambient',  icon: '🌊', settings: { duration: 10,  curve: 'log'  } },
  ],
  dehum: [
    { name: '50 Hz EU',   icon: '⚡', settings: { frequency: 50, harmonics: 3 } },
    { name: '60 Hz US',   icon: '⚡', settings: { frequency: 60, harmonics: 3 } },
    { name: 'Aggressive', icon: '🔥', settings: { frequency: 50, harmonics: 5 } },
  ],
  reverb: [
    { name: 'Subtle',   icon: '🌫️', settings: { delayMs: 50,  decay: 0.4 } },
    { name: 'Standard', icon: '🌊', settings: { delayMs: 100, decay: 0.5 } },
    { name: 'Hall',     icon: '🏛️', settings: { delayMs: 200, decay: 0.7 } },
    { name: 'Canyon',   icon: '🏔️', settings: { delayMs: 500, decay: 0.8 } },
  ],
  resample: [
    { name: 'Music',     icon: '🎵', settings: { sampleRate: 44100, bitDepth: 16 } },
    { name: 'Video',     icon: '🎬', settings: { sampleRate: 48000, bitDepth: 24 } },
    { name: 'Hi-Res',    icon: '✨', settings: { sampleRate: 96000, bitDepth: 24 } },
    { name: 'Telephone', icon: '📞', settings: { sampleRate: 8000,  bitDepth: 16 } },
  ],
  'video-compress': [
    { name: 'High Quality', icon: '✨', settings: { crf: 18, preset: 'slow' } },
    { name: 'Balanced',     icon: '⚖️', settings: { crf: 23, preset: 'medium' } },
    { name: 'Small File',   icon: '📦', settings: { crf: 28, preset: 'veryfast' } },
    { name: 'Fast',         icon: '⚡', settings: { crf: 23, preset: 'ultrafast' } },
  ],
  'video-to-gif': [
    { name: 'Small',        icon: '📦', settings: { fps: 10, width: 240 } },
    { name: 'Standard',     icon: '⚖️', settings: { fps: 10, width: 320 } },
    { name: 'Smooth',       icon: '✨', settings: { fps: 15, width: 480 } },
    { name: 'High Quality', icon: '💎', settings: { fps: 24, width: 640 } },
  ],
};

/**
 * Return a compact one-line summary of the current settings, for the
 * "Adjust settings" trigger card. Falls back gracefully when the tool
 * has no settings or the values are unexpected.
 */
function summarizeSettings(
  tool: ToolConfig,
  values: Record<string, string | number>,
): string {
  const settings = tool.settings ?? [];
  if (settings.length === 0) return 'No settings to configure';

  const parts: string[] = [];
  for (const setting of settings.slice(0, 3)) {
    const raw = values[setting.name] ?? setting.default;
    if (setting.type === 'select' && setting.options) {
      const match = setting.options.find((o) =>
        typeof o === 'string'
          ? String(o) === String(raw)
          : String(o.value) === String(raw),
      );
      const label =
        typeof match === 'string'
          ? match
          : match && typeof match === 'object' && 'label' in match
            ? match.label
            : String(raw);
      // Keep it short — first clause before an em-dash, max 2 words.
      const short = label.split('—')[0].trim().split(' ').slice(0, 2).join(' ');
      parts.push(short || String(raw));
    } else {
      parts.push(String(raw));
    }
  }
  if (settings.length > 3) parts.push(`+${settings.length - 3} more`);
  return parts.join(' · ');
}

/** Match current settings to a preset name, or undefined. */
function findActivePreset(
  presets: SettingsPreset[] | undefined,
  values: Record<string, string | number>,
): string | undefined {
  if (!presets) return undefined;
  for (const preset of presets) {
    const keys = Object.keys(preset.settings);
    const allMatch = keys.every(
      (k) => String(values[k]) === String(preset.settings[k]),
    );
    if (allMatch) return preset.name;
  }
  return undefined;
}

/**
 * Video extensions recognised by the audio-with-copied-video tools (denoise,
 * fade, normalize, dehum, ringtone, loudness-meter). Video stream is copied,
 * only the audio is processed.
 */
const AUDIO_VIDEO_EXTS = new Set([
  'mp4', 'm4v', 'mov', 'mkv', 'avi', 'webm', 'flv',
]);

function getAudioVideoContainer(file: File | undefined): string {
  if (!file) return '';
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!AUDIO_VIDEO_EXTS.has(ext)) return '';
  return ext === 'webm' ? 'webm' : 'mp4';
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      const mobileByUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const mobileByWidth = window.innerWidth < 768;
      setIsMobile(mobileByUA || mobileByWidth);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function getAllowedExtensions(config: ToolConfig): string[] {
  if (config.type === 'resolution-convert') {
    return ['mp4', 'mov', 'mkv', 'avi', 'webm', 'flv'];
  }

  if (config.from) {
    const formatMap: Record<string, string[]> = {
      mp3: ['mp3'], wav: ['wav'], mp4: ['mp4', 'm4v'], flac: ['flac'],
      m4a: ['m4a'], mov: ['mov', 'qt'], webm: ['webm'], aac: ['aac'],
      ogg: ['ogg', 'oga'], opus: ['opus'], avi: ['avi'], mkv: ['mkv'],
      aiff: ['aiff', 'aif'], amr: ['amr'], ape: ['ape'], flv: ['flv'], gif: ['gif'],
    };
    return formatMap[config.from] || [];
  }

  switch (config.type) {
    case 'cut':
    case 'merge':
    case 'compress':
    case 'boost':
    case 'speed':
    case 'reverse':
    case 'stereo-to-mono':
    case 'dynamic-compress':
    case 'gate':
    case 'limit':
    case 'silence-remove':
    case 'equalize':
    case 'resample':
    case 'channels':
    case 'crossfade':
    case 'reverb':
    case 'karaoke':
      return ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac', 'opus', 'aiff', 'amr', 'ape'];

    case 'denoise':
    case 'fade':
    case 'normalize':
    case 'dehum':
    case 'ringtone':
    case 'loudness-meter':
      return [
        'mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac', 'opus', 'aiff', 'amr', 'ape',
        'mp4', 'mov', 'mkv', 'avi', 'webm', 'flv', 'm4v',
      ];

    case 'video-compress':
    case 'video-cut':
    case 'video-merge':
    case 'video-to-gif':
    case 'resize-video':
    case 'crop-video':
    case 'change-fps':
    case 'mute-video':
    case 'extract-audio':
      return ['mp4', 'mov', 'mkv', 'avi', 'webm', 'flv'];

    case 'gif-to-video':
      return ['gif'];

    case 'convert':
    case 'convert-video':
      return [];

    default:
      return [];
  }
}

/* ══════════════════════════════════════════════════════════════
   NATIVE APP PROMO
   ══════════════════════════════════════════════════════════════ */

const APP_DOWNLOAD_URL = 'https://download.dayront.com';

function reasonToHeadline(reason: FallbackReason | 'desktop-only'): string {
  switch (reason) {
    case 'file-too-large':    return 'This file needs the app';
    case 'out-of-memory':     return 'Your browser ran out of memory';
    case 'timeout':           return 'This job is taking too long in the browser';
    case 'desktop-only':      return 'Best on the Dayront App';
    default:                  return 'Use the Dayront App for this file';
  }
}

function reasonToBody(
  reason: FallbackReason | 'desktop-only',
  totalMB: number,
  isMobile: boolean,
): string {
  const sizeLabel = totalMB >= 1024
    ? `${(totalMB / 1024).toFixed(2)} GB`
    : `${Math.round(totalMB)} MB`;

  switch (reason) {
    case 'file-too-large':
      return `Your file is ${sizeLabel}. Browsers cap out around ${
        isMobile ? '250 MB' : '500 MB'
      } because they rely on WebAssembly. The Dayront App uses a native engine — no caps, no crashes.`;
    case 'out-of-memory':
      return `The browser tab ran out of memory while working on your ${sizeLabel} file. The Dayront App ships a native FFmpeg engine with no memory limits and processes up to 5 GB at 10× the speed.`;
    case 'timeout':
      return `Processing a ${sizeLabel} file in the browser can take minutes and sometimes stalls. The Dayront App does the same job in seconds — fully offline.`;
    case 'desktop-only':
      return `This tool needs more processing power than a mobile browser can give. For the best experience, use the Dayront App (Android) for native speed, or a desktop computer with 8 GB+ RAM.`;
    default:
      return 'The Dayront App handles large files, runs 10× faster, and works fully offline.';
  }
}

export function NativeAppPromo({
  reason, totalMB, isMobile, onTryAnyway, canBypass,
}: {
  reason: FallbackReason | 'desktop-only';
  totalMB: number;
  isMobile: boolean;
  onTryAnyway?: () => void;
  canBypass: boolean;
}) {
  return (
    <div class="w-full overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-sm dark:border-sky-900/60 dark:from-sky-950/50 dark:to-gray-900">
      <div class="flex items-center gap-2 border-b border-sky-100 bg-sky-500/10 px-5 py-2.5 dark:border-sky-900/60">
        <span class="h-2 w-2 rounded-full bg-sky-500 animate-pulse" aria-hidden="true" />
        <span class="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
          Recommended: Dayront App
        </span>
      </div>

      <div class="p-6">
        <div class="flex items-start gap-4">
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-2xl shadow-md">
            📱
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
              {reasonToHeadline(reason)}
            </h3>
            <p class="mt-1.5 text-sm leading-6 text-gray-700 dark:text-gray-300">
              {reasonToBody(reason, totalMB, isMobile)}
            </p>
          </div>
        </div>

        <ul class="mt-5 grid gap-2 sm:grid-cols-3">
          <li class="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold text-gray-800 dark:bg-gray-800/70 dark:text-gray-200">
            <span aria-hidden="true">⚡</span> 10× faster
          </li>
          <li class="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold text-gray-800 dark:bg-gray-800/70 dark:text-gray-200">
            <span aria-hidden="true">📁</span> Up to 5 GB files
          </li>
          <li class="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold text-gray-800 dark:bg-gray-800/70 dark:text-gray-200">
            <span aria-hidden="true">🔒</span> 100% offline
          </li>
        </ul>

        <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={APP_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-sky-600 active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            Download the App
          </a>
          {canBypass && onTryAnyway && (
            <button
              type="button"
              onClick={onTryAnyway}
              class="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Try anyway in browser
            </button>
          )}
        </div>

        <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Android available now · iOS, Windows, macOS &amp; Linux coming soon.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */

export default function Converter({
  toolConfig,
}: {
  toolConfig: ToolConfig;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [meterReading, setMeterReading] = useState<LoudnessReading | null>(null);
  const [outputFilename, setOutputFilename] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [promo, setPromo] = useState<
    { reason: FallbackReason | 'desktop-only'; totalMB: number } | null
  >(null);
  const [bypassPromo, setBypassPromo] = useState(false);

  const [settingsState, setSettingsState] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    toolConfig.settings?.forEach((setting) => {
      initial[setting.name] = setting.default;
    });
    return initial;
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isMobile = useIsMobile();
  const isDesktopOnlyTool = isMobile && toolConfig.requiresDesktop === true;

  const smoothProgress = useSmoothProgress(progress);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clampProgress(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function updateProgress(value: number) {
    setProgress(clampProgress(value));
  }

  function getSetting(name: string) {
    return settingsState[name];
  }

  function updateSetting(name: string, value: string | number) {
    setSettingsState((previous) => ({ ...previous, [name]: value }));
  }

  function applyPreset(preset: Record<string, string | number>) {
    setSettingsState((previous) => ({ ...previous, ...preset }));
  }

  function sanitizeFiles(selected: File[]): File[] {
    return selected.map((file) => {
      const clean = cleanFileName(file.name);
      if (clean === file.name) return file;
      try {
        return new File([file], clean, { type: file.type });
      } catch {
        return file;
      }
    });
  }

  function handleFiles(selected: File[]) {
    if (processing) return;
    const cleaned = sanitizeFiles(selected);
    setFiles(cleaned);
    setResultBlob(null);
    setMeterReading(null);
    setOutputFilename('');
    setError(null);
    setProgress(0);
    setBypassPromo(false);

    const capacity = checkWebCapacity(cleaned, isMobile);
    if (capacity) setPromo({ reason: capacity.reason, totalMB: capacity.totalMB });
    else setPromo(null);

    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  }

  function removeFile(index: number) {
    if (processing) return;
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    if (next.length === 0) {
      setPromo(null);
      setBypassPromo(false);
    } else {
      const capacity = checkWebCapacity(next, isMobile);
      if (capacity) setPromo({ reason: capacity.reason, totalMB: capacity.totalMB });
      else setPromo(null);
    }
  }

  function handleTryAnyway() {
    setBypassPromo(true);
  }

  async function startConversion() {
    if (files.length === 0 || processing) return;
    if (promo && !bypassPromo) return;

    setProcessing(true);
    setProgress(0);
    setError(null);
    setResultBlob(null);
    setMeterReading(null);
    setOutputFilename('');

    try {
      let output: Blob;
      const type = toolConfig.type;

      switch (type) {
        case 'cut': {
          const start = Math.max(0, Number(getSetting('start') ?? 0));
          const duration = Math.max(0.01, Number(getSetting('duration') ?? 30));
          output = await cutAudio(files[0], start, duration,
            toolConfig.outputFormat || 'mp3', privacy, updateProgress);
          break;
        }
        case 'merge': {
          if (files.length < 2) throw new Error('Please select at least 2 audio files.');
          output = await mergeAudio(files, toolConfig.outputFormat || 'mp3', privacy, updateProgress);
          break;
        }
        case 'compress': {
          output = await compressAudio(files[0], Number(getSetting('quality') ?? 3),
            toolConfig.outputFormat || 'mp3', privacy, updateProgress);
          break;
        }
        case 'boost': {
          output = await boostVolume(files[0], Number(getSetting('gain') ?? 6),
            toolConfig.outputFormat || 'mp3', privacy, updateProgress);
          break;
        }
        case 'speed': {
          output = await changeSpeed(files[0], Number(getSetting('factor') ?? 1.5),
            toolConfig.outputFormat || 'mp3', privacy, updateProgress);
          break;
        }
        case 'reverse': {
          output = await reverseAudio(files[0], toolConfig.outputFormat || 'mp3', privacy, updateProgress);
          break;
        }
        case 'stereo-to-mono': {
          output = await stereoToMono(files[0], toolConfig.outputFormat || 'mp3', privacy, updateProgress);
          break;
        }
        case 'denoise': {
          const c = getAudioVideoContainer(files[0]);
          output = await denoiseAudio(files[0], String(getSetting('strength') ?? 'balanced'),
            c || toolConfig.outputFormat || 'mp3', privacy, updateProgress);
          break;
        }
        case 'fade': {
          const c = getAudioVideoContainer(files[0]);
          output = await fadeAudio(files[0],
            Number(getSetting('fadeIn') ?? 2),
            Number(getSetting('fadeOut') ?? 2),
            String(getSetting('curve') ?? 'tri'),
            c || toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'normalize': {
          const c = getAudioVideoContainer(files[0]);
          output = await normalizeLoudness(files[0],
            Number(getSetting('targetLufs') ?? -14),
            Number(getSetting('truePeak') ?? -1.5),
            Number(getSetting('lra') ?? 11),
            c || toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'dynamic-compress': {
          output = await dynamicCompressAudio(files[0],
            Number(getSetting('threshold') ?? -20),
            Number(getSetting('ratio') ?? 4),
            Number(getSetting('attack') ?? 20),
            Number(getSetting('release') ?? 250),
            Number(getSetting('makeup') ?? 0),
            toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'gate': {
          output = await gateAudio(files[0],
            Number(getSetting('threshold') ?? -50),
            Number(getSetting('ratio') ?? 4),
            Number(getSetting('attack') ?? 10),
            Number(getSetting('release') ?? 200),
            toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'limit': {
          output = await limitAudio(files[0],
            Number(getSetting('ceiling') ?? -1),
            Number(getSetting('attack') ?? 5),
            Number(getSetting('release') ?? 50),
            toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'silence-remove': {
          output = await removeSilence(files[0],
            Number(getSetting('threshold') ?? -40),
            Number(getSetting('minSilence') ?? 0.5),
            Number(getSetting('keepSilence') ?? 0.1),
            toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'equalize': {
          output = await equalizeAudio(files[0],
            Number(getSetting('bass') ?? 0),
            Number(getSetting('mid') ?? 0),
            Number(getSetting('treble') ?? 0),
            toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'resample': {
          output = await resampleAudio(files[0],
            Number(getSetting('sampleRate') ?? 48000),
            Number(getSetting('bitDepth') ?? 16),
            toolConfig.outputFormat || 'wav',
            privacy, updateProgress);
          break;
        }
        case 'channels': {
          output = await changeChannels(files[0],
            String(getSetting('mode') ?? 'stereo-to-mono'),
            toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'crossfade': {
          if (files.length !== 2) throw new Error('Crossfade requires exactly 2 audio files.');
          output = await crossfadeAudio(files,
            Number(getSetting('duration') ?? 1.5),
            String(getSetting('curve') ?? 'tri'),
            toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'dehum': {
          const c = getAudioVideoContainer(files[0]);
          output = await dehumAudio(files[0],
            Number(getSetting('frequency') ?? 50),
            Number(getSetting('harmonics') ?? 3),
            c || toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'reverb': {
          output = await reverbAudio(files[0],
            Number(getSetting('delayMs') ?? 100),
            Number(getSetting('decay') ?? 0.5),
            toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'karaoke': {
          output = await karaokeAudio(files[0],
            toolConfig.outputFormat || 'mp3',
            privacy, updateProgress);
          break;
        }
        case 'ringtone': {
          const c = getAudioVideoContainer(files[0]);
          output = await makeRingtone(files[0],
            Number(getSetting('start') ?? 0),
            Number(getSetting('duration') ?? 30),
            Number(getSetting('fadeIn') ?? 0.5),
            Number(getSetting('fadeOut') ?? 0.5),
            c || toolConfig.outputFormat || 'm4a',
            privacy, updateProgress);
          break;
        }
        case 'loudness-meter': {
          const reading = await meterLoudness(files[0], updateProgress);
          const base = files[0].name.replace(/\.[^.]+$/, '');
          setMeterReading(reading);
          setOutputFilename(`${base}-loudness.txt`);
          setProgress(100);
          setProcessing(false);
          return;
        }
        case 'convert': {
          output = await convertFile(files[0], toolConfig.to || 'mp3', privacy, updateProgress);
          break;
        }
        case 'video-compress': {
          output = await compressVideo(files[0], Number(getSetting('crf') ?? 23),
            String(getSetting('preset') ?? 'medium'),
            toolConfig.outputFormat || 'mp4', privacy, updateProgress);
          break;
        }
        case 'video-cut': {
          const start = Math.max(0, Number(getSetting('start') ?? 0));
          const duration = Math.max(0.01, Number(getSetting('duration') ?? 30));
          output = await cutVideo(files[0], start, duration,
            toolConfig.outputFormat || 'mp4', privacy, updateProgress);
          break;
        }
        case 'video-merge': {
          if (files.length < 2) throw new Error('Please select at least 2 video files.');
          output = await mergeVideos(files, toolConfig.outputFormat || 'mp4', privacy, updateProgress);
          break;
        }
        case 'video-to-gif': {
          output = await videoToGif(files[0], Number(getSetting('fps') ?? 10),
            Number(getSetting('width') ?? 320), privacy, updateProgress);
          break;
        }
        case 'gif-to-video': {
          output = await gifToMp4(files[0], privacy, updateProgress);
          break;
        }
        case 'resize-video': {
          output = await resizeVideo(files[0],
            Number(getSetting('width') ?? 1280),
            Number(getSetting('height') ?? 720),
            toolConfig.outputFormat || 'mp4', privacy, updateProgress);
          break;
        }
        case 'resolution-convert': {
          const w = toolConfig.presetWidth ?? 1920;
          const h = toolConfig.presetHeight ?? 1080;
          output = await resolutionConvert(files[0], w, h,
            toolConfig.outputFormat || 'mp4', privacy, updateProgress);
          break;
        }
        case 'crop-video': {
          output = await cropVideo(files[0],
            Number(getSetting('x') ?? 0), Number(getSetting('y') ?? 0),
            Number(getSetting('w') ?? 640), Number(getSetting('h') ?? 480),
            toolConfig.outputFormat || 'mp4', privacy, updateProgress);
          break;
        }
        case 'change-fps': {
          output = await changeFPS(files[0], Number(getSetting('fps') ?? 30),
            toolConfig.outputFormat || 'mp4', privacy, updateProgress);
          break;
        }
        case 'mute-video': {
          output = await muteVideo(files[0], toolConfig.outputFormat || 'mp4', privacy, updateProgress);
          break;
        }
        case 'extract-audio': {
          output = await extractAudio(files[0], String(getSetting('format') ?? 'mp3'),
            privacy, updateProgress);
          break;
        }
        case 'convert-video': {
          output = await convertFile(files[0], toolConfig.to || 'mp4', privacy, updateProgress);
          break;
        }
        default:
          throw new Error('Unsupported tool.');
      }

      const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await saveFile(id, output);

      const containerOverride = (
        type === 'denoise' || type === 'fade' || type === 'normalize' ||
        type === 'dehum' || type === 'ringtone'
      ) ? getAudioVideoContainer(files[0]) : '';

      const format =
        containerOverride ||
        toolConfig.outputFormat ||
        toolConfig.to ||
        'mp3';

      const originalName = files[0]?.name || 'my-file';
      const filename = makeOutputName(
        toolConfig.type + '-conversion',
        originalName,
        format,
      );

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(output);
      setPreviewUrl(url);
      setResultBlob(output);
      setOutputFilename(filename);
      setProgress(100);
      setPromo(null);
    } catch (e: unknown) {
      if (e instanceof ToolFallbackError) {
        setPromo({ reason: e.reason, totalMB: e.fileSizeMB });
        setBypassPromo(false);
      } else if (isMemoryError(e)) {
        const totalMB = files.reduce((s, f) => s + f.size, 0) / (1024 * 1024);
        setPromo({ reason: 'out-of-memory', totalMB });
        setBypassPromo(false);
      } else {
        const message = e instanceof Error ? e.message : String(e);
        setError(message || 'An error occurred while processing your file.');
      }
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = outputFilename || 'output.mp3';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadMeterReport() {
    if (!meterReading) return;
    const text = [
      'Dayront — Loudness Report',
      '═══════════════════════════════════════',
      `Integrated loudness:  ${meterReading.integratedLufs.toFixed(2)} LUFS`,
      `True peak:            ${meterReading.truePeakDb.toFixed(2)} dBTP`,
      `Loudness range (LRA): ${meterReading.loudnessRangeLu.toFixed(2)} LU`,
      '',
      'Reference targets:',
      '  Spotify / YouTube / Amazon Music ..... -14 LUFS',
      '  Apple Podcasts / Apple Music ......... -16 LUFS',
      '  General web streaming ................ -18 LUFS',
      '  Broadcast (EBU R128) ................. -23 LUFS',
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFilename || 'loudness-report.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function resetAll() {
    setFiles([]);
    setResultBlob(null);
    setMeterReading(null);
    setOutputFilename('');
    setError(null);
    setProgress(0);
    setProcessing(false);
    setPromo(null);
    setBypassPromo(false);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
  }

  const settings = toolConfig.settings || [];
  const multipleAllowed =
    toolConfig.type === 'merge' ||
    toolConfig.type === 'video-merge' ||
    toolConfig.type === 'crossfade';
  const allowedExtensions = getAllowedExtensions(toolConfig);

  const containerOverride = (
    toolConfig.type === 'denoise' ||
    toolConfig.type === 'fade' ||
    toolConfig.type === 'normalize' ||
    toolConfig.type === 'dehum' ||
    toolConfig.type === 'ringtone'
  ) ? getAudioVideoContainer(files[0]) : '';

  const outputFormat =
    containerOverride ||
    toolConfig.outputFormat ||
    toolConfig.to ||
    'mp3';

  const isVideoPreview = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'gif'].includes(outputFormat) || outputFormat === 'gif';
  const isGif = outputFormat === 'gif';

  const toolPresets = TOOL_PRESETS[toolConfig.type];
  const activePreset = findActivePreset(toolPresets, settingsState);
  const settingsSummary = summarizeSettings(toolConfig, settingsState);

  function getLoadingLabel(): string {
    if (progress > 0) return 'Processing your file…';
    if (smoothProgress < 4) return 'Downloading FFmpeg engine…';
    if (smoothProgress < 8) return 'Compiling WASM (this takes a moment)…';
    if (smoothProgress < 12) return 'Almost ready…';
    return 'Still loading FFmpeg…';
  }

  /* ─────────── Blocking states ─────────── */

  if (isDesktopOnlyTool) {
    return (
      <div class="w-full">
        <NativeAppPromo
          reason="desktop-only"
          totalMB={files.reduce((s, f) => s + f.size, 0) / (1024 * 1024)}
          isMobile={true}
          canBypass={false}
        />
      </div>
    );
  }

  if (promo && !bypassPromo && !resultBlob && !meterReading) {
    return (
      <div class="w-full space-y-6 text-gray-900 dark:text-gray-100">
        <NativeAppPromo
          reason={promo.reason}
          totalMB={promo.totalMB}
          isMobile={isMobile}
          canBypass={true}
          onTryAnyway={handleTryAnyway}
        />

        {files.length > 0 && (
          <FileHero
            files={files}
            multiple={multipleAllowed}
            onRemove={removeFile}
          />
        )}

        <button
          type="button"
          onClick={resetAll}
          class="w-full rounded-xl border border-gray-300 bg-gray-100 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-200 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        >
          Choose different files
        </button>
      </div>
    );
  }

  /* ─────────── Main UI ─────────── */

  return (
    <div class="w-full space-y-6 text-gray-900 dark:text-gray-100">
      {!resultBlob && !meterReading && (
        <>
          <FileDropzone
            onFilesSelected={handleFiles}
            multiple={multipleAllowed}
            allowedExtensions={allowedExtensions}
          />

          {files.length > 0 && (
            <FileHero
              files={files}
              multiple={multipleAllowed}
              onRemove={removeFile}
            />
          )}

          {settings.length > 0 && (
            <SettingsSheet
              summary={settingsSummary}
              toolName={toolConfig.label || 'Tool'}
              presets={toolPresets}
              activePresetName={activePreset}
              onApplyPreset={applyPreset}
              disabled={processing}
            >
              {settings.map((setting) => (
                <SettingField
                  key={setting.name}
                  setting={setting}
                  value={settingsState[setting.name] ?? setting.default}
                  onChange={(v) => updateSetting(setting.name, v)}
                  disabled={processing}
                />
              ))}
            </SettingsSheet>
          )}

          <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <PrivacyToggle checked={privacy} onChange={setPrivacy} />
          </div>

          <button
            type="button"
            disabled={files.length === 0 || processing}
            onClick={startConversion}
            aria-busy={processing}
            class="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-sky-500 px-6 py-3.5 font-semibold text-white shadow-sm transition-all hover:bg-sky-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            {processing ? (
              <>
                <svg class="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing…
              </>
            ) : (
              `Start ${toolConfig.label || 'Conversion'}`
            )}
          </button>

          {processing && (
            <div
              class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
              role="status"
              aria-live="polite"
              aria-label={`Processing ${Math.round(smoothProgress)}% complete`}
            >
              <div class="px-5 py-4">
                <div class="mb-3 flex items-center justify-between gap-4">
                  <div class="flex min-w-0 items-center gap-2.5">
                    <span class="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-sky-500" aria-hidden="true" />
                    <span class="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {getLoadingLabel()}
                    </span>
                  </div>
                  <span class="shrink-0 text-sm font-bold tabular-nums text-sky-600 dark:text-sky-400">
                    {Math.round(smoothProgress)}%
                  </span>
                </div>

                <ProgressBar percent={smoothProgress} />

                {progress === 0 && smoothProgress >= 12 && (
                  <p class="mt-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    First-time load can take 1–2 minutes on mobile. Please keep this tab open.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div class="overflow-hidden rounded-2xl border border-red-200 bg-red-50 shadow-sm dark:border-red-900/70 dark:bg-red-950/40">
          <div class="p-5">
            <div class="flex gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600 dark:bg-red-900/50 dark:text-red-300">!</div>
              <div class="min-w-0">
                <p class="font-semibold text-red-900 dark:text-red-100">Something went wrong</p>
                <p class="mt-1 break-words text-sm leading-6 text-red-700 dark:text-red-300">{error}</p>
                <button
                  type="button"
                  class="mt-3 font-semibold text-red-700 underline decoration-red-300 underline-offset-4 hover:no-underline dark:text-red-300 dark:decoration-red-700"
                  onClick={resetAll}
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {meterReading && (
        <div class="overflow-hidden rounded-2xl border border-sky-200 bg-sky-50 shadow-sm dark:border-sky-900/70 dark:bg-sky-950/30">
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xl dark:bg-sky-900/50">📊</div>
              <div class="min-w-0">
                <h2 class="text-lg font-bold text-sky-900 dark:text-sky-100">Loudness analysis</h2>
                <p class="mt-1 text-xs font-medium text-sky-600 dark:text-sky-400">EBU R128 / ITU-R BS.1770-4</p>
              </div>
            </div>

            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <div class="rounded-xl border border-sky-200 bg-white p-4 dark:border-sky-900/50 dark:bg-gray-900">
                <p class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Integrated</p>
                <p class="mt-1 text-2xl font-extrabold tabular-nums text-gray-900 dark:text-white">
                  {meterReading.integratedLufs.toFixed(2)}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">LUFS</p>
              </div>
              <div class="rounded-xl border border-sky-200 bg-white p-4 dark:border-sky-900/50 dark:bg-gray-900">
                <p class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">True peak</p>
                <p class="mt-1 text-2xl font-extrabold tabular-nums text-gray-900 dark:text-white">
                  {meterReading.truePeakDb.toFixed(2)}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">dBTP</p>
              </div>
              <div class="rounded-xl border border-sky-200 bg-white p-4 dark:border-sky-900/50 dark:bg-gray-900">
                <p class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Range (LRA)</p>
                <p class="mt-1 text-2xl font-extrabold tabular-nums text-gray-900 dark:text-white">
                  {meterReading.loudnessRangeLu.toFixed(2)}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">LU</p>
              </div>
            </div>

            <div class="mt-5 rounded-xl border border-sky-200 bg-white p-4 dark:border-sky-900/50 dark:bg-gray-900">
              <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Reference targets</p>
              <ul class="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li class="flex items-center justify-between"><span>Spotify / YouTube / Amazon Music</span><span class="font-mono">-14 LUFS</span></li>
                <li class="flex items-center justify-between"><span>Apple Podcasts / Apple Music</span><span class="font-mono">-16 LUFS</span></li>
                <li class="flex items-center justify-between"><span>General web streaming</span><span class="font-mono">-18 LUFS</span></li>
                <li class="flex items-center justify-between"><span>Broadcast (EBU R128)</span><span class="font-mono">-23 LUFS</span></li>
              </ul>
            </div>
          </div>

          <div class="border-t border-sky-200 bg-white p-5 dark:border-sky-900/70 dark:bg-gray-900/60">
            <div class="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={downloadMeterReport}
                class="w-full rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-600 active:scale-[0.98]"
              >
                Download Report
              </button>
              <button
                type="button"
                onClick={resetAll}
                class="w-full rounded-xl border border-gray-300 bg-gray-100 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-200 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Measure Another File
              </button>
            </div>
          </div>
        </div>
      )}

      {resultBlob && (
        <div class="overflow-hidden rounded-2xl border border-green-200 bg-green-50 shadow-sm dark:border-green-900/70 dark:bg-green-950/30">
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700 dark:bg-green-900/50 dark:text-green-300">✓</div>
              <div class="min-w-0">
                <h2 class="text-lg font-bold text-green-900 dark:text-green-100">Your file is ready</h2>
                <p class="mt-1 break-all text-sm font-medium text-green-700 dark:text-green-300">{outputFilename}</p>
                <p class="mt-1 text-xs font-medium text-green-600 dark:text-green-400">{formatBytes(resultBlob.size)}</p>
              </div>
            </div>

            {previewUrl && (
              <div class="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                {isGif ? (
                  <img src={previewUrl} alt="Preview" class="w-full h-auto" />
                ) : isVideoPreview ? (
                  <video controls class="w-full max-h-96" src={previewUrl}>
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <audio controls class="w-full" src={previewUrl}>
                    Your browser does not support the audio element.
                  </audio>
                )}
              </div>
            )}
          </div>

          <div class="border-t border-green-200 bg-white p-5 dark:border-green-900/70 dark:bg-gray-900/60">
            <div class="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={download}
                class="w-full rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-600 active:scale-[0.98] dark:bg-sky-500 dark:hover:bg-sky-400"
              >
                Download File
              </button>
              <button
                type="button"
                onClick={resetAll}
                class="w-full rounded-xl border border-gray-300 bg-gray-100 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-200 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                Convert Another File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}