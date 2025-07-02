document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('#blog-posts-grid');
  const filterBtns = document.querySelectorAll('.blog-filter__button');

  async function cargarEntradas(page = 1) {
    if (!container) {
      console.warn('⚠️ No se encontró el contenedor #blog-posts-grid');
      return;
    }

    container.innerHTML = '';

    try {
      const url = `https://beautiful-bat-b20fd0ce9b.strapiapp.com/api/blog-entries?populate=ImagenCobertura&pagination[page]=${page}`;
      const res = await fetch(url);
      const data = await res.json();
      const entries = data.data || [];

      entries.forEach(item => {
        const e = item.attributes || item;
        const titulo = e.titulo || e.title || '';
        const slug = e.slug || item.slug || '';
        const autor = e.autor || 'Autor';
        const fecha = e.FechaPublicacion || e.publishedAt || e.createdAt;
        const img = e.ImagenCobertura;
        const imageUrl = img?.data?.attributes?.url || img?.url || '';
        const contenido = e.contenido || '';

        let text = '';
        if (Array.isArray(contenido)) {
          text = contenido.map(b => b.children?.map(c => c.text).join('') || '').join(' ');
        } else if (typeof contenido === 'string') {
          text = contenido;
        }

        const resumen = e.resumen || text.split(' ').slice(0, 30).join(' ') + (text.split(' ').length > 30 ? '...' : '');

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
    } catch (error) {
      console.error('❌ Error al cargar entradas:', error);
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
  const pageLinks = document.querySelectorAll('.page-link, .page-next');
  if (pageLinks.length > 0) {
    pageLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();

        let page = 1;
        if (this.classList.contains('page-link')) {
          document.querySelectorAll('.page-link').forEach(l => l.classList.remove('active'));
          this.classList.add('active');
          page = parseInt(this.textContent, 10) || 1;
        } else {
          const current = document.querySelector('.page-link.active');
          page = (parseInt(current?.textContent, 10) || 1) + 1;
          const nextLink = Array.from(document.querySelectorAll('.page-link')).find(l => parseInt(l.textContent, 10) === page);
          if (nextLink) {
            current.classList.remove('active');
            nextLink.classList.add('active');
          }
        }

        cargarEntradas(page).then(() => {
          const activeFilter = document.querySelector('.blog-filter__button.active')?.getAttribute('data-filter') || 'all';
          aplicarFiltro(activeFilter);
        });
      });
    });
  }
});
