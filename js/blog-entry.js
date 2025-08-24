// SIN Firestore: usa tu API PHP para reacciones

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) return;

  // utilidades
  const reactionKeys = ['toco','sumergirme','personajes','mundo','lugares'];
  const votedKey = `voted_${slug}`;

  async function fetchTotals(slug) {
    try {
      const res = await fetch(`/api/reactions.php?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.ok) throw new Error('API error');
      return json.totals || { toco:0, sumergirme:0, personajes:0, mundo:0, lugares:0 };
    } catch (e) {
      return { toco:0, sumergirme:0, personajes:0, mundo:0, lugares:0 };
    }
  }

  async function sendReaction(slug, reaction, add) {
    const fd = new FormData();
    fd.append('slug', slug);
    fd.append('reaction', reaction);
    fd.append('action', add ? 'add' : 'remove');
    const res = await fetch('/api/react.php', { method: 'POST', body: fd });
    const json = await res.json();
    if (!json.ok) throw new Error('API error');
    return json.totals || {};
  }

  try {
    // ---- Cargar datos del post
    let posts;
    const cached = localStorage.getItem('postsData');
    if (cached) {
      posts = JSON.parse(cached);
    } else {
      const res = await fetch('posts.json');
      posts = await res.json();
      try { localStorage.setItem('postsData', JSON.stringify(posts)); } catch(e) {}
    }
    const entry = posts.find(p => p.slug === slug);
    if (!entry) return;

    const fecha = new Date(entry.fecha);
    const fechaTexto = fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const titleEl   = document.getElementById('entry-title');
    const dateEl    = document.getElementById('entry-date');
    const contentEl = document.getElementById('entry-content');
    const authorEl  = document.getElementById('entry-author');
    const licenseEl = document.getElementById('entry-license');
    const imgEl     = document.getElementById('entry-image');
    const timeEl    = document.getElementById('entry-time');
    const commentsEl= document.getElementById('entry-comments');
    const catEl     = document.getElementById('entry-categories');
    const catElBlock= document.getElementById('entry-categories-block');

    if (titleEl) titleEl.textContent = entry.titulo;
    if (dateEl)  dateEl.textContent  = fechaTexto;
    if (timeEl)  timeEl.textContent  = entry.tiempo;
    if (contentEl) contentEl.innerHTML = entry.contenido_html;
    if (authorEl)  authorEl.textContent = `— ${entry.autor}`;

    if (imgEl) {
      const base = entry.imagen.replace('.webp', '');
      imgEl.src = `assets/images/blog/${base}.webp`;
      imgEl.srcset = `
        assets/images/responsive/blog/${base}-400.webp 400w,
        assets/images/responsive/blog/${base}-800.webp 800w,
        assets/images/responsive/blog/${base}-1200.webp 1200w,
        assets/images/blog/${base}.webp 1600w`;
      imgEl.sizes = "(max-width: 600px) 100vw, 1200px";
      imgEl.alt = entry.titulo;
    }

    if (catEl) {
      const catsHtml = (entry.categoria_temas || [])
        .map(c => `<span class="category-tag">${c}</span>`)
        .join(' ');
      catEl.innerHTML = catsHtml;
    }

    if (catElBlock) {
      const booksHtml = (entry.categoria_libros || [])
        .map(c => `<span class="category-tag">${c}</span>`)
        .join(' ');
      catElBlock.innerHTML = booksHtml;
    }

    if (licenseEl) {
      const year = fecha.getFullYear();
      const link = window.location.href;
      const titleWork = `Entrada de blog: ${entry.titulo}`;
      licenseEl.innerHTML =
        `<a href="${link}">${titleWork}</a> © ${year} by ` +
        `<a href="https://plumafarollama.com">${entry.autor}</a> is licensed under ` +
        `<a href="https://creativecommons.org/licenses/by-nc-nd/4.0/">CC BY-NC-ND 4.0</a>` +
        `<img loading="lazy" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">` +
        `<img loading="lazy" src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">` +
        `<img loading="lazy" src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">` +
        `<img loading="lazy" src="https://mirrors.creativecommons.org/presskit/icons/nd.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">`;
    }

    // ---- Reacciones (API propia)
    // Pinta contadores iniciales
    const totals = await fetchTotals(slug);
    reactionKeys.forEach(key => {
      const el = document.getElementById(`reaction-${key}-count`);
      if (el) el.textContent = totals[key] || 0;
    });

    // Estado local (por IP lo limita el backend; aquí marcamos UI)
    let voted = {};
    try { voted = JSON.parse(localStorage.getItem(votedKey) || '{}'); } catch (e) { voted = {}; }

    // Marcar UI desde localStorage
    document.querySelectorAll('.reaction').forEach(reactionEl => {
      const key = reactionEl.getAttribute('data-reaction');
      if (key && voted[key]) reactionEl.classList.add('reacted');
    });

    // Handlers de click (toggle add/remove)
    document.querySelectorAll('.reaction').forEach(reactionEl => {
      const key = reactionEl.getAttribute('data-reaction');
      if (!key || !reactionKeys.includes(key)) return;

      reactionEl.addEventListener('click', async () => {
        const add = !voted[key]; // si no votó, sumamos; si ya votó, quitamos
        try {
          const updated = await sendReaction(slug, key, add);

          // Actualiza contadores en la UI
          reactionKeys.forEach(k => {
            const el = document.getElementById(`reaction-${k}-count`);
            if (el) el.textContent = updated[k] ?? 0;
          });

          // Actualiza estado local y clase
          voted[key] = add ? true : undefined;
          if (!add) delete voted[key];
          localStorage.setItem(votedKey, JSON.stringify(voted));

          reactionEl.classList.toggle('reacted', !!voted[key]);
        } catch (err) {
          console.error('Error al enviar reacción', err);
        }
      });
    });

    if (commentsEl) commentsEl.style.display = 'none';
  } catch (err) {
    console.error('Error al cargar la entrada', err);
  }
});
