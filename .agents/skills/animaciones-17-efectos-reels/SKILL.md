---
name: animaciones-17-efectos-reels
description: "Catálogo y motor de los 17 Efectos Virales de Edición y Motion Graphics para Reels/TikTok/YouTube (@prompteafacil + WAPPY IA): 01 Giro 3D, 02 Couch wall, 03 UI world, 04 Frame break, 05 Digital zoom, 06 iPhone mockup, 07 Checklist, 08 Headline wall, 09 Corte con zoom, 10 Chart grow, 11 Zoom out, 12 Green screen, 13 Paper cut, 14 Doodle boil, 15 Vértigo (Dolly Zoom), 16 Cover story y 17 Glass type, incluyendo la interfaz Showcase con menú izquierdo (01-08), iPhone central con Dynamic Island + contador (09/17) y menú derecho (09-17) resaltado en verde lima (#c7f303). Úsala SIEMPRE que el usuario pida usar los 17 efectos de reels, aplicar cualquiera de estos 17 efectos por nombre, o montar un reel estilo catálogo/showcase interactivo."
---

# Los 17 Efectos Virales de Reels (`animaciones-17-efectos-reels`)

Esta skill implementa los **17 efectos de motion graphics y cámara más virales en Reels y TikTok** (inspirados en la referencia de `@prompteafacil` y fusionados con la identidad visual de **WAPPY IA `#c7f303`**, las **5 Leyes Cinéticas** y tu **Avatar 3D Low-Poly en Three.js**).

La plantilla carga automáticamente `motor/efectos-17-reels.js`, `motor/wappy-brand.js`, `motor/wappy-avatar3d.js` y `motor/three.min.js`.

---

## 1. Los 17 Efectos Incluidos en `motor/efectos-17-reels.js`

| # | Nombre del Efecto | Clase / Función en el Motor | Qué hace visualmente |
|---|---|---|---|
| **01** | **Giro 3D** | `fx01Giro3D(t, t0, dur, desdeY, desdeX)` | Rota cualquier tarjeta, iPhone o ventana en perspectiva 3D (`rotateY`, `rotateX`) con rebote elástico `E.spring`. |
| **02** | **Couch wall** | `FX08HeadlineWall` (en `WORLD` detrás del sujeto) | Coloca un muro gráfico/tipográfico en el plano de la pared detrás del presentador o avatar recortado. |
| **03** | **UI world** | `new FX03UIWorld({ t0, tarjetas })` | Despliega tarjetas de interfaz flotando en arco 3D alrededor del personaje con entrada escalonada (`Stagger`) y micro-flotación. |
| **04** | **Frame break** | `fx04FrameBreak(t, t0)` | La cabeza/hombros del presentador o del Avatar 3D sobresalen por encima del marco del contenedor o del iPhone rompiendo la cuarta pared. |
| **05** | **Digital zoom** | `fx05DigitalZoom(t, t0, factor, dur)` | Acercamiento digital rápido (`E.out4`) hacia el rostro o dato clave. |
| **06** | **iPhone mockup** | `Showcase17Reels` / `.fx-iphone` | Marco realista de iPhone con *Dynamic Island*, bisel metálico y píldora de progreso (`09/17`). |
| **07** | **Checklist** | `new FX07Checklist({ t0, items })` | Lista de verificación oscura con borde verde lima `#c7f303` cuyos checks `✓` entran uno tras otro con rebote. |
| **08** | **Headline wall** | `new FX08HeadlineWall({ t0, texto })` | Muro de titulares gigantes repetidos (combinando texto sólido `#c7f303` y texto en contorno `outline`) que se deslizan en sentidos opuestos. |
| **09** | **Corte con zoom** | `fx09CorteConZoom(t, tCorte, 1.18)` | Punch-in instantáneo al fotograma exacto del cambio de frase para mantener la retención sin parpadeos. |
| **10** | **Chart grow** | `barra()` + `crecer()` | Barras de métricas o comparativas que crecen desde la base con resplandor y revelan la cifra al alcanzar su altura. |
| **11** | **Zoom out** | `fx11ZoomOut(t, t0, 1.38, 0.65)` | Alejamiento suave desde un plano cerrado para revelar todo el ecosistema o el menú lateral. |
| **12** | **Green screen** | `estadoVideo(t)` / `WappyAvatar3D` | Superposición del presentador recortado sin fondo (o el Avatar 3D con `alpha: true`) delante de cualquier página web, norma o interfaz. |
| **13** | **Paper cut** | `new FX13PaperCut({ t0, texto })` | Rótulo estilo recorte de revista/papel con borde grueso, sombra dura verde lima y cadencia *stop-motion* a 12 fps. |
| **14** | **Doodle boil** | `new FX14DoodleBoil({ t0, color })` | Trazos dibujados a mano (coronas, flechas curvas, subrayados) que vibran orgánicamente a 10 Hz (*boiling lines*). |
| **15** | **Vértigo** | `fx15Vertigo(t, t0, dur)` | Efecto *Dolly Zoom* (Hitchcock): el fondo se agranda (`1.0 -> 1.36`) mientras el sujeto en primer plano se contrae (`1.18 -> 0.94`). |
| **16** | **Cover story** | `new FX16CoverStory({ t0, revista, titular })` | Portada de revista editorial de lujo (`Instrument Serif` + insignia verde lima) donde el sujeto protagoniza la portada. |
| **17** | **Glass type** | `new FX17GlassType({ t0, texto })` | Tipografía en cristal esmerilado (`backdrop-filter: blur(24px)`) con borde especular y barrido de luz diagonal continuo. |

