document.addEventListener('DOMContentLoaded', async function() {
  const container = document.querySelector('#blog-posts-grid');
  const filterBtns = document.querySelectorAll('.blog-filter__button');

  // Función para cargar desde Strapi
  async function cargarEntradas() {
    try {
      const res = await fetch("https://beautiful-bat-b20fd0ce9b.strapiapp.com/api/blog-entries?populate=ImagenCobertura");
      const data = await res.json();
      const entries = data.data;

      if (!container) {
        console.warn("⚠️ No se encontró el contenedor #blog-posts-grid");
        return;
      }

      entries.forEach(entry => {
        const attrs = entry.attributes;
        const {
          titulo,
          autor,
          contenido,
          ImagenCobertura,
          FechaPublicacion,
          resumen,
          slug,
          tema
        } = attrs;

        // Convertir contenido tipográfico a HTML simple
        let contenidoHtml = '';
        if (Array.isArray(contenido)) {
          contenidoHtml = contenido
            .map(block => block.children?.map(child => child.text).join('') || '')
            .join('<br><br>');
        }

        // Imagen de cobertura
        const imageUrl = ImagenCobertura?.data?.attributes?.formats?.medium?.url ||
                         ImagenCobertura?.data?.attributes?.formats?.small?.url ||
                         ImagenCobertura?.data?.attributes?.url || '';

        // Crear elemento de entrada
        const article = document.createElement('article');
        article.classList.add('blog-post', `blog-post--${autor?.toLowerCase().replace(/\s+/g, '-') || 'otros'}`);

        article.innerHTML = `
          <h2 class="blog-entry__title">${titulo}</h2>
          <p class="blog-entry__date">${new Date(FechaPublicacion).toLocaleDateString('es-CL')}</p>
          ${imageUrl ? `<img src="${imageUrl}" alt="${titulo}" class="blog-entry__image" />` : ''}
          <p class="blog-entry__resumen">${getTextFromRichText(resumen)}</p>
          <a href="entrada.html?slug=${slug}" class="blog-entry__leer-mas">Leer entrada completa</a>
          <p class="blog-entry__signature">— ${autor || 'Autor desconocido'}</p>
        `;

        container.appendChild(article);
      });
    } catch (error) {
      console.error("❌ Error al cargar entradas:", error);
    }
  }

  // Extraer texto plano de bloques tipo `rich text`
  function getTextFromRichText(blocks) {
    if (!Array.isArray(blocks)) return '';
    return blocks.map(b => b.children?.map(c => c.text).join('') || '').join(' ');
  }

  await cargarEntradas();

  // Filtro por autor o tema
  const blogPosts = document.querySelectorAll('.blog-post');
  if (filterBtns.length > 0 && blogPosts.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const filter = this.getAttribute('data-filter');

        blogPosts.forEach(post => {
          if (filter === 'all' || post.classList.contains(`blog-post--${filter}`)) {
            post.style.display = 'flex';
          } else {
            post.style.display = 'none';
          }
        });
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
        document.querySelectorAll('.page-link').forEach(l => l.classList.remove('active'));
        if (this.classList.contains('page-link')) {
          this.classList.add('active');
        }
      });
    });
  }
});
