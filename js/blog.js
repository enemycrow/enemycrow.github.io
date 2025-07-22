document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('#blog-posts-grid');
  const filterBtns = document.querySelectorAll('.blog-filter__button');

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function crearTarjeta(post) {
    // Contador de visitas por entrada
    const visitKey = `visits_${post.slug}`;
    let visits = parseInt(localStorage.getItem(visitKey) || '0', 10);
    // Corrige la fecha para evitar desfase por zona horaria
    const [year, month, day] = post.fecha.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const dayStr = fecha.getDate().toString().padStart(2, '0');
    const monthStr = fecha.toLocaleString('es-ES', { month: 'long' });
    const yearStr = fecha.getFullYear();
    
    // Mapeo especial para autores con slugs personalizados
    let authorSlug;
    if (post.autor === 'A.C. Elysia') {
      authorSlug = 'elysia';
    } else if (post.autor === 'Lauren Cuervo') {
      authorSlug = 'lauren';
    } else if (post.autor === 'Draco Sahir') {
      authorSlug = 'sahir';
    } else {
      authorSlug = slugify(post.autor.split(' ')[0]);
    }
    const themeSlug = post.categoria_temas[0]
      ? slugify(post.categoria_temas[0])
      : 'general';

    const article = document.createElement('article');
    article.className = `blog-post blog-entry blog-entry--${authorSlug} ${authorSlug} ${themeSlug}`;
    article.setAttribute('data-category', `${authorSlug} ${themeSlug}`);

    // Obtener suma total de reacciones desde localStorage
    const reactionKeys = ['toco','sumergirme','personajes','mundo','lugares'];
    const storageKey = `reactions_${post.slug}`;
    let reactionCounts = JSON.parse(localStorage.getItem(storageKey) || '{}');
    let totalReactions = reactionKeys.reduce((sum, key) => sum + (reactionCounts[key] || 0), 0);

    article.innerHTML = `
      <div class="blog-post__image" style="background-image:url('assets/images/${post.imagen}')">
        <div class="blog-post__date">
          <span>${dayStr} ${monthStr} ${yearStr}</span>
        </div>
      </div>
      <div class="blog-post__meta">
        <span class="category-tag">${post.categoria_temas[0] || ''}</span>
        <span class="author-tag ${authorSlug}-tag">${post.autor}</span>
      </div>
      <h2 class="blog-post__title">${post.titulo}</h2>
      <p class="blog-post__fragment">${post.fragmento}</p>
      <div class="blog-post__footer">
        <span class="meta-item"><i class="far fa-clock"></i> ${post.tiempo}</span>
        <span class="meta-item"><i class="fas fa-bolt"></i> ${totalReactions} reacciones</span>
        <span class="meta-item"><i class="far fa-eye"></i> ${visits} visitas</span>
      </div>
      <a href="blog-entry.html?slug=${post.slug}" class="blog-post__link">Leer más <span class="arrow">→</span></a>
    `;

    container.appendChild(article);
  }

  function aplicarFiltro(filter) {
    const posts = document.querySelectorAll('.blog-post');
    posts.forEach(post => {
      if (filter === 'all' || post.classList.contains(filter)) {
        post.style.display = 'flex';
      } else {
        post.style.display = 'none';
      }
    });
  }

  fetch('posts.json')
    .then(res => res.json())
    .then(data => {
      data.forEach(crearTarjeta);
      const active = document.querySelector('.blog-filter__button.active');
      if (active) aplicarFiltro(active.getAttribute('data-filter'));
    })
    .catch(err => console.error('Error al cargar posts.json', err));

  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        aplicarFiltro(this.getAttribute('data-filter'));
      });
    });
  }

  const subscribeForm = document.querySelector('.subscribe-form');
  if (subscribeForm) {
    subscribeForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = this.querySelector('input[type="email"]').value;
      if (email) {
        alert('¡Gracias por suscribirte! Pronto recibirás noticias sobre nuevas entradas en el diario de creación.');
        this.reset();
      }
    });
  }

  const animateOnScroll = function () {
    const elements = document.querySelectorAll('.blog-post, .topic-item');
    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.2;
      if (elementPosition < screenPosition) {
        element.classList.add('fade-in');
      }
    });
  };
  animateOnScroll();
  window.addEventListener('scroll', animateOnScroll);
});
