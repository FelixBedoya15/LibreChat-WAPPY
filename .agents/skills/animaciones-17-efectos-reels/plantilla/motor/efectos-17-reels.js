'use strict';
/* =====================================================================
   LIBRERÍA OFICIAL DE LOS 17 EFECTOS VIRALES DE REELS (@prompteafacil + WAPPY)
   ---------------------------------------------------------------------
   01. Giro 3D          (Giro3DFX)
   02. Couch wall       (CouchWallFX)
   03. UI world         (UIWorldFX)
   04. Frame break      (FrameBreakFX)
   05. Digital zoom     (DigitalZoomFX)
   06. iPhone mockup    (IPhoneMockupFX)
   07. Checklist        (ChecklistFX)
   08. Headline wall    (HeadlineWallFX)
   09. Corte con zoom   (CorteConZoomFX)
   10. Chart grow       (ChartGrowFX)
   11. Zoom out         (ZoomOutFX)
   12. Green screen     (GreenScreenFX)
   13. Paper cut        (PaperCutFX)
   14. Doodle boil      (DoodleBoilFX)
   15. Vértigo          (VertigoFX)
   16. Cover story      (CoverStoryFX)
   17. Glass type       (GlassTypeFX)
   + Showcase17Menu     (Menú lateral izquierdo 01–08 + iPhone central + derecho 09–17)
   ===================================================================== */

