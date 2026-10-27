import{cN as Ms,r as i,j as e,i0 as Va,bp as ge,iy as _e,fO as Se,bF as Bt,cP as _t,db as Ra,bq as W,cO as $a,bw as Ls,bD as Kt,cc as Ua,bl as ct,el as Ds,bu as ut,a$ as Is,bN as Os,dT as le,gn as Vs,bB as ke,bC as Ba,bx as Rs,i1 as $s,gV as Us,b5 as lt,bX as De,cu as _a,fn as Bs,cx as _s,c4 as Fa,h2 as Fs,bv as Gt,ef as xt,fk as Ha,fl as Hs,iz as Ws,ir as Ka}from"./vendor.CXZFIMv4.js";import{u as Ks}from"./routing.DyDPih-s.js";import{u as Gs,ah as qs,a as Ys,c as f,aK as y}from"./ambassadors-module.CeUrs_PW.js";import"./utilities.BjsdvwEO.js";import{O as Js}from"./blog-modules.BuEqnTgz.js";import"./react-interactions.BoTI7xT5.js";import{M as Xs}from"./sgsst-modules.BEvjUX0w.js";import"./markdown_highlight.BXMLVVdG.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./tanstack-vendor.PchyPllz.js";import"./http-client.DsIuEJOG.js";import"./heic-converter.BhQCFQ0l.js";import"./forms.D_dmDuQm.js";import"./radix-ui.CrDY0lmB.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.5PbWSYdT.js";import"./animations.Gu3lWXir.js";import"./virtualization.DZVj7G9u.js";import"./headlessui.B6qAI1VT.js";import"./framer-motion.DsLgSzd-.js";import"./i18n.1l7KJZIb.js";import"./date-utils.X8D4nCrw.js";import"./sgsst-assets.KdMSUpxn.js";import"./security-ui.C1by4IWn.js";import"./kanban-module.C-GmhWBD.js";import"./plans-module.CIxqIwHd.js";import"./lms-modules.CFoH48gr.js";import"./markdown-processing.CcXGUTzS.js";import"./events-modules.B8TUjKYr.js";const Zs="wappy-studio-media",Qs=1,mt="blobs";let Fe=null;function er(){return Fe||(Fe=new Promise((d,p)=>{if(typeof indexedDB>"u"){p(new Error("IndexedDB no disponible en este navegador."));return}const l=indexedDB.open(Zs,Qs);l.onupgradeneeded=()=>{const m=l.result;m.objectStoreNames.contains(mt)||m.createObjectStore(mt)},l.onsuccess=()=>d(l.result),l.onerror=()=>{Fe=null,p(l.error)}}),Fe)}function bt(d,p){return er().then(l=>new Promise((m,R)=>{const w=l.transaction(mt,d),h=p(w.objectStore(mt));h.onsuccess=()=>m(h.result),h.onerror=()=>R(h.error)}))}async function Ne(d,p){await bt("readwrite",l=>l.put(p,d))}async function He(d){try{return await bt("readonly",l=>l.get(d))??null}catch{return null}}async function tr(d){try{await bt("readwrite",p=>p.delete(d))}catch{}}async function ar(){try{await bt("readwrite",d=>d.clear())}catch{}}function dt(d,p="audio/wav"){const l=d.replace(/^data:[^;]+;base64,/,""),m=window.atob(l),R=new Uint8Array(m.length);for(let w=0;w<m.length;w++)R[w]=m.charCodeAt(w);return new Blob([R],{type:p})}var sr={};const Ft={"gemini-3.8-flash-tts":{id:"gemini-3.8-flash-tts",name:"Gemini 3.8 Flash TTS",badge:"Recomendado / Cuota Activa",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"✓ Activo (14 voces)",description:"Máxima fluidez natural, diseño de voz, vocal bursts (<breath>, <laugh>) y soporte para las 14 voces.",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-3.1-flash-tts-preview":{id:"gemini-3.1-flash-tts-preview",name:"Gemini 3.1 Flash TTS Preview",badge:"Preview 3.1 / Cuota Activa",badgeColor:"bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:"Arquitectura Gemini 3.1 con prosodia refinada, tono expresivo y respuesta ágil (14 voces).",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-2.5-flash-preview-tts":{id:"gemini-2.5-flash-preview-tts",name:"Gemini 2.5 Flash TTS",badge:"Reemplazo de 2.5 Pro",badgeColor:"bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",rateLimitLabel:"3 RPM • 10 RPD (2.5 Pro: 0/0)",quotaLabel:"5 voces",description:"Reemplazo oficial y funcional de 2.5 Pro (no disponible en API). Activa únicamente las 5 voces fundamentales.",supportsMultiSpeaker:!0,supportsVocalBursts:!1,supportedVoices:["Kore","Puck","Charon","Fenrir","Aoede"]},"gemini-3.8-flash-lite-tts":{id:"gemini-3.8-flash-lite-tts",name:"Gemini 3.8 Flash-Lite TTS",badge:"Ultra Rápido",badgeColor:"bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",rateLimitLabel:"Baja Latencia",quotaLabel:"6 voces",description:"Optimizado para lecturas masivas con mínima latencia continua (6 voces rápidas).",supportsMultiSpeaker:!1,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Aoede"]}},rr=[{id:"Kore",name:"Kore",gender:"Femenino",tone:"Cálida, Serena y Profesional",recommendedFor:"Audiolibros, Narración, Tutoriales, Inducción SST",tag:"Más popular"},{id:"Puck",name:"Puck",gender:"Masculino",tone:"Enérgico, Dinámico y Joven",recommendedFor:"Podcasts, Reels, Contenido Creativo, Diálogos",tag:"Muy expresivo"},{id:"Charon",name:"Charon",gender:"Masculino",tone:"Barítono, Grave, Maduro y Solemne",recommendedFor:"Documentales, Historia, Suspenso, Directivos",tag:"Voz profunda"},{id:"Fenrir",name:"Fenrir",gender:"Masculino",tone:"Claro, Elocuente y Periodístico",recommendedFor:"Noticias, Informes, Presentaciones, Boletines",tag:"Profesional"},{id:"Zephyr",name:"Zephyr",gender:"Femenino",tone:"Dulce, Aterciopelada y Relajante",recommendedFor:"Meditación, ASMR, Cuentos, Bienestar",tag:"Calma"},{id:"Orus",name:"Orus",gender:"Masculino",tone:"Firme, Imperial, Épico y Reflexivo",recommendedFor:"Ficción Épica, Liderazgo, Ensayos, Cultura Vial",tag:"Imperial"},{id:"Aoede",name:"Aoede",gender:"Femenino",tone:"Melódica, Expresiva, Artística y Cálida",recommendedFor:"Poesía, Literatura, Storytelling, Sensibilización",tag:"Melódica"},{id:"Leda",name:"Leda",gender:"Femenino",tone:"Cercana, Maternal, Madura y Envolvente",recommendedFor:"Audiolibros Largos, Relatos, Bienvenida",tag:"Narradora"},{id:"Callisto",name:"Callisto",gender:"Femenino",tone:"Elegante, Sofisticada y Articulada",recommendedFor:"Divulgación Científica, Conferencias, Auditorías",tag:"Sofisticada"},{id:"Europa",name:"Europa",gender:"Femenino",tone:"Brillante, Luminosa, Alegre y Asertiva",recommendedFor:"Marketing, Anuncios, E-Learning, Campañas",tag:"Enérgica"},{id:"Ganymede",name:"Ganymede",gender:"Masculino",tone:"Resonante, Equilibrado, Sabio y Seguro",recommendedFor:"Educación Superior, Cursos, Capacitación Técnica",tag:"Resonante"},{id:"Io",name:"Io",gender:"Femenino",tone:"Vivaz, Espontánea, Fresca y Amigable",recommendedFor:"Redes Sociales, Vlogs, Asistentes, Reels",tag:"Fresca"},{id:"Titan",name:"Titan",gender:"Masculino",tone:"Imponente, Cinematográfico y Potente",recommendedFor:"Tráilers, Introducciones, Impacto, Alertas",tag:"Cinematográfica"},{id:"Prometheus",name:"Prometheus",gender:"Masculino",tone:"Noble, Pensativo, Filosófico y Clásico",recommendedFor:"Filosofía, Análisis Profundo, Crónicas",tag:"Sabio"}],nr=[{id:"orus-solemn",name:"Narración Solemne (Orus)",voiceName:"Orus",style:"Voz firme, templada, reflexiva y madura de narrador de crónica histórica, dicción solemne, pausas medidas y respiraciones naturales.",speed:"0.95x"},{id:"aoede-poetic",name:"Cuento Poético (Aoede)",voiceName:"Aoede",style:"Voz melódica, cálida, expresiva y artística para relato literario y sensibilización, con matices emocionales suaves.",speed:"0.95x"},{id:"titan-trailer",name:"Tráiler Cinematográfico (Titan)",voiceName:"Titan",style:"Voz imponente, profunda, cinematográfica y épica de tráiler de película, con pausas dramáticas e impacto.",speed:"0.95x"},{id:"kore-audiobook",name:"Narrador de Audiolibro (Kore)",voiceName:"Kore",style:"Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.",speed:"1.0x"},{id:"puck-podcast",name:"Host de Podcast Dinámico (Puck)",voiceName:"Puck",style:"Host de podcast carismático, enérgico, cercano y espontáneo, con entonación conversacional moderna.",speed:"1.05x"},{id:"charon-documentary",name:"Documental Profundo (Charon)",voiceName:"Charon",style:"Tono barítono, solemne, reflexivo y cinematográfico de narrador de documental, con pausas medidas.",speed:"0.95x"},{id:"fenrir-news",name:"Noticiero Profesional (Fenrir)",voiceName:"Fenrir",style:"Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.",speed:"1.05x"},{id:"zephyr-asmr",name:"Meditación y ASMR (Zephyr)",voiceName:"Zephyr",style:"Voz suave, serena, dulce y sumamente relajante para meditación guiada, mindfulness y bienestar.",speed:"0.9x"},{id:"screenplay-dialogue",name:"Guion / Diálogo Alex & Sam",voiceName:"Kore",multiSpeaker:!0,speaker1:{name:"Alex",voiceName:"Puck",style:"Entusiasta y curioso"},speaker2:{name:"Sam",voiceName:"Kore",style:"Experta, clara y cercana"},style:"Diálogo interactivo de podcast entre dos especialistas con alternancia natural.",speed:"1.0x"}],ir=[{tag:"<breath>",label:"Respiración natural",description:"Inserta una toma de aire orgánica entre frases"},{tag:"<laugh>",label:"Risa / Carcajada",description:"Añade una risa espontánea o carcajada suave"},{tag:"<gasp>",label:"Sorpresa / Jadear",description:"Efecto de inhalación rápida de asombro"},{tag:"|mhm|",label:"Asentimiento (|mhm|)",description:"Confirmación conversacional natural"},{tag:"|yeah|",label:"Aceptación (|yeah|)",description:"Interjección de acuerdo en diálogos"}],Ht=[{title:"Inducción SST: 5 Reglas de Oro en Riesgo Eléctrico",text:`¡Atención equipo! Antes de intervenir cualquier tablero o red eléctrica, recuerda que tu vida depende de las Cinco Reglas de Oro. <breath>

Primero: Cortar de forma efectiva todas las fuentes de tensión. Segundo: Bloquear y etiquetar los aparatos de corte con tu candado personal LOTO. <breath>

Tercero: Verificar la ausencia de tensión con un detector calibrado. Cuarto: Poner a tierra y en cortocircuito todas las posibles fuentes de corriente. Y quinto: Delimitar y señalizar la zona de trabajo. <breath>

En WAPPY IA cuidamos lo más valioso: que regreses sano y salvo a casa.`},{title:"Reel Viral Estilo Claude: Cómo la IA transforma el SG-SST",text:`¿Todavía llevas tu matriz de peligros y tus inspecciones en hojas de cálculo infinitas? <breath>

Mira cómo cambia todo cuando conectas Inteligencia Artificial en tiempo real. En menos de diez segundos, analizamos los riesgos bajo la guía GTC 45, generamos controles operativos y notificamos a cada trabajador en su celular. <breath>

Menos papeleo mecánico y más prevención real en planta. <laugh> Pruébalo hoy mismo en WAPPY Studio.`},{title:"Podcast Dual (Alex & Sam): El Futuro de la Prevención",text:`Alex: ¡Hola a todos y bienvenidos a un nuevo episodio de Pulso Preventivo! <breath> Hoy hablaremos sobre cómo las voces neuronales y el video interactivo están revolucionando las capacitaciones.

Sam: Totalmente de acuerdo, Alex. |yeah| Lo más impresionante es que los trabajadores ya no se aburren con diapositivas estáticas. <laugh> Ahora reciben cápsulas dinámicas con voz natural.

Alex: Exacto. |mhm| Además, podemos generar desde un reel de un minuto hasta un audiolibro formativo de una hora continua sin cortes.

Sam: Sin duda es un salto enorme para la cultura de seguridad en toda Latinoamérica.`},{title:"Pausa Activa & Regulación Emocional (Bienestar)",text:`Haz una pausa por un instante... y suelta los hombros. <breath>

Inhala profundamente por la nariz durante cuatro segundos, sintiendo cómo el aire renueva tu energía... <breath>

Ahora exhala suavemente, liberando la tensión acumulada frente a la pantalla. <breath>

Tu bienestar mental y físico es la base de un entorno laboral saludable y seguro.`}],or=[{id:"golden-rules",name:"⚡ Reglas de Oro Glass",badge:"Estilo Claude",description:"Tarjeta hero con barra de progreso e indicadores clave en cristal."},{id:"kpi-hud",name:"📊 Dashboard KPIs & HUD",badge:"Ejecutivo",description:"Métricas ejecutivas animadas con barras comparativas y telemetría."},{id:"alert-sst",name:"🚨 Alerta & Checklist 1-2-3",badge:"Prevención",description:"Pasos numerados de seguridad con entrada secuencial elástica."},{id:"camera-overlay",name:"🎬 Lower-Third (Video Propio)",badge:"Transparente",description:"Capas limpias en tercio superior e inferior para dejar libre tu rostro."}];function Wa({aspectRatio:d="9:16",hasBaseVideo:p=!1,badgeText:l="CÁPSULA INTERACTIVA WAPPY",headline:m="5 Reglas de Oro en Seguridad",subheadline:R="Prevención inteligente en tiempo real con WAPPY Studio",accentColor:w="#14b8a6",templateId:h="golden-rules"}){const j=d==="9:16",Q=l.replace(/</g,"&lt;"),K=m.replace(/</g,"&lt;"),L=R.replace(/</g,"&lt;"),v=p||h==="camera-overlay";let q="";return h==="kpi-hud"?q=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${j?"p-5":"p-4"} border-t-2" style="border-top-color: ${w};">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-mono uppercase tracking-wider text-teal-400">📊 TELEMETRÍA PREVENTIVA</span>
          <span class="text-[11px] font-mono font-bold text-emerald-400">▲ +98.4% EFECTIVIDAD</span>
        </div>
        <h1 class="${j?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight text-white">
          ${K}
        </h1>
        <p class="text-xs text-slate-300 mt-1">${L}</p>
        <div class="mt-4 space-y-2.5">
          <div>
            <div class="flex justify-between text-[11px] font-bold mb-1">
              <span class="text-slate-300">Controles Operativos Verificados</span>
              <span class="text-teal-300 font-mono">96%</span>
            </div>
            <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div id="accent-bar" class="h-full rounded-full" style="width: 96%; background: linear-gradient(90deg, ${w}, #34d399);"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-[11px] font-bold mb-1">
              <span class="text-slate-300">Reducción de Incidentes Críticos</span>
              <span class="text-amber-300 font-mono">100%</span>
            </div>
            <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full" style="width: 100%; background: linear-gradient(90deg, #f59e0b, #10b981);"></div>
            </div>
          </div>
        </div>
      </div>`:h==="alert-sst"?q=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${j?"p-5":"p-4"} border-l-4" style="border-left-color: #f59e0b;">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
          ⚠️ PROTOCOLO OBLIGATORIO EN PLANTA
        </div>
        <h1 class="${j?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight text-white">
          ${K}
        </h1>
        <p class="text-xs text-slate-300 mt-1">${L}</p>
      </div>
      <div class="w-full grid grid-cols-1 gap-2" id="metrics-row">
        <div data-editable="true" class="metric-item glass-card rounded-2xl p-3 flex items-center gap-3">
          <span class="w-7 h-7 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 font-mono font-black text-xs flex items-center justify-center shrink-0">01</span>
          <span class="text-xs font-bold text-white">Aislar y bloquear todas las fuentes de energía (LOTO)</span>
        </div>
        <div data-editable="true" class="metric-item glass-card rounded-2xl p-3 flex items-center gap-3">
          <span class="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-black text-xs flex items-center justify-center shrink-0">02</span>
          <span class="text-xs font-bold text-white">Verificar ausencia de tensión con equipo calibrado</span>
        </div>
        <div data-editable="true" class="metric-item glass-card rounded-2xl p-3 flex items-center gap-3">
          <span class="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-mono font-black text-xs flex items-center justify-center shrink-0">03</span>
          <span class="text-xs font-bold text-white">Delimitar, señalizar y autorizar permiso de trabajo</span>
        </div>
      </div>`:h==="camera-overlay"?q=`
      <div class="my-auto"></div>
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-2xl p-4 border-l-4" style="border-left-color: ${w};">
        <div class="text-[10px] font-mono uppercase tracking-widest text-teal-300 font-extrabold">${Q}</div>
        <h1 class="text-lg sm:text-xl font-black text-white leading-snug mt-0.5">${K}</h1>
        <p class="text-xs text-slate-300 mt-0.5">${L}</p>
      </div>`:q=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${j?"p-5 sm:p-6":"p-4 sm:p-5"} border-l-4" style="border-left-color: ${w};">
        <div class="text-xs font-mono uppercase tracking-wider text-teal-400 mb-1">⚡ PUNTO CLAVE EN VIVO</div>
        <h1 class="${j?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight tracking-tight text-white">
          ${K}
        </h1>
        <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed font-medium">
          ${L}
        </p>
        <div class="mt-3.5 h-1.5 w-full bg-slate-800/90 rounded-full overflow-hidden">
          <div id="accent-bar" class="h-full rounded-full" style="width: 100%; background: linear-gradient(90deg, ${w}, #fbbf24);"></div>
        </div>
      </div>

      <div class="w-full grid grid-cols-3 gap-2 sm:gap-2.5" id="metrics-row">
        <div data-editable="true" class="metric-item glass-card rounded-2xl ${j?"p-2.5 sm:p-3":"p-2.5"} text-center">
          <div class="${j?"text-base sm:text-lg":"text-sm sm:text-base"} font-black text-emerald-400">100%</div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">Cumplimiento</div>
        </div>
        <div data-editable="true" class="metric-item glass-card rounded-2xl ${j?"p-2.5 sm:p-3":"p-2.5"} text-center">
          <div class="${j?"text-base sm:text-lg":"text-sm sm:text-base"} font-black text-amber-400">60 FPS</div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">Motion HTML</div>
        </div>
        <div data-editable="true" class="metric-item glass-card rounded-2xl ${j?"p-2.5 sm:p-3":"p-2.5"} text-center">
          <div class="${j?"text-base sm:text-lg":"text-sm sm:text-base"} font-black text-indigo-400">IA 3.8</div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">Voz Neural</div>
        </div>
      </div>`,`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: ${v?"transparent":"#060d14"};
      color: #ffffff;
    }
    .grid-bg {
      background-image: radial-gradient(rgba(20, 184, 166, 0.16) 1px, transparent 1px);
      background-size: 28px 28px;
    }
    .glass-card {
      background: rgba(10, 18, 30, 0.82);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
    }
  </style>
</head>
<body class="relative w-full h-full flex flex-col justify-between items-center ${j?"p-4 sm:p-5":"p-4 sm:p-6"} select-none overflow-hidden">
  ${v?"<!-- Fondo transparente para dejar ver el video base del usuario -->":`<div class="absolute inset-0 overflow-hidden pointer-events-none">
           <div class="absolute inset-0 grid-bg"></div>
           <div id="orb-1" class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-35" style="background: ${w};"></div>
           <div id="orb-2" class="absolute bottom-8 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25" style="background: #6366f1;"></div>
         </div>`}

  <!-- TOP HUD BAR (100% centrado con ancho completo de contenedor) -->
  <div id="top-bar" data-editable="true" class="relative z-10 w-full ${j?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-between gap-2 shrink-0">
    <div class="glass-card px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 whitespace-nowrap">
      <span class="w-2.5 h-2.5 rounded-full animate-ping shrink-0" style="background: ${w};"></span>
      <span class="text-[11px] font-extrabold tracking-widest uppercase text-teal-300">${Q}</span>
    </div>
    <div class="glass-card px-3 py-1.5 rounded-full text-[11px] font-mono font-bold text-slate-300 whitespace-nowrap shrink-0">
      WAPPY STUDIO • IA
    </div>
  </div>

  <!-- ESCENA CENTRAL: TARJETAS ANIMADAS (100% centrado matemáticamente con max-w y mx-auto) -->
  <div class="relative z-10 my-auto w-full ${j?"max-w-md":"max-w-2xl"} mx-auto flex flex-col gap-3 sm:gap-3.5 items-stretch">
    ${q}
  </div>

  <!-- ESPACIO INFERIOR RESERVADO PARA SUBTÍTULOS DINÁMICOS -->
  <div class="relative z-10 ${j?"h-14":"h-12"} shrink-0 w-full"></div>

  <script>
    const tl = gsap.timeline({ repeat: 0 });
    window.mainTimeline = tl;

    tl.from("#top-bar", { y: -25, opacity: 0, duration: 0.55, ease: "back.out(1.7)" })
      .from("#hero-card", { scale: 0.94, y: 24, opacity: 0, duration: 0.65, ease: "back.out(1.5)" }, "-=0.25")
      .from(".metric-item", { y: 20, opacity: 0, stagger: 0.12, duration: 0.5, ease: "back.out(1.7)" }, "-=0.35")
      .to("#hero-card", { y: -4, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: 3 });
  <\/script>
</body>
</html>`}function lr(d){if(!d)return"";if(d.includes('id="wappy-studio-runtime-bridge"'))return d;const p=`<script id="wappy-studio-gsap-hook">
  (function() {
    function patchGsap() {
      if (window.gsap && !window.gsap.__wappyPatched) {
        window.gsap.__wappyPatched = true;
        var origTl = window.gsap.timeline.bind(window.gsap);
        window.gsap.timeline = function(vars) {
          var cleanVars = Object.assign({}, vars || {});
          if (!window.mainTimeline && cleanVars.repeat === -1) {
            cleanVars.repeat = 0;
          }
          var tl = origTl(cleanVars);
          if (!window.mainTimeline) window.mainTimeline = tl;
          return tl;
        };
      }
    }
    patchGsap();
    document.addEventListener("DOMContentLoaded", patchGsap);
    window.addEventListener("load", patchGsap);
  })();
<\/script>`,l=`<style id="wappy-studio-bridge-styles">
  html, body {
    width: 100% !important;
    height: 100% !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    margin: 0 !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  body.wappy-visual-edit-active * {
    cursor: grab;
  }
  body.wappy-visual-edit-active *:hover {
    outline: 1.5px dashed rgba(20, 184, 166, 0.65);
    outline-offset: 2px;
  }
  body.wappy-visual-edit-active [data-wappy-selected="true"] {
    outline: 2.5px solid #14b8a6 !important;
    outline-offset: 3px !important;
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.22) !important;
  }
  body.wappy-visual-edit-active [contenteditable="true"] {
    cursor: text !important;
    outline: 2.5px solid #f59e0b !important;
  }
</style>
<script id="wappy-studio-runtime-bridge">
(function() {
  var editMode = false;
  var selectedEl = null;
  var isDragging = false;
  var dragStartX = 0;
  var dragStartY = 0;
  var initialDx = 0;
  var initialDy = 0;

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#14b8a6';
    if (rgb.indexOf('#') === 0) return rgb;
    var m = rgb.match(/\\d+/g);
    if (!m || m.length < 3) return '#ffffff';
    return '#' + [0,1,2].map(function(i) {
      var h = parseInt(m[i], 10).toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('');
  }

  function fitStageToViewport() {
    try {
      var vw = window.innerWidth || 540;
      var vh = window.innerHeight || 540;
      var children = Array.prototype.slice.call(document.body.children).filter(function(el) {
        return el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE';
      });
      for (var i = 0; i < children.length; i++) {
        var el = children[i];
        var inlineW = parseFloat(el.style.width || '0') || 0;
        var inlineH = parseFloat(el.style.height || '0') || 0;
        var cls = el.className && typeof el.className === 'string' ? el.className : '';
        if (!inlineW && cls.indexOf('1920px') !== -1) inlineW = 1920;
        if (!inlineW && cls.indexOf('1080px') !== -1) inlineW = 1080;
        if (!inlineH && cls.indexOf('1920px') !== -1 && inlineW === 1080) inlineH = 1920;
        if (!inlineH && cls.indexOf('1080px') !== -1 && inlineW === 1920) inlineH = 1080;

        if (inlineW >= 720 && (inlineW > vw + 12 || inlineH > vh + 12)) {
          var targetH = inlineH >= 480 ? inlineH : vh;
          var s = Math.min(vw / inlineW, vh / targetH);
          document.body.style.display = 'flex';
          document.body.style.alignItems = 'center';
          document.body.style.justifyContent = 'center';
          el.style.transformOrigin = 'center center';
          el.style.scale = String(Number(s.toFixed(4)));
          el.style.flexShrink = '0';
        }
      }
    } catch (e) {}
  }

  window.addEventListener('resize', fitStageToViewport);
  window.addEventListener('load', fitStageToViewport);

  function notifySelected(el) {
    if (!el) {
      window.parent.postMessage({ type: 'STUDIO_ELEMENT_SELECTED', payload: null }, '*');
      return;
    }
    var cs = window.getComputedStyle(el);
    var dx = parseFloat(el.getAttribute('data-dx') || '0') || 0;
    var dy = parseFloat(el.getAttribute('data-dy') || '0') || 0;
    var sc = parseFloat(el.getAttribute('data-scale') || '1') || 1;
    window.parent.postMessage({
      type: 'STUDIO_ELEMENT_SELECTED',
      payload: {
        tagName: el.tagName.toLowerCase(),
        text: el.innerText || '',
        color: rgbToHex(cs.color),
        backgroundColor: rgbToHex(cs.backgroundColor),
        fontSize: Math.round(parseFloat(cs.fontSize || '16') || 16),
        dx: Math.round(dx),
        dy: Math.round(dy),
        scale: Number(sc.toFixed(2))
      }
    }, '*');
  }

  function emitCleanHtml() {
    try {
      var clone = document.documentElement.cloneNode(true);
      var bStyles = clone.querySelector('#wappy-studio-bridge-styles');
      if (bStyles) bStyles.remove();
      var bScript = clone.querySelector('#wappy-studio-runtime-bridge');
      if (bScript) bScript.remove();
      var gHook = clone.querySelector('#wappy-studio-gsap-hook');
      if (gHook) gHook.remove();
      var bodyClone = clone.querySelector('body');
      if (bodyClone) {
        bodyClone.classList.remove('wappy-visual-edit-active');
        var sel = bodyClone.querySelectorAll('[data-wappy-selected]');
        for (var i = 0; i < sel.length; i++) {
          sel[i].removeAttribute('data-wappy-selected');
          sel[i].removeAttribute('contenteditable');
        }
      }
      window.parent.postMessage({
        type: 'STUDIO_HTML_UPDATED',
        htmlCode: '<!DOCTYPE html>\\n' + clone.outerHTML
      }, '*');
    } catch (e) {}
  }

  function selectElement(el) {
    if (selectedEl && selectedEl !== el) {
      selectedEl.removeAttribute('data-wappy-selected');
      selectedEl.removeAttribute('contenteditable');
    }
    selectedEl = el;
    if (selectedEl) {
      selectedEl.setAttribute('data-wappy-selected', 'true');
    }
    notifySelected(selectedEl);
  }

  document.addEventListener('mousedown', function(e) {
    if (!editMode) return;
    var target = e.target;
    if (!target || target === document.body || target === document.documentElement) {
      selectElement(null);
      return;
    }
    if (target.getAttribute('contenteditable') === 'true') return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(target);
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialDx = parseFloat(target.getAttribute('data-dx') || '0') || 0;
    initialDy = parseFloat(target.getAttribute('data-dy') || '0') || 0;
  }, true);

  document.addEventListener('mousemove', function(e) {
    if (!editMode || !isDragging || !selectedEl) return;
    var nextDx = initialDx + (e.clientX - dragStartX);
    var nextDy = initialDy + (e.clientY - dragStartY);
    selectedEl.setAttribute('data-dx', String(nextDx));
    selectedEl.setAttribute('data-dy', String(nextDy));
    selectedEl.style.translate = nextDx + 'px ' + nextDy + 'px';
  }, true);

  document.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      if (selectedEl) {
        notifySelected(selectedEl);
        emitCleanHtml();
      }
    }
  }, true);

  document.addEventListener('dblclick', function(e) {
    if (!editMode) return;
    var target = e.target;
    if (!target || target === document.body || target === document.documentElement) return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(target);
    target.setAttribute('contenteditable', 'true');
    target.focus();
  }, true);

  document.addEventListener('input', function() {
    if (!editMode || !selectedEl) return;
    notifySelected(selectedEl);
    emitCleanHtml();
  }, true);

  window.addEventListener('message', function(event) {
    var data = event.data || {};
    var tl = window.mainTimeline || (window.gsap && window.gsap.globalTimeline);

    if (data.type === 'STUDIO_PLAY') {
      if (window.mainTimeline) window.mainTimeline.play();
      if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.play();
    } else if (data.type === 'STUDIO_PAUSE') {
      if (window.mainTimeline) window.mainTimeline.pause();
      if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.pause();
    } else if (data.type === 'STUDIO_RESTART') {
      if (window.mainTimeline) window.mainTimeline.restart();
      else if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.restart();
    } else if (data.type === 'STUDIO_SEEK') {
      var p = Math.max(0, Math.min(1, Number(data.progress || 0)));
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        window.mainTimeline.progress(p);
      } else if (window.gsap && window.gsap.globalTimeline && typeof data.time === 'number') {
        window.gsap.globalTimeline.time(data.time);
      }
    } else if (data.type === 'STUDIO_SET_EDIT_MODE') {
      editMode = Boolean(data.enabled);
      if (editMode) {
        document.body.classList.add('wappy-visual-edit-active');
        if (window.mainTimeline) window.mainTimeline.pause();
        if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.pause();
      } else {
        document.body.classList.remove('wappy-visual-edit-active');
        selectElement(null);
      }
    } else if (data.type === 'STUDIO_UPDATE_SELECTED' && selectedEl) {
      var upd = data.updates || {};
      if (typeof upd.text === 'string') selectedEl.innerText = upd.text;
      if (typeof upd.color === 'string') selectedEl.style.color = upd.color;
      if (typeof upd.backgroundColor === 'string') selectedEl.style.backgroundColor = upd.backgroundColor;
      if (typeof upd.fontSize === 'number') selectedEl.style.fontSize = upd.fontSize + 'px';
      if (typeof upd.dx === 'number' || typeof upd.dy === 'number') {
        var nx = typeof upd.dx === 'number' ? upd.dx : (parseFloat(selectedEl.getAttribute('data-dx') || '0') || 0);
        var ny = typeof upd.dy === 'number' ? upd.dy : (parseFloat(selectedEl.getAttribute('data-dy') || '0') || 0);
        selectedEl.setAttribute('data-dx', String(nx));
        selectedEl.setAttribute('data-dy', String(ny));
        selectedEl.style.translate = nx + 'px ' + ny + 'px';
      }
      if (typeof upd.scale === 'number') {
        selectedEl.setAttribute('data-scale', String(upd.scale));
        selectedEl.style.scale = String(upd.scale);
      }
      notifySelected(selectedEl);
      emitCleanHtml();
    } else if (data.type === 'STUDIO_SELECT_PARENT' && selectedEl) {
      if (selectedEl.parentElement && selectedEl.parentElement !== document.body) {
        selectElement(selectedEl.parentElement);
      }
    } else if (data.type === 'STUDIO_DELETE_SELECTED' && selectedEl) {
      var toRemove = selectedEl;
      selectElement(null);
      toRemove.remove();
      emitCleanHtml();
    } else if (data.type === 'STUDIO_DUPLICATE_SELECTED' && selectedEl) {
      var dup = selectedEl.cloneNode(true);
      var curX = (parseFloat(selectedEl.getAttribute('data-dx') || '0') || 0) + 18;
      var curY = (parseFloat(selectedEl.getAttribute('data-dy') || '0') || 0) + 18;
      dup.setAttribute('data-dx', String(curX));
      dup.setAttribute('data-dy', String(curY));
      dup.style.translate = curX + 'px ' + curY + 'px';
      if (selectedEl.parentElement) {
        selectedEl.parentElement.appendChild(dup);
        selectElement(dup);
        emitCleanHtml();
      }
    } else if (data.type === 'STUDIO_ADD_ELEMENT') {
      var kind = data.kind || 'text';
      var newEl = document.createElement('div');
      if (kind === 'card') {
        newEl.className = 'glass-card rounded-2xl p-4 border border-teal-500/40 text-white shadow-xl';
        newEl.style.cssText = 'position:absolute; top:35%; left:12%; right:12%; z-index:40; background:rgba(10,18,30,0.86); backdrop-filter:blur(14px); border:1px solid rgba(20,184,166,0.45); border-radius:16px; padding:16px;';
        newEl.innerHTML = '<div style="font-size:11px;font-weight:800;color:#2dd4bf;letter-spacing:0.08em;text-transform:uppercase;">NUEVA TARJETA</div><div style="font-size:18px;font-weight:900;color:#ffffff;margin-top:4px;">Haz doble clic o usa el editor para cambiar este texto</div>';
      } else {
        newEl.style.cssText = 'position:absolute; top:25%; left:15%; z-index:45; font-size:22px; font-weight:900; color:#ffffff; background:rgba(20,184,166,0.22); border:1px solid rgba(20,184,166,0.5); padding:8px 16px; border-radius:12px;';
        newEl.innerText = 'Nuevo Texto Editable';
      }
      document.body.appendChild(newEl);
      selectElement(newEl);
      emitCleanHtml();
    } else if (data.type === 'STUDIO_FIT_VIEWPORT') {
      fitStageToViewport();
    }
  });
})();
<\/script>`;let m=d;return m.includes("<head>")?m=m.replace("<head>",`<head>
${p}`):m=`${p}
${m}`,m.includes("</body>")?m=m.replace("</body>",`${l}
</body>`):m=`${m}
${l}`,m}const Wt="wappy_studio_audio_library",pt="wappy_gemini_api_keys";function qt(){try{const d=localStorage.getItem(pt);if(!d)return[];let p;try{p=JSON.parse(d)}catch{p=d.split(",")}return typeof p=="string"&&(p=p.split(",")),Array.isArray(p)?p.map((l,m)=>typeof l=="string"?{key:l.trim(),label:`Clave #${m+1}`,status:"unchecked"}:l&&typeof l.key=="string"?{key:l.key.trim(),label:l.label||`Clave #${m+1}`,status:l.status||"unchecked"}:null).filter(l=>!!(l&&l.key)):[]}catch{return[]}}function V(d){const p=d||localStorage.getItem("token")||"",l=qt().map(m=>m.key.trim()).filter(m=>m.length>15).join(",");return{"Content-Type":"application/json",...p?{Authorization:`Bearer ${p}`}:{},...l?{"x-gemini-api-keys":l}:{}}}async function oe(d){const p=await d.text();try{return JSON.parse(p)}catch{throw d.status===401||p.trim()==="Unauthorized"?new Error("Tu sesión está actualizándose. Intenta nuevamente en un segundo."):new Error(p.slice(0,180)||`Error del servidor (${d.status})`)}}function dr(d){const p=Math.max(1,Math.round(d||0)),l=Math.floor(p/60),m=p%60;return`${l}m ${m}s`}function cr(d){try{return new Date(d).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return""}}function Hr({portable:d=!1}={}){var Oa;const{user:p,token:l,isAuthenticated:m}=Gs(),{data:R}=qs(),w=Ms(),h=(w==null?void 0:w.navVisible)??!0,j=(w==null?void 0:w.setNavVisible)??(()=>{}),[Q,K]=Ks(),L=Q.get("tab")||"tts",[v,q]=i.useState(["tts","video","lab","library"].includes(L)?L:"tts"),[Ee,gt]=i.useState(()=>{var t,a;return((a=(t=p==null?void 0:p.personalization)==null?void 0:t.geminiModels)==null?void 0:a.sstManagement)||(sr.GOOGLE_MODELS||"gemini-3.6-flash").split(",")[0].trim()}),[de,Ie]=i.useState(()=>Object.values(Ft)),[C,ht]=i.useState(()=>rr),[Te,ft]=i.useState(()=>nr),[N,z]=i.useState(()=>ir),[S,D]=i.useState("gemini-3.8-flash-tts"),[b,Y]=i.useState("Kore"),[se,Yt]=i.useState("Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido."),[he,yt]=i.useState(!1),[We,Jt]=i.useState("Puck"),[Ke,Xt]=i.useState("Kore"),[fe,Ga]=i.useState(150),[k,Oe]=i.useState(Ht[0].text),[vt,qa]=i.useState("Voz expresiva, tono conversacional y alegre."),[ne,Ya]=i.useState("Hola. Hoy quiero demostrarte cómo suena una respiración natural <breath> y cómo reacciono con una pequeña risa <laugh> cuando algo resulta verdaderamente sorprendente."),[Zt,Qt]=i.useState(!1),[Ja,ea]=i.useState(null),[ta,Xa]=i.useState(0),[Za,Qa]=i.useState(0),[wt,Ge]=i.useState(.5),[jt,qe]=i.useState(1),[kt,aa]=i.useState(!1),[sa,ra]=i.useState(!1),[es,na]=i.useState(null),[O,ce]=i.useState(null),Ve=i.useRef(null),[Ye,ts]=i.useState("all"),[Je,ia]=i.useState("only_active"),[Nt,as]=i.useState(""),[St,ss]=i.useState(!1),[c,$]=i.useState(null),[ue,Ce]=i.useState(()=>{try{const t=localStorage.getItem(Wt);return t?JSON.parse(t):[]}catch{return[]}}),[A,Et]=i.useState("9:16"),[Xe,rs]=i.useState("golden-rules"),[ye,oa]=i.useState("bottom"),[la,da]=i.useState(!1),[U,ca]=i.useState(null),[ua,pa]=i.useState(""),[Ze,ns]=i.useState(!1),[ve,xa]=i.useState(null),[ma,ba]=i.useState(""),[ee,ga]=i.useState(!0),[ha,is]=i.useState("CÁPSULA INTERACTIVA WAPPY"),[Qe,os]=i.useState("5 Reglas de Oro en Riesgo Eléctrico"),[fa,ls]=i.useState("Prevención inteligente y locución neural sincronizada"),[ya,ds]=i.useState("#14b8a6"),[va,cs]=i.useState("Crea una animación estilo Claude con tarjetas de cristal sobre las 5 reglas de oro de riesgo eléctrico, iconos luminosos y barras de progreso."),[et,wa]=i.useState(!1),[Tt,us]=i.useState(!1),[ze,Ae]=i.useState(()=>Wa({aspectRatio:"9:16",hasBaseVideo:!1,badgeText:"CÁPSULA INTERACTIVA WAPPY",headline:"5 Reglas de Oro en Riesgo Eléctrico",subheadline:"Prevención inteligente y locución neural sincronizada",accentColor:"#14b8a6",templateId:"golden-rules"})),[re,we]=i.useState(!0),[je,ie]=i.useState(0),[B,Re]=i.useState(20),[Ct,ps]=i.useState(!1),[_,tt]=i.useState(!1),[G,zt]=i.useState(null),te=i.useRef(""),[$e,ja]=i.useState(!1),[at,st]=i.useState(!1),[Pe,g]=i.useState(null),[xs,At]=i.useState(!1),[rt,nt]=i.useState(()=>{const t=qt();return[t[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},t[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},t[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}]}),[Pt,ka]=i.useState(!1),[Na,it]=i.useState(""),ms=i.useMemo(()=>rt.filter(t=>t.key.trim().length>15).length,[rt]);i.useEffect(()=>{const t=()=>{const s=qt();nt([s[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},s[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},s[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}])},a=s=>{s.key===pt&&t()};return window.addEventListener("wappy-keys-updated",t),window.addEventListener("storage",a),()=>{window.removeEventListener("wappy-keys-updated",t),window.removeEventListener("storage",a)}},[]);const bs=async()=>{ka(!0),it("");try{const t=[...rt];let a=0;for(let r=0;r<t.length;r++){const o=t[r].key.trim();if(!o){t[r]={...t[r],key:"",status:"unchecked"};continue}try{const n=await fetch("/api/studio/keys-validate",{method:"POST",headers:V(l),body:JSON.stringify({apiKey:o})}),u=await n.json().catch(()=>({}));n.ok&&u.valid?(t[r]={...t[r],key:o,status:"valid"},a++):t[r]={...t[r],key:o,status:"invalid"}}catch{t[r]={...t[r],key:o,status:"unchecked"}}}nt(t);const s=t.filter(r=>r.key.trim().length>0);localStorage.setItem(pt,JSON.stringify(s)),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),it(s.length===0?"Claves personalizadas limpiadas. Se utilizarán las claves del servidor WAPPY.":`¡Guardadas ${s.length} clave(s) (${a} verificada(s) en vivo con Google Gemini)!`)}finally{ka(!1)}},E=i.useRef(null),J=i.useRef(null),X=i.useRef(null),Sa=i.useRef(null),gs=i.useMemo(()=>lr(ze),[ze]);i.useEffect(()=>{const t=()=>{const a=!!document.fullscreenElement;ps(a),setTimeout(()=>{var s,r;(r=(s=E.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},80),setTimeout(()=>{var s,r;(r=(s=E.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},300)};return document.addEventListener("fullscreenchange",t),()=>document.removeEventListener("fullscreenchange",t)},[]),i.useEffect(()=>{const t=a=>{const s=a.data||{};s.type==="STUDIO_ELEMENT_SELECTED"?zt(s.payload||null):s.type==="STUDIO_HTML_UPDATED"&&typeof s.htmlCode=="string"&&(te.current=s.htmlCode)};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[]),i.useEffect(()=>{const t=ue.slice(0,60);try{localStorage.setItem(Wt,JSON.stringify(t))}catch{try{localStorage.setItem(Wt,JSON.stringify(t.map(({audioBase64:a,...s})=>s)))}catch{}}},[ue]),i.useEffect(()=>{const t=ue.filter(a=>a.audioBase64&&!a.mediaKey);t.length!==0&&(async()=>{const a={};for(const s of t)try{const r=`audio-${s.id}`;await Ne(r,dt(s.audioBase64)),a[s.id]=r}catch{}Object.keys(a).length!==0&&Ce(s=>s.map(r=>a[r.id]?{...r,mediaKey:a[r.id],audioBase64:void 0}:r))})()},[]);const Mt=i.useRef(null),Ea=t=>{Mt.current&&URL.revokeObjectURL(Mt.current);const a=URL.createObjectURL(t);return Mt.current=a,a},ot=async(t,a)=>{const s=`audio-${t.id}`;let r=null;try{if(a.base64)r=dt(a.base64);else if(a.url){const n=await fetch(a.url,{headers:V(l)});n.ok&&(r=await n.blob())}r&&await Ne(s,r)}catch{r=null}const o=r?{...t,kind:t.kind||"audio",mediaKey:s,audioBase64:void 0}:{...t,kind:t.kind||"audio",audioBase64:a.base64};return Ce(n=>[o,...n.filter(u=>u.id!==t.id)]),r?s:void 0},Ta=async t=>{if(t.mediaKey){const a=await He(t.mediaKey);if(a)return a}if(t.audioBase64)return dt(t.audioBase64);if(t.downloadUrl)try{const a=await fetch(t.downloadUrl,{headers:V(l)});if(a.ok){const s=await a.blob(),r=`audio-${t.id}`;return Ne(r,s).then(()=>Ce(o=>o.map(n=>n.id===t.id?{...n,mediaKey:r}:n))).catch(()=>{}),s}}catch{}return null},Ca=async(t,a=!1)=>{const s=await Ta(t);return s?($({url:Ea(s),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey||`audio-${t.id}`}),t.durationSeconds&&t.durationSeconds>1&&Re(t.durationSeconds),a&&pe("video"),!0):(g({type:"error",text:"Este audio se generó antes de activar el guardado permanente y el servidor ya lo liberó (se reinició). Vuelve a generarlo: desde ahora todos los audios quedan guardados en tu navegador."}),!1)},Lt=(t,a)=>{const s=URL.createObjectURL(t),r=document.createElement("a");r.href=s,r.download=a,document.body.appendChild(r),r.click(),document.body.removeChild(r),setTimeout(()=>URL.revokeObjectURL(s),4e3)},hs=t=>{Ce(a=>{const s=a.filter(o=>o.id!==t.id);return[t.mediaKey,t.htmlKey,t.mp4Key,t.capsuleKey].filter(Boolean).forEach(o=>{s.some(u=>[u.mediaKey,u.htmlKey,u.mp4Key,u.capsuleKey].includes(o))||tr(o)}),s})};i.useEffect(()=>{var a;const t=(a=R==null?void 0:R[Ys.google])==null?void 0:a.models;if(Array.isArray(t)&&t.length>0){const s=t.map(r=>(typeof r=="string"?r:(r==null?void 0:r.id)||(r==null?void 0:r.value)||"").replace("models/","").trim()).filter(r=>r&&r.includes("tts"));s.length>0&&Ie(r=>{const o=new Map(r.map(n=>[n.id,n]));return s.map(n=>Ft[n]||o.get(n)||{id:n,name:n,badge:"GOOGLE_MODELS",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:`Modelo TTS cargado desde GOOGLE_MODELS (${n}).`,supportsMultiSpeaker:!n.includes("lite"),supportsVocalBursts:!n.includes("2.5"),supportedVoices:Ft["gemini-3.8-flash-tts"].supportedVoices})})}},[R]),i.useEffect(()=>{fetch("/api/studio/catalog",{headers:V(l)}).then(t=>t.ok?t.json():null).then(t=>{t&&(Array.isArray(t.models)&&t.models.length>0&&Ie(t.models),Array.isArray(t.voices)&&t.voices.length>0&&ht(t.voices),Array.isArray(t.presets)&&t.presets.length>0&&ft(t.presets),Array.isArray(t.vocalBursts)&&t.vocalBursts.length>0&&z(t.vocalBursts))}).catch(()=>{})},[l]),i.useEffect(()=>{const t=k.trim(),a=t?t.split(/\s+/).filter(Boolean).length:0;if(Xa(a),Qa(t.length),!t){Ge(0),qe(0);return}const s=setTimeout(()=>{fetch("/api/studio/tts/estimate",{method:"POST",headers:V(l),body:JSON.stringify({text:t,maxWordsPerChunk:fe})}).then(r=>r.ok?r.json():null).then(r=>{r&&typeof r.estimatedMinutes=="number"?Ge(r.estimatedMinutes):Ge(Math.round(a/145*10)/10),r&&typeof r.chunkCount=="number"?qe(r.chunkCount):qe(Math.max(1,Math.ceil(a/fe)))}).catch(()=>{Ge(Math.round(a/145*10)/10),qe(Math.max(1,Math.ceil(a/fe)))})},250);return()=>clearTimeout(s)},[k,fe,l]);const pe=t=>{q(t),K({tab:t})};i.useEffect(()=>{const t=a=>{const s=a.detail;["tts","video","lab","library"].includes(s)&&pe(s)};return window.addEventListener("wappy-studio-switch-tab",t),()=>window.removeEventListener("wappy-studio-switch-tab",t)},[]);const P=i.useMemo(()=>de.find(t=>t.id===S)||de[0],[de,S]),Ue=t=>P!=null&&P.supportedVoices?P.supportedVoices.includes(t):!0,fs=i.useMemo(()=>C.filter(t=>{const a=Ue(t.id),s=Je==="all"||a,r=Ye==="all"||t.gender===Ye,o=Nt.trim().toLowerCase(),n=!o||t.name.toLowerCase().includes(o)||t.tone.toLowerCase().includes(o)||t.recommendedFor.toLowerCase().includes(o)||t.tag&&t.tag.toLowerCase().includes(o);return s&&r&&n}),[C,P,Je,Ye,Nt]),ys=async(t,a)=>{a==null||a.stopPropagation();try{na(t);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:V(l),body:JSON.stringify({voiceName:t,model:Ue(t)?S:"gemini-3.8-flash-tts",text:`Hola, soy ${t}. Esta es una muestra de voz neural en WAPPY Studio para tus cápsulas y cursos.`})}),r=await oe(s);if(!s.ok||!r.success)throw new Error(r.error||"No se pudo sintetizar la muestra.");$({base64:r.audioBase64,title:`Muestra de Voz: ${t}`,durationSeconds:r.durationSeconds,voiceName:t})}catch(s){g({type:"error",text:s.message||"Error en audición de voz."})}finally{na(null)}},vs=async()=>{try{ra(!0),g(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:V(l),body:JSON.stringify({voiceName:b,model:S,text:"¡Conexión verificada con éxito! El motor de voz Gemini 3.8 Flash TTS en WAPPY Studio está listo."})}),a=await oe(t);if(!t.ok||!a.success)throw new Error(a.error||"Error probando conexión.");$({base64:a.audioBase64,title:`Prueba de Conexión (${b})`,durationSeconds:a.durationSeconds,voiceName:b}),g({type:"success",text:`¡Conexión activa con ${a.usedModel||S}! Audio sintetizado correctamente.`})}catch(t){g({type:"error",text:t.message||"Error de conexión con Gemini TTS."})}finally{ra(!1)}},ws=async()=>{if(k.trim())try{aa(!0),g(null);const t=k.trim().slice(0,750),a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:V(l),body:JSON.stringify({text:t,voiceName:b,stylePrompt:se,model:S,multiSpeaker:he,speaker1:{name:"Alex",voiceName:We},speaker2:{name:"Sam",voiceName:Ke}})}),s=await oe(a);if(!a.ok||!s.success)throw new Error(s.error||"Error al sintetizar vista previa.");$({base64:s.audioBase64,title:`Vista Previa: ${t.slice(0,38)}...`,durationSeconds:s.durationSeconds,voiceName:b,scriptText:t});const r={id:Date.now().toString(),title:`Vista Previa: ${t.slice(0,42)}...`,createdAt:Date.now(),voiceName:b,model:s.usedModel||S,durationSeconds:s.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,stylePrompt:se,scriptText:t},o=await ot(r,{base64:s.audioBase64});o&&$(n=>n&&{...n,mediaKey:o}),g({type:"success",text:"Audio generado y cargado en el reproductor. Puedes descargarlo en WAV o enviarlo al Compositor de Video."})}catch(t){g({type:"error",text:t.message||"Error sintetizando fragmento."})}finally{aa(!1)}},js=async()=>{if(ne.trim())try{Qt(!0),g(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:V(l),body:JSON.stringify({text:ne.trim(),voiceName:b,stylePrompt:vt,model:S})}),a=await oe(t);if(!t.ok||!a.success)throw new Error(a.error||"Error al sintetizar en el laboratorio.");$({base64:a.audioBase64,title:`Laboratorio (${b}): ${ne.trim().slice(0,34)}...`,durationSeconds:a.durationSeconds,voiceName:b,scriptText:ne.trim()});const s={id:Date.now().toString(),title:`Laboratorio: ${ne.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:b,model:a.usedModel||S,durationSeconds:a.durationSeconds,wordCount:ne.trim().split(/\s+/).filter(Boolean).length,stylePrompt:vt,scriptText:ne.trim()},r=await ot(s,{base64:a.audioBase64});r&&$(o=>o&&{...o,mediaKey:r})}catch(t){g({type:"error",text:t.message||"Error sintetizando prueba en el laboratorio."})}finally{Qt(!1)}},ks=async()=>{if(k.trim())try{g(null),Ve.current&&Ve.current.close();const t=await fetch("/api/studio/tts/jobs",{method:"POST",headers:V(l),body:JSON.stringify({text:k,voiceName:b,stylePrompt:se,model:S,multiSpeaker:he,speaker1:{name:"Alex",voiceName:We},speaker2:{name:"Sam",voiceName:Ke},maxWordsPerChunk:fe})}),a=await oe(t);if(!t.ok)throw new Error(a.error||"No se pudo iniciar el trabajo de larga duración.");const s={id:a.jobId,status:"processing",totalChunks:a.totalChunks,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:a.estimatedTotalSeconds,generatedTotalSeconds:0,progressPercent:0,chunks:Array.from({length:a.totalChunks},(o,n)=>({index:n,wordCount:0,status:"pending"}))};ce(s);const r=new EventSource(`/api/studio/tts/jobs/${a.jobId}/stream${l?`?token=${encodeURIComponent(l)}`:""}`);Ve.current=r,r.addEventListener("snapshot",o=>{const n=JSON.parse(o.data);ce(u=>u?{...u,...n}:n)}),r.addEventListener("chunk_start",o=>{const n=JSON.parse(o.data);ce(u=>{if(!u)return null;const x=[...u.chunks];return x[n.chunkIndex]&&(x[n.chunkIndex]={...x[n.chunkIndex],status:"processing"}),{...u,currentChunkIndex:n.chunkIndex,chunks:x}})}),r.addEventListener("chunk_complete",o=>{const n=JSON.parse(o.data);ce(u=>{if(!u)return null;const x=[...u.chunks];x[n.chunkIndex]&&(x[n.chunkIndex]={...x[n.chunkIndex],status:"completed",durationSeconds:n.durationSeconds,audioBase64:n.audioBase64});const T=x.filter(F=>F.status==="completed").length;return{...u,completedChunks:T,progressPercent:n.progressPercent,generatedTotalSeconds:n.generatedTotalSeconds,chunks:x}})}),r.addEventListener("job_completed",o=>{const n=JSON.parse(o.data);r.close(),ce(x=>x?{...x,status:"completed",progressPercent:100,downloadUrl:n.downloadUrl}:null),$({url:n.downloadUrl,title:`Audio Completo: ${k.trim().slice(0,35)}...`,durationSeconds:n.totalDurationSeconds,voiceName:b,scriptText:k});const u={id:n.id,title:`Audio Completo: ${k.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:b,model:S,durationSeconds:n.totalDurationSeconds,wordCount:ta,downloadUrl:n.downloadUrl,stylePrompt:se,scriptText:k};ot(u,{url:n.downloadUrl}).then(x=>{x&&$(T=>T&&{...T,mediaKey:x})})}),r.addEventListener("job_failed",o=>{const n=JSON.parse(o.data);r.close(),ce(u=>u?{...u,status:"failed",error:n.error}:null)}),r.addEventListener("job_status",o=>{const n=JSON.parse(o.data);ce(u=>u?{...u,status:n.status}:null)})}catch(t){g({type:"error",text:t.message||"Error iniciando trabajo."})}},Dt=async t=>{O&&(t==="cancel"&&Ve.current&&Ve.current.close(),await fetch(`/api/studio/tts/jobs/${O.id}/control`,{method:"POST",headers:V(l),body:JSON.stringify({action:t})}),ce(a=>a?{...a,status:t==="pause"?"paused":t==="resume"?"processing":"cancelled"}:null))},It=t=>{const a=document.getElementById("wappy-studio-tts-editor");if(!a){Oe(n=>`${n} ${t}`);return}const s=a.selectionStart,r=a.selectionEnd,o=k.substring(0,s)+t+k.substring(r);Oe(o),setTimeout(()=>{a.focus(),a.setSelectionRange(s+t.length,s+t.length)},15)},Me=(t=A,a=!!U,s=Xe)=>{Ae(Wa({aspectRatio:t,hasBaseVideo:a,badgeText:ha,headline:Qe,subheadline:fa,accentColor:ya,templateId:s}))},Ns=async()=>{const t=(k||Qe||"").trim().slice(0,750);if(t)try{da(!0),g(null);const a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:V(l),body:JSON.stringify({text:t,voiceName:b,stylePrompt:se,model:S,multiSpeaker:he,speaker1:{name:"Alex",voiceName:We},speaker2:{name:"Sam",voiceName:Ke}})}),s=await oe(a);if(!a.ok||!s.success)throw new Error(s.error||"No se pudo sintetizar la voz para el video.");$({base64:s.audioBase64,title:`Locución de Video (${b})`,durationSeconds:s.durationSeconds,voiceName:b,scriptText:t}),ot({id:`vo-${Date.now()}`,title:`Locución de Video: ${t.slice(0,40)}...`,createdAt:Date.now(),voiceName:b,model:s.usedModel||S,durationSeconds:s.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,stylePrompt:se,scriptText:t},{base64:s.audioBase64}).then(r=>{r&&$(o=>o&&{...o,mediaKey:r})}),s.durationSeconds&&s.durationSeconds>1&&Re(s.durationSeconds),ie(0),we(!0),setTimeout(()=>{var r,o,n,u;(o=(r=E.current)==null?void 0:r.contentWindow)==null||o.postMessage({type:"STUDIO_RESTART"},"*"),(n=X.current)==null||n.play().catch(()=>{}),(u=J.current)==null||u.play().catch(()=>{})},120),g({type:"success",text:`¡Locución neural (${b}) sincronizada automáticamente con el lienzo de video!`})}catch(a){g({type:"error",text:a.message||"Error sincronizando voz con el video."})}finally{da(!1)}},Ss=async()=>{try{wa(!0),g(null);const t=await fetch("/api/studio/video/generate-html",{method:"POST",headers:V(l),body:JSON.stringify({prompt:va,scriptText:k,aspectRatio:A,hasBaseVideo:!!U,showSubtitles:ee,durationSeconds:Math.round((c==null?void 0:c.durationSeconds)||B||25),companyName:(p==null?void 0:p.name)||"WAPPY IA",modelName:Ee})}),a=await oe(t);if(!t.ok||!a.success)throw new Error(a.error||"Error generando composición HTML con IA.");Ae(a.htmlCode),g({type:"success",text:"¡Escena HTML + GSAP generada con éxito! Reproduciendo en el lienzo interactivo."})}catch(t){g({type:"error",text:t.message||"No se pudo generar la escena HTML con IA."})}finally{wa(!1)}},Es=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;U&&URL.revokeObjectURL(U);const s=URL.createObjectURL(a);ca(s),pa(a.name),Me(A,!0)},Ts=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;ve&&URL.revokeObjectURL(ve);const s=URL.createObjectURL(a);xa(s),ba(a.name)},Z=i.useMemo(()=>ve||(c!=null&&c.url?c.url:c!=null&&c.base64?`data:audio/wav;base64,${c.base64}`:""),[ve,c]);i.useEffect(()=>{if(v!=="video"||!re||_)return;let t=performance.now();const a=setInterval(()=>{const s=performance.now(),r=(s-t)/1e3;t=s;const o=X.current,n=J.current;if(o&&Z&&!o.paused&&!o.ended){ie(o.currentTime);return}if(n&&U&&!n.paused&&!n.ended){ie(n.currentTime);return}ie(u=>{var F,M;const x=Math.max(1,B||20),T=u+r;return T>=x?(we(!1),(M=(F=E.current)==null?void 0:F.contentWindow)==null||M.postMessage({type:"STUDIO_PAUSE"},"*"),x):T})},250);return()=>clearInterval(a)},[v,re,_,B,Z,U]);const za=()=>{var r,o,n,u,x;const t=Math.max(1,B||20);if(!re&&(je>=t-.3||!!((r=X.current)!=null&&r.ended))){Ot();return}const s=!re;s&&_&&(tt(!1),(n=(o=E.current)==null?void 0:o.contentWindow)==null||n.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),we(s),(x=(u=E.current)==null?void 0:u.contentWindow)==null||x.postMessage({type:s?"STUDIO_PLAY":"STUDIO_PAUSE"},"*"),J.current&&(s?J.current.play().catch(()=>{}):J.current.pause()),X.current&&Z&&(s?X.current.play().catch(()=>{}):X.current.pause())},Ot=()=>{var t,a,s,r;_&&(tt(!1),(a=(t=E.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),ie(0),we(!0),(r=(s=E.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_RESTART"},"*"),J.current&&(J.current.currentTime=0,J.current.play().catch(()=>{})),X.current&&Z&&(X.current.currentTime=0,X.current.play().catch(()=>{}))},Aa=t=>{var s,r;ie(t);const a=B>0?t/B:0;(r=(s=E.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SEEK",progress:a,time:t},"*"),J.current&&(J.current.currentTime=t),X.current&&Z&&(X.current.currentTime=t)},Pa=()=>{var a,s,r,o;const t=!_;tt(t),t?(we(!1),(a=J.current)==null||a.pause(),(s=X.current)==null||s.pause()):te.current&&(Ae(te.current),te.current=""),(o=(r=E.current)==null?void 0:r.contentWindow)==null||o.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:t},"*")},xe=t=>{var a,s;zt(r=>r&&{...r,...t}),(s=(a=E.current)==null?void 0:a.contentWindow)==null||s.postMessage({type:"STUDIO_UPDATE_SELECTED",updates:t},"*")},Cs=()=>{var t,a;te.current&&(Ae(te.current),te.current=""),tt(!1),zt(null),(a=(t=E.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*"),g({type:"success",text:"¡Cambios de textos y posición de cajas guardados en la composición HTML!"})},Ma=()=>{var t,a,s;document.fullscreenElement?(t=document.exitFullscreen)==null||t.call(document).catch(()=>{}):(s=(a=Sa.current)==null?void 0:a.requestFullscreen)==null||s.call(a).catch(()=>{})},me=i.useMemo(()=>((c==null?void 0:c.scriptText)||k||"").replace(/<[^>]+>/g,"").replace(/\|[^|]+\|/g,"").replace(/^(Alex|Sam):\s*/gim,"").split(/\s+/).filter(Boolean),[c==null?void 0:c.scriptText,k]),Vt=i.useMemo(()=>{if(!ee||me.length===0)return null;const t=Math.max(0,Math.min(.999,je/Math.max(1,B))),a=Math.floor(t*me.length),s=5,r=Math.floor(a/s)*s;return{words:me.slice(r,r+s),activeOffset:a-r}},[ee,me,je,B]),Rt=async()=>{if(c!=null&&c.base64)return c.base64;if(!Z)return null;try{const t=await fetch(Z);if(!t.ok)return null;const a=await t.arrayBuffer(),s=new Uint8Array(a);let r="";const o=32768;for(let n=0;n<s.length;n+=o)r+=String.fromCharCode.apply(null,Array.from(s.subarray(n,n+o)));return window.btoa(r)}catch{return null}},La=async()=>{try{ja(!0);const t=Math.min(60,Math.max(4,Math.round(B||15))),a=t>20?12:15;g({type:"info",text:`Renderizando Video MP4 con Audio + Animación + Subtítulos (${t}s)... Espera ~15-25 segundos mientras se ensambla el archivo .MP4 para WhatsApp y Celular.`});const s=te.current||ze,r=await Rt(),o=await fetch("/api/studio/video/render-mp4",{method:"POST",headers:V(l),body:JSON.stringify({htmlCode:s,audioBase64:r,scriptText:(c==null?void 0:c.scriptText)||k,showSubtitles:ee,subtitlePosition:ye,aspectRatio:A,durationSeconds:t,fps:a})}),n=await oe(o);if(!o.ok||!n.success||!n.videoBase64)throw new Error(n.error||"No se pudo renderizar el archivo MP4 en el servidor.");const u=window.atob(n.videoBase64),x=new Array(u.length);for(let be=0;be<u.length;be++)x[be]=u.charCodeAt(be);const T=new Uint8Array(x),F=new Blob([T],{type:"video/mp4"});$t({mp4Blob:F});const M=URL.createObjectURL(F),H=document.createElement("a");H.href=M,H.download=`wappy-studio-reel-${Date.now()}.mp4`,document.body.appendChild(H),H.click(),document.body.removeChild(H),URL.revokeObjectURL(M),g({type:"success",text:`¡Video MP4 Universal (${n.width}x${n.height} • H.264 + Audio AAC) descargado con éxito! Listo para enviar por WhatsApp, ver en celular o subir a Reels/TikTok.`})}catch(t){g({type:"error",text:t.message||"Error renderizando MP4 en el servidor."})}finally{ja(!1)}},zs=async t=>{var F;let a=t;const s=M=>M.replace(/<\/script/gi,"<\\/script"),r=async M=>{try{const H=await fetch(M,{cache:"force-cache"});return H.ok?await H.text():""}catch{return""}};let o="";try{const M=(F=E.current)==null?void 0:F.contentDocument;M&&Array.from(M.querySelectorAll("style")).forEach(H=>{if((H.id||"").startsWith("wappy-studio-bridge"))return;const ae=H.textContent||"";ae&&!a.includes(ae.slice(0,120))&&(o+=`
${ae}`)})}catch{o=""}const[n,u]=await Promise.all([/gsap(\.min)?\.js/i.test(a)?r("/assets/gsap.min.js"):Promise.resolve(""),/cdn\.tailwindcss\.com|tailwind-cdn\.js/i.test(a)?r("/assets/tailwind-cdn.js"):Promise.resolve("")]);n&&(a=a.replace(/<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-gsap">${s(n)}<\/script>`)),a=a.replace(/<script[^>]*src=["'][^"']*(cdn\.tailwindcss\.com|tailwind-cdn\.js)[^"']*["'][^>]*>\s*<\/script>/gi,()=>"<script>window.tailwind = window.tailwind || {};<\/script>"+(u?`<script id="wappy-inline-tailwind">${s(u)}<\/script>`:""));const x=`
<meta name="color-scheme" content="dark" />
<meta name="format-detection" content="telephone=no" />
<style id="wappy-precompiled-tailwind">${o.replace(/<\/style/gi,"<\\/style")}</style>
<style id="wappy-offline-font-fallback">
  html, body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
</style>
<noscript><style>
  #header-hud, #top-bar, #scene-1, #scene-1 *, #hero-card, .metric-item { opacity: 1 !important; transform: none !important; visibility: visible !important; }
  #wappy-capsule-controls, #wappy-mobile-tap-overlay { display: none !important; }
</style></noscript>`;/<head[^>]*>/i.test(a)?a=a.replace(/<head[^>]*>/i,M=>`${M}${x}`):a=`${x}
${a}`,/<meta[^>]+name=["']viewport/i.test(a)||(a=a.replace(/<head[^>]*>/i,M=>`${M}<meta name="viewport" content="width=device-width, initial-scale=1.0" />`));const T=`<script id="wappy-visibility-guard">
(function(){
  function reveal(){
    if (window.gsap) return;
    var sel = ['#header-hud','#top-bar','#scene-1','#hero-card'];
    sel.forEach(function(s){
      var el = document.querySelector(s);
      if (!el) return;
      el.style.opacity = '1'; el.style.transform = 'none';
      el.classList && el.classList.remove('opacity-0');
      Array.prototype.forEach.call(el.querySelectorAll('.opacity-0'), function(c){ c.style.opacity='1'; c.style.transform='none'; });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.metric-item'), function(c){ c.style.opacity='1'; });
  }
  window.addEventListener('load', function(){ setTimeout(reveal, 600); });
})();
<\/script>`;return a=a.includes("</body>")?a.replace("</body>",()=>`${T}
</body>`):`${a}
${T}`,a},Da=async()=>{const t=await zs(te.current||ze),a=await Rt(),s=a?`data:audio/wav;base64,${a}`:"",r=Math.max(4,Math.round((B||20)*10)/10),o=`
<!-- WAPPY ACADEMIA (LMS) & MOBILE RESPONSIVE CAPSULE PLAYER -->
<style id="wappy-academy-capsule-styles">
  html, body {
    width: 100% !important;
    height: 100dvh !important;
    min-height: -webkit-fill-available !important;
    max-width: 100vw !important;
    max-height: 100dvh !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  /* Ocultar subtítulo duplicado interno del HTML para que solo se vea el subtítulo palabra a palabra sincronizado */
  ${ee&&me.length>0?"#subtitle-footer, #subtitle-card { display: none !important; }":""}
  #stage {
    padding-bottom: 112px !important;
    transform-origin: top center !important;
  }
  @media (max-height: 740px), (max-width: 480px) {
    #stage {
      padding: 12px 14px 108px 14px !important;
    }
    #stage h1 {
      font-size: clamp(1.25rem, 5vw, 1.65rem) !important;
      line-height: 1.15 !important;
    }
    #stage h2 {
      font-size: clamp(1rem, 4.2vw, 1.35rem) !important;
    }
  }
  #wappy-capsule-subtitles {
    position: fixed;
    left: 12px;
    right: 12px;
    z-index: 9990;
    display: flex;
    justify-content: center;
    pointer-events: none;
    ${ye==="top"?"top: 54px;":ye==="center"?"top: 50%; transform: translateY(-50%);":"bottom: 58px;"}
  }
  #wappy-capsule-controls {
    position: fixed;
    left: 10px;
    right: 10px;
    bottom: max(8px, env(safe-area-inset-bottom, 8px));
    max-width: 540px;
    margin: 0 auto;
    z-index: 9995;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    border-radius: 14px;
    background: rgba(8, 15, 26, 0.92);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(45, 212, 191, 0.28);
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #fff;
    box-shadow: 0 10px 30px rgba(0,0,0,0.65);
  }
  #wappy-capsule-controls button {
    background: #0d9488;
    color: #fff;
    border: none;
    border-radius: 9px;
    padding: 6px 11px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
  }
  #wappy-capsule-controls button.secondary {
    background: rgba(255,255,255,0.12);
  }
  #wappy-capsule-controls input[type="range"] {
    flex: 1;
    min-width: 60px;
    accent-color: #14b8a6;
    cursor: pointer;
    height: 5px;
  }
  #wappy-mobile-tap-overlay {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: rgba(4, 10, 18, 0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  #wappy-mobile-tap-btn {
    background: linear-gradient(135deg, #0d9488, #10b981);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 20px;
    padding: 14px 24px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px;
    font-weight: 800;
    box-shadow: 0 20px 45px rgba(13, 148, 136, 0.45);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
  }
