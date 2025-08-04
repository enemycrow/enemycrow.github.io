const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;

function findCurrentFile(dir, base, ext) {
  const files = fs.readdirSync(dir);
  const match = files.find(f => f.startsWith(base) && f.endsWith(ext));
  if (!match) {
    throw new Error(`No file found for ${base}${ext} in ${dir}`);
  }
  return match;
}

function versionAsset(asset) {
  const dir = path.join(root, asset.dir);
  const currentName = findCurrentFile(dir, asset.base, asset.ext);
  const currentPath = path.join(dir, currentName);
  const content = fs.readFileSync(currentPath);
  const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 10);
  const newName = `${asset.base}.${hash}${asset.ext}`;
  const newPath = path.join(dir, newName);

  fs.renameSync(currentPath, newPath);
  return { oldName: currentName, newName };
}

function updateReferences(dir, replacements) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      updateReferences(fullPath, replacements);
    } else if (entry.isFile()) {
      const isHtml = fullPath.endsWith('.html');
      const isSW = path.basename(fullPath) === 'sw.js';
      if (isHtml || isSW) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let replaced = content;
        for (const { oldName, newName } of replacements) {
          replaced = replaced.split(oldName).join(newName);
        }
        if (replaced !== content) {
          fs.writeFileSync(fullPath, replaced);
        }
      }
    }
  }
}

const assets = [
  { dir: 'css', base: 'styles', ext: '.css' },
  { dir: 'js', base: 'main', ext: '.js' },
];

const replacements = assets.map(versionAsset);
updateReferences(root, replacements);

console.log('Versioned assets:', replacements);
