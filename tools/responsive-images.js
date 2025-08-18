const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const inputDir = path.join(__dirname, '..', 'assets', 'images');
const outputDir = path.join(inputDir, 'responsive');
const sizes = [400, 800, 1200];

async function processDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(inputDir, fullPath);

    if (entry.isDirectory()) {
      if (entry.name === 'responsive') continue;
      await processDirectory(fullPath);
    } else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
      const parsed = path.parse(relPath);
      for (const size of sizes) {
        const outDir = path.join(outputDir, parsed.dir);
        const outPath = path.join(outDir, `${parsed.name}-${size}${parsed.ext}`);
        await fs.mkdir(outDir, { recursive: true });
        await sharp(fullPath).resize({ width: size }).toFile(outPath);
      }
    }
  }
}

processDirectory(inputDir).catch(err => {
  console.error(err);
  process.exit(1);
});
