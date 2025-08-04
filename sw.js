const CACHE_NAME = 'site-cache-v2';
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
  '/css/styles.css',
  '/js/main.js',
  '/js/about.js',
  '/js/contact.js',
  '/js/portfolio.js',
  '/js/services.js',
  '/js/shop.js',
  '/js/blog.js',
  '/js/blog-entry.js',
  '/js/firebase-init.js',
  '/posts.json',
  '/products.json'
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
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const dest = event.request.destination;
  const url = event.request.url;
  const isHTML = dest === 'document' || url.endsWith('.html');
  const isCSS = dest === 'style' || url.endsWith('.css');
  const isJS = dest === 'script' || url.endsWith('.js');

  if (isHTML || isCSS || isJS) {
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
