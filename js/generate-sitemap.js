// generate-sitemap.js (extendido)

const fs = require('fs');
const path = require('path');

// Dominio del sitio
const baseUrl = 'https://plumafarollama.com';

// Directorios a incluir
const includeDirs = ['.', 'portfolio'];
// Directorios a excluir
const exclude = new Set(['node_modules', '.git', 'vendor', 'public']);

// Reglas Disallow del robots.txt
function loadDisallowRules() {
  const robotsPath = path.join(process.cwd(), 'robots.txt');
  if (!fs.existsSync(robotsPath)) return [];

  const content = fs.readFileSync(robotsPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const rules = [];

  for (const line of lines) {
    const match = line.match(/^\s*Disallow:\s*(\S+)/i);
    if (!match) continue;
    let rule = match[1].trim();
    if (!rule) continue;

    if (!rule.startsWith('/')) rule = `/${rule}`;
    if (rule.length > 1) rule = rule.replace(/\/+$/, '');
    rules.push(rule);
  }

  return rules;
}

const disallowRules = loadDisallowRules();

function isDisallowed(relPath) {
  if (!relPath) return false;
  const normalizedPath = `/${relPath.replace(/\\/g, '/')}`;
  return disallowRules.some(rule => {
    if (rule === '/') return true;
    return normalizedPath === rule || normalizedPath.startsWith(`${rule}/`);
  });
}

function walk(dir){
  const out = [];
  for(const entry of fs.readdirSync(dir, { withFileTypes: true })){
    if(entry.name.startsWith('.')) continue;
    if(exclude.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    const relPath = path.relative('.', p);
    if(isDisallowed(relPath)) continue;
    if(entry.isDirectory()) out.push(...walk(p));
    else if(entry.isFile() && entry.name.endsWith('.html')) out.push(relPath);
  }
  return out;
}

function fileToUrl(file){
  const rel = file.replace(/\\/g,'/');
  const loc = rel === 'index.html' ? '' : `/${rel}`;
  const url = `${baseUrl}${loc}`;
  const stat = fs.statSync(file);
  const lastmod = stat.mtime.toISOString();
  let priority = 0.6, changefreq = 'monthly';
  if(rel === 'index.html') { priority = 1.0; changefreq = 'weekly'; }
  else if(rel === 'portfolio.html') { priority = 0.9; changefreq = 'weekly'; }
  else if(rel.startsWith('portfolio/')) { priority = 0.7; changefreq = 'monthly'; }
  return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`;
}

let files = [];
for(const d of includeDirs){ if(fs.existsSync(d)) files.push(...walk(d)); }

files = files.filter(file => !isDisallowed(file));

const urls = files.map(fileToUrl).join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

fs.writeFileSync('sitemap.xml', sitemap);
console.log(`Sitemap generado: ${files.length} URLs`);

