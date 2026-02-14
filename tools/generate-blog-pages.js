#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ROOT = process.cwd();
const POSTS_PATH = path.join(PROJECT_ROOT, 'posts.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'blog');
const SITE_NAME = 'La Pluma, el Faro y la Llama';
const SECTION_NAME = 'Diario de Creación';
const BASE_URL = 'https://plumafarollama.com';
const SELF_CLOSING_TAGS = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

function readPosts() {
  if (!fs.existsSync(POSTS_PATH)) {
    throw new Error(`No se encontró posts.json en ${POSTS_PATH}`);
  }
  const raw = fs.readFileSync(POSTS_PATH, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`No se pudo analizar posts.json: ${error.message}`);
  }
}

// Simple CLI flags handling
const CLI_ARGS = process.argv.slice(2);
const MODE_INCREMENTAL = CLI_ARGS.includes('--incremental') || CLI_ARGS.includes('--staged');
const MODE_STAGED = CLI_ARGS.includes('--staged');

function isFuturePost(post, referenceDate = new Date()) {
  if (!post || !post.fecha) return false;
  const match = /^\s*(\d{4})-(\d{2})-(\d{2})/.exec(post.fecha);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  if (!year || !month || !day) return false;
  const postTime = Date.UTC(year, month - 1, day);
  const referenceTime = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );
  return postTime > referenceTime;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDescription(post) {
  const rawHtml = typeof post.contenido_html === 'string' ? post.contenido_html : '';
  const plain = rawHtml
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const preferred = [post.fragmento_social, post.fragmento, plain, post.titulo]
    .map(value => (typeof value === 'string' ? value.trim() : ''))
    .find(Boolean);
  return preferred || '';
}

function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function getImageInfo(post) {
  const imageName = typeof post.imagen === 'string' ? post.imagen : '';
  const baseName = imageName.replace(/\.[^.]+$/, '');
  const responsiveDir = path.join(PROJECT_ROOT, 'assets', 'images', 'responsive', 'blog');
  const webDir = path.join(PROJECT_ROOT, 'assets', 'images', 'blog');

  const responsiveVariants = [400, 800, 1200];
  const srcsetParts = [];
  for (const size of responsiveVariants) {
    const fileName = `${baseName}-${size}.webp`;
    const filePath = path.join(responsiveDir, fileName);
    if (baseName && fs.existsSync(filePath)) {
      srcsetParts.push(`/assets/images/responsive/blog/${fileName} ${size}w`);
    }
  }

  let fallbackSrc = '';
  if (baseName) {
    const fallbackPath = path.join(webDir, `${baseName}.webp`);
    if (fs.existsSync(fallbackPath)) {
      fallbackSrc = `/assets/images/blog/${baseName}.webp`;
      srcsetParts.push(`/assets/images/blog/${baseName}.webp 1600w`);
    }
  }

  const srcset = srcsetParts.length
    ? srcsetParts.join(',\n            ')
    : '';

  let socialImage = '';
  if (baseName) {
    const preferredSocial = path.join(responsiveDir, `${baseName}-1200.webp`);
    if (fs.existsSync(preferredSocial)) {
      socialImage = `${BASE_URL}/assets/images/responsive/blog/${baseName}-1200.webp`;
    } else if (fallbackSrc) {
      socialImage = `${BASE_URL}${fallbackSrc}`;
    }
  }

  const placeholderSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  return {
    src: fallbackSrc || placeholderSrc,
    srcset,
    sizes: '(max-width: 600px) 100vw, 1200px',
    socialImage,
    alt: escapeHtml(post.titulo || '')
  };
}

function buildCategoryTags(values) {
  if (!Array.isArray(values) || !values.length) return '';
  return values
    .map(value => value && value.toString().trim())
    .filter(Boolean)
    .map(value => `<span class="category-tag">${escapeHtml(value)}</span>`)
    .join(' ');
}

