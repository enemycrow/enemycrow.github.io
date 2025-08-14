// Ejecuta con: node admin/server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

const POSTS_FILE = path.join(__dirname, "..", "posts.json");

app.use(express.json());

// Reutiliza los assets del sitio para que la vista previa use tus mismos estilos
app.use("/css",    express.static(path.join(__dirname, "..", "css")));
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));

// Devuelve todos los posts para cargarlos en el panel (edición)
app.get("/posts", (_req, res) => {
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, "utf8"));
  res.json(posts);
});

// Crea/actualiza un post
app.post("/save-post", (req, res) => {
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

app.listen(PORT, () =>
  console.log(`Panel de administración en http://localhost:${PORT}`)
);
