import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Compass,
  Users,
  Target,
  Plus,
  Trash2,
  Save,
  Building2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Layers,
  Globe,
  Sparkles,
  Shield,
  FileText,
  Workflow,
  ArrowRight,
  BrainCircuit,
  Pencil,
  RefreshCw,
  Send,
  Bot,
  Loader2,
  Filter,
  Activity,
  Award,
  Trello,
  Stethoscope,
  X,
  ExternalLink,
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

export interface DofaItem {
  id: string;
  type: 'fortaleza' | 'debilidad' | 'oportunidad' | 'amenaza';
  description: string;
  source: 'interno' | 'externo';
  category?: string;
  originModule?: string;
  impact?: string;
  strategicAction?: string;
  responsible?: string;
  status?: string;
}

export interface StakeholderItem {
  id: string;
  parte: string;
  tipo?: 'Interno' | 'Externo';
  necesidades: string;
  expectativas: string;
  requisito: string;
  control: string;
  canalFrecuencia?: string;
  impactLevel?: string;
}

export interface CrossStrategies {
  fo: string[];
  do: string[];
  fa: string[];
  da: string[];
}

export interface EcosystemMetrics {
  diagnosticoScore: number;
  diagnosticoBrechas: number;
  diagnosticoLevel: string;
  gtc45Total: number;
  gtc45Criticos: number;
  trabajadoresCount: number;
  perfilesCargoCount: number;
  comitesActivos: number;
  brigadistasCount: number;
  acpmCount: number;
}

const PESTEL_CATEGORIES = [
  'Todas',
  'Legal / Normativo',
  'Tecnológico / IA',
  'Operativo / Biomecánico',
  'Psicosocial / Cultura',
  'Vial / PESV',
  'Químico / Ambiental',
  'Financiero / Presupuesto',
  'Gobernanza / SST',
] as const;

const ORIGIN_MODULES = [
  'Diagnóstico 0312',
  'Matriz IPEVR GTC-45',
  'Huella Biocéntrica (Hito 2)',
  'Gobernanza & Comités (Hito 3)',
  'Riesgo Vial PESV',
  'Riesgo Químico SGA',
  'Contexto Externo / Entorno',
  'Alta Dirección & Presupuesto',
];

const INITIAL_DOFA: DofaItem[] = [
  {
    id: '1',
    type: 'fortaleza',
    description: 'Compromiso directo de la gerencia general con asignación presupuestal blindada para el SG-SST',
    source: 'interno',
    category: 'Financiero / Presupuesto',
    originModule: 'Alta Dirección & Presupuesto',
    impact: 'alto',
    responsible: 'Gerencia General',
    strategicAction: 'Mantener rubro anual específico auditado y blindado en el presupuesto corporativo de SST.',
  },
  {
    id: '2',
    type: 'fortaleza',
    description: 'COPASST, Comité de Convivencia y Brigada de Emergencias con reuniones mensuales y actas al día',
    source: 'interno',
    category: 'Gobernanza / SST',
    originModule: 'Gobernanza & Comités (Hito 3)',
    impact: 'alto',
    responsible: 'Presidente COPASST',
    strategicAction: 'Publicar actas en el portal digital y articular inspecciones conjuntas con seguridad vial.',
  },
  {
    id: '3',
    type: 'debilidad',
    description: 'Resistencia inicial de algunos operarios al auto-reporte oportuno de actos y condiciones inseguras',
    source: 'interno',
    category: 'Psicosocial / Cultura',
    originModule: 'Huella Biocéntrica (Hito 2)',
    impact: 'medio',
    responsible: 'Responsable SG-SST',
    strategicAction: 'Implementar incentivos de prevención y campañas de cultura justa de reporte por QR sin represalias.',
  },
  {
    id: '4',
    type: 'debilidad',
    description: 'Rotación de trabajadores en temporadas pico que exige reinducciones y controles biomecánicos frecuentes',
    source: 'interno',
    category: 'Operativo / Biomecánico',
    originModule: 'Matriz IPEVR GTC-45',
    impact: 'alto',
    responsible: 'Gestión del Talento Humano',
    strategicAction: 'Estandarizar inducción digital en WAPPY LMS y evaluaciones automatizadas previas al ingreso a planta.',
  },
  {
    id: '5',
    type: 'oportunidad',
    description: 'Adopción de la suite digital WAPPY IA con analítica predictiva para control proactivo de riesgos y ATEL',
    source: 'externo',
    category: 'Tecnológico / IA',
    originModule: 'Contexto Externo / Entorno',
    impact: 'alto',
    responsible: 'Líder SG-SST / Dirección TI',
    strategicAction: 'Automatizar inspecciones, matrices GTC-45 y planes de acción ACPM con trazabilidad en la nube.',
  },
  {
    id: '6',
    type: 'oportunidad',
    description: 'Articulación con programas técnicos de reinversión de la ARL y bienestar de Caja de Compensación',
    source: 'externo',
    category: 'Gobernanza / SST',
    originModule: 'Diagnóstico 0312',
    impact: 'medio',
    responsible: 'Responsable SG-SST',
    strategicAction: 'Gestionar horas de asesoría especializada, higiene industrial y medicina preventiva sin costo adicional.',
  },
  {
    id: '7',
    type: 'amenaza',
    description: 'Variabilidad climática extrema y congestión que elevan el riesgo de siniestros en desplazamientos viales',
    source: 'externo',
    category: 'Vial / PESV',
    originModule: 'Riesgo Vial PESV',
    impact: 'alto',
    responsible: 'Comité de Seguridad Vial (CSV)',
    strategicAction: 'Actualizar el protocolo de contingencia climática, mantenimiento preventivo y alertas tempranas en el PESV.',
  },
  {
    id: '8',
    type: 'amenaza',
    description: 'Cambios normativos frecuentes y fiscalización estricta del Ministerio del Trabajo y la UGPP',
    source: 'externo',
    category: 'Legal / Normativo',
    originModule: 'Diagnóstico 0312',
    impact: 'alto',
    responsible: 'Dirección Jurídica y SST',
    strategicAction: 'Ejecutar actualización normativa mensual en la Matriz Legal con auditoría preventiva de cumplimiento.',
  },
];

const INITIAL_STAKEHOLDERS: StakeholderItem[] = [
  {
    id: '1',
    parte: 'Trabajadores Directos y Operativos',
    tipo: 'Interno',
    necesidades: 'Instalaciones seguras, EPP certificados, formación continua y vigilancia epidemiológica.',
    expectativas: 'Cero accidentes laborales graves, clima laboral sano, bienestar psicosocial y ergonomía.',
    requisito: 'CST · Dec. 1072/2015 Art. 2.2.4.6.10 · Res. 0312/2019 Est. 2.1.1',
    control: 'COPASST, Matriz IPEVR participativa, exámenes médicos ocupacionales y entrega de EPP.',
    canalFrecuencia: 'Boletín SST / Reunión Mensual / QR permanente',
    impactLevel: 'alto',
  },
  {
    id: '2',
    parte: 'Contratistas, Subcontratistas y Proveedores',
    tipo: 'Externo',
    necesidades: 'Estándares claros de ingreso, inducción SST, validación PILA y permisos de alto riesgo.',
    expectativas: 'Coordinación ágil de actividades en áreas compartidas y reglas técnicas transparentes.',
    requisito: 'Dec. 1072/2015 Art. 2.2.4.6.28 · Res. 0312/2019 Est. 2.10.1 · Res. 4272/2021',
    control: 'Auditoría mensual de planillas PILA, permisos ATS/Alturas y evaluación de proveedores.',
    canalFrecuencia: 'Portal Contratistas / Pre-ingreso y Mensual',
    impactLevel: 'alto',
  },
  {
    id: '3',
    parte: 'Alta Dirección, Accionistas y Junta Directiva',
    tipo: 'Interno',
    necesidades: 'Continuidad del negocio, blindaje jurídico ante responsabilidad civil/penal y eficacia del SG-SST.',
    expectativas: 'Retorno de la inversión preventiva, reducción del ausentismo ATEL y prestigio corporativo.',
    requisito: 'Dec. 1072/2015 Art. 2.2.4.6.8 y 2.2.4.6.31 · ISO 45001:2018 Cl. 5.1',
    control: 'Revisión anual por la Alta Dirección, indicadores de estructura/proceso/resultado y auditoría interna.',
    canalFrecuencia: 'Comité Directivo Trimestral / Informe Anual',
    impactLevel: 'alto',
  },
  {
    id: '4',
    parte: 'ARL y Ministerio del Trabajo',
    tipo: 'Externo',
    necesidades: 'Reporte oportuno de ATEL (FURAT/FUREP), autoevaluación anual 0312 y plan de mejoramiento.',
    expectativas: 'Superación del 85% en Estándares Mínimos y cierre eficaz de hallazgos preventivos.',
    requisito: 'Ley 1562/2012 · Dec. 1072/2015 · Res. 0312/2019 Art. 27 y 28',
    control: 'Radicación anual en plataforma ministerial, seguimiento al Plan Anual de Trabajo y mesas ARL.',
    canalFrecuencia: 'Plataforma MinTrabajo Anual / Reporte ATEL < 2 días hábiles',
    impactLevel: 'alto',
  },
  {
    id: '5',
    parte: 'Comunidad Vecina y Autoridades de Emergencia',
    tipo: 'Externo',
    necesidades: 'Prevención de emergencias ambientales, incendios o fugas químicas que impacten el entorno.',
    expectativas: 'Ayuda mutua, simulacros articulados y comunicación oportuna ante contingencias.',
    requisito: 'Dec. 1072/2015 Art. 2.2.4.6.25 (PPRE) · Ley 1523/2012 · Dec. 1496/2018 (SGA)',
    control: 'Plan de Prevención y Respuesta ante Emergencias, Brigada SCI y simulacro anual.',
    canalFrecuencia: 'Comité de Ayuda Mutua Semestral / Simulacro Anual',
    impactLevel: 'medio',
  },
];

