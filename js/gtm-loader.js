(() => {
  const GTM_ID = 'GTM-NX2C8N3W';
  const LOAD_DELAY_MS = 2000;
  let gtmLoaded = false;

  const loadGtm = () => {
    if (gtmLoaded) {
      return;
    }
    gtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js',
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    document.head.appendChild(script);
  };

  const scheduleGtm = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadGtm, { timeout: LOAD_DELAY_MS });
      return;
    }
    window.setTimeout(loadGtm, LOAD_DELAY_MS);
  };

  document.addEventListener('DOMContentLoaded', scheduleGtm);
  window.addEventListener('scroll', loadGtm, { once: true, passive: true });
  window.addEventListener('click', loadGtm, { once: true });
  window.addEventListener('keydown', loadGtm, { once: true });
})();
