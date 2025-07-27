import { db } from './firebase-init.js';
import { doc, getDoc, setDoc, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';

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
    const visitsEl = document.getElementById('entry-visits-count');

    if (titleEl) titleEl.textContent = entry.titulo;
    if (dateEl) dateEl.textContent = fechaTexto;
    if (timeEl) timeEl.textContent = entry.tiempo;
    if (contentEl) contentEl.innerHTML = entry.contenido_html;
    if (authorEl) authorEl.textContent = `— ${entry.autor}`;
    if (imgEl) imgEl.src = `assets/images/blog/${entry.imagen}`;
    if (catEl) {
      catEl.innerHTML = entry.categoria_temas
        .map(c => `<span class="category-tag">${c}</span>`)
        .join(' ');
    }

    const reactionKeys = ['toco','sumergirme','personajes','mundo','lugares'];
    const docRef = doc(db, 'reactions', slug);
    let snap = await getDoc(docRef);
    if (!snap.exists()) {
      const initData = { visits: 0 };
      reactionKeys.forEach(k => initData[k] = 0);
      await setDoc(docRef, initData);
      snap = await getDoc(docRef);
    }
    let data = snap.data() || {};

    reactionKeys.forEach(key => {
      const el = document.getElementById(`reaction-${key}-count`);
      if (el) el.textContent = data[key] || 0;
    });
    if (visitsEl) visitsEl.textContent = data.visits || 0;

    await updateDoc(docRef, { visits: increment(1) });
    data = (await getDoc(docRef)).data();
    if (visitsEl) visitsEl.textContent = data.visits || 0;

    const votedKey = `voted_${slug}`;
    const voted = JSON.parse(localStorage.getItem(votedKey) || '{}');

    document.querySelectorAll('.reaction').forEach(reactionEl => {
      const key = reactionEl.getAttribute('data-reaction');
      reactionEl.addEventListener('click', async () => {
        try {
          const change = voted[key] ? -1 : 1;
          await updateDoc(docRef, { [key]: increment(change) });
          const snap = await getDoc(docRef);
          const countEl = reactionEl.querySelector('.reaction-count');
          if (countEl) countEl.textContent = snap.data()[key] || 0;
          voted[key] = !voted[key];
          localStorage.setItem(votedKey, JSON.stringify(voted));
          reactionEl.classList.toggle('reacted', voted[key]);
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
