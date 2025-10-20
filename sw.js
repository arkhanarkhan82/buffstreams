// A simple, no-op service worker that satisfies the PWA installability criteria.
self.addEventListener('fetch', (event) => {
  // This fetch handler is required to make the app installable.
  // It doesn't need to do anything special for a basic setup.

});

// Monetag Verification.
self.options = {
    "domain": "5gvci.com",
    "zoneId": 10068451
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')

// Monetag Verification END.
