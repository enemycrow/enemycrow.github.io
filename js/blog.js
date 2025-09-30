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
          topico
            .split(',')
            .map(t => t.trim())
            .forEach(t => {
              if (t) {
                topicCounts[t] = (topicCounts[t] || 0) + 1;
              }
            });
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

  function resolvePostUrl(post) {
    const raw = typeof post?.url === 'string' ? post.url.trim() : '';
    if (raw) {
      if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
      if (raw.startsWith('/')) return raw;
      return `/${raw}`;
    }
    const fallbackSlug = typeof post?.slug === 'string' ? post.slug.trim() : '';
    return fallbackSlug ? `/blog/${fallbackSlug}.html` : '#';
  }

  function scrollToPosts() {
    document.querySelector('#blog-posts-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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
      const catLower = cat.toLowerCase();
      let catClass = '';
      if (catLower.includes('proceso')) catClass = 'process';
      else if (catLower.includes('fragmento')) catClass = 'fragments';
      else if (catLower.includes('anuncio')) catClass = 'announcements';
      const categoryClass = catClass ? `category-tag ${catClass}` : 'category-tag';
      categoryTag = `<span class="${categoryClass}">${cat}</span>`;
    }
    const totalReactions = 0; // placeholder, se actualizará desde Firestore
    const postLink = resolvePostUrl(post);

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
          <a href="${postLink}" class="btn btn-featured">Leer Entrada Completa</a>
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
      const res = await fetch(`/api/reactions.php?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.ok) return 0;
      const t = json.totals || {};
      return reactionFields.reduce((sum, k) => sum + (t[k] || 0), 0);
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

  // --- Helpers for deterministic daily random selection ---
  function seedFromDate(date) {
    // date: Date object
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    // simple integer seed from YYYYMMDD
    return Number(`${y}${m}${d}`) || Date.now();
  }

  // Mulberry32 PRNG
  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function seededShuffle(array, seed) {
    const a = array.slice();
    const rnd = mulberry32(seed >>> 0);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function selectDailyFeatured(posts, count, referenceDate) {
    if (!Array.isArray(posts) || posts.length === 0) return [];
    const seed = seedFromDate(referenceDate || new Date());
    const shuffled = seededShuffle(posts, seed);
    const unique = [];
    const seen = new Set();
    for (const p of shuffled) {
      const key = p && (p.id || p.slug || p.url || JSON.stringify(p));
      if (!seen.has(key)) {
        unique.push(p);
        seen.add(key);
      }
      if (unique.length >= count) break;
    }
    return unique;
  }

  // Try to avoid repeating yesterday's featured set when possible.
  function selectDailyFeaturedAvoidingYesterday(posts, count, referenceDate) {
    const today = referenceDate ? new Date(referenceDate) : new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const todaySeed = seedFromDate(today);
    const shuffledToday = seededShuffle(posts, todaySeed);
    const yesterdaySelected = selectDailyFeatured(posts, count, yesterday);
    const yesterdayKeys = new Set(yesterdaySelected.map(p => p && (p.id || p.slug || p.url || JSON.stringify(p))));

    const chosen = [];
    const chosenKeys = new Set();
    // First pass: take items not present yesterday
    for (const p of shuffledToday) {
      if (chosen.length >= count) break;
      const key = p && (p.id || p.slug || p.url || JSON.stringify(p));
      if (chosenKeys.has(key)) continue;
      if (!yesterdayKeys.has(key)) {
        chosen.push(p);
        chosenKeys.add(key);
      }
    }
    // Second pass: if not enough unique items, fill with remaining shuffled items (allow overlap)
    if (chosen.length < count) {
      for (const p of shuffledToday) {
        if (chosen.length >= count) break;
        const key = p && (p.id || p.slug || p.url || JSON.stringify(p));
        if (chosenKeys.has(key)) continue;
        chosen.push(p);
        chosenKeys.add(key);
      }
    }
    return chosen;
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
    const catRaw = Array.isArray(post.categoria_temas) && post.categoria_temas.length ? post.categoria_temas[0] : '';
    const themeSlug = catRaw ? slugify(catRaw) : 'general';
    const catClass =
      themeSlug.includes('procesos-creativos') ? 'process' :
      themeSlug.includes('fragmentos-ineditos') ? 'fragments' :
      themeSlug.includes('anuncios') ? 'announcements' :
      '';
    const categoryClass = catClass ? `category-tag ${catClass}` : 'category-tag';
    const article = document.createElement('article');
    article.className = `blog-post blog-entry blog-entry--${authorSlug} ${authorSlug} ${themeSlug} ${catClass}`;
    article.setAttribute('data-category', `${authorSlug} ${themeSlug}`);
    const totalReactions = 0; // se actualizará desde Firestore
    const postLink = resolvePostUrl(post);
    article.innerHTML = `
      <div class="blog-post__image" style="background-image:url('assets/images/blog/${post.imagen}')">
        <div class="blog-post__date">
          <span>${dayStr} ${monthStr} ${yearStr}</span>
        </div>
      </div>
      <div class="blog-post__meta">
        <span class="${categoryClass}">${catRaw}</span>
        <span class="author-tag ${authorSlug}-tag">${post.autor}</span>
      </div>
      <h2 class="blog-post__title">${post.titulo}</h2>
      <p class="blog-post__fragment">${post.fragmento}</p>
      <div class="blog-post__footer">
        <span class="meta-item"><i class="far fa-clock"></i> ${post.tiempo}</span>
        <span class="meta-item"><i class="fas fa-bolt"></i> <span class="reactions-count" data-slug="${post.slug}">${totalReactions}</span> reacciones</span>
      </div>
      <a href="${postLink}" class="blog-post__link">Leer más <span class="arrow">→</span></a>
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

    // Determina las páginas que deben mostrarse
    const pageSet = new Set([1, totalPages, currentPage]);
    if (currentPage > 1) pageSet.add(currentPage - 1);
    if (currentPage < totalPages) pageSet.add(currentPage + 1);
    const pages = Array.from(pageSet).sort((a, b) => a - b);

    // Construye el arreglo final con puntos suspensivos cuando hay saltos
    const visiblePages = [];
    let prev = 0;
    pages.forEach(p => {
      if (p - prev > 1) {
        visiblePages.push('...');
      }
      visiblePages.push(p);
      prev = p;
    });

    // Renderiza los botones y los puntos suspensivos
    paginationContainers.forEach(container => {
      container.innerHTML = '';
      visiblePages.forEach(item => {
        if (item === '...') {
          const span = document.createElement('span');
          span.className = 'ellipsis';
          span.textContent = '...';
          container.appendChild(span);
        } else {
          const btn = document.createElement('button');
          btn.className = 'page-link' + (item === currentPage ? ' active' : '');
          btn.textContent = item;
          btn.addEventListener('click', () => {
            renderPage(item);
            scrollToPosts();
          });
          container.appendChild(btn);
        }
      });
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
    const filtro = topico.trim();
    const filtered = allPosts.filter(post =>
      Array.isArray(post.topicos) &&
      post.topicos.some(t =>
        t
          .split(',')
          .map(s => s.trim())
          .includes(filtro)
      )
    );
    filteredPosts = filtered;
    renderPage(1);
  }

  fetch('posts.json')
    .then(res => res.json())
    .then(data => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const availablePosts = data.filter(post => {
        const postDate = new Date(post.fecha);
        postDate.setHours(0, 0, 0, 0);
        return !isNaN(postDate) && postDate <= today;
      });
      availablePosts.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      try {
        localStorage.setItem('postsData', JSON.stringify(availablePosts));
      } catch(e) {}
      allPosts = availablePosts;
      filteredPosts = allPosts;
      if (featuredContainer) {
        (async () => {
          // Decide how many featured slots to show. Default to 3, but can be
          // overridden by adding `data-featured-count="N"` to #featured-posts-container.
          const desired = parseInt(featuredContainer.dataset.featuredCount, 10) || 3;
          const candidatePool = allPosts.slice();

          // Try to load featured.json (generated by tools/rotate-featured.js). If present,
          // prefer it because it allows forcing/testing locally with `npm run rotate-featured`.
          try {
            const res = await fetch('featured.json', { cache: 'no-store' });
            if (res && res.ok) {
              const forced = await res.json();
              // forced is expected to be array of {id, slug}
              const forcedPosts = Array.isArray(forced)
                ? forced.map(f => candidatePool.find(p => String(p.slug) === String(f.slug) || String(p.id) === String(f.id))).filter(Boolean)
                : [];
              // Fill up to desired using daily rotator while avoiding collisions with forcedPosts
              const forcedKeys = new Set(forcedPosts.map(p => p && (p.id || p.slug)));
              const autoPool = candidatePool.filter(p => !forcedKeys.has(p.id) && !forcedKeys.has(p.slug));
              const auto = selectDailyFeaturedAvoidingYesterday(autoPool, desired - forcedPosts.length, new Date());
              const final = [...forcedPosts, ...auto].slice(0, desired);
              featuredContainer.innerHTML = final.map(crearFeaturedPost).join('');
              updateReactionCounts();
              return;
            }
          } catch (e) {
            // ignore and fall back
          }

          // fallback to date-based selection
          const todaysFeatured = selectDailyFeaturedAvoidingYesterday(candidatePool, desired, new Date());
          featuredContainer.innerHTML = todaysFeatured.length > 0 ? todaysFeatured.map(crearFeaturedPost).join('') : '';
          updateReactionCounts();
        })();
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
        scrollToPosts();
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
        scrollToPosts();
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
