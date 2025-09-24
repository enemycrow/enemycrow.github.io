document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) return;

  // utilidades
  const reactionKeys = ['toco','sumergirme','personajes','mundo','lugares'];
  const votedKey = `voted_${slug}`;

  async function fetchTotals(slug) {
    try {
      const res = await fetch(`/api/reactions.php?slug=${encodeURIComponent(slug)}`, {
        cache: 'no-store',
        credentials: 'same-origin'   // 👈 agregado
      });
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
    const res = await fetch('/api/react.php', {
      method: 'POST',
      body: fd,
      credentials: 'same-origin',
      cache: 'no-store'
    });
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

    const titleEl    = document.getElementById('entry-title');
    const dateEl     = document.getElementById('entry-date');
    const contentEl  = document.getElementById('entry-content');
    const authorEl   = document.getElementById('entry-author');
    const licenseEl  = document.getElementById('entry-license');
    const imgEl      = document.getElementById('entry-image');
    const timeEl     = document.getElementById('entry-time');
    const catEl      = document.getElementById('entry-categories');
    const catElBlock = document.getElementById('entry-categories-block');
    const imageBaseName = entry.imagenBase ?? (typeof entry.imagen === 'string' ? entry.imagen.replace(/\.webp$/i, '') : null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const publishDate = new Date(entry.fecha);
    publishDate.setHours(0, 0, 0, 0);

    if (!isNaN(publishDate) && publishDate > today) {
      [titleEl, dateEl, authorEl, licenseEl, timeEl].forEach(el => {
        if (el) el.textContent = '';
      });
      if (contentEl) {
        contentEl.innerHTML = '<p>Esta entrada estará disponible pronto. Puedes explorar otras publicaciones en <a href="blog.html">el blog</a>.</p>';
      }
      if (imgEl) {
        imgEl.removeAttribute('src');
        imgEl.removeAttribute('srcset');
        imgEl.removeAttribute('sizes');
        imgEl.alt = '';
      }
      if (catEl) catEl.innerHTML = '';
      if (catElBlock) catElBlock.innerHTML = '';
      return;
    }

    const fecha = publishDate;
    const fechaTexto = fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    if (titleEl) titleEl.textContent = entry.titulo;
    if (dateEl)  dateEl.textContent  = fechaTexto;
    if (timeEl)  timeEl.textContent  = entry.tiempo;
    if (contentEl) contentEl.innerHTML = entry.contenido_html;
    if (authorEl)  authorEl.textContent = `— ${entry.autor}`;

    if (imgEl) {
      if (imageBaseName) {
        imgEl.src = `assets/images/blog/${imageBaseName}.webp`;
        imgEl.srcset = `
        assets/images/responsive/blog/${imageBaseName}-400.webp 400w,
        assets/images/responsive/blog/${imageBaseName}-800.webp 800w,
        assets/images/responsive/blog/${imageBaseName}-1200.webp 1200w,
        assets/images/blog/${imageBaseName}.webp 1600w`;
        imgEl.sizes = "(max-width: 600px) 100vw, 1200px";
      } else {
        imgEl.removeAttribute('srcset');
        imgEl.removeAttribute('sizes');
      }
      imgEl.alt = entry.titulo || imgEl.alt || '';
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

    const siteName = 'La Pluma, el Faro y la Llama';
    const plainHtml = typeof entry.contenido_html === 'string' ? entry.contenido_html : '';
    const generatedDescription = plainHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const socialSnippet = (typeof entry.fragmento_social === 'string' && entry.fragmento_social.trim())
      ? entry.fragmento_social.trim()
      : '';
    const fallbackSnippet = (typeof entry.fragmento === 'string' && entry.fragmento.trim())
      ? entry.fragmento.trim()
      : '';
    const description = socialSnippet
      || fallbackSnippet
      || generatedDescription
      || entry.titulo
      || '';
    const canonicalUrl = entry.slug
      ? new URL(`blog-entry.html?slug=${entry.slug}`, window.location.origin).href
      : window.location.href;
    if (entry.titulo) {
      document.title = `${entry.titulo} | ${siteName}`;
    }

    const setMetaContent = (selector, value) => {
      const el = document.querySelector(selector);
      if (!el) return;
      el.setAttribute('content', value || '');
    };

    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', entry.titulo || '');
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:type"]', 'article');
    setMetaContent('meta[property="og:url"]', canonicalUrl);

    let socialImageUrl = '';
    if (imageBaseName) {
      socialImageUrl = new URL(`assets/images/responsive/blog/${imageBaseName}-1200.webp`, window.location.origin).href;
    }
    setMetaContent('meta[property="og:image"]', socialImageUrl);
    setMetaContent('meta[property="og:image:alt"]', entry.titulo || '');
    setMetaContent('meta[name="twitter:card"]', 'summary_large_image');
    setMetaContent('meta[name="twitter:title"]', entry.titulo || '');
    setMetaContent('meta[name="twitter:description"]', description);
    setMetaContent('meta[name="twitter:image"]', socialImageUrl);
    setMetaContent('meta[name="twitter:image:alt"]', entry.titulo || '');

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.setAttribute('href', canonicalUrl);
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

      let busy = false;

      reactionEl.addEventListener('click', async () => {
        if (busy) return;
        busy = true;
        reactionEl.classList.add('is-loading'); // opcional, para CSS animación

        try {
          const add = !voted[key];
          const updated = await sendReaction(slug, key, add);

          // Actualiza contadores en la UI
          reactionKeys.forEach(k => {
            const el = document.getElementById(`reaction-${k}-count`);
            if (el) el.textContent = updated[k] ?? 0;
          });

          // Actualiza estado local
          voted[key] = add ? true : undefined;
          if (!add) delete voted[key];
          localStorage.setItem(votedKey, JSON.stringify(voted));

          reactionEl.classList.toggle('reacted', !!voted[key]);
        } catch (err) {
          console.error('Error al enviar reacción', err);
        } finally {
          busy = false;                      // 👈 libera el flag
          reactionEl.classList.remove('is-loading'); // opcional
        }
      });
    }); // ← cierra el segundo forEach
  } catch (err) {
    console.error('Error al cargar la entrada', err);
  }
}); // ← cierra el DOMContentLoaded
