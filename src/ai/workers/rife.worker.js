/**
 * RIFE Worker — ONNX Runtime frame interpolation.
 * Fixed: explicit WASM paths + timeout + progress feedback.
 */

let session = null;
let ortModule = null;

// ★ ONNX Runtime WASM binaries — must point to a CDN that has them
const ORT_VERSION = '1.21.0';
const ORT_WASM_CDN = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

// ★ Timeout to detect silent hangs (ms)
const MODEL_LOAD_TIMEOUT = 90_000; // 90 seconds

self.onmessage = async (event) => {
  const { type, ...payload } = event.data;
  try {
    switch (type) {
      case 'init':
        await initSession(payload.modelUrl);
        break;
      case 'interpolate':
        await interpolate(payload.frameA, payload.frameB);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (err) {
    console.error('[rife] error:', err);
    self.postMessage({ type: 'error', message: err?.message || String(err) });
  }
};

async function initSession(modelUrl) {
  self.postMessage({ type: 'progress', info: { status: 'loading-ort', message: 'Loading ONNX Runtime…' } });

  // ★ Load ONNX Runtime
  ortModule = await import('onnxruntime-web');
  const ort = ortModule;

  // ★ CRITICAL FIX: point ONNX Runtime to CDN WASM binaries
  // Without this, it tries to fetch /ort-wasm-simd-threaded.wasm from your
  // dev server (which doesn't serve it) and hangs silently.
  if (ort.env?.wasm) {
    ort.env.wasm.wasmPaths = ORT_WASM_CDN;
    ort.env.wasm.numThreads = 1;      // mobile-safe
    ort.env.wasm.proxy = false;       // avoid nested worker
    console.log('[rife] ORT WASM paths set to:', ORT_WASM_CDN);
  }

  // ★ Pick the best execution provider
  const providers = 'gpu' in navigator ? ['webgpu'] : ['wasm'];
  console.log('[rife] execution providers:', providers.join(', '));

  self.postMessage({
    type: 'progress',
    info: { status: 'loading-model', message: `Downloading RIFE model (~20 MB)…` },
  });

  // ★ Load the ONNX model with a timeout so we don't hang forever
  const loadPromise = ort.InferenceSession.create(
    modelUrl || '/ai-models/rife-v4.9.onnx',
    {
      executionProviders: providers,
      graphOptimizationLevel: 'all',
    }
  );

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(
        'RIFE model load timed out after 90 seconds. Check that /ai-models/rife-v4.9.onnx ' +
        'exists in your public folder and that your connection can reach the ONNX Runtime CDN.'
      )),
      MODEL_LOAD_TIMEOUT
    )
  );

  session = await Promise.race([loadPromise, timeoutPromise]);

  console.log('[rife] ✓ session ready');
  console.log('[rife] inputs:', session.inputNames);
  console.log('[rife] outputs:', session.outputNames);

  self.postMessage({
    type: 'ready',
    providers,
    inputs: session.inputNames,
    outputs: session.outputNames,
  });
}

async function interpolate(bitmapA, bitmapB) {
  if (!session || !ortModule) throw new Error('RIFE session not initialized.');
  const ort = ortModule;

  const tensorA = await bitmapToTensor(bitmapA, ort);
  const tensorB = await bitmapToTensor(bitmapB, ort);

  const inputNames = session.inputNames;
  const feeds = {};

  feeds[inputNames[0]] = tensorA;
  if (inputNames[1]) feeds[inputNames[1]] = tensorB;

  // RIFE v4.9 requires a timestep scalar (0.5 = midpoint)
  for (let i = 2; i < inputNames.length; i++) {
    const name = inputNames[i].toLowerCase();
    if (name.includes('timestep') || name.includes('time') || name === 't') {
      feeds[inputNames[i]] = new ort.Tensor('float32', new Float32Array([0.5]), [1]);
    }
  }

  const results = await session.run(feeds);
  const output = results[session.outputNames[0]];

  const outBitmap = await tensorToBitmap(output);
  self.postMessage({ type: 'frame', frame: outBitmap }, [outBitmap]);
}

async function bitmapToTensor(bitmap, ort) {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  const size = bitmap.width * bitmap.height;
  const float = new Float32Array(3 * size);
  for (let i = 0; i < size; i++) {
    float[i] = data[i * 4] / 255;
    float[i + size] = data[i * 4 + 1] / 255;
    float[i + size * 2] = data[i * 4 + 2] / 255;
  }

  return new ort.Tensor('float32', float, [1, 3, bitmap.height, bitmap.width]);
}

async function tensorToBitmap(tensor) {
  const dims = tensor.dims;
  const h = dims[dims.length - 2];
  const w = dims[dims.length - 1];
  const output = tensor.data;

  const imageData = new ImageData(w, h);
  const size = w * h;
  for (let i = 0; i < size; i++) {
    imageData.data[i * 4] = Math.round(Math.min(1, Math.max(0, output[i])) * 255);
    imageData.data[i * 4 + 1] = Math.round(Math.min(1, Math.max(0, output[i + size])) * 255);
    imageData.data[i * 4 + 2] = Math.round(Math.min(1, Math.max(0, output[i + size * 2])) * 255);
    imageData.data[i * 4 + 3] = 255;
  }

  const canvas = new OffscreenCanvas(w, h);
  canvas.getContext('2d').putImageData(imageData, 0, 0);
  return canvas.transferToImageBitmap();
}