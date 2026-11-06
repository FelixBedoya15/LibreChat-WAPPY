---
name: animaciones-wappy-brand
description: "Crea vídeos, tutoriales y reels con la identidad visual oficial de wappy.club (#c7f303, #0e1300, #0d9488), Tenshi 3D flotante, iconos Lottie/Flaticon y Remotion."
category: media-and-video
bundle: wappy-video-production
risk: safe
source: self
source_type: self
date_added: "2026-10-23"
author: wappy-ia
agents: [wappy-video-studio]
tags: [video, wappy-brand, tenshi, lottie, flaticon, remotion, threejs]
---

# Animaciones con la Identidad Visual Oficial de WAPPY (`animaciones-wappy-brand`)

## Overview

Esta skill garantiza que cualquier vídeo (horizontal `1920×1080` o vertical `1080×1920` a 60 fps), reel con **Remotion** o pieza animada luzca **100% idéntico al sistema de diseño oficial de `wappy.club` y las páginas de clases de WAPPY + Antigravity**.

## When to Use

- **Usar SIEMPRE** que el usuario pida un vídeo con el estilo de la web/landing de WAPPY (`wappy.club`), colores corporativos WAPPY (`#c7f303`, `#0e1300`, `#0d9488`), tarjeta de Tenshi 3D flotante o iconos animados estilo Flaticon/LottieFiles (`WAPPY_LOTTIE`).
- **Cuándo preferir otra skill:**
  - Para reels con el Estilo Pro Limpio oscuro (`#06080d`) y alternancia de 3 planos: usar [`protocolo-produccion-videos`](../protocolo-produccion-videos/SKILL.md).
  - Para análisis documental de sentencias o decretos SST: usar [`animaciones-explicativas-sst`](../animaciones-explicativas-sst/SKILL.md).

## Prerequisites

- Plantilla `plantilla/motor/wappy-brand.js`, `plantilla/motor/wappy-avatar3d.js`, `plantilla/motor/three.min.js` y `plantilla/motor/WappyRemotionKit.tsx`.
- Activos en `plantilla/assets/wappy/` (`tenshi.png`, `felix_avatar_3d.png`, `wappy-cat-logo.png`, `antigravity_logo.png`, `marca_wappy.json`).

---

## How It Works

### 1. ADN Visual Exacto de WAPPY (`wappy.club`)

#### 1.1. Paleta Oficial de Colores
- **Verde Lima Eléctrico (`--w-lime: #c7f303` / `--w-lime-dark: #a8cf00`):** Color insignia para subrayados tipo marcador (`<span class="hl-lime"><i></i>...</span>`), botones principales (`.w-btn.lime`), puntos pulsantes y bordes de alto impacto.
- **Negro Oliva Profundo (`--w-ink: #0e1300` / `--w-ink-soft: #2e3428`):** Color de titulares gigantes, píldoras de eyebrow, botones oscuros (`.w-btn.dark`) y el contenedor flotante de Tenshi.
- **Turquesa SST (`--w-teal: #0d9488` / `--w-teal-bright: #2dd4bf`):** Acento secundario para el sufijo `IA`, insignias activas, bordes de verificación y conectores.
- **3 Fondos Oficiales Intercambiables (`<body class="...">`):**
  1. `body.wappy-sky` *(Por defecto)*: Cielo azul luminoso (`linear-gradient(180deg, #5bb8f5 0%, #86ccf6 36%, #bfe3fa 68%, #f6f5ef 100%)`) con nubes suaves en movimiento (`new FondoNubesWappy()`).
  2. `body.wappy-cream`: Fondo editorial cálido (`#f6f5ef` $\rightarrow$ `#eceae1`) para secciones de guías, tarjetas Bento y flujos de trabajo.
  3. `body.wappy-dark`: Fondo nocturno WAPPY (`#152208` $\rightarrow$ `#0e1300`) para contrastes dramáticos o cierres de alto impacto.

#### 1.2. Tipografía y Jerarquía
- **Titulares (`Plus Jakarta Sans` / `Outfit` 800–900):** `letter-spacing: -0.035em`, `line-height: 1.04`, con palabras clave resaltadas sobre bloque verde lima `#c7f303` de esquinas redondeadas (`border-radius: 18px`) que se despliega de izquierda a derecha sincronizado con la voz.
- **Cuerpo (`Inter` / `Outfit` 500–700):** Limpio, legible, con palabras clave en **negrita** (`#0e1300` en fondo claro o `#c7f303` en fondo oscuro).
- **Cero Subtítulos Quemados por Defecto (`subtitulos: false`):** El espacio se distribuye con aire y tarjetas limpias.

---

