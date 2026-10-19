// Cache public static files only. Session responses and HTML must reach the browser.
const CACHE_NAME = "prorequest-v3-static-" + encodeURIComponent(self.registration.scope);

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      // Retire the old cache that could contain login HTML under asset URLs.
      await Promise.all(keys.filter((key) => key.startsWith("prorequest-v2")).map((key) => caches.delete(key)));
    } catch (_) {
      // Storage can be unavailable in mobile/private browsing. Online use still works.
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (request.method !== "GET" || request.mode === "navigate" ||
      url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  const path = url.pathname.slice(scope.pathname.length);
  // Mutable install icons and manifests must revalidate normally so branding fixes
  // reach mobile devices instead of staying in a cache-first service worker.
  if (!/^assets\/.+\.(js|css|woff2?|ttf|png|svg|jpe?g|webp)$/.test(path)) return;

  function valid(response) {
    if (!response || response.status !== 200 || response.redirected) return false;
    const type = (response.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
    if (/\.js$/.test(path)) return /^(application|text)\/(javascript|ecmascript)$/.test(type);
    if (/\.css$/.test(path)) return type === "text/css";
    if (/\.json$/.test(path)) return type === "application/json" || type === "application/manifest+json";
    if (/\.(woff2?|ttf)$/.test(path)) return type.startsWith("font/") || type === "application/font-woff";
    return type.startsWith("image/");
  }

  event.respondWith((async () => {
    let cache;
    try {
      cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (valid(cached)) return cached;
      if (cached) await cache.delete(request);
    } catch (_) {
      cache = null;
    }
    const response = await fetch(request);
    if (cache && valid(response)) {
      try { await cache.put(request, response.clone()); } catch (_) { /* Quota must not block the app. */ }
    }
    return response;
  })());
});
