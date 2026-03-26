/* eslint-disable no-restricted-globals */

// Cache name
const CACHE_NAME = 'ipos-cache-v1';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/icon.svg'
];

// Install event: caching the shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: cleaning up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network-first falling back to cache
self.addEventListener('fetch', (event) => {
  // We only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If successful, clone and store in cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to get from cache
        return caches.match(event.request);
      })
  );
});