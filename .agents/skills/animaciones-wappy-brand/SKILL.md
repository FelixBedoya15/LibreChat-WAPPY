---
name: animaciones-wappy-brand
description: "Crea vídeos, presentaciones animadas, reels y tutoriales con la identidad visual EXACTA de WAPPY IA (wappy.club): verde lima eléctrico (#c7f303), negro oliva profundo (#0e1300), turquesa SST (#0d9488), cielo azul con nubes suaves (#5bb8f5 -> #eaf6fe) o crema cálido (#f6f5ef), tipografía Plus Jakarta Sans / Outfit ExtraBold, barra de navegación flotante tipo píldora, tarjeta oscura de Tenshi 3D flotante y librería propia de iconos Duotone estilo Flaticon + micro-animaciones deterministas estilo LottieFiles (Cloud Syncing, Escudo SST, Bio-Individuo, IA Sparkles, Carpetas Antigravity), compatible tanto con el motor HTML a 60 fps como con Remotion (WappyRemotionKit.tsx). Úsala SIEMPRE que el usuario pida un vídeo con el estilo de WAPPY, estilo de la web/landing de WAPPY, colores de WAPPY, Tenshi flotante o integrando iconos estilo Flaticon y animaciones estilo LottieFiles."
---

# Animaciones con la Identidad Visual Oficial de WAPPY (`animaciones-wappy-brand`)

Esta skill garantiza que cualquier vídeo (horizontal `1920x1080` o vertical `1080x1920` a 60 fps), reel con **Remotion** o pieza animada luzca **100% idéntico al sistema de diseño oficial de `wappy.club` y las páginas de clases de WAPPY + Antigravity**.

---

## 1. ADN Visual Exacto de WAPPY (`wappy.club`)

### 1.1. Paleta Oficial de Colores
- **Verde Lima Eléctrico (`--w-lime: #c7f303` / `--w-lime-dark: #a8cf00`):** Color insignia para subrayados tipo marcador (`<span class="hl-lime"><i></i>...</span>`), botones principales (`.w-btn.lime`), puntos pulsantes y bordes de alto impacto.
- **Negro Oliva Profundo (`--w-ink: #0e1300` / `--w-ink-soft: #2e3428`):** Color de titulares gigantes, píldoras de eyebrow, botones oscuros (`.w-btn.dark`) y el contenedor flotante de Tenshi.
- **Turquesa SST (`--w-teal: #0d9488` / `--w-teal-bright: #2dd4bf`):** Acento secundario para el sufijo `IA`, insignias activas, bordes de verificación y conectores.
- **3 Fondos Oficiales Intercambiables (`<body class="...">`):**
  1. `body.wappy-sky` *(Por defecto)*: Cielo azul luminoso (`linear-gradient(180deg, #5bb8f5 0%, #86ccf6 36%, #bfe3fa 68%, #f6f5ef 100%)`) con nubes suaves en movimiento (`new FondoNubesWappy()`).
  2. `body.wappy-cream`: Fondo editorial cálido (`#f6f5ef` $\rightarrow$ `#eceae1`) para secciones de guías, tarjetas Bento y flujos de trabajo.
  3. `body.wappy-dark`: Fondo nocturno WAPPY (`#152208` $\rightarrow$ `#0e1300`) para contrastes dramáticos o cierres de alto impacto.

### 1.2. Tipografía y Jerarquía
- **Titulares (`Plus Jakarta Sans` / `Outfit` 800–900):** `letter-spacing: -0.035em`, `line-height: 1.04`, con palabras clave resaltadas sobre bloque verde lima `#c7f303` de esquinas redondeadas (`border-radius: 18px`) que se despliega de izquierda a derecha sincronizado con la voz.
- **Cuerpo (`Inter` / `Outfit` 500–700):** Limpio, legible, con palabras clave en **negrita** (`#0e1300` en fondo claro o `#c7f303` en fondo oscuro).
- **Cero Subtítulos Quemados por Defecto (`subtitulos: false`):** El espacio se distribuye con aire y tarjetas limpias.

---

## 2. Librería Propia de Componentes WAPPY + Lottie/Flaticon (`plantilla/motor/wappy-brand.js`)

