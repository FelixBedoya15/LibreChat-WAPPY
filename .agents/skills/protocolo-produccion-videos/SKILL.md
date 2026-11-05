---
name: protocolo-produccion-videos
description: "Protocolo maestro unificado de producción de vídeos WAPPY IA: combina el Estilo Pro Limpio (una sola pieza a la vez, cero ruido visual), el Avatar 3D con Lip-Sync (wappy-avatar3d.js / Voxel / Chibi) y el Selector Inteligente de Efectos de todas las skills (editor-reels, piezas.js, editorial.js, efectos-17-reels.js y wappy-brand.js) para elegir siempre el mejor efecto según cada frase del guion."
---

# Protocolo Maestro Unificado de Producción de Vídeos WAPPY IA

Este protocolo unifica **todas las librerías de animación instaladas en el proyecto** bajo una sola dirección de arte limpia, asegurando que cada frase del guion utilice **el mejor efecto disponible** sin saturar nunca la pantalla.

---

## 1. Tres Reglas Inquebrantables de Limpieza y Render

1. **Lienzo Puro `1080 × 1920` (Sin botones ni controles falsos fuera o dentro del video):**
   - El archivo de video o previsualización **NO debe incluir barras de botones de configuración superiores** (selectores de tema, pestañas ni barras de herramientas web), ya que en el render MP4 final no existen ni funcionan. El lienzo debe ser 100% el video puro.
2. **«Una Frase, Una Idea, Una Pieza» (Variedad sin Ruido Visual):**
   - En cada tramo del guion se muestra **1 sola pieza protagonista** elegida estratégicamente del catálogo unificado (Sección 3).
   - **Prohibido repetir la misma tarjeta genérica dos veces seguidas:** si el tramo 2 usó una tarjeta de filas, el tramo 3 debe cambiar a un documento real subrayado (`VisorNormaReal`), una cuadrícula porcentual (`Cuadricula100`), una comparativa (`columnas`) o una órbita (`Orbita`).
3. **Presentador con Lip-Sync Real (Boca sincronizada con la voz):**
   - Cuando aparece el presentador en el **Plano 1** o **Plano 3**, debe mover la boca/mandíbula, parpadear y gesticular en sincronía con el audio:
     * **Opción A (Por Defecto) — Avatar 3D Minecraft Voxel Oficial (`WappyAvatarVoxel3D` en `client/public/assets/wappy/wappy-avatar-voxel3d.js`):** Nuestro presentador 3D Voxel en Three.js (camisa a cuadros amarilla/negra sobre camiseta blanca, bolsillo amarillo con logo `"W"` en píxeles negros, cabello pompadour Voxel, gafas negras rectangulares, barba Voxel, boca articulada `mouthGroup` con dientes y lengua, parpadeo `eyeL`/`eyeR`, cejas `browL`/`browR` y brazo con dedo índice señalador `dedoIndice`).
     * **Opción B — Avatares Oficiales Voxel Minecraft / Chibi 3D (`avatar_mauricio_voxel_cuerpo_completo.png`, `avatar2_mauricio_camisa_cuadros_amarilla.png`):** Con animación de mandíbula/boca articulada por sílaba y respiración orgánica.

---

## 2. Alternancia de los 3 Planos

| Plano | Qué se ve en el lienzo `1080 × 1920` | Cuándo usarlo |
|---|---|---|
| **Plano 1 (Presentador + Pieza sobre el pecho)** | El **Avatar con Lip-Sync** en la zona superior (`y: 180–880`) y **1 pieza** debajo (`y: 900–1380`). | Gancho inicial (`0.0s`), comparativas rápidas, advertencias y llamadas a la acción. |
| **Plano 2 (Escena a pantalla completa con Cortina)** | Sube una cortina oscura con filo de luz (`6px`) que **oculta al avatar** y dedica todo el lienzo (`y: 240–1360`) a un efecto visual rico. | Explicaciones de normas, documentos oficiales subrayados, mecanismos o estadísticas (cada 8–12 s). |
| **Plano 3 (Primer plano de Cierre)** | El **Avatar con Lip-Sync** más cerca (`scale: 1.15–1.20`) acompañado del remate (`sentencia` o `Buscador` con clic en `wappy.club`). | Conclusión y cierre del reel. |

