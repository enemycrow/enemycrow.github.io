/* Shared daily selection and markup. No dependencies; browser updates use DOM APIs. */
(function () {
  'use strict';
  const dayKey = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const part = type => parts.find(p => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  };
  function select(data, date = new Date()) {
    const day = dayKey(date);
    const number = Math.floor(Date.parse(`${day}T12:00:00Z`) / 86400000);
    const posts = data.posts.filter(p => p.fecha <= day).slice().sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
    const pool = posts.slice(1);
    const offset = number % (pool.length || 1);
    const ordered = pool.slice(offset).concat(pool.slice(0, offset));
    const archive = [], groups = new Set();
    for (const post of ordered) {
      const group = (post.categoria_libros.length ? post.categoria_libros : post.categoria_temas).join('|');
      if (!groups.has(group) && archive.length < 3) { archive.push(post); groups.add(group); }
    }
    for (const post of ordered) if (archive.length < 3 && !archive.includes(post)) archive.push(post);
    return { day, latest: posts[0], archive, reading: data.readings[number % (data.readings.length || 1)] };
  }
  const el = (tag, attrs, ...children) => ({ tag, attrs, children: children.flat().filter(c => c !== null && c !== undefined) });
  const link = (href, text) => el('a', { href }, text);
  function image(folder, base, eager = false, comic = false) {
    const attrs = { src: `assets/images/${folder}/${base}.webp`, width: comic ? '1536' : '1600', height: comic ? '1024' : '900', alt: '', loading: eager ? 'eager' : 'lazy', decoding: 'async' };
    if (!comic) {
      attrs.srcset = [400, 800, 1200].map(w => `assets/images/responsive/${folder}/${base}-${w}.webp ${w}w`).join(', ');
      attrs.sizes = '(max-width: 900px) 100vw, 60vw';
    }
    if (eager) attrs.fetchpriority = 'high';
    return el('img', attrs);
  }
  function postCard(post, latest = false) {
    if (!post) return el('p', {}, link('blog.html', 'Explora el Diario →'));
    const href = `blog/${post.slug}.html`, base = String(post.imagen || '').replace(/\.webp$/, '');
    return el('article', {},
      base ? el('a', { href, tabindex: '-1', 'aria-hidden': 'true' }, image('blog', base)) : null,
      el('p', { class: 'editorial-kicker' }, post.categoria_temas.join(' · ')),
      el(latest ? 'h2' : 'h3', {}, link(href, post.titulo)), el('p', {}, post.fragmento),
      el('p', { class: 'editorial-meta' }, `${post.autor} · `, el('time', { datetime: post.fecha }, post.fecha.split('-').reverse().join('/'))), link(href, 'Leer la entrada →'));
  }
  function readingCard(reading) {
    if (!reading) return el('p', {}, link('poesia.html', 'Explora nuestros textos →'));
    return el('article', {},
      el('a', { href: reading.href, tabindex: '-1', 'aria-hidden': 'true' }, image(reading.folder, reading.imageBase, true, reading.kind === 'Historieta')),
      el('p', { class: 'editorial-kicker' }, `${reading.kind} · ${reading.author}`),
      el('h2', {}, link(reading.href, reading.title)), el('blockquote', {}, reading.excerpt),
      link(reading.href, reading.kind === 'Historieta' ? 'Leer la historieta →' : 'Leer el texto completo →'));
  }
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function render(node) {
    if (typeof node !== 'object') return escape(node);
    const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${escape(value)}"`).join('');
    return `<${node.tag}${attrs}>${node.tag === 'img' ? '' : node.children.map(render).join('') + `</${node.tag}>`}`;
  }
  function createNode(node) {
    if (typeof node !== 'object') return document.createTextNode(String(node));
    const element = document.createElement(node.tag);
    Object.entries(node.attrs).forEach(([key, value]) => element.setAttribute(key, value));
    node.children.forEach(child => element.appendChild(createNode(child)));
    return element;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dayKey, select, readingCard, postCard, render };
  } else if (typeof document !== 'undefined') {
    const source = document.getElementById('editorial-data');
    if (!source) return;
    try {
      const selection = select(JSON.parse(source.textContent));
      const home = document.getElementById('editorial-home');
      if (home.dataset.selectionDay === selection.day) return;
      const mount = (id, nodes) => document.getElementById(id).replaceChildren(...nodes.map(createNode));
      mount('editorial-reading', [readingCard(selection.reading)]);
      mount('editorial-latest', [postCard(selection.latest, true)]);
      mount('editorial-archive-grid', selection.archive.map(post => postCard(post)));
      home.dataset.selectionDay = selection.day;
    } catch (error) { console.warn('Se conserva la selección editorial publicada.', error); }
  }
}());