### 2. Librería Propia de Componentes WAPPY + Lottie/Flaticon (`plantilla/motor/wappy-brand.js`)

#### 2.1. `FondoNubesWappy()` — Cielo WAPPY con Nubes Flotantes
```js
const nubes = new FondoNubesWappy();
// En render(t):
nubes.pintar(t);
```

#### 2.2. `WappyNavbar(o)` — Barra de Navegación Flotante Oficial (`wappy.club`)
> [!WARNING]
> **USO EXCLUSIVO PARA RECREAR LA WEB:** Este componente es ÚNICAMENTE para tutoriales o demostraciones donde explícitamente se muestre la página web de WAPPY. **ESTÁ PROHIBIDO usarlo en vídeos promocionales, reels de marketing o animaciones cinematográficas**, ya que le quita dinamismo y creatividad al vídeo.

Píldora blanca translúcida (`border-radius: 9999px`) con el logo circular del gato WAPPY, texto `WAPPY IA · SOMOS SST`, pestañas centrales y botón negro con círculo verde lima `↗`.
```js
const nav = new WappyNavbar({
  t0: 0.05,
  marca: 'WAPPY',
  sufijo: 'IA',
  sub: 'SOMOS SST',
  items: [
    { txt: '🎬 Presentación', on: true },
    { txt: '🎥 Grabación' },
    { txt: '💬 Prompts Chat' },
    { txt: '📘 Guía' },
    { txt: '📄 PDF' },
  ],
  cta: 'wappy.club',
});
// En render(t):
nav.pintar(t, { x: CX, y: 76, o: 1 });
```

#### 2.3. `WappyHeroText(o)` — Bloque Izquierdo con Eyebrow, H1 con Marcador Lima y Botones Píldora
> [!WARNING]
> **USO EXCLUSIVO PARA RECREAR LA WEB:** No usar botones de página web en vídeos publicitarios. En vídeos publicitarios se usa tipografía cinematográfica, textos dinámicos con resaltador lima y composición centrada o en tercios equilibrados.

```js
const hero = new WappyHeroText({
  t0: T.inicio,
  tHighlight: T.wappy,
  tSub: T.aprende,
  tBtns: T.botones,
  eyebrow: 'CLASE EN VIVO · ECOSISTEMA INTELIGENTE SG-SST',
  tituloHtml: 'Domina <span class="hl-lime"><i></i>WAPPY + Antigravity</span> desde Cero y sin Programar.',
  subtitulo: 'Conecta tus carpetas locales a <b>WAPPY</b>, <b>NotebookLM</b> y <b>Google Drive</b> hablando en español con Tenshi.',
  botones: [
    { txt: '🎬 Ver Demostración', tipo: 'dark', pip: '▶' },
    { txt: 'Probar Gratis 7 Días', tipo: 'lime', pip: '↗' },
    { txt: '📝 Guía Paso a Paso', tipo: 'glass' },
  ],
});
// En render(t):
hero.pintar(t, { x: 590, y: 575, o: 1 });
```

#### 2.4. `WappyTenshiCard(o)` — Tarjeta Oscura Derecha con Tenshi 3D Flotante
Reproduce exactamente la tarjeta derecha (`#0e1300`, borde verde lima `#c7f303`, halo radial, avatar 3D de Tenshi flotando suavemente, burbuja de diálogo con texto resaltado en lima y barra inferior turquesa con botón `Unirme Ahora ↗`).
```js
const tenshiCard = new WappyTenshiCard({
  t0: T.tenshi,
  tBubble: T.saludo,
  tStrip: T.link,
  avatar: 'assets/wappy/tenshi.png', // o 'assets/wappy/felix_avatar_3d.png'
  mensaje: '«¡Hola! Soy <b>Tenshi</b>. Aquí <b>NO necesitas saber programación</b>. Todo lo hacemos hablándole en español al chat para construir tus automatizaciones hacia WAPPY.»',
  stripLabel: 'PLATAFORMA OFICIAL',
  stripVal: 'wappy.club',
  stripBtn: 'Entrar Ahora ↗',
});
// En render(t):
tenshiCard.pintar(t, { x: 1510, y: 585, o: 1 });
```

#### 2.5. `WappyBentoGrid(o)` + Librería `WAPPY_LOTTIE` (Estilo Flaticon Duotone + LottieFiles)
Crea tarjetas Bento limpias con iconos vectoriales duotone (`#0d9488` + `#c7f303` + `#0e1300`) que se animan a 60 fps de forma determinista (sin parpadeos en el render):
- `'cloudSync'`: Nube sincronizando con flechas circulares giratorias y pulso verde lima (inspirado en *LottieFiles Cloud Syncing*).
- `'sstShield'`: Escudo SST con pulso de protección y check normativo.
- `'bioIndividuo'`: Figura biomecánica central con anillo pulsante.
- `'aiSparkles'`: Estrella de IA / Antigravity sobre bloque oscuro con destellos turquesa.
- `'folderSync'`: Carpeta local de proyecto con tarjeta verde lima animada.