(function inyectarCSS17Efectos() {
  const css = `
  /* =====================================================================
     ESTILOS DE LOS 17 EFECTOS VIRALES + SHOWCASE MENU (@prompteafacil)
     ===================================================================== */
  /* Showcase Menu Lateral (01-08 Izquierda | iPhone Centro | 09-17 Derecha) */
  .fx17-panel {
    width: 340px; border-radius: 26px;
    background: rgba(18, 22, 26, 0.88);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 28px 60px rgba(0, 0, 0, 0.55);
    padding: 22px 24px; display: flex; flex-direction: column; gap: 11px;
    font-family: var(--sans);
  }
  .fx17-row {
    display: flex; align-items: center; gap: 14px;
    padding: 6px 10px; border-radius: 12px;
    transition: all 0.2s ease;
  }
  .fx17-row .num {
    font-family: var(--mono); font-size: 16px; font-weight: 700;
    color: rgba(255, 255, 255, 0.38); min-width: 26px;
  }
  .fx17-row .lbl {
    font-size: 21px; font-weight: 700; color: rgba(255, 255, 255, 0.82);
    letter-spacing: -0.01em; white-space: nowrap;
  }
  .fx17-row.active {
    background: rgba(199, 243, 3, 0.14);
    border: 1px solid rgba(199, 243, 3, 0.35);
  }
  .fx17-row.active .num { color: #c7f303; }
  .fx17-row.active .lbl {
    color: #c7f303; font-weight: 900;
    text-shadow: 0 0 18px rgba(199, 243, 3, 0.55);
  }

  /* 06. iPhone Mockup con Dynamic Island y contador 09/17 */
  .fx-iphone {
    width: 440px; height: 790px; border-radius: 64px;
    background: #0b0d11;
    border: 8px solid #2c313c;
    box-shadow: 0 0 0 2px #d4d8e2, 0 40px 90px -15px rgba(0, 0, 0, 0.78);
    position: relative; overflow: hidden;
  }
  .fx-iphone .island {
    position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
    width: 126px; height: 34px; border-radius: 999px;
    background: #000; z-index: 20;
    box-shadow: inset 0 0 4px rgba(255,255,255,0.15);
  }
  .fx-iphone .counter-pill {
    position: absolute; top: 64px; left: 26px; z-index: 20;
    background: rgba(14, 19, 0, 0.76); backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 6px 14px; border-radius: 12px;
    font-family: var(--mono); font-size: 18px; font-weight: 700; color: #fff;
  }
  .fx-iphone .screen {
    position: absolute; inset: 0; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle at 50% 35%, #222938, #0d1017 75%);
  }

  /* 02 & 08. Couch Wall / Headline Wall (Muro Tipográfico Gigante Detrás del Sujeto) */
  .fx-headline-wall {
    width: 1760px; display: flex; flex-direction: column; align-items: center; gap: 6px;
    pointer-events: none;
  }
  .fx-headline-wall .line {
    font-family: var(--sans); font-weight: 900; font-size: 138px;
    line-height: 0.92; letter-spacing: -0.04em; text-transform: uppercase;
    white-space: nowrap; color: rgba(255, 255, 255, 0.13);
  }
  .fx-headline-wall .line.solid {
    color: #c7f303;
    text-shadow: 0 18px 50px rgba(199, 243, 3, 0.35);
  }
  .fx-headline-wall .line.outline {
    color: transparent;
    -webkit-text-stroke: 3px rgba(255, 255, 255, 0.32);
  }

  /* 07. Checklist Interactiva con Checks Escalonados */
  .fx-checklist {
    width: 680px; border-radius: 32px;
    background: rgba(14, 19, 0, 0.92);
    border: 2px solid rgba(199, 243, 3, 0.45);
    box-shadow: 0 32px 70px rgba(0, 0, 0, 0.55);
    padding: 32px 36px; display: flex; flex-direction: column; gap: 18px;
  }
  .fx-checklist .item {
    display: flex; align-items: center; gap: 20px;
    background: rgba(255, 255, 255, 0.06);
    border: 1.5px solid rgba(255, 255, 255, 0.1);
    padding: 18px 24px; border-radius: 20px;
  }
  .fx-checklist .item.checked {
    background: rgba(199, 243, 3, 0.14);
    border-color: #c7f303;
  }
  .fx-checklist .box {
    width: 42px; height: 42px; border-radius: 12px;
    background: #c7f303; color: #0e1300;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: 900; flex: none;
  }
  .fx-checklist .txt {
    font-size: 26px; font-weight: 800; color: #fff;
  }

  /* 13. Paper Cut (Recorte Estilo Collage / Revista con Borde Blanco y Sombra Dura) */
  .fx-papercut {
    padding: 26px 38px; background: #fbfbf7; color: #0e1300;
    border-radius: 6px;
    box-shadow: 12px 14px 0px #c7f303, 0 28px 60px rgba(0,0,0,0.55);
    border: 4px solid #0e1300;
    font-family: var(--sans); font-weight: 900; font-size: 46px;
    letter-spacing: -0.03em; text-transform: uppercase;
  }

  /* 16. Cover Story (Portada de Revista Editorial) */
  .fx-cover-story {
    width: 620px; height: 780px; border-radius: 28px;
    background: linear-gradient(180deg, #162208 0%, #0e1300 100%);
    border: 4px solid #f6f5ef;
    box-shadow: 0 40px 90px rgba(0, 0, 0, 0.65);
    padding: 34px 36px; position: relative; overflow: hidden;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .fx-cover-story .masthead {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 92px; font-weight: 700; line-height: 0.88;
    letter-spacing: -0.03em; color: #f6f5ef; text-align: center;
    border-bottom: 2px solid rgba(199, 243, 3, 0.5); padding-bottom: 16px;
  }
  .fx-cover-story .badge-issue {
    display: inline-block; background: #c7f303; color: #0e1300;
    font-family: var(--mono); font-size: 16px; font-weight: 900;
    padding: 6px 14px; border-radius: 999px; text-transform: uppercase;
  }
  .fx-cover-story .cover-headline {
    font-size: 46px; font-weight: 900; line-height: 1.05; color: #fff;
    letter-spacing: -0.03em;
  }
  .fx-cover-story .cover-headline span { color: #c7f303; }

  /* 17. Glass Type (Tipografía Acrílica / Cristal Esmerilado con Refracción) */
  .fx-glass-type {
    padding: 30px 54px; border-radius: 34px;
    background: linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.06) 100%);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 2px solid rgba(255, 255, 255, 0.45);
    box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45), inset 0 2px 20px rgba(255, 255, 255, 0.35);
    font-family: var(--sans); font-size: 72px; font-weight: 900;
    letter-spacing: -0.035em; color: #ffffff;
    text-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
    position: relative; overflow: hidden;
  }
  .fx-glass-type .sheen {
    position: absolute; top: -50%; left: -30%; width: 45%; height: 200%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
    transform: rotate(25deg); pointer-events: none;
  }
  `;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
})();

