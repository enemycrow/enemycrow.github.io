const CACHE_NAME = 'site-cache-v15'; // ⬅️ súbelo para forzar actualización
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
  '/css/styles.0ccc99f8ba.css',
  '/css/styles.0ccc99f8ba.css?v=20260122',
  '/js/main.1715605436.js',
  '/js/about.js',
  '/js/about.js?v=20260122',
  '/js/contact.js',
  '/js/portfolio.js',
  '/js/services.js',
  '/js/shop.js',
  '/js/blog.js',
  '/js/blog-entry.js',
  '/js/firebase-init.js',
  '/assets/images/site/plumafaroyllama.webp',
];

/* --- IndexedDB tiny logger for SW ---
   We store a small ring buffer of logs to inspect them from pages.
*/
const LOG_DB_NAME = 'sw-logs-db';
const LOG_STORE = 'logs';
const MAX_LOGS = 500;

function openLogDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(LOG_DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(LOG_STORE)) {
        db.createObjectStore(LOG_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
}

async function writeLog(message) {
  try {
    const db = await openLogDB();
    const tx = db.transaction(LOG_STORE, 'readwrite');
    const store = tx.objectStore(LOG_STORE);
    const item = { ts: Date.now(), msg: String(message) };
    await new Promise((res, rej) => {
      const r = store.add(item);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    // Trim if too many logs
    const countReq = store.count();
    await new Promise((res, rej) => {
      countReq.onsuccess = () => res(countReq.result);
      countReq.onerror = () => rej(countReq.error);
    }).then(async count => {
      if (count > MAX_LOGS) {
        const toDelete = count - MAX_LOGS;
        // delete oldest
        const getReq = store.openCursor();
        let deleted = 0;
        await new Promise((res, rej) => {
          getReq.onsuccess = e => {
            const cur = e.target.result;
            if (!cur || deleted >= toDelete) return res();
            store.delete(cur.primaryKey);
            deleted++;
            cur.continue();
          };
          getReq.onerror = () => rej(getReq.error);
        });
      }
    });
    tx.oncomplete = () => db.close();
  } catch (err) {
    // IndexedDB might be unavailable in some contexts; avoid throwing
    console.debug('SW log write failed', err && err.message ? err.message : err);
  }
}

async function readAllLogs(limit = 200) {
  try {
    const db = await openLogDB();
    const tx = db.transaction(LOG_STORE, 'readonly');
    const store = tx.objectStore(LOG_STORE);
    const items = [];
    const req = store.openCursor(null, 'prev'); // newest first
    return await new Promise((resolve, reject) => {
      req.onsuccess = e => {
        const cur = e.target.result;
        if (!cur || items.length >= limit) {
          resolve(items);
          db.close();
          return;
        }
        items.push(cur.value);
        cur.continue();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.debug('SW readAllLogs failed', err && err.message ? err.message : err);
    return [];
  }
}


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
      writeLog('SW install precache error: ' + (error && error.message ? error.message : String(error)));
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
    writeLog('SW fetch API passthrough: ' + event.request.url);
    event.respondWith(fetch(event.request));
    return;
  }

  const dest = event.request.destination;
  const isDocument = dest === 'document';
  const isJSON     = url.pathname.endsWith('.json');
  const isCSS      = dest === 'style'  || url.pathname.endsWith('.css');
  const isJS       = dest === 'script' || url.pathname.endsWith('.js');

  // Estrategia network-first con fallback a cache (como ya hacías)
  // Forzar network-first para la carpeta de la galleta de la fortuna
  if (url.pathname.startsWith('/fortune_cookie/')) {
    // Evitar servir desde cache una versión antigua de los assets de la galleta
    writeLog('SW network-first for fortune_cookie: ' + event.request.url);
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Actualizamos la cache con la versión más reciente
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

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
        // Debug: registrar si devolvemos desde cache o fetch
        if (cached) {
          console.debug('SW: serving from cache', event.request.url);
          writeLog('SW: serving from cache ' + event.request.url);
        } else {
          console.debug('SW: fetching from network', event.request.url);
          writeLog('SW: fetching from network ' + event.request.url);
        }
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

// Escucha mensajes desde páginas clientes para consultas de logs
self.addEventListener('message', event => {
  const data = event.data || {};
  if (!data || !data.type) return;
  const source = event.source || null;
  if (data.type === 'get-sw-logs') {
    // dev: devolver los últimos logs al cliente que lo solicitó
    readAllLogs(data.limit || 200).then(logs => {
      // responder al cliente por postMessage
      event.source && event.source.postMessage && event.source.postMessage({ type: 'sw-logs', logs });
    });
    return;
  }
  if (data.type === 'clear-sw-logs') {
    // limpiar la store de logs
    openLogDB().then(db => {
      const tx = db.transaction(LOG_STORE, 'readwrite');
      tx.objectStore(LOG_STORE).clear();
      tx.oncomplete = () => db.close();
      event.source && event.source.postMessage && event.source.postMessage({ type: 'sw-logs-cleared' });
    }).catch(() => {
      event.source && event.source.postMessage && event.source.postMessage({ type: 'sw-logs-cleared', ok: false });
    });
    return;
  }
});
