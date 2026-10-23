'use strict';
/* =====================================================================
   motor/editorial.js — Catálogo de Piezas del Estilo Editorial / Explicativo Legal & SST («SST para Dummies»)
   Basado en la dirección de arte documental:
     - Fondo azul petróleo profundo (#04151F -> #072230) sin ruido visual
     - 3 colores semánticos limpios: Turquesa (#14B8A6), Ámbar Resaltador (#FACC15 / #F59E0B) y Blanco Puro (#FFFFFF)
   Piezas incluidas:
     1. IntroEditorialSST     — Portadilla «Bienvenidos a... para dummies» + escudo animado + iconos cotidianos
     2. ChatRumores           — Split-screen: Celular con chat de empresa (izq) + Tarjetas RUMOR/DUDA POR VERIFICAR (der)
     3. VisorNormaReal        — Documento oficial blanco con resaltador amarillo animado + redacción oculta (izq) y desglose (der)
     4. AbanicoDocumentos     — Tarjetas inclinadas (Procedimiento, Formato, Comunicado) + metáfora visual («extintor normativo»)
     5. IndiceCapitulos       — Lista numerada en cajas turquesa [1], [2], [3] con titulares limpios
   ===================================================================== */
css(`
/* Paleta y atmósfera Editorial SST */
body.editorial #fondo{background:radial-gradient(ellipse 90% 85% at 52% 46%,#082838 0%,#041722 58%,#020c13 100%) !important}
body.editorial #grid{opacity:0 !important}

/* 1. IntroEditorialSST */
.ed-intro{width:1680px;height:820px;position:relative}
.ed-intro .kicker{font:500 30px var(--sans);color:#94a3b8;letter-spacing:.01em}
.ed-intro .h1{font:800 66px/1.08 var(--sans);color:#ffffff;letter-spacing:-.02em;margin-top:8px;text-transform:uppercase}
.ed-intro .h2{font:800 132px/0.96 var(--sans);color:#14b8a6;letter-spacing:-.035em;margin-top:4px}
.ed-intro .bar-y{height:8px;width:620px;border-radius:4px;background:#eab308;margin-top:18px;transform-origin:0 50%}
.ed-intro .shield-wrap{position:absolute;right:60px;top:40px;width:360px;height:420px;display:flex;align-items:center;justify-content:center}
.ed-intro .bottom-row{position:absolute;left:0;bottom:90px;display:flex;align-items:center;gap:48px}
.ed-intro .bottom-row .txt{font:700 46px var(--sans);color:#ffffff;letter-spacing:-.015em}
.ed-intro .icons-pair{display:flex;align-items:center;gap:38px}
.ed-intro .ic-box{display:flex;flex-direction:column;align-items:center;gap:10px;color:#14b8a6;font:500 22px/1.15 var(--sans);text-align:center}
.ed-intro .ic-box span{color:#94a3b8}

/* 2. ChatRumores (Split-screen: Teléfono + Rumores por verificar) */
.ed-chat-wrap{width:1720px;height:880px;position:relative}
.ed-phone{position:absolute;left:20px;top:10px;width:540px;height:850px;border-radius:52px;background:#05131c;
  border:3px solid rgba(45,212,191,.35);overflow:hidden;box-shadow:0 40px 90px -30px rgba(0,0,0,.9)}
.ed-phone .ph-top{height:118px;background:rgba(20,184,166,.12);border-bottom:1.5px solid rgba(45,212,191,.22);
  display:flex;align-items:center;gap:20px;padding:0 34px}
.ed-phone .ph-ic{width:56px;height:56px;border-radius:50%;background:rgba(20,184,166,.2);border:1.5px solid rgba(45,212,191,.45);
  display:flex;align-items:center;justify-content:center;color:#2dd4bf}
.ed-phone .ph-tit{font:700 30px var(--sans);color:#f1f5f9}
.ed-phone .ph-sub{font:500 20px var(--sans);color:#64748b;margin-top:2px}
.ed-phone .ph-msgs{padding:26px 28px;display:flex;flex-direction:column;gap:18px}
.ed-phone .msg{display:flex;flex-direction:column;gap:6px;transform-origin:0 50%}
.ed-phone .msg .who{font:600 20px var(--sans);color:#2dd4bf;padding-left:6px}
.ed-phone .msg.alt .who{color:#f59e0b}
.ed-phone .msg .bub{padding:20px 24px;border-radius:22px;background:rgba(20,184,166,.16);border:1.5px solid rgba(45,212,191,.32);
  font:500 26px/1.28 var(--sans);color:#f1f5f9}
.ed-phone .msg.alt .bub{background:rgba(120,83,40,.22);border-color:rgba(245,158,11,.35)}

.ed-rumors{position:absolute;left:650px;top:20px;right:0;display:flex;flex-direction:column;gap:28px}
.ed-rumors .badge-fict{display:inline-flex;align-items:center;gap:12px;align-self:flex-start;padding:10px 24px;border-radius:999px;
  background:rgba(245,158,11,.08);border:1.5px solid rgba(245,158,11,.45);font:600 22px var(--sans);color:#fde68a}
.ed-rumors .badge-fict i{width:12px;height:12px;border-radius:50%;background:#f97316;display:block}
.ed-rumors .sec-lbl{font:600 25px var(--mono);letter-spacing:.14em;color:#94a3b8;text-transform:uppercase;margin-top:4px}
.ed-rumors .r-item{display:flex;align-items:flex-start;gap:26px;margin-top:8px}
.ed-rumors .r-q{width:76px;height:76px;border-radius:20px;background:rgba(245,158,11,.08);border:2px solid rgba(245,158,11,.45);
  display:flex;align-items:center;justify-content:center;font:700 34px var(--sans);color:#cbd5e1;flex:none}
.ed-rumors .r-q span{width:44px;height:44px;border-radius:50%;border:2px solid #94a3b8;display:flex;align-items:center;justify-content:center;font-size:26px}
.ed-rumors .r-tag{font:700 21px var(--mono);letter-spacing:.12em;color:#f59e0b;text-transform:uppercase}
.ed-rumors .r-txt{font:800 44px/1.15 var(--sans);color:#ffffff;margin-top:6px;letter-spacing:-.015em}

/* 3. VisorNormaReal (Documento Oficial en blanco con resaltador amarillo + Desglose a la derecha) */
.ed-doc-wrap{width:1740px;height:820px;position:relative}
.ed-doc-wrap .doc-top-lbl{font:600 23px var(--mono);letter-spacing:.14em;color:#94a3b8;text-transform:uppercase;margin-bottom:14px}
.ed-paper{position:absolute;left:0;top:46px;width:930px;background:#ffffff;color:#0f172a;border-radius:10px;
  padding:42px 48px;box-shadow:0 40px 90px -25px rgba(0,0,0,.85);font-family:var(--sans)}
.ed-paper .p-head{text-align:center;font:800 25px/1.32 var(--sans);color:#0f172a;text-transform:uppercase;margin-bottom:28px}
.ed-paper .p-row{font:500 24px/1.55 var(--sans);color:#1e293b;margin-top:10px;position:relative;display:flex;align-items:baseline;gap:14px}
.ed-paper .p-row b{font-weight:800;color:#0f172a;min-width:170px}
.ed-paper .hl{position:relative;display:inline;padding:2px 6px;z-index:1}
.ed-paper .hl i{position:absolute;left:0;top:0;bottom:0;width:100%;background:rgba(250,204,21,.55);z-index:-1;transform-origin:0 50%;border-radius:4px}
.ed-paper .redacted{display:inline-flex;align-items:center;justify-content:center;padding:4px 36px;border-radius:6px;
  background:#1e293b;color:#cbd5e1;font:600 20px var(--mono)}
.ed-paper .p-body{font:400 23px/1.52 var(--sans);color:#1e293b;margin-top:18px;text-align:left}
.ed-paper .p-body b{font-weight:800;color:#0f172a}

.ed-doc-meta{position:absolute;left:995px;top:46px;right:0;display:flex;flex-direction:column;gap:22px}
.ed-doc-meta .m-block{display:flex;flex-direction:column;gap:6px}
.ed-doc-meta .m-k{font:600 23px var(--mono);letter-spacing:.14em;color:#14b8a6;text-transform:uppercase}
.ed-doc-meta .m-k.muted{color:#94a3b8}
.ed-doc-meta .m-v1{font:800 54px/1.08 var(--sans);color:#ffffff;letter-spacing:-.02em}
.ed-doc-meta .m-sub{font:500 32px var(--sans);color:#94a3b8;margin-top:2px}
.ed-doc-meta .m-quote{font:500 40px/1.32 var(--sans);color:#f8fafc;letter-spacing:-.01em}
.ed-doc-meta .m-rad{font:500 24px var(--mono);color:#94a3b8;margin-top:8px}

.ed-doc-foot{position:absolute;left:0;bottom:20px;font:500 23px var(--sans);color:#94a3b8;display:flex;align-items:center;gap:14px}
.ed-doc-foot::before{content:'—';color:#14b8a6;font-weight:800}

/* 4. AbanicoDocumentos + Metáfora Visual («extintor normativo») */
.ed-fan-wrap{width:1680px;height:780px;position:relative}
.ed-fan-wrap .fan-title{font:800 56px/1.15 var(--sans);color:#ffffff;letter-spacing:-.02em;max-width:1100px}
.ed-fan-wrap .fan-title b{color:#14b8a6}
.ed-fan-cards{position:absolute;left:40px;top:210px;display:flex;gap:34px}
.ed-fcard{width:340px;height:440px;border-radius:24px;background:rgba(13,42,58,.75);border:2px solid rgba(45,212,191,.28);
  padding:42px 34px;display:flex;flex-direction:column;gap:24px;box-shadow:0 30px 60px -20px rgba(0,0,0,.75)}
.ed-fcard .fc-ic{color:#14b8a6}
.ed-fcard .fc-t{font:800 36px var(--sans);color:#ffffff}
.ed-fcard .fc-lines{display:flex;flex-direction:column;gap:16px;margin-top:8px}
.ed-fcard .fc-lines i{display:block;height:10px;border-radius:5px;background:rgba(148,163,184,.25)}
.ed-metaphor{position:absolute;right:120px;top:220px;display:flex;flex-direction:column;align-items:center;gap:20px}
.ed-metaphor .m-lbl{font:600 26px/1.2 var(--sans);color:#94a3b8;text-align:center}

/* 5. IndiceCapitulos (Cajas numeradas 1, 2, 3 estilo SST para Dummies) */
.ed-idx-wrap{width:1580px;display:flex;flex-direction:column;gap:48px}
.ed-idx-item{display:flex;align-items:center;gap:38px}
.ed-idx-num{width:116px;height:116px;border-radius:28px;background:rgba(20,184,166,.12);border:2.5px solid #14b8a6;
  display:flex;align-items:center;justify-content:center;font:800 58px var(--sans);color:#14b8a6;flex:none;
  box-shadow:0 20px 50px -18px rgba(20,184,166,.45)}
.ed-idx-txt{font:800 56px/1.15 var(--sans);color:#ffffff;letter-spacing:-.02em}
`);

