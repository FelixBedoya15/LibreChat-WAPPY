'use strict';
/* =====================================================================
   motor/capas.js — la grabación como capa, el fondo espacio 3D, la ficha de vídeo y las transiciones.
   (references/capas-sobre-video.md). Se carga después del motor base de index.html y antes de las escenas.

   Capas del escenario, de abajo arriba:
     #capaVideo   la sala (la grabación sin pausas)          ┐ solo en los modos capas y combinado
     #fondo       fondo de la animación (color, rejilla, halos, espacio 3D): tapa la sala cuando fondo = 1
     #world       animación DETRÁS de la persona (mk por defecto)
     #capaPersona la persona recortada (+ halo)             ┘
     #worldF      animación DELANTE de la persona (mk(tag, cls, WORLDF))
     #vignette, #noise, #destello
   Transiciones: cuchilla (línea en diagonal) e iris (círculo que se abre desde su cara). Fondo del tema
   profundidad: Cortina (cortina de luz, por defecto) o Espacio (estrellas y suelo de rejilla: recuerda al vídeo de
   referencia, solo si Josema lo pide).
   Cada fotograma sale de edicion/capas/<alto>/v_NNNNNN.jpg (imagen) y m_NNNNNN.png (silueta en el alfa), que
   escribe «anim.py recortar». En el render se espera a que estén cargados; en la previsualización se pinta el más
   cercano que ya haya llegado.
   Formato vertical (reels: CONFIG 1080x1920, «anim.py nuevo --vertical»): la grabación horizontal se escala hasta
   ocupar el 88 % del alto, con su borde de abajo en el de la pantalla y centrada en la cara; el hueco de arriba se
   rellena estirando su primera fila (la pared de listones sigue). Lo ajusta montaje.json -> "vertical" (marcoVertical).
   ===================================================================== */

/* añade CSS a la página (las piezas de motor/ llevan su propio estilo) */
function css(txt) { const s = document.createElement('style'); s.textContent = txt; document.head.appendChild(s); }
css(`
.vficha{border-radius:0}
.vficha .vf-c{position:absolute;inset:0;width:100%;height:100%;display:block;box-shadow:0 60px 140px -40px rgba(0,0,0,.95)}
.vficha .vf-b{position:absolute;inset:-3px;border:3px solid rgba(var(--acento-rgb),.75);box-shadow:0 0 40px rgba(var(--acento-rgb),.35);pointer-events:none}
.vficha .vf-tags{position:absolute;left:44px;top:40px;display:flex;gap:18px;transform-origin:0 0}
.vficha .vf-tag{font:800 44px var(--sans);letter-spacing:.02em;padding:10px 22px;border-radius:14px;background:rgba(18,20,26,.8);color:#fff;border:1.5px solid rgba(255,255,255,.14)}
.vficha .vf-tag.a{background:var(--acento);color:var(--sobre-acento);border-color:transparent}
.vficha .vf-pie{position:absolute;left:0;right:0;top:calc(100% + 34px);text-align:center;font:600 46px var(--sans);color:#c9cfdb;transform-origin:50% 0;white-space:nowrap}
`);

/* ---------- color de acento (tema profundidad): --acento y --acento-rgb para CSS y ACENTO_RGB para JS ---------- */
const hexRgb = h => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h || '') || [0, '3e', '6e', 'f2']; return [1, 2, 3].map(i => parseInt(m[i], 16)); };
const ACENTO_RGB = hexRgb(ESTILO.acento).join(',');
document.documentElement.style.setProperty('--acento', ESTILO.acento || '#3E6EF2');
document.documentElement.style.setProperty('--acento-rgb', ACENTO_RGB);
/* texto sobre el acento: negro si el acento es claro (amarillo), blanco si es oscuro (azul) */
document.documentElement.style.setProperty('--sobre-acento', (([r, g, b]) => .2126 * r + .7152 * g + .0722 * b)(hexRgb(ESTILO.acento)) > 150 ? '#111' : '#fff');

/* ---------- estado de las capas ---------- */
const CAPAS = { on: false, alto: 720, w: 1280, h: 720, fps: 60, n: 0, saltos: [], fw: 1920, fh: 1080, hueco: 0,
  cache: new Map(), fCV: -1, fCP: -1, alCargar: null };
const VERTICAL = CONFIG.alto > CONFIG.ancho;
/* encuadre vertical: s (px del lienzo por px de la toma), x0 (dónde queda el borde izquierdo de la toma), y0 (su borde
   de arriba; lo de encima es el hueco que se rellena) y foco (la cara: los zooms se anclan ahí).
   montaje.json -> "vertical": { "alto": px que ocupa la toma en el lienzo, "cx": centro horizontal (px de la toma),
   "fy": altura de la cara (px de la toma) } */
function marcoVertical() {
  const v = VERT || {}, alto = v.alto ?? Math.round(CONFIG.alto * .878), s = alto / CAPAS.fh, cx = v.cx ?? CERCA.cx;
  const y0 = CONFIG.alto - alto, fy = v.fy ?? CAPAS.fh * .28;
  return { s, x0: CX - cx * s, y0, foco: { x: CX, y: y0 + fy * s } };
}
const CV = $('cv'), CP = $('cp');

async function cargarCapas() {
  if (!CONFIG.capas) return;
  const leer = u => fetch(u, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
  const info = await leer('edicion/capas/capas.json');
  if (!info || !info.altos || !info.altos.length) { console.error('capas: falta edicion/capas/capas.json (ejecuta «anim.py recortar»)'); return; }
  const pedido = +(Q.get('capas') || 0), altos = info.altos.slice().sort((a, b) => a - b);
  // render: la altura pedida (render.mjs --capas=2160); previsualización y revisión: la más pequeña (rápida)
  CAPAS.alto = pedido ? (altos.includes(pedido) ? pedido : (altos.find(h => h >= pedido) || altos[altos.length - 1])) : altos[0];
  if (pedido && CAPAS.alto !== pedido) console.error(`capas: no hay juego de ${pedido} px; uso ${CAPAS.alto} (anim.py recortar --alto ${pedido})`);
  [CAPAS.w, CAPAS.h] = info.tam[String(CAPAS.alto)];
  CAPAS.fps = info.fps; CAPAS.n = info.fotogramas; [CAPAS.fw, CAPAS.fh] = info.fuente;
  const cortes = await leer('edicion/cortes.json');
  CAPAS.saltos = cortes ? cortes.tramos.map(x => x.edit_f0) : [];
  if (VERTICAL) {                                         // el hueco de arriba, en px de la toma a esta altura
    const m = marcoVertical(); CAPAS.hueco = Math.round(m.y0 / m.s * CAPAS.h / CAPAS.fh);
    for (const c of [CV, CP]) { c.style.width = (CAPAS.fw * m.s).toFixed(2) + 'px'; c.style.height = CONFIG.alto + 'px'; }
  }
  for (const c of [CV, CP]) { c.width = CAPAS.w; c.height = CAPAS.h + CAPAS.hueco; }
  $('capaVideo').style.display = $('capaPersona').style.display = 'block';
  CAPAS.on = true;
}
const fotogramaEn = t => clamp(Math.floor(t * CAPAS.fps + 1e-6), 0, CAPAS.n - 1);
function cargarImg(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => i.decode().then(() => res(i), () => res(i)); i.onerror = () => { console.error('capas: no carga ' + src); res(null); }; i.src = src; });
}
/* pide el fotograma f (imagen + silueta); devuelve { p: promesa, listo: {v, m} cuando ha llegado } */
function pedirFotograma(f) {
  let e = CAPAS.cache.get(f);
  if (e) return e;
  const d = `edicion/capas/${CAPAS.alto}/`, id = String(f).padStart(6, '0');
  e = { listo: null };
  e.p = Promise.all([cargarImg(d + `v_${id}.jpg`), cargarImg(d + `m_${id}.png`)]).then(([v, m]) => {
    e.listo = { v, m };
    if (CAPAS.alCargar) CAPAS.alCargar(f);
    return e.listo;
  });
  CAPAS.cache.set(f, e);
  if (CAPAS.cache.size > (RENDER ? 8 : 150)) CAPAS.cache.delete(CAPAS.cache.keys().next().value);
  return e;
}
/* antes de pintar t: en el render espera a su fotograma; en la previsualización lo pide (y los siguientes) sin esperar */
async function prepararCapas(t) {
  if (!CAPAS.on) return;
  const f = fotogramaEn(t);
  if (RENDER) { await pedirFotograma(f).p; return; }
  for (let k = 0; k < 10; k++) if (f + k < CAPAS.n) pedirFotograma(f + k);
}
/* el fotograma más cercano ya cargado (en el render, el exacto) */
function fotogramaListo(f) {
  for (let k = 0; k < 90; k++) { const e = CAPAS.cache.get(f - k); if (e && e.listo && e.listo.v) return { f: f - k, ...e.listo }; }
  return null;
}

