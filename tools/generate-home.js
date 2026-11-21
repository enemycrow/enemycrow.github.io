// Complete static reading selection; the browser refreshes it on a new Santiago day.
const fs = require('fs');
const path = require('path');
const editorial = require('../js/editorial-selection');
const root = path.join(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const stories = read('stories.json');
const data = {
  posts: read('posts.json').filter(p => p.fecha && /^[a-z0-9-]+$/.test(p.slug)).map(p => ({
    id: p.id, slug: p.slug, titulo: p.titulo, autor: p.autor, fecha: p.fecha,
    categoria_temas: p.categoria_temas || [], categoria_libros: p.categoria_libros || [],
    fragmento: p.fragmento || '', imagen: p.imagen || ''
  })),
  readings: stories.map(s => ({
    title: s.title, author: s.author, kind: 'Poesía y prosa breve',
    href: `poesia-${s.slug}.html`, folder: 'stories', imageBase: s.imageBase,
    excerpt: s.text.replace(/\\n/g, '\n').split('\n').slice(0, 3).join('\n')
  })).concat([
    { title: 'Viaje a la playa', author: 'A.C. Elysia', kind: 'Historieta', href: 'sordida-y-decorosa-viaje-a-la-playa.html', folder: 'historietas', imageBase: 'viaje-a-la-playa', excerpt: 'Dos amigas preparan una salida a la playa. Una conversación de Sórdida (y) Decorosa.' },
    { title: 'La cecina', author: 'A.C. Elysia', kind: 'Historieta', href: 'sordida-y-decorosa-la-cecina.html', folder: 'historietas', imageBase: 'la-cecina', excerpt: 'Una búsqueda de comida termina en un malentendido. Una conversación de Sórdida (y) Decorosa.' }
  ])
};
const selected = editorial.select(data);
const html = `<div id="editorial-front">
  <section aria-labelledby="daily-reading-title"><p class="editorial-label" id="daily-reading-title">Una lectura para hoy</p><div id="editorial-reading">${editorial.render(editorial.readingCard(selected.reading))}</div></section>
  <aside aria-labelledby="latest-title"><p class="editorial-label" id="latest-title">Última entrada del Diario</p><div id="editorial-latest">${editorial.render(editorial.postCard(selected.latest, true))}</div><p class="editorial-more"><a href="blog.html">Explorar el Diario →</a></p></aside>
</div>
<section id="editorial-archive" aria-labelledby="archive-title"><h2 id="archive-title">Del archivo: ideas para volver</h2><p>Libros, escritura y pensamientos. Textos para descubrir de nuevo, más allá de su fecha.</p><div id="editorial-archive-grid">${selected.archive.map(p => editorial.render(editorial.postCard(p))).join('\n')}</div></section>
<script type="application/json" id="editorial-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
const file = path.join(root, 'index.html');
const source = fs.readFileSync(file, 'utf8');
if (!source.includes('<!-- EDITORIAL:START -->') || !source.includes('<!-- EDITORIAL:END -->')) throw new Error('Missing editorial markers');
fs.writeFileSync(file, source.replace(/data-selection-day="[^"]*"/, `data-selection-day="${selected.day}"`).replace(/<!-- EDITORIAL:START -->[\s\S]*?<!-- EDITORIAL:END -->/, `<!-- EDITORIAL:START -->\n${html}\n<!-- EDITORIAL:END -->`));
console.log(`Portada generada: una lectura entre ${data.readings.length}, última entrada y ${selected.archive.length} textos del archivo.`);
