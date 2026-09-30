import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

/**
 * POST /api/notify
 * ----------------------------------------------------------
 * Accepts: { email, platform?, source?, website? }
 * Returns: { ok: true } | { ok: false, error: string }
 *
 * Uses:
 *   - Upstash Redis  → stores subscriber emails
 *   - Brevo          → sends welcome email + admin notification
 *
 * `website` is a honeypot field — bots fill it, humans never see it.
 */

export const prerender = false;

/* ── Config ─────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const RATE_LIMIT_PER_HOUR = 3;
const RATE_LIMIT_TTL_SECONDS = 60 * 60;

const ALLOWED_PLATFORMS = new Set([
  'android', 'ios', 'windows', 'macos', 'linux', 'web', 'other',
]);

const FROM_EMAIL = 'hello@dayront.com';
const FROM_NAME = 'Dayront';
const REPLY_TO = 'hello@dayront.com';
const ADMIN_NOTIFY = 'hello@dayront.com';

const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

/* ── Clients ────────────────────────────────────────────── */

function getRedis(): Redis | null {
  const url = import.meta.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn('[notify] Missing Upstash credentials — skipping storage');
    return null;
  }
  return new Redis({ url, token });
}

function getBrevoKey(): string | null {
  const key = import.meta.env.BREVO_API_KEY;
  if (!key) {
    console.warn('[notify] Missing BREVO_API_KEY — skipping emails');
    return null;
  }
  return key;
}

/* ── Helpers ────────────────────────────────────────────── */

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + 'dayront-salt-v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Brevo sender ───────────────────────────────────────── */

interface BrevoSendPayload {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent: string;
  replyTo?: { email: string };
}

