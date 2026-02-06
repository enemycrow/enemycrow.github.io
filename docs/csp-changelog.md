# CSP Changelog

## 2026-01-23
- Añadido `<meta http-equiv="Content-Security-Policy">` al inicio de `<head>` en todas las páginas HTML y plantillas para aplicar una política consistente desde el documento principal.
- CSP basada en el borrador de `TODO_SECURITY_PERF_PFL.md`, ajustada para permitir dominios usados realmente por el sitio (GTM/GA, Google Fonts, Font Awesome, íconos de Creative Commons, Firebase/Firestore y reCAPTCHA).
- Se añadieron permisos explícitos para `connect-src`, `script-src` y `frame-src` relacionados con Firebase y reCAPTCHA para evitar bloqueos funcionales.
