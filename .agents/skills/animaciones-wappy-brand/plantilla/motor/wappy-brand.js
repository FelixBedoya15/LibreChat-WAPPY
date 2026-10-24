'use strict';
/* =====================================================================
   MOTOR VISUAL Y LIBRERÍA PROPIA DE COMPONENTES — WAPPY BRAND (wappy.club)
   Colores oficiales, Tipografía Plus Jakarta Sans / Outfit / Inter,
   Iconografía Flaticon-style Duotone SST & Micro-animaciones Lottie-style
   deterministas a 60 fps (sincronizadas con t).
   ===================================================================== */

(function inyectarEstilosWappyBrand() {
  const css = `
  /* =====================================================================
     TOKENS OFICIALES DE IDENTIDAD VISUAL WAPPY (wappy.club)
     ===================================================================== */
  :root {
    --w-lime: #c7f303;
    --w-lime-dark: #a8cf00;
    --w-lime-glow: rgba(199, 243, 3, 0.42);
    --w-ink: #0e1300;
    --w-ink-soft: #2e3428;
    --w-ink-muted: #5a6252;
    --w-teal: #0d9488;
    --w-teal-bright: #2dd4bf;
    --w-teal-dark: #042f2e;
    --w-sky: linear-gradient(180deg, #5bb8f5 0%, #86ccf6 34%, #bfe3fa 64%, #eaf6fe 100%);
    --w-cream: #f6f5ef;
    --w-paper: #ffffff;
    --w-stone: #eceae1;
    --w-amber: #f59e0b;
    --w-coral: #ff5a36;
    --w-purple: #8b5cf6;
    --w-blue: #3b82f6;
  }

  /* Fondo Cielo WAPPY con Nubes Flotantes (siempre detrás de #world) */
  #fondo {
    z-index: 0 !important;
    isolation: isolate;
  }
  #world {
    z-index: 2;
  }
  #worldF {
    z-index: 4;
  }
  body.wappy-sky #fondo {
    background: linear-gradient(180deg, #5bb8f5 0%, #86ccf6 36%, #bfe3fa 68%, #f6f5ef 100%) !important;
  }
  body.wappy-cream #fondo {
    background: radial-gradient(ellipse 90% 85% at 50% 35%, #ffffff 0%, #f6f5ef 65%, #eceae1 100%) !important;
  }
  body.wappy-dark #fondo {
    background: radial-gradient(ellipse 90% 85% at 50% 38%, #152208 0%, #0e1300 65%, #070a00 100%) !important;
  }
  body.wappy-sky #grid, body.wappy-cream #grid,
  body.wappy-sky #vignette, body.wappy-cream #vignette,
  body.wappy-sky .glow, body.wappy-cream .glow {
    display: none !important;
  }

  /* Nubes atmosféricas suaves */
  .w-cloud-layer {
    position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0;
  }
  .w-cloud {
    position: absolute; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255,255,255,0.88), rgba(255,255,255,0) 74%);
    filter: blur(8px);
  }

  /* 1. FLOATING NAVBAR OFICIAL WAPPY.CLUB */
  .w-navbar {
    width: 1680px; height: 82px; border-radius: 9999px;
    background: rgba(255, 255, 255, 0.95);
    border: 1.5px solid rgba(14, 19, 0, 0.09);
    box-shadow: 0 20px 50px -12px rgba(14, 19, 0, 0.16);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 14px 0 26px; font-family: var(--sans);
  }
  .w-navbar .brand {
    display: flex; align-items: center; gap: 14px;
  }
  .w-navbar .brand-logo {
    width: 54px; height: 54px; border-radius: 50%;
    border: 2.5px solid var(--w-teal); background: #fff;
    overflow: hidden; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
  }
  .w-navbar .brand-logo img { width: 100%; height: 100%; object-fit: cover; }
  .w-navbar .brand-txt .main {
    font-size: 24px; font-weight: 900; color: var(--w-ink); letter-spacing: -0.03em; line-height: 1;
  }
  .w-navbar .brand-txt .main span { color: var(--w-teal); margin-left: 3px; }
  .w-navbar .brand-txt .sub {
    font-size: 12px; font-weight: 800; letter-spacing: 0.16em; color: var(--w-ink-muted);
    text-transform: uppercase; margin-top: 3px;
  }
  .w-navbar .pills {
    display: flex; align-items: center; gap: 12px;
  }
  .w-navbar .pill {
    padding: 10px 22px; border-radius: 9999px; font-size: 19px; font-weight: 700;
    color: var(--w-ink-soft); display: flex; align-items: center; gap: 8px;
  }
  .w-navbar .pill.on {
    background: rgba(13, 148, 136, 0.14); color: var(--w-teal); font-weight: 800;
  }
  .w-navbar .cta-btn {
    height: 58px; padding: 0 18px 0 26px; border-radius: 9999px;
    background: var(--w-ink); color: #fff; font-size: 19px; font-weight: 800;
    display: flex; align-items: center; gap: 14px;
    box-shadow: 0 10px 24px -6px rgba(14, 19, 0, 0.35);
  }
  .w-navbar .cta-btn .pip {
    width: 34px; height: 34px; border-radius: 50%; background: var(--w-lime);
    color: var(--w-ink); display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 18px;
  }

  /* 2. EYEBROW CON PUNTO LIMA PULSANTE */
  .w-eyebrow {
    display: inline-flex; align-items: center; gap: 14px;
    background: rgba(14, 19, 0, 0.92); color: var(--w-lime);
    padding: 12px 26px; border-radius: 9999px;
    font-size: 18px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
    box-shadow: 0 12px 30px rgba(14, 19, 0, 0.18); white-space: nowrap;
  }
  .w-eyebrow .dot {
    width: 12px; height: 12px; border-radius: 50%; background: var(--w-lime);
    box-shadow: 0 0 0 6px rgba(199, 243, 3, 0.28);
  }

  /* 3. TITULAR CON MARCADOR LIMA FLUORESCENTE (#c7f303) */
  .w-hero-block {
    width: 980px; display: flex; flex-direction: column; align-items: flex-start; gap: 22px;
  }
  .w-h1 {
    font-family: var(--sans); font-weight: 900; font-size: 74px; line-height: 1.05;
    letter-spacing: -0.035em; color: var(--w-ink); margin: 0;
  }
  body.wappy-dark .w-h1 { color: #ffffff; }
  .w-h1 .hl-lime {
    position: relative; display: inline-block; padding: 2px 18px 6px; margin: 0 4px;
    color: var(--w-ink); z-index: 1;
  }
  .w-h1 .hl-lime i {
    position: absolute; inset: 0; background: var(--w-lime); border-radius: 18px;
    box-shadow: 0 8px 24px rgba(199, 243, 3, 0.42);
    transform-origin: 0% 50%; transform: scaleX(0); z-index: -1;
  }
  .w-sub {
    font-size: 26px; line-height: 1.45; font-weight: 500; color: var(--w-ink-soft);
    max-width: 920px;
  }
  body.wappy-dark .w-sub { color: #d5dae4; }
  .w-sub b { color: var(--w-ink); font-weight: 800; }
  body.wappy-dark .w-sub b { color: var(--w-lime); }

  /* 4. BOTONES PÍLDORA OFICIALES CON CÍRCULO PIP */
  .w-btn-row { display: flex; align-items: center; gap: 18px; margin-top: 8px; }
  .w-btn {
    height: 68px; padding: 0 20px 0 30px; border-radius: 9999px;
    font-size: 22px; font-weight: 800; letter-spacing: -0.01em;
    display: inline-flex; align-items: center; gap: 16px; white-space: nowrap;
  }
  .w-btn.dark {
    background: var(--w-ink); color: #ffffff;
    box-shadow: 0 14px 32px -8px rgba(14, 19, 0, 0.4);
  }
  .w-btn.lime {
    background: var(--w-lime); color: var(--w-ink);
    box-shadow: 0 14px 34px -8px rgba(168, 207, 0, 0.6);
  }
  .w-btn.glass {
    background: rgba(255, 255, 255, 0.9); color: var(--w-ink);
    border: 1.5px solid rgba(14, 19, 0, 0.12);
    box-shadow: 0 10px 24px -8px rgba(14, 19, 0, 0.12);
  }
  .w-btn .pip {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 900;
  }
  .w-btn.dark .pip { background: var(--w-lime); color: var(--w-ink); }
  .w-btn.lime .pip { background: var(--w-ink); color: var(--w-lime); }

  /* 5. TENSHI SHOWCASE CARD (TARJETA OSCURA #0e1300 CON BORDE LIMA Y AVATAR 3D FLOTANTE) */
  .w-tenshi-card {
    width: 620px; border-radius: 38px;
    background: rgba(14, 19, 0, 0.94);
    border: 3px solid rgba(199, 243, 3, 0.55);
    box-shadow: 0 34px 80px -16px rgba(14, 19, 0, 0.48), 0 0 0 1px rgba(199, 243, 3, 0.2);
    padding: 34px 32px; color: #fff; text-align: center;
    position: relative; overflow: hidden;
  }
  .w-tenshi-card .glow-bg {
    position: absolute; width: 360px; height: 360px; left: 50%; top: 24px;
    transform: translateX(-50%);
    background: radial-gradient(circle, rgba(199, 243, 3, 0.36) 0%, rgba(13, 148, 136, 0.22) 52%, transparent 72%);
    filter: blur(14px); pointer-events: none;
  }
  .w-tenshi-card .avatar-wrap {
    position: relative; z-index: 2; width: 220px; height: 220px; margin: 0 auto 18px;
    display: flex; align-items: center; justify-content: center;
  }
  .w-tenshi-card .avatar-wrap img {
    width: 100%; height: 100%; object-fit: contain;
    filter: drop-shadow(0 18px 28px rgba(199, 243, 3, 0.32));
  }
  .w-tenshi-card .bubble {
    position: relative; z-index: 2;
    background: rgba(255, 255, 255, 0.09);
    border: 1.5px solid rgba(199, 243, 3, 0.38);
    border-radius: 24px; padding: 20px 24px;
    font-size: 21px; line-height: 1.45; color: #ecfdf5; margin-bottom: 20px;
  }
  .w-tenshi-card .bubble b { color: var(--w-lime); font-weight: 800; }
  .w-tenshi-card .strip {
    position: relative; z-index: 2;
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(13, 148, 136, 0.26);
    border: 1.5px solid rgba(45, 212, 191, 0.45);
    border-radius: 20px; padding: 14px 20px;
  }
  .w-tenshi-card .strip-info { text-align: left; }
  .w-tenshi-card .strip-lbl {
    font-size: 13px; font-weight: 800; letter-spacing: 0.1em; color: var(--w-teal-bright);
    text-transform: uppercase;
  }
  .w-tenshi-card .strip-val {
    font-size: 19px; font-weight: 800; color: #ffffff; margin-top: 2px;
  }
  .w-tenshi-card .strip-btn {
    background: var(--w-lime); color: var(--w-ink);
    padding: 12px 22px; border-radius: 9999px; font-size: 18px; font-weight: 900;
  }

  /* 6. TARJETAS BENTO WAPPY CON ICONOS DUOTONE (ESTILO FLATICON + LOTTIE) */
  .w-bento-card {
    width: 520px; border-radius: 30px;
    background: rgba(255, 255, 255, 0.94);
    border: 1.5px solid rgba(14, 19, 0, 0.08);
    box-shadow: 0 22px 50px -16px rgba(14, 19, 0, 0.14);
    padding: 28px 30px; display: flex; align-items: flex-start; gap: 22px;
  }
  body.wappy-dark .w-bento-card {
    background: rgba(22, 29, 8, 0.92);
    border-color: rgba(199, 243, 3, 0.25);
  }
  .w-bento-card .icon-box {
    width: 84px; height: 84px; border-radius: 24px; flex: none;
    background: linear-gradient(145deg, rgba(199, 243, 3, 0.25), rgba(13, 148, 136, 0.15));
    border: 1.5px solid rgba(13, 148, 136, 0.3);
    display: flex; align-items: center; justify-content: center;
  }
  .w-bento-card .tag {
    display: inline-block; padding: 4px 12px; border-radius: 9999px;
    background: var(--w-lime); color: var(--w-ink);
    font-size: 13px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase;
    margin-bottom: 8px;
  }
  .w-bento-card .tit {
    font-size: 27px; font-weight: 900; color: var(--w-ink); line-height: 1.18; letter-spacing: -0.02em;
  }
  body.wappy-dark .w-bento-card .tit { color: #ffffff; }
  .w-bento-card .desc {
    font-size: 19px; font-weight: 500; color: var(--w-ink-muted); line-height: 1.4; margin-top: 6px;
  }
  body.wappy-dark .w-bento-card .desc { color: #a3b19b; }
  `;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
})();

