---
name: hyperframes-motion-design
description: "Estándar de animación GSAP seek-safe y motion graphics cinematográfico para composiciones HyperFrames (curvas elásticas, tipografía cinética, Tenshi vivo y CTAs)."
category: media-and-video
bundle: wappy-video-production
risk: safe
source: self
source_type: self
date_added: "2026-10-09"
author: wappy-ia
agents: [wappy-video-studio]
tags: [video, hyperframes, gsap, kinetic-typography, motion-design]
---

# HyperFrames Motion Design & GSAP Animation (`hyperframes-motion-design`)

## Overview

Define las reglas técnicas de animación con **GSAP (`gsap.timeline({ paused: true })`)** y puesta en escena cinematográfica para composiciones **HyperFrames**, garantizando animaciones *seek-safe* (aptas para captura fotograma a fotograma en Puppeteer/FFmpeg) sin elementos estáticos.

## When to Use

- **Usar cuando** el motor de renderizado elegido sea **HyperFrames con GSAP** (`window.__timelines["main"] = tl`) o se necesiten recetas de curvas GSAP, tipografía cinética (`clip-path`), burbujas de notificación iOS/WhatsApp y animación expresiva de Tenshi.
- **Coordinación con el Protocolo Maestro:**
  - Respetar siempre la dirección de arte del [`protocolo-produccion-videos`](../protocolo-produccion-videos/SKILL.md) («Una frase, una idea, una pieza», cero saturación de paneles).

## Prerequisites

- GSAP 3 cargado en la composición HTML.
- Registro obligatorio del timeline pausado en `window.__timelines["main"]`.

---

## How It Works

### 1. Principios de Dinamismo (Evitar Videos Planos)

#### A. Movimiento de Cámara Digital (Virtual Camera / Punch-ins)
- **Nunca dejar el metraje base completamente estático:** En momentos clave de énfasis o revelación, aplicar un sutil punch-in (`scale: 1.05` a `1.15`) con `transform-origin` enfocado en el punto de interés (el monitor, el rostro, el documento).
- **Parallax de Capas:** El fondo se mueve a una velocidad suave (`0.25x`), los elementos gráficos intermedios a `1.0x` y los textos en primer plano a `1.45x`.

#### B. Curvas de Aceleración Orgánicas (GSAP Easing)
- **Entradas Impactantes:** Usar `back.out(1.7)` o `elastic.out(1, 0.4)` para elementos que entran en escena (notificaciones, badges, iconos).
- **Movimientos Flotantes Continuos:** Usar `sine.inOut` con `yoyo: true, repeat: -1` para mantener vivos a avatares, mascotas (Tenshi) y orbes de luz de fondo.
- **Transiciones Rápidas:** Salidas rápidas con `power2.in` (`0.4s – 0.6s`) para mantener alto el ritmo de retención.

---

### 2. Tipografía Cinética (Kinetic Typography)

- **Máscaras de Revelación (Clip-Path Reveals):**
  ```css
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  ```
- **Gradientes Metálicos y Neón:**
  `bg-gradient-to-r from-teal-300 via-cyan-200 to-emerald-400 bg-clip-text text-transparent` o `from-amber-300 via-orange-400 to-yellow-200`.
- **Efecto Resaltador Fluorescente:**
  Subrayados o cajas de acento que se expanden de izquierda a derecha (`scaleX: 0 -> 1`, `transformOrigin: "left center"`) justo cuando la voz lo pronuncia.
- **Subtítulos Dinámicos:**
  Contenedor oscuro con borde iluminado, tipografía `extrabold` o `black`, palabra activa destacada en amarillo o verde lima (`#c7f303`) con escala temporal (`scale: 1.15`).

---

### 3. Microinteracciones de Notificaciones y Comentarios (Social Proof)

- **Burbujas de Notificación Estilo iOS / WhatsApp / Instagram:**
  - Fondo `backdrop-blur-xl` con borde de cristal (`rgba(255,255,255,0.15)`).
  - Ícono circular con sombra profunda y badge de verificación animado.
  - Entrada con rebote elástico:
    ```js
    tl.fromTo("#notif", { y: 60, scale: 0.8, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" });
    ```

---

### 4. Puesta en Escena Dinámica de Tenshi (Mascota / Copiloto)

Tenshi no debe ser un sticker congelado:
- **Respiración y Flotación:** Flotación suave (`y: -8`, `duration: 2`, `yoyo: true, repeat: -1`).
- **Halo Luminoso Pulsante:** Orbe difuso detrás de Tenshi con escala y opacidad reactiva (`opacity: 0.4 -> 0.7`).
- **Interacción Expresiva:**
  - Cuando apunta: Pequeño giro de inclinación (`rotation: -6deg -> 0deg`) y flechas que emiten ondas hacia el objetivo.
  - Cuando habla: Bocadillo de diálogo con punta dirigida hacia él, con entrada tipo pop.

---

### 5. Llamados a la Acción (CTA) de Alta Conversión

- **Palabra Clave en Escala Máxima:** La palabra disparadora (ej: `"TENSHI"` o `"WAPPY"`) como centro gravitacional de la pantalla.
- **Flechas Dinámicas en Cascada:** Indicadores luminosos apuntando hacia abajo con movimiento sincronizado.
- **Simulación Social (Comment Bubbles):** Burbujas flotantes comentando la palabra clave (`💬 TENSHI`) que emergen con ligera rotación.

---

### 6. Buenas Prácticas Técnicas en HyperFrames (Seek-Safe)

1. **Línea de Tiempo Registrada y Pausada:**
   ```js
   const tl = gsap.timeline({ paused: true });
   window.__timelines["main"] = tl;
   tl.seek(0);
   ```
2. **Seek-Safe Animations:**
   Nunca usar `setTimeout`, `setInterval` o animaciones CSS dependientes del tiempo real del navegador. Todo el movimiento debe estar atado al tiempo absoluto del timeline de GSAP (`tl.to(target, vars, time)`).
3. **Optimización de Rendimiento:**
   Usar `will-change: transform, opacity;` en capas complejas.
4. **Gesticulación Natural y Punteros Sutiles:**
   Los avatares y presentadores usan gesticulación natural de oratoria humana. Para destacar elementos se usan anillos de pulso (`pulse-ring`), destellos o micro-tarjetas flotantes sobre el objeto de interés.

---

## Verification

- Comprobar que `window.__timelines["main"].seek(t)` reproduzca exactamente el estado visual de cualquier segundo `t` sin depender de `setInterval` ni `requestAnimationFrame` externos.

## Safety and Side Effects

- **Risk level:** `safe` — Animaciones GSAP deterministas en el cliente/renderizador local.

## Sources and Related Skills

- [`protocolo-produccion-videos`](../protocolo-produccion-videos/SKILL.md)
- [`animaciones-17-efectos-reels`](../animaciones-17-efectos-reels/SKILL.md)
- [`animaciones-wappy-brand`](../animaciones-wappy-brand/SKILL.md)
