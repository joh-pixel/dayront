/**
 * src/core/intake.ts
 * ----------------------------------------------------------------------------
 * Smart intake classifier.
 *
 * Given a URL (from clipboard, deep link, or share sheet) or a File
 * (from picker), figure out:
 *   • What kind of media it is
 *   • Which Dayront tool is the best match
 *   • A short human-readable reason
 *
 * Pure logic — no network calls, no native APIs. Safe everywhere.
 */

export type IntakeSource = 'clipboard' | 'deeplink' | 'share' | 'picker';

export interface IntakeDetection {
  /** 'url' | 'file' */
  kind: 'url' | 'file';
  /** 'video' | 'audio' | 'image' | 'gif' | 'unknown' */
  media: string;
  /** 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'facebook' | 'vimeo' | null */
  platform: string | null;
  /** Extension like 'mp4', 'mp3', 'jpg' (lowercased, no dot) */
  extension: string | null;
  /** Original input (URL or filename) */
  source: string;
}

export interface IntakeSuggestion {
  /** Tool slug to route to, or null if we can't help yet */
  slug: string | null;
  /** Human-readable reason (shows under the banner) */
  reason: string;
  /** Confidence 0–1 (used to decide whether to show the banner) */
  confidence: number;
  /** Short banner title */
  title: string;
  /** Small icon */
  icon: string;
  /** The detection that produced this */
  detection: IntakeDetection;
}

/* ── URL parsing helpers ─────────────────────────────────── */