/* =====================================================================
   LIBRERÍA PROPIA DE ICONOS DUOTONE Y ANIMACIONES TIPO LOTTIE (60 FPS)
   Inspirada en Flaticon Duotone + LottieFiles (Cloud Sync, AI Brain,
   SST Shield, Bio-Individuo, Legal Stamp, QR Vote, Rocket Launch).
   ===================================================================== */
const WAPPY_LOTTIE = {
  /* 1. Cloud Syncing (inspirado en lottiefiles.com/free-animations/cloude-syncing) */
  cloudSync(t, size = 64) {
    const rot = (t * 140) % 360;
    const pulse = 1 + 0.06 * Math.sin(t * 5);
    const upY = -3 * Math.sin(t * 4);
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
      <g transform="translate(0,${upY.toFixed(2)})">
        <path d="M18 46H47C53.075 46 58 41.075 58 35C58 29.36 53.75 24.71 48.27 24.07C46.46 16.03 39.28 10 30.67 10C20.73 10 12.67 18.06 12.67 28C12.67 28.58 12.7 29.15 12.75 29.71C8.84 31.19 6 34.97 6 39.42C6 45.26 10.74 46 18 46Z" fill="#0d9488" fill-opacity="0.22" stroke="#0d9488" stroke-width="3.2" stroke-linejoin="round"/>
        <circle cx="32" cy="31" r="11" fill="#c7f303" transform="scale(${pulse.toFixed(3)})" style="transform-origin:32px 31px"/>
        <g transform="rotate(${rot.toFixed(1)} 32 31)">
          <path d="M27 31A5 5 0 0 1 36 28M37 31A5 5 0 0 1 28 34" stroke="#0e1300" stroke-width="2.8" stroke-linecap="round"/>
          <polygon points="36,24 39,29 33,29" fill="#0e1300"/>
          <polygon points="28,38 25,33 31,33" fill="#0e1300"/>
        </g>
      </g>
    </svg>`;
  },

  /* 2. Escudo SST + Check Normativo Animado */
  sstShield(t, size = 64) {
    const glow = 0.22 + 0.12 * Math.sin(t * 4);
    const s = 1 + 0.04 * Math.sin(t * 3.5);
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
      <g transform="scale(${s.toFixed(3)})" style="transform-origin:32px 32px">
        <path d="M32 6L10 15V30C10 44.5 19.4 56.8 32 60C44.6 56.8 54 44.5 54 30V15L32 6Z" fill="#0d9488" fill-opacity="${glow.toFixed(2)}" stroke="#0d9488" stroke-width="3.2" stroke-linejoin="round"/>
        <circle cx="32" cy="32" r="12" fill="#c7f303"/>
        <path d="M26.5 32.5L30.2 36.2L38 28.4" stroke="#0e1300" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>`;
  },

  /* 3. Bio-Individuo / Ergonomía 360 */
  bioIndividuo(t, size = 64) {
    const ring = 14 + 3 * Math.sin(t * 4.2);
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="24" stroke="#0d9488" stroke-width="2.4" stroke-dasharray="5 5"/>
      <circle cx="32" cy="32" r="${ring.toFixed(1)}" fill="#c7f303" fill-opacity="0.35"/>
      <circle cx="32" cy="18" r="6" fill="#c7f303" stroke="#0e1300" stroke-width="2.6"/>
      <path d="M18 28H46M32 24V42M32 42L23 54M32 42L41 54" stroke="#0e1300" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  },

  /* 4. IA / Antigravity / Cerebro Conectado */
  aiSparkles(t, size = 64) {
    const rot = 12 * Math.sin(t * 3);
    const s2 = 0.8 + 0.25 * Math.sin(t * 6);
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="8" width="48" height="48" rx="16" fill="#0e1300"/>
      <g transform="rotate(${rot.toFixed(1)} 32 32)">
        <path d="M32 14L36.2 27.8L50 32L36.2 36.2L32 50L27.8 36.2L14 32L27.8 27.8L32 14Z" fill="#c7f303"/>
      </g>
      <circle cx="46" cy="18" r="${(4 * s2).toFixed(2)}" fill="#2dd4bf"/>
      <circle cx="18" cy="46" r="${(3.5 * s2).toFixed(2)}" fill="#2dd4bf"/>
    </svg>`;
  },

  /* 5. Carpeta / Proyecto Local Antigravity + WAPPY */
  folderSync(t, size = 64) {
    const y = 2 * Math.sin(t * 4.5);
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
      <path d="M8 18C8 14.686 10.686 12 14 12H25L31 18H50C53.314 18 56 20.686 56 24V46C56 49.314 53.314 52 50 52H14C10.686 52 8 49.314 8 46V18Z" fill="#0d9488" fill-opacity="0.2" stroke="#0e1300" stroke-width="3.2"/>
      <g transform="translate(0,${y.toFixed(2)})">
        <rect x="20" y="26" width="24" height="18" rx="6" fill="#c7f303" stroke="#0e1300" stroke-width="2.6"/>
        <path d="M27 35H37M32 30V40" stroke="#0e1300" stroke-width="2.8" stroke-linecap="round"/>
      </g>
    </svg>`;
  },
};