```js
const bento = new WappyBentoGrid({
  t0: T.bento,
  items: [
    { t0: T.item1, x: 520, y: 380, lottie: 'cloudSync', tag: 'SINCRONIZACIÓN EN VIVO', titulo: '22 Aplicativos Conectados', desc: 'Tus cambios en el chat actualizan la nube de WAPPY al instante.' },
    { t0: T.item2, x: 1400, y: 380, lottie: 'bioIndividuo', tag: 'CENTRO DEL SISTEMA', titulo: 'Bio-Individuo 360°', desc: 'Perfil del cargo, sociodemográfico, salud y Matriz Bio-IPEVR.' },
    { t0: T.item3, x: 520, y: 740, lottie: 'folderSync', tag: 'SIN PROGRAMAR', titulo: 'Proyectos en Carpetas', desc: 'Conecta Google Antigravity, NotebookLM y Google Drive.' },
    { t0: T.item4, x: 1400, y: 740, lottie: 'sstShield', tag: 'CUMPLIMIENTO LEGAL', titulo: '8 Hitos del SG-SST', desc: 'Auditoría continua bajo Resolución 0312 y Decreto 1072.' },
  ],
});
// En render(t):
bento.pintar(t, { x: CX, y: CY, o: 1 });
```

---

### 3. Integración con Remotion (`plantilla/motor/WappyRemotionKit.tsx` + `editor-reels`)

Cuando edites un reel vertical con Remotion (`editor-reels`) y quieras aplicar el estilo WAPPY:
1. Copia `plantilla/assets/wappy/marca_wappy.json` como `marca.json` en la carpeta del reel.
2. Importa `WappyReelCard`, `WappyCloudSyncIcon` y `WAPPY_TOKENS` desde `plantilla/motor/WappyRemotionKit.tsx` dentro de `editor/src/` para renderizar tarjetas React/Remotion con `useCurrentFrame()` y `spring()` manteniendo exactamente los colores `#c7f303`, `#0e1300` y `#0d9488`.

---

### 4. Cómo añadir nuevos archivos JSON de LottieFiles o SVG de Flaticon

- **LottieFiles (`.json`):** Guarda cualquier animación descargada de LottieFiles en `plantilla/assets/lotties/<nombre>.json` o añádela como función SVG determinista en `WAPPY_LOTTIE` dentro de `motor/wappy-brand.js` usando la paleta `--w-lime` (`#c7f303`), `--w-teal` (`#0d9488`) y `--w-ink` (`#0e1300`).
- **Flaticon (`.svg`):** Guarda los iconos en `plantilla/assets/icons/` y unifica sus trazos a `#0e1300` con rellenos secundarios en `#c7f303` y `#0d9488` para que toda la iconografía mantenga el sello visual propio de WAPPY.

---

### 5. Avatar 3D Low-Poly Procedural en Three.js (`WappyAvatar3D`)

La plantilla incluye `motor/three.min.js` y `motor/wappy-avatar3d.js`, que construye en **WebGL / Three.js con `flatShading: true`** el **Avatar 3D Low-Poly de Félix (WAPPY IA)** con lip-sync automático (`trabajo/voz_nivel.json`), parpadeo cada `3.4 s`, cejas expresivas y respiración:

```js
const miAvatar3D = new WappyAvatar3D({
  t0: T.inicio,
  ancho: 680,
  alto: 780,
});

// En render(t):
miAvatar3D.pintar(t, {
  x: 1470,
  y: 560,
  s: 1,
  giroY: -0.18,      // ángulo horizontal hacia el centro de la escena
  hablando: true,    // sincroniza la boca con la voz
  o: 1,
});
```

---

## Verification

- Verificar que `WappyNavbar` y `WappyHeroText` solo se usen cuando el vídeo recree explícitamente la interfaz web de `wappy.club`.
- Confirmar contraste AA/AAA entre texto `#0e1300` y bloques verde lima `#c7f303`.

## Safety and Side Effects

- **Risk level:** `safe` — Uso de activos visuales y motor local de renderizado de vídeo.

## Sources and Related Skills

- [`protocolo-produccion-videos`](../protocolo-produccion-videos/SKILL.md)
- [`animaciones-17-efectos-reels`](../animaciones-17-efectos-reels/SKILL.md)
- [`wappy-ui-design-system`](../wappy-ui-design-system/SKILL.md)
