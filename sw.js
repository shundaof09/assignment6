/* Service Worker — Smart Portfolio Hub (PWA) */
const CACHE_NAME = "smart-portfolio-v1";
const ASSETS_TO_CACHE = [
  "./", "./index.html", "./styles.css", "./script.js",
  "./logo.png", "./banner.jpg", "./profile.jpg",
  "./offline.html", "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("api.github.com") ||
    event.request.url.includes("generativelanguage.googleapis.com")
  ) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.destination === "document")
            return caches.match("./offline.html");
        });
    })
  );
});
