/**
 * Background Remover — wraps @imgly/background-removal.
 * Normalizes input to a clean PNG before passing to the library.
 */

let removalModule = null;

const IMGLY_VERSION = '1.7.0';
const IMGLY_DATA_CDN = `https://staticimgly.com/@imgly/background-removal-data/${IMGLY_VERSION}/dist/`;

const CDN_SOURCES = [
  `https://cdn.jsdelivr.net/npm/@imgly/background-removal@${IMGLY_VERSION}/dist/index.mjs`,
  `https://unpkg.com/@imgly/background-removal@${IMGLY_VERSION}/dist/index.mjs`,
  `https://esm.sh/@imgly/background-removal@${IMGLY_VERSION}`,
];

// ★ Max dimension for AI model — larger images are downscaled
const MAX_DIMENSION = 4096;

async function getRemovalModule() {
  if (removalModule) return removalModule;

  for (const url of CDN_SOURCES) {
    try {
      console.log('[bg-remover] trying CDN:', url);
      const mod = await import(/* @vite-ignore */ url);
      removalModule = mod;
      console.log('[bg-remover] ✓ loaded from', url);
      return mod;
    } catch (err) {
      console.warn('[bg-remover] CDN failed:', url, err?.message || err);
    }
  }

  throw new Error('Could not load background removal engine. Check your internet connection or reload.');
}

// ─── Normalize any input (File / Blob / URL) to a clean PNG ───
async function normalizeImageInput(input) {
  // If it's a URL string, load it as an image first
  let sourceBlob;
  if (typeof input === 'string') {
    try {
      const res = await fetch(input);
      sourceBlob = await res.blob();
    } catch (err) {
      throw new Error('Could not fetch the source image.');
    }
  } else if (input instanceof File || input instanceof Blob) {
    sourceBlob = input;
  } else {
    throw new Error('Unsupported image input.');
  }

  // Load the image
  const img = await loadImageFromBlob(sourceBlob);
  if (!img) {
    throw new Error(
      'Could not decode the source image. This often happens with images that have been ' +
      'heavily edited or have unusual encoding (CMYK, 16-bit, or corrupted metadata). ' +
      'Try re-saving the image as a standard JPG or PNG first.'
    );
  }

  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  if (!natW || !natH) {
    throw new Error('Image has invalid dimensions.');
  }

  // Downscale if too large
  let targetW = natW;
  let targetH = natH;
  const maxSide = Math.max(natW, natH);
  if (maxSide > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / maxSide;
    targetW = Math.round(natW * scale);
    targetH = Math.round(natH * scale);
    console.log(`[bg-remover] downscaling ${natW}×${natH} → ${targetW}×${targetH}`);
  }

  // Draw to canvas and export as PNG
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');

  // Fill with transparent (in case input was JPEG with black bars)
  ctx.clearRect(0, 0, targetW, targetH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const pngBlob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
  });

  if (!pngBlob) {
    throw new Error('Could not re-encode the source image.');
  }

  console.log(`[bg-remover] normalized to PNG (${(pngBlob.size / 1024).toFixed(0)} KB)`);
  return new File([pngBlob], 'input.png', { type: 'image/png' });
}

function loadImageFromBlob(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export async function removeBackground(imageInput, options = {}) {
  const mod = await getRemovalModule();
  const removeBg = mod.removeBackground || mod.default;

  if (typeof removeBg !== 'function') {
    throw new Error('removeBackground function not found in @imgly/background-removal');
  }

  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};

  // ★ Normalize input first (this also validates that it can be decoded)
  onProgress(0.02);
  const normalizedInput = await normalizeImageInput(imageInput);
  onProgress(0.05);

  // Smooth fake progress
  let fakeProgress = 5;
  let isDone = false;

  const ticker = setInterval(() => {
    if (isDone) return;
    const remaining = 95 - fakeProgress;
    fakeProgress += Math.max(0.3, remaining * 0.022);
    if (fakeProgress > 95) fakeProgress = 95;
    onProgress(fakeProgress / 100);
  }, 200);

  try {
    const config = {
      publicPath: IMGLY_DATA_CDN,
      model: 'isnet_fp16',
      output: {
        format: 'image/png',
        quality: 0.9,
      },
      debug: false,
      progress: (key, current, total) => {
        if (key && typeof key === 'string' && (key.includes('fetch') || key.includes('download')) && total > 0) {
          const fraction = current / total;
          if (fraction >= 1) {
            fakeProgress = Math.max(fakeProgress, 40);
          }
        }
      },
    };

    const blob = await removeBg(normalizedInput, config);

    isDone = true;
    clearInterval(ticker);
    onProgress(1.0);
    return blob;
  } catch (err) {
    isDone = true;
    clearInterval(ticker);
    console.error('[bg-remover] removeBackground failed:', err);
    throw err;
  }
}