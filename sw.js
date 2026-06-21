const CACHE = "yomu-v2";
const ASSETS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Network-first para HTML: siempre intenta traer la version mas reciente.
// Si no hay internet, usa la copia en cache como respaldo (modo offline).
self.addEventListener("fetch", e => {
  const isHTML = e.request.mode === "navigate" || e.request.url.endsWith(".html") || e.request.url.endsWith("/");
  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
    );
  } else {
    // Otros recursos (manifest, iconos): cache-first esta bien, cambian poco.
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
