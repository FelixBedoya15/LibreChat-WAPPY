import{cN as Za,r as n,j as e,is as ia,bp as de,iw as Ie,fO as Ne,bF as ft,cP as yt,bq as O,cO as oa,bD as xa,cc as Qa,bl as ma,el as es,bu as Ze,a$ as ts,bN as as,dT as ae,gn as ss,bB as ke,bC as la,bx as rs,i0 as ns,gV as is,b5 as vt,bX as Ve,fn as os,cx as ls,c4 as da,h2 as ds,bv as kt,ef as Qe,fk as ca,fl as cs,ix as ps,io as ba}from"./vendor.DYW0wM5n.js";import{u as us}from"./routing.Cj3VmeMA.js";import{u as xs,ah as ms,a as bs,c as m,aK as N}from"./ambassadors-module.D0IDacSW.js";import"./utilities.BjsdvwEO.js";import{O as gs}from"./blog-modules.CDEdDUad.js";import"./react-interactions.D7-JPAG8.js";import{M as hs}from"./sgsst-modules.D1vYExnO.js";import"./markdown_highlight.BXMLVVdG.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./tanstack-vendor.DYIZ-52P.js";import"./http-client.Bmq-NEq6.js";import"./heic-converter.BhQCFQ0l.js";import"./forms.DEMc3D7c.js";import"./radix-ui.CGYgq8tg.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.DD_sfwPT.js";import"./animations.DklOPy0I.js";import"./virtualization.CpBvUi5N.js";import"./headlessui.Ul8AWG4Z.js";import"./framer-motion.WNZz7wmC.js";import"./i18n.CDA4tK8r.js";import"./date-utils.X8D4nCrw.js";import"./sgsst-assets.KdMSUpxn.js";import"./security-ui.xKNm28sF.js";import"./kanban-module.B8eC51oe.js";import"./plans-module.pXsCblpK.js";import"./lms-modules.BUDL_QA7.js";import"./markdown-processing.BgA4K7JW.js";import"./events-modules.BTxQGkPb.js";var fs={};const wt={"gemini-3.8-flash-tts":{id:"gemini-3.8-flash-tts",name:"Gemini 3.8 Flash TTS",badge:"Recomendado / Cuota Activa",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"✓ Activo (14 voces)",description:"Máxima fluidez natural, diseño de voz, vocal bursts (<breath>, <laugh>) y soporte para las 14 voces.",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-3.1-flash-tts-preview":{id:"gemini-3.1-flash-tts-preview",name:"Gemini 3.1 Flash TTS Preview",badge:"Preview 3.1 / Cuota Activa",badgeColor:"bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:"Arquitectura Gemini 3.1 con prosodia refinada, tono expresivo y respuesta ágil (14 voces).",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-2.5-flash-preview-tts":{id:"gemini-2.5-flash-preview-tts",name:"Gemini 2.5 Flash TTS",badge:"Reemplazo de 2.5 Pro",badgeColor:"bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",rateLimitLabel:"3 RPM • 10 RPD (2.5 Pro: 0/0)",quotaLabel:"5 voces",description:"Reemplazo oficial y funcional de 2.5 Pro (no disponible en API). Activa únicamente las 5 voces fundamentales.",supportsMultiSpeaker:!0,supportsVocalBursts:!1,supportedVoices:["Kore","Puck","Charon","Fenrir","Aoede"]},"gemini-3.8-flash-lite-tts":{id:"gemini-3.8-flash-lite-tts",name:"Gemini 3.8 Flash-Lite TTS",badge:"Ultra Rápido",badgeColor:"bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",rateLimitLabel:"Baja Latencia",quotaLabel:"6 voces",description:"Optimizado para lecturas masivas con mínima latencia continua (6 voces rápidas).",supportsMultiSpeaker:!1,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Aoede"]}},ys=[{id:"Kore",name:"Kore",gender:"Femenino",tone:"Cálida, Serena y Profesional",recommendedFor:"Audiolibros, Narración, Tutoriales, Inducción SST",tag:"Más popular"},{id:"Puck",name:"Puck",gender:"Masculino",tone:"Enérgico, Dinámico y Joven",recommendedFor:"Podcasts, Reels, Contenido Creativo, Diálogos",tag:"Muy expresivo"},{id:"Charon",name:"Charon",gender:"Masculino",tone:"Barítono, Grave, Maduro y Solemne",recommendedFor:"Documentales, Historia, Suspenso, Directivos",tag:"Voz profunda"},{id:"Fenrir",name:"Fenrir",gender:"Masculino",tone:"Claro, Elocuente y Periodístico",recommendedFor:"Noticias, Informes, Presentaciones, Boletines",tag:"Profesional"},{id:"Zephyr",name:"Zephyr",gender:"Femenino",tone:"Dulce, Aterciopelada y Relajante",recommendedFor:"Meditación, ASMR, Cuentos, Bienestar",tag:"Calma"},{id:"Orus",name:"Orus",gender:"Masculino",tone:"Firme, Imperial, Épico y Reflexivo",recommendedFor:"Ficción Épica, Liderazgo, Ensayos, Cultura Vial",tag:"Imperial"},{id:"Aoede",name:"Aoede",gender:"Femenino",tone:"Melódica, Expresiva, Artística y Cálida",recommendedFor:"Poesía, Literatura, Storytelling, Sensibilización",tag:"Melódica"},{id:"Leda",name:"Leda",gender:"Femenino",tone:"Cercana, Maternal, Madura y Envolvente",recommendedFor:"Audiolibros Largos, Relatos, Bienvenida",tag:"Narradora"},{id:"Callisto",name:"Callisto",gender:"Femenino",tone:"Elegante, Sofisticada y Articulada",recommendedFor:"Divulgación Científica, Conferencias, Auditorías",tag:"Sofisticada"},{id:"Europa",name:"Europa",gender:"Femenino",tone:"Brillante, Luminosa, Alegre y Asertiva",recommendedFor:"Marketing, Anuncios, E-Learning, Campañas",tag:"Enérgica"},{id:"Ganymede",name:"Ganymede",gender:"Masculino",tone:"Resonante, Equilibrado, Sabio y Seguro",recommendedFor:"Educación Superior, Cursos, Capacitación Técnica",tag:"Resonante"},{id:"Io",name:"Io",gender:"Femenino",tone:"Vivaz, Espontánea, Fresca y Amigable",recommendedFor:"Redes Sociales, Vlogs, Asistentes, Reels",tag:"Fresca"},{id:"Titan",name:"Titan",gender:"Masculino",tone:"Imponente, Cinematográfico y Potente",recommendedFor:"Tráilers, Introducciones, Impacto, Alertas",tag:"Cinematográfica"},{id:"Prometheus",name:"Prometheus",gender:"Masculino",tone:"Noble, Pensativo, Filosófico y Clásico",recommendedFor:"Filosofía, Análisis Profundo, Crónicas",tag:"Sabio"}],vs=[{id:"orus-solemn",name:"Narración Solemne (Orus)",voiceName:"Orus",style:"Voz firme, templada, reflexiva y madura de narrador de crónica histórica, dicción solemne, pausas medidas y respiraciones naturales.",speed:"0.95x"},{id:"aoede-poetic",name:"Cuento Poético (Aoede)",voiceName:"Aoede",style:"Voz melódica, cálida, expresiva y artística para relato literario y sensibilización, con matices emocionales suaves.",speed:"0.95x"},{id:"titan-trailer",name:"Tráiler Cinematográfico (Titan)",voiceName:"Titan",style:"Voz imponente, profunda, cinematográfica y épica de tráiler de película, con pausas dramáticas e impacto.",speed:"0.95x"},{id:"kore-audiobook",name:"Narrador de Audiolibro (Kore)",voiceName:"Kore",style:"Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.",speed:"1.0x"},{id:"puck-podcast",name:"Host de Podcast Dinámico (Puck)",voiceName:"Puck",style:"Host de podcast carismático, enérgico, cercano y espontáneo, con entonación conversacional moderna.",speed:"1.05x"},{id:"charon-documentary",name:"Documental Profundo (Charon)",voiceName:"Charon",style:"Tono barítono, solemne, reflexivo y cinematográfico de narrador de documental, con pausas medidas.",speed:"0.95x"},{id:"fenrir-news",name:"Noticiero Profesional (Fenrir)",voiceName:"Fenrir",style:"Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.",speed:"1.05x"},{id:"zephyr-asmr",name:"Meditación y ASMR (Zephyr)",voiceName:"Zephyr",style:"Voz suave, serena, dulce y sumamente relajante para meditación guiada, mindfulness y bienestar.",speed:"0.9x"},{id:"screenplay-dialogue",name:"Guion / Diálogo Alex & Sam",voiceName:"Kore",multiSpeaker:!0,speaker1:{name:"Alex",voiceName:"Puck",style:"Entusiasta y curioso"},speaker2:{name:"Sam",voiceName:"Kore",style:"Experta, clara y cercana"},style:"Diálogo interactivo de podcast entre dos especialistas con alternancia natural.",speed:"1.0x"}],ws=[{tag:"<breath>",label:"Respiración natural",description:"Inserta una toma de aire orgánica entre frases"},{tag:"<laugh>",label:"Risa / Carcajada",description:"Añade una risa espontánea o carcajada suave"},{tag:"<gasp>",label:"Sorpresa / Jadear",description:"Efecto de inhalación rápida de asombro"},{tag:"|mhm|",label:"Asentimiento (|mhm|)",description:"Confirmación conversacional natural"},{tag:"|yeah|",label:"Aceptación (|yeah|)",description:"Interjección de acuerdo en diálogos"}],jt=[{title:"Inducción SST: 5 Reglas de Oro en Riesgo Eléctrico",text:`¡Atención equipo! Antes de intervenir cualquier tablero o red eléctrica, recuerda que tu vida depende de las Cinco Reglas de Oro. <breath>

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

Tu bienestar mental y físico es la base de un entorno laboral saludable y seguro.`}],js=[{id:"golden-rules",name:"⚡ Reglas de Oro Glass",badge:"Estilo Claude",description:"Tarjeta hero con barra de progreso e indicadores clave en cristal."},{id:"kpi-hud",name:"📊 Dashboard KPIs & HUD",badge:"Ejecutivo",description:"Métricas ejecutivas animadas con barras comparativas y telemetría."},{id:"alert-sst",name:"🚨 Alerta & Checklist 1-2-3",badge:"Prevención",description:"Pasos numerados de seguridad con entrada secuencial elástica."},{id:"camera-overlay",name:"🎬 Lower-Third (Video Propio)",badge:"Transparente",description:"Capas limpias en tercio superior e inferior para dejar libre tu rostro."}];function pa({aspectRatio:l="9:16",hasBaseVideo:c=!1,badgeText:R="CÁPSULA INTERACTIVA WAPPY",headline:b="5 Reglas de Oro en Seguridad",subheadline:B="Prevención inteligente en tiempo real con WAPPY Studio",accentColor:U="#14b8a6",templateId:y="golden-rules"}){const v=l==="9:16",H=R.replace(/</g,"&lt;"),$=b.replace(/</g,"&lt;"),h=B.replace(/</g,"&lt;"),M=c||y==="camera-overlay";let L="";return y==="kpi-hud"?L=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${v?"p-5":"p-4"} border-t-2" style="border-top-color: ${U};">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-mono uppercase tracking-wider text-teal-400">📊 TELEMETRÍA PREVENTIVA</span>
          <span class="text-[11px] font-mono font-bold text-emerald-400">▲ +98.4% EFECTIVIDAD</span>
        </div>
        <h1 class="${v?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight text-white">
          ${$}
        </h1>
        <p class="text-xs text-slate-300 mt-1">${h}</p>
        <div class="mt-4 space-y-2.5">
          <div>
            <div class="flex justify-between text-[11px] font-bold mb-1">
              <span class="text-slate-300">Controles Operativos Verificados</span>
              <span class="text-teal-300 font-mono">96%</span>
            </div>
            <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div id="accent-bar" class="h-full rounded-full" style="width: 96%; background: linear-gradient(90deg, ${U}, #34d399);"></div>
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
      </div>`:y==="alert-sst"?L=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${v?"p-5":"p-4"} border-l-4" style="border-left-color: #f59e0b;">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-2">
          ⚠️ PROTOCOLO OBLIGATORIO EN PLANTA
        </div>
        <h1 class="${v?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight text-white">
          ${$}
        </h1>
        <p class="text-xs text-slate-300 mt-1">${h}</p>
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
      </div>`:y==="camera-overlay"?L=`
      <div class="my-auto"></div>
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-2xl p-4 border-l-4" style="border-left-color: ${U};">
        <div class="text-[10px] font-mono uppercase tracking-widest text-teal-300 font-extrabold">${H}</div>
        <h1 class="text-lg sm:text-xl font-black text-white leading-snug mt-0.5">${$}</h1>
        <p class="text-xs text-slate-300 mt-0.5">${h}</p>
      </div>`:L=`
      <div id="hero-card" data-editable="true" class="w-full glass-card rounded-3xl ${v?"p-5 sm:p-6":"p-4 sm:p-5"} border-l-4" style="border-left-color: ${U};">
        <div class="text-xs font-mono uppercase tracking-wider text-teal-400 mb-1">⚡ PUNTO CLAVE EN VIVO</div>
        <h1 class="${v?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black leading-tight tracking-tight text-white">
          ${$}
        </h1>
        <p class="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed font-medium">
          ${h}
        </p>
        <div class="mt-3.5 h-1.5 w-full bg-slate-800/90 rounded-full overflow-hidden">
          <div id="accent-bar" class="h-full rounded-full" style="width: 100%; background: linear-gradient(90deg, ${U}, #fbbf24);"></div>
        </div>
      </div>

      <div class="w-full grid grid-cols-3 gap-2 sm:gap-2.5" id="metrics-row">
        <div data-editable="true" class="metric-item glass-card rounded-2xl ${v?"p-2.5 sm:p-3":"p-2.5"} text-center">
          <div class="${v?"text-base sm:text-lg":"text-sm sm:text-base"} font-black text-emerald-400">100%</div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">Cumplimiento</div>
        </div>
        <div data-editable="true" class="metric-item glass-card rounded-2xl ${v?"p-2.5 sm:p-3":"p-2.5"} text-center">
          <div class="${v?"text-base sm:text-lg":"text-sm sm:text-base"} font-black text-amber-400">60 FPS</div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">Motion HTML</div>
        </div>
        <div data-editable="true" class="metric-item glass-card rounded-2xl ${v?"p-2.5 sm:p-3":"p-2.5"} text-center">
          <div class="${v?"text-base sm:text-lg":"text-sm sm:text-base"} font-black text-indigo-400">IA 3.8</div>
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
      background: ${M?"transparent":"#060d14"};
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
<body class="relative w-full h-full flex flex-col justify-between items-center ${v?"p-4 sm:p-5":"p-4 sm:p-6"} select-none overflow-hidden">
  ${M?"<!-- Fondo transparente para dejar ver el video base del usuario -->":`<div class="absolute inset-0 overflow-hidden pointer-events-none">
           <div class="absolute inset-0 grid-bg"></div>
           <div id="orb-1" class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-35" style="background: ${U};"></div>
           <div id="orb-2" class="absolute bottom-8 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25" style="background: #6366f1;"></div>
         </div>`}

  <!-- TOP HUD BAR (100% centrado con ancho completo de contenedor) -->
  <div id="top-bar" data-editable="true" class="relative z-10 w-full ${v?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-between gap-2 shrink-0">
    <div class="glass-card px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 whitespace-nowrap">
      <span class="w-2.5 h-2.5 rounded-full animate-ping shrink-0" style="background: ${U};"></span>
      <span class="text-[11px] font-extrabold tracking-widest uppercase text-teal-300">${H}</span>
    </div>
    <div class="glass-card px-3 py-1.5 rounded-full text-[11px] font-mono font-bold text-slate-300 whitespace-nowrap shrink-0">
      WAPPY STUDIO • IA
    </div>
  </div>

  <!-- ESCENA CENTRAL: TARJETAS ANIMADAS (100% centrado matemáticamente con max-w y mx-auto) -->
  <div class="relative z-10 my-auto w-full ${v?"max-w-md":"max-w-2xl"} mx-auto flex flex-col gap-3 sm:gap-3.5 items-stretch">
    ${L}
  </div>

  <!-- ESPACIO INFERIOR RESERVADO PARA SUBTÍTULOS DINÁMICOS -->
  <div class="relative z-10 ${v?"h-14":"h-12"} shrink-0 w-full"></div>

  <script>
    const tl = gsap.timeline({ repeat: 0 });
    window.mainTimeline = tl;

    tl.from("#top-bar", { y: -25, opacity: 0, duration: 0.55, ease: "back.out(1.7)" })
      .from("#hero-card", { scale: 0.94, y: 24, opacity: 0, duration: 0.65, ease: "back.out(1.5)" }, "-=0.25")
      .from(".metric-item", { y: 20, opacity: 0, stagger: 0.12, duration: 0.5, ease: "back.out(1.7)" }, "-=0.35")
      .to("#hero-card", { y: -4, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: 3 });
  <\/script>
</body>
</html>`}function ks(l){if(!l)return"";if(l.includes('id="wappy-studio-runtime-bridge"'))return l;const c=`<script id="wappy-studio-gsap-hook">
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
<\/script>`,R=`<style id="wappy-studio-bridge-styles">
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
<\/script>`;let b=l;return b.includes("<head>")?b=b.replace("<head>",`<head>
${c}`):b=`${c}
${b}`,b.includes("</body>")?b=b.replace("</body>",`${R}
</body>`):b=`${b}
${R}`,b}const ua="wappy_studio_audio_library";function W(l){const c=l||localStorage.getItem("token")||"";return{"Content-Type":"application/json",...c?{Authorization:`Bearer ${c}`}:{}}}async function te(l){const c=await l.text();try{return JSON.parse(c)}catch{throw l.status===401||c.trim()==="Unauthorized"?new Error("Tu sesión está actualizándose. Intenta nuevamente en un segundo."):new Error(c.slice(0,180)||`Error del servidor (${l.status})`)}}function Ns(l){const c=Math.max(1,Math.round(l||0)),R=Math.floor(c/60),b=c%60;return`${R}m ${b}s`}function Ss(l){try{return new Date(l).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return""}}function rr(){var na;const{user:l,token:c,isAuthenticated:R}=xs(),{data:b}=ms(),B=Za(),U=(B==null?void 0:B.navVisible)??!0,y=(B==null?void 0:B.setNavVisible)??(()=>{}),[v,H]=us(),$=v.get("tab")||"tts",[h,M]=n.useState(["tts","video","lab","library"].includes($)?$:"tts"),[L,Oe]=n.useState(()=>{var t,a;return((a=(t=l==null?void 0:l.personalization)==null?void 0:t.geminiModels)==null?void 0:a.sstManagement)||(fs.GOOGLE_MODELS||"gemini-3.6-flash").split(",")[0].trim()}),[ce,Se]=n.useState(()=>Object.values(wt)),[D,se]=n.useState(()=>ys),[et,Re]=n.useState(()=>vs),[Ue,j]=n.useState(()=>ws),[f,J]=n.useState("gemini-3.8-flash-tts"),[x,pe]=n.useState("Kore"),[re,Te]=n.useState("Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido."),[ue,tt]=n.useState(!1),[$e,Nt]=n.useState("Puck"),[Fe,St]=n.useState("Kore"),[xe,ga]=n.useState(150),[k,Ee]=n.useState(jt[0].text),[at,ha]=n.useState("Voz expresiva, tono conversacional y alegre."),[Z,fa]=n.useState("Hola. Hoy quiero demostrarte cómo suena una respiración natural <breath> y cómo reacciono con una pequeña risa <laugh> cuando algo resulta verdaderamente sorprendente."),[Tt,Et]=n.useState(!1),[ya,Ct]=n.useState(null),[zt,va]=n.useState(0),[wa,ja]=n.useState(0),[st,_e]=n.useState(.5),[rt,Be]=n.useState(1),[nt,At]=n.useState(!1),[Pt,Mt]=n.useState(!1),[ka,Lt]=n.useState(null),[E,ne]=n.useState(null),Ce=n.useRef(null),[He,Na]=n.useState("all"),[We,Dt]=n.useState("only_active"),[it,Sa]=n.useState(""),[ot,Ta]=n.useState(!1),[p,G]=n.useState(null),[ge,ze]=n.useState(()=>{try{const t=localStorage.getItem(ua);return t?JSON.parse(t):[]}catch{return[]}}),[T,It]=n.useState("9:16"),[Ge,Ea]=n.useState("golden-rules"),[he,Ca]=n.useState("bottom"),[Vt,Ot]=n.useState(!1),[A,Rt]=n.useState(null),[Ut,$t]=n.useState(""),[qe,za]=n.useState(!1),[me,Ft]=n.useState(null),[_t,Bt]=n.useState(""),[K,Aa]=n.useState(!0),[Ht,Pa]=n.useState("CÁPSULA INTERACTIVA WAPPY"),[lt,Ma]=n.useState("5 Reglas de Oro en Riesgo Eléctrico"),[Wt,La]=n.useState("Prevención inteligente y locución neural sincronizada"),[Gt,Da]=n.useState("#14b8a6"),[qt,Ia]=n.useState("Crea una animación estilo Claude con tarjetas de cristal sobre las 5 reglas de oro de riesgo eléctrico, iconos luminosos y barras de progreso."),[Ye,Yt]=n.useState(!1),[dt,Va]=n.useState(!1),[Ae,Pe]=n.useState(()=>pa({aspectRatio:"9:16",hasBaseVideo:!1,badgeText:"CÁPSULA INTERACTIVA WAPPY",headline:"5 Reglas de Oro en Riesgo Eléctrico",subheadline:"Prevención inteligente y locución neural sincronizada",accentColor:"#14b8a6",templateId:"golden-rules"})),[X,fe]=n.useState(!0),[be,ie]=n.useState(0),[I,ct]=n.useState(20),[pt,Oa]=n.useState(!1),[P,Je]=n.useState(!1),[V,ut]=n.useState(null),Q=n.useRef(""),[Me,Jt]=n.useState(!1),[Ke,Xe]=n.useState(!1),[ye,g]=n.useState(null),w=n.useRef(null),F=n.useRef(null),_=n.useRef(null),Kt=n.useRef(null),Ra=n.useMemo(()=>ks(Ae),[Ae]);n.useEffect(()=>{const t=()=>{const a=!!document.fullscreenElement;Oa(a),setTimeout(()=>{var s,r;(r=(s=w.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},80),setTimeout(()=>{var s,r;(r=(s=w.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},300)};return document.addEventListener("fullscreenchange",t),()=>document.removeEventListener("fullscreenchange",t)},[]),n.useEffect(()=>{const t=a=>{const s=a.data||{};s.type==="STUDIO_ELEMENT_SELECTED"?ut(s.payload||null):s.type==="STUDIO_HTML_UPDATED"&&typeof s.htmlCode=="string"&&(Q.current=s.htmlCode)};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[]),n.useEffect(()=>{try{localStorage.setItem(ua,JSON.stringify(ge.slice(0,15)))}catch{}},[ge]),n.useEffect(()=>{var a;const t=(a=b==null?void 0:b[bs.google])==null?void 0:a.models;if(Array.isArray(t)&&t.length>0){const s=t.map(r=>(typeof r=="string"?r:(r==null?void 0:r.id)||(r==null?void 0:r.value)||"").replace("models/","").trim()).filter(r=>r&&r.includes("tts"));s.length>0&&Se(r=>{const o=new Map(r.map(i=>[i.id,i]));return s.map(i=>wt[i]||o.get(i)||{id:i,name:i,badge:"GOOGLE_MODELS",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:`Modelo TTS cargado desde GOOGLE_MODELS (${i}).`,supportsMultiSpeaker:!i.includes("lite"),supportsVocalBursts:!i.includes("2.5"),supportedVoices:wt["gemini-3.8-flash-tts"].supportedVoices})})}},[b]),n.useEffect(()=>{fetch("/api/studio/catalog",{headers:W(c)}).then(t=>t.ok?t.json():null).then(t=>{t&&(Array.isArray(t.models)&&t.models.length>0&&Se(t.models),Array.isArray(t.voices)&&t.voices.length>0&&se(t.voices),Array.isArray(t.presets)&&t.presets.length>0&&Re(t.presets),Array.isArray(t.vocalBursts)&&t.vocalBursts.length>0&&j(t.vocalBursts))}).catch(()=>{})},[c]),n.useEffect(()=>{const t=k.trim(),a=t?t.split(/\s+/).filter(Boolean).length:0;if(va(a),ja(t.length),!t){_e(0),Be(0);return}const s=setTimeout(()=>{fetch("/api/studio/tts/estimate",{method:"POST",headers:W(c),body:JSON.stringify({text:t,maxWordsPerChunk:xe})}).then(r=>r.ok?r.json():null).then(r=>{r&&typeof r.estimatedMinutes=="number"?_e(r.estimatedMinutes):_e(Math.round(a/145*10)/10),r&&typeof r.chunkCount=="number"?Be(r.chunkCount):Be(Math.max(1,Math.ceil(a/xe)))}).catch(()=>{_e(Math.round(a/145*10)/10),Be(Math.max(1,Math.ceil(a/xe)))})},250);return()=>clearTimeout(s)},[k,xe,c]);const ve=t=>{M(t),H({tab:t})},S=n.useMemo(()=>ce.find(t=>t.id===f)||ce[0],[ce,f]),Le=t=>S!=null&&S.supportedVoices?S.supportedVoices.includes(t):!0,Ua=n.useMemo(()=>D.filter(t=>{const a=Le(t.id),s=We==="all"||a,r=He==="all"||t.gender===He,o=it.trim().toLowerCase(),i=!o||t.name.toLowerCase().includes(o)||t.tone.toLowerCase().includes(o)||t.recommendedFor.toLowerCase().includes(o)||t.tag&&t.tag.toLowerCase().includes(o);return s&&r&&i}),[D,S,We,He,it]),$a=async(t,a)=>{a==null||a.stopPropagation();try{Lt(t);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:W(c),body:JSON.stringify({voiceName:t,model:Le(t)?f:"gemini-3.8-flash-tts",text:`Hola, soy ${t}. Esta es una muestra de voz neural en WAPPY Studio para tus cápsulas y cursos.`})}),r=await te(s);if(!s.ok||!r.success)throw new Error(r.error||"No se pudo sintetizar la muestra.");G({base64:r.audioBase64,title:`Muestra de Voz: ${t}`,durationSeconds:r.durationSeconds,voiceName:t})}catch(s){g({type:"error",text:s.message||"Error en audición de voz."})}finally{Lt(null)}},Fa=async()=>{try{Mt(!0),g(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:W(c),body:JSON.stringify({voiceName:x,model:f,text:"¡Conexión verificada con éxito! El motor de voz Gemini 3.8 Flash TTS en WAPPY Studio está listo."})}),a=await te(t);if(!t.ok||!a.success)throw new Error(a.error||"Error probando conexión.");G({base64:a.audioBase64,title:`Prueba de Conexión (${x})`,durationSeconds:a.durationSeconds,voiceName:x}),g({type:"success",text:`¡Conexión activa con ${a.usedModel||f}! Audio sintetizado correctamente.`})}catch(t){g({type:"error",text:t.message||"Error de conexión con Gemini TTS."})}finally{Mt(!1)}},_a=async()=>{if(k.trim())try{At(!0),g(null);const t=k.trim().slice(0,750),a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:W(c),body:JSON.stringify({text:t,voiceName:x,stylePrompt:re,model:f,multiSpeaker:ue,speaker1:{name:"Alex",voiceName:$e},speaker2:{name:"Sam",voiceName:Fe}})}),s=await te(a);if(!a.ok||!s.success)throw new Error(s.error||"Error al sintetizar vista previa.");G({base64:s.audioBase64,title:`Vista Previa: ${t.slice(0,38)}...`,durationSeconds:s.durationSeconds,voiceName:x,scriptText:t});const r={id:Date.now().toString(),title:`Vista Previa: ${t.slice(0,42)}...`,createdAt:Date.now(),voiceName:x,model:s.usedModel||f,durationSeconds:s.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,audioBase64:s.audioBase64,stylePrompt:re,scriptText:t};ze(o=>[r,...o]),g({type:"success",text:"Audio generado y cargado en el reproductor. Puedes descargarlo en WAV o enviarlo al Compositor de Video."})}catch(t){g({type:"error",text:t.message||"Error sintetizando fragmento."})}finally{At(!1)}},Ba=async()=>{if(Z.trim())try{Et(!0),g(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:W(c),body:JSON.stringify({text:Z.trim(),voiceName:x,stylePrompt:at,model:f})}),a=await te(t);if(!t.ok||!a.success)throw new Error(a.error||"Error al sintetizar en el laboratorio.");G({base64:a.audioBase64,title:`Laboratorio (${x}): ${Z.trim().slice(0,34)}...`,durationSeconds:a.durationSeconds,voiceName:x,scriptText:Z.trim()});const s={id:Date.now().toString(),title:`Laboratorio: ${Z.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:x,model:a.usedModel||f,durationSeconds:a.durationSeconds,wordCount:Z.trim().split(/\s+/).filter(Boolean).length,audioBase64:a.audioBase64,stylePrompt:at,scriptText:Z.trim()};ze(r=>[s,...r])}catch(t){g({type:"error",text:t.message||"Error sintetizando prueba en el laboratorio."})}finally{Et(!1)}},Ha=async()=>{if(k.trim())try{g(null),Ce.current&&Ce.current.close();const t=await fetch("/api/studio/tts/jobs",{method:"POST",headers:W(c),body:JSON.stringify({text:k,voiceName:x,stylePrompt:re,model:f,multiSpeaker:ue,speaker1:{name:"Alex",voiceName:$e},speaker2:{name:"Sam",voiceName:Fe},maxWordsPerChunk:xe})}),a=await te(t);if(!t.ok)throw new Error(a.error||"No se pudo iniciar el trabajo de larga duración.");const s={id:a.jobId,status:"processing",totalChunks:a.totalChunks,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:a.estimatedTotalSeconds,generatedTotalSeconds:0,progressPercent:0,chunks:Array.from({length:a.totalChunks},(o,i)=>({index:i,wordCount:0,status:"pending"}))};ne(s);const r=new EventSource(`/api/studio/tts/jobs/${a.jobId}/stream${c?`?token=${encodeURIComponent(c)}`:""}`);Ce.current=r,r.addEventListener("snapshot",o=>{const i=JSON.parse(o.data);ne(d=>d?{...d,...i}:i)}),r.addEventListener("chunk_start",o=>{const i=JSON.parse(o.data);ne(d=>{if(!d)return null;const u=[...d.chunks];return u[i.chunkIndex]&&(u[i.chunkIndex]={...u[i.chunkIndex],status:"processing"}),{...d,currentChunkIndex:i.chunkIndex,chunks:u}})}),r.addEventListener("chunk_complete",o=>{const i=JSON.parse(o.data);ne(d=>{if(!d)return null;const u=[...d.chunks];u[i.chunkIndex]&&(u[i.chunkIndex]={...u[i.chunkIndex],status:"completed",durationSeconds:i.durationSeconds,audioBase64:i.audioBase64});const C=u.filter(ee=>ee.status==="completed").length;return{...d,completedChunks:C,progressPercent:i.progressPercent,generatedTotalSeconds:i.generatedTotalSeconds,chunks:u}})}),r.addEventListener("job_completed",o=>{const i=JSON.parse(o.data);r.close(),ne(u=>u?{...u,status:"completed",progressPercent:100,downloadUrl:i.downloadUrl}:null),G({url:i.downloadUrl,title:`Audio Completo: ${k.trim().slice(0,35)}...`,durationSeconds:i.totalDurationSeconds,voiceName:x,scriptText:k});const d={id:i.id,title:`Audio Completo: ${k.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:x,model:f,durationSeconds:i.totalDurationSeconds,wordCount:zt,downloadUrl:i.downloadUrl,stylePrompt:re,scriptText:k};ze(u=>[d,...u])}),r.addEventListener("job_failed",o=>{const i=JSON.parse(o.data);r.close(),ne(d=>d?{...d,status:"failed",error:i.error}:null)}),r.addEventListener("job_status",o=>{const i=JSON.parse(o.data);ne(d=>d?{...d,status:i.status}:null)})}catch(t){g({type:"error",text:t.message||"Error iniciando trabajo."})}},xt=async t=>{E&&(t==="cancel"&&Ce.current&&Ce.current.close(),await fetch(`/api/studio/tts/jobs/${E.id}/control`,{method:"POST",headers:W(c),body:JSON.stringify({action:t})}),ne(a=>a?{...a,status:t==="pause"?"paused":t==="resume"?"processing":"cancelled"}:null))},mt=t=>{const a=document.getElementById("wappy-studio-tts-editor");if(!a){Ee(i=>`${i} ${t}`);return}const s=a.selectionStart,r=a.selectionEnd,o=k.substring(0,s)+t+k.substring(r);Ee(o),setTimeout(()=>{a.focus(),a.setSelectionRange(s+t.length,s+t.length)},15)},we=(t=T,a=!!A,s=Ge)=>{Pe(pa({aspectRatio:t,hasBaseVideo:a,badgeText:Ht,headline:lt,subheadline:Wt,accentColor:Gt,templateId:s}))},Wa=async()=>{const t=(k||lt||"").trim().slice(0,750);if(t)try{Ot(!0),g(null);const a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:W(c),body:JSON.stringify({text:t,voiceName:x,stylePrompt:re,model:f,multiSpeaker:ue,speaker1:{name:"Alex",voiceName:$e},speaker2:{name:"Sam",voiceName:Fe}})}),s=await te(a);if(!a.ok||!s.success)throw new Error(s.error||"No se pudo sintetizar la voz para el video.");G({base64:s.audioBase64,title:`Locución de Video (${x})`,durationSeconds:s.durationSeconds,voiceName:x,scriptText:t}),s.durationSeconds&&s.durationSeconds>1&&ct(s.durationSeconds),ie(0),fe(!0),setTimeout(()=>{var r,o,i,d;(o=(r=w.current)==null?void 0:r.contentWindow)==null||o.postMessage({type:"STUDIO_RESTART"},"*"),(i=_.current)==null||i.play().catch(()=>{}),(d=F.current)==null||d.play().catch(()=>{})},120),g({type:"success",text:`¡Locución neural (${x}) sincronizada automáticamente con el lienzo de video!`})}catch(a){g({type:"error",text:a.message||"Error sincronizando voz con el video."})}finally{Ot(!1)}},Ga=async()=>{try{Yt(!0),g(null);const t=await fetch("/api/studio/video/generate-html",{method:"POST",headers:W(c),body:JSON.stringify({prompt:qt,scriptText:k,aspectRatio:T,hasBaseVideo:!!A,showSubtitles:K,durationSeconds:Math.round((p==null?void 0:p.durationSeconds)||I||25),companyName:(l==null?void 0:l.name)||"WAPPY IA",modelName:L})}),a=await te(t);if(!t.ok||!a.success)throw new Error(a.error||"Error generando composición HTML con IA.");Pe(a.htmlCode),g({type:"success",text:"¡Escena HTML + GSAP generada con éxito! Reproduciendo en el lienzo interactivo."})}catch(t){g({type:"error",text:t.message||"No se pudo generar la escena HTML con IA."})}finally{Yt(!1)}},qa=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;A&&URL.revokeObjectURL(A);const s=URL.createObjectURL(a);Rt(s),$t(a.name),we(T,!0)},Ya=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;me&&URL.revokeObjectURL(me);const s=URL.createObjectURL(a);Ft(s),Bt(a.name)},q=n.useMemo(()=>me||(p!=null&&p.url?p.url:p!=null&&p.base64?`data:audio/wav;base64,${p.base64}`:""),[me,p]);n.useEffect(()=>{if(h!=="video"||!X||P)return;let t=performance.now();const a=setInterval(()=>{const s=performance.now(),r=(s-t)/1e3;t=s;const o=_.current,i=F.current;if(o&&q&&!o.paused&&!o.ended){ie(o.currentTime);return}if(i&&A&&!i.paused&&!i.ended){ie(i.currentTime);return}ie(d=>{var ee,z;const u=Math.max(1,I||20),C=d+r;return C>=u?(fe(!1),(z=(ee=w.current)==null?void 0:ee.contentWindow)==null||z.postMessage({type:"STUDIO_PAUSE"},"*"),u):C})},250);return()=>clearInterval(a)},[h,X,P,I,q,A]);const Xt=()=>{var r,o,i,d,u;const t=Math.max(1,I||20);if(!X&&(be>=t-.3||!!((r=_.current)!=null&&r.ended))){bt();return}const s=!X;s&&P&&(Je(!1),(i=(o=w.current)==null?void 0:o.contentWindow)==null||i.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),fe(s),(u=(d=w.current)==null?void 0:d.contentWindow)==null||u.postMessage({type:s?"STUDIO_PLAY":"STUDIO_PAUSE"},"*"),F.current&&(s?F.current.play().catch(()=>{}):F.current.pause()),_.current&&q&&(s?_.current.play().catch(()=>{}):_.current.pause())},bt=()=>{var t,a,s,r;P&&(Je(!1),(a=(t=w.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),ie(0),fe(!0),(r=(s=w.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_RESTART"},"*"),F.current&&(F.current.currentTime=0,F.current.play().catch(()=>{})),_.current&&q&&(_.current.currentTime=0,_.current.play().catch(()=>{}))},Zt=t=>{var s,r;ie(t);const a=I>0?t/I:0;(r=(s=w.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SEEK",progress:a,time:t},"*"),F.current&&(F.current.currentTime=t),_.current&&q&&(_.current.currentTime=t)},Qt=()=>{var a,s,r,o;const t=!P;Je(t),t?(fe(!1),(a=F.current)==null||a.pause(),(s=_.current)==null||s.pause()):Q.current&&(Pe(Q.current),Q.current=""),(o=(r=w.current)==null?void 0:r.contentWindow)==null||o.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:t},"*")},oe=t=>{var a,s;ut(r=>r&&{...r,...t}),(s=(a=w.current)==null?void 0:a.contentWindow)==null||s.postMessage({type:"STUDIO_UPDATE_SELECTED",updates:t},"*")},Ja=()=>{var t,a;Q.current&&(Pe(Q.current),Q.current=""),Je(!1),ut(null),(a=(t=w.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*"),g({type:"success",text:"¡Cambios de textos y posición de cajas guardados en la composición HTML!"})},ea=()=>{var t,a,s;document.fullscreenElement?(t=document.exitFullscreen)==null||t.call(document).catch(()=>{}):(s=(a=Kt.current)==null?void 0:a.requestFullscreen)==null||s.call(a).catch(()=>{})},le=n.useMemo(()=>((p==null?void 0:p.scriptText)||k||"").replace(/<[^>]+>/g,"").replace(/\|[^|]+\|/g,"").replace(/^(Alex|Sam):\s*/gim,"").split(/\s+/).filter(Boolean),[p==null?void 0:p.scriptText,k]),gt=n.useMemo(()=>{if(!K||le.length===0)return null;const t=Math.max(0,Math.min(.999,be/Math.max(1,I))),a=Math.floor(t*le.length),s=5,r=Math.floor(a/s)*s;return{words:le.slice(r,r+s),activeOffset:a-r}},[K,le,be,I]),ta=async()=>{if(p!=null&&p.base64)return p.base64;if(!q)return null;try{const t=await fetch(q);if(!t.ok)return null;const a=await t.arrayBuffer(),s=new Uint8Array(a);let r="";const o=32768;for(let i=0;i<s.length;i+=o)r+=String.fromCharCode.apply(null,Array.from(s.subarray(i,i+o)));return window.btoa(r)}catch{return null}},aa=async()=>{try{Jt(!0);const t=Math.min(60,Math.max(4,Math.round(I||15))),a=t>20?12:15;g({type:"info",text:`Renderizando Video MP4 con Audio + Animación + Subtítulos (${t}s)... Espera ~15-25 segundos mientras se ensambla el archivo .MP4 para WhatsApp y Celular.`});const s=Q.current||Ae,r=await ta(),o=await fetch("/api/studio/video/render-mp4",{method:"POST",headers:W(c),body:JSON.stringify({htmlCode:s,audioBase64:r,scriptText:(p==null?void 0:p.scriptText)||k,showSubtitles:K,subtitlePosition:he,aspectRatio:T,durationSeconds:t,fps:a})}),i=await te(o);if(!o.ok||!i.success||!i.videoBase64)throw new Error(i.error||"No se pudo renderizar el archivo MP4 en el servidor.");const d=window.atob(i.videoBase64),u=new Array(d.length);for(let De=0;De<d.length;De++)u[De]=d.charCodeAt(De);const C=new Uint8Array(u),ee=new Blob([C],{type:"video/mp4"}),z=URL.createObjectURL(ee),Y=document.createElement("a");Y.href=z,Y.download=`wappy-studio-reel-${Date.now()}.mp4`,document.body.appendChild(Y),Y.click(),document.body.removeChild(Y),URL.revokeObjectURL(z),g({type:"success",text:`¡Video MP4 Universal (${i.width}x${i.height} • H.264 + Audio AAC) descargado con éxito! Listo para enviar por WhatsApp, ver en celular o subir a Reels/TikTok.`})}catch(t){g({type:"error",text:t.message||"Error renderizando MP4 en el servidor."})}finally{Jt(!1)}},Ka=async t=>{var ee;let a=t;const s=z=>z.replace(/<\/script/gi,"<\\/script"),r=async z=>{try{const Y=await fetch(z,{cache:"force-cache"});return Y.ok?await Y.text():""}catch{return""}};let o="";try{const z=(ee=w.current)==null?void 0:ee.contentDocument;z&&Array.from(z.querySelectorAll("style")).forEach(Y=>{if((Y.id||"").startsWith("wappy-studio-bridge"))return;const ht=Y.textContent||"";ht&&!a.includes(ht.slice(0,120))&&(o+=`
${ht}`)})}catch{o=""}const[i,d]=await Promise.all([/gsap(\.min)?\.js/i.test(a)?r("/assets/gsap.min.js"):Promise.resolve(""),/cdn\.tailwindcss\.com|tailwind-cdn\.js/i.test(a)?r("/assets/tailwind-cdn.js"):Promise.resolve("")]);i&&(a=a.replace(/<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-gsap">${s(i)}<\/script>`)),a=a.replace(/<script[^>]*src=["'][^"']*(cdn\.tailwindcss\.com|tailwind-cdn\.js)[^"']*["'][^>]*>\s*<\/script>/gi,()=>"<script>window.tailwind = window.tailwind || {};<\/script>"+(d?`<script id="wappy-inline-tailwind">${s(d)}<\/script>`:""));const u=`
<meta name="color-scheme" content="dark" />
<meta name="format-detection" content="telephone=no" />
<style id="wappy-precompiled-tailwind">${o.replace(/<\/style/gi,"<\\/style")}</style>
<style id="wappy-offline-font-fallback">
  html, body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
</style>
<noscript><style>
  #header-hud, #top-bar, #scene-1, #scene-1 *, #hero-card, .metric-item { opacity: 1 !important; transform: none !important; visibility: visible !important; }
  #wappy-capsule-controls, #wappy-mobile-tap-overlay { display: none !important; }
</style></noscript>`;/<head[^>]*>/i.test(a)?a=a.replace(/<head[^>]*>/i,z=>`${z}${u}`):a=`${u}
${a}`,/<meta[^>]+name=["']viewport/i.test(a)||(a=a.replace(/<head[^>]*>/i,z=>`${z}<meta name="viewport" content="width=device-width, initial-scale=1.0" />`));const C=`<script id="wappy-visibility-guard">
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
<\/script>`;return a=a.includes("</body>")?a.replace("</body>",()=>`${C}
</body>`):`${a}
${C}`,a},sa=async()=>{const t=await Ka(Q.current||Ae),a=await ta(),s=a?`data:audio/wav;base64,${a}`:"",r=Math.max(4,Math.round((I||20)*10)/10),o=`
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
  ${K&&le.length>0?"#subtitle-footer, #subtitle-card { display: none !important; }":""}
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
    ${he==="top"?"top: 54px;":he==="center"?"top: 50%; transform: translateY(-50%);":"bottom: 58px;"}
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
<div id="wappy-capsule-subtitles" style="display:${K&&le.length>0?"flex":"none"};">
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
  var words = ${JSON.stringify(le)};
  var showSubs = ${!!(K&&le.length>0)};
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
${o}`},ra=async()=>{var t,a;try{Xe(!0);const s=await sa(),r=`wappy-academia-capsula-${Date.now()}.html`,o=new Blob([s],{type:"text/html;charset=utf-8"});if(typeof window<"u"&&((t=window.matchMedia)==null?void 0:t.call(window,"(pointer: coarse)").matches)&&typeof navigator.share=="function")try{const C=new File([o],r,{type:"text/html"});if((a=navigator.canShare)!=null&&a.call(navigator,{files:[C]})){await navigator.share({files:[C],title:"Cápsula WAPPY",text:"Cápsula interactiva WAPPY (ábrela tocando el archivo)."}),g({type:"success",text:"¡Cápsula HTML compartida! Funciona sin internet al tocarla en WhatsApp."});return}}catch(C){if((C==null?void 0:C.name)==="AbortError")return}const d=URL.createObjectURL(o),u=document.createElement("a");u.href=d,u.download=r,document.body.appendChild(u),u.click(),document.body.removeChild(u),URL.revokeObjectURL(d),g({type:"success",text:"¡Cápsula HTML autocontenida descargada! Incluye estilos, animación y voz en un solo archivo: envíala por WhatsApp y ábrela tocándola, incluso sin internet."})}finally{Xe(!1)}},Xa=async()=>{try{Xe(!0);const s=`<iframe srcdoc="${(await sa()).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" style="width:100%;max-width:${T==="9:16"?"400px":"860px"};aspect-ratio:${T==="9:16"?"9/16":"16/9"};border:0;border-radius:16px;overflow:hidden;display:block;margin:0 auto;box-shadow:0 20px 50px rgba(0,0,0,0.35);" allow="autoplay; fullscreen"></iframe>`;await navigator.clipboard.writeText(s),g({type:"success",text:"¡Código <iframe srcdoc> copiado al portapapeles! Pégalo directamente en cualquier lección de la Academia WAPPY (LMS)."})}catch{g({type:"error",text:"No se pudo copiar el código embebido al portapapeles."})}finally{Xe(!1)}},je=((na=S==null?void 0:S.supportedVoices)==null?void 0:na.length)||14;return l&&l.role!=="ADMIN"?e.jsx("div",{className:"flex-1 flex items-center justify-center bg-surface-secondary/30 min-h-screen p-6",children:e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md",children:[e.jsx("div",{className:"w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto",children:e.jsx(ia,{className:"w-6 h-6"})}),e.jsx("h2",{className:"text-lg font-extrabold text-text-primary",children:"WAPPY Studio (Acceso Administrador)"}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Por el momento este módulo está habilitado exclusivamente para cuentas de Administración de WAPPY."}),e.jsx("a",{href:"/c/new",className:"inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition",children:"Volver al inicio"})]})}):e.jsxs("div",{className:"flex-1 flex flex-col bg-surface-secondary/30 min-h-screen h-auto overflow-y-auto pb-16",children:[e.jsx("header",{className:"bg-white dark:bg-gray-900 border-b border-border-medium/40 px-4 sm:px-6 py-4 shadow-2xs sticky top-0 z-30",children:e.jsxs("div",{className:"max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[R&&!U&&e.jsx("div",{className:"hidden md:block",children:e.jsx(gs,{setNavVisible:y})}),e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2 mb-1",children:e.jsxs("span",{className:"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wider",children:[e.jsx(de,{className:"w-3 h-3 text-teal-500"}),"Estudio Multimodal • Gemini 3.8 Flash TTS & HyperFrames"]})}),e.jsxs("h1",{className:"text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400",children:[e.jsx(ia,{className:"w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0"}),"WAPPY Studio"]}),e.jsx("p",{className:"text-xs text-text-secondary mt-0.5 hidden sm:block",children:"Síntesis de voz neural de hasta 1 hora continua y creación de videos animados en HTML/GSAP con capas sobre tus propios videos."})]})]}),e.jsxs("div",{className:"flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-nowrap",children:[e.jsxs("div",{className:"inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-x-auto no-scrollbar min-w-0",children:[e.jsxs("button",{type:"button",onClick:()=>ve("tts"),className:m("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",h==="tts"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Ie,{className:"w-3.5 h-3.5 text-teal-500"}),e.jsx("span",{children:"Estudio de Voz (TTS)"})]}),e.jsxs("button",{type:"button",onClick:()=>ve("video"),className:m("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",h==="video"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Ne,{className:"w-3.5 h-3.5 text-purple-500"}),e.jsx("span",{children:"Video HTML & Capas"})]}),e.jsxs("button",{type:"button",onClick:()=>ve("lab"),className:m("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",h==="lab"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(ft,{className:"w-3.5 h-3.5 text-amber-500"}),e.jsx("span",{children:"Voces & Bursts"})]}),e.jsxs("button",{type:"button",onClick:()=>ve("library"),className:m("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",h==="library"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(yt,{className:"w-3.5 h-3.5 text-indigo-500"}),e.jsxs("span",{children:["Biblioteca (",ge.length,")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(hs,{selectedModel:L,onSelectModel:Oe,disabled:Ye}),e.jsx(N,{icon:Pt?e.jsx(O,{className:"animate-spin"}):e.jsx(oa,{}),label:"Probar Audio con IA",variant:"purple",disabled:Pt,onClick:Fa})]})]})]})}),e.jsxs("main",{className:"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6",children:[ye&&e.jsxs("div",{className:m("p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200",ye.type==="success"?"bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200":ye.type==="error"?"bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200":"bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200"),children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[ye.type==="success"?e.jsx(xa,{className:"w-4 h-4 text-emerald-500 shrink-0"}):ye.type==="error"?e.jsx(Qa,{className:"w-4 h-4 text-rose-500 shrink-0"}):e.jsx(O,{className:"w-4 h-4 text-sky-500 animate-spin shrink-0"}),e.jsx("span",{children:ye.text})]}),e.jsx("button",{type:"button",onClick:()=>g(null),className:"p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10",children:e.jsx(ma,{className:"w-3.5 h-3.5"})})]}),p&&e.jsx(Ts,{audioBase64:p.base64,audioUrl:p.url,title:p.title,durationSeconds:p.durationSeconds,voiceName:p.voiceName,onSendToVideo:()=>{ve("video"),g({type:"success",text:"Audio vinculado automáticamente a la pista de locución del Compositor de Video."})}}),h==="tts"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[E&&e.jsx(Es,{job:E,onPause:()=>xt("pause"),onResume:()=>xt("resume"),onCancel:()=>xt("cancel"),onPlayChunk:t=>{t.audioBase64&&G({base64:t.audioBase64,title:`Fragmento #${t.index+1} (${t.durationSeconds||0}s)`,durationSeconds:t.durationSeconds,voiceName:x})},onLoadMaster:()=>{E.downloadUrl&&G({url:E.downloadUrl,title:`Master Completo (${x})`,durationSeconds:E.generatedTotalSeconds,voiceName:x,scriptText:k})}}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",children:[e.jsxs("div",{className:"lg:col-span-5 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"space-y-2.5",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-1.5",children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(es,{className:"w-4 h-4 text-teal-500"}),"Modelo Oficial Gemini TTS"]}),e.jsx("span",{className:"text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full",children:"Verificado en AI Studio"})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:ce.map(t=>{const a=f===t.id;return e.jsxs("button",{type:"button",onClick:()=>{J(t.id),t.supportedVoices.includes(x)||pe(t.supportedVoices[0]||"Kore")},className:m("text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30 shadow-xs":"bg-slate-50/60 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-text-primary",children:t.name}),e.jsx("span",{className:m("text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0",t.badgeColor),children:t.badge})]}),e.jsx("p",{className:"text-[11px] text-text-secondary leading-snug",children:t.description})]}),e.jsxs("div",{className:"mt-2.5 pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-amber-600 dark:text-amber-400 font-bold",children:t.rateLimitLabel||t.quotaLabel}),a?e.jsxs("span",{className:"text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5",children:[e.jsx(Ze,{className:"w-3 h-3"})," Activo (",t.supportedVoices.length," voces)"]}):e.jsxs("span",{className:"text-text-secondary",children:[t.supportedVoices.length," voces"]})]})]},t.id)})}),e.jsxs("div",{className:"px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"text-text-secondary flex items-center gap-1.5",children:[e.jsx(de,{className:"w-3.5 h-3.5 text-teal-500 shrink-0"}),e.jsxs("span",{children:["Voces activas para"," ",e.jsx("strong",{className:"text-text-primary",children:S==null?void 0:S.name}),":"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsxs("span",{className:"font-extrabold text-emerald-600 dark:text-emerald-400",children:[je," de ",D.length," disponibles"]}),je<D.length&&e.jsxs("button",{type:"button",onClick:()=>J("gemini-3.8-flash-tts"),className:"text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer",children:["Mostrar todas (",D.length,")"]})]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"block text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"Estilos y Plantillas Rápidas"}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:et.map(t=>e.jsx("button",{type:"button",onClick:()=>{Le(t.voiceName)||J("gemini-3.8-flash-tts"),t.multiSpeaker?(tt(!0),t.speaker1&&Nt(t.speaker1.voiceName),t.speaker2&&St(t.speaker2.voiceName)):(tt(!1),pe(t.voiceName)),Te(t.style)},className:"text-xs px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/80 hover:border-teal-500/50 hover:bg-teal-500/10 text-text-primary font-semibold transition cursor-pointer",children:t.name},t.id))})]}),e.jsxs("div",{className:"flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/90 rounded-xl border border-slate-200/80 dark:border-zinc-800 gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx(ts,{className:"w-4 h-4 text-teal-500 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-text-primary",children:"Modo Diálogo / Podcast (2 Voces)"}),e.jsxs("p",{className:"text-[11px] text-text-secondary",children:["Alterna interlocutores usando"," ",e.jsx("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:"Alex:"})," ","y"," ",e.jsx("span",{className:"font-mono font-bold text-purple-600 dark:text-purple-400",children:"Sam:"})]})]})]}),e.jsx("button",{type:"button",onClick:()=>tt(!ue),className:m("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",ue?"bg-teal-600":"bg-slate-300 dark:bg-zinc-700"),children:e.jsx("span",{className:m("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",ue?"translate-x-4":"translate-x-0")})})]}),ue?e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-zinc-900/80 rounded-xl border border-slate-200/80 dark:border-zinc-800",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-teal-600 dark:text-teal-400 mb-1",children:"Voz para Alex (Hablante 1)"}),e.jsx("select",{value:$e,onChange:t=>Nt(t.target.value),className:"w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500",children:((S==null?void 0:S.supportedVoices)||[]).map(t=>{const a=D.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-purple-600 dark:text-purple-400 mb-1",children:"Voz para Sam (Hablante 2)"}),e.jsx("select",{value:Fe,onChange:t=>St(t.target.value),className:"w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500",children:((S==null?void 0:S.supportedVoices)||[]).map(t=>{const a=D.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(Ie,{className:"w-3.5 h-3.5 text-teal-500"}),"Catálogo de Voces (",je," activas / ",D.length," totales)"]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-0.5",children:"Las voces no compatibles con la versión seleccionada quedan desactivadas."})]}),e.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px]",children:[e.jsxs("button",{type:"button",onClick:()=>Dt("only_active"),className:m("px-2 py-0.5 rounded-md transition cursor-pointer",We==="only_active"?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:["Solo Activas (",je,")"]}),e.jsxs("button",{type:"button",onClick:()=>Dt("all"),className:m("px-2 py-0.5 rounded-md transition cursor-pointer",We==="all"?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:["Todas (",D.length,")"]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(as,{className:"w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"}),e.jsx("input",{type:"text",value:it,onChange:t=>Sa(t.target.value),placeholder:"Buscar voz (Kore, Orus, profunda, podcast...)",className:"w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-slate-400 focus:outline-none focus:border-teal-500"})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-[11px] shrink-0",children:["all","Femenino","Masculino"].map(t=>e.jsx("button",{type:"button",onClick:()=>Na(t),className:m("px-2 py-1 rounded-lg transition cursor-pointer",He===t?"bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-300 font-bold shadow-2xs":"text-text-secondary hover:text-text-primary"),children:t==="all"?"Todas":t==="Femenino"?"Femeninas":"Masculinas"},t))})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1",children:Ua.map(t=>{const a=x===t.id,s=ka===t.id,r=Le(t.id);return e.jsxs("div",{onClick:()=>{r||J("gemini-3.8-flash-tts"),pe(t.id)},className:m("p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30 shadow-xs":"bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200/80 dark:border-zinc-800 hover:border-teal-400",!r&&"opacity-60"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-start justify-between gap-1",children:[e.jsx("span",{className:"text-sm font-extrabold text-text-primary",children:t.name}),e.jsx("button",{type:"button",onClick:o=>$a(t.id,o),disabled:s,title:"Escuchar muestra de esta voz",className:"p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer",children:s?e.jsx(O,{className:"w-3 h-3 animate-spin"}):e.jsx(ae,{className:"w-3 h-3 fill-current"})})]}),e.jsxs("div",{className:"flex items-center gap-1 flex-wrap mt-1",children:[e.jsx("span",{className:"text-[9px] font-semibold text-text-secondary bg-slate-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded",children:t.gender}),r?e.jsx("span",{className:"text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded",children:"✓ Activa"}):e.jsx("span",{className:"text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded",children:"Solo 3.8/3.1"})]}),e.jsx("p",{className:"text-[11px] text-teal-700 dark:text-teal-300 font-semibold mt-1 leading-tight",children:t.tone}),t.tag&&e.jsx("span",{className:"inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20",children:t.tag})]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-2 pt-1.5 border-t border-slate-200/60 dark:border-zinc-800 line-clamp-2 leading-tight",children:t.recommendedFor})]},t.id)})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"Directiva de Estilo y Emoción"}),e.jsx("span",{className:"text-[10px] font-mono text-text-secondary",children:"speechMetadata.style"})]}),e.jsx("textarea",{rows:2,value:re,onChange:t=>Te(t.target.value),placeholder:"Ej: Voz cálida, pausada y reflexiva de narrador de documentales...",className:"w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{children:[e.jsxs("button",{type:"button",onClick:()=>Ta(!ot),className:"flex items-center justify-between w-full text-xs text-text-secondary hover:text-text-primary font-bold py-1 transition cursor-pointer",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(ss,{className:"w-3.5 h-3.5 text-teal-500"}),"Configuración Avanzada de Segmentación (Chunking)"]}),e.jsx("span",{children:ot?"▲":"▼"})]}),ot&&e.jsxs("div",{className:"mt-2 p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2 text-xs",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{className:"text-text-secondary",children:"Palabras por fragmento"}),e.jsxs("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:[xe," palabras"]})]}),e.jsx("input",{type:"range",min:80,max:250,step:10,value:xe,onChange:t=>ga(parseInt(t.target.value,10)),className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-teal-600"}),e.jsx("p",{className:"text-[10px] text-text-secondary",children:"Fragmentos de ~150 palabras (~55s de audio) garantizan fluidez continua para audiolibros de hasta 60 minutos."})]})]})]}),e.jsxs("div",{className:"lg:col-span-7 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"flex items-center justify-between gap-3 flex-nowrap",children:[e.jsxs("h2",{className:"text-sm font-extrabold text-text-primary flex items-center gap-2 shrink-0",children:[e.jsx(Ie,{className:"w-4 h-4 text-teal-500"}),"Texto a Sintetizar"]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0 flex-nowrap",children:[e.jsx("span",{className:"text-xs text-text-secondary hidden sm:inline",children:"Cargar ejemplo:"}),e.jsxs("select",{defaultValue:"",onChange:t=>{const a=jt.find(s=>s.title===t.target.value);a&&Ee(a.text),t.target.value=""},className:"bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-primary text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500",children:[e.jsx("option",{value:"",disabled:!0,children:"Seleccionar texto de muestra..."}),jt.map(t=>e.jsx("option",{value:t.title,children:t.title},t.title))]}),k&&e.jsx(N,{size:"sm",icon:e.jsx(ke,{}),label:"Limpiar",variant:"danger",onClick:()=>Ee("")})]})]}),e.jsxs("div",{className:"p-3 bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-xl space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px]",children:[e.jsxs("span",{className:"font-bold text-text-secondary flex items-center gap-1",children:[e.jsx(de,{className:"w-3.5 h-3.5 text-amber-500"}),"Insertar Efectos Vocales (Vocal Bursts) en el cursor:"]}),e.jsx("span",{className:"font-mono text-[10px] text-teal-600 dark:text-teal-400 font-bold",children:f})]}),e.jsxs("div",{className:"flex flex-wrap gap-1.5",children:[Ue.map(t=>e.jsxs("button",{type:"button",onClick:()=>mt(` ${t.tag} `),title:t.description,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-teal-500/10 border border-slate-200 dark:border-zinc-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer",children:[e.jsx("span",{className:"text-amber-600 dark:text-amber-400 font-bold",children:t.tag}),e.jsxs("span",{className:"text-text-secondary text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),e.jsx("button",{type:"button",onClick:()=>mt(`
Alex: `),className:"px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold transition cursor-pointer",children:"Alex:"}),e.jsx("button",{type:"button",onClick:()=>mt(`
Sam: `),className:"px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold transition cursor-pointer",children:"Sam:"})]})]}),e.jsx("textarea",{id:"wappy-studio-tts-editor",rows:12,value:k,onChange:t=>Ee(t.target.value),placeholder:"Escribe o pega aquí el guion para tu cápsula SST, curso de Academia WAPPY, podcast o audiolibro de hasta 1 hora...",className:"w-full bg-slate-50/70 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 text-sm text-text-primary placeholder-slate-400 focus:outline-none focus:border-teal-500 leading-relaxed resize-y min-h-[260px]"}),e.jsxs("div",{className:"bg-slate-50 dark:bg-zinc-900/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between text-xs gap-2",children:[e.jsxs("div",{className:"flex items-center gap-3 text-text-secondary",children:[e.jsxs("span",{children:["Palabras:"," ",e.jsx("strong",{className:"text-text-primary font-mono",children:zt})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Caracteres:"," ",e.jsx("strong",{className:"text-text-primary font-mono",children:wa})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Fragmentos estimados:"," ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400 font-mono",children:rt})]})]}),e.jsxs("div",{className:"text-text-primary font-semibold",children:["Duración estimada:"," ",e.jsxs("strong",{className:"text-amber-600 dark:text-amber-400 font-mono",children:["~",st," min"]})," ","/ 60 min máx"]})]}),e.jsx("div",{className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,Math.round(st/60*100)))}%`}})})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1",children:[e.jsxs("button",{type:"button",onClick:_a,disabled:nt||(E==null?void 0:E.status)==="processing"||!k.trim(),className:"flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[nt?e.jsx(O,{className:"w-4 h-4 animate-spin text-teal-500"}):e.jsx(oa,{className:"w-4 h-4 text-amber-500"}),e.jsx("span",{children:"Vista Previa Rápida (~1er fragmento)"})]}),e.jsxs("button",{type:"button",onClick:Ha,disabled:(E==null?void 0:E.status)==="processing"||nt||!k.trim(),className:"flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[(E==null?void 0:E.status)==="processing"?e.jsx(O,{className:"w-4 h-4 animate-spin"}):e.jsx(ae,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:rt>1?`Generar Audio Completo (${rt} fragmentos • ~${st} min)`:"Generar Audio Completo"})]})]})]})]})]}),h==="video"&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200",children:[e.jsxs("div",{className:"lg:col-span-6 space-y-5 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsx("div",{className:"flex items-center justify-between gap-2",children:e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-text-primary flex items-center gap-2",children:[e.jsx(Ne,{className:"w-5 h-5 text-purple-500"}),"Estudio de Capas & Motion Graphics HTML"]}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Sube tu propio video grabado a cámara o genera animaciones estilo Claude/HeyGen sincronizadas con tu voz."})]})}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",onClick:()=>{It("9:16"),we("9:16",!!A,Ge)},className:m("p-3 rounded-xl border text-left transition cursor-pointer",T==="9:16"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-text-primary",children:"📱 Vertical 9:16 (Reels / TikTok)"}),e.jsx("div",{className:"text-[10px] text-text-secondary mt-0.5",children:"1080 × 1920 px • Ideal para redes y WhatsApp"})]}),e.jsxs("button",{type:"button",onClick:()=>{It("16:9"),we("16:9",!!A,Ge)},className:m("p-3 rounded-xl border text-left transition cursor-pointer",T==="16:9"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-text-primary",children:"🖥️ Horizontal 16:9 (YouTube / LMS)"}),e.jsx("div",{className:"text-[10px] text-text-secondary mt-0.5",children:"1920 × 1080 px • Ideal para cursos Academia WAPPY"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(de,{className:"w-3.5 h-3.5 text-teal-500"}),"Plantillas Visuales Instantáneas (HyperFrames)"]}),e.jsx("span",{className:"text-[10px] text-text-secondary",children:"Clic para aplicar"})]}),e.jsx("div",{className:"grid grid-cols-2 gap-2",children:js.map(t=>{const a=Ge===t.id;return e.jsxs("button",{type:"button",onClick:()=>{Ea(t.id),we(T,!!A,t.id)},className:m("p-2.5 rounded-xl border text-left transition cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50/70 dark:bg-zinc-900/70 border-slate-200 dark:border-zinc-800 hover:border-teal-400"),children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-text-primary truncate",children:t.name}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0",children:t.badge})]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-0.5 line-clamp-1",children:t.description})]},t.id)})})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3",children:[e.jsxs("div",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-1.5",children:[e.jsx(ft,{className:"w-4 h-4 text-teal-500"}),"Capas Base Multimedia (Video a Cámara + Locución)"]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{className:"p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-text-primary",children:"1. Tu Video Base (Opcional)"}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:Ut?`Activo: ${Ut}`:"Sube un MP4/WebM tuyo para montarle capas HTML encima."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(la,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Video MP4"}),e.jsx("input",{type:"file",accept:"video/mp4,video/webm,video/quicktime",onChange:qa,className:"hidden"})]}),A&&e.jsx(N,{size:"sm",icon:e.jsx(ke,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(A),Rt(null),$t(""),we(T,!1)}})]})]}),e.jsxs("div",{className:"p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-text-primary",children:"2. Audio / Locución Sincronizada"}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:_t?`Archivo: ${_t}`:p?`Vinculado: ${p.title}`:"Usa el audio del Estudio TTS o sube un WAV/MP3."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(la,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Audio WAV/MP3"}),e.jsx("input",{type:"file",accept:"audio/*",onChange:Ya,className:"hidden"})]}),me&&e.jsx(N,{size:"sm",icon:e.jsx(ke,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(me),Ft(null),Bt("")}})]})]})]})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-primary",children:"3. Textos de Capa y Subtítulos Dinámicos"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:K,onChange:t=>Aa(t.target.checked),className:"rounded accent-teal-600"}),"Subtítulos"]}),K&&e.jsx("div",{className:"inline-flex items-center gap-0.5 bg-white dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[10px]",children:[{id:"bottom",label:"Abajo"},{id:"center",label:"Centro"},{id:"top",label:"Arriba"}].map(t=>e.jsx("button",{type:"button",onClick:()=>Ca(t.id),className:m("px-1.5 py-0.5 rounded transition cursor-pointer",he===t.id?"bg-teal-600 text-white font-bold":"text-text-secondary hover:text-text-primary"),children:t.label},t.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Insignia Superior (Badge)"}),e.jsx("input",{type:"text",value:Ht,onChange:t=>Pa(t.target.value),className:"w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Color de Acento"}),e.jsx("div",{className:"flex items-center gap-2",children:["#14b8a6","#10b981","#6366f1","#f59e0b","#f43f5e"].map(t=>e.jsx("button",{type:"button",onClick:()=>Da(t),style:{backgroundColor:t},className:m("w-6 h-6 rounded-full border-2 transition cursor-pointer",Gt===t?"border-white ring-2 ring-teal-500 scale-110":"border-transparent opacity-80")},t))})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Titular Principal en Pantalla"}),e.jsx("input",{type:"text",value:lt,onChange:t=>Ma(t.target.value),className:"w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary font-bold"})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("input",{type:"text",value:Wt,onChange:t=>La(t.target.value),placeholder:"Subtítulo secundario...",className:"flex-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-text-primary"}),e.jsx(N,{icon:e.jsx(rs,{}),label:"Aplicar al Lienzo",variant:"cyan",onClick:()=>we(T,!!A)})]})]}),e.jsxs("div",{className:"p-4 bg-purple-500/5 border border-purple-500/25 rounded-2xl space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx(ns,{className:"w-4 h-4 text-purple-500"}),"Generador IA de Animación HTML + GSAP (Estilo Claude)"]}),e.jsxs("button",{type:"button",onClick:()=>Va(!dt),className:"text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer",children:[e.jsx(is,{className:"w-3.5 h-3.5"}),dt?"Ocultar Código HTML":"Editar Código HTML"]})]}),e.jsx("textarea",{rows:2,value:qt,onChange:t=>Ia(t.target.value),placeholder:"Describe qué gráficos animados, tarjetas, alertas o diagramas quieres que la IA programe en HTML + GSAP...",className:"w-full bg-white dark:bg-zinc-900 border border-purple-500/30 rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-purple-500 resize-none"}),e.jsx("div",{className:"flex justify-end",children:e.jsxs("button",{type:"button",onClick:Ga,disabled:Ye,className:"flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50 cursor-pointer",children:[Ye?e.jsx(O,{className:"w-4 h-4 animate-spin"}):e.jsx(de,{className:"w-4 h-4"}),e.jsx("span",{children:Ye?"Diseñando Escena HTML + GSAP...":"Generar Animación HTML con IA"})]})}),dt&&e.jsxs("div",{className:"pt-2",children:[e.jsx("label",{className:"block text-[10px] font-mono uppercase text-text-secondary mb-1",children:"Código Fuente HTML5 / Tailwind / GSAP en Vivo:"}),e.jsx("textarea",{rows:10,value:Ae,onChange:t=>Pe(t.target.value),className:"w-full bg-slate-950 text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500"})]})]})]}),e.jsxs("div",{className:"lg:col-span-6 space-y-4 bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-nowrap",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[e.jsx("span",{className:m("w-2.5 h-2.5 rounded-full shrink-0",P?"bg-amber-500 animate-ping":X?"bg-emerald-500 animate-pulse":"bg-slate-400")}),e.jsx("h3",{className:"text-sm font-extrabold text-text-primary truncate",children:P?`Editor Visual (${T})`:`Lienzo Interactivo (${T})`})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(N,{size:"sm",icon:Vt?e.jsx(O,{className:"animate-spin"}):e.jsx(Ie,{}),label:"Sincronizar Voz IA",variant:"purple",disabled:Vt,onClick:Wa}),e.jsx(N,{size:"sm",icon:e.jsx(vt,{}),label:P?"Salir de Edición":"Editar Lienzo",variant:"orange",isActive:P,onClick:Qt}),e.jsx(N,{size:"sm",icon:Me?e.jsx(O,{className:"animate-spin"}):e.jsx(Ne,{}),label:"Descargar MP4 (WhatsApp/Celular)",variant:"teal",disabled:Me,onClick:aa}),e.jsx(N,{size:"sm",icon:Ke?e.jsx(O,{className:"animate-spin"}):e.jsx(Ve,{}),label:"Cápsula Academia (HTML5)",variant:"green",disabled:Ke,onClick:ra}),e.jsx(N,{size:"sm",icon:e.jsx(os,{}),label:"Pantalla Completa",variant:"neutral",onClick:ea})]})]}),P&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5",children:[e.jsx(ls,{className:"w-3.5 h-3.5 text-amber-500 shrink-0"}),"Arrastra cualquier caja o título con el mouse para moverlo • Doble clic para escribir"]}),e.jsxs("button",{type:"button",onClick:Ja,className:"px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx(Ze,{className:"w-3 h-3"}),"Guardar Cambios"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=w.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"text"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(da,{className:"w-3 h-3 text-teal-500"}),e.jsx(ds,{className:"w-3 h-3 text-teal-500"}),e.jsx("span",{children:"+ Texto"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=w.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"card"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(da,{className:"w-3 h-3 text-purple-500"}),e.jsx(ft,{className:"w-3 h-3 text-purple-500"}),e.jsx("span",{children:"+ Caja / Tarjeta"})]}),e.jsx("button",{type:"button",onClick:()=>{var t,a;return(a=(t=w.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_SELECT_PARENT"},"*")},disabled:!V,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 disabled:opacity-40 cursor-pointer",children:"Seleccionar Caja Contenedora"}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=w.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DUPLICATE_SELECTED"},"*")},disabled:!V,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold text-text-primary hover:border-teal-500 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(kt,{className:"w-3 h-3 text-indigo-500"}),e.jsx("span",{children:"Duplicar"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=w.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DELETE_SELECTED"},"*")},disabled:!V,className:"px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(ke,{className:"w-3 h-3"}),e.jsx("span",{children:"Eliminar"})]})]})]}),e.jsx("div",{className:"flex justify-center items-center bg-slate-950 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-inner overflow-hidden min-h-[460px]",children:e.jsxs("div",{ref:Kt,className:m("relative overflow-hidden bg-slate-950 shadow-2xl border border-white/10 transition-all duration-300",pt?"w-screen h-screen rounded-none border-0 flex flex-col items-center justify-between p-4 sm:p-6":m("rounded-2xl mx-auto flex items-center justify-center",T==="9:16"?"w-full max-w-[390px] aspect-[9/16] max-h-[660px]":"w-full aspect-[16/9] max-h-[660px] min-h-[340px]")),children:[e.jsxs("div",{className:m("relative overflow-hidden bg-slate-950",pt?T==="9:16"?"h-[calc(100vh-100px)] aspect-[9/16] max-w-[95vw] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-[min(94vw,calc((100vh-100px)*1.7778))] aspect-[16/9] max-h-[calc(100vh-100px)] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-full h-full"),children:[q&&e.jsx("audio",{ref:_,src:q,preload:"metadata",onTimeUpdate:t=>{ie(t.currentTarget.currentTime)},onLoadedMetadata:t=>{t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&ct(t.currentTarget.duration)},onEnded:()=>{var t,a,s;fe(!1),(a=(t=w.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_PAUSE"},"*"),(s=F.current)==null||s.pause()}}),A&&e.jsx("video",{ref:F,src:A,width:T==="9:16"?1080:1920,height:T==="9:16"?1920:1080,muted:qe,playsInline:!0,loop:!0,preload:"metadata",onTimeUpdate:t=>{q||ie(t.currentTarget.currentTime)},onLoadedMetadata:t=>{!q&&t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&ct(t.currentTarget.duration)},className:"absolute inset-0 w-full h-full object-cover z-0"}),e.jsx("iframe",{ref:w,title:"WAPPY Studio HTML Canvas",srcDoc:Ra,sandbox:"allow-scripts allow-same-origin",onLoad:()=>{var t,a,s,r,o,i;(a=(t=w.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*"),P?(r=(s=w.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!0},"*"):X||(i=(o=w.current)==null?void 0:o.contentWindow)==null||i.postMessage({type:"STUDIO_PAUSE"},"*")},className:m("absolute inset-0 w-full h-full border-0 z-10",P?"pointer-events-auto":"pointer-events-none")}),K&&gt&&e.jsx("div",{className:m("absolute inset-x-3 z-20 flex justify-center pointer-events-none",he==="top"?"top-16":he==="center"?"top-1/2 -translate-y-1/2":"bottom-5"),children:e.jsx("div",{className:"bg-black/85 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]",children:e.jsx("div",{className:"flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1",children:gt.words.map((t,a)=>{const s=a===gt.activeOffset;return e.jsx("span",{className:m("text-sm sm:text-base font-black uppercase tracking-wide transition-all duration-150",s?"text-amber-300 scale-110 bg-teal-500/30 px-1.5 py-0.5 rounded-lg border border-teal-400/50":"text-white/90"),children:t},`${t}-${a}`)})})})})]}),pt&&e.jsxs("div",{className:"w-full max-w-3xl mx-auto mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 flex items-center gap-3 z-30 shadow-2xl",children:[e.jsx("button",{type:"button",onClick:Xt,title:X?"Pausar / Parar":"Reproducir",className:"px-3.5 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:X?e.jsxs(e.Fragment,{children:[e.jsx(Qe,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(ae,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:bt,title:"Reiniciar animación",className:"p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer shrink-0",children:e.jsx(ca,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:I||20,step:.1,value:be,onChange:t=>Zt(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-200 shrink-0",children:[be.toFixed(1),"s / ",(I||20).toFixed(1),"s"]}),e.jsxs("button",{type:"button",onClick:Qt,className:m("px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0",P?"bg-amber-500/20 border-amber-400 text-amber-300":"bg-slate-800 border-slate-700 text-slate-200 hover:text-white"),children:[e.jsx(vt,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:P?"Editando":"Editar"})]}),e.jsxs("button",{type:"button",onClick:ea,className:"px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0",children:[e.jsx(cs,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Salir"})]})]})]})}),e.jsxs("div",{className:"p-3.5 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 space-y-2.5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{type:"button",onClick:Xt,title:X?"Pausar animación y subtítulos":"Reproducir animación y subtítulos",className:"px-3 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:X?e.jsxs(e.Fragment,{children:[e.jsx(Qe,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(ae,{className:"w-4 h-4 fill-white ml-0.5"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:bt,title:"Reiniciar animación",className:"p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-secondary hover:text-text-primary transition cursor-pointer shrink-0",children:e.jsx(ca,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:I||20,step:.1,value:be,onChange:t=>Zt(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-text-secondary shrink-0",children:[be.toFixed(1),"s / ",(I||20).toFixed(1),"s"]}),A&&e.jsx("button",{type:"button",onClick:()=>za(!qe),title:qe?"Activar audio del video original":"Silenciar video original",className:"p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-text-secondary hover:text-text-primary transition cursor-pointer",children:qe?e.jsx(ps,{className:"w-4 h-4 text-rose-500"}):e.jsx(ba,{className:"w-4 h-4 text-teal-500"})})]}),e.jsxs("div",{className:"pt-2 border-t border-slate-200/80 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",disabled:Me,onClick:aa,className:"p-3 rounded-xl border bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20 text-teal-800 dark:text-teal-200 text-left transition-all cursor-pointer disabled:opacity-50 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20",children:"WhatsApp • Celular • Redes"}),Me?e.jsx(O,{className:"w-4 h-4 animate-spin shrink-0"}):e.jsx(Ne,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight mt-0.5",children:Me?"Renderizando Video MP4...":"Descargar Video .MP4 (Todo Unido)"}),e.jsx("div",{className:"text-[10px] opacity-85 leading-snug",children:"Une Animación + Subtítulos + Voz IA en un archivo .MP4 listo para enviar por WhatsApp o subir a Reels"})]}),e.jsxs("div",{className:"p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20",children:"Academia WAPPY • LMS Responsive"}),e.jsx(yt,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight",children:"Cápsula Interactiva HTML5 (Móvil & Web)"}),e.jsxs("div",{className:"flex items-center gap-1.5 mt-0.5",children:[e.jsxs("button",{type:"button",disabled:Ke,onClick:ra,className:"flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx(Ve,{className:"w-3 h-3"}),e.jsx("span",{children:"Descargar .HTML"})]}),e.jsxs("button",{type:"button",disabled:Ke,onClick:Xa,title:"Copiar código <iframe srcdoc> para lección de Academia WAPPY",className:"py-1.5 px-2.5 rounded-lg bg-white/80 dark:bg-zinc-800 hover:bg-white text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx(kt,{className:"w-3 h-3"}),e.jsx("span",{children:"Copiar LMS"})]})]})]})]})]}),P&&V&&e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-zinc-900/90 rounded-2xl border border-teal-500/40 space-y-3 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5",children:[e.jsx(vt,{className:"w-3.5 h-3.5"}),"Propiedades del Elemento Seleccionado (<",V.tagName,">)"]}),e.jsx("button",{type:"button",onClick:()=>oe({dx:0,dy:0,scale:1}),className:"text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer",children:"Restablecer posición"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-text-secondary mb-1",children:"Texto del elemento (edita aquí o con doble clic en el video):"}),e.jsx("textarea",{rows:2,value:V.text,onChange:t=>oe({text:t.target.value}),className:"w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-text-primary font-semibold focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:["Tamaño Letra (",V.fontSize,"px)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>oe({fontSize:Math.max(10,V.fontSize-2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"A-"}),e.jsx("button",{type:"button",onClick:()=>oe({fontSize:Math.min(96,V.fontSize+2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"A+"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:["Escala Caja (",V.scale,"x)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>oe({scale:Math.max(.5,Number((V.scale-.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"-"}),e.jsx("button",{type:"button",onClick:()=>oe({scale:Math.min(2.5,Number((V.scale+.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold cursor-pointer",children:"+"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:"Color de Texto"}),e.jsx("input",{type:"color",value:V.color,onChange:t=>oe({color:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-zinc-700"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-text-secondary mb-1",children:"Color de Fondo"}),e.jsx("input",{type:"color",value:V.backgroundColor,onChange:t=>oe({backgroundColor:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-zinc-700"})]})]})]})]})]}),h==="lab"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4 shadow-xs",children:[e.jsx("div",{className:"w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0",children:e.jsx(de,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-base font-extrabold text-text-primary",children:"Laboratorio de Expresividad y Vocal Bursts"}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Explora las capacidades de Gemini TTS: respiraciones orgánicas, risas, susurros y dirección de estilo en tiempo real"})]})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-text-secondary",children:"Modelo en el Laboratorio:"}),e.jsx("div",{className:"flex flex-wrap items-center gap-2",children:ce.map(t=>{const a=f===t.id;return e.jsxs("button",{type:"button",onClick:()=>{J(t.id),t.supportedVoices.includes(x)||pe(t.supportedVoices[0]||"Kore")},className:m("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-zinc-900 text-text-secondary border-slate-200 dark:border-zinc-800 hover:border-teal-400"),children:[t.name," (",t.supportedVoices.length," voces)"]},t.id)})})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsx("h3",{className:"text-sm font-extrabold text-text-primary",children:"Efectos Vocales Orgánicos Integrados"}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:Ue.map(t=>{const a=ya===t.tag;return e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400",children:t.tag}),e.jsx("p",{className:"text-xs font-bold text-text-primary mt-0.5",children:t.label}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:t.description})]}),e.jsx("button",{type:"button",disabled:a,onClick:async()=>{try{Ct(t.tag);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:W(c),body:JSON.stringify({voiceName:x,model:"gemini-3.8-flash-tts",stylePrompt:"Voz muy expresiva y natural.",text:`Escucha cómo suena este efecto natural en medio de una frase: ${t.tag} ¡Suena totalmente humano!`})}),r=await te(s);r.audioBase64&&G({base64:r.audioBase64,title:`Efecto ${t.tag} (${x})`,durationSeconds:r.durationSeconds,voiceName:x})}catch(s){g({type:"error",text:s.message})}finally{Ct(null)}},className:"w-9 h-9 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 transition cursor-pointer",children:a?e.jsx(O,{className:"w-4 h-4 animate-spin"}):e.jsx(ae,{className:"w-4 h-4 fill-current"})})]},t.tag)})})]}),e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("h3",{className:"text-sm font-extrabold text-text-primary",children:"Probador Libre de Prosodia y Dirección de Voz"}),e.jsxs("span",{className:"text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",children:["Voces activas: ",je," de ",D.length]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary",children:["Selecciona la Voz (",je," activas para ",S==null?void 0:S.name,")"]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:D.map(t=>{const a=x===t.id,s=Le(t.id);return e.jsxs("button",{type:"button",onClick:()=>{s||J("gemini-3.8-flash-tts"),pe(t.id)},className:m("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-zinc-900 text-text-primary border-slate-200 dark:border-zinc-800 hover:border-teal-400",!s&&"opacity-55"),children:[e.jsxs("span",{children:[t.name," (",t.gender,")"]}),s&&e.jsx(Ze,{className:"w-3 h-3 text-emerald-400"})]},t.id)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1.5",children:"Prompt de Dirección (speechMetadata.style)"}),e.jsx("input",{type:"text",value:at,onChange:t=>ha(t.target.value),className:"w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-teal-500"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-text-secondary mb-1.5",children:"Texto de Prueba"}),e.jsx("textarea",{rows:3,value:Z,onChange:t=>fa(t.target.value),className:"w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs text-text-primary focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsx("div",{children:e.jsxs("button",{type:"button",onClick:Ba,disabled:Tt||!Z.trim(),className:"inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[Tt?e.jsx(O,{className:"w-4 h-4 animate-spin"}):e.jsx(de,{className:"w-4 h-4"}),e.jsx("span",{children:"Sintetizar en el Laboratorio"})]})})]})]}),h==="library"&&e.jsxs("div",{className:"space-y-5 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-text-primary flex items-center gap-2",children:[e.jsx(yt,{className:"w-5 h-5 text-indigo-500"}),"Biblioteca de Audios Generados"]}),e.jsx("p",{className:"text-xs text-text-secondary",children:"Tus locuciones y audiolibros quedan guardados localmente para reproducir, descargar en WAV o usar en el Compositor de Video."})]}),ge.length>0&&e.jsx(N,{icon:e.jsx(ke,{}),label:"Limpiar Historial",variant:"danger",onClick:()=>ze([])})]}),ge.length===0?e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-12 text-center space-y-2",children:[e.jsx(Ie,{className:"w-10 h-10 mx-auto text-slate-400"}),e.jsx("p",{className:"text-sm font-bold text-text-primary",children:"Aún no hay audios en tu biblioteca"}),e.jsx("p",{className:"text-xs text-text-secondary max-w-md mx-auto",children:'Genera una locución en la pestaña "Estudio de Voz (TTS)" o en "Voces & Bursts" y aparecerá aquí automáticamente.'})]}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:ge.map(t=>e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("h4",{className:"text-sm font-extrabold text-text-primary line-clamp-1",children:t.title}),e.jsx("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 shrink-0",children:t.voiceName})]}),e.jsxs("div",{className:"flex items-center gap-2.5 text-xs text-text-secondary",children:[e.jsxs("span",{children:["⏱ ",Ns(t.durationSeconds)]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[t.wordCount," palabras"]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:Ss(t.createdAt)})]}),t.stylePrompt&&e.jsxs("div",{className:"p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800 text-[11px] italic text-text-secondary line-clamp-2",children:['"',t.stylePrompt,'"']})]}),e.jsxs("div",{className:"flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-zinc-800",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(N,{size:"sm",icon:e.jsx(ae,{}),label:"Reproducir",variant:"teal",onClick:()=>G({base64:t.audioBase64,url:t.downloadUrl,title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText})}),e.jsx(N,{size:"sm",icon:e.jsx(Ne,{}),label:"Usar en Video",variant:"purple",onClick:()=>{G({base64:t.audioBase64,url:t.downloadUrl,title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText}),ve("video")}})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(N,{size:"sm",icon:e.jsx(Ve,{}),label:"Descargar WAV",variant:"green",onClick:()=>{const a=t.downloadUrl||(t.audioBase64?`data:audio/wav;base64,${t.audioBase64}`:"");if(!a)return;const s=document.createElement("a");s.href=a,s.download=`wappy-audio-${t.id}.wav`,document.body.appendChild(s),s.click(),document.body.removeChild(s)}}),e.jsx(N,{size:"sm",icon:e.jsx(ke,{}),label:"Eliminar",variant:"danger",onClick:()=>ze(a=>a.filter(s=>s.id!==t.id))})]})]})]},t.id))})]})]})]})}function Ts({audioBase64:l,audioUrl:c,title:R,durationSeconds:b,voiceName:B,onSendToVideo:U}){const y=n.useRef(null),[v,H]=n.useState(!1),[$,h]=n.useState(0),[M,L]=n.useState(b||0),[Oe,ce]=n.useState(1),[Se,D]=n.useState(!1),se=c||(l?`data:audio/wav;base64,${l}`:"");n.useEffect(()=>{H(!1),h(0),b&&b>0&&L(b)},[se,b]);const et=()=>{!y.current||!se||(v?y.current.pause():y.current.play().catch(j=>console.error("Error al reproducir audio:",j)))},Re=j=>{if(!j||isNaN(j)||j<0)return"00:00";const f=Math.floor(j),J=Math.floor(f/60),x=f%60;return`${J.toString().padStart(2,"0")}:${x.toString().padStart(2,"0")}`},Ue=()=>{if(!se)return;const j=document.createElement("a");j.href=se,j.download=`${R.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"wappy-tts"}.wav`,document.body.appendChild(j),j.click(),document.body.removeChild(j)};return se?e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-teal-500/30 rounded-2xl p-4 sm:p-5 shadow-md space-y-3",children:[e.jsx("audio",{ref:y,src:se,preload:"metadata",onPlay:()=>H(!0),onPause:()=>H(!1),onEnded:()=>H(!1),onTimeUpdate:()=>{y.current&&h(y.current.currentTime)},onLoadedMetadata:()=>{var j;(j=y.current)!=null&&j.duration&&!isNaN(y.current.duration)&&L(y.current.duration)}}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3 min-w-0",children:[e.jsx("button",{type:"button",onClick:et,className:"w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white flex items-center justify-center shadow-md transition active:scale-95 shrink-0 cursor-pointer",children:v?e.jsx(Qe,{className:"w-5 h-5 fill-white"}):e.jsx(ae,{className:"w-5 h-5 fill-white ml-0.5"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"}),e.jsx("h3",{className:"text-sm font-extrabold text-text-primary truncate",children:R})]}),e.jsxs("p",{className:"text-xs text-teal-600 dark:text-teal-400 font-semibold",children:["Voz: ",B||"Kore"," • WAV 24kHz Alta Fidelidad (",Re($)," /"," ",Re(M),")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{const j=[.75,1,1.25,1.5,2],f=j[(j.indexOf(Oe)+1)%j.length];ce(f),y.current&&(y.current.playbackRate=f)},className:"px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-teal-700 dark:text-teal-300 cursor-pointer",children:[Oe,"x"]}),e.jsx(N,{size:"sm",icon:e.jsx(Ne,{}),label:"Llevar al Video",variant:"purple",onClick:U}),l&&e.jsx(N,{size:"sm",icon:Se?e.jsx(Ze,{}):e.jsx(kt,{}),label:Se?"Copiado":"Copiar Base64",variant:"fuchsia",onClick:()=>{navigator.clipboard.writeText(l),D(!0),setTimeout(()=>D(!1),2e3)}}),e.jsx(N,{size:"sm",icon:e.jsx(Ve,{}),label:"Descargar WAV",variant:"green",onClick:Ue})]})]}),e.jsx("div",{className:"flex items-center justify-between gap-1 h-10 bg-slate-50 dark:bg-zinc-950 rounded-xl px-3 py-1.5 border border-slate-200/80 dark:border-zinc-800 overflow-hidden",children:Array.from({length:44}).map((j,f)=>{const J=M>0?$/M:0,x=f/44,pe=x<=J,re=22+Math.sin(f*.45)*16+Math.cos(f*.9)*12;return e.jsx("div",{onClick:()=>{if(y.current&&M>0){const Te=x*M;y.current.currentTime=Te,h(Te)}},style:{height:`${Math.max(18,Math.min(95,re))}%`},className:m("w-1 rounded-full cursor-pointer transition-all duration-150",pe?"bg-gradient-to-t from-teal-500 to-emerald-400":"bg-slate-300 dark:bg-zinc-800 hover:bg-teal-400/50")},f)})})]}):null}function Es({job:l,onPause:c,onResume:R,onCancel:b,onPlayChunk:B,onLoadMaster:U}){const y=l.status==="completed",v=l.status==="failed",H=l.status==="processing",$=l.status==="paused";return e.jsxs("div",{className:"bg-white dark:bg-gray-900 border border-teal-500/40 rounded-2xl p-5 shadow-md space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-300 flex items-center justify-center",children:H?e.jsx(O,{className:"w-5 h-5 animate-spin"}):y?e.jsx(xa,{className:"w-5 h-5 text-emerald-500"}):e.jsx(de,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h4",{className:"text-sm font-extrabold text-text-primary",children:y?"¡Audio Maestro de Larga Duración Completado!":v?"Error en la Generación":$?"Generación en Pausa":`Sintetizando fragmento ${l.currentChunkIndex+1} de ${l.totalChunks}...`}),e.jsxs("p",{className:"text-xs text-text-secondary",children:["Generados ",Math.round(l.generatedTotalSeconds),"s de ~",l.estimatedTotalSeconds,"s estimados (",l.progressPercent,"%)"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[H&&e.jsx(N,{size:"sm",icon:e.jsx(Qe,{}),label:"Pausar",variant:"amber",onClick:c}),$&&e.jsx(N,{size:"sm",icon:e.jsx(ae,{}),label:"Reanudar",variant:"teal",onClick:R}),!y&&!v&&e.jsx(N,{size:"sm",icon:e.jsx(ma,{}),label:"Cancelar",variant:"danger",onClick:b}),y&&e.jsxs(e.Fragment,{children:[e.jsx(N,{size:"sm",icon:e.jsx(ae,{}),label:"Cargar Master",variant:"teal",onClick:U}),e.jsxs("a",{href:l.downloadUrl||`/api/studio/tts/jobs/${l.id}/download`,download:!0,className:"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 text-xs font-bold hover:bg-green-500/20 transition",children:[e.jsx(Ve,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Descargar WAV Master"})]})]})]})]}),e.jsx("div",{className:"w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,l.progressPercent))}%`}})}),e.jsx("div",{className:"grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 gap-1.5 p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-200/80 dark:border-zinc-800 max-h-32 overflow-y-auto",children:l.chunks.map(h=>{const M=h.status==="completed",L=h.status==="processing";return e.jsx("button",{type:"button",disabled:!M,onClick:()=>B(h),title:`Fragmento #${h.index+1}`,className:m("h-7 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center border transition",M?"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer":L?"bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/40 animate-pulse":"bg-slate-200/50 dark:bg-zinc-900 text-text-secondary border-transparent opacity-60"),children:M?e.jsx(ba,{className:"w-3 h-3"}):L?e.jsx(O,{className:"w-3 h-3 animate-spin"}):h.index+1},h.index)})})]})}export{rr as default};
