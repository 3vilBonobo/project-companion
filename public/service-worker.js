const CACHE_VERSION = 'project-companion-v1';
const APP_SHELL = ['/', '/today', '/manifest.webmanifest', '/icons/companion-192.png', '/icons/companion-512.png'];
const IS_LOCAL_DEVELOPMENT = ['localhost', '127.0.0.1'].includes(self.location.hostname);

self.addEventListener('install', event => {
  if (IS_LOCAL_DEVELOPMENT) { self.skipWaiting(); return; }
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL)));
});
self.addEventListener('activate', event => {
  if (IS_LOCAL_DEVELOPMENT) {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))).then(() => self.registration.unregister()));
    return;
  }
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  if (IS_LOCAL_DEVELOPMENT) return;
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request)
      .then(response => { const copy = response.clone(); void caches.open(CACHE_VERSION).then(cache => cache.put('/', copy)); return response; })
      .catch(() => caches.match(request).then(response => response ?? caches.match('/'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached ?? fetch(request).then(response => {
    if (response.ok) { const copy = response.clone(); void caches.open(CACHE_VERSION).then(cache => cache.put(request, copy)); }
    return response;
  })));
});