/* =====================================================================
   COMPONENTES DE ESCENA OFICIALES WAPPY BRAND
   ===================================================================== */

/* 0. Capa de Nubes Flotantes WAPPY */
class FondoNubesWappy {
  constructor() {
    this.el = mk('div', 'w-cloud-layer', $('fondo'));
    this.c1 = mk('div', 'w-cloud', this.el);
    this.c2 = mk('div', 'w-cloud', this.el);
    this.c3 = mk('div', 'w-cloud', this.el);
    this.c1.style.cssText = 'width:760px;height:310px;top:6%;left:-80px;';
    this.c2.style.cssText = 'width:840px;height:340px;top:14%;right:-120px;';
    this.c3.style.cssText = 'width:680px;height:260px;bottom:8%;left:20%;opacity:0.78;';
  }
  pintar(t) {
    this.c1.style.transform = `translate(${(Math.sin(t * 0.4) * 38).toFixed(1)}px, ${(Math.cos(t * 0.3) * 12).toFixed(1)}px)`;
    this.c2.style.transform = `translate(${(-Math.cos(t * 0.35) * 44).toFixed(1)}px, ${(Math.sin(t * 0.28) * 14).toFixed(1)}px)`;
    this.c3.style.transform = `translate(${(Math.sin(t * 0.5 + 1) * 30).toFixed(1)}px, ${(-Math.sin(t * 0.32) * 10).toFixed(1)}px)`;
  }
}

