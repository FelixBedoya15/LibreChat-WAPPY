import React, { useState, useRef } from 'react';
import {
  Play,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Edit3,
  Trash2,
} from 'lucide-react';

export interface PodcastShowPreset {
  id: string;
  category: 'daily' | 'investigacion' | 'cultura' | 'normativa';
  categoryLabel: string;
  badgeText: string;
  title: string;
  subtitle: string;
  hosts: string;
  duration: string;
  featured?: boolean;
  cardBgClass: string;
  textColorClass: string;
  subTextColorClass: string;
  badgeBgClass: string;
  playBtnClass: string;
  iconBoxClass: string;
  iconEmoji: string;
  voiceId: string;
  secondVoiceId: string;
  dualSpeaker: boolean;
  stylePrompt: string;
  topicPrompt: string;
  script: string;
}

export interface UserAudioCapsuleItem {
  id: string;
  title: string;
  createdAt: string;
  audioUrl?: string;
  durationSec?: number;
  voiceName?: string;
  scriptText?: string;
  stylePrompt?: string;
}

export const WAPPY_PODCAST_SHOWS: PodcastShowPreset[] = [
  {
    id: 'somos-sst-daily',
    category: 'daily',
    categoryLabel: 'CHARLAS 5 MIN',
    badgeText: 'EPISODIO 5+ MIN • 24KHZ WAV',
    title: 'Somos SST Daily',
    subtitle: 'Charlas de 5 Min & Liderazgo Preventivo de Campo',
    hosts: '5 min • Host 1 & 2 Dual',
    duration: '05:20',
    featured: true,
    cardBgClass:
      'bg-gradient-to-br from-teal-600 via-emerald-800 to-[#0c192e] border border-teal-400/40 shadow-lg',
    textColorClass: 'text-white',
    subTextColorClass: 'text-teal-200/85',
    badgeBgClass: 'bg-black/40 backdrop-blur-md text-[#c7f303] border border-[#c7f303]/30',
    playBtnClass: 'bg-[#c7f303] text-[#0e1300] shadow-lg shadow-[#c7f303]/30',
    iconBoxClass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
    iconEmoji: '🎙️',
    voiceId: 'Puck',
    secondVoiceId: 'Kore',
    dualSpeaker: true,
    stylePrompt:
      'Energético, cercano y motivador como un podcast matutino de liderazgo en seguridad industrial.',
    topicPrompt:
      'Charla matutina de 5 minutos sobre el autocuidado y cómo detectar el exceso de confianza antes de iniciar turno.',
    script: `Alex: ¡Buenos días equipo! Bienvenidos a un nuevo episodio de Somos SST Daily, el podcast oficial de liderazgo preventivo en terreno. <breath> Hoy arrancamos la jornada con una pregunta directa al corazón de nuestra operación: ¿cuántas veces hemos repetido exactamente la misma maniobra esta semana pensando que, porque ayer salió bien, hoy nada puede fallar?

Sam: ¡Qué gran punto para abrir turno, Alex! |mhm| Ese fenómeno tiene nombre y apellido en la ingeniería del comportamiento: se llama piloto automático por exceso de confianza. <breath> Cuando nuestro cerebro repite una tarea cien o doscientas veces sin incidentes, tiende a reducir la percepción del riesgo para ahorrar energía mental. Y justamente ahí, cuando creemos que dominamos el equipo con los ojos cerrados, es donde ocurren las desviaciones más críticas.

Alex: Totalmente cierto, Sam. En las estadísticas de Seguridad y Salud en el Trabajo bajo el Decreto 1072 y la Guía Técnica Colombiana GTC 45, vemos algo sorprendente: más del sesenta por ciento de los incidentes severos no le ocurren al trabajador nuevo en su primer día, sino al técnico experimentado que lleva años haciendo la labor y un día decide saltarse un paso porque "solo le tomará treinta segundos".

Sam: Exacto, Alex. <breath> Pensemos en tres ejemplos reales de nuestra operación diaria. Primero: subir los últimos tres peldaños de una escalera sin los tres puntos de apoyo porque llevamos una herramienta en la mano. Segundo: retirar momentáneamente una guarda de seguridad para destrabar un material sin aplicar bloqueo y etiquetado. Y tercero: operar montacargas o vehículos industriales mirando el celular durante dos segundos en un cruce de bodega.

Alex: Esos dos o tres segundos parecen inofensivos en el momento, pero cambian destinos enteros. <breath> Por eso hoy en Somos SST Daily queremos entrenar una herramienta práctica de cinco pasos llamada la Pausa de los Cinco Segundos antes de intervenir cualquier equipo o proceso. Sam, ¿cómo aplicamos esta pausa en piso de planta hoy mismo?

Sam: Es súper sencilla y poderosa, Alex. Paso número uno: detente físicamente a dos metros del punto de operación y respira profundo. <breath> Paso número dos: haz un barrido visual de trescientos sesenta grados desde el suelo hasta el techo buscando energías peligrosas, superficies húmedas, cargas suspendidas o tránsito de equipos. Paso número tres: pregúntate qué es lo peor que podría pasar en esta tarea si algo sale de control.

Alex: |yeah| Me encanta ese tercer paso porque despierta inmediatamente la atención consciente. ¿Y cuáles son los pasos cuatro y cinco, Sam?

Sam: El paso número cuatro es verificar tus barreras duras: ¿tengo el permiso de trabajo vigente, el bloqueo verificado con energía cero y mis elementos de protección personal bien ajustados? Y el paso número cinco es el liderazgo compartido: mirar a tu compañero de cuadrilla a los ojos y confirmar que ambos están sincronizados en la maniobra antes de mover la primera llave o encender el interruptor.

Alex: <laugh> Es impresionante cómo menos de un minuto de verificación consciente protege horas enteras de producción y, sobre todo, garantiza que al final del día todos regresemos completos a casa con nuestras familias. <breath> También quiero recordarles hoy que reportar una condición insegura no es quejarse ni frenar el trabajo; reportar a tiempo un cable pelado, una luminaria fundida o una baranda floja es un acto de valentía y compañerismo.

Sam: Así es, Alex. En nuestra cultura del Bioindividuo entendemos que cada trabajador es un líder de seguridad en su puesto. Si hoy notas fatiga, sueño acumulado o alguna distracción personal importante antes de iniciar una tarea de alto riesgo, levanta la mano y háblalo con tu supervisor o con el equipo SST. Ninguna meta operativa vale más que tu integridad física y mental.

Alex: Excelente reflexión para toda la cuadrilla. Antes de pasar a sus áreas, hagan hoy el compromiso de aplicar la Pausa de los Cinco Segundos, cuiden a su compañero de al lado y mantengan sus zonas de tránsito despejadas. <breath> ¡Gracias por escucharnos en Somos SST Daily! Que tengamos un turno productivo, atento y cien por ciento libre de accidentes.`,
  },
  {
    id: 'cero-accidentes',
    category: 'cultura',
    categoryLabel: 'ALTO RIESGO',
    badgeText: 'EPISODIO 5+ MIN • HOST 1 & 2',
    title: 'Cero Accidentes',
    subtitle: 'Cultura Preventiva & Cinco Reglas de Oro LOTO',
    hosts: '5.5 min • 24kHz WAV Master',
    duration: '05:35',
    featured: true,
    cardBgClass:
      'bg-gradient-to-br from-[#c7f303] via-[#9cc200] to-[#3a4a00] border border-[#c7f303]/60 shadow-lg',
    textColorClass: 'text-[#0e1300]',
    subTextColorClass: 'text-[#0e1300]/80 font-semibold',
    badgeBgClass: 'bg-[#0e1300]/85 backdrop-blur-md text-[#c7f303]',
    playBtnClass: 'bg-[#0e1300] text-[#c7f303] shadow-lg',
    iconBoxClass: 'bg-[#0e1300]/15 backdrop-blur-md border border-[#0e1300]/20 text-[#0e1300]',
    iconEmoji: '⛑️',
    voiceId: 'Orbit',
    secondVoiceId: 'Zephyr',
    dualSpeaker: true,
    stylePrompt:
      'Autoridad técnica, firme pero empático, estilo documental de ingeniería y prevención.',
    topicPrompt:
      'Las 5 Reglas de Oro en riesgo eléctrico y por qué jamás debemos omitir el bloqueo y etiquetado LOTO.',
    script: `Alex: Bienvenidos a Cero Accidentes, el espacio de ingeniería preventiva y control de energías peligrosas de WAPPY Podcast IA. <breath> Hoy vamos directo al corazón de las maniobras críticas en mantenimiento industrial y redes eléctricas: las Cinco Reglas de Oro y el protocolo de Bloqueo y Etiquetado LOTO.

Sam: Un tema de vida o muerte, Alex. <breath> En la industria moderna trabajamos todos los días con múltiples fuentes de energía: eléctrica, mecánica, hidráulica, neumática, térmica y química. El gran peligro de estas energías es que muchas veces son silenciosas e invisibles. Un cable energizado a cuatrocientos cuarenta voltios o una tubería presurizada lucen exactamente igual que cuando están apagados.

Alex: |mhm| Y ahí es donde nace la primera gran lección de este episodio: apagar un equipo desde el botón de control del tablero jamás equivale a aislar la energía. Cualquier pico de tensión, falla de un relé o un compañero que pase por el pasillo y presione el botón de arranque por error puede activar la máquina mientras las manos del técnico están adentro.

Sam: Por eso las Cinco Reglas de Oro son secuenciales e innegociables, Alex. <breath> Vamos a recorrerlas una por una con criterio de campo. Primera Regla de Oro: Corte efectivo de todas las fuentes de tensión y energía. Esto significa abrir los seccionadores, interruptores termomagnéticos o válvulas principales de alimentación con corte visible.

Alex: Segunda Regla de Oro: Bloqueo y etiquetado de los aparatos de corte, nuestro famoso sistema LOTO. <breath> Cada trabajador que interviene en la máquina debe colocar su propio candado personal y su tarjeta de identificación en la caja o pinza multiplicadora. Sam, explícale al equipo por qué el candado nunca se presta ni existe tal cosa como "el candado del jefe".

Sam: Porque la regla de oro de LOTO es "un hombre, un candado, una llave". Si tres técnicos están dentro de un mezclador o un tablero, debe haber tres candados puestos. Aunque dos terminen su parte del trabajo y se retiren, el equipo no puede energizarse físicamente hasta que el tercer técnico salga de la zona de peligro y retire su propio candado con su única llave.

Alex: Clarísimo. Pasemos a la Tercera Regla de Oro, que suele ser la barrera que salva vidas cuando hay retornos inesperados o bancos de condensadores: Verificar la ausencia de tensión o energía residual. <breath> Nunca asumimos que porque bajamos el breaker ya no hay corriente.

Sam: ¡Exacto! Para verificar ausencia de tensión aplicamos el método Probar-Verificar-Probar con un detector certificado a la categoría de tensión del circuito. Primero probamos el instrumento en una fuente conocida para confirmar que funciona y tiene batería; luego medimos entre todas las fases y entre cada fase y tierra en el punto de trabajo; y finalmente volvemos a probar el detector. Además, en sistemas mecánicos o hidráulicos, purgamos válvulas y liberamos resortes comprimidos hasta llegar a energía cero real.

Alex: Cuarta Regla de Oro: Poner a tierra y en cortocircuito todas las posibles fuentes de tensión en media y alta tensión, o asegurar mecánicamente las partes móviles con trabas físicas para que ni la gravedad ni una realimentación accidental puedan mover el sistema. <breath> Y finalmente, Quinta Regla de Oro: Delimitar y señalizar la zona de trabajo.

Sam: La señalización protege tanto a quienes están adentro de la maniobra como a quienes transitan por la planta. Conos, cintas de peligro, barreras dieléctricas y avisos claros evitan que personal no autorizado ingrese al radio de arco eléctrico o de movimiento mecánico.

Alex: Recordemos siempre esta máxima en cada turno: ningún mantenimiento urgente justifica omitir cinco minutos de bloqueo seguro. Un candado puesto a tiempo preserva tu vida y la tranquilidad de toda tu familia. ¡Gracias por acompañarnos en Cero Accidentes!`,
  },
  {
    id: 'cronicas-atel',
    category: 'investigacion',
    categoryLabel: 'CASOS REALES',
    badgeText: 'EPISODIO 5+ MIN • DRAMATIZADO',
    title: 'Crónicas ATEL',
    subtitle: 'Investigación de Incidentes Reales & Causas Raíz',
    hosts: '5.5 min • Voces Expresivas',
    duration: '05:30',
    cardBgClass:
      'bg-gradient-to-br from-cyan-700 via-slate-900 to-[#0c192e] border border-cyan-400/30 shadow-lg',
    textColorClass: 'text-white',
    subTextColorClass: 'text-cyan-200/80',
    badgeBgClass: 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30',
    playBtnClass: 'bg-[#00d4ff] text-[#0c192e] shadow-lg shadow-cyan-500/30',
    iconBoxClass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
    iconEmoji: '⚡',
    voiceId: 'Fenrir',
    secondVoiceId: 'Aoede',
    dualSpeaker: true,
    stylePrompt:
      'Narrativo, envolvente estilo crónica periodística con reflexión técnica sobre causas raíz.',
    topicPrompt:
      'Caso real de investigación de accidente por falta de aseguramiento en mantenimiento mecánico y lecciones aprendidas.',
    script: `Alex: Eran las cuatro y quince de la tarde de un viernes en la línea tres de envasado industrial. <breath> Faltaban apenas cuarenta y cinco minutos para el cierre de turno semanal cuando una alarma de presión detuvo la banda transportadora principal. Bienvenidos a Crónicas ATEL, el podcast donde reconstruimos incidentes reales bajo la Resolución 1401 para descubrir sus verdaderas causas raíz y evitar que se repitan.

Sam: En cada investigación de accidentes de trabajo que analizamos, Alex, descubrimos que una lesión grave nunca es producto de la mala suerte ni de un único hecho aislado. <breath> Como explica el modelo del queso suizo de James Reason y la metodología del árbol de causas, detrás de cada evento hay una cadena de pequeñas decisiones, presiones de tiempo y barreras omitidas que se alinean en el momento menos pensado.

Alex: Reconstruyamos lo que ocurrió aquella tarde en la planta. El operador líder, un técnico con nueve años de experiencia y excelente desempeño, notó que una válvula neumática de retorno se había quedado trabada por residuo de producto. El procedimiento estándar exigía cerrar la alimentación de aire comprimido, despresurizar el pulmón secundario y solicitar acompañamiento de mantenimiento.

Sam: Pero en la mente del operador apareció el atajo más peligroso de la industria: "Son solo dos minutos, si llamo a mantenimiento nos dan las seis de la tarde y perdemos el lote". <breath> Sin despresurizar la línea de noventa libras por pulgada cuadrada, introdujo una llave inglesa directamente por la abertura lateral para destrabar el actuador.

Alex: En el instante en que el residuo cedió, la presión acumulada en el cilindro liberó el brazo neumático a toda velocidad, atrapando la herramienta y generando una fractura en la mano derecha del trabajador. <breath> Sam, cuando el equipo investigador del COPASST y el profesional SST se reunieron al día siguiente, ¿cuál habría sido el error más fácil pero más inútil en esa investigación?

Sam: El error clásico habría sido escribir en el informe: "Causa del accidente: acto inseguro del trabajador por exceso de confianza" y cerrar el caso con un llamado de atención. |mhm| Si una empresa se queda en culpar a la persona, deja intactas las trampas operativas y tarde o temprano otro trabajador sufrirá el mismo accidente.

Alex: ¡Totalmente! Por eso aplicamos los Cinco Porqués y el análisis de factores de trabajo y factores personales. ¿Por qué el trabajador metió la mano sin despresurizar? Porque la válvula de corte y purga estaba ubicada a veinticinco metros de distancia, detrás de unas estibas de materia prima que dificultaban el paso.

Sam: Y sigamos preguntando por qué, Alex. <breath> ¿Por qué la válvula se trababa tres veces por semana? Porque el filtro decantador de la línea llevaba dos meses sin recambio preventivo. ¿Y por qué la guarda lateral permitía meter la mano con la máquina energizada? Porque carecía de un sensor de enclavamiento magnético que cortara el aire al abrir la compuerta.

Alex: ¡Miren cómo cambia toda la perspectiva cuando investigamos con rigor técnico! Lo que al principio parecía una simple imprudencia individual resultó tener cuatro causas raíz sistémicas: falta de mantenimiento preventivo en el filtro, ubicación inaccesible de la válvula de purga, ausencia de enclavamiento en la guarda y presión por cumplir la meta del viernes antes de las cinco de la tarde.

Sam: Cuando la empresa implementó los controles de ingeniería —reubicando la válvula de purga a un metro del equipo, instalando el sensor de puerta y cambiando el filtro— no solo eliminaron el riesgo de atrapamiento a cero, sino que además aumentaron la eficiencia de la línea porque dejó de atascarse cada semana.

Alex: Esa es la verdadera esencia de Crónicas ATEL y de la seguridad moderna: no buscamos culpables, diseñamos sistemas a prueba de fallos donde hacer el trabajo de forma segura sea siempre el camino más fácil y natural. ¡Nos escuchamos en el próximo episodio!`,
  },
  {
    id: 'frecuencia-bioindividuo',
    category: 'cultura',
    categoryLabel: 'PSICOSOCIAL',
    badgeText: 'EPISODIO 5+ MIN • SALUD MENTAL',
    title: 'Frecuencia Bioindividuo',
    subtitle: 'Salud Mental, Fatiga Laboral & Higiene del Sueño',
    hosts: '5 min • Voz Cálida IA',
    duration: '05:10',
    cardBgClass:
      'bg-gradient-to-br from-emerald-600 via-teal-900 to-[#091526] border border-emerald-400/30 shadow-lg',
    textColorClass: 'text-white',
    subTextColorClass: 'text-emerald-200/80',
    badgeBgClass: 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30',
    playBtnClass: 'bg-[#c7f303] text-[#0e1300] shadow-lg shadow-[#c7f303]/30',
    iconBoxClass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
    iconEmoji: '🧠',
    voiceId: 'Leda',
    secondVoiceId: 'Puck',
    dualSpeaker: true,
    stylePrompt:
      'Cálida, serena, inspiradora y empática, ideal para bienestar psicosocial y pausas activas.',
    topicPrompt:
      'Episodio de bienestar sobre higiene del sueño, manejo de fatiga laboral y prevención del riesgo psicosocial.',
    script: `Alex: Respira profundo por un instante y suelta la tensión de tus hombros. <breath> Bienvenidos a Frecuencia Bioindividuo, el espacio de salud mental, neurociencia aplicada y bienestar integral de WAPPY Podcast IA. Hoy vamos a conversar sobre un factor invisible que determina nuestra atención, nuestro estado de ánimo y nuestra seguridad en el trabajo: la fatiga cognitiva y la calidad de nuestro descanso.

Sam: Qué necesario es abrir esta conversación, Alex. <breath> En la metodología del Bioindividuo y bajo los lineamientos de la Resolución 2764 sobre batería de riesgo psicosocial, entendemos que el ser humano no se divide en dos personas distintas: una que vive en su casa y otra que entra por la portería de la empresa. Nuestras emociones, nuestras horas de sueño y nuestra carga mental viajan con nosotros a cada tarea.

Alex: |mhm| Y los estudios de medicina laboral muestran un dato impactante: llevar dieciocho horas continuas sin dormir o acumular una semana durmiendo menos de cinco horas por noche reduce nuestros reflejos y nuestra capacidad de concentración al mismo nivel que tener alcohol en la sangre.

Sam: Así es, Alex. Cuando tenemos fatiga acumulada, el lóbulo prefrontal del cerebro —que es nuestro centro de toma de decisiones, cálculo de distancia y control de impulsos— empieza a experimentar micro-sueños de uno a tres segundos sin que siquiera nos demos cuenta. En una oficina eso puede significar enviar un correo equivocado, pero al volante de un vehículo o frente a una máquina rotativa puede ser crítico.

Alex: Hablemos entonces de herramientas prácticas y cotidianas. Sam, ¿cuáles son los cuatro pilares que podemos aplicar desde hoy tanto durante la jornada laboral como al llegar a casa para proteger nuestra energía mental y física?

Sam: El primer pilar ocurre durante el turno y se llama Micro-Recuperación Consciente. <breath> Nuestro cerebro trabaja en ciclos de noventa minutos de alta concentración seguidos de una caída natural de alerta. Tomar tres minutos cada dos horas para levantarse del puesto, caminar, hidratarse con agua pura, mirar un punto lejano a más de seis metros para relajar el enfoque ocular y hacer tres respiraciones diafragmáticas reinicia por completo el sistema nervioso.

Alex: Excelente. ¿Y cuál es el segundo pilar cuando trabajamos bajo alta demanda o presión operativa?

Sam: El segundo pilar es la Higiene de Atención: evitar la multitarea fragmentada. Cuando intentamos responder mensajes del celular mientras operamos un proceso o llenamos un permiso de trabajo, elevamos el cortisol —la hormona del estrés— hasta un cuarenta por ciento más. Hacer una sola tarea crítica a la vez con presencia plena disminuye el agotamiento mental al final de la tarde.

Alex: |yeah| Eso nos lleva al tercer pilar al terminar la jornada: el Ritual de Desconexión y Sueño Reparador. <breath> Hoy sabemos que la luz azul de las pantallas vista justo antes de dormir bloquea la secreción de melatonina durante más de dos horas.

Sam: Exacto. Si apagamos o dejamos el celular fuera de la cama treinta minutos antes de dormir, mantenemos la habitación fresca y oscura, y evitamos comidas pesadas o cafeína en las últimas horas de la tarde, le permitimos al cerebro entrar en sueño profundo, que es cuando realmente se reparan los tejidos musculares y se limpia la fatiga neuronal.

Alex: Y el cuarto pilar es la Comunicación Empática en equipo: nunca callar cuando nos sentimos desbordados o agotados. Hablar a tiempo con tu líder o con el área de Seguridad y Salud en el Trabajo es señal de madurez profesional. <breath> Cuidar tu mente y tu descanso es el primer acto de prevención. ¡Gracias por sintonizar Frecuencia Bioindividuo!`,
  },
  {
    id: 'alturas-15-metros',
    category: 'normativa',
    categoryLabel: 'TRABAJO EN ALTURAS',
    badgeText: 'EPISODIO 5+ MIN • RES. 4272',
    title: 'A 15 Metros: Alturas',
    subtitle: 'Inspección de Arnés, Eslingas y Requerimiento de Claridad',
    hosts: '5 min • Host 1 & 2 Dual',
    duration: '05:15',
    cardBgClass:
      'bg-gradient-to-br from-amber-500 via-orange-700 to-[#1f1206] border border-amber-400/40 shadow-lg',
    textColorClass: 'text-white',
    subTextColorClass: 'text-amber-100/85',
    badgeBgClass: 'bg-black/45 backdrop-blur-md text-amber-300 border border-amber-300/30',
    playBtnClass: 'bg-[#c7f303] text-[#0e1300] shadow-lg',
    iconBoxClass: 'bg-white/15 backdrop-blur-md border border-white/20 text-white',
    iconEmoji: '🧗',
    voiceId: 'Charon',
    secondVoiceId: 'Kore',
    dualSpeaker: true,
    stylePrompt: 'Directo, práctico y enfocado en maniobras de trabajo seguro en alturas.',
    topicPrompt: 'Inspección preoperacional de arnés de cuerpo completo y cálculo de requerimiento de claridad.',
    script: `Alex: Antes de subir el primer peldaño de un andamio, una escalera o una estructura elevada, hablemos de lo único que te conecta a la vida cuando tus pies se separan del suelo: tu sistema de protección contra caídas. <breath> Bienvenidos a A Quince Metros: Alturas, la serie técnica de WAPPY Podcast IA alineada con la Resolución 4272 de Colombia.

Sam: Un saludo para todos los trabajadores autorizados, coordinadores de alturas y supervisores en campo, Alex. <breath> Bajo la Resolución 4272, toda actividad realizada a dos metros o más —o incluso a menor altura si existe un vacío o riesgo de caída crítica— exige planeación rigurosa, permiso de trabajo verificado en el sitio y un sistema certificado de prevención y detención de caídas.

Alex: Hoy vamos a profundizar en dos puntos donde suelen presentarse los errores más graves en obra y en planta: primero, la inspección preoperacional real del arnés y la eslinga; y segundo, el cálculo del requerimiento de claridad. Sam, ¿cómo hacemos una inspección preoperacional honesta y no simplemente llenar "bueno, bueno, bueno" en la planilla?

Sam: |mhm| Todo empieza sosteniendo el arnés por la argolla dorsal en D y sacudiéndolo suavemente para que las correas caigan en su forma natural. Primero revisamos todas las reatas centímetro a centímetro con las manos y la vista: buscamos cortes, fibras deshilachadas, quemaduras por chispas de soldadura, manchas de pintura, solventes o ácidos que cristalizan el polímero y le quitan resistencia.

Alex: ¡Importantísimo el detalle de la pintura y los químicos! Muchos trabajadores marcan su arnés con marcador permanente o pintura sin saber que los solventes debilitan las fibras textiles. ¿Qué revisamos después en las costuras y herrajes, Sam?

Sam: Revisamos las costuras de seguridad, que siempre vienen en hilo de color contrastante precisamente para detectar si hay una sola hebra suelta. Luego verificamos el testigo o indicador de impacto en la banda dorsal: si ese pliegue está roto o desplegado, significa que el arnés ya detuvo una caída y debe retirarse inmediatamente de servicio. Y en las argollas y hebillas metálicas comprobamos que no haya corrosión, fisuras ni deformaciones, y que los ganchos de la eslinga tengan su doble seguro automático cerrando al cien por ciento.

Alex: Ahora pasemos al segundo gran tema de hoy: el famoso Requerimiento de Claridad o espacio libre de caída. <breath> ¿Por qué un trabajador puede tener el mejor arnés certificado, estar anclado y aun así golpear el piso si trabaja a tres o cuatro metros de altura?

Sam: Porque cuando usamos una eslinga con absorbedor de energía de uno punto ochenta metros anclada a la altura de los pies o la cintura, debemos sumar cuatro distancias: primero, el metro ochenta de la eslinga; segundo, hasta uno punto veinte metros que se despliega el paquete absorbedor de impacto; tercero, la estatura del trabajador desde los pies hasta la argolla dorsal, que ronda un metro cincuenta; y cuarto, el margen de seguridad reglamentario de al menos sesenta centímetros a un metro.

Alex: ¡Hagamos esa suma mentalmente, equipo! Uno ochenta más uno veinte son tres metros, más uno cincuenta son cuatro metros y medio, más el margen de seguridad superamos los cinco metros con treinta centímetros de requerimiento de claridad.

Sam: Exactamente, Alex. Si estamos trabajando a tres metros y medio de altura con una eslinga estándar con absorbedor, el trabajador tocaría el suelo antes de que el absorbedor termine de abrirse. Por eso en bajas alturas debemos anclarnos siempre por encima de la cabeza con factor de caída cero o utilizar líneas de vida autorretráctiles certificadas que frenan en pocos centímetros.

Alex: Y nunca olvidemos el plan de rescate activo y el acompañante permanente en piso: un trabajador suspendido en su arnés después de una caída puede desarrollar síndrome del arnés o trauma por suspensión en menos de diez a quince minutos. <breath> Planea tu ascenso, calcula tu claridad y verifica cada hebilla. ¡Gracias por escucharnos en A Quince Metros!`,
  },
  {
    id: 'copasst-en-vivo',
    category: 'normativa',
    categoryLabel: 'NORMATIVA LEGAL',
    badgeText: 'EPISODIO 5+ MIN • DEC. 1072',
    title: 'COPASST en Vivo',
    subtitle: 'Estándares Mínimos Res. 0312 & Inspecciones Efectivas',
    hosts: '5 min • Auditoría SST',
    duration: '05:12',
    cardBgClass:
      'bg-gradient-to-br from-indigo-600 via-blue-900 to-[#09111e] border border-indigo-400/35 shadow-lg',
    textColorClass: 'text-white',
    subTextColorClass: 'text-indigo-200/85',
    badgeBgClass: 'bg-indigo-400/20 text-indigo-200 border border-indigo-400/30',
    playBtnClass: 'bg-[#00d4ff] text-[#0c192e] shadow-lg',
    iconBoxClass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
    iconEmoji: '📋',
    voiceId: 'Puck',
    secondVoiceId: 'Aoede',
    dualSpeaker: true,
    stylePrompt: 'Claro, pedagógico y ejecutivo para miembros del COPASST y líderes SST.',
    topicPrompt: 'Cómo hacer que las inspecciones del COPASST generen mejoras reales en piso y no se queden en papel.',
    script: `Alex: Muchos piensan todavía que el Comité Paritario de Seguridad y Salud en el Trabajo —nuestro COPASST— es simplemente reunirse una vez al mes en una sala de juntas a tomar café y firmar un acta para cumplir con la auditoría. <breath> Pero cuando un comité entiende su verdadero rol, se convierte en el radar vivo que protege a toda la organización. Bienvenidos a COPASST en Vivo.

Sam: ¡Totalmente de acuerdo, Alex! Bajo el Decreto 1072 de 2015, la Resolución 2013 de 1986 y los Estándares Mínimos de la Resolución 0312 de 2019, el COPASST es el puente directo entre la realidad operativa de los trabajadores y las decisiones de inversión de la alta dirección. <breath> No es un comité de quejas ni un órgano policial; es un equipo técnico-humano de vigilancia, promoción y mejora continua.

Alex: Hoy queremos entregarles una guía práctica para que cada integrante del COPASST —tanto los representantes de los trabajadores como los del empleador— transforme sus horas semanales de gestión en resultados visibles. Sam, ¿cuál es el secreto para hacer inspecciones planeadas que realmente cambien las condiciones de la planta o las oficinas?

Sam: El secreto número uno es cambiar la inspección pasiva de lista de chequeo por la Observación Dialogada en Terreno. |mhm| Cuando vas a inspeccionar un taller, una bodega o un puesto administrativo, no te limites a mirar los extintores y los botiquines. Acércate al trabajador que lleva ocho horas en ese puesto y hazle dos preguntas clave: "¿Cuál es la parte más incómoda, fatigante o riesgosa de tu tarea hoy?" y "¿Qué herramienta o ajuste haría tu trabajo más seguro?".

Alex: ¡Qué poder tienen esas dos preguntas! Porque nadie conoce mejor los puntos ciegos de una máquina o de un proceso que quien la opera todos los días. <breath> Muchas veces un trabajador te muestra una vibración anormal, un reflejo molesto en la pantalla o una postura forzada que jamás aparecería mirando desde el pasillo.

Sam: Exacto, Alex. El segundo secreto de un COPASST de alto impacto es priorizar los hallazgos aplicando la Jerarquía de Controles del Decreto 1072. En las actas mensuales vemos con frecuencia que el noventa por ciento de las recomendaciones son "dar charla al personal" o "recordar el uso de EPP". Pero la capacitación y el EPP son las barreras más blandas.

Alex: |yeah| Si hay un piso resbaloso por goteo de aceite, la solución del COPASST no puede ser únicamente poner un aviso amarillo permanente y decirles a todos que caminen con cuidado; la acción real es corregir el sello hidráulico que gotea, instalar una bandeja colectora o mejorar el drenaje antideslizante.

Sam: Y el tercer pilar fundamental del comité es el seguimiento riguroso al presupuesto, al cronograma de capacitaciones y a las investigaciones de incidentes y enfermedades laborales. Cada compromiso que queda en el acta del COPASST debe tener tres datos obligatorios: qué acción concreta se va a ejecutar, quién es el responsable directo y en qué fecha exacta se verificará su cierre en campo.

Alex: Además, recordemos que hoy con las herramientas digitales de WAPPY IA podemos registrar hallazgos fotográficos en vivo, conectar las acciones con la Matriz IPVR GTC 45 y presentar indicadores claros a la gerencia en segundos. <breath> Menos papel guardado en carpetas y más liderazgo preventivo en terreno. ¡Gracias por acompañarnos en COPASST en Vivo!`,
  },
  {
    id: 'riesgo-quimico-sga',
    category: 'investigacion',
    categoryLabel: 'RIESGO QUÍMICO',
    badgeText: 'EPISODIO 5+ MIN • SGA DEC. 1496',
    title: 'Alerta Química SGA',
    subtitle: 'Fichas de Seguridad FDS, Trasvase & Compatibilidad',
    hosts: '5 min • Cápsula Técnica',
    duration: '05:08',
    cardBgClass:
      'bg-gradient-to-br from-purple-700 via-fuchsia-900 to-[#14081c] border border-purple-400/35 shadow-lg',
    textColorClass: 'text-white',
    subTextColorClass: 'text-purple-200/85',
    badgeBgClass: 'bg-purple-400/20 text-purple-200 border border-purple-400/30',
    playBtnClass: 'bg-[#c7f303] text-[#0e1300] shadow-lg',
    iconBoxClass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
    iconEmoji: '🧪',
    voiceId: 'Kore',
    secondVoiceId: 'Fenrir',
    dualSpeaker: true,
    stylePrompt: 'Técnico, ágil y memorable para manejo de sustancias químicas y etiquetado SGA.',
    topicPrompt: 'Por qué nunca debemos reenvasar productos químicos en botellas de bebidas y cómo leer los 9 pictogramas SGA.',
    script: `Alex: Hoy en Alerta Química SGA vamos a abordar uno de los riesgos más subestimados en talleres, plantas de producción, laboratorios y áreas de aseo: la manipulación, el trasvase y el almacenamiento de sustancias químicas bajo el Sistema Globalmente Armonizado, reglamentado en Colombia por el Decreto 1496 y la Resolución 773. <breath> Bienvenidos a este episodio técnico de WAPPY Podcast IA.

Sam: Un tema vital, Alex, porque los accidentes químicos ocurren en cuestión de segundos y suelen dejar secuelas severas por inhalación de vapores, quemaduras oculares o ingestión accidental. <breath> Y empecemos por la regla de oro número uno que jamás admite excepciones en ninguna empresa: está terminantemente prohibido trasvasar productos químicos en envases de agua, gaseosas, jugos o alimentos.

Alex: |mhm| Parece increíble, Sam, pero todavía en muchas inspecciones de campo se encuentran botellas plásticas de bebidas rellenas con desengrasante, thinner, hipoclorito o ácido muriático sin etiqueta. Un compañero que llega acalorado al taller o un contratista nuevo ve una botella transparente y en un segundo ocurre una intoxicación grave.

Sam: Por eso la norma exige que todo envase secundario —ya sea un atomizador, una garrafa de uso diario o un dosificador— utilice recipientes técnicos compatibles con la sustancia y porte obligatoriamente su etiqueta del Sistema Globalmente Armonizado. <breath> Recordemos los seis elementos esenciales que debe tener toda etiqueta SGA en el puesto de trabajo: identificación del producto, palabra de advertencia ("Peligro" o "Atención"), pictogramas de rombo con borde rojo, indicaciones de peligro o frases H, consejos de prudencia o frases P, y datos del fabricante o proveedor.

Alex: Hablemos de esos nueve pictogramas de rombo rojo y blanco, Sam. ¿Cómo podemos agruparlos mentalmente para que cualquier trabajador los reconozca de un vistazo antes de destapar un galón?

Sam: Es muy práctico dividirlos en tres familias, Alex. La primera familia son los Peligros Físicos: la llama para líquidos y gases inflamables, la llama sobre círculo para sustancias comburentes u oxidantes que avivan el fuego, la bomba explotando para explosivos o autorreactivos, la botella de gas para gases a presión, y el pictograma de corrosión que ataca tanto metales como tejidos vivos.

Alex: La segunda familia son los Peligros para la Salud Humana, ¿verdad?

Sam: Exacto. Ahí tenemos la calavera con tibias cruzadas para toxicidad aguda mortal o grave; el signo de exclamación para irritación cutánea, ocular o efectos narcóticos; y el pictograma de peligro grave para la salud —la silueta humana con una estrella en el pecho— que nos alerta sobre sustancias cancerígenas, mutagénicas, tóxicas para la reproducción o que dañan órganos respiratorios a largo plazo. Y la tercera familia es el Peligro para el Medio Ambiente Acuático.

Alex: Además de la etiqueta, toda área donde se usen químicos debe contar con las Fichas de Datos de Seguridad de dieciséis secciones actualizadas y en español, junto con una Matriz de Compatibilidad Química real en las estanterías y bodegas. <breath> Nunca almacenemos ácidos junto a bases o hipoclorito, ni inflamables cerca de oxidantes o fuentes de calor.

Sam: Y verifiquemos siempre antes de iniciar la tarea dónde está la ducha de emergencia, la estación lavaojos más cercana, el kit antiderrames y cuál es el cartucho de filtro exacto para nuestro respirador. Cinco segundos leyendo la etiqueta SGA protegen tus pulmones, tus ojos y tu vida. ¡Gracias por escucharnos en Alerta Química SGA!`,
  },
  {
    id: 'brigadas-en-accion',
    category: 'daily',
    categoryLabel: 'EMERGENCIAS',
    badgeText: 'EPISODIO 5+ MIN • RESPUESTA',
    title: 'Brigadas en Acción',
    subtitle: 'Protocolo PAS, Evacuación Industrial & Primeros Auxilios',
    hosts: '5 min • Entrenamiento',
    duration: '05:18',
    cardBgClass:
      'bg-gradient-to-br from-rose-600 via-red-900 to-[#1a070a] border border-rose-400/40 shadow-lg',
    textColorClass: 'text-white',
    subTextColorClass: 'text-rose-200/85',
    badgeBgClass: 'bg-black/45 backdrop-blur-md text-rose-200 border border-rose-400/30',
    playBtnClass: 'bg-[#c7f303] text-[#0e1300] shadow-lg',
    iconBoxClass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
    iconEmoji: '🚒',
    voiceId: 'Orbit',
    secondVoiceId: 'Leda',
    dualSpeaker: true,
    stylePrompt: 'Dinámico, urgente y claro como un entrenamiento táctico de brigadistas de emergencia.',
    topicPrompt: 'Cómo actuar en los primeros 3 minutos de una emergencia industrial: protocolo PAS (Proteger, Avisar, Socorrer).',
    script: `Alex: Cuando suena una alarma de emergencia en planta, se percibe humo en un cuarto eléctrico o un compañero sufre un desvanecimiento súbito, la diferencia entre el control total y una tragedia depende de lo que hagamos en los primeros ciento ochenta segundos. <breath> Bienvenidos a Brigadas en Acción, el podcast de preparación y respuesta ante emergencias de WAPPY IA.

Sam: Un saludo especial para todos nuestros brigadistas de evacuación, control de incendios y primeros auxilios, y para cada trabajador que nos escucha hoy, Alex. <breath> En la gestión de emergencias bajo el Decreto 1072, existe una regla internacional de tres letras que ordena la mente cuando sube la adrenalina: la conducta PAS, que significa Proteger, Avisar y Socorrer, estrictamente en ese orden.

Alex: Analicemos por qué ese orden es sagrado, Sam. Muchos accidentes múltiples ocurren porque alguien salta directamente a socorrer sin haber protegido primero la escena.

Sam: |mhm| Exactamente, Alex. La letra P de Proteger significa evaluar el entorno en cinco segundos antes de acercarte a la víctima o al conato. Si un compañero cayó inconsciente dentro de un espacio confinado o junto a un tablero eléctrico abierto, y tú corres a tocarlo sin cortar la energía o sin equipo de respiración autocontenido, en diez segundos la brigada ya no tendrá un lesionado sino dos. Proteger es asegurar la escena, cortar fuentes de energía y garantizar que el rescatista esté cien por ciento seguro.

Alex: Una vez asegurada la escena, pasamos a la letra A: Avisar. <breath> ¿Cómo se da un aviso de emergencia efectivo que active de inmediato la cadena de socorro interna y externa?

Sam: Un aviso efectivo nunca es gritar "¡Ayuda, pasó algo en la bodega!". Un reporte profesional de emergencia entrega cuatro datos claros y serenos por radio o al número de emergencias: primero, ubicación exacta del evento incluyendo planta, nivel y punto de referencia; segundo, qué tipo de emergencia es (conato de incendio, derrame químico, caída o emergencia médica); tercero, cuántas personas están afectadas y su estado aparente (consciente, inconsciente, respira o no respira); y cuarto, no colgar ni cerrar el canal hasta que el centro de control confirme que recibió el mensaje.

Alex: ¡Clarísimo! Y ahora llegamos a la letra S: Socorrer, aplicando los primeros auxilios o el control inicial del conato según nuestro nivel de entrenamiento. <breath> Sam, recordemos también las reglas críticas cuando se activa el tono continuo de evacuación general.

Sam: Cuando suena la orden de evacuación, aplicamos cinco acciones inmediatas: suspendemos la tarea dejando los equipos en condición segura, caminamos con paso firme pero sin correr jamás, nos mantenemos por la derecha en escaleras sosteniéndonos del pasamanos, no nos devolvemos por ningún objeto personal ni usamos ascensores, y acompañamos a visitantes o personas con movilidad reducida hasta el punto de encuentro externo para el conteo nominal.

Alex: Y un consejo práctico para hoy mismo al terminar de escuchar este episodio: levanta la mirada desde tu puesto de trabajo y ubica dónde está el extintor más cercano, de qué clase es (multipropósito ABC, dióxido de carbono o solkaflam), dónde está la camilla y cuál es tu salida de emergencia primaria y alterna. <breath> En emergencias no improvisamos; actuamos con método y serenidad. ¡Gracias por escucharnos en Brigadas en Acción!`,
  },
];

