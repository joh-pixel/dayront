import fs from 'fs';
import path from 'path';

const BASE_DIR = 'src/pages';

// Reversed mapping (New SEO name -> Original name)
const slugMap = {
  'trim-audio-files-online-free': 'audio-cutter',
  'merge-audio-files-privacy-first': 'audio-merger',
  'compress-audio-files-online-free': 'audio-compressor',
  'boost-audio-volume-online-free': 'volume-booster',
  'convert-stereo-to-mono-privacy-first': 'stereo-to-mono',
  'change-audio-speed-without-pitch-online': 'speed-changer',
  'reverse-audio-files-online-free': 'reverse-audio',
  'extract-audio-from-video-privacy-first': 'extract-audio',
  'trim-video-files-online-free': 'video-cutter',
  'merge-video-files-privacy-first': 'video-merger',
  'compress-video-files-online-free': 'video-compressor',
  'convert-video-to-gif-online-free': 'video-to-gif',
  'convert-gif-to-video-privacy-first': 'gif-to-video',
  'mute-video-audio-online-free': 'mute-video',
  'crop-video-online-free': 'crop-video',
  'resize-video-resolution-online-free': 'resize-video',
  'change-video-fps-online-free': 'change-fps',
  'burn-subtitles-into-video-privacy-first': 'burn-subtitles',
  'remove-background-from-image-ai-free': 'ai-background-remover',
  'ai-photo-editor-online-free': 'ai-photo-editor',
  'generate-video-captions-ai-free': 'ai-video-captions',
  'convert-mp3-to-wav-online-free': 'mp3-to-wav',
  'convert-wav-to-mp3-privacy-first': 'wav-to-mp3',
  'convert-mp4-to-mp3-online-free': 'mp4-to-mp3',
  'convert-flac-to-mp3-privacy-first': 'flac-to-mp3',
  'convert-m4a-to-mp3-online-free': 'm4a-to-mp3',
  'convert-mov-to-mp3-privacy-first': 'mov-to-mp3',
  'convert-webm-to-mp3-online-free': 'webm-to-mp3',
  'convert-aac-to-mp3-privacy-first': 'aac-to-mp3',
  'convert-ogg-to-mp3-online-free': 'ogg-to-mp3',
  'convert-opus-to-mp3-privacy-first': 'opus-to-mp3',
  'convert-avi-to-mp3-online-free': 'avi-to-mp3',
  'convert-mkv-to-mp3-privacy-first': 'mkv-to-mp3',
  'convert-webm-to-wav-online-free': 'webm-to-wav',
  'convert-mp4-to-wav-privacy-first': 'mp4-to-wav',
  'convert-aiff-to-mp3-online-free': 'aiff-to-mp3',
  'convert-amr-to-mp3-privacy-first': 'amr-to-mp3',
  'convert-ape-to-mp3-online-free': 'ape-to-mp3',
  'convert-flv-to-mp3-privacy-first': 'flv-to-mp3',
  'convert-flv-to-mp4-online-free': 'flv-to-mp4',
  'convert-flv-to-webm-privacy-first': 'flv-to-webm',
  'convert-mp3-to-m4a-online-free': 'mp3-to-m4a',
  'convert-mp3-to-ogg-privacy-first': 'mp3-to-ogg',
};

console.log('⏪ Reverting file names...\n');

for (const [newSlug, oldSlug] of Object.entries(slugMap)) {
  const toolNewPath = path.join(BASE_DIR, 'tools', `${newSlug}.astro`);
  const toolOldPath = path.join(BASE_DIR, 'tools', `${oldSlug}.astro`);
  
  if (fs.existsSync(toolNewPath)) {
    fs.renameSync(toolNewPath, toolOldPath);
    console.log(`✅ Reverted tools/${newSlug}.astro -> ${oldSlug}.astro`);
  }

  const convertNewPath = path.join(BASE_DIR, 'convert', `${newSlug}.astro`);
  const convertOldPath = path.join(BASE_DIR, 'convert', `${oldSlug}.astro`);
  
  if (fs.existsSync(convertNewPath)) {
    fs.renameSync(convertNewPath, convertOldPath);
    console.log(`✅ Reverted convert/${newSlug}.astro -> ${oldSlug}.astro`);
  }
}
console.log('\n🎉 All files reverted to original names.');
