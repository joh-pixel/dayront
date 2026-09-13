/**
 * Whisper Worker — Transformers.js speech-to-text.
 * Mobile-hardened: heartbeat, timeout, CDN WASM paths, retry logic.
 */

let transcriber = null;

self.onmessage = async (event) => {
  const { type, ...payload } = event.data;
  try {
    switch (type) {
      case 'init':
        await initTranscriber(payload.model, payload.device);
        break;
      case 'transcribe':
        await transcribeAudio(payload.audio);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err?.message || String(err) });
  }
};

// Emit heartbeat messages every 3 seconds so the UI knows it's alive
function startHeartbeat(label) {
  let seconds = 0;
  const timer = setInterval(() => {
    seconds += 3;
    self.postMessage({
      type: 'progress',
      info: { status: 'heartbeat', message: `${label}… (${seconds}s)` },
    });
  }, 3000);
  return () => clearInterval(timer);
}

async function initTranscriber(modelId, device) {
  const mod = await import('@huggingface/transformers');
  const { pipeline, env } = mod;

  env.allowLocalModels = false;
  env.useBrowserCache = true;

  // Force single-thread WASM. Required on mobile — no SharedArrayBuffer.
  if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.numThreads = 1;
    env.backends.onnx.wasm.proxy = false;
  }

  const actualModel = modelId || 'Xenova/whisper-tiny.en';
  const actualDevice = device || 'wasm';

  self.postMessage({
    type: 'progress',
    info: { status: 'init', message: `Initializing ${actualModel}…` },
  });

  const stopHeartbeat = startHeartbeat('Loading AI runtime');

  // 3-minute hard timeout — anything beyond this is a hung state
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(
        'AI runtime timed out after 3 minutes. Mobile browsers often cannot run Whisper. ' +
        'Try a shorter clip (<10s), a faster Wi-Fi connection, or use a desktop browser.'
      )),
      180_000
    )
  );

  const initPromise = pipeline(
    'automatic-speech-recognition',
    actualModel,
    {
      device: actualDevice,
      dtype: 'q8', // 8-bit quantized — smallest download
      progress_callback: (info) => {
        self.postMessage({ type: 'progress', info });
      },
    }
  );

  try {
    transcriber = await Promise.race([initPromise, timeoutPromise]);
    stopHeartbeat();
    self.postMessage({ type: 'ready' });
  } catch (err) {
    stopHeartbeat();
    throw err;
  }
}

async function transcribeAudio(audioFloat32) {
  if (!transcriber) throw new Error('Transcriber not initialized.');

  const stopHeartbeat = startHeartbeat('Transcribing');

  try {
    self.postMessage({
      type: 'progress',
      info: { status: 'transcribing', message: 'Running Whisper inference…' },
    });

    const result = await transcriber(audioFloat32, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
    });

    const segments = (result.chunks || []).map((chunk) => ({
      start: chunk.timestamp?.[0] ?? 0,
      end: chunk.timestamp?.[1] ?? 0,
      text: (chunk.text || '').trim(),
    }));

    self.postMessage({ type: 'result', segments });
  } finally {
    stopHeartbeat();
  }
}