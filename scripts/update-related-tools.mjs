import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsPath = path.resolve(__dirname, '../src/lib/tools.ts');

// Map from tool slug to array of related tool slugs
const relatedMap = {
  'audio-cutter': ['audio-merger', 'audio-compressor', 'mp3-to-wav'],
  'audio-merger': ['audio-cutter', 'audio-compressor', 'wav-to-mp3'],
  'audio-compressor': ['volume-booster', 'audio-cutter', 'mp3-to-wav'],
  'volume-booster': ['audio-compressor', 'speed-changer', 'mp3-to-wav'],
  'speed-changer': ['reverse-audio', 'volume-booster', 'audio-cutter'],
  'reverse-audio': ['speed-changer', 'audio-cutter', 'mp3-to-ogg'],
  'stereo-to-mono': ['audio-cutter', 'volume-booster', 'mp3-to-wav'],

  'mp3-to-wav': ['wav-to-mp3', 'mp3-to-m4a', 'flac-to-mp3'],
  'wav-to-mp3': ['mp3-to-wav', 'flac-to-mp3', 'audio-cutter'],
  'm4a-to-mp3': ['mp3-to-m4a', 'wav-to-mp3', 'volume-booster'],
  'mp3-to-m4a': ['m4a-to-mp3', 'mp3-to-wav', 'audio-compressor'],
  'flac-to-mp3': ['mp3-to-wav', 'ogg-to-mp3', 'audio-cutter'],
  'ogg-to-mp3': ['mp3-to-ogg', 'flac-to-mp3', 'reverse-audio'],
  'mp3-to-ogg': ['ogg-to-mp3', 'mp3-to-wav', 'audio-compressor'],
  'ape-to-mp3': ['flac-to-mp3', 'wav-to-mp3', 'audio-cutter'],
  'opus-to-mp3': ['ogg-to-mp3', 'flac-to-mp3', 'mp3-to-wav'],
  'aiff-to-mp3': ['wav-to-mp3', 'flac-to-mp3', 'mp3-to-m4a'],
  'aac-to-mp3': ['m4a-to-mp3', 'wav-to-mp3', 'volume-booster'],
  'amr-to-mp3': ['wav-to-mp3', 'aac-to-mp3', 'mp3-to-ogg'],

  'mp4-to-mp3': ['mp4-to-wav', 'webm-to-mp3', 'audio-cutter'],
  'mov-to-mp3': ['mp4-to-mp3', 'avi-to-mp3', 'speed-changer'],
  'mkv-to-mp3': ['avi-to-mp3', 'mp4-to-mp3', 'audio-merger'],
  'avi-to-mp3': ['mkv-to-mp3', 'mov-to-mp3', 'audio-cutter'],
  'webm-to-mp3': ['webm-to-wav', 'mp4-to-mp3', 'audio-compressor'],
  'mp4-to-wav': ['mp4-to-mp3', 'webm-to-wav', 'volume-booster'],
  'webm-to-wav': ['webm-to-mp3', 'mp4-to-wav', 'audio-cutter'],
  'flv-to-mp3': ['mp4-to-mp3', 'webm-to-mp3', 'flv-to-mp4'],

  'flv-to-mp4': ['flv-to-webm', 'mp4-to-mp3', 'video-compressor'],
  'flv-to-webm': ['flv-to-mp4', 'webm-to-mp3', 'video-compressor'],

  'video-compressor': ['video-cutter', 'resize-video', 'video-to-gif'],
  'video-cutter': ['video-compressor', 'video-merger', 'audio-cutter'],
  'video-merger': ['video-cutter', 'audio-merger', 'video-compressor'],
  'video-to-gif': ['gif-to-video', 'video-compressor', 'video-cutter'],
  'gif-to-video': ['video-to-gif', 'video-compressor', 'resize-video'],
  'resize-video': ['crop-video', 'video-compressor', 'video-cutter'],
  'crop-video': ['resize-video', 'video-cutter', 'video-compressor'],
  'change-fps': ['video-compressor', 'speed-changer', 'video-cutter'],
  'mute-video': ['extract-audio', 'video-compressor', 'audio-cutter'],
  'extract-audio': ['mp4-to-mp3', 'mute-video', 'audio-cutter'],
};

let content = fs.readFileSync(toolsPath, 'utf8');

for (const [slug, related] of Object.entries(relatedMap)) {
  const pattern = new RegExp(
    `(slug:\\s*'${slug}',[\\s\\S]*?relatedTools:\\s*)\\[[^\\]]*\\]`,
    'm'
  );
  const replacement = `$1[${related.map(s => `'${s}'`).join(', ')}]`;
  content = content.replace(pattern, replacement);
}

fs.writeFileSync(toolsPath, content, 'utf8');
console.log('✅ Updated all relatedTools in tools.ts');