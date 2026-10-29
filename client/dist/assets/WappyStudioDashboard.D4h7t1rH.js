import{r as i,j as e}from"./react-core.DnLkJYlj.js";import{e as Xs,b as Qs}from"./routing.G8zv3X9f.js";import{eY as ts,cj as De,hI as ct,h8 as Ve,ft as sa,eZ as ra,gx as Mt,dC as ae,cH as as,ct as er,cl as na,dj as bt,cp as Rt,eL as ss,dh as mt,bY as tr,db as ar,gb as Me,dE as sr,f4 as rs,d8 as He,fp as is,es as ps,c_ as rr,c2 as Lt,dx as tt,ev as ns,ew as ir,fO as nr,d4 as os,dp as or,e9 as oa,hu as Dt,cx as la,fr as lr,hJ as us,gM as ca,e7 as dr}from"./vendor.BQ_vVZzs.js";import{u as cr,ao as pr,ag as ur,c as y,O as xr,k as mr,_ as L}from"./index.Ccp52z-5.js";import"./utilities.CCKZG3yh.js";import"./markdown_highlight.Cj_heSZW.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./locales.DGMWYUix.js";import"./i18n.CdklldLM.js";import"./radix-ui.DlzgRM_V.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.CLHK0heZ.js";import"./animations.BfNomghp.js";import"./virtualization.D3stoeJg.js";import"./tanstack-vendor.BbeFfzfD.js";import"./headlessui.BV2QIPYW.js";import"./framer-motion.BxrZXEJX.js";import"./http-client.D0DHqe6c.js";import"./date-utils.X8D4nCrw.js";import"./forms.PdoLQ5-c.js";import"./security-ui.Bga5GGyP.js";import"./markdown-processing.DPzmCgFz.js";import"./heic-converter.BhQCFQ0l.js";import"./canvas-templates.BS0AxzrQ.js";const br="wappy-studio-media",gr=1,Vt="blobs";let pt=null;function hr(){return pt||(pt=new Promise((d,c)=>{if(typeof indexedDB>"u"){c(new Error("IndexedDB no disponible en este navegador."));return}const p=indexedDB.open(br,gr);p.onupgradeneeded=()=>{const g=p.result;g.objectStoreNames.contains(Vt)||g.createObjectStore(Vt)},p.onsuccess=()=>d(p.result),p.onerror=()=>{pt=null,c(p.error)}}),pt)}function $t(d,c){return hr().then(p=>new Promise((g,z)=>{const P=p.transaction(Vt,d),h=c(P.objectStore(Vt));h.onsuccess=()=>g(h.result),h.onerror=()=>z(h.error)}))}async function Ge(d,c){await $t("readwrite",p=>p.put(c,d))}async function ut(d){try{return await $t("readonly",p=>p.get(d))??null}catch{return null}}async function fr(d){try{await $t("readwrite",c=>c.delete(d))}catch{}}async function yr(){try{await $t("readwrite",d=>d.clear())}catch{}}function It(d,c="audio/wav"){const p=d.replace(/^data:[^;]+;base64,/,""),g=window.atob(p),z=new Uint8Array(g.length);for(let P=0;P<g.length;P++)z[P]=g.charCodeAt(P);return new Blob([z],{type:c})}var wr={};const ls=[{id:"gemini-3.8-flash",category:"Generación IA & Guiones",badge:"Principal 3.8",description:"Motor principal para generación de escenas HTML/GSAP y enriquecimiento de guiones."},{id:"gemini-3.6-flash",category:"Generación IA & Guiones",badge:"Estable 3.6",description:"Modelo rápido de alta precisión para código HTML5, Tailwind y estructura SST."},{id:"gemini-3.5-flash-lite",category:"Generación IA & Guiones",badge:"Ultra Ligero",description:"Baja latencia para respuestas instantáneas y estructuración rápida."},{id:"gemini-3.8-live",category:"Voz en Tiempo Real (Live)",badge:"Tenshi Live 3.8",description:"Interacción conversacional bidireccional de baja latencia en tiempo real."},{id:"gemini-3.1-flash-live-preview",category:"Voz en Tiempo Real (Live)",badge:"Live Preview 3.1",description:"Respaldo multimodal en vivo para sesiones de voz continua."},{id:"gemini-2.5-flash-native-audio-preview-12-2025",category:"Voz en Tiempo Real (Live)",badge:"Audio Nativo 2.5",description:"Audio nativo multimodal con soporte extendido de herramientas."},{id:"gemini-3.8-flash-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Recomendado (14 voces)",description:"Máxima expresividad, vocal bursts (<breath>, <laugh>) y las 14 voces activas."},{id:"gemini-3.1-flash-tts-preview",category:"Síntesis de Voz (TTS 24kHz)",badge:"Preview 3.1 (14 voces)",description:"Prosodia refinada y soporte completo para las 14 voces preconstruidas."},{id:"gemini-2.5-flash-preview-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Reemplazo 2.5 Pro (5 voces)",description:"Activa las 5 voces fundamentales (Kore, Puck, Charon, Fenrir, Aoede)."},{id:"gemini-3.8-flash-lite-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Ultra Rápido (6 voces)",description:"Lecturas masivas de baja latencia con 6 voces optimizadas."}],zt={"gemini-3.8-flash-tts":{id:"gemini-3.8-flash-tts",name:"Gemini 3.8 Flash TTS",badge:"Recomendado / Cuota Activa",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"✓ Activo (14 voces)",description:"Máxima fluidez natural, diseño de voz, vocal bursts (<breath>, <laugh>) y soporte para las 14 voces.",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-3.1-flash-tts-preview":{id:"gemini-3.1-flash-tts-preview",name:"Gemini 3.1 Flash TTS Preview",badge:"Preview 3.1 / Cuota Activa",badgeColor:"bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:"Arquitectura Gemini 3.1 con prosodia refinada, tono expresivo y respuesta ágil (14 voces).",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-2.5-flash-preview-tts":{id:"gemini-2.5-flash-preview-tts",name:"Gemini 2.5 Flash TTS",badge:"Reemplazo de 2.5 Pro",badgeColor:"bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",rateLimitLabel:"3 RPM • 10 RPD (2.5 Pro: 0/0)",quotaLabel:"5 voces",description:"Reemplazo oficial y funcional de 2.5 Pro (no disponible en API). Activa únicamente las 5 voces fundamentales.",supportsMultiSpeaker:!0,supportsVocalBursts:!1,supportedVoices:["Kore","Puck","Charon","Fenrir","Aoede"]},"gemini-3.8-flash-lite-tts":{id:"gemini-3.8-flash-lite-tts",name:"Gemini 3.8 Flash-Lite TTS",badge:"Ultra Rápido",badgeColor:"bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",rateLimitLabel:"Baja Latencia",quotaLabel:"6 voces",description:"Optimizado para lecturas masivas con mínima latencia continua (6 voces rápidas).",supportsMultiSpeaker:!1,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Aoede"]}},vr=[{id:"Kore",name:"Kore",gender:"Femenino",tone:"Cálida, Serena y Profesional",recommendedFor:"Audiolibros, Narración, Tutoriales, Inducción SST",tag:"Más popular"},{id:"Puck",name:"Puck",gender:"Masculino",tone:"Enérgico, Dinámico y Joven",recommendedFor:"Podcasts, Reels, Contenido Creativo, Diálogos",tag:"Muy expresivo"},{id:"Charon",name:"Charon",gender:"Masculino",tone:"Barítono, Grave, Maduro y Solemne",recommendedFor:"Documentales, Historia, Suspenso, Directivos",tag:"Voz profunda"},{id:"Fenrir",name:"Fenrir",gender:"Masculino",tone:"Claro, Elocuente y Periodístico",recommendedFor:"Noticias, Informes, Presentaciones, Boletines",tag:"Profesional"},{id:"Zephyr",name:"Zephyr",gender:"Femenino",tone:"Dulce, Aterciopelada y Relajante",recommendedFor:"Meditación, ASMR, Cuentos, Bienestar",tag:"Calma"},{id:"Orus",name:"Orus",gender:"Masculino",tone:"Firme, Imperial, Épico y Reflexivo",recommendedFor:"Ficción Épica, Liderazgo, Ensayos, Cultura Vial",tag:"Imperial"},{id:"Aoede",name:"Aoede",gender:"Femenino",tone:"Melódica, Expresiva, Artística y Cálida",recommendedFor:"Poesía, Literatura, Storytelling, Sensibilización",tag:"Melódica"},{id:"Leda",name:"Leda",gender:"Femenino",tone:"Cercana, Maternal, Madura y Envolvente",recommendedFor:"Audiolibros Largos, Relatos, Bienvenida",tag:"Narradora"},{id:"Callisto",name:"Callisto",gender:"Femenino",tone:"Elegante, Sofisticada y Articulada",recommendedFor:"Divulgación Científica, Conferencias, Auditorías",tag:"Sofisticada"},{id:"Europa",name:"Europa",gender:"Femenino",tone:"Brillante, Luminosa, Alegre y Asertiva",recommendedFor:"Marketing, Anuncios, E-Learning, Campañas",tag:"Enérgica"},{id:"Ganymede",name:"Ganymede",gender:"Masculino",tone:"Resonante, Equilibrado, Sabio y Seguro",recommendedFor:"Educación Superior, Cursos, Capacitación Técnica",tag:"Resonante"},{id:"Io",name:"Io",gender:"Femenino",tone:"Vivaz, Espontánea, Fresca y Amigable",recommendedFor:"Redes Sociales, Vlogs, Asistentes, Reels",tag:"Fresca"},{id:"Titan",name:"Titan",gender:"Masculino",tone:"Imponente, Cinematográfico y Potente",recommendedFor:"Tráilers, Introducciones, Impacto, Alertas",tag:"Cinematográfica"},{id:"Prometheus",name:"Prometheus",gender:"Masculino",tone:"Noble, Pensativo, Filosófico y Clásico",recommendedFor:"Filosofía, Análisis Profundo, Crónicas",tag:"Sabio"}],kr=[{id:"orus-solemn",name:"Narración Solemne (Orus)",voiceName:"Orus",style:"Voz firme, templada, reflexiva y madura de narrador de crónica histórica, dicción solemne, pausas medidas y respiraciones naturales.",speed:"0.95x"},{id:"aoede-poetic",name:"Cuento Poético (Aoede)",voiceName:"Aoede",style:"Voz melódica, cálida, expresiva y artística para relato literario y sensibilización, con matices emocionales suaves.",speed:"0.95x"},{id:"titan-trailer",name:"Tráiler Cinematográfico (Titan)",voiceName:"Titan",style:"Voz imponente, profunda, cinematográfica y épica de tráiler de película, con pausas dramáticas e impacto.",speed:"0.95x"},{id:"kore-audiobook",name:"Narrador de Audiolibro (Kore)",voiceName:"Kore",style:"Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.",speed:"1.0x"},{id:"puck-podcast",name:"Host de Podcast Dinámico (Puck)",voiceName:"Puck",style:"Host de podcast carismático, enérgico, cercano y espontáneo, con entonación conversacional moderna.",speed:"1.05x"},{id:"charon-documentary",name:"Documental Profundo (Charon)",voiceName:"Charon",style:"Tono barítono, solemne, reflexivo y cinematográfico de narrador de documental, con pausas medidas.",speed:"0.95x"},{id:"fenrir-news",name:"Noticiero Profesional (Fenrir)",voiceName:"Fenrir",style:"Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.",speed:"1.05x"},{id:"zephyr-asmr",name:"Meditación y ASMR (Zephyr)",voiceName:"Zephyr",style:"Voz suave, serena, dulce y sumamente relajante para meditación guiada, mindfulness y bienestar.",speed:"0.9x"},{id:"screenplay-dialogue",name:"Guion / Diálogo Alex & Sam",voiceName:"Kore",multiSpeaker:!0,speaker1:{name:"Alex",voiceName:"Puck",style:"Entusiasta y curioso"},speaker2:{name:"Sam",voiceName:"Kore",style:"Experta, clara y cercana"},style:"Diálogo interactivo de podcast entre dos especialistas con alternancia natural.",speed:"1.0x"}],jr=[{tag:"<breath>",label:"Respiración natural",description:"Inserta una toma de aire orgánica entre frases"},{tag:"<laugh>",label:"Risa / Carcajada",description:"Añade una risa espontánea o carcajada suave"},{tag:"<gasp>",label:"Sorpresa / Jadear",description:"Efecto de inhalación rápida de asombro"},{tag:"|mhm|",label:"Asentimiento (|mhm|)",description:"Confirmación conversacional natural"},{tag:"|yeah|",label:"Aceptación (|yeah|)",description:"Interjección de acuerdo en diálogos"}],xt=[{title:"Inducción SST: 5 Reglas de Oro en Riesgo Eléctrico",text:`¡Atención equipo! Antes de intervenir cualquier tablero o red eléctrica, recuerda que tu vida depende de las Cinco Reglas de Oro. <breath>

Primero: Cortar de forma efectiva todas las fuentes de tensión. Segundo: Bloquear y etiquetar los aparatos de corte con tu candado personal LOTO. <breath>

Tercero: Verificar la ausencia de tensión con un detector calibrado. Cuarto: Poner a tierra y en cortocircuito todas las posibles fuentes de corriente. Y quinto: Delimitar y señalizar la zona de trabajo. <breath>

En WAPPY IA cuidamos lo más valioso: que regreses sano y salvo a casa.`},{title:"Narración Épica con Orus: El Guardián del Tiempo",text:`En las profundidades de la antigua biblioteca de Alejandría, donde el polvo danzaba sobre rayos de sol eternos, existía un manuscrito que nadie se atrevía a abrir. <breath>

Decían los sabios que sus páginas no contenían tinta, sino la memoria viva de las civilizaciones olvidadas. Cada palabra pronunciada en voz alta hacía vibrar los cimientos de piedra. <breath>

Aquella noche, cuando las antorchas comenzaron a extinguirse una por una, el guardián comprendió que el tiempo no es una línea recta... sino un océano esperando ser navegado.`},{title:"Audiolibro: El Faro de las Galaxias",text:`Capítulo Uno: El horizonte silencioso. <breath>

El observatorio flotaba a trescientos kilómetros sobre la atmósfera terrestre. Desde el ventanal principal, Elena observaba el destello azulado de las tormentas eléctricas sobre el Pacífico. <breath>

Durante años habíamos buscado señales de radio en frecuencias convencionales. Pero aquella madrugada, el sensor cuántico registró un pulso rítmico, casi musical, proveniente del cúmulo de Hércules. <gasp> No era ruido cósmico; era una invitación.`},{title:"Podcast: IA y la Voz Humana (Diálogo Alex & Sam)",text:`Alex: ¡Bienvenidos a un nuevo episodio de Futuro Sonoro! <breath> Hoy estamos probando en vivo la nueva generación de síntesis neuronal con expresiones humanas reales.

Sam: ¡Hola Alex! |yeah| Es impresionante cómo ya no suena a lectura robótica. <laugh> Ahora la voz respira, hace pausas orgánicas y transmite intención en cada frase.

Alex: Totalmente. |mhm| Y lo mejor es que podemos pasar de una cápsula de treinta segundos a un audiolibro de una hora completa sin perder calidad.

Sam: Sin duda estamos ante una nueva era para creadores, formadores y equipos de prevención.`},{title:"Meditación Guiada: Serenidad y Respiración Profunda",text:`Encuentra una postura cómoda y permite que tus párpados se cierren suavemente... <breath>

Toma una inhalación lenta y profunda por la nariz... sintiendo cómo el aire fresco llena tus pulmones de calma y claridad. <breath>

Ahora exhala despacio... soltando cualquier prisa, cualquier preocupación del día. <breath> Aquí y ahora, estás en completo equilibrio.`},{title:"Noticia: Avance Histórico en Computación Cuántica",text:`En noticias de última hora, un consorcio internacional de investigadores ha logrado estabilizar un procesador cuántico de mil cúbits lógicos a temperatura controlada. <breath>

Este avance permitirá simular moléculas complejas para nuevos medicamentos y optimizar redes energéticas enteras en cuestión de segundos. <breath>

Los expertos señalan que las primeras aplicaciones industriales comenzarán a desplegarse durante el próximo trimestre.`},{title:"Reel Viral Estilo Claude: Cómo la IA transforma el SG-SST",text:`¿Todavía llevas tu matriz de peligros y tus inspecciones en hojas de cálculo infinitas? <breath>

Mira cómo cambia todo cuando conectas Inteligencia Artificial en tiempo real. En menos de diez segundos, analizamos los riesgos bajo la guía GTC 45, generamos controles operativos y notificamos a cada trabajador en su celular. <breath>

Menos papeleo mecánico y más prevención real en planta. <laugh> Pruébalo hoy mismo en WAPPY Studio.`},{title:"Podcast Dual (Alex & Sam): El Futuro de la Prevención",text:`Alex: ¡Hola a todos y bienvenidos a un nuevo episodio de Pulso Preventivo! <breath> Hoy hablaremos sobre cómo las voces neuronales y el video interactivo están revolucionando las capacitaciones.

Sam: Totalmente de acuerdo, Alex. |yeah| Lo más impresionante es que los trabajadores ya no se aburren con diapositivas estáticas. <laugh> Ahora reciben cápsulas dinámicas con voz natural.

Alex: Exacto. |mhm| Además, podemos generar desde un reel de un minuto hasta un audiolibro formativo de una hora continua sin cortes.

Sam: Sin duda es un salto enorme para la cultura de seguridad en toda Latinoamérica.`},{title:"Pausa Activa & Regulación Emocional (Bienestar)",text:`Haz una pausa por un instante... y suelta los hombros. <breath>

Inhala profundamente por la nariz durante cuatro segundos, sintiendo cómo el aire renueva tu energía... <breath>

Ahora exhala suavemente, liberando la tensión acumulada frente a la pantalla. <breath>

Tu bienestar mental y físico es la base de un entorno laboral saludable y seguro.`}],Sr=[{id:"golden-rules",name:"🔥 Reel WAPPY + Félix 3D",badge:"Oficial GTC-45",description:"Multi-escena con Félix 3D lip-sync, Mockup celular, VS y tarjetas sincronizadas con la voz."},{id:"kpi-hud",name:"🚀 Ecosistema + Tenshi IA",badge:"Plataforma 40s",description:"Constelación IA, telemetría 3D en vivo, comparativa VS y tarjeta oráculo Tenshi."},{id:"alert-sst",name:"📜 Expediente & Reglas SST",badge:"Normativo",description:"Visor normativo con resaltador fluorescente, checklist secuencial 1-2-3 y radar."},{id:"camera-overlay",name:"🎬 Lower-Third (Video Propio)",badge:"Transparente",description:"Capas dinámicas por frase en tercio superior e inferior sin tapar tu rostro."}];function xs(d,c=28){const p=Math.max(4,Number(c)||28),z=String(d||"").replace(/^(Alex|Sam|Hablante\s*\d+|Speaker\s*\d+):\s*/gim,"").trim().split(new RegExp("(?<=[.!?…])\\s+|\\n+|<breath>","gi")).map(k=>k.replace(/<[^>]+>/g,"").replace(/\|[^|]+\|/g,"").trim()).filter(Boolean);z.length===0&&z.push("Prevención inteligente y seguridad en el trabajo con WAPPY IA.");const P=[];for(let k=0;k<z.length;k++){const v=z[k];v.length<18&&k+1<z.length?z[k+1]=`${v} ${z[k+1]}`:P.push(v)}const h=7,F=[];if(P.length<=h)F.push(...P);else{const k=Math.ceil(P.length/h);for(let v=0;v<P.length;v+=k)F.push(P.slice(v,v+k).join(" "))}const oe=[],R=[];let C=0;const S=F.map((k,v)=>{const X=k.split(/\s+/).filter(Boolean).map(Y=>{const N=Y.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g,"").length;let le=Math.max(2,N);return/[,;:]$/.test(Y)&&(le+=4),/[.!?…]$/.test(Y)&&(le+=9),{word:Y,weight:le}});X.length>0&&(X[X.length-1].weight+=7);const re=X.reduce((Y,N)=>Y+N.weight,0)||10;return C+=re,{text:k,bIdx:v,wList:X,beatWeight:re}}),se=["wave","pointLeft","pointRight","bothUp"],W=["lime","cyan","amber"];let ge=0;for(let k=0;k<S.length;k++){const v=S[k],K=ge/Math.max(1,C),X=(ge+v.beatWeight)/Math.max(1,C),re=Number((K*p).toFixed(2)),Y=Number((X*p).toFixed(2)),N=Number(Math.max(.8,Y-re).toFixed(2));let le=ge;for(const J of v.wList){const H=le/Math.max(1,C);le+=J.weight;const je=le/Math.max(1,C);oe.push({word:J.word,startPct:Number(H.toFixed(4)),endPct:Number(je.toFixed(4)),beatIndex:k})}ge+=v.beatWeight;const E=v.text.replace(/^[¡!¿?]+/,"").split(/\s+/).filter(Boolean),he=v.text.indexOf(":");let Q=k===0?"⚡ IMPACTO INICIAL • WAPPY IA":k===S.length-1?"🛡️ CIERRE EJECUTIVO • SOMOS SST":`PUNTO CLAVE 0${k}`;/^(primero|1\b)/i.test(v.text)?Q="⚡ REGLA DE ORO 01":/^(segundo|2\b)/i.test(v.text)?Q="🔒 REGLA DE ORO 02":/^(tercero|3\b)/i.test(v.text)?Q="📡 REGLA DE ORO 03":/^(cuarto|4\b)/i.test(v.text)?Q="🛡️ REGLA DE ORO 04":/^(quinto|5\b)/i.test(v.text)&&(Q="🚨 REGLA DE ORO 05");let ve=E.slice(0,Math.min(5,E.length));if(he>0&&he<16){const J=v.text.slice(he+1).trim().split(/\s+/).filter(Boolean);J.length>=2&&(ve=J.slice(0,Math.min(5,J.length)))}const m=Math.max(1,Math.ceil(ve.length*.55)),f=ve.slice(0,m).join(" ").replace(/[,;:.!?]+$/,""),b=ve.slice(m).join(" ").replace(/[,;:.!?]+$/,"")||"WAPPY IA",T=v.text.toLowerCase();let _="bolt";/bloqueo|tarjeteo|candado|loto|aislar/.test(T)?_="lock":/verificar|ausencia|medir|auditor|inspecci|radar|pose|telemetr/.test(T)?_="radar":/tierra|cortocircuito|protecci|epp|casco|seguridad|prevenci/.test(T)?_="shield":/señalizar|delimitar|alerta|peligro|error|riesgo/.test(T)?_="alert":/matriz|gtc|excel|informe|indicador|semana|minuto/.test(T)&&(_="chart"),R.push({index:k+1,text:v.text,startSec:re,endSec:Y,durationSec:N,startPct:Number(K.toFixed(4)),endPct:Number(X.toFixed(4)),badge:Q,titleLead:f,titleHighlight:b,pillColor:W[k%W.length],iconType:_,gesture:se[k%se.length]})}return{beats:R,wordTimings:oe,totalDurationSeconds:p}}function Nr(d,c){return d==="lock"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="12" y="28" width="40" height="28" rx="8" fill="${c}" fill-opacity="0.22" stroke="${c}" stroke-width="2.8"/>
      <path d="M20 28V20C20 13.3726 25.3726 8 32 8C38.6274 8 44 13.3726 44 20V28" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="42" r="4" fill="#c7f303"/>
    </svg>`:d==="radar"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <circle cx="32" cy="32" r="24" fill="${c}" fill-opacity="0.16" stroke="${c}" stroke-width="2.5" stroke-dasharray="6 4"/>
      <circle cx="32" cy="32" r="14" stroke="#c7f303" stroke-width="2" stroke-opacity="0.7"/>
      <path d="M32 32L48 18" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="4" fill="#c7f303"/>
    </svg>`:d==="shield"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 6L10 15V31C10 45.5 19.4 57.6 32 61C44.6 57.6 54 45.5 54 31V15L32 6Z" fill="${c}" fill-opacity="0.2" stroke="${c}" stroke-width="2.8"/>
      <path d="M22 33L29 40L43 25" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`:d==="alert"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 8L6 54H58L32 8Z" fill="#f59e0b" fill-opacity="0.22" stroke="#f59e0b" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M32 24V38" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round"/>
      <circle cx="32" cy="46" r="2.8" fill="#c7f303"/>
    </svg>`:d==="chart"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="10" y="34" width="10" height="20" rx="3" fill="${c}" fill-opacity="0.35" stroke="${c}" stroke-width="2"/>
      <rect x="27" y="22" width="10" height="32" rx="3" fill="${c}" fill-opacity="0.55" stroke="${c}" stroke-width="2"/>
      <rect x="44" y="12" width="10" height="42" rx="3" fill="#c7f303" fill-opacity="0.85" stroke="#c7f303" stroke-width="2"/>
    </svg>`:`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
    <circle cx="32" cy="32" r="25" fill="${c}" fill-opacity="0.16" stroke="${c}" stroke-width="2"/>
    <path d="M35 8L14 35H31L28 56L50 28H33L35 8Z" fill="#c7f303" stroke="#c7f303" stroke-width="2" stroke-linejoin="round"/>
  </svg>`}function ds({aspectRatio:d="9:16",hasBaseVideo:c=!1,badgeText:p="ECOSISTEMA IA • SG-SST",headline:g="5 Reglas de Oro en Seguridad",subheadline:z="Prevención inteligente en tiempo real con WAPPY Studio",accentColor:P="#14b8a6",templateId:h="golden-rules",scriptText:F="",durationSeconds:oe=28}){var Y,N,le;const R=d==="9:16",C=(p||"ECOSISTEMA IA • SG-SST").replace(/</g,"&lt;"),S=(g||"Prevención Inteligente WAPPY IA").replace(/</g,"&lt;"),se=(z||"Sincronización neural en vivo").replace(/</g,"&lt;"),W=c||h==="camera-overlay",ge=(F||"").trim()||`${S}. ${se}. Primero: Identifica y controla los peligros críticos en terreno. Segundo: Verifica cada protocolo con inteligencia artificial. Tercero: Protege la vida de tu equipo con WAPPY IA.`,k=xs(ge,oe),v=k.beats,K=E=>E==="cyan"?"background:linear-gradient(135deg,#06b6d4,#14b8a6);color:#041318;box-shadow:0 0 22px rgba(6,182,212,0.45);":E==="amber"?"background:linear-gradient(135deg,#f97316,#f59e0b);color:#180902;box-shadow:0 0 22px rgba(245,158,11,0.45);":"background:#c7f303;color:#0a1103;box-shadow:0 0 24px rgba(199,243,3,0.5);",X=v.map((E,he)=>{const Q=he===0,ve=he===v.length-1,m=E.text.replace(/</g,"&lt;"),f=(Q&&g?S.split(/\s+/).slice(0,3).join(" "):E.titleLead).replace(/</g,"&lt;"),b=(Q&&g&&g.split(/\s+/).length>3?g.split(/\s+/).slice(3).join(" "):E.titleHighlight).replace(/</g,"&lt;"),T=Nr(E.iconType,P);return h==="camera-overlay"?`
        <div id="scene-${E.index}" class="scene-layer ${Q?"":"opacity-0 pointer-events-none"} absolute inset-x-0 bottom-2 flex flex-col justify-end">
          <div data-editable="true" class="sc-card glass-card rounded-2xl p-3.5 sm:p-4 border-l-4" style="border-left-color:#c7f303;">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-[10px] font-mono uppercase tracking-widest text-[#c7f303] font-extrabold">${E.badge}</span>
              <span class="text-[10px] font-mono text-teal-300 font-bold">ESCENA 0${E.index}/0${v.length}</span>
            </div>
            <div class="flex items-center gap-3">
              ${T}
              <div>
                <h2 class="text-base sm:text-lg font-black text-white leading-tight font-display">
                  ${f} <span class="inline-block px-2 py-0.5 rounded-lg" style="${K(E.pillColor)}">${b}</span>
                </h2>
                <p class="text-xs text-slate-200 mt-1 leading-snug">${m}</p>
              </div>
            </div>
          </div>
        </div>`:Q?`
        <div id="scene-1" class="scene-layer absolute inset-0 flex flex-col justify-center gap-2.5 sm:gap-3">
          <div data-editable="true" class="sc-head text-center space-y-1.5">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span class="w-2 h-2 rounded-full bg-[#c7f303] animate-ping"></span>
              <span>${E.badge}</span>
            </div>
            <h1 class="${R?"text-2xl sm:text-3xl":"text-xl sm:text-2xl"} font-black tracking-tight text-white leading-none font-display">
              ${f} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${K("amber")}">${b}</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-200 font-semibold max-w-md mx-auto leading-snug">${m}</p>
          </div>

          <div class="grid grid-cols-1 gap-2 sm:gap-2.5 mt-1">
            <div data-editable="true" class="sc-item glass-card rounded-2xl p-3 border border-rose-500/40 bg-rose-950/25 flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-black text-sm shrink-0">✕</div>
                <div class="min-w-0">
                  <div class="text-xs sm:text-sm font-black text-white truncate">Práctica Improvisada / Sin Control</div>
                  <div class="text-[11px] text-rose-200/90 leading-tight">Fallas operativas, exceso de confianza y alto riesgo de accidente</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[9px] font-mono font-extrabold shrink-0">RIESGO SST</span>
            </div>

            <div data-editable="true" class="sc-item glass-card rounded-2xl p-3 border border-[#c7f303]/60 bg-emerald-950/30 flex items-center justify-between gap-2.5" style="box-shadow:0 0 28px rgba(199,243,3,0.14);">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-9 h-9 rounded-xl bg-[#c7f303]/20 border border-[#c7f303]/50 flex items-center justify-center text-[#c7f303] font-black text-sm shrink-0">⚡</div>
                <div class="min-w-0">
                  <div class="text-xs sm:text-sm font-black text-white truncate">Estándar Verificado ${C}</div>
                  <div class="text-[11px] text-emerald-200/95 leading-tight">${se}</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#c7f303] text-[#091004] text-[9px] font-mono font-black shrink-0">100% SEGURO</span>
            </div>
          </div>
        </div>`:he===1&&v.length>=3?`
        <div id="scene-${E.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>• ${E.badge}</span>
            </div>
            <h2 class="${R?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black text-white leading-tight font-display">
              ${f} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${K("cyan")}">${b}</span>
            </h2>
          </div>

          <div class="grid grid-cols-12 gap-2.5 items-stretch">
            <!-- Phone Mockup con Dynamic Island -->
            <div data-editable="true" class="sc-item col-span-5 rounded-3xl p-2.5 bg-slate-900/95 border-2 border-cyan-400/45 shadow-2xl flex flex-col justify-between">
              <div class="mx-auto px-2.5 py-0.5 rounded-full bg-black border border-white/15 flex items-center gap-1.5 mb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#c7f303]"></span>
                <span class="text-[8px] font-mono font-bold text-white uppercase tracking-wider">CONTROL LIVE</span>
              </div>
              <div class="rounded-2xl bg-slate-950/90 border border-white/10 p-2.5 flex-1 flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  ${T}
                  <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#c7f303] text-[8px] font-mono font-bold">ACTIVO</span>
                </div>
                <div class="my-1.5">
                  <div class="text-[9px] font-mono uppercase text-cyan-300 font-bold">VERIFICACIÓN IA</div>
                  <div class="text-xs font-black text-white leading-tight mt-0.5">${f} ${b}</div>
                </div>
                <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-[#14b8a6] to-[#c7f303] w-full"></div>
                </div>
              </div>
            </div>

            <!-- Tarjetas de Verificación / Firma Digital -->
            <div class="col-span-7 flex flex-col justify-between gap-2">
              <div data-editable="true" class="sc-item glass-card rounded-2xl p-2.5 border border-cyan-400/35">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] font-extrabold text-cyan-300 uppercase font-mono">📋 DIRECTRIZ EN CAMPO</span>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[8px] font-mono font-bold">✓ VALIDADO</span>
                </div>
                <p class="text-xs font-bold text-white leading-snug">${m}</p>
              </div>

              <div data-editable="true" class="sc-item glass-card rounded-2xl p-2.5 border border-[#c7f303]/40">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] font-extrabold text-[#c7f303] uppercase font-mono">✍️ TRAZABILIDAD SG-SST</span>
                  <span class="px-2 py-0.5 rounded-full bg-[#c7f303]/20 text-[#c7f303] text-[8px] font-mono font-bold">100% CUMPLIDO</span>
                </div>
                <svg viewBox="0 0 180 24" class="w-full h-5" fill="none">
                  <path d="M6 18C22 6 34 20 52 11C70 2 84 19 106 9C124 2 142 16 174 7" stroke="#c7f303" stroke-width="2.6" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>`:ve&&v.length>=2?`
        <div id="scene-${E.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#c7f303]/20 border border-[#c7f303]/50 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>${E.badge}</span>
            </div>
            <h2 class="${R?"text-2xl sm:text-3xl":"text-xl sm:text-2xl"} font-black text-white leading-none font-display">
              ${f} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${K("lime")}">${b}</span>
            </h2>
          </div>

          <div data-editable="true" class="sc-item glass-card rounded-3xl p-4 border-2 border-[#c7f303]/60 text-center space-y-2.5" style="box-shadow:0 0 35px rgba(199,243,3,0.18);">
            <div class="flex justify-center">${T}</div>
            <p class="text-xs sm:text-sm font-extrabold text-white leading-relaxed">${m}</p>
            <div class="pt-1 flex flex-wrap items-center justify-center gap-2">
              <span class="px-3 py-1 rounded-xl bg-[#c7f303] text-[#091004] text-[10px] font-black uppercase tracking-wider">⚡ WAPPY IA • SOMOS SST</span>
              <span class="px-3 py-1 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-mono font-bold">✓ CERO ACCIDENTES</span>
            </div>
          </div>
        </div>`:`
      <div id="scene-${E.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
        <div data-editable="true" class="sc-head text-center space-y-1">
          <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-500/15 border border-teal-400/40 text-teal-300 text-[10px] font-mono font-extrabold uppercase tracking-widest">
            <span>• ${E.badge} • PASO 0${E.index}</span>
          </div>
          <h2 class="${R?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black text-white leading-tight font-display">
            ${f} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${K(E.pillColor)}">${b}</span>
          </h2>
        </div>

        <div data-editable="true" class="sc-item glass-card rounded-3xl p-3.5 sm:p-4 border-l-4" style="border-left-color:#c7f303;">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-2xl bg-slate-900/90 border border-white/10 shrink-0">
              ${T}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-[10px] font-mono uppercase tracking-wider text-[#c7f303] font-extrabold">PROTOCOLO VERIFICADO</span>
                <span class="text-[10px] font-mono font-bold text-emerald-400">NIVEL ÓPTIMO • 100%</span>
              </div>
              <p class="text-xs sm:text-sm font-bold text-white leading-relaxed">${m}</p>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-3 gap-2 pt-2.5 border-t border-white/10">
            <div class="rounded-xl bg-slate-900/80 px-2.5 py-1.5 border border-teal-500/30">
              <div class="text-[9px] font-mono text-slate-400 uppercase">ESTADO</div>
              <div class="text-xs font-black text-emerald-400">✓ ACTIVO</div>
            </div>
            <div class="rounded-xl bg-slate-900/80 px-2.5 py-1.5 border border-cyan-500/30">
              <div class="text-[9px] font-mono text-slate-400 uppercase">PRECISIÓN IA</div>
              <div class="text-xs font-black text-cyan-300">99.8%</div>
            </div>
            <div class="rounded-xl bg-slate-900/80 px-2.5 py-1.5 border border-[#c7f303]/40">
              <div class="text-[9px] font-mono text-slate-400 uppercase">NORMATIVA</div>
              <div class="text-xs font-black text-[#c7f303]">SG-SST</div>
            </div>
          </div>
        </div>
      </div>`}).join(`
`),re=W?"":h==="kpi-hud"?`
      <!-- TARJETA INFERIOR ORÁCULO TENSHI IA (Estilo WAPPY_IA_Plataforma_40s) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${R?"max-w-md":"max-w-2xl"} mx-auto glass-card rounded-2xl p-2.5 px-3.5 border border-teal-400/35 flex items-center gap-3 shrink-0">
        <div class="relative w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-teal-500/30 to-emerald-500/20 border border-[#c7f303]/60 shrink-0 flex items-center justify-center">
          <img src="/assets/wappy/tenshi.png" alt="Tenshi IA" class="w-full h-full object-cover" onerror="this.style.display='none'" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono font-extrabold uppercase tracking-wider text-teal-300">TENSHI • ORIENTADOR Y ORQUESTADOR SST</span>
            <span class="text-[9px] font-mono text-[#c7f303] font-bold">EN VIVO</span>
          </div>
          <p id="host-live-caption" class="text-xs font-bold text-white truncate mt-0.5">${((Y=v[0])==null?void 0:Y.text.replace(/</g,"&lt;"))||se}</p>
        </div>
      </div>`:`
      <!-- PRESENTADOR FÉLIX 3D VOXEL CON LIP-SYNC Y GESTOS (Estilo Reel Matriz GTC-45 Oficial) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${R?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-center gap-3 shrink-0">
        <canvas id="wappy-felix-voxel" width="150" height="126" class="${R?"w-[122px] h-[102px]":"w-[96px] h-[80px]"} shrink-0 drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"></canvas>
        <div class="glass-card rounded-2xl p-2.5 px-3 border border-[#c7f303]/40 flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1.5 mb-0.5">
            <span id="host-live-badge" class="text-[9px] font-mono font-black uppercase tracking-wider text-[#c7f303]">${((N=v[0])==null?void 0:N.badge)||"WAPPY IA • SOMOS SST"}</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          </div>
          <p id="host-live-caption" class="text-[11px] font-bold text-slate-100 line-clamp-2 leading-snug">${((le=v[0])==null?void 0:le.text.replace(/</g,"&lt;"))||se}</p>
        </div>
      </div>`;return`<!DOCTYPE html>
<html lang="es" data-wappy-template="true">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&family=Plus+Jakarta+Sans:wght@500;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: ${W?"transparent":"#050c12"};
      color: #ffffff;
    }
    .font-display { font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif; }
    .grid-bg {
      background-image:
        linear-gradient(rgba(20, 184, 166, 0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(20, 184, 166, 0.07) 1px, transparent 1px);
      background-size: 32px 32px;
    }
    .glass-card {
      background: rgba(8, 16, 26, 0.84);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.52);
    }
    @keyframes radarSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .radar-sweep {
      transform-origin: 18px 18px;
      animation: radarSpin 3.2s linear infinite;
    }
  </style>
</head>
<body class="relative w-full h-full flex flex-col justify-between items-center ${R?"p-3.5 sm:p-4":"p-3.5 sm:p-5"} select-none overflow-hidden">
  <!-- Barra superior de progreso Verde Lima WAPPY -->
  <div class="absolute top-0 left-0 right-0 h-1 bg-slate-900/80 z-30 overflow-hidden">
    <div id="wappy-top-progress" class="h-full bg-gradient-to-r from-[#c7f303] via-[#14b8a6] to-[#06b6d4]" style="width: 8%;"></div>
  </div>

  ${W?"<!-- Fondo transparente para video base del usuario -->":`<div class="absolute inset-0 overflow-hidden pointer-events-none">
           <div class="absolute inset-0 grid-bg"></div>
           <canvas id="wappy-bg-canvas" class="absolute inset-0 w-full h-full opacity-75"></canvas>
           <div id="orb-1" class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-30" style="background: ${P};"></div>
           <div id="orb-2" class="absolute bottom-8 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25" style="background: #c7f303;"></div>
         </div>`}

  <!-- TOP HUD TÁCTICO WAPPY (Ecualizador + Insignia + Radar Holográfico) -->
  <div id="header-hud" data-editable="true" class="relative z-10 w-full ${R?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-between gap-2 shrink-0 pt-1">
    <div class="glass-card px-3 py-1.5 rounded-full inline-flex items-center gap-2 whitespace-nowrap border border-teal-500/30">
      <div class="flex items-end gap-0.5 h-3.5" id="hud-eq">
        <span class="eq-bar w-1 bg-cyan-400 rounded-full" style="height:60%"></span>
        <span class="eq-bar w-1 bg-[#c7f303] rounded-full" style="height:100%"></span>
        <span class="eq-bar w-1 bg-teal-400 rounded-full" style="height:45%"></span>
        <span class="eq-bar w-1 bg-cyan-300 rounded-full" style="height:80%"></span>
      </div>
      <span class="text-[10px] font-extrabold tracking-widest uppercase text-teal-300">${C}</span>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <div class="glass-card px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#c7f303] border border-[#c7f303]/35">
        <span class="w-2 h-2 rounded-full bg-[#c7f303] animate-pulse"></span>
        <span>WAPPY.CLUB</span>
      </div>
      <svg viewBox="0 0 36 36" class="w-8 h-8 shrink-0">
        <circle cx="18" cy="18" r="16" fill="rgba(8,18,28,0.85)" stroke="rgba(20,184,166,0.45)" stroke-width="1.2" stroke-dasharray="3 2"/>
        <circle cx="18" cy="18" r="10" fill="none" stroke="rgba(199,243,3,0.3)" stroke-width="1"/>
        <line x1="18" y1="18" x2="31" y2="10" stroke="#c7f303" stroke-width="1.8" stroke-linecap="round" class="radar-sweep"/>
        <circle cx="18" cy="18" r="2" fill="#c7f303"/>
      </svg>
    </div>
  </div>

  <!-- ESCENARIO MULTI-ESCENA SINCRONIZADO FRASE A FRASE CON LA VOZ -->
  <div id="scenes-wrapper" class="relative z-10 my-auto w-full ${R?"max-w-md min-h-[270px]":"max-w-2xl min-h-[210px]"} mx-auto flex-1 flex flex-col justify-center">
    ${X}
  </div>

  ${re}

  <!-- ESPACIO INFERIOR RESERVADO PARA SUBTÍTULOS DINÁMICOS -->
  <div class="relative z-10 ${R?"h-12":"h-10"} shrink-0 w-full"></div>

  <script>
    window.__wappyTimelineBeats = ${JSON.stringify(v)};
    window.__wappyWordTimings = ${JSON.stringify(k.wordTimings)};
    window.__wappyVoicePlaying = true;
    window.__wappyCurrentGesture = 'wave';

    (function() {
      var beats = window.__wappyTimelineBeats || [];
      var totalDur = ${k.totalDurationSeconds};
      var master = gsap.timeline({
        repeat: 0,
        onUpdate: function() {
          var p = master.progress();
          var progBar = document.getElementById('wappy-top-progress');
          if (progBar) progBar.style.width = Math.max(4, Math.round(p * 100)) + '%';
        }
      });
      window.mainTimeline = master;

      // Entrada inicial del HUD y primera escena
      master.from("#header-hud", { y: -18, opacity: 0, duration: 0.45, ease: "back.out(1.6)" }, 0);
      master.from("#scene-1 .sc-head", { y: 18, scale: 0.95, opacity: 0, duration: 0.45, ease: "back.out(1.6)" }, 0.05);
      master.from("#scene-1 .sc-item", { y: 20, opacity: 0, stagger: 0.1, duration: 0.45, ease: "back.out(1.5)" }, 0.18);

      // Coreografía exacta segundo a segundo para cada escena del guion
      for (var i = 1; i < beats.length; i++) {
        (function(idx) {
          var prevBeat = beats[idx - 1];
          var curBeat = beats[idx];
          var prevSel = "#scene-" + prevBeat.index;
          var curSel = "#scene-" + curBeat.index;
          var tSwitch = Math.max(0.5, curBeat.startSec);

          // Transición de salida de la escena anterior
          master.to(prevSel, {
            opacity: 0,
            scale: 0.92,
            y: -16,
            duration: 0.32,
            ease: "power2.in",
            pointerEvents: "none"
          }, Math.max(0.2, tSwitch - 0.32));

          // Actualizar texto en vivo de la tarjeta del presentador (Félix / Tenshi)
          master.call(function() {
            window.__wappyCurrentGesture = curBeat.gesture || 'pointRight';
            var cap = document.getElementById('host-live-caption');
            var bdg = document.getElementById('host-live-badge');
            if (cap) cap.textContent = curBeat.text;
            if (bdg) bdg.textContent = curBeat.badge;
          }, null, tSwitch);

          // Entrada dinámica de la nueva escena (Zoom-Through / Giro 3D / Slide Elástico)
          master.fromTo(curSel,
            { opacity: 0, scale: idx % 2 === 0 ? 1.08 : 0.9, rotationY: idx % 2 === 1 ? -18 : 0, y: 22 },
            { opacity: 1, scale: 1, rotationY: 0, y: 0, duration: 0.46, ease: "back.out(1.55)", pointerEvents: "auto" },
            tSwitch
          );
          master.fromTo(curSel + " .sc-item",
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.09, duration: 0.38, ease: "power3.out" },
            tSwitch + 0.08
          );
        })(i);
      }

      // Mantener la línea de tiempo exactamente hasta el segundo final sin apagar la última escena
      master.to({}, { duration: 0.1 }, totalDur);

      // Red de partículas estilo Constelación WAPPY + Renderizado Voxel 3D de Félix con Lip-Sync
      var bgCanvas = document.getElementById('wappy-bg-canvas');
      var bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
      var nodes = [];
      for (var n = 0; n < 22; n++) {
        nodes.push({
          x: Math.random() * 400,
          y: Math.random() * 600,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          r: 1.5 + Math.random() * 2
        });
      }

      var felixCanvas = document.getElementById('wappy-felix-voxel');
      var fCtx = felixCanvas ? felixCanvas.getContext('2d') : null;

      function drawSceneFrame(timeSec) {
        // 1) Ecualizador reactivo a la voz
        var eqBars = document.querySelectorAll('#hud-eq .eq-bar');
        for (var b = 0; b < eqBars.length; b++) {
          var h = window.__wappyVoicePlaying
            ? 30 + Math.abs(Math.sin(timeSec * 10 + b * 1.7)) * 70
            : 25;
          eqBars[b].style.height = Math.round(h) + '%';
        }

        // 2) Constelación de partículas de fondo
        if (bgCanvas && bgCtx) {
          var cw = bgCanvas.width = bgCanvas.clientWidth || 380;
          var ch = bgCanvas.height = bgCanvas.clientHeight || 600;
          bgCtx.clearRect(0, 0, cw, ch);
          for (var i = 0; i < nodes.length; i++) {
            var p1 = nodes[i];
            p1.x = (p1.x + p1.vx + cw) % cw;
            p1.y = (p1.y + p1.vy + ch) % ch;
            bgCtx.beginPath();
            bgCtx.arc(p1.x, p1.y, p1.r, 0, Math.PI * 2);
            bgCtx.fillStyle = i % 3 === 0 ? 'rgba(199,243,3,0.55)' : 'rgba(20,184,166,0.45)';
            bgCtx.fill();
            for (var j = i + 1; j < nodes.length; j++) {
              var p2 = nodes[j];
              var dx = p1.x - p2.x, dy = p1.y - p2.y;
              var dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 95) {
                bgCtx.beginPath();
                bgCtx.moveTo(p1.x, p1.y);
                bgCtx.lineTo(p2.x, p2.y);
                bgCtx.strokeStyle = 'rgba(20,184,166,' + ((1 - dist / 95) * 0.18).toFixed(3) + ')';
                bgCtx.lineWidth = 1;
                bgCtx.stroke();
              }
            }
          }
        }

        // 3) Avatar Voxel 3D de Félix (con camisa de cuadros amarilla WAPPY, gafas, barba y lip-sync)
        if (felixCanvas && fCtx) {
          var w = felixCanvas.width, h = felixCanvas.height;
          fCtx.clearRect(0, 0, w, h);
          var bob = Math.sin(timeSec * 3.6) * 2.2;
          var headTilt = Math.sin(timeSec * 2.1) * 0.035;
          var talkOpen = window.__wappyVoicePlaying
            ? Math.max(1.5, Math.abs(Math.sin(timeSec * 14.5) * Math.cos(timeSec * 6.2)) * 6.5)
            : 1.5;
          var blink = (Math.floor(timeSec * 2.5) % 9 === 0) && ((timeSec * 10) % 10 < 1.8);
          var g = window.__wappyCurrentGesture || 'wave';

          fCtx.save();
          fCtx.translate(w / 2, h - 6 + bob);

          // Torso — Camisa a cuadros amarilla/negra oficial WAPPY + camiseta blanca interna
          fCtx.fillStyle = '#eab308';
          fCtx.fillRect(-30, -44, 60, 44);
          fCtx.fillStyle = '#1e293b';
          for (var gx = -30; gx < 30; gx += 12) {
            fCtx.fillRect(gx, -44, 4, 44);
          }
          for (var gy = -42; gy < 0; gy += 11) {
            fCtx.fillRect(-30, gy, 60, 3);
          }
          // Camiseta blanca central
          fCtx.fillStyle = '#f1f5f9';
          fCtx.fillRect(-9, -44, 18, 44);
          // Bolsillo amarillo con logo W
          fCtx.fillStyle = '#facc15';
          fCtx.fillRect(11, -28, 13, 13);
          fCtx.fillStyle = '#0f172a';
          fCtx.font = '900 9px monospace';
          fCtx.fillText('W', 13.5, -18);

          // Brazos con gestos naturales según la escena
          var leftArmAngle = g === 'wave' || g === 'bothUp' ? -0.55 + Math.sin(timeSec * 6) * 0.18 : 0.12;
          var rightArmAngle = g === 'pointRight' || g === 'bothUp' ? 0.55 - Math.sin(timeSec * 6) * 0.18 : -0.12;

          fCtx.save();
          fCtx.translate(-32, -38);
          fCtx.rotate(leftArmAngle);
          fCtx.fillStyle = '#eab308';
          fCtx.fillRect(-10, 0, 11, 24);
          fCtx.fillStyle = '#d6a374';
          fCtx.fillRect(-9, 24, 9, 10);
          fCtx.restore();

          fCtx.save();
          fCtx.translate(32, -38);
          fCtx.rotate(rightArmAngle);
          fCtx.fillStyle = '#eab308';
          fCtx.fillRect(-1, 0, 11, 24);
          fCtx.fillStyle = '#d6a374';
          fCtx.fillRect(0, 24, 9, 10);
          fCtx.restore();

          // Cabeza Voxel 3D
          fCtx.save();
          fCtx.translate(0, -48);
          fCtx.rotate(headTilt);

          // Sombra lateral 3D de la cabeza
          fCtx.fillStyle = '#b9855a';
          fCtx.fillRect(-29, -54, 58, 52);
          // Rostro frontal
          fCtx.fillStyle = '#d6a374';
          fCtx.fillRect(-26, -54, 52, 50);

          // Cabello castaño oscuro voxelizado
          fCtx.fillStyle = '#2d1c12';
          fCtx.fillRect(-28, -64, 56, 15);
          fCtx.fillRect(-28, -54, 6, 22);
          fCtx.fillRect(22, -54, 6, 22);

          // Barba y bigote en bajo relieve
          fCtx.fillStyle = '#2b1b12';
          fCtx.fillRect(-26, -22, 52, 18);
          fCtx.fillRect(-16, -26, 32, 6);

          // Gafas negras cuadradas características
          fCtx.strokeStyle = '#0f172a';
          fCtx.lineWidth = 3.2;
          fCtx.strokeRect(-21, -44, 17, 13);
          fCtx.strokeRect(4, -44, 17, 13);
          fCtx.fillStyle = '#0f172a';
          fCtx.fillRect(-4, -40, 8, 3);

          // Ojos con parpadeo natural
          if (blink) {
            fCtx.fillStyle = '#2d1c12';
            fCtx.fillRect(-17, -38, 9, 2.5);
            fCtx.fillRect(8, -38, 9, 2.5);
          } else {
            fCtx.fillStyle = '#ffffff';
            fCtx.fillRect(-17, -41, 9, 7);
            fCtx.fillRect(8, -41, 9, 7);
            fCtx.fillStyle = '#1e293b';
            fCtx.fillRect(-13, -39, 4, 5);
            fCtx.fillRect(11, -39, 4, 5);
          }

          // Boca sincronizada con la voz (Lip-Sync en vivo)
          fCtx.fillStyle = '#180d08';
          fCtx.fillRect(-9, -18, 18, Math.max(2, talkOpen));
          fCtx.fillStyle = '#f87171';
          fCtx.fillRect(-6, -17 + Math.max(1, talkOpen * 0.45), 12, Math.max(1, talkOpen * 0.45));

          fCtx.restore();
          fCtx.restore();
        }
      }

      window.__wappyRenderTick = function(tSec) {
        drawSceneFrame(tSec || 0);
      };

      var startPerf = performance.now();
      function loop(now) {
        var t = typeof window.__wappyCurrentTime === 'number'
          ? window.__wappyCurrentTime
          : (now - startPerf) / 1000;
        drawSceneFrame(t);
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    })();
  <\/script>
</body>
</html>`}function Tr(d){if(!d)return"";if(d.includes('id="wappy-studio-runtime-bridge"'))return d;const c=`<script id="wappy-studio-gsap-hook">
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
<\/script>`,p=`<style id="wappy-studio-bridge-styles">
  html, body {
    width: 100% !important;
    height: 100% !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    margin: 0 !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  /* Ocultar contenedores de subtítulos internos duplicados creados por LLMs para que solo se vea el HUD oficial sincronizado */
  #subtitle-footer, #subtitle-card, #subtitle-container, #subtitle-box, footer[id*="subtitle"] {
    display: none !important;
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

    if (data.type === 'STUDIO_PLAY') {
      window.__wappyVoicePlaying = true;
      if (window.mainTimeline) window.mainTimeline.play();
      if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.play();
    } else if (data.type === 'STUDIO_PAUSE') {
      window.__wappyVoicePlaying = false;
      if (window.mainTimeline) window.mainTimeline.pause();
      if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.pause();
    } else if (data.type === 'STUDIO_RESTART') {
      window.__wappyVoicePlaying = true;
      window.__wappyCurrentTime = 0;
      if (window.mainTimeline) window.mainTimeline.restart();
      else if (window.gsap && window.gsap.globalTimeline) window.gsap.globalTimeline.restart();
      if (typeof window.__wappyRenderTick === 'function') window.__wappyRenderTick(0);
    } else if (data.type === 'STUDIO_SEEK') {
      var p = Math.max(0, Math.min(1, Number(data.progress || 0)));
      if (typeof data.time === 'number') window.__wappyCurrentTime = data.time;
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        window.mainTimeline.progress(p);
      } else if (window.gsap && window.gsap.globalTimeline && typeof data.time === 'number') {
        window.gsap.globalTimeline.time(data.time);
      }
      if (typeof window.__wappyRenderTick === 'function' && typeof data.time === 'number') {
        window.__wappyRenderTick(data.time);
      }
    } else if (data.type === 'STUDIO_SYNC_TIME') {
      var curT = Number(data.currentTime || 0);
      var durT = Math.max(0.5, Number(data.duration || 20));
      var prog = Math.max(0, Math.min(0.9999, curT / durT));
      window.__wappyCurrentTime = curT;
      window.__wappyVoicePlaying = Boolean(data.playing);
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        var tlDur = window.mainTimeline.duration();
        if (tlDur > 0.5 && typeof window.mainTimeline.timeScale === 'function') {
          window.mainTimeline.timeScale(tlDur / durT);
        }
        if (Math.abs(window.mainTimeline.progress() - prog) > 0.015) {
          window.mainTimeline.progress(prog, false);
        }
      }
      if (typeof window.__wappyRenderTick === 'function') {
        window.__wappyRenderTick(curT, durT);
      }
    } else if (data.type === 'STUDIO_SET_EDIT_MODE') {
      editMode = Boolean(data.enabled);
      if (editMode) {
        window.__wappyVoicePlaying = false;
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
<\/script>`;let g=d.replace(/subtitles\.reverse\(\)/g,"subtitles.slice().reverse()");return g.includes("<head>")?g=g.replace("<head>",`<head>
${c}`):g=`${c}
${g}`,g.includes("</body>")?g=g.replace("</body>",`${p}
</body>`):g=`${g}
${p}`,g}const ia="wappy_studio_audio_library",Ot="wappy_gemini_api_keys";function da(){try{const d=localStorage.getItem(Ot);if(!d)return[];let c;try{c=JSON.parse(d)}catch{c=d.split(",")}return typeof c=="string"&&(c=c.split(",")),Array.isArray(c)?c.map((p,g)=>typeof p=="string"?{key:p.trim(),label:`Clave #${g+1}`,status:"unchecked"}:p&&typeof p.key=="string"?{key:p.key.trim(),label:p.label||`Clave #${g+1}`,status:p.status||"unchecked"}:null).filter(p=>!!(p&&p.key)):[]}catch{return[]}}function Z(d){const c=d||localStorage.getItem("token")||"",p=da().map(g=>g.key.trim()).filter(g=>g.length>15).join(",");return{"Content-Type":"application/json",...c?{Authorization:`Bearer ${c}`}:{},...p?{"x-gemini-api-keys":p}:{}}}async function we(d){const c=await d.text();try{return JSON.parse(c)}catch{throw d.status===401||c.trim()==="Unauthorized"?new Error("Tu sesión está actualizándose. Intenta nuevamente en un segundo."):new Error(c.slice(0,180)||`Error del servidor (${d.status})`)}}function Cr(d){const c=Math.max(1,Math.round(d||0)),p=Math.floor(c/60),g=c%60;return`${p}m ${g}s`}function Er(d){try{return new Date(d).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return""}}function ai({portable:d=!1}={}){var Xa;const{user:c,token:p,isAuthenticated:g}=cr(),{data:z}=pr(),P=Xs(),h=(P==null?void 0:P.navVisible)??!0,F=(P==null?void 0:P.setNavVisible)??(()=>{}),[oe,R]=Qs(),C=oe.get("tab")||"tts",[S,se]=i.useState(["tts","video","lab","library"].includes(C)?C:"tts"),[W,ge]=i.useState(()=>{var t,a;return((a=(t=c==null?void 0:c.personalization)==null?void 0:t.geminiModels)==null?void 0:a.sstManagement)||(wr.GOOGLE_MODELS||"gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite").split(",")[0].trim()||"gemini-3.8-flash"}),[k,v]=i.useState(!1),[K,X]=i.useState("keys"),[re,Y]=i.useState(()=>Object.values(zt)),[N,le]=i.useState(()=>vr),[E,he]=i.useState(()=>kr),[Q,ve]=i.useState(()=>jr),[m,f]=i.useState("gemini-3.8-flash-tts"),[b,T]=i.useState("Kore"),[_,J]=i.useState("Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido."),[H,je]=i.useState(!1),[Se,pa]=i.useState("Puck"),[Ne,ua]=i.useState("Kore"),[Te,xa]=i.useState(150),[A,qe]=i.useState(xt[0].text),[_t,ms]=i.useState("Voz expresiva, tono conversacional y alegre."),[Ce,bs]=i.useState("Hola. Hoy quiero demostrarte cómo suena una respiración natural <breath> y cómo reacciono con una pequeña risa <laugh> cuando algo resulta verdaderamente sorprendente."),[ma,ba]=i.useState(!1),[gs,ga]=i.useState(null),[Bt,hs]=i.useState(0),[fs,ys]=i.useState(0),[gt,ht]=i.useState(.5),[at,ft]=i.useState(1),[Ut,ha]=i.useState(!1),[fa,ya]=i.useState(!1),[ws,wa]=i.useState(null),[te,be]=i.useState(null),st=i.useRef(null),[yt,vs]=i.useState("all"),[wt,va]=i.useState("only_active"),[Ft,ks]=i.useState(""),[Wt,js]=i.useState(!0),[u,ie]=i.useState(null),[Le,Ke]=i.useState(()=>{try{const t=localStorage.getItem(ia);return t?JSON.parse(t):[]}catch{return[]}}),[V,Ht]=i.useState("9:16"),[Ye,Ss]=i.useState("golden-rules"),[$e,ka]=i.useState("bottom"),[ja,Sa]=i.useState(!1),[ee,Na]=i.useState(null),[Ta,Ca]=i.useState(""),[vt,Ns]=i.useState(!1),[_e,Ea]=i.useState(null),[Aa,Pa]=i.useState(""),[fe,Ma]=i.useState(!0),[La,Ts]=i.useState("CÁPSULA INTERACTIVA WAPPY"),[rt,Cs]=i.useState("5 Reglas de Oro en Riesgo Eléctrico"),[Ia,Es]=i.useState("Prevención inteligente y locución neural sincronizada"),[za,As]=i.useState("#14b8a6"),[Ra,Ps]=i.useState("Crea una animación estilo Claude con tarjetas de cristal sobre las 5 reglas de oro de riesgo eléctrico, iconos luminosos y barras de progreso."),[kt,Oa]=i.useState(!1),[Gt,Ms]=i.useState(!1),[Be,Ue]=i.useState(()=>ds({aspectRatio:"9:16",hasBaseVideo:!1,badgeText:"ECOSISTEMA IA • SG-SST",headline:"5 Reglas de Oro en Riesgo Eléctrico",subheadline:"Prevención inteligente y locución neural sincronizada",accentColor:"#14b8a6",templateId:"golden-rules",scriptText:xt[0].text,durationSeconds:28})),[ke,Fe]=i.useState(!0),[We,Ee]=i.useState(0),[$,Je]=i.useState(20),[qt,Ls]=i.useState(!1),[ne,jt]=i.useState(!1),[de,Kt]=i.useState(null),ye=i.useRef(""),[it,Da]=i.useState(!1),[St,Nt]=i.useState(!1),[Ze,j]=i.useState(null),[Is,nt]=i.useState(!1),[Tt,Ct]=i.useState(()=>{const t=da();return[t[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},t[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},t[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}]}),[Yt,Va]=i.useState(!1),[$a,ot]=i.useState(""),Ae=i.useMemo(()=>Tt.filter(t=>t.key.trim().length>15).length,[Tt]);i.useEffect(()=>{const t=()=>{const r=da();Ct([r[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},r[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},r[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}])},a=r=>{r.key===Ot&&t()};return window.addEventListener("wappy-keys-updated",t),window.addEventListener("storage",a),()=>{window.removeEventListener("wappy-keys-updated",t),window.removeEventListener("storage",a)}},[]);const zs=async()=>{Va(!0),ot("");try{const t=[...Tt];let a=0;for(let s=0;s<t.length;s++){const n=t[s].key.trim();if(!n){t[s]={...t[s],key:"",status:"unchecked"};continue}try{const o=await fetch("/api/studio/keys-validate",{method:"POST",headers:Z(p),body:JSON.stringify({apiKey:n})}),l=await o.json().catch(()=>({}));o.ok&&l.valid?(t[s]={...t[s],key:n,status:"valid"},a++):t[s]={...t[s],key:n,status:"invalid"}}catch{t[s]={...t[s],key:n,status:"unchecked"}}}Ct(t);const r=t.filter(s=>s.key.trim().length>0);localStorage.setItem(Ot,JSON.stringify(r)),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),ot(r.length===0?"Claves personalizadas limpiadas. Se utilizarán las claves del servidor WAPPY.":`¡Guardadas ${r.length} clave(s) (${a} verificada(s) en vivo con Google Gemini)!`)}finally{Va(!1)}},M=i.useRef(null),pe=i.useRef(null),ue=i.useRef(null),_a=i.useRef(null),Rs=i.useMemo(()=>Tr(Be),[Be]);i.useEffect(()=>{const t=()=>{const a=!!document.fullscreenElement;Ls(a),setTimeout(()=>{var r,s;(s=(r=M.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},80),setTimeout(()=>{var r,s;(s=(r=M.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},300)};return document.addEventListener("fullscreenchange",t),()=>document.removeEventListener("fullscreenchange",t)},[]),i.useEffect(()=>{const t=a=>{const r=a.data||{};r.type==="STUDIO_ELEMENT_SELECTED"?Kt(r.payload||null):r.type==="STUDIO_HTML_UPDATED"&&typeof r.htmlCode=="string"&&(ye.current=r.htmlCode)};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[]),i.useEffect(()=>{const t=Le.slice(0,60);try{localStorage.setItem(ia,JSON.stringify(t))}catch{try{localStorage.setItem(ia,JSON.stringify(t.map(({audioBase64:a,...r})=>r)))}catch{}}},[Le]),i.useEffect(()=>{const t=Le.filter(a=>a.audioBase64&&!a.mediaKey);t.length!==0&&(async()=>{const a={};for(const r of t)try{const s=`audio-${r.id}`;await Ge(s,It(r.audioBase64)),a[r.id]=s}catch{}Object.keys(a).length!==0&&Ke(r=>r.map(s=>a[s.id]?{...s,mediaKey:a[s.id],audioBase64:void 0}:s))})()},[]);const Jt=i.useRef(null),Ba=t=>{Jt.current&&URL.revokeObjectURL(Jt.current);const a=URL.createObjectURL(t);return Jt.current=a,a},Et=async(t,a)=>{const r=`audio-${t.id}`;let s=null;try{if(a.base64)s=It(a.base64);else if(a.url){const o=await fetch(a.url,{headers:Z(p)});o.ok&&(s=await o.blob())}s&&await Ge(r,s)}catch{s=null}const n=s?{...t,kind:t.kind||"audio",mediaKey:r,audioBase64:void 0}:{...t,kind:t.kind||"audio",audioBase64:a.base64};return Ke(o=>[n,...o.filter(l=>l.id!==t.id)]),s?r:void 0},Ua=async t=>{if(t.mediaKey){const a=await ut(t.mediaKey);if(a)return a}if(t.audioBase64)return It(t.audioBase64);if(t.downloadUrl)try{const a=await fetch(t.downloadUrl,{headers:Z(p)});if(a.ok){const r=await a.blob(),s=`audio-${t.id}`;return Ge(s,r).then(()=>Ke(n=>n.map(o=>o.id===t.id?{...o,mediaKey:s}:o))).catch(()=>{}),r}}catch{}return null},Fa=async(t,a=!1)=>{const r=await Ua(t);return r?(ie({url:Ba(r),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey||`audio-${t.id}`}),t.durationSeconds&&t.durationSeconds>1&&Je(t.durationSeconds),a&&Pe("video"),!0):(j({type:"error",text:"Este audio se generó antes de activar el guardado permanente y el servidor ya lo liberó (se reinició). Vuelve a generarlo: desde ahora todos los audios quedan guardados en tu navegador."}),!1)},Zt=(t,a)=>{const r=URL.createObjectURL(t),s=document.createElement("a");s.href=r,s.download=a,document.body.appendChild(s),s.click(),document.body.removeChild(s),setTimeout(()=>URL.revokeObjectURL(r),4e3)},Os=t=>{Ke(a=>{const r=a.filter(n=>n.id!==t.id);return[t.mediaKey,t.htmlKey,t.mp4Key,t.capsuleKey].filter(Boolean).forEach(n=>{r.some(l=>[l.mediaKey,l.htmlKey,l.mp4Key,l.capsuleKey].includes(n))||fr(n)}),r})};i.useEffect(()=>{var a;const t=(a=z==null?void 0:z[ur.google])==null?void 0:a.models;if(Array.isArray(t)&&t.length>0){const r=t.map(s=>(typeof s=="string"?s:(s==null?void 0:s.id)||(s==null?void 0:s.value)||"").replace("models/","").trim()).filter(s=>s&&s.includes("tts"));r.length>0&&Y(s=>{const n=new Map(s.map(x=>[x.id,x])),o=Object.keys(zt);return Array.from(new Set([...o,...r])).map(x=>zt[x]||n.get(x)||{id:x,name:x,badge:"GOOGLE_MODELS",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:`Modelo TTS cargado desde GOOGLE_MODELS (${x}).`,supportsMultiSpeaker:!x.includes("lite"),supportsVocalBursts:!x.includes("2.5"),supportedVoices:zt["gemini-3.8-flash-tts"].supportedVoices})})}},[z]),i.useEffect(()=>{fetch("/api/studio/catalog",{headers:Z(p)}).then(t=>t.ok?t.json():null).then(t=>{t&&(Array.isArray(t.models)&&t.models.length>0&&Y(t.models),Array.isArray(t.voices)&&t.voices.length>0&&le(t.voices),Array.isArray(t.presets)&&t.presets.length>0&&he(t.presets),Array.isArray(t.vocalBursts)&&t.vocalBursts.length>0&&ve(t.vocalBursts))}).catch(()=>{})},[p]),i.useEffect(()=>{const t=A.trim(),a=t?t.split(/\s+/).filter(Boolean).length:0;if(hs(a),ys(t.length),!t){ht(0),ft(0);return}const r=setTimeout(()=>{fetch("/api/studio/tts/estimate",{method:"POST",headers:Z(p),body:JSON.stringify({text:t,maxWordsPerChunk:Te})}).then(s=>s.ok?s.json():null).then(s=>{s&&typeof s.estimatedMinutes=="number"?ht(s.estimatedMinutes):ht(Math.round(a/145*10)/10),s&&typeof s.chunkCount=="number"?ft(s.chunkCount):ft(Math.max(1,Math.ceil(a/Te)))}).catch(()=>{ht(Math.round(a/145*10)/10),ft(Math.max(1,Math.ceil(a/Te)))})},250);return()=>clearTimeout(r)},[A,Te,p]);const Pe=t=>{se(t),R({tab:t})};i.useEffect(()=>{const t=a=>{const r=a.detail;["tts","video","lab","library"].includes(r)&&Pe(r)};return window.addEventListener("wappy-studio-switch-tab",t),()=>window.removeEventListener("wappy-studio-switch-tab",t)},[]);const O=i.useMemo(()=>re.find(t=>t.id===m)||re[0],[re,m]),Xe=t=>O!=null&&O.supportedVoices?O.supportedVoices.includes(t):!0,Ds=i.useMemo(()=>N.filter(t=>{const a=Xe(t.id),r=wt==="all"||a,s=yt==="all"||t.gender===yt,n=Ft.trim().toLowerCase(),o=!n||t.name.toLowerCase().includes(n)||t.tone.toLowerCase().includes(n)||t.recommendedFor.toLowerCase().includes(n)||t.tag&&t.tag.toLowerCase().includes(n);return r&&s&&o}),[N,O,wt,yt,Ft]),Vs=async(t,a)=>{a==null||a.stopPropagation();try{wa(t);const r=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:Z(p),body:JSON.stringify({voiceName:t,model:Xe(t)?m:"gemini-3.8-flash-tts",text:`Hola, soy ${t}. Esta es una muestra de voz neural en WAPPY Studio para tus cápsulas y cursos.`})}),s=await we(r);if(!r.ok||!s.success)throw new Error(s.error||"No se pudo sintetizar la muestra.");ie({base64:s.audioBase64,title:`Muestra de Voz: ${t}`,durationSeconds:s.durationSeconds,voiceName:t})}catch(r){j({type:"error",text:r.message||"Error en audición de voz."})}finally{wa(null)}},$s=async()=>{try{ya(!0),j(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:Z(p),body:JSON.stringify({voiceName:b,model:m,text:"¡Conexión verificada con éxito! El motor de voz Gemini 3.8 Flash TTS en WAPPY Studio está listo."})}),a=await we(t);if(!t.ok||!a.success)throw new Error(a.error||"Error probando conexión.");ie({base64:a.audioBase64,title:`Prueba de Conexión (${b})`,durationSeconds:a.durationSeconds,voiceName:b}),j({type:"success",text:`¡Conexión activa con ${a.usedModel||m}! Audio sintetizado correctamente.`})}catch(t){j({type:"error",text:t.message||"Error de conexión con Gemini TTS."})}finally{ya(!1)}},_s=async()=>{if(!A.trim())return;const t=A.trim().slice(0,850),a=t.split(/\s+/).filter(Boolean).length,r=Math.max(3,Math.round(a/145*60)),s=`preview_${Date.now()}`;try{ha(!0),j(null),be({id:s,status:"processing",totalChunks:1,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:r,generatedTotalSeconds:0,progressPercent:0,chunks:[{index:0,wordCount:a,status:"processing"}]});const n=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:Z(p),body:JSON.stringify({text:t,voiceName:b,stylePrompt:_,model:m,multiSpeaker:H,speaker1:{name:"Alex",voiceName:Se},speaker2:{name:"Sam",voiceName:Ne}})}),o=await we(n);if(!n.ok||!o.success)throw new Error(o.error||"Error al sintetizar vista previa.");const l=`data:audio/wav;base64,${o.audioBase64}`;be({id:s,status:"completed",totalChunks:1,currentChunkIndex:0,completedChunks:1,estimatedTotalSeconds:r,generatedTotalSeconds:o.durationSeconds||r,progressPercent:100,downloadUrl:l,chunks:[{index:0,wordCount:a,status:"completed",durationSeconds:o.durationSeconds,audioBase64:o.audioBase64}]}),ie({base64:o.audioBase64,title:`Audio Completo: ${t.slice(0,42)}...`,durationSeconds:o.durationSeconds,voiceName:H?`${Se} + ${Ne}`:b,scriptText:t});const x={id:Date.now().toString(),title:`Vista Previa: ${t.slice(0,42)}...`,createdAt:Date.now(),voiceName:H?`${Se} + ${Ne}`:b,model:o.usedModel||m,durationSeconds:o.durationSeconds,wordCount:a,stylePrompt:_,scriptText:t},w=await Et(x,{base64:o.audioBase64});w&&ie(D=>D&&{...D,mediaKey:w}),j({type:"success",text:"Audio generado y cargado en el reproductor. Puedes descargarlo en WAV o enviarlo al Compositor de Video."})}catch(n){be(o=>o?{...o,status:"failed",error:n.message||"Error sintetizando fragmento."}:null),j({type:"error",text:n.message||"Error sintetizando fragmento."})}finally{ha(!1)}},Bs=async()=>{if(Ce.trim())try{ba(!0),j(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:Z(p),body:JSON.stringify({text:Ce.trim(),voiceName:b,stylePrompt:_t,model:m})}),a=await we(t);if(!t.ok||!a.success)throw new Error(a.error||"Error al sintetizar en el laboratorio.");ie({base64:a.audioBase64,title:`Laboratorio (${b}): ${Ce.trim().slice(0,34)}...`,durationSeconds:a.durationSeconds,voiceName:b,scriptText:Ce.trim()});const r={id:Date.now().toString(),title:`Laboratorio: ${Ce.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:b,model:a.usedModel||m,durationSeconds:a.durationSeconds,wordCount:Ce.trim().split(/\s+/).filter(Boolean).length,stylePrompt:_t,scriptText:Ce.trim()},s=await Et(r,{base64:a.audioBase64});s&&ie(n=>n&&{...n,mediaKey:s})}catch(t){j({type:"error",text:t.message||"Error sintetizando prueba en el laboratorio."})}finally{ba(!1)}},Us=async()=>{if(A.trim())try{j(null),st.current&&st.current.close();const t=await fetch("/api/studio/tts/jobs",{method:"POST",headers:Z(p),body:JSON.stringify({text:A,voiceName:b,stylePrompt:_,model:m,multiSpeaker:H,speaker1:{name:"Alex",voiceName:Se},speaker2:{name:"Sam",voiceName:Ne},maxWordsPerChunk:Te})}),a=await we(t);if(!t.ok)throw new Error(a.error||"No se pudo iniciar el trabajo de larga duración.");const r={id:a.jobId,status:"processing",totalChunks:a.totalChunks,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:a.estimatedTotalSeconds,generatedTotalSeconds:0,progressPercent:0,chunks:Array.from({length:a.totalChunks},(o,l)=>({index:l,wordCount:0,status:"pending"}))};be(r);const s=new EventSource(`/api/studio/tts/jobs/${a.jobId}/stream${p?`?token=${encodeURIComponent(p)}`:""}`);st.current=s,s.addEventListener("snapshot",o=>{const l=JSON.parse(o.data);be(x=>x?{...x,...l}:l)}),s.addEventListener("chunk_start",o=>{const l=JSON.parse(o.data);be(x=>{if(!x)return null;const w=[...x.chunks];return w[l.chunkIndex]&&(w[l.chunkIndex]={...w[l.chunkIndex],status:"processing"}),{...x,currentChunkIndex:l.chunkIndex,chunks:w}})}),s.addEventListener("chunk_complete",o=>{const l=JSON.parse(o.data);be(x=>{if(!x)return null;const w=[...x.chunks];w[l.chunkIndex]&&(w[l.chunkIndex]={...w[l.chunkIndex],status:"completed",durationSeconds:l.durationSeconds,audioBase64:l.audioBase64});const D=w.filter(G=>G.status==="completed").length;return{...x,completedChunks:D,progressPercent:l.progressPercent,generatedTotalSeconds:l.generatedTotalSeconds,chunks:w}})}),s.addEventListener("job_completed",o=>{const l=JSON.parse(o.data);s.close(),be(w=>w?{...w,status:"completed",progressPercent:100,downloadUrl:l.downloadUrl}:null),ie({url:l.downloadUrl,title:`Audio Completo: ${A.trim().slice(0,35)}...`,durationSeconds:l.totalDurationSeconds,voiceName:b,scriptText:A});const x={id:l.id,title:`Audio Completo: ${A.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:b,model:m,durationSeconds:l.totalDurationSeconds,wordCount:Bt,downloadUrl:l.downloadUrl,stylePrompt:_,scriptText:A};Et(x,{url:l.downloadUrl}).then(w=>{w&&ie(D=>D&&{...D,mediaKey:w})})}),s.addEventListener("job_failed",o=>{const l=JSON.parse(o.data);s.close(),be(x=>x?{...x,status:"failed",error:l.error}:null)}),s.addEventListener("job_status",o=>{const l=JSON.parse(o.data);be(x=>x?{...x,status:l.status}:null)});const n=o=>{try{const l=JSON.parse(o.data);be(x=>x?{...x,failoverNotice:l.message||(l.label?`Salto automático a ${l.label} (${l.reason||"429"})`:"Cuota 429 detectada en la clave anterior. Rotación automática a clave de respaldo activada.")}:null)}catch{}};s.addEventListener("key_failover",n),s.addEventListener("api_key_failover",n)}catch(t){j({type:"error",text:t.message||"Error iniciando trabajo."})}},Fs=async()=>{try{v(!0),j(null);const t=await fetch("/api/studio/script/enhance",{method:"POST",headers:Z(p),body:JSON.stringify({scriptText:A,stylePrompt:_,multiSpeaker:H,modelName:W})}),a=await we(t);if(!t.ok||!a.success||!a.scriptText)throw new Error(a.error||"No se pudo mejorar el guion con IA.");qe(a.scriptText),j({type:"success",text:`¡Guion enriquecido con expresiones vocales (<breath>, <laugh>) usando ${a.usedModel||W}!`})}catch(t){j({type:"error",text:t.message||"Error mejorando el guion con IA."})}finally{v(!1)}},Xt=async t=>{te&&(t==="cancel"&&st.current&&st.current.close(),await fetch(`/api/studio/tts/jobs/${te.id}/control`,{method:"POST",headers:Z(p),body:JSON.stringify({action:t})}),be(a=>a?{...a,status:t==="pause"?"paused":t==="resume"?"processing":"cancelled"}:null))},Qt=t=>{const a=document.getElementById("wappy-studio-tts-editor");if(!a){qe(o=>`${o} ${t}`);return}const r=a.selectionStart,s=a.selectionEnd,n=A.substring(0,r)+t+A.substring(s);qe(n),setTimeout(()=>{a.focus(),a.setSelectionRange(r+t.length,r+t.length)},15)},Ie=(t=V,a=!!ee,r=Ye,s,n,o)=>{const l=s??((u==null?void 0:u.scriptText)||A),x=Math.max(5,Math.round(n??((u==null?void 0:u.durationSeconds)||$||28)));Ue(ds({aspectRatio:t,hasBaseVideo:a,badgeText:La,headline:rt,subheadline:Ia,accentColor:za,templateId:r,scriptText:l,durationSeconds:x})),r!=="camera-overlay"&&!a&&fetch("/api/studio/video/compile-master-reel",{method:"POST",headers:Z(p),body:JSON.stringify({scriptText:l,headline:rt,aspectRatio:t,hasBaseVideo:a,showSubtitles:fe,durationSeconds:x,companyName:(c==null?void 0:c.name)||"WAPPY IA",audioBase64:o||(u==null?void 0:u.base64)||void 0})}).then(w=>we(w)).then(w=>{w!=null&&w.success&&w.htmlCode&&Ue(w.htmlCode)}).catch(()=>{})},Wa=i.useRef(!1);i.useEffect(()=>{S==="video"&&!Wa.current&&(Wa.current=!0,Ie(V,!!ee,Ye,(u==null?void 0:u.scriptText)||A,(u==null?void 0:u.durationSeconds)||$||28,u==null?void 0:u.base64))},[S]);const Ws=async()=>{const t=(A||rt||"").trim().slice(0,750);if(t)try{Sa(!0),j(null);const a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:Z(p),body:JSON.stringify({text:t,voiceName:b,stylePrompt:_,model:m,multiSpeaker:H,speaker1:{name:"Alex",voiceName:Se},speaker2:{name:"Sam",voiceName:Ne}})}),r=await we(a);if(!a.ok||!r.success)throw new Error(r.error||"No se pudo sintetizar la voz para el video.");ie({base64:r.audioBase64,title:`Locución de Video (${b})`,durationSeconds:r.durationSeconds,voiceName:b,scriptText:t}),Et({id:`vo-${Date.now()}`,title:`Locución de Video: ${t.slice(0,40)}...`,createdAt:Date.now(),voiceName:b,model:r.usedModel||m,durationSeconds:r.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,stylePrompt:_,scriptText:t},{base64:r.audioBase64}).then(s=>{s&&ie(n=>n&&{...n,mediaKey:s})}),r.durationSeconds&&r.durationSeconds>1&&Je(r.durationSeconds),Be.includes('data-wappy-template="true"')&&Ie(V,!!ee,Ye,t,r.durationSeconds,r.audioBase64),Ee(0),Fe(!0),setTimeout(()=>{var s,n,o,l;(n=(s=M.current)==null?void 0:s.contentWindow)==null||n.postMessage({type:"STUDIO_RESTART"},"*"),(o=ue.current)==null||o.play().catch(()=>{}),(l=pe.current)==null||l.play().catch(()=>{})},120),j({type:"success",text:`¡Locución neural (${b} • ${r.durationSeconds}s) sincronizada al milisegundo con el Motor Maestro 60-FPS + Avatar 3D!`})}catch(a){j({type:"error",text:a.message||"Error sincronizando voz con el video."})}finally{Sa(!1)}},Hs=async()=>{var t;try{Oa(!0),j(null);const a=await At(),r=await fetch("/api/studio/video/generate-html",{method:"POST",headers:Z(p),body:JSON.stringify({prompt:Ra,scriptText:A,aspectRatio:V,hasBaseVideo:!!ee,showSubtitles:fe,durationSeconds:Math.round((u==null?void 0:u.durationSeconds)||$||25),companyName:(c==null?void 0:c.name)||"WAPPY IA",modelName:W,audioBase64:a||void 0})}),s=await we(r);if(!r.ok||!s.success)throw new Error(s.error||"Error generando composición HTML con IA.");(t=s.timelineMap)!=null&&t.totalDurationSeconds&&s.timelineMap.totalDurationSeconds>2&&Je(s.timelineMap.totalDurationSeconds),Ue(s.htmlCode),j({type:"success",text:"¡Motor Maestro 60-FPS de Antigravity (7 Arquetipos + Avatar 3D Voxel) generado y sincronizado con la voz!"})}catch(a){j({type:"error",text:a.message||"No se pudo generar la escena HTML con IA."})}finally{Oa(!1)}},Gs=t=>{var s;const a=(s=t.target.files)==null?void 0:s[0];if(!a)return;ee&&URL.revokeObjectURL(ee);const r=URL.createObjectURL(a);Na(r),Ca(a.name),Ie(V,!0)},qs=t=>{var s;const a=(s=t.target.files)==null?void 0:s[0];if(!a)return;_e&&URL.revokeObjectURL(_e);const r=URL.createObjectURL(a);Ea(r),Pa(a.name)},xe=i.useMemo(()=>_e||(u!=null&&u.url?u.url:u!=null&&u.base64?`data:audio/wav;base64,${u.base64}`:""),[_e,u]);i.useEffect(()=>{if(S!=="video"||!ke||ne)return;let t=performance.now();const a=setInterval(()=>{var l,x,w,D;const r=performance.now(),s=(r-t)/1e3;t=r;const n=ue.current,o=pe.current;if(n&&xe&&!n.paused&&!n.ended){const G=n.currentTime,U=n.duration&&!isNaN(n.duration)&&n.duration>1?n.duration:Math.max(1,$||20);Ee(G),(x=(l=M.current)==null?void 0:l.contentWindow)==null||x.postMessage({type:"STUDIO_SYNC_TIME",currentTime:G,duration:U,playing:!0},"*");return}if(o&&ee&&!o.paused&&!o.ended){const G=o.currentTime,U=o.duration&&!isNaN(o.duration)&&o.duration>1?o.duration:Math.max(1,$||20);Ee(G),(D=(w=M.current)==null?void 0:w.contentWindow)==null||D.postMessage({type:"STUDIO_SYNC_TIME",currentTime:G,duration:U,playing:!0},"*");return}Ee(G=>{var me,I,q,B;const U=Math.max(1,$||20),ce=G+s;return ce>=U?(Fe(!1),(I=(me=M.current)==null?void 0:me.contentWindow)==null||I.postMessage({type:"STUDIO_PAUSE"},"*"),U):((B=(q=M.current)==null?void 0:q.contentWindow)==null||B.postMessage({type:"STUDIO_SYNC_TIME",currentTime:ce,duration:U,playing:!0},"*"),ce)})},120);return()=>clearInterval(a)},[S,ke,ne,$,xe,ee]);const Ha=()=>{var s,n,o,l,x;const t=Math.max(1,$||20);if(!ke&&(We>=t-.3||!!((s=ue.current)!=null&&s.ended))){ea();return}const r=!ke;r&&ne&&(jt(!1),(o=(n=M.current)==null?void 0:n.contentWindow)==null||o.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),Fe(r),(x=(l=M.current)==null?void 0:l.contentWindow)==null||x.postMessage({type:r?"STUDIO_PLAY":"STUDIO_PAUSE"},"*"),pe.current&&(r?pe.current.play().catch(()=>{}):pe.current.pause()),ue.current&&xe&&(r?ue.current.play().catch(()=>{}):ue.current.pause())},ea=()=>{var t,a,r,s;ne&&(jt(!1),(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),Ee(0),Fe(!0),(s=(r=M.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_RESTART"},"*"),pe.current&&(pe.current.currentTime=0,pe.current.play().catch(()=>{})),ue.current&&xe&&(ue.current.currentTime=0,ue.current.play().catch(()=>{}))},Ga=t=>{var r,s;Ee(t);const a=$>0?t/$:0;(s=(r=M.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_SEEK",progress:a,time:t},"*"),pe.current&&(pe.current.currentTime=t),ue.current&&xe&&(ue.current.currentTime=t)},qa=()=>{var a,r,s,n;const t=!ne;jt(t),t?(Fe(!1),(a=pe.current)==null||a.pause(),(r=ue.current)==null||r.pause()):ye.current&&(Ue(ye.current),ye.current=""),(n=(s=M.current)==null?void 0:s.contentWindow)==null||n.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:t},"*")},ze=t=>{var a,r;Kt(s=>s&&{...s,...t}),(r=(a=M.current)==null?void 0:a.contentWindow)==null||r.postMessage({type:"STUDIO_UPDATE_SELECTED",updates:t},"*")},Ks=()=>{var t,a;ye.current&&(Ue(ye.current),ye.current=""),jt(!1),Kt(null),(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*"),j({type:"success",text:"¡Cambios de textos y posición de cajas guardados en la composición HTML!"})},Ka=()=>{var t,a,r;document.fullscreenElement?(t=document.exitFullscreen)==null||t.call(document).catch(()=>{}):(r=(a=_a.current)==null?void 0:a.requestFullscreen)==null||r.call(a).catch(()=>{})},lt=i.useMemo(()=>{const t=(u==null?void 0:u.scriptText)||A||"";return xs(t,Math.max(4,$||25))},[u==null?void 0:u.scriptText,A,$]),Re=i.useMemo(()=>lt.wordTimings.map(t=>t.word),[lt]),ta=i.useMemo(()=>{if(!fe||Re.length===0)return null;const t=Math.max(0,Math.min(.9999,We/Math.max(1,$))),a=lt.wordTimings;let r=-1;for(let l=0;l<a.length;l++)if(t>=a[l].startPct&&t<=a[l].endPct){r=l;break}r===-1&&(r=Math.min(Re.length-1,Math.floor(t*Re.length)));const s=5,n=Math.floor(r/s)*s;return{words:Re.slice(n,n+s),activeOffset:r-n}},[fe,Re,lt,We,$]),At=async()=>{if(u!=null&&u.base64)return u.base64;if(!xe)return null;try{const t=await fetch(xe);if(!t.ok)return null;const a=await t.arrayBuffer(),r=new Uint8Array(a);let s="";const n=32768;for(let o=0;o<r.length;o+=n)s+=String.fromCharCode.apply(null,Array.from(r.subarray(o,o+n)));return window.btoa(s)}catch{return null}},Ya=async()=>{try{Da(!0);const t=Math.min(60,Math.max(4,Math.round($||15))),a=t>20?12:15;j({type:"info",text:`Renderizando Video MP4 con Audio + Animación + Subtítulos (${t}s)... Espera ~15-25 segundos mientras se ensambla el archivo .MP4 para WhatsApp y Celular.`});const r=ye.current||Be,s=await At(),n=await fetch("/api/studio/video/render-mp4",{method:"POST",headers:Z(p),body:JSON.stringify({htmlCode:r,audioBase64:s,scriptText:(u==null?void 0:u.scriptText)||A,showSubtitles:fe,subtitlePosition:$e,aspectRatio:V,durationSeconds:t,fps:a})}),o=await we(n);if(!n.ok||!o.success||!o.videoBase64)throw new Error(o.error||"No se pudo renderizar el archivo MP4 en el servidor.");const l=window.atob(o.videoBase64),x=new Array(l.length);for(let ce=0;ce<l.length;ce++)x[ce]=l.charCodeAt(ce);const w=new Uint8Array(x),D=new Blob([w],{type:"video/mp4"});aa({mp4Blob:D});const G=URL.createObjectURL(D),U=document.createElement("a");U.href=G,U.download=`wappy-studio-reel-${Date.now()}.mp4`,document.body.appendChild(U),U.click(),document.body.removeChild(U),URL.revokeObjectURL(G),j({type:"success",text:`¡Video MP4 Universal (${o.width}x${o.height} • H.264 + Audio AAC) descargado con éxito! Listo para enviar por WhatsApp, ver en celular o subir a Reels/TikTok.`})}catch(t){j({type:"error",text:t.message||"Error renderizando MP4 en el servidor."})}finally{Da(!1)}},Ys=async t=>{var I;let a=t.replace(/subtitles\.reverse\(\)/g,"subtitles.slice().reverse()");const r=q=>q.replace(/<\/script/gi,"<\\/script"),s=async q=>{try{const B=await fetch(q,{cache:"force-cache"});return B.ok?await B.text():""}catch{return""}},n=async q=>{try{const B=await fetch(q,{cache:"force-cache"});if(!B.ok)return"";const Oe=await B.arrayBuffer(),et=new Uint8Array(Oe);let Qa="";const es=32768;for(let Pt=0;Pt<et.length;Pt+=es)Qa+=String.fromCharCode.apply(null,Array.from(et.subarray(Pt,Pt+es)));return`data:image/png;base64,${window.btoa(Qa)}`}catch{return""}};let o="";try{const q=(I=M.current)==null?void 0:I.contentDocument;q&&Array.from(q.querySelectorAll("style")).forEach(B=>{if((B.id||"").startsWith("wappy-studio-bridge"))return;const et=B.textContent||"";et&&!a.includes(et.slice(0,120))&&(o+=`
${et}`)})}catch{o=""}const[l,x,w,D,G,U]=await Promise.all([/gsap(\.min)?\.js/i.test(a)?s("/assets/gsap.min.js"):Promise.resolve(""),/three(\.min)?\.js/i.test(a)?s("/assets/wappy/three.min.js"):Promise.resolve(""),/cdn\.tailwindcss\.com|tailwind-cdn\.js/i.test(a)?s("/assets/tailwind-cdn.js"):Promise.resolve(""),/tenshi\.png/i.test(a)?n("/assets/wappy/tenshi.png"):Promise.resolve(""),/felix_avatar_3d\.png/i.test(a)?n("/assets/wappy/felix_avatar_3d.png"):Promise.resolve(""),/wappy-cat-logo\.png/i.test(a)?n("/assets/wappy/wappy-cat-logo.png"):Promise.resolve("")]);D&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?tenshi\.png(["')])/gi,(q,B,Oe)=>`${B}${D}${Oe}`)),G&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?felix_avatar_3d\.png(["')])/gi,(q,B,Oe)=>`${B}${G}${Oe}`)),U&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?wappy-cat-logo\.png(["')])/gi,(q,B,Oe)=>`${B}${U}${Oe}`)),l&&(a=a.replace(/<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-gsap">${r(l)}<\/script>`)),x&&(a=a.replace(/<script[^>]*src=["'][^"']*three(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-three">${r(x)}<\/script>`)),a=a.replace(/<script[^>]*src=["'][^"']*(cdn\.tailwindcss\.com|tailwind-cdn\.js)[^"']*["'][^>]*>\s*<\/script>/gi,()=>"<script>window.tailwind = window.tailwind || {};<\/script>"+(w?`<script id="wappy-inline-tailwind">${r(w)}<\/script>`:""));const ce=`
<meta name="color-scheme" content="dark" />
<meta name="format-detection" content="telephone=no" />
<style id="wappy-precompiled-tailwind">${o.replace(/<\/style/gi,"<\\/style")}</style>
<style id="wappy-offline-font-fallback">
  html, body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
</style>
<noscript><style>
  #header-hud, #top-bar, #scene-1, #scene-1 *, #hero-card, .metric-item { opacity: 1 !important; transform: none !important; visibility: visible !important; }
  #wappy-capsule-controls, #wappy-mobile-tap-overlay { display: none !important; }
</style></noscript>`;/<head[^>]*>/i.test(a)?a=a.replace(/<head[^>]*>/i,q=>`${q}${ce}`):a=`${ce}
${a}`,/<meta[^>]+name=["']viewport/i.test(a)||(a=a.replace(/<head[^>]*>/i,q=>`${q}<meta name="viewport" content="width=device-width, initial-scale=1.0" />`));const me=`<script id="wappy-visibility-guard">
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
<\/script>`;return a=a.includes("</body>")?a.replace("</body>",()=>`${me}
</body>`):`${a}
${me}`,a},Ja=async()=>{const t=await Ys(ye.current||Be),a=await At(),r=a?`data:audio/wav;base64,${a}`:"",s=Math.max(4,Math.round(($||20)*10)/10),n=`
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
  #subtitle-footer, #subtitle-card, #subtitle-container, #subtitle-box, footer[id*="subtitle"] { display: none !important; }
  #stage:not([data-wappy-master-reel="true"]) {
    padding-bottom: 112px !important;
    transform-origin: top center !important;
  }
  @media (max-height: 740px), (max-width: 480px) {
    #stage:not([data-wappy-master-reel="true"]) {
      padding: 12px 14px 108px 14px !important;
    }
    #stage:not([data-wappy-master-reel="true"]) h1 {
      font-size: clamp(1.25rem, 5vw, 1.65rem) !important;
      line-height: 1.15 !important;
    }
    #stage:not([data-wappy-master-reel="true"]) h2 {
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
    ${$e==="top"?"top: 54px;":$e==="center"?"top: 50%; transform: translateY(-50%);":"bottom: 58px;"}
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
<div id="wappy-capsule-subtitles" style="display:${fe&&Re.length>0?"flex":"none"};">
  <div id="wappy-capsule-sub-box" style="background:rgba(4,10,18,0.92);backdrop-filter:blur(10px);border:1px solid rgba(199,243,3,0.45);padding:7px 13px;border-radius:13px;text-align:center;max-width:95%;display:flex;flex-wrap:wrap;justify-content:center;gap:5px;"></div>
</div>
<div id="wappy-capsule-controls">
  <button type="button" id="wappy-btn-play">⏸ Pausar</button>
  <button type="button" id="wappy-btn-restart" class="secondary" title="Reiniciar">↺</button>
  <input type="range" id="wappy-seek" min="0" max="${s}" step="0.1" value="0" />
  <span id="wappy-time-label" style="font-size:10px;font-family:monospace;font-weight:700;color:#cbd5e1;white-space:nowrap;">0.0s / ${s}s</span>
</div>
<script id="wappy-academy-capsule-runtime">
(function() {
  var words = ${JSON.stringify(Re)};
  var wordTimings = ${JSON.stringify(lt.wordTimings)};
  var showSubs = ${!!(fe&&Re.length>0)};
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
    if (stage.getAttribute('data-wappy-master-reel') === 'true') {
      if (typeof window.__wappyFitViewport === 'function') {
        window.__wappyFitViewport();
      } else {
        var vw = window.innerWidth || 540;
        var vh = window.innerHeight || 960;
        var s = Math.min(vw / 1080, vh / 1920);
        stage.style.transform = 'scale(' + s.toFixed(5) + ')';
      }
      return;
    }
    stage.style.transform = 'none';
    var vh2 = window.innerHeight || document.documentElement.clientHeight || 700;
    var sh = stage.scrollHeight || stage.offsetHeight || vh2;
    if (sh > vh2 && vh2 > 240) {
      var scale = Math.max(0.72, Math.min(1, (vh2 - 16) / sh));
      stage.style.transform = 'scale(' + scale.toFixed(3) + ')';
    }
  }
  window.addEventListener('resize', fitMobileCapsule);
  window.addEventListener('orientationchange', function() { setTimeout(fitMobileCapsule, 150); });
  setTimeout(fitMobileCapsule, 120);

  function renderSubtitles(t) {
    if (!showSubs || !subBox || !words.length) return;
    var activeTimings = window.__wappyWordTimings || wordTimings;
    var p = Math.max(0, Math.min(0.9999, t / Math.max(1, duration)));
    var activeIdx = -1;
    for (var k = 0; k < activeTimings.length; k++) {
      if (p >= activeTimings[k].startPct && p <= activeTimings[k].endPct) {
        activeIdx = k;
        break;
      }
    }
    if (activeIdx === -1) {
      activeIdx = Math.min(words.length - 1, Math.floor(p * words.length));
    }
    var winSize = 5;
    var winStart = Math.floor(activeIdx / winSize) * winSize;
    var slice = words.slice(winStart, winStart + winSize);
    var activeOffset = activeIdx - winStart;
    subBox.innerHTML = slice.map(function(w, i) {
      if (i === activeOffset) {
        return '<span style="font-size:clamp(12px,3.4vw,14px);font-weight:900;text-transform:uppercase;color:#080c04;background:#c7f303;padding:2px 7px;border-radius:6px;box-shadow:0 0 12px rgba(199,243,3,0.45);">' + w + '</span>';
      }
      return '<span style="font-size:clamp(12px,3.4vw,14px);font-weight:800;text-transform:uppercase;color:rgba(255,255,255,0.95);">' + w + '</span>';
    }).join(' ');
  }

  function syncTimelineToTime(t, isVoiceActive) {
    window.__wappyCurrentTime = t;
    window.__wappyVoicePlaying = Boolean(isVoiceActive);
    try {
      if (typeof window.__wappyRenderTick === 'function') {
        window.__wappyRenderTick(t, duration);
        return;
      }
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        var prog = Math.max(0, Math.min(0.9999, t / Math.max(0.5, duration)));
        var tlDur = window.mainTimeline.duration();
        if (tlDur > 0.5 && typeof window.mainTimeline.timeScale === 'function') {
          window.mainTimeline.timeScale(tlDur / Math.max(0.5, duration));
        }
        if (Math.abs(window.mainTimeline.progress() - prog) > 0.015) {
          window.mainTimeline.progress(prog, false);
        }
      }
    } catch (e) {}
  }

  function updateUi(t) {
    currentTime = t;
    if (seekEl) seekEl.value = String(t);
    if (timeLabel) timeLabel.textContent = t.toFixed(1) + 's / ' + duration.toFixed(1) + 's';
    renderSubtitles(t);
  }

  function stopMasterTimeline() {
    window.__wappyVoicePlaying = false;
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
    window.__wappyVoicePlaying = true;
    try {
      if (window.mainTimeline && typeof window.mainTimeline.repeat === 'function') {
        window.mainTimeline.repeat(0);
      }
      if (window.gsap && window.gsap.globalTimeline) {
        window.gsap.globalTimeline.play();
      }
      if (window.mainTimeline) {
        var tlDur = window.mainTimeline.duration();
        if (tlDur > 0.5 && typeof window.mainTimeline.timeScale === 'function') {
          window.mainTimeline.timeScale(tlDur / Math.max(0.5, duration));
        }
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
    syncTimelineToTime(0, true);
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
      if (audioEl.duration && !isNaN(audioEl.duration) && audioEl.duration > 1) {
        duration = audioEl.duration;
        if (seekEl) seekEl.max = String(duration);
        syncTimelineToTime(audioEl.currentTime || 0, !audioEl.paused);
      }
    });
    audioEl.addEventListener('timeupdate', function() {
      syncTimelineToTime(audioEl.currentTime, !audioEl.paused && !audioEl.ended);
      updateUi(audioEl.currentTime);
    });
    audioEl.addEventListener('ended', function() {
      playing = false;
      stopMasterTimeline();
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        window.mainTimeline.progress(0.999, false);
      }
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
    if (audioEl && !audioEl.paused && !audioEl.ended) {
      syncTimelineToTime(audioEl.currentTime, true);
      updateUi(audioEl.currentTime);
      return;
    }
    var next = currentTime + 0.12;
    if (next >= duration) {
      playing = false;
      stopMasterTimeline();
      updateUi(duration);
      if (btnPlay) btnPlay.textContent = '▶ Volver a Reproducir';
      return;
    }
    syncTimelineToTime(next, true);
    updateUi(next);
  }, 120);

  if (btnPlay) {
    btnPlay.addEventListener('click', function() {
      if (tapOverlay) tapOverlay.style.display = 'none';
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
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        window.mainTimeline.progress(Math.max(0, Math.min(0.9999, val / Math.max(0.5, duration))), false);
      }
    });
  }

  renderSubtitles(0);
})();
<\/script>`;return t.includes("</body>")?t.replace("</body>",()=>`${n}
</body>`):`${t}
${n}`},dt=i.useRef(null),aa=async(t={},a=!0)=>{var r;try{const s=ye.current||Be,n=(u==null?void 0:u.mediaKey)||xe||"sin-audio",o=`${s.length}:${s.slice(-200)}:${n}:${V}`,x=((r=dt.current)==null?void 0:r.signature)===o&&Le.some(me=>{var I;return me.id===((I=dt.current)==null?void 0:I.id)})?dt.current.id:`video-${Date.now()}`,w=`html-${x}`;await Ge(w,new Blob([s],{type:"text/html"}));let D=u==null?void 0:u.mediaKey;if(!D&&xe){const me=await At();me&&(D=`audio-${x}`,await Ge(D,It(me)))}let G;t.mp4Blob&&(G=`mp4-${x}`,await Ge(G,t.mp4Blob));let U;t.capsuleHtml&&(U=`capsule-${x}`,await Ge(U,new Blob([t.capsuleHtml],{type:"text/html"})));const ce=((u==null?void 0:u.scriptText)||A||rt||"").replace(/<[^>]+>/g,"").trim();Ke(me=>{const I=me.find(B=>B.id===x);return[{...I||{},id:x,kind:"video",title:(I==null?void 0:I.title)||`Video ${V}: ${ce.slice(0,40)}...`,createdAt:(I==null?void 0:I.createdAt)||Date.now(),voiceName:(u==null?void 0:u.voiceName)||b,model:W,durationSeconds:Math.round(($||0)*10)/10,wordCount:ce.split(/\s+/).filter(Boolean).length,scriptText:(u==null?void 0:u.scriptText)||A,htmlKey:w,mediaKey:D||(I==null?void 0:I.mediaKey),mp4Key:G||(I==null?void 0:I.mp4Key),capsuleKey:U||(I==null?void 0:I.capsuleKey),aspectRatio:V,showSubtitles:fe,subtitlePosition:$e},...me.filter(B=>B.id!==x)]}),dt.current={id:x,signature:o},a||j({type:"success",text:"¡Video guardado en la Biblioteca! Puedes reabrirlo, editarlo o descargarlo cuando quieras."})}catch(s){j({type:"error",text:`No se pudo guardar el video en la Biblioteca: ${(s==null?void 0:s.message)||"error de almacenamiento"}`})}},Js=async t=>{const a=t.htmlKey?await ut(t.htmlKey):null;if(!a){j({type:"error",text:"No se encontró la composición HTML de este video."});return}const r=await a.text();t.aspectRatio&&Ht(t.aspectRatio),typeof t.showSubtitles=="boolean"&&Ma(t.showSubtitles),t.subtitlePosition&&ka(t.subtitlePosition),ye.current="",Ue(r);const s=t.mediaKey?await ut(t.mediaKey):null;s&&ie({url:Ba(s),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey}),t.durationSeconds&&t.durationSeconds>1&&Je(t.durationSeconds),Ee(0),Fe(!1),dt.current=null,Pe("video")},Za=async()=>{var t,a;try{Nt(!0);const r=await Ja();aa({capsuleHtml:r});const s=`wappy-academia-capsula-${Date.now()}.html`,n=new Blob([r],{type:"text/html;charset=utf-8"});if(typeof window<"u"&&((t=window.matchMedia)==null?void 0:t.call(window,"(pointer: coarse)").matches)&&typeof navigator.share=="function")try{const w=new File([n],s,{type:"text/html"});if((a=navigator.canShare)!=null&&a.call(navigator,{files:[w]})){await navigator.share({files:[w],title:"Cápsula WAPPY",text:"Cápsula interactiva WAPPY (ábrela tocando el archivo)."}),j({type:"success",text:"¡Cápsula HTML compartida! Funciona sin internet al tocarla en WhatsApp."});return}}catch(w){if((w==null?void 0:w.name)==="AbortError")return}const l=URL.createObjectURL(n),x=document.createElement("a");x.href=l,x.download=s,document.body.appendChild(x),x.click(),document.body.removeChild(x),URL.revokeObjectURL(l),j({type:"success",text:"¡Cápsula HTML autocontenida descargada! Incluye estilos, animación y voz en un solo archivo: envíala por WhatsApp y ábrela tocándola, incluso sin internet."})}finally{Nt(!1)}},Zs=async()=>{try{Nt(!0);const r=`<iframe srcdoc="${(await Ja()).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" style="width:100%;max-width:${V==="9:16"?"400px":"860px"};aspect-ratio:${V==="9:16"?"9/16":"16/9"};border:0;border-radius:16px;overflow:hidden;display:block;margin:0 auto;box-shadow:0 20px 50px rgba(0,0,0,0.35);" allow="autoplay; fullscreen"></iframe>`;await navigator.clipboard.writeText(r),j({type:"success",text:"¡Código <iframe srcdoc> copiado al portapapeles! Pégalo directamente en cualquier lección de la Academia WAPPY (LMS)."})}catch{j({type:"error",text:"No se pudo copiar el código embebido al portapapeles."})}finally{Nt(!1)}},Qe=((Xa=O==null?void 0:O.supportedVoices)==null?void 0:Xa.length)||14;return!d&&c&&c.role!=="ADMIN"?e.jsx("div",{className:"flex-1 flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen p-6",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md",children:[e.jsx("div",{className:"w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto",children:e.jsx(ts,{className:"w-6 h-6"})}),e.jsx("h2",{className:"text-lg font-extrabold text-slate-900 dark:text-white",children:"WAPPY Studio (Acceso Administrador)"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Por el momento este módulo está habilitado exclusivamente para cuentas de Administración de WAPPY."}),e.jsx("a",{href:"/c/new",className:"inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition",children:"Volver al inicio"})]})}):e.jsxs("div",{className:y("flex-1 flex flex-col",d?"bg-transparent h-auto overflow-visible pb-6":"bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-[100dvh] h-auto overflow-y-auto pb-16"),children:[e.jsx("header",{className:y("bg-white dark:bg-slate-900/95 px-4 sm:px-6 py-4 shadow-2xs z-30",d?"relative rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-7xl w-full mx-auto":"sticky top-0 border-b border-slate-200/90 dark:border-slate-800"),children:e.jsxs("div",{className:"max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[g&&!h&&e.jsx("div",{className:"hidden md:block",children:e.jsx(xr,{setNavVisible:F})}),e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2 mb-1",children:e.jsxs("span",{className:"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wider",children:[e.jsx(De,{className:"w-3 h-3 text-teal-500"}),"Estudio Multimodal • Gemini 3.8 Flash TTS & HyperFrames"]})}),e.jsxs("h1",{className:"text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400",children:[e.jsx(ts,{className:"w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0"}),"WAPPY Studio"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300 mt-0.5 hidden sm:block",children:"Síntesis de voz neural de hasta 1 hora continua y creación de videos animados en HTML/GSAP con capas sobre tus propios videos."})]})]}),e.jsxs("div",{className:"flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-nowrap",children:[e.jsxs("div",{className:"inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto no-scrollbar min-w-0",children:[e.jsxs("button",{type:"button",onClick:()=>Pe("tts"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",S==="tts"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(ct,{className:"w-3.5 h-3.5 text-teal-500"}),e.jsx("span",{children:"Estudio de Voz (TTS)"})]}),e.jsxs("button",{type:"button",onClick:()=>Pe("video"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",S==="video"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Ve,{className:"w-3.5 h-3.5 text-purple-500"}),e.jsx("span",{children:"Video HTML & Capas"})]}),e.jsxs("button",{type:"button",onClick:()=>Pe("lab"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",S==="lab"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(sa,{className:"w-3.5 h-3.5 text-amber-500"}),e.jsx("span",{children:"Voces & Bursts"})]}),e.jsxs("button",{type:"button",onClick:()=>Pe("library"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",S==="library"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(ra,{className:"w-3.5 h-3.5 text-indigo-500"}),e.jsxs("span",{children:["Biblioteca (",Le.length,")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(mr,{selectedModel:W,onSelectModel:ge,disabled:kt}),e.jsx(L,{icon:e.jsx(Mt,{}),label:`Claves IA (${Ae})`,variant:"fuchsia",onClick:()=>{ot(""),nt(!0)},title:"Configurar hasta 3 claves Google Gemini con rotación inteligente"}),e.jsx(L,{icon:fa?e.jsx(ae,{className:"animate-spin"}):e.jsx(as,{}),label:"Probar Audio con IA",variant:"purple",disabled:fa,onClick:$s}),!d&&e.jsx(L,{icon:e.jsx(er,{}),label:"Landing / App Portable",variant:"cyan",onClick:()=>window.open("/wappystudio.html","_blank","noopener,noreferrer"),title:"Abrir Landing Page Pública y Aplicativo Portable de WAPPY Studio"})]})]})]})}),e.jsxs("main",{className:"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6",children:[Ze&&e.jsxs("div",{className:y("p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200",Ze.type==="success"?"bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200":Ze.type==="error"?"bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200":"bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200"),children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[Ze.type==="success"?e.jsx(na,{className:"w-4 h-4 text-emerald-500 shrink-0"}):Ze.type==="error"?e.jsx(bt,{className:"w-4 h-4 text-rose-500 shrink-0"}):e.jsx(ae,{className:"w-4 h-4 text-sky-500 animate-spin shrink-0"}),e.jsx("span",{children:Ze.text})]}),e.jsx("button",{type:"button",onClick:()=>j(null),className:"p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10",children:e.jsx(Rt,{className:"w-3.5 h-3.5"})})]}),u&&e.jsx(Ar,{audioBase64:u.base64,audioUrl:u.url,title:u.title,durationSeconds:u.durationSeconds,voiceName:u.voiceName,onSendToVideo:()=>{Pe("video"),j({type:"success",text:"Audio vinculado automáticamente a la pista de locución del Compositor de Video."})}}),S==="tts"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[te&&e.jsx(Pr,{job:te,onPause:()=>Xt("pause"),onResume:()=>Xt("resume"),onCancel:()=>Xt("cancel"),onPlayChunk:t=>{t.audioBase64&&ie({base64:t.audioBase64,title:`Fragmento #${t.index+1} (${t.durationSeconds||0}s)`,durationSeconds:t.durationSeconds,voiceName:H?`${Se} + ${Ne}`:b})},onLoadMaster:()=>{te.downloadUrl&&ie({url:te.downloadUrl,title:`Audio Completo: ${A.trim().slice(0,42)}...`,durationSeconds:te.generatedTotalSeconds,voiceName:H?`${Se} + ${Ne}`:b,scriptText:A})}}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-indigo-500/10 dark:from-teal-950/40 dark:via-zinc-900/80 dark:to-indigo-950/40 border border-teal-500/25 dark:border-teal-500/20 rounded-2xl p-3 sm:p-3.5 shadow-2xs",children:[e.jsxs("div",{className:"flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0",children:"01"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300",children:"Motor & Voz Neural"}),e.jsxs("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:[O==null?void 0:O.name," •"," ",e.jsx("span",{className:"text-teal-600 dark:text-teal-400",children:H?`${Se} + ${Ne}`:b})]})]})]}),e.jsxs("div",{className:"flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0",children:"02"}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300",children:"Capas de ~1 Min & Bursts"}),e.jsxs("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:[Bt," palabras • ~",gt," min (",at," ",at===1?"capa de ~1m":"capas de ~1m",")"]})]})]}),e.jsxs("button",{type:"button",onClick:()=>Pe("video"),className:"flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 hover:bg-purple-50/80 dark:hover:bg-purple-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 shadow-2xs transition cursor-pointer text-left group",children:[e.jsxs("div",{className:"flex items-center gap-3 min-w-0",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0",children:"03"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300",children:"WAV 24kHz & Video HTML/GSAP"}),e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:"Sintetiza audio o llévalo al Compositor →"})]})]}),e.jsx(Ve,{className:"w-4 h-4 text-purple-500 shrink-0 group-hover:translate-x-0.5 transition-transform"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",children:[e.jsxs("div",{className:"lg:col-span-5 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-1.5",children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(ss,{className:"w-4 h-4 text-teal-500"}),"Modelo Oficial Gemini TTS"]}),e.jsx("span",{className:"text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full",children:"✓ GOOGLE_MODELS Activo"})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:re.map(t=>{const a=m===t.id;return e.jsxs("button",{type:"button",onClick:()=>{f(t.id),t.supportedVoices.includes(b)||T(t.supportedVoices[0]||"Kore")},className:y("text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-gradient-to-br from-teal-50/95 via-emerald-50/70 to-indigo-50/50 dark:from-teal-950/50 dark:via-emerald-950/30 dark:to-indigo-950/30 border-teal-500 ring-2 ring-teal-500/20 shadow-xs":"bg-white dark:bg-slate-900/70 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/60 dark:hover:bg-zinc-800/60"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1.5",children:[e.jsx("span",{className:y("text-[9px] font-extrabold px-2 py-0.5 rounded-md border",t.badgeColor),children:t.badge}),a&&e.jsx("span",{className:"w-2 h-2 rounded-full bg-teal-500 animate-ping shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white leading-snug mb-1",children:t.name}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 leading-snug",children:t.description})]}),e.jsxs("div",{className:"mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-amber-700 dark:text-amber-400 font-bold",children:t.rateLimitLabel||t.quotaLabel}),a?e.jsxs("span",{className:"text-teal-700 dark:text-teal-300 font-extrabold flex items-center gap-0.5",children:[e.jsx(mt,{className:"w-3 h-3"})," ",t.supportedVoices.length," voces"]}):e.jsxs("span",{className:"text-slate-500 dark:text-zinc-400 font-semibold",children:[t.supportedVoices.length," voces"]})]})]},t.id)})}),e.jsxs("div",{className:"px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"text-slate-700 dark:text-zinc-300 flex items-center gap-1.5",children:[e.jsx(De,{className:"w-3.5 h-3.5 text-teal-500 shrink-0"}),e.jsxs("span",{children:["Voces activas para"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white",children:O==null?void 0:O.name}),":"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsxs("span",{className:"font-extrabold text-emerald-700 dark:text-emerald-400",children:[Qe," de ",N.length," disponibles"]}),Qe<N.length&&e.jsx("button",{type:"button",onClick:()=>f("gemini-3.8-flash-tts"),className:"text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer",children:"Activar las 14 →"})]})]}),m==="gemini-2.5-flash-preview-tts"&&e.jsxs("div",{className:"p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(bt,{className:"w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("p",{className:"font-extrabold text-amber-900 dark:text-amber-200",children:"¿Por qué algunas voces aparecen desactivadas en Gemini 2.5 Flash TTS?"}),e.jsxs("p",{className:"text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed",children:[e.jsx("span",{className:"font-bold",children:"Gemini 2.5 Pro Preview TTS"})," no posee cuota activa en API (0 RPM / 0 RPD). Su reemplazo oficial funcional es"," ",e.jsx("span",{className:"font-bold",children:"Gemini 2.5 Flash TTS"}),", el cual habilita únicamente las"," ",e.jsx("span",{className:"font-bold",children:"5 voces fundamentales"})," (Kore, Puck, Charon, Fenrir y Aoede). Para usar las 14 voces y Vocal Bursts, cambia a"," ",e.jsx("span",{className:"font-bold",children:"Gemini 3.8 Flash TTS"}),"."]})]})]}),e.jsx("div",{className:"flex justify-end",children:e.jsx("button",{type:"button",onClick:()=>f("gemini-3.8-flash-tts"),className:"px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-900 dark:text-amber-200 font-extrabold text-[11px] transition cursor-pointer",children:"Cambiar a Gemini 3.8 Flash TTS (14 voces) →"})})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"block text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"Estilos y Plantillas Rápidas"}),e.jsx("span",{className:"text-[10px] text-slate-500 dark:text-zinc-400",children:"1 clic configura voz + emoción"})]}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:E.map(t=>{const a=_===t.style&&(t.multiSpeaker?H:!H&&b===t.voiceName),r=!t.multiSpeaker&&!Xe(t.voiceName);return e.jsxs("button",{type:"button",onClick:()=>{Xe(t.voiceName)||f("gemini-3.8-flash-tts"),t.multiSpeaker?(je(!0),t.speaker1&&pa(t.speaker1.voiceName),t.speaker2&&ua(t.speaker2.voiceName)):(je(!1),T(t.voiceName)),J(t.style)},className:y("text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition cursor-pointer inline-flex items-center gap-1.5",a?"bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 shadow-2xs font-bold":"border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 hover:border-teal-500/50 hover:bg-teal-500/10 text-slate-800 dark:text-zinc-200"),children:[e.jsx("span",{children:t.name}),r&&e.jsx("span",{className:"text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30",children:"Auto 3.8"})]},t.id)})})]}),e.jsxs("div",{className:"flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/95 rounded-xl border border-slate-200/90 dark:border-slate-800 gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx(tr,{className:"w-4 h-4 text-teal-500 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"Modo Diálogo / Podcast (2 Voces)"}),e.jsxs("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:["Alterna interlocutores usando"," ",e.jsx("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:"Alex:"})," ","y"," ",e.jsx("span",{className:"font-mono font-bold text-purple-600 dark:text-purple-400",children:"Sam:"})]})]})]}),e.jsx("button",{type:"button",onClick:()=>je(!H),className:y("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",H?"bg-teal-600":"bg-slate-300 dark:bg-zinc-700"),children:e.jsx("span",{className:y("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",H?"translate-x-4":"translate-x-0")})})]}),H?e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200/90 dark:border-slate-800",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-teal-700 dark:text-teal-400 mb-1",children:"Voz para Alex (Hablante 1)"}),e.jsx("select",{value:Se,onChange:t=>pa(t.target.value),className:"w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500",children:((O==null?void 0:O.supportedVoices)||[]).map(t=>{const a=N.find(r=>r.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-purple-700 dark:text-purple-400 mb-1",children:"Voz para Sam (Hablante 2)"}),e.jsx("select",{value:Ne,onChange:t=>ua(t.target.value),className:"w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500",children:((O==null?void 0:O.supportedVoices)||[]).map(t=>{const a=N.find(r=>r.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(ct,{className:"w-3.5 h-3.5 text-teal-500"}),"Catálogo de Voces (",Qe," activas / ",N.length," totales)"]}),e.jsx("p",{className:"text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5",children:"Haz clic en cualquier tarjeta para elegir la voz o en ▶ para escuchar su timbre real."})]}),e.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]",children:[e.jsxs("button",{type:"button",onClick:()=>va("only_active"),className:y("px-2 py-0.5 rounded-md transition cursor-pointer",wt==="only_active"?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:["Solo Activas (",Qe,")"]}),e.jsxs("button",{type:"button",onClick:()=>va("all"),className:y("px-2 py-0.5 rounded-md transition cursor-pointer",wt==="all"?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:["Todas (",N.length,")"]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(ar,{className:"w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"}),e.jsx("input",{type:"search",name:"wappy-voice-search",autoComplete:"off",value:Ft,onChange:t=>ks(t.target.value),placeholder:"Buscar voz (Kore, Orus, profunda, podcast...)",className:"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] shrink-0",children:["all","Femenino","Masculino"].map(t=>e.jsx("button",{type:"button",onClick:()=>vs(t),className:y("px-2.5 py-1 rounded-lg transition cursor-pointer",yt===t?"bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-bold shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:t==="all"?"Todas":t==="Femenino"?"♀ Femeninas":"♂ Masculinas"},t))})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1",children:Ds.map(t=>{const a=b===t.id,r=ws===t.id,s=Xe(t.id);return e.jsxs("div",{onClick:()=>{s||f("gemini-3.8-flash-tts"),T(t.id)},className:y("p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-gradient-to-br from-teal-50/95 via-emerald-50/60 to-white dark:from-teal-950/50 dark:via-emerald-950/25 dark:to-zinc-900 border-teal-500 ring-2 ring-teal-500/20 shadow-xs":"bg-white dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/70 dark:hover:bg-zinc-800/60",!s&&"opacity-75 border-dashed"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:"text-sm font-extrabold text-slate-900 dark:text-white truncate",children:t.name}),t.tag&&e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 shrink-0",children:t.tag})]}),e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap mt-1",children:[e.jsx("span",{className:y("text-[9px] font-bold px-1.5 py-0.5 rounded",t.gender==="Femenino"?"bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20":"bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"),children:t.gender==="Femenino"?"♀ Femenina":"♂ Masculina"}),s?e.jsx("span",{className:"text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded",children:"✓ Activa"}):e.jsx("span",{className:"text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded",children:"Requiere 3.8/3.1"})]})]}),e.jsxs("button",{type:"button",onClick:n=>Vs(t.id,n),disabled:r,title:`Escuchar muestra de ${t.name}`,className:"px-2 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer flex items-center gap-1 text-[10px] font-extrabold",children:[r?e.jsx(ae,{className:"w-3 h-3 animate-spin"}):e.jsx(Me,{className:"w-3 h-3 fill-current"}),e.jsx("span",{children:"Oír"})]})]}),e.jsx("p",{className:"text-[11px] text-teal-700 dark:text-teal-300 font-bold mt-2 leading-snug",children:t.tone})]}),e.jsxs("div",{className:"mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2",children:[e.jsx("p",{className:"text-[10px] text-slate-600 dark:text-zinc-400 line-clamp-1 leading-tight",children:t.recommendedFor}),!s&&e.jsx("button",{type:"button",onClick:n=>{n.stopPropagation(),f("gemini-3.8-flash-tts"),T(t.id)},className:"text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded shrink-0 cursor-pointer",children:"Usar con 3.8 →"})]})]},t.id)})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"Directiva de Estilo y Emoción"}),e.jsx("span",{className:"text-[10px] font-mono text-slate-500 dark:text-zinc-400",children:"speechMetadata.style"})]}),e.jsx("textarea",{rows:2,value:_,onChange:t=>J(t.target.value),placeholder:"Ej: Voz cálida, pausada y reflexiva de narrador de documentales...",className:"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{children:[e.jsxs("button",{type:"button",onClick:()=>js(!Wt),className:"flex items-center justify-between w-full text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-extrabold py-1 transition cursor-pointer",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(sr,{className:"w-3.5 h-3.5 text-teal-500"}),"Motor de Capas de Audio (~1 min por capa) & Unión Master"]}),e.jsx("span",{children:Wt?"▲":"▼"})]}),Wt&&e.jsxs("div",{className:"mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs",children:[e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-1.5",children:[{words:110,label:"~45 seg",sub:"110 pal."},{words:150,label:"~1 min ★",sub:"150 pal. (Óptimo)"},{words:220,label:"~1.5 min",sub:"220 pal."},{words:280,label:"~2 min",sub:"280 pal."}].map(t=>{const a=Math.abs(Te-t.words)<=10;return e.jsxs("button",{type:"button",onClick:()=>xa(t.words),className:y("px-2 py-1.5 rounded-lg border text-center transition cursor-pointer",a?"bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 font-extrabold shadow-2xs":"bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-zinc-300 hover:border-teal-400"),children:[e.jsx("div",{className:"text-[11px] font-bold",children:t.label}),e.jsx("div",{className:"text-[9px] opacity-80",children:t.sub})]},t.words)})}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-slate-600 dark:text-zinc-400",children:"Tamaño de cada capa de audio:"}),e.jsxs("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:[Te," palabras (~",Math.max(20,Math.round(Te/145*60)),"s)"]})]}),e.jsx("input",{type:"range",min:80,max:280,step:10,value:Te,onChange:t=>xa(parseInt(t.target.value,10)),className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-teal-600"}),e.jsxs("p",{className:"text-[10px] text-slate-600 dark:text-zinc-400 leading-relaxed",children:[e.jsx("strong",{children:"Recomendado (~1 min / 150 palabras):"})," Cada capa se genera en ~4 segundos sin saturar la API, permite preescuchar cada fragmento al instante y une todas las capas en un solo ",e.jsx("strong",{children:"WAV Master 24kHz"})," con micro-fades sin cortes."]})]})]})]}),e.jsxs("div",{className:"lg:col-span-7 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:y("p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all",Ae>0?"bg-emerald-500/10 border-emerald-500/30":"bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border-indigo-500/25"),children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[e.jsx("div",{className:y("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",Ae>0?"bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300":"bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300"),children:e.jsx(Mt,{className:"w-4 h-4"})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5",children:Ae>0?e.jsx(e.Fragment,{children:e.jsxs("span",{children:[Ae," clave(s) API guardada(s) • Rotación y failover automático (429) activados"]})}):e.jsx(e.Fragment,{children:e.jsx("span",{children:"Motor Multi-Key Gemini TTS (Almacenamiento Local + Respaldo WAPPY)"})})}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:Ae>0?"Si una clave alcanza el límite de cuota (429), WAPPY Studio salta instantáneamente a la siguiente sin interrumpir tu audio.":"Puedes agregar hasta 3 claves gratuitas de Google AI Studio para multiplicar tu cuota de síntesis de 60 min."})]})]}),e.jsx("button",{type:"button",onClick:()=>{ot(""),X("keys"),nt(!0)},className:y("px-3 py-1.5 rounded-xl text-xs font-extrabold border transition shrink-0 cursor-pointer",Ae>0?"bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border-emerald-500/30":"bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-800 dark:text-indigo-200 border-indigo-500/30"),children:Ae>0?"Administrar claves":"Configurar claves"})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2.5",children:[e.jsxs("h2",{className:"text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 shrink-0",children:[e.jsx(ct,{className:"w-4 h-4 text-teal-500"}),"Texto a Sintetizar"]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 min-w-0",children:[e.jsxs("select",{defaultValue:"",onChange:t=>{const a=xt.find(r=>r.title===t.target.value);a&&(qe(a.text),a.text.includes("Alex:")&&a.text.includes("Sam:")&&je(!0)),t.target.value=""},className:"min-w-0 max-w-[230px] sm:max-w-[260px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer",children:[e.jsxs("option",{value:"",disabled:!0,children:["📋 Cargar ejemplo (",xt.length," plantillas)..."]}),xt.map(t=>e.jsx("option",{value:t.title,children:t.title},t.title))]}),e.jsx(L,{size:"sm",icon:k?e.jsx(ae,{className:"animate-spin"}):e.jsx(rs,{}),label:k?"Enriqueciendo...":"Mejorar Guion con IA",variant:"purple",disabled:k,onClick:Fs,title:`Enriquecer o generar guion con Vocal Bursts usando ${W}`}),A&&e.jsx(L,{size:"sm",icon:e.jsx(He,{}),label:"Limpiar",variant:"danger",onClick:()=>qe("")})]})]}),e.jsxs("div",{className:"p-3 bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px]",children:[e.jsxs("span",{className:"font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1",children:[e.jsx(De,{className:"w-3.5 h-3.5 text-amber-500"}),"Insertar Efectos Vocales (Vocal Bursts) en el cursor:"]}),e.jsx("span",{className:"font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold",children:m})]}),e.jsxs("div",{className:"flex flex-wrap gap-1.5",children:[Q.map(t=>e.jsxs("button",{type:"button",onClick:()=>Qt(` ${t.tag} `),title:t.description,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-500/10 border border-slate-200 dark:border-slate-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx("span",{className:"text-amber-700 dark:text-amber-400 font-bold",children:t.tag}),e.jsxs("span",{className:"text-slate-600 dark:text-zinc-400 text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),e.jsx("button",{type:"button",onClick:()=>Qt(`
Alex: `),className:"px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold transition cursor-pointer",children:"Alex:"}),e.jsx("button",{type:"button",onClick:()=>Qt(`
Sam: `),className:"px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold transition cursor-pointer",children:"Sam:"})]})]}),e.jsx("textarea",{id:"wappy-studio-tts-editor",rows:12,value:A,onChange:t=>qe(t.target.value),placeholder:"Escribe o pega aquí el guion para tu cápsula SST, curso de Academia WAPPY, podcast o audiolibro de hasta 1 hora...",className:"w-full bg-white dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 leading-relaxed resize-y min-h-[260px] shadow-inner"}),e.jsxs("div",{className:"bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between text-xs gap-2",children:[e.jsxs("div",{className:"flex items-center gap-3 text-slate-600 dark:text-slate-300",children:[e.jsxs("span",{children:["Palabras:"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white font-mono",children:Bt})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Caracteres:"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white font-mono",children:fs})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Fragmentos estimados:"," ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400 font-mono",children:at})]})]}),e.jsxs("div",{className:"text-slate-900 dark:text-white font-semibold",children:["Duración estimada:"," ",e.jsxs("strong",{className:"text-amber-600 dark:text-amber-400 font-mono",children:["~",gt," min"]})," ","/ 60 min máx"]})]}),e.jsx("div",{className:"w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,Math.round(gt/60*100)))}%`}})})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1",children:[e.jsxs("button",{type:"button",onClick:_s,disabled:Ut||(te==null?void 0:te.status)==="processing"||!A.trim(),className:"flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[Ut?e.jsx(ae,{className:"w-4 h-4 animate-spin text-teal-500"}):e.jsx(as,{className:"w-4 h-4 text-amber-500"}),e.jsx("span",{children:"Vista Previa Rápida (~1er fragmento)"})]}),e.jsxs("button",{type:"button",onClick:Us,disabled:(te==null?void 0:te.status)==="processing"||Ut||!A.trim(),className:"flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[(te==null?void 0:te.status)==="processing"?e.jsx(ae,{className:"w-4 h-4 animate-spin"}):e.jsx(Me,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:at>1?`Generar Audio Completo (${at} fragmentos • ~${gt} min)`:"Generar Audio Completo"})]})]})]})]})]}),S==="video"&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200",children:[e.jsxs("div",{className:"lg:col-span-6 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsx("div",{className:"flex items-center justify-between gap-2",children:e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(Ve,{className:"w-5 h-5 text-purple-500"}),"Estudio de Capas & Motion Graphics HTML"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Sube tu propio video grabado a cámara o genera animaciones estilo Claude/HeyGen sincronizadas con tu voz."})]})}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",onClick:()=>{Ht("9:16"),Ie("9:16",!!ee,Ye)},className:y("p-3 rounded-xl border text-left transition cursor-pointer",V==="9:16"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:"📱 Vertical 9:16 (Reels / TikTok)"}),e.jsx("div",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5",children:"1080 × 1920 px • Ideal para redes y WhatsApp"})]}),e.jsxs("button",{type:"button",onClick:()=>{Ht("16:9"),Ie("16:9",!!ee,Ye)},className:y("p-3 rounded-xl border text-left transition cursor-pointer",V==="16:9"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:"🖥️ Horizontal 16:9 (YouTube / LMS)"}),e.jsx("div",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5",children:"1920 × 1080 px • Ideal para cursos Academia WAPPY"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(De,{className:"w-3.5 h-3.5 text-teal-500"}),"Plantillas Visuales Instantáneas (HyperFrames)"]}),e.jsx("span",{className:"text-[10px] text-slate-600 dark:text-slate-300",children:"Clic para aplicar"})]}),e.jsx("div",{className:"grid grid-cols-2 gap-2",children:Sr.map(t=>{const a=Ye===t.id;return e.jsxs("button",{type:"button",onClick:()=>{Ss(t.id),Ie(V,!!ee,t.id)},className:y("p-2.5 rounded-xl border text-left transition cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-slate-900 dark:text-white truncate",children:t.name}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0",children:t.badge})]}),e.jsx("p",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1",children:t.description})]},t.id)})})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3",children:[e.jsxs("div",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(sa,{className:"w-4 h-4 text-teal-500"}),"Capas Base Multimedia (Video a Cámara + Locución)"]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{className:"p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"1. Tu Video Base (Opcional)"}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:Ta?`Activo: ${Ta}`:"Sube un MP4/WebM tuyo para montarle capas HTML encima."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(is,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Video MP4"}),e.jsx("input",{type:"file",accept:"video/mp4,video/webm,video/quicktime",onChange:Gs,className:"hidden"})]}),ee&&e.jsx(L,{size:"sm",icon:e.jsx(He,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(ee),Na(null),Ca(""),Ie(V,!1)}})]})]}),e.jsxs("div",{className:"p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"2. Audio / Locución Sincronizada"}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:Aa?`Archivo: ${Aa}`:u?`Vinculado: ${u.title}`:"Usa el audio del Estudio TTS o sube un WAV/MP3."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(is,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Audio WAV/MP3"}),e.jsx("input",{type:"file",accept:"audio/*",onChange:qs,className:"hidden"})]}),_e&&e.jsx(L,{size:"sm",icon:e.jsx(He,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(_e),Ea(null),Pa("")}})]})]})]})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"3. Textos de Capa y Subtítulos Dinámicos"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:fe,onChange:t=>Ma(t.target.checked),className:"rounded accent-teal-600"}),"Subtítulos"]}),fe&&e.jsx("div",{className:"inline-flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]",children:[{id:"bottom",label:"Abajo"},{id:"center",label:"Centro"},{id:"top",label:"Arriba"}].map(t=>e.jsx("button",{type:"button",onClick:()=>ka(t.id),className:y("px-1.5 py-0.5 rounded transition cursor-pointer",$e===t.id?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white"),children:t.label},t.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Insignia Superior (Badge)"}),e.jsx("input",{type:"text",value:La,onChange:t=>Ts(t.target.value),className:"w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Acento"}),e.jsx("div",{className:"flex items-center gap-2",children:["#14b8a6","#10b981","#6366f1","#f59e0b","#f43f5e"].map(t=>e.jsx("button",{type:"button",onClick:()=>As(t),style:{backgroundColor:t},className:y("w-6 h-6 rounded-full border-2 transition cursor-pointer",za===t?"border-white ring-2 ring-teal-500 scale-110":"border-transparent opacity-80")},t))})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Titular Principal en Pantalla"}),e.jsx("input",{type:"text",value:rt,onChange:t=>Cs(t.target.value),className:"w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold"})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("input",{type:"text",value:Ia,onChange:t=>Es(t.target.value),placeholder:"Subtítulo secundario...",className:"flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"}),e.jsx(L,{icon:e.jsx(ps,{}),label:"Aplicar al Lienzo",variant:"cyan",onClick:()=>Ie(V,!!ee)})]})]}),e.jsxs("div",{className:"p-4 bg-purple-500/5 border border-purple-500/25 rounded-2xl space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx(rs,{className:"w-4 h-4 text-purple-500"}),"Generador IA de Animación HTML + GSAP (Estilo Claude)"]}),e.jsxs("button",{type:"button",onClick:()=>Ms(!Gt),className:"text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer",children:[e.jsx(rr,{className:"w-3.5 h-3.5"}),Gt?"Ocultar Código HTML":"Editar Código HTML"]})]}),e.jsx("textarea",{rows:2,value:Ra,onChange:t=>Ps(t.target.value),placeholder:"Describe qué gráficos animados, tarjetas, alertas o diagramas quieres que la IA programe en HTML + GSAP...",className:"w-full bg-white dark:bg-slate-900 border border-purple-500/30 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 resize-none"}),e.jsx("div",{className:"flex justify-end",children:e.jsxs("button",{type:"button",onClick:Hs,disabled:kt,className:"flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50 cursor-pointer",children:[kt?e.jsx(ae,{className:"w-4 h-4 animate-spin"}):e.jsx(De,{className:"w-4 h-4"}),e.jsx("span",{children:kt?"Diseñando Escena HTML + GSAP...":"Generar Animación HTML con IA"})]})}),Gt&&e.jsxs("div",{className:"pt-2",children:[e.jsx("label",{className:"block text-[10px] font-mono uppercase text-slate-600 dark:text-slate-300 mb-1",children:"Código Fuente HTML5 / Tailwind / GSAP en Vivo:"}),e.jsx("textarea",{rows:10,value:Be,onChange:t=>Ue(t.target.value),className:"w-full bg-slate-950 text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500"})]})]})]}),e.jsxs("div",{className:"lg:col-span-6 space-y-4 bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-nowrap",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[e.jsx("span",{className:y("w-2.5 h-2.5 rounded-full shrink-0",ne?"bg-amber-500 animate-ping":ke?"bg-emerald-500 animate-pulse":"bg-slate-400")}),e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white truncate",children:ne?`Editor Visual (${V})`:`Lienzo Interactivo (${V})`})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(L,{size:"sm",icon:ja?e.jsx(ae,{className:"animate-spin"}):e.jsx(ct,{}),label:"Sincronizar Voz IA",variant:"purple",disabled:ja,onClick:Ws}),e.jsx(L,{size:"sm",icon:e.jsx(Lt,{}),label:ne?"Salir de Edición":"Editar Lienzo",variant:"orange",isActive:ne,onClick:qa}),e.jsx(L,{size:"sm",icon:it?e.jsx(ae,{className:"animate-spin"}):e.jsx(Ve,{}),label:"Descargar MP4 (WhatsApp/Celular)",variant:"teal",disabled:it,onClick:Ya}),e.jsx(L,{size:"sm",icon:St?e.jsx(ae,{className:"animate-spin"}):e.jsx(tt,{}),label:"Cápsula Academia (HTML5)",variant:"green",disabled:St,onClick:Za}),e.jsx(L,{size:"sm",icon:e.jsx(ns,{}),label:"Guardar en Biblioteca",variant:"teal",onClick:()=>aa({},!1)}),e.jsx(L,{size:"sm",icon:e.jsx(ir,{}),label:"Pantalla Completa",variant:"neutral",onClick:Ka})]})]}),ne&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5",children:[e.jsx(nr,{className:"w-3.5 h-3.5 text-amber-500 shrink-0"}),"Arrastra cualquier caja o título con el mouse para moverlo • Doble clic para escribir"]}),e.jsxs("button",{type:"button",onClick:Ks,className:"px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx(mt,{className:"w-3 h-3"}),"Guardar Cambios"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"text"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(os,{className:"w-3 h-3 text-teal-500"}),e.jsx(or,{className:"w-3 h-3 text-teal-500"}),e.jsx("span",{children:"+ Texto"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"card"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(os,{className:"w-3 h-3 text-purple-500"}),e.jsx(sa,{className:"w-3 h-3 text-purple-500"}),e.jsx("span",{children:"+ Caja / Tarjeta"})]}),e.jsx("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_SELECT_PARENT"},"*")},disabled:!de,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 disabled:opacity-40 cursor-pointer",children:"Seleccionar Caja Contenedora"}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DUPLICATE_SELECTED"},"*")},disabled:!de,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(oa,{className:"w-3 h-3 text-indigo-500"}),e.jsx("span",{children:"Duplicar"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DELETE_SELECTED"},"*")},disabled:!de,className:"px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(He,{className:"w-3 h-3"}),e.jsx("span",{children:"Eliminar"})]})]})]}),e.jsx("div",{className:"flex justify-center items-center bg-slate-950 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-inner overflow-hidden min-h-[460px]",children:e.jsxs("div",{ref:_a,className:y("relative overflow-hidden bg-slate-950 shadow-2xl border border-white/10 transition-all duration-300",qt?"w-screen h-screen rounded-none border-0 flex flex-col items-center justify-between p-4 sm:p-6":y("rounded-2xl mx-auto flex items-center justify-center",V==="9:16"?"w-full max-w-[390px] aspect-[9/16] max-h-[660px]":"w-full aspect-[16/9] max-h-[660px] min-h-[340px]")),children:[e.jsxs("div",{className:y("relative overflow-hidden bg-slate-950",qt?V==="9:16"?"h-[calc(100vh-100px)] aspect-[9/16] max-w-[95vw] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-[min(94vw,calc((100vh-100px)*1.7778))] aspect-[16/9] max-h-[calc(100vh-100px)] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-full h-full"),children:[xe&&e.jsx("audio",{ref:ue,src:xe,preload:"metadata",onTimeUpdate:t=>{var s,n;const a=t.currentTarget.currentTime,r=t.currentTarget.duration&&!isNaN(t.currentTarget.duration)?t.currentTarget.duration:$||20;Ee(a),(n=(s=M.current)==null?void 0:s.contentWindow)==null||n.postMessage({type:"STUDIO_SYNC_TIME",currentTime:a,duration:r,playing:!t.currentTarget.paused&&!t.currentTarget.ended},"*")},onLoadedMetadata:t=>{t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&Je(t.currentTarget.duration)},onEnded:()=>{var t,a,r;Fe(!1),(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_PAUSE"},"*"),(r=pe.current)==null||r.pause()}}),ee&&e.jsx("video",{ref:pe,src:ee,width:V==="9:16"?1080:1920,height:V==="9:16"?1920:1080,muted:vt,playsInline:!0,loop:!0,preload:"metadata",onTimeUpdate:t=>{xe||Ee(t.currentTarget.currentTime)},onLoadedMetadata:t=>{!xe&&t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&Je(t.currentTarget.duration)},className:"absolute inset-0 w-full h-full object-cover z-0"}),e.jsx("iframe",{ref:M,title:"WAPPY Studio HTML Canvas",srcDoc:Rs,sandbox:"allow-scripts allow-same-origin",onLoad:()=>{var t,a,r,s,n,o;(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*"),ne?(s=(r=M.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!0},"*"):ke||(o=(n=M.current)==null?void 0:n.contentWindow)==null||o.postMessage({type:"STUDIO_PAUSE"},"*")},className:y("absolute inset-0 w-full h-full border-0 z-10",ne?"pointer-events-auto":"pointer-events-none")}),fe&&ta&&e.jsx("div",{className:y("absolute inset-x-3 z-20 flex justify-center pointer-events-none",$e==="top"?"top-16":$e==="center"?"top-1/2 -translate-y-1/2":"bottom-5"),children:e.jsx("div",{className:"bg-[#050c12]/90 backdrop-blur-md border border-[#c7f303]/40 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]",children:e.jsx("div",{className:"flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1",children:ta.words.map((t,a)=>{const r=a===ta.activeOffset;return e.jsx("span",{className:y("text-sm sm:text-base font-black uppercase tracking-wide transition-all duration-150",r?"text-[#080c04] scale-110 bg-[#c7f303] px-2 py-0.5 rounded-lg shadow-[0_0_14px_rgba(199,243,3,0.45)]":"text-white/95"),children:t},`${t}-${a}`)})})})})]}),qt&&e.jsxs("div",{className:"w-full max-w-3xl mx-auto mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 flex items-center gap-3 z-30 shadow-2xl",children:[e.jsx("button",{type:"button",onClick:Ha,title:ke?"Pausar / Parar":"Reproducir",className:"px-3.5 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:ke?e.jsxs(e.Fragment,{children:[e.jsx(Dt,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(Me,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:ea,title:"Reiniciar animación",className:"p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer shrink-0",children:e.jsx(la,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:$||20,step:.1,value:We,onChange:t=>Ga(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-200 shrink-0",children:[We.toFixed(1),"s / ",($||20).toFixed(1),"s"]}),e.jsxs("button",{type:"button",onClick:qa,className:y("px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0",ne?"bg-amber-500/20 border-amber-400 text-amber-300":"bg-slate-800 border-slate-700 text-slate-200 hover:text-white"),children:[e.jsx(Lt,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:ne?"Editando":"Editar"})]}),e.jsxs("button",{type:"button",onClick:Ka,className:"px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0",children:[e.jsx(lr,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Salir"})]})]})]})}),e.jsxs("div",{className:"p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{type:"button",onClick:Ha,title:ke?"Pausar animación y subtítulos":"Reproducir animación y subtítulos",className:"px-3 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:ke?e.jsxs(e.Fragment,{children:[e.jsx(Dt,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(Me,{className:"w-4 h-4 fill-white ml-0.5"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:ea,title:"Reiniciar animación",className:"p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition cursor-pointer shrink-0",children:e.jsx(la,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:$||20,step:.1,value:We,onChange:t=>Ga(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0",children:[We.toFixed(1),"s / ",($||20).toFixed(1),"s"]}),ee&&e.jsx("button",{type:"button",onClick:()=>Ns(!vt),title:vt?"Activar audio del video original":"Silenciar video original",className:"p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition cursor-pointer",children:vt?e.jsx(us,{className:"w-4 h-4 text-rose-500"}):e.jsx(ca,{className:"w-4 h-4 text-teal-500"})})]}),e.jsxs("div",{className:"pt-2 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",disabled:it,onClick:Ya,className:"p-3 rounded-xl border bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20 text-teal-800 dark:text-teal-200 text-left transition-all cursor-pointer disabled:opacity-50 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20",children:"WhatsApp • Celular • Redes"}),it?e.jsx(ae,{className:"w-4 h-4 animate-spin shrink-0"}):e.jsx(Ve,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight mt-0.5",children:it?"Renderizando Video MP4...":"Descargar Video .MP4 (Todo Unido)"}),e.jsx("div",{className:"text-[10px] opacity-85 leading-snug",children:"Une Animación + Subtítulos + Voz IA en un archivo .MP4 listo para enviar por WhatsApp o subir a Reels"})]}),e.jsxs("div",{className:"p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20",children:"Academia WAPPY • LMS Responsive"}),e.jsx(ra,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight",children:"Cápsula Interactiva HTML5 (Móvil & Web)"}),e.jsxs("div",{className:"flex items-center gap-1.5 mt-0.5",children:[e.jsxs("button",{type:"button",disabled:St,onClick:Za,className:"flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx(tt,{className:"w-3 h-3"}),e.jsx("span",{children:"Descargar .HTML"})]}),e.jsxs("button",{type:"button",disabled:St,onClick:Zs,title:"Copiar código <iframe srcdoc> para lección de Academia WAPPY",className:"py-1.5 px-2.5 rounded-lg bg-white/80 dark:bg-slate-800 hover:bg-white text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx(oa,{className:"w-3 h-3"}),e.jsx("span",{children:"Copiar LMS"})]})]})]})]})]}),ne&&de&&e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/95 rounded-2xl border border-teal-500/40 space-y-3 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5",children:[e.jsx(Lt,{className:"w-3.5 h-3.5"}),"Propiedades del Elemento Seleccionado (<",de.tagName,">)"]}),e.jsx("button",{type:"button",onClick:()=>ze({dx:0,dy:0,scale:1}),className:"text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer",children:"Restablecer posición"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Texto del elemento (edita aquí o con doble clic en el video):"}),e.jsx("textarea",{rows:2,value:de.text,onChange:t=>ze({text:t.target.value}),className:"w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:["Tamaño Letra (",de.fontSize,"px)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>ze({fontSize:Math.max(10,de.fontSize-2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"A-"}),e.jsx("button",{type:"button",onClick:()=>ze({fontSize:Math.min(96,de.fontSize+2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"A+"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:["Escala Caja (",de.scale,"x)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>ze({scale:Math.max(.5,Number((de.scale-.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"-"}),e.jsx("button",{type:"button",onClick:()=>ze({scale:Math.min(2.5,Number((de.scale+.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"+"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Texto"}),e.jsx("input",{type:"color",value:de.color,onChange:t=>ze({color:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Fondo"}),e.jsx("input",{type:"color",value:de.backgroundColor,onChange:t=>ze({backgroundColor:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"})]})]})]})]})]}),S==="lab"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-xs",children:[e.jsx("div",{className:"w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0",children:e.jsx(De,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:"Laboratorio de Expresividad y Vocal Bursts"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Explora las capacidades de Gemini TTS: respiraciones orgánicas, risas, susurros y dirección de estilo en tiempo real"})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:"Modelo en el Laboratorio:"}),e.jsx("div",{className:"flex flex-wrap items-center gap-2",children:re.map(t=>{const a=m===t.id;return e.jsxs("button",{type:"button",onClick:()=>{f(t.id),t.supportedVoices.includes(b)||T(t.supportedVoices[0]||"Kore")},className:y("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[t.name," (",t.supportedVoices.length," voces)"]},t.id)})})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:"Efectos Vocales Orgánicos Integrados"}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:Q.map(t=>{const a=gs===t.tag;return e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400",children:t.tag}),e.jsx("p",{className:"text-xs font-bold text-slate-900 dark:text-white mt-0.5",children:t.label}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:t.description})]}),e.jsx("button",{type:"button",disabled:a,onClick:async()=>{try{ga(t.tag);const r=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:Z(p),body:JSON.stringify({voiceName:b,model:"gemini-3.8-flash-tts",stylePrompt:"Voz muy expresiva y natural.",text:`Escucha cómo suena este efecto natural en medio de una frase: ${t.tag} ¡Suena totalmente humano!`})}),s=await we(r);s.audioBase64&&ie({base64:s.audioBase64,title:`Efecto ${t.tag} (${b})`,durationSeconds:s.durationSeconds,voiceName:b})}catch(r){j({type:"error",text:r.message})}finally{ga(null)}},className:"w-9 h-9 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 transition cursor-pointer",children:a?e.jsx(ae,{className:"w-4 h-4 animate-spin"}):e.jsx(Me,{className:"w-4 h-4 fill-current"})})]},t.tag)})})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:"Probador Libre de Prosodia y Dirección de Voz"}),e.jsxs("span",{className:"text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",children:["Voces activas: ",Qe," de ",N.length]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:["Selecciona la Voz (",Qe," activas para ",O==null?void 0:O.name,")"]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:N.map(t=>{const a=b===t.id,r=Xe(t.id);return e.jsxs("button",{type:"button",onClick:()=>{r||f("gemini-3.8-flash-tts"),T(t.id)},className:y("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-teal-400",!r&&"opacity-55"),children:[e.jsxs("span",{children:[t.name," (",t.gender,")"]}),r&&e.jsx(mt,{className:"w-3 h-3 text-emerald-400"})]},t.id)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5",children:"Prompt de Dirección (speechMetadata.style)"}),e.jsx("input",{type:"text",value:_t,onChange:t=>ms(t.target.value),className:"w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5",children:"Texto de Prueba"}),e.jsx("textarea",{rows:3,value:Ce,onChange:t=>bs(t.target.value),className:"w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsx("div",{children:e.jsxs("button",{type:"button",onClick:Bs,disabled:ma||!Ce.trim(),className:"inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[ma?e.jsx(ae,{className:"w-4 h-4 animate-spin"}):e.jsx(De,{className:"w-4 h-4"}),e.jsx("span",{children:"Sintetizar en el Laboratorio"})]})})]})]}),S==="library"&&e.jsxs("div",{className:"space-y-5 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(ra,{className:"w-5 h-5 text-indigo-500"}),"Biblioteca de Audios y Videos"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Tus locuciones y videos (HTML + voz) quedan guardados permanentemente en este navegador para reproducir, reabrir, editar o descargar."})]}),Le.length>0&&e.jsx(L,{icon:e.jsx(He,{}),label:"Limpiar Historial",variant:"danger",onClick:()=>{window.confirm("¿Borrar todos los audios y videos guardados?")&&(Ke([]),yr())}})]}),Le.length===0?e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2",children:[e.jsx(ct,{className:"w-10 h-10 mx-auto text-slate-400"}),e.jsx("p",{className:"text-sm font-bold text-slate-900 dark:text-white",children:"Aún no hay audios en tu biblioteca"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto",children:'Genera una locución en la pestaña "Estudio de Voz (TTS)" o en "Voces & Bursts" y aparecerá aquí automáticamente.'})]}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:Le.map(t=>e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("h4",{className:"text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1",children:t.title}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[t.kind==="video"&&e.jsxs("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30",children:["🎬 VIDEO ",t.aspectRatio||""]}),e.jsx("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30",children:t.voiceName})]})]}),e.jsxs("div",{className:"flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300",children:[e.jsxs("span",{children:["⏱ ",Cr(t.durationSeconds)]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[t.wordCount," palabras"]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:Er(t.createdAt)})]}),t.stylePrompt&&e.jsxs("div",{className:"p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-[11px] italic text-slate-600 dark:text-slate-300 line-clamp-2",children:['"',t.stylePrompt,'"']})]}),e.jsxs("div",{className:"flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800",children:[e.jsx("div",{className:"flex items-center gap-1.5",children:t.kind==="video"?e.jsx(L,{size:"sm",icon:e.jsx(Lt,{}),label:"Abrir en Compositor",variant:"orange",onClick:()=>Js(t)}):e.jsxs(e.Fragment,{children:[e.jsx(L,{size:"sm",icon:e.jsx(Me,{}),label:"Reproducir",variant:"teal",onClick:()=>Fa(t)}),e.jsx(L,{size:"sm",icon:e.jsx(Ve,{}),label:"Usar en Video",variant:"purple",onClick:()=>Fa(t,!0)})]})}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[t.kind==="video"&&t.mp4Key&&e.jsx(L,{size:"sm",icon:e.jsx(Ve,{}),label:"Descargar MP4",variant:"green",onClick:async()=>{const a=await ut(t.mp4Key);a&&Zt(a,`wappy-studio-reel-${t.id}.mp4`)}}),t.kind==="video"&&t.capsuleKey&&e.jsx(L,{size:"sm",icon:e.jsx(tt,{}),label:"Descargar Cápsula HTML",variant:"green",onClick:async()=>{const a=await ut(t.capsuleKey);a&&Zt(a,`wappy-academia-capsula-${t.id}.html`)}}),t.kind!=="video"&&e.jsx(L,{size:"sm",icon:e.jsx(tt,{}),label:"Descargar WAV",variant:"green",onClick:async()=>{const a=await Ua(t);if(!a){j({type:"error",text:"Este audio ya no está disponible (se generó antes del guardado permanente). Vuelve a generarlo."});return}Zt(a,`wappy-audio-${t.id}.wav`)}}),e.jsx(L,{size:"sm",icon:e.jsx(He,{}),label:"Eliminar",variant:"danger",onClick:()=>Os(t)})]})]})]},t.id))})]})]}),Is&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-300 shrink-0",children:e.jsx(Mt,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:"Gestor de Claves API & Ecosistema GOOGLE_MODELS"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-zinc-400",children:"Rotación inteligente anti-429 y catálogo completo de modelos oficiales de WAPPY."})]})]}),e.jsx("button",{type:"button",onClick:()=>nt(!1),className:"p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-zinc-300 cursor-pointer",children:e.jsx(Rt,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800",children:[e.jsxs("button",{type:"button",onClick:()=>X("keys"),className:y("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",K==="keys"?"bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(Mt,{className:"w-3.5 h-3.5"}),e.jsxs("span",{children:["Mis Claves Locales (",Ae,"/3)"]})]}),e.jsxs("button",{type:"button",onClick:()=>X("models"),className:y("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",K==="models"?"bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(ss,{className:"w-3.5 h-3.5"}),e.jsxs("span",{children:["Modelos WAPPY (",ls.length,")"]})]})]}),K==="keys"?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-900 dark:text-teal-200 leading-relaxed",children:["Obtén gratis tus claves en"," ",e.jsx("a",{href:"https://aistudio.google.com/app/apikey",target:"_blank",rel:"noopener noreferrer",className:"font-extrabold underline hover:text-teal-600",children:"Google AI Studio (aistudio.google.com)"}),". WAPPY Studio rotará automáticamente entre tus claves locales y el pool del servidor para evitar bloqueos por cuota 429 en locuciones de hasta 60 minutos."]}),e.jsx("div",{className:"space-y-2.5",children:Tt.map((t,a)=>e.jsxs("div",{className:"p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px] font-bold",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-slate-900 dark:text-white",children:t.label||`Clave Google Gemini #${a+1}`}),e.jsx("span",{className:y("text-[9px] font-extrabold px-1.5 py-0.5 rounded border",a===0?"bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30":"bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"),children:a===0?"Prioridad #1":`Failover #${a+1}`})]}),t.status==="valid"&&e.jsxs("span",{className:"text-emerald-700 dark:text-emerald-400 flex items-center gap-1",children:[e.jsx(na,{className:"w-3.5 h-3.5"})," Activa y verificada"]}),t.status==="invalid"&&e.jsxs("span",{className:"text-rose-600 dark:text-rose-400 flex items-center gap-1",children:[e.jsx(bt,{className:"w-3.5 h-3.5"})," Clave inválida o vencida"]})]}),e.jsx("input",{type:"password",value:t.key,onChange:r=>{const s=r.target.value;Ct(n=>n.map((o,l)=>l===a?{...o,key:s,status:"unchecked"}:o))},placeholder:"AIzaSy...",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"})]},a))}),$a&&e.jsx("div",{className:"p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300",children:$a}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800",children:[e.jsx(L,{size:"sm",icon:e.jsx(He,{}),label:"Limpiar Claves",variant:"danger",onClick:()=>{Ct([{key:"",label:"Clave Principal #1",status:"unchecked"},{key:"",label:"Clave Respaldo #2",status:"unchecked"},{key:"",label:"Clave Respaldo #3",status:"unchecked"}]),localStorage.removeItem(Ot),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),ot("Claves eliminadas del navegador.")}}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(L,{size:"sm",icon:e.jsx(Rt,{}),label:"Cerrar",variant:"neutral",onClick:()=>nt(!1)}),e.jsx(L,{size:"sm",icon:Yt?e.jsx(ae,{className:"animate-spin"}):e.jsx(ns,{}),label:Yt?"Validando...":"Guardar y Validar",variant:"teal",disabled:Yt,onClick:zs})]})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed",children:[e.jsx("strong",{children:"Ecosistema Oficial GOOGLE_MODELS de WAPPY:"})," Haz clic en cualquier modelo TTS o de Generación IA para activarlo de inmediato en el estudio."]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1",children:ls.map(t=>{const a=t.id.includes("tts"),r=t.id==="gemini-3.8-flash"||t.id==="gemini-3.6-flash"||t.id==="gemini-3.5-flash-lite",s=a&&m===t.id||r&&W===t.id;return e.jsxs("div",{onClick:()=>{a?f(t.id):r&&ge(t.id)},className:y("p-3 rounded-xl border text-left transition flex flex-col justify-between",a||r?"cursor-pointer":"opacity-90",s?"bg-teal-50/90 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400",children:t.category}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25",children:t.badge})]}),e.jsx("div",{className:"font-mono text-xs font-extrabold text-slate-900 dark:text-white",children:t.id}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-snug",children:t.description})]}),(a||r)&&e.jsxs("div",{className:"mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-slate-500 dark:text-zinc-400",children:a?"Motor de Voz TTS":"Motor IA Escenas/Guion"}),e.jsx("span",{className:y("font-extrabold",s?"text-emerald-700 dark:text-emerald-400":"text-indigo-600 dark:text-indigo-400"),children:s?"✓ En uso":"Usar este modelo →"})]})]},t.id)})}),e.jsx("div",{className:"flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800",children:e.jsx(L,{size:"sm",icon:e.jsx(mt,{}),label:"Listo",variant:"teal",onClick:()=>nt(!1)})})]})]})})]})}function Ar({audioBase64:d,audioUrl:c,title:p,durationSeconds:g,voiceName:z,onSendToVideo:P}){const h=i.useRef(null),[F,oe]=i.useState(!1),[R,C]=i.useState(0),[S,se]=i.useState(g||0),[W,ge]=i.useState(1),[k,v]=i.useState(1),[K,X]=i.useState(!1),[re,Y]=i.useState(!1),N=c||(d?`data:audio/wav;base64,${d}`:"");i.useEffect(()=>{oe(!1),C(0),g&&g>0&&se(g)},[N,g]);const le=()=>{!h.current||!N||(F?h.current.pause():h.current.play().catch(m=>console.error("Error al reproducir audio:",m)))},E=m=>{if(!h.current)return;const f=Math.max(1,S||h.current.duration||0),b=Math.max(0,Math.min(f,h.current.currentTime+m));h.current.currentTime=b,C(b)},he=()=>{if(!h.current)return;const m=!K;h.current.muted=m,X(m)},Q=m=>{if(!m||isNaN(m)||m<0)return"00:00";const f=Math.floor(m),b=Math.floor(f/60),T=f%60;return`${b.toString().padStart(2,"0")}:${T.toString().padStart(2,"0")}`},ve=async()=>{if(!N)return;const m=`${p.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"wappy-tts"}.wav`;try{if(N.startsWith("data:")||N.startsWith("blob:")){const T=document.createElement("a");T.href=N,T.download=m,document.body.appendChild(T),T.click(),document.body.removeChild(T);return}const b=await fetch(N,{headers:Z()});if(b.ok){const T=await b.blob(),_=URL.createObjectURL(T),J=document.createElement("a");J.href=_,J.download=m,document.body.appendChild(J),J.click(),document.body.removeChild(J),setTimeout(()=>URL.revokeObjectURL(_),4e3);return}}catch{}const f=document.createElement("a");f.href=N,f.download=m,document.body.appendChild(f),f.click(),document.body.removeChild(f)};return N?e.jsxs("div",{className:"bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 border border-indigo-500/25 dark:border-indigo-500/25 rounded-2xl p-5 shadow-xl space-y-3.5",children:[e.jsx("audio",{ref:h,src:N,preload:"metadata",onPlay:()=>oe(!0),onPause:()=>oe(!1),onEnded:()=>oe(!1),onTimeUpdate:()=>{h.current&&C(h.current.currentTime)},onLoadedMetadata:()=>{var m;(m=h.current)!=null&&m.duration&&!isNaN(h.current.duration)&&se(h.current.duration)}}),e.jsxs("div",{className:"flex flex-wrap sm:flex-nowrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"}),e.jsx("h3",{className:"text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-xl",children:p})]}),e.jsxs("p",{className:"text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate",children:["Voz:"," ",e.jsx("span",{className:"font-semibold text-slate-700 dark:text-slate-200",children:z||"Kore"})," ","• Formato WAV 24kHz"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[d&&e.jsx("button",{type:"button",onClick:()=>{navigator.clipboard.writeText(d),Y(!0),setTimeout(()=>Y(!1),2e3)},title:"Copiar Base64",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer",children:re?e.jsx(mt,{className:"w-4 h-4 text-emerald-500"}):e.jsx(oa,{className:"w-4 h-4"})}),e.jsxs("button",{type:"button",onClick:P,title:"Vincular locución al Compositor de Video",className:"flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer",children:[e.jsx(Ve,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Llevar al Video"})]}),e.jsxs("button",{type:"button",onClick:ve,title:"Descargar archivo WAV completo",className:"flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/25 transition shrink-0 cursor-pointer",children:[e.jsx(tt,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Descargar WAV"})]})]})]}),e.jsx("div",{className:"flex items-center justify-between gap-1 h-12 bg-slate-100/90 dark:bg-slate-950/80 rounded-xl px-4 py-2 border border-slate-200/90 dark:border-slate-800/90 overflow-hidden",children:Array.from({length:42}).map((m,f)=>{const b=S>0?R/S:0,T=f/42,_=T<=b,J=20+Math.sin(f*.4)*15+Math.cos(f*.9)*12,H=F?Math.max(15,J*(.8+Math.sin(Date.now()/200+f)*.4)):J;return e.jsx("div",{onClick:()=>{if(h.current&&S>0){const je=T*S;h.current.currentTime=je,C(je)}},style:{height:`${Math.max(16,Math.min(95,H))}%`},className:y("w-1 rounded-full cursor-pointer transition-all duration-150",_?"bg-gradient-to-t from-indigo-500 to-amber-400":"bg-slate-300 dark:bg-slate-800 hover:bg-slate-400 dark:hover:bg-slate-700")},f)})}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("input",{type:"range",min:0,max:Math.max(1,S),step:.1,value:Math.min(R,Math.max(1,S)),onChange:m=>{const f=parseFloat(m.target.value);h.current&&(h.current.currentTime=f),C(f)},className:"w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"}),e.jsxs("div",{className:"flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400",children:[e.jsx("span",{children:Q(R)}),e.jsx("span",{children:Q(S)})]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-0.5",children:[e.jsxs("button",{type:"button",onClick:()=>{const m=[.75,1,1.25,1.5,2],f=m[(m.indexOf(W)+1)%m.length];ge(f),h.current&&(h.current.playbackRate=f)},title:"Cambiar velocidad de reproducción",className:"px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-lg border border-slate-200 dark:border-slate-700 transition shrink-0 cursor-pointer",children:[W,"x"]}),e.jsxs("div",{className:"flex items-center gap-2 sm:gap-3",children:[e.jsx("button",{type:"button",onClick:()=>E(-10),title:"Retroceder 10 segundos",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer",children:e.jsx(la,{className:"w-4 h-4"})}),e.jsx("button",{type:"button",onClick:le,className:"w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition transform active:scale-95 shrink-0 cursor-pointer",children:F?e.jsx(Dt,{className:"w-5 h-5 fill-white"}):e.jsx(Me,{className:"w-5 h-5 fill-white ml-0.5"})}),e.jsx("button",{type:"button",onClick:()=>E(10),title:"Adelantar 10 segundos",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer",children:e.jsx(dr,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsx("button",{type:"button",onClick:he,title:K?"Activar sonido":"Silenciar",className:"p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer",children:K||k===0?e.jsx(us,{className:"w-4 h-4 text-rose-500"}):e.jsx(ca,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:1,step:.05,value:K?0:k,onChange:m=>{const f=parseFloat(m.target.value);v(f),X(f===0),h.current&&(h.current.volume=f,h.current.muted=f===0)},className:"hidden sm:block w-20 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"})]})]})]}):null}function cs(d){const c=Math.max(0,Math.round(d||0)),p=Math.floor(c/60),g=c%60;return`${p}m ${g.toString().padStart(2,"0")}s`}function Pr({job:d,onPause:c,onResume:p,onCancel:g,onPlayChunk:z,onLoadMaster:P}){const h=d.status==="completed",F=d.status==="failed",oe=d.status==="processing",R=d.status==="paused";return e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:y("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",h?"bg-emerald-500/10 border-emerald-500/30 text-emerald-500":F?"bg-rose-500/10 border-rose-500/30 text-rose-500":"bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400"),children:oe?e.jsx(ae,{className:"w-5 h-5 animate-spin"}):h?e.jsx(na,{className:"w-5 h-5"}):F?e.jsx(bt,{className:"w-5 h-5"}):e.jsx(De,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("h4",{className:"text-sm font-bold text-slate-900 dark:text-white",children:h?"¡Audio de Larga Duración Completado!":F?"Error en la Generación":R?"Generación Pausada":`Generando fragmento ${d.currentChunkIndex+1} de ${d.totalChunks}...`}),e.jsx("span",{className:y("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border",h?"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25":F?"bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25":"bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 animate-pulse"),children:d.status})]}),e.jsxs("p",{className:"text-xs text-slate-500 dark:text-slate-400 mt-0.5",children:["Generados ",cs(d.generatedTotalSeconds)," de ~",cs(d.estimatedTotalSeconds)," estimados"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[oe&&e.jsxs("button",{type:"button",onClick:c,className:"flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer",children:[e.jsx(Dt,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Pausar"})]}),R&&e.jsxs("button",{type:"button",onClick:p,className:"flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition cursor-pointer",children:[e.jsx(Me,{className:"w-3.5 h-3.5 fill-white"}),e.jsx("span",{children:"Reanudar"})]}),!h&&!F&&e.jsx("button",{type:"button",onClick:g,title:"Cancelar tarea",className:"p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer",children:e.jsx(Rt,{className:"w-4 h-4"})}),h&&e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsxs("button",{type:"button",onClick:P,className:"flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/25 transition cursor-pointer",children:[e.jsx(Me,{className:"w-3.5 h-3.5 fill-white"}),e.jsx("span",{children:"Cargar en Reproductor"})]}),e.jsxs("a",{href:d.downloadUrl||`/api/studio/tts/jobs/${d.id}/download`,download:`wappy-master-${d.id}.wav`,className:"flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/25 transition",children:[e.jsx(tt,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Descargar WAV Master"})]})]})]})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between text-xs font-medium",children:[e.jsx("span",{className:"text-slate-500 dark:text-slate-400",children:"Progreso general"}),e.jsxs("span",{className:"text-indigo-600 dark:text-indigo-400 font-mono font-bold",children:[d.progressPercent,"%"]})]}),e.jsx("div",{className:"w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800",children:e.jsx("div",{className:y("h-full transition-all duration-300",h?"bg-emerald-500":F?"bg-rose-500":"bg-gradient-to-r from-indigo-500 to-violet-500"),style:{width:`${Math.min(100,Math.max(0,d.progressPercent))}%`}})})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 mb-2",children:[e.jsxs("span",{className:"text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400",children:["Fragmentos del Audio (",d.completedChunks," / ",d.totalChunks,")"]}),e.jsx("span",{className:"text-[11px] text-slate-500 dark:text-slate-500",children:"Haz clic en un fragmento listo para preescucharlo"})]}),e.jsx("div",{className:"grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-18 gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/90 dark:border-slate-800/80 max-h-36 overflow-y-auto",children:d.chunks.map(C=>{const S=C.status==="completed",se=C.status==="processing",W=C.status==="failed";return e.jsx("button",{type:"button",disabled:!S,onClick:()=>z(C),title:`Fragmento #${C.index+1}${C.wordCount?` (${C.wordCount} palabras)`:""}${S?` - ${C.durationSeconds||0}s [Haz clic para escuchar]`:""}`,className:y("h-7 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all border",S?"bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/30 cursor-pointer shadow-2xs":se?"bg-indigo-500/25 text-indigo-700 dark:text-indigo-200 border-indigo-500/50 animate-pulse":W?"bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40":"bg-slate-200/60 dark:bg-slate-800/50 text-slate-500 border-slate-300/60 dark:border-slate-800 opacity-60"),children:S?e.jsx(ca,{className:"w-3.5 h-3.5"}):se?e.jsx(ae,{className:"w-3.5 h-3.5 animate-spin"}):C.index+1},C.index)})})]}),d.failoverNotice&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2",children:[e.jsx(ps,{className:"w-4 h-4 text-amber-500 shrink-0"}),e.jsxs("span",{children:[e.jsx("strong",{children:"Rotación Automática 429:"})," ",d.failoverNotice]})]}),F&&d.error&&e.jsxs("div",{className:"p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2",children:[e.jsx(bt,{className:"w-4 h-4 text-rose-500 shrink-0"}),e.jsx("span",{children:d.error})]})]})}export{ls as WAPPY_GOOGLE_MODELS_ECOSYSTEM,ai as default};
