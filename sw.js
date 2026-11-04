/* Telling 581 – service worker: appen åpnes også uten nett.
   Nett først (maks 4 s), ellers siste lagrede versjon. Bare egne filer – Google Sheet-trafikken går forbi. */
const CACHE = "telling581-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {})); });
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const net = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000))]);
      if (net && net.ok) cache.put(req, net.clone());
      return net;
    } catch (err) {
      return (await cache.match(req, { ignoreSearch: true })) || (await cache.match("./")) || Response.error();
    }
  })());
});
