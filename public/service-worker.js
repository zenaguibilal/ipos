/**
 * iPOS Sovereign Service Worker
 * Strategy: Network-First, App-Shell-Only
 * API Bypassing: Strict
 */

const CACHE_NAME = 'ipos-app-shell-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
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
  const url = event.request.url;

  // RULE A: API CALLS ARE SACRED - ALWAYS BYPASS SERVICE WORKER
  if (url.includes('/api/')) {
    return;
  }

  // RULE C: FETCH STRATEGY IS NETWORK-FIRST
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Return network response immediately
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache or offline page
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('/offline.html');
        });
      })
  );
});