/* ---------- encuadre de la grabación ----------
   El del montaje (edicion/montaje.json): zooms se recorre en ciclo en cada salto de corte dentro del plano
   ([1, 1.08] alterna plano completo y un punch-in de un 8 %, centrado en la cara: montaje.json -> cerca).
   empuje (en el plano): acercamiento lento de 0 a ese valor a lo largo del plano (0.03 = 3 %).
   ESTILO.camaraEnMano: un temblor suave, como con la cámara en la mano. est.zoom: acercamiento extra. */
function zoomVideo(t) {                   // el zoom del montaje en t (para que una ficha de vídeo arranque con el mismo encuadre)
  const f = Math.floor(t * CAPAS.fps + 1e-6), p = planoEn(t);
  let z = 1;
  if (p && p.zooms && p.zooms.length) { const k = CAPAS.saltos.filter(j => j > p.f0 && j <= f).length; z = p.zooms[k % p.zooms.length]; }
  if (p && p.empuje) z *= 1 + p.empuje * E.ioSine(clamp((f - p.f0) / Math.max(1, p.f1 - p.f0)));
  return z;
}
function camVideo(t, est = {}) {
  let z = zoomVideo(t) * (est.zoom ?? 1);
  let hx = 0, hy = 0, hr = 0;
  if (ESTILO.camaraEnMano) {
    hx = 3.1 * Math.sin(t * .93) + 1.6 * Math.sin(t * 2.31 + 1.3); hy = 2.3 * Math.sin(t * 1.17 + 2) + 1.1 * Math.sin(t * 2.87 + .4);
    hr = .1 * Math.sin(t * .71 + .5); z *= 1.012;              // un poco de margen para que no se vean los bordes
  }
  if (VERTICAL) {                                         // la toma escalada y centrada en la cara; el zoom, anclado en ella
    const m = marcoVertical(), F = m.foco;
    return `translate(${(z * m.x0 + (1 - z) * F.x + hx).toFixed(2)}px,${((1 - z) * F.y + hy).toFixed(2)}px) scale(${z.toFixed(5)})` + (hr ? ` rotate(${hr.toFixed(3)}deg)` : '');
  }
  const sx = 1920 / CAPAS.fw, cx = CERCA.cx * sx, cy0 = (CERCA.y0 || 0) * sx;
  const x0 = clamp(cx - 1920 / z / 2, 0, 1920 - 1920 / z), y0 = clamp(cy0, 0, 1080 - 1080 / z);
  return `translate(${(-x0 * z + hx).toFixed(2)}px,${(-y0 * z + hy).toFixed(2)}px) scale(${z.toFixed(5)})` + (hr ? ` rotate(${hr.toFixed(3)}deg)` : '');
}

