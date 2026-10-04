// Offline support. Online, every request goes to the network first (so a
// merged change shows up on the next load) and the cache is refreshed;
// offline, the cached copy is served. Bump VERSION when the file list changes.
var VERSION = "rng-v5";
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
  "data/bulgarian.js",
  "fonts/VT323.woff2",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    // "reload" skips the browser's HTTP cache so the stored copy is current.
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: "reload" }); }));
  }));
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
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    // "no-cache" asks the server whether the file changed (cheap when it hasn't).
    fetch(e.request, { cache: "no-cache" }).then(function (res) {
      if (res.ok) {
        var copy = res.clone();
        caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true });
    })
  );
});
