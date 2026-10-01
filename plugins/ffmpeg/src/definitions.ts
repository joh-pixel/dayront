export interface ExecOptions {
  /** Full FFmpeg argument array, e.g. ['-i', 'input.mp4', '-vn', 'output.mp3'] */
  args: string[];
}

export interface ExecResult {
  /** Exit code returned by FFmpegKit (0 = success) */
  exitCode: number;
  /** Full output log */
  output: string;
}

export interface ProgressEvent {
  /** 0–100 */
  progress: number;
}

export interface FFmpegPlugin {
  /** Execute FFmpeg with the given arguments. Resolves when finished. */
  exec(options: ExecOptions): Promise<ExecResult>;

  /** Add a listener for FFmpeg progress events. */
  addListener(
    eventName: 'progress',
    listenerFunc: (event: ProgressEvent) => void
  ): Promise<{ remove: () => void }>;
}