/* ---------- pintar las capas en el instante t con el estado est (estadoVideo(t) en index.html) ---------- */
function pintarCapas(t, est = {}) {
  const fondo = $('fondo'), vid = $('capaVideo'), per = $('capaPersona');
  if (!CAPAS.on) { fondo.style.opacity = 1; return; }
  const fo = clamp(est.fondo ?? 0), pe = clamp(est.persona ?? 1), sa = clamp(est.sala ?? 1);
  fondo.style.opacity = fo.toFixed(4);
  $('vignette').style.opacity = lerp(.55, 1, fo).toFixed(3);
  $('noise').style.opacity = (.04 * fo).toFixed(3);
  const f = fotogramaEn(t), fr = fotogramaListo(f);
  const verSala = sa > .002 && (fo < .999 || !!est.clipAnim || !!est.iris), verPer = pe > .002;   // en una cuchilla o un iris el fondo solo tapa su parte
  const hu = CAPAS.hueco;                                  // vertical: el hueco de arriba estira la primera fila de la toma
  if (fr && verSala && CAPAS.fCV !== fr.f) {
    const x = CV.getContext('2d');
    if (hu) x.drawImage(fr.v, 0, 0, CAPAS.w, 2, 0, 0, CAPAS.w, hu + 1);
    x.drawImage(fr.v, 0, hu, CAPAS.w, CAPAS.h); CAPAS.fCV = fr.f;
  }
  if (fr && verPer && CAPAS.fCP !== fr.f) {
    const x = CP.getContext('2d');
    x.globalCompositeOperation = 'copy'; x.drawImage(fr.v, 0, hu, CAPAS.w, CAPAS.h);
    if (fr.m) { x.globalCompositeOperation = 'destination-in'; x.drawImage(fr.m, 0, hu, CAPAS.w, CAPAS.h); }
    x.globalCompositeOperation = 'source-over'; CAPAS.fCP = fr.f;
  }
  const tr = camVideo(t, est);
  CV.style.transform = CP.style.transform = tr;
  vid.style.visibility = verSala ? 'visible' : 'hidden'; vid.style.opacity = sa.toFixed(3);
  per.style.visibility = verPer ? 'visible' : 'hidden'; per.style.opacity = pe.toFixed(3);
  const b = est.blur || 0, br = est.br ?? 1, bs = b + (est.blurSala || 0), brs = br * (est.brSala ?? 1);
  vid.style.filter = [bs > .05 ? `blur(${bs.toFixed(2)}px)` : '', Math.abs(brs - 1) > .005 ? `brightness(${brs.toFixed(3)})` : ''].join(' ').trim() || 'none';
  const h = clamp(est.halo || 0), hr = est.haloRgb || ACENTO_RGB, fp = [];
  if (b > .05) fp.push(`blur(${b.toFixed(2)}px)`);
  if (Math.abs(br - 1) > .005) fp.push(`brightness(${br.toFixed(3)})`);
  if (h > .005) fp.push(`drop-shadow(0 0 ${(3 + 3 * h).toFixed(1)}px rgba(${hr},${(.95 * h).toFixed(3)}))`, `drop-shadow(0 0 ${(16 + 10 * h).toFixed(1)}px rgba(${hr},${(.6 * h).toFixed(3)}))`);
  per.style.filter = fp.length ? fp.join(' ') : 'none';
  // recortes de las transiciones (cuchilla): la animación se ve en «clipAnim», la grabación en «clipVideo»
  const cam = camara(t), aLocal = pts => pts.map(([x, y]) => [CX + (x - CX - (-(cam.x - CX) * cam.s)) / cam.s, CY + (y - CY - (-(cam.y - CY) * cam.s)) / cam.s]);
  const poly = pts => !pts ? 'none' : pts.length < 3 ? 'polygon(0px 0px,0px 0px,0px 0px)'    // región vacía: no se ve nada
    : `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
  fondo.style.clipPath = poly(est.clipAnim);
  WORLD.style.clipPath = WORLDF.style.clipPath = est.clipAnim ? poly(aLocal(est.clipAnim)) : 'none';
  vid.style.clipPath = per.style.clipPath = poly(est.clipVideo);
  aplicarIris(est, cam);                                 // transición iris (más abajo)
}

/* ---------- la grabación dentro de una ficha que vive en el mundo ----------
   videoFicha({ etiquetas: ['BRUTO', 'SIN EDITAR'], pie: 'toma.mp4 · 4K · 51 s' }) -> elemento del tamaño de la pantalla
   (1920x1080; 1080x1920 en vertical): a s = 1 ocupa la pantalla exactamente como la grabación, para que el paso de
   pantalla completa a ficha no se note.
   pintarFicha(el, t, {x, y, s, rx, ry, o, ...}, { zoom: 1, radio: 28 }) en cada fotograma.
   Mientras se ve la ficha, apaga sala y persona en estadoVideo (sala: 0, persona: 0, fondo: 1). */
function videoFicha(o = {}) {
  const e = mk('div', `L vficha ${o.z || 'z4'}`, o.padre);
  e.style.width = CONFIG.ancho + 'px'; e.style.height = CONFIG.alto + 'px';
  e._c = mk('canvas', 'vf-c', e);
  e._borde = mk('div', 'vf-b', e);
  e._tags = mk('div', 'vf-tags', e, (o.etiquetas || []).map((x, i) => `<span class="vf-tag${i ? '' : ' a'}">${x}</span>`).join(''));
  e._pie = mk('div', 'vf-pie', e, o.pie || '');
  e._f = -1;
  return e;
}
function pintarFicha(e, t, k, { zoom = 1, radio = 28, etiquetas = 1, pie = 1 } = {}) {
  if (!(k.o > .002) || !CAPAS.on) { off(e); return; }
  if (VERTICAL) { if (e._c.width !== CONFIG.ancho) { e._c.width = CONFIG.ancho; e._c.height = CONFIG.alto; } }
  else if (e._c.width !== CAPAS.w) { e._c.width = CAPAS.w; e._c.height = CAPAS.h; }
  const fr = fotogramaListo(fotogramaEn(t));
  if (fr && VERTICAL && (e._f !== fr.f || e._z !== zoom)) {   // lo mismo que se ve en pantalla con ese zoom (hueco incluido)
    const x = e._c.getContext('2d'), m = marcoVertical(), F = m.foco, a = zoom * m.s * CAPAS.fw / CAPAS.w;
    x.setTransform(a, 0, 0, a, F.x + zoom * (m.x0 - F.x), F.y + zoom * (m.y0 - F.y));
    const hu = m.y0 / (m.s * CAPAS.fw / CAPAS.w);
    if (hu > 0) x.drawImage(fr.v, 0, 0, CAPAS.w, 2, 0, -hu, CAPAS.w, hu + 1);
    x.drawImage(fr.v, 0, 0, CAPAS.w, CAPAS.h); x.setTransform(1, 0, 0, 1, 0, 0); e._f = fr.f; e._z = zoom;
  }
  if (fr && !VERTICAL && (e._f !== fr.f || e._z !== zoom)) {
    const x = e._c.getContext('2d'), sw = CAPAS.w / zoom, sh = CAPAS.h / zoom;
    const cx = CERCA.cx / CAPAS.fw * CAPAS.w, sx = clamp(cx - sw / 2, 0, CAPAS.w - sw), sy = clamp((CERCA.y0 || 0) / CAPAS.fh * CAPAS.h, 0, CAPAS.h - sh);
    x.drawImage(fr.v, sx, sy, sw, sh, 0, 0, CAPAS.w, CAPAS.h); e._f = fr.f; e._z = zoom;
  }
  const s = k.s ?? 1, r = radio * clamp((1 - s) * 3) / Math.max(.05, s);     // a pantalla completa, sin esquinas
  e._c.style.borderRadius = e._borde.style.borderRadius = r.toFixed(1) + 'px';
  e._borde.style.opacity = clamp((1 - s) * 4).toFixed(3);
  e._tags.style.opacity = etiquetas; e._pie.style.opacity = pie;
  e._tags.style.transform = e._pie.style.transform = `scale(${(1 / Math.max(.2, s)).toFixed(3)})`;
  put(e, k);
}

/* ---------- transición «cuchilla»: una línea cruza la pantalla en diagonal y descubre la animación detrás ----------
   const c = cuchilla(t, t0, { dur: .34, ang: 64, haciaAnim: true });  en estadoVideo: si (c) Object.assign(est, c.est)
   haciaAnim: de la cara a la animación (false: de la animación a la cara). Suena: sfx(t0, 'corte'). */
const LINEA = (() => { const e = document.createElement('div'); e.className = 'cuchilla'; e.style.cssText =
  'position:absolute;left:0;top:0;width:2600px;height:6px;margin:-3px 0 0 -1300px;border-radius:3px;pointer-events:none;visibility:hidden;z-index:90;' +
  'background:linear-gradient(90deg,transparent,rgba(var(--acento-rgb),1) 18%,#fff 50%,rgba(var(--acento-rgb),1) 82%,transparent);' +
  'box-shadow:0 0 18px rgba(var(--acento-rgb),.9),0 0 50px rgba(var(--acento-rgb),.5)'; STAGE.appendChild(e); return e; })();
function recortarSemiplano(pts, nx, ny, s, dentroMenor) {
  const out = [], d = ([x, y]) => (x * nx + y * ny) - s, ok = p => dentroMenor ? d(p) <= 0 : d(p) >= 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], da = d(a), db = d(b);
    if (ok(a)) out.push(a);
    if ((da < 0) !== (db < 0)) { const k = da / (da - db); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]); }
  }
  return out;
}
function cuchilla(t, t0, { dur = .34, ang = 64, haciaAnim = true } = {}) {
  const p = (t - t0) / dur;
  if (p < 0 || p > 1.25) { LINEA.style.visibility = 'hidden'; return null; }
  const q = E.io3(clamp(p)), a = ang * Math.PI / 180, nx = Math.sin(a), ny = -Math.cos(a);
  const W = CONFIG.ancho, H = CONFIG.alto, R = [[0, 0], [W, 0], [W, H], [0, H]], ds = R.map(([x, y]) => x * nx + y * ny);
  const s = lerp(Math.min(...ds) - 30, Math.max(...ds) + 30, q);
  const nuevo = recortarSemiplano(R, nx, ny, s, true), viejo = recortarSemiplano(R, nx, ny, s, false);
  const est = haciaAnim ? { fondo: 1, persona: 1, clipAnim: nuevo, clipVideo: viejo } : { fondo: 1, persona: 1, clipAnim: viejo, clipVideo: nuevo };
  // la línea: pasa por el punto de la recta más cercano al centro
  const k = s - (CX * nx + CY * ny), px = CX + nx * k, py = CY + ny * k;
  LINEA.style.visibility = p < 1 ? 'visible' : 'hidden';
  LINEA.style.opacity = (clamp(p * 8) * (1 - clamp((p - .85) / .15))).toFixed(3);
  LINEA.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) rotate(${(ang - 90).toFixed(2)}deg)`;
  return p >= 1 ? null : { est, p: q };
}

