import { setDefaultResultOrder } from 'node:dns';
import { execFile } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
export { renderers } from '../../renderers.mjs';

try {
  setDefaultResultOrder("ipv4first");
} catch {
}
const execFileAsync = promisify(execFile);
const prerender = false;
async function transcribeWithFetch(audio, apiKey) {
  const form = new FormData();
  form.append("file", audio, audio.name || "audio.mp3");
  form.append("model", "whisper-large-v3-turbo");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12e4);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: form,
      signal: controller.signal
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq ${res.status}: ${errText.slice(0, 300)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}
async function transcribeWithCurl(audio, apiKey) {
  const ext = (audio.name?.split(".").pop() || "mp3").toLowerCase();
  const tmpFile = join(tmpdir(), `dayront-audio-${Date.now()}.${ext}`);
  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    await writeFile(tmpFile, buffer);
    const {
      stdout
    } = await execFileAsync(
      "curl",
      ["-s", "-X", "POST", "-H", `Authorization: Bearer ${apiKey}`, "-F", `file=@${tmpFile}`, "-F", "model=whisper-large-v3-turbo", "-F", "response_format=verbose_json", "-F", "timestamp_granularities[]=segment", "--max-time", "120", "https://api.groq.com/openai/v1/audio/transcriptions"],
      {
        maxBuffer: 20 * 1024 * 1024
      }
      // 20 MB response buffer
    );
    if (!stdout.trim()) throw new Error("curl returned empty response");
    return JSON.parse(stdout);
  } finally {
    await unlink(tmpFile).catch(() => {
    });
  }
}
async function POST({
  request
}) {
  const startTime = Date.now();
  try {
    const apiKey = "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";
    if (!apiKey) ;
    const formData = await request.formData();
    const audio = formData.get("audio");
    if (!audio) {
      return new Response(JSON.stringify({
        error: "No audio file provided"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    console.log(`[transcribe] received: ${audio.name} (${(audio.size / 1024 / 1024).toFixed(2)} MB, ${audio.type || "unknown"})`);
    if (audio.size > 25 * 1024 * 1024) {
      return new Response(JSON.stringify({
        error: "File too large (25 MB max). Use a shorter clip."
      }), {
        status: 413,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    let data;
    let method = "fetch";
    try {
      console.log("[transcribe] calling Groq via fetch…");
      data = await transcribeWithFetch(audio, apiKey);
    } catch (fetchErr) {
      console.warn(`[transcribe] fetch failed: ${fetchErr.message}`);
      console.log("[transcribe] falling back to curl…");
      method = "curl";
      try {
        data = await transcribeWithCurl(audio, apiKey);
      } catch (curlErr) {
        console.error("[transcribe] curl also failed:", curlErr.message);
        throw new Error(`Both fetch and curl failed. fetch: ${fetchErr.message}. curl: ${curlErr.message}`);
      }
    }
    const segments = (data.segments || []).map((s) => ({
      start: s.start ?? 0,
      end: s.end ?? 0,
      text: (s.text || "").trim()
    }));
    const elapsed = ((Date.now() - startTime) / 1e3).toFixed(2);
    console.log(`[transcribe] ✓ success via ${method} — ${segments.length} segments in ${elapsed}s`);
    return new Response(JSON.stringify({
      segments,
      method
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[transcribe] unhandled error:", err);
    return new Response(JSON.stringify({
      error: err?.message || "Server error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
