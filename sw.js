/*
 * Digital Tools Hub service worker: offline support and faster repeat visits.
 *
 *  - Pages: network first, falling back to the cached copy (then the homepage).
 *  - Site assets: served from cache, refreshed in the background.
 *  - Pinned CDN libraries (versioned URLs): cache first.
 *  - Analytics, ads, consent and live-data APIs are never cached.
 *
 * VERSION is stamped by scripts/build.mjs; changing it drops old caches.
 */
const VERSION = "dth-1a09efb5";
const PRECACHE = [
  "./",
  "index.html",
  "404.html",
  "assets/css/hub.css",
  "assets/js/tools.js",
  "assets/js/shell.js",
  "assets/js/hub.js",
  "assets/img/icons.svg",
  "favicon.svg",
  "site.webmanifest"
];
const CDN = /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|fonts\.(googleapis|gstatic)\.com)\//;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function put(req, res) {
  if (res && (res.ok || res.type === "opaque")) {
    const copy = res.clone();
    caches.open(VERSION).then((c) => c.put(req, copy));
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Pages: fresh when online, cached when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => put(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./")))
    );
    return;
  }

  // Same-origin static assets: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req).then((res) => put(req, res)).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  // Versioned third-party libraries: cache first.
  if (CDN.test(req.url)) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(req, res))));
  }
  // Everything else (analytics, ads, live APIs) goes straight to the network.
});
