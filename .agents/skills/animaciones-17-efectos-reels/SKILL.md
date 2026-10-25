---
name: animaciones-17-efectos-reels
description: "Catálogo maestro y motor de Efectos Virales y Transiciones de Alto Impacto para Reels/TikTok/YouTube (@prompteafacil + Ricardo Cabascango @aupria + WAPPY IA): 01 Orbit (Órbita 3D), 02 Frame break, 03 UI world, 04 Digital zoom con retícula, 05 Phone mockup con Dynamic Island, 06 Headline wall, 07 Zoom-through (transición inmersiva sin corte), 08 Chart grow, 09 Doodle boil, 10 Glass type (cristal 3D), 11 Giro 3D, 12 Couch wall, 13 Checklist, 14 Corte con zoom, 15 Zoom out, 16 Green screen, 17 Paper cut, 18 Vértigo (Dolly Zoom), y 19 Cover story. Incluye Showcase interactivo con menú lateral y contador (09/17). Úsala SIEMPRE que el usuario pida animar vídeos, reels verticales, transiciones de alto impacto, efectos nivel After Effects en código, o que el guión encadene múltiples efectos dinámicos."
---

# Catálogo Maestro de Efectos Virales y Transiciones para Reels (`animaciones-17-efectos-reels`)

Esta skill implementa la librería definitiva de **motion graphics, transiciones y efectos de cámara de nivel After Effects programados en código puro** (HTML5, GSAP, Canvas y Three.js), combinando los referentes más virales de la industria (@prompteafacil, Ricardo Cabascango @aupria) con la identidad visual de **WAPPY IA `#c7f303`**, las **Leyes Cinéticas de Dinamismo** y el **Avatar de Mauricio / Tenshi 3D**.

La plantilla carga automáticamente:
- `motor/efectos-17-reels.js`
- `motor/wappy-brand.js`
- `motor/wappy-avatar3d.js`
- `motor/three.min.js`
- `motor/WappyRemotionKit.tsx`

---

## 1. El Catálogo de los 10 Efectos Nivel After Effects (Referencia Ricardo Cabascango)

Estos 10 efectos representan el estándar más alto de retención visual y dinamismo para reels y vídeos cortos:

| # | Efecto / Transición | Función / Clase | Mecánica Visual y Animación en Código |
|---|---|---|---|
| **01** | **ORBIT (Órbita 3D)** | `new FXOrbit({ t0, items, rx, ry, speed })` | Módulos, badges o iconos flotantes orbitan en elipse 3D alrededor del protagonista o tarjeta núcleo. Los satélites al frente crecen (`scale: 1.12`) y brillan; los posteriores se atenúan (`scale: 0.75`, `opacity: 0.45`). |
| **02** | **FRAME BREAK (Ruptura de Encuadre)** | `fx04FrameBreak(t, t0)` | El avatar 3D o presentador recortado rompe los límites superiores y laterales de una tarjeta o marco de interfaz, sobresaliendo físicamente en 3D (`translateZ`) para romper la cuarta pared. |
| **03** | **UI WORLD (Interfaces Animadas 3D)** | `new FXUIWorld({ t0, tarjetas })` | Entorno inmersivo cilíndrico donde múltiples tarjetas de dashboards, chats periciales con Tenshi y métricas flotan en perspectiva tridimensional (`rotateY`, `translateZ`) con entradas escalonadas (*stagger*). |
| **04** | **DIGITAL ZOOM (Zoom con Retícula)** | `fx05DigitalZoom(t, t0, 1.35, 0.35)` | Punch-in digital agresivo centrado en el punto focal (rostro o dato clave) acompañado de una retícula cibernética / crosshair que se cierra súbitamente. |
| **05** | **PHONE MOCKUP (Celular 3D)** | `Showcase17Reels` / `.fx-iphone` | Mockup realista de smartphone / iPhone con Dynamic Island interactiva que despliega notificaciones, chats con Tenshi o el flujo de la app móvil. |
| **06** | **HEADLINE WALL (Muro de Titulares)** | `new FX08HeadlineWall({ t0, texto })` | Muro tipográfico en perspectiva con pastillas/badges de titulares inclinados apilados que se deslizan a contraflujo en sentidos opuestos a gran velocidad. |
| **07** | **ZOOM-THROUGH (Transición Inmersiva)** | `fxZoomThrough(t, t0, 0.75)` | Transición sin corte (*seamless transition*): la cámara digital acelera exponencialmente (`scale: 1 -> 28x`), atravesando el hueco central de una letra ("O", "A", "D") o ventana para revelar la siguiente escena. |
| **08** | **CHART GROW (Gráficos en Tiempo Real)** | `ChartGrowFX` / `barra().crecer()` | Barras y curvas analíticas con gradiente neón que crecen de 0 a 100% con rebote elástico acompañadas de un contador numérico rodante que llega a la cifra meta. |
| **09** | **DOODLE BOIL (Garabatos Animados)** | `new FX14DoodleBoil({ t0, color })` | Trazos orgánicos dibujados a mano (círculos de énfasis, ondas, flechas curvas, destellos) que vibran con cadencia stop-motion a 10 Hz (*boiling lines*) alrededor del sujeto o palabra clave. |
| **10** | **GLASS TYPE (Tipografía de Cristal 3D)** | `new FX17GlassType({ t0, texto })` | Tipografía tridimensional de gran escala con material de cristal esmerilado translúcido (`backdrop-filter: blur(24px)`), biseles refractivos y barrido de luz especular diagonal continuo. |

