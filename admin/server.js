// Ejecuta con: node admin/server.js
const express  = require("express");
const fs       = require("fs");
const path     = require("path");
const crypto   = require("crypto");
const multer   = require("multer");
const { marked } = require("marked");
const { spawn }  = require("child_process");

const app  = express();
const PORT = 3000;
const HOST = "127.0.0.1";

const ROOT         = path.join(__dirname, "..");
const POSTS_FILE   = path.join(ROOT, "posts.json");
const FORTUNE_FILE = path.join(ROOT, "fortune_cookies.json");
const STORIES_FILE = path.join(ROOT, "stories.json");
const PRODUCTS_FILE= path.join(ROOT, "products.json");
const PORTFOLIO_FILE=path.join(ROOT, "portfolio_items.json");
const BOOKS_ROOT   = path.join(ROOT, "assets", "books");

const IMG_DIRS = {
  blog:    path.join(ROOT, "assets", "images", "blog"),
  social:  path.join(ROOT, "assets", "images", "social", "blog"),
  fortune: path.join(ROOT, "assets", "images", "social", "fortune_cookies"),
  stories: path.join(ROOT, "assets", "images", "stories"),
  oeuvres: path.join(ROOT, "assets", "images", "oeuvres"),
};

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
if (!ADMIN_TOKEN) {
  console.warn("[admin] ADMIN_TOKEN no definido. El panel opera sin autenticación.");
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function isAuthorized(token) {
  if (!ADMIN_TOKEN) return true;
  if (!token) return false;
  const a = Buffer.from(ADMIN_TOKEN, "utf8");
  const b = Buffer.from(token, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireAuth(req, res, next) {
  if (isAuthorized(req.get("x-admin-token"))) return next();
  res.status(401).json({ error: "Acceso no autorizado" });
}

// ── Helpers de JSON ───────────────────────────────────────────────────────────
function readJSON(file, fallback = []) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── Multer: subida de imágenes ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dest = IMG_DIRS[req.body.destino] || IMG_DIRS.blog;
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename(_req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    cb(null, file.mimetype.startsWith("image/"));
  },
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use("/css",    express.static(path.join(ROOT, "css")));
app.use("/assets", express.static(path.join(ROOT, "assets")));
app.use("/stories.json", requireAuth, (_req, res) => res.json(readJSON(STORIES_FILE)));

// ── Subida de imágenes ────────────────────────────────────────────────────────
app.post("/upload-image", requireAuth, (req, res, next) => {
  // multer necesita leer body.destino ANTES del diskStorage → usamos fields
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Sin archivo" });

    const destino = req.body.destino || "blog";
    const relDir  = {
      blog:    "assets/images/blog",
      social:  "assets/images/social/blog",
      fortune: "assets/images/social/fortune_cookies",
      stories: "assets/images/stories",
      oeuvres: "assets/images/oeuvres",
    }[destino] || "assets/images/blog";

    res.json({ ok: true, path: `/${relDir}/${req.file.originalname}` });
  });
});

// ── Blog posts ────────────────────────────────────────────────────────────────
app.get("/posts", requireAuth, (_req, res) => res.json(readJSON(POSTS_FILE)));

app.post("/save-post", requireAuth, (req, res) => {
  const post  = req.body;
  const posts = readJSON(POSTS_FILE);

  // Renderizar markdown si llegó contenido_md sin contenido_html
  if (post.contenido_md && !post.contenido_html) {
    post.contenido_html = marked.parse(post.contenido_md);
  }

  const idx = posts.findIndex(p => p.id === post.id);
  if (idx >= 0) posts[idx] = { ...posts[idx], ...post };
  else posts.push(post);

  writeJSON(POSTS_FILE, posts);

  if (post.triggerRebuild) {
    const child = spawn("node", ["tools/generate-blog-pages.js", "--incremental"], {
      cwd: ROOT, detached: true, stdio: "ignore",
    });
    child.unref();
    return res.json({ ok: true, rebuilding: true });
  }

  res.json({ ok: true });
});

app.delete("/delete-post", requireAuth, (req, res) => {
  const id    = Number(req.query.id);
  const posts = readJSON(POSTS_FILE).filter(p => p.id !== id);
  writeJSON(POSTS_FILE, posts);
  res.json({ ok: true });
});

// ── Fortune cookies ───────────────────────────────────────────────────────────
app.get("/fortune-cookies", requireAuth, (_req, res) => res.json(readJSON(FORTUNE_FILE)));

app.post("/save-fortune-cookie", requireAuth, (req, res) => {
  const item  = req.body;
  const items = readJSON(FORTUNE_FILE);
  const idx   = items.findIndex(i => i.id === item.id);
  if (idx >= 0) items[idx] = { ...items[idx], ...item };
  else items.push(item);
  writeJSON(FORTUNE_FILE, items);
  res.json({ ok: true });
});

app.delete("/delete-fortune-cookie", requireAuth, (req, res) => {
  const id    = Number(req.query.id);
  const items = readJSON(FORTUNE_FILE).filter(i => i.id !== id);
  writeJSON(FORTUNE_FILE, items);
  res.json({ ok: true });
});

// ── Historias (donate) ────────────────────────────────────────────────────────
app.get("/stories", requireAuth, (_req, res) => res.json(readJSON(STORIES_FILE)));

app.post("/save-story", requireAuth, (req, res) => {
  const item  = req.body;
  const items = readJSON(STORIES_FILE);
  const idx   = items.findIndex(i => i.slug === item.slug);
  if (idx >= 0) items[idx] = { ...items[idx], ...item };
  else items.push(item);
  writeJSON(STORIES_FILE, items);
  res.json({ ok: true });
});

app.delete("/delete-story", requireAuth, (req, res) => {
  const slug  = req.query.slug;
  const items = readJSON(STORIES_FILE).filter(i => i.slug !== slug);
  writeJSON(STORIES_FILE, items);
  res.json({ ok: true });
});

// ── Productos ─────────────────────────────────────────────────────────────────
app.get("/products", requireAuth, (_req, res) => res.json(readJSON(PRODUCTS_FILE)));

app.post("/save-product", requireAuth, (req, res) => {
  const item  = req.body;
  const items = readJSON(PRODUCTS_FILE);
  const idx   = items.findIndex(i => i.id === item.id);
  if (idx >= 0) items[idx] = { ...items[idx], ...item };
  else items.push(item);
  writeJSON(PRODUCTS_FILE, items);
  res.json({ ok: true });
});

app.delete("/delete-product", requireAuth, (req, res) => {
  const id    = Number(req.query.id);
  const items = readJSON(PRODUCTS_FILE).filter(i => i.id !== id);
  writeJSON(PRODUCTS_FILE, items);
  res.json({ ok: true });
});

// ── Portfolio / Obras ─────────────────────────────────────────────────────────
app.get("/portfolio-items", requireAuth, (_req, res) => {
  res.json(fs.existsSync(PORTFOLIO_FILE) ? readJSON(PORTFOLIO_FILE) : []);
});

app.post("/save-portfolio-item", requireAuth, (req, res) => {
  const item  = req.body;
  const items = fs.existsSync(PORTFOLIO_FILE) ? readJSON(PORTFOLIO_FILE) : [];
  const idx   = items.findIndex(i => i.slug === item.slug);
  if (idx >= 0) items[idx] = { ...items[idx], ...item };
  else items.push(item);
  writeJSON(PORTFOLIO_FILE, items);
  res.json({ ok: true });
});

app.delete("/delete-portfolio-item", requireAuth, (req, res) => {
  const slug  = req.query.slug;
  const items = (fs.existsSync(PORTFOLIO_FILE) ? readJSON(PORTFOLIO_FILE) : [])
    .filter(i => i.slug !== slug);
  writeJSON(PORTFOLIO_FILE, items);
  res.json({ ok: true });
});

// ── Libros ────────────────────────────────────────────────────────────────────
app.get("/books", requireAuth, (_req, res) => {
  if (!fs.existsSync(BOOKS_ROOT)) return res.json([]);
  const dirs = fs.readdirSync(BOOKS_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const metaPath = path.join(BOOKS_ROOT, d.name, "metadata.json");
      const meta = fs.existsSync(metaPath) ? readJSON(metaPath, {}) : {};
      return { dir: d.name, metadata: meta };
    });
  res.json(dirs);
});

