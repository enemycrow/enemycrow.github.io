document.addEventListener('DOMContentLoaded', async function() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    console.warn('Slug no especificado');
    return;
  }

  try {
    const url = `https://beautiful-bat-b20fd0ce9b.strapiapp.com/api/blog-entries?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=ImagenCobertura`;
    const res = await fetch(url);
    const data = await res.json();
    const item = data.data?.[0];
    if (!item) {
      console.warn('Entrada no encontrada');
      return;
    }

    const e = item.attributes || item;
    const titulo = e.titulo || e.title || '';
    const fecha = e.FechaPublicacion || e.publishedAt || e.createdAt;
    const contenido = e.contenido || '';
    const autor = e.autor || '';
    const img = e.ImagenCobertura;
    const imageUrl = img?.data?.attributes?.url || img?.url || '';

    const titleEl = document.querySelector('.blog-entry__title');
    const dateEl = document.querySelector('.blog-entry__date');
    const contentEl = document.querySelector('.blog-entry__content');
    const authorEl = document.querySelector('.blog-entry__signature');
    const imgEl = document.querySelector('.blog-entry__image');
    const article = document.querySelector('.blog-entry');

    if (titleEl) titleEl.textContent = titulo;
    if (dateEl && fecha) {
      const d = new Date(fecha);
      dateEl.textContent = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
    }
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
});
