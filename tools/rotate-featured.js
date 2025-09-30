#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const POSTS = path.join(ROOT, 'posts.json');
const OUT = path.join(ROOT, 'featured.json');

function readPosts() {
  if (!fs.existsSync(POSTS)) throw new Error('posts.json not found');
  return JSON.parse(fs.readFileSync(POSTS, 'utf8'));
}

function shuffle(array, seed) {
  // simple deterministic shuffle using seed (number)
  const a = array.slice();
  let s = seed >>> 0;
  function rnd() {
    s = Math.imul(s + 0x6D2B79F5, 1);
    s = (s ^ (s >>> 15)) >>> 0;
    return (s % 10000) / 10000;
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function seedFromDate(date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return Number(`${y}${m}${d}`) || Date.now();
}

function usage() {
  console.log('Usage: node tools/rotate-featured.js [--count N] [--force slug1,slug2]');
  process.exit(0);
}

const args = process.argv.slice(2);
let count = 3;
let force = null;
for (const a of args) {
  if (a.startsWith('--count=')) count = Number(a.split('=')[1]) || count;
  else if (a.startsWith('--force=')) force = a.split('=')[1];
  else if (a === '--help') usage();
}

try {
  const posts = readPosts().filter(p => {
    const d = new Date(p.fecha);
    d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return !isNaN(d.getTime()) && d <= t;
  });

  let selected = [];
  if (force) {
    const slugs = force.split(',').map(s => s.trim()).filter(Boolean);
    for (const s of slugs) {
      const p = posts.find(x => String(x.slug) === s || String(x.id) === s);
      if (p) selected.push(p);
    }
  }

  if (selected.length < count) {
    const pool = posts.filter(p => !selected.find(s => s.id === p.id));
    const seed = seedFromDate(new Date());
    const shuffled = shuffle(pool, seed);
    for (const p of shuffled) {
      if (selected.length >= count) break;
      selected.push(p);
    }
  }

  const out = selected.slice(0, count).map(p => ({ id: p.id, slug: p.slug }));
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote ${OUT} with ${out.length} items.`);
} catch (err) {
  console.error('Error:', err.message);
  process.exit(2);
}