async function brevoSend(
  apiKey: string,
  payload: BrevoSendPayload,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(BREVO_API, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        ...payload,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[notify] Brevo error:', res.status, body);
      return { ok: false, error: `${res.status} ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    console.error('[notify] Brevo fetch failed:', err);
    return { ok: false, error: String(err) };
  }
}

/* ── Email templates ────────────────────────────────────── */

function welcomeHtml(): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Welcome to Dayront</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:56px;height:56px;border-radius:14px;background:#2CB5F0;line-height:56px;font-size:28px;">📷</div>
    </div>

    <div style="background:#ffffff;border-radius:16px;padding:32px 28px;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;">You're on the list 🎉</h1>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        Thanks for signing up to be notified when the <strong>Dayront app</strong> launches.
      </p>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        When it's ready, you'll get <strong>one email</strong> — no spam, no marketing fluff.
        Just a link to download.
      </p>

      <div style="background:#E5F7FE;border-left:4px solid #2CB5F0;border-radius:8px;padding:14px 16px;margin:24px 0;">
        <div style="font-size:13px;font-weight:700;color:#0369A1;margin-bottom:6px;">WHAT YOU'LL GET</div>
        <div style="font-size:13px;color:#0C4A6E;line-height:1.7;">
          ⚡ 10× faster processing<br>
          📁 Support for files up to 5&nbsp;GB<br>
          📴 Full offline mode<br>
          🎨 All 73 tools, no ads
        </div>
      </div>

      <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#64748b;">
        In the meantime, use all our tools for free at
        <a href="https://dayront.com/tools" style="color:#0284C7;text-decoration:none;font-weight:600;">dayront.com/tools</a>.
      </p>
    </div>

    <p style="text-align:center;margin:28px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">
      You're receiving this because you signed up at download.dayront.com.<br>
      <a href="https://dayront.com/privacy" style="color:#94a3b8;">Privacy</a> ·
      <a href="https://dayront.com/terms" style="color:#94a3b8;">Terms</a>
    </p>
  </div>
</body>
</html>`;
}

function welcomeText(): string {
  return `You're on the list!

Thanks for signing up to be notified when the Dayront app launches.

When it's ready, you'll get one email — no spam. Just a download link.

What you'll get:
⚡ 10× faster processing
📁 Support for files up to 5 GB
📴 Full offline mode
🎨 All 73 tools, no ads

Meanwhile, use all our tools for free at https://dayront.com/tools

—
Dayront
https://dayront.com
`;
}

function adminText(email: string, platform: string, source: string, ua: string): string {
  return `New notify-me signup

Email:    ${email}
Platform: ${platform}
Source:   ${source}
Time:     ${new Date().toISOString()}
UA:       ${ua}
`;
}

/* ── Handler ────────────────────────────────────────────── */

export const POST: APIRoute = async ({ request, clientAddress }) => {
  /* 1. Parse */
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid request body.' }, 400);
  }

  const emailRaw = typeof body?.email === 'string' ? body.email : '';
  const platformRaw = typeof body?.platform === 'string' ? body.platform : 'unknown';
  const sourceRaw = typeof body?.source === 'string' ? body.source : 'direct';
  const honeypot = typeof body?.website === 'string' ? body.website : '';

  /* 2. Honeypot — silent accept, skip everything */
  if (honeypot.trim() !== '') {
    console.log('[notify] 🍯 Honeypot triggered, ignoring');
    return json({ ok: true });
  }

  /* 3. Validate email */
  const email = emailRaw.trim().toLowerCase();
  if (!email) return json({ ok: false, error: 'Please enter your email.' }, 400);
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: "That email doesn't look right." }, 400);
  }

  /* 4. Validate platform + source */
  const platform = ALLOWED_PLATFORMS.has(platformRaw) ? platformRaw : 'other';
  const source = sourceRaw.slice(0, 64).replace(/[^a-zA-Z0-9_\-./]/g, '');

  /* 5. Rate limit by hashed IP */
  const ip = clientAddress || '0.0.0.0';
  const ua = request.headers.get('user-agent') || 'unknown';
  const ipHash = await hashIp(ip);
  const redis = getRedis();

  if (redis) {
    try {
      const rateKey = `notify:rate:${ipHash}`;
      const count = await redis.incr(rateKey);
      if (count === 1) await redis.expire(rateKey, RATE_LIMIT_TTL_SECONDS);
      if (count > RATE_LIMIT_PER_HOUR) {
        return json(
          { ok: false, error: 'Too many signups from your network. Try again later.' },
          429,
        );
      }
    } catch (err) {
      console.warn('[notify] Rate limit check failed:', err);
    }
  }

  /* 6. Store in Redis (dedupe via SET) */
  let isNew = true;
  if (redis) {
    try {
      const added = await redis.sadd('notify:emails', email);
      isNew = added === 1;
      if (isNew) {
        const record = {
          email, platform, source, ipHash,
          ua: ua.slice(0, 200),
          ts: Date.now(),
        };
        await redis.lpush('notify:list', JSON.stringify(record));
        await redis.ltrim('notify:list', 0, 99_999);
      }
    } catch (err) {
      console.error('[notify] Redis error:', err);
    }
  }

  /* 7. Send emails via Brevo (only for new subscribers) */
  const brevoKey = getBrevoKey();
  if (isNew && brevoKey) {
    // Welcome email to the user
    await brevoSend(brevoKey, {
      to: [{ email }],
      replyTo: { email: REPLY_TO },
      subject: "You're on the Dayront launch list 🎉",
      htmlContent: welcomeHtml(),
      textContent: welcomeText(),
    });

    // Admin notification
    await brevoSend(brevoKey, {
      to: [{ email: ADMIN_NOTIFY }],
      subject: `New notify signup: ${email}`,
      htmlContent: `<pre style="font-family:monospace;font-size:13px;white-space:pre-wrap">${escapeHtml(adminText(email, platform, source, ua))}</pre>`,
      textContent: adminText(email, platform, source, ua),
    });
  } else if (isNew && !brevoKey) {
    console.log(`[notify] 📝 Would send welcome email to ${email} (no BREVO_API_KEY)`);
  }

  /* 8. Respond */
  return json({
    ok: true,
    isNew,
    message: isNew
      ? "You're on the list! Check your inbox for a welcome email."
      : "You're already on the list — we'll be in touch.",
  });
};

export const GET: APIRoute = () =>
  json({ ok: false, error: 'Method not allowed.' }, 405);