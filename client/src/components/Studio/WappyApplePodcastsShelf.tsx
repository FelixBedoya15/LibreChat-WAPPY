import React, { useState, useRef } from 'react';
import {
  Play,
  Sparkles,
  Headphones,
  Radio,
  Flame,
  ShieldCheck,
  Zap,
  Mic,
  Volume2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Wand2,
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
}

export const WAPPY_PODCAST_SHOWS: PodcastShowPreset[] = [
  {
    id: 'somos-sst-daily',
    category: 'daily',
    categoryLabel: 'CHARLAS 5 MIN',
    badgeText: 'NUEVO EPISODIO • 24KHZ WAV',
    title: 'Somos SST Daily',
    subtitle: 'Charlas de 5 Min & Liderazgo de Campo',
    hosts: '5 min • Host 1 & 2 Dual',
    duration: '04:20',
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
    script: `Alex: ¡Buenos días equipo! Bienvenidos a Somos SST Daily. <breath> Hoy arrancamos turno con una pregunta directa: ¿cuántas veces hemos hecho la misma tarea esta semana pensando que nada puede salir mal?

Sam: ¡Totalmente, Alex! Ese es el famoso piloto automático. <pause_short> En seguridad industrial, el exceso de confianza no avisa: aparece justo cuando creemos que dominamos la máquina con los ojos cerrados.

Alex: <emphasis> Tres segundos de pausa antes de operar </emphasis> cambian toda la jornada. Revisa tu entorno, valida tus bloqueos y cuida a tu compañero de al lado. ¡Que tengamos un turno seguro y regresen todos sanos a casa!`,
  },
  {
    id: 'cero-accidentes',
    category: 'cultura',
    categoryLabel: 'ALTO RIESGO',
    badgeText: 'POPULAR • HOST 1 & 2',
    title: 'Cero Accidentes',
    subtitle: 'Cultura Preventiva & Alto Riesgo',
    hosts: '8 min • 24kHz WAV Master',
    duration: '08:15',
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
    script: `Alex: Hoy en Cero Accidentes vamos directo al corazón de las maniobras críticas: las Cinco Reglas de Oro en riesgo eléctrico y el protocolo LOTO.

Sam: <breath> Y recordemos la regla número uno, Alex: ningún trabajo es tan urgente que no podamos hacerlo con energía cero verificada. <pause_short> Cortar, bloquear, verificar ausencia de tensión, poner a tierra y señalizar.

Alex: <emphasis> Un candado puesto a tiempo salva una vida. </emphasis> Si ves una tarjeta de bloqueo, respétala como si tu propia vida dependiera de ese interruptor.`,
  },
  {
    id: 'cronicas-atel',
    category: 'investigacion',
    categoryLabel: 'CASOS REALES',
    badgeText: 'ESTéREO • DRAMATIZADO',
    title: 'Crónicas ATEL',
    subtitle: 'Investigación de Incidentes Reales',
    hosts: '6 min • Voces Expresivas',
    duration: '06:10',
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
    script: `Alex: Eran las cuatro y quince de la tarde en la planta de envasado. <pause_short> Solo faltaba ajustar una válvula secundaria antes del cambio de turno.

Sam: <whisper> "Son solo dos minutos, no hace falta purgar la línea", </whisper> pensó el operario. Pero en esos dos minutos, la presión residual liberó un chorro térmico que pudo evitarse con un simple giro de válvula de alivio.

Alex: En Crónicas ATEL no buscamos culpables, buscamos causas raíz. <emphasis> La prisa nunca puede reemplazar al procedimiento. </emphasis>`,
  },
  {
    id: 'frecuencia-bioindividuo',
    category: 'cultura',
    categoryLabel: 'PSICOSOCIAL',
    badgeText: 'SALUD MENTAL • 24KHZ',
    title: 'Frecuencia Bioindividuo',
    subtitle: 'Salud Mental, Sueño & Pausas Activas',
    hosts: '4 min • Voz Cálida IA',
    duration: '04:05',
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
    dualSpeaker: false,
    stylePrompt:
      'Cálida, serena, inspiradora y empática, ideal para bienestar psicosocial y pausas activas.',
    topicPrompt:
      'Micro-cápsula de bienestar sobre higiene del sueño, manejo de fatiga laboral y desconexión saludable.',
    script: `Respira profundo por un instante. <breath> En la metodología del Bioindividuo sabemos que tu seguridad empieza mucho antes de ponerte el casco: empieza en cómo descansaste anoche y cómo está tu mente hoy. <pause_short> Si sientes fatiga visual o tensión en los hombros, regálate sesenta segundos de estiramiento consciente y comunícalo a tu líder. <emphasis> Cuidar tu energía mental es el primer acto de prevención. </emphasis>`,
  },
  {
    id: 'alturas-15-metros',
    category: 'normativa',
    categoryLabel: 'TRABAJO EN ALTURAS',
    badgeText: 'RES. 4272 • CAMPO',
    title: 'A 15 Metros: Alturas',
    subtitle: 'Inspección de Arnés, Eslingas y Líneas de Vida',
    hosts: '5 min • Host 1 & 2 Dual',
    duration: '05:12',
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
    script: `Alex: Antes de subir el primer peldaño, hablemos de lo único que te conecta a la vida a quince metros de altura: tu sistema de protección contra caídas.

Sam: Exacto, Alex. <breath> Bajo la Resolución 4272, revisar las costuras del arnés, el indicador de impacto y el mosquetón de doble seguro toma menos de dos minutos.

Alex: <emphasis> Y nunca olvides verificar el requerimiento de claridad. </emphasis> Un buen anclaje certificado marca la diferencia entre un susto y una tragedia.`,
  },
  {
    id: 'copasst-en-vivo',
    category: 'normativa',
    categoryLabel: 'NORMATIVA LEGAL',
    badgeText: 'DEC. 1072 & RES. 0312',
    title: 'COPASST en Vivo',
    subtitle: 'Estándares Mínimos & Inspecciones de Seguridad',
    hosts: '5 min • Auditoría SST',
    duration: '04:50',
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
    script: `Alex: Muchos creen que el COPASST es solo firmar un acta mensual, pero en realidad es el radar vivo de seguridad de toda la empresa.

Sam: ¡Así es! <pause_short> Cuando salimos a piso a conversar con los trabajadores y escuchar qué herramienta falla o qué pasillo necesita mejor iluminación, transformamos el Decreto 1072 en prevención real.

Alex: <emphasis> Menos escritorio y más conversación en campo. </emphasis> ¡Ese es el verdadero poder del comité paritario!`,
  },
  {
    id: 'riesgo-quimico-sga',
    category: 'investigacion',
    categoryLabel: 'RIESGO QUÍMICO',
    badgeText: 'SGA • DEC. 1496',
    title: 'Alerta Química SGA',
    subtitle: 'Fichas de Seguridad FDS & Compatibilidad',
    hosts: '4 min • Cápsula Técnica',
    duration: '04:15',
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
    script: `Alex: Hoy en Alerta Química SGA hablaremos de un error crítico en bodegas y talleres: el trasvase de sustancias químicas en envases sin etiqueta.

Sam: <breath> Jamás uses una botella de agua o gaseosa para guardar desengrasantes o solventes. <pause_short> Todo envase secundario debe llevar su etiqueta del Sistema Globalmente Armonizado y su Ficha de Datos de Seguridad accesible.

Alex: <emphasis> Identificar el pictograma correcto toma cinco segundos; </emphasis> proteger tus vías respiratorias y tu piel dura toda la vida.`,
  },
  {
    id: 'brigadas-en-accion',
    category: 'daily',
    categoryLabel: 'EMERGENCIAS',
    badgeText: 'PRIMEROS AUXILIOS • 24KHZ',
    title: 'Brigadas en Acción',
    subtitle: 'Respuesta a Emergencias, Evacuación & RCP',
    hosts: '5 min • Entrenamiento',
    duration: '05:00',
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
    script: `Alex: Cuando suena la alarma de emergencia, la diferencia entre el caos y una evacuación exitosa está en los primeros ciento ochenta segundos.

Sam: Por eso en Brigadas en Acción aplicamos siempre la regla PAS: <emphasis> Proteger la escena, Avisar al sistema de emergencia y Socorrer </emphasis> sin poner en riesgo tu propia integridad.

Alex: Conoce hoy mismo tu ruta de evacuación más cercana y ubica al brigadista de tu área. ¡Estar preparados salva vidas!`,
  },
];

