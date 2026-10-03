export interface FAQ {
  question: string;
  answer: string;
}

export interface HowToStep {
  title: string;
  text: string;
}

/* --------------------------------------------------------------------------
   ★ FRIENDLY SETTING OPTIONS
   --------------------------------------------------------------------------
   A dropdown option can be:
     - a plain string   → "192k"
     - a friendly pair  → { value: '192k', label: 'High — 192 kbps' }
   `value` is what FFmpeg receives; `label` is what the user sees.
-------------------------------------------------------------------------- */

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
  /** Plain strings OR { value, label } pairs for user-friendly dropdowns */
  options?: Array<string | SettingOption>;
  default: string | number;
}

/* --------------------------------------------------------------------------
   ★ PLATFORM TYPES
-------------------------------------------------------------------------- */

export type ToolTier = 'light' | 'medium' | 'heavy';
export type ToolEngine = 'wasm' | 'native' | 'ai';

export type PlatformType =
  | 'web'
  | 'mobile-web'
  | 'mobile-native'
  | 'desktop-native'
  | 'extension'
  | 'server';

export interface PlatformInfo {
  type: PlatformType;
  label: string;
  engine: 'wasm' | 'native';
  maxMB: number;
}

export interface Tool {
  slug: string;
  name: string;
  category:
    | 'audio-utility'
    | 'audio-conversion'
    | 'video-to-audio'
    | 'video-utility'
    | 'video-conversion'
    | 'ai';
  from?: string;
  to?: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  icon: string;
  type?: string;
  outputFormat?: string;
  settings?: SettingDef[];
  presetWidth?: number;
  presetHeight?: number;
  requiresDesktop?: boolean;
  faq: FAQ[];
  howTo: HowToStep[];
  relatedTools: string[];

  tier?: ToolTier;
  engine?: ToolEngine;
  webMaxMB?: number;
  recommendApp?: boolean;
  webNote?: string;
}

/* --------------------------------------------------------------------------
   REUSABLE FRIENDLY OPTION SETS
   (Kept here so every tool uses the exact same labels.)
-------------------------------------------------------------------------- */

const AUDIO_BITRATE_OPTIONS: SettingOption[] = [
  { value: '128k', label: 'Standard — 128 kbps' },
  { value: '192k', label: 'High — 192 kbps (recommended)' },
  { value: '256k', label: 'Very High — 256 kbps' },
  { value: '320k', label: 'Best — 320 kbps' },
];

const VIDEO_CODEC_OPTIONS: SettingOption[] = [
  { value: 'libx264', label: 'H.264 — Best compatibility (recommended)' },
  { value: 'copy',    label: 'Copy — No re-encoding (fastest)' },
];

const AUDIO_CODEC_OPTIONS: SettingOption[] = [
  { value: 'aac', label: 'AAC — Best compatibility (recommended)' },
  { value: 'copy', label: 'Copy — No re-encoding (fastest)' },
];

const WEBM_VIDEO_CODEC_OPTIONS: SettingOption[] = [
  { value: 'libvpx', label: 'VP8 — Best compatibility (recommended)' },
  { value: 'copy',   label: 'Copy — No re-encoding (fastest)' },
];

const WEBM_AUDIO_CODEC_OPTIONS: SettingOption[] = [
  { value: 'libvorbis', label: 'Vorbis — Best compatibility (recommended)' },
  { value: 'copy',      label: 'Copy — No re-encoding (fastest)' },
];

/* --------------------------------------------------------------------------
   BASE TOOLS
-------------------------------------------------------------------------- */

