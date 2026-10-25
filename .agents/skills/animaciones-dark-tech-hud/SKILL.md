---
name: animaciones-dark-tech-hud
description: Sistema maestro de animación y motion graphics estilo Dark Tech Cyberpunk / HUD Glassmorphism para Reels y vídeos verticales de WAPPY (9:16). Incluye paleta cósmica oscura (#0c192e a #020409), rejilla cyber-grid, haz láser de escaneo (scanline-beam), radar holográfico SVG rotatorio, esquinas tácticas (corner-bracket), ecualizador reactivo, entradas cinéticas escalonadas desde los laterales (slide-in stagger L/R), diseño de núcleo central rodeado por satélites orbitales conectados por láser (como la Huella Biocéntrica), y tipografía de gran escala optimizada para pantallas de móvil.
---

# Animaciones Dark Tech HUD · WAPPY Motion Design System

Este estándar define la producción visual para reels, tutoriales y vídeos promocionales de WAPPY con la estética **Dark Tech Cyberpunk / HUD Glassmorphism**, inspirada en consolas de ingeniería pericial, interfaces de ciencia ficción y dashboards biomecánicos.

---

## 1. Paleta de Color y Atmósfera Cósmica

Todo fondo parte de un entorno espacial profundo con emisión perimetral de luz de alta energía:

```css
/* Fondo Cósmico HUD */
background: radial-gradient(circle at 50% 18%, #0c192e 0%, #050a14 58%, #020409 100%);
```

- **Negro Primario:** `#020409` (fondo exterior y sombras).
- **Azul Noche Profundo:** `#0c192e` (foco central de luz).
- **Acentos Lumínicos Neón:**
  - **Turquesa SST / Teal:** `#0d9488` / `#2dd4bf` (normas, salud, seguridad).
  - **Cian Cibernético:** `#06b6d4` / `#22d3ee` (IA, escaneo, radar, analítica).
  - **Lima Eléctrico WAPPY:** `#c7f303` (llamados de acción, ganchos clave, titulares).
  - **Ámbar / Naranja Alerta:** `#f59e0b` / `#f97316` (hallazgos, riesgos, alertas de control).

### Orbes y Luces de Fondo (Parallax & Depth)
```html
<div class="bg-cyber-grid"></div>
<div id="orb-teal" class="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-teal-500/20 blur-[110px] pointer-events-none"></div>
<div id="orb-cyan" class="absolute top-[40%] -right-24 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none"></div>
<div id="orb-lime" class="absolute bottom-10 left-[20%] w-[380px] h-[380px] rounded-full bg-lime-400/15 blur-[115px] pointer-events-none"></div>
```

---

## 2. Componentes Tácticos HUD Obligatorios

Ningún video de este estilo debe carecer de estos elementos vivos de instrumentación:

### A. Rejilla Cibernética (`.bg-cyber-grid`)
```css
.bg-cyber-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(to right, rgba(6, 182, 212, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(20, 184, 166, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}
```

### B. Haz Láser de Escaneo (`.scanline-beam`)
Un haz horizontal luminoso que recorre el eje vertical simulando escaneo pericial de datos:
```css
.scanline-beam {
  position: absolute; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.4) 20%, #22d3ee 50%, rgba(52, 211, 153, 0.4) 80%, transparent 100%);
  box-shadow: 0 0 20px #22d3ee, 0 0 40px #10b981;
  pointer-events: none;
}
```

### C. Radar Holográfico SVG (`#bg-radar`)
Colocado en una esquina superior o tras el núcleo central, girando a velocidad constante (360° en 8s).

### D. Esquinas Cibernéticas Tácticas (`.corner-bracket`)
Visores en las esquinas de tarjetas o contenedores principales (`border-t-2 border-l-2 border-cyan-400`, `drop-shadow(0 0 6px #22d3ee)`).

### E. Ecualizador Dinámico Reactivo (`.eq-pulse`)
Barras luminosas en cian, teal y lima que simulan la transmisión de datos o la voz activa.

---

## 3. Ley Estricta de Tipografía Mobile-First (Legibilidad en Celular)

> [!CRITICAL]
> **PROHIBIDO EL TEXTO DIMINUTO EN DISPOSITIVOS MÓVILES:**
> En vídeos verticales (720×1280 o 1080×1920), los textos pequeños se vuelven ilegibles al verse en la app de Instagram, TikTok o YouTube Shorts.

- **Titulares Principales:**
  - Tamaño: **44px a 56px** (en 1080p: **56px a 72px**).
  - Tipografía: *Plus Jakarta Sans* o *Outfit*, pesos `800 ExtraBold` a `900 Black`.
  - Resaltador: fondo lima `--w-lime` (`#c7f303`) o cian eléctrico (`#22d3ee`).
- **Subtítulos y Bajadas:**
  - Tamaño: **24px a 32px**, interlineado generoso (`line-height: 1.3`).
- **Datos Técnicos, Métricas y Badges:**
  - Tamaño: **18px a 24px**, utilizando fuente monoespaciada *JetBrains Mono*.

---

## 4. Leyes Cinéticas: Prohibición de Elementos Estáticos

Ningún elemento gráfico puede entrar solo con opacidad (`fade-in`) o quedarse quieto tras entrar.

### A. Listas y Tarjetas que Entran desde los Lados (Slide-in Stagger L/R)
Los elementos de una lista o comparación deben alternar sus puntos de origen:
- Elementos impares (1, 3, 5): Entran disparados desde la **izquierda** (`x: -160px ➔ 0`) con inercia elástica `back.out(1.5)`.
- Elementos pares (2, 4): Entran disparados desde la **derecha** (`x: 160px ➔ 0`).
- Escalonamiento (`stagger`): Cada ítem entra con un desfase de `0.15s` a `0.22s` sincronizado con la locución.

### B. Micro-Flotación Constante (Living UI)
Todo elemento presente en pantalla debe tener una ondulación senoidal constante:
```js
// Micro-flotación permanente
element.style.transform = `translateY(${Math.sin(t * 2.2 + index) * 6}px)`;
```

---

## 5. Diseño del Núcleo Central Rodeado (Huella Biocéntrica & Ecosistemas)

Cuando se represente la **Huella Biocéntrica** o el **Ecosistema WAPPY**, está terminantemente prohibido mostrarlo como una simple lista vertical estática.

### Arquitectura Orbital Radial:
1. **Núcleo Central Holográfico:**
   - En el centro de la pantalla se ubica el núcleo: Huella dactilar holográfica, avatar o escudo bio-seguridad con anillos pulsantes de ondas de choque (`pulse-ring`).
2. **5 Satélites Radiales Rodeando el Núcleo:**
   - **Nodo 1 (Arriba Izquierda):** Perfil del Cargo.
   - **Nodo 2 (Arriba Derecha):** Perfil Sociodemográfico.
   - **Nodo 3 (Centro Derecha):** Condiciones de Salud.
   - **Nodo 4 (Abajo Derecha):** Matriz Bio-IPVR.
   - **Nodo 5 (Abajo Izquierda):** Compatibilidad Cargo-Colaborador (92% FIT).
3. **Líneas Láser Conectoras (SVG Lasers):**
   - Rayos luminosos vectoriales conectan el núcleo central con cada uno de los 5 satélites.
4. **Entrada en Cascada Orbital:**
   - El núcleo central explota desde escala 0 (`scale: 0 ➔ 1.1 ➔ 1`).
   - Las líneas conectoras se dibujan hacia afuera (`stroke-dashoffset`).
   - Los satélites brotan sucesivamente en sentido de las agujas del reloj con rebote elástico.

---

## 6. Plantilla Estructural GSAP (HyperFrames / Puppeteer Safe)

```javascript
// Timeline central unificada en GSAP
const tl = gsap.timeline({ paused: true });

// 1. Entrada de la Escena con Cámara Dinámica
tl.fromTo("#camera-stage", 
  { scale: 1.08, y: 30 }, 
  { scale: 1.0, y: 0, duration: 1.2, ease: "power3.out" }, 
  0
);

// 2. Scanline Láser barriendo verticalmente
tl.fromTo(".scanline-beam", 
  { top: "0%", opacity: 0 }, 
  { top: "100%", opacity: 1, duration: 2.8, ease: "sine.inOut", repeat: -1 }, 
  0
);

// 3. Listas dinámicas entrando desde los laterales
tl.fromTo(".hud-item-left", 
  { x: -220, opacity: 0, scale: 0.9 }, 
  { x: 0, opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.5)", stagger: 0.2 }, 
  0.4
);
tl.fromTo(".hud-item-right", 
  { x: 220, opacity: 0, scale: 0.9 }, 
  { x: 0, opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.5)", stagger: 0.2 }, 
  0.6
);
```

---

## 7. Transiciones Cyberpunk HUD Obligatorias (Orbit, Zoom-Through y Glass Type)

Para mantener el estilo pericial de ciencia ficción de alta fidelidad, conecta directamente con `animaciones-17-efectos-reels`:
- **FXOrbit 3D:** Los 5 módulos de la Huella Biocéntrica orbitan alrededor del núcleo en elipse tridimensional (`rx: 340, ry: 110`), conectándose con haces láser SVG.
- **fxZoomThrough:** Cambios de escena atravesando el centro del radar holográfico o el visor biométrico (`scale: 1 -> 25x`).
- **FX17GlassType:** Los titulares de módulos periciales se renderizan con tipografía de cristal táctica, aberración cromática ligera y barrido de luz.
- **FX14DoodleBoil:** Resaltadores periciales y flechas holográficas vibrando a 10 Hz para señalar no conformidades o alertas de riesgo.
