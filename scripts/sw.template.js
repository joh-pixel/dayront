/*
 * Dayront Service Worker — TEMPLATE
 * --------------------------------------------------------------------------
 * This file is NOT served directly.
 *
<<<<<<< HEAD
 * NOTE: Skips entirely when running inside the Capacitor native shell
 * (Dayront Android/iOS app). Caching in the WebView causes blank screens
 * and stale UI, so we register a no-op service worker there.
 * --------------------------------------------------------------------------
 *
 * Strategy (web only):
=======
 * `scripts/generate-sw.mjs` reads this file, replaces __VERSION__ with a
 * version derived from package.json + today's date, and writes the result
 * to public/sw.js before every build.
 *
 * DO NOT EDIT public/sw.js — it's generated and gitignored.
 * Always edit this template instead.
 * --------------------------------------------------------------------------
 *
 * Strategy:
>>>>>>> f2a28b2 (fix(android): restore assets, untrack .nomedia, sync native config)
 * - HTML/navigation: NETWORK FIRST
 * - CSS/JS/fonts/images: STALE-WHILE-REVALIDATE
 * - Media files: NEVER cache
 * - External requests: NEVER cache
<<<<<<< HEAD
=======
 * - Old caches: automatically removed
>>>>>>> f2a28b2 (fix(android): restore assets, untrack .nomedia, sync native config)
 */

const VERSION = '__VERSION__';

const STATIC_CACHE = `dayront-static-v${VERSION}`;
const OFFLINE_CACHE = `dayront-offline-v${VERSION}`;

<<<<<<< HEAD
if (IS_NATIVE) {
  // No-op service worker inside the native app shell.
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((names) => Promise.all(names.map((n) => caches.delete(n))))
        .then(() => self.clients.claim())
    );
  });
  // Deliberately NOT registering a fetch handler
} else {
  /* ══════════════════════════════════════════════════════════
     WEB SERVICE WORKER — full behavior
     ══════════════════════════════════════════════════════════ */

  const VERSION = '__VERSION__';

  const STATIC_CACHE = `dayront-static-v${VERSION}`;
  const OFFLINE_CACHE = `dayront-offline-v${VERSION}`;
  const OFFLINE_URL = '/';

  const STATIC_ASSETS = [
    '/favicon.svg',
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
  ];

  /* ── Install ────────────────────────────────────────────── */

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches
        .open(STATIC_CACHE)
        .then((cache) => cache.addAll(STATIC_ASSETS))
        .then(() => self.skipWaiting())
    );
  });

  /* ── Activate ───────────────────────────────────────────── */

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter(
                (cacheName) =>
                  (cacheName.startsWith('dayront-static-') &&
                    cacheName !== STATIC_CACHE) ||
                  (cacheName.startsWith('dayront-offline-') &&
                    cacheName !== OFFLINE_CACHE)
              )
              .map((cacheName) => caches.delete(cacheName))
          )
        )
        .then(() => self.clients.claim())
    );
  });

  /* ── Helpers ────────────────────────────────────────────── */

  function isSameOrigin(request) {
    return new URL(request.url).origin === self.location.origin;
  }

  function isNavigationRequest(request) {
    return (
      request.mode === 'navigate' || request.destination === 'document'
    );
  }

  function isMediaRequest(request) {
    const url = new URL(request.url);
    const mediaExtensions = [
      '.mp3', '.wav', '.m4a', '.flac', '.ogg', '.opus',
      '.aac', '.aiff', '.amr', '.ape',
      '.mp4', '.webm', '.mov', '.mkv', '.avi', '.flv',
      '.gif',
    ];
    return mediaExtensions.some((ext) =>
      url.pathname.toLowerCase().endsWith(ext)
    );
  }

  function isStaticAsset(request) {
    const destination = request.destination;
    return ['script', 'style', 'image', 'font'].includes(destination);
  }

  /* ── Navigation — network first ─────────────────────────── */

  async function handleNavigation(request) {
    try {
      const response = await fetch(request, { cache: 'no-cache' });
      if (response && response.ok) return response;
      throw new Error('Navigation request failed');
    } catch (error) {
      const cached = await caches.match(OFFLINE_URL);
      if (cached) return cached;
      return new Response(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Dayront — Offline</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#fff;color:#111;padding:24px;text-align:center;"><main><h1>You're offline</h1><p>Dayront could not connect to the network.</p><button onclick="location.reload()" style="margin-top:16px;border:0;border-radius:12px;padding:12px 20px;font-weight:700;cursor:pointer;">Try Again</button></main></body></html>`,
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
  }

  /* ── Static assets — stale-while-revalidate ─────────────── */

  async function handleStaticAsset(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);

    const networkRequest = fetch(request)
      .then((response) => {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      })
      .catch(() => null);

    if (cached) return cached;

    const networkResponse = await networkRequest;
    if (networkResponse) return networkResponse;

    return new Response('', { status: 504, statusText: 'Gateway Timeout' });
  }

  /* ── Fetch ──────────────────────────────────────────────── */

  self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET') return;
    if (isMediaRequest(request)) return;
    if (!isSameOrigin(request)) return;

    if (isNavigationRequest(request)) {
      event.respondWith(handleNavigation(request));
      return;
    }

    if (isStaticAsset(request)) {
      event.respondWith(handleStaticAsset(request));
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  });

  /* ── Message API ────────────────────────────────────────── */

  self.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
    if (event.data.type === 'CLEAR_CACHE') {
      event.waitUntil(
        caches
          .keys()
          .then((names) =>
            Promise.all(
              names
                .filter((name) => name.startsWith('dayront-'))
                .map((name) => caches.delete(name))
            )
          )
      );
    }
  });
      }
