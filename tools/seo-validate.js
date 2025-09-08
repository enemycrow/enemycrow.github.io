// SEO validator: quick checks for required tags per page
// Usage: node tools/seo-validate.js

const fs = require('fs');
const path = require('path');

// Validamos solo las páginas de obras generadas (portfolio/)
const includeDirs = ['portfolio'];
const exclude = new Set(['node_modules', '.git', 'vendor', 'public']);

function walk(dir){
  const out=[];
  for(const e of fs.readdirSync(dir, { withFileTypes:true })){
    if(e.name.startsWith('.')) continue;
    if(exclude.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if(e.isDirectory()) out.push(...walk(p));
    else if(e.isFile() && e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function has(re, html){ return re.test(html); }

function validate(file){
  const html = fs.readFileSync(file, 'utf8');
  const errs = [];
  const tMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if(!tMatch || (tMatch[1].trim().length < 5)) errs.push('title');
  if(!has(/<meta\s+name=["']description["']\s+content=["'][^"']{20,}["']/i, html)) errs.push('meta description');
  // canonical
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if(!canonicalMatch) errs.push('canonical');
  else {
    const url = canonicalMatch[1];
    if(!/^https:\/\/plumafarollama\.com\//.test(url)) errs.push('canonical-domain');
  }
  if(!has(/property=["']og:title["']/i, html)) errs.push('og:title');
  if(!has(/property=["']og:description["']/i, html)) errs.push('og:description');
  if(!has(/property=["']og:type["'][^>]*content=["']book["']/i, html)) errs.push('og:type=book');
  // og:url
  const ogUrlMatch = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
  if(!ogUrlMatch) errs.push('og:url');
  else { if(!/^https:\/\/plumafarollama\.com\//.test(ogUrlMatch[1])) errs.push('og:url-domain'); }
  // og:image (al menos una) y que apunten al dominio
  const ogImages = [...html.matchAll(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi)].map(m=>m[1]);
  if(ogImages.length===0) errs.push('og:image');
  else {
    if(ogImages.some(u=>!/^https:\/\/plumafarollama\.com\//.test(u))) errs.push('og:image-domain');
  }
  if(!has(/name=["']twitter:card["'][^>]*summary_large_image/i, html)) errs.push('twitter:card');
  if(!has(/name=["']twitter:title["']/i, html)) errs.push('twitter:title');
  if(!has(/name=["']twitter:description["']/i, html)) errs.push('twitter:description');
  const twImgMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
  if(!twImgMatch) errs.push('twitter:image');
  else { if(!/^https:\/\/plumafarollama\.com\//.test(twImgMatch[1])) errs.push('twitter:image-domain'); }
  if(!has(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/i, html)) errs.push('JSON-LD');
  return errs;
}

let failed = false;
const files=[]; includeDirs.forEach(d=>{ if(fs.existsSync(d)) files.push(...walk(d)); });
// Ignorar ejemplo legacy si existe
const skip = new Set(['portfolio/galactique.html']);
for(const f of files){
  if(skip.has(f.replace(/\\/g,'/'))) continue;
  const errs = validate(f);
  if(errs.length){
    failed = true;
    console.log(`SEO missing in ${f}: ${errs.join(', ')}`);
  }
}

if(failed){
  process.exitCode = 1;
  console.log('SEO validation found issues.');
} else {
  console.log('SEO validation passed.');
}
