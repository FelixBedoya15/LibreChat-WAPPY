'use strict';
/* =====================================================================
   motor/piezas.js — piezas del catálogo de estilo «profundidad» y de las capas sobre el vídeo.
   Cada pieza se crea UNA vez (arriba, con sus tiempos) y se pinta en cada fotograma con .pintar(t, ...).
   Las que tienen tiempos propios declaran solas su sonido al entrar y al salir (sfx); con sonido: false no suenan.
   Todas usan el color de acento (--acento / ACENTO_RGB) salvo que se les pase otro rgb.
   Índice (detalles en references/motor.md § 10 y catálogo en references/diseno.md):
     panel · iconoApp · Orbita · TituloGigante · Subtitulos · Leyenda · RotuloNombre · Buscador ·
     tarjetaFuente / pintarFuente · TarjetaProgreso · Notificacion · carpeta / pintarCarpeta · Revelado ·
     EsferaPuntos · Polvo · Cuadricula100 · Rotulo · Cursor ·
     (intro «editado por IA», 29/09/2026) LineaTiempo · VisorREC · Escaneo · PanelTareas · PanelConcepto · Explorador ·
     Arrastre · RevelarHaces · RutaPasos · TarjetaRegalo ·
     (reel vertical «editado por IA», 30/09/2026) LineaBruto · Comentario
   ===================================================================== */
css(`
.panel{border-radius:calc(var(--panel-k,1) * 28px);background:var(--panel-bg,linear-gradient(180deg,rgba(30,33,42,.80),rgba(13,15,20,.86)));border:var(--panel-borde,1.5px solid rgba(255,255,255,.10));
  box-shadow:var(--panel-sombra,0 50px 110px -34px rgba(0,0,0,.9));backdrop-filter:var(--panel-filtro,blur(16px));-webkit-backdrop-filter:var(--panel-filtro,blur(16px))}
.appi{border-radius:26%;display:flex;align-items:center;justify-content:center;box-shadow:0 26px 50px -18px rgba(0,0,0,.75),inset 0 -6px 14px rgba(0,0,0,.10),inset 0 2px 0 rgba(255,255,255,.55);overflow:hidden}
.appi::after{content:'';position:absolute;inset:0;border-radius:26%;background:linear-gradient(160deg,rgba(255,255,255,.28),rgba(255,255,255,0) 45%);pointer-events:none}
.tgig{font:var(--display-peso,800) 170px/1 var(--display,var(--sans));letter-spacing:-.02em;white-space:nowrap;text-transform:uppercase;color:#fff;text-shadow:0 14px 50px rgba(0,0,0,.45)}
.tgig .ch{display:inline-block}
.tgig.acento{color:var(--acento)}
.subt{font:700 52px/1.15 var(--sans);color:#fff;white-space:nowrap;text-shadow:0 3px 0 rgba(0,0,0,.55),0 8px 30px rgba(0,0,0,.65);letter-spacing:-.005em}
.subt span{display:inline-block;margin:0 .13em}
.subt span.on{color:var(--acento)}
.leyenda{font:var(--display-peso,800) 58px var(--display,var(--sans));color:#fff;white-space:nowrap;text-shadow:0 3px 0 rgba(0,0,0,.5),0 10px 34px rgba(0,0,0,.7)}
.leyenda b{color:var(--acento);font-weight:800}
.rnom{display:flex;align-items:stretch;gap:0;filter:drop-shadow(0 18px 40px rgba(0,0,0,.6))}
.rnom .bar{width:10px;border-radius:5px;background:var(--acento);margin-right:22px}
.rnom .nm{font:var(--display-peso,800) 56px/1.05 var(--display,var(--sans));color:#fff;white-space:nowrap}
.rnom .cg{font:500 28px var(--mono);color:#cfd5e2;letter-spacing:.06em;margin-top:8px;white-space:nowrap}
.busc{height:104px;border-radius:999px;display:flex;align-items:center;gap:26px;padding:0 40px 0 30px}
.busc .tx{font:600 42px var(--sans);color:#f2f4f8;white-space:nowrap;display:flex;align-items:center}
.busc canvas{width:56px;height:56px;flex:none}
.fte{width:440px;border-radius:calc(var(--panel-k,1) * 26px);overflow:hidden;background:#15171d;border:1.5px solid rgba(255,255,255,.12);box-shadow:0 44px 90px -30px rgba(0,0,0,.9)}
.fte .top{height:196px;display:flex;align-items:center;justify-content:center;gap:26px;background:#f3f3f1;color:#15171d;position:relative}
.fte .bot{padding:18px 24px 24px}
.fte .dom{font:500 22px var(--mono);color:#9aa3b5;display:flex;align-items:center;gap:10px;white-space:nowrap}
.fte .tit{font:800 30px/1.18 var(--sans);color:#f4f6fa;margin-top:8px}
.fte .scan{position:absolute;left:-10px;right:-10px;height:4px;border-radius:2px;background:var(--acento);box-shadow:0 0 18px rgba(var(--acento-rgb),.9);opacity:0}
.prog{width:640px;padding:28px 30px 30px}
.prog .cab{display:flex;align-items:center;gap:14px;font:700 30px var(--sans);color:#f2f4f8;margin-bottom:20px;white-space:nowrap}
.prog .img{height:318px;border-radius:18px;overflow:hidden;background:#222;display:flex;align-items:center;justify-content:center}
.prog .img img{width:100%;height:100%;object-fit:cover;display:block}
.prog .tit{font:800 32px/1.2 var(--sans);color:#fff;margin-top:20px}
.prog .can{font:500 24px var(--sans);color:#aab2c2;margin-top:10px;display:flex;align-items:center;gap:10px}
.prog .pista{height:10px;border-radius:5px;background:rgba(255,255,255,.12);margin-top:22px;overflow:hidden}
.prog .barra{height:100%;width:0;border-radius:5px;background:#3e8bff}
.prog .est{display:flex;justify-content:space-between;margin-top:14px;font:700 24px var(--sans);color:#dfe4ee}
.prog .est .via{color:#8d97ab;font-weight:600}
.noti{width:760px;padding:24px 28px 26px}
.noti .cab{display:flex;align-items:center;gap:14px;font:700 26px var(--sans);color:#f2f4f8}
.noti .cab .h{margin-left:auto;font:500 22px var(--sans);color:#8d97ab}
.noti .tit{font:700 30px var(--sans);color:#fff;margin-top:14px}
.noti .txt{font:500 26px/1.3 var(--sans);color:#c7cedb;margin-top:6px}
.noti .ext{margin-top:16px;display:flex;gap:12px;align-items:center}
.noti .btn{margin-left:auto;background:var(--acento);color:var(--sobre-acento);font:800 26px var(--sans);padding:10px 24px;border-radius:999px;white-space:nowrap}
.carp{width:560px;height:380px}
.carp.atras{border-radius:28px 28px 22px 22px;background:linear-gradient(180deg,#2a2d35,#1b1d23)}
.carp.atras::before{content:'';position:absolute;left:0;top:-34px;width:210px;height:60px;border-radius:22px 22px 0 0;background:#2a2d35}
.carp.delante{height:300px;border-radius:24px;background:linear-gradient(180deg,rgba(60,64,74,.96),rgba(34,37,44,.98));border:1.5px solid rgba(255,255,255,.12);
  box-shadow:0 -10px 40px -10px rgba(0,0,0,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;transform-origin:50% 100%}
.carp .et{font:800 36px var(--sans);color:#fff;white-space:nowrap}
.revn{font:var(--display-peso,800) 150px var(--display,var(--sans));color:#fff;white-space:nowrap;letter-spacing:-.02em;text-shadow:0 10px 50px rgba(0,0,0,.6)}
.revn .ch{display:inline-block}
.anillo{border-radius:50%;border:5px solid rgba(var(--rgb),.9);box-shadow:0 0 24px rgba(var(--rgb),.5)}
.rayos{width:2400px;height:2400px;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(var(--rgb),.16) 0deg 3deg,rgba(var(--rgb),0) 3deg 12deg);
  -webkit-mask-image:radial-gradient(circle,#000 8%,rgba(0,0,0,.5) 30%,transparent 62%);mask-image:radial-gradient(circle,#000 8%,rgba(0,0,0,.5) 30%,transparent 62%)}
.c100{display:grid;grid-template-columns:repeat(10,38px);gap:9px}
.c100 i{width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.08)}
.c100 i.on{background:rgba(var(--rgb),1);border-color:transparent;box-shadow:0 0 16px rgba(var(--rgb),.55)}
.c100n{font:var(--display-peso,800) 150px var(--display,var(--sans));color:#fff;white-space:nowrap}
.c100n small{font-size:.45em;color:rgba(var(--rgb),1);margin-left:.08em}
.rot{display:flex;flex-direction:column;align-items:center;gap:14px;perspective:1400px}
.rot .ln{font:var(--display-peso,800) 104px/1 var(--display,var(--sans));color:#fff;padding:18px 34px 22px;border-radius:calc(var(--panel-k,1) * 22px);background:rgba(16,18,24,.88);border:var(--panel-borde,1.5px solid rgba(255,255,255,.12));
  box-shadow:0 34px 80px -26px rgba(0,0,0,.9);white-space:nowrap;transform-origin:50% 100%}
.rot .ln.ac{background:var(--acento);color:var(--sobre-acento);border-color:transparent}
.cursor{width:46px;height:46px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.55))}
.onda{border-radius:50%;border:3px solid rgba(255,255,255,.9)}
`);

const sonar = (o, t, id, vol, pan) => { if (o.sonido !== false && t != null && isFinite(t)) sfx(t, id, { vol: vol ?? 1, pan: pan ?? 0 }); };
const logoOIcono = (o, tam) => o.logo ? logo(o.logo, tam) : o.img ? `<img src="${o.img}" style="width:${tam}px;height:${tam}px;object-fit:contain;display:block">` : icon(o.icono || 'sparkles', tam, 1.9);
let _semilla = 20260929;
const azar = () => { _semilla = (_semilla * 1664525 + 1013904223) >>> 0; return _semilla / 4294967296; };

/* ---------- panel de cristal (la base de tarjetas, rótulos y ventanas): inclínalo con put(el, {rx: 6, ry: -9}) ---------- */
function panel({ w = 600, h = null, clase = '', html = '', padre = null, z = 'z4' } = {}) {
  const e = mk('div', `L panel ${clase} ${z}`, padre, html);
  e.style.width = w + 'px'; if (h) e.style.height = h + 'px';
  return e;
}

/* ---------- icono de app (ficha redondeada con el logo): iconoApp({ logo: 'youtube', fondo: '#fff', tam: 150 }) ---------- */
function iconoApp({ logo: lg, icono, fondo = '#ffffff', tam = 150, color = '#111', padre = null, z = 'z4' } = {}) {
  const e = mk('div', `L appi ${z}`, padre, logoOIcono({ logo: lg, icono }, Math.round(tam * .56)));
  e.style.width = e.style.height = tam + 'px'; e.style.background = fondo; e.style.color = color;
  return e;
}

/* ---------- iconos alrededor de la cara (unos delante, otros detrás de la persona) ----------
   new Orbita([{ logo: 'n8n', fondo: '#ea4b71', t0 }, ...], { cx: 960, cy: 470, rx: 700, ry: 150, vel: .35, t1, tam: 140 })
   Cada icono entra desde el centro con rebote en su t0 (tick suave) y gira en una elipse inclinada: cuando pasa por
   delante (mitad de abajo de la elipse) se dibuja en WORLDF, delante de la persona; por detrás, en WORLD.
   Con { x, y, delante } fijos en un item, ese icono flota quieto en su sitio en vez de girar. Sale en t1. */
class Orbita {
  constructor(items, o = {}) {
    this.o = { cx: CX, cy: CY - 70, rx: 700, ry: 150, vel: .32, fase: 0, tam: 140, t1: null, ...o };
    this.it = items.map((it, i) => ({ ...it, el: iconoApp({ ...it, tam: it.tam || this.o.tam }), delante: null, i }));
    this.it.forEach(it => sonar(o, it.t0 - .02, 'tick-suave', .8));
    if (this.o.t1 != null) sonar(o, this.o.t1, 'aire-salida', .7);
  }
  pintar(t, { o = 1 } = {}) {
    const { cx, cy, rx, ry, vel, fase, t1 } = this.o, n = this.it.length;
    const sal = t1 != null ? P(t, t1, .45, E.in3) : 0;
    for (const it of this.it) {
      const p = clamp((t - it.t0) / .55), e = E.back(p);
      if (p <= 0 || sal >= 1 || o <= .002) { off(it.el); continue; }
      let x, y, d;
      if (it.x != null) { x = it.x + 10 * Math.sin(t * 1.1 + it.i * 1.7); y = it.y + 12 * Math.sin(t * .9 + it.i * 2.3); d = it.delante ? 1 : .35; }
      else { const a = fase + it.i * 2 * Math.PI / n + vel * t; x = cx + rx * Math.cos(a); y = cy + ry * Math.sin(a) + 14 * Math.sin(t * 1.3 + it.i); d = (Math.sin(a) + 1) / 2; }
      const del = it.x != null ? !!it.delante : d > .42;
      if (del !== it.delante) { (del ? WORLDF : WORLD).appendChild(it.el); it.delante = del; }
      x = lerp(cx, x, e) + sal * (x - cx) * .6; y = lerp(cy, y, e) + sal * (y - cy) * .6;
      put(it.el, { x, y, s: lerp(.3, lerp(.74, 1.06, d), e) * (1 + .25 * sal), o: clamp(p * 3) * (1 - sal) * o, br: lerp(.62, 1, d), b: lerp(1.4, 0, d) + sal * 6, r: 6 * Math.sin(t * .8 + it.i) });
    }
  }
}

/* ---------- titular gigante, por defecto DETRÁS de la persona (la cabeza tapa letras) ----------
   new TituloGigante([{ texto: 'INTELIGENCIA' }, { texto: 'ARTIFICIAL', acento: true }], { tiempos: [T.inteligencia, T.artificial], y0: 250, sal: T.x })
   tiempos: inicio de cada palabra, en orden (las de todas las líneas). Cada palabra entra con golpe grave. */
