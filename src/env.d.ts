/// <reference types="astro/client" />

declare module 'preact/compat' {
  // Type stub (already works, but good for IDE)
}

declare module '@ffmpeg/ffmpeg' {
  export class FFmpeg {
    load(config: { coreURL: string; wasmURL?: string }): Promise<void>;
    writeFile(name: string, data: Uint8Array): Promise<void>;
    readFile(name: string): Promise<Uint8Array>;
    exec(args: string[]): Promise<void>;
    on(event: string, callback: (data: any) => void): void;
  }
}