// JavaScript para la página de Tienda
// Carga products.json y genera tarjetas de producto

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  try {
    const response = await fetch('products.json');
    const products = await response.json();

    products.forEach(p => {
      const article = document.createElement('article');
      article.className = 'product-card';
      article.innerHTML = `
        <img loading="lazy" src="${p.imagen}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <span class="price">$${p.precio}</span>
        <a href="${p.url}" class="btn btn-buy" ${p.url.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} aria-label="Comprar ${p.nombre}">Comprar</a>
      `;
      grid.appendChild(article);
    });
  } catch (err) {
    console.error('No se pudo cargar products.json', err);
  }
});