const baseTools: Tool[] = [
  // ── AUDIO UTILITIES ──────────────────────
  {
    slug: 'audio-cutter',
    name: 'Audio Cutter',
    category: 'audio-utility',
    description: 'Trim and cut audio files directly in your browser.',
    metaTitle: 'Audio Cutter – Trim MP3, WAV Online Free | Dayront',
    metaDescription: 'Cut audio files online without uploading. Trim MP3, WAV, M4A, and more. 100% private.',
    icon: '✂️',
    type: 'cut',
    outputFormat: 'mp3',
    settings: [
      { name: 'start',    label: 'Start time', type: 'number', min: 0, default: 0 },
      { name: 'duration', label: 'Duration',   type: 'number', min: 1, default: 30 },
    ],
    faq: [
      { question: 'Is it really free?', answer: 'Yes, completely free.' },
      { question: 'Do my files leave my device?', answer: 'No, processing is local.' },
      { question: 'What formats are supported?', answer: 'MP3, WAV, M4A, OGG, FLAC, and more.' },
    ],
    howTo: [
      { title: 'Select your audio file', text: 'Click or drag & drop your audio file.' },
      { title: 'Adjust the cut points', text: 'Use the sliders to set start and end.' },
      { title: 'Download the trimmed audio', text: 'Save your trimmed file.' },
    ],
    relatedTools: ['audio-merger', 'audio-compressor', 'mp3-to-wav'],
  },
  {
    slug: 'audio-merger',
    name: 'Audio Merger',
    category: 'audio-utility',
    description: 'Combine multiple audio files into one.',
    metaTitle: 'Audio Merger – Combine Audio Files Online Free | Dayront',
    metaDescription: 'Merge multiple audio tracks into one file. Supports MP3, WAV, M4A, and more.',
    icon: '🔗',
    type: 'merge',
    outputFormat: 'mp3',
    faq: [
      { question: 'Can I merge different formats?', answer: 'Yes, mix MP3, WAV, M4A, etc.' },
      { question: 'Is quality preserved?', answer: 'Yes, we avoid unnecessary re-encoding.' },
      { question: 'Is there a file size limit?', answer: 'No hard limit.' },
    ],
    howTo: [
      { title: 'Upload your audio files', text: 'Select two or more files.' },
      { title: 'Arrange the order', text: 'Drag to set playback sequence.' },
      { title: 'Merge and download', text: 'Get your combined file.' },
    ],
    relatedTools: ['audio-cutter', 'audio-compressor', 'wav-to-mp3'],
  },
  {
    slug: 'audio-compressor',
    name: 'Audio Compressor',
    category: 'audio-utility',
    description: 'Reduce audio file size without losing quality.',
    metaTitle: 'Audio Compressor – Reduce Audio File Size Online | Dayront',
    metaDescription: 'Compress MP3, WAV, M4A files in your browser. No uploads, 100% private.',
    icon: '📦',
    type: 'compress',
    outputFormat: 'mp3',
    settings: [
      {
        name: 'quality',
        label: 'Compression Level',
        type: 'select',
        default: 3,
        options: [
          { value: 0, label: 'Best Quality — largest file' },
          { value: 3, label: 'Balanced — recommended' },
          { value: 6, label: 'Smaller File' },
          { value: 9, label: 'Smallest File — lowest quality' },
        ],
      },
    ],
    faq: [
      { question: 'Will quality suffer?', answer: 'Smart compression keeps audio clear.' },
      { question: 'Is my file safe?', answer: 'Everything happens on your device.' },
      { question: 'Which formats?', answer: 'MP3, WAV, M4A, OGG, FLAC.' },
    ],
    howTo: [
      { title: 'Upload your audio file', text: 'Select the file to compress.' },
      { title: 'Choose compression strength', text: 'Adjust quality vs size.' },
      { title: 'Download compressed file', text: 'Get a lighter file instantly.' },
    ],
    relatedTools: ['volume-booster', 'audio-cutter', 'mp3-to-wav'],
  },
  {
    slug: 'volume-booster',
    name: 'Volume Booster',
    category: 'audio-utility',
    description: 'Make your audio files louder without distortion.',
    metaTitle: 'Volume Booster – Increase Audio Volume Online Free | Dayront',
    metaDescription: 'Make audio files louder instantly. No upload, 100% private.',
    icon: '🔊',
    type: 'boost',
    outputFormat: 'mp3',
    settings: [
      {
        name: 'gain',
        label: 'Volume Boost',
        type: 'select',
        default: 6,
        options: [
          { value: 3,  label: 'Subtle — +3 dB' },
          { value: 6,  label: 'Medium — +6 dB (recommended)' },
          { value: 10, label: 'Loud — +10 dB' },
          { value: 15, label: 'Very Loud — +15 dB' },
        ],
      },
    ],
    faq: [
      { question: 'Will it distort?', answer: 'No, we prevent clipping.' },
      { question: 'How much louder?', answer: '+6 dB by default.' },
      { question: 'Supported formats?', answer: 'MP3, WAV, M4A, OGG, FLAC.' },
    ],
    howTo: [
      { title: 'Select your audio file', text: 'Choose a quiet track.' },
      { title: 'Boost the volume', text: 'Safe gain applied.' },
      { title: 'Download louder file', text: 'Save boosted audio.' },
    ],
    relatedTools: ['audio-compressor', 'speed-changer', 'mp3-to-wav'],
  },
  {
    slug: 'speed-changer',
    name: 'Speed Changer',
    category: 'audio-utility',
    description: 'Speed up or slow down audio playback.',
    metaTitle: 'Audio Speed Changer – Change Playback Speed Online Free | Dayront',
    metaDescription: 'Speed up or slow down audio files in your browser. No upload, 100% private.',
    icon: '⏩',
    type: 'speed',
    outputFormat: 'mp3',
    settings: [
      {
        name: 'factor',
        label: 'Playback Speed',
        type: 'select',
        default: 1.5,
        options: [
          { value: 0.5,  label: '0.5× — Half Speed' },
          { value: 0.75, label: '0.75× — Slightly Slower' },
          { value: 1,    label: '1× — Normal' },
          { value: 1.25, label: '1.25× — Slightly Faster' },
          { value: 1.5,  label: '1.5× — Faster' },
          { value: 2,    label: '2× — Double Speed' },
          { value: 3,    label: '3× — Triple Speed' },
        ],
      },
    ],
    faq: [
      { question: 'Does it affect pitch?', answer: 'We preserve original pitch.' },
      { question: 'What speeds?', answer: 'From 0.5× to 3×.' },
      { question: 'Is it free?', answer: 'Yes, completely free.' },
    ],
    howTo: [
      { title: 'Upload your audio', text: 'Select file to modify.' },
      { title: 'Choose speed factor', text: 'Pick desired speed.' },
      { title: 'Download altered file', text: 'Get speed-changed audio.' },
    ],
    relatedTools: ['reverse-audio', 'volume-booster', 'audio-cutter'],
  },
  {
    slug: 'reverse-audio',
    name: 'Reverse Audio',
    category: 'audio-utility',
    description: 'Play your audio backwards.',
    metaTitle: 'Reverse Audio – Play Audio Backwards Free Online | Dayront',
    metaDescription: 'Reverse audio files online. No upload needed. 100% private.',
    icon: '↩️',
    type: 'reverse',
    outputFormat: 'mp3',
    faq: [
      { question: 'What does reversing do?', answer: 'Plays sound backwards.' },
      { question: 'Long files?', answer: 'Yes, depends on device speed.' },
      { question: 'Is my file safe?', answer: 'Everything stays on your device.' },
    ],
    howTo: [
      { title: 'Choose your audio file', text: 'Drop an MP3 or WAV.' },
      { title: 'Reverse it', text: 'Click reverse.' },
      { title: 'Download reversed file', text: 'Save backwards audio.' },
    ],
    relatedTools: ['speed-changer', 'audio-cutter', 'mp3-to-ogg'],
  },
  {
    slug: 'stereo-to-mono',
    name: 'Stereo to Mono',
    category: 'audio-utility',
    description: 'Convert stereo audio to mono.',
    metaTitle: 'Stereo to Mono Converter – Free Online Tool | Dayront',
    metaDescription: 'Convert stereo audio to mono instantly. No upload, 100% private.',
    icon: '🔉',
    type: 'stereo-to-mono',
    outputFormat: 'mp3',
    faq: [
      { question: 'Why convert to mono?', answer: 'Smaller files, same audio in both ears.' },
      { question: 'Quality lost?', answer: 'Combined signal preserves clarity.' },
      { question: 'All formats?', answer: 'MP3, WAV, M4A, FLAC, OGG.' },
    ],
    howTo: [
      { title: 'Upload stereo file', text: 'Select an audio file.' },
      { title: 'Convert automatically', text: 'Mixed to mono.' },
      { title: 'Download mono file', text: 'Save single-channel audio.' },
    ],
    relatedTools: ['audio-cutter', 'volume-booster', 'mp3-to-wav'],
  },

  // ── AUDIO CONVERSIONS ─────────────────────
  {
    slug: 'mp3-to-wav',
    name: 'MP3 to WAV',
    category: 'audio-conversion',
    from: 'mp3', to: 'wav',
    description: 'Convert MP3 to lossless WAV format.',
    metaTitle: 'MP3 to WAV Converter – Free Online, No Upload | Dayront',
    metaDescription: 'Convert MP3 to lossless WAV in your browser. No upload, 100% private.',
    icon: '🎵',
    type: 'convert',
    faq: [
      { question: 'Does it improve quality?', answer: 'No, preserves original MP3 quality.' },
      { question: 'Why convert to WAV?', answer: 'Preferred for editing and archiving.' },
      { question: 'Is my file safe?', answer: 'All processing is local.' },
    ],
    howTo: [
      { title: 'Upload MP3 file', text: 'Select an MP3.' },
      { title: 'Convert to WAV', text: 'Decoded to uncompressed WAV.' },
      { title: 'Download WAV', text: 'Get lossless file.' },
    ],
    relatedTools: ['wav-to-mp3', 'mp3-to-m4a', 'flac-to-mp3'],
  },
  {
    slug: 'wav-to-mp3',
    name: 'WAV to MP3',
    category: 'audio-conversion',
    from: 'wav', to: 'mp3',
    description: 'Convert WAV to MP3 format.',
    metaTitle: 'WAV to MP3 Converter – Free Online, No Upload | Dayront',
    metaDescription: 'Convert WAV to MP3 in your browser. No upload, fully private.',
    icon: '🎵',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [
      { question: 'How much smaller?', answer: '5-10× smaller than WAV.' },
      { question: 'Will I hear difference?', answer: 'At 320kbps, indistinguishable.' },
      { question: 'Is it free?', answer: 'Yes, unlimited conversions.' },
    ],
    howTo: [
      { title: 'Upload WAV file', text: 'Select a WAV.' },
      { title: 'Convert to MP3', text: 'Compressed to MP3.' },
      { title: 'Download MP3', text: 'Save smaller file.' },
    ],
    relatedTools: ['mp3-to-wav', 'flac-to-mp3', 'audio-cutter'],
  },
  {
    slug: 'm4a-to-mp3',
    name: 'M4A to MP3',
    category: 'audio-conversion',
    from: 'm4a', to: 'mp3',
    description: 'Convert M4A audio to MP3 format.',
    metaTitle: 'M4A to MP3 Converter – Free Online, No Upload | Dayront',
    metaDescription: 'Convert M4A to MP3 in your browser. No upload, fully private.',
    icon: '🎵',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [
      { question: 'Why convert?', answer: 'MP3 is more widely supported.' },
      { question: 'File size?', answer: 'Similar, high-quality MP3 bitrate.' },
      { question: 'Secure?', answer: 'All local processing.' },
    ],
    howTo: [
      { title: 'Upload M4A file', text: 'Select M4A.' },
      { title: 'Convert to MP3', text: 'Re-encoded to MP3.' },
      { title: 'Download MP3', text: 'Get compatible file.' },
    ],
    relatedTools: ['mp3-to-m4a', 'wav-to-mp3', 'volume-booster'],
  },
  {
    slug: 'mp3-to-m4a',
    name: 'MP3 to M4A',
    category: 'audio-conversion',
    from: 'mp3', to: 'm4a',
    description: 'Convert MP3 to M4A (AAC) format.',
    metaTitle: 'MP3 to M4A Converter – Free Online, No Upload | Dayront',
    metaDescription: 'Convert MP3 to M4A in your browser. Keep quality, reduce size.',
    icon: '🎵',
    type: 'convert',
    faq: [
      { question: 'Why M4A?', answer: 'Better quality at same bitrate, ideal for Apple.' },
      { question: 'Quality loss?', answer: 'Minimal, high-bitrate AAC encoder.' },
      { question: 'Free?', answer: 'Yes, completely free.' },
    ],
    howTo: [
      { title: 'Select MP3 file', text: 'Choose an MP3.' },
      { title: 'Convert to M4A', text: 'Wrapped in M4A container.' },
      { title: 'Download M4A', text: 'Save for Apple devices.' },
    ],
    relatedTools: ['m4a-to-mp3', 'mp3-to-wav', 'audio-compressor'],
  },
  {
    slug: 'flac-to-mp3',
    name: 'FLAC to MP3',
    category: 'audio-conversion',
    from: 'flac', to: 'mp3',
    description: 'Convert FLAC audio to MP3.',
    metaTitle: 'FLAC to MP3 Converter – Free Online, No Upload | Dayront',
    metaDescription: 'Convert FLAC to MP3 in your browser. 100% private, fast and free.',
    icon: '🎵',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [
      { question: 'Will I lose quality?', answer: 'High-quality 320kbps encoding.' },
      { question: 'Safe?', answer: 'Everything on your device.' },
      { question: 'Batch?', answer: 'Coming soon.' },
    ],
    howTo: [
      { title: 'Upload FLAC file', text: 'Select FLAC.' },
      { title: 'Convert instantly', text: 'Transcoded to MP3.' },
      { title: 'Download MP3', text: 'Save compressed file.' },
    ],
    relatedTools: ['mp3-to-wav', 'ogg-to-mp3', 'audio-cutter'],
  },
  {
    slug: 'ogg-to-mp3',
    name: 'OGG to MP3',
    category: 'audio-conversion',
    from: 'ogg', to: 'mp3',
    description: 'Convert OGG audio to MP3 format.',
    metaTitle: 'OGG to MP3 Converter – Free Online, No Upload | Dayront',
    metaDescription: 'Convert OGG to MP3 in your browser. No upload, fully private.',
    icon: '🎵',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [
      { question: 'Why convert?', answer: 'MP3 is more widely supported.' },
      { question: 'File size change?', answer: 'Slightly larger at high bitrate.' },
      { question: 'Free?', answer: 'Yes, no registration.' },
    ],
    howTo: [
      { title: 'Upload OGG file', text: 'Select OGG Vorbis.' },
      { title: 'Convert to MP3', text: 'Transcoded to MP3.' },
      { title: 'Download MP3', text: 'Get universal file.' },
    ],
    relatedTools: ['mp3-to-ogg', 'flac-to-mp3', 'reverse-audio'],
  },
  {
    slug: 'mp3-to-ogg',
    name: 'MP3 to OGG',
    category: 'audio-conversion',
    from: 'mp3', to: 'ogg',
    description: 'Convert MP3 to OGG Vorbis format.',
    metaTitle: 'MP3 to OGG Converter – Free Online, No Upload | Dayront',
    metaDescription: 'Convert MP3 to OGG in your browser. No upload, completely private.',
    icon: '🎵',
    type: 'convert',
    faq: [
      { question: 'Why OGG?', answer: 'Open format, excellent quality.' },
      { question: 'Quality lost?', answer: 'Minimal with high-quality settings.' },
      { question: 'Safe?', answer: 'Local processing.' },
    ],
    howTo: [
      { title: 'Select MP3 file', text: 'Choose MP3.' },
      { title: 'Convert to OGG', text: 'Re-encoded to OGG.' },
      { title: 'Download OGG', text: 'Save open-source file.' },
    ],
    relatedTools: ['ogg-to-mp3', 'mp3-to-wav', 'audio-compressor'],
  },
  {
    slug: 'ape-to-mp3',
    name: 'APE to MP3',
    category: 'audio-conversion',
    from: 'ape', to: 'mp3',
    description: 'Convert APE lossless audio to MP3.',
    metaTitle: 'APE to MP3 Converter – Free Online | Dayront',
    metaDescription: 'Convert APE files to MP3 in your browser. No upload, private.',
    icon: '🎵',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [],
    howTo: [
      { title: 'Upload APE file', text: 'Select an APE audio file.' },
      { title: 'Convert', text: 'Click convert.' },
      { title: 'Download MP3', text: 'Get the MP3 file.' },
    ],
    relatedTools: ['flac-to-mp3', 'wav-to-mp3', 'audio-cutter'],
  },
  {
    slug: 'opus-to-mp3',
    name: 'OPUS to MP3',
    category: 'audio-conversion',
    from: 'opus', to: 'mp3',
    description: 'Convert OPUS audio to MP3 format.',
    metaTitle: 'OPUS to MP3 Converter – Free Online | Dayront',
    metaDescription: 'Convert OPUS to MP3 in your browser. No upload.',
    icon: '🎵',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [],
    howTo: [
      { title: 'Upload OPUS file', text: 'Select an OPUS audio file.' },
      { title: 'Convert', text: 'Click convert.' },
      { title: 'Download MP3', text: 'Get the MP3 file.' },
    ],
    relatedTools: ['ogg-to-mp3', 'flac-to-mp3', 'mp3-to-wav'],
  },
  {
    slug: 'aiff-to-mp3',
    name: 'AIFF to MP3',
    category: 'audio-conversion',
    from: 'aiff', to: 'mp3',
    description: 'Convert AIFF audio to MP3.',
    metaTitle: 'AIFF to MP3 Converter – Free Online | Dayront',
    metaDescription: 'Convert AIFF files to MP3 in your browser. No upload.',
    icon: '🎵',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [],
    howTo: [
      { title: 'Upload AIFF file', text: 'Select an AIFF audio file.' },
      { title: 'Convert', text: 'Click convert.' },
      { title: 'Download MP3', text: 'Get the MP3 file.' },
    ],
    relatedTools: ['wav-to-mp3', 'flac-to-mp3', 'mp3-to-m4a'],
  },
  {
    slug: 'aac-to-mp3',
    name: 'AAC to MP3',
    category: 'audio-conversion',
    from: 'aac', to: 'mp3',
    description: 'Convert AAC audio to MP3.',
    metaTitle: 'AAC to MP3 Converter – Free Online | Dayront',
    metaDescription: 'Convert AAC to MP3 in your browser. No upload.',
    icon: '🎵',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [],
    howTo: [
      { title: 'Upload AAC file', text: 'Select an AAC audio file.' },
      { title: 'Convert', text: 'Click convert.' },
      { title: 'Download MP3', text: 'Get the MP3 file.' },
    ],
    relatedTools: ['m4a-to-mp3', 'wav-to-mp3', 'volume-booster'],
  },
  {
    slug: 'amr-to-mp3',
    name: 'AMR to MP3',
    category: 'audio-conversion',
    from: 'amr', to: 'mp3',
    description: 'Convert AMR audio (voice recordings) to MP3.',
    metaTitle: 'AMR to MP3 Converter – Free Online | Dayront',
    metaDescription: 'Convert AMR files to MP3 in your browser. No upload.',
    icon: '🎵',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [],
    howTo: [
      { title: 'Upload AMR file', text: 'Select an AMR audio file.' },
      { title: 'Convert', text: 'Click convert.' },
      { title: 'Download MP3', text: 'Get the MP3 file.' },
    ],
    relatedTools: ['wav-to-mp3', 'aac-to-mp3', 'mp3-to-ogg'],
  },

  // ── VIDEO TO AUDIO ────────────────────────
  {
    slug: 'mp4-to-mp3',
    name: 'MP4 to MP3',
    category: 'video-to-audio',
    from: 'mp4', to: 'mp3',
    description: 'Extract MP3 audio from MP4 videos.',
    metaTitle: 'MP4 to MP3 Converter – Extract Audio Free Online | Dayront',
    metaDescription: 'Convert MP4 video to MP3 audio in your browser. No upload, fully private.',
    icon: '🎬',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [
      { question: 'HD videos?', answer: 'Yes, any MP4 with audio.' },
      { question: 'Uploaded?', answer: 'No, conversion is local.' },
      { question: 'Part of audio?', answer: 'Use Audio Cutter after.' },
    ],
    howTo: [
      { title: 'Upload MP4 video', text: 'Drag & drop MP4.' },
      { title: 'Convert to MP3', text: 'Audio extracted.' },
      { title: 'Download MP3', text: 'Get audio file.' },
    ],
    relatedTools: ['mp4-to-wav', 'webm-to-mp3', 'audio-cutter'],
  },
  {
    slug: 'mov-to-mp3',
    name: 'MOV to MP3',
    category: 'video-to-audio',
    from: 'mov', to: 'mp3',
    description: 'Extract MP3 audio from MOV videos.',
    metaTitle: 'MOV to MP3 Converter – Extract Audio Free Online | Dayront',
    metaDescription: 'Convert MOV video to MP3 audio in your browser. No upload, 100% private.',
    icon: '🎬',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [
      { question: 'iPhone videos?', answer: 'Yes, fully compatible.' },
      { question: 'Quality loss?', answer: 'High-quality encoder.' },
      { question: 'Free?', answer: 'Yes, unlimited.' },
    ],
    howTo: [
      { title: 'Choose MOV file', text: 'Select QuickTime MOV.' },
      { title: 'Extract audio', text: 'Encoded to MP3.' },
      { title: 'Download MP3', text: 'Save audio.' },
    ],
    relatedTools: ['mp4-to-mp3', 'avi-to-mp3', 'speed-changer'],
  },
  {
    slug: 'mkv-to-mp3',
    name: 'MKV to MP3',
    category: 'video-to-audio',
    from: 'mkv', to: 'mp3',
    description: 'Extract MP3 audio from MKV videos.',
    metaTitle: 'MKV to MP3 Converter – Extract Audio Free Online | Dayront',
    metaDescription: 'Convert MKV video to MP3 audio in your browser. No upload, completely private.',
    icon: '🎬',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [
      { question: 'Multi-channel?', answer: 'Downmixed to stereo.' },
      { question: 'Subtitles?', answer: 'Ignored.' },
      { question: 'File size limit?', answer: 'No hard limit.' },
    ],
    howTo: [
      { title: 'Upload MKV video', text: 'Select MKV.' },
      { title: 'Convert to MP3', text: 'Audio extracted.' },
      { title: 'Download MP3', text: 'Get audio file.' },
    ],
    relatedTools: ['avi-to-mp3', 'mp4-to-mp3', 'audio-merger'],
  },
  {
    slug: 'avi-to-mp3',
    name: 'AVI to MP3',
    category: 'video-to-audio',
    from: 'avi', to: 'mp3',
    description: 'Extract MP3 audio from AVI videos.',
    metaTitle: 'AVI to MP3 Converter – Extract Audio Free Online | Dayront',
    metaDescription: 'Convert AVI video to MP3 audio in your browser. No upload, 100% private.',
    icon: '🎬',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [
      { question: 'All AVI files?', answer: 'Yes, with audio track.' },
      { question: 'Uploaded?', answer: 'No, local processing.' },
      { question: 'Multiple?', answer: 'One at a time currently.' },
    ],
    howTo: [
      { title: 'Select AVI file', text: 'Choose AVI video.' },
      { title: 'Extract audio', text: 'Encoded to MP3.' },
      { title: 'Download MP3', text: 'Save audio file.' },
    ],
    relatedTools: ['mkv-to-mp3', 'mov-to-mp3', 'audio-cutter'],
  },
  {
    slug: 'webm-to-mp3',
    name: 'WebM to MP3',
    category: 'video-to-audio',
    from: 'webm', to: 'mp3',
    description: 'Extract MP3 audio from WebM videos.',
    metaTitle: 'WebM to MP3 Converter – Extract MP3 Audio Free Online | Dayront',
    metaDescription: 'Convert WebM video to MP3 audio in your browser. No upload, private, and free.',
    icon: '🎬',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [
      { question: 'Audio-only?', answer: 'Yes, works.' },
      { question: 'Bitrate?', answer: 'High-quality VBR.' },
      { question: 'Safe?', answer: '100% local.' },
    ],
    howTo: [
      { title: 'Upload WebM file', text: 'Select WebM.' },
      { title: 'Convert to MP3', text: 'Audio extracted.' },
      { title: 'Download MP3', text: 'Get audio file.' },
    ],
    relatedTools: ['webm-to-wav', 'mp4-to-mp3', 'audio-compressor'],
  },
  {
    slug: 'mp4-to-wav',
    name: 'MP4 to WAV',
    category: 'video-to-audio',
    from: 'mp4', to: 'wav',
    description: 'Extract WAV audio from MP4 videos.',
    metaTitle: 'MP4 to WAV Converter – Extract Audio Free Online | Dayront',
    metaDescription: 'Convert MP4 video to WAV audio in your browser. No upload, fully private.',
    icon: '🎬',
    type: 'convert',
    faq: [
      { question: 'Why WAV?', answer: 'Ideal for editing and archiving.' },
      { question: 'Large files?', answer: 'Yes, depends on device speed.' },
      { question: 'Safe?', answer: 'Everything stays on your computer.' },
    ],
    howTo: [
      { title: 'Choose MP4 video', text: 'Select MP4.' },
      { title: 'Extract WAV', text: 'Uncompressed audio.' },
      { title: 'Download WAV', text: 'Save high-quality audio.' },
    ],
    relatedTools: ['mp4-to-mp3', 'webm-to-wav', 'volume-booster'],
  },
  {
    slug: 'webm-to-wav',
    name: 'WebM to WAV',
    category: 'video-to-audio',
    from: 'webm', to: 'wav',
    description: 'Extract WAV audio from WebM videos.',
    metaTitle: 'WebM to WAV Converter – Free Online, No Upload | Dayront',
    metaDescription: 'Extract lossless WAV from WebM files in your browser. No upload, 100% private.',
    icon: '🎬',
    type: 'convert',
    faq: [
      { question: 'Lossless?', answer: 'WAV preserves original audio.' },
      { question: 'WebM videos?', answer: 'Yes, any WebM with audio.' },
      { question: 'Free?', answer: 'Completely free.' },
    ],
    howTo: [
      { title: 'Upload WebM file', text: 'Select WebM.' },
      { title: 'Convert to WAV', text: 'Uncompressed WAV.' },
      { title: 'Download WAV', text: 'Save for editing.' },
    ],
    relatedTools: ['webm-to-mp3', 'mp4-to-wav', 'audio-cutter'],
  },
  {
    slug: 'flv-to-mp3',
    name: 'FLV to MP3',
    category: 'video-to-audio',
    from: 'flv', to: 'mp3',
    description: 'Extract MP3 audio from FLV videos.',
    metaTitle: 'FLV to MP3 Converter – Free Online | Dayront',
    metaDescription: 'Convert FLV to MP3 in your browser. No upload, private.',
    icon: '🎬',
    type: 'convert',
    settings: [
      { name: 'bitrate', label: 'Audio Quality', type: 'select', options: AUDIO_BITRATE_OPTIONS, default: '192k' },
    ],
    faq: [],
    howTo: [
      { title: 'Upload FLV file', text: 'Select an FLV video.' },
      { title: 'Convert', text: 'Click convert.' },
      { title: 'Download MP3', text: 'Get the audio.' },
    ],
    relatedTools: ['mp4-to-mp3', 'webm-to-mp3', 'flv-to-mp4'],
  },

  // ── VIDEO CONVERSIONS ─────────────────────
  {
    slug: 'flv-to-mp4',
    name: 'FLV to MP4',
    category: 'video-conversion',
    from: 'flv', to: 'mp4',
    description: 'Convert FLV video to MP4 format.',
    metaTitle: 'FLV to MP4 Converter – Free Online | Dayront',
    metaDescription: 'Convert FLV to MP4 in your browser. No upload.',
    icon: '🎬',
    type: 'convert-video',
    outputFormat: 'mp4',
    settings: [
      { name: 'vcodec', label: 'Video Codec', type: 'select', options: VIDEO_CODEC_OPTIONS, default: 'libx264' },
      { name: 'acodec', label: 'Audio Codec', type: 'select', options: AUDIO_CODEC_OPTIONS, default: 'aac' },
    ],
    faq: [],
    howTo: [
      { title: 'Upload FLV', text: 'Select FLV file.' },
      { title: 'Convert', text: 'Click convert.' },
      { title: 'Download MP4', text: 'Get the MP4 file.' },
    ],
    relatedTools: ['flv-to-webm', 'mp4-to-mp3', 'video-compressor'],
  },
  {
    slug: 'flv-to-webm',
    name: 'FLV to WebM',
    category: 'video-conversion',
    from: 'flv', to: 'webm',
    description: 'Convert FLV to WebM format.',
    metaTitle: 'FLV to WebM Converter – Free Online | Dayront',
    metaDescription: 'Convert FLV to WebM in your browser. No upload.',
    icon: '🎬',
    type: 'convert-video',
    outputFormat: 'webm',
    settings: [
      { name: 'vcodec', label: 'Video Codec', type: 'select', options: WEBM_VIDEO_CODEC_OPTIONS, default: 'libvpx' },
      { name: 'acodec', label: 'Audio Codec', type: 'select', options: WEBM_AUDIO_CODEC_OPTIONS, default: 'libvorbis' },
    ],
    faq: [],
    howTo: [
      { title: 'Upload FLV', text: 'Select FLV file.' },
      { title: 'Convert', text: 'Click convert.' },
      { title: 'Download WebM', text: 'Get the WebM file.' },
    ],
    relatedTools: ['flv-to-mp4', 'webm-to-mp3', 'video-compressor'],
  },

  // ── VIDEO UTILITIES ──────────────────────
  {
    slug: 'video-compressor',
    name: 'Video Compressor',
    category: 'video-utility',
    description: 'Reduce video file size with adjustable quality.',
    metaTitle: 'Video Compressor – Reduce Video Size Online Free | Dayront',
    metaDescription: 'Compress MP4, WebM, MOV files in your browser. Adjust quality and speed. 100% private.',
    icon: '📉',
    type: 'video-compress',
    outputFormat: 'mp4',
    settings: [
      {
        name: 'crf',
        label: 'Output Quality',
        type: 'select',
        default: 23,
        options: [
          { value: 18, label: 'High Quality — larger file' },
          { value: 23, label: 'Balanced — recommended' },
          { value: 28, label: 'Smaller File' },
          { value: 32, label: 'Smallest File — lowest quality' },
        ],
      },
      {
        name: 'preset',
        label: 'Encoding Speed',
        type: 'select',
        default: 'medium',
        options: [
          { value: 'ultrafast', label: 'Fastest — lower quality' },
          { value: 'veryfast',  label: 'Fast' },
          { value: 'medium',    label: 'Balanced — recommended' },
          { value: 'slow',      label: 'Slowest — best quality' },
        ],
      },
    ],
    faq: [
      { question: 'Will quality be lost?', answer: 'Yes, but you can control the trade‑off with the quality dropdown. Lower quality = smaller file.' },
      { question: 'Is it really free?', answer: 'Yes, unlimited use.' },
    ],
    howTo: [
      { title: 'Upload your video', text: 'Choose an MP4, WebM, or MOV file.' },
      { title: 'Adjust settings', text: 'Select quality and speed.' },
      { title: 'Download compressed file', text: 'Get a smaller video instantly.' },
    ],
    relatedTools: ['video-cutter', 'resize-video', 'video-to-gif'],
  },
  {
    slug: 'video-cutter',
    name: 'Video Cutter',
    category: 'video-utility',
    description: 'Trim and cut video clips without re‑encoding.',
    metaTitle: 'Video Cutter – Trim Video Online Free | Dayront',
    metaDescription: 'Cut MP4, WebM, MOV videos in your browser. No upload, 100% private.',
    icon: '✂️',
    type: 'video-cut',
    outputFormat: 'mp4',
    settings: [
      { name: 'start',    label: 'Start time', type: 'number', min: 0, default: 0 },
      { name: 'duration', label: 'Duration',   type: 'number', min: 1, default: 30 },
    ],
    faq: [
      { question: 'Does it re‑encode?', answer: 'No, we use stream copy for speed and no quality loss.' },
    ],
    howTo: [
      { title: 'Upload your video', text: 'Select a video file.' },
      { title: 'Set start and duration', text: 'Enter the seconds to keep.' },
      { title: 'Download the trimmed clip', text: 'Get your cut video instantly.' },
    ],
    relatedTools: ['video-compressor', 'video-merger', 'audio-cutter'],
  },
  {
    slug: 'video-merger',
    name: 'Video Merger',
    category: 'video-utility',
    description: 'Combine multiple videos into one file.',
    metaTitle: 'Video Merger – Combine Videos Online Free | Dayront',
    metaDescription: 'Merge MP4, WebM, MOV clips in your browser. No upload, private.',
    icon: '🔗',
    type: 'video-merge',
    outputFormat: 'mp4',
    settings: [],
    faq: [
      { question: 'Can I merge different formats?', answer: 'Yes, they will be converted to a consistent format automatically.' },
    ],
    howTo: [
      { title: 'Upload video files', text: 'Select two or more videos.' },
      { title: 'Arrange order', text: 'Drag to reorder.' },
      { title: 'Merge and download', text: 'Get a single combined video.' },
    ],
    relatedTools: ['video-cutter', 'audio-merger', 'video-compressor'],
  },
  {
    slug: 'video-to-gif',
    name: 'Video to GIF',
    category: 'video-utility',
    description: 'Convert a video clip to an animated GIF.',
    metaTitle: 'Video to GIF Converter – Free Online | Dayront',
    metaDescription: 'Turn MP4, WebM, MOV into GIFs. Adjust FPS and size. 100% private.',
    icon: '🖼️',
    type: 'video-to-gif',
    outputFormat: 'gif',
    settings: [
      {
        name: 'fps',
        label: 'Smoothness',
        type: 'select',
        default: 10,
        options: [
          { value: 5,  label: 'Low — 5 fps (smallest file)' },
          { value: 10, label: 'Medium — 10 fps (recommended)' },
          { value: 15, label: 'Smooth — 15 fps' },
          { value: 24, label: 'Very Smooth — 24 fps (largest file)' },
        ],
      },
      {
        name: 'width',
        label: 'GIF Width',
        type: 'select',
        default: 320,
        options: [
          { value: 240, label: 'Small — 240 px' },
          { value: 320, label: 'Medium — 320 px (recommended)' },
          { value: 480, label: 'Large — 480 px' },
          { value: 640, label: 'Very Large — 640 px' },
        ],
      },
    ],
    faq: [
      { question: 'Will it loop?', answer: 'Yes, GIFs loop infinitely.' },
    ],
    howTo: [
      { title: 'Upload video', text: 'Choose a short video.' },
      { title: 'Set size and speed', text: 'Adjust width and FPS.' },
      { title: 'Download GIF', text: 'Get your animated GIF.' },
    ],
    relatedTools: ['gif-to-video', 'video-compressor', 'video-cutter'],
  },
  {
    slug: 'gif-to-video',
    name: 'GIF to MP4',
    category: 'video-utility',
    description: 'Convert an animated GIF to an MP4 video.',
    metaTitle: 'GIF to MP4 Converter – Free Online | Dayront',
    metaDescription: 'Turn GIFs into MP4 videos. No upload, private.',
    icon: '🎞️',
    type: 'gif-to-video',
    outputFormat: 'mp4',
    settings: [],
    faq: [
      { question: 'Why convert to video?', answer: 'MP4 files are often smaller than GIFs and support audio.' },
    ],
    howTo: [
      { title: 'Upload GIF', text: 'Select a GIF file.' },
      { title: 'Convert', text: 'Click convert.' },
      { title: 'Download MP4', text: 'Get the video version.' },
    ],
    relatedTools: ['video-to-gif', 'video-compressor', 'resize-video'],
  },
  {
    slug: 'resize-video',
    name: 'Resize Video',
    category: 'video-utility',
    description: 'Change video resolution (width/height).',
    metaTitle: 'Resize Video – Change Resolution Online Free | Dayront',
    metaDescription: 'Resize MP4, WebM, MOV videos. Set custom width and height. Private.',
    icon: '↔️',
    type: 'resize-video',
    outputFormat: 'mp4',
    settings: [
      {
        name: 'width',
        label: 'Width',
        type: 'select',
        default: 1280,
        options: [
          { value: 640,  label: '640 px — Small' },
          { value: 854,  label: '854 px — 480p SD' },
          { value: 1280, label: '1280 px — 720p HD (recommended)' },
          { value: 1920, label: '1920 px — 1080p Full HD' },
          { value: 2560, label: '2560 px — 2K QHD' },
          { value: 3840, label: '3840 px — 4K UHD' },
        ],
      },
      {
        name: 'height',
        label: 'Height',
        type: 'select',
        default: 720,
        options: [
          { value: 360,  label: '360 px — Small' },
          { value: 480,  label: '480 px — 480p SD' },
          { value: 720,  label: '720 px — 720p HD (recommended)' },
          { value: 1080, label: '1080 px — 1080p Full HD' },
          { value: 1440, label: '1440 px — 2K QHD' },
          { value: 2160, label: '2160 px — 4K UHD' },
        ],
      },
    ],
    faq: [
      { question: 'Will it keep aspect ratio?', answer: 'Pick matching width and height (e.g. 1280×720) to keep the aspect ratio. Mismatched pairs will stretch the video.' },
    ],
    howTo: [
      { title: 'Upload video', text: 'Choose a file.' },
      { title: 'Pick new dimensions', text: 'Choose width and height.' },
      { title: 'Download resized video', text: 'Get the video at the new size.' },
    ],
    relatedTools: ['crop-video', 'video-compressor', 'video-cutter'],
  },
  {
    slug: 'crop-video',
    name: 'Crop Video',
    category: 'video-utility',
    description: 'Crop a region from a video.',
    metaTitle: 'Crop Video – Cut Region Online Free | Dayront',
    metaDescription: 'Crop MP4, WebM, MOV videos. Specify X, Y, width, height. Private.',
    icon: '🔲',
    type: 'crop-video',
    outputFormat: 'mp4',
    settings: [
      { name: 'x', label: 'X offset (px)', type: 'number', min: 0, default: 0 },
      { name: 'y', label: 'Y offset (px)', type: 'number', min: 0, default: 0 },
      { name: 'w', label: 'Width (px)',    type: 'number', min: 1, default: 640 },
      { name: 'h', label: 'Height (px)',   type: 'number', min: 1, default: 480 },
    ],
    faq: [],
    howTo: [
      { title: 'Upload video', text: 'Select a file.' },
      { title: 'Set crop area', text: 'Enter coordinates and size.' },
      { title: 'Download cropped video', text: 'Get the selected region.' },
    ],
    relatedTools: ['resize-video', 'video-cutter', 'video-compressor'],
  },
  {
    slug: 'change-fps',
    name: 'Change FPS',
    category: 'video-utility',
    description: 'Adjust video frame rate.',
    metaTitle: 'Change FPS – Adjust Frame Rate Online Free | Dayront',
    metaDescription: 'Change FPS of MP4, WebM, MOV videos. No upload, private.',
    icon: '⏱️',
    type: 'change-fps',
    outputFormat: 'mp4',
    settings: [
      {
        name: 'fps',
        label: 'Frame Rate',
        type: 'select',
        default: 30,
        options: [
          { value: 15, label: '15 fps — Cinematic' },
          { value: 24, label: '24 fps — Film standard' },
          { value: 30, label: '30 fps — Standard (recommended)' },
          { value: 60, label: '60 fps — Smooth motion' },
        ],
      },
    ],
    faq: [],
    howTo: [
      { title: 'Upload video', text: 'Select a video.' },
      { title: 'Choose new frame rate', text: 'Pick from the dropdown.' },
      { title: 'Download video', text: 'Get the video with the new frame rate.' },
    ],
    relatedTools: ['video-compressor', 'speed-changer', 'video-cutter'],
  },
  {
    slug: 'mute-video',
    name: 'Mute Video',
    category: 'video-utility',
    description: 'Remove audio from a video file.',
    metaTitle: 'Mute Video – Remove Audio Online Free | Dayront',
    metaDescription: 'Mute MP4, WebM, MOV videos. No upload, private.',
    icon: '🔇',
    type: 'mute-video',
    outputFormat: 'mp4',
    settings: [],
    faq: [],
    howTo: [
      { title: 'Upload video', text: 'Choose a video.' },
      { title: 'Mute', text: 'Click convert.' },
      { title: 'Download silent video', text: 'Get the video without audio.' },
    ],
    relatedTools: ['extract-audio', 'video-compressor', 'audio-cutter'],
  },
  {
    slug: 'extract-audio',
    name: 'Extract Audio',
    category: 'video-utility',
    description: 'Extract the audio stream from any video.',
    metaTitle: 'Extract Audio – Get Sound from Video Online Free | Dayront',
    metaDescription: 'Extract audio from MP4, WebM, MOV, etc. to MP3. Private.',
    icon: '🎧',
    type: 'extract-audio',
    outputFormat: 'mp3',
    settings: [
      {
        name: 'format',
        label: 'Output Format',
        type: 'select',
        default: 'mp3',
        options: [
          { value: 'mp3',  label: 'MP3 — most compatible (recommended)' },
          { value: 'wav',  label: 'WAV — lossless, larger file' },
          { value: 'm4a',  label: 'M4A — Apple-friendly' },
          { value: 'ogg',  label: 'OGG — open format' },
          { value: 'flac', label: 'FLAC — lossless, smaller than WAV' },
          { value: 'aac',  label: 'AAC — high efficiency' },
        ],
      },
    ],
    faq: [],
    howTo: [
      { title: 'Upload video', text: 'Select a video.' },
      { title: 'Choose output format', text: 'Pick MP3, WAV, etc.' },
      { title: 'Download audio', text: 'Get the extracted audio.' },
    ],
    relatedTools: ['mp4-to-mp3', 'mute-video', 'audio-cutter'],
  },

  // ── AI TOOLS ─────────────────────────────
  {
    slug: 'ai-video-captions',
    name: 'AI Video Captions',
    category: 'ai',
    description: 'Automatically generate and burn subtitles into your video.',
    metaTitle: 'AI Video Captions – Auto Subtitle Generator Free | Dayront',
    metaDescription: 'Generate captions automatically with AI. No upload, 100% private.',
    icon: '📝',
    type: 'ai-captions',
    outputFormat: 'mp4',
    settings: [],
    faq: [],
    howTo: [
      { title: 'Upload video', text: 'Select a video.' },
      { title: 'AI transcribes', text: 'Whisper AI generates captions.' },
      { title: 'Download', text: 'Get video with subtitles.' },
    ],
    relatedTools: ['extract-audio', 'burn-subtitles', 'video-cutter'],
  },
  {
    slug: 'ai-background-remover',
    name: 'AI Background Remover',
    category: 'ai',
    description: 'Remove video or image backgrounds automatically using AI.',
    metaTitle: 'AI Background Remover – Free Online | Dayront',
    metaDescription: 'Remove backgrounds from videos and images with AI. No upload, private.',
    icon: '🪄',
    type: 'ai-remove-bg',
    outputFormat: 'mp4',
    settings: [],
    faq: [],
    howTo: [
      { title: 'Upload media', text: 'Select a video or image.' },
      { title: 'AI removes background', text: 'Processes frame-by-frame.' },
      { title: 'Download', text: 'Get transparent or replaced background.' },
    ],
    relatedTools: ['ai-photo-editor', 'video-compressor', 'crop-video'],
  },
  {
    slug: 'ai-photo-editor',
    name: 'AI Photo Editor',
    category: 'ai',
    description: 'Edit photos using AI text prompts and generative fill.',
    metaTitle: 'AI Photo Editor – Text to Image Free Online | Dayront',
    metaDescription: 'Edit and generate photos with AI directly in your browser. Private.',
    icon: '🎨',
    type: 'ai-photo-editor',
    outputFormat: 'png',
    settings: [],
    faq: [],
    howTo: [
      { title: 'Upload image', text: 'Select a photo.' },
      { title: 'Enter prompt', text: 'Describe the edit.' },
      { title: 'Download', text: 'Get AI-edited photo.' },
    ],
    relatedTools: ['ai-background-remover', 'resize-video', 'crop-video'],
  },
  {
    slug: 'burn-subtitles',
    name: 'Burn Subtitles',
    category: 'ai',
    description: 'Burn SRT subtitles into any video with custom fonts, colors, and positioning.',
    metaTitle: 'Burn Subtitles into Video – Free, Styled, No Upload | Dayront',
    metaDescription: 'Burn SRT subtitles into any video with custom fonts, colors, and positioning. Audio preserved. 100% private.',
    icon: '🎬',
    type: 'burn-subtitles',
    outputFormat: 'mp4',
    settings: [],
    faq: [
      { question: 'Is audio preserved?', answer: 'Yes — the original audio track is included.' },
      { question: 'Does it work on iPhone?', answer: 'Yes — output is MP4 (H.264 + AAC).' },
    ],
    howTo: [
      { title: 'Upload your video', text: 'Select MP4, WebM, or MOV.' },
      { title: 'Add subtitles', text: 'Upload .SRT, paste text, or generate with AI.' },
      { title: 'Style & burn', text: 'Customize and render.' },
    ],
    relatedTools: ['ai-video-captions', 'video-cutter', 'video-compressor'],
  },
];

