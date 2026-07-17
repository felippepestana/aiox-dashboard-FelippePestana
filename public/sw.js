// =============================================================================
// AIOX Legal – Service Worker
// Cache-first for static assets; network-first for API calls.
// =============================================================================

const CACHE_NAME = 'apex-legal-v1';
const OFFLINE_URL = '/offline';

// Static assets to cache on install (app shell)
// Note: authenticated routes (e.g. /legal) must NOT be pre-cached — cached
// dashboard HTML could be served to logged-out/other users, or a cached
// login redirect could poison offline navigation. They fall back to /offline.
const PROTECTED_PREFIXES = [
  '/legal', '/dental', '/kanban', '/agents', '/monitor',
  '/github', '/squads', '/terminals', '/settings',
];

/** Whether the path belongs to an authenticated area that must never be cached. */
function isProtectedPath(pathname) {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

const APP_SHELL = [
  '/',
  '/login',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Network-first for Next.js RSC/navigation requests
  if (
    url.pathname.startsWith('/_next/data/') ||
    request.headers.get('Next-Router-Prefetch') ||
    request.headers.get('RSC')
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets (_next/static, images, fonts)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first with offline fallback for navigation
  event.respondWith(networkFirstWithFallback(request));
});

// ─── Strategies ──────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Resource unavailable offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Protected-page payloads (e.g. RSC data for /legal) are never cached
    const isProtected = isProtectedPath(new URL(request.url).pathname);
    if (response.ok && !isProtected) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    // Never cache authenticated pages: their HTML (or a login redirect served
    // for them) must not be replayable from Cache Storage offline/after logout.
    const isProtected = isProtectedPath(new URL(request.url).pathname);
    if (response.ok && !isProtected) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match(OFFLINE_URL);
      if (offlinePage) return offlinePage;
    }

    return new Response('Offline', { status: 503 });
  }
}
