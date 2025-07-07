document.addEventListener('DOMContentLoaded', async function () {
  const CACHE_DURATION = 1000 * 60 * 15; // 15 minutos
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    console.warn('Slug no especificado');
    return;
  }

  function getCachedEntry(key) {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.entry;
    } catch (_) {
      localStorage.removeItem(key);
      return null;
    }
  }

  function setCachedEntry(key, entry) {
    const payload = { entry, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(payload));
  }

  const cacheKey = `blog_entry_${slug}`;
  let entry = getCachedEntry(cacheKey);

  try {
    if (!entry) {
      const url = `https://beautiful-bat-b20fd0ce9b.strapiapp.com/api/blog-entries?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=ImagenCobertura`;
      const res = await fetch(url);
      const data = await res.json();
      entry = data.data?.[0];
      if (entry) setCachedEntry(cacheKey, entry);
    }

    if (!entry) {
      console.warn('Entrada no encontrada', slug);
      document.querySelector('.preloader')?.classList.add('hide');
      return;
    }

    const e = entry.attributes || entry;
    const titulo = e.titulo || e.title || '';
    const fecha = e.FechaPublicacion || e.publishedAt || e.createdAt;
    const contenido = e.contenido || '';
    let snippet = '';
    if (Array.isArray(contenido)) {
      snippet = contenido
        .map(b => b.children?.map(c => c.text).join('') || '')
        .join(' ')
        .slice(0, 160)
        .trim();
    } else if (typeof contenido === 'string') {
      snippet = contenido
        .replace(/<[^>]+>/g, '')
        .slice(0, 160)
        .trim();
    }

    const autor = e.autor || 'Autor';
    const img = e.ImagenCobertura;
    const imageUrl = img?.data?.attributes?.url || img?.url || '';

    const titleEl = document.querySelector('.blog-entry__title');
    const dateEl = document.querySelector('.blog-entry__date');
    const snippetEl = document.querySelector('.blog-entry__snippet');
    const contentEl = document.querySelector('.blog-entry__content');
    const authorEl = document.querySelector('.blog-entry__signature');
    const imgEl = document.querySelector('.blog-entry__image');
    const article = document.querySelector('.blog-entry');

    if (titleEl) titleEl.textContent = titulo;
    if (dateEl && fecha) {
      const d = new Date(fecha);
      dateEl.textContent = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    if (snippetEl && snippet) snippetEl.textContent = snippet;
    if (contentEl) {
      if (typeof contenido === 'string') {
        contentEl.innerHTML = contenido;
      } else if (Array.isArray(contenido)) {
        contentEl.innerHTML = contenido.map(b => b.children?.map(c => c.text).join('') || '').join('<br>');
      }
    }
    if (authorEl) authorEl.textContent = `— ${autor}`;
    if (imgEl && imageUrl) imgEl.src = imageUrl;
    if (article && autor) {
      const slugAuthor = autor.toLowerCase().replace(/\s+/g, '-');
      article.dataset.author = slugAuthor;
    }

  } catch (err) {
    console.error('Error al cargar la entrada', err);
  }

  document.querySelector('.preloader')?.classList.add('hide');
});