const KNOWN_PLATFORMS: Array<{
  key: string;
  label: string;
  icon: string;
  match: RegExp;
}> = [
  { key: 'youtube',   label: 'YouTube',   icon: '▶️', match: /(?:youtube\.com\/(?:watch|shorts)|youtu\.be\/)/i },
  { key: 'tiktok',    label: 'TikTok',    icon: '🎵', match: /tiktok\.com\//i },
  { key: 'instagram', label: 'Instagram', icon: '📸', match: /instagram\.com\/(?:p|reel|tv)\//i },
  { key: 'twitter',   label: 'X / Twitter', icon: '🐦', match: /(?:twitter\.com|x\.com)\/[^/]+\/status\//i },
  { key: 'facebook',  label: 'Facebook',  icon: '📘', match: /facebook\.com\/.+\/(?:videos|watch|reel)/i },
  { key: 'vimeo',     label: 'Vimeo',     icon: '🎬', match: /vimeo\.com\/\d+/i },
];

const MEDIA_EXTENSIONS: Record<string, 'video' | 'audio' | 'image' | 'gif'> = {
  // Video
  mp4: 'video', mov: 'video', m4v: 'video', webm: 'video', mkv: 'video',
  avi: 'video', flv: 'video', '3gp': 'video', mpg: 'video', mpeg: 'video',
  // Audio
  mp3: 'audio', wav: 'audio', m4a: 'audio', aac: 'audio', ogg: 'audio',
  opus: 'audio', flac: 'audio', aiff: 'audio', aif: 'audio', amr: 'audio',
  ape: 'audio',
  // Image
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', bmp: 'image',
  heic: 'image',
  // GIF (its own thing)
  gif: 'gif',
};

function getExtension(input: string): string | null {
  // Try to strip query string first (for URLs)
  const clean = input.split('?')[0].split('#')[0];
  const match = clean.match(/\.([a-z0-9]{2,5})$/i);
  return match ? match[1].toLowerCase() : null;
}

function isLikelyUrl(input: string): boolean {
  return /^(https?:\/\/|www\.)/i.test(input.trim());
}

/* ── File classification ─────────────────────────────────── */

function classifyFile(file: File): IntakeDetection {
  const ext = getExtension(file.name);
  return {
    kind: 'file',
    media: (ext && MEDIA_EXTENSIONS[ext]) || 'unknown',
    platform: null,
    extension: ext,
    source: file.name,
  };
}

function classifyUrl(url: string): IntakeDetection {
  const trimmed = url.trim();

  // Known platform?
  for (const p of KNOWN_PLATFORMS) {
    if (p.match.test(trimmed)) {
      return {
        kind: 'url',
        media: 'video',           // all supported platforms are video-first
        platform: p.key,
        extension: null,
        source: trimmed,
      };
    }
  }

  // Direct media URL?
  const ext = getExtension(trimmed);
  if (ext && MEDIA_EXTENSIONS[ext]) {
    return {
      kind: 'url',
      media: MEDIA_EXTENSIONS[ext],
      platform: null,
      extension: ext,
      source: trimmed,
    };
  }

  return {
    kind: 'url',
    media: 'unknown',
    platform: null,
    extension: null,
    source: trimmed,
  };
}

/* ── Suggestion logic ────────────────────────────────────── */

/** Platforms we don't have downloaders for yet. */
const DOWNLOADER_COMING_SOON: Record<string, { label: string; icon: string }> = {
  youtube:   { label: 'YouTube',    icon: '▶️' },
  tiktok:    { label: 'TikTok',     icon: '🎵' },
  instagram: { label: 'Instagram',  icon: '📸' },
  twitter:   { label: 'X',          icon: '🐦' },
  facebook:  { label: 'Facebook',   icon: '📘' },
  vimeo:     { label: 'Vimeo',      icon: '🎬' },
};

function suggestForFile(detection: IntakeDetection): IntakeSuggestion {
  const { media, extension } = detection;

  if (media === 'video') {
    return {
      slug: 'video-compressor',
      title: `Compress this ${extension?.toUpperCase() || 'video'}`,
      reason: 'Shrink the file size without losing visible quality.',
      confidence: 0.85,
      icon: '📉',
      detection,
    };
  }

  if (media === 'audio') {
    return {
      slug: 'audio-compressor',
      title: `Compress this ${extension?.toUpperCase() || 'audio'}`,
      reason: 'Reduce the file size with minimal quality loss.',
      confidence: 0.85,
      icon: '📦',
      detection,
    };
  }

  if (media === 'gif') {
    return {
      slug: 'gif-to-video',
      title: 'Convert this GIF to MP4',
      reason: 'MP4 files are much smaller than GIFs and support audio.',
      confidence: 0.9,
      icon: '🎞️',
      detection,
    };
  }

  if (media === 'image') {
    return {
      slug: 'ai-photo-editor',
      title: 'Edit this image with AI',
      reason: 'Remove backgrounds, retouch, or generate variations.',
      confidence: 0.7,
      icon: '🎨',
      detection,
    };
  }

  return {
    slug: null,
    title: 'Unrecognized file type',
    reason: 'We could not detect what kind of file this is.',
    confidence: 0.2,
    icon: '❓',
    detection,
  };
}

function suggestForUrl(detection: IntakeDetection): IntakeSuggestion {
  const { media, platform, extension } = detection;

  // ── Known video platform → downloader placeholder ──
  if (platform && DOWNLOADER_COMING_SOON[platform]) {
    const p = DOWNLOADER_COMING_SOON[platform];
    return {
      slug: null,
      title: `${p.label} link detected`,
      reason: `${p.label} downloader is coming soon. Meanwhile, download the video, then drop it here to extract audio, compress, or convert it.`,
      confidence: 0.9,
      icon: p.icon,
      detection,
    };
  }

  // ── Direct media URL ──
  if (media === 'video') {
    return {
      slug: 'video-compressor',
      title: `Compress this ${extension?.toUpperCase() || 'video'}`,
      reason: 'Save this video, then drop it here to compress or extract audio.',
      confidence: 0.7,
      icon: '📉',
      detection,
    };
  }

  if (media === 'audio') {
    return {
      slug: 'audio-compressor',
      title: `Compress this ${extension?.toUpperCase() || 'audio'}`,
      reason: 'Save this audio, then drop it here to compress or convert.',
      confidence: 0.7,
      icon: '📦',
      detection,
    };
  }

  if (media === 'image') {
    return {
      slug: 'ai-photo-editor',
      title: 'Edit this image with AI',
      reason: 'Save the image, then drop it here to remove the background or retouch.',
      confidence: 0.7,
      icon: '🎨',
      detection,
    };
  }

  return {
    slug: null,
    title: 'URL detected',
    reason: 'We could not match this link to a tool. Browse our tools to pick one manually.',
    confidence: 0.3,
    icon: '🔗',
    detection,
  };
}

/* ── Public API ──────────────────────────────────────────── */

export function classify(input: string | File): IntakeSuggestion {
  let detection: IntakeDetection;

  if (input instanceof File) {
    detection = classifyFile(input);
    return suggestForFile(detection);
  }

  if (typeof input === 'string' && isLikelyUrl(input)) {
    detection = classifyUrl(input);
    return suggestForUrl(detection);
  }

  // Fallback: string that isn't a URL — treat as a filename
  if (typeof input === 'string') {
    const ext = getExtension(input);
    detection = {
      kind: 'file',
      media: (ext && MEDIA_EXTENSIONS[ext]) || 'unknown',
      platform: null,
      extension: ext,
      source: input,
    };
    return suggestForFile(detection);
  }

  return {
    slug: null,
    title: 'Nothing to suggest',
    reason: 'Provide a URL or a file to get a suggestion.',
    confidence: 0,
    icon: '❓',
    detection: {
      kind: 'url', media: 'unknown', platform: null, extension: null, source: '',
    },
  };
}