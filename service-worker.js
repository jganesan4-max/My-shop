// Minimal service worker — enables "Add to Home Screen" install prompts.
// No offline caching logic yet; just needs to exist and respond to fetch.
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  // Pass-through — always go to network. Safe no-op for now.
});
