---
name: protocolo-produccion-videos
description: "Protocolo obligatorio de consulta, pre-producción, estilo visual, posicionamiento de personajes y validación paso a paso para la creación de cualquier vídeo promocional, reel o animación en WAPPY. Debe ejecutarse SIEMPRE antes de escribir una sola línea de código o renderizar."
---

# Protocolo Obligatorio para Producción de Vídeos WAPPY

Este protocolo establece el flujo de trabajo estándar e inquebrantable para cualquier producción audiovisual (vídeos horizontales 16:9, reels verticales 9:16 o motion graphics) en el ecosistema WAPPY.

---

## REGLA DE ORO: No codificar ni renderizar a ciegas
Está **ESTRICTAMENTE PROHIBIDO** saltar a programar (`motor.js`, `index.html`) o lanzar renders completos en MP4 sin haber guiado al usuario a través de las 5 Fases de Consulta y obtenido su aprobación explícita del guión estructural y el estilo visual.

---

## Las 5 Fases Obligatorias de Pre-Producción

### Fase 1: Formato, Propósito y Audiencia
1. **Formato:**
   - **Horizontal (16:9 - 1920x1080):** YouTube, Masterclasses, lanzamientos web, presentaciones B2B.
   - **Vertical (9:16 - 1080x1920):** Reels de Instagram, TikTok, YouTube Shorts.
2. **Propósito:**
   - Promocional / Marketing de conversión directa.
   - Educativo / Tutorial paso a paso.
   - Explicativo de cambio normativo en SST / PESV.
   - Demostración técnica de software / IA.

---

### Fase 2: Catálogo de Fondos y Atmósferas Visuales
Ofrecer siempre al usuario alternativas visuales tanto para horizontal como para vertical:

- **Opción A — Dark Tech Cinema:**
  - Fondo oscuro profundo (`#080c04` a `#0e1300`), partículas de luz tenues, sutil cuadrícula en perspectiva isométrica, resplandores en verde lima `#c7f303` y turquesa `#0d9488`.
  - Ideal para: Videos de alto impacto tecnológico, IA, automatizaciones y sensación premium.
- **Opción B — WAPPY Sky Clean:**
  - Azul cielo oficial (`#5bb8f5` degradando suavemente hacia crema `#f6f5ef`), nubes vectoriales con desplazamiento sutil, tarjetas translúcidas de cristal (frosted glass).
  - Ideal para: Mensajes amigables, facilidad de uso, "cero estrés", onboarding.
- **Opción C — Editorial Warm Cream:**
  - Fondo crema cálido (`#f6f5ef` a `#eceae1`), tipografía negra oliva con acentos esmeralda y lima, estética minimalista y limpia estilo Stripe/Linear/Notion.
  - Ideal para: Casos de estudio, comparativas de producto, guías paso a paso.
- **Opción D — Dinámico por Tensión (Storytelling Split):**
  - La atmósfera cambia con la narrativa: Comienza oscuro o grisáceo en la fase del problema/dolor del usuario y transmuta a luminoso (WAPPY Sky o Lima vibrante) cuando se presenta la solución de Tenshi y WAPPY.

---

### Fase 3: Personajes, Roles y Distribución Espacial
1. **Roles disponibles:**
   - **Félix (Avatar 3D Low-Poly):**
     - Narrador/Host empático.
     - **Regla Estricta:** Gestos naturales de brazos y cabeza (conversación humana). **PROHIBIDO** rayos láser, sables o efectos de magia en las manos.
     - Barba en bajo relieve (`~0.036`) igualada al bigote/boso.
   - **Tenshi (Diseño Oficial Fullbody):**
     - Mascota e IA oráculo. Flotando sutilmente con halo de luz y expresiones de asistencia inteligente.
   - **Solo Motion Graphics:**
     - Sin avatares. Enfoque 100% en tipografía cinética, tarjetas Bento, iconos duotone y metáforas visuales.
2. **Distribución y Balance Espacial:**
   - **Regla de Tercios:** Nunca dejar espacios gigantes vacíos (ej. un tercio entero de cielo vacío mientras todo se aprieta al otro lado).
   - Composición equilibrada: Si Félix está a la izquierda (35% del ancho), la tipografía y tarjetas deben ocupar el centro-derecha (65% del ancho) con márgenes armónicos.

---

### Fase 4: Estilo de Marca y Elementos Prohibidos
1. **Tipografía Oficial:**
   - Titulares (H1, H2): *Outfit* o *Plus Jakarta Sans* (800–900 ExtraBold). Palabras clave con efecto resaltador verde lima `#c7f303` desplegándose sincronizado con la voz.
   - Textos de lectura: *Inter* (500–600) para máxima legibilidad.
2. **Colores Oficiales:**
   - Verde Lima Eléctrico: `#c7f303`
   - Turquesa SST: `#0d9488`
   - Negro Oliva Profundo: `#0e1300`
   - Blanco Puro / Vidrio: `#ffffff` / `rgba(255, 255, 255, 0.08)`
3. **PROHIBICIÓN ESTRICTA DE ELEMENTOS DE PÁGINA WEB:**
   - **NUNCA** incrustar barras de navegación web (`WappyNavbar`), botones de header de páginas web ni estructuras de landing page dentro de un vídeo publicitario, a menos que el usuario lo pida específicamente como un mock de navegación. Un vídeo debe sentirse cinematográfico, dinámico y con aire.

---

### Fase 5: Estructuración del Guión y Validación por Frames
1. **Presentación de la Tabla de Storyboard (Con Selección Obligatoria de Transiciones):**
   Antes de codificar, presentar la tabla con:
   - Segundo inicial y final (ej. `0s - 7s`).
   - Título de la escena y concepto.
   - Locución exacta de voz.
   - Distribución visual (Izquierda / Centro / Derecha).
   - **Animación clave / Transición de Alto Impacto (Obligatorio seleccionar de `animaciones-17-efectos-reels`):**
     * *Orbit (Órbita 3D)*
     * *Frame Break (Ruptura de encuadre)*
     * *UI World (Interfaces 3D)*
     * *Digital Zoom con retícula*
     * *Phone Mockup con Dynamic Island*
     * *Headline Wall en perspectiva*
     * *Zoom-Through (transición inmersiva sin corte)*
     * *Chart Grow en tiempo real*
     * *Doodle Boil a 10 Hz*
     * *Glass Type (cristal 3D)*
   - **Regla Estricta:** Todo guión de 30 a 60 segundos **DEBE** encadenar al menos 4 de estas transiciones; está prohibido proponer escenas con animaciones pasivas o fundidos simples.
2. **Generación de Previsualizaciones (Keyframes):**
   - Una vez aprobado el guión, generar imágenes fijas de demostración de las escenas más representativas para que el usuario valide el look & feel en segundos, antes de incurrir en tiempos de renderizado de vídeo largo.
3. **Renderizado Final:**
   - Solo cuando el usuario indique explícitamente "Aprobado" o "Adelante con el render", se procede a compilar el video completo en MP4 con audio y sincronización a 60 fps.