</style>
${s?`<audio id="wappy-capsule-audio" src="${s}" preload="auto" playsinline></audio>`:""}
<div id="wappy-mobile-tap-overlay">
  <button type="button" id="wappy-mobile-tap-btn">🔊 Tocar para Reproducir Cápsula con Voz</button>
</div>
<div id="wappy-capsule-subtitles" style="display:${ee&&me.length>0?"flex":"none"};">
  <div id="wappy-capsule-sub-box" style="background:rgba(4,10,18,0.9);backdrop-filter:blur(10px);border:1px solid rgba(45,212,191,0.35);padding:7px 13px;border-radius:13px;text-align:center;max-width:95%;display:flex;flex-wrap:wrap;justify-content:center;gap:5px;"></div>
</div>
<div id="wappy-capsule-controls">
  <button type="button" id="wappy-btn-play">⏸ Pausar</button>
  <button type="button" id="wappy-btn-restart" class="secondary" title="Reiniciar">↺</button>
  <input type="range" id="wappy-seek" min="0" max="${r}" step="0.1" value="0" />
  <span id="wappy-time-label" style="font-size:10px;font-family:monospace;font-weight:700;color:#cbd5e1;white-space:nowrap;">0.0s / ${r}s</span>
</div>
<script id="wappy-academy-capsule-runtime">
(function() {
  var words = ${JSON.stringify(me)};
  var showSubs = ${!!(ee&&me.length>0)};
  var duration = ${r};
  var currentTime = 0;
  var playing = true;
  var audioEl = document.getElementById('wappy-capsule-audio');
  var btnPlay = document.getElementById('wappy-btn-play');
  var btnRestart = document.getElementById('wappy-btn-restart');
  var seekEl = document.getElementById('wappy-seek');
  var timeLabel = document.getElementById('wappy-time-label');
  var subBox = document.getElementById('wappy-capsule-sub-box');
  var tapOverlay = document.getElementById('wappy-mobile-tap-overlay');
  var tapBtn = document.getElementById('wappy-mobile-tap-btn');

  // Auto-escala responsiva para pantallas móviles pequeñas (evita cortes verticales u horizontales)
  function fitMobileCapsule() {
    var stage = document.getElementById('stage');
    if (!stage) return;
    stage.style.transform = 'none';
    var vh = window.innerHeight || document.documentElement.clientHeight || 700;
    var sh = stage.scrollHeight || stage.offsetHeight || vh;
    if (sh > vh && vh > 240) {
      var scale = Math.max(0.72, Math.min(1, (vh - 16) / sh));
      stage.style.transform = 'scale(' + scale.toFixed(3) + ')';
    }
  }
  window.addEventListener('resize', fitMobileCapsule);
  window.addEventListener('orientationchange', function() { setTimeout(fitMobileCapsule, 150); });
  setTimeout(fitMobileCapsule, 120);

  function renderSubtitles(t) {
    if (!showSubs || !subBox || !words.length) return;
    var p = Math.max(0, Math.min(0.999, t / Math.max(1, duration)));
    var activeIdx = Math.floor(p * words.length);
    var winSize = 5;
    var winStart = Math.floor(activeIdx / winSize) * winSize;
    var slice = words.slice(winStart, winStart + winSize);
    var activeOffset = activeIdx - winStart;
    subBox.innerHTML = slice.map(function(w, i) {
      if (i === activeOffset) {
        return '<span style="font-size:clamp(12px,3.4vw,14px);font-weight:900;text-transform:uppercase;color:#fcd34d;background:rgba(20,184,166,0.32);padding:2px 6px;border-radius:6px;border:1px solid rgba(45,212,191,0.55);">' + w + '</span>';
      }
      return '<span style="font-size:clamp(12px,3.4vw,14px);font-weight:800;text-transform:uppercase;color:rgba(255,255,255,0.94);">' + w + '</span>';
    }).join(' ');
  }

  function updateUi(t) {
    currentTime = t;
    if (seekEl) seekEl.value = String(t);
    if (timeLabel) timeLabel.textContent = t.toFixed(1) + 's / ' + duration.toFixed(1) + 's';
    renderSubtitles(t);
  }

  function stopMasterTimeline() {
    try {
      if (window.mainTimeline && typeof window.mainTimeline.repeat === 'function') {
        window.mainTimeline.repeat(0);
      }
      if (window.mainTimeline && typeof window.mainTimeline.pause === 'function') {
        window.mainTimeline.pause();
      }
      if (window.gsap && window.gsap.globalTimeline) {
        window.gsap.globalTimeline.pause();
      }
    } catch (e) {}
  }

  function playMasterTimeline(fromStart) {
    try {
      if (window.mainTimeline && typeof window.mainTimeline.repeat === 'function') {
        window.mainTimeline.repeat(0);
      }
      if (window.gsap && window.gsap.globalTimeline) {
        window.gsap.globalTimeline.play();
      }
      if (window.mainTimeline) {
        if (fromStart) window.mainTimeline.restart();
        else window.mainTimeline.play();
      }
    } catch (e) {}
  }

  function startCapsuleWithSound() {
    if (tapOverlay) tapOverlay.style.display = 'none';
    playing = true;
    if (btnPlay) btnPlay.textContent = '⏸ Pausar';
    playMasterTimeline(true);
    if (audioEl) {
      audioEl.currentTime = 0;
      audioEl.play().catch(function(){});
    }
    updateUi(0);
  }

  if (tapBtn) tapBtn.addEventListener('click', startCapsuleWithSound);
  if (tapOverlay) tapOverlay.addEventListener('click', startCapsuleWithSound);

  // Desactivar repeat: -1 en cualquier timeline existente al cargar
  window.addEventListener('load', function() {
    try {
      if (window.mainTimeline && typeof window.mainTimeline.repeat === 'function') {
        window.mainTimeline.repeat(0);
      }
    } catch (e) {}
  });

  if (audioEl) {
    audioEl.addEventListener('loadedmetadata', function() {
      if (audioEl.duration && !isNaN(audioEl.duration)) {
        duration = audioEl.duration;
        if (seekEl) seekEl.max = String(duration);
      }
    });
    audioEl.addEventListener('timeupdate', function() {
      updateUi(audioEl.currentTime);
    });
    audioEl.addEventListener('ended', function() {
      playing = false;
      stopMasterTimeline();
      updateUi(duration);
      if (btnPlay) btnPlay.textContent = '▶ Volver a Reproducir';
    });
    audioEl.play().catch(function() {
      // En celulares (iOS/Android), el navegador pide 1 toque para activar el sonido
      playing = false;
      stopMasterTimeline();
      if (btnPlay) btnPlay.textContent = '▶ Play';
      if (tapOverlay) tapOverlay.style.display = 'flex';
    });
  }

  setInterval(function() {
    if (!playing) return;
    if (audioEl && !audioEl.paused) return;
    var next = currentTime + 0.2;
    if (next >= duration) {
      playing = false;
      stopMasterTimeline();
      updateUi(duration);
      if (btnPlay) btnPlay.textContent = '▶ Volver a Reproducir';
      return;
    }
    updateUi(next);
  }, 200);

  if (btnPlay) {
    btnPlay.addEventListener('click', function() {
      if (tapOverlay) tapOverlay.style.display = 'none';
      // Si ya había terminado, al darle Play vuelve a empezar desde 0.0s con el audio y la animación unidos
      if (!playing && (currentTime >= duration - 0.3 || (audioEl && audioEl.ended))) {
        startCapsuleWithSound();
        return;
      }
      playing = !playing;
      btnPlay.textContent = playing ? '⏸ Pausar' : '▶ Play';
      if (playing) {
        playMasterTimeline(false);
        if (audioEl) audioEl.play().catch(function(){});
      } else {
        stopMasterTimeline();
        if (audioEl) audioEl.pause();
      }
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', startCapsuleWithSound);
  }

  if (seekEl) {
    seekEl.addEventListener('input', function(e) {
      var val = parseFloat(e.target.value) || 0;
      updateUi(val);
      if (audioEl) audioEl.currentTime = val;
      if (window.mainTimeline) {
        var tlDur = window.mainTimeline.duration() || duration;
        window.mainTimeline.time(val % tlDur);
      }
    });
  }

  renderSubtitles(0);
})();
<\/script>`;return t.includes("</body>")?t.replace("</body>",()=>`${o}
</body>`):`${t}
${o}`},Be=i.useRef(null),$t=async(t={},a=!0)=>{var s;try{const r=te.current||ze,o=(c==null?void 0:c.mediaKey)||Z||"sin-audio",n=`${r.length}:${r.slice(-200)}:${o}:${A}`,x=((s=Be.current)==null?void 0:s.signature)===n&&ue.some(ae=>{var I;return ae.id===((I=Be.current)==null?void 0:I.id)})?Be.current.id:`video-${Date.now()}`,T=`html-${x}`;await Ne(T,new Blob([r],{type:"text/html"}));let F=c==null?void 0:c.mediaKey;if(!F&&Z){const ae=await Rt();ae&&(F=`audio-${x}`,await Ne(F,dt(ae)))}let M;t.mp4Blob&&(M=`mp4-${x}`,await Ne(M,t.mp4Blob));let H;t.capsuleHtml&&(H=`capsule-${x}`,await Ne(H,new Blob([t.capsuleHtml],{type:"text/html"})));const be=((c==null?void 0:c.scriptText)||k||Qe||"").replace(/<[^>]+>/g,"").trim();Ce(ae=>{const I=ae.find(Ut=>Ut.id===x);return[{...I||{},id:x,kind:"video",title:(I==null?void 0:I.title)||`Video ${A}: ${be.slice(0,40)}...`,createdAt:(I==null?void 0:I.createdAt)||Date.now(),voiceName:(c==null?void 0:c.voiceName)||b,model:Ee,durationSeconds:Math.round((B||0)*10)/10,wordCount:be.split(/\s+/).filter(Boolean).length,scriptText:(c==null?void 0:c.scriptText)||k,htmlKey:T,mediaKey:F||(I==null?void 0:I.mediaKey),mp4Key:M||(I==null?void 0:I.mp4Key),capsuleKey:H||(I==null?void 0:I.capsuleKey),aspectRatio:A,showSubtitles:ee,subtitlePosition:ye},...ae.filter(Ut=>Ut.id!==x)]}),Be.current={id:x,signature:n},a||g({type:"success",text:"¡Video guardado en la Biblioteca! Puedes reabrirlo, editarlo o descargarlo cuando quieras."})}catch(r){g({type:"error",text:`No se pudo guardar el video en la Biblioteca: ${(r==null?void 0:r.message)||"error de almacenamiento"}`})}},As=async t=>{const a=t.htmlKey?await He(t.htmlKey):null;if(!a){g({type:"error",text:"No se encontró la composición HTML de este video."});return}const s=await a.text();t.aspectRatio&&Et(t.aspectRatio),typeof t.showSubtitles=="boolean"&&ga(t.showSubtitles),t.subtitlePosition&&oa(t.subtitlePosition),te.current="",Ae(s);const r=t.mediaKey?await He(t.mediaKey):null;r&&$({url:Ea(r),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey}),t.durationSeconds&&t.durationSeconds>1&&Re(t.durationSeconds),ie(0),we(!1),Be.current=null,pe("video")},Ia=async()=>{var t,a;try{st(!0);const s=await Da();$t({capsuleHtml:s});const r=`wappy-academia-capsula-${Date.now()}.html`,o=new Blob([s],{type:"text/html;charset=utf-8"});if(typeof window<"u"&&((t=window.matchMedia)==null?void 0:t.call(window,"(pointer: coarse)").matches)&&typeof navigator.share=="function")try{const T=new File([o],r,{type:"text/html"});if((a=navigator.canShare)!=null&&a.call(navigator,{files:[T]})){await navigator.share({files:[T],title:"Cápsula WAPPY",text:"Cápsula interactiva WAPPY (ábrela tocando el archivo)."}),g({type:"success",text:"¡Cápsula HTML compartida! Funciona sin internet al tocarla en WhatsApp."});return}}catch(T){if((T==null?void 0:T.name)==="AbortError")return}const u=URL.createObjectURL(o),x=document.createElement("a");x.href=u,x.download=r,document.body.appendChild(x),x.click(),document.body.removeChild(x),URL.revokeObjectURL(u),g({type:"success",text:"¡Cápsula HTML autocontenida descargada! Incluye estilos, animación y voz en un solo archivo: envíala por WhatsApp y ábrela tocándola, incluso sin internet."})}finally{st(!1)}},Ps=async()=>{try{st(!0);const s=`<iframe srcdoc="${(await Da()).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" style="width:100%;max-width:${A==="9:16"?"400px":"860px"};aspect-ratio:${A==="9:16"?"9/16":"16/9"};border:0;border-radius:16px;overflow:hidden;display:block;margin:0 auto;box-shadow:0 20px 50px rgba(0,0,0,0.35);" allow="autoplay; fullscreen"></iframe>`;await navigator.clipboard.writeText(s),g({type:"success",text:"¡Código <iframe srcdoc> copiado al portapapeles! Pégalo directamente en cualquier lección de la Academia WAPPY (LMS)."})}catch{g({type:"error",text:"No se pudo copiar el código embebido al portapapeles."})}finally{st(!1)}},Le=((Oa=P==null?void 0:P.supportedVoices)==null?void 0:Oa.length)||14;return!d&&p&&p.role!=="ADMIN"?e.jsx("div",{className:"flex-1 flex items-center justify-center bg-surface-secondary/30 min-h-screen p-6",children:e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md",children:[e.jsx("div",{className:"w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto",children:e.jsx(Va,{className:"w-6 h-6"})}),e.jsx("h2",{className:"text-lg font-extrabold text-text-primary",children:"WAPPY Studio (Acceso Administrador)"}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Por el momento este módulo está habilitado exclusivamente para cuentas de Administración de WAPPY."}),e.jsx("a",{href:"/c/new",className:"inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition",children:"Volver al inicio"})]})}):e.jsxs("div",{className:f("flex-1 flex flex-col",d?"bg-transparent h-auto overflow-visible pb-6":"bg-surface-secondary/30 min-h-[100dvh] h-auto overflow-y-auto pb-16"),children:[e.jsx("header",{className:f("bg-white dark:bg-gray-900 px-4 sm:px-6 py-4 shadow-2xs z-30",d?"relative rounded-3xl border border-slate-200/80 dark:border-zinc-800 max-w-7xl w-full mx-auto":"sticky top-0 border-b border-border-medium/40"),children:e.jsxs("div",{className:"max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[m&&!h&&e.jsx("div",{className:"hidden md:block",children:e.jsx(Js,{setNavVisible:j})}),e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2 mb-1",children:e.jsxs("span",{className:"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wider",children:[e.jsx(ge,{className:"w-3 h-3 text-teal-500"}),"Estudio Multimodal • Gemini 3.8 Flash TTS & HyperFrames"]})}),e.jsxs("h1",{className:"text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400",children:[e.jsx(Va,{className:"w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0"}),"WAPPY Studio"]}),e.jsx("p",{className:"text-xs text-text-secondary mt-0.5 hidden sm:block",children:"Síntesis de voz neural de hasta 1 hora continua y creación de videos animados en HTML/GSAP con capas sobre tus propios videos."})]})]}),e.jsxs("div",{className:"flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-nowrap",children:[e.jsxs("div",{className:"inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-x-auto no-scrollbar min-w-0",children:[e.jsxs("button",{type:"button",onClick:()=>pe("tts"),className:f("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",v==="tts"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(_e,{className:"w-3.5 h-3.5 text-teal-500"}),e.jsx("span",{children:"Estudio de Voz (TTS)"})]}),e.jsxs("button",{type:"button",onClick:()=>pe("video"),className:f("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",v==="video"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Se,{className:"w-3.5 h-3.5 text-purple-500"}),e.jsx("span",{children:"Video HTML & Capas"})]}),e.jsxs("button",{type:"button",onClick:()=>pe("lab"),className:f("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",v==="lab"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Bt,{className:"w-3.5 h-3.5 text-amber-500"}),e.jsx("span",{children:"Voces & Bursts"})]}),e.jsxs("button",{type:"button",onClick:()=>pe("library"),className:f("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",v==="library"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(_t,{className:"w-3.5 h-3.5 text-indigo-500"}),e.jsxs("span",{children:["Biblioteca (",ue.length,")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(Xs,{selectedModel:Ee,onSelectModel:gt,disabled:et}),e.jsx(y,{icon:e.jsx(Ra,{}),label:`Claves IA (${ms})`,variant:"fuchsia",onClick:()=>{it(""),At(!0)},title:"Configurar hasta 3 claves Google Gemini con rotación inteligente"}),e.jsx(y,{icon:sa?e.jsx(W,{className:"animate-spin"}):e.jsx($a,{}),label:"Probar Audio con IA",variant:"purple",disabled:sa,onClick:vs}),!d&&e.jsx(y,{icon:e.jsx(Ls,{}),label:"Landing / App Portable",variant:"cyan",onClick:()=>window.open("/wappystudio.html","_blank","noopener,noreferrer"),title:"Abrir Landing Page Pública y Aplicativo Portable de WAPPY Studio"})]})]})]})}),e.jsxs("main",{className:"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6",children:[Pe&&e.jsxs("div",{className:f("p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200",Pe.type==="success"?"bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200":Pe.type==="error"?"bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200":"bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200"),children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[Pe.type==="success"?e.jsx(Kt,{className:"w-4 h-4 text-emerald-500 shrink-0"}):Pe.type==="error"?e.jsx(Ua,{className:"w-4 h-4 text-rose-500 shrink-0"}):e.jsx(W,{className:"w-4 h-4 text-sky-500 animate-spin shrink-0"}),e.jsx("span",{children:Pe.text})]}),e.jsx("button",{type:"button",onClick:()=>g(null),className:"p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10",children:e.jsx(ct,{className:"w-3.5 h-3.5"})})]}),c&&e.jsx(ur,{audioBase64:c.base64,audioUrl:c.url,title:c.title,durationSeconds:c.durationSeconds,voiceName:c.voiceName,onSendToVideo:()=>{pe("video"),g({type:"success",text:"Audio vinculado automáticamente a la pista de locución del Compositor de Video."})}}),v==="tts"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[O&&e.jsx(pr,{job:O,onPause:()=>Dt("pause"),onResume:()=>Dt("resume"),onCancel:()=>Dt("cancel"),onPlayChunk:t=>{t.audioBase64&&$({base64:t.audioBase64,title:`Fragmento #${t.index+1} (${t.durationSeconds||0}s)`,durationSeconds:t.durationSeconds,voiceName:b})},onLoadMaster:()=>{O.downloadUrl&&$({url:O.downloadUrl,title:`Master Completo (${b})`,durationSeconds:O.generatedTotalSeconds,voiceName:b,scriptText:k})}}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",children:[e.jsxs("div",{className:"lg:col-span-5 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"space-y-2.5",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-1.5",children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(Ds,{className:"w-4 h-4 text-teal-500"}),"Modelo Oficial Gemini TTS"]}),e.jsx("span",{className:"text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full",children:"Verificado en AI Studio"})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:de.map(t=>{const a=S===t.id;return e.jsxs("button",{type:"button",onClick:()=>{D(t.id),t.supportedVoices.includes(b)||Y(t.supportedVoices[0]||"Kore")},className:f("text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30 shadow-xs":"bg-slate-50/60 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-text-primary",children:t.name}),e.jsx("span",{className:f("text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0",t.badgeColor),children:t.badge})]}),e.jsx("p",{className:"text-[11px] text-text-secondary leading-snug",children:t.description})]}),e.jsxs("div",{className:"mt-2.5 pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-amber-600 dark:text-amber-400 font-bold",children:t.rateLimitLabel||t.quotaLabel}),a?e.jsxs("span",{className:"text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5",children:[e.jsx(ut,{className:"w-3 h-3"})," Activo (",t.supportedVoices.length," voces)"]}):e.jsxs("span",{className:"text-text-secondary",children:[t.supportedVoices.length," voces"]})]})]},t.id)})}),e.jsxs("div",{className:"px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"text-text-secondary flex items-center gap-1.5",children:[e.jsx(ge,{className:"w-3.5 h-3.5 text-teal-500 shrink-0"}),e.jsxs("span",{children:["Voces activas para"," ",e.jsx("strong",{className:"text-text-primary",children:P==null?void 0:P.name}),":"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsxs("span",{className:"font-extrabold text-emerald-600 dark:text-emerald-400",children:[Le," de ",C.length," disponibles"]}),Le<C.length&&e.jsxs("button",{type:"button",onClick:()=>D("gemini-3.8-flash-tts"),className:"text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer",children:["Mostrar todas (",C.length,")"]})]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"block text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"Estilos y Plantillas Rápidas"}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:Te.map(t=>e.jsx("button",{type:"button",onClick:()=>{Ue(t.voiceName)||D("gemini-3.8-flash-tts"),t.multiSpeaker?(yt(!0),t.speaker1&&Jt(t.speaker1.voiceName),t.speaker2&&Xt(t.speaker2.voiceName)):(yt(!1),Y(t.voiceName)),Yt(t.style)},className:"text-xs px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80 hover:border-teal-500/50 hover:bg-teal-500/10 text-text-primary font-semibold transition cursor-pointer",children:t.name},t.id))})]}),e.jsxs("div",{className:"flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/90 rounded-xl border border-slate-200/80 dark:border-zinc-800 gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx(Is,{className:"w-4 h-4 text-teal-500 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-text-primary",children:"Modo Diálogo / Podcast (2 Voces)"}),e.jsxs("p",{className:"text-[11px] text-text-secondary",children:["Alterna interlocutores usando"," ",e.jsx("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:"Alex:"})," ","y"," ",e.jsx("span",{className:"font-mono font-bold text-purple-600 dark:text-purple-400",children:"Sam:"})]})]})]}),e.jsx("button",{type:"button",onClick:()=>yt(!he),className:f("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",he?"bg-teal-600":"bg-slate-300 dark:bg-zinc-700"),children:e.jsx("span",{className:f("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",he?"translate-x-4":"translate-x-0")})})]}),he?e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200/80 dark:border-zinc-800",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-teal-600 dark:text-teal-400 mb-1",children:"Voz para Alex (Hablante 1)"}),e.jsx("select",{value:We,onChange:t=>Jt(t.target.value),className:"w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500",children:((P==null?void 0:P.supportedVoices)||[]).map(t=>{const a=C.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-purple-600 dark:text-purple-400 mb-1",children:"Voz para Sam (Hablante 2)"}),e.jsx("select",{value:Ke,onChange:t=>Xt(t.target.value),className:"w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500",children:((P==null?void 0:P.supportedVoices)||[]).map(t=>{const a=C.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(_e,{className:"w-3.5 h-3.5 text-teal-500"}),"Catálogo de Voces (",Le," activas / ",C.length," totales)"]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-0.5",children:"Las voces no compatibles con la versión seleccionada quedan desactivadas."})]}),e.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px]",children:[e.jsxs("button",{type:"button",onClick:()=>ia("only_active"),className:f("px-2 py-0.5 rounded-md transition cursor-pointer",Je==="only_active"?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:["Solo Activas (",Le,")"]}),e.jsxs("button",{type:"button",onClick:()=>ia("all"),className:f("px-2 py-0.5 rounded-md transition cursor-pointer",Je==="all"?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:["Todas (",C.length,")"]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(Os,{className:"w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"}),e.jsx("input",{type:"search",name:"wappy-voice-search",autoComplete:"off",value:Nt,onChange:t=>as(t.target.value),placeholder:"Buscar voz (Kore, Orus, profunda, podcast...)",className:"w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-slate-400 focus:outline-none focus:border-teal-500"})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-[11px] shrink-0",children:["all","Femenino","Masculino"].map(t=>e.jsx("button",{type:"button",onClick:()=>ts(t),className:f("px-2 py-1 rounded-lg transition cursor-pointer",Ye===t?"bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-300 font-bold shadow-2xs":"text-text-secondary hover:text-text-primary"),children:t==="all"?"Todas":t==="Femenino"?"Femeninas":"Masculinas"},t))})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1",children:fs.map(t=>{const a=b===t.id,s=es===t.id,r=Ue(t.id);return e.jsxs("div",{onClick:()=>{r||D("gemini-3.8-flash-tts"),Y(t.id)},className:f("p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30 shadow-xs":"bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400",!r&&"opacity-60"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-start justify-between gap-1",children:[e.jsx("span",{className:"text-sm font-extrabold text-text-primary",children:t.name}),e.jsx("button",{type:"button",onClick:o=>ys(t.id,o),disabled:s,title:"Escuchar muestra de esta voz",className:"p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer",children:s?e.jsx(W,{className:"w-3 h-3 animate-spin"}):e.jsx(le,{className:"w-3 h-3 fill-current"})})]}),e.jsxs("div",{className:"flex items-center gap-1 flex-wrap mt-1",children:[e.jsx("span",{className:"text-[9px] font-semibold text-text-secondary bg-slate-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded",children:t.gender}),r?e.jsx("span",{className:"text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded",children:"✓ Activa"}):e.jsx("span",{className:"text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded",children:"Solo 3.8/3.1"})]}),e.jsx("p",{className:"text-[11px] text-teal-700 dark:text-teal-300 font-semibold mt-1 leading-tight",children:t.tone}),t.tag&&e.jsx("span",{className:"inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20",children:t.tag})]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-slate-200/60 dark:border-zinc-800 line-clamp-2 leading-tight",children:t.recommendedFor})]},t.id)})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"Directiva de Estilo y Emoción"}),e.jsx("span",{className:"text-[10px] font-mono text-text-secondary",children:"speechMetadata.style"})]}),e.jsx("textarea",{rows:2,value:se,onChange:t=>Yt(t.target.value),placeholder:"Ej: Voz cálida, pausada y reflexiva de narrador de documentales...",className:"w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{children:[e.jsxs("button",{type:"button",onClick:()=>ss(!St),className:"flex items-center justify-between w-full text-xs text-text-secondary hover:text-text-primary font-bold py-1 transition cursor-pointer",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(Vs,{className:"w-3.5 h-3.5 text-teal-500"}),"Configuración Avanzada de Segmentación (Chunking)"]}),e.jsx("span",{children:St?"▲":"▼"})]}),St&&e.jsxs("div",{className:"mt-2 p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2 text-xs",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-text-secondary",children:"Palabras por fragmento"}),e.jsxs("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:[fe," palabras"]})]}),e.jsx("input",{type:"range",min:80,max:250,step:10,value:fe,onChange:t=>Ga(parseInt(t.target.value,10)),className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-teal-600"}),e.jsx("p",{className:"text-[10px] text-text-secondary",children:"Fragmentos de ~150 palabras (~55s de audio) garantizan fluidez continua para audiolibros de hasta 60 minutos."})]})]})]}),e.jsxs("div",{className:"lg:col-span-7 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"flex items-center justify-between gap-3 flex-nowrap",children:[e.jsxs("h2",{className:"text-sm font-extrabold text-text-primary flex items-center gap-2 shrink-0",children:[e.jsx(_e,{className:"w-4 h-4 text-teal-500"}),"Texto a Sintetizar"]}),e.jsxs("div",{className:"flex items-center gap-2 min-w-0 flex-nowrap",children:[e.jsx("span",{className:"text-xs text-text-secondary hidden sm:inline",children:"Cargar ejemplo:"}),e.jsxs("select",{defaultValue:"",onChange:t=>{const a=Ht.find(s=>s.title===t.target.value);a&&Oe(a.text),t.target.value=""},className:"min-w-0 w-full max-w-[220px] sm:max-w-none sm:w-auto bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-primary text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500",children:[e.jsx("option",{value:"",disabled:!0,children:"Seleccionar texto de muestra..."}),Ht.map(t=>e.jsx("option",{value:t.title,children:t.title},t.title))]}),k&&e.jsx(y,{size:"sm",icon:e.jsx(ke,{}),label:"Limpiar",variant:"danger",onClick:()=>Oe("")})]})]}),e.jsxs("div",{className:"p-3 bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px]",children:[e.jsxs("span",{className:"font-bold text-text-secondary flex items-center gap-1",children:[e.jsx(ge,{className:"w-3.5 h-3.5 text-amber-500"}),"Insertar Efectos Vocales (Vocal Bursts) en el cursor:"]}),e.jsx("span",{className:"font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold",children:S})]}),e.jsxs("div",{className:"flex flex-wrap gap-1.5",children:[N.map(t=>e.jsxs("button",{type:"button",onClick:()=>It(` ${t.tag} `),title:t.description,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-teal-500/10 border border-slate-200 dark:border-zinc-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer",children:[e.jsx("span",{className:"text-amber-600 dark:text-amber-400 font-bold",children:t.tag}),e.jsxs("span",{className:"text-text-secondary text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),e.jsx("button",{type:"button",onClick:()=>It(`
Alex: `),className:"px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold transition cursor-pointer",children:"Alex:"}),e.jsx("button",{type:"button",onClick:()=>It(`
Sam: `),className:"px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold transition cursor-pointer",children:"Sam:"})]})]}),e.jsx("textarea",{id:"wappy-studio-tts-editor",rows:12,value:k,onChange:t=>Oe(t.target.value),placeholder:"Escribe o pega aquí el guion para tu cápsula SST, curso de Academia WAPPY, podcast o audiolibro de hasta 1 hora...",className:"w-full bg-slate-50/70 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-teal-500 leading-relaxed resize-y min-h-[260px]"}),e.jsxs("div",{className:"bg-slate-50 dark:bg-zinc-900/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between text-xs gap-2",children:[e.jsxs("div",{className:"flex items-center gap-3 text-text-secondary",children:[e.jsxs("span",{children:["Palabras:"," ",e.jsx("strong",{className:"text-text-primary font-mono",children:ta})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Caracteres:"," ",e.jsx("strong",{className:"text-text-primary font-mono",children:Za})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Fragmentos estimados:"," ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400 font-mono",children:jt})]})]}),e.jsxs("div",{className:"text-text-primary font-semibold",children:["Duración estimada:"," ",e.jsxs("strong",{className:"text-amber-600 dark:text-amber-400 font-mono",children:["~",wt," min"]})," ","/ 60 min máx"]})]}),e.jsx("div",{className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,Math.round(wt/60*100)))}%`}})})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1",children:[e.jsxs("button",{type:"button",onClick:ws,disabled:kt||(O==null?void 0:O.status)==="processing"||!k.trim(),className:"flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[kt?e.jsx(W,{className:"w-4 h-4 animate-spin text-teal-500"}):e.jsx($a,{className:"w-4 h-4 text-amber-500"}),e.jsx("span",{children:"Vista Previa Rápida (~1er fragmento)"})]}),e.jsxs("button",{type:"button",onClick:ks,disabled:(O==null?void 0:O.status)==="processing"||kt||!k.trim(),className:"flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[(O==null?void 0:O.status)==="processing"?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(le,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:jt>1?`Generar Audio Completo (${jt} fragmentos • ~${wt} min)`:"Generar Audio Completo"})]})]})]})]})]}),v==="video"&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200",children:[e.jsxs("div",{className:"lg:col-span-6 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsx("div",{className:"flex items-center justify-between gap-2",children:e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-text-primary flex items-center gap-2",children:[e.jsx(Se,{className:"w-5 h-5 text-purple-500"}),"Estudio de Capas & Motion Graphics HTML"]}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Sube tu propio video grabado a cámara o genera animaciones estilo Claude/HeyGen sincronizadas con tu voz."})]})}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",onClick:()=>{Et("9:16"),Me("9:16",!!U,Xe)},className:f("p-3 rounded-xl border text-left transition cursor-pointer",A==="9:16"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-text-primary",children:"📱 Vertical 9:16 (Reels / TikTok)"}),e.jsx("div",{className:"text-[10px] text-text-secondary mt-0.5",children:"1080 × 1920 px • Ideal para redes y WhatsApp"})]}),e.jsxs("button",{type:"button",onClick:()=>{Et("16:9"),Me("16:9",!!U,Xe)},className:f("p-3 rounded-xl border text-left transition cursor-pointer",A==="16:9"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-text-primary",children:"🖥️ Horizontal 16:9 (YouTube / LMS)"}),e.jsx("div",{className:"text-[10px] text-text-secondary mt-0.5",children:"1920 × 1080 px • Ideal para cursos Academia WAPPY"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(ge,{className:"w-3.5 h-3.5 text-teal-500"}),"Plantillas Visuales Instantáneas (HyperFrames)"]}),e.jsx("span",{className:"text-[10px] text-text-secondary",children:"Clic para aplicar"})]}),e.jsx("div",{className:"grid grid-cols-2 gap-2",children:or.map(t=>{const a=Xe===t.id;return e.jsxs("button",{type:"button",onClick:()=>{rs(t.id),Me(A,!!U,t.id)},className:f("p-2.5 rounded-xl border text-left transition cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50/70 dark:bg-zinc-900/70 border-slate-200 dark:border-zinc-800 hover:border-teal-400"),children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-text-primary truncate",children:t.name}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0",children:t.badge})]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-0.5 line-clamp-1",children:t.description})]},t.id)})})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3",children:[e.jsxs("div",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(Bt,{className:"w-4 h-4 text-teal-500"}),"Capas Base Multimedia (Video a Cámara + Locución)"]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{className:"p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-text-primary",children:"1. Tu Video Base (Opcional)"}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:ua?`Activo: ${ua}`:"Sube un MP4/WebM tuyo para montarle capas HTML encima."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(Ba,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Video MP4"}),e.jsx("input",{type:"file",accept:"video/mp4,video/webm,video/quicktime",onChange:Es,className:"hidden"})]}),U&&e.jsx(y,{size:"sm",icon:e.jsx(ke,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(U),ca(null),pa(""),Me(A,!1)}})]})]}),e.jsxs("div",{className:"p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-text-primary",children:"2. Audio / Locución Sincronizada"}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:ma?`Archivo: ${ma}`:c?`Vinculado: ${c.title}`:"Usa el audio del Estudio TTS o sube un WAV/MP3."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(Ba,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Audio WAV/MP3"}),e.jsx("input",{type:"file",accept:"audio/*",onChange:Ts,className:"hidden"})]}),ve&&e.jsx(y,{size:"sm",icon:e.jsx(ke,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(ve),xa(null),ba("")}})]})]})]})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"3. Textos de Capa y Subtítulos Dinámicos"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:ee,onChange:t=>ga(t.target.checked),className:"rounded accent-teal-600"}),"Subtítulos"]}),ee&&e.jsx("div",{className:"inline-flex items-center gap-0.5 bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[10px]",children:[{id:"bottom",label:"Abajo"},{id:"center",label:"Centro"},{id:"top",label:"Arriba"}].map(t=>e.jsx("button",{type:"button",onClick:()=>oa(t.id),className:f("px-1.5 py-0.5 rounded transition cursor-pointer",ye===t.id?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:t.label},t.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Insignia Superior (Badge)"}),e.jsx("input",{type:"text",value:ha,onChange:t=>is(t.target.value),className:"w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Color de Acento"}),e.jsx("div",{className:"flex items-center gap-2",children:["#14b8a6","#10b981","#6366f1","#f59e0b","#f43f5e"].map(t=>e.jsx("button",{type:"button",onClick:()=>ds(t),style:{backgroundColor:t},className:f("w-6 h-6 rounded-full border-2 transition cursor-pointer",ya===t?"border-white ring-2 ring-teal-500 scale-110":"border-transparent opacity-80")},t))})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Titular Principal en Pantalla"}),e.jsx("input",{type:"text",value:Qe,onChange:t=>os(t.target.value),className:"w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary font-bold"})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("input",{type:"text",value:fa,onChange:t=>ls(t.target.value),placeholder:"Subtítulo secundario...",className:"flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary"}),e.jsx(y,{icon:e.jsx(Rs,{}),label:"Aplicar al Lienzo",variant:"cyan",onClick:()=>Me(A,!!U)})]})]}),e.jsxs("div",{className:"p-4 bg-purple-500/5 border border-purple-500/25 rounded-2xl space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx($s,{className:"w-4 h-4 text-purple-500"}),"Generador IA de Animación HTML + GSAP (Estilo Claude)"]}),e.jsxs("button",{type:"button",onClick:()=>us(!Tt),className:"text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer",children:[e.jsx(Us,{className:"w-3.5 h-3.5"}),Tt?"Ocultar Código HTML":"Editar Código HTML"]})]}),e.jsx("textarea",{rows:2,value:va,onChange:t=>cs(t.target.value),placeholder:"Describe qué gráficos animados, tarjetas, alertas o diagramas quieres que la IA programe en HTML + GSAP...",className:"w-full bg-white dark:bg-zinc-900 border border-purple-500/30 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-purple-500 resize-none"}),e.jsx("div",{className:"flex justify-end",children:e.jsxs("button",{type:"button",onClick:Ss,disabled:et,className:"flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50 cursor-pointer",children:[et?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(ge,{className:"w-4 h-4"}),e.jsx("span",{children:et?"Diseñando Escena HTML + GSAP...":"Generar Animación HTML con IA"})]})}),Tt&&e.jsxs("div",{className:"pt-2",children:[e.jsx("label",{className:"block text-[10px] font-mono uppercase text-text-secondary mb-1",children:"Código Fuente HTML5 / Tailwind / GSAP en Vivo:"}),e.jsx("textarea",{rows:10,value:ze,onChange:t=>Ae(t.target.value),className:"w-full bg-slate-950 text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500"})]})]})]}),e.jsxs("div",{className:"lg:col-span-6 space-y-4 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-nowrap",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[e.jsx("span",{className:f("w-2.5 h-2.5 rounded-full shrink-0",_?"bg-amber-500 animate-ping":re?"bg-emerald-500 animate-pulse":"bg-slate-400")}),e.jsx("h3",{className:"text-sm font-extrabold text-text-primary truncate",children:_?`Editor Visual (${A})`:`Lienzo Interactivo (${A})`})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(y,{size:"sm",icon:la?e.jsx(W,{className:"animate-spin"}):e.jsx(_e,{}),label:"Sincronizar Voz IA",variant:"purple",disabled:la,onClick:Ns}),e.jsx(y,{size:"sm",icon:e.jsx(lt,{}),label:_?"Salir de Edición":"Editar Lienzo",variant:"orange",isActive:_,onClick:Pa}),e.jsx(y,{size:"sm",icon:$e?e.jsx(W,{className:"animate-spin"}):e.jsx(Se,{}),label:"Descargar MP4 (WhatsApp/Celular)",variant:"teal",disabled:$e,onClick:La}),e.jsx(y,{size:"sm",icon:at?e.jsx(W,{className:"animate-spin"}):e.jsx(De,{}),label:"Cápsula Academia (HTML5)",variant:"green",disabled:at,onClick:Ia}),e.jsx(y,{size:"sm",icon:e.jsx(_a,{}),label:"Guardar en Biblioteca",variant:"teal",onClick:()=>$t({},!1)}),e.jsx(y,{size:"sm",icon:e.jsx(Bs,{}),label:"Pantalla Completa",variant:"neutral",onClick:Ma})]})]}),_&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5",children:[e.jsx(_s,{className:"w-3.5 h-3.5 text-amber-500 shrink-0"}),"Arrastra cualquier caja o título con el mouse para moverlo • Doble clic para escribir"]}),e.jsxs("button",{type:"button",onClick:Cs,className:"px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx(ut,{className:"w-3 h-3"}),"Guardar Cambios"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=E.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"text"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(Fa,{className:"w-3 h-3 text-teal-500"}),e.jsx(Fs,{className:"w-3 h-3 text-teal-500"}),e.jsx("span",{children:"+ Texto"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=E.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"card"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(Fa,{className:"w-3 h-3 text-purple-500"}),e.jsx(Bt,{className:"w-3 h-3 text-purple-500"}),e.jsx("span",{children:"+ Caja / Tarjeta"})]}),e.jsx("button",{type:"button",onClick:()=>{var t,a;return(a=(t=E.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_SELECT_PARENT"},"*")},disabled:!G,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 disabled:opacity-40 cursor-pointer",children:"Seleccionar Caja Contenedora"}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=E.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DUPLICATE_SELECTED"},"*")},disabled:!G,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(Gt,{className:"w-3 h-3 text-indigo-500"}),e.jsx("span",{children:"Duplicar"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=E.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DELETE_SELECTED"},"*")},disabled:!G,className:"px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(ke,{className:"w-3 h-3"}),e.jsx("span",{children:"Eliminar"})]})]})]}),e.jsx("div",{className:"flex justify-center items-center bg-slate-950 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-inner overflow-hidden min-h-[460px]",children:e.jsxs("div",{ref:Sa,className:f("relative overflow-hidden bg-slate-950 shadow-2xl border border-white/10 transition-all duration-300",Ct?"w-screen h-screen rounded-none border-0 flex flex-col items-center justify-between p-4 sm:p-6":f("rounded-2xl mx-auto flex items-center justify-center",A==="9:16"?"w-full max-w-[390px] aspect-[9/16] max-h-[660px]":"w-full aspect-[16/9] max-h-[660px] min-h-[340px]")),children:[e.jsxs("div",{className:f("relative overflow-hidden bg-slate-950",Ct?A==="9:16"?"h-[calc(100vh-100px)] aspect-[9/16] max-w-[95vw] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-[min(94vw,calc((100vh-100px)*1.7778))] aspect-[16/9] max-h-[calc(100vh-100px)] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-full h-full"),children:[Z&&e.jsx("audio",{ref:X,src:Z,preload:"metadata",onTimeUpdate:t=>{ie(t.currentTarget.currentTime)},onLoadedMetadata:t=>{t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&Re(t.currentTarget.duration)},onEnded:()=>{var t,a,s;we(!1),(a=(t=E.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_PAUSE"},"*"),(s=J.current)==null||s.pause()}}),U&&e.jsx("video",{ref:J,src:U,width:A==="9:16"?1080:1920,height:A==="9:16"?1920:1080,muted:Ze,playsInline:!0,loop:!0,preload:"metadata",onTimeUpdate:t=>{Z||ie(t.currentTarget.currentTime)},onLoadedMetadata:t=>{!Z&&t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&Re(t.currentTarget.duration)},className:"absolute inset-0 w-full h-full object-cover z-0"}),e.jsx("iframe",{ref:E,title:"WAPPY Studio HTML Canvas",srcDoc:gs,sandbox:"allow-scripts allow-same-origin",onLoad:()=>{var t,a,s,r,o,n;(a=(t=E.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*"),_?(r=(s=E.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!0},"*"):re||(n=(o=E.current)==null?void 0:o.contentWindow)==null||n.postMessage({type:"STUDIO_PAUSE"},"*")},className:f("absolute inset-0 w-full h-full border-0 z-10",_?"pointer-events-auto":"pointer-events-none")}),ee&&Vt&&e.jsx("div",{className:f("absolute inset-x-3 z-20 flex justify-center pointer-events-none",ye==="top"?"top-16":ye==="center"?"top-1/2 -translate-y-1/2":"bottom-5"),children:e.jsx("div",{className:"bg-black/85 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]",children:e.jsx("div",{className:"flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1",children:Vt.words.map((t,a)=>{const s=a===Vt.activeOffset;return e.jsx("span",{className:f("text-sm sm:text-base font-black uppercase tracking-wide transition-all duration-150",s?"text-amber-300 scale-110 bg-teal-500/30 px-1.5 py-0.5 rounded-lg border border-teal-400/50":"text-white/90"),children:t},`${t}-${a}`)})})})})]}),Ct&&e.jsxs("div",{className:"w-full max-w-3xl mx-auto mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 flex items-center gap-3 z-30 shadow-2xl",children:[e.jsx("button",{type:"button",onClick:za,title:re?"Pausar / Parar":"Reproducir",className:"px-3.5 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:re?e.jsxs(e.Fragment,{children:[e.jsx(xt,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(le,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:Ot,title:"Reiniciar animación",className:"p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer shrink-0",children:e.jsx(Ha,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:B||20,step:.1,value:je,onChange:t=>Aa(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-200 shrink-0",children:[je.toFixed(1),"s / ",(B||20).toFixed(1),"s"]}),e.jsxs("button",{type:"button",onClick:Pa,className:f("px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0",_?"bg-amber-500/20 border-amber-400 text-amber-300":"bg-slate-800 border-slate-700 text-slate-200 hover:text-white"),children:[e.jsx(lt,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:_?"Editando":"Editar"})]}),e.jsxs("button",{type:"button",onClick:Ma,className:"px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0",children:[e.jsx(Hs,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Salir"})]})]})]})}),e.jsxs("div",{className:"p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2.5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{type:"button",onClick:za,title:re?"Pausar animación y subtítulos":"Reproducir animación y subtítulos",className:"px-3 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:re?e.jsxs(e.Fragment,{children:[e.jsx(xt,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(le,{className:"w-4 h-4 fill-white ml-0.5"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:Ot,title:"Reiniciar animación",className:"p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-secondary hover:text-text-primary transition cursor-pointer shrink-0",children:e.jsx(Ha,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:B||20,step:.1,value:je,onChange:t=>Aa(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-text-secondary shrink-0",children:[je.toFixed(1),"s / ",(B||20).toFixed(1),"s"]}),U&&e.jsx("button",{type:"button",onClick:()=>ns(!Ze),title:Ze?"Activar audio del video original":"Silenciar video original",className:"p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-secondary hover:text-text-primary transition cursor-pointer",children:Ze?e.jsx(Ws,{className:"w-4 h-4 text-rose-500"}):e.jsx(Ka,{className:"w-4 h-4 text-teal-500"})})]}),e.jsxs("div",{className:"pt-2 border-t border-slate-200/80 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",disabled:$e,onClick:La,className:"p-3 rounded-xl border bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20 text-teal-800 dark:text-teal-200 text-left transition-all cursor-pointer disabled:opacity-50 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20",children:"WhatsApp • Celular • Redes"}),$e?e.jsx(W,{className:"w-4 h-4 animate-spin shrink-0"}):e.jsx(Se,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight mt-0.5",children:$e?"Renderizando Video MP4...":"Descargar Video .MP4 (Todo Unido)"}),e.jsx("div",{className:"text-[10px] opacity-85 leading-snug",children:"Une Animación + Subtítulos + Voz IA en un archivo .MP4 listo para enviar por WhatsApp o subir a Reels"})]}),e.jsxs("div",{className:"p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20",children:"Academia WAPPY • LMS Responsive"}),e.jsx(_t,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight",children:"Cápsula Interactiva HTML5 (Móvil & Web)"}),e.jsxs("div",{className:"flex items-center gap-1.5 mt-0.5",children:[e.jsxs("button",{type:"button",disabled:at,onClick:Ia,className:"flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx(De,{className:"w-3 h-3"}),e.jsx("span",{children:"Descargar .HTML"})]}),e.jsxs("button",{type:"button",disabled:at,onClick:Ps,title:"Copiar código <iframe srcdoc> para lección de Academia WAPPY",className:"py-1.5 px-2.5 rounded-lg bg-white/80 dark:bg-zinc-800 hover:bg-white text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx(Gt,{className:"w-3 h-3"}),e.jsx("span",{children:"Copiar LMS"})]})]})]})]})]}),_&&G&&e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/90 rounded-2xl border border-teal-500/40 space-y-3 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5",children:[e.jsx(lt,{className:"w-3.5 h-3.5"}),"Propiedades del Elemento Seleccionado (<",G.tagName,">)"]}),e.jsx("button",{type:"button",onClick:()=>xe({dx:0,dy:0,scale:1}),className:"text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer",children:"Restablecer posición"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Texto del elemento (edita aquí o con doble clic en el video):"}),e.jsx("textarea",{rows:2,value:G.text,onChange:t=>xe({text:t.target.value}),className:"w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:["Tamaño Letra (",G.fontSize,"px)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>xe({fontSize:Math.max(10,G.fontSize-2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"A-"}),e.jsx("button",{type:"button",onClick:()=>xe({fontSize:Math.min(96,G.fontSize+2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"A+"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:["Escala Caja (",G.scale,"x)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>xe({scale:Math.max(.5,Number((G.scale-.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"-"}),e.jsx("button",{type:"button",onClick:()=>xe({scale:Math.min(2.5,Number((G.scale+.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"+"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:"Color de Texto"}),e.jsx("input",{type:"color",value:G.color,onChange:t=>xe({color:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-zinc-700"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:"Color de Fondo"}),e.jsx("input",{type:"color",value:G.backgroundColor,onChange:t=>xe({backgroundColor:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-zinc-700"})]})]})]})]})]}),v==="lab"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4 shadow-xs",children:[e.jsx("div",{className:"w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0",children:e.jsx(ge,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-base font-extrabold text-text-primary",children:"Laboratorio de Expresividad y Vocal Bursts"}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Explora las capacidades de Gemini TTS: respiraciones orgánicas, risas, susurros y dirección de estilo en tiempo real"})]})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-secondary",children:"Modelo en el Laboratorio:"}),e.jsx("div",{className:"flex flex-wrap items-center gap-2",children:de.map(t=>{const a=S===t.id;return e.jsxs("button",{type:"button",onClick:()=>{D(t.id),t.supportedVoices.includes(b)||Y(t.supportedVoices[0]||"Kore")},className:f("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-zinc-900 text-text-secondary border-slate-200 dark:border-zinc-800 hover:border-teal-400"),children:[t.name," (",t.supportedVoices.length," voces)"]},t.id)})})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsx("h3",{className:"text-sm font-extrabold text-text-primary",children:"Efectos Vocales Orgánicos Integrados"}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:N.map(t=>{const a=Ja===t.tag;return e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400",children:t.tag}),e.jsx("p",{className:"text-xs font-bold text-text-primary mt-0.5",children:t.label}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:t.description})]}),e.jsx("button",{type:"button",disabled:a,onClick:async()=>{try{ea(t.tag);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:V(l),body:JSON.stringify({voiceName:b,model:"gemini-3.8-flash-tts",stylePrompt:"Voz muy expresiva y natural.",text:`Escucha cómo suena este efecto natural en medio de una frase: ${t.tag} ¡Suena totalmente humano!`})}),r=await oe(s);r.audioBase64&&$({base64:r.audioBase64,title:`Efecto ${t.tag} (${b})`,durationSeconds:r.durationSeconds,voiceName:b})}catch(s){g({type:"error",text:s.message})}finally{ea(null)}},className:"w-9 h-9 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 transition cursor-pointer",children:a?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(le,{className:"w-4 h-4 fill-current"})})]},t.tag)})})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("h3",{className:"text-sm font-extrabold text-text-primary",children:"Probador Libre de Prosodia y Dirección de Voz"}),e.jsxs("span",{className:"text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",children:["Voces activas: ",Le," de ",C.length]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary",children:["Selecciona la Voz (",Le," activas para ",P==null?void 0:P.name,")"]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:C.map(t=>{const a=b===t.id,s=Ue(t.id);return e.jsxs("button",{type:"button",onClick:()=>{s||D("gemini-3.8-flash-tts"),Y(t.id)},className:f("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-zinc-900 text-text-primary border-slate-200 dark:border-zinc-800 hover:border-teal-400",!s&&"opacity-55"),children:[e.jsxs("span",{children:[t.name," (",t.gender,")"]}),s&&e.jsx(ut,{className:"w-3 h-3 text-emerald-400"})]},t.id)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1.5",children:"Prompt de Dirección (speechMetadata.style)"}),e.jsx("input",{type:"text",value:vt,onChange:t=>qa(t.target.value),className:"w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-teal-500"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1.5",children:"Texto de Prueba"}),e.jsx("textarea",{rows:3,value:ne,onChange:t=>Ya(t.target.value),className:"w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs text-text-primary focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsx("div",{children:e.jsxs("button",{type:"button",onClick:js,disabled:Zt||!ne.trim(),className:"inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[Zt?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(ge,{className:"w-4 h-4"}),e.jsx("span",{children:"Sintetizar en el Laboratorio"})]})})]})]}),v==="library"&&e.jsxs("div",{className:"space-y-5 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-text-primary flex items-center gap-2",children:[e.jsx(_t,{className:"w-5 h-5 text-indigo-500"}),"Biblioteca de Audios y Videos"]}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Tus locuciones y videos (HTML + voz) quedan guardados permanentemente en este navegador para reproducir, reabrir, editar o descargar."})]}),ue.length>0&&e.jsx(y,{icon:e.jsx(ke,{}),label:"Limpiar Historial",variant:"danger",onClick:()=>{window.confirm("¿Borrar todos los audios y videos guardados?")&&(Ce([]),ar())}})]}),ue.length===0?e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-2",children:[e.jsx(_e,{className:"w-10 h-10 mx-auto text-slate-400"}),e.jsx("p",{className:"text-sm font-bold text-text-primary",children:"Aún no hay audios en tu biblioteca"}),e.jsx("p",{className:"text-xs text-text-secondary max-w-md mx-auto",children:'Genera una locución en la pestaña "Estudio de Voz (TTS)" o en "Voces & Bursts" y aparecerá aquí automáticamente.'})]}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:ue.map(t=>e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("h4",{className:"text-sm font-extrabold text-text-primary line-clamp-1",children:t.title}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[t.kind==="video"&&e.jsxs("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30",children:["🎬 VIDEO ",t.aspectRatio||""]}),e.jsx("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30",children:t.voiceName})]})]}),e.jsxs("div",{className:"flex items-center gap-2.5 text-xs text-text-secondary",children:[e.jsxs("span",{children:["⏱ ",dr(t.durationSeconds)]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[t.wordCount," palabras"]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:cr(t.createdAt)})]}),t.stylePrompt&&e.jsxs("div",{className:"p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800 text-[11px] italic text-text-secondary line-clamp-2",children:['"',t.stylePrompt,'"']})]}),e.jsxs("div",{className:"flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-zinc-800",children:[e.jsx("div",{className:"flex items-center gap-1.5",children:t.kind==="video"?e.jsx(y,{size:"sm",icon:e.jsx(lt,{}),label:"Abrir en Compositor",variant:"orange",onClick:()=>As(t)}):e.jsxs(e.Fragment,{children:[e.jsx(y,{size:"sm",icon:e.jsx(le,{}),label:"Reproducir",variant:"teal",onClick:()=>Ca(t)}),e.jsx(y,{size:"sm",icon:e.jsx(Se,{}),label:"Usar en Video",variant:"purple",onClick:()=>Ca(t,!0)})]})}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[t.kind==="video"&&t.mp4Key&&e.jsx(y,{size:"sm",icon:e.jsx(Se,{}),label:"Descargar MP4",variant:"green",onClick:async()=>{const a=await He(t.mp4Key);a&&Lt(a,`wappy-studio-reel-${t.id}.mp4`)}}),t.kind==="video"&&t.capsuleKey&&e.jsx(y,{size:"sm",icon:e.jsx(De,{}),label:"Descargar Cápsula HTML",variant:"green",onClick:async()=>{const a=await He(t.capsuleKey);a&&Lt(a,`wappy-academia-capsula-${t.id}.html`)}}),t.kind!=="video"&&e.jsx(y,{size:"sm",icon:e.jsx(De,{}),label:"Descargar WAV",variant:"green",onClick:async()=>{const a=await Ta(t);if(!a){g({type:"error",text:"Este audio ya no está disponible (se generó antes del guardado permanente). Vuelve a generarlo."});return}Lt(a,`wappy-audio-${t.id}.wav`)}}),e.jsx(y,{size:"sm",icon:e.jsx(ke,{}),label:"Eliminar",variant:"danger",onClick:()=>hs(t)})]})]})]},t.id))})]})]}),xs&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4",children:e.jsxs("div",{className:"bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4",children:[e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-300 shrink-0",children:e.jsx(Ra,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-extrabold text-text-primary",children:"Claves API Google Gemini (Rotación 3x)"}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Multiplica tu cuota gratuita de síntesis de voz TTS y generación de video HTML/GSAP."})]})]}),e.jsx("button",{type:"button",onClick:()=>At(!1),className:"p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-zinc-300 cursor-pointer",children:e.jsx(ct,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-800 dark:text-teal-200 leading-relaxed",children:["Obtén gratis tus claves en"," ",e.jsx("a",{href:"https://aistudio.google.com/app/apikey",target:"_blank",rel:"noopener noreferrer",className:"font-extrabold underline hover:text-teal-500",children:"Google AI Studio (aistudio.google.com)"}),". WAPPY Studio rotará automáticamente entre tus claves y las del servidor para evitar límites 429 en locuciones de hasta 60 minutos."]}),e.jsx("div",{className:"space-y-2.5",children:rt.map((t,a)=>e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px] font-bold text-text-secondary",children:[e.jsx("span",{children:t.label||`Clave Google Gemini #${a+1}`}),t.status==="valid"&&e.jsxs("span",{className:"text-emerald-600 dark:text-emerald-400 flex items-center gap-1",children:[e.jsx(Kt,{className:"w-3.5 h-3.5"})," Activa y verificada"]}),t.status==="invalid"&&e.jsxs("span",{className:"text-rose-600 dark:text-rose-400 flex items-center gap-1",children:[e.jsx(Ua,{className:"w-3.5 h-3.5"})," Clave inválida o vencida"]})]}),e.jsx("input",{type:"password",value:t.key,onChange:s=>{const r=s.target.value;nt(o=>o.map((n,u)=>u===a?{...n,key:r,status:"unchecked"}:n))},placeholder:"AIzaSy...",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"})]},a))}),Na&&e.jsx("div",{className:"p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300",children:Na}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800",children:[e.jsx(y,{size:"sm",icon:e.jsx(ke,{}),label:"Limpiar Claves",variant:"danger",onClick:()=>{nt([{key:"",label:"Clave Principal #1",status:"unchecked"},{key:"",label:"Clave Respaldo #2",status:"unchecked"},{key:"",label:"Clave Respaldo #3",status:"unchecked"}]),localStorage.removeItem(pt),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),it("Claves eliminadas del navegador.")}}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(y,{size:"sm",icon:e.jsx(ct,{}),label:"Cerrar",variant:"neutral",onClick:()=>At(!1)}),e.jsx(y,{size:"sm",icon:Pt?e.jsx(W,{className:"animate-spin"}):e.jsx(_a,{}),label:Pt?"Validando...":"Guardar y Validar",variant:"teal",disabled:Pt,onClick:bs})]})]})]})})]})}function ur({audioBase64:d,audioUrl:p,title:l,durationSeconds:m,voiceName:R,onSendToVideo:w}){const h=i.useRef(null),[j,Q]=i.useState(!1),[K,L]=i.useState(0),[v,q]=i.useState(m||0),[Ee,gt]=i.useState(1),[de,Ie]=i.useState(!1),C=p||(d?`data:audio/wav;base64,${d}`:"");i.useEffect(()=>{Q(!1),L(0),m&&m>0&&q(m)},[C,m]);const ht=()=>{!h.current||!C||(j?h.current.pause():h.current.play().catch(N=>console.error("Error al reproducir audio:",N)))},Te=N=>{if(!N||isNaN(N)||N<0)return"00:00";const z=Math.floor(N),S=Math.floor(z/60),D=z%60;return`${S.toString().padStart(2,"0")}:${D.toString().padStart(2,"0")}`},ft=async()=>{if(!C)return;const N=`${l.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"wappy-tts"}.wav`;try{if(C.startsWith("data:")||C.startsWith("blob:")){const D=document.createElement("a");D.href=C,D.download=N,document.body.appendChild(D),D.click(),document.body.removeChild(D);return}const S=await fetch(C,{headers:V()});if(S.ok){const D=await S.blob(),b=URL.createObjectURL(D),Y=document.createElement("a");Y.href=b,Y.download=N,document.body.appendChild(Y),Y.click(),document.body.removeChild(Y),setTimeout(()=>URL.revokeObjectURL(b),4e3);return}}catch{}const z=document.createElement("a");z.href=C,z.download=N,document.body.appendChild(z),z.click(),document.body.removeChild(z)};return C?e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-teal-500/30 rounded-2xl p-4 sm:p-5 shadow-md space-y-3",children:[e.jsx("audio",{ref:h,src:C,preload:"metadata",onPlay:()=>Q(!0),onPause:()=>Q(!1),onEnded:()=>Q(!1),onTimeUpdate:()=>{h.current&&L(h.current.currentTime)},onLoadedMetadata:()=>{var N;(N=h.current)!=null&&N.duration&&!isNaN(h.current.duration)&&q(h.current.duration)}}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3 min-w-0",children:[e.jsx("button",{type:"button",onClick:ht,className:"w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white flex items-center justify-center shadow-md transition active:scale-95 shrink-0 cursor-pointer",children:j?e.jsx(xt,{className:"w-5 h-5 fill-white"}):e.jsx(le,{className:"w-5 h-5 fill-white ml-0.5"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"}),e.jsx("h3",{className:"text-sm font-extrabold text-text-primary truncate",children:l})]}),e.jsxs("p",{className:"text-xs text-teal-600 dark:text-teal-400 font-semibold",children:["Voz: ",R||"Kore"," • WAV 24kHz Alta Fidelidad (",Te(K)," /"," ",Te(v),")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{const N=[.75,1,1.25,1.5,2],z=N[(N.indexOf(Ee)+1)%N.length];gt(z),h.current&&(h.current.playbackRate=z)},className:"px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-teal-700 dark:text-teal-300 cursor-pointer",children:[Ee,"x"]}),e.jsx(y,{size:"sm",icon:e.jsx(Se,{}),label:"Llevar al Video",variant:"purple",onClick:w}),d&&e.jsx(y,{size:"sm",icon:de?e.jsx(ut,{}):e.jsx(Gt,{}),label:de?"Copiado":"Copiar Base64",variant:"fuchsia",onClick:()=>{navigator.clipboard.writeText(d),Ie(!0),setTimeout(()=>Ie(!1),2e3)}}),e.jsx(y,{size:"sm",icon:e.jsx(De,{}),label:"Descargar WAV",variant:"green",onClick:ft})]})]}),e.jsx("div",{className:"flex items-center justify-between gap-1 h-10 bg-slate-50 dark:bg-zinc-950 rounded-xl px-3 py-1.5 border border-slate-200/80 dark:border-zinc-800 overflow-hidden",children:Array.from({length:44}).map((N,z)=>{const S=v>0?K/v:0,D=z/44,b=D<=S,Y=22+Math.sin(z*.45)*16+Math.cos(z*.9)*12;return e.jsx("div",{onClick:()=>{if(h.current&&v>0){const se=D*v;h.current.currentTime=se,L(se)}},style:{height:`${Math.max(18,Math.min(95,Y))}%`},className:f("w-1 rounded-full cursor-pointer transition-all duration-150",b?"bg-gradient-to-t from-teal-500 to-emerald-400":"bg-slate-300 dark:bg-zinc-800 hover:bg-teal-400/50")},z)})}),e.jsxs("div",{className:"flex items-center gap-2.5 px-1",children:[e.jsx("span",{className:"text-[11px] font-mono font-bold text-text-secondary w-11",children:Te(K)}),e.jsx("input",{type:"range",min:0,max:Math.max(1,v),step:.1,value:Math.min(K,Math.max(1,v)),onChange:N=>{const z=parseFloat(N.target.value);h.current&&(h.current.currentTime=z),L(z)},className:"flex-1 h-1.5 rounded-lg accent-teal-500 cursor-pointer"}),e.jsx("span",{className:"text-[11px] font-mono font-bold text-text-secondary w-11 text-right",children:Te(v)})]})]}):null}function pr({job:d,onPause:p,onResume:l,onCancel:m,onPlayChunk:R,onLoadMaster:w}){const h=d.status==="completed",j=d.status==="failed",Q=d.status==="processing",K=d.status==="paused";return e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-teal-500/40 rounded-2xl p-5 shadow-md space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center",children:Q?e.jsx(W,{className:"w-5 h-5 animate-spin"}):h?e.jsx(Kt,{className:"w-5 h-5 text-emerald-500"}):e.jsx(ge,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-extrabold text-text-primary",children:h?"¡Audio Maestro de Larga Duración Completado!":j?"Error en la Generación":K?"Generación en Pausa":`Sintetizando fragmento ${d.currentChunkIndex+1} de ${d.totalChunks}...`}),e.jsxs("p",{className:"text-xs text-text-secondary",children:["Generados ",Math.round(d.generatedTotalSeconds),"s de ~",d.estimatedTotalSeconds,"s estimados (",d.progressPercent,"%)"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[Q&&e.jsx(y,{size:"sm",icon:e.jsx(xt,{}),label:"Pausar",variant:"amber",onClick:p}),K&&e.jsx(y,{size:"sm",icon:e.jsx(le,{}),label:"Reanudar",variant:"teal",onClick:l}),!h&&!j&&e.jsx(y,{size:"sm",icon:e.jsx(ct,{}),label:"Cancelar",variant:"danger",onClick:m}),h&&e.jsxs(e.Fragment,{children:[e.jsx(y,{size:"sm",icon:e.jsx(le,{}),label:"Cargar Master",variant:"teal",onClick:w}),e.jsxs("a",{href:d.downloadUrl||`/api/studio/tts/jobs/${d.id}/download`,download:!0,className:"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 text-xs font-bold hover:bg-green-500/20 transition",children:[e.jsx(De,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Descargar WAV Master"})]})]})]})]}),e.jsx("div",{className:"w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,d.progressPercent))}%`}})}),e.jsx("div",{className:"grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 gap-1.5 p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/80 dark:border-zinc-800 max-h-32 overflow-y-auto",children:d.chunks.map(L=>{const v=L.status==="completed",q=L.status==="processing";return e.jsx("button",{type:"button",disabled:!v,onClick:()=>R(L),title:`Fragmento #${L.index+1}`,className:f("h-7 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center border transition",v?"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer":q?"bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/40 animate-pulse":"bg-slate-200/50 dark:bg-zinc-900 text-text-secondary border-transparent opacity-60"),children:v?e.jsx(Ka,{className:"w-3 h-3"}):q?e.jsx(W,{className:"w-3 h-3 animate-spin"}):L.index+1},L.index)})})]})}export{Hr as default};
