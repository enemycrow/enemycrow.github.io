// JavaScript para la pagina de Obras y Portafolio
const getTrustedTypesPolicy = () => {
  if (!window.trustedTypes) return null;
  if (window.__trustedTypesPolicy) return window.__trustedTypesPolicy;
  try {
    window.__trustedTypesPolicy = window.trustedTypes.createPolicy('default', {
      createHTML: (input) => input,
      createScriptURL: (input) => input
    });
  } catch (error) {
    window.__trustedTypesPolicy = null;
  }
  return window.__trustedTypesPolicy;
};

const toTrustedHTML = (html) => {
  const policy = getTrustedTypesPolicy();
  return policy ? policy.createHTML(String(html)) : String(html);
};
const FEATURED_META = {
  'faro-de-elysia': {
    format: 'Experiencia interactiva',
    timeline: '2024',
    ctaLabel: 'Jugar ahora'
  },
  'el-jesuita-del-vino': {
    format: 'Novela',
    timeline: '2024-2025'
  },
  'entre-amores-y-abismos': {
    format: 'Novela erotica',
    timeline: '2024-2025'
  },
  'el-valeroso-viaje-de-galactique-y-galactiquito': {
    format: 'Relato ilustrado',
    timeline: '2025'
  },
  'izel-itzel': {
    format: 'Saga fantastica',
    timeline: 'En desarrollo desde 2025'
  },
  'hijas-del-martillo': {
    format: 'Saga oscura',
    timeline: 'En desarrollo desde 2025'
  },
  'el-huevo-que-volvio-a-cantar': {
    format: 'Cuento ilustrado',
    timeline: '2025'
  },
  'efecto-dilacion-temporal': {
    format: 'Saga de ciencia ficcion',
    timeline: '2012-2013 / 2019 (rescritura)'
  },
  'el-libro-de-la-fusion': {
    format: 'Saga transmedia',
    timeline: 'En desarrollo desde 2024'
  },
  'cristalito-el-potrillo-de-cristal': {
    format: 'Cuento infantil ilustrado',
    timeline: 'Por anunciar'
  },
  'tarot-del-cuervo-y-elysia': {
    format: 'Tarot ilustrado',
    timeline: 'En desarrollo desde 2025'
  },
  'el-linaje-de-los-seis-petalos': {
    format: 'Libro-arte digital',
    timeline: '2025'
  },
  'la-casa-traverso': {
    format: 'Saga militar',
    timeline: 'Por anunciar'
  },
  'el-mundo-de-los-veus': {
    format: 'Distopia lirica',
    timeline: 'En desarrollo desde 2025'
  },
  'la-reversion-de-las-divinidades': {
    format: 'Bilogia epica',
    timeline: '2011-2012 / 2019 (rescritura)'
  },
  'circulo-en-la-arena': {
    format: 'Cuento ritual',
    timeline: '2025'
  },
  'debacle-triangular': {
    format: 'Space opera',
    timeline: 'Por anunciar'
  },
  'la-reina-de-los-bribones': {
    format: 'Novela urbana',
    timeline: 'Por anunciar'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const featuredGrid = document.querySelector('.portfolio-grid--featured');
  const catalogItems = Array.from(document.querySelectorAll('.portfolio-grid--catalog .portfolio-item--catalog'));
  const worksData = buildWorksData(catalogItems);

  if (featuredGrid && worksData.length > 0) {
    await renderFeaturedWorks(featuredGrid, worksData);
  }

  setupFilters();
  setupModals();
  setupScrollAnimations();
});

function buildWorksData(items) {
  return items
    .map(item => {
      const titleEl = item.querySelector('h3');
      const descriptionEl = item.querySelector('p');
      const imageEl = item.querySelector('.portfolio-item__image');
      const linkEl = item.querySelector('a');
      const tags = Array.from(item.querySelectorAll('.portfolio-item__tag')).map(tag => ({
        text: tag.textContent.trim(),
        className: tag.className
      }));
      const title = titleEl ? titleEl.textContent.trim() : '';
      const slug = slugify(title);
      if (!slug) return null;
      const meta = FEATURED_META[slug] || {};
      const href = linkEl ? linkEl.getAttribute('href') || '#' : '#';
      const labelFromLink = linkEl ? linkEl.textContent.replace(/\s+/g, ' ').trim() : '';
      return {
        slug,
        title,
        description: descriptionEl ? descriptionEl.textContent.trim() : '',
        category: item.getAttribute('data-category') || '',
        extraClasses: Array.from(item.classList).filter(cls => !['portfolio-item', 'portfolio-item--catalog'].includes(cls)),
        imageClass: imageEl ? Array.from(imageEl.classList).filter(cls => cls !== 'portfolio-item__image').join(' ') : '',
        tags,
        cta: {
          href,
          label: meta.ctaLabel || labelFromLink || 'Ver mas',
          isModal: href.startsWith('#'),
          target: linkEl ? linkEl.getAttribute('target') : null,
          rel: linkEl ? linkEl.getAttribute('rel') : null
        },
        meta: {
          format: meta.format || '',
          timeline: meta.timeline || ''
        },
        exclude: item.dataset.featuredExclude === 'true'
      };
    })
    .filter(Boolean);
}

