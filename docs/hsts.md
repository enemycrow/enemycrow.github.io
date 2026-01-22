# HSTS por fases (Strict-Transport-Security)

Google recomienda habilitar HSTS de forma progresiva para evitar bloquear a usuarios si algo sale mal en HTTPS. El proceso típico es:

1. **Fase inicial (max-age básico)**: activa HSTS con un valor bajo, por ejemplo 300 o 86400 segundos.
2. **Fase intermedia**: aumenta el `max-age` a semanas (ej. 604800 segundos).
3. **Fase estable**: sube a meses (ej. 15552000 segundos = 180 días).
4. **Fase final (opcional)**: añade `includeSubDomains` y `preload` cuando estés 100% seguro.

> HSTS solo funciona sobre HTTPS. Asegúrate de que todo tu tráfico esté en HTTPS antes de activarlo.

## Ejemplos por servidor

### Apache (.htaccess)

```apache
# Fase inicial (1 día)
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=86400"
</IfModule>
```

Cuando estés listo:

```apache
# Fase estable (6 meses) + subdominios
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=15552000; includeSubDomains"
</IfModule>
```

### Nginx

```nginx
# Fase inicial (1 día)
add_header Strict-Transport-Security "max-age=86400" always;
```

Más adelante:

```nginx
# Fase estable (6 meses) + subdominios
add_header Strict-Transport-Security "max-age=15552000; includeSubDomains" always;
```

### Netlify (_headers)

```
/*
  Strict-Transport-Security: max-age=86400
```

> Nota: En Hostinger, el archivo `_headers` no se aplica; por eso este repositorio ya no incluye `_headers` y debes usar `.htaccess` con `mod_headers` para gestionar encabezados.

### Cloudflare

1. Entra a **SSL/TLS > Edge Certificates**.
2. Activa **HSTS**.
3. Comienza con `max-age` bajo (1 día) y ve subiéndolo por fases.

### Hostinger (hPanel + .htaccess en public_html)

Hostinger suele usar **LiteSpeed**, compatible con reglas de `.htaccess` tipo Apache. Pasos recomendados:

1. Entra a **hPanel > Administrador de archivos**.
2. Abre la carpeta `public_html`.
3. Edita tu `.htaccess` (si no existe, crea uno nuevo).
4. Agrega el header de HSTS en fase inicial:

```apache
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=86400"
</IfModule>
```

Cuando confirmes que todo carga bien por HTTPS, aumenta el `max-age` por fases.

## Plan sugerido de despliegue

| Fase | max-age | Duración | Uso recomendado |
| --- | --- | --- | --- |
| Inicial | 86400 | 1 día | Verificar que todo el sitio responde bien en HTTPS |
| Intermedia | 604800 | 1 semana | Confirmar estabilidad en producción |
| Estable | 15552000 | 180 días | HSTS sólido |
| Final | 31536000 + includeSubDomains + preload | 1 año | Solo si todo está en HTTPS y quieres precarga |

## Verificación rápida

```bash
curl -I https://tu-dominio.com/ | rg -i strict-transport-security
```

Deberías ver el encabezado `Strict-Transport-Security` con el `max-age` configurado.