interface WappyApplePodcastsShelfProps {
  activeShowId?: string;
  isGenerating?: boolean;
  onSelectShow: (show: PodcastShowPreset, autoSynthesize: boolean) => void;
  userCapsules?: UserAudioCapsuleItem[];
  onPlayUserCapsule?: (capsule: UserAudioCapsuleItem) => void;
  onEditUserCapsule?: (capsule: UserAudioCapsuleItem) => void;
  onDeleteUserCapsule?: (capsule: UserAudioCapsuleItem) => void;
  onScrollToEditor?: () => void;
}

export const WappyApplePodcastsShelf: React.FC<WappyApplePodcastsShelfProps> = ({
  activeShowId,
  isGenerating = false,
  onSelectShow,
  userCapsules = [],
  onPlayUserCapsule,
  onEditUserCapsule,
  onDeleteUserCapsule,
  onScrollToEditor,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | PodcastShowPreset['category']>('all');
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const filteredShows =
    selectedCategory === 'all'
      ? WAPPY_PODCAST_SHOWS
      : WAPPY_PODCAST_SHOWS.filter((s) => s.category === selectedCategory);

  const selectedShow =
    WAPPY_PODCAST_SHOWS.find((s) => s.id === activeShowId) || WAPPY_PODCAST_SHOWS[0];

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const amount = direction === 'left' ? -300 : 300;
    carouselRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col justify-between h-full min-w-0">
      <div>
        {/* Header Bar with Left/Right Scroll Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 block">
              TOP SERIES SST (+5 MIN) · APPLE PODCASTS EXPERIENCE
            </span>
            <h4 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Series Originales & Cápsulas WAPPY</span>
              {userCapsules.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#c7f303] text-[#0e1300]">
                  +{userCapsules.length} Creadas
                </span>
              )}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex text-[11px] font-bold text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 rounded-full">
              🎧 Master WAV 24kHz · Mín. 5 Min
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                title="Desplazar cápsulas a la izquierda"
                className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-[#c7f303] text-slate-200 hover:text-[#0e1300] border border-slate-600/70 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                title="Desplazar cápsulas a la derecha"
                className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-[#c7f303] text-slate-200 hover:text-[#0e1300] border border-slate-600/70 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 no-scrollbar">
          {[
            { id: 'all', label: `Todas (${WAPPY_PODCAST_SHOWS.length + userCapsules.length})` },
            { id: 'daily', label: 'Charlas 5 Min' },
            { id: 'cultura', label: 'Cultura & Salud' },
            { id: 'investigacion', label: 'Crónicas ATEL' },
            { id: 'normativa', label: 'Normativa & Alturas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-[#c7f303] text-[#0e1300] shadow-sm shadow-[#c7f303]/25'
                  : 'bg-slate-900/80 text-slate-300 border border-slate-700/70 hover:border-teal-400/40 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Horizontal Scrollable Podcast Capsules Row (User Created with Edit/Delete + 8 Apple Podcasts Shows) */}
        <div
          ref={carouselRef}
          className="flex items-stretch gap-3.5 overflow-x-auto snap-x snap-mandatory pb-3 pt-0.5 scroll-smooth"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7f303 #09111e' }}
        >
          {/* 1. User-Created Audio Capsules from the Studio Below (With Direct EDIT and DELETE Buttons!) */}
          {userCapsules.map((cap, idx) => {
            const durSeconds = cap.durationSec ? Math.max(1, Math.round(cap.durationSec)) : 0;
            const durLabel =
              durSeconds >= 60
                ? `${Math.floor(durSeconds / 60)}:${String(durSeconds % 60).padStart(2, '0')} min`
                : durSeconds > 0
                  ? `${durSeconds}s`
                  : 'WAV 24kHz';

            return (
              <div
                key={cap.id || `user-cap-${idx}`}
                onClick={() => onPlayUserCapsule && onPlayUserCapsule(cap)}
                className="snap-start shrink-0 w-[245px] sm:w-[258px] group relative rounded-2xl p-4 bg-gradient-to-br from-[#1b3a2b] via-[#0d9488] to-[#07191e] border-2 border-[#c7f303] shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[225px]"
              >
                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#c7f303]/20 rounded-full blur-xl pointer-events-none" />

                {/* Top Row: Badge + Action Buttons (Editar, Eliminar, Play) */}
                <div className="flex items-center justify-between gap-1 relative z-10">
                  <span className="px-2 py-0.5 rounded-md bg-[#0e1300]/85 text-[#c7f303] text-[9px] font-extrabold uppercase tracking-wider border border-[#c7f303]/40 truncate">
                    ★ TU PODCAST • 24KHZ
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {onEditUserCapsule && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditUserCapsule(cap);
                        }}
                        title="Editar título y guion de este podcast en el Estudio"
                        className="w-7 h-7 rounded-full bg-slate-900/90 hover:bg-amber-400 text-amber-300 hover:text-[#0e1300] border border-amber-400/50 flex items-center justify-center shadow transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteUserCapsule && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteUserCapsule(cap);
                        }}
                        title="Eliminar este podcast guardado"
                        className="w-7 h-7 rounded-full bg-slate-900/90 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-400/50 flex items-center justify-center shadow transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onPlayUserCapsule) onPlayUserCapsule(cap);
                      }}
                      title="Escuchar en el Walkman"
                      className="w-8 h-8 rounded-full bg-[#c7f303] text-[#0e1300] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-[#0e1300]/40 backdrop-blur-md border border-[#c7f303]/40 flex items-center justify-center text-base mb-2 shadow-inner">
                    📻
                  </div>
                  <h5 className="text-sm font-black text-white leading-snug line-clamp-2">
                    {cap.title || `Cápsula Podcast #${idx + 1}`}
                  </h5>
                  <p className="text-[11px] text-teal-100/90 mt-0.5 line-clamp-1">
                    {cap.voiceName ? `Voz: ${cap.voiceName}` : 'Sintetizado en tu Estudio WAPPY'}
                  </p>

                  {/* Explicit Edit / Delete / Play Footer Actions */}
                  <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] font-bold">
                    <div className="flex items-center gap-2">
                      {onEditUserCapsule && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditUserCapsule(cap);
                          }}
                          className="text-amber-300 hover:text-[#c7f303] underline cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                      )}
                      {onDeleteUserCapsule && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteUserCapsule(cap);
                          }}
                          className="text-rose-300 hover:text-rose-200 underline cursor-pointer"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                    <span className="text-[#c7f303] font-mono">{durLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 2. Curated WAPPY Original Podcast Series Cards (5+ Min Scripts) */}
          {filteredShows.map((show) => {
            const isSelected = selectedShow.id === show.id;
            return (
              <div
                key={show.id}
                onClick={() => onSelectShow(show, false)}
                className={`snap-start shrink-0 w-[245px] sm:w-[258px] group relative rounded-2xl p-4 ${show.cardBgClass} ${
                  isSelected ? 'ring-2 ring-[#c7f303] scale-[1.01]' : ''
                } hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[225px]`}
              >
                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />

                <div className="flex items-center justify-between gap-1.5 relative z-10">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider truncate ${show.badgeBgClass}`}
                  >
                    {show.badgeText}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectShow(show, false);
                        if (onScrollToEditor) onScrollToEditor();
                      }}
                      title="Cargar y editar este guion de +5 minutos en el Estudio"
                      className="w-7 h-7 rounded-full bg-black/45 hover:bg-black/75 text-white border border-white/25 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectShow(show, true);
                      }}
                      title="Sintetizar episodio completo (+5 min) y sonar en el Walkman 24kHz"
                      className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 cursor-pointer ${show.playBtnClass}`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 relative z-10">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base mb-2 shadow-inner ${show.iconBoxClass}`}
                  >
                    {show.iconEmoji}
                  </div>
                  <h5 className={`text-base font-black leading-tight ${show.textColorClass}`}>
                    {show.title}
                  </h5>
                  <p className={`text-[11px] mt-0.5 line-clamp-1 ${show.subTextColorClass}`}>
                    {show.subtitle}
                  </p>
                  <div
                    className={`mt-2.5 pt-2 border-t border-black/15 flex items-center justify-between text-[10px] font-bold ${
                      show.textColorClass === 'text-[#0e1300]'
                        ? 'text-[#0e1300]/90'
                        : 'text-[#c7f303]'
                    }`}
                  >
                    <span>● {show.hosts}</span>
                    <span>{show.duration}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Selected Show Inspector & Direct Bridge to Editing Studio Below */}
      <div className="mt-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#c7f303]/15 text-[#c7f303] border border-[#c7f303]/30 text-[9px] font-extrabold uppercase tracking-wider">
              SERIE ACTIVA (+5 MIN): {selectedShow.title}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {selectedShow.dualSpeaker
                ? `Dual: ${selectedShow.voiceId} + ${selectedShow.secondVoiceId}`
                : `Voz: ${selectedShow.voiceId}`}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1 line-clamp-1 italic">
            "{selectedShow.script.replace(/<[^>]+>/g, '').slice(0, 120)}..."
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => {
              onSelectShow(selectedShow, false);
              if (onScrollToEditor) onScrollToEditor();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[11px] font-bold transition-all cursor-pointer"
          >
            ✏️ Editar Guion ↓
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onSelectShow(selectedShow, true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#c7f303] hover:bg-[#d4ff1f] text-[#0e1300] font-extrabold text-[11px] shadow-md shadow-[#c7f303]/20 flex items-center gap-1.5 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Sintetizando...' : 'Sintetizar Podcast (+5 Min)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WappyApplePodcastsShelf;
