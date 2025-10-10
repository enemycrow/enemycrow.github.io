// Ejecuta con: node admin/server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const app = express();
const PORT = 3000;
const HOST = "127.0.0.1";

const POSTS_FILE = path.join(__dirname, "..", "posts.json");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.warn(
    "[admin] ADMIN_TOKEN no está definido. Establece ADMIN_TOKEN en el entorno para proteger el panel."
  );
}

function isAuthorized(token) {
  if (!ADMIN_TOKEN) return true;
  if (!token) return false;

  const expected = Buffer.from(ADMIN_TOKEN, "utf8");
  const received = Buffer.from(token, "utf8");

  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(expected, received);
}

function requireAuth(req, res, next) {
  if (isAuthorized(req.get("x-admin-token"))) {
    next();
    return;
  }

  res.status(401).json({ error: "Acceso no autorizado" });
}

app.use(express.json());

// Reutiliza los assets del sitio para que la vista previa use tus mismos estilos
app.use("/css",    express.static(path.join(__dirname, "..", "css")));
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));

// Devuelve todos los posts para cargarlos en el panel (edición)
app.get("/posts", requireAuth, (_req, res) => {
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, "utf8"));
  res.json(posts);
});

// Crea/actualiza un post
app.post("/save-post", requireAuth, (req, res) => {
  const post  = req.body;
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, "utf8"));

  const idx = posts.findIndex(p => p.id === post.id);
  if (idx >= 0) posts[idx] = post;
  else posts.push(post);

  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  res.json({ ok: true });
});

// Sirve la interfaz del panel
app.use(express.static(__dirname));

app.listen(PORT, HOST, () =>
  console.log(`Panel de administración en http://${HOST}:${PORT}`)
);