function buildLicense(post, canonicalUrl) {
  const titulo = escapeHtml(post.titulo || 'Entrada del blog');
  const autor = escapeHtml(post.autor || SITE_NAME);
  const year = (() => {
    const date = new Date(post.fecha || Date.now());
    return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  })();

  return [
    `<a href="${escapeHtml(canonicalUrl)}">Entrada de blog: ${titulo}</a> © ${year} by `,
    `<a href="https://plumafarollama.com">${autor}</a> is licensed under `,
    '<a href="https://creativecommons.org/licenses/by-nc-nd/4.0/">CC BY-NC-ND 4.0</a>',
    '<img loading="lazy" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">',
    '<img loading="lazy" src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">',
    '<img loading="lazy" src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">',
    '<img loading="lazy" src="https://mirrors.creativecommons.org/presskit/icons/nd.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">'
  ].join('');
}

function normalizeHtmlContent(html) {
  if (typeof html !== 'string') return '';
  let normalized = html;
  normalized = normalized.replace(/\\"/g, '"');
  normalized = normalized.replace(/\\n/g, '\n');
  normalized = normalized.replace(/\\t/g, '\t');
  normalized = normalized.replace(/\r/g, '');
  normalized = normalized.replace(/<\/?(?:html|head|body)>/gi, '');

  const blockTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote', 'ul', 'ol', 'article', 'section', 'figure', 'header', 'footer', 'main'];
  const blockPattern = blockTags.join('|');
  const openingPattern = new RegExp(`<p>\\s*(<(${blockPattern})\\b)`, 'gi');
  normalized = normalized.replace(openingPattern, '$1');
  const closingPattern = new RegExp(`(</(${blockPattern})>)\\s*</p>`, 'gi');
  normalized = normalized.replace(closingPattern, '$1');

  const blockWithPrefixPattern = new RegExp(`<p>([^<]+)(<(${blockPattern})\\b)`, 'gi');
  normalized = normalized.replace(blockWithPrefixPattern, (match, text, tag) => {
    const trimmed = text.trim();
    const prefix = trimmed ? `<p>${trimmed}</p>` : '';
    return `${prefix}${tag}`;
  });

  for (let i = 0; i < 10; i += 1) {
    const next = normalized.replace(new RegExp(`<p>([\\s\\S]*?)<(${blockPattern})\\b`, 'i'), (match, text, tagName) => {
      const trimmed = text.trim();
      const prefix = trimmed ? `<p>${trimmed}</p>` : '';
      return `${prefix}<${tagName}`;
    });
    if (next === normalized) break;
    normalized = next;
  }

  const trailingTextAfterBlockPattern = new RegExp(`</(${blockPattern})>\\s*([^<\s][^<]*)`, 'gi');
  normalized = normalized.replace(trailingTextAfterBlockPattern, (match, tagName, text) => {
    const trimmed = text.trim();
    const suffix = trimmed ? `<p>${trimmed}</p>` : '';
    return `</${tagName}>${suffix}`;
  });

  normalized = normalized.replace(/<p>\s*<\/p>/gi, '');
  normalized = normalized.replace(/<\/p>\s*<\/p>/gi, '</p>');

  normalized = normalized.replace(/(\s[\w:-]+)='([^']*)'/g, (match, attr, value) => {
    const safeValue = value.replace(/"/g, '&quot;');
    return `${attr}="${safeValue}"`;
  });

  normalized = normalized.replace(/<p>([\s\S]*?)<\/p>/gi, (match, inner) => {
    const blockRegex = new RegExp(`<(${blockPattern})\\b[\\s\\S]*?<\\/\\1>`, 'gi');
    let output = '';
    let lastIndex = 0;
    let blockMatch;
    while ((blockMatch = blockRegex.exec(inner)) !== null) {
      const before = inner.slice(lastIndex, blockMatch.index).trim();
      if (before) {
        output += `<p>${before}</p>`;
      }
      output += blockMatch[0];
      lastIndex = blockMatch.index + blockMatch[0].length;
    }
    const remaining = inner.slice(lastIndex).trim();
    if (remaining) {
      output += `<p>${remaining}</p>`;
    }
    return output || '';
  });

  normalized = normalized.replace(/<p><p>/gi, '<p>');
  normalized = normalized.replace(/<\/p><\/p>/gi, '</p>');
  normalized = normalized.replace(/<p><\/p>/gi, '');

  normalized = normalized.replace(/<h([1-6])([A-Za-zÁÉÍÓÚÑ])/g, (match, level, char) => `<h${level}>${char}`);

  normalized = balanceHtml(normalized.trim());
  normalized = normalized.replace(/<\/p>\s*<\/p>/gi, '</p>');
  return normalized;
}