/* --------------------------------------------------------------------------
   ★ AUTO-GENERATED: RESOLUTION CONVERTERS
-------------------------------------------------------------------------- */

const RESOLUTION_PRESETS = [
  { key: '480p',  label: '480p SD',       w: 854,  h: 480,  tier: 1 },
  { key: '720p',  label: '720p HD',       w: 1280, h: 720,  tier: 2 },
  { key: '1080p', label: '1080p Full HD', w: 1920, h: 1080, tier: 3 },
  { key: '2k',    label: '2K QHD',        w: 2560, h: 1440, tier: 4 },
  { key: '4k',    label: '4K UHD',        w: 3840, h: 2160, tier: 5 },
  { key: '8k',    label: '8K UHD',        w: 7680, h: 4320, tier: 6 },
];

const resolutionTools: Tool[] = [];

for (const from of RESOLUTION_PRESETS) {
  for (const to of RESOLUTION_PRESETS) {
    if (from.key === to.key) continue;

    const isUpscale = to.tier > from.tier;
    const action = isUpscale ? 'Upscale' : 'Downscale';
    const requiresDesktop =
      from.key === '8k' || to.key === '8k' || (isUpscale && to.tier >= 5);
    const is8k = to.key === '8k';
    const is4kPlus = to.tier >= 5;

    const tier: ToolTier = is4kPlus ? 'heavy' : isUpscale ? 'medium' : 'light';
    const webMaxMB = is8k ? 100 : is4kPlus ? 150 : isUpscale ? 200 : 250;
    const recommendApp = is8k || is4kPlus;

    resolutionTools.push({
      slug: `${from.key}-to-${to.key}`,
      name: `${from.label} to ${to.label} ${action}er`,
      category: 'video-conversion',
      from: from.key,
      to: to.key,
      description: `${action} videos from ${from.label} to ${to.label} in your browser. Free, private, and 100% local.`,
      metaTitle: `${from.label} to ${to.label} Converter – Free Online | Dayront`,
      metaDescription: `${action} ${from.label} videos to ${to.label} in your browser. Free, private, no uploads. 100% local processing.`,
      icon: '🎬',
      type: 'resolution-convert',
      outputFormat: 'mp4',
      presetWidth: to.w,
      presetHeight: to.h,
      requiresDesktop,
      tier,
      engine: 'wasm',
      webMaxMB,
      recommendApp,
      webNote: is8k
        ? '8K conversion needs a powerful desktop. The Dayront Desktop app is highly recommended.'
        : is4kPlus
          ? '4K output is memory-intensive. The Dayront app is 10× faster.'
          : undefined,
      settings: [],
      faq: is8k
        ? [
            {
              question: 'Can I convert to 8K on mobile?',
              answer:
                'No. 8K requires more memory than most mobile browsers can allocate. Use a desktop with 16GB+ RAM, or the Dayront app for the best results.',
            },
            {
              question: 'How long does 8K conversion take?',
              answer:
                'A 30-second 1080p clip to 8K can take 3-10 minutes depending on your CPU.',
            },
          ]
        : isUpscale
        ? [
            {
              question: 'Will upscaling add detail?',
              answer:
                "No. Upscaling interpolates pixels but cannot recover detail that wasn't in the source. It standardizes resolution across your library.",
            },
            {
              question: 'Is it free?',
              answer: 'Yes, completely free with no signup.',
            },
          ]
        : [
            {
              question: 'Does downscaling reduce file size?',
              answer:
                'Yes, significantly. A 4K to 720p downscale can reduce file size by 80-90%.',
            },
            {
              question: 'Will I lose quality?',
              answer:
                'The output matches the target resolution exactly. Detail is preserved as well as possible at the lower resolution.',
            },
          ],
      howTo: [
        {
          title: 'Upload video',
          text: `Select a ${from.label} video file from your device.`,
        },
        {
          title: 'Convert',
          text: `Click convert to ${action.toLowerCase()} to ${to.label}.`,
        },
        {
          title: 'Download',
          text: `Save your ${to.label} video.`,
        },
      ],
      relatedTools: ['resize-video', 'video-compressor', 'video-cutter'],
    });
  }
}

