---
name: animaciones-17-efectos-reels
description: "Catálogo selectivo de 19 efectos y transiciones para Reels/TikTok (Orbit 3D, Frame Break, UI World, Zoom-Through, Chart Grow, Doodle Boil, Glass Type)."
category: media-and-video
bundle: wappy-video-production
risk: safe
source: self
source_type: self
date_added: "2026-10-23"
author: wappy-ia
agents: [wappy-video-studio]
tags: [video, reels, transitions, effects, orbit-3d, zoom-through, doodle-boil]
---

# Catálogo Selectivo de Efectos y Transiciones para Reels (`animaciones-17-efectos-reels`)

## Overview

Librería de **19 efectos y transiciones cinéticas** (`motor/efectos-17-reels.js`) de nivel After Effects para vídeos verticales y horizontales en WAPPY IA. Funciona como **catálogo selectivo de consulta** bajo la dirección del [`protocolo-produccion-videos`](../protocolo-produccion-videos/SKILL.md).

## When to Use

- **Usar como catálogo de efectos puntuales** cuando una frase específica del guion pida una órbita 3D (`FXOrbit`), una transición inmersiva (`fxZoomThrough`), barras en crecimiento (`ChartGrowFX`), garabatos animados (`FX14DoodleBoil`), tipografía de cristal (`FX17GlassType`) o un mockup 3D de teléfono.
- **Regla de discriminación («Una frase, una idea, una pieza»):**
  - **NO metas múltiples efectos de esta librería al mismo tiempo en la misma toma.**
  - El diseño base es siempre el **Estilo Pro Limpio** ([`protocolo-produccion-videos`](../protocolo-produccion-videos/SKILL.md)): fondo limpio `#06080d` y **1 sola pieza protagonista por frase**.

## Prerequisites

La plantilla de esta skill carga automáticamente:
- `motor/efectos-17-reels.js`
- `motor/wappy-brand.js`
- `motor/wappy-avatar3d.js`
- `motor/three.min.js`
- `motor/WappyRemotionKit.tsx`

---

## How It Works

### 1. El Catálogo de los 10 Efectos Principales

| # | Efecto / Transición | Función / Clase | Mecánica Visual y Animación en Código |
|---|---|---|---|
| **01** | **ORBIT (Órbita 3D)** | `new FXOrbit({ t0, items, rx, ry, speed })` | Módulos, badges o iconos flotantes orbitan en elipse 3D alrededor del protagonista o tarjeta núcleo. Los satélites al frente crecen (`scale: 1.12`) y brillan; los posteriores se atenúan (`scale: 0.75`, `opacity: 0.45`). |
| **02** | **FRAME BREAK (Ruptura de Encuadre)** | `fx04FrameBreak(t, t0)` | El avatar 3D o presentador recortado rompe los límites superiores y laterales de una tarjeta o marco de interfaz, sobresaliendo físicamente en 3D (`translateZ`) para romper la cuarta pared. |
| **03** | **UI WORLD (Interfaces Animadas 3D)** | `new FXUIWorld({ t0, tarjetas })` | Entorno inmersivo cilíndrico donde múltiples tarjetas de dashboards, chats periciales con Tenshi y métricas flotan en perspectiva tridimensional (`rotateY`, `translateZ`) con entradas escalonadas (*stagger*). |
| **04** | **DIGITAL ZOOM (Zoom con Retícula)** | `fx05DigitalZoom(t, t0, 1.35, 0.35)` | Punch-in digital centrado en el punto focal (rostro o dato clave) acompañado de una retícula de enfoque. |
| **05** | **PHONE MOCKUP (Celular 3D)** | `Showcase17Reels` / `.fx-iphone` | Mockup realista de smartphone / iPhone con Dynamic Island interactiva que despliega notificaciones, chats con Tenshi o el flujo de la app móvil. |
| **06** | **HEADLINE WALL (Muro de Titulares)** | `new FX08HeadlineWall({ t0, texto })` | Muro tipográfico en perspectiva con pastillas/badges de titulares inclinados apilados que se deslizan a contraflujo en sentidos opuestos. |
| **07** | **ZOOM-THROUGH (Transición Inmersiva)** | `fxZoomThrough(t, t0, 0.75)` | Transición sin corte (*seamless transition*): la cámara digital acelera exponencialmente (`scale: 1 -> 28x`), atravesando el hueco central de una letra ("O", "A", "D") o ventana para revelar la siguiente escena. |
| **08** | **CHART GROW (Gráficos en Tiempo Real)** | `ChartGrowFX` / `barra().crecer()` | Barras y curvas analíticas con gradiente que crecen de 0 a 100% con rebote elástico acompañadas de un contador numérico rodante que llega a la cifra meta. |
| **09** | **DOODLE BOIL (Garabatos Animados)** | `new FX14DoodleBoil({ t0, color })` | Trazos orgánicos dibujados a mano (círculos de énfasis, ondas, flechas curvas, destellos) que vibran con cadencia stop-motion a 10 Hz (*boiling lines*) alrededor del sujeto o palabra clave. |
| **10** | **GLASS TYPE (Tipografía de Cristal 3D)** | `new FX17GlassType({ t0, texto })` | Tipografía tridimensional de gran escala con material de cristal esmerilado translúcido (`backdrop-filter: blur(24px)`), biseles refractivos y barrido de luz especular diagonal continuo. |

