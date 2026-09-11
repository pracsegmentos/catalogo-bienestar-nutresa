const VERSION = "v1";
const SHELL_CACHE = `bienestar-shell-${VERSION}`;
const IMG_CACHE = `bienestar-imgs-${VERSION}`;

const SHELL_FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./manifest.json",
  "./images/placeholder.svg",
  "./images/placeholder-nutricion.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(SHELL_FILES);
      await precacheImages();
      self.skipWaiting();
    })()
  );
});

async function precacheImages() {
  try {
    const res = await fetch("./data/products.json");
    const products = await res.json();
    const cache = await caches.open(IMG_CACHE);
    const urls = new Set();
    products.forEach((p) => {
      if (p.imagen) urls.add(p.imagen);
      if (p.imagen_tabla_nutricional) urls.add(p.imagen_tabla_nutricional);
    });
    await Promise.all(
      [...urls].map(async (url) => {
        try {
          const r = await fetch(url);
          if (r.ok) await cache.put(url, r);
        } catch (e) {
          /* offline durante la instalación: se cacheará en el próximo uso */
        }
      })
    );
  } catch (e) {
    /* sin conexión en el primer registro: no se pudo precargar el catálogo */
  }
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== SHELL_CACHE && k !== IMG_CACHE).map((k) => caches.delete(k))
      );
      self.clients.claim();
    })()
  );
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return cached || Response.error();
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw e;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.includes("/admin")) return;

  if (url.pathname.endsWith("/data/products.json")) {
    event.respondWith(networkFirst(req, SHELL_CACHE));
    return;
  }
  if (url.pathname.includes("/images/")) {
    event.respondWith(cacheFirst(req, IMG_CACHE));
    return;
  }
  event.respondWith(cacheFirst(req, SHELL_CACHE));
});
