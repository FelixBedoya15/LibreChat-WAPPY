import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Mail,
  FolderOpen,
  HardDrive,
  Globe,
  Terminal,
  Sparkles,
  Check,
  Search,
  ShieldCheck,
  AlertTriangle,
  Activity,
  FileText,
  Cpu,
  Bot,
  Database,
  BookOpen,
  Scale,
  QrCode,
  Webhook,
  Bell,
  MessageSquare,
  Kanban,
  GraduationCap,
  Newspaper,
  GitBranch,
  Repeat,
  GitMerge,
  UserCheck,
  Wand2,
  Copy,
  Trash2,
  Plus,
  Filter,
  Sliders,
  Zap,
  Cloud,
  Laptop,
} from 'lucide-react';
import ExpandableButton from '~/components/Common/ExpandableButton';
import {
  AI_ENGINE_MODELS,
  EXTRACTOR_NODES,
  HITO_APP_NODES,
  SKILL_RULE_SUBAGENT_NODES,
  WAPPY_AGENT_AVATAR_ROTATION,
  getRotatedAgentAvatar,
  getNodeDefById,
  getNodeModuleMetadata,
  doesNodeRequireAntigravity,
  type CanvasNodeConfig,
  type CanvasExtraAgentNode,
  type CanvasCustomUserNode,
  type WorkflowNodesConfig,
} from './workflowNodesCatalog';
import {
  TENSHI_NORMATIVE_MARKDOWN_DOCS,
  TENSHI_NORMATIVE_CATEGORIES,
} from './tenshiNormativeMarkdownCatalog';

export interface LiveInspectorPayload {
  loading: boolean;
  supported: boolean;
  nodeId: string | null;
  companyName: string;
  sourceCollection: string;
  totalRecords: number;
  criticalCount: number;
  connected?: boolean;
  connectedEmail?: string;
  resolvedFolder?: {
    id: string;
    name: string;
    webViewLink?: string;
  } | null;
  availableFolders?: Array<{
    id: string;
    name: string;
    parentId?: string;
    webViewLink?: string;
  }>;
  kpis: Array<{
    label: string;
    value: string | number;
    status?: 'ok' | 'warn' | 'critical' | 'info' | string;
  }>;
  records: Array<{
    id: string;
    label: string;
    sublabel?: string;
    badge?: string;
    isCritical?: boolean;
    fields?: Record<string, any>;
    values?: Record<string, any>;
    data?: Record<string, any>;
    [key: string]: any;
  }>;
  latestReports?: Array<{
    id?: string;
    conversationId?: string;
    title?: string;
    createdAt?: string;
    updatedAt?: string;
    charCount?: number;
    preview?: string;
    html?: string;
  }>;
}

function extractGoogleDriveIdClient(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (s === 'root') return 'root';
  const folderMatch = s.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (folderMatch) return folderMatch[1];
  const fileMatch = s.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (fileMatch) return fileMatch[1];
  const queryMatch = s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (queryMatch) return queryMatch[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s) && !s.includes('/')) return s;
  return '';
}

function resolveDefaultOutputIfBranch(
  outId: string,
  idx: number,
  totalOutputs: number,
  nodeConfigs?: Record<string, any>,
  allOutputIds?: string[],
): 'yes' | 'no' {
  const explicit = nodeConfigs?.[`out_${outId}`]?.ifBranch;
  if (explicit === 'yes' || explicit === 'no') {
    return explicit;
  }
  const urgentYesIds = [
    'acpm_task',
    'email_report',
    'google_calendar',
    'somos_sst_update',
    'antigravity_local_report',
    'antigravity_cloud_report',
  ];
  const calmNoIds = [
    'wappy_notification',
    'google_sheets',
    'canvas_doc',
    'google_docs',
    'google_slides',
  ];
  const classifyDefault = (id: string): 'yes' | 'no' => {
    if (urgentYesIds.includes(id)) return 'yes';
    if (calmNoIds.includes(id)) return 'no';
    return 'yes';
  };
  const baseBranch = classifyDefault(outId);
  if (totalOutputs >= 2 && Array.isArray(allOutputIds) && allOutputIds.length === totalOutputs) {
    const hasAnyExplicit = allOutputIds.some((id) => {
      const b = nodeConfigs?.[`out_${id}`]?.ifBranch;
      return b === 'yes' || b === 'no';
    });
    if (!hasAnyExplicit) {
      const defaults = allOutputIds.map((id) => classifyDefault(id));
      const allYes = defaults.every((b) => b === 'yes');
      const allNo = defaults.every((b) => b === 'no');
      if (allYes && idx === totalOutputs - 1) return 'no';
      if (allNo && idx === 0) return 'yes';
    }
  }
  return baseBranch;
}

export interface ReportHistoryPayload {
  loading: boolean;
  conversations: Array<{
    conversationId: string;
    title: string;
    updatedAt: string;
    tags?: string[];
  }>;
  previewConvId: string | null;
  previewTitle: string | null;
  previewText: string | null;
  previewLoading: boolean;
}

export interface ActiveCompanySummary {
  companyName: string;
  nit: string;
  arl: string;
  riskLevel: string;
  ciiu: string;
  economicActivity: string;
  workerCount: number;
  city: string;
  address: string;
  legalRepresentative: string;
  responsibleSST: string;
  licenseNumber: string;
  email: string;
  sedesCount: number;
}

export interface WappyNodeCustomEditorProps {
  activeNode: {
    key: string;
    nodeId: string;
    shape: string;
    title: string;
    subtitle: string;
    group?: string;
    customNodeType?: 'skill' | 'subagent' | 'rule' | 'web_scraper' | 'web_search';
  };
  currentCfg: CanvasNodeConfig;
  onUpdateNodeConfig: (nodeKey: string, partial: Partial<CanvasNodeConfig>) => void;
  workflowNodes?: WorkflowNodesConfig;
  activeCompanyInfo?: ActiveCompanySummary | null;
  // Propiedades globales del flujo sincronizadas con los nodos correspondientes
  agentId?: string;
  onSelectAgent?: (agentId: string) => void;
  availableAgentsWithTenshiAvatar: Array<{ id: string; name: string; isTenshiAvatar?: boolean }>;
  aiEngine: 'wappy' | 'antigravity' | 'antigravity_cloud';
  aiModel: string;
  onSelectAiEngineModel: (
    engine: 'wappy' | 'antigravity' | 'antigravity_cloud',
    model: string,
  ) => void;
  prompt?: string;
  onChangePrompt?: (nextPrompt: string) => void;
  onAutoBuildPrompt?: () => void;
  extraAgentObj?: CanvasExtraAgentNode | null;
  onUpdateExtraAgent?: (key: string, newAgentId: string) => void;
  customNodeObj?: CanvasCustomUserNode | null;
  // Estado real del disparador de tiempo (Cron Programado)
  scheduleType?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  onChangeScheduleType?: (type: 'hourly' | 'daily' | 'weekly' | 'monthly') => void;
  hour?: number;
  onChangeHour?: (hour: number) => void;
  minute?: number;
  onChangeMinute?: (minute: number) => void;
  daysOfWeek?: number[];
  onChangeDaysOfWeek?: (days: number[]) => void;
  dayOfMonth?: number;
  onChangeDayOfMonth?: (day: number) => void;
  intervalHours?: number;
  onChangeIntervalHours?: (hours: number) => void;
  // Estado real de destinatarios de correo (Bitácora a Gmail)
  emailsStr?: string;
  onChangeEmailsStr?: (emails: string) => void;
  // Estado en vivo de Antigravity, MongoDB e Historial de Informes
  antigravityStatus: {
    connected: boolean;
    localConnected: boolean;
    cloudConnected: boolean;
    activeMode: string;
  };
  nodeLiveInspectorData: LiveInspectorPayload;
  nodeReportHistory: ReportHistoryPayload;
  onPreviewNodeReport: (convId: string, title: string) => void;
  onCloseReportPreview: () => void;
  resolveRecordSurgicalPreview: (
    rec: any,
    chosenFields: string[],
  ) => Array<{ field: string; value: string }>;
}

const WEEK_DAYS = [
  { id: 1, short: 'L', name: 'Lunes' },
  { id: 2, short: 'M', name: 'Martes' },
  { id: 3, short: 'Mi', name: 'Miércoles' },
  { id: 4, short: 'J', name: 'Jueves' },
  { id: 5, short: 'V', name: 'Viernes' },
  { id: 6, short: 'S', name: 'Sábado' },
  { id: 0, short: 'D', name: 'Domingo' },
];

const QR_PORTAL_OPTIONS = [
  {
    id: 'actos_condiciones',
    title: '⚠️ Reporte QR de Actos y Condiciones Inseguras',
    desc: 'Peligros, incidentes o hallazgos reportados por los trabajadores desde celular.',
  },
  {
    id: 'inspeccion_vehicular',
    title: '🚗 Inspección Preoperacional Vehicular (PESV)',
    desc: 'Chequeo diario de motos, camionetas, camiones o maquinaria antes de salir a ruta.',
  },
  {
    id: 'inspecciones_copasst',
    title: '🔍 Inspección de Seguridad COPASST / Vigía',
    desc: 'Listas de chequeo de instalaciones, extintores, orden y aseo o almacenamiento.',
  },
  {
    id: 'brigadistas_emergencias',
    title: '🧯 Registro e Inspección de Brigadistas y Botiquines',
    desc: 'Novedades de la brigada de emergencias, camillas, alarmas y equipos de rescate.',
  },
  {
    id: 'actualizacion_perfil',
    title: '👤 Actualización de Perfil Sociodemográfico',
    desc: 'Autoreporte de datos familiares, EPS/ARL, contacto de emergencia y condiciones de salud.',
  },
  {
    id: 'estudio_puesto',
    title: '🪑 Autoreporte de Estudio de Puesto / Ergonomía',
    desc: 'Evaluación ergonómica y síntomas osteomusculares reportados por el trabajador.',
  },
];

const COLOMBIAN_LEGAL_STANDARDS = [
  {
    id: 'Decreto 1072 de 2015',
    title: '📘 Decreto 1072 de 2015',
    subtitle: 'Decreto Único Reglamentario del Sector Trabajo (SG-SST)',
  },
  {
    id: 'Resolución 0312 de 2019',
    title: '📗 Resolución 0312 de 2019',
    subtitle: 'Estándares Mínimos del SG-SST (7, 21 y 60 estándares)',
  },
  {
    id: 'Guía Técnica GTC-45',
    title: '📙 Guía Técnica GTC-45',
    subtitle: 'Identificación de Peligros y Valoración de Riesgos (IPEVR)',
  },
  {
    id: 'Resolución 2764 de 2022 y Ley 1010',
    title: '🧠 Resolución 2764 de 2022 / Ley 1010',
    subtitle: 'Batería de Riesgo Psicosocial y Comité de Convivencia (CCL)',
  },
  {
    id: 'Resolución 20223040040595 de 2022 (PESV)',
    title: '🚗 Resolución 20223040040595 (PESV)',
    subtitle: 'Metodología de las 24 Fases del Plan Estratégico de Seguridad Vial',
  },
  {
    id: 'Resolución 4272 de 2021 (Alturas)',
    title: '🧗 Resolución 4272 de 2021 y 0491',
    subtitle: 'Trabajo Seguro en Alturas, Espacios Confinados y Permisos TAR',
  },
  {
    id: 'Decreto 1496 de 2018 (SGA Químicos)',
    title: '🧪 Decreto 1496 de 2018 y Ley 55',
    subtitle: 'Sistema Globalmente Armonizado (SGA) y Fichas de Seguridad FDS',
  },
  {
    id: 'Resolución 2346 de 2007 y 1401 de 2007',
    title: '🏥 Resolución 2346 y 1401 de 2007',
    subtitle: 'Evaluaciones Médicas Ocupacionales (EMO) e Investigación ATEL',
  },
];