interface WappyApplePodcastsShelfProps {
  activeShowId?: string;
  isGenerating?: boolean;
  onSelectShow: (show: PodcastShowPreset, autoSynthesize: boolean) => void;
  userCapsules?: UserAudioCapsuleItem[];
  onPlayUserCapsule?: (capsule: UserAudioCapsuleItem) => void;
  onScrollToEditor?: () => void;
}

export const WappyApplePodcastsShelf: React.FC<WappyApplePodcastsShelfProps> = ({
  activeShowId,
  isGenerating = false,
  onSelectShow,
  userCapsules = [],
  onPlayUserCapsule,
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
              TOP SERIES SST · APPLE PODCASTS EXPERIENCE
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
              🎧 Master WAV 24kHz
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                title="Desplazar cápsulas a la izquierda"
                className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-[#c7f303] text-slate-200 hover:text-[#0e1300] border border-slate-600/70 flex items-center justify-center transition-all shadow-md active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                title="Desplazar cápsulas a la derecha"
                className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-[#c7f303] text-slate-200 hover:text-[#0e1300] border border-slate-600/70 flex items-center justify-center transition-all shadow-md active:scale-95"
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
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-[#c7f303] text-[#0e1300] shadow-sm shadow-[#c7f303]/25'
                  : 'bg-slate-900/80 text-slate-300 border border-slate-700/70 hover:border-teal-400/40 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Horizontal Scrollable Podcast Capsules Row (User Created + 8 Apple Podcasts Shows) */}
        <div
          ref={carouselRef}
          className="flex items-stretch gap-3.5 overflow-x-auto snap-x snap-mandatory pb-3 pt-0.5 scroll-smooth"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7f303 #09111e' }}
        >
          {/* 1. User-Created Audio Capsules from the Studio Below (Passed Directly into the Carousel!) */}
          {userCapsules.map((cap, idx) => (
            <div
              key={cap.id || `user-cap-${idx}`}
              onClick={() => onPlayUserCapsule && onPlayUserCapsule(cap)}
              className="snap-start shrink-0 w-[235px] sm:w-[250px] group relative rounded-2xl p-4 bg-gradient-to-br from-[#1b3a2b] via-[#0d9488] to-[#07191e] border-2 border-[#c7f303] shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[215px]"
            >
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#c7f303]/20 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between gap-1.5 relative z-10">
                <span className="px-2 py-0.5 rounded-md bg-[#0e1300]/85 text-[#c7f303] text-[9px] font-extrabold uppercase tracking-wider border border-[#c7f303]/40 truncate">
                  ★ TU CÁPSULA IA • 24KHZ
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPlayUserCapsule) onPlayUserCapsule(cap);
                  }}
                  title="Escuchar en el Walkman"
                  className="w-8 h-8 rounded-full bg-[#c7f303] text-[#0e1300] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </div>

              <div className="mt-5 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-[#0e1300]/40 backdrop-blur-md border border-[#c7f303]/40 flex items-center justify-center text-lg mb-2.5 shadow-inner">
                  📻
                </div>
                <h5 className="text-sm font-black text-white leading-snug line-clamp-2">
                  {cap.title || `Cápsula Podcast #${idx + 1}`}
                </h5>
                <p className="text-[11px] text-teal-100/90 mt-0.5 line-clamp-1">
                  {cap.voiceName ? `Voz: ${cap.voiceName}` : 'Sintetizado en tu Estudio WAPPY'}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold text-[#c7f303]">
                  <span>● Pasar al Walkman</span>
                  <span>
                    {cap.durationSec ? `${Math.max(1, Math.round(cap.durationSec))}s` : 'WAV 24kHz'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* 2. Curated WAPPY Original Podcast Series Cards */}
          {filteredShows.map((show) => {
            const isSelected = selectedShow.id === show.id;
            return (
              <div
                key={show.id}
                onClick={() => onSelectShow(show, false)}
                className={`snap-start shrink-0 w-[235px] sm:w-[250px] group relative rounded-2xl p-4 ${show.cardBgClass} ${
                  isSelected ? 'ring-2 ring-[#c7f303] scale-[1.01]' : ''
                } hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[215px]`}
              >
                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />

                <div className="flex items-center justify-between gap-1.5 relative z-10">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider truncate ${show.badgeBgClass}`}
                  >
                    {show.badgeText}
                  </span>
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectShow(show, true);
                    }}
                    title="Sintetizar y sonar en el Walkman 24kHz"
                    className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 ${show.playBtnClass}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                </div>

                <div className="mt-5 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-2.5 shadow-inner ${show.iconBoxClass}`}
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
                    className={`mt-2.5 flex items-center justify-between text-[10px] font-bold ${
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
              CÁPSULA SELECCIONADA: {selectedShow.title}
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
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[11px] font-bold transition-all"
          >
            Editar en Estudio ↓
          </button>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onSelectShow(selectedShow, true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#c7f303] hover:bg-[#d4ff1f] text-[#0e1300] font-extrabold text-[11px] shadow-md shadow-[#c7f303]/20 flex items-center gap-1.5 transition-all disabled:opacity-60"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Sintetizando...' : 'Pasar al Walkman'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WappyApplePodcastsShelf;