/* 1. Barra Flotante Superior (Navbar wappy.club) */
class WappyNavbar {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.el = mk('div', 'L w-navbar z6');
    const pillsHtml = (o.items || [
      { txt: '🎬 Presentación', on: true },
      { txt: '🎥 Grabación' },
      { txt: '💬 Prompts Chat' },
      { txt: '📘 Guía' },
      { txt: '📄 PDF' },
    ]).map(it => `<div class="pill ${it.on ? 'on' : ''}">${it.txt}</div>`).join('');

    this.el.innerHTML = `
      <div class="brand">
        <div class="brand-logo"><img src="${o.logo || 'assets/wappy/wappy-cat-logo.png'}" alt="WAPPY"></div>
        <div class="brand-txt">
          <div class="main">${o.marca || 'WAPPY'}<span>${o.sufijo || 'IA'}</span></div>
          <div class="sub">${o.sub || 'SOMOS SST'}</div>
        </div>
      </div>
      <div class="pills">${pillsHtml}</div>
      <div class="cta-btn"><span>${o.cta || 'wappy.club'}</span><span class="pip">↗</span></div>
    `;
  }
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.05) { off(this.el); return; }
    const p = P(t, this.t0, 0.5, E.out4);
    put(this.el, {
      x: k.x ?? CX,
      y: (k.y ?? 76) - (1 - p) * 28,
      s: k.s ?? 1,
      o: p * op,
    });
  }
}

