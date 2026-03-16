const CACHE_NAME = 'ipos-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching offline page and core assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests, use a network-first strategy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline'))
    );
    return;
  }

  // For other requests (assets), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return the cached response if it's found.
      if (cachedResponse) {
        return cachedResponse;
      }
      // If not in cache, fetch from the network.
      return fetch(event.request);
    })
  );
});
