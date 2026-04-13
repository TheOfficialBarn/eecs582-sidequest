/*
  Name: sw.js
  Description: Service Worker for Side Quest PWA.
    Provides offline caching of the app shell so the PWA loads without a network connection.
    Uses a network-first strategy: online users always get fresh content,
    while offline users are served from the cache.
  Programmers: Aiden Barnard
  Date: 04/12/2026
*/

const CACHE_NAME = "side-quest-v1";

// App shell files to cache on install
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  // Take control of all open pages immediately
  self.clients.claim();
});

// Fetch: network-first strategy
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Skip non-http(s) requests (e.g., chrome-extension://)
  if (!event.request.url.startsWith("http")) return;

  // Skip API requests — don't cache dynamic data
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching (stream can only be consumed once)
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed — try the cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // For navigation requests, return the cached home page as a fallback
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
      })
  );
});