export default function WappyNodeCustomEditor(props: WappyNodeCustomEditorProps) {
  const {
    activeNode,
    currentCfg,
    onUpdateNodeConfig,
    workflowNodes,
    activeCompanyInfo,
    agentId,
    onSelectAgent,
    availableAgentsWithTenshiAvatar,
    aiEngine,
    aiModel,
    onSelectAiEngineModel,
    prompt = '',
    onChangePrompt,
    onAutoBuildPrompt,
    extraAgentObj,
    onUpdateExtraAgent,
    customNodeObj,
    scheduleType = 'daily',
    onChangeScheduleType,
    hour = 8,
    onChangeHour,
    minute = 0,
    onChangeMinute,
    daysOfWeek = [1],
    onChangeDaysOfWeek,
    dayOfMonth = 1,
    onChangeDayOfMonth,
    intervalHours = 1,
    onChangeIntervalHours,
    emailsStr = '',
    onChangeEmailsStr,
    antigravityStatus,
    nodeLiveInspectorData,
    nodeReportHistory,
    onPreviewNodeReport,
    onCloseReportPreview,
    resolveRecordSurgicalPreview,
  } = props;

  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [customFieldInput, setCustomFieldInput] = useState('');
  const [liveRecordSearch, setLiveRecordSearch] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [normativeCategoryFilter, setNormativeCategoryFilter] = useState<string>('all');
  const [normativeSearchQuery, setNormativeSearchQuery] = useState<string>('');

  const rawId = (activeNode.nodeId || '').trim();
  const cleanId = rawId.replace(
    /^(trigger_|extractor_|ext_|hito_|out_|tool_inputs_|tool_hitos_|sub_memory_|custom_)/,
    '',
  );

  const effectiveInspectMetaId =
    cleanId === 'extract_sst_app' && currentCfg.sstAppSourceId
      ? currentCfg.sstAppSourceId
      : activeNode.nodeId;
  const moduleMeta = getNodeModuleMetadata(effectiveInspectMetaId, activeNode.shape as any);
  const baseCatalogFields = Array.isArray(moduleMeta.fields) ? moduleMeta.fields : [];

  // Unión dinámica sin duplicados de meta.fields con el 100% de llaves reales detectadas en nodeLiveInspectorData.records
  const isDynamicLiveFieldsNode =
    activeNode.shape === 'square_hito' || cleanId === 'extract_sst_app';
  const liveDetectedFieldSet = new Set<string>();
  const mergedPresetFields: string[] = [...baseCatalogFields];
  if (isDynamicLiveFieldsNode && Array.isArray(nodeLiveInspectorData?.records)) {
    const existingLower = new Set(baseCatalogFields.map((f) => f.trim().toLowerCase()));
    nodeLiveInspectorData.records.forEach((rec) => {
      const recFieldsObj =
        rec?.fields && typeof rec.fields === 'object' && !Array.isArray(rec.fields)
          ? rec.fields
          : null;
      if (recFieldsObj) {
        Object.keys(recFieldsObj).forEach((rawKey) => {
          const k = String(rawKey || '').trim();
          if (!k || k === '_id' || k === '__v') return;
          liveDetectedFieldSet.add(k);
          if (!existingLower.has(k.toLowerCase())) {
            existingLower.add(k.toLowerCase());
            mergedPresetFields.push(k);
          }
        });
      }
    });
  }
  // Incluir también cualquier casilla personalizada añadida por el usuario para que aparezca marcada en la grilla
  const selectedFields =
    Array.isArray(currentCfg.fields) && currentCfg.fields.length > 0
      ? currentCfg.fields
      : Array.isArray(currentCfg.selectedFields)
        ? currentCfg.selectedFields
        : [];
  selectedFields.forEach((sf) => {
    const cleanSf = String(sf || '').trim();
    if (cleanSf && !mergedPresetFields.includes(cleanSf)) {
      mergedPresetFields.push(cleanSf);
    }
  });
  const presetFields = mergedPresetFields;

  // Resolución inteligente de la Empresa Activa (desde /api/sgsst/company-info o desde el inspector en vivo)
  const resolvedCompanyName =
    activeCompanyInfo?.companyName ||
    (nodeLiveInspectorData.companyName && nodeLiveInspectorData.companyName !== 'Empresa Activa'
      ? nodeLiveInspectorData.companyName.replace(/\s*\(NIT:.*$/i, '').trim()
      : '');
  const resolvedCompanyFull = activeCompanyInfo?.companyName
    ? `${activeCompanyInfo.companyName}${activeCompanyInfo.nit ? ` (NIT: ${activeCompanyInfo.nit})` : ''}`
    : nodeLiveInspectorData.companyName && nodeLiveInspectorData.companyName !== 'Empresa Activa'
      ? nodeLiveInspectorData.companyName
      : 'Empresa Activa';
  const isCompanyNode =
    cleanId.includes('empresa') ||
    cleanId === 'wappy_memory_company' ||
    cleanId === 'tool_sst_company';
  const resolvedNodeDisplayTitle =
    isCompanyNode && resolvedCompanyName
      ? resolvedCompanyFull
      : (activeNode.title === 'Empresa SST' || activeNode.title === 'Memoria Empresa SST') &&
          resolvedCompanyName
        ? resolvedCompanyFull
        : activeNode.title;
  const resolvedModuleTitle =
    isCompanyNode && resolvedCompanyName
      ? `Datos y Contexto SG-SST de ${resolvedCompanyFull}`
      : resolvedCompanyName
        ? `${moduleMeta.moduleTitle
            .replace(/\s*\(Empresa Activa\)/gi, '')
            .replace(/Empresa Activa/gi, resolvedCompanyName)}`
        : moduleMeta.moduleTitle;
  const recordFilterMode: 'all' | 'critical_only' | 'expiry_only' | 'selected' =
    currentCfg.recordFilterMode || 'all';
  const selectedRecordIds = currentCfg.selectedRecordIds || [];
  const selectedRecordLabels = currentCfg.selectedRecordLabels || [];
  const selectedReportIds = currentCfg.selectedReportIds || [];
  const selectedReportTitles = currentCfg.selectedReportTitles || [];
  const isStrictFilter = currentCfg.strictFieldFilter !== false;

  const toggleFieldChip = (fieldLabel: string) => {
    const exists = selectedFields.includes(fieldLabel);
    const nextFields = exists
      ? selectedFields.filter((f) => f !== fieldLabel)
      : [...selectedFields, fieldLabel];
    onUpdateNodeConfig(activeNode.key, {
      fields: nextFields,
      selectedFields: nextFields,
      reportTags: moduleMeta.reportTags,
    });
  };

  const applyQuickCombo = (comboFields: string[]) => {
    const allAlreadySelected =
      comboFields.length === selectedFields.length &&
      comboFields.every((cf) => selectedFields.includes(cf));
    const resolvedCombo = allAlreadySelected ? [] : comboFields;
    onUpdateNodeConfig(activeNode.key, {
      fields: resolvedCombo,
      selectedFields: resolvedCombo,
      strictFieldFilter: true,
      reportTags: moduleMeta.reportTags,
    });
  };

  const handleAddCustomField = () => {
    const val = customFieldInput.trim();
    if (!val) return;
    if (!selectedFields.includes(val)) {
      const next = [...selectedFields, val];
      onUpdateNodeConfig(activeNode.key, {
        fields: next,
        selectedFields: next,
        reportTags: moduleMeta.reportTags,
      });
    }
    setCustomFieldInput('');
  };

  const handleSetRecordFilterMode = (
    mode: 'all' | 'critical_only' | 'expiry_only' | 'selected',
  ) => {
    onUpdateNodeConfig(activeNode.key, {
      recordFilterMode: mode,
      reportTags: moduleMeta.reportTags,
    });
  };

  const toggleSelectLiveRecord = (recId: string, recLabel: string, recSublabel?: string) => {
    const fullLabel = recSublabel ? `${recLabel} (${recSublabel})` : recLabel;
    const exists = selectedRecordIds.includes(recId);
    const nextIds = exists
      ? selectedRecordIds.filter((id) => id !== recId)
      : [...selectedRecordIds, recId];
    const nextLabels = exists
      ? selectedRecordLabels.filter((lbl) => lbl !== fullLabel && lbl !== recLabel)
      : Array.from(new Set([...selectedRecordLabels, fullLabel]));
    onUpdateNodeConfig(activeNode.key, {
      recordFilterMode: 'selected',
      selectedRecordIds: nextIds,
      selectedRecordLabels: nextLabels,
      reportTags: moduleMeta.reportTags,
    });
  };

  const toggleSelectReport = (convId: string, convTitle: string) => {
    const exists = selectedReportIds.includes(convId);
    const nextIds = exists
      ? selectedReportIds.filter((id) => id !== convId)
      : [...selectedReportIds, convId];
    const nextTitles = exists
      ? selectedReportTitles.filter((t) => t !== convTitle)
      : Array.from(new Set([...selectedReportTitles, convTitle]));
    onUpdateNodeConfig(activeNode.key, {
      selectedReportIds: nextIds,
      selectedReportTitles: nextTitles,
      reportTags: moduleMeta.reportTags,
    });
  };

  const filteredLiveRecords = (nodeLiveInspectorData.records || []).filter((rec) => {
    if (
      (recordFilterMode === 'critical_only' || recordFilterMode === 'expiry_only') &&
      !rec.isCritical
    ) {
      return false;
    }
    if (!liveRecordSearch.trim()) return true;
    const q = liveRecordSearch.trim().toLowerCase();
    const inHeader =
      String(rec.label || '')
        .toLowerCase()
        .includes(q) ||
      String(rec.sublabel || '')
        .toLowerCase()
        .includes(q) ||
      String(rec.badge || '')
        .toLowerCase()
        .includes(q);
    if (inHeader) return true;
    const pairs = resolveRecordSurgicalPreview(rec, selectedFields);
    return pairs.some(
      (p) => p.field.toLowerCase().includes(q) || p.value.toLowerCase().includes(q),
    );
  });

  // Sub-componente reutilizable de Checkboxes de Columnas / Parámetros + Combos Rápidos de 1 Clic
  const renderFieldChecklistSection = (
    accentTone: 'teal' | 'purple' | 'pink' | 'amber' | 'cyan' | 'blue' = 'purple',
  ) => {
    if (!presetFields || presetFields.length === 0) return null;
    const filteredChecklistFields = fieldSearchQuery.trim()
      ? presetFields.filter((f) =>
          f.toLowerCase().includes(fieldSearchQuery.trim().toLowerCase()),
        )
      : presetFields;
    const btnVariant =
      accentTone === 'pink'
        ? 'fuchsia'
        : accentTone === 'amber'
          ? 'amber'
          : accentTone === 'cyan'
            ? 'cyan'
            : accentTone === 'blue'
              ? 'blue'
              : accentTone === 'teal'
                ? 'teal'
                : 'purple';

    return (
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                📋 {moduleMeta.fieldsLabel || `Columnas y Datos de «${resolvedModuleTitle}»`}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-[#C7F303] border border-teal-300 dark:border-teal-700">
                {selectedFields.length > 0
                  ? `${selectedFields.length} seleccionado(s)`
                  : `Todos (${presetFields.length})`}
              </span>
              {resolvedCompanyName && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  🏢 {resolvedCompanyFull}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 py-0.5 px-1">
            {(presetFields.length > 5 || cleanId === 'extract_sst_app') && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={fieldSearchQuery}
                  onChange={(e) => setFieldSearchQuery(e.target.value)}
                  placeholder="Buscar casilla..."
                  className="pl-8 pr-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 w-40"
                />
              </div>
            )}
            <ExpandableButton
              size="sm"
              variant="teal"
              icon={<Check className="w-3.5 h-3.5" />}
              badge={presetFields.length}
              label="Seleccionar Todos los Parámetros"
              onClick={() =>
                onUpdateNodeConfig(activeNode.key, {
                  fields: presetFields,
                  strictFieldFilter: true,
                  reportTags: moduleMeta.reportTags,
                })
              }
            />
            {selectedFields.length > 0 && (
              <ExpandableButton
                size="sm"
                variant="danger"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                badge={selectedFields.length}
                label="Limpiar Selección"
                onClick={() =>
                  onUpdateNodeConfig(activeNode.key, {
                    fields: [],
                    reportTags: moduleMeta.reportTags,
                  })
                }
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {filteredChecklistFields.map((fieldLabel) => {
            const active = selectedFields.includes(fieldLabel);
            const isLiveDbDetected = liveDetectedFieldSet.has(fieldLabel);
            return (
              <label
                key={fieldLabel}
                onClick={() => toggleFieldChip(fieldLabel)}
                className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition select-none text-xs ${
                  active
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 dark:border-[#C7F303] font-extrabold text-purple-950 dark:text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                      active
                        ? 'bg-purple-600 dark:bg-[#C7F303] border-purple-600 dark:border-[#C7F303] text-white dark:text-[#0E1300]'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <span className="truncate" title={fieldLabel}>
                    {fieldLabel}
                  </span>
                </span>
                {isLiveDbDetected && (
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 shrink-0">
                    BD en vivo
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {selectedFields.length > 0 && (
          <div className="flex items-center justify-end pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isStrictFilter}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, {
                    strictFieldFilter: e.target.checked,
                  })
                }
                className="rounded border-teal-500 text-teal-600"
              />
              <span>
                🔒 Extraer <strong>SOLO</strong> estas {selectedFields.length} columna(s)
              </span>
            </label>
          </div>
        )}
      </div>
    );
  };

  // Vista previa limpia de solo lectura para Extractores de Nube / Carpeta PC / Correo / Bitácora (sin checkboxes de trabajadores ni vencimientos)
  const renderSimpleReadOnlyPreviewTable = (title: string) => {
    if (!nodeLiveInspectorData.supported) return null;
    const rows = Array.isArray(nodeLiveInspectorData.records) ? nodeLiveInspectorData.records : [];
    const firstRowData =
      rows.length > 0
        ? rows[0]?.fields || rows[0]?.values || rows[0]?.data || null
        : null;
    const dynamicColumns =
      firstRowData && typeof firstRowData === 'object'
        ? Object.keys(firstRowData).slice(0, 6)
        : [];

    return (
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600 dark:text-[#C7F303] shrink-0" />
            <span className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white">
              {title}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700">
              {nodeLiveInspectorData.loading
                ? 'Consultando en vivo...'
                : `${rows.length} elemento(s)`}
            </span>
          </div>
          {nodeLiveInspectorData.resolvedFolder?.name && (
            <span className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
              📁 {nodeLiveInspectorData.resolvedFolder.name}
            </span>
          )}
        </div>

        {nodeLiveInspectorData.loading ? (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            Consultando elementos reales en vivo...
          </div>
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 w-8 text-center font-bold text-slate-500">#</th>
                  {dynamicColumns.length > 0 ? (
                    dynamicColumns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 font-extrabold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))
                  ) : (
                    <>
                      <th className="px-3 py-2 font-extrabold text-slate-700 dark:text-slate-200">
                        Elemento
                      </th>
                      <th className="px-3 py-2 font-extrabold text-slate-700 dark:text-slate-200">
                        Detalle
                      </th>
                      <th className="px-3 py-2 font-extrabold text-slate-700 dark:text-slate-200">
                        Estado
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {rows.slice(0, 25).map((rec, idx) => {
                  const rowObj = rec.fields || rec.values || rec.data || {};
                  return (
                    <tr
                      key={rec.id || `row_${idx}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-2 text-center text-[11px] font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      {dynamicColumns.length > 0 ? (
                        dynamicColumns.map((col) => {
                          const val = rowObj?.[col];
                          const strVal =
                            val === null || val === undefined || val === ''
                              ? '—'
                              : String(val);
                          return (
                            <td
                              key={col}
                              className="px-3 py-2 text-slate-700 dark:text-slate-200 max-w-[220px] truncate"
                              title={strVal}
                            >
                              {strVal}
                            </td>
                          );
                        })
                      ) : (
                        <>
                          <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-100">
                            {rec.label}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {rec.sublabel || '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {rec.badge || 'OK'}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No se encontraron archivos o registros con el filtro actual.
          </div>
        )}
      </div>
    );
  };

  // Sub-componente reutilizable para la Tabla Real en Vivo de Registros (usado únicamente en Fuentes de Base de Datos Somos SST)
  const supportsExpiryFilter = [
    'hito2_perfil_socio',
    'hito3_epp',
    'hito3_vehiculos',
    'hito3_matriz_pesv',
    'extract_sst_workers',
  ].includes(cleanId);
  const renderLiveRecordsTableSection = (customTitle?: string) => {
    if (!nodeLiveInspectorData.supported) return null;
    const defaultLiveTitle = isCompanyNode
      ? `🏢 Ficha Oficial en Vivo de «${resolvedCompanyFull}»`
      : `📊 Registros y Estado Real en Vivo — ${resolvedNodeDisplayTitle}${
          resolvedCompanyName && !resolvedNodeDisplayTitle.includes(resolvedCompanyName)
            ? ` (${resolvedCompanyName})`
            : ''
        }`;
    return (
      <div className="p-3.5 rounded-2xl border border-emerald-300/80 dark:border-emerald-800/70 bg-emerald-50/30 dark:bg-emerald-950/15 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-[#C7F303] shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wide text-emerald-950 dark:text-[#C7F303]">
                  {customTitle || defaultLiveTitle}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  {nodeLiveInspectorData.loading
                    ? 'Consultando base de datos en vivo...'
                    : `${nodeLiveInspectorData.totalRecords} registro(s) en ${resolvedCompanyFull}`}
                </span>
              </div>
            </div>
          </div>

          {/* KPIs Reales en Vivo */}
          {nodeLiveInspectorData.kpis && nodeLiveInspectorData.kpis.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {nodeLiveInspectorData.kpis.map((kpi, idx) => {
                const statusColor =
                  kpi.status === 'critical'
                    ? 'bg-rose-100/90 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                    : kpi.status === 'warn'
                      ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                      : kpi.status === 'ok'
                        ? 'bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
                return (
                  <div
                    key={`${kpi.label}_${idx}`}
                    className={`px-2.5 py-1 rounded-xl border text-[10.5px] font-bold flex items-center gap-1 shadow-2xs ${statusColor}`}
                  >
                    <span className="opacity-80">{kpi.label}:</span>
                    <span className="font-black">{kpi.value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Barra de Filtro de Registros con ExpandableButton de WAPPY */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 py-0.5 px-1">
            <ExpandableButton
              size="sm"
              variant="teal"
              isActive={recordFilterMode === 'all'}
              icon={<Database className="w-3.5 h-3.5" />}
              badge={nodeLiveInspectorData.totalRecords}
              label="Todos los Registros"
              onClick={() => handleSetRecordFilterMode('all')}
            />
            <ExpandableButton
              size="sm"
              variant="danger"
              isActive={recordFilterMode === 'critical_only'}
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              badge={nodeLiveInspectorData.criticalCount}
              label="Solo Críticos / En Brecha"
              onClick={() => handleSetRecordFilterMode('critical_only')}
            />
            {supportsExpiryFilter && (
              <ExpandableButton
                size="sm"
                variant="amber"
                isActive={recordFilterMode === 'expiry_only'}
                icon={<Clock className="w-3.5 h-3.5" />}
                badge={nodeLiveInspectorData.criticalCount}
                label="Solo vencimientos próximos o vencidos (<= 30 días)"
                onClick={() => handleSetRecordFilterMode('expiry_only')}
              />
            )}
            <ExpandableButton
              size="sm"
              variant="purple"
              isActive={recordFilterMode === 'selected'}
              icon={<Check className="w-3.5 h-3.5" />}
              badge={selectedRecordIds.length}
              label="Elegidos"
              onClick={() => handleSetRecordFilterMode('selected')}
            />
          </div>

          {(nodeLiveInspectorData?.records || []).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <div className="relative min-w-0 flex-1 sm:flex-none">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={liveRecordSearch}
                  onChange={(e) => setLiveRecordSearch(e.target.value)}
                  placeholder="Buscar registro real..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 w-full sm:w-52"
                />
              </div>
              {selectedRecordIds.length > 0 && (
                <ExpandableButton
                  size="sm"
                  variant="danger"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  badge={selectedRecordIds.length}
                  label="Limpiar Selección"
                  onClick={() =>
                    onUpdateNodeConfig(activeNode.key, {
                      recordFilterMode: 'all',
                      selectedRecordIds: [],
                      selectedRecordLabels: [],
                    })
                  }
                />
              )}
            </div>
          )}
        </div>

        {/* Tabla / Lista de Registros Reales */}
        {nodeLiveInspectorData.loading ? (
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-emerald-200 dark:border-slate-800 text-xs text-slate-500">
            Consultando registros reales de la empresa activa...
          </div>
        ) : filteredLiveRecords.length > 0 ? (
          <div className="overflow-x-auto max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 w-8 text-center font-bold text-slate-500">✓</th>
                  <th className="px-3 py-2 font-extrabold text-slate-700 dark:text-slate-200">
                    Registro / Identificador Real
                  </th>
                  <th className="px-3 py-2 font-extrabold text-slate-700 dark:text-slate-200">
                    Detalle / Área
                  </th>
                  <th className="px-3 py-2 font-extrabold text-slate-700 dark:text-slate-200">
                    Datos Quirúrgicos Extraídos
                  </th>
                  <th className="px-3 py-2 font-extrabold text-slate-700 dark:text-slate-200 text-right">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredLiveRecords.slice(0, 50).map((rec) => {
                  const isRecChecked = selectedRecordIds.includes(rec.id);
                  const surgicalPairs = resolveRecordSurgicalPreview(rec, selectedFields);
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => toggleSelectLiveRecord(rec.id, rec.label, rec.sublabel)}
                      className={`cursor-pointer transition ${
                        isRecChecked
                          ? 'bg-purple-50/80 dark:bg-purple-950/40'
                          : rec.isCritical
                            ? 'bg-rose-50/40 dark:bg-rose-950/15 hover:bg-rose-50/80'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex w-4 h-4 rounded items-center justify-center border ${
                            isRecChecked
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isRecChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        {rec.label}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                        {rec.sublabel || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {surgicalPairs.slice(0, 4).map((pair, pIdx) => (
                            <span
                              key={`${rec.id}_${pIdx}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-200"
                            >
                              <strong className="text-teal-700 dark:text-[#C7F303]">
                                {pair.field}:
                              </strong>{' '}
                              <span className="truncate max-w-[160px]">{pair.value}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {rec.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              rec.isCritical
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                            }`}
                          >
                            {rec.badge}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 italic">
            Sin registros que coincidan con el filtro actual en «{resolvedNodeDisplayTitle}».
          </div>
        )}
      </div>
    );
  };

  /* ═════════════════════════════════════════════════════════════════════════
     BLOQUE REUTILIZABLE: HISTORIAL DE INFORMES GUARDADOS DE LA EMPRESA ACTIVA
     ═════════════════════════════════════════════════════════════════════════ */
  const renderReportHistorySection = () => {
    if (!moduleMeta.reportTags || moduleMeta.reportTags.length === 0) return null;
    const safeConversations = Array.isArray(nodeReportHistory?.conversations)
      ? nodeReportHistory.conversations
      : [];
    return (
      <div className="p-3.5 rounded-2xl border border-teal-300/80 dark:border-teal-800/80 bg-teal-50/35 dark:bg-teal-950/20 space-y-2.5 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-black uppercase text-teal-950 dark:text-teal-200 break-words">
                {isCompanyNode
                  ? `📜 Historial de Informes SG-SST de «${resolvedCompanyFull}» (${safeConversations.length})`
                  : `📜 Historial de Informes de «${resolvedNodeDisplayTitle}»${
                      resolvedCompanyName && !resolvedNodeDisplayTitle.includes(resolvedCompanyName)
                        ? ` — ${resolvedCompanyName}`
                        : ''
                    } (${safeConversations.length})`}
              </span>
              <p className="text-[10.5px] text-slate-600 dark:text-slate-400">
                Puedes incluir el último informe generado en <strong>{resolvedCompanyFull}</strong> o seleccionar informes anteriores específicos.
              </p>
            </div>
          </div>

          <ExpandableButton
            size="sm"
            variant="teal"
            isActive={Boolean(currentCfg.includeLatestReport)}
            icon={<FileText className="w-3.5 h-3.5" />}
            label={
              currentCfg.includeLatestReport
                ? '✓ Último Informe Incluido'
                : 'Incluir Siempre el Último Informe'
            }
            onClick={() =>
              onUpdateNodeConfig(activeNode.key, {
                includeLatestReport: !currentCfg.includeLatestReport,
                reportTags: moduleMeta.reportTags,
              })
            }
          />
        </div>

        {safeConversations.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {safeConversations.slice(0, 10).map((rep) => {
              const isRepSelected = selectedReportIds.includes(rep.conversationId);
              const isPreviewing = nodeReportHistory.previewConvId === rep.conversationId;
              return (
                <div
                  key={rep.conversationId}
                  className={`px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    isRepSelected
                      ? 'bg-teal-600/10 border-teal-500 font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelectReport(rep.conversationId, rep.title)}
                    className="flex items-center gap-2 text-left flex-1 truncate"
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        isRepSelected
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isRepSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="truncate">{rep.title}</span>
                  </button>
                  <ExpandableButton
                    size="sm"
                    variant="cyan"
                    isActive={isPreviewing}
                    icon={<FileText className="w-3.5 h-3.5" />}
                    label={isPreviewing ? 'Ocultar Resumen' : 'Ver Resumen del Informe'}
                    onClick={() => onPreviewNodeReport(rep.conversationId, rep.title)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {nodeReportHistory.previewConvId && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 text-xs">
            <div className="font-extrabold text-teal-700 dark:text-teal-300 mb-1 flex items-center justify-between gap-2">
              <span>📄 {nodeReportHistory.previewTitle}</span>
              <ExpandableButton
                size="sm"
                variant="danger"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                label="Cerrar Vista Previa"
                onClick={onCloseReportPreview}
              />
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              {nodeReportHistory.previewLoading
                ? 'Cargando resumen del informe...'
                : nodeReportHistory.previewText}
            </p>
          </div>
        )}
      </div>
    );
  };

  /* ═════════════════════════════════════════════════════════════════════════
     SELECTOR OFICIAL DE MODO DE CONEXIÓN GOOGLE ANTIGRAVITY POR NODO
     (Automático 1° Local ➔ 2° Cloud | Solo Local PC/Mac | Solo Cloud 24/7)
     ═════════════════════════════════════════════════════════════════════════ */
  const effectiveNodeAiEngine =
    currentCfg.aiEngine ||
    (activeNode.key.startsWith('agent_extra_') ? extraAgentObj?.aiEngine : aiEngine) ||
    'wappy';
  const requiresAntigravity = doesNodeRequireAntigravity(
    activeNode.nodeId,
    activeNode.key,
    activeNode.customNodeType,
    effectiveNodeAiEngine,
  );
  const currentAntigravityMode: 'auto' | 'local' | 'cloud' =
    currentCfg.antigravityMode ||
    (effectiveNodeAiEngine === 'antigravity'
      ? 'local'
      : effectiveNodeAiEngine === 'antigravity_cloud'
        ? 'cloud'
        : 'auto');

  const handleSelectNodeAntigravityMode = (mode: 'auto' | 'local' | 'cloud') => {
    const isRootOrModelNode =
      activeNode.key === 'sub_model' || activeNode.key === 'agent_root';
    const isExtraAgentNode = activeNode.key.startsWith('agent_extra_');
    const isUsingAntigravityAsEngine =
      effectiveNodeAiEngine === 'antigravity' ||
      effectiveNodeAiEngine === 'antigravity_cloud' ||
      activeNode.nodeId?.includes('antigravity');

    if (isRootOrModelNode && isUsingAntigravityAsEngine) {
      if (mode === 'local') {
        onSelectAiEngineModel('antigravity', 'antigravity-local-agent');
      } else if (mode === 'cloud') {
        onSelectAiEngineModel('antigravity_cloud', 'antigravity-cloud-agent');
      } else {
        const autoEngine = antigravityStatus?.localConnected
          ? 'antigravity'
          : 'antigravity_cloud';
        const autoModel = antigravityStatus?.localConnected
          ? 'antigravity-local-agent'
          : 'antigravity-cloud-agent';
        onSelectAiEngineModel(autoEngine, autoModel);
      }
    }

    if (isExtraAgentNode && isUsingAntigravityAsEngine) {
      const nextEng =
        mode === 'local'
          ? 'antigravity'
          : mode === 'cloud'
            ? 'antigravity_cloud'
            : antigravityStatus?.localConnected
              ? 'antigravity'
              : 'antigravity_cloud';
      const nextMod =
        nextEng === 'antigravity' ? 'antigravity-local-agent' : 'antigravity-cloud-agent';
      onUpdateNodeConfig(activeNode.key, {
        antigravityMode: mode,
        aiEngine: nextEng,
        aiModel: nextMod,
      });
      return;
    }

    onUpdateNodeConfig(activeNode.key, { antigravityMode: mode });
  };

  const renderAntigravityModeSelectorPanel = () => {
    const localUp = Boolean(antigravityStatus?.localConnected);
    const cloudUp = Boolean(antigravityStatus?.cloudConnected);

    return (
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-cyan-500/10 border border-emerald-500/30 dark:border-[#C7F303]/40 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-[#C7F303]">
              🛰️ Modo de Conexión Google Antigravity para este Nodo
            </span>
          </div>

          {/* Indicador de estado en vivo a la derecha */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-extrabold">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                localUp
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-500/10 border-slate-300/60 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  localUp ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              💻 Local PC/Mac: {localUp ? 'Conectado' : 'Apagado'}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                cloudUp
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                  : 'bg-slate-500/10 border-slate-300/60 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  cloudUp ? 'bg-cyan-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              ☁️ Cloud 24/7: {cloudUp ? 'Activo' : 'En Espera'}
            </span>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
          Elige cómo debe conectarse este nodo a Google Antigravity. En modo Automático intentará primero con tu PC/Mac local y, si no está encendido, pasará automáticamente a Antigravity Cloud 24/7.
        </p>

        <div className="flex flex-wrap items-center gap-2 py-1 px-1">
          <ExpandableButton
            type="button"
            size="sm"
            variant="emerald"
            isActive={currentAntigravityMode === 'auto'}
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Automático"
            onClick={() => handleSelectNodeAntigravityMode('auto')}
          />
          <ExpandableButton
            type="button"
            size="sm"
            variant="amber"
            isActive={currentAntigravityMode === 'local'}
            icon={<Laptop className="w-3.5 h-3.5" />}
            label="Local"
            onClick={() => handleSelectNodeAntigravityMode('local')}
          />
          <ExpandableButton
            type="button"
            size="sm"
            variant="cyan"
            isActive={currentAntigravityMode === 'cloud'}
            icon={<Cloud className="w-3.5 h-3.5" />}
            label="Cloud"
            onClick={() => handleSelectNodeAntigravityMode('cloud')}
          />
        </div>
      </div>
    );
  };

  const renderSpecificNodeEditor = () => {
  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 1: DISPARADORES (TRIGGER_NODES — 8 Nodos con UI Propia de Activación)
     ═════════════════════════════════════════════════════════════════════════ */
  if (activeNode.shape === 'trigger') {
    // 1.1 CRON PROGRAMADO / DISPARADOR POR HORARIO (Reemplaza el bloque suelto de la Imagen 3)
    if (cleanId.includes('schedule') || cleanId.includes('cron')) {
      const safeDays = Array.isArray(daysOfWeek) ? daysOfWeek : [1];
      const formattedTime = `${String(hour ?? 8).padStart(2, '0')}:${String(minute ?? 0).padStart(2, '0')}`;
      const selectedDayNames = WEEK_DAYS.filter((d) => safeDays.includes(d.id))
        .map((d) => d.name)
        .join(', ');

      return (
        <div className="space-y-4">
          {/* Resumen claro en tiempo real */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-teal-500/10 to-purple-500/10 border border-amber-400/50 dark:border-[#C7F303]/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white dark:bg-[#C7F303] dark:text-[#0E1300] flex items-center justify-center shadow-sm shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-[#C7F303]">
                  ⏰ Programación Automática de este Flujo (Zona Horaria: Colombia / America-Bogota)
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {scheduleType === 'hourly'
                    ? `Se ejecuta automáticamente cada ${intervalHours} hora(s)`
                    : scheduleType === 'daily'
                      ? `Se ejecuta todos los días a las ${formattedTime}`
                      : scheduleType === 'weekly'
                        ? `Se ejecuta cada ${selectedDayNames || 'Lunes'} a las ${formattedTime}`
                        : `Se ejecuta el día ${dayOfMonth} de cada mes a las ${formattedTime}`}
                </div>
              </div>
            </div>

            {/* Atajos rápidos de horario con ExpandableButton */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { badge: '06:00', label: '06:00 AM — Apertura', h: 6, m: 0, variant: 'amber' as const },
                { badge: '07:30', label: '07:30 AM — Inicio Turno', h: 7, m: 30, variant: 'teal' as const },
                { badge: '12:00', label: '12:00 PM — Mediodía', h: 12, m: 0, variant: 'cyan' as const },
                { badge: '17:00', label: '05:00 PM — Cierre Jornada', h: 17, m: 0, variant: 'purple' as const },
              ].map((preset) => (
                <ExpandableButton
                  key={preset.label}
                  size="sm"
                  variant={preset.variant}
                  isActive={scheduleType !== 'hourly' && hour === preset.h && minute === preset.m}
                  icon={<Clock className="w-3.5 h-3.5" />}
                  badge={preset.badge}
                  label={preset.label}
                  onClick={() => {
                    if (onChangeHour) onChangeHour(preset.h);
                    if (onChangeMinute) onChangeMinute(preset.m);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Paso 1: Elegir Frecuencia en 4 Tarjetas */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
              1. ¿Con qué frecuencia debe dispararse automáticamente?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'daily',
                  title: '☀️ Todos los Días (Diario)',
                  desc: 'Se dispara una vez al día en la hora exacta que elijas.',
                },
                {
                  id: 'weekly',
                  title: '📅 Días de la Semana',
                  desc: 'Elige días específicos (ej. Lunes, Miércoles y Viernes).',
                },
                {
                  id: 'monthly',
                  title: '🗓️ Día del Mes (Mensual)',
                  desc: 'Ideal para cierres mensuales o corte de indicadores.',
                },
                {
                  id: 'hourly',
                  title: '⏱️ Cada X Horas (Continuo)',
                  desc: 'Vigilancia continua cada 1, 2, 4, 6, 8 o 12 horas.',
                },
              ].map((freq) => {
                const active = scheduleType === freq.id;
                return (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => onChangeScheduleType && onChangeScheduleType(freq.id as any)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                      active
                        ? 'bg-amber-50/90 dark:bg-slate-800 border-amber-500 dark:border-[#C7F303] ring-2 ring-amber-500/20 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {freq.title}
                      </span>
                      {active && (
                        <span className="w-4 h-4 rounded-full bg-amber-500 dark:bg-[#C7F303] text-white dark:text-[#0E1300] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {freq.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paso 2: Hora exacta, Días de la Semana o Día del Mes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            {scheduleType !== 'hourly' ? (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  2. Hora Exacta de Disparo (Formato 24 Horas)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">
                      Hora (00 a 23)
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={hour}
                      onChange={(e) =>
                        onChangeHour &&
                        onChangeHour(Math.max(0, Math.min(23, Number(e.target.value))))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-black text-center text-slate-900 dark:text-white"
                    />
                  </div>
                  <span className="text-2xl font-black text-slate-400 mt-4">:</span>
                  <div className="flex-1">
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">
                      Minuto (00 a 59)
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={minute}
                      onChange={(e) =>
                        onChangeMinute &&
                        onChangeMinute(Math.max(0, Math.min(59, Number(e.target.value))))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-black text-center text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                  2. Intervalo de Repetición en Horas
                </label>
                <div className="flex flex-wrap items-center gap-2 py-1 px-1">
                  {[
                    { hVal: 1, variant: 'amber' as const },
                    { hVal: 2, variant: 'teal' as const },
                    { hVal: 4, variant: 'cyan' as const },
                    { hVal: 6, variant: 'purple' as const },
                    { hVal: 8, variant: 'indigo' as const },
                    { hVal: 12, variant: 'emerald' as const },
                    { hVal: 24, variant: 'fuchsia' as const },
                  ].map(({ hVal, variant }) => (
                    <ExpandableButton
                      key={hVal}
                      type="button"
                      size="sm"
                      variant={variant}
                      isActive={intervalHours === hVal}
                      icon={<Clock className="w-3.5 h-3.5" />}
                      badge={`${hVal}h`}
                      label={`Cada ${hVal} hora${hVal > 1 ? 's' : ''}`}
                      onClick={() => onChangeIntervalHours && onChangeIntervalHours(hVal)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Días de la Semana o Día del Mes */}
            <div>
              {scheduleType === 'weekly' ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      3. ¿Qué días de la semana se activa?
                    </label>
                    <div className="flex items-center gap-2 py-0.5 px-1">
                      <ExpandableButton
                        type="button"
                        size="sm"
                        variant="teal"
                        icon={<Calendar className="w-3.5 h-3.5" />}
                        badge="L-V"
                        label="Lunes a Viernes (Días Hábiles)"
                        onClick={() => onChangeDaysOfWeek && onChangeDaysOfWeek([1, 2, 3, 4, 5])}
                      />
                      <ExpandableButton
                        type="button"
                        size="sm"
                        variant="purple"
                        icon={<Calendar className="w-3.5 h-3.5" />}
                        badge="L-S"
                        label="Lunes a Sábado"
                        onClick={() =>
                          onChangeDaysOfWeek && onChangeDaysOfWeek([1, 2, 3, 4, 5, 6])
                        }
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 py-1 px-1">
                    {WEEK_DAYS.map((day, dIdx) => {
                      const isSel = daysOfWeek.includes(day.id);
                      const dayVariants = [
                        'teal',
                        'cyan',
                        'purple',
                        'indigo',
                        'emerald',
                        'amber',
                        'fuchsia',
                      ] as const;
                      return (
                        <ExpandableButton
                          key={day.id}
                          type="button"
                          size="sm"
                          variant={isSel ? dayVariants[dIdx % dayVariants.length] : 'neutral'}
                          isActive={isSel}
                          icon={<Calendar className="w-3.5 h-3.5" />}
                          badge={day.short}
                          label={day.name}
                          title={day.name}
                          onClick={() => {
                            if (!onChangeDaysOfWeek) return;
                            if (isSel) {
                              if (daysOfWeek.length > 1) {
                                onChangeDaysOfWeek(daysOfWeek.filter((d) => d !== day.id));
                              }
                            } else {
                              onChangeDaysOfWeek([...daysOfWeek, day.id]);
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : scheduleType === 'monthly' ? (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                    3. ¿Qué día del mes se activa? (1 al 31)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={dayOfMonth}
                      onChange={(e) =>
                        onChangeDayOfMonth &&
                        onChangeDayOfMonth(Math.max(1, Math.min(31, Number(e.target.value))))
                      }
                      className="w-24 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-black text-center text-slate-900 dark:text-white"
                    />
                    <div className="flex flex-wrap gap-2 py-1 px-1">
                      {[
                        { dVal: 1, variant: 'teal' as const },
                        { dVal: 5, variant: 'cyan' as const },
                        { dVal: 15, variant: 'purple' as const },
                        { dVal: 25, variant: 'amber' as const },
                        { dVal: 30, variant: 'emerald' as const },
                      ].map(({ dVal, variant }) => (
                        <ExpandableButton
                          key={dVal}
                          type="button"
                          size="sm"
                          variant={dayOfMonth === dVal ? variant : 'neutral'}
                          isActive={dayOfMonth === dVal}
                          icon={<Calendar className="w-3.5 h-3.5" />}
                          badge={dVal}
                          label={`Activar el Día ${dVal} del Mes`}
                          onClick={() => onChangeDayOfMonth && onChangeDayOfMonth(dVal)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                    3. Condición Opcional de Disparo
                  </label>
                  <input
                    type="text"
                    value={currentCfg.customInstruction || ''}
                    onChange={(e) =>
                      onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
                    }
                    placeholder="Ej: Ejecutar solo en días hábiles o revisar vencimientos de los próximos 15 días..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 1.2 DISPARADOR TENSHI IA (VOZ 3D / CHAT)
    if (cleanId.includes('tenshi')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                🎙️ Frase o Comando para activar este flujo con Tenshi
              </label>
              <input
                type="text"
                value={currentCfg.voiceCommand || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { voiceCommand: e.target.value })
                }
                placeholder='Ej: "Tenshi, revisa los certificados de afiliación hoy"'
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                📡 Canal de Escucha de Tenshi
              </label>
              <div className="flex flex-wrap items-center gap-2 py-1 px-1">
                {[
                  {
                    id: 'both',
                    label: '⚡ Voz 3D Live + Chat Escrito',
                    variant: 'teal' as const,
                  },
                  {
                    id: 'voice',
                    label: '🎙️ Solo Voz Live Multimodal',
                    variant: 'purple' as const,
                  },
                  {
                    id: 'chat',
                    label: '💬 Solo Chat Escrito en WAPPY',
                    variant: 'cyan' as const,
                  },
                ].map((ch) => {
                  const active = (currentCfg.triggerChannel || 'both') === ch.id;
                  return (
                    <ExpandableButton
                      key={ch.id}
                      type="button"
                      size="sm"
                      variant={active ? ch.variant : 'neutral'}
                      isActive={active}
                      icon={<MessageSquare className="w-3.5 h-3.5" />}
                      label={ch.label}
                      onClick={() =>
                        onUpdateNodeConfig(activeNode.key, { triggerChannel: ch.id as any })
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 1.3 Y 1.4 DISPARADOR DESDE GOOGLE ANTIGRAVITY (LOCAL PC O CLOUD 24/7)
    if (cleanId.includes('antigravity')) {
      const isCloud = cleanId.includes('cloud');
      return (
        <div className="p-3.5 rounded-2xl border border-orange-300 dark:border-orange-800/70 bg-orange-50/30 dark:bg-orange-950/15 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase text-orange-800 dark:text-orange-300 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              {isCloud
                ? '☁️ Disparo desde Google Antigravity Cloud 24/7'
                : '💻 Disparo desde Google Antigravity en tu Mac/PC'}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                antigravityStatus.connected
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950/80 dark:text-amber-300'
              }`}
            >
              {antigravityStatus.connected
                ? `🟢 Puente Antigravity Conectado (${antigravityStatus.activeMode})`
                : '⚠️ Inicia wappy-push-daemon.js para conectar tu instancia'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📂 Carpeta o Comando Vigilado en Antigravity
              </label>
              <input
                type="text"
                value={currentCfg.watchFolderPath || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { watchFolderPath: e.target.value.replace(/^["']+|["']+$/g, '') })
                }
                placeholder={
                  isCloud
                    ? 'Ej: Cola remota Cloud 24/7 o tarea delegada...'
                    : 'Ej: /Users/venta/Documents/SST_Reportes'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                ⚡ Condición de Activación
              </label>
              <input
                type="text"
                value={currentCfg.customInstruction || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
                }
                placeholder="Ej: Al detectar un archivo PDF/Excel nuevo o recibir orden desde CLI..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      );
    }

    // 1.5 DISPARADOR CORREO ENTRANTE GMAIL
    if (cleanId === 'email' || cleanId.includes('email') || cleanId.includes('gmail')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📧 Remitente (De:) que dispara el flujo
              </label>
              <input
                type="text"
                value={currentCfg.emailSenderFilter || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { emailSenderFilter: e.target.value })
                }
                placeholder="Ej: notificaciones@positiva.gov.co, @sura.com.co"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🔍 Palabras Clave en el Asunto
              </label>
              <input
                type="text"
                value={currentCfg.emailSubjectFilter || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { emailSubjectFilter: e.target.value })
                }
                placeholder="Ej: FURAT, Incapacidad, Concepto Médico, Citación"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(currentCfg.onlyWithAttachments)}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { onlyWithAttachments: e.target.checked })
              }
              className="rounded border-teal-500 text-teal-600"
            />
            <span>📎 Disparar solo si el correo incluye archivos PDF o Excel adjuntos</span>
          </label>
        </div>
      );
    }

    // 1.6 DISPARADOR REPORTE QR EN VIVO
    if (cleanId.includes('qr')) {
      const selectedQr = currentCfg.qrPortalTarget || 'actos_condiciones';
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-fuchsia-600" />
              1. Elige qué Portal Público QR de Somos SST dispara este flujo al recibir un reporte:
            </label>
            <div className="flex flex-wrap gap-2 py-0.5 px-1">
              <ExpandableButton
                size="sm"
                variant="teal"
                isActive={(currentCfg.qrSeverityFilter || 'all') === 'all'}
                icon={<Check className="w-3.5 h-3.5" />}
                label="Cualquier Reporte Nuevo"
                onClick={() => onUpdateNodeConfig(activeNode.key, { qrSeverityFilter: 'all' })}
              />
              <ExpandableButton
                size="sm"
                variant="danger"
                isActive={currentCfg.qrSeverityFilter === 'critical_only'}
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                label="Solo Peligro Crítico / Alto"
                onClick={() =>
                  onUpdateNodeConfig(activeNode.key, { qrSeverityFilter: 'critical_only' })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {QR_PORTAL_OPTIONS.map((portal) => {
              const active = selectedQr === portal.id;
              return (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() =>
                    onUpdateNodeConfig(activeNode.key, { qrPortalTarget: portal.id })
                  }
                  className={`p-3 rounded-2xl border-2 text-left transition ${
                    active
                      ? 'bg-fuchsia-50/80 dark:bg-slate-800 border-fuchsia-500 ring-2 ring-fuchsia-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-fuchsia-400'
                  }`}
                >
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {portal.title}
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {portal.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // 1.7 DISPARADOR POR OTRO AGENTE IA
    if (cleanId.includes('agent')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🤖 ¿Qué Agente IA dispara este flujo al terminar su trabajo?
              </label>
              <select
                value={currentCfg.sourceAgentId || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { sourceAgentId: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="">Cualquier Agente Especialista de la empresa</option>
                {availableAgentsWithTenshiAvatar.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                ⚡ Condición de Encadenamiento
              </label>
              <input
                type="text"
                value={currentCfg.customInstruction || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
                }
                placeholder="Ej: Disparar solo cuando el agente emisor detecte brechas o genere un acta..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      );
    }

    // 1.75 DISPARADOR WHATSAPP BOT SST (EN CONSTRUCCIÓN)
    if (cleanId.includes('whatsapp')) {
      return (
        <div className="p-3.5 rounded-2xl border border-amber-300 dark:border-amber-800/70 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              💬 Disparador WhatsApp Bot SST (En Construcción · Próximamente)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200">
              🚧 En Construcción
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Este disparador permitirá que los trabajadores o supervisores en campo inicien flujos de Somos SST enviando una <strong>nota de voz</strong>, <strong>fotografía de acto/condición insegura</strong>, <strong>incapacidad médica</strong> o <strong>FURAT en PDF</strong> directamente al número de WhatsApp Business de la empresa.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📱 Números o Grupos Autorizados (Pre-configuración)
              </label>
              <input
                type="text"
                value={currentCfg.whatsappNumbers || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { whatsappNumbers: e.target.value })
                }
                placeholder="Ej: +57 300 000 0000, Brigadistas, Todos los trabajadores activos"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                ⚡ Palabra Clave o Tipo de Mensaje Esperado
              </label>
              <input
                type="text"
                value={currentCfg.customInstruction || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
                }
                placeholder="Ej: Nota de voz reportando incidente, foto en obra o PDF de incapacidad"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      );
    }

    // 1.8 DISPARADOR WEBHOOK / API EXTERNA
    const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://wappy.club'}/api/sgsst/automatizaciones/webhook`;
    return (
      <div className="space-y-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <span className="text-[10.5px] font-extrabold uppercase text-slate-500">
              🔗 Endpoint Webhook POST para Sistemas Externos (ERP / Nómina / ARL / Formularios):
            </span>
            <div className="font-mono text-xs font-bold text-slate-900 dark:text-[#C7F303] mt-0.5 break-all">
              POST {webhookUrl}
            </div>
          </div>
          <ExpandableButton
            size="sm"
            variant="fuchsia"
            icon={<Copy className="w-3.5 h-3.5" />}
            label={copiedWebhook ? '¡URL Copiada!' : 'Copiar URL Webhook'}
            onClick={() => {
              navigator.clipboard?.writeText(webhookUrl);
              setCopiedWebhook(true);
              setTimeout(() => setCopiedWebhook(false), 2000);
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
            📦 Campos esperados en el JSON del Webhook (Opcional)
          </label>
          <input
            type="text"
            value={currentCfg.customInstruction || ''}
            onChange={(e) =>
              onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
            }
            placeholder='Ej: Recibe {"cedula": "...", "evento": "ingreso_nuevo", "cargo": "..."}'
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-white"
          />
        </div>
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 3: NODO AGENTE IA (#1 PRINCIPAL, #2+ REVISOR Y TENSHI AVATAR) + SUB-NODO MODELO IA
     ═════════════════════════════════════════════════════════════════════════ */
  if (activeNode.shape === 'agent') {
    const isExtraAgent = activeNode.key.startsWith('agent_extra_');
    return (
      <div className="space-y-3.5">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              1. Especialista IA o Avatar Asignado
            </label>
            <select
              value={isExtraAgent ? extraAgentObj?.agentId || '' : agentId || ''}
              onChange={(e) => {
                if (isExtraAgent && onUpdateExtraAgent) {
                  onUpdateExtraAgent(activeNode.key, e.target.value);
                } else if (onSelectAgent) {
                  onSelectAgent(e.target.value);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            >
              {availableAgentsWithTenshiAvatar.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              2. Motor y Modelo de IA
            </label>
            <select
              value={
                isExtraAgent
                  ? `${currentCfg.aiEngine || extraAgentObj?.aiEngine || 'wappy'}:::${currentCfg.aiModel || extraAgentObj?.aiModel || 'gemini-3.6-flash'}`
                  : `${aiEngine}:::${aiModel}`
              }
              onChange={(e) => {
                const [eng, mod] = e.target.value.split(':::') as [
                  'wappy' | 'antigravity' | 'antigravity_cloud',
                  string,
                ];
                const syncedMode =
                  eng === 'antigravity'
                    ? currentCfg.antigravityMode === 'auto'
                      ? 'auto'
                      : 'local'
                    : eng === 'antigravity_cloud'
                      ? currentCfg.antigravityMode === 'auto'
                        ? 'auto'
                        : 'cloud'
                      : currentCfg.antigravityMode || 'auto';
                if (isExtraAgent) {
                  onUpdateNodeConfig(activeNode.key, {
                    aiEngine: eng,
                    aiModel: mod,
                    antigravityMode: syncedMode,
                  });
                } else {
                  onSelectAiEngineModel(eng, mod);
                  onUpdateNodeConfig(activeNode.key, { antigravityMode: syncedMode });
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            >
              {AI_ENGINE_MODELS.map((m) => (
                <option key={m.id} value={`${m.engine}:::${m.model}`}>
                  {m.shortLabel} — {m.subtitle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              3. Estilo de Respuesta del Agente
            </label>
            <select
              value={currentCfg.agentOutputStyle || 'executive_report'}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, {
                  agentOutputStyle: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="executive_report">📋 Informe Ejecutivo + Tablas Markdown</option>
              <option value="structured_table">📊 Solo Tabla Quirúrgica de Datos Cruzados</option>
              <option value="silent_action">⚡ Ejecución Directa en Aplicativos (Resumen Corto)</option>
            </select>
          </div>
        </div>

        {/* Selector Visual de Avatar 3D del Agente (Tenshi en Principal, Rotación Automática en Sub-Agentes) */}
        <div className="p-3 rounded-2xl border border-emerald-200 dark:border-slate-700 bg-emerald-50/30 dark:bg-slate-900/50 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-800 dark:text-[#C7F303]">
              🐾 Avatar 3D de este Agente en el Lienzo (Rotación automática por Sub-Agente)
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              Principal: Tenshi (Gato) · #2: Suri (Suricato) · #3: Max (Perro) · #4: Paz (Paloma) · #5: Capi (Capibara)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WAPPY_AGENT_AVATAR_ROTATION.slice(0, 5).map((av, idx) => {
              const defaultAvatar = getRotatedAgentAvatar(
                isExtraAgent
                  ? Math.max(1, parseInt(activeNode.key.replace(/\D+/g, ''), 10) || 1)
                  : 0,
                currentCfg.avatarSrc,
              );
              const isSelectedAv = defaultAvatar.src.split('?')[0] === av.src.split('?')[0];
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => onUpdateNodeConfig(activeNode.key, { avatarSrc: av.src })}
                  className={`p-2 rounded-xl border-2 flex items-center gap-2 text-left transition ${
                    isSelectedAv
                      ? 'bg-white dark:bg-slate-800 border-teal-500 dark:border-[#C7F303] shadow-xs ring-1 ring-teal-500/20'
                      : 'bg-white/70 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                  }`}
                >
                  <img
                    src={av.src}
                    alt={av.name}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.retried) {
                        img.dataset.retried = '1';
                        img.src = `${av.src.split('?')[0]}?t=${Date.now()}`;
                      } else {
                        img.src = '/assets/tenshi.png';
                      }
                    }}
                    className="w-9 h-9 object-contain shrink-0 drop-shadow-xs"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold text-slate-900 dark:text-white truncate">
                      {av.name}
                    </div>
                    <div className="text-[9.5px] font-bold text-teal-600 dark:text-teal-400 truncate">
                      {idx === 0 ? 'Principal' : `Sub-Agente #${idx}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor Principal del Prompt de este Agente (Reemplaza el bloque suelto de la Imagen 3) */}
        <div className="p-3.5 rounded-2xl bg-purple-50/40 dark:bg-slate-800/60 border border-purple-200 dark:border-slate-700 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-black uppercase tracking-wider text-purple-800 dark:text-[#C7F303] flex items-center gap-1.5">
              <Bot className="w-4 h-4" />
              {isExtraAgent
                ? `Instrucción / Segundo Prompt para ${activeNode.title} (${extraAgentObj?.agentName || 'IA Revisora'})`
                : `Instrucciones Autónomas para ${activeNode.title} (${availableAgentsWithTenshiAvatar.find((a) => a.id === agentId)?.name || 'Agente Principal'})`}
            </label>
            {!isExtraAgent && onAutoBuildPrompt && (
              <ExpandableButton
                size="sm"
                variant="purple"
                icon={<Wand2 className="w-3.5 h-3.5" />}
                label="Autogenerar Prompt desde los Nodos Conectados"
                onClick={onAutoBuildPrompt}
              />
            )}
          </div>
          <textarea
            rows={4}
            value={
              isExtraAgent
                ? currentCfg.prompt ?? extraAgentObj?.prompt ?? ''
                : prompt || currentCfg.prompt || ''
            }
            onChange={(e) => {
              if (isExtraAgent) {
                onUpdateNodeConfig(activeNode.key, { prompt: e.target.value });
              } else {
                if (onChangePrompt) onChangePrompt(e.target.value);
                onUpdateNodeConfig(activeNode.key, { prompt: e.target.value });
              }
            }}
            placeholder={
              isExtraAgent
                ? 'Escribe aquí qué debe revisar, auditar o aprobar este segundo Agente IA antes de enviar la salida final...'
                : 'Escribe la orden para este Agente IA o pulsa «Autogenerar Prompt desde los Nodos Conectados»...'
            }
            className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
    );
  }

  // 3.2 SUB-NODO CIRCULAR MODELO IA (CERO pastillas de campos — Diseño horizontal limpio sin desbordamiento)
  if (activeNode.shape === 'circle_model') {
    const isAntigravityEngineSelected =
      aiEngine === 'antigravity' || aiEngine === 'antigravity_cloud';
    return (
      <div className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-purple-800 dark:text-[#C7F303] mb-2">
            ✨ 1. Selecciona el Motor y Modelo de IA del Flujo
          </label>
          <div className="grid grid-cols-1 gap-2">
            {AI_ENGINE_MODELS.map((m) => {
              const isSel =
                (m.engine === 'antigravity_cloud' && aiEngine === 'antigravity_cloud') ||
                (m.engine === 'antigravity' && aiEngine === 'antigravity') ||
                (m.engine === 'wappy' && aiEngine === 'wappy' && aiModel === m.model);
              const isLocalAgy = m.engine === 'antigravity';
              const isCloudAgy = m.engine === 'antigravity_cloud';
              const isLite = m.model.includes('lite');

              const iconBoxClass = isCloudAgy
                ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30'
                : isLocalAgy
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                  : isLite
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30';

              const subtitleBadgeClass = isCloudAgy
                ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25'
                : isLocalAgy
                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25'
                  : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25';

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelectAiEngineModel(m.engine, m.model);
                    if (m.engine === 'antigravity') {
                      onUpdateNodeConfig(activeNode.key, {
                        antigravityMode: currentCfg.antigravityMode === 'auto' ? 'auto' : 'local',
                      });
                    } else if (m.engine === 'antigravity_cloud') {
                      onUpdateNodeConfig(activeNode.key, {
                        antigravityMode: currentCfg.antigravityMode === 'auto' ? 'auto' : 'cloud',
                      });
                    }
                  }}
                  className={`w-full min-w-0 p-3 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                    isSel
                      ? 'bg-indigo-50/90 dark:bg-slate-800/95 border-indigo-500 dark:border-[#C7F303] ring-2 ring-indigo-500/20 dark:ring-[#C7F303]/20 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconBoxClass}`}
                  >
                    {isCloudAgy ? (
                      <Cloud className="w-4 h-4" />
                    ) : isLocalAgy ? (
                      <Laptop className="w-4 h-4" />
                    ) : isLite ? (
                      <Zap className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {m.shortLabel}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold leading-tight ${subtitleBadgeClass}`}
                      >
                        {m.subtitle}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug break-words">
                      {m.description}
                    </p>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {isSel ? (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-[#C7F303] text-white dark:text-[#0E1300] flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 block" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de Modo Antigravity solo cuando se elige un motor Antigravity */}
        {isAntigravityEngineSelected && renderAntigravityModeSelectorPanel()}

        <div>
          <label className="block text-[11px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 mb-2">
            🎯 2. Nivel de Precisión y Temperatura del Modelo
          </label>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                id: '0.1',
                title: '🎯 Precisión Normativa Estricta (Temp 0.1)',
                desc: 'Cero invención. Ideal para cruce de cédulas, afiliaciones y auditorías 0312.',
              },
              {
                id: '0.4',
                title: '⚖️ Equilibrado Analítico (Temp 0.4)',
                desc: 'Balance entre exactitud técnica y redacción ejecutiva de planes de acción.',
              },
              {
                id: '0.7',
                title: '✨ Redacción Creativa / Académica (Temp 0.7)',
                desc: 'Ideal para crear cursos LMS, artículos de blog, guiones o comunicados.',
              },
            ].map((tempOpt) => {
              const active = (currentCfg.temperature || '0.1') === tempOpt.id;
              return (
                <button
                  key={tempOpt.id}
                  type="button"
                  onClick={() => onUpdateNodeConfig(activeNode.key, { temperature: tempOpt.id })}
                  className={`w-full min-w-0 p-2.5 px-3 rounded-xl border text-left transition flex items-center justify-between gap-3 ${
                    active
                      ? 'bg-teal-50/90 dark:bg-teal-950/30 border-teal-500 dark:border-[#C7F303] ring-1 ring-teal-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {tempOpt.title}
                    </div>
                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {tempOpt.desc}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {active ? (
                      <span className="w-4 h-4 rounded-full bg-teal-600 dark:bg-[#C7F303] text-white dark:text-[#0E1300] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-700 block" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 4: LAS 4 MEMORIAS DEL AGENTE (MEMORY_NODES — UI Propia por Memoria)
     ═════════════════════════════════════════════════════════════════════════ */
  if (activeNode.shape === 'circle_memory') {
    // 4.1 MEMORIA DE EMPRESA ACTIVA
    if (cleanId.includes('company')) {
      const companyBlocks = [
        {
          id: 'Razón Social, NIT y Actividad Económica (CIIU)',
          value: activeCompanyInfo?.companyName
            ? `${activeCompanyInfo.companyName} · NIT ${activeCompanyInfo.nit || 'N/A'} · CIIU ${activeCompanyInfo.ciiu || 'N/A'} (${activeCompanyInfo.economicActivity || 'Actividad registrada'})`
            : resolvedCompanyFull,
        },
        {
          id: 'Clase de Riesgo, ARL Afiliada y Tasa de Cotización',
          value: activeCompanyInfo?.arl
            ? `ARL ${activeCompanyInfo.arl} · Riesgo ${activeCompanyInfo.riskLevel || 'I'}`
            : 'Riesgo y ARL registrados en Somos SST',
        },
        {
          id: 'Total de Trabajadores Activos y Distribución por Sedes',
          value: activeCompanyInfo
            ? `${activeCompanyInfo.workerCount || 0} trabajador(es) · ${activeCompanyInfo.sedesCount || 1} sede(s) (${activeCompanyInfo.city || 'Sede Principal'})`
            : 'Plantilla y sedes activas',
        },
        {
          id: 'Responsable del SG-SST y Licencia Vigente',
          value: activeCompanyInfo
            ? `Rep. Legal: ${activeCompanyInfo.legalRepresentative || 'N/A'} · Resp. SST: ${activeCompanyInfo.responsibleSST || 'N/A'} (Lic. ${activeCompanyInfo.licenseNumber || 'N/A'})`
            : 'Representante Legal y Responsable SST',
        },
      ];
      return (
        <div className="space-y-3">
          {resolvedCompanyName && (
            <div className="p-3 rounded-2xl border border-pink-300 dark:border-pink-800/70 bg-pink-50/40 dark:bg-pink-950/20 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-black text-pink-950 dark:text-[#C7F303]">
                🏢 Memoria Vinculada a la Empresa Activa: «{resolvedCompanyFull}»
              </span>
              {activeCompanyInfo && (
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  ARL {activeCompanyInfo.arl || 'N/A'} · Riesgo {activeCompanyInfo.riskLevel || 'I'} ·{' '}
                  {activeCompanyInfo.workerCount || 0} trabajador(es) · {activeCompanyInfo.city || 'Colombia'}
                </span>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {companyBlocks.map((blk) => {
              const checked = selectedFields.length === 0 || selectedFields.includes(blk.id);
              return (
                <label
                  key={blk.id}
                  onClick={() => toggleFieldChip(blk.id)}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                    checked
                      ? 'bg-pink-50/60 dark:bg-pink-950/25 border-pink-400 dark:border-pink-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 mt-0.5 ${
                      checked
                        ? 'bg-pink-600 border-pink-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {blk.id}
                    </div>
                    <div className="text-[10.5px] font-semibold text-pink-700 dark:text-[#C7F303] mt-0.5 truncate">
                      {blk.value}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          {renderReportHistorySection()}
        </div>
      );
    }

    // 4.2 MEMORIA BITÁCORA ANTI-DUPLICADOS (`Remove Duplicates` con Ledger `processedEntityKeys` en `AutomationLog`)
    if (cleanId.includes('antiduplicate')) {
      const currentDedupWindow = currentCfg.dedupWindow || '7d';
      return (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl border border-teal-500/35 bg-gradient-to-br from-teal-500/5 via-emerald-500/5 to-cyan-500/5 dark:from-slate-900 dark:to-slate-900/80 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-teal-900 dark:text-[#C7F303] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-[#C7F303] shrink-0" />
                Ledger Con Estado Anti-Duplicados (Estilo «Remove Duplicates» de n8n)
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-[10px] font-extrabold text-teal-800 dark:text-teal-300">
                Ventana activa: {currentDedupWindow}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Guarda las llaves únicas de negocio (<code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-[10px]">processedEntityKeys</code>) en <code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-[10px]">AutomationLog</code> y descarta registros ya alertados dentro de la ventana <code className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 font-mono text-[10px]">dedupWindow</code> <strong>antes</strong> de evaluar la compuerta <em>Condición Si/No</em> y del Agente IA (evitando correos repetidos y tarjetas duplicadas en Kanban ACPM).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                🛡️ Ventana de Tiempo Anti-Duplicados (`dedupWindow`)
              </label>
              <div className="flex flex-wrap items-center gap-2 py-1 px-1">
                {[
                  {
                    id: '24h',
                    badge: '24h',
                    label: 'Últimas 24h — Omitir llaves ya procesadas hoy',
                    variant: 'amber' as const,
                  },
                  {
                    id: '7d',
                    badge: '7d',
                    label: '7 días — Omitir llaves de la última semana',
                    variant: 'rose' as const,
                  },
                  {
                    id: '30d',
                    badge: '30d',
                    label: '30 días — Omitir llaves del último mes',
                    variant: 'purple' as const,
                  },
                  {
                    id: 'all',
                    badge: 'all',
                    label: 'Histórico Total — Todo el ledger en AutomationLog',
                    variant: 'teal' as const,
                  },
                ].map((win) => {
                  const active = currentDedupWindow === win.id;
                  return (
                    <ExpandableButton
                      key={win.id}
                      type="button"
                      size="sm"
                      variant={active ? win.variant : 'neutral'}
                      isActive={active}
                      badge={win.badge}
                      icon={<Clock className="w-3.5 h-3.5" />}
                      label={win.label}
                      onClick={() =>
                        onUpdateNodeConfig(activeNode.key, { dedupWindow: win.id as any })
                      }
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                🔑 Clave para detectar si un registro ya fue procesado
              </label>
              <div className="flex flex-wrap items-center gap-2 py-1 px-1">
                {[
                  {
                    id: 'cedula',
                    label: 'Por Cédula del Trabajador',
                    variant: 'teal' as const,
                  },
                  {
                    id: 'standard_id',
                    label: 'Por Código / ID del Hallazgo',
                    variant: 'purple' as const,
                  },
                  {
                    id: 'filename',
                    label: 'Por Nombre de Archivo o ID de Correo',
                    variant: 'cyan' as const,
                  },
                ].map((dk) => {
                  const active = (currentCfg.dedupKey || 'cedula') === dk.id;
                  return (
                    <ExpandableButton
                      key={dk.id}
                      type="button"
                      size="sm"
                      variant={active ? dk.variant : 'neutral'}
                      isActive={active}
                      icon={<Check className="w-3.5 h-3.5" />}
                      label={dk.label}
                      onClick={() =>
                        onUpdateNodeConfig(activeNode.key, { dedupKey: dk.id as any })
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
          {renderSimpleReadOnlyPreviewTable('📜 Últimas llaves registradas en Bitácora Anti-Duplicados')}
        </div>
      );
    }

    // 4.3 MEMORIA NORMATIVA SST COLOMBIANA (100 DOCUMENTOS .MD DE LA BASE DE DATOS NORMATIVA DE TENSHI)
    if (cleanId.includes('procedural')) {
      const selectedNorms = currentCfg.legalStandards || [
        'VADEMECUM_MAESTRO_SST_COLOMBIA_2026',
        'Decreto_1072_de_2015_Por_medio_del_cual_se_expide_el_Decreto__nico_Reglamentario_del_Sector_Trabajo',
        'Resoluci_n_312_de_2019_Estandares_minimos_en_Seguridad_y_Salud_en_el_Trabajo',
        'Resoluci_n_1843_DE_2025_Por_la_cual_se_regula_la_pr_ctica_de_evaluaciones_m_dicas_ocupacionales__y_se_dictan_otras_disposiciones',
      ];

      const filteredNormativeDocs = TENSHI_NORMATIVE_MARKDOWN_DOCS.filter((doc) => {
        const matchCat =
          normativeCategoryFilter === 'all' || doc.category === normativeCategoryFilter;
        if (!matchCat) return false;
        if (!normativeSearchQuery.trim()) return true;
        const q = normativeSearchQuery.toLowerCase().trim();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.fileName.toLowerCase().includes(q) ||
          doc.summary.toLowerCase().includes(q) ||
          doc.categoryLabel.toLowerCase().includes(q)
        );
      });

      const selectNormativeCombo = (ids: string[]) => {
        onUpdateNodeConfig(activeNode.key, {
          legalStandards: ids,
          selectedRecordIds: ids,
          recordFilterMode: 'selected',
        });
      };

      return (
        <div className="space-y-3.5">
          {/* Cabecera y Combos Rápidos de la Base de Datos Normativa Markdown de Tenshi */}
          <div className="p-3.5 rounded-2xl border border-pink-200 dark:border-slate-700 bg-pink-50/30 dark:bg-slate-800/50 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-pink-600 dark:text-[#C7F303]" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Base de Datos Normativa en Markdown de Tenshi ({TENSHI_NORMATIVE_MARKDOWN_DOCS.length} Archivos .MD Oficiales)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-600 text-white">
                  {selectedNorms.length} normas activas
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 py-0.5 px-1">
                <ExpandableButton
                  size="sm"
                  variant="emerald"
                  icon={<Check className="w-3.5 h-3.5" />}
                  label={`Todas (${TENSHI_NORMATIVE_MARKDOWN_DOCS.length} .md)`}
                  onClick={() =>
                    selectNormativeCombo(TENSHI_NORMATIVE_MARKDOWN_DOCS.map((d) => d.id))
                  }
                />
                <ExpandableButton
                  size="sm"
                  variant="teal"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  label="Vademécum + Vigentes 2024–2026"
                  onClick={() =>
                    selectNormativeCombo(
                      TENSHI_NORMATIVE_MARKDOWN_DOCS.filter(
                        (d) =>
                          d.category === 'vademecum_2026' ||
                          d.category === 'sentencias_circulares',
                      ).map((d) => d.id),
                    )
                  }
                />
                <ExpandableButton
                  size="sm"
                  variant="purple"
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  label="Núcleo SG-SST (1072, 0312, 1843, 4272, PESV)"
                  onClick={() =>
                    selectNormativeCombo([
                      'VADEMECUM_MAESTRO_SST_COLOMBIA_2026',
                      'Decreto_1072_de_2015_Por_medio_del_cual_se_expide_el_Decreto__nico_Reglamentario_del_Sector_Trabajo',
                      'Resoluci_n_312_de_2019_Estandares_minimos_en_Seguridad_y_Salud_en_el_Trabajo',
                      'Resoluci_n_1843_DE_2025_Por_la_cual_se_regula_la_pr_ctica_de_evaluaciones_m_dicas_ocupacionales__y_se_dictan_otras_disposiciones',
                      'Resoluci_n_3461_de_2025_Por_el_cual_se_derroga_las_Resoluciones_652_y_1356_de_2012._Comit__de_Convivencia_Laboral',
                      'Resoluci_n_4272_de_2021_Por_la_cual_se_establecen_',
                      'Resoluci_n_40595_de_2022_Implementacion_PESV',
                      'Decreto_1496_de_2018_Por_el_cual_se_adopta_el_Sist',
                      'Resoluci_n_2764_de_2022_Por_la_cual_se_adopta_la_Bater_a_de_instrumentos_para_la_evaluaci_n_de_factores_de_Riesgo_Psicosocial',
                    ])
                  }
                />
                <ExpandableButton
                  size="sm"
                  variant="indigo"
                  icon={<BookOpen className="w-3.5 h-3.5" />}
                  label="Batería y 14 Protocolos Psicosociales"
                  onClick={() =>
                    selectNormativeCombo(
                      TENSHI_NORMATIVE_MARKDOWN_DOCS.filter(
                        (d) => d.category === 'psicosocial_protocolos',
                      ).map((d) => d.id),
                    )
                  }
                />
                {selectedNorms.length > 0 && (
                  <ExpandableButton
                    size="sm"
                    variant="rose"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    label="Limpiar"
                    onClick={() => selectNormativeCombo([])}
                  />
                )}
              </div>
            </div>

            {/* Pestañas de Categoría Normativa + Buscador */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2 py-1 px-1">
                {TENSHI_NORMATIVE_CATEGORIES.map((cat, catIdx) => {
                  const isAct = normativeCategoryFilter === cat.id;
                  const countInCat =
                    cat.id === 'all'
                      ? TENSHI_NORMATIVE_MARKDOWN_DOCS.length
                      : TENSHI_NORMATIVE_MARKDOWN_DOCS.filter((d) => d.category === cat.id).length;
                  const shortTitle = cat.label.replace(/\s*\(\d+\)$/, '');
                  const catVariants = [
                    'rose',
                    'teal',
                    'purple',
                    'amber',
                    'cyan',
                    'indigo',
                    'emerald',
                    'fuchsia',
                  ] as const;
                  return (
                    <ExpandableButton
                      key={cat.id}
                      type="button"
                      size="sm"
                      variant={isAct ? catVariants[catIdx % catVariants.length] : 'neutral'}
                      isActive={isAct}
                      icon={<Scale className="w-3.5 h-3.5" />}
                      badge={countInCat}
                      label={shortTitle}
                      onClick={() => setNormativeCategoryFilter(cat.id)}
                    />
                  );
                })}
              </div>

              <div className="relative min-w-0 sm:min-w-[220px] flex-1 max-w-md w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={normativeSearchQuery}
                  onChange={(e) => setNormativeSearchQuery(e.target.value)}
                  placeholder="Buscar entre los 100 archivos .md (ej. 1843, 0312, burnout, sentencia, CST)..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Cuadrícula Seleccionable de las 100 Normas en Markdown (.md) de Tenshi */}
          <div className="max-h-[340px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredNormativeDocs.map((doc) => {
              const active =
                selectedNorms.includes(doc.id) || selectedNorms.includes(doc.title);
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? selectedNorms.filter((n) => n !== doc.id && n !== doc.title)
                      : [...selectedNorms, doc.id];
                    onUpdateNodeConfig(activeNode.key, {
                      legalStandards: next,
                      selectedRecordIds: next,
                      recordFilterMode: 'selected',
                    });
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                    active
                      ? 'bg-pink-50/80 dark:bg-slate-800 border-pink-500 dark:border-[#C7F303] ring-1 ring-pink-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-pink-400'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                        📘 {doc.title}
                      </span>
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 mt-0.5 ${
                          active
                            ? 'bg-pink-600 dark:bg-[#C7F303] border-pink-600 dark:border-[#C7F303] text-white dark:text-[#0E1300]'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-pink-100 dark:bg-pink-950/70 text-pink-800 dark:text-pink-300 text-[9px] font-black uppercase">
                        {doc.badge}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-mono truncate max-w-[180px]">
                        {doc.fileName}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {doc.sizeKb} KB
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-snug">
                    {doc.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // 4.4 MEMORIA DOCUMENTAL RAG (DOCUMENTOS VIVOS Y NOTEBOOKLM)
    return (
      <div className="space-y-3">
        <div className="p-3.5 rounded-2xl border border-pink-200 dark:border-slate-700 bg-pink-50/30 dark:bg-slate-800/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase text-pink-800 dark:text-pink-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              📚 Memoria RAG Documental (Cuadernos Google NotebookLM + Documentos Vivo WAPPY)
            </span>
            <div className="flex flex-wrap items-center gap-2 py-0.5 px-1">
              {[
                {
                  id: 'notebooklm_and_live_docs',
                  label: '📚 Consultar Cuadernos NotebookLM + Documentos Vivo WAPPY',
                  instruction: 'Consultar simultáneamente los cuadernos de Google NotebookLM y los Documentos Vivo de la empresa con cita exacta.',
                  variant: 'rose' as const,
                },
                {
                  id: 'only_notebooklm',
                  label: '📓 Consultar Únicamente Cuadernos de Google NotebookLM',
                  instruction: 'Consultar los cuadernos RAG activos en Google NotebookLM citando fuente y sección.',
                  variant: 'purple' as const,
                },
                {
                  id: 'only_live_docs',
                  label: '📄 Consultar Únicamente Documentos Vivo en Somos SST',
                  instruction: 'Consultar los reglamentos, actas, políticas y procedimientos guardados en Documentos Vivo de Somos SST.',
                  variant: 'teal' as const,
                },
              ].map((src) => {
                const isSelected = (currentCfg.customInstruction || '').includes(src.instruction);
                return (
                  <ExpandableButton
                    key={src.id}
                    type="button"
                    size="sm"
                    variant={isSelected ? src.variant : 'neutral'}
                    isActive={isSelected}
                    icon={<BookOpen className="w-3.5 h-3.5" />}
                    label={src.label}
                    onClick={() =>
                      onUpdateNodeConfig(activeNode.key, { customInstruction: src.instruction })
                    }
                  />
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📓 Cuaderno de NotebookLM o Colección Documental Específica
              </label>
              <input
                type="text"
                value={currentCfg.documentTitle || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { documentTitle: e.target.value })
                }
                placeholder="Ej: Cuaderno Normativo SG-SST / Procedimientos de Alto Riesgo / RIT y RHS"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🔍 Consulta Semántica o Directriz de Cita RAG
              </label>
              <input
                type="text"
                value={currentCfg.customInstruction || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
                }
                placeholder="Ej: Extraer citas textuales con nombre del documento y cruzar contra el hallazgo..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
        {renderSimpleReadOnlyPreviewTable('📚 Documentos Vivos y Cuadernos NotebookLM Indexados')}
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 7: BITÁCORA Y SALIDA (OUTPUT_ACTION_NODES — 11 Nodos Limpios Estilo n8n)
     ═════════════════════════════════════════════════════════════════════════ */
  if (activeNode.shape === 'square_output') {
    // 7.1 BITÁCORA A GMAIL (Envío Limpio y Directo del Mensaje / Informe Listo)
    if (cleanId.includes('email')) {
      const companyDefaultEmail = String(activeCompanyInfo?.email || '').trim();
      const canAddCompanyEmail =
        Boolean(companyDefaultEmail) &&
        !String(emailsStr || '')
          .toLowerCase()
          .includes(companyDefaultEmail.toLowerCase());
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-xl border border-teal-200 dark:border-teal-800/70 bg-teal-50/40 dark:bg-teal-950/20 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            ✉️ <strong>Salida directa:</strong> Cuando el flujo llegue a este nodo (por conexión directa o por la rama activa de <em>Condición Sí/No</em>), enviará automáticamente el mensaje o informe ejecutivo listo del paso anterior.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200">
                  📧 Para (Correos de destinatarios separados por coma) *
                </label>
                {canAddCompanyEmail && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = emailsStr?.trim()
                        ? `${emailsStr.trim()}, ${companyDefaultEmail}`
                        : companyDefaultEmail;
                      onChangeEmailsStr && onChangeEmailsStr(nextVal);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-teal-600/10 hover:bg-teal-600/20 border border-teal-500/30 text-[10px] font-extrabold text-teal-800 dark:text-[#C7F303] transition"
                  >
                    + Usar correo empresa ({companyDefaultEmail})
                  </button>
                )}
              </div>
              <input
                type="text"
                value={emailsStr}
                onChange={(e) => onChangeEmailsStr && onChangeEmailsStr(e.target.value)}
                placeholder="Ej: sst@empresa.com, gerencia@empresa.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                👥 CC / Copia Opcional (Separados por coma)
              </label>
              <input
                type="text"
                value={currentCfg.emailCc || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { emailCc: e.target.value })
                }
                placeholder="Ej: copasst@empresa.com, talento.humano@empresa.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              ✉️ Asunto del Correo (Opcional — automático según el flujo si se deja vacío)
            </label>
            <input
              type="text"
              value={currentCfg.emailSubject || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { emailSubject: e.target.value })
              }
              placeholder="Ej: [SG-SST] Informe Ejecutivo y Hallazgos Detectados"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>

          <label className="inline-flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={currentCfg.attachOfficialAppReport !== false}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { attachOfficialAppReport: e.target.checked })
              }
              className="rounded border-teal-500 text-teal-600"
            />
            <span>
              📄 Incluir Informe Oficial HTML corporativo si el flujo genera uno en un aplicativo
            </span>
          </label>
        </div>
      );
    }

    // 7.2 NOTIFICAR EN WAPPY + TENSHI VOZ
    if (cleanId.includes('wappy_notification')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                🔔 Nivel de Prioridad de la Notificación en WAPPY
              </label>
              <div className="flex flex-wrap items-center gap-2 py-1 px-1">
                {[
                  { id: 'info', label: '🟢 Prioridad Informativa (Verde)', variant: 'emerald' as const },
                  { id: 'warn', label: '🟡 Prioridad Preventiva (Ámbar)', variant: 'amber' as const },
                  { id: 'critical', label: '🔴 Prioridad Crítica Urgente (Roja)', variant: 'danger' as const },
                ].map((p) => {
                  const active = (currentCfg.alertPriority || 'warn') === p.id;
                  return (
                    <ExpandableButton
                      key={p.id}
                      type="button"
                      size="sm"
                      variant={active ? p.variant : 'neutral'}
                      isActive={active}
                      icon={<Bell className="w-3.5 h-3.5" />}
                      label={p.label}
                      onClick={() =>
                        onUpdateNodeConfig(activeNode.key, { alertPriority: p.id as any })
                      }
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex items-end">
              <label className="w-full flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={currentCfg.tenshiSpeakSummary !== false}
                  onChange={(e) =>
                    onUpdateNodeConfig(activeNode.key, { tenshiSpeakSummary: e.target.checked })
                  }
                  className="rounded border-teal-500 text-teal-600"
                />
                <span>🐱 Hacer que Tenshi Avatar 3D anuncie el resumen en voz al entrar</span>
              </label>
            </div>
          </div>
        </div>
      );
    }

    // 7.3 ALERTA WHATSAPP / MÓVIL
    if (cleanId.includes('whatsapp')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              📱 Número(s) de WhatsApp Destino (con indicativo, ej. +57)
            </label>
            <input
              type="text"
              value={currentCfg.whatsappNumbers || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { whatsappNumbers: e.target.value })
              }
              placeholder="Ej: +573102913651, +573001234567"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              💬 Instrucción de Formato Corto (Opcional)
            </label>
            <input
              type="text"
              value={currentCfg.customInstruction || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
              }
              placeholder="Ej: Enviar resumen corto con cantidad de alertas críticas y responsable..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
        </div>
      );
    }

    // 7.4 AGENDAR EN GOOGLE CALENDAR / AGENDA SST
    if (cleanId.includes('calendar')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📅 Título del Evento / Inspección / Comité
              </label>
              <input
                type="text"
                value={currentCfg.calendarEventTitle || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { calendarEventTitle: e.target.value })
                }
                placeholder="Ej: Reunión Extraordinaria COPASST / Revisión SST"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                ⏱️ Duración del Evento
              </label>
              <select
                value={currentCfg.calendarDurationMinutes || 60}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, {
                    calendarDurationMinutes: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora (60 min)</option>
                <option value={90}>1 hora y 30 min</option>
                <option value={120}>2 horas</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                👥 Correos de Invitados (Opcional, separados por coma)
              </label>
              <input
                type="text"
                value={currentCfg.calendarAttendees || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { calendarAttendees: e.target.value })
                }
                placeholder="Ej: copasst@empresa.com, lider.sst@empresa.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      );
    }

    // 7.5 CREAR ACTIVIDAD EN EL CENTRO DE CONTROL (EN CUALQUIERA DE SUS ETAPAS)
    if (cleanId.includes('acpm_task')) {
      const activeStage = currentCfg.kanbanStatus || 'todo';
      const controlStages: Array<{
        id: 'todo' | 'in_progress' | 'due_soon' | 'overdue' | 'done';
        badge: string;
        label: string;
        variant: 'teal' | 'cyan' | 'amber' | 'danger' | 'compliance-ok';
        icon: React.ReactNode;
      }> = [
        {
          id: 'todo',
          badge: '1 · Pendientes',
          label: 'Etapa 1: Pendientes (Por Hacer)',
          variant: 'teal',
          icon: <Kanban className="w-3.5 h-3.5" />,
        },
        {
          id: 'in_progress',
          badge: '2 · En Ejecución',
          label: 'Etapa 2: En Ejecución / En Curso',
          variant: 'cyan',
          icon: <Activity className="w-3.5 h-3.5" />,
        },
        {
          id: 'due_soon',
          badge: '3 · Próximas a Vencer',
          label: 'Etapa 3: Próximas a Vencer (Seguimiento)',
          variant: 'amber',
          icon: <Clock className="w-3.5 h-3.5" />,
        },
        {
          id: 'overdue',
          badge: '4 · Vencidas (Alerta)',
          label: 'Etapa 4: Vencidas (Alerta Crítica)',
          variant: 'danger',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        },
        {
          id: 'done',
          badge: '5 · Completadas',
          label: 'Etapa 5: Completadas (Evidencia Cerrada)',
          variant: 'compliance-ok',
          icon: <Check className="w-3.5 h-3.5" />,
        },
      ];

      return (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60">
            <label className="block text-xs font-extrabold uppercase text-amber-900 dark:text-amber-300 mb-1.5">
              📋 1. Elige en qué Etapa del Centro de Control se creará la Actividad
            </label>
            <div className="flex flex-wrap items-center gap-2.5 py-1 px-1">
              {controlStages.map((st, stIdx) => (
                <ExpandableButton
                  key={st.id}
                  type="button"
                  size="sm"
                  variant={st.variant}
                  isActive={activeStage === st.id}
                  icon={st.icon}
                  badge={stIdx + 1}
                  label={st.label}
                  title={st.label}
                  onClick={() => onUpdateNodeConfig(activeNode.key, { kanbanStatus: st.id })}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🛡️ 2. Tipo de Acción (ACPM)
              </label>
              <select
                value={currentCfg.kanbanActionType || 'correctiva'}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { kanbanActionType: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="correctiva">🛠️ Acción Correctiva</option>
                <option value="preventiva">🛡️ Acción Preventiva</option>
                <option value="mejora">🚀 Acción de Mejora</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🚨 3. Prioridad en el Centro de Control
              </label>
              <select
                value={currentCfg.kanbanPriority || 'high'}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { kanbanPriority: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="high">🔴 Prioridad Alta (Crítica)</option>
                <option value="medium">🟡 Prioridad Media (Preventiva)</option>
                <option value="low">🟢 Prioridad Baja (Mejora)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📆 4. Plazo de Cumplimiento (Días)
              </label>
              <select
                value={currentCfg.kanbanDueDays || 7}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { kanbanDueDays: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value={1}>Inmediato (24 horas)</option>
                <option value={3}>3 días</option>
                <option value={7}>7 días (1 semana)</option>
                <option value={15}>15 días</option>
                <option value={30}>30 días (1 mes)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                👤 5. Responsable Asignado
              </label>
              <input
                type="text"
                value={currentCfg.kanbanAssignee || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { kanbanAssignee: e.target.value })
                }
                placeholder="Ej: Coordinador SST / Jefe de Planta"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              ✏️ 6. Prefijo o Título de la Actividad (Opcional)
            </label>
            <input
              type="text"
              value={currentCfg.kanbanTaskTitle || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { kanbanTaskTitle: e.target.value })
              }
              placeholder="Ej: Plan de Acción Investigación ATEL — Seguimiento de Controles"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
        </div>
      );
    }

    // 7.6 SALIDA: GUARDAR / ALIMENTAR APLICATIVOS EN SOMOS SST (somos_sst_update)
    if (cleanId.includes('somos_sst_update')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🎯 Aplicativo o Hito Destino a Actualizar
              </label>
              <input
                type="text"
                value={currentCfg.documentTitle || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { documentTitle: e.target.value })
                }
                placeholder="Ej: Hito 7 · Investigación ATEL, Hito 2 · Sociodemográfico"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                ⚙️ Clave de Conciliación / Regla al Guardar (Opcional)
              </label>
              <input
                type="text"
                value={currentCfg.customInstruction || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
                }
                placeholder="Ej: Conciliar por cédula del trabajador sin duplicar expedientes..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      );
    }

    // 7.7 SALIDA: DOCUMENTO FORMAL EN LIVEEDITOR (canvas_doc)
    if (cleanId.includes('canvas_doc')) {
      const activeTpl = currentCfg.documentTemplate || 'Informe Técnico';
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-fuchsia-50/50 dark:bg-fuchsia-950/20 border border-fuchsia-200/80 dark:border-fuchsia-800/60">
            <label className="block text-xs font-extrabold uppercase text-fuchsia-900 dark:text-fuchsia-300 mb-1.5">
              🎨 1. Plantilla Formal del Documento en LiveEditor (Exportable a Word .docx y PDF)
            </label>
            <div className="flex flex-wrap items-center gap-2.5 py-1 px-1">
              {[
                { id: 'Informe Investigación ATEL Res. 1401', label: '📋 Informe Oficial de Investigación ATEL (Res. 1401)', variant: 'fuchsia' as const },
                { id: 'Acta Oficial con Cabezote y Firmas', label: '🏛️ Acta Oficial de Comité (COPASST / CCL / PESV) con Firmas', variant: 'purple' as const },
                { id: 'Informe Ejecutivo de Auditoría 0312', label: '📊 Informe Ejecutivo de Auditoría y Brechas Res. 0312', variant: 'teal' as const },
                { id: 'Procedimiento / Programa SG-SST', label: '📑 Procedimiento Operativo Estándar (PON) o Programa PVE', variant: 'indigo' as const },
              ].map((tpl) => (
                <ExpandableButton
                  key={tpl.id}
                  type="button"
                  size="sm"
                  variant={activeTpl === tpl.id ? tpl.variant : 'neutral'}
                  isActive={activeTpl === tpl.id}
                  icon={<FileText className="w-3.5 h-3.5" />}
                  label={tpl.label}
                  onClick={() =>
                    onUpdateNodeConfig(activeNode.key, { documentTemplate: tpl.id })
                  }
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📄 2. Título Oficial del Documento Vivo
              </label>
              <input
                type="text"
                value={currentCfg.documentTitle || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { documentTitle: e.target.value })
                }
                placeholder="Ej: Informe de Investigación de Accidente de Trabajo — Res. 1401 de 2007"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                ✍️ 3. Nota de Formato / Bloques de Firma (Opcional)
              </label>
              <input
                type="text"
                value={currentCfg.customInstruction || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
                }
                placeholder="Ej: Incluir cabezote con NIT, tablas con bordes sólidos y firma de Representante Legal + Responsable SST"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      );
    }

    // 7.8 RESTO DE SALIDAS (Google Docs, Google Sheets, Google Slides, Antigravity Local/Cloud Report)
    const isLocalAntigravityOut = cleanId === 'antigravity_local_report';
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              {isLocalAntigravityOut
                ? '💻 Ruta exacta de carpeta o archivo donde guardar en tu Mac/PC'
                : `📄 Título / Destino en «${resolvedNodeDisplayTitle}»`}
            </label>
            <input
              type="text"
              value={
                isLocalAntigravityOut
                  ? currentCfg.watchFolderPath || currentCfg.documentTitle || ''
                  : currentCfg.documentTitle || currentCfg.driveFolderName || ''
              }
              onChange={(e) => {
                const cleaned = e.target.value.replace(/^["']+|["']+$/g, '');
                if (isLocalAntigravityOut) {
                  onUpdateNodeConfig(activeNode.key, {
                    watchFolderPath: cleaned,
                    documentTitle: cleaned,
                  });
                } else {
                  onUpdateNodeConfig(activeNode.key, {
                    documentTitle: e.target.value,
                    driveFolderName: e.target.value,
                  });
                }
              }}
              placeholder={
                cleanId.includes('sheets')
                  ? 'Ej: Matriz_Control_SST_2026 (Pestaña: Vencimientos)'
                  : cleanId.includes('slides')
                    ? 'Ej: Presentacion_Alta_Direccion_SG_SST_2026'
                    : cleanId.includes('docs')
                      ? 'Ej: Informe_Auditoria_SG_SST_2026'
                      : isLocalAntigravityOut
                        ? 'Ej: /Users/venta/Documents/Reportes_WAPPY/informe_sst.md'
                        : 'Ej: Reportes_Cloud_WAPPY/bitacora_ejecucion.md'
              }
              className={`w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white ${
                isLocalAntigravityOut ? 'font-mono' : ''
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              ⚙️ Nota de Entrega / Formato (Opcional)
            </label>
            <input
              type="text"
              value={currentCfg.customInstruction || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
              }
              placeholder="Ej: Guardar con fecha ISO en el nombre del archivo..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 8: NODOS LÓGICOS (CONDICIÓN SI/NO, LOOP, MERGE, APROBACIÓN) + SKILLS / REGLAS / SCRAPING
     ═════════════════════════════════════════════════════════════════════════ */
  if (activeNode.shape === 'if' || activeNode.key === 'if_router') {
    const allNodeCfgs = workflowNodes?.canvasLayout?.nodeConfigs;
    const altIfCfg =
      activeNode.key === 'if_router'
        ? allNodeCfgs?.['if_condition']
        : allNodeCfgs?.['if_router'];

    const resolvedIfPlacement: 'pre_agent' | 'post_agent' =
      (currentCfg.ifPlacement || altIfCfg?.ifPlacement) === 'pre_agent'
        ? 'pre_agent'
        : 'post_agent';

    const hasStage2SourcesInFlow = (() => {
      const extCount = Array.isArray(workflowNodes?.extractors)
        ? workflowNodes!.extractors!.length
        : 0;
      if (extCount > 0) return true;
      const hitosArr = Array.isArray(workflowNodes?.hitos) ? workflowNodes!.hitos! : [];
      const hasSourceHito = hitosArr.some((hid) => {
        const hCfg = {
          ...(allNodeCfgs?.[hid] || {}),
          ...(allNodeCfgs?.[`hito_${hid}`] || {}),
          ...(allNodeCfgs?.[`tool_hitos_${hid}`] || {}),
        };
        if (hCfg.hitoRole === 'source_read') return true;
        if (hCfg.hitoRole === 'target_write_report') return false;
        if (
          ['write_and_report', 'write_and_update', 'generate_report'].includes(
            String(hCfg.appActionMode || ''),
          ) ||
          hCfg.generateAppReport === true ||
          ['write_register', 'audit_and_update'].includes(String(hCfg.hitoOperationMode || ''))
        ) {
          return false;
        }
        return true;
      });
      if (hasSourceHito) return true;
      const cNodes = Array.isArray(workflowNodes?.canvasLayout?.customNodes)
        ? workflowNodes!.canvasLayout!.customNodes!
        : [];
      return cNodes.some((cn) => String(cn?.nodeType || cn?.key || '').includes('scraper'));
    })();

    const rawCondType =
      currentCfg.ifConditionType || currentCfg.ifConditionMode || 'critical_findings';
    const resolvedIfConditionType =
      rawCondType === 'ai_evaluation'
        ? 'ai_verdict'
        : rawCondType === 'custom_rule'
          ? 'keyword_match'
          : [
                'critical_findings',
                'new_external_items',
                'numeric_threshold',
                'keyword_match',
                'ai_verdict',
                'always_branch',
              ].includes(rawCondType)
            ? rawCondType
            : 'critical_findings';

    const computeIfConditionLabel = (condType: string, expr?: string): string => {
      if (condType === 'critical_findings') return '¿Críticos abiertos?';
      if (condType === 'new_external_items') return '¿Nuevos ítems >= 1?';
      if (condType === 'ai_verdict' || condType === 'ai_evaluation') {
        return '¿Veredicto IA = SÍ?';
      }
      if (condType === 'always_branch') return 'Evaluar Sí / No';
      const trimmed = (expr ?? currentCfg.ifRuleExpression ?? '').trim();
      if (trimmed) {
        return trimmed.length > 26 ? `${trimmed.slice(0, 25)}…` : trimmed;
      }
      return condType === 'numeric_threshold' ? '¿Supera umbral?' : 'Regla coincidencia';
    };

    const connectedOutputsList =
      workflowNodes?.outputs !== undefined
        ? Array.isArray(workflowNodes.outputs)
          ? workflowNodes.outputs
          : []
        : ['email_report'];

    return (
      <div className="space-y-3.5">
        {/* Selector Causal: Ubicación de la Compuerta (`ifPlacement`) */}
        <div className="p-3.5 rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-slate-900 dark:to-slate-900/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-black uppercase tracking-wide text-emerald-900 dark:text-[#C7F303] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-[#C7F303] shrink-0" />
              Ubicación Causal de la Compuerta (`ifPlacement`)
            </label>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
              {resolvedIfPlacement === 'pre_agent'
                ? '⚡ Pre-Agente (0 Tokens en NO)'
                : '🤖 Post-Agente (Semántico)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {[
              {
                id: 'pre_agent' as const,
                title: '⚡ Antes del Agente IA (Filtro Determinista · 0 Tokens en NO)',
                desc: 'Evalúa brechas de BD o archivos nuevos en Etapa 2 antes de llamar a la IA. Si es NO, corta directo sin gastar tokens.',
              },
              {
                id: 'post_agent' as const,
                title: '🤖 Después del Agente IA (Veredicto Semántico IA)',
                desc: 'El Agente analiza entradas abiertas (QR, voz, correo libre) y emite el marcador [VEREDICTO_IF: SI|NO].',
              },
            ].map((plOpt) => {
              const isSelected = resolvedIfPlacement === plOpt.id;
              return (
                <button
                  key={plOpt.id}
                  type="button"
                  onClick={() =>
                    onUpdateNodeConfig(activeNode.key, {
                      ifPlacement: plOpt.id,
                      ...(plOpt.id === 'post_agent' &&
                      resolvedIfConditionType === 'new_external_items'
                        ? {
                            ifConditionType: 'ai_verdict',
                            ifConditionMode: 'ai_verdict',
                            ifConditionLabel: computeIfConditionLabel('ai_verdict'),
                          }
                        : {}),
                    })
                  }
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    isSelected
                      ? 'bg-emerald-50/90 dark:bg-slate-800 border-emerald-600 dark:border-[#C7F303] ring-1 ring-emerald-500/25 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                      {plOpt.title}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-[#C7F303] stroke-[3] shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {plOpt.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {resolvedIfPlacement === 'pre_agent' && !hasStage2SourcesInFlow && (
            <div className="p-2.5 rounded-xl border border-amber-400/50 bg-amber-500/10 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              💡 Para activar la compuerta determinista antes del Agente IA en el lienzo, conecta al menos 1 Extractor o Aplicativo Hito en modo <strong>Fuente de Lectura (Etapa 2)</strong>.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold uppercase text-emerald-700 dark:text-emerald-300 mb-1">
              🔀 1. ¿Qué evalúa esta Condición Si / No? (`ifConditionType`)
            </label>
            <select
              value={resolvedIfConditionType}
              onChange={(e) => {
                const nextType = e.target.value;
                onUpdateNodeConfig(activeNode.key, {
                  ifConditionType: nextType as any,
                  ifConditionMode: nextType,
                  ifConditionLabel: computeIfConditionLabel(nextType, currentCfg.ifRuleExpression),
                  ...(nextType === 'ai_verdict' && resolvedIfPlacement === 'pre_agent'
                    ? { ifPlacement: 'post_agent' }
                    : {}),
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="critical_findings">
                🚨 Brechas Críticas / Vencimientos en BD (&gt;= 1)
              </option>
              <option value="new_external_items">
                📂 Archivos / Correos Nuevos No Procesados (&gt;= 1)
              </option>
              <option value="numeric_threshold">
                🔢 Umbral Numérico sobre Conteo / Indicador Extraído
              </option>
              <option value="keyword_match">
                🔎 Coincidencia de Palabras Clave / Regla Exacta
              </option>
              <option value="ai_verdict">
                🤖 Veredicto Semántico del Agente IA ([VEREDICTO_IF])
              </option>
              {resolvedIfConditionType === 'always_branch' && (
                <option value="always_branch">
                  ⚖️ Evaluar Sí / No siempre sobre los resultados del flujo
                </option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              📏 2. Expresión o Regla Exacta a Evaluar
            </label>
            <input
              type="text"
              value={currentCfg.ifRuleExpression || ''}
              onChange={(e) => {
                const nextExpr = e.target.value;
                onUpdateNodeConfig(activeNode.key, {
                  ifRuleExpression: nextExpr,
                  ...(resolvedIfConditionType === 'numeric_threshold' ||
                  resolvedIfConditionType === 'keyword_match'
                    ? {
                        ifConditionLabel: computeIfConditionLabel(
                          resolvedIfConditionType,
                          nextExpr,
                        ),
                      }
                    : {}),
                });
              }}
              placeholder="Ej: Si algún trabajador tiene EMO vencido <= 30 días o archivo nuevo en Drive..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20">
            <label className="block text-[11px] font-black uppercase text-emerald-800 dark:text-emerald-300 mb-1">
              🟢 Salida SÍ (TRUE — Cuando SÍ se cumple la condición)
            </label>
            <input
              type="text"
              value={currentCfg.conditionTrueLabel || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { conditionTrueLabel: e.target.value })
              }
              placeholder="Ej: Actualizar aplicativo del Hito y enviar alerta inmediata por Gmail..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
          <div className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
              ⚪ Salida NO (FALSE — Cuando NO hay novedades críticas)
            </label>
            <input
              type="text"
              value={currentCfg.conditionFalseLabel || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { conditionFalseLabel: e.target.value })
              }
              placeholder="Ej: Registrar 'Sin novedades hoy' en bitácora y finalizar sin enviar correo..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Tarjeta: Enrutamiento de Salidas Conectadas (Rama SÍ vs Rama NO) */}
        <div className="p-3.5 rounded-2xl border border-emerald-500/35 bg-emerald-500/5 dark:bg-slate-900/70 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black uppercase text-emerald-900 dark:text-[#C7F303] flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-emerald-600 dark:text-[#C7F303]" />
                Enrutamiento de Salidas Conectadas (Rama SÍ vs Rama NO)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Asigna con un clic qué rama activa cada salida del flujo (también puedes arrastrar el cable desde los puertos SÍ / NO en el lienzo).
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
              {connectedOutputsList.length} salida(s)
            </span>
          </div>

          {connectedOutputsList.length === 0 ? (
            <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
              Aún no hay nodos de salida en el flujo. Haz clic en el botón <strong>+</strong> junto a los puertos SÍ o NO del lienzo para añadir salidas.
            </div>
          ) : (
            <div className="space-y-2">
              {connectedOutputsList.map((outId, outIdx) => {
                const outDef = getNodeDefById(outId);
                const resolvedBr = resolveDefaultOutputIfBranch(
                  outId,
                  outIdx,
                  connectedOutputsList.length,
                  allNodeCfgs,
                  connectedOutputsList,
                );
                return (
                  <div
                    key={`route_out_${outId}`}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                        {outDef?.label || outDef?.shortLabel || outId}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold truncate">
                        Nodo: out_{outId}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateNodeConfig(`out_${outId}`, { ifBranch: 'yes' })
                        }
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-extrabold transition ${
                          resolvedBr === 'yes'
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-400'
                        }`}
                      >
                        ✅ Rama SÍ
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateNodeConfig(`out_${outId}`, { ifBranch: 'no' })
                        }
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-extrabold transition ${
                          resolvedBr === 'no'
                            ? 'bg-slate-500/20 border-slate-500 text-slate-800 dark:text-slate-200 ring-1 ring-slate-500/30'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                        }`}
                      >
                        ⚪ Rama NO
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeNode.shape === 'logic') {
    const isLoopNode = activeNode.nodeId.includes('loop');
    const isMergeNode = activeNode.nodeId.includes('merge');
    const isApprovalNode = activeNode.nodeId.includes('approval');

    return (
      <div className="space-y-3.5">
        {isLoopNode && (
          <div className="p-3.5 rounded-2xl border border-amber-400/50 dark:border-amber-700/60 bg-amber-50/30 dark:bg-amber-950/15 space-y-3">
            <div className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Repeat className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Parámetros de Iteración por Lotes (`logic_loop`)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                  📦 Tamaño de lote (`batchSize`)
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={currentCfg.batchSize ?? 10}
                  onChange={(e) =>
                    onUpdateNodeConfig(activeNode.key, {
                      batchSize: Math.max(1, Number(e.target.value) || 10),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                  🗂️ Modo de consolidación (`loopMode`)
                </label>
                <select
                  value={currentCfg.loopMode || 'consolidado_unico'}
                  onChange={(e) =>
                    onUpdateNodeConfig(activeNode.key, {
                      loopMode: e.target.value as 'consolidado_unico' | 'resumen_por_lote',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="consolidado_unico">
                    📑 Consolidado único al finalizar todos los lotes
                  </option>
                  <option value="resumen_por_lote">
                    📦 Resumen parcial por cada lote procesado
                  </option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🔑 Iterar / agrupar por casilla (`iterateByField`)
              </label>
              <input
                type="text"
                value={currentCfg.iterateByField || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { iterateByField: e.target.value })
                }
                placeholder="Ej: Trabajador / Cédula, Área / Sede, Proceso..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Trabajador / Cédula', 'Área / Sede', 'Proceso', 'Cargo', 'Vehículo / Placa'].map(
                  (presetKey) => (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() =>
                        onUpdateNodeConfig(activeNode.key, { iterateByField: presetKey })
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[10.5px] font-bold transition ${
                        currentCfg.iterateByField === presetKey
                          ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400'
                      }`}
                    >
                      {presetKey}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {isMergeNode && (
          <div className="p-3.5 rounded-2xl border border-purple-400/50 dark:border-purple-700/60 bg-purple-50/30 dark:bg-purple-950/15 space-y-3">
            <div className="text-xs font-black uppercase text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <GitMerge className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Parámetros de Unión de Ramas (`logic_merge`)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                  🔗 Estrategia de unión (`mergeStrategy`)
                </label>
                <select
                  value={currentCfg.mergeStrategy || 'union_dedup'}
                  onChange={(e) =>
                    onUpdateNodeConfig(activeNode.key, {
                      mergeStrategy: e.target.value as
                        | 'union_dedup'
                        | 'intersect_key'
                        | 'append_all',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="union_dedup">
                    ✨ Unión sin duplicados (`union_dedup`)
                  </option>
                  <option value="intersect_key">
                    🎯 Cruce exacto por campo llave (`intersect_key`)
                  </option>
                  <option value="append_all">
                    📚 Concatenar todos los registros (`append_all`)
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                  🔑 Campo llave de cruce (`mergeKey`)
                </label>
                <input
                  type="text"
                  value={currentCfg.mergeKey || ''}
                  onChange={(e) =>
                    onUpdateNodeConfig(activeNode.key, { mergeKey: e.target.value })
                  }
                  placeholder="Ej: documento / cédula, cargo, placa..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['documento / cédula', 'cargo', 'placa', 'área / sede', 'código estándar'].map(
                (kPreset) => (
                  <button
                    key={kPreset}
                    type="button"
                    onClick={() => onUpdateNodeConfig(activeNode.key, { mergeKey: kPreset })}
                    className={`px-2.5 py-1 rounded-lg border text-[10.5px] font-bold transition ${
                      currentCfg.mergeKey === kPreset
                        ? 'bg-purple-500/20 border-purple-500 text-purple-800 dark:text-purple-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-400'
                    }`}
                  >
                    {kPreset}
                  </button>
                ),
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={isApprovalNode ? '' : 'sm:col-span-2'}>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              ⚙️ Regla o Instrucción Adicional para «{activeNode.title}»
            </label>
            <input
              type="text"
              value={currentCfg.customInstruction || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
              }
              placeholder={
                isLoopNode
                  ? 'Ej: Iterar trabajador por trabajador verificando su cédula...'
                  : isApprovalNode
                    ? 'Ej: Solicitar visto bueno antes de publicar el informe final...'
                    : 'Ej: Unir los resultados de ambas ramas en una sola tabla...'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
          {isApprovalNode && (
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                👤 Correo del Responsable que Aprueba
              </label>
              <input
                type="text"
                value={currentCfg.approverEmail || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { approverEmail: e.target.value })
                }
                placeholder="Ej: gerencia@empresa.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // NODOS DE WEB SCRAPING CON ANTIGRAVITY, BÚSQUEDA WEB, SKILLS, SUB-AGENTES Y REGLAS (Sin muro de pastillas)
  const catalogScraperDef = (SKILL_RULE_SUBAGENT_NODES.find(
    (sn) => sn.id === cleanId || sn.id === activeNode.nodeId,
  ) ||
    EXTRACTOR_NODES.find(
      (en) => en.id === cleanId || en.id === activeNode.nodeId,
    )) as any;
  const defaultCatalogEngine =
    catalogScraperDef?.scriptEngine === 'chrome_devtools_mcp'
      ? 'chrome_mcp'
      : catalogScraperDef?.scriptEngine === 'node_cheerio_puppeteer'
        ? 'node_cheerio'
        : 'python_bs4';
  const isSkillNode = activeNode.customNodeType === 'skill' || cleanId.startsWith('skill_');
  const isRuleNode = activeNode.customNodeType === 'rule' || cleanId.startsWith('rule_');
  const isSubagentCustomNode =
    activeNode.customNodeType === 'subagent' || cleanId.startsWith('subagent_');
  const isWebScraperNode =
    !isSkillNode &&
    !isRuleNode &&
    !isSubagentCustomNode &&
    (activeNode.customNodeType === 'web_scraper' ||
      rawId.includes('scraping') ||
      rawId.includes('web_scraper') ||
      rawId.includes('scraper_agy_') ||
      rawId.includes('scraper_node') ||
      cleanId.includes('scraper_node'));
  const isWebSearchNode =
    !isSkillNode &&
    !isRuleNode &&
    !isSubagentCustomNode &&
    (activeNode.customNodeType === 'web_search' ||
      rawId.includes('web_search') ||
      rawId.includes('search_node') ||
      cleanId.includes('search_node'));

  if (isWebScraperNode) {
    return (
      <div className="p-3.5 rounded-2xl border border-orange-300 dark:border-orange-700/80 bg-orange-50/40 dark:bg-orange-950/20 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
            <Terminal className="w-4 h-4" />
            🕷️ Estudio de Web Scraping con Script en Google Antigravity
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
              antigravityStatus.connected
                ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950/80 dark:text-amber-300'
            }`}
          >
            {antigravityStatus.connected
              ? `🟢 Instancia Antigravity Conectada`
              : '⚠️ Requiere tu instancia de Google Antigravity conectada'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              🔗 URL(s) del Sitio Web a Scrapear
            </label>
            <input
              type="text"
              value={
                currentCfg.targetUrl ??
                customNodeObj?.targetUrl ??
                catalogScraperDef?.targetUrl ??
                ''
              }
              onChange={(e) => onUpdateNodeConfig(activeNode.key, { targetUrl: e.target.value })}
              placeholder="Ej: https://www.mintrabajo.gov.co/normatividad/..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              🐍 Motor de Ejecución en Antigravity
            </label>
            <select
              value={
                currentCfg.scriptEngine || customNodeObj?.scriptEngine || defaultCatalogEngine
              }
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { scriptEngine: e.target.value as any })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white"
            >
              <option value="python_bs4">🐍 Python (BeautifulSoup4 + Playwright)</option>
              <option value="node_cheerio">🟢 Node.js (Cheerio + Puppeteer)</option>
              <option value="chrome_mcp">🌐 Chrome DevTools MCP (Navegador Real)</option>
              <option value="custom_script">💻 Script Personalizado CLI</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200">
              💻 Código del Script o Selectores CSS
            </label>
            <ExpandableButton
              size="sm"
              variant="amber"
              icon={<Wand2 className="w-3.5 h-3.5" />}
              label="Autogenerar Script para esta URL"
              onClick={() => {
                const target =
                  (
                    currentCfg.targetUrl ??
                    customNodeObj?.targetUrl ??
                    catalogScraperDef?.targetUrl ??
                    ''
                  ).trim() || 'https://ejemplo.gov.co';
                const engine =
                  currentCfg.scriptEngine || customNodeObj?.scriptEngine || defaultCatalogEngine;
                const autoScript =
                  engine === 'python_bs4'
                    ? `import requests\nfrom bs4 import BeautifulSoup\n\nurl = "${target}"\nresp = requests.get(url, timeout=20)\nsoup = BeautifulSoup(resp.text, "html.parser")\nfor el in soup.select("table tr, h1, h2, a[href$='.pdf']"):\n    print(el.get_text(strip=True))`
                    : engine === 'node_cheerio'
                      ? `const axios = require('axios');\nconst cheerio = require('cheerio');\n(async () => {\n  const { data } = await axios.get('${target}');\n  const $ = cheerio.load(data);\n  $('table tr, h1, h2').each((_, el) => console.log($(el).text().trim()));\n})();`
                      : `Abrir ${target} con Chrome DevTools MCP, extraer todas las tablas y enlaces PDF y entregarlos en Markdown limpio.`;
                onUpdateNodeConfig(activeNode.key, { scriptCode: autoScript });
              }}
            />
          </div>
          <textarea
            rows={4}
            value={
              currentCfg.scriptCode ??
              customNodeObj?.scriptCode ??
              catalogScraperDef?.scriptCode ??
              ''
            }
            onChange={(e) => onUpdateNodeConfig(activeNode.key, { scriptCode: e.target.value })}
            placeholder="Script Python / Node.js o selectores CSS que ejecutará tu instancia Antigravity..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>
    );
  }

  if (isWebSearchNode) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-extrabold uppercase text-sky-700 dark:text-sky-300 mb-1">
            🌐 Consulta de Búsqueda en la Web o Dominios Oficiales Prioritarios
          </label>
          <input
            type="text"
            value={currentCfg.targetUrl ?? customNodeObj?.targetUrl ?? ''}
            onChange={(e) => onUpdateNodeConfig(activeNode.key, { targetUrl: e.target.value })}
            placeholder="Ej: site:mintrabajo.gov.co circulares vigentes SST..."
            className="w-full px-3 py-2 rounded-xl border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
          />
        </div>
      </div>
    );
  }

  if (isSubagentCustomNode) {
    const subagentCatalogOptions = SKILL_RULE_SUBAGENT_NODES.filter((n) =>
      n.id.startsWith('subagent_'),
    );
    const activeTitle =
      currentCfg.customTitle ?? customNodeObj?.title ?? activeNode.title ?? 'Sub-Agente WAPPY';
    const activeSubtitle =
      currentCfg.customSubtitle ?? customNodeObj?.subtitle ?? activeNode.subtitle ?? 'Especialista SST';
    const activeSubPrompt =
      currentCfg.prompt ?? customNodeObj?.content ?? catalogScraperDef?.content ?? '';
    const activeSubEngine = currentCfg.aiEngine || customNodeObj?.aiEngine || aiEngine;
    const activeSubModel = currentCfg.aiModel || customNodeObj?.aiModel || aiModel;
    const activeAvatarSrc =
      currentCfg.avatarSrc ||
      (activeNode.nodeId === 'subagent_chat_tenshi'
        ? '/assets/tenshi.png?v=orig20261109'
        : '/assets/tenshi_suricato.png?v=20261108');

    return (
      <div className="space-y-4">
        {/* Encabezado y Selector de Plantilla / Agente de Chat WAPPY */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/60 border border-indigo-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-800 dark:text-[#C7F303] flex items-center gap-1.5">
              <Bot className="w-4 h-4" />
              🤖 Estudio Editable de Sub-Agente WAPPY (Personalizable al 100%)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              23 Agentes de Chat + 7 Sub-Agentes de Flujo Disponibles
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* 1. Nombre Editable del Sub-Agente */}
            <div>
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                1. Nombre del Sub-Agente (Editable)
              </label>
              <input
                type="text"
                value={activeTitle}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { customTitle: e.target.value })
                }
                placeholder="Ej: Abogado Laboral / Auditor ARL..."
                className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            {/* 2. Rol o Especialidad Editable */}
            <div>
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                2. Rol / Especialidad en el Lienzo
              </label>
              <input
                type="text"
                value={activeSubtitle}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { customSubtitle: e.target.value })
                }
                placeholder="Ej: Sub-Agente · Medicina Laboral Res. 1843"
                className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            {/* 3. Cargar / Sincronizar con cualquiera de los Agentes de Chat o Sub-Agentes */}
            <div>
              <label className="block text-[10.5px] font-extrabold uppercase text-indigo-700 dark:text-[#C7F303] mb-1">
                3. Cargar Especialista de Chat o Sub-Agente
              </label>
              <select
                value={currentCfg.linkedAgentId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  if (val.startsWith('cat:')) {
                    const catId = val.replace('cat:', '');
                    const foundCat = subagentCatalogOptions.find((c) => c.id === catId);
                    if (foundCat) {
                      onUpdateNodeConfig(activeNode.key, {
                        linkedAgentId: val,
                        customTitle: foundCat.shortLabel,
                        customSubtitle: foundCat.subtitle,
                        prompt: foundCat.content,
                      });
                    }
                  } else {
                    const foundChatAg = availableAgentsWithTenshiAvatar.find((a) => a.id === val);
                    const matchingPreset = subagentCatalogOptions.find((c) =>
                      c.label.toLowerCase().includes((foundChatAg?.name || '').toLowerCase()),
                    );
                    if (foundChatAg) {
                      onUpdateNodeConfig(activeNode.key, {
                        linkedAgentId: val,
                        customTitle: foundChatAg.name,
                        customSubtitle: matchingPreset?.subtitle || 'Sub-Agente · Chat WAPPY',
                        prompt:
                          matchingPreset?.content ||
                          `Actúa como Sub-Agente Especialista «${foundChatAg.name}» de WAPPY. Analiza los datos recibidos del paso anterior desde tu especialidad técnica y normativa, y entrega tu dictamen estructurado al siguiente nodo del flujo.`,
                      });
                    }
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="">⚡ Elegir Agente de Chat o Plantilla para autocompletar...</option>
                <optgroup label="🤖 Todos los Sub-Agentes & Especialistas de Chat WAPPY (30)">
                  {subagentCatalogOptions.map((subOpt) => (
                    <option key={subOpt.id} value={`cat:${subOpt.id}`}>
                      {subOpt.label} ({subOpt.subtitle})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="💬 Agentes de Chat Activos en tu Servidor">
                  {availableAgentsWithTenshiAvatar.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      💬 {ag.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* 4. Motor y Modelo de IA del Sub-Agente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10.5px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                4. Motor y Modelo de IA de este Sub-Agente
              </label>
              <select
                value={
                  activeSubEngine === 'antigravity_cloud'
                    ? 'antigravity_cloud:gemini-3.6-flash'
                    : activeSubEngine === 'antigravity'
                      ? 'antigravity:gemini-3.6-flash'
                      : `wappy:${activeSubModel}`
                }
                onChange={(e) => {
                  const [eng, mod] = e.target.value.split(':');
                  onUpdateNodeConfig(activeNode.key, {
                    aiEngine: eng as any,
                    aiModel: mod || 'gemini-3.6-flash',
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                {AI_ENGINE_MODELS.map((m) => (
                  <option key={m.id} value={`${m.engine}:${m.model}`}>
                    {m.shortLabel} — {m.subtitle}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Selector de Avatar 3D del Sub-Agente */}
            <div>
              <label className="block text-[10.5px] font-extrabold uppercase text-teal-800 dark:text-[#C7F303] mb-1">
                5. Avatar 3D de este Sub-Agente en el Lienzo
              </label>
              <div className="flex flex-wrap items-center gap-2 py-0.5 px-1">
                {WAPPY_AGENT_AVATAR_ROTATION.slice(0, 5).map((av, avIdx) => {
                  const isSel =
                    activeAvatarSrc.split('?')[0] === av.src.split('?')[0];
                  const avVariants = ['teal', 'amber', 'cyan', 'purple', 'emerald'] as const;
                  return (
                    <ExpandableButton
                      key={av.id}
                      type="button"
                      size="sm"
                      variant={isSel ? avVariants[avIdx % avVariants.length] : 'neutral'}
                      isActive={isSel}
                      icon={
                        <img
                          src={av.src}
                          alt={av.name}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                      }
                      label={`${av.name} (${av.roleHint})`}
                      title={`${av.name} (${av.roleHint})`}
                      onClick={() => onUpdateNodeConfig(activeNode.key, { avatarSrc: av.src })}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Instrucciones / Prompt Específico del Sub-Agente (Editable) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-extrabold uppercase text-purple-700 dark:text-[#C7F303]">
              6. Prompt / Instrucciones Específicas de «{activeTitle}»
            </label>
            <div className="flex flex-wrap items-center gap-2 py-0.5 px-1">
              {[
                {
                  label: '🔍 Plantilla: Auditar Brechas Normativas',
                  text: `Actúa como Sub-Agente «${activeTitle}». Revisa los registros recibidos del paso anterior, identifica incumplimientos frente a la normativa colombiana vigente y entrega una tabla de hallazgos priorizados (Crítico, Medio, Bajo).`,
                  variant: 'purple' as const,
                },
                {
                  label: '📊 Plantilla: Sintetizar y Cruzar Datos',
                  text: `Actúa como Sub-Agente «${activeTitle}». Cruza los datos recibidos de los nodos previos, elimina duplicados y entrega una tabla ejecutiva limpia con las columnas clave para el siguiente paso del flujo.`,
                  variant: 'teal' as const,
                },
                {
                  label: '📝 Plantilla: Redactar Dictamen Técnico',
                  text: `Actúa como Sub-Agente «${activeTitle}». Redacta un dictamen técnico-preventivo formal con recomendaciones de control en fuente, medio e individuo listas para guardar o enviar.`,
                  variant: 'indigo' as const,
                },
              ].map((tpl) => (
                <ExpandableButton
                  key={tpl.label}
                  type="button"
                  size="sm"
                  variant={tpl.variant}
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  label={tpl.label}
                  onClick={() => onUpdateNodeConfig(activeNode.key, { prompt: tpl.text })}
                />
              ))}
            </div>
          </div>
          <textarea
            rows={4}
            value={activeSubPrompt}
            onChange={(e) => onUpdateNodeConfig(activeNode.key, { prompt: e.target.value })}
            placeholder="Escribe o edita libremente el rol, criterios normativos, formato de salida e instrucciones exactas que ejecutará este Sub-Agente..."
            className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* 7. Contexto de Entrada y Salida del Sub-Agente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10.5px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              📥 Contexto de Entrada (Qué recibe del paso anterior)
            </label>
            <input
              type="text"
              value={currentCfg.inputContext || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { inputContext: e.target.value })
              }
              placeholder="Ej: Recibe listado de trabajadores, hallazgos o documentos extraídos..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              📤 Contexto de Salida (Qué entrega al siguiente nodo)
            </label>
            <input
              type="text"
              value={currentCfg.outputContext || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { outputContext: e.target.value })
              }
              placeholder="Ej: Entrega dictamen en tabla Markdown + lista de acciones correctivas..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
        </div>
        {renderReportHistorySection()}
      </div>
    );
  }

  if (isSkillNode || isRuleNode) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-extrabold uppercase text-purple-700 dark:text-[#C7F303] mb-1">
            {isSkillNode
              ? '🧩 Instrucciones Procedurales de esta Skill (SKILL.md)'
              : '📏 Regla Obligatoria / Guardrail que el Flujo Jamás Debe Romper'}
          </label>
          <textarea
            rows={4}
            value={
              isSkillNode
                ? currentCfg.skillContent ?? customNodeObj?.content ?? catalogScraperDef?.content ?? ''
                : currentCfg.ruleText ?? customNodeObj?.content ?? catalogScraperDef?.content ?? ''
            }
            onChange={(e) => {
              if (isSkillNode) {
                onUpdateNodeConfig(activeNode.key, { skillContent: e.target.value });
              } else {
                onUpdateNodeConfig(activeNode.key, { ruleText: e.target.value });
              }
            }}
            placeholder="Escribe aquí las instrucciones exactas de esta Skill o Regla..."
            className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 2: EXTRACTORES EXTERNOS (Gmail, Drive, OneDrive, Carpeta Local PC)
     ═════════════════════════════════════════════════════════════════════════ */
  if (activeNode.shape === 'square_extractor') {
    if (cleanId.includes('gmail')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📧 Remitente (De:)
              </label>
              <input
                type="text"
                value={currentCfg.emailSenderFilter || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { emailSenderFilter: e.target.value })
                }
                placeholder="Ej: arl@positiva.gov.co, @sura.com.co"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🔍 Palabras en el Asunto o Cuerpo
              </label>
              <input
                type="text"
                value={currentCfg.emailSubjectFilter || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { emailSubjectFilter: e.target.value })
                }
                placeholder="Ej: FURAT, Concepto Aptitud, Certificado"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                ⏱️ Ventana de Correos a Leer
              </label>
              <select
                value={currentCfg.timeWindow || '7d'}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { timeWindow: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="unread">📩 Solo correos NO leídos</option>
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(currentCfg.onlyWithAttachments)}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { onlyWithAttachments: e.target.checked })
              }
              className="rounded border-teal-500 text-teal-600"
            />
            <span>📎 Leer únicamente correos que traigan archivos adjuntos (PDF / Excel / Word)</span>
          </label>

          {renderSimpleReadOnlyPreviewTable('📧 Correos recientes que coinciden con tu filtro')}
        </div>
      );
    }

    if (cleanId.includes('drive') || cleanId.includes('onedrive')) {
      const isOneDrive = cleanId.includes('onedrive');
      const liveFolders = Array.isArray(nodeLiveInspectorData.availableFolders)
        ? nodeLiveInspectorData.availableFolders
        : [];
      const currentFolderId = currentCfg.driveFolderId || '';
      const currentUrlOrPath = currentCfg.driveFolderUrl ?? currentCfg.driveFolderName ?? '';
      return (
        <div className="space-y-3">
          {/* Estado real de conexión Google Drive / OneDrive */}
          {isOneDrive ? (
            <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800/70 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 font-bold">
              <span>🚧 Conector Microsoft OneDrive / SharePoint en Construcción</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 dark:bg-amber-900/70">
                Próximamente
              </span>
            </div>
          ) : (
            <div
              className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs font-bold ${
                nodeLiveInspectorData.connected !== false
                  ? 'border-emerald-300 dark:border-emerald-800/70 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                  : 'border-amber-300 dark:border-amber-800/70 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
              }`}
            >
              <span>
                {nodeLiveInspectorData.connected !== false
                  ? `🟢 Google Drive conectado${
                      nodeLiveInspectorData.connectedEmail
                        ? `: ${nodeLiveInspectorData.connectedEmail}`
                        : ''
                    }`
                  : '⚠️ Conecta tu cuenta de Google Drive en Integraciones para listar tus carpetas reales'}
              </span>
              {nodeLiveInspectorData.resolvedFolder?.name && (
                <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-[10.5px] font-extrabold text-emerald-800 dark:text-[#C7F303]">
                  📂 Ubicación activa: {nodeLiveInspectorData.resolvedFolder.name}
                </span>
              )}
            </div>
          )}

          {/* 1. Selector de carpeta real + 2. Enlace URL / ID exacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📁 1. Seleccionar carpeta de tu Google Drive conectado
              </label>
              <select
                value={currentFolderId || (currentUrlOrPath === 'root' ? 'root' : '')}
                onChange={(e) => {
                  const chosenId = e.target.value;
                  if (!chosenId) {
                    onUpdateNodeConfig(activeNode.key, {
                      driveFolderId: '',
                      driveFolderUrl: '',
                      driveFolderName: '',
                    });
                    return;
                  }
                  if (chosenId === 'root') {
                    onUpdateNodeConfig(activeNode.key, {
                      driveFolderId: 'root',
                      driveFolderUrl: '',
                      driveFolderName: 'Mi unidad (Raíz)',
                    });
                    return;
                  }
                  const found = liveFolders.find((f) => f.id === chosenId);
                  onUpdateNodeConfig(activeNode.key, {
                    driveFolderId: chosenId,
                    driveFolderUrl: found?.webViewLink || '',
                    driveFolderName: found?.name || chosenId,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="">— Seleccionar carpeta de Drive ({liveFolders.length} detectadas) —</option>
                <option value="root">📂 Mi unidad (Raíz principal de Google Drive)</option>
                {liveFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🔗 2. O pegar enlace (URL), ID o ruta exacta de la carpeta
              </label>
              <input
                type="text"
                value={currentUrlOrPath}
                onChange={(e) => {
                  const rawVal = e.target.value;
                  const detectedId = extractGoogleDriveIdClient(rawVal);
                  onUpdateNodeConfig(activeNode.key, {
                    driveFolderUrl: rawVal,
                    driveFolderName: rawVal,
                    ...(detectedId ? { driveFolderId: detectedId } : { driveFolderId: '' }),
                  });
                }}
                placeholder="Ej: https://drive.google.com/drive/folders/1AbC... o SG-SST/FURAT"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
              />
              {currentFolderId && currentFolderId !== 'root' && (
                <p className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  ✅ ID exacto de carpeta fijado: <code className="font-mono">{currentFolderId}</code>
                </p>
              )}
            </div>
          </div>

          {/* 3. Filtros exactos de archivo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📄 Tipo de archivo
              </label>
              <select
                value={currentCfg.fileTypeFilter || 'all'}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { fileTypeFilter: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="all">Todos los formatos</option>
                <option value="pdf">Solo PDF (.pdf)</option>
                <option value="excel">Solo Excel / Google Sheets</option>
                <option value="word">Solo Word / Google Docs</option>
                <option value="image">Solo Imágenes (.jpg, .png)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🔍 Nombre del archivo contiene (Opcional)
              </label>
              <input
                type="text"
                value={currentCfg.fileNameFilter || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { fileNameFilter: e.target.value })
                }
                placeholder="Ej: FURAT, EMO, Certificado"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🔢 Máx. archivos por corrida
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={currentCfg.maxItems || 20}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, {
                    maxItems: Math.max(1, Math.min(50, Number(e.target.value) || 20)),
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={currentCfg.onlyNewFiles !== false}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { onlyNewFiles: e.target.checked })
              }
              className="rounded border-teal-500 text-teal-600"
            />
            <span>⚡ Procesar únicamente archivos nuevos o modificados no registrados aún</span>
          </label>

          {renderSimpleReadOnlyPreviewTable('📂 Archivos encontrados en la carpeta seleccionada')}
        </div>
      );
    }

    if (
      cleanId.includes('pc_folder') ||
      cleanId.includes('local_folder') ||
      cleanId.includes('local_pc')
    ) {
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              💡 <strong>Tip rápido:</strong> En Mac presiona <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono text-[10px]">⌥ Option + Clic derecho → Copiar como ruta</kbd> (o en Windows <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono text-[10px]">Shift + Clic derecho → Copiar como ruta</kbd>) y pégala abajo.
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                antigravityStatus.connected
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950/80 dark:text-amber-300'
              }`}
            >
              {antigravityStatus.connected
                ? '🟢 Antigravity Local Conectado'
                : '⚠️ Requiere Antigravity Local activo'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              💻 Ruta exacta de la carpeta en tu Mac o Windows *
            </label>
            <input
              type="text"
              value={currentCfg.watchFolderPath || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, {
                  watchFolderPath: e.target.value.replace(/^["']+|["']+$/g, ''),
                })
              }
              placeholder="Ej: /Users/venta/Documents/SST_FURAT  o  C:\SST\Certificados"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📄 Tipo de archivos a leer
              </label>
              <select
                value={currentCfg.fileTypeFilter || 'all'}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { fileTypeFilter: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="all">Todos los archivos soportados</option>
                <option value="pdf">Solo Documentos PDF (*.pdf)</option>
                <option value="excel">Solo Excel / CSV (*.xlsx, *.xls, *.csv)</option>
                <option value="word">Solo Word (*.docx, *.doc)</option>
                <option value="image">Solo Imágenes (*.jpg, *.png)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                🔍 Nombre del archivo contiene (Opcional)
              </label>
              <input
                type="text"
                value={currentCfg.fileNameFilter || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { fileNameFilter: e.target.value })
                }
                placeholder="Ej: FURAT, Planilla, EMO"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={Boolean(currentCfg.includeSubfolders)}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { includeSubfolders: e.target.checked })
                }
                className="rounded border-teal-500 text-teal-600"
              />
              <span>📂 Incluir subcarpetas</span>
            </label>

            <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={currentCfg.onlyNewFiles !== false}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { onlyNewFiles: e.target.checked })
                }
                className="rounded border-teal-500 text-teal-600"
              />
              <span>⚡ Procesar solo archivos nuevos</span>
            </label>
          </div>

          {renderSimpleReadOnlyPreviewTable('💻 Archivos detectados en la carpeta configurada')}
        </div>
      );
    }

    if (cleanId === 'extract_sst_app') {
      const selectedAppTarget = currentCfg.documentTitle || 'Matriz IPEVR GTC-45 (Hito 1)';
      const activeSourceId = currentCfg.sstAppSourceId || 'hito1_gtc45';
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-800/60 space-y-2.5">
            <label className="block text-xs font-extrabold uppercase text-teal-900 dark:text-teal-300">
              🛡️ 1. Elige de qué Aplicativo o Matriz de «{resolvedCompanyFull}» deseas extraer datos sin IA:
            </label>
            <div className="flex flex-wrap items-center gap-2 py-0.5 px-1">
              {[
                {
                  label: '⚡ Extraer Matriz de Peligros IPEVR GTC-45 (Hito 1)',
                  val: 'Matriz IPEVR GTC-45 (Hito 1)',
                  srcId: 'hito1_gtc45',
                  variant: 'teal' as const,
                },
                {
                  label: '🚗 Extraer Matriz de Riesgos Viales PESV y Flota (Hito 3)',
                  val: 'Matriz PESV y Parque Automotor (Hito 3)',
                  srcId: 'hito3_pesv',
                  variant: 'amber' as const,
                },
                {
                  label: '⚖️ Extraer Matriz Legal y Normas en Brecha (Hito 1)',
                  val: 'Matriz Legal SG-SST (Hito 1)',
                  srcId: 'hito1_matriz_legal',
                  variant: 'purple' as const,
                },
                {
                  label: '📊 Extraer Diagnóstico Estándares Mínimos Res. 0312 (Hito 1)',
                  val: 'Diagnóstico Res. 0312 (Hito 1)',
                  srcId: 'hito1_diagnostico_0312',
                  variant: 'cyan' as const,
                },
                {
                  label: '🚑 Extraer Casos e Investigaciones ATEL (Hito 7)',
                  val: 'Investigación y Estadísticas ATEL (Hito 7)',
                  srcId: 'hito7_investigacion_atel',
                  variant: 'danger' as const,
                },
                {
                  label: '📋 Extraer Actividades del Centro de Control ACPM (Hito 7)',
                  val: 'Tablero Kanban ACPM (Hito 7)',
                  srcId: 'hito7_acpm',
                  variant: 'indigo' as const,
                },
              ].map((appOpt) => (
                <ExpandableButton
                  key={appOpt.val}
                  size="sm"
                  variant={
                    selectedAppTarget === appOpt.val || activeSourceId === appOpt.srcId
                      ? appOpt.variant
                      : 'neutral'
                  }
                  isActive={selectedAppTarget === appOpt.val || activeSourceId === appOpt.srcId}
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  label={appOpt.label}
                  onClick={() =>
                    onUpdateNodeConfig(activeNode.key, {
                      sstAppSourceId: appOpt.srcId,
                      documentTitle: appOpt.val,
                      customInstruction: `Extraer directamente desde MongoDB los registros de ${appOpt.val} para la empresa activa ${resolvedCompanyFull}.`,
                    })
                  }
                />
              ))}
            </div>
            <div>
              <label className="block text-[10.5px] font-extrabold uppercase text-teal-800 dark:text-teal-300 mb-1">
                🔎 O selecciona cualquier Aplicativo de los 8 Hitos SG-SST (`sstAppSourceId`):
              </label>
              <select
                value={activeSourceId}
                onChange={(e) => {
                  const chosenId = e.target.value;
                  const chosenDef = HITO_APP_NODES.find((h) => h.id === chosenId);
                  const chosenTitle = chosenDef?.label || chosenId;
                  onUpdateNodeConfig(activeNode.key, {
                    sstAppSourceId: chosenId,
                    documentTitle: chosenTitle,
                    customInstruction: `Extraer directamente desde MongoDB los registros de ${chosenTitle} para la empresa activa ${resolvedCompanyFull}.`,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                {HITO_APP_NODES.map((hNode) => (
                  <option key={hNode.id} value={hNode.id}>
                    {hNode.badge ? `[${hNode.badge}] ` : ''}
                    {hNode.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {renderFieldChecklistSection('teal')}
          {renderLiveRecordsTableSection(`🛡️ Estado de «${selectedAppTarget}» en «${resolvedCompanyFull}»`)}
          {renderReportHistorySection()}
        </div>
      );
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 5: HERRAMIENTAS DEL AGENTE EXTERNAS (Google Suite, Estudios IA, Radares)
     ═════════════════════════════════════════════════════════════════════════ */
  const isWappySstInternalTool =
    cleanId.startsWith('somos_sst_') ||
    cleanId.startsWith('hito') ||
    cleanId === 'matriz_ipevar' ||
    cleanId === 'matriz_pesv' ||
    cleanId === 'matriz_compatibilidad' ||
    cleanId === 'consultar_analitica_psicosocial' ||
    cleanId === 'consultar_analitica_actos_condiciones' ||
    cleanId === 'cursos_lms';

  if (activeNode.shape === 'circle_tool' && cleanId === 'canvas_doc') {
    const activeTpl = currentCfg.documentTemplate || 'Informe Investigación ATEL Res. 1401';
    return (
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-fuchsia-50/50 dark:bg-fuchsia-950/20 border border-fuchsia-200/80 dark:border-fuchsia-800/60">
          <label className="block text-xs font-extrabold uppercase text-fuchsia-900 dark:text-fuchsia-300 mb-1.5">
            🎨 1. Plantilla Formal del Documento en LiveEditor para «{resolvedCompanyFull}»
          </label>
          <div className="flex flex-wrap items-center gap-2.5 py-1 px-1">
            {[
              { id: 'Informe Investigación ATEL Res. 1401', label: '📋 Informe Oficial de Investigación ATEL (Res. 1401)', variant: 'fuchsia' as const },
              { id: 'Acta Oficial con Cabezote y Firmas', label: '🏛️ Acta Oficial de Comité (COPASST / CCL / PESV) con Firmas', variant: 'purple' as const },
              { id: 'Informe Ejecutivo de Auditoría 0312', label: '📊 Informe Ejecutivo de Auditoría y Brechas Res. 0312', variant: 'teal' as const },
              { id: 'Procedimiento / Programa SG-SST', label: '📑 Procedimiento Operativo Estándar (PON) o Programa PVE', variant: 'indigo' as const },
            ].map((tpl) => (
              <ExpandableButton
                key={tpl.id}
                type="button"
                size="sm"
                variant={activeTpl === tpl.id ? tpl.variant : 'neutral'}
                isActive={activeTpl === tpl.id}
                icon={<FileText className="w-3.5 h-3.5" />}
                label={tpl.label}
                onClick={() =>
                  onUpdateNodeConfig(activeNode.key, { documentTemplate: tpl.id })
                }
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              📄 2. Título Oficial del Documento Vivo
            </label>
            <input
              type="text"
              value={currentCfg.documentTitle || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { documentTitle: e.target.value })
              }
              placeholder={`Ej: Informe Oficial SG-SST — ${resolvedCompanyFull}`}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              ✍️ 3. Estructura de Cabezote, Tablas y Bloque de Firmas
            </label>
            <input
              type="text"
              value={currentCfg.customInstruction || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
              }
              placeholder="Ej: Incluir cabezote con NIT, tablas con bordes sólidos y firma de Representante Legal + Responsable SST"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeNode.shape === 'circle_tool' && !isWappySstInternalTool) {
    const paramLabel = cleanId.includes('clima')
      ? '🌦️ Ciudad / Sede para Pronóstico Climático SST (OpenWeather)'
      : cleanId.includes('pubchem')
        ? '🧪 Número CAS o Nombre de la Sustancia Química (PubChem NIH)'
        : cleanId.includes('medline')
          ? '🩺 Código CIE-10 o Diagnóstico Ocupacional (MedlinePlus NIH)'
          : cleanId.includes('emergencia')
            ? '🚑 Dirección de la Sede o Radio de Búsqueda MEDEVAC (OpenStreetMap)'
            : cleanId === 'google_drive' || cleanId === 'one_drive'
              ? '📁 Enlace (URL), ID o Nombre de Carpeta Objetivo en la Nube'
              : cleanId === 'google_sheets'
                ? '📊 Nombre o Enlace de la Hoja de Cálculo (Google Sheets)'
                : cleanId === 'google_docs'
                  ? '📄 Título del Documento en Google Docs'
                  : cleanId === 'google_slides'
                    ? '📽️ Título de la Presentación en Google Slides'
                    : cleanId === 'google_gmail'
                      ? '📧 Filtro de Búsqueda o Destinatario en Gmail'
                      : cleanId === 'google_calendar'
                        ? '📅 Título del Evento o Recordatorio en Google Calendar'
                        : cleanId === 'notebooklm'
                          ? '📚 Cuaderno o Fuente en Google NotebookLM'
                          : cleanId === 'google_flow'
                            ? '🎬 Escena / Prompt Visual para Google Flow (Veo / Imagen)'
                            : cleanId.includes('antigravity')
                              ? '💻 Ruta / Comando o Tarea Delegada en Google Antigravity'
                              : '🔗 Endpoint URL o Parámetro de Consulta';

    const paramPlaceholder =
      activeCompanyInfo?.city && cleanId.includes('clima')
        ? `Sede activa por defecto: ${activeCompanyInfo.city} (${resolvedCompanyFull})`
        : activeCompanyInfo?.city && cleanId.includes('emergencia')
          ? `Sede activa: ${activeCompanyInfo.address || activeCompanyInfo.city} (${resolvedCompanyFull})`
          : cleanId.includes('pubchem')
            ? 'Ej: 7681-52-9 Hipoclorito de Sodio, 108-88-3 Tolueno...'
            : cleanId.includes('medline')
              ? 'Ej: M54.5 Lumbago, G56.0 Síndrome del Túnel Carpiano...'
              : cleanId === 'google_drive'
                ? 'Ej: https://drive.google.com/drive/folders/1AbC... o nombre de carpeta'
                : cleanId === 'google_sheets'
                  ? 'Ej: Matriz_Control_SST_2026 (Pestaña: Alertas)'
                  : cleanId === 'notebooklm'
                    ? 'Ej: Cuaderno Normativo SG-SST / Guía de Inducción...'
                    : cleanId === 'google_flow'
                      ? 'Ej: Trabajador usando arnés certificado en trabajo en alturas...'
                      : `Ej: Recurso o parámetro objetivo para ${resolvedNodeDisplayTitle}...`;

    const liveToolDriveFolders =
      cleanId === 'google_drive' && Array.isArray(nodeLiveInspectorData.availableFolders)
        ? nodeLiveInspectorData.availableFolders
        : [];

    return (
      <div className="space-y-3">
        {cleanId === 'one_drive' && (
          <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-800/70 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 font-bold">
            <span>🚧 Conector Microsoft OneDrive / SharePoint en Construcción (Próximamente)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 dark:bg-amber-900/70">
              En Construcción
            </span>
          </div>
        )}

        {cleanId === 'google_drive' && (
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              📁 Seleccionar carpeta real de tu Google Drive conectado
            </label>
            <select
              value={currentCfg.driveFolderId || ''}
              onChange={(e) => {
                const chosenId = e.target.value;
                if (!chosenId) {
                  onUpdateNodeConfig(activeNode.key, {
                    driveFolderId: '',
                    driveFolderUrl: '',
                    driveFolderName: '',
                  });
                  return;
                }
                if (chosenId === 'root') {
                  onUpdateNodeConfig(activeNode.key, {
                    driveFolderId: 'root',
                    driveFolderUrl: '',
                    driveFolderName: 'Mi unidad (Raíz)',
                  });
                  return;
                }
                const found = liveToolDriveFolders.find((f) => f.id === chosenId);
                onUpdateNodeConfig(activeNode.key, {
                  driveFolderId: chosenId,
                  driveFolderUrl: found?.webViewLink || '',
                  driveFolderName: found?.name || chosenId,
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="">
                — Seleccionar carpeta de Drive ({liveToolDriveFolders.length} detectadas) —
              </option>
              <option value="root">📂 Mi unidad (Raíz principal de Google Drive)</option>
              {liveToolDriveFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              {paramLabel}
            </label>
            <input
              type="text"
              value={
                currentCfg.driveFolderUrl ||
                currentCfg.driveFolderName ||
                currentCfg.targetUrl ||
                ''
              }
              onChange={(e) => {
                const val = e.target.value;
                const detectedDriveId =
                  cleanId === 'google_drive' ? extractGoogleDriveIdClient(val) : '';
                onUpdateNodeConfig(activeNode.key, {
                  driveFolderUrl: val,
                  driveFolderName: val,
                  targetUrl: val,
                  ...(cleanId === 'google_drive'
                    ? { driveFolderId: detectedDriveId || '' }
                    : {}),
                });
              }}
              placeholder={paramPlaceholder}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              🔧 Acción Específica para el Agente (Opcional)
            </label>
            <input
              type="text"
              value={currentCfg.customInstruction || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
              }
              placeholder={`Ej: Consultar o guardar en ${resolvedNodeDisplayTitle}...`}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
        </div>
        {cleanId === 'google_drive' &&
          renderSimpleReadOnlyPreviewTable('📂 Archivos encontrados en la carpeta de Drive')}
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 6 (Y EXTRACTOR DE TRABAJADORES / APLICATIVOS SOMOS SST):
     LOS 8 HITOS / 50 APLICATIVOS DE SOMOS SST — DISEÑADOR QUIRÚRGICO DE DATOS EN TABLA
     ═════════════════════════════════════════════════════════════════════════ */
  const filteredPresetFields = fieldSearchQuery.trim()
    ? presetFields.filter((f) => f.toLowerCase().includes(fieldSearchQuery.trim().toLowerCase()))
    : presetFields;

  const resolvedHitoRole: 'source_read' | 'target_write_report' = (() => {
    if (currentCfg.hitoRole === 'source_read' || currentCfg.hitoRole === 'target_write_report') {
      return currentCfg.hitoRole;
    }
    if (
      ['write_and_report', 'write_and_update', 'generate_report'].includes(
        String(currentCfg.appActionMode || ''),
      ) ||
      currentCfg.generateAppReport === true ||
      ['write_register', 'audit_and_update'].includes(
        String(currentCfg.hitoOperationMode || ''),
      )
    ) {
      return 'target_write_report';
    }
    return 'source_read';
  })();

  const hitoOpMode =
    currentCfg.hitoOperationMode ||
    (activeNode.shape === 'square_extractor' || resolvedHitoRole === 'source_read'
      ? 'read_only'
      : 'write_register');

  return (
    <div className="space-y-4">
      {/* 1. ROL CAUSAL Y MODO DE OPERACIÓN EN EL APLICATIVO DE SOMOS SST */}
      {activeNode.shape === 'square_hito' && (
        <div className="space-y-3.5">
          {/* Selector Causal Oficial: Rol Causal en el Flujo (`hitoRole`) */}
          <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-slate-900 dark:to-slate-900/80 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-wide text-emerald-900 dark:text-[#C7F303] flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-emerald-600 dark:text-[#C7F303] shrink-0" />
                  Rol Causal en el Flujo (`hitoRole`)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Ubica automáticamente a <strong>«{resolvedNodeDisplayTitle}»</strong> en la Etapa 2 (lectura previa) o en la Rama SÍ después del Agente IA (escritura/informe).
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-[10px] font-extrabold text-teal-800 dark:text-teal-300">
                {resolvedHitoRole === 'source_read'
                  ? '📥 Etapa 2 · Fuente Lectura'
                  : '📤 Derecha IA · Escritura / Informe'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateNodeConfig(activeNode.key, {
                    hitoRole: 'source_read',
                    hitoOperationMode: 'read_only',
                    appActionMode: 'read_only',
                    generateAppReport: false,
                  })
                }
                className={`p-3 rounded-xl border-2 text-left transition ${
                  resolvedHitoRole === 'source_read'
                    ? 'bg-teal-50/90 dark:bg-slate-800 border-teal-600 dark:border-[#C7F303] ring-1 ring-teal-500/25 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                    📥 Fuente de Lectura / Auditoría (Etapa 2 · Izquierda del Agente)
                  </span>
                  {resolvedHitoRole === 'source_read' && (
                    <Check className="w-4 h-4 text-teal-600 dark:text-[#C7F303] stroke-[3] shrink-0 mt-0.5" />
                  )}
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Extrae registros reales y casillas quirúrgicas antes de Condición Si/No y del Agente IA.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateNodeConfig(activeNode.key, {
                    hitoRole: 'target_write_report',
                    hitoOperationMode: 'write_register',
                    appActionMode: 'write_and_report',
                    generateAppReport: true,
                  })
                }
                className={`p-3 rounded-xl border-2 text-left transition ${
                  resolvedHitoRole === 'target_write_report'
                    ? 'bg-emerald-50/90 dark:bg-slate-800 border-emerald-600 dark:border-[#C7F303] ring-1 ring-emerald-500/25 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                    📤 Destino de Escritura / Informe Oficial HTML (Derecha del Agente · Rama SÍ)
                  </span>
                  {resolvedHitoRole === 'target_write_report' && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-[#C7F303] stroke-[3] shrink-0 mt-0.5" />
                  )}
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Registra/actualiza datos del análisis del Agente IA y emite el Informe Oficial HTML hacia Salidas.
                </p>
              </button>
            </div>
          </div>

          {/* Bloque Oficial: Generación y Extracción de Informe Oficial del Aplicativo */}
          <div className="p-3.5 rounded-2xl border border-teal-500/40 bg-gradient-to-br from-teal-500/5 via-emerald-500/5 to-cyan-500/5 dark:from-slate-900 dark:to-slate-900/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-wide text-teal-900 dark:text-[#C7F303] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600 dark:text-[#C7F303]" />
                  📄 Generación y Extracción de Informe Oficial del Aplicativo
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Define cómo interactúa el flujo con <strong>«{resolvedNodeDisplayTitle}»</strong> y su Informe Oficial corporativo HTML.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                ⚙️ Modo de Acción en el Aplicativo (`appActionMode`)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'read_only' as const,
                    title: '🔍 Solo consultar casillas e informes existentes',
                    desc: 'Lee registros reales e informes ya guardados sin modificar el aplicativo.',
                    legacyOp: 'read_only' as const,
                    role: 'source_read' as const,
                  },
                  {
                    id: 'write_and_update' as const,
                    title: '✍️ Alimentar / registrar datos en el aplicativo',
                    desc: 'Registra o actualiza hallazgos, controles o evaluaciones en MongoDB.',
                    legacyOp: 'write_register' as const,
                    role: 'target_write_report' as const,
                  },
                  {
                    id: 'write_and_report' as const,
                    title: '🚀 Alimentar aplicativo + Generar y extraer Informe Oficial HTML',
                    desc: 'Actualiza el aplicativo y genera el Informe Oficial completo hacia las Salidas.',
                    legacyOp: 'write_register' as const,
                    role: 'target_write_report' as const,
                  },
                  {
                    id: 'generate_report' as const,
                    title: '📄 Generar Informe Oficial IA del aplicativo y pasarlo al flujo',
                    desc: 'Construye el Informe Oficial HTML con membrete, tablas y firmas para LiveEditor / Gmail.',
                    legacyOp: 'audit_and_update' as const,
                    role: 'target_write_report' as const,
                  },
                ].map((actOpt) => {
                  const currentActionMode =
                    currentCfg.appActionMode ||
                    (resolvedHitoRole === 'source_read' ||
                    hitoOpMode === 'extract_only' ||
                    hitoOpMode === 'read_only'
                      ? 'read_only'
                      : hitoOpMode === 'write_register'
                        ? 'write_and_update'
                        : 'write_and_report');
                  const isActSelected = currentActionMode === actOpt.id;
                  return (
                    <button
                      key={actOpt.id}
                      type="button"
                      onClick={() =>
                        onUpdateNodeConfig(activeNode.key, {
                          hitoRole: actOpt.role,
                          appActionMode: actOpt.id,
                          hitoOperationMode: actOpt.legacyOp,
                          generateAppReport:
                            actOpt.id === 'write_and_report' || actOpt.id === 'generate_report',
                        })
                      }
                      className={`p-2.5 rounded-xl border-2 text-left transition ${
                        isActSelected
                          ? 'bg-teal-50/90 dark:bg-slate-800 border-teal-600 dark:border-[#C7F303] ring-1 ring-teal-500/25 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                          {actOpt.title}
                        </span>
                        {isActSelected && (
                          <Check className="w-4 h-4 text-teal-600 dark:text-[#C7F303] stroke-[3] shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {actOpt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3 Toggles Oficiales de Informe HTML */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <label className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 cursor-pointer">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  📄 Generar / Extraer Informe Oficial HTML completo hacia Salidas (LiveEditor / Gmail)
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(currentCfg.generateAppReport)}
                  onChange={(e) =>
                    onUpdateNodeConfig(activeNode.key, {
                      generateAppReport: e.target.checked,
                      ...(e.target.checked
                        ? {
                            hitoRole: 'target_write_report',
                            appActionMode:
                              currentCfg.appActionMode === 'read_only' || !currentCfg.appActionMode
                                ? 'generate_report'
                                : currentCfg.appActionMode,
                          }
                        : {}),
                    })
                  }
                  className="w-4 h-4 rounded border-teal-500 text-teal-600 shrink-0"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    🔄 Forzar regeneración nueva con IA en cada corrida
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(currentCfg.forceRegenerateReport)}
                    onChange={(e) =>
                      onUpdateNodeConfig(activeNode.key, {
                        forceRegenerateReport: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-purple-500 text-purple-600 shrink-0"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    📚 Incluir último Informe Oficial guardado
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(currentCfg.includeLatestReport)}
                    onChange={(e) =>
                      onUpdateNodeConfig(activeNode.key, {
                        includeLatestReport: e.target.checked,
                        reportTags: moduleMeta.reportTags,
                      })
                    }
                    className="w-4 h-4 rounded border-emerald-500 text-emerald-600 shrink-0"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. FILTRO OPCIONAL DE COLUMNAS Y TABLA EN VIVO (SOLO CUANDO EL NODO ES FUENTE DE LECTURA) */}
      {(activeNode.shape !== 'square_hito' || resolvedHitoRole === 'source_read') && (
        <>
          <details
            open={selectedFields.length > 0}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 group"
          >
            <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2 select-none">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                  📋 Filtrar columnas específicas de «{resolvedModuleTitle}» (Opcional)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-[#C7F303] border border-teal-300 dark:border-teal-700">
                  {selectedFields.length > 0
                    ? `${selectedFields.length} columna(s) elegida(s)`
                    : `Envía todas las necesarias (${presetFields.length})`}
                </span>
              </div>
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                Clic para desplegar / ocultar ▾
              </span>
            </summary>

            <div className="pt-3 mt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fieldSearchQuery}
                    onChange={(e) => setFieldSearchQuery(e.target.value)}
                    placeholder="Buscar columna..."
                    className="pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 w-48"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ExpandableButton
                    size="sm"
                    variant="teal"
                    icon={<Check className="w-3.5 h-3.5" />}
                    badge={presetFields.length}
                    label="Marcar Todas"
                    onClick={() =>
                      onUpdateNodeConfig(activeNode.key, {
                        fields: presetFields,
                        strictFieldFilter: true,
                        reportTags: moduleMeta.reportTags,
                      })
                    }
                  />
                  {selectedFields.length > 0 && (
                    <ExpandableButton
                      size="sm"
                      variant="danger"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      badge={selectedFields.length}
                      label="Usar Automático (Limpiar)"
                      onClick={() =>
                        onUpdateNodeConfig(activeNode.key, {
                          fields: [],
                          reportTags: moduleMeta.reportTags,
                        })
                      }
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredPresetFields.map((fieldLabel) => {
                  const active = selectedFields.includes(fieldLabel);
                  const isLiveDbDetected = liveDetectedFieldSet.has(fieldLabel);
                  return (
                    <label
                      key={fieldLabel}
                      onClick={() => toggleFieldChip(fieldLabel)}
                      className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition select-none text-xs ${
                        active
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 dark:border-[#C7F303] font-extrabold text-purple-950 dark:text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                            active
                              ? 'bg-purple-600 dark:bg-[#C7F303] border-purple-600 dark:border-[#C7F303] text-white dark:text-[#0E1300]'
                              : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                          }`}
                        >
                          {active && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="truncate" title={fieldLabel}>
                          {fieldLabel}
                        </span>
                      </span>
                      {isLiveDbDetected && (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 shrink-0">
                          BD en vivo
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {selectedFields.length > 0 && (
                <div className="flex items-center justify-end pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isStrictFilter}
                      onChange={(e) =>
                        onUpdateNodeConfig(activeNode.key, {
                          strictFieldFilter: e.target.checked,
                        })
                      }
                      className="rounded border-teal-500 text-teal-600"
                    />
                    <span>
                      🔒 Extraer <strong>SOLO</strong> estas {selectedFields.length} columna(s)
                    </span>
                  </label>
                </div>
              )}
            </div>
          </details>

          {/* 3. TABLA REAL EN VIVO DE REGISTROS DE ESTE APLICATIVO EN MONGODB */}
          {renderLiveRecordsTableSection()}
        </>
      )}

      {/* 4. HISTORIAL DE INFORMES GUARDADOS DE ESTE APLICATIVO */}
      {renderReportHistorySection()}
    </div>
  );
  };

  const shouldRenderTopAntigravityBanner =
    requiresAntigravity &&
    activeNode.shape !== 'circle_model' &&
    (activeNode.shape !== 'agent' ||
      effectiveNodeAiEngine === 'antigravity' ||
      effectiveNodeAiEngine === 'antigravity_cloud');

  const shouldRenderOutputIfBranchSelector =
    activeNode.shape === 'square_output' && Boolean(workflowNodes?.includeIfNode);

  const renderOutputIfBranchSelectorBanner = () => {
    const outList =
      workflowNodes?.outputs !== undefined
        ? Array.isArray(workflowNodes.outputs)
          ? workflowNodes.outputs
          : []
        : ['email_report'];
    const outIdx = Math.max(0, outList.indexOf(cleanId));
    const effectiveBranch =
      currentCfg.ifBranch === 'yes' || currentCfg.ifBranch === 'no'
        ? currentCfg.ifBranch
        : resolveDefaultOutputIfBranch(
            cleanId,
            outIdx,
            Math.max(1, outList.length),
            workflowNodes?.canvasLayout?.nodeConfigs,
            outList,
          );

    return (
      <div className="p-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/5 dark:bg-slate-900/80 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-xs font-black uppercase text-emerald-900 dark:text-[#C7F303] flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-emerald-600 dark:text-[#C7F303]" />
            Conectado en el lienzo al cable de Condición Sí/No:
          </span>
          <span className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
            Define cuándo se activa esta salida
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateNodeConfig(activeNode.key, { ifBranch: 'yes' })}
            className={`p-2 rounded-xl border-2 text-left text-xs font-extrabold transition ${
              effectiveBranch === 'yes'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-400'
            }`}
          >
            ✅ Cable SÍ (Con hallazgos / condición cumplida)
          </button>
          <button
            type="button"
            onClick={() => onUpdateNodeConfig(activeNode.key, { ifBranch: 'no' })}
            className={`p-2 rounded-xl border-2 text-left text-xs font-extrabold transition ${
              effectiveBranch === 'no'
                ? 'bg-slate-500/20 border-slate-500 text-slate-900 dark:text-slate-100 ring-1 ring-slate-500/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400'
            }`}
          >
            ⚪ Cable NO (Sin hallazgos / ruta alternativa)
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 min-w-0">
      {shouldRenderOutputIfBranchSelector && renderOutputIfBranchSelectorBanner()}
      {shouldRenderTopAntigravityBanner && renderAntigravityModeSelectorPanel()}
      {renderSpecificNodeEditor()}
    </div>
  );
}
