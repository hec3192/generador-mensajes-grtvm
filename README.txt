GENERADOR DE MENSAJES OPERATIVOS — iPhone

Esta es una versión web progresiva (PWA) independiente de Windows, diseñada para iPhone.
Los catálogos y selecciones se guardan en el almacenamiento local del navegador del iPhone.
Permite importar libros Excel (.xlsx/.xls) con hojas:
- Equipos
- Protecciones
- Eventos o Eventos / disparos
- Causas
- Subestaciones

Para Subestaciones se recomienda dos columnas: Acrónimo y Descripción.
Los otros catálogos pueden tener una columna de valores debajo del encabezado.
Si un libro tiene una hoja que no coincide con las categorías, la primera hoja se usa como Equipos.

IMPORTANTE PARA INSTALAR EN IPHONE:
iOS requiere servir la PWA desde una dirección HTTPS. No basta con abrir index.html desde Archivos.
1. Publica estos archivos en un hosting estático HTTPS (por ejemplo GitHub Pages).
2. Abre la dirección en Safari en el iPhone.
3. Pulsa Compartir > Añadir a pantalla de inicio.
4. Abre la app desde el nuevo icono.
5. Importa tu Excel desde el selector de archivos de iOS.

La importación XLSX usa la biblioteca SheetJS desde un CDN, por lo que la primera carga del lector Excel requiere internet. La interfaz instalada puede abrirse sin conexión después de cargarse; la importación de Excel requiere conexión para cargar esa biblioteca si aún no está en caché.
Los datos se guardan en el almacenamiento del navegador de este iPhone, no se sincronizan con Windows ni con otros dispositivos. No borres los datos del sitio ni desinstales la app si necesitas conservarlos.
Este proyecto es una base funcional inicial: revisa los mensajes generados con tus formatos operativos reales antes de distribuirlos.
