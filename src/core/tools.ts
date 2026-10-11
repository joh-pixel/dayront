export interface FAQ {
  question: string;
  answer: string;
}

export interface HowToStep {
  title: string;
  text: string;
}

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

/** Fade curve shapes (shared by audio-fade and audio-crossfade). */
const FADE_CURVE_OPTIONS: SettingOption[] = [
  { value: 'tri',  label: 'Linear — natural, most common' },
  { value: 'qsin', label: 'Quarter sine — gentle S-curve' },
  { value: 'hsin', label: 'Half sine — dramatic S-curve' },
  { value: 'exp',  label: 'Exponential — fast rise, slow settle' },
  { value: 'log',  label: 'Logarithmic — slow rise, fast settle' },
];

/* --------------------------------------------------------------------------
   BASE TOOLS
-------------------------------------------------------------------------- */

const baseTools: Tool[] = [
  // ══════════════════════════════════════════════════════════
  //   FEATURED UTILITY
  // ══════════════════════════════════════════════════════════
  {
    slug: 'url-download',
    name: 'Download from URL',
    category: 'video-utility',
    description: 'Fetch media from any direct HTTPS link — no server, no proxy, no upload.',
    metaTitle: 'Download from URL – Direct Media Link Downloader | Dayront',
    metaDescription: 'Fetch media from direct HTTPS links, Archive.org, Wikimedia Commons and podcast feeds. Runs in your browser — no server, no tracking.',
    icon: '📥',
    type: 'url-download',
    outputFormat: '',
    settings: [],
    faq: [
      { question: 'Which URLs work with the downloader?', answer: 'Direct links to media files (.mp3, .mp4, .wav, .jpg, .png) on servers that allow cross-origin fetches. Archive.org, Wikimedia Commons, most podcast CDNs, and any self-hosted server with permissive CORS.' },
      { question: "Why doesn't YouTube, TikTok, or Instagram work?", answer: "Those platforms refuse cross-origin requests at the network level. Making them work would require a server that proxies the request — which breaks Dayront's privacy promise and violates our hosting provider's terms. We deliberately don't do that." },
      { question: 'Is my URL private?', answer: 'Yes. The fetch runs entirely in your browser, going directly from your device to the source server. Dayront never sees the URL, never logs it, and never proxies it.' },
      { question: 'What size files can I download?', answer: 'Up to 300 MB on mobile, 800 MB on desktop. Larger files risk exhausting browser memory and crashing the tab.' },
      { question: 'Can I use this for a podcast episode?', answer: "Yes. Open the podcast's RSS feed, copy the direct MP3 URL for the episode you want, and paste it here. Most podcast hosts allow cross-origin fetches." },
      { question: 'What does "CORS" mean in the error message?', answer: "CORS is a browser security feature. When a website doesn't send the right headers, the browser blocks another site from reading the response. It's a hard wall — no website can bypass it, only a server proxy can, which is the thing we're refusing to use." },
    ],
    howTo: [
      { title: 'Paste a direct media URL', text: 'An HTTPS link ending in .mp3, .mp4, .wav, .jpg, .png — or a streaming link from Archive.org, Wikimedia Commons, or a podcast feed.' },
      { title: 'Click Fetch', text: 'Your browser downloads the file directly from the source. Progress is shown live.' },
      { title: 'Preview and download', text: 'Where the content type supports it, the file is previewed inline. Save it to your device with one click.' },
    ],
    relatedTools: ['extract-audio', 'audio-cutter', 'video-cutter'],
  },

  // ══════════════════════════════════════════════════════════
  //   AUDIO UTILITIES
  // ══════════════════════════════════════════════════════════
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
    relatedTools: ['audio-cutter', 'audio-crossfade', 'audio-compressor'],
  },
  {
    slug: 'audio-compressor',
    name: 'Audio Size Reducer',
    category: 'audio-utility',
    description: 'Reduce the file size of an audio file.',
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
      { question: 'Looking for dynamic range compression?', answer: 'This tool reduces file size. For loudness/tone compression, use the Audio Dynamic Compressor.' },
    ],
    howTo: [
      { title: 'Upload your audio file', text: 'Select the file to compress.' },
      { title: 'Choose compression strength', text: 'Adjust quality vs size.' },
      { title: 'Download compressed file', text: 'Get a lighter file instantly.' },
    ],
    relatedTools: ['volume-booster', 'audio-dynamic-compress', 'mp3-to-wav'],
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
    relatedTools: ['audio-normalize', 'audio-compressor', 'audio-limit'],
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
    relatedTools: ['audio-channels', 'volume-booster', 'mp3-to-wav'],
  },
  {
    slug: 'audio-denoise',
    name: 'Audio Denoiser',
    category: 'audio-utility',
    description: 'Remove background noise and hum from audio or video files.',
    metaTitle: 'Audio Denoiser – Remove Background Noise Online Free | Dayront',
    metaDescription: 'Denoise audio and video files in your browser. Removes fan hum, AC noise, hiss and static. No uploads, 100% private.',
    icon: '🎙️',
    type: 'denoise',
    outputFormat: 'mp3',
    settings: [
      {
        name: 'strength',
        label: 'Noise Reduction',
        type: 'select',
        default: 'balanced',
        options: [
          { value: 'light',      label: 'Light — subtle hiss, minimal impact' },
          { value: 'balanced',   label: 'Balanced — recommended' },
          { value: 'strong',     label: 'Strong — steady hum, fan noise' },
          { value: 'aggressive', label: 'Aggressive — heavy background noise' },
        ],
      },
    ],
    faq: [
      { question: 'How does it work?', answer: 'It uses an FFT-based denoiser that estimates the background noise spectrum and subtracts it from your audio. Everything runs in your browser — nothing is uploaded.' },
      { question: 'Does it work on video files?', answer: 'Yes. Drop a video and the video stream is copied untouched while the audio track is denoised.' },
      { question: 'Will it remove speech or music?', answer: 'No. The filter targets steady background noise (fans, AC, electrical hum). Speech and music are preserved.' },
      { question: 'Which strength should I pick?', answer: 'Balanced works for most files. Use Light for subtle hiss, Strong for loud steady hums, and Aggressive for heavy broadband noise.' },
      { question: 'Is it free?', answer: 'Yes — completely free, no registration, no uploads.' },
    ],
    howTo: [
      { title: 'Upload your audio or video', text: 'Drop an MP3, WAV, M4A, MP4, MOV, or any common media file.' },
      { title: 'Pick a noise reduction strength', text: 'Start with Balanced. Choose higher for louder backgrounds.' },
      { title: 'Download the cleaned file', text: 'Audio in — audio out. Video in — same container, video untouched.' },
    ],
    relatedTools: ['audio-gate', 'audio-dehum', 'audio-compressor'],
  },

  // ── Audio production ──────────────────────
  {
    slug: 'audio-fade',
    name: 'Fade In / Fade Out',
    category: 'audio-utility',
    description: 'Add smooth fade-in and fade-out to any audio or video file.',
    metaTitle: 'Fade In / Fade Out Audio – Free Online, No Upload | Dayront',
    metaDescription: 'Add professional fade-in and fade-out to audio and video in your browser. Choose your curve. No uploads, 100% private.',
    icon: '🌅',
    type: 'fade',
    outputFormat: 'mp3',
    settings: [
      { name: 'fadeIn',  label: 'Fade-in duration',  type: 'number', min: 0, default: 2 },
      { name: 'fadeOut', label: 'Fade-out duration', type: 'number', min: 0, default: 2 },
      { name: 'curve',   label: 'Curve shape', type: 'select', default: 'tri', options: FADE_CURVE_OPTIONS },
    ],
    faq: [
      { question: 'What is a fade?', answer: 'A gradual rise (fade-in) or fall (fade-out) in volume at the start or end of a file — the standard way to make tracks end cleanly.' },
      { question: 'Which curve should I pick?', answer: 'Linear is natural and works for most material. Quarter sine is gentle. Exponential is great for songs fading into silence.' },
      { question: 'Does it work on video files?', answer: 'Yes. Video is copied untouched; only the audio track fades.' },
      { question: 'Can I set only one side?', answer: 'Yes. Set the other side to 0 and only the chosen fade applies.' },
    ],
    howTo: [
      { title: 'Upload your audio or video', text: 'Drop an MP3, WAV, MP4, MOV, or any common media file.' },
      { title: 'Set fade-in and fade-out durations', text: 'Typical values: 1–3 seconds for music, 0.3–1 second for speech.' },
      { title: 'Download the faded file', text: 'Same container as your input.' },
    ],
    relatedTools: ['audio-normalize', 'audio-crossfade', 'audio-cutter'],
  },
  {
    slug: 'audio-normalize',
    name: 'Loudness Normalizer',
    category: 'audio-utility',
    description: 'Normalise audio to streaming and broadcast loudness standards (EBU R128).',
    metaTitle: 'Loudness Normalizer – EBU R128 LUFS Online Free | Dayront',
    metaDescription: 'Normalise audio to Spotify, YouTube, Apple Podcasts or broadcast targets in your browser. No uploads, 100% private.',
    icon: '📻',
    type: 'normalize',
    outputFormat: 'mp3',
    settings: [
      {
        name: 'targetLufs',
        label: 'Target loudness',
        type: 'select',
        default: -14,
        options: [
          { value: -14, label: 'Spotify / YouTube / Amazon — -14 LUFS' },
          { value: -16, label: 'Apple Podcasts / Apple Music — -16 LUFS' },
          { value: -18, label: 'Web streaming — -18 LUFS' },
          { value: -23, label: 'Broadcast (EBU R128) — -23 LUFS' },
        ],
      },
      { name: 'truePeak', label: 'True peak ceiling (dBTP)', type: 'number', min: -20, max: 0, default: -1.5 },
      { name: 'lra',      label: 'Loudness range (LU)',       type: 'number', min: 1, max: 50, default: 11 },
    ],
    faq: [
      { question: 'What is LUFS?', answer: 'Loudness Units Full Scale — the broadcast industry standard for measuring perceived loudness. Every major streaming platform normalises to a specific LUFS target.' },
      { question: 'Why does my track get quieter on Spotify?', answer: 'Spotify normalises everything to -14 LUFS. If your file is louder than that, it gets turned down. If it is quieter, Spotify turns it up — but you lose headroom. Aim for -14.' },
      { question: 'What about true peak?', answer: 'True peak prevents inter-sample distortion during playback. Most platforms recommend -1 dBTP or lower.' },
      { question: 'Does it work on video files?', answer: 'Yes. Video is copied untouched; only the audio is normalised.' },
      { question: 'Is two-pass mode available?', answer: 'Not yet. Single-pass is accurate enough for streaming delivery. Two-pass (measure then apply) is planned.' },
    ],
    howTo: [
      { title: 'Upload your audio or video', text: 'Drop an MP3, WAV, M4A, MP4, MOV, or any common media file.' },
      { title: 'Pick a target loudness', text: 'Choose the platform your file is destined for.' },
      { title: 'Download the normalised file', text: 'Ready for delivery.' },
    ],
    relatedTools: ['loudness-meter', 'audio-limit', 'audio-dynamic-compress'],
  },
  {
    slug: 'audio-dynamic-compress',
    name: 'Audio Dynamic Compressor',
    category: 'audio-utility',
    description: 'Smooth out volume differences in voice, podcasts, and music.',
    metaTitle: 'Audio Compressor – Reduce Dynamic Range Online Free | Dayront',
    metaDescription: 'Compress the dynamic range of voice-over, podcasts and music in your browser. No uploads, 100% private.',
    icon: '🎚️',
    type: 'dynamic-compress',
    outputFormat: 'mp3',
    settings: [
      { name: 'threshold', label: 'Threshold (dB)',        type: 'number', min: -60, max: 0,    default: -20 },
      { name: 'ratio',     label: 'Ratio (1:n)',           type: 'number', min: 1,   max: 20,   default: 4 },
      { name: 'attack',    label: 'Attack (ms)',           type: 'number', min: 0.01, max: 2000, default: 20 },
      { name: 'release',   label: 'Release (ms)',          type: 'number', min: 0.01, max: 9000, default: 250 },
      { name: 'makeup',    label: 'Makeup gain (dB)',      type: 'number', min: 0,   max: 30,   default: 0 },
    ],
    faq: [
      { question: 'What does a compressor do?', answer: 'It reduces the level of loud parts so quieter parts become relatively louder. The result is steadier overall volume — essential for podcasts and voice-over.' },
      { question: 'Difference from Audio Size Reducer?', answer: 'This tool compresses dynamic range (loud vs quiet). Audio Size Reducer compresses file size. Completely different jobs.' },
      { question: 'What settings should I start with?', answer: 'Threshold -20, Ratio 4, Attack 20, Release 250, Makeup 0. Adjust threshold lower for quieter sources.' },
      { question: 'Will it distort?', answer: 'No. The compressor prevents clipping and preserves clarity.' },
    ],
    howTo: [
      { title: 'Upload your audio file', text: 'Drop an MP3, WAV, M4A, or any common audio file.' },
      { title: 'Set the compression parameters', text: 'Or keep the defaults — they work for most spoken-word material.' },
      { title: 'Download the compressed file', text: 'Steadier volume, same tone.' },
    ],
    relatedTools: ['audio-limit', 'audio-normalize', 'audio-gate'],
  },
  {
    slug: 'audio-gate',
    name: 'Noise Gate',
    category: 'audio-utility',
    description: 'Silence background noise between phrases in voice recordings.',
    metaTitle: 'Noise Gate – Silence Background Online Free | Dayront',
    metaDescription: 'Clean up voice recordings by silencing everything below a threshold. No uploads, 100% private.',
    icon: '🚪',
    type: 'gate',
    outputFormat: 'mp3',
    settings: [
      { name: 'threshold', label: 'Threshold (dB)', type: 'number', min: -90, max: 0,    default: -50 },
      { name: 'ratio',     label: 'Ratio (1:n)',    type: 'number', min: 1,   max: 9000, default: 4 },
      { name: 'attack',    label: 'Attack (ms)',    type: 'number', min: 0.01, max: 9000, default: 10 },
      { name: 'release',   label: 'Release (ms)',   type: 'number', min: 0.01, max: 9000, default: 200 },
    ],
    faq: [
      { question: 'What is a noise gate?', answer: 'A gate mutes the signal whenever it drops below a threshold. It removes breath, room tone, and small background noises between phrases.' },
      { question: 'Difference from the Denoiser?', answer: 'Denoise removes continuous noise (fan, hum) while keeping audio playing. Gate silences everything below a level — perfect for the gaps between speech.' },
      { question: 'What threshold should I use?', answer: 'Start at -50 dB. Lower it to -60 for very quiet rooms, raise to -40 for noisy ones.' },
      { question: 'Will it cut off the start of words?', answer: 'If the attack is too slow, yes. Keep attack under 20 ms for speech.' },
    ],
    howTo: [
      { title: 'Upload your audio file', text: 'Voice, podcast, or interview recording.' },
      { title: 'Set the gate threshold', text: '-50 dB is a safe default for most recordings.' },
      { title: 'Download the cleaned file', text: 'Silent gaps, clean phrases.' },
    ],
    relatedTools: ['audio-denoise', 'audio-dynamic-compress', 'audio-silence-remove'],
  },
  {
    slug: 'audio-limit',
    name: 'Peak Limiter',
    category: 'audio-utility',
    description: 'Prevent clipping with a brickwall peak limiter.',
    metaTitle: 'Audio Limiter – Brickwall Peak Limiter Online Free | Dayront',
    metaDescription: 'Brickwall limiting to prevent clipping in your browser. No uploads, 100% private.',
    icon: '🧱',
    type: 'limit',
    outputFormat: 'mp3',
    settings: [
      { name: 'ceiling', label: 'Ceiling (dB)',   type: 'number', min: -20, max: 0,    default: -1 },
      { name: 'attack',  label: 'Attack (ms)',    type: 'number', min: 0.1, max: 80,   default: 5 },
      { name: 'release', label: 'Release (ms)',   type: 'number', min: 1,   max: 8000, default: 50 },
    ],
    faq: [
      { question: 'What does a limiter do?', answer: 'It caps the loudest peaks of a signal so the output never exceeds a chosen ceiling. Essential as the last step before export.' },
      { question: 'Difference from the compressor?', answer: 'A compressor gently reduces loud parts. A limiter is a hard ceiling — nothing above it survives. Limiter goes after the compressor.' },
      { question: 'What ceiling should I use?', answer: '-1 dB is the streaming industry standard. -0.3 dB for maximum loudness on CD, -3 dB for safety on video.' },
      { question: 'Will it reduce overall loudness?', answer: 'Yes, if your file was clipping. That is the point — loudness trading for clean peaks.' },
    ],
    howTo: [
      { title: 'Upload your audio file', text: 'Anything that might clip on export.' },
      { title: 'Set the ceiling', text: '-1 dB is safe for all streaming platforms.' },
      { title: 'Download the limited file', text: 'No distortion, no clipping.' },
    ],
    relatedTools: ['audio-normalize', 'audio-dynamic-compress', 'volume-booster'],
  },
  {
    slug: 'audio-silence-remove',
    name: 'Silence Remover',
    category: 'audio-utility',
    description: 'Automatically trim out dead air from podcasts and interviews.',
    metaTitle: 'Silence Remover – Trim Dead Air Online Free | Dayront',
    metaDescription: 'Remove silence from podcasts, interviews and voice recordings in your browser. No uploads, 100% private.',
    icon: '⏭️',
    type: 'silence-remove',
    outputFormat: 'mp3',
    settings: [
      { name: 'threshold',   label: 'Silence threshold (dB)',  type: 'number', min: -90, max: 0,   default: -40 },
      { name: 'minSilence',  label: 'Minimum silence (sec)',   type: 'number', min: 0.1, max: 30,  default: 0.5 },
      { name: 'keepSilence', label: 'Kept silence (sec)',      type: 'number', min: 0,   max: 5,   default: 0.1 },
    ],
    faq: [
      { question: 'How does it work?', answer: 'It analyses the audio and chops out any stretch of silence longer than your minimum threshold. A tiny amount of the original silence is kept so phrases do not sound rushed.' },
      { question: 'What minimum silence should I use?', answer: '0.5 s works for most podcasts. Use 1.0 s for interviews, 0.3 s for energetic speech.' },
      { question: 'Will it cut out quiet words?', answer: 'If a word is quieter than your threshold it might be trimmed. Lower the threshold to -50 dB if that happens.' },
      { question: 'How long should kept silence be?', answer: '0.1 s is nearly imperceptible. 0.3 s sounds more natural for interview edits.' },
    ],
    howTo: [
      { title: 'Upload your recording', text: 'Podcast, interview, or voice memo.' },
      { title: 'Set the silence threshold', text: '-40 dB is a good starting point.' },
      { title: 'Download the tightened file', text: 'Tighter pacing, no dead air.' },
    ],
    relatedTools: ['audio-cutter', 'audio-gate', 'audio-denoise'],
  },
  {
    slug: 'audio-equalize',
    name: 'Equalizer',
    category: 'audio-utility',
    description: 'Shape tone with three-band bass / mid / treble EQ.',
    metaTitle: 'Audio Equalizer – 3-Band Bass, Mid, Treble Online Free | Dayront',
    metaDescription: 'Adjust bass, mid, and treble in your browser. No uploads, 100% private.',
    icon: '🎛️',
    type: 'equalize',
    outputFormat: 'mp3',
    settings: [
      { name: 'bass',   label: 'Bass (dB)',   type: 'number', min: -15, max: 15, default: 0 },
      { name: 'mid',    label: 'Mid (dB)',    type: 'number', min: -15, max: 15, default: 0 },
      { name: 'treble', label: 'Treble (dB)', type: 'number', min: -15, max: 15, default: 0 },
    ],
    faq: [
      { question: 'What does each band do?', answer: 'Bass boosts or cuts low frequencies (below ~200 Hz). Mid shapes the body of voice and instruments around 1 kHz. Treble shapes clarity and air above ~6 kHz.' },
      { question: 'Typical voice-over setting?', answer: 'Bass -2, Mid +2, Treble +1 for a warm, clear voice.' },
      { question: 'Typical music setting?', answer: 'Bass +2, Mid 0, Treble +1 for a slight smiley curve — good for pop.' },
      { question: 'Will it distort?', answer: 'At ±15 dB it might. Keep changes small for the cleanest result.' },
    ],
    howTo: [
      { title: 'Upload your audio file', text: 'Any common audio format.' },
      { title: 'Adjust the three bands', text: 'Positive values boost, negative cut. Keep at least one band at 0 unless you are aiming for a specific tone.' },
      { title: 'Download the shaped file', text: 'Your EQ applied.' },
    ],
    relatedTools: ['audio-dynamic-compress', 'volume-booster', 'audio-normalize'],
  },
  {
    slug: 'audio-resample',
    name: 'Sample Rate Converter',
    category: 'audio-utility',
    description: 'Convert between 44.1 kHz, 48 kHz, 96 kHz, and more.',
    metaTitle: 'Sample Rate Converter – 44.1 / 48 / 96 kHz Online Free | Dayront',
    metaDescription: 'Convert audio sample rate and bit depth in your browser. No uploads, 100% private.',
    icon: '📐',
    type: 'resample',
    outputFormat: 'wav',
    settings: [
      {
        name: 'sampleRate',
        label: 'Sample rate',
        type: 'select',
        default: 48000,
        options: [
          { value: 8000,  label: '8 000 Hz — Telephone' },
          { value: 16000, label: '16 000 Hz — Speech' },
          { value: 22050, label: '22 050 Hz — Old radio' },
          { value: 32000, label: '32 000 Hz — Broadcast' },
          { value: 44100, label: '44 100 Hz — CD audio (recommended for music)' },
          { value: 48000, label: '48 000 Hz — Video and broadcast standard (recommended for video)' },
          { value: 88200, label: '88 200 Hz — High-res music (2× CD)' },
          { value: 96000, label: '96 000 Hz — High-res audio' },
          { value: 176400, label: '176 400 Hz — High-res audio (4× CD)' },
          { value: 192000, label: '192 000 Hz — Studio master' },
        ],
      },
      {
        name: 'bitDepth',
        label: 'Bit depth',
        type: 'select',
        default: 16,
        options: [
          { value: 16, label: '16-bit — CD quality' },
          { value: 24, label: '24-bit — Studio standard' },
          { value: 32, label: '32-bit — Extreme headroom' },
        ],
      },
    ],
    faq: [
      { question: 'What sample rate do I need?', answer: 'For video and broadcast: 48 kHz. For music: 44.1 kHz. Higher rates (96 kHz+) are only useful if you plan to edit heavily or pitch-shift.' },
      { question: 'Does bit depth matter for MP3?', answer: 'No — bit depth only applies to WAV and FLAC. For MP3, the bitrate matters instead.' },
      { question: 'Will converting up improve quality?', answer: 'No. Converting 44.1 to 96 kHz does not add information. It only standardises your library.' },
    ],
    howTo: [
      { title: 'Upload your audio file', text: 'Any common audio format.' },
      { title: 'Pick a target sample rate', text: '48 kHz for video, 44.1 kHz for music, 96 kHz for high-res masters.' },
      { title: 'Download the converted file', text: 'Standardised sample rate and bit depth.' },
    ],
    relatedTools: ['mp3-to-wav', 'wav-to-mp3', 'audio-channels'],
  },
  {
    slug: 'audio-channels',
    name: 'Channel Utilities',
    category: 'audio-utility',
    description: 'Mono, stereo, swap channels, invert phase — all in one tool.',
    metaTitle: 'Audio Channel Utilities – Mono / Stereo / Swap / Phase | Dayront',
    metaDescription: 'Convert mono to stereo, swap channels, invert phase, or extract a single channel. No uploads, 100% private.',
    icon: '🔀',
    type: 'channels',
    outputFormat: 'mp3',
    settings: [
      {
        name: 'mode',
        label: 'Channel mode',
        type: 'select',
        default: 'stereo-to-mono',
        options: [
          { value: 'stereo-to-mono', label: 'Stereo → Mono (downmix)' },
          { value: 'mono-to-stereo', label: 'Mono → Stereo (duplicate)' },
          { value: 'swap-lr',        label: 'Swap left / right' },
          { value: 'invert-phase',   label: 'Invert phase (polarity flip)' },
          { value: 'left-only',      label: 'Keep left channel only' },
          { value: 'right-only',     label: 'Keep right channel only' },
        ],
      },
    ],
    faq: [
      { question: 'Why swap left and right?', answer: 'Sometimes a recording was captured with cables reversed. Swapping restores the correct stereo image.' },
      { question: 'What is phase inversion?', answer: 'It flips the polarity of the waveform. Used in some stereo-summing tricks and to cancel out one channel against another.' },
      { question: 'When would I use left-only?', answer: 'If you recorded two different sources on each channel (dual-mono), extracting one gives you a clean single-source file.' },
      { question: 'Difference from Stereo to Mono tool?', answer: 'That tool is a shortcut for the mono-downmix mode. This tool offers five other modes.' },
    ],
    howTo: [
      { title: 'Upload your audio file', text: 'Stereo or mono source.' },
      { title: 'Pick a channel mode', text: 'Six options cover the common cases.' },
      { title: 'Download the converted file', text: 'Channel configuration applied.' },
    ],
    relatedTools: ['stereo-to-mono', 'audio-resample', 'karaoke'],
  },
  {
    slug: 'audio-crossfade',
    name: 'Crossfade',
    category: 'audio-utility',
    description: 'Overlap two tracks with a smooth transition.',
    metaTitle: 'Audio Crossfade – Smooth Transition Between Two Tracks | Dayront',
    metaDescription: 'Crossfade two audio files in your browser. Perfect for DJ mixes and album transitions. No uploads, 100% private.',
    icon: '🔀',
    type: 'crossfade',
    outputFormat: 'mp3',
    settings: [
      { name: 'duration', label: 'Crossfade duration (sec)', type: 'number', min: 0.1, max: 30, default: 1.5 },
      { name: 'curve',    label: 'Curve shape', type: 'select', default: 'tri', options: FADE_CURVE_OPTIONS },
    ],
    faq: [
      { question: 'What is a crossfade?', answer: 'A transition where one track fades out while the other fades in. Used to blend two tracks seamlessly — the standard for DJ mixes and album flow.' },
      { question: 'How long should the crossfade be?', answer: '1–2 s for pop songs, 3–5 s for ambient or house, 0.5 s for fast-paced edits.' },
      { question: 'Does the audio overlap or play sequentially?', answer: 'It overlaps. If file A ends at 3:00 and file B starts at 0:00 with a 2 s crossfade, the total length is 3:00 + (length of B) − 2 s.' },
      { question: 'Why does this need exactly 2 files?', answer: 'Crossfading is defined between two tracks. For merging 3+ files, use the Audio Merger.' },
    ],
    howTo: [
      { title: 'Upload two audio files', text: 'The crossfade happens between file 1 → file 2 in that order.' },
      { title: 'Set the crossfade duration', text: 'Length of the overlap in seconds.' },
      { title: 'Download the crossfaded file', text: 'Seamless transition between both tracks.' },
    ],
    relatedTools: ['audio-merger', 'audio-fade', 'audio-cutter'],
  },
  {
    slug: 'audio-dehum',
    name: 'De-hum',
    category: 'audio-utility',
    description: 'Remove electrical hum at 50 Hz or 60 Hz and its harmonics.',
    metaTitle: 'De-hum Audio – Remove 50/60 Hz Electrical Hum | Dayront',
    metaDescription: 'Remove mains hum from audio recordings in your browser. Target 50 Hz (Europe) or 60 Hz (US) with harmonics. No uploads.',
    icon: '⚡',
    type: 'dehum',
    outputFormat: 'mp3',
    settings: [
      {
        name: 'frequency',
        label: 'Hum frequency',
        type: 'select',
        default: 50,
        options: [
          { value: 50, label: '50 Hz — Europe, Africa, most of Asia' },
          { value: 60, label: '60 Hz — US, Canada, parts of Japan' },
        ],
      },
      {
        name: 'harmonics',
        label: 'Harmonics to notch',
        type: 'select',
        default: 3,
        options: [
          { value: 1, label: 'Fundamental only (50/60 Hz)' },
          { value: 2, label: 'Plus 1st harmonic (100/120 Hz)' },
          { value: 3, label: 'Plus 2 harmonics (recommended)' },
          { value: 4, label: 'Plus 3 harmonics' },
          { value: 5, label: 'Plus 4 harmonics' },
          { value: 6, label: 'Plus 5 harmonics (aggressive)' },
        ],
      },
    ],
    faq: [
      { question: 'What is hum?', answer: 'A steady low-frequency buzz caused by electrical mains interference. It appears at 50 Hz (Europe/Asia) or 60 Hz (US/Canada) plus multiples of that frequency.' },
      { question: 'Difference from Audio Denoiser?', answer: 'Denoise removes broadband noise (fans, hiss). De-hum targets a specific frequency. For pure electrical hum, de-hum is more surgical and preserves more of the wanted signal.' },
      { question: 'How do I know which frequency?', answer: 'If your recording was made in Europe, Africa, Asia (most countries) or Australia: 50 Hz. North America, Brazil, parts of Japan, Taiwan: 60 Hz.' },
      { question: 'How many harmonics?', answer: '3 is a good default. Use 5 or 6 only if the hum is very strong and you have already tried 3.' },
    ],
    howTo: [
      { title: 'Upload your audio or video file', text: 'Hum happens most on recordings made near power supplies, guitar pickups, or cheap USB interfaces.' },
      { title: 'Pick the hum frequency', text: '50 Hz for most of the world, 60 Hz for the US and Canada.' },
      { title: 'Download the de-hummed file', text: 'Steady hum removed, everything else preserved.' },
    ],
    relatedTools: ['audio-denoise', 'audio-gate', 'audio-equalize'],
  },
  {
    slug: 'audio-reverb',
    name: 'Reverb / Echo',
    category: 'audio-utility',
    description: 'Add echo or simple reverb to any audio file.',
    metaTitle: 'Add Reverb / Echo to Audio Online Free | Dayront',
    metaDescription: 'Add reverb or echo to your audio in the browser. No uploads, 100% private.',
    icon: '🌊',
    type: 'reverb',
    outputFormat: 'mp3',
    settings: [
      { name: 'delayMs', label: 'Delay (ms)',   type: 'number', min: 1,    max: 2000, default: 100 },
      { name: 'decay',   label: 'Decay (0-0.95)', type: 'number', min: 0,  max: 0.95, default: 0.5 },
    ],
    faq: [
      { question: 'What is the difference between reverb and echo?', answer: 'Reverb is many short reflections blurring together (a room). Echo is a distinct repeat of the sound. This tool uses echo — short delays sound reverb-like, long delays sound like a canyon.' },
      { question: 'What delay should I use?', answer: 'For reverb-like effect: 30–80 ms. For slapback echo: 100–200 ms. For a canyon effect: 500 ms or more.' },
      { question: 'What does decay do?', answer: 'How much of each repeat survives. 0.5 means each echo is half as loud. Higher = longer tail.' },
      { question: 'Does it apply to video too?', answer: 'This tool is audio-only. Use Extract Audio first, process, then recombine with the video if you need the effect on video.' },
    ],
    howTo: [
      { title: 'Upload your audio file', text: 'Any common audio format.' },
      { title: 'Set delay and decay', text: 'Short delay + high decay = reverb-like space.' },
      { title: 'Download the processed file', text: 'Effect applied.' },
    ],
    relatedTools: ['audio-equalize', 'audio-dynamic-compress', 'audio-normalize'],
  },
  {
    slug: 'karaoke',
    name: 'Karaoke / Vocal Remover',
    category: 'audio-utility',
    description: 'Remove centre-panned vocals from a stereo track.',
    metaTitle: 'Vocal Remover – Karaoke Track Maker Online Free | Dayront',
    metaDescription: 'Remove vocals from stereo songs using phase cancellation. No uploads, 100% private.',
    icon: '🎤',
    type: 'karaoke',
    outputFormat: 'mp3',
    faq: [
      { question: 'How does it work?', answer: 'It subtracts the right channel from the left and vice versa. Centre-panned content (usually lead vocals) cancels out. Hard-panned instruments survive.' },
      { question: 'Will it work on every song?', answer: 'No. It works best on classic stereo pop, rock, and country mixes with centre-panned vocals. Modern productions use stereo tricks that survive the cancellation.' },
      { question: 'Why does the bass sometimes disappear?', answer: 'Bass is also usually panned centre, so it gets cancelled too. This is expected. Use EQ or a separate bass track if you want it back.' },
      { question: 'Does it work on mono files?', answer: 'No. Mono files have no stereo difference to cancel, so the output will be silent. Only stereo sources work.' },
      { question: 'How is this different from AI stem separation?', answer: 'This is phase cancellation — instant, free, no model download. AI separation gives cleaner results but requires a neural network. AI separation is planned for the Dayront App.' },
    ],
    howTo: [
      { title: 'Upload a stereo song', text: 'MP3, WAV, M4A — stereo only.' },
      { title: 'Run the tool', text: 'One click. No settings.' },
      { title: 'Download the karaoke track', text: 'Vocals reduced, instruments intact.' },
    ],
    relatedTools: ['audio-channels', 'audio-equalize', 'extract-audio'],
  },
  {
    slug: 'ringtone-maker',
    name: 'Ringtone Maker',
    category: 'audio-utility',
    description: 'Turn any song into a phone-ready ringtone.',
    metaTitle: 'Ringtone Maker – Create iPhone & Android Ringtones Free | Dayront',
    metaDescription: 'Create custom ringtones from any song in your browser. Automatic fades. iPhone (M4A) and Android (MP3) ready. No uploads.',
    icon: '🔔',
    type: 'ringtone',
    outputFormat: 'm4a',
    settings: [
      { name: 'start',   label: 'Start time (sec)',   type: 'number', min: 0, default: 0 },
      { name: 'duration', label: 'Duration (sec)',    type: 'number', min: 1, max: 60, default: 30 },
      { name: 'fadeIn',  label: 'Fade in (sec)',      type: 'number', min: 0, max: 10, default: 0.5 },
      { name: 'fadeOut', label: 'Fade out (sec)',     type: 'number', min: 0, max: 10, default: 0.5 },
    ],
    faq: [
      { question: 'What format is best for iPhone?', answer: 'M4A (AAC). iOS accepts M4A ringtones up to 40 seconds.' },
      { question: 'What format is best for Android?', answer: 'MP3. Android accepts most audio formats, 30 seconds is the common default.' },
      { question: 'Why is the max 60 seconds?', answer: 'Ringtones are typically 30–40 seconds. Longer files work but are wasteful.' },
      { question: 'Does it work on video files?', answer: 'Yes. Video is stripped to audio-only — perfect for grabbing a ringtone from a concert clip.' },
      { question: 'How do I install a ringtone on iPhone?', answer: 'Open the downloaded M4A in GarageBand, or use the iTunes/Finder sync method. Full instructions in the Dayront App.' },
    ],
    howTo: [
      { title: 'Upload a song or video', text: 'MP3, WAV, M4A, MP4, MOV — anything with audio.' },
      { title: 'Pick the segment', text: 'Set start time and duration. 30 seconds is standard.' },
      { title: 'Download your ringtone', text: 'M4A for iPhone, MP3 for Android.' },
    ],
    relatedTools: ['audio-cutter', 'audio-fade', 'mp3-to-m4a'],
  },
  {
    slug: 'loudness-meter',
    name: 'Loudness Meter',
    category: 'audio-utility',
    description: 'Analyse LUFS, true peak, and loudness range — no output file.',
    metaTitle: 'Loudness Meter – LUFS & True Peak Analyser Free | Dayront',
    metaDescription: 'Analyse integrated LUFS, true peak, and loudness range (EBU R128). No uploads, 100% private.',
    icon: '📊',
    type: 'loudness-meter',
    outputFormat: 'txt',
    faq: [
      { question: 'What does it measure?', answer: 'Integrated loudness (LUFS), true peak (dBTP), and loudness range (LU). These are the three metrics broadcast and streaming platforms care about.' },
      { question: 'Does it produce a file?', answer: 'It produces a text report, not audio. Use Loudness Normalizer if you want an adjusted audio file.' },
      { question: 'Why is my file louder than -14 LUFS?', answer: 'Modern masters often hit -9 or -10 LUFS. Spotify and YouTube will turn those down to -14 automatically — you lose headroom for nothing.' },
      { question: 'What true peak is safe?', answer: '-1 dBTP is the streaming industry recommendation.' },
      { question: 'What about LRA?', answer: 'Loudness range measures dynamic spread. Speech is typically 4–9 LU, music 6–12 LU, classical up to 20 LU.' },
    ],
    howTo: [
      { title: 'Upload your audio or video file', text: 'Anything you want to measure.' },
      { title: 'Wait for the analysis', text: 'Runs at real time or faster.' },
      { title: 'Download the report', text: 'Plain text with LUFS, dBTP, and LU plus reference targets.' },
    ],
    relatedTools: ['audio-normalize', 'audio-limit', 'audio-dynamic-compress'],
  },

  // ══════════════════════════════════════════════════════════
  //   AUDIO CONVERSIONS
  // ══════════════════════════════════════════════════════════
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
    relatedTools: ['m4a-to-mp3', 'mp3-to-wav', 'ringtone-maker'],
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

  // ══════════════════════════════════════════════════════════
  //   VIDEO TO AUDIO
  // ══════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════
  //   VIDEO CONVERSIONS
  // ══════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════
  //   VIDEO UTILITIES
  // ══════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════
  //   AI TOOLS
  // ══════════════════════════════════════════════════════════
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
  // ── Utility ──────────────────────────────
  'url-download': { tier: 'light', engine: 'wasm', webMaxMB: 800, recommendApp: false },

  // ── Audio utility ────────────────────────
  cut:              { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  merge:            { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  compress:         { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  boost:            { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  speed:            { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  reverse:          { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  'stereo-to-mono': { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  denoise:          { tier: 'light',  engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },

  // ── Audio production ─────────────────────
  fade:               { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  normalize:          { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  'dynamic-compress': { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  gate:               { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  limit:              { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  'silence-remove':   { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  equalize:           { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  resample:           { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  channels:           { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  crossfade:          { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  dehum:              { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  reverb:             { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioLight,  recommendApp: false },
  karaoke:            { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  ringtone:           { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },
  'loudness-meter':   { tier: 'light', engine: 'wasm', webMaxMB: DEFAULT_LIMITS.audioMedium, recommendApp: false },

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
 * ★ PLATFORM DETECTION
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