/* 2. Bloque Hero Izquierdo (Eyebrow + H1 con Marcador Lima + Subtítulo + Botones Píldora) */
class WappyHeroText {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0.2;
    this.tHighlight = o.tHighlight ?? (this.t0 + 0.45);
    this.tSub = o.tSub ?? (this.t0 + 0.7);
    this.tBtns = o.tBtns ?? (this.t0 + 1.0);
    this.el = mk('div', 'L w-hero-block z4');

    const btnsHtml = (o.botones || [
      { txt: '▶ Ver Demostración', tipo: 'dark', pip: '▶' },
      { txt: 'Probar WAPPY Gratis', tipo: 'lime', pip: '↗' },
    ]).map(b => `<div class="w-btn ${b.tipo || 'dark'}"><span>${b.txt}</span>${b.pip ? `<span class="pip">${b.pip}</span>` : ''}</div>`).join('');

    this.el.innerHTML = `
      <div class="w-eyebrow"><span class="dot"></span><span>${o.eyebrow || 'WAPPY IA · SISTEMA INTELIGENTE SST'}</span></div>
      <h1 class="w-h1">${o.tituloHtml || 'Domina <span class="hl-lime"><i></i>WAPPY + Antigravity</span> desde Cero y sin Programar.'}</h1>
      <div class="w-sub">${o.subtitulo || ''}</div>
      <div class="w-btn-row">${btnsHtml}</div>
    `;
    this._eye = this.el.querySelector('.w-eyebrow');
    this._dot = this.el.querySelector('.w-eyebrow .dot');
    this._h1 = this.el.querySelector('.w-h1');
    this._hls = [...this.el.querySelectorAll('.hl-lime i')];
    this._sub = this.el.querySelector('.w-sub');
    this._btns = [...this.el.querySelectorAll('.w-btn')];
  }
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.05) { off(this.el); return; }
    put(this.el, { x: k.x ?? 580, y: k.y ?? 560, s: k.s ?? 1, o: op });

    const pEye = P(t, this.t0, 0.4, E.out3);
    this._eye.style.opacity = pEye.toFixed(3);
    this._eye.style.transform = `translateY(${((1 - pEye) * 16).toFixed(1)}px)`;
    const pulse = 0.85 + 0.25 * Math.sin(t * 5);
    this._dot.style.transform = `scale(${pulse.toFixed(3)})`;

    const pH1 = P(t, this.t0 + 0.12, 0.48, E.out4);
    this._h1.style.opacity = pH1.toFixed(3);
    this._h1.style.transform = `translateY(${((1 - pH1) * 22).toFixed(1)}px)`;

    this._hls.forEach((hl, i) => {
      const ph = P(t, this.tHighlight + i * 0.25, 0.52, E.out4);
      hl.style.transform = `scaleX(${ph.toFixed(4)})`;
    });

    const pSub = P(t, this.tSub, 0.45, E.out3);
    this._sub.style.opacity = pSub.toFixed(3);
    this._sub.style.transform = `translateY(${((1 - pSub) * 16).toFixed(1)}px)`;

    this._btns.forEach((b, i) => {
      const pb = P(t, this.tBtns + i * 0.14, 0.45, E.back);
      b.style.opacity = clamp(pb * 1.8).toFixed(3);
      b.style.transform = `scale(${lerp(0.82, 1, pb).toFixed(3)}) translateY(${((1 - pb) * 14).toFixed(1)}px)`;
    });
  }
}