---

## 2. Catálogo Extendido de Apoyo y Efectos Complementarios

| # | Efecto | Función / Clase | Qué hace visualmente |
|---|---|---|---|
| **11** | **Giro 3D** | `fx01Giro3D(t, t0, dur, desdeY, desdeX)` | Rota cualquier tarjeta o mockup en perspectiva 3D (`rotateY`, `rotateX`) con rebote elástico `E.spring`. |
| **12** | **Couch wall** | `FX08HeadlineWall` (en fondo) | Muro gráfico en el plano posterior del set detrás del presentador o avatar recortado. |
| **13** | **Checklist** | `new FX07Checklist({ t0, items })` | Lista de verificación oscura con borde lima `#c7f303` cuyos checks `✓` entran uno tras otro en cascada con rebote. |
| **14** | **Corte con zoom** | `fx09CorteConZoom(t, tCorte, 1.18)` | Punch-in instantáneo en la sílaba exacta de corte de frase para eliminar micro-silencios y elevar la retención. |
| **15** | **Zoom out** | `fx11ZoomOut(t, t0, 1.38, 0.65)` | Alejamiento fluido desde un plano cerrado hacia un plano general para contextualizar el ecosistema completo. |
| **16** | **Green screen** | `estadoVideo(t)` / `WappyAvatar3D` | Integración del presentador o avatar 3D recortado (`alpha: true`) superpuesto sobre interfaces o documentos reales. |
| **17** | **Paper cut** | `new FX13PaperCut({ t0, texto })` | Rótulo editorial estilo recorte de revista/papel con borde grueso, sombra dura verde lima y cadencia stop-motion a 12 fps. |
| **18** | **Vértigo (Dolly Zoom)** | `fx15Vertigo(t, t0, dur)` | Efecto Hitchcock: el fondo se aleja (`1.0 -> 1.36`) mientras el sujeto en primer plano hace la escala inversa (`1.18 -> 0.94`). |
| **19** | **Cover story** | `new FX16CoverStory({ t0, revista, titular })` | Portada de revista editorial de prestigio donde el sujeto protagoniza el titular principal. |

---

## 3. Directriz Obligatoria: Coreografía de Múltiples Efectos por Video

> [!CRITICAL]
> **PROHIBICIÓN ESTRICTA DE VIDEOS ESTÁTICOS O PLANOS:**
> Un video de WAPPY nunca debe ser una sucesión pasiva de diapositivas con simples fundidos (`fade-in`).
> 
> **REGLAS OBLIGATORIAS DE COREOGRAFÍA VISUAL:**
> 1. **Regla de los 3 Segundos:** Ninguna escena o plano puede durar más de 3 segundos sin que ocurra un evento cinético (un zoom punch-in, una entrada escalonada, un garabato doodle boil o un cambio de perspectiva).
> 2. **Mínimo de 4 a 6 Efectos por Reel (30–60s):** Todo guión y código generado **DEBE** encadenar al menos 4 de los efectos maestros.
> 3. **Secuencia Dinámica Estándar Recomendada:**
>    - **Segundos 0–4 (Gancho / Hook):** `Digital Zoom con retícula` + `Headline Wall` en movimiento rápido + `Doodle Boil` en la palabra clave.
>    - **Segundos 4–12 (Dolor / Diagnóstico):** `Phone Mockup 3D` con notificaciones + `Frame Break` del avatar + `Corte con Zoom` en cada cambio de idea.
>    - **Segundos 12–28 (Solución / Ecosistema):** Transición `Zoom-Through` ➔ `UI World` con tarjetas en arco 3D ➔ `Orbit 3D` con los módulos girando alrededor del núcleo.
>    - **Segundos 28–42 (Impacto / Métricas):** `Chart Grow` con barras luminosas que crecen con datos reales + `Glass Type` para el concepto central.
>    - **Segundos 42–60 (Llamado a la Acción / CTA):** `Cover Story` o `Headline Wall` apilado + micro-burbujas de comentarios sociales con la palabra disparadora.

