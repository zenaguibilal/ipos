const CACHE_NAME = 'ipos-cache-v1';

// On install, skip waiting to activate faster. Caching is done on-the-fly.
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// On activate, clean up old caches to ensure the latest version is used.
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
    return self.clients.claim();
});

// On fetch, implement caching strategies based on the request type.
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignore non-GET requests as they modify data and should not be cached.
    if (request.method !== 'GET') {
        return;
    }

    // Strategy 1: Cache First for static assets (_next/static). These are immutable.
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(request).then((networkResponse) => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // Strategy 2: Stale-While-Revalidate for images.
    if (request.headers.get('destination') === 'image') {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    const fetchPromise = fetch(request).then((networkResponse) => {
                        if (networkResponse.type !== 'opaque') {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                    // Return cached response immediately if available, otherwise wait for the network.
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Strategy 3: Network First for all other requests (navigation, API calls).
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                // If the request is successful, update the cache.
                if (networkResponse && networkResponse.status === 200) {
                     // Only cache requests from our origin or Supabase API.
                    if (url.origin === self.location.origin || url.hostname.endsWith('supabase.co')) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                }
                return networkResponse;
            })
            .catch(() => {
                // If the network request fails, try to serve from the cache as a fallback.
                return caches.match(request);
            })
    );
});