/* ---------- destello suave (nunca blanco a pantalla completa): destello(t, t0, fuerza .5) en render ---------- */
function destello(t, t0, fuerza = .5, subida = .06, caida = 2.6) {
  const v = flash(t, t0, subida, caida) * fuerza;
  const e = $('destello');
  e.style.opacity = v > .002 ? v.toFixed(3) : 0;
  return v;
}

/* ---------- fondo espacio 3D (tema profundidad) ----------
   new Espacio(ESPACIOK, { horizonte: 650, fuga: [960, 470] }) y en render: ESPACIO.pintar(t, { dx, dy }).
   Estrellas en 3D que se acercan, suelo de rejilla en perspectiva que avanza, líneas de velocidad (hiper) que
   salen del punto de fuga, bokeh y un tinte del acento. La distancia recorrida es la integral de la velocidad
   (tabla a 240 Hz): si la velocidad cambia, nada salta (con camZ = t · vel, sí saltaría). */
class Espacio {
  constructor(keys, o = {}) {
    this.k = keys; this.o = { horizonte: 650, fuga: [960, 470], tinte: ACENTO_RGB, ...o };
    this.c = $('espacio'); this.c.style.display = 'block'; this.x = this.c.getContext('2d');
    const dt = 1 / 240, n = Math.ceil((CONFIG.dur + 2) / dt) + 2;
    this.D = new Float64Array(n);
    for (let i = 1; i < n; i++) this.D[i] = this.D[i - 1] + KF((i - .5) * dt, keys).vel * dt;
    let s = 987654321;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    this.est = Array.from({ length: 460 }, () => ({ x: (rnd() * 2 - 1) * 2200, y: (rnd() * 2 - 1) * 1300, z0: rnd() * 3200, r: .5 + rnd() * 1.1, a: .35 + rnd() * .65, tinte: rnd() < .22 }));
    this.bok = Array.from({ length: 9 }, () => ({ x: rnd() * 1920, y: rnd() * 900, r: 60 + rnd() * 140, a: .025 + rnd() * .04, p: .05 + rnd() * .12 }));
  }
  dist(t) { const i = clamp(t, 0, CONFIG.dur + 1.9) * 240, i0 = Math.floor(i); return lerp(this.D[i0], this.D[i0 + 1] ?? this.D[i0], i - i0); }
  pintar(t, { dx = 0, dy = 0 } = {}) {
    const dpr = window.devicePixelRatio || 1, W = CONFIG.ancho, H = CONFIG.alto, c = this.c, x = this.x;
    if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    const k = KF(t, this.k), D = this.dist(t) * 400, [fx0, fy0] = this.o.fuga, fx = fx0 + dx * .12, fy = fy0 + dy * .12, T = this.o.tinte;
    // tinte central
    const g = x.createRadialGradient(fx, fy + 120, 40, fx, fy + 120, 1000);
    g.addColorStop(0, `rgba(${T},.10)`); g.addColorStop(.5, `rgba(${T},.03)`); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // bokeh (círculos grandes y muy suaves, casi quietos)
    for (const b of this.bok) {
      const bx = b.x + dx * b.p - t * 6 * b.p, by = b.y + dy * b.p, gg = x.createRadialGradient(bx, by, 0, bx, by, b.r);
      gg.addColorStop(0, `rgba(${T},${b.a})`); gg.addColorStop(1, `rgba(${T},0)`); x.fillStyle = gg; x.fillRect(bx - b.r, by - b.r, b.r * 2, b.r * 2);
    }
    // suelo de rejilla en perspectiva que avanza
    if (k.suelo > .005) {
      const H0 = this.o.horizonte + dy * .3, CAMH = 300, F = 700, S = 220, x0 = fx0 + dx * .3;
      x.lineWidth = 1.1;
      const fase = (D % S) / S;
      for (let i = 0; i < 26; i++) {
        const z = S * (i + 1 - fase) * .55 + 60, y = H0 + CAMH * F / z;
        if (y > H + 4) continue;
        const a = .20 * k.suelo * clamp((y - H0) / 160) * clamp(1.2 - (y - H0) / 700);
        x.strokeStyle = `rgba(175,185,205,${a.toFixed(3)})`; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke();
      }
      for (let j = -14; j <= 14; j++) {
        const xw = j * S, zA = 90, zB = 6000;
        const ax = x0 + xw * F / zA, ay = H0 + CAMH * F / zA, bx = x0 + xw * F / zB, by = H0 + CAMH * F / zB;
        const gr = x.createLinearGradient(0, by, 0, Math.min(H, ay));
        gr.addColorStop(0, 'rgba(175,185,205,0)'); gr.addColorStop(.35, `rgba(175,185,205,${(.16 * k.suelo).toFixed(3)})`); gr.addColorStop(1, `rgba(175,185,205,${(.22 * k.suelo).toFixed(3)})`);
        x.strokeStyle = gr; x.beginPath(); x.moveTo(bx, by); x.lineTo(ax, ay); x.stroke();
      }
      // brillo del acento en el horizonte
      const hg = x.createLinearGradient(0, H0 - 40, 0, H0 + 90);
      hg.addColorStop(0, `rgba(${T},0)`); hg.addColorStop(.5, `rgba(${T},${(.06 * k.suelo).toFixed(3)})`); hg.addColorStop(1, `rgba(${T},0)`);
      x.fillStyle = hg; x.fillRect(0, H0 - 40, W, 130);
    }
    // estrellas y líneas de velocidad
    if (k.estrellas > .005) {
      const F = 760, ZM = 3200, ZN = 40, hip = clamp(k.hiper || 0), vel = Math.max(0, k.vel);
      for (const st of this.est) {
        const z = ZN + (((st.z0 - D) % ZM) + ZM) % ZM;
        const sx = fx + st.x * F / z + dx * .15, sy = fy + st.y * F / z + dy * .15;
        if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) continue;
        const a = st.a * k.estrellas * clamp((ZM - z) / 700) * clamp((z - ZN) / 120);
        if (a < .01) continue;
        const col = st.tinte ? T : '225,232,255', r = clamp(st.r * F / z * .9, .45, 3.4);
        if (hip > .02) {
          const z2 = z + hip * (140 + vel * 70), ex = fx + st.x * F / z2 + dx * .15, ey = fy + st.y * F / z2 + dy * .15;
          x.strokeStyle = `rgba(${col},${(a * (.55 + .45 * hip)).toFixed(3)})`; x.lineWidth = Math.max(.8, r * .9);
          x.beginPath(); x.moveTo(ex, ey); x.lineTo(sx, sy); x.stroke();
        }
        x.fillStyle = `rgba(${col},${a.toFixed(3)})`; x.beginPath(); x.arc(sx, sy, r, 0, 6.2832); x.fill();
      }
    }
  }
}

/* ---------- recursos que solo cargan si alguna pieza los usa ----------
   PALABRAS: trabajo/tiempos.json (subtítulos palabra a palabra) · nivelVoz(t): 0..1 del volumen de la voz (vúmetros) */
