// JavaScript para la página de Tienda
// Carga products.json y genera tarjetas de producto
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

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  try {
    const response = await fetch('products.json');
    const products = await response.json();

    products.forEach(p => {
      const article = document.createElement('article');
      article.className = 'product-card';
      article.innerHTML = toTrustedHTML(`
        <img loading="lazy" src="${p.imagen}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <span class="price">$${p.precio}</span>
        <a href="${p.url}" class="btn btn-buy" ${p.url.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} aria-label="Comprar ${p.nombre}">Comprar</a>
      `);
      grid.appendChild(article);
    });
  } catch (err) {
    console.error('No se pudo cargar products.json', err);
  }
});