/* =====================================================================
   CATÁLOGO DE LOS 17 EFECTOS VIRALES DE REELS
   ===================================================================== */
const LISTA_17_EFECTOS = [
  { num: '01', id: 'giro3d',       nombre: 'Giro 3D' },
  { num: '02', id: 'couchwall',    nombre: 'Couch wall' },
  { num: '03', id: 'uiworld',      nombre: 'UI world' },
  { num: '04', id: 'framebreak',   nombre: 'Frame break' },
  { num: '05', id: 'digitalzoom',  nombre: 'Digital zoom' },
  { num: '06', id: 'iphonemockup', nombre: 'iPhone mockup' },
  { num: '07', id: 'checklist',    nombre: 'Checklist' },
  { num: '08', id: 'headlinewall', nombre: 'Headline wall' },
  { num: '09', id: 'cortezoom',    nombre: 'Corte con zoom' },
  { num: '10', id: 'chartgrow',    nombre: 'Chart grow' },
  { num: '11', id: 'zoomout',      nombre: 'Zoom out' },
  { num: '12', id: 'greenscreen',  nombre: 'Green screen' },
  { num: '13', id: 'papercut',     nombre: 'Paper cut' },
  { num: '14', id: 'doodleboil',   nombre: 'Doodle boil' },
  { num: '15', id: 'vertigo',      nombre: 'Vértigo' },
  { num: '16', id: 'coverstory',   nombre: 'Cover story' },
  { num: '17', id: 'glasstype',    nombre: 'Glass type' },
];

/* =====================================================================
   COMPONENTE MAESTRO DE LA CAPTURA:
   Menú Izquierdo (01-08) + iPhone Mockup Central + Menú Derecho (09-17)
   ===================================================================== */
class Showcase17Reels {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.leftEl = mk('div', 'L fx17-panel z5');
    this.rightEl = mk('div', 'L fx17-panel z5');
    this.phoneEl = mk('div', 'L fx-iphone z6');

    const renderRows = (arr) => arr.map(it => `
      <div class="fx17-row" data-num="${it.num}">
        <span class="num">${it.num}</span>
        <span class="lbl">${it.nombre}</span>
      </div>
    `).join('');

    this.leftEl.innerHTML = renderRows(LISTA_17_EFECTOS.slice(0, 8));
    this.rightEl.innerHTML = renderRows(LISTA_17_EFECTOS.slice(8, 17));

    this.phoneEl.innerHTML = `
      <div class="island"></div>
      <div class="counter-pill">01/17</div>
      <div class="screen"></div>
    `;
    this._counter = this.phoneEl.querySelector('.counter-pill');
    this._screen = this.phoneEl.querySelector('.screen');
    this._rows = [
      ...this.leftEl.querySelectorAll('.fx17-row'),
      ...this.rightEl.querySelectorAll('.fx17-row'),
    ];
  }

  /* activo: número 1..17 que se ilumina en verde lima (#c7f303) */
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.05) {
      off(this.leftEl); off(this.rightEl); off(this.phoneEl);
      return;
    }
    const activo = clamp(Math.round(k.activo ?? 9), 1, 17);
    const numStr = String(activo).padStart(2, '0');
    this._counter.textContent = `${numStr}/17`;

    this._rows.forEach((r, idx) => {
      r.classList.toggle('active', idx + 1 === activo);
    });

    const pL = P(t, this.t0, 0.52, E.spring);
    const pP = P(t, this.t0 + 0.1, 0.56, E.spring);
    const pR = P(t, this.t0 + 0.2, 0.52, E.spring);

    const mL = typeof microFloat === 'function' ? microFloat(t, 1.1) : { dx: 0, dy: 0, dr: 0 };
    const mP = typeof microFloat === 'function' ? microFloat(t, 2.2) : { dx: 0, dy: 0, dr: 0 };
    const mR = typeof microFloat === 'function' ? microFloat(t, 3.3) : { dx: 0, dy: 0, dr: 0 };

    put(this.leftEl, {
      x: (k.xLeft ?? 360) + mL.dx,
      y: (k.y ?? 540) + (1 - pL) * 40 + mL.dy,
      s: lerp(0.84, 1, pL),
      r: mL.dr * 0.4,
      o: clamp(pL * 1.6) * op,
    });

    put(this.phoneEl, {
      x: (k.xPhone ?? CX) + mP.dx,
      y: (k.y ?? 540) + (1 - pP) * 48 + mP.dy,
      s: lerp(0.82, 1, pP) * (k.zoomPhone ?? 1),
      ry: k.ryPhone ?? 0,
      rx: k.rxPhone ?? 0,
      r: mP.dr * 0.35,
      o: clamp(pP * 1.6) * op,
    });

    put(this.rightEl, {
      x: (k.xRight ?? 1560) + mR.dx,
      y: (k.y ?? 540) + (1 - pR) * 40 + mR.dy,
      s: lerp(0.84, 1, pR),
      r: mR.dr * 0.4,
      o: clamp(pR * 1.6) * op,
    });
  }
}

