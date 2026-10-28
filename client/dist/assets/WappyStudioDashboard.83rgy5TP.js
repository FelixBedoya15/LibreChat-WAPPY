import{cN as Js,r as i,j as e,i0 as Qa,bp as Oe,iy as lt,fO as Re,bF as aa,cP as sa,db as At,bq as te,cO as es,bw as Zs,bD as ia,cc as xt,bl as It,el as ts,bu as ut,a$ as Xs,bN as Qs,dT as Me,gn as er,i1 as as,bB as Fe,bC as ss,bx as ds,gV as tr,b5 as Pt,bX as Xe,cu as rs,fn as ar,cx as sr,c4 as is,h2 as rr,bv as na,ef as Ot,fk as oa,fl as ir,iz as cs,ir as da,gb as nr}from"./vendor.CXZFIMv4.js";import{u as or}from"./routing.DyDPih-s.js";import{u as lr,ah as dr,a as cr,c as y,aK as I}from"./ambassadors-module.DkpCysWr.js";import"./utilities.BjsdvwEO.js";import{O as pr}from"./blog-modules.LAzQkBBV.js";import"./react-interactions.BoTI7xT5.js";import{M as ur}from"./sgsst-modules.HJpMyirn.js";import"./markdown_highlight.BXMLVVdG.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./tanstack-vendor.PchyPllz.js";import"./http-client.DsIuEJOG.js";import"./heic-converter.BhQCFQ0l.js";import"./forms.D_dmDuQm.js";import"./radix-ui.CrDY0lmB.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.5PbWSYdT.js";import"./animations.Gu3lWXir.js";import"./virtualization.DZVj7G9u.js";import"./headlessui.B6qAI1VT.js";import"./framer-motion.DsLgSzd-.js";import"./i18n.1l7KJZIb.js";import"./date-utils.X8D4nCrw.js";import"./sgsst-assets.KdMSUpxn.js";import"./security-ui.C1by4IWn.js";import"./kanban-module.De_GPOpq.js";import"./plans-module.DZ2kKe29.js";import"./lms-modules.BrhdaUGb.js";import"./markdown-processing.CcXGUTzS.js";import"./events-modules.DYzL_Scn.js";const xr="wappy-studio-media",mr=1,Rt="blobs";let dt=null;function br(){return dt||(dt=new Promise((l,p)=>{if(typeof indexedDB>"u"){p(new Error("IndexedDB no disponible en este navegador."));return}const c=indexedDB.open(xr,mr);c.onupgradeneeded=()=>{const g=c.result;g.objectStoreNames.contains(Rt)||g.createObjectStore(Rt)},c.onsuccess=()=>l(c.result),c.onerror=()=>{dt=null,p(c.error)}}),dt)}function Dt(l,p){return br().then(c=>new Promise((g,z)=>{const P=c.transaction(Rt,l),h=p(P.objectStore(Rt));h.onsuccess=()=>g(h.result),h.onerror=()=>z(h.error)}))}async function We(l,p){await Dt("readwrite",c=>c.put(p,l))}async function ct(l){try{return await Dt("readonly",c=>c.get(l))??null}catch{return null}}async function gr(l){try{await Dt("readwrite",p=>p.delete(l))}catch{}}async function hr(){try{await Dt("readwrite",l=>l.clear())}catch{}}function Mt(l,p="audio/wav"){const c=l.replace(/^data:[^;]+;base64,/,""),g=window.atob(c),z=new Uint8Array(g.length);for(let P=0;P<g.length;P++)z[P]=g.charCodeAt(P);return new Blob([z],{type:p})}var fr={};const ns=[{id:"gemini-3.8-flash",category:"Generación IA & Guiones",badge:"Principal 3.8",description:"Motor principal para generación de escenas HTML/GSAP y enriquecimiento de guiones."},{id:"gemini-3.6-flash",category:"Generación IA & Guiones",badge:"Estable 3.6",description:"Modelo rápido de alta precisión para código HTML5, Tailwind y estructura SST."},{id:"gemini-3.5-flash-lite",category:"Generación IA & Guiones",badge:"Ultra Ligero",description:"Baja latencia para respuestas instantáneas y estructuración rápida."},{id:"gemini-3.8-live",category:"Voz en Tiempo Real (Live)",badge:"Tenshi Live 3.8",description:"Interacción conversacional bidireccional de baja latencia en tiempo real."},{id:"gemini-3.1-flash-live-preview",category:"Voz en Tiempo Real (Live)",badge:"Live Preview 3.1",description:"Respaldo multimodal en vivo para sesiones de voz continua."},{id:"gemini-2.5-flash-native-audio-preview-12-2025",category:"Voz en Tiempo Real (Live)",badge:"Audio Nativo 2.5",description:"Audio nativo multimodal con soporte extendido de herramientas."},{id:"gemini-3.8-flash-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Recomendado (14 voces)",description:"Máxima expresividad, vocal bursts (<breath>, <laugh>) y las 14 voces activas."},{id:"gemini-3.1-flash-tts-preview",category:"Síntesis de Voz (TTS 24kHz)",badge:"Preview 3.1 (14 voces)",description:"Prosodia refinada y soporte completo para las 14 voces preconstruidas."},{id:"gemini-2.5-flash-preview-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Reemplazo 2.5 Pro (5 voces)",description:"Activa las 5 voces fundamentales (Kore, Puck, Charon, Fenrir, Aoede)."},{id:"gemini-3.8-flash-lite-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Ultra Rápido (6 voces)",description:"Lecturas masivas de baja latencia con 6 voces optimizadas."}],Lt={"gemini-3.8-flash-tts":{id:"gemini-3.8-flash-tts",name:"Gemini 3.8 Flash TTS",badge:"Recomendado / Cuota Activa",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"✓ Activo (14 voces)",description:"Máxima fluidez natural, diseño de voz, vocal bursts (<breath>, <laugh>) y soporte para las 14 voces.",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-3.1-flash-tts-preview":{id:"gemini-3.1-flash-tts-preview",name:"Gemini 3.1 Flash TTS Preview",badge:"Preview 3.1 / Cuota Activa",badgeColor:"bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:"Arquitectura Gemini 3.1 con prosodia refinada, tono expresivo y respuesta ágil (14 voces).",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-2.5-flash-preview-tts":{id:"gemini-2.5-flash-preview-tts",name:"Gemini 2.5 Flash TTS",badge:"Reemplazo de 2.5 Pro",badgeColor:"bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",rateLimitLabel:"3 RPM • 10 RPD (2.5 Pro: 0/0)",quotaLabel:"5 voces",description:"Reemplazo oficial y funcional de 2.5 Pro (no disponible en API). Activa únicamente las 5 voces fundamentales.",supportsMultiSpeaker:!0,supportsVocalBursts:!1,supportedVoices:["Kore","Puck","Charon","Fenrir","Aoede"]},"gemini-3.8-flash-lite-tts":{id:"gemini-3.8-flash-lite-tts",name:"Gemini 3.8 Flash-Lite TTS",badge:"Ultra Rápido",badgeColor:"bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",rateLimitLabel:"Baja Latencia",quotaLabel:"6 voces",description:"Optimizado para lecturas masivas con mínima latencia continua (6 voces rápidas).",supportsMultiSpeaker:!1,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Aoede"]}},yr=[{id:"Kore",name:"Kore",gender:"Femenino",tone:"Cálida, Serena y Profesional",recommendedFor:"Audiolibros, Narración, Tutoriales, Inducción SST",tag:"Más popular"},{id:"Puck",name:"Puck",gender:"Masculino",tone:"Enérgico, Dinámico y Joven",recommendedFor:"Podcasts, Reels, Contenido Creativo, Diálogos",tag:"Muy expresivo"},{id:"Charon",name:"Charon",gender:"Masculino",tone:"Barítono, Grave, Maduro y Solemne",recommendedFor:"Documentales, Historia, Suspenso, Directivos",tag:"Voz profunda"},{id:"Fenrir",name:"Fenrir",gender:"Masculino",tone:"Claro, Elocuente y Periodístico",recommendedFor:"Noticias, Informes, Presentaciones, Boletines",tag:"Profesional"},{id:"Zephyr",name:"Zephyr",gender:"Femenino",tone:"Dulce, Aterciopelada y Relajante",recommendedFor:"Meditación, ASMR, Cuentos, Bienestar",tag:"Calma"},{id:"Orus",name:"Orus",gender:"Masculino",tone:"Firme, Imperial, Épico y Reflexivo",recommendedFor:"Ficción Épica, Liderazgo, Ensayos, Cultura Vial",tag:"Imperial"},{id:"Aoede",name:"Aoede",gender:"Femenino",tone:"Melódica, Expresiva, Artística y Cálida",recommendedFor:"Poesía, Literatura, Storytelling, Sensibilización",tag:"Melódica"},{id:"Leda",name:"Leda",gender:"Femenino",tone:"Cercana, Maternal, Madura y Envolvente",recommendedFor:"Audiolibros Largos, Relatos, Bienvenida",tag:"Narradora"},{id:"Callisto",name:"Callisto",gender:"Femenino",tone:"Elegante, Sofisticada y Articulada",recommendedFor:"Divulgación Científica, Conferencias, Auditorías",tag:"Sofisticada"},{id:"Europa",name:"Europa",gender:"Femenino",tone:"Brillante, Luminosa, Alegre y Asertiva",recommendedFor:"Marketing, Anuncios, E-Learning, Campañas",tag:"Enérgica"},{id:"Ganymede",name:"Ganymede",gender:"Masculino",tone:"Resonante, Equilibrado, Sabio y Seguro",recommendedFor:"Educación Superior, Cursos, Capacitación Técnica",tag:"Resonante"},{id:"Io",name:"Io",gender:"Femenino",tone:"Vivaz, Espontánea, Fresca y Amigable",recommendedFor:"Redes Sociales, Vlogs, Asistentes, Reels",tag:"Fresca"},{id:"Titan",name:"Titan",gender:"Masculino",tone:"Imponente, Cinematográfico y Potente",recommendedFor:"Tráilers, Introducciones, Impacto, Alertas",tag:"Cinematográfica"},{id:"Prometheus",name:"Prometheus",gender:"Masculino",tone:"Noble, Pensativo, Filosófico y Clásico",recommendedFor:"Filosofía, Análisis Profundo, Crónicas",tag:"Sabio"}],vr=[{id:"orus-solemn",name:"Narración Solemne (Orus)",voiceName:"Orus",style:"Voz firme, templada, reflexiva y madura de narrador de crónica histórica, dicción solemne, pausas medidas y respiraciones naturales.",speed:"0.95x"},{id:"aoede-poetic",name:"Cuento Poético (Aoede)",voiceName:"Aoede",style:"Voz melódica, cálida, expresiva y artística para relato literario y sensibilización, con matices emocionales suaves.",speed:"0.95x"},{id:"titan-trailer",name:"Tráiler Cinematográfico (Titan)",voiceName:"Titan",style:"Voz imponente, profunda, cinematográfica y épica de tráiler de película, con pausas dramáticas e impacto.",speed:"0.95x"},{id:"kore-audiobook",name:"Narrador de Audiolibro (Kore)",voiceName:"Kore",style:"Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.",speed:"1.0x"},{id:"puck-podcast",name:"Host de Podcast Dinámico (Puck)",voiceName:"Puck",style:"Host de podcast carismático, enérgico, cercano y espontáneo, con entonación conversacional moderna.",speed:"1.05x"},{id:"charon-documentary",name:"Documental Profundo (Charon)",voiceName:"Charon",style:"Tono barítono, solemne, reflexivo y cinematográfico de narrador de documental, con pausas medidas.",speed:"0.95x"},{id:"fenrir-news",name:"Noticiero Profesional (Fenrir)",voiceName:"Fenrir",style:"Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.",speed:"1.05x"},{id:"zephyr-asmr",name:"Meditación y ASMR (Zephyr)",voiceName:"Zephyr",style:"Voz suave, serena, dulce y sumamente relajante para meditación guiada, mindfulness y bienestar.",speed:"0.9x"},{id:"screenplay-dialogue",name:"Guion / Diálogo Alex & Sam",voiceName:"Kore",multiSpeaker:!0,speaker1:{name:"Alex",voiceName:"Puck",style:"Entusiasta y curioso"},speaker2:{name:"Sam",voiceName:"Kore",style:"Experta, clara y cercana"},style:"Diálogo interactivo de podcast entre dos especialistas con alternancia natural.",speed:"1.0x"}],wr=[{tag:"<breath>",label:"Respiración natural",description:"Inserta una toma de aire orgánica entre frases"},{tag:"<laugh>",label:"Risa / Carcajada",description:"Añade una risa espontánea o carcajada suave"},{tag:"<gasp>",label:"Sorpresa / Jadear",description:"Efecto de inhalación rápida de asombro"},{tag:"|mhm|",label:"Asentimiento (|mhm|)",description:"Confirmación conversacional natural"},{tag:"|yeah|",label:"Aceptación (|yeah|)",description:"Interjección de acuerdo en diálogos"}],pt=[{title:"Inducción SST: 5 Reglas de Oro en Riesgo Eléctrico",text:`¡Atención equipo! Antes de intervenir cualquier tablero o red eléctrica, recuerda que tu vida depende de las Cinco Reglas de Oro. <breath>

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

Tu bienestar mental y físico es la base de un entorno laboral saludable y seguro.`}],kr=[{id:"golden-rules",name:"🔥 Reel WAPPY + Félix 3D",badge:"Oficial GTC-45",description:"Multi-escena con Félix 3D lip-sync, Mockup celular, VS y tarjetas sincronizadas con la voz."},{id:"kpi-hud",name:"🚀 Ecosistema + Tenshi IA",badge:"Plataforma 40s",description:"Constelación IA, telemetría 3D en vivo, comparativa VS y tarjeta oráculo Tenshi."},{id:"alert-sst",name:"📜 Expediente & Reglas SST",badge:"Normativo",description:"Visor normativo con resaltador fluorescente, checklist secuencial 1-2-3 y radar."},{id:"camera-overlay",name:"🎬 Lower-Third (Video Propio)",badge:"Transparente",description:"Capas dinámicas por frase en tercio superior e inferior sin tapar tu rostro."}];function ps(l,p=28){const c=Math.max(4,Number(p)||28),z=String(l||"").replace(/^(Alex|Sam|Hablante\s*\d+|Speaker\s*\d+):\s*/gim,"").trim().split(new RegExp("(?<=[.!?…])\\s+|\\n+|<breath>","gi")).map(j=>j.replace(/<[^>]+>/g,"").replace(/\|[^|]+\|/g,"").trim()).filter(Boolean);z.length===0&&z.push("Prevención inteligente y seguridad en el trabajo con WAPPY IA.");const P=[];for(let j=0;j<z.length;j++){const v=z[j];v.length<18&&j+1<z.length?z[j+1]=`${v} ${z[j+1]}`:P.push(v)}const h=7,U=[];if(P.length<=h)U.push(...P);else{const j=Math.ceil(P.length/h);for(let v=0;v<P.length;v+=j)U.push(P.slice(v,v+j).join(" "))}const oe=[],O=[];let E=0;const N=U.map((j,v)=>{const J=j.split(/\s+/).filter(Boolean).map(q=>{const C=q.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g,"").length;let le=Math.max(2,C);return/[,;:]$/.test(q)&&(le+=4),/[.!?…]$/.test(q)&&(le+=9),{word:q,weight:le}});J.length>0&&(J[J.length-1].weight+=7);const se=J.reduce((q,C)=>q+C.weight,0)||10;return E+=se,{text:j,bIdx:v,wList:J,beatWeight:se}}),ae=["wave","pointLeft","pointRight","bothUp"],F=["lime","cyan","amber"];let ge=0;for(let j=0;j<N.length;j++){const v=N[j],G=ge/Math.max(1,E),J=(ge+v.beatWeight)/Math.max(1,E),se=Number((G*c).toFixed(2)),q=Number((J*c).toFixed(2)),C=Number(Math.max(.8,q-se).toFixed(2));let le=ge;for(const K of v.wList){const W=le/Math.max(1,E);le+=K.weight;const je=le/Math.max(1,E);oe.push({word:K.word,startPct:Number(W.toFixed(4)),endPct:Number(je.toFixed(4)),beatIndex:j})}ge+=v.beatWeight;const A=v.text.replace(/^[¡!¿?]+/,"").split(/\s+/).filter(Boolean),he=v.text.indexOf(":");let Z=j===0?"⚡ IMPACTO INICIAL • WAPPY IA":j===N.length-1?"🛡️ CIERRE EJECUTIVO • SOMOS SST":`PUNTO CLAVE 0${j}`;/^(primero|1\b)/i.test(v.text)?Z="⚡ REGLA DE ORO 01":/^(segundo|2\b)/i.test(v.text)?Z="🔒 REGLA DE ORO 02":/^(tercero|3\b)/i.test(v.text)?Z="📡 REGLA DE ORO 03":/^(cuarto|4\b)/i.test(v.text)?Z="🛡️ REGLA DE ORO 04":/^(quinto|5\b)/i.test(v.text)&&(Z="🚨 REGLA DE ORO 05");let ye=A.slice(0,Math.min(5,A.length));if(he>0&&he<16){const K=v.text.slice(he+1).trim().split(/\s+/).filter(Boolean);K.length>=2&&(ye=K.slice(0,Math.min(5,K.length)))}const x=Math.max(1,Math.ceil(ye.length*.55)),f=ye.slice(0,x).join(" ").replace(/[,;:.!?]+$/,""),b=ye.slice(x).join(" ").replace(/[,;:.!?]+$/,"")||"WAPPY IA",T=v.text.toLowerCase();let V="bolt";/bloqueo|tarjeteo|candado|loto|aislar/.test(T)?V="lock":/verificar|ausencia|medir|auditor|inspecci|radar|pose|telemetr/.test(T)?V="radar":/tierra|cortocircuito|protecci|epp|casco|seguridad|prevenci/.test(T)?V="shield":/señalizar|delimitar|alerta|peligro|error|riesgo/.test(T)?V="alert":/matriz|gtc|excel|informe|indicador|semana|minuto/.test(T)&&(V="chart"),O.push({index:j+1,text:v.text,startSec:se,endSec:q,durationSec:C,startPct:Number(G.toFixed(4)),endPct:Number(J.toFixed(4)),badge:Z,titleLead:f,titleHighlight:b,pillColor:F[j%F.length],iconType:V,gesture:ae[j%ae.length]})}return{beats:O,wordTimings:oe,totalDurationSeconds:c}}function jr(l,p){return l==="lock"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="12" y="28" width="40" height="28" rx="8" fill="${p}" fill-opacity="0.22" stroke="${p}" stroke-width="2.8"/>
      <path d="M20 28V20C20 13.3726 25.3726 8 32 8C38.6274 8 44 13.3726 44 20V28" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="42" r="4" fill="#c7f303"/>
    </svg>`:l==="radar"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <circle cx="32" cy="32" r="24" fill="${p}" fill-opacity="0.16" stroke="${p}" stroke-width="2.5" stroke-dasharray="6 4"/>
      <circle cx="32" cy="32" r="14" stroke="#c7f303" stroke-width="2" stroke-opacity="0.7"/>
      <path d="M32 32L48 18" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="4" fill="#c7f303"/>
    </svg>`:l==="shield"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 6L10 15V31C10 45.5 19.4 57.6 32 61C44.6 57.6 54 45.5 54 31V15L32 6Z" fill="${p}" fill-opacity="0.2" stroke="${p}" stroke-width="2.8"/>
      <path d="M22 33L29 40L43 25" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`:l==="alert"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 8L6 54H58L32 8Z" fill="#f59e0b" fill-opacity="0.22" stroke="#f59e0b" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M32 24V38" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round"/>
      <circle cx="32" cy="46" r="2.8" fill="#c7f303"/>
    </svg>`:l==="chart"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="10" y="34" width="10" height="20" rx="3" fill="${p}" fill-opacity="0.35" stroke="${p}" stroke-width="2"/>
      <rect x="27" y="22" width="10" height="32" rx="3" fill="${p}" fill-opacity="0.55" stroke="${p}" stroke-width="2"/>
      <rect x="44" y="12" width="10" height="42" rx="3" fill="#c7f303" fill-opacity="0.85" stroke="#c7f303" stroke-width="2"/>
    </svg>`:`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
    <circle cx="32" cy="32" r="25" fill="${p}" fill-opacity="0.16" stroke="${p}" stroke-width="2"/>
    <path d="M35 8L14 35H31L28 56L50 28H33L35 8Z" fill="#c7f303" stroke="#c7f303" stroke-width="2" stroke-linejoin="round"/>
  </svg>`}function os({aspectRatio:l="9:16",hasBaseVideo:p=!1,badgeText:c="ECOSISTEMA IA • SG-SST",headline:g="5 Reglas de Oro en Seguridad",subheadline:z="Prevención inteligente en tiempo real con WAPPY Studio",accentColor:P="#14b8a6",templateId:h="golden-rules",scriptText:U="",durationSeconds:oe=28}){var q,C,le;const O=l==="9:16",E=(c||"ECOSISTEMA IA • SG-SST").replace(/</g,"&lt;"),N=(g||"Prevención Inteligente WAPPY IA").replace(/</g,"&lt;"),ae=(z||"Sincronización neural en vivo").replace(/</g,"&lt;"),F=p||h==="camera-overlay",ge=(U||"").trim()||`${N}. ${ae}. Primero: Identifica y controla los peligros críticos en terreno. Segundo: Verifica cada protocolo con inteligencia artificial. Tercero: Protege la vida de tu equipo con WAPPY IA.`,j=ps(ge,oe),v=j.beats,G=A=>A==="cyan"?"background:linear-gradient(135deg,#06b6d4,#14b8a6);color:#041318;box-shadow:0 0 22px rgba(6,182,212,0.45);":A==="amber"?"background:linear-gradient(135deg,#f97316,#f59e0b);color:#180902;box-shadow:0 0 22px rgba(245,158,11,0.45);":"background:#c7f303;color:#0a1103;box-shadow:0 0 24px rgba(199,243,3,0.5);",J=v.map((A,he)=>{const Z=he===0,ye=he===v.length-1,x=A.text.replace(/</g,"&lt;"),f=(Z&&g?N.split(/\s+/).slice(0,3).join(" "):A.titleLead).replace(/</g,"&lt;"),b=(Z&&g&&g.split(/\s+/).length>3?g.split(/\s+/).slice(3).join(" "):A.titleHighlight).replace(/</g,"&lt;"),T=jr(A.iconType,P);return h==="camera-overlay"?`
        <div id="scene-${A.index}" class="scene-layer ${Z?"":"opacity-0 pointer-events-none"} absolute inset-x-0 bottom-2 flex flex-col justify-end">
          <div data-editable="true" class="sc-card glass-card rounded-2xl p-3.5 sm:p-4 border-l-4" style="border-left-color:#c7f303;">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-[10px] font-mono uppercase tracking-widest text-[#c7f303] font-extrabold">${A.badge}</span>
              <span class="text-[10px] font-mono text-teal-300 font-bold">ESCENA 0${A.index}/0${v.length}</span>
            </div>
            <div class="flex items-center gap-3">
              ${T}
              <div>
                <h2 class="text-base sm:text-lg font-black text-white leading-tight font-display">
                  ${f} <span class="inline-block px-2 py-0.5 rounded-lg" style="${G(A.pillColor)}">${b}</span>
                </h2>
                <p class="text-xs text-slate-200 mt-1 leading-snug">${x}</p>
              </div>
            </div>
          </div>
        </div>`:Z?`
        <div id="scene-1" class="scene-layer absolute inset-0 flex flex-col justify-center gap-2.5 sm:gap-3">
          <div data-editable="true" class="sc-head text-center space-y-1.5">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span class="w-2 h-2 rounded-full bg-[#c7f303] animate-ping"></span>
              <span>${A.badge}</span>
            </div>
            <h1 class="${O?"text-2xl sm:text-3xl":"text-xl sm:text-2xl"} font-black tracking-tight text-white leading-none font-display">
              ${f} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${G("amber")}">${b}</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-200 font-semibold max-w-md mx-auto leading-snug">${x}</p>
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
                  <div class="text-xs sm:text-sm font-black text-white truncate">Estándar Verificado ${E}</div>
                  <div class="text-[11px] text-emerald-200/95 leading-tight">${ae}</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#c7f303] text-[#091004] text-[9px] font-mono font-black shrink-0">100% SEGURO</span>
            </div>
          </div>
        </div>`:he===1&&v.length>=3?`
        <div id="scene-${A.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>• ${A.badge}</span>
            </div>
            <h2 class="${O?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black text-white leading-tight font-display">
              ${f} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${G("cyan")}">${b}</span>
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
                <p class="text-xs font-bold text-white leading-snug">${x}</p>
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
        </div>`:ye&&v.length>=2?`
        <div id="scene-${A.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#c7f303]/20 border border-[#c7f303]/50 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>${A.badge}</span>
            </div>
            <h2 class="${O?"text-2xl sm:text-3xl":"text-xl sm:text-2xl"} font-black text-white leading-none font-display">
              ${f} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${G("lime")}">${b}</span>
            </h2>
          </div>

          <div data-editable="true" class="sc-item glass-card rounded-3xl p-4 border-2 border-[#c7f303]/60 text-center space-y-2.5" style="box-shadow:0 0 35px rgba(199,243,3,0.18);">
            <div class="flex justify-center">${T}</div>
            <p class="text-xs sm:text-sm font-extrabold text-white leading-relaxed">${x}</p>
            <div class="pt-1 flex flex-wrap items-center justify-center gap-2">
              <span class="px-3 py-1 rounded-xl bg-[#c7f303] text-[#091004] text-[10px] font-black uppercase tracking-wider">⚡ WAPPY IA • SOMOS SST</span>
              <span class="px-3 py-1 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-mono font-bold">✓ CERO ACCIDENTES</span>
            </div>
          </div>
        </div>`:`
      <div id="scene-${A.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
        <div data-editable="true" class="sc-head text-center space-y-1">
          <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-500/15 border border-teal-400/40 text-teal-300 text-[10px] font-mono font-extrabold uppercase tracking-widest">
            <span>• ${A.badge} • PASO 0${A.index}</span>
          </div>
          <h2 class="${O?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black text-white leading-tight font-display">
            ${f} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${G(A.pillColor)}">${b}</span>
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
              <p class="text-xs sm:text-sm font-bold text-white leading-relaxed">${x}</p>
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
`),se=F?"":h==="kpi-hud"?`
      <!-- TARJETA INFERIOR ORÁCULO TENSHI IA (Estilo WAPPY_IA_Plataforma_40s) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${O?"max-w-md":"max-w-2xl"} mx-auto glass-card rounded-2xl p-2.5 px-3.5 border border-teal-400/35 flex items-center gap-3 shrink-0">
        <div class="relative w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-teal-500/30 to-emerald-500/20 border border-[#c7f303]/60 shrink-0 flex items-center justify-center">
          <img src="/assets/wappy/tenshi.png" alt="Tenshi IA" class="w-full h-full object-cover" onerror="this.style.display='none'" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono font-extrabold uppercase tracking-wider text-teal-300">TENSHI • ORIENTADOR Y ORQUESTADOR SST</span>
            <span class="text-[9px] font-mono text-[#c7f303] font-bold">EN VIVO</span>
          </div>
          <p id="host-live-caption" class="text-xs font-bold text-white truncate mt-0.5">${((q=v[0])==null?void 0:q.text.replace(/</g,"&lt;"))||ae}</p>
        </div>
      </div>`:`
      <!-- PRESENTADOR FÉLIX 3D VOXEL CON LIP-SYNC Y GESTOS (Estilo Reel Matriz GTC-45 Oficial) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${O?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-center gap-3 shrink-0">
        <canvas id="wappy-felix-voxel" width="150" height="126" class="${O?"w-[122px] h-[102px]":"w-[96px] h-[80px]"} shrink-0 drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"></canvas>
        <div class="glass-card rounded-2xl p-2.5 px-3 border border-[#c7f303]/40 flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1.5 mb-0.5">
            <span id="host-live-badge" class="text-[9px] font-mono font-black uppercase tracking-wider text-[#c7f303]">${((C=v[0])==null?void 0:C.badge)||"WAPPY IA • SOMOS SST"}</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          </div>
          <p id="host-live-caption" class="text-[11px] font-bold text-slate-100 line-clamp-2 leading-snug">${((le=v[0])==null?void 0:le.text.replace(/</g,"&lt;"))||ae}</p>
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
      background: ${F?"transparent":"#050c12"};
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
<body class="relative w-full h-full flex flex-col justify-between items-center ${O?"p-3.5 sm:p-4":"p-3.5 sm:p-5"} select-none overflow-hidden">
  <!-- Barra superior de progreso Verde Lima WAPPY -->
  <div class="absolute top-0 left-0 right-0 h-1 bg-slate-900/80 z-30 overflow-hidden">
    <div id="wappy-top-progress" class="h-full bg-gradient-to-r from-[#c7f303] via-[#14b8a6] to-[#06b6d4]" style="width: 8%;"></div>
  </div>

  ${F?"<!-- Fondo transparente para video base del usuario -->":`<div class="absolute inset-0 overflow-hidden pointer-events-none">
           <div class="absolute inset-0 grid-bg"></div>
           <canvas id="wappy-bg-canvas" class="absolute inset-0 w-full h-full opacity-75"></canvas>
           <div id="orb-1" class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-30" style="background: ${P};"></div>
           <div id="orb-2" class="absolute bottom-8 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25" style="background: #c7f303;"></div>
         </div>`}

  <!-- TOP HUD TÁCTICO WAPPY (Ecualizador + Insignia + Radar Holográfico) -->
  <div id="header-hud" data-editable="true" class="relative z-10 w-full ${O?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-between gap-2 shrink-0 pt-1">
    <div class="glass-card px-3 py-1.5 rounded-full inline-flex items-center gap-2 whitespace-nowrap border border-teal-500/30">
      <div class="flex items-end gap-0.5 h-3.5" id="hud-eq">
        <span class="eq-bar w-1 bg-cyan-400 rounded-full" style="height:60%"></span>
        <span class="eq-bar w-1 bg-[#c7f303] rounded-full" style="height:100%"></span>
        <span class="eq-bar w-1 bg-teal-400 rounded-full" style="height:45%"></span>
        <span class="eq-bar w-1 bg-cyan-300 rounded-full" style="height:80%"></span>
      </div>
      <span class="text-[10px] font-extrabold tracking-widest uppercase text-teal-300">${E}</span>
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
  <div id="scenes-wrapper" class="relative z-10 my-auto w-full ${O?"max-w-md min-h-[270px]":"max-w-2xl min-h-[210px]"} mx-auto flex-1 flex flex-col justify-center">
    ${J}
  </div>

  ${se}

  <!-- ESPACIO INFERIOR RESERVADO PARA SUBTÍTULOS DINÁMICOS -->
  <div class="relative z-10 ${O?"h-12":"h-10"} shrink-0 w-full"></div>

  <script>
    window.__wappyTimelineBeats = ${JSON.stringify(v)};
    window.__wappyWordTimings = ${JSON.stringify(j.wordTimings)};
    window.__wappyVoicePlaying = true;
    window.__wappyCurrentGesture = 'wave';

    (function() {
      var beats = window.__wappyTimelineBeats || [];
      var totalDur = ${j.totalDurationSeconds};
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
</html>`}function Sr(l){if(!l)return"";if(l.includes('id="wappy-studio-runtime-bridge"'))return l;const p=`<script id="wappy-studio-gsap-hook">
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
<\/script>`,c=`<style id="wappy-studio-bridge-styles">
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
    } else if (data.type === 'STUDIO_SEEK') {
      var p = Math.max(0, Math.min(1, Number(data.progress || 0)));
      if (typeof data.time === 'number') window.__wappyCurrentTime = data.time;
      if (window.mainTimeline && typeof window.mainTimeline.progress === 'function') {
        window.mainTimeline.progress(p);
      } else if (window.gsap && window.gsap.globalTimeline && typeof data.time === 'number') {
        window.gsap.globalTimeline.time(data.time);
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
<\/script>`;let g=l.replace(/subtitles\.reverse\(\)/g,"subtitles.slice().reverse()");return g.includes("<head>")?g=g.replace("<head>",`<head>
${p}`):g=`${p}
${g}`,g.includes("</body>")?g=g.replace("</body>",`${c}
</body>`):g=`${g}
${c}`,g}const ra="wappy_studio_audio_library",zt="wappy_gemini_api_keys";function la(){try{const l=localStorage.getItem(zt);if(!l)return[];let p;try{p=JSON.parse(l)}catch{p=l.split(",")}return typeof p=="string"&&(p=p.split(",")),Array.isArray(p)?p.map((c,g)=>typeof c=="string"?{key:c.trim(),label:`Clave #${g+1}`,status:"unchecked"}:c&&typeof c.key=="string"?{key:c.key.trim(),label:c.label||`Clave #${g+1}`,status:c.status||"unchecked"}:null).filter(c=>!!(c&&c.key)):[]}catch{return[]}}function X(l){const p=l||localStorage.getItem("token")||"",c=la().map(g=>g.key.trim()).filter(g=>g.length>15).join(",");return{"Content-Type":"application/json",...p?{Authorization:`Bearer ${p}`}:{},...c?{"x-gemini-api-keys":c}:{}}}async function ke(l){const p=await l.text();try{return JSON.parse(p)}catch{throw l.status===401||p.trim()==="Unauthorized"?new Error("Tu sesión está actualizándose. Intenta nuevamente en un segundo."):new Error(p.slice(0,180)||`Error del servidor (${l.status})`)}}function Nr(l){const p=Math.max(1,Math.round(l||0)),c=Math.floor(p/60),g=p%60;return`${c}m ${g}s`}function Cr(l){try{return new Date(l).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return""}}function ii({portable:l=!1}={}){var Ja;const{user:p,token:c,isAuthenticated:g}=lr(),{data:z}=dr(),P=Js(),h=(P==null?void 0:P.navVisible)??!0,U=(P==null?void 0:P.setNavVisible)??(()=>{}),[oe,O]=or(),E=oe.get("tab")||"tts",[N,ae]=i.useState(["tts","video","lab","library"].includes(E)?E:"tts"),[F,ge]=i.useState(()=>{var t,a;return((a=(t=p==null?void 0:p.personalization)==null?void 0:t.geminiModels)==null?void 0:a.sstManagement)||(fr.GOOGLE_MODELS||"gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite").split(",")[0].trim()||"gemini-3.8-flash"}),[j,v]=i.useState(!1),[G,J]=i.useState("keys"),[se,q]=i.useState(()=>Object.values(Lt)),[C,le]=i.useState(()=>yr),[A,he]=i.useState(()=>vr),[Z,ye]=i.useState(()=>wr),[x,f]=i.useState("gemini-3.8-flash-tts"),[b,T]=i.useState("Kore"),[V,K]=i.useState("Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido."),[W,je]=i.useState(!1),[Se,ca]=i.useState("Puck"),[Ne,pa]=i.useState("Kore"),[Ce,ua]=i.useState(150),[M,He]=i.useState(pt[0].text),[Vt,us]=i.useState("Voz expresiva, tono conversacional y alegre."),[Te,xs]=i.useState("Hola. Hoy quiero demostrarte cómo suena una respiración natural <breath> y cómo reacciono con una pequeña risa <laugh> cuando algo resulta verdaderamente sorprendente."),[xa,ma]=i.useState(!1),[ms,ba]=i.useState(null),[$t,bs]=i.useState(0),[gs,hs]=i.useState(0),[mt,bt]=i.useState(.5),[Qe,gt]=i.useState(1),[_t,ga]=i.useState(!1),[ha,fa]=i.useState(!1),[fs,ya]=i.useState(null),[Q,be]=i.useState(null),et=i.useRef(null),[ht,ys]=i.useState("all"),[ft,va]=i.useState("only_active"),[Bt,vs]=i.useState(""),[Ut,ws]=i.useState(!0),[m,re]=i.useState(null),[Le,Ge]=i.useState(()=>{try{const t=localStorage.getItem(ra);return t?JSON.parse(t):[]}catch{return[]}}),[$,Ft]=i.useState("9:16"),[tt,ks]=i.useState("golden-rules"),[De,wa]=i.useState("bottom"),[ka,ja]=i.useState(!1),[ee,Sa]=i.useState(null),[Na,Ca]=i.useState(""),[yt,js]=i.useState(!1),[Ve,Ta]=i.useState(null),[Ea,Aa]=i.useState(""),[ve,Pa]=i.useState(!0),[Ma,Ss]=i.useState("CÁPSULA INTERACTIVA WAPPY"),[vt,Ns]=i.useState("5 Reglas de Oro en Riesgo Eléctrico"),[La,Cs]=i.useState("Prevención inteligente y locución neural sincronizada"),[Ia,Ts]=i.useState("#14b8a6"),[za,Es]=i.useState("Crea una animación estilo Claude con tarjetas de cristal sobre las 5 reglas de oro de riesgo eléctrico, iconos luminosos y barras de progreso."),[wt,Oa]=i.useState(!1),[Wt,As]=i.useState(!1),[$e,qe]=i.useState(()=>os({aspectRatio:"9:16",hasBaseVideo:!1,badgeText:"ECOSISTEMA IA • SG-SST",headline:"5 Reglas de Oro en Riesgo Eléctrico",subheadline:"Prevención inteligente y locución neural sincronizada",accentColor:"#14b8a6",templateId:"golden-rules",scriptText:pt[0].text,durationSeconds:28})),[we,_e]=i.useState(!0),[Be,Ee]=i.useState(0),[_,at]=i.useState(20),[Ht,Ps]=i.useState(!1),[ie,kt]=i.useState(!1),[de,Gt]=i.useState(null),fe=i.useRef(""),[st,Ra]=i.useState(!1),[jt,St]=i.useState(!1),[Ke,S]=i.useState(null),[Ms,rt]=i.useState(!1),[Nt,Ct]=i.useState(()=>{const t=la();return[t[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},t[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},t[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}]}),[qt,Da]=i.useState(!1),[Va,it]=i.useState(""),Ae=i.useMemo(()=>Nt.filter(t=>t.key.trim().length>15).length,[Nt]);i.useEffect(()=>{const t=()=>{const r=la();Ct([r[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},r[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},r[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}])},a=r=>{r.key===zt&&t()};return window.addEventListener("wappy-keys-updated",t),window.addEventListener("storage",a),()=>{window.removeEventListener("wappy-keys-updated",t),window.removeEventListener("storage",a)}},[]);const Ls=async()=>{Da(!0),it("");try{const t=[...Nt];let a=0;for(let s=0;s<t.length;s++){const n=t[s].key.trim();if(!n){t[s]={...t[s],key:"",status:"unchecked"};continue}try{const o=await fetch("/api/studio/keys-validate",{method:"POST",headers:X(c),body:JSON.stringify({apiKey:n})}),d=await o.json().catch(()=>({}));o.ok&&d.valid?(t[s]={...t[s],key:n,status:"valid"},a++):t[s]={...t[s],key:n,status:"invalid"}}catch{t[s]={...t[s],key:n,status:"unchecked"}}}Ct(t);const r=t.filter(s=>s.key.trim().length>0);localStorage.setItem(zt,JSON.stringify(r)),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),it(r.length===0?"Claves personalizadas limpiadas. Se utilizarán las claves del servidor WAPPY.":`¡Guardadas ${r.length} clave(s) (${a} verificada(s) en vivo con Google Gemini)!`)}finally{Da(!1)}},L=i.useRef(null),pe=i.useRef(null),ue=i.useRef(null),$a=i.useRef(null),Is=i.useMemo(()=>Sr($e),[$e]);i.useEffect(()=>{const t=()=>{const a=!!document.fullscreenElement;Ps(a),setTimeout(()=>{var r,s;(s=(r=L.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},80),setTimeout(()=>{var r,s;(s=(r=L.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},300)};return document.addEventListener("fullscreenchange",t),()=>document.removeEventListener("fullscreenchange",t)},[]),i.useEffect(()=>{const t=a=>{const r=a.data||{};r.type==="STUDIO_ELEMENT_SELECTED"?Gt(r.payload||null):r.type==="STUDIO_HTML_UPDATED"&&typeof r.htmlCode=="string"&&(fe.current=r.htmlCode)};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[]),i.useEffect(()=>{const t=Le.slice(0,60);try{localStorage.setItem(ra,JSON.stringify(t))}catch{try{localStorage.setItem(ra,JSON.stringify(t.map(({audioBase64:a,...r})=>r)))}catch{}}},[Le]),i.useEffect(()=>{const t=Le.filter(a=>a.audioBase64&&!a.mediaKey);t.length!==0&&(async()=>{const a={};for(const r of t)try{const s=`audio-${r.id}`;await We(s,Mt(r.audioBase64)),a[r.id]=s}catch{}Object.keys(a).length!==0&&Ge(r=>r.map(s=>a[s.id]?{...s,mediaKey:a[s.id],audioBase64:void 0}:s))})()},[]);const Kt=i.useRef(null),_a=t=>{Kt.current&&URL.revokeObjectURL(Kt.current);const a=URL.createObjectURL(t);return Kt.current=a,a},Tt=async(t,a)=>{const r=`audio-${t.id}`;let s=null;try{if(a.base64)s=Mt(a.base64);else if(a.url){const o=await fetch(a.url,{headers:X(c)});o.ok&&(s=await o.blob())}s&&await We(r,s)}catch{s=null}const n=s?{...t,kind:t.kind||"audio",mediaKey:r,audioBase64:void 0}:{...t,kind:t.kind||"audio",audioBase64:a.base64};return Ge(o=>[n,...o.filter(d=>d.id!==t.id)]),s?r:void 0},Ba=async t=>{if(t.mediaKey){const a=await ct(t.mediaKey);if(a)return a}if(t.audioBase64)return Mt(t.audioBase64);if(t.downloadUrl)try{const a=await fetch(t.downloadUrl,{headers:X(c)});if(a.ok){const r=await a.blob(),s=`audio-${t.id}`;return We(s,r).then(()=>Ge(n=>n.map(o=>o.id===t.id?{...o,mediaKey:s}:o))).catch(()=>{}),r}}catch{}return null},Ua=async(t,a=!1)=>{const r=await Ba(t);return r?(re({url:_a(r),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey||`audio-${t.id}`}),t.durationSeconds&&t.durationSeconds>1&&at(t.durationSeconds),a&&Pe("video"),!0):(S({type:"error",text:"Este audio se generó antes de activar el guardado permanente y el servidor ya lo liberó (se reinició). Vuelve a generarlo: desde ahora todos los audios quedan guardados en tu navegador."}),!1)},Yt=(t,a)=>{const r=URL.createObjectURL(t),s=document.createElement("a");s.href=r,s.download=a,document.body.appendChild(s),s.click(),document.body.removeChild(s),setTimeout(()=>URL.revokeObjectURL(r),4e3)},zs=t=>{Ge(a=>{const r=a.filter(n=>n.id!==t.id);return[t.mediaKey,t.htmlKey,t.mp4Key,t.capsuleKey].filter(Boolean).forEach(n=>{r.some(d=>[d.mediaKey,d.htmlKey,d.mp4Key,d.capsuleKey].includes(n))||gr(n)}),r})};i.useEffect(()=>{var a;const t=(a=z==null?void 0:z[cr.google])==null?void 0:a.models;if(Array.isArray(t)&&t.length>0){const r=t.map(s=>(typeof s=="string"?s:(s==null?void 0:s.id)||(s==null?void 0:s.value)||"").replace("models/","").trim()).filter(s=>s&&s.includes("tts"));r.length>0&&q(s=>{const n=new Map(s.map(u=>[u.id,u])),o=Object.keys(Lt);return Array.from(new Set([...o,...r])).map(u=>Lt[u]||n.get(u)||{id:u,name:u,badge:"GOOGLE_MODELS",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:`Modelo TTS cargado desde GOOGLE_MODELS (${u}).`,supportsMultiSpeaker:!u.includes("lite"),supportsVocalBursts:!u.includes("2.5"),supportedVoices:Lt["gemini-3.8-flash-tts"].supportedVoices})})}},[z]),i.useEffect(()=>{fetch("/api/studio/catalog",{headers:X(c)}).then(t=>t.ok?t.json():null).then(t=>{t&&(Array.isArray(t.models)&&t.models.length>0&&q(t.models),Array.isArray(t.voices)&&t.voices.length>0&&le(t.voices),Array.isArray(t.presets)&&t.presets.length>0&&he(t.presets),Array.isArray(t.vocalBursts)&&t.vocalBursts.length>0&&ye(t.vocalBursts))}).catch(()=>{})},[c]),i.useEffect(()=>{const t=M.trim(),a=t?t.split(/\s+/).filter(Boolean).length:0;if(bs(a),hs(t.length),!t){bt(0),gt(0);return}const r=setTimeout(()=>{fetch("/api/studio/tts/estimate",{method:"POST",headers:X(c),body:JSON.stringify({text:t,maxWordsPerChunk:Ce})}).then(s=>s.ok?s.json():null).then(s=>{s&&typeof s.estimatedMinutes=="number"?bt(s.estimatedMinutes):bt(Math.round(a/145*10)/10),s&&typeof s.chunkCount=="number"?gt(s.chunkCount):gt(Math.max(1,Math.ceil(a/Ce)))}).catch(()=>{bt(Math.round(a/145*10)/10),gt(Math.max(1,Math.ceil(a/Ce)))})},250);return()=>clearTimeout(r)},[M,Ce,c]);const Pe=t=>{ae(t),O({tab:t})};i.useEffect(()=>{const t=a=>{const r=a.detail;["tts","video","lab","library"].includes(r)&&Pe(r)};return window.addEventListener("wappy-studio-switch-tab",t),()=>window.removeEventListener("wappy-studio-switch-tab",t)},[]);const R=i.useMemo(()=>se.find(t=>t.id===x)||se[0],[se,x]),Ye=t=>R!=null&&R.supportedVoices?R.supportedVoices.includes(t):!0,Os=i.useMemo(()=>C.filter(t=>{const a=Ye(t.id),r=ft==="all"||a,s=ht==="all"||t.gender===ht,n=Bt.trim().toLowerCase(),o=!n||t.name.toLowerCase().includes(n)||t.tone.toLowerCase().includes(n)||t.recommendedFor.toLowerCase().includes(n)||t.tag&&t.tag.toLowerCase().includes(n);return r&&s&&o}),[C,R,ft,ht,Bt]),Rs=async(t,a)=>{a==null||a.stopPropagation();try{ya(t);const r=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:X(c),body:JSON.stringify({voiceName:t,model:Ye(t)?x:"gemini-3.8-flash-tts",text:`Hola, soy ${t}. Esta es una muestra de voz neural en WAPPY Studio para tus cápsulas y cursos.`})}),s=await ke(r);if(!r.ok||!s.success)throw new Error(s.error||"No se pudo sintetizar la muestra.");re({base64:s.audioBase64,title:`Muestra de Voz: ${t}`,durationSeconds:s.durationSeconds,voiceName:t})}catch(r){S({type:"error",text:r.message||"Error en audición de voz."})}finally{ya(null)}},Ds=async()=>{try{fa(!0),S(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:X(c),body:JSON.stringify({voiceName:b,model:x,text:"¡Conexión verificada con éxito! El motor de voz Gemini 3.8 Flash TTS en WAPPY Studio está listo."})}),a=await ke(t);if(!t.ok||!a.success)throw new Error(a.error||"Error probando conexión.");re({base64:a.audioBase64,title:`Prueba de Conexión (${b})`,durationSeconds:a.durationSeconds,voiceName:b}),S({type:"success",text:`¡Conexión activa con ${a.usedModel||x}! Audio sintetizado correctamente.`})}catch(t){S({type:"error",text:t.message||"Error de conexión con Gemini TTS."})}finally{fa(!1)}},Vs=async()=>{if(!M.trim())return;const t=M.trim().slice(0,850),a=t.split(/\s+/).filter(Boolean).length,r=Math.max(3,Math.round(a/145*60)),s=`preview_${Date.now()}`;try{ga(!0),S(null),be({id:s,status:"processing",totalChunks:1,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:r,generatedTotalSeconds:0,progressPercent:0,chunks:[{index:0,wordCount:a,status:"processing"}]});const n=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:X(c),body:JSON.stringify({text:t,voiceName:b,stylePrompt:V,model:x,multiSpeaker:W,speaker1:{name:"Alex",voiceName:Se},speaker2:{name:"Sam",voiceName:Ne}})}),o=await ke(n);if(!n.ok||!o.success)throw new Error(o.error||"Error al sintetizar vista previa.");const d=`data:audio/wav;base64,${o.audioBase64}`;be({id:s,status:"completed",totalChunks:1,currentChunkIndex:0,completedChunks:1,estimatedTotalSeconds:r,generatedTotalSeconds:o.durationSeconds||r,progressPercent:100,downloadUrl:d,chunks:[{index:0,wordCount:a,status:"completed",durationSeconds:o.durationSeconds,audioBase64:o.audioBase64}]}),re({base64:o.audioBase64,title:`Audio Completo: ${t.slice(0,42)}...`,durationSeconds:o.durationSeconds,voiceName:W?`${Se} + ${Ne}`:b,scriptText:t});const u={id:Date.now().toString(),title:`Vista Previa: ${t.slice(0,42)}...`,createdAt:Date.now(),voiceName:W?`${Se} + ${Ne}`:b,model:o.usedModel||x,durationSeconds:o.durationSeconds,wordCount:a,stylePrompt:V,scriptText:t},k=await Tt(u,{base64:o.audioBase64});k&&re(D=>D&&{...D,mediaKey:k}),S({type:"success",text:"Audio generado y cargado en el reproductor. Puedes descargarlo en WAV o enviarlo al Compositor de Video."})}catch(n){be(o=>o?{...o,status:"failed",error:n.message||"Error sintetizando fragmento."}:null),S({type:"error",text:n.message||"Error sintetizando fragmento."})}finally{ga(!1)}},$s=async()=>{if(Te.trim())try{ma(!0),S(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:X(c),body:JSON.stringify({text:Te.trim(),voiceName:b,stylePrompt:Vt,model:x})}),a=await ke(t);if(!t.ok||!a.success)throw new Error(a.error||"Error al sintetizar en el laboratorio.");re({base64:a.audioBase64,title:`Laboratorio (${b}): ${Te.trim().slice(0,34)}...`,durationSeconds:a.durationSeconds,voiceName:b,scriptText:Te.trim()});const r={id:Date.now().toString(),title:`Laboratorio: ${Te.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:b,model:a.usedModel||x,durationSeconds:a.durationSeconds,wordCount:Te.trim().split(/\s+/).filter(Boolean).length,stylePrompt:Vt,scriptText:Te.trim()},s=await Tt(r,{base64:a.audioBase64});s&&re(n=>n&&{...n,mediaKey:s})}catch(t){S({type:"error",text:t.message||"Error sintetizando prueba en el laboratorio."})}finally{ma(!1)}},_s=async()=>{if(M.trim())try{S(null),et.current&&et.current.close();const t=await fetch("/api/studio/tts/jobs",{method:"POST",headers:X(c),body:JSON.stringify({text:M,voiceName:b,stylePrompt:V,model:x,multiSpeaker:W,speaker1:{name:"Alex",voiceName:Se},speaker2:{name:"Sam",voiceName:Ne},maxWordsPerChunk:Ce})}),a=await ke(t);if(!t.ok)throw new Error(a.error||"No se pudo iniciar el trabajo de larga duración.");const r={id:a.jobId,status:"processing",totalChunks:a.totalChunks,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:a.estimatedTotalSeconds,generatedTotalSeconds:0,progressPercent:0,chunks:Array.from({length:a.totalChunks},(o,d)=>({index:d,wordCount:0,status:"pending"}))};be(r);const s=new EventSource(`/api/studio/tts/jobs/${a.jobId}/stream${c?`?token=${encodeURIComponent(c)}`:""}`);et.current=s,s.addEventListener("snapshot",o=>{const d=JSON.parse(o.data);be(u=>u?{...u,...d}:d)}),s.addEventListener("chunk_start",o=>{const d=JSON.parse(o.data);be(u=>{if(!u)return null;const k=[...u.chunks];return k[d.chunkIndex]&&(k[d.chunkIndex]={...k[d.chunkIndex],status:"processing"}),{...u,currentChunkIndex:d.chunkIndex,chunks:k}})}),s.addEventListener("chunk_complete",o=>{const d=JSON.parse(o.data);be(u=>{if(!u)return null;const k=[...u.chunks];k[d.chunkIndex]&&(k[d.chunkIndex]={...k[d.chunkIndex],status:"completed",durationSeconds:d.durationSeconds,audioBase64:d.audioBase64});const D=k.filter(H=>H.status==="completed").length;return{...u,completedChunks:D,progressPercent:d.progressPercent,generatedTotalSeconds:d.generatedTotalSeconds,chunks:k}})}),s.addEventListener("job_completed",o=>{const d=JSON.parse(o.data);s.close(),be(k=>k?{...k,status:"completed",progressPercent:100,downloadUrl:d.downloadUrl}:null),re({url:d.downloadUrl,title:`Audio Completo: ${M.trim().slice(0,35)}...`,durationSeconds:d.totalDurationSeconds,voiceName:b,scriptText:M});const u={id:d.id,title:`Audio Completo: ${M.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:b,model:x,durationSeconds:d.totalDurationSeconds,wordCount:$t,downloadUrl:d.downloadUrl,stylePrompt:V,scriptText:M};Tt(u,{url:d.downloadUrl}).then(k=>{k&&re(D=>D&&{...D,mediaKey:k})})}),s.addEventListener("job_failed",o=>{const d=JSON.parse(o.data);s.close(),be(u=>u?{...u,status:"failed",error:d.error}:null)}),s.addEventListener("job_status",o=>{const d=JSON.parse(o.data);be(u=>u?{...u,status:d.status}:null)});const n=o=>{try{const d=JSON.parse(o.data);be(u=>u?{...u,failoverNotice:d.message||(d.label?`Salto automático a ${d.label} (${d.reason||"429"})`:"Cuota 429 detectada en la clave anterior. Rotación automática a clave de respaldo activada.")}:null)}catch{}};s.addEventListener("key_failover",n),s.addEventListener("api_key_failover",n)}catch(t){S({type:"error",text:t.message||"Error iniciando trabajo."})}},Bs=async()=>{try{v(!0),S(null);const t=await fetch("/api/studio/script/enhance",{method:"POST",headers:X(c),body:JSON.stringify({scriptText:M,stylePrompt:V,multiSpeaker:W,modelName:F})}),a=await ke(t);if(!t.ok||!a.success||!a.scriptText)throw new Error(a.error||"No se pudo mejorar el guion con IA.");He(a.scriptText),S({type:"success",text:`¡Guion enriquecido con expresiones vocales (<breath>, <laugh>) usando ${a.usedModel||F}!`})}catch(t){S({type:"error",text:t.message||"Error mejorando el guion con IA."})}finally{v(!1)}},Jt=async t=>{Q&&(t==="cancel"&&et.current&&et.current.close(),await fetch(`/api/studio/tts/jobs/${Q.id}/control`,{method:"POST",headers:X(c),body:JSON.stringify({action:t})}),be(a=>a?{...a,status:t==="pause"?"paused":t==="resume"?"processing":"cancelled"}:null))},Zt=t=>{const a=document.getElementById("wappy-studio-tts-editor");if(!a){He(o=>`${o} ${t}`);return}const r=a.selectionStart,s=a.selectionEnd,n=M.substring(0,r)+t+M.substring(s);He(n),setTimeout(()=>{a.focus(),a.setSelectionRange(r+t.length,r+t.length)},15)},Ue=(t=$,a=!!ee,r=tt,s,n)=>{qe(os({aspectRatio:t,hasBaseVideo:a,badgeText:Ma,headline:vt,subheadline:La,accentColor:Ia,templateId:r,scriptText:s??((m==null?void 0:m.scriptText)||M),durationSeconds:Math.max(5,Math.round(n??((m==null?void 0:m.durationSeconds)||_||28)))}))},Us=async()=>{const t=(M||vt||"").trim().slice(0,750);if(t)try{ja(!0),S(null);const a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:X(c),body:JSON.stringify({text:t,voiceName:b,stylePrompt:V,model:x,multiSpeaker:W,speaker1:{name:"Alex",voiceName:Se},speaker2:{name:"Sam",voiceName:Ne}})}),r=await ke(a);if(!a.ok||!r.success)throw new Error(r.error||"No se pudo sintetizar la voz para el video.");re({base64:r.audioBase64,title:`Locución de Video (${b})`,durationSeconds:r.durationSeconds,voiceName:b,scriptText:t}),Tt({id:`vo-${Date.now()}`,title:`Locución de Video: ${t.slice(0,40)}...`,createdAt:Date.now(),voiceName:b,model:r.usedModel||x,durationSeconds:r.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,stylePrompt:V,scriptText:t},{base64:r.audioBase64}).then(s=>{s&&re(n=>n&&{...n,mediaKey:s})}),r.durationSeconds&&r.durationSeconds>1&&at(r.durationSeconds),$e.includes('data-wappy-template="true"')&&Ue($,!!ee,tt,t,r.durationSeconds),Ee(0),_e(!0),setTimeout(()=>{var s,n,o,d;(n=(s=L.current)==null?void 0:s.contentWindow)==null||n.postMessage({type:"STUDIO_RESTART"},"*"),(o=ue.current)==null||o.play().catch(()=>{}),(d=pe.current)==null||d.play().catch(()=>{})},120),S({type:"success",text:`¡Locución neural (${b} • ${r.durationSeconds}s) sincronizada frase a frase con las escenas del video!`})}catch(a){S({type:"error",text:a.message||"Error sincronizando voz con el video."})}finally{ja(!1)}},Fs=async()=>{try{Oa(!0),S(null);const t=await fetch("/api/studio/video/generate-html",{method:"POST",headers:X(c),body:JSON.stringify({prompt:za,scriptText:M,aspectRatio:$,hasBaseVideo:!!ee,showSubtitles:ve,durationSeconds:Math.round((m==null?void 0:m.durationSeconds)||_||25),companyName:(p==null?void 0:p.name)||"WAPPY IA",modelName:F})}),a=await ke(t);if(!t.ok||!a.success)throw new Error(a.error||"Error generando composición HTML con IA.");qe(a.htmlCode),S({type:"success",text:"¡Escena HTML + GSAP generada con éxito! Reproduciendo en el lienzo interactivo."})}catch(t){S({type:"error",text:t.message||"No se pudo generar la escena HTML con IA."})}finally{Oa(!1)}},Ws=t=>{var s;const a=(s=t.target.files)==null?void 0:s[0];if(!a)return;ee&&URL.revokeObjectURL(ee);const r=URL.createObjectURL(a);Sa(r),Ca(a.name),Ue($,!0)},Hs=t=>{var s;const a=(s=t.target.files)==null?void 0:s[0];if(!a)return;Ve&&URL.revokeObjectURL(Ve);const r=URL.createObjectURL(a);Ta(r),Aa(a.name)},xe=i.useMemo(()=>Ve||(m!=null&&m.url?m.url:m!=null&&m.base64?`data:audio/wav;base64,${m.base64}`:""),[Ve,m]);i.useEffect(()=>{if(N!=="video"||!we||ie)return;let t=performance.now();const a=setInterval(()=>{var d,u,k,D;const r=performance.now(),s=(r-t)/1e3;t=r;const n=ue.current,o=pe.current;if(n&&xe&&!n.paused&&!n.ended){const H=n.currentTime,B=n.duration&&!isNaN(n.duration)&&n.duration>1?n.duration:Math.max(1,_||20);Ee(H),(u=(d=L.current)==null?void 0:d.contentWindow)==null||u.postMessage({type:"STUDIO_SYNC_TIME",currentTime:H,duration:B,playing:!0},"*");return}if(o&&ee&&!o.paused&&!o.ended){const H=o.currentTime,B=o.duration&&!isNaN(o.duration)&&o.duration>1?o.duration:Math.max(1,_||20);Ee(H),(D=(k=L.current)==null?void 0:k.contentWindow)==null||D.postMessage({type:"STUDIO_SYNC_TIME",currentTime:H,duration:B,playing:!0},"*");return}Ee(H=>{var me,w,Y,ne;const B=Math.max(1,_||20),ce=H+s;return ce>=B?(_e(!1),(w=(me=L.current)==null?void 0:me.contentWindow)==null||w.postMessage({type:"STUDIO_PAUSE"},"*"),B):((ne=(Y=L.current)==null?void 0:Y.contentWindow)==null||ne.postMessage({type:"STUDIO_SYNC_TIME",currentTime:ce,duration:B,playing:!0},"*"),ce)})},120);return()=>clearInterval(a)},[N,we,ie,_,xe,ee]);const Fa=()=>{var s,n,o,d,u;const t=Math.max(1,_||20);if(!we&&(Be>=t-.3||!!((s=ue.current)!=null&&s.ended))){Xt();return}const r=!we;r&&ie&&(kt(!1),(o=(n=L.current)==null?void 0:n.contentWindow)==null||o.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),_e(r),(u=(d=L.current)==null?void 0:d.contentWindow)==null||u.postMessage({type:r?"STUDIO_PLAY":"STUDIO_PAUSE"},"*"),pe.current&&(r?pe.current.play().catch(()=>{}):pe.current.pause()),ue.current&&xe&&(r?ue.current.play().catch(()=>{}):ue.current.pause())},Xt=()=>{var t,a,r,s;ie&&(kt(!1),(a=(t=L.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),Ee(0),_e(!0),(s=(r=L.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_RESTART"},"*"),pe.current&&(pe.current.currentTime=0,pe.current.play().catch(()=>{})),ue.current&&xe&&(ue.current.currentTime=0,ue.current.play().catch(()=>{}))},Wa=t=>{var r,s;Ee(t);const a=_>0?t/_:0;(s=(r=L.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_SEEK",progress:a,time:t},"*"),pe.current&&(pe.current.currentTime=t),ue.current&&xe&&(ue.current.currentTime=t)},Ha=()=>{var a,r,s,n;const t=!ie;kt(t),t?(_e(!1),(a=pe.current)==null||a.pause(),(r=ue.current)==null||r.pause()):fe.current&&(qe(fe.current),fe.current=""),(n=(s=L.current)==null?void 0:s.contentWindow)==null||n.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:t},"*")},Ie=t=>{var a,r;Gt(s=>s&&{...s,...t}),(r=(a=L.current)==null?void 0:a.contentWindow)==null||r.postMessage({type:"STUDIO_UPDATE_SELECTED",updates:t},"*")},Gs=()=>{var t,a;fe.current&&(qe(fe.current),fe.current=""),kt(!1),Gt(null),(a=(t=L.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*"),S({type:"success",text:"¡Cambios de textos y posición de cajas guardados en la composición HTML!"})},Ga=()=>{var t,a,r;document.fullscreenElement?(t=document.exitFullscreen)==null||t.call(document).catch(()=>{}):(r=(a=$a.current)==null?void 0:a.requestFullscreen)==null||r.call(a).catch(()=>{})},nt=i.useMemo(()=>{const t=(m==null?void 0:m.scriptText)||M||"";return ps(t,Math.max(4,_||25))},[m==null?void 0:m.scriptText,M,_]),ze=i.useMemo(()=>nt.wordTimings.map(t=>t.word),[nt]),Qt=i.useMemo(()=>{if(!ve||ze.length===0)return null;const t=Math.max(0,Math.min(.9999,Be/Math.max(1,_))),a=nt.wordTimings;let r=-1;for(let d=0;d<a.length;d++)if(t>=a[d].startPct&&t<=a[d].endPct){r=d;break}r===-1&&(r=Math.min(ze.length-1,Math.floor(t*ze.length)));const s=5,n=Math.floor(r/s)*s;return{words:ze.slice(n,n+s),activeOffset:r-n}},[ve,ze,nt,Be,_]),ea=async()=>{if(m!=null&&m.base64)return m.base64;if(!xe)return null;try{const t=await fetch(xe);if(!t.ok)return null;const a=await t.arrayBuffer(),r=new Uint8Array(a);let s="";const n=32768;for(let o=0;o<r.length;o+=n)s+=String.fromCharCode.apply(null,Array.from(r.subarray(o,o+n)));return window.btoa(s)}catch{return null}},qa=async()=>{try{Ra(!0);const t=Math.min(60,Math.max(4,Math.round(_||15))),a=t>20?12:15;S({type:"info",text:`Renderizando Video MP4 con Audio + Animación + Subtítulos (${t}s)... Espera ~15-25 segundos mientras se ensambla el archivo .MP4 para WhatsApp y Celular.`});const r=fe.current||$e,s=await ea(),n=await fetch("/api/studio/video/render-mp4",{method:"POST",headers:X(c),body:JSON.stringify({htmlCode:r,audioBase64:s,scriptText:(m==null?void 0:m.scriptText)||M,showSubtitles:ve,subtitlePosition:De,aspectRatio:$,durationSeconds:t,fps:a})}),o=await ke(n);if(!n.ok||!o.success||!o.videoBase64)throw new Error(o.error||"No se pudo renderizar el archivo MP4 en el servidor.");const d=window.atob(o.videoBase64),u=new Array(d.length);for(let ce=0;ce<d.length;ce++)u[ce]=d.charCodeAt(ce);const k=new Uint8Array(u),D=new Blob([k],{type:"video/mp4"});ta({mp4Blob:D});const H=URL.createObjectURL(D),B=document.createElement("a");B.href=H,B.download=`wappy-studio-reel-${Date.now()}.mp4`,document.body.appendChild(B),B.click(),document.body.removeChild(B),URL.revokeObjectURL(H),S({type:"success",text:`¡Video MP4 Universal (${o.width}x${o.height} • H.264 + Audio AAC) descargado con éxito! Listo para enviar por WhatsApp, ver en celular o subir a Reels/TikTok.`})}catch(t){S({type:"error",text:t.message||"Error renderizando MP4 en el servidor."})}finally{Ra(!1)}},qs=async t=>{var me;let a=t.replace(/subtitles\.reverse\(\)/g,"subtitles.slice().reverse()");const r=w=>w.replace(/<\/script/gi,"<\\/script"),s=async w=>{try{const Y=await fetch(w,{cache:"force-cache"});return Y.ok?await Y.text():""}catch{return""}},n=async w=>{try{const Y=await fetch(w,{cache:"force-cache"});if(!Y.ok)return"";const ne=await Y.arrayBuffer(),Ze=new Uint8Array(ne);let Za="";const Xa=32768;for(let Et=0;Et<Ze.length;Et+=Xa)Za+=String.fromCharCode.apply(null,Array.from(Ze.subarray(Et,Et+Xa)));return`data:image/png;base64,${window.btoa(Za)}`}catch{return""}};let o="";try{const w=(me=L.current)==null?void 0:me.contentDocument;w&&Array.from(w.querySelectorAll("style")).forEach(Y=>{if((Y.id||"").startsWith("wappy-studio-bridge"))return;const Ze=Y.textContent||"";Ze&&!a.includes(Ze.slice(0,120))&&(o+=`
${Ze}`)})}catch{o=""}const[d,u,k,D,H]=await Promise.all([/gsap(\.min)?\.js/i.test(a)?s("/assets/gsap.min.js"):Promise.resolve(""),/cdn\.tailwindcss\.com|tailwind-cdn\.js/i.test(a)?s("/assets/tailwind-cdn.js"):Promise.resolve(""),/tenshi\.png/i.test(a)?n("/assets/wappy/tenshi.png"):Promise.resolve(""),/felix_avatar_3d\.png/i.test(a)?n("/assets/wappy/felix_avatar_3d.png"):Promise.resolve(""),/wappy-cat-logo\.png/i.test(a)?n("/assets/wappy/wappy-cat-logo.png"):Promise.resolve("")]);k&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?tenshi\.png(["')])/gi,(w,Y,ne)=>`${Y}${k}${ne}`)),D&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?felix_avatar_3d\.png(["')])/gi,(w,Y,ne)=>`${Y}${D}${ne}`)),H&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?wappy-cat-logo\.png(["')])/gi,(w,Y,ne)=>`${Y}${H}${ne}`)),d&&(a=a.replace(/<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-gsap">${r(d)}<\/script>`)),a=a.replace(/<script[^>]*src=["'][^"']*(cdn\.tailwindcss\.com|tailwind-cdn\.js)[^"']*["'][^>]*>\s*<\/script>/gi,()=>"<script>window.tailwind = window.tailwind || {};<\/script>"+(u?`<script id="wappy-inline-tailwind">${r(u)}<\/script>`:""));const B=`
<meta name="color-scheme" content="dark" />
<meta name="format-detection" content="telephone=no" />
<style id="wappy-precompiled-tailwind">${o.replace(/<\/style/gi,"<\\/style")}</style>
<style id="wappy-offline-font-fallback">
  html, body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
</style>
<noscript><style>
  #header-hud, #top-bar, #scene-1, #scene-1 *, #hero-card, .metric-item { opacity: 1 !important; transform: none !important; visibility: visible !important; }
  #wappy-capsule-controls, #wappy-mobile-tap-overlay { display: none !important; }
</style></noscript>`;/<head[^>]*>/i.test(a)?a=a.replace(/<head[^>]*>/i,w=>`${w}${B}`):a=`${B}
${a}`,/<meta[^>]+name=["']viewport/i.test(a)||(a=a.replace(/<head[^>]*>/i,w=>`${w}<meta name="viewport" content="width=device-width, initial-scale=1.0" />`));const ce=`<script id="wappy-visibility-guard">
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
<\/script>`;return a=a.includes("</body>")?a.replace("</body>",()=>`${ce}
</body>`):`${a}
${ce}`,a},Ka=async()=>{const t=await qs(fe.current||$e),a=await ea(),r=a?`data:audio/wav;base64,${a}`:"",s=Math.max(4,Math.round((_||20)*10)/10),n=`
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
    ${De==="top"?"top: 54px;":De==="center"?"top: 50%; transform: translateY(-50%);":"bottom: 58px;"}
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
<div id="wappy-capsule-subtitles" style="display:${ve&&ze.length>0?"flex":"none"};">
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
  var words = ${JSON.stringify(ze)};
  var wordTimings = ${JSON.stringify(nt.wordTimings)};
  var showSubs = ${!!(ve&&ze.length>0)};
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
    var p = Math.max(0, Math.min(0.9999, t / Math.max(1, duration)));
    var activeIdx = -1;
    for (var k = 0; k < wordTimings.length; k++) {
      if (p >= wordTimings[k].startPct && p <= wordTimings[k].endPct) {
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
${n}`},ot=i.useRef(null),ta=async(t={},a=!0)=>{var r;try{const s=fe.current||$e,n=(m==null?void 0:m.mediaKey)||xe||"sin-audio",o=`${s.length}:${s.slice(-200)}:${n}:${$}`,u=((r=ot.current)==null?void 0:r.signature)===o&&Le.some(me=>{var w;return me.id===((w=ot.current)==null?void 0:w.id)})?ot.current.id:`video-${Date.now()}`,k=`html-${u}`;await We(k,new Blob([s],{type:"text/html"}));let D=m==null?void 0:m.mediaKey;if(!D&&xe){const me=await ea();me&&(D=`audio-${u}`,await We(D,Mt(me)))}let H;t.mp4Blob&&(H=`mp4-${u}`,await We(H,t.mp4Blob));let B;t.capsuleHtml&&(B=`capsule-${u}`,await We(B,new Blob([t.capsuleHtml],{type:"text/html"})));const ce=((m==null?void 0:m.scriptText)||M||vt||"").replace(/<[^>]+>/g,"").trim();Ge(me=>{const w=me.find(ne=>ne.id===u);return[{...w||{},id:u,kind:"video",title:(w==null?void 0:w.title)||`Video ${$}: ${ce.slice(0,40)}...`,createdAt:(w==null?void 0:w.createdAt)||Date.now(),voiceName:(m==null?void 0:m.voiceName)||b,model:F,durationSeconds:Math.round((_||0)*10)/10,wordCount:ce.split(/\s+/).filter(Boolean).length,scriptText:(m==null?void 0:m.scriptText)||M,htmlKey:k,mediaKey:D||(w==null?void 0:w.mediaKey),mp4Key:H||(w==null?void 0:w.mp4Key),capsuleKey:B||(w==null?void 0:w.capsuleKey),aspectRatio:$,showSubtitles:ve,subtitlePosition:De},...me.filter(ne=>ne.id!==u)]}),ot.current={id:u,signature:o},a||S({type:"success",text:"¡Video guardado en la Biblioteca! Puedes reabrirlo, editarlo o descargarlo cuando quieras."})}catch(s){S({type:"error",text:`No se pudo guardar el video en la Biblioteca: ${(s==null?void 0:s.message)||"error de almacenamiento"}`})}},Ks=async t=>{const a=t.htmlKey?await ct(t.htmlKey):null;if(!a){S({type:"error",text:"No se encontró la composición HTML de este video."});return}const r=await a.text();t.aspectRatio&&Ft(t.aspectRatio),typeof t.showSubtitles=="boolean"&&Pa(t.showSubtitles),t.subtitlePosition&&wa(t.subtitlePosition),fe.current="",qe(r);const s=t.mediaKey?await ct(t.mediaKey):null;s&&re({url:_a(s),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey}),t.durationSeconds&&t.durationSeconds>1&&at(t.durationSeconds),Ee(0),_e(!1),ot.current=null,Pe("video")},Ya=async()=>{var t,a;try{St(!0);const r=await Ka();ta({capsuleHtml:r});const s=`wappy-academia-capsula-${Date.now()}.html`,n=new Blob([r],{type:"text/html;charset=utf-8"});if(typeof window<"u"&&((t=window.matchMedia)==null?void 0:t.call(window,"(pointer: coarse)").matches)&&typeof navigator.share=="function")try{const k=new File([n],s,{type:"text/html"});if((a=navigator.canShare)!=null&&a.call(navigator,{files:[k]})){await navigator.share({files:[k],title:"Cápsula WAPPY",text:"Cápsula interactiva WAPPY (ábrela tocando el archivo)."}),S({type:"success",text:"¡Cápsula HTML compartida! Funciona sin internet al tocarla en WhatsApp."});return}}catch(k){if((k==null?void 0:k.name)==="AbortError")return}const d=URL.createObjectURL(n),u=document.createElement("a");u.href=d,u.download=s,document.body.appendChild(u),u.click(),document.body.removeChild(u),URL.revokeObjectURL(d),S({type:"success",text:"¡Cápsula HTML autocontenida descargada! Incluye estilos, animación y voz en un solo archivo: envíala por WhatsApp y ábrela tocándola, incluso sin internet."})}finally{St(!1)}},Ys=async()=>{try{St(!0);const r=`<iframe srcdoc="${(await Ka()).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" style="width:100%;max-width:${$==="9:16"?"400px":"860px"};aspect-ratio:${$==="9:16"?"9/16":"16/9"};border:0;border-radius:16px;overflow:hidden;display:block;margin:0 auto;box-shadow:0 20px 50px rgba(0,0,0,0.35);" allow="autoplay; fullscreen"></iframe>`;await navigator.clipboard.writeText(r),S({type:"success",text:"¡Código <iframe srcdoc> copiado al portapapeles! Pégalo directamente en cualquier lección de la Academia WAPPY (LMS)."})}catch{S({type:"error",text:"No se pudo copiar el código embebido al portapapeles."})}finally{St(!1)}},Je=((Ja=R==null?void 0:R.supportedVoices)==null?void 0:Ja.length)||14;return!l&&p&&p.role!=="ADMIN"?e.jsx("div",{className:"flex-1 flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen p-6",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md",children:[e.jsx("div",{className:"w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto",children:e.jsx(Qa,{className:"w-6 h-6"})}),e.jsx("h2",{className:"text-lg font-extrabold text-slate-900 dark:text-white",children:"WAPPY Studio (Acceso Administrador)"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Por el momento este módulo está habilitado exclusivamente para cuentas de Administración de WAPPY."}),e.jsx("a",{href:"/c/new",className:"inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition",children:"Volver al inicio"})]})}):e.jsxs("div",{className:y("flex-1 flex flex-col",l?"bg-transparent h-auto overflow-visible pb-6":"bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-[100dvh] h-auto overflow-y-auto pb-16"),children:[e.jsx("header",{className:y("bg-white dark:bg-slate-900/95 px-4 sm:px-6 py-4 shadow-2xs z-30",l?"relative rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-7xl w-full mx-auto":"sticky top-0 border-b border-slate-200/90 dark:border-slate-800"),children:e.jsxs("div",{className:"max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[g&&!h&&e.jsx("div",{className:"hidden md:block",children:e.jsx(pr,{setNavVisible:U})}),e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2 mb-1",children:e.jsxs("span",{className:"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wider",children:[e.jsx(Oe,{className:"w-3 h-3 text-teal-500"}),"Estudio Multimodal • Gemini 3.8 Flash TTS & HyperFrames"]})}),e.jsxs("h1",{className:"text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400",children:[e.jsx(Qa,{className:"w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0"}),"WAPPY Studio"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300 mt-0.5 hidden sm:block",children:"Síntesis de voz neural de hasta 1 hora continua y creación de videos animados en HTML/GSAP con capas sobre tus propios videos."})]})]}),e.jsxs("div",{className:"flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-nowrap",children:[e.jsxs("div",{className:"inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto no-scrollbar min-w-0",children:[e.jsxs("button",{type:"button",onClick:()=>Pe("tts"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",N==="tts"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(lt,{className:"w-3.5 h-3.5 text-teal-500"}),e.jsx("span",{children:"Estudio de Voz (TTS)"})]}),e.jsxs("button",{type:"button",onClick:()=>Pe("video"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",N==="video"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Re,{className:"w-3.5 h-3.5 text-purple-500"}),e.jsx("span",{children:"Video HTML & Capas"})]}),e.jsxs("button",{type:"button",onClick:()=>Pe("lab"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",N==="lab"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(aa,{className:"w-3.5 h-3.5 text-amber-500"}),e.jsx("span",{children:"Voces & Bursts"})]}),e.jsxs("button",{type:"button",onClick:()=>Pe("library"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",N==="library"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(sa,{className:"w-3.5 h-3.5 text-indigo-500"}),e.jsxs("span",{children:["Biblioteca (",Le.length,")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(ur,{selectedModel:F,onSelectModel:ge,disabled:wt}),e.jsx(I,{icon:e.jsx(At,{}),label:`Claves IA (${Ae})`,variant:"fuchsia",onClick:()=>{it(""),rt(!0)},title:"Configurar hasta 3 claves Google Gemini con rotación inteligente"}),e.jsx(I,{icon:ha?e.jsx(te,{className:"animate-spin"}):e.jsx(es,{}),label:"Probar Audio con IA",variant:"purple",disabled:ha,onClick:Ds}),!l&&e.jsx(I,{icon:e.jsx(Zs,{}),label:"Landing / App Portable",variant:"cyan",onClick:()=>window.open("/wappystudio.html","_blank","noopener,noreferrer"),title:"Abrir Landing Page Pública y Aplicativo Portable de WAPPY Studio"})]})]})]})}),e.jsxs("main",{className:"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6",children:[Ke&&e.jsxs("div",{className:y("p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200",Ke.type==="success"?"bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200":Ke.type==="error"?"bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200":"bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200"),children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[Ke.type==="success"?e.jsx(ia,{className:"w-4 h-4 text-emerald-500 shrink-0"}):Ke.type==="error"?e.jsx(xt,{className:"w-4 h-4 text-rose-500 shrink-0"}):e.jsx(te,{className:"w-4 h-4 text-sky-500 animate-spin shrink-0"}),e.jsx("span",{children:Ke.text})]}),e.jsx("button",{type:"button",onClick:()=>S(null),className:"p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10",children:e.jsx(It,{className:"w-3.5 h-3.5"})})]}),m&&e.jsx(Tr,{audioBase64:m.base64,audioUrl:m.url,title:m.title,durationSeconds:m.durationSeconds,voiceName:m.voiceName,onSendToVideo:()=>{Pe("video"),S({type:"success",text:"Audio vinculado automáticamente a la pista de locución del Compositor de Video."})}}),N==="tts"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[Q&&e.jsx(Er,{job:Q,onPause:()=>Jt("pause"),onResume:()=>Jt("resume"),onCancel:()=>Jt("cancel"),onPlayChunk:t=>{t.audioBase64&&re({base64:t.audioBase64,title:`Fragmento #${t.index+1} (${t.durationSeconds||0}s)`,durationSeconds:t.durationSeconds,voiceName:W?`${Se} + ${Ne}`:b})},onLoadMaster:()=>{Q.downloadUrl&&re({url:Q.downloadUrl,title:`Audio Completo: ${M.trim().slice(0,42)}...`,durationSeconds:Q.generatedTotalSeconds,voiceName:W?`${Se} + ${Ne}`:b,scriptText:M})}}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-indigo-500/10 dark:from-teal-950/40 dark:via-zinc-900/80 dark:to-indigo-950/40 border border-teal-500/25 dark:border-teal-500/20 rounded-2xl p-3 sm:p-3.5 shadow-2xs",children:[e.jsxs("div",{className:"flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0",children:"01"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300",children:"Motor & Voz Neural"}),e.jsxs("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:[R==null?void 0:R.name," •"," ",e.jsx("span",{className:"text-teal-600 dark:text-teal-400",children:W?`${Se} + ${Ne}`:b})]})]})]}),e.jsxs("div",{className:"flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0",children:"02"}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300",children:"Capas de ~1 Min & Bursts"}),e.jsxs("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:[$t," palabras • ~",mt," min (",Qe," ",Qe===1?"capa de ~1m":"capas de ~1m",")"]})]})]}),e.jsxs("button",{type:"button",onClick:()=>Pe("video"),className:"flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 hover:bg-purple-50/80 dark:hover:bg-purple-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 shadow-2xs transition cursor-pointer text-left group",children:[e.jsxs("div",{className:"flex items-center gap-3 min-w-0",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0",children:"03"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300",children:"WAV 24kHz & Video HTML/GSAP"}),e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:"Sintetiza audio o llévalo al Compositor →"})]})]}),e.jsx(Re,{className:"w-4 h-4 text-purple-500 shrink-0 group-hover:translate-x-0.5 transition-transform"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",children:[e.jsxs("div",{className:"lg:col-span-5 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-1.5",children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(ts,{className:"w-4 h-4 text-teal-500"}),"Modelo Oficial Gemini TTS"]}),e.jsx("span",{className:"text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full",children:"✓ GOOGLE_MODELS Activo"})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:se.map(t=>{const a=x===t.id;return e.jsxs("button",{type:"button",onClick:()=>{f(t.id),t.supportedVoices.includes(b)||T(t.supportedVoices[0]||"Kore")},className:y("text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-gradient-to-br from-teal-50/95 via-emerald-50/70 to-indigo-50/50 dark:from-teal-950/50 dark:via-emerald-950/30 dark:to-indigo-950/30 border-teal-500 ring-2 ring-teal-500/20 shadow-xs":"bg-white dark:bg-slate-900/70 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/60 dark:hover:bg-zinc-800/60"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1.5",children:[e.jsx("span",{className:y("text-[9px] font-extrabold px-2 py-0.5 rounded-md border",t.badgeColor),children:t.badge}),a&&e.jsx("span",{className:"w-2 h-2 rounded-full bg-teal-500 animate-ping shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white leading-snug mb-1",children:t.name}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 leading-snug",children:t.description})]}),e.jsxs("div",{className:"mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-amber-700 dark:text-amber-400 font-bold",children:t.rateLimitLabel||t.quotaLabel}),a?e.jsxs("span",{className:"text-teal-700 dark:text-teal-300 font-extrabold flex items-center gap-0.5",children:[e.jsx(ut,{className:"w-3 h-3"})," ",t.supportedVoices.length," voces"]}):e.jsxs("span",{className:"text-slate-500 dark:text-zinc-400 font-semibold",children:[t.supportedVoices.length," voces"]})]})]},t.id)})}),e.jsxs("div",{className:"px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"text-slate-700 dark:text-zinc-300 flex items-center gap-1.5",children:[e.jsx(Oe,{className:"w-3.5 h-3.5 text-teal-500 shrink-0"}),e.jsxs("span",{children:["Voces activas para"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white",children:R==null?void 0:R.name}),":"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsxs("span",{className:"font-extrabold text-emerald-700 dark:text-emerald-400",children:[Je," de ",C.length," disponibles"]}),Je<C.length&&e.jsx("button",{type:"button",onClick:()=>f("gemini-3.8-flash-tts"),className:"text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer",children:"Activar las 14 →"})]})]}),x==="gemini-2.5-flash-preview-tts"&&e.jsxs("div",{className:"p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(xt,{className:"w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("p",{className:"font-extrabold text-amber-900 dark:text-amber-200",children:"¿Por qué algunas voces aparecen desactivadas en Gemini 2.5 Flash TTS?"}),e.jsxs("p",{className:"text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed",children:[e.jsx("span",{className:"font-bold",children:"Gemini 2.5 Pro Preview TTS"})," no posee cuota activa en API (0 RPM / 0 RPD). Su reemplazo oficial funcional es"," ",e.jsx("span",{className:"font-bold",children:"Gemini 2.5 Flash TTS"}),", el cual habilita únicamente las"," ",e.jsx("span",{className:"font-bold",children:"5 voces fundamentales"})," (Kore, Puck, Charon, Fenrir y Aoede). Para usar las 14 voces y Vocal Bursts, cambia a"," ",e.jsx("span",{className:"font-bold",children:"Gemini 3.8 Flash TTS"}),"."]})]})]}),e.jsx("div",{className:"flex justify-end",children:e.jsx("button",{type:"button",onClick:()=>f("gemini-3.8-flash-tts"),className:"px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-900 dark:text-amber-200 font-extrabold text-[11px] transition cursor-pointer",children:"Cambiar a Gemini 3.8 Flash TTS (14 voces) →"})})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"block text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"Estilos y Plantillas Rápidas"}),e.jsx("span",{className:"text-[10px] text-slate-500 dark:text-zinc-400",children:"1 clic configura voz + emoción"})]}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:A.map(t=>{const a=V===t.style&&(t.multiSpeaker?W:!W&&b===t.voiceName),r=!t.multiSpeaker&&!Ye(t.voiceName);return e.jsxs("button",{type:"button",onClick:()=>{Ye(t.voiceName)||f("gemini-3.8-flash-tts"),t.multiSpeaker?(je(!0),t.speaker1&&ca(t.speaker1.voiceName),t.speaker2&&pa(t.speaker2.voiceName)):(je(!1),T(t.voiceName)),K(t.style)},className:y("text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition cursor-pointer inline-flex items-center gap-1.5",a?"bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 shadow-2xs font-bold":"border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 hover:border-teal-500/50 hover:bg-teal-500/10 text-slate-800 dark:text-zinc-200"),children:[e.jsx("span",{children:t.name}),r&&e.jsx("span",{className:"text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30",children:"Auto 3.8"})]},t.id)})})]}),e.jsxs("div",{className:"flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/95 rounded-xl border border-slate-200/90 dark:border-slate-800 gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx(Xs,{className:"w-4 h-4 text-teal-500 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"Modo Diálogo / Podcast (2 Voces)"}),e.jsxs("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:["Alterna interlocutores usando"," ",e.jsx("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:"Alex:"})," ","y"," ",e.jsx("span",{className:"font-mono font-bold text-purple-600 dark:text-purple-400",children:"Sam:"})]})]})]}),e.jsx("button",{type:"button",onClick:()=>je(!W),className:y("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",W?"bg-teal-600":"bg-slate-300 dark:bg-zinc-700"),children:e.jsx("span",{className:y("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",W?"translate-x-4":"translate-x-0")})})]}),W?e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200/90 dark:border-slate-800",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-teal-700 dark:text-teal-400 mb-1",children:"Voz para Alex (Hablante 1)"}),e.jsx("select",{value:Se,onChange:t=>ca(t.target.value),className:"w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500",children:((R==null?void 0:R.supportedVoices)||[]).map(t=>{const a=C.find(r=>r.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-purple-700 dark:text-purple-400 mb-1",children:"Voz para Sam (Hablante 2)"}),e.jsx("select",{value:Ne,onChange:t=>pa(t.target.value),className:"w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500",children:((R==null?void 0:R.supportedVoices)||[]).map(t=>{const a=C.find(r=>r.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(lt,{className:"w-3.5 h-3.5 text-teal-500"}),"Catálogo de Voces (",Je," activas / ",C.length," totales)"]}),e.jsx("p",{className:"text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5",children:"Haz clic en cualquier tarjeta para elegir la voz o en ▶ para escuchar su timbre real."})]}),e.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]",children:[e.jsxs("button",{type:"button",onClick:()=>va("only_active"),className:y("px-2 py-0.5 rounded-md transition cursor-pointer",ft==="only_active"?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:["Solo Activas (",Je,")"]}),e.jsxs("button",{type:"button",onClick:()=>va("all"),className:y("px-2 py-0.5 rounded-md transition cursor-pointer",ft==="all"?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:["Todas (",C.length,")"]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(Qs,{className:"w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"}),e.jsx("input",{type:"search",name:"wappy-voice-search",autoComplete:"off",value:Bt,onChange:t=>vs(t.target.value),placeholder:"Buscar voz (Kore, Orus, profunda, podcast...)",className:"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] shrink-0",children:["all","Femenino","Masculino"].map(t=>e.jsx("button",{type:"button",onClick:()=>ys(t),className:y("px-2.5 py-1 rounded-lg transition cursor-pointer",ht===t?"bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-bold shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:t==="all"?"Todas":t==="Femenino"?"♀ Femeninas":"♂ Masculinas"},t))})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1",children:Os.map(t=>{const a=b===t.id,r=fs===t.id,s=Ye(t.id);return e.jsxs("div",{onClick:()=>{s||f("gemini-3.8-flash-tts"),T(t.id)},className:y("p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-gradient-to-br from-teal-50/95 via-emerald-50/60 to-white dark:from-teal-950/50 dark:via-emerald-950/25 dark:to-zinc-900 border-teal-500 ring-2 ring-teal-500/20 shadow-xs":"bg-white dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/70 dark:hover:bg-zinc-800/60",!s&&"opacity-75 border-dashed"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:"text-sm font-extrabold text-slate-900 dark:text-white truncate",children:t.name}),t.tag&&e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 shrink-0",children:t.tag})]}),e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap mt-1",children:[e.jsx("span",{className:y("text-[9px] font-bold px-1.5 py-0.5 rounded",t.gender==="Femenino"?"bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20":"bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"),children:t.gender==="Femenino"?"♀ Femenina":"♂ Masculina"}),s?e.jsx("span",{className:"text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded",children:"✓ Activa"}):e.jsx("span",{className:"text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded",children:"Requiere 3.8/3.1"})]})]}),e.jsxs("button",{type:"button",onClick:n=>Rs(t.id,n),disabled:r,title:`Escuchar muestra de ${t.name}`,className:"px-2 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer flex items-center gap-1 text-[10px] font-extrabold",children:[r?e.jsx(te,{className:"w-3 h-3 animate-spin"}):e.jsx(Me,{className:"w-3 h-3 fill-current"}),e.jsx("span",{children:"Oír"})]})]}),e.jsx("p",{className:"text-[11px] text-teal-700 dark:text-teal-300 font-bold mt-2 leading-snug",children:t.tone})]}),e.jsxs("div",{className:"mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2",children:[e.jsx("p",{className:"text-[10px] text-slate-600 dark:text-zinc-400 line-clamp-1 leading-tight",children:t.recommendedFor}),!s&&e.jsx("button",{type:"button",onClick:n=>{n.stopPropagation(),f("gemini-3.8-flash-tts"),T(t.id)},className:"text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded shrink-0 cursor-pointer",children:"Usar con 3.8 →"})]})]},t.id)})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"Directiva de Estilo y Emoción"}),e.jsx("span",{className:"text-[10px] font-mono text-slate-500 dark:text-zinc-400",children:"speechMetadata.style"})]}),e.jsx("textarea",{rows:2,value:V,onChange:t=>K(t.target.value),placeholder:"Ej: Voz cálida, pausada y reflexiva de narrador de documentales...",className:"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{children:[e.jsxs("button",{type:"button",onClick:()=>ws(!Ut),className:"flex items-center justify-between w-full text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-extrabold py-1 transition cursor-pointer",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(er,{className:"w-3.5 h-3.5 text-teal-500"}),"Motor de Capas de Audio (~1 min por capa) & Unión Master"]}),e.jsx("span",{children:Ut?"▲":"▼"})]}),Ut&&e.jsxs("div",{className:"mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs",children:[e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-1.5",children:[{words:110,label:"~45 seg",sub:"110 pal."},{words:150,label:"~1 min ★",sub:"150 pal. (Óptimo)"},{words:220,label:"~1.5 min",sub:"220 pal."},{words:280,label:"~2 min",sub:"280 pal."}].map(t=>{const a=Math.abs(Ce-t.words)<=10;return e.jsxs("button",{type:"button",onClick:()=>ua(t.words),className:y("px-2 py-1.5 rounded-lg border text-center transition cursor-pointer",a?"bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 font-extrabold shadow-2xs":"bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-zinc-300 hover:border-teal-400"),children:[e.jsx("div",{className:"text-[11px] font-bold",children:t.label}),e.jsx("div",{className:"text-[9px] opacity-80",children:t.sub})]},t.words)})}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-slate-600 dark:text-zinc-400",children:"Tamaño de cada capa de audio:"}),e.jsxs("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:[Ce," palabras (~",Math.max(20,Math.round(Ce/145*60)),"s)"]})]}),e.jsx("input",{type:"range",min:80,max:280,step:10,value:Ce,onChange:t=>ua(parseInt(t.target.value,10)),className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-teal-600"}),e.jsxs("p",{className:"text-[10px] text-slate-600 dark:text-zinc-400 leading-relaxed",children:[e.jsx("strong",{children:"Recomendado (~1 min / 150 palabras):"})," Cada capa se genera en ~4 segundos sin saturar la API, permite preescuchar cada fragmento al instante y une todas las capas en un solo ",e.jsx("strong",{children:"WAV Master 24kHz"})," con micro-fades sin cortes."]})]})]})]}),e.jsxs("div",{className:"lg:col-span-7 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:y("p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all",Ae>0?"bg-emerald-500/10 border-emerald-500/30":"bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border-indigo-500/25"),children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[e.jsx("div",{className:y("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",Ae>0?"bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300":"bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300"),children:e.jsx(At,{className:"w-4 h-4"})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5",children:Ae>0?e.jsx(e.Fragment,{children:e.jsxs("span",{children:[Ae," clave(s) API guardada(s) • Rotación y failover automático (429) activados"]})}):e.jsx(e.Fragment,{children:e.jsx("span",{children:"Motor Multi-Key Gemini TTS (Almacenamiento Local + Respaldo WAPPY)"})})}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:Ae>0?"Si una clave alcanza el límite de cuota (429), WAPPY Studio salta instantáneamente a la siguiente sin interrumpir tu audio.":"Puedes agregar hasta 3 claves gratuitas de Google AI Studio para multiplicar tu cuota de síntesis de 60 min."})]})]}),e.jsx("button",{type:"button",onClick:()=>{it(""),J("keys"),rt(!0)},className:y("px-3 py-1.5 rounded-xl text-xs font-extrabold border transition shrink-0 cursor-pointer",Ae>0?"bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border-emerald-500/30":"bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-800 dark:text-indigo-200 border-indigo-500/30"),children:Ae>0?"Administrar claves":"Configurar claves"})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2.5",children:[e.jsxs("h2",{className:"text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 shrink-0",children:[e.jsx(lt,{className:"w-4 h-4 text-teal-500"}),"Texto a Sintetizar"]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 min-w-0",children:[e.jsxs("select",{defaultValue:"",onChange:t=>{const a=pt.find(r=>r.title===t.target.value);a&&(He(a.text),a.text.includes("Alex:")&&a.text.includes("Sam:")&&je(!0)),t.target.value=""},className:"min-w-0 max-w-[230px] sm:max-w-[260px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer",children:[e.jsxs("option",{value:"",disabled:!0,children:["📋 Cargar ejemplo (",pt.length," plantillas)..."]}),pt.map(t=>e.jsx("option",{value:t.title,children:t.title},t.title))]}),e.jsx(I,{size:"sm",icon:j?e.jsx(te,{className:"animate-spin"}):e.jsx(as,{}),label:j?"Enriqueciendo...":"Mejorar Guion con IA",variant:"purple",disabled:j,onClick:Bs,title:`Enriquecer o generar guion con Vocal Bursts usando ${F}`}),M&&e.jsx(I,{size:"sm",icon:e.jsx(Fe,{}),label:"Limpiar",variant:"danger",onClick:()=>He("")})]})]}),e.jsxs("div",{className:"p-3 bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px]",children:[e.jsxs("span",{className:"font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1",children:[e.jsx(Oe,{className:"w-3.5 h-3.5 text-amber-500"}),"Insertar Efectos Vocales (Vocal Bursts) en el cursor:"]}),e.jsx("span",{className:"font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold",children:x})]}),e.jsxs("div",{className:"flex flex-wrap gap-1.5",children:[Z.map(t=>e.jsxs("button",{type:"button",onClick:()=>Zt(` ${t.tag} `),title:t.description,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-500/10 border border-slate-200 dark:border-slate-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx("span",{className:"text-amber-700 dark:text-amber-400 font-bold",children:t.tag}),e.jsxs("span",{className:"text-slate-600 dark:text-zinc-400 text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),e.jsx("button",{type:"button",onClick:()=>Zt(`
Alex: `),className:"px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold transition cursor-pointer",children:"Alex:"}),e.jsx("button",{type:"button",onClick:()=>Zt(`
Sam: `),className:"px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold transition cursor-pointer",children:"Sam:"})]})]}),e.jsx("textarea",{id:"wappy-studio-tts-editor",rows:12,value:M,onChange:t=>He(t.target.value),placeholder:"Escribe o pega aquí el guion para tu cápsula SST, curso de Academia WAPPY, podcast o audiolibro de hasta 1 hora...",className:"w-full bg-white dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 leading-relaxed resize-y min-h-[260px] shadow-inner"}),e.jsxs("div",{className:"bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between text-xs gap-2",children:[e.jsxs("div",{className:"flex items-center gap-3 text-slate-600 dark:text-slate-300",children:[e.jsxs("span",{children:["Palabras:"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white font-mono",children:$t})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Caracteres:"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white font-mono",children:gs})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Fragmentos estimados:"," ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400 font-mono",children:Qe})]})]}),e.jsxs("div",{className:"text-slate-900 dark:text-white font-semibold",children:["Duración estimada:"," ",e.jsxs("strong",{className:"text-amber-600 dark:text-amber-400 font-mono",children:["~",mt," min"]})," ","/ 60 min máx"]})]}),e.jsx("div",{className:"w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,Math.round(mt/60*100)))}%`}})})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1",children:[e.jsxs("button",{type:"button",onClick:Vs,disabled:_t||(Q==null?void 0:Q.status)==="processing"||!M.trim(),className:"flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[_t?e.jsx(te,{className:"w-4 h-4 animate-spin text-teal-500"}):e.jsx(es,{className:"w-4 h-4 text-amber-500"}),e.jsx("span",{children:"Vista Previa Rápida (~1er fragmento)"})]}),e.jsxs("button",{type:"button",onClick:_s,disabled:(Q==null?void 0:Q.status)==="processing"||_t||!M.trim(),className:"flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[(Q==null?void 0:Q.status)==="processing"?e.jsx(te,{className:"w-4 h-4 animate-spin"}):e.jsx(Me,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:Qe>1?`Generar Audio Completo (${Qe} fragmentos • ~${mt} min)`:"Generar Audio Completo"})]})]})]})]})]}),N==="video"&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200",children:[e.jsxs("div",{className:"lg:col-span-6 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsx("div",{className:"flex items-center justify-between gap-2",children:e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(Re,{className:"w-5 h-5 text-purple-500"}),"Estudio de Capas & Motion Graphics HTML"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Sube tu propio video grabado a cámara o genera animaciones estilo Claude/HeyGen sincronizadas con tu voz."})]})}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",onClick:()=>{Ft("9:16"),Ue("9:16",!!ee,tt)},className:y("p-3 rounded-xl border text-left transition cursor-pointer",$==="9:16"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:"📱 Vertical 9:16 (Reels / TikTok)"}),e.jsx("div",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5",children:"1080 × 1920 px • Ideal para redes y WhatsApp"})]}),e.jsxs("button",{type:"button",onClick:()=>{Ft("16:9"),Ue("16:9",!!ee,tt)},className:y("p-3 rounded-xl border text-left transition cursor-pointer",$==="16:9"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:"🖥️ Horizontal 16:9 (YouTube / LMS)"}),e.jsx("div",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5",children:"1920 × 1080 px • Ideal para cursos Academia WAPPY"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(Oe,{className:"w-3.5 h-3.5 text-teal-500"}),"Plantillas Visuales Instantáneas (HyperFrames)"]}),e.jsx("span",{className:"text-[10px] text-slate-600 dark:text-slate-300",children:"Clic para aplicar"})]}),e.jsx("div",{className:"grid grid-cols-2 gap-2",children:kr.map(t=>{const a=tt===t.id;return e.jsxs("button",{type:"button",onClick:()=>{ks(t.id),Ue($,!!ee,t.id)},className:y("p-2.5 rounded-xl border text-left transition cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-slate-900 dark:text-white truncate",children:t.name}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0",children:t.badge})]}),e.jsx("p",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1",children:t.description})]},t.id)})})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3",children:[e.jsxs("div",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(aa,{className:"w-4 h-4 text-teal-500"}),"Capas Base Multimedia (Video a Cámara + Locución)"]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{className:"p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"1. Tu Video Base (Opcional)"}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:Na?`Activo: ${Na}`:"Sube un MP4/WebM tuyo para montarle capas HTML encima."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(ss,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Video MP4"}),e.jsx("input",{type:"file",accept:"video/mp4,video/webm,video/quicktime",onChange:Ws,className:"hidden"})]}),ee&&e.jsx(I,{size:"sm",icon:e.jsx(Fe,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(ee),Sa(null),Ca(""),Ue($,!1)}})]})]}),e.jsxs("div",{className:"p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"2. Audio / Locución Sincronizada"}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:Ea?`Archivo: ${Ea}`:m?`Vinculado: ${m.title}`:"Usa el audio del Estudio TTS o sube un WAV/MP3."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(ss,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Audio WAV/MP3"}),e.jsx("input",{type:"file",accept:"audio/*",onChange:Hs,className:"hidden"})]}),Ve&&e.jsx(I,{size:"sm",icon:e.jsx(Fe,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(Ve),Ta(null),Aa("")}})]})]})]})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"3. Textos de Capa y Subtítulos Dinámicos"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:ve,onChange:t=>Pa(t.target.checked),className:"rounded accent-teal-600"}),"Subtítulos"]}),ve&&e.jsx("div",{className:"inline-flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]",children:[{id:"bottom",label:"Abajo"},{id:"center",label:"Centro"},{id:"top",label:"Arriba"}].map(t=>e.jsx("button",{type:"button",onClick:()=>wa(t.id),className:y("px-1.5 py-0.5 rounded transition cursor-pointer",De===t.id?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white"),children:t.label},t.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Insignia Superior (Badge)"}),e.jsx("input",{type:"text",value:Ma,onChange:t=>Ss(t.target.value),className:"w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Acento"}),e.jsx("div",{className:"flex items-center gap-2",children:["#14b8a6","#10b981","#6366f1","#f59e0b","#f43f5e"].map(t=>e.jsx("button",{type:"button",onClick:()=>Ts(t),style:{backgroundColor:t},className:y("w-6 h-6 rounded-full border-2 transition cursor-pointer",Ia===t?"border-white ring-2 ring-teal-500 scale-110":"border-transparent opacity-80")},t))})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Titular Principal en Pantalla"}),e.jsx("input",{type:"text",value:vt,onChange:t=>Ns(t.target.value),className:"w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold"})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("input",{type:"text",value:La,onChange:t=>Cs(t.target.value),placeholder:"Subtítulo secundario...",className:"flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"}),e.jsx(I,{icon:e.jsx(ds,{}),label:"Aplicar al Lienzo",variant:"cyan",onClick:()=>Ue($,!!ee)})]})]}),e.jsxs("div",{className:"p-4 bg-purple-500/5 border border-purple-500/25 rounded-2xl space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx(as,{className:"w-4 h-4 text-purple-500"}),"Generador IA de Animación HTML + GSAP (Estilo Claude)"]}),e.jsxs("button",{type:"button",onClick:()=>As(!Wt),className:"text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer",children:[e.jsx(tr,{className:"w-3.5 h-3.5"}),Wt?"Ocultar Código HTML":"Editar Código HTML"]})]}),e.jsx("textarea",{rows:2,value:za,onChange:t=>Es(t.target.value),placeholder:"Describe qué gráficos animados, tarjetas, alertas o diagramas quieres que la IA programe en HTML + GSAP...",className:"w-full bg-white dark:bg-slate-900 border border-purple-500/30 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 resize-none"}),e.jsx("div",{className:"flex justify-end",children:e.jsxs("button",{type:"button",onClick:Fs,disabled:wt,className:"flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50 cursor-pointer",children:[wt?e.jsx(te,{className:"w-4 h-4 animate-spin"}):e.jsx(Oe,{className:"w-4 h-4"}),e.jsx("span",{children:wt?"Diseñando Escena HTML + GSAP...":"Generar Animación HTML con IA"})]})}),Wt&&e.jsxs("div",{className:"pt-2",children:[e.jsx("label",{className:"block text-[10px] font-mono uppercase text-slate-600 dark:text-slate-300 mb-1",children:"Código Fuente HTML5 / Tailwind / GSAP en Vivo:"}),e.jsx("textarea",{rows:10,value:$e,onChange:t=>qe(t.target.value),className:"w-full bg-slate-950 text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500"})]})]})]}),e.jsxs("div",{className:"lg:col-span-6 space-y-4 bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-nowrap",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[e.jsx("span",{className:y("w-2.5 h-2.5 rounded-full shrink-0",ie?"bg-amber-500 animate-ping":we?"bg-emerald-500 animate-pulse":"bg-slate-400")}),e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white truncate",children:ie?`Editor Visual (${$})`:`Lienzo Interactivo (${$})`})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(I,{size:"sm",icon:ka?e.jsx(te,{className:"animate-spin"}):e.jsx(lt,{}),label:"Sincronizar Voz IA",variant:"purple",disabled:ka,onClick:Us}),e.jsx(I,{size:"sm",icon:e.jsx(Pt,{}),label:ie?"Salir de Edición":"Editar Lienzo",variant:"orange",isActive:ie,onClick:Ha}),e.jsx(I,{size:"sm",icon:st?e.jsx(te,{className:"animate-spin"}):e.jsx(Re,{}),label:"Descargar MP4 (WhatsApp/Celular)",variant:"teal",disabled:st,onClick:qa}),e.jsx(I,{size:"sm",icon:jt?e.jsx(te,{className:"animate-spin"}):e.jsx(Xe,{}),label:"Cápsula Academia (HTML5)",variant:"green",disabled:jt,onClick:Ya}),e.jsx(I,{size:"sm",icon:e.jsx(rs,{}),label:"Guardar en Biblioteca",variant:"teal",onClick:()=>ta({},!1)}),e.jsx(I,{size:"sm",icon:e.jsx(ar,{}),label:"Pantalla Completa",variant:"neutral",onClick:Ga})]})]}),ie&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5",children:[e.jsx(sr,{className:"w-3.5 h-3.5 text-amber-500 shrink-0"}),"Arrastra cualquier caja o título con el mouse para moverlo • Doble clic para escribir"]}),e.jsxs("button",{type:"button",onClick:Gs,className:"px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx(ut,{className:"w-3 h-3"}),"Guardar Cambios"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=L.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"text"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(is,{className:"w-3 h-3 text-teal-500"}),e.jsx(rr,{className:"w-3 h-3 text-teal-500"}),e.jsx("span",{children:"+ Texto"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=L.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"card"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(is,{className:"w-3 h-3 text-purple-500"}),e.jsx(aa,{className:"w-3 h-3 text-purple-500"}),e.jsx("span",{children:"+ Caja / Tarjeta"})]}),e.jsx("button",{type:"button",onClick:()=>{var t,a;return(a=(t=L.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_SELECT_PARENT"},"*")},disabled:!de,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 disabled:opacity-40 cursor-pointer",children:"Seleccionar Caja Contenedora"}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=L.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DUPLICATE_SELECTED"},"*")},disabled:!de,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(na,{className:"w-3 h-3 text-indigo-500"}),e.jsx("span",{children:"Duplicar"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=L.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DELETE_SELECTED"},"*")},disabled:!de,className:"px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(Fe,{className:"w-3 h-3"}),e.jsx("span",{children:"Eliminar"})]})]})]}),e.jsx("div",{className:"flex justify-center items-center bg-slate-950 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-inner overflow-hidden min-h-[460px]",children:e.jsxs("div",{ref:$a,className:y("relative overflow-hidden bg-slate-950 shadow-2xl border border-white/10 transition-all duration-300",Ht?"w-screen h-screen rounded-none border-0 flex flex-col items-center justify-between p-4 sm:p-6":y("rounded-2xl mx-auto flex items-center justify-center",$==="9:16"?"w-full max-w-[390px] aspect-[9/16] max-h-[660px]":"w-full aspect-[16/9] max-h-[660px] min-h-[340px]")),children:[e.jsxs("div",{className:y("relative overflow-hidden bg-slate-950",Ht?$==="9:16"?"h-[calc(100vh-100px)] aspect-[9/16] max-w-[95vw] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-[min(94vw,calc((100vh-100px)*1.7778))] aspect-[16/9] max-h-[calc(100vh-100px)] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-full h-full"),children:[xe&&e.jsx("audio",{ref:ue,src:xe,preload:"metadata",onTimeUpdate:t=>{var s,n;const a=t.currentTarget.currentTime,r=t.currentTarget.duration&&!isNaN(t.currentTarget.duration)?t.currentTarget.duration:_||20;Ee(a),(n=(s=L.current)==null?void 0:s.contentWindow)==null||n.postMessage({type:"STUDIO_SYNC_TIME",currentTime:a,duration:r,playing:!t.currentTarget.paused&&!t.currentTarget.ended},"*")},onLoadedMetadata:t=>{t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&at(t.currentTarget.duration)},onEnded:()=>{var t,a,r;_e(!1),(a=(t=L.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_PAUSE"},"*"),(r=pe.current)==null||r.pause()}}),ee&&e.jsx("video",{ref:pe,src:ee,width:$==="9:16"?1080:1920,height:$==="9:16"?1920:1080,muted:yt,playsInline:!0,loop:!0,preload:"metadata",onTimeUpdate:t=>{xe||Ee(t.currentTarget.currentTime)},onLoadedMetadata:t=>{!xe&&t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&at(t.currentTarget.duration)},className:"absolute inset-0 w-full h-full object-cover z-0"}),e.jsx("iframe",{ref:L,title:"WAPPY Studio HTML Canvas",srcDoc:Is,sandbox:"allow-scripts allow-same-origin",onLoad:()=>{var t,a,r,s,n,o;(a=(t=L.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*"),ie?(s=(r=L.current)==null?void 0:r.contentWindow)==null||s.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!0},"*"):we||(o=(n=L.current)==null?void 0:n.contentWindow)==null||o.postMessage({type:"STUDIO_PAUSE"},"*")},className:y("absolute inset-0 w-full h-full border-0 z-10",ie?"pointer-events-auto":"pointer-events-none")}),ve&&Qt&&e.jsx("div",{className:y("absolute inset-x-3 z-20 flex justify-center pointer-events-none",De==="top"?"top-16":De==="center"?"top-1/2 -translate-y-1/2":"bottom-5"),children:e.jsx("div",{className:"bg-[#050c12]/90 backdrop-blur-md border border-[#c7f303]/40 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]",children:e.jsx("div",{className:"flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1",children:Qt.words.map((t,a)=>{const r=a===Qt.activeOffset;return e.jsx("span",{className:y("text-sm sm:text-base font-black uppercase tracking-wide transition-all duration-150",r?"text-[#080c04] scale-110 bg-[#c7f303] px-2 py-0.5 rounded-lg shadow-[0_0_14px_rgba(199,243,3,0.45)]":"text-white/95"),children:t},`${t}-${a}`)})})})})]}),Ht&&e.jsxs("div",{className:"w-full max-w-3xl mx-auto mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 flex items-center gap-3 z-30 shadow-2xl",children:[e.jsx("button",{type:"button",onClick:Fa,title:we?"Pausar / Parar":"Reproducir",className:"px-3.5 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:we?e.jsxs(e.Fragment,{children:[e.jsx(Ot,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(Me,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:Xt,title:"Reiniciar animación",className:"p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer shrink-0",children:e.jsx(oa,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:_||20,step:.1,value:Be,onChange:t=>Wa(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-200 shrink-0",children:[Be.toFixed(1),"s / ",(_||20).toFixed(1),"s"]}),e.jsxs("button",{type:"button",onClick:Ha,className:y("px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0",ie?"bg-amber-500/20 border-amber-400 text-amber-300":"bg-slate-800 border-slate-700 text-slate-200 hover:text-white"),children:[e.jsx(Pt,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:ie?"Editando":"Editar"})]}),e.jsxs("button",{type:"button",onClick:Ga,className:"px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0",children:[e.jsx(ir,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Salir"})]})]})]})}),e.jsxs("div",{className:"p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{type:"button",onClick:Fa,title:we?"Pausar animación y subtítulos":"Reproducir animación y subtítulos",className:"px-3 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:we?e.jsxs(e.Fragment,{children:[e.jsx(Ot,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(Me,{className:"w-4 h-4 fill-white ml-0.5"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:Xt,title:"Reiniciar animación",className:"p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition cursor-pointer shrink-0",children:e.jsx(oa,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:_||20,step:.1,value:Be,onChange:t=>Wa(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0",children:[Be.toFixed(1),"s / ",(_||20).toFixed(1),"s"]}),ee&&e.jsx("button",{type:"button",onClick:()=>js(!yt),title:yt?"Activar audio del video original":"Silenciar video original",className:"p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition cursor-pointer",children:yt?e.jsx(cs,{className:"w-4 h-4 text-rose-500"}):e.jsx(da,{className:"w-4 h-4 text-teal-500"})})]}),e.jsxs("div",{className:"pt-2 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",disabled:st,onClick:qa,className:"p-3 rounded-xl border bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20 text-teal-800 dark:text-teal-200 text-left transition-all cursor-pointer disabled:opacity-50 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20",children:"WhatsApp • Celular • Redes"}),st?e.jsx(te,{className:"w-4 h-4 animate-spin shrink-0"}):e.jsx(Re,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight mt-0.5",children:st?"Renderizando Video MP4...":"Descargar Video .MP4 (Todo Unido)"}),e.jsx("div",{className:"text-[10px] opacity-85 leading-snug",children:"Une Animación + Subtítulos + Voz IA en un archivo .MP4 listo para enviar por WhatsApp o subir a Reels"})]}),e.jsxs("div",{className:"p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col justify-between gap-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20",children:"Academia WAPPY • LMS Responsive"}),e.jsx(sa,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight",children:"Cápsula Interactiva HTML5 (Móvil & Web)"}),e.jsxs("div",{className:"flex items-center gap-1.5 mt-0.5",children:[e.jsxs("button",{type:"button",disabled:jt,onClick:Ya,className:"flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx(Xe,{className:"w-3 h-3"}),e.jsx("span",{children:"Descargar .HTML"})]}),e.jsxs("button",{type:"button",disabled:jt,onClick:Ys,title:"Copiar código <iframe srcdoc> para lección de Academia WAPPY",className:"py-1.5 px-2.5 rounded-lg bg-white/80 dark:bg-slate-800 hover:bg-white text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition",children:[e.jsx(na,{className:"w-3 h-3"}),e.jsx("span",{children:"Copiar LMS"})]})]})]})]})]}),ie&&de&&e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/95 rounded-2xl border border-teal-500/40 space-y-3 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5",children:[e.jsx(Pt,{className:"w-3.5 h-3.5"}),"Propiedades del Elemento Seleccionado (<",de.tagName,">)"]}),e.jsx("button",{type:"button",onClick:()=>Ie({dx:0,dy:0,scale:1}),className:"text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer",children:"Restablecer posición"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Texto del elemento (edita aquí o con doble clic en el video):"}),e.jsx("textarea",{rows:2,value:de.text,onChange:t=>Ie({text:t.target.value}),className:"w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:["Tamaño Letra (",de.fontSize,"px)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>Ie({fontSize:Math.max(10,de.fontSize-2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"A-"}),e.jsx("button",{type:"button",onClick:()=>Ie({fontSize:Math.min(96,de.fontSize+2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"A+"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:["Escala Caja (",de.scale,"x)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>Ie({scale:Math.max(.5,Number((de.scale-.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"-"}),e.jsx("button",{type:"button",onClick:()=>Ie({scale:Math.min(2.5,Number((de.scale+.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"+"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Texto"}),e.jsx("input",{type:"color",value:de.color,onChange:t=>Ie({color:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Fondo"}),e.jsx("input",{type:"color",value:de.backgroundColor,onChange:t=>Ie({backgroundColor:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"})]})]})]})]})]}),N==="lab"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-xs",children:[e.jsx("div",{className:"w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0",children:e.jsx(Oe,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:"Laboratorio de Expresividad y Vocal Bursts"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Explora las capacidades de Gemini TTS: respiraciones orgánicas, risas, susurros y dirección de estilo en tiempo real"})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:"Modelo en el Laboratorio:"}),e.jsx("div",{className:"flex flex-wrap items-center gap-2",children:se.map(t=>{const a=x===t.id;return e.jsxs("button",{type:"button",onClick:()=>{f(t.id),t.supportedVoices.includes(b)||T(t.supportedVoices[0]||"Kore")},className:y("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[t.name," (",t.supportedVoices.length," voces)"]},t.id)})})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:"Efectos Vocales Orgánicos Integrados"}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:Z.map(t=>{const a=ms===t.tag;return e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400",children:t.tag}),e.jsx("p",{className:"text-xs font-bold text-slate-900 dark:text-white mt-0.5",children:t.label}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:t.description})]}),e.jsx("button",{type:"button",disabled:a,onClick:async()=>{try{ba(t.tag);const r=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:X(c),body:JSON.stringify({voiceName:b,model:"gemini-3.8-flash-tts",stylePrompt:"Voz muy expresiva y natural.",text:`Escucha cómo suena este efecto natural en medio de una frase: ${t.tag} ¡Suena totalmente humano!`})}),s=await ke(r);s.audioBase64&&re({base64:s.audioBase64,title:`Efecto ${t.tag} (${b})`,durationSeconds:s.durationSeconds,voiceName:b})}catch(r){S({type:"error",text:r.message})}finally{ba(null)}},className:"w-9 h-9 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 transition cursor-pointer",children:a?e.jsx(te,{className:"w-4 h-4 animate-spin"}):e.jsx(Me,{className:"w-4 h-4 fill-current"})})]},t.tag)})})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:"Probador Libre de Prosodia y Dirección de Voz"}),e.jsxs("span",{className:"text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",children:["Voces activas: ",Je," de ",C.length]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:["Selecciona la Voz (",Je," activas para ",R==null?void 0:R.name,")"]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:C.map(t=>{const a=b===t.id,r=Ye(t.id);return e.jsxs("button",{type:"button",onClick:()=>{r||f("gemini-3.8-flash-tts"),T(t.id)},className:y("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-teal-400",!r&&"opacity-55"),children:[e.jsxs("span",{children:[t.name," (",t.gender,")"]}),r&&e.jsx(ut,{className:"w-3 h-3 text-emerald-400"})]},t.id)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5",children:"Prompt de Dirección (speechMetadata.style)"}),e.jsx("input",{type:"text",value:Vt,onChange:t=>us(t.target.value),className:"w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5",children:"Texto de Prueba"}),e.jsx("textarea",{rows:3,value:Te,onChange:t=>xs(t.target.value),className:"w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsx("div",{children:e.jsxs("button",{type:"button",onClick:$s,disabled:xa||!Te.trim(),className:"inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer",children:[xa?e.jsx(te,{className:"w-4 h-4 animate-spin"}):e.jsx(Oe,{className:"w-4 h-4"}),e.jsx("span",{children:"Sintetizar en el Laboratorio"})]})})]})]}),N==="library"&&e.jsxs("div",{className:"space-y-5 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(sa,{className:"w-5 h-5 text-indigo-500"}),"Biblioteca de Audios y Videos"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Tus locuciones y videos (HTML + voz) quedan guardados permanentemente en este navegador para reproducir, reabrir, editar o descargar."})]}),Le.length>0&&e.jsx(I,{icon:e.jsx(Fe,{}),label:"Limpiar Historial",variant:"danger",onClick:()=>{window.confirm("¿Borrar todos los audios y videos guardados?")&&(Ge([]),hr())}})]}),Le.length===0?e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2",children:[e.jsx(lt,{className:"w-10 h-10 mx-auto text-slate-400"}),e.jsx("p",{className:"text-sm font-bold text-slate-900 dark:text-white",children:"Aún no hay audios en tu biblioteca"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto",children:'Genera una locución en la pestaña "Estudio de Voz (TTS)" o en "Voces & Bursts" y aparecerá aquí automáticamente.'})]}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:Le.map(t=>e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("h4",{className:"text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1",children:t.title}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[t.kind==="video"&&e.jsxs("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30",children:["🎬 VIDEO ",t.aspectRatio||""]}),e.jsx("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30",children:t.voiceName})]})]}),e.jsxs("div",{className:"flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300",children:[e.jsxs("span",{children:["⏱ ",Nr(t.durationSeconds)]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[t.wordCount," palabras"]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:Cr(t.createdAt)})]}),t.stylePrompt&&e.jsxs("div",{className:"p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-[11px] italic text-slate-600 dark:text-slate-300 line-clamp-2",children:['"',t.stylePrompt,'"']})]}),e.jsxs("div",{className:"flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800",children:[e.jsx("div",{className:"flex items-center gap-1.5",children:t.kind==="video"?e.jsx(I,{size:"sm",icon:e.jsx(Pt,{}),label:"Abrir en Compositor",variant:"orange",onClick:()=>Ks(t)}):e.jsxs(e.Fragment,{children:[e.jsx(I,{size:"sm",icon:e.jsx(Me,{}),label:"Reproducir",variant:"teal",onClick:()=>Ua(t)}),e.jsx(I,{size:"sm",icon:e.jsx(Re,{}),label:"Usar en Video",variant:"purple",onClick:()=>Ua(t,!0)})]})}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[t.kind==="video"&&t.mp4Key&&e.jsx(I,{size:"sm",icon:e.jsx(Re,{}),label:"Descargar MP4",variant:"green",onClick:async()=>{const a=await ct(t.mp4Key);a&&Yt(a,`wappy-studio-reel-${t.id}.mp4`)}}),t.kind==="video"&&t.capsuleKey&&e.jsx(I,{size:"sm",icon:e.jsx(Xe,{}),label:"Descargar Cápsula HTML",variant:"green",onClick:async()=>{const a=await ct(t.capsuleKey);a&&Yt(a,`wappy-academia-capsula-${t.id}.html`)}}),t.kind!=="video"&&e.jsx(I,{size:"sm",icon:e.jsx(Xe,{}),label:"Descargar WAV",variant:"green",onClick:async()=>{const a=await Ba(t);if(!a){S({type:"error",text:"Este audio ya no está disponible (se generó antes del guardado permanente). Vuelve a generarlo."});return}Yt(a,`wappy-audio-${t.id}.wav`)}}),e.jsx(I,{size:"sm",icon:e.jsx(Fe,{}),label:"Eliminar",variant:"danger",onClick:()=>zs(t)})]})]})]},t.id))})]})]}),Ms&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-300 shrink-0",children:e.jsx(At,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:"Gestor de Claves API & Ecosistema GOOGLE_MODELS"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-zinc-400",children:"Rotación inteligente anti-429 y catálogo completo de modelos oficiales de WAPPY."})]})]}),e.jsx("button",{type:"button",onClick:()=>rt(!1),className:"p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-zinc-300 cursor-pointer",children:e.jsx(It,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800",children:[e.jsxs("button",{type:"button",onClick:()=>J("keys"),className:y("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",G==="keys"?"bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(At,{className:"w-3.5 h-3.5"}),e.jsxs("span",{children:["Mis Claves Locales (",Ae,"/3)"]})]}),e.jsxs("button",{type:"button",onClick:()=>J("models"),className:y("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",G==="models"?"bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(ts,{className:"w-3.5 h-3.5"}),e.jsxs("span",{children:["Modelos WAPPY (",ns.length,")"]})]})]}),G==="keys"?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-900 dark:text-teal-200 leading-relaxed",children:["Obtén gratis tus claves en"," ",e.jsx("a",{href:"https://aistudio.google.com/app/apikey",target:"_blank",rel:"noopener noreferrer",className:"font-extrabold underline hover:text-teal-600",children:"Google AI Studio (aistudio.google.com)"}),". WAPPY Studio rotará automáticamente entre tus claves locales y el pool del servidor para evitar bloqueos por cuota 429 en locuciones de hasta 60 minutos."]}),e.jsx("div",{className:"space-y-2.5",children:Nt.map((t,a)=>e.jsxs("div",{className:"p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px] font-bold",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-slate-900 dark:text-white",children:t.label||`Clave Google Gemini #${a+1}`}),e.jsx("span",{className:y("text-[9px] font-extrabold px-1.5 py-0.5 rounded border",a===0?"bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30":"bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"),children:a===0?"Prioridad #1":`Failover #${a+1}`})]}),t.status==="valid"&&e.jsxs("span",{className:"text-emerald-700 dark:text-emerald-400 flex items-center gap-1",children:[e.jsx(ia,{className:"w-3.5 h-3.5"})," Activa y verificada"]}),t.status==="invalid"&&e.jsxs("span",{className:"text-rose-600 dark:text-rose-400 flex items-center gap-1",children:[e.jsx(xt,{className:"w-3.5 h-3.5"})," Clave inválida o vencida"]})]}),e.jsx("input",{type:"password",value:t.key,onChange:r=>{const s=r.target.value;Ct(n=>n.map((o,d)=>d===a?{...o,key:s,status:"unchecked"}:o))},placeholder:"AIzaSy...",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"})]},a))}),Va&&e.jsx("div",{className:"p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300",children:Va}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800",children:[e.jsx(I,{size:"sm",icon:e.jsx(Fe,{}),label:"Limpiar Claves",variant:"danger",onClick:()=>{Ct([{key:"",label:"Clave Principal #1",status:"unchecked"},{key:"",label:"Clave Respaldo #2",status:"unchecked"},{key:"",label:"Clave Respaldo #3",status:"unchecked"}]),localStorage.removeItem(zt),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),it("Claves eliminadas del navegador.")}}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(I,{size:"sm",icon:e.jsx(It,{}),label:"Cerrar",variant:"neutral",onClick:()=>rt(!1)}),e.jsx(I,{size:"sm",icon:qt?e.jsx(te,{className:"animate-spin"}):e.jsx(rs,{}),label:qt?"Validando...":"Guardar y Validar",variant:"teal",disabled:qt,onClick:Ls})]})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed",children:[e.jsx("strong",{children:"Ecosistema Oficial GOOGLE_MODELS de WAPPY:"})," Haz clic en cualquier modelo TTS o de Generación IA para activarlo de inmediato en el estudio."]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1",children:ns.map(t=>{const a=t.id.includes("tts"),r=t.id==="gemini-3.8-flash"||t.id==="gemini-3.6-flash"||t.id==="gemini-3.5-flash-lite",s=a&&x===t.id||r&&F===t.id;return e.jsxs("div",{onClick:()=>{a?f(t.id):r&&ge(t.id)},className:y("p-3 rounded-xl border text-left transition flex flex-col justify-between",a||r?"cursor-pointer":"opacity-90",s?"bg-teal-50/90 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400",children:t.category}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25",children:t.badge})]}),e.jsx("div",{className:"font-mono text-xs font-extrabold text-slate-900 dark:text-white",children:t.id}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-snug",children:t.description})]}),(a||r)&&e.jsxs("div",{className:"mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-slate-500 dark:text-zinc-400",children:a?"Motor de Voz TTS":"Motor IA Escenas/Guion"}),e.jsx("span",{className:y("font-extrabold",s?"text-emerald-700 dark:text-emerald-400":"text-indigo-600 dark:text-indigo-400"),children:s?"✓ En uso":"Usar este modelo →"})]})]},t.id)})}),e.jsx("div",{className:"flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800",children:e.jsx(I,{size:"sm",icon:e.jsx(ut,{}),label:"Listo",variant:"teal",onClick:()=>rt(!1)})})]})]})})]})}function Tr({audioBase64:l,audioUrl:p,title:c,durationSeconds:g,voiceName:z,onSendToVideo:P}){const h=i.useRef(null),[U,oe]=i.useState(!1),[O,E]=i.useState(0),[N,ae]=i.useState(g||0),[F,ge]=i.useState(1),[j,v]=i.useState(1),[G,J]=i.useState(!1),[se,q]=i.useState(!1),C=p||(l?`data:audio/wav;base64,${l}`:"");i.useEffect(()=>{oe(!1),E(0),g&&g>0&&ae(g)},[C,g]);const le=()=>{!h.current||!C||(U?h.current.pause():h.current.play().catch(x=>console.error("Error al reproducir audio:",x)))},A=x=>{if(!h.current)return;const f=Math.max(1,N||h.current.duration||0),b=Math.max(0,Math.min(f,h.current.currentTime+x));h.current.currentTime=b,E(b)},he=()=>{if(!h.current)return;const x=!G;h.current.muted=x,J(x)},Z=x=>{if(!x||isNaN(x)||x<0)return"00:00";const f=Math.floor(x),b=Math.floor(f/60),T=f%60;return`${b.toString().padStart(2,"0")}:${T.toString().padStart(2,"0")}`},ye=async()=>{if(!C)return;const x=`${c.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"wappy-tts"}.wav`;try{if(C.startsWith("data:")||C.startsWith("blob:")){const T=document.createElement("a");T.href=C,T.download=x,document.body.appendChild(T),T.click(),document.body.removeChild(T);return}const b=await fetch(C,{headers:X()});if(b.ok){const T=await b.blob(),V=URL.createObjectURL(T),K=document.createElement("a");K.href=V,K.download=x,document.body.appendChild(K),K.click(),document.body.removeChild(K),setTimeout(()=>URL.revokeObjectURL(V),4e3);return}}catch{}const f=document.createElement("a");f.href=C,f.download=x,document.body.appendChild(f),f.click(),document.body.removeChild(f)};return C?e.jsxs("div",{className:"bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 border border-indigo-500/25 dark:border-indigo-500/25 rounded-2xl p-5 shadow-xl space-y-3.5",children:[e.jsx("audio",{ref:h,src:C,preload:"metadata",onPlay:()=>oe(!0),onPause:()=>oe(!1),onEnded:()=>oe(!1),onTimeUpdate:()=>{h.current&&E(h.current.currentTime)},onLoadedMetadata:()=>{var x;(x=h.current)!=null&&x.duration&&!isNaN(h.current.duration)&&ae(h.current.duration)}}),e.jsxs("div",{className:"flex flex-wrap sm:flex-nowrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"}),e.jsx("h3",{className:"text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-xl",children:c})]}),e.jsxs("p",{className:"text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate",children:["Voz:"," ",e.jsx("span",{className:"font-semibold text-slate-700 dark:text-slate-200",children:z||"Kore"})," ","• Formato WAV 24kHz"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[l&&e.jsx("button",{type:"button",onClick:()=>{navigator.clipboard.writeText(l),q(!0),setTimeout(()=>q(!1),2e3)},title:"Copiar Base64",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer",children:se?e.jsx(ut,{className:"w-4 h-4 text-emerald-500"}):e.jsx(na,{className:"w-4 h-4"})}),e.jsxs("button",{type:"button",onClick:P,title:"Vincular locución al Compositor de Video",className:"flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer",children:[e.jsx(Re,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Llevar al Video"})]}),e.jsxs("button",{type:"button",onClick:ye,title:"Descargar archivo WAV completo",className:"flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/25 transition shrink-0 cursor-pointer",children:[e.jsx(Xe,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Descargar WAV"})]})]})]}),e.jsx("div",{className:"flex items-center justify-between gap-1 h-12 bg-slate-100/90 dark:bg-slate-950/80 rounded-xl px-4 py-2 border border-slate-200/90 dark:border-slate-800/90 overflow-hidden",children:Array.from({length:42}).map((x,f)=>{const b=N>0?O/N:0,T=f/42,V=T<=b,K=20+Math.sin(f*.4)*15+Math.cos(f*.9)*12,W=U?Math.max(15,K*(.8+Math.sin(Date.now()/200+f)*.4)):K;return e.jsx("div",{onClick:()=>{if(h.current&&N>0){const je=T*N;h.current.currentTime=je,E(je)}},style:{height:`${Math.max(16,Math.min(95,W))}%`},className:y("w-1 rounded-full cursor-pointer transition-all duration-150",V?"bg-gradient-to-t from-indigo-500 to-amber-400":"bg-slate-300 dark:bg-slate-800 hover:bg-slate-400 dark:hover:bg-slate-700")},f)})}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("input",{type:"range",min:0,max:Math.max(1,N),step:.1,value:Math.min(O,Math.max(1,N)),onChange:x=>{const f=parseFloat(x.target.value);h.current&&(h.current.currentTime=f),E(f)},className:"w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"}),e.jsxs("div",{className:"flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400",children:[e.jsx("span",{children:Z(O)}),e.jsx("span",{children:Z(N)})]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-0.5",children:[e.jsxs("button",{type:"button",onClick:()=>{const x=[.75,1,1.25,1.5,2],f=x[(x.indexOf(F)+1)%x.length];ge(f),h.current&&(h.current.playbackRate=f)},title:"Cambiar velocidad de reproducción",className:"px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-lg border border-slate-200 dark:border-slate-700 transition shrink-0 cursor-pointer",children:[F,"x"]}),e.jsxs("div",{className:"flex items-center gap-2 sm:gap-3",children:[e.jsx("button",{type:"button",onClick:()=>A(-10),title:"Retroceder 10 segundos",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer",children:e.jsx(oa,{className:"w-4 h-4"})}),e.jsx("button",{type:"button",onClick:le,className:"w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition transform active:scale-95 shrink-0 cursor-pointer",children:U?e.jsx(Ot,{className:"w-5 h-5 fill-white"}):e.jsx(Me,{className:"w-5 h-5 fill-white ml-0.5"})}),e.jsx("button",{type:"button",onClick:()=>A(10),title:"Adelantar 10 segundos",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer",children:e.jsx(nr,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsx("button",{type:"button",onClick:he,title:G?"Activar sonido":"Silenciar",className:"p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer",children:G||j===0?e.jsx(cs,{className:"w-4 h-4 text-rose-500"}):e.jsx(da,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:1,step:.05,value:G?0:j,onChange:x=>{const f=parseFloat(x.target.value);v(f),J(f===0),h.current&&(h.current.volume=f,h.current.muted=f===0)},className:"hidden sm:block w-20 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"})]})]})]}):null}function ls(l){const p=Math.max(0,Math.round(l||0)),c=Math.floor(p/60),g=p%60;return`${c}m ${g.toString().padStart(2,"0")}s`}function Er({job:l,onPause:p,onResume:c,onCancel:g,onPlayChunk:z,onLoadMaster:P}){const h=l.status==="completed",U=l.status==="failed",oe=l.status==="processing",O=l.status==="paused";return e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:y("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",h?"bg-emerald-500/10 border-emerald-500/30 text-emerald-500":U?"bg-rose-500/10 border-rose-500/30 text-rose-500":"bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400"),children:oe?e.jsx(te,{className:"w-5 h-5 animate-spin"}):h?e.jsx(ia,{className:"w-5 h-5"}):U?e.jsx(xt,{className:"w-5 h-5"}):e.jsx(Oe,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("h4",{className:"text-sm font-bold text-slate-900 dark:text-white",children:h?"¡Audio de Larga Duración Completado!":U?"Error en la Generación":O?"Generación Pausada":`Generando fragmento ${l.currentChunkIndex+1} de ${l.totalChunks}...`}),e.jsx("span",{className:y("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border",h?"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25":U?"bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25":"bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 animate-pulse"),children:l.status})]}),e.jsxs("p",{className:"text-xs text-slate-500 dark:text-slate-400 mt-0.5",children:["Generados ",ls(l.generatedTotalSeconds)," de ~",ls(l.estimatedTotalSeconds)," estimados"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[oe&&e.jsxs("button",{type:"button",onClick:p,className:"flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer",children:[e.jsx(Ot,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Pausar"})]}),O&&e.jsxs("button",{type:"button",onClick:c,className:"flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition cursor-pointer",children:[e.jsx(Me,{className:"w-3.5 h-3.5 fill-white"}),e.jsx("span",{children:"Reanudar"})]}),!h&&!U&&e.jsx("button",{type:"button",onClick:g,title:"Cancelar tarea",className:"p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer",children:e.jsx(It,{className:"w-4 h-4"})}),h&&e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsxs("button",{type:"button",onClick:P,className:"flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/25 transition cursor-pointer",children:[e.jsx(Me,{className:"w-3.5 h-3.5 fill-white"}),e.jsx("span",{children:"Cargar en Reproductor"})]}),e.jsxs("a",{href:l.downloadUrl||`/api/studio/tts/jobs/${l.id}/download`,download:`wappy-master-${l.id}.wav`,className:"flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/25 transition",children:[e.jsx(Xe,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Descargar WAV Master"})]})]})]})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between text-xs font-medium",children:[e.jsx("span",{className:"text-slate-500 dark:text-slate-400",children:"Progreso general"}),e.jsxs("span",{className:"text-indigo-600 dark:text-indigo-400 font-mono font-bold",children:[l.progressPercent,"%"]})]}),e.jsx("div",{className:"w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800",children:e.jsx("div",{className:y("h-full transition-all duration-300",h?"bg-emerald-500":U?"bg-rose-500":"bg-gradient-to-r from-indigo-500 to-violet-500"),style:{width:`${Math.min(100,Math.max(0,l.progressPercent))}%`}})})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 mb-2",children:[e.jsxs("span",{className:"text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400",children:["Fragmentos del Audio (",l.completedChunks," / ",l.totalChunks,")"]}),e.jsx("span",{className:"text-[11px] text-slate-500 dark:text-slate-500",children:"Haz clic en un fragmento listo para preescucharlo"})]}),e.jsx("div",{className:"grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-18 gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/90 dark:border-slate-800/80 max-h-36 overflow-y-auto",children:l.chunks.map(E=>{const N=E.status==="completed",ae=E.status==="processing",F=E.status==="failed";return e.jsx("button",{type:"button",disabled:!N,onClick:()=>z(E),title:`Fragmento #${E.index+1}${E.wordCount?` (${E.wordCount} palabras)`:""}${N?` - ${E.durationSeconds||0}s [Haz clic para escuchar]`:""}`,className:y("h-7 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all border",N?"bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/30 cursor-pointer shadow-2xs":ae?"bg-indigo-500/25 text-indigo-700 dark:text-indigo-200 border-indigo-500/50 animate-pulse":F?"bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40":"bg-slate-200/60 dark:bg-slate-800/50 text-slate-500 border-slate-300/60 dark:border-slate-800 opacity-60"),children:N?e.jsx(da,{className:"w-3.5 h-3.5"}):ae?e.jsx(te,{className:"w-3.5 h-3.5 animate-spin"}):E.index+1},E.index)})})]}),l.failoverNotice&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2",children:[e.jsx(ds,{className:"w-4 h-4 text-amber-500 shrink-0"}),e.jsxs("span",{children:[e.jsx("strong",{children:"Rotación Automática 429:"})," ",l.failoverNotice]})]}),U&&l.error&&e.jsxs("div",{className:"p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2",children:[e.jsx(xt,{className:"w-4 h-4 text-rose-500 shrink-0"}),e.jsx("span",{children:l.error})]})]})}export{ns as WAPPY_GOOGLE_MODELS_ECOSYSTEM,ii as default};
