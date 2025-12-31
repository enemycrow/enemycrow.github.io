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
          // find first work element on the page that matches this author
          const workEl = document.querySelector(`[data-author="${authorName}"]`);
          if (workEl && workEl.id) {
            btn.setAttribute('href', `#${workEl.id}`);
            btn.addEventListener('click', function (ev) {
              ev.preventDefault();
              const target = document.getElementById(workEl.id);
              if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
          }
        }

        // render list of works under the author card
        if (worksContainer) {
          worksContainer.style.display = '';
          worksContainer.innerHTML = '';
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
