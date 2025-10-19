/* client.js
   Client helper to request SW logs and render them.
   Usage in pages:
   <script src="/npm/sw-logger/dist/client.js"></script>
   window.requestSWLogs(200);
*/
(function(){
  function requestSWLogs(limit = 200) {
    if (!('serviceWorker' in navigator)) return Promise.resolve([]);
    if (!navigator.serviceWorker.controller) {
      console.info('No SW controlling this page');
      return Promise.resolve([]);
    }
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = ev => {
        const data = ev.data || {};
        if (data.type === 'sw-logs') {
          console.group('SW logs');
          (data.logs || []).forEach(l => console.log(new Date(l.ts).toISOString(), l.msg));
          console.groupEnd();
          const container = document.getElementById('sw-logs');
          if (container) {
            container.innerHTML = '';
            (data.logs || []).forEach(l => {
              const el = document.createElement('div');
              el.textContent = new Date(l.ts).toLocaleString() + ' — ' + l.msg;
              container.appendChild(el);
            });
          }
          resolve(data.logs || []);
        } else {
          resolve([]);
        }
      };
      navigator.serviceWorker.controller.postMessage({ type: 'get-sw-logs', limit }, [messageChannel.port2]);
    });
  }

  window.requestSWLogs = requestSWLogs;
})();