---

## 2. Cómo usar el Modo Showcase (`Showcase17Reels` — Igual a la Captura de Instagram)

Si quieres mostrar el panel izquierdo (`01` a `08`), el **iPhone central** con el contador (`09/17`) y el panel derecho (`09` a `17`) iluminando en **verde lima `#c7f303`** el efecto activo en cada segundo:

```js
const showcase = new Showcase17Reels({ t0: 0.1 });

// En render(t):
// Calcula qué efecto (1..17) está activo según el segundo t
const efectoActivo = Math.min(17, Math.max(1, Math.floor(t / 1.5) + 1));
showcase.pintar(t, {
  xLeft: 360,
  xPhone: CX,
  xRight: 1560,
  y: 540,
  activo: efectoActivo, // ilumina la fila correspondiente en verde lima #c7f303 y actualiza "09/17"
  ryPhone: efectoActivo === 1 ? fx01Giro3D(t, 0.1).ry : 0,
  zoomPhone: efectoActivo === 9 ? 1.12 : 1,
  o: 1,
});
```

---

## 3. Cumplimiento de las 5 Leyes Cinéticas Obligatorias

Todos los componentes de `efectos-17-reels.js` vienen programados de fábrica con tus 5 leyes:
1. **Curvas con Rebote (`E.spring`, `E.back`):** Todos los paneles, checks y recortes entran con muelle elástico.
2. **Entradas Escalonadas (`staggerP`):** Las filas, tarjetas de `FX03UIWorld`, líneas de `FX08HeadlineWall` e ítems de `FX07Checklist` entran uno después de otro en cascada.
3. **Parallax en 3 Capas (`parallaxPos`):** Fondo (`0.25x`), Medio (`1.0x`) y Frente (`1.45x`) a velocidades distintas.
4. **Micro-Movimientos Constantes (`microFloat`):** Flotación perpetua en los paneles, iPhone y tarjetas + vibración a 10 Hz en `FX14DoodleBoil`.
5. **Sable Láser en Manos (`SableLaserMano`):** Listo para encenderse cada vez que las manos del presentador o del Avatar 3D señalen o accionen un cambio de efecto.