class TituloGigante {
  constructor(lineas, o = {}) {
    this.o = { x: CX, y0: 250, paso: 165, tam: 170, padre: WORLD, sal: null, ...o };
    this.lin = lineas.map(l => { const e = letters(l.texto, `L tgig ${l.acento ? 'acento' : ''} z2`); if (this.o.padre !== WORLD) this.o.padre.appendChild(e); e.style.fontSize = (l.tam || this.o.tam) + 'px'; return e; });
    const pal = lineas.flatMap(l => l.texto.split(' '));
    this.tiempos = this.o.tiempos || pal.map(() => 0);
    let w = 0;
    this.lt = lineas.map(l => { const n = l.texto.split(' ').length, ts = this.tiempos.slice(w, w + n); w += n; return letterTimes(l.texto, ts, .03, .018); });
    this.tiempos.forEach((t0, i) => sonar(o, t0 - .02, i ? 'golpe-corto' : 'golpe', i ? .8 : 1));
    if (this.o.sal != null) sonar(o, this.o.sal, 'aire-salida', .6);
  }
  pintar(t, { o = 1, x = null, y0 = null } = {}) {
    const q = this.o.sal != null ? P(t, this.o.sal, .35, E.in2) : 0;       // sale entero en 0,35 s: que no se cruce con lo siguiente
    this.lin.forEach((e, i) => {
      if (o <= .002 || q >= 1 || t < this.tiempos[0] - .1) { off(e); return; }
      e._ch.forEach((c, k) => {
        const t0 = this.lt[i][k]; if (t0 == null) return;
        const p = clamp((t - t0) / .38), e4 = E.out4(p);
        c.style.transform = `translateY(${((1 - e4) * .5).toFixed(3)}em) scale(${lerp(1.25, 1, e4).toFixed(3)})`;
        c.style.opacity = clamp(p * 2.5).toFixed(3);
        c.style.filter = p < 1 ? `blur(${((1 - e4) * 10).toFixed(1)}px)` : 'none';
      });
      put(e, { x: x ?? this.o.x, y: (y0 ?? this.o.y0) + i * this.o.paso - q * 30, o: o * (1 - q), b: q * 8 });
    });
  }
}

/* ---------- subtítulos palabra a palabra (la que suena, en el acento) ----------
   new Subtitulos({ y: 952, max: 5, desde: 0, hasta: 99, ocultar: t => enAnim(t) }) y en render: subs.pintar(t).
   Lee trabajo/tiempos.json. Bloques de hasta «max» palabras, cortando en cada frase y en los silencios de > 0,5 s. */
class Subtitulos {
  constructor(o = {}) {
    this.o = { y: 952, max: 5, tam: 52, desde: 0, hasta: 1e9, ocultar: null, padre: STAGE, ...o };
    NECESITA.palabras = true; this.bl = null;
    this.el = mk('div', 'L subt', this.o.padre); this.el.style.zIndex = 70; this.el.style.fontSize = this.o.tam + 'px';
    this.cur = -1;
  }
  bloques() {
    const out = []; let b = [];
    for (const w of PALABRAS) {
      const txt = String(w.w || w.word || '').replace(/\{[^}]*\}/g, '');
      if (!txt) continue;
      const prev = b[b.length - 1];
      if (b.length && (b.length >= this.o.max || w.frase !== prev.frase || w.s - prev.e > .5)) { out.push(b); b = []; }
      b.push({ ...w, txt });
    }
    if (b.length) out.push(b);
    return out.map((ws, i) => ({ ws, s: ws[0].s, e: ws[ws.length - 1].e }));
  }
  pintar(t) {
    if (!this.bl) this.bl = this.bloques();
    const bl = this.bl, o = this.o;
    let k = -1;
    for (let i = 0; i < bl.length; i++) if (t >= bl[i].s - .08) k = i;
    const b = bl[k];
    const vis = b && t >= o.desde && t < o.hasta && !(o.ocultar && o.ocultar(t)) && t < Math.min(b.e + .45, (bl[k + 1]?.s ?? 1e9) - .08);
    if (!vis) { off(this.el); return; }
    if (this.cur !== k) { this.el.innerHTML = b.ws.map(w => `<span>${w.txt}</span>`).join(''); this.sp = [...this.el.children]; this.cur = k; }
    let on = -1;
    b.ws.forEach((w, i) => { if (t >= w.s - .03) on = i; });
    this.sp.forEach((s, i) => {
      s.className = i === on ? 'on' : '';
      const pb = i === on ? bump(t, b.ws[i].s - .03, .22) : 0;
      s.style.transform = `translateY(${(-4 * pb).toFixed(2)}px) scale(${(1 + .06 * pb).toFixed(3)})`;
    });
    const pe = P(t, b.s - .08, .18, E.out3);
    put(this.el, { x: o.x ?? CX, y: o.y + (1 - pe) * 14, o: pe });
  }
}

/* ---------- leyenda de una línea con una palabra en el acento («Google **Drive**», «**Claude** edita») ----------
   new Leyenda('Cortes *automáticos*', { t0, t1, y: 950 })  (la palabra entre asteriscos va en el acento). */
class Leyenda {
  constructor(texto, o = {}) {
    this.o = { y: 950, t0: 0, t1: 1e9, padre: STAGE, ...o };
    this.el = mk('div', 'L leyenda', this.o.padre, texto.replace(/\*([^*]+)\*/g, '<b>$1</b>')); this.el.style.zIndex = 70;
    sonar(o, this.o.t0, 'tick', .7);
  }
  pintar(t, { o = 1 } = {}) {
    const p = P(t, this.o.t0, .35, E.out4), q = P(t, this.o.t1, .3, E.in3);
    if (p <= 0 || q >= 1 || o <= .002) { off(this.el); return; }
    put(this.el, { x: this.o.x ?? CX, y: this.o.y + (1 - p) * 18, o: p * (1 - q) * o, b: (1 - p) * 6 + q * 5 });
  }
}

/* ---------- rótulo de nombre y cargo (abajo a la izquierda, barra del acento) ----------
   new RotuloNombre({ nombre: 'Josema', cargo: 'IA Y AUTOMATIZACIÓN', t0, t1 }) */
class RotuloNombre {
  constructor(o = {}) {
    this.o = { x: 140, y: 880, t0: 0, t1: 1e9, padre: STAGE, ...o };
    this.el = mk('div', 'L rnom', this.o.padre, `<div class="bar"></div><div><div class="nm">${o.nombre || ''}</div><div class="cg">${o.cargo || ''}</div></div>`);
    this.el.style.zIndex = 70; this.bar = this.el.querySelector('.bar'); this.nm = this.el.querySelector('.nm'); this.cg = this.el.querySelector('.cg');
    sonar(o, this.o.t0, 'aire', .6);
  }
  pintar(t) {
    const p = P(t, this.o.t0, .5, E.out4), q = P(t, this.o.t1, .35, E.in3);
    if (p <= 0 || q >= 1) { off(this.el); return; }
    this.bar.style.transform = `scaleY(${p.toFixed(3)})`;
    rise(this.nm, t, this.o.t0 + .08); rise(this.cg, t, this.o.t0 + .2);
    put(this.el, { x: this.o.x - q * 30, y: this.o.y, ax: 0, o: 1 - q });
  }
}

/* ---------- buscador que se escribe (con una esfera de puntos girando de cargador) ----------
   new Buscador('Claude Opus 5.5 edición de vídeo', { t0, fin, palabras: [inicios], t1, ancho: 1000 })
   pintar(t, { x, y, o, s }). Con «palabras» cada palabra se escribe mientras se dice; si no, a ritmo fijo de t0 a fin. */
class Buscador {
  constructor(texto, o = {}) {
    this.o = { t0: 0, fin: null, t1: 1e9, ancho: 1000, padre: null, z: 'z6', ...o };
    this.texto = texto;
    this.el = panel({ w: this.o.ancho, clase: 'busc', padre: this.o.padre || WORLDF, z: this.o.z, html: `<canvas width="112" height="112"></canvas><span class="tx"><span class="t"></span><span class="caret-i"></span></span>` });
    this.cv = this.el.querySelector('canvas'); this.tx = this.el.querySelector('.t'); this.caret = this.el.querySelector('.caret-i');
    const fin = this.o.fin ?? this.o.t0 + texto.length * .045;
    this.seg = this.o.palabras ? escribirPalabras(texto, this.o.palabras, fin) : [[this.o.t0, fin, texto]];
    sonar(o, this.o.t0 - .25, 'aire', .6); sonar(o, this.o.t0, 'tecleo', .8);
  }
  pintar(t, pos = {}) {
    const q = P(t, this.o.t1, .3, E.in3), pe = P(t, this.o.t0 - .35, .4, E.out4);
    if (pe <= 0 || q >= 1 || (pos.o ?? 1) <= .002) { off(this.el); return; }
    let s = '', escribe = false;
    for (const [a, b, txt] of this.seg) { const n = Math.floor(clamp((t - a) / (b - a)) * txt.length + (t >= a ? 1 : 0)); s += txt.slice(0, Math.min(n, txt.length)); if (t >= a && t < b) escribe = true; }
    this.tx.textContent = s; this.caret.style.opacity = escribe ? 1 : blink(t, 2.4);
    // esfera de puntos (cargador): 60 puntos en una esfera que gira
    const x = this.cv.getContext('2d'); x.clearRect(0, 0, 112, 112);
    for (let i = 0; i < 60; i++) {
      const yv = 1 - (i + .5) / 30, r = Math.sqrt(1 - yv * yv), th = i * 2.39996 + t * 2.2, zz = r * Math.sin(th);
      const px = 56 + 44 * r * Math.cos(th), py = 56 + 44 * yv, a = .35 + .65 * (zz + 1) / 2;
      x.fillStyle = `rgba(${i % 5 ? '235,238,245' : ACENTO_RGB},${a.toFixed(3)})`; x.beginPath(); x.arc(px, py, 3.2 + 1.6 * (zz + 1) / 2, 0, 6.283); x.fill();
    }
    put(this.el, { x: pos.x ?? CX, y: (pos.y ?? 900) + (1 - pe) * 20, s: pos.s ?? 1, o: pe * (1 - q) * (pos.o ?? 1), b: (1 - pe) * 8 });
  }
}

/* ---------- tarjeta de fuente (una referencia: logo grande, dominio y título) ----------
   const f = tarjetaFuente({ logo: 'anthropic', dominio: 'anthropic.com', titulo: 'Claude Opus 5.5: el modelo más capaz' })
   (en vez de logo: icono: 'image', img: 'assets/x.png' o htmlTop: logo('whatsapp', 96) + logo('gmail', 96) para varios)
   pintarFuente(f, t, { x, y, s, rx, ry, o }, t0): entra con desenfoque y la recorre una línea del acento (escaneo).
   Suena un tick en t0 si se pasa { t0 } al crearla. */
function tarjetaFuente(o = {}) {
  const e = mk('div', `L fte ${o.z || 'z5'}`, o.padre || WORLDF, `<div class="top" style="background:${o.fondo || '#f3f3f1'}">${o.htmlTop || logoOIcono(o, o.tamLogo || 110)}<div class="scan"></div></div>` +
    `<div class="bot"><div class="dom">${o.favicon ? logo(o.favicon, 24) : ''}<span>${o.dominio || ''}</span></div><div class="tit">${o.titulo || ''}</div></div>`);
  e._scan = e.querySelector('.scan');
  sonar(o, o.t0, 'tick', .8);
  return e;
}
function pintarFuente(e, t, k, t0) {
  if (!(k.o > .002)) { off(e); return; }
  const p = P(t, t0, .5, E.out4), sc = clamp((t - t0 - .15) / .6);
  if (p <= 0) { off(e); return; }
  e._scan.style.opacity = sc > 0 && sc < 1 ? (1 - Math.abs(sc - .5) * 1.6).toFixed(3) : 0;
  e._scan.style.top = (sc * 196).toFixed(1) + 'px';
  put(e, { ...k, o: k.o * clamp(p * 2), b: (k.b || 0) + (1 - p) * 10, s: (k.s ?? 1) * lerp(.86, 1, p) });
}

/* ---------- tarjeta de subida / publicación con barra de progreso ----------
   new TarjetaProgreso({ logo: 'youtube', cabecera: 'Publicando en YouTube', cabeceraFin: 'Vídeo publicado', img: 'assets/miniatura.jpg' | html: '...',
                         titulo, canal, via: 'vía Blotato', t0, t1 (barra llena), tFin (publicado), sal })
   pintar(t, { x, y, s, rx, ry, o }). Suena: aire al entrar, dos notas al publicarse. */
class TarjetaProgreso {
  constructor(o = {}) {
    this.o = { cabecera: 'Subiendo…', cabeceraFin: 'Listo', textoFin: '✓ Publicado · Público', t0: 0, t1: 3, tFin: null, sal: null, ...o };
    const img = o.img ? `<img src="${o.img}">` : (o.html || `<div style="font:800 60px var(--sans);color:#fff">${o.titulo || ''}</div>`);
    this.el = panel({ w: 640, clase: 'prog', padre: o.padre || WORLDF, z: o.z || 'z5', html:
      `<div class="cab">${o.logo ? logo(o.logo, 38) : icon('arrowUp', 34, 2.2)}<span class="ct">${this.o.cabecera}</span></div><div class="img">${img}</div>` +
      `<div class="tit">${o.titulo || ''}</div><div class="can">${o.canal || ''}</div><div class="pista"><div class="barra"></div></div>` +
      `<div class="est"><span class="pc"></span><span class="via">${o.via || ''}</span></div>` });
    this.ct = this.el.querySelector('.ct'); this.barra = this.el.querySelector('.barra'); this.pc = this.el.querySelector('.pc');
    sonar(o, this.o.t0, 'aire', .8); sonar(o, this.o.tFin, 'nota-doble', .9); sonar(o, this.o.sal, 'aire-salida', .6);
  }
  pintar(t, k = {}) {
    const p = P(t, this.o.t0, .5, E.out4), q = this.o.sal != null ? P(t, this.o.sal, .35, E.in3) : 0;
    if (p <= 0 || q >= 1 || (k.o ?? 1) <= .002) { off(this.el); return; }
    const hecho = this.o.tFin != null && t >= this.o.tFin, pr = E.io3(clamp((t - this.o.t0 - .2) / (this.o.t1 - this.o.t0 - .2)));
    this.barra.style.width = (hecho ? 100 : pr * 100).toFixed(2) + '%';
    this.barra.style.background = hecho ? '#3ddc84' : '#3e8bff';
    this.pc.textContent = hecho ? this.o.textoFin : `Subiendo… ${Math.floor(pr * 100)} %`;
    this.pc.style.color = hecho ? '#3ddc84' : '';
    this.ct.textContent = hecho ? this.o.cabeceraFin : this.o.cabecera;
    const pop = hecho ? bump(t, this.o.tFin, .3) : 0;
    put(this.el, { x: 1440, y: 540, ...k, s: (k.s ?? 1) * lerp(.9, 1, p) * (1 + .03 * pop), o: (k.o ?? 1) * clamp(p * 2) * (1 - q), b: (1 - p) * 10 + q * 6 });
  }
}

/* ---------- notificación que baja (app, título, texto, miniaturas y botón que se pulsa) ----------
   new Notificacion({ logo: 'claude', app: 'Claude', titulo: 'Tus 3 miniaturas están listas para revisión', texto, extra: html, boton: '✓ Revisar',
                      t0, tBoton, t1 }) y pintar(t, { x, y, o }). Suena el aviso al entrar y un clic en el botón. */