/* ---------- 1. Portadilla Editorial («Bienvenidos a SEGURIDAD Y SALUD EN EL TRABAJO para dummies») ---------- */
class IntroEditorialSST {
  constructor(o = {}) {
    this.o = {
      kicker: 'Bienvenidos a',
      titulo: 'SEGURIDAD Y SALUD EN EL TRABAJO',
      serie: 'para dummies',
      fraseAbajo: 'Para entender estos temas',
      t0: 0.2,
      tSerie: 1.0,
      tAbajo: 2.2,
      sal: null,
      ...o
    };
    const O = this.o;
    this.el = mk('div', 'L ed-intro z4', WORLD, `
      <div class="kicker">${O.kicker}</div>
      <div class="h1">${O.titulo}</div>
      <div class="h2">${O.serie}</div>
      <div class="bar-y"></div>
      <div class="shield-wrap">
        <svg viewBox="0 0 24 24" width="330" height="330" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path class="sh-out" pathLength="1" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" stroke="#14b8a6" stroke-width="1.4"/>
          <path class="sh-chk" pathLength="1" d="m9 12 2.2 2.2 4.8-4.8" stroke="#eab308" stroke-width="1.8"/>
        </svg>
      </div>
      <div class="bottom-row">
        <div class="txt">${O.fraseAbajo}</div>
        <div class="icons-pair">
          <div class="ic-box">
            <svg viewBox="0 0 64 64" width="68" height="68" fill="none" stroke="currentColor" stroke-width="3">
              <rect x="10" y="8" width="44" height="48" rx="4" stroke="#14b8a6"/>
              <line x1="18" y1="16" x2="46" y2="44" stroke="#f59e0b" stroke-width="4"/>
              <line x1="46" y1="16" x2="18" y2="44" stroke="#f59e0b" stroke-width="4"/>
            </svg>
            <span>diccionario<br>jurídico</span>
          </div>
          <div class="ic-box">
            <svg viewBox="0 0 64 64" width="68" height="68" fill="none" stroke="#14b8a6" stroke-width="3" stroke-linecap="round">
              <path d="M14 26h28v14a14 14 0 0 1-28 0V26z"/>
              <path d="M42 30h6a6 6 0 0 1 0 12h-6"/>
              <path d="M24 14v6M32 12v8"/>
            </svg>
            <span>café</span>
          </div>
        </div>
      </div>
    `);
    this.bar = this.el.querySelector('.bar-y');
    this.h2 = this.el.querySelector('.h2');
    this.bot = this.el.querySelector('.bottom-row');
    this.shOut = this.el.querySelector('.sh-out');
    this.shChk = this.el.querySelector('.sh-chk');
    sonar(o, O.t0, 'aire', .6);
    sonar(o, O.tSerie, 'golpe-corto', .75);
    sonar(o, O.tAbajo, 'tick', .65);
  }
  pintar(t, { x = CX, y = CY, o = 1 } = {}) {
    const O = this.o, pe = P(t, O.t0, .45, E.out4), q = O.sal != null ? P(t, O.sal, .35, E.in3) : 0;
    if (pe <= 0 || q >= 1 || o <= .002) { off(this.el); return; }
    const ps = P(t, O.tSerie, .5, E.out4);
    this.h2.style.opacity = ps.toFixed(3);
    this.h2.style.transform = `translateY(${((1 - ps) * 24).toFixed(1)}px)`;
    this.bar.style.transform = `scaleX(${P(t, O.tSerie + .18, .55, E.out4).toFixed(3)})`;

    const pSh = P(t, O.t0 + .2, .8, E.out3), pCk = P(t, O.tSerie + .25, .45, E.out3);
    this.shOut.style.strokeDasharray = pSh >= 1 ? 'none' : '1 2';
    this.shOut.style.strokeDashoffset = (1 - pSh).toFixed(3);
    this.shChk.style.strokeDasharray = pCk >= 1 ? 'none' : '1 2';
    this.shChk.style.strokeDashoffset = (1 - pCk).toFixed(3);

    const pb = P(t, O.tAbajo, .45, E.out4);
    this.bot.style.opacity = pb.toFixed(3);
    this.bot.style.transform = `translateY(${((1 - pb) * 20).toFixed(1)}px)`;

    put(this.el, { x, y, o: pe * (1 - q) * o, b: (1 - pe) * 6 + q * 6 });
  }
}

