// generate-sitemap.js

const fs = require('fs');
const path = require('path');

// Cambia esto por tu dominio final
const baseUrl = 'https://plumafarollama.com';

const folderPath = './'; // donde están tus archivos .html
const files = fs.readdirSync(folderPath);

const urls = files
  .filter(file => file.endsWith('.html') || file === 'index.html')
  .map(file => {
    const loc = file === 'index.html' ? '' : `/${file}`;
    return `<url><loc>${baseUrl}${loc}</loc></url>`;
  });

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

fs.writeFileSync('sitemap.xml', sitemap);
console.log('✅ Sitemap generado con éxito!');