function balanceHtml(html) {
  const tagRegex = /<\/?([a-zA-Z0-9:-]+)[^>]*>/g;
  let lastIndex = 0;
  const parts = [];
  const stack = [];
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = match[1].toLowerCase();
    const token = match[0];
    const isClosing = token[1] === '/';
    parts.push(html.slice(lastIndex, match.index));
    if (isClosing) {
      if (stack.length && stack[stack.length - 1] === tagName) {
        stack.pop();
        parts.push(token);
      } else {
        const idx = stack.lastIndexOf(tagName);
        if (idx !== -1) {
          for (let i = stack.length - 1; i > idx; i--) {
            const unclosed = stack.pop();
            parts.push(`</${unclosed}>`);
          }
          stack.pop();
          parts.push(token);
        }
        // Unmatched closing tag is skipped
      }
    } else {
      parts.push(token);
      if (!SELF_CLOSING_TAGS.has(tagName)) {
        stack.push(tagName);
      }
    }
    lastIndex = match.index + token.length;
  }
  parts.push(html.slice(lastIndex));
  while (stack.length) {
    parts.push(`</${stack.pop()}>`);
  }
  return parts.join('');
}

function cleanOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    return;
  }

  const entries = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.html')) {
      fs.unlinkSync(path.join(OUTPUT_DIR, entry.name));
    }
  }
}