/* ---------- 2. Chat de Empresa vs. Rumores por Verificar (Split-Screen) ---------- */
class ChatRumores {
  constructor(o = {}) {
    this.o = {
      grupo: 'Grupo de la empresa',
      subGrupo: 'recreación ficticia',
      aviso: 'Recreación ficticia · sin datos reales',
      cabeceraDerecha: 'LO QUE CIRCULA EN EL GRUPO',
      mensajes: [], // [{ quien, texto, t0, alt: false }]
      rumores: [],  // [{ tipo: 'RUMOR · POR VERIFICAR', texto: '«Se cayó la resolución»', t0 }]
      t0: 0,
      sal: null,
      ...o
    };
    const O = this.o;
    this.el = mk('div', 'L ed-chat-wrap z4', WORLD, `
      <div class="ed-phone">
        <div class="ph-top">
          <div class="ph-ic">${icon('messageSquare', 28, 2)}</div>
          <div><div class="ph-tit">${O.grupo}</div><div class="ph-sub">${O.subGrupo}</div></div>
        </div>
        <div class="ph-msgs">
          ${O.mensajes.map(m => `<div class="msg ${m.alt ? 'alt' : ''}"><span class="who">${m.quien}</span><div class="bub">${m.texto}</div></div>`).join('')}
        </div>
      </div>
      <div class="ed-rumors">
        <div class="badge-fict"><i></i><span>${O.aviso}</span></div>
        <div class="sec-lbl">${O.cabeceraDerecha}</div>
        ${O.rumores.map(r => `
          <div class="r-item">
            <div class="r-q"><span>?</span></div>
            <div>
              <div class="r-tag">${r.tipo || 'RUMOR · POR VERIFICAR'}</div>
              <div class="r-txt">${r.texto}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `);
    this.msgs = [...this.el.querySelectorAll('.msg')];
    this.rums = [...this.el.querySelectorAll('.r-item')];
    O.mensajes.forEach(m => sonar(o, m.t0, 'tick-suave', .65, -0.35));
    O.rumores.forEach(r => sonar(o, r.t0, 'tick', .75, 0.35));
  }
  pintar(t, { x = CX, y = CY, o = 1 } = {}) {
    const O = this.o, pe = P(t, O.t0, .45, E.out4), q = O.sal != null ? P(t, O.sal, .35, E.in3) : 0;
    if (pe <= 0 || q >= 1 || o <= .002) { off(this.el); return; }
    O.mensajes.forEach((m, i) => {
      const p = P(t, m.t0, .38, E.back);
      this.msgs[i].style.opacity = clamp(p * 2).toFixed(3);
      this.msgs[i].style.transform = `translateY(${((1 - p) * 18).toFixed(1)}px) scale(${lerp(.9, 1, p).toFixed(3)})`;
    });
    O.rumores.forEach((r, i) => {
      const p = P(t, r.t0, .42, E.out4);
      this.rums[i].style.opacity = clamp(p * 2).toFixed(3);
      this.rums[i].style.transform = `translateX(${((1 - p) * 32).toFixed(1)}px)`;
    });
    put(this.el, { x, y, o: pe * (1 - q) * o, b: (1 - pe) * 6 + q * 6 });
  }
}

/* ---------- 3. Visor de Documento Oficial Real con Resaltador Amarillo Animado + Desglose ---------- */
class VisorNormaReal {
  constructor(o = {}) {
    this.o = {
      etiquetaDoc: 'DOCUMENTO REAL · PÁG. 1',
      encabezadoDoc: ['CONSEJO DE ESTADO', 'SALA DE LO CONTENCIOSO ADMINISTRATIVO', 'SECCIÓN SEGUNDA · SUBSECCIÓN A'],
      ponente: '',
      filas: [],     // [{ k, v, resaltado: false, tResaltado: null, oculto: false }]
      parrafos: [],  // [{ html: '<b>PRIMERO.</b> <span class="hl"><i></i>texto resaltado</span>...', tResaltado }]
      bloquesDerecha: [], // [{ k, v, sub, cita, rad, t0 }]
      pieFuente: '',
      t0: 0,
      sal: null,
      ...o
    };
    const O = this.o;
    this.el = mk('div', 'L ed-doc-wrap z4', WORLD, `
      <div class="doc-top-lbl">${O.etiquetaDoc}</div>
      <div class="ed-paper">
        <div class="p-head">${O.encabezadoDoc.join('<br>')}</div>
        ${O.ponente ? `<div style="text-align:center;font:800 22px var(--sans);margin-bottom:20px">${O.ponente}</div>` : ''}
        ${O.filas.map(f => `
          <div class="p-row">
            ${f.k ? `<b>${f.k}</b>` : ''}
            ${f.oculto ? `<span class="redacted">${f.v || 'dato personal oculto'}</span>` :
              f.resaltado ? `<span class="hl"><i data-thl="${f.tResaltado ?? (O.t0 + .6)}"></i>${f.v}</span>` : `<span>${f.v}</span>`}
          </div>
        `).join('')}
        ${O.parrafos.map(p => `<div class="p-body">${p.html}</div>`).join('')}
      </div>
      <div class="ed-doc-meta">
        ${O.bloquesDerecha.map(b => `
          <div class="m-block">
            <div class="m-k ${b.muted ? 'muted' : ''}">${b.k}</div>
            ${b.v ? `<div class="m-v1">${b.v}</div>` : ''}
            ${b.sub ? `<div class="m-sub">${b.sub}</div>` : ''}
            ${b.cita ? `<div class="m-quote">${b.cita}</div>` : ''}
            ${b.rad ? `<div class="m-rad">${b.rad}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ${O.pieFuente ? `<div class="ed-doc-foot">${O.pieFuente}</div>` : ''}
    `);
    this.hls = [...this.el.querySelectorAll('.hl i')];
    this.mblocks = [...this.el.querySelectorAll('.m-block')];
    sonar(o, O.t0, 'aire', .7);
    O.bloquesDerecha.forEach(b => sonar(o, b.t0, 'tick', .7));
  }
  pintar(t, { x = CX, y = CY, o = 1 } = {}) {
    const O = this.o, pe = P(t, O.t0, .48, E.out4), q = O.sal != null ? P(t, O.sal, .35, E.in3) : 0;
    if (pe <= 0 || q >= 1 || o <= .002) { off(this.el); return; }
    this.hls.forEach(h => {
      const th = +(h.dataset.thl || (O.t0 + .6));
      const ph = P(t, th, .5, E.io3);
      h.style.transform = `scaleX(${ph.toFixed(3)})`;
    });
    O.bloquesDerecha.forEach((b, i) => {
      const pb = P(t, b.t0 ?? (O.t0 + .2 + i * .35), .42, E.out4);
      this.mblocks[i].style.opacity = pb.toFixed(3);
      this.mblocks[i].style.transform = `translateY(${((1 - pb) * 20).toFixed(1)}px)`;
    });
    put(this.el, { x, y, o: pe * (1 - q) * o, b: (1 - pe) * 6 + q * 6 });
  }
}

/* ---------- 4. Abanico de Documentos + Metáfora Visual («extintor normativo») ---------- */
class AbanicoDocumentos {
  constructor(o = {}) {
    this.o = {
      tituloHtml: '¿Ya piensas en los <b>documentos</b> que tendrías que cambiar?',
      tarjetas: ['Procedimiento', 'Formato', 'Comunicado'],
      etiquetaMetafora: '«extintor<br>normativo»',
      t0: 0,
      tMetafora: 1.2,
      sal: null,
      ...o
    };
    const O = this.o;
    const angles = [-2.5, 0, 2.5];
    this.el = mk('div', 'L ed-fan-wrap z4', WORLD, `
      <div class="fan-title">${O.tituloHtml}</div>
      <div class="ed-fan-cards">
        ${O.tarjetas.map((nm, i) => `
          <div class="ed-fcard" style="transform:rotate(${angles[i % 3]}deg)">
            <div class="fc-ic">${icon('fileText', 54, 1.8)}</div>
            <div class="fc-t">${nm}</div>
            <div class="fc-lines">
              <i style="width:92%"></i>
              <i style="width:78%"></i>
              <i style="width:85%"></i>
              <i style="width:55%"></i>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="ed-metaphor">
        <svg viewBox="0 0 160 280" width="160" height="270">
          <rect x="58" y="18" width="44" height="14" rx="4" fill="#64748b"/>
          <rect x="70" y="32" width="20" height="26" fill="#475569"/>
          <path d="M90 26 Q128 32 134 68" stroke="#475569" stroke-width="10" fill="none" stroke-linecap="round"/>
          <rect x="36" y="56" width="88" height="190" rx="38" fill="#dc2626"/>
          <rect x="36" y="118" width="88" height="52" fill="#f1f5f9"/>
          <text x="80" y="151" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="21" fill="#0f172a">NORMA</text>
        </svg>
        <div class="m-lbl">${O.etiquetaMetafora}</div>
      </div>
    `);
    this.cards = [...this.el.querySelectorAll('.ed-fcard')];
    this.meta = this.el.querySelector('.ed-metaphor');
    sonar(o, O.t0, 'aire', .65);
    O.tarjetas.forEach((_, i) => sonar(o, O.t0 + .25 + i * .18, 'tick', .65));
    sonar(o, O.tMetafora, 'nota', .75);
  }
  pintar(t, { x = CX, y = CY, o = 1 } = {}) {
    const O = this.o, pe = P(t, O.t0, .45, E.out4), q = O.sal != null ? P(t, O.sal, .35, E.in3) : 0;
    if (pe <= 0 || q >= 1 || o <= .002) { off(this.el); return; }
    const angles = [-2.5, 0, 2.5];
    this.cards.forEach((c, i) => {
      const pc = P(t, O.t0 + .2 + i * .18, .45, E.back);
      c.style.opacity = clamp(pc * 2).toFixed(3);
      c.style.transform = `translateY(${((1 - pc) * 35).toFixed(1)}px) rotate(${angles[i % 3]}deg) scale(${lerp(.85, 1, pc).toFixed(3)})`;
    });
    const pm = P(t, O.tMetafora, .45, E.back);
    this.meta.style.opacity = clamp(pm * 2).toFixed(3);
    this.meta.style.transform = `scale(${lerp(.6, 1, pm).toFixed(3)})`;
    put(this.el, { x, y, o: pe * (1 - q) * o, b: (1 - pe) * 6 + q * 6 });
  }
}

/* ---------- 5. Índice de Capítulos Numerado ([1], [2], [3]) ---------- */
class IndiceCapitulos {
  constructor(items, o = {}) {
    this.items = items; // [{ num: 1, texto: 'Qué decidió realmente el Consejo de Estado', t0 }]
    this.o = { t0: items[0]?.t0 ?? 0, sal: null, ...o };
    this.el = mk('div', 'L ed-idx-wrap z4', WORLD, items.map((it, i) => `
      <div class="ed-idx-item">
        <div class="ed-idx-num">${it.num ?? (i + 1)}</div>
        <div class="ed-idx-txt">${it.texto}</div>
      </div>
    `).join(''));
    this.rows = [...this.el.querySelectorAll('.ed-idx-item')];
    items.forEach(it => sonar(o, it.t0, 'tick', .75));
  }
  pintar(t, { x = CX, y = CY, o = 1 } = {}) {
    const O = this.o, pe = P(t, O.t0 - .1, .4, E.out4), q = O.sal != null ? P(t, O.sal, .35, E.in3) : 0;
    if (pe <= 0 || q >= 1 || o <= .002) { off(this.el); return; }
    this.items.forEach((it, i) => {
      const p = P(t, it.t0, .45, E.out4);
      this.rows[i].style.opacity = clamp(p * 2).toFixed(3);
      this.rows[i].style.transform = `translateX(${((1 - p) * -36).toFixed(1)}px)`;
    });
    put(this.el, { x, y, o: pe * (1 - q) * o, b: (1 - pe) * 6 + q * 6 });
  }
}
