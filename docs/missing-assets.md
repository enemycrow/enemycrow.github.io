# Auditoría de recursos gráficos pendientes

Fecha: 2025-11-19

## Metodología
- Se analizaron todos los archivos `.html`, `.css` y `.js` del repositorio.
- Se extrajeron todas las rutas relativas que apuntan a `assets/images/...`.
- Se verificó si cada recurso existe físicamente dentro de `assets/images`.
- Se listaron a continuación aquellos recursos referenciados que no tienen un archivo correspondiente en el repositorio.

### Cómo repetir la verificación
```bash
python - <<'PY'
import os, re
missing = set()
for root, _, files in os.walk('.'):
    for fn in files:
        if not fn.endswith(('.html', '.css', '.js')):
            continue
        text = open(os.path.join(root, fn), errors='ignore').read()
        for match in re.findall(r"assets/images/[\w./-]+", text):
            if not os.path.exists(match):
                missing.add(match)
print('\n'.join(sorted(missing)))
PY
```

## Recursos faltantes
| Recurso referenciado | Archivos donde se utiliza | Contexto / efecto visible |
| --- | --- | --- |
| `assets/images/banners/bribones-left.webp` | `portfolio.html`, `portfolio/la-reina-de-los-bribones.html` | Banner del lado izquierdo que debería enmarcar el modal de “La reina de los bribones”. Actualmente el modal se queda sin imagen lateral. |
| `assets/images/banners/bribones-right.webp` | `portfolio.html`, `portfolio/la-reina-de-los-bribones.html` | Banner derecho para el mismo modal. |
| `assets/images/banners/cristalito-left.webp` | `portfolio.html`, `portfolio/cristalito-el-potrillo-de-cristal.html` | Banner izquierdo para el modal y la página independiente de “Cristalito”. |
| `assets/images/banners/cristalito-right.webp` | `portfolio.html`, `portfolio/cristalito-el-potrillo-de-cristal.html` | Banner derecho del modal/página de “Cristalito”. |
| `assets/images/banners/debacle-left.webp` | `portfolio.html`, `portfolio/debacle-triangular.html` | Banner lateral izquierdo para “Debacle triangular”. |
| `assets/images/banners/debacle-right.webp` | `portfolio.html`, `portfolio/debacle-triangular.html` | Banner lateral derecho para “Debacle triangular”. |
| `assets/images/banners/divinity-left.webp` | `portfolio.html` | Banner izquierdo pendiente para el modal “Reversión de las divinidades”. |
| `assets/images/banners/divinity-right.webp` | `portfolio.html` | Banner derecho pendiente para el mismo modal. |
| `assets/images/banners/tarot-left.webp` | `portfolio.html`, `portfolio/tarot-del-cuervo-y-elysia.html` | Banner izquierdo para el modal y la página dedicada al Tarot del Cuervo y Elysia. |
| `assets/images/banners/tarot-right.webp` | `portfolio.html`, `portfolio/tarot-del-cuervo-y-elysia.html` | Banner derecho correspondiente. |
| `assets/images/hijasdelmartillo.png` | `templates/blog-entry-template.html` | Imagen de referencia que se usa como placeholder en el template de entradas del blog. Falta el PNG base (aunque existen las versiones responsivas `.webp`). |
| `assets/images/placeholder-book.jpg` | `templates/obra-entry-template.html`, `templates/obra-entry-modal.html` | Portada genérica para nuevas obras o modales mientras no se sube la ilustración final. |
| `assets/images/social/blog/ejemplo.png` | `admin/index.html` | Ejemplo que se muestra en el panel para indicar la ruta esperada de la imagen vertical de blog. Sería útil contar con el archivo real para que el ejemplo no rompa. |

> Nota: las rutas anteriores se detectaron de forma automática. Si alguno de los recursos ya existe en otro directorio o con otro nombre, bastaría actualizar las referencias correspondientes.

## Próximos pasos sugeridos
1. Exportar y subir los banners faltantes en formato `.webp` (idealmente 1200x240px como las piezas ya existentes en `assets/images/banners`).
2. Crear versiones provisionales en `.png` o `.jpg` para los placeholders (`hijasdelmartillo`, `placeholder-book`, `social/blog/ejemplo`) hasta contar con la ilustración definitiva.
3. Una vez añadidos los archivos, repetir el script de verificación (`python scripts/find-missing-assets.py` si se desea automatizar) para confirmar que no queden rutas rotas.
