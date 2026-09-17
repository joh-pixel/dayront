import fs from 'fs';
import path from 'path';

// ⚙️ CONFIGURATION
const BASE_DIR = 'src/pages';

// 🎯 YOUR LONG-TAIL KEYWORD MAPPING
// Format: 'old-slug': 'new-seo-optimized-slug'
const slugMap = {
  // --- TOOLS ---
  'audio-cutter': 'trim-audio-files-online-free',
  'audio-merger': 'merge-audio-files-privacy-first',
  'audio-compressor': 'compress-audio-files-online-free',
  'volume-booster': 'boost-audio-volume-online-free',
  'stereo-to-mono': 'convert-stereo-to-mono-privacy-first',
  'speed-changer': 'change-audio-speed-without-pitch-online',
  'reverse-audio': 'reverse-audio-files-online-free',
  'extract-audio': 'extract-audio-from-video-privacy-first',
  'video-cutter': 'trim-video-files-online-free',
  'video-merger': 'merge-video-files-privacy-first',
  'video-compressor': 'compress-video-files-online-free',
  'video-to-gif': 'convert-video-to-gif-online-free',
  'gif-to-video': 'convert-gif-to-video-privacy-first',
  'mute-video': 'mute-video-audio-online-free',
  'crop-video': 'crop-video-online-free',
  'resize-video': 'resize-video-resolution-online-free',
  'change-fps': 'change-video-fps-online-free',
  'burn-subtitles': 'burn-subtitles-into-video-privacy-first',
  'ai-background-remover': 'remove-background-from-image-ai-free',
  'ai-photo-editor': 'ai-photo-editor-online-free',
  'ai-video-captions': 'generate-video-captions-ai-free',

  // --- CONVERTERS ---
  'mp3-to-wav': 'convert-mp3-to-wav-online-free',
  'wav-to-mp3': 'convert-wav-to-mp3-privacy-first',
  'mp4-to-mp3': 'convert-mp4-to-mp3-online-free',
  'flac-to-mp3': 'convert-flac-to-mp3-privacy-first',
  'm4a-to-mp3': 'convert-m4a-to-mp3-online-free',
  'mov-to-mp3': 'convert-mov-to-mp3-privacy-first',
  'webm-to-mp3': 'convert-webm-to-mp3-online-free',
  'aac-to-mp3': 'convert-aac-to-mp3-privacy-first',
  'ogg-to-mp3': 'convert-ogg-to-mp3-online-free',
  'opus-to-mp3': 'convert-opus-to-mp3-privacy-first',
  'avi-to-mp3': 'convert-avi-to-mp3-online-free',
  'mkv-to-mp3': 'convert-mkv-to-mp3-privacy-first',
  'webm-to-wav': 'convert-webm-to-wav-online-free',
  'mp4-to-wav': 'convert-mp4-to-wav-privacy-first',
  'aiff-to-mp3': 'convert-aiff-to-mp3-online-free',
  'amr-to-mp3': 'convert-amr-to-mp3-privacy-first',
  'ape-to-mp3': 'convert-ape-to-mp3-online-free',
  'flv-to-mp3': 'convert-flv-to-mp3-privacy-first',
  'flv-to-mp4': 'convert-flv-to-mp4-online-free',
  'flv-to-webm': 'convert-flv-to-webm-privacy-first',
  'mp3-to-m4a': 'convert-mp3-to-m4a-online-free',
  'mp3-to-ogg': 'convert-mp3-to-ogg-privacy-first',
};

// ==========================================
// DO NOT EDIT BELOW THIS LINE
// ==========================================

const redirects = {};

console.log('🚀 Starting file renames...\n');

for (const [oldSlug, newSlug] of Object.entries(slugMap)) {
  // 1. Handle Tools
  const toolOldPath = path.join(BASE_DIR, 'tools', `${oldSlug}.astro`);
  const toolNewPath = path.join(BASE_DIR, 'tools', `${newSlug}.astro`);
  
  if (fs.existsSync(toolOldPath)) {
    fs.renameSync(toolOldPath, toolNewPath);
    console.log(`✅ Renamed tools/${oldSlug}.astro -> ${newSlug}.astro`);
    redirects[`/tools/${oldSlug}`] = `/tools/${newSlug}`;
  }

  // 2. Handle Converters
  const convertOldPath = path.join(BASE_DIR, 'convert', `${oldSlug}.astro`);
  const convertNewPath = path.join(BASE_DIR, 'convert', `${newSlug}.astro`);
  
  if (fs.existsSync(convertOldPath)) {
    fs.renameSync(convertOldPath, convertNewPath);
    console.log(`✅ Renamed convert/${oldSlug}.astro -> ${newSlug}.astro`);
    redirects[`/convert/${oldSlug}`] = `/convert/${newSlug}`;
  }
}

console.log('\n🎉 All done! Files renamed successfully.');
console.log('\n📋 Copy these into your astro.config.mjs under `redirects:`\n');
console.log(JSON.stringify(redirects, null, 2));