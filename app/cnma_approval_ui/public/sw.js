const CACHE_NAME = "prorequest-v1";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./web-manifest.json",
  "./pwa-icon-192.png",
  "./pwa-icon-512.png",
  "./apple-touch-icon.png",
  "./favicon.svg",
  "./RESOURCE_FAVICON.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  // Never cache API calls to CAP/SAP or session endpoints.
  if (
    url.pathname.includes("/api/") ||
    url.pathname.includes("/odata/") ||
    url.pathname.includes("/browse") ||
    url.pathname.includes("/admin") ||
    url.pathname.includes("/user-api") ||
    url.pathname.includes("/do/logout") ||
    url.pathname.includes("/logout-page.html")
  ) {
    return;
  }

  // For navigation requests (loading pages), try network first, then cache, fallback to index.html
  if (request.mode === "navigate") {
    // If online, do not intercept navigation requests to let the browser handle redirects (e.g. SSO login) natively.
    // This prevents infinite loops caused by WebKit blocking cross-origin redirects inside service worker fetches.
    if (self.navigator.onLine) {
      return;
    }
    event.respondWith(
      caches.match("./index.html") || caches.match("./")
    );
    return;
  }

  // For other static assets, use cache first.
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Cache static files and styles dynamically
          if (
            response.status === 200 &&
            (url.origin === self.location.origin || url.pathname.includes("/resources/"))
          ) {
            cache.put(request, responseClone);
          }
        });

        return response;
      });
    })
  );
});