La plantilla carga automáticamente `motor/wappy-brand.js` e incluye los activos oficiales en `plantilla/assets/wappy/` (`tenshi.png`, `felix_avatar_3d.png`, `wappy-cat-logo.png`, `antigravity_logo.png`, `marca_wappy.json`).

### 2.1. `FondoNubesWappy()` — Cielo WAPPY con Nubes Flotantes
```js
const nubes = new FondoNubesWappy();
// En render(t):
nubes.pintar(t);
```

### 2.2. `WappyNavbar(o)` — Barra de Navegación Flotante Oficial (`wappy.club`)
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

### 2.3. `WappyHeroText(o)` — Bloque Izquierdo con Eyebrow, H1 con Marcador Lima y Botones Píldora
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

### 2.4. `WappyTenshiCard(o)` — Tarjeta Oscura Derecha con Tenshi 3D Flotante
Reproduce exactamente la tarjeta derecha de la captura (`#0e1300`, borde verde lima `#c7f303`, halo radial, avatar 3D de Tenshi flotando suavemente, burbuja de diálogo con texto resaltado en lima y barra inferior turquesa con botón `Unirme Ahora ↗`).
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

### 2.5. `WappyBentoGrid(o)` + Librería `WAPPY_LOTTIE` (Estilo Flaticon Duotone + LottieFiles)
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

## 3. Integración con Remotion (`plantilla/motor/WappyRemotionKit.tsx` + `editor-reels`)

Cuando edites un reel vertical con Remotion (`editor-reels`) y quieras aplicar el estilo WAPPY:
1. Copia `plantilla/assets/wappy/marca_wappy.json` como `marca.json` en la carpeta del reel.
2. Importa `WappyReelCard`, `WappyCloudSyncIcon` y `WAPPY_TOKENS` desde `plantilla/motor/WappyRemotionKit.tsx` dentro de `editor/src/` para renderizar tarjetas React/Remotion con `useCurrentFrame()` y `spring()` manteniendo exactamente los colores `#c7f303`, `#0e1300` y `#0d9488`.

---

## 4. Cómo añadir nuevos archivos JSON de LottieFiles o SVG de Flaticon

- **LottieFiles (`.json`):** Guarda cualquier animación descargada de LottieFiles en `plantilla/assets/lotties/<nombre>.json` o añádela como función SVG determinista en `WAPPY_LOTTIE` dentro de `motor/wappy-brand.js` usando la paleta `--w-lime` (`#c7f303`), `--w-teal` (`#0d9488`) y `--w-ink` (`#0e1300`).
- **Flaticon (`.svg`):** Guarda los iconos en `plantilla/assets/icons/` y unifica sus trazos a `#0e1300` con rellenos secundarios en `#c7f303` y `#0d9488` para que toda la iconografía mantenga el sello visual propio de WAPPY.


---

## 5. Las 5 Leyes Cinéticas Obligatorias (Rebotes, Stagger, Parallax 3 Capas, Micro-Movimientos y Sable Láser en Manos)

> [!IMPORTANT]
> **DIRECTRIZ ESTRICTA DE DINAMISMO VISUAL:**
> Ninguna animación, reel o vídeo puede tener elementos estáticos o movimientos planos. Siempre debes aplicar estas 5 leyes cinéticas en todas las escenas:

1. **Curvas con Rebote Elástico (`E.spring`, `E.back`, `E.bounce` / GSAP `elastic.out`, `back.out`):**
   - Prohibido usar entradas lineales (`E.lin`) para tarjetas, insignias, iconos o botones.
   - Usa siempre curvas con sobreimpulso y rebote físico (`E.spring`, `E.back`, `step(tau, w, z)` o `spring({ damping: 12, stiffness: 180 })` en Remotion) para que cada elemento sienta peso y elasticidad al aterrizar.
2. **Entradas Escalonadas Uno Después de Otro (`Stagger`):**
   - Nunca hagas aparecer un grupo de tarjetas, botones, ítems de lista o nodos al mismo milisegundo.
   - Escalónalos secuencialmente con un desfase de `0.08 s` a `0.15 s` entre cada elemento (`staggerP(t, t0, i, 0.12, 0.48, E.spring)` o `t0 + i * 0.12`), guiando la vista del espectador en cascada.
