import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { X, Send, Sparkles, RotateCcw, FileText, Edit2, Trash2, RefreshCw, Mic, Volume2, MessageSquare, Bot, Activity } from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useListAgentsQuery } from '~/data-provider';
import { useRecoilValue } from 'recoil';
import store from '~/store';
import Markdown from '~/components/Chat/Messages/Content/Markdown';
import { getDehydratedDOM, executeGUIAction, getVisibleScreenContent } from '../Chat/TenshiPageController';
import { useVoiceSession } from '~/hooks/useVoiceSession';
import { cn } from '~/utils';

const normalizeStr = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

const AGENT_TAXONOMY: { id: string; aliases: string[]; keywords: string[]; fallbackId?: string }[] = [
  {
    id: 'fisioterapeuta_laboral',
    aliases: ['fisioterapeuta laboral', 'fisioterapeuta', 'especialista en biomecanica laboral', 'biomecanica laboral', 'analista ergonomico rosa', 'ergonomia', 'inspector de puesto de trabajo ipt'],
    keywords: ['fisioterap', 'ergonom', 'biomecan', 'postur', 'musculoesquelet', 'owas', 'rosa', 'rula'],
  },
  {
    id: 'abogado_laboral',
    aliases: ['abogado laboral', 'abogado', 'consultor juridico laboral', 'consultor juridico rit', 'consultor de debido proceso y despidos', 'consultor de protocolo de acoso sexual', 'abogado rit', 'abogado procesos disciplinarios', 'abogado acoso sexual'],
    keywords: ['abogad', 'juridic', 'disciplinari', 'ley 1010', 'ley 2365', 'rit', 'derecho laboral', 'despido', 'contrato laboral'],
  },
  {
    id: 'medico_laboral',
    aliases: ['medico laboral', 'consultor medico ocupacional', 'medico', 'medic laboral'],
    keywords: ['medic', 'doctor', 'salud ocupacional', 'origen', 'restriccion', 'ausentism', 'epidemiolog', 'examenes ocupacionales'],
  },
  {
    id: 'ingeniero_quimico_sst',
    aliases: ['ingeniero quimico sst', 'especialista en riesgo quimico', 'quimico sst', 'expert en riesgo quimico', 'experto en riesgo quimico'],
    keywords: ['quimic', 'sga', 'fds', 'hds', 'derrame', 'sustancias peligrosas', 'hoja de seguridad', 'rotulado'],
  },
  {
    id: 'coordinador_seguridad_vial',
    aliases: ['coordinador de seguridad vial', 'especialista en riesgo vial', 'expert en riesgo vial', 'experto en riesgo vial', 'seguridad vial', 'pesv'],
    keywords: ['seguridad vial', 'pesv', 'transito', 'vehicul', 'conductor', 'ansv', 'carretera', 'vial'],
  },
  {
    id: 'psicologo_sst',
    aliases: ['psicologo sst', 'especialista en riesgo psicosocial', 'psicolog especialista sst', 'psicologo especialista sst'],
    keywords: ['psicolog', 'psicosocial', 'bateria', 'acoso', 'clima laboral', 'estres laboral'],
  },
  {
    id: 'terapeuta_salud_mental',
    aliases: ['terapeuta en salud mental', 'consultor de bienestar y salud mental', 'salud mental', 'asistente de salud mental'],
    keywords: ['salud mental', 'terapeuta', 'burnout', 'agotamiento', 'emocional', 'bienestar emocional'],
  },
  {
    id: 'nutricionista_laboral',
    aliases: ['nutricionista laboral', 'consultor nutricional corporativo', 'nutricionista', 'asistente en nutricion'],
    keywords: ['nutricion', 'dieta', 'aliment', 'cardiovascular'],
  },
  {
    id: 'primer_respondiente',
    aliases: ['primer respondiente', 'gestor clinico de primeros auxilios', 'primeros auxilios', 'asistente en primeros auxilios'],
    keywords: ['primer respondiente', 'primeros auxilios', 'rcp', 'botiquin', 'hemorragia'],
  },
  {
    id: 'coordinador_emergencias',
    aliases: ['coordinador de emergencias', 'especialista en prevencion y emergencias', 'expert en emergencias', 'experto en emergencias', 'emergencias'],
    keywords: ['emergencia', 'pae', 'evacuacion', 'brigada', 'simulacro'],
  },
  {
    id: 'especialista_bioseguridad',
    aliases: ['especialista en bioseguridad', 'especialista en riesgo biologico', 'expert en riesgo biologico', 'experto en riesgo biologico', 'bioseguridad'],
    keywords: ['bioseguridad', 'biologic', 'vacun', 'pgirh', 'infecc'],
  },
  {
    id: 'ingeniero_electricista_sst',
    aliases: ['ingeniero electricista sst', 'especialista en riesgo electrico', 'expert en riesgo electrico', 'experto en riesgo electrico', 'electricista sst'],
    keywords: ['electric', 'retie', 'arco electrico', 'loto', 'energias peligrosas'],
  },
  {
    id: 'coordinador_tareas_criticas',
    aliases: ['coordinador de tareas criticas', 'especialista en tareas criticas', 'expert en tareas de alto riesgo', 'experto en tareas de alto riesgo', 'gestor de permisos de trabajo tsa'],
    keywords: ['tareas criticas', 'alturas', 'tsa', 'confinados', 'caliente', 'excavacion', 'alto riesgo'],
  },
  {
    id: 'ingeniero_minas_sst',
    aliases: ['ingeniero de minas sst', 'especialista en mineria subterranea y alto riesgo', 'experto mineria subterranea', 'minas sst'],
    keywords: ['minas', 'minero', 'subterranea', 'tunel', 'explosivo'],
  },
  {
    id: 'auditor_sg_sst',
    aliases: ['auditor sg sst', 'auditor integral sg sst', 'auditor sst', 'auditor'],
    keywords: ['auditor', '0312', 'estandares minimos', 'phva', 'auditoria'],
  },
  {
    id: 'ingeniero_ambiental',
    aliases: ['ingeniero ambiental', 'consultor de gestion ambiental', 'gestor gestion ambiental', 'ambiental'],
    keywords: ['ambiental', 'residuo', 'vertimiento', 'ecolog'],
  },
  {
    id: 'especialista_riesgo_climatico',
    aliases: ['especialista en riesgo climatico', 'riesgo climatico'],
    keywords: ['climatic', 'estres termico', 'radiacion uv', 'clima extremo', 'golpe de calor'],
  },
  {
    id: 'redactor_creativo',
    aliases: ['redactor creativo', 'estratega de contenidos corporativos', 'redactor de blog', 'redactor blog'],
    keywords: ['redactor', 'blog', 'articulo', 'publicacion', 'contenidos'],
  },
  {
    id: 'simulador_accidentes',
    aliases: ['simulador de accidentes sst', 'analista forense de accidentalidad at', 'analista forense de enfermedad laboral el', 'simulador de accidentes', 'asistente inv at', 'asistente inv el'],
    keywords: ['simulador', 'siniestro', 'causa raiz', 'arbol de causas', 'forense'],
  },
  {
    id: 'coordinador_capacitaciones',
    aliases: ['coordinador de capacitaciones', 'gestor de formacion continua', 'asistente en capacitaciones', 'capacitaciones'],
    keywords: ['capacitacion', 'pac', 'induccion', 'charla 5 min', 'formacion'],
  },
  {
    id: 'profesional_sst',
    aliases: ['profesional sst', 'consultor senior sg sst'],
    keywords: ['profesional sst', 'inspeccion de campo'],
  },
  {
    id: 'agente_sst',
    aliases: ['consultor sg sst', 'agente sst', 'consultor sst', 'asesor sst'],
    keywords: ['consultor sg sst', 'consultor sst', 'asesoria sst'],
  },
  {
    id: 'coordinador_ipevar',
    aliases: ['coordinador ipevar', 'especialista gtc 45 matriz ipevar', 'especialista gtc 45', 'especialista gtc45', 'matriz ipevar', 'ipevar', 'asistente ipevar'],
    keywords: ['ipevar', 'gtc 45', 'gtc45', 'matriz de peligros', 'valoracion de riesgos'],
    fallbackId: 'agente_sst',
  },
  {
    id: 'asistente_ats',
    aliases: ['asistente ats', 'gestor de analisis de trabajo seguro ats', 'gestor de analisis de trabajo seguro', 'analisis de trabajo seguro ats', 'ats'],
    keywords: ['ats', 'analisis de trabajo seguro', 'paso a paso'],
    fallbackId: 'coordinador_tareas_criticas',
  },
  {
    id: 'asistente_permiso_tsa',
    aliases: ['asistente permiso tsa', 'gestor de permisos de trabajo tsa', 'gestor de permisos de trabajo', 'permiso tsa', 'permiso alturas'],
    keywords: ['permiso tsa', 'permiso alturas', 'resolucion 4272', 'trabajo en alturas'],
    fallbackId: 'coordinador_tareas_criticas',
  },
  {
    id: 'creador_formatos',
    aliases: ['creador de formatos sst', 'creador de formatos', 'agente creador formatos sst', 'formatos sst', 'gestor de formatos'],
    keywords: ['formatos', 'plantilla', 'creador de formatos', 'documentos sst', 'acta'],
    fallbackId: 'agente_sst',
  },
  {
    id: 'asistente_de_aci',
    aliases: ['asistente de aci', 'analista predictivo aci', 'asistente aci', 'oraculo predictivo aci', 'aci'],
    keywords: ['aci', 'analista aci', 'predictivo aci', 'siniestralidad predictiva'],
    fallbackId: 'simulador_accidentes',
  },
  {
    id: 'abogado_rit',
    aliases: ['abogado rit', 'consultor juridico rit', 'reglamento interno rit', 'reglamento interno de trabajo'],
    keywords: ['rit', 'reglamento interno'],
    fallbackId: 'abogado_laboral',
  },
  {
    id: 'abogado_procesos_disciplinarios',
    aliases: ['abogado procesos disciplinarios', 'consultor de debido proceso y despidos', 'procesos disciplinarios', 'debido proceso'],
    keywords: ['debido proceso', 'procesos disciplinarios', 'descargos', 'despidos'],
    fallbackId: 'abogado_laboral',
  },
  {
    id: 'abogado_acoso_sexual',
    aliases: ['abogado acoso sexual', 'consultor de protocolo de acoso sexual', 'acoso sexual laboral', 'protocolo acoso sexual'],
    keywords: ['acoso sexual', 'ley 2365', 'protocolo acoso sexual'],
    fallbackId: 'abogado_laboral',
  },
  {
    id: 'asistente_metodo_rosa',
    aliases: ['asistente metodo rosa', 'analista ergonomico rosa', 'metodo rosa'],
    keywords: ['metodo rosa', 'rosa ergonomia'],
    fallbackId: 'fisioterapeuta_laboral',
  },
  {
    id: 'analista_ipt_ergonomico',
    aliases: ['analista ipt ergonomico', 'inspector de puesto de trabajo ipt', 'inspector de puesto de trabajo', 'inspeccion ipt'],
    keywords: ['ipt', 'inspeccion puesto de trabajo', 'puesto ergonomico'],
    fallbackId: 'fisioterapeuta_laboral',
  },
  {
    id: 'asistente_inv_at',
    aliases: ['asistente inv at', 'analista forense de accidentalidad at', 'investigacion accidentes at'],
    keywords: ['accidentalidad at', 'investigacion de accidentes', 'analista at'],
    fallbackId: 'simulador_accidentes',
  },
  {
    id: 'asistente_inv_el',
    aliases: ['asistente inv el', 'analista forense de enfermedad laboral el', 'enfermedad laboral el'],
    keywords: ['enfermedad laboral el', 'analista el', 'origen el'],
    fallbackId: 'simulador_accidentes',
  },
];

