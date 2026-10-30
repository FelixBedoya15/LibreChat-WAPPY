import React from 'react';
import {
  Play,
  Sparkles,
  Zap,
  ShieldAlert,
  Search,
  Users2,
  HardHat,
  Moon,
  Radio,
  ArrowRight,
} from 'lucide-react';
import ExpandableButton from '~/components/Common/ExpandableButton';
import { cn } from '~/utils';

export interface ApplePodcastEpisodeModel {
  id: string;
  episodeNumber: string;
  title: string;
  subtitle: string;
  badge: string;
  norm: string;
  speaker1Voice: string;
  speaker2Voice: string;
  stylePrompt: string;
  scriptText: string;
  gradient: string;
  accentColor: string;
  coverArt: React.ReactNode;
}

export const APPLE_PODCASTS_MODELS: ApplePodcastEpisodeModel[] = [
  {
    id: 'ep-01-reglas-oro',
    episodeNumber: 'EPISODIO #01',
    title: '5 Reglas de Oro: El Error de los 2 Minutos',
    subtitle: 'Riesgo Eléctrico, Arco Voltaico & Protocolo LOTO',
    badge: 'RETIE & OSHA 1910.147',
    norm: 'Riesgo Crítico Eléctrico',
    speaker1Voice: 'Puck',
    speaker2Voice: 'Kore',
    stylePrompt:
      'Diálogo dinámico, técnico y reflexivo de podcast de seguridad industrial sobre riesgo eléctrico con alternancia natural y tomas de aire.',
    scriptText: `Alex: <breath> ¡Bienvenidos a Somos SST Podcast! Hoy abordamos un caso que le cuesta la vida a decenas de técnicos cada año: "El error de los dos minutos" en riesgo eléctrico. Sam, ¿por qué la gente se confía tanto?

Sam: Hola Alex. <sigh> El sesgo de familiaridad es mortal. El técnico dice: "Solo voy a apretar un tornillo, me toma dos minutos, para qué voy a bloquear el interruptor principal". Y en esos dos minutos ocurre el arco eléctrico.

Alex: |mhm| Las estadísticas no mienten: el 80% de los incidentes por arco ocurren en tareas menores no bloqueadas. Repasemos juntos las 5 Reglas de Oro innegociables.

Sam: Primero: Desconexión total de fuentes de tensión. Segundo: Bloqueo mecánico y etiquetado LOTO con tu tarjeta personal. <breath> Tercero: Comprobar ausencia de tensión con equipo calibrado. Cuarto: Puesta a tierra y en cortocircuito. Y quinto: Delimitar y señalizar tu zona de maniobra.

Alex: Recuerda siempre: ningún cliente ni ninguna prisa de producción valen más que regresar a cenar con tu familia. ¡La seguridad se aplica o se sufre!`,
    gradient: 'from-[#0e1300] via-[#1a2305] to-[#0c1808]',
    accentColor: '#C7F303',
    coverArt: (
      <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#0E1300" />
        <circle cx="100" cy="100" r="70" stroke="#C7F303" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" />
        <path
          d="M108 35L75 105H102L92 165L135 95H108L118 35Z"
          fill="#C7F303"
          stroke="#0E1300"
          strokeWidth="3"
        />
        {/* Candado LOTO */}
        <rect x="125" y="125" width="40" height="34" rx="6" fill="#0D9488" />
        <path d="M135 125V115C135 109.5 139.5 105 145 105C150.5 105 155 109.5 155 115V125" stroke="#F6F5EF" strokeWidth="3" />
        <circle cx="145" cy="140" r="3" fill="#0E1300" />
      </svg>
    ),
  },
  {
    id: 'ep-02-anatomia-atel',
    episodeNumber: 'EPISODIO #02',
    title: 'Anatomía de un ATEL: ¿Culpable o Causa Raíz?',
    subtitle: 'Investigación Forense, Árbol de Causas & 5 Porqués',
    badge: 'Decreto 1072 & Res. 1401',
    norm: 'Investigación Laboral',
    speaker1Voice: 'Orus',
    speaker2Voice: 'Aoede',
    stylePrompt:
      'Debate analítico, forense y constructivo estilo periodismo de investigación sobre accidentalidad laboral y causas raíz.',
    scriptText: `Alex: <breath> Saludos a toda la comunidad SST. Hoy en cabina abrimos el expediente de un accidente de trabajo grave. Sam, ¿por qué todavía hay empresas que cierran sus investigaciones diciendo "error humano del trabajador"?

Sam: Saludos Alex. <sigh> Culpar al trabajador es la salida fácil y mediocre. La Resolución 1401 y el Decreto 1072 exigen profundizar con el Árbol de Causas y los 5 Porqués hasta encontrar las fallas del sistema de gestión.

Alex: Exacto. Si el operario no usaba el guante de nitrilo, preguntemos: ¿había stock en almacén? ¿se evaluó la compatibilidad con el químico? ¿hubo fatiga por horas extras? |mhm|

Sam: |yeah| Cuando investigamos para aprender y no para castigar, los trabajadores reportan los cuasidentes a tiempo. Y ahí es donde eliminamos el peligro antes de que se convierta en una tragedia.

Alex: Lección para la alta dirección: un reporte a tiempo es una vida salvada. Nos vemos en el próximo episodio de Somos SST.`,
    gradient: 'from-[#051c24] via-[#092b38] to-[#04141a]',
    accentColor: '#00D4FF',
    coverArt: (
      <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#051C24" />
        {/* Árbol de causas */}
        <circle cx="100" cy="50" r="14" fill="#00D4FF" />
        <line x1="100" y1="64" x2="60" y2="105" stroke="#00D4FF" strokeWidth="2.5" />
        <line x1="100" y1="64" x2="140" y2="105" stroke="#00D4FF" strokeWidth="2.5" />
        <circle cx="60" cy="115" r="10" fill="#0D9488" />
        <circle cx="140" cy="115" r="10" fill="#0D9488" />
        <line x1="60" y1="125" x2="40" y2="155" stroke="#0D9488" strokeWidth="2" />
        <line x1="60" y1="125" x2="80" y2="155" stroke="#0D9488" strokeWidth="2" />
        <circle cx="40" cy="162" r="7" fill="#C7F303" />
        <circle cx="80" cy="162" r="7" fill="#C7F303" />
        {/* Lupa Forense */}
        <circle cx="135" cy="140" r="28" stroke="#F6F5EF" strokeWidth="3" fill="#092B38" fillOpacity="0.7" />
        <line x1="155" y1="160" x2="180" y2="185" stroke="#F6F5EF" strokeWidth="5" strokeLinecap="round" />
        <path d="M125 140H145M135 130V150" stroke="#00D4FF" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'ep-03-copasst-vivo',
    episodeNumber: 'EPISODIO #03',
    title: 'COPASST en Vivo: Del Papel a la Planta',
    subtitle: 'Liderazgo Preventivo, Inspecciones & Cultura de Seguridad',
    badge: 'Res. 0312 de 2019',
    norm: 'Comités & Participación',
    speaker1Voice: 'Fenrir',
    speaker2Voice: 'Leda',
    stylePrompt:
      'Conversación entusiasta, cercana y colaborativa sobre gestión del COPASST, inspecciones de seguridad y liderazgo en piso de planta.',
    scriptText: `Alex: <breath> ¡Bienvenidos a Somos SST! Hoy tenemos un episodio especial para los miembros del COPASST y Vigías de Seguridad. Sam, muchos sienten que el comité es solo firmar un acta mensual para cumplir con el Ministerio. <laugh>

Sam: ¡Totalmente, Alex! <sigh> El peor error de un COPASST es quedarse encerrado en la sala de juntas. El verdadero comité se ensucia los zapatos en los talleres, almacenes y líneas de ensamble.

Alex: |mhm| Las inspecciones planeadas de seguridad son la herramienta reina. Cuando el comité detecta una fuga hidráulica o un extintor obstruido y gestiona su solución en 48 horas, se gana el respeto de toda la planta.

Sam: |yeah| La Resolución 0312 lo dice claro: el COPASST debe proponer medidas y verificar su eficacia. La prevención no es un trámite administrativo; es la voz viva de los trabajadores cuidando a sus compañeros.

Alex: Si eres parte del COPASST en tu empresa, ¡ponte el chaleco, sal a la planta y lidera con el ejemplo!`,
    gradient: 'from-[#062421] via-[#0b3833] to-[#041614]',
    accentColor: '#10B981',
    coverArt: (
      <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#062421" />
        {/* Mesa redonda del COPASST */}
        <circle cx="100" cy="110" r="45" fill="#0B3833" stroke="#10B981" strokeWidth="2" />
        <circle cx="100" cy="110" r="18" fill="#062421" />
        {/* Miembros / Cascos */}
        <circle cx="100" cy="50" r="12" fill="#F6F5EF" />
        <path d="M92 48C92 43 95 38 100 38C105 38 108 43 108 48H92Z" fill="#C7F303" />
        <circle cx="50" cy="110" r="12" fill="#F6F5EF" />
        <path d="M42 108C42 103 45 98 50 98C55 98 58 103 58 108H42Z" fill="#C7F303" />
        <circle cx="150" cy="110" r="12" fill="#F6F5EF" />
        <path d="M142 108C142 103 145 98 150 98C155 98 158 103 158 108H142Z" fill="#C7F303" />
        <circle cx="100" cy="170" r="12" fill="#F6F5EF" />
        <path d="M92 168C92 163 95 158 100 158C105 158 108 163 108 168H92Z" fill="#C7F303" />
        {/* Escudo central */}
        <path d="M100 98L112 104V115C112 122 107 127 100 129C93 127 88 122 88 115V104L100 98Z" fill="#10B981" />
      </svg>
    ),
  },
  {
    id: 'ep-04-alturas-4272',
    episodeNumber: 'EPISODIO #04',
    title: 'A 15 Metros del Suelo: Permisos de Alturas',
    subtitle: 'Puntos de Anclaje, Absorbedor de Choque & Requerimiento de Claridad',
    badge: 'Resolución 4272 de 2021',
    norm: 'Trabajo en Alturas',
    speaker1Voice: 'Titan',
    speaker2Voice: 'Callisto',
    stylePrompt:
      'Diálogo riguroso, profesional y enfático de expertos en alturas, líneas de vida y rescate industrial.',
    scriptText: `Alex: <breath> Bienvenidos a cabina. Hoy hablamos de la tarea crítica número uno en accidentalidad fatal: Trabajo en Alturas bajo la Resolución 4272 de 2021. Sam, ¿a partir de qué altura aplica y cuál es el mayor descuido?

Sam: Alex, la norma colombiana fijó el umbral en dos metros de altura con riesgo de caída. Y el mayor descuido sigue siendo firmar el Permiso de Trabajo en Alturas desde un escritorio sin inspeccionar el punto de anclaje.

Alex: ¡Increíble pero cierto! Hemos visto anclajes a tubos de PVC o barandas provisionales. ¿Cómo debe ser un punto de anclaje certificado?

Sam: <breath> Debe resistir mínimo cinco mil libras o dos mil doscientos setenta y dos kilogramos por cada persona conectada, o estar certificado por una persona calificada. Y jamás omitir el cálculo del requerimiento de claridad.

Alex: |mhm| Si no calculas la distancia de caída libre, la apertura del absorbedor y la elongación del arnés, el impacto contra el suelo será inevitable. En alturas no hay segundas oportunidades: inspección pre-uso o no se sube nadie.`,
    gradient: 'from-[#171426] via-[#241c3e] to-[#100d1c]',
    accentColor: '#F59E0B',
    coverArt: (
      <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#171426" />
        {/* Torre / Estructura */}
        <line x1="50" y1="180" x2="90" y2="25" stroke="#F59E0B" strokeWidth="3" />
        <line x1="150" y1="180" x2="110" y2="25" stroke="#F59E0B" strokeWidth="3" />
        <line x1="65" y1="130" x2="135" y2="130" stroke="#F59E0B" strokeWidth="2" />
        <line x1="78" y1="80" x2="122" y2="80" stroke="#F59E0B" strokeWidth="2" />
        <line x1="90" y1="25" x2="110" y2="25" stroke="#F59E0B" strokeWidth="4" />
        {/* Línea de vida y Mosquetón */}
        <path d="M100 25V95" stroke="#00D4FF" strokeWidth="3" strokeDasharray="3 3" />
        <rect x="94" y="95" width="12" height="18" rx="4" stroke="#F6F5EF" strokeWidth="2.5" fill="#241C3E" />
        {/* Operario con arnés */}
        <circle cx="100" cy="125" r="9" fill="#F59E0B" />
        <path d="M100 134V160M90 145H110M90 175L100 160L110 175" stroke="#F6F5EF" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'ep-05-mente-sana',
    episodeNumber: 'EPISODIO #05',
    title: 'Mente Sana en Turno Nocturno: Riesgo Psicosocial',
    subtitle: 'Higiene del Sueño, Fatiga Ocupacional & Desconexión Laboral',
    badge: 'Resolución 2764 de 2022',
    norm: 'Salud Mental & Psicosocial',
    speaker1Voice: 'Charon',
    speaker2Voice: 'Zephyr',
    stylePrompt:
      'Voz serena, empática y reflexiva de especialistas en salud ocupacional y psicología laboral sobre turnos rotativos y bienestar.',
    scriptText: `Alex: <breath> Buenas noches a quienes nos escuchan desde el turno de la noche, las plantas de proceso y las salas de control. Hoy en Somos SST hablamos de la salud invisible: el riesgo psicosocial bajo la Resolución 2764 de 2022.

Sam: Buenas noches Alex. <sigh> El insomnio crónico, el estrés por sobrecarga mental y el aislamiento del turno nocturno impactan directo en el sistema cardiovascular y en la tasa de accidentabilidad.

Alex: |mhm| Muchas empresas aplican la Batería Psicosocial solo para archivarla en una carpeta. Pero la norma exige planes de intervención activos: higiene del sueño, pausas cognitivas y desconexión laboral efectiva.

Sam: |yeah| La salud mental es un derecho fundamental del trabajador. Crear espacios donde se pueda hablar de ansiedad o fatiga sin temor a represalias es el mejor indicador de madurez de una organización.

Alex: Cuida tu mente tanto como cuidas tus manos. Que tengas una jornada segura y un descanso reparador al volver a casa.`,
    gradient: 'from-[#1a0f2b] via-[#2c1445] to-[#12071f]',
    accentColor: '#D946EF',
    coverArt: (
      <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#1A0F2B" />
        {/* Luna Creciente */}
        <path
          d="M130 50C105 50 85 70 85 95C85 120 105 140 130 140C115 135 105 115 105 95C105 75 115 55 130 50Z"
          fill="#D946EF"
        />
        {/* Estrellas */}
        <circle cx="55" cy="55" r="3" fill="#C7F303" />
        <circle cx="75" cy="40" r="2" fill="#F6F5EF" />
        <circle cx="65" cy="85" r="2.5" fill="#D946EF" />
        {/* Reloj de turno y ondas cerebrales */}
        <circle cx="100" cy="115" r="38" stroke="#F6F5EF" strokeWidth="2" strokeDasharray="4 3" opacity="0.4" />
        <path d="M60 145Q75 125 90 145T120 145T150 145" stroke="#00D4FF" strokeWidth="3" fill="none" />
        <circle cx="100" cy="115" r="4" fill="#C7F303" />
        <line x1="100" y1="115" x2="100" y2="92" stroke="#C7F303" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="100" y1="115" x2="118" y2="115" stroke="#C7F303" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export interface WappyApplePodcastsShelfProps {
  onSelectEpisode: (episode: ApplePodcastEpisodeModel) => void;
  activeEpisodeId?: string;
}

export default function WappyApplePodcastsShelf({
  onSelectEpisode,
  activeEpisodeId,
}: WappyApplePodcastsShelfProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 dark:border-purple-500/25 bg-gradient-to-br from-slate-900/95 via-[#120e24] to-[#0a181c] p-4 sm:p-6 shadow-xl">
      {/* Halos Ambientales Apple Podcasts */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-[#C7F303]/10 blur-3xl" />

      {/* Header Editorial Estilo Apple Podcasts */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-black uppercase tracking-wider">
               APPLE PODCASTS EDITORIAL SELECTION • 24kHz
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-1">
            🎧 Nuevos y Destacados · Episodios Modelo SST (1 Clic)
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Series exclusivas de Seguridad y Salud en el Trabajo producidas con alternancia de 2 locutores neurales. Pulsa en cualquier portada para cargar su guion y voces directamente en el Walkman.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-purple-300 font-bold bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-700/50">
            5 Episodios Listos
          </span>
        </div>
      </div>

      {/* Estantería Horizontal de 5 Tarjetas Cuadradas */}
      <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {APPLE_PODCASTS_MODELS.map((ep) => {
          const isActive = activeEpisodeId === ep.id;
          return (
            <div
              key={ep.id}
              onClick={() => onSelectEpisode(ep)}
              className={cn(
                'group relative rounded-2xl p-3 border transition-all duration-300 flex flex-col justify-between cursor-pointer',
                isActive
                  ? 'bg-purple-950/50 border-[#C7F303] ring-2 ring-[#C7F303]/30 shadow-lg shadow-[#C7F303]/10'
                  : 'bg-black/40 border-white/10 hover:border-purple-400/60 hover:bg-white/5 hover:shadow-lg',
              )}
            >
              <div>
                {/* Portada Cuadrada con Arte SVG propio */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-white/10 shadow-md group-hover:scale-[1.02] transition-transform duration-300">
                  {ep.coverArt}

                  {/* Insignia Flotante Apple Podcasts */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-[9px] font-mono font-bold text-white flex items-center gap-1">
                    <span> 24kHz</span>
                  </div>

                  {/* Número de Episodio */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md border border-white/15 text-[9px] font-mono font-black text-[#C7F303]">
                    {ep.episodeNumber}
                  </div>
                </div>

                {/* Título y Subtítulo */}
                <div className="mt-2.5 space-y-1">
                  <h3 className="text-xs font-black text-white line-clamp-2 leading-snug group-hover:text-[#C7F303] transition-colors">
                    {ep.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {ep.subtitle}
                  </p>
                </div>
              </div>

              {/* Pie de la tarjeta: Voces + Normativa + Botón de carga */}
              <div className="mt-3 pt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-purple-300 font-bold flex items-center gap-1 truncate">
                    🎙️ {ep.speaker1Voice} + {ep.speaker2Voice}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono shrink-0">
                    {ep.badge}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEpisode(ep);
                  }}
                  className={cn(
                    'w-full py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer',
                    isActive
                      ? 'bg-[#C7F303] text-[#0E1300] shadow-md shadow-[#C7F303]/20 font-black'
                      : 'bg-white/10 hover:bg-purple-600 hover:text-white text-slate-200 border border-white/10',
                  )}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isActive ? 'Cargado en Walkman' : 'Cargar en Walkman'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