/* 3. Tarjeta Derecha de Tenshi 3D Flotante (Hero Showcase Card) */
class WappyTenshiCard {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0.35;
    this.tBubble = o.tBubble ?? (this.t0 + 0.3);
    this.tStrip = o.tStrip ?? (this.t0 + 0.55);
    this.el = mk('div', 'L w-tenshi-card z5');
    this.el.innerHTML = `
      <div class="glow-bg"></div>
      <div class="avatar-wrap"><img src="${o.avatar || 'assets/wappy/tenshi.png'}" alt="Tenshi"></div>
      <div class="bubble">${o.mensaje || '«¡Hola! Soy <b>Tenshi</b>. Con <b>WAPPY IA</b> controlas tus 8 Hitos del SG-SST por voz y sin programar.»'}</div>
      <div class="strip">
        <div class="strip-info">
          <div class="strip-lbl">${o.stripLabel || 'PLATAFORMA OFICIAL'}</div>
          <div class="strip-val">${o.stripVal || 'wappy.club'}</div>
        </div>
        <div class="strip-btn">${o.stripBtn || 'Entrar Ahora ↗'}</div>
      </div>
    `;
    this._av = this.el.querySelector('.avatar-wrap');
    this._bub = this.el.querySelector('.bubble');
    this._str = this.el.querySelector('.strip');
  }
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.05) { off(this.el); return; }
    const p = P(t, this.t0, 0.55, E.out4);
    put(this.el, {
      x: k.x ?? 1470,
      y: (k.y ?? 575) + (1 - p) * 32,
      s: (k.s ?? 1) * lerp(0.92, 1, p),
      o: p * op,
    });
    // Flotación suave continua de Tenshi
    const fy = Math.sin(t * 2.2) * 9;
    const fr = Math.sin(t * 1.6) * 2.2;
    this._av.style.transform = `translateY(${fy.toFixed(2)}px) rotate(${fr.toFixed(2)}deg)`;

    const pb = P(t, this.tBubble, 0.42, E.out3);
    this._bub.style.opacity = pb.toFixed(3);
    this._bub.style.transform = `translateY(${((1 - pb) * 14).toFixed(1)}px)`;

    const ps = P(t, this.tStrip, 0.42, E.out3);
    this._str.style.opacity = ps.toFixed(3);
    this._str.style.transform = `translateY(${((1 - ps) * 12).toFixed(1)}px)`;
  }
}