---

## 3. Catálogo Maestro Unificado: Qué Efecto Elegir Según el Guion

Antes de programar el video, analiza cada frase del guion y elige **el mejor efecto** de entre todas nuestras librerías instaladas (nunca metas dos al mismo tiempo):

| Qué dice o pide la frase del guion… | Mejor Efecto / Pieza a Elegir | Librería Origen |
|---|---|---|
| **1. Gancho inicial (`0.0s – 3.5s`)** | **`titular` + Marcador Fluorescente Lima (`hl-lime`)**: 2 líneas gigantes donde la palabra clave se subraya o encaja en `#c7f303` con golpe en la sílaba. | `editor-reels` + `wappy-brand.js` |
| **2. Cita una Ley, Resolución, Decreto o Sentencia** | **`VisorNormaReal`**: Hoja oficial en papel blanco donde un **resaltador amarillo fluorescente subraya en vivo** el artículo o los requisitos mientras habla la voz. | `editorial.js` (`animaciones-explicativas-sst`) |
| **3. Da un porcentaje o proporción fuerte (`-45%`, `8 de cada 10`)** | **`Cuadricula100` o `monedas`**: Matriz `10×10` donde se encienden las celdas exactas con contador numérico gigante, o pilas de monedas comparativas. | `piezas.js` / `editor-reels` |
| **4. Explica cómo funciona un mecanismo (A → B → C)** | **`flujo` o `RutaPasos`**: 3 bloques conectados por línea de progreso donde cada etapa espera apagada en gris y se enciende en su palabra. | `editor-reels` / `piezas.js` |
| **5. Enumera 3 o 4 dominios, pilares o requisitos** | **`filas` con Check Elástico o `Orbita 3D`**: Filas sólidas que encienden su visto bueno verde `✓` al nombrarlas, o satélites 3D orbitando el núcleo (`FXOrbit`). | `editor-reels` / `efectos-17-reels.js` |
| **6. Desmiente un mito o duda común de WhatsApp** | **`ChatRumores`**: Burbuja de mensaje con el mito común que se tacha o verifica con el sello técnico oficial. | `editorial.js` (`animaciones-explicativas-sst`) |
| **7. Compara Antes vs. Después o Nivel Alto vs. Controlado** | **`cambio` o `columnas` (`ChartGrowFX`)**: Tabla que abre la columna «Después» en la sílaba exacta, o barras que crecen con resorte. | `editor-reels` / `efectos-17-reels.js` |
| **8. Muestra entregables (Formatos, Matrices, Protocolos)** | **`Carpeta 3D` (`carpeta`) o `AbanicoDocumentos`**: Carpeta 3D que se abre mostrando las hojas dentro, o abanico de 3 documentos con metáfora visual. | `piezas.js` / `editorial.js` |
| **9. Énfasis orgánico sobre una cifra crítica** | **`DoodleBoilFX`**: Círculo o flecha trazada a mano que vibra suavemente alrededor del dato clave. | `efectos-17-reels.js` |
| **10. Cierre / Ir a `wappy.club` o comentar** | **`Buscador con Cursor + Onda de Clic` o `comenta` + `acciones`**: Barra donde se escribe `wappy.club`, el cursor hace clic con onda expansiva y se encienden los botones finales. | `piezas.js` / `editor-reels` |

---

## 4. Sincronía Palabra a Palabra y Diseño Sonoro

1. **Subtítulos Inteligentes (`y: 1430`, `58px` Inter 900 Mayúsculas):**
   - La palabra que suena en ese instante se pinta en el color de acento (`#c7f303` o `#4b8cf7`) y da un salto de `-6px`.
   - **Auto-ocultación:** Cuando la pieza en pantalla ya es un texto gigante (`titular` o `sentencia`), los subtítulos se ocultan solos para no duplicar texto.
2. **Sonido (`sonidos/`):**
   - Cada elemento que se enciende dispara un `tick-suave` (`-16 dB`), las cortinas disparan un `barrido` suave, el resaltador de norma suena como trazo suave y solo hay de 4 a 6 `golpe-grave` en todo el reel.