app.get("/books/:slug/chapters", requireAuth, (req, res) => {
  const bookDir  = path.join(BOOKS_ROOT, req.params.slug);
  const manifest = path.join(bookDir, "chapters_manifest.json");
  if (!fs.existsSync(bookDir)) return res.status(404).json({ error: "Libro no encontrado" });

  const chapters = fs.existsSync(manifest) ? readJSON(manifest, []) : [];
  const chaptersWithContent = chapters.map(ch => {
    const mdPath = path.join(bookDir, "chapters", ch.file);
    return { ...ch, content: fs.existsSync(mdPath) ? fs.readFileSync(mdPath, "utf8") : "" };
  });
  res.json(chaptersWithContent);
});

app.post("/books/:slug/save-chapter", requireAuth, (req, res) => {
  const { slug }   = req.params;
  const { order, title, chapterSlug, content } = req.body;
  const bookDir    = path.join(BOOKS_ROOT, slug);
  const chaptersDir= path.join(bookDir, "chapters");
  const manifestPath = path.join(bookDir, "chapters_manifest.json");

  fs.mkdirSync(chaptersDir, { recursive: true });

  const padded   = String(order).padStart(2, "0");
  const fileName = `${padded}-${chapterSlug}.md`;
  fs.writeFileSync(path.join(chaptersDir, fileName), content, "utf8");

  const manifest = fs.existsSync(manifestPath) ? readJSON(manifestPath, []) : [];
  const idx = manifest.findIndex(c => c.slug === chapterSlug);
  const entry = { order, title, slug: chapterSlug, file: fileName };
  if (idx >= 0) manifest[idx] = { ...manifest[idx], ...entry };
  else manifest.push(entry);
  manifest.sort((a, b) => a.order - b.order);
  writeJSON(manifestPath, manifest);

  res.json({ ok: true, file: fileName });
});

app.post("/books/:slug/save-metadata", requireAuth, (req, res) => {
  const metaPath = path.join(BOOKS_ROOT, req.params.slug, "metadata.json");
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  writeJSON(metaPath, req.body);
  res.json({ ok: true });
});

app.post("/books/:slug/publish", requireAuth, (req, res) => {
  const child = spawn("node", ["scripts/publish_chapters.js"], {
    cwd: ROOT, detached: true, stdio: "ignore",
  });
  child.unref();
  res.json({ ok: true, publishing: true });
});

// ── Panel ─────────────────────────────────────────────────────────────────────
app.use(express.static(__dirname));

app.listen(PORT, HOST, () =>
  console.log(`Panel de administración en http://${HOST}:${PORT}`)
);
