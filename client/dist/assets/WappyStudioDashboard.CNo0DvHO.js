import{cN as Ps,r as i,j as e,is as Ia,bp as me,iw as _e,fO as Se,bF as Ut,cP as Bt,db as Oa,bq as W,cO as Va,bw as Ms,bD as Wt,cc as Ra,bl as ut,el as Ls,bu as pt,a$ as Ds,bN as Is,dT as le,gn as Os,bB as ke,bC as $a,bx as Vs,i0 as Rs,gV as $s,b5 as dt,bX as Le,cu as Ua,fn as Us,cx as Bs,c4 as Ba,h2 as _s,bv as Kt,ef as xt,fk as _a,fl as Fs,ix as Hs,io as Ha}from"./vendor.DYW0wM5n.js";import{u as Ws}from"./routing.Cj3VmeMA.js";import{u as Ks,ah as Gs,a as qs,c as v,aK as y}from"./ambassadors-module.BdOOx-3b.js";import"./utilities.BjsdvwEO.js";import{O as Ys}from"./blog-modules.gF-aexV3.js";import"./react-interactions.D7-JPAG8.js";import{M as Js}from"./sgsst-modules.BIAgm-gt.js";import"./markdown_highlight.BXMLVVdG.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./tanstack-vendor.DYIZ-52P.js";import"./http-client.Bmq-NEq6.js";import"./heic-converter.BhQCFQ0l.js";import"./forms.DEMc3D7c.js";import"./radix-ui.CGYgq8tg.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.DD_sfwPT.js";import"./animations.DklOPy0I.js";import"./virtualization.CpBvUi5N.js";import"./headlessui.Ul8AWG4Z.js";import"./framer-motion.WNZz7wmC.js";import"./i18n.CDA4tK8r.js";import"./date-utils.X8D4nCrw.js";import"./sgsst-assets.KdMSUpxn.js";import"./security-ui.xKNm28sF.js";import"./kanban-module.ZF217Ns_.js";import"./plans-module.8RkbBtb3.js";import"./lms-modules.Cf71UzDO.js";import"./markdown-processing.BgA4K7JW.js";import"./events-modules.BmMxraCq.js";const Xs="wappy-studio-media",Zs=1,mt="blobs";let Fe=null;function Qs(){return Fe||(Fe=new Promise((l,d)=>{if(typeof indexedDB>"u"){d(new Error("IndexedDB no disponible en este navegador."));return}const m=indexedDB.open(Xs,Zs);m.onupgradeneeded=()=>{const p=m.result;p.objectStoreNames.contains(mt)||p.createObjectStore(mt)},m.onsuccess=()=>l(m.result),m.onerror=()=>{Fe=null,d(m.error)}}),Fe)}function bt(l,d){return Qs().then(m=>new Promise((p,M)=>{const E=m.transaction(mt,l),f=d(E.objectStore(mt));f.onsuccess=()=>p(f.result),f.onerror=()=>M(f.error)}))}async function Ne(l,d){await bt("readwrite",m=>m.put(d,l))}async function He(l){try{return await bt("readonly",m=>m.get(l))??null}catch{return null}}async function er(l){try{await bt("readwrite",d=>d.delete(l))}catch{}}async function tr(){try{await bt("readwrite",l=>l.clear())}catch{}}function ct(l,d="audio/wav"){const m=l.replace(/^data:[^;]+;base64,/,""),p=window.atob(m),M=new Uint8Array(p.length);for(let E=0;E<p.length;E++)M[E]=p.charCodeAt(E);return new Blob([M],{type:d})}var ar={};const _t={"gemini-3.8-flash-tts":{id:"gemini-3.8-flash-tts",name:"Gemini 3.8 Flash TTS",badge:"Recomendado / Cuota Activa",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"✓ Activo (14 voces)",description:"Máxima fluidez natural, diseño de voz, vocal bursts (<breath>, <laugh>) y soporte para las 14 voces.",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-3.1-flash-tts-preview":{id:"gemini-3.1-flash-tts-preview",name:"Gemini 3.1 Flash TTS Preview",badge:"Preview 3.1 / Cuota Activa",badgeColor:"bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:"Arquitectura Gemini 3.1 con prosodia refinada, tono expresivo y respuesta ágil (14 voces).",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-2.5-flash-preview-tts":{id:"gemini-2.5-flash-preview-tts",name:"Gemini 2.5 Flash TTS",badge:"Reemplazo de 2.5 Pro",badgeColor:"bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",rateLimitLabel:"3 RPM • 10 RPD (2.5 Pro: 0/0)",quotaLabel:"5 voces",description:"Reemplazo oficial y funcional de 2.5 Pro (no disponible en API). Activa únicamente las 5 voces fundamentales.",supportsMultiSpeaker:!0,supportsVocalBursts:!1,supportedVoices:["Kore","Puck","Charon","Fenrir","Aoede"]},"gemini-3.8-flash-lite-tts":{id:"gemini-3.8-flash-lite-tts",name:"Gemini 3.8 Flash-Lite TTS",badge:"Ultra Rápido",badgeColor:"bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",rateLimitLabel:"Baja Latencia",quotaLabel:"6 voces",description:"Optimizado para lecturas masivas con mínima latencia continua (6 voces rápidas).",supportsMultiSpeaker:!1,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Aoede"]}},sr=[{id:"Kore",name:"Kore",gender:"Femenino",tone:"Cálida, Serena y Profesional",recommendedFor:"Audiolibros, Narración, Tutoriales, Inducción SST",tag:"Más popular"},{id:"Puck",name:"Puck",gender:"Masculino",tone:"Enérgico, Dinámico y Joven",recommendedFor:"Podcasts, Reels, Contenido Creativo, Diálogos",tag:"Muy expresivo"},{id:"Charon",name:"Charon",gender:"Masculino",tone:"Barítono, Grave, Maduro y Solemne",recommendedFor:"Documentales, Historia, Suspenso, Directivos",tag:"Voz profunda"},{id:"Fenrir",name:"Fenrir",gender:"Masculino",tone:"Claro, Elocuente y Periodístico",recommendedFor:"Noticias, Informes, Presentaciones, Boletines",tag:"Profesional"},{id:"Zephyr",name:"Zephyr",gender:"Femenino",tone:"Dulce, Aterciopelada y Relajante",recommendedFor:"Meditación, ASMR, Cuentos, Bienestar",tag:"Calma"},{id:"Orus",name:"Orus",gender:"Masculino",tone:"Firme, Imperial, Épico y Reflexivo",recommendedFor:"Ficción Épica, Liderazgo, Ensayos, Cultura Vial",tag:"Imperial"},{id:"Aoede",name:"Aoede",gender:"Femenino",tone:"Melódica, Expresiva, Artística y Cálida",recommendedFor:"Poesía, Literatura, Storytelling, Sensibilización",tag:"Melódica"},{id:"Leda",name:"Leda",gender:"Femenino",tone:"Cercana, Maternal, Madura y Envolvente",recommendedFor:"Audiolibros Largos, Relatos, Bienvenida",tag:"Narradora"},{id:"Callisto",name:"Callisto",gender:"Femenino",tone:"Elegante, Sofisticada y Articulada",recommendedFor:"Divulgación Científica, Conferencias, Auditorías",tag:"Sofisticada"},{id:"Europa",name:"Europa",gender:"Femenino",tone:"Brillante, Luminosa, Alegre y Asertiva",recommendedFor:"Marketing, Anuncios, E-Learning, Campañas",tag:"Enérgica"},{id:"Ganymede",name:"Ganymede",gender:"Masculino",tone:"Resonante, Equilibrado, Sabio y Seguro",recommendedFor:"Educación Superior, Cursos, Capacitación Técnica",tag:"Resonante"},{id:"Io",name:"Io",gender:"Femenino",tone:"Vivaz, Espontánea, Fresca y Amigable",recommendedFor:"Redes Sociales, Vlogs, Asistentes, Reels",tag:"Fresca"},{id:"Titan",name:"Titan",gender:"Masculino",tone:"Imponente, Cinematográfico y Potente",recommendedFor:"Tráilers, Introducciones, Impacto, Alertas",tag:"Cinematográfica"},{id:"Prometheus",name:"Prometheus",gender:"Masculino",tone:"Noble, Pensativo, Filosófico y Clásico",recommendedFor:"Filosofía, Análisis Profundo, Crónicas",tag:"Sabio"}],rr=[{id:"orus-solemn",name:"Narración Solemne (Orus)",voiceName:"Orus",style:"Voz firme, templada, reflexiva y madura de narrador de crónica histórica, dicción solemne, pausas medidas y respiraciones naturales.",speed:"0.95x"},{id:"aoede-poetic",name:"Cuento Poético (Aoede)",voiceName:"Aoede",style:"Voz melódica, cálida, expresiva y artística para relato literario y sensibilización, con matices emocionales suaves.",speed:"0.95x"},{id:"titan-trailer",name:"Tráiler Cinematográfico (Titan)",voiceName:"Titan",style:"Voz imponente, profunda, cinematográfica y épica de tráiler de película, con pausas dramáticas e impacto.",speed:"0.95x"},{id:"kore-audiobook",name:"Narrador de Audiolibro (Kore)",voiceName:"Kore",style:"Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.",speed:"1.0x"},{id:"puck-podcast",name:"Host de Podcast Dinámico (Puck)",voiceName:"Puck",style:"Host de podcast carismático, enérgico, cercano y espontáneo, con entonación conversacional moderna.",speed:"1.05x"},{id:"charon-documentary",name:"Documental Profundo (Charon)",voiceName:"Charon",style:"Tono barítono, solemne, reflexivo y cinematográfico de narrador de documental, con pausas medidas.",speed:"0.95x"},{id:"fenrir-news",name:"Noticiero Profesional (Fenrir)",voiceName:"Fenrir",style:"Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.",speed:"1.05x"},{id:"zephyr-asmr",name:"Meditación y ASMR (Zephyr)",voiceName:"Zephyr",style:"Voz suave, serena, dulce y sumamente relajante para meditación guiada, mindfulness y bienestar.",speed:"0.9x"},{id:"screenplay-dialogue",name:"Guion / Diálogo Alex & Sam",voiceName:"Kore",multiSpeaker:!0,speaker1:{name:"Alex",voiceName:"Puck",style:"Entusiasta y curioso"},speaker2:{name:"Sam",voiceName:"Kore",style:"Experta, clara y cercana"},style:"Diálogo interactivo de podcast entre dos especialistas con alternancia natural.",speed:"1.0x"}],nr=[{tag:"<breath>",label:"Respiración natural",description:"Inserta una toma de aire orgánica entre frases"},{tag:"<laugh>",label:"Risa / Carcajada",description:"Añade una risa espontánea o carcajada suave"},{tag:"<gasp>",label:"Sorpresa / Jadear",description:"Efecto de inhalación rápida de asombro"},{tag:"|mhm|",label:"Asentimiento (|mhm|)",description:"Confirmación conversacional natural"},{tag:"|yeah|",label:"Aceptación (|yeah|)",description:"Interjección de acuerdo en diálogos"}],Ft=[{title:"Inducción SST: 5 Reglas de Oro en Riesgo Eléctrico",text:`¡Atención equipo! Antes de intervenir cualquier tablero o red eléctrica, recuerda que tu vida depende de las Cinco Reglas de Oro. <breath>

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

Tu bienestar mental y físico es la base de un entorno laboral saludable y seguro.`}],ir=[{id:"golden-rules",name:"⚡ Reglas de Oro Glass",badge:"Estilo Claude",description:"Tarjeta hero con barra de progreso e indicadores clave en cristal."},{id:"kpi-hud",name:"📊 Dashboard KPIs & HUD",badge:"Ejecutivo",description:"Métricas ejecutivas animadas con barras comparativas y telemetría."},{id:"alert-sst",name:"🚨 Alerta & Checklist 1-2-3",badge:"Prevención",description:"Pasos numerados de seguridad con entrada secuencial elástica."},{id:"camera-overlay",name:"🎬 Lower-Third (Video Propio)",badge:"Transparente",description:"Capas limpias en tercio superior e inferior para dejar libre tu rostro."}];function Fa({aspectRatio:l="9:16",hasBaseVideo:d=!1,badgeText:m="CÁPSULA INTERACTIVA WAPPY",headline:p="5 Reglas de Oro en Seguridad",subheadline:M="Prevención inteligente en tiempo real con WAPPY Studio",accentColor:E="#14b8a6",templateId:f="golden-rules"}){const j=l==="9:16",Z=m.replace(/</g,"&lt;"),O=p.replace(/</g,"&lt;"),w=M.replace(/</g,"&lt;"),L=d||f==="camera-overlay";let V="";return f==="kpi-hud"?V=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${j?"p-5":"p-4"} border-t-2" style="border-top-color: ${E};">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-mono uppercase tracking-wider text-teal-400">📊 TELEMETRÍA PREVENTIVA</span>
          <span class="text-[11px] font-mono font-bold text-emerald-400">▲ +98.4% EFECTIVIDAD</span>
        </div>
        <h1 class="${j?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight text-white">
          ${O}
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
      </div>`:f==="alert-sst"?V=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${j?"p-5":"p-4"} border-l-4" style="border-left-color: #f59e0b;">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
          ⚠️ PROTOCOLO OBLIGATORIO EN PLANTA
        </div>
        <h1 class="${j?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight text-white">
          ${O}
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
      </div>`:f==="camera-overlay"?V=`
      <div class="my-auto"></div>
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-2xl p-4 border-l-4" style="border-left-color: ${E};">
        <div class="text-[10px] font-mono uppercase tracking-widest text-teal-300 font-extrabold">${Z}</div>
        <h1 class="text-lg sm:text-xl font-black text-white leading-snug mt-0.5">${O}</h1>
        <p class="text-xs text-slate-300 mt-0.5">${w}</p>
      </div>`:V=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${j?"p-5 sm:p-6":"p-4 sm:p-5"} border-l-4" style="border-left-color: ${E};">
        <div class="text-xs font-mono uppercase tracking-wider text-teal-400 mb-1">⚡ PUNTO CLAVE EN VIVO</div>
        <h1 class="${j?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight tracking-tight text-white">
          ${O}
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
      background: ${L?"transparent":"#060d14"};
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
  ${L?"<!-- Fondo transparente para dejar ver el video base del usuario -->":`<div class="absolute inset-0 overflow-hidden pointer-events-none">
           <div class="absolute inset-0 grid-bg"></div>
           <div id="orb-1" class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-35" style="background: ${E};"></div>
           <div id="orb-2" class="absolute bottom-8 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25" style="background: #6366f1;"></div>
         </div>`}

  <!-- TOP HUD BAR (100% centrado con ancho completo de contenedor) -->
  <div id="top-bar" data-editable="true" class="relative z-10 w-full ${j?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-between gap-2 shrink-0">
    <div class="glass-card px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 whitespace-nowrap">
      <span class="w-2.5 h-2.5 rounded-full animate-ping shrink-0" style="background: ${E};"></span>
      <span class="text-[11px] font-extrabold tracking-widest uppercase text-teal-300">${Z}</span>
    </div>
    <div class="glass-card px-3 py-1.5 rounded-full text-[11px] font-mono font-bold text-slate-300 whitespace-nowrap shrink-0">
      WAPPY STUDIO • IA
    </div>
  </div>

  <!-- ESCENA CENTRAL: TARJETAS ANIMADAS (100% centrado matemáticamente con max-w y mx-auto) -->
  <div class="relative z-10 my-auto w-full ${j?"max-w-md":"max-w-2xl"} mx-auto flex flex-col gap-3 sm:gap-3.5 items-stretch">
    ${V}
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
</html>`}function or(l){if(!l)return"";if(l.includes('id="wappy-studio-runtime-bridge"'))return l;const d=`<script id="wappy-studio-gsap-hook">
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
<\/script>`,m=`<style id="wappy-studio-bridge-styles">
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
<\/script>`;let p=l;return p.includes("<head>")?p=p.replace("<head>",`<head>
${d}`):p=`${d}
${p}`,p.includes("</body>")?p=p.replace("</body>",`${m}
</body>`):p=`${p}
${m}`,p}const Ht="wappy_studio_audio_library",Gt="wappy_gemini_api_keys";function Wa(){try{const l=localStorage.getItem(Gt);if(!l)return[];const d=JSON.parse(l);return Array.isArray(d)?d.map((m,p)=>typeof m=="string"?{key:m.trim(),label:`Clave #${p+1}`,status:"unchecked"}:m&&typeof m.key=="string"?{key:m.key.trim(),label:m.label||`Clave #${p+1}`,status:m.status||"unchecked"}:null).filter(m=>!!(m&&m.key)):[]}catch{return[]}}function I(l){const d=l||localStorage.getItem("token")||"",m=Wa().map(p=>p.key.trim()).filter(p=>p.length>15).join(",");return{"Content-Type":"application/json",...d?{Authorization:`Bearer ${d}`}:{},...m?{"x-gemini-api-keys":m}:{}}}async function oe(l){const d=await l.text();try{return JSON.parse(d)}catch{throw l.status===401||d.trim()==="Unauthorized"?new Error("Tu sesión está actualizándose. Intenta nuevamente en un segundo."):new Error(d.slice(0,180)||`Error del servidor (${l.status})`)}}function lr(l){const d=Math.max(1,Math.round(l||0)),m=Math.floor(d/60),p=d%60;return`${m}m ${p}s`}function dr(l){try{return new Date(l).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return""}}function Fr(){var Da;const{user:l,token:d,isAuthenticated:m}=Ks(),{data:p}=Gs(),M=Ps(),E=(M==null?void 0:M.navVisible)??!0,f=(M==null?void 0:M.setNavVisible)??(()=>{}),[j,Z]=Ws(),O=j.get("tab")||"tts",[w,L]=i.useState(["tts","video","lab","library"].includes(O)?O:"tts"),[V,We]=i.useState(()=>{var t,a;return((a=(t=l==null?void 0:l.personalization)==null?void 0:t.geminiModels)==null?void 0:a.sstManagement)||(ar.GOOGLE_MODELS||"gemini-3.6-flash").split(",")[0].trim()}),[be,De]=i.useState(()=>Object.values(_t)),[K,Q]=i.useState(()=>sr),[gt,Te]=i.useState(()=>rr),[Ke,T]=i.useState(()=>nr),[g,q]=i.useState("gemini-3.8-flash-tts"),[b,se]=i.useState("Kore"),[R,Ie]=i.useState("Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido."),[ge,ht]=i.useState(!1),[Ge,qt]=i.useState("Puck"),[qe,Yt]=i.useState("Kore"),[he,Ka]=i.useState(150),[k,Oe]=i.useState(Ft[0].text),[ft,Ga]=i.useState("Voz expresiva, tono conversacional y alegre."),[ne,qa]=i.useState("Hola. Hoy quiero demostrarte cómo suena una respiración natural <breath> y cómo reacciono con una pequeña risa <laugh> cuando algo resulta verdaderamente sorprendente."),[Jt,Xt]=i.useState(!1),[Ya,Zt]=i.useState(null),[Qt,Ja]=i.useState(0),[Xa,Za]=i.useState(0),[yt,Ye]=i.useState(.5),[vt,Je]=i.useState(1),[wt,ea]=i.useState(!1),[ta,aa]=i.useState(!1),[Qa,sa]=i.useState(null),[D,de]=i.useState(null),Ve=i.useRef(null),[Xe,es]=i.useState("all"),[Ze,ra]=i.useState("only_active"),[jt,ts]=i.useState(""),[kt,as]=i.useState(!1),[c,$]=i.useState(null),[ce,Ee]=i.useState(()=>{try{const t=localStorage.getItem(Ht);return t?JSON.parse(t):[]}catch{return[]}}),[C,Nt]=i.useState("9:16"),[Qe,ss]=i.useState("golden-rules"),[fe,na]=i.useState("bottom"),[ia,oa]=i.useState(!1),[U,la]=i.useState(null),[da,ca]=i.useState(""),[et,rs]=i.useState(!1),[ye,ua]=i.useState(null),[pa,xa]=i.useState(""),[ee,ma]=i.useState(!0),[ba,ns]=i.useState("CÁPSULA INTERACTIVA WAPPY"),[tt,is]=i.useState("5 Reglas de Oro en Riesgo Eléctrico"),[ga,os]=i.useState("Prevención inteligente y locución neural sincronizada"),[ha,ls]=i.useState("#14b8a6"),[fa,ds]=i.useState("Crea una animación estilo Claude con tarjetas de cristal sobre las 5 reglas de oro de riesgo eléctrico, iconos luminosos y barras de progreso."),[at,ya]=i.useState(!1),[St,cs]=i.useState(!1),[Ce,ze]=i.useState(()=>Fa({aspectRatio:"9:16",hasBaseVideo:!1,badgeText:"CÁPSULA INTERACTIVA WAPPY",headline:"5 Reglas de Oro en Riesgo Eléctrico",subheadline:"Prevención inteligente y locución neural sincronizada",accentColor:"#14b8a6",templateId:"golden-rules"})),[re,ve]=i.useState(!0),[we,ie]=i.useState(0),[B,Re]=i.useState(20),[Tt,us]=i.useState(!1),[_,st]=i.useState(!1),[G,Et]=i.useState(null),te=i.useRef(""),[$e,va]=i.useState(!1),[rt,nt]=i.useState(!1),[Ae,h]=i.useState(null),[ps,Ct]=i.useState(!1),[it,zt]=i.useState(()=>{const t=Wa();return[t[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},t[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},t[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}]}),[At,wa]=i.useState(!1),[ja,ot]=i.useState(""),xs=i.useMemo(()=>it.filter(t=>t.key.trim().length>15).length,[it]),ms=async()=>{wa(!0),ot("");try{const t=[...it];let a=0;for(let s=0;s<t.length;s++){const o=t[s].key.trim();if(!o){t[s]={...t[s],key:"",status:"unchecked"};continue}try{const n=await fetch("/api/studio/keys-validate",{method:"POST",headers:I(d),body:JSON.stringify({apiKey:o})}),u=await n.json().catch(()=>({}));n.ok&&u.valid?(t[s]={...t[s],key:o,status:"valid"},a++):t[s]={...t[s],key:o,status:"invalid"}}catch{t[s]={...t[s],key:o,status:"unchecked"}}}zt(t);const r=t.filter(s=>s.key.trim().length>0);localStorage.setItem(Gt,JSON.stringify(r)),ot(r.length===0?"Claves personalizadas limpiadas. Se utilizarán las claves del servidor WAPPY.":`¡Guardadas ${r.length} clave(s) (${a} verificada(s) en vivo con Google Gemini)!`)}finally{wa(!1)}},N=i.useRef(null),Y=i.useRef(null),J=i.useRef(null),ka=i.useRef(null),bs=i.useMemo(()=>or(Ce),[Ce]);i.useEffect(()=>{const t=()=>{const a=!!document.fullscreenElement;us(a),setTimeout(()=>{var r,s;(s=(r=N.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},80),setTimeout(()=>{var r,s;(s=(r=N.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},300)};return document.addEventListener("fullscreenchange",t),()=>document.removeEventListener("fullscreenchange",t)},[]),i.useEffect(()=>{const t=a=>{const r=a.data||{};r.type==="STUDIO_ELEMENT_SELECTED"?Et(r.payload||null):r.type==="STUDIO_HTML_UPDATED"&&typeof r.htmlCode=="string"&&(te.current=r.htmlCode)};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[]),i.useEffect(()=>{const t=ce.slice(0,60);try{localStorage.setItem(Ht,JSON.stringify(t))}catch{try{localStorage.setItem(Ht,JSON.stringify(t.map(({audioBase64:a,...r})=>r)))}catch{}}},[ce]),i.useEffect(()=>{const t=ce.filter(a=>a.audioBase64&&!a.mediaKey);t.length!==0&&(async()=>{const a={};for(const r of t)try{const s=`audio-${r.id}`;await Ne(s,ct(r.audioBase64)),a[r.id]=s}catch{}Object.keys(a).length!==0&&Ee(r=>r.map(s=>a[s.id]?{...s,mediaKey:a[s.id],audioBase64:void 0}:s))})()},[]);const Pt=i.useRef(null),Na=t=>{Pt.current&&URL.revokeObjectURL(Pt.current);const a=URL.createObjectURL(t);return Pt.current=a,a},lt=async(t,a)=>{const r=`audio-${t.id}`;let s=null;try{if(a.base64)s=ct(a.base64);else if(a.url){const n=await fetch(a.url,{headers:I(d)});n.ok&&(s=await n.blob())}s&&await Ne(r,s)}catch{s=null}const o=s?{...t,kind:t.kind||"audio",mediaKey:r,audioBase64:void 0}:{...t,kind:t.kind||"audio",audioBase64:a.base64};return Ee(n=>[o,...n.filter(u=>u.id!==t.id)]),s?r:void 0},Sa=async t=>{if(t.mediaKey){const a=await He(t.mediaKey);if(a)return a}if(t.audioBase64)return ct(t.audioBase64);if(t.downloadUrl)try{const a=await fetch(t.downloadUrl,{headers:I(d)});if(a.ok){const r=await a.blob(),s=`audio-${t.id}`;return Ne(s,r).then(()=>Ee(o=>o.map(n=>n.id===t.id?{...n,mediaKey:s}:n))).catch(()=>{}),r}}catch{}return null},Ta=async(t,a=!1)=>{const r=await Sa(t);return r?($({url:Na(r),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey||`audio-${t.id}`}),t.durationSeconds&&t.durationSeconds>1&&Re(t.durationSeconds),a&&je("video"),!0):(h({type:"error",text:"Este audio se generó antes de activar el guardado permanente y el servidor ya lo liberó (se reinició). Vuelve a generarlo: desde ahora todos los audios quedan guardados en tu navegador."}),!1)},Mt=(t,a)=>{const r=URL.createObjectURL(t),s=document.createElement("a");s.href=r,s.download=a,document.body.appendChild(s),s.click(),document.body.removeChild(s),setTimeout(()=>URL.revokeObjectURL(r),4e3)},gs=t=>{Ee(a=>{const r=a.filter(o=>o.id!==t.id);return[t.mediaKey,t.htmlKey,t.mp4Key,t.capsuleKey].filter(Boolean).forEach(o=>{r.some(u=>[u.mediaKey,u.htmlKey,u.mp4Key,u.capsuleKey].includes(o))||er(o)}),r})};i.useEffect(()=>{var a;const t=(a=p==null?void 0:p[qs.google])==null?void 0:a.models;if(Array.isArray(t)&&t.length>0){const r=t.map(s=>(typeof s=="string"?s:(s==null?void 0:s.id)||(s==null?void 0:s.value)||"").replace("models/","").trim()).filter(s=>s&&s.includes("tts"));r.length>0&&De(s=>{const o=new Map(s.map(n=>[n.id,n]));return r.map(n=>_t[n]||o.get(n)||{id:n,name:n,badge:"GOOGLE_MODELS",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:`Modelo TTS cargado desde GOOGLE_MODELS (${n}).`,supportsMultiSpeaker:!n.includes("lite"),supportsVocalBursts:!n.includes("2.5"),supportedVoices:_t["gemini-3.8-flash-tts"].supportedVoices})})}},[p]),i.useEffect(()=>{fetch("/api/studio/catalog",{headers:I(d)}).then(t=>t.ok?t.json():null).then(t=>{t&&(Array.isArray(t.models)&&t.models.length>0&&De(t.models),Array.isArray(t.voices)&&t.voices.length>0&&Q(t.voices),Array.isArray(t.presets)&&t.presets.length>0&&Te(t.presets),Array.isArray(t.vocalBursts)&&t.vocalBursts.length>0&&T(t.vocalBursts))}).catch(()=>{})},[d]),i.useEffect(()=>{const t=k.trim(),a=t?t.split(/\s+/).filter(Boolean).length:0;if(Ja(a),Za(t.length),!t){Ye(0),Je(0);return}const r=setTimeout(()=>{fetch("/api/studio/tts/estimate",{method:"POST",headers:I(d),body:JSON.stringify({text:t,maxWordsPerChunk:he})}).then(s=>s.ok?s.json():null).then(s=>{s&&typeof s.estimatedMinutes=="number"?Ye(s.estimatedMinutes):Ye(Math.round(a/145*10)/10),s&&typeof s.chunkCount=="number"?Je(s.chunkCount):Je(Math.max(1,Math.ceil(a/he)))}).catch(()=>{Ye(Math.round(a/145*10)/10),Je(Math.max(1,Math.ceil(a/he)))})},250);return()=>clearTimeout(r)},[k,he,d]);const je=t=>{L(t),Z({tab:t})},z=i.useMemo(()=>be.find(t=>t.id===g)||be[0],[be,g]),Ue=t=>z!=null&&z.supportedVoices?z.supportedVoices.includes(t):!0,hs=i.useMemo(()=>K.filter(t=>{const a=Ue(t.id),r=Ze==="all"||a,s=Xe==="all"||t.gender===Xe,o=jt.trim().toLowerCase(),n=!o||t.name.toLowerCase().includes(o)||t.tone.toLowerCase().includes(o)||t.recommendedFor.toLowerCase().includes(o)||t.tag&&t.tag.toLowerCase().includes(o);return r&&s&&n}),[K,z,Ze,Xe,jt]),fs=async(t,a)=>{a==null||a.stopPropagation();try{sa(t);const r=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:I(d),body:JSON.stringify({voiceName:t,model:Ue(t)?g:"gemini-3.8-flash-tts",text:`Hola, soy ${t}. Esta es una muestra de voz neural en WAPPY Studio para tus cápsulas y cursos.`})}),s=await oe(r);if(!r.ok||!s.success)throw new Error(s.error||"No se pudo sintetizar la muestra.");$({base64:s.audioBase64,title:`Muestra de Voz: ${t}`,durationSeconds:s.durationSeconds,voiceName:t})}catch(r){h({type:"error",text:r.message||"Error en audición de voz."})}finally{sa(null)}},ys=async()=>{try{aa(!0),h(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:I(d),body:JSON.stringify({voiceName:b,model:g,text:"¡Conexión verificada con éxito! El motor de voz Gemini 3.8 Flash TTS en WAPPY Studio está listo."})}),a=await oe(t);if(!t.ok||!a.success)throw new Error(a.error||"Error probando conexión.");$({base64:a.audioBase64,title:`Prueba de Conexión (${b})`,durationSeconds:a.durationSeconds,voiceName:b}),h({type:"success",text:`¡Conexión activa con ${a.usedModel||g}! Audio sintetizado correctamente.`})}catch(t){h({type:"error",text:t.message||"Error de conexión con Gemini TTS."})}finally{aa(!1)}},vs=async()=>{if(k.trim())try{ea(!0),h(null);const t=k.trim().slice(0,750),a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:I(d),body:JSON.stringify({text:t,voiceName:b,stylePrompt:R,model:g,multiSpeaker:ge,speaker1:{name:"Alex",voiceName:Ge},speaker2:{name:"Sam",voiceName:qe}})}),r=await oe(a);if(!a.ok||!r.success)throw new Error(r.error||"Error al sintetizar vista previa.");$({base64:r.audioBase64,title:`Vista Previa: ${t.slice(0,38)}...`,durationSeconds:r.durationSeconds,voiceName:b,scriptText:t});const s={id:Date.now().toString(),title:`Vista Previa: ${t.slice(0,42)}...`,createdAt:Date.now(),voiceName:b,model:r.usedModel||g,durationSeconds:r.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,stylePrompt:R,scriptText:t},o=await lt(s,{base64:r.audioBase64});o&&$(n=>n&&{...n,mediaKey:o}),h({type:"success",text:"Audio generado y cargado en el reproductor. Puedes descargarlo en WAV o enviarlo al Compositor de Video."})}catch(t){h({type:"error",text:t.message||"Error sintetizando fragmento."})}finally{ea(!1)}},ws=async()=>{if(ne.trim())try{Xt(!0),h(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:I(d),body:JSON.stringify({text:ne.trim(),voiceName:b,stylePrompt:ft,model:g})}),a=await oe(t);if(!t.ok||!a.success)throw new Error(a.error||"Error al sintetizar en el laboratorio.");$({base64:a.audioBase64,title:`Laboratorio (${b}): ${ne.trim().slice(0,34)}...`,durationSeconds:a.durationSeconds,voiceName:b,scriptText:ne.trim()});const r={id:Date.now().toString(),title:`Laboratorio: ${ne.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:b,model:a.usedModel||g,durationSeconds:a.durationSeconds,wordCount:ne.trim().split(/\s+/).filter(Boolean).length,stylePrompt:ft,scriptText:ne.trim()},s=await lt(r,{base64:a.audioBase64});s&&$(o=>o&&{...o,mediaKey:s})}catch(t){h({type:"error",text:t.message||"Error sintetizando prueba en el laboratorio."})}finally{Xt(!1)}},js=async()=>{if(k.trim())try{h(null),Ve.current&&Ve.current.close();const t=await fetch("/api/studio/tts/jobs",{method:"POST",headers:I(d),body:JSON.stringify({text:k,voiceName:b,stylePrompt:R,model:g,multiSpeaker:ge,speaker1:{name:"Alex",voiceName:Ge},speaker2:{name:"Sam",voiceName:qe},maxWordsPerChunk:he})}),a=await oe(t);if(!t.ok)throw new Error(a.error||"No se pudo iniciar el trabajo de larga duración.");const r={id:a.jobId,status:"processing",totalChunks:a.totalChunks,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:a.estimatedTotalSeconds,generatedTotalSeconds:0,progressPercent:0,chunks:Array.from({length:a.totalChunks},(o,n)=>({index:n,wordCount:0,status:"pending"}))};de(r);const s=new EventSource(`/api/studio/tts/jobs/${a.jobId}/stream${d?`?token=${encodeURIComponent(d)}`:""}`);Ve.current=s,s.addEventListener("snapshot",o=>{const n=JSON.parse(o.data);de(u=>u?{...u,...n}:n)}),s.addEventListener("chunk_start",o=>{const n=JSON.parse(o.data);de(u=>{if(!u)return null;const x=[...u.chunks];return x[n.chunkIndex]&&(x[n.chunkIndex]={...x[n.chunkIndex],status:"processing"}),{...u,currentChunkIndex:n.chunkIndex,chunks:x}})}),s.addEventListener("chunk_complete",o=>{const n=JSON.parse(o.data);de(u=>{if(!u)return null;const x=[...u.chunks];x[n.chunkIndex]&&(x[n.chunkIndex]={...x[n.chunkIndex],status:"completed",durationSeconds:n.durationSeconds,audioBase64:n.audioBase64});const S=x.filter(F=>F.status==="completed").length;return{...u,completedChunks:S,progressPercent:n.progressPercent,generatedTotalSeconds:n.generatedTotalSeconds,chunks:x}})}),s.addEventListener("job_completed",o=>{const n=JSON.parse(o.data);s.close(),de(x=>x?{...x,status:"completed",progressPercent:100,downloadUrl:n.downloadUrl}:null),$({url:n.downloadUrl,title:`Audio Completo: ${k.trim().slice(0,35)}...`,durationSeconds:n.totalDurationSeconds,voiceName:b,scriptText:k});const u={id:n.id,title:`Audio Completo: ${k.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:b,model:g,durationSeconds:n.totalDurationSeconds,wordCount:Qt,downloadUrl:n.downloadUrl,stylePrompt:R,scriptText:k};lt(u,{url:n.downloadUrl}).then(x=>{x&&$(S=>S&&{...S,mediaKey:x})})}),s.addEventListener("job_failed",o=>{const n=JSON.parse(o.data);s.close(),de(u=>u?{...u,status:"failed",error:n.error}:null)}),s.addEventListener("job_status",o=>{const n=JSON.parse(o.data);de(u=>u?{...u,status:n.status}:null)})}catch(t){h({type:"error",text:t.message||"Error iniciando trabajo."})}},Lt=async t=>{D&&(t==="cancel"&&Ve.current&&Ve.current.close(),await fetch(`/api/studio/tts/jobs/${D.id}/control`,{method:"POST",headers:I(d),body:JSON.stringify({action:t})}),de(a=>a?{...a,status:t==="pause"?"paused":t==="resume"?"processing":"cancelled"}:null))},Dt=t=>{const a=document.getElementById("wappy-studio-tts-editor");if(!a){Oe(n=>`${n} ${t}`);return}const r=a.selectionStart,s=a.selectionEnd,o=k.substring(0,r)+t+k.substring(s);Oe(o),setTimeout(()=>{a.focus(),a.setSelectionRange(r+t.length,r+t.length)},15)},Pe=(t=C,a=!!U,r=Qe)=>{ze(Fa({aspectRatio:t,hasBaseVideo:a,badgeText:ba,headline:tt,subheadline:ga,accentColor:ha,templateId:r}))},ks=async()=>{const t=(k||tt||"").trim().slice(0,750);if(t)try{oa(!0),h(null);const a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:I(d),body:JSON.stringify({text:t,voiceName:b,stylePrompt:R,model:g,multiSpeaker:ge,speaker1:{name:"Alex",voiceName:Ge},speaker2:{name:"Sam",voiceName:qe}})}),r=await oe(a);if(!a.ok||!r.success)throw new Error(r.error||"No se pudo sintetizar la voz para el video.");$({base64:r.audioBase64,title:`Locución de Video (${b})`,durationSeconds:r.durationSeconds,voiceName:b,scriptText:t}),lt({id:`vo-${Date.now()}`,title:`Locución de Video: ${t.slice(0,40)}...`,createdAt:Date.now(),voiceName:b,model:r.usedModel||g,durationSeconds:r.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,stylePrompt:R,scriptText:t},{base64:r.audioBase64}).then(s=>{s&&$(o=>o&&{...o,mediaKey:s})}),r.durationSeconds&&r.durationSeconds>1&&Re(r.durationSeconds),ie(0),ve(!0),setTimeout(()=>{var s,o,n,u;(o=(s=N.current)==null?void 0:s.contentWindow)==null||o.postMessage({type:"STUDIO_RESTART"},"*"),(n=J.current)==null||n.play().catch(()=>{}),(u=Y.current)==null||u.play().catch(()=>{})},120),h({type:"success",text:`¡Locución neural (${b}) sincronizada automáticamente con el lienzo de video!`})}catch(a){h({type:"error",text:a.message||"Error sincronizando voz con el video."})}finally{oa(!1)}},Ns=async()=>{try{ya(!0),h(null);const t=await fetch("/api/studio/video/generate-html",{method:"POST",headers:I(d),body:JSON.stringify({prompt:fa,scriptText:k,aspectRatio:C,hasBaseVideo:!!U,showSubtitles:ee,durationSeconds:Math.round((c==null?void 0:c.durationSeconds)||B||25),companyName:(l==null?void 0:l.name)||"WAPPY IA",modelName:V})}),a=await oe(t);if(!t.ok||!a.success)throw new Error(a.error||"Error generando composición HTML con IA.");ze(a.htmlCode),h({type:"success",text:"¡Escena HTML + GSAP generada con éxito! Reproduciendo en el lienzo interactivo."})}catch(t){h({type:"error",text:t.message||"No se pudo generar la escena HTML con IA."})}finally{ya(!1)}},Ss=t=>{var s;const a=(s=t.target.files)==null?void 0:s[0];if(!a)return;U&&URL.revokeObjectURL(U);const r=URL.createObjectURL(a);la(r),ca(a.name),Pe(C,!0)},Ts=t=>{var s;const a=(s=t.target.files)==null?void 0:s[0];if(!a)return;ye&&URL.revokeObjectURL(ye);const r=URL.createObjectURL(a);ua(r),xa(a.name)},X=i.useMemo(()=>ye||(c!=null&&c.url?c.url:c!=null&&c.base64?`data:audio/wav;base64,${c.base64}`:""),[ye,c]);i.useEffect(()=>{if(w!=="video"||!re||_)return;let t=performance.now();const a=setInterval(()=>{const r=performance.now(),s=(r-t)/1e3;t=r;const o=J.current,n=Y.current;if(o&&X&&!o.paused&&!o.ended){ie(o.currentTime);return}if(n&&U&&!n.paused&&!n.ended){ie(n.currentTime);return}ie(u=>{var F,A;const x=Math.max(1,B||20),S=u+s;return S>=x?(ve(!1),(A=(F=N.current)==null?void 0:F.contentWindow)==null||A.postMessage({type:"STUDIO_PAUSE"},"*"),x):S})},250);return()=>clearInterval(a)},[w,re,_,B,X,U]);const Ea=()=>{var s,o,n,u,x;const t=Math.max(1,B||20);if(!re&&(we>=t-.3||!!((s=J.current)!=null&&s.ended))){It();return}const r=!re;r&&_&&(st(!1),(n=(o=N.current)==null?void 0:o.contentWindow)==null||n.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),ve(r),(x=(u=N.current)==null?void 0:u.contentWindow)==null||x.postMessage({type:r?"STUDIO_PLAY":"STUDIO_PAUSE"},"*"),Y.current&&(r?Y.current.play().catch(()=>{}):Y.current.pause()),J.current&&X&&(r?J.current.play().catch(()=>{}):J.current.pause())},It=()=>{var t,a,r,s;_&&(st(!1),(a=(t=N.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),ie(0),ve(!0),(s=(r=N.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_RESTART"},"*"),Y.current&&(Y.current.currentTime=0,Y.current.play().catch(()=>{})),J.current&&X&&(J.current.currentTime=0,J.current.play().catch(()=>{}))},Ca=t=>{var r,s;ie(t);const a=B>0?t/B:0;(s=(r=N.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_SEEK",progress:a,time:t},"*"),Y.current&&(Y.current.currentTime=t),J.current&&X&&(J.current.currentTime=t)},za=()=>{var a,r,s,o;const t=!_;st(t),t?(ve(!1),(a=Y.current)==null||a.pause(),(r=J.current)==null||r.pause()):te.current&&(ze(te.current),te.current=""),(o=(s=N.current)==null?void 0:s.contentWindow)==null||o.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:t},"*")},ue=t=>{var a,r;Et(s=>s&&{...s,...t}),(r=(a=N.current)==null?void 0:a.contentWindow)==null||r.postMessage({type:"STUDIO_UPDATE_SELECTED",updates:t},"*")},Es=()=>{var t,a;te.current&&(ze(te.current),te.current=""),st(!1),Et(null),(a=(t=N.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*"),h({type:"success",text:"¡Cambios de textos y posición de cajas guardados en la composición HTML!"})},Aa=()=>{var t,a,r;document.fullscreenElement?(t=document.exitFullscreen)==null||t.call(document).catch(()=>{}):(r=(a=ka.current)==null?void 0:a.requestFullscreen)==null||r.call(a).catch(()=>{})},pe=i.useMemo(()=>((c==null?void 0:c.scriptText)||k||"").replace(/<[^>]+>/g,"").replace(/\|[^|]+\|/g,"").replace(/^(Alex|Sam):\s*/gim,"").split(/\s+/).filter(Boolean),[c==null?void 0:c.scriptText,k]),Ot=i.useMemo(()=>{if(!ee||pe.length===0)return null;const t=Math.max(0,Math.min(.999,we/Math.max(1,B))),a=Math.floor(t*pe.length),r=5,s=Math.floor(a/r)*r;return{words:pe.slice(s,s+r),activeOffset:a-s}},[ee,pe,we,B]),Vt=async()=>{if(c!=null&&c.base64)return c.base64;if(!X)return null;try{const t=await fetch(X);if(!t.ok)return null;const a=await t.arrayBuffer(),r=new Uint8Array(a);let s="";const o=32768;for(let n=0;n<r.length;n+=o)s+=String.fromCharCode.apply(null,Array.from(r.subarray(n,n+o)));return window.btoa(s)}catch{return null}},Pa=async()=>{try{va(!0);const t=Math.min(60,Math.max(4,Math.round(B||15))),a=t>20?12:15;h({type:"info",text:`Renderizando Video MP4 con Audio + Animación + Subtítulos (${t}s)... Espera ~15-25 segundos mientras se ensambla el archivo .MP4 para WhatsApp y Celular.`});const r=te.current||Ce,s=await Vt(),o=await fetch("/api/studio/video/render-mp4",{method:"POST",headers:I(d),body:JSON.stringify({htmlCode:r,audioBase64:s,scriptText:(c==null?void 0:c.scriptText)||k,showSubtitles:ee,subtitlePosition:fe,aspectRatio:C,durationSeconds:t,fps:a})}),n=await oe(o);if(!o.ok||!n.success||!n.videoBase64)throw new Error(n.error||"No se pudo renderizar el archivo MP4 en el servidor.");const u=window.atob(n.videoBase64),x=new Array(u.length);for(let xe=0;xe<u.length;xe++)x[xe]=u.charCodeAt(xe);const S=new Uint8Array(x),F=new Blob([S],{type:"video/mp4"});Rt({mp4Blob:F});const A=URL.createObjectURL(F),H=document.createElement("a");H.href=A,H.download=`wappy-studio-reel-${Date.now()}.mp4`,document.body.appendChild(H),H.click(),document.body.removeChild(H),URL.revokeObjectURL(A),h({type:"success",text:`¡Video MP4 Universal (${n.width}x${n.height} • H.264 + Audio AAC) descargado con éxito! Listo para enviar por WhatsApp, ver en celular o subir a Reels/TikTok.`})}catch(t){h({type:"error",text:t.message||"Error renderizando MP4 en el servidor."})}finally{va(!1)}},Cs=async t=>{var F;let a=t;const r=A=>A.replace(/<\/script/gi,"<\\/script"),s=async A=>{try{const H=await fetch(A,{cache:"force-cache"});return H.ok?await H.text():""}catch{return""}};let o="";try{const A=(F=N.current)==null?void 0:F.contentDocument;A&&Array.from(A.querySelectorAll("style")).forEach(H=>{if((H.id||"").startsWith("wappy-studio-bridge"))return;const ae=H.textContent||"";ae&&!a.includes(ae.slice(0,120))&&(o+=`
${ae}`)})}catch{o=""}const[n,u]=await Promise.all([/gsap(\.min)?\.js/i.test(a)?s("/assets/gsap.min.js"):Promise.resolve(""),/cdn\.tailwindcss\.com|tailwind-cdn\.js/i.test(a)?s("/assets/tailwind-cdn.js"):Promise.resolve("")]);n&&(a=a.replace(/<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-gsap">${r(n)}<\/script>`)),a=a.replace(/<script[^>]*src=["'][^"']*(cdn\.tailwindcss\.com|tailwind-cdn\.js)[^"']*["'][^>]*>\s*<\/script>/gi,()=>"<script>window.tailwind = window.tailwind || {};<\/script>"+(u?`<script id="wappy-inline-tailwind">${r(u)}<\/script>`:""));const x=`
<meta name="color-scheme" content="dark" />
<meta name="format-detection" content="telephone=no" />
<style id="wappy-precompiled-tailwind">${o.replace(/<\/style/gi,"<\\/style")}</style>
<style id="wappy-offline-font-fallback">
  html, body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
</style>
<noscript><style>
  #header-hud, #top-bar, #scene-1, #scene-1 *, #hero-card, .metric-item { opacity: 1 !important; transform: none !important; visibility: visible !important; }
  #wappy-capsule-controls, #wappy-mobile-tap-overlay { display: none !important; }
</style></noscript>`;/<head[^>]*>/i.test(a)?a=a.replace(/<head[^>]*>/i,A=>`${A}${x}`):a=`${x}
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
${S}`,a},Ma=async()=>{const t=await Cs(te.current||Ce),a=await Vt(),r=a?`data:audio/wav;base64,${a}`:"",s=Math.max(4,Math.round((B||20)*10)/10),o=`
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
  ${ee&&pe.length>0?"#subtitle-footer, #subtitle-card { display: none !important; }":""}
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
${r?`<audio id="wappy-capsule-audio" src="${r}" preload="auto" playsinline></audio>`:""}
<div id="wappy-mobile-tap-overlay">
  <button type="button" id="wappy-mobile-tap-btn">🔊 Tocar para Reproducir Cápsula con Voz</button>
</div>
<div id="wappy-capsule-subtitles" style="display:${ee&&pe.length>0?"flex":"none"};">
  <div id="wappy-capsule-sub-box" style="background:rgba(4,10,18,0.9);backdrop-filter:blur(10px);border:1px solid rgba(45,212,191,0.35);padding:7px 13px;border-radius:13px;text-align:center;max-width:95%;display:flex;flex-wrap:wrap;justify-content:center;gap:5px;"></div>
</div>
<div id="wappy-capsule-controls">
  <button type="button" id="wappy-btn-play">⏸ Pausar</button>
  <button type="button" id="wappy-btn-restart" class="secondary" title="Reiniciar">↺</button>
  <input type="range" id="wappy-seek" min="0" max="${s}" step="0.1" value="0" />
  <span id="wappy-time-label" style="font-size:10px;font-family:monospace;font-weight:700;color:#cbd5e1;white-space:nowrap;">0.0s / ${s}s</span>
</div>
<script id="wappy-academy-capsule-runtime">
(function() {
  var words = ${JSON.stringify(pe)};
  var showSubs = ${!!(ee&&pe.length>0)};
  var duration = ${s};
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
${o}`},Be=i.useRef(null),Rt=async(t={},a=!0)=>{var r;try{const s=te.current||Ce,o=(c==null?void 0:c.mediaKey)||X||"sin-audio",n=`${s.length}:${s.slice(-200)}:${o}:${C}`,x=((r=Be.current)==null?void 0:r.signature)===n&&ce.some(ae=>{var P;return ae.id===((P=Be.current)==null?void 0:P.id)})?Be.current.id:`video-${Date.now()}`,S=`html-${x}`;await Ne(S,new Blob([s],{type:"text/html"}));let F=c==null?void 0:c.mediaKey;if(!F&&X){const ae=await Vt();ae&&(F=`audio-${x}`,await Ne(F,ct(ae)))}let A;t.mp4Blob&&(A=`mp4-${x}`,await Ne(A,t.mp4Blob));let H;t.capsuleHtml&&(H=`capsule-${x}`,await Ne(H,new Blob([t.capsuleHtml],{type:"text/html"})));const xe=((c==null?void 0:c.scriptText)||k||tt||"").replace(/<[^>]+>/g,"").trim();Ee(ae=>{const P=ae.find($t=>$t.id===x);return[{...P||{},id:x,kind:"video",title:(P==null?void 0:P.title)||`Video ${C}: ${xe.slice(0,40)}...`,createdAt:(P==null?void 0:P.createdAt)||Date.now(),voiceName:(c==null?void 0:c.voiceName)||b,model:V,durationSeconds:Math.round((B||0)*10)/10,wordCount:xe.split(/\s+/).filter(Boolean).length,scriptText:(c==null?void 0:c.scriptText)||k,htmlKey:S,mediaKey:F||(P==null?void 0:P.mediaKey),mp4Key:A||(P==null?void 0:P.mp4Key),capsuleKey:H||(P==null?void 0:P.capsuleKey),aspectRatio:C,showSubtitles:ee,subtitlePosition:fe},...ae.filter($t=>$t.id!==x)]}),Be.current={id:x,signature:n},a||h({type:"success",text:"¡Video guardado en la Biblioteca! Puedes reabrirlo, editarlo o descargarlo cuando quieras."})}catch(s){h({type:"error",text:`No se pudo guardar el video en la Biblioteca: ${(s==null?void 0:s.message)||"error de almacenamiento"}`})}},zs=async t=>{const a=t.htmlKey?await He(t.htmlKey):null;if(!a){h({type:"error",text:"No se encontró la composición HTML de este video."});return}const r=await a.text();t.aspectRatio&&Nt(t.aspectRatio),typeof t.showSubtitles=="boolean"&&ma(t.showSubtitles),t.subtitlePosition&&na(t.subtitlePosition),te.current="",ze(r);const s=t.mediaKey?await He(t.mediaKey):null;s&&$({url:Na(s),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey}),t.durationSeconds&&t.durationSeconds>1&&Re(t.durationSeconds),ie(0),ve(!1),Be.current=null,je("video")},La=async()=>{var t,a;try{nt(!0);const r=await Ma();Rt({capsuleHtml:r});const s=`wappy-academia-capsula-${Date.now()}.html`,o=new Blob([r],{type:"text/html;charset=utf-8"});if(typeof window<"u"&&((t=window.matchMedia)==null?void 0:t.call(window,"(pointer: coarse)").matches)&&typeof navigator.share=="function")try{const S=new File([o],s,{type:"text/html"});if((a=navigator.canShare)!=null&&a.call(navigator,{files:[S]})){await navigator.share({files:[S],title:"Cápsula WAPPY",text:"Cápsula interactiva WAPPY (ábrela tocando el archivo)."}),h({type:"success",text:"¡Cápsula HTML compartida! Funciona sin internet al tocarla en WhatsApp."});return}}catch(S){if((S==null?void 0:S.name)==="AbortError")return}const u=URL.createObjectURL(o),x=document.createElement("a");x.href=u,x.download=s,document.body.appendChild(x),x.click(),document.body.removeChild(x),URL.revokeObjectURL(u),h({type:"success",text:"¡Cápsula HTML autocontenida descargada! Incluye estilos, animación y voz en un solo archivo: envíala por WhatsApp y ábrela tocándola, incluso sin internet."})}finally{nt(!1)}},As=async()=>{try{nt(!0);const r=`<iframe srcdoc="${(await Ma()).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" style="width:100%;max-width:${C==="9:16"?"400px":"860px"};aspect-ratio:${C==="9:16"?"9/16":"16/9"};border:0;border-radius:16px;overflow:hidden;display:block;margin:0 auto;box-shadow:0 20px 50px rgba(0,0,0,0.35);" allow="autoplay; fullscreen"></iframe>`;await navigator.clipboard.writeText(r),h({type:"success",text:"¡Código <iframe srcdoc> copiado al portapapeles! Pégalo directamente en cualquier lección de la Academia WAPPY (LMS)."})}catch{h({type:"error",text:"No se pudo copiar el código embebido al portapapeles."})}finally{nt(!1)}},Me=((Da=z==null?void 0:z.supportedVoices)==null?void 0:Da.length)||14;return l&&l.role!=="ADMIN"?e.jsx("div",{className:"flex-1 flex items-center justify-center bg-surface-secondary/30 min-h-screen p-6",children:e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md",children:[e.jsx("div",{className:"w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto",children:e.jsx(Ia,{className:"w-6 h-6"})}),e.jsx("h2",{className:"text-lg font-extrabold text-text-primary",children:"WAPPY Studio (Acceso Administrador)"}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Por el momento este módulo está habilitado exclusivamente para cuentas de Administración de WAPPY."}),e.jsx("a",{href:"/c/new",className:"inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition",children:"Volver al inicio"})]})}):e.jsxs("div",{className:"flex-1 flex flex-col bg-surface-secondary/30 min-h-[100dvh] h-auto overflow-y-auto pb-16",children:[e.jsx("header",{className:"bg-white dark:bg-gray-900 border-b border-border-medium/40 px-4 sm:px-6 py-4 shadow-2xs sticky top-0 z-30",children:e.jsxs("div",{className:"max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[m&&!E&&e.jsx("div",{className:"hidden md:block",children:e.jsx(Ys,{setNavVisible:f})}),e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2 mb-1",children:e.jsxs("span",{className:"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wider",children:[e.jsx(me,{className:"w-3 h-3 text-teal-500"}),"Estudio Multimodal • Gemini 3.8 Flash TTS & HyperFrames"]})}),e.jsxs("h1",{className:"text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400",children:[e.jsx(Ia,{className:"w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0"}),"WAPPY Studio"]}),e.jsx("p",{className:"text-xs text-text-secondary mt-0.5 hidden sm:block",children:"Síntesis de voz neural de hasta 1 hora continua y creación de videos animados en HTML/GSAP con capas sobre tus propios videos."})]})]}),e.jsxs("div",{className:"flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-nowrap",children:[e.jsxs("div",{className:"inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-x-auto no-scrollbar min-w-0",children:[e.jsxs("button",{type:"button",onClick:()=>je("tts"),className:v("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",w==="tts"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(_e,{className:"w-3.5 h-3.5 text-teal-500"}),e.jsx("span",{children:"Estudio de Voz (TTS)"})]}),e.jsxs("button",{type:"button",onClick:()=>je("video"),className:v("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",w==="video"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Se,{className:"w-3.5 h-3.5 text-purple-500"}),e.jsx("span",{children:"Video HTML & Capas"})]}),e.jsxs("button",{type:"button",onClick:()=>je("lab"),className:v("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",w==="lab"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Ut,{className:"w-3.5 h-3.5 text-amber-500"}),e.jsx("span",{children:"Voces & Bursts"})]}),e.jsxs("button",{type:"button",onClick:()=>je("library"),className:v("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",w==="library"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Bt,{className:"w-3.5 h-3.5 text-indigo-500"}),e.jsxs("span",{children:["Biblioteca (",ce.length,")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(Js,{selectedModel:V,onSelectModel:We,disabled:at}),e.jsx(y,{icon:e.jsx(Oa,{}),label:`Claves IA (${xs})`,variant:"fuchsia",onClick:()=>{ot(""),Ct(!0)},title:"Configurar hasta 3 claves Google Gemini con rotación inteligente"}),e.jsx(y,{icon:ta?e.jsx(W,{className:"animate-spin"}):e.jsx(Va,{}),label:"Probar Audio con IA",variant:"purple",disabled:ta,onClick:ys}),e.jsx(y,{icon:e.jsx(Ms,{}),label:"Landing / App Portable",variant:"cyan",onClick:()=>window.open("/wappystudio.html","_blank","noopener,noreferrer"),title:"Abrir Landing Page Pública y Aplicativo Portable de WAPPY Studio"})]})]})]})}),e.jsxs("main",{className:"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6",children:[Ae&&e.jsxs("div",{className:v("p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200",Ae.type==="success"?"bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200":Ae.type==="error"?"bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200":"bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200"),children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[Ae.type==="success"?e.jsx(Wt,{className:"w-4 h-4 text-emerald-500 shrink-0"}):Ae.type==="error"?e.jsx(Ra,{className:"w-4 h-4 text-rose-500 shrink-0"}):e.jsx(W,{className:"w-4 h-4 text-sky-500 animate-spin shrink-0"}),e.jsx("span",{children:Ae.text})]}),e.jsx("button",{type:"button",onClick:()=>h(null),className:"p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10",children:e.jsx(ut,{className:"w-3.5 h-3.5"})})]}),c&&e.jsx(cr,{audioBase64:c.base64,audioUrl:c.url,title:c.title,durationSeconds:c.durationSeconds,voiceName:c.voiceName,onSendToVideo:()=>{je("video"),h({type:"success",text:"Audio vinculado automáticamente a la pista de locución del Compositor de Video."})}}),w==="tts"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[D&&e.jsx(ur,{job:D,onPause:()=>Lt("pause"),onResume:()=>Lt("resume"),onCancel:()=>Lt("cancel"),onPlayChunk:t=>{t.audioBase64&&$({base64:t.audioBase64,title:`Fragmento #${t.index+1} (${t.durationSeconds||0}s)`,durationSeconds:t.durationSeconds,voiceName:b})},onLoadMaster:()=>{D.downloadUrl&&$({url:D.downloadUrl,title:`Master Completo (${b})`,durationSeconds:D.generatedTotalSeconds,voiceName:b,scriptText:k})}}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",children:[e.jsxs("div",{className:"lg:col-span-5 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"space-y-2.5",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-1.5",children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(Ls,{className:"w-4 h-4 text-teal-500"}),"Modelo Oficial Gemini TTS"]}),e.jsx("span",{className:"text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full",children:"Verificado en AI Studio"})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:be.map(t=>{const a=g===t.id;return e.jsxs("button",{type:"button",onClick:()=>{q(t.id),t.supportedVoices.includes(b)||se(t.supportedVoices[0]||"Kore")},className:v("text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30 shadow-xs":"bg-slate-50/60 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-text-primary",children:t.name}),e.jsx("span",{className:v("text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0",t.badgeColor),children:t.badge})]}),e.jsx("p",{className:"text-[11px] text-text-secondary leading-snug",children:t.description})]}),e.jsxs("div",{className:"mt-2.5 pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-amber-600 dark:text-amber-400 font-bold",children:t.rateLimitLabel||t.quotaLabel}),a?e.jsxs("span",{className:"text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5",children:[e.jsx(pt,{className:"w-3 h-3"})," Activo (",t.supportedVoices.length," voces)"]}):e.jsxs("span",{className:"text-text-secondary",children:[t.supportedVoices.length," voces"]})]})]},t.id)})}),e.jsxs("div",{className:"px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"text-text-secondary flex items-center gap-1.5",children:[e.jsx(me,{className:"w-3.5 h-3.5 text-teal-500 shrink-0"}),e.jsxs("span",{children:["Voces activas para"," ",e.jsx("strong",{className:"text-text-primary",children:z==null?void 0:z.name}),":"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsxs("span",{className:"font-extrabold text-emerald-600 dark:text-emerald-400",children:[Me," de ",K.length," disponibles"]}),Me<K.length&&e.jsxs("button",{type:"button",onClick:()=>q("gemini-3.8-flash-tts"),className:"text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer",children:["Mostrar todas (",K.length,")"]})]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"block text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"Estilos y Plantillas Rápidas"}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:gt.map(t=>e.jsx("button",{type:"button",onClick:()=>{Ue(t.voiceName)||q("gemini-3.8-flash-tts"),t.multiSpeaker?(ht(!0),t.speaker1&&qt(t.speaker1.voiceName),t.speaker2&&Yt(t.speaker2.voiceName)):(ht(!1),se(t.voiceName)),Ie(t.style)},className:"text-xs px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80 hover:border-teal-500/50 hover:bg-teal-500/10 text-text-primary font-semibold transition cursor-pointer",children:t.name},t.id))})]}),e.jsxs("div",{className:"flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/90 rounded-xl border border-slate-200/80 dark:border-zinc-800 gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx(Ds,{className:"w-4 h-4 text-teal-500 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-text-primary",children:"Modo Diálogo / Podcast (2 Voces)"}),e.jsxs("p",{className:"text-[11px] text-text-secondary",children:["Alterna interlocutores usando"," ",e.jsx("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:"Alex:"})," ","y"," ",e.jsx("span",{className:"font-mono font-bold text-purple-600 dark:text-purple-400",children:"Sam:"})]})]})]}),e.jsx("button",{type:"button",onClick:()=>ht(!ge),className:v("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",ge?"bg-teal-600":"bg-slate-300 dark:bg-zinc-700"),children:e.jsx("span",{className:v("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",ge?"translate-x-4":"translate-x-0")})})]}),ge?e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200/80 dark:border-zinc-800",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-teal-600 dark:text-teal-400 mb-1",children:"Voz para Alex (Hablante 1)"}),e.jsx("select",{value:Ge,onChange:t=>qt(t.target.value),className:"w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500",children:((z==null?void 0:z.supportedVoices)||[]).map(t=>{const a=K.find(r=>r.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-purple-600 dark:text-purple-400 mb-1",children:"Voz para Sam (Hablante 2)"}),e.jsx("select",{value:qe,onChange:t=>Yt(t.target.value),className:"w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500",children:((z==null?void 0:z.supportedVoices)||[]).map(t=>{const a=K.find(r=>r.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(_e,{className:"w-3.5 h-3.5 text-teal-500"}),"Catálogo de Voces (",Me," activas / ",K.length," totales)"]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-0.5",children:"Las voces no compatibles con la versión seleccionada quedan desactivadas."})]}),e.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px]",children:[e.jsxs("button",{type:"button",onClick:()=>ra("only_active"),className:v("px-2 py-0.5 rounded-md transition cursor-pointer",Ze==="only_active"?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:["Solo Activas (",Me,")"]}),e.jsxs("button",{type:"button",onClick:()=>ra("all"),className:v("px-2 py-0.5 rounded-md transition cursor-pointer",Ze==="all"?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:["Todas (",K.length,")"]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(Is,{className:"w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"}),e.jsx("input",{type:"text",value:jt,onChange:t=>ts(t.target.value),placeholder:"Buscar voz (Kore, Orus, profunda, podcast...)",className:"w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-slate-400 focus:outline-none focus:border-teal-500"})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-[11px] shrink-0",children:["all","Femenino","Masculino"].map(t=>e.jsx("button",{type:"button",onClick:()=>es(t),className:v("px-2 py-1 rounded-lg transition cursor-pointer",Xe===t?"bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-300 font-bold shadow-2xs":"text-text-secondary hover:text-text-primary"),children:t==="all"?"Todas":t==="Femenino"?"Femeninas":"Masculinas"},t))})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1",children:hs.map(t=>{const a=b===t.id,r=Qa===t.id,s=Ue(t.id);return e.jsxs("div",{onClick:()=>{s||q("gemini-3.8-flash-tts"),se(t.id)},className:v("p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30 shadow-xs":"bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400",!s&&"opacity-60"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-start justify-between gap-1",children:[e.jsx("span",{className:"text-sm font-extrabold text-text-primary",children:t.name}),e.jsx("button",{type:"button",onClick:o=>fs(t.id,o),disabled:r,title:"Escuchar muestra de esta voz",className:"p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer",children:r?e.jsx(W,{className:"w-3 h-3 animate-spin"}):e.jsx(le,{className:"w-3 h-3 fill-current"})})]}),e.jsxs("div",{className:"flex items-center gap-1 flex-wrap mt-1",children:[e.jsx("span",{className:"text-[9px] font-semibold text-text-secondary bg-slate-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded",children:t.gender}),s?e.jsx("span",{className:"text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded",children:"✓ Activa"}):e.jsx("span",{className:"text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded",children:"Solo 3.8/3.1"})]}),e.jsx("p",{className:"text-[11px] text-teal-700 dark:text-teal-300 font-semibold mt-1 leading-tight",children:t.tone}),t.tag&&e.jsx("span",{className:"inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20",children:t.tag})]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-slate-200/60 dark:border-zinc-800 line-clamp-2 leading-tight",children:t.recommendedFor})]},t.id)})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"Directiva de Estilo y Emoción"}),e.jsx("span",{className:"text-[10px] font-mono text-text-secondary",children:"speechMetadata.style"})]}),e.jsx("textarea",{rows:2,value:R,onChange:t=>Ie(t.target.value),placeholder:"Ej: Voz cálida, pausada y reflexiva de narrador de documentales...",className:"w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{children:[e.jsxs("button",{type:"button",onClick:()=>as(!kt),className:"flex items-center justify-between w-full text-xs text-text-secondary hover:text-text-primary font-bold py-1 transition cursor-pointer",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(Os,{className:"w-3.5 h-3.5 text-teal-500"}),"Configuración Avanzada de Segmentación (Chunking)"]}),e.jsx("span",{children:kt?"▲":"▼"})]}),kt&&e.jsxs("div",{className:"mt-2 p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2 text-xs",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-text-secondary",children:"Palabras por fragmento"}),e.jsxs("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:[he," palabras"]})]}),e.jsx("input",{type:"range",min:80,max:250,step:10,value:he,onChange:t=>Ka(parseInt(t.target.value,10)),className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-teal-600"}),e.jsx("p",{className:"text-[10px] text-text-secondary",children:"Fragmentos de ~150 palabras (~55s de audio) garantizan fluidez continua para audiolibros de hasta 60 minutos."})]})]})]}),e.jsxs("div",{className:"lg:col-span-7 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"flex items-center justify-between gap-3 flex-nowrap",children:[e.jsxs("h2",{className:"text-sm font-extrabold text-text-primary flex items-center gap-2 shrink-0",children:[e.jsx(_e,{className:"w-4 h-4 text-teal-500"}),"Texto a Sintetizar"]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0 flex-nowrap",children:[e.jsx("span",{className:"text-xs text-text-secondary hidden sm:inline",children:"Cargar ejemplo:"}),e.jsxs("select",{defaultValue:"",onChange:t=>{const a=Ft.find(r=>r.title===t.target.value);a&&Oe(a.text),t.target.value=""},className:"bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-primary text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500",children:[e.jsx("option",{value:"",disabled:!0,children:"Seleccionar texto de muestra..."}),Ft.map(t=>e.jsx("option",{value:t.title,children:t.title},t.title))]}),k&&e.jsx(y,{size:"sm",icon:e.jsx(ke,{}),label:"Limpiar",variant:"danger",onClick:()=>Oe("")})]})]}),e.jsxs("div",{className:"p-3 bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px]",children:[e.jsxs("span",{className:"font-bold text-text-secondary flex items-center gap-1",children:[e.jsx(me,{className:"w-3.5 h-3.5 text-amber-500"}),"Insertar Efectos Vocales (Vocal Bursts) en el cursor:"]}),e.jsx("span",{className:"font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold",children:g})]}),e.jsxs("div",{className:"flex flex-wrap gap-1.5",children:[Ke.map(t=>e.jsxs("button",{type:"button",onClick:()=>Dt(` ${t.tag} `),title:t.description,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-teal-500/10 border border-slate-200 dark:border-zinc-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer",children:[e.jsx("span",{className:"text-amber-600 dark:text-amber-400 font-bold",children:t.tag}),e.jsxs("span",{className:"text-text-secondary text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),e.jsx("button",{type:"button",onClick:()=>Dt(`
Alex: `),className:"px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold transition cursor-pointer",children:"Alex:"}),e.jsx("button",{type:"button",onClick:()=>Dt(`
Sam: `),className:"px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold transition cursor-pointer",children:"Sam:"})]})]}),e.jsx("textarea",{id:"wappy-studio-tts-editor",rows:12,value:k,onChange:t=>Oe(t.target.value),placeholder:"Escribe o pega aquí el guion para tu cápsula SST, curso de Academia WAPPY, podcast o audiolibro de hasta 1 hora...",className:"w-full bg-slate-50/70 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-teal-500 leading-relaxed resize-y min-h-[260px]"}),e.jsxs("div",{className:"bg-slate-50 dark:bg-zinc-900/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between text-xs gap-2",children:[e.jsxs("div",{className:"flex items-center gap-3 text-text-secondary",children:[e.jsxs("span",{children:["Palabras:"," ",e.jsx("strong",{className:"text-text-primary font-mono",children:Qt})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Caracteres:"," ",e.jsx("strong",{className:"text-text-primary font-mono",children:Xa})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Fragmentos estimados:"," ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400 font-mono",children:vt})]})]}),e.jsxs("div",{className:"text-text-primary font-semibold",children:["Duración estimada:"," ",e.jsxs("strong",{className:"text-amber-600 dark:text-amber-400 font-mono",children:["~",yt," min"]})," ","/ 60 min máx"]})]}),e.jsx("div",{className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,Math.round(yt/60*100)))}%`}})})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1",children:[e.jsxs("button",{type:"button",onClick:vs,disabled:wt||(D==null?void 0:D.status)==="processing"||!k.trim(),className:"flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[wt?e.jsx(W,{className:"w-4 h-4 animate-spin text-teal-500"}):e.jsx(Va,{className:"w-4 h-4 text-amber-500"}),e.jsx("span",{children:"Vista Previa Rápida (~1er fragmento)"})]}),e.jsxs("button",{type:"button",onClick:js,disabled:(D==null?void 0:D.status)==="processing"||wt||!k.trim(),className:"flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[(D==null?void 0:D.status)==="processing"?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(le,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:vt>1?`Generar Audio Completo (${vt} fragmentos • ~${yt} min)`:"Generar Audio Completo"})]})]})]})]})]}),w==="video"&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200",children:[e.jsxs("div",{className:"lg:col-span-6 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsx("div",{className:"flex items-center justify-between gap-2",children:e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-text-primary flex items-center gap-2",children:[e.jsx(Se,{className:"w-5 h-5 text-purple-500"}),"Estudio de Capas & Motion Graphics HTML"]}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Sube tu propio video grabado a cámara o genera animaciones estilo Claude/HeyGen sincronizadas con tu voz."})]})}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",onClick:()=>{Nt("9:16"),Pe("9:16",!!U,Qe)},className:v("p-3 rounded-xl border text-left transition cursor-pointer",C==="9:16"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-text-primary",children:"📱 Vertical 9:16 (Reels / TikTok)"}),e.jsx("div",{className:"text-[10px] text-text-secondary mt-0.5",children:"1080 × 1920 px • Ideal para redes y WhatsApp"})]}),e.jsxs("button",{type:"button",onClick:()=>{Nt("16:9"),Pe("16:9",!!U,Qe)},className:v("p-3 rounded-xl border text-left transition cursor-pointer",C==="16:9"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-text-primary",children:"🖥️ Horizontal 16:9 (YouTube / LMS)"}),e.jsx("div",{className:"text-[10px] text-text-secondary mt-0.5",children:"1920 × 1080 px • Ideal para cursos Academia WAPPY"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(me,{className:"w-3.5 h-3.5 text-teal-500"}),"Plantillas Visuales Instantáneas (HyperFrames)"]}),e.jsx("span",{className:"text-[10px] text-text-secondary",children:"Clic para aplicar"})]}),e.jsx("div",{className:"grid grid-cols-2 gap-2",children:ir.map(t=>{const a=Qe===t.id;return e.jsxs("button",{type:"button",onClick:()=>{ss(t.id),Pe(C,!!U,t.id)},className:v("p-2.5 rounded-xl border text-left transition cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50/70 dark:bg-zinc-900/70 border-slate-200 dark:border-zinc-800 hover:border-teal-400"),children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-text-primary truncate",children:t.name}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0",children:t.badge})]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-0.5 line-clamp-1",children:t.description})]},t.id)})})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3",children:[e.jsxs("div",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(Ut,{className:"w-4 h-4 text-teal-500"}),"Capas Base Multimedia (Video a Cámara + Locución)"]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{className:"p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-text-primary",children:"1. Tu Video Base (Opcional)"}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:da?`Activo: ${da}`:"Sube un MP4/WebM tuyo para montarle capas HTML encima."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx($a,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Video MP4"}),e.jsx("input",{type:"file",accept:"video/mp4,video/webm,video/quicktime",onChange:Ss,className:"hidden"})]}),U&&e.jsx(y,{size:"sm",icon:e.jsx(ke,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(U),la(null),ca(""),Pe(C,!1)}})]})]}),e.jsxs("div",{className:"p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-text-primary",children:"2. Audio / Locución Sincronizada"}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:pa?`Archivo: ${pa}`:c?`Vinculado: ${c.title}`:"Usa el audio del Estudio TTS o sube un WAV/MP3."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx($a,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Audio WAV/MP3"}),e.jsx("input",{type:"file",accept:"audio/*",onChange:Ts,className:"hidden"})]}),ye&&e.jsx(y,{size:"sm",icon:e.jsx(ke,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(ye),ua(null),xa("")}})]})]})]})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"3. Textos de Capa y Subtítulos Dinámicos"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:ee,onChange:t=>ma(t.target.checked),className:"rounded accent-teal-600"}),"Subtítulos"]}),ee&&e.jsx("div",{className:"inline-flex items-center gap-0.5 bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[10px]",children:[{id:"bottom",label:"Abajo"},{id:"center",label:"Centro"},{id:"top",label:"Arriba"}].map(t=>e.jsx("button",{type:"button",onClick:()=>na(t.id),className:v("px-1.5 py-0.5 rounded transition cursor-pointer",fe===t.id?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:t.label},t.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Insignia Superior (Badge)"}),e.jsx("input",{type:"text",value:ba,onChange:t=>ns(t.target.value),className:"w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Color de Acento"}),e.jsx("div",{className:"flex items-center gap-2",children:["#14b8a6","#10b981","#6366f1","#f59e0b","#f43f5e"].map(t=>e.jsx("button",{type:"button",onClick:()=>ls(t),style:{backgroundColor:t},className:v("w-6 h-6 rounded-full border-2 transition cursor-pointer",ha===t?"border-white ring-2 ring-teal-500 scale-110":"border-transparent opacity-80")},t))})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Titular Principal en Pantalla"}),e.jsx("input",{type:"text",value:tt,onChange:t=>is(t.target.value),className:"w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary font-bold"})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("input",{type:"text",value:ga,onChange:t=>os(t.target.value),placeholder:"Subtítulo secundario...",className:"flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary"}),e.jsx(y,{icon:e.jsx(Vs,{}),label:"Aplicar al Lienzo",variant:"cyan",onClick:()=>Pe(C,!!U)})]})]}),e.jsxs("div",{className:"p-4 bg-purple-500/5 border border-purple-500/25 rounded-2xl space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx(Rs,{className:"w-4 h-4 text-purple-500"}),"Generador IA de Animación HTML + GSAP (Estilo Claude)"]}),e.jsxs("button",{type:"button",onClick:()=>cs(!St),className:"text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer",children:[e.jsx($s,{className:"w-3.5 h-3.5"}),St?"Ocultar Código HTML":"Editar Código HTML"]})]}),e.jsx("textarea",{rows:2,value:fa,onChange:t=>ds(t.target.value),placeholder:"Describe qué gráficos animados, tarjetas, alertas o diagramas quieres que la IA programe en HTML + GSAP...",className:"w-full bg-white dark:bg-zinc-900 border border-purple-500/30 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-purple-500 resize-none"}),e.jsx("div",{className:"flex justify-end",children:e.jsxs("button",{type:"button",onClick:Ns,disabled:at,className:"flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50 cursor-pointer",children:[at?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(me,{className:"w-4 h-4"}),e.jsx("span",{children:at?"Diseñando Escena HTML + GSAP...":"Generar Animación HTML con IA"})]})}),St&&e.jsxs("div",{className:"pt-2",children:[e.jsx("label",{className:"block text-[10px] font-mono uppercase text-text-secondary mb-1",children:"Código Fuente HTML5 / Tailwind / GSAP en Vivo:"}),e.jsx("textarea",{rows:10,value:Ce,onChange:t=>ze(t.target.value),className:"w-full bg-slate-950 text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500"})]})]})]}),e.jsxs("div",{className:"lg:col-span-6 space-y-4 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-nowrap",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[e.jsx("span",{className:v("w-2.5 h-2.5 rounded-full shrink-0",_?"bg-amber-500 animate-ping":re?"bg-emerald-500 animate-pulse":"bg-slate-400")}),e.jsx("h3",{className:"text-sm font-extrabold text-text-primary truncate",children:_?`Editor Visual (${C})`:`Lienzo Interactivo (${C})`})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(y,{size:"sm",icon:ia?e.jsx(W,{className:"animate-spin"}):e.jsx(_e,{}),label:"Sincronizar Voz IA",variant:"purple",disabled:ia,onClick:ks}),e.jsx(y,{size:"sm",icon:e.jsx(dt,{}),label:_?"Salir de Edición":"Editar Lienzo",variant:"orange",isActive:_,onClick:za}),e.jsx(y,{size:"sm",icon:$e?e.jsx(W,{className:"animate-spin"}):e.jsx(Se,{}),label:"Descargar MP4 (WhatsApp/Celular)",variant:"teal",disabled:$e,onClick:Pa}),e.jsx(y,{size:"sm",icon:rt?e.jsx(W,{className:"animate-spin"}):e.jsx(Le,{}),label:"Cápsula Academia (HTML5)",variant:"green",disabled:rt,onClick:La}),e.jsx(y,{size:"sm",icon:e.jsx(Ua,{}),label:"Guardar en Biblioteca",variant:"teal",onClick:()=>Rt({},!1)}),e.jsx(y,{size:"sm",icon:e.jsx(Us,{}),label:"Pantalla Completa",variant:"neutral",onClick:Aa})]})]}),_&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5",children:[e.jsx(Bs,{className:"w-3.5 h-3.5 text-amber-500 shrink-0"}),"Arrastra cualquier caja o título con el mouse para moverlo • Doble clic para escribir"]}),e.jsxs("button",{type:"button",onClick:Es,className:"px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx(pt,{className:"w-3 h-3"}),"Guardar Cambios"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=N.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"text"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(Ba,{className:"w-3 h-3 text-teal-500"}),e.jsx(_s,{className:"w-3 h-3 text-teal-500"}),e.jsx("span",{children:"+ Texto"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=N.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"card"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(Ba,{className:"w-3 h-3 text-purple-500"}),e.jsx(Ut,{className:"w-3 h-3 text-purple-500"}),e.jsx("span",{children:"+ Caja / Tarjeta"})]}),e.jsx("button",{type:"button",onClick:()=>{var t,a;return(a=(t=N.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_SELECT_PARENT"},"*")},disabled:!G,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 disabled:opacity-40 cursor-pointer",children:"Seleccionar Caja Contenedora"}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=N.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DUPLICATE_SELECTED"},"*")},disabled:!G,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(Kt,{className:"w-3 h-3 text-indigo-500"}),e.jsx("span",{children:"Duplicar"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=N.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DELETE_SELECTED"},"*")},disabled:!G,className:"px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(ke,{className:"w-3 h-3"}),e.jsx("span",{children:"Eliminar"})]})]})]}),e.jsx("div",{className:"flex justify-center items-center bg-slate-950 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-inner overflow-hidden min-h-[460px]",children:e.jsxs("div",{ref:ka,className:v("relative overflow-hidden bg-slate-950 shadow-2xl border border-white/10 transition-all duration-300",Tt?"w-screen h-screen rounded-none border-0 flex flex-col items-center justify-between p-4 sm:p-6":v("rounded-2xl mx-auto flex items-center justify-center",C==="9:16"?"w-full max-w-[390px] aspect-[9/16] max-h-[660px]":"w-full aspect-[16/9] max-h-[660px] min-h-[340px]")),children:[e.jsxs("div",{className:v("relative overflow-hidden bg-slate-950",Tt?C==="9:16"?"h-[calc(100vh-100px)] aspect-[9/16] max-w-[95vw] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-[min(94vw,calc((100vh-100px)*1.7778))] aspect-[16/9] max-h-[calc(100vh-100px)] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-full h-full"),children:[X&&e.jsx("audio",{ref:J,src:X,preload:"metadata",onTimeUpdate:t=>{ie(t.currentTarget.currentTime)},onLoadedMetadata:t=>{t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&Re(t.currentTarget.duration)},onEnded:()=>{var t,a,r;ve(!1),(a=(t=N.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_PAUSE"},"*"),(r=Y.current)==null||r.pause()}}),U&&e.jsx("video",{ref:Y,src:U,width:C==="9:16"?1080:1920,height:C==="9:16"?1920:1080,muted:et,playsInline:!0,loop:!0,preload:"metadata",onTimeUpdate:t=>{X||ie(t.currentTarget.currentTime)},onLoadedMetadata:t=>{!X&&t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&Re(t.currentTarget.duration)},className:"absolute inset-0 w-full h-full object-cover z-0"}),e.jsx("iframe",{ref:N,title:"WAPPY Studio HTML Canvas",srcDoc:bs,sandbox:"allow-scripts allow-same-origin",onLoad:()=>{var t,a,r,s,o,n;(a=(t=N.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*"),_?(s=(r=N.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!0},"*"):re||(n=(o=N.current)==null?void 0:o.contentWindow)==null||n.postMessage({type:"STUDIO_PAUSE"},"*")},className:v("absolute inset-0 w-full h-full border-0 z-10",_?"pointer-events-auto":"pointer-events-none")}),ee&&Ot&&e.jsx("div",{className:v("absolute inset-x-3 z-20 flex justify-center pointer-events-none",fe==="top"?"top-16":fe==="center"?"top-1/2 -translate-y-1/2":"bottom-5"),children:e.jsx("div",{className:"bg-black/85 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]",children:e.jsx("div",{className:"flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1",children:Ot.words.map((t,a)=>{const r=a===Ot.activeOffset;return e.jsx("span",{className:v("text-sm sm:text-base font-black uppercase tracking-wide transition-all duration-150",r?"text-amber-300 scale-110 bg-teal-500/30 px-1.5 py-0.5 rounded-lg border border-teal-400/50":"text-white/90"),children:t},`${t}-${a}`)})})})})]}),Tt&&e.jsxs("div",{className:"w-full max-w-3xl mx-auto mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 flex items-center gap-3 z-30 shadow-2xl",children:[e.jsx("button",{type:"button",onClick:Ea,title:re?"Pausar / Parar":"Reproducir",className:"px-3.5 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:re?e.jsxs(e.Fragment,{children:[e.jsx(xt,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(le,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:It,title:"Reiniciar animación",className:"p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer shrink-0",children:e.jsx(_a,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:B||20,step:.1,value:we,onChange:t=>Ca(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-200 shrink-0",children:[we.toFixed(1),"s / ",(B||20).toFixed(1),"s"]}),e.jsxs("button",{type:"button",onClick:za,className:v("px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0",_?"bg-amber-500/20 border-amber-400 text-amber-300":"bg-slate-800 border-slate-700 text-slate-200 hover:text-white"),children:[e.jsx(dt,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:_?"Editando":"Editar"})]}),e.jsxs("button",{type:"button",onClick:Aa,className:"px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0",children:[e.jsx(Fs,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Salir"})]})]})]})}),e.jsxs("div",{className:"p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2.5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{type:"button",onClick:Ea,title:re?"Pausar animación y subtítulos":"Reproducir animación y subtítulos",className:"px-3 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:re?e.jsxs(e.Fragment,{children:[e.jsx(xt,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(le,{className:"w-4 h-4 fill-white ml-0.5"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:It,title:"Reiniciar animación",className:"p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-secondary hover:text-text-primary transition cursor-pointer shrink-0",children:e.jsx(_a,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:B||20,step:.1,value:we,onChange:t=>Ca(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-text-secondary shrink-0",children:[we.toFixed(1),"s / ",(B||20).toFixed(1),"s"]}),U&&e.jsx("button",{type:"button",onClick:()=>rs(!et),title:et?"Activar audio del video original":"Silenciar video original",className:"p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-secondary hover:text-text-primary transition cursor-pointer",children:et?e.jsx(Hs,{className:"w-4 h-4 text-rose-500"}):e.jsx(Ha,{className:"w-4 h-4 text-teal-500"})})]}),e.jsxs("div",{className:"pt-2 border-t border-slate-200/80 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",disabled:$e,onClick:Pa,className:"p-3 rounded-xl border bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20 text-teal-800 dark:text-teal-200 text-left transition-all cursor-pointer disabled:opacity-50 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20",children:"WhatsApp • Celular • Redes"}),$e?e.jsx(W,{className:"w-4 h-4 animate-spin shrink-0"}):e.jsx(Se,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight mt-0.5",children:$e?"Renderizando Video MP4...":"Descargar Video .MP4 (Todo Unido)"}),e.jsx("div",{className:"text-[10px] opacity-85 leading-snug",children:"Une Animación + Subtítulos + Voz IA en un archivo .MP4 listo para enviar por WhatsApp o subir a Reels"})]}),e.jsxs("div",{className:"p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20",children:"Academia WAPPY • LMS Responsive"}),e.jsx(Bt,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight",children:"Cápsula Interactiva HTML5 (Móvil & Web)"}),e.jsxs("div",{className:"flex items-center gap-1.5 mt-0.5",children:[e.jsxs("button",{type:"button",disabled:rt,onClick:La,className:"flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx(Le,{className:"w-3 h-3"}),e.jsx("span",{children:"Descargar .HTML"})]}),e.jsxs("button",{type:"button",disabled:rt,onClick:As,title:"Copiar código <iframe srcdoc> para lección de Academia WAPPY",className:"py-1.5 px-2.5 rounded-lg bg-white/80 dark:bg-zinc-800 hover:bg-white text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx(Kt,{className:"w-3 h-3"}),e.jsx("span",{children:"Copiar LMS"})]})]})]})]})]}),_&&G&&e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/90 rounded-2xl border border-teal-500/40 space-y-3 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5",children:[e.jsx(dt,{className:"w-3.5 h-3.5"}),"Propiedades del Elemento Seleccionado (<",G.tagName,">)"]}),e.jsx("button",{type:"button",onClick:()=>ue({dx:0,dy:0,scale:1}),className:"text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer",children:"Restablecer posición"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Texto del elemento (edita aquí o con doble clic en el video):"}),e.jsx("textarea",{rows:2,value:G.text,onChange:t=>ue({text:t.target.value}),className:"w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:["Tamaño Letra (",G.fontSize,"px)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>ue({fontSize:Math.max(10,G.fontSize-2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"A-"}),e.jsx("button",{type:"button",onClick:()=>ue({fontSize:Math.min(96,G.fontSize+2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"A+"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:["Escala Caja (",G.scale,"x)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>ue({scale:Math.max(.5,Number((G.scale-.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"-"}),e.jsx("button",{type:"button",onClick:()=>ue({scale:Math.min(2.5,Number((G.scale+.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"+"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:"Color de Texto"}),e.jsx("input",{type:"color",value:G.color,onChange:t=>ue({color:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-zinc-700"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:"Color de Fondo"}),e.jsx("input",{type:"color",value:G.backgroundColor,onChange:t=>ue({backgroundColor:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-zinc-700"})]})]})]})]})]}),w==="lab"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4 shadow-xs",children:[e.jsx("div",{className:"w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0",children:e.jsx(me,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-base font-extrabold text-text-primary",children:"Laboratorio de Expresividad y Vocal Bursts"}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Explora las capacidades de Gemini TTS: respiraciones orgánicas, risas, susurros y dirección de estilo en tiempo real"})]})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-secondary",children:"Modelo en el Laboratorio:"}),e.jsx("div",{className:"flex flex-wrap items-center gap-2",children:be.map(t=>{const a=g===t.id;return e.jsxs("button",{type:"button",onClick:()=>{q(t.id),t.supportedVoices.includes(b)||se(t.supportedVoices[0]||"Kore")},className:v("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-zinc-900 text-text-secondary border-slate-200 dark:border-zinc-800 hover:border-teal-400"),children:[t.name," (",t.supportedVoices.length," voces)"]},t.id)})})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsx("h3",{className:"text-sm font-extrabold text-text-primary",children:"Efectos Vocales Orgánicos Integrados"}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:Ke.map(t=>{const a=Ya===t.tag;return e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400",children:t.tag}),e.jsx("p",{className:"text-xs font-bold text-text-primary mt-0.5",children:t.label}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:t.description})]}),e.jsx("button",{type:"button",disabled:a,onClick:async()=>{try{Zt(t.tag);const r=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:I(d),body:JSON.stringify({voiceName:b,model:"gemini-3.8-flash-tts",stylePrompt:"Voz muy expresiva y natural.",text:`Escucha cómo suena este efecto natural en medio de una frase: ${t.tag} ¡Suena totalmente humano!`})}),s=await oe(r);s.audioBase64&&$({base64:s.audioBase64,title:`Efecto ${t.tag} (${b})`,durationSeconds:s.durationSeconds,voiceName:b})}catch(r){h({type:"error",text:r.message})}finally{Zt(null)}},className:"w-9 h-9 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 transition cursor-pointer",children:a?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(le,{className:"w-4 h-4 fill-current"})})]},t.tag)})})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("h3",{className:"text-sm font-extrabold text-text-primary",children:"Probador Libre de Prosodia y Dirección de Voz"}),e.jsxs("span",{className:"text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",children:["Voces activas: ",Me," de ",K.length]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary",children:["Selecciona la Voz (",Me," activas para ",z==null?void 0:z.name,")"]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:K.map(t=>{const a=b===t.id,r=Ue(t.id);return e.jsxs("button",{type:"button",onClick:()=>{r||q("gemini-3.8-flash-tts"),se(t.id)},className:v("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-zinc-900 text-text-primary border-slate-200 dark:border-zinc-800 hover:border-teal-400",!r&&"opacity-55"),children:[e.jsxs("span",{children:[t.name," (",t.gender,")"]}),r&&e.jsx(pt,{className:"w-3 h-3 text-emerald-400"})]},t.id)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1.5",children:"Prompt de Dirección (speechMetadata.style)"}),e.jsx("input",{type:"text",value:ft,onChange:t=>Ga(t.target.value),className:"w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-teal-500"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1.5",children:"Texto de Prueba"}),e.jsx("textarea",{rows:3,value:ne,onChange:t=>qa(t.target.value),className:"w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs text-text-primary focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsx("div",{children:e.jsxs("button",{type:"button",onClick:ws,disabled:Jt||!ne.trim(),className:"inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[Jt?e.jsx(W,{className:"w-4 h-4 animate-spin"}):e.jsx(me,{className:"w-4 h-4"}),e.jsx("span",{children:"Sintetizar en el Laboratorio"})]})})]})]}),w==="library"&&e.jsxs("div",{className:"space-y-5 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-text-primary flex items-center gap-2",children:[e.jsx(Bt,{className:"w-5 h-5 text-indigo-500"}),"Biblioteca de Audios y Videos"]}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Tus locuciones y videos (HTML + voz) quedan guardados permanentemente en este navegador para reproducir, reabrir, editar o descargar."})]}),ce.length>0&&e.jsx(y,{icon:e.jsx(ke,{}),label:"Limpiar Historial",variant:"danger",onClick:()=>{window.confirm("¿Borrar todos los audios y videos guardados?")&&(Ee([]),tr())}})]}),ce.length===0?e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-2",children:[e.jsx(_e,{className:"w-10 h-10 mx-auto text-slate-400"}),e.jsx("p",{className:"text-sm font-bold text-text-primary",children:"Aún no hay audios en tu biblioteca"}),e.jsx("p",{className:"text-xs text-text-secondary max-w-md mx-auto",children:'Genera una locución en la pestaña "Estudio de Voz (TTS)" o en "Voces & Bursts" y aparecerá aquí automáticamente.'})]}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:ce.map(t=>e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("h4",{className:"text-sm font-extrabold text-text-primary line-clamp-1",children:t.title}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[t.kind==="video"&&e.jsxs("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30",children:["🎬 VIDEO ",t.aspectRatio||""]}),e.jsx("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30",children:t.voiceName})]})]}),e.jsxs("div",{className:"flex items-center gap-2.5 text-xs text-text-secondary",children:[e.jsxs("span",{children:["⏱ ",lr(t.durationSeconds)]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[t.wordCount," palabras"]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:dr(t.createdAt)})]}),t.stylePrompt&&e.jsxs("div",{className:"p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800 text-[11px] italic text-text-secondary line-clamp-2",children:['"',t.stylePrompt,'"']})]}),e.jsxs("div",{className:"flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-zinc-800",children:[e.jsx("div",{className:"flex items-center gap-1.5",children:t.kind==="video"?e.jsx(y,{size:"sm",icon:e.jsx(dt,{}),label:"Abrir en Compositor",variant:"orange",onClick:()=>zs(t)}):e.jsxs(e.Fragment,{children:[e.jsx(y,{size:"sm",icon:e.jsx(le,{}),label:"Reproducir",variant:"teal",onClick:()=>Ta(t)}),e.jsx(y,{size:"sm",icon:e.jsx(Se,{}),label:"Usar en Video",variant:"purple",onClick:()=>Ta(t,!0)})]})}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[t.kind==="video"&&t.mp4Key&&e.jsx(y,{size:"sm",icon:e.jsx(Se,{}),label:"Descargar MP4",variant:"green",onClick:async()=>{const a=await He(t.mp4Key);a&&Mt(a,`wappy-studio-reel-${t.id}.mp4`)}}),t.kind==="video"&&t.capsuleKey&&e.jsx(y,{size:"sm",icon:e.jsx(Le,{}),label:"Descargar Cápsula HTML",variant:"green",onClick:async()=>{const a=await He(t.capsuleKey);a&&Mt(a,`wappy-academia-capsula-${t.id}.html`)}}),t.kind!=="video"&&e.jsx(y,{size:"sm",icon:e.jsx(Le,{}),label:"Descargar WAV",variant:"green",onClick:async()=>{const a=await Sa(t);if(!a){h({type:"error",text:"Este audio ya no está disponible (se generó antes del guardado permanente). Vuelve a generarlo."});return}Mt(a,`wappy-audio-${t.id}.wav`)}}),e.jsx(y,{size:"sm",icon:e.jsx(ke,{}),label:"Eliminar",variant:"danger",onClick:()=>gs(t)})]})]})]},t.id))})]})]}),ps&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4",children:e.jsxs("div",{className:"bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4",children:[e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-300 shrink-0",children:e.jsx(Oa,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-extrabold text-text-primary",children:"Claves API Google Gemini (Rotación 3x)"}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Multiplica tu cuota gratuita de síntesis de voz TTS y generación de video HTML/GSAP."})]})]}),e.jsx("button",{type:"button",onClick:()=>Ct(!1),className:"p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-zinc-300 cursor-pointer",children:e.jsx(ut,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-800 dark:text-teal-200 leading-relaxed",children:["Obtén gratis tus claves en"," ",e.jsx("a",{href:"https://aistudio.google.com/app/apikey",target:"_blank",rel:"noopener noreferrer",className:"font-extrabold underline hover:text-teal-500",children:"Google AI Studio (aistudio.google.com)"}),". WAPPY Studio rotará automáticamente entre tus claves y las del servidor para evitar límites 429 en locuciones de hasta 60 minutos."]}),e.jsx("div",{className:"space-y-2.5",children:it.map((t,a)=>e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px] font-bold text-text-secondary",children:[e.jsx("span",{children:t.label||`Clave Google Gemini #${a+1}`}),t.status==="valid"&&e.jsxs("span",{className:"text-emerald-600 dark:text-emerald-400 flex items-center gap-1",children:[e.jsx(Wt,{className:"w-3.5 h-3.5"})," Activa y verificada"]}),t.status==="invalid"&&e.jsxs("span",{className:"text-rose-600 dark:text-rose-400 flex items-center gap-1",children:[e.jsx(Ra,{className:"w-3.5 h-3.5"})," Clave inválida o vencida"]})]}),e.jsx("input",{type:"password",value:t.key,onChange:r=>{const s=r.target.value;zt(o=>o.map((n,u)=>u===a?{...n,key:s,status:"unchecked"}:n))},placeholder:"AIzaSy...",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"})]},a))}),ja&&e.jsx("div",{className:"p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300",children:ja}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800",children:[e.jsx(y,{size:"sm",icon:e.jsx(ke,{}),label:"Limpiar Claves",variant:"danger",onClick:()=>{zt([{key:"",label:"Clave Principal #1",status:"unchecked"},{key:"",label:"Clave Respaldo #2",status:"unchecked"},{key:"",label:"Clave Respaldo #3",status:"unchecked"}]),localStorage.removeItem(Gt),ot("Claves eliminadas del navegador.")}}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(y,{size:"sm",icon:e.jsx(ut,{}),label:"Cerrar",variant:"neutral",onClick:()=>Ct(!1)}),e.jsx(y,{size:"sm",icon:At?e.jsx(W,{className:"animate-spin"}):e.jsx(Ua,{}),label:At?"Validando...":"Guardar y Validar",variant:"teal",disabled:At,onClick:ms})]})]})]})})]})}function cr({audioBase64:l,audioUrl:d,title:m,durationSeconds:p,voiceName:M,onSendToVideo:E}){const f=i.useRef(null),[j,Z]=i.useState(!1),[O,w]=i.useState(0),[L,V]=i.useState(p||0),[We,be]=i.useState(1),[De,K]=i.useState(!1),Q=d||(l?`data:audio/wav;base64,${l}`:"");i.useEffect(()=>{Z(!1),w(0),p&&p>0&&V(p)},[Q,p]);const gt=()=>{!f.current||!Q||(j?f.current.pause():f.current.play().catch(T=>console.error("Error al reproducir audio:",T)))},Te=T=>{if(!T||isNaN(T)||T<0)return"00:00";const g=Math.floor(T),q=Math.floor(g/60),b=g%60;return`${q.toString().padStart(2,"0")}:${b.toString().padStart(2,"0")}`},Ke=async()=>{if(!Q)return;const T=`${m.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"wappy-tts"}.wav`;try{if(Q.startsWith("data:")||Q.startsWith("blob:")){const b=document.createElement("a");b.href=Q,b.download=T,document.body.appendChild(b),b.click(),document.body.removeChild(b);return}const q=await fetch(Q,{headers:I()});if(q.ok){const b=await q.blob(),se=URL.createObjectURL(b),R=document.createElement("a");R.href=se,R.download=T,document.body.appendChild(R),R.click(),document.body.removeChild(R),setTimeout(()=>URL.revokeObjectURL(se),4e3);return}}catch{}const g=document.createElement("a");g.href=Q,g.download=T,document.body.appendChild(g),g.click(),document.body.removeChild(g)};return Q?e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-teal-500/30 rounded-2xl p-4 sm:p-5 shadow-md space-y-3",children:[e.jsx("audio",{ref:f,src:Q,preload:"metadata",onPlay:()=>Z(!0),onPause:()=>Z(!1),onEnded:()=>Z(!1),onTimeUpdate:()=>{f.current&&w(f.current.currentTime)},onLoadedMetadata:()=>{var T;(T=f.current)!=null&&T.duration&&!isNaN(f.current.duration)&&V(f.current.duration)}}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3 min-w-0",children:[e.jsx("button",{type:"button",onClick:gt,className:"w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white flex items-center justify-center shadow-md transition active:scale-95 shrink-0 cursor-pointer",children:j?e.jsx(xt,{className:"w-5 h-5 fill-white"}):e.jsx(le,{className:"w-5 h-5 fill-white ml-0.5"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"}),e.jsx("h3",{className:"text-sm font-extrabold text-text-primary truncate",children:m})]}),e.jsxs("p",{className:"text-xs text-teal-600 dark:text-teal-400 font-semibold",children:["Voz: ",M||"Kore"," • WAV 24kHz Alta Fidelidad (",Te(O)," /"," ",Te(L),")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{const T=[.75,1,1.25,1.5,2],g=T[(T.indexOf(We)+1)%T.length];be(g),f.current&&(f.current.playbackRate=g)},className:"px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-teal-700 dark:text-teal-300 cursor-pointer",children:[We,"x"]}),e.jsx(y,{size:"sm",icon:e.jsx(Se,{}),label:"Llevar al Video",variant:"purple",onClick:E}),l&&e.jsx(y,{size:"sm",icon:De?e.jsx(pt,{}):e.jsx(Kt,{}),label:De?"Copiado":"Copiar Base64",variant:"fuchsia",onClick:()=>{navigator.clipboard.writeText(l),K(!0),setTimeout(()=>K(!1),2e3)}}),e.jsx(y,{size:"sm",icon:e.jsx(Le,{}),label:"Descargar WAV",variant:"green",onClick:Ke})]})]}),e.jsx("div",{className:"flex items-center justify-between gap-1 h-10 bg-slate-50 dark:bg-zinc-950 rounded-xl px-3 py-1.5 border border-slate-200/80 dark:border-zinc-800 overflow-hidden",children:Array.from({length:44}).map((T,g)=>{const q=L>0?O/L:0,b=g/44,se=b<=q,R=22+Math.sin(g*.45)*16+Math.cos(g*.9)*12;return e.jsx("div",{onClick:()=>{if(f.current&&L>0){const Ie=b*L;f.current.currentTime=Ie,w(Ie)}},style:{height:`${Math.max(18,Math.min(95,R))}%`},className:v("w-1 rounded-full cursor-pointer transition-all duration-150",se?"bg-gradient-to-t from-teal-500 to-emerald-400":"bg-slate-300 dark:bg-zinc-800 hover:bg-teal-400/50")},g)})}),e.jsxs("div",{className:"flex items-center gap-2.5 px-1",children:[e.jsx("span",{className:"text-[11px] font-mono font-bold text-text-secondary w-11",children:Te(O)}),e.jsx("input",{type:"range",min:0,max:Math.max(1,L),step:.1,value:Math.min(O,Math.max(1,L)),onChange:T=>{const g=parseFloat(T.target.value);f.current&&(f.current.currentTime=g),w(g)},className:"flex-1 h-1.5 rounded-lg accent-teal-500 cursor-pointer"}),e.jsx("span",{className:"text-[11px] font-mono font-bold text-text-secondary w-11 text-right",children:Te(L)})]})]}):null}function ur({job:l,onPause:d,onResume:m,onCancel:p,onPlayChunk:M,onLoadMaster:E}){const f=l.status==="completed",j=l.status==="failed",Z=l.status==="processing",O=l.status==="paused";return e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-teal-500/40 rounded-2xl p-5 shadow-md space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center",children:Z?e.jsx(W,{className:"w-5 h-5 animate-spin"}):f?e.jsx(Wt,{className:"w-5 h-5 text-emerald-500"}):e.jsx(me,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-extrabold text-text-primary",children:f?"¡Audio Maestro de Larga Duración Completado!":j?"Error en la Generación":O?"Generación en Pausa":`Sintetizando fragmento ${l.currentChunkIndex+1} de ${l.totalChunks}...`}),e.jsxs("p",{className:"text-xs text-text-secondary",children:["Generados ",Math.round(l.generatedTotalSeconds),"s de ~",l.estimatedTotalSeconds,"s estimados (",l.progressPercent,"%)"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[Z&&e.jsx(y,{size:"sm",icon:e.jsx(xt,{}),label:"Pausar",variant:"amber",onClick:d}),O&&e.jsx(y,{size:"sm",icon:e.jsx(le,{}),label:"Reanudar",variant:"teal",onClick:m}),!f&&!j&&e.jsx(y,{size:"sm",icon:e.jsx(ut,{}),label:"Cancelar",variant:"danger",onClick:p}),f&&e.jsxs(e.Fragment,{children:[e.jsx(y,{size:"sm",icon:e.jsx(le,{}),label:"Cargar Master",variant:"teal",onClick:E}),e.jsxs("a",{href:l.downloadUrl||`/api/studio/tts/jobs/${l.id}/download`,download:!0,className:"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 text-xs font-bold hover:bg-green-500/20 transition",children:[e.jsx(Le,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Descargar WAV Master"})]})]})]})]}),e.jsx("div",{className:"w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,l.progressPercent))}%`}})}),e.jsx("div",{className:"grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 gap-1.5 p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/80 dark:border-zinc-800 max-h-32 overflow-y-auto",children:l.chunks.map(w=>{const L=w.status==="completed",V=w.status==="processing";return e.jsx("button",{type:"button",disabled:!L,onClick:()=>M(w),title:`Fragmento #${w.index+1}`,className:v("h-7 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center border transition",L?"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer":V?"bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/40 animate-pulse":"bg-slate-200/50 dark:bg-zinc-900 text-text-secondary border-transparent opacity-60"),children:L?e.jsx(Ha,{className:"w-3 h-3"}):V?e.jsx(W,{className:"w-3 h-3 animate-spin"}):w.index+1},w.index)})})]})}export{Fr as default};