/* =====================================================================
   FUNCIONES Y CLASES DE LOS 17 EFECTOS INDIVIDUALES
   ===================================================================== */

/* 01. Giro 3D: Volteo tridimensional con perspectiva e inclinación elástica */
function fx01Giro3D(t, t0, dur = 0.65, desdeY = -75, desdeX = 18) {
  const p = P(t, t0, dur, E.spring);
  return {
    ry: lerp(desdeY, 0, p),
    rx: lerp(desdeX, 0, p),
    s: lerp(0.76, 1, p),
    o: clamp(p * 2.2),
  };
}

/* 02 & 08. Couch Wall / Headline Wall: Muro tipográfico detrás del presentador/avatar */
class FX08HeadlineWall {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.el = mk('div', 'L fx-headline-wall z2', o.parent || WORLD);
    const palabra = o.texto || 'WAPPY IA';
    this.el.innerHTML = [0, 1, 2, 3].map(i =>
      `<div class="line ${i === 1 ? 'solid' : i % 2 === 0 ? 'outline' : ''}">${palabra} · ${palabra}</div>`
    ).join('');
    this._lines = [...this.el.querySelectorAll('.line')];
  }
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.05) { off(this.el); return; }
    put(this.el, { x: k.x ?? CX, y: k.y ?? CY, s: k.s ?? 1, o: op });
    this._lines.forEach((ln, i) => {
      const p = staggerP(t, this.t0, i, 0.09, 0.5, E.spring);
      const dir = i % 2 === 0 ? 1 : -1;
      const drift = (t - this.t0) * 28 * dir;
      ln.style.opacity = clamp(p * 1.6).toFixed(3);
      ln.style.transform = `translateX(${((1 - p) * 140 * dir + drift).toFixed(1)}px)`;
    });
  }
}

/* 03. UI World: Tarjetas flotando en arco 3D alrededor del personaje */
class FX03UIWorld {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.cards = (o.tarjetas || [
      { titulo: 'Matriz GTC-45', tag: 'HITO 3', x: 460, y: 340, ry: 22 },
      { titulo: 'Bio-Individuo 360°', tag: 'NÚCLEO', x: 1460, y: 340, ry: -22 },
      { titulo: 'Resolución 0312', tag: 'AUDITORÍA', x: 460, y: 740, ry: 18 },
      { titulo: 'Votación QR Secreta', tag: 'COMITÉS', x: 1460, y: 740, ry: -18 },
    ]).map((c, i) => {
      const el = mk('div', 'L w-bento-card z5');
      el.style.width = '440px';
      el.innerHTML = `
        <div class="icon-box">${WAPPY_LOTTIE.aiSparkles(0, 50)}</div>
        <div class="txt">
          <div class="tag">${c.tag}</div>
          <div class="tit" style="font-size:24px">${c.titulo}</div>
        </div>
      `;
      return { ...c, el, idx: i };
    });
  }
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    this.cards.forEach(c => {
      if (op <= 0.002 || t < this.t0 - 0.05) { off(c.el); return; }
      const p = staggerP(t, this.t0, c.idx, 0.11, 0.55, E.spring);
      const m = microFloat(t, c.idx * 1.7);
      put(c.el, {
        x: c.x + m.dx,
        y: c.y + (1 - p) * 45 + m.dy,
        ry: lerp(c.ry * 2.2, c.ry, p) + m.dr,
        rx: 5,
        s: lerp(0.7, 1, p),
        o: clamp(p * 1.8) * op,
      });
    });
  }
}

