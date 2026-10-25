import{cN as gs,r as i,j as e,is as Sa,bp as xe,iw as Be,fO as Ne,bF as Dt,cP as Vt,bq as W,cO as Ta,bD as Pa,cc as hs,bl as Ma,el as fs,bu as dt,a$ as ys,bN as ws,dT as ie,gn as vs,bB as Pe,bC as Ea,bx as js,i0 as ks,gV as Ns,b5 as ot,bX as Me,cu as Ss,fn as Ts,cx as Es,c4 as Ca,h2 as Cs,bv as $t,ef as ct,fk as za,fl as zs,ix as As,io as La}from"./vendor.DYW0wM5n.js";import{u as Ps}from"./routing.Cj3VmeMA.js";import{u as Ms,ah as Ls,a as Ds,c as h,aK as v}from"./ambassadors-module.D0IDacSW.js";import"./utilities.BjsdvwEO.js";import{O as Vs}from"./blog-modules.CDEdDUad.js";import"./react-interactions.D7-JPAG8.js";import{M as Os}from"./sgsst-modules.D1vYExnO.js";import"./markdown_highlight.BXMLVVdG.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./tanstack-vendor.DYIZ-52P.js";import"./http-client.Bmq-NEq6.js";import"./heic-converter.BhQCFQ0l.js";import"./forms.DEMc3D7c.js";import"./radix-ui.CGYgq8tg.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.DD_sfwPT.js";import"./animations.DklOPy0I.js";import"./virtualization.CpBvUi5N.js";import"./headlessui.Ul8AWG4Z.js";import"./framer-motion.WNZz7wmC.js";import"./i18n.CDA4tK8r.js";import"./date-utils.X8D4nCrw.js";import"./sgsst-assets.KdMSUpxn.js";import"./security-ui.xKNm28sF.js";import"./kanban-module.B8eC51oe.js";import"./plans-module.pXsCblpK.js";import"./lms-modules.BUDL_QA7.js";import"./markdown-processing.BgA4K7JW.js";import"./events-modules.BTxQGkPb.js";const Is="wappy-studio-media",Rs=1,pt="blobs";let Fe=null;function $s(){return Fe||(Fe=new Promise((l,d)=>{if(typeof indexedDB>"u"){d(new Error("IndexedDB no disponible en este navegador."));return}const f=indexedDB.open(Is,Rs);f.onupgradeneeded=()=>{const x=f.result;x.objectStoreNames.contains(pt)||x.createObjectStore(pt)},f.onsuccess=()=>l(f.result),f.onerror=()=>{Fe=null,d(f.error)}}),Fe)}function ut(l,d){return $s().then(f=>new Promise((x,M)=>{const E=f.transaction(pt,l),g=d(E.objectStore(pt));g.onsuccess=()=>x(g.result),g.onerror=()=>M(g.error)}))}async function ke(l,d){await ut("readwrite",f=>f.put(d,l))}async function _e(l){try{return await ut("readonly",f=>f.get(l))??null}catch{return null}}async function Us(l){try{await ut("readwrite",d=>d.delete(l))}catch{}}async function Bs(){try{await ut("readwrite",l=>l.clear())}catch{}}function lt(l,d="audio/wav"){const f=l.replace(/^data:[^;]+;base64,/,""),x=window.atob(f),M=new Uint8Array(x.length);for(let E=0;E<x.length;E++)M[E]=x.charCodeAt(E);return new Blob([M],{type:d})}var Fs={};const Ot={"gemini-3.8-flash-tts":{id:"gemini-3.8-flash-tts",name:"Gemini 3.8 Flash TTS",badge:"Recomendado / Cuota Activa",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"✓ Activo (14 voces)",description:"Máxima fluidez natural, diseño de voz, vocal bursts (<breath>, <laugh>) y soporte para las 14 voces.",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-3.1-flash-tts-preview":{id:"gemini-3.1-flash-tts-preview",name:"Gemini 3.1 Flash TTS Preview",badge:"Preview 3.1 / Cuota Activa",badgeColor:"bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:"Arquitectura Gemini 3.1 con prosodia refinada, tono expresivo y respuesta ágil (14 voces).",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-2.5-flash-preview-tts":{id:"gemini-2.5-flash-preview-tts",name:"Gemini 2.5 Flash TTS",badge:"Reemplazo de 2.5 Pro",badgeColor:"bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",rateLimitLabel:"3 RPM • 10 RPD (2.5 Pro: 0/0)",quotaLabel:"5 voces",description:"Reemplazo oficial y funcional de 2.5 Pro (no disponible en API). Activa únicamente las 5 voces fundamentales.",supportsMultiSpeaker:!0,supportsVocalBursts:!1,supportedVoices:["Kore","Puck","Charon","Fenrir","Aoede"]},"gemini-3.8-flash-lite-tts":{id:"gemini-3.8-flash-lite-tts",name:"Gemini 3.8 Flash-Lite TTS",badge:"Ultra Rápido",badgeColor:"bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",rateLimitLabel:"Baja Latencia",quotaLabel:"6 voces",description:"Optimizado para lecturas masivas con mínima latencia continua (6 voces rápidas).",supportsMultiSpeaker:!1,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Aoede"]}},_s=[{id:"Kore",name:"Kore",gender:"Femenino",tone:"Cálida, Serena y Profesional",recommendedFor:"Audiolibros, Narración, Tutoriales, Inducción SST",tag:"Más popular"},{id:"Puck",name:"Puck",gender:"Masculino",tone:"Enérgico, Dinámico y Joven",recommendedFor:"Podcasts, Reels, Contenido Creativo, Diálogos",tag:"Muy expresivo"},{id:"Charon",name:"Charon",gender:"Masculino",tone:"Barítono, Grave, Maduro y Solemne",recommendedFor:"Documentales, Historia, Suspenso, Directivos",tag:"Voz profunda"},{id:"Fenrir",name:"Fenrir",gender:"Masculino",tone:"Claro, Elocuente y Periodístico",recommendedFor:"Noticias, Informes, Presentaciones, Boletines",tag:"Profesional"},{id:"Zephyr",name:"Zephyr",gender:"Femenino",tone:"Dulce, Aterciopelada y Relajante",recommendedFor:"Meditación, ASMR, Cuentos, Bienestar",tag:"Calma"},{id:"Orus",name:"Orus",gender:"Masculino",tone:"Firme, Imperial, Épico y Reflexivo",recommendedFor:"Ficción Épica, Liderazgo, Ensayos, Cultura Vial",tag:"Imperial"},{id:"Aoede",name:"Aoede",gender:"Femenino",tone:"Melódica, Expresiva, Artística y Cálida",recommendedFor:"Poesía, Literatura, Storytelling, Sensibilización",tag:"Melódica"},{id:"Leda",name:"Leda",gender:"Femenino",tone:"Cercana, Maternal, Madura y Envolvente",recommendedFor:"Audiolibros Largos, Relatos, Bienvenida",tag:"Narradora"},{id:"Callisto",name:"Callisto",gender:"Femenino",tone:"Elegante, Sofisticada y Articulada",recommendedFor:"Divulgación Científica, Conferencias, Auditorías",tag:"Sofisticada"},{id:"Europa",name:"Europa",gender:"Femenino",tone:"Brillante, Luminosa, Alegre y Asertiva",recommendedFor:"Marketing, Anuncios, E-Learning, Campañas",tag:"Enérgica"},{id:"Ganymede",name:"Ganymede",gender:"Masculino",tone:"Resonante, Equilibrado, Sabio y Seguro",recommendedFor:"Educación Superior, Cursos, Capacitación Técnica",tag:"Resonante"},{id:"Io",name:"Io",gender:"Femenino",tone:"Vivaz, Espontánea, Fresca y Amigable",recommendedFor:"Redes Sociales, Vlogs, Asistentes, Reels",tag:"Fresca"},{id:"Titan",name:"Titan",gender:"Masculino",tone:"Imponente, Cinematográfico y Potente",recommendedFor:"Tráilers, Introducciones, Impacto, Alertas",tag:"Cinematográfica"},{id:"Prometheus",name:"Prometheus",gender:"Masculino",tone:"Noble, Pensativo, Filosófico y Clásico",recommendedFor:"Filosofía, Análisis Profundo, Crónicas",tag:"Sabio"}],Hs=[{id:"orus-solemn",name:"Narración Solemne (Orus)",voiceName:"Orus",style:"Voz firme, templada, reflexiva y madura de narrador de crónica histórica, dicción solemne, pausas medidas y respiraciones naturales.",speed:"0.95x"},{id:"aoede-poetic",name:"Cuento Poético (Aoede)",voiceName:"Aoede",style:"Voz melódica, cálida, expresiva y artística para relato literario y sensibilización, con matices emocionales suaves.",speed:"0.95x"},{id:"titan-trailer",name:"Tráiler Cinematográfico (Titan)",voiceName:"Titan",style:"Voz imponente, profunda, cinematográfica y épica de tráiler de película, con pausas dramáticas e impacto.",speed:"0.95x"},{id:"kore-audiobook",name:"Narrador de Audiolibro (Kore)",voiceName:"Kore",style:"Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.",speed:"1.0x"},{id:"puck-podcast",name:"Host de Podcast Dinámico (Puck)",voiceName:"Puck",style:"Host de podcast carismático, enérgico, cercano y espontáneo, con entonación conversacional moderna.",speed:"1.05x"},{id:"charon-documentary",name:"Documental Profundo (Charon)",voiceName:"Charon",style:"Tono barítono, solemne, reflexivo y cinematográfico de narrador de documental, con pausas medidas.",speed:"0.95x"},{id:"fenrir-news",name:"Noticiero Profesional (Fenrir)",voiceName:"Fenrir",style:"Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.",speed:"1.05x"},{id:"zephyr-asmr",name:"Meditación y ASMR (Zephyr)",voiceName:"Zephyr",style:"Voz suave, serena, dulce y sumamente relajante para meditación guiada, mindfulness y bienestar.",speed:"0.9x"},{id:"screenplay-dialogue",name:"Guion / Diálogo Alex & Sam",voiceName:"Kore",multiSpeaker:!0,speaker1:{name:"Alex",voiceName:"Puck",style:"Entusiasta y curioso"},speaker2:{name:"Sam",voiceName:"Kore",style:"Experta, clara y cercana"},style:"Diálogo interactivo de podcast entre dos especialistas con alternancia natural.",speed:"1.0x"}],Ws=[{tag:"<breath>",label:"Respiración natural",description:"Inserta una toma de aire orgánica entre frases"},{tag:"<laugh>",label:"Risa / Carcajada",description:"Añade una risa espontánea o carcajada suave"},{tag:"<gasp>",label:"Sorpresa / Jadear",description:"Efecto de inhalación rápida de asombro"},{tag:"|mhm|",label:"Asentimiento (|mhm|)",description:"Confirmación conversacional natural"},{tag:"|yeah|",label:"Aceptación (|yeah|)",description:"Interjección de acuerdo en diálogos"}],It=[{title:"Inducción SST: 5 Reglas de Oro en Riesgo Eléctrico",text:`¡Atención equipo! Antes de intervenir cualquier tablero o red eléctrica, recuerda que tu vida depende de las Cinco Reglas de Oro. <breath>

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

Tu bienestar mental y físico es la base de un entorno laboral saludable y seguro.`}],Ks=[{id:"golden-rules",name:"⚡ Reglas de Oro Glass",badge:"Estilo Claude",description:"Tarjeta hero con barra de progreso e indicadores clave en cristal."},{id:"kpi-hud",name:"📊 Dashboard KPIs & HUD",badge:"Ejecutivo",description:"Métricas ejecutivas animadas con barras comparativas y telemetría."},{id:"alert-sst",name:"🚨 Alerta & Checklist 1-2-3",badge:"Prevención",description:"Pasos numerados de seguridad con entrada secuencial elástica."},{id:"camera-overlay",name:"🎬 Lower-Third (Video Propio)",badge:"Transparente",description:"Capas limpias en tercio superior e inferior para dejar libre tu rostro."}];function Aa({aspectRatio:l="9:16",hasBaseVideo:d=!1,badgeText:f="CÁPSULA INTERACTIVA WAPPY",headline:x="5 Reglas de Oro en Seguridad",subheadline:M="Prevención inteligente en tiempo real con WAPPY Studio",accentColor:E="#14b8a6",templateId:g="golden-rules"}){const j=l==="9:16",J=f.replace(/</g,"&lt;"),K=x.replace(/</g,"&lt;"),w=M.replace(/</g,"&lt;"),B=d||g==="camera-overlay";let D="";return g==="kpi-hud"?D=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${j?"p-5":"p-4"} border-t-2" style="border-top-color: ${E};">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-mono uppercase tracking-wider text-teal-400">📊 TELEMETRÍA PREVENTIVA</span>
          <span class="text-[11px] font-mono font-bold text-emerald-400">▲ +98.4% EFECTIVIDAD</span>
        </div>
        <h1 class="${j?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight text-white">
          ${K}
        </h1>
        <p class="text-xs text-slate-300 mt-1">${w}</p>
        <div class="mt-4 space-y-2.5">
          <div>
            <div class="flex justify-between text-[11px] font-bold mb-1">
              <span class="text-slate-300">Controles Operativos Verificados</span>
              <span class="text-teal-300 font-mono">96%</span>
            </div>
            <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div id="accent-bar" class="h-full rounded-full" style="width: 96%; background: linear-gradient(90deg, ${E}, #34d399);"></div>
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
      </div>`:g==="alert-sst"?D=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${j?"p-5":"p-4"} border-l-4" style="border-left-color: #f59e0b;">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
          ⚠️ PROTOCOLO OBLIGATORIO EN PLANTA
        </div>
        <h1 class="${j?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight text-white">
          ${K}
        </h1>
        <p class="text-xs text-slate-300 mt-1">${w}</p>
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
      </div>`:g==="camera-overlay"?D=`
      <div class="my-auto"></div>
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-2xl p-4 border-l-4" style="border-left-color: ${E};">
        <div class="text-[10px] font-mono uppercase tracking-widest text-teal-300 font-extrabold">${J}</div>
        <h1 class="text-lg sm:text-xl font-black text-white leading-snug mt-0.5">${K}</h1>
        <p class="text-xs text-slate-300 mt-0.5">${w}</p>
      </div>`:D=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${j?"p-5 sm:p-6":"p-4 sm:p-5"} border-l-4" style="border-left-color: ${E};">
        <div class="text-xs font-mono uppercase tracking-wider text-teal-400 mb-1">⚡ PUNTO CLAVE EN VIVO</div>
        <h1 class="${j?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight tracking-tight text-white">
          ${K}
        </h1>
        <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed font-medium">
          ${w}
        </p>
        <div class="mt-3.5 h-1.5 w-full bg-slate-800/90 rounded-full overflow-hidden">
          <div id="accent-bar" class="h-full rounded-full" style="width: 100%; background: linear-gradient(90deg, ${E}, #fbbf24);"></div>
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
      background: ${B?"transparent":"#060d14"};
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
  ${B?"<!-- Fondo transparente para dejar ver el video base del usuario -->":`<div class="absolute inset-0 overflow-hidden pointer-events-none">
           <div class="absolute inset-0 grid-bg"></div>
           <div id="orb-1" class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-35" style="background: ${E};"></div>
           <div id="orb-2" class="absolute bottom-8 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25" style="background: #6366f1;"></div>
         </div>`}

  <!-- TOP HUD BAR (100% centrado con ancho completo de contenedor) -->
  <div id="top-bar" data-editable="true" class="relative z-10 w-full ${j?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-between gap-2 shrink-0">
    <div class="glass-card px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 whitespace-nowrap">
      <span class="w-2.5 h-2.5 rounded-full animate-ping shrink-0" style="background: ${E};"></span>
      <span class="text-[11px] font-extrabold tracking-widest uppercase text-teal-300">${J}</span>
    </div>
    <div class="glass-card px-3 py-1.5 rounded-full text-[11px] font-mono font-bold text-slate-300 whitespace-nowrap shrink-0">
      WAPPY STUDIO • IA
    </div>
  </div>

  <!-- ESCENA CENTRAL: TARJETAS ANIMADAS (100% centrado matemáticamente con max-w y mx-auto) -->
  <div class="relative z-10 my-auto w-full ${j?"max-w-md":"max-w-2xl"} mx-auto flex flex-col gap-3 sm:gap-3.5 items-stretch">
    ${D}
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
</html>`}function Gs(l){if(!l)return"";if(l.includes('id="wappy-studio-runtime-bridge"'))return l;const d=`<script id="wappy-studio-gsap-hook">
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
<\/script>`,f=`<style id="wappy-studio-bridge-styles">
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
<\/script>`;let x=l;return x.includes("<head>")?x=x.replace("<head>",`<head>
${d}`):x=`${d}
${x}`,x.includes("</body>")?x=x.replace("</body>",`${f}
</body>`):x=`${x}
${f}`,x}const Rt="wappy_studio_audio_library";function H(l){const d=l||localStorage.getItem("token")||"";return{"Content-Type":"application/json",...d?{Authorization:`Bearer ${d}`}:{}}}async function ne(l){const d=await l.text();try{return JSON.parse(d)}catch{throw l.status===401||d.trim()==="Unauthorized"?new Error("Tu sesión está actualizándose. Intenta nuevamente en un segundo."):new Error(d.slice(0,180)||`Error del servidor (${l.status})`)}}function qs(l){const d=Math.max(1,Math.round(l||0)),f=Math.floor(d/60),x=d%60;return`${f}m ${x}s`}function Ys(l){try{return new Date(l).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return""}}function zr(){var Na;const{user:l,token:d,isAuthenticated:f}=Ms(),{data:x}=Ls(),M=gs(),E=(M==null?void 0:M.navVisible)??!0,g=(M==null?void 0:M.setNavVisible)??(()=>{}),[j,J]=Ps(),K=j.get("tab")||"tts",[w,B]=i.useState(["tts","video","lab","library"].includes(K)?K:"tts"),[D,He]=i.useState(()=>{var t,a;return((a=(t=l==null?void 0:l.personalization)==null?void 0:t.geminiModels)==null?void 0:a.sstManagement)||(Fs.GOOGLE_MODELS||"gemini-3.6-flash").split(",")[0].trim()}),[me,Le]=i.useState(()=>Object.values(Ot)),[F,oe]=i.useState(()=>_s),[xt,We]=i.useState(()=>Hs),[Ke,T]=i.useState(()=>Ws),[y,ee]=i.useState("gemini-3.8-flash-tts"),[m,be]=i.useState("Kore"),[ae,De]=i.useState("Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido."),[ge,mt]=i.useState(!1),[Ge,Ut]=i.useState("Puck"),[qe,Bt]=i.useState("Kore"),[he,Da]=i.useState(150),[k,Ve]=i.useState(It[0].text),[bt,Va]=i.useState("Voz expresiva, tono conversacional y alegre."),[se,Oa]=i.useState("Hola. Hoy quiero demostrarte cómo suena una respiración natural <breath> y cómo reacciono con una pequeña risa <laugh> cuando algo resulta verdaderamente sorprendente."),[Ft,_t]=i.useState(!1),[Ia,Ht]=i.useState(null),[Wt,Ra]=i.useState(0),[$a,Ua]=i.useState(0),[gt,Ye]=i.useState(.5),[ht,Je]=i.useState(1),[ft,Kt]=i.useState(!1),[Gt,qt]=i.useState(!1),[Ba,Yt]=i.useState(null),[L,le]=i.useState(null),Oe=i.useRef(null),[Xe,Fa]=i.useState("all"),[Ze,Jt]=i.useState("only_active"),[yt,_a]=i.useState(""),[wt,Ha]=i.useState(!1),[c,V]=i.useState(null),[de,Se]=i.useState(()=>{try{const t=localStorage.getItem(Rt);return t?JSON.parse(t):[]}catch{return[]}}),[C,vt]=i.useState("9:16"),[Qe,Wa]=i.useState("golden-rules"),[fe,Xt]=i.useState("bottom"),[Zt,Qt]=i.useState(!1),[O,ea]=i.useState(null),[ta,aa]=i.useState(""),[et,Ka]=i.useState(!1),[ye,sa]=i.useState(null),[ra,na]=i.useState(""),[X,ia]=i.useState(!0),[oa,Ga]=i.useState("CÁPSULA INTERACTIVA WAPPY"),[tt,qa]=i.useState("5 Reglas de Oro en Riesgo Eléctrico"),[la,Ya]=i.useState("Prevención inteligente y locución neural sincronizada"),[da,Ja]=i.useState("#14b8a6"),[ca,Xa]=i.useState("Crea una animación estilo Claude con tarjetas de cristal sobre las 5 reglas de oro de riesgo eléctrico, iconos luminosos y barras de progreso."),[at,pa]=i.useState(!1),[jt,Za]=i.useState(!1),[Te,Ee]=i.useState(()=>Aa({aspectRatio:"9:16",hasBaseVideo:!1,badgeText:"CÁPSULA INTERACTIVA WAPPY",headline:"5 Reglas de Oro en Riesgo Eléctrico",subheadline:"Prevención inteligente y locución neural sincronizada",accentColor:"#14b8a6",templateId:"golden-rules"})),[te,we]=i.useState(!0),[ve,re]=i.useState(0),[I,Ie]=i.useState(20),[kt,Qa]=i.useState(!1),[R,st]=i.useState(!1),[_,Nt]=i.useState(null),Z=i.useRef(""),[Re,ua]=i.useState(!1),[rt,nt]=i.useState(!1),[Ce,b]=i.useState(null),N=i.useRef(null),G=i.useRef(null),q=i.useRef(null),xa=i.useRef(null),es=i.useMemo(()=>Gs(Te),[Te]);i.useEffect(()=>{const t=()=>{const a=!!document.fullscreenElement;Qa(a),setTimeout(()=>{var s,r;(r=(s=N.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},80),setTimeout(()=>{var s,r;(r=(s=N.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},300)};return document.addEventListener("fullscreenchange",t),()=>document.removeEventListener("fullscreenchange",t)},[]),i.useEffect(()=>{const t=a=>{const s=a.data||{};s.type==="STUDIO_ELEMENT_SELECTED"?Nt(s.payload||null):s.type==="STUDIO_HTML_UPDATED"&&typeof s.htmlCode=="string"&&(Z.current=s.htmlCode)};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[]),i.useEffect(()=>{const t=de.slice(0,60);try{localStorage.setItem(Rt,JSON.stringify(t))}catch{try{localStorage.setItem(Rt,JSON.stringify(t.map(({audioBase64:a,...s})=>s)))}catch{}}},[de]),i.useEffect(()=>{const t=de.filter(a=>a.audioBase64&&!a.mediaKey);t.length!==0&&(async()=>{const a={};for(const s of t)try{const r=`audio-${s.id}`;await ke(r,lt(s.audioBase64)),a[s.id]=r}catch{}Object.keys(a).length!==0&&Se(s=>s.map(r=>a[r.id]?{...r,mediaKey:a[r.id],audioBase64:void 0}:r))})()},[]);const St=i.useRef(null),ma=t=>{St.current&&URL.revokeObjectURL(St.current);const a=URL.createObjectURL(t);return St.current=a,a},it=async(t,a)=>{const s=`audio-${t.id}`;let r=null;try{if(a.base64)r=lt(a.base64);else if(a.url){const n=await fetch(a.url,{headers:H(d)});n.ok&&(r=await n.blob())}r&&await ke(s,r)}catch{r=null}const o=r?{...t,kind:t.kind||"audio",mediaKey:s,audioBase64:void 0}:{...t,kind:t.kind||"audio",audioBase64:a.base64};return Se(n=>[o,...n.filter(p=>p.id!==t.id)]),r?s:void 0},ba=async t=>{if(t.mediaKey){const a=await _e(t.mediaKey);if(a)return a}if(t.audioBase64)return lt(t.audioBase64);if(t.downloadUrl)try{const a=await fetch(t.downloadUrl,{headers:H(d)});if(a.ok){const s=await a.blob(),r=`audio-${t.id}`;return ke(r,s).then(()=>Se(o=>o.map(n=>n.id===t.id?{...n,mediaKey:r}:n))).catch(()=>{}),s}}catch{}return null},ga=async(t,a=!1)=>{const s=await ba(t);return s?(V({url:ma(s),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey||`audio-${t.id}`}),t.durationSeconds&&t.durationSeconds>1&&Ie(t.durationSeconds),a&&je("video"),!0):(b({type:"error",text:"Este audio se generó antes de activar el guardado permanente y el servidor ya lo liberó (se reinició). Vuelve a generarlo: desde ahora todos los audios quedan guardados en tu navegador."}),!1)},Tt=(t,a)=>{const s=URL.createObjectURL(t),r=document.createElement("a");r.href=s,r.download=a,document.body.appendChild(r),r.click(),document.body.removeChild(r),setTimeout(()=>URL.revokeObjectURL(s),4e3)},ts=t=>{Se(a=>{const s=a.filter(o=>o.id!==t.id);return[t.mediaKey,t.htmlKey,t.mp4Key,t.capsuleKey].filter(Boolean).forEach(o=>{s.some(p=>[p.mediaKey,p.htmlKey,p.mp4Key,p.capsuleKey].includes(o))||Us(o)}),s})};i.useEffect(()=>{var a;const t=(a=x==null?void 0:x[Ds.google])==null?void 0:a.models;if(Array.isArray(t)&&t.length>0){const s=t.map(r=>(typeof r=="string"?r:(r==null?void 0:r.id)||(r==null?void 0:r.value)||"").replace("models/","").trim()).filter(r=>r&&r.includes("tts"));s.length>0&&Le(r=>{const o=new Map(r.map(n=>[n.id,n]));return s.map(n=>Ot[n]||o.get(n)||{id:n,name:n,badge:"GOOGLE_MODELS",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:`Modelo TTS cargado desde GOOGLE_MODELS (${n}).`,supportsMultiSpeaker:!n.includes("lite"),supportsVocalBursts:!n.includes("2.5"),supportedVoices:Ot["gemini-3.8-flash-tts"].supportedVoices})})}},[x]),i.useEffect(()=>{fetch("/api/studio/catalog",{headers:H(d)}).then(t=>t.ok?t.json():null).then(t=>{t&&(Array.isArray(t.models)&&t.models.length>0&&Le(t.models),Array.isArray(t.voices)&&t.voices.length>0&&oe(t.voices),Array.isArray(t.presets)&&t.presets.length>0&&We(t.presets),Array.isArray(t.vocalBursts)&&t.vocalBursts.length>0&&T(t.vocalBursts))}).catch(()=>{})},[d]),i.useEffect(()=>{const t=k.trim(),a=t?t.split(/\s+/).filter(Boolean).length:0;if(Ra(a),Ua(t.length),!t){Ye(0),Je(0);return}const s=setTimeout(()=>{fetch("/api/studio/tts/estimate",{method:"POST",headers:H(d),body:JSON.stringify({text:t,maxWordsPerChunk:he})}).then(r=>r.ok?r.json():null).then(r=>{r&&typeof r.estimatedMinutes=="number"?Ye(r.estimatedMinutes):Ye(Math.round(a/145*10)/10),r&&typeof r.chunkCount=="number"?Je(r.chunkCount):Je(Math.max(1,Math.ceil(a/he)))}).catch(()=>{Ye(Math.round(a/145*10)/10),Je(Math.max(1,Math.ceil(a/he)))})},250);return()=>clearTimeout(s)},[k,he,d]);const je=t=>{B(t),J({tab:t})},z=i.useMemo(()=>me.find(t=>t.id===y)||me[0],[me,y]),$e=t=>z!=null&&z.supportedVoices?z.supportedVoices.includes(t):!0,as=i.useMemo(()=>F.filter(t=>{const a=$e(t.id),s=Ze==="all"||a,r=Xe==="all"||t.gender===Xe,o=yt.trim().toLowerCase(),n=!o||t.name.toLowerCase().includes(o)||t.tone.toLowerCase().includes(o)||t.recommendedFor.toLowerCase().includes(o)||t.tag&&t.tag.toLowerCase().includes(o);return s&&r&&n}),[F,z,Ze,Xe,yt]),ss=async(t,a)=>{a==null||a.stopPropagation();try{Yt(t);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(d),body:JSON.stringify({voiceName:t,model:$e(t)?y:"gemini-3.8-flash-tts",text:`Hola, soy ${t}. Esta es una muestra de voz neural en WAPPY Studio para tus cápsulas y cursos.`})}),r=await ne(s);if(!s.ok||!r.success)throw new Error(r.error||"No se pudo sintetizar la muestra.");V({base64:r.audioBase64,title:`Muestra de Voz: ${t}`,durationSeconds:r.durationSeconds,voiceName:t})}catch(s){b({type:"error",text:s.message||"Error en audición de voz."})}finally{Yt(null)}},rs=async()=>{try{qt(!0),b(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(d),body:JSON.stringify({voiceName:m,model:y,text:"¡Conexión verificada con éxito! El motor de voz Gemini 3.8 Flash TTS en WAPPY Studio está listo."})}),a=await ne(t);if(!t.ok||!a.success)throw new Error(a.error||"Error probando conexión.");V({base64:a.audioBase64,title:`Prueba de Conexión (${m})`,durationSeconds:a.durationSeconds,voiceName:m}),b({type:"success",text:`¡Conexión activa con ${a.usedModel||y}! Audio sintetizado correctamente.`})}catch(t){b({type:"error",text:t.message||"Error de conexión con Gemini TTS."})}finally{qt(!1)}},ns=async()=>{if(k.trim())try{Kt(!0),b(null);const t=k.trim().slice(0,750),a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(d),body:JSON.stringify({text:t,voiceName:m,stylePrompt:ae,model:y,multiSpeaker:ge,speaker1:{name:"Alex",voiceName:Ge},speaker2:{name:"Sam",voiceName:qe}})}),s=await ne(a);if(!a.ok||!s.success)throw new Error(s.error||"Error al sintetizar vista previa.");V({base64:s.audioBase64,title:`Vista Previa: ${t.slice(0,38)}...`,durationSeconds:s.durationSeconds,voiceName:m,scriptText:t});const r={id:Date.now().toString(),title:`Vista Previa: ${t.slice(0,42)}...`,createdAt:Date.now(),voiceName:m,model:s.usedModel||y,durationSeconds:s.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,stylePrompt:ae,scriptText:t},o=await it(r,{base64:s.audioBase64});o&&V(n=>n&&{...n,mediaKey:o}),b({type:"success",text:"Audio generado y cargado en el reproductor. Puedes descargarlo en WAV o enviarlo al Compositor de Video."})}catch(t){b({type:"error",text:t.message||"Error sintetizando fragmento."})}finally{Kt(!1)}},is=async()=>{if(se.trim())try{_t(!0),b(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(d),body:JSON.stringify({text:se.trim(),voiceName:m,stylePrompt:bt,model:y})}),a=await ne(t);if(!t.ok||!a.success)throw new Error(a.error||"Error al sintetizar en el laboratorio.");V({base64:a.audioBase64,title:`Laboratorio (${m}): ${se.trim().slice(0,34)}...`,durationSeconds:a.durationSeconds,voiceName:m,scriptText:se.trim()});const s={id:Date.now().toString(),title:`Laboratorio: ${se.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:m,model:a.usedModel||y,durationSeconds:a.durationSeconds,wordCount:se.trim().split(/\s+/).filter(Boolean).length,stylePrompt:bt,scriptText:se.trim()},r=await it(s,{base64:a.audioBase64});r&&V(o=>o&&{...o,mediaKey:r})}catch(t){b({type:"error",text:t.message||"Error sintetizando prueba en el laboratorio."})}finally{_t(!1)}},os=async()=>{if(k.trim())try{b(null),Oe.current&&Oe.current.close();const t=await fetch("/api/studio/tts/jobs",{method:"POST",headers:H(d),body:JSON.stringify({text:k,voiceName:m,stylePrompt:ae,model:y,multiSpeaker:ge,speaker1:{name:"Alex",voiceName:Ge},speaker2:{name:"Sam",voiceName:qe},maxWordsPerChunk:he})}),a=await ne(t);if(!t.ok)throw new Error(a.error||"No se pudo iniciar el trabajo de larga duración.");const s={id:a.jobId,status:"processing",totalChunks:a.totalChunks,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:a.estimatedTotalSeconds,generatedTotalSeconds:0,progressPercent:0,chunks:Array.from({length:a.totalChunks},(o,n)=>({index:n,wordCount:0,status:"pending"}))};le(s);const r=new EventSource(`/api/studio/tts/jobs/${a.jobId}/stream${d?`?token=${encodeURIComponent(d)}`:""}`);Oe.current=r,r.addEventListener("snapshot",o=>{const n=JSON.parse(o.data);le(p=>p?{...p,...n}:n)}),r.addEventListener("chunk_start",o=>{const n=JSON.parse(o.data);le(p=>{if(!p)return null;const u=[...p.chunks];return u[n.chunkIndex]&&(u[n.chunkIndex]={...u[n.chunkIndex],status:"processing"}),{...p,currentChunkIndex:n.chunkIndex,chunks:u}})}),r.addEventListener("chunk_complete",o=>{const n=JSON.parse(o.data);le(p=>{if(!p)return null;const u=[...p.chunks];u[n.chunkIndex]&&(u[n.chunkIndex]={...u[n.chunkIndex],status:"completed",durationSeconds:n.durationSeconds,audioBase64:n.audioBase64});const S=u.filter($=>$.status==="completed").length;return{...p,completedChunks:S,progressPercent:n.progressPercent,generatedTotalSeconds:n.generatedTotalSeconds,chunks:u}})}),r.addEventListener("job_completed",o=>{const n=JSON.parse(o.data);r.close(),le(u=>u?{...u,status:"completed",progressPercent:100,downloadUrl:n.downloadUrl}:null),V({url:n.downloadUrl,title:`Audio Completo: ${k.trim().slice(0,35)}...`,durationSeconds:n.totalDurationSeconds,voiceName:m,scriptText:k});const p={id:n.id,title:`Audio Completo: ${k.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:m,model:y,durationSeconds:n.totalDurationSeconds,wordCount:Wt,downloadUrl:n.downloadUrl,stylePrompt:ae,scriptText:k};it(p,{url:n.downloadUrl}).then(u=>{u&&V(S=>S&&{...S,mediaKey:u})})}),r.addEventListener("job_failed",o=>{const n=JSON.parse(o.data);r.close(),le(p=>p?{...p,status:"failed",error:n.error}:null)}),r.addEventListener("job_status",o=>{const n=JSON.parse(o.data);le(p=>p?{...p,status:n.status}:null)})}catch(t){b({type:"error",text:t.message||"Error iniciando trabajo."})}},Et=async t=>{L&&(t==="cancel"&&Oe.current&&Oe.current.close(),await fetch(`/api/studio/tts/jobs/${L.id}/control`,{method:"POST",headers:H(d),body:JSON.stringify({action:t})}),le(a=>a?{...a,status:t==="pause"?"paused":t==="resume"?"processing":"cancelled"}:null))},Ct=t=>{const a=document.getElementById("wappy-studio-tts-editor");if(!a){Ve(n=>`${n} ${t}`);return}const s=a.selectionStart,r=a.selectionEnd,o=k.substring(0,s)+t+k.substring(r);Ve(o),setTimeout(()=>{a.focus(),a.setSelectionRange(s+t.length,s+t.length)},15)},ze=(t=C,a=!!O,s=Qe)=>{Ee(Aa({aspectRatio:t,hasBaseVideo:a,badgeText:oa,headline:tt,subheadline:la,accentColor:da,templateId:s}))},ls=async()=>{const t=(k||tt||"").trim().slice(0,750);if(t)try{Qt(!0),b(null);const a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(d),body:JSON.stringify({text:t,voiceName:m,stylePrompt:ae,model:y,multiSpeaker:ge,speaker1:{name:"Alex",voiceName:Ge},speaker2:{name:"Sam",voiceName:qe}})}),s=await ne(a);if(!a.ok||!s.success)throw new Error(s.error||"No se pudo sintetizar la voz para el video.");V({base64:s.audioBase64,title:`Locución de Video (${m})`,durationSeconds:s.durationSeconds,voiceName:m,scriptText:t}),it({id:`vo-${Date.now()}`,title:`Locución de Video: ${t.slice(0,40)}...`,createdAt:Date.now(),voiceName:m,model:s.usedModel||y,durationSeconds:s.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,stylePrompt:ae,scriptText:t},{base64:s.audioBase64}).then(r=>{r&&V(o=>o&&{...o,mediaKey:r})}),s.durationSeconds&&s.durationSeconds>1&&Ie(s.durationSeconds),re(0),we(!0),setTimeout(()=>{var r,o,n,p;(o=(r=N.current)==null?void 0:r.contentWindow)==null||o.postMessage({type:"STUDIO_RESTART"},"*"),(n=q.current)==null||n.play().catch(()=>{}),(p=G.current)==null||p.play().catch(()=>{})},120),b({type:"success",text:`¡Locución neural (${m}) sincronizada automáticamente con el lienzo de video!`})}catch(a){b({type:"error",text:a.message||"Error sincronizando voz con el video."})}finally{Qt(!1)}},ds=async()=>{try{pa(!0),b(null);const t=await fetch("/api/studio/video/generate-html",{method:"POST",headers:H(d),body:JSON.stringify({prompt:ca,scriptText:k,aspectRatio:C,hasBaseVideo:!!O,showSubtitles:X,durationSeconds:Math.round((c==null?void 0:c.durationSeconds)||I||25),companyName:(l==null?void 0:l.name)||"WAPPY IA",modelName:D})}),a=await ne(t);if(!t.ok||!a.success)throw new Error(a.error||"Error generando composición HTML con IA.");Ee(a.htmlCode),b({type:"success",text:"¡Escena HTML + GSAP generada con éxito! Reproduciendo en el lienzo interactivo."})}catch(t){b({type:"error",text:t.message||"No se pudo generar la escena HTML con IA."})}finally{pa(!1)}},cs=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;O&&URL.revokeObjectURL(O);const s=URL.createObjectURL(a);ea(s),aa(a.name),ze(C,!0)},ps=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;ye&&URL.revokeObjectURL(ye);const s=URL.createObjectURL(a);sa(s),na(a.name)},Y=i.useMemo(()=>ye||(c!=null&&c.url?c.url:c!=null&&c.base64?`data:audio/wav;base64,${c.base64}`:""),[ye,c]);i.useEffect(()=>{if(w!=="video"||!te||R)return;let t=performance.now();const a=setInterval(()=>{const s=performance.now(),r=(s-t)/1e3;t=s;const o=q.current,n=G.current;if(o&&Y&&!o.paused&&!o.ended){re(o.currentTime);return}if(n&&O&&!n.paused&&!n.ended){re(n.currentTime);return}re(p=>{var $,A;const u=Math.max(1,I||20),S=p+r;return S>=u?(we(!1),(A=($=N.current)==null?void 0:$.contentWindow)==null||A.postMessage({type:"STUDIO_PAUSE"},"*"),u):S})},250);return()=>clearInterval(a)},[w,te,R,I,Y,O]);const ha=()=>{var r,o,n,p,u;const t=Math.max(1,I||20);if(!te&&(ve>=t-.3||!!((r=q.current)!=null&&r.ended))){zt();return}const s=!te;s&&R&&(st(!1),(n=(o=N.current)==null?void 0:o.contentWindow)==null||n.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),we(s),(u=(p=N.current)==null?void 0:p.contentWindow)==null||u.postMessage({type:s?"STUDIO_PLAY":"STUDIO_PAUSE"},"*"),G.current&&(s?G.current.play().catch(()=>{}):G.current.pause()),q.current&&Y&&(s?q.current.play().catch(()=>{}):q.current.pause())},zt=()=>{var t,a,s,r;R&&(st(!1),(a=(t=N.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),re(0),we(!0),(r=(s=N.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_RESTART"},"*"),G.current&&(G.current.currentTime=0,G.current.play().catch(()=>{})),q.current&&Y&&(q.current.currentTime=0,q.current.play().catch(()=>{}))},fa=t=>{var s,r;re(t);const a=I>0?t/I:0;(r=(s=N.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SEEK",progress:a,time:t},"*"),G.current&&(G.current.currentTime=t),q.current&&Y&&(q.current.currentTime=t)},ya=()=>{var a,s,r,o;const t=!R;st(t),t?(we(!1),(a=G.current)==null||a.pause(),(s=q.current)==null||s.pause()):Z.current&&(Ee(Z.current),Z.current=""),(o=(r=N.current)==null?void 0:r.contentWindow)==null||o.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:t},"*")},ce=t=>{var a,s;Nt(r=>r&&{...r,...t}),(s=(a=N.current)==null?void 0:a.contentWindow)==null||s.postMessage({type:"STUDIO_UPDATE_SELECTED",updates:t},"*")},us=()=>{var t,a;Z.current&&(Ee(Z.current),Z.current=""),st(!1),Nt(null),(a=(t=N.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*"),b({type:"success",text:"¡Cambios de textos y posición de cajas guardados en la composición HTML!"})},wa=()=>{var t,a,s;document.fullscreenElement?(t=document.exitFullscreen)==null||t.call(document).catch(()=>{}):(s=(a=xa.current)==null?void 0:a.requestFullscreen)==null||s.call(a).catch(()=>{})},pe=i.useMemo(()=>((c==null?void 0:c.scriptText)||k||"").replace(/<[^>]+>/g,"").replace(/\|[^|]+\|/g,"").replace(/^(Alex|Sam):\s*/gim,"").split(/\s+/).filter(Boolean),[c==null?void 0:c.scriptText,k]),At=i.useMemo(()=>{if(!X||pe.length===0)return null;const t=Math.max(0,Math.min(.999,ve/Math.max(1,I))),a=Math.floor(t*pe.length),s=5,r=Math.floor(a/s)*s;return{words:pe.slice(r,r+s),activeOffset:a-r}},[X,pe,ve,I]),Pt=async()=>{if(c!=null&&c.base64)return c.base64;if(!Y)return null;try{const t=await fetch(Y);if(!t.ok)return null;const a=await t.arrayBuffer(),s=new Uint8Array(a);let r="";const o=32768;for(let n=0;n<s.length;n+=o)r+=String.fromCharCode.apply(null,Array.from(s.subarray(n,n+o)));return window.btoa(r)}catch{return null}},va=async()=>{try{ua(!0);const t=Math.min(60,Math.max(4,Math.round(I||15))),a=t>20?12:15;b({type:"info",text:`Renderizando Video MP4 con Audio + Animación + Subtítulos (${t}s)... Espera ~15-25 segundos mientras se ensambla el archivo .MP4 para WhatsApp y Celular.`});const s=Z.current||Te,r=await Pt(),o=await fetch("/api/studio/video/render-mp4",{method:"POST",headers:H(d),body:JSON.stringify({htmlCode:s,audioBase64:r,scriptText:(c==null?void 0:c.scriptText)||k,showSubtitles:X,subtitlePosition:fe,aspectRatio:C,durationSeconds:t,fps:a})}),n=await ne(o);if(!o.ok||!n.success||!n.videoBase64)throw new Error(n.error||"No se pudo renderizar el archivo MP4 en el servidor.");const p=window.atob(n.videoBase64),u=new Array(p.length);for(let ue=0;ue<p.length;ue++)u[ue]=p.charCodeAt(ue);const S=new Uint8Array(u),$=new Blob([S],{type:"video/mp4"});Mt({mp4Blob:$});const A=URL.createObjectURL($),U=document.createElement("a");U.href=A,U.download=`wappy-studio-reel-${Date.now()}.mp4`,document.body.appendChild(U),U.click(),document.body.removeChild(U),URL.revokeObjectURL(A),b({type:"success",text:`¡Video MP4 Universal (${n.width}x${n.height} • H.264 + Audio AAC) descargado con éxito! Listo para enviar por WhatsApp, ver en celular o subir a Reels/TikTok.`})}catch(t){b({type:"error",text:t.message||"Error renderizando MP4 en el servidor."})}finally{ua(!1)}},xs=async t=>{var $;let a=t;const s=A=>A.replace(/<\/script/gi,"<\\/script"),r=async A=>{try{const U=await fetch(A,{cache:"force-cache"});return U.ok?await U.text():""}catch{return""}};let o="";try{const A=($=N.current)==null?void 0:$.contentDocument;A&&Array.from(A.querySelectorAll("style")).forEach(U=>{if((U.id||"").startsWith("wappy-studio-bridge"))return;const Q=U.textContent||"";Q&&!a.includes(Q.slice(0,120))&&(o+=`
${Q}`)})}catch{o=""}const[n,p]=await Promise.all([/gsap(\.min)?\.js/i.test(a)?r("/assets/gsap.min.js"):Promise.resolve(""),/cdn\.tailwindcss\.com|tailwind-cdn\.js/i.test(a)?r("/assets/tailwind-cdn.js"):Promise.resolve("")]);n&&(a=a.replace(/<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-gsap">${s(n)}<\/script>`)),a=a.replace(/<script[^>]*src=["'][^"']*(cdn\.tailwindcss\.com|tailwind-cdn\.js)[^"']*["'][^>]*>\s*<\/script>/gi,()=>"<script>window.tailwind = window.tailwind || {};<\/script>"+(p?`<script id="wappy-inline-tailwind">${s(p)}<\/script>`:""));const u=`
<meta name="color-scheme" content="dark" />
<meta name="format-detection" content="telephone=no" />
<style id="wappy-precompiled-tailwind">${o.replace(/<\/style/gi,"<\\/style")}</style>
<style id="wappy-offline-font-fallback">
  html, body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
</style>
<noscript><style>
  #header-hud, #top-bar, #scene-1, #scene-1 *, #hero-card, .metric-item { opacity: 1 !important; transform: none !important; visibility: visible !important; }
  #wappy-capsule-controls, #wappy-mobile-tap-overlay { display: none !important; }
</style></noscript>`;/<head[^>]*>/i.test(a)?a=a.replace(/<head[^>]*>/i,A=>`${A}${u}`):a=`${u}
${a}`,/<meta[^>]+name=["']viewport/i.test(a)||(a=a.replace(/<head[^>]*>/i,A=>`${A}<meta name="viewport" content="width=device-width, initial-scale=1.0" />`));const S=`<script id="wappy-visibility-guard">
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
<\/script>`;return a=a.includes("</body>")?a.replace("</body>",()=>`${S}
</body>`):`${a}
${S}`,a},ja=async()=>{const t=await xs(Z.current||Te),a=await Pt(),s=a?`data:audio/wav;base64,${a}`:"",r=Math.max(4,Math.round((I||20)*10)/10),o=`
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
  ${X&&pe.length>0?"#subtitle-footer, #subtitle-card { display: none !important; }":""}
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
    ${fe==="top"?"top: 54px;":fe==="center"?"top: 50%; transform: translateY(-50%);":"bottom: 58px;"}
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
<div id="wappy-capsule-subtitles" style="display:${X&&pe.length>0?"flex":"none"};">
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
  var words = ${JSON.stringify(pe)};
  var showSubs = ${!!(X&&pe.length>0)};
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
${o}`},Ue=i.useRef(null),Mt=async(t={},a=!0)=>{var s;try{const r=Z.current||Te,o=(c==null?void 0:c.mediaKey)||Y||"sin-audio",n=`${r.length}:${r.slice(-200)}:${o}:${C}`,u=((s=Ue.current)==null?void 0:s.signature)===n&&de.some(Q=>{var P;return Q.id===((P=Ue.current)==null?void 0:P.id)})?Ue.current.id:`video-${Date.now()}`,S=`html-${u}`;await ke(S,new Blob([r],{type:"text/html"}));let $=c==null?void 0:c.mediaKey;if(!$&&Y){const Q=await Pt();Q&&($=`audio-${u}`,await ke($,lt(Q)))}let A;t.mp4Blob&&(A=`mp4-${u}`,await ke(A,t.mp4Blob));let U;t.capsuleHtml&&(U=`capsule-${u}`,await ke(U,new Blob([t.capsuleHtml],{type:"text/html"})));const ue=((c==null?void 0:c.scriptText)||k||tt||"").replace(/<[^>]+>/g,"").trim();Se(Q=>{const P=Q.find(Lt=>Lt.id===u);return[{...P||{},id:u,kind:"video",title:(P==null?void 0:P.title)||`Video ${C}: ${ue.slice(0,40)}...`,createdAt:(P==null?void 0:P.createdAt)||Date.now(),voiceName:(c==null?void 0:c.voiceName)||m,model:D,durationSeconds:Math.round((I||0)*10)/10,wordCount:ue.split(/\s+/).filter(Boolean).length,scriptText:(c==null?void 0:c.scriptText)||k,htmlKey:S,mediaKey:$||(P==null?void 0:P.mediaKey),mp4Key:A||(P==null?void 0:P.mp4Key),capsuleKey:U||(P==null?void 0:P.capsuleKey),aspectRatio:C,showSubtitles:X,subtitlePosition:fe},...Q.filter(Lt=>Lt.id!==u)]}),Ue.current={id:u,signature:n},a||b({type:"success",text:"¡Video guardado en la Biblioteca! Puedes reabrirlo, editarlo o descargarlo cuando quieras."})}catch(r){b({type:"error",text:`No se pudo guardar el video en la Biblioteca: ${(r==null?void 0:r.message)||"error de almacenamiento"}`})}},ms=async t=>{const a=t.htmlKey?await _e(t.htmlKey):null;if(!a){b({type:"error",text:"No se encontró la composición HTML de este video."});return}const s=await a.text();t.aspectRatio&&vt(t.aspectRatio),typeof t.showSubtitles=="boolean"&&ia(t.showSubtitles),t.subtitlePosition&&Xt(t.subtitlePosition),Z.current="",Ee(s);const r=t.mediaKey?await _e(t.mediaKey):null;r&&V({url:ma(r),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey}),t.durationSeconds&&t.durationSeconds>1&&Ie(t.durationSeconds),re(0),we(!1),Ue.current=null,je("video")},ka=async()=>{var t,a;try{nt(!0);const s=await ja();Mt({capsuleHtml:s});const r=`wappy-academia-capsula-${Date.now()}.html`,o=new Blob([s],{type:"text/html;charset=utf-8"});if(typeof window<"u"&&((t=window.matchMedia)==null?void 0:t.call(window,"(pointer: coarse)").matches)&&typeof navigator.share=="function")try{const S=new File([o],r,{type:"text/html"});if((a=navigator.canShare)!=null&&a.call(navigator,{files:[S]})){await navigator.share({files:[S],title:"Cápsula WAPPY",text:"Cápsula interactiva WAPPY (ábrela tocando el archivo)."}),b({type:"success",text:"¡Cápsula HTML compartida! Funciona sin internet al tocarla en WhatsApp."});return}}catch(S){if((S==null?void 0:S.name)==="AbortError")return}const p=URL.createObjectURL(o),u=document.createElement("a");u.href=p,u.download=r,document.body.appendChild(u),u.click(),document.body.removeChild(u),URL.revokeObjectURL(p),b({type:"success",text:"¡Cápsula HTML autocontenida descargada! Incluye estilos, animación y voz en un solo archivo: envíala por WhatsApp y ábrela tocándola, incluso sin internet."})}finally{nt(!1)}},bs=async()=>{try{nt(!0);const s=`<iframe srcdoc="${(await ja()).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" style="width:100%;max-width:${C==="9:16"?"400px":"860px"};aspect-ratio:${C==="9:16"?"9/16":"16/9"};border:0;border-radius:16px;overflow:hidden;display:block;margin:0 auto;box-shadow:0 20px 50px rgba(0,0,0,0.35);" allow="autoplay; fullscreen"></iframe>`;await navigator.clipboard.writeText(s),b({type:"success",text:"¡Código <iframe srcdoc> copiado al portapapeles! Pégalo directamente en cualquier lección de la Academia WAPPY (LMS)."})}catch{b({type:"error",text:"No se pudo copiar el código embebido al portapapeles."})}finally{nt(!1)}},Ae=((Na=z==null?void 0:z.supportedVoices)==null?void 0:Na.length)||14;return l&&l.role!=="ADMIN"?e.jsx("div",{className:"flex-1 flex items-center justify-center bg-surface-secondary/30 min-h-screen p-6",children:e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md",children:[e.jsx("div",{className:"w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto",children:e.jsx(Sa,{className:"w-6 h-6"})}),e.jsx("h2",{className:"text-lg font-extrabold text-text-primary",children:"WAPPY Studio (Acceso Administrador)"}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Por el momento este módulo está habilitado exclusivamente para cuentas de Administración de WAPPY."}),e.jsx("a",{href:"/c/new",className:"inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition",children:"Volver al inicio"})]})}):e.jsxs("div",{className:"flex-1 flex flex-col bg-surface-secondary/30 min-h-screen h-auto overflow-y-auto pb-16",children:[e.jsx("header",{className:"bg-white dark:bg-gray-900 border-b border-border-medium/40 px-4 sm:px-6 py-4 shadow-2xs sticky top-0 z-30",children:e.jsxs("div",{className:"max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[f&&!E&&e.jsx("div",{className:"hidden md:block",children:e.jsx(Vs,{setNavVisible:g})}),e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2 mb-1",children:e.jsxs("span",{className:"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wider",children:[e.jsx(xe,{className:"w-3 h-3 text-teal-500"}),"Estudio Multimodal • Gemini 3.8 Flash TTS & HyperFrames"]})}),e.jsxs("h1",{className:"text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400",children:[e.jsx(Sa,{className:"w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0"}),"WAPPY Studio"]}),e.jsx("p",{className:"text-xs text-text-secondary mt-0.5 hidden sm:block",children:"Síntesis de voz neural de hasta 1 hora continua y creación de videos animados en HTML/GSAP con capas sobre tus propios videos."})]})]}),e.jsxs("div",{className:"flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-nowrap",children:[e.jsxs("div",{className:"inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-x-auto no-scrollbar min-w-0",children:[e.jsxs("button",{type:"button",onClick:()=>je("tts"),className:h("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",w==="tts"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Be,{className:"w-3.5 h-3.5 text-teal-500"}),e.jsx("span",{children:"Estudio de Voz (TTS)"})]}),e.jsxs("button",{type:"button",onClick:()=>je("video"),className:h("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",w==="video"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Ne,{className:"w-3.5 h-3.5 text-purple-500"}),e.jsx("span",{children:"Video HTML & Capas"})]}),e.jsxs("button",{type:"button",onClick:()=>je("lab"),className:h("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",w==="lab"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Dt,{className:"w-3.5 h-3.5 text-amber-500"}),e.jsx("span",{children:"Voces & Bursts"})]}),e.jsxs("button",{type:"button",onClick:()=>je("library"),className:h("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",w==="library"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Vt,{className:"w-3.5 h-3.5 text-indigo-500"}),e.jsxs("span",{children:["Biblioteca (",de.length,")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(Os,{selectedModel:D,onSelectModel:He,disabled:at}),e.jsx(v,{icon:Gt?e.jsx(W,{className:"animate-spin"}):e.jsx(Ta,{}),label:"Probar Audio con IA",variant:"purple",disabled:Gt,onClick:rs})]})]})]})}),e.jsxs("main",{className:"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6",children:[Ce&&e.jsxs("div",{className:h("p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200",Ce.type==="success"?"bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200":Ce.type==="error"?"bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200":"bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200"),children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[Ce.type==="success"?e.jsx(Pa,{className:"w-4 h-4 text-emerald-500 shrink-0"}):Ce.type==="error"?e.jsx(hs,{className:"w-4 h-4 text-rose-500 shrink-0"}):e.jsx(W,{className:"w-4 h-4 text-sky-500 animate-spin shrink-0"}),e.jsx("span",{children:Ce.text})]}),e.jsx("button",{type:"button",onClick:()=>b(null),className:"p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10",children:e.jsx(Ma,{className:"w-3.5 h-3.5"})})]}),c&&e.jsx(Js,{audioBase64:c.base64,audioUrl:c.url,title:c.title,durationSeconds:c.durationSeconds,voiceName:c.voiceName,onSendToVideo:()=>{je("video"),b({type:"success",text:"Audio vinculado automáticamente a la pista de locución del Compositor de Video."})}}),w==="tts"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[L&&e.jsx(Xs,{job:L,onPause:()=>Et("pause"),onResume:()=>Et("resume"),onCancel:()=>Et("cancel"),onPlayChunk:t=>{t.audioBase64&&V({base64:t.audioBase64,title:`Fragmento #${t.index+1} (${t.durationSeconds||0}s)`,durationSeconds:t.durationSeconds,voiceName:m})},onLoadMaster:()=>{L.downloadUrl&&V({url:L.downloadUrl,title:`Master Completo (${m})`,durationSeconds:L.generatedTotalSeconds,voiceName:m,scriptText:k})}}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",children:[e.jsxs("div",{className:"lg:col-span-5 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"space-y-2.5",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-1.5",children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(fs,{className:"w-4 h-4 text-teal-500"}),"Modelo Oficial Gemini TTS"]}),e.jsx("span",{className:"text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full",children:"Verificado en AI Studio"})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:me.map(t=>{const a=y===t.id;return e.jsxs("button",{type:"button",onClick:()=>{ee(t.id),t.supportedVoices.includes(m)||be(t.supportedVoices[0]||"Kore")},className:h("text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30 shadow-xs":"bg-slate-50/60 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-text-primary",children:t.name}),e.jsx("span",{className:h("text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0",t.badgeColor),children:t.badge})]}),e.jsx("p",{className:"text-[11px] text-text-secondary leading-snug",children:t.description})]}),e.jsxs("div",{className:"mt-2.5 pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-amber-600 dark:text-amber-400 font-bold",children:t.rateLimitLabel||t.quotaLabel}),a?e.jsxs("span",{className:"text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5",children:[e.jsx(dt,{className:"w-3 h-3"})," Activo (",t.supportedVoices.length," voces)"]}):e.jsxs("span",{className:"text-text-secondary",children:[t.supportedVoices.length," voces"]})]})]},t.id)})}),e.jsxs("div",{className:"px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"text-text-secondary flex items-center gap-1.5",children:[e.jsx(xe,{className:"w-3.5 h-3.5 text-teal-500 shrink-0"}),e.jsxs("span",{children:["Voces activas para"," ",e.jsx("strong",{className:"text-text-primary",children:z==null?void 0:z.name}),":"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsxs("span",{className:"font-extrabold text-emerald-600 dark:text-emerald-400",children:[Ae," de ",F.length," disponibles"]}),Ae<F.length&&e.jsxs("button",{type:"button",onClick:()=>ee("gemini-3.8-flash-tts"),className:"text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer",children:["Mostrar todas (",F.length,")"]})]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"block text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"Estilos y Plantillas Rápidas"}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:xt.map(t=>e.jsx("button",{type:"button",onClick:()=>{$e(t.voiceName)||ee("gemini-3.8-flash-tts"),t.multiSpeaker?(mt(!0),t.speaker1&&Ut(t.speaker1.voiceName),t.speaker2&&Bt(t.speaker2.voiceName)):(mt(!1),be(t.voiceName)),De(t.style)},className:"text-xs px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80 hover:border-teal-500/50 hover:bg-teal-500/10 text-text-primary font-semibold transition cursor-pointer",children:t.name},t.id))})]}),e.jsxs("div",{className:"flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/90 rounded-xl border border-slate-200/80 dark:border-zinc-800 gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx(ys,{className:"w-4 h-4 text-teal-500 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-text-primary",children:"Modo Diálogo / Podcast (2 Voces)"}),e.jsxs("p",{className:"text-[11px] text-text-secondary",children:["Alterna interlocutores usando"," ",e.jsx("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:"Alex:"})," ","y"," ",e.jsx("span",{className:"font-mono font-bold text-purple-600 dark:text-purple-400",children:"Sam:"})]})]})]}),e.jsx("button",{type:"button",onClick:()=>mt(!ge),className:h("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",ge?"bg-teal-600":"bg-slate-300 dark:bg-zinc-700"),children:e.jsx("span",{className:h("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",ge?"translate-x-4":"translate-x-0")})})]}),ge?e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200/80 dark:border-zinc-800",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-teal-600 dark:text-teal-400 mb-1",children:"Voz para Alex (Hablante 1)"}),e.jsx("select",{value:Ge,onChange:t=>Ut(t.target.value),className:"w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500",children:((z==null?void 0:z.supportedVoices)||[]).map(t=>{const a=F.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-purple-600 dark:text-purple-400 mb-1",children:"Voz para Sam (Hablante 2)"}),e.jsx("select",{value:qe,onChange:t=>Bt(t.target.value),className:"w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500",children:((z==null?void 0:z.supportedVoices)||[]).map(t=>{const a=F.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(Be,{className:"w-3.5 h-3.5 text-teal-500"}),"Catálogo de Voces (",Ae," activas / ",F.length," totales)"]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-0.5",children:"Las voces no compatibles con la versión seleccionada quedan desactivadas."})]}),e.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px]",children:[e.jsxs("button",{type:"button",onClick:()=>Jt("only_active"),className:h("px-2 py-0.5 rounded-md transition cursor-pointer",Ze==="only_active"?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:["Solo Activas (",Ae,")"]}),e.jsxs("button",{type:"button",onClick:()=>Jt("all"),className:h("px-2 py-0.5 rounded-md transition cursor-pointer",Ze==="all"?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:["Todas (",F.length,")"]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(ws,{className:"w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"}),e.jsx("input",{type:"text",value:yt,onChange:t=>_a(t.target.value),placeholder:"Buscar voz (Kore, Orus, profunda, podcast...)",className:"w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-slate-400 focus:outline-none focus:border-teal-500"})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-[11px] shrink-0",children:["all","Femenino","Masculino"].map(t=>e.jsx("button",{type:"button",onClick:()=>Fa(t),className:h("px-2 py-1 rounded-lg transition cursor-pointer",Xe===t?"bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-300 font-bold shadow-2xs":"text-text-secondary hover:text-text-primary"),children:t==="all"?"Todas":t==="Femenino"?"Femeninas":"Masculinas"},t))})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1",children:as.map(t=>{const a=m===t.id,s=Ba===t.id,r=$e(t.id);return e.jsxs("div",{onClick:()=>{r||ee("gemini-3.8-flash-tts"),be(t.id)},className:h("p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30 shadow-xs":"bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400",!r&&"opacity-60"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-start justify-between gap-1",children:[e.jsx("span",{className:"text-sm font-extrabold text-text-primary",children:t.name}),e.jsx("button",{type:"button",onClick:o=>ss(t.id,o),disabled:s,title:"Escuchar muestra de esta voz",className:"p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer",children:s?e.jsx(W,{className:"w-3 h-3 animate-spin"}):e.jsx(ie,{className:"w-3 h-3 fill-current"})})]}),e.jsxs("div",{className:"flex items-center gap-1 flex-wrap mt-1",children:[e.jsx("span",{className:"text-[9px] font-semibold text-text-secondary bg-slate-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded",children:t.gender}),r?e.jsx("span",{className:"text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded",children:"✓ Activa"}):e.jsx("span",{className:"text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded",children:"Solo 3.8/3.1"})]}),e.jsx("p",{className:"text-[11px] text-teal-700 dark:text-teal-300 font-semibold mt-1 leading-tight",children:t.tone}),t.tag&&e.jsx("span",{className:"inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20",children:t.tag})]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-slate-200/60 dark:border-zinc-800 line-clamp-2 leading-tight",children:t.recommendedFor})]},t.id)})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"Directiva de Estilo y Emoción"}),e.jsx("span",{className:"text-[10px] font-mono text-text-secondary",children:"speechMetadata.style"})]}),e.jsx("textarea",{rows:2,value:ae,onChange:t=>De(t.target.value),placeholder:"Ej: Voz cálida, pausada y reflexiva de narrador de documentales...",className:"w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{children:[e.jsxs("button",{type:"button",onClick:()=>Ha(!wt),className:"flex items-center justify-between w-full text-xs text-text-secondary hover:text-text-primary font-bold py-1 transition cursor-pointer",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(vs,{className:"w-3.5 h-3.5 text-teal-500"}),"Configuración Avanzada de Segmentación (Chunking)"]}),e.jsx("span",{children:wt?"▲":"▼"})]}),wt&&e.jsxs("div",{className:"mt-2 p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2 text-xs",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-text-secondary",children:"Palabras por fragmento"}),e.jsxs("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:[he," palabras"]})]}),e.jsx("input",{type:"range",min:80,max:250,step:10,value:he,onChange:t=>Da(parseInt(t.target.value,10)),className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-teal-600"}),e.jsx("p",{className:"text-[10px] text-text-secondary",children:"Fragmentos de ~150 palabras (~55s de audio) garantizan fluidez continua para audiolibros de hasta 60 minutos."})]})]})]}),e.jsxs("div",{className:"lg:col-span-7 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"flex items-center justify-between gap-3 flex-nowrap",children:[e.jsxs("h2",{className:"text-sm font-extrabold text-text-primary flex items-center gap-2 shrink-0",children:[e.jsx(Be,{className:"w-4 h-4 text-teal-500"}),"Texto a Sintetizar"]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0 flex-nowrap",children:[e.jsx("span",{className:"text-xs text-text-secondary hidden sm:inline",children:"Cargar ejemplo:"}),e.jsxs("select",{defaultValue:"",onChange:t=>{const a=It.find(s=>s.title===t.target.value);a&&Ve(a.text),t.target.value=""},className:"bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-primary text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500",children:[e.jsx("option",{value:"",disabled:!0,children:"Seleccionar texto de muestra..."}),It.map(t=>e.jsx("option",{value:t.title,children:t.title},t.title))]}),k&&e.jsx(v,{size:"sm",icon:e.jsx(Pe,{}),label:"Limpiar",variant:"danger",onClick:()=>Ve("")})]})]}),e.jsxs("div",{className:"p-3 bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px]",children:[e.jsxs("span",{className:"font-bold text-text-secondary flex items-center gap-1",children:[e.jsx(xe,{className:"w-3.5 h-3.5 text-amber-500"}),"Insertar Efectos Vocales (Vocal Bursts) en el cursor:"]}),e.jsx("span",{className:"font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold",children:y})]}),e.jsxs("div",{className:"flex flex-wrap gap-1.5",children:[Ke.map(t=>e.jsxs("button",{type:"button",onClick:()=>Ct(` ${t.tag} `),title:t.description,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-teal-500/10 border border-slate-200 dark:border-zinc-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer",children:[e.jsx("span",{className:"text-amber-600 dark:text-amber-400 font-bold",children:t.tag}),e.jsxs("span",{className:"text-text-secondary text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),e.jsx("button",{type:"button",onClick:()=>Ct(`
Alex: `),className:"px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold transition cursor-pointer",children:"Alex:"}),e.jsx("button",{type:"button",onClick:()=>Ct(`
Sam: `),className:"px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold transition cursor-pointer",children:"Sam:"})]})]}),e.jsx("textarea",{id:"wappy-studio-tts-editor",rows:12,value:k,onChange:t=>Ve(t.target.value),placeholder:"Escribe o pega aquí el guion para tu cápsula SST, curso de Academia WAPPY, podcast o audiolibro de hasta 1 hora...",className:"w-full bg-slate-50/70 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-teal-500 leading-relaxed resize-y min-h-[260px]"}),e.jsxs("div",{className:"bg-slate-50 dark:bg-zinc-900/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between text-xs gap-2",children:[e.jsxs("div",{className:"flex items-center gap-3 text-text-secondary",children:[e.jsxs("span",{children:["Palabras:"," ",e.jsx("strong",{className:"text-text-primary font-mono",children:Wt})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Caracteres:"," ",e.jsx("strong",{className:"text-text-primary font-mono",children:$a})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Fragmentos estimados:"," ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400 font-mono",children:ht})]})]}),e.jsxs("div",{className:"text-text-primary font-semibold",children:["Duración estimada:"," ",e.jsxs("strong",{className:"text-amber-600 dark:text-amber-400 font-mono",children:["~",gt," min"]})," ","/ 60 min máx"]})]}),e.jsx("div",{className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,Math.round(gt/60*100)))}%`}})})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1",children:[e.jsxs("button",{type:"button",onClick:ns,disabled:ft||(L==null?void 0:L.status)==="processing"||!k.trim(),className:"flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[ft?e.jsx(W,{className:"w-4 h-4 animate-spin text-teal-500"}):e.jsx(Ta,{className:"w-4 h-4 text-amber-500"}),e.jsx("span",{children:"Vista Previa Rápida (~1er fragmento)"})]}),e.jsxs("button",{type:"button",onClick:os,disabled:(L==null?void 0:L.status)==="processing"||ft||!k.trim(),className:"flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[(L==null?void 0:L.status)==="processing"?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(ie,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:ht>1?`Generar Audio Completo (${ht} fragmentos • ~${gt} min)`:"Generar Audio Completo"})]})]})]})]})]}),w==="video"&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200",children:[e.jsxs("div",{className:"lg:col-span-6 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsx("div",{className:"flex items-center justify-between gap-2",children:e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-text-primary flex items-center gap-2",children:[e.jsx(Ne,{className:"w-5 h-5 text-purple-500"}),"Estudio de Capas & Motion Graphics HTML"]}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Sube tu propio video grabado a cámara o genera animaciones estilo Claude/HeyGen sincronizadas con tu voz."})]})}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",onClick:()=>{vt("9:16"),ze("9:16",!!O,Qe)},className:h("p-3 rounded-xl border text-left transition cursor-pointer",C==="9:16"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-text-primary",children:"📱 Vertical 9:16 (Reels / TikTok)"}),e.jsx("div",{className:"text-[10px] text-text-secondary mt-0.5",children:"1080 × 1920 px • Ideal para redes y WhatsApp"})]}),e.jsxs("button",{type:"button",onClick:()=>{vt("16:9"),ze("16:9",!!O,Qe)},className:h("p-3 rounded-xl border text-left transition cursor-pointer",C==="16:9"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-text-primary",children:"🖥️ Horizontal 16:9 (YouTube / LMS)"}),e.jsx("div",{className:"text-[10px] text-text-secondary mt-0.5",children:"1920 × 1080 px • Ideal para cursos Academia WAPPY"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(xe,{className:"w-3.5 h-3.5 text-teal-500"}),"Plantillas Visuales Instantáneas (HyperFrames)"]}),e.jsx("span",{className:"text-[10px] text-text-secondary",children:"Clic para aplicar"})]}),e.jsx("div",{className:"grid grid-cols-2 gap-2",children:Ks.map(t=>{const a=Qe===t.id;return e.jsxs("button",{type:"button",onClick:()=>{Wa(t.id),ze(C,!!O,t.id)},className:h("p-2.5 rounded-xl border text-left transition cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50/70 dark:bg-zinc-900/70 border-slate-200 dark:border-zinc-800 hover:border-teal-400"),children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-text-primary truncate",children:t.name}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0",children:t.badge})]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-0.5 line-clamp-1",children:t.description})]},t.id)})})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3",children:[e.jsxs("div",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(Dt,{className:"w-4 h-4 text-teal-500"}),"Capas Base Multimedia (Video a Cámara + Locución)"]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{className:"p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-text-primary",children:"1. Tu Video Base (Opcional)"}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:ta?`Activo: ${ta}`:"Sube un MP4/WebM tuyo para montarle capas HTML encima."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(Ea,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Video MP4"}),e.jsx("input",{type:"file",accept:"video/mp4,video/webm,video/quicktime",onChange:cs,className:"hidden"})]}),O&&e.jsx(v,{size:"sm",icon:e.jsx(Pe,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(O),ea(null),aa(""),ze(C,!1)}})]})]}),e.jsxs("div",{className:"p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-text-primary",children:"2. Audio / Locución Sincronizada"}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:ra?`Archivo: ${ra}`:c?`Vinculado: ${c.title}`:"Usa el audio del Estudio TTS o sube un WAV/MP3."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(Ea,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Audio WAV/MP3"}),e.jsx("input",{type:"file",accept:"audio/*",onChange:ps,className:"hidden"})]}),ye&&e.jsx(v,{size:"sm",icon:e.jsx(Pe,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(ye),sa(null),na("")}})]})]})]})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"3. Textos de Capa y Subtítulos Dinámicos"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:X,onChange:t=>ia(t.target.checked),className:"rounded accent-teal-600"}),"Subtítulos"]}),X&&e.jsx("div",{className:"inline-flex items-center gap-0.5 bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[10px]",children:[{id:"bottom",label:"Abajo"},{id:"center",label:"Centro"},{id:"top",label:"Arriba"}].map(t=>e.jsx("button",{type:"button",onClick:()=>Xt(t.id),className:h("px-1.5 py-0.5 rounded transition cursor-pointer",fe===t.id?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:t.label},t.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Insignia Superior (Badge)"}),e.jsx("input",{type:"text",value:oa,onChange:t=>Ga(t.target.value),className:"w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Color de Acento"}),e.jsx("div",{className:"flex items-center gap-2",children:["#14b8a6","#10b981","#6366f1","#f59e0b","#f43f5e"].map(t=>e.jsx("button",{type:"button",onClick:()=>Ja(t),style:{backgroundColor:t},className:h("w-6 h-6 rounded-full border-2 transition cursor-pointer",da===t?"border-white ring-2 ring-teal-500 scale-110":"border-transparent opacity-80")},t))})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Titular Principal en Pantalla"}),e.jsx("input",{type:"text",value:tt,onChange:t=>qa(t.target.value),className:"w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary font-bold"})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("input",{type:"text",value:la,onChange:t=>Ya(t.target.value),placeholder:"Subtítulo secundario...",className:"flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary"}),e.jsx(v,{icon:e.jsx(js,{}),label:"Aplicar al Lienzo",variant:"cyan",onClick:()=>ze(C,!!O)})]})]}),e.jsxs("div",{className:"p-4 bg-purple-500/5 border border-purple-500/25 rounded-2xl space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx(ks,{className:"w-4 h-4 text-purple-500"}),"Generador IA de Animación HTML + GSAP (Estilo Claude)"]}),e.jsxs("button",{type:"button",onClick:()=>Za(!jt),className:"text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer",children:[e.jsx(Ns,{className:"w-3.5 h-3.5"}),jt?"Ocultar Código HTML":"Editar Código HTML"]})]}),e.jsx("textarea",{rows:2,value:ca,onChange:t=>Xa(t.target.value),placeholder:"Describe qué gráficos animados, tarjetas, alertas o diagramas quieres que la IA programe en HTML + GSAP...",className:"w-full bg-white dark:bg-zinc-900 border border-purple-500/30 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-purple-500 resize-none"}),e.jsx("div",{className:"flex justify-end",children:e.jsxs("button",{type:"button",onClick:ds,disabled:at,className:"flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50 cursor-pointer",children:[at?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(xe,{className:"w-4 h-4"}),e.jsx("span",{children:at?"Diseñando Escena HTML + GSAP...":"Generar Animación HTML con IA"})]})}),jt&&e.jsxs("div",{className:"pt-2",children:[e.jsx("label",{className:"block text-[10px] font-mono uppercase text-text-secondary mb-1",children:"Código Fuente HTML5 / Tailwind / GSAP en Vivo:"}),e.jsx("textarea",{rows:10,value:Te,onChange:t=>Ee(t.target.value),className:"w-full bg-slate-950 text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500"})]})]})]}),e.jsxs("div",{className:"lg:col-span-6 space-y-4 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-nowrap",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[e.jsx("span",{className:h("w-2.5 h-2.5 rounded-full shrink-0",R?"bg-amber-500 animate-ping":te?"bg-emerald-500 animate-pulse":"bg-slate-400")}),e.jsx("h3",{className:"text-sm font-extrabold text-text-primary truncate",children:R?`Editor Visual (${C})`:`Lienzo Interactivo (${C})`})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(v,{size:"sm",icon:Zt?e.jsx(W,{className:"animate-spin"}):e.jsx(Be,{}),label:"Sincronizar Voz IA",variant:"purple",disabled:Zt,onClick:ls}),e.jsx(v,{size:"sm",icon:e.jsx(ot,{}),label:R?"Salir de Edición":"Editar Lienzo",variant:"orange",isActive:R,onClick:ya}),e.jsx(v,{size:"sm",icon:Re?e.jsx(W,{className:"animate-spin"}):e.jsx(Ne,{}),label:"Descargar MP4 (WhatsApp/Celular)",variant:"teal",disabled:Re,onClick:va}),e.jsx(v,{size:"sm",icon:rt?e.jsx(W,{className:"animate-spin"}):e.jsx(Me,{}),label:"Cápsula Academia (HTML5)",variant:"green",disabled:rt,onClick:ka}),e.jsx(v,{size:"sm",icon:e.jsx(Ss,{}),label:"Guardar en Biblioteca",variant:"teal",onClick:()=>Mt({},!1)}),e.jsx(v,{size:"sm",icon:e.jsx(Ts,{}),label:"Pantalla Completa",variant:"neutral",onClick:wa})]})]}),R&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5",children:[e.jsx(Es,{className:"w-3.5 h-3.5 text-amber-500 shrink-0"}),"Arrastra cualquier caja o título con el mouse para moverlo • Doble clic para escribir"]}),e.jsxs("button",{type:"button",onClick:us,className:"px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx(dt,{className:"w-3 h-3"}),"Guardar Cambios"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=N.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"text"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(Ca,{className:"w-3 h-3 text-teal-500"}),e.jsx(Cs,{className:"w-3 h-3 text-teal-500"}),e.jsx("span",{children:"+ Texto"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=N.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"card"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(Ca,{className:"w-3 h-3 text-purple-500"}),e.jsx(Dt,{className:"w-3 h-3 text-purple-500"}),e.jsx("span",{children:"+ Caja / Tarjeta"})]}),e.jsx("button",{type:"button",onClick:()=>{var t,a;return(a=(t=N.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_SELECT_PARENT"},"*")},disabled:!_,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 disabled:opacity-40 cursor-pointer",children:"Seleccionar Caja Contenedora"}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=N.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DUPLICATE_SELECTED"},"*")},disabled:!_,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx($t,{className:"w-3 h-3 text-indigo-500"}),e.jsx("span",{children:"Duplicar"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=N.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DELETE_SELECTED"},"*")},disabled:!_,className:"px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(Pe,{className:"w-3 h-3"}),e.jsx("span",{children:"Eliminar"})]})]})]}),e.jsx("div",{className:"flex justify-center items-center bg-slate-950 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-inner overflow-hidden min-h-[460px]",children:e.jsxs("div",{ref:xa,className:h("relative overflow-hidden bg-slate-950 shadow-2xl border border-white/10 transition-all duration-300",kt?"w-screen h-screen rounded-none border-0 flex flex-col items-center justify-between p-4 sm:p-6":h("rounded-2xl mx-auto flex items-center justify-center",C==="9:16"?"w-full max-w-[390px] aspect-[9/16] max-h-[660px]":"w-full aspect-[16/9] max-h-[660px] min-h-[340px]")),children:[e.jsxs("div",{className:h("relative overflow-hidden bg-slate-950",kt?C==="9:16"?"h-[calc(100vh-100px)] aspect-[9/16] max-w-[95vw] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-[min(94vw,calc((100vh-100px)*1.7778))] aspect-[16/9] max-h-[calc(100vh-100px)] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-full h-full"),children:[Y&&e.jsx("audio",{ref:q,src:Y,preload:"metadata",onTimeUpdate:t=>{re(t.currentTarget.currentTime)},onLoadedMetadata:t=>{t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&Ie(t.currentTarget.duration)},onEnded:()=>{var t,a,s;we(!1),(a=(t=N.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_PAUSE"},"*"),(s=G.current)==null||s.pause()}}),O&&e.jsx("video",{ref:G,src:O,width:C==="9:16"?1080:1920,height:C==="9:16"?1920:1080,muted:et,playsInline:!0,loop:!0,preload:"metadata",onTimeUpdate:t=>{Y||re(t.currentTarget.currentTime)},onLoadedMetadata:t=>{!Y&&t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&Ie(t.currentTarget.duration)},className:"absolute inset-0 w-full h-full object-cover z-0"}),e.jsx("iframe",{ref:N,title:"WAPPY Studio HTML Canvas",srcDoc:es,sandbox:"allow-scripts allow-same-origin",onLoad:()=>{var t,a,s,r,o,n;(a=(t=N.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*"),R?(r=(s=N.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!0},"*"):te||(n=(o=N.current)==null?void 0:o.contentWindow)==null||n.postMessage({type:"STUDIO_PAUSE"},"*")},className:h("absolute inset-0 w-full h-full border-0 z-10",R?"pointer-events-auto":"pointer-events-none")}),X&&At&&e.jsx("div",{className:h("absolute inset-x-3 z-20 flex justify-center pointer-events-none",fe==="top"?"top-16":fe==="center"?"top-1/2 -translate-y-1/2":"bottom-5"),children:e.jsx("div",{className:"bg-black/85 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]",children:e.jsx("div",{className:"flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1",children:At.words.map((t,a)=>{const s=a===At.activeOffset;return e.jsx("span",{className:h("text-sm sm:text-base font-black uppercase tracking-wide transition-all duration-150",s?"text-amber-300 scale-110 bg-teal-500/30 px-1.5 py-0.5 rounded-lg border border-teal-400/50":"text-white/90"),children:t},`${t}-${a}`)})})})})]}),kt&&e.jsxs("div",{className:"w-full max-w-3xl mx-auto mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 flex items-center gap-3 z-30 shadow-2xl",children:[e.jsx("button",{type:"button",onClick:ha,title:te?"Pausar / Parar":"Reproducir",className:"px-3.5 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:te?e.jsxs(e.Fragment,{children:[e.jsx(ct,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(ie,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:zt,title:"Reiniciar animación",className:"p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer shrink-0",children:e.jsx(za,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:I||20,step:.1,value:ve,onChange:t=>fa(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-200 shrink-0",children:[ve.toFixed(1),"s / ",(I||20).toFixed(1),"s"]}),e.jsxs("button",{type:"button",onClick:ya,className:h("px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0",R?"bg-amber-500/20 border-amber-400 text-amber-300":"bg-slate-800 border-slate-700 text-slate-200 hover:text-white"),children:[e.jsx(ot,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:R?"Editando":"Editar"})]}),e.jsxs("button",{type:"button",onClick:wa,className:"px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0",children:[e.jsx(zs,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Salir"})]})]})]})}),e.jsxs("div",{className:"p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2.5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{type:"button",onClick:ha,title:te?"Pausar animación y subtítulos":"Reproducir animación y subtítulos",className:"px-3 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:te?e.jsxs(e.Fragment,{children:[e.jsx(ct,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(ie,{className:"w-4 h-4 fill-white ml-0.5"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:zt,title:"Reiniciar animación",className:"p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-secondary hover:text-text-primary transition cursor-pointer shrink-0",children:e.jsx(za,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:I||20,step:.1,value:ve,onChange:t=>fa(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-text-secondary shrink-0",children:[ve.toFixed(1),"s / ",(I||20).toFixed(1),"s"]}),O&&e.jsx("button",{type:"button",onClick:()=>Ka(!et),title:et?"Activar audio del video original":"Silenciar video original",className:"p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-secondary hover:text-text-primary transition cursor-pointer",children:et?e.jsx(As,{className:"w-4 h-4 text-rose-500"}):e.jsx(La,{className:"w-4 h-4 text-teal-500"})})]}),e.jsxs("div",{className:"pt-2 border-t border-slate-200/80 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",disabled:Re,onClick:va,className:"p-3 rounded-xl border bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20 text-teal-800 dark:text-teal-200 text-left transition-all cursor-pointer disabled:opacity-50 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20",children:"WhatsApp • Celular • Redes"}),Re?e.jsx(W,{className:"w-4 h-4 animate-spin shrink-0"}):e.jsx(Ne,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight mt-0.5",children:Re?"Renderizando Video MP4...":"Descargar Video .MP4 (Todo Unido)"}),e.jsx("div",{className:"text-[10px] opacity-85 leading-snug",children:"Une Animación + Subtítulos + Voz IA en un archivo .MP4 listo para enviar por WhatsApp o subir a Reels"})]}),e.jsxs("div",{className:"p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20",children:"Academia WAPPY • LMS Responsive"}),e.jsx(Vt,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight",children:"Cápsula Interactiva HTML5 (Móvil & Web)"}),e.jsxs("div",{className:"flex items-center gap-1.5 mt-0.5",children:[e.jsxs("button",{type:"button",disabled:rt,onClick:ka,className:"flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx(Me,{className:"w-3 h-3"}),e.jsx("span",{children:"Descargar .HTML"})]}),e.jsxs("button",{type:"button",disabled:rt,onClick:bs,title:"Copiar código <iframe srcdoc> para lección de Academia WAPPY",className:"py-1.5 px-2.5 rounded-lg bg-white/80 dark:bg-zinc-800 hover:bg-white text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx($t,{className:"w-3 h-3"}),e.jsx("span",{children:"Copiar LMS"})]})]})]})]})]}),R&&_&&e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/90 rounded-2xl border border-teal-500/40 space-y-3 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5",children:[e.jsx(ot,{className:"w-3.5 h-3.5"}),"Propiedades del Elemento Seleccionado (<",_.tagName,">)"]}),e.jsx("button",{type:"button",onClick:()=>ce({dx:0,dy:0,scale:1}),className:"text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer",children:"Restablecer posición"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Texto del elemento (edita aquí o con doble clic en el video):"}),e.jsx("textarea",{rows:2,value:_.text,onChange:t=>ce({text:t.target.value}),className:"w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:["Tamaño Letra (",_.fontSize,"px)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>ce({fontSize:Math.max(10,_.fontSize-2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"A-"}),e.jsx("button",{type:"button",onClick:()=>ce({fontSize:Math.min(96,_.fontSize+2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"A+"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:["Escala Caja (",_.scale,"x)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>ce({scale:Math.max(.5,Number((_.scale-.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"-"}),e.jsx("button",{type:"button",onClick:()=>ce({scale:Math.min(2.5,Number((_.scale+.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"+"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:"Color de Texto"}),e.jsx("input",{type:"color",value:_.color,onChange:t=>ce({color:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-zinc-700"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:"Color de Fondo"}),e.jsx("input",{type:"color",value:_.backgroundColor,onChange:t=>ce({backgroundColor:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-zinc-700"})]})]})]})]})]}),w==="lab"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4 shadow-xs",children:[e.jsx("div",{className:"w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0",children:e.jsx(xe,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-base font-extrabold text-text-primary",children:"Laboratorio de Expresividad y Vocal Bursts"}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Explora las capacidades de Gemini TTS: respiraciones orgánicas, risas, susurros y dirección de estilo en tiempo real"})]})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-secondary",children:"Modelo en el Laboratorio:"}),e.jsx("div",{className:"flex flex-wrap items-center gap-2",children:me.map(t=>{const a=y===t.id;return e.jsxs("button",{type:"button",onClick:()=>{ee(t.id),t.supportedVoices.includes(m)||be(t.supportedVoices[0]||"Kore")},className:h("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-zinc-900 text-text-secondary border-slate-200 dark:border-zinc-800 hover:border-teal-400"),children:[t.name," (",t.supportedVoices.length," voces)"]},t.id)})})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsx("h3",{className:"text-sm font-extrabold text-text-primary",children:"Efectos Vocales Orgánicos Integrados"}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:Ke.map(t=>{const a=Ia===t.tag;return e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400",children:t.tag}),e.jsx("p",{className:"text-xs font-bold text-text-primary mt-0.5",children:t.label}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:t.description})]}),e.jsx("button",{type:"button",disabled:a,onClick:async()=>{try{Ht(t.tag);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(d),body:JSON.stringify({voiceName:m,model:"gemini-3.8-flash-tts",stylePrompt:"Voz muy expresiva y natural.",text:`Escucha cómo suena este efecto natural en medio de una frase: ${t.tag} ¡Suena totalmente humano!`})}),r=await ne(s);r.audioBase64&&V({base64:r.audioBase64,title:`Efecto ${t.tag} (${m})`,durationSeconds:r.durationSeconds,voiceName:m})}catch(s){b({type:"error",text:s.message})}finally{Ht(null)}},className:"w-9 h-9 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 transition cursor-pointer",children:a?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(ie,{className:"w-4 h-4 fill-current"})})]},t.tag)})})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("h3",{className:"text-sm font-extrabold text-text-primary",children:"Probador Libre de Prosodia y Dirección de Voz"}),e.jsxs("span",{className:"text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",children:["Voces activas: ",Ae," de ",F.length]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary",children:["Selecciona la Voz (",Ae," activas para ",z==null?void 0:z.name,")"]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:F.map(t=>{const a=m===t.id,s=$e(t.id);return e.jsxs("button",{type:"button",onClick:()=>{s||ee("gemini-3.8-flash-tts"),be(t.id)},className:h("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-zinc-900 text-text-primary border-slate-200 dark:border-zinc-800 hover:border-teal-400",!s&&"opacity-55"),children:[e.jsxs("span",{children:[t.name," (",t.gender,")"]}),s&&e.jsx(dt,{className:"w-3 h-3 text-emerald-400"})]},t.id)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1.5",children:"Prompt de Dirección (speechMetadata.style)"}),e.jsx("input",{type:"text",value:bt,onChange:t=>Va(t.target.value),className:"w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-teal-500"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1.5",children:"Texto de Prueba"}),e.jsx("textarea",{rows:3,value:se,onChange:t=>Oa(t.target.value),className:"w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs text-text-primary focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsx("div",{children:e.jsxs("button",{type:"button",onClick:is,disabled:Ft||!se.trim(),className:"inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[Ft?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(xe,{className:"w-4 h-4"}),e.jsx("span",{children:"Sintetizar en el Laboratorio"})]})})]})]}),w==="library"&&e.jsxs("div",{className:"space-y-5 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-text-primary flex items-center gap-2",children:[e.jsx(Vt,{className:"w-5 h-5 text-indigo-500"}),"Biblioteca de Audios y Videos"]}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Tus locuciones y videos (HTML + voz) quedan guardados permanentemente en este navegador para reproducir, reabrir, editar o descargar."})]}),de.length>0&&e.jsx(v,{icon:e.jsx(Pe,{}),label:"Limpiar Historial",variant:"danger",onClick:()=>{window.confirm("¿Borrar todos los audios y videos guardados?")&&(Se([]),Bs())}})]}),de.length===0?e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-2",children:[e.jsx(Be,{className:"w-10 h-10 mx-auto text-slate-400"}),e.jsx("p",{className:"text-sm font-bold text-text-primary",children:"Aún no hay audios en tu biblioteca"}),e.jsx("p",{className:"text-xs text-text-secondary max-w-md mx-auto",children:'Genera una locución en la pestaña "Estudio de Voz (TTS)" o en "Voces & Bursts" y aparecerá aquí automáticamente.'})]}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:de.map(t=>e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("h4",{className:"text-sm font-extrabold text-text-primary line-clamp-1",children:t.title}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[t.kind==="video"&&e.jsxs("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30",children:["🎬 VIDEO ",t.aspectRatio||""]}),e.jsx("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30",children:t.voiceName})]})]}),e.jsxs("div",{className:"flex items-center gap-2.5 text-xs text-text-secondary",children:[e.jsxs("span",{children:["⏱ ",qs(t.durationSeconds)]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[t.wordCount," palabras"]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:Ys(t.createdAt)})]}),t.stylePrompt&&e.jsxs("div",{className:"p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800 text-[11px] italic text-text-secondary line-clamp-2",children:['"',t.stylePrompt,'"']})]}),e.jsxs("div",{className:"flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-zinc-800",children:[e.jsx("div",{className:"flex items-center gap-1.5",children:t.kind==="video"?e.jsx(v,{size:"sm",icon:e.jsx(ot,{}),label:"Abrir en Compositor",variant:"orange",onClick:()=>ms(t)}):e.jsxs(e.Fragment,{children:[e.jsx(v,{size:"sm",icon:e.jsx(ie,{}),label:"Reproducir",variant:"teal",onClick:()=>ga(t)}),e.jsx(v,{size:"sm",icon:e.jsx(Ne,{}),label:"Usar en Video",variant:"purple",onClick:()=>ga(t,!0)})]})}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[t.kind==="video"&&t.mp4Key&&e.jsx(v,{size:"sm",icon:e.jsx(Ne,{}),label:"Descargar MP4",variant:"green",onClick:async()=>{const a=await _e(t.mp4Key);a&&Tt(a,`wappy-studio-reel-${t.id}.mp4`)}}),t.kind==="video"&&t.capsuleKey&&e.jsx(v,{size:"sm",icon:e.jsx(Me,{}),label:"Descargar Cápsula HTML",variant:"green",onClick:async()=>{const a=await _e(t.capsuleKey);a&&Tt(a,`wappy-academia-capsula-${t.id}.html`)}}),t.kind!=="video"&&e.jsx(v,{size:"sm",icon:e.jsx(Me,{}),label:"Descargar WAV",variant:"green",onClick:async()=>{const a=await ba(t);if(!a){b({type:"error",text:"Este audio ya no está disponible (se generó antes del guardado permanente). Vuelve a generarlo."});return}Tt(a,`wappy-audio-${t.id}.wav`)}}),e.jsx(v,{size:"sm",icon:e.jsx(Pe,{}),label:"Eliminar",variant:"danger",onClick:()=>ts(t)})]})]})]},t.id))})]})]})]})}function Js({audioBase64:l,audioUrl:d,title:f,durationSeconds:x,voiceName:M,onSendToVideo:E}){const g=i.useRef(null),[j,J]=i.useState(!1),[K,w]=i.useState(0),[B,D]=i.useState(x||0),[He,me]=i.useState(1),[Le,F]=i.useState(!1),oe=d||(l?`data:audio/wav;base64,${l}`:"");i.useEffect(()=>{J(!1),w(0),x&&x>0&&D(x)},[oe,x]);const xt=()=>{!g.current||!oe||(j?g.current.pause():g.current.play().catch(T=>console.error("Error al reproducir audio:",T)))},We=T=>{if(!T||isNaN(T)||T<0)return"00:00";const y=Math.floor(T),ee=Math.floor(y/60),m=y%60;return`${ee.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`},Ke=()=>{if(!oe)return;const T=document.createElement("a");T.href=oe,T.download=`${f.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"wappy-tts"}.wav`,document.body.appendChild(T),T.click(),document.body.removeChild(T)};return oe?e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-teal-500/30 rounded-2xl p-4 sm:p-5 shadow-md space-y-3",children:[e.jsx("audio",{ref:g,src:oe,preload:"metadata",onPlay:()=>J(!0),onPause:()=>J(!1),onEnded:()=>J(!1),onTimeUpdate:()=>{g.current&&w(g.current.currentTime)},onLoadedMetadata:()=>{var T;(T=g.current)!=null&&T.duration&&!isNaN(g.current.duration)&&D(g.current.duration)}}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3 min-w-0",children:[e.jsx("button",{type:"button",onClick:xt,className:"w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white flex items-center justify-center shadow-md transition active:scale-95 shrink-0 cursor-pointer",children:j?e.jsx(ct,{className:"w-5 h-5 fill-white"}):e.jsx(ie,{className:"w-5 h-5 fill-white ml-0.5"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"}),e.jsx("h3",{className:"text-sm font-extrabold text-text-primary truncate",children:f})]}),e.jsxs("p",{className:"text-xs text-teal-600 dark:text-teal-400 font-semibold",children:["Voz: ",M||"Kore"," • WAV 24kHz Alta Fidelidad (",We(K)," /"," ",We(B),")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{const T=[.75,1,1.25,1.5,2],y=T[(T.indexOf(He)+1)%T.length];me(y),g.current&&(g.current.playbackRate=y)},className:"px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-teal-700 dark:text-teal-300 cursor-pointer",children:[He,"x"]}),e.jsx(v,{size:"sm",icon:e.jsx(Ne,{}),label:"Llevar al Video",variant:"purple",onClick:E}),l&&e.jsx(v,{size:"sm",icon:Le?e.jsx(dt,{}):e.jsx($t,{}),label:Le?"Copiado":"Copiar Base64",variant:"fuchsia",onClick:()=>{navigator.clipboard.writeText(l),F(!0),setTimeout(()=>F(!1),2e3)}}),e.jsx(v,{size:"sm",icon:e.jsx(Me,{}),label:"Descargar WAV",variant:"green",onClick:Ke})]})]}),e.jsx("div",{className:"flex items-center justify-between gap-1 h-10 bg-slate-50 dark:bg-zinc-950 rounded-xl px-3 py-1.5 border border-slate-200/80 dark:border-zinc-800 overflow-hidden",children:Array.from({length:44}).map((T,y)=>{const ee=B>0?K/B:0,m=y/44,be=m<=ee,ae=22+Math.sin(y*.45)*16+Math.cos(y*.9)*12;return e.jsx("div",{onClick:()=>{if(g.current&&B>0){const De=m*B;g.current.currentTime=De,w(De)}},style:{height:`${Math.max(18,Math.min(95,ae))}%`},className:h("w-1 rounded-full cursor-pointer transition-all duration-150",be?"bg-gradient-to-t from-teal-500 to-emerald-400":"bg-slate-300 dark:bg-zinc-800 hover:bg-teal-400/50")},y)})})]}):null}function Xs({job:l,onPause:d,onResume:f,onCancel:x,onPlayChunk:M,onLoadMaster:E}){const g=l.status==="completed",j=l.status==="failed",J=l.status==="processing",K=l.status==="paused";return e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-teal-500/40 rounded-2xl p-5 shadow-md space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center",children:J?e.jsx(W,{className:"w-5 h-5 animate-spin"}):g?e.jsx(Pa,{className:"w-5 h-5 text-emerald-500"}):e.jsx(xe,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-extrabold text-text-primary",children:g?"¡Audio Maestro de Larga Duración Completado!":j?"Error en la Generación":K?"Generación en Pausa":`Sintetizando fragmento ${l.currentChunkIndex+1} de ${l.totalChunks}...`}),e.jsxs("p",{className:"text-xs text-text-secondary",children:["Generados ",Math.round(l.generatedTotalSeconds),"s de ~",l.estimatedTotalSeconds,"s estimados (",l.progressPercent,"%)"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[J&&e.jsx(v,{size:"sm",icon:e.jsx(ct,{}),label:"Pausar",variant:"amber",onClick:d}),K&&e.jsx(v,{size:"sm",icon:e.jsx(ie,{}),label:"Reanudar",variant:"teal",onClick:f}),!g&&!j&&e.jsx(v,{size:"sm",icon:e.jsx(Ma,{}),label:"Cancelar",variant:"danger",onClick:x}),g&&e.jsxs(e.Fragment,{children:[e.jsx(v,{size:"sm",icon:e.jsx(ie,{}),label:"Cargar Master",variant:"teal",onClick:E}),e.jsxs("a",{href:l.downloadUrl||`/api/studio/tts/jobs/${l.id}/download`,download:!0,className:"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 text-xs font-bold hover:bg-green-500/20 transition",children:[e.jsx(Me,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Descargar WAV Master"})]})]})]})]}),e.jsx("div",{className:"w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,l.progressPercent))}%`}})}),e.jsx("div",{className:"grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 gap-1.5 p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/80 dark:border-zinc-800 max-h-32 overflow-y-auto",children:l.chunks.map(w=>{const B=w.status==="completed",D=w.status==="processing";return e.jsx("button",{type:"button",disabled:!B,onClick:()=>M(w),title:`Fragmento #${w.index+1}`,className:h("h-7 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center border transition",B?"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer":D?"bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/40 animate-pulse":"bg-slate-200/50 dark:bg-zinc-900 text-text-secondary border-transparent opacity-60"),children:B?e.jsx(La,{className:"w-3 h-3"}):D?e.jsx(W,{className:"w-3 h-3 animate-spin"}):w.index+1},w.index)})})]})}export{zr as default};
