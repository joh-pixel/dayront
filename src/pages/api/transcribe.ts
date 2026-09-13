// Force IPv4 DNS resolution order (fixes Alpine/Android network quirks)
import { setDefaultResultOrder } from 'node:dns';
try { setDefaultResultOrder('ipv4first'); } catch {}

// Node modules for curl fallback
import { execFile } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const prerender = false;

// ─────────────────────────────────────────────────────────
// TRANSCRIPTION HELPERS
// ─────────────────────────────────────────────────────────

async function transcribeWithFetch(audio: File, apiKey: string): Promise<any> {
  const form = new FormData();
  form.append('file', audio, audio.name || 'audio.mp3');
  form.append('model', 'whisper-large-v3-turbo');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'segment');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000); // 2 min

  try {
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal,
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

async function transcribeWithCurl(audio: File, apiKey: string): Promise<any> {
  // Write audio to temp file
  const ext = (audio.name?.split('.').pop() || 'mp3').toLowerCase();
  const tmpFile = join(tmpdir(), `dayront-audio-${Date.now()}.${ext}`);

  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    await writeFile(tmpFile, buffer);

    // Shell out to curl — uses system networking, works in Alpine/Android
    const { stdout } = await execFileAsync(
      'curl',
      [
        '-s',
        '-X', 'POST',
        '-H', `Authorization: Bearer ${apiKey}`,
        '-F', `file=@${tmpFile}`,
        '-F', 'model=whisper-large-v3-turbo',
        '-F', 'response_format=verbose_json',
        '-F', 'timestamp_granularities[]=segment',
        '--max-time', '120',
        'https://api.groq.com/openai/v1/audio/transcriptions',
      ],
      { maxBuffer: 20 * 1024 * 1024 } // 20 MB response buffer
    );

    if (!stdout.trim()) throw new Error('curl returned empty response');
    return JSON.parse(stdout);
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

// ─────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────

export async function POST({ request }: { request: Request }) {
  const startTime = Date.now();

  try {
    const apiKey =
      import.meta.env?.GROQ_API_KEY ||
      (typeof process !== 'undefined' ? process.env.GROQ_API_KEY : undefined);

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Server transcription not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await request.formData();
    const audio = formData.get('audio') as File | null;

    if (!audio) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(
      `[transcribe] received: ${audio.name} (${(audio.size / 1024 / 1024).toFixed(2)} MB, ${audio.type || 'unknown'})`
    );

    if (audio.size > 25 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File too large (25 MB max). Use a shorter clip.' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ─── Try fetch first (works on Vercel) ───
    let data: any;
    let method = 'fetch';

    try {
      console.log('[transcribe] calling Groq via fetch…');
      data = await transcribeWithFetch(audio, apiKey);
    } catch (fetchErr: any) {
      console.warn(`[transcribe] fetch failed: ${fetchErr.message}`);
      console.log('[transcribe] falling back to curl…');
      method = 'curl';
      try {
        data = await transcribeWithCurl(audio, apiKey);
      } catch (curlErr: any) {
        console.error('[transcribe] curl also failed:', curlErr.message);
        throw new Error(`Both fetch and curl failed. fetch: ${fetchErr.message}. curl: ${curlErr.message}`);
      }
    }

    const segments = (data.segments || []).map((s: any) => ({
      start: s.start ?? 0,
      end: s.end ?? 0,
      text: (s.text || '').trim(),
    }));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[transcribe] ✓ success via ${method} — ${segments.length} segments in ${elapsed}s`);

    return new Response(JSON.stringify({ segments, method }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[transcribe] unhandled error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}