/* 4. Grilla Bento de Tarjetas con Micro-Animaciones Lottie/Flaticon */
class WappyBentoGrid {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.items = o.items || [];
    this.el = mk('div', 'L z4');
    this.el.style.width = '1920px';
    this.el.style.height = '1080px';

    this.cards = this.items.map(it => {
      const c = mk('div', 'L w-bento-card', this.el);
      c.innerHTML = `
        <div class="icon-box"></div>
        <div class="txt">
          ${it.tag ? `<div class="tag">${it.tag}</div>` : ''}
          <div class="tit">${it.titulo}</div>
          <div class="desc">${it.desc || ''}</div>
        </div>
      `;
      c._box = c.querySelector('.icon-box');
      c._lottie = it.lottie || 'cloudSync';
      c._t0 = it.t0 ?? this.t0;
      c._x = it.x ?? CX;
      c._y = it.y ?? CY;
      return c;
    });
  }
  pintar(t, k = {}) {
    const op = k.o ?? 1;
    if (op <= 0.002 || t < this.t0 - 0.1) { off(this.el); return; }
    put(this.el, { x: k.x ?? CX, y: k.y ?? CY, s: k.s ?? 1, o: op });

    this.cards.forEach((c, i) => {
      const p = P(t, c._t0, 0.52, E.spring);
      if (p <= 0.002) { off(c); return; }
      const fn = WAPPY_LOTTIE[c._lottie] || WAPPY_LOTTIE.cloudSync;
      c._box.innerHTML = fn(t, 56);
      const micro = microFloat(t, i * 1.35, { ax: 3, ay: 5, ar: 0.45, wx: 1.4, wy: 2.1, wr: 1.2 });
      put(c, {
        x: c._x + micro.dx,
        y: c._y + (1 - p) * 32 + micro.dy,
        r: micro.dr,
        s: lerp(0.82, 1, p),
        o: clamp(p * 1.8),
      });
    });
  }
}

/* =====================================================================
   CINÉTICA AVANZADA WAPPY (5 REGLAS DE ORO DE ANIMACIÓN)
   1. Curvas con rebote orgánico (E.spring, E.back, E.bounce)
   2. Entrada escalonada (staggerP)
   3. Parallax multicapa a 3 velocidades (fondo 0.25x, medio 1.0x, frente 1.45x)
   4. Micro-movimientos constantes (microFloat: nunca un elemento congelado)
   5. Efecto Sable Láser / Rayo de Energía en Manos (SableLaserMano)
   ===================================================================== */

/* 1. Curva de rebote extra y entrada escalonada (Stagger) */
if (typeof E !== 'undefined' && !E.bounce) {
  E.bounce = p => {
    const n1 = 7.5625, d1 = 2.75;
    if (p < 1 / d1) return n1 * p * p;
    if (p < 2 / d1) return n1 * (p -= 1.5 / d1) * p + 0.75;
    if (p < 2.5 / d1) return n1 * (p -= 2.25 / d1) * p + 0.9375;
    return n1 * (p -= 2.625 / d1) * p + 0.984375;
  };
}
function staggerP(t, t0, index, gap = 0.11, dur = 0.48, curve = E.spring) {
  return P(t, t0 + index * gap, dur, curve);
}

/* 2. Micro-movimiento perpetuo determinista (Respiración + Flotación + Oscilación) */
function microFloat(t, seed = 0, o = {}) {
  const ax = o.ax ?? 4, ay = o.ay ?? 7, ar = o.ar ?? 0.8, as = o.as ?? 0.012;
  const wx = o.wx ?? 1.5, wy = o.wy ?? 2.2, wr = o.wr ?? 1.3, ws = o.ws ?? 2.6;
  return {
    dx: Math.sin(t * wx + seed * 1.7) * ax,
    dy: Math.cos(t * wy + seed * 2.3) * ay,
    dr: Math.sin(t * wr + seed * 3.1) * ar,
    ds: 1 + Math.sin(t * ws + seed * 1.1) * as,
  };
}

/* 3. Parallax Multicapa (Fondo 0.25x · Medio 1.0x · Frente 1.45x) */
function parallaxPos(t, x, y, plano = 'medio') {
  const cam = typeof camara === 'function' ? camara(t) : { x: CX, y: CY, s: 1 };
  const factor = plano === 'fondo' ? 0.25 : plano === 'frente' ? 1.45 : 1.0;
  const ox = (cam.x - CX) * (1 - factor);
  const oy = (cam.y - CY) * (1 - factor);
  return { x: x + ox, y: y + oy };
}

