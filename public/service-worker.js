/**
 * iPOS Service Worker
 * Strategy: Network-First, App-Shell-Only
 * Strictly bypasses all /api/ calls to maintain Cloud Sovereignty.
 */

const CACHE_NAME = 'ipos-app-shell-v1';
const URLS_TO_CACHE = ['/', '/offline.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // RULE A: API calls are sacred and must bypass the service worker
  if (event.request.url.includes('/api/')) {
    return;
  }

  // RULE C: Network-First strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      // Fallback to offline page only if network fails
      return caches.match('/offline.html') || caches.match('/');
    })
  );
});
