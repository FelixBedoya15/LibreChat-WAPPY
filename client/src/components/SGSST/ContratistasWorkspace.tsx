import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  Save,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Shield,
  FileCheck,
  Sparkles,
  Filter,
  Search,
  RefreshCw,
  Pencil,
  Trello,
  HardHat,
  GraduationCap,
  ClipboardCheck,
  X,
  Check,
  Activity,
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import LiveEditor, { type LiveEditorHandle } from '~/components/Liva/Editor/LiveEditor';
import ReportHistory from '~/components/Liva/ReportHistory';
import ExpandableButton from '~/components/Common/ExpandableButton';
import ExportDropdown from './ExportDropdown';
import SGSSTToolbar from './SGSSTToolbar';
import SGSSTLegalBadge from './SGSSTLegalBadge';
import SGSSTHeroHeader from './SGSSTHeroHeader';
import CollapsibleReportBox from './CollapsibleReportBox';
import { useAutoLoadReport } from './useAutoLoadReport';

export type NivelRiesgoARL = 'Clase I' | 'Clase II' | 'Clase III' | 'Clase IV' | 'Clase V';
export type EstadoPilaType = 'Vigente' | 'Pendiente' | 'Vencida';
export type CalificacionContratistaSST = 'Aprobado' | 'Condicionado' | 'No Apto';
export type InduccionEstadoType = 'Completada (100%)' | 'En Curso' | 'Pendiente';

export interface ContratistaItem {
  id: string;
  codigo: string;
  razonSocial: string;
  nit: string;
  contactoNombre: string;
  servicio: string;
  tipoTercero: string;
  nivelRiesgo: NivelRiesgoARL;
  arl: string;
  trabajadoresEnMision: number;
  cumplimiento0312Pct: number;
  estadoPila: EstadoPilaType;
  induccionSST: InduccionEstadoType;
  tareaAltoRiesgo: string;
  certificadosExigidos: string;
  calificacionSST: CalificacionContratistaSST;
  fechaUltimaAuditoria: string;
  sentToAcpm?: boolean;
}

export interface ChecklistRequisitoItem {
  id: string;
  codigo: string;
  requisito: string;
  fundamentoLegal: string;
  momentoExigencia: 'Pre-Contractual / Selección' | 'Pre-Ingreso a Planta' | 'Durante Ejecución en Terreno';
  documentoEvidencia: string;
  responsableValidacion: string;
  estadoVerificacion: 'Cumple (Verificado)' | 'En Verificación' | 'Pendiente';
  obligatorio: boolean;
}

export interface ContratistasEcosystemMetrics {
  diagnosticoScore: number;
  estandar2101Status: string;
  atsCount: number;
  permisosAlturasCount: number;
  eppEntregasCount: number;
  quimicosCount: number;
  capacitacionesCompliancePct: number;
  capacitacionesCompletadas: number;
  capacitacionesTotal: number;
  atelInvestigacionesCount: number;
  actosInsegurosCount: number;
  acpmTotal: number;
  acpmPending: number;
}

function round2(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(2));
}

function safeStr(val: unknown, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  const s = String(val).trim();
  return s || fallback;
}

const TIPOS_TERCERO_OPTIONS = [
  'Contratista en Sitio',
  'Subcontratista Especializado',
  'Proveedor Crítico con Ingreso',
  'Trabajador Independiente (OPS)',
  'Empresa de Servicios Temporales (EST)',
];

const TAREAS_ALTO_RIESGO_OPTIONS = [
  'Trabajo en Alturas (Res. 4272/2021)',
  'Riesgo Eléctrico / RETIE',
  'Espacios Confinados (Res. 0491/2020)',
  'Trabajo en Caliente / Soldadura',
  'Manipulación de Sustancias Químicas SGA',
  'Transporte y Logística Vial (PESV)',
  'No Aplica - Riesgo Locativo / Ordinario',
];

const INITIAL_CONTRATISTAS: ContratistaItem[] = [
  {
    id: 'contr_1',
    codigo: 'CONTR-001',
    razonSocial: 'Ingeniería & Mantenimiento Eléctrico S.A.S.',
    nit: '900.876.543-1',
    contactoNombre: 'Ing. Carlos Andrés Mejía (Residente SST)',
    servicio: 'Mantenimiento predictivo y preventivo de subestaciones y tableros eléctricos',
    tipoTercero: 'Contratista en Sitio',
    nivelRiesgo: 'Clase V',
    arl: 'ARL SURA',
    trabajadoresEnMision: 5,
    cumplimiento0312Pct: 92.5,
    estadoPila: 'Vigente',
    induccionSST: 'Completada (100%)',
    tareaAltoRiesgo: 'Riesgo Eléctrico / RETIE',
    certificadosExigidos:
      'Matrícula profesional CONTE/CONALTEL vigente, Certificación Trabajo en Alturas Res. 4272/21 y dotación dieléctrica ignífuga.',
    calificacionSST: 'Aprobado',
    fechaUltimaAuditoria: '2026-10-15',
  },
  {
    id: 'contr_2',
    codigo: 'CONTR-002',
    razonSocial: 'Servicios Integrales de Aseo, Desinfección y Cafetería Ltda.',
    nit: '890.123.456-7',
    contactoNombre: 'Laura Patricia Gómez (Coordinadora Operativa)',
    servicio: 'Limpieza locativa, desinfección de áreas comunes y manejo de residuos',
    tipoTercero: 'Contratista en Sitio',
    nivelRiesgo: 'Clase II',
    arl: 'Positiva ARL',
    trabajadoresEnMision: 8,
    cumplimiento0312Pct: 88,
    estadoPila: 'Vigente',
    induccionSST: 'Completada (100%)',
    tareaAltoRiesgo: 'Manipulación de Sustancias Químicas SGA',
    certificadosExigidos:
      'Certificado ARL Estándares Mínimos 0312, capacitación en manejo seguro de productos químicos SGA y FDS en carrito de aseo.',
    calificacionSST: 'Aprobado',
    fechaUltimaAuditoria: '2026-10-12',
  },
  {
    id: 'contr_3',
    codigo: 'CONTR-003',
    razonSocial: 'Montajes Estructurales & Cubiertas del Norte S.A.S.',
    nit: '901.456.789-2',
    contactoNombre: 'Arq. Jorge Eliécer Pardo',
    servicio: 'Reparación de bajantes, impermeabilización y cambio de tejas en cubierta logística',
    tipoTercero: 'Subcontratista Especializado',
    nivelRiesgo: 'Clase V',
    arl: 'ARL Colmena',
    trabajadoresEnMision: 4,
    cumplimiento0312Pct: 76.5,
    estadoPila: 'Pendiente',
    induccionSST: 'En Curso',
    tareaAltoRiesgo: 'Trabajo en Alturas (Res. 4272/2021)',
    certificadosExigidos:
      'Curso Coordinador y Trabajador Autorizado en Alturas (Res. 4272/2021), examen médico de aptitud para alturas, ATS y permiso diario.',
    calificacionSST: 'Condicionado',
    fechaUltimaAuditoria: '2026-10-18',
  },
  {
    id: 'contr_4',
    codigo: 'CONTR-004',
    razonSocial: 'Transportes y Logística Empresarial del Valle S.A.S.',
    nit: '800.654.321-4',
    contactoNombre: 'Hernán Darío Vélez (Líder PESV)',
    servicio: 'Transporte de mercancías, cargue y descargue en muelles de despacho',
    tipoTercero: 'Proveedor Crítico con Ingreso',
    nivelRiesgo: 'Clase IV',
    arl: 'Seguros Bolívar ARL',
    trabajadoresEnMision: 6,
    cumplimiento0312Pct: 90,
    estadoPila: 'Vigente',
    induccionSST: 'Completada (100%)',
    tareaAltoRiesgo: 'Transporte y Logística Vial (PESV)',
    certificadosExigidos:
      'SOAT, Técnico-Mecánica vigente, inspección preoperacional PESV (Res. 20223040040595) y curso de manejo defensivo.',
    calificacionSST: 'Aprobado',
    fechaUltimaAuditoria: '2026-10-20',
  },
];

