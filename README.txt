GENERADOR GRTVM-ZOTP - VERSION 8

Cambio principal:
- Los botones WhatsApp usan el enlace universal https://wa.me/?text=... para abrir la aplicación WhatsApp instalada en iPhone cuando esté disponible, con el mensaje precargado.
- Ya no abre WhatsApp Web explícitamente.
- El usuario debe seleccionar el contacto o grupo y pulsar Enviar. Los grupos privados no se pueden seleccionar automáticamente por nombre.
- Caché actualizada a v8.

PUBLICACIÓN EN GITHUB PAGES:
1. Descomprime este ZIP.
2. Sube index.html, app.js y sw.js a la raíz del repositorio, reemplazando los existentes.
3. Confirma Commit changes.
4. Espera a que GitHub Pages publique los cambios.
5. Cierra la aplicación instalada y vuelve a abrirla. Si aún muestra la versión anterior, abre la página en Safari y recárgala; si persiste, elimina el acceso directo y vuelve a añadirlo desde Safari.

Importante: valida los mensajes con datos de prueba antes de distribuirlos.

Versión 9: los botones de WhatsApp usan whatsapp://send?text= para intentar abrir directamente la app instalada. El texto se copia antes como alternativa si iOS bloquea el enlace.

Version 10: los campos de hora aceptan y muestran HH:mm:ss. Puedes escribir 14:05:09 o 14:05; la aplicación completa segundos como :00.


VERSION 11: fuerza una nueva caché y usa campos de texto para las horas (HH:mm:ss). Si el iPhone sigue mostrando el selector de rueda, está abriendo una copia antigua instalada. Elimina el acceso directo antiguo y los datos del sitio en Ajustes > Safari > Avanzado > Datos de sitios web, elimina el dominio github.io y vuelve a abrir la página en Safari antes de añadirla a inicio.


ACTUALIZACIÓN v34 ANDROID: se agregó el botón Mostrar/Ocultar catálogos. La preferencia se guarda en el dispositivo y no elimina los catálogos. Para publicar, sustituye los archivos del repositorio de GitHub Pages por los de esta carpeta. En Android, abre la página publicada en Chrome y selecciona Instalar aplicación o Añadir a pantalla de inicio.


Corrección v34: se fuerza display:none cuando la sección de catálogos está oculta y se renueva la caché de la PWA para que Android cargue los archivos corregidos.


Versión v35: los elementos seleccionados se distinguen por color: Equipos azul, Evento/disparo amarillo, Protecciones operadas verde y Causa del evento morado. Se conserva la funcionalidad de la versión 34.
