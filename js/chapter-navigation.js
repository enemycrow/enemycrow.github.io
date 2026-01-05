(function () {
  function deriveBookFromPath() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    var booksIndex = parts.lastIndexOf('books');
    if (booksIndex !== -1 && parts.length > booksIndex + 1) {
      return parts[booksIndex + 1];
    }
    return '';
  }

  function deriveSlugFromPath() {
    var filename = window.location.pathname.split('/').pop() || '';
    return filename.replace(/\.html$/, '').replace(/^\d+-/, '');
  }

  function deriveOrderFromPath() {
    var match = window.location.pathname.match(/(\d+)-/);
    return match ? Number(match[1]) : NaN;
  }

  function ensureNav(article) {
    var container = article.querySelector('.container') || article;
    var nav = container.querySelector('.chapter-nav');
    if (nav) return nav;

    nav = document.createElement('nav');
    nav.className = 'chapter-nav';
    nav.setAttribute('aria-label', 'Navegación entre capítulos');
    nav.innerHTML = [
      '<a class="btn btn-ghost chapter-nav__link" data-nav="prev" aria-disabled="true" tabindex="-1">',
      '  <span aria-hidden="true">⟵</span>',
      '  <span>Atrás</span>',
      '</a>',
      '<a class="btn btn-ghost chapter-nav__link" data-nav="next" aria-disabled="true" tabindex="-1">',
      '  <span aria-hidden="true">⟶</span>',
      '  <span>Siguiente</span>',
      '</a>'
    ].join('');

    container.appendChild(nav);
    return nav;
  }

  function setLinkState(link, target) {
    if (!link) return;
    if (!target) {
      link.hidden = true;
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('tabindex', '-1');
      link.removeAttribute('href');
      return;
    }

    var href = String(target.order).padStart(2, '0') + '-' + target.slug + '.html';
    link.hidden = false;
    link.href = href;
    link.setAttribute('aria-disabled', 'false');
    link.setAttribute('tabindex', '0');
  }

  function parseNow(params) {
    var nowParam = params.get('now');
    var now = nowParam ? new Date(nowParam) : new Date();
    if (isNaN(now.getTime())) return new Date();
    return now;
  }

  function isPublished(entry, now, preview) {
    if (preview) return true;
    if (!entry.published) return true;
    var date = new Date(entry.published);
    if (isNaN(date.getTime())) return false;
    return now >= date;
  }

  function normalizeEntry(entry) {
    return {
      order: Number(entry.order),
      slug: entry.slug || '',
      published: entry.published || null,
      title: entry.title || ''
    };
  }

  function updateNav(article, chapters, now, preview) {
    var book = article.getAttribute('data-book') || deriveBookFromPath();
    var currentOrder = Number(article.getAttribute('data-chapter')) || deriveOrderFromPath();
    var currentSlug = article.getAttribute('data-slug') || deriveSlugFromPath();

    var normalized = chapters.map(normalizeEntry).filter(function (entry) {
      return !isNaN(entry.order);
    });
    var current = normalized.find(function (entry) {
      return entry.order === currentOrder || entry.slug === currentSlug;
    });

    if (current) {
      article.setAttribute('data-book', book || article.getAttribute('data-book') || '');
      article.setAttribute('data-chapter', String(current.order));
      article.setAttribute('data-slug', current.slug);
      if (current.published) {
        article.setAttribute('data-published', current.published);
      }
    }

    var publishedChapters = normalized
      .filter(function (entry) {
        return isPublished(entry, now, preview);
      })
      .sort(function (a, b) {
        return a.order - b.order;
      });

    var nav = ensureNav(article);
    var prevLink = nav.querySelector('[data-nav="prev"]');
    var nextLink = nav.querySelector('[data-nav="next"]');

    var prev = publishedChapters.filter(function (entry) {
      return entry.order < (current && current.order);
    }).pop();
    var next = publishedChapters.find(function (entry) {
      return entry.order > (current && current.order);
    });

    setLinkState(prevLink, prev);
    setLinkState(nextLink, next);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var article = document.querySelector('article.blog-entry');
    if (!article) return;

    var params = new URLSearchParams(window.location.search);
    var preview = params.get('preview') === '1' || params.get('preview') === 'true';
    var now = parseNow(params);

    fetch('./chapters.json', { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('No chapters.json');
        return response.json();
      })
      .then(function (chapters) {
        if (!Array.isArray(chapters) || chapters.length === 0) throw new Error('Empty chapters.json');
        updateNav(article, chapters, now, preview);
      })
      .catch(function (err) {
        console.warn('No se pudo cargar el mapa de capítulos', err);
        // fallback: still ensure nav exists but keep it disabled/hidden
        ensureNav(article);
      });
  });
})();