/* 04. Frame Break: El personaje / elemento rompe el borde del contenedor saliendo por arriba */
function fx04FrameBreak(t, t0) {
  const p = P(t, t0, 0.52, E.spring);
  return { scaleSubject: lerp(0.9, 1.24, p), offsetY: lerp(20, -48, p) };
}

/* 05 & 09 & 11. Digital Zoom / Corte con Zoom / Zoom Out */
function fx05DigitalZoom(t, t0, factor = 1.28, dur = 0.38) {
  return lerp(1, factor, P(t, t0, dur, E.out4));
}
function fx09CorteConZoom(t, tCorte, factor = 1.18) {
  return t >= tCorte ? factor : 1.0;
}
function fx11ZoomOut(t, t0, desde = 1.38, dur = 0.65) {
  return lerp(desde, 1.0, P(t, t0, dur, E.out4));
}

/* 07. Checklist con Rebote Escalonado */
class FX07Checklist {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.el = mk('div', 'L fx-checklist z6');
    const items = o.items || [
      '01 · Curvas con rebote elástico (E.spring)',
      '02 · Entradas escalonadas (Stagger)',
      '03 · Parallax de 3 capas a distintas velocidades',
      '04 · Micro-movimientos constantes + Sable Láser',
    ];
    this.el.innerHTML = items.map(txt => `
      <div class="item checked">
        <div class="box">✓</div>
        <div class="txt">${txt}</div>
      </div>
    `).join('');
    this._items = [...this.el.querySelectorAll('.item')];
  }
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.05) { off(this.el); return; }
    const p = P(t, this.t0, 0.48, E.spring);
    put(this.el, { x: k.x ?? CX, y: k.y ?? CY, s: lerp(0.86, 1, p), o: clamp(p * 1.8) * op });
    this._items.forEach((it, i) => {
      const pi = staggerP(t, this.t0 + 0.1, i, 0.14, 0.45, E.spring);
      it.style.opacity = clamp(pi * 1.8).toFixed(3);
      it.style.transform = `translateX(${((1 - pi) * -40).toFixed(1)}px) scale(${lerp(0.9, 1, pi).toFixed(3)})`;
    });
  }
}

/* 13. Paper Cut: Collage con recorte de papel y sombra dura verde lima */
class FX13PaperCut {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.el = mk('div', 'L fx-papercut z6', null, o.texto || '⚡ AUTOMATIZA TU SG-SST');
  }
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.05) { off(this.el); return; }
    // Efecto stop-motion (cuantizado a 12 fps para dar textura paper-cut auténtica)
    const tStep = Math.floor(t * 12) / 12;
    const p = P(t, this.t0, 0.4, E.back);
    const tilt = (k.r ?? -4) + Math.sin(tStep * 8) * 1.8;
    put(this.el, { x: k.x ?? CX, y: k.y ?? CY, s: lerp(0.5, 1, p), r: tilt, o: clamp(p * 2) * op });
  }
}

