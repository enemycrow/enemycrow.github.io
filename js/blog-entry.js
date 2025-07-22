document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) return;

  try {
    const res = await fetch('posts.json');
    const posts = await res.json();
    const entry = posts.find(p => p.slug === slug);
    if (!entry) return;

    const fecha = new Date(entry.fecha);
    const fechaTexto = fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const titleEl = document.getElementById('entry-title');
    const dateEl = document.getElementById('entry-date');
    const contentEl = document.getElementById('entry-content');
    const authorEl = document.getElementById('entry-author');
    const imgEl = document.getElementById('entry-image');
    const timeEl = document.getElementById('entry-time');
    const commentsEl = document.getElementById('entry-comments');
    const catEl = document.getElementById('entry-categories');

    if (titleEl) titleEl.textContent = entry.titulo;
    if (dateEl) dateEl.textContent = fechaTexto;
    if (timeEl) timeEl.textContent = entry.tiempo;
    if (commentsEl) commentsEl.textContent = `${entry.comentarios} comentarios`;
    if (contentEl) contentEl.innerHTML = entry.contenido_html;
    if (authorEl) authorEl.textContent = `— ${entry.autor}`;
    if (imgEl) imgEl.src = `assets/images/${entry.imagen}`;
    if (catEl) {
      catEl.innerHTML = entry.categoria_temas
        .map(c => `<span class="category-tag">${c}</span>`)
        .join(' ');
    }
  } catch (err) {
    console.error('Error al cargar la entrada', err);
  }
});