const findMatchingAgent = (targetName: string, agentsList: any[]) => {
  if (!targetName || !agentsList?.length) return null;
  const target = normalizeStr(targetName);

  // 1. Coincidencia exacta por ID o nombre
  let found = agentsList.find((a) => a.id === targetName || normalizeStr(a.name) === target);
  if (found) return found;

  // 2. Coincidencia a través de la taxonomía especializada de WAPPY
  const matchedTaxon = AGENT_TAXONOMY.find((taxon) => {
    if (taxon.id === targetName) return true;
    if (taxon.aliases.some((alias) => target.includes(alias) || alias.includes(target))) return true;
    if (taxon.keywords.some((kw) => target.includes(kw))) return true;
    return false;
  });

  if (matchedTaxon) {
    // Buscar en la lista de agentes un agente cuyo nombre o ID coincida con los alias de la taxonomía
    found = agentsList.find((a) => {
      if (a.id === matchedTaxon.id) return true;
      const aNorm = normalizeStr(a.name);
      return matchedTaxon.aliases.some((alias) => aNorm.includes(alias) || alias.includes(aNorm));
    });
    if (found) return found;

    // Si tiene fallbackId, buscar por el agente de respaldo consolidado
    if (matchedTaxon.fallbackId) {
      const fallbackId = matchedTaxon.fallbackId;
      const fallbackTaxon = AGENT_TAXONOMY.find((t) => t.id === fallbackId);
      if (fallbackTaxon) {
        found = agentsList.find((a) => {
          if (a.id === fallbackTaxon.id) return true;
          const aNorm = normalizeStr(a.name);
          return fallbackTaxon.aliases.some((alias) => aNorm.includes(alias) || alias.includes(aNorm));
        });
        if (found) return found;
      }
    }
  }

  // 3. Coincidencia por inclusión de substring
  found = agentsList.find(
    (a) =>
      normalizeStr(a.name).includes(target) ||
      target.includes(normalizeStr(a.name))
  );
  if (found) return found;

  // 4. Búsqueda por coincidencia de tokens
  const targetWords = target.split(/\s+/).filter((w) => w.length > 2);
  let bestMatch = null;
  let bestOverlap = 0;
  for (const a of agentsList) {
    const aName = normalizeStr(a.name);
    const aWords = aName.split(/\s+/);
    const overlap = targetWords.filter((w) => aWords.some((aw) => aw.includes(w) || w.includes(aw))).length;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestMatch = a;
    }
  }

  return bestOverlap > 0 ? bestMatch : null;
};