class Notificacion {
  constructor(o = {}) {
    this.o = { app: '', hora: 'ahora', t0: 0, tBoton: null, t1: 1e9, ...o };
    this.el = panel({ w: 760, clase: 'noti', padre: o.padre || WORLDF, z: o.z || 'z7', html:
      `<div class="cab">${o.logo ? logo(o.logo, 40) : icon('bell', 34, 2)}<span>${this.o.app}</span><span class="h">${this.o.hora}</span></div>` +
      `<div class="tit">${o.titulo || ''}</div>${o.texto ? `<div class="txt">${o.texto}</div>` : ''}<div class="ext">${o.extra || ''}${o.boton ? `<span class="btn">${o.boton}</span>` : ''}</div>` });
    this.btn = this.el.querySelector('.btn');
    sonar(o, this.o.t0, 'notificacion', .9); sonar(o, this.o.tBoton, 'click', 1); sonar(o, this.o.t1, 'aire-salida', .5);
  }
  pintar(t, k = {}) {
    const p = P(t, this.o.t0, .5, E.out4), q = P(t, this.o.t1, .3, E.in3);
    if (p <= 0 || q >= 1 || (k.o ?? 1) <= .002) { off(this.el); return; }
    if (this.btn) {
      const b = this.o.tBoton != null ? P(t, this.o.tBoton - .5, .3, E.back) : 1, pr = this.o.tBoton != null ? bump(t, this.o.tBoton, .2) : 0;
      this.btn.style.opacity = b.toFixed(3); this.btn.style.transform = `scale(${(lerp(.6, 1, b) * (1 - .1 * pr)).toFixed(3)})`;
      this.btn.style.filter = pr > 0 ? `brightness(${(1 + .35 * pr).toFixed(3)})` : 'none';
    }
    put(this.el, { x: CX, y: 250, ...k, y: (k.y ?? 250) - (1 - p) * 50, s: (k.s ?? 1) * lerp(.94, 1, p), o: (k.o ?? 1) * clamp(p * 2) * (1 - q), b: (1 - p) * 8 });
  }
}

/* ---------- carpeta que recibe algo (subir a Drive, guardar, archivar) ----------
   const c = carpeta({ logo: 'google-drive', etiqueta: 'YouTube · Brutos' }): c.atras (detrás de lo que cae) y c.delante.
   pintarCarpeta(c, { x, y, s, o }, abre 0..1): la tapa delantera se abre hacia delante para recibir.
   Lo que cae se pinta entre las dos (z entre z2 y z6). Al aterrizar: sfx(t, 'golpe-corto'). */
function carpeta(o = {}) {
  const atras = mk('div', 'L carp atras z2', o.padre);
  const delante = mk('div', 'L carp delante z6', o.padre, `${o.logo ? logo(o.logo, 110) : icon('folder', 90, 1.8)}<div class="et">${o.etiqueta || ''}</div>`);
  return { atras, delante };
}
function pintarCarpeta(c, k, abre = 0) {
  if (!(k.o > .002)) { off(c.atras); off(c.delante); return; }
  put(c.atras, { ...k, y: k.y - 40 * (k.s ?? 1) });
  put(c.delante, { ...k, y: k.y + 40 * (k.s ?? 1), rx: -28 * abre, per: 1200 });
}

/* ---------- revelado de marca: destello suave, logo que se enfoca, anillos 3D, rayos, confeti y nombre ----------
   new Revelado({ logo: 'blotato', nombre: 'Blotato', t0, t1, rgb: '140,120,255', x: 960, y: 440 }) y rev.pintar(t).
   Suena: swell que termina en t0, golpe grave en t0 y brillo. Pantalla completa: pon fondo: 1 en estadoVideo. */
class Revelado {
  constructor(o = {}) {
    this.o = { x: CX, y: CY - 100, tam: 300, t0: 0, t1: 1e9, rgb: ACENTO_RGB, padre: null, ...o };
    const r = this.o.rgb;
    this.rayos = mk('div', 'L rayos z1', this.o.padre); this.rayos.style.setProperty('--rgb', r);
    this.anillos = [0, 1, 2].map(i => { const a = mk('div', 'L anillo z3', this.o.padre); a.style.width = a.style.height = '420px'; a.style.setProperty('--rgb', i === 1 ? '255,255,255' : r); return a; });
    this.cv = mk('canvas', 'L z6', this.o.padre); this.cv.width = CONFIG.ancho; this.cv.height = CONFIG.alto; this.cv.style.width = CONFIG.ancho + 'px'; this.cv.style.height = CONFIG.alto + 'px';
    this.logo = mk('div', 'L z5', this.o.padre, o.logo ? logo(o.logo, this.o.tam) : icon(o.icono || 'sparkles', this.o.tam, 1.6));
    this.nom = letters(o.nombre || '', 'L revn z5');
    if (this.o.padre) this.o.padre.appendChild(this.nom);
    this.nt = letterTimes(o.nombre || '', [this.o.t0 + .45], .0, .045);
    this.conf = Array.from({ length: 90 }, () => { const a = azar() * 6.283, v = 500 + azar() * 1300; return { vx: Math.cos(a) * v, vy: Math.sin(a) * v * .75 - 200, rot: azar() * 6, vr: (azar() - .5) * 14, w: 8 + azar() * 16, h: 5 + azar() * 9, c: azar() < .45 ? r : azar() < .5 ? '255,255,255' : ACENTO_RGB }; });
    sonar(o, this.o.t0, 'swell', .8); sonar(o, this.o.t0, 'golpe-grave', 1); sonar(o, this.o.t0 + .06, 'brillo', .7);
  }
  pintar(t, { o = 1 } = {}) {
    const { x, y, t0, t1 } = this.o, d = t - t0, q = P(t, t1, .4, E.in3);
    const todo = [this.rayos, ...this.anillos, this.cv, this.logo, this.nom];
    if (d < -.05 || q >= 1 || o <= .002) { todo.forEach(off); return; }
    const vis = o * (1 - q);
    destello(t, t0, .55 * vis, .05, 3.2);
    put(this.rayos, { x, y, r: t * 8, s: lerp(.5, 1, P(t, t0, .8, E.out3)), o: P(t, t0, .4) * .9 * vis });
    this.anillos.forEach((a, i) => { const k = clamp((d - i * .12) / 1.3); put(a, { x, y: y + 20, sx: lerp(.3, 4.2, E.out3(k)), sy: lerp(.3, 4.2, E.out3(k)) * .32, o: (k > 0 && k < 1 ? (1 - k) * .95 : 0) * vis }); });
    // confeti (física simple desde t0)
    const c = this.cv.getContext('2d'); c.clearRect(0, 0, CONFIG.ancho, CONFIG.alto);
    if (d > 0 && d < 2.6) {
      for (const p of this.conf) {
        const px = x + p.vx * d * Math.exp(-d * .9), py = y + p.vy * d * Math.exp(-d * .9) + 260 * d * d, a = clamp(1 - d / 2.4) * vis;
        c.save(); c.translate(px, py); c.rotate(p.rot + p.vr * d); c.fillStyle = `rgba(${p.c},${a.toFixed(3)})`; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
      }
      put(this.cv, { x: CX, y: CY, o: 1 });
    } else off(this.cv);
    const pl = P(t, t0 - .04, .6, E.out4);
    put(this.logo, { x, y, s: lerp(1.45, 1, pl) * (1 + .03 * Math.sin(t * 2)), o: clamp(pl * 2.2) * vis, b: (1 - pl) * 24 });
    lettersIn(this.nom, t, this.nt, .4);
    this.nom._ch.forEach((ch, i) => { const k = clamp((t - this.nt[i]) / .4); ch.style.filter = k < 1 ? `blur(${((1 - k) * 12).toFixed(1)}px)` : 'none'; });
    put(this.nom, { x, y: y + this.o.tam * .5 + 150, o: (d > .4 ? 1 : 0) * vis });
  }
}

/* ---------- esfera de puntos que gira y se convierte en una figura (un logo, un icono, una palabra) ----------
   new EsferaPuntos({ n: 900, radio: 260, forma: { logo: 'claude' } | { icono: 'bot' } | { texto: 'IA' }, tForma, t0 })
   pintar(t, { x, y, o, s }). La figura se toma de la silueta del logo/icono/texto. Suena brillo al formarse. */
class EsferaPuntos {
  constructor(o = {}) {
    this.o = { n: 900, radio: 260, t0: 0, tForma: null, rgb: '235,238,245', rgb2: ACENTO_RGB, padre: null, z: 'z4', ...o };
    this.cv = mk('canvas', `L ${this.o.z}`, this.o.padre); this.cv.width = this.cv.height = 1400; this.cv.style.width = this.cv.style.height = '700px';
    const n = this.o.n;
    this.p = Array.from({ length: n }, (_, i) => { const y = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y * y), th = i * 2.399963; return { x: r * Math.cos(th), y, z: r * Math.sin(th), ac: azar() < .18, sd: azar() }; });
    this.dest = null;
    if (o.forma && o.forma.logo) mk('div', 'L', this.o.padre, logo(o.forma.logo, 64));   // el logo tiene que estar cargado para leer su silueta
    sonar(o, this.o.t0, 'aire', .6); sonar(o, this.o.tForma, 'brillo', .8);
  }
  figura() {                                         // puntos de destino a partir de la silueta de la forma
    const f = this.o.forma || {}, S = 400, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (f.texto) { x.font = `800 ${Math.round(S * .55 / Math.max(1, f.texto.length * .55))}px Outfit`; x.fillText(f.texto, S / 2, S / 2); }
    else {
      const img = f.logo ? document.querySelector(`img[data-logo="${f.logo}"]`) : null;
      if (img && img.complete && img.naturalWidth) x.drawImage(img, S * .1, S * .1, S * .8, S * .8);
      else if (f.icono && ICON[f.icono]) { x.lineWidth = 22; const p = new Path2D(); ICON[f.icono].replace(/ d="([^"]+)"/g, (_, d) => { p.addPath(new Path2D(d), new DOMMatrix().translate(S * .1, S * .1).scale(S * .8 / 24)); }); x.stroke(p); }
      else { x.beginPath(); x.arc(S / 2, S / 2, S * .35, 0, 6.283); x.fill(); }
    }
    const d = x.getImageData(0, 0, S, S).data, pts = [];
    for (let yy = 0; yy < S; yy += 3) for (let xx = 0; xx < S; xx += 3) if (d[(yy * S + xx) * 4 + 3] > 120) pts.push([(xx / S - .5) * 2, (yy / S - .5) * 2]);
    return this.p.map((_, i) => pts.length ? pts[Math.floor((i * 7919) % pts.length)] : [0, 0]);
  }
  pintar(t, k = {}) {
    const pe = P(t, this.o.t0, .8, E.out3);
    if (pe <= 0 || (k.o ?? 1) <= .002) { off(this.cv); return; }
    const m = this.o.tForma != null ? t - this.o.tForma : -1;
    if (m > -.2 && !this.dest) this.dest = this.figura();
    const x = this.cv.getContext('2d'), R = this.o.radio * 2 * pe, C = 700;
    x.clearRect(0, 0, 1400, 1400);
    const ay = t * .55, ax = .35, ca = Math.cos(ay), sa = Math.sin(ay), cb = Math.cos(ax), sb = Math.sin(ax);
    this.p.forEach((p, i) => {
      let X = p.x * ca + p.z * sa, Z = -p.x * sa + p.z * ca, Y = p.y * cb - Z * sb; Z = p.y * sb + Z * cb;
      let px = C + X * R, py = C + Y * R, a = .25 + .75 * (Z + 1) / 2, r = 2.2 + 2.2 * (Z + 1) / 2;
      if (this.dest && m > 0) { const q = E.io3(clamp((m - p.sd * .35) / .9)); px = lerp(px, C + this.dest[i][0] * R * 1.05, q); py = lerp(py, C + this.dest[i][1] * R * 1.05, q); a = lerp(a, .95, q); r = lerp(r, 3.2, q); }
      x.fillStyle = `rgba(${p.ac ? this.o.rgb2 : this.o.rgb},${a.toFixed(3)})`; x.beginPath(); x.arc(px, py, r, 0, 6.283); x.fill();
    });
    put(this.cv, { x: k.x ?? CX, y: k.y ?? CY - 60, s: k.s ?? 1, o: (k.o ?? 1) * clamp(pe * 2) });
  }
}

/* ---------- palabra que se deshace en polvo (algo que desaparece, que ya no importa) ----------
   new Polvo('EDITAR', { t0 (empieza a deshacerse), dur: 1.4, tam: 160, rgb: '255,255,255' }) y pintar(t, { x, y, o }).
   Antes de t0 se ve entera; se deshace de izquierda a derecha, las partículas vuelan hacia arriba y a la derecha. */
class Polvo {
  constructor(texto, o = {}) {
    this.o = { t0: 0, dur: 1.4, tam: 160, rgb: '255,255,255', padre: null, z: 'z5', ...o };
    this.texto = texto; this.cv = mk('canvas', `L ${this.o.z}`, this.o.padre); this.cv.width = 1800; this.cv.height = 700; this.cv.style.width = '1800px'; this.cv.style.height = '700px';
    this.pts = null;
    sonar(o, this.o.t0, 'descarte', .8);
  }
  preparar() {
    const c = document.createElement('canvas'); c.width = 1800; c.height = 700; const x = c.getContext('2d');
    x.font = `800 ${this.o.tam * 2}px Outfit`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText(this.texto, 900, 350);
    const d = x.getImageData(0, 0, 1800, 700).data, pts = [];
    let x0 = 1800, x1 = 0;
    for (let yy = 0; yy < 700; yy += 4) for (let xx = 0; xx < 1800; xx += 4) if (d[(yy * 1800 + xx) * 4 + 3] > 128) { pts.push({ x: xx, y: yy, r1: azar(), r2: azar(), r3: azar() }); x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); }
    pts.forEach(p => p.k = (p.x - x0) / Math.max(1, x1 - x0));
    this.pts = pts; this.img = c;
  }
  pintar(t, k = {}) {
    if ((k.o ?? 1) <= .002) { off(this.cv); return; }
    if (!this.pts) this.preparar();
    const x = this.cv.getContext('2d'), d = t - this.o.t0;
    x.clearRect(0, 0, 1800, 700);
    if (d <= 0) x.drawImage(this.img, 0, 0);
    else {
      for (const p of this.pts) {
        const u = clamp((d - p.k * this.o.dur * .45) / (this.o.dur * .7));
        if (u <= 0) { x.fillStyle = `rgba(${this.o.rgb},1)`; x.fillRect(p.x, p.y, 4, 4); continue; }
        if (u >= 1) continue;
        const e = E.out2(u), px = p.x + e * (120 + 260 * p.r1), py = p.y - e * (80 + 220 * p.r2) + Math.sin(u * 6 + p.r3 * 6) * 12;
        x.fillStyle = `rgba(${this.o.rgb},${(1 - u).toFixed(3)})`; x.fillRect(px, py, 3.2 * (1 - u * .6), 3.2 * (1 - u * .6));
      }
      if (d > this.o.dur * 1.2) { off(this.cv); return; }
    }
    put(this.cv, { x: k.x ?? CX, y: k.y ?? CY, s: .5 * (k.s ?? 1), o: k.o ?? 1 });
  }
}

