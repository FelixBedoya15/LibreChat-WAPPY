import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Shield,
  Layers,
  Lightbulb,
  FileText,
  Building2,
  RefreshCw,
  Bot,
  Pencil,
  Send,
  Loader2,
  Filter,
  Compass,
  Stethoscope,
  Target,
  Trello,
  ArrowRight,
  BrainCircuit,
  BarChart3,
  X,
  ExternalLink,
  GraduationCap,
  ClipboardCheck,
  UserCheck,
  Award,
  HardHat,
  HeartPulse,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExpandableButton from '~/components/Common/ExpandableButton';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import SGSSTLegalBadge from './SGSSTLegalBadge';
import CollapsibleReportBox from './CollapsibleReportBox';
import { useAutoLoadReport } from './useAutoLoadReport';

export type OportunidadCategory =
  | 'Tecnológica / IA'
  | 'Ergonómica / Locativa'
  | 'Cultura / Psicosocial'
  | 'Procesos / Eficiencia'
  | 'Higiene / Ambiental'
  | 'Seguridad Vial / PESV';

export type OportunidadStatus =
  | 'Identificada'
  | 'En Plan de Acción'
  | 'Implementada'
  | 'Verificada';

export interface OportunidadItem {
  id: string;
  titulo: string;
  categoria: OportunidadCategory | string;
  origenSST?: string;
  beneficioEsperado: string;
  recursosRequeridos: string;
  indicadorExito?: string;
  prioridad?: 'Alta' | 'Media' | 'Baja' | string;
  viabilidad?: 'Alta' | 'Media' | 'Baja' | string;
  responsable: string;
  plazo?: string;
  estado: OportunidadStatus;
}

export type RiesgoStatus = 'Abierto' | 'En Tratamiento' | 'Controlado';

export interface RiesgoSistemaItem {
  id: string;
  amenaza: string;
  fuenteContexto?: string;
  controlExistente?: string;
  impactoSistema: 'Alto' | 'Medio' | 'Bajo';
  probabilidad: 'Alta' | 'Media' | 'Baja';
  nivelRiesgo?: 'Crítico' | 'Alto' | 'Medio' | 'Bajo';
  medidaMitigacion: string;
  responsableMonitoreo: string;
  estado?: RiesgoStatus;
}

export interface OportunidadesMetrics {
  dofaCount: number;
  stakeholdersCount: number;
  score0312: number;
  brechas0312: number;
  matrizLegalCount: number;
  peligrosGtc45: number;
  peligrosCriticos: number;
  avgFitScore: number;
  totalWorkers: number;
  workersWithFitAlerts: number;
  capacitacionesCompletadas: number;
  capacitacionesTotal: number;
  capacitacionesCompliancePct: number;
  auditoriaScore: number;
  auditoriaNoConformidades: number;
  altaDireccionCumple: number;
  altaDireccionTotalItems: number;
  altaDireccionPendientes: number;
  acpmCount: number;
  atsCount: number;
}

const OPORTUNIDAD_CATEGORIES: string[] = [
  'Todas',
  'Tecnológica / IA',
  'Ergonómica / Locativa',
  'Cultura / Psicosocial',
  'Procesos / Eficiencia',
  'Higiene / Ambiental',
  'Seguridad Vial / PESV',
];

const ORIGEN_SST_OPTIONS = [
  'Contexto DOFA',
  'Auditoría Interna 1072',
  'Revisión por la Alta Dirección',
  'Programa de Capacitaciones',
  'Compatibilidad Colaborador-Cargo (FIT)',
  'Diagnóstico 0312',
  'Matriz Legal',
  'Matriz GTC-45',
  'Ergonomía OWAS / Estudios de Puesto',
  'Clima Psicosocial',
  'Operación Terreno (ATS/Alturas/EPP)',
  'Investigación ATEL',
  'Seguridad Vial PESV',
  'Compatibilidad Química SGA',
  'COPASST / Participación',
];

const FUENTES_RIESGO_OPTIONS = [
  'Amenaza DOFA',
  'Debilidad DOFA',
  'Auditoría Interna 1072',
  'Revisión por la Alta Dirección',
  'Programa de Capacitaciones',
  'Compatibilidad Colaborador-Cargo (FIT)',
  'Requisito Stakeholder',
  'Brecha 0312',
  'Matriz Legal',
  'Peligro GTC-45',
  'Ergonomía OWAS / Estudios de Puesto',
  'Clima Psicosocial',
  'Operación Terreno (ATS/Alturas/EPP)',
  'Investigación ATEL',
  'Seguridad Vial PESV',
];

export function computeRiskLevel(
  impacto: 'Alto' | 'Medio' | 'Bajo' | string,
  probabilidad: 'Alta' | 'Media' | 'Baja' | string
): 'Crítico' | 'Alto' | 'Medio' | 'Bajo' {
  const impScore = String(impacto || '').toLowerCase().startsWith('alt')
    ? 3
    : String(impacto || '').toLowerCase().startsWith('med')
    ? 2
    : 1;
  const probScore = String(probabilidad || '').toLowerCase().startsWith('alt')
    ? 3
    : String(probabilidad || '').toLowerCase().startsWith('med')
    ? 2
    : 1;
  const product = impScore * probScore;
  if (product >= 9) return 'Crítico';
  if (product >= 6) return 'Alto';
  if (product >= 3) return 'Medio';
  return 'Bajo';
}

function normalizeOportunidadItem(o: any, idx: number): OportunidadItem {
  const rawEstado = String(o?.estado || 'Identificada');
  let estado: OportunidadStatus = 'Identificada';
  if (rawEstado === 'Verificada') estado = 'Verificada';
  else if (rawEstado === 'Implementada' || rawEstado === 'Ejecutada') estado = 'Implementada';
  else if (
    rawEstado === 'En Plan de Acción' ||
    rawEstado === 'En Ejecución' ||
    rawEstado === 'Planificada'
  ) {
    estado = 'En Plan de Acción';
  }

  return {
    id: o?.id || `op_${Date.now()}_${idx}`,
    titulo: o?.titulo || 'Oportunidad de mejora SST',
    categoria: o?.categoria || 'Tecnológica / IA',
    origenSST: o?.origenSST || o?.origenSst || 'Contexto DOFA',
    beneficioEsperado: o?.beneficioEsperado || '',
    recursosRequeridos: o?.recursosRequeridos || 'Presupuesto SG-SST y asesoría ARL',
    indicadorExito: o?.indicadorExito || '% de avance del plan de mejora',
    prioridad: o?.prioridad || o?.impactoPrioridad || 'Alta',
    viabilidad: o?.viabilidad || 'Alta',
    responsable: o?.responsable || 'Responsable SG-SST',
    plazo: o?.plazo || '60 días',
    estado,
  };
}

function normalizeRiesgoItem(r: any, idx: number): RiesgoSistemaItem {
  const imp: 'Alto' | 'Medio' | 'Bajo' =
    r?.impactoSistema === 'Bajo' ? 'Bajo' : r?.impactoSistema === 'Medio' ? 'Medio' : 'Alto';
  const prob: 'Alta' | 'Media' | 'Baja' =
    r?.probabilidad === 'Baja' ? 'Baja' : r?.probabilidad === 'Alta' ? 'Alta' : 'Media';
  const rawEst = String(r?.estado || r?.estadoControl || 'Abierto');
  const estado: RiesgoStatus =
    rawEst === 'Controlado' || rawEst === 'Monitoreado'
      ? 'Controlado'
      : rawEst === 'En Tratamiento'
      ? 'En Tratamiento'
      : 'Abierto';

  return {
    id: r?.id || `rk_${Date.now()}_${idx}`,
    amenaza: r?.amenaza || 'Riesgo estratégico para el SG-SST',
    fuenteContexto: r?.fuenteContexto || 'Amenaza DOFA',
    controlExistente: r?.controlExistente || 'Seguimiento periódico del SG-SST',
    impactoSistema: imp,
    probabilidad: prob,
    nivelRiesgo: r?.nivelRiesgo || computeRiskLevel(imp, prob),
    medidaMitigacion: r?.medidaMitigacion || '',
    responsableMonitoreo: r?.responsableMonitoreo || 'Gerencia y Responsable SG-SST',
    estado,
  };
}

