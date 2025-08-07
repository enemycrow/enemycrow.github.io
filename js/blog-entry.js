// Utiliza la instancia global `db` expuesta en firebase-init.js
const { FieldValue } = firebase.firestore;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) return;

  try {
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

    const titleEl = document.getElementById('entry-title');
    const dateEl = document.getElementById('entry-date');
    const contentEl = document.getElementById('entry-content');
    const authorEl = document.getElementById('entry-author');
    const licenseEl = document.getElementById('entry-license');
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
      const catsHtml = entry.categoria_temas
        .map(c => `<span class="category-tag">${c}</span>`)
        .join(' ');
      catEl.innerHTML = catsHtml;
    }

    if (catElBlock) {
      const booksHtml = entry.categoria_libros
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

    const reactionKeys = ['toco','sumergirme','personajes','mundo','lugares'];
    const docRef = db.collection('reactions').doc(slug);
    let snap = await docRef.get();
    if (!snap.exists) {
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