async function renderFeaturedWorks(container, works) {
  const desiredCount = parseInt(container.dataset.featuredCount, 10) || 3;
  const featuredSource = container.dataset.featuredSource;
  const candidates = works.filter(work => !work.exclude);
  if (!candidates.length) {
    container.innerHTML = toTrustedHTML('');
    return;
  }

  const today = new Date();
  let selection = [];

  if (featuredSource) {
    try {
      const res = await fetch(featuredSource, { cache: 'no-store' });
      if (res && res.ok) {
        const forcedList = await res.json();
        const forcedWorks = Array.isArray(forcedList)
          ? forcedList
              .map(entry => resolveForcedWork(entry, candidates))
              .filter(Boolean)
          : [];
        const forcedSet = new Set(forcedWorks.map(work => work.slug));
        const pool = candidates.filter(work => !forcedSet.has(work.slug));
        const auto = selectDailyWorksAvoidingYesterday(pool, desiredCount - forcedWorks.length, today);
        selection = [...forcedWorks, ...auto].slice(0, desiredCount);
      }
    } catch (err) {
      // Ignorar errores y usar el rotador automatico
    }
  }

  if (!selection.length) {
    selection = selectDailyWorksAvoidingYesterday(candidates, desiredCount, today);
  }

  container.innerHTML = toTrustedHTML(selection.map(renderWorkCard).join(''));
}

function resolveForcedWork(entry, candidates) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    const slug = slugify(entry);
    return candidates.find(work => work.slug === slug) || null;
  }
  if (typeof entry === 'object') {
    const slug = entry.slug ? String(entry.slug) : slugify(String(entry.title || ''));
    return candidates.find(work => work.slug === slug) || null;
  }
  return null;
}

function renderWorkCard(work) {
  const classList = ['portfolio-item', 'portfolio-item--featured', ...work.extraClasses];
  const imageClasses = ['portfolio-item__image'];
  if (work.imageClass) imageClasses.push(work.imageClass);
  const metaItems = [];
  if (work.meta.format) {
    metaItems.push(`<span class="meta-item"><i class="fas fa-book"></i> ${work.meta.format}</span>`);
  }
  if (work.meta.timeline) {
    metaItems.push(`<span class="meta-item"><i class="fas fa-calendar-alt"></i> ${work.meta.timeline}</span>`);
  }
  const metaBlock = metaItems.length
    ? `<div class="portfolio-item__meta">
            ${metaItems.join(' ')}
        </div>`
    : '';
  const ctaClasses = ['btn', 'btn-featured'];
  if (work.cta.isModal) ctaClasses.push('open-modal');
  const targetAttr = work.cta.target ? ` target="${work.cta.target}"` : '';
  const relAttr = work.cta.rel ? ` rel="${work.cta.rel}"` : '';
  const tagsMarkup = work.tags.length
    ? work.tags.map(tag => `<span class="${tag.className}">${tag.text}</span>`).join('')
    : '';
  const dataAttr = work.category ? ` data-category="${work.category}"` : '';
  return `<div class="${classList.join(' ')}"${dataAttr}>
        <div class="${imageClasses.join(' ')}">
            <div class="portfolio-item__overlay">
                <div class="portfolio-item__category">
                    ${tagsMarkup}
                </div>
            </div>
        </div>
        <div class="portfolio-item__content">
            <h3>${work.title}</h3>
            <p class="portfolio-item__description">${work.description}</p>
            ${metaBlock}
            <a href="${work.cta.href}" class="${ctaClasses.join(' ')}"${targetAttr}${relAttr}>${work.cta.label}</a>
        </div>
    </div>`;
}

function setupFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const filter = this.getAttribute('data-filter');
      const items = document.querySelectorAll('.portfolio-item--featured, .portfolio-item--catalog');

      items.forEach(item => {
        if (filter === 'all') {
          item.style.display = 'block';
          return;
        }
        item.style.display = item.classList.contains(filter) ? 'block' : 'none';
      });

      const worksSection = document.querySelector('.featured-works');
      if (worksSection) {
        worksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function setupModals() {
  const modalLinks = document.querySelectorAll('.open-modal');
  if (!modalLinks.length) return;

  modalLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      const href = this.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      event.preventDefault();
      const modalId = href.substring(1);
      const modal = document.getElementById(modalId);
      if (!modal) return;

      const banners = modal.querySelectorAll('.modal-banner');
      const baseName = modalId.replace('-modal', '');
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      const smallPortrait = isPortrait && window.matchMedia('(max-width: 600px)').matches;
      const smallLandscape = !isPortrait && window.matchMedia('(max-width: 500px)').matches;

      banners.forEach(banner => {
        const side = banner.classList.contains('modal-banner-left') ? 'left' : 'right';
        const dataImg = banner.getAttribute('data-image');
        const basePath = dataImg ? dataImg.replace(/\.[^/.]+$/, '') : `assets/images/banners/${baseName}-${side}`;
        const responsiveBase = basePath.replace('/banners/', '/responsive/banners/');
        const dpr = window.devicePixelRatio || 1;
        const img400 = `${responsiveBase}-400.webp`;
        const img800 = `${responsiveBase}-800.webp`;
        const img1200 = `${responsiveBase}-1200.webp`;
        const imgOriginal = `${basePath}.webp`;

        let imgPath = imgOriginal;
        let imgSet = `image-set(url(${img400}) 1x, url(${img800}) 2x)`;

        if (smallPortrait) {
          imgPath = dpr > 1 ? img800 : img400;
          imgSet = `image-set(url(${img400}) 1x, url(${img800}) 2x)`;
        } else if (smallLandscape) {
          imgPath = dpr > 1 ? img1200 : img800;
          imgSet = `image-set(url(${img800}) 1x, url(${img1200}) 2x)`;
        } else {
          imgPath = dpr > 1 ? imgOriginal : img1200;
          imgSet = `image-set(url(${img1200}) 1x, url(${imgOriginal}) 2x)`;
        }

        const testImg = new Image();
        testImg.src = imgPath;
        testImg.onload = () => {
          const supportsImageSet = CSS.supports('background-image', imgSet);
          banner.style.backgroundImage = supportsImageSet ? imgSet : `url(${imgPath})`;
        };
        testImg.onerror = () => {
          banner.style.backgroundImage = `url(${imgOriginal})`;
        };
      });

      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    });
  });

  const closeButtons = document.querySelectorAll('.close-modal, [data-close-modal]');
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (!modal) return;
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    });
  });

  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.addEventListener('click', function(event) {
      if (event.target === this) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });
  });

  document.addEventListener('keydown', function(event) {
    if (event.key !== 'Escape') return;
    modals.forEach(modal => {
      if (modal.style.display === 'block') {
        modal.style.display = 'none';
      }
    });
    document.body.style.overflow = 'auto';
  });
}

function setupScrollAnimations() {
  const animate = () => {
    const elements = document.querySelectorAll('.portfolio-item--featured, .portfolio-item--catalog, .symbolic-item, .upcoming-project');
    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.2;
      if (elementPosition < screenPosition) {
        element.classList.add('fade-in');
      }
    });
  };

  animate();
  window.addEventListener('scroll', animate);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function seedFromDate(date) {
  const target = date instanceof Date ? date : new Date(date);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return Number(`${y}${m}${d}`) || Date.now();
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function seededShuffle(array, seed) {
  const clone = array.slice();
  const rnd = mulberry32(seed >>> 0);
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function selectDailyWorks(works, count, referenceDate) {
  if (!Array.isArray(works) || works.length === 0 || count <= 0) return [];
  const seed = seedFromDate(referenceDate || new Date());
  const shuffled = seededShuffle(works, seed);
  const unique = [];
  const seen = new Set();
  for (const work of shuffled) {
    if (!work) continue;
    const key = work.slug;
    if (!key || seen.has(key)) continue;
    unique.push(work);
    seen.add(key);
    if (unique.length >= count) break;
  }
  return unique;
}

function selectDailyWorksAvoidingYesterday(works, count, referenceDate) {
  if (!Array.isArray(works) || works.length === 0 || count <= 0) return [];
  const today = referenceDate ? new Date(referenceDate) : new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdaySelection = selectDailyWorks(works, count, yesterday);
  const yesterdayKeys = new Set(yesterdaySelection.map(work => work.slug));

  const seed = seedFromDate(today);
  const shuffled = seededShuffle(works, seed);
  const selection = [];
  const usedKeys = new Set();

  for (const work of shuffled) {
    if (selection.length >= count) break;
    const key = work.slug;
    if (!key || usedKeys.has(key) || yesterdayKeys.has(key)) continue;
    selection.push(work);
    usedKeys.add(key);
  }

  if (selection.length < count) {
    for (const work of shuffled) {
      if (selection.length >= count) break;
      const key = work.slug;
      if (!key || usedKeys.has(key)) continue;
      selection.push(work);
      usedKeys.add(key);
    }
  }

  return selection.slice(0, count);
}

