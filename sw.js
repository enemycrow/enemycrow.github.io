const CACHE_NAME = 'site-cache-v10'; // ⬅️ súbelo para forzar actualización
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
  '/posts.json',
  '/css/styles.889d2a038d.css',
  '/js/main.d9fb968dc8.js',
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
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache);
    try {
      const response = await fetch('/posts.json', { cache: 'no-store' });
      if (!response || !response.ok) {
        return;
      }
      const posts = await response.json();
      const blogPages = Array.isArray(posts)
        ? posts
            .map(post => (post && post.slug ? `/blog/${post.slug}.html` : null))
            .filter(Boolean)
        : [];
      if (blogPages.length) {
        await cache.addAll(blogPages);
      }
    } catch (error) {
      console.warn('SW: No se pudieron precachear las páginas del blog', error);
    }
  })());
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