3. **Separación de Profundidad en 3 Planos con Diferentes Velocidades (`Parallax Multicapa`):**
   - Divide siempre la escena en **Fondo** (`z1–z2`), **Plano Medio** (`z3–z5`, contenido principal / persona) y **Primer Plano / Frente** (`z6–z8`, badges flotantes, destellos, partículas o HUD).
   - Al mover la cámara (`camara(t)`), desplaza el **Fondo a `0.25x`**, el **Plano Medio a `1.0x`** y el **Frente a `1.45x`** (`parallaxPos(t, x, y, 'fondo' | 'medio' | 'frente')`) para crear sensación real de volumen 3D.
4. **Micro-Movimientos Constantes (`Living UI` / `microFloat`):**
   - Una vez que un elemento terminó de entrar, **jamás debe quedarse congelado como una foto fija**.
   - Aplícale flotación sinusoidal continua, rotación sutil (`±0.5° a ±2°`) y respiración de escala (`1 ± 0.012`) desfasada por semilla (`microFloat(t, i)`), además de iconos internos activos (nubes girando, checks latiendo, destellos parpadeando).
5. **Efecto Sable Láser / Haz de Energía cuando Aparecen Manos (`SableLaserMano` / `WappyLightsaberHand`):**
   - Siempre que en el vídeo (grabación a cámara, recorte de persona o avatar) **aparezcan las manos gesticulando, señalando o sosteniendo algo**, activa el efecto de **Sable Láser / Haz de Plasma Neón** (`new SableLaserMano({ t0, t1, color: '#c7f303', trayectoria })` o `<WappyLightsaberHand />` en Remotion).
   - El sable láser lleva núcleo blanco incandescente (`#ffffff`), hoja de plasma verde lima WAPPY (`#c7f303`) o turquesa (`#2dd4bf`), doble filtro de resplandor Gaussiano (`feGaussianBlur`), vibración de alta frecuencia (`flicker`) y chispas de ignición en la mano, siguiendo la trayectoria e inclinación de la mano fotograma a fotograma.


---

## 6. Tu Avatar 3D Low-Poly Procedural en Three.js (`WappyAvatar3D` — Estilo `@elkis.dev` / Claude Artifacts)

La plantilla ya incluye `motor/three.min.js` y `motor/wappy-avatar3d.js`, que construye en **WebGL / Three.js con `flatShading: true`** tu propio **Avatar 3D Low-Poly de Félix (WAPPY IA)**:
- **Facciones exactas de tu avatar oficial:** Cabello castaño con tupé/ondas volumétricas low-poly, gafas rectangulares negras de marco grueso con cristales translúcidos, barba completa y bigote facetados, chaqueta deportiva azul marino con franjas naranjas en mangas y cintura, camiseta blanca interior y el logo naranja **`W:`** en el pecho izquierdo.
- **Animación Procedural y Lip-Sync Automático a 60 fps:**
  - Lee automáticamente `nivelVoz(t)` del audio del proyecto (`trabajo/voz_nivel.json`) o genera cadencia silábica natural para abrir y cerrar la boca en sincronía con tu voz.
  - Parpadea cada `3.4 s`, levanta las cejas en los énfasis, respira con el torso y mueve los brazos.
  - **Sable Láser 3D integrado en la mano derecha (`sableDesde` o `sable: true`):** Cuando se activa, levanta el brazo derecho y despliega el sable láser verde lima WAPPY (`#c7f303`) directamente en el espacio 3D.

### Cómo usar tu Avatar 3D en cualquier escena:
```js
const miAvatar3D = new WappyAvatar3D({
  t0: T.inicio,
  ancho: 680,
  alto: 780,
  sableDesde: T.accionMano, // opcional: segundo donde enciende el sable láser en su mano 3D
});

// En render(t):
miAvatar3D.pintar(t, {
  x: 1470,
  y: 560,
  s: 1,
  giroY: -0.18,      // ángulo horizontal hacia el centro de la escena
  hablando: true,    // sincroniza la boca con tu voz
  sable: t >= T.accionMano,
  o: 1,
});
```
