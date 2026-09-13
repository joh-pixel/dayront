/**
 * Model Loader — downloads and caches AI model files.
 */

const CACHE_NAME = 'dayront-ai-models-v1';

const MODELS = {
  'whisper-tiny': {
    hfId: 'Xenova/whisper-tiny.en',
    approxSize: 40_000_000,
  },
  'rife-v4.9': {
    url: '/ai-models/rife-v4.9.onnx',
    approxSize: 20_000_000,
  },
};

export async function loadModel(modelKey, onProgress) {
  const config = MODELS[modelKey];
  if (!config || !config.url) {
    throw new Error(`Model "${modelKey}" is not configured for direct download.`);
  }

  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(config.url);
  if (cached) {
    onProgress?.(config.approxSize, config.approxSize);
    return cached.blob();
  }

  const response = await fetch(config.url);
  if (!response.ok) throw new Error(`Failed to download model: ${response.statusText}`);

  const contentLength = Number(response.headers.get('content-length')) || config.approxSize;
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, contentLength);
  }

  const blob = new Blob(chunks);
  await cache.put(config.url, new Response(blob, {
    headers: { 'Content-Type': 'application/octet-stream' },
  }));
  return blob;
}

export async function getCachedModel(modelKey) {
  const config = MODELS[modelKey];
  if (!config || !config.url) return null;
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(config.url);
  return cached ? cached.blob() : null;
}

export async function clearModelCache() {
  if (!('caches' in window)) return;
  await caches.delete(CACHE_NAME);
}

export function getModelInfo(modelKey) {
  return MODELS[modelKey] || null;
}