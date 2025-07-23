// --- Conteo de posts por tópico y actualización de la sección de tópicos ---
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('posts.json');
    const posts = await res.json();
    // Construir un mapa de conteo de tópicos
    const topicCounts = {};
    posts.forEach(post => {
      if (Array.isArray(post.topicos)) {
        post.topicos.forEach(topico => {
          topicCounts[topico] = (topicCounts[topico] || 0) + 1;
        });
      }
    });
    // Actualizar los contadores en la sección de tópicos
    document.querySelectorAll('.topics-grid .topic-item').forEach(topicEl => {
      const h3 = topicEl.querySelector('h3');
      const countEl = topicEl.querySelector('.topic-count');
      if (h3 && countEl) {
        const nombre = h3.textContent.trim();
        const count = topicCounts[nombre] || 0;
        countEl.textContent = `${count} entrada${count === 1 ? '' : 's'}`;
      }
    });
  } catch (err) {
    // Silenciar error si no hay posts.json o estructura inesperada
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('#blog-posts-grid');
  const featuredContainer = document.querySelector('#featured-posts-grid');
  const filterBtns = document.querySelectorAll('.blog-filter__button');
  const topicItems = document.querySelectorAll('.topics-grid .topic-item');
  let allPosts = [];

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function crearTarjeta(post, target) {
    // ...igual que antes...
    const visitKey = `visits_${post.slug}`;
    let visits = parseInt(localStorage.getItem(visitKey) || '0', 10);
    const [year, month, day] = post.fecha.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const dayStr = fecha.getDate().toString().padStart(2, '0');
    const monthStr = fecha.toLocaleString('es-ES', { month: 'long' });
    const yearStr = fecha.getFullYear();
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
    target.appendChild(article);
  }

  function renderPosts(posts, target) {
    if (!target) return;
    target.innerHTML = '';
    posts.forEach(post => crearTarjeta(post, target));
  }

  function aplicarFiltro(filter) {
    if (filter === 'all') {
      renderPosts(allPosts, container);
      return;
    }
    // Filtro por autor/categoría (clase)
    const filtered = allPosts.filter(post => {
      let authorSlug;
      if (post.autor === 'A.C. Elysia') authorSlug = 'elysia';
      else if (post.autor === 'Lauren Cuervo') authorSlug = 'lauren';
      else if (post.autor === 'Draco Sahir') authorSlug = 'sahir';
      else authorSlug = slugify(post.autor.split(' ')[0]);
      const themeSlug = post.categoria_temas[0] ? slugify(post.categoria_temas[0]) : 'general';
      return post && (authorSlug === filter || themeSlug === filter);
    });
    renderPosts(filtered, container);
  }

  function aplicarFiltroTopico(topico) {
    const filtered = allPosts.filter(post => Array.isArray(post.topicos) && post.topicos.includes(topico));
    renderPosts(filtered, container);
  }

  fetch('posts.json')
    .then(res => res.json())
    .then(data => {
      allPosts = data;
      if (featuredContainer) {
        const featured = allPosts.filter(p => p.destacado);
        renderPosts(featured, featuredContainer);
      }
      renderPosts(allPosts, container);
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

  // Filtro por tópico al hacer clic en un topic-item
  if (topicItems.length > 0) {
    topicItems.forEach(item => {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        const isActive = this.classList.contains('active');
        // Quitar selección previa
        topicItems.forEach(i => i.classList.remove('active'));
        // Quitar selección de los filtros de arriba
        filterBtns.forEach(b => b.classList.remove('active'));
        if (isActive) {
          // Si ya estaba activo, quitar filtro y mostrar todos
          renderPosts(allPosts, container);
        } else {
          this.classList.add('active');
          const h3 = this.querySelector('h3');
          if (h3) {
            aplicarFiltroTopico(h3.textContent.trim());
          }
        }
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