/* 14. Doodle Boil: Trazos dibujados a mano (flechas, subrayados, coronas) que vibran a 10 Hz */
class FX14DoodleBoil {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.color = o.color || '#c7f303';
    this.el = mk('div', 'L z7');
    this.el.style.width = '500px';
    this.el.style.height = '300px';
  }
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.05) { off(this.el); return; }
    const p = P(t, this.t0, 0.35, E.out3);
    // Semilla cuantizada a 10 fps para el efecto "boiling lines" de dibujo animado
    const boil = Math.floor(t * 10);
    const j1 = ((boil * 17) % 7) - 3;
    const j2 = ((boil * 29) % 7) - 3;
    const j3 = ((boil * 43) % 7) - 3;

    this.el.innerHTML = `<svg width="500" height="300" viewBox="0 0 500 300" fill="none">
      <!-- Corona Doodle -->
      <path d="M${120 + j1} ${110 + j2} L${145 - j2} ${55 + j1} L${185 + j3} ${95 - j1} L${220 - j1} ${45 + j2} L${255 + j2} ${95 + j3} L${295 - j3} ${55 - j2} L${315 + j1} ${110 + j2} Z"
        stroke="${this.color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Flecha curva dibujada a mano -->
      <path d="M${80 + j2} ${210 + j1} Q ${220 - j3} ${265 + j2}, ${380 + j1} ${185 - j2}"
        stroke="${this.color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="400" stroke-dashoffset="${((1 - p) * 400).toFixed(1)}"/>
      <path d="M${352 + j1} ${172 - j2} L${386 + j2} ${182 + j1} L${364 - j2} ${212 + j3}"
        stroke="${this.color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="${p.toFixed(2)}"/>
    </svg>`;
    put(this.el, { x: k.x ?? CX, y: k.y ?? CY, s: k.s ?? 1, o: op });
  }
}

/* 15. Vértigo (Dolly Zoom / Efecto Hitchcock):
   El fondo se aleja (o acerca) mientras el sujeto en primer plano hace la escala inversa */
function fx15Vertigo(t, t0, dur = 1.4) {
  const p = P(t, t0, dur, E.ioSine);
  return {
    scaleFondo: lerp(1.0, 1.36, p),
    scaleSujeto: lerp(1.18, 0.94, p),
  };
}

/* 16. Cover Story: Portada de Revista Editorial */
class FX16CoverStory {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.el = mk('div', 'L fx-cover-story z5');
    this.el.innerHTML = `
      <div>
        <div class="masthead">${o.revista || 'WAPPY MAG'}</div>
        <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center">
          <span class="badge-issue">${o.edicion || 'COVER STORY · EDICIÓN SST'}</span>
          <span style="font-family:var(--mono);color:#a3b19b;font-size:15px">COLOMBIA · 2026</span>
        </div>
      </div>
      <div class="cover-headline">${o.titular || 'EL PRIMER <span>COPILOTO 3D</span> QUE HABLA CON TU SG-SST'}</div>
    `;
  }
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.05) { off(this.el); return; }
    const p = P(t, this.t0, 0.55, E.spring);
    put(this.el, { x: k.x ?? CX, y: (k.y ?? CY) + (1 - p) * 45, s: lerp(0.82, 1, p), ry: lerp(-18, 0, p), o: clamp(p * 1.8) * op });
  }
}

/* 17. Glass Type: Tipografía Acrílica / Cristal Esmerilado con Barrido de Luz */
class FX17GlassType {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.el = mk('div', 'L fx-glass-type z7');
    this.el.innerHTML = `<div class="sheen"></div><span>${o.texto || 'esto te permite'}</span>`;
    this._sheen = this.el.querySelector('.sheen');
  }
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.05) { off(this.el); return; }
    const p = P(t, this.t0, 0.48, E.spring);
    const sweep = ((t - this.t0) * 110) % 260;
    this._sheen.style.left = `${sweep - 40}%`;
    put(this.el, {
      x: k.x ?? CX,
      y: (k.y ?? CY) + (1 - p) * 28,
      s: lerp(0.78, 1, p) * (k.s ?? 1),
      o: clamp(p * 1.8) * op,
    });
  }
}

window.LISTA_17_EFECTOS = LISTA_17_EFECTOS;
window.Showcase17Reels = Showcase17Reels;
window.fx01Giro3D = fx01Giro3D;
window.FX08HeadlineWall = FX08HeadlineWall;
window.FX03UIWorld = FX03UIWorld;
window.fx04FrameBreak = fx04FrameBreak;
window.fx05DigitalZoom = fx05DigitalZoom;
window.fx09CorteConZoom = fx09CorteConZoom;
window.fx11ZoomOut = fx11ZoomOut;
window.FX07Checklist = FX07Checklist;
window.FX13PaperCut = FX13PaperCut;
window.FX14DoodleBoil = FX14DoodleBoil;
window.fx15Vertigo = fx15Vertigo;
window.FX16CoverStory = FX16CoverStory;
window.FX17GlassType = FX17GlassType;
