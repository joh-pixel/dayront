import { WebPlugin } from '@capacitor/core';
import type { FFmpegPlugin, ExecOptions, ExecResult } from './definitions';

export class FFmpegWeb extends WebPlugin implements FFmpegPlugin {
  async exec(_options: ExecOptions): Promise<ExecResult> {
    throw new Error('Native FFmpeg not available on web — use WASM instead');
  }
}
