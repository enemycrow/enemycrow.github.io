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
