const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const inputDir = path.join(__dirname, '..', 'assets', 'images');
const outputDir = path.join(inputDir, 'responsive');
const EXCLUDED_DIRS = new Set(['responsive', 'instagram']);
const sizes = [400, 800, 1200];

// ---- CLI flags
const argv = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  })
);
const OVERWRITE = !!argv.overwrite;
const VERBOSE   = !!argv.verbose;
const PRESET    = (argv.preset || 'photo').toString(); // 'photo' | 'illustration'

// ---- presets de calidad
function webpOptionsForPreset(preset) {
  if (preset === 'illustration') {
    // Ideal para arte/dibujo/lineart: muy alta fidelidad
    return {
      nearLossless: true,  // usa compresor near-lossless
      quality: 90,         // controla la cuantización previa
      effort: 4,
      smartSubsample: true
    };
  }
  // preset 'photo' ≈ tu Python (Pillow) quality=85
  return {
    quality: 85,
    effort: 4,
    smartSubsample: true
  };
}

// utils
async function exists(p) { try { await fs.stat(p); return true; } catch { return false; } }
async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

async function processFile(fullPath) {
  const relPath = path.relative(inputDir, fullPath);
  const parsed = path.parse(relPath);
  const webpOpts = webpOptionsForPreset(PRESET);

  for (const size of sizes) {
    const outDir  = path.join(outputDir, parsed.dir);
    const outPath = path.join(outDir, `${parsed.name}-${size}.webp`);

    await ensureDir(outDir);

    if (!OVERWRITE && await exists(outPath)) {
      if (VERBOSE) console.log(`[skip] ${outPath} (ya existe)`);
      continue;
    }

    if (VERBOSE) console.log(`[make] ${outPath} ← ${relPath} (${size}w, preset=${PRESET})`);

    let pipeline = sharp(fullPath)
      .resize({ width: size, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' })
      .webp(webpOpts);

    // Evita metadatos para binarios más deterministas
    // (sharp no añade metadata por defecto; dejamos explícito por claridad)
    // pipeline = pipeline.withMetadata({ }); // no usar para no insertar perfiles

    await pipeline.toFile(outPath);
  }
}

async function processDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      await processDirectory(fullPath);
    } else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
      await processFile(fullPath);
    }
  }
}

async function run() {
  const files = Object.keys(argv).filter(k => !k.startsWith('--'));
  if (files.length) {
    for (const file of files) {
      if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
      await processFile(path.resolve(file));
    }
  } else {
    await processDirectory(inputDir);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
