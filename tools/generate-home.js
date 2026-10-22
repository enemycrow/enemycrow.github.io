// Generate a readable, zero-JavaScript front page from the existing content.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const posts = read('posts.json').filter(p => p.fecha && p.fecha <= today && /^[a-z0-9-]+$/.test(p.slug)).sort((a,b) => b.fecha.localeCompare(a.fecha) || b.id-a.id).slice(0,4);
const stories = read('stories.json').slice(-2).reverse();
const image = (folder, base, alt, eager=false) => `<img src="assets/images/${folder}/${esc(base)}.webp" srcset="${[400,800,1200].map(w=>`assets/images/responsive/${folder}/${esc(base)}-${w}.webp ${w}w`).join(', ')}" sizes="(max-width: 760px) 100vw, ${eager?'65vw':'30vw'}" width="1600" height="900" alt="${esc(alt)}" loading="${eager?'eager':'lazy'}" ${eager?'fetchpriority="high" ':''}decoding="async">`;
function article(p, lead=false) {
 const url=`blog/${p.slug}.html`;
 const base=String(p.imagen||'').replace(/\.webp$/,'');
 return `<article${lead?' id="editorial-lead"':''}>${base?`<a href="${url}" tabindex="-1" aria-hidden="true">${image('blog',base,'',lead)}</a>`:''}<p>${esc((p.categoria_temas||[]).join(' · '))}</p><h${lead?'2':'3'}><a href="${url}">${esc(p.titulo)}</a></h${lead?'2':'3'}><p>${esc(p.fragmento)}</p><p><span>${esc(p.autor)}</span> · <time datetime="${esc(p.fecha)}">${esc(p.fecha.split('-').reverse().join('/'))}</time></p><a href="${url}">Leer la entrada →</a></article>`;
}
const html=`<section id="novedades" aria-label="Novedades del diario"><div id="editorial-front">${posts[0]?article(posts[0],true):'<p>Descubre nuestras <a href="blog.html">entradas del diario</a>.</p>'}<aside id="editorial-shortcuts" aria-labelledby="shortcuts-title"><p>En esta casa</p><h2 id="shortcuts-title">Encuentra tu próxima lectura</h2><a href="books.html"><strong>Leer</strong><span>Obras y capítulos para seguir una historia.</span></a><a href="sordida-y-decorosa.html"><strong>Sórdida (y) Decorosa</strong><span>Dos historietas de A.C. Elysia para empezar a leer.</span></a><a href="donate.html"><strong>Donar</strong><span>Acompaña la creación de nuevas historias.</span></a><a href="about.html#manifiesto"><strong>Nosotros</strong><span>Tres voces y un manifiesto.</span></a></aside></div><div id="editorial-latest"><h2>Más del diario</h2><div>${posts.slice(1).map(p=>article(p)).join('')}</div><p><a href="blog.html">Todas las entradas del diario →</a></p></div></section><section id="editorial-poems" aria-labelledby="poems-title"><h2 id="poems-title">Un espacio para la poesía</h2><div>${stories.map(s=>`<article><a href="donate.html" tabindex="-1" aria-hidden="true">${image('stories',s.imageBase,'')}</a><p>${esc(s.author)}</p><h3><a href="donate.html">${esc(s.title)}</a></h3><blockquote>${esc(s.text.split('\n').slice(0,3).join('\n'))}</blockquote><a href="donate.html">Descubrir los poemas →</a></article>`).join('')}</div></section>`;
const file=path.join(root,'index.html');
fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/<!-- EDITORIAL:START -->[\s\S]*?<!-- EDITORIAL:END -->/,`<!-- EDITORIAL:START -->\n${html}\n<!-- EDITORIAL:END -->`));
console.log(`Portada generada: ${posts.length} entradas y ${stories.length} poemas.`);
