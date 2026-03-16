// public/sw.js
const CACHE_NAME = 'ipos-v1';

// Add assets that should always be cached
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Network First strategy for API calls or dynamic content if needed
  // For this app, we'll use a Cache First, then Network strategy
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return the cached response if it exists
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise, fetch from the network
      return fetch(event.request).then(networkResponse => {
          // Optionally, cache the new response
          return caches.open(CACHE_NAME).then(cache => {
            // Be careful not to cache everything, especially large or sensitive data
            // Here we just cache the request if it was successful
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
        .catch(() => {
          // If the network fails, and there's no cache, serve a fallback page
          return caches.match('/offline');
        });
    })
  );
});

// Listen for messages from the client to skip waiting
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