---

### 2. Catálogo Extendido de Apoyo y Efectos Complementarios

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

### 3. Implementación y Recetas Técnicas

#### A. Efecto 01 — Orbit 3D (Satélites Alrededor de Núcleo)
```js
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

#### B. Efecto 07 — Zoom-Through (Transición Inmersiva sin Corte)
```js
const zt = fxZoomThrough(t, 15.0, 0.7);

if (zt.activo) {
  contenedorEscenaA.style.transform = `scale(${zt.scale})`;
  contenedorEscenaA.style.opacity = zt.opacity;
  contenedorEscenaA.style.filter = `blur(${zt.blur}px)`;
  contenedorEscenaB.style.opacity = 1 - zt.opacity;
}
```

#### C. Efecto 04 — Digital Zoom con Retícula
```js
const zoom = fx05DigitalZoom(t, 0.5, 1.28, 0.35);
contenedorPrincipal.style.transform = `scale(${zoom.scale})`;
reticulaHUD.style.opacity = zoom.progreso < 1 ? (1 - zoom.progreso) : 0;
```

#### D. Efecto 09 — Doodle Boil (Trazos Vibrantes a Mano)
```js
const doodle = new FX14DoodleBoil({ t0: 2.5, color: '#c7f303' });
// En render(t):
doodle.pintar(t, { x: 540, y: 720, s: 1.1, o: 1 });
```

#### E. Efecto 10 — Glass Type (Tipografía de Cristal 3D)
```js
const glassTitle = new FX17GlassType({ t0: 20.0, texto: 'HUELLA BIOCÉNTRICA' });
// En render(t):
glassTitle.pintar(t, { x: CX, y: 380, s: 1.0, o: 1 });
```

---

### 4. Leyes Cinéticas del Ecosistema WAPPY

1. **Curvas Elásticas y Rebote (`E.spring`, `back.out(1.7)`):** Todo elemento entra con inercia física viva.
2. **Entradas Escalonadas (`staggerP`):** Elementos de listas o interfaces entran en cascada alternada (`0.08s – 0.15s`).
3. **Parallax Multicapa:** Fondo (`0.3x`), Capa media (`1.0x`) y Primer plano (`1.5x`).
4. **Micro-Movimientos Perpetuos (`microFloat`):** Flotación suave y respiración viva en todos los mockups, Tenshi y tarjetas.
5. **Gestos Naturales y Expresivos:** Avatar con movimientos orgánicos de cabeza y brazos al comunicarse.

---

## Verification

- Confirmar que nunca se superpongan dos efectos complejos a la vez en el mismo segundo del timeline.
- Verificar fluidez determinista a 60 fps (`t` pasado por parámetro en `render(t)`).

## Safety and Side Effects

- **Risk level:** `safe` — Catálogo de funciones JS/CSS de animación local.

## Sources and Related Skills

- [`protocolo-produccion-videos`](../protocolo-produccion-videos/SKILL.md)
- [`hyperframes-motion-design`](../hyperframes-motion-design/SKILL.md)
- [`animaciones-dark-tech-hud`](../animaciones-dark-tech-hud/SKILL.md)