const NECESITA = { palabras: false, voz: false };
let PALABRAS = [], VOZ_ENV = null;
async function cargarRecursos() {
  if (NECESITA.palabras) {
    try { const r = await fetch('trabajo/tiempos.json', { cache: 'no-store' }); if (r.ok) PALABRAS = await r.json(); } catch (e) { /* sin palabras */ }
    if (!PALABRAS.length) console.error('subtítulos: no hay trabajo/tiempos.json (anim.py alinear)');
  }
  if (NECESITA.voz && CONFIG.audio) {
    try {
      const buf = await (await fetch(CONFIG.audio)).arrayBuffer();
      const au = await new OfflineAudioContext(1, 48000, 48000).decodeAudioData(buf);
      const d = au.getChannelData(0), paso = au.sampleRate / 60, n = Math.floor(d.length / paso);
      VOZ_ENV = new Float32Array(n);
      for (let i = 0; i < n; i++) { let s = 0; const a = Math.floor(i * paso), b = Math.floor((i + 1) * paso); for (let j = a; j < b; j++) s += d[j] * d[j]; VOZ_ENV[i] = Math.sqrt(s / (b - a)); }
    } catch (e) { console.error('nivelVoz: no pude leer ' + CONFIG.audio); }
  }
}
function nivelVoz(t) {
  if (!VOZ_ENV) return 0;
  const i = clamp(Math.floor(t * 60), 0, VOZ_ENV.length - 1), db = 20 * Math.log10(VOZ_ENV[i] + 1e-6);
  return clamp((db + 48) / 36);
}

/* ---------- transición «iris»: un círculo que se abre desde un punto (su cara) y descubre la otra capa ----------
   const c = iris(t, t0, { dur: .44, cx: 920, cy: 300, haciaAnim: false });  en estadoVideo: if (c) return c.est;
   haciaAnim false: de la animación a la grabación (su cara aparece dentro del círculo, que crece hasta llenar la
   pantalla); true: al revés. Con aro luminoso del acento. Tiene que acabar justo donde acaba el plano de animación.
   Suena: sfx(t0 + dur * .7, 'aire'). (Nació en «editado por IA»: la cuchilla también vale, esta es más suave.) */
css(`.iris-aro{position:absolute;left:0;top:0;border-radius:50%;border:5px solid rgba(var(--acento-rgb),1);pointer-events:none;visibility:hidden;z-index:85;
  box-shadow:0 0 30px rgba(var(--acento-rgb),.9),inset 0 0 30px rgba(var(--acento-rgb),.6)}`);
const IRIS_ARO = (() => { const e = document.createElement('div'); e.className = 'iris-aro'; STAGE.appendChild(e); return e; })();
function iris(t, t0, { dur = .44, cx = 960, cy = 400, haciaAnim = false, radio = null } = {}) {
  const p = (t - t0) / dur;
  if (p < 0 || p >= 1) return null;
  const W = CONFIG.ancho, H = CONFIG.alto, R = radio ?? 1.23 * Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x - cx, y - cy)));
  return { est: { fondo: 1, persona: 1, sala: 1, iris: { cx, cy, r: R * E.in2(p) + 2, p, haciaAnim } }, p };
}
function aplicarIris(est, cam) {
  const capasAnim = [$('fondo'), WORLD, WORLDF], capasVid = [$('capaVideo'), $('capaPersona')], ir = est.iris;
  const mascara = (e, m) => { e.style.webkitMaskImage = e.style.maskImage = m; };
  if (!ir) {
    if (CAPAS.iris) { capasAnim.forEach(e => mascara(e, '')); capasVid.forEach(e => mascara(e, '')); CAPAS.iris = false; }
    off(IRIS_ARO); return;
  }
  const circ = (cx, cy, r, dentro) => `radial-gradient(circle at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, ${dentro ? '#000' : 'transparent'} ${r.toFixed(1)}px, ${dentro ? 'transparent' : '#000'} ${(r + 1.5).toFixed(1)}px)`;
  const lx = CX + (ir.cx - CX - (-(cam.x - CX) * cam.s)) / cam.s, ly = CY + (ir.cy - CY - (-(cam.y - CY) * cam.s)) / cam.s;   // centro en el mundo (con cámara)
  mascara($('fondo'), circ(ir.cx, ir.cy, ir.r, ir.haciaAnim));
  [WORLD, WORLDF].forEach(e => mascara(e, circ(lx, ly, ir.r / cam.s, ir.haciaAnim)));
  capasVid.forEach(e => mascara(e, circ(ir.cx, ir.cy, ir.r, !ir.haciaAnim)));
  CAPAS.iris = true;
  IRIS_ARO.style.width = IRIS_ARO.style.height = (2 * ir.r).toFixed(1) + 'px';
  put(IRIS_ARO, { x: ir.cx, y: ir.cy, o: clamp(ir.p * 8) * (1 - clamp((ir.p - .75) / .25)) });
}

/* ---------- fondo «cortina de luz» (tema profundidad, por defecto) ----------
   new Cortina(FONDOK, { ondas: [t...], direccion: 0 | 90 | -18, paleta: paletaDe(rgb) }) y en render: FONDO.pintar(t, { dx, dy }).
   Hebras verticales de luz en tres profundidades que derivan despacio con paralaje (un guiño a los listones del
   estudio de Josema), polvo en suspensión, un barrido de luz periódico y ondas que se expanden desde el centro en los
   golpes (ondas: instantes). FONDOK: vel (deriva en px/s a paralaje 1; integrada: nunca salta; 26 = calma, 90–150 =
   viaje en un revelado) y brillo (1 normal, 1,25–1,35 en un golpe). Sustituye al espacio con suelo de rejilla (Espacio),
   que recuerda al vídeo de referencia: Espacio sigue disponible solo si Josema lo pide. */
