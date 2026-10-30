const CACHE = "silopay-shell-v2";
const SHELL = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  const local = self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";
  const icon = url.pathname.startsWith("/icons/") || url.pathname === "/apple-touch-icon.png";
  const hashed = !local && url.pathname.startsWith("/_next/static/");
  if (icon || url.pathname === "/offline.html" || hashed) {
    event.respondWith(fromCache(request));
  }
});

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}
