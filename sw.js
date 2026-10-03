// Offline support: cache the whole app on install, serve from cache first.
// Bump VERSION whenever files change so clients pick up the update.
var VERSION = "rng-v2";
var FILES = [
  "./",
  "index.html",
  "css/style.css",
  "js/generator.js",
  "js/app.js",
  "data/american.js",
  "data/russian.js",
  "data/serbian.js",
  "data/greek.js",
  "data/ukrainian.js",
  "data/chinese.js",
  "data/turkish.js",
  "data/arabic.js",
  "data/indian.js",
  "data/japanese.js",
  "data/korean.js",
  "data/german.js",
  "data/french.js",
  "data/norwegian.js",
  "data/latvian.js",
  "fonts/VT323.woff2",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(e.request);
    })
  );
});
