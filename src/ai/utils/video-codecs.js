/**
 * Video Codecs — frame reading and video encoding helpers.
 */

export async function loadVideoElement(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      video.width = video.videoWidth;
      video.height = video.videoHeight;
      resolve(video);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load video file.'));
    };
  });
}

export async function extractFrames(video, onFrame, options = {}) {
  const fps = options.fps || 30;
  const maxFrames = options.maxFrames || Infinity;
  const totalFrames = Math.min(Math.ceil(video.duration * fps), maxFrames);

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  for (let i = 0; i < totalFrames; i++) {
    video.currentTime = i / fps;
    await new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
    });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    await onFrame(i, canvas);
  }
}

export function createVideoRecorder(canvas, options = {}) {
  const fps = options.fps || 30;
  const mimeType = options.mimeType || pickBestMimeType();
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: options.videoBitsPerSecond || 8_000_000,
  });

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return {
    recorder,
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        recorder.stop();
      }),
    mimeType,
  };
}

function pickBestMimeType() {
  const candidates = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return 'video/webm';
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function checkAISupport() {
  return {
    webgpu: typeof navigator !== 'undefined' && 'gpu' in navigator,
    webcodecs: typeof window !== 'undefined' && 'VideoDecoder' in window,
    mediaRecorder: typeof window !== 'undefined' && 'MediaRecorder' in window,
    crossOriginIsolated: typeof window !== 'undefined' && window.crossOriginIsolated,
  };
}

/**
 * Apply unsharp mask (sharpening) to a canvas for better upscaling quality.
 */
export function applyUnsharpMask(canvas, amount = 0.6) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const src = ctx.getImageData(0, 0, width, height);
  const out = ctx.createImageData(width, height);

  const data = src.data;
  const outData = out.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // Sample neighbors (clamped)
      const x0 = Math.max(0, x - 1), x1 = Math.min(width - 1, x + 1);
      const y0 = Math.max(0, y - 1), y1 = Math.min(height - 1, y + 1);

      for (let c = 0; c < 3; c++) {
        const center = data[i + c];
        const avg = (
          data[(y * width + x0) * 4 + c] +
          data[(y * width + x1) * 4 + c] +
          data[(y0 * width + x) * 4 + c] +
          data[(y1 * width + x) * 4 + c]
        ) / 4;
        outData[i + c] = Math.max(0, Math.min(255, center + (center - avg) * amount));
      }
      outData[i + 3] = data[i + 3];
    }
  }
  ctx.putImageData(out, 0, 0);
}