function buildHtml(post) {
  if (!post.slug) {
    throw new Error(`La entrada con id ${post.id} no tiene slug.`);
  }

  const slug = post.slug;
  const canonicalUrl = `${BASE_URL}/blog/${slug}.html`;
  const description = buildDescription(post);
  const formattedDate = formatDate(post.fecha);
  const categoriesHtml = buildCategoryTags(post.categoria_temas);
  const booksHtml = buildCategoryTags(post.categoria_libros);
  const imageInfo = getImageInfo(post);
  const licenseHtml = buildLicense(post, canonicalUrl);
  const title = `${post.titulo} | ${SECTION_NAME} – ${SITE_NAME}`;
  const twitterCard = imageInfo.socialImage ? 'summary_large_image' : 'summary';
  const contentHtml = normalizeHtmlContent(post.contenido_html || '');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<!-- Google Tag Manager -->
<script src="/js/gtm-loader.js" defer></script>
<!-- End Google Tag Manager -->
  <meta charset="UTF-8">
    <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com; font-src 'self' https://fonts.gstatic.com https://use.fontawesome.com; frame-src https://www.googletagmanager.com; img-src 'self' data: https://www.googletagmanager.com https://plumafarollama.com https://mirrors.creativecommons.org; object-src 'none'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://use.fontawesome.com; require-trusted-types-for 'script'; trusted-types default;" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(post.titulo)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  ${imageInfo.socialImage ? `<meta property="og:image" content="${escapeHtml(imageInfo.socialImage)}">
  <meta property="og:image:alt" content="${escapeHtml(post.titulo)}">` : ''}
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
  <meta property="og:locale" content="es_ES">
  <meta name="twitter:card" content="${twitterCard}">
  <meta name="twitter:title" content="${escapeHtml(post.titulo)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${imageInfo.socialImage ? `<meta name="twitter:image" content="${escapeHtml(imageInfo.socialImage)}">
  <meta name="twitter:image:alt" content="${escapeHtml(post.titulo)}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.7.2/css/all.css" />
  <link rel="stylesheet" href="../css/styles.889d2a038d.css">
  <link rel="stylesheet" href="../css/custom-overrides.css" />
</head>
<body data-post-slug="${escapeHtml(slug)}" data-prerendered="true">
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NX2C8N3W" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->

  <header>
    <div class="container">
      <nav class="navbar">
        <a href="../index.html" class="logo" data-sylvora-latido="true">
          <span class="logo-icon"><i class="fas fa-feather-alt" aria-hidden="true"></i></span>
          La Pluma, el Faro y la Llama
        </a>
        <ul class="nav-links">
          <li><a href="../index.html">Inicio</a></li>
          <li><a href="../about.html">Sobre Nosotros</a></li>
          <li><a href="../portfolio.html">Obras</a></li>
          <li><a href="../blog.html" class="active">Diario</a></li>
          <li><a href="../services.html">Servicios</a></li>
          <li><a href="../shop.html">Tienda</a></li>
          <li><a href="../contact.html">Contacto</a></li>
          <li><a href="../donate.html" class="btn btn-donate">Donar</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main>
    <article class="blog-entry blog-entry--individual">
      <div class="container">
        <img
          id="entry-image"
          class="blog-entry__image"
          ${imageInfo.src ? `src="${escapeHtml(imageInfo.src)}"` : ''}
          ${imageInfo.srcset ? `srcset="
            ${imageInfo.srcset}
          "` : ''}
          sizes="${escapeHtml(imageInfo.sizes)}"
          alt="${imageInfo.alt}"
          loading="lazy"
          fetchpriority="low" />
        <div class="reactions-block">
          <div class="reactions-list">
            <div class="reaction" data-reaction="toco" role="button">
              <span class="reaction-icon"><i class="fas fa-heart" aria-hidden="true"></i></span>
              <span class="reaction-count" id="reaction-toco-count">0</span>
              <span class="reaction-tooltip">Esta historia me tocó</span>
            </div>
            <div class="reaction" data-reaction="sumergirme" role="button">
              <span class="reaction-icon"><i class="fas fa-water" aria-hidden="true"></i></span>
              <span class="reaction-count" id="reaction-sumergirme-count">0</span>
              <span class="reaction-tooltip">Quiero sumergirme en la trama</span>
            </div>
            <div class="reaction" data-reaction="personajes" role="button">
              <span class="reaction-icon"><i class="fas fa-users" aria-hidden="true"></i></span>
              <span class="reaction-count" id="reaction-personajes-count">0</span>
              <span class="reaction-tooltip">Quiero conocer a fondo a sus personajes</span>
            </div>
            <div class="reaction" data-reaction="mundo" role="button">
              <span class="reaction-icon"><i class="fas fa-globe" aria-hidden="true"></i></span>
              <span class="reaction-count" id="reaction-mundo-count">0</span>
              <span class="reaction-tooltip">Me intriga el mundo que han creado</span>
            </div>
            <div class="reaction" data-reaction="lugares" role="button">
              <span class="reaction-icon"><i class="fas fa-map-marker-alt" aria-hidden="true"></i></span>
              <span class="reaction-count" id="reaction-lugares-count">0</span>
              <span class="reaction-tooltip">Llévame a esos lugares</span>
            </div>
          </div>
          <div class="entry-category-block centered-block">
            <span class="category-icon">🏷️</span>
            <span id="entry-categories-block">${booksHtml}</span>
          </div>
        </div>
        <div class="post-category" id="entry-categories">${categoriesHtml}</div>
        <h1 class="blog-entry__title" id="entry-title">${escapeHtml(post.titulo)}</h1>
        <span class="blog-entry__date" id="entry-date">${escapeHtml(formattedDate)}</span>
        <div class="blog-entry__meta">
          <span class="meta-item" id="entry-time">${escapeHtml(post.tiempo || '')}</span>
          <span class="meta-item" id="entry-comments"></span>
        </div>
        <div class="blog-entry__content" id="entry-content">
${contentHtml}
        </div>
        <p class="blog-entry__signature" id="entry-author">— ${escapeHtml(post.autor || '')}</p>
        <p class="blog-entry__license" id="entry-license">${licenseHtml}</p>
      </div>
    </article>
  </main>
  <footer class="footer">
    <div class="container">
      <p>&copy; 2025 La Pluma, el Faro y la Llama. Todos los derechos reservados.</p>
    </div>
  </footer>
  <script defer src="../js/main.d9fb968dc8.js"></script>
  <script defer src="../js/blog-entry.js"></script>
</body>
</html>`;
}

function writePostPages(posts) {
  if (MODE_INCREMENTAL) {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const expectedFiles = new Set(
      posts
        .map(post => (post && post.slug ? `${post.slug}.html` : null))
        .filter(Boolean)
    );
    let written = 0;
    for (const post of posts) {
      const html = buildHtml(post) + '\n';
      const outPath = path.join(OUTPUT_DIR, `${post.slug}.html`);
      if (fs.existsSync(outPath)) {
        const existing = fs.readFileSync(outPath, 'utf8');
        if (existing === html) continue; // no change
      }
      fs.writeFileSync(outPath, html, 'utf8');
      written += 1;
      console.log(`Escrito: ${outPath}`);
    }
    const filesInOutput = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true });
    for (const entry of filesInOutput) {
      if (!entry.isFile()) continue;
      const { name } = entry;
      if (!name.endsWith('.html')) continue;
      if (expectedFiles.has(name)) continue;
      const filePath = path.join(OUTPUT_DIR, name);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Eliminado: ${filePath}`);
      }
    }
    console.log(`Generadas/actualizadas ${written} páginas en ${OUTPUT_DIR} (modo incremental)`);
    return;
  }

  // Default: clean and write all
  cleanOutputDir();
  for (const post of posts) {
    const html = buildHtml(post);
    const outPath = path.join(OUTPUT_DIR, `${post.slug}.html`);
    fs.writeFileSync(outPath, `${html}\n`, 'utf8');
  }
  console.log(`Generadas ${posts.length} páginas en ${OUTPUT_DIR}`);
}