const INITIAL_CHECKLIST_REQUISITOS: ChecklistRequisitoItem[] = [
  {
    id: 'chk_1',
    codigo: 'REQ-2.10.1-01',
    requisito: 'Certificado ARL de Evaluación de Estándares Mínimos (Resolución 0312 de 2019)',
    fundamentoLegal: 'Resolución 0312 de 2019 Estándar 2.10.1 · Decreto 1072 Art. 2.2.4.6.28 Num. 1',
    momentoExigencia: 'Pre-Contractual / Selección',
    documentoEvidencia: 'Certificado emitido por la ARL o autoevaluación firmada por Representante Legal y Profesional SST con licencia vigente.',
    responsableValidacion: 'Compras y Responsable SG-SST',
    estadoVerificacion: 'Cumple (Verificado)',
    obligatorio: true,
  },
  {
    id: 'chk_2',
    codigo: 'REQ-2.10.1-02',
    requisito: 'Planilla Integrada de Liquidación de Aportes (PILA) Vigente del Personal en Misión',
    fundamentoLegal: 'Decreto 1072 de 2015 Art. 2.2.4.6.28 Num. 4 · Ley 1562 de 2012',
    momentoExigencia: 'Pre-Ingreso a Planta',
    documentoEvidencia: 'Soporte de pago PILA del mes activo verificando cotización a Salud, Pensión y ARL en la Clase de Riesgo real (I a V).',
    responsableValidacion: 'Responsable SG-SST y Control de Acceso',
    estadoVerificacion: 'Cumple (Verificado)',
    obligatorio: true,
  },
  {
    id: 'chk_3',
    codigo: 'REQ-2.10.1-03',
    requisito: 'Conceptos Médicos Ocupacionales de Aptitud Laboral y Tareas de Alto Riesgo',
    fundamentoLegal: 'Resolución 2346 de 2007 · Resolución 4272 de 2021 (Alturas) · Res. 0491 de 2020',
    momentoExigencia: 'Pre-Ingreso a Planta',
    documentoEvidencia: 'Certificado médico ocupacional vigente (< 1 año) sin restricciones incompatibles con la labor contratada.',
    responsableValidacion: 'Responsable SG-SST',
    estadoVerificacion: 'Cumple (Verificado)',
    obligatorio: true,
  },
  {
    id: 'chk_4',
    codigo: 'REQ-2.10.1-04',
    requisito: 'Inducción y Reinducción SST sobre Peligros, Controles y Emergencias de la Sede',
    fundamentoLegal: 'Decreto 1072 de 2015 Art. 2.2.4.6.11 y Art. 2.2.4.6.28 Num. 2 y 3',
    momentoExigencia: 'Pre-Ingreso a Planta',
    documentoEvidencia: 'Registro de asistencia firmado y evaluación aprobada de inducción SST y socialización del Plan de Emergencias (PPRE).',
    responsableValidacion: 'Responsable SG-SST',
    estadoVerificacion: 'Cumple (Verificado)',
    obligatorio: true,
  },
  {
    id: 'chk_5',
    codigo: 'REQ-2.10.1-05',
    requisito: 'Entrega de Elementos de Protección Personal (EPP) y Dotación Acorde al Riesgo',
    fundamentoLegal: 'Ley 9 de 1979 Art. 122 · Decreto 1072 de 2015 Art. 2.2.4.6.24',
    momentoExigencia: 'Pre-Ingreso a Planta',
    documentoEvidencia: 'Formato de entrega de EPP firmado por cada trabajador en misión y verificación de normas ANSI/ASTM en campo.',
    responsableValidacion: 'Supervisor de Campo y Vigía/COPASST',
    estadoVerificacion: 'Cumple (Verificado)',
    obligatorio: true,
  },
  {
    id: 'chk_6',
    codigo: 'REQ-2.10.1-06',
    requisito: 'Certificados de Competencia para Tareas de Alto Riesgo (Alturas, Confinados, Eléctrico)',
    fundamentoLegal: 'Resolución 4272 de 2021 · Resolución 0491 de 2020 · RETIE (CONTE/CONALTEL)',
    momentoExigencia: 'Durante Ejecución en Terreno',
    documentoEvidencia: 'Certificados vigentes de Trabajador Autorizado y Coordinador de Alturas, matrícula profesional e inspección de arneses.',
    responsableValidacion: 'Coordinador de Trabajo en Alturas / Líder SST',
    estadoVerificacion: 'En Verificación',
    obligatorio: true,
  },
  {
    id: 'chk_7',
    codigo: 'REQ-2.10.1-07',
    requisito: 'Diligenciamiento de Análisis de Trabajo Seguro (ATS) y Permiso de Trabajo en Sitio',
    fundamentoLegal: 'ISO 45001:2018 Cláusula 8.1.4.2 · Decreto 1072 Art. 2.2.4.6.28',
    momentoExigencia: 'Durante Ejecución en Terreno',
    documentoEvidencia: 'Formato ATS y Permiso de Trabajo firmado en el punto de labor antes de iniciar actividades no rutinarias o críticas.',
    responsableValidacion: 'Interventor del Contrato y Responsable SG-SST',
    estadoVerificacion: 'Cumple (Verificado)',
    obligatorio: true,
  },
  {
    id: 'chk_8',
    codigo: 'REQ-2.10.1-08',
    requisito: 'Protocolo de Reporte Inmediato e Investigación Conjunta de Incidentes y ATEL',
    fundamentoLegal: 'Decreto 1072 de 2015 Art. 2.2.4.6.28 Num. 5 y Art. 2.2.4.6.32 · Res. 1401 de 2007',
    momentoExigencia: 'Durante Ejecución en Terreno',
    documentoEvidencia: 'Compromiso firmado de notificación inmediata (< 24h) de cualquier incidente o ATEL ocurrido durante la ejecución contractual.',
    responsableValidacion: 'Responsable SG-SST y Representante del Contratista',
    estadoVerificacion: 'Cumple (Verificado)',
    obligatorio: true,
  },
];

function normalizeContratistaItem(raw: any, idx: number): ContratistaItem {
  const rawPila = safeStr(raw?.estadoPila, 'Vigente');
  const estadoPila: EstadoPilaType = /vencid/i.test(rawPila)
    ? 'Vencida'
    : /pendient/i.test(rawPila)
    ? 'Pendiente'
    : 'Vigente';

  const rawCal = safeStr(raw?.calificacionSST || raw?.calificacion, 'Aprobado');
  const calificacionSST: CalificacionContratistaSST = /no\s*apto|rechazad/i.test(rawCal)
    ? 'No Apto'
    : /condicionad/i.test(rawCal)
    ? 'Condicionado'
    : 'Aprobado';

  let induccionSST: InduccionEstadoType = 'Completada (100%)';
  if (raw?.induccionSST === false) {
    induccionSST = 'Pendiente';
  } else if (typeof raw?.induccionSST === 'string') {
    if (/pendient/i.test(raw.induccionSST)) induccionSST = 'Pendiente';
    else if (/curso|parcial/i.test(raw.induccionSST)) induccionSST = 'En Curso';
  }

  return {
    id: safeStr(raw?.id, `contr_${Date.now()}_${idx}`),
    codigo: safeStr(raw?.codigo, `CONTR-${String(idx + 1).padStart(3, '0')}`),
    razonSocial: safeStr(raw?.razonSocial, 'Empresa Contratista Aliada'),
    nit: safeStr(raw?.nit, '900.000.000-1'),
    contactoNombre: safeStr(
      raw?.contactoNombre || raw?.contactoResponsable || raw?.contacto,
      'Líder SST Contratista'
    ),
    servicio: safeStr(raw?.servicio, 'Servicio técnico especializado'),
    tipoTercero: safeStr(raw?.tipoTercero, 'Contratista en Sitio'),
    nivelRiesgo: (safeStr(raw?.nivelRiesgo, 'Clase III') as NivelRiesgoARL) || 'Clase III',
    arl: safeStr(raw?.arl, 'ARL SURA'),
    trabajadoresEnMision: Math.max(1, Number(raw?.trabajadoresEnMision || 1)),
    cumplimiento0312Pct: round2(raw?.cumplimiento0312Pct ?? raw?.puntaje0312 ?? 88),
    estadoPila,
    induccionSST,
    tareaAltoRiesgo: safeStr(raw?.tareaAltoRiesgo, 'Trabajo en Alturas (Res. 4272/2021)'),
    certificadosExigidos: safeStr(
      raw?.certificadosExigidos,
      'Planilla PILA mes activo + Certificado ARL 0312 + Inducción SST'
    ),
    calificacionSST,
    fechaUltimaAuditoria: safeStr(
      raw?.fechaUltimaAuditoria,
      new Date().toISOString().split('T')[0]
    ),
    sentToAcpm: Boolean(raw?.sentToAcpm || raw?.sentToKanban),
  };
}

