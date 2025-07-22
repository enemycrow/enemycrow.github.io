document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  // --- Contador de visitas por entrada ---
  if (slug) {
    const visitKey = `visits_${slug}`;
    let visits = parseInt(localStorage.getItem(visitKey) || '0', 10);
    visits++;
    localStorage.setItem(visitKey, visits);
  }
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
    if (contentEl) contentEl.innerHTML = entry.contenido_html;
    if (authorEl) authorEl.textContent = `— ${entry.autor}`;
    if (imgEl) imgEl.src = `assets/images/${entry.imagen}`;
    if (catEl) {
      catEl.innerHTML = entry.categoria_temas
        .map(c => `<span class="category-tag">${c}</span>`)
        .join(' ');
    }

    // Mostrar contador de visitas en la entrada
    const visitKey = `visits_${slug}`;
    let visits = parseInt(localStorage.getItem(visitKey) || '0', 10);
    const visitsEl = document.getElementById('entry-visits-count');
    if (visitsEl) visitsEl.textContent = visits;

    // --- Lógica de reacciones ---
    const reactionKeys = [
      'toco',
      'sumergirme',
      'personajes',
      'mundo',
      'lugares'
    ];
    // Cargar contadores desde localStorage (por entrada)
    const storageKey = `reactions_${entry.slug}`;
    let reactionCounts = JSON.parse(localStorage.getItem(storageKey) || '{}');
    // Inicializar si no existen
    reactionKeys.forEach(key => {
      if (typeof reactionCounts[key] !== 'number') reactionCounts[key] = 0;
    });
    // Mostrar contadores
    reactionKeys.forEach(key => {
      const el = document.getElementById(`reaction-${key}-count`);
      if (el) el.textContent = reactionCounts[key];
    });
    // Control de votos por usuario (solo uno por reacción por entrada)
    const votedKey = `voted_${entry.slug}`;
    let voted = JSON.parse(localStorage.getItem(votedKey) || '{}');
    // Evento click en cada reacción
    document.querySelectorAll('.reaction').forEach(reactionEl => {
      const key = reactionEl.getAttribute('data-reaction');
      reactionEl.addEventListener('click', () => {
        if (voted[key]) {
          // Deseleccionar: resta y elimina voto
          if (reactionCounts[key] > 0) reactionCounts[key]--;
          voted[key] = false;
          localStorage.setItem(storageKey, JSON.stringify(reactionCounts));
          localStorage.setItem(votedKey, JSON.stringify(voted));
          const countEl = reactionEl.querySelector('.reaction-count');
          if (countEl) countEl.textContent = reactionCounts[key];
          reactionEl.classList.remove('reacted');
        } else {
          // Seleccionar: suma y guarda voto
          reactionCounts[key]++;
          voted[key] = true;
          localStorage.setItem(storageKey, JSON.stringify(reactionCounts));
          localStorage.setItem(votedKey, JSON.stringify(voted));
          const countEl = reactionEl.querySelector('.reaction-count');
          if (countEl) countEl.textContent = reactionCounts[key];
          reactionEl.classList.add('reacted');
        }
      });
      // Visual feedback si ya votó
      if (voted[key]) reactionEl.classList.add('reacted');
    });
    // Oculta comentarios
    if (commentsEl) commentsEl.style.display = 'none';
  } catch (err) {
    console.error('Error al cargar la entrada', err);
  }
});
