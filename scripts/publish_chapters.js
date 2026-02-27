const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
// Disable deprecated behaviors to avoid warnings from marked@5+
marked.setOptions({ mangle: false, headerIds: false });

async function exists(p){ try{ await fs.access(p); return true }catch(e){ return false } }

function pad(n){ return String(n).padStart(2,'0'); }

function normalizeSlug(value){
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractCoverFigure(html){
  if(!html) return '';
  const match = html.match(/<figure[^>]*class="[^"]*obra-entry__cover[^"]*"[\s\S]*?<\/figure>/i);
  return match ? match[0] : '';
}

function preserveCustomCover(renderedHtml, existingHtml){
  const existingCover = extractCoverFigure(existingHtml);
  if(!existingCover) return renderedHtml;

  return renderedHtml.replace(
    /<figure[^>]*class="[^"]*obra-entry__cover[^"]*"[\s\S]*?<\/figure>/i,
    existingCover
  );
}

async function renderChapter(template, bookRelPath, entry, htmlContent){
  // template is the full HTML template from templates/book-chapter-template.html
  // Replace title/meta
  template = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${entry.title} | ${bookRelPath}</title>`);
  const excerpt = (entry.excerpt || '').slice(0,160);
  template = template.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${excerpt}" />`);
  template = template.replace(/<h1 class="hero__title">[\s\S]*?<\/h1>/, `<h1 class="hero__title">${entry.title}</h1>`);
  template = template.replace(/<p class="hero__subtitle">[\s\S]*?<\/p>/, `<p class="hero__subtitle">${excerpt}</p>`);
  template = template.replace(/<span class="blog-entry__date">[\s\S]*?<\/span>/, `<span class="blog-entry__date">${new Date().toLocaleDateString('es-CL')}</span>`);
  template = template.replace(/<span class="tag">Capítulo #[\s\S]*?<\/span>/, `<span class="tag">Capítulo #${entry.order}</span>`);
  template = template.replace(/href="[^"]*books[^"]*index.html"/, 'href="main.html"');
  template = template.replace(/<div class="blog-entry__content">[\s\S]*?<\/div>/, `<div class="blog-entry__content">\n${htmlContent}\n</div>`);
  return template;
}

async function generateMain(bookOutDir, bookMeta, manifest){
  const mainPath = path.join(bookOutDir, 'main.html');
  const lines = [];
  lines.push(`<!doctype html>`);
  lines.push(`<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${bookMeta.title}</title><link rel="stylesheet" href="../../css/styles.889d2a038d.css"></head><body>`);
  lines.push(`<main><section style="padding:1.5rem"><h1>${bookMeta.title}</h1><p>${bookMeta.description||''}</p><ol>`);
  for(const e of manifest){
    const outName = `${pad(e.order)}-${e.slug}.html`;
    lines.push(`<li><a href="${outName}">${e.title}</a></li>`);
  }
  lines.push(`</ol><p><a href="../../books.html">Volver a Lecturas</a></p></section></main></body></html>`);
  await fs.writeFile(mainPath, lines.join('\n'), 'utf8');
}

async function removeLegacyCaseVariants(booksRoot, canonicalDirName){
  const canonicalLower = canonicalDirName.toLowerCase();
  const existing = await fs.readdir(booksRoot, { withFileTypes: true });

  for(const item of existing){
    if(!item.isDirectory()) continue;
    if(item.name.toLowerCase() !== canonicalLower) continue;
    if(item.name === canonicalDirName) continue;

    await fs.rm(path.join(booksRoot, item.name), { recursive: true, force: true });
    console.log('Removed legacy directory variant:', item.name);
  }
}

async function run(){
  const repo = path.join(__dirname, '..');
  const assetsBooks = path.join(repo, 'assets', 'books');
  const booksRoot = path.join(repo, 'books');
  const templatePath = path.join(repo, 'templates', 'book-chapter-template.html');

  if(!await exists(assetsBooks)) { console.error('No assets/books'); process.exit(1); }
  if(!await exists(templatePath)) { console.error('Missing template', templatePath); process.exit(1); }

  const dirs = await fs.readdir(assetsBooks, { withFileTypes: true });
  const template = await fs.readFile(templatePath, 'utf8');

  for(const d of dirs){
    if(!d.isDirectory()) continue;
    const bookDir = path.join(assetsBooks, d.name);
    const manifestPath = path.join(bookDir, 'chapters_manifest.json');
    const metaPath = path.join(bookDir, 'metadata.json');
    if(!await exists(manifestPath)) continue;

    let manifest = [];
    try{ manifest = JSON.parse(await fs.readFile(manifestPath,'utf8')); }catch(e){ console.warn('Invalid manifest', d.name); continue; }

    let meta = { title: d.name, description: '', slug: d.name };
    if(await exists(metaPath)){
      try{ meta = JSON.parse(await fs.readFile(metaPath,'utf8')); }catch(e){}
    }

    const canonicalSlug = normalizeSlug(meta.slug || d.name) || normalizeSlug(d.name);
    if(meta.slug !== canonicalSlug){
      meta.slug = canonicalSlug;
      await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
      console.log('Normalized metadata slug for', d.name, '->', canonicalSlug);
    }

    await fs.mkdir(booksRoot, { recursive: true });
    await removeLegacyCaseVariants(booksRoot, canonicalSlug);

    const outDir = path.join(booksRoot, canonicalSlug);
    await fs.mkdir(outDir, { recursive: true });

    // publish or refresh every chapter so the HTML mirrors the Markdown sources
    let published = 0;
    for(const entry of manifest){
      const outName = `${pad(entry.order)}-${entry.slug}.html`;
      const outPath = path.join(outDir, outName);
      const mdPath = path.join(bookDir, entry.file);
      if(!await exists(mdPath)) { console.warn('Missing md', mdPath); continue; }
      const md = await fs.readFile(mdPath, 'utf8');
      const html = marked.parse(md);
      const rendered = await renderChapter(template, canonicalSlug, entry, html);
      const existingHtml = await exists(outPath) ? await fs.readFile(outPath, 'utf8') : '';
      const finalHtml = preserveCustomCover(rendered, existingHtml);
      await fs.writeFile(outPath, finalHtml, 'utf8');
      console.log('Published', outName, 'for', canonicalSlug);
      published++;
    }

    // regenerate main.html listing
    await generateMain(outDir, meta, manifest);
    if(published===0) console.log('No new chapters for', canonicalSlug);
  }
}

run().catch(e=>{ console.error(e); process.exit(1); });