=======
const OFFLINE_URL = '/';

const STATIC_ASSETS = [
  '/favicon.svg',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/* ---------------------------------------------------------
   INSTALL
--------------------------------------------------------- */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ---------------------------------------------------------
   ACTIVATE
--------------------------------------------------------- */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName.startsWith('dayront-static-') &&
                cacheName !== STATIC_CACHE
              ) || (
                cacheName.startsWith('dayront-offline-') &&
                cacheName !== OFFLINE_CACHE
              );
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    request.destination === 'document'
  );
}

function isMediaRequest(request) {
  const url = new URL(request.url);

  const mediaExtensions = [
    '.mp3',
    '.wav',
    '.m4a',
    '.flac',
    '.ogg',
    '.opus',
    '.aac',
    '.aiff',
    '.amr',
    '.ape',

    '.mp4',
    '.webm',
    '.mov',
    '.mkv',
    '.avi',
    '.flv',

    '.gif',
  ];

  return mediaExtensions.some((extension) =>
    url.pathname.toLowerCase().endsWith(extension)
  );
}

function isStaticAsset(request) {
  const destination = request.destination;

  return [
    'script',
    'style',
    'image',
    'font',
  ].includes(destination);
}

/* ---------------------------------------------------------
   NAVIGATION
   NETWORK FIRST
--------------------------------------------------------- */

async function handleNavigation(request) {
  try {
    const response = await fetch(request, {
      cache: 'no-cache',
    });

    if (response && response.ok) {
      return response;
    }

    throw new Error('Navigation request failed');
  } catch (error) {
    const cached = await caches.match(OFFLINE_URL);

    if (cached) {
      return cached;
    }

    return new Response(
      `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Dayront — Offline</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: system-ui, sans-serif;
              background: #fff;
              color: #111;
              padding: 24px;
              text-align: center;
            }

            main {
              max-width: 520px;
            }

            h1 {
              font-size: 2rem;
              margin-bottom: 12px;
            }

            p {
              color: #666;
              line-height: 1.6;
            }

            button {
              margin-top: 16px;
              border: 0;
              border-radius: 12px;
              padding: 12px 20px;
              font-weight: 700;
              cursor: pointer;
            }
          </style>
        </head>

        <body>
          <main>
            <h1>You're offline</h1>
            <p>
              Dayront could not connect to the network.
              Reconnect to continue using the latest version.
            </p>

            <button onclick="location.reload()">
              Try Again
            </button>
          </main>
        </body>
      </html>
      `,
      {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  }
}

/* ---------------------------------------------------------
   STATIC ASSETS
   STALE WHILE REVALIDATE
--------------------------------------------------------- */

async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  const networkRequest = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }

      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkRequest;

  if (networkResponse) {
    return networkResponse;
  }

  return new Response('', {
    status: 504,
    statusText: 'Gateway Timeout',
  });
}

/* ---------------------------------------------------------
   FETCH
--------------------------------------------------------- */

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  if (isMediaRequest(request)) {
    return;
  }

  if (!isSameOrigin(request)) {
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
          });
        }

        return response;
      })
      .catch(() => caches.match(request))
  );
});

/* ---------------------------------------------------------
   MESSAGE API
--------------------------------------------------------- */

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names
              .filter((name) => name.startsWith('dayront-'))
              .map((name) => caches.delete(name))
          )
        )
    );
  }
});
>>>>>>> f2a28b2 (fix(android): restore assets, untrack .nomedia, sync native config)
