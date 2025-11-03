#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const POSTS_PATH = path.join(process.cwd(), 'posts.json');

function readPosts() {
  if (!fs.existsSync(POSTS_PATH)) {
    console.error('posts.json not found at', POSTS_PATH);
    process.exit(2);
  }
  try {
    return JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'));
  } catch (e) {
    console.error('Failed to parse posts.json:', e.message);
    process.exit(2);
  }
}

function writePosts(posts) {
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2) + '\n', 'utf8');
}

function makeImagenVerticalFromImagen(imagen) {
  if (!imagen || typeof imagen !== 'string') return '';
  // Remove extension
  return imagen.replace(/\.[^.]+$/, '') + '-ig.png';
}

function main() {
  const posts = readPosts();
  if (!Array.isArray(posts)) {
    console.error('posts.json does not contain an array');
    process.exit(2);
  }

  const updated = [];
  for (const post of posts) {
    if (!post) continue;
    const hasField = Object.prototype.hasOwnProperty.call(post, 'imagen_vertical');
    const empty = !post.imagen_vertical;
    if (!hasField || empty) {
      if (post.imagen && typeof post.imagen === 'string') {
        const candidate = makeImagenVerticalFromImagen(post.imagen);
        post.imagen_vertical = candidate;
        updated.push({ id: post.id, slug: post.slug, imagen_vertical: candidate });
      } else {
        // no imagen to derive from — leave as empty string
        if (!hasField) post.imagen_vertical = '';
      }
    }
  }

  if (updated.length) {
    writePosts(posts);
    console.log(`Updated ${updated.length} posts with imagen_vertical:`);
    updated.forEach(u => console.log(` - id=${u.id} slug=${u.slug} => ${u.imagen_vertical}`));
    process.exit(0);
  }

  console.log('No posts needed updating.');
}

main();
