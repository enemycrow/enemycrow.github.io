# La Pluma, el Faro y la Llama

Este repositorio contiene el sitio web de **La Pluma, el Faro y la Llama**, un proyecto colaborativo donde tres autores de habla hispana comparten sus historias, reflexiones y servicios creativos. El sitio incluye páginas de presentación, portafolio, blog, servicios y un formulario de contacto. Está construido como un sitio estático usando HTML, CSS y un poco de JavaScript, y se publica a través de [Firebase Hosting](https://firebase.google.com/docs/hosting).

## Requisitos Previos

- Tener instalado [Node.js](https://nodejs.org/) en tu máquina.
- Instalar la [Firebase CLI](https://firebase.google.com/docs/cli) de forma global:
  ```bash
  npm install -g firebase-tools
  ```
  Si prefieres ejecutar el generador automáticamente antes de hacer commit tienes varias opciones:
- Instalar las dependencias de PHP con [Composer](https://getcomposer.org/):
  ```bash
  composer install
  ```

## Desarrollo Local
  Automatizar en CI (recomendado para equipos): crear un workflow que, al hacer push sobre `posts.json`, ejecute la generación y opcionalmente haga commit/push de `blog/` o despliegue.
## Despliegue

Antes de publicar, ejecuta el script de versionado para regenerar los nombres con hash y actualizar las referencias en los archivos HTML y el service worker:

```bash
npm run version
```

Luego, publica la versión más reciente del sitio en Firebase Hosting:

```bash
firebase deploy
```

Las opciones de despliegue se encuentran en `.firebaserc` y `firebase.json`.

### Publicación automática

- Cada push a `main` ejecuta [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- Las pruebas (`npm test`) y el build se ejecutan automáticamente.
- El artefacto generado se publica en GitHub Pages.
- Recuerda configurar el secreto `FIREBASE_TOKEN` si aplica.

## Plan del Proyecto

El plan de trabajo (en español) se encuentra en el archivo [todo.md](todo.md).

## Archivos CSS Históricos

Las hojas `css/about.css`, `css/blog.css`, `css/contact.css`,
`css/home.css`, `css/portfolio.css` y `css/services.css` se usaron en las primeras versiones del proyecto. Todo su
contenido se consolidó en `css/styles.css`, por lo que se
eliminaron para simplificar el repositorio.

## Blog Dinámico

El diario de creación funciona de forma totalmente dinámica usando el archivo `posts.json`.
Cada entrada del archivo debe incluir los siguientes campos:

- `id`: identificador numérico único
- `titulo`: título de la entrada
- `autor`: nombre del autor
- `fecha`: en formato `YYYY-MM-DD`
- `categoria_temas`: lista de temas (ej. `["Proceso Creativo"]`)
- `categoria_libros`: lista de libros asociados (puede ser vacía)
- `tiempo`: tiempo estimado de lectura
- `comentarios`: número de comentarios
- `fragmento`: breve resumen que aparece en la tarjeta
- `imagen`: nombre de la imagen horizontal almacenada en `assets/images/`
- `imagen_vertical`: ruta relativa dentro del repositorio (por ejemplo `assets/images/vertical/soledadenelarroyo-post97-portrait.webp`) a la versión vertical en formato `.webp`. Si no existe, deja una cadena vacía.
- `slug`: identificador para la URL (ej. `algoritmos-del-caos`)
- `destacado`: marca la entrada como destacada si su valor es `true`
- `contenido_html`: cuerpo completo en HTML para `blog-entry.html`

Para agregar una nueva entrada basta con editar `posts.json` y colocar la imagen correspondiente en `assets/images/`.
Las páginas `blog.html` y `blog-entry.html` cargan este archivo mediante JavaScript, por lo que no es necesario modificar el HTML.

Las galletas expuestas en `fortune_cookies.json` siguen un esquema similar:

- `id`: identificador numérico único
- `personaje`: nombre del personaje asociado
- `mensaje`: texto a mostrar en la galleta
- `imagen`: nombre del recurso horizontal principal (ubicado dentro de `assets/images/`)
- `imagen_vertical`: ruta relativa dentro del repositorio a la variante vertical en formato `.webp` (por ejemplo `assets/images/fortune/portrait/sunfelicity-fortune50.webp`). Usa una cadena vacía cuando no exista.
- `slug`: identificador legible en URLs
- `prompt`: referencia descriptiva para la generación visual
- `tags`: lista de etiquetas temáticas
- `fecha`: fecha de publicación en formato `YYYY-MM-DD`

### Rotador y forzado de entradas destacadas (modo pruebas / control)

Hemos añadido una herramienta para generar y forzar la lista de entradas destacadas de forma local o en CI. Esto es útil para pruebas, campañas o para bloquear una selección concreta mientras se revisa el sitio.

- Nuevo comando npm:

```powershell
npm run rotate-featured
```

Por defecto genera `featured.json` en la raíz del proyecto con 3 entradas (seleccionadas de forma determinista según la fecha). `blog.html` intentará primero leer `featured.json` y, si existe, usará su contenido para mostrar los destacados en lugar del rotador automático.

Opciones:

- `--count=N` — número de entradas a generar (ej. `npm run rotate-featured -- --count=5`).
- `--force=slug1,slug2` — forzar una lista concreta de slugs (en ese orden). Ejemplo:

```powershell
npm run rotate-featured -- --force=draco-habla-de-un-amor-espiritual,producir-un-ciclo-cerrar-un-viaje
```

Qué hace el script `tools/rotate-featured.js`:

- Lee `posts.json` (filtra publicaciones futuras) y crea `featured.json` con una lista de entradas (`id` y `slug`).
- Si pasas `--force`, intentará encontrar esos slugs/ids y los colocará al inicio de la lista; el resto se completa automáticamente hasta `--count`.

Uso manual rápido (sin Node): crea un archivo `featured.json` en la raíz con este formato y recarga `blog.html`:

```json
[
  {"id":68,"slug":"draco-habla-de-un-amor-espiritual"},
  {"id":66,"slug":"producir-un-ciclo-cerrar-un-viaje"},
  {"id":65,"slug":"el-amor-no-lo-es-todo-el-cierre-de-un-ciclo"}
]
```

Notas:

- `blog.html` todavía utiliza su rotador diario determinista si `featured.json` no existe o no puede leerse.
- Para pruebas locales asegúrate de recargar con la caché deshabilitada (DevTools > Network > Disable cache) o borrar `featured.json` si quieres volver al comportamiento automático.
- El número de huecos mostrados también puede ajustarse desde el HTML con `data-featured-count="N"` en el contenedor `#featured-posts-container`.

Además, el contenido se guarda en `localStorage` bajo la clave `postsData` para acelerar visitas posteriores.

Si colocas `"destacado": true` en una entrada, aparecerá en la sección de entradas destacadas al inicio de `blog.html`.

### Publicación programada

Para manejar publicaciones futuras sin exponerlas todavía en el blog, utiliza un archivo de _staging_ (por ejemplo `posts-pendientes.json`). Este archivo mantiene el mismo esquema que `posts.json`, pero solo contiene entradas cuya `fecha` es mayor a la fecha actual. Cada día, verifica si alguna entrada en `posts-pendientes.json` tiene `fecha` menor o igual a hoy; cuando se cumpla la condición, mueve la entrada a `posts.json` y elimínala de la lista pendiente. Con este flujo, `posts.json` siempre representa el contenido público y `posts-pendientes.json` conserva el calendario editorial.

#### Automatización con cron en Hostinger

1. Inicia sesión en el panel de Hostinger y abre **Avanzado → Cron Jobs**.
2. Crea un nuevo _cron job_ con frecuencia **Diario** (`0 2 * * *` como ejemplo para ejecutarlo a las 02:00 UTC).
3. Define el comando que moverá las entradas publicables y actualizará los metadatos. Un ejemplo en Node.js sería:
   ```bash
   node tools/publish-scheduled-posts.js && node js/generate-sitemap.js
   ```
   - El primer script procesa `posts-pendientes.json`, mueve las entradas cuya `fecha` ≤ hoy a `posts.json` y actualiza los campos `lastmod` cuando corresponda.
   - El segundo comando regenera `sitemap.xml` para reflejar las publicaciones recién expuestas.
4. Guarda el _cron job_ y verifica en el panel que la próxima ejecución quede programada. Opcionalmente activa las notificaciones por correo para recibir el registro de salida del comando.

##### Reporte semanal de reacciones

- Programa un segundo _cron job_ semanal para enviar el resumen de reacciones recolectadas. El comando a ejecutar es:
  ```bash
  php tools/send-weekly-reactions-report.php
  ```
- Ejecuta el cron los viernes a las 20:00 (GMT-3) utilizando la expresión `0 20 * * 5`. De esta forma se calcula automáticamente el intervalo `[viernes anterior 20:00, viernes actual 20:00)` y el correo se envía al administrador configurado en SMTP.

> **Nota:** Si prefieres usar PHP o Bash en lugar de Node.js, asegúrate de que el comando finalice con código de salida `0` para que Hostinger lo considere exitoso.

#### Scripts de apoyo

Puedes implementar el flujo automatizado con un script sencillo. El siguiente ejemplo en Node.js asume que los archivos residen en la raíz del repositorio:

```js
// tools/publish-scheduled-posts.js
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = join(__dirname, "..");
const pendingPath = join(root, "posts-pendientes.json");
const livePath = join(root, "posts.json");

const today = new Date().toISOString().slice(0, 10);
const pending = JSON.parse(readFileSync(pendingPath, "utf8"));
const live = JSON.parse(readFileSync(livePath, "utf8"));

const { publicar, mantener } = pending.reduce(
  (acum, post) => {
    if (post.fecha <= today) {
      acum.publicar.push(post);
    } else {
      acum.mantener.push(post);
    }
    return acum;
  },
  { publicar: [], mantener: [] }
);

if (publicar.length > 0) {
  const actualizados = [...live, ...publicar].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  writeFileSync(livePath, JSON.stringify(actualizados, null, 2) + "\n");
  writeFileSync(pendingPath, JSON.stringify(mantener, null, 2) + "\n");
  console.log(`Publicados ${publicar.length} posts programados hasta ${today}.`);
} else {
  console.log("No hay posts programados para publicar hoy.");
}
```

Este script puede ejecutarse manualmente (`node tools/publish-scheduled-posts.js`) o dentro del cron diario en Hostinger.

#### Comportamiento del frontend

- **blog.html** filtra los datos por `fecha` y únicamente muestra las entradas cuya fecha es menor o igual a la fecha actual. Las entradas futuras permanecen ocultas incluso si llegaron a `posts.json` por error.
- **blog-entry.html** consume primero los datos de `localStorage.postsData`, que provienen del listado ya filtrado; si se accede directamente, realiza una lectura de respaldo de `posts.json`, por lo que es fundamental que solo contenga entradas publicadas. Cuando no encuentra un `slug` (por ejemplo, porque la entrada sigue en `posts-pendientes.json`), la página queda vacía y el visitante no ve contenido.

### Endpoint de detalle de posts

Puedes obtener la información completa de una entrada desde el backend con una petición GET a `api/post.php`, por ejemplo:

```bash
curl "https://plumafarollama.com/api/post.php?id=63"
```

El parámetro `id` es obligatorio y debe corresponder al campo `id` dentro de `posts.json`. Opcionalmente puedes añadir `slug` para validar que la entrada también coincida con dicho identificador. La respuesta exitosa tiene la forma:

```json
{
  "ok": true,
  "post": { /* datos completos del post */ }
}
```

Si el post no existe o el archivo `posts.json` no puede leerse, el endpoint devuelve un mensaje de error y el código HTTP correspondiente.

### Endpoint de galletas de la fortuna

Para consultar una galleta específica expuesta en `fortune_cookies.json`, haz una petición GET a `api/fortune_cookie.php`:

```bash
curl "https://plumafarollama.com/api/fortune_cookie.php?id=50"
```

El parámetro `id` es obligatorio y debe coincidir con el campo `id` del archivo JSON. De forma opcional puedes añadir `slug` para asegurarte de que la galleta retornada corresponda a un identificador legible, por ejemplo:

```bash
curl "https://plumafarollama.com/api/fortune_cookie.php?id=50&slug=sunfelicity-fortune50"
```

Si no se encuentra la galleta o `fortune_cookies.json` presenta errores de lectura/formato, el servicio responde con un objeto `ok: false` y el código HTTP apropiado (`400`, `404` o `500` según el caso).

## Páginas individuales de obras (SEO)

Para que Google indexe cada obra por separado, el repositorio incluye un generador que crea una página HTML por cada modal definido en `portfolio.html`.

- Generar todas las páginas de obra:
  ```bash
  npm run portfolio:generate
  ```

- Generar una sola obra (por id base del modal, sin `-modal`):
  ```bash
  node tools/generate-portfolio-pages.js galactique
  ```

El generador produce archivos en `portfolio/<slug>.html` con:
- Metadatos únicos (`<title>`, `<meta name="description">`, canonicals)
- Etiquetas Open Graph y JSON‑LD (`CreativeWork`) con conjunto de imágenes responsive (400/800/1200) cuando existan
- El mismo CSS/JS del sitio principal y auto‑apertura del modal correspondiente
- Un enlace “Volver a Obras” hacia `../portfolio.html`

Si una página ya existe, el generador la omite (idempotente). Para regenerarlas, usa `--force`:
```bash
node tools/generate-portfolio-pages.js --force
```
Los slugs por defecto se derivan del título (kebab‑case).

### Sitemap automático

Para incluir automáticamente las nuevas páginas en el sitemap:

- Generar portfolio + sitemap en un solo paso:
  ```bash
  npm run seo
  ```

El script `js/generate-sitemap.js` recorre el proyecto (incluyendo `portfolio/`) y crea `sitemap.xml` con `lastmod`, `changefreq` y `priority`. Ejecuta esto tras publicar cambios para mantener el SEO al día.

### X (Twitter) Cards

Las páginas individuales de obras incluyen metaetiquetas para X (antes Twitter):
- `twitter:card = summary_large_image`
- `twitter:title`, `twitter:description`
- `twitter:image` apunta a la variante 1200px cuando existe en `assets/images/responsive/…-1200.webp`
- `twitter:image:alt` con el título de la obra

Además, se agregan `og:image` múltiples (400/800/1200) con `og:image:alt` (título) para las tarjetas Open Graph.

### Validación SEO automática

Para verificar que las páginas tengan los metadatos mínimos:
- Ejecuta:
  ```bash
  npm test
  ```
- Este comando corre `htmlhint` y un validador simple (`tools/seo-validate.js`) que revisa por cada página:
  - `<title>`, `meta description`, `link rel="canonical"`
  - `og:title`, `og:description`, `og:type=book`, `og:url`, al menos un `og:image`
  - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
  - Presencia de JSON‑LD (`application/ld+json`)
Si falta algo, el comando falla e indica el archivo y las etiquetas ausentes.

Estas etiquetas se generan automáticamente desde el mismo script que crea las páginas (`tools/generate-portfolio-pages.js`).
Si quieres probar los cambios localmente ejecuta:

```bash
firebase serve
```

y abre `http://localhost:5000/blog.html` en tu navegador. Las tarjetas del blog se generarán automáticamente y cada enlace abrirá la entrada completa usando el slug en la URL.

## Configuración de Firebase

Para que las reacciones funcionen necesitas habilitar
Firestore en tu proyecto y agregar tus credenciales al frontend:

1. Ejecuta `firebase init` y selecciona **Firestore** cuando se solicite.
2. Copia la configuración de tu proyecto en `js/firebase-init.js`.
3. Ajusta las reglas en `firestore.rules` o usa el modo de prueba mientras
   desarrollas.

Los formularios de contacto y newsletter guardan los datos en colecciones de
Firestore. Asegúrate de completar `js/firebase-init.js` con las credenciales de
tu proyecto para que esta funcionalidad esté disponible.

## Cache del sitio con Service Worker

El sitio ahora registra un *service worker* (`sw.js`) que precarga las páginas principales, hojas de estilo y scripts para ofrecer una experiencia más rápida y con soporte básico sin conexión. Este service worker se registra desde `js/main.js`.


## Banners en los modales

Cada elemento `<div class="modal-banner">` puede incluir el atributo `data-image` para especificar la imagen de fondo que se mostrará al abrir el modal. Por ejemplo:

```html
<div class="modal-banner modal-banner-left" data-image="assets/images/banners/jesuita-left.png"></div>
```

Si el atributo está presente, `js/portfolio.js` cargará esa imagen y mostrará el banner.
Si se omite, el script buscará de forma automática una imagen con el patrón
`assets/images/banners/{nombre-modal}-{lado}.png`, donde `nombre-modal` es el
ID del modal sin el sufijo `-modal` y `lado` puede ser `left` o `right`.

## Pruebas

Para verificar de forma simple los archivos HTML del sitio se utiliza [HTMLHint](https://htmlhint.com/).

1. Instala las dependencias con:
   ```bash
   npm install
   ```

2. Ejecuta las pruebas con:
   ```bash
   npm test
   ```

## Códigos de error de la API

Los endpoints PHP (`api/submit.php` y `api/newsletter.php`) incluyen un campo `code` en las respuestas de error para que el front‑end pueda actuar según el caso:

- `CONFIG_ERROR` – error al cargar `config.php`.
- `CONFIG_NOT_FOUND` – no se encontró la configuración.
- `DB_CONNECT` – la conexión a la base de datos falló.
- `DB_RATE_LIMIT` – error al aplicar el límite de solicitudes.
- `RATE_LIMIT` – se excedió el número de solicitudes permitidas.
- `RECAPTCHA_INVALID` – el token de reCAPTCHA fue rechazado.
- `RECAPTCHA_ERROR` – no se pudo validar reCAPTCHA.
- `DATA_TOO_LONG` – alguno de los campos supera el tamaño permitido.
- `DATA_INVALID` – los datos no cumplen el formato esperado.
- `PRIVACY_REQUIRED` – falta aceptar la política de privacidad (solo newsletter).
- `DB_NEWSLETTER` – falló el guardado de la suscripción.
- `DB_SUBMIT` – falló el guardado del mensaje de contacto.
- `EMAIL_SEND` – no se pudo enviar el correo de notificación.

## Módulo interno de edición

Este módulo te permite editar entradas del blog de forma local, sin necesidad de exponer un panel de administración al público.

### 🛠️ Configuración

1. Crea una carpeta `admin/` en la raíz del proyecto con los siguientes archivos:
   - `admin/server.js` – Servidor Express que sirve el panel y guarda entradas en `posts.json`.
   - `admin/index.html` – Panel con editor WYSIWYG (por ejemplo, [Quill](https://quilljs.com/)) que utiliza tu CSS para previsualizar.

2. Instala y ejecuta el servidor con:

   ```bash
   npm install express
   export ADMIN_TOKEN="pon_aqui_un_token_largo_y_unico"
   node admin/server.js
   ```

3. Abre [http://localhost:3000](http://localhost:3000) para acceder al panel.
   El servidor escucha únicamente en `127.0.0.1` para que solo pueda accederse desde la misma máquina.
   El navegador solicitará el token la primera vez que intentes cargar o guardar entradas.

4. Desde ahí puedes completar los campos del post (título, autor, fecha, etc.).
   El editor convierte el contenido enriquecido a HTML y lo guarda automáticamente en `posts.json`.

### 🧹 Buenas prácticas

- Asegúrate de que `.gitignore` incluya las siguientes rutas para evitar publicar el panel:

   ```
   /admin/
   /node_modules/
   ```

- Mantén el valor de `ADMIN_TOKEN` fuera del repositorio (usa variables de entorno o `.env` ignorado).
- Cambia el token periódicamente y evita reutilizarlo en otros servicios.

Con este flujo, puedes verificar la apariencia final de las entradas con tus propios estilos antes de hacer commit y publicar.

## Generar páginas estáticas de blogs

El proyecto incluye un script para generar páginas estáticas de blogs a partir del archivo `posts.json`. Sigue estos pasos para usarlo:

### Requisitos previos
- Asegúrate de tener Node.js instalado en tu sistema.
- El archivo `posts.json` debe estar en la raíz del proyecto y contener los datos de las publicaciones del blog.

### Pasos para generar las páginas
1. Abre una terminal en la raíz del proyecto.
2. Ejecuta el siguiente comando:
   ```bash
   node tools/generate-blog-pages.js
   ```

### Qué hace el script
- Lee el archivo `posts.json`.
- Filtra las publicaciones futuras (basadas en la fecha).
- Genera archivos HTML estáticos para cada publicación en la carpeta `blog/`.
- Actualiza el archivo `posts.json` con las URLs de las páginas generadas.

### Salida esperada
- Las páginas HTML se generarán en la carpeta `blog/`.
- Verás un mensaje en la terminal indicando cuántas páginas se generaron, por ejemplo:
  ```
  Generadas 10 páginas en blog/
  ```

### Errores comunes
- Si el archivo `posts.json` no está presente o tiene errores de formato, el script mostrará un mensaje de error.
- Asegúrate de que las publicaciones tengan un campo `slug` único, ya que este se utiliza para nombrar los archivos HTML.

## Automatizar generación incremental del blog (pre-commit)

Si quieres que las páginas estáticas del blog se actualicen automáticamente cuando edits `posts.json`, el proyecto ya incluye una opción incremental y un helper para integrarlo en hooks de pre-commit.

Resumen rápido:
- `npm run blog:generate` — genera todas las páginas (modo completo).
- `npm run blog:generate:inc` — genera solo las páginas que cambian (modo incremental).
- `npm run blog:generate:staged` — atajo para ejecutar en modo "staged" (útil en hooks).

Cómo funciona el modo incremental
- Cuando ejecutas `node tools/generate-blog-pages.js --incremental`, el script comparará cada archivo HTML existente en `blog/` con la salida nueva. Solo sobrescribe los archivos cuyo contenido cambió. Esto mantiene los commits pequeños porque no reescribe páginas idénticas.
- El modo por defecto (sin `--incremental`) vacía la carpeta `blog/` y genera todo de nuevo.

Pre-commit (mini flujo recomendado)
You can integrate lint-staged or other local git hooks if you want to run scripts before committing.

Instalación (opcional — sin hooks)
```powershell
npm install
```

Notas importantes
- `blog/` es una carpeta generada. Evita poner archivos manuales ahí porque el script podría sobrescribirlos (o borrarlos en modo completo).
- `generate-blog-pages.js` re-escribe `posts.json` con un subconjunto de campos para asegurar consistencia. Haz backup si tienes campos extras que no quieras perder.

Ejemplo de uso local
```powershell
# Generar todas las páginas
npm run blog:generate

# Generar solo cambios (rápido)
npm run blog:generate:inc
```

Si quieres que cree automáticamente commits con los HTML generados en CI (por ejemplo GitHub Actions), puedo añadir un workflow de ejemplo que haga esto y empuje los cambios de vuelta. Dime si lo quieres y lo creo.