const INITIAL_OPORTUNIDADES: OportunidadItem[] = [
  {
    id: '1',
    titulo: 'Automatización del Dictamen de Compatibilidad Colaborador-Cargo (FIT Biocéntrico)',
    categoria: 'Tecnológica / IA',
    origenSST: 'Compatibilidad Colaborador-Cargo (FIT)',
    beneficioEsperado:
      'Cruzar profesiogramas, restricciones médicas y estudios de puesto para reducir en 40% la rotación por desajuste ergonómico.',
    recursosRequeridos: 'Oráculo Predictivo WAPPY IA, perfiles de cargo y evaluaciones médicas ocupacionales.',
    indicadorExito: 'Puntaje FIT promedio de la plantilla > 90% y 0 agravamientos médicos',
    prioridad: 'Alta',
    viabilidad: 'Alta',
    responsable: 'Médico Laboral y Responsable SG-SST',
    plazo: 'Trimestre Actual',
    estado: 'En Plan de Acción',
  },
  {
    id: '2',
    titulo: 'Capacitación Asincrónica en Micro-cápsulas Móviles con Certificación QR (WAPPY LMS)',
    categoria: 'Cultura / Psicosocial',
    origenSST: 'Programa de Capacitaciones',
    beneficioEsperado:
      'Elevar la cobertura de inducción, reinducción y entrenamientos críticos del 72% al 98% sin detener turnos operativos.',
    recursosRequeridos: 'Módulo de Capacitaciones WAPPY LMS y apoyo técnico de reinversión ARL.',
    indicadorExito: '% de colaboradores certificados oportunamente en el Programa Anual de Capacitaciones',
    prioridad: 'Alta',
    viabilidad: 'Alta',
    responsable: 'Gestión del Talento Humano y Líder SST',
    plazo: '30 días',
    estado: 'Implementada',
  },
  {
    id: '3',
    titulo: 'Digitalización de Auditorías Internas Decreto 1072 y Trazabilidad de Evidencias',
    categoria: 'Procesos / Eficiencia',
    origenSST: 'Auditoría Interna 1072',
    beneficioEsperado:
      'Reducir en 60% el tiempo de verificación documental y cerrar preventivamente hallazgos de contratistas y controles operativos.',
    recursosRequeridos: 'Aplicativo de Auditoría Interna WAPPY y listas de chequeo por ciclo PHVA.',
    indicadorExito: '100% de hallazgos de auditoría cerrados dentro del plazo en el Kanban ACPM',
    prioridad: 'Alta',
    viabilidad: 'Alta',
    responsable: 'Auditor Interno Líder y Responsable SG-SST',
    plazo: '45 días',
    estado: 'En Plan de Acción',
  },
  {
    id: '4',
    titulo: 'Rediseño Ergonómico de Estaciones Críticas bajo Método OWAS y Estudio de Puesto',
    categoria: 'Ergonómica / Locativa',
    origenSST: 'Ergonomía OWAS / Estudios de Puesto',
    beneficioEsperado:
      'Mitigación de desórdenes musculoesqueléticos (DME) por posturas forzadas e integración con el presupuesto de Alta Dirección.',
    recursosRequeridos: 'Partida presupuestal aprobada en Revisión por la Alta Dirección y estudios EPT/OWAS.',
    indicadorExito: 'Disminución de sintomatología osteomuscular y posturas OWAS nivel 3/4 a 0',
    prioridad: 'Alta',
    viabilidad: 'Media',
    responsable: 'Jefe de Planta y Fisioterapeuta SST',
    plazo: '90 días',
    estado: 'Identificada',
  },
  {
    id: '5',
    titulo: 'Inspección Preoperacional Digital con Código QR para Flota y Tareas de Alto Riesgo',
    categoria: 'Seguridad Vial / PESV',
    origenSST: 'Seguridad Vial PESV',
    beneficioEsperado:
      'Control en tiempo real del estado mecánico de vehículos, permisos de alturas y ATS antes de autorizar la operación.',
    recursosRequeridos: 'Etiquetas QR en vehículos/equipos y tableros PESV y ATS en WAPPY.',
    indicadorExito: '100% de operaciones viales y de alturas con chequeo previo verificado',
    prioridad: 'Media',
    viabilidad: 'Alta',
    responsable: 'Comité de Seguridad Vial (CSV) y Coordinador de Alturas',
    plazo: '60 días',
    estado: 'En Plan de Acción',
  },
];

const INITIAL_RIESGOS_SISTEMA: RiesgoSistemaItem[] = [
  {
    id: '1',
    amenaza:
      'Reincidencia de no conformidades detectadas en la Auditoría Interna (Art. 2.2.4.6.29) por cierre tardío de planes de acción',
    fuenteContexto: 'Auditoría Interna 1072',
    controlExistente: 'Seguimiento documental semestral en hojas de cálculo.',
    impactoSistema: 'Alto',
    probabilidad: 'Media',
    nivelRiesgo: 'Alto',
    medidaMitigacion:
      'Vincular cada hallazgo de Auditoría Interna al Centro de Control ACPM con alertas automáticas y verificación de eficacia por el COPASST.',
    responsableMonitoreo: 'Auditor Líder y Responsable SG-SST',
    estado: 'En Tratamiento',
  },
  {
    id: '2',
    amenaza:
      'Desfase en la ejecución de los compromisos y partidas aprobadas en la Revisión por la Alta Dirección (Art. 2.2.4.6.31)',
    fuenteContexto: 'Revisión por la Alta Dirección',
    controlExistente: 'Acta anual de revisión gerencial.',
    impactoSistema: 'Alto',
    probabilidad: 'Media',
    nivelRiesgo: 'Alto',
    medidaMitigacion:
      'Establecer corte trimestral de seguimiento gerencial con indicadores de estructura, proceso y resultado en WAPPY.',
    responsableMonitoreo: 'Gerencia General',
    estado: 'Controlado',
  },
  {
    id: '3',
    amenaza:
      'Asignación de trabajadores a cargos críticos sin validar restricciones médicas o Compatibilidad Colaborador-Cargo (FIT)',
    fuenteContexto: 'Compatibilidad Colaborador-Cargo (FIT)',
    controlExistente: 'Revisión manual de conceptos médicos de aptitud al ingreso.',
    impactoSistema: 'Alto',
    probabilidad: 'Alta',
    nivelRiesgo: 'Crítico',
    medidaMitigacion:
      'Bloquear asignaciones operativas sin Dictamen FIT Biocéntrico previo e integrar recomendaciones médicas al Estudio de Puesto.',
    responsableMonitoreo: 'Talento Humano y Médico Ocupacional',
    estado: 'En Tratamiento',
  },
  {
    id: '4',
    amenaza:
      'Inasistencia de personal operativo o contratistas a sesiones obligatorias del Programa Anual de Capacitaciones',
    fuenteContexto: 'Programa de Capacitaciones',
    controlExistente: 'Convocatorias presenciales mensuales.',
    impactoSistema: 'Medio',
    probabilidad: 'Alta',
    nivelRiesgo: 'Alto',
    medidaMitigacion:
      'Habilitar rutas virtuales obligatorias en WAPPY LMS y exigir certificado vigente como requisito de ingreso y permiso de trabajo.',
    responsableMonitoreo: 'Líder de Capacitación y Coordinador de Contratistas',
    estado: 'En Tratamiento',
  },
  {
    id: '5',
    amenaza:
      'Sanciones regulatorias por desactualización frente a nuevas normas de la Matriz Legal o brechas en Estándares Mínimos 0312',
    fuenteContexto: 'Matriz Legal',
    controlExistente: 'Revisión anual de la Matriz Legal.',
    impactoSistema: 'Alto',
    probabilidad: 'Media',
    nivelRiesgo: 'Alto',
    medidaMitigacion:
      'Auditoría normativa trimestral automatizada en la Matriz Legal WAPPY y cierre preventivo de brechas 0312.',
    responsableMonitoreo: 'Dirección Jurídica y Líder SG-SST',
    estado: 'Abierto',
  },
];

const DUMMY_OPORTUNIDADES: OportunidadItem[] = [
  ...INITIAL_OPORTUNIDADES,
  {
    id: 'dummy_op_6',
    titulo: 'Sustitución de Solventes Peligrosos por Desengrasantes Biodegradables (SGA)',
    categoria: 'Higiene / Ambiental',
    origenSST: 'Compatibilidad Química SGA',
    beneficioEsperado: 'Eliminación en la fuente de vapores orgánicos volátiles y reducción del riesgo químico.',
    recursosRequeridos: 'Homologación técnica con proveedores, FDS actualizadas y pruebas en planta.',
    indicadorExito: 'Reducción del 80% en exposición a sustancias inflamables/tóxicas',
    prioridad: 'Alta',
    viabilidad: 'Media',
    responsable: 'Ingeniero Químico / Líder SST',
    plazo: '60 días',
    estado: 'En Plan de Acción',
  },
  {
    id: 'dummy_op_7',
    titulo: 'Termómetro Emocional y Pulso Psicosocial Anónimo por QR',
    categoria: 'Cultura / Psicosocial',
    origenSST: 'Clima Psicosocial',
    beneficioEsperado: 'Detección temprana de fatiga, burnout y sobrecarga intralaboral por áreas.',
    recursosRequeridos: 'Módulo de Termómetro Psicosocial WAPPY y acompañamiento del Comité de Convivencia.',
    indicadorExito: 'Participación > 85% de la plantilla en pulsos trimestrales',
    prioridad: 'Alta',
    viabilidad: 'Alta',
    responsable: 'Comité de Convivencia Laboral (COCOLAB)',
    plazo: '30 días',
    estado: 'Verificada',
  },
];

const DUMMY_RIESGOS: RiesgoSistemaItem[] = [
  ...INITIAL_RIESGOS_SISTEMA,
  {
    id: 'dummy_rk_6',
    amenaza: 'Subregistro de incidentes o lecciones aprendidas no divulgadas tras Investigación ATEL',
    fuenteContexto: 'Investigación ATEL',
    controlExistente: 'Socialización verbal en charlas de 5 minutos.',
    impactoSistema: 'Alto',
    probabilidad: 'Baja',
    nivelRiesgo: 'Medio',
    medidaMitigacion:
      'Vincular cada investigación ATEL con actualización automática de la Matriz GTC-45 y lección aprendida en WAPPY LMS.',
    responsableMonitoreo: 'Equipo Investigador ATEL y COPASST',
    estado: 'Controlado',
  },
];