/* ---------- cuadrícula de 100 que se llena hasta un porcentaje (con el logo o la etiqueta al lado) ----------
   new Cuadricula100({ pct: 72, t0, dur: 1.4, etiqueta: 'de los usuarios', rgb }) y pintar(t, { x, y, o, s }).
   La cifra no cuenta (un fotograma pausado parecería un dato): entra con golpe cuando la cuadrícula termina. */
class Cuadricula100 {
  constructor(o = {}) {
    this.o = { pct: 50, t0: 0, dur: 1.4, rgb: ACENTO_RGB, etiqueta: '', padre: null, z: 'z4', ...o };
    this.el = mk('div', `L ${this.o.z}`, this.o.padre, `<div style="display:flex;align-items:center;gap:70px"><div class="c100">${'<i></i>'.repeat(100)}</div><div><div class="c100n">${this.o.pct}<small>%</small></div><div style="font:600 36px var(--sans);color:#c9cfdb;margin-top:6px;white-space:nowrap">${this.o.etiqueta}</div></div></div>`);
    this.el.style.setProperty('--rgb', this.o.rgb);
    this.cel = [...this.el.querySelectorAll('.c100 i')]; this.num = this.el.querySelector('.c100n');
    sonar(o, this.o.t0, 'aire', .7); sonar(o, this.o.t0 + this.o.dur, 'golpe-corto', .9);
  }
  pintar(t, k = {}) {
    const pe = P(t, this.o.t0 - .3, .4, E.out3);
    if (pe <= 0 || (k.o ?? 1) <= .002) { off(this.el); return; }
    const n = Math.round(this.o.pct * E.io3(clamp((t - this.o.t0) / this.o.dur)));
    this.cel.forEach((c, i) => { const idx = (9 - Math.floor(i / 10)) * 10 + (i % 10); c.classList.toggle('on', idx < n); });   // se llena de abajo arriba
    slam(this.num, t, this.o.t0 + this.o.dur, 1.5);
    put(this.el, { x: CX, y: CY, ...k, o: (k.o ?? 1) * pe });
  }
}

/* ---------- rótulo grande en bloques (con la cámara desenfocada detrás: est.blur ≈ 14 y br ≈ .6) ----------
   new Rotulo(['Cortes', 'automáticos'], { acento: [1], tiempos: [T.cortes, T.automaticos], sal, tam: 104 }) y pintar(t, { x, y, o }).
   Cada bloque se levanta como una carta (rotateX) al decir su palabra. */
class Rotulo {
  constructor(lineas, o = {}) {
    this.o = { acento: [], tiempos: [], sal: null, tam: 104, padre: WORLDF, z: 'z7', ...o };
    this.el = mk('div', `L rot ${this.o.z}`, this.o.padre, lineas.map((l, i) => `<div class="ln${this.o.acento.includes(i) ? ' ac' : ''}" style="font-size:${this.o.tam}px">${l}</div>`).join(''));
    this.ln = [...this.el.querySelectorAll('.ln')];
    this.o.tiempos.forEach((t0, i) => sonar(o, t0 - .02, i ? 'tick' : 'golpe-corto', .9));
    sonar(o, this.o.sal, 'aire-salida', .6);
  }
  pintar(t, k = {}) {
    const q = this.o.sal != null ? P(t, this.o.sal, .35, E.in3) : 0, t0 = this.o.tiempos[0] ?? 0;
    if (t < t0 - .1 || q >= 1 || (k.o ?? 1) <= .002) { off(this.el); return; }
    this.ln.forEach((l, i) => { const p = P(t, (this.o.tiempos[i] ?? t0) - .04, .45, E.out4); l.style.transform = `rotateX(${((1 - p) * 85).toFixed(2)}deg) translateY(${((1 - p) * 30).toFixed(1)}px)`; l.style.opacity = clamp(p * 2.5).toFixed(3); });
    put(this.el, { x: CX, y: CY - 20, rx: 8, ry: -6, ...k, o: (k.o ?? 1) * (1 - q), b: q * 8, y: (k.y ?? CY - 20) - q * 20 });
  }
}

/* ---------- cursor que se mueve y pulsa (con onda en cada clic) ----------
   new Cursor(norm([[t, { x, y, o }], ...]), { clics: [t1, t2] }) y pintar(t). Suena un clic en cada uno. */
