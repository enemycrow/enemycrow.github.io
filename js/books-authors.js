const getTrustedTypesPolicy = () => {
  if (!window.trustedTypes) return null;
  if (window.__trustedTypesPolicy) return window.__trustedTypesPolicy;
  try {
    window.__trustedTypesPolicy = window.trustedTypes.createPolicy('default', {
      createHTML: (input) => input
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

document.addEventListener('DOMContentLoaded', function () {
  const indexPath = '/assets/books/books_index.json';

  const idToAuthor = {
    'author-elysia': 'A.C. Elysia',
    'author-lauren': 'Lauren Cuervo',
    'author-draco': 'Draco Sahir'
  };

  fetch(indexPath).then(r => r.json()).then(list => {
    const booksByAuthor = {};
    list.forEach(entry => {
      const author = entry.metadata && entry.metadata.author ? entry.metadata.author : '';
      if (!author) return;
      booksByAuthor[author] = booksByAuthor[author] || [];
      booksByAuthor[author].push(entry);
    });

    Object.keys(idToAuthor).forEach(cardId => {
      const authorName = idToAuthor[cardId];
      const card = document.getElementById(cardId);
      if (!card) return;
      const btn = card.querySelector('a.btn');
      const worksContainer = card.querySelector('.author-works');

      const works = booksByAuthor[authorName] || [];
      if (works.length > 0) {
        card.classList.remove('author-card--disabled');
        card.classList.add('author-card--active');
        if (btn) {
          // make the button toggle the visibility of the works list (hidden by default)
          btn.setAttribute('href', '#');
          btn.setAttribute('role', 'button');
          btn.setAttribute('aria-expanded', 'false');
          btn.addEventListener('click', function (ev) {
            ev.preventDefault();
            if (!worksContainer) return;
            var isHidden = window.getComputedStyle(worksContainer).display === 'none';
            worksContainer.style.display = isHidden ? 'block' : 'none';
            btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
          });
        }

        // render list of works under the author card (kept hidden by default)
        if (worksContainer) {
          worksContainer.style.display = 'none';
          worksContainer.innerHTML = toTrustedHTML('');
          const ul = document.createElement('ul');
          ul.style.margin = '0';
          ul.style.paddingLeft = '1rem';
          ul.style.lineHeight = '1.5';
          works.forEach(w => {
            const li = document.createElement('li');
            const title = w.metadata && (w.metadata.title || w.metadata.slug) ? (w.metadata.title || w.metadata.slug) : w.dir;
            const desc = w.metadata && w.metadata.description ? w.metadata.description : '';
            const dirLower = (w.dir || '').toLowerCase();
            const a = document.createElement('a');
            a.href = `/books/${dirLower}/main.html`;
            a.textContent = title.replace(/-/g, ' ');
            a.style.fontWeight = '600';
            a.style.display = 'inline-block';
            a.style.marginBottom = '.25rem';
            li.appendChild(a);
            if (desc) {
              const p = document.createElement('p');
              p.textContent = desc;
              p.style.margin = '0 0 .5rem 0';
              p.style.opacity = '.85';
              p.style.fontSize = '.95rem';
              li.appendChild(p);
            }
            ul.appendChild(li);
          });
          worksContainer.appendChild(ul);
        }
      } else {
        card.classList.remove('author-card--active');
        card.classList.add('author-card--disabled');
        if (btn) {
          btn.setAttribute('aria-disabled', 'true');
          btn.setAttribute('href', '#');
        }
        if (worksContainer) worksContainer.style.display = 'none';
      }
    });
  }).catch(err => {
    console.warn('No se pudo cargar el índice de libros:', err);
  });
});
