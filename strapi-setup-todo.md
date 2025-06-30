
# 🧩 TO DO: Implementación de Strapi con tu sitio actual

## 🛠️ 1. Preparar el entorno de desarrollo
- [x] Tener instalado:
  - ✅ Node.js (LTS v20 o v22)
  - ✅ npm (v6+)
  - ✅ Git
  - ☐ Python (opcional, si se usa SQLite)
- [ ] Crear una carpeta de proyecto para Strapi separada de tu sitio HTML.

## 🚀 2. Instalar Strapi
```bash
npx create-strapi-app@latest my-strapi-blog --quickstart
```
- [ ] Esperar a que el panel se levante en `http://localhost:1337/admin`
- [ ] Crear tu primer usuario administrador

## 🧱 3. Modelar el contenido en Strapi
- [ ] Crear una colección `post` o `entrada`
  - Campos recomendados:
    - `title` (Texto)
    - `slug` (UID, basado en título)
    - `content` (Rich Text)
    - `image` (Media, imagen destacada)
    - `published_at` (DateTime)
- [ ] Habilitar la visibilidad pública en *Settings > Roles > Public*:
  - Marcar acceso a `find` y `findOne` para `/posts`

## 🌐 4. Conectar tu frontend con Strapi
- [ ] Crear un archivo `blog.js` en tu sitio
- [ ] Usar `fetch` para consumir la API:
```js
fetch('http://localhost:1337/api/posts?populate=*')
  .then(res => res.json())
  .then(data => {
    // Mostrar data en tu HTML
  });
```
- [ ] Adaptar el diseño de tarjetas/blog del frontend para insertar dinámicamente:
  - Imagen destacada
  - Título
  - Extracto o parte del contenido
  - Botón “Leer más”

## 🖼️ 5. Crear plantilla para una entrada individual
- [ ] Crear un HTML base para `/post.html`
- [ ] Enviar el `slug` por la URL (`post.html?slug=el-viaje`)
- [ ] Cargar el post con:
```js
fetch('http://localhost:1337/api/posts?filters[slug][$eq]=el-viaje&populate=*')
```

## 🧪 6. Probar y ajustar
- [ ] Subir varias entradas
- [ ] Verificar carga correcta de imágenes
- [ ] Validar que se vea bien en desktop y mobile

## ☁️ 7. (Opcional) Despliegue
- [ ] Subir Strapi a un servidor (Railway, Render, VPS, o Strapi Cloud)
- [ ] Apuntar la API pública a ese dominio
- [ ] Asegurar CORS y HTTPS
- [ ] Cambiar rutas `http://localhost:1337` por tu nuevo dominio

## 💡 Bonus opcionales
- [ ] Agregar paginación
- [ ] Agregar categorías/tags
- [ ] Crear un buscador
- [ ] Editor de Markdown
