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
    const fecha = new Date(post.fecha);
    const day = fecha.toLocaleDateString('es-ES', { day: '2-digit' });
    const month = fecha.toLocaleDateString('es-ES', { month: 'long' });
    const year = fecha.getFullYear();
    const authorSlug = slugify(post.autor.split(' ')[0]);
    const themeSlug = post.categoria_temas[0]
      ? slugify(post.categoria_temas[0])
      : 'general';

    const article = document.createElement('article');
    article.className = `blog-post blog-entry blog-entry--${authorSlug} ${authorSlug} ${themeSlug}`;
    article.setAttribute('data-category', `${authorSlug} ${themeSlug}`);

    article.innerHTML = `
      <div class="blog-post__image" style="background-image:url('assets/images/${post.imagen}')">
        <div class="blog-post__date">
          <span class="day">${day}</span>
          <span class="month">${month}</span>
          <span class="year">${year}</span>
        </div>
      </div>
      <div class="blog-post__content">
        <div class="blog-post__header">
          <div class="blog-post__categories">
            ${post.categoria_temas
              .map(cat => `<span class="category-tag">${cat}</span>`)
              .join(' ')}
          </div>
          <div class="blog-post__author">
            <span class="author-tag ${authorSlug}-tag">${post.autor}</span>
          </div>
        </div>
        <h3 class="blog-post__title">${post.titulo}</h3>
        <p class="blog-post__excerpt">${post.fragmento}</p>
        <div class="blog-post__meta">
          <span class="meta-item"><i class="fas fa-clock"></i> ${post.tiempo}</span>
          <span class="meta-item"><i class="fas fa-comment"></i> ${post.comentarios}</span>
        </div>
        <a href="blog-entry.html?slug=${post.slug}" class="blog-post__link">Leer más <i class="fas fa-arrow-right"></i></a>
      </div>`;

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