class Cursor {
  constructor(keys, o = {}) {
    this.k = keys; this.o = { clics: [], padre: WORLDF, ...o };
    this.el = mk('div', 'L cursor z8', this.o.padre, `<svg viewBox="0 0 24 24" width="46" height="46"><path d="M4 2.5 20 12l-7.2 1.6L9 21z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
    this.onda = mk('div', 'L onda z8', this.o.padre); this.onda.style.width = this.onda.style.height = '60px';
    this.o.clics.forEach(tc => sonar(o, tc, 'click', 1));
  }
  pintar(t) {
    const k = KF(t, this.k);
    if (!(k.o > .002)) { off(this.el); off(this.onda); return; }
    const c = this.o.clics.filter(x => t >= x && t < x + .45).pop(), pc = c != null ? clamp((t - c) / .45) : 0;
    put(this.el, { x: k.x, y: k.y, ax: 18, ay: 10, s: 1 - .14 * (c != null ? bump(t, c, .18) : 0), o: k.o });
    if (c != null) put(this.onda, { x: k.x, y: k.y, s: lerp(.3, 1.6, E.out3(pc)), o: (1 - pc) * .9 * k.o }); else off(this.onda);
  }
}

/* =====================================================================
   Piezas de la intro «editado por IA» (29/09/2026; ejemplos/editado-por-ia.html), aprobadas por Josema («brutal»):
   LineaTiempo · VisorREC · Escaneo · PanelTareas · PanelConcepto · Explorador + Arrastre · RevelarHaces · RutaPasos ·
   TarjetaRegalo. Nacieron para no parecerse al vídeo de referencia (references/diseno.md § 7): lenguaje de editor de
   vídeo y de escritorio (ventanas, cursores, líneas de tiempo), nada de iconos «de IA» ni nada que parpadee.
   ===================================================================== */
css(`
.tlin{padding:22px 28px 26px}
.tlin .cab{display:flex;align-items:center;gap:14px;font:600 22px var(--mono);letter-spacing:.16em;color:#aab3c5;margin-bottom:4px}
.tlin .cab svg{color:var(--acento)}
.tlin .cab .tc{margin-left:auto;color:#fff;letter-spacing:.06em}
.tlin .pistas{position:relative}
.tlin .fila{display:flex;align-items:center;gap:18px;height:46px;margin-top:10px}
.tlin .lab{width:140px;flex:none;font:600 20px var(--mono);letter-spacing:.12em;color:#8d97ab}
.tlin .pista{position:relative;flex:1;height:36px;border-radius:9px;background:rgba(255,255,255,.045)}
.tlin .clip{position:absolute;top:4px;bottom:4px;border-radius:7px;transform-origin:0 50%;box-shadow:inset 0 1px 0 rgba(255,255,255,.35)}
.tlin .ph{position:absolute;top:4px;bottom:-6px;width:3px;margin-left:-1.5px;border-radius:2px;background:#fff;box-shadow:0 0 14px rgba(255,255,255,.85)}
.recov{pointer-events:none}
.recov .cn{position:absolute;width:96px;height:96px;border:0 solid rgba(255,255,255,.95);filter:drop-shadow(0 2px 8px rgba(0,0,0,.55))}
.recov .c1{left:72px;top:72px;border-left-width:7px;border-top-width:7px;border-top-left-radius:16px}
.recov .c2{right:72px;top:72px;border-right-width:7px;border-top-width:7px;border-top-right-radius:16px}
.recov .c3{left:72px;bottom:72px;border-left-width:7px;border-bottom-width:7px;border-bottom-left-radius:16px}
.recov .c4{right:72px;bottom:72px;border-right-width:7px;border-bottom-width:7px;border-bottom-right-radius:16px}
.recov .rc{position:absolute;right:136px;top:124px;display:flex;align-items:center;gap:16px;font:700 46px var(--mono);color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6)}
.recov .rc i{display:block;width:30px;height:30px;border-radius:50%;background:#ff3b30;box-shadow:0 0 20px rgba(255,59,48,.85)}
.recov .tc{position:absolute;right:136px;top:188px;font:500 32px var(--mono);color:rgba(255,255,255,.9);text-shadow:0 2px 10px rgba(0,0,0,.6)}
.recov .fmt{position:absolute;left:136px;bottom:124px;font:600 30px var(--mono);letter-spacing:.08em;color:rgba(255,255,255,.9);text-shadow:0 2px 10px rgba(0,0,0,.6)}
.scanl{height:260px;pointer-events:none}
.scanl .ban{position:absolute;left:0;right:0;top:0;bottom:4px;background:linear-gradient(180deg,rgba(var(--acento-rgb),0),rgba(var(--acento-rgb),.16));
  -webkit-mask-image:repeating-linear-gradient(90deg,#000 0 2px,transparent 2px 9px);mask-image:repeating-linear-gradient(90deg,#000 0 2px,transparent 2px 9px)}
.scanl .lin{position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,transparent,rgba(var(--acento-rgb),1) 12%,#fff 50%,rgba(var(--acento-rgb),1) 88%,transparent);
  box-shadow:0 0 22px rgba(var(--acento-rgb),.95),0 0 60px rgba(var(--acento-rgb),.5)}
.tareas{padding:26px 30px 28px}
.tareas .cab{display:flex;align-items:center;gap:14px;font:600 23px var(--mono);letter-spacing:.14em;color:#dfe4ee;white-space:nowrap}
.tareas .cab svg{color:var(--acento)}
.tareas .pill{position:relative;margin-left:auto;height:38px;min-width:170px}
.tareas .pill span{position:absolute;right:0;top:0;height:38px;display:flex;align-items:center;gap:8px;padding:0 14px;border-radius:999px;font:700 20px var(--mono);letter-spacing:.08em;white-space:nowrap}
.tareas .pill .a{background:rgba(255,255,255,.08);color:#aab3c5}
.tareas .pill .b{background:#3ddc84;color:#07140c}
.tareas .fila{display:flex;align-items:center;gap:18px;margin-top:20px;font:600 32px var(--sans);color:#7f889b;white-space:nowrap}
.tareas .ck{position:relative;width:38px;height:38px;flex:none;border-radius:50%;border:2.5px solid #3a4150}
.tareas .ck b{position:absolute;inset:-2.5px;border-radius:50%;background:var(--acento);color:var(--sobre-acento);display:flex;align-items:center;justify-content:center;opacity:0;
  box-shadow:0 0 18px rgba(var(--acento-rgb),.8)}
.fx{padding:30px 36px 32px}
.fx .fx-ic{width:96px;height:96px;border-radius:24px;background:var(--acento);color:var(--sobre-acento);display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px -14px rgba(var(--acento-rgb),.8)}
.fx .fx-ic img{display:block}
.fx .fxm{font:800 42px/1 var(--sans);letter-spacing:-.02em}
.fx .fx-t{font:var(--display-peso,800) 76px/1 var(--display,var(--sans));color:#fff;margin-top:22px;letter-spacing:-.01em;white-space:nowrap}
.fx .chips{display:flex;gap:10px;margin-top:20px}
.fx .chips span{font:500 22px var(--mono);color:#d5dae4;padding:8px 14px;border-radius:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);white-space:nowrap}
.fx .ola{position:relative;height:78px;margin-top:20px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.08);overflow:hidden}
.fx .ola canvas{position:absolute;left:0;top:0;height:78px}
.fx .ola .jug{position:absolute;left:0;top:0;height:78px;width:0;overflow:hidden}
.fx .ola .cab{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 10px rgba(255,255,255,.9)}
.expl{padding:0 0 20px;overflow:hidden}
.expl .barra{display:flex;align-items:center;gap:14px;height:66px;padding:0 24px;background:rgba(255,255,255,.045);border-bottom:1px solid rgba(255,255,255,.08);font:600 26px var(--sans);color:#eef1f7}
.expl .barra .fic{color:#E9C46A;display:flex}
.expl .barra .ctl{margin-left:auto;display:flex;gap:30px;align-items:center;color:#9aa3b5;font:400 26px var(--sans)}
.expl .ruta{margin:18px 24px 4px;height:50px;border-radius:12px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:12px;padding:0 18px;font:500 21px var(--mono);color:#8d97ab;white-space:nowrap}
.expl .ruta b{color:#fff;font-weight:600}
.expl .rej{display:flex;gap:30px;padding:22px 34px 6px}
.expl .it{width:300px;display:flex;flex-direction:column;align-items:center;gap:14px}
.expl .mini{position:relative;width:300px;height:169px;border-radius:16px;display:flex;align-items:center;justify-content:center}
.expl .arch .mini{background:linear-gradient(180deg,#2b2f3a,#1b1e26);border:1px solid rgba(255,255,255,.09);color:#E9C46A}
.expl .slot .mini{border:2.5px dashed #4a5366;color:#8d97ab;flex-direction:column;gap:8px;font:600 22px var(--sans)}
.expl .slot .mini .hl{position:absolute;inset:-2.5px;border-radius:16px;border:2.5px solid var(--acento);background:rgba(var(--acento-rgb),.14);box-shadow:0 0 30px rgba(var(--acento-rgb),.55);opacity:0}
.expl .nm{position:relative;height:30px;font:600 22px var(--sans);color:#dfe4ee;white-space:nowrap}
.expl .pie{margin:12px 34px 0;height:26px;position:relative;font:500 20px var(--mono);color:#8d97ab}
.expl .pie span{position:absolute;left:0;top:0;white-space:nowrap}
.cursor2{width:52px;height:52px;filter:drop-shadow(0 8px 12px rgba(0,0,0,.6))}
.onda2{border-radius:50%;border:3px solid rgba(255,255,255,.95)}
.rev-bloom{width:1400px;height:1400px;border-radius:50%;background:radial-gradient(closest-side,rgba(var(--rgb),.5),rgba(var(--rgb),.14) 45%,rgba(var(--rgb),0))}
.rev-nm{font:var(--display-peso,800) 136px/1 var(--display,var(--sans));letter-spacing:-.02em;color:#fff;white-space:nowrap;text-shadow:0 12px 60px rgba(0,0,0,.6)}
.rev-nm b{font-weight:inherit;color:var(--c2)}
.rev-filo{width:8px;height:190px;border-radius:4px;background:#fff;box-shadow:0 0 18px #fff,0 0 50px rgba(var(--rgb),.95),0 0 110px rgba(var(--rgb),.6)}
.rev-eb{font:600 26px var(--mono);letter-spacing:.42em;color:#aab3c5;white-space:nowrap}
.ruta4{width:780px}
.ruta4 .eb{position:absolute;left:0;top:0;display:flex;align-items:center;gap:16px;font:600 26px var(--mono);letter-spacing:.3em;color:#dfe4ee;white-space:nowrap}
.ruta4 .eb i{display:block;width:54px;height:4px;border-radius:2px;background:var(--acento);box-shadow:0 0 14px rgba(var(--acento-rgb),.8)}
.ruta4 .via{position:absolute;left:58px;top:160px;width:5px;border-radius:3px;background:rgba(255,255,255,.08);overflow:visible}
.ruta4 .via .ll{position:absolute;left:0;top:0;width:5px;height:100%;border-radius:3px;transform-origin:50% 0;background:linear-gradient(180deg,rgba(var(--acento-rgb),1),#9db8ff);box-shadow:0 0 16px rgba(var(--acento-rgb),.8)}
.ruta4 .via .pt{position:absolute;left:-5px;width:15px;height:15px;margin-top:-7px;border-radius:50%;background:#fff;box-shadow:0 0 16px #fff,0 0 36px rgba(var(--acento-rgb),1)}
.ruta4 .nd{position:absolute;left:4px;width:112px;height:112px;border-radius:calc(var(--panel-k,1) * 30px);background:linear-gradient(180deg,rgba(34,38,48,.95),rgba(16,18,24,.96));border:2px solid rgba(255,255,255,.12);
  display:flex;align-items:center;justify-content:center;color:#eef1f7;box-shadow:0 26px 50px -20px rgba(0,0,0,.9)}
.ruta4 .nd .hi{position:absolute;inset:-2px;border-radius:calc(var(--panel-k,1) * 30px);border:2.5px solid var(--acento);box-shadow:0 0 34px rgba(var(--acento-rgb),.75),inset 0 0 20px rgba(var(--acento-rgb),.25);opacity:0}
.ruta4 .nd .n{position:absolute;right:-12px;top:-12px;width:38px;height:38px;border-radius:50%;background:var(--acento);color:var(--sobre-acento);font:800 21px var(--sans);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px -4px rgba(var(--acento-rgb),.9)}
.ruta4 .tx{position:absolute;left:156px}
.ruta4 .tx .t1{font:48px/1.05 var(--display,var(--sans));font-weight:min(var(--display-peso,700),700);color:#fff;white-space:nowrap}
.ruta4 .tx .t2{display:inline-block;font:500 24px var(--mono);color:#9aa3b5;margin-top:10px;white-space:nowrap}
.ruta4 .reg{position:absolute;display:flex;align-items:center;gap:8px;height:40px;padding:0 14px;border-radius:999px;background:var(--acento);color:var(--sobre-acento);
  font:700 20px var(--mono);letter-spacing:.1em;white-space:nowrap;box-shadow:0 10px 26px -8px rgba(var(--acento-rgb),.9);transform-origin:0 50%}
.skc{padding:30px 34px 30px}
.skc .top{display:flex;align-items:center;gap:18px}
.skc .ic{width:84px;height:84px;border-radius:22px;background:var(--acento);color:var(--sobre-acento);display:flex;align-items:center;justify-content:center;box-shadow:0 18px 40px -14px rgba(var(--acento-rgb),.8)}
.skc .eb{font:600 24px var(--mono);letter-spacing:.18em;color:#aab3c5}
.skc .nm{font:var(--display-peso,800) 100px/1 var(--display,var(--sans));color:#fff;margin-top:22px;letter-spacing:-.02em;white-space:nowrap}
.skc .id{font:500 32px var(--mono);color:#9db8ff;margin-top:10px;white-space:nowrap}
.skc .fs{display:flex;gap:10px;margin-top:18px}
.skc .fs span{font:500 23px var(--mono);color:#d5dae4;padding:8px 14px;border-radius:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);white-space:nowrap}
.skc .pis{height:12px;border-radius:6px;background:rgba(255,255,255,.1);margin-top:26px;overflow:hidden}
.skc .bar{height:100%;width:0;border-radius:6px;background:var(--acento)}
.skc .est{position:relative;height:40px;margin-top:14px;font:700 30px var(--sans)}
.skc .est span{position:absolute;left:0;top:0;white-space:nowrap;transform-origin:0 50%}
.skc .est .a{color:#c7cedb}
.skc .est .b{color:#3ddc84}
`);

/* código de tiempo mm:ss:ff (fotogramas a 60 fps) para visores y líneas de tiempo */
const pad2 = n => String(n).padStart(2, '0');
const codigoTiempo = (t, fps = 60) => { const f = Math.floor(t * fps + 1e-6); return `${pad2(Math.floor(f / (60 * fps)))}:${pad2(Math.floor(f / fps) % 60)}:${pad2(f % fps)}`; };

/* ---------- línea de tiempo de un editor de vídeo cuyos clips se colocan solos («la edición de este vídeo») ----------
   new LineaTiempo({ t0: .12, t1: 1.57, sal: 1.9 })  (pistas por defecto: VÍDEO, EFECTOS, MÚSICA; o pistas: [{ etiqueta,
   color, clips: [[desde, hasta] en 0..1] }]). Los clips entran por orden de posición entre t0 y t1; el cabezal va de
   cabezal[0] a cabezal[1] (por defecto t0 − 0,12 → t1 + 0,33) con el código de tiempo. pintar(t, { x, y, rx, o }). */
class LineaTiempo {
  constructor(o = {}) {
    this.o = { titulo: 'LÍNEA DE TIEMPO', ancho: 1100, t0: .12, t1: 1.57, cabezal: null, entra: null, sal: null, padre: WORLD, z: 'z5', ...o };
    const pistas = this.o.pistas || [
      { etiqueta: 'VÍDEO', color: 'linear-gradient(180deg,#6d93ff,#3E6EF2)', clips: [[0, .21], [.22, .47], [.48, .73], [.74, 1]] },
      { etiqueta: 'EFECTOS', color: 'linear-gradient(180deg,#f3d58c,#E9C46A)', clips: [[.05, .1], [.2, .25], [.47, .52], [.6, .64], [.73, .78], [.9, .95]] },
      { etiqueta: 'MÚSICA', color: 'linear-gradient(180deg,#b29de0,#8E75B2)', clips: [[0, 1]] },
    ];
    this.el = panel({ w: this.o.ancho, clase: 'tlin', padre: this.o.padre, z: this.o.z, html:
      `<div class="cab">${icon('film', 26, 2)}<span>${this.o.titulo}</span><span class="tc"></span></div><div class="pistas">` +
      pistas.map(p => `<div class="fila"><span class="lab">${p.etiqueta}</span><div class="pista">` +
        p.clips.map(c => `<i class="clip" style="left:${c[0] * 100}%;width:${(c[1] - c[0]) * 100}%;background:${p.color}"></i>`).join('') + '</div></div>').join('') +
      '<div class="ph"></div></div>' });
    this.tc = this.el.querySelector('.tc'); this.ph = this.el.querySelector('.ph'); this.pista = this.el.querySelector('.pista');
    const cl = [...this.el.querySelectorAll('.clip')].map(el => ({ el, x: parseFloat(el.style.left) })).sort((a, b) => a.x - b.x), n = cl.length;
    this.clips = cl.map((c, i) => ({ ...c, t0: lerp(this.o.t0, this.o.t1, n > 1 ? i / (n - 1) : 0) }));
    this.cab = this.o.cabezal || [this.o.t0 - .12, this.o.t1 + .33];
    this.px = null;
  }
  pintar(t, { x = CX, y = 858, rx = 12, o = 1 } = {}) {
    const pe = P(t, this.o.entra ?? this.o.t0 - .42, .55, E.out3), q = this.o.sal != null ? P(t, this.o.sal, .35, E.in3) : 0;
    if (pe <= 0 || q >= 1 || o <= .002) { off(this.el); return; }
    if (!this.px) this.px = { x: this.pista.offsetLeft, w: this.pista.offsetWidth };        // medido con las fuentes ya cargadas
    put(this.el, { x, y: y + q * 80 + (1 - pe) * 30, rx, o: pe * (1 - q) * o, b: q * 8 + (1 - pe) * 6 });
    this.clips.forEach(c => { const p = P(t, c.t0, .28, E.out3); c.el.style.transform = `scaleX(${Math.max(.001, p).toFixed(3)})`; c.el.style.opacity = clamp(p * 3).toFixed(3); });
    this.ph.style.left = (this.px.x + clamp((t - this.cab[0]) / (this.cab[1] - this.cab[0])) * this.px.w).toFixed(1) + 'px';
    this.tc.textContent = codigoTiempo(t);
  }
}

/* ---------- visor de cámara: esquinas, ● REC, código de tiempo y formato («yo solo he tenido que grabar») ----------
   new VisorREC({ t0, t1, ficha, finFicha, formato: '4K · 60 FPS' }): en pantalla de t0 a t1. Si la grabación se
   convierte en ficha en t1 (videoFicha que arranca a pantalla completa), pasa a pintarse DENTRO de la ficha y se encoge
   con ella (el relevo no se nota); se apaga en finFicha. pintar(t). Suena un bip en t0. */
class VisorREC {
  constructor(o = {}) {
    this.o = { t0: 0, t1: 1e9, ficha: null, finFicha: null, formato: '4K · 60 FPS', ...o };
    const html = '<i class="cn c1"></i><i class="cn c2"></i><i class="cn c3"></i><i class="cn c4"></i>' +
      `<div class="rc"><i></i>REC</div><div class="tc"></div><div class="fmt">${this.o.formato}</div>`;
    this.pant = mk('div', 'L recov z7', WORLDF, html);
    this.fic = this.o.ficha ? mk('div', 'recov', this.o.ficha, html) : null;
    if (this.fic) this.fic.style.cssText = 'position:absolute;left:0;top:0;opacity:0';
    for (const r of [this.pant, this.fic]) if (r) { r.style.width = CONFIG.ancho + 'px'; r.style.height = CONFIG.alto + 'px'; }
    sonar(o, this.o.t0, 'bip', .8);
  }
  pintar(t) {
    const { t0, t1, finFicha } = this.o;
    if (t < t0 - .02 || t >= t1) off(this.pant);
    else { const p = P(t, t0, .3, E.out4); put(this.pant, { x: CX, y: CY, s: lerp(1.06, 1, p), o: clamp(p * 2.5) }); }
    if (this.fic) this.fic.style.opacity = (t >= t1 ? 1 - (finFicha != null ? P(t, finFicha, .25) : 0) : 0).toFixed(3);
    for (const r of [this.pant, this.fic]) if (r) { r.querySelector('.tc').textContent = codigoTiempo(t); r.querySelector('.rc i').style.opacity = blink(t, 1.1) ? 1 : .25; }
  }
}

/* ---------- línea de escaneo que recorre la pantalla de arriba abajo («la IA lo ha hecho») ----------
   new Escaneo({ t0, dur: .62 }) y pintar(t). Va delante de la persona. Suena un barrido. */
class Escaneo {
  constructor(o = {}) {
    this.o = { t0: 0, dur: .62, padre: WORLDF, ...o };
    this.el = mk('div', 'L scanl z7', this.o.padre, '<i class="ban"></i><i class="lin"></i>'); this.el.style.width = CONFIG.ancho + 'px';
    sonar(o, this.o.t0 + .2, 'barrido', .5);
  }
  pintar(t) {
    const ps = (t - this.o.t0) / this.o.dur;
    if (ps > 0 && ps < 1.15) put(this.el, { x: CX, y: lerp(-140, CONFIG.alto, E.io3(clamp(ps))), ay: 100, o: 1 - clamp((ps - .95) / .2) });
    else off(this.el);
  }
}

/* ---------- panel de tareas que se van completando (lo que ha hecho la IA, pasos de una automatización) ----------
   new PanelTareas({ titulo: 'EDICIÓN CON IA', icono: 'scanFace', tareas: ['Transcribir la voz', ...], tiempos: [...],
                     t0 (entra), tFin (EN CURSO… → ✓ COMPLETA), sal })
   pintar(t, { x, y, rx, ry, o }). Va junto a la cabeza (nunca encima de la cara). Suena: aire al entrar, tick suave por
   tarea, nota al completarse, aire-salida. */
class PanelTareas {
  constructor(o = {}) {
    this.o = { titulo: 'TAREAS', icono: 'listChecks', tareas: [], tiempos: [], t0: 0, tFin: null, sal: null, textoCurso: 'EN CURSO…', textoFin: '✓ COMPLETA',
      ancho: 560, padre: WORLDF, z: 'z6', ...o };
    this.el = panel({ w: this.o.ancho, clase: 'tareas', padre: this.o.padre, z: this.o.z, html:
      `<div class="cab">${icon(this.o.icono, 34, 2)}<span>${this.o.titulo}</span><span class="pill"><span class="a">${this.o.textoCurso}</span><span class="b">${this.o.textoFin}</span></span></div>` +
      this.o.tareas.map(x => `<div class="fila"><i class="ck"><b>${icon('check', 24, 3)}</b></i><span class="tx">${x}</span></div>`).join('') });
    this.filas = [...this.el.querySelectorAll('.fila')]; this.ck = [...this.el.querySelectorAll('.ck b')];
    this.a = this.el.querySelector('.pill .a'); this.b = this.el.querySelector('.pill .b');
    sonar(o, this.o.t0 + .3, 'aire', .7, .4);
    this.o.tiempos.forEach(t0 => sonar(o, t0, 'tick-suave', .75));
    if (this.o.tFin != null) sonar(o, this.o.tFin - .02, 'nota', .8);
    if (this.o.sal != null) sonar(o, this.o.sal, 'aire-salida', .5);
  }
  pintar(t, k = {}) {
    const { t0, tFin, sal, tiempos } = this.o, q = sal != null ? P(t, sal, .3, E.in3) : 0, pp = P(t, t0, .5, E.out4);
    if (pp <= 0 || q >= 1 || (k.o ?? 1) <= .002) { off(this.el); return; }
    this.filas.forEach((f, i) => {
      const d = P(t, tiempos[i] - .02, .3, E.back), hecho = t >= tiempos[i] - .02;
      this.ck[i].style.opacity = clamp(d * 2).toFixed(3); this.ck[i].style.transform = `scale(${lerp(.4, 1, d).toFixed(3)})`;
      f.style.color = hecho ? '#f2f4f8' : '';
      f.style.opacity = clamp((t - (t0 + .1 + i * .06)) / .25).toFixed(3);
    });
    const pc = tFin != null ? P(t, tFin - .04, .35, E.back) : 0;
    this.a.style.opacity = (1 - clamp(pc * 3)).toFixed(3);
    this.b.style.opacity = clamp(pc * 2).toFixed(3); this.b.style.transform = `scale(${lerp(.6, 1, pc).toFixed(3)})`;
    put(this.el, { x: (k.x ?? 1480) + (1 - pp) * 110 + q * 60, y: (k.y ?? 470) + 6 * Math.sin(t * 1.3), s: lerp(.92, 1, pp) * (1 + .02 * (tFin != null ? bump(t, tFin - .02, .3) : 0)),
      rx: k.rx ?? 4, ry: k.ry ?? -12, o: clamp(pp * 2) * (1 - q) * (k.o ?? 1), b: (1 - pp) * 10 + q * 8 });
  }
}

/* ---------- panel de un concepto junto a la cabeza («efectos», «sonidos»): marca o icono en el acento, nombre grande
   y, debajo, chips (ejemplos reales) o la forma de onda de su voz con un cabezal que avanza ----------
   new PanelConcepto({ marca: 'FX' | icono: 'volume2' | logo, titulo: 'Efectos', chips: ['Transiciones', 'Desenfoque'],
                       onda: { a, b } (tramo de su voz que se dibuja), t0, sal, lado: 'izq' | 'der', sonidoEntra: 'aire' })
   pintar(t, { x, y }). Entra desde su lado. Nada parpadea: la onda es fija y solo avanza el cabezal. */
class PanelConcepto {
  constructor(o = {}) {
    this.o = { titulo: '', marca: null, icono: null, logo: null, chips: [], onda: null, t0: 0, sal: null, lado: 'izq', ancho: 430,
      sonidoEntra: 'aire', volEntra: .7, sonidoSal: true, padre: WORLDF, z: 'z6', ...o };
    const ic = this.o.marca ? `<span class="fxm">${this.o.marca}</span>` : logoOIcono(this.o, 54), w = this.o.ancho - 72;
    this.el = panel({ w: this.o.ancho, clase: 'fx', padre: this.o.padre, z: this.o.z, html:
      `<div class="fx-ic">${ic}</div><div class="fx-t">${this.o.titulo}</div>` +
      (this.o.chips.length ? `<div class="chips">${this.o.chips.map(c => `<span>${c}</span>`).join('')}</div>` : '') +
      (this.o.onda ? `<div class="ola" style="width:${w}px"><canvas class="c0" width="${w * 2}" height="156" style="width:${w}px"></canvas>` +
        `<div class="jug"><canvas class="c1" width="${w * 2}" height="156" style="width:${w}px"></canvas></div><i class="cab"></i></div>` : '') });
    this.chips = [...this.el.querySelectorAll('.chips span')];
    if (this.o.onda) { NECESITA.voz = true; this.w = w; this.c0 = this.el.querySelector('.c0'); this.c1 = this.el.querySelector('.c1'); this.jug = this.el.querySelector('.jug'); this.cab = this.el.querySelector('.ola .cab'); }
    const pan = this.o.lado === 'izq' ? -.4 : .4;
    sonar(o, this.o.t0 + .02, this.o.sonidoEntra, this.o.volEntra, pan);
    if (this.o.sal != null && this.o.sonidoSal) sonar(o, this.o.sal, 'aire-salida', .5);
  }
  dibujarOla(cv, color) {                                  // la forma de onda real de su voz en ese tramo
    const x = cv.getContext('2d'), N = 60, W = cv.width, H = cv.height, paso = W / N, { a, b } = this.o.onda;
    x.clearRect(0, 0, W, H); x.fillStyle = color;
    for (let i = 0; i < N; i++) {
      const tt = a + (i + .5) / N * (b - a), v = Math.max(nivelVoz(tt - .012), nivelVoz(tt), nivelVoz(tt + .012)), h = 10 + 124 * v;
      x.beginPath(); x.roundRect(i * paso + 3, (H - h) / 2, paso - 6, h, 3); x.fill();
    }
  }
  pintar(t, { x = 430, y = 360 } = {}) {
    const { t0, sal, lado } = this.o, q = sal != null ? P(t, sal, .3, E.in3) : 0;
    if (t < t0 - .04 || q >= 1) { off(this.el); return; }
    if (this.o.onda && !this.dibujada) { this.dibujarOla(this.c0, 'rgba(255,255,255,.26)'); this.dibujarOla(this.c1, '#9db8ff'); this.dibujada = true; }
    const p = P(t, t0, .45, E.out4), d = lado === 'izq' ? -1 : 1;
    put(this.el, { x: x + d * (1 - p) * 90 + d * q * 60, y: y + 6 * Math.sin(t * (d < 0 ? 1.4 : 1.2) + (d < 0 ? 0 : 1)), s: lerp(.9, 1, p), rx: 5, ry: -14 * d,
      o: clamp(p * 2) * (1 - q), b: (1 - p) * 10 + q * 8 });
    this.chips.forEach((c, i) => rise(c, t, t0 + .21 + i * .12));
    if (this.o.onda) { const pc = clamp((t - this.o.onda.a) / (this.o.onda.b - this.o.onda.a)) * this.w; this.jug.style.width = pc.toFixed(1) + 'px'; this.cab.style.left = pc.toFixed(1) + 'px'; }
  }
}

/* ---------- ventana del explorador de archivos con un hueco donde se suelta algo («colocar el vídeo en una carpeta») ----------
   new Explorador({ titulo: 'Animaciones', ruta: ['Proyectos', 'Animaciones'], items: [{ icono: 'fileArchive', nombre: 'skill.zip' }],
                    hueco: 'video_bruto.mp4', t0, tSuelta })
   pintar(t, { x, y, s, o, b }): entra desde la derecha en t0; se ilumina el hueco antes de soltar; en tSuelta aparece el
   nombre y «N elementos» pasa a «N+1». hueco(x, y, s) → centro y escala del hueco en el lienzo (para llevar allí la
   ficha con un Arrastre). Suena aire al entrar. */
class Explorador {
  constructor(o = {}) {
    this.o = { titulo: 'Carpeta', ruta: [], items: [], hueco: 'archivo', textoHueco: 'Suelta aquí', t0: 0, tSuelta: 1e9, ancho: 720, padre: WORLD, z: 'z3', ...o };
    const n = this.o.items.length, elems = k => `${k} elemento${k === 1 ? '' : 's'}`;
    this.el = panel({ w: this.o.ancho, clase: 'expl', padre: this.o.padre, z: this.o.z, html:
      `<div class="barra"><span class="fic">${icon('folder', 32, 2)}</span><span>${this.o.titulo}</span><span class="ctl"><span>—</span><span>▢</span><span>✕</span></span></div>` +
      `<div class="ruta">${this.o.ruta.map((r, i) => icon('arrowRight', 20, 2) + (i === this.o.ruta.length - 1 ? `<b>${r}</b>` : `<span>${r}</span>`)).join('')}</div>` +
      `<div class="rej">${this.o.items.map(it => `<div class="it arch"><div class="mini">${logoOIcono(it, 78)}</div><div class="nm">${it.nombre}</div></div>`).join('')}` +
      `<div class="it slot"><div class="mini"><i class="hl"></i><span class="dr">${icon('arrowDown', 40, 2.2)}</span><span class="dr">${this.o.textoHueco}</span></div><div class="nm"><span class="vn">${this.o.hueco}</span></div></div></div>` +
      `<div class="pie"><span class="p1">${elems(n)}</span><span class="p2">${elems(n + 1)}</span></div>` });
    this.mini = this.el.querySelector('.slot .mini'); this.hl = this.el.querySelector('.slot .hl'); this.dr = [...this.el.querySelectorAll('.slot .dr')];
    this.vn = this.el.querySelector('.vn'); this.p1 = this.el.querySelector('.p1'); this.p2 = this.el.querySelector('.p2');
    sonar(o, this.o.t0 + .2, 'aire', .7, .45);
  }
  hueco(x, y, s = 1) {                                   // la ventana plana (rx = ry = 0) centrada en (x, y) a escala s
    const m = this.mini;
    return { x: x + (m.offsetLeft + m.offsetWidth / 2 - this.el.offsetWidth / 2) * s, y: y + (m.offsetTop + m.offsetHeight / 2 - this.el.offsetHeight / 2) * s, s: m.offsetWidth * s / CONFIG.ancho };
  }
  pintar(t, k = {}) {
    const { t0, tSuelta } = this.o, pe = P(t, t0, .5, E.out4);
    if (pe <= 0 || (k.o ?? 1) <= .002) { off(this.el); return; }
    const sobre = P(t, tSuelta - .35, .25) * (1 - P(t, tSuelta, .12)), suelta = t >= tSuelta;
    this.hl.style.opacity = sobre.toFixed(3);
    this.dr.forEach(d => { d.style.opacity = suelta ? 0 : 1; });
    this.mini.style.borderColor = suelta ? 'transparent' : '';
    const pn = P(t, tSuelta + .04, .3, E.out4);
    this.vn.style.opacity = pn.toFixed(3); this.vn.style.transform = `translateY(${((1 - pn) * 8).toFixed(1)}px)`;
    this.p1.style.opacity = suelta ? 0 : 1; this.p2.style.opacity = suelta ? 1 : 0;
    put(this.el, { x: (k.x ?? 1380) + (1 - pe) * 140, y: k.y ?? 560, s: (k.s ?? 1) * lerp(.94, 1, pe), o: clamp(pe * 2) * (k.o ?? 1), b: (1 - pe) * 10 + (k.b || 0) });
  }
}

/* ---------- arrastrar y soltar con un cursor (la grabación en ficha hasta el hueco de un Explorador) ----------
   const arr = new Arrastre({ tEntra, tAgarra, tSuelta, desde: { x, y, s }, agarre: { x: 150, y: 70 }, cursorDesde: { x, y } })
   arr.pos(t, hasta) → { x, y, s, r, rx, ry } del objeto mientras se arrastra (de tAgarra a tSuelta, en arco y girando;
   antes de tAgarra, píntalo con sus propios fotogramas clave en «desde»). arr.pintar(t, obj): el cursor entra, agarra
   (clic con onda), arrastra, suelta (clic) y se va. Suena: clic al agarrar; clic + golpe corto al soltar. */
class Arrastre {
  constructor(o = {}) {
    this.o = { tEntra: 0, tAgarra: .3, tSuelta: .9, desde: { x: 560, y: 410, s: .46 }, agarre: { x: 150, y: 70 }, cursorDesde: { x: 1180, y: 1010 }, padre: WORLDF, ...o };
    this.cur = mk('div', 'L cursor2 z8', this.o.padre, `<svg viewBox="0 0 24 24" width="52" height="52"><path d="M4 2.5 20 12l-7.2 1.6L9 21z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>`);
    this.onda = mk('div', 'L onda2 z8', this.o.padre); this.onda.style.width = this.onda.style.height = '64px';
    sonar(o, this.o.tAgarra, 'click', .9); sonar(o, this.o.tSuelta, 'click', .9); sonar(o, this.o.tSuelta + .02, 'golpe-corto', .7);
  }
  pos(t, hasta, base = {}) {
    const { tAgarra, tSuelta, desde: d } = this.o, pd = P(t, tAgarra, tSuelta - .06 - tAgarra, E.io3);
    return { x: lerp(d.x, hasta.x, pd), y: lerp(d.y, hasta.y, pd) - 60 * Math.sin(Math.PI * pd), s: lerp(d.s, hasta.s, pd) * (1 + .06 * bump(t, tSuelta - .04, .26)),
      rx: lerp(base.rx ?? 4, 0, pd), ry: lerp(base.ry ?? 10, 0, pd), r: -7 * Math.sin(Math.PI * pd), o: base.o ?? 1, esc: lerp(1, hasta.s / d.s, pd) };
  }
  pintar(t, obj) {
    const { tEntra, tAgarra, tSuelta, desde: d, agarre: ag, cursorDesde: c0 } = this.o;
    const pc = P(t, tEntra, .3), ps = P(t, tSuelta + .12, .35, E.in2);
    if (pc <= 0 || ps >= 1) { off(this.cur); off(this.onda); return; }
    let cx, cy;
    if (t < tAgarra || !obj) { const pa = P(t, tEntra, tAgarra - tEntra, E.io3); cx = lerp(c0.x, d.x + ag.x, pa); cy = lerp(c0.y, d.y + ag.y, pa); }
    else { cx = obj.x + ag.x * obj.esc; cy = obj.y + ag.y * obj.esc; }
    cx += ps * 120; cy += ps * 150;
    const clic = [tAgarra, tSuelta].find(c => t >= c && t < c + .45);
    put(this.cur, { x: cx, y: cy, ax: 18, ay: 10, s: 1 - .14 * (clic != null ? bump(t, clic, .18) : 0), o: clamp(pc * 2) * (1 - ps) });
    if (clic != null) { const k = clamp((t - clic) / .45); put(this.onda, { x: cx, y: cy, s: lerp(.3, 1.7, E.out3(k)), o: (1 - k) * .9 }); } else off(this.onda);
  }
}

/* ---------- revelado con haces de luz (el de Claude en «editado por IA»; distinto del Revelado con anillos y confeti,
   que recuerda al vídeo de referencia) ----------
   new RevelarHaces({ logo: 'claude', nombre: 'Claude Opus <b>5.5</b>', sub: 'ANTHROPIC', t0 (golpe), tSale (el logo sale
                      girando de «desde» y vuela al centro con estela), desde: { x, y } | tt => ({ x, y }), rgb, c2, t1 })
   pintar(t). En t0 estalla en haces de luz y el nombre se barre con un filo de luz; la versión (<b>) en c2. Pantalla
   completa (fondo: 1). Suena: swell que termina en t0, golpe grave, brillo y un barrido suave con el nombre. */
class RevelarHaces {
  constructor(o = {}) {
    this.o = { logo: null, icono: null, nombre: '', sub: '', t0: 1, tSale: null, desde: null, rgb: ACENTO_RGB, c2: '#E8906F', x: CX, y: CY - 140, yNombre: CY + 150, tam: 280, t1: 1e9, padre: null, ...o };
    if (this.o.tSale == null) this.o.tSale = this.o.t0 - .2;
    const P0 = this.o.padre, r = this.o.rgb;
    this.bloom = mk('div', 'L rev-bloom z2', P0); this.bloom.style.setProperty('--rgb', r);
    this.cv = mk('canvas', 'L z3', P0); this.cv.width = CONFIG.ancho; this.cv.height = CONFIG.alto; this.cv.style.width = CONFIG.ancho + 'px'; this.cv.style.height = CONFIG.alto + 'px';
    const lg = () => this.o.logo ? logo(this.o.logo, this.o.tam) : icon(this.o.icono || 'sparkles', this.o.tam, 1.6);
    this.lg = mk('div', 'L z6', P0, lg());
    this.estela = [1, 2, 3, 4].map(() => mk('div', 'L z5', P0, lg()));
    this.nm = mk('div', 'L rev-nm z6', P0, this.o.nombre); this.nm.style.setProperty('--c2', this.o.c2);
    this.filo = mk('div', 'L rev-filo z7', P0); this.filo.style.setProperty('--rgb', r);
    this.eb = mk('div', 'L rev-eb z6', P0, this.o.sub);
    let s = 777; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    this.haces = Array.from({ length: 46 }, (_, i) => ({ a: i / 46 * 6.2832 + rnd() * .12, l: .35 + rnd() * .9, w: 1.2 + rnd() * 2.8, d: rnd() * .12, col: rnd() < .7 ? r : '255,236,225' }));
    this.nmW = null;
    const t0 = this.o.t0;
    sonar(o, t0, 'swell', .8); sonar(o, t0, 'golpe-grave', 1); sonar(o, t0 + .06, 'brillo', .7); sonar(o, t0 + .44, 'barrido', .4);
  }
  pintar(t, { o = 1 } = {}) {
    const { t0, tSale, t1, x: X, y: Y, yNombre } = this.o, todo = [this.bloom, this.cv, this.lg, ...this.estela, this.nm, this.filo, this.eb];
    if (t < tSale - .02 || t >= t1 || o <= .002) { todo.forEach(off); return; }
    if (this.nmW == null) this.nmW = this.nm.offsetWidth;
    const d = t - t0, desde = tt => typeof this.o.desde === 'function' ? this.o.desde(tt) : (this.o.desde || { x: X, y: Y });
    const pos = tt => { const p = P(tt, tSale, t0 - tSale + .02, E.io3), f = desde(tt); return { x: lerp(f.x, X, p), y: lerp(f.y, Y, p) - 90 * Math.sin(Math.PI * p), s: lerp(.16, 1, E.out3(p)) }; };
    const rot = tt => -210 * (1 - P(tt, tSale, .75, E.out4)) + 7 * Math.max(0, tt - t0);
    const k = pos(t);
    put(this.lg, { x: k.x, y: k.y, s: k.s * (1 + .07 * bump(t, t0, .32)), r: rot(t), o: clamp((t - tSale) / .08) });
    this.estela.forEach((e, i) => { const tt = t - (i + 1) * .028, ke = pos(tt), vis = t < t0 + .1 ? .32 / (i + 1) : 0;
      put(e, { x: ke.x, y: ke.y, s: ke.s, r: rot(tt), o: vis * clamp((tt - tSale) / .05), b: 3 + i * 3 }); });
    const fl = flash(t, t0, .06, 1.6);
    put(this.bloom, { x: X, y: Y, s: .5 + .5 * P(t, t0 - .1, .6, E.out3), o: clamp(.25 * P(t, tSale, .2) + .75 * fl) });
    const x = this.cv.getContext('2d'); x.clearRect(0, 0, CONFIG.ancho, CONFIG.alto);
    if (d > 0 && d < 1.6) {
      x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
      for (const h of this.haces) {
        const dd = d - h.d; if (dd <= 0) continue;
        const r1 = 150 + (380 + 1250 * h.l) * E.out3(Math.min(1, dd / .75)), r0 = 150 + 1000 * E.out3(clamp((dd - .12) / 1.1));
        if (r1 - r0 < 4) continue;
        const a = clamp(1 - dd / 1.45), ca = Math.cos(h.a), sa = Math.sin(h.a);
        const g = x.createLinearGradient(X + ca * r0, Y + sa * r0, X + ca * r1, Y + sa * r1);
        g.addColorStop(0, `rgba(${h.col},0)`); g.addColorStop(.7, `rgba(${h.col},${(.85 * a).toFixed(3)})`); g.addColorStop(1, `rgba(${h.col},0)`);
        x.strokeStyle = g; x.lineWidth = h.w; x.beginPath(); x.moveTo(X + ca * r0, Y + sa * r0); x.lineTo(X + ca * r1, Y + sa * r1); x.stroke();
      }
      x.globalCompositeOperation = 'source-over';
      put(this.cv, { x: CX, y: CY, o: 1 });
    } else off(this.cv);
    const pw = P(t, t0 + .08, .62, E.io3);
    if (pw <= 0) { off(this.nm); off(this.filo); }
    else {
      this.nm.style.clipPath = `inset(-30px ${((1 - pw) * 100).toFixed(2)}% -30px 0)`;
      put(this.nm, { x: X, y: yNombre, o: 1 });
      put(this.filo, { x: X - this.nmW / 2 + pw * this.nmW, y: yNombre, o: pw < 1 ? clamp(pw * 6) : 1 - clamp((t - (t0 + .7)) / .25), sy: 1 + .15 * Math.sin(t * 40) });
    }
    const pe = P(t, t0 + .75, .45, E.out3);
    if (this.o.sub) put(this.eb, { x: X, y: yNombre + 110 + (1 - pe) * 14, o: pe }); else off(this.eb);
  }
}

/* ---------- ruta vertical de pasos («te voy a explicar paso a paso») ----------
   new RutaPasos([{ t0, icono | logo, titulo, sub }], { titulo: 'PASO A PASO', entra, sal,
                  destacar: { t, i, etiqueta: 'DE REGALO', icono: 'gift', pulsos: [t...] } })
   pintar(t, { x, y, rx, ry, o }). Cada nodo se enciende al decirlo y la línea de luz baja al siguiente; con destacar,
   en t se vuelve a encender el paso i con una etiqueta. Deja la ruta completa ≥ 2 s antes de «sal» (Josema: «ocurre
   demasiado rápido y no es posible verla»). Suena: tick por paso; nota al destacar. */
class RutaPasos {
  constructor(pasos, o = {}) {
    this.p = pasos; this.o = { titulo: 'PASO A PASO', entra: null, sal: null, destacar: null, padre: WORLD, z: 'z5', ...o };
    const n = pasos.length, H = 170, de = this.o.destacar;
    this.via = (n - 1) * H;
    this.el = mk('div', `L ruta4 ${this.o.z}`, this.o.padre,
      `<div class="eb"><i></i>${this.o.titulo}</div><div class="via" style="height:${this.via}px"><div class="ll"></div><div class="pt"></div></div>` +
      pasos.map((p, i) => `<div class="nd" style="top:${104 + i * H}px">${p.logo ? logo(p.logo, 56) : icon(p.icono || 'circleCheck', 50, 2)}<i class="hi"></i><span class="n">${i + 1}</span></div>` +
        `<div class="tx" style="top:${116 + i * H}px"><div class="t1">${p.titulo}</div><div class="t2">${p.sub || ''}</div></div>`).join('') +
      (de ? `<div class="reg">${icon(de.icono || 'gift', 22, 2.2)}${de.etiqueta || ''}</div>` : ''));
    this.el.style.height = (104 + (n - 1) * H + 146) + 'px';
    const q = s => this.el.querySelector(s), qa = s => [...this.el.querySelectorAll(s)];
    this.eb = q('.eb'); this.ll = q('.ll'); this.pt = q('.pt'); this.nd = qa('.nd'); this.hi = qa('.nd .hi'); this.tx = qa('.tx'); this.reg = q('.reg');
    this.regPos = null;
    pasos.forEach(p => sonar(o, p.t0, 'tick', .8));
    if (de) sonar(o, de.t - .04, 'nota', .8);
  }
  pintar(t, k = {}) {
    const P0 = this.p, n = P0.length, de = this.o.destacar;
    const pr = P(t, this.o.entra ?? P0[0].t0 - .9, .5, E.out4), q = this.o.sal != null ? P(t, this.o.sal, .3, E.in3) : 0;
    if (pr <= 0 || q >= 1 || (k.o ?? 1) <= .002) { off(this.el); return; }
    if (de && !this.regPos) { const t2 = this.tx[de.i].querySelector('.t2'); this.regPos = { left: 156 + t2.offsetWidth + 18, top: 116 + de.i * 170 + t2.offsetTop - 6 }; this.reg.style.left = this.regPos.left + 'px'; this.reg.style.top = this.regPos.top + 'px'; }
    const peb = P(t, P0[0].t0 - .3, .4, E.out4);
    this.eb.style.opacity = peb.toFixed(3); this.eb.style.transform = `translateX(${((1 - peb) * -24).toFixed(1)}px)`;
    let act = -1;
    P0.forEach((p, i) => {
      const pn = P(t, p.t0, .42, E.back), pt = P(t, p.t0 + .04, .38, E.out4);
      if (t >= p.t0) act = i;
      let s = lerp(.4, 1, pn);
      if (de && i === de.i) s *= 1 + .1 * bump(t, de.t - .04, .32) + (de.pulsos || []).reduce((a, tp) => a + .08 * bump(t, tp, .3), 0);
      this.nd[i].style.opacity = clamp(pn * 2.5).toFixed(3); this.nd[i].style.transform = `scale(${s.toFixed(3)})`;
      this.tx[i].style.opacity = clamp(pt * 2).toFixed(3); this.tx[i].style.transform = `translateX(${((1 - pt) * -30).toFixed(1)}px)`;
      this.tx[i].style.filter = pt < 1 ? `blur(${((1 - pt) * 8).toFixed(1)}px)` : 'none';
    });
    if (de && t >= de.t - .04) act = de.i;
    P0.forEach((p, i) => { this.hi[i].style.opacity = (i === act ? 1 : t >= p.t0 ? .35 : 0).toFixed(3); });
    if (de) { const pg = P(t, de.t - .04, .42, E.back); this.reg.style.opacity = clamp(pg * 2).toFixed(3); this.reg.style.transform = `scale(${lerp(.5, 1, pg).toFixed(3)})`; }
    let lp = 0;                                            // línea de luz: baja de un nodo al siguiente entre sus palabras
    for (let i = 0; i < n - 1; i++) lp += E.io3(clamp((t - P0[i].t0) / (P0[i + 1].t0 - P0[i].t0))) / (n - 1);
    this.ll.style.transform = `scaleY(${Math.max(.001, lp).toFixed(4)})`;
    this.pt.style.top = (lp * this.via).toFixed(1) + 'px'; this.pt.style.opacity = t > P0[0].t0 && lp < .999 ? 1 : 0;
    put(this.el, { x: (k.x ?? 1340) + (1 - pr) * 90 + q * 220, y: k.y ?? 540, rx: k.rx ?? 3, ry: k.ry ?? -9, o: pr * (1 - q) * (k.o ?? 1), b: (1 - pr) * 8 + q * 10 });
  }
}

/* ---------- tarjeta de algo que se regala y se instala («te regalaré la skill para que la puedas montar hoy mismo») ----------
   new TarjetaRegalo({ icono: 'gift', etiqueta: 'DE REGALO', nombre: 'Skill', id: 'animaciones-horizontal-combinadas', archivos: ['SKILL.md', ...],
                       t0, tInstala, tLista, textoInstala: 'Instalando…', textoLista: '✓ Lista, hoy mismo', sal })
   pintar(t, { x, y, rx, ry }). Junto a su cara. La barra se llena de tInstala a tLista (sin cifras intermedias). Mejor
   corta (~3 s) que larga. Suena: aire al entrar, aire al instalar, dos notas al quedar lista. */
class TarjetaRegalo {
  constructor(o = {}) {
    this.o = { icono: 'gift', etiqueta: 'DE REGALO', nombre: '', id: '', archivos: [], t0: 0, tInstala: null, tLista: null, textoInstala: 'Instalando…', textoLista: '✓ Lista',
      sal: null, ancho: 620, padre: WORLDF, z: 'z6', ...o };
    this.el = panel({ w: this.o.ancho, clase: 'skc', padre: this.o.padre, z: this.o.z, html:
      `<div class="top"><div class="ic">${icon(this.o.icono, 46, 2)}</div><span class="eb">${this.o.etiqueta}</span></div>` +
      `<div class="nm">${this.o.nombre}</div>` + (this.o.id ? `<div class="id">${this.o.id}</div>` : '') +
      (this.o.archivos.length ? `<div class="fs">${this.o.archivos.map(f => `<span>${f}</span>`).join('')}</div>` : '') +
      (this.o.tInstala != null ? `<div class="pis"><div class="bar"></div></div><div class="est"><span class="a">${this.o.textoInstala}</span><span class="b">${this.o.textoLista}</span></div>` : '') });
    const q = s => this.el.querySelector(s);
    this.ic = q('.ic'); this.nm = q('.nm'); this.fs = [...this.el.querySelectorAll('.fs span')]; this.pis = q('.pis'); this.bar = q('.bar'); this.a = q('.est .a'); this.b = q('.est .b');
    sonar(o, this.o.t0 + .3, 'aire', .7, .4);
    if (this.o.tInstala != null) sonar(o, this.o.tInstala - .04, 'aire', .5);
    if (this.o.tLista != null) sonar(o, this.o.tLista - .02, 'nota-doble', .9);
    if (this.o.sal != null) sonar(o, this.o.sal, 'aire-salida', .6);
  }
  pintar(t, k = {}) {
    const { t0, tInstala, tLista, sal } = this.o, p = P(t, t0, .55, E.out4), q = sal != null ? P(t, sal, .35, E.in3) : 0;
    if (p <= 0 || q >= 1) { off(this.el); return; }
    const b = bump(t, t0 + .2, .35);
    this.ic.style.transform = `scale(${(1 + .14 * b).toFixed(3)}) rotate(${(-9 * b).toFixed(2)}deg)`;
    slam(this.nm, t, t0 + .12, 1.35);
    this.fs.forEach((f, i) => rise(f, t, t0 + .35 + i * .1));
    if (this.pis) {
      const pb = P(t, tInstala - .04, tLista - tInstala + .02, E.io3), hecho = t >= tLista - .02;
      this.pis.style.opacity = P(t, tInstala - .3, .25).toFixed(3);
      this.bar.style.width = (pb * 100).toFixed(2) + '%'; this.bar.style.background = hecho ? '#3ddc84' : '';
      this.a.style.opacity = hecho ? 0 : P(t, tInstala - .15, .25).toFixed(3);
      const pf = P(t, tLista - .02, .35, E.back);
      this.b.style.opacity = clamp(pf * 2).toFixed(3); this.b.style.transform = `scale(${lerp(.7, 1, pf).toFixed(3)})`;
    }
    put(this.el, { x: (k.x ?? 1490) + (1 - p) * 120 + q * 60, y: (k.y ?? 440) + 7 * Math.sin(t * 1.2), s: lerp(.9, 1, p) * (1 + .025 * (tLista != null ? bump(t, tLista, .3) : 0)),
      rx: k.rx ?? 5, ry: k.ry ?? -13, o: clamp(p * 2) * (1 - q), b: (1 - p) * 10 + q * 8 });
  }
}

/* =====================================================================
   Piezas del reel «editado por IA» en vertical (30/09/2026): LineaBruto · Comentario
   ===================================================================== */
/* minutos:segundos redondeados (duraciones de una toma o de un montaje) */
const mmss = s => { const r = Math.max(0, Math.round(s)); return `${Math.floor(r / 60)}:${pad2(r % 60)}`; };
css(`
.tbru{padding:24px 30px 26px}
.tbru .cab{display:flex;align-items:center;gap:14px;font:600 22px var(--mono);letter-spacing:.16em;color:#aab3c5;height:56px}
.tbru .cab svg{color:var(--acento)}
.tbru .tit{position:relative;height:30px;width:230px;flex:none}
.tbru .tit span{position:absolute;left:0;top:0;white-space:nowrap}
.tbru .tit .b{color:var(--acento)}
.tbru .quien{display:flex;align-items:center;gap:10px;height:44px;padding:0 18px 0 10px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);
  font:700 22px var(--sans);letter-spacing:.01em;color:#eef1f7;white-space:nowrap;transform-origin:0 50%}
.tbru .cnt{margin-left:auto;font:800 56px/1 var(--sans);letter-spacing:-.01em;color:#fff;font-variant-numeric:tabular-nums}
.tbru .zona{position:relative;margin-top:74px}
.tbru .pista{position:relative;height:76px;border-radius:14px;background:#0a0e14;border:1px solid rgba(255,255,255,.08);overflow:hidden}
.tbru .clip{position:absolute;top:13px;height:48px;border-radius:7px;background:linear-gradient(180deg,#6d93ff,var(--acento));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 0 14px rgba(var(--acento-rgb),.45)}
.tbru .pau{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(90deg,rgba(245,182,74,.6) 0 3px,rgba(245,182,74,.14) 3px 8px)}
.tbru .ph{position:absolute;top:-6px;height:88px;width:3px;margin-left:-1.5px;border-radius:2px;background:#fff;box-shadow:0 0 14px rgba(255,255,255,.85)}
.tbru .tij{position:absolute;bottom:0;display:flex;flex-direction:column;align-items:center;gap:6px;transform-origin:50% 100%}
.tbru .tij b{display:flex;align-items:center;gap:8px;height:42px;padding:0 16px;border-radius:999px;background:var(--acento);color:var(--sobre-acento);
  font:700 21px var(--mono);letter-spacing:.1em;white-space:nowrap;box-shadow:0 10px 26px -8px rgba(var(--acento-rgb),.9)}
.tbru .tij i{display:block;width:4px;height:112px;border-radius:2px;background:var(--acento);box-shadow:0 0 16px rgba(var(--acento-rgb),.9)}
.tbru .pie{position:relative;height:46px;margin-top:18px}
.tbru .pie span{position:absolute;left:50%;top:0;display:flex;align-items:center;gap:10px;height:46px;padding:0 20px;border-radius:999px;font:700 22px var(--mono);
  letter-spacing:.1em;white-space:nowrap;background:rgba(245,182,74,.14);border:1px solid rgba(245,182,74,.6);color:#f5b64a}
.coment{padding:26px 30px 28px}
.coment .cab{display:flex;align-items:center;gap:12px;font:600 26px var(--mono);letter-spacing:.22em;color:var(--acento)}
.coment .caja{display:flex;align-items:center;gap:20px;margin-top:20px;height:128px;padding:0 18px 0 22px;border-radius:28px;background:#0a0e14;border:2px solid rgba(255,255,255,.14)}
.coment .av{width:74px;height:74px;flex:none;border-radius:50%;background:linear-gradient(135deg,#6d93ff,var(--acento));display:flex;align-items:center;justify-content:center;color:#fff}
.coment .tx{position:relative;flex:1;height:100%;display:flex;align-items:center;min-width:0}
.coment .tx .w{font:800 86px/1 var(--sans);letter-spacing:.02em;color:#fff;white-space:nowrap}
.coment .tx .ph{position:absolute;left:0;top:50%;transform:translateY(-50%);font:500 34px var(--sans);color:#6b7486;white-space:nowrap}
.coment .tx .car{display:inline-block;width:6px;height:70px;margin-left:8px;border-radius:3px;background:var(--acento)}
.coment .env{width:86px;height:86px;flex:none;border-radius:50%;background:var(--acento);color:var(--sobre-acento);display:flex;align-items:center;justify-content:center;
  box-shadow:0 12px 30px -10px rgba(var(--acento-rgb),.9)}
.coment .ok{position:relative;height:58px;margin-top:22px}
.coment .ok span{position:absolute;left:50%;top:0;display:flex;align-items:center;gap:10px;height:58px;padding:0 26px;border-radius:999px;background:rgba(61,220,132,.12);
  border:1px solid rgba(61,220,132,.55);color:#3ddc84;font:700 31px var(--sans);white-space:nowrap}
`);

/* ---------- la toma en bruto como línea de tiempo («me he grabado en bruto, con mis pausas» → «ha quitado los silencios») ----------
   new LineaBruto({ bloques: [[a, b], ...] (s de la toma que se quedan, de edicion/cortes.json), total (s de la toma), final (s del montaje),
                    t0, tPausas (las pausas se marcan en ámbar, con su duración total), tLogo + logo + quien (quién edita, en la cabecera),
                    tJuntar (las pausas desaparecen, los trozos se juntan y el contador baja al montaje), tExpandir (lo que queda se
                    estira a lo ancho: ya es la línea de tiempo del propio vídeo, con el cabezal en el instante que se ve),
                    cortes: [{ t, i }] (tijera en la unión del trozo i con el anterior), sal, ancho, antes, despues })
   pintar(t, { x, y, s, rx, ry, o }). Todo con los datos reales. Suena: aire al entrar, tick al marcar las pausas, transición
   al juntar y corte en cada tijera. */
class LineaBruto {
  constructor(o = {}) {
    this.o = { bloques: [], total: 1, final: 1, t0: 0, tPausas: null, tLogo: null, logo: null, quien: '', tJuntar: 1e9, tExpandir: null,
      cortes: [], sal: null, ancho: 880, antes: 'TOMA EN BRUTO', despues: 'SIN PAUSAS', padre: WORLDF, z: 'z6', ...o };
    const O = this.o;
    this.el = panel({ w: O.ancho, clase: 'tbru', padre: O.padre, z: O.z, html:
      `<div class="cab">${icon('film', 28, 2)}<span class="tit"><span class="a">${O.antes}</span><span class="b">${O.despues}</span></span>` +
      (O.logo ? `<span class="quien">${logo(O.logo, 30)}<span>${O.quien}</span></span>` : '') + `<span class="cnt"></span></div>` +
      `<div class="zona"><div class="pista">${O.bloques.map(() => '<i class="pau"></i>').join('')}<i class="pau"></i>${O.bloques.map(() => '<i class="clip"></i>').join('')}</div>` +
      `<i class="ph"></i>${O.cortes.map(() => `<div class="tij"><b>${icon('scissors', 22, 2.2)}CORTE</b><i></i></div>`).join('')}</div>` +
      `<div class="pie"><span>${icon('hourglass', 20, 2.2)}${mmss(O.total - O.bloques.reduce((a, [x, y]) => a + y - x, 0))} DE PAUSAS</span></div>` });
    const q = s => this.el.querySelector(s), qa = s => [...this.el.querySelectorAll(s)];
    this.ta = q('.tit .a'); this.tb = q('.tit .b'); this.qn = q('.quien'); this.cnt = q('.cnt'); this.pista = q('.pista');
    this.clips = qa('.clip'); this.paus = qa('.pau'); this.ph = q('.ph'); this.tij = qa('.tij'); this.pie = q('.pie span');
    this.W = O.ancho - 60;                                   // ancho de la pista (el panel tiene 30 px de margen a cada lado)
    sonar(o, O.t0 + .1, 'aire', .6); sonar(o, O.tPausas, 'tick', .7); sonar(o, O.tJuntar + .1, 'transicion', .7);
    O.cortes.forEach(c => sonar(o, c.t, 'corte', .8));
    if (O.sal != null) sonar(o, O.sal, 'aire-salida', .5);
  }
  pintar(t, k = {}) {
    const O = this.o, pe = P(t, O.t0, .5, E.out4), q = O.sal != null ? P(t, O.sal, .35, E.in3) : 0;
    if (pe <= 0 || q >= 1 || (k.o ?? 1) <= .002) { off(this.el); return; }
    const W = this.W, j = P(t, O.tJuntar, .9, E.io3), ex = O.tExpandir != null ? P(t, O.tExpandir, .6, E.io3) : 0;
    const marca = O.tPausas != null ? P(t, O.tPausas, .3) : 0;
    let acum = 0, fin = 0;
    const pos = O.bloques.map(([a, b]) => {
      const d = b - a, xr = a / O.total * W, xc = acum / O.total * W, xf = acum / O.final * W; acum += d;
      return { x: lerp(lerp(xr, xc, j), xf, ex), w: lerp(d / O.total * W, d / O.final * W, ex) };
    });
    pos.forEach((p, i) => { const c = this.clips[i]; c.style.left = p.x.toFixed(1) + 'px'; c.style.width = Math.max(2, p.w - 2).toFixed(1) + 'px'; });
    // pausas: lo que queda entre los trozos (y al final de la toma); desaparecen al juntar
    this.paus.forEach((e, i) => {
      const x0 = i === 0 ? 0 : pos[i - 1].x + pos[i - 1].w, x1 = i < pos.length ? pos[i].x : lerp(W, pos[pos.length - 1].x + pos[pos.length - 1].w, j);
      e.style.left = x0.toFixed(1) + 'px'; e.style.width = Math.max(0, x1 - x0).toFixed(1) + 'px'; e.style.opacity = (marca * (1 - j)).toFixed(3);
    });
    const ca = 1 - P(t, O.tJuntar, .35), cb = P(t, O.tJuntar + .55, .35);
    this.ta.style.opacity = ca.toFixed(3); this.tb.style.opacity = cb.toFixed(3);
    this.cnt.textContent = mmss(lerp(O.total, O.final, j));
    this.cnt.style.color = j >= 1 ? 'var(--acento)' : '';
    if (this.qn) { const pl = O.tLogo != null ? P(t, O.tLogo, .4, E.back) : 0; this.qn.style.opacity = clamp(pl * 2).toFixed(3); this.qn.style.transform = `scale(${lerp(.5, 1, pl).toFixed(3)})`; }
    const pp = marca * (1 - P(t, O.tJuntar, .3));
    this.pie.style.opacity = pp.toFixed(3); this.pie.style.transform = `translateX(-50%) translateY(${((1 - marca) * 10).toFixed(1)}px)`;
    // cabezal: con la línea ya estirada es el propio vídeo, así que marca el instante que se está viendo
    this.ph.style.opacity = ex.toFixed(3); this.ph.style.left = (clamp(t / O.final) * W).toFixed(1) + 'px';
    O.cortes.forEach((c, n) => {
      const e = this.tij[n], pc = P(t, c.t, .45, E.back), xi = pos[c.i] ? pos[c.i].x : 0;
      e.style.left = (xi - 1).toFixed(1) + 'px'; e.style.opacity = clamp(pc * 2).toFixed(3);
      e.style.transform = `translateX(-50%) scale(${lerp(.4, 1, pc).toFixed(3)})`;
    });
    put(this.el, { x: k.x ?? CX, y: (k.y ?? 1240) + (1 - pe) * 40 + q * 30, s: (k.s ?? 1) * lerp(.94, 1, pe), rx: k.rx ?? 6, ry: k.ry ?? 0,
      o: clamp(pe * 2) * (1 - q) * (k.o ?? 1), b: (1 - pe) * 8 + q * 8 });
  }
}

/* ---------- caja de comentario que se escribe sola (la llamada a comentar: «comenta EDICIÓN y te la envío») ----------
   new Comentario({ palabra: 'EDICIÓN', etiqueta: 'COMENTA', t0, tEscribe, tEnvia, textoEnviado: '✓ Te la envío', sal, ancho })
   pintar(t, { x, y, s, rx, ry, o }). Una letra cada 0,08 s desde tEscribe; en tEnvia se pulsa enviar y sale el aviso verde.
   Suena: aire al entrar, tecla por letra, clic y nota doble al enviar. */
class Comentario {
  constructor(o = {}) {
    this.o = { palabra: 'EDICIÓN', etiqueta: 'COMENTA', marcador: 'Añade un comentario…', t0: 0, tEscribe: 1, tEnvia: null, textoEnviado: '✓ Te la envío',
      sal: null, ancho: 860, padre: WORLDF, z: 'z7', ...o };
    const O = this.o;
    this.el = panel({ w: O.ancho, clase: 'coment', padre: O.padre, z: O.z, html:
      `<div class="cab">${icon('messageSquare', 30, 2)}<span>${O.etiqueta}</span></div>` +
      `<div class="caja"><div class="av">${icon('users', 34, 2)}</div><div class="tx"><span class="w"></span><span class="car"></span><span class="ph">${O.marcador}</span></div>` +
      `<div class="env">${icon('send', 38, 2.2)}</div></div>` + (O.tEnvia != null ? `<div class="ok"><span>${O.textoEnviado}</span></div>` : '') });
    const q = s => this.el.querySelector(s);
    this.w = q('.tx .w'); this.car = q('.tx .car'); this.ph = q('.tx .ph'); this.env = q('.env'); this.ok = q('.ok span'); this.caja = q('.caja');
    sonar(o, O.t0 + .1, 'aire', .7);
    [...O.palabra].forEach((_, i) => sonar(o, O.tEscribe + i * .08, 'tecla', .55));
    if (O.tEnvia != null) { sonar(o, O.tEnvia, 'click', .9); sonar(o, O.tEnvia + .06, 'nota-doble', .85); }
    if (O.sal != null) sonar(o, O.sal, 'aire-salida', .5);
  }
  pintar(t, k = {}) {
    const O = this.o, pe = P(t, O.t0, .5, E.out4), q = O.sal != null ? P(t, O.sal, .35, E.in3) : 0;
    if (pe <= 0 || q >= 1 || (k.o ?? 1) <= .002) { off(this.el); return; }
    const n = t < O.tEscribe ? 0 : Math.min(O.palabra.length, Math.floor((t - O.tEscribe) / .08 + 1e-6) + 1), hecho = n >= O.palabra.length;
    this.w.textContent = O.palabra.slice(0, n);
    this.ph.style.opacity = n ? 0 : 1;
    this.car.style.display = n ? 'inline-block' : 'none';
    const fin = O.tEscribe + O.palabra.length * .08;
    this.car.style.opacity = (1 - P(t, fin + .15, .3)).toFixed(3);
    const brillo = hecho ? P(t, fin, .3, E.out3) : 0;
    this.caja.style.borderColor = hecho ? `rgba(var(--acento-rgb),${(.5 + .5 * brillo).toFixed(3)})` : '';
    this.caja.style.boxShadow = hecho ? `0 0 ${(40 * brillo).toFixed(1)}px rgba(var(--acento-rgb),.55)` : 'none';
    if (O.tEnvia != null) {
      const pb = bump(t, O.tEnvia, .28), po = P(t, O.tEnvia + .05, .4, E.back);
      this.env.style.transform = `scale(${(1 - .16 * pb).toFixed(3)})`;
      this.ok.style.opacity = clamp(po * 2).toFixed(3); this.ok.style.transform = `translateX(-50%) scale(${lerp(.6, 1, po).toFixed(3)})`;
    }
    put(this.el, { x: k.x ?? CX, y: (k.y ?? 1240) + (1 - pe) * 50 + q * 30, s: (k.s ?? 1) * lerp(.92, 1, pe) * (1 + .02 * (hecho ? bump(t, fin, .3) : 0)),
      rx: k.rx ?? 6, ry: k.ry ?? 0, o: clamp(pe * 2) * (1 - q) * (k.o ?? 1), b: (1 - pe) * 8 + q * 8 });
  }
}
