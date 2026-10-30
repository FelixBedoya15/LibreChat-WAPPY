import{r as l,j as e}from"./react-core.DnLkJYlj.js";import{e as Fr,b as Br}from"./routing.G8zv3X9f.js";import{e$ as Ha,cj as Ce,hN as Ge,ds as Ft,gx as Bt,dG as K,cH as qs,ct as Ur,h8 as Ee,cK as pa,cM as ua,cl as fa,dn as Yt,cp as ha,eO as Ys,dl as we,bY as Wr,df as Hr,gc as Ve,dI as Gr,f6 as ut,dc as st,d2 as Ks,d8 as Ut,fr as Js,ew as Gt,c2 as xa,dB as mt,ez as Zs,eA as Xs,fP as Qs,dt as qr,ed as qt,hx as wa,cx as ya,ft as Ga,hA as sr,gM as bt,eb as Yr}from"./vendor.CzJpbXtB.js";import{u as Kr,aw as Jr,ao as Zr,c as y,O as Xr,n as Qr,l as d}from"./index.CBS62IcE.js";import"./utilities.CCKZG3yh.js";import"./markdown_highlight.Cj_heSZW.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./locales.DGMWYUix.js";import"./i18n.CdklldLM.js";import"./radix-ui.DRW2V9Hg.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.Cp9qs23f.js";import"./animations.DqJI7FHp.js";import"./virtualization.BVI4Pzi_.js";import"./tanstack-vendor.C1GOL1ZW.js";import"./headlessui.k_MahHec.js";import"./framer-motion.D5TRHXK7.js";import"./http-client.DzuLSb93.js";import"./date-utils.X8D4nCrw.js";import"./forms.PdoLQ5-c.js";import"./security-ui.Bga5GGyP.js";import"./markdown-processing.CxfbaPrv.js";import"./heic-converter.BhQCFQ0l.js";import"./canvas-templates.BS0AxzrQ.js";const ei="wappy-studio-media",ti=1,ka="blobs";let Wt=null;function ai(){return Wt||(Wt=new Promise((m,b)=>{if(typeof indexedDB>"u"){b(new Error("IndexedDB no disponible en este navegador."));return}const p=indexedDB.open(ei,ti);p.onupgradeneeded=()=>{const u=p.result;u.objectStoreNames.contains(ka)||u.createObjectStore(ka)},p.onsuccess=()=>m(p.result),p.onerror=()=>{Wt=null,b(p.error)}}),Wt)}function ja(m,b){return ai().then(p=>new Promise((u,g)=>{const E=p.transaction(ka,m),v=b(E.objectStore(ka));v.onsuccess=()=>u(v.result),v.onerror=()=>g(v.error)}))}async function xt(m,b){await ja("readwrite",p=>p.put(b,m))}async function Nt(m){try{return await ja("readonly",p=>p.get(m))??null}catch{return null}}async function si(m){try{await ja("readwrite",b=>b.delete(m))}catch{}}async function ri(){try{await ja("readwrite",m=>m.clear())}catch{}}function ma(m,b="audio/wav"){const p=m.replace(/^data:[^;]+;base64,/,""),u=window.atob(p),g=new Uint8Array(u.length);for(let E=0;E<u.length;E++)g[E]=u.charCodeAt(E);return new Blob([g],{type:b})}var ii={};const er=[{id:"gemini-3.8-flash",category:"Generación IA & Guiones",badge:"Principal 3.8",description:"Motor principal para generación de escenas HTML/GSAP y enriquecimiento de guiones."},{id:"gemini-3.6-flash",category:"Generación IA & Guiones",badge:"Estable 3.6",description:"Modelo rápido de alta precisión para código HTML5, Tailwind y estructura SST."},{id:"gemini-3.5-flash-lite",category:"Generación IA & Guiones",badge:"Ultra Ligero",description:"Baja latencia para respuestas instantáneas y estructuración rápida."},{id:"gemini-3.8-live",category:"Voz en Tiempo Real (Live)",badge:"Tenshi Live 3.8",description:"Interacción conversacional bidireccional de baja latencia en tiempo real."},{id:"gemini-3.1-flash-live-preview",category:"Voz en Tiempo Real (Live)",badge:"Live Preview 3.1",description:"Respaldo multimodal en vivo para sesiones de voz continua."},{id:"gemini-2.5-flash-native-audio-preview-12-2025",category:"Voz en Tiempo Real (Live)",badge:"Audio Nativo 2.5",description:"Audio nativo multimodal con soporte extendido de herramientas."},{id:"gemini-3.8-flash-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Recomendado (14 voces)",description:"Máxima expresividad, vocal bursts (<breath>, <laugh>) y las 14 voces activas."},{id:"gemini-3.1-flash-tts-preview",category:"Síntesis de Voz (TTS 24kHz)",badge:"Preview 3.1 (14 voces)",description:"Prosodia refinada y soporte completo para las 14 voces preconstruidas."},{id:"gemini-2.5-flash-preview-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Reemplazo 2.5 Pro (5 voces)",description:"Activa las 5 voces fundamentales (Kore, Puck, Charon, Fenrir, Aoede)."},{id:"gemini-3.8-flash-lite-tts",category:"Síntesis de Voz (TTS 24kHz)",badge:"Ultra Rápido (6 voces)",description:"Lecturas masivas de baja latencia con 6 voces optimizadas."}],ba={"gemini-3.8-flash-tts":{id:"gemini-3.8-flash-tts",name:"Gemini 3.8 Flash TTS",badge:"Recomendado / Cuota Activa",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"✓ Activo (14 voces)",description:"Máxima fluidez natural, diseño de voz, vocal bursts (<breath>, <laugh>) y soporte para las 14 voces.",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-3.1-flash-tts-preview":{id:"gemini-3.1-flash-tts-preview",name:"Gemini 3.1 Flash TTS Preview",badge:"Preview 3.1 / Cuota Activa",badgeColor:"bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:"Arquitectura Gemini 3.1 con prosodia refinada, tono expresivo y respuesta ágil (14 voces).",supportsMultiSpeaker:!0,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Orus","Aoede","Leda","Callisto","Europa","Ganymede","Io","Titan","Prometheus"]},"gemini-2.5-flash-preview-tts":{id:"gemini-2.5-flash-preview-tts",name:"Gemini 2.5 Flash TTS",badge:"Reemplazo de 2.5 Pro",badgeColor:"bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",rateLimitLabel:"3 RPM • 10 RPD (2.5 Pro: 0/0)",quotaLabel:"5 voces",description:"Reemplazo oficial y funcional de 2.5 Pro (no disponible en API). Activa únicamente las 5 voces fundamentales.",supportsMultiSpeaker:!0,supportsVocalBursts:!1,supportedVoices:["Kore","Puck","Charon","Fenrir","Aoede"]},"gemini-3.8-flash-lite-tts":{id:"gemini-3.8-flash-lite-tts",name:"Gemini 3.8 Flash-Lite TTS",badge:"Ultra Rápido",badgeColor:"bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",rateLimitLabel:"Baja Latencia",quotaLabel:"6 voces",description:"Optimizado para lecturas masivas con mínima latencia continua (6 voces rápidas).",supportsMultiSpeaker:!1,supportsVocalBursts:!0,supportedVoices:["Kore","Puck","Charon","Fenrir","Zephyr","Aoede"]}},ni=[{id:"Kore",name:"Kore",gender:"Femenino",tone:"Cálida, Serena y Profesional",recommendedFor:"Audiolibros, Narración, Tutoriales, Inducción SST",tag:"Más popular"},{id:"Puck",name:"Puck",gender:"Masculino",tone:"Enérgico, Dinámico y Joven",recommendedFor:"Podcasts, Reels, Contenido Creativo, Diálogos",tag:"Muy expresivo"},{id:"Charon",name:"Charon",gender:"Masculino",tone:"Barítono, Grave, Maduro y Solemne",recommendedFor:"Documentales, Historia, Suspenso, Directivos",tag:"Voz profunda"},{id:"Fenrir",name:"Fenrir",gender:"Masculino",tone:"Claro, Elocuente y Periodístico",recommendedFor:"Noticias, Informes, Presentaciones, Boletines",tag:"Profesional"},{id:"Zephyr",name:"Zephyr",gender:"Femenino",tone:"Dulce, Aterciopelada y Relajante",recommendedFor:"Meditación, ASMR, Cuentos, Bienestar",tag:"Calma"},{id:"Orus",name:"Orus",gender:"Masculino",tone:"Firme, Imperial, Épico y Reflexivo",recommendedFor:"Ficción Épica, Liderazgo, Ensayos, Cultura Vial",tag:"Imperial"},{id:"Aoede",name:"Aoede",gender:"Femenino",tone:"Melódica, Expresiva, Artística y Cálida",recommendedFor:"Poesía, Literatura, Storytelling, Sensibilización",tag:"Melódica"},{id:"Leda",name:"Leda",gender:"Femenino",tone:"Cercana, Maternal, Madura y Envolvente",recommendedFor:"Audiolibros Largos, Relatos, Bienvenida",tag:"Narradora"},{id:"Callisto",name:"Callisto",gender:"Femenino",tone:"Elegante, Sofisticada y Articulada",recommendedFor:"Divulgación Científica, Conferencias, Auditorías",tag:"Sofisticada"},{id:"Europa",name:"Europa",gender:"Femenino",tone:"Brillante, Luminosa, Alegre y Asertiva",recommendedFor:"Marketing, Anuncios, E-Learning, Campañas",tag:"Enérgica"},{id:"Ganymede",name:"Ganymede",gender:"Masculino",tone:"Resonante, Equilibrado, Sabio y Seguro",recommendedFor:"Educación Superior, Cursos, Capacitación Técnica",tag:"Resonante"},{id:"Io",name:"Io",gender:"Femenino",tone:"Vivaz, Espontánea, Fresca y Amigable",recommendedFor:"Redes Sociales, Vlogs, Asistentes, Reels",tag:"Fresca"},{id:"Titan",name:"Titan",gender:"Masculino",tone:"Imponente, Cinematográfico y Potente",recommendedFor:"Tráilers, Introducciones, Impacto, Alertas",tag:"Cinematográfica"},{id:"Prometheus",name:"Prometheus",gender:"Masculino",tone:"Noble, Pensativo, Filosófico y Clásico",recommendedFor:"Filosofía, Análisis Profundo, Crónicas",tag:"Sabio"}],oi=[{id:"orus-solemn",name:"Narración Solemne (Orus)",voiceName:"Orus",style:"Voz firme, templada, reflexiva y madura de narrador de crónica histórica, dicción solemne, pausas medidas y respiraciones naturales.",speed:"0.95x"},{id:"aoede-poetic",name:"Cuento Poético (Aoede)",voiceName:"Aoede",style:"Voz melódica, cálida, expresiva y artística para relato literario y sensibilización, con matices emocionales suaves.",speed:"0.95x"},{id:"titan-trailer",name:"Tráiler Cinematográfico (Titan)",voiceName:"Titan",style:"Voz imponente, profunda, cinematográfica y épica de tráiler de película, con pausas dramáticas e impacto.",speed:"0.95x"},{id:"kore-audiobook",name:"Narrador de Audiolibro (Kore)",voiceName:"Kore",style:"Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido.",speed:"1.0x"},{id:"puck-podcast",name:"Host de Podcast Dinámico (Puck)",voiceName:"Puck",style:"Host de podcast carismático, enérgico, cercano y espontáneo, con entonación conversacional moderna.",speed:"1.05x"},{id:"charon-documentary",name:"Documental Profundo (Charon)",voiceName:"Charon",style:"Tono barítono, solemne, reflexivo y cinematográfico de narrador de documental, con pausas medidas.",speed:"0.95x"},{id:"fenrir-news",name:"Noticiero Profesional (Fenrir)",voiceName:"Fenrir",style:"Periodista claro, objetivo, seguro y elocuente de noticiero central, dicción neutral y fluida.",speed:"1.05x"},{id:"zephyr-asmr",name:"Meditación y ASMR (Zephyr)",voiceName:"Zephyr",style:"Voz suave, serena, dulce y sumamente relajante para meditación guiada, mindfulness y bienestar.",speed:"0.9x"},{id:"screenplay-dialogue",name:"Guion / Diálogo Alex & Sam",voiceName:"Kore",multiSpeaker:!0,speaker1:{name:"Alex",voiceName:"Puck",style:"Entusiasta y curioso"},speaker2:{name:"Sam",voiceName:"Kore",style:"Experta, clara y cercana"},style:"Diálogo interactivo de podcast entre dos especialistas con alternancia natural.",speed:"1.0x"}],li=[{tag:"<breath>",label:"Respiración natural",description:"Inserta una toma de aire orgánica entre frases"},{tag:"<laugh>",label:"Risa / Carcajada",description:"Añade una risa espontánea o carcajada suave"},{tag:"<gasp>",label:"Sorpresa / Jadear",description:"Efecto de inhalación rápida de asombro"},{tag:"<sigh>",label:"Suspiro natural",description:"Añade un suspiro expresivo de reflexión o alivio"},{tag:"|mhm|",label:"Asentimiento (|mhm|)",description:"Confirmación conversacional natural"},{tag:"|yeah|",label:"Aceptación (|yeah|)",description:"Interjección de acuerdo en diálogos"}],di=`Alex: <breath> ¡Bienvenidos a un nuevo episodio de Somos SST Podcast! Hoy hablaremos sobre las cinco reglas de oro para prevenir accidentes graves en planta.

Sam: Así es, Alex. <sigh> Muchas veces creemos que un procedimiento de dos minutos no requiere bloqueo de energías, pero ahí es donde ocurre el noventa por ciento de los incidentes.

Alex: Totalmente de acuerdo, Sam. ¿Cuál dirías que es el primer paso innegociable antes de intervenir cualquier equipo?`,ci=[{id:"podcast-charla-5min",label:"🎙️ Podcast Charla 5 Min",style:"Diálogo dinámico, cercano y motivador de podcast matutino de seguridad industrial entre dos especialistas.",text:`Alex: <breath> ¡Bienvenidos a un nuevo episodio de Somos SST Podcast! Hoy hablaremos sobre las cinco reglas de oro para prevenir accidentes graves en planta.

Sam: Así es, Alex. <sigh> Muchas veces creemos que un procedimiento de dos minutos no requiere bloqueo de energías, pero ahí es donde ocurre el noventa por ciento de los incidentes.

Alex: Totalmente de acuerdo, Sam. ¿Cuál dirías que es el primer paso innegociable antes de intervenir cualquier equipo?

Sam: Primero cortar todas las fuentes de tensión y aplicar bloqueo LOTO con candado personal. <breath> Ninguna urgencia operativa vale más que volver sanos a casa.`},{id:"podcast-investigacion-atel",label:"🔍 Debate Investigación ATEL",style:"Debate técnico, analítico y pedagógico sobre investigación de accidentes laborales bajo Resolución 1401.",text:`Alex: <breath> Hoy en mesa de análisis revisamos un caso crítico de investigación ATEL bajo la Resolución 1401. Sam, ¿por qué seguimos quedándonos en la causa inmediata?

Sam: Excelente pregunta, Alex. <sigh> El error más común es culpar al trabajador diciendo que hubo exceso de confianza, sin usar metodología de árbol de causas o los cinco porqués.

Alex: |mhm| Exacto. Cuando profundizamos encontramos que faltaba mantenimiento preventivo, iluminación adecuada o supervisión efectiva en la tarea crítica.

Sam: |yeah| Investigar no es buscar culpables, sino transformar las causas raíz en controles de ingeniería reales para que jamás se repita. <breath>`},{id:"podcast-entrevista-copasst",label:"🛡️ Entrevista Comité COPASST",style:"Entrevista cálida, participativa y constructiva sobre liderazgo del COPASST e inspecciones en terreno.",text:`Alex: <breath> ¡Hola equipo! Hoy conversamos con Sam sobre cómo convertir al COPASST en un comité vivo en planta y no solo en un acta mensual. <laugh>

Sam: ¡Gracias por la invitación, Alex! |yeah| El secreto está en salir del escritorio: acompañar las inspecciones planeadas y escuchar directamente a los operarios en su puesto de trabajo.

Alex: |mhm| Y cuando un trabajador reporta una condición insegura y ve que el comité gestiona la solución en la misma semana, la cultura preventiva se dispara.

Sam: Sin duda, Alex. <breath> La seguridad la construimos conversando y actuando todos los días en equipo.`}],Ht=[{title:"Inducción SST: 5 Reglas de Oro en Riesgo Eléctrico",text:`¡Atención equipo! Antes de intervenir cualquier tablero o red eléctrica, recuerda que tu vida depende de las Cinco Reglas de Oro. <breath>

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

Tu bienestar mental y físico es la base de un entorno laboral saludable y seguro.`}],pi=[{id:"golden-rules",name:"🔥 Reel WAPPY + Avatar 3D",badge:"Oficial GTC-45",description:"Multi-escena con Avatar 3D lip-sync, Mockup celular, VS y tarjetas sincronizadas con la voz."},{id:"kpi-hud",name:"🚀 Ecosistema + Tenshi IA",badge:"Plataforma 40s",description:"Constelación IA, telemetría 3D en vivo, comparativa VS y tarjeta oráculo Tenshi."},{id:"alert-sst",name:"📜 Expediente & Reglas SST",badge:"Normativo",description:"Visor normativo con resaltador fluorescente, checklist secuencial 1-2-3 y radar."},{id:"camera-overlay",name:"🎬 Lower-Third (Video Propio)",badge:"Transparente",description:"Capas dinámicas por frase en tercio superior e inferior sin tapar tu rostro."}],qe=[{id:"19-cover-2s",label:"19 Portada Magnética (2s)",category:"Sonido & Portada",description:"Miniatura de alto impacto (0.0s-2.0s) con titular gigante e insignias clave."},{id:"felix-voxel-3d",label:"Avatar 3D Lip-Sync",category:"3D & Avatares",description:"Presentador Avatar 3D con gestos y sincronía labial reactiva al audio."},{id:"tenshi-3d",label:"Tenshi 3D",category:"3D & Avatares",description:"Oráculo IA flotante con halo esmeralda/cyan y telemetría reactiva."},{id:"01-orbit",label:"01 Órbita 3D",category:"3D & Avatares",description:"Anillo orbital 3D de insignias e iconos gravitatorios alrededor del concepto central."},{id:"02-frame-break",label:"02 Frame Break",category:"Transiciones Reels",description:"Ruptura de marco con profundidad 3D y desborde fuera de la tarjeta."},{id:"04-digital-zoom",label:"04 Digital Zoom",category:"Transiciones Reels",description:"Acercamiento táctico con retícula HUD y mira de precisión sobre datos críticos."},{id:"05-phone-mockup",label:"05 Mockup iPhone",category:"Elementos SST",description:"Celular 3D con Dynamic Island mostrando alertas y controles SST en vivo."},{id:"07-zoom-through",label:"07 Zoom-Through",category:"Transiciones Reels",description:"Transición inmersiva sin corte atravesando la escena hacia el siguiente punto."},{id:"08-chart-grow",label:"08 Chart Grow",category:"Elementos SST",description:"Barras e indicadores KPI que crecen dinámicamente con rebote spring."},{id:"10-glass-type",label:"10 Cristal 3D",category:"3D & Avatares",description:"Tipografía y tarjetas Glassmorphism con refracción translúcida y borde luminoso."},{id:"11-giro-3d",label:"11 Giro 3D",category:"Transiciones Reels",description:"Rotación en perspectiva Y/X con destello neón al cambiar de escena."},{id:"13-checklist-sst",label:"13 Checklist SST",category:"Elementos SST",description:"Lista secuencial 1-2-3 con verificación animada y sello de cumplimiento."},{id:"17-paper-cut",label:"17 Paper Cut",category:"Transiciones Reels",description:"Recorte editorial en capas con textura y sombra proyectada."},{id:"18-dolly-zoom",label:"18 Dolly Zoom",category:"Transiciones Reels",description:"Efecto vértigo cinematográfico contrayendo el fondo mientras destaca el titular."},{id:"visor-normativo",label:"Visor Normativo Subrayado",category:"Elementos SST",description:"Expediente legal (Decreto 1072 / Res. 0312) con resaltador fluorescente en vivo."},{id:"pentagono-gtc45",label:"Pentágono GTC-45",category:"Elementos SST",description:"Radar pentagonal de peligros y valoración de riesgos GTC-45."},{id:"sfx-pack",label:"SFX Whoosh+Pop+Ding",category:"Sonido & Portada",description:"Diseño sonoro sincronizado: whoosh en transiciones, pop en tarjetas y ding en checks."}],ga=[{id:"dark-tech-hud",label:"Dark Tech HUD",colors:"#0C192E + #00D4FF + #C7F303",description:"Fondo cósmico oscuro con HUD cian, verde lima eléctrico y tarjetas de cristal."},{id:"wappy-lima-oliva",label:"WAPPY Lima & Oliva",colors:"#C7F303 + #0E1300",description:"Identidad oficial wappy.club con alto contraste verde lima y negro oliva."},{id:"crema-editorial-sst",label:"Crema Editorial SST",colors:"#F6F5EF + #0D9488",description:"Estilo documental SST para Dummies con papel cálido, turquesa y subrayado."},{id:"cielo-wappy-cloud",label:"Cielo WAPPY Cloud",colors:"#5BB8F5 → #EAF6FE",description:"Atmósfera luminosa WAPPY Cloud con degradado celeste y tarjetas flotantes."}],qa=[{tag:"[pausa 0.5s]",label:"Pausa 0.5s",desc:"Breve silencio rítmico entre ideas"},{tag:"[pausa 1.0s]",label:"Pausa 1.0s",desc:"Pausa dramática de cambio de escena"},{tag:"[énfasis]",label:"Énfasis Vocal",desc:"Mayor fuerza e intención en la frase"},{tag:"<breath>",label:"Respiración <breath>",desc:"Toma de aire orgánica"},{tag:"<laugh>",label:"Risa <laugh>",desc:"Reacción cercana y carismática"},{tag:"<gasp>",label:"Sorpresa <gasp>",desc:"Inhalación de asombro o alerta"},{tag:"|mhm|",label:"Asentir |mhm|",desc:"Confirmación natural en diálogo"},{tag:"|yeah|",label:"Acuerdo |yeah|",desc:"Expresión dinámica de apoyo"}],ui=[{id:"step-1",timeRange:"0.0s-2.0s",title:"Portada Magnética (2s)",narration:"¡Atención equipo! Tu vida depende de las Cinco Reglas de Oro en riesgo eléctrico. <breath>",visualEffect:"19 Portada Magnética (2s)"},{id:"step-2",timeRange:"2.0s-8.0s",title:"Reglas 1 y 2: Corte Visible y Bloqueo LOTO",narration:"[pausa 0.5s] Primero: Cortar todas las fuentes de tensión. Segundo: Bloquear y etiquetar con tu candado personal LOTO. <breath>",visualEffect:"05 Mockup iPhone"},{id:"step-3",timeRange:"8.0s-16.0s",title:"Reglas 3 y 4: Ausencia de Tensión y Puesta a Tierra",narration:"[pausa 0.5s] Tercero: Verificar ausencia de tensión con detector calibrado. Cuarto: Poner a tierra y en cortocircuito. <breath>",visualEffect:"13 Checklist SST"},{id:"step-4",timeRange:"16.0s-24.0s",title:"Regla 5 y Cierre WAPPY IA",narration:"Y quinto: Delimitar y señalizar la zona de trabajo. En WAPPY IA cuidamos que regreses sano y salvo a casa.",visualEffect:"Avatar 3D Lip-Sync"}];function Ya(m){try{const b=window.AudioContext||window.webkitAudioContext;if(!b)return;const p=new b,u=p.currentTime,g=p.createOscillator(),E=p.createGain();g.connect(E),E.connect(p.destination),m==="whoosh"?(g.type="sine",g.frequency.setValueAtTime(160,u),g.frequency.exponentialRampToValueAtTime(640,u+.14),g.frequency.exponentialRampToValueAtTime(95,u+.32),E.gain.setValueAtTime(.01,u),E.gain.linearRampToValueAtTime(.22,u+.12),E.gain.exponentialRampToValueAtTime(.001,u+.34),g.start(u),g.stop(u+.35)):m==="pop"?(g.type="triangle",g.frequency.setValueAtTime(320,u),g.frequency.exponentialRampToValueAtTime(780,u+.08),E.gain.setValueAtTime(.25,u),E.gain.exponentialRampToValueAtTime(.001,u+.11),g.start(u),g.stop(u+.12)):(g.type="sine",g.frequency.setValueAtTime(880,u),g.frequency.setValueAtTime(1318.5,u+.09),E.gain.setValueAtTime(.22,u),E.gain.exponentialRampToValueAtTime(.001,u+.45),g.start(u),g.stop(u+.46))}catch{}}function Ja(m,b=28){const p=Math.max(4,Number(b)||28),g=String(m||"").replace(/^(Alex|Sam|Hablante\s*\d+|Speaker\s*\d+):\s*/gim,"").trim().split(new RegExp("(?<=[.!?…])\\s+|\\n+|<breath>","gi")).map(N=>N.replace(/<[^>]+>/g,"").replace(/\|[^|]+\|/g,"").trim()).filter(Boolean);g.length===0&&g.push("Prevención inteligente y seguridad en el trabajo con WAPPY IA.");const E=[];for(let N=0;N<g.length;N++){const w=g[N];w.length<18&&N+1<g.length?g[N+1]=`${w} ${g[N+1]}`:E.push(w)}const v=7,$=[];if(E.length<=v)$.push(...E);else{const N=Math.ceil(E.length/v);for(let w=0;w<E.length;w+=N)$.push(E.slice(w,w+N).join(" "))}const be=[],F=[];let D=0;const W=$.map((N,w)=>{const se=N.split(/\s+/).filter(Boolean).map(G=>{const R=G.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9]/g,"").length;let I=Math.max(2,R);return/[,;:]$/.test(G)&&(I+=4),/[.!?…]$/.test(G)&&(I+=9),{word:G,weight:I}});se.length>0&&(se[se.length-1].weight+=7);const je=se.reduce((G,R)=>G+R.weight,0)||10;return D+=je,{text:N,bIdx:w,wList:se,beatWeight:je}}),te=["wave","pointLeft","pointRight","bothUp"],ke=["lime","cyan","amber"];let B=0;for(let N=0;N<W.length;N++){const w=W[N],ae=B/Math.max(1,D),se=(B+w.beatWeight)/Math.max(1,D),je=Number((ae*p).toFixed(2)),G=Number((se*p).toFixed(2)),R=Number(Math.max(.8,G-je).toFixed(2));let I=B;for(const re of w.wList){const Tt=I/Math.max(1,D);I+=re.weight;const rt=I/Math.max(1,D);be.push({word:re.word,startPct:Number(Tt.toFixed(4)),endPct:Number(rt.toFixed(4)),beatIndex:N})}B+=w.beatWeight;const P=w.text.replace(/^[¡!¿?]+/,"").split(/\s+/).filter(Boolean),ie=w.text.indexOf(":");let Z=N===0?"⚡ IMPACTO INICIAL • WAPPY IA":N===W.length-1?"🛡️ CIERRE EJECUTIVO • SOMOS SST":`PUNTO CLAVE 0${N}`;/^(primero|1\b)/i.test(w.text)?Z="⚡ REGLA DE ORO 01":/^(segundo|2\b)/i.test(w.text)?Z="🔒 REGLA DE ORO 02":/^(tercero|3\b)/i.test(w.text)?Z="📡 REGLA DE ORO 03":/^(cuarto|4\b)/i.test(w.text)?Z="🛡️ REGLA DE ORO 04":/^(quinto|5\b)/i.test(w.text)&&(Z="🚨 REGLA DE ORO 05");let ge=P.slice(0,Math.min(5,P.length));if(ie>0&&ie<16){const re=w.text.slice(ie+1).trim().split(/\s+/).filter(Boolean);re.length>=2&&(ge=re.slice(0,Math.min(5,re.length)))}const k=Math.max(1,Math.ceil(ge.length*.55)),j=ge.slice(0,k).join(" ").replace(/[,;:.!?]+$/,""),q=ge.slice(k).join(" ").replace(/[,;:.!?]+$/,"")||"WAPPY IA",T=w.text.toLowerCase();let Se="bolt";/bloqueo|tarjeteo|candado|loto|aislar/.test(T)?Se="lock":/verificar|ausencia|medir|auditor|inspecci|radar|pose|telemetr/.test(T)?Se="radar":/tierra|cortocircuito|protecci|epp|casco|seguridad|prevenci/.test(T)?Se="shield":/señalizar|delimitar|alerta|peligro|error|riesgo/.test(T)?Se="alert":/matriz|gtc|excel|informe|indicador|semana|minuto/.test(T)&&(Se="chart"),F.push({index:N+1,text:w.text,startSec:je,endSec:G,durationSec:R,startPct:Number(ae.toFixed(4)),endPct:Number(se.toFixed(4)),badge:Z,titleLead:j,titleHighlight:q,pillColor:ke[N%ke.length],iconType:Se,gesture:te[N%te.length]})}return{beats:F,wordTimings:be,totalDurationSeconds:p}}function xi(m,b){return m==="lock"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="12" y="28" width="40" height="28" rx="8" fill="${b}" fill-opacity="0.22" stroke="${b}" stroke-width="2.8"/>
      <path d="M20 28V20C20 13.3726 25.3726 8 32 8C38.6274 8 44 13.3726 44 20V28" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="42" r="4" fill="#c7f303"/>
    </svg>`:m==="radar"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <circle cx="32" cy="32" r="24" fill="${b}" fill-opacity="0.16" stroke="${b}" stroke-width="2.5" stroke-dasharray="6 4"/>
      <circle cx="32" cy="32" r="14" stroke="#c7f303" stroke-width="2" stroke-opacity="0.7"/>
      <path d="M32 32L48 18" stroke="#c7f303" stroke-width="3.2" stroke-linecap="round"/>
      <circle cx="32" cy="32" r="4" fill="#c7f303"/>
    </svg>`:m==="shield"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 6L10 15V31C10 45.5 19.4 57.6 32 61C44.6 57.6 54 45.5 54 31V15L32 6Z" fill="${b}" fill-opacity="0.2" stroke="${b}" stroke-width="2.8"/>
      <path d="M22 33L29 40L43 25" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`:m==="alert"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <path d="M32 8L6 54H58L32 8Z" fill="#f59e0b" fill-opacity="0.22" stroke="#f59e0b" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M32 24V38" stroke="#c7f303" stroke-width="3.6" stroke-linecap="round"/>
      <circle cx="32" cy="46" r="2.8" fill="#c7f303"/>
    </svg>`:m==="chart"?`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
      <rect x="10" y="34" width="10" height="20" rx="3" fill="${b}" fill-opacity="0.35" stroke="${b}" stroke-width="2"/>
      <rect x="27" y="22" width="10" height="32" rx="3" fill="${b}" fill-opacity="0.55" stroke="${b}" stroke-width="2"/>
      <rect x="44" y="12" width="10" height="42" rx="3" fill="#c7f303" fill-opacity="0.85" stroke="#c7f303" stroke-width="2"/>
    </svg>`:`<svg viewBox="0 0 64 64" class="w-11 h-11 shrink-0" fill="none">
    <circle cx="32" cy="32" r="25" fill="${b}" fill-opacity="0.16" stroke="${b}" stroke-width="2"/>
    <path d="M35 8L14 35H31L28 56L50 28H33L35 8Z" fill="#c7f303" stroke="#c7f303" stroke-width="2" stroke-linejoin="round"/>
  </svg>`}function tr({aspectRatio:m="9:16",hasBaseVideo:b=!1,badgeText:p="ECOSISTEMA IA • SG-SST",headline:u="5 Reglas de Oro en Seguridad",subheadline:g="Prevención inteligente en tiempo real con WAPPY Studio",accentColor:E="#14b8a6",templateId:v="golden-rules",scriptText:$="",durationSeconds:be=28}){var G,R,I;const F=m==="9:16",D=(p||"ECOSISTEMA IA • SG-SST").replace(/</g,"&lt;"),W=(u||"Prevención Inteligente WAPPY IA").replace(/</g,"&lt;"),te=(g||"Sincronización neural en vivo").replace(/</g,"&lt;"),ke=b||v==="camera-overlay",B=($||"").trim()||`${W}. ${te}. Primero: Identifica y controla los peligros críticos en terreno. Segundo: Verifica cada protocolo con inteligencia artificial. Tercero: Protege la vida de tu equipo con WAPPY IA.`,N=Ja(B,be),w=N.beats,ae=P=>P==="cyan"?"background:linear-gradient(135deg,#06b6d4,#14b8a6);color:#041318;box-shadow:0 0 22px rgba(6,182,212,0.45);":P==="amber"?"background:linear-gradient(135deg,#f97316,#f59e0b);color:#180902;box-shadow:0 0 22px rgba(245,158,11,0.45);":"background:#c7f303;color:#0a1103;box-shadow:0 0 24px rgba(199,243,3,0.5);",se=w.map((P,ie)=>{const Z=ie===0,ge=ie===w.length-1,k=P.text.replace(/</g,"&lt;"),j=(Z&&u?W.split(/\s+/).slice(0,3).join(" "):P.titleLead).replace(/</g,"&lt;"),q=(Z&&u&&u.split(/\s+/).length>3?u.split(/\s+/).slice(3).join(" "):P.titleHighlight).replace(/</g,"&lt;"),T=xi(P.iconType,E);return v==="camera-overlay"?`
        <div id="scene-${P.index}" class="scene-layer ${Z?"":"opacity-0 pointer-events-none"} absolute inset-x-0 bottom-2 flex flex-col justify-end">
          <div data-editable="true" class="sc-card glass-card rounded-2xl p-3.5 sm:p-4 border-l-4" style="border-left-color:#c7f303;">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-[10px] font-mono uppercase tracking-widest text-[#c7f303] font-extrabold">${P.badge}</span>
              <span class="text-[10px] font-mono text-teal-300 font-bold">ESCENA 0${P.index}/0${w.length}</span>
            </div>
            <div class="flex items-center gap-3">
              ${T}
              <div>
                <h2 class="text-base sm:text-lg font-black text-white leading-tight font-display">
                  ${j} <span class="inline-block px-2 py-0.5 rounded-lg" style="${ae(P.pillColor)}">${q}</span>
                </h2>
                <p class="text-xs text-slate-200 mt-1 leading-snug">${k}</p>
              </div>
            </div>
          </div>
        </div>`:Z?`
        <div id="scene-1" class="scene-layer absolute inset-0 flex flex-col justify-center gap-2.5 sm:gap-3">
          <div data-editable="true" class="sc-head text-center space-y-1.5">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span class="w-2 h-2 rounded-full bg-[#c7f303] animate-ping"></span>
              <span>${P.badge}</span>
            </div>
            <h1 class="${F?"text-2xl sm:text-3xl":"text-xl sm:text-2xl"} font-black tracking-tight text-white leading-none font-display">
              ${j} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${ae("amber")}">${q}</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-200 font-semibold max-w-md mx-auto leading-snug">${k}</p>
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
                  <div class="text-xs sm:text-sm font-black text-white truncate">Estándar Verificado ${D}</div>
                  <div class="text-[11px] text-emerald-200/95 leading-tight">${te}</div>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-[#c7f303] text-[#091004] text-[9px] font-mono font-black shrink-0">100% SEGURO</span>
            </div>
          </div>
        </div>`:ie===1&&w.length>=3?`
        <div id="scene-${P.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>• ${P.badge}</span>
            </div>
            <h2 class="${F?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black text-white leading-tight font-display">
              ${j} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${ae("cyan")}">${q}</span>
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
                  <div class="text-xs font-black text-white leading-tight mt-0.5">${j} ${q}</div>
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
                <p class="text-xs font-bold text-white leading-snug">${k}</p>
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
        </div>`:ge&&w.length>=2?`
        <div id="scene-${P.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
          <div data-editable="true" class="sc-head text-center space-y-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#c7f303]/20 border border-[#c7f303]/50 text-[#c7f303] text-[10px] font-mono font-extrabold uppercase tracking-widest">
              <span>${P.badge}</span>
            </div>
            <h2 class="${F?"text-2xl sm:text-3xl":"text-xl sm:text-2xl"} font-black text-white leading-none font-display">
              ${j} <span class="inline-block px-2.5 py-0.5 rounded-xl mt-0.5" style="${ae("lime")}">${q}</span>
            </h2>
          </div>

          <div data-editable="true" class="sc-item glass-card rounded-3xl p-4 border-2 border-[#c7f303]/60 text-center space-y-2.5" style="box-shadow:0 0 35px rgba(199,243,3,0.18);">
            <div class="flex justify-center">${T}</div>
            <p class="text-xs sm:text-sm font-extrabold text-white leading-relaxed">${k}</p>
            <div class="pt-1 flex flex-wrap items-center justify-center gap-2">
              <span class="px-3 py-1 rounded-xl bg-[#c7f303] text-[#091004] text-[10px] font-black uppercase tracking-wider">⚡ WAPPY IA • SOMOS SST</span>
              <span class="px-3 py-1 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-mono font-bold">✓ CERO ACCIDENTES</span>
            </div>
          </div>
        </div>`:`
      <div id="scene-${P.index}" class="scene-layer opacity-0 pointer-events-none absolute inset-0 flex flex-col justify-center gap-2.5">
        <div data-editable="true" class="sc-head text-center space-y-1">
          <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-500/15 border border-teal-400/40 text-teal-300 text-[10px] font-mono font-extrabold uppercase tracking-widest">
            <span>• ${P.badge} • PASO 0${P.index}</span>
          </div>
          <h2 class="${F?"text-xl sm:text-2xl":"text-lg sm:text-xl"} font-black text-white leading-tight font-display">
            ${j} <span class="inline-block px-2.5 py-0.5 rounded-xl" style="${ae(P.pillColor)}">${q}</span>
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
              <p class="text-xs sm:text-sm font-bold text-white leading-relaxed">${k}</p>
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
`),je=ke?"":v==="kpi-hud"?`
      <!-- TARJETA INFERIOR ORÁCULO TENSHI IA (Estilo WAPPY_IA_Plataforma_40s) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${F?"max-w-md":"max-w-2xl"} mx-auto glass-card rounded-2xl p-2.5 px-3.5 border border-teal-400/35 flex items-center gap-3 shrink-0">
        <div class="relative w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-teal-500/30 to-emerald-500/20 border border-[#c7f303]/60 shrink-0 flex items-center justify-center">
          <img src="/assets/wappy/tenshi.png" alt="Tenshi IA" class="w-full h-full object-cover" onerror="this.style.display='none'" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-mono font-extrabold uppercase tracking-wider text-teal-300">TENSHI • ORIENTADOR Y ORQUESTADOR SST</span>
            <span class="text-[9px] font-mono text-[#c7f303] font-bold">EN VIVO</span>
          </div>
          <p id="host-live-caption" class="text-xs font-bold text-white truncate mt-0.5">${((G=w[0])==null?void 0:G.text.replace(/</g,"&lt;"))||te}</p>
        </div>
      </div>`:`
      <!-- PRESENTADOR FÉLIX 3D VOXEL CON LIP-SYNC Y GESTOS (Estilo Reel Matriz GTC-45 Oficial) -->
      <div id="host-stage" data-editable="true" class="relative z-10 w-full ${F?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-center gap-3 shrink-0">
        <canvas id="wappy-felix-voxel" width="150" height="126" class="${F?"w-[122px] h-[102px]":"w-[96px] h-[80px]"} shrink-0 drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"></canvas>
        <div class="glass-card rounded-2xl p-2.5 px-3 border border-[#c7f303]/40 flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1.5 mb-0.5">
            <span id="host-live-badge" class="text-[9px] font-mono font-black uppercase tracking-wider text-[#c7f303]">${((R=w[0])==null?void 0:R.badge)||"WAPPY IA • SOMOS SST"}</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          </div>
          <p id="host-live-caption" class="text-[11px] font-bold text-slate-100 line-clamp-2 leading-snug">${((I=w[0])==null?void 0:I.text.replace(/</g,"&lt;"))||te}</p>
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
      background: ${ke?"transparent":"#050c12"};
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
<body class="relative w-full h-full flex flex-col justify-between items-center ${F?"p-3.5 sm:p-4":"p-3.5 sm:p-5"} select-none overflow-hidden">
  <!-- Barra superior de progreso Verde Lima WAPPY -->
  <div class="absolute top-0 left-0 right-0 h-1 bg-slate-900/80 z-30 overflow-hidden">
    <div id="wappy-top-progress" class="h-full bg-gradient-to-r from-[#c7f303] via-[#14b8a6] to-[#06b6d4]" style="width: 8%;"></div>
  </div>

  ${ke?"<!-- Fondo transparente para video base del usuario -->":`<div class="absolute inset-0 overflow-hidden pointer-events-none">
           <div class="absolute inset-0 grid-bg"></div>
           <canvas id="wappy-bg-canvas" class="absolute inset-0 w-full h-full opacity-75"></canvas>
           <div id="orb-1" class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl opacity-30" style="background: ${E};"></div>
           <div id="orb-2" class="absolute bottom-8 -right-16 w-72 h-72 rounded-full blur-3xl opacity-25" style="background: #c7f303;"></div>
         </div>`}

  <!-- TOP HUD TÁCTICO WAPPY (Ecualizador + Insignia + Radar Holográfico) -->
  <div id="header-hud" data-editable="true" class="relative z-10 w-full ${F?"max-w-md":"max-w-2xl"} mx-auto flex items-center justify-between gap-1.5 shrink-0 pt-1">
    <div class="glass-card px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 min-w-0 max-w-[62%] border border-teal-500/30">
      <div class="flex items-end gap-0.5 h-3 shrink-0" id="hud-eq">
        <span class="eq-bar w-1 bg-cyan-400 rounded-full" style="height:60%"></span>
        <span class="eq-bar w-1 bg-[#c7f303] rounded-full" style="height:100%"></span>
        <span class="eq-bar w-1 bg-teal-400 rounded-full" style="height:45%"></span>
        <span class="eq-bar w-1 bg-cyan-300 rounded-full" style="height:80%"></span>
      </div>
      <span class="text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase text-teal-300 truncate">${D}</span>
    </div>

    <div class="flex items-center gap-1.5 shrink-0">
      <div class="glass-card px-2 py-1 rounded-full inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-[#c7f303] border border-[#c7f303]/35">
        <span class="w-1.5 h-1.5 rounded-full bg-[#c7f303] animate-pulse shrink-0"></span>
        <span>WAPPY.CLUB</span>
      </div>
      <svg viewBox="0 0 36 36" class="w-7 h-7 shrink-0">
        <circle cx="18" cy="18" r="16" fill="rgba(8,18,28,0.85)" stroke="rgba(20,184,166,0.45)" stroke-width="1.2" stroke-dasharray="3 2"/>
        <circle cx="18" cy="18" r="10" fill="none" stroke="rgba(199,243,3,0.3)" stroke-width="1"/>
        <line x1="18" y1="18" x2="31" y2="10" stroke="#c7f303" stroke-width="1.8" stroke-linecap="round" class="radar-sweep"/>
        <circle cx="18" cy="18" r="2" fill="#c7f303"/>
      </svg>
    </div>
  </div>

  <!-- ESCENARIO MULTI-ESCENA SINCRONIZADO FRASE A FRASE CON LA VOZ -->
  <div id="scenes-wrapper" class="relative z-10 my-auto w-full ${F?"max-w-md min-h-[270px]":"max-w-2xl min-h-[210px]"} mx-auto flex-1 flex flex-col justify-center">
    ${se}
  </div>

  ${je}

  <!-- ESPACIO INFERIOR RESERVADO PARA SUBTÍTULOS DINÁMICOS -->
  <div class="relative z-10 ${F?"h-12":"h-10"} shrink-0 w-full"></div>

  <script>
    window.__wappyTimelineBeats = ${JSON.stringify(w)};
    window.__wappyWordTimings = ${JSON.stringify(N.wordTimings)};
    window.__wappyVoicePlaying = true;
    window.__wappyCurrentGesture = 'wave';

    (function() {
      var beats = window.__wappyTimelineBeats || [];
      var totalDur = ${N.totalDurationSeconds};
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
</html>`}function mi(m){if(!m)return"";if(m.includes('id="wappy-studio-runtime-bridge"'))return m;const b=`<script id="wappy-studio-gsap-hook">
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
<\/script>`;let u=m.replace(/subtitles\.reverse\(\)/g,"subtitles.slice().reverse()");return u.includes("<head>")?u=u.replace("<head>",`<head>
${b}`):u=`${b}
${u}`,u.includes("</body>")?u=u.replace("</body>",`${p}
</body>`):u=`${u}
${p}`,u}const Ka="wappy_studio_audio_library",va="wappy_gemini_api_keys";function Za(){try{const m=localStorage.getItem(va);if(!m)return[];let b;try{b=JSON.parse(m)}catch{b=m.split(",")}return typeof b=="string"&&(b=b.split(",")),Array.isArray(b)?b.map((p,u)=>typeof p=="string"?{key:p.trim(),label:`Clave #${u+1}`,status:"unchecked"}:p&&typeof p.key=="string"?{key:p.key.trim(),label:p.label||`Clave #${u+1}`,status:p.status||"unchecked"}:null).filter(p=>!!(p&&p.key)):[]}catch{return[]}}function H(m){const b=m||localStorage.getItem("token")||"",p=Za().map(u=>u.key.trim()).filter(u=>u.length>15).join(",");return{"Content-Type":"application/json",...b?{Authorization:`Bearer ${b}`}:{},...p?{"x-gemini-api-keys":p}:{}}}async function ve(m){const b=await m.text();try{return JSON.parse(b)}catch{throw m.status===401||b.trim()==="Unauthorized"?new Error("Tu sesión está actualizándose. Intenta nuevamente en un segundo."):new Error(b.slice(0,180)||`Error del servidor (${m.status})`)}}function bi(m){const b=Math.max(1,Math.round(m||0)),p=Math.floor(b/60),u=b%60;return`${p}m ${u}s`}function gi(m){try{return new Date(m).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch{return""}}function Ki({standalone:m=!1,portable:b=!1,podcastOnly:p=!1}={}){var Ws;const{user:u,token:g,isAuthenticated:E}=Kr(),{data:v}=Jr(),$=Fr(),be=($==null?void 0:$.navVisible)??!0,F=($==null?void 0:$.setNavVisible)??(()=>{}),[D,W]=Br(),te=D.get("tab")||"tts",ke=p&&te==="video"?"tts":["tts","video","lab","library"].includes(te)?te:"tts",[B,N]=l.useState(ke),[w,ae]=l.useState(()=>{var t,a;return((a=(t=u==null?void 0:u.personalization)==null?void 0:t.geminiModels)==null?void 0:a.sstManagement)||(ii.GOOGLE_MODELS||"gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite").split(",")[0].trim()||"gemini-3.8-flash"}),[se,je]=l.useState(!1),[G,R]=l.useState("antigravity"),[I,P]=l.useState(()=>{try{return localStorage.getItem("wappy_antigravity_bridge_key")||""}catch{return""}}),[ie,Z]=l.useState(!1),[ge,k]=l.useState(null),[j,q]=l.useState(()=>Object.values(ba)),[T,Se]=l.useState(()=>ni),[re,Tt]=l.useState(()=>oi),[rt,rr]=l.useState(()=>li),[ee,Oe]=l.useState("gemini-3.8-flash-tts"),[S,gt]=l.useState("Kore"),[$e,Ct]=l.useState(p?"Diálogo interactivo de podcast entre dos especialistas con alternancia natural.":"Voz cálida, serena, clara y envolvente de narradora profesional de audiolibros y cursos formativos, con ritmo fluido."),[ne,Et]=l.useState(!!p),[_e,Xa]=l.useState("Puck"),[Fe,Qa]=l.useState("Kore"),[Be,es]=l.useState(150),[C,Ie]=l.useState(p?di:Ht[0].text),[At,ir]=l.useState("Voz expresiva, tono conversacional y alegre."),[ze,Sa]=l.useState("Hola. Hoy quiero demostrarte cómo suena una respiración natural <breath> y cómo reacciono con una pequeña risa <laugh> cuando algo resulta verdaderamente sorprendente."),[Na,ts]=l.useState(!1),[nr,as]=l.useState(null),[Ta,or]=l.useState(0),[lr,dr]=l.useState(0),[Kt,Jt]=l.useState(.5),[Pt,Zt]=l.useState(1),[Ca,ss]=l.useState(!1),[rs,is]=l.useState(!1),[Ea,ns]=l.useState(null),[oe,Ae]=l.useState(null),Mt=l.useRef(null),[Xt,cr]=l.useState("all"),[Qt,os]=l.useState("only_active"),[Aa,pr]=l.useState(""),[Pa,ur]=l.useState(!0),[c,ce]=l.useState(null),[Pe,ft]=l.useState(()=>{try{const t=localStorage.getItem(Ka);return t?JSON.parse(t):[]}catch{return[]}}),[M,Ma]=l.useState("9:16"),[it,xr]=l.useState("golden-rules"),[Ye,ls]=l.useState("bottom"),[ds,cs]=l.useState(!1),[X,ps]=l.useState(null),[us,xs]=l.useState(""),[zt,mr]=l.useState(!1),[nt,ms]=l.useState(null),[za,bs]=l.useState(""),[fe,gs]=l.useState(!0),[It,br]=l.useState("CÁPSULA INTERACTIVA WAPPY"),[Ke,gr]=l.useState("5 Reglas de Oro en Riesgo Eléctrico"),[ea,yi]=l.useState("Prevención inteligente y locución neural sincronizada"),[Lt,fr]=l.useState("#14b8a6"),[Le,fs]=l.useState("dark-tech-hud"),[pe,Ia]=l.useState(["19-cover-2s","felix-voxel-3d","05-phone-mockup","07-zoom-through","13-checklist-sst","sfx-pack"]),[he,Ue]=l.useState(()=>ui),[vi,wi]=l.useState(!0),[Je,ta]=l.useState("style"),[ht,hs]=l.useState(!1),[ot,aa]=l.useState("Crea una animación cinematográfica con el Motor Antigravity 60-FPS y tarjetas de cristal WAPPY IA sobre las 5 reglas de oro de riesgo eléctrico, con Portada Magnética (2s), Avatar 3D lip-sync, iconos luminosos y barras de progreso."),[Dt,ys]=l.useState(!1),[Rt,vs]=l.useState(""),[sa,ws]=l.useState(!1),[La,hr]=l.useState(p?"audio":"all"),[ki,ji]=l.useState(!1),[Ze,We]=l.useState(()=>tr({aspectRatio:"9:16",hasBaseVideo:!1,badgeText:"ECOSISTEMA IA • SG-SST",headline:"5 Reglas de Oro en Riesgo Eléctrico",subheadline:"Prevención inteligente y locución neural sincronizada",accentColor:"#14b8a6",templateId:"golden-rules",scriptText:Ht[0].text,durationSeconds:28})),[De,Re]=l.useState(!0),[lt,Me]=l.useState(0),[V,dt]=l.useState(20),[Da,yr]=l.useState(!1),[ue,ra]=l.useState(!1),[ye,Ra]=l.useState(null),xe=l.useRef(""),[yt,ks]=l.useState(!1),[Vt,ia]=l.useState(!1),[vt,h]=l.useState(null),[vr,Xe]=l.useState(!1),[na,oa]=l.useState(()=>{const t=Za();return[t[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},t[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},t[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}]}),[Va,js]=l.useState(!1),[Ss,ct]=l.useState(""),Qe=l.useMemo(()=>na.filter(t=>t.key.trim().length>15).length,[na]);l.useEffect(()=>{const t=()=>{const s=Za();oa([s[0]||{key:"",label:"Clave Principal #1",status:"unchecked"},s[1]||{key:"",label:"Clave Respaldo #2",status:"unchecked"},s[2]||{key:"",label:"Clave Respaldo #3",status:"unchecked"}])},a=s=>{s.key===va&&t()};return window.addEventListener("wappy-keys-updated",t),window.addEventListener("storage",a),()=>{window.removeEventListener("wappy-keys-updated",t),window.removeEventListener("storage",a)}},[]);const wr=async()=>{js(!0),ct("");try{const t=[...na];let a=0;for(let r=0;r<t.length;r++){const n=t[r].key.trim();if(!n){t[r]={...t[r],key:"",status:"unchecked"};continue}try{const i=await fetch("/api/studio/keys-validate",{method:"POST",headers:H(g),body:JSON.stringify({apiKey:n})}),o=await i.json().catch(()=>({}));i.ok&&o.valid?(t[r]={...t[r],key:n,status:"valid"},a++):t[r]={...t[r],key:n,status:"invalid"}}catch{t[r]={...t[r],key:n,status:"unchecked"}}}oa(t);const s=t.filter(r=>r.key.trim().length>0);localStorage.setItem(va,JSON.stringify(s)),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),ct(s.length===0?"Claves personalizadas limpiadas. Se utilizarán las claves del servidor WAPPY.":`¡Guardadas ${s.length} clave(s) (${a} verificada(s) en vivo con Google Gemini)!`)}finally{js(!1)}},z=l.useRef(null),me=l.useRef(null),le=l.useRef(null),Ns=l.useRef(null),kr=l.useMemo(()=>mi(Ze),[Ze]);l.useEffect(()=>{const t=()=>{const a=!!document.fullscreenElement;yr(a),setTimeout(()=>{var s,r;(r=(s=z.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},80),setTimeout(()=>{var s,r;(r=(s=z.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*")},300)};return document.addEventListener("fullscreenchange",t),()=>document.removeEventListener("fullscreenchange",t)},[]),l.useEffect(()=>{const t=a=>{const s=a.data||{};s.type==="STUDIO_ELEMENT_SELECTED"?Ra(s.payload||null):s.type==="STUDIO_HTML_UPDATED"&&typeof s.htmlCode=="string"&&(xe.current=s.htmlCode)};return window.addEventListener("message",t),()=>window.removeEventListener("message",t)},[]),l.useEffect(()=>{const t=Pe.slice(0,60);try{localStorage.setItem(Ka,JSON.stringify(t))}catch{try{localStorage.setItem(Ka,JSON.stringify(t.map(({audioBase64:a,...s})=>s)))}catch{}}},[Pe]),l.useEffect(()=>{const t=Pe.filter(a=>a.audioBase64&&!a.mediaKey);t.length!==0&&(async()=>{const a={};for(const s of t)try{const r=`audio-${s.id}`;await xt(r,ma(s.audioBase64)),a[s.id]=r}catch{}Object.keys(a).length!==0&&ft(s=>s.map(r=>a[r.id]?{...r,mediaKey:a[r.id],audioBase64:void 0}:r))})()},[]);const Oa=l.useRef(null),Ts=t=>{Oa.current&&URL.revokeObjectURL(Oa.current);const a=URL.createObjectURL(t);return Oa.current=a,a},la=async(t,a)=>{const s=`audio-${t.id}`;let r=null;try{if(a.base64)r=ma(a.base64);else if(a.url){const i=await fetch(a.url,{headers:H(g)});i.ok&&(r=await i.blob())}r&&await xt(s,r)}catch{r=null}const n=r?{...t,kind:t.kind||"audio",mediaKey:s,audioBase64:void 0}:{...t,kind:t.kind||"audio",audioBase64:a.base64};return ft(i=>[n,...i.filter(o=>o.id!==t.id)]),r?s:void 0},Cs=async t=>{if(t.mediaKey){const a=await Nt(t.mediaKey);if(a)return a}if(t.audioBase64)return ma(t.audioBase64);if(t.downloadUrl)try{const a=await fetch(t.downloadUrl,{headers:H(g)});if(a.ok){const s=await a.blob(),r=`audio-${t.id}`;return xt(r,s).then(()=>ft(n=>n.map(i=>i.id===t.id?{...i,mediaKey:r}:i))).catch(()=>{}),s}}catch{}return null},Es=async(t,a=!1)=>{const s=await Cs(t);return s?(ce({url:Ts(s),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey||`audio-${t.id}`}),t.durationSeconds&&t.durationSeconds>1&&dt(t.durationSeconds),a&&Ne("video"),!0):(h({type:"error",text:"Este audio se generó antes de activar el guardado permanente y el servidor ya lo liberó (se reinició). Vuelve a generarlo: desde ahora todos los audios quedan guardados en tu navegador."}),!1)},wt=(t,a)=>{const s=URL.createObjectURL(t),r=document.createElement("a");r.href=s,r.download=a,document.body.appendChild(r),r.click(),document.body.removeChild(r),setTimeout(()=>URL.revokeObjectURL(s),4e3)},jr=t=>{ft(a=>{const s=a.filter(n=>n.id!==t.id);return[t.mediaKey,t.htmlKey,t.mp4Key,t.capsuleKey].filter(Boolean).forEach(n=>{s.some(o=>[o.mediaKey,o.htmlKey,o.mp4Key,o.capsuleKey].includes(n))||si(n)}),s})};l.useEffect(()=>{var a;const t=(a=v==null?void 0:v[Zr.google])==null?void 0:a.models;if(Array.isArray(t)&&t.length>0){const s=t.map(r=>(typeof r=="string"?r:(r==null?void 0:r.id)||(r==null?void 0:r.value)||"").replace("models/","").trim()).filter(r=>r&&r.includes("tts"));s.length>0&&q(r=>{const n=new Map(r.map(x=>[x.id,x])),i=Object.keys(ba);return Array.from(new Set([...i,...s])).map(x=>ba[x]||n.get(x)||{id:x,name:x,badge:"GOOGLE_MODELS",badgeColor:"bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",rateLimitLabel:"3 RPM • 10 RPD",quotaLabel:"14 voces",description:`Modelo TTS cargado desde GOOGLE_MODELS (${x}).`,supportsMultiSpeaker:!x.includes("lite"),supportsVocalBursts:!x.includes("2.5"),supportedVoices:ba["gemini-3.8-flash-tts"].supportedVoices})})}},[v]),l.useEffect(()=>{fetch("/api/studio/catalog",{headers:H(g)}).then(t=>t.ok?t.json():null).then(t=>{t&&(Array.isArray(t.models)&&t.models.length>0&&q(t.models),Array.isArray(t.voices)&&t.voices.length>0&&Se(t.voices),Array.isArray(t.presets)&&t.presets.length>0&&Tt(t.presets),Array.isArray(t.vocalBursts)&&t.vocalBursts.length>0&&rr(t.vocalBursts))}).catch(()=>{})},[g]),l.useEffect(()=>{const t=C.trim(),a=t?t.split(/\s+/).filter(Boolean).length:0;if(or(a),dr(t.length),!t){Jt(0),Zt(0);return}const s=setTimeout(()=>{fetch("/api/studio/tts/estimate",{method:"POST",headers:H(g),body:JSON.stringify({text:t,maxWordsPerChunk:Be})}).then(r=>r.ok?r.json():null).then(r=>{r&&typeof r.estimatedMinutes=="number"?Jt(r.estimatedMinutes):Jt(Math.round(a/145*10)/10),r&&typeof r.chunkCount=="number"?Zt(r.chunkCount):Zt(Math.max(1,Math.ceil(a/Be)))}).catch(()=>{Jt(Math.round(a/145*10)/10),Zt(Math.max(1,Math.ceil(a/Be)))})},250);return()=>clearTimeout(s)},[C,Be,g]);const Ne=t=>{const a=p&&t==="video"?"tts":t;N(a),W({tab:a})};l.useEffect(()=>{p&&B==="video"&&N("tts")},[p,B]),l.useEffect(()=>{const t=a=>{const s=a.detail;["tts","video","lab","library"].includes(s)&&Ne(s)};return window.addEventListener("wappy-studio-switch-tab",t),()=>window.removeEventListener("wappy-studio-switch-tab",t)},[p]);const U=l.useMemo(()=>j.find(t=>t.id===ee)||j[0],[j,ee]),kt=t=>U!=null&&U.supportedVoices?U.supportedVoices.includes(t):!0,Sr=l.useMemo(()=>T.filter(t=>{const a=kt(t.id),s=Qt==="all"||a,r=Xt==="all"||t.gender===Xt,n=Aa.trim().toLowerCase(),i=!n||t.name.toLowerCase().includes(n)||t.tone.toLowerCase().includes(n)||t.recommendedFor.toLowerCase().includes(n)||t.tag&&t.tag.toLowerCase().includes(n);return s&&r&&i}),[T,U,Qt,Xt,Aa]),As=async(t,a)=>{a==null||a.stopPropagation();try{ns(t);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(g),body:JSON.stringify({voiceName:t,model:kt(t)?ee:"gemini-3.8-flash-tts",text:`Hola, soy ${t}. Esta es una muestra de voz neural en WAPPY Studio para tus cápsulas y cursos.`})}),r=await ve(s);if(!s.ok||!r.success)throw new Error(r.error||"No se pudo sintetizar la muestra.");ce({base64:r.audioBase64,title:`Muestra de Voz: ${t}`,durationSeconds:r.durationSeconds,voiceName:t})}catch(s){h({type:"error",text:s.message||"Error en audición de voz."})}finally{ns(null)}},Nr=async()=>{try{is(!0),h(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(g),body:JSON.stringify({voiceName:S,model:ee,text:"¡Conexión verificada con éxito! El motor de voz Gemini 3.8 Flash TTS en WAPPY Studio está listo."})}),a=await ve(t);if(!t.ok||!a.success)throw new Error(a.error||"Error probando conexión.");ce({base64:a.audioBase64,title:`Prueba de Conexión (${S})`,durationSeconds:a.durationSeconds,voiceName:S}),h({type:"success",text:`¡Conexión activa con ${a.usedModel||ee}! Audio sintetizado correctamente.`})}catch(t){h({type:"error",text:t.message||"Error de conexión con Gemini TTS."})}finally{is(!1)}},Tr=async()=>{if(!C.trim())return;const t=C.trim().slice(0,850),a=t.split(/\s+/).filter(Boolean).length,s=Math.max(3,Math.round(a/145*60)),r=`preview_${Date.now()}`;try{ss(!0),h(null),Ae({id:r,status:"processing",totalChunks:1,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:s,generatedTotalSeconds:0,progressPercent:0,chunks:[{index:0,wordCount:a,status:"processing"}]});const n=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(g),body:JSON.stringify({text:t,voiceName:S,stylePrompt:$e,model:ee,multiSpeaker:ne,speaker1:{name:"Alex",voiceName:_e},speaker2:{name:"Sam",voiceName:Fe}})}),i=await ve(n);if(!n.ok||!i.success)throw new Error(i.error||"Error al sintetizar vista previa.");const o=`data:audio/wav;base64,${i.audioBase64}`;Ae({id:r,status:"completed",totalChunks:1,currentChunkIndex:0,completedChunks:1,estimatedTotalSeconds:s,generatedTotalSeconds:i.durationSeconds||s,progressPercent:100,downloadUrl:o,chunks:[{index:0,wordCount:a,status:"completed",durationSeconds:i.durationSeconds,audioBase64:i.audioBase64}]}),ce({base64:i.audioBase64,title:`Audio Completo: ${t.slice(0,42)}...`,durationSeconds:i.durationSeconds,voiceName:ne?`${_e} + ${Fe}`:S,scriptText:t});const x={id:Date.now().toString(),title:`Vista Previa: ${t.slice(0,42)}...`,createdAt:Date.now(),voiceName:ne?`${_e} + ${Fe}`:S,model:i.usedModel||ee,durationSeconds:i.durationSeconds,wordCount:a,stylePrompt:$e,scriptText:t},f=await la(x,{base64:i.audioBase64});f&&ce(A=>A&&{...A,mediaKey:f}),h({type:"success",text:p?"Audio de podcast generado y cargado en el reproductor. Puedes escucharlo o descargarlo en WAV 24kHz.":"Audio generado y cargado en el reproductor. Puedes descargarlo en WAV o enviarlo al Compositor de Video."})}catch(n){Ae(i=>i?{...i,status:"failed",error:n.message||"Error sintetizando fragmento."}:null),h({type:"error",text:n.message||"Error sintetizando fragmento."})}finally{ss(!1)}},Cr=async()=>{if(ze.trim())try{ts(!0),h(null);const t=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(g),body:JSON.stringify({text:ze.trim(),voiceName:S,stylePrompt:At,model:ee})}),a=await ve(t);if(!t.ok||!a.success)throw new Error(a.error||"Error al sintetizar en el laboratorio.");ce({base64:a.audioBase64,title:`Laboratorio (${S}): ${ze.trim().slice(0,34)}...`,durationSeconds:a.durationSeconds,voiceName:S,scriptText:ze.trim()});const s={id:Date.now().toString(),title:`Laboratorio: ${ze.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:S,model:a.usedModel||ee,durationSeconds:a.durationSeconds,wordCount:ze.trim().split(/\s+/).filter(Boolean).length,stylePrompt:At,scriptText:ze.trim()},r=await la(s,{base64:a.audioBase64});r&&ce(n=>n&&{...n,mediaKey:r})}catch(t){h({type:"error",text:t.message||"Error sintetizando prueba en el laboratorio."})}finally{ts(!1)}},Er=async()=>{if(C.trim())try{h(null),Mt.current&&Mt.current.close();const t=await fetch("/api/studio/tts/jobs",{method:"POST",headers:H(g),body:JSON.stringify({text:C,voiceName:S,stylePrompt:$e,model:ee,multiSpeaker:ne,speaker1:{name:"Alex",voiceName:_e},speaker2:{name:"Sam",voiceName:Fe},maxWordsPerChunk:Be})}),a=await ve(t);if(!t.ok)throw new Error(a.error||"No se pudo iniciar el trabajo de larga duración.");const s={id:a.jobId,status:"processing",totalChunks:a.totalChunks,currentChunkIndex:0,completedChunks:0,estimatedTotalSeconds:a.estimatedTotalSeconds,generatedTotalSeconds:0,progressPercent:0,chunks:Array.from({length:a.totalChunks},(i,o)=>({index:o,wordCount:0,status:"pending"}))};Ae(s);const r=new EventSource(`/api/studio/tts/jobs/${a.jobId}/stream${g?`?token=${encodeURIComponent(g)}`:""}`);Mt.current=r,r.addEventListener("snapshot",i=>{const o=JSON.parse(i.data);Ae(x=>x?{...x,...o}:o)}),r.addEventListener("chunk_start",i=>{const o=JSON.parse(i.data);Ae(x=>{if(!x)return null;const f=[...x.chunks];return f[o.chunkIndex]&&(f[o.chunkIndex]={...f[o.chunkIndex],status:"processing"}),{...x,currentChunkIndex:o.chunkIndex,chunks:f}})}),r.addEventListener("chunk_complete",i=>{const o=JSON.parse(i.data);Ae(x=>{if(!x)return null;const f=[...x.chunks];f[o.chunkIndex]&&(f[o.chunkIndex]={...f[o.chunkIndex],status:"completed",durationSeconds:o.durationSeconds,audioBase64:o.audioBase64});const A=f.filter(_=>_.status==="completed").length;return{...x,completedChunks:A,progressPercent:o.progressPercent,generatedTotalSeconds:o.generatedTotalSeconds,chunks:f}})}),r.addEventListener("job_completed",i=>{const o=JSON.parse(i.data);r.close(),Ae(f=>f?{...f,status:"completed",progressPercent:100,downloadUrl:o.downloadUrl}:null),ce({url:o.downloadUrl,title:`Audio Completo: ${C.trim().slice(0,35)}...`,durationSeconds:o.totalDurationSeconds,voiceName:S,scriptText:C});const x={id:o.id,title:`Audio Completo: ${C.trim().slice(0,42)}...`,createdAt:Date.now(),voiceName:S,model:ee,durationSeconds:o.totalDurationSeconds,wordCount:Ta,downloadUrl:o.downloadUrl,stylePrompt:$e,scriptText:C};la(x,{url:o.downloadUrl}).then(f=>{f&&ce(A=>A&&{...A,mediaKey:f})})}),r.addEventListener("job_failed",i=>{const o=JSON.parse(i.data);r.close(),Ae(x=>x?{...x,status:"failed",error:o.error}:null)}),r.addEventListener("job_status",i=>{const o=JSON.parse(i.data);Ae(x=>x?{...x,status:o.status}:null)});const n=i=>{try{const o=JSON.parse(i.data);Ae(x=>x?{...x,failoverNotice:o.message||(o.label?`Salto automático a ${o.label} (${o.reason||"429"})`:"Cuota 429 detectada en la clave anterior. Rotación automática a clave de respaldo activada.")}:null)}catch{}};r.addEventListener("key_failover",n),r.addEventListener("api_key_failover",n)}catch(t){h({type:"error",text:t.message||"Error iniciando trabajo."})}},Ar=async()=>{try{je(!0),h(null);const t=await fetch("/api/studio/script/enhance",{method:"POST",headers:H(g),body:JSON.stringify({text:C,scriptText:C,stylePrompt:$e,multiSpeaker:ne,modelName:w})}),a=await ve(t),s=a.scriptText||a.text;if(!t.ok||!a.success||!s)throw new Error(a.error||"No se pudo mejorar el guion con IA.");Ie(s),h({type:"success",text:`¡Guion enriquecido con expresiones vocales (<breath>, <laugh>) usando ${a.usedModel||a.model||w}!`})}catch(t){h({type:"error",text:t.message||"Error mejorando el guion con IA."})}finally{je(!1)}},$a=async t=>{oe&&(t==="cancel"&&Mt.current&&Mt.current.close(),await fetch(`/api/studio/tts/jobs/${oe.id}/control`,{method:"POST",headers:H(g),body:JSON.stringify({action:t})}),Ae(a=>a?{...a,status:t==="pause"?"paused":t==="resume"?"processing":"cancelled"}:null))},da=t=>{const a=document.getElementById("wappy-studio-tts-editor");if(!a){Ie(i=>`${i} ${t}`);return}const s=a.selectionStart,r=a.selectionEnd,n=C.substring(0,s)+t+C.substring(r);Ie(n),setTimeout(()=>{a.focus(),a.setSelectionRange(s+t.length,s+t.length)},15)},He=(t=M,a=!!X,s=it,r,n,i)=>{const o=r??((c==null?void 0:c.scriptText)||C),x=Math.max(5,Math.round(n??((c==null?void 0:c.durationSeconds)||V||28)));We(tr({aspectRatio:t,hasBaseVideo:a,badgeText:It,headline:Ke,subheadline:ea,accentColor:Lt,templateId:s,scriptText:o,durationSeconds:x})),s!=="camera-overlay"&&!a&&fetch("/api/studio/video/compile-master-reel",{method:"POST",headers:H(g),body:JSON.stringify({scriptText:o,headline:Ke,aspectRatio:t,hasBaseVideo:a,showSubtitles:fe,durationSeconds:x,companyName:(u==null?void 0:u.name)||"WAPPY IA",audioBase64:i||(c==null?void 0:c.base64)||void 0})}).then(f=>ve(f)).then(f=>{f!=null&&f.success&&f.htmlCode&&We(f.htmlCode)}).catch(()=>{})},Ps=l.useRef(!1);l.useEffect(()=>{B==="video"&&!Ps.current&&(Ps.current=!0,He(M,!!X,it,(c==null?void 0:c.scriptText)||C,(c==null?void 0:c.durationSeconds)||V||28,c==null?void 0:c.base64))},[B]);const Pr=async()=>{const t=(C||Ke||"").trim().slice(0,750);if(t)try{cs(!0),h(null);const a=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(g),body:JSON.stringify({text:t,voiceName:S,stylePrompt:$e,model:ee,multiSpeaker:ne,speaker1:{name:"Alex",voiceName:_e},speaker2:{name:"Sam",voiceName:Fe}})}),s=await ve(a);if(!a.ok||!s.success)throw new Error(s.error||"No se pudo sintetizar la voz para el video.");ce({base64:s.audioBase64,title:`Locución de Video (${S})`,durationSeconds:s.durationSeconds,voiceName:S,scriptText:t}),la({id:`vo-${Date.now()}`,title:`Locución de Video: ${t.slice(0,40)}...`,createdAt:Date.now(),voiceName:S,model:s.usedModel||ee,durationSeconds:s.durationSeconds,wordCount:t.split(/\s+/).filter(Boolean).length,stylePrompt:$e,scriptText:t},{base64:s.audioBase64}).then(r=>{r&&ce(n=>n&&{...n,mediaKey:r})}),s.durationSeconds&&s.durationSeconds>1&&dt(s.durationSeconds),Ze.includes('data-wappy-template="true"')&&He(M,!!X,it,t,s.durationSeconds,s.audioBase64),Me(0),Re(!0),setTimeout(()=>{var r,n,i,o;(n=(r=z.current)==null?void 0:r.contentWindow)==null||n.postMessage({type:"STUDIO_RESTART"},"*"),(i=le.current)==null||i.play().catch(()=>{}),(o=me.current)==null||o.play().catch(()=>{})},120),h({type:"success",text:`¡Locución neural (${S} • ${s.durationSeconds}s) sincronizada al milisegundo con el Motor Maestro 60-FPS + Avatar 3D!`})}catch(a){h({type:"error",text:a.message||"Error sincronizando voz con el video."})}finally{cs(!1)}},Ms=t=>{Ia(a=>a.includes(t)?a.filter(s=>s!==t):[...a,t])},Mr=()=>{const t=Math.max(8,Math.round((c==null?void 0:c.durationSeconds)||V||24)),a=Ja(C,t),s=pe.map(i=>{var o;return(o=qe.find(x=>x.id===i))==null?void 0:o.label}).filter(Boolean),r=s.length>0?s:qe.map(i=>i.label),n=a.beats.map((i,o)=>{const x=o===0?"0.0s":`${i.startSec.toFixed(1)}s`,f=o===0&&i.endSec<2.2?"2.0s":`${Math.max(i.startSec+1.5,i.endSec).toFixed(1)}s`,A=o>0&&!i.text.includes("[pausa")?"[pausa 0.5s] ":"",_=i.text.includes("<breath>")?"":" <breath>";return{id:`step-${Date.now()}-${o}`,timeRange:`${x}-${f}`,title:o===0?"Portada Magnética (2s)":`${i.titleLead} ${i.titleHighlight}`.trim()||`Escena 0${o+1}`,narration:`${A}${i.text}${_}`.trim(),visualEffect:o===0?"19 Portada Magnética (2s)":r[o%r.length]||"07 Zoom-Through"}});Ue(n),h({type:"success",text:`¡Guion estructurado en ${n.length} escenas con tiempos (${t}s), pausas y efectos de las Skills de Antigravity!`})},zr=()=>{if(!Array.isArray(he)||he.length===0)return;const t=he.map(a=>(a.narration||"").replace(/\[pausa\s+[\d.]+s\]/gi,"<breath>").trim()).filter(Boolean).join(`

`);t&&(Ie(t),h({type:"success",text:"¡Escenas y pausas sincronizadas con el Guion Principal!"}))},zs=()=>{const t=Math.max(6,Math.round((c==null?void 0:c.durationSeconds)||V||24)),a=ga.find(n=>n.id===Le)||ga[0],s=pe.map(n=>{var i;return((i=qe.find(o=>o.id===n))==null?void 0:i.label)||n}).join(", "),r=(Array.isArray(he)?he:[]).map((n,i)=>`• Escena ${i+1} (${n.timeRange}) [${n.visualEffect}] — "${n.title}": ${n.narration}`).join(`
`);return["[SUPER-PROMPT OFICIAL ANTIGRAVITY 60-FPS • SISTEMA DE LAS 7 PIEZAS WAPPY IA]",`1. FORMATO Y DURACIÓN: ${M==="9:16"?"Vertical 9:16 (1080x1920 Reels/TikTok/WhatsApp)":"Horizontal 16:9 (1920x1080 YouTube/LMS)"} • Duración sincronizada al audio: ${t}s (${c?`Voz activa: ${c.voiceName||S}`:"Locución lista"}).`,`2. DIRECCIÓN DE ARTE (${a.label}): Paleta ${a.colors} • Insignia: "${It}" • Titular: "${Ke}" • Subtítulo: "${ea}" • Acento: ${Lt}.`,`3. EFECTOS DE SKILLS ANTIGRAVITY ACTIVOS: ${s||"19 Portada Magnética (2s), Avatar 3D Lip-Sync, 07 Zoom-Through, 13 Checklist SST"}.`,"4. ESCALETA SEGUNDO A SEGUNDO Y PAUSAS SINCRONIZADAS CON LA VOZ:",r||`• 0.0s-${t}s: ${C.slice(0,360)}`,"5. REGLAS TÉCNICAS: Incluir de 0.0s a 2.0s la Miniatura/Portada Magnética con titular e insignias clave, sincronizar transiciones GSAP con window.mainTimeline y el reloj de voz, mantener última escena visible al cierre y cero desbordes de texto."].join(`
`)},Is=async()=>{try{hs(!0),h(null);const t=Math.max(6,Math.round((c==null?void 0:c.durationSeconds)||V||24)),a=zs();try{const s=await fetch("/api/studio/antigravity/super-prompt",{method:"POST",headers:H(g),body:JSON.stringify({scriptText:C,scriptSteps:he,aspectRatio:M,durationSeconds:t,badgeText:It,headlineText:Ke,subtitleText:ea,accentColor:Lt,artDirection:Le,selectedEffects:pe,voiceName:(c==null?void 0:c.voiceName)||S,modelName:w,antigravityApiKey:I})});if(s.ok){const r=await ve(s);if(r!=null&&r.success&&r.superPrompt){aa(r.superPrompt),Array.isArray(r.scriptSteps)&&r.scriptSteps.length>0&&Ue(r.scriptSteps),h({type:"success",text:"¡Paso 1 completado! Super-Prompt de Antigravity generado con tus tiempos, pausas y efectos. Ahora pulsa el Paso 2 para enviar al Generador de Video."});return}}}catch{}aa(a),h({type:"success",text:"¡Paso 1 completado! Super-Prompt estructurado con tus escenas, tiempos, pausas y efectos de las Skills de Antigravity. Ahora pulsa el Paso 2."})}finally{hs(!1)}},Ir=async()=>{var t;try{ys(!0),h(null);const a=(ot||"").trim()||zs();ot.trim()||aa(a);const s=await $t(),r=Math.max(6,Math.round((c==null?void 0:c.durationSeconds)||V||25)),n=await fetch("/api/studio/video/generate-html",{method:"POST",headers:H(g),body:JSON.stringify({prompt:a,scriptText:C,scriptSteps:he,aspectRatio:M,theme:Le,effects:pe,hasBaseVideo:!!X,showSubtitles:fe,durationSeconds:r,companyName:(u==null?void 0:u.name)||"WAPPY IA",modelName:w,audioBase64:s||void 0,antigravityApiKey:I})}),i=await ve(n);if(!n.ok||!i.success)throw new Error(i.error||"Error generando composición HTML con Antigravity.");(t=i.timelineMap)!=null&&t.totalDurationSeconds&&i.timelineMap.totalDurationSeconds>2&&dt(i.timelineMap.totalDurationSeconds),xe.current="",We(i.htmlCode),await pt({htmlOverride:i.htmlCode},!0),Me(0),Re(!0),setTimeout(()=>{var o,x,f,A;(x=(o=z.current)==null?void 0:o.contentWindow)==null||x.postMessage({type:"STUDIO_RESTART"},"*"),(f=le.current)==null||f.play().catch(()=>{}),(A=me.current)==null||A.play().catch(()=>{})},140),h({type:"success",text:"¡Paso 2 completado! Video HTML 60-FPS generado por Antigravity, cargado en el Lienzo en sincronía con el audio y guardado en tu Biblioteca."})}catch(a){h({type:"error",text:a.message||"No se pudo generar la escena HTML con Antigravity."})}finally{ys(!1)}},Ls=async()=>{var t;if(!Rt.trim()){h({type:"info",text:"Escribe primero qué detalle deseas corregir o ajustar en el video HTML (colores, textos, tamaños, efectos o tiempos)."});return}try{ws(!0),h(null);const a=await $t(),s=Math.max(6,Math.round((c==null?void 0:c.durationSeconds)||V||25)),r=xe.current||Ze;let n="";try{const i=await fetch("/api/studio/antigravity/edit-html",{method:"POST",headers:H(g),body:JSON.stringify({currentHtml:r,correctionPrompt:Rt.trim(),superPrompt:ot,scriptText:C,scriptSteps:he,aspectRatio:M,durationSeconds:s,badgeText:It,headlineText:Ke,subtitleText:ea,accentColor:Lt,theme:Le,effects:pe,modelName:w,audioBase64:a||void 0,antigravityApiKey:I})});if(i.ok){const o=await ve(i);o!=null&&o.success&&o.htmlCode&&(n=o.htmlCode,(t=o.timelineMap)!=null&&t.totalDurationSeconds&&o.timelineMap.totalDurationSeconds>2&&dt(o.timelineMap.totalDurationSeconds))}}catch{}if(!n){const i=`${ot}

[CORRECCIÓN OBLIGATORIA SOLICITADA POR EL USUARIO SOBRE EL LIENZO ACTUAL]: ${Rt.trim()}`,o=await fetch("/api/studio/video/generate-html",{method:"POST",headers:H(g),body:JSON.stringify({prompt:i,scriptText:C,scriptSteps:he,aspectRatio:M,theme:Le,effects:pe,hasBaseVideo:!!X,showSubtitles:fe,durationSeconds:s,companyName:(u==null?void 0:u.name)||"WAPPY IA",modelName:w,audioBase64:a||void 0,antigravityApiKey:I})}),x=await ve(o);if(!o.ok||!x.success||!x.htmlCode)throw new Error(x.error||"No se pudieron aplicar las correcciones al HTML.");n=x.htmlCode}xe.current="",We(n),await pt({htmlOverride:n},!0),Me(0),Re(!0),setTimeout(()=>{var i,o,x,f;(o=(i=z.current)==null?void 0:i.contentWindow)==null||o.postMessage({type:"STUDIO_RESTART"},"*"),(x=le.current)==null||x.play().catch(()=>{}),(f=me.current)==null||f.play().catch(()=>{})},140),h({type:"success",text:"¡Paso 3 completado! Correcciones aplicadas por Antigravity sobre el HTML manteniendo la sincronía con el audio y actualizadas en la Biblioteca."})}catch(a){h({type:"error",text:a.message||"Error aplicando correcciones con Antigravity."})}finally{ws(!1)}},Lr=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;X&&URL.revokeObjectURL(X);const s=URL.createObjectURL(a);ps(s),xs(a.name),He(M,!0)},Dr=t=>{var r;const a=(r=t.target.files)==null?void 0:r[0];if(!a)return;nt&&URL.revokeObjectURL(nt);const s=URL.createObjectURL(a);ms(s),bs(a.name)},Te=l.useMemo(()=>nt||(c!=null&&c.url?c.url:c!=null&&c.base64?`data:audio/wav;base64,${c.base64}`:""),[nt,c]);l.useEffect(()=>{if(B!=="video"||!De||ue)return;let t=performance.now();const a=setInterval(()=>{var o,x,f,A;const s=performance.now(),r=(s-t)/1e3;t=s;const n=le.current,i=me.current;if(n&&Te&&!n.paused&&!n.ended){const _=n.currentTime,O=n.duration&&!isNaN(n.duration)&&n.duration>1?n.duration:Math.max(1,V||20);Me(_),(x=(o=z.current)==null?void 0:o.contentWindow)==null||x.postMessage({type:"STUDIO_SYNC_TIME",currentTime:_,duration:O,playing:!0},"*");return}if(i&&X&&!i.paused&&!i.ended){const _=i.currentTime,O=i.duration&&!isNaN(i.duration)&&i.duration>1?i.duration:Math.max(1,V||20);Me(_),(A=(f=z.current)==null?void 0:f.contentWindow)==null||A.postMessage({type:"STUDIO_SYNC_TIME",currentTime:_,duration:O,playing:!0},"*");return}Me(_=>{var de,L,Q,Y;const O=Math.max(1,V||20),J=_+r;return J>=O?(Re(!1),(L=(de=z.current)==null?void 0:de.contentWindow)==null||L.postMessage({type:"STUDIO_PAUSE"},"*"),O):((Y=(Q=z.current)==null?void 0:Q.contentWindow)==null||Y.postMessage({type:"STUDIO_SYNC_TIME",currentTime:J,duration:O,playing:!0},"*"),J)})},120);return()=>clearInterval(a)},[B,De,ue,V,Te,X]);const Ds=()=>{var r,n,i,o,x;const t=Math.max(1,V||20);if(!De&&(lt>=t-.3||!!((r=le.current)!=null&&r.ended))){_a();return}const s=!De;s&&ue&&(ra(!1),(i=(n=z.current)==null?void 0:n.contentWindow)==null||i.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),Re(s),(x=(o=z.current)==null?void 0:o.contentWindow)==null||x.postMessage({type:s?"STUDIO_PLAY":"STUDIO_PAUSE"},"*"),me.current&&(s?me.current.play().catch(()=>{}):me.current.pause()),le.current&&Te&&(s?le.current.play().catch(()=>{}):le.current.pause())},_a=()=>{var t,a,s,r;ue&&(ra(!1),(a=(t=z.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*")),Me(0),Re(!0),(r=(s=z.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_RESTART"},"*"),me.current&&(me.current.currentTime=0,me.current.play().catch(()=>{})),le.current&&Te&&(le.current.currentTime=0,le.current.play().catch(()=>{}))},Rs=t=>{var s,r;Me(t);const a=V>0?t/V:0;(r=(s=z.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SEEK",progress:a,time:t},"*"),me.current&&(me.current.currentTime=t),le.current&&Te&&(le.current.currentTime=t)},Vs=()=>{var a,s,r,n;const t=!ue;ra(t),t?(Re(!1),(a=me.current)==null||a.pause(),(s=le.current)==null||s.pause()):xe.current&&(We(xe.current),xe.current=""),(n=(r=z.current)==null?void 0:r.contentWindow)==null||n.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:t},"*")},et=t=>{var a,s;Ra(r=>r&&{...r,...t}),(s=(a=z.current)==null?void 0:a.contentWindow)==null||s.postMessage({type:"STUDIO_UPDATE_SELECTED",updates:t},"*")},Rr=()=>{var t,a;xe.current&&(We(xe.current),xe.current=""),ra(!1),Ra(null),(a=(t=z.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!1},"*"),h({type:"success",text:"¡Cambios de textos y posición de cajas guardados en la composición HTML!"})},Os=()=>{var t,a,s;document.fullscreenElement?(t=document.exitFullscreen)==null||t.call(document).catch(()=>{}):(s=(a=Ns.current)==null?void 0:a.requestFullscreen)==null||s.call(a).catch(()=>{})},Ot=l.useMemo(()=>{const t=(c==null?void 0:c.scriptText)||C||"";return Ja(t,Math.max(4,V||25))},[c==null?void 0:c.scriptText,C,V]),tt=l.useMemo(()=>Ot.wordTimings.map(t=>t.word),[Ot]),Fa=l.useMemo(()=>{if(!fe||tt.length===0)return null;const t=Math.max(0,Math.min(.9999,lt/Math.max(1,V))),a=Ot.wordTimings;let s=-1;for(let o=0;o<a.length;o++)if(t>=a[o].startPct&&t<=a[o].endPct){s=o;break}s===-1&&(s=Math.min(tt.length-1,Math.floor(t*tt.length)));const r=5,n=Math.floor(s/r)*r;return{words:tt.slice(n,n+r),activeOffset:s-n}},[fe,tt,Ot,lt,V]),$t=async()=>{if(c!=null&&c.base64)return c.base64;if(!Te)return null;try{const t=await fetch(Te);if(!t.ok)return null;const a=await t.arrayBuffer(),s=new Uint8Array(a);let r="";const n=32768;for(let i=0;i<s.length;i+=n)r+=String.fromCharCode.apply(null,Array.from(s.subarray(i,i+n)));return window.btoa(r)}catch{return null}},Ba=async()=>{try{ks(!0);const t=Math.min(60,Math.max(4,Math.round(V||15))),a=t>20?12:15;h({type:"info",text:`Renderizando Video MP4 con Audio + Animación + Subtítulos (${t}s)... Espera ~15-25 segundos mientras se ensambla el archivo .MP4 para WhatsApp y Celular.`});const s=xe.current||Ze,r=await $t(),n=await fetch("/api/studio/video/render-mp4",{method:"POST",headers:H(g),body:JSON.stringify({htmlCode:s,audioBase64:r,scriptText:(c==null?void 0:c.scriptText)||C,showSubtitles:fe,subtitlePosition:Ye,aspectRatio:M,durationSeconds:t,fps:a,antigravityApiKey:I})}),i=await ve(n);if(!n.ok||!i.success||!i.videoBase64)throw new Error(i.error||"No se pudo renderizar el archivo MP4 en el servidor.");const o=window.atob(i.videoBase64),x=new Array(o.length);for(let J=0;J<o.length;J++)x[J]=o.charCodeAt(J);const f=new Uint8Array(x),A=new Blob([f],{type:"video/mp4"});pt({mp4Blob:A});const _=URL.createObjectURL(A),O=document.createElement("a");O.href=_,O.download=`wappy-studio-reel-${Date.now()}.mp4`,document.body.appendChild(O),O.click(),document.body.removeChild(O),URL.revokeObjectURL(_),h({type:"success",text:`¡Video MP4 Universal (${i.width}x${i.height} • H.264 + Audio AAC) descargado con éxito! Listo para enviar por WhatsApp, ver en celular o subir a Reels/TikTok.`})}catch(t){h({type:"error",text:t.message||"Error renderizando MP4 en el servidor."})}finally{ks(!1)}},Vr=async t=>{var L;let a=t.replace(/subtitles\.reverse\(\)/g,"subtitles.slice().reverse()");const s=Q=>Q.replace(/<\/script/gi,"<\\/script"),r=async Q=>{try{const Y=await fetch(Q,{cache:"force-cache"});return Y.ok?await Y.text():""}catch{return""}},n=async Q=>{try{const Y=await fetch(Q,{cache:"force-cache"});if(!Y.ok)return"";const at=await Y.arrayBuffer(),St=new Uint8Array(at);let Hs="";const Gs=32768;for(let ca=0;ca<St.length;ca+=Gs)Hs+=String.fromCharCode.apply(null,Array.from(St.subarray(ca,ca+Gs)));return`data:image/png;base64,${window.btoa(Hs)}`}catch{return""}};let i="";try{const Q=(L=z.current)==null?void 0:L.contentDocument;Q&&Array.from(Q.querySelectorAll("style")).forEach(Y=>{if((Y.id||"").startsWith("wappy-studio-bridge"))return;const St=Y.textContent||"";St&&!a.includes(St.slice(0,120))&&(i+=`
${St}`)})}catch{i=""}const[o,x,f,A,_,O]=await Promise.all([/gsap(\.min)?\.js/i.test(a)?r("/assets/gsap.min.js"):Promise.resolve(""),/three(\.min)?\.js/i.test(a)?r("/assets/wappy/three.min.js"):Promise.resolve(""),/cdn\.tailwindcss\.com|tailwind-cdn\.js/i.test(a)?r("/assets/tailwind-cdn.js"):Promise.resolve(""),/tenshi\.png/i.test(a)?n("/assets/wappy/tenshi.png"):Promise.resolve(""),/felix_avatar_3d\.png/i.test(a)?n("/assets/wappy/felix_avatar_3d.png"):Promise.resolve(""),/wappy-cat-logo\.png/i.test(a)?n("/assets/wappy/wappy-cat-logo.png"):Promise.resolve("")]);A&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?tenshi\.png(["')])/gi,(Q,Y,at)=>`${Y}${A}${at}`)),_&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?felix_avatar_3d\.png(["')])/gi,(Q,Y,at)=>`${Y}${_}${at}`)),O&&(a=a.replace(/(["'(])(?:\.\/|\/)?assets\/(?:wappy\/)?wappy-cat-logo\.png(["')])/gi,(Q,Y,at)=>`${Y}${O}${at}`)),o&&(a=a.replace(/<script[^>]*src=["'][^"']*gsap(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-gsap">${s(o)}<\/script>`)),x&&(a=a.replace(/<script[^>]*src=["'][^"']*three(\.min)?\.js["'][^>]*>\s*<\/script>/gi,()=>`<script id="wappy-inline-three">${s(x)}<\/script>`)),a=a.replace(/<script[^>]*src=["'][^"']*(cdn\.tailwindcss\.com|tailwind-cdn\.js)[^"']*["'][^>]*>\s*<\/script>/gi,()=>"<script>window.tailwind = window.tailwind || {};<\/script>"+(f?`<script id="wappy-inline-tailwind">${s(f)}<\/script>`:""));const J=`
<meta name="color-scheme" content="dark" />
<meta name="format-detection" content="telephone=no" />
<style id="wappy-precompiled-tailwind">${i.replace(/<\/style/gi,"<\\/style")}</style>
<style id="wappy-offline-font-fallback">
  html, body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
</style>
<noscript><style>
  #header-hud, #top-bar, #scene-1, #scene-1 *, #hero-card, .metric-item { opacity: 1 !important; transform: none !important; visibility: visible !important; }
  #wappy-capsule-controls, #wappy-mobile-tap-overlay { display: none !important; }
</style></noscript>`;/<head[^>]*>/i.test(a)?a=a.replace(/<head[^>]*>/i,Q=>`${Q}${J}`):a=`${J}
${a}`,/<meta[^>]+name=["']viewport/i.test(a)||(a=a.replace(/<head[^>]*>/i,Q=>`${Q}<meta name="viewport" content="width=device-width, initial-scale=1.0" />`));const de=`<script id="wappy-visibility-guard">
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
${de}`,a},$s=async()=>{const t=await Vr(xe.current||Ze),a=await $t(),s=a?`data:audio/wav;base64,${a}`:"",r=Math.max(4,Math.round((V||20)*10)/10),n=`
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
    ${Ye==="top"?"top: 54px;":Ye==="center"?"top: 50%; transform: translateY(-50%);":"bottom: 58px;"}
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
<div id="wappy-capsule-subtitles" style="display:${fe&&tt.length>0?"flex":"none"};">
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
  var words = ${JSON.stringify(tt)};
  var wordTimings = ${JSON.stringify(Ot.wordTimings)};
  var showSubs = ${!!(fe&&tt.length>0)};
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
${n}`},_t=l.useRef(null),pt=async(t={},a=!0)=>{var s;try{const r=t.htmlOverride||xe.current||Ze,n=(c==null?void 0:c.mediaKey)||Te||"sin-audio",i=`${r.length}:${r.slice(-200)}:${n}:${M}`,x=((s=_t.current)==null?void 0:s.signature)===i&&Pe.some(de=>{var L;return de.id===((L=_t.current)==null?void 0:L.id)})?_t.current.id:`video-${Date.now()}`,f=`html-${x}`;await xt(f,new Blob([r],{type:"text/html"}));let A=c==null?void 0:c.mediaKey;if(!A&&Te){const de=await $t();de&&(A=`audio-${x}`,await xt(A,ma(de)))}let _;t.mp4Blob&&(_=`mp4-${x}`,await xt(_,t.mp4Blob));let O;t.capsuleHtml&&(O=`capsule-${x}`,await xt(O,new Blob([t.capsuleHtml],{type:"text/html"})));const J=((c==null?void 0:c.scriptText)||C||Ke||"Animación Antigravity").replace(/<[^>]+>/g,"").replace(/\[[^\]]+\]/g,"").trim();ft(de=>{const L=de.find(Y=>Y.id===x);return[{...L||{},id:x,kind:"video",title:(L==null?void 0:L.title)||`Video HTML ${M}: ${J.slice(0,42)}...`,createdAt:(L==null?void 0:L.createdAt)||Date.now(),voiceName:A?(c==null?void 0:c.voiceName)||S:"Sin Audio (Solo HTML)",model:w,durationSeconds:Math.round(((c==null?void 0:c.durationSeconds)||V||20)*10)/10,wordCount:J.split(/\s+/).filter(Boolean).length,scriptText:(c==null?void 0:c.scriptText)||C,stylePrompt:ot?ot.slice(0,180):void 0,htmlKey:f,mediaKey:A||(L==null?void 0:L.mediaKey),mp4Key:_||(L==null?void 0:L.mp4Key),capsuleKey:O||(L==null?void 0:L.capsuleKey),aspectRatio:M,showSubtitles:fe,subtitlePosition:Ye},...de.filter(Y=>Y.id!==x)]}),_t.current={id:x,signature:i},a||h({type:"success",text:"¡Video HTML guardado en la Biblioteca! Puedes reabrirlo en el editor, descargar el .HTML al instante o renderizar el .MP4 con Antigravity."})}catch(r){h({type:"error",text:`No se pudo guardar el video en la Biblioteca: ${(r==null?void 0:r.message)||"error de almacenamiento"}`})}},Ua=async(t=!1)=>{try{const r=localStorage.getItem("wappy_antigravity_bridge_key")||"",n=await fetch("/api/studio/antigravity/guest-key",{method:"POST",headers:H(g),body:JSON.stringify({guestKey:t?"":r})});if(n.ok){const i=await n.json().catch(()=>({})),o=String(i.apiKey||i.guestKey||i.key||"").trim();if(o)return P(o),localStorage.setItem("wappy_antigravity_bridge_key",o),o}}catch{}const a=localStorage.getItem("wappy_antigravity_bridge_key")||"";if(a&&!t)return P(a),a;const s=`wpy_guest_${Math.random().toString(36).slice(2,10)}${Date.now().toString(36)}`;P(s);try{localStorage.setItem("wappy_antigravity_bridge_key",s)}catch{}return s};l.useEffect(()=>{Ua(!1)},[g]),l.useEffect(()=>{const t=(I||"").trim();if(!t)return;let a=null;try{const s=`/api/mcp-bridge/antigravity/stream?apiKey=${encodeURIComponent(t)}`;a=new EventSource(s);const r=async n=>{var A,_;if(!n||typeof n!="object")return;const i=n.orden||n.data||n,o=String(i.formato||i.formatoEntregable||"").toLowerCase(),x=String(i.contenido||i.htmlCode||i.resultado||"").trim();if(o==="html"||/<!doctype html|<html\b|<div[^>]+id=["']stage["']/i.test(x)){const O=x.replace(/^```html\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/i,"").trim();O.length>60&&(xe.current="",We(O),await pt({htmlOverride:O},!0),Me(0),Re(!0),N("video"),setTimeout(()=>{var J,de,L;(de=(J=z.current)==null?void 0:J.contentWindow)==null||de.postMessage({type:"STUDIO_RESTART"},"*"),(L=le.current)==null||L.play().catch(()=>{})},150),h({type:"success",text:"🚀 ¡Tu Antigravity envió el video HTML directo al Lienzo y quedó guardado en la Biblioteca!"}))}const f=((A=i.archivoOriginal)==null?void 0:A.publicUrl)||((_=i.media)==null?void 0:_.url)||i.mp4Url||i.downloadUrl||"";if(f&&/\.mp4(\?|$)/i.test(f))try{const O=await fetch(f);if(O.ok){const J=await O.blob();await pt({mp4Blob:J},!0),wt(J,`wappy-antigravity-video-${Date.now()}.mp4`),h({type:"success",text:"🎬 ¡Tu Antigravity terminó de renderizar el video .MP4 y se descargó automáticamente!"})}}catch{window.open(f,"_blank","noopener,noreferrer")}};a.onopen=()=>{Z(!0)},a.onerror=()=>{Z(!1)},a.onmessage=n=>{try{const i=JSON.parse(n.data);((i==null?void 0:i.type)==="orden_completada"||(i==null?void 0:i.event)==="orden_completada")&&r(i)}catch{}},a.addEventListener("orden_completada",n=>{try{const i=JSON.parse(n.data);r(i)}catch{}})}catch{Z(!1)}return()=>{a&&a.close(),Z(!1)}},[I]);const _s=typeof window<"u"?window.location.origin:"https://wappy.club",Wa=t=>{const a=(t||I||"").trim();return`node -e "fetch('${_s}/api/studio/antigravity/skills-installer.js?key=${encodeURIComponent(a)}').then(r=>r.text()).then(c=>{const fs=require('fs'),p=require('path').join(require('os').homedir(),'.gemini','antigravity','wappy-skills-installer.js');fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,c);require('child_process').spawnSync(process.execPath,[p,'--install','--url=${_s}','--key=${a}'],{stdio:'inherit'})})"`},Fs=t=>{const a=(I||"").trim(),s=Wa(a);return`Hola Antigravity, conecta mi instancia de WAPPY Studio (Clave personal: ${a}) e instala el Pack Oficial de las 7 Skills de Diseño y Video de WAPPY IA (protocolo-produccion-videos, animaciones-17-efectos-reels, animaciones-wappy-brand, animaciones-dark-tech-hud, animaciones-explicativas-sst, hyperframes-motion-design y wappy-ui-design-system) más el puente reactivo wappy-push-daemon.js ejecutando este comando oficial con run_command:

${s}

Confírmame apenas las 7 Skills y el puente en tiempo real queden activos.`},Or=()=>{const t=`/api/studio/antigravity/skills-bundle.json?download=1&key=${encodeURIComponent(I)}`,a=document.createElement("a");a.href=t,a.download="wappy-antigravity-7-skills-pack.json",document.body.appendChild(a),a.click(),document.body.removeChild(a),h({type:"success",text:"📦 Descargando Pack Oficial de las 7 Skills de Diseño y Video WAPPY IA (.JSON Importable)..."})},$r=async()=>{const t=(I||"").trim()||await Ua(!1),a=Wa(t),s=typeof navigator<"u"&&/win/i.test(navigator.userAgent),r=s?"Instalar-Antigravity-Skills-Wappy.bat":"Instalar-Antigravity-Skills-Wappy.command",n=s?`@echo off\r
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
`,i=new Blob([n],{type:"text/plain;charset=utf-8"});wt(i,r),h({type:"success",text:`⚡ Instalador 1-Clic (${r}) descargado. Ábrelo para instalar las 7 Skills de Diseño/Video y enlazar tu Antigravity en 2 segundos.`})},Bs=async t=>{const a=t.htmlKey?await Nt(t.htmlKey):null;if(!a){h({type:"error",text:"No se encontró la composición HTML de este video."});return}const s=await a.text();t.aspectRatio&&Ma(t.aspectRatio),typeof t.showSubtitles=="boolean"&&gs(t.showSubtitles),t.subtitlePosition&&ls(t.subtitlePosition),xe.current="",We(s);const r=t.mediaKey?await Nt(t.mediaKey):null;r&&ce({url:Ts(r),title:t.title,durationSeconds:t.durationSeconds,voiceName:t.voiceName,scriptText:t.scriptText,mediaKey:t.mediaKey}),t.durationSeconds&&t.durationSeconds>1&&dt(t.durationSeconds),Me(0),Re(!1),_t.current=null,Ne("video")},Us=async()=>{var t,a;try{ia(!0);const s=await $s();pt({capsuleHtml:s});const r=`wappy-academia-capsula-${Date.now()}.html`,n=new Blob([s],{type:"text/html;charset=utf-8"});if(typeof window<"u"&&((t=window.matchMedia)==null?void 0:t.call(window,"(pointer: coarse)").matches)&&typeof navigator.share=="function")try{const f=new File([n],r,{type:"text/html"});if((a=navigator.canShare)!=null&&a.call(navigator,{files:[f]})){await navigator.share({files:[f],title:"Cápsula WAPPY",text:"Cápsula interactiva WAPPY (ábrela tocando el archivo)."}),h({type:"success",text:"¡Cápsula HTML compartida! Funciona sin internet al tocarla en WhatsApp."});return}}catch(f){if((f==null?void 0:f.name)==="AbortError")return}const o=URL.createObjectURL(n),x=document.createElement("a");x.href=o,x.download=r,document.body.appendChild(x),x.click(),document.body.removeChild(x),URL.revokeObjectURL(o),h({type:"success",text:"¡Cápsula HTML autocontenida descargada! Incluye estilos, animación y voz en un solo archivo: envíala por WhatsApp y ábrela tocándola, incluso sin internet."})}finally{ia(!1)}},_r=async()=>{try{ia(!0);const s=`<iframe srcdoc="${(await $s()).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" style="width:100%;max-width:${M==="9:16"?"400px":"860px"};aspect-ratio:${M==="9:16"?"9/16":"16/9"};border:0;border-radius:16px;overflow:hidden;display:block;margin:0 auto;box-shadow:0 20px 50px rgba(0,0,0,0.35);" allow="autoplay; fullscreen"></iframe>`;await navigator.clipboard.writeText(s),h({type:"success",text:"¡Código <iframe srcdoc> copiado al portapapeles! Pégalo directamente en cualquier lección de la Academia WAPPY (LMS)."})}catch{h({type:"error",text:"No se pudo copiar el código embebido al portapapeles."})}finally{ia(!1)}},jt=((Ws=U==null?void 0:U.supportedVoices)==null?void 0:Ws.length)||14;return!b&&u&&u.role!=="ADMIN"?e.jsx("div",{className:"flex-1 flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen p-6",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-md",children:[e.jsx("div",{className:"w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300 mx-auto",children:e.jsx(Ha,{className:"w-6 h-6"})}),e.jsx("h2",{className:"text-lg font-extrabold text-slate-900 dark:text-white",children:"WAPPY Studio (Acceso Administrador)"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Por el momento este módulo está habilitado exclusivamente para cuentas de Administración de WAPPY."}),e.jsx("a",{href:"/c/new",className:"inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition",children:"Volver al inicio"})]})}):e.jsxs("div",{className:y("flex-1 flex flex-col",b?"bg-transparent h-auto overflow-visible pb-6":"bg-gradient-to-b from-slate-50 via-white to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-[100dvh] h-auto overflow-y-auto pb-16"),children:[e.jsx("header",{className:y("bg-white dark:bg-slate-900/95 px-4 sm:px-6 py-4 shadow-2xs z-30 overflow-hidden",b?"relative rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-7xl w-full mx-auto":"sticky top-0 border-b border-slate-200/90 dark:border-slate-800"),children:e.jsxs("div",{className:"max-w-7xl mx-auto flex flex-col gap-3.5",children:[e.jsxs("div",{className:"flex flex-col md:flex-row md:items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3 min-w-0",children:[E&&!be&&e.jsx("div",{className:"hidden md:block shrink-0",children:e.jsx(Xr,{setNavVisible:F})}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"flex flex-wrap items-center gap-2 mb-1",children:e.jsxs("span",{className:"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 uppercase tracking-wider",children:[e.jsx(Ce,{className:"w-3 h-3 text-teal-500 shrink-0"}),e.jsx("span",{children:p?"🎙️ PASO 1 · CREADOR DE PODCAST & LOCUCIÓN":"Estudio Multimodal • Gemini 3.8 Flash TTS & HyperFrames"})]})}),e.jsxs("div",{className:"flex flex-wrap items-baseline gap-x-3 gap-y-1",children:[e.jsxs("h1",{className:"text-xl sm:text-2xl font-extrabold flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 dark:from-teal-400 dark:via-emerald-400 dark:to-indigo-400 whitespace-nowrap",children:[p?e.jsx(Ge,{className:"w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0"}):e.jsx(Ha,{className:"w-6 h-6 sm:w-7 sm:h-7 text-teal-500 shrink-0"}),e.jsx("span",{children:p?"WAPPY Podcast IA":"WAPPY Studio"})]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300 hidden sm:block",children:p?"Estudio Profesional de Podcast Conversacional (2 Voces) y Locución Neural Gemini 24 kHz WAV":"Síntesis de voz neural de hasta 1 hora continua y creación de videos animados en HTML/GSAP con Antigravity."})]})]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 shrink-0",children:[e.jsx(Qr,{selectedModel:w,onSelectModel:ae,disabled:Dt}),e.jsx(d,{icon:e.jsx(Ft,{}),label:"Conectar mi Antigravity & Skills",variant:"purple",alwaysExpanded:!0,onClick:()=>{ct(""),R("antigravity"),Xe(!0)},title:"Conectar tu propio Antigravity (con o sin cuenta) y descargar el Pack de 7 Skills de Video y Diseño"}),e.jsx(d,{icon:e.jsx(Bt,{}),label:`Claves IA (${Qe})`,variant:"fuchsia",alwaysExpanded:!0,onClick:()=>{ct(""),R("keys"),Xe(!0)},title:"Configurar hasta 3 claves Google Gemini con rotación inteligente"}),e.jsx(d,{icon:rs?e.jsx(K,{className:"animate-spin"}):e.jsx(qs,{}),label:"Probar Audio IA",variant:"emerald",alwaysExpanded:!0,disabled:rs,onClick:Nr}),!b&&e.jsx(d,{icon:e.jsx(Ur,{}),label:"App Portable",variant:"cyan",alwaysExpanded:!0,onClick:()=>window.open(p?"/wappypodcast.html":"/wappystudio.html","_blank","noopener,noreferrer"),title:"Abrir Landing Page Pública y Aplicativo Portable"})]})]}),e.jsxs("div",{className:"pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx(d,{icon:e.jsx(Ge,{}),label:p?"1. Estudio de Podcast & Voz":"Estudio de Voz (TTS)",variant:"teal",alwaysExpanded:!0,isActive:B==="tts",onClick:()=>Ne("tts")}),!p&&e.jsx(d,{icon:e.jsx(Ee,{}),label:"Video HTML & Capas",variant:"purple",alwaysExpanded:!0,isActive:B==="video",onClick:()=>Ne("video")}),e.jsx(d,{icon:e.jsx(pa,{}),label:p?"2. Voces Duales & Bursts":"Voces & Bursts",variant:"amber",alwaysExpanded:!0,isActive:B==="lab",onClick:()=>Ne("lab")}),e.jsx(d,{icon:e.jsx(ua,{}),label:p?`3. Biblioteca de Podcasts (${Pe.filter(t=>t.kind!=="video").length})`:`Biblioteca (${Pe.length})`,variant:"indigo",alwaysExpanded:!0,isActive:B==="library",onClick:()=>Ne("library")})]}),e.jsx("div",{className:"hidden lg:flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400",children:e.jsxs("span",{className:"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold",children:[e.jsx("span",{className:"w-2 h-2 rounded-full bg-[#C7F303] animate-pulse"}),p?"🎙️ Motor Multi-Voz 24 kHz WAV Activo":"Motor 60-FPS + Voz Activo"]})})]})]})}),e.jsxs("main",{className:"flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6",children:[vt&&e.jsxs("div",{className:y("p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200",vt.type==="success"?"bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200":vt.type==="error"?"bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200":"bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200"),children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[vt.type==="success"?e.jsx(fa,{className:"w-4 h-4 text-emerald-500 shrink-0"}):vt.type==="error"?e.jsx(Yt,{className:"w-4 h-4 text-rose-500 shrink-0"}):e.jsx(K,{className:"w-4 h-4 text-sky-500 animate-spin shrink-0"}),e.jsx("span",{children:vt.text})]}),e.jsx("button",{type:"button",onClick:()=>h(null),className:"p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10",children:e.jsx(ha,{className:"w-3.5 h-3.5"})})]}),c&&e.jsx(fi,{audioBase64:c.base64,audioUrl:c.url,title:c.title,durationSeconds:c.durationSeconds,voiceName:c.voiceName,onSendToVideo:p?void 0:()=>{Ne("video"),h({type:"success",text:"Audio vinculado automáticamente a la pista de locución del Compositor de Video."})}}),B==="tts"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[oe&&e.jsx(hi,{job:oe,onPause:()=>$a("pause"),onResume:()=>$a("resume"),onCancel:()=>$a("cancel"),onPlayChunk:t=>{t.audioBase64&&ce({base64:t.audioBase64,title:`Fragmento #${t.index+1} (${t.durationSeconds||0}s)`,durationSeconds:t.durationSeconds,voiceName:ne?`${_e} + ${Fe}`:S})},onLoadMaster:()=>{oe.downloadUrl&&ce({url:oe.downloadUrl,title:`Audio Completo: ${C.trim().slice(0,42)}...`,durationSeconds:oe.generatedTotalSeconds,voiceName:ne?`${_e} + ${Fe}`:S,scriptText:C})}}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-indigo-500/10 dark:from-teal-950/40 dark:via-zinc-900/80 dark:to-indigo-950/40 border border-teal-500/25 dark:border-teal-500/20 rounded-2xl p-3 sm:p-3.5 shadow-2xs",children:[e.jsxs("div",{className:"flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black text-xs flex items-center justify-center shrink-0",children:"01"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300",children:"Motor & Voz Neural"}),e.jsxs("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:[U==null?void 0:U.name," •"," ",e.jsx("span",{className:"text-teal-600 dark:text-teal-400",children:ne?`${_e} + ${Fe}`:S})]})]})]}),e.jsxs("div",{className:"flex items-center gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xs",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0",children:"02"}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300",children:"Capas de ~1 Min & Bursts"}),e.jsxs("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:[Ta," palabras • ~",Kt," min (",Pt," ",Pt===1?"capa de ~1m":"capas de ~1m",")"]})]})]}),e.jsxs("button",{type:"button",onClick:()=>Ne(p?"library":"video"),className:"flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/95 hover:bg-purple-50/80 dark:hover:bg-purple-950/30 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 shadow-2xs transition cursor-pointer text-left group",children:[e.jsxs("div",{className:"flex items-center gap-3 min-w-0",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0",children:"03"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300",children:p?"Master WAV 24kHz & Biblioteca":"WAV 24kHz & Video HTML/GSAP"}),e.jsx("div",{className:"text-xs font-bold text-slate-900 dark:text-white truncate",children:p?"Sintetiza tu podcast y descárgalo en WAV →":"Sintetiza audio o llévalo al Compositor →"})]})]}),p?e.jsx(ua,{className:"w-4 h-4 text-purple-500 shrink-0 group-hover:translate-x-0.5 transition-transform"}):e.jsx(Ee,{className:"w-4 h-4 text-purple-500 shrink-0 group-hover:translate-x-0.5 transition-transform"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",children:[e.jsxs("div",{className:"lg:col-span-5 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-1.5",children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(Ys,{className:"w-4 h-4 text-teal-500"}),"Modelo Oficial Gemini TTS"]}),e.jsx("span",{className:"text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full",children:"✓ GOOGLE_MODELS Activo"})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5",children:j.map(t=>{const a=ee===t.id;return e.jsxs("button",{type:"button",onClick:()=>{Oe(t.id),t.supportedVoices.includes(S)||gt(t.supportedVoices[0]||"Kore")},className:y("text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-gradient-to-br from-teal-50/95 via-emerald-50/70 to-indigo-50/50 dark:from-teal-950/50 dark:via-emerald-950/30 dark:to-indigo-950/30 border-teal-500 ring-2 ring-teal-500/20 shadow-xs":"bg-white dark:bg-slate-900/70 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/60 dark:hover:bg-zinc-800/60"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1.5",children:[e.jsx("span",{className:y("text-[9px] font-extrabold px-2 py-0.5 rounded-md border",t.badgeColor),children:t.badge}),a&&e.jsx("span",{className:"w-2 h-2 rounded-full bg-teal-500 animate-ping shrink-0"})]}),e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white leading-snug mb-1",children:t.name}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 leading-snug",children:t.description})]}),e.jsxs("div",{className:"mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-amber-700 dark:text-amber-400 font-bold",children:t.rateLimitLabel||t.quotaLabel}),a?e.jsxs("span",{className:"text-teal-700 dark:text-teal-300 font-extrabold flex items-center gap-0.5",children:[e.jsx(we,{className:"w-3 h-3"})," ",t.supportedVoices.length," voces"]}):e.jsxs("span",{className:"text-slate-500 dark:text-zinc-400 font-semibold",children:[t.supportedVoices.length," voces"]})]})]},t.id)})}),e.jsxs("div",{className:"px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]",children:[e.jsxs("span",{className:"text-slate-700 dark:text-zinc-300 flex items-center gap-1.5",children:[e.jsx(Ce,{className:"w-3.5 h-3.5 text-teal-500 shrink-0"}),e.jsxs("span",{children:["Voces activas para"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white",children:U==null?void 0:U.name}),":"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsxs("span",{className:"font-extrabold text-emerald-700 dark:text-emerald-400",children:[jt," de ",T.length," disponibles"]}),jt<T.length&&e.jsx("button",{type:"button",onClick:()=>Oe("gemini-3.8-flash-tts"),className:"text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 cursor-pointer",children:"Activar las 14 →"})]})]}),ee==="gemini-2.5-flash-preview-tts"&&e.jsxs("div",{className:"p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(Yt,{className:"w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("p",{className:"font-extrabold text-amber-900 dark:text-amber-200",children:"¿Por qué algunas voces aparecen desactivadas en Gemini 2.5 Flash TTS?"}),e.jsxs("p",{className:"text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed",children:[e.jsx("span",{className:"font-bold",children:"Gemini 2.5 Pro Preview TTS"})," no posee cuota activa en API (0 RPM / 0 RPD). Su reemplazo oficial funcional es"," ",e.jsx("span",{className:"font-bold",children:"Gemini 2.5 Flash TTS"}),", el cual habilita únicamente las"," ",e.jsx("span",{className:"font-bold",children:"5 voces fundamentales"})," (Kore, Puck, Charon, Fenrir y Aoede). Para usar las 14 voces y Vocal Bursts, cambia a"," ",e.jsx("span",{className:"font-bold",children:"Gemini 3.8 Flash TTS"}),"."]})]})]}),e.jsx("div",{className:"flex justify-end",children:e.jsx("button",{type:"button",onClick:()=>Oe("gemini-3.8-flash-tts"),className:"px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-900 dark:text-amber-200 font-extrabold text-[11px] transition cursor-pointer",children:"Cambiar a Gemini 3.8 Flash TTS (14 voces) →"})})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"block text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"Estilos y Plantillas Rápidas"}),e.jsx("span",{className:"text-[10px] text-slate-500 dark:text-zinc-400",children:"1 clic configura voz + emoción"})]}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:re.map(t=>{const a=$e===t.style&&(t.multiSpeaker?ne:!ne&&S===t.voiceName),s=!t.multiSpeaker&&!kt(t.voiceName);return e.jsxs("button",{type:"button",onClick:()=>{kt(t.voiceName)||Oe("gemini-3.8-flash-tts"),t.multiSpeaker?(Et(!0),t.speaker1&&Xa(t.speaker1.voiceName),t.speaker2&&Qa(t.speaker2.voiceName)):(Et(!1),gt(t.voiceName)),Ct(t.style)},className:y("text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition cursor-pointer inline-flex items-center gap-1.5",a?"bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 shadow-2xs font-bold":"border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 hover:border-teal-500/50 hover:bg-teal-500/10 text-slate-800 dark:text-zinc-200"),children:[e.jsx("span",{children:t.name}),s&&e.jsx("span",{className:"text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30",children:"Auto 3.8"})]},t.id)})})]}),e.jsxs("div",{className:"flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/95 rounded-xl border border-slate-200/90 dark:border-slate-800 gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx(Wr,{className:"w-4 h-4 text-teal-500 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-slate-900 dark:text-white",children:"Modo Diálogo / Podcast (2 Voces)"}),e.jsxs("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:["Alterna interlocutores usando"," ",e.jsx("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:"Alex:"})," ","y"," ",e.jsx("span",{className:"font-mono font-bold text-purple-600 dark:text-purple-400",children:"Sam:"})]})]})]}),e.jsx("button",{type:"button",onClick:()=>Et(!ne),className:y("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",ne?"bg-teal-600":"bg-slate-300 dark:bg-zinc-700"),children:e.jsx("span",{className:y("pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200",ne?"translate-x-4":"translate-x-0")})})]}),ne?e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200/90 dark:border-slate-800",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-teal-700 dark:text-teal-400 mb-1",children:"Voz para Alex (Hablante 1)"}),e.jsx("select",{value:_e,onChange:t=>Xa(t.target.value),className:"w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500",children:((U==null?void 0:U.supportedVoices)||[]).map(t=>{const a=T.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-purple-700 dark:text-purple-400 mb-1",children:"Voz para Sam (Hablante 2)"}),e.jsx("select",{value:Fe,onChange:t=>Qa(t.target.value),className:"w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500",children:((U==null?void 0:U.supportedVoices)||[]).map(t=>{const a=T.find(s=>s.id===t);return e.jsxs("option",{value:t,children:[t," (",(a==null?void 0:a.gender)||"Voz"," - ",(a==null?void 0:a.tone)||"Natural",")"]},t)})})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(Ge,{className:"w-3.5 h-3.5 text-teal-500"}),"Catálogo de Voces (",jt," activas / ",T.length," totales)"]}),e.jsx("p",{className:"text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5",children:"Haz clic en cualquier tarjeta para elegir la voz o en ▶ para escuchar su timbre real."})]}),e.jsxs("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]",children:[e.jsxs("button",{type:"button",onClick:()=>os("only_active"),className:y("px-2 py-0.5 rounded-md transition cursor-pointer",Qt==="only_active"?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:["Solo Activas (",jt,")"]}),e.jsxs("button",{type:"button",onClick:()=>os("all"),className:y("px-2 py-0.5 rounded-md transition cursor-pointer",Qt==="all"?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:["Todas (",T.length,")"]})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-2",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(Hr,{className:"w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"}),e.jsx("input",{type:"search",name:"wappy-voice-search",autoComplete:"off",value:Aa,onChange:t=>pr(t.target.value),placeholder:"Buscar voz (Kore, Orus, profunda, podcast...)",className:"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"})]}),e.jsx("div",{className:"flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] shrink-0",children:["all","Femenino","Masculino"].map(t=>e.jsx("button",{type:"button",onClick:()=>cr(t),className:y("px-2.5 py-1 rounded-lg transition cursor-pointer",Xt===t?"bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-bold shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:t==="all"?"Todas":t==="Femenino"?"♀ Femeninas":"♂ Masculinas"},t))})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1",children:Sr.map(t=>{const a=S===t.id,s=Ea===t.id,r=kt(t.id);return e.jsxs("div",{onClick:()=>{r||Oe("gemini-3.8-flash-tts"),gt(t.id)},className:y("p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer",a?"bg-gradient-to-br from-teal-50/95 via-emerald-50/60 to-white dark:from-teal-950/50 dark:via-emerald-950/25 dark:to-zinc-900 border-teal-500 ring-2 ring-teal-500/20 shadow-xs":"bg-white dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800 hover:border-teal-400 hover:bg-slate-50/70 dark:hover:bg-zinc-800/60",!r&&"opacity-75 border-dashed"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:"text-sm font-extrabold text-slate-900 dark:text-white truncate",children:t.name}),t.tag&&e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 shrink-0",children:t.tag})]}),e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap mt-1",children:[e.jsx("span",{className:y("text-[9px] font-bold px-1.5 py-0.5 rounded",t.gender==="Femenino"?"bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20":"bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"),children:t.gender==="Femenino"?"♀ Femenina":"♂ Masculina"}),r?e.jsx("span",{className:"text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded",children:"✓ Activa"}):e.jsx("span",{className:"text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded",children:"Requiere 3.8/3.1"})]})]}),e.jsxs("button",{type:"button",onClick:n=>As(t.id,n),disabled:s,title:`Escuchar muestra de ${t.name}`,className:"px-2 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shrink-0 cursor-pointer flex items-center gap-1 text-[10px] font-extrabold",children:[s?e.jsx(K,{className:"w-3 h-3 animate-spin"}):e.jsx(Ve,{className:"w-3 h-3 fill-current"}),e.jsx("span",{children:"Oír"})]})]}),e.jsx("p",{className:"text-[11px] text-teal-700 dark:text-teal-300 font-bold mt-2 leading-snug",children:t.tone})]}),e.jsxs("div",{className:"mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2",children:[e.jsx("p",{className:"text-[10px] text-slate-600 dark:text-zinc-400 line-clamp-1 leading-tight",children:t.recommendedFor}),!r&&e.jsx("button",{type:"button",onClick:n=>{n.stopPropagation(),Oe("gemini-3.8-flash-tts"),gt(t.id)},className:"text-[9px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 rounded shrink-0 cursor-pointer",children:"Usar con 3.8 →"})]})]},t.id)})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("label",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"Directiva de Estilo y Emoción"}),e.jsx("span",{className:"text-[10px] font-mono text-slate-500 dark:text-zinc-400",children:"speechMetadata.style"})]}),e.jsx("textarea",{rows:2,value:$e,onChange:t=>Ct(t.target.value),placeholder:"Ej: Voz cálida, pausada y reflexiva de narrador de documentales...",className:"w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{children:[e.jsxs("button",{type:"button",onClick:()=>ur(!Pa),className:"flex items-center justify-between w-full text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-extrabold py-1 transition cursor-pointer",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(Gr,{className:"w-3.5 h-3.5 text-teal-500"}),"Motor de Capas de Audio (~1 min por capa) & Unión Master"]}),e.jsx("span",{children:Pa?"▲":"▼"})]}),Pa&&e.jsxs("div",{className:"mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs",children:[e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-1.5",children:[{words:110,label:"~45 seg",sub:"110 pal."},{words:150,label:"~1 min ★",sub:"150 pal. (Óptimo)"},{words:220,label:"~1.5 min",sub:"220 pal."},{words:280,label:"~2 min",sub:"280 pal."}].map(t=>{const a=Math.abs(Be-t.words)<=10;return e.jsxs("button",{type:"button",onClick:()=>es(t.words),className:y("px-2 py-1.5 rounded-lg border text-center transition cursor-pointer",a?"bg-teal-500/15 border-teal-500 text-teal-800 dark:text-teal-200 font-extrabold shadow-2xs":"bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-zinc-300 hover:border-teal-400"),children:[e.jsx("div",{className:"text-[11px] font-bold",children:t.label}),e.jsx("div",{className:"text-[9px] opacity-80",children:t.sub})]},t.words)})}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-slate-600 dark:text-zinc-400",children:"Tamaño de cada capa de audio:"}),e.jsxs("span",{className:"font-mono font-bold text-teal-600 dark:text-teal-400",children:[Be," palabras (~",Math.max(20,Math.round(Be/145*60)),"s)"]})]}),e.jsx("input",{type:"range",min:80,max:280,step:10,value:Be,onChange:t=>es(parseInt(t.target.value,10)),className:"w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded appearance-none cursor-pointer accent-teal-600"}),e.jsxs("p",{className:"text-[10px] text-slate-600 dark:text-zinc-400 leading-relaxed",children:[e.jsx("strong",{children:"Recomendado (~1 min / 150 palabras):"})," Cada capa se genera en ~4 segundos sin saturar la API, permite preescuchar cada fragmento al instante y une todas las capas en un solo ",e.jsx("strong",{children:"WAV Master 24kHz"})," con micro-fades sin cortes."]})]})]})]}),e.jsxs("div",{className:"lg:col-span-7 space-y-5 bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs",children:[e.jsxs("div",{className:y("p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all",Qe>0?"bg-emerald-500/10 border-emerald-500/30":"bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border-indigo-500/25"),children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3",children:[e.jsx("div",{className:y("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",Qe>0?"bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300":"bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300"),children:e.jsx(Bt,{className:"w-4 h-4"})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5",children:Qe>0?e.jsx(e.Fragment,{children:e.jsxs("span",{children:[Qe," clave(s) API guardada(s) • Rotación y failover automático (429) activados"]})}):e.jsx(e.Fragment,{children:e.jsx("span",{children:"Motor Multi-Key Gemini TTS (Almacenamiento Local + Respaldo WAPPY)"})})}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400",children:Qe>0?"Si una clave alcanza el límite de cuota (429), WAPPY Studio salta instantáneamente a la siguiente sin interrumpir tu audio.":"Puedes agregar hasta 3 claves gratuitas de Google AI Studio para multiplicar tu cuota de síntesis de 60 min."})]})]}),e.jsx(d,{size:"sm",alwaysExpanded:!0,icon:e.jsx(Bt,{}),label:Qe>0?"Administrar Claves":"Configurar Claves",variant:"fuchsia",onClick:()=>{ct(""),R("keys"),Xe(!0)}})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2.5",children:[e.jsxs("h2",{className:"text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 shrink-0",children:[e.jsx(Ge,{className:"w-4 h-4 text-teal-500"}),"Texto a Sintetizar"]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 min-w-0",children:[e.jsxs("select",{defaultValue:"",onChange:t=>{const a=Ht.find(s=>s.title===t.target.value);a&&(Ie(a.text),a.text.includes("Alex:")&&a.text.includes("Sam:")&&Et(!0)),t.target.value=""},className:"min-w-0 max-w-[230px] sm:max-w-[260px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer",children:[e.jsxs("option",{value:"",disabled:!0,children:["📋 Cargar ejemplo (",Ht.length," plantillas)..."]}),Ht.map(t=>e.jsx("option",{value:t.title,children:t.title},t.title))]}),e.jsx(d,{size:"sm",alwaysExpanded:!0,icon:se?e.jsx(K,{className:"animate-spin"}):e.jsx(ut,{}),label:se?"Enriqueciendo...":"Mejorar Guion con IA",variant:"purple",disabled:se,onClick:Ar,title:`Enriquecer o generar guion con Vocal Bursts usando ${w}`}),C&&e.jsx(d,{size:"sm",icon:e.jsx(st,{}),label:"Limpiar",variant:"danger",onClick:()=>Ie("")})]})]}),(p||ne)&&e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5 pt-0.5",children:[e.jsx("span",{className:"text-[11px] font-extrabold text-purple-700 dark:text-purple-300 mr-1",children:"🎙️ Formatos Podcast (2 Voces):"}),ci.map(t=>e.jsx("button",{type:"button",onClick:()=>{Et(!0),Ie(t.text),Ct(t.style)},className:"px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-800 dark:text-purple-200 text-xs font-extrabold transition cursor-pointer shadow-2xs",children:t.label},t.id))]}),e.jsxs("div",{className:"p-3 bg-slate-50 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-xl space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px]",children:[e.jsxs("span",{className:"font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1",children:[e.jsx(Ce,{className:"w-3.5 h-3.5 text-amber-500"}),"Insertar Pausas, Énfasis y Efectos Vocales (Vocal Bursts) en el cursor:"]}),e.jsx("span",{className:"font-mono text-[10px] text-teal-700 dark:text-teal-400 font-bold",children:ee})]}),e.jsxs("div",{className:"flex flex-wrap gap-1.5",children:[qa.slice(0,3).map(t=>e.jsxs("button",{type:"button",onClick:()=>da(` ${t.tag} `),title:t.desc,className:"px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-mono transition flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx("span",{className:"text-indigo-700 dark:text-indigo-300 font-bold",children:t.tag}),e.jsxs("span",{className:"text-slate-600 dark:text-zinc-400 text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),rt.map(t=>e.jsxs("button",{type:"button",onClick:()=>da(` ${t.tag} `),title:t.description,className:"px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-teal-500/10 border border-slate-200 dark:border-slate-700 text-xs font-mono transition flex items-center gap-1 cursor-pointer shadow-2xs",children:[e.jsx("span",{className:"text-amber-700 dark:text-amber-400 font-bold",children:t.tag}),e.jsxs("span",{className:"text-slate-600 dark:text-zinc-400 text-[10px] font-sans",children:["(",t.label,")"]})]},t.tag)),e.jsx("button",{type:"button",onClick:()=>da(`
Alex: `),className:"px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold transition cursor-pointer",children:"Alex:"}),e.jsx("button",{type:"button",onClick:()=>da(`
Sam: `),className:"px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold transition cursor-pointer",children:"Sam:"})]})]}),e.jsx("textarea",{id:"wappy-studio-tts-editor",rows:10,value:C,onChange:t=>Ie(t.target.value),placeholder:"Escribe o pega aquí el guion para tu cápsula SST, curso de Academia WAPPY, podcast o audiolibro de hasta 1 hora...",className:"w-full bg-white dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 leading-relaxed resize-y min-h-[210px] shadow-inner"}),e.jsxs("div",{className:"bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between text-xs gap-2",children:[e.jsxs("div",{className:"flex items-center gap-3 text-slate-600 dark:text-slate-300",children:[e.jsxs("span",{children:["Palabras:"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white font-mono",children:Ta})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Caracteres:"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white font-mono",children:lr})]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:["Fragmentos estimados:"," ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400 font-mono",children:Pt})]})]}),e.jsxs("div",{className:"text-slate-900 dark:text-white font-semibold",children:["Duración estimada:"," ",e.jsxs("strong",{className:"text-amber-600 dark:text-amber-400 font-mono",children:["~",Kt," min"]})," ","/ 60 min máx"]})]}),e.jsx("div",{className:"w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300",style:{width:`${Math.min(100,Math.max(2,Math.round(Kt/60*100)))}%`}})})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1",children:[e.jsx(d,{alwaysExpanded:!0,icon:Ca?e.jsx(K,{className:"animate-spin"}):e.jsx(qs,{}),label:"Vista Previa Rápida (~1er fragmento)",variant:"amber",disabled:Ca||(oe==null?void 0:oe.status)==="processing"||!C.trim(),onClick:Tr}),e.jsx(d,{alwaysExpanded:!0,icon:(oe==null?void 0:oe.status)==="processing"?e.jsx(K,{className:"animate-spin"}):e.jsx(Ve,{}),label:Pt>1?`Generar Audio Completo (${Pt} fragmentos • ~${Kt} min)`:"Generar Audio Completo",variant:"teal",disabled:(oe==null?void 0:oe.status)==="processing"||Ca||!C.trim(),onClick:Er})]})]})]})]}),B==="video"&&e.jsxs("div",{className:"space-y-5 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"relative overflow-hidden rounded-2xl border border-emerald-500/35 dark:border-[#C7F303]/30 bg-gradient-to-r from-white via-emerald-50/40 to-teal-50/40 dark:from-[#0C192E] dark:via-[#091426] dark:to-[#0d2238] p-4 sm:p-5 shadow-md",children:[e.jsx("div",{className:"pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-[#C7F303]/15 blur-3xl"}),e.jsx("div",{className:"pointer-events-none absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-[#0D9488]/15 blur-3xl"}),e.jsxs("div",{className:"relative flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-4 border-b border-slate-200/80 dark:border-white/10",children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3.5 min-w-0",children:[e.jsx("div",{className:"w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C7F303]/25 via-emerald-500/15 to-teal-500/20 border border-emerald-500/40 dark:border-[#C7F303]/45 flex items-center justify-center shrink-0 shadow-inner",children:e.jsx(Ee,{className:"w-6 h-6 text-teal-700 dark:text-[#C7F303]"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsxs("span",{className:"inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#0E1300] text-[#C7F303] border border-[#C7F303]/40 text-[10px] font-mono font-extrabold uppercase tracking-wider",children:[e.jsx("span",{className:"w-2 h-2 rounded-full bg-[#C7F303] animate-ping"}),e.jsx("span",{children:"⚡ WAPPY VIDEO STUDIO • ANTIGRAVITY 60-FPS ENGINE"})]}),e.jsxs("span",{className:y("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border",ie?"bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300":"bg-purple-500/15 border-purple-500/35 text-purple-700 dark:text-purple-300"),children:[e.jsx("span",{className:y("w-1.5 h-1.5 rounded-full",ie?"bg-emerald-400 animate-pulse":"bg-purple-400")}),e.jsxs("span",{children:[ie?"SSE En Vivo":"Puente Listo"," •"," ",(I||"wpy_studio").slice(0,14),"…"]})]})]}),e.jsx("h2",{className:"text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-teal-700 to-emerald-600 dark:from-white dark:via-[#C7F303] dark:to-cyan-300 bg-clip-text text-transparent mt-1",children:"Estudio de Capas, Avatares 3D & Motion Graphics Sincronizados"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Elige una plantilla HyperFrames, personaliza tus escenas y efectos, y genera tu video en vivo con Antigravity."})]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 shrink-0",children:[e.jsx(d,{size:"sm",icon:e.jsx(Ee,{}),label:"Vertical 9:16 (Reels/TikTok)",variant:"teal",alwaysExpanded:!0,isActive:M==="9:16",onClick:()=>{Ma("9:16"),He("9:16",!!X,it)}}),e.jsx(d,{size:"sm",icon:e.jsx(Ha,{}),label:"Horizontal 16:9 (YouTube/LMS)",variant:"cyan",alwaysExpanded:!0,isActive:M==="16:9",onClick:()=>{Ma("16:9"),He("16:9",!!X,it)}}),e.jsx(d,{size:"sm",icon:e.jsx(Ft,{}),label:"Conectar mi Antigravity & Skills",variant:"purple",alwaysExpanded:!0,onClick:()=>{ct(""),R("antigravity"),Xe(!0)}})]})]}),e.jsxs("div",{className:"relative pt-3.5",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 mb-2.5",children:[e.jsxs("span",{className:"text-[11px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5",children:[e.jsx(Ce,{className:"w-3.5 h-3.5 text-teal-600 dark:text-[#C7F303]"}),"Plantillas Visuales Instantáneas (HyperFrames 60-FPS • Clic para aplicar al Lienzo)"]}),e.jsx("span",{className:"text-[10px] font-mono text-teal-700 dark:text-teal-300 font-bold",children:"Sincronización automática 1:1 con tu guion de voz"})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",children:pi.map((t,a)=>{const s=it===t.id,r=["from-amber-500/15 to-emerald-500/10 border-amber-500/30","from-cyan-500/15 to-indigo-500/10 border-cyan-500/30","from-teal-500/15 to-emerald-500/10 border-teal-500/30","from-purple-500/15 to-fuchsia-500/10 border-purple-500/30"];return e.jsxs("button",{type:"button",onClick:()=>{xr(t.id),He(M,!!X,t.id)},className:y("group relative p-3.5 rounded-xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between gap-2 hover:-translate-y-0.5",s?"bg-gradient-to-br from-emerald-500/15 via-teal-500/15 to-cyan-500/10 dark:from-[#C7F303]/15 dark:via-teal-500/15 dark:to-slate-900 border-emerald-500 dark:border-[#C7F303] ring-2 ring-emerald-500/25 dark:ring-[#C7F303]/30 shadow-md":y("bg-white/85 dark:bg-slate-900/80 hover:border-teal-500/50 dark:hover:border-[#C7F303]/50",r[a%r.length])),children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white truncate",children:t.name}),e.jsx("span",{className:"inline-block mt-1 text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-800 dark:text-[#C7F303] border border-teal-500/30 dark:border-[#C7F303]/30",children:t.badge})]}),e.jsx("div",{className:y("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-mono font-black border transition",s?"bg-[#C7F303] text-[#0E1300] border-[#C7F303] shadow-xs":"bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"),children:s?e.jsx(we,{className:"w-3.5 h-3.5 stroke-[3]"}):`0${a+1}`})]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-snug",children:t.description})]},t.id)})})]})]}),e.jsxs("div",{className:"w-full bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx(d,{icon:e.jsx(Ce,{}),label:`🎨 Estilo & Efectos (${pe.length} FX)`,variant:"purple",alwaysExpanded:!0,isActive:Je==="style",onClick:()=>ta("style")}),e.jsx(d,{icon:e.jsx(pa,{}),label:`⏱️ Escaleta & Tiempos (${he.length} escenas)`,variant:"amber",alwaysExpanded:!0,isActive:Je==="timeline",onClick:()=>ta("timeline")}),e.jsx(d,{icon:e.jsx(Ge,{}),label:`🎙️ Capas, Audio & Textos (${fe?"Subs ON":"Capas"})`,variant:"teal",alwaysExpanded:!0,isActive:Je==="layers",onClick:()=>ta("layers")}),e.jsx(d,{icon:e.jsx(Ks,{}),label:"</> Código HTML5 & GSAP",variant:"cyan",alwaysExpanded:!0,isActive:Je==="code",onClick:()=>ta("code")})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsxs("span",{className:"hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300",children:[e.jsx("span",{children:M}),e.jsx("span",{children:"•"}),e.jsx("span",{children:Le})]}),e.jsx(d,{size:"sm",icon:ht?e.jsx(K,{className:"animate-spin"}):e.jsx(ut,{}),label:"Actualizar Super-Prompt",variant:"indigo",alwaysExpanded:!0,disabled:ht,onClick:Is})]})]}),Je==="style"&&e.jsxs("div",{className:"space-y-5 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"space-y-2.5",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(Ce,{className:"w-3.5 h-3.5 text-purple-500"}),"1. Dirección de Arte Oficial (Brandbook WAPPY IA • 4 Estilos Horizontales)"]}),e.jsxs("span",{className:"text-[11px] font-mono text-purple-600 dark:text-purple-300 font-bold",children:["Paleta activa: ",Le]})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",children:ga.map(t=>{const a=Le===t.id,r={"dark-tech-hud":["#0C192E","#00D4FF","#C7F303"],"wappy-lima-oliva":["#C7F303","#0E1300","#0D9488"],"crema-editorial-sst":["#F6F5EF","#0D9488","#F59E0B"],"cielo-wappy-cloud":["#5BB8F5","#EAF6FE","#0D9488"]}[t.id]||["#0C192E","#C7F303"];return e.jsxs("button",{type:"button",onClick:()=>fs(t.id),className:y("p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 hover:-translate-y-0.5",a?"bg-purple-500/12 border-purple-500 text-slate-900 dark:text-white ring-2 ring-purple-500/25 shadow-xs":"bg-slate-50/80 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-purple-400"),children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0",children:[e.jsx("div",{className:"flex items-center -space-x-1 shrink-0",children:r.map(n=>e.jsx("span",{style:{backgroundColor:n},className:"w-4 h-4 rounded-full border border-white/60 dark:border-slate-700 shadow-2xs"},n))}),e.jsx("span",{className:"text-xs font-extrabold truncate",children:t.label})]}),e.jsx("span",{className:"text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shrink-0",children:a?"✓ ACTIVO":"60 FPS"})]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300 leading-snug",children:t.description})]},t.id)})})]}),e.jsxs("div",{className:"space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(ut,{className:"w-3.5 h-3.5 text-indigo-500"}),"2. Catálogo de Efectos Virales Antigravity (",pe.length," seleccionados)"]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-400",children:"Activa los efectos 3D, avatares y transiciones que se inyectarán en el Super-Prompt."})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx(d,{size:"sm",icon:e.jsx(we,{}),label:pe.length===qe.length?"Deseleccionar todos":"Seleccionar todos",variant:"indigo",alwaysExpanded:!0,onClick:()=>{pe.length===qe.length?Ia(["19-cover-2s"]):Ia(qe.map(t=>t.id))}}),e.jsx(d,{size:"sm",icon:e.jsx(Ce,{}),label:"Laboratorio FX →",variant:"amber",alwaysExpanded:!0,onClick:()=>Ne("lab")})]})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5",children:qe.map(t=>{const a=pe.includes(t.id);return e.jsxs("button",{type:"button",onClick:()=>Ms(t.id),className:y("p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 hover:-translate-y-0.5",a?"bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-teal-500/10 border-indigo-500/60 text-slate-900 dark:text-white ring-1 ring-indigo-500/30 shadow-2xs":"bg-slate-50/70 dark:bg-slate-900/70 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400"),children:[e.jsxs("div",{className:"flex items-start justify-between gap-1.5",children:[e.jsx("span",{className:"text-[11px] font-extrabold leading-tight",children:t.label}),e.jsx("span",{className:y("w-4 h-4 rounded-md flex items-center justify-center shrink-0 border",a?"bg-[#C7F303] text-[#0E1300] border-[#C7F303]":"bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"),children:a&&e.jsx(we,{className:"w-3 h-3 stroke-[3]"})})]}),e.jsx("div",{className:"flex items-center justify-between gap-1",children:e.jsx("span",{className:"text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20",children:t.category})}),e.jsx("p",{className:"text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight",children:t.description})]},t.id)})})]})]}),Je==="timeline"&&e.jsxs("div",{className:"space-y-3.5 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5",children:[e.jsx(pa,{className:"w-4 h-4 text-amber-500"}),"Escaleta de Escenas por Tiempos (",he.length," tramos)"]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-400",children:"Define qué suena y qué efecto visual aparece en cada tramo (`0.0s-2.0s` Portada Magnética, `2.0s-8.0s`, etc.)."})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsx(d,{size:"sm",icon:e.jsx(ut,{}),label:"Auto-Dividir Guion",variant:"amber",alwaysExpanded:!0,onClick:Mr}),e.jsx(d,{size:"sm",icon:e.jsx(we,{}),label:"Sincronizar al Guion TTS",variant:"teal",alwaysExpanded:!0,onClick:zr}),e.jsx(d,{size:"sm",icon:e.jsx(Ut,{}),label:"Añadir Escena",variant:"emerald",alwaysExpanded:!0,onClick:()=>Ue(t=>[...t,{id:`step-${Date.now()}`,timeRange:`${t.length*5}.0s-${(t.length+1)*5}.0s`,title:`Escena 0${t.length+1}`,narration:"[pausa 0.5s] Nueva frase sincronizada con la voz. <breath>",visualEffect:"07 Zoom-Through"}])})]})]}),e.jsxs("div",{className:"p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/25 flex flex-wrap items-center gap-1.5",children:[e.jsx("span",{className:"text-[10px] font-extrabold text-amber-800 dark:text-amber-300 mr-1",children:"Insertar en última escena:"}),qa.map(t=>e.jsx(d,{size:"sm",icon:e.jsx(Ut,{}),label:t.tag,variant:"amber",alwaysExpanded:!0,title:t.desc,onClick:()=>{Ue(a=>a.map((s,r)=>r===a.length-1?{...s,narration:`${s.narration.trim()} ${t.tag}`}:s))}},t.tag))]}),e.jsx("div",{className:"space-y-2.5",children:he.map((t,a)=>e.jsxs("div",{className:"p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center",children:[e.jsxs("div",{className:"lg:col-span-2 flex items-center gap-1.5",children:[e.jsxs("span",{className:"px-2 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-extrabold shrink-0",children:["#",a+1]}),e.jsx("input",{type:"text",value:t.timeRange,onChange:s=>{const r=s.target.value;Ue(n=>n.map((i,o)=>o===a?{...i,timeRange:r}:i))},className:"w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-amber-500/30 text-[11px] font-mono font-extrabold text-amber-700 dark:text-amber-300"})]}),e.jsx("div",{className:"lg:col-span-3",children:e.jsx("input",{type:"text",value:t.title,onChange:s=>{const r=s.target.value;Ue(n=>n.map((i,o)=>o===a?{...i,title:r}:i))},placeholder:"Título de escena...",className:"w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"})}),e.jsx("div",{className:"lg:col-span-3",children:e.jsx("select",{value:t.visualEffect,onChange:s=>{const r=s.target.value;Ue(n=>n.map((i,o)=>o===a?{...i,visualEffect:r}:i))},className:"w-full text-[11px] font-bold bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-2 py-1.5 text-indigo-700 dark:text-indigo-300",children:qe.map(s=>e.jsx("option",{value:s.label,children:s.label},s.id))})}),e.jsx("div",{className:"lg:col-span-3",children:e.jsx("input",{type:"text",value:t.narration,onChange:s=>{const r=s.target.value;Ue(n=>n.map((i,o)=>o===a?{...i,narration:r}:i))},placeholder:"Locución sincronizada de este tramo...",className:"w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white"})}),e.jsx("div",{className:"lg:col-span-1 flex justify-end",children:e.jsx(d,{size:"sm",icon:e.jsx(st,{}),label:"Quitar",variant:"danger",disabled:he.length<=1,onClick:()=>Ue(s=>s.filter((r,n)=>n!==a))})})]},t.id))})]}),Je==="layers"&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(Ee,{className:"w-3.5 h-3.5 text-blue-500"}),"1. Tu Video Base a Cámara (Opcional)"]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300 mt-1",children:us?`Activo: ${us}`:"Sube un MP4/WebM tuyo para superponerle capas HTML 60-FPS."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(Js,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Video MP4"}),e.jsx("input",{type:"file",accept:"video/mp4,video/webm,video/quicktime",onChange:Lr,className:"hidden"})]}),X&&e.jsx(d,{size:"sm",icon:e.jsx(st,{}),label:"Quitar",variant:"danger",alwaysExpanded:!0,onClick:()=>{URL.revokeObjectURL(X),ps(null),xs(""),He(M,!1)}})]})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(Ge,{className:"w-3.5 h-3.5 text-emerald-500"}),"2. Audio / Locución Sincronizada"]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300 mt-1",children:za?`Archivo: ${za}`:c?`Vinculado: ${c.title}`:"Usa el audio del Estudio TTS o sube un WAV/MP3."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("label",{className:"flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold cursor-pointer transition",children:[e.jsx(Js,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Subir Audio WAV/MP3"}),e.jsx("input",{type:"file",accept:"audio/*",onChange:Dr,className:"hidden"})]}),nt&&e.jsx(d,{size:"sm",icon:e.jsx(st,{}),label:"Quitar",variant:"danger",alwaysExpanded:!0,onClick:()=>{URL.revokeObjectURL(nt),ms(null),bs("")}})]})]}),e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white",children:"3. Textos & Subtítulos"}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsxs("label",{className:"inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:fe,onChange:t=>gs(t.target.checked),className:"rounded accent-teal-600"}),"Subs"]}),fe&&e.jsx("div",{className:"inline-flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px]",children:[{id:"bottom",label:"Abajo"},{id:"center",label:"Centro"},{id:"top",label:"Arriba"}].map(t=>e.jsx("button",{type:"button",onClick:()=>ls(t.id),className:y("px-1.5 py-0.5 rounded transition cursor-pointer",Ye===t.id?"bg-teal-600 text-white font-bold":"text-slate-600 dark:text-slate-300"),children:t.label},t.id))})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2",children:[e.jsx("input",{type:"text",value:It,onChange:t=>br(t.target.value),placeholder:"Insignia superior...",className:"w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"}),e.jsx("input",{type:"text",value:Ke,onChange:t=>gr(t.target.value),placeholder:"Titular principal...",className:"w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-bold"})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 pt-1",children:[e.jsx("div",{className:"flex items-center gap-1.5",children:["#c7f303","#14b8a6","#10b981","#6366f1","#f59e0b","#f43f5e"].map(t=>e.jsx("button",{type:"button",onClick:()=>fr(t),style:{backgroundColor:t},className:y("w-5 h-5 rounded-md border-2 transition cursor-pointer",Lt===t?"border-white ring-2 ring-teal-500 scale-110":"border-transparent opacity-80")},t))}),e.jsx(d,{size:"sm",icon:e.jsx(Gt,{}),label:"Aplicar al Lienzo",variant:"cyan",alwaysExpanded:!0,onClick:()=>He(M,!!X)})]})]})]}),Je==="code"&&e.jsxs("div",{className:"space-y-3 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5",children:[e.jsx(Ks,{className:"w-4 h-4 text-cyan-500"}),"Código Fuente HTML5 / Tailwind / GSAP en Vivo"]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-400",children:"Cualquier cambio aquí actualiza inmediatamente el Monitor en Vivo de abajo."})]}),e.jsx(d,{size:"sm",icon:e.jsx(Gt,{}),label:"Restaurar Plantilla Actual",variant:"amber",alwaysExpanded:!0,onClick:()=>He(M,!!X,it)})]}),e.jsx("textarea",{rows:12,value:Ze,onChange:t=>We(t.target.value),className:"w-full bg-[#070d17] text-emerald-300 font-mono text-[11px] p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:border-teal-500 leading-relaxed"})]})]}),e.jsxs("div",{className:"relative overflow-hidden rounded-2xl border border-purple-500/35 dark:border-purple-500/40 bg-gradient-to-r from-indigo-50/50 via-purple-50/40 to-cyan-50/40 dark:from-[#0a1324] dark:via-[#11122c] dark:to-[#091c29] p-4 sm:p-5 shadow-md space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[e.jsx("span",{className:"px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-800 dark:text-purple-200 font-mono text-[10px] font-extrabold uppercase tracking-wider",children:"✨ GENERADOR DE VIDEO CON IA Y ANTIGRAVITY • 3 PASOS"}),e.jsx("h3",{className:"text-sm sm:text-base font-extrabold text-slate-900 dark:text-white",children:"De tu Guion y Efectos al Video HTML5 + GSAP en Vivo"})]}),e.jsx("span",{className:"text-[11px] text-slate-600 dark:text-slate-300 font-semibold",children:"PASO 01 (Super-Prompt) → PASO 02 (Generar Video) → PASO 03 (Correcciones en Vivo)"})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch",children:[e.jsxs("div",{className:"rounded-2xl border border-indigo-500/35 bg-white/90 dark:bg-slate-900/90 p-4 flex flex-col justify-between gap-3 shadow-xs min-w-0 overflow-hidden",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("span",{className:"px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-extrabold",children:"PASO 01 • ARQUITECTURA 7 PIEZAS"}),e.jsxs("span",{className:"text-[10px] font-mono text-slate-500 dark:text-slate-400",children:[pe.length," FX • ",he.length," escenas"]})]}),e.jsx("h4",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:"Construir Super-Prompt Técnico (Timings + Efectos)"}),e.jsx("textarea",{rows:4,value:ot,onChange:t=>aa(t.target.value),placeholder:"Haz clic en '1. Generar Super-Prompt' para ensamblar las 7 Piezas, tiempos y efectos seleccionados...",className:"w-full bg-slate-50 dark:bg-slate-950 border border-indigo-500/30 rounded-xl p-2.5 text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-y font-mono leading-relaxed"})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-indigo-500/15",children:[e.jsx("span",{className:"text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 truncate",children:ht?"Construyendo Super-Prompt...":"1. Generar Super-Prompt"}),e.jsx(d,{size:"sm",icon:ht?e.jsx(K,{className:"animate-spin"}):e.jsx(ut,{}),label:ht?"Construyendo Super-Prompt...":"1. Generar Super-Prompt",variant:"indigo",disabled:ht,onClick:Is})]})]}),e.jsxs("div",{className:"rounded-2xl border border-purple-500/45 bg-gradient-to-b from-purple-500/10 via-white/95 to-teal-500/10 dark:from-purple-950/35 dark:via-slate-900/95 dark:to-teal-950/25 p-4 flex flex-col justify-between gap-3 shadow-xs ring-1 ring-purple-500/20 min-w-0 overflow-hidden",children:[e.jsxs("div",{className:"space-y-2.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("span",{className:"px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-800 dark:text-[#C7F303] font-mono text-[10px] font-extrabold",children:"PASO 02 • MOTOR 60-FPS + VOZ"}),e.jsxs("span",{className:"text-[10px] font-mono font-bold text-teal-600 dark:text-teal-300",children:[(V||20).toFixed(1),"s sincronizados"]})]}),e.jsx("h4",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:"Programar Video HTML5 + GSAP y Enviar al Lienzo"}),e.jsxs("div",{className:"p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-purple-500/25 space-y-1.5 text-[11px]",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("span",{className:"text-slate-500 dark:text-slate-400",children:"Formato & Arte:"}),e.jsxs("span",{className:"font-mono font-bold text-slate-900 dark:text-white truncate",children:[M," • ",Le]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("span",{className:"text-slate-500 dark:text-slate-400",children:"Audio vinculado:"}),e.jsx("span",{className:"font-bold text-teal-700 dark:text-teal-300 truncate max-w-[160px]",children:za||(c==null?void 0:c.title)||`Voz ${S}`})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("span",{className:"text-slate-500 dark:text-slate-400",children:"Destino automático:"}),e.jsx("span",{className:"font-bold text-purple-700 dark:text-purple-300 truncate",children:"Lienzo en Vivo + Biblioteca"})]})]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-purple-500/20",children:[e.jsx("span",{className:"text-[11px] font-extrabold text-purple-800 dark:text-purple-300 truncate",children:Dt?"Antigravity Programando...":"2. Enviar al Generador de Video"}),e.jsx(d,{size:"sm",icon:Dt?e.jsx(K,{className:"animate-spin"}):e.jsx(Ce,{}),label:Dt?"Antigravity Programando...":"2. Enviar al Generador de Video",variant:"purple",disabled:Dt,onClick:Ir})]})]}),e.jsxs("div",{className:"rounded-2xl border border-cyan-500/35 bg-white/90 dark:bg-slate-900/90 p-4 flex flex-col justify-between gap-3 shadow-xs min-w-0 overflow-hidden",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("span",{className:"px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-800 dark:text-cyan-300 font-mono text-[10px] font-extrabold",children:"PASO 03 • REFINAMIENTO EN VIVO"}),e.jsx(Gt,{className:"w-3.5 h-3.5 text-cyan-500"})]}),e.jsx("h4",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:"¿Deseas ajustar algo del video? Pide correcciones"}),e.jsx("div",{className:"flex flex-wrap gap-1",children:["Agranda los títulos en verde lima #C7F303","Añade Giro 3D en la escena 2","Fondo Dark Tech HUD #0C192E","Resalta más el titular de portada"].map(t=>e.jsxs("button",{type:"button",onClick:()=>vs(t),className:"px-2 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-[10px] font-semibold text-cyan-800 dark:text-cyan-300 cursor-pointer transition",children:["+ ",t]},t))}),e.jsx("input",{type:"text",value:Rt,onChange:t=>vs(t.target.value),onKeyDown:t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),Ls())},placeholder:"Escribe qué quieres cambiar y presiona Enter...",className:"w-full bg-slate-50 dark:bg-slate-950 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-cyan-500/15",children:[e.jsx("span",{className:"text-[11px] font-extrabold text-cyan-800 dark:text-cyan-300 truncate",children:sa?"Aplicando Correcciones...":"3. Enviar Correcciones a Antigravity"}),e.jsx(d,{size:"sm",icon:sa?e.jsx(K,{className:"animate-spin"}):e.jsx(ut,{}),label:sa?"Aplicando Correcciones...":"3. Enviar Correcciones a Antigravity",variant:"cyan",disabled:sa||!Rt.trim(),onClick:Ls})]})]})]})]}),e.jsxs("div",{className:"w-full bg-white dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2.5 min-w-0",children:[e.jsx("span",{className:y("w-3 h-3 rounded-full shrink-0",ue?"bg-amber-500 animate-ping":De?"bg-[#C7F303] animate-pulse":"bg-teal-500")}),e.jsx("h3",{className:"text-sm sm:text-base font-extrabold text-slate-900 dark:text-white",children:ue?`Editor Visual Interactivo (${M})`:`Monitor en Vivo & Lienzo Interactivo (${M})`}),e.jsxs("span",{className:"px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30",children:[M==="9:16"?"1080×1920 Vertical":"1920×1080 Horizontal"," • 60 FPS"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx(d,{size:"sm",icon:ds?e.jsx(K,{className:"animate-spin"}):e.jsx(Ge,{}),label:"Sincronizar Voz IA",variant:"purple",disabled:ds,onClick:Pr}),e.jsx(d,{size:"sm",icon:e.jsx(xa,{}),label:ue?"Salir de Edición":"Editar Lienzo",variant:"orange",isActive:ue,onClick:Vs}),e.jsx(d,{size:"sm",icon:yt?e.jsx(K,{className:"animate-spin"}):e.jsx(Ee,{}),label:"Renderizar .MP4",variant:"teal",disabled:yt,onClick:Ba}),e.jsx(d,{size:"sm",icon:Vt?e.jsx(K,{className:"animate-spin"}):e.jsx(mt,{}),label:"Descargar .HTML",variant:"green",disabled:Vt,onClick:Us}),e.jsx(d,{size:"sm",icon:e.jsx(Zs,{}),label:"Guardar en Biblioteca",variant:"indigo",onClick:()=>pt({},!1)}),e.jsx(d,{size:"sm",icon:e.jsx(Xs,{}),label:"Pantalla Completa",variant:"cyan",onClick:Os})]})]}),ue&&e.jsxs("div",{className:"p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in duration-150",children:[e.jsxs("span",{className:"text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5",children:[e.jsx(Qs,{className:"w-4 h-4 text-amber-500 shrink-0"}),"Arrastra cualquier elemento con el mouse • Doble clic sobre textos para editar en vivo"]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[e.jsx(d,{size:"sm",icon:e.jsx(qr,{}),label:"+ Texto",variant:"teal",onClick:()=>{var t,a;return(a=(t=z.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"text"},"*")}}),e.jsx(d,{size:"sm",icon:e.jsx(pa,{}),label:"+ Caja / Tarjeta",variant:"purple",onClick:()=>{var t,a;return(a=(t=z.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_ADD_ELEMENT",kind:"card"},"*")}}),e.jsx(d,{size:"sm",icon:e.jsx(Qs,{}),label:"Caja Padre",variant:"cyan",disabled:!ye,onClick:()=>{var t,a;return(a=(t=z.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_SELECT_PARENT"},"*")}}),e.jsx(d,{size:"sm",icon:e.jsx(qt,{}),label:"Duplicar",variant:"indigo",disabled:!ye,onClick:()=>{var t,a;return(a=(t=z.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DUPLICATE_SELECTED"},"*")}}),e.jsx(d,{size:"sm",icon:e.jsx(st,{}),label:"Eliminar",variant:"danger",disabled:!ye,onClick:()=>{var t,a;return(a=(t=z.current)==null?void 0:t.contentWindow)==null?void 0:a.postMessage({type:"STUDIO_DELETE_SELECTED"},"*")}}),e.jsx(d,{size:"sm",icon:e.jsx(we,{}),label:"Guardar Cambios",variant:"emerald",onClick:Rr})]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch",children:[e.jsx("div",{className:"lg:col-span-7 flex justify-center items-center bg-[#060d18] rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-inner overflow-hidden min-h-[480px]",children:e.jsxs("div",{ref:Ns,className:y("relative overflow-hidden bg-slate-950 shadow-2xl border border-white/10 transition-all duration-300",Da?"w-screen h-screen rounded-none border-0 flex flex-col items-center justify-between p-4 sm:p-6":y("rounded-2xl mx-auto flex items-center justify-center",M==="9:16"?"w-full max-w-[390px] aspect-[9/16] max-h-[640px]":"w-full max-w-[760px] aspect-[16/9] max-h-[520px] min-h-[300px]")),children:[e.jsxs("div",{className:y("relative overflow-hidden bg-slate-950",Da?M==="9:16"?"h-[calc(100vh-100px)] aspect-[9/16] max-w-[95vw] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-[min(94vw,calc((100vh-100px)*1.7778))] aspect-[16/9] max-h-[calc(100vh-100px)] rounded-2xl border border-white/15 shadow-2xl mx-auto my-auto":"w-full h-full"),children:[Te&&e.jsx("audio",{ref:le,src:Te,preload:"metadata",onTimeUpdate:t=>{var r,n;const a=t.currentTarget.currentTime,s=t.currentTarget.duration&&!isNaN(t.currentTarget.duration)?t.currentTarget.duration:V||20;Me(a),(n=(r=z.current)==null?void 0:r.contentWindow)==null||n.postMessage({type:"STUDIO_SYNC_TIME",currentTime:a,duration:s,playing:!t.currentTarget.paused&&!t.currentTarget.ended},"*")},onLoadedMetadata:t=>{t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&dt(t.currentTarget.duration)},onEnded:()=>{var t,a,s;Re(!1),(a=(t=z.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_PAUSE"},"*"),(s=me.current)==null||s.pause()}}),X&&e.jsx("video",{ref:me,src:X,width:M==="9:16"?1080:1920,height:M==="9:16"?1920:1080,muted:zt,playsInline:!0,loop:!0,preload:"metadata",onTimeUpdate:t=>{Te||Me(t.currentTarget.currentTime)},onLoadedMetadata:t=>{!Te&&t.currentTarget.duration&&!isNaN(t.currentTarget.duration)&&dt(t.currentTarget.duration)},className:"absolute inset-0 w-full h-full object-cover z-0"}),e.jsx("iframe",{ref:z,title:"WAPPY Studio HTML Canvas",srcDoc:kr,sandbox:"allow-scripts allow-same-origin",onLoad:()=>{var t,a,s,r,n,i;(a=(t=z.current)==null?void 0:t.contentWindow)==null||a.postMessage({type:"STUDIO_FIT_VIEWPORT"},"*"),ue?(r=(s=z.current)==null?void 0:s.contentWindow)==null||r.postMessage({type:"STUDIO_SET_EDIT_MODE",enabled:!0},"*"):De||(i=(n=z.current)==null?void 0:n.contentWindow)==null||i.postMessage({type:"STUDIO_PAUSE"},"*")},className:y("absolute inset-0 w-full h-full border-0 z-10",ue?"pointer-events-auto":"pointer-events-none")}),fe&&Fa&&e.jsx("div",{className:y("absolute inset-x-3 z-20 flex justify-center pointer-events-none",Ye==="top"?"top-16":Ye==="center"?"top-1/2 -translate-y-1/2":"bottom-5"),children:e.jsx("div",{className:"bg-[#050c12]/90 backdrop-blur-md border border-[#c7f303]/40 px-4 py-2.5 rounded-2xl shadow-2xl text-center max-w-[94%]",children:e.jsx("div",{className:"flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1",children:Fa.words.map((t,a)=>{const s=a===Fa.activeOffset;return e.jsx("span",{className:y("text-sm sm:text-base font-black uppercase tracking-wide transition-all duration-150",s?"text-[#080c04] scale-110 bg-[#c7f303] px-2 py-0.5 rounded-lg shadow-[0_0_14px_rgba(199,243,3,0.45)]":"text-white/95"),children:t},`${t}-${a}`)})})})})]}),Da&&e.jsxs("div",{className:"w-full max-w-3xl mx-auto mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/15 flex items-center gap-3 z-30 shadow-2xl",children:[e.jsx(d,{size:"sm",icon:De?e.jsx(wa,{}):e.jsx(Ve,{}),label:De?"Pausar":"Play",variant:"teal",onClick:Ds}),e.jsx(d,{size:"sm",icon:e.jsx(ya,{}),label:"Reiniciar",variant:"cyan",onClick:_a}),e.jsx("input",{type:"range",min:0,max:V||20,step:.1,value:lt,onChange:t=>Rs(parseFloat(t.target.value)),className:"flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"}),e.jsxs("span",{className:"text-xs font-mono font-bold text-slate-200 shrink-0",children:[lt.toFixed(1),"s / ",(V||20).toFixed(1),"s"]}),e.jsx(d,{size:"sm",icon:e.jsx(xa,{}),label:ue?"Editando":"Editar",variant:"orange",isActive:ue,onClick:Vs}),e.jsx(d,{size:"sm",icon:e.jsx(Ga,{}),label:"Salir",variant:"danger",onClick:Os})]})]})}),e.jsxs("div",{className:"lg:col-span-5 flex flex-col justify-between gap-4",children:[e.jsxs("div",{className:"p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5",children:[e.jsx(Ve,{className:"w-3.5 h-3.5 text-teal-500"}),"Transporte & Sincronía de Voz"]}),e.jsxs("span",{className:"text-xs font-mono font-extrabold text-teal-700 dark:text-teal-300 tabular-nums",children:[lt.toFixed(1),"s / ",(V||20).toFixed(1),"s"]})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx(d,{size:"sm",icon:De?e.jsx(wa,{}):e.jsx(Ve,{}),label:De?"Pausar Video":"Reproducir Video",variant:"teal",onClick:Ds}),e.jsx(d,{size:"sm",icon:e.jsx(ya,{}),label:"Reiniciar",variant:"cyan",onClick:_a}),X&&e.jsx(d,{size:"sm",icon:zt?e.jsx(sr,{}):e.jsx(bt,{}),label:zt?"Audio Base OFF":"Audio Base ON",variant:zt?"danger":"emerald",onClick:()=>mr(!zt)})]}),e.jsx("input",{type:"range",min:0,max:V||20,step:.1,value:lt,onChange:t=>Rs(parseFloat(t.target.value)),className:"w-full h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-600"}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1",children:[e.jsxs("span",{children:["Locución:"," ",e.jsx("strong",{className:"text-slate-900 dark:text-white",children:(c==null?void 0:c.voiceName)||S})]}),e.jsxs("span",{children:["Subtítulos:"," ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400",children:fe?`Activos (${Ye})`:"Ocultos"})]})]})]}),e.jsxs("div",{className:"p-4 rounded-2xl border bg-teal-500/10 border-teal-500/30 text-teal-900 dark:text-teal-100 flex flex-col justify-between gap-3",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-800 dark:text-teal-200",children:"WhatsApp • Celular • Reels • TikTok"}),e.jsx(Ee,{className:"w-4 h-4 text-teal-600 dark:text-teal-300 shrink-0"})]}),e.jsx("h4",{className:"text-xs sm:text-sm font-extrabold",children:"Descargar Video .MP4 (Todo Unido: HTML + Voz + Subtítulos)"}),e.jsx("p",{className:"text-[11px] text-teal-800/80 dark:text-teal-200/80 leading-snug",children:"Envía la composición a Antigravity / FFmpeg para ensamblar el archivo .MP4 final listo para redes."})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-teal-500/20",children:[e.jsx("span",{className:"text-xs font-extrabold text-teal-800 dark:text-teal-200 truncate",children:yt?"Renderizando Video .MP4...":"Descargar Video .MP4 (Todo Unido)"}),e.jsx(d,{size:"sm",icon:yt?e.jsx(K,{className:"animate-spin"}):e.jsx(Ee,{}),label:yt?"Renderizando Video .MP4...":"Descargar Video .MP4 (Todo Unido)",variant:"teal",disabled:yt,onClick:Ba})]})]}),e.jsxs("div",{className:"p-4 rounded-2xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100 flex flex-col justify-between gap-3",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-200",children:"Descarga Inmediata • Academia WAPPY LMS"}),e.jsx(ua,{className:"w-4 h-4 text-emerald-600 dark:text-emerald-300 shrink-0"})]}),e.jsx("h4",{className:"text-xs sm:text-sm font-extrabold",children:"Cápsula Interactiva HTML5 (Con Audio Embebido)"}),e.jsx("p",{className:"text-[11px] text-emerald-800/80 dark:text-emerald-200/80 leading-snug",children:"Descarga inmediata en 1 clic sin re-renderizar, lista para abrir en cualquier navegador o incrustar en LMS."})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-emerald-500/20",children:[e.jsx("span",{className:"text-xs font-extrabold text-emerald-800 dark:text-emerald-200 truncate",children:"Descargar .HTML Inmediato"}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(d,{size:"sm",icon:Vt?e.jsx(K,{className:"animate-spin"}):e.jsx(mt,{}),label:"Descargar .HTML Inmediato",variant:"green",disabled:Vt,onClick:Us}),e.jsx(d,{size:"sm",icon:e.jsx(qt,{}),label:"Copiar LMS",variant:"fuchsia",disabled:Vt,onClick:_r})]})]})]}),ue&&ye&&e.jsxs("div",{className:"p-3.5 bg-slate-50 dark:bg-slate-900/95 rounded-2xl border border-teal-500/40 space-y-2.5 animate-in fade-in duration-150",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300 flex items-center gap-1.5",children:[e.jsx(xa,{className:"w-3.5 h-3.5"}),"Elemento (<",ye.tagName,">)"]}),e.jsx(d,{size:"sm",icon:e.jsx(ya,{}),label:"Restablecer",variant:"teal",onClick:()=>et({dx:0,dy:0,scale:1})})]}),e.jsx("textarea",{rows:2,value:ye.text,onChange:t=>et({text:t.target.value}),className:"w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-teal-500 resize-none"}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2 items-center",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:["Letra (",ye.fontSize,"px)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(d,{size:"sm",icon:e.jsx(Ga,{}),label:"A-",variant:"neutral",onClick:()=>et({fontSize:Math.max(10,ye.fontSize-2)})}),e.jsx(d,{size:"sm",icon:e.jsx(Xs,{}),label:"A+",variant:"neutral",onClick:()=>et({fontSize:Math.min(96,ye.fontSize+2)})})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:["Escala (",ye.scale,"x)"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(d,{size:"sm",icon:e.jsx(Ga,{}),label:"-",variant:"neutral",onClick:()=>et({scale:Math.max(.5,Number((ye.scale-.1).toFixed(2)))})}),e.jsx(d,{size:"sm",icon:e.jsx(Ut,{}),label:"+",variant:"neutral",onClick:()=>et({scale:Math.min(2.5,Number((ye.scale+.1).toFixed(2)))})})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Texto"}),e.jsx("input",{type:"color",value:ye.color,onChange:t=>et({color:t.target.value}),className:"w-full h-8 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1",children:"Fondo"}),e.jsx("input",{type:"color",value:ye.backgroundColor,onChange:t=>et({backgroundColor:t.target.value}),className:"w-full h-8 rounded-lg cursor-pointer bg-transparent border border-slate-200 dark:border-slate-700"})]})]})]})]})]})]})]}),B==="lab"&&e.jsxs("div",{className:"space-y-6 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-xs",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("div",{className:"w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0",children:e.jsx(Ce,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:"Laboratorio de Voces, Pausas, Vocal Bursts & Efectos Antigravity"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Escucha y prueba las 30 voces en vivo, construye pausas/respiraciones y selecciona los efectos visuales de las Skills de Antigravity para tu video."})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(d,{size:"sm",icon:e.jsx(bt,{}),label:"SFX Whoosh",variant:"cyan",alwaysExpanded:!0,onClick:()=>Ya("whoosh")}),e.jsx(d,{size:"sm",icon:e.jsx(bt,{}),label:"SFX Pop",variant:"amber",alwaysExpanded:!0,onClick:()=>Ya("pop")}),e.jsx(d,{size:"sm",icon:e.jsx(bt,{}),label:"SFX Ding",variant:"emerald",alwaysExpanded:!0,onClick:()=>Ya("ding")})]})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs",children:[e.jsx("span",{className:"text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:"Modelo en el Laboratorio:"}),e.jsx("div",{className:"flex flex-wrap items-center gap-2",children:j.map(t=>{const a=ee===t.id;return e.jsxs("button",{type:"button",onClick:()=>{Oe(t.id),t.supportedVoices.includes(S)||gt(t.supportedVoices[0]||"Kore")},className:y("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer",a?"bg-teal-600 text-white border-teal-600 shadow-xs":"bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[t.name," (",t.supportedVoices.length," voces)"]},t.id)})})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsx("div",{className:"flex flex-wrap items-center justify-between gap-2",children:e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:"1. Efectos Vocales Orgánicos (Vocal Bursts en Vivo)"}),e.jsxs("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:["Escucha cómo suena cada etiqueta con la voz actual (",S,") o insértala en tu frase de prueba."]})]})}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:rt.map(t=>{const a=nr===t.tag;return e.jsxs("div",{className:"p-4 rounded-xl bg-slate-50 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400",children:t.tag}),e.jsx("p",{className:"text-xs font-bold text-slate-900 dark:text-white mt-0.5",children:t.label}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300",children:t.description})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[e.jsx(d,{size:"sm",icon:e.jsx(Ut,{}),label:"Insertar",variant:"amber",onClick:()=>{Sa(s=>`${s.trim()} ${t.tag} `)}}),e.jsx(d,{size:"sm",icon:a?e.jsx(K,{className:"animate-spin"}):e.jsx(Ve,{}),label:"Probar",variant:"indigo",disabled:a,onClick:async()=>{try{as(t.tag);const s=await fetch("/api/studio/tts/synthesize",{method:"POST",headers:H(g),body:JSON.stringify({voiceName:S,model:"gemini-3.8-flash-tts",stylePrompt:"Voz muy expresiva y natural.",text:`Escucha cómo suena este efecto natural en medio de una frase: ${t.tag} ¡Suena totalmente humano!`})}),r=await ve(s);r.audioBase64&&ce({base64:r.audioBase64,title:`Efecto ${t.tag} (${S})`,durationSeconds:r.durationSeconds,voiceName:S})}catch(s){h({type:"error",text:s.message})}finally{as(null)}}})]})]},t.tag)})})]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white",children:"2. Probador de Voces en Vivo y Constructor de Pausas / Énfasis"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:"Selecciona cualquier voz, escucha su timbre al instante, agrega pausas y envía tu configuración al Estudio de Voz o al Editor de Video."})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",children:["Voces activas: ",jt," de ",T.length]}),e.jsx(d,{size:"sm",icon:Ea===S?e.jsx(K,{className:"animate-spin"}):e.jsx(bt,{}),label:`Escuchar ${S}`,variant:"teal",alwaysExpanded:!0,disabled:Ea===S,onClick:()=>As(S)})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:["Selecciona la Voz (",jt," activas para ",U==null?void 0:U.name,")"]}),e.jsx("div",{className:"flex flex-wrap gap-2",children:T.map(t=>{const a=S===t.id,s=kt(t.id);return e.jsxs("button",{type:"button",onClick:()=>{s||Oe("gemini-3.8-flash-tts"),gt(t.id)},className:y("px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5",a?"bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/50 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-teal-400",!s&&"opacity-55"),children:[e.jsxs("span",{children:[t.name," (",t.gender,")"]}),s&&e.jsx(we,{className:"w-3 h-3 text-emerald-500"})]},t.id)})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5",children:"Prompt de Dirección (speechMetadata.style)"}),e.jsx("input",{type:"text",value:At,onChange:t=>ir(t.target.value),className:"w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsx("span",{className:"block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300",children:"Insertar Pausas, Respiración y Énfasis en el Texto de Prueba:"}),e.jsx("div",{className:"flex flex-wrap gap-1.5",children:qa.map(t=>e.jsxs("button",{type:"button",onClick:()=>Sa(a=>`${a.trim()} ${t.tag} `),title:t.desc,className:"px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold transition cursor-pointer",children:["+ ",t.label," ",e.jsxs("span",{className:"font-mono opacity-75",children:["(",t.tag,")"]})]},t.tag))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5",children:"Texto de Prueba"}),e.jsx("textarea",{rows:3,value:ze,onChange:t=>Sa(t.target.value),className:"w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2.5",children:[e.jsx(d,{size:"md",icon:Na?e.jsx(K,{className:"animate-spin"}):e.jsx(Ce,{}),label:Na?"Sintetizando en el Laboratorio...":"Sintetizar en el Laboratorio",variant:"indigo",alwaysExpanded:!0,disabled:Na||!ze.trim(),onClick:Cr}),e.jsx(d,{size:"md",icon:e.jsx(Ge,{}),label:"Llevar Frase y Voz al Estudio TTS",variant:"teal",alwaysExpanded:!0,onClick:()=>{Ie(ze),Ct(At),Ne("tts")}}),!p&&e.jsx(d,{size:"md",icon:e.jsx(Ee,{}),label:"Llevar al Editor de Video",variant:"purple",alwaysExpanded:!0,onClick:()=>{Ie(ze),Ct(At),Ne("video")}})]})]}),!p&&e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(ut,{className:"w-4 h-4 text-purple-500"}),"3. Catálogo de Efectos Visuales & Motion Graphics (Skills de Antigravity)"]}),e.jsxs("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:["Selecciona los efectos y transiciones que Antigravity encadenará a 60 FPS en tu video HTML + GSAP (",pe.length," activos)."]})]}),e.jsx(d,{size:"sm",icon:e.jsx(Ee,{}),label:`Ir al Editor de Video (${pe.length} efectos)`,variant:"purple",alwaysExpanded:!0,onClick:()=>Ne("video")})]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",children:ga.map(t=>{const a=Le===t.id;return e.jsxs("div",{className:y("p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition",a?"bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/30":"bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1",children:[e.jsx("span",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:t.label}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30",children:"60 FPS"})]}),e.jsx("p",{className:"text-[10px] font-mono text-indigo-600 dark:text-indigo-400 mt-1",children:t.colors}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300 mt-1",children:t.description})]}),e.jsx(d,{size:"sm",icon:a?e.jsx(we,{}):e.jsx(Ce,{}),label:a?"Dirección Activa":"Usar Dirección de Arte",variant:a?"teal":"purple",alwaysExpanded:!0,onClick:()=>fs(t.id)})]},t.id)})}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",children:qe.map(t=>{const a=pe.includes(t.id);return e.jsxs("div",{className:y("p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition",a?"bg-indigo-500/10 border-indigo-500/45 ring-1 ring-indigo-500/30":"bg-slate-50 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5",children:[e.jsx("span",{className:"text-xs font-extrabold text-slate-900 dark:text-white",children:t.label}),e.jsx("span",{className:"text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-300/50 dark:border-slate-700",children:t.category})]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug",children:t.description})]}),e.jsx("div",{className:"flex items-center justify-between gap-2 pt-1",children:e.jsx(d,{size:"sm",icon:a?e.jsx(we,{}):e.jsx(Ut,{}),label:a?"Activo en Editor de Video":"Agregar al Editor de Video",variant:a?"teal":"indigo",alwaysExpanded:!0,onClick:()=>Ms(t.id)})})]},t.id)})})]})]}),B==="library"&&e.jsxs("div",{className:"space-y-5 animate-in fade-in duration-200",children:[e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2",children:[e.jsx(ua,{className:"w-5 h-5 text-indigo-500"}),p?"Biblioteca de Podcasts y Locuciones 24 kHz":"Biblioteca de Audios y Videos HTML"]}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300",children:p?"Tus episodios de podcast y locuciones WAV a 24 kHz quedan guardados permanentemente para reproducirlos o descargarlos al instante.":"Tus locuciones WAV y tus videos HTML5 + GSAP quedan guardados permanentemente para reabrir en el editor, descargar el .HTML al instante o renderizar el .MP4 con Antigravity."})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[!p&&e.jsx("div",{className:"inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800",children:[{id:"all",label:`Todos (${Pe.length})`},{id:"audio",label:`🎙️ Audios (${Pe.filter(t=>t.kind!=="video").length})`},{id:"video",label:`🎬 Videos HTML (${Pe.filter(t=>t.kind==="video").length})`}].map(t=>e.jsx("button",{type:"button",onClick:()=>hr(t.id),className:y("px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer",La===t.id?"bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/40":"text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"),children:t.label},t.id))}),Pe.length>0&&e.jsx(d,{size:"sm",icon:e.jsx(st,{}),label:"Limpiar Historial",variant:"danger",alwaysExpanded:!0,onClick:()=>{window.confirm("¿Borrar todos los audios y videos guardados?")&&(ft([]),ri())}})]})]}),Pe.length===0?e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2",children:[e.jsx(Ge,{className:"w-10 h-10 mx-auto text-slate-400"}),e.jsx("p",{className:"text-sm font-bold text-slate-900 dark:text-white",children:p?"Aún no hay episodios de podcast en tu biblioteca":"Aún no hay audios ni videos en tu biblioteca"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto",children:p?'Genera tu primer episodio de podcast o locución en "1. Estudio de Podcast & Voz" y aparecerá aquí automáticamente.':'Genera una locución en "Estudio de Voz (TTS)" o un video en "Compositor de Video HTML" y aparecerán aquí automáticamente.'})]}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:Pe.filter(t=>p?t.kind!=="video":La==="video"?t.kind==="video":La==="audio"?t.kind!=="video":!0).map(t=>e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xs",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("h4",{className:"text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1",children:t.title}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[t.kind==="video"&&e.jsxs("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30",children:["🎬 VIDEO HTML ",t.aspectRatio||""]}),e.jsx("span",{className:"text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30",children:t.voiceName})]})]}),e.jsxs("div",{className:"flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300",children:[e.jsxs("span",{children:["⏱ ",bi(t.durationSeconds)]}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[t.wordCount," palabras"]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:gi(t.createdAt)})]}),t.stylePrompt&&e.jsxs("div",{className:"p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-[11px] italic text-slate-600 dark:text-slate-300 line-clamp-2",children:['"',t.stylePrompt,'"']})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800",children:[e.jsx("div",{className:"flex flex-wrap items-center gap-1.5",children:t.kind==="video"?e.jsx(d,{size:"sm",icon:e.jsx(xa,{}),label:"Abrir en Editor",variant:"orange",alwaysExpanded:!0,onClick:()=>Bs(t)}):e.jsxs(e.Fragment,{children:[e.jsx(d,{size:"sm",icon:e.jsx(Ve,{}),label:"Reproducir",variant:"teal",alwaysExpanded:!0,onClick:()=>Es(t)}),!p&&e.jsx(d,{size:"sm",icon:e.jsx(Ee,{}),label:"Usar en Video",variant:"purple",alwaysExpanded:!0,onClick:()=>Es(t,!0)})]})}),e.jsxs("div",{className:"flex flex-wrap items-center gap-1.5",children:[t.kind==="video"&&e.jsxs(e.Fragment,{children:[e.jsx(d,{size:"sm",icon:e.jsx(mt,{}),label:"Descargar .HTML",variant:"green",alwaysExpanded:!0,onClick:async()=>{if(t.capsuleKey){const a=await Nt(t.capsuleKey);if(a){wt(a,`wappy-video-${t.id}.html`);return}}if(t.htmlKey){const a=await Nt(t.htmlKey);if(a){wt(a,`wappy-video-${t.id}.html`);return}}h({type:"error",text:"No se encontró el archivo HTML guardado para este elemento."})}}),e.jsx(d,{size:"sm",icon:e.jsx(Ee,{}),label:t.mp4Key?"Descargar .MP4":"Renderizar .MP4",variant:"teal",alwaysExpanded:!0,onClick:async()=>{if(t.mp4Key){const a=await Nt(t.mp4Key);if(a){wt(a,`wappy-studio-reel-${t.id}.mp4`);return}}await Bs(t),setTimeout(()=>{Ba()},250)}})]}),t.kind!=="video"&&e.jsx(d,{size:"sm",icon:e.jsx(mt,{}),label:"Descargar WAV",variant:"green",alwaysExpanded:!0,onClick:async()=>{const a=await Cs(t);if(!a){h({type:"error",text:"Este audio ya no está disponible (se generó antes del guardado permanente). Vuelve a generarlo."});return}wt(a,`wappy-audio-${t.id}.wav`)}}),e.jsx(d,{size:"sm",icon:e.jsx(st,{}),label:"Eliminar",variant:"danger",onClick:()=>jr(t)})]})]})]},t.id))})]})]}),vr&&e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto",children:[e.jsxs("div",{className:"flex items-start justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0",children:e.jsx(Ft,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-extrabold text-slate-900 dark:text-white",children:"Enlace Personal Antigravity, Pack de 7 Skills & Claves IA"}),e.jsx("p",{className:"text-xs text-slate-600 dark:text-zinc-400",children:"Conecta tu propio Antigravity (con o sin cuenta en WAPPY), instala las 7 Skills de Video/Diseño y gestiona tus claves Gemini."})]})]}),e.jsx("button",{type:"button",onClick:()=>Xe(!1),className:"p-1.5 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-zinc-300 cursor-pointer",children:e.jsx(ha,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800",children:[e.jsxs("button",{type:"button",onClick:()=>R("antigravity"),className:y("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",G==="antigravity"?"bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(Ft,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"🔌 Mi Antigravity & Skills"})]}),e.jsxs("button",{type:"button",onClick:()=>R("keys"),className:y("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",G==="keys"?"bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(Bt,{className:"w-3.5 h-3.5"}),e.jsxs("span",{children:["Mis Claves Locales (",Qe,"/3)"]})]}),e.jsxs("button",{type:"button",onClick:()=>R("models"),className:y("py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5",G==="models"?"bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs":"text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"),children:[e.jsx(Ys,{className:"w-3.5 h-3.5"}),e.jsxs("span",{children:["Modelos WAPPY (",er.length,")"]})]})]}),G==="antigravity"?e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"p-4 rounded-2xl bg-purple-500/5 border border-purple-500/25 space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5",children:[e.jsx(Bt,{className:"w-3.5 h-3.5"}),"1. Tu Clave de Enlace Personal Antigravity"]}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5",children:I.startsWith("wpy_guest_")?"Clave automática de visitante (sin necesidad de cuenta). También puedes pegar aquí tu clave wpy_... si tienes cuenta en WAPPY.":"Clave personal vinculada a tu cuenta de WAPPY IA."})]}),e.jsxs("span",{className:y("text-[10px] font-extrabold px-2.5 py-1 rounded-xl border flex items-center gap-1.5",ie?"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30":"bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"),children:[e.jsx("span",{className:y("w-2 h-2 rounded-full",ie?"bg-emerald-500 animate-pulse":"bg-amber-500")}),ie?"Stream SSE Activo":"Listo para Enlazar"]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row items-stretch sm:items-center gap-2",children:[e.jsx("input",{type:"text",value:I,onChange:t=>{const a=t.target.value.trim();P(a);try{localStorage.setItem("wappy_antigravity_bridge_key",a)}catch{}},placeholder:"wpy_... o wpy_guest_...",className:"flex-1 px-3 py-2 rounded-xl border border-purple-500/30 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(d,{size:"sm",icon:ge==="key"?e.jsx(we,{}):e.jsx(qt,{}),label:ge==="key"?"¡Copiada!":"Copiar Clave",variant:"fuchsia",alwaysExpanded:!0,onClick:()=>{navigator.clipboard.writeText(I),k("key"),setTimeout(()=>k(null),2e3)}}),e.jsx(d,{size:"sm",icon:e.jsx(Gt,{}),label:"Sincronizar",variant:"cyan",onClick:()=>Ua(!0),title:"Generar o sincronizar clave de enlace Antigravity"})]})]})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/25 space-y-3.5",children:[e.jsx("div",{className:"flex flex-wrap items-start justify-between gap-2",children:e.jsxs("div",{children:[e.jsxs("span",{className:"text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5",children:[e.jsx(Ce,{className:"w-4 h-4 text-indigo-500"}),"2. 📦 Pack Importable de las 7 Skills de Diseño y Video WAPPY IA"]}),e.jsxs("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-relaxed",children:["Instala en tu propio Antigravity las ",e.jsx("strong",{children:"7 Skills Oficiales de Producción Audiovisual y UI de WAPPY IA"})," junto con el puente reactivo ",e.jsx("code",{className:"font-mono",children:"wappy-push-daemon.js"})," para que tu Antigravity programe videos HTML5 + GSAP a 60 FPS y los envíe directo a este Lienzo:"]})]})}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]",children:[{id:"protocolo-produccion-videos",desc:"Sistema de las 7 Piezas + Portada Magnética (2s)"},{id:"animaciones-17-efectos-reels",desc:"19 Efectos Virales y Transiciones 3D a 60 FPS"},{id:"animaciones-wappy-brand",desc:"Identidad WAPPY Lima #C7F303, Avatar 3D y Tenshi"},{id:"animaciones-dark-tech-hud",desc:"HUD Cyberpunk #0C192E + #00D4FF y Tarjetas de Cristal"},{id:"animaciones-explicativas-sst",desc:"Visor Normativo Subrayado (Decreto 1072 / Res. 0312 / GTC-45)"},{id:"hyperframes-motion-design",desc:"Motor GSAP Determinista y Sincronización Palabra a Palabra"},{id:"wappy-ui-design-system",desc:"Sistema de 14 Grupos Semánticos y Glassmorphism"}].map(t=>e.jsxs("div",{className:"p-2 rounded-xl bg-white/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2",children:[e.jsx(fa,{className:"w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5"}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("div",{className:"font-mono font-bold text-[10px] text-indigo-700 dark:text-indigo-300 truncate",children:t.id}),e.jsx("div",{className:"text-[10px] text-slate-600 dark:text-zinc-400 truncate",children:t.desc})]})]},t.id))}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 pt-1",children:[e.jsx(d,{size:"sm",icon:e.jsx(mt,{}),label:"Descargar Pack de Skills (.JSON Importable)",variant:"green",alwaysExpanded:!0,onClick:Or}),e.jsx(d,{size:"sm",icon:ge==="prompt"?e.jsx(we,{}):e.jsx(qt,{}),label:ge==="prompt"?"¡Prompt Copiado al Portapapeles!":"Copiar Prompt para Enviar Skills a Antigravity",variant:"indigo",alwaysExpanded:!0,onClick:()=>{navigator.clipboard.writeText(Fs()),k("prompt"),setTimeout(()=>k(null),2500),h({type:"success",text:"📋 ¡Prompt copiado! Pégalo en el chat de tu Antigravity para instalar automáticamente las 7 Skills y conectar el puente en vivo."})}}),e.jsx(d,{size:"sm",icon:e.jsx(Ft,{}),label:"Descargar Instalador 1-Clic (.command Mac / .bat Windows)",variant:"teal",alwaysExpanded:!0,onClick:$r})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{className:"flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400",children:[e.jsxs("span",{children:["Prompt listo para pegar en el Chat de tu Antigravity (incluye tu clave"," ",e.jsx("code",{className:"font-mono text-purple-600 dark:text-purple-400",children:I}),"):"]}),e.jsx("button",{type:"button",onClick:()=>{navigator.clipboard.writeText(Wa()),k("terminal"),setTimeout(()=>k(null),2e3)},className:"text-teal-600 dark:text-teal-400 hover:underline cursor-pointer",children:ge==="terminal"?"✓ Comando Terminal copiado":"Copiar solo comando Terminal"})]}),e.jsx("div",{className:"p-2.5 rounded-xl bg-slate-950 text-emerald-300 font-mono text-[10px] border border-slate-800 max-h-28 overflow-y-auto whitespace-pre-wrap select-all",children:Fs()})]})]}),e.jsx("div",{className:"flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800",children:e.jsx(d,{size:"sm",icon:e.jsx(we,{}),label:"Listo",variant:"teal",alwaysExpanded:!0,onClick:()=>Xe(!1)})})]}):G==="keys"?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs text-teal-900 dark:text-teal-200 leading-relaxed",children:["Obtén gratis tus claves en"," ",e.jsx("a",{href:"https://aistudio.google.com/app/apikey",target:"_blank",rel:"noopener noreferrer",className:"font-extrabold underline hover:text-teal-600",children:"Google AI Studio (aistudio.google.com)"}),". WAPPY Studio rotará automáticamente entre tus claves locales y el pool del servidor para evitar bloqueos por cuota 429 en locuciones de hasta 60 minutos."]}),e.jsx("div",{className:"space-y-2.5",children:na.map((t,a)=>e.jsxs("div",{className:"p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 space-y-1.5",children:[e.jsxs("div",{className:"flex items-center justify-between text-[11px] font-bold",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-slate-900 dark:text-white",children:t.label||`Clave Google Gemini #${a+1}`}),e.jsx("span",{className:y("text-[9px] font-extrabold px-1.5 py-0.5 rounded border",a===0?"bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30":"bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"),children:a===0?"Prioridad #1":`Failover #${a+1}`})]}),t.status==="valid"&&e.jsxs("span",{className:"text-emerald-700 dark:text-emerald-400 flex items-center gap-1",children:[e.jsx(fa,{className:"w-3.5 h-3.5"})," Activa y verificada"]}),t.status==="invalid"&&e.jsxs("span",{className:"text-rose-600 dark:text-rose-400 flex items-center gap-1",children:[e.jsx(Yt,{className:"w-3.5 h-3.5"})," Clave inválida o vencida"]})]}),e.jsx("input",{type:"password",value:t.key,onChange:s=>{const r=s.target.value;oa(n=>n.map((i,o)=>o===a?{...i,key:r,status:"unchecked"}:i))},placeholder:"AIzaSy...",className:"w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"})]},a))}),Ss&&e.jsx("div",{className:"p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-800 dark:text-emerald-300",children:Ss}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800",children:[e.jsx(d,{size:"sm",icon:e.jsx(st,{}),label:"Limpiar Claves",variant:"danger",onClick:()=>{oa([{key:"",label:"Clave Principal #1",status:"unchecked"},{key:"",label:"Clave Respaldo #2",status:"unchecked"},{key:"",label:"Clave Respaldo #3",status:"unchecked"}]),localStorage.removeItem(va),window.dispatchEvent(new CustomEvent("wappy-keys-updated")),ct("Claves eliminadas del navegador.")}}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(d,{size:"sm",icon:e.jsx(ha,{}),label:"Cerrar",variant:"neutral",onClick:()=>Xe(!1)}),e.jsx(d,{size:"sm",icon:Va?e.jsx(K,{className:"animate-spin"}):e.jsx(Zs,{}),label:Va?"Validando...":"Guardar y Validar",variant:"teal",disabled:Va,onClick:wr})]})]})]}):e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed",children:[e.jsx("strong",{children:"Ecosistema Oficial GOOGLE_MODELS de WAPPY:"})," Haz clic en cualquier modelo TTS o de Generación IA para activarlo de inmediato en el estudio."]}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1",children:er.map(t=>{const a=t.id.includes("tts"),s=t.id==="gemini-3.8-flash"||t.id==="gemini-3.6-flash"||t.id==="gemini-3.5-flash-lite",r=a&&ee===t.id||s&&w===t.id;return e.jsxs("div",{onClick:()=>{a?Oe(t.id):s&&ae(t.id)},className:y("p-3 rounded-xl border text-left transition flex flex-col justify-between",a||s?"cursor-pointer":"opacity-90",r?"bg-teal-50/90 dark:bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/30":"bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 hover:border-teal-400"),children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between gap-1.5 mb-1",children:[e.jsx("span",{className:"text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400",children:t.category}),e.jsx("span",{className:"text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25",children:t.badge})]}),e.jsx("div",{className:"font-mono text-xs font-extrabold text-slate-900 dark:text-white",children:t.id}),e.jsx("p",{className:"text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-snug",children:t.description})]}),(a||s)&&e.jsxs("div",{className:"mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[10px]",children:[e.jsx("span",{className:"text-slate-500 dark:text-zinc-400",children:a?"Motor de Voz TTS":"Motor IA Escenas/Guion"}),e.jsx("span",{className:y("font-extrabold",r?"text-emerald-700 dark:text-emerald-400":"text-indigo-600 dark:text-indigo-400"),children:r?"✓ En uso":"Usar este modelo →"})]})]},t.id)})}),e.jsx("div",{className:"flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800",children:e.jsx(d,{size:"sm",icon:e.jsx(we,{}),label:"Listo",variant:"teal",onClick:()=>Xe(!1)})})]})]})})]})}function fi({audioBase64:m,audioUrl:b,title:p,durationSeconds:u,voiceName:g,onSendToVideo:E}){const v=l.useRef(null),[$,be]=l.useState(!1),[F,D]=l.useState(0),[W,te]=l.useState(u||0),[ke,B]=l.useState(1),[N,w]=l.useState(1),[ae,se]=l.useState(!1),[je,G]=l.useState(!1),R=b||(m?`data:audio/wav;base64,${m}`:"");l.useEffect(()=>{be(!1),D(0),u&&u>0&&te(u)},[R,u]);const I=()=>{!v.current||!R||($?v.current.pause():v.current.play().catch(k=>console.error("Error al reproducir audio:",k)))},P=k=>{if(!v.current)return;const j=Math.max(1,W||v.current.duration||0),q=Math.max(0,Math.min(j,v.current.currentTime+k));v.current.currentTime=q,D(q)},ie=()=>{if(!v.current)return;const k=!ae;v.current.muted=k,se(k)},Z=k=>{if(!k||isNaN(k)||k<0)return"00:00";const j=Math.floor(k),q=Math.floor(j/60),T=j%60;return`${q.toString().padStart(2,"0")}:${T.toString().padStart(2,"0")}`},ge=async()=>{if(!R)return;const k=`${p.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"wappy-tts"}.wav`;try{if(R.startsWith("data:")||R.startsWith("blob:")){const T=document.createElement("a");T.href=R,T.download=k,document.body.appendChild(T),T.click(),document.body.removeChild(T);return}const q=await fetch(R,{headers:H()});if(q.ok){const T=await q.blob(),Se=URL.createObjectURL(T),re=document.createElement("a");re.href=Se,re.download=k,document.body.appendChild(re),re.click(),document.body.removeChild(re),setTimeout(()=>URL.revokeObjectURL(Se),4e3);return}}catch{}const j=document.createElement("a");j.href=R,j.download=k,document.body.appendChild(j),j.click(),document.body.removeChild(j)};return R?e.jsxs("div",{className:"bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 border border-indigo-500/25 dark:border-indigo-500/25 rounded-2xl p-5 shadow-xl space-y-3.5",children:[e.jsx("audio",{ref:v,src:R,preload:"metadata",onPlay:()=>be(!0),onPause:()=>be(!1),onEnded:()=>be(!1),onTimeUpdate:()=>{v.current&&D(v.current.currentTime)},onLoadedMetadata:()=>{var k;(k=v.current)!=null&&k.duration&&!isNaN(v.current.duration)&&te(v.current.duration)}}),e.jsxs("div",{className:"flex flex-wrap sm:flex-nowrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"}),e.jsx("h3",{className:"text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-xl",children:p})]}),e.jsxs("p",{className:"text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate",children:["Voz:"," ",e.jsx("span",{className:"font-semibold text-slate-700 dark:text-slate-200",children:g||"Kore"})," ","• Formato WAV 24kHz"]})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[m&&e.jsx(d,{size:"sm",icon:je?e.jsx(we,{}):e.jsx(qt,{}),label:je?"Copiado":"Copiar Base64",variant:"fuchsia",onClick:()=>{navigator.clipboard.writeText(m),G(!0),setTimeout(()=>G(!1),2e3)}}),E&&e.jsx(d,{size:"sm",icon:e.jsx(Ee,{}),label:"Llevar al Video",variant:"purple",alwaysExpanded:!0,onClick:E}),e.jsx(d,{size:"sm",icon:e.jsx(mt,{}),label:"Descargar WAV",variant:"green",alwaysExpanded:!0,onClick:ge})]})]}),e.jsx("div",{className:"flex items-center justify-between gap-1 h-12 bg-slate-100/90 dark:bg-slate-950/80 rounded-xl px-4 py-2 border border-slate-200/90 dark:border-slate-800/90 overflow-hidden",children:Array.from({length:42}).map((k,j)=>{const q=W>0?F/W:0,T=j/42,Se=T<=q,re=20+Math.sin(j*.4)*15+Math.cos(j*.9)*12,Tt=$?Math.max(15,re*(.8+Math.sin(Date.now()/200+j)*.4)):re;return e.jsx("div",{onClick:()=>{if(v.current&&W>0){const rt=T*W;v.current.currentTime=rt,D(rt)}},style:{height:`${Math.max(16,Math.min(95,Tt))}%`},className:y("w-1 rounded-full cursor-pointer transition-all duration-150",Se?"bg-gradient-to-t from-indigo-500 to-amber-400":"bg-slate-300 dark:bg-slate-800 hover:bg-slate-400 dark:hover:bg-slate-700")},j)})}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("input",{type:"range",min:0,max:Math.max(1,W),step:.1,value:Math.min(F,Math.max(1,W)),onChange:k=>{const j=parseFloat(k.target.value);v.current&&(v.current.currentTime=j),D(j)},className:"w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"}),e.jsxs("div",{className:"flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400",children:[e.jsx("span",{children:Z(F)}),e.jsx("span",{children:Z(W)})]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 pt-0.5",children:[e.jsxs("button",{type:"button",onClick:()=>{const k=[.75,1,1.25,1.5,2],j=k[(k.indexOf(ke)+1)%k.length];B(j),v.current&&(v.current.playbackRate=j)},title:"Cambiar velocidad de reproducción",className:"px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 rounded-lg border border-slate-200 dark:border-slate-700 transition shrink-0 cursor-pointer",children:[ke,"x"]}),e.jsxs("div",{className:"flex items-center gap-2 sm:gap-3",children:[e.jsx("button",{type:"button",onClick:()=>P(-10),title:"Retroceder 10 segundos",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer",children:e.jsx(ya,{className:"w-4 h-4"})}),e.jsx("button",{type:"button",onClick:I,className:"w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition transform active:scale-95 shrink-0 cursor-pointer",children:$?e.jsx(wa,{className:"w-5 h-5 fill-white"}):e.jsx(Ve,{className:"w-5 h-5 fill-white ml-0.5"})}),e.jsx("button",{type:"button",onClick:()=>P(10),title:"Adelantar 10 segundos",className:"p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer",children:e.jsx(Yr,{className:"w-4 h-4"})})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsx("button",{type:"button",onClick:ie,title:ae?"Activar sonido":"Silenciar",className:"p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer",children:ae||N===0?e.jsx(sr,{className:"w-4 h-4 text-rose-500"}):e.jsx(bt,{className:"w-4 h-4"})}),e.jsx("input",{type:"range",min:0,max:1,step:.05,value:ae?0:N,onChange:k=>{const j=parseFloat(k.target.value);w(j),se(j===0),v.current&&(v.current.volume=j,v.current.muted=j===0)},className:"hidden sm:block w-20 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"})]})]})]}):null}function ar(m){const b=Math.max(0,Math.round(m||0)),p=Math.floor(b/60),u=b%60;return`${p}m ${u.toString().padStart(2,"0")}s`}function hi({job:m,onPause:b,onResume:p,onCancel:u,onPlayChunk:g,onLoadMaster:E}){const v=m.status==="completed",$=m.status==="failed",be=m.status==="processing",F=m.status==="paused";return e.jsxs("div",{className:"bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:y("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",v?"bg-emerald-500/10 border-emerald-500/30 text-emerald-500":$?"bg-rose-500/10 border-rose-500/30 text-rose-500":"bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400"),children:be?e.jsx(K,{className:"w-5 h-5 animate-spin"}):v?e.jsx(fa,{className:"w-5 h-5"}):$?e.jsx(Yt,{className:"w-5 h-5"}):e.jsx(Ce,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("h4",{className:"text-sm font-bold text-slate-900 dark:text-white",children:v?"¡Audio de Larga Duración Completado!":$?"Error en la Generación":F?"Generación Pausada":`Generando fragmento ${m.currentChunkIndex+1} de ${m.totalChunks}...`}),e.jsx("span",{className:y("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border",v?"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25":$?"bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25":"bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 animate-pulse"),children:m.status})]}),e.jsxs("p",{className:"text-xs text-slate-500 dark:text-slate-400 mt-0.5",children:["Generados ",ar(m.generatedTotalSeconds)," de ~",ar(m.estimatedTotalSeconds)," estimados"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[be&&e.jsx(d,{size:"sm",icon:e.jsx(wa,{}),label:"Pausar",variant:"amber",alwaysExpanded:!0,onClick:b}),F&&e.jsx(d,{size:"sm",icon:e.jsx(Ve,{}),label:"Reanudar",variant:"teal",alwaysExpanded:!0,onClick:p}),!v&&!$&&e.jsx(d,{size:"sm",icon:e.jsx(ha,{}),label:"Cancelar",variant:"danger",onClick:u}),v&&e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx(d,{size:"sm",icon:e.jsx(Ve,{}),label:"Cargar en Reproductor",variant:"indigo",alwaysExpanded:!0,onClick:E}),e.jsxs("a",{href:m.downloadUrl||`/api/studio/tts/jobs/${m.id}/download`,download:`wappy-master-${m.id}.wav`,className:"inline-flex items-center gap-1.5 h-8 px-2.5 sm:h-9 sm:px-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-700 dark:text-green-300 text-xs font-bold tracking-wide transition-all duration-300 ease-in-out sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95",children:[e.jsx(mt,{className:"w-3.5 h-3.5 sm:w-4 sm:h-4"}),e.jsx("span",{children:"Descargar WAV Master"})]})]})]})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between text-xs font-medium",children:[e.jsx("span",{className:"text-slate-500 dark:text-slate-400",children:"Progreso general"}),e.jsxs("span",{className:"text-indigo-600 dark:text-indigo-400 font-mono font-bold",children:[m.progressPercent,"%"]})]}),e.jsx("div",{className:"w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800",children:e.jsx("div",{className:y("h-full transition-all duration-300",v?"bg-emerald-500":$?"bg-rose-500":"bg-gradient-to-r from-indigo-500 to-violet-500"),style:{width:`${Math.min(100,Math.max(0,m.progressPercent))}%`}})})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 mb-2",children:[e.jsxs("span",{className:"text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400",children:["Fragmentos del Audio (",m.completedChunks," / ",m.totalChunks,")"]}),e.jsx("span",{className:"text-[11px] text-slate-500 dark:text-slate-500",children:"Haz clic en un fragmento listo para preescucharlo"})]}),e.jsx("div",{className:"grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-18 gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/90 dark:border-slate-800/80 max-h-36 overflow-y-auto",children:m.chunks.map(D=>{const W=D.status==="completed",te=D.status==="processing",ke=D.status==="failed";return e.jsx("button",{type:"button",disabled:!W,onClick:()=>g(D),title:`Fragmento #${D.index+1}${D.wordCount?` (${D.wordCount} palabras)`:""}${W?` - ${D.durationSeconds||0}s [Haz clic para escuchar]`:""}`,className:y("h-7 rounded-md text-[10px] font-mono font-bold flex items-center justify-center transition-all border",W?"bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/30 cursor-pointer shadow-2xs":te?"bg-indigo-500/25 text-indigo-700 dark:text-indigo-200 border-indigo-500/50 animate-pulse":ke?"bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40":"bg-slate-200/60 dark:bg-slate-800/50 text-slate-500 border-slate-300/60 dark:border-slate-800 opacity-60"),children:W?e.jsx(bt,{className:"w-3.5 h-3.5"}):te?e.jsx(K,{className:"w-3.5 h-3.5 animate-spin"}):D.index+1},D.index)})})]}),m.failoverNotice&&e.jsxs("div",{className:"p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2",children:[e.jsx(Gt,{className:"w-4 h-4 text-amber-500 shrink-0"}),e.jsxs("span",{children:[e.jsx("strong",{children:"Rotación Automática 429:"})," ",m.failoverNotice]})]}),$&&m.error&&e.jsxs("div",{className:"p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2",children:[e.jsx(Yt,{className:"w-4 h-4 text-rose-500 shrink-0"}),e.jsx("span",{children:m.error})]})]})}export{ga as ANTIGRAVITY_ART_DIRECTIONS,qe as ANTIGRAVITY_EFFECTS_CATALOG,ui as DEFAULT_SCRIPT_STEPS,qa as PAUSE_AND_EMPHASIS_TAGS,er as WAPPY_GOOGLE_MODELS_ECOSYSTEM,Ki as default};