/* 4. Efecto Sable Láser / Haz de Energía en Manos (SableLaserMano)
   Dibuja un sable de luz neón (verde lima #c7f303 o turquesa #2dd4bf) con núcleo
   blanco incandescente, halo volumétrico, chispas y destello en la empuñadura/mano. */
class SableLaserMano {
  constructor(o = {}) {
    this.t0 = o.t0 ?? 0;
    this.t1 = o.t1 ?? 999;
    this.color = o.color || '#c7f303';
    this.halo = o.halo || 'rgba(199, 243, 3, 0.65)';
    this.largo = o.largo ?? 340;
    this.grosor = o.grosor ?? 16;
    this.trayectoria = o.trayectoria || [[this.t0, { x: o.x ?? 960, y: o.y ?? 640, r: o.r ?? -35 }]];
    this.el = mk('div', 'L z8', typeof WORLDF !== 'undefined' ? WORLDF : WORLD);
    this.el.style.width = '800px';
    this.el.style.height = '800px';
    this.el.style.pointerEvents = 'none';
  }
  pintar(t) {
    if (t < this.t0 - 0.05 || t > this.t1 + 0.3) { off(this.el); return; }
    const pIn = P(t, this.t0, 0.22, E.outExpo);
    const pOut = t > this.t1 ? 1 - P(t, this.t1, 0.22, E.in3) : 1;
    const ext = clamp(pIn * pOut);
    if (ext <= 0.005) { off(this.el); return; }

    const pos = KF(t, norm(this.trayectoria));
    const flicker = 0.92 + 0.08 * Math.sin(t * 48) + 0.04 * Math.cos(t * 83);
    const L = this.largo * ext;
    const W = this.grosor * flicker;
    const id = 'sable_' + Math.abs(Math.round(this.t0 * 100));

    // Chispas de energía alrededor de la mano
    let sparks = '';
    for (let i = 0; i < 6; i++) {
      const ang = (t * 6 + i * 1.05) % (Math.PI * 2);
      const rad = 18 + ((t * 90 + i * 19) % 42) * ext;
      const sx = 400 + Math.cos(ang) * rad;
      const sy = 400 + Math.sin(ang) * rad;
      sparks += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(2.8 * flicker).toFixed(1)}" fill="#ffffff" stroke="${this.color}" stroke-width="2"/>`;
    }

    this.el.innerHTML = `<svg width="800" height="800" viewBox="0 0 800 800" fill="none" style="overflow:visible">
      <defs>
        <filter id="${id}_glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="${(14 * flicker).toFixed(1)}" result="blur1"/>
          <feGaussianBlur stdDeviation="${(28 * flicker).toFixed(1)}" result="blur2"/>
          <feMerge>
            <feMergeNode in="blur2"/>
            <feMergeNode in="blur1"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#${id}_glow)">
        <!-- Halo exterior del sable -->
        <line x1="400" y1="400" x2="${(400 + L).toFixed(1)}" y2="400" stroke="${this.color}" stroke-width="${(W * 2.3).toFixed(1)}" stroke-linecap="round" stroke-opacity="0.45"/>
        <!-- Hoja de plasma principal -->
        <line x1="400" y1="400" x2="${(400 + L).toFixed(1)}" y2="400" stroke="${this.color}" stroke-width="${W.toFixed(1)}" stroke-linecap="round"/>
        <!-- Núcleo blanco incandescente -->
        <line x1="400" y1="400" x2="${(400 + L).toFixed(1)}" y2="400" stroke="#ffffff" stroke-width="${(W * 0.48).toFixed(1)}" stroke-linecap="round"/>
        <!-- Destello de ignición en la mano / empuñadura -->
        <circle cx="400" cy="400" r="${(20 * ext * flicker).toFixed(1)}" fill="#ffffff" stroke="${this.color}" stroke-width="5"/>
        ${sparks}
      </g>
    </svg>`;

    put(this.el, {
      x: pos.x,
      y: pos.y,
      r: pos.r ?? -35,
      s: pos.s ?? 1,
      o: ext,
    });
  }
}

window.WAPPY_LOTTIE = WAPPY_LOTTIE;
window.FondoNubesWappy = FondoNubesWappy;
window.WappyNavbar = WappyNavbar;
window.WappyHeroText = WappyHeroText;
window.WappyTenshiCard = WappyTenshiCard;
window.WappyBentoGrid = WappyBentoGrid;
window.staggerP = staggerP;
window.microFloat = microFloat;
window.parallaxPos = parallaxPos;
window.SableLaserMano = SableLaserMano;
