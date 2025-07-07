// entrada.js

document.addEventListener('DOMContentLoaded', async () => {
  const slug = new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    document.body.innerHTML = '<h1>Error: No se proporcionó un slug.</h1>';
    return;
  }

  try {
    const response = await fetch(`https://beautiful-bat-b20fd0ce9b.strapiapp.com/api/blog-entries?filters[slug][$eq]=${slug}&populate=*`);
    const json = await response.json();

    if (!json.data || json.data.length === 0) {
      document.body.innerHTML = '<h1>Entrada no encontrada.</h1>';
      return;
    }

    const entry = json.data[0].attributes;

    document.title = entry.titulo;

    const entryContainer = document.querySelector('.blog-entry');
    entryContainer.classList.add(`blog-entry--${entry.autor.toLowerCase().replace(/\s+/g, '-')}`);
    entryContainer.setAttribute('data-author', entry.autor.toLowerCase());

    entryContainer.querySelector('.blog-entry__title').textContent = entry.titulo;
    entryContainer.querySelector('.blog-entry__date').textContent = formatDate(entry.FechaPublicacion);
    entryContainer.querySelector('.blog-entry__signature').textContent = `— ${entry.autor}`;

    const contentContainer = entryContainer.querySelector('.blog-entry__content');
    contentContainer.innerHTML = renderRichText(entry.contenido);

  } catch (error) {
    console.error(error);
    document.body.innerHTML = '<h1>Error al cargar la entrada.</h1>';
  }
});

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderRichText(content) {
  return content.map(block => {
    if (block.type === 'heading') {
      return `<h${block.level}>${renderChildren(block.children)}</h${block.level}>`;
    }
    if (block.type === 'paragraph') {
      return `<p>${renderChildren(block.children)}</p>`;
    }
    if (block.type === 'quote') {
      return `<blockquote>${renderChildren(block.children)}</blockquote>`;
    }
    return '';
  }).join('');
}

function renderChildren(children) {
  return children.map(child => {
    let text = child.text || '';
    if (child.bold) text = `<strong>${text}</strong>`;
    if (child.italic) text = `<em>${text}</em>`;
    if (child.underline) text = `<u>${text}</u>`;
    return text;
  }).join('');
}
