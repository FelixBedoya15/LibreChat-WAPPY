# Registro y Línea de Tiempo de Errores - Problema de Caché & Service Worker en WAPPY IA

Este documento registra de forma detallada la línea de tiempo de la investigación del error de recargas infinitas y pantallas en blanco en WAPPY IA al recargar la página. Sirve como referencia histórica para evitar volver a cometer estos fallos en futuros despliegues.

---

## 📋 Resumen del Problema
* **Síntoma 1 (Histórico):** Pantalla en blanco (blank page) al realizar nuevos despliegues del frontend.
* **Síntoma 2 (Reciente):** Bucle infinito de recargas (la página se refresca continuamente sola) al intentar recargar con F5/Cmd+R.
* **Síntoma 3 (Actual):** La página inicial de Login carga correctamente en la primera visita, pero si se recarga manualmente (F5/refrescar), el contenedor de login se queda vacío (congelado con solo el logotipo de WAPPY y el interruptor de tema) sin mostrar los campos de entrada de datos ni el botón de continuar.

---

## 🕰️ Línea de Tiempo de Investigaciones y Parches

### Fase 1: El Origen de la Pantalla en Blanco (Marzo - Mayo 2026)
* **Causa:** El Service Worker nativo de LibreChat (`vite-plugin-pwa`) tenía habilitado el almacenamiento en caché agresivo de los archivos de la aplicación (`index.html`, JS, CSS). Al desplegar actualizaciones en el servidor, los navegadores de los usuarios seguían cargando el `index.html` viejo desde su caché local en lugar de pedirlo al servidor, provocando una desincronización de archivos JS que causaba una pantalla en blanco permanente.
* **Parche 1 (Fallido):** Se agregó un script en `index.html` para detectar cambios de controlador (`controllerchange`) y recargar automáticamente la página para forzar la actualización. Esto comenzó a causar inestabilidad.
* **Parche 2 (Fallido):** Se creó un script de "Emergency SW Kill-Switch" en `index.html` que intentaba desregistrar todos los Service Workers y borrar las cachés del navegador de forma agresiva en cada carga.

---

### Fase 2: El Bucle de Recargas Infinitas (Mayo 2026)
* **Causa:** El script de emergencia de la Fase 1 provocó un bucle sin fin. Al llamar a `unregister()` de forma asíncrona y ejecutar `window.location.replace` al instante, la página se recargaba antes de que el navegador terminara de eliminar el Service Worker de su memoria. Al recargar, el script volvía a detectar el Service Worker en proceso de eliminación, volvía a desregistrarlo y volvía a recargar de forma indefinida.
* **Parche 3 (Parcial):** Se desactivó el mecanismo de navegación en caché (`navigateFallback: null`) en `vite.config.ts`.
* **Parche 4 (Parcial):** Se configuró `selfDestroying: true` en `vite.config.ts` para crear un archivo `/sw.js` de autodestrucción nativo del navegador, y `injectRegister: null` para que la página no volviera a registrar ningún Service Worker nuevo.
* **Parche 5 (Exitoso para este síntoma):** Se **eliminó por completo** el script de emergencia de `client/index.html` para retornar el HTML a su estado original y limpio. Esto erradicó al 100% el bucle infinito de recargas.

---

### Fase 3: La Interfaz Congelada / Vacía al Recargar (Actual)
* **Síntoma:** El login carga bien a la primera, pero al recargar manualmente, se queda congelado en un estado vacío (solo logo y marco, sin campos de entrada).
* **Teoría en Investigación:** 
  1. Durante la primera carga, React obtiene con éxito la configuración inicial del servidor a través de la API `/api/config` (`isFetching` pasa de `true` a `false` y se carga el formulario).
  2. Al recargar la página, la petición a `/api/config` se queda en estado pendiente indefinidamente (colgada) o el servidor devuelve un error, o existe un error de JavaScript (crash) al renderizar la respuesta. Dado que no se dibuja la caja de "Error de Conexión" ni el formulario, la aplicación se queda eternamente esperando la respuesta (`isFetching: true`).

---

## 🧠 Lecciones Aprendidas (Best Practices)

1. **Evitar parches agresivos de recarga en el HTML:** Forzar recargas con `window.location.reload` or `replace` dentro de scripts en `index.html` que dependen de llamadas asíncronas como `getRegistrations()` es sumamente peligroso y tiende a generar bucles infinitos por condiciones de carrera.
2. **Utilizar el ciclo de vida nativo de las PWA:** Si se desea deshabilitar o eliminar un Service Worker, la forma correcta y estándar es usar la opción `selfDestroying: true` provista por la biblioteca oficial (`vite-plugin-pwa`), la cual le ordena al navegador desinstalar el script de manera silenciosa en segundo plano sin alterar la experiencia del usuario.
3. **No adivinar errores sin logs de consola:** En aplicaciones React modernas, un error silencioso de sintaxis o una respuesta inesperada de la API puede romper el renderizado de un componente sin mostrar alertas visuales. La única forma científica de resolverlo es analizando la Consola Web del Navegador o los logs internos del servidor API.