/* ==========================================================================
 * ★ PLATFORM DEFAULTS
 * ========================================================================== */

const DEFAULT_LIMITS = {
  audioLight: 150,
  audioMedium: 250,
  videoLight: 200,
  videoMedium: 300,
  videoHeavy: 350,
  ai: 20,
} as const;

const PLATFORM_DEFAULTS: Record<string, Partial<Tool>> = {
  // ── Audio utility ────────────────────────
  cut:              { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  merge:            { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  compress:         { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  boost:            { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  speed:            { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  reverse:          { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  'stereo-to-mono': { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },

  // ── Format conversion ────────────────────
  convert:          { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoMedium, recommendApp: false },
  'convert-video':  { tier: 'medium', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoMedium, recommendApp: true },

  // ── Video utility ────────────────────────
  'video-cut':      { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoLight,  recommendApp: false },
  'video-merge':    { tier: 'heavy',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoHeavy,  recommendApp: true },
  'video-compress': { tier: 'heavy',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoHeavy,  recommendApp: true },
  'video-to-gif':   { tier: 'medium', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoLight,  recommendApp: true },
  'gif-to-video':   { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoLight,  recommendApp: false },
  'resize-video':   { tier: 'medium', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoMedium, recommendApp: true },
  'crop-video':     { tier: 'medium', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoMedium, recommendApp: true },
  'change-fps':     { tier: 'medium', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoMedium, recommendApp: true },
  'mute-video':     { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoLight,  recommendApp: false },
  'extract-audio':  { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoMedium, recommendApp: false },
  'resolution-convert': { tier: 'medium', engine: 'wasm', webMaxMB: 200, recommendApp: true },

  // ── AI ────────────────────────────────────
  'ai-captions':     { tier: 'heavy',  engine: 'ai',     webMaxMB: DEFAULT_LIMITS.ai, recommendApp: true },
  'ai-remove-bg':    { tier: 'heavy',  engine: 'ai',     webMaxMB: DEFAULT_LIMITS.ai, recommendApp: true },
  'ai-photo-editor': { tier: 'heavy',  engine: 'ai',     webMaxMB: DEFAULT_LIMITS.ai, recommendApp: true },
  'burn-subtitles':  { tier: 'heavy',  engine: 'native', webMaxMB: 50,               recommendApp: true },

  // ── Fallback by category ─────────────────
  'audio-utility':     { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  'audio-conversion':  { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  'video-to-audio':    { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoMedium, recommendApp: false },
  'video-utility':     { tier: 'medium', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoMedium, recommendApp: false },
  'video-conversion':  { tier: 'medium', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.videoMedium, recommendApp: false },
  ai:                  { tier: 'heavy',  engine: 'ai',   webMaxMB: DEFAULT_LIMITS.ai,          recommendApp: true },
};

/* ==========================================================================
 * ★ PLATFORM OVERRIDES
 * ========================================================================== */

const PLATFORM_OVERRIDES: Record<string, Partial<Tool>> = {
  'video-merger': {
    tier: 'heavy',
    webMaxMB: 300,
    recommendApp: true,
    webNote: 'Merging re-encodes video. For files over 300 MB, the Dayront app is much faster.',
  },
  'video-compressor': {
    tier: 'heavy',
    webMaxMB: 350,
    recommendApp: true,
    webNote: 'Compression is CPU-intensive. The Dayront app uses native FFmpeg — up to 10× faster.',
  },
  'video-to-gif': {
    tier: 'medium',
    webMaxMB: 150,
    recommendApp: true,
    webNote: 'GIF conversion is memory-heavy. Keep clips short for best results.',
  },
  'ai-video-captions': {
    tier: 'heavy',
    engine: 'ai',
    webMaxMB: 20,
    recommendApp: true,
    webNote: 'AI captioning needs ~1 GB free RAM. For longer videos, use the Dayront app.',
  },
  'ai-background-remover': {
    tier: 'heavy',
    engine: 'ai',
    webMaxMB: 20,
    recommendApp: true,
    webNote: 'First run downloads a ~40 MB AI model. The app comes pre-bundled.',
  },
  'ai-photo-editor': {
    tier: 'heavy',
    engine: 'ai',
    webMaxMB: 20,
    recommendApp: true,
  },
  'burn-subtitles': {
    tier: 'heavy',
    engine: 'native',
    webMaxMB: 50,
    recommendApp: true,
    webNote: 'Burning subtitles re-encodes the whole video. The Dayront app is 10× faster.',
  },
  'flv-to-webm': {
    tier: 'medium',
    webMaxMB: 250,
    recommendApp: true,
    webNote: 'WebM encoding via libvpx is slow in-browser. Try the Dayront app.',
  },
};

/* ==========================================================================
 * ★ ENRICH + EXPORT
 * ========================================================================== */

function enrichTool(tool: Tool): Tool {
  const byType = tool.type ? PLATFORM_DEFAULTS[tool.type] : undefined;
  const byCategory = PLATFORM_DEFAULTS[tool.category];
  const override = PLATFORM_OVERRIDES[tool.slug];

  return {
    ...byCategory,
    ...byType,
    ...tool,
    ...override,
  };
}

export const tools: Tool[] = [...baseTools, ...resolutionTools].map(enrichTool);

/* ==========================================================================
 * ★ PUBLIC HELPERS
 * ========================================================================== */

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function isFileSafeForTool(
  tool: Tool,
  fileSizeMB: number,
  isNative: boolean,
): boolean {
  const limit = isNative ? 5000 : (tool.webMaxMB ?? 250);
  return fileSizeMB <= limit;
}

export function getToolsByCategory(): Record<Tool['category'], Tool[]> {
  return tools.reduce(
    (acc, tool) => {
      (acc[tool.category] ??= []).push(tool);
      return acc;
    },
    {} as Record<Tool['category'], Tool[]>,
  );
}

export function getAppRecommendedTools(): Tool[] {
  return tools.filter((t) => t.recommendApp);
}

export function getTierCounts(): Record<ToolTier, number> {
  return tools.reduce(
    (acc, t) => {
      const tier = t.tier ?? 'medium';
      acc[tier] = (acc[tier] ?? 0) + 1;
      return acc;
    },
    { light: 0, medium: 0, heavy: 0 } as Record<ToolTier, number>,
  );
}

export function getToolsByTier(tier: ToolTier): Tool[] {
  return tools.filter((t) => (t.tier ?? 'medium') === tier);
}

export function getToolsByEngine(engine: ToolEngine): Tool[] {
  return tools.filter((t) => (t.engine ?? 'wasm') === engine);
}

/* ==========================================================================
 * ★ PLATFORM DETECTION (client-side runtime)
 * ========================================================================== */

export function detectPlatform(): PlatformInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { type: 'server', label: 'Server', engine: 'wasm', maxMB: 0 };
  }

  const w = window as any;
  const isTauri = w.__TAURI__ !== undefined || w.__TAURI_INTERNALS__ !== undefined;
  const isCapacitor = w.Capacitor !== undefined;
  const isExtension =
    typeof chrome !== 'undefined' &&
    chrome.runtime !== undefined &&
    chrome.runtime.id !== undefined;

  const ua = navigator.userAgent || '';
  const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);

  if (isTauri) {
    return { type: 'desktop-native', label: 'Desktop App', engine: 'native', maxMB: 5000 };
  }
  if (isCapacitor) {
    // ★ Aligned with the marketing promise: 5 GB on native mobile.
    return { type: 'mobile-native', label: 'Mobile App', engine: 'native', maxMB: 5000 };
  }
  if (isExtension) {
    return { type: 'extension', label: 'Browser Extension', engine: 'wasm', maxMB: 50 };
  }
  if (isMobileUA) {
    return { type: 'mobile-web', label: 'Mobile Web', engine: 'wasm', maxMB: 100 };
  }
  return { type: 'web', label: 'Web', engine: 'wasm', maxMB: 500 };
}