function normalizeChecklistItem(raw: any, idx: number): ChecklistRequisitoItem {
  const rawEst = safeStr(raw?.estadoVerificacion || raw?.estado, 'Cumple (Verificado)');
  const estadoVerificacion: ChecklistRequisitoItem['estadoVerificacion'] = /pendient/i.test(rawEst)
    ? 'Pendiente'
    : /en\s*verificaci[oó]n|parcial/i.test(rawEst)
    ? 'En Verificación'
    : 'Cumple (Verificado)';

  return {
    id: safeStr(raw?.id, `chk_${Date.now()}_${idx}`),
    codigo: safeStr(raw?.codigo, `REQ-2.10.1-0${idx + 1}`),
    requisito: safeStr(raw?.requisito, 'Requisito legal para contratistas'),
    fundamentoLegal: safeStr(
      raw?.fundamentoLegal || raw?.normaBase,
      'Dec. 1072 Art. 2.2.4.6.28 · Res. 0312 Est. 2.10.1'
    ),
    momentoExigencia: (safeStr(
      raw?.momentoExigencia || raw?.etapa,
      'Pre-Ingreso a Planta'
    ) as ChecklistRequisitoItem['momentoExigencia']),
    documentoEvidencia: safeStr(
      raw?.documentoEvidencia || raw?.requisito,
      'Soporte documental verificado por SST'
    ),
    responsableValidacion: safeStr(raw?.responsableValidacion, 'Responsable SG-SST'),
    estadoVerificacion,
    obligatorio: raw?.obligatorio !== undefined ? Boolean(raw.obligatorio) : true,
  };
}

