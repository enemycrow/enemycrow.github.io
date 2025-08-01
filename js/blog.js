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
  const featuredContainer = document.querySelector('#featured-posts-container');
  const paginationContainers = document.querySelectorAll('.pagination');
  const postsPerPage = 3;
  let currentPage = 1;
  let filteredPosts = [];
  function crearFeaturedPost(post) {
    // Formato destacado clásico
    const [year, month, day] = post.fecha.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const dayStr = fecha.getDate().toString().padStart(2, '0');
    const monthStr = fecha.toLocaleString('es-ES', { month: 'long' });
    const yearStr = fecha.getFullYear();
    let authorTag = '';
    if (post.autor === 'A.C. Elysia') {
      authorTag = '<span class="author-tag elysia-tag">A.C. Elysia</span>';
    } else if (post.autor === 'Lauren Cuervo') {
      authorTag = '<span class="author-tag lauren-tag">Lauren Cuervo</span>';
    } else if (post.autor === 'Draco Sahir') {
      authorTag = '<span class="author-tag sahir-tag">Draco Sahir</span>';
    } else {
      authorTag = `<span class="author-tag">${post.autor}</span>`;
    }
    // Si hay coautoría, puedes ajustar aquí
    let categoryTag = '';
    if (post.categoria_temas && post.categoria_temas[0]) {
      const cat = post.categoria_temas[0];
      const catClass = cat.toLowerCase().includes('proceso') ? 'process' : (cat.toLowerCase().includes('fragmento') ? 'fragments' : '');
      categoryTag = `<span class="category-tag ${catClass}">${cat}</span>`;
    }
    const totalReactions = 0; // placeholder, se actualizará desde Firestore

    const baseName = post.imagen.replace(/\.[^.]+$/, '');
    const mobileImg = window.innerWidth <= 768 ?
      `<img src="assets/images/responsive/blog/${baseName}-400.webp" srcset="assets/images/responsive/blog/${baseName}-400.webp 400w, assets/images/responsive/blog/${baseName}-800.webp 800w, assets/images/responsive/blog/${baseName}-1200.webp 1200w" sizes="(max-width: 600px) 100vw, 800px" loading="lazy" fetchpriority="low" alt="${post.titulo}">`
      : '';

    return `
      <div class="featured-post-container">
        <div class="featured-post-image" style="background-image:url('assets/images/blog/${post.imagen}')">
          ${mobileImg}
          <div class="featured-post-overlay">
            <div class="featured-post-date">
              <span class="day">${dayStr}</span>
              <span class="month">${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)}</span>
              <span class="year">${yearStr}</span>
            </div>
          </div>
        </div>
        <div class="featured-post-content">
          <div class="post-category">
            ${categoryTag}
            ${authorTag}
          </div>
          <h2 class="featured-post-title">${post.titulo}</h2>
          <p class="featured-post-excerpt">${post.fragmento}</p>
          <div class="featured-post-meta">
            <span class="meta-item"><i class="fas fa-clock"></i> ${post.tiempo}</span>
            <span class="meta-item"><i class="fas fa-bolt"></i> <span class="reactions-count" data-slug="${post.slug}">${totalReactions}</span> reacciones</span>
          </div>
          <a href="blog-entry.html?slug=${post.slug}" class="btn btn-featured">Leer Entrada Completa</a>
        </div>
      </div>
    `;
  }
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

  const reactionFields = ['toco','sumergirme','personajes','mundo','lugares'];

  async function fetchTotalReactions(slug) {
    try {
      const snap = await db.collection('reactions').doc(slug).get();
      const data = snap.exists ? snap.data() : {};
      return reactionFields.reduce((sum, key) => sum + (data[key] || 0), 0);
    } catch (err) {
      console.error('Error al obtener reacciones', err);
      return 0;
    }
  }

  function updateReactionCounts() {
    const elements = document.querySelectorAll('.reactions-count[data-slug]');
    const slugs = [...new Set(Array.from(elements).map(el => el.dataset.slug))];
    slugs.forEach(async slug => {
      const total = await fetchTotalReactions(slug);
      document.querySelectorAll(`.reactions-count[data-slug="${slug}"]`).forEach(el => {
        el.textContent = total;
      });
      try { localStorage.removeItem(`reactions_${slug}`); } catch(e) {}
    });
  }

  function crearTarjeta(post, target) {
    // ...igual que antes...
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
    const catRaw = post.categoria_temas[0] || '';
    const themeSlug = slugify(catRaw);
    const catClass =
      themeSlug.includes('procesos-creativos') ? 'process' :
      themeSlug.includes('fragmentos-ineditos') ? 'fragments' :
      '';
    const article = document.createElement('article');
    article.className = `blog-post blog-entry blog-entry--${authorSlug} ${authorSlug} ${themeSlug} ${catClass}`;
    article.setAttribute('data-category', `${authorSlug} ${themeSlug}`);
    const totalReactions = 0; // se actualizará desde Firestore
    article.innerHTML = `
      <div class="blog-post__image" style="background-image:url('assets/images/blog/${post.imagen}')">
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
        <span class="meta-item"><i class="fas fa-bolt"></i> <span class="reactions-count" data-slug="${post.slug}">${totalReactions}</span> reacciones</span>
      </div>
      <a href="blog-entry.html?slug=${post.slug}" class="blog-post__link">Leer más <span class="arrow">→</span></a>
    `;
    target.appendChild(article);
  }

  function renderPosts(posts, target) {
    if (!target) return;
    target.innerHTML = '';
    posts.forEach(post => crearTarjeta(post, target));
    updateReactionCounts();
  }

  function updatePagination() {
    if (!paginationContainers || paginationContainers.length === 0) return;
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage) || 1;
    paginationContainers.forEach(container => {
      container.innerHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-link' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', () => renderPage(i));
        container.appendChild(btn);
      }
    });
  }

  function renderPage(page) {
    currentPage = page;
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    renderPosts(filteredPosts.slice(start, end), container);
    updatePagination();
  }

  function aplicarFiltro(filter) {
    if (filter === 'all') {
      filteredPosts = allPosts;
      renderPage(1);
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
      return post && (
        authorSlug === filter ||
        themeSlug === filter ||
        (themeSlug.includes('procesos-creativos') && filter === 'process') ||
        (themeSlug.includes('fragmentos-ineditos') && filter === 'fragments')
      );
    });
    filteredPosts = filtered;
    renderPage(1);
  }

  function aplicarFiltroTopico(topico) {
    const filtered = allPosts.filter(post => Array.isArray(post.topicos) && post.topicos.includes(topico));
    filteredPosts = filtered;
    renderPage(1);
  }

  fetch('posts.json')
    .then(res => res.json())
    .then(data => {
      try {
        localStorage.setItem('postsData', JSON.stringify(data));
      } catch(e) {}
      allPosts = data;
      filteredPosts = allPosts;
      if (featuredContainer) {
        const featuredPosts = allPosts.filter(p => p.destacado);
        if (featuredPosts.length > 0) {
          featuredContainer.innerHTML = featuredPosts.map(crearFeaturedPost).join('');
        } else {
          featuredContainer.innerHTML = '';
        }
        updateReactionCounts();
      }
      renderPage(1);
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
          filteredPosts = allPosts;
          renderPage(1);
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
