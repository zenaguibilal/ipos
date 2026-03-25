const CACHE_NAME = 'ipos-cache-v1';
const urlsToCache = [
  '/',
  '/sell',
  '/products',
  '/customers',
  '/sales-history',
  '/stock',
  '/returns',
  '/profile',
  '/expenses',
  '/bread',
  '/login'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore Supabase and other external requests
  if (url.origin !== self.location.origin || url.pathname.startsWith('/_next/static/development')) {
    return;
  }
  
  if (request.method !== 'GET') {
    return;
  }
  
  // Cache First for static assets
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // Stale-While-Revalidate for images
  if (/\.(png|jpg|jpeg|svg|gif|webp)$/.test(url.pathname)) {
      event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(request).then(cachedResponse => {
                const fetchPromise = fetch(request).then(networkResponse => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            });
        })
      );
      return;
  }

  // Network First for pages and API calls
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          // Do not cache Supabase auth or API calls
          if (!url.pathname.includes('/rest/v1') && !url.pathname.includes('/auth/v1')) {
             cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
      .catch(() => {
        return caches.match(request).then(cachedResponse => {
          return cachedResponse || caches.match('/');
        });
      })
  );
});
