// Permanent reading pages for the texts already published in the donation rotator.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const texts = JSON.parse(read('stories.json')).slice().reverse();
const template = read('sordida-y-decorosa.html');
const url = text => `poesia-${text.slug}.html`;
const bodyText = text => text.text.replace(/\\n/g, '\n');
const image = text => `<img src="assets/images/stories/${esc(text.imageBase)}.webp" srcset="${[400,800,1200].map(w => `assets/images/responsive/stories/${esc(text.imageBase)}-${w}.webp ${w}w`).join(', ')}" sizes="(max-width: 760px) 100vw, 720px" width="1600" height="900" alt="" decoding="async">`;
function page(file, title, description, content) {
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)} | La Pluma, el Faro y la Llama</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="https://plumafarollama.com/${file}" />`)
    .replace('css/historietas.css?v=1', 'css/poesia.css?v=1')
    .replace(/<main[\s\S]*?<\/main>/, `<main id="poetry-reader" class="container">${content}</main>`)
    .replace('    <script defer src="js/books-authors.js"></script>\n', '');
  fs.writeFileSync(path.join(root, file), html);
}
page('poesia.html', 'Poesía', 'Poemas y prosa breve de Lauren Cuervo, A.C. Elysia y Draco Sahir.',
  `<p><a href="books.html#poesia">← Volver a Leer</a></p><h1>Poesía</h1><p>Poemas y prosa breve de nuestras tres voces. Elige un texto para leerlo a tu ritmo.</p><div class="poetry-catalog">${texts.map(text => `<article><p>${esc(text.author)} · ${esc(text.year)}</p><h2><a href="${url(text)}">${esc(text.title)}</a></h2><p class="poetry-excerpt">${esc(bodyText(text).split('\n').slice(0,3).join('\n'))}</p><a href="${url(text)}">Leer el texto →</a></article>`).join('\n')}</div>`);
for (const text of texts) {
  if (!/^[a-z0-9-]+$/.test(text.slug)) throw new Error(`Invalid slug: ${text.slug}`);
  const related = texts.filter(t => t.slug !== text.slug && t.author.replace(/\./g, '') === text.author.replace(/\./g, '')).slice(0,2);
  page(url(text), text.title, `${text.title}, de ${text.author}. Lee el texto completo.`,
    `<p><a href="poesia.html">← Volver a Poesía</a></p><article class="poetry-piece"><header class="poetry-heading"><p>${esc(text.author)} · ${esc(text.year)}</p><h1>${esc(text.title)}</h1></header>${image(text)}<div class="poetry-text">${esc(bodyText(text))}</div><p class="poetry-license">© ${esc(text.year)} ${esc(text.author)}. <a href="https://creativecommons.org/licenses/${esc(text.cc)}/4.0/" rel="license">CC ${esc(text.cc.toUpperCase())} 4.0</a>.</p></article><aside class="poetry-support" aria-label="Apoya este espacio"><p>Si este texto te acompañó, puedes ayudar a que sigamos creando.</p><a class="btn btn-donate" href="donate.html">Apoyar este espacio</a></aside><nav class="poetry-related" aria-label="Más lecturas"><h2>Más de ${esc(text.author)}</h2>${related.map(t => `<p><a href="${url(t)}">${esc(t.title)} →</a></p>`).join('')}<p><a href="poesia.html">Todos los poemas y textos →</a></p></nav>`);
}
console.log(`Poesía generada: catálogo y ${texts.length} textos.`);
