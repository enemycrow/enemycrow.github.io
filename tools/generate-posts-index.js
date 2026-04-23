#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const src  = path.join(ROOT, 'posts.json');
const dest = path.join(ROOT, 'posts-index.json');

const posts = JSON.parse(fs.readFileSync(src, 'utf8'));

const index = posts.map(({ contenido_html, ...rest }) => rest);

fs.writeFileSync(dest, JSON.stringify(index), 'utf8');

const srcKB  = Math.round(fs.statSync(src).size  / 1024);
const destKB = Math.round(fs.statSync(dest).size / 1024);
console.log(`posts-index.json generado: ${destKB} KB (antes: ${srcKB} KB)`);