function updatePostsFile(posts) {
  // Preserve unknown/custom fields from the existing posts.json while
  // updating canonical fields (notably `url`) so we don't clobber metadata.
  let changed = false;
  let original = [];
  try {
    const raw = fs.readFileSync(POSTS_PATH, 'utf8');
    original = JSON.parse(raw);
  } catch (err) {
    // If posts.json is missing or invalid, fall back to empty original.
    original = [];
  }

  // Build lookup by id (preferred) and by slug as fallback
  const byId = new Map();
  const bySlug = new Map();
  for (const p of original) {
    if (!p) continue;
    if (p.id !== undefined && p.id !== null) byId.set(String(p.id), p);
    if (p.slug) bySlug.set(String(p.slug), p);
  }

  const updated = posts.map(post => {
    const expectedUrl = `blog/${post.slug}.html`;
    const keyId = post.id !== undefined && post.id !== null ? String(post.id) : null;
    const originalEntry = keyId && byId.has(keyId) ? byId.get(keyId) : bySlug.get(String(post.slug)) || {};

    // Merge original entry with the new values, but ensure canonical fields
    // from the generator (like url) are set/updated.
    const merged = Object.assign({}, originalEntry, post, { url: expectedUrl });

    // We consider the posts.json changed if the URL differs from the original
    // (the generator is mainly responsible for ensuring correct urls).
    if (!originalEntry || originalEntry.url !== expectedUrl) {
      changed = true;
    }

    return merged;
  });

  if (changed) {
    const json = JSON.stringify(updated, null, 2);
    fs.writeFileSync(POSTS_PATH, `${json}\n`, 'utf8');
    console.log('posts.json actualizado con URLs de las páginas pre-renderizadas (campos extra preservados).');
  }

  return updated;
}

function main() {
  const posts = readPosts();
  const updatedPosts = updatePostsFile(posts);
  const filteredPosts = updatedPosts.filter(post => {
    const future = isFuturePost(post);
    if (future) {
      console.log(`Saltando publicación futura: ${post.slug || post.id || post.titulo}`);
    }
    return !future;
  });
  writePostPages(filteredPosts);
}

main();