class Cortina {
  constructor(keys, o = {}) {
    this.k = keys; this.o = { ondas: [], direccion: 0, paleta: null, semilla: 424242, ...o };
    this.c = $('espacio'); this.c.style.display = 'block'; this.x = this.c.getContext('2d');
    const dt = 1 / 240, n = Math.ceil((CONFIG.dur + 2) / dt) + 2;
    this.D = new Float64Array(n);
    for (let i = 1; i < n; i++) this.D[i] = this.D[i - 1] + KF((i - .5) * dt, keys).vel * dt;
    let s = this.o.semilla;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    // paleta: la de siempre (acento + azules fríos + un toque cálido) o la que se pase (paletaDe(rgb) da 4 tonos)
    const TIN = this.o.paleta || [ACENTO_RGB, '150,180,255', '205,218,255', '255,178,110'];
    // direccion (grados): 0 = hebras verticales (la de «editado por IA»); 90 = horizontales; -20…20 = diagonales.
    // Las hebras se dibujan en un plano girado que cubre la pantalla entera.
    this.ang = this.o.direccion * Math.PI / 180;
    const ca = Math.abs(Math.cos(this.ang)), sa = Math.abs(Math.sin(this.ang));
    this.Wp = CONFIG.ancho * ca + CONFIG.alto * sa; this.Hp = CONFIG.ancho * sa + CONFIG.alto * ca;
    // proporcional al plano: la franja por la que corren las hebras (ancho + 380) y su alto (en 1920x1080, como antes)
    const W = this.Wp, H = this.Hp, kh = H / 1080; this.franja = W + 380;
    const cuantas = n => Math.round(n * this.franja / 2300);
    const capa = (n, par, w0, w1, a0, a1, h0, h1, calida) => Array.from({ length: cuantas(n) }, () => {
      const r = rnd();
      return { x0: rnd() * this.franja, w: lerp(w0, w1, rnd()), a: lerp(a0, a1, rnd()), h: lerp(h0, h1, rnd()) * kh, yc: (520 + (rnd() - .5) * 280) * kh, par,
        col: r < calida ? TIN[3] : r < calida + .38 ? TIN[0] : r < calida + .66 ? TIN[1] : TIN[2], fase: rnd() * 6.28, fr: .4 + rnd() * 1.3 };
    });
    this.lin = [...capa(12, 1.5, 36, 96, .03, .065, 520, 900, .22),       // cerca: barras anchas y suaves
      ...capa(115, .35, .8, 1.6, .10, .30, 240, 600, .06),                  // lejos: hilos finos
      ...capa(48, .7, 1.6, 3.2, .16, .44, 320, 740, .12)];                  // medio: hebras con halo
    this.polvo = Array.from({ length: 95 }, () => ({ x: rnd() * (CONFIG.ancho + 40), y: rnd() * (CONFIG.alto + 40), r: .6 + rnd() * 1.6, a: .12 + rnd() * .4, v: 6 + rnd() * 18, fase: rnd() * 6.28, par: .3 + rnd() * .9 }));
  }
  dist(t) { const i = clamp(t, 0, CONFIG.dur + 1.9) * 240, i0 = Math.floor(i); return lerp(this.D[i0], this.D[i0 + 1] ?? this.D[i0], i - i0); }
  pintar(t, { dx = 0, dy = 0 } = {}) {
    const dpr = window.devicePixelRatio || 1, W = CONFIG.ancho, H = CONFIG.alto, c = this.c, x = this.x, FR = this.franja;
    if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const k = KF(t, this.k), D = this.dist(t), br = k.brillo, kw = W / 1920, kh = H / 1080, kr = Math.max(kw, kh);
    const gb = x.createLinearGradient(0, 0, 0, H);
    gb.addColorStop(0, '#04060b'); gb.addColorStop(.55, '#0a0e19'); gb.addColorStop(1, '#040509');
    x.globalCompositeOperation = 'source-over'; x.fillStyle = gb; x.fillRect(0, 0, W, H);
    const glow = (gx, gy, r, rgb, a) => { const g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(gx - r, gy - r, 2 * r, 2 * r); };
    x.globalCompositeOperation = 'lighter';
    glow(CX + dx * .1, 500 * kh, 1050 * kr, ACENTO_RGB, .13 * (.85 + .15 * Math.sin(t * .9)) * br);
    glow(250 * kw, 990 * kh, 780 * kr, '255,170,95', .06);
    glow(1720 * kw, 110 * kh, 700 * kr, '120,150,255', .05);
    const Wp = this.Wp, sx = (Wp + 330) - ((t + 2.2) % 6.5) / 6.5 * (Wp + 780);   // barrido de luz, de derecha a izquierda
    if (this.ang) { x.save(); x.translate(W / 2, H / 2); x.rotate(this.ang); x.translate(-Wp / 2, -this.Hp / 2); }
    for (const L of this.lin) {
      const X = ((L.x0 - D * L.par + dx * L.par * .15) % FR + FR) % FR - 190;
      let boost = 1 + 1.3 * Math.exp(-((X - sx) ** 2) / 39200), hb = 1;
      for (const t0 of this.o.ondas) {
        const d = t - t0; if (d < 0 || d > 2.4) continue;
        const rr = 1500 * kw * E.out3(Math.min(1, d / 1.3)), g = Math.exp(-((Math.abs(X - Wp / 2) - rr) ** 2) / 28800) * Math.exp(-d * 1.3);
        boost += 3.4 * g; hb += .5 * g;
      }
      const a = Math.min(1, L.a * (.72 + .28 * Math.sin(t * L.fr + L.fase)) * boost * br);
      if (a < .004) continue;
      const h = L.h * hb, y0 = L.yc - h + dy * L.par * .1, y1 = L.yc + h + dy * L.par * .1;
      const g = x.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, `rgba(${L.col},0)`); g.addColorStop(.5, `rgba(${L.col},${a.toFixed(3)})`); g.addColorStop(1, `rgba(${L.col},0)`);
      x.fillStyle = g; x.fillRect(X - L.w / 2, y0, L.w, y1 - y0);
      if (L.w < 5) { x.globalAlpha = .11; x.fillRect(X - L.w * 4, y0 + h * .2, L.w * 8, (y1 - y0) * .8); x.globalAlpha = 1; }   // halo
    }
    if (this.ang) x.restore();
    for (const p of this.polvo) {
      const px = ((p.x - D * p.par * .4 + dx * p.par * .1) % (W + 40) + (W + 40)) % (W + 40) - 20, py = ((p.y - t * p.v) % (H + 40) + (H + 40)) % (H + 40) - 20;
      const a = p.a * (.5 + .5 * Math.sin(t * 1.7 + p.fase));
      x.fillStyle = `rgba(215,225,255,${a.toFixed(3)})`; x.beginPath(); x.arc(px, py, p.r, 0, 6.2832); x.fill();
    }
    x.globalCompositeOperation = 'source-over';
  }
}

/* =====================================================================
   VARIEDAD (30/09/2026): cada vídeo con su propia dirección de arte (references/direccion.md).
   Josema: «si la uso con otros vídeos hace exactamente lo mismo». Aquí están las piezas del aspecto que cambian de un
   vídeo a otro: acabado de los paneles (ESTILO.acabado), tipografía de los titulares (ESTILO.tipo), paleta derivada
   del acento y los fondos del tema profundidad (ESTILO.fondo: cortina, aurora, malla, constelacion, liso, puntos).
   ===================================================================== */

/* ---------- acabado de los paneles y tipografía de los titulares ----------
   Las piezas usan var(--panel-bg), var(--panel-borde)… y su redondeo de siempre × var(--panel-k) (1 en cristal) y var(--display) / var(--display-peso) en sus titulares, así
   que cambiar ESTILO.acabado o ESTILO.tipo cambia el aspecto de todas a la vez. Una pieza nueva debe usarlas también. */
const ACABADOS = {
  cristal: { '--panel-bg': 'linear-gradient(180deg,rgba(30,33,42,.80),rgba(13,15,20,.86))', '--panel-borde': '1.5px solid rgba(255,255,255,.10)',
    '--panel-sombra': '0 50px 110px -34px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.07)', '--panel-k': '1', '--panel-filtro': 'blur(16px)' },
  solido: { '--panel-bg': '#101218', '--panel-borde': '0 solid transparent',
    '--panel-sombra': 'inset 0 5px 0 var(--acento),0 34px 70px -30px rgba(0,0,0,.95)', '--panel-k': '.36', '--panel-filtro': 'none' },
  contorno: { '--panel-bg': 'rgba(6,8,12,.55)', '--panel-borde': '2px solid rgba(var(--acento-rgb),.85)',
    '--panel-sombra': '0 0 0 1px rgba(var(--acento-rgb),.15),0 0 34px rgba(var(--acento-rgb),.22)', '--panel-k': '.15', '--panel-filtro': 'blur(6px)' },
};
const TIPOS = {
  outfit: { '--display': "'Outfit',system-ui,sans-serif", '--display-peso': '800' },
  grotesk: { '--display': "'Space Grotesk',system-ui,sans-serif", '--display-peso': '700', '--sans': "'Space Grotesk',system-ui,sans-serif" },
  editorial: { '--display': "'Instrument Serif',Georgia,serif", '--display-peso': '400' },
};
function aplicarAspecto() {
  const r = document.documentElement.style;
  const v = { ...(ACABADOS[ESTILO.acabado] || ACABADOS.cristal), ...(TIPOS[ESTILO.tipo] || TIPOS.outfit) };
  for (const k in v) r.setProperty(k, v[k]);
}
aplicarAspecto();

/* ---------- paleta a partir del acento (o de la marca protagonista) ----------
   paletaDe('217,119,87') → [acento, acento claro, vecino de tono, contrapunto]; para fondos y detalles. */
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s); l = clamp(l);
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map(v => Math.round((v + m) * 255)).join(',');
}
function paletaDe(rgb = ACENTO_RGB) {
  const [h, s, l] = rgb2hsl(...rgb.split(',').map(Number));
  return [rgb, hsl2rgb(h, s * .55, Math.min(.84, l + .26)), hsl2rgb(h + 38, s * .85, l), hsl2rgb(h - 150, .55, .64)];
}

