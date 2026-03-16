// public/sw.js
const CACHE_NAME = 'ipos-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  // Add other critical assets you want to cache initially
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
  if (event.request.method !== 'GET' || event.request.url.includes('google.com')) {
    // Don't cache non-GET requests or Google API calls
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Return from cache if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch from network
      return fetch(event.request).then(networkResponse => {
        // Optional: Cache the new response
        // Be careful with what you cache. Caching everything can lead to issues.
        // For a full offline app, you'd have a more sophisticated strategy here.
        return networkResponse;
      }).catch(() => {
        // If fetch fails (offline), return a fallback page
        // You might want to cache an '/offline' page during install.
        return caches.match('/'); 
      });
    })
  );
});
