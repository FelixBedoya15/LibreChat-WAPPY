---
name: hyperframes-motion-design
description: Estándar y sistema de diseño cinematográfico, motion graphics de alto impacto y animación GSAP avanzada para videos y reels en HyperFrames (basado en las directrices oficiales de HeyGen HyperFrames). Usar SIEMPRE que se diseñe, anime o edite cualquier video, reel o composición publicitaria.
---

# HyperFrames Motion Design & High-Impact Video Skill

Esta skill define el estándar de producción visual, dirección de arte y motion graphics avanzados para composiciones en **HyperFrames**, asegurando videos dinámicos, inmersivos y con calidad publicitaria de nivel Silicon Valley / HeyGen.

---

## 1. Principios de Dinamismo (Evitar Videos Planos)

Un video nunca debe ser una sucesión de cajas estáticas o fundidos simples. Todo elemento debe obedecer las leyes de la animación moderna:

### A. Movimiento de Cámara Digital (Virtual Camera / Punch-ins)
- **Nunca dejar el metraje base completamente estático:** En momentos clave de énfasis o revelación, aplicar un sutil punch-in (`scale: 1.05` a `1.15`) con `transform-origin` enfocado en el punto de interés (el monitor, el rostro, el documento).
- **Parallax de Capas:** El fondo se mueve a una velocidad suave, los elementos gráficos intermedios reaccionan y los textos en primer plano tienen entrada con inercia.

### B. Curvas de Aceleración Orgánicas (GSAP Easing)
- **Entradas Impactantes:** Usar `back.out(1.7)` o `elastic.out(1, 0.4)` para elementos que entran en escena (notificaciones, badges, iconos).
- **Movimientos Flotantes Continuos:** Usar `sine.inOut` con `yoyo: true, repeat: -1` para mantener vivos a avatares, mascotas (Tenshi) y orbes de luz de fondo.
- **Transiciones Rápidas:** Salidas rápidas con `power2.in` (0.4s - 0.6s) para mantener alto el ritmo de retención (Hook Retention).

---

## 2. Tipografía Cinética (Kinetic Typography)

- **Máscaras de Revelación (Clip-Path Reveals):** Las palabras clave no deben solo aparecer con opacidad; deben revelarse desde abajo como si salieran de una ranura:
  ```css
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  ```
- **Gradientes Metálicos y Neón:**
  `bg-gradient-to-r from-teal-300 via-cyan-200 to-emerald-400 bg-clip-text text-transparent` o `from-amber-300 via-orange-400 to-yellow-200`.
- **Efecto Resaltador Fluorescente:**
  Subrayados o cajas de acento que se expanden de izquierda a derecha (`scaleX: 0 -> 1`, `transformOrigin: "left center"`) justo cuando la voz o el momento lo pronuncia.
- **Subtítulos Estilo Hormozi:**
  Contenedor oscuro con borde iluminado, tipografía `extrabold` o `black`, palabra activa destacada en amarillo o verde neón con escala temporal (`scale: 1.15`).

---

## 3. Elementos Gráficos Futuristas & HUD (Sci-Fi / IA Visión Artificial)

Para interfaces de inteligencia artificial, visión por computadora y dashboards tecnológicos:
- **Láser de Escaneo (Scanline Sweep):** Una línea horizontal semitransparente con resplandor neón (`box-shadow: 0 0 15px #06b6d4`) que se desplaza verticalmente simulando un escaneo pericial.
- **Brackets de Visor Angular:** Esquinas tipo mira de francotirador/HUD en las 4 esquinas de pantallas o áreas de interés (`border-t-2 border-l-2`, etc.) que parpadean con pulso cibernético.
- **Líneas Guía con Punteros (Callout Lines):** Líneas finas conectando una etiqueta flotante con el objeto real en el video (ej: hombro ➔ ángulo 30°).
- **Gráficas Circulares y Barras de Carga:** Indicadores circulares SVG con `stroke-dashoffset` animado para mostrar métricas (0% ➔ 100%).

---

## 4. Microinteracciones de Notificaciones y Comentarios (Social Proof)

- **Burbujas de Notificación Estilo iOS / WhatsApp / Instagram:**
  - Fondo `backdrop-blur-xl` con borde de cristal (`rgba(255,255,255,0.15)`).
  - Ícono circular con sombra profunda y badge de verificación animado (`animate-bounce` o scale pop).
  - Entrada con rebote elástico:
    ```js
    tl.fromTo("#notif", { y: 60, scale: 0.8, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" });
    ```

---

## 5. Puesta en Escena Dinámica de Tenshi (Mascota / Copiloto)

Tenshi es el alma de WAPPY y no debe ser un sticker congelado:
- **Respiración y Flotación:** Debe flotar suavemente (`y: -8`, `duration: 2`, `yoyo: true, repeat: -1`).
- **Halo Luminoso Pulsante:** Un orbe difuso detrás de Tenshi con escala y opacidad reactiva (`opacity: 0.4 -> 0.7`).
- **Interacción Expresiva:**
  - Cuando apunta: Pequeño giro de inclinación (`rotation: -6deg -> 0deg`) y flechas neón que emiten ondas hacia el objetivo.
  - Cuando habla: Bocadillo de diálogo con punta dirigida hacia él, con entrada tipo pop.

---

## 6. Llamados a la Acción (CTA) de Alta Conversión

Para disparar comentarios en Reels / TikTok:
- **Palabra Clave en Escala Máxima:** La palabra disparadora (ej: `"TENSHI"`) debe ser el centro gravitacional de la pantalla, con marco en degradado de alta energía (naranja/ámbar).
- **Flechas Dinámicas en Cascada:** Indicadores luminosos apuntando hacia abajo (👇) con movimiento sincronizado.
- **Simulación Social (Comment Bubbles):** Burbujas flotantes de otros usuarios comentando la palabra clave (`💬 TENSHI`) que van emergiendo y flotando hacia arriba con ligera rotación aleatoria.

---

## 7. Buenas Prácticas Técnicas en HyperFrames

1. **Línea de Tiempo Registrada y Pausada:**
   `const tl = gsap.timeline({ paused: true });`
   `window.__timelines["main"] = tl; tl.seek(0);`
2. **Seek-Safe Animations:**
   Nunca usar `setTimeout`, `setInterval` o animaciones CSS dependientes del tiempo real del navegador. Todo el movimiento debe estar atado al tiempo absoluto del timeline de GSAP (usando la posición temporal como tercer argumento: `tl.to(target, vars, time)`).
3. **Optimización de Rendimiento:**
   Usar `will-change: transform, opacity;` en capas complejas.
   Usar resoluciones 9:16 balanceadas (como 720x1280) que ofrecen máxima nitidez en pantallas de celular y tiempos de renderizado mucho más ágiles.
