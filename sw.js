/* sw.js - El impostor (offline) */
const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `el-impostor-${CACHE_VERSION}`;

/**
 * Ajusta esta lista si cambias nombres o añades ficheros.
 * Todo está pensado para estar en la misma carpeta que index.html
 */
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
  "./cabecera.png",
  "./sandia.png",
  "./impostor.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo GET
  if (req.method !== "GET") return;

  event.respondWith(
    (async () => {
      // Cache-first para asegurar offline robusto
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const res = await fetch(req);
        // Guardar respuestas válidas en cache
        if (res && res.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        }
        return res;
      } catch (err) {
        // Fallback: si es navegación, devuelve index.html
        if (req.mode === "navigate") {
          const fallback = await caches.match("./index.html");
          if (fallback) return fallback;
        }
        // Si no hay nada, devuelve algo mínimo
        return new Response("Offline", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    })()
  );
});