---

## 4. Implementación y Recetas Técnicas

### A. Efecto 01 — Orbit 3D (Satélites Alrededor de Núcleo)
```js
// Instanciar en init()
const orbitSatelites = new FXOrbit({
  t0: 12.0,
  items: ['Perfil de Cargo', 'Condiciones de Salud', 'Matriz BIO-IPVR', 'Compatibilidad'],
  rx: 340, // radio horizontal
  ry: 110, // inclinación de la elipse
  speed: 0.5 // vueltas por segundo
});

// En render(t):
orbitSatelites.pintar(t, { x: CX, y: CY, o: 1 });
```

### B. Efecto 07 — Zoom-Through (Transición Inmersiva sin Corte)
```js
// Transición entre Escena A y Escena B en el segundo 15.0:
const zt = fxZoomThrough(t, 15.0, 0.7);

if (zt.activo) {
  // Escalar el contenedor de la Escena A exponencialmente
  contenedorEscenaA.style.transform = `scale(${zt.scale})`;
  contenedorEscenaA.style.opacity = zt.opacity;
  contenedorEscenaA.style.filter = `blur(${zt.blur}px)`;
  
  // La Escena B se revela gradualmente detrás
  contenedorEscenaB.style.opacity = 1 - zt.opacity;
}
```

### C. Efecto 04 — Digital Zoom con Retícula
```js
// En el segundo 0.5 un acercamiento rápido con retícula de enfoque
const zoom = fx05DigitalZoom(t, 0.5, 1.28, 0.35);
contenedorPrincipal.style.transform = `scale(${zoom.scale})`;
reticulaHUD.style.opacity = zoom.progreso < 1 ? (1 - zoom.progreso) : 0;
```

### D. Efecto 09 — Doodle Boil (Trazos Vibrantes a Mano)
```js
const doodle = new FX14DoodleBoil({ t0: 2.5, color: '#c7f303' });
// En render(t):
doodle.pintar(t, { x: 540, y: 720, s: 1.1, o: 1 });
```

### E. Efecto 10 — Glass Type (Tipografía de Cristal 3D)
```js
const glassTitle = new FX17GlassType({ t0: 20.0, texto: 'HUELLA BIOCÉNTRICA' });
// En render(t):
glassTitle.pintar(t, { x: CX, y: 380, s: 1.0, o: 1 });
```

---

## 5. Leyes Cinéticas Obligatorias del Ecosistema WAPPY

1. **Curvas Elásticas y Rebote (`E.spring`, `back.out(1.7)`):** Todo elemento entra con inercia física viva.
2. **Entradas Escalonadas (`staggerP`):** Elementos de listas o interfaces entran en cascada alternada (0.08s - 0.15s).
3. **Parallax Multicapa:** Fondo (`0.3x`), Capa media (`1.0x`) y Primer plano (`1.5x`).
4. **Micro-Movimientos Perpetuos (`microFloat`):** Flotación suave y respiración viva en todos los mockups, Tenshi y tarjetas.
5. **Gestos Naturales y Expresivos:** Avatar con movimientos orgánicos de cabeza y brazos al comunicarse, manteniendo absoluto realismo humano.

---

## 6. Meta-Prompt Maestro para Generar Videos con Múltiples Transiciones

Al solicitar o programar cualquier nuevo reel o video promocional, inyectar el siguiente bloque de instrucciones de motion design:

```markdown
### DIRECTIVA DE MOTION GRAPHICS Y TRANSICIONES DINÁMICAS:
Aplica estrictamente la skill `animaciones-17-efectos-reels`. El video DEBE sentirse de nivel After Effects con alta retención visual.
Encadena obligatoriamente al menos 4 de las transiciones maestras en el timeline:
1. Hook inicial con Digital Zoom y Headline Wall.
2. Muestra de producto con Phone Mockup 3D y Frame Break.
3. Transición Zoom-Through inmersiva para cambiar de bloque narrativo.
4. Entorno de datos con UI World y Orbit 3D de elementos satélites.
5. Gráficos analíticos con Chart Grow y titulares en Glass Type.
6. Énfasis en palabras clave usando Doodle Boil a 10 Hz y acentos lima #c7f303.
Garantiza que ningún elemento permanezca estático más de 3 segundos.
```
