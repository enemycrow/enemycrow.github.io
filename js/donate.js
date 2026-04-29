const getTrustedTypesPolicy = () => {
  if (!window.trustedTypes) return null;
  if (window.__trustedTypesPolicy) return window.__trustedTypesPolicy;
  try {
    window.__trustedTypesPolicy = window.trustedTypes.createPolicy('default', {
      createHTML: (input) => input,
      createScriptURL: (input) => input
    });
  } catch (error) {
    window.__trustedTypesPolicy = null;
  }
  return window.__trustedTypesPolicy;
};

const toTrustedHTML = (html) => {
  const policy = getTrustedTypesPolicy();
  return policy ? policy.createHTML(String(html)) : String(html);
};

document.addEventListener('DOMContentLoaded', () => {
  // === 1) DOM ===
  const el  = document.getElementById('random-story');
  if (!el) return;
  const img = document.getElementById('story-img');
  const ttl = document.getElementById('story-title');
  const txt = document.getElementById('story-text');
  const lic = document.getElementById('story-license');

  // === 3) Licencia CC usando chooser (iconos externos) ===
  const CC_ICONS_BASE = 'https://mirrors.creativecommons.org/presskit/icons';
  const CC_NAME = {
    'by':'CC BY 4.0','by-sa':'CC BY-SA 4.0','by-nd':'CC BY-ND 4.0',
    'by-nc':'CC BY-NC 4.0','by-nc-sa':'CC BY-NC-SA 4.0','by-nc-nd':'CC BY-NC-ND 4.0'
  };
  const CC_ICONS = {
    'by':['cc','by'],'by-sa':['cc','by','sa'],'by-nd':['cc','by','nd'],
    'by-nc':['cc','by','nc'],'by-nc-sa':['cc','by','nc','sa'],'by-nc-nd':['cc','by','nc','nd']
  };

  function licenseHTML({ title, author, slug, cc='by-nc-nd', year }){
    const currentYear = year ?? new Date().getFullYear();
    const link = slug ? `${location.origin}/blog.html?slug=${encodeURIComponent(slug)}` : location.href;
    const icons = (CC_ICONS[cc] || CC_ICONS['by-nc-nd'])
      .map(i => `<img src="${CC_ICONS_BASE}/${i}.svg" alt="" style="max-width:1em;max-height:1em;margin-left:.2em;">`)
      .join('');
    return `<a href="${link}">${title}</a> © ${currentYear} by ` +
           `<a href="https://plumafarollama.com">${author || 'La Pluma, El Faro y La Llama'}</a> is licensed under ` +
           `<a href="https://creativecommons.org/licenses/${cc}/4.0/" target="_blank" rel="noopener">${CC_NAME[cc] || CC_NAME['by-nc-nd']}</a>` +
           icons;
  }

  // === 4) Imágenes responsivas (rutas absolutas desde la raíz) ===
  function srcsetFor(base){
    return [
      `/assets/images/responsive/stories/${base}-400.webp 400w`,
      `/assets/images/responsive/stories/${base}-800.webp 800w`,
      `/assets/images/responsive/stories/${base}-1200.webp 1200w`,
    ].join(', ');
  }
  const sizes = "(max-width: 600px) 100vw, 1200px";

  // Precarga simple para evitar parpadeo
  function preloadStoryImage(base){
    return new Promise((resolve, reject) => {
      const pre = new Image();
      pre.onload = () => resolve();
      pre.onerror = reject;
      pre.src = `/assets/images/responsive/stories/${base}-800.webp`;
      pre.decoding = 'async';
      pre.loading  = 'eager';
    });
  }

  // === 5) Rotación ===
  const ms = Number(el.dataset.interval) || 10000;

  fetch('/stories.json')
    .then(r => r.json())
    .then(stories => initRotation(stories))
    .catch(() => {});

  function initRotation(stories) {
  let i = Math.floor(Math.random() * stories.length);

  async function show(idx){
    const s = stories[idx];
    try { await preloadStoryImage(s.imageBase); } catch(e) {}

    img.classList.add('fade-out');
    txt.classList.add('fade-out');

    setTimeout(() => {
      ttl.textContent = s.title;
      txt.textContent = s.text;

      img.alt    = s.title;
      img.src    = `/assets/images/stories/${s.imageBase}.webp`;
      img.srcset = srcsetFor(s.imageBase);
      img.sizes  = sizes;
      lic.innerHTML = toTrustedHTML(licenseHTML(s));

      img.classList.remove('fade-out');
      txt.classList.remove('fade-out');
    }, 220);
  }

  show(i);

  let timer = setInterval(() => { i = (i + 1) % stories.length; show(i); }, ms);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearInterval(timer); timer = null; }
    else if (!timer) { timer = setInterval(() => { i = (i + 1) % stories.length; show(i); }, ms); }
  });
  } // end initRotation
});