export default function TenshiChat() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthContext();
  const { data: agentsData } = useListAgentsQuery({ requiredPermission: 1, limit: 100 });
  const agentsRef = useRef<any[]>([]);

  useEffect(() => {
    if (agentsData?.data) {
      agentsRef.current = agentsData.data;
    }
  }, [agentsData]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'jarvis' | 'chat'>('jarvis');
  const [messages, setMessages] = useState<
    { _id?: string; role: string; content: string; htmlReport?: string }[]
  >([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [tenshiStatus, setTenshiStatus] = useState<string>('');
  const [guiSteps, setGuiSteps] = useState<{ action: string; details: string; status: 'pending' | 'success' | 'failed' }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Tenshi Voice Mode State & Audio Infrastructure ───────────────────────────
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceAmplitude, setVoiceAmplitude] = useState(0);
  const [outputAmplitude, setOutputAmplitude] = useState(0);
  const [isTenshiSpeaking, setIsTenshiSpeaking] = useState(false);
  const [inactivitySeconds, setInactivitySeconds] = useState(0);
  const [voiceStatusText, setVoiceStatusText] = useState('');
  const lastActivityRef = useRef<number>(Date.now());
  const lastUserTranscriptionRef = useRef<string>('');
  const inactivityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectVoiceRef = useRef<() => void>(() => {});

  // Monitoreo de chat y agentes para que Tenshi aprenda y responda al usuario
  const pendingAgentConsultationRef = useRef<{
    agentName: string;
    question: string;
    active: boolean;
    hadStarted: boolean;
    timestamp: number;
    initialMessageId: string | null;
  } | null>(null);

  const isChatSubmitting = useRecoilValue(store.isSubmittingFamily(0));
  const isChatSubmittingRef = useRef(isChatSubmitting);
  useEffect(() => {
    isChatSubmittingRef.current = isChatSubmitting;
  }, [isChatSubmitting]);
  const [isWaitingConsultation, setIsWaitingConsultation] = useState(false);
  const consultationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestChatMessage = useRecoilValue(store.latestMessageFamily(0));
  const latestChatMessageRef = useRef(latestChatMessage);
  latestChatMessageRef.current = latestChatMessage;
  const prevIsChatSubmittingRef = useRef<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const setIsPlayingAudioRef = useRef<((isPlaying: boolean) => void) | null>(null);

  const clearAudioQueue = useCallback(() => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setIsPlayingAudioRef.current?.(false);
    setIsTenshiSpeaking(false);
    setOutputAmplitude(0);
  }, []);

  const playChime = useCallback(() => {
    // Silenciado completamente a petición del usuario (eliminado pitido artificial)
  }, []);

  const playPowerDownChime = useCallback(() => {
    // Silenciado completamente a petición del usuario
  }, []);

  const handleAudioReceived = useCallback((audioData: string) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const existing = (window as any).sharedAudioContext24k;
        audioContextRef.current = (existing && existing.state !== 'closed')
          ? existing
          : new AudioContextClass({ sampleRate: 24000 });
        (window as any).sharedAudioContext24k = audioContextRef.current;
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(console.error);
      }

      const binaryString = atob(audioData);
      const len = binaryString.length;
      const numSamples = Math.floor(len / 2);
      if (numSamples <= 0) return;

      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const dataView = new DataView(bytes.buffer);
      const float32Data = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Data[i] = int16 / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, numSamples, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.05;
      }
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (!outputAnalyserRef.current || (outputAnalyserRef.current as any).context !== ctx) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        outputAnalyserRef.current = analyser;
        analyser.connect(ctx.destination);
      }
      source.connect(outputAnalyserRef.current);
      activeSourcesRef.current.push(source);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsPlayingAudioRef.current?.(false);
          setVoiceStatusText('Tenshi te escucha...');
          setIsTenshiSpeaking(false);
          setOutputAmplitude(0);
        }
      };

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      setIsPlayingAudioRef.current?.(true);
      setVoiceStatusText('Tenshi hablando...');
      setIsTenshiSpeaking(true);
      lastActivityRef.current = Date.now();
    } catch (err) {
      console.error('[Tenshi Voice] Error processing audio playback:', err);
    }
  }, []);

  const sessionOptions = useMemo(
    () => ({
      mode: 'tenshi_voice',
      onAudioReceived: (audioData: string) => {
        handleAudioReceived(audioData);
      },
      onTextReceived: (text: string, isUserTranscription?: boolean) => {
        lastActivityRef.current = Date.now();
        if (isUserTranscription) {
          lastUserTranscriptionRef.current = text;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'user' && (last as any).isLiveVoice) {
              return [...prev.slice(0, -1), { role: 'user', content: text, isLiveVoice: true }];
            }
            return [...prev, { role: 'user', content: text, isLiveVoice: true }];
          });
        } else {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && (last as any).isLiveVoice) {
              return [...prev.slice(0, -1), { role: 'assistant', content: text, isLiveVoice: true }];
            }
            return [...prev, { role: 'assistant', content: text, isLiveVoice: true }];
          });
        }
      },
      onWappyAction: async (action: { id: string; name: string; args: any }) => {
        lastActivityRef.current = Date.now();
        let resultMsg = 'Acción ejecutada';
        setTenshiStatus(`Tenshi ejecutando: ${action.name}...`);

        try {
          if (action.name === 'wappy_navegar') {
            const rawModulo = (action.args?.modulo || '').toLowerCase().trim();
            const rawRuta = action.args?.ruta;

            const HITO_MAP: Record<string, { route: string; sgsstModule?: string }> = {
              // Hito 1: Gobernanza y Cimiento Legal
              diagnostico: { route: '/sgsst?hito=hito1&module=diagnostico', sgsstModule: 'diagnostico' },
              '0312': { route: '/sgsst?hito=hito1&module=diagnostico', sgsstModule: 'diagnostico' },
              responsable: { route: '/sgsst?hito=hito1&module=responsable', sgsstModule: 'responsable' },
              politica: { route: '/sgsst?hito=hito1&module=politica', sgsstModule: 'politica' },
              objetivos: { route: '/sgsst?hito=hito1&module=objetivos', sgsstModule: 'objetivos' },
              legal: { route: '/sgsst?hito=hito1&module=legal', sgsstModule: 'legal' },
              matriz_legal: { route: '/sgsst?hito=hito1&module=legal', sgsstModule: 'legal' },
              rhs: { route: '/sgsst?hito=hito1&module=rhs', sgsstModule: 'rhs' },
              rit: { route: '/sgsst?hito=hito1&module=rit', sgsstModule: 'rit' },
              reglamento: { route: '/sgsst?hito=hito1&module=rhs', sgsstModule: 'rhs' },
              vulnerabilidad: { route: '/sgsst?hito=hito1&module=vulnerabilidad', sgsstModule: 'vulnerabilidad' },
              emergencias: { route: '/sgsst?hito=hito1&module=vulnerabilidad', sgsstModule: 'vulnerabilidad' },
              hito1: { route: '/sgsst?hito=hito1', sgsstModule: 'diagnostico' },

              // Hito 2: Huella Biocéntrica
              perfil_cargo: { route: '/sgsst?hito=hito2&module=perfil_cargo', sgsstModule: 'perfil_cargo' },
              cargo: { route: '/sgsst?hito=hito2&module=perfil_cargo', sgsstModule: 'perfil_cargo' },
              profesigrama: { route: '/sgsst?hito=hito2&module=perfil_cargo', sgsstModule: 'perfil_cargo' },
              perfil_socio: { route: '/sgsst?hito=hito2&module=perfil_socio', sgsstModule: 'perfil_socio' },
              sociodemografico: { route: '/sgsst?hito=hito2&module=perfil_socio', sgsstModule: 'perfil_socio' },
              condiciones_salud: { route: '/sgsst?hito=hito2&module=condiciones_salud', sgsstModule: 'condiciones_salud' },
              salud: { route: '/sgsst?hito=hito2&module=condiciones_salud', sgsstModule: 'condiciones_salud' },
              bio_motor: { route: '/sgsst?hito=hito2&module=perfil_cargo', sgsstModule: 'perfil_cargo' },
              hito2: { route: '/sgsst?hito=hito2', sgsstModule: 'perfil_cargo' },

              // Hito 3: Evaluación Dinámica de Riesgos
              peligros: { route: '/sgsst?hito=hito3&module=peligros', sgsstModule: 'peligros' },
              ipevar: { route: '/sgsst?hito=hito3&module=peligros', sgsstModule: 'peligros' },
              matriz_gtc45: { route: '/sgsst?hito=hito3&module=peligros', sgsstModule: 'peligros' },
              gtc45: { route: '/sgsst?hito=hito3&module=peligros', sgsstModule: 'peligros' },
              animo: { route: '/sgsst?hito=hito3&module=animo', sgsstModule: 'animo' },
              psicosocial: { route: '/sgsst?hito=hito3&module=animo', sgsstModule: 'animo' },
              clima: { route: '/sgsst?hito=hito3&module=animo', sgsstModule: 'animo' },
              participacion_ipevar: { route: '/sgsst?hito=hito3&module=participacion_ipevar', sgsstModule: 'participacion_ipevar' },
              hito3: { route: '/sgsst?hito=hito3', sgsstModule: 'peligros' },

              // Hito 4: Dinámica Operativa y Terreno
              vehicles_pesv: { route: '/sgsst?hito=hito4&module=vehicles_pesv', sgsstModule: 'vehicles_pesv' },
              pesv: { route: '/sgsst?hito=hito4&module=vehicles_pesv', sgsstModule: 'vehicles_pesv' },
              vial: { route: '/sgsst?hito=hito4&module=vehicles_pesv', sgsstModule: 'vehicles_pesv' },
              chemical_registry: { route: '/sgsst?hito=hito4&module=chemical_registry', sgsstModule: 'chemical_registry' },
              quimicos: { route: '/sgsst?hito=hito4&module=chemical_registry', sgsstModule: 'chemical_registry' },
              sga: { route: '/sgsst?hito=hito4&module=chemical_registry', sgsstModule: 'chemical_registry' },
              permiso_alturas: { route: '/sgsst?hito=hito4&module=permiso_alturas', sgsstModule: 'permiso_alturas' },
              alturas: { route: '/sgsst?hito=hito4&module=permiso_alturas', sgsstModule: 'permiso_alturas' },
              analisis_trabajo_seguro: { route: '/sgsst?hito=hito4&module=analisis_trabajo_seguro', sgsstModule: 'analisis_trabajo_seguro' },
              ats: { route: '/sgsst?hito=hito4&module=analisis_trabajo_seguro', sgsstModule: 'analisis_trabajo_seguro' },
              metodo_owas: { route: '/sgsst?hito=hito4&module=metodo_owas', sgsstModule: 'metodo_owas' },
              owas: { route: '/sgsst?hito=hito4&module=metodo_owas', sgsstModule: 'metodo_owas' },
              ergonomia: { route: '/sgsst?hito=hito4&module=metodo_owas', sgsstModule: 'metodo_owas' },
              epp_delivery: { route: '/sgsst?hito=hito4&module=epp_delivery', sgsstModule: 'epp_delivery' },
              epp: { route: '/sgsst?hito=hito4&module=epp_delivery', sgsstModule: 'epp_delivery' },
              heights_lifecycle: { route: '/sgsst?hito=hito4&module=heights_lifecycle', sgsstModule: 'heights_lifecycle' },
              hito4: { route: '/sgsst?hito=hito4', sgsstModule: 'vehicles_pesv' },

              // Hito 5: Cultura, Escuela e Innovación
              capacitaciones: { route: '/sgsst?hito=hito5&module=capacitaciones', sgsstModule: 'capacitaciones' },
              ruta_aprendizaje: { route: '/sgsst?hito=hito5&module=ruta_aprendizaje', sgsstModule: 'ruta_aprendizaje' },
              reporte_actos: { route: '/sgsst?hito=hito5&module=reporte_actos', sgsstModule: 'reporte_actos' },
              actos: { route: '/sgsst?hito=hito5&module=reporte_actos', sgsstModule: 'reporte_actos' },
              app_builder: { route: '/sgsst?hito=hito5&module=app_builder', sgsstModule: 'app_builder' },
              hito5: { route: '/sgsst?hito=hito5', sgsstModule: 'capacitaciones' },

              // Hito 6: Auditoría, Causalidad & Cierre de Ciclo
              estadisticas: { route: '/sgsst?hito=hito6&module=estadisticas', sgsstModule: 'estadisticas' },
              atel: { route: '/sgsst?hito=hito6&module=estadisticas', sgsstModule: 'estadisticas' },
              investigacion_atel: { route: '/sgsst?hito=hito6&module=investigacion_atel', sgsstModule: 'investigacion_atel' },
              accidentes: { route: '/sgsst?hito=hito6&module=investigacion_atel', sgsstModule: 'investigacion_atel' },
              control_acpm: { route: '/sgsst?hito=hito6&module=control_acpm', sgsstModule: 'control_acpm' },
              acpm: { route: '/sgsst?hito=hito6&module=control_acpm', sgsstModule: 'control_acpm' },
              auditoria: { route: '/sgsst?hito=hito6&module=auditoria', sgsstModule: 'auditoria' },
              alta_direccion: { route: '/sgsst?hito=hito6&module=alta_direccion', sgsstModule: 'alta_direccion' },
              investigacion_profunda: { route: '/sgsst?hito=hito6&module=investigacion_profunda', sgsstModule: 'investigacion_profunda' },
              hito6: { route: '/sgsst?hito=hito6', sgsstModule: 'estadisticas' },

              // Hito 7: Inteligencia Artificial & Oráculo Predictivo
              predictivo: { route: '/sgsst?hito=hito7&module=predictivo', sgsstModule: 'predictivo' },
              oraculo: { route: '/sgsst?hito=hito7&module=predictivo', sgsstModule: 'predictivo' },
              oraculo_predictivo: { route: '/sgsst?hito=hito7&module=predictivo', sgsstModule: 'predictivo' },
              siniestralidad: { route: '/sgsst?hito=hito7&module=predictivo', sgsstModule: 'predictivo' },
              hito7: { route: '/sgsst?hito=hito7', sgsstModule: 'predictivo' },

              // Módulos y Aplicativos Generales de WAPPY
              planes: { route: '/planes' },
              precios: { route: '/planes' },
              tarifas: { route: '/planes' },
              suscripciones: { route: '/planes' },
              academia: { route: '/academia?tab=cursos' },
              cursos: { route: '/academia?tab=cursos' },
              curso: { route: '/academia?tab=cursos' },
              training: { route: '/academia?tab=cursos' },
              training_admin: { route: '/training/admin' },
              admin_cursos: { route: '/training/admin' },
              rutas: { route: '/academia?tab=rutas' },
              ruta: { route: '/academia?tab=rutas' },
              ruta_admin: { route: '/ruta-aprendizaje/admin' },
              admin_rutas: { route: '/ruta-aprendizaje/admin' },
              events: { route: '/events-meet' },
              events_meet: { route: '/events-meet' },
              events_meet_admin: { route: '/events-meet/admin' },
              meet: { route: '/academia?tab=meet' },
              clases: { route: '/academia?tab=meet' },
              blog: { route: '/blog' },
              blog_admin: { route: '/blog/admin' },
              admin_blog: { route: '/blog/admin' },
              control: { route: '/sgsst/control' },
              kanban: { route: '/sgsst/control' },
              automatizaciones: { route: '/sgsst/control' },
              agents: { route: '/agents' },
              agentes: { route: '/agents' },
              marketplace: { route: '/agents' },
              live: { route: '/live' },
              inspeccion: { route: '/live' },
              biomecanica: { route: '/live' },
              videollamada: { route: '/live' },
              camara: { route: '/live' },
              chat: { route: '/c/new' },
              chat_sst: { route: '/chat-sst' },
              'chat-sst': { route: '/chat-sst' },
              animo_dashboard: { route: '/sgsst/animo' },
              clima_dashboard: { route: '/sgsst/animo' },
              auditoria_app: { route: '/auditoria' },
              roadmap: { route: '/hoja-de-ruta' },
              hoja_de_ruta: { route: '/hoja-de-ruta' },
              contactanos: { route: '/contactanos' },
              contacto: { route: '/contactanos' },
              comunidad: { route: '/comunidad' },
              matriz: { route: '/matriz' },
              embajadores: { route: '/embajadores' },
              tenshi_admin: { route: '/tenshi/admin' },
              search: { route: '/search' },
            };

            let targetRoute = rawRuta;
            let targetSgsstModule: string | undefined = undefined;

            if (!targetRoute) {
              const matchedKey = Object.keys(HITO_MAP).find((k) => rawModulo.includes(k));
              if (matchedKey && HITO_MAP[matchedKey]) {
                targetRoute = HITO_MAP[matchedKey].route;
                targetSgsstModule = HITO_MAP[matchedKey].sgsstModule;
              } else {
                targetRoute = '/sgsst';
              }
            }

            // Extract sgsst module from targetRoute if present
            if (targetRoute.includes('/sgsst') && targetRoute.includes('module=')) {
              try {
                const urlMatch = targetRoute.match(/module=([^&]+)/);
                if (urlMatch && urlMatch[1]) {
                  targetSgsstModule = urlMatch[1];
                }
              } catch (_) {}
            }

            navigate(targetRoute);

            // Emit live event so active SGSST Dashboard updates immediately without full page reload
            if (targetSgsstModule) {
              window.dispatchEvent(
                new CustomEvent('navigate-sgsst', { detail: { module: targetSgsstModule } })
              );
            }

            resultMsg = `Navegación exitosa a ${targetRoute}`;
          } else if (action.name === 'wappy_abrir_chat_agente') {
            const rawAgente = (action.args?.agente || '').trim();
            let pregunta = (action.args?.pregunta || '').trim();
            const matchedAgent = findMatchingAgent(rawAgente, agentsRef.current);
            const agentName = matchedAgent ? matchedAgent.name : rawAgente;

            // Detectar y enriquecer si la pregunta es un saludo genérico, ruido o vacía
            const isGenericGreeting = (text: string) =>
              /^(hola|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|c[oó]mo\s+est[aá]s|hola\s+c[oó]mo\s+est[aá]s|hola\s+c[oó]mo\s+est[aá]s\s+el\s+d[ií]a\s+de\s+hoy|ciao|por|qu[eé])\.?$/i.test(text.trim());

            if (!pregunta || isGenericGreeting(pregunta) || pregunta.length < 8) {
              const lastUserText = (lastUserTranscriptionRef.current || '').trim();
              if (lastUserText && !isGenericGreeting(lastUserText) && lastUserText.length >= 8) {
                pregunta = lastUserText;
              } else {
                pregunta = `Hola ${agentName}, necesito orientación y asesoría técnica especializada sobre la normativa y procedimientos aplicables.`;
              }
            }

            // Registrar consulta pendiente para que Tenshi escuche la respuesta del agente
            if (consultationTimerRef.current) {
              clearTimeout(consultationTimerRef.current);
              consultationTimerRef.current = null;
            }
            const initialMessageId = latestChatMessageRef.current?.messageId || null;
            pendingAgentConsultationRef.current = {
              agentName,
              question: pregunta,
              active: true,
              hadStarted: false,
              timestamp: Date.now(),
              initialMessageId,
            };
            setIsWaitingConsultation(true);
            setVoiceStatusText(`Esperando a ${agentName}...`);

            const params = new URLSearchParams();
            if (matchedAgent?.id) {
              params.set('agent_id', matchedAgent.id);
            }
            params.set('endpoint', 'agents');
            if (pregunta) {
              params.set('prompt', pregunta);
              params.set('submit', 'true');
            }

            const targetRoute = `/c/new${params.toString() ? `?${params.toString()}` : ''}`;
            navigate(targetRoute);

            // Emitir evento para asegurar que ChatForm lo capture de inmediato
            window.dispatchEvent(
              new CustomEvent('tenshi-submit-agent-prompt', {
                detail: {
                  agentId: matchedAgent?.id,
                  prompt: pregunta,
                },
              })
            );

            // Mantener drawer de Tenshi abierto para que el usuario conserve a Tenshi
            // setIsOpen(false);

            resultMsg = matchedAgent
              ? `Chat abierto con ${matchedAgent.name} y consulta formulada con éxito en pantalla: "${pregunta}". [AVISO CRÍTICO PARA TENSHI]: El especialista apenas está analizando y empezando a redactar en la pantalla. TÚ NO TIENES EL DICTAMEN TÉCNICO AÚN. Limítate a confirmar al usuario en una sola frase breve que ya le abriste el chat y le dejaste la pregunta en pantalla, y que espere a que el especialista termine de responder. NO inventes ni resumas la respuesta técnica.`
              : `Nuevo chat abierto y consulta formulada. [AVISO]: Esperando respuesta en pantalla.`;
          } else if (action.name === 'wappy_seleccionar_empresa') {
            const companyName = action.args?.nombre_o_id;
            resultMsg = `Empresa "${companyName}" seleccionada y activa en el sistema`;
            window.dispatchEvent(
              new CustomEvent('wappy-empresa-cambiada', { detail: { empresa: companyName } })
            );
          } else if (action.name === 'wappy_diligenciar_formulario') {
            const rawModulo = (action.args?.modulo || 'investigacion_atel').toLowerCase().trim();
            const campos = action.args?.campos || {};
            const accion = action.args?.accion || 'llenar';

            // Si no estamos en el módulo correspondiente, navegar hacia él
            if (!window.location.pathname.includes('/sgsst') || !window.location.search.includes(rawModulo)) {
              navigate(`/sgsst?hito=hito6&module=${rawModulo}`);
            }

            // Emitir evento para que el componente del formulario capture los datos
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('wappy-diligenciar-formulario', {
                  detail: { modulo: rawModulo, campos, accion }
                })
              );
            }, 350);

            resultMsg = `Formulario ${rawModulo} diligenciado exitosamente con los datos provistos`;
          } else if (action.name === 'leer_pantalla') {
            const screenText = getVisibleScreenContent(action.args?.seccion);
            resultMsg = screenText;
          } else if (action.name === 'operar_interfaz_visual') {
            const guiRes = await executeGUIAction(
              action.args.accion,
              action.args.indice,
              action.args.texto,
              action.args.direccion
            );
            resultMsg = guiRes.message;
          }
        } catch (e: any) {
          resultMsg = `Error ejecutando acción: ${e.message}`;
        }

        sendWappyActionResult(action.id, action.name, resultMsg);
        setTenshiStatus('');
      },
      onStatusChange: (newStatus: string) => {
        if (newStatus === 'ready' || newStatus === 'connected' || newStatus === 'listening' || newStatus === 'turn_complete') {
          if (newStatus === 'turn_complete') {
            setMessages((prev) => prev.map((m) => ({ ...m, isLiveVoice: false })));
          }
          setVoiceStatusText('Tenshi te escucha...');
        } else if (newStatus === 'speaking') {
          setVoiceStatusText('Tenshi respondiendo...');
        } else if (newStatus === 'interrupted') {
          clearAudioQueue();
          setVoiceStatusText('Tenshi te escucha...');
          setMessages((prev) => prev.map((m) => ({ ...m, isLiveVoice: false })));
        } else if (newStatus === 'idle') {
          setVoiceStatusText('');
        }
      },
      onError: (err: string) => {
        console.error('[Tenshi Voice] Error:', err);
        setVoiceStatusText(`Error: ${err}`);
        setIsVoiceActive(false);
        clearAudioQueue();
        disconnectVoiceRef.current?.();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Se pausó la sesión de voz (${err}). Puedes volver a encender el interruptor cuando desees reanudar.`,
          },
        ]);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, handleAudioReceived, clearAudioQueue]
  );

  const {
    connect: connectVoice,
    disconnect: disconnectVoice,
    getInputVolume,
    sendTextMessage,
    sendWappyActionResult,
    setIsPlayingAudio: setVoiceIsPlayingAudio,
    status: voiceStatus,
  } = useVoiceSession(sessionOptions);
  disconnectVoiceRef.current = disconnectVoice;
  setIsPlayingAudioRef.current = setVoiceIsPlayingAudio;

  const stopVoiceMode = useCallback(() => {
    setIsVoiceActive(false);
    setIsWaitingConsultation(false);
    playPowerDownChime();
    clearAudioQueue();
    disconnectVoice();
    setIsTenshiSpeaking(false);
    setOutputAmplitude(0);
    setVoiceStatusText('');
  }, [disconnectVoice, clearAudioQueue, playPowerDownChime]);

  const startVoiceMode = useCallback(() => {
    setIsVoiceActive(true);

    // Desbloquear AudioContext en Safari de forma silenciosa e instantánea (sin pitidos)
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const existing = (window as any).sharedAudioContext24k;
        const ctx = (existing && existing.state !== 'closed')
          ? existing
          : new AudioContextClass({ sampleRate: 24000 });
        audioContextRef.current = ctx;
        (window as any).sharedAudioContext24k = ctx;

        if (ctx.state === 'suspended') {
          ctx.resume().catch(console.warn);
        }

        // Buffer silencioso de 1 sample para desbloquear el motor de Safari
        const silentBuffer = ctx.createBuffer(1, 1, 24000);
        const silentSource = ctx.createBufferSource();
        silentSource.buffer = silentBuffer;
        silentSource.connect(ctx.destination);
        silentSource.start(0);
      }
    } catch (e) {
      console.warn('[Tenshi Voice] Error desbloqueando AudioContext:', e);
    }

    lastActivityRef.current = Date.now();
    setVoiceStatusText('Tenshi te escucha...');
    connectVoice();
  }, [connectVoice]);

  const toggleVoiceMode = useCallback(() => {
    if (isVoiceActive) {
      stopVoiceMode();
    } else {
      startVoiceMode();
    }
  }, [isVoiceActive, startVoiceMode, stopVoiceMode]);

  // Visual amplitude polling for live waveform & Jarvis avatar reactivity
  useEffect(() => {
    let animFrame: number;
    const updateAmplitude = () => {
      // 1. Calculate Tenshi output audio amplitude when speaking
      if (activeSourcesRef.current.length > 0 && outputAnalyserRef.current) {
        try {
          const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
          outputAnalyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / (dataArray.length * 255);
          setOutputAmplitude(avg);
        } catch (e) {
          setOutputAmplitude(0);
        }
      } else {
        setOutputAmplitude(0);
      }

      // 2. Poll user mic input volume if voice mode is active
      if (isVoiceActive) {
        const vol = getInputVolume();
        setVoiceAmplitude(vol);
      }
      animFrame = requestAnimationFrame(updateAmplitude);
    };

    animFrame = requestAnimationFrame(updateAmplitude);
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isVoiceActive, getInputVolume]);

  // Desbloqueo universal de audio para Safari / iOS en cualquier interacción del usuario
  useEffect(() => {
    const unlockAudio = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // ⏱️ Auto-desactivación por inactividad tras 1 minuto (60 segundos)
  // CRÍTICO: Si Tenshi delegó una consulta a un especialista o el chat está respondiendo,
  // el contador de inactividad se PAUSA y se mantiene activo para no interrumpir la conversación.
  useEffect(() => {
    if (isVoiceActive) {
      lastActivityRef.current = Date.now();
      setInactivitySeconds(0);
      inactivityIntervalRef.current = setInterval(() => {
        const isWaiting =
          Boolean(pendingAgentConsultationRef.current?.active) ||
          Boolean(isChatSubmittingRef.current) ||
          Boolean(isWaitingConsultation);

        if (isWaiting) {
          // Timeout de seguridad de 10 minutos por si el agente o la red fallan completamente
          if (
            pendingAgentConsultationRef.current &&
            Date.now() - pendingAgentConsultationRef.current.timestamp > 10 * 60 * 1000
          ) {
            console.warn('[Tenshi Voice] Timeout de seguridad (10 min) esperando respuesta del especialista.');
            pendingAgentConsultationRef.current.active = false;
            setIsWaitingConsultation(false);
          } else {
            // Mantener actividad fresca y el contador en cero mientras el especialista genera su dictamen
            lastActivityRef.current = Date.now();
            setInactivitySeconds(0);
            return;
          }
        }

        const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
        setInactivitySeconds(elapsed);
        if (elapsed >= 60) {
          console.log('[Tenshi Voice] 60s inactividad alcanzada. Auto-desactivando modo voz.');
          stopVoiceMode();
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                'ℹ️ Modo voz pausado automáticamente tras 1 minuto sin actividad para ahorrar batería y recursos. Cuando quieras volver a hablarme, solo vuelve a encender el interruptor. 😊',
            },
          ]);
        }
      }, 1000);
    } else {
      if (inactivityIntervalRef.current) {
        clearInterval(inactivityIntervalRef.current);
        inactivityIntervalRef.current = null;
      }
      setInactivitySeconds(0);
    }
    return () => {
      if (inactivityIntervalRef.current) {
        clearInterval(inactivityIntervalRef.current);
        inactivityIntervalRef.current = null;
      }
    };
  }, [isVoiceActive, isWaitingConsultation, stopVoiceMode]);

  // 🧠 Escuchar y procesar la respuesta del especialista para que Tenshi aprenda y hable al usuario
  useEffect(() => {
    if (!pendingAgentConsultationRef.current || !pendingAgentConsultationRef.current.active) {
      if (consultationTimerRef.current) {
        clearTimeout(consultationTimerRef.current);
        consultationTimerRef.current = null;
      }
      return;
    }

    const consultation = pendingAgentConsultationRef.current;
    const currentMsg = latestChatMessage;

    // Detectar si el especialista ya creó su mensaje de respuesta
    const isAssistantMsg =
      Boolean(currentMsg) &&
      currentMsg?.messageId !== consultation.initialMessageId &&
      !currentMsg?.isCreatedByUser;

    const rawMsgText = (currentMsg?.text || '').trim();

    // Detección estricta de placeholder / carga / pensamiento
    const isPlaceholder =
      !rawMsgText ||
      rawMsgText.length < 25 ||
      /^(pensando respuesta|\.\.\.|\s*)*$/i.test(rawMsgText) ||
      rawMsgText.includes('Pensando respuesta...');

    // Marcar que el especialista ya empezó a trabajar si está enviando o si ya hay mensaje con contenido
    if (isChatSubmitting || (isAssistantMsg && !isPlaceholder)) {
      consultation.hadStarted = true;
    }

    // CASO 1: Error explícito en el mensaje del chat
    if (isAssistantMsg && currentMsg?.error === true && !isChatSubmitting) {
      if (consultationTimerRef.current) {
        clearTimeout(consultationTimerRef.current);
        consultationTimerRef.current = null;
      }
      console.warn('[Tenshi] El especialista reportó un error explícito en el chat:', currentMsg);
      consultation.active = false;
      setIsWaitingConsultation(false);

      if (isVoiceActive) {
        lastActivityRef.current = Date.now();
        setVoiceStatusText(`Error con ${consultation.agentName}`);
        const errorPromptForTenshi = `[SISTEMA INTERNO WAPPY]: Hubo un problema al procesar la consulta con el especialista ${consultation.agentName}. El chat central reportó un error o sobrecarga técnica en el modelo y no generó la respuesta.
INSTRUCCIÓN PARA TENSHI: En voz alta al usuario, infórmale con calma, cercanía y profesionalismo que el especialista ${consultation.agentName} tuvo una intermitencia o error en el chat y no pudo generar la respuesta en este momento. Sugiérele reintentar la consulta en un momento o preguntarte otra cosa mientras se restablece. NO inventes que el especialista respondió ni uses contenido de conversaciones anteriores.`;
        sendTextMessage(errorPromptForTenshi);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Tenshi:** Hubo un inconveniente al consultar a **${consultation.agentName}** sobre *"${consultation.question}"* (el servicio del especialista reportó un error en el chat). Por favor reintenta en unos instantes.`,
        },
      ]);
      return;
    }

    // CASO 2: El especialista sigue generando (streaming, pensando, ejecutando búsquedas web o aún no inicia)
    if (isChatSubmitting || isPlaceholder || !consultation.hadStarted) {
      if (consultationTimerRef.current) {
        clearTimeout(consultationTimerRef.current);
        consultationTimerRef.current = null;
      }

      if (isAssistantMsg && !isPlaceholder) {
        setVoiceStatusText(`${consultation.agentName} respondiendo...`);
      } else {
        setVoiceStatusText(`Esperando a ${consultation.agentName}...`);
      }
      return;
    }

    // CASO 3: El especialista completó exitosamente su respuesta.
    // Usar estabilización de 1500ms para asegurar que el streaming finalizó por completo y no es solo una pausa entre tool calls.
    if (isAssistantMsg && !isChatSubmitting && !isPlaceholder && !currentMsg?.error) {
      if (consultationTimerRef.current) {
        clearTimeout(consultationTimerRef.current);
      }

      setVoiceStatusText(`${consultation.agentName} finalizando respuesta...`);

      consultationTimerRef.current = setTimeout(() => {
        if (!pendingAgentConsultationRef.current || !pendingAgentConsultationRef.current.active) {
          return;
        }

        const finalMsg = (latestChatMessageRef.current?.text || rawMsgText).trim();
        if (finalMsg.length < 25 || finalMsg.includes('Pensando respuesta...')) {
          return;
        }

        consultation.active = false;
        setIsWaitingConsultation(false);

        console.log(
          `[Tenshi] ✅ Respuesta técnica capturada exitosamente de ${consultation.agentName}:`,
          finalMsg.substring(0, 120),
        );

        // 1. Si el Modo Voz está activo, instruir a Tenshi Live para que hable al usuario con su conocimiento
        if (isVoiceActive) {
          lastActivityRef.current = Date.now();
          setVoiceStatusText(`Tenshi respondiendo sobre ${consultation.agentName}...`);
          const promptForTenshi = `[SISTEMA INTERNO WAPPY]: El usuario te pidió consultar a ${consultation.agentName} sobre: "${consultation.question}". El ${consultation.agentName} acaba de responder lo siguiente en el chat:\n\n"""\n${finalMsg.substring(0, 1200)}\n"""\n\nINSTRUCCIÓN PARA TENSHI: En voz alta al usuario, habla con tu estilo fresco, profesional y cercano. Confírmale en 2 o 3 oraciones concisas el punto técnico principal que dictaminó el ${consultation.agentName}, y añade tu recomendación como Tenshi para avanzar en la plataforma o en el SG-SST.`;
          sendTextMessage(promptForTenshi);
        }

        // 2. Registrar en la conversación interna de Tenshi
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `💡 **Tenshi:** He revisado la respuesta que te dio **${consultation.agentName}** sobre *"${consultation.question}"*. En el chat central puedes consultar todo el sustento técnico y normativo detallado. Si deseas que articulemos esto con algún hito o matriz de WAPPY, solo indícamelo.`,
          },
        ]);
      }, 1500);
    }
  }, [latestChatMessage, isChatSubmitting, isVoiceActive, sendTextMessage]);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    elemX: number;
    elemY: number;
  } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  const startDrag = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      elemX: rect.left,
      elemY: rect.top,
    };
    hasMovedRef.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const btn = target.closest('button');
    if (btn && btn !== e.currentTarget) return;
    if (target.closest('a')) return;
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('button');
    if (btn && btn !== e.currentTarget) return;
    if (target.closest('a')) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedRef.current = true;
      }
      let newX = dragStartRef.current.elemX + dx;
      let newY = dragStartRef.current.elemY + dy;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
        newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));
      }

      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStartRef.current) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.mouseX;
      const dy = touch.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedRef.current = true;
      }
      let newX = dragStartRef.current.elemX + dx;
      let newY = dragStartRef.current.elemY + dy;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        newX = Math.max(0, Math.min(newX, viewportWidth - rect.width));
        newY = Math.max(0, Math.min(newY, viewportHeight - rect.height));
      }

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
    };

    const handleTouchEnd = () => {
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Ensure the chat window stays inside screen bounds when toggled open/closed
  useEffect(() => {
    if (!position || !containerRef.current) return;
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = rect.left;
      let adjustedY = rect.top;

      if (rect.right > viewportWidth) {
        adjustedX = Math.max(0, viewportWidth - rect.width);
      }
      if (rect.left < 0) {
        adjustedX = 0;
      }
      if (rect.bottom > viewportHeight) {
        adjustedY = Math.max(0, viewportHeight - rect.height);
      }
      if (rect.top < 0) {
        adjustedY = 0;
      }

      if (adjustedX !== rect.left || adjustedY !== rect.top) {
        setPosition({ x: adjustedX, y: adjustedY });
      }
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      if (!position || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = rect.left;
      let adjustedY = rect.top;

      if (rect.right > viewportWidth) {
        adjustedX = Math.max(0, viewportWidth - rect.width);
      }
      if (rect.left < 0) {
        adjustedX = 0;
      }
      if (rect.bottom > viewportHeight) {
        adjustedY = Math.max(0, viewportHeight - rect.height);
      }
      if (rect.top < 0) {
        adjustedY = 0;
      }

      setPosition({ x: adjustedX, y: adjustedY });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  const handleButtonClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setIsOpen(true);
    setViewMode('jarvis');
  };

  const { data: config } = useQuery(
    ['tenshiConfig', token],
    async () => {
      const res = await axios.get('/api/tenshi/config', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000,
    },
  );

  const { data: historyData, refetch: refetchHistory } = useQuery(
    ['tenshiHistory', token],
    async () => {
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.data;
    },
    {
      enabled: isAuthenticated,
      staleTime: 10 * 1000,
    },
  );

  useEffect(() => {
    if (historyData) {
      if (historyData.length > 0) {
        setMessages(historyData);
      } else {
        setMessages([
          {
            role: 'assistant',
            content:
              '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
          },
        ]);
      }
    }
  }, [historyData]);

  const handleClearHistory = async () => {
    if (!confirm('¿Deseas reiniciar la conversación con Tenshi?')) return;
    try {
      await axios.delete('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages([
        {
          role: 'assistant',
          content:
            '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
        },
      ]);
      refetchHistory();
    } catch (err) {
      console.error('Error clearing Tenshi history:', err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('¿Deseas eliminar este mensaje y el resto de la conversación a partir de este punto?')) return;
    try {
      await axios.delete(`/api/tenshi/message/${msgId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages(res.data.length > 0 ? res.data : [
        {
          role: 'assistant',
          content: '¡Hola! Soy Tenshi, tu asistente en WAPPY IA. ¿En qué te puedo ayudar hoy con el sistema?',
        }
      ]);
      refetchHistory();
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleUpdateMessage = async (msgId: string, newContent: string) => {
    if (!newContent.trim()) return;
    setEditingMessageId(null);
    setIsTyping(true);
    try {
      await axios.put(
        `/api/tenshi/message/${msgId}`,
        { content: newContent },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages(res.data);
      refetchHistory();
      
      await runChatTurn(res.data);
    } catch (err) {
      console.error('Error updating message:', err);
      setIsTyping(false);
    }
  };

  const handleRegenerate = async (msgId: string) => {
    setIsTyping(true);
    try {
      await axios.delete(`/api/tenshi/message/${msgId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      const res = await axios.get('/api/tenshi/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages(res.data);
      refetchHistory();

      await runChatTurn(res.data);
    } catch (err) {
      console.error('Error regenerating response:', err);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setViewMode('jarvis');
    };
    window.addEventListener('open-tenshi-chat', handleOpen);
    return () => window.removeEventListener('open-tenshi-chat', handleOpen);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const showVoiceModal = useRecoilValue(store.showVoiceModal);
  const showLiveAnalysisModal = useRecoilValue(store.showLiveAnalysisModal);

  if (!isAuthenticated || !config || !config.isActive || showVoiceModal || showLiveAnalysisModal) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-24 md:bottom-6 right-6',
    'bottom-left': 'bottom-24 md:bottom-6 left-6',
    'top-right': 'top-6 md:top-6 right-6',
    'top-left': 'top-6 md:top-6 left-6',
  };

  const floatPosition =
    positionClasses[config.location as keyof typeof positionClasses] || 'bottom-6 right-6';

  const runChatTurn = async (currentMessages: { role: string; content: string; htmlReport?: string }[]) => {
    setIsTyping(true);
    setTenshiStatus('Capturando pantalla...');
    try {
      const lastMessage = currentMessages.at(-1);
      const isLoopFeedback = lastMessage?.content?.startsWith('[RESULTADO_GUI]');
      
      // Heurística de captura de DOM: capturar si estamos en un bucle interactivo de GUI, si el usuario pide interactuar o si estamos en SGSST
      const textQuery = lastMessage?.role === 'user' ? lastMessage.content.toLowerCase() : '';
      const uiActionKeywords = ['clic', 'click', 'pantalla', 'formulario', 'abre', 'abrir', 'llena', 'llenar', 'guarda', 'guardar', 'navega', 'navegar', 'boton', 'botón', 'scroll', 'interactua', 'digita', 'aplicativo', 'aplicacion', 'aplicación', 'escribe', 'escribir', 'reporte', 'reportar', 'investigacion', 'investigación', 'accidente', 'diligencia', 'diligenciar', 'colocar', 'datos', 'crear', 'lee', 'leeme', 'léeme', 'muestra', 'muéstrame', 'informe', 'registros', 'que hay', 'qué hay'];
      const isUiActionQuery = uiActionKeywords.some(kw => textQuery.includes(kw));
      const isSgsstPage = window.location.pathname.startsWith('/sgsst');
      
      const shouldCaptureDOM = isLoopFeedback || isUiActionQuery || isSgsstPage;
      
      let domState = '';
      if (shouldCaptureDOM) {
        const dehydrated = getDehydratedDOM();
        const visibleContent = getVisibleScreenContent();
        domState = `${dehydrated}\n\n=== CONTENIDO VISIBLE E INFORMES DE PANTALLA ===\n${visibleContent}`;
      }
      console.log('[Tenshi Frontend] Dehydrated DOM length:', domState.length, '(Capture enabled:', shouldCaptureDOM, ')');
      
      setTenshiStatus('Consultando con Tenshi...');

      // Limitar el historial a los últimos 20 mensajes para evitar saturación de tokens (429).
      // Siempre preservar el primer mensaje del usuario como ancla de la tarea original.
      const filteredMessages = currentMessages.filter((m) => m.role !== 'system');
      const MAX_HISTORY = 20;
      let cappedMessages = filteredMessages;
      if (filteredMessages.length > MAX_HISTORY) {
        const firstUserMsg = filteredMessages.find(m => m.role === 'user');
        const recentMessages = filteredMessages.slice(-MAX_HISTORY);
        // Preservar el primer mensaje si no está en los recientes
        if (firstUserMsg && !recentMessages.includes(firstUserMsg)) {
          cappedMessages = [firstUserMsg, ...recentMessages];
        } else {
          cappedMessages = recentMessages;
        }
      }

      const response = await axios.post(
        '/api/tenshi/chat',
        {
          messages: cappedMessages,
          browserState: domState,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      const responseData = response.data;
      console.log('[Tenshi Frontend] Received response:', responseData);

      const assistantMsg = {
        role: 'assistant',
        content: responseData.response,
        htmlReport: responseData.htmlReport,
        isIntermediate: !!responseData.guiAction || (responseData.guiActions && responseData.guiActions.length > 0),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Si Tenshi requiere una o más acciones visuales, las ejecutamos en secuencia en el cliente
      const actions = responseData.guiActions || (responseData.guiAction ? [responseData.guiAction] : []);
      if (actions.length > 0) {
        console.log('[Tenshi Frontend] GUI actions requested:', actions);
        let cumulativeMessages = [...currentMessages, assistantMsg];
        let lastResult: { success: boolean; message: string } | null = null;
        let index = 0;

        for (const action of actions) {
          setTenshiStatus(`Acción visual (${index + 1}/${actions.length}): ${action.accion}...`);

          // Registrar paso de automatización para mostrar en el acordeón de acciones
          const actionLabel = action.accion.toUpperCase();
          let detailLabel = '';
          if (action.indice !== undefined) {
            detailLabel = `Índice [${action.indice}]`;
          }
          if (action.texto) {
            detailLabel += `${detailLabel ? ': ' : ''}"${action.texto}"`;
          } else if (action.direccion) {
            detailLabel += `${detailLabel ? ': ' : ''}hacia ${action.direccion}`;
          }
          if (!detailLabel) {
            detailLabel = action.accion === 'esperar' ? 'Espera temporal de 1.5s' : 'Ejecución de acción general';
          }

          setGuiSteps((prev) => [
            ...prev,
            { action: actionLabel, details: detailLabel, status: 'pending' },
          ]);

          // Esperamos un momento mínimo para actualización de UI
          await new Promise((resolve) => setTimeout(resolve, 250));

          setTenshiStatus(`Desplazando e interactuando con elemento [${action.indice}]...`);
          const actionResult = await executeGUIAction(
            action.accion,
            action.indice,
            action.texto,
            action.direccion,
          );
          console.log('[Tenshi Frontend] GUI action result:', actionResult);

          lastResult = actionResult;

          // Actualizar estado de la acción ejecutada en los logs del acordeón
          setGuiSteps((prev) => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1].status = actionResult.success ? 'success' : 'failed';
            }
            return updated;
          });

          // Guardar en el historial temporal acumulado para que el backend tenga contexto
          cumulativeMessages.push({
            role: 'user',
            content: `[RESULTADO_GUI] Acción ${action.accion} ejecutada en elemento [${action.indice}]. Resultado: ${actionResult.message}`,
          });

          index++;
        }

        const newDOM = getDehydratedDOM();
        const finalFeedbackMsg = {
          role: 'user',
          content: `[RESULTADO_GUI] Lote de acciones completado en el cliente. Último resultado: ${lastResult?.message}. Estado actual de la pantalla:\n${newDOM}`,
        };

        // Reanudamos la conversación de forma automática pasándole todo el historial acumulado en lote
        console.log('[Tenshi Frontend] Sending batched feedback to backend:', finalFeedbackMsg);
        setTenshiStatus('Enviando resultado...');
        await runChatTurn([...cumulativeMessages, finalFeedbackMsg]);
      } else {
        console.log('[Tenshi Frontend] No GUI action requested. Ending turn.');
        setTenshiStatus('');
        setIsTyping(false);
      }
    } catch (error: any) {
      console.error('[Tenshi Frontend] Error in runChatTurn:', error);
      setTenshiStatus('Error en la automatización.');
      const status = error.response?.status;
      let userFriendlyMsg = error.response?.data?.details || error.message;

      if (status === 502 || userFriendlyMsg.includes('502')) {
        userFriendlyMsg =
          'Se interrumpió la conexión brevemente mientras el servidor terminaba de actualizarse (Error 502). Ya estamos totalmente en línea. ¡Por favor reenvíame tu solicitud!';
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Lo siento, he tenido un inconveniente de conexión. ${userFriendlyMsg}`,
        },
      ]);
      setIsTyping(false);
      setTenshiStatus('');
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (typeof customText === 'string' ? customText : input).trim();
    if (!textToSend || isTyping) return;

    setGuiSteps([]); // Limpiar logs de automatización anteriores
    const userMsg = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    await runChatTurn([...messages, userMsg]);
  };

  const openHtmlReport = (html: string) => {
    let fullContent = html;

    const stickyHeader = `
        <div id="report-sticky-header" style="position: sticky; top: 0; background: #ffffff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; z-index: 99999; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="background: #10b981; color: #ffffff !important; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em;">WAPPY IA</span>
                <span id="report-header-title" style="color: #0f172a !important; font-weight: 700; font-size: 14px;">Informe Oficial de SST</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button id="theme-toggle-btn" onclick="toggleTheme()" style="background: #f1f5f9; color: #334155 !important; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                    <span id="theme-btn-text">🌓 Modo Oscuro</span>
                </button>
                <button onclick="window.print()" style="background: #10b981; color: #ffffff !important; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;">
                    🖨️ Imprimir / Guardar PDF
                </button>
            </div>
        </div>
        <script>
            function toggleTheme() {
                const isDark = document.documentElement.classList.toggle('report-dark');
                document.body.classList.toggle('report-dark', isDark);
                const btnText = document.getElementById('theme-btn-text');
                const btn = document.getElementById('theme-toggle-btn');
                const title = document.getElementById('report-header-title');
                const header = document.getElementById('report-sticky-header');
                if (isDark) {
                    if(btnText) btnText.innerText = '☀️ Modo Claro';
                    if(btn) { btn.style.backgroundColor = '#334155'; btn.style.borderColor = '#475569'; btn.style.setProperty('color', '#ffffff', 'important'); }
                    if(header) { header.style.backgroundColor = '#1e293b'; header.style.borderColor = '#334155'; }
                    if(title) title.style.setProperty('color', '#ffffff', 'important');
                } else {
                    if(btnText) btnText.innerText = '🌓 Modo Oscuro';
                    if(btn) { btn.style.backgroundColor = '#f1f5f9'; btn.style.borderColor = '#cbd5e1'; btn.style.setProperty('color', '#334155', 'important'); }
                    if(header) { header.style.backgroundColor = '#ffffff'; header.style.borderColor = '#e2e8f0'; }
                    if(title) title.style.setProperty('color', '#0f172a', 'important');
                }
            }
        </script>
        <style>
            @media print {
                #report-sticky-header { display: none !important; }
            }
            /* Global Light Theme Override (High Contrast) */
            html, body {
                background-color: #f8fafc !important;
                color: #0f172a !important;
                font-family: system-ui, -apple-system, sans-serif !important;
                margin: 0; padding: 0;
            }
            h1, h2, h3, h4, h5, h6 {
                color: #0f172a !important;
            }
            p, span, li, td, th, label, div {
                color: inherit;
            }
            /* Fix invisible text on cards/containers in Light Mode */
            .text-white, .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400 {
                color: #0f172a !important;
            }
            /* Table Styling High Contrast */
            table {
                background-color: #ffffff !important;
                border: 1px solid #cbd5e1 !important;
                width: 100% !important;
                border-collapse: collapse !important;
                margin: 16px 0 !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            th, td {
                border: 1px solid #cbd5e1 !important;
                color: #0f172a !important;
                padding: 12px 16px !important;
                text-align: left;
            }
            th {
                background-color: #f1f5f9 !important;
                font-weight: 700 !important;
                color: #0f172a !important;
            }
            tr:nth-child(even) td {
                background-color: #f8fafc !important;
            }
            
            /* Dark Theme Overrides */
            html.report-dark, body.report-dark {
                background-color: #0f172a !important;
                color: #f8fafc !important;
            }
            .report-dark h1, .report-dark h2, .report-dark h3, .report-dark h4, .report-dark h5, .report-dark h6 {
                color: #ffffff !important;
            }
            .report-dark .text-white, .report-dark .text-slate-100, .report-dark .text-slate-200, .report-dark .text-slate-300, .report-dark .text-slate-400 {
                color: #f8fafc !important;
            }
            .report-dark table {
                background-color: #1e293b !important;
                border-color: #334155 !important;
            }
            .report-dark th, .report-dark td {
                border-color: #334155 !important;
                color: #f8fafc !important;
            }
            .report-dark th {
                background-color: #334155 !important;
                color: #ffffff !important;
            }
            .report-dark tr:nth-child(even) td {
                background-color: #0f172a !important;
            }
        </style>
        `;

    if (fullContent.includes('<body')) {
      fullContent = fullContent.replace(/<body([^>]*)>/i, `<body$1>${stickyHeader}`);
    } else {
      fullContent = stickyHeader + fullContent;
    }

    // Use Blob URL so printing or closing print modal in Safari/Chrome doesn't destroy the tab
    const blob = new Blob([fullContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  };

  const getHtmlFromMsg = (msg: { content: string; htmlReport?: string }) => {
    if (msg.htmlReport) return msg.htmlReport;
    if (msg.content.includes('<!DOCTYPE html>') || msg.content.includes('<html')) {
      const match = msg.content.match(/<!DOCTYPE html[\s\S]*<\/html>|<html[\s\S]*<\/html>/i);
      if (match) return match[0];
    }
    return null;
  };

  return (
    <div
      ref={containerRef}
      style={
        position
          ? {
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              bottom: 'auto',
              right: 'auto',
            }
          : {}
      }
      className={`tenshi-widget-container fixed z-[9999] ${position ? '' : floatPosition} flex flex-col items-end`}
    >
      {/* Dynamic Keyframes for Tenshi Jarvis Avatar */}
      <style>{`
        @keyframes tenshiFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(0.6deg); }
        }
        @keyframes tenshiSpeakingBob {
          0%, 100% { transform: scale(1) translateY(0px); }
          25% { transform: scale(1.04) translateY(-3px); }
          50% { transform: scale(0.98) translateY(1px); }
          75% { transform: scale(1.05) translateY(-4px); }
        }
        @keyframes tenshiSpinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes tenshiSpinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-tenshi-float {
          animation: tenshiFloat 4s ease-in-out infinite;
        }
        .animate-tenshi-speaking {
          animation: tenshiSpeakingBob 0.65s ease-in-out infinite;
        }
        .animate-tenshi-spin {
          animation: tenshiSpinSlow 16s linear infinite;
        }
        .animate-tenshi-spin-reverse {
          animation: tenshiSpinReverse 10s linear infinite;
        }
      `}</style>

      {isOpen && (
        viewMode === 'jarvis' ? (
          /* ─── MODO JARVIS: AVATAR INTERACTIVO CON MOVIMIENTO Y BOTONERA ─── */
          <div className="mb-4 flex h-[520px] w-[350px] sm:w-[390px] flex-col overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-gray-950 via-slate-900 to-gray-950 text-white shadow-[0_12px_45px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in zoom-in-95 duration-200 select-none">
            {/* Cabecera HUD Estilo Jarvis */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="flex shrink-0 cursor-move items-center justify-between border-b border-emerald-500/20 bg-black/40 px-4 py-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  {isTenshiSpeaking ? (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                      <span>HABLANDO</span>
                    </>
                  ) : isVoiceActive && voiceStatus === 'listening' ? (
                    <>
                      <Mic className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                      <span className="text-cyan-300">ESCUCHANDO</span>
                    </>
                  ) : isTyping ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                      <span className="text-amber-300">PENSANDO</span>
                    </>
                  ) : isVoiceActive ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>EN VIVO</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span>TENSHI // JARVIS</span>
                    </>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400/60 font-mono">
                  v2.5 AI
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Reiniciar conversación"
                  className="rounded-full p-1.5 text-emerald-300/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Cerrar asistente"
                  className="rounded-full p-1.5 text-emerald-300/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Escenario Central: Avatar Animado Holográfico */}
            <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-2 overflow-hidden">
              {/* Resplandor radial de fondo */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14)_0%,transparent_70%)] pointer-events-none" />

              {/* Órbitas holográficas concéntricas */}
              <div className="absolute h-48 w-48 rounded-full border border-dashed border-emerald-500/25 animate-tenshi-spin pointer-events-none" />
              <div className="absolute h-40 w-40 rounded-full border border-emerald-400/15 animate-tenshi-spin-reverse pointer-events-none" />

              {/* Anillo de aura reactiva a la amplitud de audio */}
              <div
                className="absolute h-36 w-36 rounded-full border transition-all duration-100 pointer-events-none"
                style={{
                  transform: `scale(${1 + Math.min((isTenshiSpeaking ? outputAmplitude : (isVoiceActive ? voiceAmplitude : 0)) * 0.45, 0.28)})`,
                  borderColor: isTenshiSpeaking
                    ? 'rgba(52, 211, 153, 0.75)'
                    : isVoiceActive
                    ? 'rgba(56, 189, 248, 0.75)'
                    : 'rgba(16, 185, 129, 0.25)',
                  boxShadow: isTenshiSpeaking
                    ? '0 0 35px rgba(52, 211, 153, 0.5)'
                    : isVoiceActive
                    ? '0 0 25px rgba(56, 189, 248, 0.4)'
                    : 'none',
                }}
              />

              {/* Avatar Core con movimiento al hablar / idle */}
              <div
                className={cn(
                  "relative h-28 w-28 sm:h-32 sm:w-32 rounded-full p-1 border-2 transition-all duration-300",
                  isTenshiSpeaking
                    ? "animate-tenshi-speaking border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.7)]"
                    : isTyping
                    ? "border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-pulse"
                    : isVoiceActive
                    ? "border-cyan-400 shadow-[0_0_25px_rgba(56,189,248,0.5)]"
                    : "animate-tenshi-float border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                )}
                style={{
                  transform: isTenshiSpeaking
                    ? `scale(${1 + Math.min(outputAmplitude * 0.25, 0.15)})`
                    : undefined,
                }}
              >
                <img
                  src="/assets/tenshi.png"
                  alt="Tenshi Avatar"
                  className="h-full w-full rounded-full object-cover shadow-inner pointer-events-none"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/logo.svg';
                  }}
                />
                {isTenshiSpeaking && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-3 w-8 rounded-full bg-emerald-400/80 blur-[3px] animate-pulse pointer-events-none" />
                )}
              </div>

              {/* Ecualizador dinámico de 7 barras */}
              <div className="mt-3 flex items-center justify-center gap-1.5 h-6">
                {[35, 75, 100, 60, 95, 50, 80].map((baseH, idx) => {
                  const amp = isTenshiSpeaking
                    ? outputAmplitude
                    : isVoiceActive
                    ? voiceAmplitude
                    : 0;
                  const h = amp > 0.04
                    ? Math.max(4, Math.round((baseH / 100) * 24 * Math.min(amp * 3.5, 1.3)))
                    : isTenshiSpeaking
                    ? Math.max(4, (baseH % 14) + 4)
                    : 4;
                  return (
                    <span
                      key={idx}
                      className={cn(
                        "w-1 rounded-full transition-all duration-75",
                        isTenshiSpeaking
                          ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                          : isVoiceActive
                          ? "bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]"
                          : isTyping
                          ? "bg-amber-400 animate-pulse"
                          : "bg-emerald-600/40"
                      )}
                      style={{ height: `${h}px` }}
                    />
                  );
                })}
              </div>

              {/* Subtítulo / Estado de voz */}
              <p className="mt-1.5 text-center text-xs font-medium tracking-wide">
                {isTenshiSpeaking ? (
                  <span className="text-emerald-300">Tenshi hablando...</span>
                ) : isVoiceActive ? (
                  <span className="text-cyan-300">
                    {voiceStatusText || 'Tenshi te escucha... Habla libremente'}
                  </span>
                ) : isTyping ? (
                  <span className="text-amber-300">Pensando y consultando...</span>
                ) : (
                  <span className="text-gray-400">Listo para ayudarte</span>
                )}
              </p>
            </div>

            {/* Caja de Subtítulos / Transcripción Holográfica */}
            <div className="mx-3 mb-2 max-h-20 overflow-y-auto rounded-2xl border border-emerald-500/25 bg-black/50 p-2.5 text-center text-xs backdrop-blur-md shadow-inner">
              {isTyping ? (
                <div className="flex items-center justify-center gap-1.5 text-amber-300 animate-pulse py-0.5">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  <span className="font-medium">Tenshi está analizando tu solicitud...</span>
                </div>
              ) : (() => {
                  const lastAssistant = [...messages].reverse().find(
                    (m) => m.role === 'assistant' && !m.content?.startsWith('[RESULTADO_GUI]') && !(m as any).isIntermediate
                  );
                  const content = lastAssistant?.content || '¡Hola! Soy Tenshi, tu copiloto en WAPPY IA. ¿Qué deseas hacer hoy?';
                  return (
                    <p className="line-clamp-2 text-emerald-100/90 leading-relaxed font-light">
                      "{content}"
                    </p>
                  );
                })()
              }
            </div>

            {/* Chips de Sugerencia Rápida */}
            <div className="mx-3 mb-2 flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => handleSend("¿Qué empresa está activa en el sistema y cuáles son sus datos principales?")}
                disabled={isTyping}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                🏢 Empresa Activa
              </button>
              <button
                type="button"
                onClick={() => handleSend("Léeme la información visible de la pantalla actual")}
                disabled={isTyping}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                🖥️ Leer Pantalla
              </button>
              <button
                type="button"
                onClick={() => handleSend("Abre la Matriz IPEVAR")}
                disabled={isTyping}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                🚦 Matriz IPEVAR
              </button>
            </div>

            {/* Botonera de Control y Campo Rápido */}
            <div className="shrink-0 border-t border-emerald-500/20 bg-black/60 p-3 backdrop-blur-md flex flex-col gap-2">
              {/* Campo de texto en modo Jarvis */}
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-gray-950/80 px-3 py-1.5 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400/30 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isVoiceActive ? "Tenshi te escucha... o escribe aquí" : "Escribe tu consulta a Tenshi..."}
                  className="flex-1 bg-transparent text-xs text-white placeholder-emerald-200/40 outline-none"
                  disabled={isTyping}
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={isTyping || !input.trim()}
                  className="shrink-0 rounded-lg bg-emerald-500 p-1.5 text-white transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-30"
                  title="Enviar consulta"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Botonera Principal: Modo Voz & Ver Chat */}
              <div className="flex items-center gap-2 pt-0.5">
                {/* Botón Modo Voz */}
                <button
                  type="button"
                  onClick={toggleVoiceMode}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium text-xs transition-all duration-300 shadow-md active:scale-95",
                    isVoiceActive
                      ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-300"
                      : "bg-gray-800/90 hover:bg-gray-700/90 text-gray-300 border border-gray-700 hover:text-white"
                  )}
                  title={isVoiceActive ? "Desactivar Modo Voz de Tenshi" : "Activar Modo Voz en vivo con Tenshi"}
                >
                  <div className="relative flex items-center justify-center">
                    <Mic className={cn("h-4 w-4", isVoiceActive && "text-white animate-pulse")} />
                    {isVoiceActive && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
                      </span>
                    )}
                  </div>
                  <span>{isVoiceActive ? "Modo Voz Activo" : "Modo Voz"}</span>
                </button>

                {/* Botón Ver Chat */}
                <button
                  type="button"
                  onClick={() => setViewMode('chat')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium text-xs bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-sm active:scale-95"
                  title="Abrir historial completo de mensajes y reportes"
                >
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  <span>Ver Chat</span>
                  {messages.length > 1 && (
                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      {messages.filter(m => !m.content?.startsWith('[RESULTADO_GUI]') && !(m as any).isIntermediate).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ─── MODO CHAT: HISTORIAL COMPLETO CON BOTÓN PARA VOLVER A JARVIS ─── */
          <div className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in slide-in-from-bottom-5 dark:border-gray-700 dark:bg-gray-800 sm:w-[400px]">
            {/* Header con botón para regresar a Modo Jarvis */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="flex shrink-0 cursor-move select-none items-center justify-between bg-gradient-to-r from-green-600 to-emerald-500 p-4 text-white"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-emerald-200 bg-white p-0.5 shadow-inner">
                  <img
                    src="/assets/tenshi.png"
                    alt="Tenshi"
                    className="h-full w-full rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/logo.svg';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-none">{config.name}</h3>
                  <p className="mt-1 text-xs text-green-100">{config.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewMode('jarvis')}
                  className="flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 px-2.5 py-1 text-xs font-semibold text-white transition-all shadow-sm active:scale-95"
                  title="Cambiar a Modo Avatar Jarvis"
                >
                  <Bot className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
                  <span>Modo Jarvis</span>
                </button>
                <button
                  onClick={handleClearHistory}
                  title="Reiniciar conversación"
                  className="rounded-full p-1.5 text-white transition-colors hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 text-white transition-colors hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
            {(() => {
              const visibleMessages = messages.filter(
              (msg) => !msg.content?.startsWith('[RESULTADO_GUI]') && !(msg as any).isIntermediate
            );
            return visibleMessages.map((msg, i) => (
              <div
                key={i}
                className={`group flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user'
                      ? 'rounded-tr-none bg-blue-600 text-white shadow-md'
                      : 'rounded-tl-none border border-gray-100 bg-white text-gray-800 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  {editingMessageId === msg._id ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full rounded-lg border border-blue-300 p-2 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingMessageId(null)}
                          className="rounded bg-gray-200 px-2.5 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-300 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleUpdateMessage(msg._id!, editingText)}
                          className="rounded bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-blue-700 transition-colors"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="markdown-content max-w-full overflow-hidden">
                        <style>{`
                          .markdown-content table {
                              display: block;
                              width: 100%;
                              overflow-x: auto;
                              white-space: nowrap;
                              border-collapse: collapse;
                              margin-top: 0.5rem;
                              margin-bottom: 0.5rem;
                          }
                          .markdown-content th, .markdown-content td {
                              padding: 6px 10px;
                              border: 1px solid rgba(156, 163, 175, 0.3);
                              font-size: 0.75rem;
                          }
                        `}</style>
                        <Markdown content={msg.content} isLatestMessage={i === visibleMessages.length - 1} />
                      </div>
                      {(() => {
                        const reportHtml = getHtmlFromMsg(msg);
                        if (!reportHtml) return null;
                        return (
                          <button
                            onClick={() => openHtmlReport(reportHtml)}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-xl active:scale-95"
                          >
                            <FileText className="h-4 w-4 animate-pulse" />
                            {/* eslint-disable-next-line i18next/no-literal-string */}
                            <span>📄 Abrir / Descargar Informe HTML (PDF)</span>
                          </button>
                        );
                      })()}
                    </>
                  )}
                </div>

                {/* Message action controls (Edit, Delete, Regenerate) */}
                {msg._id && editingMessageId !== msg._id && (
                  <div className={`mt-1 flex items-center gap-2 text-[10px] transition-all opacity-40 hover:opacity-100 sm:opacity-0 group-hover:opacity-100 ${
                    msg.role === 'user' ? 'justify-end pr-1 text-blue-500/70 dark:text-blue-400/70' : 'justify-start pl-1 text-gray-400 dark:text-gray-500'
                  }`}>
                    {msg.role === 'user' && (
                      <button
                        onClick={() => {
                          setEditingMessageId(msg._id!);
                          setEditingText(msg.content);
                        }}
                        className="flex items-center gap-0.5 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                      >
                        <Edit2 className="h-2.5 w-2.5" />
                        <span>Editar</span>
                      </button>
                    )}
                    {msg.role === 'assistant' && i === visibleMessages.length - 1 && (
                      <button
                        onClick={() => handleRegenerate(msg._id!)}
                        className="flex items-center gap-0.5 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      >
                        <RefreshCw className="h-2.5 w-2.5" />
                        <span>Regenerar</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMessage(msg._id!)}
                      className="flex items-center gap-0.5 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                )}
              </div>
            ));
          })()}

            {/* Live automation steps collapsible log */}
            {guiSteps.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white/80 p-3.5 backdrop-blur-sm shadow-sm dark:border-gray-700/50 dark:bg-gray-800/80">
                <details className="group" open>
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-xs text-gray-700 select-none dark:text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Acciones automáticas en pantalla ({guiSteps.filter(s => s.status === 'success').length}/{guiSteps.length})
                    </span>
                    <span className="transition-transform duration-200 group-open:rotate-180 text-gray-400 text-[10px]">▼</span>
                  </summary>
                  <div className="mt-3.5 space-y-2 border-t border-gray-100/50 pt-2.5 dark:border-gray-700/50">
                    {guiSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[9px] dark:bg-gray-700 dark:text-gray-300">
                            {step.action}
                          </span>
                          {step.details}
                        </span>
                        <span>
                          {step.status === 'pending' && (
                            <span className="text-amber-500 font-medium animate-pulse">Ejecutando...</span>
                          )}
                          {step.status === 'success' && (
                            <span className="text-emerald-500 font-bold">✓ Listo</span>
                          )}
                          {step.status === 'failed' && (
                            <span className="text-rose-500 font-bold">✗ Error</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-none border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex flex-col gap-2">
                    {tenshiStatus && (
                      <span className="text-[10px] text-gray-500 font-semibold animate-pulse dark:text-gray-400">
                        ⚙️ {tenshiStatus}
                      </span>
                    )}
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area & Voice Mode Switch */}
          <div className="shrink-0 border-t border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            {/* Live Voice HUD Pill when voice is active */}
            {isVoiceActive && (
              <div className="mb-2.5 flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-800 shadow-sm transition-all dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="font-medium tracking-tight">
                    {voiceStatusText || 'Tenshi te escucha... Habla con naturalidad'}
                  </span>
                </div>

                {/* Animated sound wave bars */}
                <div className="flex h-3.5 items-center gap-1">
                  {[35, 75, 100, 60, 85].map((h, i) => {
                    const scaledHeight = Math.max(
                      3,
                      Math.round(h * (voiceAmplitude > 0.05 ? Math.min(voiceAmplitude * 2, 1) : 0.15))
                    );
                    return (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-emerald-500 transition-all duration-100"
                        style={{ height: `${scaledHeight}px` }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Box */}
            <div className="group flex items-center gap-2 rounded-2xl border border-gray-200 bg-transparent px-4 py-3 shadow-inner transition-all focus-within:ring-2 focus-within:ring-green-500/30 dark:border-gray-700">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isVoiceActive ? 'Habla por el micrófono o escribe aquí...' : 'Escribe tu consulta...'}
                className="flex-1 border-none bg-transparent text-sm placeholder-gray-400 outline-none focus:outline-none focus:ring-0 dark:text-gray-100"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="shrink-0 rounded-full bg-green-500 p-1.5 text-white shadow-sm transition-all hover:bg-green-600 active:scale-95 disabled:bg-gray-300"
              >
                <Send className="ml-0.5 h-4 w-4" />
              </button>
            </div>

            {/* Subtle Voice Mode Toggle & Auto-Pause indicator */}
            <div className="mt-2.5 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVoiceMode}
                  className={cn(
                    'group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50',
                    isVoiceActive ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  aria-pressed={isVoiceActive}
                  title={isVoiceActive ? 'Desactivar Modo Voz de Tenshi' : 'Activar Modo Voz de Tenshi (Habla con Tenshi en vivo)'}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                      isVoiceActive ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
                <div className="flex items-center gap-1.5 text-[11px] font-medium select-none">
                  <Mic className={cn('h-3.5 w-3.5 transition-colors', isVoiceActive ? 'text-emerald-500 animate-pulse' : 'text-gray-400')} />
                  <span className={cn('transition-colors', isVoiceActive ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400')}>
                    {isVoiceActive ? 'Modo Voz Activo' : 'Modo Voz'}
                  </span>
                </div>
              </div>

              {/* Botón para volver a Modo Jarvis desde el footer de chat */}
              <button
                type="button"
                onClick={() => setViewMode('jarvis')}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 transition-colors"
                title="Regresar al avatar interactivo"
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Modo Jarvis</span>
              </button>

              {/* Inactivity countdown indicator: auto-pausa a 1 minuto */}
              {isVoiceActive ? (
                isWaitingConsultation || isChatSubmitting ? (
                  <div
                    className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 animate-pulse"
                    title="Tenshi está esperando la respuesta del especialista para continuar la conversación hablada"
                  >
                    <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Esperando al especialista...</span>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium"
                    title="Se desactiva automáticamente tras 1 minuto sin usar"
                  >
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Auto-pausa: {Math.max(0, 60 - inactivitySeconds)}s</span>
                  </div>
                )
              ) : (
                <span className="text-[10px] font-medium tracking-tight text-gray-400">
                  Tenshi por WAPPY IA
                </span>
              )}
            </div>
          </div>
        </div>
        )
      )}

      {!isOpen && (
        <button
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleButtonClick}
          className="animate-bounce-short relative flex h-14 w-14 cursor-grab items-center justify-center overflow-hidden rounded-full border-2 border-white bg-emerald-600 p-1 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-emerald-500 hover:shadow-2xl active:cursor-grabbing"
        >
          {/* Ripple effect */}
          <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20"></span>
          <img
            src="/assets/tenshi.png"
            alt="Tenshi"
            className="h-full w-full rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/assets/logo.svg';
            }}
          />
        </button>
      )}
    </div>
  );
}
