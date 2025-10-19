/* sw-helpers.js
   Helpers for Service Workers: IndexedDB logger and message handlers.
   Usage: importScripts('/npm/sw-logger/dist/sw-helpers.js');
*/
(function(){
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
      const countReq = store.count();
      await new Promise((res, rej) => {
        countReq.onsuccess = () => res(countReq.result);
        countReq.onerror = () => rej(countReq.error);
      }).then(async count => {
        if (count > MAX_LOGS) {
          const toDelete = count - MAX_LOGS;
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
      console.debug('SW log write failed', err && err.message ? err.message : err);
    }
  }

  async function readAllLogs(limit = 200) {
    try {
      const db = await openLogDB();
      const tx = db.transaction(LOG_STORE, 'readonly');
      const store = tx.objectStore(LOG_STORE);
      const items = [];
      const req = store.openCursor(null, 'prev');
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

  // Expose helpers to global scope in service worker
  self.__swLogger = { writeLog, readAllLogs };

  // Message listener helper
  self.addEventListener('message', event => {
    const data = event.data || {};
    if (!data || !data.type) return;
    if (data.type === 'get-sw-logs') {
      readAllLogs(data.limit || 200).then(logs => {
        event.source && event.source.postMessage && event.source.postMessage({ type: 'sw-logs', logs });
      });
    }
    if (data.type === 'clear-sw-logs') {
      openLogDB().then(db => {
        const tx = db.transaction(LOG_STORE, 'readwrite');
        tx.objectStore(LOG_STORE).clear();
        tx.oncomplete = () => db.close();
        event.source && event.source.postMessage && event.source.postMessage({ type: 'sw-logs-cleared' });
      }).catch(() => {
        event.source && event.source.postMessage && event.source.postMessage({ type: 'sw-logs-cleared', ok: false });
      });
    }
  });
})();
