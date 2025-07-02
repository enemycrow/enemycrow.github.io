document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('#blog-posts-grid');
  const filterBtns = document.querySelectorAll('.blog-filter__button');
  const paginationEl = document.querySelector('.pagination');
  let currentPage = 1;
  const pageSize = 6;
  let totalPages = 1;

  // Verificar si el contenedor existe
  async function cargarEntradas(page = 1) {
    if (!container) {
      console.warn('⚠️ No se encontró el contenedor #blog-posts-grid');
      return;
    }

    container.innerHTML = '';

    try {
      currentPage = page;
      const url = `https://beautiful-bat-b20fd0ce9b.strapiapp.com/api/blog-entries?populate=ImagenCobertura&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
      const res = await fetch(url);
      const data = await res.json();
      const entries = data.data || [];
      const meta = data.meta?.pagination || {};
      totalPages = meta.pageCount || 1;

      entries.forEach(item => {
        const entry = { ...item, ...(item.attributes || {}) };
        const slug = entry.slug || '';
        const titulo = entry.titulo || '';
        const autor = entry.autor || 'Autor';
        const fecha = entry.FechaPublicacion || entry.publishedAt || entry.createdAt;
        const img = entry.ImagenCobertura;
        const imageUrl =
          img?.formats?.medium?.url ||
          img?.url ||
          // Fallback to old nested structure for backward compatibility
          img?.data?.attributes?.formats?.medium?.url ||
          img?.data?.attributes?.url || '';
        const resumenRaw = entry.resumen || '';

      // Extraer texto plano del resumen
      let resumen = '';
      if (Array.isArray(resumenRaw)) {
        resumen = resumenRaw
          .map(b => b.children?.map(c => c.text).join('') || '')
          .join(' ');
      } else if (typeof resumenRaw === 'string') {
        resumen = resumenRaw;
      }
      
        const dateObj = fecha ? new Date(fecha) : new Date();
        const day = dateObj.toLocaleDateString('es-CL', { day: '2-digit' });
        const month = dateObj.toLocaleDateString('es-CL', { month: 'long' });
        const authorSlug = autor.toLowerCase().replace(/\s+/g, '-');

        const article = document.createElement('article');
        article.classList.add('blog-post', `blog-post--${authorSlug}`);
        article.setAttribute('data-category', authorSlug);

        article.innerHTML = `
          <div class="blog-post__image"${imageUrl ? ` style="background-image:url('${imageUrl}')"` : ''}>
            <div class="blog-post__date">
              <span class="day">${day}</span>
              <span class="month">${month}</span>
            </div>
          </div>
          <div class="blog-post__content">
            <div class="blog-post__header">
              <div class="blog-post__author">
                <span class="author-tag ${authorSlug}-tag">${autor}</span>
              </div>
            </div>
            <h3 class="blog-post__title">${titulo}</h3>
            <p class="blog-post__excerpt">${resumen}</p>
            <a href="templates/blog-entry.html?slug=${slug}" class="blog-post__link">Leer más <i class="fas fa-arrow-right"></i></a>
          </div>`;

        container.appendChild(article);
      });

      actualizarPaginacion();
    } catch (error) {
      console.error('❌ Error al cargar entradas:', error);
    }
  }

  function actualizarPaginacion() {
    if (!paginationEl) return;
    paginationEl.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      const link = document.createElement('a');
      link.href = '#';
      link.className = 'page-link';
      link.textContent = i;
      if (i === currentPage) link.classList.add('active');
      paginationEl.appendChild(link);
    }

    if (currentPage < totalPages) {
      const next = document.createElement('a');
      next.href = '#';
      next.className = 'page-next';
      next.innerHTML = '<i class="fas fa-chevron-right"></i>';
      paginationEl.appendChild(next);
    }
  }

  cargarEntradas();

  // Filtro
  function aplicarFiltro(filter) {
    const posts = document.querySelectorAll('.blog-post');
    posts.forEach(post => {
      if (filter === 'all' || post.classList.contains(`blog-post--${filter}`)) {
        post.style.display = 'flex';
      } else {
        post.style.display = 'none';
      }
    });
  }

  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        aplicarFiltro(this.getAttribute('data-filter'));
      });
    });
  }

  // Animación al hacer scroll
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

  // Formulario de suscripción
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

  // Paginación
  if (paginationEl) {
    paginationEl.addEventListener('click', function (e) {
      const link = e.target.closest('.page-link');
      const next = e.target.closest('.page-next');
      if (!link && !next) return;

      e.preventDefault();
      let page = currentPage;
      if (link) {
        page = parseInt(link.textContent, 10) || 1;
      } else if (next) {
        page = Math.min(currentPage + 1, totalPages);
      }

      if (page !== currentPage) {
        cargarEntradas(page).then(() => {
          const activeFilter = document.querySelector('.blog-filter__button.active')?.getAttribute('data-filter') || 'all';
          aplicarFiltro(activeFilter);
        });
      }
    });
  }
});
