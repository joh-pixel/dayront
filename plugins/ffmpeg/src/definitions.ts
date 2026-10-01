export interface ExecOptions {
  args: string[];
}

export interface ExecResult {
  exitCode: number;
  output: string;
}

export interface ProgressEvent {
  timeProcessedMs: number;
  bitrate?: number;
  speed?: number;
}

export interface FFmpegPlugin {
  exec(options: ExecOptions): Promise<ExecResult>;
  addListener(
    eventName: 'progress',
    listenerFunc: (event: ProgressEvent) => void
  ): Promise<{ remove: () => void }>;
}