/* ---------- base común de los fondos nuevos: distancia integrada (vel), lienzo, degradado y halos ---------- */
class FondoBase {
  constructor(keys, o = {}) {
    this.k = keys; this.o = { ondas: [], ...o };
    this.c = $('espacio'); this.c.style.display = 'block'; this.x = this.c.getContext('2d');
    const dt = 1 / 240, n = Math.ceil((CONFIG.dur + 2) / dt) + 2;
    this.D = new Float64Array(n);
    for (let i = 1; i < n; i++) this.D[i] = this.D[i - 1] + KF((i - .5) * dt, keys).vel * dt;
    this.W = CONFIG.ancho; this.H = CONFIG.alto;
    let s = this.o.semilla ?? 20260930;
    this.rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    this.pal = this.o.paleta || paletaDe(ACENTO_RGB);
  }
  dist(t) { const i = clamp(t, 0, CONFIG.dur + 1.9) * 240, i0 = Math.floor(i); return lerp(this.D[i0], this.D[i0 + 1] ?? this.D[i0], i - i0); }
  preparar() {
    const dpr = window.devicePixelRatio || 1, c = this.c;
    if (c.width !== Math.round(this.W * dpr)) { c.width = Math.round(this.W * dpr); c.height = Math.round(this.H * dpr); }
    this.x.setTransform(dpr, 0, 0, dpr, 0, 0);
    return this.x;
  }
  onda(t) { let v = 0; for (const t0 of this.o.ondas) { const d = t - t0; if (d >= 0 && d < 2) v += Math.exp(-d * 2.2) * clamp(d / .08); } return v; }
  base(x, t, br, dx = 0) {
    const W = this.W, H = this.H, kr = Math.max(W, H) / 1920, P0 = this.pal;
    const gb = x.createLinearGradient(0, 0, 0, H);
    gb.addColorStop(0, this.o.fondoArriba || '#04060b'); gb.addColorStop(.55, this.o.fondoMedio || '#0a0e19'); gb.addColorStop(1, '#040509');
    x.globalCompositeOperation = 'source-over'; x.fillStyle = gb; x.fillRect(0, 0, W, H);
    const glow = (gx, gy, r, rgb, a) => { const g = x.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(gx - r, gy - r, 2 * r, 2 * r); };
    x.globalCompositeOperation = 'lighter';
    glow(W / 2 + dx * .1, H * .46, 1050 * kr, P0[0], .12 * (.85 + .15 * Math.sin(t * .9)) * br);
    glow(W * .13, H * .92, 780 * kr, P0[3], .05);
    glow(W * .9, H * .1, 700 * kr, P0[1], .045);
    x.globalCompositeOperation = 'source-over';
  }
  polvo(x, t, n = 70, dx = 0) {
    if (!this._pv) { const r = this.rnd; this._pv = Array.from({ length: n }, () => ({ x: r() * (this.W + 40), y: r() * (this.H + 40), r: .6 + r() * 1.4, a: .1 + r() * .32, v: 5 + r() * 14, f: r() * 6.28, p: .3 + r() * .9 })); }
    const W = this.W + 40, H = this.H + 40, D = this.dist(t);
    for (const p of this._pv) {
      const px = ((p.x - D * p.p * .3 + dx * p.p * .1) % W + W) % W - 20, py = ((p.y - t * p.v) % H + H) % H - 20;
      x.fillStyle = `rgba(215,225,255,${(p.a * (.5 + .5 * Math.sin(t * 1.7 + p.f))).toFixed(3)})`; x.beginPath(); x.arc(px, py, p.r, 0, 6.2832); x.fill();
    }
  }
}

/* ---------- «aurora»: cintas de color suaves que ondulan despacio (producto, creatividad, calma, algo nuevo) ---------- */
class Aurora extends FondoBase {
  constructor(keys, o = {}) {
    super(keys, o);
    const r = this.rnd;
    this.lo = document.createElement('canvas'); this.lo.width = Math.round(this.W / 4); this.lo.height = Math.round(this.H / 4);
    const n = this.o.cintas || 5;
    this.cin = Array.from({ length: n }, (_, i) => ({ col: this.pal[i % this.pal.length], yc: .22 + .56 * (i + r() * .6) / n, a1: .05 + .07 * r(), k1: .6 + 1.1 * r(), f1: r() * 6.28,
      a2: .02 + .03 * r(), k2: 1.8 + 2 * r(), f2: r() * 6.28, v: (.5 + .7 * r()) * (r() < .5 ? -1 : 1), g: .09 + .09 * r(), al: .2 + .16 * r() }));
  }
  y(c, u, D) { return c.yc + c.a1 * Math.sin(c.k1 * u * 6.2832 + c.f1 + D * c.v) + c.a2 * Math.sin(c.k2 * u * 6.2832 + c.f2 - D * c.v * 1.7); }
  pintar(t, { dx = 0, dy = 0 } = {}) {
    const x = this.preparar(), W = this.W, H = this.H, k = KF(t, this.k), D = this.dist(t) / 420, br = k.brillo * (1 + .6 * this.onda(t));
    this.base(x, t, k.brillo, dx);
    const l = this.lo.getContext('2d'), w = this.lo.width, h = this.lo.height;
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, w, h);
    l.globalCompositeOperation = 'lighter'; l.filter = `blur(${Math.round(w / 48)}px)`; l.lineCap = 'round'; l.lineJoin = 'round';
    for (const c of this.cin) {
      l.strokeStyle = `rgba(${c.col},${Math.min(1, c.al * br).toFixed(3)})`; l.lineWidth = c.g * Math.min(w, h);   // en vertical, igual de finas
      l.beginPath();
      for (let i = 0; i <= 40; i++) { const u = i / 40, X = u * (w + 40) - 20, Y = this.y(c, u, D) * h; i ? l.lineTo(X, Y) : l.moveTo(X, Y); }
      l.stroke();
    }
    l.filter = 'none';
    x.globalCompositeOperation = 'lighter'; x.imageSmoothingEnabled = true;
    x.drawImage(this.lo, -W * .02 + dx * .05, dy * .03, W * 1.04, H);
    x.lineWidth = 1.3;                                          // un hilo nítido en el centro de cada cinta
    for (const c of this.cin) {
      x.strokeStyle = `rgba(${c.col},${Math.min(1, .16 * br).toFixed(3)})`; x.beginPath();
      for (let i = 0; i <= 96; i++) { const u = i / 96, X = u * (W + 60) - 30 + dx * .08, Y = this.y(c, u, D) * H + dy * .05; i ? x.lineTo(X, Y) : x.moveTo(X, Y); }
      x.stroke();
    }
    x.globalCompositeOperation = 'source-over';
    this.polvo(x, t, 60, dx);
  }
}

