import { registerPlugin } from '@capacitor/core';
import type { FFmpegPlugin } from './definitions';

const FFmpeg = registerPlugin<FFmpegPlugin>('FFmpeg', {
  web: () => import('./web').then((m) => new m.FFmpegWeb()),
});

export * from './definitions';
export { FFmpeg };
