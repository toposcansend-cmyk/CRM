/* CRM Toposcan — Service Worker (PWA v1.0 — 01/06/2026)
 * SEGURO POR DESIGN:
 *  - NUNCA intercepta a API (POST / cross-origin vão direto pra rede).
 *  - HTML = network-first → online sempre pega a versão nova do app (sem ficar preso em cache velho).
 *  - Assets same-origin (logos/ícones) = cache-first com revalidação.
 *  - Offline = serve o shell do cache.
 * Pra publicar nova versão: o network-first já entrega o HTML novo; bump CACHE só limpa o antigo.
 */
const CACHE = 'toposcan-crm-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './logo.png',
  './logo-preto.png',
  './logo-branca.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // add individual: falha de um arquivo não derruba o install inteiro
      Promise.allSettled(SHELL.map((url) => cache.add(url)))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1) Só GET. POST (API, gravações) NUNCA passa pelo SW.
  if (req.method !== 'GET') return;

  // 2) Só mesma origem. API (script.google.com), fontes Google, etc. vão direto pra rede.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 3) Navegação / HTML → network-first (online = sempre fresco; offline = cache).
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    event.respondWith(
      fetch(req.url, { cache: 'no-store' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // 4) Demais GET same-origin (ícones, logos, js) → cache-first com preenchimento.
  event.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
    )
  );
});
