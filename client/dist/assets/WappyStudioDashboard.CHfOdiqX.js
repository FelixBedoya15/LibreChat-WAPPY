import{r as l,j as e}from"./react-core.DnLkJYlj.js";import{e as Or,b as $r}from"./routing.G8zv3X9f.js";import{e$ as _s,cj as De,hL as vt,h8 as Le,cK as zt,cM as Va,ds as Rt,gx as Dt,dG as Q,cH as Bs,ct as Vr,cl as pa,dn as Bt,cp as ua,eO as Fs,dl as Te,bY as _r,df as Br,gc as Ue,dI as Fr,f6 as ot,dc as Xe,d8 as Ot,fr as Us,ew as xa,d2 as Ur,c2 as oa,dB as ct,ez as Ws,eA as Wr,fP as Hr,dt as Gr,ed as _t,hx as ba,cx as Fa,ft as qr,hM as Ys,gM as pt,eb as Kr}from"./vendor.ymThUTsp.js";import{u as Yr,at as Jr,al as Zr,c as h,O as Xr,n as Qr,l as b}from"./index.BsyOGtXU.js";import"./utilities.CCKZG3yh.js";import"./markdown_highlight.Cj_heSZW.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./locales.DGMWYUix.js";import"./i18n.CdklldLM.js";import"./radix-ui.B3pOguuS.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.DoEkx-OS.js";import"./animations.C_hnK10g.js";import"./virtualization.DFNzDgJG.js";import"./tanstack-vendor.CwIa5f5t.js";import"./headlessui.GXQjTZXk.js";import"./framer-motion.BJmkYMJm.js";import"./http-client.iLCs0KTW.js";import"./date-utils.X8D4nCrw.js";import"./forms.PdoLQ5-c.js";import"./security-ui.Bga5GGyP.js";import"./markdown-processing.CbkO59X1.js";import"./heic-converter.BhQCFQ0l.js";import"./canvas-templates.BS0AxzrQ.js";const ei="wappy-studio-media",ti=1,ga="blobs";let $t=null;function ai(){return $t||($t=new Promise((p,x)=>{if(typeof indexedDB>"u"){x(new Error("IndexedDB no disponible en este navegador."));return}const u=indexedDB.open(ei,ti);u.onupgradeneeded=()=>{const m=u.result;m.objectStoreNames.contains(ga)||m.createObjectStore(ga)},u.onsuccess=()=>p(u.result),u.onerror=()=>{$t=null,x(u.error)}}),$t)}function ha(p,x){return ai().then(u=>new Promise((m,w)=>{const S=u.transaction(ga,p),v=x(S.objectStore(ga));v.onsuccess=()=>m(v.result),v.onerror=()=>w(v.error)}))}async function lt(p,x){await ha("readwrite",u=>u.put(x,p))}async function wt(p){try{return await ha("readonly",u=>u.get(p))??null}catch{return null}}async function si(p){try{await ha("readwrite",x=>x.delete(p))}catch{}}async function ri(){try{await ha("readwrite",p=>p.clear())}catch{}}function la(p,x="audio/wav"){const u=p.replace(/^data:[^;]+;base64,/,""),m=window.atob(u),w=new Uint8Array(m.length);for(let S=0;S<m.length;S++)w[S]=m.charCodeAt(S);return new Blob([w],{type:x})}var ii={};const Hs=[{id:"gemini-3.8-flash",category:"Generación IA & Guiones",badge:"Principal 3.8",description:"Motor principal para generación de escenas HTML/GSAP y enriquecimiento de guiones."},{id:"gemini-3.6-flash",category:"Generación IA & Guiones",badge:"Estable 3.6",description:"Modelo rápido de alta precisión para código HTML5, Tailwind y estructura SST."},{id:"gemini-3.5-flash-lite",category:"Generación IA & Guiones",badge:"Ultra Ligero",description:"Baja latencia para respuestas instantáneas y estructuración rápida."},{id:"gemini-3.8-live",category:"Voz en Tiempo Real (Live)",badge:"Tenshi Live 3.8",description:"Interacción conversacional bidireccional de baja latencia en tiempo real."},{id:"gemini-3.1-flash-live-preview",category:"Voz en Tiempo Real (Live)",badge:"Live Preview 3.1",description:"Respaldo multimodal en vivo para sesiones de voz continua."},{id:"gemini-2.5-flash-native-audio-preview-12-2025",category:"Voz en Tiempo Real (Live)",badge:"Audio Nativo 2.5",description:"Audio nativo multimodal con soporte extendido de herramientas."},{id:"gemini-3.8-flash-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Recomendado (14 voces)",description:"Máxima expresividad, vocal bursts (<breath>, <laugh>) y las 14 voces activas."},{id:"gemini-3.1-flash-tts-preview",category:"Síntesis de Voz (TTS 24kHz)",badge:"Preview 3.1 (14 voces)",description:"Prosodia refinada y soporte completo para las 14 voces preconstruidas."},{id:"gemini-2.5-flash-preview-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Reemplazo 2.5 Pro (5 voces)",description:"Activa las 5 voces fundamentales (Kore, Puck, Charon, Fenrir, Aoede)."},{id:"gemini-3.8-flash-lite-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Ultra Rápido (6 voces)",description:"Lecturas masivas de baja latencia con 6 voces optimizadas."}],da={"gemini-3.8-flash-tts":{id:"gemini-3.8-flash-tts",name:"Gemini 3.8 Flash TTS",badge:"Recomendado / Cuota Activa",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"✓ Activo (14 voces)",description:"Máxima fluidez natural, diseño de voz, vocal bursts (<breath>, <laugh>) y soporte para las 14 voces.",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-3.1-flash-tts-preview":{id:"gemini-3.1-flash-tts-preview",name:"Gemini 3.1 Flash TTS Preview",badge:"Preview 3.1 / Cuota Activa",badgeColor:"bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:"Arquitectura Gemini 3.1 con prosodia refinada, tono expresivo y respuesta ágil (14 voces).",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-2.5-flash-preview-tts":{id:"gemini-2.5-flash-preview-tts",name:"Gemini 2.5 Flash TTS",badge:"Reemplazo de 2.5 Pro",badgeColor:"bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",rateLimitLabel:"3 RPM • 10 RPD (2.5 Pro: 0/0)",quotaLabel:"5 voces",description:"Reemplazo oficial y funcional de 2.5 Pro (no disponible en API). Activa únicamente las 5 voces fundamentales.",supportsMultiSpeaker:!0,supportsVocalBursts:!1,supportedVoices:["Kore","Puck","Charon","Fenrir","Aoede"]},"gemini-3.8-flash-lite-tts":{id:"gemini-3.8-flash-lite-tts",name:"Gemini 3.8 Flash-Lite TTS",badge:"Ultra Rápido",badgeColor:"bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",rateLimitLabel:"Baja Latencia",quotaLabel:"6 voces",description:"Optimizado para lecturas masivas con mínima latencia continua (6 voces rápidas).",supportsMultiSpeaker:!1,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Aoede"]}},ni=[{id:"Kore",name:"Kore",gender:"Femenino",tone:"Cálida, Serena y Profesional",recommendedFor:"Audiolibros, Narración, Tutoriales, Inducción SST",tag:"Más popular"},{id:"Puck",name:"Puck",gender:"Masculino",tone:"Enérgico, Dinámico y Joven",recommendedFor:"Podcasts, Reels, Contenido Creativo, Diálogos",tag:"Muy expresivo"},{id:"Charon",name:"Charon",gender:"Masculino",tone:"Barítono, Grave, Maduro y Solemne",recommendedFor:"Documentales, Historia, Suspenso, Directivos",tag:"Voz profunda"},{id:"Fenrir",name:"Fenrir",gender:"Masculino",tone:"Claro, Elocuente y Periodístico",recommendedFor:"Noticias, Informes, Presentaciones, Boletines",tag:"Profesional"},{id:"Zephyr",name:"Zephyr",gender:"Femenino",tone:"Dulce, Aterciopelada y Relajante",recommendedFor:"Meditación, ASMR, Cuentos, Bienestar",tag:"Calma"},{id:"Orus",name:"Orus",gender:"Masculino",tone:"Firme, Imperial, Épico y Reflexivo",recommendedFor:"Ficción Épica, Liderazgo, Ensayos, Cultura Vial",tag:"Imperial"},{id:"Aoede",name:"Aoede",gender:"Femenino",tone:"Melódica, Expresiva, Artística y Cálida",recommendedFor:"Poesía, Literatura, Storytelling, Sensibilización",tag:"Melódica"},{id:"Leda",name:"Leda",gender:"Femenino",tone:"Cercana, Maternal, Madura y Envolvente",recommendedFor:"Audiolibros Largos, Relatos, Bienvenida",tag:"Narradora"},{id:"Callisto",name:"Callisto",gender:"Femenino",tone:"Elegante, Sofisticada y Articulada",recommendedFor:"Divulgación Científica, Conferencias, Auditorías",tag:"Sofisticada"},{id:"Europa",name:"Europa",gender:"Femenino",tone:"Brillante, Luminosa, Alegre y Asertiva",recommendedFor:"Marketing, Anuncios, E-Learning, Campañas",tag:"Enérgica"},{id:"Ganymede",name:"Ganymede",gender:"Masculino",tone:"Resonante, Equilibrado, Sabio y Seguro",recommendedFor:"Educación Superior, Cursos, Capacitación Técnica",tag:"Resonante"},{id:"Io",name:"Io",gender:"Femenino",tone:"Vivaz, Espontánea, Fresca y Amigable",recommendedFor:"Redes Sociales, Vlogs, Asistentes, Reels",tag:"Fresca"},{id:"Titan",name:"Titan",gender:"Masculino",tone:"Imponente, Cinematográfico y Potente",recommendedFor:"Tráilers, Introducciones, Impacto, Alertas",tag:"Cinematográfica"},{id:"Prometheus",name:"Prometheus",gender:"Masculino",tone:"Noble, Pensativo, Filosófico y Clásico",recommendedFor:"Filosofía, Análisis Profundo, Crónicas",tag:"Sabio"}],oi=[{id:"orus-solemn",name:"Narración Solemne (Orus)",voiceName:"Orus",style:"Voz firme, templada, reflexiva y madura de narrador de crónica histórica, dicción solemne, pausas medidas y respiraciones naturales.",speed:"0.95x"},{id:"aoede-poetic",name:"Cuento Poético (Aoede)",voiceName:"Aoede",style:"Voz melódica, cálida, expresiva y artística para relato literario y sensibilización, con matices emocionales suaves.",speed:"0.95x"},{id:"titan-trailer",name:"Tráiler Cinematográfico (Titan)",voiceName:"Titan",style:"Voz imponente, profunda, cinematográfica y épica de tráiler de película, con pausas dramáticas e impacto.",speed:"0.95x"},{id:"kore-audiobook",name:"Narrador de Audiolibro (Kore)",voiceName:"Kore",style:"Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.",speed:"1.0x"},{id:"puck-podcast",name:"Host de Podcast Dinámico (Puck)",voiceName:"Puck",style:"Host de podcast carismático, enérgico, cercano y espontáneo, con entonación conversacional moderna.",speed:"1.05x"},{id:"charon-documentary",name:"Documental Profundo (Charon)",voiceName:"Charon",style:"Tono barítono, solemne, reflexivo y cinematográfico de narrador de documental, con pausas medidas.",speed:"0.95x"},{id:"fenrir-news",name:"Noticiero Profesional (Fenrir)",voiceName:"Fenrir",style:"Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.",speed:"1.05x"},{id:"zephyr-asmr",name:"Meditación y ASMR (Zephyr)",voiceName:"Zephyr",style:"Voz suave, serena, dulce y sumamente relajante para meditación guiada, mindfulness y bienestar.",speed:"0.9x"},{id:"screenplay-dialogue",name:"Guion / Diálogo Alex & Sam",voiceName:"Kore",multiSpeaker:!0,speaker1:{name:"Alex",voiceName:"Puck",style:"Entusiasta y curioso"},speaker2:{name:"Sam",voiceName:"Kore",style:"Experta, clara y cercana"},style:"Diálogo interactivo de podcast entre dos especialistas con alternancia natural.",speed:"1.0x"}],li=[{tag:"<breath>",label:"Respiración natural",description:"Inserta una toma de aire orgánica entre frases"},{tag:"<laugh>",label:"Risa / Carcajada",description:"Añade una risa espontánea o carcajada suave"},{tag:"<gasp>",label:"Sorpresa / Jadear",description:"Efecto de inhalación rápida de asombro"},{tag:"|mhm|",label:"Asentimiento (|mhm|)",description:"Confirmación conversacional natural"},{tag:"|yeah|",label:"Aceptación (|yeah|)",description:"Interjección de acuerdo en diálogos"}],Vt=[{title:"Inducción SST: 5 Reglas de Oro en Riesgo Eléctrico",text:`¡Atención equipo! Antes de intervenir cualquier tablero o red eléctrica, recuerda que tu vida depende de las Cinco Reglas de Oro. <breath>

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

Tu bienestar mental y físico es la base de un entorno laboral saludable y seguro.`}],di=[{id:"golden-rules",name:"🔥 Reel WAPPY + Félix 3D",badge:"Oficial GTC-45",description:"Multi-escena con Félix 3D lip-sync, Mockup celular, VS y tarjetas sincronizadas con la voz."},{id:"kpi-hud",name:"🚀 Ecosistema + Tenshi IA",badge:"Plataforma 40s",description:"Constelación IA, telemetría 3D en vivo, comparativa VS y tarjeta oráculo Tenshi."},{id:"alert-sst",name:"📜 Expediente & Reglas SST",badge:"Normativo",description:"Visor normativo con resaltador fluorescente, checklist secuencial 1-2-3 y radar."},{id:"camera-overlay",name:"🎬 Lower-Third (Video Propio)",badge:"Transparente",description:"Capas dinámicas por frase en tercio superior e inferior sin tapar tu rostro."}],dt=[{id:"19-cover-2s",label:"19 Portada Magnética 2s 🔥 ¡GRATIS!",category:"Sonido & Portada",description:"Miniatura de alto impacto (0.0s-2.0s) con badge gigante ¡GRATIS! y gancho visual."},{id:"felix-voxel-3d",label:"Félix Voxel 3D Lip-Sync",category:"3D & Avatares",description:"Presentador Voxel 3D con camisa amarilla WAPPY, gestos y sincronía labial con el audio."},{id:"tenshi-3d",label:"Tenshi 3D",category:"3D & Avatares",description:"Oráculo IA flotante con halo esmeralda/cyan y telemetría reactiva."},{id:"01-orbit",label:"01 Órbita 3D",category:"3D & Avatares",description:"Anillo orbital 3D de insignias e iconos gravitatorios alrededor del concepto central."},{id:"02-frame-break",label:"02 Frame Break",category:"Transiciones Reels",description:"Ruptura de marco con profundidad 3D y desborde fuera de la tarjeta."},{id:"04-digital-zoom",label:"04 Digital Zoom",category:"Transiciones Reels",description:"Acercamiento táctico con retícula HUD y mira de precisión sobre datos críticos."},{id:"05-phone-mockup",label:"05 Mockup iPhone",category:"Elementos SST",description:"Celular 3D con Dynamic Island mostrando alertas y controles SST en vivo."},{id:"07-zoom-through",label:"07 Zoom-Through",category:"Transiciones Reels",description:"Transición inmersiva sin corte atravesando la escena hacia el siguiente punto."},{id:"08-chart-grow",label:"08 Chart Grow",category:"Elementos SST",description:"Barras e indicadores KPI que crecen dinámicamente con rebote spring."},{id:"10-glass-type",label:"10 Cristal 3D",category:"3D & Avatares",description:"Tipografía y tarjetas Glassmorphism con refracción translúcida y borde luminoso."},{id:"11-giro-3d",label:"11 Giro 3D",category:"Transiciones Reels",description:"Rotación en perspectiva Y/X con destello neón al cambiar de escena."},{id:"13-checklist-sst",label:"13 Checklist SST",category:"Elementos SST",description:"Lista secuencial 1-2-3 con verificación animada y sello de cumplimiento."},{id:"17-paper-cut",label:"17 Paper Cut",category:"Transiciones Reels",description:"Recorte editorial en capas con textura y sombra proyectada."},{id:"18-dolly-zoom",label:"18 Dolly Zoom",category:"Transiciones Reels",description:"Efecto vértigo cinematográfico contrayendo el fondo mientras destaca el titular."},{id:"visor-normativo",label:"Visor Normativo Subrayado",category:"Elementos SST",description:"Expediente legal (Decreto 1072 / Res. 0312) con resaltador fluorescente en vivo."},{id:"pentagono-gtc45",label:"Pentágono GTC-45",category:"Elementos SST",description:"Radar pentagonal de peligros y valoración de riesgos GTC-45."},{id:"sfx-pack",label:"SFX Whoosh+Pop+Ding",category:"Sonido & Portada",description:"Diseño sonoro sincronizado: whoosh en transiciones, pop en tarjetas y ding en checks."}],ca=[{id:"dark-tech-hud",label:"Dark Tech HUD",colors:"#0C192E + #00D4FF + #C7F303",description:"Fondo cósmico oscuro con HUD cian, verde lima eléctrico y tarjetas de cristal."},{id:"wappy-lima-oliva",label:"WAPPY Lima & Oliva",colors:"#C7F303 + #0E1300",description:"Identidad oficial wappy.club con alto contraste verde lima y negro oliva."},{id:"crema-editorial-sst",label:"Crema Editorial SST",colors:"#F6F5EF + #0D9488",description:"Estilo documental SST para Dummies con papel cálido, turquesa y subrayado."},{id:"cielo-wappy-cloud",label:"Cielo WAPPY Cloud",colors:"#5BB8F5 → #EAF6FE",description:"Atmósfera luminosa WAPPY Cloud con degradado celeste y tarjetas flotantes."}],Gs=[{tag:"[pausa 0.5s]",label:"Pausa 0.5s",desc:"Breve silencio rítmico entre ideas"},{tag:"[pausa 1.0s]",label:"Pausa 1.0s",desc:"Pausa dramática de cambio de escena"},{tag:"[énfasis]",label:"Énfasis Vocal",desc:"Mayor fuerza e intención en la frase"},{tag:"<breath>",label:"Respiración <breath>",desc:"Toma de aire orgánica"},{tag:"<laugh>",label:"Risa <laugh>",desc:"Reacción cercana y carismática"},{tag:"<gasp>",label:"Sorpresa <gasp>",desc:"Inhalación de asombro o alerta"},{tag:"|mhm|",label:"Asentir |mhm|",desc:"Confirmación natural en diálogo"},{tag:"|yeah|",label:"Acuerdo |yeah|",desc:"Expresión dinámica de apoyo"}],ci=[{id:"step-1",timeRange:"0.0s-2.0s",title:"Portada Magnética 🔥 ¡GRATIS!",narration:"¡Atención equipo! Tu vida depende de las Cinco Reglas de Oro en riesgo eléctrico. <breath>",visualEffect:"19 Portada Magnética 2s 🔥 ¡GRATIS!"},{id:"step-2",timeRange:"2.0s-8.0s",title:"Reglas 1 y 2: Corte Visible y Bloqueo LOTO",narration:"[pausa 0.5s] Primero: Cortar todas las fuentes de tensión. Segundo: Bloquear y etiquetar con tu candado personal LOTO. <breath>",visualEffect:"05 Mockup iPhone"},{id:"step-3",timeRange:"8.0s-16.0s",title:"Reglas 3 y 4: Ausencia de Tensión y Puesta a Tierra",narration:"[pausa 0.5s] Tercero: Verificar ausencia de tensión con detector calibrado. Cuarto: Poner a tierra y en cortocircuito. <breath>",visualEffect:"13 Checklist SST"},{id:"step-4",timeRange:"16.0s-24.0s",title:"Regla 5 y Cierre WAPPY IA",narration:"Y quinto: Delimitar y señalizar la zona de trabajo. En WAPPY IA cuidamos que regreses sano y salvo a casa.",visualEffect:"Félix Voxel 3D Lip-Sync"}];function _a(p){try{const x=window.AudioContext||window.webkitAudioContext;if(!x)return;const u=new x,m=u.currentTime,w=u.createOscillator(),S=u.createGain();w.connect(S),S.connect(u.destination),p==="whoosh"?(w.type="sine",w.frequency.setValueAtTime(160,m),w.frequency.exponentialRampToValueAtTime(640,m+.14),w.frequency.exponentialRampToValueAtTime(95,m+.32),S.gain.setValueAtTime(.01,m),S.gain.linearRampToValueAtTime(.22,m+.12),S.gain.exponentialRampToValueAtTime(.001,m+.34),w.start(m),w.stop(m+.35)):p==="pop"?(w.type="triangle",w.frequency.setValueAtTime(320,m),w.frequency.exponentialRampToValueAtTime(780,m+.08),S.gain.setValueAtTime(.25,m),S.gain.exponentialRampToValueAtTime(.001,m+.11),w.start(m),w.stop(m+.12)):(w.type="sine",w.frequency.setValueAtTime(880,m),w.frequency.setValueAtTime(1318.5,m+.09),S.gain.setValueAtTime(.22,m),S.gain.exponentialRampToValueAtTime(.001,m+.45),w.start(m),w.stop(m+.46))}catch{}}function Ua(p,x=28){const u=Math.max(4,Number(x)||28),w=String(p||"").replace(/^(Alex|Sam|Hablante\s*\d+|Speaker\s*\d+):\s*/gim,"").trim().split(new RegExp("(?<=[.!?…])\\s+|\\n+|<breath>","gi")).map(T=>T.replace(/<[^>]+>/g,"").replace(/\|[^|]+\|/g,"").trim()).filter(Boolean);w.length===0&&w.push("Prevención inteligente y seguridad en el trabajo con WAPPY IA.");const S=[];for(let T=0;T<w.length;T++){const k=w[T];k.length<18&&T+1<w.length?w[T+1]=`${k} ${w[T+1]}`:S.push(k)}const v=7,ee=[];if(S.length<=v)ee.push(...S);else{const T=Math.ceil(S.length/v);for(let k=0;k<S.length;k+=T)ee.push(S.slice(k,k+T).join(" "))}const be=[],_=[];let L=0;const C=ee.map((T,k)=>{const G=T.split(/\s+/).filter(Boolean).map(Y=>{const B=Y.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g,"").length;let se=Math.max(2,B);return/[,;:]$/.test(Y)&&(se+=4),/[.!?…]$/.test(Y)&&(se+=9),{word:Y,weight:se}});G.length>0&&(G[G.length-1].weight+=7);const R=G.reduce((Y,B)=>Y+B.weight,0)||10;return L+=R,{text:T,bIdx:k,wList:G,beatWeight:R}}),ie=["wave","pointLeft","pointRight","bothUp"],U=["lime","cyan","amber"];let Ce=0;for(let T=0;T<C.length;T++){const k=C[T],K=Ce/Math.max(1,L),G=(Ce+k.beatWeight)/Math.max(1,L),R=Number((K*u).toFixed(2)),Y=Number((G*u).toFixed(2)),B=Number(Math.max(.8,Y-R).toFixed(2));let se=Ce;for(const re of k.wList){const W=se/Math.max(1,L);se+=re.weight;const he=se/Math.max(1,L);be.push({word:re.word,startPct:Number(W.toFixed(4)),endPct:Number(he.toFixed(4)),beatIndex:T})}Ce+=k.beatWeight;const A=k.text.replace(/^[¡!¿?]+/,"").split(/\s+/).filter(Boolean),ne=k.text.indexOf(":");let J=T===0?"⚡ IMPACTO INICIAL • WAPPY IA":T===C.length-1?"🛡️ CIERRE EJECUTIVO • SOMOS SST":`PUNTO CLAVE 0${T}`;/^(primero|1\b)/i.test(k.text)?J="⚡ REGLA DE ORO 01":/^(segundo|2\b)/i.test(k.text)?J="🔒 REGLA DE ORO 02":/^(tercero|3\b)/i.test(k.text)?J="📡 REGLA DE ORO 03":/^(cuarto|4\b)/i.test(k.text)?J="🛡️ REGLA DE ORO 04":/^(quinto|5\b)/i.test(k.text)&&(J="🚨 REGLA DE ORO 05");let Ee=A.slice(0,Math.min(5,A.length));if(ne>0&&ne<16){const re=k.text.slice(ne+1).trim().split(/\s+/).filter(Boolean);re.length>=2&&(Ee=re.slice(0,Math.min(5,re.length)))}const y=Math.max(1,Math.ceil(Ee.length*.55)),j=Ee.slice(0,y).join(" ").replace(/[,;:.!?]+$/,""),Z=Ee.slice(y).join(" ").replace(/[,;:.!?]+$/,"")||"WAPPY IA",$=k.text.toLowerCase();let ge="bolt";/bloqueo|tarjeteo|candado|loto|aislar/.test($)?ge="lock":/verificar|ausencia|medir|auditor|inspecci|radar|pose|telemetr/.test($)?ge="radar":/tierra|cortocircuito|protecci|epp|casco|seguridad|prevenci/.test($)?ge="shield":/señalizar|delimitar|alerta|peligro|error|riesgo/.test($)?ge="alert":/matriz|gtc|excel|informe|indicador|semana|minuto/.test($)&&(ge="chart"),_.push({index:T+1,text:k.text,startSec:R,endSec:Y,durationSec:B,startPct:Number(K.toFixed(4)),endPct:Number(G.toFixed(4)),badge:J,titleLead:j,titleHighlight:Z,pillColor:U[T%U.length],iconType:ge,gesture:ie[T%ie.length]})}return{beats:_,wordTimings:be,totalDurationSeconds:u}}function pi(p,x){return p==="lock"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="12" y="28" width="40" height="28" rx="8" fill="${x}" fill-opacity="0.22" stroke="${x}" stroke-width="2.8"/>
      <path d="M20 28V20C20 13.3726 25.3726 8 32 8C38.6274 8 44 13.3726 44 20V28" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="42" r="4" fill="#c7f303"/>
    </svg>`:p==="radar"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <circle cx="32" cy="32" r="24" fill="${x}" fill-opacity="0.16" stroke="${x}" stroke-width="2.5" stroke-dasharray="6 4"/>
      <circle cx="32" cy="32" r="14" stroke="#c7f303" stroke-width="2" stroke-opacity="0.7"/>
      <path d="M32 32L48 18" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="4" fill="#c7f303"/>
    </svg>`:p==="shield"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 6L10 15V31C10 45.5 19.4 57.6 32 61C44.6 57.6 54 45.5 54 31V15L32 6Z" fill="${x}" fill-opacity="0.2" stroke="${x}" stroke-width="2.8"/>
      <path d="M22 33L29 40L43 25" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`:p==="alert"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 8L6 54H58L32 8Z" fill="#f59e0b" fill-opacity="0.22" stroke="#f59e0b" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M32 24V38" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round"/>
      <circle cx="32" cy="46" r="2.8" fill="#c7f303"/>
    </svg>`:p==="chart"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="10" y="34" width="10" height="20" rx="3" fill="${x}" fill-opacity="0.35" stroke="${x}" stroke-width="2"/>
      <rect x="27" y="22" width="10" height="32" rx="3" fill="${x}" fill-opacity="0.55" stroke="${x}" stroke-width="2"/>
      <rect x="44" y="12" width="10" height="42" rx="3" fill="#c7f303" fill-opacity="0.85" stroke="#c7f303" stroke-width="2"/>
    </svg>`:`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
    <circle cx="32" cy="32" r="25" fill="${x}" fill-opacity="0.16" stroke="${x}" stroke-width="2"/>
    <path d="M35 8L14 35H31L28 56L50 28H33L35 8Z" fill="#c7f303" stroke="#c7f303" stroke-width="2" stroke-linejoin="round"/>
  </svg>`}function qs({aspectRatio:p="9:16",hasBaseVideo:x=!1,badgeText:u="ECOSISTEMA IA • SG-SST",headline:m="5 Reglas de Oro en Seguridad",subheadline:w="Prevención inteligente en tiempo real con WAPPY Studio",accentColor:S="#14b8a6",templateId:v="golden-rules",scriptText:ee="",durationSeconds:be=28}){var Y,B,se;const _=p==="9:16",L=(u||"ECOSISTEMA IA • SG-SST").replace(/</g,"&lt;"),C=(m||"Prevención Inteligente WAPPY IA").replace(/</g,"&lt;"),ie=(w||"Sincronización neural en vivo").replace(/</g,"&lt;"),U=x||v==="camera-overlay",Ce=(ee||"").trim()||`${C}. ${ie}. Primero: Identifica y controla los peligros críticos en terreno. Segundo: Verifica cada protocolo con inteligencia artificial. Tercero: Protege la vida de tu equipo con WAPPY IA.`,T=Ua(Ce,be),k=T.beats,K=A=>A==="cyan"?"background:linear-gradient(135deg,#06b6d4,#14b8a6);color:#041318;box-shadow:0 0 22px rgba(6,182,212,0.45);":A==="amber"?"background:linear-gradient(135deg,#f97316,#f59e0b);color:#180902;box-shadow:0 0 22px rgba(245,158,11,0.45);":"background:#c7f303;color:#0a1103;box-shadow:0 0 24px rgba(199,243,3,0.5);",G=k.map((A,ne)=>{const J=ne===0,Ee=ne===k.length-1,y=A.text.replace(/</g,"&lt;"),j=(J&&m?C.split(/\s+/).slice(0,3).join(" "):A.titleLead).replace(/</g,"&lt;"),Z=(J&&m&&m.split(/\s+/).length>3?m.split(/\s+/).slice(3).join(" "):A.titleHighlight).replace(/</g,"&lt;"),$=pi(A.iconType,S);return v==="camera-overlay"?`
        <div id="scene-${A.index}" class="scene-layer ${J?"":"opacity-0 pointer-events-none"} absolute inset-x-0 bottom-2 flex flex-col justify-end">
          <div data-editable="true" class="sc-card glass-card rounded-2xl p-3.5 sm:p-4 border-l-4" style="border-left-color:#c7f303;">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-[10px] font-mono uppercase tracking-widest text-[#c7f303] font-extrabold">${A.badge}</span>
              <span class="text-[10px] font-mono text-teal-300 font-bold">ESCENA 0${A.index}/0${k.length}</span>
            </div>
            <div class="flex items-center gap-3">
              ${$}
              <div>
                <h2 class="text-base sm:text-lg font-black text-white leading-tight font-display">
                  ${j} <span class="inline-block px-2 py-0.5 rounded-lg" style="${K(A.pillColor)}">${Z}</span>
                </h2>
                <p class="text-xs text-slate-200 mt-1 leading-snug">${y}</p>
              </div>
            </div>
          </div>
        </div>`:J?`
        <div id="scene-1" class="scene-layer absolute inset-0 flex flex-col justify-center gap-2.5 sm:gap-3">
          <div data-editable="true" class="sc-head text-center space-y-1.5">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span class="w-2 h-2 rounded-full bg-[#c7f303] animate-ping"></span>
              <span>${A.badge}</span>
            </div>
            <h1 class="${_?"text-2xl sm:text-3xl":"text-xl sm:text-2xl"} font-black tracking-tight text-white leading-none font-display">
              ${j} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${K("amber")}">${Z}</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-200 font-semibold max-w-md mx-auto leading-snug">${y}</p>
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
                  <div class="text-xs sm:text-sm font-black text-white truncate">Estándar Verificado ${L}</div>
                  <div class="text-[11px] text-emerald-200/95 leading-tight">${ie}</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#c7f303] text-[#091004] text-[9px] font-mono font-black shrink-0">100% SEGURO</span>
            </div>
          </div>
        </div>`:ne===1&&k.length>=3?`
        <div id="scene-${A.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>• ${A.badge}</span>
            </div>
            <h2 class="${_?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black text-white leading-tight font-display">
              ${j} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${K("cyan")}">${Z}</span>
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
                  ${$}
                  <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#c7f303] text-[8px] font-mono font-bold">ACTIVO</span>
                </div>
                <div class="my-1.5">
                  <div class="text-[9px] font-mono uppercase text-cyan-300 font-bold">VERIFICACIÓN IA</div>
                  <div class="text-xs font-black text-white leading-tight mt-0.5">${j} ${Z}</div>
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
                <p class="text-xs font-bold text-white leading-snug">${y}</p>
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
        </div>`:Ee&&k.length>=2?`
        <div id="scene-${A.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#c7f303]/20 border border-[#c7f303]/50 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>${A.badge}</span>
            </div>
            <h2 class="${_?"text-2xl sm:text-3xl":"text-xl sm:text-2xl"} font-black text-white leading-none font-display">
              ${j} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${K("lime")}">${Z}</span>
            </h2>
          </div>

          <div data-editable="true" class="sc-item glass-card rounded-3xl p-4 border-2 border-[#c7f303]/60 text-center space-y-2.5" style="box-shadow:0 0 35px rgba(199,243,3,0.18);">
            <div class="flex justify-center">${$}</div>
            <p class="text-xs sm:text-sm font-extrabold text-white leading-relaxed">${y}</p>
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
          <h2 class="${_?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black text-white leading-tight font-display">
            ${j} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${K(A.pillColor)}">${Z}</span>
          </h2>
        </div>

        <div data-editable="true" class="sc-item glass-card rounded-3xl p-3.5 sm:p-4 border-l-4" style="border-left-color:#c7f303;">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-2xl bg-slate-900/90 border border-white/10 shrink-0">
              ${$}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-[10px] font-mono uppercase tracking-wider text-[#c7f303] font-extrabold">PROTOCOLO VERIFICADO</span>
                <span class="text-[10px] font-mono font-bold text-emerald-400">NIVEL ÓPTIMO • 100%</span>
              </div>
              <p class="text-xs sm:text-sm font-bold text-white leading-relaxed">${y}</p>
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
`),R=U?"":v==="kpi-hud"?`
      <!-- TARJETA INFERIOR ORÁCULO TENSHI IA (Estilo WAPPY_IA_Plataforma_40s) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${_?"max-w-md":"max-w-2xl"} mx-auto glass-card rounded-2xl p-2.5 px-3.5 border border-teal-400/35 flex items-center gap-3 shrink-0">
        <div class="relative w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-teal-500/30 to-emerald-500/20 border border-[#c7f303]/60 shrink-0 flex items-center justify-center">
          <img src="/assets/wappy/tenshi.png" alt="Tenshi IA" class="w-full h-full object-cover" onerror="this.style.display='none'" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono font-extrabold uppercase tracking-wider text-teal-300">TENSHI • ORIENTADOR Y ORQUESTADOR SST</span>
            <span class="text-[9px] font-mono text-[#c7f303] font-bold">EN VIVO</span>
          </div>
          <p id="host-live-caption" class="text-xs font-bold text-white truncate mt-0.5">${((Y=k[0])==null?void 0:Y.text.replace(/</g,"&lt;"))||ie}</p>
        </div>
      </div>`:`
      <!-- PRESENTADOR FÉLIX 3D VOXEL CON LIP-SYNC Y GESTOS (Estilo Reel Matriz GTC-45 Oficial) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${_?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-center gap-3 shrink-0">
        <canvas id="wappy-felix-voxel" width="150" height="126" class="${_?"w-[122px] h-[102px]":"w-[96px] h-[80px]"} shrink-0 drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"></canvas>
        <div class="glass-card rounded-2xl p-2.5 px-3 border border-[#c7f303]/40 flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1.5 mb-0.5">
            <span id="host-live-badge" class="text-[9px] font-mono font-black uppercase tracking-wider text-[#c7f303]">${((B=k[0])==null?void 0:B.badge)||"WAPPY IA • SOMOS SST"}</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          </div>
          <p id="host-live-caption" class="text-[11px] font-bold text-slate-100 line-clamp-2 leading-snug">${((se=k[0])==null?void 0:se.text.replace(/</g,"&lt;"))||ie}</p>
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
      background: ${U?"transparent":"#050c12"};
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
<body class="relative w-full h-full flex flex-col justify-between items-center ${_?"p-3.5 sm:p-4":"p-3.5 sm:p-5"} select-none overflow-hidden">
  <!-- Barra superior de progreso Verde Lima WAPPY -->
  <div class="absolute top-0 left-0 right-0 h-1 bg-slate-900/80 z-30 overflow-hidden">
    <div id="wappy-top-progress" class="h-full bg-gradient-to-r from-[#c7f303] via-[#14b8a6] to-[#06b6d4]" style="width: 8%;"></div>
  </div>

  ${U?"<!-- Fondo transparente para video base del usuario -->":`<div class="absolute inset-0 overflow-hidden pointer-events-none">
           <div class="absolute inset-0 grid-bg"></div>
           <canvas id="wappy-bg-canvas" class="absolute inset-0 w-full h-full opacity-75"></canvas>
           <div id="orb-1" class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-30" style="background: ${S};"></div>
           <div id="orb-2" class="absolute bottom-8 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25" style="background: #c7f303;"></div>
         </div>`}

  <!-- TOP HUD TÁCTICO WAPPY (Ecualizador + Insignia + Radar Holográfico) -->
  <div id="header-hud" data-editable="true" class="relative z-10 w-full ${_?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-between gap-2 shrink-0 pt-1">
    <div class="glass-card px-3 py-1.5 rounded-full inline-flex items-center gap-2 whitespace-nowrap border border-teal-500/30">
      <div class="flex items-end gap-0.5 h-3.5" id="hud-eq">
        <span class="eq-bar w-1 bg-cyan-400 rounded-full" style="height:60%"></span>
        <span class="eq-bar w-1 bg-[#c7f303] rounded-full" style="height:100%"></span>
        <span class="eq-bar w-1 bg-teal-400 rounded-full" style="height:45%"></span>
        <span class="eq-bar w-1 bg-cyan-300 rounded-full" style="height:80%"></span>
      </div>
      <span class="text-[10px] font-extrabold tracking-widest uppercase text-teal-300">${L}</span>
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
  <div id="scenes-wrapper" class="relative z-10 my-auto w-full ${_?"max-w-md min-h-[270px]":"max-w-2xl min-h-[210px]"} mx-auto flex-1 flex flex-col justify-center">
    ${G}
  </div>

  ${R}

  <!-- ESPACIO INFERIOR RESERVADO PARA SUBTÍTULOS DINÁMICOS -->
  <div class="relative z-10 ${_?"h-12":"h-10"} shrink-0 w-full"></div>

  <script>
    window.__wappyTimelineBeats = ${JSON.stringify(k)};
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
</html>`}function ui(p){if(!p)return"";if(p.includes('id="wappy-studio-runtime-bridge"'))return p;const x=`<script id="wappy-studio-gsap-hook">
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
<\/script>`;let m=p.replace(/subtitles\.reverse\(\)/g,"subtitles.slice().reverse()");return m.includes("<head>")?m=m.replace("<head>",`<head>
${x}`):m=`${x}
${m}`,m.includes("</body>")?m=m.replace("</body>",`${u}
</body>`):m=`${m}
${u}`,m}const Ba="wappy_studio_audio_library",ma="wappy_gemini_api_keys";function Wa(){try{const p=localStorage.getItem(ma);if(!p)return[];let x;try{x=JSON.parse(p)}catch{x=p.split(",")}return typeof x=="string"&&(x=x.split(",")),Array.isArray(x)?x.map((u,m)=>typeof u=="string"?{key:u.trim(),label:`Clave #${m+1}`,status:"unchecked"}:u&&typeof u.key=="string"?{key:u.key.trim(),label:u.label||`Clave #${m+1}`,status:u.status||"unchecked"}:null).filter(u=>!!(u&&u.key)):[]}catch{return[]}}function H(p){const x=p||localStorage.getItem("token")||"",u=Wa().map(m=>m.key.trim()).filter(m=>m.length>15).join(",");return{"Content-Type":"application/json",...x?{Authorization:`Bearer ${x}`}:{},...u?{"x-gemini-api-keys":u}:{}}}async function ve(p){const x=await p.text();try{return JSON.parse(x)}catch{throw p.status===401||x.trim()==="Unauthorized"?new Error("Tu sesión está actualizándose. Intenta nuevamente en un segundo."):new Error(x.slice(0,180)||`Error del servidor (${p.status})`)}}function xi(p){const x=Math.max(1,Math.round(p||0)),u=Math.floor(x/60),m=x%60;return`${u}m ${m}s`}function mi(p){try{return new Date(p).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return""}}function Fi({portable:p=!1}={}){var Os;const{user:x,token:u,isAuthenticated:m}=Yr(),{data:w}=Jr(),S=Or(),v=(S==null?void 0:S.navVisible)??!0,ee=(S==null?void 0:S.setNavVisible)??(()=>{}),[be,_]=$r(),L=be.get("tab")||"tts",[C,ie]=l.useState(["tts","video","lab","library"].includes(L)?L:"tts"),[U,Ce]=l.useState(()=>{var t,a;return((a=(t=x==null?void 0:x.personalization)==null?void 0:t.geminiModels)==null?void 0:a.sstManagement)||(ii.GOOGLE_MODELS||"gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite").split(",")[0].trim()||"gemini-3.8-flash"}),[T,k]=l.useState(!1),[K,G]=l.useState("antigravity"),[R,Y]=l.useState(()=>{try{return localStorage.getItem("wappy_antigravity_bridge_key")||""}catch{return""}}),[B,se]=l.useState(!1),[A,ne]=l.useState(null),[J,Ee]=l.useState(()=>Object.values(da)),[y,j]=l.useState(()=>ni),[Z,$]=l.useState(()=>oi),[ge,re]=l.useState(()=>li),[W,he]=l.useState("gemini-3.8-flash-tts"),[N,ut]=l.useState("Kore"),[Oe,Ft]=l.useState("Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido."),[ce,Ut]=l.useState(!1),[$e,Ha]=l.useState("Puck"),[Ve,Ga]=l.useState("Kore"),[_e,qa]=l.useState(150),[E,Be]=l.useState(Vt[0].text),[kt,Js]=l.useState("Voz expresiva, tono conversacional y alegre."),[Ae,fa]=l.useState("Hola. Hoy quiero demostrarte cómo suena una respiración natural <breath> y cómo reacciono con una pequeña risa <laugh> cuando algo resulta verdaderamente sorprendente."),[ya,Ka]=l.useState(!1),[Zs,Ya]=l.useState(null),[va,Xs]=l.useState(0),[Qs,er]=l.useState(0),[Wt,Ht]=l.useState(.5),[jt,Gt]=l.useState(1),[wa,Ja]=l.useState(!1),[Za,Xa]=l.useState(!1),[ka,Qa]=l.useState(null),[oe,je]=l.useState(null),St=l.useRef(null),[qt,tr]=l.useState("all"),[Kt,es]=l.useState("only_active"),[ja,ar]=l.useState(""),[Sa,sr]=l.useState(!0),[d,pe]=l.useState(null),[Pe,xt]=l.useState(()=>{try{const t=localStorage.getItem(Ba);return t?JSON.parse(t):[]}catch{return[]}}),[D,Na]=l.useState("9:16"),[mt,rr]=l.useState("golden-rules"),[Qe,ts]=l.useState("bottom"),[as,ss]=l.useState(!1),[ae,rs]=l.useState(null),[is,ns]=l.useState(""),[Yt,ir]=l.useState(!1),[et,os]=l.useState(null),[ls,ds]=l.useState(""),[Se,cs]=l.useState(!0),[Nt,nr]=l.useState("CÁPSULA INTERACTIVA WAPPY"),[We,or]=l.useState("5 Reglas de Oro en Riesgo Eléctrico"),[Tt,lr]=l.useState("Prevención inteligente y locución neural sincronizada"),[Ct,dr]=l.useState("#14b8a6"),[tt,ps]=l.useState("dark-tech-hud"),[Me,cr]=l.useState(["19-cover-2s","felix-voxel-3d","05-phone-mockup","07-zoom-through","13-checklist-sst","sfx-pack"]),[fe,Ie]=l.useState(()=>ci),[Jt,pr]=l.useState(!0),[Ta,us]=l.useState(!1),[at,Zt]=l.useState("Crea una animación cinematográfica con el Motor Antigravity 60-FPS y tarjetas de cristal WAPPY IA sobre las 5 reglas de oro de riesgo eléctrico, con Portada Magnética 2s 🔥 ¡GRATIS!, Félix Voxel 3D lip-sync, iconos luminosos y barras de progreso."),[Xt,xs]=l.useState(!1),[Et,ur]=l.useState(""),[Ca,ms]=l.useState(!1),[Ea,xr]=l.useState("all"),[Qt,mr]=l.useState(!1),[He,Fe]=l.useState(()=>qs({aspectRatio:"9:16",hasBaseVideo:!1,badgeText:"ECOSISTEMA IA • SG-SST",headline:"5 Reglas de Oro en Riesgo Eléctrico",subheadline:"Prevención inteligente y locución neural sincronizada",accentColor:"#14b8a6",templateId:"golden-rules",scriptText:Vt[0].text,durationSeconds:28})),[ze,Re]=l.useState(!0),[st,Ne]=l.useState(0),[O,rt]=l.useState(20),[Aa,br]=l.useState(!1),[ue,ea]=l.useState(!1),[ye,Pa]=l.useState(null),xe=l.useRef(""),[At,bs]=l.useState(!1),[Pt,ta]=l.useState(!1),[bt,f]=l.useState(null),[gr,Ge]=l.useState(!1),[aa,sa]=l.useState(()=>{const t=Wa();return[t[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},t[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},t[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}]}),[Ma,gs]=l.useState(!1),[hs,it]=l.useState(""),qe=l.useMemo(()=>aa.filter(t=>t.key.trim().length>15).length,[aa]);l.useEffect(()=>{const t=()=>{const s=Wa();sa([s[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},s[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},s[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}])},a=s=>{s.key===ma&&t()};return window.addEventListener("wappy-keys-updated",t),window.addEventListener("storage",a),()=>{window.removeEventListener("wappy-keys-updated",t),window.removeEventListener("storage",a)}},[]);const hr=async()=>{gs(!0),it("");try{const t=[...aa];let a=0;for(let r=0;r<t.length;r++){const n=t[r].key.trim();if(!n){t[r]={...t[r],key:"",status:"unchecked"};continue}try{const i=await fetch("/api/studio/keys-validate",{method:"POST",headers:H(u),body:JSON.stringify({apiKey:n})}),o=await i.json().catch(()=>({}));i.ok&&o.valid?(t[r]={...t[r],key:n,status:"valid"},a++):t[r]={...t[r],key:n,status:"invalid"}}catch{t[r]={...t[r],key:n,status:"unchecked"}}}sa(t);const s=t.filter(r=>r.key.trim().length>0);localStorage.setItem(ma,JSON.stringify(s)),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),it(s.length===0?"Claves personalizadas limpiadas. Se utilizarán las claves del servidor WAPPY.":`¡Guardadas ${s.length} clave(s) (${a} verificada(s) en vivo con Google Gemini)!`)}finally{gs(!1)}},M=l.useRef(null),me=l.useRef(null),le=l.useRef(null),fs=l.useRef(null),fr=l.useMemo(()=>ui(He),[He]);l.useEffect(()=>{const t=()=>{const a=!!document.fullscreenElement;br(a),setTimeout(()=>{var s,r;(r=(s=M.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},80),setTimeout(()=>{var s,r;(r=(s=M.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},300)};return document.addEventListener("fullscreenchange",t),()=>document.removeEventListener("fullscreenchange",t)},[]),l.useEffect(()=>{const t=a=>{const s=a.data||{};s.type==="STUDIO_ELEMENT_SELECTED"?Pa(s.payload||null):s.type==="STUDIO_HTML_UPDATED"&&typeof s.htmlCode=="string"&&(xe.current=s.htmlCode)};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[]),l.useEffect(()=>{const t=Pe.slice(0,60);try{localStorage.setItem(Ba,JSON.stringify(t))}catch{try{localStorage.setItem(Ba,JSON.stringify(t.map(({audioBase64:a,...s})=>s)))}catch{}}},[Pe]),l.useEffect(()=>{const t=Pe.filter(a=>a.audioBase64&&!a.mediaKey);t.length!==0&&(async()=>{const a={};for(const s of t)try{const r=`audio-${s.id}`;await lt(r,la(s.audioBase64)),a[s.id]=r}catch{}Object.keys(a).length!==0&&xt(s=>s.map(r=>a[r.id]?{...r,mediaKey:a[r.id],audioBase64:void 0}:r))})()},[]);const La=l.useRef(null),ys=t=>{La.current&&URL.revokeObjectURL(La.current);const a=URL.createObjectURL(t);return La.current=a,a},ra=async(t,a)=>{const s=`audio-${t.id}`;let r=null;try{if(a.base64)r=la(a.base64);else if(a.url){const i=await fetch(a.url,{headers:H(u)});i.ok&&(r=await i.blob())}r&&await lt(s,r)}catch{r=null}const n=r?{...t,kind:t.kind||"audio",mediaKey:s,audioBase64:void 0}:{...t,kind:t.kind||"audio",audioBase64:a.base64};return xt(i=>[n,...i.filter(o=>o.id!==t.id)]),r?s:void 0},vs=async t=>{if(t.mediaKey){const a=await wt(t.mediaKey);if(a)return a}if(t.audioBase64)return la(t.audioBase64);if(t.downloadUrl)try{const a=await fetch(t.downloadUrl,{headers:H(u)});if(a.ok){const s=await a.blob(),r=`audio-${t.id}`;return lt(r,s).then(()=>xt(n=>n.map(i=>i.id===t.id?{...i,mediaKey:r}:i))).catch(()=>{}),s}}catch{}return null},ws=async(t,a=!1)=>{const s=await vs(t);return s?(pe({url:ys(s),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey||`audio-${t.id}`}),t.durationSeconds&&t.durationSeconds>1&&rt(t.durationSeconds),a&&we("video"),!0):(f({type:"error",text:"Este audio se generó antes de activar el guardado permanente y el servidor ya lo liberó (se reinició). Vuelve a generarlo: desde ahora todos los audios quedan guardados en tu navegador."}),!1)},gt=(t,a)=>{const s=URL.createObjectURL(t),r=document.createElement("a");r.href=s,r.download=a,document.body.appendChild(r),r.click(),document.body.removeChild(r),setTimeout(()=>URL.revokeObjectURL(s),4e3)},yr=t=>{xt(a=>{const s=a.filter(n=>n.id!==t.id);return[t.mediaKey,t.htmlKey,t.mp4Key,t.capsuleKey].filter(Boolean).forEach(n=>{s.some(o=>[o.mediaKey,o.htmlKey,o.mp4Key,o.capsuleKey].includes(n))||si(n)}),s})};l.useEffect(()=>{var a;const t=(a=w==null?void 0:w[Zr.google])==null?void 0:a.models;if(Array.isArray(t)&&t.length>0){const s=t.map(r=>(typeof r=="string"?r:(r==null?void 0:r.id)||(r==null?void 0:r.value)||"").replace("models/","").trim()).filter(r=>r&&r.includes("tts"));s.length>0&&Ee(r=>{const n=new Map(r.map(c=>[c.id,c])),i=Object.keys(da);return Array.from(new Set([...i,...s])).map(c=>da[c]||n.get(c)||{id:c,name:c,badge:"GOOGLE_MODELS",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:`Modelo TTS cargado desde GOOGLE_MODELS (${c}).`,supportsMultiSpeaker:!c.includes("lite"),supportsVocalBursts:!c.includes("2.5"),supportedVoices:da["gemini-3.8-flash-tts"].supportedVoices})})}},[w]),l.useEffect(()=>{fetch("/api/studio/catalog",{headers:H(u)}).then(t=>t.ok?t.json():null).then(t=>{t&&(Array.isArray(t.models)&&t.models.length>0&&Ee(t.models),Array.isArray(t.voices)&&t.voices.length>0&&j(t.voices),Array.isArray(t.presets)&&t.presets.length>0&&$(t.presets),Array.isArray(t.vocalBursts)&&t.vocalBursts.length>0&&re(t.vocalBursts))}).catch(()=>{})},[u]),l.useEffect(()=>{const t=E.trim(),a=t?t.split(/\s+/).filter(Boolean).length:0;if(Xs(a),er(t.length),!t){Ht(0),Gt(0);return}const s=setTimeout(()=>{fetch("/api/studio/tts/estimate",{method:"POST",headers:H(u),body:JSON.stringify({text:t,maxWordsPerChunk:_e})}).then(r=>r.ok?r.json():null).then(r=>{r&&typeof r.estimatedMinutes=="number"?Ht(r.estimatedMinutes):Ht(Math.round(a/145*10)/10),r&&typeof r.chunkCount=="number"?Gt(r.chunkCount):Gt(Math.max(1,Math.ceil(a/_e)))}).catch(()=>{Ht(Math.round(a/145*10)/10),Gt(Math.max(1,Math.ceil(a/_e)))})},250);return()=>clearTimeout(s)},[E,_e,u]);const we=t=>{ie(t),_({tab:t})};l.useEffect(()=>{const t=a=>{const s=a.detail;["tts","video","lab","library"].includes(s)&&we(s)};return window.addEventListener("wappy-studio-switch-tab",t),()=>window.removeEventListener("wappy-studio-switch-tab",t)},[]);const F=l.useMemo(()=>J.find(t=>t.id===W)||J[0],[J,W]),ht=t=>F!=null&&F.supportedVoices?F.supportedVoices.includes(t):!0,vr=l.useMemo(()=>y.filter(t=>{const a=ht(t.id),s=Kt==="all"||a,r=qt==="all"||t.gender===qt,n=ja.trim().toLowerCase(),i=!n||t.name.toLowerCase().includes(n)||t.tone.toLowerCase().includes(n)||t.recommendedFor.toLowerCase().includes(n)||t.tag&&t.tag.toLowerCase().includes(n);return s&&r&&i}),[y,F,Kt,qt,ja]),ks=async(t,a)=>{a==null||a.stopPropagation();try{Qa(t);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({voiceName:t,model:ht(t)?W:"gemini-3.8-flash-tts",text:`Hola, soy ${t}. Esta es una muestra de voz neural en WAPPY Studio para tus cápsulas y cursos.`})}),r=await ve(s);if(!s.ok||!r.success)throw new Error(r.error||"No se pudo sintetizar la muestra.");pe({base64:r.audioBase64,title:`Muestra de Voz: ${t}`,durationSeconds:r.durationSeconds,voiceName:t})}catch(s){f({type:"error",text:s.message||"Error en audición de voz."})}finally{Qa(null)}},wr=async()=>{try{Xa(!0),f(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({voiceName:N,model:W,text:"¡Conexión verificada con éxito! El motor de voz Gemini 3.8 Flash TTS en WAPPY Studio está listo."})}),a=await ve(t);if(!t.ok||!a.success)throw new Error(a.error||"Error probando conexión.");pe({base64:a.audioBase64,title:`Prueba de Conexión (${N})`,durationSeconds:a.durationSeconds,voiceName:N}),f({type:"success",text:`¡Conexión activa con ${a.usedModel||W}! Audio sintetizado correctamente.`})}catch(t){f({type:"error",text:t.message||"Error de conexión con Gemini TTS."})}finally{Xa(!1)}},kr=async()=>{if(!E.trim())return;const t=E.trim().slice(0,850),a=t.split(/\s+/).filter(Boolean).length,s=Math.max(3,Math.round(a/145*60)),r=`preview_${Date.now()}`;try{Ja(!0),f(null),je({id:r,status:"processing",totalChunks:1,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:s,generatedTotalSeconds:0,progressPercent:0,chunks:[{index:0,wordCount:a,status:"processing"}]});const n=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({text:t,voiceName:N,stylePrompt:Oe,model:W,multiSpeaker:ce,speaker1:{name:"Alex",voiceName:$e},speaker2:{name:"Sam",voiceName:Ve}})}),i=await ve(n);if(!n.ok||!i.success)throw new Error(i.error||"Error al sintetizar vista previa.");const o=`data:audio/wav;base64,${i.audioBase64}`;je({id:r,status:"completed",totalChunks:1,currentChunkIndex:0,completedChunks:1,estimatedTotalSeconds:s,generatedTotalSeconds:i.durationSeconds||s,progressPercent:100,downloadUrl:o,chunks:[{index:0,wordCount:a,status:"completed",durationSeconds:i.durationSeconds,audioBase64:i.audioBase64}]}),pe({base64:i.audioBase64,title:`Audio Completo: ${t.slice(0,42)}...`,durationSeconds:i.durationSeconds,voiceName:ce?`${$e} + ${Ve}`:N,scriptText:t});const c={id:Date.now().toString(),title:`Vista Previa: ${t.slice(0,42)}...`,createdAt:Date.now(),voiceName:ce?`${$e} + ${Ve}`:N,model:i.usedModel||W,durationSeconds:i.durationSeconds,wordCount:a,stylePrompt:Oe,scriptText:t},g=await ra(c,{base64:i.audioBase64});g&&pe(P=>P&&{...P,mediaKey:g}),f({type:"success",text:"Audio generado y cargado en el reproductor. Puedes descargarlo en WAV o enviarlo al Compositor de Video."})}catch(n){je(i=>i?{...i,status:"failed",error:n.message||"Error sintetizando fragmento."}:null),f({type:"error",text:n.message||"Error sintetizando fragmento."})}finally{Ja(!1)}},jr=async()=>{if(Ae.trim())try{Ka(!0),f(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({text:Ae.trim(),voiceName:N,stylePrompt:kt,model:W})}),a=await ve(t);if(!t.ok||!a.success)throw new Error(a.error||"Error al sintetizar en el laboratorio.");pe({base64:a.audioBase64,title:`Laboratorio (${N}): ${Ae.trim().slice(0,34)}...`,durationSeconds:a.durationSeconds,voiceName:N,scriptText:Ae.trim()});const s={id:Date.now().toString(),title:`Laboratorio: ${Ae.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:N,model:a.usedModel||W,durationSeconds:a.durationSeconds,wordCount:Ae.trim().split(/\s+/).filter(Boolean).length,stylePrompt:kt,scriptText:Ae.trim()},r=await ra(s,{base64:a.audioBase64});r&&pe(n=>n&&{...n,mediaKey:r})}catch(t){f({type:"error",text:t.message||"Error sintetizando prueba en el laboratorio."})}finally{Ka(!1)}},Sr=async()=>{if(E.trim())try{f(null),St.current&&St.current.close();const t=await fetch("/api/studio/tts/jobs",{method:"POST",headers:H(u),body:JSON.stringify({text:E,voiceName:N,stylePrompt:Oe,model:W,multiSpeaker:ce,speaker1:{name:"Alex",voiceName:$e},speaker2:{name:"Sam",voiceName:Ve},maxWordsPerChunk:_e})}),a=await ve(t);if(!t.ok)throw new Error(a.error||"No se pudo iniciar el trabajo de larga duración.");const s={id:a.jobId,status:"processing",totalChunks:a.totalChunks,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:a.estimatedTotalSeconds,generatedTotalSeconds:0,progressPercent:0,chunks:Array.from({length:a.totalChunks},(i,o)=>({index:o,wordCount:0,status:"pending"}))};je(s);const r=new EventSource(`/api/studio/tts/jobs/${a.jobId}/stream${u?`?token=${encodeURIComponent(u)}`:""}`);St.current=r,r.addEventListener("snapshot",i=>{const o=JSON.parse(i.data);je(c=>c?{...c,...o}:o)}),r.addEventListener("chunk_start",i=>{const o=JSON.parse(i.data);je(c=>{if(!c)return null;const g=[...c.chunks];return g[o.chunkIndex]&&(g[o.chunkIndex]={...g[o.chunkIndex],status:"processing"}),{...c,currentChunkIndex:o.chunkIndex,chunks:g}})}),r.addEventListener("chunk_complete",i=>{const o=JSON.parse(i.data);je(c=>{if(!c)return null;const g=[...c.chunks];g[o.chunkIndex]&&(g[o.chunkIndex]={...g[o.chunkIndex],status:"completed",durationSeconds:o.durationSeconds,audioBase64:o.audioBase64});const P=g.filter(V=>V.status==="completed").length;return{...c,completedChunks:P,progressPercent:o.progressPercent,generatedTotalSeconds:o.generatedTotalSeconds,chunks:g}})}),r.addEventListener("job_completed",i=>{const o=JSON.parse(i.data);r.close(),je(g=>g?{...g,status:"completed",progressPercent:100,downloadUrl:o.downloadUrl}:null),pe({url:o.downloadUrl,title:`Audio Completo: ${E.trim().slice(0,35)}...`,durationSeconds:o.totalDurationSeconds,voiceName:N,scriptText:E});const c={id:o.id,title:`Audio Completo: ${E.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:N,model:W,durationSeconds:o.totalDurationSeconds,wordCount:va,downloadUrl:o.downloadUrl,stylePrompt:Oe,scriptText:E};ra(c,{url:o.downloadUrl}).then(g=>{g&&pe(P=>P&&{...P,mediaKey:g})})}),r.addEventListener("job_failed",i=>{const o=JSON.parse(i.data);r.close(),je(c=>c?{...c,status:"failed",error:o.error}:null)}),r.addEventListener("job_status",i=>{const o=JSON.parse(i.data);je(c=>c?{...c,status:o.status}:null)});const n=i=>{try{const o=JSON.parse(i.data);je(c=>c?{...c,failoverNotice:o.message||(o.label?`Salto automático a ${o.label} (${o.reason||"429"})`:"Cuota 429 detectada en la clave anterior. Rotación automática a clave de respaldo activada.")}:null)}catch{}};r.addEventListener("key_failover",n),r.addEventListener("api_key_failover",n)}catch(t){f({type:"error",text:t.message||"Error iniciando trabajo."})}},Nr=async()=>{try{k(!0),f(null);const t=await fetch("/api/studio/script/enhance",{method:"POST",headers:H(u),body:JSON.stringify({scriptText:E,stylePrompt:Oe,multiSpeaker:ce,modelName:U})}),a=await ve(t);if(!t.ok||!a.success||!a.scriptText)throw new Error(a.error||"No se pudo mejorar el guion con IA.");Be(a.scriptText),f({type:"success",text:`¡Guion enriquecido con expresiones vocales (<breath>, <laugh>) usando ${a.usedModel||U}!`})}catch(t){f({type:"error",text:t.message||"Error mejorando el guion con IA."})}finally{k(!1)}},Ia=async t=>{oe&&(t==="cancel"&&St.current&&St.current.close(),await fetch(`/api/studio/tts/jobs/${oe.id}/control`,{method:"POST",headers:H(u),body:JSON.stringify({action:t})}),je(a=>a?{...a,status:t==="pause"?"paused":t==="resume"?"processing":"cancelled"}:null))},ia=t=>{const a=document.getElementById("wappy-studio-tts-editor");if(!a){Be(i=>`${i} ${t}`);return}const s=a.selectionStart,r=a.selectionEnd,n=E.substring(0,s)+t+E.substring(r);Be(n),setTimeout(()=>{a.focus(),a.setSelectionRange(s+t.length,s+t.length)},15)},Ke=(t=D,a=!!ae,s=mt,r,n,i)=>{const o=r??((d==null?void 0:d.scriptText)||E),c=Math.max(5,Math.round(n??((d==null?void 0:d.durationSeconds)||O||28)));Fe(qs({aspectRatio:t,hasBaseVideo:a,badgeText:Nt,headline:We,subheadline:Tt,accentColor:Ct,templateId:s,scriptText:o,durationSeconds:c})),s!=="camera-overlay"&&!a&&fetch("/api/studio/video/compile-master-reel",{method:"POST",headers:H(u),body:JSON.stringify({scriptText:o,headline:We,aspectRatio:t,hasBaseVideo:a,showSubtitles:Se,durationSeconds:c,companyName:(x==null?void 0:x.name)||"WAPPY IA",audioBase64:i||(d==null?void 0:d.base64)||void 0})}).then(g=>ve(g)).then(g=>{g!=null&&g.success&&g.htmlCode&&Fe(g.htmlCode)}).catch(()=>{})},js=l.useRef(!1);l.useEffect(()=>{C==="video"&&!js.current&&(js.current=!0,Ke(D,!!ae,mt,(d==null?void 0:d.scriptText)||E,(d==null?void 0:d.durationSeconds)||O||28,d==null?void 0:d.base64))},[C]);const Tr=async()=>{const t=(E||We||"").trim().slice(0,750);if(t)try{ss(!0),f(null);const a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({text:t,voiceName:N,stylePrompt:Oe,model:W,multiSpeaker:ce,speaker1:{name:"Alex",voiceName:$e},speaker2:{name:"Sam",voiceName:Ve}})}),s=await ve(a);if(!a.ok||!s.success)throw new Error(s.error||"No se pudo sintetizar la voz para el video.");pe({base64:s.audioBase64,title:`Locución de Video (${N})`,durationSeconds:s.durationSeconds,voiceName:N,scriptText:t}),ra({id:`vo-${Date.now()}`,title:`Locución de Video: ${t.slice(0,40)}...`,createdAt:Date.now(),voiceName:N,model:s.usedModel||W,durationSeconds:s.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,stylePrompt:Oe,scriptText:t},{base64:s.audioBase64}).then(r=>{r&&pe(n=>n&&{...n,mediaKey:r})}),s.durationSeconds&&s.durationSeconds>1&&rt(s.durationSeconds),He.includes('data-wappy-template="true"')&&Ke(D,!!ae,mt,t,s.durationSeconds,s.audioBase64),Ne(0),Re(!0),setTimeout(()=>{var r,n,i,o;(n=(r=M.current)==null?void 0:r.contentWindow)==null||n.postMessage({type:"STUDIO_RESTART"},"*"),(i=le.current)==null||i.play().catch(()=>{}),(o=me.current)==null||o.play().catch(()=>{})},120),f({type:"success",text:`¡Locución neural (${N} • ${s.durationSeconds}s) sincronizada al milisegundo con el Motor Maestro 60-FPS + Avatar 3D!`})}catch(a){f({type:"error",text:a.message||"Error sincronizando voz con el video."})}finally{ss(!1)}},Ss=t=>{cr(a=>a.includes(t)?a.filter(s=>s!==t):[...a,t])},Ns=()=>{const t=Math.max(8,Math.round((d==null?void 0:d.durationSeconds)||O||24)),a=Ua(E,t),s=Me.map(i=>{var o;return(o=dt.find(c=>c.id===i))==null?void 0:o.label}).filter(Boolean),r=s.length>0?s:dt.map(i=>i.label),n=a.beats.map((i,o)=>{const c=o===0?"0.0s":`${i.startSec.toFixed(1)}s`,g=o===0&&i.endSec<2.2?"2.0s":`${Math.max(i.startSec+1.5,i.endSec).toFixed(1)}s`,P=o>0&&!i.text.includes("[pausa")?"[pausa 0.5s] ":"",V=i.text.includes("<breath>")?"":" <breath>";return{id:`step-${Date.now()}-${o}`,timeRange:`${c}-${g}`,title:o===0?"Portada Magnética 2s 🔥 ¡GRATIS!":`${i.titleLead} ${i.titleHighlight}`.trim()||`Escena 0${o+1}`,narration:`${P}${i.text}${V}`.trim(),visualEffect:o===0?"19 Portada Magnética 2s 🔥 ¡GRATIS!":r[o%r.length]||"07 Zoom-Through"}});Ie(n),f({type:"success",text:`¡Guion estructurado en ${n.length} escenas con tiempos (${t}s), pausas y efectos de las Skills de Antigravity!`})},Cr=()=>{if(!Array.isArray(fe)||fe.length===0)return;const t=fe.map(a=>(a.narration||"").replace(/\[pausa\s+[\d.]+s\]/gi,"<breath>").trim()).filter(Boolean).join(`

`);t&&(Be(t),f({type:"success",text:"¡Escenas y pausas sincronizadas con el Guion Principal!"}))},Ts=()=>{const t=Math.max(6,Math.round((d==null?void 0:d.durationSeconds)||O||24)),a=ca.find(n=>n.id===tt)||ca[0],s=Me.map(n=>{var i;return((i=dt.find(o=>o.id===n))==null?void 0:i.label)||n}).join(", "),r=(Array.isArray(fe)?fe:[]).map((n,i)=>`• Escena ${i+1} (${n.timeRange}) [${n.visualEffect}] — "${n.title}": ${n.narration}`).join(`
`);return["[SUPER-PROMPT OFICIAL ANTIGRAVITY 60-FPS • SISTEMA DE LAS 7 PIEZAS WAPPY IA]",`1. FORMATO Y DURACIÓN: ${D==="9:16"?"Vertical 9:16 (1080x1920 Reels/TikTok/WhatsApp)":"Horizontal 16:9 (1920x1080 YouTube/LMS)"} • Duración sincronizada al audio: ${t}s (${d?`Voz activa: ${d.voiceName||N}`:"Locución lista"}).`,`2. DIRECCIÓN DE ARTE (${a.label}): Paleta ${a.colors} • Insignia: "${Nt}" • Titular: "${We}" • Subtítulo: "${Tt}" • Acento: ${Ct}.`,`3. EFECTOS DE SKILLS ANTIGRAVITY ACTIVOS: ${s||"19 Portada Magnética 2s 🔥 ¡GRATIS!, Félix Voxel 3D Lip-Sync, 07 Zoom-Through, 13 Checklist SST"}.`,"4. ESCALETA SEGUNDO A SEGUNDO Y PAUSAS SINCRONIZADAS CON LA VOZ:",r||`• 0.0s-${t}s: ${E.slice(0,360)}`,"5. REGLAS TÉCNICAS: Incluir de 0.0s a 2.0s la Miniatura/Portada Magnética con badge 🔥 ¡GRATIS!, sincronizar transiciones GSAP con window.mainTimeline y el reloj de voz, mantener última escena visible al cierre y cero desbordes de texto."].join(`
`)},Er=async()=>{try{us(!0),f(null);const t=Math.max(6,Math.round((d==null?void 0:d.durationSeconds)||O||24)),a=Ts();try{const s=await fetch("/api/studio/antigravity/super-prompt",{method:"POST",headers:H(u),body:JSON.stringify({scriptText:E,scriptSteps:fe,aspectRatio:D,durationSeconds:t,badgeText:Nt,headlineText:We,subtitleText:Tt,accentColor:Ct,artDirection:tt,selectedEffects:Me,voiceName:(d==null?void 0:d.voiceName)||N,modelName:U,antigravityApiKey:R})});if(s.ok){const r=await ve(s);if(r!=null&&r.success&&r.superPrompt){Zt(r.superPrompt),Array.isArray(r.scriptSteps)&&r.scriptSteps.length>0&&Ie(r.scriptSteps),f({type:"success",text:"¡Paso 1 completado! Super-Prompt de Antigravity generado con tus tiempos, pausas y efectos. Ahora pulsa el Paso 2 para enviar al Generador de Video."});return}}}catch{}Zt(a),f({type:"success",text:"¡Paso 1 completado! Super-Prompt estructurado con tus escenas, tiempos, pausas y efectos de las Skills de Antigravity. Ahora pulsa el Paso 2."})}finally{us(!1)}},Ar=async()=>{var t;try{xs(!0),f(null);const a=(at||"").trim()||Ts();at.trim()||Zt(a);const s=await Lt(),r=Math.max(6,Math.round((d==null?void 0:d.durationSeconds)||O||25)),n=await fetch("/api/studio/video/generate-html",{method:"POST",headers:H(u),body:JSON.stringify({prompt:a,scriptText:E,scriptSteps:fe,aspectRatio:D,theme:tt,effects:Me,hasBaseVideo:!!ae,showSubtitles:Se,durationSeconds:r,companyName:(x==null?void 0:x.name)||"WAPPY IA",modelName:U,audioBase64:s||void 0,antigravityApiKey:R})}),i=await ve(n);if(!n.ok||!i.success)throw new Error(i.error||"Error generando composición HTML con Antigravity.");(t=i.timelineMap)!=null&&t.totalDurationSeconds&&i.timelineMap.totalDurationSeconds>2&&rt(i.timelineMap.totalDurationSeconds),xe.current="",Fe(i.htmlCode),await nt({htmlOverride:i.htmlCode},!0),Ne(0),Re(!0),setTimeout(()=>{var o,c,g,P;(c=(o=M.current)==null?void 0:o.contentWindow)==null||c.postMessage({type:"STUDIO_RESTART"},"*"),(g=le.current)==null||g.play().catch(()=>{}),(P=me.current)==null||P.play().catch(()=>{})},140),f({type:"success",text:"¡Paso 2 completado! Video HTML 60-FPS generado por Antigravity, cargado en el Lienzo en sincronía con el audio y guardado en tu Biblioteca."})}catch(a){f({type:"error",text:a.message||"No se pudo generar la escena HTML con Antigravity."})}finally{xs(!1)}},Cs=async()=>{var t;if(!Et.trim()){f({type:"info",text:"Escribe primero qué detalle deseas corregir o ajustar en el video HTML (colores, textos, tamaños, efectos o tiempos)."});return}try{ms(!0),f(null);const a=await Lt(),s=Math.max(6,Math.round((d==null?void 0:d.durationSeconds)||O||25)),r=xe.current||He;let n="";try{const i=await fetch("/api/studio/antigravity/edit-html",{method:"POST",headers:H(u),body:JSON.stringify({currentHtml:r,correctionPrompt:Et.trim(),superPrompt:at,scriptText:E,scriptSteps:fe,aspectRatio:D,durationSeconds:s,badgeText:Nt,headlineText:We,subtitleText:Tt,accentColor:Ct,theme:tt,effects:Me,modelName:U,audioBase64:a||void 0,antigravityApiKey:R})});if(i.ok){const o=await ve(i);o!=null&&o.success&&o.htmlCode&&(n=o.htmlCode,(t=o.timelineMap)!=null&&t.totalDurationSeconds&&o.timelineMap.totalDurationSeconds>2&&rt(o.timelineMap.totalDurationSeconds))}}catch{}if(!n){const i=`${at}

[CORRECCIÓN OBLIGATORIA SOLICITADA POR EL USUARIO SOBRE EL LIENZO ACTUAL]: ${Et.trim()}`,o=await fetch("/api/studio/video/generate-html",{method:"POST",headers:H(u),body:JSON.stringify({prompt:i,scriptText:E,scriptSteps:fe,aspectRatio:D,theme:tt,effects:Me,hasBaseVideo:!!ae,showSubtitles:Se,durationSeconds:s,companyName:(x==null?void 0:x.name)||"WAPPY IA",modelName:U,audioBase64:a||void 0,antigravityApiKey:R})}),c=await ve(o);if(!o.ok||!c.success||!c.htmlCode)throw new Error(c.error||"No se pudieron aplicar las correcciones al HTML.");n=c.htmlCode}xe.current="",Fe(n),await nt({htmlOverride:n},!0),Ne(0),Re(!0),setTimeout(()=>{var i,o,c,g;(o=(i=M.current)==null?void 0:i.contentWindow)==null||o.postMessage({type:"STUDIO_RESTART"},"*"),(c=le.current)==null||c.play().catch(()=>{}),(g=me.current)==null||g.play().catch(()=>{})},140),f({type:"success",text:"¡Paso 3 completado! Correcciones aplicadas por Antigravity sobre el HTML manteniendo la sincronía con el audio y actualizadas en la Biblioteca."})}catch(a){f({type:"error",text:a.message||"Error aplicando correcciones con Antigravity."})}finally{ms(!1)}},Pr=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;ae&&URL.revokeObjectURL(ae);const s=URL.createObjectURL(a);rs(s),ns(a.name),Ke(D,!0)},Mr=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;et&&URL.revokeObjectURL(et);const s=URL.createObjectURL(a);os(s),ds(a.name)},ke=l.useMemo(()=>et||(d!=null&&d.url?d.url:d!=null&&d.base64?`data:audio/wav;base64,${d.base64}`:""),[et,d]);l.useEffect(()=>{if(C!=="video"||!ze||ue)return;let t=performance.now();const a=setInterval(()=>{var o,c,g,P;const s=performance.now(),r=(s-t)/1e3;t=s;const n=le.current,i=me.current;if(n&&ke&&!n.paused&&!n.ended){const V=n.currentTime,z=n.duration&&!isNaN(n.duration)&&n.duration>1?n.duration:Math.max(1,O||20);Ne(V),(c=(o=M.current)==null?void 0:o.contentWindow)==null||c.postMessage({type:"STUDIO_SYNC_TIME",currentTime:V,duration:z,playing:!0},"*");return}if(i&&ae&&!i.paused&&!i.ended){const V=i.currentTime,z=i.duration&&!isNaN(i.duration)&&i.duration>1?i.duration:Math.max(1,O||20);Ne(V),(P=(g=M.current)==null?void 0:g.contentWindow)==null||P.postMessage({type:"STUDIO_SYNC_TIME",currentTime:V,duration:z,playing:!0},"*");return}Ne(V=>{var de,I,te,q;const z=Math.max(1,O||20),X=V+r;return X>=z?(Re(!1),(I=(de=M.current)==null?void 0:de.contentWindow)==null||I.postMessage({type:"STUDIO_PAUSE"},"*"),z):((q=(te=M.current)==null?void 0:te.contentWindow)==null||q.postMessage({type:"STUDIO_SYNC_TIME",currentTime:X,duration:z,playing:!0},"*"),X)})},120);return()=>clearInterval(a)},[C,ze,ue,O,ke,ae]);const Es=()=>{var r,n,i,o,c;const t=Math.max(1,O||20);if(!ze&&(st>=t-.3||!!((r=le.current)!=null&&r.ended))){za();return}const s=!ze;s&&ue&&(ea(!1),(i=(n=M.current)==null?void 0:n.contentWindow)==null||i.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),Re(s),(c=(o=M.current)==null?void 0:o.contentWindow)==null||c.postMessage({type:s?"STUDIO_PLAY":"STUDIO_PAUSE"},"*"),me.current&&(s?me.current.play().catch(()=>{}):me.current.pause()),le.current&&ke&&(s?le.current.play().catch(()=>{}):le.current.pause())},za=()=>{var t,a,s,r;ue&&(ea(!1),(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),Ne(0),Re(!0),(r=(s=M.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_RESTART"},"*"),me.current&&(me.current.currentTime=0,me.current.play().catch(()=>{})),le.current&&ke&&(le.current.currentTime=0,le.current.play().catch(()=>{}))},As=t=>{var s,r;Ne(t);const a=O>0?t/O:0;(r=(s=M.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SEEK",progress:a,time:t},"*"),me.current&&(me.current.currentTime=t),le.current&&ke&&(le.current.currentTime=t)},Ps=()=>{var a,s,r,n;const t=!ue;ea(t),t?(Re(!1),(a=me.current)==null||a.pause(),(s=le.current)==null||s.pause()):xe.current&&(Fe(xe.current),xe.current=""),(n=(r=M.current)==null?void 0:r.contentWindow)==null||n.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:t},"*")},Ye=t=>{var a,s;Pa(r=>r&&{...r,...t}),(s=(a=M.current)==null?void 0:a.contentWindow)==null||s.postMessage({type:"STUDIO_UPDATE_SELECTED",updates:t},"*")},Lr=()=>{var t,a;xe.current&&(Fe(xe.current),xe.current=""),ea(!1),Pa(null),(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*"),f({type:"success",text:"¡Cambios de textos y posición de cajas guardados en la composición HTML!"})},Ms=()=>{var t,a,s;document.fullscreenElement?(t=document.exitFullscreen)==null||t.call(document).catch(()=>{}):(s=(a=fs.current)==null?void 0:a.requestFullscreen)==null||s.call(a).catch(()=>{})},Mt=l.useMemo(()=>{const t=(d==null?void 0:d.scriptText)||E||"";return Ua(t,Math.max(4,O||25))},[d==null?void 0:d.scriptText,E,O]),Je=l.useMemo(()=>Mt.wordTimings.map(t=>t.word),[Mt]),Ra=l.useMemo(()=>{if(!Se||Je.length===0)return null;const t=Math.max(0,Math.min(.9999,st/Math.max(1,O))),a=Mt.wordTimings;let s=-1;for(let o=0;o<a.length;o++)if(t>=a[o].startPct&&t<=a[o].endPct){s=o;break}s===-1&&(s=Math.min(Je.length-1,Math.floor(t*Je.length)));const r=5,n=Math.floor(s/r)*r;return{words:Je.slice(n,n+r),activeOffset:s-n}},[Se,Je,Mt,st,O]),Lt=async()=>{if(d!=null&&d.base64)return d.base64;if(!ke)return null;try{const t=await fetch(ke);if(!t.ok)return null;const a=await t.arrayBuffer(),s=new Uint8Array(a);let r="";const n=32768;for(let i=0;i<s.length;i+=n)r+=String.fromCharCode.apply(null,Array.from(s.subarray(i,i+n)));return window.btoa(r)}catch{return null}},Da=async()=>{try{bs(!0);const t=Math.min(60,Math.max(4,Math.round(O||15))),a=t>20?12:15;f({type:"info",text:`Renderizando Video MP4 con Audio + Animación + Subtítulos (${t}s)... Espera ~15-25 segundos mientras se ensambla el archivo .MP4 para WhatsApp y Celular.`});const s=xe.current||He,r=await Lt(),n=await fetch("/api/studio/video/render-mp4",{method:"POST",headers:H(u),body:JSON.stringify({htmlCode:s,audioBase64:r,scriptText:(d==null?void 0:d.scriptText)||E,showSubtitles:Se,subtitlePosition:Qe,aspectRatio:D,durationSeconds:t,fps:a,antigravityApiKey:R})}),i=await ve(n);if(!n.ok||!i.success||!i.videoBase64)throw new Error(i.error||"No se pudo renderizar el archivo MP4 en el servidor.");const o=window.atob(i.videoBase64),c=new Array(o.length);for(let X=0;X<o.length;X++)c[X]=o.charCodeAt(X);const g=new Uint8Array(c),P=new Blob([g],{type:"video/mp4"});nt({mp4Blob:P});const V=URL.createObjectURL(P),z=document.createElement("a");z.href=V,z.download=`wappy-studio-reel-${Date.now()}.mp4`,document.body.appendChild(z),z.click(),document.body.removeChild(z),URL.revokeObjectURL(V),f({type:"success",text:`¡Video MP4 Universal (${i.width}x${i.height} • H.264 + Audio AAC) descargado con éxito! Listo para enviar por WhatsApp, ver en celular o subir a Reels/TikTok.`})}catch(t){f({type:"error",text:t.message||"Error renderizando MP4 en el servidor."})}finally{bs(!1)}},Ir=async t=>{var I;let a=t.replace(/subtitles\.reverse\(\)/g,"subtitles.slice().reverse()");const s=te=>te.replace(/<\/script/gi,"<\\/script"),r=async te=>{try{const q=await fetch(te,{cache:"force-cache"});return q.ok?await q.text():""}catch{return""}},n=async te=>{try{const q=await fetch(te,{cache:"force-cache"});if(!q.ok)return"";const Ze=await q.arrayBuffer(),yt=new Uint8Array(Ze);let $s="";const Vs=32768;for(let na=0;na<yt.length;na+=Vs)$s+=String.fromCharCode.apply(null,Array.from(yt.subarray(na,na+Vs)));return`data:image/png;base64,${window.btoa($s)}`}catch{return""}};let i="";try{const te=(I=M.current)==null?void 0:I.contentDocument;te&&Array.from(te.querySelectorAll("style")).forEach(q=>{if((q.id||"").startsWith("wappy-studio-bridge"))return;const yt=q.textContent||"";yt&&!a.includes(yt.slice(0,120))&&(i+=`
${yt}`)})}catch{i=""}const[o,c,g,P,V,z]=await Promise.all([/gsap(\.min)?\.js/i.test(a)?r("/assets/gsap.min.js"):Promise.resolve(""),/three(\.min)?\.js/i.test(a)?r("/assets/wappy/three.min.js"):Promise.resolve(""),/cdn\.tailwindcss\.com|tailwind-cdn\.js/i.test(a)?r("/assets/tailwind-cdn.js"):Promise.resolve(""),/tenshi\.png/i.test(a)?n("/assets/wappy/tenshi.png"):Promise.resolve(""),/felix_avatar_3d\.png/i.test(a)?n("/assets/wappy/felix_avatar_3d.png"):Promise.resolve(""),/wappy-cat-logo\.png/i.test(a)?n("/assets/wappy/wappy-cat-logo.png"):Promise.resolve("")]);P&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?tenshi\.png(["')])/gi,(te,q,Ze)=>`${q}${P}${Ze}`)),V&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?felix_avatar_3d\.png(["')])/gi,(te,q,Ze)=>`${q}${V}${Ze}`)),z&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?wappy-cat-logo\.png(["')])/gi,(te,q,Ze)=>`${q}${z}${Ze}`)),o&&(a=a.replace(/<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-gsap">${s(o)}<\/script>`)),c&&(a=a.replace(/<script[^>]*src=["'][^"']*three(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-three">${s(c)}<\/script>`)),a=a.replace(/<script[^>]*src=["'][^"']*(cdn\.tailwindcss\.com|tailwind-cdn\.js)[^"']*["'][^>]*>\s*<\/script>/gi,()=>"<script>window.tailwind = window.tailwind || {};<\/script>"+(g?`<script id="wappy-inline-tailwind">${s(g)}<\/script>`:""));const X=`
<meta name="color-scheme" content="dark" />
<meta name="format-detection" content="telephone=no" />
<style id="wappy-precompiled-tailwind">${i.replace(/<\/style/gi,"<\\/style")}</style>
<style id="wappy-offline-font-fallback">
  html, body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
</style>
<noscript><style>
  #header-hud, #top-bar, #scene-1, #scene-1 *, #hero-card, .metric-item { opacity: 1 !important; transform: none !important; visibility: visible !important; }
  #wappy-capsule-controls, #wappy-mobile-tap-overlay { display: none !important; }
</style></noscript>`;/<head[^>]*>/i.test(a)?a=a.replace(/<head[^>]*>/i,te=>`${te}${X}`):a=`${X}
${a}`,/<meta[^>]+name=["']viewport/i.test(a)||(a=a.replace(/<head[^>]*>/i,te=>`${te}<meta name="viewport" content="width=device-width, initial-scale=1.0" />`));const de=`<script id="wappy-visibility-guard">
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
<\/script>`;return a=a.includes("</body>")?a.replace("</body>",()=>`${de}
</body>`):`${a}
${de}`,a},Ls=async()=>{const t=await Ir(xe.current||He),a=await Lt(),s=a?`data:audio/wav;base64,${a}`:"",r=Math.max(4,Math.round((O||20)*10)/10),n=`
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
    ${Qe==="top"?"top: 54px;":Qe==="center"?"top: 50%; transform: translateY(-50%);":"bottom: 58px;"}
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
<div id="wappy-capsule-subtitles" style="display:${Se&&Je.length>0?"flex":"none"};">
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
  var words = ${JSON.stringify(Je)};
  var wordTimings = ${JSON.stringify(Mt.wordTimings)};
  var showSubs = ${!!(Se&&Je.length>0)};
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
${n}`},It=l.useRef(null),nt=async(t={},a=!0)=>{var s;try{const r=t.htmlOverride||xe.current||He,n=(d==null?void 0:d.mediaKey)||ke||"sin-audio",i=`${r.length}:${r.slice(-200)}:${n}:${D}`,c=((s=It.current)==null?void 0:s.signature)===i&&Pe.some(de=>{var I;return de.id===((I=It.current)==null?void 0:I.id)})?It.current.id:`video-${Date.now()}`,g=`html-${c}`;await lt(g,new Blob([r],{type:"text/html"}));let P=d==null?void 0:d.mediaKey;if(!P&&ke){const de=await Lt();de&&(P=`audio-${c}`,await lt(P,la(de)))}let V;t.mp4Blob&&(V=`mp4-${c}`,await lt(V,t.mp4Blob));let z;t.capsuleHtml&&(z=`capsule-${c}`,await lt(z,new Blob([t.capsuleHtml],{type:"text/html"})));const X=((d==null?void 0:d.scriptText)||E||We||"Animación Antigravity").replace(/<[^>]+>/g,"").replace(/\[[^\]]+\]/g,"").trim();xt(de=>{const I=de.find(q=>q.id===c);return[{...I||{},id:c,kind:"video",title:(I==null?void 0:I.title)||`Video HTML ${D}: ${X.slice(0,42)}...`,createdAt:(I==null?void 0:I.createdAt)||Date.now(),voiceName:P?(d==null?void 0:d.voiceName)||N:"Sin Audio (Solo HTML)",model:U,durationSeconds:Math.round(((d==null?void 0:d.durationSeconds)||O||20)*10)/10,wordCount:X.split(/\s+/).filter(Boolean).length,scriptText:(d==null?void 0:d.scriptText)||E,stylePrompt:at?at.slice(0,180):void 0,htmlKey:g,mediaKey:P||(I==null?void 0:I.mediaKey),mp4Key:V||(I==null?void 0:I.mp4Key),capsuleKey:z||(I==null?void 0:I.capsuleKey),aspectRatio:D,showSubtitles:Se,subtitlePosition:Qe},...de.filter(q=>q.id!==c)]}),It.current={id:c,signature:i},a||f({type:"success",text:"¡Video HTML guardado en la Biblioteca! Puedes reabrirlo en el editor, descargar el .HTML al instante o renderizar el .MP4 con Antigravity."})}catch(r){f({type:"error",text:`No se pudo guardar el video en la Biblioteca: ${(r==null?void 0:r.message)||"error de almacenamiento"}`})}},Oa=async(t=!1)=>{try{const r=localStorage.getItem("wappy_antigravity_bridge_key")||"",n=await fetch("/api/studio/antigravity/guest-key",{method:"POST",headers:H(u),body:JSON.stringify({guestKey:t?"":r})});if(n.ok){const i=await n.json().catch(()=>({})),o=String(i.apiKey||i.guestKey||i.key||"").trim();if(o)return Y(o),localStorage.setItem("wappy_antigravity_bridge_key",o),o}}catch{}const a=localStorage.getItem("wappy_antigravity_bridge_key")||"";if(a&&!t)return Y(a),a;const s=`wpy_guest_${Math.random().toString(36).slice(2,10)}${Date.now().toString(36)}`;Y(s);try{localStorage.setItem("wappy_antigravity_bridge_key",s)}catch{}return s};l.useEffect(()=>{Oa(!1)},[u]),l.useEffect(()=>{const t=(R||"").trim();if(!t)return;let a=null;try{const s=`/api/mcp-bridge/antigravity/stream?apiKey=${encodeURIComponent(t)}`;a=new EventSource(s);const r=async n=>{var P,V;if(!n||typeof n!="object")return;const i=n.orden||n.data||n,o=String(i.formato||i.formatoEntregable||"").toLowerCase(),c=String(i.contenido||i.htmlCode||i.resultado||"").trim();if(o==="html"||/<!doctype html|<html\b|<div[^>]+id=["']stage["']/i.test(c)){const z=c.replace(/^```html\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();z.length>60&&(xe.current="",Fe(z),await nt({htmlOverride:z},!0),Ne(0),Re(!0),ie("video"),setTimeout(()=>{var X,de,I;(de=(X=M.current)==null?void 0:X.contentWindow)==null||de.postMessage({type:"STUDIO_RESTART"},"*"),(I=le.current)==null||I.play().catch(()=>{})},150),f({type:"success",text:"🚀 ¡Tu Antigravity envió el video HTML directo al Lienzo y quedó guardado en la Biblioteca!"}))}const g=((P=i.archivoOriginal)==null?void 0:P.publicUrl)||((V=i.media)==null?void 0:V.url)||i.mp4Url||i.downloadUrl||"";if(g&&/\.mp4(\?|$)/i.test(g))try{const z=await fetch(g);if(z.ok){const X=await z.blob();await nt({mp4Blob:X},!0),gt(X,`wappy-antigravity-video-${Date.now()}.mp4`),f({type:"success",text:"🎬 ¡Tu Antigravity terminó de renderizar el video .MP4 y se descargó automáticamente!"})}}catch{window.open(g,"_blank","noopener,noreferrer")}};a.onopen=()=>{se(!0)},a.onerror=()=>{se(!1)},a.onmessage=n=>{try{const i=JSON.parse(n.data);((i==null?void 0:i.type)==="orden_completada"||(i==null?void 0:i.event)==="orden_completada")&&r(i)}catch{}},a.addEventListener("orden_completada",n=>{try{const i=JSON.parse(n.data);r(i)}catch{}})}catch{se(!1)}return()=>{a&&a.close(),se(!1)}},[R]);const Is=typeof window<"u"?window.location.origin:"https://wappy.club",$a=t=>{const a=(t||R||"").trim();return`node -e "fetch('${Is}/api/studio/antigravity/skills-installer.js?key=${encodeURIComponent(a)}').then(r=>r.text()).then(c=>{const fs=require('fs'),p=require('path').join(require('os').homedir(),'.gemini','antigravity','wappy-skills-installer.js');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,c);require('child_process').spawnSync(process.execPath,[p,'--install','--url=${Is}','--key=${a}'],{stdio:'inherit'})})"`},zs=t=>{const a=(R||"").trim(),s=$a(a);return`Hola Antigravity, conecta mi instancia de WAPPY Studio (Clave personal: ${a}) e instala el Pack Oficial de las 7 Skills de Diseño y Video de WAPPY IA (protocolo-produccion-videos, animaciones-17-efectos-reels, animaciones-wappy-brand, animaciones-dark-tech-hud, animaciones-explicativas-sst, hyperframes-motion-design y wappy-ui-design-system) más el puente reactivo wappy-push-daemon.js ejecutando este comando oficial con run_command:

${s}

Confírmame apenas las 7 Skills y el puente en tiempo real queden activos.`},zr=()=>{const t=`/api/studio/antigravity/skills-bundle.json?download=1&key=${encodeURIComponent(R)}`,a=document.createElement("a");a.href=t,a.download="wappy-antigravity-7-skills-pack.json",document.body.appendChild(a),a.click(),document.body.removeChild(a),f({type:"success",text:"📦 Descargando Pack Oficial de las 7 Skills de Diseño y Video WAPPY IA (.JSON Importable)..."})},Rr=async()=>{const t=(R||"").trim()||await Oa(!1),a=$a(t),s=typeof navigator<"u"&&/win/i.test(navigator.userAgent),r=s?"Instalar-Antigravity-Skills-Wappy.bat":"Instalar-Antigravity-Skills-Wappy.command",n=s?`@echo off\r
title Instalador Oficial WAPPY Studio - 7 Skills + Puente Antigravity\r
echo Instalando las 7 Skills de Video/Diseno WAPPY IA y conectando tu Antigravity (${t})...\r
${a}\r
echo.\r
echo Pack de 7 Skills y Puente Antigravity instalados. Ya puedes cerrar esta ventana.\r
pause\r
`:`#!/bin/bash
echo "Instalando las 7 Skills de Video/Diseño WAPPY IA y conectando tu Antigravity (${t})..."
${a}
echo ""
echo "✅ Pack de 7 Skills y Puente Antigravity instalados. Ya puedes cerrar esta ventana."
`,i=new Blob([n],{type:"text/plain;charset=utf-8"});gt(i,r),f({type:"success",text:`⚡ Instalador 1-Clic (${r}) descargado. Ábrelo para instalar las 7 Skills de Diseño/Video y enlazar tu Antigravity en 2 segundos.`})},Rs=async t=>{const a=t.htmlKey?await wt(t.htmlKey):null;if(!a){f({type:"error",text:"No se encontró la composición HTML de este video."});return}const s=await a.text();t.aspectRatio&&Na(t.aspectRatio),typeof t.showSubtitles=="boolean"&&cs(t.showSubtitles),t.subtitlePosition&&ts(t.subtitlePosition),xe.current="",Fe(s);const r=t.mediaKey?await wt(t.mediaKey):null;r&&pe({url:ys(r),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey}),t.durationSeconds&&t.durationSeconds>1&&rt(t.durationSeconds),Ne(0),Re(!1),It.current=null,we("video")},Ds=async()=>{var t,a;try{ta(!0);const s=await Ls();nt({capsuleHtml:s});const r=`wappy-academia-capsula-${Date.now()}.html`,n=new Blob([s],{type:"text/html;charset=utf-8"});if(typeof window<"u"&&((t=window.matchMedia)==null?void 0:t.call(window,"(pointer: coarse)").matches)&&typeof navigator.share=="function")try{const g=new File([n],r,{type:"text/html"});if((a=navigator.canShare)!=null&&a.call(navigator,{files:[g]})){await navigator.share({files:[g],title:"Cápsula WAPPY",text:"Cápsula interactiva WAPPY (ábrela tocando el archivo)."}),f({type:"success",text:"¡Cápsula HTML compartida! Funciona sin internet al tocarla en WhatsApp."});return}}catch(g){if((g==null?void 0:g.name)==="AbortError")return}const o=URL.createObjectURL(n),c=document.createElement("a");c.href=o,c.download=r,document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(o),f({type:"success",text:"¡Cápsula HTML autocontenida descargada! Incluye estilos, animación y voz en un solo archivo: envíala por WhatsApp y ábrela tocándola, incluso sin internet."})}finally{ta(!1)}},Dr=async()=>{try{ta(!0);const s=`<iframe srcdoc="${(await Ls()).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" style="width:100%;max-width:${D==="9:16"?"400px":"860px"};aspect-ratio:${D==="9:16"?"9/16":"16/9"};border:0;border-radius:16px;overflow:hidden;display:block;margin:0 auto;box-shadow:0 20px 50px rgba(0,0,0,0.35);" allow="autoplay; fullscreen"></iframe>`;await navigator.clipboard.writeText(s),f({type:"success",text:"¡Código <iframe srcdoc> copiado al portapapeles! Pégalo directamente en cualquier lección de la Academia WAPPY (LMS)."})}catch{f({type:"error",text:"No se pudo copiar el código embebido al portapapeles."})}finally{ta(!1)}},ft=((Os=F==null?void 0:F.supportedVoices)==null?void 0:Os.length)||14;return!p&&x&&x.role!=="ADMIN"?e.jsx("div",{className:"flex-1 flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen p-6",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md",children:[e.jsx("div",{className:"w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto",children:e.jsx(_s,{className:"w-6 h-6"})}),e.jsx("h2",{className:"text-lg font-extrabold text-slate-900 dark:text-white",children:"WAPPY Studio (Acceso Administrador)"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Por el momento este módulo está habilitado exclusivamente para cuentas de Administración de WAPPY."}),e.jsx("a",{href:"/c/new",className:"inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition",children:"Volver al inicio"})]})}):e.jsxs("div",{className:h("flex-1 flex flex-col",p?"bg-transparent h-auto overflow-visible pb-6":"bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-[100dvh] h-auto overflow-y-auto pb-16"),children:[e.jsx("header",{className:h("bg-white dark:bg-slate-900/95 px-4 sm:px-6 py-4 shadow-2xs z-30",p?"relative rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-7xl w-full mx-auto":"sticky top-0 border-b border-slate-200/90 dark:border-slate-800"),children:e.jsxs("div",{className:"max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4",children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[m&&!v&&e.jsx("div",{className:"hidden md:block",children:e.jsx(Xr,{setNavVisible:ee})}),e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2 mb-1",children:e.jsxs("span",{className:"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wider",children:[e.jsx(De,{className:"w-3 h-3 text-teal-500"}),"Estudio Multimodal • Gemini 3.8 Flash TTS & HyperFrames"]})}),e.jsxs("h1",{className:"text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400",children:[e.jsx(_s,{className:"w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0"}),"WAPPY Studio"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300 mt-0.5 hidden sm:block",children:"Síntesis de voz neural de hasta 1 hora continua y creación de videos animados en HTML/GSAP con capas sobre tus propios videos."})]})]}),e.jsxs("div",{className:"flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end flex-nowrap",children:[e.jsxs("div",{className:"inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto no-scrollbar min-w-0",children:[e.jsxs("button",{type:"button",onClick:()=>we("tts"),className:h("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",C==="tts"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(vt,{className:"w-3.5 h-3.5 text-teal-500"}),e.jsx("span",{children:"Estudio de Voz (TTS)"})]}),e.jsxs("button",{type:"button",onClick:()=>we("video"),className:h("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",C==="video"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Le,{className:"w-3.5 h-3.5 text-purple-500"}),e.jsx("span",{children:"Video HTML & Capas"})]}),e.jsxs("button",{type:"button",onClick:()=>we("lab"),className:h("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",C==="lab"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(zt,{className:"w-3.5 h-3.5 text-amber-500"}),e.jsx("span",{children:"Voces & Bursts"})]}),e.jsxs("button",{type:"button",onClick:()=>we("library"),className:h("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",C==="library"?"bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"),children:[e.jsx(Va,{className:"w-3.5 h-3.5 text-indigo-500"}),e.jsxs("span",{children:["Biblioteca (",Pe.length,")"]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(Qr,{selectedModel:U,onSelectModel:Ce,disabled:Xt}),e.jsx(b,{icon:e.jsx(Rt,{}),label:"Conectar mi Antigravity & Skills",variant:"purple",alwaysExpanded:!0,onClick:()=>{it(""),G("antigravity"),Ge(!0)},title:"Conectar tu propio Antigravity (con o sin cuenta) y descargar el Pack de 7 Skills de Video y Diseño"}),e.jsx(b,{icon:e.jsx(Dt,{}),label:`Claves IA (${qe})`,variant:"fuchsia",onClick:()=>{it(""),G("keys"),Ge(!0)},title:"Configurar hasta 3 claves Google Gemini con rotación inteligente"}),e.jsx(b,{icon:Za?e.jsx(Q,{className:"animate-spin"}):e.jsx(Bs,{}),label:"Probar Audio con IA",variant:"purple",disabled:Za,onClick:wr}),!p&&e.jsx(b,{icon:e.jsx(Vr,{}),label:"Landing / App Portable",variant:"cyan",onClick:()=>window.open("/wappystudio.html","_blank","noopener,noreferrer"),title:"Abrir Landing Page Pública y Aplicativo Portable de WAPPY Studio"})]})]})]})}),e.jsxs("main",{className:"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6",children:[bt&&e.jsxs("div",{className:h("p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200",bt.type==="success"?"bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200":bt.type==="error"?"bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200":"bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200"),children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[bt.type==="success"?e.jsx(pa,{className:"w-4 h-4 text-emerald-500 shrink-0"}):bt.type==="error"?e.jsx(Bt,{className:"w-4 h-4 text-rose-500 shrink-0"}):e.jsx(Q,{className:"w-4 h-4 text-sky-500 animate-spin shrink-0"}),e.jsx("span",{children:bt.text})]}),e.jsx("button",{type:"button",onClick:()=>f(null),className:"p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10",children:e.jsx(ua,{className:"w-3.5 h-3.5"})})]}),d&&e.jsx(bi,{audioBase64:d.base64,audioUrl:d.url,title:d.title,durationSeconds:d.durationSeconds,voiceName:d.voiceName,onSendToVideo:()=>{we("video"),f({type:"success",text:"Audio vinculado automáticamente a la pista de locución del Compositor de Video."})}}),C==="tts"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[oe&&e.jsx(gi,{job:oe,onPause:()=>Ia("pause"),onResume:()=>Ia("resume"),onCancel:()=>Ia("cancel"),onPlayChunk:t=>{t.audioBase64&&pe({base64:t.audioBase64,title:`Fragmento #${t.index+1} (${t.durationSeconds||0}s)`,durationSeconds:t.durationSeconds,voiceName:ce?`${$e} + ${Ve}`:N})},onLoadMaster:()=>{oe.downloadUrl&&pe({url:oe.downloadUrl,title:`Audio Completo: ${E.trim().slice(0,42)}...`,durationSeconds:oe.generatedTotalSeconds,voiceName:ce?`${$e} + ${Ve}`:N,scriptText:E})}}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-indigo-500/10 dark:from-teal-950/40 dark:via-zinc-900/80 dark:to-indigo-950/40 border border-teal-500/25 dark:border-teal-500/20 rounded-2xl p-3 sm:p-3.5 shadow-2xs",children:[e.jsxs("div",{className:"flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0",children:"01"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300",children:"Motor & Voz Neural"}),e.jsxs("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:[F==null?void 0:F.name," •"," ",e.jsx("span",{className:"text-teal-600 dark:text-teal-400",children:ce?`${$e} + ${Ve}`:N})]})]})]}),e.jsxs("div",{className:"flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0",children:"02"}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300",children:"Capas de ~1 Min & Bursts"}),e.jsxs("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:[va," palabras • ~",Wt," min (",jt," ",jt===1?"capa de ~1m":"capas de ~1m",")"]})]})]}),e.jsxs("button",{type:"button",onClick:()=>we("video"),className:"flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 hover:bg-purple-50/80 dark:hover:bg-purple-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 shadow-2xs transition cursor-pointer text-left group",children:[e.jsxs("div",{className:"flex items-center gap-3 min-w-0",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0",children:"03"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300",children:"WAV 24kHz & Video HTML/GSAP"}),e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:"Sintetiza audio o llévalo al Compositor →"})]})]}),e.jsx(Le,{className:"w-4 h-4 text-purple-500 shrink-0 group-hover:translate-x-0.5 transition-transform"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",children:[e.jsxs("div",{className:"lg:col-span-5 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-1.5",children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(Fs,{className:"w-4 h-4 text-teal-500"}),"Modelo Oficial Gemini TTS"]}),e.jsx("span",{className:"text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full",children:"✓ GOOGLE_MODELS Activo"})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:J.map(t=>{const a=W===t.id;return e.jsxs("button",{type:"button",onClick:()=>{he(t.id),t.supportedVoices.includes(N)||ut(t.supportedVoices[0]||"Kore")},className:h("text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-gradient-to-br from-teal-50/95 via-emerald-50/70 to-indigo-50/50 dark:from-teal-950/50 dark:via-emerald-950/30 dark:to-indigo-950/30 border-teal-500 ring-2 ring-teal-500/20 shadow-xs":"bg-white dark:bg-slate-900/70 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/60 dark:hover:bg-zinc-800/60"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1.5",children:[e.jsx("span",{className:h("text-[9px] font-extrabold px-2 py-0.5 rounded-md border",t.badgeColor),children:t.badge}),a&&e.jsx("span",{className:"w-2 h-2 rounded-full bg-teal-500 animate-ping shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white leading-snug mb-1",children:t.name}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 leading-snug",children:t.description})]}),e.jsxs("div",{className:"mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-amber-700 dark:text-amber-400 font-bold",children:t.rateLimitLabel||t.quotaLabel}),a?e.jsxs("span",{className:"text-teal-700 dark:text-teal-300 font-extrabold flex items-center gap-0.5",children:[e.jsx(Te,{className:"w-3 h-3"})," ",t.supportedVoices.length," voces"]}):e.jsxs("span",{className:"text-slate-500 dark:text-zinc-400 font-semibold",children:[t.supportedVoices.length," voces"]})]})]},t.id)})}),e.jsxs("div",{className:"px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"text-slate-700 dark:text-zinc-300 flex items-center gap-1.5",children:[e.jsx(De,{className:"w-3.5 h-3.5 text-teal-500 shrink-0"}),e.jsxs("span",{children:["Voces activas para"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white",children:F==null?void 0:F.name}),":"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsxs("span",{className:"font-extrabold text-emerald-700 dark:text-emerald-400",children:[ft," de ",y.length," disponibles"]}),ft<y.length&&e.jsx("button",{type:"button",onClick:()=>he("gemini-3.8-flash-tts"),className:"text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer",children:"Activar las 14 →"})]})]}),W==="gemini-2.5-flash-preview-tts"&&e.jsxs("div",{className:"p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(Bt,{className:"w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("p",{className:"font-extrabold text-amber-900 dark:text-amber-200",children:"¿Por qué algunas voces aparecen desactivadas en Gemini 2.5 Flash TTS?"}),e.jsxs("p",{className:"text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed",children:[e.jsx("span",{className:"font-bold",children:"Gemini 2.5 Pro Preview TTS"})," no posee cuota activa en API (0 RPM / 0 RPD). Su reemplazo oficial funcional es"," ",e.jsx("span",{className:"font-bold",children:"Gemini 2.5 Flash TTS"}),", el cual habilita únicamente las"," ",e.jsx("span",{className:"font-bold",children:"5 voces fundamentales"})," (Kore, Puck, Charon, Fenrir y Aoede). Para usar las 14 voces y Vocal Bursts, cambia a"," ",e.jsx("span",{className:"font-bold",children:"Gemini 3.8 Flash TTS"}),"."]})]})]}),e.jsx("div",{className:"flex justify-end",children:e.jsx("button",{type:"button",onClick:()=>he("gemini-3.8-flash-tts"),className:"px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-900 dark:text-amber-200 font-extrabold text-[11px] transition cursor-pointer",children:"Cambiar a Gemini 3.8 Flash TTS (14 voces) →"})})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"block text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"Estilos y Plantillas Rápidas"}),e.jsx("span",{className:"text-[10px] text-slate-500 dark:text-zinc-400",children:"1 clic configura voz + emoción"})]}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:Z.map(t=>{const a=Oe===t.style&&(t.multiSpeaker?ce:!ce&&N===t.voiceName),s=!t.multiSpeaker&&!ht(t.voiceName);return e.jsxs("button",{type:"button",onClick:()=>{ht(t.voiceName)||he("gemini-3.8-flash-tts"),t.multiSpeaker?(Ut(!0),t.speaker1&&Ha(t.speaker1.voiceName),t.speaker2&&Ga(t.speaker2.voiceName)):(Ut(!1),ut(t.voiceName)),Ft(t.style)},className:h("text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition cursor-pointer inline-flex items-center gap-1.5",a?"bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 shadow-2xs font-bold":"border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 hover:border-teal-500/50 hover:bg-teal-500/10 text-slate-800 dark:text-zinc-200"),children:[e.jsx("span",{children:t.name}),s&&e.jsx("span",{className:"text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30",children:"Auto 3.8"})]},t.id)})})]}),e.jsxs("div",{className:"flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/95 rounded-xl border border-slate-200/90 dark:border-slate-800 gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx(_r,{className:"w-4 h-4 text-teal-500 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"Modo Diálogo / Podcast (2 Voces)"}),e.jsxs("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:["Alterna interlocutores usando"," ",e.jsx("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:"Alex:"})," ","y"," ",e.jsx("span",{className:"font-mono font-bold text-purple-600 dark:text-purple-400",children:"Sam:"})]})]})]}),e.jsx("button",{type:"button",onClick:()=>Ut(!ce),className:h("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",ce?"bg-teal-600":"bg-slate-300 dark:bg-zinc-700"),children:e.jsx("span",{className:h("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",ce?"translate-x-4":"translate-x-0")})})]}),ce?e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200/90 dark:border-slate-800",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-teal-700 dark:text-teal-400 mb-1",children:"Voz para Alex (Hablante 1)"}),e.jsx("select",{value:$e,onChange:t=>Ha(t.target.value),className:"w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500",children:((F==null?void 0:F.supportedVoices)||[]).map(t=>{const a=y.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-purple-700 dark:text-purple-400 mb-1",children:"Voz para Sam (Hablante 2)"}),e.jsx("select",{value:Ve,onChange:t=>Ga(t.target.value),className:"w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500",children:((F==null?void 0:F.supportedVoices)||[]).map(t=>{const a=y.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(vt,{className:"w-3.5 h-3.5 text-teal-500"}),"Catálogo de Voces (",ft," activas / ",y.length," totales)"]}),e.jsx("p",{className:"text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5",children:"Haz clic en cualquier tarjeta para elegir la voz o en ▶ para escuchar su timbre real."})]}),e.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]",children:[e.jsxs("button",{type:"button",onClick:()=>es("only_active"),className:h("px-2 py-0.5 rounded-md transition cursor-pointer",Kt==="only_active"?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:["Solo Activas (",ft,")"]}),e.jsxs("button",{type:"button",onClick:()=>es("all"),className:h("px-2 py-0.5 rounded-md transition cursor-pointer",Kt==="all"?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:["Todas (",y.length,")"]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(Br,{className:"w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"}),e.jsx("input",{type:"search",name:"wappy-voice-search",autoComplete:"off",value:ja,onChange:t=>ar(t.target.value),placeholder:"Buscar voz (Kore, Orus, profunda, podcast...)",className:"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] shrink-0",children:["all","Femenino","Masculino"].map(t=>e.jsx("button",{type:"button",onClick:()=>tr(t),className:h("px-2.5 py-1 rounded-lg transition cursor-pointer",qt===t?"bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-bold shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:t==="all"?"Todas":t==="Femenino"?"♀ Femeninas":"♂ Masculinas"},t))})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1",children:vr.map(t=>{const a=N===t.id,s=ka===t.id,r=ht(t.id);return e.jsxs("div",{onClick:()=>{r||he("gemini-3.8-flash-tts"),ut(t.id)},className:h("p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-gradient-to-br from-teal-50/95 via-emerald-50/60 to-white dark:from-teal-950/50 dark:via-emerald-950/25 dark:to-zinc-900 border-teal-500 ring-2 ring-teal-500/20 shadow-xs":"bg-white dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/70 dark:hover:bg-zinc-800/60",!r&&"opacity-75 border-dashed"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:"text-sm font-extrabold text-slate-900 dark:text-white truncate",children:t.name}),t.tag&&e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 shrink-0",children:t.tag})]}),e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap mt-1",children:[e.jsx("span",{className:h("text-[9px] font-bold px-1.5 py-0.5 rounded",t.gender==="Femenino"?"bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20":"bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"),children:t.gender==="Femenino"?"♀ Femenina":"♂ Masculina"}),r?e.jsx("span",{className:"text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded",children:"✓ Activa"}):e.jsx("span",{className:"text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded",children:"Requiere 3.8/3.1"})]})]}),e.jsxs("button",{type:"button",onClick:n=>ks(t.id,n),disabled:s,title:`Escuchar muestra de ${t.name}`,className:"px-2 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer flex items-center gap-1 text-[10px] font-extrabold",children:[s?e.jsx(Q,{className:"w-3 h-3 animate-spin"}):e.jsx(Ue,{className:"w-3 h-3 fill-current"}),e.jsx("span",{children:"Oír"})]})]}),e.jsx("p",{className:"text-[11px] text-teal-700 dark:text-teal-300 font-bold mt-2 leading-snug",children:t.tone})]}),e.jsxs("div",{className:"mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2",children:[e.jsx("p",{className:"text-[10px] text-slate-600 dark:text-zinc-400 line-clamp-1 leading-tight",children:t.recommendedFor}),!r&&e.jsx("button",{type:"button",onClick:n=>{n.stopPropagation(),he("gemini-3.8-flash-tts"),ut(t.id)},className:"text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded shrink-0 cursor-pointer",children:"Usar con 3.8 →"})]})]},t.id)})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"Directiva de Estilo y Emoción"}),e.jsx("span",{className:"text-[10px] font-mono text-slate-500 dark:text-zinc-400",children:"speechMetadata.style"})]}),e.jsx("textarea",{rows:2,value:Oe,onChange:t=>Ft(t.target.value),placeholder:"Ej: Voz cálida, pausada y reflexiva de narrador de documentales...",className:"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{children:[e.jsxs("button",{type:"button",onClick:()=>sr(!Sa),className:"flex items-center justify-between w-full text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-extrabold py-1 transition cursor-pointer",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(Fr,{className:"w-3.5 h-3.5 text-teal-500"}),"Motor de Capas de Audio (~1 min por capa) & Unión Master"]}),e.jsx("span",{children:Sa?"▲":"▼"})]}),Sa&&e.jsxs("div",{className:"mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs",children:[e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-1.5",children:[{words:110,label:"~45 seg",sub:"110 pal."},{words:150,label:"~1 min ★",sub:"150 pal. (Óptimo)"},{words:220,label:"~1.5 min",sub:"220 pal."},{words:280,label:"~2 min",sub:"280 pal."}].map(t=>{const a=Math.abs(_e-t.words)<=10;return e.jsxs("button",{type:"button",onClick:()=>qa(t.words),className:h("px-2 py-1.5 rounded-lg border text-center transition cursor-pointer",a?"bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 font-extrabold shadow-2xs":"bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-zinc-300 hover:border-teal-400"),children:[e.jsx("div",{className:"text-[11px] font-bold",children:t.label}),e.jsx("div",{className:"text-[9px] opacity-80",children:t.sub})]},t.words)})}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-slate-600 dark:text-zinc-400",children:"Tamaño de cada capa de audio:"}),e.jsxs("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:[_e," palabras (~",Math.max(20,Math.round(_e/145*60)),"s)"]})]}),e.jsx("input",{type:"range",min:80,max:280,step:10,value:_e,onChange:t=>qa(parseInt(t.target.value,10)),className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-teal-600"}),e.jsxs("p",{className:"text-[10px] text-slate-600 dark:text-zinc-400 leading-relaxed",children:[e.jsx("strong",{children:"Recomendado (~1 min / 150 palabras):"})," Cada capa se genera en ~4 segundos sin saturar la API, permite preescuchar cada fragmento al instante y une todas las capas en un solo ",e.jsx("strong",{children:"WAV Master 24kHz"})," con micro-fades sin cortes."]})]})]})]}),e.jsxs("div",{className:"lg:col-span-7 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:h("p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all",qe>0?"bg-emerald-500/10 border-emerald-500/30":"bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border-indigo-500/25"),children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[e.jsx("div",{className:h("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",qe>0?"bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300":"bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300"),children:e.jsx(Dt,{className:"w-4 h-4"})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5",children:qe>0?e.jsx(e.Fragment,{children:e.jsxs("span",{children:[qe," clave(s) API guardada(s) • Rotación y failover automático (429) activados"]})}):e.jsx(e.Fragment,{children:e.jsx("span",{children:"Motor Multi-Key Gemini TTS (Almacenamiento Local + Respaldo WAPPY)"})})}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:qe>0?"Si una clave alcanza el límite de cuota (429), WAPPY Studio salta instantáneamente a la siguiente sin interrumpir tu audio.":"Puedes agregar hasta 3 claves gratuitas de Google AI Studio para multiplicar tu cuota de síntesis de 60 min."})]})]}),e.jsx(b,{size:"sm",alwaysExpanded:!0,icon:e.jsx(Dt,{}),label:qe>0?"Administrar Claves":"Configurar Claves",variant:"fuchsia",onClick:()=>{it(""),G("keys"),Ge(!0)}})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2.5",children:[e.jsxs("h2",{className:"text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 shrink-0",children:[e.jsx(vt,{className:"w-4 h-4 text-teal-500"}),"Texto a Sintetizar"]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 min-w-0",children:[e.jsxs("select",{defaultValue:"",onChange:t=>{const a=Vt.find(s=>s.title===t.target.value);a&&(Be(a.text),a.text.includes("Alex:")&&a.text.includes("Sam:")&&Ut(!0)),t.target.value=""},className:"min-w-0 max-w-[230px] sm:max-w-[260px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer",children:[e.jsxs("option",{value:"",disabled:!0,children:["📋 Cargar ejemplo (",Vt.length," plantillas)..."]}),Vt.map(t=>e.jsx("option",{value:t.title,children:t.title},t.title))]}),e.jsx(b,{size:"sm",alwaysExpanded:!0,icon:T?e.jsx(Q,{className:"animate-spin"}):e.jsx(ot,{}),label:T?"Enriqueciendo...":"Mejorar Guion con IA",variant:"purple",disabled:T,onClick:Nr,title:`Enriquecer o generar guion con Vocal Bursts usando ${U}`}),E&&e.jsx(b,{size:"sm",icon:e.jsx(Xe,{}),label:"Limpiar",variant:"danger",onClick:()=>Be("")})]})]}),e.jsxs("div",{className:"p-3 bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px]",children:[e.jsxs("span",{className:"font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1",children:[e.jsx(De,{className:"w-3.5 h-3.5 text-amber-500"}),"Insertar Pausas, Énfasis y Efectos Vocales (Vocal Bursts) en el cursor:"]}),e.jsx("span",{className:"font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold",children:W})]}),e.jsxs("div",{className:"flex flex-wrap gap-1.5",children:[Gs.slice(0,3).map(t=>e.jsxs("button",{type:"button",onClick:()=>ia(` ${t.tag} `),title:t.desc,className:"px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-mono transition flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx("span",{className:"text-indigo-700 dark:text-indigo-300 font-bold",children:t.tag}),e.jsxs("span",{className:"text-slate-600 dark:text-zinc-400 text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),ge.map(t=>e.jsxs("button",{type:"button",onClick:()=>ia(` ${t.tag} `),title:t.description,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-500/10 border border-slate-200 dark:border-slate-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx("span",{className:"text-amber-700 dark:text-amber-400 font-bold",children:t.tag}),e.jsxs("span",{className:"text-slate-600 dark:text-zinc-400 text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),e.jsx("button",{type:"button",onClick:()=>ia(`
Alex: `),className:"px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold transition cursor-pointer",children:"Alex:"}),e.jsx("button",{type:"button",onClick:()=>ia(`
Sam: `),className:"px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold transition cursor-pointer",children:"Sam:"})]})]}),e.jsx("textarea",{id:"wappy-studio-tts-editor",rows:10,value:E,onChange:t=>Be(t.target.value),placeholder:"Escribe o pega aquí el guion para tu cápsula SST, curso de Academia WAPPY, podcast o audiolibro de hasta 1 hora...",className:"w-full bg-white dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 leading-relaxed resize-y min-h-[210px] shadow-inner"}),e.jsxs("div",{className:"p-3.5 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-teal-500/5 border border-indigo-500/25 rounded-2xl space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5",children:[e.jsx(zt,{className:"w-4 h-4 text-indigo-500"}),"Asistente Paso a Paso: Escenas por Tiempos, Pausas & Efectos Antigravity"]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:"Estructura cada tramo (`0.0s-2.0s` Portada 🔥 ¡GRATIS!, `2.0s-8.0s`...) con pausas y efectos visuales."})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsx(b,{size:"sm",alwaysExpanded:!0,icon:e.jsx(ot,{}),label:"Auto-Estructurar por Tiempos",variant:"purple",onClick:Ns}),e.jsx(b,{size:"sm",alwaysExpanded:!0,icon:e.jsx(Te,{}),label:"Aplicar Escenas al Guion",variant:"teal",onClick:Cr}),e.jsx(b,{size:"sm",icon:e.jsx(Ot,{}),label:"Añadir Escena",variant:"emerald",onClick:()=>Ie(t=>[...t,{id:`step-${Date.now()}`,timeRange:`${t.length*5}.0s-${(t.length+1)*5}.0s`,title:`Escena 0${t.length+1}`,narration:"[pausa 0.5s] Nueva frase sincronizada con la voz. <breath>",visualEffect:"07 Zoom-Through"}])})]})]}),e.jsx("div",{className:"space-y-2 max-h-[250px] overflow-y-auto pr-1",children:(Array.isArray(fe)?fe:[]).map((t,a)=>e.jsxs("div",{className:"p-2.5 rounded-xl bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 space-y-2",children:[e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-12 gap-2 items-center",children:[e.jsx("div",{className:"sm:col-span-3",children:e.jsx("input",{type:"text",value:t.timeRange,onChange:s=>{const r=s.target.value;Ie(n=>n.map((i,o)=>o===a?{...i,timeRange:r}:i))},placeholder:"0.0s-2.0s",className:"w-full px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-mono font-extrabold text-indigo-700 dark:text-indigo-300"})}),e.jsx("div",{className:"sm:col-span-4",children:e.jsx("input",{type:"text",value:t.title,onChange:s=>{const r=s.target.value;Ie(n=>n.map((i,o)=>o===a?{...i,title:r}:i))},placeholder:"Título de la escena...",className:"w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"})}),e.jsx("div",{className:"sm:col-span-4",children:e.jsx("select",{value:t.visualEffect,onChange:s=>{const r=s.target.value;Ie(n=>n.map((i,o)=>o===a?{...i,visualEffect:r}:i))},className:"w-full px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[11px] font-bold text-purple-700 dark:text-purple-300",children:dt.map(s=>e.jsx("option",{value:s.label,children:s.label},s.id))})}),e.jsx("div",{className:"sm:col-span-1 flex justify-end",children:e.jsx(b,{size:"sm",icon:e.jsx(Xe,{}),label:"Quitar",variant:"danger",disabled:fe.length<=1,onClick:()=>Ie(s=>s.filter((r,n)=>n!==a))})})]}),e.jsx("input",{type:"text",value:t.narration,onChange:s=>{const r=s.target.value;Ie(n=>n.map((i,o)=>o===a?{...i,narration:r}:i))},placeholder:"Locución de este tramo con pausas ([pausa 0.5s], <breath>)...",className:"w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"})]},t.id))})]}),e.jsxs("div",{className:"bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between text-xs gap-2",children:[e.jsxs("div",{className:"flex items-center gap-3 text-slate-600 dark:text-slate-300",children:[e.jsxs("span",{children:["Palabras:"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white font-mono",children:va})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Caracteres:"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white font-mono",children:Qs})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Fragmentos estimados:"," ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400 font-mono",children:jt})]})]}),e.jsxs("div",{className:"text-slate-900 dark:text-white font-semibold",children:["Duración estimada:"," ",e.jsxs("strong",{className:"text-amber-600 dark:text-amber-400 font-mono",children:["~",Wt," min"]})," ","/ 60 min máx"]})]}),e.jsx("div",{className:"w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,Math.round(Wt/60*100)))}%`}})})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1",children:[e.jsx(b,{alwaysExpanded:!0,icon:wa?e.jsx(Q,{className:"animate-spin"}):e.jsx(Bs,{}),label:"Vista Previa Rápida (~1er fragmento)",variant:"amber",disabled:wa||(oe==null?void 0:oe.status)==="processing"||!E.trim(),onClick:kr}),e.jsx(b,{alwaysExpanded:!0,icon:(oe==null?void 0:oe.status)==="processing"?e.jsx(Q,{className:"animate-spin"}):e.jsx(Ue,{}),label:jt>1?`Generar Audio Completo (${jt} fragmentos • ~${Wt} min)`:"Generar Audio Completo",variant:"teal",disabled:(oe==null?void 0:oe.status)==="processing"||wa||!E.trim(),onClick:Sr})]})]})]})]}),C==="video"&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200",children:[e.jsxs("div",{className:"lg:col-span-6 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsx("div",{className:"flex items-center justify-between gap-2",children:e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(Le,{className:"w-5 h-5 text-purple-500"}),"Estudio de Capas & Motion Graphics HTML (Antigravity 60-FPS)"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Sube tu propio video grabado a cámara o genera animaciones Antigravity 60-FPS / HyperFrames sincronizadas con tu voz."})]})}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("button",{type:"button",onClick:()=>{Na("9:16"),Ke("9:16",!!ae,mt)},className:h("p-3 rounded-xl border text-left transition cursor-pointer",D==="9:16"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:"📱 Vertical 9:16 (Reels / TikTok)"}),e.jsx("div",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5",children:"1080 × 1920 px • Ideal para redes y WhatsApp"})]}),e.jsxs("button",{type:"button",onClick:()=>{Na("16:9"),Ke("16:9",!!ae,mt)},className:h("p-3 rounded-xl border text-left transition cursor-pointer",D==="16:9"?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"),children:[e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:"🖥️ Horizontal 16:9 (YouTube / LMS)"}),e.jsx("div",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5",children:"1920 × 1080 px • Ideal para cursos Academia WAPPY"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(De,{className:"w-3.5 h-3.5 text-teal-500"}),"Plantillas Visuales Instantáneas (HyperFrames)"]}),e.jsx("span",{className:"text-[10px] text-slate-600 dark:text-slate-300",children:"Clic para aplicar"})]}),e.jsx("div",{className:"grid grid-cols-2 gap-2",children:di.map(t=>{const a=mt===t.id;return e.jsxs("button",{type:"button",onClick:()=>{rr(t.id),Ke(D,!!ae,t.id)},className:h("p-2.5 rounded-xl border text-left transition cursor-pointer",a?"bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-slate-900 dark:text-white truncate",children:t.name}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 shrink-0",children:t.badge})]}),e.jsx("p",{className:"text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1",children:t.description})]},t.id)})})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3",children:[e.jsxs("div",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(zt,{className:"w-4 h-4 text-teal-500"}),"Capas Base Multimedia (Video a Cámara + Locución)"]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{className:"p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"1. Tu Video Base (Opcional)"}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:is?`Activo: ${is}`:"Sube un MP4/WebM tuyo para montarle capas HTML encima."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(Us,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Video MP4"}),e.jsx("input",{type:"file",accept:"video/mp4,video/webm,video/quicktime",onChange:Pr,className:"hidden"})]}),ae&&e.jsx(b,{size:"sm",icon:e.jsx(Xe,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(ae),rs(null),ns(""),Ke(D,!1)}})]})]}),e.jsxs("div",{className:"p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"2. Audio / Locución Sincronizada"}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:ls?`Archivo: ${ls}`:d?`Vinculado: ${d.title}`:"Usa el audio del Estudio TTS o sube un WAV/MP3."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(Us,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Audio WAV/MP3"}),e.jsx("input",{type:"file",accept:"audio/*",onChange:Mr,className:"hidden"})]}),et&&e.jsx(b,{size:"sm",icon:e.jsx(Xe,{}),label:"Quitar",variant:"danger",onClick:()=>{URL.revokeObjectURL(et),os(null),ds("")}})]})]})]})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"3. Textos de Capa y Subtítulos Dinámicos"}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:Se,onChange:t=>cs(t.target.checked),className:"rounded accent-teal-600"}),"Subtítulos"]}),Se&&e.jsx("div",{className:"inline-flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]",children:[{id:"bottom",label:"Abajo"},{id:"center",label:"Centro"},{id:"top",label:"Arriba"}].map(t=>e.jsx("button",{type:"button",onClick:()=>ts(t.id),className:h("px-1.5 py-0.5 rounded transition cursor-pointer",Qe===t.id?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white"),children:t.label},t.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Insignia Superior (Badge)"}),e.jsx("input",{type:"text",value:Nt,onChange:t=>nr(t.target.value),className:"w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Acento"}),e.jsx("div",{className:"flex items-center gap-2",children:["#14b8a6","#10b981","#6366f1","#f59e0b","#f43f5e"].map(t=>e.jsx("button",{type:"button",onClick:()=>dr(t),style:{backgroundColor:t},className:h("w-6 h-6 rounded-full border-2 transition cursor-pointer",Ct===t?"border-white ring-2 ring-teal-500 scale-110":"border-transparent opacity-80")},t))})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Titular Principal en Pantalla"}),e.jsx("input",{type:"text",value:We,onChange:t=>or(t.target.value),className:"w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold"})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("input",{type:"text",value:Tt,onChange:t=>lr(t.target.value),placeholder:"Subtítulo secundario...",className:"flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"}),e.jsx(b,{icon:e.jsx(xa,{}),label:"Aplicar al Lienzo",variant:"cyan",alwaysExpanded:!0,onClick:()=>Ke(D,!!ae)})]})]}),e.jsxs("div",{className:"p-4 bg-purple-500/5 border border-purple-500/25 rounded-2xl space-y-3.5",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx(ot,{className:"w-4 h-4 text-purple-500"}),"4. Motor Antigravity HTML + GSAP (Flujo en 3 Pasos)"]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsx(b,{size:"sm",icon:e.jsx(Rt,{}),label:"Conectar mi Antigravity & Skills",variant:"purple",alwaysExpanded:!0,onClick:()=>{it(""),G("antigravity"),Ge(!0)}}),e.jsx(b,{size:"sm",icon:e.jsx(zt,{}),label:Jt?"Ocultar Escaleta":"Tiempos & Escaleta",variant:"amber",isActive:Jt,onClick:()=>pr(!Jt)}),e.jsx(b,{size:"sm",icon:e.jsx(Ur,{}),label:Qt?"Ocultar HTML":"Código HTML",variant:"neutral",isActive:Qt,onClick:()=>mr(!Qt)})]})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsx("span",{className:"block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:"Dirección de Arte Oficial (Brandbook WAPPY IA):"}),e.jsx("div",{className:"grid grid-cols-2 gap-1.5",children:ca.map(t=>{const a=tt===t.id;return e.jsxs("button",{type:"button",onClick:()=>ps(t.id),className:h("p-2 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-1.5",a?"bg-purple-500/15 border-purple-500/50 text-purple-900 dark:text-purple-200 ring-1 ring-purple-500/30":"bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400"),children:[e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold truncate",children:t.label}),e.jsx("div",{className:"text-[9px] opacity-75 truncate",children:t.colors})]}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 shrink-0",children:"60 FPS"})]},t.id)})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:["Efectos Visuales Antigravity Activos (",Me.length,"):"]}),e.jsx("button",{type:"button",onClick:()=>we("lab"),className:"text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer",children:"Ver catálogo completo en Laboratorio →"})]}),e.jsx("div",{className:"flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 rounded-xl bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800",children:dt.map(t=>{const a=Me.includes(t.id);return e.jsxs("button",{type:"button",onClick:()=>Ss(t.id),title:`${t.category} — ${t.description}`,className:h("px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1",a?"bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400"),children:[e.jsx("span",{children:t.label}),a&&e.jsx(Te,{className:"w-2.5 h-2.5 text-emerald-500"})]},t.id)})})]}),Jt&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/5 border border-amber-500/25 space-y-2 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsxs("span",{className:"text-[11px] font-extrabold text-amber-800 dark:text-amber-300",children:["Escaleta de Tiempos, Pausas y Escenas (",fe.length," tramos)"]}),e.jsx(b,{size:"sm",icon:e.jsx(ot,{}),label:"Auto-Dividir Guion",variant:"amber",alwaysExpanded:!0,onClick:Ns})]}),e.jsx("div",{className:"space-y-1.5 max-h-48 overflow-y-auto pr-1",children:fe.map((t,a)=>e.jsxs("div",{className:"p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1",children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5",children:[e.jsxs("span",{className:"text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400",children:["#",a+1," • ",t.timeRange]}),e.jsx("select",{value:t.visualEffect,onChange:s=>{const r=s.target.value;Ie(n=>n.map((i,o)=>o===a?{...i,visualEffect:r}:i))},className:"text-[10px] font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-indigo-700 dark:text-indigo-300",children:dt.map(s=>e.jsx("option",{value:s.label,children:s.label},s.id))})]}),e.jsx("input",{type:"text",value:t.narration,onChange:s=>{const r=s.target.value;Ie(n=>n.map((i,o)=>o===a?{...i,narration:r}:i))},className:"w-full text-[11px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-900 dark:text-white"})]},t.id))})]}),e.jsxs("div",{className:"space-y-2 pt-1 border-t border-purple-500/20",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("span",{className:"text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300",children:"Paso 1: Construir Super-Prompt Técnico (7 Piezas + Timings + Efectos)"}),e.jsx(b,{size:"sm",icon:Ta?e.jsx(Q,{className:"animate-spin"}):e.jsx(ot,{}),label:Ta?"Construyendo Super-Prompt...":"1. Generar Super-Prompt",variant:"indigo",alwaysExpanded:!0,disabled:Ta,onClick:Er})]}),e.jsx("textarea",{rows:4,value:at,onChange:t=>Zt(t.target.value),placeholder:"Haz clic en '1. Generar Super-Prompt' o escribe aquí las instrucciones de escenas, tiempos y efectos que Antigravity programará en HTML5 + GSAP...",className:"w-full bg-white dark:bg-slate-900 border border-purple-500/30 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 resize-y font-mono leading-relaxed"})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-purple-500/20",children:[e.jsx("span",{className:"text-[11px] font-extrabold text-purple-700 dark:text-purple-300",children:"Paso 2: Programar Video HTML5 + GSAP y Guardar en Biblioteca"}),e.jsx(b,{size:"md",icon:Xt?e.jsx(Q,{className:"animate-spin"}):e.jsx(De,{}),label:Xt?"Antigravity Programando HTML + GSAP...":"2. Enviar al Generador de Video (Antigravity)",variant:"purple",alwaysExpanded:!0,disabled:Xt,onClick:Ar})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/25 space-y-2",children:[e.jsx("div",{className:"flex flex-wrap items-center justify-between gap-2",children:e.jsxs("span",{className:"text-[11px] font-extrabold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5",children:[e.jsx(xa,{className:"w-3.5 h-3.5 text-cyan-500"}),"Paso 3: ¿Algo no te gustó del video? Pide correcciones a Antigravity"]})}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center gap-2",children:[e.jsx("input",{type:"text",value:Et,onChange:t=>ur(t.target.value),onKeyDown:t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),Cs())},placeholder:"Ej: Haz los textos más grandes, agrega un gráfico de barras en el segundo 4, cambia el fondo a azul oscuro...",className:"flex-1 bg-white dark:bg-slate-900 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"}),e.jsx(b,{size:"sm",icon:Ca?e.jsx(Q,{className:"animate-spin"}):e.jsx(ot,{}),label:Ca?"Aplicando Correcciones...":"3. Enviar Correcciones a Antigravity",variant:"cyan",alwaysExpanded:!0,disabled:Ca||!Et.trim(),onClick:Cs})]})]}),Qt&&e.jsxs("div",{className:"pt-2",children:[e.jsx("label",{className:"block text-[10px] font-mono uppercase text-slate-600 dark:text-slate-300 mb-1",children:"Código Fuente HTML5 / Tailwind / GSAP en Vivo:"}),e.jsx("textarea",{rows:10,value:He,onChange:t=>Fe(t.target.value),className:"w-full bg-slate-950 text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500"})]})]})]}),e.jsxs("div",{className:"lg:col-span-6 space-y-4 bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs [content-visibility:auto] [contain-intrinsic-size:auto_500px_auto_780px] [contain:layout_style_paint]",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-nowrap",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[e.jsx("span",{className:h("w-2.5 h-2.5 rounded-full shrink-0",ue?"bg-amber-500 animate-ping":ze?"bg-emerald-500 animate-pulse":"bg-slate-400")}),e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white truncate",children:ue?`Editor Visual (${D})`:`Lienzo Interactivo (${D})`})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0 flex-nowrap",children:[e.jsx(b,{size:"sm",icon:as?e.jsx(Q,{className:"animate-spin"}):e.jsx(vt,{}),label:"Sincronizar Voz IA",variant:"purple",disabled:as,onClick:Tr}),e.jsx(b,{size:"sm",icon:e.jsx(oa,{}),label:ue?"Salir de Edición":"Editar Lienzo",variant:"orange",isActive:ue,onClick:Ps}),e.jsx(b,{size:"sm",icon:At?e.jsx(Q,{className:"animate-spin"}):e.jsx(Le,{}),label:"Descargar MP4 (WhatsApp/Celular)",variant:"teal",disabled:At,onClick:Da}),e.jsx(b,{size:"sm",icon:Pt?e.jsx(Q,{className:"animate-spin"}):e.jsx(ct,{}),label:"Cápsula Academia (HTML5)",variant:"green",disabled:Pt,onClick:Ds}),e.jsx(b,{size:"sm",icon:e.jsx(Ws,{}),label:"Guardar en Biblioteca",variant:"teal",onClick:()=>nt({},!1)}),e.jsx(b,{size:"sm",icon:e.jsx(Wr,{}),label:"Pantalla Completa",variant:"neutral",onClick:Ms})]})]}),ue&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5",children:[e.jsx(Hr,{className:"w-3.5 h-3.5 text-amber-500 shrink-0"}),"Arrastra cualquier caja o título con el mouse para moverlo • Doble clic para escribir"]}),e.jsxs("button",{type:"button",onClick:Lr,className:"px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx(Te,{className:"w-3 h-3"}),"Guardar Cambios"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"text"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(Ot,{className:"w-3 h-3 text-teal-500"}),e.jsx(Gr,{className:"w-3 h-3 text-teal-500"}),e.jsx("span",{children:"+ Texto"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"card"},"*")},className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 flex items-center gap-1 cursor-pointer",children:[e.jsx(Ot,{className:"w-3 h-3 text-purple-500"}),e.jsx(zt,{className:"w-3 h-3 text-purple-500"}),e.jsx("span",{children:"+ Caja / Tarjeta"})]}),e.jsx("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_SELECT_PARENT"},"*")},disabled:!ye,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 disabled:opacity-40 cursor-pointer",children:"Seleccionar Caja Contenedora"}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DUPLICATE_SELECTED"},"*")},disabled:!ye,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-900 dark:text-white hover:border-teal-500 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(_t,{className:"w-3 h-3 text-indigo-500"}),e.jsx("span",{children:"Duplicar"})]}),e.jsxs("button",{type:"button",onClick:()=>{var t,a;return(a=(t=M.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DELETE_SELECTED"},"*")},disabled:!ye,className:"px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 cursor-pointer flex items-center gap-1",children:[e.jsx(Xe,{className:"w-3 h-3"}),e.jsx("span",{children:"Eliminar"})]})]})]}),e.jsx("div",{className:"flex justify-center items-center bg-slate-950 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-inner overflow-hidden min-h-[460px]",children:e.jsxs("div",{ref:fs,className:h("relative overflow-hidden bg-slate-950 shadow-2xl border border-white/10 transition-all duration-300",Aa?"w-screen h-screen rounded-none border-0 flex flex-col items-center justify-between p-4 sm:p-6":h("rounded-2xl mx-auto flex items-center justify-center",D==="9:16"?"w-full max-w-[390px] aspect-[9/16] max-h-[660px]":"w-full aspect-[16/9] max-h-[660px] min-h-[340px]")),children:[e.jsxs("div",{className:h("relative overflow-hidden bg-slate-950",Aa?D==="9:16"?"h-[calc(100vh-100px)] aspect-[9/16] max-w-[95vw] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-[min(94vw,calc((100vh-100px)*1.7778))] aspect-[16/9] max-h-[calc(100vh-100px)] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-full h-full"),children:[ke&&e.jsx("audio",{ref:le,src:ke,preload:"metadata",onTimeUpdate:t=>{var r,n;const a=t.currentTarget.currentTime,s=t.currentTarget.duration&&!isNaN(t.currentTarget.duration)?t.currentTarget.duration:O||20;Ne(a),(n=(r=M.current)==null?void 0:r.contentWindow)==null||n.postMessage({type:"STUDIO_SYNC_TIME",currentTime:a,duration:s,playing:!t.currentTarget.paused&&!t.currentTarget.ended},"*")},onLoadedMetadata:t=>{t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&rt(t.currentTarget.duration)},onEnded:()=>{var t,a,s;Re(!1),(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_PAUSE"},"*"),(s=me.current)==null||s.pause()}}),ae&&e.jsx("video",{ref:me,src:ae,width:D==="9:16"?1080:1920,height:D==="9:16"?1920:1080,muted:Yt,playsInline:!0,loop:!0,preload:"metadata",onTimeUpdate:t=>{ke||Ne(t.currentTarget.currentTime)},onLoadedMetadata:t=>{!ke&&t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&rt(t.currentTarget.duration)},className:"absolute inset-0 w-full h-full object-cover z-0"}),e.jsx("iframe",{ref:M,title:"WAPPY Studio HTML Canvas",srcDoc:fr,sandbox:"allow-scripts allow-same-origin",onLoad:()=>{var t,a,s,r,n,i;(a=(t=M.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*"),ue?(r=(s=M.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!0},"*"):ze||(i=(n=M.current)==null?void 0:n.contentWindow)==null||i.postMessage({type:"STUDIO_PAUSE"},"*")},className:h("absolute inset-0 w-full h-full border-0 z-10",ue?"pointer-events-auto":"pointer-events-none")}),Se&&Ra&&e.jsx("div",{className:h("absolute inset-x-3 z-20 flex justify-center pointer-events-none",Qe==="top"?"top-16":Qe==="center"?"top-1/2 -translate-y-1/2":"bottom-5"),children:e.jsx("div",{className:"bg-[#050c12]/90 backdrop-blur-md border border-[#c7f303]/40 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]",children:e.jsx("div",{className:"flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1",children:Ra.words.map((t,a)=>{const s=a===Ra.activeOffset;return e.jsx("span",{className:h("text-sm sm:text-base font-black uppercase tracking-wide transition-all duration-150",s?"text-[#080c04] scale-110 bg-[#c7f303] px-2 py-0.5 rounded-lg shadow-[0_0_14px_rgba(199,243,3,0.45)]":"text-white/95"),children:t},`${t}-${a}`)})})})})]}),Aa&&e.jsxs("div",{className:"w-full max-w-3xl mx-auto mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 flex items-center gap-3 z-30 shadow-2xl",children:[e.jsx("button",{type:"button",onClick:Es,title:ze?"Pausar / Parar":"Reproducir",className:"px-3.5 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:ze?e.jsxs(e.Fragment,{children:[e.jsx(ba,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(Ue,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:za,title:"Reiniciar animación",className:"p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer shrink-0",children:e.jsx(Fa,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:O||20,step:.1,value:st,onChange:t=>As(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-200 shrink-0",children:[st.toFixed(1),"s / ",(O||20).toFixed(1),"s"]}),e.jsxs("button",{type:"button",onClick:Ps,className:h("px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0",ue?"bg-amber-500/20 border-amber-400 text-amber-300":"bg-slate-800 border-slate-700 text-slate-200 hover:text-white"),children:[e.jsx(oa,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:ue?"Editando":"Editar"})]}),e.jsxs("button",{type:"button",onClick:Ms,className:"px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0",children:[e.jsx(qr,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Salir"})]})]})]})}),e.jsxs("div",{className:"p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{type:"button",onClick:Es,title:ze?"Pausar animación y subtítulos":"Reproducir animación y subtítulos",className:"px-3 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0",children:ze?e.jsxs(e.Fragment,{children:[e.jsx(ba,{className:"w-4 h-4 fill-white"}),e.jsx("span",{children:"Pausar"})]}):e.jsxs(e.Fragment,{children:[e.jsx(Ue,{className:"w-4 h-4 fill-white ml-0.5"}),e.jsx("span",{children:"Play"})]})}),e.jsx("button",{type:"button",onClick:za,title:"Reiniciar animación",className:"p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition cursor-pointer shrink-0",children:e.jsx(Fa,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:O||20,step:.1,value:st,onChange:t=>As(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0",children:[st.toFixed(1),"s / ",(O||20).toFixed(1),"s"]}),ae&&e.jsx("button",{type:"button",onClick:()=>ir(!Yt),title:Yt?"Activar audio del video original":"Silenciar video original",className:"p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition cursor-pointer",children:Yt?e.jsx(Ys,{className:"w-4 h-4 text-rose-500"}):e.jsx(pt,{className:"w-4 h-4 text-teal-500"})})]}),e.jsxs("div",{className:"pt-2 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:[e.jsxs("div",{className:"p-3 rounded-xl border bg-teal-500/10 border-teal-500/30 text-teal-800 dark:text-teal-200 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20",children:"WhatsApp • Celular • Redes"}),e.jsx(Le,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight mt-1.5",children:"Renderizado .MP4 Antigravity (60 FPS + Voz)"}),e.jsx("div",{className:"text-[10px] opacity-85 leading-snug mt-0.5",children:"Une Animación HTML + Subtítulos + Voz IA en un archivo .MP4 listo para WhatsApp o Reels"})]}),e.jsx(b,{size:"sm",icon:At?e.jsx(Q,{className:"animate-spin"}):e.jsx(Le,{}),label:At?"Renderizando Video MP4...":"Descargar Video .MP4 (Todo Unido)",variant:"teal",alwaysExpanded:!0,disabled:At,onClick:Da,className:"w-full justify-center"})]}),e.jsxs("div",{className:"p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20",children:"Descarga Instantánea • Offline"}),e.jsx(Va,{className:"w-4 h-4 shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold leading-tight mt-1.5",children:"Cápsula Interactiva HTML5 (Móvil & Web)"}),e.jsx("div",{className:"text-[10px] opacity-85 leading-snug mt-0.5",children:"Descarga inmediata del archivo .HTML con animación y audio integrados"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsx(b,{size:"sm",icon:Pt?e.jsx(Q,{className:"animate-spin"}):e.jsx(ct,{}),label:"Descargar .HTML",variant:"green",alwaysExpanded:!0,disabled:Pt,onClick:Ds,className:"flex-1 justify-center"}),e.jsx(b,{size:"sm",icon:e.jsx(_t,{}),label:"Copiar LMS",variant:"fuchsia",alwaysExpanded:!0,disabled:Pt,onClick:Dr})]})]})]})]}),ue&&ye&&e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900/95 rounded-2xl border border-teal-500/40 space-y-3 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5",children:[e.jsx(oa,{className:"w-3.5 h-3.5"}),"Propiedades del Elemento Seleccionado (<",ye.tagName,">)"]}),e.jsx("button",{type:"button",onClick:()=>Ye({dx:0,dy:0,scale:1}),className:"text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer",children:"Restablecer posición"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Texto del elemento (edita aquí o con doble clic en el video):"}),e.jsx("textarea",{rows:2,value:ye.text,onChange:t=>Ye({text:t.target.value}),className:"w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-center",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:["Tamaño Letra (",ye.fontSize,"px)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>Ye({fontSize:Math.max(10,ye.fontSize-2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"A-"}),e.jsx("button",{type:"button",onClick:()=>Ye({fontSize:Math.min(96,ye.fontSize+2)}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"A+"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:["Escala Caja (",ye.scale,"x)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{type:"button",onClick:()=>Ye({scale:Math.max(.5,Number((ye.scale-.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"-"}),e.jsx("button",{type:"button",onClick:()=>Ye({scale:Math.min(2.5,Number((ye.scale+.1).toFixed(2)))}),className:"flex-1 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer",children:"+"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Texto"}),e.jsx("input",{type:"color",value:ye.color,onChange:t=>Ye({color:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Color de Fondo"}),e.jsx("input",{type:"color",value:ye.backgroundColor,onChange:t=>Ye({backgroundColor:t.target.value}),className:"w-full h-7 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"})]})]})]})]})]}),C==="lab"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-xs",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0",children:e.jsx(De,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:"Laboratorio de Voces, Pausas, Vocal Bursts & Efectos Antigravity"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Escucha y prueba las 30 voces en vivo, construye pausas/respiraciones y selecciona los efectos visuales de las Skills de Antigravity para tu video."})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(b,{size:"sm",icon:e.jsx(pt,{}),label:"SFX Whoosh",variant:"cyan",alwaysExpanded:!0,onClick:()=>_a("whoosh")}),e.jsx(b,{size:"sm",icon:e.jsx(pt,{}),label:"SFX Pop",variant:"amber",alwaysExpanded:!0,onClick:()=>_a("pop")}),e.jsx(b,{size:"sm",icon:e.jsx(pt,{}),label:"SFX Ding",variant:"emerald",alwaysExpanded:!0,onClick:()=>_a("ding")})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:"Modelo en el Laboratorio:"}),e.jsx("div",{className:"flex flex-wrap items-center gap-2",children:J.map(t=>{const a=W===t.id;return e.jsxs("button",{type:"button",onClick:()=>{he(t.id),t.supportedVoices.includes(N)||ut(t.supportedVoices[0]||"Kore")},className:h("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[t.name," (",t.supportedVoices.length," voces)"]},t.id)})})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsx("div",{className:"flex flex-wrap items-center justify-between gap-2",children:e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:"1. Efectos Vocales Orgánicos (Vocal Bursts en Vivo)"}),e.jsxs("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:["Escucha cómo suena cada etiqueta con la voz actual (",N,") o insértala en tu frase de prueba."]})]})}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:ge.map(t=>{const a=Zs===t.tag;return e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400",children:t.tag}),e.jsx("p",{className:"text-xs font-bold text-slate-900 dark:text-white mt-0.5",children:t.label}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:t.description})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[e.jsx(b,{size:"sm",icon:e.jsx(Ot,{}),label:"Insertar",variant:"amber",onClick:()=>{fa(s=>`${s.trim()} ${t.tag} `)}}),e.jsx(b,{size:"sm",icon:a?e.jsx(Q,{className:"animate-spin"}):e.jsx(Ue,{}),label:"Probar",variant:"indigo",disabled:a,onClick:async()=>{try{Ya(t.tag);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(u),body:JSON.stringify({voiceName:N,model:"gemini-3.8-flash-tts",stylePrompt:"Voz muy expresiva y natural.",text:`Escucha cómo suena este efecto natural en medio de una frase: ${t.tag} ¡Suena totalmente humano!`})}),r=await ve(s);r.audioBase64&&pe({base64:r.audioBase64,title:`Efecto ${t.tag} (${N})`,durationSeconds:r.durationSeconds,voiceName:N})}catch(s){f({type:"error",text:s.message})}finally{Ya(null)}}})]})]},t.tag)})})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:"2. Probador de Voces en Vivo y Constructor de Pausas / Énfasis"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Selecciona cualquier voz, escucha su timbre al instante, agrega pausas y envía tu configuración al Estudio de Voz o al Editor de Video."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",children:["Voces activas: ",ft," de ",y.length]}),e.jsx(b,{size:"sm",icon:ka===N?e.jsx(Q,{className:"animate-spin"}):e.jsx(pt,{}),label:`Escuchar ${N}`,variant:"teal",alwaysExpanded:!0,disabled:ka===N,onClick:()=>ks(N)})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:["Selecciona la Voz (",ft," activas para ",F==null?void 0:F.name,")"]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:y.map(t=>{const a=N===t.id,s=ht(t.id);return e.jsxs("button",{type:"button",onClick:()=>{s||he("gemini-3.8-flash-tts"),ut(t.id)},className:h("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5",a?"bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/50 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-teal-400",!s&&"opacity-55"),children:[e.jsxs("span",{children:[t.name," (",t.gender,")"]}),s&&e.jsx(Te,{className:"w-3 h-3 text-emerald-500"})]},t.id)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5",children:"Prompt de Dirección (speechMetadata.style)"}),e.jsx("input",{type:"text",value:kt,onChange:t=>Js(t.target.value),className:"w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsx("span",{className:"block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:"Insertar Pausas, Respiración y Énfasis en el Texto de Prueba:"}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:Gs.map(t=>e.jsxs("button",{type:"button",onClick:()=>fa(a=>`${a.trim()} ${t.tag} `),title:t.desc,className:"px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold transition cursor-pointer",children:["+ ",t.label," ",e.jsxs("span",{className:"font-mono opacity-75",children:["(",t.tag,")"]})]},t.tag))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5",children:"Texto de Prueba"}),e.jsx("textarea",{rows:3,value:Ae,onChange:t=>fa(t.target.value),className:"w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[e.jsx(b,{size:"md",icon:ya?e.jsx(Q,{className:"animate-spin"}):e.jsx(De,{}),label:ya?"Sintetizando en el Laboratorio...":"Sintetizar en el Laboratorio",variant:"indigo",alwaysExpanded:!0,disabled:ya||!Ae.trim(),onClick:jr}),e.jsx(b,{size:"md",icon:e.jsx(vt,{}),label:"Llevar Frase y Voz al Estudio TTS",variant:"teal",alwaysExpanded:!0,onClick:()=>{Be(Ae),Ft(kt),we("tts")}}),e.jsx(b,{size:"md",icon:e.jsx(Le,{}),label:"Llevar al Editor de Video",variant:"purple",alwaysExpanded:!0,onClick:()=>{Be(Ae),Ft(kt),we("video")}})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(ot,{className:"w-4 h-4 text-purple-500"}),"3. Catálogo de Efectos Visuales & Motion Graphics (Skills de Antigravity)"]}),e.jsxs("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:["Selecciona los efectos y transiciones que Antigravity encadenará a 60 FPS en tu video HTML + GSAP (",Me.length," activos)."]})]}),e.jsx(b,{size:"sm",icon:e.jsx(Le,{}),label:`Ir al Editor de Video (${Me.length} efectos)`,variant:"purple",alwaysExpanded:!0,onClick:()=>we("video")})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",children:ca.map(t=>{const a=tt===t.id;return e.jsxs("div",{className:h("p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition",a?"bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/30":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:t.label}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30",children:"60 FPS"})]}),e.jsx("p",{className:"text-[10px] font-mono text-indigo-600 dark:text-indigo-400 mt-1",children:t.colors}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300 mt-1",children:t.description})]}),e.jsx(b,{size:"sm",icon:a?e.jsx(Te,{}):e.jsx(De,{}),label:a?"Dirección Activa":"Usar Dirección de Arte",variant:a?"teal":"purple",alwaysExpanded:!0,onClick:()=>ps(t.id)})]},t.id)})}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:dt.map(t=>{const a=Me.includes(t.id);return e.jsxs("div",{className:h("p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition",a?"bg-indigo-500/10 border-indigo-500/45 ring-1 ring-indigo-500/30":"bg-slate-50 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5",children:[e.jsx("span",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:t.label}),e.jsx("span",{className:"text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700",children:t.category})]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug",children:t.description})]}),e.jsx("div",{className:"flex items-center justify-between gap-2 pt-1",children:e.jsx(b,{size:"sm",icon:a?e.jsx(Te,{}):e.jsx(Ot,{}),label:a?"Activo en Editor de Video":"Agregar al Editor de Video",variant:a?"teal":"indigo",alwaysExpanded:!0,onClick:()=>Ss(t.id)})})]},t.id)})})]})]}),C==="library"&&e.jsxs("div",{className:"space-y-5 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(Va,{className:"w-5 h-5 text-indigo-500"}),"Biblioteca de Audios y Videos HTML"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Tus locuciones WAV y tus videos HTML5 + GSAP quedan guardados permanentemente para reabrir en el editor, descargar el .HTML al instante o renderizar el .MP4 con Antigravity."})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx("div",{className:"inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800",children:[{id:"all",label:`Todos (${Pe.length})`},{id:"audio",label:`🎙️ Audios (${Pe.filter(t=>t.kind!=="video").length})`},{id:"video",label:`🎬 Videos HTML (${Pe.filter(t=>t.kind==="video").length})`}].map(t=>e.jsx("button",{type:"button",onClick:()=>xr(t.id),className:h("px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer",Ea===t.id?"bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/40":"text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"),children:t.label},t.id))}),Pe.length>0&&e.jsx(b,{size:"sm",icon:e.jsx(Xe,{}),label:"Limpiar Historial",variant:"danger",alwaysExpanded:!0,onClick:()=>{window.confirm("¿Borrar todos los audios y videos guardados?")&&(xt([]),ri())}})]})]}),Pe.length===0?e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2",children:[e.jsx(vt,{className:"w-10 h-10 mx-auto text-slate-400"}),e.jsx("p",{className:"text-sm font-bold text-slate-900 dark:text-white",children:"Aún no hay audios ni videos en tu biblioteca"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto",children:'Genera una locución en "Estudio de Voz (TTS)" o un video en "Compositor de Video HTML" y aparecerán aquí automáticamente.'})]}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:Pe.filter(t=>Ea==="video"?t.kind==="video":Ea==="audio"?t.kind!=="video":!0).map(t=>e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("h4",{className:"text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1",children:t.title}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[t.kind==="video"&&e.jsxs("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30",children:["🎬 VIDEO HTML ",t.aspectRatio||""]}),e.jsx("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30",children:t.voiceName})]})]}),e.jsxs("div",{className:"flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300",children:[e.jsxs("span",{children:["⏱ ",xi(t.durationSeconds)]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[t.wordCount," palabras"]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:mi(t.createdAt)})]}),t.stylePrompt&&e.jsxs("div",{className:"p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-[11px] italic text-slate-600 dark:text-slate-300 line-clamp-2",children:['"',t.stylePrompt,'"']})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800",children:[e.jsx("div",{className:"flex flex-wrap items-center gap-1.5",children:t.kind==="video"?e.jsx(b,{size:"sm",icon:e.jsx(oa,{}),label:"Abrir en Editor",variant:"orange",alwaysExpanded:!0,onClick:()=>Rs(t)}):e.jsxs(e.Fragment,{children:[e.jsx(b,{size:"sm",icon:e.jsx(Ue,{}),label:"Reproducir",variant:"teal",alwaysExpanded:!0,onClick:()=>ws(t)}),e.jsx(b,{size:"sm",icon:e.jsx(Le,{}),label:"Usar en Video",variant:"purple",alwaysExpanded:!0,onClick:()=>ws(t,!0)})]})}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[t.kind==="video"&&e.jsxs(e.Fragment,{children:[e.jsx(b,{size:"sm",icon:e.jsx(ct,{}),label:"Descargar .HTML",variant:"green",alwaysExpanded:!0,onClick:async()=>{if(t.capsuleKey){const a=await wt(t.capsuleKey);if(a){gt(a,`wappy-video-${t.id}.html`);return}}if(t.htmlKey){const a=await wt(t.htmlKey);if(a){gt(a,`wappy-video-${t.id}.html`);return}}f({type:"error",text:"No se encontró el archivo HTML guardado para este elemento."})}}),e.jsx(b,{size:"sm",icon:e.jsx(Le,{}),label:t.mp4Key?"Descargar .MP4":"Renderizar .MP4",variant:"teal",alwaysExpanded:!0,onClick:async()=>{if(t.mp4Key){const a=await wt(t.mp4Key);if(a){gt(a,`wappy-studio-reel-${t.id}.mp4`);return}}await Rs(t),setTimeout(()=>{Da()},250)}})]}),t.kind!=="video"&&e.jsx(b,{size:"sm",icon:e.jsx(ct,{}),label:"Descargar WAV",variant:"green",alwaysExpanded:!0,onClick:async()=>{const a=await vs(t);if(!a){f({type:"error",text:"Este audio ya no está disponible (se generó antes del guardado permanente). Vuelve a generarlo."});return}gt(a,`wappy-audio-${t.id}.wav`)}}),e.jsx(b,{size:"sm",icon:e.jsx(Xe,{}),label:"Eliminar",variant:"danger",onClick:()=>yr(t)})]})]})]},t.id))})]})]}),gr&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0",children:e.jsx(Rt,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:"Enlace Personal Antigravity, Pack de 7 Skills & Claves IA"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-zinc-400",children:"Conecta tu propio Antigravity (con o sin cuenta en WAPPY), instala las 7 Skills de Video/Diseño y gestiona tus claves Gemini."})]})]}),e.jsx("button",{type:"button",onClick:()=>Ge(!1),className:"p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-zinc-300 cursor-pointer",children:e.jsx(ua,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800",children:[e.jsxs("button",{type:"button",onClick:()=>G("antigravity"),className:h("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",K==="antigravity"?"bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(Rt,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"🔌 Mi Antigravity & Skills"})]}),e.jsxs("button",{type:"button",onClick:()=>G("keys"),className:h("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",K==="keys"?"bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(Dt,{className:"w-3.5 h-3.5"}),e.jsxs("span",{children:["Mis Claves Locales (",qe,"/3)"]})]}),e.jsxs("button",{type:"button",onClick:()=>G("models"),className:h("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",K==="models"?"bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(Fs,{className:"w-3.5 h-3.5"}),e.jsxs("span",{children:["Modelos WAPPY (",Hs.length,")"]})]})]}),K==="antigravity"?e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"p-4 rounded-2xl bg-purple-500/5 border border-purple-500/25 space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx(Dt,{className:"w-3.5 h-3.5"}),"1. Tu Clave de Enlace Personal Antigravity"]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5",children:R.startsWith("wpy_guest_")?"Clave automática de visitante (sin necesidad de cuenta). También puedes pegar aquí tu clave wpy_... si tienes cuenta en WAPPY.":"Clave personal vinculada a tu cuenta de WAPPY IA."})]}),e.jsxs("span",{className:h("text-[10px] font-extrabold px-2.5 py-1 rounded-xl border flex items-center gap-1.5",B?"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30":"bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"),children:[e.jsx("span",{className:h("w-2 h-2 rounded-full",B?"bg-emerald-500 animate-pulse":"bg-amber-500")}),B?"Stream SSE Activo":"Listo para Enlazar"]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center gap-2",children:[e.jsx("input",{type:"text",value:R,onChange:t=>{const a=t.target.value.trim();Y(a);try{localStorage.setItem("wappy_antigravity_bridge_key",a)}catch{}},placeholder:"wpy_... o wpy_guest_...",className:"flex-1 px-3 py-2 rounded-xl border border-purple-500/30 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(b,{size:"sm",icon:A==="key"?e.jsx(Te,{}):e.jsx(_t,{}),label:A==="key"?"¡Copiada!":"Copiar Clave",variant:"fuchsia",alwaysExpanded:!0,onClick:()=>{navigator.clipboard.writeText(R),ne("key"),setTimeout(()=>ne(null),2e3)}}),e.jsx(b,{size:"sm",icon:e.jsx(xa,{}),label:"Sincronizar",variant:"cyan",onClick:()=>Oa(!0),title:"Generar o sincronizar clave de enlace Antigravity"})]})]})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/25 space-y-3.5",children:[e.jsx("div",{className:"flex flex-wrap items-start justify-between gap-2",children:e.jsxs("div",{children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5",children:[e.jsx(De,{className:"w-4 h-4 text-indigo-500"}),"2. 📦 Pack Importable de las 7 Skills de Diseño y Video WAPPY IA"]}),e.jsxs("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed",children:["Instala en tu propio Antigravity las ",e.jsx("strong",{children:"7 Skills Oficiales de Producción Audiovisual y UI de WAPPY IA"})," junto con el puente reactivo ",e.jsx("code",{className:"font-mono",children:"wappy-push-daemon.js"})," para que tu Antigravity programe videos HTML5 + GSAP a 60 FPS y los envíe directo a este Lienzo:"]})]})}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]",children:[{id:"protocolo-produccion-videos",desc:"Sistema de las 7 Piezas + Portada Magnética 2s 🔥 ¡GRATIS!"},{id:"animaciones-17-efectos-reels",desc:"19 Efectos Virales y Transiciones 3D a 60 FPS"},{id:"animaciones-wappy-brand",desc:"Identidad WAPPY Lima #C7F303, Félix Voxel 3D y Tenshi"},{id:"animaciones-dark-tech-hud",desc:"HUD Cyberpunk #0C192E + #00D4FF y Tarjetas de Cristal"},{id:"animaciones-explicativas-sst",desc:"Visor Normativo Subrayado (Decreto 1072 / Res. 0312 / GTC-45)"},{id:"hyperframes-motion-design",desc:"Motor GSAP Determinista y Sincronización Palabra a Palabra"},{id:"wappy-ui-design-system",desc:"Sistema de 14 Grupos Semánticos y Glassmorphism"}].map(t=>e.jsxs("div",{className:"p-2 rounded-xl bg-white/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2",children:[e.jsx(pa,{className:"w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"font-mono font-bold text-[10px] text-indigo-700 dark:text-indigo-300 truncate",children:t.id}),e.jsx("div",{className:"text-[10px] text-slate-600 dark:text-zinc-400 truncate",children:t.desc})]})]},t.id))}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 pt-1",children:[e.jsx(b,{size:"sm",icon:e.jsx(ct,{}),label:"Descargar Pack de Skills (.JSON Importable)",variant:"green",alwaysExpanded:!0,onClick:zr}),e.jsx(b,{size:"sm",icon:A==="prompt"?e.jsx(Te,{}):e.jsx(_t,{}),label:A==="prompt"?"¡Prompt Copiado al Portapapeles!":"Copiar Prompt para Enviar Skills a Antigravity",variant:"indigo",alwaysExpanded:!0,onClick:()=>{navigator.clipboard.writeText(zs()),ne("prompt"),setTimeout(()=>ne(null),2500),f({type:"success",text:"📋 ¡Prompt copiado! Pégalo en el chat de tu Antigravity para instalar automáticamente las 7 Skills y conectar el puente en vivo."})}}),e.jsx(b,{size:"sm",icon:e.jsx(Rt,{}),label:"Descargar Instalador 1-Clic (.command Mac / .bat Windows)",variant:"teal",alwaysExpanded:!0,onClick:Rr})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{className:"flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400",children:[e.jsxs("span",{children:["Prompt listo para pegar en el Chat de tu Antigravity (incluye tu clave"," ",e.jsx("code",{className:"font-mono text-purple-600 dark:text-purple-400",children:R}),"):"]}),e.jsx("button",{type:"button",onClick:()=>{navigator.clipboard.writeText($a()),ne("terminal"),setTimeout(()=>ne(null),2e3)},className:"text-teal-600 dark:text-teal-400 hover:underline cursor-pointer",children:A==="terminal"?"✓ Comando Terminal copiado":"Copiar solo comando Terminal"})]}),e.jsx("div",{className:"p-2.5 rounded-xl bg-slate-950 text-emerald-300 font-mono text-[10px] border border-slate-800 max-h-28 overflow-y-auto whitespace-pre-wrap select-all",children:zs()})]})]}),e.jsx("div",{className:"flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800",children:e.jsx(b,{size:"sm",icon:e.jsx(Te,{}),label:"Listo",variant:"teal",alwaysExpanded:!0,onClick:()=>Ge(!1)})})]}):K==="keys"?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-900 dark:text-teal-200 leading-relaxed",children:["Obtén gratis tus claves en"," ",e.jsx("a",{href:"https://aistudio.google.com/app/apikey",target:"_blank",rel:"noopener noreferrer",className:"font-extrabold underline hover:text-teal-600",children:"Google AI Studio (aistudio.google.com)"}),". WAPPY Studio rotará automáticamente entre tus claves locales y el pool del servidor para evitar bloqueos por cuota 429 en locuciones de hasta 60 minutos."]}),e.jsx("div",{className:"space-y-2.5",children:aa.map((t,a)=>e.jsxs("div",{className:"p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px] font-bold",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-slate-900 dark:text-white",children:t.label||`Clave Google Gemini #${a+1}`}),e.jsx("span",{className:h("text-[9px] font-extrabold px-1.5 py-0.5 rounded border",a===0?"bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30":"bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"),children:a===0?"Prioridad #1":`Failover #${a+1}`})]}),t.status==="valid"&&e.jsxs("span",{className:"text-emerald-700 dark:text-emerald-400 flex items-center gap-1",children:[e.jsx(pa,{className:"w-3.5 h-3.5"})," Activa y verificada"]}),t.status==="invalid"&&e.jsxs("span",{className:"text-rose-600 dark:text-rose-400 flex items-center gap-1",children:[e.jsx(Bt,{className:"w-3.5 h-3.5"})," Clave inválida o vencida"]})]}),e.jsx("input",{type:"password",value:t.key,onChange:s=>{const r=s.target.value;sa(n=>n.map((i,o)=>o===a?{...i,key:r,status:"unchecked"}:i))},placeholder:"AIzaSy...",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"})]},a))}),hs&&e.jsx("div",{className:"p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300",children:hs}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800",children:[e.jsx(b,{size:"sm",icon:e.jsx(Xe,{}),label:"Limpiar Claves",variant:"danger",onClick:()=>{sa([{key:"",label:"Clave Principal #1",status:"unchecked"},{key:"",label:"Clave Respaldo #2",status:"unchecked"},{key:"",label:"Clave Respaldo #3",status:"unchecked"}]),localStorage.removeItem(ma),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),it("Claves eliminadas del navegador.")}}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(b,{size:"sm",icon:e.jsx(ua,{}),label:"Cerrar",variant:"neutral",onClick:()=>Ge(!1)}),e.jsx(b,{size:"sm",icon:Ma?e.jsx(Q,{className:"animate-spin"}):e.jsx(Ws,{}),label:Ma?"Validando...":"Guardar y Validar",variant:"teal",disabled:Ma,onClick:hr})]})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed",children:[e.jsx("strong",{children:"Ecosistema Oficial GOOGLE_MODELS de WAPPY:"})," Haz clic en cualquier modelo TTS o de Generación IA para activarlo de inmediato en el estudio."]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1",children:Hs.map(t=>{const a=t.id.includes("tts"),s=t.id==="gemini-3.8-flash"||t.id==="gemini-3.6-flash"||t.id==="gemini-3.5-flash-lite",r=a&&W===t.id||s&&U===t.id;return e.jsxs("div",{onClick:()=>{a?he(t.id):s&&Ce(t.id)},className:h("p-3 rounded-xl border text-left transition flex flex-col justify-between",a||s?"cursor-pointer":"opacity-90",r?"bg-teal-50/90 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400",children:t.category}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25",children:t.badge})]}),e.jsx("div",{className:"font-mono text-xs font-extrabold text-slate-900 dark:text-white",children:t.id}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-snug",children:t.description})]}),(a||s)&&e.jsxs("div",{className:"mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-slate-500 dark:text-zinc-400",children:a?"Motor de Voz TTS":"Motor IA Escenas/Guion"}),e.jsx("span",{className:h("font-extrabold",r?"text-emerald-700 dark:text-emerald-400":"text-indigo-600 dark:text-indigo-400"),children:r?"✓ En uso":"Usar este modelo →"})]})]},t.id)})}),e.jsx("div",{className:"flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800",children:e.jsx(b,{size:"sm",icon:e.jsx(Te,{}),label:"Listo",variant:"teal",onClick:()=>Ge(!1)})})]})]})})]})}function bi({audioBase64:p,audioUrl:x,title:u,durationSeconds:m,voiceName:w,onSendToVideo:S}){const v=l.useRef(null),[ee,be]=l.useState(!1),[_,L]=l.useState(0),[C,ie]=l.useState(m||0),[U,Ce]=l.useState(1),[T,k]=l.useState(1),[K,G]=l.useState(!1),[R,Y]=l.useState(!1),B=x||(p?`data:audio/wav;base64,${p}`:"");l.useEffect(()=>{be(!1),L(0),m&&m>0&&ie(m)},[B,m]);const se=()=>{!v.current||!B||(ee?v.current.pause():v.current.play().catch(y=>console.error("Error al reproducir audio:",y)))},A=y=>{if(!v.current)return;const j=Math.max(1,C||v.current.duration||0),Z=Math.max(0,Math.min(j,v.current.currentTime+y));v.current.currentTime=Z,L(Z)},ne=()=>{if(!v.current)return;const y=!K;v.current.muted=y,G(y)},J=y=>{if(!y||isNaN(y)||y<0)return"00:00";const j=Math.floor(y),Z=Math.floor(j/60),$=j%60;return`${Z.toString().padStart(2,"0")}:${$.toString().padStart(2,"0")}`},Ee=async()=>{if(!B)return;const y=`${u.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"wappy-tts"}.wav`;try{if(B.startsWith("data:")||B.startsWith("blob:")){const $=document.createElement("a");$.href=B,$.download=y,document.body.appendChild($),$.click(),document.body.removeChild($);return}const Z=await fetch(B,{headers:H()});if(Z.ok){const $=await Z.blob(),ge=URL.createObjectURL($),re=document.createElement("a");re.href=ge,re.download=y,document.body.appendChild(re),re.click(),document.body.removeChild(re),setTimeout(()=>URL.revokeObjectURL(ge),4e3);return}}catch{}const j=document.createElement("a");j.href=B,j.download=y,document.body.appendChild(j),j.click(),document.body.removeChild(j)};return B?e.jsxs("div",{className:"bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 border border-indigo-500/25 dark:border-indigo-500/25 rounded-2xl p-5 shadow-xl space-y-3.5",children:[e.jsx("audio",{ref:v,src:B,preload:"metadata",onPlay:()=>be(!0),onPause:()=>be(!1),onEnded:()=>be(!1),onTimeUpdate:()=>{v.current&&L(v.current.currentTime)},onLoadedMetadata:()=>{var y;(y=v.current)!=null&&y.duration&&!isNaN(v.current.duration)&&ie(v.current.duration)}}),e.jsxs("div",{className:"flex flex-wrap sm:flex-nowrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"}),e.jsx("h3",{className:"text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-xl",children:u})]}),e.jsxs("p",{className:"text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate",children:["Voz:"," ",e.jsx("span",{className:"font-semibold text-slate-700 dark:text-slate-200",children:w||"Kore"})," ","• Formato WAV 24kHz"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[p&&e.jsx(b,{size:"sm",icon:R?e.jsx(Te,{}):e.jsx(_t,{}),label:R?"Copiado":"Copiar Base64",variant:"fuchsia",onClick:()=>{navigator.clipboard.writeText(p),Y(!0),setTimeout(()=>Y(!1),2e3)}}),e.jsx(b,{size:"sm",icon:e.jsx(Le,{}),label:"Llevar al Video",variant:"purple",alwaysExpanded:!0,onClick:S}),e.jsx(b,{size:"sm",icon:e.jsx(ct,{}),label:"Descargar WAV",variant:"green",alwaysExpanded:!0,onClick:Ee})]})]}),e.jsx("div",{className:"flex items-center justify-between gap-1 h-12 bg-slate-100/90 dark:bg-slate-950/80 rounded-xl px-4 py-2 border border-slate-200/90 dark:border-slate-800/90 overflow-hidden",children:Array.from({length:42}).map((y,j)=>{const Z=C>0?_/C:0,$=j/42,ge=$<=Z,re=20+Math.sin(j*.4)*15+Math.cos(j*.9)*12,W=ee?Math.max(15,re*(.8+Math.sin(Date.now()/200+j)*.4)):re;return e.jsx("div",{onClick:()=>{if(v.current&&C>0){const he=$*C;v.current.currentTime=he,L(he)}},style:{height:`${Math.max(16,Math.min(95,W))}%`},className:h("w-1 rounded-full cursor-pointer transition-all duration-150",ge?"bg-gradient-to-t from-indigo-500 to-amber-400":"bg-slate-300 dark:bg-slate-800 hover:bg-slate-400 dark:hover:bg-slate-700")},j)})}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("input",{type:"range",min:0,max:Math.max(1,C),step:.1,value:Math.min(_,Math.max(1,C)),onChange:y=>{const j=parseFloat(y.target.value);v.current&&(v.current.currentTime=j),L(j)},className:"w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"}),e.jsxs("div",{className:"flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400",children:[e.jsx("span",{children:J(_)}),e.jsx("span",{children:J(C)})]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-0.5",children:[e.jsxs("button",{type:"button",onClick:()=>{const y=[.75,1,1.25,1.5,2],j=y[(y.indexOf(U)+1)%y.length];Ce(j),v.current&&(v.current.playbackRate=j)},title:"Cambiar velocidad de reproducción",className:"px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-lg border border-slate-200 dark:border-slate-700 transition shrink-0 cursor-pointer",children:[U,"x"]}),e.jsxs("div",{className:"flex items-center gap-2 sm:gap-3",children:[e.jsx("button",{type:"button",onClick:()=>A(-10),title:"Retroceder 10 segundos",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer",children:e.jsx(Fa,{className:"w-4 h-4"})}),e.jsx("button",{type:"button",onClick:se,className:"w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition transform active:scale-95 shrink-0 cursor-pointer",children:ee?e.jsx(ba,{className:"w-5 h-5 fill-white"}):e.jsx(Ue,{className:"w-5 h-5 fill-white ml-0.5"})}),e.jsx("button",{type:"button",onClick:()=>A(10),title:"Adelantar 10 segundos",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer",children:e.jsx(Kr,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsx("button",{type:"button",onClick:ne,title:K?"Activar sonido":"Silenciar",className:"p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer",children:K||T===0?e.jsx(Ys,{className:"w-4 h-4 text-rose-500"}):e.jsx(pt,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:1,step:.05,value:K?0:T,onChange:y=>{const j=parseFloat(y.target.value);k(j),G(j===0),v.current&&(v.current.volume=j,v.current.muted=j===0)},className:"hidden sm:block w-20 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"})]})]})]}):null}function Ks(p){const x=Math.max(0,Math.round(p||0)),u=Math.floor(x/60),m=x%60;return`${u}m ${m.toString().padStart(2,"0")}s`}function gi({job:p,onPause:x,onResume:u,onCancel:m,onPlayChunk:w,onLoadMaster:S}){const v=p.status==="completed",ee=p.status==="failed",be=p.status==="processing",_=p.status==="paused";return e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:h("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",v?"bg-emerald-500/10 border-emerald-500/30 text-emerald-500":ee?"bg-rose-500/10 border-rose-500/30 text-rose-500":"bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400"),children:be?e.jsx(Q,{className:"w-5 h-5 animate-spin"}):v?e.jsx(pa,{className:"w-5 h-5"}):ee?e.jsx(Bt,{className:"w-5 h-5"}):e.jsx(De,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("h4",{className:"text-sm font-bold text-slate-900 dark:text-white",children:v?"¡Audio de Larga Duración Completado!":ee?"Error en la Generación":_?"Generación Pausada":`Generando fragmento ${p.currentChunkIndex+1} de ${p.totalChunks}...`}),e.jsx("span",{className:h("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border",v?"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25":ee?"bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25":"bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 animate-pulse"),children:p.status})]}),e.jsxs("p",{className:"text-xs text-slate-500 dark:text-slate-400 mt-0.5",children:["Generados ",Ks(p.generatedTotalSeconds)," de ~",Ks(p.estimatedTotalSeconds)," estimados"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[be&&e.jsx(b,{size:"sm",icon:e.jsx(ba,{}),label:"Pausar",variant:"amber",alwaysExpanded:!0,onClick:x}),_&&e.jsx(b,{size:"sm",icon:e.jsx(Ue,{}),label:"Reanudar",variant:"teal",alwaysExpanded:!0,onClick:u}),!v&&!ee&&e.jsx(b,{size:"sm",icon:e.jsx(ua,{}),label:"Cancelar",variant:"danger",onClick:m}),v&&e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx(b,{size:"sm",icon:e.jsx(Ue,{}),label:"Cargar en Reproductor",variant:"indigo",alwaysExpanded:!0,onClick:S}),e.jsxs("a",{href:p.downloadUrl||`/api/studio/tts/jobs/${p.id}/download`,download:`wappy-master-${p.id}.wav`,className:"inline-flex items-center gap-1.5 h-8 px-2.5 sm:h-9 sm:px-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-700 dark:text-green-300 text-xs font-bold tracking-wide transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95",children:[e.jsx(ct,{className:"w-3.5 h-3.5 sm:w-4 sm:h-4"}),e.jsx("span",{children:"Descargar WAV Master"})]})]})]})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between text-xs font-medium",children:[e.jsx("span",{className:"text-slate-500 dark:text-slate-400",children:"Progreso general"}),e.jsxs("span",{className:"text-indigo-600 dark:text-indigo-400 font-mono font-bold",children:[p.progressPercent,"%"]})]}),e.jsx("div",{className:"w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800",children:e.jsx("div",{className:h("h-full transition-all duration-300",v?"bg-emerald-500":ee?"bg-rose-500":"bg-gradient-to-r from-indigo-500 to-violet-500"),style:{width:`${Math.min(100,Math.max(0,p.progressPercent))}%`}})})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 mb-2",children:[e.jsxs("span",{className:"text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400",children:["Fragmentos del Audio (",p.completedChunks," / ",p.totalChunks,")"]}),e.jsx("span",{className:"text-[11px] text-slate-500 dark:text-slate-500",children:"Haz clic en un fragmento listo para preescucharlo"})]}),e.jsx("div",{className:"grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-18 gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/90 dark:border-slate-800/80 max-h-36 overflow-y-auto",children:p.chunks.map(L=>{const C=L.status==="completed",ie=L.status==="processing",U=L.status==="failed";return e.jsx("button",{type:"button",disabled:!C,onClick:()=>w(L),title:`Fragmento #${L.index+1}${L.wordCount?` (${L.wordCount} palabras)`:""}${C?` - ${L.durationSeconds||0}s [Haz clic para escuchar]`:""}`,className:h("h-7 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all border",C?"bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/30 cursor-pointer shadow-2xs":ie?"bg-indigo-500/25 text-indigo-700 dark:text-indigo-200 border-indigo-500/50 animate-pulse":U?"bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40":"bg-slate-200/60 dark:bg-slate-800/50 text-slate-500 border-slate-300/60 dark:border-slate-800 opacity-60"),children:C?e.jsx(pt,{className:"w-3.5 h-3.5"}):ie?e.jsx(Q,{className:"w-3.5 h-3.5 animate-spin"}):L.index+1},L.index)})})]}),p.failoverNotice&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2",children:[e.jsx(xa,{className:"w-4 h-4 text-amber-500 shrink-0"}),e.jsxs("span",{children:[e.jsx("strong",{children:"Rotación Automática 429:"})," ",p.failoverNotice]})]}),ee&&p.error&&e.jsxs("div",{className:"p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2",children:[e.jsx(Bt,{className:"w-4 h-4 text-rose-500 shrink-0"}),e.jsx("span",{children:p.error})]})]})}export{ca as ANTIGRAVITY_ART_DIRECTIONS,dt as ANTIGRAVITY_EFFECTS_CATALOG,ci as DEFAULT_SCRIPT_STEPS,Gs as PAUSE_AND_EMPHASIS_TAGS,Hs as WAPPY_GOOGLE_MODELS_ECOSYSTEM,Fi as default};
