const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const inputDir = path.join(__dirname, '..', 'assets', 'images');
const outputDir = path.join(inputDir, 'responsive');
const sizes = [400, 800, 1200];

// flags CLI
const OVERWRITE = process.argv.includes('--overwrite');
const VERBOSE   = process.argv.includes('--verbose');

// util: existe archivo?
async function exists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function processFile(fullPath) {
  const relPath = path.relative(inputDir, fullPath);
  const parsed = path.parse(relPath);

  for (const size of sizes) {
    const outDir  = path.join(outputDir, parsed.dir);
    const outPath = path.join(outDir, `${parsed.name}-${size}${parsed.ext}`);

    await ensureDir(outDir);

    // ⛔ no sobrescribir si ya existe (a menos que --overwrite)
    if (!OVERWRITE && await exists(outPath)) {
      if (VERBOSE) console.log(`[skip] ${outPath} (ya existe)`);
      continue;
    }

    if (VERBOSE) console.log(`[make] ${outPath}`);

    // parámetros deterministas (ajusta a tu gusto)
    // Si la extensión de salida es .webp aplicamos opciones WebP:
    const isWebp = /\.webp$/i.test(parsed.ext);

    const pipeline = sharp(fullPath).resize({ width: size });

    if (isWebp) {
      pipeline.webp({
        quality: 90,   // usa tu curva de calidad
        effort: 4,     // costo de compresión 0-6
        // lossless: false, // descomenta si hace falta
        // nearLossless: false
      });
    }
    // Nota: si también generas .jpg/.png, puedes setear .jpeg({quality:…}) / .png({…})

    await pipeline.toFile(outPath);
  }
}

async function processDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'responsive') continue; // no re-entrar en la salida
      await processDirectory(fullPath);
    } else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
      await processFile(fullPath);
    }
  }
}

async function run() {
  const files = process.argv.filter(a => !a.startsWith('--')).slice(2);
  if (files.length) {
    for (const file of files) {
      if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
      const fullPath = path.resolve(file);
      await processFile(fullPath);
    }
  } else {
    await processDirectory(inputDir);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