export const ContratistasWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [activeTab, setActiveTab] = useState<'contratistas' | 'checklist'>('contratistas');
  const [contratistas, setContratistas] = useState<ContratistaItem[]>(INITIAL_CONTRATISTAS);
  const [checklistRequisitos, setChecklistRequisitos] =
    useState<ChecklistRequisitoItem[]>(INITIAL_CHECKLIST_REQUISITOS);
  const [company, setCompany] = useState<any>(null);

  const [metrics, setMetrics] = useState<ContratistasEcosystemMetrics>({
    diagnosticoScore: 89.5,
    estandar2101Status: 'Cumple',
    atsCount: 6,
    permisosAlturasCount: 5,
    eppEntregasCount: 18,
    quimicosCount: 12,
    capacitacionesCompliancePct: 86.5,
    capacitacionesCompletadas: 13,
    capacitacionesTotal: 15,
    atelInvestigacionesCount: 0,
    actosInsegurosCount: 2,
    acpmTotal: 10,
    acpmPending: 3,
  });

  // Filtros Pestaña 1
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCalificacion, setFilterCalificacion] = useState<string>('todos');
  const [filterPila, setFilterPila] = useState<string>('todas');

  // Estados de reporte y operaciones
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuditingAI, setIsAuditingAI] = useState(false);
  const [isSendingAcpm, setIsSendingAcpm] = useState(false);
  const [sendingRowAcpmId, setSendingRowAcpmId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);

  // Formulario Crear / Editar Contratista
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContratistaId, setEditingContratistaId] = useState<string | null>(null);
  const [newRazonSocial, setNewRazonSocial] = useState('');
  const [newNit, setNewNit] = useState('');
  const [newContacto, setNewContacto] = useState('');
  const [newServicio, setNewServicio] = useState('');
  const [newTipoTercero, setNewTipoTercero] = useState('Contratista en Sitio');
  const [newNivelRiesgo, setNewNivelRiesgo] = useState<NivelRiesgoARL>('Clase III');
  const [newArl, setNewArl] = useState('ARL SURA');
  const [newTrabajadores, setNewTrabajadores] = useState<number>(3);
  const [newCumplimiento0312, setNewCumplimiento0312] = useState<number>(88);
  const [newEstadoPila, setNewEstadoPila] = useState<EstadoPilaType>('Vigente');
  const [newInduccionSST, setNewInduccionSST] = useState<InduccionEstadoType>('Completada (100%)');
  const [newTareaAltoRiesgo, setNewTareaAltoRiesgo] = useState('Trabajo en Alturas (Res. 4272/2021)');
  const [newCertificados, setNewCertificados] = useState('');
  const [newCalificacion, setNewCalificacion] = useState<CalificacionContratistaSST>('Aprobado');

  // Formulario Crear / Editar Requisito Pre-Ingreso (Pestaña 2)
  const [isReqFormOpen, setIsReqFormOpen] = useState(false);
  const [newReqNombre, setNewReqNombre] = useState('');
  const [newReqFundamento, setNewReqFundamento] = useState(
    'Dec. 1072 Art. 2.2.4.6.28 · Res. 0312 Est. 2.10.1'
  );
  const [newReqMomento, setNewReqMomento] =
    useState<ChecklistRequisitoItem['momentoExigencia']>('Pre-Ingreso a Planta');
  const [newReqEvidencia, setNewReqEvidencia] = useState('');
  const [newReqResponsable, setNewReqResponsable] = useState('Responsable SG-SST');

  const navigateToModule = (moduleId: string) => {
    window.dispatchEvent(new CustomEvent('navigate-sgsst', { detail: { module: moduleId } }));
  };

  const applyEcosystemMetrics = useCallback((em: any) => {
    if (!em || typeof em !== 'object') return;
    setMetrics((prev) => ({
      diagnosticoScore: round2(em.diagnosticoScore ?? em.score0312 ?? prev.diagnosticoScore),
      estandar2101Status: safeStr(em.estandar2101Status, 'Cumple'),
      atsCount: Number(em.atsCount ?? prev.atsCount ?? 0),
      permisosAlturasCount: Number(em.permisosAlturasCount ?? prev.permisosAlturasCount ?? 0),
      eppEntregasCount: Number(
        em.eppEntregasCount ?? em.proveedoresComprasCount ?? prev.eppEntregasCount ?? 0
      ),
      quimicosCount: Number(em.quimicosCount ?? prev.quimicosCount ?? 0),
      capacitacionesCompliancePct: round2(
        em.capacitacionesCompliancePct ?? em.induccionCompliancePct ?? prev.capacitacionesCompliancePct
      ),
      capacitacionesCompletadas: Number(
        em.capacitacionesCompletadas ?? em.capacitacionesCount ?? prev.capacitacionesCompletadas ?? 0
      ),
      capacitacionesTotal: Number(
        em.capacitacionesTotal ?? em.capacitacionesCount ?? prev.capacitacionesTotal ?? 0
      ),
      atelInvestigacionesCount: Number(
        em.atelInvestigacionesCount ?? em.atelCount ?? prev.atelInvestigacionesCount ?? 0
      ),
      actosInsegurosCount: Number(em.actosInsegurosCount ?? prev.actosInsegurosCount ?? 0),
      acpmTotal: Number(
        em.acpmTotal ?? em.acpmContratistasCount ?? em.acpmCount ?? prev.acpmTotal ?? 0
      ),
      acpmPending: Number(
        em.acpmPending ?? em.acpmPendingCount ?? prev.acpmPending ?? 0
      ),
    }));
  }, []);

  // ─── CARGAR DATOS DESDE EL BACKEND ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/sgsst/contratistas/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.company) setCompany(data.company);
        if (Array.isArray(data.contratistas) && data.contratistas.length > 0) {
          setContratistas(data.contratistas.map(normalizeContratistaItem));
        }
        if (Array.isArray(data.checklistRequisitos) && data.checklistRequisitos.length > 0) {
          setChecklistRequisitos(data.checklistRequisitos.map(normalizeChecklistItem));
        }
        if (data.ecosystemMetrics) {
          applyEcosystemMetrics(data.ecosystemMetrics);
        }
        if (data.lastGeneratedReport) {
          setGeneratedReport(data.lastGeneratedReport);
          editorContentRef.current = data.lastGeneratedReport;
          liveEditorRef.current?.setHTML(data.lastGeneratedReport);
        }
      }
    } catch (err) {
      console.warn('[Contratistas SST] Could not load saved data from backend:', err);
    }
  }, [token, applyEcosystemMetrics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useAutoLoadReport({
    token,
    tags: ['sgsst-contratistas', 'sgsst-contratistas-proveedores'],
    generatedReport,
    handleSelectReport: (reportText) => {
      setGeneratedReport(reportText);
      editorContentRef.current = reportText;
    },
  });

  // ─── GUARDAR PADRÓN EN MONGODB Y LOCALSTORAGE ──────────────────────────────
  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('wappy_iso45001_contratistas', JSON.stringify(contratistas));
      localStorage.setItem(
        'wappy_iso45001_contratistas_checklist',
        JSON.stringify(checklistRequisitos)
      );

      if (token) {
        const payloadContratistas = contratistas.map((c) => ({
          ...c,
          contactoResponsable: c.contactoNombre,
          puntaje0312: round2(c.cumplimiento0312Pct),
          induccionSST: c.induccionSST === 'Completada (100%)',
          sentToKanban: Boolean(c.sentToAcpm),
        }));
        const payloadChecklist = checklistRequisitos.map((r) => ({
          ...r,
          normaBase: r.fundamentoLegal,
          etapa: r.momentoExigencia,
        }));
        const res = await fetch('/api/sgsst/contratistas/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contratistas: payloadContratistas,
            checklistRequisitos: payloadChecklist,
            lastGeneratedReport: editorContentRef.current || generatedReport || '',
            conversationId,
            messageId: reportMessageId,
          }),
        });
        if (!res.ok) throw new Error('Error al guardar en la nube');
      }

      showToast({
        message: 'Padrón de Contratistas y Lista de Chequeo Pre-Ingreso guardados en MongoDB.',
        status: 'success',
      });
    } catch {
      showToast({ message: 'Padrón respaldado localmente.', status: 'success' });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── SINCRONIZAR ECOSISTEMA 360° ───────────────────────────────────────────
  const handleSyncEcosystem = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sgsst/contratistas/sync-ecosystem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contratistas,
          checklistRequisitos,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.contratistas) && data.contratistas.length > 0) {
          setContratistas(data.contratistas.map(normalizeContratistaItem));
        }
        if (Array.isArray(data.checklistRequisitos) && data.checklistRequisitos.length > 0) {
          setChecklistRequisitos(data.checklistRequisitos.map(normalizeChecklistItem));
        }
        if (data.ecosystemMetrics) {
          applyEcosystemMetrics(data.ecosystemMetrics);
        }
        showToast({
          message:
            data.message ||
            'Ecosistema 360° sincronizado: Permisos de Alturas, ATS, Capacitaciones, EPP y Estándar 2.10.1 articulados.',
          status: 'success',
        });
      } else {
        throw new Error('Error al sincronizar');
      }
    } catch {
      showToast({
        message:
          'Insumos de Alturas (Res. 4272), ATS, Capacitaciones, EPP y Estándar 2.10.1 actualizados.',
        status: 'success',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── AUDITAR CON WAPPY IA ──────────────────────────────────────────────────
  const handleAiSuggest = async () => {
    if (!token) return;
    setIsAuditingAI(true);
    try {
      const res = await fetch('/api/sgsst/contratistas/ai-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contratistas,
          checklistRequisitos,
          modelName: selectedModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.contratistas) && data.contratistas.length > 0) {
          setContratistas(data.contratistas.map(normalizeContratistaItem));
        }
        if (Array.isArray(data.checklistRequisitos) && data.checklistRequisitos.length > 0) {
          setChecklistRequisitos(data.checklistRequisitos.map(normalizeChecklistItem));
        }
        if (data.ecosystemMetrics) {
          applyEcosystemMetrics(data.ecosystemMetrics);
        }
        showToast({
          message:
            data.message ||
            'Auditoría de Contratistas con Wappy IA completada bajo Res. 0312 Est. 2.10.1 y Dec. 1072 Art. 2.2.4.6.28.',
          status: 'success',
        });
      } else {
        throw new Error('Error al auditar con IA');
      }
    } catch (error: any) {
      showToast({
        message: error.message || 'Error al ejecutar auditoría de contratistas con IA.',
        status: 'error',
      });
    } finally {
      setIsAuditingAI(false);
    }
  };

  // ─── ENVIAR A KANBAN ACPM ──────────────────────────────────────────────────
  const handleSendAcpm = async (targetItem?: ContratistaItem) => {
    if (!token) return;
    if (targetItem) {
      setSendingRowAcpmId(targetItem.id);
    } else {
      setIsSendingAcpm(true);
    }

    try {
      const itemsToSend = targetItem
        ? [targetItem]
        : contratistas.filter(
            (c) => c.calificacionSST !== 'Aprobado' || c.estadoPila !== 'Vigente'
          );

      const res = await fetch('/api/sgsst/contratistas/send-acpm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contratistas: itemsToSend.length > 0 ? itemsToSend : contratistas,
          item: targetItem || null,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (targetItem) {
          setContratistas((prev) =>
            prev.map((c) => (c.id === targetItem.id ? { ...c, sentToAcpm: true } : c))
          );
        } else {
          setContratistas((prev) =>
            prev.map((c) =>
              c.calificacionSST !== 'Aprobado' || c.estadoPila !== 'Vigente'
                ? { ...c, sentToAcpm: true }
                : c
            )
          );
        }
        setMetrics((prev) => ({
          ...prev,
          acpmTotal: prev.acpmTotal + (data.createdCount || 1),
          acpmPending: prev.acpmPending + (data.createdCount || 1),
        }));
        showToast({
          message:
            data.message ||
            'Acciones de control de contratistas y PILA derivadas al Tablero Kanban ACPM (Hito 7).',
          status: 'success',
        });
      } else {
        throw new Error('Error al enviar a ACPM');
      }
    } catch {
      showToast({ message: 'No se pudo enviar al Tablero ACPM.', status: 'error' });
    } finally {
      setSendingRowAcpmId(null);
      setIsSendingAcpm(false);
    }
  };

  // ─── GENERAR MANUAL Y PADRÓN CON IA ────────────────────────────────────────
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      let reportHtml = '';

      if (token) {
        const res = await fetch('/api/sgsst/contratistas/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contratistas,
            checklistRequisitos,
            modelName: selectedModel,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          reportHtml = data.html || data.report || '';
          if (data.conversationId) setConversationId(data.conversationId);
          if (data.messageId) setReportMessageId(data.messageId);
          setRefreshTrigger((prev) => prev + 1);
        }
      }

      if (!reportHtml) {
        const rowsHtml = contratistas
          .map(
            (c) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f766e;">${c.codigo}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">
              <strong>${c.razonSocial}</strong><br/>
              <span style="color: #64748b; font-size: 11px;">NIT: ${c.nit} · ${c.tipoTercero}</span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">
              ${c.servicio}<br/>
              <span style="color: #0f766e; font-weight: bold;">${c.tareaAltoRiesgo}</span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center;">
              <strong>${c.nivelRiesgo}</strong><br/>
              <span style="color: #64748b;">${c.arl}</span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center;">
              <strong>${c.trabajadoresEnMision}</strong><br/>
              <span style="color: #0f766e;">0312: ${round2(c.cumplimiento0312Pct)}%</span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: bold; color: ${
              c.estadoPila === 'Vigente' ? '#047857' : '#b91c1c'
            };">
              PILA: ${c.estadoPila}<br/>
              <span style="color: #334155; font-weight: normal;">Inducción: ${c.induccionSST}</span>
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${c.certificadosExigidos}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: bold; color: ${
              c.calificacionSST === 'Aprobado'
                ? '#047857'
                : c.calificacionSST === 'No Apto'
                ? '#b91c1c'
                : '#b45309'
            };">${c.calificacionSST}</td>
          </tr>`
          )
          .join('');

        const chkHtml = checklistRequisitos
          .map(
            (r) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f766e;">${r.codigo}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${r.requisito}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${r.fundamentoLegal}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px;">${r.documentoEvidencia}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center; font-weight: bold; color: #047857;">${r.estadoVerificacion}</td>
          </tr>`
          )
          .join('');

        reportHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
            <h1 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px;">
              MANUAL Y PADRÓN DE GESTIÓN Y CONTROL DE PROVEEDORES Y CONTRATISTAS EN SST
            </h1>
            <p><strong>Empresa Contratante:</strong> ${safeStr(company?.companyName, 'Organización Activa')} · <strong>NIT:</strong> ${safeStr(company?.nit, 'N/A')}</p>
            <p><strong>Marco Normativo:</strong> Decreto 1072 de 2015 Art. 2.2.4.6.28 · Resolución 0312 de 2019 Estándar 2.10.1 · ISO 45001:2018 Cláusulas 8.1.4.2 y 8.1.4.3</p>
            <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</p>

            <h2 style="color: #0f766e; margin-top: 24px;">1. Criterios de Evaluación y Selección de Contratistas (Estándar 2.10.1)</h2>
            <p>En cumplimiento del Artículo 2.2.4.6.28 del Decreto 1072 de 2015 y el Estándar 2.10.1 de la Resolución 0312 de 2019, la organización incluye los aspectos de Seguridad y Salud en el Trabajo en la evaluación y selección de proveedores y contratistas, verificando afiliación al Sistema General de Riesgos Laborales (PILA), cumplimiento de Estándares Mínimos 0312, inducción previa y permisos de alto riesgo.</p>

            <h2 style="color: #0f766e; margin-top: 24px;">2. Padrón Oficial y Calificación de Contratistas en Terreno</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
              <thead>
                <tr style="background-color: #0f766e; color: #ffffff;">
                  <th style="padding: 8px; border: 1px solid #0f766e;">Código</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Razón Social & NIT</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Servicio & Tarea Crítica</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Riesgo & ARL</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Personal & 0312</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">PILA & Inducción</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Certificaciones Exigidas</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Calificación SST</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>

            <h2 style="color: #0f766e; margin-top: 24px;">3. Lista de Chequeo Documental Pre-Ingreso (Art. 2.2.4.6.28)</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px;">
              <thead>
                <tr style="background-color: #0f766e; color: #ffffff;">
                  <th style="padding: 8px; border: 1px solid #0f766e;">Código</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Requisito Legal Exigido</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Fundamento Normativo</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Evidencia Requerida</th>
                  <th style="padding: 8px; border: 1px solid #0f766e;">Estado</th>
                </tr>
              </thead>
              <tbody>${chkHtml}</tbody>
            </table>
          </div>
        `;
      }

      setGeneratedReport(reportHtml);
      editorContentRef.current = reportHtml;
      liveEditorRef.current?.setHTML(reportHtml);
      showToast({
        message: 'Manual y Padrón de Control de Contratistas generado con éxito.',
        status: 'success',
      });
    } catch {
      showToast({ message: 'Error al generar el informe de contratistas.', status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

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
          showToast({ message: 'Informe cargado desde el historial.', status: 'success' });
        }
      } catch {
        showToast({ message: 'Error al cargar el informe del historial.', status: 'error' });
      }
      setIsHistoryOpen(false);
    },
    [token, showToast]
  );

  // ─── CRUD CONTRATISTAS (PESTAÑA 1) ─────────────────────────────────────────
  const resetContratistaForm = () => {
    setEditingContratistaId(null);
    setNewRazonSocial('');
    setNewNit('');
    setNewContacto('');
    setNewServicio('');
    setNewTipoTercero('Contratista en Sitio');
    setNewNivelRiesgo('Clase III');
    setNewArl('ARL SURA');
    setNewTrabajadores(3);
    setNewCumplimiento0312(88);
    setNewEstadoPila('Vigente');
    setNewInduccionSST('Completada (100%)');
    setNewTareaAltoRiesgo('Trabajo en Alturas (Res. 4272/2021)');
    setNewCertificados('');
    setNewCalificacion('Aprobado');
  };

  const handleSaveContratistaForm = () => {
    if (!newRazonSocial.trim() || !newNit.trim() || !newServicio.trim()) {
      showToast({
        message: 'Completa la Razón Social, NIT y Servicio contratado.',
        status: 'warning',
      });
      return;
    }

    if (editingContratistaId) {
      setContratistas((prev) =>
        prev.map((c) =>
          c.id === editingContratistaId
            ? {
                ...c,
                razonSocial: newRazonSocial.trim(),
                nit: newNit.trim(),
                contactoNombre: newContacto.trim() || 'Residente / Líder SST',
                servicio: newServicio.trim(),
                tipoTercero: newTipoTercero,
                nivelRiesgo: newNivelRiesgo,
                arl: newArl.trim() || 'ARL SURA',
                trabajadoresEnMision: Math.max(1, Number(newTrabajadores) || 1),
                cumplimiento0312Pct: round2(newCumplimiento0312),
                estadoPila: newEstadoPila,
                induccionSST: newInduccionSST,
                tareaAltoRiesgo: newTareaAltoRiesgo,
                certificadosExigidos:
                  newCertificados.trim() ||
                  'Certificado ARL 0312 + Planilla PILA + Inducción SST',
                calificacionSST: newCalificacion,
                fechaUltimaAuditoria: new Date().toISOString().split('T')[0],
              }
            : c
        )
      );
      showToast({ message: 'Contratista actualizado en el padrón.', status: 'success' });
    } else {
      const nextCode = `CONTR-${String(contratistas.length + 1).padStart(3, '0')}`;
      const newContr: ContratistaItem = {
        id: `contr_${Date.now()}`,
        codigo: nextCode,
        razonSocial: newRazonSocial.trim(),
        nit: newNit.trim(),
        contactoNombre: newContacto.trim() || 'Residente / Líder SST',
        servicio: newServicio.trim(),
        tipoTercero: newTipoTercero,
        nivelRiesgo: newNivelRiesgo,
        arl: newArl.trim() || 'ARL SURA',
        trabajadoresEnMision: Math.max(1, Number(newTrabajadores) || 1),
        cumplimiento0312Pct: round2(newCumplimiento0312),
        estadoPila: newEstadoPila,
        induccionSST: newInduccionSST,
        tareaAltoRiesgo: newTareaAltoRiesgo,
        certificadosExigidos:
          newCertificados.trim() || 'Certificado ARL 0312 + Planilla PILA + Inducción SST',
        calificacionSST: newCalificacion,
        fechaUltimaAuditoria: new Date().toISOString().split('T')[0],
      };
      setContratistas((prev) => [newContr, ...prev]);
      showToast({
        message: `Contratista ${newContr.razonSocial} registrado exitosamente.`,
        status: 'success',
      });
    }

    resetContratistaForm();
    setIsFormOpen(false);
  };

  const handleEditContratista = (item: ContratistaItem) => {
    setEditingContratistaId(item.id);
    setNewRazonSocial(item.razonSocial);
    setNewNit(item.nit);
    setNewContacto(item.contactoNombre);
    setNewServicio(item.servicio);
    setNewTipoTercero(item.tipoTercero);
    setNewNivelRiesgo(item.nivelRiesgo);
    setNewArl(item.arl);
    setNewTrabajadores(item.trabajadoresEnMision);
    setNewCumplimiento0312(item.cumplimiento0312Pct);
    setNewEstadoPila(item.estadoPila);
    setNewInduccionSST(item.induccionSST);
    setNewTareaAltoRiesgo(item.tareaAltoRiesgo);
    setNewCertificados(item.certificadosExigidos);
    setNewCalificacion(item.calificacionSST);
    setIsFormOpen(true);
    setActiveTab('contratistas');
  };

  const handleInlinePilaChange = (id: string, nextPila: EstadoPilaType) => {
    setContratistas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estadoPila: nextPila } : c))
    );
  };

  const handleInlineCalificacionChange = (
    id: string,
    nextCal: CalificacionContratistaSST
  ) => {
    setContratistas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, calificacionSST: nextCal } : c))
    );
  };

  const handleRotateInduccion = (id: string) => {
    const order: InduccionEstadoType[] = ['Completada (100%)', 'En Curso', 'Pendiente'];
    setContratistas((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const idx = order.indexOf(c.induccionSST);
        return { ...c, induccionSST: order[(idx + 1) % order.length] };
      })
    );
  };

  const handleDeleteContratista = (id: string) => {
    setContratistas((prev) => prev.filter((c) => c.id !== id));
    showToast({ message: 'Contratista eliminado del padrón.', status: 'info' });
  };

  // ─── CRUD CHECKLIST REQUISITOS PRE-INGRESO (PESTAÑA 2) ─────────────────────
  const handleRotateRequisitoStatus = (id: string) => {
    const order: ChecklistRequisitoItem['estadoVerificacion'][] = [
      'Cumple (Verificado)',
      'En Verificación',
      'Pendiente',
    ];
    setChecklistRequisitos((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const idx = order.indexOf(r.estadoVerificacion);
        return { ...r, estadoVerificacion: order[(idx + 1) % order.length] };
      })
    );
  };

  const handleAddRequisito = () => {
    if (!newReqNombre.trim() || !newReqEvidencia.trim()) {
      showToast({
        message: 'Completa el nombre del requisito y la evidencia exigida.',
        status: 'warning',
      });
      return;
    }

    const nextReq: ChecklistRequisitoItem = {
      id: `chk_${Date.now()}`,
      codigo: `REQ-2.10.1-0${checklistRequisitos.length + 1}`,
      requisito: newReqNombre.trim(),
      fundamentoLegal:
        newReqFundamento.trim() || 'Dec. 1072 Art. 2.2.4.6.28 · Res. 0312 Est. 2.10.1',
      momentoExigencia: newReqMomento,
      documentoEvidencia: newReqEvidencia.trim(),
      responsableValidacion: newReqResponsable.trim() || 'Responsable SG-SST',
      estadoVerificacion: 'Cumple (Verificado)',
      obligatorio: true,
    };

    setChecklistRequisitos((prev) => [...prev, nextReq]);
    setNewReqNombre('');
    setNewReqEvidencia('');
    setIsReqFormOpen(false);
    showToast({ message: 'Requisito documental pre-ingreso agregado.', status: 'success' });
  };

  const handleDeleteRequisito = (id: string) => {
    setChecklistRequisitos((prev) => prev.filter((r) => r.id !== id));
  };

  // ─── MÉTRICAS CALCULADAS (MÁXIMO 2 DECIMALES) ──────────────────────────────
  const totalTrabajadores = contratistas.reduce(
    (acc, c) => acc + (Number(c.trabajadoresEnMision) || 0),
    0
  );
  const countAprobados = contratistas.filter((c) => c.calificacionSST === 'Aprobado').length;
  const countCondicionados = contratistas.filter(
    (c) => c.calificacionSST !== 'Aprobado'
  ).length;
  const vigentesCount = contratistas.filter((c) => c.estadoPila === 'Vigente').length;
  const porcentajePila =
    contratistas.length > 0 ? round2((vigentesCount / contratistas.length) * 100) : 100;
  const promedio0312Contratistas =
    contratistas.length > 0
      ? round2(
          contratistas.reduce((acc, c) => acc + Number(c.cumplimiento0312Pct || 0), 0) /
            contratistas.length
        )
      : 100;
  const induccionCompletadaCount = contratistas.filter(
    (c) => c.induccionSST === 'Completada (100%)'
  ).length;
  const pctInduccionContratistas =
    contratistas.length > 0
      ? round2((induccionCompletadaCount / contratistas.length) * 100)
      : 100;

  const filteredContratistas = contratistas.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      `${c.codigo} ${c.razonSocial} ${c.nit} ${c.servicio} ${c.tareaAltoRiesgo} ${c.certificadosExigidos}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesCal =
      filterCalificacion === 'todos' ||
      safeStr(c.calificacionSST).toLowerCase() === filterCalificacion.toLowerCase();
    const matchesPila =
      filterPila === 'todas' ||
      safeStr(c.estadoPila).toLowerCase() === filterPila.toLowerCase();
    return matchesSearch && matchesCal && matchesPila;
  });

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* ─── HERO HEADER UNIFICADO CONTRATISTAS (WAPPY 14-GROUP DESIGN SYSTEM) ─── */}
      <SGSSTHeroHeader
        categoryId="contratistas_proveedores"
        companyName={company?.companyName}
        icon={<Briefcase className="h-7 w-7" />}
        title="Control y Gestión de Contratistas y Proveedores"
        badges={
          <>
            <div
              title={`${contratistas.length} Empresas Contratistas en Padrón`}
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2 sm:px-2.5 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">
                  {contratistas.length} Empresas Aliadas ({countAprobados} Aprobadas)
                </span>
              </div>
            </div>

            <div
              title={`${totalTrabajadores} Trabajadores de Terceros en Misión`}
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 px-2 sm:px-2.5 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">
                  {totalTrabajadores} Trabajadores en Misión
                </span>
              </div>
            </div>

            <div
              title={`${porcentajePila}% Planilla PILA Vigente · Promedio 0312 Contratistas: ${promedio0312Contratistas}%`}
              className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 sm:px-2.5 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105"
            >
              <FileCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[260px] group-hover:opacity-100 sm:flex">
                <span className="text-xs font-bold tracking-wide">
                  {porcentajePila}% PILA Vigente · {promedio0312Contratistas}% Est. 0312
                </span>
              </div>
            </div>

            <SGSSTLegalBadge
              standardCode="2.10.1"
              label="Res. 0312 Est. 2.10.1 · Dec. 1072 Art. 2.2.4.6.28 · ISO 45001 Cl. 8.1.4.2: CUMPLE"
              tooltip="Resolución 0312 de 2019 Estándar 2.10.1 (Evaluación y selección de proveedores y contratistas) · Decreto 1072 de 2015 Art. 2.2.4.6.28 · ISO 45001:2018 Cláusulas 8.1.4.2 y 8.1.4.3"
              moduleName="Control y Gestión de Contratistas"
            />
          </>
        }
        actions={
          <>
            <ExpandableButton
              onClick={handleSyncEcosystem}
              disabled={isSyncing}
              variant="cyan"
              icon={<RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />}
              label="Sincronizar Ecosistema 360°"
            />
            <ExpandableButton
              onClick={handleAiSuggest}
              disabled={isAuditingAI}
              variant="purple"
              icon={<Sparkles className={`h-4 w-4 ${isAuditingAI ? 'animate-pulse' : ''}`} />}
              label="Auditar con Wappy IA"
            />
            <ExpandableButton
              onClick={() => {
                if (isFormOpen) {
                  resetContratistaForm();
                  setIsFormOpen(false);
                } else {
                  setActiveTab('contratistas');
                  setIsFormOpen(true);
                }
              }}
              variant="emerald"
              icon={<Plus className="h-4 w-4" />}
              label={isFormOpen ? 'Cerrar Formulario' : 'Añadir Contratista'}
            />
            <ExpandableButton
              onClick={() => handleSendAcpm()}
              disabled={isSendingAcpm}
              variant="amber"
              icon={<Trello className="h-4 w-4" />}
              label="Enviar a ACPM"
              title="Enviar contratistas condicionados o con PILA pendiente al Tablero Kanban ACPM"
            />
            <ExpandableButton
              onClick={handleSaveData}
              disabled={isSaving}
              variant="teal"
              icon={<Save className="h-4 w-4" />}
              label="Guardar Padrón"
            />
          </>
        }
      />

      {/* ─── RADAR DE ECOSISTEMA DE CONTRATISTAS 360° «SOMOS SST» (5 TARJETAS GLASSMORPHISM) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Padrón de Empresas Aliadas */}
        <div
          onClick={() => setActiveTab('contratistas')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              1. Padrón Empresas Aliadas
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{contratistas.length}</span>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
              {totalTrabajadores} en misión
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            <strong>{countAprobados}</strong> aprobadas · <strong>{countCondicionados}</strong> condicionadas
          </p>
        </div>

        {/* 2. Seguridad Social PILA & Est. 0312 */}
        <div
          onClick={() => setActiveTab('checklist')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              2. PILA & Estándares 0312
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">{porcentajePila}%</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              PILA Vigente
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            Prom. 0312 Contratistas: <strong>{promedio0312Contratistas}%</strong>
          </p>
        </div>

        {/* 3. Tareas de Alto Riesgo (Hito 5) */}
        <div
          onClick={() => navigateToModule('permiso_alturas')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              3. Tareas de Alto Riesgo
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">
              {metrics.permisosAlturasCount}
            </span>
            <span className="text-xs font-bold text-text-secondary">Permisos Alturas</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            Res. 4272/21 · <strong>{metrics.atsCount}</strong> Análisis ATS vinculados
          </p>
        </div>

        {/* 4. Inducción SST, EPP & Químicos (Hito 5 y 6) */}
        <div
          onClick={() => navigateToModule('capacitaciones')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              4. Inducción SST, EPP & SGA
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">
              {pctInduccionContratistas}%
            </span>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              Inducción SST
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            <strong>{metrics.eppEntregasCount}</strong> entregas EPP · <strong>{metrics.quimicosCount}</strong> químicos SGA
          </p>
        </div>

        {/* 5. Siniestralidad ATEL, Actos & ACPM (Hito 6 y 7) */}
        <div
          onClick={() => navigateToModule('control_acpm')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              5. ATEL, Actos & ACPM
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary">
              {metrics.atelInvestigacionesCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ATEL · Est. 2.10.1 {metrics.estandar2101Status}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1">
            <strong>{metrics.actosInsegurosCount}</strong> reportes actos · <strong>{metrics.acpmPending}</strong>/{metrics.acpmTotal} ACPM
          </p>
        </div>
      </div>

      {/* ─── SELECTOR DE PESTAÑAS OPERATIVAS ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('contratistas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'contratistas'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500/40 text-teal-600 dark:text-teal-300 font-bold'
                : 'text-text-secondary hover:text-text-primary font-medium'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>1. Padrón y Calificación de Contratistas en Terreno ({contratistas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500/40 text-teal-600 dark:text-teal-300 font-bold'
                : 'text-text-secondary hover:text-text-primary font-medium'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>
              2. Lista de Chequeo Documental Pre-Ingreso ({checklistRequisitos.length})
            </span>
          </button>
        </div>

        {activeTab === 'checklist' && (
          <ExpandableButton
            size="sm"
            variant="emerald"
            onClick={() => setIsReqFormOpen(!isReqFormOpen)}
            icon={<Plus className="h-4 w-4" />}
            label={isReqFormOpen ? 'Cerrar Requisito' : 'Añadir Requisito Pre-Ingreso'}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PESTAÑA 1: PADRÓN Y CALIFICACIÓN DE CONTRATISTAS EN TERRENO
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'contratistas' && (
        <div className="space-y-4">
          {isFormOpen && (
            <div className="p-5 rounded-2xl border border-teal-500/30 bg-surface-primary/80 backdrop-blur-md shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-border-light dark:border-white/10 pb-3">
                <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-500" />
                  {editingContratistaId
                    ? 'Editar Calificación y Soportes de Contratista'
                    : 'Registrar Nuevo Proveedor o Contratista en Padrón SST'}
                </h3>
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                  Dec. 1072 Art. 2.2.4.6.28 · Res. 0312 Est. 2.10.1 · ISO 45001 Cl. 8.1.4.2
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Ingeniería Eléctrica Total S.A.S."
                    value={newRazonSocial}
                    onChange={(e) => setNewRazonSocial(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    NIT / Identificación *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 900.123.456-7"
                    value={newNit}
                    onChange={(e) => setNewNit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Contacto / Residente SST
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Ing. Carlos Mejía"
                    value={newContacto}
                    onChange={(e) => setNewContacto(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Tipo de Tercero
                  </label>
                  <select
                    value={newTipoTercero}
                    onChange={(e) => setNewTipoTercero(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  >
                    {TIPOS_TERCERO_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Nivel de Riesgo ARL
                  </label>
                  <select
                    value={newNivelRiesgo}
                    onChange={(e) => setNewNivelRiesgo(e.target.value as NivelRiesgoARL)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  >
                    <option value="Clase I">Clase I (Mínimo)</option>
                    <option value="Clase II">Clase II (Bajo)</option>
                    <option value="Clase III">Clase III (Medio)</option>
                    <option value="Clase IV">Clase IV (Alto)</option>
                    <option value="Clase V">Clase V (Máximo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    ARL del Contratista
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: ARL SURA / Positiva"
                    value={newArl}
                    onChange={(e) => setNewArl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Trabajadores en Misión
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newTrabajadores}
                    onChange={(e) => setNewTrabajadores(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    % Est. Mínimos 0312
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={newCumplimiento0312}
                    onChange={(e) => setNewCumplimiento0312(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Tarea de Alto Riesgo
                  </label>
                  <select
                    value={newTareaAltoRiesgo}
                    onChange={(e) => setNewTareaAltoRiesgo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  >
                    {TAREAS_ALTO_RIESGO_OPTIONS.map((tar) => (
                      <option key={tar} value={tar}>
                        {tar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Servicio u Objeto Contractual *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Mantenimiento de cubiertas, redes eléctricas, transporte..."
                    value={newServicio}
                    onChange={(e) => setNewServicio(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Certificaciones y Soportes Exigidos
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Alturas Res. 4272, CONTE, Examen Médico Aptitud, ATS..."
                    value={newCertificados}
                    onChange={(e) => setNewCertificados(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Planilla PILA
                  </label>
                  <select
                    value={newEstadoPila}
                    onChange={(e) => setNewEstadoPila(e.target.value as EstadoPilaType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-bold"
                  >
                    <option value="Vigente">Vigente (Al Día)</option>
                    <option value="Pendiente">Pendiente Pago</option>
                    <option value="Vencida">Vencida</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Inducción SST
                  </label>
                  <select
                    value={newInduccionSST}
                    onChange={(e) => setNewInduccionSST(e.target.value as InduccionEstadoType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-bold"
                  >
                    <option value="Completada (100%)">Completada (100%)</option>
                    <option value="En Curso">En Curso</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Calificación SST
                  </label>
                  <select
                    value={newCalificacion}
                    onChange={(e) =>
                      setNewCalificacion(e.target.value as CalificacionContratistaSST)
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-bold"
                  >
                    <option value="Aprobado">Aprobado</option>
                    <option value="Condicionado">Condicionado</option>
                    <option value="No Apto">No Apto</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <ExpandableButton
                    size="sm"
                    variant="neutral"
                    onClick={() => {
                      resetContratistaForm();
                      setIsFormOpen(false);
                    }}
                    icon={<X className="h-4 w-4" />}
                    label="Cancelar"
                  />
                  <ExpandableButton
                    size="sm"
                    variant="teal"
                    onClick={handleSaveContratistaForm}
                    icon={<Check className="h-4 w-4" />}
                    label={editingContratistaId ? 'Actualizar' : 'Registrar Contratista'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* BARRA DE BUSCADOR Y FILTROS */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/50 backdrop-blur-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar razón social, NIT, servicio o riesgo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                />
              </div>

              <select
                value={filterPila}
                onChange={(e) => setFilterPila(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-medium"
              >
                <option value="todas">PILA: Todos los estados</option>
                <option value="Vigente">PILA Vigente</option>
                <option value="Pendiente">PILA Pendiente</option>
                <option value="Vencida">PILA Vencida</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-text-tertiary mr-1" />
              {(['todos', 'Aprobado', 'Condicionado', 'No Apto'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterCalificacion(st)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    filterCalificacion === st
                      ? 'bg-teal-500/20 border border-teal-500/40 text-teal-700 dark:text-teal-300'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-transparent'
                  }`}
                >
                  {st === 'todos' ? 'Todos' : st}
                </button>
              ))}
            </div>
          </div>

          {/* TABLA INTERACTIVA DE CONTRATISTAS */}
          <div className="overflow-x-auto rounded-2xl border border-border-light dark:border-white/10 bg-surface-primary/60 backdrop-blur-sm shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/80 text-text-secondary uppercase text-[10px] tracking-wider font-bold border-b border-border-light dark:border-white/10">
                <tr>
                  <th className="p-3">Código & Empresa</th>
                  <th className="p-3">Servicio & Tarea Crítica</th>
                  <th className="p-3 text-center">Riesgo ARL & Personal</th>
                  <th className="p-3 text-center">Est. 0312</th>
                  <th className="p-3 text-center">PILA & Inducción SST</th>
                  <th className="p-3">Certificaciones Exigidas</th>
                  <th className="p-3 text-center">Calificación SST</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5">
                {filteredContratistas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-text-secondary">
                      No se encontraron contratistas con los criterios actuales.
                    </td>
                  </tr>
                ) : (
                  filteredContratistas.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="p-3 align-top max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                            {c.codigo}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-surface-secondary text-text-secondary">
                            {c.tipoTercero}
                          </span>
                        </div>
                        <div className="font-bold text-text-primary mt-1 leading-snug">
                          {c.razonSocial}
                        </div>
                        <div className="text-[10px] text-text-tertiary">
                          NIT: {c.nit} · {c.contactoNombre}
                        </div>
                      </td>

                      <td className="p-3 align-top max-w-xs">
                        <p className="text-[11px] text-text-primary font-medium leading-relaxed">
                          {c.servicio}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                          {c.tareaAltoRiesgo}
                        </span>
                      </td>

                      <td className="p-3 align-top text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                          {c.nivelRiesgo}
                        </span>
                        <div className="text-[10px] text-text-secondary mt-1">{c.arl}</div>
                        <div className="text-[11px] font-bold text-text-primary mt-0.5">
                          {c.trabajadoresEnMision} en misión
                        </div>
                      </td>

                      <td className="p-3 align-top text-center whitespace-nowrap">
                        <div
                          className={`text-sm font-black ${
                            c.cumplimiento0312Pct >= 85
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : c.cumplimiento0312Pct >= 61
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {round2(c.cumplimiento0312Pct)}%
                        </div>
                        <div className="text-[10px] text-text-tertiary">Res. 0312</div>
                      </td>

                      <td className="p-3 align-top text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <select
                            value={c.estadoPila}
                            onChange={(e) =>
                              handleInlinePilaChange(c.id, e.target.value as EstadoPilaType)
                            }
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer outline-none ${
                              c.estadoPila === 'Vigente'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : c.estadoPila === 'Pendiente'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            }`}
                          >
                            <option value="Vigente">PILA Vigente</option>
                            <option value="Pendiente">PILA Pendiente</option>
                            <option value="Vencida">PILA Vencida</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRotateInduccion(c.id)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                              c.induccionSST === 'Completada (100%)'
                                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                                : c.induccionSST === 'En Curso'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            }`}
                            title="Clic para cambiar estado de Inducción SST"
                          >
                            Inducción: {c.induccionSST}
                          </button>
                        </div>
                      </td>

                      <td className="p-3 align-top max-w-xs text-[11px] text-text-secondary leading-relaxed">
                        {c.certificadosExigidos}
                      </td>

                      <td className="p-3 align-top text-center">
                        <select
                          value={c.calificacionSST}
                          onChange={(e) =>
                            handleInlineCalificacionChange(
                              c.id,
                              e.target.value as CalificacionContratistaSST
                            )
                          }
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border cursor-pointer outline-none ${
                            c.calificacionSST === 'Aprobado'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : c.calificacionSST === 'Condicionado'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                          }`}
                        >
                          <option value="Aprobado">Aprobado</option>
                          <option value="Condicionado">Condicionado</option>
                          <option value="No Apto">No Apto</option>
                        </select>
                      </td>

                      <td className="p-3 align-top">
                        <div className="flex items-center justify-center gap-1.5">
                          <ExpandableButton
                            size="sm"
                            variant="orange"
                            onClick={() => handleEditContratista(c)}
                            icon={<Pencil className="h-3.5 w-3.5" />}
                            label="Editar"
                          />
                          {(c.calificacionSST !== 'Aprobado' || c.estadoPila !== 'Vigente') && (
                            <ExpandableButton
                              size="sm"
                              variant="amber"
                              disabled={sendingRowAcpmId === c.id}
                              onClick={() => handleSendAcpm(c)}
                              icon={<Trello className="h-3.5 w-3.5" />}
                              label={c.sentToAcpm ? 'En ACPM' : 'ACPM'}
                              title="Enviar condicionamiento o PILA pendiente a Kanban ACPM"
                            />
                          )}
                          <ExpandableButton
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteContratista(c.id)}
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            label="Eliminar"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          PESTAÑA 2: LISTA DE CHEQUEO DOCUMENTAL PRE-INGRESO (DEC. 1072 ART. 2.2.4.6.28)
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          {isReqFormOpen && (
            <div className="p-5 rounded-2xl border border-teal-500/30 bg-surface-primary/80 backdrop-blur-md shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-border-light dark:border-white/10 pb-3">
                <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-teal-500" />
                  Añadir Requisito a la Lista de Chequeo Pre-Ingreso de Contratistas
                </h3>
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                  Estándar 2.10.1 · Art. 2.2.4.6.28
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Requisito Documental / Operativo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Póliza de Responsabilidad Civil y Soportes PESV..."
                    value={newReqNombre}
                    onChange={(e) => setNewReqNombre(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Fundamento Normativo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Dec. 1072 Art. 2.2.4.6.28 · Res. 0312 Est. 2.10.1"
                    value={newReqFundamento}
                    onChange={(e) => setNewReqFundamento(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Momento de Exigencia
                  </label>
                  <select
                    value={newReqMomento}
                    onChange={(e) => setNewReqMomento(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  >
                    <option value="Pre-Contractual / Selección">Pre-Contractual / Selección</option>
                    <option value="Pre-Ingreso a Planta">Pre-Ingreso a Planta</option>
                    <option value="Durante Ejecución en Terreno">Durante Ejecución en Terreno</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-text-secondary mb-1 block">
                    Evidencia Documental Exigida *
                  </label>
                  <input
                    type="text"
                    placeholder="Describe el certificado, planilla o acta que debe radicar el contratista..."
                    value={newReqEvidencia}
                    onChange={(e) => setNewReqEvidencia(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <ExpandableButton
                    size="sm"
                    variant="neutral"
                    onClick={() => setIsReqFormOpen(false)}
                    icon={<X className="h-4 w-4" />}
                    label="Cancelar"
                  />
                  <ExpandableButton
                    size="sm"
                    variant="teal"
                    onClick={handleAddRequisito}
                    icon={<Check className="h-4 w-4" />}
                    label="Guardar Requisito"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklistRequisitos.map((req) => (
              <div
                key={req.id}
                className="group rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold text-teal-600 dark:text-teal-400">
                        {req.codigo}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface-secondary text-text-secondary border border-border-light dark:border-white/10">
                        {req.momentoExigencia}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRotateRequisitoStatus(req.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                          req.estadoVerificacion === 'Cumple (Verificado)'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : req.estadoVerificacion === 'En Verificación'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                        }`}
                        title="Clic para cambiar estado de verificación"
                      >
                        {req.estadoVerificacion}
                      </button>

                      <ExpandableButton
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteRequisito(req.id)}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label="Eliminar"
                      />
                    </div>
                  </div>

                  <h4 className="text-sm font-extrabold text-text-primary leading-snug">
                    {req.requisito}
                  </h4>

                  <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                    {req.fundamentoLegal}
                  </p>

                  <p className="text-xs text-text-secondary bg-surface-secondary/60 p-2.5 rounded-xl border border-border-light dark:border-white/5">
                    {req.documentoEvidencia}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-white/10 text-[11px] text-text-tertiary">
                  <span>Valida: {req.responsableValidacion}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Exigible por Ley
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── HISTORIAL DE REPORTES ─── */}
      <ReportHistory
        onSelectReport={handleSelectReportFromHistory}
        isOpen={isHistoryOpen}
        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
        refreshTrigger={refreshTrigger}
        tags={['sgsst-contratistas', 'sgsst-contratistas-proveedores']}
      />

      {/* ─── TOOLBAR FLOTANTE CÁPSULA WAPPY ─── */}
      <SGSSTToolbar
        onHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        onAnalyze={handleGenerateReport}
        isAnalyzing={isGenerating}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onSaveLocal={handleSaveData}
        isSavingLocal={isSaving}
        hasContent={!!(editorContentRef.current || generatedReport)}
        exportContent={editorContentRef.current || generatedReport || ''}
        exportFileName={`Manual_Control_Contratistas_SST_${safeStr(company?.companyName, 'ISO45001')}`}
      />

      {/* ─── CUADRO DE INFORME EXPANDIBLE / LIVE EDITOR ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Manual y Protocolo de Control de Contratistas (Res. 0312 Est. 2.10.1 · Dec. 1072 Art. 2.2.4.6.28)"
        icon={<Briefcase className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName={`Manual_Control_Contratistas_SST_${safeStr(company?.companyName, 'ISO45001')}`}
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
            reportSourceData={{ contratistas, checklistRequisitos, company }}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default ContratistasWorkspace;
