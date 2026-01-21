// Simple generator: extracts each modal from portfolio.html and creates
// a standalone page under /portfolio/<slug>.html with proper metadata.
// Usage:
//   node tools/generate-portfolio-pages.js            # generate all (skip existing)
//   node tools/generate-portfolio-pages.js galactique # generate only one by id/slug

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'portfolio.html');
const OUT_DIR = path.join(ROOT, 'portfolio');

function read(file){ return fs.readFileSync(file, 'utf8'); }
function write(file, data){ fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); }

function stripTags(html){
  const noTags = html.replace(/<[^>]*>/g, ' ');
  // Remove HTML entities like &copy;, &nbsp;, etc.
  const noEntities = noTags.replace(/&[a-zA-Z0-9#]+;?/g, ' ');
  return noEntities.replace(/\s+/g, ' ').trim();
}
function slugifyFromTitle(title){
  return title
    .normalize('NFD').replace(/\p{Diacritic}/gu,'')
    .toLowerCase().replace(/[^a-z0-9\s-]/g,'')
    .trim().replace(/\s+/g,'-');
}

function findAllModals(html){
  const modals = [];
  const modalRe = /<div\s+class=\"modal\"\s+id=\"([^\"]+)\"[^>]*>/g;
  let m;
  while((m = modalRe.exec(html))){
    const id = m[1];
    const start = m.index;
    const contentStart = m.index;
    // find matching closing </div> for the outer modal container by counting <div ...> and </div>
    let i = contentStart; let depth = 0; const len = html.length;
    while(i < len){
      const openIdx = html.indexOf('<div', i);
      const closeIdx = html.indexOf('</div>', i);
      if(openIdx !== -1 && openIdx < closeIdx){ depth++; i = openIdx + 4; }
      else if(closeIdx !== -1){ depth--; i = closeIdx + 6; if(depth < 0){ /* matched beyond modal */ break; } }
      else { break; }
      // When we first hit this function call, the first token is the modal opener itself
      if(i === contentStart + 4) depth = 1;
      // We need to detect when we close the opener: when depth returns to 0 after having been >0
      if(depth === 0){ break; }
    }
    // Fallback: search from start for next modal or end marker
    let end = i;
    if(!end || end <= start){
      const next = html.indexOf('<div class="modal"', start+1);
      end = next !== -1 ? next : html.length;
    }
    const modalHtml = html.slice(start, end);
    modals.push({ id, html: modalHtml });
  }
  return modals;
}

function extractMeta(modal){
  const h1Match = modal.html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = h1Match ? stripTags(h1Match[1]) : modal.id.replace(/-modal$/, '');
  const descMatch = modal.html.match(/<div[^>]*class=\"obra-entry__description\"[^>]*>([\s\S]*?)<\/div>/i) || modal.html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const description = descMatch ? stripTags(descMatch[1]).slice(0, 300) : 'Obra literaria';
  const imgMatch = modal.html.match(/<img[^>]*src=\"([^\"]+)\"/i);
  const image = imgMatch ? imgMatch[1] : null;
  const authorMatch = modal.html.match(/Autor:\s*<span>([^<]+)<\/span>/i);
  const author = authorMatch ? authorMatch[1].trim() : undefined;
  const yearMatch = modal.html.match(/A[ñn]o:\s*<span>([^<]+)<\/span>/i);
  const datePublished = yearMatch ? `${yearMatch[1]}-01-01` : undefined;
  return { title, description, image, author, datePublished };
}

function buildPage({ id, slug, modalHtml, meta }){
  // Ajuste de rutas relativas: al mover el modal a /portfolio/, los recursos
  // que referencian "assets/..." deben anteponer "../" para resolver.
  function fixAssetPaths(html){
    // src y data-image
    html = html.replace(/\b(src|data-image)\s*=\s*"(.*?)"/g, (m, attr, url) => {
      if(/^https?:|^data:|^\//.test(url)) return m; // absoluto o data URI
      if(url.startsWith('../') || url.startsWith('#')) return m;
      if(url.startsWith('assets/')) return `${attr}="../${url}"`;
      return m;
    });
    // srcset: corregir ocurrencias de assets/
    html = html.replace(/\bsrcset\s*=\s*"([^"]+)"/g, (m, list) => {
      const fixed = list.replace(/(?:^|\s)(assets\/)\b/g, (mm, a)=> mm.replace(a, '../assets/'));
      return `srcset="${fixed}"`;
    });
    return html;
  }
  modalHtml = fixAssetPaths(modalHtml);
  const canonical = `https://plumafarollama.com/portfolio/${slug}.html`;
  const ogImage = meta.image ? (meta.image.startsWith('http')? meta.image : ('../' + meta.image)) : undefined;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: meta.title,
    description: meta.description,
    inLanguage: 'es',
    url: canonical,
  };
  if(meta.image){
    const SITE='https://plumafarollama.com';
    const toAbs=(u)=> u? (u.startsWith('http')? u : `${SITE}/${u.replace(/^\.?\/?/, '')}`) : undefined;
    const m = meta.image.match(/^(.*?)(?:-([0-9]{3,4}))((?:\.[a-zA-Z]+))$/);
    const imgs = m ? [400,800,1200].map(sz=>`${m[1]}-${sz}${m[3]}`) : [meta.image];
    jsonLd.image = imgs.map(toAbs);
  }
  if(meta.author) jsonLd.author = { '@type': 'Person', name: meta.author };
  if(meta.datePublished) jsonLd.datePublished = meta.datePublished;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<!-- Google Tag Manager -->
<script src="/js/gtm-loader.js" defer></script>
<!-- End Google Tag Manager -->
  <meta charset="UTF-8">
    <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com; font-src 'self' https://fonts.gstatic.com https://use.fontawesome.com; frame-src https://www.googletagmanager.com; img-src 'self' data: https://www.googletagmanager.com https://plumafarollama.com https://mirrors.creativecommons.org; object-src 'none'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://use.fontawesome.com;" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title} | Obras – La Pluma, el Faro y la Llama</title>
  <meta name="description" content="${meta.description.replace(/"/g,'&quot;')}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${meta.title}">
  <meta property="og:description" content="${meta.description.replace(/"/g,'&quot;')}">
  <meta property="og:type" content="book">
  ${ (function(){
        const SITE='https://plumafarollama.com';
        const toAbs=(u)=> u? (u.startsWith('http')? u : `${SITE}/${u.replace(/^\.?\/?/, '')}`) : '';
        const m = (meta.image||'').match(/^(.*?)(?:-([0-9]{3,4}))((?:\.[a-zA-Z]+))$/);
        const imgs = m ? [400,800,1200].map(sz=>`${m[1]}-${sz}${m[3]}`) : (meta.image?[meta.image]:[]);
        return imgs.map(u=>`<meta property=\"og:image\" content=\"${toAbs(u)}\">\n  <meta property=\"og:image:alt\" content=\"${meta.title.replace(/\"/g,'&quot;')}\">`).join('\n  ');
      })() }
  <meta property="og:url" content="${canonical}">
  ${ (function(){
        const SITE='https://plumafarollama.com';
        const toAbs=(u)=> u? (u.startsWith('http')? u : `${SITE}/${u.replace(/^\.?\/?/, '')}`) : '';
        const m=(meta.image||'').match(/^(.*?)(?:-([0-9]{3,4}))((?:\.[a-zA-Z]+))$/);
        const best=m? `${m[1]}-1200${m[3]}` : (meta.image||'');
        if(!best) return '';
        const abs=toAbs(best);
        return `<meta name=\"twitter:card\" content=\"summary_large_image\">\n  <meta name=\"twitter:title\" content=\"${meta.title}\">\n  <meta name=\"twitter:description\" content=\"${meta.description.replace(/\"/g,'&quot;')}\">\n  <meta name=\"twitter:image\" content=\"${abs}\">\n  <meta name=\"twitter:image:alt\" content=\"${meta.title.replace(/\"/g,'&quot;')}\">`;
      })() }
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.7.2/css/all.css" />
  <link rel="stylesheet" href="../css/styles.15c06c305d.css">
  <link rel="stylesheet" href="../css/custom-overrides.css">
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NX2C8N3W"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->

  <a href="../portfolio.html" class="btn btn-featured" style="position:fixed;z-index:9;left:16px;top:16px">← Volver a Obras</a>
  ${modalHtml}
  <a id="autostart" href="#${id}" class="open-modal" style="display:none">Abrir</a>
  <script src="../js/main.46134422b8.js"></script>
  <script src="../js/portfolio.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function(){
      var a=document.getElementById('autostart'); if(a) a.click();
    });
  </script>
</body>
</html>`;
}

function run(target){
  const html = read(SRC);
  const modals = findAllModals(html);
  if(!modals.length){ console.error('No se encontraron modales.'); process.exit(1); }

  for(const modal of modals){
    // Use slug from title if target === 'all', but if target provided and matches id base, only that one
    const base = modal.id.replace(/-modal$/, '');
    if(target && target !== base) continue;

    const meta = extractMeta(modal);
    let slug = base; // default from id
    if(!target){ // for general case prefer human slug from title
      const tSlug = slugifyFromTitle(meta.title);
      if(tSlug) slug = tSlug;
    }
    const out = path.join(OUT_DIR, `${slug}.html`);
    const args = process.argv.slice(2);
    const force = args.includes('--force') || args.includes('-f');
    if(fs.existsSync(out) && !force){
      console.log(`Omitiendo (ya existe): ${out}`);
      continue;
    }
    const page = buildPage({ id: modal.id, slug, modalHtml: modal.html, meta });
    write(out, page);
    console.log(`Generado: ${out}`);
  }
}

const _args = process.argv.slice(2);
const arg = _args.find(a => !a.startsWith('-'));
run(arg);
