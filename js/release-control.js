// release-control.js
// Controla la visibilidad de capítulos según la fecha de publicación.
// Cada <li> puede usar `data-pub="ISO_DATETIME"` (ej. 2026-01-07T12:00:00-03:00).
// Si no hay `data-pub`, se usa el fallback `window.RELEASED_CHAPTERS` (índice).
// Parámetros útiles:
//  - ?preview=1    -> muestra todo (modo admin)
//  - ?now=ISO_DATE -> fuerza la fecha "actual" para pruebas (ej. ?now=2026-01-08T00:00:00)

document.addEventListener('DOMContentLoaded', function () {
  var released = Number(window.RELEASED_CHAPTERS || 0);
  var params = new URLSearchParams(location.search);
  var preview = params.get('preview') === '1' || params.get('preview') === 'true';

  // now override para testing, si se pasa ?now=ISO
  var nowParam = params.get('now');
  var now = nowParam ? new Date(nowParam) : new Date();
  if (isNaN(now.getTime())) {
    now = new Date();
  }

  var list = document.getElementById('chapter-list');
  if (!list) return;

  var items = Array.prototype.slice.call(list.querySelectorAll('li'));
  var hiddenCount = 0;

  items.forEach(function (li) {
    var idx = Number(li.getAttribute('data-index') || 0);
    var pub = li.getAttribute('data-pub');

    var shouldShow = true;

    if (!preview) {
      if (pub) {
        var pubDate = new Date(pub);
        if (isNaN(pubDate.getTime())) {
          // fecha inválida -> ocultar por seguridad
          shouldShow = false;
        } else {
          shouldShow = now >= pubDate;
        }
      } else if (released > 0) {
        shouldShow = idx > 0 && idx <= released;
      } else {
        // sin data-pub y sin released configurado -> ocultar por defecto
        shouldShow = false;
      }
    }

    if (!shouldShow) {
      li.style.display = 'none';
      li.classList.add('chapter-hidden');
      hiddenCount++;
    }
  });

  if (hiddenCount > 0 && !preview) {
    var note = document.createElement('p');
    note.style.opacity = '0.9';
    note.style.fontStyle = 'italic';
    note.style.marginTop = '1rem';
    note.textContent = 'Se publican nuevos capítulos semanalmente. Los capítulos futuros permanecen ocultos hasta su publicación.';
    list.parentNode.insertBefore(note, list.nextSibling);
  }
});