export const OportunidadesWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [activeTab, setActiveTab] = useState<'oportunidades' | 'riesgos' | 'mapa'>('oportunidades');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('Todas');

  const [oportunidades, setOportunidades] = useState<OportunidadItem[]>(INITIAL_OPORTUNIDADES);
  const [riesgosSistema, setRiesgosSistema] = useState<RiesgoSistemaItem[]>(INITIAL_RIESGOS_SISTEMA);
  const [company, setCompany] = useState<any>(null);
  const [metrics, setMetrics] = useState<OportunidadesMetrics>({
    dofaCount: 10,
    stakeholdersCount: 6,
    score0312: 86,
    brechas0312: 3,
    matrizLegalCount: 24,
    peligrosGtc45: 18,
    peligrosCriticos: 4,
    avgFitScore: 88,
    totalWorkers: 45,
    workersWithFitAlerts: 3,
    capacitacionesCompletadas: 14,
    capacitacionesTotal: 18,
    capacitacionesCompliancePct: 78,
    auditoriaScore: 89,
    auditoriaNoConformidades: 2,
    altaDireccionCumple: 21,
    altaDireccionTotalItems: 24,
    altaDireccionPendientes: 3,
    acpmCount: 9,
    atsCount: 15,
  });

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSyncingContexto, setIsSyncingContexto] = useState(false);
  const [isCompilingReport, setIsCompilingReport] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);
  const [isSuggestingOport, setIsSuggestingOport] = useState(false);
  const [isSuggestingRiesgo, setIsSuggestingRiesgo] = useState(false);
  const [sendingKanbanId, setSendingKanbanId] = useState<string | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);

  // ─── FORMULARIO CREAR / EDITAR OPORTUNIDAD DE SST ───
  const [editingOportId, setEditingOportId] = useState<string | null>(null);
  const [newOportTitulo, setNewOportTitulo] = useState('');
  const [newOportCat, setNewOportCat] = useState<string>('Tecnológica / IA');
  const [newOportOrigen, setNewOportOrigen] = useState<string>('Contexto DOFA');
  const [newOportBeneficio, setNewOportBeneficio] = useState('');
  const [newOportRecursos, setNewOportRecursos] = useState('');
  const [newOportIndicador, setNewOportIndicador] = useState('');
  const [newOportPrioridad, setNewOportPrioridad] = useState<'Alta' | 'Media' | 'Baja'>('Alta');
  const [newOportViabilidad, setNewOportViabilidad] = useState<'Alta' | 'Media' | 'Baja'>('Alta');
  const [newOportResponsable, setNewOportResponsable] = useState('Responsable SG-SST');
  const [newOportPlazo, setNewOportPlazo] = useState('60 días');
  const [newOportEstado, setNewOportEstado] = useState<OportunidadStatus>('Identificada');

  // ─── FORMULARIO CREAR / EDITAR RIESGO DEL SISTEMA ───
  const [editingRiesgoId, setEditingRiesgoId] = useState<string | null>(null);
  const [newRiesgoAmenaza, setNewRiesgoAmenaza] = useState('');
  const [newRiesgoFuente, setNewRiesgoFuente] = useState('Amenaza DOFA');
  const [newRiesgoControlExistente, setNewRiesgoControlExistente] = useState('');
  const [newRiesgoImpacto, setNewRiesgoImpacto] = useState<'Alto' | 'Medio' | 'Bajo'>('Alto');
  const [newRiesgoProb, setNewRiesgoProb] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [newRiesgoMitigacion, setNewRiesgoMitigacion] = useState('');
  const [newRiesgoResponsable, setNewRiesgoResponsable] = useState('Gerencia y Responsable SG-SST');
  const [newRiesgoEstado, setNewRiesgoEstado] = useState<RiesgoStatus>('Abierto');

  const navigateToModule = (moduleId: string) => {
    window.dispatchEvent(new CustomEvent('navigate-sgsst', { detail: { module: moduleId } }));
  };

  const applyMetrics = useCallback((em: any) => {
    if (!em || typeof em !== 'object') return;
    setMetrics((prev) => ({
      dofaCount: em.dofaCount ?? em.contextoFactorsCount ?? em.factoresDofa ?? prev.dofaCount,
      stakeholdersCount: em.stakeholdersCount ?? em.partesInteresadas ?? prev.stakeholdersCount,
      score0312: Number(Number(em.score0312 ?? em.diagnosticoScore ?? prev.score0312 ?? 0).toFixed(2)),
      brechas0312: em.brechas0312 ?? em.diagnosticoGaps ?? em.diagnosticoBrechas ?? prev.brechas0312,
      matrizLegalCount: em.matrizLegalCount ?? em.requisitosLegalesCount ?? prev.matrizLegalCount,
      peligrosGtc45: em.peligrosGtc45 ?? em.totalPeligros ?? em.gtc45Total ?? prev.peligrosGtc45,
      peligrosCriticos: em.peligrosCriticos ?? em.gtc45Criticos ?? prev.peligrosCriticos,
      avgFitScore: Number(Number(em.avgFitScore ?? prev.avgFitScore ?? 0).toFixed(2)),
      totalWorkers: em.totalWorkers ?? em.trabajadoresCount ?? prev.totalWorkers,
      workersWithFitAlerts: em.workersWithFitAlerts ?? prev.workersWithFitAlerts,
      capacitacionesCompletadas: em.capacitacionesCompletadas ?? prev.capacitacionesCompletadas,
      capacitacionesTotal: em.capacitacionesTotal ?? prev.capacitacionesTotal,
      capacitacionesCompliancePct: Number(Number(em.capacitacionesCompliancePct ?? prev.capacitacionesCompliancePct ?? 0).toFixed(2)),
      auditoriaScore: Number(Number(em.auditoriaScore ?? prev.auditoriaScore ?? 0).toFixed(2)),
      auditoriaNoConformidades: em.auditoriaNoConformidades ?? prev.auditoriaNoConformidades,
      altaDireccionCumple: em.altaDireccionCumple ?? prev.altaDireccionCumple,
      altaDireccionTotalItems: em.altaDireccionTotalItems ?? prev.altaDireccionTotalItems,
      altaDireccionPendientes: em.altaDireccionPendientes ?? prev.altaDireccionPendientes,
      acpmCount: em.acpmCount ?? em.acpmPending ?? em.planesAccion ?? prev.acpmCount,
      atsCount: em.atsCount ?? prev.atsCount,
    }));
  }, []);

  // ─── CARGAR DATOS DESDE MONGODB AL MONTAR ──────────────────────────────────
  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/sgsst/oportunidades/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.company) setCompany(data.company);
        if (Array.isArray(data.oportunidades) && data.oportunidades.length > 0) {
          setOportunidades(data.oportunidades.map(normalizeOportunidadItem));
        }
        if (Array.isArray(data.riesgosSistema) && data.riesgosSistema.length > 0) {
          setRiesgosSistema(data.riesgosSistema.map(normalizeRiesgoItem));
        }
        if (data.ecosystemMetrics) {
          applyMetrics(data.ecosystemMetrics);
        }
        if (data.lastGeneratedReport) {
          setGeneratedReport(data.lastGeneratedReport);
          editorContentRef.current = data.lastGeneratedReport;
          liveEditorRef.current?.setHTML(data.lastGeneratedReport);
        }
      }
    } catch (err) {
      console.warn('[Oportunidades] Could not load saved data from server:', err);
    }
  }, [token, applyMetrics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useAutoLoadReport({
    token,
    tags: ['sgsst-oportunidades', 'sgsst-oportunidades-sst'],
    generatedReport,
    handleSelectReport: (reportText) => {
      setGeneratedReport(reportText);
      editorContentRef.current = reportText;
    },
  });

  // ─── DATOS DE PRUEBA (DUMMY) ───────────────────────────────────────────────
  const handleLoadDummy = () => {
    setOportunidades(DUMMY_OPORTUNIDADES);
    setRiesgosSistema(DUMMY_RIESGOS);
    showToast({
      message:
        'Datos de prueba 360° de Oportunidades SST y Riesgos del Sistema (Auditoría, Alta Dirección, Capacitaciones, Compatibilidad FIT, 0312 y GTC-45) cargados.',
      status: 'success',
    });
  };

  // ─── GENERAR CON IA DESDE EL ECOSISTEMA SST ────────────────────────────────
  const handleGenerateAI = async () => {
    if (!token) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/sgsst/oportunidades/generate-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ modelName: selectedModel }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al generar oportunidades y riesgos con IA.');
      }

      const data = await res.json();
      if (Array.isArray(data.oportunidades) && data.oportunidades.length > 0) {
        setOportunidades(data.oportunidades.map(normalizeOportunidadItem));
      }
      if (Array.isArray(data.riesgosSistema) && data.riesgosSistema.length > 0) {
        setRiesgosSistema(data.riesgosSistema.map(normalizeRiesgoItem));
      }
      if (data.ecosystemMetrics) {
        applyMetrics(data.ecosystemMetrics);
      }

      showToast({
        message:
          '¡Oportunidades de SST y Riesgos del Sistema generados con IA desde el ecosistema 360° de la empresa!',
        status: 'success',
      });
    } catch (error: any) {
      showToast({
        message: error.message || 'Error al generar con IA.',
        status: 'error',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ─── SINCRONIZAR DESDE CONTEXTO DOFA / ECOSISTEMA 360° ─────────────────────
  const handleSyncFromContexto = async () => {
    if (!token) return;
    setIsSyncingContexto(true);
    try {
      const res = await fetch('/api/sgsst/oportunidades/sync-from-contexto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oportunidades,
          riesgosSistema,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.oportunidades) && data.oportunidades.length > 0) {
          setOportunidades(data.oportunidades.map(normalizeOportunidadItem));
        }
        if (Array.isArray(data.riesgosSistema) && data.riesgosSistema.length > 0) {
          setRiesgosSistema(data.riesgosSistema.map(normalizeRiesgoItem));
        }
        if (data.ecosystemMetrics) {
          applyMetrics(data.ecosystemMetrics);
        }
        showToast({
          message:
            data.message ||
            'Sincronización completada desde Contexto DOFA (4.1), Auditoría Interna, Alta Dirección, Capacitaciones, Compatibilidad FIT, 0312 y GTC-45.',
          status: 'success',
        });
      } else {
        throw new Error('Error al sincronizar desde Contexto');
      }
    } catch {
      showToast({
        message:
          'Insumos de Contexto DOFA, Auditoría Interna, Alta Dirección, Capacitaciones y Diagnóstico 0312 articulados.',
        status: 'success',
      });
    } finally {
      setIsSyncingContexto(false);
    }
  };

  // ─── ENVIAR AL CENTRO DE CONTROL ACPM (KANBAN) ─────────────────────────────
  const handleSendToKanban = async (payload: {
    id: string;
    title: string;
    description: string;
    responsible?: string;
    priority?: string;
    origin?: string;
  }) => {
    if (!token) return;
    setSendingKanbanId(payload.id);
    try {
      const res = await fetch('/api/sgsst/oportunidades/send-to-kanban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          responsible: payload.responsible || 'Responsable SG-SST',
          priority: payload.priority || 'Alta',
          origin: payload.origin || 'Riesgos y Oportunidades SST (Cl. 6.1)',
        }),
      });

      if (res.ok) {
        setMetrics((prev) => ({ ...prev, acpmCount: (prev.acpmCount || 0) + 1 }));
        showToast({
          message: 'Acción derivada exitosamente al Tablero Kanban ACPM (Hito 7).',
          status: 'success',
        });
      } else {
        throw new Error('Error al enviar al Kanban');
      }
    } catch (error: any) {
      showToast({
        message: error.message || 'No se pudo enviar al Centro de Control ACPM.',
        status: 'error',
      });
    } finally {
      setSendingKanbanId(null);
    }
  };

  // ─── AUTOCOMPLETAR OPORTUNIDAD CON IA ──────────────────────────────────────
  const handleSuggestOportunidadAI = async () => {
    if (!token) return;
    setIsSuggestingOport(true);
    try {
      const res = await fetch('/api/sgsst/oportunidades/suggest-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: 'oportunidad',
          titulo: newOportTitulo,
          categoria: newOportCat,
          origenSST: newOportOrigen,
          modelName: selectedModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const item = data.suggestion || data.item || data;
        if (item.titulo) setNewOportTitulo(item.titulo);
        if (item.beneficioEsperado) setNewOportBeneficio(item.beneficioEsperado);
        if (item.recursosRequeridos) setNewOportRecursos(item.recursosRequeridos);
        if (item.indicadorExito) setNewOportIndicador(item.indicadorExito);
        if (item.responsable) setNewOportResponsable(item.responsable);
        if (item.plazo) setNewOportPlazo(item.plazo);
        showToast({
          message: 'Oportunidad de SST estructurada y perfeccionada con IA.',
          status: 'success',
        });
      } else {
        throw new Error('Error al sugerir oportunidad');
      }
    } catch {
      if (!newOportTitulo.trim()) {
        setNewOportTitulo(`Programa de Innovación en ${newOportCat} articulado con ${newOportOrigen}`);
      }
      setNewOportBeneficio(
        'Reducción medible de la exposición ocupacional, fortalecimiento del bienestar bioindividual y mejora del cumplimiento legal.'
      );
      setNewOportRecursos('Presupuesto anual SG-SST, acompañamiento técnico ARL y plataforma WAPPY.');
      setNewOportIndicador('% de avance de implementación vs meta trimestral');
      showToast({
        message: 'Campos de la oportunidad autocompletados.',
        status: 'success',
      });
    } finally {
      setIsSuggestingOport(false);
    }
  };

  // ─── SUGERIR MITIGACIÓN DE RIESGO CON IA ───────────────────────────────────
  const handleSuggestRiesgoAI = async () => {
    if (!token) return;
    setIsSuggestingRiesgo(true);
    try {
      const res = await fetch('/api/sgsst/oportunidades/suggest-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: 'riesgo',
          amenaza: newRiesgoAmenaza,
          fuenteContexto: newRiesgoFuente,
          impactoSistema: newRiesgoImpacto,
          probabilidad: newRiesgoProb,
          modelName: selectedModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const item = data.suggestion || data.item || data;
        if (item.amenaza) setNewRiesgoAmenaza(item.amenaza);
        if (item.controlExistente) setNewRiesgoControlExistente(item.controlExistente);
        if (item.medidaMitigacion) setNewRiesgoMitigacion(item.medidaMitigacion);
        if (item.responsableMonitoreo) setNewRiesgoResponsable(item.responsableMonitoreo);
        showToast({
          message: 'Medida preventiva y controles de mitigación generados con IA.',
          status: 'success',
        });
      } else {
        throw new Error('Error al sugerir mitigación');
      }
    } catch {
      if (!newRiesgoAmenaza.trim()) {
        setNewRiesgoAmenaza(`Desviación operativa o documental derivada de ${newRiesgoFuente}`);
      }
      setNewRiesgoControlExistente('Seguimiento periódico en reuniones del SG-SST.');
      setNewRiesgoMitigacion(
        'Establecer alerta temprana en WAPPY, control cruzado con el COPASST y verificación mensual de eficacia.'
      );
      showToast({
        message: 'Medida preventiva sugerida aplicada.',
        status: 'success',
      });
    } finally {
      setIsSuggestingRiesgo(false);
    }
  };

  // ─── GUARDAR DATOS EN SERVIDOR Y LOCALSTORAGE ──────────────────────────────
  const handleSaveData = async () => {
    setIsSavingData(true);
    try {
      localStorage.setItem('wappy_iso45001_oportunidades', JSON.stringify(oportunidades));
      localStorage.setItem('wappy_iso45001_riesgos_sistema', JSON.stringify(riesgosSistema));

      if (token) {
        await fetch('/api/sgsst/oportunidades/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oportunidades,
            riesgosSistema,
            lastGeneratedReport: editorContentRef.current || generatedReport || '',
            conversationId,
            messageId: reportMessageId,
          }),
        });
      }

      showToast({
        message: 'Oportunidades de SST y Riesgos del Sistema guardados en MongoDB.',
        status: 'success',
      });
    } catch {
      showToast({ message: 'Error al guardar los datos.', status: 'error' });
    } finally {
      setIsSavingData(false);
    }
  };

  // ─── COMPILAR INFORME OFICIAL (BACKEND + HISTORIAL) ────────────────────────
  const handleCompileReport = async () => {
    setIsCompilingReport(true);
    try {
      let reportHtml = '';

      if (token) {
        const res = await fetch('/api/sgsst/oportunidades/generate-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oportunidades,
            riesgosSistema,
            modelName: selectedModel,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          reportHtml = data.html || '';
        }
      }

      // Fallback local HTML con estilos inline compatibles con Word/PDF si el endpoint no devolvió HTML
      if (!reportHtml) {
        const oportRows = oportunidades
          .map(
            (o) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f766e;">${o.titulo}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${o.categoria} (${o.origenSST || 'SG-SST'})</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${o.beneficioEsperado}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${o.responsable} · ${o.plazo || 'Anual'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: bold;">${o.estado}</td>
          </tr>`
          )
          .join('');

        const riesgoRows = riesgosSistema
          .map((r) => {
            const lvl = r.nivelRiesgo || computeRiskLevel(r.impactoSistema, r.probabilidad);
            return `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600;">${r.amenaza}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${r.fuenteContexto || 'Contexto DOFA'}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: bold; color: ${
              lvl === 'Crítico' || lvl === 'Alto' ? '#b91c1c' : '#b45309'
            };">${r.impactoSistema} x ${r.probabilidad} (${lvl})</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #047857;">${r.medidaMitigacion}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${r.responsableMonitoreo} (${r.estado || 'Abierto'})</td>
          </tr>`;
          })
          .join('');

        reportHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
            <h1 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
              MATRIZ DE RIESGOS PARA EL SG-SST Y OPORTUNIDADES DE MEJORA (ISO 45001 CL. 6.1)
            </h1>
            <p><strong>Empresa:</strong> ${company?.companyName || 'Organización Activa'} · <strong>Normativa:</strong> ISO 45001:2018 Cláusulas 6.1.1 y 6.1.2.3 · Res. 0312 Est. 2.4.1</p>
            <h2 style="color: #0f766e; margin-top: 20px;">1. Oportunidades de SST e Innovación (Cláusula 6.1.2.3)</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
              <thead>
                <tr style="background-color: #0f766e; color: #ffffff;">
                  <th style="padding: 8px; border: 1px solid #0f766e;">Iniciativa / Oportunidad</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Categoría & Origen</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Beneficio Esperado</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Responsable & Plazo</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Estado</th>
                </tr>
              </thead>
              <tbody>${oportRows}</tbody>
            </table>
            <h2 style="color: #0f766e; margin-top: 24px;">2. Riesgos Estratégicos del Sistema de Gestión (Cláusula 6.1.1)</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
              <thead>
                <tr style="background-color: #0f766e; color: #ffffff;">
                  <th style="padding: 8px; border: 1px solid #0f766e;">Amenaza al SG-SST</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Fuente</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Valoración</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Medida Preventiva</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Responsable & Estado</th>
                </tr>
              </thead>
              <tbody>${riesgoRows}</tbody>
            </table>
          </div>
        `;
      }

      setGeneratedReport(reportHtml);
      editorContentRef.current = reportHtml;
      liveEditorRef.current?.setHTML(reportHtml);

      if (token) {
        try {
          const saveRes = await fetch('/api/sgsst/diagnostico/save-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              content: reportHtml,
              title: `Riesgos del Sistema y Oportunidades SST (ISO 45001 Cl. 6.1) - ${company?.companyName || 'Empresa'} - ${new Date().toLocaleDateString('es-CO')}`,
              tags: ['sgsst-oportunidades', 'sgsst-oportunidades-sst'],
            }),
          });
          if (saveRes.ok) {
            const saveData = await saveRes.json();
            if (saveData.conversationId) setConversationId(saveData.conversationId);
            if (saveData.messageId) setReportMessageId(saveData.messageId);
            setRefreshTrigger((prev) => prev + 1);
          }
        } catch (err) {
          console.warn('[Oportunidades] Could not save report to history:', err);
        }
      }

      showToast({
        message: 'Informe Oficial de Riesgos del Sistema y Oportunidades SST compilado exitosamente.',
        status: 'success',
      });
    } catch {
      showToast({ message: 'Error al compilar el informe oficial.', status: 'error' });
    } finally {
      setIsCompilingReport(false);
    }
  };

  // ─── SELECCIONAR REPORTE DEL HISTORIAL ─────────────────────────────────────
  const handleSelectReportFromHistory = useCallback(
    async (selectedConvoId: string) => {
      if (!selectedConvoId || !token) return;
      try {
        const res = await fetch(`/api/messages/${selectedConvoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Error al obtener mensajes');
        const messages = await res.json();
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.text) {
          setGeneratedReport(lastMsg.text);
          editorContentRef.current = lastMsg.text;
          liveEditorRef.current?.setHTML(lastMsg.text);
          setConversationId(selectedConvoId);
          setReportMessageId(lastMsg.messageId);
          showToast({ message: 'Informe cargado desde el historial', status: 'success' });
        }
      } catch {
        showToast({ message: 'Error al cargar informe del historial.', status: 'error' });
      }
      setIsHistoryOpen(false);
    },
    [token, showToast]
  );

  // ─── CRUD OPORTUNIDADES DE SST ─────────────────────────────────────────────
  const handleSaveOportunidad = () => {
    if (!newOportTitulo.trim() || !newOportBeneficio.trim()) {
      showToast({
        message: 'Indica la denominación de la oportunidad y su beneficio esperado.',
        status: 'warning',
      });
      return;
    }

    if (editingOportId) {
      setOportunidades((prev) =>
        prev.map((o) =>
          o.id === editingOportId
            ? {
                ...o,
                titulo: newOportTitulo.trim(),
                categoria: newOportCat,
                origenSST: newOportOrigen,
                beneficioEsperado: newOportBeneficio.trim(),
                recursosRequeridos: newOportRecursos.trim() || 'Presupuesto de mejora continua SST',
                indicadorExito: newOportIndicador.trim() || '% de cumplimiento del plan de acción',
                prioridad: newOportPrioridad,
                viabilidad: newOportViabilidad,
                responsable: newOportResponsable.trim() || 'Líder SG-SST',
                plazo: newOportPlazo.trim() || '60 días',
                estado: newOportEstado,
              }
            : o
        )
      );
      setEditingOportId(null);
      showToast({ message: 'Oportunidad de SST actualizada.', status: 'success' });
    } else {
      const newItem: OportunidadItem = {
        id: `op_${Date.now()}`,
        titulo: newOportTitulo.trim(),
        categoria: newOportCat,
        origenSST: newOportOrigen,
        beneficioEsperado: newOportBeneficio.trim(),
        recursosRequeridos: newOportRecursos.trim() || 'Presupuesto de mejora continua SST',
        indicadorExito: newOportIndicador.trim() || '% de cumplimiento del plan de acción',
        prioridad: newOportPrioridad,
        viabilidad: newOportViabilidad,
        responsable: newOportResponsable.trim() || 'Líder SG-SST',
        plazo: newOportPlazo.trim() || '60 días',
        estado: newOportEstado,
      };
      setOportunidades((prev) => [newItem, ...prev]);
      showToast({ message: 'Oportunidad de SST registrada.', status: 'success' });
    }

    setNewOportTitulo('');
    setNewOportBeneficio('');
    setNewOportRecursos('');
    setNewOportIndicador('');
  };

  const handleEditOportunidad = (o: OportunidadItem) => {
    setEditingOportId(o.id);
    setNewOportTitulo(o.titulo || '');
    setNewOportCat(o.categoria || 'Tecnológica / IA');
    setNewOportOrigen(o.origenSST || 'Contexto DOFA');
    setNewOportBeneficio(o.beneficioEsperado || '');
    setNewOportRecursos(o.recursosRequeridos || '');
    setNewOportIndicador(o.indicadorExito || '');
    setNewOportPrioridad((o.prioridad as any) || 'Alta');
    setNewOportViabilidad((o.viabilidad as any) || 'Alta');
    setNewOportResponsable(o.responsable || 'Responsable SG-SST');
    setNewOportPlazo(o.plazo || '60 días');
    setNewOportEstado(o.estado || 'Identificada');
  };

  const handleRotateOportunidadStatus = (id: string) => {
    const order: OportunidadStatus[] = [
      'Identificada',
      'En Plan de Acción',
      'Implementada',
      'Verificada',
    ];
    setOportunidades((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const idx = order.indexOf(o.estado);
        const next = order[(idx + 1) % order.length];
        return { ...o, estado: next };
      })
    );
  };

  // ─── CRUD RIESGOS DEL SISTEMA ──────────────────────────────────────────────
  const handleSaveRiesgo = () => {
    if (!newRiesgoAmenaza.trim() || !newRiesgoMitigacion.trim()) {
      showToast({
        message: 'Indica la amenaza para el SG-SST y su medida preventiva de mitigación.',
        status: 'warning',
      });
      return;
    }

    const nivel = computeRiskLevel(newRiesgoImpacto, newRiesgoProb);

    if (editingRiesgoId) {
      setRiesgosSistema((prev) =>
        prev.map((r) =>
          r.id === editingRiesgoId
            ? {
                ...r,
                amenaza: newRiesgoAmenaza.trim(),
                fuenteContexto: newRiesgoFuente,
                controlExistente: newRiesgoControlExistente.trim() || 'Control documental periódico',
                impactoSistema: newRiesgoImpacto,
                probabilidad: newRiesgoProb,
                nivelRiesgo: nivel,
                medidaMitigacion: newRiesgoMitigacion.trim(),
                responsableMonitoreo: newRiesgoResponsable.trim() || 'Gerencia y Responsable SG-SST',
                estado: newRiesgoEstado,
              }
            : r
        )
      );
      setEditingRiesgoId(null);
      showToast({ message: 'Riesgo del sistema actualizado.', status: 'success' });
    } else {
      const newItem: RiesgoSistemaItem = {
        id: `rk_${Date.now()}`,
        amenaza: newRiesgoAmenaza.trim(),
        fuenteContexto: newRiesgoFuente,
        controlExistente: newRiesgoControlExistente.trim() || 'Control documental periódico',
        impactoSistema: newRiesgoImpacto,
        probabilidad: newRiesgoProb,
        nivelRiesgo: nivel,
        medidaMitigacion: newRiesgoMitigacion.trim(),
        responsableMonitoreo: newRiesgoResponsable.trim() || 'Gerencia y Responsable SG-SST',
        estado: newRiesgoEstado,
      };
      setRiesgosSistema((prev) => [newItem, ...prev]);
      showToast({ message: 'Riesgo estratégico del sistema registrado.', status: 'success' });
    }

    setNewRiesgoAmenaza('');
    setNewRiesgoControlExistente('');
    setNewRiesgoMitigacion('');
  };

  const handleEditRiesgo = (r: RiesgoSistemaItem) => {
    setEditingRiesgoId(r.id);
    setNewRiesgoAmenaza(r.amenaza || '');
    setNewRiesgoFuente(r.fuenteContexto || 'Amenaza DOFA');
    setNewRiesgoControlExistente(r.controlExistente || '');
    setNewRiesgoImpacto(r.impactoSistema || 'Alto');
    setNewRiesgoProb(r.probabilidad || 'Media');
    setNewRiesgoMitigacion(r.medidaMitigacion || '');
    setNewRiesgoResponsable(r.responsableMonitoreo || 'Gerencia y Responsable SG-SST');
    setNewRiesgoEstado(r.estado || 'Abierto');
  };

  const handleRotateRiesgoStatus = (id: string) => {
    const order: RiesgoStatus[] = ['Abierto', 'En Tratamiento', 'Controlado'];
    setRiesgosSistema((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const curr = r.estado || 'Abierto';
        const next = order[(order.indexOf(curr) + 1) % order.length];
        return { ...r, estado: next };
      })
    );
  };

  // ─── LISTENERS DE TENSHI (VOZ Y CHAT) ──────────────────────────────────────
  useEffect(() => {
    const handleDiligenciar = (e: any) => {
      const { modulo, campos } = e.detail || {};
      if (
        !modulo ||
        modulo.includes('oportunidad') ||
        modulo.includes('riesgos_sistema') ||
        modulo === 'oportunidades_sst'
      ) {
        if (campos && typeof campos === 'object') {
          if (Array.isArray(campos.oportunidades)) setOportunidades(campos.oportunidades);
          if (Array.isArray(campos.riesgosSistema)) setRiesgosSistema(campos.riesgosSistema);
          showToast({
            message: 'Tenshi ha actualizado las Oportunidades y Riesgos del SG-SST.',
            status: 'success',
          });
        }
      }
    };

    const handleAiEvent = (e: any) => {
      const app = (e.detail?.aplicativo || '').toLowerCase();
      if (!app || app.includes('oportunidad') || app === 'actual') {
        handleGenerateAI();
      }
    };

    window.addEventListener('wappy-diligenciar-formulario', handleDiligenciar);
    window.addEventListener('wappy-generar-analisis-ia', handleAiEvent);
    window.addEventListener('wappy-generar-analisis-actual', handleAiEvent);
    return () => {
      window.removeEventListener('wappy-diligenciar-formulario', handleDiligenciar);
      window.removeEventListener('wappy-generar-analisis-ia', handleAiEvent);
      window.removeEventListener('wappy-generar-analisis-actual', handleAiEvent);
    };
  }, []);

  const filteredOportunidades =
    selectedCatFilter === 'Todas'
      ? oportunidades
      : oportunidades.filter(
          (o) => (o.categoria || '').toLowerCase() === selectedCatFilter.toLowerCase()
        );

  const implementedCount = oportunidades.filter(
    (o) => o.estado === 'Implementada' || o.estado === 'Verificada'
  ).length;
  const inPlanCount = oportunidades.filter((o) => o.estado === 'En Plan de Acción').length;

  const criticalHighRisksCount = riesgosSistema.filter((r) => {
    const lvl = r.nivelRiesgo || computeRiskLevel(r.impactoSistema, r.probabilidad);
    return lvl === 'Crítico' || lvl === 'Alto';
  }).length;

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* ─── BANNER PRINCIPAL HERO GLASSMORPHISM (WAPPY 14-GROUP DESIGN SYSTEM) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 shadow-lg shadow-teal-500/10">
              <Sparkles className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent">
                  Riesgos del Sistema y Oportunidades de SST
                </h2>
                {company?.companyName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                    <Building2 className="w-3.5 h-3.5" /> {company.companyName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Operativo con IA
                </span>
              </div>

              <p className="text-xs text-text-secondary max-w-3xl leading-relaxed">
                Planificación estratégica de oportunidades de mejora en seguridad, ergonomía e innovación tecnológica (Cl. 6.1.2.3) y tratamiento proactivo de riesgos para el éxito del SG-SST (Cl. 6.1.1).
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${oportunidades.length} Oportunidades de Mejora SST`}
                  className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2.5 shadow-xs transition-all duration-300 sm:hover:scale-105"
                >
                  <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-xs font-bold tracking-wide">
                      {oportunidades.length} Oportunidades SST
                    </span>
                  </div>
                </div>

                <div
                  title={`${riesgosSistema.length} Riesgos Estratégicos Evaluados`}
                  className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 shadow-xs transition-all duration-300 sm:hover:scale-105"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-xs font-bold tracking-wide">
                      {riesgosSistema.length} Riesgos del SG-SST
                    </span>
                  </div>
                </div>

                <SGSSTLegalBadge
                  standardCode="oportunidades"
                  label="ISO 45001 Num. 6.1.1 / 6.1.2.3 · Res. 0312 Est. 2.4.1: CUMPLE"
                  tooltip="ISO 45001:2018 Cláusulas 6.1.1 y 6.1.2.3 (Evaluación de oportunidades de SST y riesgos del sistema) · Res. 0312/2019 Estándar 2.4.1 y Dec. 1072/15 Art. 2.2.4.6.8"
                  moduleName="Riesgos del Sistema y Oportunidades SST"
                />
              </div>
            </div>
          </div>

          {/* BOTONERA PRINCIPAL WAPPY 14-GROUP DESIGN SYSTEM */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Grupo 6 (purple): Generar con IA (Ecosistema SST) */}
            <ExpandableButton
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              variant="purple"
              icon={
                isGeneratingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )
              }
              label={isGeneratingAI ? 'Generando con IA...' : 'Generar con IA (Ecosistema SST)'}
              title="Diagnosticar oportunidades e identificar riesgos del sistema con IA a partir de los datos reales de la empresa"
            />

            {/* Grupo 5 (cyan): Sincronizar desde Contexto DOFA / Ecosistema 360° */}
            <ExpandableButton
              onClick={handleSyncFromContexto}
              disabled={isSyncingContexto}
              variant="cyan"
              icon={
                isSyncingContexto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )
              }
              label="Alimentar desde Contexto 360° SST"
              title="Importar y derivar factores desde Contexto DOFA (4.1), Auditoría Interna, Alta Dirección, Capacitaciones, Compatibilidad FIT, Diagnóstico 0312 y Matriz GTC-45"
            />

            {/* Grupo 8 (amber): Datos de Prueba (Dummy) */}
            <ExpandableButton
              onClick={handleLoadDummy}
              variant="amber"
              icon={<Bot className="h-4 w-4" />}
              label="Datos de Prueba (Dummy)"
              title="Cargar conjunto completo de oportunidades de innovación y riesgos estratégicos del SG-SST"
            />

            {/* Grupo 10 (green): Compilar Informe Oficial */}
            <ExpandableButton
              onClick={handleCompileReport}
              disabled={isCompilingReport}
              variant="green"
              icon={
                isCompilingReport ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )
              }
              label={isCompilingReport ? 'Compilando...' : 'Compilar Informe Oficial'}
              title="Compilar informe oficial ISO 45001 Cl. 6.1 con encabezado corporativo y firmas"
            />

            {/* Grupo 3 (teal): Guardar Datos */}
            <ExpandableButton
              onClick={handleSaveData}
              disabled={isSavingData}
              variant="teal"
              icon={
                isSavingData ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )
              }
              label="Guardar Datos"
              title="Guardar oportunidades y riesgos del sistema en MongoDB"
            />
          </div>
        </div>
      </div>

      {/* ─── RADAR DE ECOSISTEMA 360° E INTELIGENCIA ESTRATÉGICA ISO 45001 (CL. 6.1.1 y 6.1.2.3) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1: Oportunidades de SST Activas */}
        <div
          onClick={() => setActiveTab('oportunidades')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Oportunidades (6.1.2.3)
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Lightbulb className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">{oportunidades.length}</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Iniciativas SST
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            {implementedCount} implementadas · {inPlanCount} en plan
          </p>
        </div>

        {/* KPI 2: Riesgos Estratégicos del SG-SST */}
        <div
          onClick={() => setActiveTab('riesgos')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Riesgos Sistema (6.1.1)
            </span>
            <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">{riesgosSistema.length}</span>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
              Riesgos Mapeados
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            {criticalHighRisksCount} de severidad Crítica / Alta
          </p>
        </div>

        {/* KPI 3: Conexión Contexto DOFA (Cl. 4.1/4.2) */}
        <div
          onClick={() => navigateToModule('contexto_organizacion')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Conexión Contexto (4.1)
            </span>
            <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">{metrics.dofaCount}</span>
            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
              Factores DOFA
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{metrics.stakeholdersCount} Stakeholders vinculados</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* KPI 4: Diagnóstico 0312 & Matriz Legal */}
        <div
          onClick={() => navigateToModule('diagnostico')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              0312 & Matriz Legal
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">{metrics.score0312}%</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Cumplimiento 0312
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>
              {metrics.brechas0312} brechas · {metrics.matrizLegalCount} normas
            </span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* KPI 5: Matriz IPEVR GTC-45 */}
        <div
          onClick={() => navigateToModule('matriz_ipevar_oficial')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Matriz IPEVR GTC-45
            </span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">{metrics.peligrosGtc45}</span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              Peligros Mapeados
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{metrics.peligrosCriticos} riesgos críticos / altos</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* KPI 6: Compatibilidad Colaborador-Cargo (FIT) */}
        <div
          onClick={() => navigateToModule('oraculo_predictivo')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Compatibilidad FIT
            </span>
            <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">{metrics.avgFitScore}%</span>
            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
              FIT Puesto-Persona
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>
              {metrics.totalWorkers} colaboradores · {metrics.workersWithFitAlerts} alertas
            </span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* KPI 7: Programa de Capacitaciones */}
        <div
          onClick={() => navigateToModule('capacitaciones')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Capacitaciones SST
            </span>
            <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">
              {metrics.capacitacionesCompletadas}/{metrics.capacitacionesTotal}
            </span>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              Sesiones ({metrics.capacitacionesCompliancePct}%)
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>Programa Anual de Formación</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* KPI 8: Auditoría Interna (Dec. 1072) */}
        <div
          onClick={() => navigateToModule('auditoria')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Auditoría Interna 1072
            </span>
            <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-black text-text-primary">
              {Number(Number(metrics.auditoriaScore || 0).toFixed(2))}%
            </span>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
              Cumplimiento
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{metrics.auditoriaNoConformidades} hallazgos / no conformidades</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* KPI 9: Revisión por la Alta Dirección */}
        <div
          onClick={() => navigateToModule('alta_direccion')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Alta Dirección (9.3)
            </span>
            <div className="p-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">
              {metrics.altaDireccionCumple}/{metrics.altaDireccionTotalItems}
            </span>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
              Numerales Art. 31
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{metrics.altaDireccionPendientes} compromisos pendientes</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* KPI 10: Trazabilidad ACPM (Centro de Control) */}
        <div
          onClick={() => navigateToModule('control_acpm')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Trazabilidad ACPM
            </span>
            <div className="p-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
              <Trello className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">{metrics.acpmCount}</span>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
              Planes Activos
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{metrics.atsCount} ATS · Abrir Tablero Kanban</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>
      </div>

      {/* ─── 3 PESTAÑAS EN CONTENEDOR ISLA FLOTANTE WAPPY ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none">
          <button
            type="button"
            onClick={() => setActiveTab('oportunidades')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'oportunidades'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-xs'
                : 'text-text-secondary hover:bg-surface-secondary font-semibold'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Oportunidades de SST e Innovación (Cláusula 6.1.2.3)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 font-extrabold">
              {oportunidades.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('riesgos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'riesgos'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-xs'
                : 'text-text-secondary hover:bg-surface-secondary font-semibold'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Riesgos del Sistema de Gestión (Cláusula 6.1.1)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-extrabold">
              {riesgosSistema.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mapa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'mapa'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-xs'
                : 'text-text-secondary hover:bg-surface-secondary font-semibold'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-500" />
            <span>Mapa de Calor Estratégico & Articulación PHVA (Cl. 6.1)</span>
          </button>
        </div>

        <ExpandableButton
          size="sm"
          variant="cyan"
          icon={<Compass className="h-4 w-4" />}
          label="Ver Contexto DOFA (Cl. 4.1)"
          onClick={() => navigateToModule('contexto_organizacion')}
        />
      </div>

      {/* ─── CONTENIDO TAB 1: OPORTUNIDADES DE SST E INNOVACIÓN (CLÁUSULA 6.1.2.3) ─── */}
      {activeTab === 'oportunidades' && (
        <div className="space-y-5">
          {/* Filtro por Categoría */}
          <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl border border-border-medium/50 bg-surface-primary/60 backdrop-blur-sm">
            <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5 text-teal-500" /> Categoría de Oportunidad:
            </span>
            {OPORTUNIDAD_CATEGORIES.map((cat) => {
              const active = selectedCatFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCatFilter(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                    active
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'bg-surface-secondary/60 border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-medium/50 bg-surface-primary/60 backdrop-blur-sm shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/80 text-text-secondary uppercase text-[10px] tracking-wider font-bold border-b border-border-light dark:border-white/10">
                <tr>
                  <th className="p-3">Oportunidad / Iniciativa</th>
                  <th className="p-3">Categoría & Origen SST</th>
                  <th className="p-3">Beneficio Esperado</th>
                  <th className="p-3 text-center">Prioridad / Viabilidad</th>
                  <th className="p-3">Responsable & Plazo</th>
                  <th className="p-3 text-center">Estado (Clic para rotar)</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5">
                {filteredOportunidades.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-secondary/40 transition-colors">
                    <td className="p-3 max-w-xs">
                      <div className="font-bold text-text-primary">{o.titulo}</div>
                      {o.recursosRequeridos && (
                        <div className="text-[11px] text-text-secondary mt-1">
                          <strong>Recursos:</strong> {o.recursosRequeridos}
                        </div>
                      )}
                      {o.indicadorExito && (
                        <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 font-medium">
                          KPI: {o.indicadorExito}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-start gap-1">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                          {o.categoria}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                          Origen: {o.origenSST || 'Contexto DOFA'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-text-secondary max-w-sm text-[11px] leading-relaxed">
                      {o.beneficioEsperado}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            (o.prioridad || 'Alta') === 'Alta'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          }`}
                        >
                          Prioridad {o.prioridad || 'Alta'}
                        </span>
                        <span className="text-[10px] text-text-secondary">
                          Viabilidad: <strong>{o.viabilidad || 'Alta'}</strong>
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-[11px]">
                      <div className="font-semibold text-text-primary">{o.responsable}</div>
                      <div className="text-[10px] text-text-secondary">{o.plazo || '60 días'}</div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRotateOportunidadStatus(o.id)}
                        title="Haz clic para avanzar el estado de la oportunidad"
                        className={`inline-flex px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition-transform active:scale-95 border ${
                          o.estado === 'Verificada'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                            : o.estado === 'Implementada'
                            ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30'
                            : o.estado === 'En Plan de Acción'
                            ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {o.estado}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <ExpandableButton
                          size="sm"
                          variant="orange"
                          icon={<Pencil className="h-3.5 w-3.5" />}
                          label="Editar"
                          onClick={() => handleEditOportunidad(o)}
                        />
                        <ExpandableButton
                          size="sm"
                          variant="cyan"
                          disabled={sendingKanbanId === o.id}
                          icon={
                            sendingKanbanId === o.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )
                          }
                          label="Enviar a ACPM"
                          onClick={() =>
                            handleSendToKanban({
                              id: o.id,
                              title: o.titulo,
                              description: `[Oportunidad SST - ${o.categoria}] Beneficio: ${o.beneficioEsperado}. Recursos: ${o.recursosRequeridos}`,
                              responsible: o.responsable,
                              priority: o.prioridad || 'Alta',
                              origin: `Oportunidad SST (${o.origenSST || 'Cl. 6.1.2.3'})`,
                            })
                          }
                        />
                        <ExpandableButton
                          size="sm"
                          variant="danger"
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          label="Eliminar"
                          onClick={() =>
                            setOportunidades((prev) => prev.filter((x) => x.id !== o.id))
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formulario Registrar / Editar Oportunidad de SST */}
          <div className="p-5 rounded-2xl border border-border-medium/50 bg-surface-primary/60 backdrop-blur-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                {editingOportId ? (
                  <>
                    <Pencil className="w-4 h-4 text-orange-500" /> Editando Oportunidad de SST (Cl. 6.1.2.3)
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-500" /> Registrar Nueva Oportunidad de SST e Innovación
                  </>
                )}
              </h4>

              <div className="flex items-center gap-2">
                <ExpandableButton
                  size="sm"
                  variant="purple"
                  disabled={isSuggestingOport}
                  onClick={handleSuggestOportunidadAI}
                  icon={
                    isSuggestingOport ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )
                  }
                  label={
                    isSuggestingOport ? 'Autocompletando...' : 'Autocompletar Oportunidad con IA'
                  }
                />
                {editingOportId && (
                  <ExpandableButton
                    size="sm"
                    variant="neutral"
                    icon={<X className="h-3.5 w-3.5" />}
                    label="Cancelar"
                    onClick={() => {
                      setEditingOportId(null);
                      setNewOportTitulo('');
                      setNewOportBeneficio('');
                    }}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Denominación de la oportunidad de SST..."
                value={newOportTitulo}
                onChange={(e) => setNewOportTitulo(e.target.value)}
                className="sm:col-span-2 px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-semibold"
              />
              <select
                value={newOportCat}
                onChange={(e) => setNewOportCat(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                {OPORTUNIDAD_CATEGORIES.filter((c) => c !== 'Todas').map((c) => (
                  <option key={c} value={c}>
                    Categoría: {c}
                  </option>
                ))}
              </select>
              <select
                value={newOportOrigen}
                onChange={(e) => setNewOportOrigen(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                {ORIGEN_SST_OPTIONS.map((orig) => (
                  <option key={orig} value={orig}>
                    Origen: {orig}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Beneficio cuantificable esperado en prevención..."
                value={newOportBeneficio}
                onChange={(e) => setNewOportBeneficio(e.target.value)}
                className="sm:col-span-2 px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <input
                type="text"
                placeholder="Recursos requeridos..."
                value={newOportRecursos}
                onChange={(e) => setNewOportRecursos(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <input
                type="text"
                placeholder="Indicador de éxito (KPI)..."
                value={newOportIndicador}
                onChange={(e) => setNewOportIndicador(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 items-center">
              <select
                value={newOportPrioridad}
                onChange={(e) => setNewOportPrioridad(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="Alta">Prioridad Alta</option>
                <option value="Media">Prioridad Media</option>
                <option value="Baja">Prioridad Baja</option>
              </select>

              <input
                type="text"
                placeholder="Responsable..."
                value={newOportResponsable}
                onChange={(e) => setNewOportResponsable(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />

              <input
                type="text"
                placeholder="Plazo (ej: 60 días)..."
                value={newOportPlazo}
                onChange={(e) => setNewOportPlazo(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />

              <div className="flex items-center justify-end gap-2">
                <ExpandableButton
                  onClick={handleSaveOportunidad}
                  variant={editingOportId ? 'teal' : 'emerald'}
                  icon={editingOportId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  label={editingOportId ? 'Actualizar Oportunidad' : 'Añadir Oportunidad'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONTENIDO TAB 2: RIESGOS DEL SISTEMA DE GESTIÓN (CLÁUSULA 6.1.1) ─── */}
      {activeTab === 'riesgos' && (
        <div className="space-y-5">
          <div className="overflow-x-auto rounded-2xl border border-border-medium/50 bg-surface-primary/60 backdrop-blur-sm shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/80 text-text-secondary uppercase text-[10px] tracking-wider font-bold border-b border-border-light dark:border-white/10">
                <tr>
                  <th className="p-3">Amenaza al Éxito del SG-SST</th>
                  <th className="p-3">Fuente del Contexto</th>
                  <th className="p-3 text-center">Valoración (Impacto x Prob.)</th>
                  <th className="p-3">Medida Preventiva de Mitigación</th>
                  <th className="p-3 text-center">Responsable & Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5">
                {riesgosSistema.map((r) => {
                  const lvl = r.nivelRiesgo || computeRiskLevel(r.impactoSistema, r.probabilidad);
                  const lvlBadge =
                    lvl === 'Crítico'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                      : lvl === 'Alto'
                      ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30'
                      : lvl === 'Medio'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';

                  const est = r.estado || 'Abierto';
                  return (
                    <tr key={r.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="p-3 max-w-xs">
                        <div className="font-bold text-text-primary">{r.amenaza}</div>
                        {r.controlExistente && (
                          <div className="text-[11px] text-text-secondary mt-1">
                            <strong>Control actual:</strong> {r.controlExistente}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                          {r.fuenteContexto || 'Amenaza DOFA'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase border ${lvlBadge}`}>
                            Riesgo {lvl}
                          </span>
                          <span className="text-[10px] text-text-secondary">
                            Imp. {r.impactoSistema} × Prob. {r.probabilidad}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-emerald-700 dark:text-emerald-300 font-medium max-w-sm text-[11px] leading-relaxed">
                        {r.medidaMitigacion}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[11px] font-semibold text-text-primary">
                            {r.responsableMonitoreo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRotateRiesgoStatus(r.id)}
                            title="Haz clic para cambiar el estado de control del riesgo"
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer border ${
                              est === 'Controlado'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : est === 'En Tratamiento'
                                ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {est}
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <ExpandableButton
                            size="sm"
                            variant="orange"
                            icon={<Pencil className="h-3.5 w-3.5" />}
                            label="Editar"
                            onClick={() => handleEditRiesgo(r)}
                          />
                          <ExpandableButton
                            size="sm"
                            variant="cyan"
                            disabled={sendingKanbanId === r.id}
                            icon={
                              sendingKanbanId === r.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )
                            }
                            label="Enviar Mitigación a ACPM"
                            onClick={() =>
                              handleSendToKanban({
                                id: r.id,
                                title: r.medidaMitigacion,
                                description: `[Mitigación Riesgo SG-SST - ${lvl}] Amenaza: ${r.amenaza}. Medida: ${r.medidaMitigacion}`,
                                responsible: r.responsableMonitoreo,
                                priority: r.impactoSistema,
                                origin: `Riesgo del Sistema (${r.fuenteContexto || 'Cl. 6.1.1'})`,
                              })
                            }
                          />
                          <ExpandableButton
                            size="sm"
                            variant="danger"
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            label="Eliminar"
                            onClick={() =>
                              setRiesgosSistema((prev) => prev.filter((x) => x.id !== r.id))
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Formulario Registrar / Editar Riesgo del Sistema */}
          <div className="p-5 rounded-2xl border border-border-medium/50 bg-surface-primary/60 backdrop-blur-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                {editingRiesgoId ? (
                  <>
                    <Pencil className="w-4 h-4 text-orange-500" /> Editando Riesgo del Sistema (Cl. 6.1.1)
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-500" /> Registrar Nuevo Riesgo para el Sistema de Gestión
                  </>
                )}
              </h4>

              <div className="flex items-center gap-2">
                <ExpandableButton
                  size="sm"
                  variant="purple"
                  disabled={isSuggestingRiesgo}
                  onClick={handleSuggestRiesgoAI}
                  icon={
                    isSuggestingRiesgo ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )
                  }
                  label={isSuggestingRiesgo ? 'Generando...' : 'Sugerir Mitigación con IA'}
                />
                {editingRiesgoId && (
                  <ExpandableButton
                    size="sm"
                    variant="neutral"
                    icon={<X className="h-3.5 w-3.5" />}
                    label="Cancelar"
                    onClick={() => {
                      setEditingRiesgoId(null);
                      setNewRiesgoAmenaza('');
                      setNewRiesgoMitigacion('');
                    }}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Amenaza que podría impedir el éxito del SG-SST..."
                value={newRiesgoAmenaza}
                onChange={(e) => setNewRiesgoAmenaza(e.target.value)}
                className="sm:col-span-2 px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-semibold"
              />
              <select
                value={newRiesgoFuente}
                onChange={(e) => setNewRiesgoFuente(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                {FUENTES_RIESGO_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    Fuente: {f}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Control existente actual..."
                value={newRiesgoControlExistente}
                onChange={(e) => setNewRiesgoControlExistente(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 items-center">
              <select
                value={newRiesgoImpacto}
                onChange={(e) => setNewRiesgoImpacto(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="Alto">Impacto Alto</option>
                <option value="Medio">Impacto Medio</option>
                <option value="Bajo">Impacto Bajo</option>
              </select>

              <select
                value={newRiesgoProb}
                onChange={(e) => setNewRiesgoProb(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="Alta">Probabilidad Alta</option>
                <option value="Media">Probabilidad Media</option>
                <option value="Baja">Probabilidad Baja</option>
              </select>

              <input
                type="text"
                placeholder="Responsable de monitoreo..."
                value={newRiesgoResponsable}
                onChange={(e) => setNewRiesgoResponsable(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />

              <select
                value={newRiesgoEstado}
                onChange={(e) => setNewRiesgoEstado(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="Abierto">Estado: Abierto</option>
                <option value="En Tratamiento">Estado: En Tratamiento</option>
                <option value="Controlado">Estado: Controlado</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <input
                type="text"
                placeholder="Medida preventiva de mitigación planificada..."
                value={newRiesgoMitigacion}
                onChange={(e) => setNewRiesgoMitigacion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRiesgo()}
                className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <ExpandableButton
                onClick={handleSaveRiesgo}
                variant={editingRiesgoId ? 'teal' : 'emerald'}
                icon={editingRiesgoId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                label={editingRiesgoId ? 'Actualizar Riesgo' : 'Añadir Riesgo'}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── CONTENIDO TAB 3: MAPA DE CALOR ESTRATÉGICO & ARTICULACIÓN PHVA (CL. 6.1) ─── */}
      {activeTab === 'mapa' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Matriz de Calor 3x3 (Probabilidad vs Impacto) */}
            <div className="rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-6 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Matriz de Calor 3×3 — Riesgos Estratégicos del SG-SST (Cl. 6.1.1)
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Cruce de Probabilidad vs Impacto sobre la eficacia del Sistema de Gestión
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {(['Alta', 'Media', 'Baja'] as const).map((prob) =>
                  (['Bajo', 'Medio', 'Alto'] as const).map((imp) => {
                    const cellLevel = computeRiskLevel(imp, prob);
                    const cellRisks = riesgosSistema.filter(
                      (r) => r.probabilidad === prob && r.impactoSistema === imp
                    );
                    const cellStyle =
                      cellLevel === 'Crítico'
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        : cellLevel === 'Alto'
                        ? 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300'
                        : cellLevel === 'Medio'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';

                    return (
                      <div
                        key={`${prob}_${imp}`}
                        className={`p-3 rounded-xl border ${cellStyle} flex flex-col justify-between min-h-[105px]`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                          <span>
                            P.{prob} / I.{imp}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10">
                            {cellLevel}
                          </span>
                        </div>
                        <div className="my-1">
                          <span className="text-2xl font-black">{cellRisks.length}</span>
                          <span className="text-[10px] ml-1 font-semibold">riesgos</span>
                        </div>
                        <div className="text-[10px] line-clamp-2 opacity-90">
                          {cellRisks.length > 0
                            ? cellRisks.map((r) => r.amenaza).join(' • ')
                            : 'Sin amenazas en este cuadrante'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. Distribución de Oportunidades de SST por Categoría y Estado */}
            <div className="rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-6 backdrop-blur-sm space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-500" />
                  Avance de Oportunidades de SST por Categoría (Cl. 6.1.2.3)
                </h3>
                <p className="text-xs text-text-secondary">
                  Impacto proyectado en la Huella Biocéntrica, ergonomía y reducción de ATEL
                </p>
              </div>

              <div className="space-y-3">
                {OPORTUNIDAD_CATEGORIES.filter((c) => c !== 'Todas').map((cat) => {
                  const catItems = oportunidades.filter((o) => o.categoria === cat);
                  const pct =
                    oportunidades.length > 0
                      ? Math.round((catItems.length / oportunidades.length) * 100)
                      : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-text-primary">{cat}</span>
                        <span className="text-text-secondary font-semibold">
                          {catItems.length} iniciativas ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-xl bg-surface-secondary overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl transition-all duration-500"
                          style={{ width: `${Math.max(pct, catItems.length > 0 ? 12 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {(
                  ['Identificada', 'En Plan de Acción', 'Implementada', 'Verificada'] as const
                ).map((st) => {
                  const count = oportunidades.filter((o) => o.estado === st).length;
                  return (
                    <div
                      key={st}
                      className="p-2.5 rounded-xl border border-border-light dark:border-white/10 bg-surface-secondary/50 text-center"
                    >
                      <div className="text-lg font-black text-text-primary">{count}</div>
                      <div className="text-[10px] font-bold text-text-secondary">{st}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Puente de Navegación Rápida con Somos SST */}
          <div className="rounded-2xl border border-teal-500/30 bg-teal-500/[0.04] p-5 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                  Puente de Articulación Rápida PHVA — Ecosistema Somos SST
                </h4>
                <p className="text-xs text-text-secondary">
                  Salta con 1 clic a los módulos conexos que alimentan o ejecutan las decisiones de la Cláusula 6.1.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExpandableButton
                variant="cyan"
                icon={<Compass className="h-4 w-4" />}
                label="Contexto DOFA (4.1)"
                onClick={() => navigateToModule('contexto_organizacion')}
              />
              <ExpandableButton
                variant="purple"
                icon={<ClipboardCheck className="h-4 w-4" />}
                label="Auditoría Interna 1072"
                onClick={() => navigateToModule('auditoria')}
              />
              <ExpandableButton
                variant="teal"
                icon={<Award className="h-4 w-4" />}
                label="Revisión Alta Dirección"
                onClick={() => navigateToModule('alta_direccion')}
              />
              <ExpandableButton
                variant="blue"
                icon={<GraduationCap className="h-4 w-4" />}
                label="Programa Capacitaciones"
                onClick={() => navigateToModule('capacitaciones')}
              />
              <ExpandableButton
                variant="indigo"
                icon={<UserCheck className="h-4 w-4" />}
                label="Compatibilidad Cargo-Persona (FIT)"
                onClick={() => navigateToModule('oraculo_predictivo')}
              />
              <ExpandableButton
                variant="emerald"
                icon={<Stethoscope className="h-4 w-4" />}
                label="Diagnóstico 0312"
                onClick={() => navigateToModule('diagnostico')}
              />
              <ExpandableButton
                variant="amber"
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Matriz IPEVR GTC-45"
                onClick={() => navigateToModule('matriz_ipevar_oficial')}
              />
              <ExpandableButton
                variant="orange"
                icon={<HeartPulse className="h-4 w-4" />}
                label="Ergonomía & Puesto"
                onClick={() => navigateToModule('estudio_puesto')}
              />
              <ExpandableButton
                variant="amber"
                icon={<HardHat className="h-4 w-4" />}
                label="Operación Terreno (ATS)"
                onClick={() => navigateToModule('analisis_trabajo_seguro')}
              />
              <ExpandableButton
                variant="emerald"
                icon={<Target className="h-4 w-4" />}
                label="Objetivos SST"
                onClick={() => navigateToModule('objetivos')}
              />
              <ExpandableButton
                variant="purple"
                icon={<Trello className="h-4 w-4" />}
                label="Centro de Control ACPM"
                onClick={() => navigateToModule('control_acpm')}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TOOLBAR FLOTANTE CÁPSULA WAPPY ─── */}
      <SGSSTToolbar
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        onAnalyze={handleCompileReport}
        isAnalyzing={isCompilingReport}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onSaveLocal={handleSaveData}
        isSavingLocal={isSavingData}
        hasContent={!!(editorContentRef.current || generatedReport)}
        exportContent={editorContentRef.current || generatedReport || ''}
        exportFileName={`Oportunidades_y_Riesgos_Sistema_ISO45001_${Date.now()}`}
      />

      {/* ─── MODAL DE HISTORIAL DE REPORTES (ReportHistory) ─── */}
      <ReportHistory
        onSelectReport={handleSelectReportFromHistory}
        isOpen={isHistoryOpen}
        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
        refreshTrigger={refreshTrigger}
        tags={['sgsst-oportunidades', 'sgsst-oportunidades-sst']}
      />

      {/* ─── CUADRO DE INFORME EXPANDIBLE / LIVE EDITOR ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Matriz de Oportunidades y Riesgos del Sistema (ISO 45001 Num. 6.1.1 y 6.1.2.3)"
        icon={<Sparkles className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName={`Oportunidades_y_Riesgos_Sistema_${company?.companyName || 'ISO45001'}`}
            reportType="general"
          />
        }
      >
        <div className="w-full min-w-0">
          <LiveEditor
            ref={liveEditorRef}
            paperMode={true}
            initialContent={generatedReport || ''}
            onUpdate={(html) => {
              editorContentRef.current = html;
            }}
            reportSourceData={{ oportunidades, riesgosSistema, company }}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default OportunidadesWorkspace;
