/*
 * Dayront Service Worker
 * Version: 2026.09.30.1
 *
 * Strategy:
 * - HTML/navigation: NETWORK FIRST
 * - CSS/JS/fonts/images: STALE-WHILE-REVALIDATE
 * - Media files: NEVER cache
 * - External requests: NEVER cache
 * - Old caches: automatically removed
 *
 * This prevents an old homepage from remaining stuck in the browser
 * while still providing useful offline support for static assets.
 */

const VERSION = '2026.09.30.1';

const STATIC_CACHE = `dayront-static-${VERSION}`;
const OFFLINE_CACHE = `dayront-offline-${VERSION}`;

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
    /*
     * Always try the network first.
     *
     * This is the most important part for Dayront:
     * new deployments are immediately visible instead of
     * being hidden behind an old cached index page.
     */

    const response = await fetch(request, {
      cache: 'no-cache',
    });

    if (response && response.ok) {
      return response;
    }

    throw new Error('Navigation request failed');
  } catch (error) {
    /*
     * Only use the cached homepage when the network
     * is genuinely unavailable.
     */

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

  /*
   * Return cached asset immediately when available.
   * Update it in the background.
   */

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

  /*
   * Only handle GET.
   */
  if (request.method !== 'GET') {
    return;
  }

  /*
   * Never interfere with media processing files.
   */
  if (isMediaRequest(request)) {
    return;
  }

  /*
   * Never cache external resources.
   */
  if (!isSameOrigin(request)) {
    return;
  }

  /*
   * HTML pages:
   * ALWAYS NETWORK FIRST.
   */
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
    return;
  }

  /*
   * CSS, JS, fonts and images:
   * cache and revalidate.
   */
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  /*
   * Everything else:
   * network first, cache only successful same-origin responses.
   */
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

  /*
   * Allows the page to force an update when necessary.
   */
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  /*
   * Allows the website to completely clear
   * Dayront's own caches.
   */
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