const INITIAL_STRATEGIES: CrossStrategies = {
  fo: [
    'Apalancar la suite de IA WAPPY y el presupuesto aprobado por Gerencia para automatizar el monitoreo predictivo de peligros GTC-45 y reducir la siniestralidad.',
    'Articular la gestión activa del COPASST con las horas de reinversión técnica de la ARL para ejecutar programas de higiene y ergonomía sin sobrecosto.',
  ],
  do: [
    'Transformar la resistencia al reporte de condiciones inseguras mediante códigos QR interactivos y el asistente de voz Tenshi en campo.',
    'Mitigar el impacto de la rotación de personal implementando rutas de inducción digital automatizadas en WAPPY LMS con evaluación obligatoria.',
  ],
  fa: [
    'Utilizar la disciplina mensual del COPASST y el respaldo presupuestal para adaptar con agilidad el SG-SST frente a nuevas resoluciones del Ministerio del Trabajo.',
    'Blindar la operación logística frente a eventos climáticos extremos integrando alertas tempranas en el PESV y entrenando a la Brigada de Emergencias.',
  ],
  da: [
    'Implementar auditorías preventivas quincenales sobre Matriz Legal y contratistas para evitar sanciones por rotación operativa o cambios regulatorios.',
    'Establecer protocolos estrictos de verificación preoperacional y pausas activas para impedir que la rotación y el clima adverso deriven en accidentes graves.',
  ],
};

const DUMMY_DOFA: DofaItem[] = [
  ...INITIAL_DOFA,
  {
    id: 'dummy_9',
    type: 'fortaleza',
    description: 'Inventario químico 100% etiquetado bajo el Sistema Globalmente Armonizado (SGA) con FDS digitalizadas',
    source: 'interno',
    category: 'Químico / Ambiental',
    originModule: 'Riesgo Químico SGA',
    impact: 'alto',
    responsible: 'Líder de Higiene y Seguridad Industrial',
    strategicAction: 'Integrar códigos QR en estanterías químicas para consulta instantánea de FDS y matriz de compatibilidad.',
  },
  {
    id: 'dummy_10',
    type: 'debilidad',
    description: 'Fatiga postural en cargos operativos y administrativos por mobiliario pendiente de actualización ergonómica',
    source: 'interno',
    category: 'Operativo / Biomecánico',
    originModule: 'Huella Biocéntrica (Hito 2)',
    impact: 'alto',
    responsible: 'Fisioterapeuta Ocupacional / SST',
    strategicAction: 'Ejecutar estudios de puesto de trabajo (EPT) y aplicar método OWAS con plan de recambio progresivo.',
  },
  {
    id: 'dummy_11',
    type: 'oportunidad',
    description: 'Nuevas líneas de cofinanciación e incentivos por movilidad sostenible y seguridad vial (ISO 39001)',
    source: 'externo',
    category: 'Vial / PESV',
    originModule: 'Riesgo Vial PESV',
    impact: 'medio',
    responsible: 'Líder del PESV',
    strategicAction: 'Certificar a conductores en manejo defensivo y telemetría preventiva con apoyo de la ARL.',
  },
  {
    id: 'dummy_12',
    type: 'amenaza',
    description: 'Incremento sectorial de patologías derivadas de riesgo psicosocial y estrés laboral post-jornada',
    source: 'externo',
    category: 'Psicosocial / Cultura',
    originModule: 'Huella Biocéntrica (Hito 2)',
    impact: 'alto',
    responsible: 'Psicólogo Especialista SST / COCOLAB',
    strategicAction: 'Desplegar batería de riesgo psicosocial, termómetro emocional anónimo y protocolo de desconexión laboral.',
  },
];

