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
} from 'lucide-react';
import ExpandableButton from '~/components/Common/ExpandableButton';
import {
  AI_ENGINE_MODELS,
  SKILL_RULE_SUBAGENT_NODES,
  WAPPY_AGENT_AVATAR_ROTATION,
  getRotatedAgentAvatar,
  getNodeModuleMetadata,
  type CanvasNodeConfig,
  type CanvasExtraAgentNode,
  type CanvasCustomUserNode,
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

  const moduleMeta = getNodeModuleMetadata(activeNode.nodeId, activeNode.shape as any);
  const presetFields = moduleMeta.fields || [];
  const selectedFields = currentCfg.fields || [];
  const recordFilterMode: 'all' | 'critical_only' | 'selected' =
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
      reportTags: moduleMeta.reportTags,
    });
  };

  const applyQuickCombo = (comboFields: string[]) => {
    const allAlreadySelected =
      comboFields.length === selectedFields.length &&
      comboFields.every((cf) => selectedFields.includes(cf));
    onUpdateNodeConfig(activeNode.key, {
      fields: allAlreadySelected ? [] : comboFields,
      strictFieldFilter: true,
      reportTags: moduleMeta.reportTags,
    });
  };

  const handleAddCustomField = () => {
    const val = customFieldInput.trim();
    if (!val) return;
    if (!selectedFields.includes(val)) {
      onUpdateNodeConfig(activeNode.key, {
        fields: [...selectedFields, val],
        reportTags: moduleMeta.reportTags,
      });
    }
    setCustomFieldInput('');
  };

  const handleSetRecordFilterMode = (mode: 'all' | 'critical_only' | 'selected') => {
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
    if (recordFilterMode === 'critical_only' && !rec.isCritical) {
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

  // Sub-componente reutilizable para la Tabla Real en Vivo de Registros (usado en Aplicativos SST, Trabajadores y Memorias)
  const renderLiveRecordsTableSection = (customTitle?: string) => {
    if (!nodeLiveInspectorData.supported) return null;
    return (
      <div className="p-3.5 rounded-2xl border border-emerald-300/80 dark:border-emerald-800/70 bg-emerald-50/30 dark:bg-emerald-950/15 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-[#C7F303] shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wide text-emerald-950 dark:text-[#C7F303]">
                  {customTitle || `📊 Registros y Estado Real en Vivo — ${activeNode.title}`}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  {nodeLiveInspectorData.loading
                    ? 'Consultando base de datos en vivo...'
                    : `${nodeLiveInspectorData.totalRecords} registro(s) en ${nodeLiveInspectorData.companyName || 'Empresa Activa'}`}
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
          <div className="flex flex-wrap items-center gap-2">
            <ExpandableButton
              size="sm"
              variant="teal"
              isActive={recordFilterMode === 'all'}
              alwaysExpanded
              icon={<Database className="w-3.5 h-3.5" />}
              label={`Todos (${nodeLiveInspectorData.totalRecords})`}
              onClick={() => handleSetRecordFilterMode('all')}
            />
            <ExpandableButton
              size="sm"
              variant="danger"
              isActive={recordFilterMode === 'critical_only'}
              alwaysExpanded
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              label={`Solo Críticos / En Brecha (${nodeLiveInspectorData.criticalCount})`}
              onClick={() => handleSetRecordFilterMode('critical_only')}
            />
            <ExpandableButton
              size="sm"
              variant="purple"
              isActive={recordFilterMode === 'selected'}
              alwaysExpanded
              icon={<Check className="w-3.5 h-3.5" />}
              label={`Seleccionados (${selectedRecordIds.length})`}
              onClick={() => handleSetRecordFilterMode('selected')}
            />
          </div>

          {nodeLiveInspectorData.records.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={liveRecordSearch}
                  onChange={(e) => setLiveRecordSearch(e.target.value)}
                  placeholder="Buscar registro real..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 w-52"
                />
              </div>
              {selectedRecordIds.length > 0 && (
                <ExpandableButton
                  size="sm"
                  variant="danger"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  label={`Limpiar (${selectedRecordIds.length})`}
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
            Sin registros que coincidan con el filtro actual en «{activeNode.title}».
          </div>
        )}
      </div>
    );
  };

  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 1: DISPARADORES (TRIGGER_NODES — 8 Nodos con UI Propia de Activación)
     ═════════════════════════════════════════════════════════════════════════ */
  if (activeNode.shape === 'trigger') {
    // 1.1 CRON PROGRAMADO / DISPARADOR POR HORARIO (Reemplaza el bloque suelto de la Imagen 3)
    if (cleanId.includes('schedule') || cleanId.includes('cron')) {
      const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const selectedDayNames = WEEK_DAYS.filter((d) => daysOfWeek.includes(d.id))
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
                { label: '06:00 AM Apertura', h: 6, m: 0 },
                { label: '07:30 AM Turno', h: 7, m: 30 },
                { label: '12:00 PM Mediodía', h: 12, m: 0 },
                { label: '05:00 PM Cierre', h: 17, m: 0 },
              ].map((preset) => (
                <ExpandableButton
                  key={preset.label}
                  size="sm"
                  variant="amber"
                  isActive={scheduleType !== 'hourly' && hour === preset.h && minute === preset.m}
                  alwaysExpanded
                  icon={<Clock className="w-3.5 h-3.5" />}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
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
                <div className="flex flex-wrap items-center gap-2">
                  {[1, 2, 4, 6, 8, 12, 24].map((hVal) => (
                    <button
                      key={hVal}
                      type="button"
                      onClick={() => onChangeIntervalHours && onChangeIntervalHours(hVal)}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition ${
                        intervalHours === hVal
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      Cada {hVal} h
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Días de la Semana o Día del Mes */}
            <div>
              {scheduleType === 'weekly' ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      3. ¿Qué días de la semana se activa?
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => onChangeDaysOfWeek && onChangeDaysOfWeek([1, 2, 3, 4, 5])}
                        className="text-[10px] font-extrabold text-teal-600 dark:text-[#C7F303] hover:underline"
                      >
                        Lun–Vie
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() =>
                          onChangeDaysOfWeek && onChangeDaysOfWeek([1, 2, 3, 4, 5, 6])
                        }
                        className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Lun–Sáb
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const isSel = daysOfWeek.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
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
                          title={day.name}
                          className={`w-10 h-10 rounded-xl font-black text-xs border-2 transition-all flex flex-col items-center justify-center ${
                            isSel
                              ? 'bg-teal-600 dark:bg-[#C7F303] text-white dark:text-[#0E1300] border-teal-600 dark:border-[#C7F303] shadow-sm scale-105'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                          }`}
                        >
                          {day.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : scheduleType === 'monthly' ? (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
                    3. ¿Qué día del mes se activa? (1 al 31)
                  </label>
                  <div className="flex items-center gap-2">
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
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 5, 15, 25, 30].map((dVal) => (
                        <button
                          key={dVal}
                          type="button"
                          onClick={() => onChangeDayOfMonth && onChangeDayOfMonth(dVal)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border ${
                            dayOfMonth === dVal
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          Día {dVal}
                        </button>
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
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'Tenshi, ejecuta la auditoría de hoy',
                  'Tenshi, revisa vencimientos de trabajadores',
                  'Tenshi, procesa los archivos nuevos de Drive',
                ].map((sample) => (
                  <ExpandableButton
                    key={sample}
                    size="sm"
                    variant="purple"
                    alwaysExpanded
                    icon={<MessageSquare className="w-3.5 h-3.5" />}
                    label={sample}
                    onClick={() => onUpdateNodeConfig(activeNode.key, { voiceCommand: sample })}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                📡 Canal de Escucha de Tenshi
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'both', label: '⚡ Voz 3D + Chat' },
                  { id: 'voice', label: '🎙️ Solo Voz Live' },
                  { id: 'chat', label: '💬 Solo Chat' },
                ].map((ch) => {
                  const active = (currentCfg.triggerChannel || 'both') === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() =>
                        onUpdateNodeConfig(activeNode.key, { triggerChannel: ch.id as any })
                      }
                      className={`p-2.5 rounded-xl border text-xs font-extrabold transition ${
                        active
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {ch.label}
                    </button>
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
                  onUpdateNodeConfig(activeNode.key, { watchFolderPath: e.target.value })
                }
                placeholder={
                  isCloud
                    ? 'Ej: Cola remota Cloud 24/7 o tarea delegada...'
                    : 'Ej: /Users/venta/Documents/SST_Reportes'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
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
    if (cleanId.includes('gmail') || cleanId.includes('email_inbox')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(currentCfg.onlyWithAttachments)}
                  onChange={(e) =>
                    onUpdateNodeConfig(activeNode.key, { onlyWithAttachments: e.target.checked })
                  }
                  className="rounded border-teal-500 text-teal-600"
                />
                <span>📎 Disparar solo si trae PDF / Excel adjunto</span>
              </label>
            </div>
          </div>
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
            <div className="flex gap-2">
              <ExpandableButton
                size="sm"
                variant="teal"
                isActive={(currentCfg.qrSeverityFilter || 'all') === 'all'}
                alwaysExpanded
                icon={<Check className="w-3.5 h-3.5" />}
                label="Cualquier Reporte Nuevo"
                onClick={() => onUpdateNodeConfig(activeNode.key, { qrSeverityFilter: 'all' })}
              />
              <ExpandableButton
                size="sm"
                variant="danger"
                isActive={currentCfg.qrSeverityFilter === 'critical_only'}
                alwaysExpanded
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                label="Solo Peligro Crítico / Alto"
                onClick={() =>
                  onUpdateNodeConfig(activeNode.key, { qrSeverityFilter: 'critical_only' })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
      );
    }

    // 1.8 DISPARADOR WEBHOOK / API EXTERNA
    const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://wappy.club'}/api/sgsst/automatizaciones/webhook`;
    return (
      <div className="space-y-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10.5px] font-extrabold uppercase text-slate-500">
              🔗 Endpoint Webhook POST para Sistemas Externos (ERP / Nómina / ARL / Formularios):
            </span>
            <div className="font-mono text-xs font-bold text-slate-900 dark:text-[#C7F303] mt-0.5">
              POST {webhookUrl}
            </div>
          </div>
          <ExpandableButton
            size="sm"
            variant="fuchsia"
            alwaysExpanded
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                if (isExtraAgent) {
                  onUpdateNodeConfig(activeNode.key, { aiEngine: eng, aiModel: mod });
                } else {
                  onSelectAiEngineModel(eng, mod);
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
                alwaysExpanded
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

  // 3.2 SUB-NODO CIRCULAR MODELO IA (CERO pastillas de campos)
  if (activeNode.shape === 'circle_model') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {AI_ENGINE_MODELS.map((m) => {
            const isSel =
              (m.engine === 'antigravity_cloud' && aiEngine === 'antigravity_cloud') ||
              (m.engine === 'antigravity' && aiEngine === 'antigravity') ||
              (m.engine === 'wappy' && aiEngine === 'wappy' && aiModel === m.model);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectAiEngineModel(m.engine, m.model)}
                className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between ${
                  isSel
                    ? 'bg-indigo-50/90 dark:bg-slate-800 border-indigo-500 dark:border-[#C7F303] ring-2 ring-indigo-500/20 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {m.shortLabel}
                    </span>
                    {isSel && (
                      <span className="w-4 h-4 rounded-full bg-indigo-600 dark:bg-[#C7F303] text-white dark:text-[#0E1300] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {m.subtitle}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-snug">
                  {m.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
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
                className={`p-2.5 rounded-xl border text-left transition ${
                  active
                    ? 'bg-teal-50/80 dark:bg-teal-950/30 border-teal-500 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {tempOpt.title}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {tempOpt.desc}
                </div>
              </button>
            );
          })}
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
        'Razón Social, NIT y Actividad Económica (CIIU)',
        'Clase de Riesgo, ARL Afiliada y Tasa de Cotización',
        'Total de Trabajadores Activos y Distribución por Sedes',
        'Responsable del SG-SST y Licencia Vigente',
      ];
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {companyBlocks.map((blk) => {
              const checked = selectedFields.length === 0 || selectedFields.includes(blk);
              return (
                <label
                  key={blk}
                  onClick={() => toggleFieldChip(blk)}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                    checked
                      ? 'bg-pink-50/60 dark:bg-pink-950/25 border-pink-400 dark:border-pink-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                      checked
                        ? 'bg-pink-600 border-pink-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {blk}
                  </span>
                </label>
              );
            })}
          </div>
          {renderLiveRecordsTableSection('🏢 Ficha Real en Vivo de la Empresa Activa')}
        </div>
      );
    }

    // 4.2 MEMORIA BITÁCORA ANTI-DUPLICADOS
    if (cleanId.includes('antiduplicate')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                🛡️ Ventana de Tiempo Anti-Duplicados
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: '24h', label: 'Últimas 24h' },
                  { id: '7d', label: 'Últimos 7 días' },
                  { id: '30d', label: 'Últimos 30 días' },
                  { id: 'all', label: 'Histórico Total' },
                ].map((win) => {
                  const active = (currentCfg.dedupWindow || '7d') === win.id;
                  return (
                    <button
                      key={win.id}
                      type="button"
                      onClick={() =>
                        onUpdateNodeConfig(activeNode.key, { dedupWindow: win.id as any })
                      }
                      className={`p-2 rounded-xl border text-xs font-extrabold transition ${
                        active
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {win.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1.5">
                🔑 Clave para detectar si un registro ya fue procesado
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cedula', label: 'Por Cédula' },
                  { id: 'standard_id', label: 'Por ID Hallazgo' },
                  { id: 'filename', label: 'Por Archivo/Correo' },
                ].map((dk) => {
                  const active = (currentCfg.dedupKey || 'cedula') === dk.id;
                  return (
                    <button
                      key={dk.id}
                      type="button"
                      onClick={() =>
                        onUpdateNodeConfig(activeNode.key, { dedupKey: dk.id as any })
                      }
                      className={`p-2 rounded-xl border text-xs font-extrabold transition ${
                        active
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {dk.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {renderLiveRecordsTableSection('📜 Últimas Ejecuciones Reales Guardadas en Bitácora')}
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

              <div className="flex flex-wrap items-center gap-1.5">
                <ExpandableButton
                  size="sm"
                  variant="emerald"
                  alwaysExpanded
                  icon={<Check className="w-3.5 h-3.5" />}
                  label={`Todas (${TENSHI_NORMATIVE_MARKDOWN_DOCS.length} .md)`}
                  onClick={() =>
                    selectNormativeCombo(TENSHI_NORMATIVE_MARKDOWN_DOCS.map((d) => d.id))
                  }
                />
                <ExpandableButton
                  size="sm"
                  variant="teal"
                  alwaysExpanded
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
                  alwaysExpanded
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
                  alwaysExpanded
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
                    alwaysExpanded
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    label="Limpiar"
                    onClick={() => selectNormativeCombo([])}
                  />
                )}
              </div>
            </div>

            {/* Pestañas de Categoría Normativa + Buscador */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {TENSHI_NORMATIVE_CATEGORIES.map((cat) => {
                  const isAct = normativeCategoryFilter === cat.id;
                  const countInCat =
                    cat.id === 'all'
                      ? TENSHI_NORMATIVE_MARKDOWN_DOCS.length
                      : TENSHI_NORMATIVE_MARKDOWN_DOCS.filter((d) => d.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNormativeCategoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border transition ${
                        isAct
                          ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-pink-400'
                      }`}
                    >
                      {cat.label.replace(/\s*\(\d+\)$/, '')} ({countInCat})
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[260px] flex-1 max-w-md">
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
          <div className="max-h-[340px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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

          {renderLiveRecordsTableSection(
            '📄 Vista en Vivo de los Archivos Normativos Markdown (.md) Indexados en Tenshi',
          )}
        </div>
      );
    }

    // 4.4 MEMORIA DOCUMENTAL RAG (DOCUMENTOS VIVOS Y NOTEBOOKLM)
    return (
      <div className="space-y-3">
        {renderLiveRecordsTableSection(
          '📚 Documentos Vivos y Cuadernos NotebookLM de tu Empresa (Marca cuáles consultar)',
        )}
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 7: BITÁCORA Y SALIDA (OUTPUT_ACTION_NODES — 11 Nodos con Formulario Propio)
     ═════════════════════════════════════════════════════════════════════════ */
  if (activeNode.shape === 'square_output') {
    // 7.1 BITÁCORA A GMAIL (Reemplaza el bloque suelto de Correos de Destinatarios de la Imagen 3)
    if (cleanId.includes('email')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📧 Correos de Destinatarios (Separados por coma) *
              </label>
              <input
                type="text"
                value={emailsStr}
                onChange={(e) => onChangeEmailsStr && onChangeEmailsStr(e.target.value)}
                placeholder="Ej: wappyinteractivo@gmail.com, gerencia@empresa.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                ✉️ Asunto Personalizado del Correo
              </label>
              <input
                type="text"
                value={currentCfg.emailSubject || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { emailSubject: e.target.value })
                }
                placeholder="Ej: [Alerta SG-SST] Reporte de Afiliaciones y Vencimientos"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(currentCfg.onlyOnCriticalAlerts)}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { onlyOnCriticalAlerts: e.target.checked })
              }
              className="rounded border-teal-500 text-teal-600"
            />
            <span>
              🚨 Enviar correo únicamente cuando el flujo encuentre hallazgos críticos, brechas o vencimientos
            </span>
          </label>
        </div>
      );
    }

    // 7.2 NOTIFICAR EN WAPPY + TENSHI VOZ
    if (cleanId.includes('wappy_notification')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1.5">
              🔔 Nivel de Prioridad de la Notificación en WAPPY
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'info', label: '🟢 Informativa' },
                { id: 'warn', label: '🟡 Preventiva' },
                { id: 'critical', label: '🔴 Crítica Urgente' },
              ].map((p) => {
                const active = (currentCfg.alertPriority || 'warn') === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      onUpdateNodeConfig(activeNode.key, { alertPriority: p.id as any })
                    }
                    className={`p-2.5 rounded-xl border text-xs font-extrabold transition ${
                      active
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
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
              <span>🐱 Hacer que Tenshi Avatar 3D te anuncie el resumen al entrar</span>
            </label>
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
              💬 Mensaje o Resumen Ejecutivo a Enviar
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              👥 Correos de Invitados (Opcional)
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
      );
    }

    // 7.5 CREAR TAREA EN CENTRO DE CONTROL / KANBAN ACPM
    if (cleanId.includes('acpm_task')) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              🚨 Prioridad de la Tarea ACPM en el Kanban
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
              📆 Plazo de Cumplimiento (Días)
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
              👤 Responsable Asignado
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
      );
    }

    // 7.6 RESTO DE SALIDAS (Drive Export, Documento Vivo Canvas, Curso LMS, Artículo Blog, Antigravity Report)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
            📄 Título / Destino de «{activeNode.title}»
          </label>
          <input
            type="text"
            value={currentCfg.documentTitle || currentCfg.driveFolderName || ''}
            onChange={(e) =>
              onUpdateNodeConfig(activeNode.key, {
                documentTitle: e.target.value,
                driveFolderName: e.target.value,
              })
            }
            placeholder={
              cleanId.includes('drive')
                ? 'Ej: Carpeta Informes_SG_SST_2026 en Google Drive'
                : cleanId.includes('antigravity')
                  ? 'Ej: ~/Documents/Reportes_WAPPY/informe.md'
                  : 'Ej: Acta Oficial / Informe Ejecutivo de Auditoría'
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
            ⚙️ Formato / Instrucción de Entrega
          </label>
          <input
            type="text"
            value={currentCfg.customInstruction || ''}
            onChange={(e) =>
              onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
            }
            placeholder="Ej: Incluir tabla firmable, conclusiones normativas y plan de acción..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
          />
        </div>
      </div>
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 8: NODOS LÓGICOS (CONDICIÓN SI/NO, LOOP, MERGE, APROBACIÓN) + SKILLS / REGLAS / SCRAPING
     ═════════════════════════════════════════════════════════════════════════ */
  if (activeNode.shape === 'if' || activeNode.key === 'if_router') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold uppercase text-emerald-700 dark:text-emerald-300 mb-1">
              🔀 1. ¿Qué evalúa esta Condición Si / No?
            </label>
            <select
              value={currentCfg.ifConditionType || 'critical_findings'}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { ifConditionType: e.target.value as any })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="critical_findings">
                🚨 Si existen hallazgos críticos, vencimientos o brechas
              </option>
              <option value="keyword_match">
                🔤 Si los datos extraídos cumplen una condición específica (ej. sin EPS/ARL)
              </option>
              <option value="numeric_threshold">
                🔢 Si el puntaje o porcentaje es menor a un umbral (ej. &lt; 85%)
              </option>
              <option value="ai_evaluation">
                🧠 Evaluación inteligente del Agente IA según tu regla
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              📏 2. Expresión o Regla Exacta a Evaluar
            </label>
            <input
              type="text"
              value={currentCfg.ifRuleExpression || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { ifRuleExpression: e.target.value })
              }
              placeholder="Ej: Si algún trabajador no tiene certificado de afiliación vigente o tiene EMO vencido..."
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
      </div>
    );
  }

  if (activeNode.shape === 'logic') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
            ⚙️ Regla de Control para «{activeNode.title}»
          </label>
          <input
            type="text"
            value={currentCfg.customInstruction || ''}
            onChange={(e) =>
              onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
            }
            placeholder={
              activeNode.nodeId.includes('loop')
                ? 'Ej: Iterar trabajador por trabajador verificando su cédula...'
                : activeNode.nodeId.includes('approval')
                  ? 'Ej: Solicitar visto bueno antes de publicar el informe final...'
                  : 'Ej: Unir los resultados de ambas ramas en una sola tabla...'
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
          />
        </div>
        {activeNode.nodeId.includes('approval') && (
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
    );
  }

  // NODOS DE WEB SCRAPING CON ANTIGRAVITY, BÚSQUEDA WEB, SKILLS, SUB-AGENTES Y REGLAS (Sin muro de pastillas)
  const catalogScraperDef = SKILL_RULE_SUBAGENT_NODES.find(
    (sn) => sn.id === cleanId || sn.id === activeNode.nodeId,
  );
  const defaultCatalogEngine =
    catalogScraperDef?.scriptEngine === 'chrome_devtools_mcp'
      ? 'chrome_mcp'
      : catalogScraperDef?.scriptEngine === 'node_cheerio_puppeteer'
        ? 'node_cheerio'
        : 'python_bs4';
  const isWebScraperNode =
    activeNode.customNodeType === 'web_scraper' ||
    rawId.includes('scraping') ||
    rawId.includes('web_scraper') ||
    rawId.includes('scraper_agy_');
  const isWebSearchNode =
    activeNode.customNodeType === 'web_search' || rawId.includes('web_search');
  const isSkillNode = activeNode.customNodeType === 'skill' || cleanId.startsWith('skill_');
  const isRuleNode = activeNode.customNodeType === 'rule' || cleanId.startsWith('rule_');
  const isSubagentCustomNode =
    activeNode.customNodeType === 'subagent' || cleanId.startsWith('subagent_');

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
              alwaysExpanded
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
        <div className="flex flex-wrap gap-1.5">
          {[
            'site:mintrabajo.gov.co normatividad SST',
            'site:minsalud.gov.co resoluciones salud laboral',
            'site:positiva.gov.co guías preventivas ARL',
            'site:arlsura.com matriz legal SST',
          ].map((qPreset) => (
            <ExpandableButton
              key={qPreset}
              size="sm"
              variant="cyan"
              alwaysExpanded
              icon={<Globe className="w-3.5 h-3.5" />}
              label={qPreset}
              onClick={() => onUpdateNodeConfig(activeNode.key, { targetUrl: qPreset })}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isSkillNode || isRuleNode || isSubagentCustomNode) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-extrabold uppercase text-purple-700 dark:text-[#C7F303]">
          {isSkillNode
            ? '🧩 Instrucciones Procedurales de esta Skill (SKILL.md)'
            : isRuleNode
              ? '📏 Regla Obligatoria / Guardrail que el Flujo Jamás Debe Romper'
              : '🤖 Rol e Instrucción Específica de este Sub-Agente Especialista'}
        </label>
        <textarea
          rows={4}
          value={
            isSkillNode
              ? currentCfg.skillContent ?? customNodeObj?.content ?? catalogScraperDef?.content ?? ''
              : isRuleNode
                ? currentCfg.ruleText ?? customNodeObj?.content ?? catalogScraperDef?.content ?? ''
                : currentCfg.prompt ?? customNodeObj?.content ?? catalogScraperDef?.content ?? ''
          }
          onChange={(e) => {
            if (isSkillNode) {
              onUpdateNodeConfig(activeNode.key, { skillContent: e.target.value });
            } else if (isRuleNode) {
              onUpdateNodeConfig(activeNode.key, { ruleText: e.target.value });
            } else {
              onUpdateNodeConfig(activeNode.key, { prompt: e.target.value });
            }
          }}
          placeholder="Escribe aquí las instrucciones exactas de esta Skill, Regla o Sub-Agente..."
          className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
        />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📧 Filtrar por Remitente (De:)
              </label>
              <input
                type="text"
                value={currentCfg.emailSenderFilter || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { emailSenderFilter: e.target.value })
                }
                placeholder="Ej: arl@positiva.gov.co, laboratorio@..."
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
                placeholder="Ej: Certificado Afiliación, FURAT, Concepto Aptitud"
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
        </div>
      );
    }

    if (cleanId.includes('drive') || cleanId.includes('onedrive')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📁 Nombre de la Carpeta o Archivo a Leer
              </label>
              <input
                type="text"
                value={currentCfg.driveFolderName || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { driveFolderName: e.target.value })
                }
                placeholder="Ej: Certificados_EPS_ARL o Reportes_ATEL"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📄 Tipo de Archivos a Extraer
              </label>
              <select
                value={currentCfg.fileTypeFilter || 'all'}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { fileTypeFilter: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="all">Todos los formatos (PDF, Excel, Word, Sheets)</option>
                <option value="pdf">Solo Documentos PDF (Certificados / FURAT / EMO)</option>
                <option value="excel">Solo Hojas de Cálculo Excel / Google Sheets</option>
                <option value="word">Solo Documentos Word / Google Docs</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="w-full flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={currentCfg.onlyNewFiles !== false}
                  onChange={(e) =>
                    onUpdateNodeConfig(activeNode.key, { onlyNewFiles: e.target.checked })
                  }
                  className="rounded border-teal-500 text-teal-600"
                />
                <span>⚡ Procesar solo archivos nuevos o modificados</span>
              </label>
            </div>
          </div>
          {renderLiveRecordsTableSection('📂 Archivos y Carpetas Detectados en tu Cuenta')}
        </div>
      );
    }

    if (cleanId.includes('local_folder') || cleanId.includes('local_pc')) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                💻 Ruta de la Carpeta en tu Computador (vía Antigravity Local)
              </label>
              <input
                type="text"
                value={currentCfg.watchFolderPath || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { watchFolderPath: e.target.value })
                }
                placeholder="Ej: /Users/venta/Documents/Certificados_Trabajadores"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
                📄 Filtro de Archivos Locales
              </label>
              <input
                type="text"
                value={currentCfg.fileTypeFilter || ''}
                onChange={(e) =>
                  onUpdateNodeConfig(activeNode.key, { fileTypeFilter: e.target.value })
                }
                placeholder="Ej: *.pdf, *.xlsx (Certificados EPS/ARL, Planillas, Exámenes)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      );
    }
  }

  /* ═════════════════════════════════════════════════════════════════════════
     EQUIPO 5: HERRAMIENTAS DEL AGENTE EXTERNAS (Google Suite, Estudios IA, Radares)
     ═════════════════════════════════════════════════════════════════════════ */
  if (
    activeNode.shape === 'circle_tool' &&
    !cleanId.startsWith('somos_sst_') &&
    !cleanId.startsWith('hito')
  ) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              🔧 Acción Específica que el Agente ejecutará con «{activeNode.title}»
            </label>
            <input
              type="text"
              value={currentCfg.customInstruction || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, { customInstruction: e.target.value })
              }
              placeholder={`Ej: Usar ${activeNode.title} únicamente para consultar o generar el recurso requerido...`}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200 mb-1">
              🎯 Parámetro / Carpeta / Ciudad / Sustancia Objetivo
            </label>
            <input
              type="text"
              value={currentCfg.driveFolderName || currentCfg.targetUrl || ''}
              onChange={(e) =>
                onUpdateNodeConfig(activeNode.key, {
                  driveFolderName: e.target.value,
                  targetUrl: e.target.value,
                })
              }
              placeholder="Ej: Nombre de carpeta Drive, ciudad para pronóstico de clima o sustancia CAS..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white"
            />
          </div>
        </div>
        {renderLiveRecordsTableSection()}
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

  const hitoOpMode =
    currentCfg.hitoOperationMode ||
    (activeNode.shape === 'square_extractor' ? 'extract_only' : 'audit_and_update');

  return (
    <div className="space-y-4">
      {/* 1. MODO DE OPERACIÓN EN EL APLICATIVO DE SOMOS SST */}
      {activeNode.shape === 'square_hito' && (
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2">
            1. ¿Qué debe hacer el flujo en «{activeNode.title}»?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: 'extract_only',
                title: '🔍 Solo Extraer Datos Puntuales',
                desc: 'Lee únicamente las columnas que marques abajo (ej. solo Cédula y Nombre) sin saturar el proceso.',
              },
              {
                id: 'write_register',
                title: '✍️ Registrar / Alimentar Aplicativo',
                desc: 'Guarda nuevos registros, hallazgos, casos ATEL, tareas o controles directamente en este aplicativo.',
              },
              {
                id: 'audit_and_update',
                title: '🔄 Auditar Brechas + Actualizar',
                desc: 'Consulta los registros actuales del aplicativo, cruza la información y actualiza el cumplimiento.',
              },
            ].map((modeOpt) => {
              const active = hitoOpMode === modeOpt.id;
              return (
                <button
                  key={modeOpt.id}
                  type="button"
                  onClick={() =>
                    onUpdateNodeConfig(activeNode.key, {
                      hitoOperationMode: modeOpt.id as any,
                    })
                  }
                  className={`p-3 rounded-2xl border-2 text-left transition ${
                    active
                      ? 'bg-teal-50/90 dark:bg-slate-800 border-teal-600 dark:border-[#C7F303] ring-2 ring-teal-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {modeOpt.title}
                    </span>
                    {active && <Check className="w-4 h-4 text-teal-600 dark:text-[#C7F303] stroke-[3]" />}
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {modeOpt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. CUADRÍCULA ORDENADA DE CHECKBOXES DE COLUMNAS / DATOS PROPIOS DEL APLICATIVO */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                📋 Columnas y Datos de «{moduleMeta.moduleTitle}»
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-[#C7F303] border border-teal-300 dark:border-teal-700">
                {selectedFields.length > 0
                  ? `${selectedFields.length} columna(s) seleccionada(s)`
                  : `Todas las columnas (${presetFields.length})`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Marca solo las columnas que necesitas para este paso (ej. <em>Cédula y Nombre Completo</em> o <em>Tarjetas Preventivas</em>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fieldSearchQuery}
                onChange={(e) => setFieldSearchQuery(e.target.value)}
                placeholder="Buscar columna..."
                className="pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 w-44"
              />
            </div>
            <ExpandableButton
              size="sm"
              variant="teal"
              icon={<Check className="w-3.5 h-3.5" />}
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
                label={`Limpiar (${selectedFields.length})`}
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

        {/* Atajos Rápidos de 1 Clic con ExpandableButton */}
        {moduleMeta.quickCombos && moduleMeta.quickCombos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[10.5px] font-extrabold uppercase text-purple-700 dark:text-[#C7F303] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Selección Rápida:
            </span>
            {moduleMeta.quickCombos.map((combo) => {
              const isComboActive =
                combo.fields.length === selectedFields.length &&
                combo.fields.every((cf) => selectedFields.includes(cf));
              return (
                <ExpandableButton
                  key={combo.label}
                  size="sm"
                  variant="purple"
                  isActive={isComboActive}
                  alwaysExpanded
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  label={combo.label}
                  title={combo.description}
                  onClick={() => applyQuickCombo(combo.fields)}
                />
              );
            })}
          </div>
        )}

        {/* Cuadrícula Ordenada de Checkboxes en 3 Columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
          {filteredPresetFields.map((fieldLabel) => {
            const active = selectedFields.includes(fieldLabel);
            return (
              <label
                key={fieldLabel}
                onClick={() => toggleFieldChip(fieldLabel)}
                className={`px-3 py-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition select-none text-xs ${
                  active
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 dark:border-[#C7F303] font-extrabold text-purple-950 dark:text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                }`}
              >
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
              </label>
            );
          })}
        </div>

        {/* Añadir Columna Personalizada + Switch Modo Quirúrgico */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <input
              type="text"
              value={customFieldInput}
              onChange={(e) => setCustomFieldInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomField();
                }
              }}
              placeholder="Otra columna específica de este aplicativo..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
            />
            <ExpandableButton
              size="sm"
              variant="emerald"
              alwaysExpanded
              icon={<Plus className="w-3.5 h-3.5" />}
              label="Añadir Columna"
              onClick={handleAddCustomField}
            />
          </div>

          {selectedFields.length > 0 && (
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
                🔒 Extraer <strong>SOLO</strong> estas {selectedFields.length} columna(s) (No saturar el flujo)
              </span>
            </label>
          )}
        </div>
      </div>

      {/* 3. TABLA REAL EN VIVO DE REGISTROS DE ESTE APLICATIVO EN MONGODB */}
      {renderLiveRecordsTableSection()}

      {/* 4. HISTORIAL DE INFORMES GUARDADOS DE ESTE APLICATIVO */}
      {moduleMeta.reportTags && moduleMeta.reportTags.length > 0 && (
        <div className="p-3.5 rounded-2xl border border-teal-300/80 dark:border-teal-800/80 bg-teal-50/35 dark:bg-teal-950/20 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <div>
                <span className="text-xs font-black uppercase text-teal-950 dark:text-teal-200">
                  📜 Historial de Informes de «{activeNode.title}» ({nodeReportHistory.conversations.length})
                </span>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-400">
                  Puedes incluir el último informe generado en este aplicativo o seleccionar informes anteriores específicos.
                </p>
              </div>
            </div>

            <ExpandableButton
              size="sm"
              variant="teal"
              isActive={Boolean(currentCfg.includeLatestReport)}
              alwaysExpanded
              icon={<FileText className="w-3.5 h-3.5" />}
              label="Incluir Siempre el Último Informe"
              onClick={() =>
                onUpdateNodeConfig(activeNode.key, {
                  includeLatestReport: !currentCfg.includeLatestReport,
                  reportTags: moduleMeta.reportTags,
                })
              }
            />
          </div>

          {nodeReportHistory.conversations.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {nodeReportHistory.conversations.slice(0, 10).map((rep) => {
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
                    <button
                      type="button"
                      onClick={() => onPreviewNodeReport(rep.conversationId, rep.title)}
                      className="text-[10.5px] font-bold text-teal-700 dark:text-[#C7F303] hover:underline shrink-0"
                    >
                      {isPreviewing ? 'Ocultar' : '👁️ Ver Resumen'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {nodeReportHistory.previewConvId && (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-800 text-xs">
              <div className="font-extrabold text-teal-700 dark:text-teal-300 mb-1 flex items-center justify-between">
                <span>📄 {nodeReportHistory.previewTitle}</span>
                <button
                  type="button"
                  onClick={onCloseReportPreview}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >
                  Cerrar ✕
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                {nodeReportHistory.previewLoading
                  ? 'Cargando resumen del informe...'
                  : nodeReportHistory.previewText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
