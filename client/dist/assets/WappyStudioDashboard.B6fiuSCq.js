import{r as l,j as e}from"./react-core.DnLkJYlj.js";import{e as Sr,b as Nr}from"./routing.G8zv3X9f.js";import{e$ as As,cj as Oe,hL as pt,h8 as Ce,cK as At,cM as Ca,gx as Pt,dG as q,cH as Ps,ct as Tr,cl as Pa,dn as zt,cp as sa,eO as Ms,dl as Ve,bY as Cr,df as Er,gc as $e,dI as Ar,f6 as tt,dc as Ye,d8 as Mt,fr as Ls,ew as Ma,d2 as Pr,c2 as Qt,dB as xt,ez as Rs,eA as Mr,fP as Lr,dt as Rr,ed as La,hx as ia,cx as Ra,ft as zr,hM as Vs,gM as rt,eb as Ir}from"./vendor.ymThUTsp.js";import{u as Dr,at as Or,al as Vr,c as y,O as $r,n as _r,l as b}from"./index.D5NpaZQY.js";import"./utilities.CCKZG3yh.js";import"./markdown_highlight.Cj_heSZW.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./locales.DGMWYUix.js";import"./i18n.CdklldLM.js";import"./radix-ui.B3pOguuS.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.DoEkx-OS.js";import"./animations.C_hnK10g.js";import"./virtualization.DFNzDgJG.js";import"./tanstack-vendor.CwIa5f5t.js";import"./headlessui.GXQjTZXk.js";import"./framer-motion.BJmkYMJm.js";import"./http-client.iLCs0KTW.js";import"./date-utils.X8D4nCrw.js";import"./forms.PdoLQ5-c.js";import"./security-ui.Bga5GGyP.js";import"./markdown-processing.CbkO59X1.js";import"./heic-converter.BhQCFQ0l.js";import"./canvas-templates.BS0AxzrQ.js";const Br="wappy-studio-media",Fr=1,na="blobs";let Lt=null;function Ur(){return Lt||(Lt=new Promise((c,x)=>{if(typeof indexedDB>"u"){x(new Error("IndexedDB no disponible en este navegador."));return}const u=indexedDB.open(Br,Fr);u.onupgradeneeded=()=>{const m=u.result;m.objectStoreNames.contains(na)||m.createObjectStore(na)},u.onsuccess=()=>c(u.result),u.onerror=()=>{Lt=null,x(u.error)}}),Lt)}function oa(c,x){return Ur().then(u=>new Promise((m,j)=>{const N=u.transaction(na,c),v=x(N.objectStore(na));v.onsuccess=()=>m(v.result),v.onerror=()=>j(v.error)}))}async function at(c,x){await oa("readwrite",u=>u.put(x,c))}async function ut(c){try{return await oa("readonly",u=>u.get(c))??null}catch{return null}}async function Hr(c){try{await oa("readwrite",x=>x.delete(c))}catch{}}async function Gr(){try{await oa("readwrite",c=>c.clear())}catch{}}function ea(c,x="audio/wav"){const u=c.replace(/^data:[^;]+;base64,/,""),m=window.atob(u),j=new Uint8Array(m.length);for(let N=0;N<m.length;N++)j[N]=m.charCodeAt(N);return new Blob([j],{type:x})}var Wr={};const zs=[{id:"gemini-3.8-flash",category:"Generación IA & Guiones",badge:"Principal 3.8",description:"Motor principal para generación de escenas HTML/GSAP y enriquecimiento de guiones."},{id:"gemini-3.6-flash",category:"Generación IA & Guiones",badge:"Estable 3.6",description:"Modelo rápido de alta precisión para código HTML5, Tailwind y estructura SST."},{id:"gemini-3.5-flash-lite",category:"Generación IA & Guiones",badge:"Ultra Ligero",description:"Baja latencia para respuestas instantáneas y estructuración rápida."},{id:"gemini-3.8-live",category:"Voz en Tiempo Real (Live)",badge:"Tenshi Live 3.8",description:"Interacción conversacional bidireccional de baja latencia en tiempo real."},{id:"gemini-3.1-flash-live-preview",category:"Voz en Tiempo Real (Live)",badge:"Live Preview 3.1",description:"Respaldo multimodal en vivo para sesiones de voz continua."},{id:"gemini-2.5-flash-native-audio-preview-12-2025",category:"Voz en Tiempo Real (Live)",badge:"Audio Nativo 2.5",description:"Audio nativo multimodal con soporte extendido de herramientas."},{id:"gemini-3.8-flash-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Recomendado (14 voces)",description:"Máxima expresividad, vocal bursts (<breath>, <laugh>) y las 14 voces activas."},{id:"gemini-3.1-flash-tts-preview",category:"Síntesis de Voz (TTS 24kHz)",badge:"Preview 3.1 (14 voces)",description:"Prosodia refinada y soporte completo para las 14 voces preconstruidas."},{id:"gemini-2.5-flash-preview-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Reemplazo 2.5 Pro (5 voces)",description:"Activa las 5 voces fundamentales (Kore, Puck, Charon, Fenrir, Aoede)."},{id:"gemini-3.8-flash-lite-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Ultra Rápido (6 voces)",description:"Lecturas masivas de baja latencia con 6 voces optimizadas."}],ta={"gemini-3.8-flash-tts":{id:"gemini-3.8-flash-tts",name:"Gemini 3.8 Flash TTS",badge:"Recomendado / Cuota Activa",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"✓ Activo (14 voces)",description:"Máxima fluidez natural, diseño de voz, vocal bursts (<breath>, <laugh>) y soporte para las 14 voces.",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-3.1-flash-tts-preview":{id:"gemini-3.1-flash-tts-preview",name:"Gemini 3.1 Flash TTS Preview",badge:"Preview 3.1 / Cuota Activa",badgeColor:"bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:"Arquitectura Gemini 3.1 con prosodia refinada, tono expresivo y respuesta ágil (14 voces).",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-2.5-flash-preview-tts":{id:"gemini-2.5-flash-preview-tts",name:"Gemini 2.5 Flash TTS",badge:"Reemplazo de 2.5 Pro",badgeColor:"bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",rateLimitLabel:"3 RPM • 10 RPD (2.5 Pro: 0/0)",quotaLabel:"5 voces",description:"Reemplazo oficial y funcional de 2.5 Pro (no disponible en API). Activa únicamente las 5 voces fundamentales.",supportsMultiSpeaker:!0,supportsVocalBursts:!1,supportedVoices:["Kore","Puck","Charon","Fenrir","Aoede"]},"gemini-3.8-flash-lite-tts":{id:"gemini-3.8-flash-lite-tts",name:"Gemini 3.8 Flash-Lite TTS",badge:"Ultra Rápido",badgeColor:"bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",rateLimitLabel:"Baja Latencia",quotaLabel:"6 voces",description:"Optimizado para lecturas masivas con mínima latencia continua (6 voces rápidas).",supportsMultiSpeaker:!1,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Aoede"]}},qr=[{id:"Kore",name:"Kore",gender:"Femenino",tone:"Cálida, Serena y Profesional",recommendedFor:"Audiolibros, Narración, Tutoriales, Inducción SST",tag:"Más popular"},{id:"Puck",name:"Puck",gender:"Masculino",tone:"Enérgico, Dinámico y Joven",recommendedFor:"Podcasts, Reels, Contenido Creativo, Diálogos",tag:"Muy expresivo"},{id:"Charon",name:"Charon",gender:"Masculino",tone:"Barítono, Grave, Maduro y Solemne",recommendedFor:"Documentales, Historia, Suspenso, Directivos",tag:"Voz profunda"},{id:"Fenrir",name:"Fenrir",gender:"Masculino",tone:"Claro, Elocuente y Periodístico",recommendedFor:"Noticias, Informes, Presentaciones, Boletines",tag:"Profesional"},{id:"Zephyr",name:"Zephyr",gender:"Femenino",tone:"Dulce, Aterciopelada y Relajante",recommendedFor:"Meditación, ASMR, Cuentos, Bienestar",tag:"Calma"},{id:"Orus",name:"Orus",gender:"Masculino",tone:"Firme, Imperial, Épico y Reflexivo",recommendedFor:"Ficción Épica, Liderazgo, Ensayos, Cultura Vial",tag:"Imperial"},{id:"Aoede",name:"Aoede",gender:"Femenino",tone:"Melódica, Expresiva, Artística y Cálida",recommendedFor:"Poesía, Literatura, Storytelling, Sensibilización",tag:"Melódica"},{id:"Leda",name:"Leda",gender:"Femenino",tone:"Cercana, Maternal, Madura y Envolvente",recommendedFor:"Audiolibros Largos, Relatos, Bienvenida",tag:"Narradora"},{id:"Callisto",name:"Callisto",gender:"Femenino",tone:"Elegante, Sofisticada y Articulada",recommendedFor:"Divulgación Científica, Conferencias, Auditorías",tag:"Sofisticada"},{id:"Europa",name:"Europa",gender:"Femenino",tone:"Brillante, Luminosa, Alegre y Asertiva",recommendedFor:"Marketing, Anuncios, E-Learning, Campañas",tag:"Enérgica"},{id:"Ganymede",name:"Ganymede",gender:"Masculino",tone:"Resonante, Equilibrado, Sabio y Seguro",recommendedFor:"Educación Superior, Cursos, Capacitación Técnica",tag:"Resonante"},{id:"Io",name:"Io",gender:"Femenino",tone:"Vivaz, Espontánea, Fresca y Amigable",recommendedFor:"Redes Sociales, Vlogs, Asistentes, Reels",tag:"Fresca"},{id:"Titan",name:"Titan",gender:"Masculino",tone:"Imponente, Cinematográfico y Potente",recommendedFor:"Tráilers, Introducciones, Impacto, Alertas",tag:"Cinematográfica"},{id:"Prometheus",name:"Prometheus",gender:"Masculino",tone:"Noble, Pensativo, Filosófico y Clásico",recommendedFor:"Filosofía, Análisis Profundo, Crónicas",tag:"Sabio"}],Yr=[{id:"orus-solemn",name:"Narración Solemne (Orus)",voiceName:"Orus",style:"Voz firme, templada, reflexiva y madura de narrador de crónica histórica, dicción solemne, pausas medidas y respiraciones naturales.",speed:"0.95x"},{id:"aoede-poetic",name:"Cuento Poético (Aoede)",voiceName:"Aoede",style:"Voz melódica, cálida, expresiva y artística para relato literario y sensibilización, con matices emocionales suaves.",speed:"0.95x"},{id:"titan-trailer",name:"Tráiler Cinematográfico (Titan)",voiceName:"Titan",style:"Voz imponente, profunda, cinematográfica y épica de tráiler de película, con pausas dramáticas e impacto.",speed:"0.95x"},{id:"kore-audiobook",name:"Narrador de Audiolibro (Kore)",voiceName:"Kore",style:"Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.",speed:"1.0x"},{id:"puck-podcast",name:"Host de Podcast Dinámico (Puck)",voiceName:"Puck",style:"Host de podcast carismático, enérgico, cercano y espontáneo, con entonación conversacional moderna.",speed:"1.05x"},{id:"charon-documentary",name:"Documental Profundo (Charon)",voiceName:"Charon",style:"Tono barítono, solemne, reflexivo y cinematográfico de narrador de documental, con pausas medidas.",speed:"0.95x"},{id:"fenrir-news",name:"Noticiero Profesional (Fenrir)",voiceName:"Fenrir",style:"Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.",speed:"1.05x"},{id:"zephyr-asmr",name:"Meditación y ASMR (Zephyr)",voiceName:"Zephyr",style:"Voz suave, serena, dulce y sumamente relajante para meditación guiada, mindfulness y bienestar.",speed:"0.9x"},{id:"screenplay-dialogue",name:"Guion / Diálogo Alex & Sam",voiceName:"Kore",multiSpeaker:!0,speaker1:{name:"Alex",voiceName:"Puck",style:"Entusiasta y curioso"},speaker2:{name:"Sam",voiceName:"Kore",style:"Experta, clara y cercana"},style:"Diálogo interactivo de podcast entre dos especialistas con alternancia natural.",speed:"1.0x"}],Kr=[{tag:"<breath>",label:"Respiración natural",description:"Inserta una toma de aire orgánica entre frases"},{tag:"<laugh>",label:"Risa / Carcajada",description:"Añade una risa espontánea o carcajada suave"},{tag:"<gasp>",label:"Sorpresa / Jadear",description:"Efecto de inhalación rápida de asombro"},{tag:"|mhm|",label:"Asentimiento (|mhm|)",description:"Confirmación conversacional natural"},{tag:"|yeah|",label:"Aceptación (|yeah|)",description:"Interjección de acuerdo en diálogos"}],Rt=[{title:"Inducción SST: 5 Reglas de Oro en Riesgo Eléctrico",text:`¡Atención equipo! Antes de intervenir cualquier tablero o red eléctrica, recuerda que tu vida depende de las Cinco Reglas de Oro. <breath>

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

Los expertos señalan que las primeras aplicaciones industriales comenzarán a desplegarse durante el próximo trimestre.`},{title:"Reel Viral Antigravity 60-FPS: Cómo WAPPY IA transforma el SG-SST",text:`¿Todavía llevas tu matriz de peligros y tus inspecciones en hojas de cálculo infinitas? <breath>

Mira cómo cambia todo cuando conectas Inteligencia Artificial en tiempo real. En menos de diez segundos, analizamos los riesgos bajo la guía GTC 45, generamos controles operativos y notificamos a cada trabajador en su celular. <breath>

Menos papeleo mecánico y más prevención real en planta. <laugh> Pruébalo hoy mismo en WAPPY Studio.`},{title:"Podcast Dual (Alex & Sam): El Futuro de la Prevención",text:`Alex: ¡Hola a todos y bienvenidos a un nuevo episodio de Pulso Preventivo! <breath> Hoy hablaremos sobre cómo las voces neuronales y el video interactivo están revolucionando las capacitaciones.

Sam: Totalmente de acuerdo, Alex. |yeah| Lo más impresionante es que los trabajadores ya no se aburren con diapositivas estáticas. <laugh> Ahora reciben cápsulas dinámicas con voz natural.

Alex: Exacto. |mhm| Además, podemos generar desde un reel de un minuto hasta un audiolibro formativo de una hora continua sin cortes.

Sam: Sin duda es un salto enorme para la cultura de seguridad en toda Latinoamérica.`},{title:"Pausa Activa & Regulación Emocional (Bienestar)",text:`Haz una pausa por un instante... y suelta los hombros. <breath>

Inhala profundamente por la nariz durante cuatro segundos, sintiendo cómo el aire renueva tu energía... <breath>

Ahora exhala suavemente, liberando la tensión acumulada frente a la pantalla. <breath>

Tu bienestar mental y físico es la base de un entorno laboral saludable y seguro.`}],Jr=[{id:"golden-rules",name:"🔥 Reel WAPPY + Félix 3D",badge:"Oficial GTC-45",description:"Multi-escena con Félix 3D lip-sync, Mockup celular, VS y tarjetas sincronizadas con la voz."},{id:"kpi-hud",name:"🚀 Ecosistema + Tenshi IA",badge:"Plataforma 40s",description:"Constelación IA, telemetría 3D en vivo, comparativa VS y tarjeta oráculo Tenshi."},{id:"alert-sst",name:"📜 Expediente & Reglas SST",badge:"Normativo",description:"Visor normativo con resaltador fluorescente, checklist secuencial 1-2-3 y radar."},{id:"camera-overlay",name:"🎬 Lower-Third (Video Propio)",badge:"Transparente",description:"Capas dinámicas por frase en tercio superior e inferior sin tapar tu rostro."}],st=[{id:"19-cover-2s",label:"19 Portada Magnética 2s 🔥 ¡GRATIS!",category:"Sonido & Portada",description:"Miniatura de alto impacto (0.0s-2.0s) con badge gigante ¡GRATIS! y gancho visual."},{id:"felix-voxel-3d",label:"Félix Voxel 3D Lip-Sync",category:"3D & Avatares",description:"Presentador Voxel 3D con camisa amarilla WAPPY, gestos y sincronía labial con el audio."},{id:"tenshi-3d",label:"Tenshi 3D",category:"3D & Avatares",description:"Oráculo IA flotante con halo esmeralda/cyan y telemetría reactiva."},{id:"01-orbit",label:"01 Órbita 3D",category:"3D & Avatares",description:"Anillo orbital 3D de insignias e iconos gravitatorios alrededor del concepto central."},{id:"02-frame-break",label:"02 Frame Break",category:"Transiciones Reels",description:"Ruptura de marco con profundidad 3D y desborde fuera de la tarjeta."},{id:"04-digital-zoom",label:"04 Digital Zoom",category:"Transiciones Reels",description:"Acercamiento táctico con retícula HUD y mira de precisión sobre datos críticos."},{id:"05-phone-mockup",label:"05 Mockup iPhone",category:"Elementos SST",description:"Celular 3D con Dynamic Island mostrando alertas y controles SST en vivo."},{id:"07-zoom-through",label:"07 Zoom-Through",category:"Transiciones Reels",description:"Transición inmersiva sin corte atravesando la escena hacia el siguiente punto."},{id:"08-chart-grow",label:"08 Chart Grow",category:"Elementos SST",description:"Barras e indicadores KPI que crecen dinámicamente con rebote spring."},{id:"10-glass-type",label:"10 Cristal 3D",category:"3D & Avatares",description:"Tipografía y tarjetas Glassmorphism con refracción translúcida y borde luminoso."},{id:"11-giro-3d",label:"11 Giro 3D",category:"Transiciones Reels",description:"Rotación en perspectiva Y/X con destello neón al cambiar de escena."},{id:"13-checklist-sst",label:"13 Checklist SST",category:"Elementos SST",description:"Lista secuencial 1-2-3 con verificación animada y sello de cumplimiento."},{id:"17-paper-cut",label:"17 Paper Cut",category:"Transiciones Reels",description:"Recorte editorial en capas con textura y sombra proyectada."},{id:"18-dolly-zoom",label:"18 Dolly Zoom",category:"Transiciones Reels",description:"Efecto vértigo cinematográfico contrayendo el fondo mientras destaca el titular."},{id:"visor-normativo",label:"Visor Normativo Subrayado",category:"Elementos SST",description:"Expediente legal (Decreto 1072 / Res. 0312) con resaltador fluorescente en vivo."},{id:"pentagono-gtc45",label:"Pentágono GTC-45",category:"Elementos SST",description:"Radar pentagonal de peligros y valoración de riesgos GTC-45."},{id:"sfx-pack",label:"SFX Whoosh+Pop+Ding",category:"Sonido & Portada",description:"Diseño sonoro sincronizado: whoosh en transiciones, pop en tarjetas y ding en checks."}],aa=[{id:"dark-tech-hud",label:"Dark Tech HUD",colors:"#0C192E + #00D4FF + #C7F303",description:"Fondo cósmico oscuro con HUD cian, verde lima eléctrico y tarjetas de cristal."},{id:"wappy-lima-oliva",label:"WAPPY Lima & Oliva",colors:"#C7F303 + #0E1300",description:"Identidad oficial wappy.club con alto contraste verde lima y negro oliva."},{id:"crema-editorial-sst",label:"Crema Editorial SST",colors:"#F6F5EF + #0D9488",description:"Estilo documental SST para Dummies con papel cálido, turquesa y subrayado."},{id:"cielo-wappy-cloud",label:"Cielo WAPPY Cloud",colors:"#5BB8F5 → #EAF6FE",description:"Atmósfera luminosa WAPPY Cloud con degradado celeste y tarjetas flotantes."}],Is=[{tag:"[pausa 0.5s]",label:"Pausa 0.5s",desc:"Breve silencio rítmico entre ideas"},{tag:"[pausa 1.0s]",label:"Pausa 1.0s",desc:"Pausa dramática de cambio de escena"},{tag:"[énfasis]",label:"Énfasis Vocal",desc:"Mayor fuerza e intención en la frase"},{tag:"<breath>",label:"Respiración <breath>",desc:"Toma de aire orgánica"},{tag:"<laugh>",label:"Risa <laugh>",desc:"Reacción cercana y carismática"},{tag:"<gasp>",label:"Sorpresa <gasp>",desc:"Inhalación de asombro o alerta"},{tag:"|mhm|",label:"Asentir |mhm|",desc:"Confirmación natural en diálogo"},{tag:"|yeah|",label:"Acuerdo |yeah|",desc:"Expresión dinámica de apoyo"}],Zr=[{id:"step-1",timeRange:"0.0s-2.0s",title:"Portada Magnética 🔥 ¡GRATIS!",narration:"¡Atención equipo! Tu vida depende de las Cinco Reglas de Oro en riesgo eléctrico. <breath>",visualEffect:"19 Portada Magnética 2s 🔥 ¡GRATIS!"},{id:"step-2",timeRange:"2.0s-8.0s",title:"Reglas 1 y 2: Corte Visible y Bloqueo LOTO",narration:"[pausa 0.5s] Primero: Cortar todas las fuentes de tensión. Segundo: Bloquear y etiquetar con tu candado personal LOTO. <breath>",visualEffect:"05 Mockup iPhone"},{id:"step-3",timeRange:"8.0s-16.0s",title:"Reglas 3 y 4: Ausencia de Tensión y Puesta a Tierra",narration:"[pausa 0.5s] Tercero: Verificar ausencia de tensión con detector calibrado. Cuarto: Poner a tierra y en cortocircuito. <breath>",visualEffect:"13 Checklist SST"},{id:"step-4",timeRange:"16.0s-24.0s",title:"Regla 5 y Cierre WAPPY IA",narration:"Y quinto: Delimitar y señalizar la zona de trabajo. En WAPPY IA cuidamos que regreses sano y salvo a casa.",visualEffect:"Félix Voxel 3D Lip-Sync"}];function Ea(c){try{const x=window.AudioContext||window.webkitAudioContext;if(!x)return;const u=new x,m=u.currentTime,j=u.createOscillator(),N=u.createGain();j.connect(N),N.connect(u.destination),c==="whoosh"?(j.type="sine",j.frequency.setValueAtTime(160,m),j.frequency.exponentialRampToValueAtTime(640,m+.14),j.frequency.exponentialRampToValueAtTime(95,m+.32),N.gain.setValueAtTime(.01,m),N.gain.linearRampToValueAtTime(.22,m+.12),N.gain.exponentialRampToValueAtTime(.001,m+.34),j.start(m),j.stop(m+.35)):c==="pop"?(j.type="triangle",j.frequency.setValueAtTime(320,m),j.frequency.exponentialRampToValueAtTime(780,m+.08),N.gain.setValueAtTime(.25,m),N.gain.exponentialRampToValueAtTime(.001,m+.11),j.start(m),j.stop(m+.12)):(j.type="sine",j.frequency.setValueAtTime(880,m),j.frequency.setValueAtTime(1318.5,m+.09),N.gain.setValueAtTime(.22,m),N.gain.exponentialRampToValueAtTime(.001,m+.45),j.start(m),j.stop(m+.46))}catch{}}function za(c,x=28){const u=Math.max(4,Number(x)||28),j=String(c||"").replace(/^(Alex|Sam|Hablante\s*\d+|Speaker\s*\d+):\s*/gim,"").trim().split(new RegExp("(?<=[.!?…])\\s+|\\n+|<breath>","gi")).map(T=>T.replace(/<[^>]+>/g,"").replace(/\|[^|]+\|/g,"").trim()).filter(Boolean);j.length===0&&j.push("Prevención inteligente y seguridad en el trabajo con WAPPY IA.");const N=[];for(let T=0;T<j.length;T++){const S=j[T];S.length<18&&T+1<j.length?j[T+1]=`${S} ${j[T+1]}`:N.push(S)}const v=7,Y=[];if(N.length<=v)Y.push(...N);else{const T=Math.ceil(N.length/v);for(let S=0;S<N.length;S+=T)Y.push(N.slice(S,S+T).join(" "))}const de=[],V=[];let R=0;const C=Y.map((T,S)=>{const ee=T.split(/\s+/).filter(Boolean).map(X=>{const A=X.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g,"").length;let ce=Math.max(2,A);return/[,;:]$/.test(X)&&(ce+=4),/[.!?…]$/.test(X)&&(ce+=9),{word:X,weight:ce}});ee.length>0&&(ee[ee.length-1].weight+=7);const ae=ee.reduce((X,A)=>X+A.weight,0)||10;return R+=ae,{text:T,bIdx:S,wList:ee,beatWeight:ae}}),re=["wave","pointLeft","pointRight","bothUp"],_=["lime","cyan","amber"];let we=0;for(let T=0;T<C.length;T++){const S=C[T],Z=we/Math.max(1,R),ee=(we+S.beatWeight)/Math.max(1,R),ae=Number((Z*u).toFixed(2)),X=Number((ee*u).toFixed(2)),A=Number(Math.max(.8,X-ae).toFixed(2));let ce=we;for(const G of S.wList){const K=ce/Math.max(1,R);ce+=G.weight;const Me=ce/Math.max(1,R);de.push({word:G.word,startPct:Number(K.toFixed(4)),endPct:Number(Me.toFixed(4)),beatIndex:T})}we+=S.beatWeight;const z=S.text.replace(/^[¡!¿?]+/,"").split(/\s+/).filter(Boolean),ke=S.text.indexOf(":");let te=T===0?"⚡ IMPACTO INICIAL • WAPPY IA":T===C.length-1?"🛡️ CIERRE EJECUTIVO • SOMOS SST":`PUNTO CLAVE 0${T}`;/^(primero|1\b)/i.test(S.text)?te="⚡ REGLA DE ORO 01":/^(segundo|2\b)/i.test(S.text)?te="🔒 REGLA DE ORO 02":/^(tercero|3\b)/i.test(S.text)?te="📡 REGLA DE ORO 03":/^(cuarto|4\b)/i.test(S.text)?te="🛡️ REGLA DE ORO 04":/^(quinto|5\b)/i.test(S.text)&&(te="🚨 REGLA DE ORO 05");let Ee=z.slice(0,Math.min(5,z.length));if(ke>0&&ke<16){const G=S.text.slice(ke+1).trim().split(/\s+/).filter(Boolean);G.length>=2&&(Ee=G.slice(0,Math.min(5,G.length)))}const f=Math.max(1,Math.ceil(Ee.length*.55)),w=Ee.slice(0,f).join(" ").replace(/[,;:.!?]+$/,""),g=Ee.slice(f).join(" ").replace(/[,;:.!?]+$/,"")||"WAPPY IA",P=S.text.toLowerCase();let B="bolt";/bloqueo|tarjeteo|candado|loto|aislar/.test(P)?B="lock":/verificar|ausencia|medir|auditor|inspecci|radar|pose|telemetr/.test(P)?B="radar":/tierra|cortocircuito|protecci|epp|casco|seguridad|prevenci/.test(P)?B="shield":/señalizar|delimitar|alerta|peligro|error|riesgo/.test(P)?B="alert":/matriz|gtc|excel|informe|indicador|semana|minuto/.test(P)&&(B="chart"),V.push({index:T+1,text:S.text,startSec:ae,endSec:X,durationSec:A,startPct:Number(Z.toFixed(4)),endPct:Number(ee.toFixed(4)),badge:te,titleLead:w,titleHighlight:g,pillColor:_[T%_.length],iconType:B,gesture:re[T%re.length]})}return{beats:V,wordTimings:de,totalDurationSeconds:u}}function Xr(c,x){return c==="lock"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="12" y="28" width="40" height="28" rx="8" fill="${x}" fill-opacity="0.22" stroke="${x}" stroke-width="2.8"/>
      <path d="M20 28V20C20 13.3726 25.3726 8 32 8C38.6274 8 44 13.3726 44 20V28" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="42" r="4" fill="#c7f303"/>
    </svg>`:c==="radar"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <circle cx="32" cy="32" r="24" fill="${x}" fill-opacity="0.16" stroke="${x}" stroke-width="2.5" stroke-dasharray="6 4"/>
      <circle cx="32" cy="32" r="14" stroke="#c7f303" stroke-width="2" stroke-opacity="0.7"/>
      <path d="M32 32L48 18" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="4" fill="#c7f303"/>
    </svg>`:c==="shield"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 6L10 15V31C10 45.5 19.4 57.6 32 61C44.6 57.6 54 45.5 54 31V15L32 6Z" fill="${x}" fill-opacity="0.2" stroke="${x}" stroke-width="2.8"/>
      <path d="M22 33L29 40L43 25" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`:c==="alert"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 8L6 54H58L32 8Z" fill="#f59e0b" fill-opacity="0.22" stroke="#f59e0b" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M32 24V38" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round"/>
      <circle cx="32" cy="46" r="2.8" fill="#c7f303"/>
    </svg>`:c==="chart"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="10" y="34" width="10" height="20" rx="3" fill="${x}" fill-opacity="0.35" stroke="${x}" stroke-width="2"/>
      <rect x="27" y="22" width="10" height="32" rx="3" fill="${x}" fill-opacity="0.55" stroke="${x}" stroke-width="2"/>
      <rect x="44" y="12" width="10" height="42" rx="3" fill="#c7f303" fill-opacity="0.85" stroke="#c7f303" stroke-width="2"/>
    </svg>`:`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
    <circle cx="32" cy="32" r="25" fill="${x}" fill-opacity="0.16" stroke="${x}" stroke-width="2"/>
    <path d="M35 8L14 35H31L28 56L50 28H33L35 8Z" fill="#c7f303" stroke="#c7f303" stroke-width="2" stroke-linejoin="round"/>
  </svg>`}function Ds({aspectRatio:c="9:16",hasBaseVideo:x=!1,badgeText:u="ECOSISTEMA IA • SG-SST",headline:m="5 Reglas de Oro en Seguridad",subheadline:j="Prevención inteligente en tiempo real con WAPPY Studio",accentColor:N="#14b8a6",templateId:v="golden-rules",scriptText:Y="",durationSeconds:de=28}){var X,A,ce;const V=c==="9:16",R=(u||"ECOSISTEMA IA • SG-SST").replace(/</g,"&lt;"),C=(m||"Prevención Inteligente WAPPY IA").replace(/</g,"&lt;"),re=(j||"Sincronización neural en vivo").replace(/</g,"&lt;"),_=x||v==="camera-overlay",we=(Y||"").trim()||`${C}. ${re}. Primero: Identifica y controla los peligros críticos en terreno. Segundo: Verifica cada protocolo con inteligencia artificial. Tercero: Protege la vida de tu equipo con WAPPY IA.`,T=za(we,de),S=T.beats,Z=z=>z==="cyan"?"background:linear-gradient(135deg,#06b6d4,#14b8a6);color:#041318;box-shadow:0 0 22px rgba(6,182,212,0.45);":z==="amber"?"background:linear-gradient(135deg,#f97316,#f59e0b);color:#180902;box-shadow:0 0 22px rgba(245,158,11,0.45);":"background:#c7f303;color:#0a1103;box-shadow:0 0 24px rgba(199,243,3,0.5);",ee=S.map((z,ke)=>{const te=ke===0,Ee=ke===S.length-1,f=z.text.replace(/</g,"&lt;"),w=(te&&m?C.split(/\s+/).slice(0,3).join(" "):z.titleLead).replace(/</g,"&lt;"),g=(te&&m&&m.split(/\s+/).length>3?m.split(/\s+/).slice(3).join(" "):z.titleHighlight).replace(/</g,"&lt;"),P=Xr(z.iconType,N);return v==="camera-overlay"?`
        <div id="scene-${z.index}" class="scene-layer ${te?"":"opacity-0 pointer-events-none"} absolute inset-x-0 bottom-2 flex flex-col justify-end">
          <div data-editable="true" class="sc-card glass-card rounded-2xl p-3.5 sm:p-4 border-l-4" style="border-left-color:#c7f303;">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-[10px] font-mono uppercase tracking-widest text-[#c7f303] font-extrabold">${z.badge}</span>
              <span class="text-[10px] font-mono text-teal-300 font-bold">ESCENA 0${z.index}/0${S.length}</span>
            </div>
            <div class="flex items-center gap-3">
              ${P}
              <div>
                <h2 class="text-base sm:text-lg font-black text-white leading-tight font-display">
                  ${w} <span class="inline-block px-2 py-0.5 rounded-lg" style="${Z(z.pillColor)}">${g}</span>
                </h2>
                <p class="text-xs text-slate-200 mt-1 leading-snug">${f}</p>
              </div>
            </div>
          </div>
        </div>`:te?`
        <div id="scene-1" class="scene-layer absolute inset-0 flex flex-col justify-center gap-2.5 sm:gap-3">
          <div data-editable="true" class="sc-head text-center space-y-1.5">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span class="w-2 h-2 rounded-full bg-[#c7f303] animate-ping"></span>
              <span>${z.badge}</span>
            </div>
            <h1 class="${V?"text-2xl sm:text-3xl":"text-xl sm:text-2xl"} font-black tracking-tight text-white leading-none font-display">
              ${w} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${Z("amber")}">${g}</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-200 font-semibold max-w-md mx-auto leading-snug">${f}</p>
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
                  <div class="text-xs sm:text-sm font-black text-white truncate">Estándar Verificado ${R}</div>
                  <div class="text-[11px] text-emerald-200/95 leading-tight">${re}</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#c7f303] text-[#091004] text-[9px] font-mono font-black shrink-0">100% SEGURO</span>
            </div>
          </div>
        </div>`:ke===1&&S.length>=3?`
        <div id="scene-${z.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>• ${z.badge}</span>
            </div>
            <h2 class="${V?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black text-white leading-tight font-display">
              ${w} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${Z("cyan")}">${g}</span>
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
                  ${P}
                  <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#c7f303] text-[8px] font-mono font-bold">ACTIVO</span>
                </div>
                <div class="my-1.5">
                  <div class="text-[9px] font-mono uppercase text-cyan-300 font-bold">VERIFICACIÓN IA</div>
                  <div class="text-xs font-black text-white leading-tight mt-0.5">${w} ${g}</div>
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
                <p class="text-xs font-bold text-white leading-snug">${f}</p>
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
        </div>`:Ee&&S.length>=2?`
        <div id="scene-${z.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#c7f303]/20 border border-[#c7f303]/50 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>${z.badge}</span>
            </div>
            <h2 class="${V?"text-2xl sm:text-3xl":"text-xl sm:text-2xl"} font-black text-white leading-none font-display">
              ${w} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${Z("lime")}">${g}</span>
            </h2>
          </div>

          <div data-editable="true" class="sc-item glass-card rounded-3xl p-4 border-2 border-[#c7f303]/60 text-center space-y-2.5" style="box-shadow:0 0 35px rgba(199,243,3,0.18);">
            <div class="flex justify-center">${P}</div>
            <p class="text-xs sm:text-sm font-extrabold text-white leading-relaxed">${f}</p>
            <div class="pt-1 flex flex-wrap items-center justify-center gap-2">
              <span class="px-3 py-1 rounded-xl bg-[#c7f303] text-[#091004] text-[10px] font-black uppercase tracking-wider">⚡ WAPPY IA • SOMOS SST</span>
              <span class="px-3 py-1 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-mono font-bold">✓ CERO ACCIDENTES</span>
            </div>
          </div>
        </div>`:`
      <div id="scene-${z.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
        <div data-editable="true" class="sc-head text-center space-y-1">
          <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-500/15 border border-teal-400/40 text-teal-300 text-[10px] font-mono font-extrabold uppercase tracking-widest">
            <span>• ${z.badge} • PASO 0${z.index}</span>
          </div>
          <h2 class="${V?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black text-white leading-tight font-display">
            ${w} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${Z(z.pillColor)}">${g}</span>
          </h2>
        </div>

        <div data-editable="true" class="sc-item glass-card rounded-3xl p-3.5 sm:p-4 border-l-4" style="border-left-color:#c7f303;">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-2xl bg-slate-900/90 border border-white/10 shrink-0">
              ${P}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-[10px] font-mono uppercase tracking-wider text-[#c7f303] font-extrabold">PROTOCOLO VERIFICADO</span>
                <span class="text-[10px] font-mono font-bold text-emerald-400">NIVEL ÓPTIMO • 100%</span>
              </div>
              <p class="text-xs sm:text-sm font-bold text-white leading-relaxed">${f}</p>
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
`),ae=_?"":v==="kpi-hud"?`
      <!-- TARJETA INFERIOR ORÁCULO TENSHI IA (Estilo WAPPY_IA_Plataforma_40s) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${V?"max-w-md":"max-w-2xl"} mx-auto glass-card rounded-2xl p-2.5 px-3.5 border border-teal-400/35 flex items-center gap-3 shrink-0">
        <div class="relative w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-teal-500/30 to-emerald-500/20 border border-[#c7f303]/60 shrink-0 flex items-center justify-center">
          <img src="/assets/wappy/tenshi.png" alt="Tenshi IA" class="w-full h-full object-cover" onerror="this.style.display='none'" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono font-extrabold uppercase tracking-wider text-teal-300">TENSHI • ORIENTADOR Y ORQUESTADOR SST</span>
            <span class="text-[9px] font-mono text-[#c7f303] font-bold">EN VIVO</span>
          </div>
          <p id="host-live-caption" class="text-xs font-bold text-white truncate mt-0.5">${((X=S[0])==null?void 0:X.text.replace(/</g,"&lt;"))||re}</p>
        </div>
      </div>`:`
      <!-- PRESENTADOR FÉLIX 3D VOXEL CON LIP-SYNC Y GESTOS (Estilo Reel Matriz GTC-45 Oficial) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${V?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-center gap-3 shrink-0">
        <canvas id="wappy-felix-voxel" width="150" height="126" class="${V?"w-[122px] h-[102px]":"w-[96px] h-[80px]"} shrink-0 drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"></canvas>
        <div class="glass-card rounded-2xl p-2.5 px-3 border border-[#c7f303]/40 flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1.5 mb-0.5">
            <span id="host-live-badge" class="text-[9px] font-mono font-black uppercase tracking-wider text-[#c7f303]">${((A=S[0])==null?void 0:A.badge)||"WAPPY IA • SOMOS SST"}</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          </div>
          <p id="host-live-caption" class="text-[11px] font-bold text-slate-100 line-clamp-2 leading-snug">${((ce=S[0])==null?void 0:ce.text.replace(/</g,"&lt;"))||re}</p>
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
      background: ${_?"transparent":"#050c12"};
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
<body class="relative w-full h-full flex flex-col justify-between items-center ${V?"p-3.5 sm:p-4":"p-3.5 sm:p-5"} select-none overflow-hidden">
  <!-- Barra superior de progreso Verde Lima WAPPY -->
  <div class="absolute top-0 left-0 right-0 h-1 bg-slate-900/80 z-30 overflow-hidden">
    <div id="wappy-top-progress" class="h-full bg-gradient-to-r from-[#c7f303] via-[#14b8a6] to-[#06b6d4]" style="width: 8%;"></div>
  </div>

  ${_?"<!-- Fondo transparente para video base del usuario -->":`<div class="absolute inset-0 overflow-hidden pointer-events-none">
           <div class="absolute inset-0 grid-bg"></div>
           <canvas id="wappy-bg-canvas" class="absolute inset-0 w-full h-full opacity-75"></canvas>
           <div id="orb-1" class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-30" style="background: ${N};"></div>
           <div id="orb-2" class="absolute bottom-8 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25" style="background: #c7f303;"></div>
         </div>`}

  <!-- TOP HUD TÁCTICO WAPPY (Ecualizador + Insignia + Radar Holográfico) -->
  <div id="header-hud" data-editable="true" class="relative z-10 w-full ${V?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-between gap-2 shrink-0 pt-1">
    <div class="glass-card px-3 py-1.5 rounded-full inline-flex items-center gap-2 whitespace-nowrap border border-teal-500/30">
      <div class="flex items-end gap-0.5 h-3.5" id="hud-eq">
        <span class="eq-bar w-1 bg-cyan-400 rounded-full" style="height:60%"></span>
        <span class="eq-bar w-1 bg-[#c7f303] rounded-full" style="height:100%"></span>
        <span class="eq-bar w-1 bg-teal-400 rounded-full" style="height:45%"></span>
        <span class="eq-bar w-1 bg-cyan-300 rounded-full" style="height:80%"></span>
      </div>
      <span class="text-[10px] font-extrabold tracking-widest uppercase text-teal-300">${R}</span>
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
  <div id="scenes-wrapper" class="relative z-10 my-auto w-full ${V?"max-w-md min-h-[270px]":"max-w-2xl min-h-[210px]"} mx-auto flex-1 flex flex-col justify-center">
    ${ee}
  </div>

  ${ae}

  <!-- ESPACIO INFERIOR RESERVADO PARA SUBTÍTULOS DINÁMICOS -->
  <div class="relative z-10 ${V?"h-12":"h-10"} shrink-0 w-full"></div>

  <script>
    window.__wappyTimelineBeats = ${JSON.stringify(S)};
    window.__wappyWordTimings = ${JSON.stringify(T.wordTimings)};
    window.__wappyVoicePlaying = true;
    window.__wappyCurrentGesture = 'wave';

    (function() {
      var beats = window.__wappyTimelineBeats || [];
      var totalDur = ${T.totalDurationSeconds};
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
</html>`}function Qr(c){if(!c)return"";if(c.includes('id="wappy-studio-runtime-bridge"'))return c;const x=`<script id="wappy-studio-gsap-hook">
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
<\/script>`,u=`<style id="wappy-studio-bridge-styles">
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
<\/script>`;let m=c.replace(/subtitles\.reverse\(\)/g,"subtitles.slice().reverse()");return m.includes("<head>")?m=m.replace("<head>",`<head>
${x}`):m=`${x}
${m}`,m.includes("</body>")?m=m.replace("</body>",`${u}
</body>`):m=`${m}
${u}`,m}const Aa="wappy_studio_audio_library",ra="wappy_gemini_api_keys";function Ia(){try{const c=localStorage.getItem(ra);if(!c)return[];let x;try{x=JSON.parse(c)}catch{x=c.split(",")}return typeof x=="string"&&(x=x.split(",")),Array.isArray(x)?x.map((u,m)=>typeof u=="string"?{key:u.trim(),label:`Clave #${m+1}`,status:"unchecked"}:u&&typeof u.key=="string"?{key:u.key.trim(),label:u.label||`Clave #${m+1}`,status:u.status||"unchecked"}:null).filter(u=>!!(u&&u.key)):[]}catch{return[]}}function H(c){const x=c||localStorage.getItem("token")||"",u=Ia().map(m=>m.key.trim()).filter(m=>m.length>15).join(",");return{"Content-Type":"application/json",...x?{Authorization:`Bearer ${x}`}:{},...u?{"x-gemini-api-keys":u}:{}}}async function be(c){const x=await c.text();try{return JSON.parse(x)}catch{throw c.status===401||x.trim()==="Unauthorized"?new Error("Tu sesión está actualizándose. Intenta nuevamente en un segundo."):new Error(x.slice(0,180)||`Error del servidor (${c.status})`)}}function ei(c){const x=Math.max(1,Math.round(c||0)),u=Math.floor(x/60),m=x%60;return`${u}m ${m}s`}function ti(c){try{return new Date(c).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return""}}function Ai({portable:c=!1}={}){var Ts;const{user:x,token:u,isAuthenticated:m}=Dr(),{data:j}=Or(),N=Sr(),v=(N==null?void 0:N.navVisible)??!0,Y=(N==null?void 0:N.setNavVisible)??(()=>{}),[de,V]=Nr(),R=de.get("tab")||"tts",[C,re]=l.useState(["tts","video","lab","library"].includes(R)?R:"tts"),[_,we]=l.useState(()=>{var t,a;return((a=(t=x==null?void 0:x.personalization)==null?void 0:t.geminiModels)==null?void 0:a.sstManagement)||(Wr.GOOGLE_MODELS||"gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite").split(",")[0].trim()||"gemini-3.8-flash"}),[T,S]=l.useState(!1),[Z,ee]=l.useState("keys"),[ae,X]=l.useState(()=>Object.values(ta)),[A,ce]=l.useState(()=>qr),[z,ke]=l.useState(()=>Yr),[te,Ee]=l.useState(()=>Kr),[f,w]=l.useState("gemini-3.8-flash-tts"),[g,P]=l.useState("Kore"),[B,G]=l.useState("Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido."),[K,Me]=l.useState(!1),[Le,Da]=l.useState("Puck"),[Re,Oa]=l.useState("Kore"),[ze,Va]=l.useState(150),[E,Ie]=l.useState(Rt[0].text),[mt,$s]=l.useState("Voz expresiva, tono conversacional y alegre."),[je,la]=l.useState("Hola. Hoy quiero demostrarte cómo suena una respiración natural <breath> y cómo reacciono con una pequeña risa <laugh> cuando algo resulta verdaderamente sorprendente."),[da,$a]=l.useState(!1),[_s,_a]=l.useState(null),[ca,Bs]=l.useState(0),[Fs,Us]=l.useState(0),[It,Dt]=l.useState(.5),[bt,Ot]=l.useState(1),[pa,Ba]=l.useState(!1),[Fa,Ua]=l.useState(!1),[ua,Ha]=l.useState(null),[se,ye]=l.useState(null),gt=l.useRef(null),[Vt,Hs]=l.useState("all"),[$t,Ga]=l.useState("only_active"),[xa,Gs]=l.useState(""),[ma,Ws]=l.useState(!0),[d,ie]=l.useState(null),[Se,it]=l.useState(()=>{try{const t=localStorage.getItem(Aa);return t?JSON.parse(t):[]}catch{return[]}}),[I,ba]=l.useState("9:16"),[nt,qs]=l.useState("golden-rules"),[Ke,Wa]=l.useState("bottom"),[qa,Ya]=l.useState(!1),[Q,Ka]=l.useState(null),[Ja,Za]=l.useState(""),[_t,Ys]=l.useState(!1),[Je,Xa]=l.useState(null),[Qa,es]=l.useState(""),[ve,ts]=l.useState(!0),[ft,Ks]=l.useState("CÁPSULA INTERACTIVA WAPPY"),[_e,Js]=l.useState("5 Reglas de Oro en Riesgo Eléctrico"),[ht,Zs]=l.useState("Prevención inteligente y locución neural sincronizada"),[yt,Xs]=l.useState("#14b8a6"),[Ze,as]=l.useState("dark-tech-hud"),[Ne,Qs]=l.useState(["19-cover-2s","felix-voxel-3d","05-phone-mockup","07-zoom-through","13-checklist-sst","sfx-pack"]),[pe,Ae]=l.useState(()=>Zr),[Bt,er]=l.useState(!0),[ga,ss]=l.useState(!1),[Xe,Ft]=l.useState("Crea una animación cinematográfica con el Motor Antigravity 60-FPS y tarjetas de cristal WAPPY IA sobre las 5 reglas de oro de riesgo eléctrico, con Portada Magnética 2s 🔥 ¡GRATIS!, Félix Voxel 3D lip-sync, iconos luminosos y barras de progreso."),[Ut,rs]=l.useState(!1),[vt,tr]=l.useState(""),[fa,is]=l.useState(!1),[ha,ar]=l.useState("all"),[Ht,sr]=l.useState(!1),[Be,Fe]=l.useState(()=>Ds({aspectRatio:"9:16",hasBaseVideo:!1,badgeText:"ECOSISTEMA IA • SG-SST",headline:"5 Reglas de Oro en Riesgo Eléctrico",subheadline:"Prevención inteligente y locución neural sincronizada",accentColor:"#14b8a6",templateId:"golden-rules",scriptText:Rt[0].text,durationSeconds:28})),[Pe,De]=l.useState(!0),[Qe,Te]=l.useState(0),[D,et]=l.useState(20),[ya,rr]=l.useState(!1),[ne,Gt]=l.useState(!1),[ue,va]=l.useState(null),xe=l.useRef(""),[wt,ns]=l.useState(!1),[kt,Wt]=l.useState(!1),[ot,k]=l.useState(null),[ir,jt]=l.useState(!1),[qt,Yt]=l.useState(()=>{const t=Ia();return[t[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},t[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},t[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}]}),[wa,os]=l.useState(!1),[ls,St]=l.useState(""),Ue=l.useMemo(()=>qt.filter(t=>t.key.trim().length>15).length,[qt]);l.useEffect(()=>{const t=()=>{const s=Ia();Yt([s[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},s[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},s[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}])},a=s=>{s.key===ra&&t()};return window.addEventListener("wappy-keys-updated",t),window.addEventListener("storage",a),()=>{window.removeEventListener("wappy-keys-updated",t),window.removeEventListener("storage",a)}},[]);const nr=async()=>{os(!0),St("");try{const t=[...qt];let a=0;for(let r=0;r<t.length;r++){const n=t[r].key.trim();if(!n){t[r]={...t[r],key:"",status:"unchecked"};continue}try{const i=await fetch("/api/studio/keys-validate",{method:"POST",headers:H(u),body:JSON.stringify({apiKey:n})}),o=await i.json().catch(()=>({}));i.ok&&o.valid?(t[r]={...t[r],key:n,status:"valid"},a++):t[r]={...t[r],key:n,status:"invalid"}}catch{t[r]={...t[r],key:n,status:"unchecked"}}}Yt(t);const s=t.filter(r=>r.key.trim().length>0);localStorage.setItem(ra,JSON.stringify(s)),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),St(s.length===0?"Claves personalizadas limpiadas. Se utilizarán las claves del servidor WAPPY.":`¡Guardadas ${s.length} clave(s) (${a} verificada(s) en vivo con Google Gemini)!`)}finally{os(!1)}},M=l.useRef(null),oe=l.useRef(null),le=l.useRef(null),ds=l.useRef(null),or=l.useMemo(()=>Qr(Be),[Be]);l.useEffect(()=>{const t=()=>{const a=!!document.fullscreenElement;rr(a),setTimeout(()=>{var s,r;(r=(s=M.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},80),setTimeout(()=>{var s,r;(r=(s=M.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},300)};return document.addEventListener("fullscreenchange",t),()=>document.removeEventListener("fullscreenchange",t)},[]),l.useEffect(()=>{const t=a=>{const s=a.data||{};s.type==="STUDIO_ELEMENT_SELECTED"?va(s.payload||null):s.type==="STUDIO_HTML_UPDATED"&&typeof s.htmlCode=="string"&&(xe.current=s.htmlCode)};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[]),l.useEffect(()=>{const t=Se.slice(0,60);try{localStorage.setItem(Aa,JSON.stringify(t))}catch{try{localStorage.setItem(Aa,JSON.stringify(t.map(({audioBase64:a,...s})=>s)))}catch{}}},[Se]),l.useEffect(()=>{const t=Se.filter(a=>a.audioBase64&&!a.mediaKey);t.length!==0&&(async()=>{const a={};for(const s of t)try{const r=`audio-${s.id}`;await at(r,ea(s.audioBase64)),a[s.id]=r}catch{}Object.keys(a).length!==0&&it(s=>s.map(r=>a[r.id]?{...r,mediaKey:a[r.id],audioBase64:void 0}:r))})()},[]);const ka=l.useRef(null),cs=t=>{ka.current&&URL.revokeObjectURL(ka.current);const a=URL.createObjectURL(t);return ka.current=a,a},Kt=async(t,a)=>{const s=`audio-${t.id}`;let r=null;try{if(a.base64)r=ea(a.base64);else if(a.url){const i=await fetch(a.url,{headers:H(u)});i.ok&&(r=await i.blob())}r&&await at(s,r)}catch{r=null}const n=r?{...t,kind:t.kind||"audio",mediaKey:s,audioBase64:void 0}:{...t,kind:t.kind||"audio",audioBase64:a.base64};return it(i=>[n,...i.filter(o=>o.id!==t.id)]),r?s:void 0},ps=async t=>{if(t.mediaKey){const a=await ut(t.mediaKey);if(a)return a}if(t.audioBase64)return ea(t.audioBase64);if(t.downloadUrl)try{const a=await fetch(t.downloadUrl,{headers:H(u)});if(a.ok){const s=await a.blob(),r=`audio-${t.id}`;return at(r,s).then(()=>it(n=>n.map(i=>i.id===t.id?{...i,mediaKey:r}:i))).catch(()=>{}),s}}catch{}return null},us=async(t,a=!1)=>{const s=await ps(t);return s?(ie({url:cs(s),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey||`audio-${t.id}`}),t.durationSeconds&&t.durationSeconds>1&&et(t.durationSeconds),a&&ge("video"),!0):(k({type:"error",text:"Este audio se generó antes de activar el guardado permanente y el servidor ya lo liberó (se reinició). Vuelve a generarlo: desde ahora todos los audios quedan guardados en tu navegador."}),!1)},Jt=(t,a)=>{const s=URL.createObjectURL(t),r=document.createElement("a");r.href=s,r.download=a,document.body.appendChild(r),r.click(),document.body.removeChild(r),setTimeout(()=>URL.revokeObjectURL(s),4e3)},lr=t=>{it(a=>{const s=a.filter(n=>n.id!==t.id);return[t.mediaKey,t.htmlKey,t.mp4Key,t.capsuleKey].filter(Boolean).forEach(n=>{s.some(o=>[o.mediaKey,o.htmlKey,o.mp4Key,o.capsuleKey].includes(n))||Hr(n)}),s})};l.useEffect(()=>{var a;const t=(a=j==null?void 0:j[Vr.google])==null?void 0:a.models;if(Array.isArray(t)&&t.length>0){const s=t.map(r=>(typeof r=="string"?r:(r==null?void 0:r.id)||(r==null?void 0:r.value)||"").replace("models/","").trim()).filter(r=>r&&r.includes("tts"));s.length>0&&X(r=>{const n=new Map(r.map(p=>[p.id,p])),i=Object.keys(ta);return Array.from(new Set([...i,...s])).map(p=>ta[p]||n.get(p)||{id:p,name:p,badge:"GOOGLE_MODELS",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:`Modelo TTS cargado desde GOOGLE_MODELS (${p}).`,supportsMultiSpeaker:!p.includes("lite"),supportsVocalBursts:!p.includes("2.5"),supportedVoices:ta["gemini-3.8-flash-tts"].supportedVoices})})}},[j]),l.useEffect(()=>{fetch("/api/studio/catalog",{headers:H(u)}).then(t=>t.ok?t.json():null).then(t=>{t&&(Array.isArray(t.models)&&t.models.length>0&&X(t.models),Array.isArray(t.voices)&&t.voices.length>0&&ce(t.voices),Array.isArray(t.presets)&&t.presets.length>0&&ke(t.presets),Array.isArray(t.vocalBursts)&&t.vocalBursts.length>0&&Ee(t.vocalBursts))}).catch(()=>{})},[u]),l.useEffect(()=>{const t=E.trim(),a=t?t.split(/\s+/).filter(Boolean).length:0;if(Bs(a),Us(t.length),!t){Dt(0),Ot(0);return}const s=setTimeout(()=>{fetch("/api/studio/tts/estimate",{method:"POST",headers:H(u),body:JSON.stringify({text:t,maxWordsPerChunk:ze})}).then(r=>r.ok?r.json():null).then(r=>{r&&typeof r.estimatedMinutes=="number"?Dt(r.estimatedMinutes):Dt(Math.round(a/145*10)/10),r&&typeof r.chunkCount=="number"?Ot(r.chunkCount):Ot(Math.max(1,Math.ceil(a/ze)))}).catch(()=>{Dt(Math.round(a/145*10)/10),Ot(Math.max(1,Math.ceil(a/ze)))})},250);return()=>clearTimeout(s)},[E,ze,u]);const ge=t=>{re(t),V({tab:t})};l.useEffect(()=>{const t=a=>{const s=a.detail;["tts","video","lab","library"].includes(s)&&ge(s)};return window.addEventListener("wappy-studio-switch-tab",t),()=>window.removeEventListener("wappy-studio-switch-tab",t)},[]);const $=l.useMemo(()=>ae.find(t=>t.id===f)||ae[0],[ae,f]),lt=t=>$!=null&&$.supportedVoices?$.supportedVoices.includes(t):!0,dr=l.useMemo(()=>A.filter(t=>{const a=lt(t.id),s=$t==="all"||a,r=Vt==="all"||t.gender===Vt,n=xa.trim().toLowerCase(),i=!n||t.name.toLowerCase().includes(n)||t.tone.toLowerCase().includes(n)||t.recommendedFor.toLowerCase().includes(n)||t.tag&&t.tag.toLowerCase().includes(n);return s&&r&&i}),[A,$,$t,Vt,xa]),xs=async(t,a)=>{a==null||a.stopPropagation();try{Ha(t);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({voiceName:t,model:lt(t)?f:"gemini-3.8-flash-tts",text:`Hola, soy ${t}. Esta es una muestra de voz neural en WAPPY Studio para tus cápsulas y cursos.`})}),r=await be(s);if(!s.ok||!r.success)throw new Error(r.error||"No se pudo sintetizar la muestra.");ie({base64:r.audioBase64,title:`Muestra de Voz: ${t}`,durationSeconds:r.durationSeconds,voiceName:t})}catch(s){k({type:"error",text:s.message||"Error en audición de voz."})}finally{Ha(null)}},cr=async()=>{try{Ua(!0),k(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({voiceName:g,model:f,text:"¡Conexión verificada con éxito! El motor de voz Gemini 3.8 Flash TTS en WAPPY Studio está listo."})}),a=await be(t);if(!t.ok||!a.success)throw new Error(a.error||"Error probando conexión.");ie({base64:a.audioBase64,title:`Prueba de Conexión (${g})`,durationSeconds:a.durationSeconds,voiceName:g}),k({type:"success",text:`¡Conexión activa con ${a.usedModel||f}! Audio sintetizado correctamente.`})}catch(t){k({type:"error",text:t.message||"Error de conexión con Gemini TTS."})}finally{Ua(!1)}},pr=async()=>{if(!E.trim())return;const t=E.trim().slice(0,850),a=t.split(/\s+/).filter(Boolean).length,s=Math.max(3,Math.round(a/145*60)),r=`preview_${Date.now()}`;try{Ba(!0),k(null),ye({id:r,status:"processing",totalChunks:1,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:s,generatedTotalSeconds:0,progressPercent:0,chunks:[{index:0,wordCount:a,status:"processing"}]});const n=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({text:t,voiceName:g,stylePrompt:B,model:f,multiSpeaker:K,speaker1:{name:"Alex",voiceName:Le},speaker2:{name:"Sam",voiceName:Re}})}),i=await be(n);if(!n.ok||!i.success)throw new Error(i.error||"Error al sintetizar vista previa.");const o=`data:audio/wav;base64,${i.audioBase64}`;ye({id:r,status:"completed",totalChunks:1,currentChunkIndex:0,completedChunks:1,estimatedTotalSeconds:s,generatedTotalSeconds:i.durationSeconds||s,progressPercent:100,downloadUrl:o,chunks:[{index:0,wordCount:a,status:"completed",durationSeconds:i.durationSeconds,audioBase64:i.audioBase64}]}),ie({base64:i.audioBase64,title:`Audio Completo: ${t.slice(0,42)}...`,durationSeconds:i.durationSeconds,voiceName:K?`${Le} + ${Re}`:g,scriptText:t});const p={id:Date.now().toString(),title:`Vista Previa: ${t.slice(0,42)}...`,createdAt:Date.now(),voiceName:K?`${Le} + ${Re}`:g,model:i.usedModel||f,durationSeconds:i.durationSeconds,wordCount:a,stylePrompt:B,scriptText:t},h=await Kt(p,{base64:i.audioBase64});h&&ie(L=>L&&{...L,mediaKey:h}),k({type:"success",text:"Audio generado y cargado en el reproductor. Puedes descargarlo en WAV o enviarlo al Compositor de Video."})}catch(n){ye(i=>i?{...i,status:"failed",error:n.message||"Error sintetizando fragmento."}:null),k({type:"error",text:n.message||"Error sintetizando fragmento."})}finally{Ba(!1)}},ur=async()=>{if(je.trim())try{$a(!0),k(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({text:je.trim(),voiceName:g,stylePrompt:mt,model:f})}),a=await be(t);if(!t.ok||!a.success)throw new Error(a.error||"Error al sintetizar en el laboratorio.");ie({base64:a.audioBase64,title:`Laboratorio (${g}): ${je.trim().slice(0,34)}...`,durationSeconds:a.durationSeconds,voiceName:g,scriptText:je.trim()});const s={id:Date.now().toString(),title:`Laboratorio: ${je.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:g,model:a.usedModel||f,durationSeconds:a.durationSeconds,wordCount:je.trim().split(/\s+/).filter(Boolean).length,stylePrompt:mt,scriptText:je.trim()},r=await Kt(s,{base64:a.audioBase64});r&&ie(n=>n&&{...n,mediaKey:r})}catch(t){k({type:"error",text:t.message||"Error sintetizando prueba en el laboratorio."})}finally{$a(!1)}},xr=async()=>{if(E.trim())try{k(null),gt.current&&gt.current.close();const t=await fetch("/api/studio/tts/jobs",{method:"POST",headers:H(u),body:JSON.stringify({text:E,voiceName:g,stylePrompt:B,model:f,multiSpeaker:K,speaker1:{name:"Alex",voiceName:Le},speaker2:{name:"Sam",voiceName:Re},maxWordsPerChunk:ze})}),a=await be(t);if(!t.ok)throw new Error(a.error||"No se pudo iniciar el trabajo de larga duración.");const s={id:a.jobId,status:"processing",totalChunks:a.totalChunks,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:a.estimatedTotalSeconds,generatedTotalSeconds:0,progressPercent:0,chunks:Array.from({length:a.totalChunks},(i,o)=>({index:o,wordCount:0,status:"pending"}))};ye(s);const r=new EventSource(`/api/studio/tts/jobs/${a.jobId}/stream${u?`?token=${encodeURIComponent(u)}`:""}`);gt.current=r,r.addEventListener("snapshot",i=>{const o=JSON.parse(i.data);ye(p=>p?{...p,...o}:o)}),r.addEventListener("chunk_start",i=>{const o=JSON.parse(i.data);ye(p=>{if(!p)return null;const h=[...p.chunks];return h[o.chunkIndex]&&(h[o.chunkIndex]={...h[o.chunkIndex],status:"processing"}),{...p,currentChunkIndex:o.chunkIndex,chunks:h}})}),r.addEventListener("chunk_complete",i=>{const o=JSON.parse(i.data);ye(p=>{if(!p)return null;const h=[...p.chunks];h[o.chunkIndex]&&(h[o.chunkIndex]={...h[o.chunkIndex],status:"completed",durationSeconds:o.durationSeconds,audioBase64:o.audioBase64});const L=h.filter(F=>F.status==="completed").length;return{...p,completedChunks:L,progressPercent:o.progressPercent,generatedTotalSeconds:o.generatedTotalSeconds,chunks:h}})}),r.addEventListener("job_completed",i=>{const o=JSON.parse(i.data);r.close(),ye(h=>h?{...h,status:"completed",progressPercent:100,downloadUrl:o.downloadUrl}:null),ie({url:o.downloadUrl,title:`Audio Completo: ${E.trim().slice(0,35)}...`,durationSeconds:o.totalDurationSeconds,voiceName:g,scriptText:E});const p={id:o.id,title:`Audio Completo: ${E.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:g,model:f,durationSeconds:o.totalDurationSeconds,wordCount:ca,downloadUrl:o.downloadUrl,stylePrompt:B,scriptText:E};Kt(p,{url:o.downloadUrl}).then(h=>{h&&ie(L=>L&&{...L,mediaKey:h})})}),r.addEventListener("job_failed",i=>{const o=JSON.parse(i.data);r.close(),ye(p=>p?{...p,status:"failed",error:o.error}:null)}),r.addEventListener("job_status",i=>{const o=JSON.parse(i.data);ye(p=>p?{...p,status:o.status}:null)});const n=i=>{try{const o=JSON.parse(i.data);ye(p=>p?{...p,failoverNotice:o.message||(o.label?`Salto automático a ${o.label} (${o.reason||"429"})`:"Cuota 429 detectada en la clave anterior. Rotación automática a clave de respaldo activada.")}:null)}catch{}};r.addEventListener("key_failover",n),r.addEventListener("api_key_failover",n)}catch(t){k({type:"error",text:t.message||"Error iniciando trabajo."})}},mr=async()=>{try{S(!0),k(null);const t=await fetch("/api/studio/script/enhance",{method:"POST",headers:H(u),body:JSON.stringify({scriptText:E,stylePrompt:B,multiSpeaker:K,modelName:_})}),a=await be(t);if(!t.ok||!a.success||!a.scriptText)throw new Error(a.error||"No se pudo mejorar el guion con IA.");Ie(a.scriptText),k({type:"success",text:`¡Guion enriquecido con expresiones vocales (<breath>, <laugh>) usando ${a.usedModel||_}!`})}catch(t){k({type:"error",text:t.message||"Error mejorando el guion con IA."})}finally{S(!1)}},ja=async t=>{se&&(t==="cancel"&&gt.current&&gt.current.close(),await fetch(`/api/studio/tts/jobs/${se.id}/control`,{method:"POST",headers:H(u),body:JSON.stringify({action:t})}),ye(a=>a?{...a,status:t==="pause"?"paused":t==="resume"?"processing":"cancelled"}:null))},Zt=t=>{const a=document.getElementById("wappy-studio-tts-editor");if(!a){Ie(i=>`${i} ${t}`);return}const s=a.selectionStart,r=a.selectionEnd,n=E.substring(0,s)+t+E.substring(r);Ie(n),setTimeout(()=>{a.focus(),a.setSelectionRange(s+t.length,s+t.length)},15)},He=(t=I,a=!!Q,s=nt,r,n,i)=>{const o=r??((d==null?void 0:d.scriptText)||E),p=Math.max(5,Math.round(n??((d==null?void 0:d.durationSeconds)||D||28)));Fe(Ds({aspectRatio:t,hasBaseVideo:a,badgeText:ft,headline:_e,subheadline:ht,accentColor:yt,templateId:s,scriptText:o,durationSeconds:p})),s!=="camera-overlay"&&!a&&fetch("/api/studio/video/compile-master-reel",{method:"POST",headers:H(u),body:JSON.stringify({scriptText:o,headline:_e,aspectRatio:t,hasBaseVideo:a,showSubtitles:ve,durationSeconds:p,companyName:(x==null?void 0:x.name)||"WAPPY IA",audioBase64:i||(d==null?void 0:d.base64)||void 0})}).then(h=>be(h)).then(h=>{h!=null&&h.success&&h.htmlCode&&Fe(h.htmlCode)}).catch(()=>{})},ms=l.useRef(!1);l.useEffect(()=>{C==="video"&&!ms.current&&(ms.current=!0,He(I,!!Q,nt,(d==null?void 0:d.scriptText)||E,(d==null?void 0:d.durationSeconds)||D||28,d==null?void 0:d.base64))},[C]);const br=async()=>{const t=(E||_e||"").trim().slice(0,750);if(t)try{Ya(!0),k(null);const a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({text:t,voiceName:g,stylePrompt:B,model:f,multiSpeaker:K,speaker1:{name:"Alex",voiceName:Le},speaker2:{name:"Sam",voiceName:Re}})}),s=await be(a);if(!a.ok||!s.success)throw new Error(s.error||"No se pudo sintetizar la voz para el video.");ie({base64:s.audioBase64,title:`Locución de Video (${g})`,durationSeconds:s.durationSeconds,voiceName:g,scriptText:t}),Kt({id:`vo-${Date.now()}`,title:`Locución de Video: ${t.slice(0,40)}...`,createdAt:Date.now(),voiceName:g,model:s.usedModel||f,durationSeconds:s.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,stylePrompt:B,scriptText:t},{base64:s.audioBase64}).then(r=>{r&&ie(n=>n&&{...n,mediaKey:r})}),s.durationSeconds&&s.durationSeconds>1&&et(s.durationSeconds),Be.includes('data-wappy-template="true"')&&He(I,!!Q,nt,t,s.durationSeconds,s.audioBase64),Te(0),De(!0),setTimeout(()=>{var r,n,i,o;(n=(r=M.current)==null?void 0:r.contentWindow)==null||n.postMessage({type:"STUDIO_RESTART"},"*"),(i=le.current)==null||i.play().catch(()=>{}),(o=oe.current)==null||o.play().catch(()=>{})},120),k({type:"success",text:`¡Locución neural (${g} • ${s.durationSeconds}s) sincronizada al milisegundo con el Motor Maestro 60-FPS + Avatar 3D!`})}catch(a){k({type:"error",text:a.message||"Error sincronizando voz con el video."})}finally{Ya(!1)}},bs=t=>{Qs(a=>a.includes(t)?a.filter(s=>s!==t):[...a,t])},gs=()=>{const t=Math.max(8,Math.round((d==null?void 0:d.durationSeconds)||D||24)),a=za(E,t),s=Ne.map(i=>{var o;return(o=st.find(p=>p.id===i))==null?void 0:o.label}).filter(Boolean),r=s.length>0?s:st.map(i=>i.label),n=a.beats.map((i,o)=>{const p=o===0?"0.0s":`${i.startSec.toFixed(1)}s`,h=o===0&&i.endSec<2.2?"2.0s":`${Math.max(i.startSec+1.5,i.endSec).toFixed(1)}s`,L=o>0&&!i.text.includes("[pausa")?"[pausa 0.5s] ":"",F=i.text.includes("<breath>")?"":" <breath>";return{id:`step-${Date.now()}-${o}`,timeRange:`${p}-${h}`,title:o===0?"Portada Magnética 2s 🔥 ¡GRATIS!":`${i.titleLead} ${i.titleHighlight}`.trim()||`Escena 0${o+1}`,narration:`${L}${i.text}${F}`.trim(),visualEffect:o===0?"19 Portada Magnética 2s 🔥 ¡GRATIS!":r[o%r.length]||"07 Zoom-Through"}});Ae(n),k({type:"success",text:`¡Guion estructurado en ${n.length} escenas con tiempos (${t}s), pausas y efectos de las Skills de Antigravity!`})},gr=()=>{if(!Array.isArray(pe)||pe.length===0)return;const t=pe.map(a=>(a.narration||"").replace(/\[pausa\s+[\d.]+s\]/gi,"<breath>").trim()).filter(Boolean).join(`

`);t&&(Ie(t),k({type:"success",text:"¡Escenas y pausas sincronizadas con el Guion Principal!"}))},fs=()=>{const t=Math.max(6,Math.round((d==null?void 0:d.durationSeconds)||D||24)),a=aa.find(n=>n.id===Ze)||aa[0],s=Ne.map(n=>{var i;return((i=st.find(o=>o.id===n))==null?void 0:i.label)||n}).join(", "),r=(Array.isArray(pe)?pe:[]).map((n,i)=>`• Escena ${i+1} (${n.timeRange}) [${n.visualEffect}] — "${n.title}": ${n.narration}`).join(`
`);return["[SUPER-PROMPT OFICIAL ANTIGRAVITY 60-FPS • SISTEMA DE LAS 7 PIEZAS WAPPY IA]",`1. FORMATO Y DURACIÓN: ${I==="9:16"?"Vertical 9:16 (1080x1920 Reels/TikTok/WhatsApp)":"Horizontal 16:9 (1920x1080 YouTube/LMS)"} • Duración sincronizada al audio: ${t}s (${d?`Voz activa: ${d.voiceName||g}`:"Locución lista"}).`,`2. DIRECCIÓN DE ARTE (${a.label}): Paleta ${a.colors} • Insignia: "${ft}" • Titular: "${_e}" • Subtítulo: "${ht}" • Acento: ${yt}.`,`3. EFECTOS DE SKILLS ANTIGRAVITY ACTIVOS: ${s||"19 Portada Magnética 2s 🔥 ¡GRATIS!, Félix Voxel 3D Lip-Sync, 07 Zoom-Through, 13 Checklist SST"}.`,"4. ESCALETA SEGUNDO A SEGUNDO Y PAUSAS SINCRONIZADAS CON LA VOZ:",r||`• 0.0s-${t}s: ${E.slice(0,360)}`,"5. REGLAS TÉCNICAS: Incluir de 0.0s a 2.0s la Miniatura/Portada Magnética con badge 🔥 ¡GRATIS!, sincronizar transiciones GSAP con window.mainTimeline y el reloj de voz, mantener última escena visible al cierre y cero desbordes de texto."].join(`
`)},fr=async()=>{try{ss(!0),k(null);const t=Math.max(6,Math.round((d==null?void 0:d.durationSeconds)||D||24)),a=fs();try{const s=await fetch("/api/studio/antigravity/super-prompt",{method:"POST",headers:H(u),body:JSON.stringify({scriptText:E,scriptSteps:pe,aspectRatio:I,durationSeconds:t,badgeText:ft,headlineText:_e,subtitleText:ht,accentColor:yt,artDirection:Ze,selectedEffects:Ne,voiceName:(d==null?void 0:d.voiceName)||g,modelName:_})});if(s.ok){const r=await be(s);if(r!=null&&r.success&&r.superPrompt){Ft(r.superPrompt),Array.isArray(r.scriptSteps)&&r.scriptSteps.length>0&&Ae(r.scriptSteps),k({type:"success",text:"¡Paso 1 completado! Super-Prompt de Antigravity generado con tus tiempos, pausas y efectos. Ahora pulsa el Paso 2 para enviar al Generador de Video."});return}}}catch{}Ft(a),k({type:"success",text:"¡Paso 1 completado! Super-Prompt estructurado con tus escenas, tiempos, pausas y efectos de las Skills de Antigravity. Ahora pulsa el Paso 2."})}finally{ss(!1)}},hr=async()=>{var t;try{rs(!0),k(null);const a=(Xe||"").trim()||fs();Xe.trim()||Ft(a);const s=await Tt(),r=Math.max(6,Math.round((d==null?void 0:d.durationSeconds)||D||25)),n=await fetch("/api/studio/video/generate-html",{method:"POST",headers:H(u),body:JSON.stringify({prompt:a,scriptText:E,scriptSteps:pe,aspectRatio:I,theme:Ze,effects:Ne,hasBaseVideo:!!Q,showSubtitles:ve,durationSeconds:r,companyName:(x==null?void 0:x.name)||"WAPPY IA",modelName:_,audioBase64:s||void 0})}),i=await be(n);if(!n.ok||!i.success)throw new Error(i.error||"Error generando composición HTML con Antigravity.");(t=i.timelineMap)!=null&&t.totalDurationSeconds&&i.timelineMap.totalDurationSeconds>2&&et(i.timelineMap.totalDurationSeconds),xe.current="",Fe(i.htmlCode),await Et({htmlOverride:i.htmlCode},!0),Te(0),De(!0),setTimeout(()=>{var o,p,h,L;(p=(o=M.current)==null?void 0:o.contentWindow)==null||p.postMessage({type:"STUDIO_RESTART"},"*"),(h=le.current)==null||h.play().catch(()=>{}),(L=oe.current)==null||L.play().catch(()=>{})},140),k({type:"success",text:"¡Paso 2 completado! Video HTML 60-FPS generado por Antigravity, cargado en el Lienzo en sincronía con el audio y guardado en tu Biblioteca."})}catch(a){k({type:"error",text:a.message||"No se pudo generar la escena HTML con Antigravity."})}finally{rs(!1)}},hs=async()=>{var t;if(!vt.trim()){k({type:"info",text:"Escribe primero qué detalle deseas corregir o ajustar en el video HTML (colores, textos, tamaños, efectos o tiempos)."});return}try{is(!0),k(null);const a=await Tt(),s=Math.max(6,Math.round((d==null?void 0:d.durationSeconds)||D||25)),r=xe.current||Be;let n="";try{const i=await fetch("/api/studio/antigravity/edit-html",{method:"POST",headers:H(u),body:JSON.stringify({currentHtml:r,correctionPrompt:vt.trim(),superPrompt:Xe,scriptText:E,scriptSteps:pe,aspectRatio:I,durationSeconds:s,badgeText:ft,headlineText:_e,subtitleText:ht,accentColor:yt,theme:Ze,effects:Ne,modelName:_,audioBase64:a||void 0})});if(i.ok){const o=await be(i);o!=null&&o.success&&o.htmlCode&&(n=o.htmlCode,(t=o.timelineMap)!=null&&t.totalDurationSeconds&&o.timelineMap.totalDurationSeconds>2&&et(o.timelineMap.totalDurationSeconds))}}catch{}if(!n){const i=`${Xe}

[CORRECCIÓN OBLIGATORIA SOLICITADA POR EL USUARIO SOBRE EL LIENZO ACTUAL]: ${vt.trim()}`,o=await fetch("/api/studio/video/generate-html",{method:"POST",headers:H(u),body:JSON.stringify({prompt:i,scriptText:E,scriptSteps:pe,aspectRatio:I,theme:Ze,effects:Ne,hasBaseVideo:!!Q,showSubtitles:ve,durationSeconds:s,companyName:(x==null?void 0:x.name)||"WAPPY IA",modelName:_,audioBase64:a||void 0})}),p=await be(o);if(!o.ok||!p.success||!p.htmlCode)throw new Error(p.error||"No se pudieron aplicar las correcciones al HTML.");n=p.htmlCode}xe.current="",Fe(n),await Et({htmlOverride:n},!0),Te(0),De(!0),setTimeout(()=>{var i,o,p,h;(o=(i=M.current)==null?void 0:i.contentWindow)==null||o.postMessage({type:"STUDIO_RESTART"},"*"),(p=le.current)==null||p.play().catch(()=>{}),(h=oe.current)==null||h.play().catch(()=>{})},140),k({type:"success",text:"¡Paso 3 completado! Correcciones aplicadas por Antigravity sobre el HTML manteniendo la sincronía con el audio y actualizadas en la Biblioteca."})}catch(a){k({type:"error",text:a.message||"Error aplicando correcciones con Antigravity."})}finally{is(!1)}},yr=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;Q&&URL.revokeObjectURL(Q);const s=URL.createObjectURL(a);Ka(s),Za(a.name),He(I,!0)},vr=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;Je&&URL.revokeObjectURL(Je);const s=URL.createObjectURL(a);Xa(s),es(a.name)},fe=l.useMemo(()=>Je||(d!=null&&d.url?d.url:d!=null&&d.base64?`data:audio/wav;base64,${d.base64}`:""),[Je,d]);l.useEffect(()=>{if(C!=="video"||!Pe||ne)return;let t=performance.now();const a=setInterval(()=>{var o,p,h,L;const s=performance.now(),r=(s-t)/1e3;t=s;const n=le.current,i=oe.current;if(n&&fe&&!n.paused&&!n.ended){const F=n.currentTime,W=n.duration&&!isNaN(n.duration)&&n.duration>1?n.duration:Math.max(1,D||20);Te(F),(p=(o=M.current)==null?void 0:o.contentWindow)==null||p.postMessage({type:"STUDIO_SYNC_TIME",currentTime:F,duration:W,playing:!0},"*");return}if(i&&Q&&!i.paused&&!i.ended){const F=i.currentTime,W=i.duration&&!isNaN(i.duration)&&i.duration>1?i.duration:Math.max(1,D||20);Te(F),(L=(h=M.current)==null?void 0:h.contentWindow)==null||L.postMessage({type:"STUDIO_SYNC_TIME",currentTime:F,duration:W,playing:!0},"*");return}Te(F=>{var he,O,J,U;const W=Math.max(1,D||20),me=F+r;return me>=W?(De(!1),(O=(he=M.current)==null?void 0:he.contentWindow)==null||O.postMessage({type:"STUDIO_PAUSE"},"*"),W):((U=(J=M.current)==null?void 0:J.contentWindow)==null||U.postMessage({type:"STUDIO_SYNC_TIME",currentTime:me,duration:W,playing:!0},"*"),me)})},120);return()=>clearInterval(a)},[C,Pe,ne,D,fe,Q]);const ys=()=>{var r,n,i,o,p;const t=Math.max(1,D||20);if(!Pe&&(Qe>=t-.3||!!((r=le.current)!=null&&r.ended))){Sa();return}const s=!Pe;s&&ne&&(Gt(!1),(i=(n=M.current)==null?void 0:n.contentWindow)==null||i.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),De(s),(p=(o=M.current)==null?void 0:o.contentWindow)==null||p.postMessage({type:s?"STUDIO_PLAY":"STUDIO_PAUSE"},"*"),oe.current&&(s?oe.current.play().catch(()=>{}):oe.current.pause()),le.current&&fe&&(s?le.current.play().catch(()=>{}):le.current.pause())},Sa=()=>{var t,a,s,r;ne&&(Gt(!1),(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),Te(0),De(!0),(r=(s=M.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_RESTART"},"*"),oe.current&&(oe.current.currentTime=0,oe.current.play().catch(()=>{})),le.current&&fe&&(le.current.currentTime=0,le.current.play().catch(()=>{}))},vs=t=>{var s,r;Te(t);const a=D>0?t/D:0;(r=(s=M.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SEEK",progress:a,time:t},"*"),oe.current&&(oe.current.currentTime=t),le.current&&fe&&(le.current.currentTime=t)},ws=()=>{var a,s,r,n;const t=!ne;Gt(t),t?(De(!1),(a=oe.current)==null||a.pause(),(s=le.current)==null||s.pause()):xe.current&&(Fe(xe.current),xe.current=""),(n=(r=M.current)==null?void 0:r.contentWindow)==null||n.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:t},"*")},Ge=t=>{var a,s;va(r=>r&&{...r,...t}),(s=(a=M.current)==null?void 0:a.contentWindow)==null||s.postMessage({type:"STUDIO_UPDATE_SELECTED",updates:t},"*")},wr=()=>{var t,a;xe.current&&(Fe(xe.current),xe.current=""),Gt(!1),va(null),(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*"),k({type:"success",text:"¡Cambios de textos y posición de cajas guardados en la composición HTML!"})},ks=()=>{var t,a,s;document.fullscreenElement?(t=document.exitFullscreen)==null||t.call(document).catch(()=>{}):(s=(a=ds.current)==null?void 0:a.requestFullscreen)==null||s.call(a).catch(()=>{})},Nt=l.useMemo(()=>{const t=(d==null?void 0:d.scriptText)||E||"";return za(t,Math.max(4,D||25))},[d==null?void 0:d.scriptText,E,D]),We=l.useMemo(()=>Nt.wordTimings.map(t=>t.word),[Nt]),Na=l.useMemo(()=>{if(!ve||We.length===0)return null;const t=Math.max(0,Math.min(.9999,Qe/Math.max(1,D))),a=Nt.wordTimings;let s=-1;for(let o=0;o<a.length;o++)if(t>=a[o].startPct&&t<=a[o].endPct){s=o;break}s===-1&&(s=Math.min(We.length-1,Math.floor(t*We.length)));const r=5,n=Math.floor(s/r)*r;return{words:We.slice(n,n+r),activeOffset:s-n}},[ve,We,Nt,Qe,D]),Tt=async()=>{if(d!=null&&d.base64)return d.base64;if(!fe)return null;try{const t=await fetch(fe);if(!t.ok)return null;const a=await t.arrayBuffer(),s=new Uint8Array(a);let r="";const n=32768;for(let i=0;i<s.length;i+=n)r+=String.fromCharCode.apply(null,Array.from(s.subarray(i,i+n)));return window.btoa(r)}catch{return null}},Ta=async()=>{try{ns(!0);const t=Math.min(60,Math.max(4,Math.round(D||15))),a=t>20?12:15;k({type:"info",text:`Renderizando Video MP4 con Audio + Animación + Subtítulos (${t}s)... Espera ~15-25 segundos mientras se ensambla el archivo .MP4 para WhatsApp y Celular.`});const s=xe.current||Be,r=await Tt(),n=await fetch("/api/studio/video/render-mp4",{method:"POST",headers:H(u),body:JSON.stringify({htmlCode:s,audioBase64:r,scriptText:(d==null?void 0:d.scriptText)||E,showSubtitles:ve,subtitlePosition:Ke,aspectRatio:I,durationSeconds:t,fps:a})}),i=await be(n);if(!n.ok||!i.success||!i.videoBase64)throw new Error(i.error||"No se pudo renderizar el archivo MP4 en el servidor.");const o=window.atob(i.videoBase64),p=new Array(o.length);for(let me=0;me<o.length;me++)p[me]=o.charCodeAt(me);const h=new Uint8Array(p),L=new Blob([h],{type:"video/mp4"});Et({mp4Blob:L});const F=URL.createObjectURL(L),W=document.createElement("a");W.href=F,W.download=`wappy-studio-reel-${Date.now()}.mp4`,document.body.appendChild(W),W.click(),document.body.removeChild(W),URL.revokeObjectURL(F),k({type:"success",text:`¡Video MP4 Universal (${i.width}x${i.height} • H.264 + Audio AAC) descargado con éxito! Listo para enviar por WhatsApp, ver en celular o subir a Reels/TikTok.`})}catch(t){k({type:"error",text:t.message||"Error renderizando MP4 en el servidor."})}finally{ns(!1)}},kr=async t=>{var O;let a=t.replace(/subtitles\.reverse\(\)/g,"subtitles.slice().reverse()");const s=J=>J.replace(/<\/script/gi,"<\\/script"),r=async J=>{try{const U=await fetch(J,{cache:"force-cache"});return U.ok?await U.text():""}catch{return""}},n=async J=>{try{const U=await fetch(J,{cache:"force-cache"});if(!U.ok)return"";const qe=await U.arrayBuffer(),ct=new Uint8Array(qe);let Cs="";const Es=32768;for(let Xt=0;Xt<ct.length;Xt+=Es)Cs+=String.fromCharCode.apply(null,Array.from(ct.subarray(Xt,Xt+Es)));return`data:image/png;base64,${window.btoa(Cs)}`}catch{return""}};let i="";try{const J=(O=M.current)==null?void 0:O.contentDocument;J&&Array.from(J.querySelectorAll("style")).forEach(U=>{if((U.id||"").startsWith("wappy-studio-bridge"))return;const ct=U.textContent||"";ct&&!a.includes(ct.slice(0,120))&&(i+=`
${ct}`)})}catch{i=""}const[o,p,h,L,F,W]=await Promise.all([/gsap(\.min)?\.js/i.test(a)?r("/assets/gsap.min.js"):Promise.resolve(""),/three(\.min)?\.js/i.test(a)?r("/assets/wappy/three.min.js"):Promise.resolve(""),/cdn\.tailwindcss\.com|tailwind-cdn\.js/i.test(a)?r("/assets/tailwind-cdn.js"):Promise.resolve(""),/tenshi\.png/i.test(a)?n("/assets/wappy/tenshi.png"):Promise.resolve(""),/felix_avatar_3d\.png/i.test(a)?n("/assets/wappy/felix_avatar_3d.png"):Promise.resolve(""),/wappy-cat-logo\.png/i.test(a)?n("/assets/wappy/wappy-cat-logo.png"):Promise.resolve("")]);L&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?tenshi\.png(["')])/gi,(J,U,qe)=>`${U}${L}${qe}`)),F&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?felix_avatar_3d\.png(["')])/gi,(J,U,qe)=>`${U}${F}${qe}`)),W&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?wappy-cat-logo\.png(["')])/gi,(J,U,qe)=>`${U}${W}${qe}`)),o&&(a=a.replace(/<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-gsap">${s(o)}<\/script>`)),p&&(a=a.replace(/<script[^>]*src=["'][^"']*three(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-three">${s(p)}<\/script>`)),a=a.replace(/<script[^>]*src=["'][^"']*(cdn\.tailwindcss\.com|tailwind-cdn\.js)[^"']*["'][^>]*>\s*<\/script>/gi,()=>"<script>window.tailwind = window.tailwind || {};<\/script>"+(h?`<script id="wappy-inline-tailwind">${s(h)}<\/script>`:""));const me=`
<meta name="color-scheme" content="dark" />
<meta name="format-detection" content="telephone=no" />
<style id="wappy-precompiled-tailwind">${i.replace(/<\/style/gi,"<\\/style")}</style>
<style id="wappy-offline-font-fallback">
  html, body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
</style>
<noscript><style>
  #header-hud, #top-bar, #scene-1, #scene-1 *, #hero-card, .metric-item { opacity: 1 !important; transform: none !important; visibility: visible !important; }
  #wappy-capsule-controls, #wappy-mobile-tap-overlay { display: none !important; }
</style></noscript>`;/<head[^>]*>/i.test(a)?a=a.replace(/<head[^>]*>/i,J=>`${J}${me}`):a=`${me}
${a}`,/<meta[^>]+name=["']viewport/i.test(a)||(a=a.replace(/<head[^>]*>/i,J=>`${J}<meta name="viewport" content="width=device-width, initial-scale=1.0" />`));const he=`<script id="wappy-visibility-guard">
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
<\/script>`;return a=a.includes("</body>")?a.replace("</body>",()=>`${he}
</body>`):`${a}
${he}`,a},js=async()=>{const t=await kr(xe.current||Be),a=await Tt(),s=a?`data:audio/wav;base64,${a}`:"",r=Math.max(4,Math.round((D||20)*10)/10),n=`
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
    ${Ke==="top"?"top: 54px;":Ke==="center"?"top: 50%; transform: translateY(-50%);":"bottom: 58px;"}
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
<div id="wappy-capsule-subtitles" style="display:${ve&&We.length>0?"flex":"none"};">
  <div id="wappy-capsule-sub-box" style="background:rgba(4,10,18,0.92);backdrop-filter:blur(10px);border:1px solid rgba(199,243,3,0.45);padding:7px 13px;border-radius:13px;text-align:center;max-width:95%;display:flex;flex-wrap:wrap;justify-content:center;gap:5px;"></div>
</div>
<div id="wappy-capsule-controls">
  <button type="button" id="wappy-btn-play">⏸ Pausar</button>
  <button type="button" id="wappy-btn-restart" class="secondary" title="Reiniciar">↺</button>
  <input type="range" id="wappy-seek" min="0" max="${r}" step="0.1" value="0" />
  <span id="wappy-time-label" style="font-size:10px;font-family:monospace;font-weight:700;color:#cbd5e1;white-space:nowrap;">0.0s / ${r}s</span>
</div>
<script id="wappy-academy-capsule-runtime">
(function() {
  var words = ${JSON.stringify(We)};
  var wordTimings = ${JSON.stringify(Nt.wordTimings)};
  var showSubs = ${!!(ve&&We.length>0)};
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
${n}`},Ct=l.useRef(null),Et=async(t={},a=!0)=>{var s;try{const r=t.htmlOverride||xe.current||Be,n=(d==null?void 0:d.mediaKey)||fe||"sin-audio",i=`${r.length}:${r.slice(-200)}:${n}:${I}`,p=((s=Ct.current)==null?void 0:s.signature)===i&&Se.some(he=>{var O;return he.id===((O=Ct.current)==null?void 0:O.id)})?Ct.current.id:`video-${Date.now()}`,h=`html-${p}`;await at(h,new Blob([r],{type:"text/html"}));let L=d==null?void 0:d.mediaKey;if(!L&&fe){const he=await Tt();he&&(L=`audio-${p}`,await at(L,ea(he)))}let F;t.mp4Blob&&(F=`mp4-${p}`,await at(F,t.mp4Blob));let W;t.capsuleHtml&&(W=`capsule-${p}`,await at(W,new Blob([t.capsuleHtml],{type:"text/html"})));const me=((d==null?void 0:d.scriptText)||E||_e||"Animación Antigravity").replace(/<[^>]+>/g,"").replace(/\[[^\]]+\]/g,"").trim();it(he=>{const O=he.find(U=>U.id===p);return[{...O||{},id:p,kind:"video",title:(O==null?void 0:O.title)||`Video HTML ${I}: ${me.slice(0,42)}...`,createdAt:(O==null?void 0:O.createdAt)||Date.now(),voiceName:L?(d==null?void 0:d.voiceName)||g:"Sin Audio (Solo HTML)",model:_,durationSeconds:Math.round(((d==null?void 0:d.durationSeconds)||D||20)*10)/10,wordCount:me.split(/\s+/).filter(Boolean).length,scriptText:(d==null?void 0:d.scriptText)||E,stylePrompt:Xe?Xe.slice(0,180):void 0,htmlKey:h,mediaKey:L||(O==null?void 0:O.mediaKey),mp4Key:F||(O==null?void 0:O.mp4Key),capsuleKey:W||(O==null?void 0:O.capsuleKey),aspectRatio:I,showSubtitles:ve,subtitlePosition:Ke},...he.filter(U=>U.id!==p)]}),Ct.current={id:p,signature:i},a||k({type:"success",text:"¡Video HTML guardado en la Biblioteca! Puedes reabrirlo en el editor, descargar el .HTML al instante o renderizar el .MP4 con Antigravity."})}catch(r){k({type:"error",text:`No se pudo guardar el video en la Biblioteca: ${(r==null?void 0:r.message)||"error de almacenamiento"}`})}},Ss=async t=>{const a=t.htmlKey?await ut(t.htmlKey):null;if(!a){k({type:"error",text:"No se encontró la composición HTML de este video."});return}const s=await a.text();t.aspectRatio&&ba(t.aspectRatio),typeof t.showSubtitles=="boolean"&&ts(t.showSubtitles),t.subtitlePosition&&Wa(t.subtitlePosition),xe.current="",Fe(s);const r=t.mediaKey?await ut(t.mediaKey):null;r&&ie({url:cs(r),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey}),t.durationSeconds&&t.durationSeconds>1&&et(t.durationSeconds),Te(0),De(!1),Ct.current=null,ge("video")},Ns=async()=>{var t,a;try{Wt(!0);const s=await js();Et({capsuleHtml:s});const r=`wappy-academia-capsula-${Date.now()}.html`,n=new Blob([s],{type:"text/html;charset=utf-8"});if(typeof window<"u"&&((t=window.matchMedia)==null?void 0:t.call(window,"(pointer: coarse)").matches)&&typeof navigator.share=="function")try{const h=new File([n],r,{type:"text/html"});if((a=navigator.canShare)!=null&&a.call(navigator,{files:[h]})){await navigator.share({files:[h],title:"Cápsula WAPPY",text:"Cápsula interactiva WAPPY (ábrela tocando el archivo)."}),k({type:"success",text:"¡Cápsula HTML compartida! Funciona sin internet al tocarla en WhatsApp."});return}}catch(h){if((h==null?void 0:h.name)==="AbortError")return}const o=URL.createObjectURL(n),p=document.createElement("a");p.href=o,p.download=r,document.body.appendChild(p),p.click(),document.body.removeChild(p),URL.revokeObjectURL(o),k({type:"success",text:"¡Cápsula HTML autocontenida descargada! Incluye estilos, animación y voz en un solo archivo: envíala por WhatsApp y ábrela tocándola, incluso sin internet."})}finally{Wt(!1)}},jr=async()=>{try{Wt(!0);const s=`<iframe srcdoc="${(await js()).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" style="width:100%;max-width:${I==="9:16"?"400px":"860px"};aspect-ratio:${I==="9:16"?"9/16":"16/9"};border:0;border-radius:16px;overflow:hidden;display:block;margin:0 auto;box-shadow:0 20px 50px rgba(0,0,0,0.35);" allow="autoplay; fullscreen"></iframe>`;await navigator.clipboard.writeText(s),k({type:"success",text:"¡Código <iframe srcdoc> copiado al portapapeles! Pégalo directamente en cualquier lección de la Academia WAPPY (LMS)."})}catch{k({type:"error",text:"No se pudo copiar el código embebido al portapapeles."})}finally{Wt(!1)}},dt=((Ts=$==null?void 0:$.supportedVoices)==null?void 0:Ts.length)||14;return!c&&x&&x.role!=="ADMIN"?e.jsx("div",{className:"flex-1 flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen p-6",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md",children:[e.jsx("div",{className:"w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto",children:e.jsx(As,{className:"w-6 h-6"})}),e.jsx("h2",{className:"text-lg font-extrabold text-slate-900 dark:text-white",children:"WAPPY Studio (Acceso Administrador)"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Por el momento este módulo está habilitado exclusivamente para cuentas de Administración de WAPPY."}),e.jsx("a",{href:"/c/new",className:"inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition",children:"Volver al inicio"})]})}):e.jsxs("div",{className:y("flex-1 flex flex-col",c?"bg-transparent h-auto overflow-visible pb-6":"bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-[100dvh] h-auto overflow-y-auto pb-16"),children:[e.jsx("header",{className:y("bg-white dark:bg-slate-900/95 px-4 sm:px-6 py-4 shadow-2xs z-30",c?"relative rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-7xl w-full mx-auto":"sticky top-0 border-b border-slate-200/90 dark:border-slate-800"),children:e.jsxs("div",{className:"max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[m&&!v&&e.jsx("div",{className:"hidden md:block",children:e.jsx($r,{setNavVisible:Y})}),e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2 mb-1",children:e.jsxs("span",{className:"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wider",children:[e.jsx(Oe,{className:"w-3 h-3 text-teal-500"}),"Estudio Multimodal • Gemini 3.8 Flash TTS & HyperFrames"]})}),e.jsxs("h1",{className:"text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400",children:[e.jsx(As,{className:"w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0"}),"WAPPY Studio"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300 mt-0.5 hidden sm:block",children:"Síntesis de voz neural de hasta 1 hora continua y creación de videos animados en HTML/GSAP con capas sobre tus propios videos."})]})]}),e.jsxs("div",{className:"flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-nowrap",children:[e.jsxs("div",{className:"inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto no-scrollbar min-w-0",children:[e.jsxs("button",{type:"button",onClick:()=>ge("tts"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",C==="tts"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(pt,{className:"w-3.5 h-3.5 text-teal-500"}),e.jsx("span",{children:"Estudio de Voz (TTS)"})]}),e.jsxs("button",{type:"button",onClick:()=>ge("video"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",C==="video"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Ce,{className:"w-3.5 h-3.5 text-purple-500"}),e.jsx("span",{children:"Video HTML & Capas"})]}),e.jsxs("button",{type:"button",onClick:()=>ge("lab"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",C==="lab"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(At,{className:"w-3.5 h-3.5 text-amber-500"}),e.jsx("span",{children:"Voces & Bursts"})]}),e.jsxs("button",{type:"button",onClick:()=>ge("library"),className:y("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",C==="library"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Ca,{className:"w-3.5 h-3.5 text-indigo-500"}),e.jsxs("span",{children:["Biblioteca (",Se.length,")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(_r,{selectedModel:_,onSelectModel:we,disabled:Ut}),e.jsx(b,{icon:e.jsx(Pt,{}),label:`Claves IA (${Ue})`,variant:"fuchsia",onClick:()=>{St(""),jt(!0)},title:"Configurar hasta 3 claves Google Gemini con rotación inteligente"}),e.jsx(b,{icon:Fa?e.jsx(q,{className:"animate-spin"}):e.jsx(Ps,{}),label:"Probar Audio con IA",variant:"purple",disabled:Fa,onClick:cr}),!c&&e.jsx(b,{icon:e.jsx(Tr,{}),label:"Landing / App Portable",variant:"cyan",onClick:()=>window.open("/wappystudio.html","_blank","noopener,noreferrer"),title:"Abrir Landing Page Pública y Aplicativo Portable de WAPPY Studio"})]})]})]})}),e.jsxs("main",{className:"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6",children:[ot&&e.jsxs("div",{className:y("p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200",ot.type==="success"?"bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200":ot.type==="error"?"bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200":"bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200"),children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[ot.type==="success"?e.jsx(Pa,{className:"w-4 h-4 text-emerald-500 shrink-0"}):ot.type==="error"?e.jsx(zt,{className:"w-4 h-4 text-rose-500 shrink-0"}):e.jsx(q,{className:"w-4 h-4 text-sky-500 animate-spin shrink-0"}),e.jsx("span",{children:ot.text})]}),e.jsx("button",{type:"button",onClick:()=>k(null),className:"p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10",children:e.jsx(sa,{className:"w-3.5 h-3.5"})})]}),d&&e.jsx(ai,{audioBase64:d.base64,audioUrl:d.url,title:d.title,durationSeconds:d.durationSeconds,voiceName:d.voiceName,onSendToVideo:()=>{ge("video"),k({type:"success",text:"Audio vinculado automáticamente a la pista de locución del Compositor de Video."})}}),C==="tts"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[se&&e.jsx(si,{job:se,onPause:()=>ja("pause"),onResume:()=>ja("resume"),onCancel:()=>ja("cancel"),onPlayChunk:t=>{t.audioBase64&&ie({base64:t.audioBase64,title:`Fragmento #${t.index+1} (${t.durationSeconds||0}s)`,durationSeconds:t.durationSeconds,voiceName:K?`${Le} + ${Re}`:g})},onLoadMaster:()=>{se.downloadUrl&&ie({url:se.downloadUrl,title:`Audio Completo: ${E.trim().slice(0,42)}...`,durationSeconds:se.generatedTotalSeconds,voiceName:K?`${Le} + ${Re}`:g,scriptText:E})}}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-indigo-500/10 dark:from-teal-950/40 dark:via-zinc-900/80 dark:to-indigo-950/40 border border-teal-500/25 dark:border-teal-500/20 rounded-2xl p-3 sm:p-3.5 shadow-2xs",children:[e.jsxs("div",{className:"flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0",children:"01"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300",children:"Motor & Voz Neural"}),e.jsxs("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:[$==null?void 0:$.name," •"," ",e.jsx("span",{className:"text-teal-600 dark:text-teal-400",children:K?`${Le} + ${Re}`:g})]})]})]}),e.jsxs("div",{className:"flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0",children:"02"}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300",children:"Capas de ~1 Min & Bursts"}),e.jsxs("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:[ca," palabras • ~",It," min (",bt," ",bt===1?"capa de ~1m":"capas de ~1m",")"]})]})]}),e.jsxs("button",{type:"button",onClick:()=>ge("video"),className:"flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 hover:bg-purple-50/80 dark:hover:bg-purple-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 shadow-2xs transition cursor-pointer text-left group",children:[e.jsxs("div",{className:"flex items-center gap-3 min-w-0",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0",children:"03"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300",children:"WAV 24kHz & Video HTML/GSAP"}),e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:"Sintetiza audio o llévalo al Compositor →"})]})]}),e.jsx(Ce,{className:"w-4 h-4 text-purple-500 shrink-0 group-hover:translate-x-0.5 transition-transform"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",children:[e.jsxs("div",{className:"lg:col-span-5 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-1.5",children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(Ms,{className:"w-4 h-4 text-teal-500"}),"Modelo Oficial Gemini TTS"]}),e.jsx("span",{className:"text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full",children:"✓ GOOGLE_MODELS Activo"})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:ae.map(t=>{const a=f===t.id;return e.jsxs("button",{type:"button",onClick:()=>{w(t.id),t.supportedVoices.includes(g)||P(t.supportedVoices[0]||"Kore")},className:y("text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-gradient-to-br from-teal-50/95 via-emerald-50/70 to-indigo-50/50 dark:from-teal-950/50 dark:via-emerald-950/30 dark:to-indigo-950/30 border-teal-500 ring-2 ring-teal-500/20 shadow-xs":"bg-white dark:bg-slate-900/70 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/60 dark:hover:bg-zinc-800/60"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1.5",children:[e.jsx("span",{className:y("text-[9px] font-extrabold px-2 py-0.5 rounded-md border",t.badgeColor),children:t.badge}),a&&e.jsx("span",{className:"w-2 h-2 rounded-full bg-teal-500 animate-ping shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white leading-snug mb-1",children:t.name}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 leading-snug",children:t.description})]}),e.jsxs("div",{className:"mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-amber-700 dark:text-amber-400 font-bold",children:t.rateLimitLabel||t.quotaLabel}),a?e.jsxs("span",{className:"text-teal-700 dark:text-teal-300 font-extrabold flex items-center gap-0.5",children:[e.jsx(Ve,{className:"w-3 h-3"})," ",t.supportedVoices.length," voces"]}):e.jsxs("span",{className:"text-slate-500 dark:text-zinc-400 font-semibold",children:[t.supportedVoices.length," voces"]})]})]},t.id)})}),e.jsxs("div",{className:"px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"text-slate-700 dark:text-zinc-300 flex items-center gap-1.5",children:[e.jsx(Oe,{className:"w-3.5 h-3.5 text-teal-500 shrink-0"}),e.jsxs("span",{children:["Voces activas para"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white",children:$==null?void 0:$.name}),":"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsxs("span",{className:"font-extrabold text-emerald-700 dark:text-emerald-400",children:[dt," de ",A.length," disponibles"]}),dt<A.length&&e.jsx("button",{type:"button",onClick:()=>w("gemini-3.8-flash-tts"),className:"text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer",children:"Activar las 14 →"})]})]}),f==="gemini-2.5-flash-preview-tts"&&e.jsxs("div",{className:"p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(zt,{className:"w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("p",{className:"font-extrabold text-amber-900 dark:text-amber-200",children:"¿Por qué algunas voces aparecen desactivadas en Gemini 2.5 Flash TTS?"}),e.jsxs("p",{className:"text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed",children:[e.jsx("span",{className:"font-bold",children:"Gemini 2.5 Pro Preview TTS"})," no posee cuota activa en API (0 RPM / 0 RPD). Su reemplazo oficial funcional es"," ",e.jsx("span",{className:"font-bold",children:"Gemini 2.5 Flash TTS"}),", el cual habilita únicamente las"," ",e.jsx("span",{className:"font-bold",children:"5 voces fundamentales"})," (Kore, Puck, Charon, Fenrir y Aoede). Para usar las 14 voces y Vocal Bursts, cambia a"," ",e.jsx("span",{className:"font-bold",children:"Gemini 3.8 Flash TTS"}),"."]})]})]}),e.jsx("div",{className:"flex justify-end",children:e.jsx("button",{type:"button",onClick:()=>w("gemini-3.8-flash-tts"),className:"px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-900 dark:text-amber-200 font-extrabold text-[11px] transition cursor-pointer",children:"Cambiar a Gemini 3.8 Flash TTS (14 voces) →"})})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"block text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"Estilos y Plantillas Rápidas"}),e.jsx("span",{className:"text-[10px] text-slate-500 dark:text-zinc-400",children:"1 clic configura voz + emoción"})]}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:z.map(t=>{const a=B===t.style&&(t.multiSpeaker?K:!K&&g===t.voiceName),s=!t.multiSpeaker&&!lt(t.voiceName);return e.jsxs("button",{type:"button",onClick:()=>{lt(t.voiceName)||w("gemini-3.8-flash-tts"),t.multiSpeaker?(Me(!0),t.speaker1&&Da(t.speaker1.voiceName),t.speaker2&&Oa(t.speaker2.voiceName)):(Me(!1),P(t.voiceName)),G(t.style)},className:y("text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition cursor-pointer inline-flex items-center gap-1.5",a?"bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 shadow-2xs font-bold":"border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 hover:border-teal-500/50 hover:bg-teal-500/10 text-slate-800 dark:text-zinc-200"),children:[e.jsx("span",{children:t.name}),s&&e.jsx("span",{className:"text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30",children:"Auto 3.8"})]},t.id)})})]}),e.jsxs("div",{className:"flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/95 rounded-xl border border-slate-200/90 dark:border-slate-800 gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx(Cr,{className:"w-4 h-4 text-teal-500 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"Modo Diálogo / Podcast (2 Voces)"}),e.jsxs("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:["Alterna interlocutores usando"," ",e.jsx("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:"Alex:"})," ","y"," ",e.jsx("span",{className:"font-mono font-bold text-purple-600 dark:text-purple-400",children:"Sam:"})]})]})]}),e.jsx("button",{type:"button",onClick:()=>Me(!K),className:y("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",K?"bg-teal-600":"bg-slate-300 dark:bg-zinc-700"),children:e.jsx("span",{className:y("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",K?"translate-x-4":"translate-x-0")})})]}),K?e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200/90 dark:border-slate-800",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-teal-700 dark:text-teal-400 mb-1",children:"Voz para Alex (Hablante 1)"}),e.jsx("select",{value:Le,onChange:t=>Da(t.target.value),className:"w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500",children:(($==null?void 0:$.supportedVoices)||[]).map(t=>{const a=A.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-purple-700 dark:text-purple-400 mb-1",children:"Voz para Sam (Hablante 2)"}),e.jsx("select",{value:Re,onChange:t=>Oa(t.target.value),className:"w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500",children:(($==null?void 0:$.supportedVoices)||[]).map(t=>{const a=A.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(pt,{className:"w-3.5 h-3.5 text-teal-500"}),"Catálogo de Voces (",dt," activas / ",A.length," totales)"]}),e.jsx("p",{className:"text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5",children:"Haz clic en cualquier tarjeta para elegir la voz o en ▶ para escuchar su timbre real."})]}),e.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]",children:[e.jsxs("button",{type:"button",onClick:()=>Ga("only_active"),className:y("px-2 py-0.5 rounded-md transition cursor-pointer",$t==="only_active"?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:["Solo Activas (",dt,")"]}),e.jsxs("button",{type:"button",onClick:()=>Ga("all"),className:y("px-2 py-0.5 rounded-md transition cursor-pointer",$t==="all"?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:["Todas (",A.length,")"]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(Er,{className:"w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"}),e.jsx("input",{type:"search",name:"wappy-voice-search",autoComplete:"off",value:xa,onChange:t=>Gs(t.target.value),placeholder:"Buscar voz (Kore, Orus, profunda, podcast...)",className:"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] shrink-0",children:["all","Femenino","Masculino"].map(t=>e.jsx("button",{type:"button",onClick:()=>Hs(t),className:y("px-2.5 py-1 rounded-lg transition cursor-pointer",Vt===t?"bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-bold shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:t==="all"?"Todas":t==="Femenino"?"♀ Femeninas":"♂ Masculinas"},t))})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1",children:dr.map(t=>{const a=g===t.id,s=ua===t.id,r=lt(t.id);return e.jsxs("div",{onClick:()=>{r||w("gemini-3.8-flash-tts"),P(t.id)},className:y("p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-gradient-to-br from-teal-50/95 via-emerald-50/60 to-white dark:from-teal-950/50 dark:via-emerald-950/25 dark:to-zinc-900 border-teal-500 ring-2 ring-teal-500/20 shadow-xs":"bg-white dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/70 dark:hover:bg-zinc-800/60",!r&&"opacity-75 border-dashed"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:"text-sm font-extrabold text-slate-900 dark:text-white truncate",children:t.name}),t.tag&&e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 shrink-0",children:t.tag})]}),e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap mt-1",children:[e.jsx("span",{className:y("text-[9px] font-bold px-1.5 py-0.5 rounded",t.gender==="Femenino"?"bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20":"bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"),children:t.gender==="Femenino"?"♀ Femenina":"♂ Masculina"}),r?e.jsx("span",{className:"text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded",children:"✓ Activa"}):e.jsx("span",{className:"text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded",children:"Requiere 3.8/3.1"})]})]}),e.jsxs("button",{type:"button",onClick:n=>xs(t.id,n),disabled:s,title:`Escuchar muestra de ${t.name}`,className:"px-2 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer flex items-center gap-1 text-[10px] font-extrabold",children:[s?e.jsx(q,{className:"w-3 h-3 animate-spin"}):e.jsx($e,{className:"w-3 h-3 fill-current"}),e.jsx("span",{children:"Oír"})]})]}),e.jsx("p",{className:"text-[11px] text-teal-700 dark:text-teal-300 font-bold mt-2 leading-snug",children:t.tone})]}),e.jsxs("div",{className:"mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2",children:[e.jsx("p",{className:"text-[10px] text-slate-600 dark:text-zinc-400 line-clamp-1 leading-tight",children:t.recommendedFor}),!r&&e.jsx("button",{type:"button",onClick:n=>{n.stopPropagation(),w("gemini-3.8-flash-tts"),P(t.id)},className:"text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded shrink-0 cursor-pointer",children:"Usar con 3.8 →"})]})]},t.id)})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"Directiva de Estilo y Emoción"}),e.jsx("span",{className:"text-[10px] font-mono text-slate-500 dark:text-zinc-400",children:"speechMetadata.style"})]}),e.jsx("textarea",{rows:2,value:B,onChange:t=>G(t.target.value),placeholder:"Ej: Voz cálida, pausada y reflexiva de narrador de documentales...",className:"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{children:[e.jsxs("button",{type:"button",onClick:()=>Ws(!ma),className:"flex items-center justify-between w-full text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-extrabold py-1 transition cursor-pointer",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(Ar,{className:"w-3.5 h-3.5 text-teal-500"}),"Motor de Capas de Audio (~1 min por capa) & Unión Master"]}),e.jsx("span",{children:ma?"▲":"▼"})]}),ma&&e.jsxs("div",{className:"mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs",children:[e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-1.5",children:[{words:110,label:"~45 seg",sub:"110 pal."},{words:150,label:"~1 min ★",sub:"150 pal. (Óptimo)"},{words:220,label:"~1.5 min",sub:"220 pal."},{words:280,label:"~2 min",sub:"280 pal."}].map(t=>{const a=Math.abs(ze-t.words)<=10;return e.jsxs("button",{type:"button",onClick:()=>Va(t.words),className:y("px-2 py-1.5 rounded-lg border text-center transition cursor-pointer",a?"bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 font-extrabold shadow-2xs":"bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-zinc-300 hover:border-teal-400"),children:[e.jsx("div",{className:"text-[11px] font-bold",children:t.label}),e.jsx("div",{className:"text-[9px] opacity-80",children:t.sub})]},t.words)})}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-slate-600 dark:text-zinc-400",children:"Tamaño de cada capa de audio:"}),e.jsxs("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:[ze," palabras (~",Math.max(20,Math.round(ze/145*60)),"s)"]})]}),e.jsx("input",{type:"range",min:80,max:280,step:10,value:ze,onChange:t=>Va(parseInt(t.target.value,10)),className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-teal-600"}),e.jsxs("p",{className:"text-[10px] text-slate-600 dark:text-zinc-400 leading-relaxed",children:[e.jsx("strong",{children:"Recomendado (~1 min / 150 palabras):"})," Cada capa se genera en ~4 segundos sin saturar la API, permite preescuchar cada fragmento al instante y une todas las capas en un solo ",e.jsx("strong",{children:"WAV Master 24kHz"})," con micro-fades sin cortes."]})]})]})]}),e.jsxs("div",{className:"lg:col-span-7 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:y("p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all",Ue>0?"bg-emerald-500/10 border-emerald-500/30":"bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border-indigo-500/25"),children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[e.jsx("div",{className:y("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",Ue>0?"bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300":"bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300"),children:e.jsx(Pt,{className:"w-4 h-4"})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5",children:Ue>0?e.jsx(e.Fragment,{children:e.jsxs("span",{children:[Ue," clave(s) API guardada(s) • Rotación y failover automático (429) activados"]})}):e.jsx(e.Fragment,{children:e.jsx("span",{children:"Motor Multi-Key Gemini TTS (Almacenamiento Local + Respaldo WAPPY)"})})}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:Ue>0?"Si una clave alcanza el límite de cuota (429), WAPPY Studio salta instantáneamente a la siguiente sin interrumpir tu audio.":"Puedes agregar hasta 3 claves gratuitas de Google AI Studio para multiplicar tu cuota de síntesis de 60 min."})]})]}),e.jsx(b,{size:"sm",alwaysExpanded:!0,icon:e.jsx(Pt,{}),label:Ue>0?"Administrar Claves":"Configurar Claves",variant:"fuchsia",onClick:()=>{St(""),ee("keys"),jt(!0)}})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2.5",children:[e.jsxs("h2",{className:"text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 shrink-0",children:[e.jsx(pt,{className:"w-4 h-4 text-teal-500"}),"Texto a Sintetizar"]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 min-w-0",children:[e.jsxs("select",{defaultValue:"",onChange:t=>{const a=Rt.find(s=>s.title===t.target.value);a&&(Ie(a.text),a.text.includes("Alex:")&&a.text.includes("Sam:")&&Me(!0)),t.target.value=""},className:"min-w-0 max-w-[230px] sm:max-w-[260px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer",children:[e.jsxs("option",{value:"",disabled:!0,children:["📋 Cargar ejemplo (",Rt.length," plantillas)..."]}),Rt.map(t=>e.jsx("option",{value:t.title,children:t.title},t.title))]}),e.jsx(b,{size:"sm",alwaysExpanded:!0,icon:T?e.jsx(q,{className:"animate-spin"}):e.jsx(tt,{}),label:T?"Enriqueciendo...":"Mejorar Guion con IA",variant:"purple",disabled:T,onClick:mr,title:`Enriquecer o generar guion con Vocal Bursts usando ${_}`}),E&&e.jsx(b,{size:"sm",icon:e.jsx(Ye,{}),label:"Limpiar",variant:"danger",onClick:()=>Ie("")})]})]}),e.jsxs("div",{className:"p-3 bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px]",children:[e.jsxs("span",{className:"font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1",children:[e.jsx(Oe,{className:"w-3.5 h-3.5 text-amber-500"}),"Insertar Pausas, Énfasis y Efectos Vocales (Vocal Bursts) en el cursor:"]}),e.jsx("span",{className:"font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold",children:f})]}),e.jsxs("div",{className:"flex flex-wrap gap-1.5",children:[Is.slice(0,3).map(t=>e.jsxs("button",{type:"button",onClick:()=>Zt(` ${t.tag} `),title:t.desc,className:"px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-mono transition flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx("span",{className:"text-indigo-700 dark:text-indigo-300 font-bold",children:t.tag}),e.jsxs("span",{className:"text-slate-600 dark:text-zinc-400 text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),te.map(t=>e.jsxs("button",{type:"button",onClick:()=>Zt(` ${t.tag} `),title:t.description,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-500/10 border border-slate-200 dark:border-slate-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx("span",{className:"text-amber-700 dark:text-amber-400 font-bold",children:t.tag}),e.jsxs("span",{className:"text-slate-600 dark:text-zinc-400 text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),e.jsx("button",{type:"button",onClick:()=>Zt(`
Alex: `),className:"px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold transition cursor-pointer",children:"Alex:"}),e.jsx("button",{type:"button",onClick:()=>Zt(`
Sam: `),className:"px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold transition cursor-pointer",children:"Sam:"})]})]}),e.jsx("textarea",{id:"wappy-studio-tts-editor",rows:10,value:E,onChange:t=>Ie(t.target.value),placeholder:"Escribe o pega aquí el guion para tu cápsula SST, curso de Academia WAPPY, podcast o audiolibro de hasta 1 hora...",className:"w-full bg-white dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 leading-relaxed resize-y min-h-[210px] shadow-inner"}),e.jsxs("div",{className:"p-3.5 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-teal-500/5 border border-indigo-500/25 rounded-2xl space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5",children:[e.jsx(At,{className:"w-4 h-4 text-indigo-500"}),"Asistente Paso a Paso: Escenas por Tiempos, Pausas & Efectos Antigravity"]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:"Estructura cada tramo (`0.0s-2.0s` Portada 🔥 ¡GRATIS!, `2.0s-8.0s`...) con pausas y efectos visuales."})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsx(b,{size:"sm",alwaysExpanded:!0,icon:e.jsx(tt,{}),label:"Auto-Estructurar por Tiempos",variant:"purple",onClick:gs}),e.jsx(b,{size:"sm",alwaysExpanded:!0,icon:e.jsx(Ve,{}),label:"Aplicar Escenas al Guion",variant:"teal",onClick:gr}),e.jsx(b,{size:"sm",icon:e.jsx(Mt,{}),label:"Añadir Escena",variant:"emerald",onClick:()=>Ae(t=>[...t,{id:`step-${Date.now()}`,timeRange:`${t.length*5}.0s-${(t.length+1)*5}.0s`,title:`Escena 0${t.length+1}`,narration:"[pausa 0.5s] Nueva frase sincronizada con la voz. <breath>",visualEffect:"07 Zoom-Through"}])})]})]}),e.jsx("div",{className:"space-y-2 max-h-[250px] overflow-y-auto pr-1",children:(Array.isArray(pe)?pe:[]).map((t,a)=>e.jsxs("div",{className:"p-2.5 rounded-xl bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 space-y-2",children:[e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-12 gap-2 items-center",children:[e.jsx("div",{className:"sm:col-span-3",children:e.jsx("input",{type:"text",value:t.timeRange,onChange:s=>{const r=s.target.value;Ae(n=>n.map((i,o)=>o===a?{...i,timeRange:r}:i))},placeholder:"0.0s-2.0s",className:"w-full px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-mono font-extrabold text-indigo-700 dark:text-indigo-300"})}),e.jsx("div",{className:"sm:col-span-4",children:e.jsx("input",{type:"text",value:t.title,onChange:s=>{const r=s.target.value;Ae(n=>n.map((i,o)=>o===a?{...i,title:r}:i))},placeholder:"Título de la escena...",className:"w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"})}),e.jsx("div",{className:"sm:col-span-4",children:e.jsx("select",{value:t.visualEffect,onChange:s=>{const r=s.target.value;Ae(n=>n.map((i,o)=>o===a?{...i,visualEffect:r}:i))},className:"w-full px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[11px] font-bold text-purple-700 dark:text-purple-300",children:st.map(s=>e.jsx("option",{value:s.label,children:s.label},s.id))})}),e.jsx("div",{className:"sm:col-span-1 flex justify-end",children:e.jsx(b,{size:"sm",icon:e.jsx(Ye,{}),label:"Quitar",variant:"danger",disabled:pe.length<=1,onClick:()=>Ae(s=>s.filter((r,n)=>n!==a))})})]}),e.jsx("input",{type:"text",value:t.narration,onChange:s=>{const r=s.target.value;Ae(n=>n.map((i,o)=>o===a?{...i,narration:r}:i))},placeholder:"Locución de este tramo con pausas ([pausa 0.5s], <breath>)...",className:"w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"})]},t.id))})]}),e.jsxs("div",{className:"bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between text-xs gap-2",children:[e.jsxs("div",{className:"flex items-center gap-3 text-slate-600 dark:text-slate-300",children:[e.jsxs("span",{children:["Palabras:"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white font-mono",children:ca})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Caracteres:"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white font-mono",children:Fs})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Fragmentos estimados:"," ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400 font-mono",children:bt})]})]}),e.jsxs("div",{className:"text-slate-900 dark:text-white font-semibold",children:["Duración estimada:"," ",e.jsxs("strong",{className:"text-amber-600 dark:text-amber-400 font-mono",children:["~",It," min"]})," ","/ 60 min máx"]})]}),e.jsx("div",{className:"w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,Math.round(It/60*100)))}%`}})})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1",children:[e.jsx(b,{alwaysExpanded:!0,icon:pa?e.jsx(q,{className:"animate-spin"}):e.jsx(Ps,{}),label:"Vista Previa Rápida (~1er fragmento)",variant:"amber",disabled:pa||(se==null?void 0:se.status)==="processing"||!E.trim(),onClick:pr}),e.jsx(b,{alwaysExpanded:!0,icon:(se==null?void 0:se.status)==="processing"?e.jsx(q,{className:"animate-spin"}):e.jsx($e,{}),label:bt>1?`Generar Audio Completo (${bt} fragmentos • ~${It} min)`:"Generar Audio Completo",variant:"teal",disabled:(se==null?void 0:se.status)==="processing"||pa||!E.trim(),onClick:xr})]})]})]})]}),C==="video"&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200",children:[e.jsxs("div",{className:"lg:col-span-6 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsx("div",{className:"flex items-center justify-between gap-2",children:e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(Ce,{className:"w-5 h-5 text-purple-500"}),"Estudio de Capas & Motion Graphics HTML (Antigravity 60-FPS)"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Sube tu propio video grabado a cámara o genera animaciones Antigravity 60-FPS / HyperFrames sincronizadas con tu voz."})]})}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",onClick:()=>{ba("9:16"),He("9:16",!!Q,nt)},className:y("p-3 rounded-xl border text-left transition cursor-pointer",I==="9:16"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:"📱 Vertical 9:16 (Reels / TikTok)"}),e.jsx("div",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5",children:"1080 × 1920 px • Ideal para redes y WhatsApp"})]}),e.jsxs("button",{type:"button",onClick:()=>{ba("16:9"),He("16:9",!!Q,nt)},className:y("p-3 rounded-xl border text-left transition cursor-pointer",I==="16:9"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:"🖥️ Horizontal 16:9 (YouTube / LMS)"}),e.jsx("div",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5",children:"1920 × 1080 px • Ideal para cursos Academia WAPPY"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(Oe,{className:"w-3.5 h-3.5 text-teal-500"}),"Plantillas Visuales Instantáneas (HyperFrames)"]}),e.jsx("span",{className:"text-[10px] text-slate-600 dark:text-slate-300",children:"Clic para aplicar"})]}),e.jsx("div",{className:"grid grid-cols-2 gap-2",children:Jr.map(t=>{const a=nt===t.id;return e.jsxs("button",{type:"button",onClick:()=>{qs(t.id),He(I,!!Q,t.id)},className:y("p-2.5 rounded-xl border text-left transition cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-slate-900 dark:text-white truncate",children:t.name}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0",children:t.badge})]}),e.jsx("p",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1",children:t.description})]},t.id)})})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3",children:[e.jsxs("div",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(At,{className:"w-4 h-4 text-teal-500"}),"Capas Base Multimedia (Video a Cámara + Locución)"]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{className:"p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"1. Tu Video Base (Opcional)"}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:Ja?`Activo: ${Ja}`:"Sube un MP4/WebM tuyo para montarle capas HTML encima."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(Ls,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Video MP4"}),e.jsx("input",{type:"file",accept:"video/mp4,video/webm,video/quicktime",onChange:yr,className:"hidden"})]}),Q&&e.jsx(b,{size:"sm",icon:e.jsx(Ye,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(Q),Ka(null),Za(""),He(I,!1)}})]})]}),e.jsxs("div",{className:"p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"2. Audio / Locución Sincronizada"}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:Qa?`Archivo: ${Qa}`:d?`Vinculado: ${d.title}`:"Usa el audio del Estudio TTS o sube un WAV/MP3."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(Ls,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Audio WAV/MP3"}),e.jsx("input",{type:"file",accept:"audio/*",onChange:vr,className:"hidden"})]}),Je&&e.jsx(b,{size:"sm",icon:e.jsx(Ye,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(Je),Xa(null),es("")}})]})]})]})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"3. Textos de Capa y Subtítulos Dinámicos"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:ve,onChange:t=>ts(t.target.checked),className:"rounded accent-teal-600"}),"Subtítulos"]}),ve&&e.jsx("div",{className:"inline-flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]",children:[{id:"bottom",label:"Abajo"},{id:"center",label:"Centro"},{id:"top",label:"Arriba"}].map(t=>e.jsx("button",{type:"button",onClick:()=>Wa(t.id),className:y("px-1.5 py-0.5 rounded transition cursor-pointer",Ke===t.id?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white"),children:t.label},t.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Insignia Superior (Badge)"}),e.jsx("input",{type:"text",value:ft,onChange:t=>Ks(t.target.value),className:"w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Acento"}),e.jsx("div",{className:"flex items-center gap-2",children:["#14b8a6","#10b981","#6366f1","#f59e0b","#f43f5e"].map(t=>e.jsx("button",{type:"button",onClick:()=>Xs(t),style:{backgroundColor:t},className:y("w-6 h-6 rounded-full border-2 transition cursor-pointer",yt===t?"border-white ring-2 ring-teal-500 scale-110":"border-transparent opacity-80")},t))})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Titular Principal en Pantalla"}),e.jsx("input",{type:"text",value:_e,onChange:t=>Js(t.target.value),className:"w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold"})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("input",{type:"text",value:ht,onChange:t=>Zs(t.target.value),placeholder:"Subtítulo secundario...",className:"flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"}),e.jsx(b,{icon:e.jsx(Ma,{}),label:"Aplicar al Lienzo",variant:"cyan",alwaysExpanded:!0,onClick:()=>He(I,!!Q)})]})]}),e.jsxs("div",{className:"p-4 bg-purple-500/5 border border-purple-500/25 rounded-2xl space-y-3.5",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx(tt,{className:"w-4 h-4 text-purple-500"}),"4. Motor Antigravity HTML + GSAP (Flujo en 3 Pasos)"]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(b,{size:"sm",icon:e.jsx(At,{}),label:Bt?"Ocultar Escaleta":"Tiempos & Escaleta",variant:"amber",isActive:Bt,onClick:()=>er(!Bt)}),e.jsx(b,{size:"sm",icon:e.jsx(Pr,{}),label:Ht?"Ocultar HTML":"Código HTML",variant:"neutral",isActive:Ht,onClick:()=>sr(!Ht)})]})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsx("span",{className:"block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:"Dirección de Arte Oficial (Brandbook WAPPY IA):"}),e.jsx("div",{className:"grid grid-cols-2 gap-1.5",children:aa.map(t=>{const a=Ze===t.id;return e.jsxs("button",{type:"button",onClick:()=>as(t.id),className:y("p-2 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-1.5",a?"bg-purple-500/15 border-purple-500/50 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500/30":"bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400"),children:[e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold truncate",children:t.label}),e.jsx("div",{className:"text-[9px] opacity-75 truncate",children:t.colors})]}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 shrink-0",children:"60 FPS"})]},t.id)})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:["Efectos Visuales Antigravity Activos (",Ne.length,"):"]}),e.jsx("button",{type:"button",onClick:()=>ge("lab"),className:"text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer",children:"Ver catálogo completo en Laboratorio →"})]}),e.jsx("div",{className:"flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800",children:st.map(t=>{const a=Ne.includes(t.id);return e.jsxs("button",{type:"button",onClick:()=>bs(t.id),title:`${t.category} — ${t.description}`,className:y("px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1",a?"bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400"),children:[e.jsx("span",{children:t.label}),a&&e.jsx(Ve,{className:"w-2.5 h-2.5 text-emerald-500"})]},t.id)})})]}),Bt&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/5 border border-amber-500/25 space-y-2 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsxs("span",{className:"text-[11px] font-extrabold text-amber-800 dark:text-amber-300",children:["Escaleta de Tiempos, Pausas y Escenas (",pe.length," tramos)"]}),e.jsx(b,{size:"sm",icon:e.jsx(tt,{}),label:"Auto-Dividir Guion",variant:"amber",alwaysExpanded:!0,onClick:gs})]}),e.jsx("div",{className:"space-y-1.5 max-h-48 overflow-y-auto pr-1",children:pe.map((t,a)=>e.jsxs("div",{className:"p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5",children:[e.jsxs("span",{className:"text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400",children:["#",a+1," • ",t.timeRange]}),e.jsx("select",{value:t.visualEffect,onChange:s=>{const r=s.target.value;Ae(n=>n.map((i,o)=>o===a?{...i,visualEffect:r}:i))},className:"text-[10px] font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-indigo-700 dark:text-indigo-300",children:st.map(s=>e.jsx("option",{value:s.label,children:s.label},s.id))})]}),e.jsx("input",{type:"text",value:t.narration,onChange:s=>{const r=s.target.value;Ae(n=>n.map((i,o)=>o===a?{...i,narration:r}:i))},className:"w-full text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-900 dark:text-white"})]},t.id))})]}),e.jsxs("div",{className:"space-y-2 pt-1 border-t border-purple-500/20",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("span",{className:"text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300",children:"Paso 1: Construir Super-Prompt Técnico (7 Piezas + Timings + Efectos)"}),e.jsx(b,{size:"sm",icon:ga?e.jsx(q,{className:"animate-spin"}):e.jsx(tt,{}),label:ga?"Construyendo Super-Prompt...":"1. Generar Super-Prompt",variant:"indigo",alwaysExpanded:!0,disabled:ga,onClick:fr})]}),e.jsx("textarea",{rows:4,value:Xe,onChange:t=>Ft(t.target.value),placeholder:"Haz clic en '1. Generar Super-Prompt' o escribe aquí las instrucciones de escenas, tiempos y efectos que Antigravity programará en HTML5 + GSAP...",className:"w-full bg-white dark:bg-slate-900 border border-purple-500/30 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 resize-y font-mono leading-relaxed"})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-purple-500/20",children:[e.jsx("span",{className:"text-[11px] font-extrabold text-purple-700 dark:text-purple-300",children:"Paso 2: Programar Video HTML5 + GSAP y Guardar en Biblioteca"}),e.jsx(b,{size:"md",icon:Ut?e.jsx(q,{className:"animate-spin"}):e.jsx(Oe,{}),label:Ut?"Antigravity Programando HTML + GSAP...":"2. Enviar al Generador de Video (Antigravity)",variant:"purple",alwaysExpanded:!0,disabled:Ut,onClick:hr})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/25 space-y-2",children:[e.jsx("div",{className:"flex flex-wrap items-center justify-between gap-2",children:e.jsxs("span",{className:"text-[11px] font-extrabold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5",children:[e.jsx(Ma,{className:"w-3.5 h-3.5 text-cyan-500"}),"Paso 3: ¿Algo no te gustó del video? Pide correcciones a Antigravity"]})}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center gap-2",children:[e.jsx("input",{type:"text",value:vt,onChange:t=>tr(t.target.value),onKeyDown:t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),hs())},placeholder:"Ej: Haz los textos más grandes, agrega un gráfico de barras en el segundo 4, cambia el fondo a azul oscuro...",className:"flex-1 bg-white dark:bg-slate-900 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"}),e.jsx(b,{size:"sm",icon:fa?e.jsx(q,{className:"animate-spin"}):e.jsx(tt,{}),label:fa?"Aplicando Correcciones...":"3. Enviar Correcciones a Antigravity",variant:"cyan",alwaysExpanded:!0,disabled:fa||!vt.trim(),onClick:hs})]})]}),Ht&&e.jsxs("div",{className:"pt-2",children:[e.jsx("label",{className:"block text-[10px] font-mono uppercase text-slate-600 dark:text-slate-300 mb-1",children:"Código Fuente HTML5 / Tailwind / GSAP en Vivo:"}),e.jsx("textarea",{rows:10,value:Be,onChange:t=>Fe(t.target.value),className:"w-full bg-slate-950 text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500"})]})]})]}),e.jsxs("div",{className:"lg:col-span-6 space-y-4 bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-nowrap",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[e.jsx("span",{className:y("w-2.5 h-2.5 rounded-full shrink-0",ne?"bg-amber-500 animate-ping":Pe?"bg-emerald-500 animate-pulse":"bg-slate-400")}),e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white truncate",children:ne?`Editor Visual (${I})`:`Lienzo Interactivo (${I})`})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(b,{size:"sm",icon:qa?e.jsx(q,{className:"animate-spin"}):e.jsx(pt,{}),label:"Sincronizar Voz IA",variant:"purple",disabled:qa,onClick:br}),e.jsx(b,{size:"sm",icon:e.jsx(Qt,{}),label:ne?"Salir de Edición":"Editar Lienzo",variant:"orange",isActive:ne,onClick:ws}),e.jsx(b,{size:"sm",icon:wt?e.jsx(q,{className:"animate-spin"}):e.jsx(Ce,{}),label:"Descargar MP4 (WhatsApp/Celular)",variant:"teal",disabled:wt,onClick:Ta}),e.jsx(b,{size:"sm",icon:kt?e.jsx(q,{className:"animate-spin"}):e.jsx(xt,{}),label:"Cápsula Academia (HTML5)",variant:"green",disabled:kt,onClick:Ns}),e.jsx(b,{size:"sm",icon:e.jsx(Rs,{}),label:"Guardar en Biblioteca",variant:"teal",onClick:()=>Et({},!1)}),e.jsx(b,{size:"sm",icon:e.jsx(Mr,{}),label:"Pantalla Completa",variant:"neutral",onClick:ks})]})]}),ne&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5",children:[e.jsx(Lr,{className:"w-3.5 h-3.5 text-amber-500 shrink-0"}),"Arrastra cualquier caja o título con el mouse para moverlo • Doble clic para escribir"]}),e.jsxs("button",{type:"button",onClick:wr,className:"px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx(Ve,{className:"w-3 h-3"}),"Guardar Cambios"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"text"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(Mt,{className:"w-3 h-3 text-teal-500"}),e.jsx(Rr,{className:"w-3 h-3 text-teal-500"}),e.jsx("span",{children:"+ Texto"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"card"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(Mt,{className:"w-3 h-3 text-purple-500"}),e.jsx(At,{className:"w-3 h-3 text-purple-500"}),e.jsx("span",{children:"+ Caja / Tarjeta"})]}),e.jsx("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_SELECT_PARENT"},"*")},disabled:!ue,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 disabled:opacity-40 cursor-pointer",children:"Seleccionar Caja Contenedora"}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DUPLICATE_SELECTED"},"*")},disabled:!ue,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(La,{className:"w-3 h-3 text-indigo-500"}),e.jsx("span",{children:"Duplicar"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DELETE_SELECTED"},"*")},disabled:!ue,className:"px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(Ye,{className:"w-3 h-3"}),e.jsx("span",{children:"Eliminar"})]})]})]}),e.jsx("div",{className:"flex justify-center items-center bg-slate-950 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-inner overflow-hidden min-h-[460px]",children:e.jsxs("div",{ref:ds,className:y("relative overflow-hidden bg-slate-950 shadow-2xl border border-white/10 transition-all duration-300",ya?"w-screen h-screen rounded-none border-0 flex flex-col items-center justify-between p-4 sm:p-6":y("rounded-2xl mx-auto flex items-center justify-center",I==="9:16"?"w-full max-w-[390px] aspect-[9/16] max-h-[660px]":"w-full aspect-[16/9] max-h-[660px] min-h-[340px]")),children:[e.jsxs("div",{className:y("relative overflow-hidden bg-slate-950",ya?I==="9:16"?"h-[calc(100vh-100px)] aspect-[9/16] max-w-[95vw] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-[min(94vw,calc((100vh-100px)*1.7778))] aspect-[16/9] max-h-[calc(100vh-100px)] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-full h-full"),children:[fe&&e.jsx("audio",{ref:le,src:fe,preload:"metadata",onTimeUpdate:t=>{var r,n;const a=t.currentTarget.currentTime,s=t.currentTarget.duration&&!isNaN(t.currentTarget.duration)?t.currentTarget.duration:D||20;Te(a),(n=(r=M.current)==null?void 0:r.contentWindow)==null||n.postMessage({type:"STUDIO_SYNC_TIME",currentTime:a,duration:s,playing:!t.currentTarget.paused&&!t.currentTarget.ended},"*")},onLoadedMetadata:t=>{t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&et(t.currentTarget.duration)},onEnded:()=>{var t,a,s;De(!1),(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_PAUSE"},"*"),(s=oe.current)==null||s.pause()}}),Q&&e.jsx("video",{ref:oe,src:Q,width:I==="9:16"?1080:1920,height:I==="9:16"?1920:1080,muted:_t,playsInline:!0,loop:!0,preload:"metadata",onTimeUpdate:t=>{fe||Te(t.currentTarget.currentTime)},onLoadedMetadata:t=>{!fe&&t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&et(t.currentTarget.duration)},className:"absolute inset-0 w-full h-full object-cover z-0"}),e.jsx("iframe",{ref:M,title:"WAPPY Studio HTML Canvas",srcDoc:or,sandbox:"allow-scripts allow-same-origin",onLoad:()=>{var t,a,s,r,n,i;(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*"),ne?(r=(s=M.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!0},"*"):Pe||(i=(n=M.current)==null?void 0:n.contentWindow)==null||i.postMessage({type:"STUDIO_PAUSE"},"*")},className:y("absolute inset-0 w-full h-full border-0 z-10",ne?"pointer-events-auto":"pointer-events-none")}),ve&&Na&&e.jsx("div",{className:y("absolute inset-x-3 z-20 flex justify-center pointer-events-none",Ke==="top"?"top-16":Ke==="center"?"top-1/2 -translate-y-1/2":"bottom-5"),children:e.jsx("div",{className:"bg-[#050c12]/90 backdrop-blur-md border border-[#c7f303]/40 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]",children:e.jsx("div",{className:"flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1",children:Na.words.map((t,a)=>{const s=a===Na.activeOffset;return e.jsx("span",{className:y("text-sm sm:text-base font-black uppercase tracking-wide transition-all duration-150",s?"text-[#080c04] scale-110 bg-[#c7f303] px-2 py-0.5 rounded-lg shadow-[0_0_14px_rgba(199,243,3,0.45)]":"text-white/95"),children:t},`${t}-${a}`)})})})})]}),ya&&e.jsxs("div",{className:"w-full max-w-3xl mx-auto mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 flex items-center gap-3 z-30 shadow-2xl",children:[e.jsx("button",{type:"button",onClick:ys,title:Pe?"Pausar / Parar":"Reproducir",className:"px-3.5 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:Pe?e.jsxs(e.Fragment,{children:[e.jsx(ia,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx($e,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:Sa,title:"Reiniciar animación",className:"p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer shrink-0",children:e.jsx(Ra,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:D||20,step:.1,value:Qe,onChange:t=>vs(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-200 shrink-0",children:[Qe.toFixed(1),"s / ",(D||20).toFixed(1),"s"]}),e.jsxs("button",{type:"button",onClick:ws,className:y("px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0",ne?"bg-amber-500/20 border-amber-400 text-amber-300":"bg-slate-800 border-slate-700 text-slate-200 hover:text-white"),children:[e.jsx(Qt,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:ne?"Editando":"Editar"})]}),e.jsxs("button",{type:"button",onClick:ks,className:"px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0",children:[e.jsx(zr,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Salir"})]})]})]})}),e.jsxs("div",{className:"p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{type:"button",onClick:ys,title:Pe?"Pausar animación y subtítulos":"Reproducir animación y subtítulos",className:"px-3 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:Pe?e.jsxs(e.Fragment,{children:[e.jsx(ia,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx($e,{className:"w-4 h-4 fill-white ml-0.5"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:Sa,title:"Reiniciar animación",className:"p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition cursor-pointer shrink-0",children:e.jsx(Ra,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:D||20,step:.1,value:Qe,onChange:t=>vs(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0",children:[Qe.toFixed(1),"s / ",(D||20).toFixed(1),"s"]}),Q&&e.jsx("button",{type:"button",onClick:()=>Ys(!_t),title:_t?"Activar audio del video original":"Silenciar video original",className:"p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition cursor-pointer",children:_t?e.jsx(Vs,{className:"w-4 h-4 text-rose-500"}):e.jsx(rt,{className:"w-4 h-4 text-teal-500"})})]}),e.jsxs("div",{className:"pt-2 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("div",{className:"p-3 rounded-xl border bg-teal-500/10 border-teal-500/30 text-teal-800 dark:text-teal-200 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20",children:"WhatsApp • Celular • Redes"}),e.jsx(Ce,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight mt-1.5",children:"Renderizado .MP4 Antigravity (60 FPS + Voz)"}),e.jsx("div",{className:"text-[10px] opacity-85 leading-snug mt-0.5",children:"Une Animación HTML + Subtítulos + Voz IA en un archivo .MP4 listo para WhatsApp o Reels"})]}),e.jsx(b,{size:"sm",icon:wt?e.jsx(q,{className:"animate-spin"}):e.jsx(Ce,{}),label:wt?"Renderizando Video MP4...":"Descargar Video .MP4 (Todo Unido)",variant:"teal",alwaysExpanded:!0,disabled:wt,onClick:Ta,className:"w-full justify-center"})]}),e.jsxs("div",{className:"p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20",children:"Descarga Instantánea • Offline"}),e.jsx(Ca,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight mt-1.5",children:"Cápsula Interactiva HTML5 (Móvil & Web)"}),e.jsx("div",{className:"text-[10px] opacity-85 leading-snug mt-0.5",children:"Descarga inmediata del archivo .HTML con animación y audio integrados"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsx(b,{size:"sm",icon:kt?e.jsx(q,{className:"animate-spin"}):e.jsx(xt,{}),label:"Descargar .HTML",variant:"green",alwaysExpanded:!0,disabled:kt,onClick:Ns,className:"flex-1 justify-center"}),e.jsx(b,{size:"sm",icon:e.jsx(La,{}),label:"Copiar LMS",variant:"fuchsia",alwaysExpanded:!0,disabled:kt,onClick:jr})]})]})]})]}),ne&&ue&&e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/95 rounded-2xl border border-teal-500/40 space-y-3 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5",children:[e.jsx(Qt,{className:"w-3.5 h-3.5"}),"Propiedades del Elemento Seleccionado (<",ue.tagName,">)"]}),e.jsx("button",{type:"button",onClick:()=>Ge({dx:0,dy:0,scale:1}),className:"text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer",children:"Restablecer posición"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Texto del elemento (edita aquí o con doble clic en el video):"}),e.jsx("textarea",{rows:2,value:ue.text,onChange:t=>Ge({text:t.target.value}),className:"w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:["Tamaño Letra (",ue.fontSize,"px)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>Ge({fontSize:Math.max(10,ue.fontSize-2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"A-"}),e.jsx("button",{type:"button",onClick:()=>Ge({fontSize:Math.min(96,ue.fontSize+2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"A+"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:["Escala Caja (",ue.scale,"x)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>Ge({scale:Math.max(.5,Number((ue.scale-.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"-"}),e.jsx("button",{type:"button",onClick:()=>Ge({scale:Math.min(2.5,Number((ue.scale+.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"+"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Texto"}),e.jsx("input",{type:"color",value:ue.color,onChange:t=>Ge({color:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Fondo"}),e.jsx("input",{type:"color",value:ue.backgroundColor,onChange:t=>Ge({backgroundColor:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"})]})]})]})]})]}),C==="lab"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-xs",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0",children:e.jsx(Oe,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:"Laboratorio de Voces, Pausas, Vocal Bursts & Efectos Antigravity"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Escucha y prueba las 30 voces en vivo, construye pausas/respiraciones y selecciona los efectos visuales de las Skills de Antigravity para tu video."})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(b,{size:"sm",icon:e.jsx(rt,{}),label:"SFX Whoosh",variant:"cyan",alwaysExpanded:!0,onClick:()=>Ea("whoosh")}),e.jsx(b,{size:"sm",icon:e.jsx(rt,{}),label:"SFX Pop",variant:"amber",alwaysExpanded:!0,onClick:()=>Ea("pop")}),e.jsx(b,{size:"sm",icon:e.jsx(rt,{}),label:"SFX Ding",variant:"emerald",alwaysExpanded:!0,onClick:()=>Ea("ding")})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:"Modelo en el Laboratorio:"}),e.jsx("div",{className:"flex flex-wrap items-center gap-2",children:ae.map(t=>{const a=f===t.id;return e.jsxs("button",{type:"button",onClick:()=>{w(t.id),t.supportedVoices.includes(g)||P(t.supportedVoices[0]||"Kore")},className:y("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[t.name," (",t.supportedVoices.length," voces)"]},t.id)})})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsx("div",{className:"flex flex-wrap items-center justify-between gap-2",children:e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:"1. Efectos Vocales Orgánicos (Vocal Bursts en Vivo)"}),e.jsxs("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:["Escucha cómo suena cada etiqueta con la voz actual (",g,") o insértala en tu frase de prueba."]})]})}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:te.map(t=>{const a=_s===t.tag;return e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400",children:t.tag}),e.jsx("p",{className:"text-xs font-bold text-slate-900 dark:text-white mt-0.5",children:t.label}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:t.description})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[e.jsx(b,{size:"sm",icon:e.jsx(Mt,{}),label:"Insertar",variant:"amber",onClick:()=>{la(s=>`${s.trim()} ${t.tag} `)}}),e.jsx(b,{size:"sm",icon:a?e.jsx(q,{className:"animate-spin"}):e.jsx($e,{}),label:"Probar",variant:"indigo",disabled:a,onClick:async()=>{try{_a(t.tag);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({voiceName:g,model:"gemini-3.8-flash-tts",stylePrompt:"Voz muy expresiva y natural.",text:`Escucha cómo suena este efecto natural en medio de una frase: ${t.tag} ¡Suena totalmente humano!`})}),r=await be(s);r.audioBase64&&ie({base64:r.audioBase64,title:`Efecto ${t.tag} (${g})`,durationSeconds:r.durationSeconds,voiceName:g})}catch(s){k({type:"error",text:s.message})}finally{_a(null)}}})]})]},t.tag)})})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:"2. Probador de Voces en Vivo y Constructor de Pausas / Énfasis"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Selecciona cualquier voz, escucha su timbre al instante, agrega pausas y envía tu configuración al Estudio de Voz o al Editor de Video."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",children:["Voces activas: ",dt," de ",A.length]}),e.jsx(b,{size:"sm",icon:ua===g?e.jsx(q,{className:"animate-spin"}):e.jsx(rt,{}),label:`Escuchar ${g}`,variant:"teal",alwaysExpanded:!0,disabled:ua===g,onClick:()=>xs(g)})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:["Selecciona la Voz (",dt," activas para ",$==null?void 0:$.name,")"]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:A.map(t=>{const a=g===t.id,s=lt(t.id);return e.jsxs("button",{type:"button",onClick:()=>{s||w("gemini-3.8-flash-tts"),P(t.id)},className:y("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5",a?"bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/50 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-teal-400",!s&&"opacity-55"),children:[e.jsxs("span",{children:[t.name," (",t.gender,")"]}),s&&e.jsx(Ve,{className:"w-3 h-3 text-emerald-500"})]},t.id)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5",children:"Prompt de Dirección (speechMetadata.style)"}),e.jsx("input",{type:"text",value:mt,onChange:t=>$s(t.target.value),className:"w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsx("span",{className:"block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:"Insertar Pausas, Respiración y Énfasis en el Texto de Prueba:"}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:Is.map(t=>e.jsxs("button",{type:"button",onClick:()=>la(a=>`${a.trim()} ${t.tag} `),title:t.desc,className:"px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold transition cursor-pointer",children:["+ ",t.label," ",e.jsxs("span",{className:"font-mono opacity-75",children:["(",t.tag,")"]})]},t.tag))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5",children:"Texto de Prueba"}),e.jsx("textarea",{rows:3,value:je,onChange:t=>la(t.target.value),className:"w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[e.jsx(b,{size:"md",icon:da?e.jsx(q,{className:"animate-spin"}):e.jsx(Oe,{}),label:da?"Sintetizando en el Laboratorio...":"Sintetizar en el Laboratorio",variant:"indigo",alwaysExpanded:!0,disabled:da||!je.trim(),onClick:ur}),e.jsx(b,{size:"md",icon:e.jsx(pt,{}),label:"Llevar Frase y Voz al Estudio TTS",variant:"teal",alwaysExpanded:!0,onClick:()=>{Ie(je),G(mt),ge("tts")}}),e.jsx(b,{size:"md",icon:e.jsx(Ce,{}),label:"Llevar al Editor de Video",variant:"purple",alwaysExpanded:!0,onClick:()=>{Ie(je),G(mt),ge("video")}})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(tt,{className:"w-4 h-4 text-purple-500"}),"3. Catálogo de Efectos Visuales & Motion Graphics (Skills de Antigravity)"]}),e.jsxs("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:["Selecciona los efectos y transiciones que Antigravity encadenará a 60 FPS en tu video HTML + GSAP (",Ne.length," activos)."]})]}),e.jsx(b,{size:"sm",icon:e.jsx(Ce,{}),label:`Ir al Editor de Video (${Ne.length} efectos)`,variant:"purple",alwaysExpanded:!0,onClick:()=>ge("video")})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",children:aa.map(t=>{const a=Ze===t.id;return e.jsxs("div",{className:y("p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition",a?"bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/30":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:t.label}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30",children:"60 FPS"})]}),e.jsx("p",{className:"text-[10px] font-mono text-indigo-600 dark:text-indigo-400 mt-1",children:t.colors}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300 mt-1",children:t.description})]}),e.jsx(b,{size:"sm",icon:a?e.jsx(Ve,{}):e.jsx(Oe,{}),label:a?"Dirección Activa":"Usar Dirección de Arte",variant:a?"teal":"purple",alwaysExpanded:!0,onClick:()=>as(t.id)})]},t.id)})}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:st.map(t=>{const a=Ne.includes(t.id);return e.jsxs("div",{className:y("p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition",a?"bg-indigo-500/10 border-indigo-500/45 ring-1 ring-indigo-500/30":"bg-slate-50 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5",children:[e.jsx("span",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:t.label}),e.jsx("span",{className:"text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700",children:t.category})]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug",children:t.description})]}),e.jsx("div",{className:"flex items-center justify-between gap-2 pt-1",children:e.jsx(b,{size:"sm",icon:a?e.jsx(Ve,{}):e.jsx(Mt,{}),label:a?"Activo en Editor de Video":"Agregar al Editor de Video",variant:a?"teal":"indigo",alwaysExpanded:!0,onClick:()=>bs(t.id)})})]},t.id)})})]})]}),C==="library"&&e.jsxs("div",{className:"space-y-5 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(Ca,{className:"w-5 h-5 text-indigo-500"}),"Biblioteca de Audios y Videos HTML"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Tus locuciones WAV y tus videos HTML5 + GSAP quedan guardados permanentemente para reabrir en el editor, descargar el .HTML al instante o renderizar el .MP4 con Antigravity."})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx("div",{className:"inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800",children:[{id:"all",label:`Todos (${Se.length})`},{id:"audio",label:`🎙️ Audios (${Se.filter(t=>t.kind!=="video").length})`},{id:"video",label:`🎬 Videos HTML (${Se.filter(t=>t.kind==="video").length})`}].map(t=>e.jsx("button",{type:"button",onClick:()=>ar(t.id),className:y("px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer",ha===t.id?"bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/40":"text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"),children:t.label},t.id))}),Se.length>0&&e.jsx(b,{size:"sm",icon:e.jsx(Ye,{}),label:"Limpiar Historial",variant:"danger",alwaysExpanded:!0,onClick:()=>{window.confirm("¿Borrar todos los audios y videos guardados?")&&(it([]),Gr())}})]})]}),Se.length===0?e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2",children:[e.jsx(pt,{className:"w-10 h-10 mx-auto text-slate-400"}),e.jsx("p",{className:"text-sm font-bold text-slate-900 dark:text-white",children:"Aún no hay audios ni videos en tu biblioteca"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto",children:'Genera una locución en "Estudio de Voz (TTS)" o un video en "Compositor de Video HTML" y aparecerán aquí automáticamente.'})]}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:Se.filter(t=>ha==="video"?t.kind==="video":ha==="audio"?t.kind!=="video":!0).map(t=>e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("h4",{className:"text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1",children:t.title}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[t.kind==="video"&&e.jsxs("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30",children:["🎬 VIDEO HTML ",t.aspectRatio||""]}),e.jsx("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30",children:t.voiceName})]})]}),e.jsxs("div",{className:"flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300",children:[e.jsxs("span",{children:["⏱ ",ei(t.durationSeconds)]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[t.wordCount," palabras"]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:ti(t.createdAt)})]}),t.stylePrompt&&e.jsxs("div",{className:"p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-[11px] italic text-slate-600 dark:text-slate-300 line-clamp-2",children:['"',t.stylePrompt,'"']})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800",children:[e.jsx("div",{className:"flex flex-wrap items-center gap-1.5",children:t.kind==="video"?e.jsx(b,{size:"sm",icon:e.jsx(Qt,{}),label:"Abrir en Editor",variant:"orange",alwaysExpanded:!0,onClick:()=>Ss(t)}):e.jsxs(e.Fragment,{children:[e.jsx(b,{size:"sm",icon:e.jsx($e,{}),label:"Reproducir",variant:"teal",alwaysExpanded:!0,onClick:()=>us(t)}),e.jsx(b,{size:"sm",icon:e.jsx(Ce,{}),label:"Usar en Video",variant:"purple",alwaysExpanded:!0,onClick:()=>us(t,!0)})]})}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[t.kind==="video"&&e.jsxs(e.Fragment,{children:[e.jsx(b,{size:"sm",icon:e.jsx(xt,{}),label:"Descargar .HTML",variant:"green",alwaysExpanded:!0,onClick:async()=>{if(t.capsuleKey){const a=await ut(t.capsuleKey);if(a){Jt(a,`wappy-video-${t.id}.html`);return}}if(t.htmlKey){const a=await ut(t.htmlKey);if(a){Jt(a,`wappy-video-${t.id}.html`);return}}k({type:"error",text:"No se encontró el archivo HTML guardado para este elemento."})}}),e.jsx(b,{size:"sm",icon:e.jsx(Ce,{}),label:t.mp4Key?"Descargar .MP4":"Renderizar .MP4",variant:"teal",alwaysExpanded:!0,onClick:async()=>{if(t.mp4Key){const a=await ut(t.mp4Key);if(a){Jt(a,`wappy-studio-reel-${t.id}.mp4`);return}}await Ss(t),setTimeout(()=>{Ta()},250)}})]}),t.kind!=="video"&&e.jsx(b,{size:"sm",icon:e.jsx(xt,{}),label:"Descargar WAV",variant:"green",alwaysExpanded:!0,onClick:async()=>{const a=await ps(t);if(!a){k({type:"error",text:"Este audio ya no está disponible (se generó antes del guardado permanente). Vuelve a generarlo."});return}Jt(a,`wappy-audio-${t.id}.wav`)}}),e.jsx(b,{size:"sm",icon:e.jsx(Ye,{}),label:"Eliminar",variant:"danger",onClick:()=>lr(t)})]})]})]},t.id))})]})]}),ir&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-300 shrink-0",children:e.jsx(Pt,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:"Gestor de Claves API & Ecosistema GOOGLE_MODELS"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-zinc-400",children:"Rotación inteligente anti-429 y catálogo completo de modelos oficiales de WAPPY."})]})]}),e.jsx("button",{type:"button",onClick:()=>jt(!1),className:"p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-zinc-300 cursor-pointer",children:e.jsx(sa,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800",children:[e.jsxs("button",{type:"button",onClick:()=>ee("keys"),className:y("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",Z==="keys"?"bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(Pt,{className:"w-3.5 h-3.5"}),e.jsxs("span",{children:["Mis Claves Locales (",Ue,"/3)"]})]}),e.jsxs("button",{type:"button",onClick:()=>ee("models"),className:y("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",Z==="models"?"bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(Ms,{className:"w-3.5 h-3.5"}),e.jsxs("span",{children:["Modelos WAPPY (",zs.length,")"]})]})]}),Z==="keys"?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-900 dark:text-teal-200 leading-relaxed",children:["Obtén gratis tus claves en"," ",e.jsx("a",{href:"https://aistudio.google.com/app/apikey",target:"_blank",rel:"noopener noreferrer",className:"font-extrabold underline hover:text-teal-600",children:"Google AI Studio (aistudio.google.com)"}),". WAPPY Studio rotará automáticamente entre tus claves locales y el pool del servidor para evitar bloqueos por cuota 429 en locuciones de hasta 60 minutos."]}),e.jsx("div",{className:"space-y-2.5",children:qt.map((t,a)=>e.jsxs("div",{className:"p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px] font-bold",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-slate-900 dark:text-white",children:t.label||`Clave Google Gemini #${a+1}`}),e.jsx("span",{className:y("text-[9px] font-extrabold px-1.5 py-0.5 rounded border",a===0?"bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30":"bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"),children:a===0?"Prioridad #1":`Failover #${a+1}`})]}),t.status==="valid"&&e.jsxs("span",{className:"text-emerald-700 dark:text-emerald-400 flex items-center gap-1",children:[e.jsx(Pa,{className:"w-3.5 h-3.5"})," Activa y verificada"]}),t.status==="invalid"&&e.jsxs("span",{className:"text-rose-600 dark:text-rose-400 flex items-center gap-1",children:[e.jsx(zt,{className:"w-3.5 h-3.5"})," Clave inválida o vencida"]})]}),e.jsx("input",{type:"password",value:t.key,onChange:s=>{const r=s.target.value;Yt(n=>n.map((i,o)=>o===a?{...i,key:r,status:"unchecked"}:i))},placeholder:"AIzaSy...",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"})]},a))}),ls&&e.jsx("div",{className:"p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300",children:ls}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800",children:[e.jsx(b,{size:"sm",icon:e.jsx(Ye,{}),label:"Limpiar Claves",variant:"danger",onClick:()=>{Yt([{key:"",label:"Clave Principal #1",status:"unchecked"},{key:"",label:"Clave Respaldo #2",status:"unchecked"},{key:"",label:"Clave Respaldo #3",status:"unchecked"}]),localStorage.removeItem(ra),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),St("Claves eliminadas del navegador.")}}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(b,{size:"sm",icon:e.jsx(sa,{}),label:"Cerrar",variant:"neutral",onClick:()=>jt(!1)}),e.jsx(b,{size:"sm",icon:wa?e.jsx(q,{className:"animate-spin"}):e.jsx(Rs,{}),label:wa?"Validando...":"Guardar y Validar",variant:"teal",disabled:wa,onClick:nr})]})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed",children:[e.jsx("strong",{children:"Ecosistema Oficial GOOGLE_MODELS de WAPPY:"})," Haz clic en cualquier modelo TTS o de Generación IA para activarlo de inmediato en el estudio."]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1",children:zs.map(t=>{const a=t.id.includes("tts"),s=t.id==="gemini-3.8-flash"||t.id==="gemini-3.6-flash"||t.id==="gemini-3.5-flash-lite",r=a&&f===t.id||s&&_===t.id;return e.jsxs("div",{onClick:()=>{a?w(t.id):s&&we(t.id)},className:y("p-3 rounded-xl border text-left transition flex flex-col justify-between",a||s?"cursor-pointer":"opacity-90",r?"bg-teal-50/90 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400",children:t.category}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25",children:t.badge})]}),e.jsx("div",{className:"font-mono text-xs font-extrabold text-slate-900 dark:text-white",children:t.id}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-snug",children:t.description})]}),(a||s)&&e.jsxs("div",{className:"mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-slate-500 dark:text-zinc-400",children:a?"Motor de Voz TTS":"Motor IA Escenas/Guion"}),e.jsx("span",{className:y("font-extrabold",r?"text-emerald-700 dark:text-emerald-400":"text-indigo-600 dark:text-indigo-400"),children:r?"✓ En uso":"Usar este modelo →"})]})]},t.id)})}),e.jsx("div",{className:"flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800",children:e.jsx(b,{size:"sm",icon:e.jsx(Ve,{}),label:"Listo",variant:"teal",onClick:()=>jt(!1)})})]})]})})]})}function ai({audioBase64:c,audioUrl:x,title:u,durationSeconds:m,voiceName:j,onSendToVideo:N}){const v=l.useRef(null),[Y,de]=l.useState(!1),[V,R]=l.useState(0),[C,re]=l.useState(m||0),[_,we]=l.useState(1),[T,S]=l.useState(1),[Z,ee]=l.useState(!1),[ae,X]=l.useState(!1),A=x||(c?`data:audio/wav;base64,${c}`:"");l.useEffect(()=>{de(!1),R(0),m&&m>0&&re(m)},[A,m]);const ce=()=>{!v.current||!A||(Y?v.current.pause():v.current.play().catch(f=>console.error("Error al reproducir audio:",f)))},z=f=>{if(!v.current)return;const w=Math.max(1,C||v.current.duration||0),g=Math.max(0,Math.min(w,v.current.currentTime+f));v.current.currentTime=g,R(g)},ke=()=>{if(!v.current)return;const f=!Z;v.current.muted=f,ee(f)},te=f=>{if(!f||isNaN(f)||f<0)return"00:00";const w=Math.floor(f),g=Math.floor(w/60),P=w%60;return`${g.toString().padStart(2,"0")}:${P.toString().padStart(2,"0")}`},Ee=async()=>{if(!A)return;const f=`${u.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"wappy-tts"}.wav`;try{if(A.startsWith("data:")||A.startsWith("blob:")){const P=document.createElement("a");P.href=A,P.download=f,document.body.appendChild(P),P.click(),document.body.removeChild(P);return}const g=await fetch(A,{headers:H()});if(g.ok){const P=await g.blob(),B=URL.createObjectURL(P),G=document.createElement("a");G.href=B,G.download=f,document.body.appendChild(G),G.click(),document.body.removeChild(G),setTimeout(()=>URL.revokeObjectURL(B),4e3);return}}catch{}const w=document.createElement("a");w.href=A,w.download=f,document.body.appendChild(w),w.click(),document.body.removeChild(w)};return A?e.jsxs("div",{className:"bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 border border-indigo-500/25 dark:border-indigo-500/25 rounded-2xl p-5 shadow-xl space-y-3.5",children:[e.jsx("audio",{ref:v,src:A,preload:"metadata",onPlay:()=>de(!0),onPause:()=>de(!1),onEnded:()=>de(!1),onTimeUpdate:()=>{v.current&&R(v.current.currentTime)},onLoadedMetadata:()=>{var f;(f=v.current)!=null&&f.duration&&!isNaN(v.current.duration)&&re(v.current.duration)}}),e.jsxs("div",{className:"flex flex-wrap sm:flex-nowrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"}),e.jsx("h3",{className:"text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-xl",children:u})]}),e.jsxs("p",{className:"text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate",children:["Voz:"," ",e.jsx("span",{className:"font-semibold text-slate-700 dark:text-slate-200",children:j||"Kore"})," ","• Formato WAV 24kHz"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[c&&e.jsx(b,{size:"sm",icon:ae?e.jsx(Ve,{}):e.jsx(La,{}),label:ae?"Copiado":"Copiar Base64",variant:"fuchsia",onClick:()=>{navigator.clipboard.writeText(c),X(!0),setTimeout(()=>X(!1),2e3)}}),e.jsx(b,{size:"sm",icon:e.jsx(Ce,{}),label:"Llevar al Video",variant:"purple",alwaysExpanded:!0,onClick:N}),e.jsx(b,{size:"sm",icon:e.jsx(xt,{}),label:"Descargar WAV",variant:"green",alwaysExpanded:!0,onClick:Ee})]})]}),e.jsx("div",{className:"flex items-center justify-between gap-1 h-12 bg-slate-100/90 dark:bg-slate-950/80 rounded-xl px-4 py-2 border border-slate-200/90 dark:border-slate-800/90 overflow-hidden",children:Array.from({length:42}).map((f,w)=>{const g=C>0?V/C:0,P=w/42,B=P<=g,G=20+Math.sin(w*.4)*15+Math.cos(w*.9)*12,K=Y?Math.max(15,G*(.8+Math.sin(Date.now()/200+w)*.4)):G;return e.jsx("div",{onClick:()=>{if(v.current&&C>0){const Me=P*C;v.current.currentTime=Me,R(Me)}},style:{height:`${Math.max(16,Math.min(95,K))}%`},className:y("w-1 rounded-full cursor-pointer transition-all duration-150",B?"bg-gradient-to-t from-indigo-500 to-amber-400":"bg-slate-300 dark:bg-slate-800 hover:bg-slate-400 dark:hover:bg-slate-700")},w)})}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("input",{type:"range",min:0,max:Math.max(1,C),step:.1,value:Math.min(V,Math.max(1,C)),onChange:f=>{const w=parseFloat(f.target.value);v.current&&(v.current.currentTime=w),R(w)},className:"w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"}),e.jsxs("div",{className:"flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400",children:[e.jsx("span",{children:te(V)}),e.jsx("span",{children:te(C)})]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-0.5",children:[e.jsxs("button",{type:"button",onClick:()=>{const f=[.75,1,1.25,1.5,2],w=f[(f.indexOf(_)+1)%f.length];we(w),v.current&&(v.current.playbackRate=w)},title:"Cambiar velocidad de reproducción",className:"px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-lg border border-slate-200 dark:border-slate-700 transition shrink-0 cursor-pointer",children:[_,"x"]}),e.jsxs("div",{className:"flex items-center gap-2 sm:gap-3",children:[e.jsx("button",{type:"button",onClick:()=>z(-10),title:"Retroceder 10 segundos",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer",children:e.jsx(Ra,{className:"w-4 h-4"})}),e.jsx("button",{type:"button",onClick:ce,className:"w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition transform active:scale-95 shrink-0 cursor-pointer",children:Y?e.jsx(ia,{className:"w-5 h-5 fill-white"}):e.jsx($e,{className:"w-5 h-5 fill-white ml-0.5"})}),e.jsx("button",{type:"button",onClick:()=>z(10),title:"Adelantar 10 segundos",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer",children:e.jsx(Ir,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsx("button",{type:"button",onClick:ke,title:Z?"Activar sonido":"Silenciar",className:"p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer",children:Z||T===0?e.jsx(Vs,{className:"w-4 h-4 text-rose-500"}):e.jsx(rt,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:1,step:.05,value:Z?0:T,onChange:f=>{const w=parseFloat(f.target.value);S(w),ee(w===0),v.current&&(v.current.volume=w,v.current.muted=w===0)},className:"hidden sm:block w-20 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"})]})]})]}):null}function Os(c){const x=Math.max(0,Math.round(c||0)),u=Math.floor(x/60),m=x%60;return`${u}m ${m.toString().padStart(2,"0")}s`}function si({job:c,onPause:x,onResume:u,onCancel:m,onPlayChunk:j,onLoadMaster:N}){const v=c.status==="completed",Y=c.status==="failed",de=c.status==="processing",V=c.status==="paused";return e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:y("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",v?"bg-emerald-500/10 border-emerald-500/30 text-emerald-500":Y?"bg-rose-500/10 border-rose-500/30 text-rose-500":"bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400"),children:de?e.jsx(q,{className:"w-5 h-5 animate-spin"}):v?e.jsx(Pa,{className:"w-5 h-5"}):Y?e.jsx(zt,{className:"w-5 h-5"}):e.jsx(Oe,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("h4",{className:"text-sm font-bold text-slate-900 dark:text-white",children:v?"¡Audio de Larga Duración Completado!":Y?"Error en la Generación":V?"Generación Pausada":`Generando fragmento ${c.currentChunkIndex+1} de ${c.totalChunks}...`}),e.jsx("span",{className:y("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border",v?"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25":Y?"bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25":"bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 animate-pulse"),children:c.status})]}),e.jsxs("p",{className:"text-xs text-slate-500 dark:text-slate-400 mt-0.5",children:["Generados ",Os(c.generatedTotalSeconds)," de ~",Os(c.estimatedTotalSeconds)," estimados"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[de&&e.jsx(b,{size:"sm",icon:e.jsx(ia,{}),label:"Pausar",variant:"amber",alwaysExpanded:!0,onClick:x}),V&&e.jsx(b,{size:"sm",icon:e.jsx($e,{}),label:"Reanudar",variant:"teal",alwaysExpanded:!0,onClick:u}),!v&&!Y&&e.jsx(b,{size:"sm",icon:e.jsx(sa,{}),label:"Cancelar",variant:"danger",onClick:m}),v&&e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx(b,{size:"sm",icon:e.jsx($e,{}),label:"Cargar en Reproductor",variant:"indigo",alwaysExpanded:!0,onClick:N}),e.jsxs("a",{href:c.downloadUrl||`/api/studio/tts/jobs/${c.id}/download`,download:`wappy-master-${c.id}.wav`,className:"inline-flex items-center gap-1.5 h-8 px-2.5 sm:h-9 sm:px-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-700 dark:text-green-300 text-xs font-bold tracking-wide transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95",children:[e.jsx(xt,{className:"w-3.5 h-3.5 sm:w-4 sm:h-4"}),e.jsx("span",{children:"Descargar WAV Master"})]})]})]})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between text-xs font-medium",children:[e.jsx("span",{className:"text-slate-500 dark:text-slate-400",children:"Progreso general"}),e.jsxs("span",{className:"text-indigo-600 dark:text-indigo-400 font-mono font-bold",children:[c.progressPercent,"%"]})]}),e.jsx("div",{className:"w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800",children:e.jsx("div",{className:y("h-full transition-all duration-300",v?"bg-emerald-500":Y?"bg-rose-500":"bg-gradient-to-r from-indigo-500 to-violet-500"),style:{width:`${Math.min(100,Math.max(0,c.progressPercent))}%`}})})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 mb-2",children:[e.jsxs("span",{className:"text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400",children:["Fragmentos del Audio (",c.completedChunks," / ",c.totalChunks,")"]}),e.jsx("span",{className:"text-[11px] text-slate-500 dark:text-slate-500",children:"Haz clic en un fragmento listo para preescucharlo"})]}),e.jsx("div",{className:"grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-18 gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/90 dark:border-slate-800/80 max-h-36 overflow-y-auto",children:c.chunks.map(R=>{const C=R.status==="completed",re=R.status==="processing",_=R.status==="failed";return e.jsx("button",{type:"button",disabled:!C,onClick:()=>j(R),title:`Fragmento #${R.index+1}${R.wordCount?` (${R.wordCount} palabras)`:""}${C?` - ${R.durationSeconds||0}s [Haz clic para escuchar]`:""}`,className:y("h-7 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all border",C?"bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/30 cursor-pointer shadow-2xs":re?"bg-indigo-500/25 text-indigo-700 dark:text-indigo-200 border-indigo-500/50 animate-pulse":_?"bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40":"bg-slate-200/60 dark:bg-slate-800/50 text-slate-500 border-slate-300/60 dark:border-slate-800 opacity-60"),children:C?e.jsx(rt,{className:"w-3.5 h-3.5"}):re?e.jsx(q,{className:"w-3.5 h-3.5 animate-spin"}):R.index+1},R.index)})})]}),c.failoverNotice&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2",children:[e.jsx(Ma,{className:"w-4 h-4 text-amber-500 shrink-0"}),e.jsxs("span",{children:[e.jsx("strong",{children:"Rotación Automática 429:"})," ",c.failoverNotice]})]}),Y&&c.error&&e.jsxs("div",{className:"p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2",children:[e.jsx(zt,{className:"w-4 h-4 text-rose-500 shrink-0"}),e.jsx("span",{children:c.error})]})]})}export{aa as ANTIGRAVITY_ART_DIRECTIONS,st as ANTIGRAVITY_EFFECTS_CATALOG,Zr as DEFAULT_SCRIPT_STEPS,Is as PAUSE_AND_EMPHASIS_TAGS,zs as WAPPY_GOOGLE_MODELS_ECOSYSTEM,Ai as default};
