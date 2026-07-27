// Minimal service worker - required by Chrome/Android to allow
// "Add to Home Screen" installability. It doesn't need to cache
// anything for this app to become installable.
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