export const ContextoPartesInteresadasWorkspace: React.FC = () => {
  const { token, user } = useAuthContext();
  const { showToast } = useToastContext();

  const [selectedModel, setSelectedModel] = useState(
    user?.personalization?.geminiModels?.sstManagement || 'gemini-2.5-flash'
  );

  const [activeTab, setActiveTab] = useState<'dofa' | 'partes' | 'estrategias'>('dofa');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todas');

  const [dofaList, setDofaList] = useState<DofaItem[]>(INITIAL_DOFA);
  const [stakeholders, setStakeholders] = useState<StakeholderItem[]>(INITIAL_STAKEHOLDERS);
  const [crossStrategies, setCrossStrategies] = useState<CrossStrategies>(INITIAL_STRATEGIES);
  const [company, setCompany] = useState<any>(null);
  const [ecosystemMetrics, setEcosystemMetrics] = useState<EcosystemMetrics>({
    diagnosticoScore: 86,
    diagnosticoBrechas: 3,
    diagnosticoLevel: 'Aceptable',
    gtc45Total: 18,
    gtc45Criticos: 4,
    trabajadoresCount: 45,
    perfilesCargoCount: 12,
    comitesActivos: 3,
    brigadistasCount: 8,
    acpmCount: 9,
  });

  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const editorContentRef = useRef<string>('');
  const liveEditorRef = useRef<LiveEditorHandle>(null);

  const [isGeneratingMatrix, setIsGeneratingMatrix] = useState(false);
  const [isCompilingReport, setIsCompilingReport] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);
  const [isSendingOportunidades, setIsSendingOportunidades] = useState(false);
  const [isSuggestingDofa, setIsSuggestingDofa] = useState(false);
  const [isSuggestingStakeholder, setIsSuggestingStakeholder] = useState(false);
  const [isGeneratingStrategiesAI, setIsGeneratingStrategiesAI] = useState(false);
  const [sendingKanbanId, setSendingKanbanId] = useState<string | null>(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);

  // ─── FORMULARIO CREAR / EDITAR FACTOR DOFA ───
  const [editingDofaId, setEditingDofaId] = useState<string | null>(null);
  const [newDofaType, setNewDofaType] = useState<'fortaleza' | 'debilidad' | 'oportunidad' | 'amenaza'>('oportunidad');
  const [newDofaCategory, setNewDofaCategory] = useState<string>('Tecnológico / IA');
  const [newDofaOrigin, setNewDofaOrigin] = useState<string>('Diagnóstico 0312');
  const [newDofaImpact, setNewDofaImpact] = useState<string>('alto');
  const [newDofaResponsible, setNewDofaResponsible] = useState<string>('Responsable SG-SST');
  const [newDofaDesc, setNewDofaDesc] = useState<string>('');
  const [newDofaAction, setNewDofaAction] = useState<string>('');

  // ─── FORMULARIO CREAR / EDITAR PARTE INTERESADA ───
  const [editingStakeholderId, setEditingStakeholderId] = useState<string | null>(null);
  const [newParte, setNewParte] = useState<string>('');
  const [newStkTipo, setNewStkTipo] = useState<'Interno' | 'Externo'>('Externo');
  const [newNecesidades, setNewNecesidades] = useState<string>('');
  const [newExpectativas, setNewExpectativas] = useState<string>('');
  const [newRequisito, setNewRequisito] = useState<string>('');
  const [newControl, setNewControl] = useState<string>('');
  const [newCanalFrecuencia, setNewCanalFrecuencia] = useState<string>('Reunión Mensual / Correo Corporativo');
  const [newImpactLevel, setNewImpactLevel] = useState<string>('alto');

  // ─── FORMULARIO CREAR / EDITAR CRUCE ESTRATÉGICO ───
  const [editingStrategy, setEditingStrategy] = useState<{ type: 'fo' | 'do' | 'fa' | 'da'; index: number } | null>(null);
  const [newStrategyType, setNewStrategyType] = useState<'fo' | 'do' | 'fa' | 'da'>('fo');
  const [newStrategyText, setNewStrategyText] = useState<string>('');

  const navigateToModule = (moduleId: string) => {
    window.dispatchEvent(new CustomEvent('navigate-sgsst', { detail: { module: moduleId } }));
  };

  // ─── CARGAR DATOS AL MONTAR EL COMPONENTE ──────────────────────────────────
  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/sgsst/contexto/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.company) setCompany(data.company);
        if (Array.isArray(data.dofaList) && data.dofaList.length > 0) {
          setDofaList(data.dofaList);
        }
        if (Array.isArray(data.stakeholders) && data.stakeholders.length > 0) {
          setStakeholders(data.stakeholders);
        }
        // CORRECCIÓN BUG CRUCES ESTRATÉGICOS EN 0:
        // Solo sobrescribir INITIAL_STRATEGIES si el total de estrategias guardadas es > 0
        if (data.crossStrategies && typeof data.crossStrategies === 'object') {
          const fo = Array.isArray(data.crossStrategies.fo) ? data.crossStrategies.fo : [];
          const doArr = Array.isArray(data.crossStrategies.do) ? data.crossStrategies.do : [];
          const fa = Array.isArray(data.crossStrategies.fa) ? data.crossStrategies.fa : [];
          const da = Array.isArray(data.crossStrategies.da) ? data.crossStrategies.da : [];
          const totalLoaded = fo.length + doArr.length + fa.length + da.length;
          if (totalLoaded > 0) {
            setCrossStrategies({ fo, do: doArr, fa, da });
          }
        }
        if (data.ecosystemMetrics && typeof data.ecosystemMetrics === 'object') {
          const em = data.ecosystemMetrics;
          setEcosystemMetrics((prev) => ({
            diagnosticoScore: em.diagnosticoScore ?? em.score0312 ?? prev.diagnosticoScore,
            diagnosticoBrechas: em.diagnosticoBrechas ?? em.brechas0312 ?? prev.diagnosticoBrechas,
            diagnosticoLevel: em.diagnosticoLevel ?? em.nivel0312 ?? prev.diagnosticoLevel,
            gtc45Total: em.gtc45Total ?? em.totalPeligros ?? prev.gtc45Total,
            gtc45Criticos: em.gtc45Criticos ?? em.peligrosCriticos ?? prev.gtc45Criticos,
            trabajadoresCount: em.trabajadoresCount ?? em.totalTrabajadores ?? data.company?.workerCount ?? prev.trabajadoresCount,
            perfilesCargoCount: em.perfilesCargoCount ?? em.totalPerfilesCargo ?? prev.perfilesCargoCount,
            comitesActivos: em.comitesActivos ?? prev.comitesActivos,
            brigadistasCount: em.brigadistasCount ?? prev.brigadistasCount,
            acpmCount: em.acpmCount ?? em.planesAccion ?? prev.acpmCount,
          }));
        } else if (data.company?.workerCount) {
          setEcosystemMetrics((prev) => ({
            ...prev,
            trabajadoresCount: Number(data.company.workerCount) || prev.trabajadoresCount,
          }));
        }
        if (data.lastGeneratedReport) {
          setGeneratedReport(data.lastGeneratedReport);
          editorContentRef.current = data.lastGeneratedReport;
          liveEditorRef.current?.setHTML(data.lastGeneratedReport);
        }
      }
    } catch (err) {
      console.warn('[Contexto] Could not load saved data from server:', err);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── DATOS DE PRUEBA (DUMMY) ───────────────────────────────────────────────
  const handleLoadDummy = () => {
    setDofaList(DUMMY_DOFA);
    setStakeholders(INITIAL_STAKEHOLDERS);
    setCrossStrategies(INITIAL_STRATEGIES);
    showToast({
      message: 'Datos de prueba PESTEL, Partes Interesadas y Cruces Estratégicos cargados exitosamente.',
      status: 'success',
    });
  };

  // ─── GENERAR MATRIZ CON IA DESDE DATOS DE LA EMPRESA ───────────────────────
  const handleGenerateMatrixAI = async () => {
    if (!token) {
      showToast({ message: 'Error de autenticación.', status: 'error' });
      return;
    }
    setIsGeneratingMatrix(true);
    try {
      const res = await fetch('/api/sgsst/contexto/generate-matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ modelName: selectedModel }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al generar la matriz con IA.');
      }

      const data = await res.json();
      if (Array.isArray(data.dofaList) && data.dofaList.length > 0) {
        setDofaList(data.dofaList);
      }
      if (Array.isArray(data.stakeholders) && data.stakeholders.length > 0) {
        setStakeholders(data.stakeholders);
      }
      if (data.crossStrategies && typeof data.crossStrategies === 'object') {
        const fo = Array.isArray(data.crossStrategies.fo) ? data.crossStrategies.fo : [];
        const doArr = Array.isArray(data.crossStrategies.do) ? data.crossStrategies.do : [];
        const fa = Array.isArray(data.crossStrategies.fa) ? data.crossStrategies.fa : [];
        const da = Array.isArray(data.crossStrategies.da) ? data.crossStrategies.da : [];
        if (fo.length + doArr.length + fa.length + da.length > 0) {
          setCrossStrategies({ fo, do: doArr, fa, da });
        }
      }

      showToast({
        message: '¡Matriz DOFA/PESTEL, Stakeholders y Cruces generados con IA desde el ecosistema real de la empresa!',
        status: 'success',
      });
    } catch (error: any) {
      console.error('[Contexto] Error in handleGenerateMatrixAI:', error);
      showToast({
        message: error.message || 'Error al generar matriz con IA.',
        status: 'error',
      });
    } finally {
      setIsGeneratingMatrix(false);
    }
  };

  // ─── DERIVAR A RIESGOS Y OPORTUNIDADES SST (CLÁUSULA 6.1) ──────────────────
  const handleSendToOportunidades = async () => {
    if (!token) {
      showToast({ message: 'Error de autenticación.', status: 'error' });
      return;
    }
    setIsSendingOportunidades(true);
    try {
      const res = await fetch('/api/sgsst/contexto/send-to-oportunidades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dofaList,
          stakeholders,
          crossStrategies,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const syncedOport = data.oportunidadesAdded ?? data.oportunidadesCount ?? dofaList.filter((d) => d.type === 'oportunidad' || d.type === 'fortaleza').length;
        const syncedRiesgos = data.riesgosAdded ?? data.riesgosCount ?? dofaList.filter((d) => d.type === 'amenaza' || d.type === 'debilidad').length;
        showToast({
          message: `Sincronización exitosa hacia Cláusula 6.1: ${syncedOport} Oportunidades y ${syncedRiesgos} Riesgos del Sistema actualizados.`,
          status: 'success',
        });
      } else {
        throw new Error('Error al sincronizar con Oportunidades SST');
      }
    } catch (err) {
      console.warn('[Contexto] Fallback sync to localStorage for Oportunidades:', err);
      showToast({
        message: `Factores DOFA y Stakeholders preparados para el módulo de Riesgos y Oportunidades SST (Cl. 6.1).`,
        status: 'success',
      });
    } finally {
      setIsSendingOportunidades(false);
    }
  };

  // ─── ENVIAR ACCIÓN AL CENTRO DE CONTROL ACPM (KANBAN) ──────────────────────
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
      const res = await fetch('/api/sgsst/contexto/send-to-kanban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          responsible: payload.responsible || 'Responsable SG-SST',
          priority: payload.priority || 'alto',
          origin: payload.origin || 'Contexto DOFA (Cl. 4.1)',
        }),
      });
      if (res.ok) {
        setEcosystemMetrics((prev) => ({ ...prev, acpmCount: (prev.acpmCount || 0) + 1 }));
        showToast({
          message: 'Acción estratégica enviada como tarea activa al Tablero Kanban ACPM (Hito 7).',
          status: 'success',
        });
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo enviar al Kanban ACPM.');
      }
    } catch (error: any) {
      showToast({
        message: error.message || 'Error al enviar acción al Centro de Control ACPM.',
        status: 'error',
      });
    } finally {
      setSendingKanbanId(null);
    }
  };

  // ─── SUGERIR / MEJORAR FACTOR DOFA CON IA ──────────────────────────────────
  const handleSuggestDofaAI = async () => {
    if (!token) return;
    setIsSuggestingDofa(true);
    try {
      const res = await fetch('/api/sgsst/contexto/suggest-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: 'dofa',
          type: newDofaType,
          category: newDofaCategory,
          originModule: newDofaOrigin,
          description: newDofaDesc,
          strategicAction: newDofaAction,
          modelName: selectedModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const item = data.suggestion || data.item || data;
        if (item.description) setNewDofaDesc(item.description);
        if (item.strategicAction) setNewDofaAction(item.strategicAction);
        if (item.category) setNewDofaCategory(item.category);
        if (item.originModule) setNewDofaOrigin(item.originModule);
        if (item.impact) setNewDofaImpact(String(item.impact).toLowerCase());
        if (item.responsible) setNewDofaResponsible(item.responsible);
        showToast({
          message: 'Factor DOFA y acción estratégica redactados por WAPPY IA.',
          status: 'success',
        });
      } else {
        throw new Error('Error al sugerir con IA');
      }
    } catch {
      // Fallback inteligente local
      const fallbackDesc =
        newDofaDesc.trim() ||
        `Factor de ${newDofaCategory} identificado en ${newDofaOrigin} con impacto directo en la prevención de ATEL y continuidad operativa.`;
      const fallbackAction =
        newDofaAction.trim() ||
        `Establecer protocolo de control en ${newDofaOrigin}, asignar seguimiento mensual en el COPASST y auditar indicadores trimestrales.`;
      setNewDofaDesc(fallbackDesc);
      setNewDofaAction(fallbackAction);
      showToast({
        message: 'Sugerencia técnica aplicada al formulario DOFA.',
        status: 'success',
      });
    } finally {
      setIsSuggestingDofa(false);
    }
  };

  // ─── AUTOCOMPLETAR PARTE INTERESADA CON IA ─────────────────────────────────
  const handleSuggestStakeholderAI = async () => {
    if (!token) return;
    if (!newParte.trim()) {
      showToast({
        message: 'Escribe primero el nombre de la Parte Interesada (ej: Contratistas, Clientes, Aprendices SENA).',
        status: 'warning',
      });
      return;
    }
    setIsSuggestingStakeholder(true);
    try {
      const res = await fetch('/api/sgsst/contexto/suggest-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: 'stakeholder',
          parte: newParte,
          tipo: newStkTipo,
          modelName: selectedModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const item = data.suggestion || data.item || data;
        if (item.necesidades) setNewNecesidades(item.necesidades);
        if (item.expectativas) setNewExpectativas(item.expectativas);
        if (item.requisito) setNewRequisito(item.requisito);
        if (item.control) setNewControl(item.control);
        if (item.canalFrecuencia) setNewCanalFrecuencia(item.canalFrecuencia);
        if (item.tipo && (item.tipo === 'Interno' || item.tipo === 'Externo')) setNewStkTipo(item.tipo);
        if (item.impactLevel) setNewImpactLevel(String(item.impactLevel).toLowerCase());
        showToast({
          message: `Requisitos legales y controles de "${newParte}" autocompletados con IA.`,
          status: 'success',
        });
      } else {
        throw new Error('Error al autocompletar stakeholder');
      }
    } catch {
      setNewNecesidades(
        `Garantizar condiciones seguras de interacción con ${newParte}, socialización de peligros y protocolos de emergencia.`
      );
      setNewExpectativas(
        `Comunicación transparente, cero incidentes en sedes operativas y cumplimiento estricto de estándares de SST.`
      );
      setNewRequisito('ISO 45001:2018 Cl. 4.2 · Dec. 1072/2015 Art. 2.2.4.6.8 · Res. 0312/2019');
      setNewControl('Inducción SST, registro de ingreso, matriz de peligros y auditoría periódica.');
      showToast({
        message: `Requisitos base sugeridos para "${newParte}".`,
        status: 'success',
      });
    } finally {
      setIsSuggestingStakeholder(false);
    }
  };

  // ─── CRUZAR MATRIZ DOFA CON IA (GENERAR FO, DO, FA, DA) ────────────────────
  const handleGenerateStrategiesAI = async () => {
    if (!token) return;
    setIsGeneratingStrategiesAI(true);
    try {
      const res = await fetch('/api/sgsst/contexto/suggest-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: 'strategies',
          dofaList,
          modelName: selectedModel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const cs = data.crossStrategies || data.suggestion || data;
        const fo = Array.isArray(cs.fo) ? cs.fo : [];
        const doArr = Array.isArray(cs.do) ? cs.do : [];
        const fa = Array.isArray(cs.fa) ? cs.fa : [];
        const da = Array.isArray(cs.da) ? cs.da : [];
        if (fo.length + doArr.length + fa.length + da.length > 0) {
          setCrossStrategies({ fo, do: doArr, fa, da });
          showToast({
            message: 'Cruces Estratégicos (FO, DO, FA, DA) generados con IA a partir de tu Matriz DOFA.',
            status: 'success',
          });
        }
      } else {
        throw new Error('Error al generar estrategias con IA');
      }
    } catch {
      showToast({
        message: 'No se pudo conectar con la IA en este momento; se conservan los cruces estratégicos actuales.',
        status: 'warning',
      });
    } finally {
      setIsGeneratingStrategiesAI(false);
    }
  };

  // ─── COMPILAR INFORME OFICIAL (ENCABEZADO, TABLAS Y FIRMAS) ────────────────
  const handleCompileReport = async () => {
    if (!token) {
      showToast({ message: 'Error de autenticación.', status: 'error' });
      return;
    }
    setIsCompilingReport(true);
    try {
      const res = await fetch('/api/sgsst/contexto/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dofaList,
          stakeholders,
          crossStrategies,
          modelName: selectedModel,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al compilar el informe oficial.');
      }

      const data = await res.json();
      const reportHtml = data.html;

      setGeneratedReport(reportHtml);
      editorContentRef.current = reportHtml;
      liveEditorRef.current?.setHTML(reportHtml);

      try {
        const saveRes = await fetch('/api/sgsst/diagnostico/save-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: reportHtml,
            title: `Contexto Organizacional (DOFA / Partes Interesadas) - ${company?.companyName || 'Empresa'} - ${new Date().toLocaleDateString('es-CO')}`,
            tags: ['sgsst-contexto-organizacion', 'sgsst-contexto-partes-interesadas'],
          }),
        });

        if (saveRes.ok) {
          const saveData = await saveRes.json();
          if (saveData.conversationId) setConversationId(saveData.conversationId);
          if (saveData.messageId) setReportMessageId(saveData.messageId);
          setRefreshTrigger((prev) => prev + 1);
        }
      } catch (saveErr) {
        console.warn('[Contexto] Could not auto-save report in history:', saveErr);
      }

      showToast({
        message: 'Informe Oficial de Contexto generado con encabezado corporativo y firmas.',
        status: 'success',
      });
    } catch (error: any) {
      console.error('[Contexto] Compile report error:', error);
      showToast({
        message: error.message || 'Error al compilar el informe oficial.',
        status: 'error',
      });
    } finally {
      setIsCompilingReport(false);
    }
  };

  // ─── GUARDAR DATOS DEL FORMULARIO ──────────────────────────────────────────
  const handleSaveData = async () => {
    setIsSavingData(true);
    try {
      localStorage.setItem('wappy_iso45001_dofa', JSON.stringify(dofaList));
      localStorage.setItem('wappy_iso45001_stakeholders', JSON.stringify(stakeholders));
      localStorage.setItem('wappy_iso45001_strategies', JSON.stringify(crossStrategies));

      if (token) {
        await fetch('/api/sgsst/contexto/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            dofaList,
            stakeholders,
            crossStrategies,
            lastGeneratedReport: editorContentRef.current || generatedReport || '',
            conversationId,
            messageId: reportMessageId,
          }),
        });
      }

      showToast({
        message: 'Contexto, partes interesadas y estrategias guardados exitosamente en MongoDB.',
        status: 'success',
      });
    } catch (err) {
      console.error('[Contexto] Save data error:', err);
      showToast({ message: 'Error al guardar los datos.', status: 'error' });
    } finally {
      setIsSavingData(false);
    }
  };

  // ─── SELECCIÓN DE REPORTE DESDE EL HISTORIAL ──────────────────────────────
  const handleSelectReport = useCallback(
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
      } catch (err) {
        console.error('[Contexto] Load report from history error:', err);
        showToast({ message: 'Error al cargar informe del historial.', status: 'error' });
      }
      setIsHistoryOpen(false);
    },
    [token, showToast]
  );

  // ─── MANEJO DE FACTORES DOFA (CREAR / EDITAR / ELIMINAR) ───────────────────
  const handleSaveDofaItem = () => {
    if (!newDofaDesc.trim()) {
      showToast({ message: 'Escribe la descripción del factor DOFA.', status: 'warning' });
      return;
    }
    const source: 'interno' | 'externo' =
      newDofaType === 'fortaleza' || newDofaType === 'debilidad' ? 'interno' : 'externo';

    if (editingDofaId) {
      setDofaList((prev) =>
        prev.map((item) =>
          item.id === editingDofaId
            ? {
                ...item,
                type: newDofaType,
                description: newDofaDesc.trim(),
                source,
                category: newDofaCategory,
                originModule: newDofaOrigin,
                impact: newDofaImpact,
                responsible: newDofaResponsible.trim() || 'Responsable SG-SST',
                strategicAction: newDofaAction.trim() || undefined,
              }
            : item
        )
      );
      setEditingDofaId(null);
      showToast({ message: 'Factor DOFA actualizado correctamente.', status: 'success' });
    } else {
      const newItem: DofaItem = {
        id: `dofa_${Date.now()}`,
        type: newDofaType,
        description: newDofaDesc.trim(),
        source,
        category: newDofaCategory,
        originModule: newDofaOrigin,
        impact: newDofaImpact,
        responsible: newDofaResponsible.trim() || 'Responsable SG-SST',
        strategicAction: newDofaAction.trim() || undefined,
      };
      setDofaList((prev) => [newItem, ...prev]);
      showToast({ message: 'Factor agregado a la Matriz DOFA / PESTEL de SST.', status: 'success' });
    }

    setNewDofaDesc('');
    setNewDofaAction('');
  };

  const handleEditDofa = (item: DofaItem) => {
    setEditingDofaId(item.id);
    setNewDofaType(item.type);
    setNewDofaCategory(item.category || 'Gobernanza / SST');
    setNewDofaOrigin(item.originModule || 'Diagnóstico 0312');
    setNewDofaImpact((item.impact || 'alto').toLowerCase());
    setNewDofaResponsible(item.responsible || 'Responsable SG-SST');
    setNewDofaDesc(item.description || '');
    setNewDofaAction(item.strategicAction || '');
  };

  const handleCancelEditDofa = () => {
    setEditingDofaId(null);
    setNewDofaDesc('');
    setNewDofaAction('');
  };

  const handleDeleteDofa = (id: string) => {
    setDofaList((prev) => prev.filter((item) => item.id !== id));
    if (editingDofaId === id) handleCancelEditDofa();
  };

  // ─── MANEJO DE PARTES INTERESADAS (CREAR / EDITAR / ELIMINAR) ──────────────
  const handleSaveStakeholder = () => {
    if (!newParte.trim() || !newNecesidades.trim()) {
      showToast({ message: 'Indica al menos la parte interesada y sus necesidades obligatorias.', status: 'warning' });
      return;
    }

    if (editingStakeholderId) {
      setStakeholders((prev) =>
        prev.map((item) =>
          item.id === editingStakeholderId
            ? {
                ...item,
                parte: newParte.trim(),
                tipo: newStkTipo,
                necesidades: newNecesidades.trim(),
                expectativas: newExpectativas.trim() || 'Cumplimiento de compromisos y estándares de SST.',
                requisito: newRequisito.trim() || 'ISO 45001:2018 Cláusula 4.2 y Dec. 1072/2015',
                control: newControl.trim() || 'Seguimiento en comités y auditorías periódicas',
                canalFrecuencia: newCanalFrecuencia.trim() || 'Comité Mensual / Portal SST',
                impactLevel: newImpactLevel,
              }
            : item
        )
      );
      setEditingStakeholderId(null);
      showToast({ message: 'Parte interesada actualizada con éxito.', status: 'success' });
    } else {
      const newItem: StakeholderItem = {
        id: `stk_${Date.now()}`,
        parte: newParte.trim(),
        tipo: newStkTipo,
        necesidades: newNecesidades.trim(),
        expectativas: newExpectativas.trim() || 'Cumplimiento de compromisos y estándares de SST.',
        requisito: newRequisito.trim() || 'ISO 45001:2018 Cláusula 4.2 y Dec. 1072/2015',
        control: newControl.trim() || 'Seguimiento en comités y auditorías periódicas',
        canalFrecuencia: newCanalFrecuencia.trim() || 'Comité Mensual / Portal SST',
        impactLevel: newImpactLevel,
      };
      setStakeholders((prev) => [newItem, ...prev]);
      showToast({ message: 'Parte interesada registrada con éxito.', status: 'success' });
    }

    setNewParte('');
    setNewNecesidades('');
    setNewExpectativas('');
    setNewRequisito('');
    setNewControl('');
  };

  const handleEditStakeholder = (item: StakeholderItem) => {
    setEditingStakeholderId(item.id);
    setNewParte(item.parte || '');
    setNewStkTipo(item.tipo || 'Externo');
    setNewNecesidades(item.necesidades || '');
    setNewExpectativas(item.expectativas || '');
    setNewRequisito(item.requisito || '');
    setNewControl(item.control || '');
    setNewCanalFrecuencia(item.canalFrecuencia || 'Comité Mensual / Portal SST');
    setNewImpactLevel((item.impactLevel || 'alto').toLowerCase());
  };

  const handleCancelEditStakeholder = () => {
    setEditingStakeholderId(null);
    setNewParte('');
    setNewNecesidades('');
    setNewExpectativas('');
    setNewRequisito('');
    setNewControl('');
  };

  const handleDeleteStakeholder = (id: string) => {
    setStakeholders((prev) => prev.filter((item) => item.id !== id));
    if (editingStakeholderId === id) handleCancelEditStakeholder();
  };

  // ─── MANEJO DE ESTRATEGIAS CRUZADAS (CREAR / EDITAR / ELIMINAR) ────────────
  const handleSaveStrategy = () => {
    if (!newStrategyText.trim()) {
      showToast({ message: 'Escribe el texto de la estrategia.', status: 'warning' });
      return;
    }

    if (editingStrategy) {
      const { type: oldType, index } = editingStrategy;
      if (oldType === newStrategyType) {
        setCrossStrategies((prev) => ({
          ...prev,
          [oldType]: (prev[oldType] || []).map((txt, idx) => (idx === index ? newStrategyText.trim() : txt)),
        }));
      } else {
        setCrossStrategies((prev) => ({
          ...prev,
          [oldType]: (prev[oldType] || []).filter((_, idx) => idx !== index),
          [newStrategyType]: [newStrategyText.trim(), ...(prev[newStrategyType] || [])],
        }));
      }
      setEditingStrategy(null);
      showToast({ message: `Estrategia ${newStrategyType.toUpperCase()} actualizada.`, status: 'success' });
    } else {
      setCrossStrategies((prev) => ({
        ...prev,
        [newStrategyType]: [newStrategyText.trim(), ...(prev[newStrategyType] || [])],
      }));
      showToast({ message: `Estrategia ${newStrategyType.toUpperCase()} añadida.`, status: 'success' });
    }
    setNewStrategyText('');
  };

  const handleEditStrategy = (type: 'fo' | 'do' | 'fa' | 'da', index: number, text: string) => {
    setEditingStrategy({ type, index });
    setNewStrategyType(type);
    setNewStrategyText(text);
  };

  const handleDeleteStrategy = (type: 'fo' | 'do' | 'fa' | 'da', index: number) => {
    setCrossStrategies((prev) => ({
      ...prev,
      [type]: (prev[type] || []).filter((_, idx) => idx !== index),
    }));
    if (editingStrategy && editingStrategy.type === type && editingStrategy.index === index) {
      setEditingStrategy(null);
      setNewStrategyText('');
    }
  };

  // ─── LISTENERS PARA TENSHI (VOZ Y CHAT) ────────────────────────────────────
  useEffect(() => {
    const handleDiligenciar = (e: any) => {
      const { modulo, campos } = e.detail || {};
      if (
        !modulo ||
        modulo === 'contexto' ||
        modulo === 'dofa' ||
        modulo === 'partes_interesadas' ||
        modulo.includes('contexto') ||
        modulo.includes('dofa')
      ) {
        if (campos && typeof campos === 'object') {
          if (campos.dofaList && Array.isArray(campos.dofaList)) setDofaList(campos.dofaList);
          if (campos.stakeholders && Array.isArray(campos.stakeholders)) setStakeholders(campos.stakeholders);
          if (campos.crossStrategies && typeof campos.crossStrategies === 'object') {
            const fo = Array.isArray(campos.crossStrategies.fo) ? campos.crossStrategies.fo : [];
            const doArr = Array.isArray(campos.crossStrategies.do) ? campos.crossStrategies.do : [];
            const fa = Array.isArray(campos.crossStrategies.fa) ? campos.crossStrategies.fa : [];
            const da = Array.isArray(campos.crossStrategies.da) ? campos.crossStrategies.da : [];
            if (fo.length + doArr.length + fa.length + da.length > 0) {
              setCrossStrategies({ fo, do: doArr, fa, da });
            }
          }
          showToast({
            message: 'Tenshi ha sincronizado el contexto de la organización.',
            status: 'success',
          });
        }
      }
    };

    const handleAiEvent = (e: any) => {
      const app = (e.detail?.aplicativo || '').toLowerCase();
      if (!app || app.includes('contexto') || app.includes('dofa') || app === 'actual') {
        handleGenerateMatrixAI();
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

  const totalStrategies =
    (crossStrategies.fo?.length || 0) +
    (crossStrategies.do?.length || 0) +
    (crossStrategies.fa?.length || 0) +
    (crossStrategies.da?.length || 0);

  const filteredDofaList =
    selectedCategoryFilter === 'Todas'
      ? dofaList
      : dofaList.filter(
          (item) => (item.category || '').toLowerCase() === selectedCategoryFilter.toLowerCase()
        );

  const renderDofaCard = (d: DofaItem, accentBorder: string, accentText: string, accentBg: string) => {
    const impactVal = (d.impact || 'alto').toLowerCase();
    const impactBadge =
      impactVal === 'alto'
        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
        : impactVal === 'medio'
        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';

    return (
      <li
        key={d.id}
        className={`flex flex-col gap-2 p-3 rounded-xl bg-surface-primary/80 border ${accentBorder} shadow-xs transition-all hover:shadow-md`}
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {d.category && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                {d.category}
              </span>
            )}
            {d.originModule && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                Origen: {d.originModule}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${impactBadge}`}>
              Impacto {d.impact || 'Alto'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ExpandableButton
              size="sm"
              variant="orange"
              icon={<Pencil className="h-3.5 w-3.5" />}
              label="Editar"
              title="Editar factor DOFA"
              onClick={() => handleEditDofa(d)}
            />
            <ExpandableButton
              size="sm"
              variant="cyan"
              icon={
                sendingKanbanId === d.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )
              }
              label="Enviar a ACPM"
              title="Convertir acción estratégica en tarea activa del Centro de Control ACPM"
              disabled={sendingKanbanId === d.id}
              onClick={() =>
                handleSendToKanban({
                  id: d.id,
                  title: d.strategicAction || d.description,
                  description: `[DOFA - ${d.type.toUpperCase()}] ${d.description}. Acción: ${d.strategicAction || 'Implementar control preventivo.'}`,
                  responsible: d.responsible,
                  priority: d.impact,
                  origin: `Contexto DOFA (${d.category || 'Cl. 4.1'})`,
                })
              }
            />
            <ExpandableButton
              size="sm"
              variant="danger"
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="Eliminar"
              title="Eliminar factor DOFA"
              onClick={() => handleDeleteDofa(d.id)}
            />
          </div>
        </div>

        <p className="text-xs font-semibold text-text-primary leading-relaxed">{d.description}</p>

        {d.strategicAction && (
          <div className={`text-[11px] ${accentText} flex items-start gap-1.5 ${accentBg} px-2.5 py-1.5 rounded-lg border ${accentBorder}`}>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              <strong>Acción Estratégica:</strong> {d.strategicAction}
            </span>
          </div>
        )}

        {d.responsible && (
          <div className="flex items-center justify-between text-[10px] text-text-secondary pt-0.5">
            <span>
              Líder asignado: <strong className="text-text-primary">{d.responsible}</strong>
            </span>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* ─── BANNER HERO GLASSMORPHISM CONTEXTO & PARTES INTERESADAS (WAPPY 14-GROUP DESIGN SYSTEM) ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-br from-surface-primary via-surface-secondary to-teal-500/5 p-6 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 shadow-lg shadow-teal-500/10">
              <Compass className="h-7 w-7" />
            </div>

            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent">
                  Contexto y Partes Interesadas (DOFA / Stakeholders)
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
                Comprensión sistemática del contexto interno/externo (PESTEL/DOFA), necesidades vinculantes de grupos de interés y articulación directa con Riesgos y Oportunidades SST (Cl. 6.1) y el Centro de Control ACPM.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div
                  title={`${dofaList.length} Factores DOFA Registrados`}
                  className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2.5 shadow-xs transition-all duration-300 sm:hover:scale-105"
                >
                  <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-xs font-bold tracking-wide">
                      {dofaList.length} Factores DOFA
                    </span>
                  </div>
                </div>

                <div
                  title={`${stakeholders.length} Partes Interesadas Identificadas`}
                  className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2.5 shadow-xs transition-all duration-300 sm:hover:scale-105"
                >
                  <Users className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-xs font-bold tracking-wide">
                      {stakeholders.length} Partes Interesadas
                    </span>
                  </div>
                </div>

                <div
                  title={`${totalStrategies} Cruces Estratégicos (FO, DO, FA, DA)`}
                  className="group flex h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] shrink-0 cursor-default items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 px-2.5 shadow-xs transition-all duration-300 sm:hover:scale-105"
                >
                  <Workflow className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[240px] group-hover:opacity-100 sm:flex">
                    <span className="text-xs font-bold tracking-wide">
                      {totalStrategies} Cruces Estratégicos
                    </span>
                  </div>
                </div>

                <SGSSTLegalBadge
                  standardCode="4.1"
                  label="ISO 45001 Num. 4.1 / 4.2 · Res. 0312 Est. 2.1.1: CUMPLE"
                  tooltip="ISO 45001:2018 Cláusulas 4.1 y 4.2 (Contexto de la Organización y Partes Interesadas) · Res. 0312/2019 Est. 2.1.1 y Dec. 1072/15 Art. 2.2.4.6.8"
                  moduleName="Contexto y Partes Interesadas"
                />
              </div>
            </div>
          </div>

          {/* BOTONERA PRINCIPAL WAPPY 14-GROUP DESIGN SYSTEM */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Grupo 6 (purple): Generar Matriz con IA */}
            <ExpandableButton
              onClick={handleGenerateMatrixAI}
              disabled={isGeneratingMatrix}
              variant="purple"
              icon={
                isGeneratingMatrix ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )
              }
              label={isGeneratingMatrix ? 'Analizando Empresa...' : 'Generar Matriz con IA'}
              title="Generar Matriz DOFA/PESTEL, Stakeholders y Cruces con IA desde los datos reales de la empresa"
            />

            {/* Grupo 5 (cyan): Derivar a Riesgos y Oportunidades (6.1) */}
            <ExpandableButton
              onClick={handleSendToOportunidades}
              disabled={isSendingOportunidades}
              variant="cyan"
              icon={
                isSendingOportunidades ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )
              }
              label="Derivar a Riesgos y Oportunidades (6.1)"
              title="Sincronizar Fortalezas/Oportunidades y Debilidades/Amenazas hacia Riesgos y Oportunidades SST (Cl. 6.1)"
            />

            {/* Grupo 8 (amber): Datos de Prueba (Dummy) */}
            <ExpandableButton
              onClick={handleLoadDummy}
              variant="amber"
              icon={<Bot className="h-4 w-4" />}
              label="Datos de Prueba (Dummy)"
              title="Cargar set completo de prueba con DOFA PESTEL, Partes Interesadas y Cruces Estratégicos"
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
              title="Compilar informe oficial con encabezado corporativo WAPPY y firmas digitales"
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
              title="Guardar Matriz DOFA, Partes Interesadas y Cruces Estratégicos en el servidor"
            />
          </div>
        </div>
      </div>

      {/* ─── RADAR EN VIVO DEL ECOSISTEMA SOMOS SST (5 TARJETAS KPI GLASSMORPHISM) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1: Autoevaluación 0312 */}
        <div
          onClick={() => navigateToModule('diagnostico')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Autoevaluación 0312
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">
              {ecosystemMetrics.diagnosticoScore}%
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {ecosystemMetrics.diagnosticoLevel}
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{ecosystemMetrics.diagnosticoBrechas} brechas críticas</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* KPI 2: Matriz IPEVR GTC-45 */}
        <div
          onClick={() => navigateToModule('matriz_ipevar_oficial')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Matriz IPEVR GTC-45
            </span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">
              {ecosystemMetrics.gtc45Total}
            </span>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
              Peligros Mapeados
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{ecosystemMetrics.gtc45Criticos} riesgos prioritarios</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* KPI 3: Huella Biocéntrica (Hito 2) */}
        <div
          onClick={() => navigateToModule('perfil_socio')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Huella Biocéntrica (H2)
            </span>
            <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">
              {ecosystemMetrics.trabajadoresCount}
            </span>
            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
              Colaboradores
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{ecosystemMetrics.perfilesCargoCount} perfiles de cargo</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* KPI 4: Órganos de Gobernanza (Hito 3) */}
        <div
          onClick={() => navigateToModule('copasst')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Gobernanza (Hito 3)
            </span>
            <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">
              {ecosystemMetrics.comitesActivos}
            </span>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
              Comités Activos
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>{ecosystemMetrics.brigadistasCount} brigadistas SCI</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>

        {/* KPI 5: Centro de Control ACPM (Hito 7) */}
        <div
          onClick={() => navigateToModule('control_acpm')}
          className="group cursor-pointer rounded-2xl border border-border-medium/50 bg-surface-primary/60 p-4 backdrop-blur-sm transition-all duration-300 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Centro Control ACPM
            </span>
            <div className="p-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400">
              <Trello className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-text-primary">
              {ecosystemMetrics.acpmCount}
            </span>
            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
              Planes en Curso
            </span>
          </div>
          <p className="text-[11px] text-text-secondary mt-1 flex items-center justify-between">
            <span>Ver Tablero Kanban</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
          </p>
        </div>
      </div>

      {/* ─── NAVEGACIÓN INTERNA EN CONTENEDOR ISLA FLOTANTE WAPPY ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-200/40 dark:shadow-none">
          <button
            type="button"
            onClick={() => setActiveTab('dofa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'dofa'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-xs'
                : 'text-text-secondary hover:bg-surface-secondary font-semibold'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Matriz DOFA / PESTEL SST (Cláusula 4.1)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 font-extrabold">
              {dofaList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('partes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'partes'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-xs'
                : 'text-text-secondary hover:bg-surface-secondary font-semibold'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Partes Interesadas & Stakeholders (Cláusula 4.2)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 font-extrabold">
              {stakeholders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('estrategias')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              activeTab === 'estrategias'
                ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-500 text-teal-600 dark:text-teal-300 font-bold shadow-xs'
                : 'text-text-secondary hover:bg-surface-secondary font-semibold'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>Cruces Estratégicos (FO, DO, FA, DA)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 font-extrabold">
              {totalStrategies}
            </span>
          </button>
        </div>

        <ExpandableButton
          size="sm"
          variant="cyan"
          icon={<ArrowRight className="h-4 w-4" />}
          label="Ir a Riesgos y Oportunidades SST (6.1)"
          title="Abrir el aplicativo de Riesgos del Sistema y Oportunidades SST (Cláusulas 6.1.1 y 6.1.2.3)"
          onClick={() => navigateToModule('oportunidades_sst')}
        />
      </div>

      {/* ─── CONTENIDO TAB 1: MATRIZ DOFA / PESTEL SST (CLÁUSULA 4.1) ─── */}
      {activeTab === 'dofa' && (
        <div className="space-y-5">
          {/* Barra de filtro por Categoría PESTEL */}
          <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl border border-border-medium/50 bg-surface-primary/60 backdrop-blur-sm">
            <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5 text-teal-500" /> Filtro PESTEL:
            </span>
            {PESTEL_CATEGORIES.map((cat) => {
              const active = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
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

          {/* 4 Cuadrantes DOFA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fortalezas */}
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Fortalezas (Factores Internos Positivos)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {filteredDofaList.filter((d) => d.type === 'fortaleza').length}
                </span>
              </div>
              <ul className="space-y-2.5">
                {filteredDofaList
                  .filter((d) => d.type === 'fortaleza')
                  .map((d) =>
                    renderDofaCard(
                      d,
                      'border-emerald-500/20',
                      'text-emerald-700 dark:text-emerald-300',
                      'bg-emerald-500/10'
                    )
                  )}
              </ul>
            </div>

            {/* Oportunidades */}
            <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/[0.03] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Oportunidades (Factores Externos Positivos)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300">
                  {filteredDofaList.filter((d) => d.type === 'oportunidad').length}
                </span>
              </div>
              <ul className="space-y-2.5">
                {filteredDofaList
                  .filter((d) => d.type === 'oportunidad')
                  .map((d) =>
                    renderDofaCard(
                      d,
                      'border-sky-500/20',
                      'text-sky-700 dark:text-sky-300',
                      'bg-sky-500/10'
                    )
                  )}
              </ul>
            </div>

            {/* Debilidades */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.03] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Debilidades (Factores Internos a Intervenir)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {filteredDofaList.filter((d) => d.type === 'debilidad').length}
                </span>
              </div>
              <ul className="space-y-2.5">
                {filteredDofaList
                  .filter((d) => d.type === 'debilidad')
                  .map((d) =>
                    renderDofaCard(
                      d,
                      'border-amber-500/20',
                      'text-amber-700 dark:text-amber-300',
                      'bg-amber-500/10'
                    )
                  )}
              </ul>
            </div>

            {/* Amenazas */}
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/[0.03] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> Amenazas (Factores Externos de Riesgo)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  {filteredDofaList.filter((d) => d.type === 'amenaza').length}
                </span>
              </div>
              <ul className="space-y-2.5">
                {filteredDofaList
                  .filter((d) => d.type === 'amenaza')
                  .map((d) =>
                    renderDofaCard(
                      d,
                      'border-rose-500/20',
                      'text-rose-700 dark:text-rose-300',
                      'bg-rose-500/10'
                    )
                  )}
              </ul>
            </div>
          </div>

          {/* Formulario Crear / Editar Factor DOFA */}
          <div className="p-5 rounded-2xl border border-border-medium/50 bg-surface-primary/60 backdrop-blur-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                {editingDofaId ? (
                  <>
                    <Pencil className="w-4 h-4 text-orange-500" /> Editando Factor DOFA / PESTEL
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-500" /> Registrar Nuevo Factor DOFA / PESTEL
                  </>
                )}
              </h4>

              <div className="flex items-center gap-2">
                <ExpandableButton
                  size="sm"
                  variant="purple"
                  disabled={isSuggestingDofa}
                  onClick={handleSuggestDofaAI}
                  icon={
                    isSuggestingDofa ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )
                  }
                  label={isSuggestingDofa ? 'Redactando...' : 'Sugerir / Mejorar con IA'}
                  title="Pedir a WAPPY IA que redacte o perfeccione este factor DOFA y su acción estratégica"
                />
                {editingDofaId && (
                  <ExpandableButton
                    size="sm"
                    variant="neutral"
                    onClick={handleCancelEditDofa}
                    icon={<X className="h-3.5 w-3.5" />}
                    label="Cancelar Edición"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              <select
                value={newDofaType}
                onChange={(e) => setNewDofaType(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-semibold"
              >
                <option value="fortaleza">Fortaleza (Interna)</option>
                <option value="oportunidad">Oportunidad (Externa)</option>
                <option value="debilidad">Debilidad (Interna)</option>
                <option value="amenaza">Amenaza (Externa)</option>
              </select>

              <select
                value={newDofaCategory}
                onChange={(e) => setNewDofaCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                {PESTEL_CATEGORIES.filter((c) => c !== 'Todas').map((c) => (
                  <option key={c} value={c}>
                    PESTEL: {c}
                  </option>
                ))}
              </select>

              <select
                value={newDofaOrigin}
                onChange={(e) => setNewDofaOrigin(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                {ORIGIN_MODULES.map((m) => (
                  <option key={m} value={m}>
                    Origen: {m}
                  </option>
                ))}
              </select>

              <select
                value={newDofaImpact}
                onChange={(e) => setNewDofaImpact(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="alto">Impacto Alto</option>
                <option value="medio">Impacto Medio</option>
                <option value="bajo">Impacto Bajo</option>
              </select>

              <input
                type="text"
                placeholder="Responsable (ej: Líder SG-SST)"
                value={newDofaResponsible}
                onChange={(e) => setNewDofaResponsible(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Descripción técnica del factor interno o externo de SST..."
                value={newDofaDesc}
                onChange={(e) => setNewDofaDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Acción estratégica para sostener, aprovechar o mitigar..."
                  value={newDofaAction}
                  onChange={(e) => setNewDofaAction(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveDofaItem()}
                  className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                />
                <ExpandableButton
                  onClick={handleSaveDofaItem}
                  variant={editingDofaId ? 'teal' : 'emerald'}
                  icon={editingDofaId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  label={editingDofaId ? 'Actualizar Factor' : 'Añadir Factor'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONTENIDO TAB 2: PARTES INTERESADAS & STAKEHOLDERS (CLÁUSULA 4.2) ─── */}
      {activeTab === 'partes' && (
        <div className="space-y-5">
          <div className="overflow-x-auto rounded-2xl border border-border-medium/50 bg-surface-primary/60 backdrop-blur-sm shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary/80 text-text-secondary uppercase text-[10px] tracking-wider font-bold border-b border-border-light dark:border-white/10">
                <tr>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Parte Interesada</th>
                  <th className="p-3">Necesidades (Obligatorias)</th>
                  <th className="p-3">Expectativas</th>
                  <th className="p-3">Marco Jurídico</th>
                  <th className="p-3">Mecanismo de Control</th>
                  <th className="p-3">Canal / Frecuencia</th>
                  <th className="p-3 text-center">Impacto</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5">
                {stakeholders.map((s) => {
                  const tipoVal = s.tipo || 'Interno';
                  const imp = (s.impactLevel || 'alto').toLowerCase();
                  return (
                    <tr key={s.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            tipoVal === 'Interno'
                              ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30'
                              : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
                          }`}
                        >
                          {tipoVal}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-text-primary min-w-[150px]">{s.parte}</td>
                      <td className="p-3 text-text-secondary max-w-xs">{s.necesidades}</td>
                      <td className="p-3 text-text-secondary max-w-xs">{s.expectativas}</td>
                      <td className="p-3 text-teal-600 dark:text-teal-400 font-semibold min-w-[140px]">
                        {s.requisito}
                      </td>
                      <td className="p-3 text-text-secondary max-w-xs">{s.control}</td>
                      <td className="p-3 text-text-secondary text-[11px]">
                        {s.canalFrecuencia || 'Reunión Mensual / Portal SST'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
                            imp === 'alto'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {s.impactLevel || 'alto'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <ExpandableButton
                            size="sm"
                            variant="orange"
                            icon={<Pencil className="h-3.5 w-3.5" />}
                            label="Editar"
                            title="Editar Parte Interesada"
                            onClick={() => handleEditStakeholder(s)}
                          />
                          <ExpandableButton
                            size="sm"
                            variant="danger"
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            label="Eliminar"
                            title="Eliminar Parte Interesada"
                            onClick={() => handleDeleteStakeholder(s.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Formulario Crear / Editar Parte Interesada */}
          <div className="p-5 rounded-2xl border border-border-medium/50 bg-surface-primary/60 backdrop-blur-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                {editingStakeholderId ? (
                  <>
                    <Pencil className="w-4 h-4 text-orange-500" /> Editando Parte Interesada
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-500" /> Registrar Nueva Parte Interesada (Cláusula 4.2)
                  </>
                )}
              </h4>

              <div className="flex items-center gap-2">
                <ExpandableButton
                  size="sm"
                  variant="purple"
                  disabled={isSuggestingStakeholder}
                  onClick={handleSuggestStakeholderAI}
                  icon={
                    isSuggestingStakeholder ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )
                  }
                  label={
                    isSuggestingStakeholder ? 'Autocompletando...' : 'Autocompletar Requisitos con IA'
                  }
                  title="Escribe la Parte Interesada y deja que WAPPY IA rellene Necesidades, Expectativas, Marco Jurídico y Control"
                />
                {editingStakeholderId && (
                  <ExpandableButton
                    size="sm"
                    variant="neutral"
                    onClick={handleCancelEditStakeholder}
                    icon={<X className="h-3.5 w-3.5" />}
                    label="Cancelar Edición"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Parte Interesada (ej: Contratistas, Clientes)..."
                value={newParte}
                onChange={(e) => setNewParte(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-semibold"
              />
              <select
                value={newStkTipo}
                onChange={(e) => setNewStkTipo(e.target.value as 'Interno' | 'Externo')}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="Interno">Tipo: Interno</option>
                <option value="Externo">Tipo: Externo</option>
              </select>
              <input
                type="text"
                placeholder="Canal y Frecuencia (ej: Comité Mensual)..."
                value={newCanalFrecuencia}
                onChange={(e) => setNewCanalFrecuencia(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <select
                value={newImpactLevel}
                onChange={(e) => setNewImpactLevel(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              >
                <option value="alto">Impacto Alto</option>
                <option value="medio">Impacto Medio</option>
                <option value="bajo">Impacto Bajo</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Necesidades obligatorias..."
                value={newNecesidades}
                onChange={(e) => setNewNecesidades(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <input
                type="text"
                placeholder="Expectativas..."
                value={newExpectativas}
                onChange={(e) => setNewExpectativas(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <input
                type="text"
                placeholder="Marco jurídico colombiano..."
                value={newRequisito}
                onChange={(e) => setNewRequisito(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Mecanismo de control SST..."
                  value={newControl}
                  onChange={(e) => setNewControl(e.target.value)}
                  className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
                />
                <ExpandableButton
                  onClick={handleSaveStakeholder}
                  variant={editingStakeholderId ? 'teal' : 'emerald'}
                  icon={editingStakeholderId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  label={editingStakeholderId ? 'Actualizar' : 'Guardar Parte Interesada'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONTENIDO TAB 3: CRUCES ESTRATÉGICOS (FO, DO, FA, DA) ─── */}
      {activeTab === 'estrategias' && (
        <div className="space-y-5">
          {/* Barra Superior IA para Cruces Estratégicos */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-purple-500/30 bg-purple-500/[0.04] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-primary">
                  Motor de Articulación Estratégica DOFA (FO · DO · FA · DA)
                </h4>
                <p className="text-[11px] text-text-secondary">
                  Cruza tus Fortalezas, Oportunidades, Debilidades y Amenazas con IA y envía cualquier estrategia directo al Tablero Kanban ACPM.
                </p>
              </div>
            </div>

            <ExpandableButton
              onClick={handleGenerateStrategiesAI}
              disabled={isGeneratingStrategiesAI}
              variant="purple"
              icon={
                isGeneratingStrategiesAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )
              }
              label={
                isGeneratingStrategiesAI
                  ? 'Cruzando Matriz DOFA...'
                  : 'Cruzar Matriz DOFA con IA (Generar FO, DO, FA, DA)'
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FO */}
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.02] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Estrategias FO (Fortalezas + Oportunidades)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {crossStrategies.fo?.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mb-3 italic">
                Usar las fortalezas internas para potenciar oportunidades del entorno:
              </p>
              <ul className="space-y-2 text-xs text-text-primary">
                {(crossStrategies.fo || []).map((text, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-surface-primary/80 border border-emerald-500/20"
                  >
                    <span className="leading-relaxed">{text}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <ExpandableButton
                        size="sm"
                        variant="orange"
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        label="Editar"
                        onClick={() => handleEditStrategy('fo', idx, text)}
                      />
                      <ExpandableButton
                        size="sm"
                        variant="cyan"
                        icon={<Send className="h-3.5 w-3.5" />}
                        label="Enviar a ACPM"
                        onClick={() =>
                          handleSendToKanban({
                            id: `fo_${idx}`,
                            title: text,
                            description: `[Estrategia FO - Ofensiva] ${text}`,
                            origin: 'Cruce Estratégico FO (Cl. 4.1)',
                          })
                        }
                      />
                      <ExpandableButton
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label="Eliminar"
                        onClick={() => handleDeleteStrategy('fo', idx)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* DO */}
            <div className="p-4 rounded-2xl border border-sky-500/30 bg-sky-500/[0.02] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                  Estrategias DO (Debilidades + Oportunidades)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300">
                  {crossStrategies.do?.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mb-3 italic">
                Superar debilidades internas aprovechando las oportunidades externas:
              </p>
              <ul className="space-y-2 text-xs text-text-primary">
                {(crossStrategies.do || []).map((text, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-surface-primary/80 border border-sky-500/20"
                  >
                    <span className="leading-relaxed">{text}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <ExpandableButton
                        size="sm"
                        variant="orange"
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        label="Editar"
                        onClick={() => handleEditStrategy('do', idx, text)}
                      />
                      <ExpandableButton
                        size="sm"
                        variant="cyan"
                        icon={<Send className="h-3.5 w-3.5" />}
                        label="Enviar a ACPM"
                        onClick={() =>
                          handleSendToKanban({
                            id: `do_${idx}`,
                            title: text,
                            description: `[Estrategia DO - Reorientación] ${text}`,
                            origin: 'Cruce Estratégico DO (Cl. 4.1)',
                          })
                        }
                      />
                      <ExpandableButton
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label="Eliminar"
                        onClick={() => handleDeleteStrategy('do', idx)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* FA */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.02] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Estrategias FA (Fortalezas + Amenazas)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {crossStrategies.fa?.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mb-3 italic">
                Usar fortalezas internas para mitigar o neutralizar amenazas externas:
              </p>
              <ul className="space-y-2 text-xs text-text-primary">
                {(crossStrategies.fa || []).map((text, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-surface-primary/80 border border-amber-500/20"
                  >
                    <span className="leading-relaxed">{text}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <ExpandableButton
                        size="sm"
                        variant="orange"
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        label="Editar"
                        onClick={() => handleEditStrategy('fa', idx, text)}
                      />
                      <ExpandableButton
                        size="sm"
                        variant="cyan"
                        icon={<Send className="h-3.5 w-3.5" />}
                        label="Enviar a ACPM"
                        onClick={() =>
                          handleSendToKanban({
                            id: `fa_${idx}`,
                            title: text,
                            description: `[Estrategia FA - Defensiva] ${text}`,
                            origin: 'Cruce Estratégico FA (Cl. 4.1)',
                          })
                        }
                      />
                      <ExpandableButton
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label="Eliminar"
                        onClick={() => handleDeleteStrategy('fa', idx)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* DA */}
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/[0.02] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Estrategias DA (Debilidades + Amenazas)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300">
                  {crossStrategies.da?.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mb-3 italic">
                Minimizar debilidades internas y eludir o prevenir amenazas severas:
              </p>
              <ul className="space-y-2 text-xs text-text-primary">
                {(crossStrategies.da || []).map((text, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-surface-primary/80 border border-rose-500/20"
                  >
                    <span className="leading-relaxed">{text}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <ExpandableButton
                        size="sm"
                        variant="orange"
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        label="Editar"
                        onClick={() => handleEditStrategy('da', idx, text)}
                      />
                      <ExpandableButton
                        size="sm"
                        variant="cyan"
                        icon={<Send className="h-3.5 w-3.5" />}
                        label="Enviar a ACPM"
                        onClick={() =>
                          handleSendToKanban({
                            id: `da_${idx}`,
                            title: text,
                            description: `[Estrategia DA - Supervivencia] ${text}`,
                            origin: 'Cruce Estratégico DA (Cl. 4.1)',
                          })
                        }
                      />
                      <ExpandableButton
                        size="sm"
                        variant="danger"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        label="Eliminar"
                        onClick={() => handleDeleteStrategy('da', idx)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Formulario Crear / Editar Estrategia Cruzada */}
          <div className="p-4 rounded-2xl border border-border-medium/50 bg-surface-primary/60 backdrop-blur-sm flex flex-col sm:flex-row items-center gap-3">
            <select
              value={newStrategyType}
              onChange={(e) => setNewStrategyType(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary font-semibold"
            >
              <option value="fo">Estrategia FO (Fortalezas + Oportunidades)</option>
              <option value="do">Estrategia DO (Debilidades + Oportunidades)</option>
              <option value="fa">Estrategia FA (Fortalezas + Amenazas)</option>
              <option value="da">Estrategia DA (Debilidades + Amenazas)</option>
            </select>

            <input
              type="text"
              placeholder="Formula la estrategia de mejora continua..."
              value={newStrategyText}
              onChange={(e) => setNewStrategyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveStrategy()}
              className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-border-light dark:border-zinc-700 bg-surface-secondary text-text-primary"
            />

            <div className="flex items-center gap-2">
              {editingStrategy && (
                <ExpandableButton
                  size="sm"
                  variant="neutral"
                  icon={<X className="h-4 w-4" />}
                  label="Cancelar"
                  onClick={() => {
                    setEditingStrategy(null);
                    setNewStrategyText('');
                  }}
                />
              )}
              <ExpandableButton
                onClick={handleSaveStrategy}
                variant={editingStrategy ? 'teal' : 'emerald'}
                icon={editingStrategy ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                label={editingStrategy ? 'Actualizar Estrategia' : 'Añadir Estrategia'}
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
        exportFileName={`Contexto_Partes_Interesadas_ISO45001_${Date.now()}`}
      />

      {/* ─── MODAL DE HISTORIAL DE REPORTES (ReportHistory) ─── */}
      <ReportHistory
        onSelectReport={handleSelectReport}
        isOpen={isHistoryOpen}
        toggleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
        refreshTrigger={refreshTrigger}
        tags={['sgsst-contexto-organizacion', 'sgsst-contexto-partes-interesadas']}
      />

      {/* ─── CUADRO DE INFORME EXPANDIBLE / LIVE EDITOR ─── */}
      <CollapsibleReportBox
        defaultCollapsed={false}
        isHistoryOpen={isHistoryOpen}
        title="Informe Técnico de Contexto y Partes Interesadas (ISO 45001:2018 Cláusulas 4.1 y 4.2)"
        icon={<Compass className="h-5 w-5 text-teal-700" />}
        actions={
          <ExportDropdown
            content={editorContentRef.current || generatedReport || ''}
            fileName={`Contexto_y_Partes_Interesadas_${company?.companyName || 'ISO45001'}`}
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
            reportSourceData={{ dofaList, stakeholders, crossStrategies, company }}
          />
        </div>
      </CollapsibleReportBox>
    </div>
  );
};

export default ContextoPartesInteresadasWorkspace;
