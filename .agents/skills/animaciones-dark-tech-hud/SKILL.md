---
name: animaciones-dark-tech-hud
description: "Catálogo opcional de estética Dark Tech Cyberpunk / HUD Glassmorphism para Reels (9:16). Activar SOLO cuando el usuario pida explícitamente estilo Cyberpunk o HUD."
category: media-and-video
bundle: wappy-video-production
risk: safe
source: self
source_type: self
date_added: "2026-10-24"
author: wappy-ia
agents: [wappy-video-studio]
tags: [video, cyberpunk, hud, dark-tech, glassmorphism, biocentric-core]
---

# Animaciones Dark Tech HUD · Catálogo Opcional (`animaciones-dark-tech-hud`)

## Overview

Catálogo opcional de estética **Dark Tech Cyberpunk / HUD Glassmorphism** para vídeos verticales (`9:16`) y representaciones radiales de la **Huella Biocéntrica**.

## When to Use

- **Activar ÚNICAMENTE** cuando el usuario pida explícitamente un vídeo con estética **Cyberpunk, consola futurista, escaneo biométrico o HUD pericial**.
- **Cuándo NO usar:**
  - **NO usar como estilo por defecto.** El estilo por defecto de los vídeos de WAPPY IA es el **Estilo Pro Limpio** ([`protocolo-produccion-videos`](../protocolo-produccion-videos/SKILL.md): fondo `#06080d` liso, tarjetas sólidas `#10151e`, una sola pieza a la vez, cero ruido visual).
  - Incluso cuando se active bajo pedido explícito, seleccionar solo 1 o 2 componentes tácticos sin amontonar paneles.

## Prerequisites

- GSAP (`gsap.timeline({ paused: true })`) o motor HTML a 60 fps.
- Tipografías *Plus Jakarta Sans* / *Outfit* (`800–900`) y *JetBrains Mono* para métricas técnicas.

---

## How It Works

### 1. Paleta de Color y Atmósfera Cósmica

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

#### Orbes y Luces de Fondo (Parallax & Depth)
```html
<div class="bg-cyber-grid"></div>
<div id="orb-teal" class="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-teal-500/20 blur-[110px] pointer-events-none"></div>
<div id="orb-cyan" class="absolute top-[40%] -right-24 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none"></div>
<div id="orb-lime" class="absolute bottom-10 left-[20%] w-[380px] h-[380px] rounded-full bg-lime-400/15 blur-[115px] pointer-events-none"></div>
```

---

### 2. Componentes Tácticos HUD Disponibles (Usar con Moderación)

Selecciona únicamente 1 o 2 de estos componentes cuando el usuario solicite estética HUD (nunca combinarlos todos a la vez):

#### A. Rejilla Cibernética (`.bg-cyber-grid`)
```css
.bg-cyber-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(to right, rgba(6, 182, 212, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(20, 184, 166, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events-none: none;
}
```

#### B. Haz Láser de Escaneo (`.scanline-beam`)
```css
.scanline-beam {
  position: absolute; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.4) 20%, #22d3ee 50%, rgba(52, 211, 153, 0.4) 80%, transparent 100%);
  box-shadow: 0 0 20px #22d3ee, 0 0 40px #10b981;
  pointer-events: none;
}
```

#### C. Radar Holográfico SVG (`#bg-radar`)
Colocado en una esquina superior o tras el núcleo central, girando a velocidad constante (360° en 8s).

#### D. Esquinas Cibernéticas Tácticas (`.corner-bracket`)
Visores en las esquinas de tarjetas o contenedores principales (`border-t-2 border-l-2 border-cyan-400`, `drop-shadow(0 0 6px #22d3ee)`).

#### E. Ecualizador Dinámico Reactivo (`.eq-pulse`)
Barras luminosas en cian, teal y lima que simulan la transmisión de datos o la voz activa.

---

### 3. Ley Estricta de Tipografía Mobile-First (Legibilidad en Celular)

- **Titulares Principales:** `44px a 56px` en 720p (`56px a 72px` en 1080p), *Plus Jakarta Sans* o *Outfit* (`800–900`), resaltador `--w-lime` (`#c7f303`) o cian eléctrico (`#22d3ee`).
- **Subtítulos y Bajadas:** `24px a 32px`, `line-height: 1.3`.
- **Datos Técnicos, Métricas y Badges:** `18px a 24px`, fuente monoespaciada *JetBrains Mono*.

---

### 4. Leyes Cinéticas: Entradas Laterales y Micro-Flotación

#### A. Listas y Tarjetas que Entran desde los Lados (Slide-in Stagger L/R)
- Elementos impares (1, 3, 5): Entran desde la **izquierda** (`x: -160px ➔ 0`) con inercia elástica `back.out(1.5)`.
- Elementos pares (2, 4): Entran desde la **derecha** (`x: 160px ➔ 0`).
- Escalonamiento (`stagger`): Desfase de `0.15s` a `0.22s` sincronizado con la locución.

#### B. Micro-Flotación Constante (Living UI)
```js
element.style.transform = `translateY(${Math.sin(t * 2.2 + index) * 6}px)`;
```

---

### 5. Diseño del Núcleo Central Rodeado (Huella Biocéntrica & Ecosistemas)

Cuando se represente la **Huella Biocéntrica** o el **Ecosistema WAPPY** en modo HUD, usar arquitectura orbital radial en lugar de una lista estática:
1. **Núcleo Central Holográfico:** Huella dactilar holográfica, avatar o escudo bio-seguridad con anillos pulsantes (`pulse-ring`).
2. **5 Satélites Radiales Rodeando el Núcleo:**
   - **Nodo 1 (Arriba Izquierda):** Perfil del Cargo.
   - **Nodo 2 (Arriba Derecha):** Perfil Sociodemográfico.
   - **Nodo 3 (Centro Derecha):** Condiciones de Salud.
   - **Nodo 4 (Abajo Derecha):** Matriz Bio-IPVR.
   - **Nodo 5 (Abajo Izquierda):** Compatibilidad Cargo-Colaborador (92% FIT).
3. **Líneas Láser Conectoras (SVG Lasers):** Rayos vectoriales con `stroke-dashoffset` animado conectando el núcleo con cada satélite.

---

### 6. Plantilla Estructural GSAP (HyperFrames / Puppeteer Safe)

```javascript
const tl = gsap.timeline({ paused: true });

tl.fromTo("#camera-stage", 
  { scale: 1.08, y: 30 }, 
  { scale: 1.0, y: 0, duration: 1.2, ease: "power3.out" }, 
  0
);

tl.fromTo(".scanline-beam", 
  { top: "0%", opacity: 0 }, 
  { top: "100%", opacity: 1, duration: 2.8, ease: "sine.inOut", repeat: -1 }, 
  0
);

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

## Verification

- Confirmar que el usuario haya pedido explícitamente estética Cyberpunk / HUD antes de aplicar `.bg-cyber-grid` o `.scanline-beam`.
- Verificar que todos los textos superen el tamaño mínimo mobile-first (`>= 18px`).

## Safety and Side Effects

- **Risk level:** `safe` — Estilos CSS y líneas de tiempo GSAP locales.

## Sources and Related Skills

- [`protocolo-produccion-videos`](../protocolo-produccion-videos/SKILL.md)
- [`animaciones-17-efectos-reels`](../animaciones-17-efectos-reels/SKILL.md)
- [`hyperframes-motion-design`](../hyperframes-motion-design/SKILL.md)
