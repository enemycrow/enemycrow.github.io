const CACHE_NAME = 'site-cache-v8'; // ⬅️ súbelo para forzar actualización
const urlsToCache = [
  '/',
  '/index.html',
  '/404.html',
  '/about.html',
  '/contact.html',
  '/donate.html',
  '/portfolio.html',
  '/privacy.html',
  '/services.html',
  '/shop.html',
  '/blog.html',
  '/blog-entry.html',
  '/css/styles.15c06c305d.css',
  '/js/main.46134422b8.js',
  '/js/about.js',
  '/js/contact.js',
  '/js/portfolio.js',
  '/js/services.js',
  '/js/shop.js',
  '/js/blog.js',
  '/js/blog-entry.js',
  '/js/firebase-init.js',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // No tocamos nada que no sea GET
  if (event.request.method !== 'GET') return;

  // ⬅️ Evita cachear/servir desde cache para la API
  const url = new URL(event.request.url);
  // Ignorar esquemas no soportados por Cache Storage (ej. chrome-extension:)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    // API: siempre desde red y sin cache
    event.respondWith(fetch(event.request));
    return;
  }

  const dest = event.request.destination;
  const isDocument = dest === 'document';
  const isJSON     = url.pathname.endsWith('.json');
  const isCSS      = dest === 'style'  || url.pathname.endsWith('.css');
  const isJS       = dest === 'script' || url.pathname.endsWith('.js');

  // Estrategia network-first con fallback a cache (como ya hacías)
  if (isDocument || isCSS || isJS || isJSON) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Otros assets: cache-first con actualización
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
