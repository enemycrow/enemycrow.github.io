# TODO — Performance + Security (PlumaFaroLlama)
Owner: Codex  
Priority: **HIGH** (Performance & Security)  
Scope: **HTML + assets + service worker (sw.js) + .htaccess (capa 1)**

## Contexto / Restricciones
- Hosting: **Hostinger con hCDN activo**.
- Los **headers de seguridad** pueden no propagarse o pueden ser filtrados por el CDN.
- DevTools mostró respuestas **“from service worker”**, lo que puede ocultar cambios (y conservar headers viejos o incompletos).
- Objetivo inmediato: **eliminar Issues de Performance/Security** en Chrome/Edge DevTools y mejorar PSI **sin romper GTM/GA**.

## Definición de “Done”
- [ ] DevTools > **Issues**: no aparece **“A 'cache-control' header is missing or empty.”** para recursos **propios** del sitio (HTML/CSS/JS/images/fonts alojados en `plumafarollama.com`).
- [ ] DevTools > **Issues**: minimizado/solucionado **“Response should include 'x-content-type-options' header.”**  
  - Si el CDN bloquea el header, **documentar limitación** y aplicar mitigaciones alternativas.
- [ ] DevTools > **Issues**: **“Content Security Policy of your site blocks some resources”** resuelto (no bloquea recursos requeridos).
- [ ] CSP aplicada desde **HTML (`<meta http-equiv>` )**, colocada lo más arriba posible en `<head>` y alineada con recursos reales.
- [ ] `sw.js` no “congela” versiones antiguas del HTML/headers (ver sección **6**) y permite ver cambios recientes.

---

## 0) Diagnóstico guiado (antes de cambiar)
### 0.1 Identificar QUÉ recursos generan los Issues
- [ ] Abrir DevTools > **Issues**.
- [ ] Expandir cada Issue y listar las URLs afectadas:
  - Cache-Control missing/empty: URLs exactas.
  - CSP blocks some resources: URLs exactas y tipo (script/style/img/connect/frame/font).
  - X-Content-Type-Options missing: confirmar en Response Headers del documento principal.
- [ ] Guardar la lista en `docs/issues-snapshot.md` (fecha + lista).

### 0.2 Verificar si el Service Worker interviene (sw.js)
- [ ] DevTools > **Application** > **Service Workers**:
  - activar temporalmente **“Bypass for network”**
  - recargar
  - repetir check de Issues
- [ ] Si al bypass desaparecen Issues o cambian headers => `sw.js` está afectando la inspección. Pasar a sección **6**.

---

## 1) Performance — Cache-Control / Expires (Capa 1: .htaccess)
> Objetivo: que HTML/CSS/JS/imagenes propias tengan Cache-Control coherente y no “vacío”.

### 1.1 Asegurar que el .htaccess existe en producción
- [ ] Confirmar ubicación correcta (raíz de `public_html` o raíz del site).
- [ ] Añadir header de diagnóstico temporal:
  - `Header set X-PFL-HTACCESS "active-v1"`
- [ ] Verificar en DevTools > Network > `index.html` > Response Headers que aparece `x-pfl-htaccess`.

### 1.2 Cobertura de extensiones que suelen quedar fuera
Actualizar reglas para incluir (si aplica):
- [ ] `.webmanifest` (manifest)
- [ ] `.json` (si sirves json)
- [ ] `.xml` (sitemap/rss)
- [ ] `.map` (sourcemaps, si existen)
- [ ] `.mjs` (si usas módulos)

**Política sugerida (editorial):**
- HTML: 5 min (`max-age=300, must-revalidate`)
- CSS/JS: 6 horas (`max-age=21600, must-revalidate`)
- imágenes/fuentes: 1 año (`max-age=31536000`)

### 1.3 Verificación de cache por tipo
- [ ] En DevTools > Network revisar headers para:
  - `index.html`
  - `*.css` (principal y overrides)
  - `*.js` (principal; GTM loader si es propio)
  - `*.webp` / `*.png`
  - `*.woff2`
- [ ] Confirmar que `cache-control` no está ausente ni vacío para recursos **propios**.

### 1.4 CDN cache purge
- [ ] En Hostinger CDN: **Flush cache**
- [ ] Hard reload (**Ctrl+F5**) y revalidar Issues.

---

## 2) Security — CSP en HTML (meta) + compatibilidad con GTM/GA
> Objetivo: resolver “CSP blocks some resources” sin romper analítica ni fuentes.

### 2.1 Implementar CSP meta temprano
- [ ] En **todas** las páginas HTML (o template/layout) insertar lo más arriba posible dentro de `<head>`:

```html
<meta http-equiv="Content-Security-Policy"
content="default-src 'self';
base-uri 'self';
connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com;
font-src 'self' https://fonts.gstatic.com https://use.fontawesome.com;
frame-src https://www.googletagmanager.com;
frame-ancestors 'self';
img-src 'self' data: https://www.googletagmanager.com https://www.google-analytics.com https://plumafarollama.com https://mirrors.creativecommons.org;
object-src 'none';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://use.fontawesome.com;
upgrade-insecure-requests">
```

