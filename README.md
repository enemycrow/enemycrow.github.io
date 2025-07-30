# La Pluma, el Faro y la Llama

Este repositorio contiene el sitio web de **La Pluma, el Faro y la Llama**, un proyecto colaborativo donde tres autores de habla hispana comparten sus historias, reflexiones y servicios creativos. El sitio incluye páginas de presentación, portafolio, blog, servicios y un formulario de contacto. Está construido como un sitio estático usando HTML, CSS y un poco de JavaScript, y se publica a través de [Firebase Hosting](https://firebase.google.com/docs/hosting).

## Requisitos Previos

- Tener instalado [Node.js](https://nodejs.org/) en tu máquina.
- Instalar la [Firebase CLI](https://firebase.google.com/docs/cli) de forma global:
  ```bash
  npm install -g firebase-tools
  ```

## Desarrollo Local

Para iniciar un servidor local con Firebase, ejecuta:

```bash
firebase serve
```

Este comando sirve el contenido del repositorio según `firebase.json`, para que puedas revisar los cambios antes de publicar.

## Despliegue

Para publicar la versión más reciente del sitio en Firebase Hosting:

```bash
firebase deploy
```

Las opciones de despliegue se encuentran en `.firebaserc` y `firebase.json`.

## Plan del Proyecto

El plan de trabajo (en español) se encuentra en el archivo [todo.md](todo.md).

## Archivos CSS Históricos

Las hojas `css/about.css`, `css/blog.css`, `css/contact.css`,
`css/home.css`, `css/portfolio.css` y `css/services.css` se usaron en las primeras versiones del proyecto. Todo su
contenido se consolidó en `css/styles.css`, por lo que se
eliminaron para simplificar el repositorio.

## Admin Strapi

https://beautiful-bat-b20fd0ce9b.strapiapp.com/admin

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
- `imagen`: nombre de la imagen almacenada en `assets/images/`
- `slug`: identificador para la URL (ej. `algoritmos-del-caos`)
- `destacado`: marca la entrada como destacada si su valor es `true`
- `contenido_html`: cuerpo completo en HTML para `blog-entry.html`

Para agregar una nueva entrada basta con editar `posts.json` y colocar la imagen correspondiente en `assets/images/`.
Las páginas `blog.html` y `blog-entry.html` cargan este archivo mediante JavaScript, por lo que no es necesario modificar el HTML.

Si colocas `"destacado": true` en una entrada, aparecerá en la sección de entradas destacadas al inicio de `blog.html`.
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
