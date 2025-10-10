# Activar GZIP en Apache con `.htaccess`

Si tu proveedor de hosting utiliza Apache y permite personalizar el archivo `.htaccess`, puedes activar la compresión GZIP para la mayoría de los recursos estáticos siguiendo estos pasos.

## 1. Verifica que el módulo `mod_deflate` esté disponible

La directiva `AddOutputFilterByType` requiere que el módulo `mod_deflate` esté cargado. En un entorno donde no tienes acceso a `apachectl`, puedes hacer una prueba temporal agregando al `.htaccess` la línea:

```apache
<IfModule mod_deflate.c>
</IfModule>
```

Si Apache no reconoce el módulo, verás un error 500. En ese caso, consulta con tu hosting cómo habilitar `mod_deflate` o si debes usar `mod_brotli` u otro mecanismo de compresión.

## 2. Usa directivas condicionales para no romper la configuración

Incluye las reglas dentro de un bloque `IfModule` para que la configuración solo se aplique cuando el módulo esté disponible:

```apache
<IfModule mod_deflate.c>
    # Comprime HTML, CSS, JavaScript y fuentes
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
    AddOutputFilterByType DEFLATE text/javascript application/javascript application/json
    AddOutputFilterByType DEFLATE application/xml application/rss+xml application/atom+xml
    AddOutputFilterByType DEFLATE application/x-font-ttf application/x-font-opentype font/opentype

    # Evita problemas con navegadores antiguos (IE 6 y proxies intermedios)
    BrowserMatch ^Mozilla/4 gzip-only-text/html
    BrowserMatch ^Mozilla/4\.0[678] no-gzip
    BrowserMatch \bMSIE !no-gzip !gzip-only-text/html

    # No comprimas archivos ya comprimidos (imágenes, zips, etc.)
    SetEnvIfNoCase Request_URI \.(?:gif|jpe?g|png|webp|avif|mp4|mov|zip|gz|bz2|rar|7z)$ no-gzip dont-vary

    Header append Vary Accept-Encoding env=!dont-vary
</IfModule>
```

Ajusta las extensiones según los tipos de archivo que sirvas.

## 3. Limpia configuraciones previas

Si previamente intentaste habilitar GZIP, revisa que no existan reglas duplicadas o contradictorias en el `.htaccess`. Los `BrowserMatch` o `SetEnvIf` mal configurados pueden impedir la compresión.

## 4. Comprueba que la compresión funciona

1. Vacía la caché del navegador o usa una pestaña privada.
2. Ejecuta desde tu máquina local:

   ```bash
   curl -I -H "Accept-Encoding: gzip" https://tusitio.com/
   ```

   Debes ver un encabezado `Content-Encoding: gzip` en la respuesta.

3. También puedes usar herramientas en línea (como PageSpeed Insights o WebPageTest) para validar que la compresión esté activa.

## 5. Considera alternativas si estás en un CDN

Si usas un CDN (Cloudflare, Netlify, etc.), verifica si el servicio ya aplica compresión automáticamente. En ese caso, tu `.htaccess` local puede no influir, y deberás activar la compresión en el panel del proveedor.

## 6. Mantén una copia de respaldo

Antes de editar el `.htaccess` activo, descarga una copia de respaldo. Así podrás restaurarla si la nueva configuración genera errores 500 u otro comportamiento inesperado.

Siguiendo estos pasos deberías lograr activar GZIP o, en su defecto, identificar por qué la regla no está funcionando.
