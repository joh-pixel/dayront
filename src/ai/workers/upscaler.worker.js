/**
 * Upscaler Worker — high-quality canvas upscaling + unsharp masking.
 * Runs off the main thread to keep UI responsive.
 */

self.onmessage = async (event) => {
  const { type, ...payload } = event.data;
  try {
    switch (type) {
      case 'init':
        self.postMessage({ type: 'ready' });
        break;
      case 'process':
        await processFrame(payload.frame, payload.frameIndex, payload.scale || 2, payload.sharpen || 0.6);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err?.message || String(err) });
  }
};

async function processFrame(bitmap, frameIndex, scale, sharpenAmount) {
  const { width, height } = bitmap;
  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);

  const canvas = new OffscreenCanvas(outW, outH);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, outW, outH);

  // Apply sharpening
  if (sharpenAmount > 0) {
    const imgData = ctx.getImageData(0, 0, outW, outH);
    const out = new ImageData(outW, outH);
    const data = imgData.data;
    const outData = out.data;

    for (let y = 0; y < outH; y++) {
      for (let x = 0; x < outW; x++) {
        const i = (y * outW + x) * 4;
        const x0 = Math.max(0, x - 1), x1 = Math.min(outW - 1, x + 1);
        const y0 = Math.max(0, y - 1), y1 = Math.min(outH - 1, y + 1);

        for (let c = 0; c < 3; c++) {
          const center = data[i + c];
          const avg = (
            data[(y * outW + x0) * 4 + c] +
            data[(y * outW + x1) * 4 + c] +
            data[(y0 * outW + x) * 4 + c] +
            data[(y1 * outW + x) * 4 + c]
          ) / 4;
          outData[i + c] = Math.max(0, Math.min(255, center + (center - avg) * sharpenAmount));
        }
        outData[i + 3] = data[i + 3];
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  const outBitmap = canvas.transferToImageBitmap();
  self.postMessage({ type: 'frame', frame: outBitmap, frameIndex }, [outBitmap]);
}