/* ---------- «malla»: líneas de relieve que ondulan, unas tapan a otras (datos, análisis, señal, sonido, mercado) ---------- */
class Malla extends FondoBase {
  constructor(keys, o = {}) {
    super(keys, o);
    const r = this.rnd;
    this.n = this.o.lineas || Math.round(28 * this.H / 1080);
    this.picos = Array.from({ length: 6 }, () => ({ x: .1 + .8 * r(), w: .05 + .09 * r(), a: .5 + r(), v: (r() - .5) * .7, f: r() * 6.28 }));
  }
  pintar(t, { dx = 0, dy = 0 } = {}) {
    const x = this.preparar(), W = this.W, H = this.H, k = KF(t, this.k), D = this.dist(t) / 380, br = k.brillo;
    this.base(x, t, br, dx);
    const n = this.n, top = H * .16, bot = H * 1.04, paso = (bot - top) / n, P0 = this.pal;
    const ondas = this.o.ondas.map(t0 => t - t0).filter(d => d >= 0 && d < 2.2);
    for (let i = 0; i < n; i++) {                            // de atrás (arriba) a delante (abajo): cada línea tapa a la anterior
      const y0 = top + i * paso + dy * .04 * (i / n), prof = i / (n - 1), pts = [];
      for (let xx = -30; xx <= W + 30; xx += 14) {
        const u = xx / W;
        let a = 0;
        for (const p of this.picos) { const c = p.x + p.v * Math.sin(D * .7 + p.f); a += p.a * Math.exp(-((u - c) ** 2) / (2 * p.w * p.w)); }
        a *= .55 + .45 * Math.sin(i * .55 + D * 1.3);
        a += .12 * Math.sin(u * 17 + i * 1.3 + D * 2.1);
        for (const d of ondas) { const rr = 1.2 * E.out3(Math.min(1, d / 1.2)); a += 1.1 * Math.exp(-((Math.abs(u - .5) - rr) ** 2) / .004) * Math.exp(-d * 1.4); }
        pts.push([xx + dx * .06 * prof, y0 - Math.max(0, a) * paso * 2.6]);
      }
      x.beginPath(); x.moveTo(pts[0][0], H + 10);
      for (const [px, py] of pts) x.lineTo(px, py);
      x.lineTo(pts[pts.length - 1][0], H + 10); x.closePath();
      x.fillStyle = 'rgba(6,8,14,.94)'; x.fill();
      x.beginPath(); pts.forEach(([px, py], j) => j ? x.lineTo(px, py) : x.moveTo(px, py));
      x.lineWidth = 1 + prof * .8; x.strokeStyle = `rgba(${i % 5 === 0 ? P0[0] : P0[1]},${Math.min(1, (.1 + .38 * prof) * br).toFixed(3)})`; x.stroke();
    }
    this.polvo(x, t, 40, dx);
  }
}

/* ---------- «constelación»: nodos que derivan unidos por líneas cuando se acercan (agentes, redes, automatizaciones,
   integraciones, comunidad) ---------- */
class Constelacion extends FondoBase {
  constructor(keys, o = {}) {
    super(keys, o);
    const r = this.rnd, W = this.W, H = this.H, n = this.o.nodos || Math.round(78 * W * H / (1920 * 1080));
    this.nod = Array.from({ length: n }, () => ({ x: r() * W, y: r() * H, ax: 18 + 42 * r(), ay: 18 + 42 * r(), fx: r() * 6.28, fy: r() * 6.28, s: .5 + .9 * r(), r: 1.1 + 2 * r(), gr: r() < .12 }));
    this.R = 235 * Math.max(W, H) / 1920;
    this.paq = Array.from({ length: 7 }, () => ({ i: Math.floor(r() * n), fase: r(), v: .25 + .3 * r() }));
  }
  pintar(t, { dx = 0, dy = 0 } = {}) {
    const x = this.preparar(), k = KF(t, this.k), D = this.dist(t) / 160, br = k.brillo, P0 = this.pal, R = this.R;
    this.base(x, t, br, dx);
    const ondas = this.o.ondas.map(t0 => t - t0).filter(d => d >= 0 && d < 2.2), cx = this.W / 2, cy = this.H / 2;
    const p = this.nod.map(n => ({ x: n.x + n.ax * Math.sin(D * n.s * .5 + n.fx) + dx * .12 * n.s, y: n.y + n.ay * Math.cos(D * n.s * .42 + n.fy) + dy * .12 * n.s, n }));
    const luz = q => { let v = 0; for (const d of ondas) { const rr = 1500 * E.out3(Math.min(1, d / 1.3)); v += Math.exp(-((Math.hypot(q.x - cx, q.y - cy) - rr) ** 2) / 26000) * Math.exp(-d * 1.2); } return v; };
    const L = p.map(luz);
    x.globalCompositeOperation = 'lighter'; x.lineWidth = 1;
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
      const d = Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y); if (d > R) continue;
      const a = .2 * Math.pow(1 - d / R, 1.5) * br * (1 + 2 * (L[i] + L[j]));
      x.strokeStyle = `rgba(${P0[1]},${Math.min(1, a).toFixed(3)})`; x.beginPath(); x.moveTo(p[i].x, p[i].y); x.lineTo(p[j].x, p[j].y); x.stroke();
    }
    for (const q of this.paq) {                              // paquetes de luz hacia el vecino más cercano
      const a = p[q.i]; let b = null, bd = R;
      for (const o of p) { if (o === a) continue; const d = Math.hypot(o.x - a.x, o.y - a.y); if (d < bd) { bd = d; b = o; } }
      if (!b) continue;
      const u = (t * q.v + q.fase) % 1, px = lerp(a.x, b.x, u), py = lerp(a.y, b.y, u);
      x.fillStyle = `rgba(${P0[0]},${(.8 * Math.sin(Math.PI * u) * br).toFixed(3)})`; x.beginPath(); x.arc(px, py, 2.6, 0, 6.2832); x.fill();
    }
    p.forEach((q, i) => {
      const a = Math.min(1, (.45 + .55 * Math.sin(t * .9 + q.n.fx) ** 2) * br * (1 + 2.5 * L[i]));
      if (q.n.gr) { const g = x.createRadialGradient(q.x, q.y, 0, q.x, q.y, 26); g.addColorStop(0, `rgba(${P0[0]},${(.5 * a).toFixed(3)})`); g.addColorStop(1, `rgba(${P0[0]},0)`); x.fillStyle = g; x.fillRect(q.x - 26, q.y - 26, 52, 52); }
      x.fillStyle = `rgba(${q.n.gr ? P0[0] : '220,228,255'},${a.toFixed(3)})`; x.beginPath(); x.arc(q.x, q.y, q.n.r * (q.n.gr ? 1.5 : 1), 0, 6.2832); x.fill();
    });
    x.globalCompositeOperation = 'source-over';
  }
}

/* ---------- «liso»: degradado oscuro con halos de la paleta y grano (editorial, íntimo, cuando manda la tipografía) ---------- */
class Liso extends FondoBase {
  pintar(t, { dx = 0 } = {}) { const x = this.preparar(), k = KF(t, this.k); this.base(x, t, k.brillo * (1 + .5 * this.onda(t)), dx); this.polvo(x, t, 45, dx); }
}

/* ---------- elegir el fondo por nombre (ESTILO.fondo) ----------
   crearFondo(ESTILO.fondo, FONDOK, { ondas: [t...], paleta, direccion }) → .pintar(t, { dx, dy }); null = «puntos»
   (rejilla de puntos CSS y halos del tema oscuro). FONDOK sirve para todos: vel (26 calma; 90–150 viaje) y brillo.
   «espacio» (estrellas y suelo de rejilla) necesita ESPACIOK y recuerda al vídeo de referencia: solo si lo pide. */
function crearFondo(nombre, keys, o = {}) {
  switch (nombre || 'cortina') {
    case 'cortina': return new Cortina(keys, o);
    case 'aurora': return new Aurora(keys, o);
    case 'malla': return new Malla(keys, o);
    case 'constelacion': return new Constelacion(keys, o);
    case 'liso': return new Liso(keys, o);
    case 'espacio': return new Espacio(keys, o);
    case 'puntos': return null;
    default: console.error('fondo desconocido: ' + nombre); return new Cortina(keys, o);
  }
}
