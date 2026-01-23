# DevTools Issues snapshot

Fecha: 2026-01-22 21:13:12 UTC

> Nota: el entorno no permite acceder a https://plumafarollama.com/ (bloqueo de proxy),
> así que el snapshot se tomó con `python -m http.server` en local y la página
> `http://localhost:8000/` (index.html). Los encabezados reportados aplican a los
> recursos servidos por el servidor local.

## A 'cache-control' header is missing or empty

| URL | Tipo de recurso |
| --- | --- |
| http://localhost:8000/ | Documento HTML |
| http://localhost:8000/assets/images/site/plumafaroyllama.webp | Imagen (webp) |
| http://localhost:8000/css/custom-overrides.css | Hoja de estilos CSS |
| http://localhost:8000/css/styles.889d2a038d.css | Hoja de estilos CSS |
| http://localhost:8000/favicon.ico?v=2 | Icono |
| http://localhost:8000/js/gtm-loader.js | Script JS |
| http://localhost:8000/js/main.d9fb968dc8.js | Script JS |

## Response should include 'x-content-type-options' header

| URL | Tipo de recurso |
| --- | --- |
| http://localhost:8000/ | Documento HTML |
| http://localhost:8000/assets/images/site/plumafaroyllama.webp | Imagen (webp) |
| http://localhost:8000/css/custom-overrides.css | Hoja de estilos CSS |
| http://localhost:8000/css/styles.889d2a038d.css | Hoja de estilos CSS |
| http://localhost:8000/favicon.ico?v=2 | Icono |
| http://localhost:8000/js/gtm-loader.js | Script JS |
| http://localhost:8000/js/main.d9fb968dc8.js | Script JS |

## Content Security Policy of your site blocks some resources

| URL | Tipo de recurso |
| --- | --- |
| https://www.google-analytics.com/analytics.js | Script JS (cargado por GTM) |
| https://www.google-analytics.com/g/collect | Beacon/collect (cargado por GTM) |