**Notas:**
- Mantener `'unsafe-inline'` al inicio para no romper; endurecer después.
- Si el Issue de CSP menciona otros dominios, agregarlos explícitamente.

### 2.2 Ajustar CSP según recursos bloqueados (iterativo)
- [ ] Revisar consola/Issues y añadir solo lo necesario:
  - si bloquea fonts => ajustar `font-src`
  - si bloquea imágenes externas => ajustar `img-src`
  - si bloquea `connect-src` => añadir endpoints reales
- [ ] Documentar cada cambio en `docs/csp-changelog.md`.

### 2.3 Endurecimiento (fase 2, opcional)
- [ ] Mover scripts inline a archivos externos para quitar `'unsafe-inline'` en `script-src`.
- [ ] Mover estilos inline críticos o usar hash/nonce (si viable).
- [ ] Evaluar Trusted Types cuando el sitio esté “limpio” (ver sección **4**).

---

## 3) Security — X-Content-Type-Options (nosniff)
> Objetivo: solucionar el Issue “Response should include x-content-type-options header”.

### 3.1 Intento vía .htaccess (si el CDN lo permite)
- [ ] En `.htaccess` agregar:
  - `Header set X-Content-Type-Options "nosniff"`
- [ ] Verificar en Network > `index.html` > Response Headers:
  - Debe aparecer `x-content-type-options: nosniff`

### 3.2 Si NO se propaga (limitación hCDN)
- [ ] Documentar en `docs/hosting-limitations.md` que hCDN no deja pasar ese header.
- [ ] Mitigaciones alternativas:
  - [ ] Asegurar **Content-Type correcto** para css/js/svg/json (validar en Network).
  - [ ] Evitar servir recursos “ambiguous” sin extensión o con extensión incorrecta.
  - [ ] Evitar `text/plain` para scripts/estilos.
  - [ ] Confirmar que SVG/JSON se sirven con tipos correctos (`image/svg+xml`, `application/json`).

---

## 4) Security — Trusted Types (solo cuando CSP esté estable)
> Activar TT puede romper código que use `innerHTML`/`insertAdjacentHTML`.

### 4.1 Pre-check de sinks peligrosos
- [ ] Buscar en el repo: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `srcdoc`.
- [ ] Listar ubicaciones y decidir:
  - refactor a `textContent`/DOM APIs
  - sanitización (DOMPurify) si realmente se requiere HTML dinámico

### 4.2 Activación gradual (cuando esté listo)
- [ ] Agregar a CSP meta:
  - `require-trusted-types-for 'script'; trusted-types default;`
- [ ] Probar navegación completa y corregir violaciones.

---

## 5) Performance extra (opcional, recomendado)
- [ ] `preconnect` para Google Fonts (si se usan):
  - `<link rel="preconnect" href="https://fonts.googleapis.com">`
  - `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- [ ] `font-display: swap` en CSS de fuentes (si aplica).
- [ ] `defer` en scripts no críticos.
- [ ] Revisar imágenes hero: tamaño correcto + `loading="lazy"` para las no críticas.

---

## 6) Service Worker (sw.js) — Control de caches y “from service worker”
> Si `sw.js` sirve respuestas cacheadas, puede causar “cambios no detectados” y headers inesperados.

### 6.1 Localizar y auditar `sw.js`
- [ ] Confirmar ubicación (ej: `/sw.js`) y scope.
- [ ] Revisar qué rutas cachea: HTML, CSS/JS, imágenes, fuentes.
- [ ] Confirmar estrategia por tipo:
  - HTML => **network-first** (siempre intentar red, fallback cache)
  - assets => cache-first (ok) **con versionado**

### 6.2 Versionado y limpieza de caches
- [ ] Definir `CACHE_VERSION` (o nombre de cache con versión) y **aumentarlo en cada deploy**.
- [ ] En `activate`, eliminar caches antiguas.
- [ ] (Opcional) Implementar `skipWaiting()` + `clientsClaim()` para que el SW nuevo tome control rápido.

### 6.3 Debug/QA del SW
- [ ] DevTools > Application > Service Workers:
  - “Update on reload” (temporal)
  - “Bypass for network” para comparar
- [ ] Probar que al actualizar:
  - no quedan HTML antiguos
  - las reglas de cache-control de `.htaccess` se reflejan en respuestas de red
- [ ] Revalidar DevTools > Issues.

---

## QA / Checklist final
- [ ] DevTools > Issues: sin errores de Cache-Control en recursos propios.
- [ ] DevTools > Issues: CSP no bloquea recursos necesarios.
- [ ] Response Headers de `index.html`: `cache-control` presente y no vacío.
- [ ] (Si se propaga) `x-content-type-options: nosniff` presente.
- [ ] PSI: mejora en caching (**serve static assets with an efficient cache policy**).
- [ ] Documentación actualizada:
  - `docs/issues-snapshot.md`
  - `docs/csp-changelog.md`
  - `docs/hosting-limitations.md`
