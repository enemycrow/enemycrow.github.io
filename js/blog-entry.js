// Utiliza la instancia global `db` expuesta en firebase-init.js
const { FieldValue } = firebase.firestore;

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
    const catElBlock = document.getElementById('entry-categories-block');

    if (titleEl) titleEl.textContent = entry.titulo;
    if (dateEl) dateEl.textContent = fechaTexto;
    if (timeEl) timeEl.textContent = entry.tiempo;
    if (contentEl) contentEl.innerHTML = entry.contenido_html;
    if (authorEl) authorEl.textContent = `— ${entry.autor}`;
    if (imgEl) imgEl.src = `assets/images/blog/${entry.imagen}`;
    if (catEl || catElBlock) {
      const catsHtml = entry.categoria_temas
        .map(c => `<span class="category-tag">${c}</span>`)
        .join(' ');
      if (catEl) catEl.innerHTML = catsHtml;
      if (catElBlock) catElBlock.innerHTML = catsHtml;
    }

    const reactionKeys = ['toco','sumergirme','personajes','mundo','lugares'];
    const docRef = db.collection('reactions').doc(slug);
    let snap = await docRef.get();
    if (!snap.exists()) {
      const initData = {};
      reactionKeys.forEach(k => initData[k] = 0);
      await docRef.set(initData);
      snap = await docRef.get();
    }
    let data = snap.data() || {};

    reactionKeys.forEach(key => {
      const el = document.getElementById(`reaction-${key}-count`);
      if (el) el.textContent = data[key] || 0;
    });

    const votedKey = `voted_${slug}`;
    const voted = JSON.parse(localStorage.getItem(votedKey) || '{}');

    document.querySelectorAll('.reaction').forEach(reactionEl => {
      const key = reactionEl.getAttribute('data-reaction');
      reactionEl.addEventListener('click', async () => {
        if (voted[key]) return;
        try {
          await docRef.update({ [key]: FieldValue.increment(1) });
          const snap = await docRef.get();
          const countEl = reactionEl.querySelector('.reaction-count');
          if (countEl) countEl.textContent = snap.data()[key] || 0;
          voted[key] = true;
          localStorage.setItem(votedKey, JSON.stringify(voted));
          reactionEl.classList.add('reacted');
        } catch (err) {
          console.error('Error al actualizar la reacción', err);
        }
      });
      if (voted[key]) reactionEl.classList.add('reacted');
    });

    if (commentsEl) commentsEl.style.display = 'none';
  } catch (err) {
    console.error('Error al cargar la entrada', err);
  }
});
