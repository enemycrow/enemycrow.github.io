// book-navigation.js
// Añade botones anterior/siguiente en capítulos y respeta la visibilidad según publicación.
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var path = location.pathname.replace(/\\+/g, '/');
    var parts = path.split('/').filter(Boolean);
    var booksIndex = parts.indexOf('books');

    if (booksIndex === -1) return;

    var bookSlug = parts[booksIndex + 1];
    var filename = parts[parts.length - 1];

    if (!bookSlug || !filename || filename === 'main.html') return;

    var chapterMatch = filename.match(/^(\d+)-/);
    var currentIndex = chapterMatch ? Number(chapterMatch[1]) : NaN;
    var allBooks = window.BOOK_CHAPTERS || {};
    var chapters = allBooks[bookSlug] || [];

    if (!Number.isFinite(currentIndex) || chapters.length === 0) return;

    var params = new URLSearchParams(location.search);
    var preview = params.get('preview') === '1' || params.get('preview') === 'true';
    var nowParam = params.get('now');
    var now = nowParam ? new Date(nowParam) : new Date();
    if (isNaN(now.getTime())) now = new Date();

    var releasedFallback = Number(window.RELEASED_CHAPTERS || 0);

    function isReleased(chapter) {
      if (!chapter) return false;
      if (preview) return true;

      if (chapter.pub) {
        var pubDate = new Date(chapter.pub);
        if (isNaN(pubDate.getTime())) return false;
        return now >= pubDate;
      }

      if (releasedFallback > 0) {
        var idx = Number(chapter.index || 0);
        return idx > 0 && idx <= releasedFallback;
      }

      return false;
    }

    var previousChapter = chapters.find(function(ch) {
      return Number(ch.index) === currentIndex - 1;
    });

    var nextChapter = chapters.find(function(ch) {
      return Number(ch.index) === currentIndex + 1;
    });

    var nav = document.createElement('nav');
    nav.className = 'chapter-nav card';
    nav.setAttribute('aria-label', 'Navegación de capítulos');

    var heading = document.createElement('p');
    heading.className = 'chapter-nav__title';
    heading.textContent = 'Explora la obra';
    nav.appendChild(heading);

    var buttons = document.createElement('div');
    buttons.className = 'chapter-nav__actions';

    if (previousChapter && isReleased(previousChapter)) {
      var prevLink = document.createElement('a');
      prevLink.className = 'btn btn-ghost';
      prevLink.href = './' + previousChapter.file;
      prevLink.setAttribute('aria-label', 'Capítulo anterior: ' + previousChapter.title);
      prevLink.textContent = '← Anterior';
      buttons.appendChild(prevLink);
    }

    if (nextChapter && isReleased(nextChapter)) {
      var nextLink = document.createElement('a');
      nextLink.className = 'btn btn-lauren';
      nextLink.href = './' + nextChapter.file;
      nextLink.setAttribute('aria-label', 'Capítulo siguiente: ' + nextChapter.title);
      nextLink.textContent = 'Siguiente →';
      buttons.appendChild(nextLink);
    }

    // Si no hay ningún botón para mostrar, no insertamos nada.
    if (buttons.children.length === 0) return;

    nav.appendChild(buttons);

    var container = document.querySelector('.blog-entry .container');
    if (container) {
      container.appendChild(nav);
    }
  });
})();
