# Plan de Desarrollo para "La Pluma, el Faro y la Llama"

## Estructura del Proyecto
- [x] Crear estructura básica de directorios
- [x] Crear archivos HTML principales (index, about, portfolio, blog, services, contact)
- [x] Configurar estructura de archivos CSS
- [x] Configurar estructura de archivos JavaScript
  - `js/` contiene un archivo principal (`main.js`) y un script específico
    por página (`about.js`, `blog.js`, `contact.js`, `portfolio.js`,
    `services.js`). Por ahora no se utiliza sistema de módulos ni build
    system; se dejan como posibles mejoras futuras.
- [X] Compatibilizar README.md con el estado actual del proyecto
- [X] Deprecar y limpiar archivos que ya no se utilizan

## Diseño y Estilo
- [x] Definir paleta de colores (negros, grises, blancos brillantes, violeta pálido, azul noche)
- [x] Seleccionar tipografías (serif elegantes y manuscritas suaves)
- [x] Diseñar elementos simbólicos (pluma, luz, faro, mar, sombra, estrellas)
- [x] Crear hojas de estilo CSS base
- [x] Diseñar transiciones entre las tres voces creativas
- [x] Mejorar responsividad móvil (el sitio se ve bien en escritorio, pero no en celular; buscar solución sin afectar el diseño de escritorio)

## Páginas y Contenido
- [x] Desarrollar página de inicio con manifiesto
- [x] Crear sección "Sobre mí" con presentación dual
- [x] Implementar sección de obras y portafolio
- [x] Desarrollar blog/diario de creación
- [x] Crear sección de servicios creativos
- [x] Implementar formulario de newsletter
- [x] Diseñar página de contacto
- [X] Trabajar en el blog (mejorar contenido, estructura y dinamismo)

## Optimización y Despliegue
- [ ] Realizar pruebas de responsividad
- [X] Optimizar imágenes y recursos
- [ ] Verificar compatibilidad con navegadores
- [X] Adquirir dominio y montar el sitio en el hosting
- [X] Desplegar sitio web
- [ ] Presentar al usuario

## Velvet Console (juego/agente IA)
- [ ] Conectar los botones de sesión:
  - Reiniciar debe vaciar el historial y limpiar `localStorage`.
  - Exportar tiene que generar y descargar un `.txt` con la charla.
  - "Abrir con guiño" debe inyectar un mensaje inicial sin duplicar entradas previas.
  - Sugerir frase debe colocar la sugerencia en el textarea (o enviarla al chat) según el modo definido.
- [ ] Hacer que la intensidad afecte las respuestas (p.ej., elegir banco de frases o matices) en lugar de solo mostrarse en el encabezado.
- [ ] Personalizar los bancos de respuestas según la persona elegida, no únicamente por tono.
- [ ] Añadir detección de peticiones fuera de los límites y respuestas de redirección elegantes.
- [ ] Implementar integración con un backend/LLM real para reemplazar las réplicas estáticas cuando sea posible.
- [ ] Completar el sistema de animaciones y retroalimentación visual:
  - Definir estados de la mascota (expresiones, intensidad, persona) y transiciones entre ellos.
  - Sincronizar la animación de aparición de mensajes y cambios de intensidad/persona.
  - Añadir microinteracciones (hover, pulsaciones, loaders) acordes a la estética actual.
