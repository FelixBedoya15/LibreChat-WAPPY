export interface WorkflowNodeDef {
  id: string;
  label: string;
  shortLabel: string;
  category: string;
  toolHint: string;
  badgeColor: string;
  icon?: string;
  badge?: string;
  description?: string;
  /** ID oficial del aplicativo en Somos SST (PHASE_CATEGORIES en constants.ts) */
  sgsstAppId?: string;
  /** ID oficial del Hito en Somos SST ('hito1' .. 'hito8') */
  hitoId?: 'hito1' | 'hito2' | 'hito3' | 'hito4' | 'hito5' | 'hito6' | 'hito7' | 'hito8';
  /** Si el aplicativo está en modo construcción por defecto */
  defaultConstruction?: boolean;
}

/**
 * Aplicativos en modo construcción por defecto en Somos SST (sincronizado además en vivo con GET /api/sgsst/config -> disabledApps).
 */
export const DEFAULT_CONSTRUCTION_APP_IDS: string[] = [
  'legal',
  'comite_pesv',
  'brigada_emergencias',
  'equipos_emergencia',
  'comunicaciones_sst',
  'simulacros_emergencia',
  'app_builder',
  'investigacion_profunda',
];

export const HITOS_8_FILTER_TABS: Array<{ id: string; label: string; shortLabel: string }> = [
  { id: 'all', label: 'Todos los 8 Hitos (50 Apps)', shortLabel: 'Todos (50)' },
  { id: 'hito1', label: 'Hito 1 · Gobernanza y Legal (15)', shortLabel: 'Hito 1 (15)' },
  { id: 'hito2', label: 'Hito 2 · Huella Biocéntrica (4)', shortLabel: 'Hito 2 (4)' },
  { id: 'hito3', label: 'Hito 3 · Comités y Brigadas (4)', shortLabel: 'Hito 3 (4)' },
  { id: 'hito4', label: 'Hito 4 · Evaluación Dinámica (4)', shortLabel: 'Hito 4 (4)' },
  { id: 'hito5', label: 'Hito 5 · Operativa y Terreno (10)', shortLabel: 'Hito 5 (10)' },
  { id: 'hito6', label: 'Hito 6 · Cultura y Escuela (6)', shortLabel: 'Hito 6 (6)' },
  { id: 'hito7', label: 'Hito 7 · Auditoría y ATEL (6)', shortLabel: 'Hito 7 (6)' },
  { id: 'hito8', label: 'Hito 8 · IA Predictiva (1)', shortLabel: 'Hito 8 (1)' },
];

export function isWorkflowNodeUnderConstruction(
  node?: WorkflowNodeDef | null,
  disabledApps?: string[] | null,
): boolean {
  if (!node) return false;
  const activeDisabledList =
    Array.isArray(disabledApps) && disabledApps.length > 0
      ? disabledApps
      : DEFAULT_CONSTRUCTION_APP_IDS;
  if (node.sgsstAppId && activeDisabledList.includes(node.sgsstAppId)) {
    return true;
  }
  if (node.hitoId && activeDisabledList.includes(node.hitoId)) {
    return true;
  }
  if (!disabledApps && node.defaultConstruction) {
    return true;
  }
  return false;
}

export interface CanvasNodePosition {
  x: number;
  y: number;
}

export interface CanvasWireEdge {
  id: string;
  from: string;
  to: string;
  kind: 'main' | 'sub' | 'branch_true' | 'branch_false';
  label?: string;
}

export interface CanvasExtraAgentNode {
  key: string;
  agentId?: string;
  agentName?: string;
  aiEngine?: 'wappy' | 'antigravity' | 'antigravity_cloud';
  aiModel?: string;
  roleLabel?: string;
  prompt?: string;
  inputContext?: string;
  outputContext?: string;
}

export interface CanvasLogicNode {
  key: string;
  logicType: 'switch' | 'loop' | 'merge' | 'human_approval' | 'filter';
  title: string;
  subtitle: string;
}

export interface CanvasCustomUserNode {
  key: string;
  nodeType: 'skill' | 'subagent' | 'rule' | 'web_scraper' | 'web_search';
  title: string;
  subtitle: string;
  content?: string;
  targetUrl?: string;
  scriptEngine?:
    | 'python_bs4'
    | 'node_cheerio'
    | 'chrome_mcp'
    | 'python_bs4_playwright'
    | 'node_cheerio_puppeteer'
    | 'chrome_devtools_mcp'
    | 'custom_script';
  scriptCode?: string;
  aiEngine?: 'wappy' | 'antigravity' | 'antigravity_cloud';
  aiModel?: string;
  agentId?: string;
}

export interface CanvasNodeConfig {
  fields?: string[];
  /** Si es true (por defecto cuando hay campos elegidos), el nodo extrae ÚNICAMENTE los campos seleccionados para no saturar el flujo */
  strictFieldFilter?: boolean;
  /** Modo de filtro de registros reales en vivo: todos, solo críticos/brechas o selección específica */
  recordFilterMode?: 'all' | 'critical_only' | 'selected';
  /** IDs de registros reales específicos seleccionados en el Inspector de Datos en Vivo */
  selectedRecordIds?: string[];
  /** Etiquetas legibles de los registros específicos seleccionados */
  selectedRecordLabels?: string[];
  /** Si es true, incluye automáticamente el último informe guardado del Historial de Informes del aplicativo */
  includeLatestReport?: boolean;
  /** IDs (conversationId) de informes específicos seleccionados del Historial de Informes del aplicativo */
  selectedReportIds?: string[];
  /** Títulos legibles de los informes seleccionados del Historial de Informes */
  selectedReportTitles?: string[];
  /** Tags del historial de informes del aplicativo (ej. ['sgsst-diagnostico']) */
  reportTags?: string[];
  inputContext?: string;
  outputContext?: string;
  customInstruction?: string;
  aiEngine?: 'wappy' | 'antigravity' | 'antigravity_cloud';
  aiModel?: string;
  prompt?: string;
  conditionTrueLabel?: string;
  conditionFalseLabel?: string;
  targetUrl?: string;
  scriptEngine?:
    | 'python_bs4'
    | 'node_cheerio'
    | 'chrome_mcp'
    | 'python_bs4_playwright'
    | 'node_cheerio_puppeteer'
    | 'chrome_devtools_mcp'
    | 'custom_script';
  scriptCode?: string;
  skillContent?: string;
  ruleText?: string;
  /** Parámetros propios de Disparadores (Equipo 1) */
  voiceCommand?: string;
  triggerChannel?: 'voice' | 'chat' | 'both';
  emailSenderFilter?: string;
  emailSubjectFilter?: string;
  onlyWithAttachments?: boolean;
  qrPortalTarget?: string;
  qrSeverityFilter?: 'all' | 'critical_only';
  sourceAgentId?: string;
  webhookSecret?: string;
  watchFolderPath?: string;
  /** Parámetros propios de Extractores (Equipo 2) */
  driveFolderName?: string;
  fileTypeFilter?: string;
  onlyNewFiles?: boolean;
  maxItems?: number;
  timeWindow?: string;
  workerStatusFilter?: 'active' | 'all' | 'retired' | 'with_restrictions';
  /** Parámetros propios de Motor IA y Memorias (Equipos 3 y 4) */
  temperature?: string;
  agentOutputStyle?: 'executive_report' | 'structured_table' | 'silent_action';
  dedupWindow?: '24h' | '7d' | '30d' | 'all';
  dedupKey?: 'cedula' | 'standard_id' | 'filename';
  legalStandards?: string[];
  /** Modo de operación en Aplicativos de Hitos SST (Equipo 6) */
  hitoOperationMode?: 'extract_only' | 'write_register' | 'audit_and_update';
  /** Parámetros propios de Bitácora y Salidas (Equipo 7) */
  emailSubject?: string;
  onlyOnCriticalAlerts?: boolean;
  alertPriority?: 'info' | 'warn' | 'critical';
  tenshiSpeakSummary?: boolean;
  whatsappNumbers?: string;
  calendarEventTitle?: string;
  calendarDurationMinutes?: number;
  calendarAttendees?: string;
  documentTitle?: string;
  documentTemplate?: string;
  kanbanStatus?: 'todo' | 'in_progress' | 'urgent';
  kanbanPriority?: 'high' | 'medium' | 'low';
  kanbanDueDays?: number;
  kanbanAssignee?: string;
  /** Parámetros propios de Nodos Lógicos If / Loop / Aprobación (Equipo 8) */
  ifConditionType?: 'critical_findings' | 'numeric_threshold' | 'keyword_match' | 'ai_evaluation';
  ifRuleExpression?: string;
  approverEmail?: string;
}

export interface NodeQuickCombo {
  label: string;
  description?: string;
  fields: string[];
}

export interface NodeModuleMetadata {
  moduleTitle: string;
  moduleBadge: string;
  fieldsLabel: string;
  fields: string[];
  quickCombos: NodeQuickCombo[];
  reportTags: string[];
}

export interface WorkflowNodesConfig {
  trigger: string;
  triggers?: string[];
  extractors?: string[];
  aiEngine?: 'wappy' | 'antigravity' | 'antigravity_cloud';
  aiModel?: string;
  memoryNode?: string;
  memories?: string[];
  includeIfNode?: boolean;
  inputs: string[];
  hitos: string[];
  outputs: string[];
  canvasLayout?: {
    positions?: Record<string, CanvasNodePosition>;
    edges?: CanvasWireEdge[];
    removedWires?: string[];
    extraAgents?: CanvasExtraAgentNode[];
    logicNodes?: CanvasLogicNode[];
    customNodes?: CanvasCustomUserNode[];
    nodeConfigs?: Record<string, CanvasNodeConfig>;
  } | null;
}

export interface AiEngineModelDef {
  id: string;
  engine: 'wappy' | 'antigravity' | 'antigravity_cloud';
  model: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  description: string;
}

/**
 * Modelos verificados en .env (GOOGLE_MODELS=gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.8-flash)
 * + Motor Google Antigravity Local (Mac/PC) y Google Antigravity Cloud 24/7 (antigravity.google.com) con Servidor MCP WAPPY (110+ tools).
 */
export const AI_ENGINE_MODELS: AiEngineModelDef[] = [
  {
    id: 'wappy_gemini_3_6_flash',
    engine: 'wappy',
    model: 'gemini-3.6-flash',
    label: 'WAPPY IA · Gemini 3.6 Flash (Key Rotation)',
    shortLabel: 'Gemini 3.6 Flash',
    subtitle: 'WAPPY Cloud · Rotación de Claves',
    description: 'Motor en la nube 24/7 con rotación automática de claves WAPPY y balance óptimo de razonamiento.',
  },
  {
    id: 'wappy_gemini_3_5_flash_lite',
    engine: 'wappy',
    model: 'gemini-3.5-flash-lite',
    label: 'WAPPY IA · Gemini 3.5 Flash Lite (Ultra Rápido)',
    shortLabel: 'Gemini 3.5 Lite',
    subtitle: 'WAPPY Cloud · Alta Velocidad',
    description: 'Ideal para barridos frecuentes de Drive, vencimientos y alertas rápidas con rotación de claves.',
  },
  {
    id: 'wappy_gemini_3_8_flash',
    engine: 'wappy',
    model: 'gemini-3.8-flash',
    label: 'WAPPY IA · Gemini 3.8 Flash (Análisis Profundo)',
    shortLabel: 'Gemini 3.8 Flash',
    subtitle: 'WAPPY Cloud · Máxima Precisión',
    description: 'Máxima capacidad analítica para auditorías Res. 0312, investigación ATEL, Matriz Legal y DOFA.',
  },
  {
    id: 'antigravity_mcp_engine',
    engine: 'antigravity',
    model: 'gemini-3.6-flash',
    label: 'Google Antigravity Local (Mac/PC) + MCP WAPPY (110+ Tools)',
    shortLabel: 'Antigravity Local + MCP',
    subtitle: 'Puente Push SSE Mac/PC + Respaldo Cloud',
    description: 'Delega el procesamiento a tu Antigravity en Mac/PC vía Push SSE con las 110+ herramientas MCP y respaldo automático.',
  },
  {
    id: 'antigravity_cloud_mcp_engine',
    engine: 'antigravity_cloud',
    model: 'gemini-3.6-flash',
    label: 'Google Antigravity Cloud 24/7 (antigravity.google.com) + MCP WAPPY',
    shortLabel: 'Antigravity Cloud 24/7',
    subtitle: 'Cloud 24/7 sin PC Prendido + MCP',
    description: 'Delega el procesamiento a tu instancia conectada en Google Antigravity Cloud (antigravity.google.com) 24/7 sin depender de tu PC encendido.',
  },
];

export const MEMORY_NODES: WorkflowNodeDef[] = [
  {
    id: 'wappy_memory_company',
    label: 'Memoria de Empresa Activa (Somos SST)',
    shortLabel: 'Memoria Empresa SST',
    badge: 'NIT, CIIU, ARL y Sedes',
    description:
      'Inyecta automáticamente Razón Social, NIT, CIIU, Nivel de Riesgo ARL, número de trabajadores, sedes y Responsable SST de la empresa seleccionada.',
    category: 'memory',
    toolHint: 'Memoria de Empresa Activa en Somos SST (NIT, CIIU, Nivel de Riesgo ARL, sedes y trabajadores)',
    badgeColor: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  },
  {
    id: 'wappy_memory_antiduplicate',
    label: 'Memoria de Bitácora Previa (Anti-Duplicados)',
    shortLabel: 'Memoria Bitácora',
    badge: 'Evita Repetir Registros',
    description:
      'Recuerda qué correos de Gmail, archivos de Google Drive o registros ya fueron procesados en corridas anteriores para no duplicar información.',
    category: 'memory',
    toolHint: 'Memoria de Historial de Ejecuciones Anteriores (AutomationLog) para procesar únicamente novedades reales sin duplicar registros',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'wappy_rag_documental',
    label: 'Memoria Documental RAG (NotebookLM + Docs Vivo)',
    shortLabel: 'RAG Documental',
    badge: 'Cuadernos y Protocolos',
    description:
      'Consulta los manuales, protocolos internos, reglamentos y cuadernos de Google NotebookLM vinculados a la empresa.',
    category: 'memory',
    toolHint: 'Memoria RAG Documental (Cuadernos de Google NotebookLM y Documentos Vivo de la empresa)',
    badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  },
  {
    id: 'wappy_memory_procedural',
    label: 'Memoria Normativa del Especialista (Reglas SST)',
    shortLabel: 'Memoria Normativa',
    badge: 'Dec. 1072, 0312 y GTC-45',
    description:
      'Aplica las reglas técnicas del especialista SST en Colombia (Decreto 1072, Res. 0312, GTC-45, Res. 2764, PESV Res. 40595 y SGA Dec. 1496).',
    category: 'memory',
    toolHint: 'Memoria Procedural y Normativa SG-SST Colombia (Dec. 1072, Res. 0312, GTC-45, Res. 2764, PESV y SGA)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
];

export const EXTRACTOR_NODES: WorkflowNodeDef[] = [
  {
    id: 'extract_gmail',
    label: 'Leer Bandeja de Gmail (Extraer Correos y Reportes)',
    shortLabel: 'Leer Gmail',
    badge: 'Extrae Correos',
    description:
      'Lee correos entrantes en Gmail (incapacidades, reportes FURAT/ATEL, conceptos médicos o requerimientos ARL) y envía su contenido al Agente.',
    category: 'extractor',
    toolHint: 'Extraer información de correos entrantes en Gmail usando google_gmail',
    badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800',
  },
  {
    id: 'extract_drive',
    label: 'Extraer de Google Drive (Carpetas / Excel / PDF)',
    shortLabel: 'Extraer de Drive',
    badge: 'Lee Archivos Drive',
    description:
      'Revisa carpetas de Google Drive, lee hojas de cálculo, documentos o PDFs nuevos y le envía los datos extraídos al Agente IA.',
    category: 'extractor',
    toolHint: 'Extraer información de carpetas y archivos recientes en Google Drive (google_drive: list_files_and_folders, read_document_content)',
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'extract_onedrive',
    label: 'Extraer de Microsoft OneDrive / SharePoint',
    shortLabel: 'Extraer OneDrive',
    badge: 'Lee OneDrive',
    description:
      'Lee carpetas y documentos corporativos alojados en Microsoft OneDrive / SharePoint y entrega los datos al Agente IA.',
    category: 'extractor',
    toolHint: 'Extraer información de carpetas y archivos en Microsoft OneDrive (one_drive)',
    badgeColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  },
  {
    id: 'extract_pc_folder',
    label: 'Extraer de Carpeta en mi Computador (vía Antigravity)',
    shortLabel: 'Carpeta en mi PC',
    badge: 'Lee Disco Local',
    description:
      'Lee archivos o carpetas alojados directamente en tu computador (Mac/PC) a través del puente local de Google Antigravity.',
    category: 'extractor',
    toolHint: 'Extraer información de una carpeta local en el computador del usuario mediante Google Antigravity Local (google_antigravity)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'extract_sst_workers',
    label: 'Extraer Trabajadores y Expedientes (Somos SST)',
    shortLabel: 'Extraer Trabajadores',
    badge: 'Lee Expedientes SST',
    description:
      'Extrae la lista de colaboradores, cargos, exámenes médicos (EMO), cursos de alturas y entregas de EPP desde Somos SST.',
    category: 'extractor',
    toolHint: 'Extraer expedientes de trabajadores, exámenes médicos, alturas y EPP desde Somos SST (somos_sst: listar_trabajadores, consultar_expediente_integral)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'extract_sst_app',
    label: 'Extraer Datos de Aplicativo / Matriz (Somos SST)',
    shortLabel: 'Extraer Aplicativo SST',
    badge: 'Lee los 8 Hitos',
    description:
      'Extrae los datos actuales de cualquier aplicativo o matriz de los 8 Hitos de Somos SST (0312, GTC-45, PESV, Químicos, Comités, ATEL, ACPM, Predictivo).',
    category: 'extractor',
    toolHint: 'Extraer información actual de los aplicativos y matrices de Somos SST (somos_sst: resumen_empresa, consultar_informacion_empresa)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'extract_web_scraping_agy',
    label: 'Web Scraping con Antigravity (Script Python / Node / Playwright)',
    shortLabel: 'Web Scraping AGY',
    badge: 'Script en tu Instancia',
    description:
      'Ejecuta un script de Web Scraping en tu instancia configurada de Google Antigravity (Python BeautifulSoup/Playwright, Node.js Cheerio o Chrome DevTools) para extraer tablas, normas o datos de cualquier página web.',
    category: 'extractor',
    toolHint: 'Ejecutar script de Web Scraping mediante la instancia conectada de Google Antigravity (google_antigravity: delegate_task / script Python/Node/Playwright)',
    badgeColor: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
  },
  {
    id: 'scraper_agy_alto_riesgo',
    label: '🪖 Certificados Alto Riesgo y SENA por Cédula (vía Antigravity)',
    shortLabel: 'Alto Riesgo & SENA',
    badge: 'MinTrabajo + SENA AGY',
    description:
      'Consulta por Cédula vía Google Antigravity los certificados vigentes de Trabajo en Alturas (Res. 4272/2021) y Espacios Confinados (Res. 0491/2020) en MinTrabajo y Certificados SENA (Sofia Plus), descargando el PDF oficial.',
    category: 'extractor',
    toolHint:
      'Consultar por Cédula vía Google Antigravity en MinTrabajo Centros de Entrenamiento (https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx) y SENA Sofia Plus (https://certificados.sena.edu.co/CertificadoDigital/com.sena.consultacer)',
    badgeColor: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  },
  {
    id: 'scraper_agy_arl_directo',
    label: '🛡️ Certificados de ARL Directos por Cédula (vía Antigravity)',
    shortLabel: 'Certificados ARL',
    badge: '5 ARL Directas AGY',
    description:
      'Verifica por Cédula directamente en los portales oficiales de ARL SURA, ARL Positiva, ARL Colmena, ARL AXA Colpatria y ARL Seguros Bolívar (sin RUAF) vía Google Antigravity.',
    category: 'extractor',
    toolHint:
      'Verificar afiliación y descargar certificado de ARL por Cédula vía Google Antigravity en ARL SURA, Positiva, Colmena, AXA Colpatria y Seguros Bolívar',
    badgeColor: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
  {
    id: 'scraper_agy_pensiones_directo',
    label: '🏦 Fondos de Pensiones Directos — Sin RUAF (vía Antigravity)',
    shortLabel: 'Pensiones Directo',
    badge: '5 Fondos Directos AGY',
    description:
      'Consulta por Cédula directamente en los 5 fondos de pensiones de Colombia (Porvenir, Protección Certifácil, Colfondos, Skandia y Colpensiones, sin pasar por RUAF) vía Google Antigravity.',
    category: 'extractor',
    toolHint:
      'Consultar afiliación pensional por Cédula directamente en Porvenir, Protección, Colfondos, Skandia y Colpensiones vía Google Antigravity (sin RUAF)',
    badgeColor: 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-300 dark:border-teal-800',
  },
  {
    id: 'scraper_agy_salud_rethus',
    label: '🏥 Salud EPS (ADRES) y ReTHUS por Cédula (vía Antigravity)',
    shortLabel: 'ADRES EPS & ReTHUS',
    badge: 'ADRES + SISPRO AGY',
    description:
      'Verifica por Cédula la EPS activa en ADRES (BDUA) y el registro profesional en Salud / SST en ReTHUS (SISPRO) vía Google Antigravity.',
    category: 'extractor',
    toolHint:
      'Consultar por Cédula vía Google Antigravity la afiliación EPS en ADRES (https://www.adres.gov.co/consulte-su-eps) y el registro en ReTHUS SISPRO (https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx)',
    badgeColor: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
  },
  {
    id: 'scraper_agy_vial_pesv',
    label: '🚗 Seguridad Vial PESV: SIMIT y RUNT por Cédula o Placa (vía Antigravity)',
    shortLabel: 'SIMIT & RUNT Vial',
    badge: 'Cédula o Placa AGY',
    description:
      'Audita por Cédula (Conductor) o por Placa (Vehículo) comparendos en SIMIT, licencia de conducción en RUNT Persona y SOAT/Tecnomecánica en RUNT Vehículo vía Google Antigravity.',
    category: 'extractor',
    toolHint:
      'Consultar por Cédula o Placa vía Google Antigravity en SIMIT (https://www.fcm.org.co/simit/#/home-public), RUNT Persona (https://www.runt.gov.co/consultaCiudadana/#/consultaPersona) y RUNT Vehículo (https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo)',
    badgeColor: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
  },
  {
    id: 'scraper_agy_antecedentes',
    label: '⚖️ Antecedentes y Procesos Judiciales por Cédula (vía Antigravity)',
    shortLabel: 'Antecedentes & Rama',
    badge: '6 Entes Oficiales AGY',
    description:
      'Consulta por Cédula vía Google Antigravity en Rama Judicial, Contraloría (SIBOR), Procuraduría (SIRI), Policía Antecedentes Judiciales, Policía RNMC y Delitos Sexuales (Ley 1918).',
    category: 'extractor',
    toolHint:
      'Consultar por Cédula vía Google Antigravity en Rama Judicial, Contraloría SIBOR, Procuraduría SIRI, Policía Antecedentes, RNMC y Ley 1918 Inhabilidades',
    badgeColor: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800',
  },
  {
    id: 'extract_web_search',
    label: 'Búsqueda en la Web en Tiempo Real (MinTrabajo / SUIN / ARL)',
    shortLabel: 'Búsqueda Web',
    badge: 'Consulta Internet',
    description:
      'Realiza una búsqueda en vivo en la web (portales oficiales, decretos, resoluciones, guías técnicas o noticias) y entrega los hallazgos al Agente IA.',
    category: 'extractor',
    toolHint: 'Búsqueda en tiempo real en internet y portales oficiales (web_search)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
];

/**
 * Catálogo base de Skills (SKILL.md), Sub-Agentes Especialistas, Reglas de Cumplimiento y Web Scraping
 * que el usuario puede arrastrar al lienzo o tomar como base para crear sus propios nodos personalizados.
 */
export const SKILL_RULE_SUBAGENT_NODES: Array<{
  id: string;
  nodeType: 'skill' | 'subagent' | 'rule' | 'web_scraper' | 'web_search';
  label: string;
  shortLabel: string;
  subtitle: string;
  content: string;
  targetUrl?: string;
  scriptEngine?: 'python_bs4_playwright' | 'node_cheerio_puppeteer' | 'chrome_devtools_mcp' | 'custom_script';
  scriptCode?: string;
}> = [
  // 🧩 SKILLS
  {
    id: 'skill_sgsst_tools',
    nodeType: 'skill',
    label: 'Skill: Herramientas Operativas SG-SST (GTC-45, PESV y SGA)',
    shortLabel: 'Skill: Motores SST',
    subtitle: 'SKILL.md · GTC-45 & PESV',
    content:
      'Aplica la metodología oficial de la GTC-45 (ND x NE = NP; NP x NC = NR), el Plan Estratégico de Seguridad Vial Res. 20223040040595 y el Sistema Globalmente Armonizado SGA Dec. 1496 de 2018.',
  },
  {
    id: 'skill_google_connectors',
    nodeType: 'skill',
    label: 'Skill: Conectores Google Workspace, NotebookLM & Antigravity',
    shortLabel: 'Skill: Google & AGY',
    subtitle: 'SKILL.md · Drive & MCP',
    content:
      'Orquesta lecturas y escrituras entre Google Drive, Google Sheets, Google Docs, Gmail, cuadernos RAG de NotebookLM y el puente reactivo Push SSE de Google Antigravity.',
  },
  {
    id: 'skill_web_scraper_script',
    nodeType: 'skill',
    label: 'Skill: Web Scraping & Extracción Estructurada (Antigravity)',
    shortLabel: 'Skill: Web Scraping',
    subtitle: 'SKILL.md · Script & Tablas',
    content:
      'Construye y ejecuta scripts de Web Scraping en la instancia de Google Antigravity (Python BeautifulSoup/Playwright o Node.js Cheerio), limpia el HTML y convierte los datos extraídos en tablas Markdown o JSON.',
  },
  {
    id: 'skill_auditoria_normativa',
    nodeType: 'skill',
    label: 'Skill: Auditoría Jurídica SST Colombia (Dec. 1072 / Res. 0312)',
    shortLabel: 'Skill: Auditoría Legal',
    subtitle: 'SKILL.md · Ley Colombiana',
    content:
      'Verifica cada hallazgo contra los artículos exactos del Decreto 1072 de 2015, Resolución 0312 de 2019, Resolución 2764 de 2022 y Resolución 4272 de 2021.',
  },
  // 🤖 SUB-AGENTES
  {
    id: 'subagent_researcher',
    nodeType: 'subagent',
    label: 'Sub-Agente: Investigador Web & Documental',
    shortLabel: 'Sub-Agente: Investigador',
    subtitle: 'Sub-Agente · Búsqueda y Síntesis',
    content:
      'Actúa como Sub-Agente Investigador: explora las fuentes documentales y páginas web indicadas, verifica la vigencia normativa y entrega un dossier técnico verificado al Agente Principal.',
  },
  {
    id: 'subagent_scraper_agy',
    nodeType: 'subagent',
    label: 'Sub-Agente: Ingeniero de Web Scraping (Antigravity)',
    shortLabel: 'Sub-Agente: Scraper AGY',
    subtitle: 'Sub-Agente · Script en tu PC/Cloud',
    content:
      'Actúa como Sub-Agente Ingeniero de Scraping en Google Antigravity: ejecuta el script de extracción sobre la URL objetivo, extrae tablas/enlaces/textos y devuelve la data limpia al flujo.',
    targetUrl: 'https://www.mintrabajo.gov.co',
    scriptEngine: 'python_bs4_playwright',
  },
  {
    id: 'subagent_auditor_calidad',
    nodeType: 'subagent',
    label: 'Sub-Agente: Auditor de Calidad y Cumplimiento 0312',
    shortLabel: 'Sub-Agente: Auditor SST',
    subtitle: 'Sub-Agente · Control de Calidad',
    content:
      'Actúa como Sub-Agente Auditor de Calidad: revisa los cálculos, tablas y recomendaciones antes de actualizar los Hitos o enviar el correo final.',
  },
  // 📏 REGLAS (RULES)
  {
    id: 'rule_veracidad_estricta',
    nodeType: 'rule',
    label: 'Regla: Veracidad Estricta (Prohibido Inventar Datos)',
    shortLabel: 'Regla: Cero Invención',
    subtitle: 'Regla · Integridad de Datos',
    content:
      'REGLA OBLIGATORIA: Jamás inventes ni simules trabajadores, accidentes, archivos o resultados de scraping. Si una fuente no devuelve datos reales, repórtalo con total transparencia.',
  },
  {
    id: 'rule_solo_criticos',
    nodeType: 'rule',
    label: 'Regla: Filtrar Solo Hallazgos Críticos o Próximos a Vencer',
    shortLabel: 'Regla: Solo Críticos',
    subtitle: 'Regla · Filtro de Prioridad',
    content:
      'REGLA OBLIGATORIA: Reporta y escala únicamente hallazgos de riesgo Crítico/Alto (Nivel I o II en GTC-45) o documentos/exámenes vencidos o próximos a vencer en los siguientes 30 días.',
  },
  {
    id: 'rule_reserva_legal',
    nodeType: 'rule',
    label: 'Regla: Reserva de Historia Clínica y Datos Sensibles (Res. 2346)',
    shortLabel: 'Regla: Reserva Médica',
    subtitle: 'Regla · Protección de Datos',
    content:
      'REGLA OBLIGATORIA: Protege la confidencialidad de diagnósticos médicos e historias clínicas conforme a la Resolución 2346 de 2007 y Ley 1581 de Habeas Data.',
  },
  // 🕷️ WEB SCRAPING CON ANTIGRAVITY & BÚSQUEDA WEB
  {
    id: 'scraper_node_antigravity',
    nodeType: 'web_scraper',
    label: 'Nodo: Web Scraping con Antigravity (Script Python / Playwright)',
    shortLabel: 'Web Scraping AGY',
    subtitle: 'Script en tu Instancia AGY',
    content:
      'Ejecuta un script de Web Scraping en tu instancia conectada de Google Antigravity para extraer información estructurada de la URL configurada.',
    targetUrl: 'https://www.mintrabajo.gov.co',
    scriptEngine: 'python_bs4_playwright',
  },
  {
    id: 'scraper_agy_alto_riesgo',
    nodeType: 'web_scraper',
    label: '🪖 Nodo AGY: Certificados Alto Riesgo (MinTrabajo Alturas/Confinados) y SENA',
    shortLabel: 'Alto Riesgo & SENA',
    subtitle: 'MinTrabajo + SENA (AGY)',
    content:
      'Consulta por Cédula vía Google Antigravity en MinTrabajo Centros de Entrenamiento (Trabajo en Alturas Res. 4272/2021 y Espacios Confinados Res. 0491/2020) y en SENA Sofia Plus, extrayendo tabla histórica y descargando PDFs vigentes.',
    targetUrl:
      'https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx, https://certificados.sena.edu.co/CertificadoDigital/com.sena.consultacer',
    scriptEngine: 'chrome_devtools_mcp',
    scriptCode: `// 🪖 SCRIPT ANTIGRAVITY: MinTrabajo (Alturas Res. 4272 / Confinados Res. 0491) + SENA (Sofia Plus)
// 1. MinTrabajo Centros de Entrenamiento:
//    POST/Navegar a https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx
//    Seleccionar RadioButtonList1="1" (Persona), TipoDoc="CC", txtNumero=CEDULA, btnConsultar
//    Extraer grilla #GridView1 (Tipo Curso, Nivel, Centro Entrenamiento, Entrenador, Fecha Fin) y descargar PDF (ImageButton1).
// 2. SENA Certificados Digitales:
//    Abrir https://certificados.sena.edu.co/CertificadoDigital/com.sena.consultacer, ingresar CC y extraer certificados vigentes.`,
  },
  {
    id: 'scraper_agy_arl_directo',
    nodeType: 'web_scraper',
    label: '🛡️ Nodo AGY: Certificados de ARL Directos (SURA, Positiva, Colmena, AXA, Bolívar)',
    shortLabel: 'Certificados ARL',
    subtitle: '5 ARL Directas (AGY)',
    content:
      'Verifica afiliación activa y descarga certificados de ARL por Cédula directamente en los 5 portales oficiales (ARL SURA, Positiva, Colmena, AXA Colpatria y Seguros Bolívar, sin pasar por RUAF) vía Google Antigravity.',
    targetUrl:
      'https://www.arlsura.com/afiliacion/verificar.php, https://www.positivaenlinea.gov.co/nuevo/, https://afiliacionarl.colmenaseguros.com/, https://asesoriavirtual.axacolpatria.co/prod_esst/certificados/, https://www.segurosbolivar.com/arl',
    scriptEngine: 'chrome_devtools_mcp',
    scriptCode: `// 🛡️ SCRIPT ANTIGRAVITY: Consulta Directa en las 5 ARL de Colombia (Sin RUAF)
// Recorre por Cédula (CC) las páginas oficiales directas:
// 1. ARL SURA: https://www.arlsura.com/afiliacion/verificar.php
// 2. ARL Positiva: https://www.positivaenlinea.gov.co/nuevo/
// 3. ARL Colmena: https://afiliacionarl.colmenaseguros.com/
// 4. ARL AXA Colpatria: https://asesoriavirtual.axacolpatria.co/prod_esst/certificados/
// 5. ARL Seguros Bolívar: https://www.segurosbolivar.com/arl
// Devuelve en cuál ARL figura ACTIVO, clase de riesgo (I-V), empleador y certificado PDF.`,
  },
  {
    id: 'scraper_agy_pensiones_directo',
    nodeType: 'web_scraper',
    label: '🏦 Nodo AGY: Fondos de Pensiones Directos — Sin RUAF (Porvenir, Protección, Colfondos, Skandia, Colpensiones)',
    shortLabel: 'Pensiones Directo',
    subtitle: '5 Fondos Sin RUAF (AGY)',
    content:
      'Consulta afiliación pensional por Cédula directamente en los 5 fondos de pensiones de Colombia (Porvenir, Protección Certifácil, Colfondos, Skandia y Colpensiones, sin usar RUAF) vía Google Antigravity.',
    targetUrl:
      'https://www.porvenir.com.co/web/certificados-y-extractos/certificado-de-afiliacion, https://www.proteccion.com/portalafiliados/certifacil, https://www.colfondos.com.co/dxp/personas/pensiones-obligatorias/certificado-afiliacion, https://www.skandia.co/consulta-extractos-y-certificados, https://sede.colpensiones.gov.co/tramite/updInfo/72/',
    scriptEngine: 'chrome_devtools_mcp',
    scriptCode: `// 🏦 SCRIPT ANTIGRAVITY: Barrido en los 5 Fondos de Pensiones Directos (Sin RUAF)
// Consulta con TipoDoc="CC" y Número de Cédula en:
// 1. Porvenir (RAIS): https://www.porvenir.com.co/web/certificados-y-extractos/certificado-de-afiliacion
// 2. Protección Certifácil (RAIS): https://www.proteccion.com/portalafiliados/certifacil
// 3. Colfondos (RAIS): https://www.colfondos.com.co/dxp/personas/pensiones-obligatorias/certificado-afiliacion
// 4. Skandia (RAIS): https://www.skandia.co/consulta-extractos-y-certificados
// 5. Colpensiones (RPM): https://sede.colpensiones.gov.co/tramite/updInfo/72/
// Identifica en cuál fondo está afiliado activo y descarga el certificado oficial en PDF.`,
  },
  {
    id: 'scraper_agy_salud_rethus',
    nodeType: 'web_scraper',
    label: '🏥 Nodo AGY: Salud EPS (ADRES) y Talento Humano en Salud (ReTHUS SISPRO)',
    shortLabel: 'ADRES EPS & ReTHUS',
    subtitle: 'EPS + ReTHUS (AGY)',
    content:
      'Consulta por Cédula vía Google Antigravity la afiliación EPS activa en ADRES (BDUA) y la inscripción/vigencia profesional en ReTHUS (SISPRO MinSalud).',
    targetUrl:
      'https://www.adres.gov.co/consulte-su-eps, https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx',
    scriptEngine: 'chrome_devtools_mcp',
    scriptCode: `// 🏥 SCRIPT ANTIGRAVITY: Consulta ADRES (EPS BDUA) + ReTHUS (SISPRO Talento Humano en Salud)
// 1. ADRES: Abrir https://www.adres.gov.co/consulte-su-eps -> Ingresar CC + Cédula -> Extraer EPS, Régimen, Estado y Tipo Afiliado.
// 2. ReTHUS SISPRO: Abrir https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx
//    -> Ingresar CC + Cédula -> Extraer profesión/ocupación autorizada, acto administrativo y estado de vigencia.`,
  },
  {
    id: 'scraper_agy_vial_pesv',
    nodeType: 'web_scraper',
    label: '🚗 Nodo AGY: Seguridad Vial PESV (SIMIT y RUNT por Cédula o Placa)',
    shortLabel: 'SIMIT & RUNT Vial',
    subtitle: 'Cédula o Placa (AGY)',
    content:
      'Audita por Cédula (Conductor) y/o por Placa (Vehículo) comparendos y multas en SIMIT, licencias de conducción en RUNT Persona y vigencia de SOAT y Revisión Técnico-Mecánica en RUNT Vehículo vía Google Antigravity.',
    targetUrl:
      'https://www.fcm.org.co/simit/#/home-public, https://www.runt.gov.co/consultaCiudadana/#/consultaPersona, https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo',
    scriptEngine: 'chrome_devtools_mcp',
    scriptCode: `// 🚗 SCRIPT ANTIGRAVITY: Auditoría Vial PESV (SIMIT + RUNT Conductor por Cédula + RUNT Vehículo por Placa)
// 1. SIMIT (Cédula o Placa): https://www.fcm.org.co/simit/#/home-public (#txtBusqueda) -> Extraer comparendos, multas, acuerdos de pago y paz y salvo.
// 2. RUNT por Cédula (Conductor): https://www.runt.gov.co/consultaCiudadana/#/consultaPersona -> Extraer categorías de licencia (A2, B1, C1, C2, C3), vencimiento y restricciones.
// 3. RUNT por Placa (Vehículo): https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo -> Extraer estado del SOAT, Revisión Técnico-Mecánica y propiedad.`,
  },
  {
    id: 'scraper_agy_antecedentes',
    nodeType: 'web_scraper',
    label: '⚖️ Nodo AGY: Antecedentes y Procesos Judiciales (Rama, Contraloría, Procuraduría, Policía)',
    shortLabel: 'Antecedentes & Rama',
    subtitle: '6 Entes Judiciales (AGY)',
    content:
      'Ejecuta debida diligencia por Cédula vía Google Antigravity en Rama Judicial (Procesos), Contraloría (SIBOR), Procuraduría (SIRI), Policía Antecedentes Judiciales, Policía RNMC (Medidas Correctivas) y Delitos Sexuales (Ley 1918).',
    targetUrl:
      'https://consultaprocesos.ramajudicial.gov.co/Procesos/Index, https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx, https://apps.procuraduria.gov.co/webcert/Certificado.aspx, https://antecedentes.policia.gov.co:7005/WebJudicial/, https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx, https://inhabilidades.policia.gov.co:8080/',
    scriptEngine: 'chrome_devtools_mcp',
    scriptCode: `// ⚖️ SCRIPT ANTIGRAVITY: Antecedentes Fiscales, Disciplinarios, Judiciales y Procesos por Cédula
// 1. Rama Judicial (Procesos): https://consultaprocesos.ramajudicial.gov.co/Procesos/Index
// 2. Contraloría General (SIBOR): https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx
// 3. Procuraduría General (SIRI): https://apps.procuraduria.gov.co/webcert/Certificado.aspx
// 4. Policía Nacional (Antecedentes Judiciales): https://antecedentes.policia.gov.co:7005/WebJudicial/
// 5. Policía Nacional (RNMC Medidas Correctivas): https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx
// 6. Policía Nacional (Inhabilidades Ley 1918): https://inhabilidades.policia.gov.co:8080/`,
  },
  {
    id: 'search_node_live_web',
    nodeType: 'web_search',
    label: 'Nodo: Búsqueda en la Web en Vivo (Consultas y Normas)',
    shortLabel: 'Búsqueda Web Viva',
    subtitle: 'Motor Web en Tiempo Real',
    content:
      'Realiza búsquedas en vivo en la web sobre los términos y dominios configurados en este nodo.',
    targetUrl: 'site:mintrabajo.gov.co OR site:suin-juriscol.gov.co',
  },
];

export function normalizeExtractorsList(nodes?: Partial<WorkflowNodesConfig> | null): string[] {
  if (Array.isArray(nodes?.extractors) && nodes!.extractors!.length > 0) {
    const valid = nodes!.extractors!.filter(
      (id) => EXTRACTOR_NODES.some((e) => e.id === id) || HITO_APP_NODES.some((h) => h.id === id),
    );
    if (valid.length > 0) return Array.from(new Set(valid));
  }
  const derived: string[] = [];
  const ins = Array.isArray(nodes?.inputs) ? nodes!.inputs! : [];
  if (ins.includes('google_drive')) derived.push('extract_drive');
  if (ins.includes('google_gmail')) derived.push('extract_gmail');
  if (ins.includes('one_drive')) derived.push('extract_onedrive');
  if (ins.includes('google_antigravity')) derived.push('extract_pc_folder');
  if (ins.includes('somos_sst_trabajadores')) derived.push('extract_sst_workers');
  if (ins.includes('somos_sst_empresa') || derived.length === 0) derived.push('extract_sst_app');
  return Array.from(new Set(derived));
}

export function normalizeMemoriesList(nodes?: Partial<WorkflowNodesConfig> | null): string[] {
  if (Array.isArray(nodes?.memories) && nodes!.memories!.length > 0) {
    const valid = nodes!.memories!.filter((id) => MEMORY_NODES.some((m) => m.id === id));
    if (valid.length > 0) return Array.from(new Set(valid));
  }
  if (nodes?.memoryNode && MEMORY_NODES.some((m) => m.id === nodes.memoryNode)) {
    return [nodes.memoryNode];
  }
  return ['wappy_memory_company'];
}

export const PRESET_CATEGORIES = [
  { id: 'all', label: 'Todos los Flujos' },
  { id: 'salud_vencimientos', label: 'Salud, EMO y Vencimientos' },
  { id: 'drive_sincronizacion', label: 'Google Drive, Cloud y LMS' },
  { id: 'atel_inspecciones', label: 'ATEL, Inspecciones y Campo' },
  { id: 'legal_cumplimiento', label: 'Matriz Legal y Normativa' },
  { id: 'riesgos_vial_quimico', label: 'PESV, Químicos SGA y Clima' },
  { id: 'gerencia_auditoria', label: 'Auditoría 0312 y Gerencia' },
];

export const TRIGGER_NODES: WorkflowNodeDef[] = [
  {
    id: 'schedule_cron',
    label: 'Reloj / Cron Programado (Por Horario)',
    shortLabel: 'Cron Programado',
    category: 'trigger',
    badge: 'Por Horario',
    description: 'Dispara la tarea automáticamente según la frecuencia y hora programada.',
    toolHint: 'Ejecución periódica programada según calendario (Cron)',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-300 dark:border-orange-800',
  },
  {
    id: 'trigger_tenshi',
    label: 'Tenshi IA (Orden por Voz o Chat)',
    shortLabel: 'Tenshi IA',
    category: 'trigger',
    badge: 'Voz / Chat',
    description: 'Tenshi dispara esta tarea al instante cuando se lo ordenas por voz o en el chat.',
    toolHint: 'Disparo bajo demanda ordenado a Tenshi IA por voz o chat',
    badgeColor: 'bg-lime-100 text-lime-800 dark:bg-lime-950/50 dark:text-lime-300 border-lime-300 dark:border-lime-800',
  },
  {
    id: 'trigger_antigravity',
    label: 'Google Antigravity Local (Puente MCP / Mac / PC)',
    shortLabel: 'Antigravity Local',
    category: 'trigger',
    badge: 'Orden MCP / PC',
    description: 'Google Antigravity dispara esta tarea desde tu Mac/PC conectado vía Push SSE + MCP.',
    toolHint: 'Disparo desde Google Antigravity Local (Mac/PC) / Servidor MCP WAPPY',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  },
  {
    id: 'trigger_antigravity_cloud',
    label: 'Google Antigravity Cloud 24/7 (antigravity.google.com)',
    shortLabel: 'Antigravity Cloud',
    category: 'trigger',
    badge: 'Cloud 24/7',
    description: 'Google Antigravity Cloud (antigravity.google.com) dispara o ejecuta esta tarea 24/7 en la nube sin tu PC prendido.',
    toolHint: 'Disparo desde Google Antigravity Cloud 24/7 (antigravity.google.com) / Servidor MCP WAPPY',
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border-sky-300 dark:border-sky-800',
  },
  {
    id: 'trigger_email',
    label: 'Correo Electrónico Entrante (Gmail)',
    shortLabel: 'Correo Entrante',
    category: 'trigger',
    badge: 'Al recibir Email',
    description: 'Se activa por recepción de correo electrónico (reporte ATEL, incapacidad, solicitud ARL).',
    toolHint: 'Disparo por recepción de correo electrónico entrante en Gmail (google_gmail)',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-800',
  },
  {
    id: 'trigger_agent',
    label: 'Otro Agente Especialista IA (Delegación)',
    shortLabel: 'Agente IA',
    category: 'trigger',
    badge: 'Por Delegación',
    description: 'Un Agente Especialista de WAPPY invoca o encadena esta tarea al detectar un hallazgo.',
    toolHint: 'Disparo por delegación o encadenamiento desde otro Agente Especialista IA de WAPPY',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  },
  {
    id: 'trigger_qr_worker',
    label: 'Reporte QR de Trabajador en Campo',
    shortLabel: 'Reporte QR',
    category: 'trigger',
    badge: 'Formulario Campo',
    description: 'Se dispara cuando un trabajador reporta un acto/condición insegura, inspección o encuesta vía QR.',
    toolHint: 'Disparo por envío de reporte QR / formulario de trabajador en campo',
    badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-300 dark:border-teal-800',
  },
  {
    id: 'trigger_webhook',
    label: 'Webhook / Evento Externo API (Buk RRHH / ERP)',
    shortLabel: 'Webhook API',
    category: 'trigger',
    badge: 'Evento Externo',
    description: 'Se dispara cuando un sistema externo (Buk RRHH, nómina o formulario web) notifica un evento.',
    toolHint: 'Disparo por evento externo vía Webhook / API REST',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
];

export function normalizeTriggerId(rawId?: string): string {
  if (!rawId) return 'schedule_cron';
  if (rawId === 'gmail_inbox_watch' || rawId === 'gmail_watch') return 'trigger_email';
  if (rawId === 'webhook_event') return 'trigger_webhook';
  if (rawId === 'drive_folder_watch' || rawId === 'drive_watch' || rawId === 'sgsst_db_audit' || rawId === 'sst_deadline_watch') {
    return 'schedule_cron';
  }
  const exists = TRIGGER_NODES.some((t) => t.id === rawId);
  return exists ? rawId : 'schedule_cron';
}

export function normalizeTriggersList(nodes?: Partial<WorkflowNodesConfig> | null): string[] {
  const rawArr =
    Array.isArray(nodes?.triggers) && nodes!.triggers!.length > 0
      ? nodes!.triggers!
      : nodes?.trigger
        ? [nodes.trigger]
        : ['schedule_cron'];
  const mapped = rawArr.map((id) => normalizeTriggerId(id));
  const unique = Array.from(new Set(mapped));
  return unique.length > 0 ? unique : ['schedule_cron'];
}

export const INPUT_CONNECTOR_NODES: WorkflowNodeDef[] = [
  // Google Workspace & Cloud
  {
    id: 'google_drive',
    label: 'Google Drive (Carpetas/PDF/Excel)',
    shortLabel: 'Google Drive',
    category: 'Google & Cloud',
    toolHint: 'google_drive (list_files_and_folders, read_document_content)',
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'google_sheets',
    label: 'Google Sheets (Hojas de Cálculo)',
    shortLabel: 'Google Sheets',
    category: 'Google & Cloud',
    toolHint: 'google_sheets (read_spreadsheet, update_spreadsheet_values)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'google_docs',
    label: 'Google Docs (Documentos)',
    shortLabel: 'Google Docs',
    category: 'Google & Cloud',
    toolHint: 'google_docs',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'google_gmail',
    label: 'Google Gmail (Bandeja de Correo)',
    shortLabel: 'Gmail',
    category: 'Google & Cloud',
    toolHint: 'google_gmail',
    badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800',
  },
  {
    id: 'google_calendar',
    label: 'Google Calendar (Agenda)',
    shortLabel: 'Google Calendar',
    category: 'Google & Cloud',
    toolHint: 'google_calendar',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'one_drive',
    label: 'Microsoft OneDrive / SharePoint',
    shortLabel: 'OneDrive',
    category: 'Google & Cloud',
    toolHint: 'one_drive',
    badgeColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  },
  // Google AI, MCP & Web
  {
    id: 'notebooklm',
    label: 'Google NotebookLM (Cuadernos RAG)',
    shortLabel: 'NotebookLM',
    category: 'IA, MCP & Web',
    toolHint: 'notebooklm (consultar cuadernos documentales)',
    badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  },
  {
    id: 'google_flow',
    label: 'Google Flow Studio (Veo / Imagen)',
    shortLabel: 'Google Flow',
    category: 'IA, MCP & Web',
    toolHint: 'google_flow (generación visual SST)',
    badgeColor: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
  },
  {
    id: 'google_antigravity',
    label: 'Google Antigravity Local (Puente Mac / PC)',
    shortLabel: 'Antigravity Local',
    category: 'IA, MCP & Web',
    toolHint: 'google_antigravity (puente reactivo con Mac/PC)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'google_antigravity_cloud',
    label: 'Google Antigravity Cloud 24/7 (antigravity.google.com)',
    shortLabel: 'Antigravity Cloud',
    category: 'IA, MCP & Web',
    toolHint: 'google_antigravity (entorno Cloud 24/7 en antigravity.google.com sin PC prendido)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'web_search',
    label: 'Búsqueda Web Legal en Vivo (MinTrabajo/SUIN)',
    shortLabel: 'Búsqueda Web Legal',
    category: 'IA, MCP & Web',
    toolHint: 'web_search (consulta en tiempo real de leyes, resoluciones y sentencias en Colombia)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'tool_web_scraping_agy',
    label: 'Web Scraping con Antigravity (Script Python / Node / Playwright)',
    shortLabel: 'Web Scraping AGY',
    category: 'IA, MCP & Web',
    toolHint: 'google_antigravity (ejecuta script de Web Scraping con Python BeautifulSoup/Playwright, Node.js Cheerio o Chrome DevTools en la instancia Antigravity del usuario)',
    badgeColor: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
  },
  {
    id: 'webhook_api',
    label: 'Webhook API / Integración Buk RRHH',
    shortLabel: 'API / Buk',
    category: 'IA, MCP & Web',
    toolHint: 'webhook externo / sincronización API RRHH',
    badgeColor: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  // APIs Científicas y Motores WAPPY
  {
    id: 'somos_sst_empresa',
    label: 'Contexto Empresa Activa (Somos SST)',
    shortLabel: 'Empresa SST',
    category: 'APIs & Motores SST',
    toolHint: 'somos_sst (consultar_informacion_empresa y resumen_empresa)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'somos_sst_trabajadores',
    label: 'Bio-Motor Trabajadores y Expedientes',
    shortLabel: 'Bio-Motor Trabajadores',
    category: 'APIs & Motores SST',
    toolHint: 'somos_sst (listar_trabajadores, consultar_expediente_integral)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'matriz_ipevar',
    label: 'Motor Matriz IPEVAR / GTC-45',
    shortLabel: 'Motor GTC-45',
    category: 'APIs & Motores SST',
    toolHint: 'matriz_ipevar (leer y evaluar peligros GTC-45)',
    badgeColor: 'bg-lime-50 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300 border-lime-200 dark:border-lime-800',
  },
  {
    id: 'matriz_pesv',
    label: 'Motor Matriz Vial PESV (Res. 40595)',
    shortLabel: 'Motor PESV',
    category: 'APIs & Motores SST',
    toolHint: 'matriz_pesv (leer y evaluar riesgos viales)',
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'matriz_compatibilidad',
    label: 'Motor Químico SGA (Dec. 1496 / ONU)',
    shortLabel: 'Motor Químico SGA',
    category: 'APIs & Motores SST',
    toolHint: 'matriz_compatibilidad (inventario químico y FDS)',
    badgeColor: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  },
  {
    id: 'pronostico_clima_sst',
    label: 'OpenWeather API (Clima y Alertas SST)',
    shortLabel: 'OpenWeather Clima',
    category: 'APIs & Motores SST',
    toolHint: 'pronóstico climático SST (lluvia, tormentas, viento, UV, estrés térmico)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'consultar_pubchem_quimico',
    label: 'PubChem NIH (Fichas Químicas y GHS)',
    shortLabel: 'PubChem NIH',
    category: 'APIs & Motores SST',
    toolHint: 'base de datos química PubChem NIH',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'consultar_medlineplus_rehabilitacion',
    label: 'MedlinePlus NIH (Guías CIE-10 / Rehab)',
    shortLabel: 'MedlinePlus NIH',
    category: 'APIs & Motores SST',
    toolHint: 'guías médicas MedlinePlus NIH por código CIE-10',
    badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  {
    id: 'buscar_centros_emergencia',
    label: 'OpenStreetMap (Hospitales / Bomberos)',
    shortLabel: 'Centros Emergencia',
    category: 'APIs & Motores SST',
    toolHint: 'geolocalización de clínicas, hospitales y bomberos cercanos',
    badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800',
  },
  {
    id: 'consultar_analitica_psicosocial',
    label: 'Analítica Psicosocial y Clima Laboral',
    shortLabel: 'Analítica Psicosocial',
    category: 'APIs & Motores SST',
    toolHint: 'consultar_analitica_psicosocial',
    badgeColor: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  },
  {
    id: 'consultar_analitica_actos_condiciones',
    label: 'Analítica de Actos y Condiciones Inseguras',
    shortLabel: 'Analítica Actos',
    category: 'APIs & Motores SST',
    toolHint: 'consultar_analitica_actos_condiciones',
    badgeColor: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  {
    id: 'cursos_lms',
    label: 'Academia WAPPY LMS (Cursos y Progreso)',
    shortLabel: 'Academia LMS',
    category: 'APIs & Motores SST',
    toolHint: 'cursos formativos y avance en Academia WAPPY LMS',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
];

export const HITO_APP_NODES: WorkflowNodeDef[] = [
  // ═══ HITO 1: GOBERNANZA Y CIMIENTO LEGAL (15 APLICATIVOS) ═══
  {
    id: 'hito1_dofa',
    sgsstAppId: 'contexto_organizacion',
    hitoId: 'hito1',
    label: 'Hito 1 · Contexto y Partes Interesadas (DOFA / Stakeholders)',
    shortLabel: 'H1: Contexto DOFA',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Contexto y Partes Interesadas DOFA / Stakeholders (somos_sst: contexto)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_diagnostico_0312',
    sgsstAppId: 'diagnostico',
    hitoId: 'hito1',
    label: 'Hito 1 · Diagnóstico Inicial Estándares Mínimos (Res. 0312)',
    shortLabel: 'H1: Diagnóstico 0312',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Diagnóstico Inicial de Estándares Mínimos Res. 0312 (somos_sst: diagnostico)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_responsable',
    sgsstAppId: 'responsable',
    hitoId: 'hito1',
    label: 'Hito 1 · Responsable SG-SST (Licencia e Idoneidad)',
    shortLabel: 'H1: Responsable SST',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Asignación y Licencia del Responsable SG-SST (somos_sst: responsable)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_politica_objetivos',
    sgsstAppId: 'politica',
    hitoId: 'hito1',
    label: 'Hito 1 · Política de SST',
    shortLabel: 'H1: Política SST',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Política del SG-SST (somos_sst: politica)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_objetivos',
    sgsstAppId: 'objetivos',
    hitoId: 'hito1',
    label: 'Hito 1 · Objetivos de SST (Indicadores)',
    shortLabel: 'H1: Objetivos SST',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Objetivos y Metas Cuantificables del SG-SST (somos_sst: objetivos)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_matriz_legal',
    sgsstAppId: 'legal',
    hitoId: 'hito1',
    defaultConstruction: true,
    label: 'Hito 1 · Matriz Legal',
    shortLabel: 'H1: Matriz Legal',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Matriz Legal SG-SST (somos_sst: matriz_legal)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_rhs',
    sgsstAppId: 'rhs',
    hitoId: 'hito1',
    label: 'Hito 1 · Reglamento de Higiene (RHS)',
    shortLabel: 'H1: Reglamento RHS',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Reglamento de Higiene y Seguridad Industrial RHS (somos_sst: rhs)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_rit',
    sgsstAppId: 'rit',
    hitoId: 'hito1',
    label: 'Hito 1 · Reglamento Interno (RIT)',
    shortLabel: 'H1: Reglamento RIT',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Reglamento Interno de Trabajo RIT (somos_sst: rit)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_participacion_ipevar',
    sgsstAppId: 'participacion_ipevar',
    hitoId: 'hito1',
    label: 'Hito 1 · Participación IPEVR Comunitaria',
    shortLabel: 'H1: Participación IPEVR',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Participación IPEVR Comunitaria de Trabajadores (somos_sst: participacion_ipevar)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito2_matriz_ipevar',
    sgsstAppId: 'matriz_ipevar_oficial',
    hitoId: 'hito1',
    label: 'Hito 1 · Matriz IPEVR (GTC 45)',
    shortLabel: 'H1: Matriz GTC 45',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Matriz Oficial de Peligros IPEVR GTC 45 (matriz_ipevar)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito3_matriz_pesv',
    sgsstAppId: 'matriz_pesv_oficial',
    hitoId: 'hito1',
    label: 'Hito 1 · Matriz de Riesgos Viales (PESV)',
    shortLabel: 'H1: Matriz PESV',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Matriz Oficial de Riesgos Viales PESV Res. 40595 (matriz_pesv)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito3_quimicos_sga',
    sgsstAppId: 'matriz_compatibilidad_oficial',
    hitoId: 'hito1',
    label: 'Hito 1 · Matriz de Compatibilidad Química (SGA)',
    shortLabel: 'H1: Compatibilidad SGA',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Matriz Oficial de Compatibilidad Química SGA Dec. 1496 (matriz_compatibilidad)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_oportunidades_sst',
    sgsstAppId: 'oportunidades_sst',
    hitoId: 'hito1',
    label: 'Hito 1 · Riesgos del Sistema y Oportunidades SST',
    shortLabel: 'H1: Oportunidades SST',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Riesgos Estratégicos del Sistema y Oportunidades SST ISO 45001 (somos_sst: oportunidades)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito6_vulnerabilidad',
    sgsstAppId: 'vulnerabilidad',
    hitoId: 'hito1',
    label: 'Hito 1 · Análisis de Vulnerabilidad',
    shortLabel: 'H1: Vulnerabilidad',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Análisis de Amenazas y Vulnerabilidad Diamante de Colores (somos_sst: vulnerabilidad)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_plan_emergencias',
    sgsstAppId: 'plan_emergencias',
    hitoId: 'hito1',
    label: 'Hito 1 · Plan de Emergencias y Contingencias (PPRE)',
    shortLabel: 'H1: Plan Emergencias',
    badge: 'Hito 1 · Gobernanza',
    category: 'Hito 1: Gobernanza y Cimiento Legal',
    toolHint: 'Plan de Prevención, Preparación y Respuesta ante Emergencias PPRE, MEDEVAC y PONs (somos_sst: plan_emergencias)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },

  // ═══ HITO 2: HUELLA BIOCÉNTRICA (4 APLICATIVOS) ═══
  {
    id: 'hito2_perfiles_cargo',
    sgsstAppId: 'perfil_cargo',
    hitoId: 'hito2',
    label: 'Hito 2 · Perfiles de Cargo (Roles)',
    shortLabel: 'H2: Perfiles de Cargo',
    badge: 'Hito 2 · Biocéntrica',
    category: 'Hito 2: Huella Biocéntrica',
    toolHint: 'Perfiles de Cargo y Profesiograma (somos_sst: cargos)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'hito2_perfil_socio',
    sgsstAppId: 'perfil_socio',
    hitoId: 'hito2',
    label: 'Hito 2 · Perfil Sociodemográfico',
    shortLabel: 'H2: Sociodemográfico',
    badge: 'Hito 2 · Biocéntrica',
    category: 'Hito 2: Huella Biocéntrica',
    toolHint: 'Perfil Sociodemográfico y Expedientes de Trabajadores (somos_sst: alimentar_sociodemografico_masivo)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'hito2_condiciones_salud',
    sgsstAppId: 'condiciones_salud',
    hitoId: 'hito2',
    label: 'Hito 2 · Informe Condiciones de Salud',
    shortLabel: 'H2: Condiciones Salud',
    badge: 'Hito 2 · Biocéntrica',
    category: 'Hito 2: Huella Biocéntrica',
    toolHint: 'Informe de Condiciones de Salud y Exámenes Médicos Ocupacionales EMO (somos_sst: actualizar_examen_medico)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'hito2_oraculo_predictivo',
    sgsstAppId: 'oraculo_predictivo',
    hitoId: 'hito2',
    label: 'Hito 2 · Dictamen de Compatibilidad Cargo-Persona',
    shortLabel: 'H2: Compatibilidad Cargo',
    badge: 'Hito 2 · Biocéntrica',
    category: 'Hito 2: Huella Biocéntrica',
    toolHint: 'Dictamen de Compatibilidad Cargo-Persona y Aptitud Bioindividual (somos_sst: oraculo_predictivo)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },

  // ═══ HITO 3: COMITÉS, BRIGADAS Y ÓRGANOS DE GOBERNANZA (4 APLICATIVOS) ═══
  {
    id: 'hito4_comites',
    sgsstAppId: 'copasst',
    hitoId: 'hito3',
    label: 'Hito 3 · COPASST / Vigía de SST',
    shortLabel: 'H3: COPASST / Vigía',
    badge: 'Hito 3 · Comités',
    category: 'Hito 3: Comités, Brigadas y Gobernanza',
    toolHint: 'Comité Paritario de Seguridad y Salud en el Trabajo COPASST / Vigía y Actas (somos_sst: copasst)',
    badgeColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  },
  {
    id: 'hito3_cocolab',
    sgsstAppId: 'cocolab',
    hitoId: 'hito3',
    label: 'Hito 3 · Comité de Convivencia Laboral',
    shortLabel: 'H3: Convivencia CCL',
    badge: 'Hito 3 · Comités',
    category: 'Hito 3: Comités, Brigadas y Gobernanza',
    toolHint: 'Comité de Convivencia Laboral CCL y Prevención de Acoso (somos_sst: convivencia)',
    badgeColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  },
  {
    id: 'hito3_comite_pesv',
    sgsstAppId: 'comite_pesv',
    hitoId: 'hito3',
    defaultConstruction: true,
    label: 'Hito 3 · Comité de Seguridad Vial (CSV - PESV)',
    shortLabel: 'H3: Comité Vial CSV',
    badge: 'Hito 3 · Comités',
    category: 'Hito 3: Comités, Brigadas y Gobernanza',
    toolHint: 'Comité de Seguridad Vial CSV - PESV (somos_sst: comite_pesv)',
    badgeColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  },
  {
    id: 'hito3_brigada_emergencias',
    sgsstAppId: 'brigada_emergencias',
    hitoId: 'hito3',
    defaultConstruction: true,
    label: 'Hito 3 · Brigada de Emergencias & Comité de Crisis (SCI)',
    shortLabel: 'H3: Brigada SCI',
    badge: 'Hito 3 · Comités',
    category: 'Hito 3: Comités, Brigadas y Gobernanza',
    toolHint: 'Brigada de Emergencias y Sistema Comando de Incidentes SCI (somos_sst: brigada)',
    badgeColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  },

  // ═══ HITO 4: EVALUACIÓN DINÁMICA DE RIESGOS (4 APLICATIVOS) ═══
  {
    id: 'hito4_bio_ipevar',
    sgsstAppId: 'peligros',
    hitoId: 'hito4',
    label: 'Hito 4 · Matriz Bio-IPEVR',
    shortLabel: 'H4: Matriz Bio-IPEVR',
    badge: 'Hito 4 · Evaluación',
    category: 'Hito 4: Evaluación Dinámica de Riesgos',
    toolHint: 'Matriz Bio-IPEVR por Trabajador y Percepción Anatómica (somos_sst: peligros)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hito3_owas',
    sgsstAppId: 'metodo_owas',
    hitoId: 'hito4',
    label: 'Hito 4 · Método OWAS (Evaluación Ergonómica)',
    shortLabel: 'H4: Método OWAS',
    badge: 'Hito 4 · Evaluación',
    category: 'Hito 4: Evaluación Dinámica de Riesgos',
    toolHint: 'Evaluación Ergonómica Postural Método OWAS (somos_sst: owas)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hito3_estudio_puesto',
    sgsstAppId: 'estudio_puesto',
    hitoId: 'hito4',
    label: 'Hito 4 · Estudio de Puesto de Trabajo (EPT)',
    shortLabel: 'H4: Estudio Puesto EPT',
    badge: 'Hito 4 · Evaluación',
    category: 'Hito 4: Evaluación Dinámica de Riesgos',
    toolHint: 'Estudio de Puesto de Trabajo EPT Biomecánico con IA (somos_sst: estudio_puesto)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hito4_psicosocial',
    sgsstAppId: 'animo',
    hitoId: 'hito4',
    label: 'Hito 4 · Termómetro Psicosocial',
    shortLabel: 'H4: Termómetro Psicosocial',
    badge: 'Hito 4 · Evaluación',
    category: 'Hito 4: Evaluación Dinámica de Riesgos',
    toolHint: 'Termómetro Psicosocial y Clima Emocional (consultar_analitica_psicosocial)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },

  // ═══ HITO 5: DINÁMICA OPERATIVA Y TERRENO (10 APLICATIVOS) ═══
  {
    id: 'hito5_compras_sst',
    sgsstAppId: 'compras_sst',
    hitoId: 'hito5',
    label: 'Hito 5 · Compras y Adquisiciones en SST',
    shortLabel: 'H5: Compras SST',
    badge: 'Hito 5 · Terreno',
    category: 'Hito 5: Dinámica Operativa y Terreno',
    toolHint: 'Compras y Adquisiciones en SST Dec. 1072 Art. 2.2.4.6.27 (somos_sst: compras)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'hito5_contratistas',
    sgsstAppId: 'contratistas_proveedores',
    hitoId: 'hito5',
    label: 'Hito 5 · Control y Gestión de Contratistas',
    shortLabel: 'H5: Contratistas',
    badge: 'Hito 5 · Terreno',
    category: 'Hito 5: Dinámica Operativa y Terreno',
    toolHint: 'Control y Gestión de Contratistas y Proveedores PILA (somos_sst: contratistas)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'hito5_gestion_cambio',
    sgsstAppId: 'gestion_cambio',
    hitoId: 'hito5',
    label: 'Hito 5 · Gestión del Cambio en SST (MOC)',
    shortLabel: 'H5: Gestión del Cambio',
    badge: 'Hito 5 · Terreno',
    category: 'Hito 5: Dinámica Operativa y Terreno',
    toolHint: 'Gestión del Cambio en SST MOC Dec. 1072 Art. 2.2.4.6.26 (somos_sst: gestion_cambio)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'hito3_ats',
    sgsstAppId: 'analisis_trabajo_seguro',
    hitoId: 'hito5',
    label: 'Hito 5 · Análisis de Trabajo Seguro (ATS)',
    shortLabel: 'H5: Análisis ATS',
    badge: 'Hito 5 · Terreno',
    category: 'Hito 5: Dinámica Operativa y Terreno',
    toolHint: 'Análisis de Trabajo Seguro ATS Paso a Paso (somos_sst: ats)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'hito3_alturas',
    sgsstAppId: 'permiso_alturas',
    hitoId: 'hito5',
    label: 'Hito 5 · Permiso de Trabajo en Alturas',
    shortLabel: 'H5: Permiso Alturas',
    badge: 'Hito 5 · Terreno',
    category: 'Hito 5: Dinámica Operativa y Terreno',
    toolHint: 'Permiso de Trabajo en Alturas Res. 4272 (somos_sst: permiso_alturas)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'hito5_equipos_alturas',
    sgsstAppId: 'heights_lifecycle',
    hitoId: 'hito5',
    label: 'Hito 5 · Hoja de Vida de Equipos de Alturas',
    shortLabel: 'H5: Equipos Alturas',
    badge: 'Hito 5 · Terreno',
    category: 'Hito 5: Dinámica Operativa y Terreno',
    toolHint: 'Hoja de Vida e Inspección de Equipos de Alturas (somos_sst: alturas)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'hito3_epp',
    sgsstAppId: 'epp_delivery',
    hitoId: 'hito5',
    label: 'Hito 5 · Entrega y Seguimiento de EPP',
    shortLabel: 'H5: Entrega de EPP',
    badge: 'Hito 5 · Terreno',
    category: 'Hito 5: Dinámica Operativa y Terreno',
    toolHint: 'Entrega y Seguimiento de Elementos de Protección Personal EPP (somos_sst: epp)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'hito5_registro_quimico',
    sgsstAppId: 'chemical_registry',
    hitoId: 'hito5',
    label: 'Hito 5 · Registro y Rótulo de Productos Químicos',
    shortLabel: 'H5: Registro Químico',
    badge: 'Hito 5 · Terreno',
    category: 'Hito 5: Dinámica Operativa y Terreno',
    toolHint: 'Inventario, FDS y Rótulo SGA de Productos Químicos (somos_sst: chemicals)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'hito3_vehiculos',
    sgsstAppId: 'vehicles_pesv',
    hitoId: 'hito5',
    label: 'Hito 5 · Hoja de Vida Automotores (PESV)',
    shortLabel: 'H5: Automotores PESV',
    badge: 'Hito 5 · Terreno',
    category: 'Hito 5: Dinámica Operativa y Terreno',
    toolHint: 'Hoja de Vida de Automotores e Inspección Preoperacional PESV (somos_sst: vehiculos)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'hito5_equipos_emergencia',
    sgsstAppId: 'equipos_emergencia',
    hitoId: 'hito5',
    defaultConstruction: true,
    label: 'Hito 5 · Inventario e Inspección de Equipos de Emergencia',
    shortLabel: 'H5: Equipos Emergencia',
    badge: 'Hito 5 · Terreno',
    category: 'Hito 5: Dinámica Operativa y Terreno',
    toolHint: 'Inventario e Inspección de Extintores, Botiquines y Camillas (somos_sst: equipos_emergencia)',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },

  // ═══ HITO 6: CULTURA, ESCUELA E INNOVACIÓN (6 APLICATIVOS) ═══
  {
    id: 'hito6_comunicaciones_sst',
    sgsstAppId: 'comunicaciones_sst',
    hitoId: 'hito6',
    defaultConstruction: true,
    label: 'Hito 6 · Plan y Matriz de Comunicaciones SST',
    shortLabel: 'H6: Comunicaciones SST',
    badge: 'Hito 6 · Cultura',
    category: 'Hito 6: Cultura, Escuela e Innovación',
    toolHint: 'Plan y Matriz de Comunicaciones Internas y Externas SST (somos_sst: comunicaciones)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'hito5_capacitaciones',
    sgsstAppId: 'capacitaciones',
    hitoId: 'hito6',
    label: 'Hito 6 · Programa de Capacitación SG-SST',
    shortLabel: 'H6: Capacitaciones',
    badge: 'Hito 6 · Cultura',
    category: 'Hito 6: Cultura, Escuela e Innovación',
    toolHint: 'Programa Anual de Capacitación e Inducción SG-SST (somos_sst: capacitaciones)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'hito6_ruta_aprendizaje',
    sgsstAppId: 'ruta_aprendizaje',
    hitoId: 'hito6',
    label: 'Hito 6 · Rutas de Aprendizaje (LMS)',
    shortLabel: 'H6: Rutas LMS',
    badge: 'Hito 6 · Cultura',
    category: 'Hito 6: Cultura, Escuela e Innovación',
    toolHint: 'Rutas de Aprendizaje y Certificación en Academia WAPPY LMS (cursos_lms)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'hito4_actos_condiciones',
    sgsstAppId: 'reporte_actos',
    hitoId: 'hito6',
    label: 'Hito 6 · Reporte de Actos y Condiciones',
    shortLabel: 'H6: Actos y Condiciones',
    badge: 'Hito 6 · Cultura',
    category: 'Hito 6: Cultura, Escuela e Innovación',
    toolHint: 'Reporte de Actos y Condiciones Inseguras en Campo (somos_sst: actos)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'hito6_simulacros_emergencia',
    sgsstAppId: 'simulacros_emergencia',
    hitoId: 'hito6',
    defaultConstruction: true,
    label: 'Hito 6 · Gestión y Evaluación de Simulacros de Emergencia',
    shortLabel: 'H6: Simulacros',
    badge: 'Hito 6 · Cultura',
    category: 'Hito 6: Cultura, Escuela e Innovación',
    toolHint: 'Planeación y Evaluación de Simulacros de Emergencia (somos_sst: simulacros)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'hito6_app_builder',
    sgsstAppId: 'app_builder',
    hitoId: 'hito6',
    defaultConstruction: true,
    label: 'Hito 6 · Creador de Aplicativos (App Builder)',
    shortLabel: 'H6: App Builder',
    badge: 'Hito 6 · Cultura',
    category: 'Hito 6: Cultura, Escuela e Innovación',
    toolHint: 'Creador de Micro-Aplicativos y Formularios SST (somos_sst: app_builder)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },

  // ═══ HITO 7: AUDITORÍA, CAUSALIDAD Y MEJORA CONTINUA (6 APLICATIVOS) ═══
  {
    id: 'hito7_estadisticas_atel',
    sgsstAppId: 'estadisticas',
    hitoId: 'hito7',
    label: 'Hito 7 · Gestión Integral de Ausentismo & ATEL',
    shortLabel: 'H7: Ausentismo y ATEL',
    badge: 'Hito 7 · Auditoría',
    category: 'Hito 7: Auditoría, Causalidad y Mejora',
    toolHint: 'Estadísticas de Ausentismo e Indicadores ATEL Res. 0312 Art. 30 (somos_sst: estadisticas)',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'hito7_investigacion_atel',
    sgsstAppId: 'investigacion_atel',
    hitoId: 'hito7',
    label: 'Hito 7 · Investigación ATEL',
    shortLabel: 'H7: Investigación ATEL',
    badge: 'Hito 7 · Auditoría',
    category: 'Hito 7: Auditoría, Causalidad y Mejora',
    toolHint: 'Investigación de Accidentes e Incidentes ATEL Árbol de Causas / Ishikawa (somos_sst: registrar_accidente_atel)',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'hito7_acpm',
    sgsstAppId: 'control_acpm',
    hitoId: 'hito7',
    label: 'Hito 7 · Tablero Kanban ACPM',
    shortLabel: 'H7: Tablero ACPM',
    badge: 'Hito 7 · Auditoría',
    category: 'Hito 7: Auditoría, Causalidad y Mejora',
    toolHint: 'Tablero Kanban de Acciones Correctivas, Preventivas y de Mejora ACPM (somos_sst: crear_actividad_acpm)',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'hito7_auditoria',
    sgsstAppId: 'auditoria',
    hitoId: 'hito7',
    label: 'Hito 7 · Informe de Auditoría SG-SST',
    shortLabel: 'H7: Auditoría SG-SST',
    badge: 'Hito 7 · Auditoría',
    category: 'Hito 7: Auditoría, Causalidad y Mejora',
    toolHint: 'Informe de Auditoría Anual del SG-SST (somos_sst: auditoria)',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'hito7_alta_direccion',
    sgsstAppId: 'alta_direccion',
    hitoId: 'hito7',
    label: 'Hito 7 · Revisión por la Alta Dirección',
    shortLabel: 'H7: Alta Dirección',
    badge: 'Hito 7 · Auditoría',
    category: 'Hito 7: Auditoría, Causalidad y Mejora',
    toolHint: 'Revisión Anual por la Alta Dirección de 22 Puntos (somos_sst: alta_direccion)',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'hito7_investigacion_profunda',
    sgsstAppId: 'investigacion_profunda',
    hitoId: 'hito7',
    defaultConstruction: true,
    label: 'Hito 7 · Investigación Profunda SST',
    shortLabel: 'H7: Investigación Profunda',
    badge: 'Hito 7 · Auditoría',
    category: 'Hito 7: Auditoría, Causalidad y Mejora',
    toolHint: 'Investigación Profunda de Doctrina y Jurisprudencia SST (somos_sst: investigacion_profunda)',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },

  // ═══ HITO 8: INTELIGENCIA ARTIFICIAL & ORÁCULO PREDICTIVO (1 APLICATIVO) ═══
  {
    id: 'hito8_predictivo',
    sgsstAppId: 'predictivo',
    hitoId: 'hito8',
    label: 'Hito 8 · Centro de Inteligencia Predictiva',
    shortLabel: 'H8: Oráculo Predictivo',
    badge: 'Hito 8 · IA Predictiva',
    category: 'Hito 8: Inteligencia Artificial & Oráculo Predictivo',
    toolHint: 'Centro de Inteligencia Predictiva, Gemelo Digital y Radar de 9 Dominios (somos_sst: predictivo)',
    badgeColor: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  },
];

export const OUTPUT_ACTION_NODES: WorkflowNodeDef[] = [
  {
    id: 'email_report',
    label: 'Enviar Bitácora Completa a Gmail / Correo Electrónico',
    shortLabel: 'Bitácora a Gmail',
    badge: 'Informe Email',
    category: 'output',
    toolHint: 'Envía una bitácora ejecutiva detallada en Markdown con tablas de todo lo realizado al correo electrónico (Gmail / SMTP)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'wappy_notification',
    label: 'Enviar Notificación Directa en WAPPY + Chat de Tenshi',
    shortLabel: 'Notificar en WAPPY',
    badge: 'Alerta WAPPY',
    category: 'output',
    toolHint: 'Envía una notificación directa a la campana de WAPPY y al chat de Tenshi IA con el resumen de la bitácora',
    badgeColor: 'bg-lime-50 text-lime-800 dark:bg-lime-950/40 dark:text-lime-300 border-lime-200 dark:border-lime-800',
  },
  {
    id: 'antigravity_local_report',
    label: 'Enviar Resultado / Bitácora a Google Antigravity (Mi PC)',
    shortLabel: 'Enviar a Antigravity PC',
    badge: 'Entrega en PC',
    category: 'output',
    toolHint: 'Envía el resultado y bitácora directamente a Google Antigravity en tu Mac/PC vía Push SSE',
    badgeColor: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'antigravity_cloud_report',
    label: 'Enviar Resultado / Bitácora a Google Antigravity Cloud 24/7',
    shortLabel: 'Enviar a AGY Cloud',
    badge: 'Entrega Cloud',
    category: 'output',
    toolHint: 'Envía el resultado y bitácora directamente a tu instancia de Google Antigravity Cloud 24/7 (antigravity.google.com)',
    badgeColor: 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'somos_sst_update',
    label: 'Alimentar / Guardar Cambios en Aplicativo Somos SST',
    shortLabel: 'Guardar en Somos SST',
    badge: 'Actualiza BD SST',
    category: 'output',
    toolHint: 'Actualiza directamente los registros reales en el aplicativo o Hito de Somos SST correspondiente',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'acpm_task',
    label: 'Crear Acción Correctiva / Preventiva en Centro de Control ACPM',
    shortLabel: 'Crear Tarea ACPM',
    badge: 'Kanban ACPM',
    category: 'output',
    toolHint: 'Registra automáticamente hallazgos o alertas pendientes en el Centro de Control ACPM (crear_actividad_acpm)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'canvas_doc',
    label: 'Crear Documento Formal en Editor en Vivo WAPPY (LiveEditor)',
    shortLabel: 'Documento LiveEditor',
    badge: 'Cabezote + Firmas',
    category: 'output',
    toolHint: 'Presenta tablas comparativas en Markdown, documento formal y resumen ejecutivo wappy-card',
    badgeColor: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
  },
  {
    id: 'google_docs',
    label: 'Crear / Actualizar Informe en Google Docs',
    shortLabel: 'Exportar Google Docs',
    badge: 'Google Docs',
    category: 'output',
    toolHint: 'Crea un documento formal en Google Docs (google_docs) si la cuenta está vinculada',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'google_sheets',
    label: 'Registrar / Actualizar Filas en Google Sheets',
    shortLabel: 'Exportar Google Sheets',
    badge: 'Google Sheets',
    category: 'output',
    toolHint: 'Añade o actualiza filas de control en Google Sheets (google_sheets)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'google_calendar',
    label: 'Agendar Recordatorio / Auditoría en Google Calendar',
    shortLabel: 'Agendar Calendar',
    badge: 'Google Calendar',
    category: 'output',
    toolHint: 'Programa el evento o fecha límite de seguimiento en Google Calendar (google_calendar)',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'google_slides',
    label: 'Generar Presentación en Google Slides',
    shortLabel: 'Crear Google Slides',
    badge: 'Google Slides',
    category: 'output',
    toolHint: 'Estructura diapositivas ejecutivas en Google Slides (google_slides)',
    badgeColor: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
];

export function getNodeDefById(id: string): WorkflowNodeDef | undefined {
  const normId =
    id === 'gmail_inbox_watch' || id === 'gmail_watch'
      ? 'trigger_email'
      : id === 'webhook_event'
        ? 'trigger_webhook'
        : id === 'drive_folder_watch' || id === 'drive_watch' || id === 'sgsst_db_audit' || id === 'sst_deadline_watch'
          ? 'schedule_cron'
          : id === 'hito2_cronograma'
            ? 'hito7_acpm'
            : id;
  return (
    TRIGGER_NODES.find((n) => n.id === normId) ||
    EXTRACTOR_NODES.find((n) => n.id === normId) ||
    MEMORY_NODES.find((n) => n.id === normId) ||
    INPUT_CONNECTOR_NODES.find((n) => n.id === normId) ||
    HITO_APP_NODES.find((n) => n.id === normId || n.sgsstAppId === normId) ||
    OUTPUT_ACTION_NODES.find((n) => n.id === normId) ||
    SKILL_RULE_SUBAGENT_NODES.find((n) => n.id === normId)
  );
}

/**
 * Diccionario maestro de Metadatos, Campos Reales Propios, Combos Quirúrgicos (1 clic) y Etiquetas de Historial de Informes
 * para TODOS los 50 Aplicativos de los 8 Hitos de Somos SST + Extractores + Conectores + Memorias + Salidas.
 */
export const MODULE_METADATA_MAP: Record<string, NodeModuleMetadata> = {
  // ═══ HITO 1: GOBERNANZA Y CIMIENTO LEGAL (15 APLICATIVOS) ═══
  hito1_dofa: {
    moduleTitle: 'Hito 1 · Contexto y Partes Interesadas (DOFA / Stakeholders)',
    moduleBadge: 'Hito 1 · Gobernanza',
    fieldsLabel: 'Campos, Estrategias CAME y Partes Interesadas de «Contexto DOFA»',
    fields: [
      'Fortalezas Internas SST (F)',
      'Debilidades Internas SST (D)',
      'Oportunidades Externas SST (O)',
      'Amenazas Externas SST (A)',
      'Estrategias Ofensivas (FO)',
      'Estrategias Reorientación (DO)',
      'Estrategias Defensivas (FA)',
      'Estrategias Supervivencia (DA)',
      'Partes Interesadas Internas (Trabajadores, COPASST, CCL, Brigada, Alta Dirección)',
      'Partes Interesadas Externas (ARL, EPS, AFP, MinTrabajo, Contratistas, Clientes, Comunidad)',
      'Necesidades y Expectativas en SST por Parte Interesada',
      'Requisitos Legales y Contractuales Asociados',
      'Nivel de Influencia e Impacto del Stakeholder',
      'Mecanismos de Comunicación y Participación',
      'Frecuencia de Seguimiento y Evaluación',
      'Responsable de Gestión por Parte Interesada',
      'Factores Políticos, Económicos, Sociales y Tecnológicos (PESTEL)',
      'Alcance del Sistema de Gestión SG-SST',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Matriz DOFA (F, D, O, A)',
        description: 'Extrae únicamente las 4 variables DOFA sin el resto del documento',
        fields: [
          'Fortalezas Internas SST (F)',
          'Debilidades Internas SST (D)',
          'Oportunidades Externas SST (O)',
          'Amenazas Externas SST (A)',
        ],
      },
      {
        label: '⚡ Estrategias Cruzadas CAME (FO, DO, FA, DA)',
        description: 'Extrae las estrategias cruzadas derivadas del análisis DOFA',
        fields: [
          'Estrategias Ofensivas (FO)',
          'Estrategias Reorientación (DO)',
          'Estrategias Defensivas (FA)',
          'Estrategias Supervivencia (DA)',
        ],
      },
      {
        label: '⚡ Partes Interesadas + Necesidades y Requisitos Legales',
        description: 'Extrae la matriz de Stakeholders internos/externos y sus expectativas SST',
        fields: [
          'Partes Interesadas Internas (Trabajadores, COPASST, CCL, Brigada, Alta Dirección)',
          'Partes Interesadas Externas (ARL, EPS, AFP, MinTrabajo, Contratistas, Clientes, Comunidad)',
          'Necesidades y Expectativas en SST por Parte Interesada',
          'Requisitos Legales y Contractuales Asociados',
        ],
      },
      {
        label: '⚡ Debilidades y Amenazas Críticas + Plan CAME',
        description: 'Enfocado en vulnerabilidades estratégicas del contexto organizacional',
        fields: [
          'Debilidades Internas SST (D)',
          'Amenazas Externas SST (A)',
          'Estrategias Reorientación (DO)',
          'Estrategias Supervivencia (DA)',
        ],
      },
    ],
    reportTags: ['sgsst-contexto-organizacion', 'sgsst-contexto-partes-interesadas'],
  },

  hito1_diagnostico_0312: {
    moduleTitle: 'Hito 1 · Diagnóstico Inicial Estándares Mínimos (Res. 0312)',
    moduleBadge: 'Hito 1 · Res. 0312 de 2019',
    fieldsLabel: 'Campos, Calificaciones y Resultados Propios de «Diagnóstico Res. 0312»',
    fields: [
      'Código Estándar',
      'Nombre del Estándar',
      'Estado (Cumple / No Cumple / Parcial / No Aplica)',
      'Puntaje del Ítem',
      'Puntos del Estándar',
      'Ciclo PHVA',
      'Observación / Hallazgo',
      'Puntaje Total 0312 (%)',
      'Valoración Global (Crítico / Moderado / Aceptable)',
      'Total Estándares Cumplidos',
      'Total Estándares en Brecha (No Cumple)',
      'Total Estándares Parciales / En Proceso',
      'Total Estándares No Aplica (Justificados)',
      'Tamaño de Empresa y Nivel de Riesgo ARL',
      'Artículo Aplicable (7, 21 o 60 Estándares)',
      'Evidencia Documental / Soporte del Estándar',
      'Responsable y Fecha de Cierre de Brecha',
      'Plan de Acción ACPM de Brechas',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Estándares No Cumple y Brechas',
        description: 'Extrae únicamente los estándares en brecha (No Cumple), hallazgos y plan ACPM',
        fields: [
          'Código Estándar',
          'Nombre del Estándar',
          'Estado (Cumple / No Cumple / Parcial / No Aplica)',
          'Observación / Hallazgo',
          'Plan de Acción ACPM de Brechas',
        ],
      },
      {
        label: '⚡ Puntaje Total %, Valoración y Resumen PHVA',
        description: 'Extrae calificación porcentual global, valoración y totales por ciclo PHVA',
        fields: [
          'Puntaje Total 0312 (%)',
          'Valoración Global (Crítico / Moderado / Aceptable)',
          'Total Estándares Cumplidos',
          'Total Estándares en Brecha (No Cumple)',
          'Ciclo PHVA',
        ],
      },
      {
        label: '⚡ Matriz Completa de Estándares y Puntajes',
        description: 'Extrae código, estándar, ciclo PHVA, puntos, estado y observación técnica',
        fields: [
          'Código Estándar',
          'Nombre del Estándar',
          'Ciclo PHVA',
          'Puntos del Estándar',
          'Estado (Cumple / No Cumple / Parcial / No Aplica)',
          'Observación / Hallazgo',
        ],
      },
      {
        label: '⚡ Evidencias Requeridas y Plan de Mejoramiento 0312',
        description: 'Para seguimiento de soportes documentales y cierre de brechas Res. 0312',
        fields: [
          'Código Estándar',
          'Nombre del Estándar',
          'Estado (Cumple / No Cumple / Parcial / No Aplica)',
          'Evidencia Documental / Soporte del Estándar',
          'Responsable y Fecha de Cierre de Brecha',
          'Plan de Acción ACPM de Brechas',
        ],
      },
    ],
    reportTags: ['sgsst-diagnostico'],
  },

  hito1_responsable: {
    moduleTitle: 'Hito 1 · Responsable SG-SST (Licencia e Idoneidad)',
    moduleBadge: 'Hito 1 · Gobernanza',
    fieldsLabel: 'Campos Propios de Asignación y Licencia del Responsable SG-SST',
    fields: [
      'Nombre Completo del Responsable SG-SST',
      'Cédula / Documento del Responsable',
      'Perfil Académico (Profesional / Especialista / Tecnólogo / Técnico SST)',
      'Título Profesional y Universidad / Institución',
      'Número de Resolución de Licencia SST',
      'Secretaría de Salud Emisora de la Licencia',
      'Fecha de Expedición de la Licencia SST',
      'Fecha de Vencimiento de la Licencia SST',
      'Estado de Vigencia de la Licencia SST (Vigente / Próxima a Vencer / Vencida)',
      'Campos de Acción Autorizados en la Licencia SST',
      'Certificado Curso Virtual 50 Horas SG-SST',
      'Certificado Curso de Actualización 20 Horas SG-SST',
      'Entidad Certificadora del Curso 50h/20h (ARL / SENA / Ministerio)',
      'Fecha de Vencimiento del Curso Virtual 50h / 20h',
      'Tipo de Vinculación (Planta / Prestación de Servicios / Consultor Externo)',
      'Dedicación Horaria e Idoneidad según Tamaño y Riesgo ARL (Res. 0312)',
      'Carta de Asignación Firmada por el Representante Legal',
      'Funciones y Responsabilidades Específicas Asignadas en el SG-SST',
    ],
    quickCombos: [
      {
        label: '⚡ Nombre, Cédula, Licencia SST y Vigencia Curso 50h/20h',
        description: 'Verifica la idoneidad legal completa del responsable del SG-SST',
        fields: [
          'Nombre Completo del Responsable SG-SST',
          'Cédula / Documento del Responsable',
          'Número de Resolución de Licencia SST',
          'Fecha de Vencimiento de la Licencia SST',
          'Certificado Curso Virtual 50 Horas SG-SST',
          'Certificado Curso de Actualización 20 Horas SG-SST',
        ],
      },
      {
        label: '⚡ Alerta de Vencimientos (Licencia SST y Curso 50h/20h)',
        description: 'Extrae solo el estado de vigencia y fechas de vencimiento del responsable',
        fields: [
          'Nombre Completo del Responsable SG-SST',
          'Fecha de Vencimiento de la Licencia SST',
          'Estado de Vigencia de la Licencia SST (Vigente / Próxima a Vencer / Vencida)',
          'Fecha de Vencimiento del Curso Virtual 50h / 20h',
        ],
      },
      {
        label: '⚡ Carta de Asignación, Perfil e Idoneidad Res. 0312',
        description: 'Valida cumplimiento del estándar 1.1.1 de la Resolución 0312',
        fields: [
          'Nombre Completo del Responsable SG-SST',
          'Perfil Académico (Profesional / Especialista / Tecnólogo / Técnico SST)',
          'Dedicación Horaria e Idoneidad según Tamaño y Riesgo ARL (Res. 0312)',
          'Carta de Asignación Firmada por el Representante Legal',
          'Funciones y Responsabilidades Específicas Asignadas en el SG-SST',
        ],
      },
    ],
    reportTags: ['sgsst-responsable'],
  },

  hito1_politica_objetivos: {
    moduleTitle: 'Hito 1 · Política de SST (Dec. 1072 Art. 2.2.4.6.5)',
    moduleBadge: 'Hito 1 · Gobernanza',
    fieldsLabel: 'Campos y Componentes Propios de la Política del SG-SST',
    fields: [
      'Declaración Oficial de la Política de SST',
      'Alcance de Cobertura (Todos los Centros de Trabajo, Trabajadores, Contratistas y Subcontratistas)',
      'Compromiso de Identificación de Peligros, Evaluación y Valoración de Riesgos',
      'Compromiso de Mejora Continua del SG-SST',
      'Compromiso de Cumplimiento de la Normatividad Nacional Vigente en Riegos Laborales',
      'Compromiso de Promoción y Protección de la Salud de los Trabajadores',
      'Peligros Prioritarios de la Empresa Integrados en la Política',
      'Políticas Complementarias (Prevención de Acoso Laboral, Alcohol y Drogas, Seguridad Vial PESV)',
      'Código Documental y Número de Versión',
      'Fecha de Emisión y Fecha de Última Revisión Anual',
      'Nombre y Firma del Representante Legal',
      'Revisión y Participación del COPASST / Vigía SST',
      'Evidencia de Publicación en Lugares Visibles de las Sedes',
      'Evidencia de Socialización e Inducción a Trabajadores',
      'Estado de Vigencia (< 1 año desde última revisión)',
      'Alineación con los Objetivos del SG-SST',
    ],
    quickCombos: [
      {
        label: '⚡ Compromisos Legales (Art. 2.2.4.6.6), Vigencia y Firma',
        description: 'Verifica los requisitos obligatorios de la Política SST del Decreto 1072',
        fields: [
          'Declaración Oficial de la Política de SST',
          'Compromiso de Identificación de Peligros, Evaluación y Valoración de Riesgos',
          'Compromiso de Mejora Continua del SG-SST',
          'Compromiso de Cumplimiento de la Normatividad Nacional Vigente en Riegos Laborales',
          'Fecha de Emisión y Fecha de Última Revisión Anual',
          'Nombre y Firma del Representante Legal',
        ],
      },
      {
        label: '⚡ Alcance, Peligros Prioritarios y Políticas Complementarias',
        description: 'Extrae el enfoque técnico y políticas asociadas (Acoso, Alcohol, Vial)',
        fields: [
          'Alcance de Cobertura (Todos los Centros de Trabajo, Trabajadores, Contratistas y Subcontratistas)',
          'Peligros Prioritarios de la Empresa Integrados en la Política',
          'Políticas Complementarias (Prevención de Acoso Laboral, Alcohol y Drogas, Seguridad Vial PESV)',
        ],
      },
      {
        label: '⚡ Socialización, COPASST y Evidencia de Publicación',
        description: 'Audita la divulgación efectiva de la política a trabajadores y COPASST',
        fields: [
          'Fecha de Emisión y Fecha de Última Revisión Anual',
          'Revisión y Participación del COPASST / Vigía SST',
          'Evidencia de Publicación en Lugares Visibles de las Sedes',
          'Evidencia de Socialización e Inducción a Trabajadores',
          'Estado de Vigencia (< 1 año desde última revisión)',
        ],
      },
    ],
    reportTags: ['sgsst-politica'],
  },

  hito1_objetivos: {
    moduleTitle: 'Hito 1 · Objetivos e Indicadores de SST',
    moduleBadge: 'Hito 1 · Gobernanza',
    fieldsLabel: 'Campos, Fórmulas y Resultados Propios de Objetivos e Indicadores SST',
    fields: [
      'Código / ID del Objetivo SST',
      'Objetivo Estratégico del SG-SST',
      'Directriz de la Política SST con la que se Alinea',
      'Nombre del Indicador Asociado',
      'Tipo de Indicador (Estructura / Proceso / Resultado — Art. 2.2.4.6.19)',
      'Definición e Interpretación del Indicador',
      'Fórmula Matemática de Cálculo',
      'Unidad de Medida (%, Tasa, Número, Días)',
      'Fuente de Información para el Cálculo',
      'Línea Base / Resultado Período Anterior',
      'Meta Anual Establecida (%)',
      'Resultado Actual Medido (%)',
      'Semáforo de Cumplimiento (Cumple Verde / Alerta Amarillo / Brecha Rojo)',
      'Periodicidad / Frecuencia de Medición (Mensual, Trimestral, Semestral, Anual)',
      'Responsable de Medición y Seguimiento',
      'Análisis de Tendencia y Desviaciones',
      'Plan de Acción ACPM por Incumplimiento de Meta',
    ],
    quickCombos: [
      {
        label: '⚡ Objetivos, Indicador, Meta (%) y Resultado Actual',
        description: 'Cuadro de mando ejecutivo de cumplimiento de objetivos SST',
        fields: [
          'Objetivo Estratégico del SG-SST',
          'Nombre del Indicador Asociado',
          'Tipo de Indicador (Estructura / Proceso / Resultado — Art. 2.2.4.6.19)',
          'Meta Anual Establecida (%)',
          'Resultado Actual Medido (%)',
          'Semáforo de Cumplimiento (Cumple Verde / Alerta Amarillo / Brecha Rojo)',
        ],
      },
      {
        label: '⚡ Solo Indicadores en Brecha (No Cumplen Meta) y Plan de Acción',
        description: 'Filtra desviaciones de metas para abrir acciones correctivas',
        fields: [
          'Objetivo Estratégico del SG-SST',
          'Nombre del Indicador Asociado',
          'Meta Anual Establecida (%)',
          'Resultado Actual Medido (%)',
          'Análisis de Tendencia y Desviaciones',
          'Plan de Acción ACPM por Incumplimiento de Meta',
        ],
      },
      {
        label: '⚡ Ficha Técnica de Indicadores (Fórmula, Periodicidad y Fuente)',
        description: 'Audita las fichas técnicas de Estructura, Proceso y Resultado',
        fields: [
          'Nombre del Indicador Asociado',
          'Tipo de Indicador (Estructura / Proceso / Resultado — Art. 2.2.4.6.19)',
          'Fórmula Matemática de Cálculo',
          'Fuente de Información para el Cálculo',
          'Periodicidad / Frecuencia de Medición (Mensual, Trimestral, Semestral, Anual)',
          'Responsable de Medición y Seguimiento',
        ],
      },
    ],
    reportTags: ['sgsst-objetivos'],
  },

  hito1_matriz_legal: {
    moduleTitle: 'Hito 1 · Matriz Legal SG-SST',
    moduleBadge: 'Hito 1 · Normograma',
    fieldsLabel: 'Campos Propios de la Matriz Legal y Normograma SG-SST',
    fields: [
      'Jerarquía / Tipo de Norma (Constitución, Ley, Decreto, Resolución, Circular, NTC)',
      'Número de la Norma y Año de Expedición',
      'Entidad Emisora (MinTrabajo, MinSalud, MinTransporte, Congreso, Presidencia)',
      'Título / Epígrafe Oficial de la Norma',
      'Artículos Específicos Aplicables a la Empresa',
      'Tema / Peligro o Proceso Regulado',
      'Sector Económico / CIIU Aplicable',
      'Descripción de la Obligación Legal Específica',
      'Evidencia Documental u Operativa Requerida',
      'Evidencia Existente Registrada en la Empresa',
      'Área / Proceso y Cargo Responsable del Cumplimiento',
      'Estado de Cumplimiento (Cumple / Parcial / Pendiente / No Aplica)',
      'Porcentaje de Cumplimiento Legal Global (%)',
      'Total Normas Evaluadas vs. Normas en Brecha',
      'Vigencia de la Norma (Vigente / Modificada / Derogada)',
      'Fecha de Última Actualización de la Matriz Legal',
      'Plan de Acción para Normas en Brecha',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Normas Pendientes / En Brecha y Evidencia Requerida',
        description: 'Extrae únicamente los requisitos legales que aún no cumplen al 100%',
        fields: [
          'Jerarquía / Tipo de Norma (Constitución, Ley, Decreto, Resolución, Circular, NTC)',
          'Número de la Norma y Año de Expedición',
          'Artículos Específicos Aplicables a la Empresa',
          'Descripción de la Obligación Legal Específica',
          'Evidencia Documental u Operativa Requerida',
          'Estado de Cumplimiento (Cumple / Parcial / Pendiente / No Aplica)',
          'Plan de Acción para Normas en Brecha',
        ],
      },
      {
        label: '⚡ Normograma Completo (Norma, Artículos, Obligación y Estado)',
        description: 'Resumen estructurado de todas las normas aplicables a la empresa',
        fields: [
          'Jerarquía / Tipo de Norma (Constitución, Ley, Decreto, Resolución, Circular, NTC)',
          'Número de la Norma y Año de Expedición',
          'Entidad Emisora (MinTrabajo, MinSalud, MinTransporte, Congreso, Presidencia)',
          'Artículos Específicos Aplicables a la Empresa',
          'Tema / Peligro o Proceso Regulado',
          'Estado de Cumplimiento (Cumple / Parcial / Pendiente / No Aplica)',
        ],
      },
      {
        label: '⚡ KPIs de Cumplimiento Legal (%) y Última Actualización',
        description: 'Indicadores ejecutivos de cumplimiento normativo para auditoría 0312',
        fields: [
          'Porcentaje de Cumplimiento Legal Global (%)',
          'Total Normas Evaluadas vs. Normas en Brecha',
          'Fecha de Última Actualización de la Matriz Legal',
          'Plan de Acción para Normas en Brecha',
        ],
      },
    ],
    reportTags: ['sgsst-matriz-legal'],
  },

  hito1_rhs: {
    moduleTitle: 'Hito 1 · Reglamento de Higiene y Seguridad Industrial (RHS)',
    moduleBadge: 'Hito 1 · Gobernanza',
    fieldsLabel: 'Campos Propios del Reglamento de Higiene y Seguridad Industrial (RHS)',
    fields: [
      'Razón Social, NIT y Domicilio Principal de la Empresa',
      'Ciudad, Departamento, Dirección y Teléfono de las Sedes',
      'Nombre de la ARL Afiliada',
      'Clase o Nivel de Riesgo ARL (I, II, III, IV o V)',
      'Código CIIU y Descripción de la Actividad Económica',
      'Peligros Físicos Declarados en el RHS',
      'Peligros Químicos Declarados en el RHS',
      'Peligros Biológicos Declarados en el RHS',
      'Peligros Biomecánicos / Ergonómicos Declarados en el RHS',
      'Peligros Psicosociales Declarados en el RHS',
      'Peligros de Condiciones de Seguridad (Mecánico, Eléctrico, Locativo, Alturas, Tránsito, Público)',
      'Fenómenos Naturales Aplicables',
      'Compromiso Legal del Empleador (Art. 349 y 350 Código Sustantivo del Trabajo)',
      'Obligaciones de Prevención, Suministro de EPP y Subprograma de Medicina e Higiene',
      'Fecha de Emisión y Actualización del RHS (Ley 962 de 2005)',
      'Nombre y Firma del Representante Legal',
      'Evidencia de Publicación en Dos (2) Lugares Visibles por Sede',
    ],
    quickCombos: [
      {
        label: '⚡ CIIU, Riesgo ARL y Todos los Peligros Declarados en el RHS',
        description: 'Cruza los peligros declarados en el RHS con la Matriz IPEVR GTC-45',
        fields: [
          'Código CIIU y Descripción de la Actividad Económica',
          'Clase o Nivel de Riesgo ARL (I, II, III, IV o V)',
          'Peligros Físicos Declarados en el RHS',
          'Peligros Químicos Declarados en el RHS',
          'Peligros Biológicos Declarados en el RHS',
          'Peligros Biomecánicos / Ergonómicos Declarados en el RHS',
          'Peligros Psicosociales Declarados en el RHS',
          'Peligros de Condiciones de Seguridad (Mecánico, Eléctrico, Locativo, Alturas, Tránsito, Público)',
        ],
      },
      {
        label: '⚡ Datos de Empresa, ARL, Firma y Publicación Visible',
        description: 'Verifica validez formal y publicación del RHS en sedes',
        fields: [
          'Razón Social, NIT y Domicilio Principal de la Empresa',
          'Nombre de la ARL Afiliada',
          'Fecha de Emisión y Actualización del RHS (Ley 962 de 2005)',
          'Nombre y Firma del Representante Legal',
          'Evidencia de Publicación en Dos (2) Lugares Visibles por Sede',
        ],
      },
      {
        label: '⚡ Compromisos del Empleador (CST Art. 349) y Prevención',
        description: 'Extrae el articulado de compromisos legales del RHS',
        fields: [
          'Compromiso Legal del Empleador (Art. 349 y 350 Código Sustantivo del Trabajo)',
          'Obligaciones de Prevención, Suministro de EPP y Subprograma de Medicina e Higiene',
          'Nombre y Firma del Representante Legal',
        ],
      },
    ],
    reportTags: ['sgsst-rhs'],
  },

  hito1_rit: {
    moduleTitle: 'Hito 1 · Reglamento Interno de Trabajo (RIT)',
    moduleBadge: 'Hito 1 · Gobernanza',
    fieldsLabel: 'Capítulos y Artículos Propios del Reglamento Interno de Trabajo (RIT)',
    fields: [
      'Identificación del Empleador, NIT y Sedes Cubiertas',
      'Condiciones de Admisión y Requisitos de Ingreso',
      'Contrato de Aprendizaje y Período de Prueba',
      'Trabajadores Accidentales o Transitorios',
      'Horario de Trabajo, Turnos y Jornada Ordinaria Legal (Ley 2101 de 2021)',
      'Horas Extras, Trabajo Nocturno, Dominical y Festivo',
      'Días de Descanso Legalmente Obligatorios, Vacaciones y Permisos',
      'Salario, Lugar, Día, Hora de Pagos y Períodos que lo Regulan',
      'Servicio Médico, Medidas de Seguridad, Riesgos Laborales y Primeros Auxilios',
      'Prescripciones de Orden y Seguridad en el Trabajo',
      'Orden Jerárquico de la Empresa',
      'Labores Prohibidas para Mujeres en Embarazo y Menores de Edad',
      'Obligaciones Especiales para la Empresa y los Trabajadores',
      'Prohibiciones Especiales para la Empresa y los Trabajadores',
      'Escala de Faltas y Sanciones Disciplinarias',
      'Procedimiento para Comprobación de Faltas y Derecho a la Defensa (Descargos)',
      'Mecanismos de Prevención del Acoso Laboral y Procedimiento Interno Confidencial (Ley 1010 de 2006)',
      'Teletrabajo, Trabajo en Casa y Desconexión Laboral (Ley 2191 de 2022)',
      'Fecha de Entrada en Vigencia, Firma y Publicación (Ley 1429 de 2010)',
    ],
    quickCombos: [
      {
        label: '⚡ Prescripciones SST, Obligaciones y Escala de Faltas/Sanciones',
        description: 'Extrae las normas de seguridad laboral y régimen disciplinario del RIT',
        fields: [
          'Servicio Médico, Medidas de Seguridad, Riesgos Laborales y Primeros Auxilios',
          'Prescripciones de Orden y Seguridad en el Trabajo',
          'Obligaciones Especiales para la Empresa y los Trabajadores',
          'Escala de Faltas y Sanciones Disciplinarias',
          'Procedimiento para Comprobación de Faltas y Derecho a la Defensa (Descargos)',
        ],
      },
      {
        label: '⚡ Prevención de Acoso Laboral (Ley 1010) y Desconexión Laboral',
        description: 'Cruza con el Comité de Convivencia Laboral y Riesgo Psicosocial',
        fields: [
          'Mecanismos de Prevención del Acoso Laboral y Procedimiento Interno Confidencial (Ley 1010 de 2006)',
          'Teletrabajo, Trabajo en Casa y Desconexión Laboral (Ley 2191 de 2022)',
          'Prohibiciones Especiales para la Empresa y los Trabajadores',
        ],
      },
      {
        label: '⚡ Jornada Laboral (Ley 2101), Horarios, Permisos y Vacaciones',
        description: 'Extrae la regulación de tiempos, turnos y descansos del RIT',
        fields: [
          'Horario de Trabajo, Turnos y Jornada Ordinaria Legal (Ley 2101 de 2021)',
          'Horas Extras, Trabajo Nocturno, Dominical y Festivo',
          'Días de Descanso Legalmente Obligatorios, Vacaciones y Permisos',
          'Fecha de Entrada en Vigencia, Firma y Publicación (Ley 1429 de 2010)',
        ],
      },
    ],
    reportTags: ['sgsst-rit'],
  },

  hito1_participacion_ipevar: {
    moduleTitle: 'Hito 1 · Participación IPEVR Comunitaria de Trabajadores',
    moduleBadge: 'Hito 1 · Participación',
    fieldsLabel: 'Campos y Reportes del Portal de Participación IPEVR Comunitaria',
    fields: [
      'Cédula / Documento del Trabajador',
      'Nombre Completo del Trabajador',
      'Cargo / Rol del Trabajador',
      'Área / Proceso y Sede',
      'Fecha del Reporte Participativo',
      'Peligros Percibidos en su Puesto de Trabajo',
      'Familia del Peligro Reportado (Biomecánico, Físico, Químico, Psicosocial, Condiciones de Seguridad, etc.)',
      'Fuente o Causa del Peligro Según el Trabajador',
      'Mapa Corporal: Segmento Anatómico con Dolor o Molestia (Cuello, Hombros, Espalda, Manos, Piernas)',
      'Intensidad de Molestia o Fatiga Reportada (Escala 1 a 10)',
      'Nivel de Percepción del Riesgo (Bajo / Medio / Alto / Crítico)',
      'Puntaje de Percepción del Riesgo (pts)',
      'Frecuencia de Exposición Percibida',
      'Controles o Mejoras Propuestas por el Trabajador',
      'Evidencia o Comentario Adicional del Colaborador',
      'Estado de Revisión por el Especialista SST (Pendiente / Validado / Incorporado a Matriz GTC-45)',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula, Nombre, Peligros Percibidos y Mapa Corporal de Dolor',
        description: 'Extrae el autorreporte participativo de peligros y sintomatología corporal',
        fields: [
          'Cédula / Documento del Trabajador',
          'Nombre Completo del Trabajador',
          'Cargo / Rol del Trabajador',
          'Peligros Percibidos en su Puesto de Trabajo',
          'Mapa Corporal: Segmento Anatómico con Dolor o Molestia (Cuello, Hombros, Espalda, Manos, Piernas)',
          'Nivel de Percepción del Riesgo (Bajo / Medio / Alto / Crítico)',
        ],
      },
      {
        label: '⚡ Solo Reportes de Riesgo Alto/Crítico y Mejoras Propuestas',
        description: 'Filtra las percepciones críticas pendientes de incorporar a la Matriz GTC-45',
        fields: [
          'Cédula / Documento del Trabajador',
          'Nombre Completo del Trabajador',
          'Área / Proceso y Sede',
          'Peligros Percibidos en su Puesto de Trabajo',
          'Nivel de Percepción del Riesgo (Bajo / Medio / Alto / Crítico)',
          'Controles o Mejoras Propuestas por el Trabajador',
          'Estado de Revisión por el Especialista SST (Pendiente / Validado / Incorporado a Matriz GTC-45)',
        ],
      },
      {
        label: '⚡ Cruce de Percepción del Riesgo (pts) por Cargo y Área',
        description: 'Para alimentar el Oráculo de Compatibilidad y la Matriz Bio-IPEVR',
        fields: [
          'Cédula / Documento del Trabajador',
          'Nombre Completo del Trabajador',
          'Cargo / Rol del Trabajador',
          'Puntaje de Percepción del Riesgo (pts)',
          'Familia del Peligro Reportado (Biomecánico, Físico, Químico, Psicosocial, Condiciones de Seguridad, etc.)',
        ],
      },
    ],
    reportTags: ['sgsst-participacion-ipevar'],
  },

  hito2_matriz_ipevar: {
    moduleTitle: 'Hito 1 · Matriz Oficial de Peligros IPEVR (GTC-45)',
    moduleBadge: 'Hito 1 · GTC-45',
    fieldsLabel: 'Columnas, Valoraciones y Controles Propios de la Matriz de Peligros IPEVR GTC-45',
    fields: [
      'Proceso / Macroproceso',
      'Zona o Lugar / Sede',
      'Actividad y Tarea',
      'Cargo(s) Expuesto(s)',
      'Rutinario (Sí / No)',
      'Clasificación / Familia del Peligro (Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de Seguridad, Fenómenos Naturales)',
      'Descripción del Peligro y Fuente Generadora',
      'Efectos Posibles en la Salud / Peor Consecuencia',
      'Control Existente en la Fuente',
      'Control Existente en el Medio',
      'Control Existente en el Individuo',
      'Nivel de Deficiencia (ND: 10, 6, 2, 0)',
      'Nivel de Exposición (NE: 4, 3, 2, 1)',
      'Nivel de Probabilidad (NP = ND x NE)',
      'Interpretación del Nivel de Probabilidad (Muy Alto, Alto, Medio, Bajo)',
      'Nivel de Consecuencia (NC: 100, 60, 25, 10)',
      'Nivel de Riesgo (NR = NP x NC)',
      'Interpretación del Nivel de Riesgo (Nivel I Crítico, Nivel II Alto, Nivel III Medio, Nivel IV Bajo)',
      'Aceptabilidad del Riesgo (No Aceptable / Aceptable con Control Específico / Mejorable / Aceptable)',
      'Número Total de Expuestos (Planta, Contratistas, Visitantes)',
      'Existencia de Requisito Legal Específico Asociado',
      'Medida de Intervención: Eliminación y Sustitución',
      'Medida de Intervención: Controles de Ingeniería',
      'Medida de Intervención: Controles Administrativos, Señalización y Advertencia',
      'Medida de Intervención: Elementos de Protección Personal (EPP)',
      'Estado de Implementación de Controles y Responsable',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Peligros Críticos (Nivel I y II) + Medidas de Intervención',
        description: 'Prioriza los peligros No Aceptables y sus controles obligatorios',
        fields: [
          'Proceso / Macroproceso',
          'Cargo(s) Expuesto(s)',
          'Clasificación / Familia del Peligro (Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de Seguridad, Fenómenos Naturales)',
          'Descripción del Peligro y Fuente Generadora',
          'Nivel de Riesgo (NR = NP x NC)',
          'Interpretación del Nivel de Riesgo (Nivel I Crítico, Nivel II Alto, Nivel III Medio, Nivel IV Bajo)',
          'Aceptabilidad del Riesgo (No Aceptable / Aceptable con Control Específico / Mejorable / Aceptable)',
          'Medida de Intervención: Controles de Ingeniería',
          'Medida de Intervención: Controles Administrativos, Señalización y Advertencia',
          'Medida de Intervención: Elementos de Protección Personal (EPP)',
        ],
      },
      {
        label: '⚡ Proceso, Cargo, Peligro, Controles Existentes y EPP',
        description: 'Resumen operativo por cargo sin las columnas matemáticas intermedias',
        fields: [
          'Proceso / Macroproceso',
          'Cargo(s) Expuesto(s)',
          'Actividad y Tarea',
          'Descripción del Peligro y Fuente Generadora',
          'Control Existente en la Fuente',
          'Control Existente en el Medio',
          'Control Existente en el Individuo',
          'Medida de Intervención: Elementos de Protección Personal (EPP)',
        ],
      },
      {
        label: '⚡ Valoración Matemática Completa GTC-45 (ND, NE, NP, NC, NR)',
        description: 'Extrae la calificación cuantitativa completa de cada peligro',
        fields: [
          'Descripción del Peligro y Fuente Generadora',
          'Nivel de Deficiencia (ND: 10, 6, 2, 0)',
          'Nivel de Exposición (NE: 4, 3, 2, 1)',
          'Nivel de Probabilidad (NP = ND x NE)',
          'Nivel de Consecuencia (NC: 100, 60, 25, 10)',
          'Nivel de Riesgo (NR = NP x NC)',
          'Interpretación del Nivel de Riesgo (Nivel I Crítico, Nivel II Alto, Nivel III Medio, Nivel IV Bajo)',
          'Aceptabilidad del Riesgo (No Aceptable / Aceptable con Control Específico / Mejorable / Aceptable)',
        ],
      },
      {
        label: '⚡ Expuestos, Peor Consecuencia y Requisito Legal',
        description: 'Para cruzar con Matriz Legal, Profesiograma y Plan de Trabajo Anual',
        fields: [
          'Proceso / Macroproceso',
          'Descripción del Peligro y Fuente Generadora',
          'Efectos Posibles en la Salud / Peor Consecuencia',
          'Número Total de Expuestos (Planta, Contratistas, Visitantes)',
          'Existencia de Requisito Legal Específico Asociado',
        ],
      },
    ],
    reportTags: ['sgsst-matriz-ipevar', 'sgsst-matriz-peligros'],
  },

  hito3_matriz_pesv: {
    moduleTitle: 'Hito 1 · Matriz de Riesgos Viales (PESV Res. 40595)',
    moduleBadge: 'Hito 1 · PESV',
    fieldsLabel: 'Columnas y Resultados Propios de la Matriz de Riesgos Viales PESV (Res. 20223040040595)',
    fields: [
      'Actor Vial Evaluado (Conductor, Motociclista, Ciclista, Peatón, Pasajero)',
      'Factor de Riesgo Vial (Comportamiento Humano, Vehículo Seguro, Infraestructura Segura, Atención a Víctimas, Gestión Institucional)',
      'Proceso / Ruta / Desplazamiento (Misional vs. In Itinere Casa-Trabajo)',
      'Peligro Vial Identificado y Fuente Generadora',
      'Efectos Posibles / Siniestro Vial Potencial',
      'Controles Viales Existentes (Vehículo, Vía, Conductor)',
      'Nivel de Exposición Vial (Frecuencia de Desplazamiento)',
      'Nivel de Probabilidad Vial (1 a 4)',
      'Nivel de Consecuencia / Severidad Vial (1 a 4)',
      'Valoración Cuantitativa del Riesgo Vial (NP x NC)',
      'Nivel de Riesgo Vial (Crítico, Alto, Medio, Bajo)',
      'Aceptabilidad del Riesgo Vial (No Aceptable / Aceptable con Control / Aceptable)',
      'Número de Colaboradores / Conductores Expuestos',
      'Controles Preventivos PESV: Factor Humano y Capacitación',
      'Controles Preventivos PESV: Mantenimiento y Tecnología Vehicular',
      'Controles Preventivos PESV: Rutograma y Gestión de Velocidad / Fatiga',
      'Responsable y Estado de Seguimiento en Comité PESV',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Riesgos Viales Críticos/Altos y Controles PESV',
        description: 'Extrae los peligros viales prioritarios por actor vial y sus controles',
        fields: [
          'Actor Vial Evaluado (Conductor, Motociclista, Ciclista, Peatón, Pasajero)',
          'Factor de Riesgo Vial (Comportamiento Humano, Vehículo Seguro, Infraestructura Segura, Atención a Víctimas, Gestión Institucional)',
          'Peligro Vial Identificado y Fuente Generadora',
          'Nivel de Riesgo Vial (Crítico, Alto, Medio, Bajo)',
          'Aceptabilidad del Riesgo Vial (No Aceptable / Aceptable con Control / Aceptable)',
          'Controles Preventivos PESV: Factor Humano y Capacitación',
          'Controles Preventivos PESV: Mantenimiento y Tecnología Vehicular',
        ],
      },
      {
        label: '⚡ Actor Vial, Ruta (Misional/In Itinere) y Expuestos',
        description: 'Caracterización de desplazamientos por rol vial',
        fields: [
          'Actor Vial Evaluado (Conductor, Motociclista, Ciclista, Peatón, Pasajero)',
          'Proceso / Ruta / Desplazamiento (Misional vs. In Itinere Casa-Trabajo)',
          'Peligro Vial Identificado y Fuente Generadora',
          'Número de Colaboradores / Conductores Expuestos',
          'Nivel de Riesgo Vial (Crítico, Alto, Medio, Bajo)',
        ],
      },
      {
        label: '⚡ Matriz Cuantitativa PESV Completa (Probabilidad, Severidad y Nivel)',
        description: 'Extrae la calificación técnica conforme a la Metodología Res. 40595',
        fields: [
          'Actor Vial Evaluado (Conductor, Motociclista, Ciclista, Peatón, Pasajero)',
          'Peligro Vial Identificado y Fuente Generadora',
          'Nivel de Probabilidad Vial (1 a 4)',
          'Nivel de Consecuencia / Severidad Vial (1 a 4)',
          'Valoración Cuantitativa del Riesgo Vial (NP x NC)',
          'Nivel de Riesgo Vial (Crítico, Alto, Medio, Bajo)',
          'Responsable y Estado de Seguimiento en Comité PESV',
        ],
      },
    ],
    reportTags: ['sgsst-matriz-pesv'],
  },

  hito3_quimicos_sga: {
    moduleTitle: 'Hito 1 · Matriz de Compatibilidad Química (SGA Dec. 1496)',
    moduleBadge: 'Hito 1 · Químicos SGA',
    fieldsLabel: 'Campos, Cruces SGA/ONU y Resultados Propios de la Matriz de Compatibilidad Química',
    fields: [
      'Nombre Comercial del Producto Químico',
      'Sustancia Activa / Componente Peligroso Principal',
      'Número CAS (Chemical Abstracts Service)',
      'Número ONU (UN)',
      'Clase de Peligro ONU (Clases 1 a 9 — Inflamable, Corrosivo, Tóxico, Comburente, etc.)',
      'Subclase Química (Ácido vs. Base / Alcalino / Hipoclorito)',
      'Pictogramas SGA / GHS Aplicables (GHS01 a GHS09)',
      'Palabra de Advertencia SGA (Peligro / Atención)',
      'Indicaciones de Peligro (Frases H)',
      'Consejos de Prudencia (Frases P)',
      'Estado Físico (Líquido, Sólido, Gas, Aerosol) y Cantidad Almacenada',
      'Área de Uso y Bodega / Estante de Almacenamiento',
      'Resultado de Compatibilidad Cruzada (Verde Compatible / Amarillo Precaución / Rojo Incompatible)',
      'Pares de Sustancias Incompatibles Detectadas (Riesgo de Reacción Violenta o Gas Tóxico)',
      'Distancia Mínima de Separación y Condiciones de Segregación / Dique de Contención',
      'Vigencia de Ficha de Datos de Seguridad (FDS de 16 Secciones < 5 años)',
      'EPP Químico Específico y Kit de Control de Derrames / Lavaojos',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Choques e Incompatibilidades Químicas (Rojo/Amarillo)',
        description: 'Detecta mezclas peligrosas (ej. Ácido vs. Hipoclorito o Inflamable vs. Comburente)',
        fields: [
          'Nombre Comercial del Producto Químico',
          'Clase de Peligro ONU (Clases 1 a 9 — Inflamable, Corrosivo, Tóxico, Comburente, etc.)',
          'Subclase Química (Ácido vs. Base / Alcalino / Hipoclorito)',
          'Resultado de Compatibilidad Cruzada (Verde Compatible / Amarillo Precaución / Rojo Incompatible)',
          'Pares de Sustancias Incompatibles Detectadas (Riesgo de Reacción Violenta o Gas Tóxico)',
          'Distancia Mínima de Separación y Condiciones de Segregación / Dique de Contención',
        ],
      },
      {
        label: '⚡ Sustancia, CAS/ONU, Pictogramas SGA y Vigencia de FDS',
        description: 'Audita etiquetado SGA Decreto 1496 y Fichas de Datos de Seguridad',
        fields: [
          'Nombre Comercial del Producto Químico',
          'Número CAS (Chemical Abstracts Service)',
          'Número ONU (UN)',
          'Pictogramas SGA / GHS Aplicables (GHS01 a GHS09)',
          'Palabra de Advertencia SGA (Peligro / Atención)',
          'Vigencia de Ficha de Datos de Seguridad (FDS de 16 Secciones < 5 años)',
        ],
      },
      {
        label: '⚡ Frases H/P, EPP Químico y Atención de Derrames',
        description: 'Ficha operativa de seguridad química para trabajadores y brigada',
        fields: [
          'Nombre Comercial del Producto Químico',
          'Indicaciones de Peligro (Frases H)',
          'Consejos de Prudencia (Frases P)',
          'Área de Uso y Bodega / Estante de Almacenamiento',
          'EPP Químico Específico y Kit de Control de Derrames / Lavaojos',
        ],
      },
    ],
    reportTags: ['sgsst-matriz-compatibilidad'],
  },

  hito1_oportunidades_sst: {
    moduleTitle: 'Hito 1 · Riesgos del Sistema y Oportunidades SST (ISO 45001)',
    moduleBadge: 'Hito 1 · Gobernanza',
    fieldsLabel: 'Campos Propios de Riesgos Estratégicos y Oportunidades del SG-SST (ISO 45001 Cap. 6.1)',
    fields: [
      'Código / ID del Registro',
      'Tipo de Ítem (Riesgo Estratégico del Sistema / Oportunidad de Mejora SST)',
      'Proceso o Elemento del SG-SST Asociado',
      'Origen (Contexto DOFA, Partes Interesadas, Auditoría, Cambio Normativo o Tecnológico)',
      'Descripción Detallada del Riesgo del Sistema o de la Oportunidad SST',
      'Causa Raíz o Factor Impulsor',
      'Efecto Potencial sobre el Desempeño del SG-SST',
      'Probabilidad de Ocurrencia / Factibilidad (Alta, Media, Baja)',
      'Impacto Estratégico, Legal o Financiero (Alto, Medio, Bajo)',
      'Calificación de Prioridad (Crítica, Alta, Moderada, Baja)',
      'Controles o Barreras Actuales',
      'Plan de Acción para Abordar el Riesgo o Capitalizar la Oportunidad',
      'Recursos Requeridos / Presupuesto Estimado',
      'Responsable de Ejecución',
      'Fecha Límite de Implementación',
      'Indicador de Eficacia y Estado (Abierto / En Ejecución / Cerrado)',
    ],
    quickCombos: [
      {
        label: '⚡ Riesgos Estratégicos Críticos + Plan de Acción',
        description: 'Extrae los riesgos de gestión del sistema con prioridad crítica o alta',
        fields: [
          'Tipo de Ítem (Riesgo Estratégico del Sistema / Oportunidad de Mejora SST)',
          'Proceso o Elemento del SG-SST Asociado',
          'Descripción Detallada del Riesgo del Sistema o de la Oportunidad SST',
          'Calificación de Prioridad (Crítica, Alta, Moderada, Baja)',
          'Plan de Acción para Abordar el Riesgo o Capitalizar la Oportunidad',
          'Responsable de Ejecución',
        ],
      },
      {
        label: '⚡ Oportunidades de Mejora SST + Factibilidad e Impacto',
        description: 'Extrae las oportunidades estratégicas ISO 45001 para el Plan Anual',
        fields: [
          'Descripción Detallada del Riesgo del Sistema o de la Oportunidad SST',
          'Probabilidad de Ocurrencia / Factibilidad (Alta, Media, Baja)',
          'Impacto Estratégico, Legal o Financiero (Alto, Medio, Bajo)',
          'Plan de Acción para Abordar el Riesgo o Capitalizar la Oportunidad',
          'Recursos Requeridos / Presupuesto Estimado',
        ],
      },
      {
        label: '⚡ Seguimiento de Acciones, Responsables y Estado de Cierre',
        description: 'Audita el avance de los planes de riesgos y oportunidades del sistema',
        fields: [
          'Código / ID del Registro',
          'Descripción Detallada del Riesgo del Sistema o de la Oportunidad SST',
          'Plan de Acción para Abordar el Riesgo o Capitalizar la Oportunidad',
          'Responsable de Ejecución',
          'Fecha Límite de Implementación',
          'Indicador de Eficacia y Estado (Abierto / En Ejecución / Cerrado)',
        ],
      },
    ],
    reportTags: ['sgsst-oportunidades', 'sgsst-oportunidades-sst'],
  },

  hito6_vulnerabilidad: {
    moduleTitle: 'Hito 1 · Análisis de Amenazas y Vulnerabilidad (Diamante de Riesgo)',
    moduleBadge: 'Hito 1 · Emergencias',
    fieldsLabel: 'Campos y Resultados Propios del Análisis de Vulnerabilidad por Diamante de Colores',
    fields: [
      'Amenaza Identificada',
      'Categoría de la Amenaza (Natural, Tecnológica / Antrópica o Social)',
      'Origen de la Amenaza (Interno / Externo)',
      'Descripción de la Fuente Generadora y Escenario de Emergencia',
      'Calificación de la Amenaza (Posible = Verde / Probable = Amarillo / Inminente = Rojo)',
      'Vulnerabilidad en Personas: Gestión Organizacional',
      'Vulnerabilidad en Personas: Capacitación y Entrenamiento',
      'Vulnerabilidad en Personas: Características de Seguridad y Dotación',
      'Subtotal y Color de Vulnerabilidad en Personas (Baja / Media / Alta)',
      'Vulnerabilidad en Recursos: Suministros y Equipos de Emergencia',
      'Vulnerabilidad en Recursos: Edificación e Infraestructura',
      'Vulnerabilidad en Recursos: Equipos de Alarma y Detección',
      'Subtotal y Color de Vulnerabilidad en Recursos (Baja / Media / Alta)',
      'Vulnerabilidad en Sistemas y Procesos: Servicios Públicos',
      'Vulnerabilidad en Sistemas y Procesos: Sistemas Alternos (Planta, Tanque, Backups)',
      'Vulnerabilidad en Sistemas y Procesos: Recuperación y Pólizas',
      'Subtotal y Color de Vulnerabilidad en Sistemas y Procesos (Baja / Media / Alta)',
      'Consolidado del Diamante de Riesgo (4 Rombos) y Nivel de Riesgo Global (Alto, Medio, Bajo)',
      'Medidas de Prevención, Mitigación e Intervención Prioritarias',
    ],
    quickCombos: [
      {
        label: '⚡ Amenaza, Calificación, Nivel de Riesgo Diamante y Mitigación',
        description: 'Extrae el resultado ejecutivo del Diamante de Colores por amenaza',
        fields: [
          'Amenaza Identificada',
          'Categoría de la Amenaza (Natural, Tecnológica / Antrópica o Social)',
          'Calificación de la Amenaza (Posible = Verde / Probable = Amarillo / Inminente = Rojo)',
          'Consolidado del Diamante de Riesgo (4 Rombos) y Nivel de Riesgo Global (Alto, Medio, Bajo)',
          'Medidas de Prevención, Mitigación e Intervención Prioritarias',
        ],
      },
      {
        label: '⚡ Desglose de los 4 Rombos (Amenaza, Personas, Recursos y Sistemas)',
        description: 'Detalle completo de vulnerabilidad en Personas, Recursos y Sistemas',
        fields: [
          'Amenaza Identificada',
          'Calificación de la Amenaza (Posible = Verde / Probable = Amarillo / Inminente = Rojo)',
          'Subtotal y Color de Vulnerabilidad en Personas (Baja / Media / Alta)',
          'Subtotal y Color de Vulnerabilidad en Recursos (Baja / Media / Alta)',
          'Subtotal y Color de Vulnerabilidad en Sistemas y Procesos (Baja / Media / Alta)',
          'Consolidado del Diamante de Riesgo (4 Rombos) y Nivel de Riesgo Global (Alto, Medio, Bajo)',
        ],
      },
      {
        label: '⚡ Solo Amenazas de Riesgo Alto/Medio y Plan de Intervención',
        description: 'Ideal para alimentar el Plan de Emergencias (PPRE) y Simulacros',
        fields: [
          'Amenaza Identificada',
          'Descripción de la Fuente Generadora y Escenario de Emergencia',
          'Consolidado del Diamante de Riesgo (4 Rombos) y Nivel de Riesgo Global (Alto, Medio, Bajo)',
          'Medidas de Prevención, Mitigación e Intervención Prioritarias',
        ],
      },
    ],
    reportTags: ['sgsst-vulnerabilidad'],
  },

  hito1_plan_emergencias: {
    moduleTitle: 'Hito 1 · Plan de Emergencias y Contingencias (PPRE)',
    moduleBadge: 'Hito 1 · Emergencias',
    fieldsLabel: 'Componentes Propios del Plan de Prevención, Preparación y Respuesta ante Emergencias (PPRE)',
    fields: [
      'Sede / Centro de Trabajo, Dirección y Georreferenciación',
      'Descripción de Instalaciones, Número de Pisos y Elementos Constructivos',
      'Carga Ocupacional Fija y Flotante (Trabajadores, Contratistas, Visitantes) y Horarios',
      'Inventario de Recursos Internos de Emergencia (Extintores, Botiquines, Camillas, Gabinetes, DEA)',
      'Sistemas de Detección, Alerta y Alarma (Códigos Sonoros y Lumínicos)',
      'Rutas de Evacuación, Salidas de Emergencia e Iluminación de Emergencia',
      'Punto(s) de Encuentro Principal y Alterno',
      'Estructura del Sistema Comando de Incidentes (SCI) y Comité de Emergencias',
      'Organización de la Brigada de Emergencias (Evacuación, Primeros Auxilios, Contraincendios)',
      'Procedimiento Operativo Normalizado (PON) — Sismo / Terremoto',
      'Procedimiento Operativo Normalizado (PON) — Incendio o Explosión',
      'Procedimiento Operativo Normalizado (PON) — Evacuación General y Médica',
      'Procedimiento Operativo Normalizado (PON) — Derrame Químico o Fuga de Gas',
      'Procedimiento Operativo Normalizado (PON) — Amenaza de Orden Público / Robo / Asonada',
      'Plan de Evacuación Médica (MEDEVAC) y Cadena de Llamadas',
      'Directorio de Entidades de Socorro Externas y Centros Hospitalarios Cercanos',
      'Plan de Ayuda Mutua Empresarial (PAM) y Continuidad del Negocio',
    ],
    quickCombos: [
      {
        label: '⚡ PONs Operativos + Rutas de Evacuación + Puntos de Encuentro',
        description: 'Extrae los protocolos de respuesta inmediata y evacuación de la sede',
        fields: [
          'Sede / Centro de Trabajo, Dirección y Georreferenciación',
          'Rutas de Evacuación, Salidas de Emergencia e Iluminación de Emergencia',
          'Punto(s) de Encuentro Principal y Alterno',
          'Procedimiento Operativo Normalizado (PON) — Sismo / Terremoto',
          'Procedimiento Operativo Normalizado (PON) — Incendio o Explosión',
          'Procedimiento Operativo Normalizado (PON) — Evacuación General y Médica',
        ],
      },
      {
        label: '⚡ MEDEVAC, Centros Hospitalarios y Directorio de Emergencias',
        description: 'Protocolo médico de urgencias y traslado asistencial',
        fields: [
          'Plan de Evacuación Médica (MEDEVAC) y Cadena de Llamadas',
          'Directorio de Entidades de Socorro Externas y Centros Hospitalarios Cercanos',
          'Estructura del Sistema Comando de Incidentes (SCI) y Comité de Emergencias',
          'Organización de la Brigada de Emergencias (Evacuación, Primeros Auxilios, Contraincendios)',
        ],
      },
      {
        label: '⚡ Carga Ocupacional, Recursos de Emergencia y Sistemas de Alarma',
        description: 'Caracterización técnica de la sede para inspecciones y simulacros',
        fields: [
          'Sede / Centro de Trabajo, Dirección y Georreferenciación',
          'Carga Ocupacional Fija y Flotante (Trabajadores, Contratistas, Visitantes) y Horarios',
          'Inventario de Recursos Internos de Emergencia (Extintores, Botiquines, Camillas, Gabinetes, DEA)',
          'Sistemas de Detección, Alerta y Alarma (Códigos Sonoros y Lumínicos)',
        ],
      },
    ],
    reportTags: ['sgsst-plan-emergencias'],
  },

  // ═══ HITO 2: HUELLA BIOCÉNTRICA (4 APLICATIVOS) ═══
  hito2_perfiles_cargo: {
    moduleTitle: 'Hito 2 · Perfiles de Cargo y Profesiograma',
    moduleBadge: 'Hito 2 · Biocéntrica',
    fieldsLabel: 'Campos Propios de Perfiles de Cargo, Exigencias Biomecánicas y Profesiograma',
    fields: [
      'Nombre del Cargo / Rol',
      'Código del Cargo y Nivel Jerárquico',
      'Área / Proceso y Sede',
      'Cargo del Jefe Inmediato',
      'Objetivo General / Misión del Cargo',
      'Funciones Esenciales y Responsabilidades Operativas',
      'Responsabilidades Específicas en el SG-SST (Dec. 1072 Art. 2.2.4.6.8)',
      'Autoridad y Rendición de Cuentas en SST',
      'Nivel Educativo y Título Requerido',
      'Experiencia Mínima y Competencias Técnicas',
      'Capacitaciones e Inducciones SST Obligatorias del Cargo',
      'Certificaciones Especiales Exigidas (Trabajo en Alturas, Espacios Confinados, Seguridad Vial, Manipulación de Alimentos, RETIE)',
      'Peligros y Riesgos Críticos Expuestos en el Cargo (Vínculo GTC-45)',
      'Exigencias Biomecánicas y Posturales del Cargo (Bipedestación, Sedestación, Cargas)',
      'Profesiograma: Exámenes Médicos de Ingreso',
      'Profesiograma: Exámenes Médicos Periódicos y Periodicidad',
      'Profesiograma: Exámenes Médicos de Egreso y Especiales (Alturas / Conducción)',
      'Pruebas Complementarias / Paraclínicos (Audiometría, Visiometría, Espirometría, Laboratorio)',
      'Restricciones o Contraindicaciones Médicas Absolutas y Relativas del Cargo',
      'Matriz de Elementos de Protección Personal (EPP) Obligatorios del Cargo',
    ],
    quickCombos: [
      {
        label: '⚡ Cargo + Profesiograma Completo (Ingreso/Periódico) + EPP',
        description: 'Cruza los exámenes médicos exigidos y la dotación de EPP por cada cargo',
        fields: [
          'Nombre del Cargo / Rol',
          'Área / Proceso y Sede',
          'Profesiograma: Exámenes Médicos de Ingreso',
          'Profesiograma: Exámenes Médicos Periódicos y Periodicidad',
          'Pruebas Complementarias / Paraclínicos (Audiometría, Visiometría, Espirometría, Laboratorio)',
          'Matriz de Elementos de Protección Personal (EPP) Obligatorios del Cargo',
        ],
      },
      {
        label: '⚡ Cargo + Funciones + Responsabilidades SST + Certificaciones',
        description: 'Para cartas de asignación de responsabilidades SST e inducción de ingreso',
        fields: [
          'Nombre del Cargo / Rol',
          'Objetivo General / Misión del Cargo',
          'Funciones Esenciales y Responsabilidades Operativas',
          'Responsabilidades Específicas en el SG-SST (Dec. 1072 Art. 2.2.4.6.8)',
          'Certificaciones Especiales Exigidas (Trabajo en Alturas, Espacios Confinados, Seguridad Vial, Manipulación de Alimentos, RETIE)',
        ],
      },
      {
        label: '⚡ Exigencias Biomecánicas, Peligros Expuestos y Contraindicaciones',
        description: 'Ideal para evaluar compatibilidad cargo-persona y reubicaciones',
        fields: [
          'Nombre del Cargo / Rol',
          'Peligros y Riesgos Críticos Expuestos en el Cargo (Vínculo GTC-45)',
          'Exigencias Biomecánicas y Posturales del Cargo (Bipedestación, Sedestación, Cargas)',
          'Restricciones o Contraindicaciones Médicas Absolutas y Relativas del Cargo',
        ],
      },
    ],
    reportTags: ['sgsst-perfil-cargo'],
  },

  hito2_perfil_socio: {
    moduleTitle: 'Hito 2 · Perfil Sociodemográfico y Expedientes de Trabajadores',
    moduleBadge: 'Hito 2 · Biocéntrica',
    fieldsLabel: 'Lista Completa de Campos del Perfil Sociodemográfico (Elige solo los que necesites para no saturar)',
    fields: [
      'Cédula / Documento',
      'Nombre Completo',
      'Cargo',
      'Edad',
      'Género',
      'Estado Civil',
      'Nivel de Escolaridad',
      'Fecha de Nacimiento',
      'Correo Electrónico',
      'Teléfono / Celular',
      'Dirección y Municipio',
      'Tipo de Vivienda',
      'Estrato Socioeconómico',
      'Personas a Cargo',
      'Contacto de Emergencia',
      'Grupo Sanguíneo y RH',
      'Estado Laboral (Activo / Retirado)',
      'Área / Proceso',
      'Sede / Centro de Trabajo',
      'Tipo de Contrato',
      'Fecha de Ingreso',
      'Antigüedad',
      'Rango Salarial / IBC',
      'EPS',
      'ARL',
      'AFP (Fondo de Pensiones)',
      'Caja de Compensación',
      'Hábito de Deporte',
      'Consumo de Tabaco / Alcohol',
      'Puntaje FIT Biocéntrico (%)',
      'Tarjetas Preventivas / Alertas FIT',
      'Concepto de Aptitud Médica',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Cédula y Nombre Completo',
        description: 'Extrae únicamente Cédula y Nombre Completo para cruces rápidos sin saturar el flujo',
        fields: ['Cédula / Documento', 'Nombre Completo'],
      },
      {
        label: '⚡ Certificados de Afiliación (Cédula, Nombre, EPS, ARL y AFP)',
        description: 'Directo para auditar certificados de afiliación a seguridad social por número de cédula',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'EPS',
          'ARL',
          'AFP (Fondo de Pensiones)',
          'Caja de Compensación',
        ],
      },
      {
        label: '⚡ Cédula, Nombre, Cargo y Edad',
        description: 'Identificación básica operativa del trabajador con cargo, edad y fecha de ingreso',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'Edad',
          'Fecha de Ingreso',
        ],
      },
      {
        label: '⚡ Tarjeta de Emergencia (Cédula, Nombre, RH y Contacto)',
        description: 'Ficha rápida de emergencias, grupo sanguíneo RH, contacto, EPS y ARL',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Grupo Sanguíneo y RH',
          'Teléfono / Celular',
          'Contacto de Emergencia',
          'EPS',
          'ARL',
        ],
      },
    ],
    reportTags: ['sgsst-perfil-sociodemografico'],
  },

  hito2_condiciones_salud: {
    moduleTitle: 'Hito 2 · Informe de Condiciones de Salud y Exámenes Médicos (EMO)',
    moduleBadge: 'Hito 2 · Biocéntrica',
    fieldsLabel: 'Lista Completa de Campos de Condiciones de Salud y Exámenes Médicos Ocupacionales (EMO)',
    fields: [
      'Cédula / Documento',
      'Nombre Completo',
      'Cargo',
      'Edad',
      'Grupo Sanguíneo y RH',
      'Concepto de Aptitud Médica',
      'Fecha Último Examen Médico (EMO)',
      'Fecha Próximo Examen Médico',
      'Diagnósticos Clínicos / CIE-10',
      'Enfermedades Preexistentes',
      'Recomendaciones Médicas Vigentes',
      'Restricciones / Limitaciones Biomecánicas',
      'Medicamentos de Consumo Actual',
      'Alergias Químicas / Medicamentosas',
      'Tensión Arterial (PA)',
      'Frecuencia Cardíaca (FC)',
      'Peso (kg)',
      'Talla (cm)',
      'Índice de Masa Corporal (IMC)',
      'Clasificación IMC',
      'Puntaje FIT Biocéntrico (%)',
      'Tarjetas Preventivas / Alertas FIT',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Cédula, Nombre y Concepto de Aptitud EMO',
        description: 'Extrae solo el estado de aptitud médica y fechas de examen sin saturar',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'Concepto de Aptitud Médica',
          'Fecha Último Examen Médico (EMO)',
          'Fecha Próximo Examen Médico',
        ],
      },
      {
        label: '⚡ Restricciones, Recomendaciones y Patologías',
        description: 'Para seguimiento de vigilancia epidemiológica, diagnósticos CIE-10 y restricciones',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'Diagnósticos Clínicos / CIE-10',
          'Enfermedades Preexistentes',
          'Recomendaciones Médicas Vigentes',
          'Restricciones / Limitaciones Biomecánicas',
        ],
      },
      {
        label: '⚡ Signos Vitales, IMC y Biometría Clínica',
        description: 'Extrae tensión arterial, frecuencia cardíaca, peso, talla, IMC y clasificación',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Edad',
          'Tensión Arterial (PA)',
          'Frecuencia Cardíaca (FC)',
          'Peso (kg)',
          'Talla (cm)',
          'Índice de Masa Corporal (IMC)',
          'Clasificación IMC',
        ],
      },
      {
        label: '⚡ Medicamentos, Alergias y Tarjetas Preventivas',
        description: 'Cruza medicamentos de consumo actual, alergias y tarjetas preventivas FIT',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'Medicamentos de Consumo Actual',
          'Alergias Químicas / Medicamentosas',
          'Tarjetas Preventivas / Alertas FIT',
        ],
      },
    ],
    reportTags: ['sgsst-condiciones-salud'],
  },

  hito2_oraculo_predictivo: {
    moduleTitle: 'Hito 2 · Dictamen de Compatibilidad Cargo-Persona (Bio-Individuo)',
    moduleBadge: 'Hito 2 · Compatibilidad Cargo-Persona',
    fieldsLabel: 'Campos, Tarjetas Preventivas, FIT Score y Brechas de «Compatibilidad Cargo-Persona»',
    fields: [
      'Cédula / Documento',
      'Nombre Completo',
      'Cargo',
      'Área / Sede',
      'Puntaje FIT Biocéntrico (%)',
      'Estado de Compatibilidad (Óptimo / Moderado / Crítico)',
      'Brechas de Compatibilidad Cargo-Persona Detectadas',
      'Tarjetas Preventivas / Alertas FIT',
      'Puntaje Percepción del Riesgo (pts)',
      'Factor de Reducción por Cultura (%)',
      'Concepto de Aptitud Médica',
      'Recomendaciones Médicas',
      'Limitaciones Biomecánicas',
      'Enfermedades / Patologías',
      'Medicamentos',
      'Alergias Químicas',
      'Total Riesgos Bio-Individuales',
      'Riesgos Bio-Individuales Críticos/Altos',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula, Nombre, Tarjetas Preventivas, FIT Score y Brechas',
        description: 'Extrae Cédula, Nombre, Cargo, Puntaje FIT, Brechas de Compatibilidad y Tarjetas Preventivas',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'Puntaje FIT Biocéntrico (%)',
          'Brechas de Compatibilidad Cargo-Persona Detectadas',
          'Tarjetas Preventivas / Alertas FIT',
        ],
      },
      {
        label: '⚡ FIT Score %, Compatibilidad y Restricciones por Cargo',
        description: 'Cruza el puntaje FIT % con el estado de compatibilidad, limitaciones y recomendaciones',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'Puntaje FIT Biocéntrico (%)',
          'Estado de Compatibilidad (Óptimo / Moderado / Crítico)',
          'Limitaciones Biomecánicas',
          'Recomendaciones Médicas',
        ],
      },
      {
        label: '⚡ Percepción del Riesgo y Atenuación Cultural',
        description: 'Evalúa puntaje de percepción del riesgo, factor de reducción por cultura y total de riesgos',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'Puntaje Percepción del Riesgo (pts)',
          'Factor de Reducción por Cultura (%)',
          'Total Riesgos Bio-Individuales',
        ],
      },
      {
        label: '⚡ Alertas Clínico-Operativas Críticas',
        description: 'Extrae tarjetas preventivas, patologías, medicamentos, alergias y riesgos bio-individuales críticos',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'Tarjetas Preventivas / Alertas FIT',
          'Enfermedades / Patologías',
          'Medicamentos',
          'Alergias Químicas',
          'Riesgos Bio-Individuales Críticos/Altos',
        ],
      },
    ],
    reportTags: ['sgsst-bio-ipevar', 'sgsst-oraculo-h1', 'sgsst-predictivo-ia'],
  },

  // ═══ HITO 3: COMITÉS, BRIGADAS Y ÓRGANOS DE GOBERNANZA (4 APLICATIVOS) ═══
  hito4_comites: {
    moduleTitle: 'Hito 3 · COPASST / Vigía de SST (Dec. 614 y Res. 2013 de 1986)',
    moduleBadge: 'Hito 3 · Comités',
    fieldsLabel: 'Campos, Actas y Resultados Propios del COPASST / Vigía SST',
    fields: [
      'Modalidad del Órgano (COPASST / Vigía de SST según N° Trabajadores)',
      'Período de Vigencia del Comité (2 Años)',
      'Cédula / Documento del Integrante',
      'Nombre Completo y Cargo del Integrante',
      'Representación (Empleador / Trabajadores)',
      'Calidad del Miembro (Principal / Suplente)',
      'Rol en el Comité (Presidente / Secretario / Integrante)',
      'Certificado Curso Virtual 50 Horas / 20 Horas SG-SST',
      'Acta de Convocatoria, Inscripción de Candidatos y Votación',
      'Acta de Escrutinio y Conformación Oficial del COPASST',
      'Número y Fecha de Acta de Reunión Mensual Ordinaria / Extraordinaria',
      'Verificación de Quórum y Asistencia de Miembros',
      'Revisión de Inspecciones Planeadas de Seguridad',
      'Participación en Investigación de Incidentes y Accidentes ATEL',
      'Seguimiento al Plan de Trabajo Anual y Cronograma de Capacitación',
      'Vigilancia de Entrega y Uso de EPP',
      'Compromisos del Acta, Responsables y Fechas de Cumplimiento',
      'Estado de Compromisos de Actas Anteriores (Abierto / En Gestión / Cerrado)',
      'Firmas Digitales de los Integrantes del COPASST',
    ],
    quickCombos: [
      {
        label: '⚡ Integrantes COPASST (Cédula, Nombre, Rol y Curso 50h)',
        description: 'Nómina oficial de miembros principales y suplentes del COPASST',
        fields: [
          'Cédula / Documento del Integrante',
          'Nombre Completo y Cargo del Integrante',
          'Representación (Empleador / Trabajadores)',
          'Calidad del Miembro (Principal / Suplente)',
          'Rol en el Comité (Presidente / Secretario / Integrante)',
          'Certificado Curso Virtual 50 Horas / 20 Horas SG-SST',
        ],
      },
      {
        label: '⚡ Última Acta Mensual + Compromisos Pendientes + Responsables',
        description: 'Extrae compromisos abiertos del COPASST para seguimiento o correo',
        fields: [
          'Número y Fecha de Acta de Reunión Mensual Ordinaria / Extraordinaria',
          'Verificación de Quórum y Asistencia de Miembros',
          'Compromisos del Acta, Responsables y Fechas de Cumplimiento',
          'Estado de Compromisos de Actas Anteriores (Abierto / En Gestión / Cerrado)',
        ],
      },
      {
        label: '⚡ Seguimiento de Inspecciones, ATEL y Plan Anual en COPASST',
        description: 'Audita las funciones legales del Art. 11 de la Resolución 2013 de 1986',
        fields: [
          'Número y Fecha de Acta de Reunión Mensual Ordinaria / Extraordinaria',
          'Revisión de Inspecciones Planeadas de Seguridad',
          'Participación en Investigación de Incidentes y Accidentes ATEL',
          'Seguimiento al Plan de Trabajo Anual y Cronograma de Capacitación',
          'Vigilancia de Entrega y Uso de EPP',
        ],
      },
      {
        label: '⚡ Actas de Convocatoria, Votación y Conformación Legal',
        description: 'Soportes de elección democrática y vigencia de 2 años para auditoría',
        fields: [
          'Modalidad del Órgano (COPASST / Vigía de SST según N° Trabajadores)',
          'Período de Vigencia del Comité (2 Años)',
          'Acta de Convocatoria, Inscripción de Candidatos y Votación',
          'Acta de Escrutinio y Conformación Oficial del COPASST',
          'Firmas Digitales de los Integrantes del COPASST',
        ],
      },
    ],
    reportTags: ['sgsst-copasst'],
  },

  hito3_cocolab: {
    moduleTitle: 'Hito 3 · Comité de Convivencia Laboral (CCL — Res. 652 y 1356 de 2012)',
    moduleBadge: 'Hito 3 · Convivencia',
    fieldsLabel: 'Campos y Actas Propios del Comité de Convivencia Laboral (CCL)',
    fields: [
      'Período de Vigencia del Comité de Convivencia (2 Años)',
      'Cédula / Documento del Integrante CCL',
      'Nombre Completo y Cargo del Integrante CCL',
      'Representación (Empleador / Trabajadores) y Calidad (Principal / Suplente)',
      'Rol en el CCL (Presidente / Secretario / Miembro)',
      'Competencias Actitudinales y Comportamentales Verificadas',
      'Acta de Convocatoria, Votación y Conformación del CCL',
      'Reglamento Interno de Funcionamiento y Acuerdo de Confidencialidad',
      'Número y Fecha de Acta de Reunión Trimestral Ordinaria / Extraordinaria',
      'Verificación de Quórum y Asistencia',
      'Estadística Confidencial de Quejas Recibidas (Ley 1010 de 2006)',
      'Estado de Casos (En Trámite Conciliatorio / Cerrado con Acuerdo / Remitido a Alta Dirección)',
      'Seguimiento a Compromisos de Convivencia entre las Partes',
      'Planes de Mejora de Clima y Convivencia Laboral',
      'Campañas de Prevención de Acoso Laboral y Buen Trato',
      'Informes Trimestrales y Anuales de Gestión para Alta Dirección',
      'Compromisos del CCL, Responsables y Fechas de Seguimiento',
    ],
    quickCombos: [
      {
        label: '⚡ Integrantes del Comité de Convivencia (Cédula, Nombre y Rol)',
        description: 'Directorio de miembros principales y suplentes del CCL y confidencialidad',
        fields: [
          'Cédula / Documento del Integrante CCL',
          'Nombre Completo y Cargo del Integrante CCL',
          'Representación (Empleador / Trabajadores) y Calidad (Principal / Suplente)',
          'Rol en el CCL (Presidente / Secretario / Miembro)',
          'Reglamento Interno de Funcionamiento y Acuerdo de Confidencialidad',
        ],
      },
      {
        label: '⚡ Actas Trimestrales CCL + Compromisos de Convivencia',
        description: 'Extrae los acuerdos y planes preventivos del Comité de Convivencia',
        fields: [
          'Número y Fecha de Acta de Reunión Trimestral Ordinaria / Extraordinaria',
          'Verificación de Quórum y Asistencia',
          'Planes de Mejora de Clima y Convivencia Laboral',
          'Compromisos del CCL, Responsables y Fechas de Seguimiento',
        ],
      },
      {
        label: '⚡ Estadística de Casos Ley 1010 (Reserva Legal) y Seguimiento',
        description: 'Indicadores estadísticos anonimizados de quejas y acuerdos conciliatorios',
        fields: [
          'Estadística Confidencial de Quejas Recibidas (Ley 1010 de 2006)',
          'Estado de Casos (En Trámite Conciliatorio / Cerrado con Acuerdo / Remitido a Alta Dirección)',
          'Seguimiento a Compromisos de Convivencia entre las Partes',
          'Informes Trimestrales y Anuales de Gestión para Alta Dirección',
        ],
      },
      {
        label: '⚡ Campañas de Buen Trato y Prevención de Acoso Laboral',
        description: 'Actividades preventivas de clima laboral articuladas con el Hito 4 y 6',
        fields: [
          'Campañas de Prevención de Acoso Laboral y Buen Trato',
          'Planes de Mejora de Clima y Convivencia Laboral',
          'Compromisos del CCL, Responsables y Fechas de Seguimiento',
        ],
      },
    ],
    reportTags: ['sgsst-convivencia'],
  },

  hito3_comite_pesv: {
    moduleTitle: 'Hito 3 · Comité de Seguridad Vial (CSV - PESV Res. 40595)',
    moduleBadge: 'Hito 3 · Comité Vial',
    fieldsLabel: 'Campos y Actas Propios del Comité de Seguridad Vial (CSV)',
    fields: [
      'Nivel de Diseño e Implementación del PESV (Básico / Estándar / Avanzado)',
      'Acto Administrativo de Designación del Líder del PESV y del CSV',
      'Cédula / Documento del Integrante del CSV',
      'Nombre Completo, Cargo y Rol en el Comité Vial',
      'Número y Fecha de Acta de Reunión Trimestral del CSV',
      'Verificación de Quórum y Asistencia del CSV',
      'Análisis de Indicadores de Siniestralidad Vial (Tasa, Costos, Severidad)',
      'Seguimiento a Comparendos, Infracciones de Tránsito y Excesos de Velocidad',
      'Resultados de Inspecciones Preoperacionales Diarias y Mantenimiento de Flota',
      'Estado de Vencimientos de SOAT, Revisión Técnico-Mecánica y Licencias',
      'Avance del Programa de Capacitación en Seguridad Vial por Actor Vial',
      'Investigación y Lecciones Aprendidas de Siniestros e Incidentes Viales',
      'Auditoría de Rutas Críticas, Fatiga y Alcoholimetría',
      'Presupuesto y Recursos Ejecutados del PESV',
      'Compromisos Viales del CSV, Responsables y Fechas Límite',
      'Estado de Compromisos Viales Anteriores (Abierto / En Gestión / Cerrado)',
    ],
    quickCombos: [
      {
        label: '⚡ Integrantes del Comité Vial y Líder del PESV (Cédula, Nombre y Rol)',
        description: 'Conformación oficial de la gobernanza vial (Paso 1 y 2 Res. 40595)',
        fields: [
          'Nivel de Diseño e Implementación del PESV (Básico / Estándar / Avanzado)',
          'Acto Administrativo de Designación del Líder del PESV y del CSV',
          'Cédula / Documento del Integrante del CSV',
          'Nombre Completo, Cargo y Rol en el Comité Vial',
        ],
      },
      {
        label: '⚡ Indicadores PESV + Siniestralidad + Compromisos del Comité Vial',
        description: 'Síntesis ejecutiva trimestral de seguridad vial',
        fields: [
          'Número y Fecha de Acta de Reunión Trimestral del CSV',
          'Análisis de Indicadores de Siniestralidad Vial (Tasa, Costos, Severidad)',
          'Compromisos Viales del CSV, Responsables y Fechas Límite',
          'Estado de Compromisos Viales Anteriores (Abierto / En Gestión / Cerrado)',
        ],
      },
      {
        label: '⚡ Control de Flota, Preoperacionales, SOAT/RTM e Infracciones',
        description: 'Seguimiento operativo de vehículos y comportamiento de conductores',
        fields: [
          'Seguimiento a Comparendos, Infracciones de Tránsito y Excesos de Velocidad',
          'Resultados de Inspecciones Preoperacionales Diarias y Mantenimiento de Flota',
          'Estado de Vencimientos de SOAT, Revisión Técnico-Mecánica y Licencias',
          'Auditoría de Rutas Críticas, Fatiga y Alcoholimetría',
        ],
      },
      {
        label: '⚡ Investigación de Siniestros Viales y Capacitación por Actor Vial',
        description: 'Cierre de brechas de formación vial y lecciones aprendidas',
        fields: [
          'Avance del Programa de Capacitación en Seguridad Vial por Actor Vial',
          'Investigación y Lecciones Aprendidas de Siniestros e Incidentes Viales',
          'Compromisos Viales del CSV, Responsables y Fechas Límite',
        ],
      },
    ],
    reportTags: ['sgsst-comite-pesv'],
  },

  hito3_brigada_emergencias: {
    moduleTitle: 'Hito 3 · Brigada de Emergencias & Comité de Crisis (SCI)',
    moduleBadge: 'Hito 3 · Brigada SCI',
    fieldsLabel: 'Campos Propios de la Brigada de Emergencias y Sistema Comando de Incidentes',
    fields: [
      'Cédula / Documento del Brigadista',
      'Nombre Completo del Brigadista',
      'Cargo, Área y Sede / Centro de Trabajo',
      'Teléfono / Celular de Contacto Inmediato y Grupo Sanguíneo RH',
      'Unidad Operativa Asignada (Primeros Auxilios / Control de Incendios / Evacuación y Rescate)',
      'Rol en el Sistema Comando de Incidentes SCI (Comandante, Oficial de Seguridad, Enlace, Información Pública, Operaciones, Logística)',
      'Nivel de Formación de Brigadista (Básica / Intermedia / Especializada)',
      'Certificaciones Vigentes (RCP/DEA, Manejo de Extintores, Rescate Vertical, MATPEL, SCI)',
      'Aptitud Médica para Brigadista y Fecha de Último EMO',
      'Turno / Horario de Cobertura en Planta o Sede',
      'Dotación Personal Entregada (Chaleco, Brazalete, Casco, Guantes, Linterna, Silbato, Radio)',
      'Líderes de Evacuación por Piso / Área y Punto de Encuentro Asignado',
      'Participación en Simulacros y Prácticas Operativas',
      'Inventario y Estado de Equipos de Respuesta Asignados a la Unidad',
      'Plan de Entrenamiento Anual de la Brigada y Compromisos',
      'Directorio de Cadena de Llamadas del Comité de Crisis',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre de Brigadistas + Unidad Asignada + RH y Teléfono',
        description: 'Extrae el directorio operativo de brigadistas por sede y especialidad',
        fields: [
          'Cédula / Documento del Brigadista',
          'Nombre Completo del Brigadista',
          'Cargo, Área y Sede / Centro de Trabajo',
          'Teléfono / Celular de Contacto Inmediato y Grupo Sanguíneo RH',
          'Unidad Operativa Asignada (Primeros Auxilios / Control de Incendios / Evacuación y Rescate)',
        ],
      },
      {
        label: '⚡ Organigrama SCI (Comandante, Oficiales y Cadena de Llamadas)',
        description: 'Estructura de mando del Comité de Crisis y líderes de evacuación',
        fields: [
          'Nombre Completo del Brigadista',
          'Rol en el Sistema Comando de Incidentes SCI (Comandante, Oficial de Seguridad, Enlace, Información Pública, Operaciones, Logística)',
          'Líderes de Evacuación por Piso / Área y Punto de Encuentro Asignado',
          'Directorio de Cadena de Llamadas del Comité de Crisis',
        ],
      },
      {
        label: '⚡ Certificaciones Vigentes, Aptitud Médica y Entrenamiento',
        description: 'Audita la idoneidad médica y técnica de los brigadistas activos',
        fields: [
          'Cédula / Documento del Brigadista',
          'Nombre Completo del Brigadista',
          'Nivel de Formación de Brigadista (Básica / Intermedia / Especializada)',
          'Certificaciones Vigentes (RCP/DEA, Manejo de Extintores, Rescate Vertical, MATPEL, SCI)',
          'Aptitud Médica para Brigadista y Fecha de Último EMO',
          'Plan de Entrenamiento Anual de la Brigada y Compromisos',
        ],
      },
      {
        label: '⚡ Dotación Personal e Inventario de Equipos de la Brigada',
        description: 'Verifica la entrega de distintivos, radios y kits de respuesta',
        fields: [
          'Nombre Completo del Brigadista',
          'Unidad Operativa Asignada (Primeros Auxilios / Control de Incendios / Evacuación y Rescate)',
          'Dotación Personal Entregada (Chaleco, Brazalete, Casco, Guantes, Linterna, Silbato, Radio)',
          'Inventario y Estado de Equipos de Respuesta Asignados a la Unidad',
        ],
      },
    ],
    reportTags: ['sgsst-brigada-emergencias'],
  },

  // ═══ HITO 4: EVALUACIÓN DINÁMICA DE RIESGOS (4 APLICATIVOS) ═══
  hito4_bio_ipevar: {
    moduleTitle: 'Hito 4 · Matriz Bio-IPEVR (Evaluación Individual por Trabajador)',
    moduleBadge: 'Hito 4 · Evaluación',
    fieldsLabel: 'Campos Propios de la Matriz Bio-IPEVR Individual',
    fields: [
      'Cédula / Documento del Trabajador',
      'Nombre Completo del Trabajador',
      'Cargo, Proceso y Sede / Centro de Trabajo',
      'Edad, Género y Antigüedad en el Cargo',
      'Puntaje FIT Biocéntrico Individual (%)',
      'Peligro Identificado en el Puesto Individual (Clasificación y Descripción)',
      'Fuente Generadora y Tiempo de Exposición Diaria (Horas)',
      'Efectos Posibles Cruzados con Condiciones de Salud Preexistentes',
      'Sintomatología Osteomuscular, Visual o Auditiva Reportada',
      'Restricciones y Recomendaciones Médicas Activas del Trabajador',
      'Controles Actuales en Fuente, Medio e Individuo (EPP Asignado)',
      'Nivel de Deficiencia (ND), Exposición (NE) y Probabilidad (NP) Bio-Ajustados',
      'Nivel de Consecuencia (NC) Amplificado por Vulnerabilidad Clínica',
      'Puntaje Nivel de Riesgo Bio-Individual (NR) e Interpretación (I a IV)',
      'Factor de Atenuación por Percepción del Riesgo y Cultura (%)',
      'Aceptabilidad del Riesgo para este Trabajador Específico',
      'Controles Personalizados de Ingeniería, Administrativos y Reubicación / Ajuste',
      'Programa de Vigilancia Epidemiológica (PVE) Asignado',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + Peligros Bio-Individuales Críticos + Controles',
        description: 'Extrae la matriz de peligros personalizada por colaborador',
        fields: [
          'Cédula / Documento del Trabajador',
          'Nombre Completo del Trabajador',
          'Cargo, Proceso y Sede / Centro de Trabajo',
          'Peligro Identificado en el Puesto Individual (Clasificación y Descripción)',
          'Puntaje Nivel de Riesgo Bio-Individual (NR) e Interpretación (I a IV)',
          'Controles Personalizados de Ingeniería, Administrativos y Reubicación / Ajuste',
        ],
      },
      {
        label: '⚡ Cruce Clínico: Patologías, Sintomatología y Nivel de Riesgo Amplificado',
        description: 'Identifica colaboradores cuya condición de salud agrava el peligro del cargo',
        fields: [
          'Cédula / Documento del Trabajador',
          'Nombre Completo del Trabajador',
          'Efectos Posibles Cruzados con Condiciones de Salud Preexistentes',
          'Sintomatología Osteomuscular, Visual o Auditiva Reportada',
          'Restricciones y Recomendaciones Médicas Activas del Trabajador',
          'Nivel de Consecuencia (NC) Amplificado por Vulnerabilidad Clínica',
        ],
      },
      {
        label: '⚡ Valoración Matemática Bio-GTC45 (ND, NE, NP, NC, NR y Atenuación)',
        description: 'Detalle numérico del cálculo biocéntrico e inclusión en PVE',
        fields: [
          'Cédula / Documento del Trabajador',
          'Nombre Completo del Trabajador',
          'Puntaje FIT Biocéntrico Individual (%)',
          'Nivel de Deficiencia (ND), Exposición (NE) y Probabilidad (NP) Bio-Ajustados',
          'Puntaje Nivel de Riesgo Bio-Individual (NR) e Interpretación (I a IV)',
          'Factor de Atenuación por Percepción del Riesgo y Cultura (%)',
          'Programa de Vigilancia Epidemiológica (PVE) Asignado',
        ],
      },
      {
        label: '⚡ Controles Personalizados, EPP y Ajustes Razonables por Trabajador',
        description: 'Plan de intervención individual en fuente, medio y persona',
        fields: [
          'Cédula / Documento del Trabajador',
          'Nombre Completo del Trabajador',
          'Cargo, Proceso y Sede / Centro de Trabajo',
          'Controles Actuales en Fuente, Medio e Individuo (EPP Asignado)',
          'Controles Personalizados de Ingeniería, Administrativos y Reubicación / Ajuste',
        ],
      },
    ],
    reportTags: ['sgsst-bio-ipevar', 'sgsst-matriz-peligros'],
  },

  hito3_owas: {
    moduleTitle: 'Hito 4 · Método OWAS (Evaluación Ergonómica Postural)',
    moduleBadge: 'Hito 4 · Ergonomía OWAS',
    fieldsLabel: 'Campos, Códigos Posturales y Resultados Propios del Método OWAS',
    fields: [
      'Cédula / Documento del Trabajador Evaluado',
      'Nombre Completo del Trabajador Evaluado',
      'Cargo, Área / Proceso y Sede',
      'Fecha de Evaluación y Evaluador SST / Ergónomo',
      'Tarea / Actividad Operativa y Fase de Trabajo Analizada',
      'Duración del Ciclo de Trabajo y Frecuencia de Muestreo',
      'Código de Posición de Espalda (1 Recta, 2 Inclinada, 3 Con Giro, 4 Inclinada con Giro)',
      'Código de Posición de Brazos (1 Ambos Abajo, 2 Uno Arriba, 3 Ambos Arriba del Hombro)',
      'Código de Posición de Piernas (1 Sentado, 2 De Pie, 3 Una Pierna, 4-5 Flexionadas, 6 Arrodillado, 7 Caminando)',
      'Código de Carga o Fuerza Manipulada (1 ≤10 kg, 2 Entre 10-20 kg, 3 >20 kg)',
      'Código Postural OWAS de 4 Dígitos',
      'Categoría de Riesgo OWAS (Nivel 1 Normal / Nivel 2 Leve / Nivel 3 Dañino / Nivel 4 Urgente)',
      'Frecuencia Relativa de Posturas por Segmento Corporal (%)',
      'Diagnósticos o Molestias Osteomusculares Asociadas del Trabajador',
      'Recomendaciones Ergonómicas de Ingeniería y Rediseño de Puesto',
      'Controles Administrativos, Pausas Activas e Higiene Postural',
      'Prioridad de Intervención (Inmediata / Corto Plazo / Seguimiento)',
    ],
    quickCombos: [
      {
        label: '⚡ Trabajador (Cédula/Nombre) + Código OWAS + Categoría de Riesgo (1-4)',
        description: 'Extrae solo los resultados posturales críticos y nivel de acción ergonómica',
        fields: [
          'Cédula / Documento del Trabajador Evaluado',
          'Nombre Completo del Trabajador Evaluado',
          'Cargo, Área / Proceso y Sede',
          'Tarea / Actividad Operativa y Fase de Trabajo Analizada',
          'Código Postural OWAS de 4 Dígitos',
          'Categoría de Riesgo OWAS (Nivel 1 Normal / Nivel 2 Leve / Nivel 3 Dañino / Nivel 4 Urgente)',
        ],
      },
      {
        label: '⚡ Desglose Biomecánico (Espalda, Brazos, Piernas y Carga Manipulada)',
        description: 'Detalle técnico de los 4 dígitos posturales y frecuencias relativas',
        fields: [
          'Nombre Completo del Trabajador Evaluado',
          'Tarea / Actividad Operativa y Fase de Trabajo Analizada',
          'Código de Posición de Espalda (1 Recta, 2 Inclinada, 3 Con Giro, 4 Inclinada con Giro)',
          'Código de Posición de Brazos (1 Ambos Abajo, 2 Uno Arriba, 3 Ambos Arriba del Hombro)',
          'Código de Posición de Piernas (1 Sentado, 2 De Pie, 3 Una Pierna, 4-5 Flexionadas, 6 Arrodillado, 7 Caminando)',
          'Código de Carga o Fuerza Manipulada (1 ≤10 kg, 2 Entre 10-20 kg, 3 >20 kg)',
          'Frecuencia Relativa de Posturas por Segmento Corporal (%)',
        ],
      },
      {
        label: '⚡ Posturas Nivel 3 y 4 (Dañino/Urgente) + Rediseño de Puesto',
        description: 'Filtra hallazgos ergonómicos severos y medidas correctivas inmediatas',
        fields: [
          'Cédula / Documento del Trabajador Evaluado',
          'Nombre Completo del Trabajador Evaluado',
          'Categoría de Riesgo OWAS (Nivel 1 Normal / Nivel 2 Leve / Nivel 3 Dañino / Nivel 4 Urgente)',
          'Recomendaciones Ergonómicas de Ingeniería y Rediseño de Puesto',
          'Prioridad de Intervención (Inmediata / Corto Plazo / Seguimiento)',
        ],
      },
      {
        label: '⚡ Cruce OWAS con Molestias Osteomusculares y Pausas Activas',
        description: 'Conecta el riesgo postural con el PVE osteomuscular del trabajador',
        fields: [
          'Cédula / Documento del Trabajador Evaluado',
          'Nombre Completo del Trabajador Evaluado',
          'Diagnósticos o Molestias Osteomusculares Asociadas del Trabajador',
          'Categoría de Riesgo OWAS (Nivel 1 Normal / Nivel 2 Leve / Nivel 3 Dañino / Nivel 4 Urgente)',
          'Controles Administrativos, Pausas Activas e Higiene Postural',
        ],
      },
    ],
    reportTags: ['sgsst-owas'],
  },

  hito3_estudio_puesto: {
    moduleTitle: 'Hito 4 · Estudio de Puesto de Trabajo (EPT Biomecánico)',
    moduleBadge: 'Hito 4 · Estudio Puesto',
    fieldsLabel: 'Campos y Resultados Propios del Estudio de Puesto de Trabajo (EPT)',
    fields: [
      'Cédula / Documento del Trabajador Evaluado',
      'Nombre Completo del Trabajador Evaluado',
      'Edad, Género, Dominancia Lateral y Antigüedad en el Cargo',
      'Cargo, Área / Proceso, Sede y Turno / Jornada Laboral',
      'EPS, ARL y AFP del Trabajador',
      'Motivo del Estudio (Calificación de Origen, Reintegro Laboral, Seguimiento a Recomendaciones, Preventivo)',
      'Diagnóstico Clínico Asociado (Código CIE-10 y Descripción)',
      'Restricciones y Recomendaciones Médicas Vigentes',
      'Descripción del Proceso Productivo y Tareas Principales / Secundarias',
      'Dimensiones del Puesto, Mobiliario, Silla, Superficie de Trabajo y Ayudas Mecánicas',
      'Demandas Biomecánicas: Posturas Prolongadas, Forzadas y Antigravitacionales',
      'Demandas Biomecánicas: Movimientos Repetitivos de Miembros Superiores',
      'Demandas Biomecánicas: Manipulación Manual de Cargas (Peso, Frecuencia, Agarre)',
      'Condiciones Ambientales del Puesto (Iluminación, Ruido, Confort Térmico, Vibración)',
      'Factores Organizacionales (Pausas, Ritmo de Trabajo, Autonomía)',
      'Compatibilidad entre Exigencias del Cargo y Capacidad Funcional del Trabajador',
      'Concepto Ergonómico Final (Compatible / Compatible con Modificaciones / No Compatible)',
      'Plan de Intervención, Ajustes Razonables, Responsables y Fechas',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + Diagnóstico CIE-10 + Demandas Biomecánicas + Ajustes',
        description: 'Síntesis del EPT para ARL, EPS, Junta de Calificación o reubicación laboral',
        fields: [
          'Cédula / Documento del Trabajador Evaluado',
          'Nombre Completo del Trabajador Evaluado',
          'Cargo, Área / Proceso, Sede y Turno / Jornada Laboral',
          'Diagnóstico Clínico Asociado (Código CIE-10 y Descripción)',
          'Concepto Ergonómico Final (Compatible / Compatible con Modificaciones / No Compatible)',
          'Plan de Intervención, Ajustes Razonables, Responsables y Fechas',
        ],
      },
      {
        label: '⚡ Evaluación de Posturas, Repetitividad y Manipulación de Cargas',
        description: 'Detalle biomecánico completo por segmento corporal y mobiliario',
        fields: [
          'Nombre Completo del Trabajador Evaluado',
          'Cargo, Área / Proceso, Sede y Turno / Jornada Laboral',
          'Dimensiones del Puesto, Mobiliario, Silla, Superficie de Trabajo y Ayudas Mecánicas',
          'Demandas Biomecánicas: Posturas Prolongadas, Forzadas y Antigravitacionales',
          'Demandas Biomecánicas: Movimientos Repetitivos de Miembros Superiores',
          'Demandas Biomecánicas: Manipulación Manual de Cargas (Peso, Frecuencia, Agarre)',
        ],
      },
      {
        label: '⚡ Seguimiento a Reintegro Laboral y Restricciones Médicas',
        description: 'Verifica la compatibilidad del puesto frente a las restricciones del EMO',
        fields: [
          'Cédula / Documento del Trabajador Evaluado',
          'Nombre Completo del Trabajador Evaluado',
          'Motivo del Estudio (Calificación de Origen, Reintegro Laboral, Seguimiento a Recomendaciones, Preventivo)',
          'Restricciones y Recomendaciones Médicas Vigentes',
          'Compatibilidad entre Exigencias del Cargo y Capacidad Funcional del Trabajador',
          'Concepto Ergonómico Final (Compatible / Compatible con Modificaciones / No Compatible)',
        ],
      },
      {
        label: '⚡ Condiciones Ambientales, Organizacionales y Plan de Intervención',
        description: 'Iluminación, ruido, confort térmico, pausas y mejoras de ingeniería',
        fields: [
          'Nombre Completo del Trabajador Evaluado',
          'Cargo, Área / Proceso, Sede y Turno / Jornada Laboral',
          'Condiciones Ambientales del Puesto (Iluminación, Ruido, Confort Térmico, Vibración)',
          'Factores Organizacionales (Pausas, Ritmo de Trabajo, Autonomía)',
          'Plan de Intervención, Ajustes Razonables, Responsables y Fechas',
        ],
      },
    ],
    reportTags: ['sgsst-owas'],
  },

  hito4_psicosocial: {
    moduleTitle: 'Hito 4 · Termómetro Psicosocial y Clima Emocional (Res. 2764)',
    moduleBadge: 'Hito 4 · Psicosocial',
    fieldsLabel: 'Indicadores y Resultados Propios del Termómetro Psicosocial',
    fields: [
      'Índice Global de Bienestar y Clima Emocional (%)',
      'Nivel de Riesgo Psicosocial Global (Sin Riesgo / Bajo / Medio / Alto / Muy Alto)',
      'Total de Reportes Emocionales y Cobertura de Participación (%)',
      'Distribución de Estados de Ánimo (Motivado, Tranquilo, Cansado, Estresado, Agotado)',
      'Áreas / Procesos con Mayor Nivel de Estrés, Fatiga o Carga Mental',
      'Dominio Intralaboral: Liderazgo y Relaciones Sociales en el Trabajo',
      'Dominio Intralaboral: Control sobre el Trabajo y Claridad de Rol',
      'Dominio Intralaboral: Demandas del Trabajo (Cuantitativas, Carga Mental, Emocionales, Jornada)',
      'Dominio Intralaboral: Recompensas y Reconocimiento',
      'Factores Extralaborales (Tiempo Fuera del Trabajo, Desplazamiento, Red de Apoyo)',
      'Sintomatología Asociada al Estrés y Alertas Tempranas de Burnout',
      'Cruce con Ausentismo, Rotación de Personal y Quejas de Convivencia',
      'Periodicidad Aplicable de Batería Psicosocial (Anual en Riesgo Alto / Bienal en Medio-Bajo)',
      'Actividades del Programa de Vigilancia Epidemiológica (PVE) Psicosocial',
      'Recomendaciones para el Comité de Convivencia Laboral (CCL) y Liderazgo',
      'Plan de Intervención Psicosocial, Responsables y Fechas de Seguimiento',
    ],
    quickCombos: [
      {
        label: '⚡ Índice de Bienestar + Áreas Críticas + Alertas Burnout + Plan de Intervención',
        description: 'Resumen psicosocial ejecutivo respetando la reserva legal (Res. 2764)',
        fields: [
          'Índice Global de Bienestar y Clima Emocional (%)',
          'Nivel de Riesgo Psicosocial Global (Sin Riesgo / Bajo / Medio / Alto / Muy Alto)',
          'Áreas / Procesos con Mayor Nivel de Estrés, Fatiga o Carga Mental',
          'Sintomatología Asociada al Estrés y Alertas Tempranas de Burnout',
          'Plan de Intervención Psicosocial, Responsables y Fechas de Seguimiento',
        ],
      },
      {
        label: '⚡ Los 4 Dominios Intralaborales y Factores Extralaborales (Res. 2764)',
        description: 'Diagnóstico estructurado según la Batería del Ministerio del Trabajo',
        fields: [
          'Dominio Intralaboral: Liderazgo y Relaciones Sociales en el Trabajo',
          'Dominio Intralaboral: Control sobre el Trabajo y Claridad de Rol',
          'Dominio Intralaboral: Demandas del Trabajo (Cuantitativas, Carga Mental, Emocionales, Jornada)',
          'Dominio Intralaboral: Recompensas y Reconocimiento',
          'Factores Extralaborales (Tiempo Fuera del Trabajo, Desplazamiento, Red de Apoyo)',
        ],
      },
      {
        label: '⚡ Distribución Emocional y Cruce con Ausentismo / Convivencia (CCL)',
        description: 'Insumos estratégicos para el Comité de Convivencia Laboral y Talento Humano',
        fields: [
          'Distribución de Estados de Ánimo (Motivado, Tranquilo, Cansado, Estresado, Agotado)',
          'Cruce con Ausentismo, Rotación de Personal y Quejas de Convivencia',
          'Recomendaciones para el Comité de Convivencia Laboral (CCL) y Liderazgo',
        ],
      },
      {
        label: '⚡ PVE Psicosocial, Periodicidad de Batería y Cronograma de Bienestar',
        description: 'Plan de vigilancia epidemiológica psicosocial y seguimiento',
        fields: [
          'Nivel de Riesgo Psicosocial Global (Sin Riesgo / Bajo / Medio / Alto / Muy Alto)',
          'Periodicidad Aplicable de Batería Psicosocial (Anual en Riesgo Alto / Bienal en Medio-Bajo)',
          'Actividades del Programa de Vigilancia Epidemiológica (PVE) Psicosocial',
          'Plan de Intervención Psicosocial, Responsables y Fechas de Seguimiento',
        ],
      },
    ],
    reportTags: ['sgsst-animo', 'sgsst-termometro-psicosocial'],
  },

  // ═══ HITO 5: DINÁMICA OPERATIVA Y TERRENO (10 APLICATIVOS) ═══
  hito5_compras_sst: {
    moduleTitle: 'Hito 5 · Compras y Adquisiciones con Criterio SST (Art. 2.2.4.6.27)',
    moduleBadge: 'Hito 5 · Terreno',
    fieldsLabel: 'Campos Propios de Compras y Adquisiciones en SST',
    fields: [
      'Código / ID de la Requisición o Ficha Técnica de Compra',
      'Bien, Producto, Maquinaria, Sustancia Química o Servicio a Adquirir',
      'Categoría de Adquisición (EPP, Equipos de Alturas, Sustancias Químicas, Maquinaria, Mobiliario Ergonómico, Servicios Críticos)',
      'Área Solicitante y Proceso Operativo Destino',
      'Peligros Asociados al Uso del Producto o Servicio',
      'Especificaciones y Requisitos Técnicos de SST Exigidos',
      'Normas y Certificaciones Técnicas Requeridas (ANSI, NIOSH, EN, RETIE, NTC, NFPA)',
      'Exigencia de Ficha de Datos de Seguridad (FDS 16 Secciones) y Etiqueta SGA',
      'Exigencia de Manual en Español, Guardas de Seguridad y Dispositivos de Parada de Emergencia',
      'Criterios Ergonómicos y Límites de Emisión de Ruido / Vibración',
      'Proveedor Seleccionado, NIT y Puntaje de Evaluación SST',
      'Comunicación Oficial de Requisitos SST al Proveedor (Art. 2.2.4.6.27)',
      'Verificación de Cumplimiento SST al Recibo / Inspección de Ingreso a Almacén',
      'Concepto de Aprobación SST (Aprobado / Rechazado / Condicionado)',
      'Necesidad de Activar Gestión del Cambio (MOC) o Capacitación al Personal',
      'Responsable de Verificación SST y Fecha de Recepción',
    ],
    quickCombos: [
      {
        label: '⚡ Producto + Requisitos Técnicos SST + Certificación Exigida',
        description: 'Matriz de especificaciones SST de compra para el área de adquisiciones',
        fields: [
          'Bien, Producto, Maquinaria, Sustancia Química o Servicio a Adquirir',
          'Categoría de Adquisición (EPP, Equipos de Alturas, Sustancias Químicas, Maquinaria, Mobiliario Ergonómico, Servicios Críticos)',
          'Especificaciones y Requisitos Técnicos de SST Exigidos',
          'Normas y Certificaciones Técnicas Requeridas (ANSI, NIOSH, EN, RETIE, NTC, NFPA)',
        ],
      },
      {
        label: '⚡ Verificación al Recibo en Almacén y Evaluación de Proveedor',
        description: 'Audita qué compras cumplen o incumplen criterios SST al ingreso',
        fields: [
          'Bien, Producto, Maquinaria, Sustancia Química o Servicio a Adquirir',
          'Proveedor Seleccionado, NIT y Puntaje de Evaluación SST',
          'Verificación de Cumplimiento SST al Recibo / Inspección de Ingreso a Almacén',
          'Concepto de Aprobación SST (Aprobado / Rechazado / Condicionado)',
          'Responsable de Verificación SST y Fecha de Recepción',
        ],
      },
      {
        label: '⚡ Compras de Químicos (FDS/SGA) y Maquinaria (Guardas/RETIE)',
        description: 'Requisitos de seguridad industrial para insumos y equipos críticos',
        fields: [
          'Bien, Producto, Maquinaria, Sustancia Química o Servicio a Adquirir',
          'Peligros Asociados al Uso del Producto o Servicio',
          'Exigencia de Ficha de Datos de Seguridad (FDS 16 Secciones) y Etiqueta SGA',
          'Exigencia de Manual en Español, Guardas de Seguridad y Dispositivos de Parada de Emergencia',
          'Necesidad de Activar Gestión del Cambio (MOC) o Capacitación al Personal',
        ],
      },
    ],
    reportTags: ['sgsst-compras', 'sgsst-compras-sst'],
  },

  hito5_contratistas: {
    moduleTitle: 'Hito 5 · Control y Gestión de Contratistas y Proveedores',
    moduleBadge: 'Hito 5 · Contratistas',
    fieldsLabel: 'Campos Propios de Control de Contratistas y Seguridad Social PILA',
    fields: [
      'Razón Social de la Empresa Contratista o Proveedor',
      'NIT y Actividad Económica / Clase de Riesgo ARL',
      'Representante Legal, Coordinador SST y Datos de Contacto',
      'Objeto del Contrato, Sede de Ejecución y Vigencia Contractual',
      'Nivel de Riesgo de la Actividad Contratada (TAR: Alturas, Eléctrico, Caliente, Confinados, Izaje)',
      'Certificado de Autoevaluación de Estándares Mínimos Res. 0312 Emitido por ARL (%)',
      'Verificación de Planilla PILA Vigente (Pago de EPS, ARL y AFP del Mes en Curso)',
      'Listado Nominal de Trabajadores Destacados (Cédula, Nombre Completo y Cargo)',
      'Conceptos de Aptitud Médica Ocupacional (EMO) Vigentes del Personal Contratista',
      'Certificados Vigentes de Trabajo en Alturas / Tareas de Alto Riesgo',
      'Constancia de Inducción y Reinducción SST en la Empresa Contratante',
      'Soporte de Entrega de EPP Certificados y Dotación por Parte del Contratista',
      'Procedimientos de Trabajo Seguro (ATS / Permisos de Trabajo) y Plan de Emergencias',
      'Reporte de Incidentes, Accidentes de Trabajo y Ausentismo del Contratista',
      'Calificación de Desempeño y Reevaluación Periódica SST del Contratista (%)',
      'Estado de Habilitación para Ingreso a Planta / Obra (Autorizado / Bloqueado / Pendiente Soportes)',
    ],
    quickCombos: [
      {
        label: '⚡ Contratista + NIT + Planilla PILA + Certificado 0312 ARL + Estado Ingreso',
        description: 'Auditoría rápida de requisitos legales antes de autorizar ingreso a sede',
        fields: [
          'Razón Social de la Empresa Contratista o Proveedor',
          'NIT y Actividad Económica / Clase de Riesgo ARL',
          'Certificado de Autoevaluación de Estándares Mínimos Res. 0312 Emitido por ARL (%)',
          'Verificación de Planilla PILA Vigente (Pago de EPS, ARL y AFP del Mes en Curso)',
          'Estado de Habilitación para Ingreso a Planta / Obra (Autorizado / Bloqueado / Pendiente Soportes)',
        ],
      },
      {
        label: '⚡ Trabajadores del Contratista (Cédula, Nombre, EMO, Curso Alturas e Inducción)',
        description: 'Control individual de seguridad social y competencias por trabajador externo',
        fields: [
          'Razón Social de la Empresa Contratista o Proveedor',
          'Listado Nominal de Trabajadores Destacados (Cédula, Nombre Completo y Cargo)',
          'Conceptos de Aptitud Médica Ocupacional (EMO) Vigentes del Personal Contratista',
          'Certificados Vigentes de Trabajo en Alturas / Tareas de Alto Riesgo',
          'Constancia de Inducción y Reinducción SST en la Empresa Contratante',
        ],
      },
      {
        label: '⚡ Tareas de Alto Riesgo (TAR), EPP y Permisos de Trabajo del Contratista',
        description: 'Supervisión operativa en campo de contratistas críticos',
        fields: [
          'Razón Social de la Empresa Contratista o Proveedor',
          'Nivel de Riesgo de la Actividad Contratada (TAR: Alturas, Eléctrico, Caliente, Confinados, Izaje)',
          'Soporte de Entrega de EPP Certificados y Dotación por Parte del Contratista',
          'Procedimientos de Trabajo Seguro (ATS / Permisos de Trabajo) y Plan de Emergencias',
        ],
      },
      {
        label: '⚡ Evaluación de Desempeño SST y Accidentalidad de Contratistas',
        description: 'Calificación periódica y reevaluación de proveedores y contratistas',
        fields: [
          'Razón Social de la Empresa Contratista o Proveedor',
          'Objeto del Contrato, Sede de Ejecución y Vigencia Contractual',
          'Reporte de Incidentes, Accidentes de Trabajo y Ausentismo del Contratista',
          'Calificación de Desempeño y Reevaluación Periódica SST del Contratista (%)',
        ],
      },
    ],
    reportTags: ['sgsst-contratistas', 'sgsst-contratistas-proveedores'],
  },

  hito5_gestion_cambio: {
    moduleTitle: 'Hito 5 · Gestión del Cambio en SST (MOC — Art. 2.2.4.6.26)',
    moduleBadge: 'Hito 5 · Gestión del Cambio',
    fieldsLabel: 'Campos Propios de Gestión del Cambio (MOC)',
    fields: [
      'Código / ID del Proceso de Gestión del Cambio (MOC)',
      'Título del Cambio y Fecha de Solicitud',
      'Origen y Categoría del Cambio (Interno: Infraestructura, Maquinaria, Proceso, Químicos, Estructura Organizacional / Externo: Nueva Legislación, Evolución del Conocimiento)',
      'Carácter del Cambio (Permanente / Temporal / De Emergencia)',
      'Área, Sede y Puestos de Trabajo Impactados',
      'Descripción Detallada de la Situación Actual vs. Cambio Propuesto',
      'Identificación de Nuevos Peligros y Aspectos de SST Generados por el Cambio',
      'Evaluación del Nivel de Riesgo del Cambio (Alto / Medio / Bajo)',
      'Impacto sobre la Matriz IPEVR GTC-45 y Procedimientos Operativos Estándar',
      'Impacto sobre el Plan de Emergencias, Señalización y Equipos de Protección (EPP)',
      'Requerimientos de Información, Capacitación y Entrenamiento a los Trabajadores',
      'Participación y Consulta con el COPASST / Vigía de SST',
      'Medidas de Control Previas a la Puesta en Marcha (Pre-Start-Up Safety Review)',
      'Responsable de Ejecución, Presupuesto y Fecha Límite de Implementación',
      'Concepto de Autorización SST y Gerencia (Aprobado / En Ejecución / Cerrado)',
      'Verificación de Eficacia Post-Implementación del Cambio',
    ],
    quickCombos: [
      {
        label: '⚡ Cambio Propuesto + Nuevos Peligros + Controles Previos a Puesta en Marcha',
        description: 'Extrae el análisis de impacto SST antes de autorizar el cambio (Art. 2.2.4.6.26)',
        fields: [
          'Título del Cambio y Fecha de Solicitud',
          'Origen y Categoría del Cambio (Interno: Infraestructura, Maquinaria, Proceso, Químicos, Estructura Organizacional / Externo: Nueva Legislación, Evolución del Conocimiento)',
          'Identificación de Nuevos Peligros y Aspectos de SST Generados por el Cambio',
          'Evaluación del Nivel de Riesgo del Cambio (Alto / Medio / Bajo)',
          'Medidas de Control Previas a la Puesta en Marcha (Pre-Start-Up Safety Review)',
        ],
      },
      {
        label: '⚡ Actualización de Matriz IPEVR, Procedimientos y Capacitación por Cambio',
        description: 'Verifica qué documentos y entrenamientos deben actualizarse por el MOC',
        fields: [
          'Título del Cambio y Fecha de Solicitud',
          'Área, Sede y Puestos de Trabajo Impactados',
          'Impacto sobre la Matriz IPEVR GTC-45 y Procedimientos Operativos Estándar',
          'Requerimientos de Información, Capacitación y Entrenamiento a los Trabajadores',
          'Participación y Consulta con el COPASST / Vigía de SST',
        ],
      },
      {
        label: '⚡ Estado de Aprobación, Responsables y Cierre de Eficacia MOC',
        description: 'Seguimiento gerencial a cambios abiertos o en fase de verificación',
        fields: [
          'Código / ID del Proceso de Gestión del Cambio (MOC)',
          'Título del Cambio y Fecha de Solicitud',
          'Responsable de Ejecución, Presupuesto y Fecha Límite de Implementación',
          'Concepto de Autorización SST y Gerencia (Aprobado / En Ejecución / Cerrado)',
          'Verificación de Eficacia Post-Implementación del Cambio',
        ],
      },
    ],
    reportTags: ['sgsst-gestion-cambio', 'sgsst-moc'],
  },

  hito3_ats: {
    moduleTitle: 'Hito 5 · Análisis de Trabajo Seguro (ATS Paso a Paso)',
    moduleBadge: 'Hito 5 · Terreno',
    fieldsLabel: 'Campos Propios del Análisis de Trabajo Seguro (ATS)',
    fields: [
      'Código / Consecutivo del ATS y Fecha de Elaboración',
      'Nombre de la Tarea Crítica o No Rutinaria a Ejecutar',
      'Sede, Área, Planta o Frente de Obra Exacto',
      'Horario de Inicio y Finalización Autorizada',
      'Permisos de Trabajo Complementarios Asociados (Alturas, Caliente, Confinados, Eléctrico, Izaje)',
      'Herramientas Manuales, Eléctricas, Neumáticas y Maquinaria a Utilizar',
      'Inspección Preoperacional de Herramientas y Área de Trabajo',
      'Trabajadores Ejecutores (Cédula, Nombre Completo, Cargo y ARL)',
      'Secuencia Ordenada de Pasos de la Tarea (Paso a Paso Operativo)',
      'Peligros Identificados en Cada Paso (Físico, Mecánico, Eléctrico, Locativo, Químico, Biomecánico)',
      'Consecuencias Potenciales por Paso de la Tarea',
      'Controles Preventivos y Operativos en Fuente, Medio e Individuo por Paso',
      'Elementos de Protección Personal (EPP) Específicos y Sistemas de Protección Requeridos',
      'Condiciones Ambientales y del Entorno (Orden y Aseo, Iluminación, Clima, Líneas Energizadas)',
      'Procedimiento de Emergencia, Punto de Encuentro y Brigadista en Sitio',
      'Socialización del ATS en Charla Preoperacional y Firmas de Ejecutores y Supervisor SST',
    ],
    quickCombos: [
      {
        label: '⚡ Tarea + Trabajadores (Cédula/Nombre) + Pasos + Peligros + Controles',
        description: 'Extrae el ATS operativo completo listo para validación en campo',
        fields: [
          'Nombre de la Tarea Crítica o No Rutinaria a Ejecutar',
          'Sede, Área, Planta o Frente de Obra Exacto',
          'Trabajadores Ejecutores (Cédula, Nombre Completo, Cargo y ARL)',
          'Secuencia Ordenada de Pasos de la Tarea (Paso a Paso Operativo)',
          'Peligros Identificados en Cada Paso (Físico, Mecánico, Eléctrico, Locativo, Químico, Biomecánico)',
          'Controles Preventivos y Operativos en Fuente, Medio e Individuo por Paso',
        ],
      },
      {
        label: '⚡ Herramientas, EPP Específicos y Permisos de Alto Riesgo Asociados',
        description: 'Lista de chequeo de equipos y elementos de protección antes de iniciar tarea',
        fields: [
          'Nombre de la Tarea Crítica o No Rutinaria a Ejecutar',
          'Permisos de Trabajo Complementarios Asociados (Alturas, Caliente, Confinados, Eléctrico, Izaje)',
          'Herramientas Manuales, Eléctricas, Neumáticas y Maquinaria a Utilizar',
          'Inspección Preoperacional de Herramientas y Área de Trabajo',
          'Elementos de Protección Personal (EPP) Específicos y Sistemas de Protección Requeridos',
        ],
      },
      {
        label: '⚡ Nómina de Ejecutores, Supervisor SST y Plan de Emergencia en Sitio',
        description: 'Verifica firmas de autorización y respuesta ante emergencias de la cuadrilla',
        fields: [
          'Código / Consecutivo del ATS y Fecha de Elaboración',
          'Nombre de la Tarea Crítica o No Rutinaria a Ejecutar',
          'Trabajadores Ejecutores (Cédula, Nombre Completo, Cargo y ARL)',
          'Procedimiento de Emergencia, Punto de Encuentro y Brigadista en Sitio',
          'Socialización del ATS en Charla Preoperacional y Firmas de Ejecutores y Supervisor SST',
        ],
      },
    ],
    reportTags: ['sgsst-ats'],
  },

  hito3_alturas: {
    moduleTitle: 'Hito 5 · Permiso de Trabajo en Alturas (Res. 4272 de 2021)',
    moduleBadge: 'Hito 5 · Alturas Res. 4272',
    fieldsLabel: 'Campos Propios del Permiso de Trabajo en Alturas',
    fields: [
      'Consecutivo del Permiso de Trabajo en Alturas y Fecha',
      'Vigencia Horaria del Permiso (Hora Inicio y Hora Cierre)',
      'Sede, Área, Estructura y Descripción Exacta de la Actividad en Alturas',
      'Altura Aproximada de Trabajo (metros ≥ 2.0 m)',
      'Trabajadores Autorizados (Cédula, Nombre Completo y Cargo)',
      'Verificación de Vigencia de Curso de Trabajo en Alturas (Trabajador Autorizado / Reentrenamiento)',
      'Verificación de Concepto de Aptitud Médica sin Restricciones para Alturas y Afiliación ARL/EPS',
      'Chequeo de Condiciones de Salud Pre-Ascenso (Sin Vértigo, Consumo de Medicamentos o Alcohol)',
      'Coordinador de Trabajo en Alturas (Nombre, Cédula y Certificado) y Ayudante de Seguridad',
      'Sistema de Acceso Utilizado (Andamio Certificado, Escalera, Plataforma Elevadora, Cuerdas)',
      'Punto de Anclaje / Línea de Vida (Resistencia ≥ 5000 lb / 22.2 kN Certificada)',
      'Inspección Preuso de Arnés de Cuerpo Completo Multipropósito, Eslinga con Absorbedor de Impacto, Mosquetones y Casco con Barbuquejo de 3 Puntos',
      'Cálculo del Requerimiento de Claridad / Distancia Total de Caída Libre (m)',
      'Demarcación, Señalización de Área Inferior y Control de Caída de Objetos',
      'Verificación de Distancias de Seguridad a Redes Eléctricas Energizadas (RETIE) y Clima',
      'Plan de Rescate en Alturas, Kit de Rescate en Sitio y Brigadista Rescatista Disponible',
      'Estado del Permiso (Aprobado en Ejecución / Suspendido por Clima / Cerrado sin Novedad)',
    ],
    quickCombos: [
      {
        label: '⚡ Trabajadores (Cédula/Nombre) + Curso Alturas + Aptitud Médica + Equipos',
        description: 'Verifica habilitación legal de cada trabajador antes de subir a alturas (Res. 4272)',
        fields: [
          'Trabajadores Autorizados (Cédula, Nombre Completo y Cargo)',
          'Verificación de Vigencia de Curso de Trabajo en Alturas (Trabajador Autorizado / Reentrenamiento)',
          'Verificación de Concepto de Aptitud Médica sin Restricciones para Alturas y Afiliación ARL/EPS',
          'Coordinador de Trabajo en Alturas (Nombre, Cédula y Certificado) y Ayudante de Seguridad',
          'Inspección Preuso de Arnés de Cuerpo Completo Multipropósito, Eslinga con Absorbedor de Impacto, Mosquetones y Casco con Barbuquejo de 3 Puntos',
        ],
      },
      {
        label: '⚡ Cálculo de Claridad, Punto de Anclaje (5000 lb), Sistema de Acceso y Rescate',
        description: 'Revisión de ingeniería contra caídas y plan de rescate activo en el sitio',
        fields: [
          'Sede, Área, Estructura y Descripción Exacta de la Actividad en Alturas',
          'Altura Aproximada de Trabajo (metros ≥ 2.0 m)',
          'Sistema de Acceso Utilizado (Andamio Certificado, Escalera, Plataforma Elevadora, Cuerdas)',
          'Punto de Anclaje / Línea de Vida (Resistencia ≥ 5000 lb / 22.2 kN Certificada)',
          'Cálculo del Requerimiento de Claridad / Distancia Total de Caída Libre (m)',
          'Plan de Rescate en Alturas, Kit de Rescate en Sitio y Brigadista Rescatista Disponible',
        ],
      },
      {
        label: '⚡ Condiciones Climáticas, Riesgo Eléctrico RETIE y Estado del Permiso',
        description: 'Control ambiental en vivo para autorizar o suspender labores en alturas',
        fields: [
          'Consecutivo del Permiso de Trabajo en Alturas y Fecha',
          'Vigencia Horaria del Permiso (Hora Inicio y Hora Cierre)',
          'Verificación de Distancias de Seguridad a Redes Eléctricas Energizadas (RETIE) y Clima',
          'Demarcación, Señalización de Área Inferior y Control de Caída de Objetos',
          'Estado del Permiso (Aprobado en Ejecución / Suspendido por Clima / Cerrado sin Novedad)',
        ],
      },
    ],
    reportTags: ['sgsst-permiso-alturas'],
  },

  hito5_equipos_alturas: {
    moduleTitle: 'Hito 5 · Hoja de Vida e Inspección de Equipos de Alturas',
    moduleBadge: 'Hito 5 · Equipos Alturas',
    fieldsLabel: 'Campos Propios de Hoja de Vida de Equipos contra Caídas',
    fields: [
      'Código Interno del Equipo y Número de Serie / Lote',
      'Tipo de Equipo (Arnés Multipropósito, Eslinga con Absorbedor, Eslinga de Posicionamiento, Línea de Vida, Arrestador / Freno, Mosquetón, Polea, Trípode)',
      'Marca, Referencia / Modelo y Fabricante',
      'Norma Técnica de Certificación (ANSI Z359 / EN 361 / CSA / OSHA)',
      'Capacidad / Resistencia Nominal (kN / lb)',
      'Fecha de Fabricación y Fecha de Compra / Puesta en Servicio',
      'Trabajador o Cuadrilla Asignada (Cédula, Nombre Completo y Cargo)',
      'Ubicación / Bodega de Almacenamiento',
      'Fecha de Última Inspección Preuso y por Coordinador de Alturas',
      'Fecha de Última Inspección Anual por Persona Competente / Avalada por Fabricante',
      'Fecha de Próxima Inspección Anual Obligatoria (Res. 4272)',
      'Estado de Reatas, Costuras, Fibras e Indicador de Impacto',
      'Estado de Argollas D, Hebillas, Mosquetones y Partes Metálicas (Sin Corrosión ni Deformación)',
      'Legibilidad de Etiqueta de Trazabilidad y Serial del Fabricante',
      'Historial de Detención de Caídas o Eventos de Impacto Sufridos',
      'Concepto Técnico del Equipo (Apto en Servicio / En Mantenimiento-Cuarentena / Dado de Baja)',
    ],
    quickCombos: [
      {
        label: '⚡ Serial + Tipo de Equipo + Próxima Inspección Anual + Estado (Apto/Baja)',
        description: 'Control de vencimientos de inspección anual de equipos contra caídas (Res. 4272)',
        fields: [
          'Código Interno del Equipo y Número de Serie / Lote',
          'Tipo de Equipo (Arnés Multipropósito, Eslinga con Absorbedor, Eslinga de Posicionamiento, Línea de Vida, Arrestador / Freno, Mosquetón, Polea, Trípode)',
          'Fecha de Última Inspección Anual por Persona Competente / Avalada por Fabricante',
          'Fecha de Próxima Inspección Anual Obligatoria (Res. 4272)',
          'Concepto Técnico del Equipo (Apto en Servicio / En Mantenimiento-Cuarentena / Dado de Baja)',
        ],
      },
      {
        label: '⚡ Equipos Asignados por Trabajador (Cédula, Nombre, Serial y Norma ANSI/EN)',
        description: 'Kardex de asignación de arneses y eslingas por colaborador',
        fields: [
          'Trabajador o Cuadrilla Asignada (Cédula, Nombre Completo y Cargo)',
          'Código Interno del Equipo y Número de Serie / Lote',
          'Tipo de Equipo (Arnés Multipropósito, Eslinga con Absorbedor, Eslinga de Posicionamiento, Línea de Vida, Arrestador / Freno, Mosquetón, Polea, Trípode)',
          'Marca, Referencia / Modelo y Fabricante',
          'Norma Técnica de Certificación (ANSI Z359 / EN 361 / CSA / OSHA)',
        ],
      },
      {
        label: '⚡ Hallazgos en Reatas, Costuras, Herrajes, Etiqueta y Equipos de Baja',
        description: 'Audita criterios de descarte físico o activación de indicador de impacto',
        fields: [
          'Código Interno del Equipo y Número de Serie / Lote',
          'Estado de Reatas, Costuras, Fibras e Indicador de Impacto',
          'Estado de Argollas D, Hebillas, Mosquetones y Partes Metálicas (Sin Corrosión ni Deformación)',
          'Legibilidad de Etiqueta de Trazabilidad y Serial del Fabricante',
          'Historial de Detención de Caídas o Eventos de Impacto Sufridos',
          'Concepto Técnico del Equipo (Apto en Servicio / En Mantenimiento-Cuarentena / Dado de Baja)',
        ],
      },
    ],
    reportTags: ['sgsst-heights'],
  },

  hito3_epp: {
    moduleTitle: 'Hito 5 · Entrega, Reposición y Seguimiento de EPP',
    moduleBadge: 'Hito 5 · Entrega EPP',
    fieldsLabel: 'Campos Propios del Kardex y Entrega de EPP por Trabajador',
    fields: [
      'Cédula / Documento del Trabajador',
      'Nombre Completo del Trabajador',
      'Cargo, Área / Proceso y Sede',
      'Elemento de Protección Personal (EPP) o Dotación Entregada',
      'Zona Anatómica Protegida (Cabeza, Visual/Facial, Auditiva, Respiratoria, Manos, Pies, Corporal, Caídas)',
      'Peligro Asociado que Controla el EPP',
      'Marca, Referencia y Norma Técnica de Certificación (ANSI / NIOSH / EN / NTC / ASTM)',
      'Talla y Cantidad Entregada',
      'Fecha de Entrega al Trabajador',
      'Motivo de Entrega (Dotación Inicial / Reposición por Desgaste / Daño / Cambio de Cargo)',
      'Vida Útil Estimada y Fecha Programada de Próxima Reposición',
      'Estado de Vigencia del EPP (Vigente / Próximo a Reposición / Vencido)',
      'Instrucción de Uso, Mantenimiento, Limpieza y Almacenamiento Recibida',
      'Inspección de Uso Efectivo en Puesto de Trabajo',
      'Disposición Final del EPP Usado o Contaminado',
      'Firma / Constancia Digital de Recibido del Trabajador',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + EPP Entregado + Fecha de Reposición y Estado',
        description: 'Audita qué trabajadores tienen EPP vencidos o próximos a reposición',
        fields: [
          'Cédula / Documento del Trabajador',
          'Nombre Completo del Trabajador',
          'Cargo, Área / Proceso y Sede',
          'Elemento de Protección Personal (EPP) o Dotación Entregada',
          'Fecha de Entrega al Trabajador',
          'Vida Útil Estimada y Fecha Programada de Próxima Reposición',
          'Estado de Vigencia del EPP (Vigente / Próximo a Reposición / Vencido)',
        ],
      },
      {
        label: '⚡ Matriz Técnica de EPP por Cargo (Zona Protegida, Norma ANSI/NIOSH y Talla)',
        description: 'Especificaciones técnicas y tallaje del kardex de protección personal',
        fields: [
          'Cargo, Área / Proceso y Sede',
          'Elemento de Protección Personal (EPP) o Dotación Entregada',
          'Zona Anatómica Protegida (Cabeza, Visual/Facial, Auditiva, Respiratoria, Manos, Pies, Corporal, Caídas)',
          'Marca, Referencia y Norma Técnica de Certificación (ANSI / NIOSH / EN / NTC / ASTM)',
          'Talla y Cantidad Entregada',
        ],
      },
      {
        label: '⚡ Constancia de Entrega Firmada e Inspección de Uso en Campo',
        description: 'Soportes legales de entrega de EPP (Ley 9 de 1979 / Dec. 1072)',
        fields: [
          'Cédula / Documento del Trabajador',
          'Nombre Completo del Trabajador',
          'Elemento de Protección Personal (EPP) o Dotación Entregada',
          'Instrucción de Uso, Mantenimiento, Limpieza y Almacenamiento Recibida',
          'Inspección de Uso Efectivo en Puesto de Trabajo',
          'Firma / Constancia Digital de Recibido del Trabajador',
        ],
      },
    ],
    reportTags: ['sgsst-epp'],
  },

  hito5_registro_quimico: {
    moduleTitle: 'Hito 5 · Inventario, FDS y Rótulo SGA de Productos Químicos',
    moduleBadge: 'Hito 5 · Inventario Químico',
    fieldsLabel: 'Campos Propios del Inventario y Etiquetado SGA de Químicos',
    fields: [
      'Código / ID del Producto Químico en Inventario',
      'Nombre Comercial de la Sustancia o Mezcla Química',
      'Nombre Químico / IUPAC y Fabricante o Proveedor',
      'Número CAS y Número ONU (UN)',
      'Estado Físico (Líquido, Sólido, Gas, Aerosol) y Cantidad Máxima Almacenada',
      'Sede, Área Operativa de Uso y Bodega de Almacenamiento',
      'Clasificación de Peligros SGA / GHS (Físicos, para la Salud y para el Medio Ambiente)',
      'Pictogramas de Peligro SGA (SGA01 a SGA09) y Palabra de Advertencia (Peligro / Atención)',
      'Indicaciones de Peligro (Frases H) y Consejos de Prudencia (Frases P)',
      'Disponibilidad de Ficha de Datos de Seguridad (FDS de 16 Secciones en Español)',
      'Fecha de Emisión de la FDS y Vigencia (< 5 Años según Decreto 1496 de 2018)',
      'Verificación de Etiquetado SGA en Envase Original y Envases de Trasvase',
      'Límites de Exposición Ocupacional (TLV-TWA / TLV-STEL ACGIH)',
      'EPP Específico Requerido (Protección Respiratoria, Guantes Nitrilo/Neopreno, Gafas Herméticas)',
      'Compatibilidad de Almacenamiento, Dique de Contención, Kit de Derrames y Ducha/Lavaojos',
      'Medidas de Primeros Auxilios y Agente Extintor Apropiado',
    ],
    quickCombos: [
      {
        label: '⚡ Producto Químico + CAS + Pictogramas SGA + Vigencia FDS (<5 años) + EPP',
        description: 'Revisa qué productos químicos tienen FDS vencida, sin rótulo SGA o alto riesgo',
        fields: [
          'Nombre Comercial de la Sustancia o Mezcla Química',
          'Número CAS y Número ONU (UN)',
          'Pictogramas de Peligro SGA (SGA01 a SGA09) y Palabra de Advertencia (Peligro / Atención)',
          'Disponibilidad de Ficha de Datos de Seguridad (FDS de 16 Secciones en Español)',
          'Fecha de Emisión de la FDS y Vigencia (< 5 Años según Decreto 1496 de 2018)',
          'EPP Específico Requerido (Protección Respiratoria, Guantes Nitrilo/Neopreno, Gafas Herméticas)',
        ],
      },
      {
        label: '⚡ Frases H/P, Límites TLV-TWA y Etiquetado de Envases Trasvasados',
        description: 'Auditoría de higiene industrial y cumplimiento de la Resolución 773 de 2021',
        fields: [
          'Nombre Comercial de la Sustancia o Mezcla Química',
          'Sede, Área Operativa de Uso y Bodega de Almacenamiento',
          'Indicaciones de Peligro (Frases H) y Consejos de Prudencia (Frases P)',
          'Verificación de Etiquetado SGA en Envase Original y Envases de Trasvase',
          'Límites de Exposición Ocupacional (TLV-TWA / TLV-STEL ACGIH)',
        ],
      },
      {
        label: '⚡ Almacenamiento Seguro, Kit de Derrames y Primeros Auxilios Químicos',
        description: 'Tarjetas de emergencia química para brigadas y bodegas',
        fields: [
          'Nombre Comercial de la Sustancia o Mezcla Química',
          'Estado Físico (Líquido, Sólido, Gas, Aerosol) y Cantidad Máxima Almacenada',
          'Compatibilidad de Almacenamiento, Dique de Contención, Kit de Derrames y Ducha/Lavaojos',
          'Medidas de Primeros Auxilios y Agente Extintor Apropiado',
        ],
      },
    ],
    reportTags: ['sgsst-chemicals'],
  },

  hito3_vehiculos: {
    moduleTitle: 'Hito 5 · Hoja de Vida de Automotores e Inspección PESV',
    moduleBadge: 'Hito 5 · Parque Automotor',
    fieldsLabel: 'Campos Propios del Parque Automotor e Inspección Preoperacional PESV',
    fields: [
      'Placa del Vehículo o Código de Maquinaria',
      'Clase de Vehículo (Automóvil, Camioneta, Camión, Motocicleta, Montacargas, Maquinaria Amarilla)',
      'Vínculo con la Empresa (Propio, Leasing, Contratista, Tercero Puesto al Servicio)',
      'Marca, Línea, Modelo, Color y Cilindraje',
      'Conductor Asignado (Cédula, Nombre Completo y Teléfono)',
      'Categoría y Fecha de Vencimiento de la Licencia de Conducción',
      'Estado de Comparendos SIMIT y Exámenes Psicosensométricos del Conductor',
      'Fecha de Vencimiento del SOAT',
      'Fecha de Vencimiento de la Revisión Técnico-Mecánica y de Emisiones (RTM)',
      'Vigencia de Póliza de Responsabilidad Civil Extracontractual / Todo Riesgo',
      'Kilometraje u Horómetro Actual',
      'Fecha de Último Mantenimiento Preventivo y Próximo Mantenimiento Programado',
      'Estado de Sistemas Críticos (Frenos, Llantas/Labrado, Luces, Dirección, Suspensión, Cinturones)',
      'Estado de Equipo de Carretera y Prevención (Extintor Vigente, Botiquín, Tacos, Conos, Chaleco)',
      'Fecha y Resultado de Última Inspección Preoperacional Diaria (Apto / Con Hallazgos / Inmovilizado)',
      'Hallazgos Abiertos del Vehículo y Plan de Intervención',
    ],
    quickCombos: [
      {
        label: '⚡ Placa + Conductor (Cédula/Licencia) + Vencimiento SOAT y RTM',
        description: 'Alerta inmediata de documentos vehiculares o licencias vencidas',
        fields: [
          'Placa del Vehículo o Código de Maquinaria',
          'Clase de Vehículo (Automóvil, Camioneta, Camión, Motocicleta, Montacargas, Maquinaria Amarilla)',
          'Conductor Asignado (Cédula, Nombre Completo y Teléfono)',
          'Categoría y Fecha de Vencimiento de la Licencia de Conducción',
          'Fecha de Vencimiento del SOAT',
          'Fecha de Vencimiento de la Revisión Técnico-Mecánica y de Emisiones (RTM)',
        ],
      },
      {
        label: '⚡ Inspección Preoperacional Diaria, Sistemas Críticos y Vehículos Inmovilizados',
        description: 'Control diario del Paso 16 y 17 del PESV (Res. 40595)',
        fields: [
          'Placa del Vehículo o Código de Maquinaria',
          'Conductor Asignado (Cédula, Nombre Completo y Teléfono)',
          'Estado de Sistemas Críticos (Frenos, Llantas/Labrado, Luces, Dirección, Suspensión, Cinturones)',
          'Fecha y Resultado de Última Inspección Preoperacional Diaria (Apto / Con Hallazgos / Inmovilizado)',
          'Hallazgos Abiertos del Vehículo y Plan de Intervención',
        ],
      },
      {
        label: '⚡ Kilometraje, Mantenimiento Preventivo y Kit de Carretera',
        description: 'Seguimiento a planes de mantenimiento preventivo y correctivo de la flota',
        fields: [
          'Placa del Vehículo o Código de Maquinaria',
          'Marca, Línea, Modelo, Color y Cilindraje',
          'Kilometraje u Horómetro Actual',
          'Fecha de Último Mantenimiento Preventivo y Próximo Mantenimiento Programado',
          'Estado de Equipo de Carretera y Prevención (Extintor Vigente, Botiquín, Tacos, Conos, Chaleco)',
        ],
      },
    ],
    reportTags: ['sgsst-vehicles'],
  },

  hito5_equipos_emergencia: {
    moduleTitle: 'Hito 5 · Inventario e Inspección de Equipos de Emergencia',
    moduleBadge: 'Hito 5 · Equipos Emergencia',
    fieldsLabel: 'Campos Propios de Extintores, Botiquines, Camillas y Gabinetes',
    fields: [
      'Código / ID del Equipo de Emergencia',
      'Categoría del Equipo (Extintor Portátil/Rodante, Botiquín, Camilla Rígida, DEA, Gabinete Contra Incendio, Alarma, Ducha/Lavaojos, Kit Antiderrames)',
      'Clase y Agente Extintor (Multipropósito ABC, Solkaflam / Agente Limpio, CO2, Agua a Presión, Clase K)',
      'Capacidad Nominal (Libras / Litros / Tipo de Botiquín A-B-C)',
      'Sede, Edificio, Piso y Ubicación Exacta',
      'Fecha de Última Recarga o Mantenimiento Anual',
      'Fecha de Vencimiento de Recarga / Próxima Prueba Hidrostática',
      'Estado de Vigencia (Vigente / Próximo a Vencer / Vencido)',
      'Inspección Física de Extintor (Manómetro en Zona Verde, Pin y Sello de Seguridad, Manguera, Boquilla, Cilindro sin Golpes/Corrosión)',
      'Inspección de Ubicación (Altura Reglamentaria, Señalización Visible, Acceso Libre de Obstáculos)',
      'Inspección de Botiquín (Existencia y Fecha de Vencimiento de Gasas, Suero, Vendas, Inmovilizadores, Guantes)',
      'Inspección de Camilla Rígida (Correas de Sujeción, Inmovilizador Cervical y Limpieza)',
      'Fecha de Última Inspección Mensual y Brigadista / Inspector Responsable',
      'Concepto Operativo (Operativo / Requiere Recarga o Reposición / Fuera de Servicio)',
      'Observaciones y Acción Correctiva Inmediata',
    ],
    quickCombos: [
      {
        label: '⚡ Código + Tipo (Extintor/Botiquín) + Ubicación + Fecha Vencimiento Recarga',
        description: 'Detecta extintores o insumos de botiquín vencidos o próximos a vencer por sede',
        fields: [
          'Código / ID del Equipo de Emergencia',
          'Categoría del Equipo (Extintor Portátil/Rodante, Botiquín, Camilla Rígida, DEA, Gabinete Contra Incendio, Alarma, Ducha/Lavaojos, Kit Antiderrames)',
          'Clase y Agente Extintor (Multipropósito ABC, Solkaflam / Agente Limpio, CO2, Agua a Presión, Clase K)',
          'Sede, Edificio, Piso y Ubicación Exacta',
          'Fecha de Vencimiento de Recarga / Próxima Prueba Hidrostática',
          'Estado de Vigencia (Vigente / Próximo a Vencer / Vencido)',
        ],
      },
      {
        label: '⚡ Inspección Física de Extintores (Manómetro, Pin, Señalización y Acceso)',
        description: 'Checklist técnico NTC 2885 / NFPA 10 de extintores en planta',
        fields: [
          'Código / ID del Equipo de Emergencia',
          'Sede, Edificio, Piso y Ubicación Exacta',
          'Inspección Física de Extintor (Manómetro en Zona Verde, Pin y Sello de Seguridad, Manguera, Boquilla, Cilindro sin Golpes/Corrosión)',
          'Inspección de Ubicación (Altura Reglamentaria, Señalización Visible, Acceso Libre de Obstáculos)',
          'Concepto Operativo (Operativo / Requiere Recarga o Reposición / Fuera de Servicio)',
        ],
      },
      {
        label: '⚡ Inspección de Botiquines, Camillas, DEA y Kits Antiderrames',
        description: 'Verifica insumos médicos de primeros auxilios y equipos de rescate',
        fields: [
          'Código / ID del Equipo de Emergencia',
          'Categoría del Equipo (Extintor Portátil/Rodante, Botiquín, Camilla Rígida, DEA, Gabinete Contra Incendio, Alarma, Ducha/Lavaojos, Kit Antiderrames)',
          'Sede, Edificio, Piso y Ubicación Exacta',
          'Inspección de Botiquín (Existencia y Fecha de Vencimiento de Gasas, Suero, Vendas, Inmovilizadores, Guantes)',
          'Inspección de Camilla Rígida (Correas de Sujeción, Inmovilizador Cervical y Limpieza)',
          'Observaciones y Acción Correctiva Inmediata',
        ],
      },
    ],
    reportTags: ['sgsst-equipos-emergencia'],
  },

  // ═══ HITO 6: CULTURA, ESCUELA E INNOVACIÓN (6 APLICATIVOS) ═══
  hito6_comunicaciones_sst: {
    moduleTitle: 'Hito 6 · Plan y Matriz de Comunicaciones SST (Art. 2.2.4.6.14)',
    moduleBadge: 'Hito 6 · Comunicaciones',
    fieldsLabel: 'Campos Propios de la Matriz de Comunicaciones Internas y Externas SST',
    fields: [
      'Código / ID del Registro de Comunicación SST',
      'Tema, Campaña o Información de SST a Comunicar',
      'Tipo de Comunicación (Interna / Externa / Autorreporte de Condiciones de Trabajo y Salud)',
      'Dirección del Flujo (Ascendente / Descendente / Horizontal / Partes Interesadas Externas)',
      'Emisor / Responsable de la Comunicación',
      'Público Objetivo (Trabajadores, Contratistas, Visitantes, COPASST, Alta Dirección, ARL, MinTrabajo)',
      'Canal y Medio Utilizado (Correo Electrónico, Cartelera SST, Charla de 5 Minutos, Boletín Digital, Código QR, WAPPY)',
      'Frecuencia Programada y Fecha de Divulgación',
      'Mecanismo de Recepción de Inquietudes, Ideas y Aportes de los Trabajadores (Art. 2.2.4.6.14 Parágrafo)',
      'Aporte o Inquietud Recibida del Trabajador (Cédula, Nombre y Descripción)',
      'Respuesta Oficial y Trámite Dado a la Inquietud o Sugerencia',
      'Divulgación de Política, Objetivos, Peligros, RIT/RHS y Lecciones Aprendidas ATEL',
      'Indicador de Cobertura y Alcance de la Comunicación (%)',
      'Evidencia Documental / Registro de Lectura o Asistencia',
      'Estado de la Comunicación (Divulgada / Programada / En Respuesta)',
      'Observaciones y Mejora del Canal',
    ],
    quickCombos: [
      {
        label: '⚡ Tema SST + Público Objetivo + Canal + Fecha y Evidencia',
        description: 'Resumen del plan y matriz de comunicaciones ejecutado (Art. 2.2.4.6.14)',
        fields: [
          'Tema, Campaña o Información de SST a Comunicar',
          'Tipo de Comunicación (Interna / Externa / Autorreporte de Condiciones de Trabajo y Salud)',
          'Público Objetivo (Trabajadores, Contratistas, Visitantes, COPASST, Alta Dirección, ARL, MinTrabajo)',
          'Canal y Medio Utilizado (Correo Electrónico, Cartelera SST, Charla de 5 Minutos, Boletín Digital, Código QR, WAPPY)',
          'Frecuencia Programada y Fecha de Divulgación',
          'Evidencia Documental / Registro de Lectura o Asistencia',
        ],
      },
      {
        label: '⚡ Recepción de Inquietudes, Autorreportes y Aportes de Trabajadores',
        description: 'Audita la participación ascendente de los trabajadores y su respuesta',
        fields: [
          'Mecanismo de Recepción de Inquietudes, Ideas y Aportes de los Trabajadores (Art. 2.2.4.6.14 Parágrafo)',
          'Aporte o Inquietud Recibida del Trabajador (Cédula, Nombre y Descripción)',
          'Respuesta Oficial y Trámite Dado a la Inquietud o Sugerencia',
          'Estado de la Comunicación (Divulgada / Programada / En Respuesta)',
        ],
      },
      {
        label: '⚡ Divulgación Obligatoria (Política, Peligros, RIT/RHS y Lecciones ATEL)',
        description: 'Verifica la socialización de los documentos rectores del SG-SST',
        fields: [
          'Tema, Campaña o Información de SST a Comunicar',
          'Divulgación de Política, Objetivos, Peligros, RIT/RHS y Lecciones Aprendidas ATEL',
          'Indicador de Cobertura y Alcance de la Comunicación (%)',
          'Evidencia Documental / Registro de Lectura o Asistencia',
        ],
      },
    ],
    reportTags: ['sgsst-comunicaciones'],
  },

  hito5_capacitaciones: {
    moduleTitle: 'Hito 6 · Programa Anual de Capacitación, Inducción y Reinducción SG-SST',
    moduleBadge: 'Hito 6 · Capacitaciones',
    fieldsLabel: 'Campos y Resultados Propios del Programa de Capacitación SG-SST',
    fields: [
      'Código / ID de la Actividad Formativa',
      'Tema de la Capacitación, Entrenamiento, Inducción o Reinducción',
      'Tipo de Formación (Inducción de Ingreso / Reinducción Anual / Capacitación Técnica / Entrenamiento Práctico)',
      'Eje Temático Asociado a Peligros Prioritarios (Alturas, Vial PESV, Ergonomía, Químicos SGA, Emergencias, Psicosocial)',
      'Objetivo de Aprendizaje y Contenido Temático',
      'Modalidad (Presencial / Virtual Sincrónica / E-Learning LMS / En Puesto de Trabajo)',
      'Duración (Horas) y Fecha Programada vs. Fecha Ejecutada',
      'Capacitador, Instructor o Entidad Facilitadora (ARL, Profesional SST con Licencia, Entidad Externa)',
      'Población Objetivo (Cargos / Áreas Convocadas) y Número de Convocados',
      'Listado Nominal de Asistentes (Cédula, Nombre Completo, Cargo y Firma)',
      'Trabajadores Pendientes por Asistir o sin Inducción/Reinducción',
      'Indicador de Cumplimiento del Cronograma de Capacitación (%)',
      'Indicador de Cobertura por Tema y Área (%)',
      'Evaluación de Eficacia / Retención del Conocimiento y Calificación Promedio',
      'Revisión y Aval del Programa por Parte del COPASST / Vigía SST (Art. 2.2.4.6.11)',
      'Estado de la Actividad (Ejecutada / Programada / Reprogramada / Vencida)',
    ],
    quickCombos: [
      {
        label: '⚡ Capacitaciones Pendientes + Cobertura (%) + Trabajadores Faltantes',
        description: 'Identifica qué capacitaciones, inducciones o reinducciones faltan por ejecutar',
        fields: [
          'Tema de la Capacitación, Entrenamiento, Inducción o Reinducción',
          'Tipo de Formación (Inducción de Ingreso / Reinducción Anual / Capacitación Técnica / Entrenamiento Práctico)',
          'Duración (Horas) y Fecha Programada vs. Fecha Ejecutada',
          'Trabajadores Pendientes por Asistir o sin Inducción/Reinducción',
          'Indicador de Cobertura por Tema y Área (%)',
          'Estado de la Actividad (Ejecutada / Programada / Reprogramada / Vencida)',
        ],
      },
      {
        label: '⚡ Listado de Asistentes (Cédula, Nombre y Cargo) + Evaluación de Eficacia',
        description: 'Registro de asistencia y calificaciones obtenidas por sesión',
        fields: [
          'Tema de la Capacitación, Entrenamiento, Inducción o Reinducción',
          'Capacitador, Instructor o Entidad Facilitadora (ARL, Profesional SST con Licencia, Entidad Externa)',
          'Listado Nominal de Asistentes (Cédula, Nombre Completo, Cargo y Firma)',
          'Evaluación de Eficacia / Retención del Conocimiento y Calificación Promedio',
        ],
      },
      {
        label: '⚡ Indicadores Anuales de Capacitación (Cumplimiento, Cobertura y Aval COPASST)',
        description: 'Resumen gerencial para el estándar 1.2.1 y 1.2.2 de la Resolución 0312',
        fields: [
          'Eje Temático Asociado a Peligros Prioritarios (Alturas, Vial PESV, Ergonomía, Químicos SGA, Emergencias, Psicosocial)',
          'Indicador de Cumplimiento del Cronograma de Capacitación (%)',
          'Indicador de Cobertura por Tema y Área (%)',
          'Evaluación de Eficacia / Retención del Conocimiento y Calificación Promedio',
          'Revisión y Aval del Programa por Parte del COPASST / Vigía SST (Art. 2.2.4.6.11)',
        ],
      },
    ],
    reportTags: ['sgsst-programa-capacitaciones'],
  },

  hito6_ruta_aprendizaje: {
    moduleTitle: 'Hito 6 · Rutas de Aprendizaje y Certificación (Academia WAPPY LMS)',
    moduleBadge: 'Hito 6 · Academia LMS',
    fieldsLabel: 'Campos Propios de Avance y Certificados en Academia WAPPY LMS',
    fields: [
      'Código / ID del Curso o Ruta de Aprendizaje LMS',
      'Nombre del Curso / Ruta Formativa en Academia WAPPY',
      'Categoría Técnica (Inducción SG-SST, COPASST, Convivencia, Seguridad Vial, Químicos SGA, Ergonomía, Emergencias)',
      'Nivel y Duración Certificada (Horas)',
      'Cédula / Documento del Trabajador Inscrito',
      'Nombre Completo del Trabajador Inscrito',
      'Cargo, Área / Proceso y Sede del Trabajador',
      'Fecha de Inscripción y Fecha de Último Acceso',
      'Módulos y Lecciones Completadas vs. Lecciones Pendientes',
      'Porcentaje de Avance del Curso (%)',
      'Intentos Realizados y Calificación Obtenida en Evaluaciones / Quizzes (0-100%)',
      'Puntaje Mínimo de Aprobación Exigido (%)',
      'Estado de Aprobación (Aprobado / En Curso / Reprobado / Sin Iniciar)',
      'Código de Verificación y Fecha de Emisión del Certificado Digital',
      'Vigencia del Certificado y Fecha de Renovación / Reinducción',
      'Articulación con el Perfil de Cargo y Peligros del Trabajador',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + Curso LMS + % Avance + Estado de Certificación',
        description: 'Verifica quiénes ya aprobaron sus cursos obligatorios en el LMS',
        fields: [
          'Cédula / Documento del Trabajador Inscrito',
          'Nombre Completo del Trabajador Inscrito',
          'Cargo, Área / Proceso y Sede del Trabajador',
          'Nombre del Curso / Ruta Formativa en Academia WAPPY',
          'Porcentaje de Avance del Curso (%)',
          'Estado de Aprobación (Aprobado / En Curso / Reprobado / Sin Iniciar)',
        ],
      },
      {
        label: '⚡ Trabajadores Sin Iniciar o con Cursos LMS Pendientes',
        description: 'Lista de colaboradores que requieren recordatorio de formación virtual',
        fields: [
          'Cédula / Documento del Trabajador Inscrito',
          'Nombre Completo del Trabajador Inscrito',
          'Nombre del Curso / Ruta Formativa en Academia WAPPY',
          'Módulos y Lecciones Completadas vs. Lecciones Pendientes',
          'Porcentaje de Avance del Curso (%)',
          'Fecha de Inscripción y Fecha de Último Acceso',
        ],
      },
      {
        label: '⚡ Calificaciones de Quizzes, Certificados Emitidos y Vigencia',
        description: 'Soportes de evaluación de eficacia y certificados digitales para auditoría',
        fields: [
          'Cédula / Documento del Trabajador Inscrito',
          'Nombre Completo del Trabajador Inscrito',
          'Nombre del Curso / Ruta Formativa en Academia WAPPY',
          'Intentos Realizados y Calificación Obtenida en Evaluaciones / Quizzes (0-100%)',
          'Código de Verificación y Fecha de Emisión del Certificado Digital',
          'Vigencia del Certificado y Fecha de Renovación / Reinducción',
        ],
      },
    ],
    reportTags: ['sgsst-programa-capacitaciones'],
  },

  hito4_actos_condiciones: {
    moduleTitle: 'Hito 6 · Reporte de Actos y Condiciones Inseguras en Campo',
    moduleBadge: 'Hito 6 · Reportes Campo',
    fieldsLabel: 'Campos Propios de Reportes de Actos y Condiciones Inseguras',
    fields: [
      'Código / ID del Reporte y Fecha/Hora de Registro',
      'Canal de Captura (Código QR en Campo / Portal Trabajador / Inspección COPASST / Recorrido SST)',
      'Clasificación del Hallazgo (Acto Inseguro / Condición Insegura / Casi-Accidente / Condición de Salud)',
      'Peligro Asociado (Locativo, Mecánico, Eléctrico, Físico, Químico, Biomecánico, Vial, Alturas)',
      'Cédula / Documento del Trabajador que Reporta',
      'Nombre Completo y Cargo de Quien Reporta',
      'Sede, Área, Proceso y Ubicación Exacta del Hallazgo',
      'Descripción Detallada del Acto o Condición Insegura Observada',
      'Evidencia Fotográfica Inicial Adjunta',
      'Potencial de Severidad / Prioridad de Intervención (Crítica / Alta / Media / Baja)',
      'Control o Corrección Inmediata Aplicada en Sitio',
      'Acción Correctiva / Preventiva Definitiva Propuesta',
      'Responsable Asignado para el Cierre y Fecha Límite',
      'Estado del Reporte (Abierto / En Gestión / Cerrado Verificado)',
      'Fecha de Cierre y Evidencia Fotográfica del Después (Antes vs. Después)',
      'Conexión con Tablero Kanban ACPM y Matriz IPEVR',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Reportes Abiertos (Prioridad Crítica/Alta) + Ubicación + Acción',
        description: 'Filtra hallazgos de campo sin cerrar para gestión inmediata',
        fields: [
          'Código / ID del Reporte y Fecha/Hora de Registro',
          'Clasificación del Hallazgo (Acto Inseguro / Condición Insegura / Casi-Accidente / Condición de Salud)',
          'Sede, Área, Proceso y Ubicación Exacta del Hallazgo',
          'Descripción Detallada del Acto o Condición Insegura Observada',
          'Potencial de Severidad / Prioridad de Intervención (Crítica / Alta / Media / Baja)',
          'Acción Correctiva / Preventiva Definitiva Propuesta',
          'Estado del Reporte (Abierto / En Gestión / Cerrado Verificado)',
        ],
      },
      {
        label: '⚡ Participación de Trabajadores (Quién Reporta + Cédula + Canal QR)',
        description: 'Mide la cultura de autorreporte de condiciones inseguras (Estándar 2.5.1 / 4.2.4)',
        fields: [
          'Cédula / Documento del Trabajador que Reporta',
          'Nombre Completo y Cargo de Quien Reporta',
          'Canal de Captura (Código QR en Campo / Portal Trabajador / Inspección COPASST / Recorrido SST)',
          'Clasificación del Hallazgo (Acto Inseguro / Condición Insegura / Casi-Accidente / Condición de Salud)',
          'Descripción Detallada del Acto o Condición Insegura Observada',
        ],
      },
      {
        label: '⚡ Seguimiento de Cierre, Responsables y Evidencia Antes/Después',
        description: 'Verifica la eficacia de cierre de condiciones subestándar reportadas',
        fields: [
          'Código / ID del Reporte y Fecha/Hora de Registro',
          'Sede, Área, Proceso y Ubicación Exacta del Hallazgo',
          'Responsable Asignado para el Cierre y Fecha Límite',
          'Estado del Reporte (Abierto / En Gestión / Cerrado Verificado)',
          'Fecha de Cierre y Evidencia Fotográfica del Después (Antes vs. Después)',
        ],
      },
    ],
    reportTags: ['sgsst-reporte-actos'],
  },

  hito6_simulacros_emergencia: {
    moduleTitle: 'Hito 6 · Gestión y Evaluación de Simulacros de Emergencia',
    moduleBadge: 'Hito 6 · Simulacros',
    fieldsLabel: 'Campos Propios de Planeación y Evaluación de Simulacros',
    fields: [
      'Código / Consecutivo del Simulacro y Fecha / Hora de Ejecución',
      'Tipo de Simulacro (Avisado / No Avisado — Escritorio / Parcial / Evacuación Total)',
      'Escenario de Amenaza Simulado (Sismo, Incendio, Fuga Química, Explosión, Atención de Lesionado)',
      'Sede, Edificio y Áreas Participantes',
      'Guion Técnico y Objetivos Específicos del Simulacro',
      'Total de Personas Evacuadas (Trabajadores, Contratistas y Visitantes)',
      'Personas que No Evacuaron y Causa Identificada',
      'Tiempo de Detección y Activación de la Alarma',
      'Tiempo de Salida del Primer y Último Evacuado',
      'Tiempo Total de Llegada y Conteo en el Punto de Encuentro (Minutos y Segundos)',
      'Evaluación del Sistema de Alarma, Señalización e Iluminación de Emergencia',
      'Evaluación del Desempeño de la Brigada, Líderes de Evacuación y Comité de Crisis (SCI)',
      'Uso de Equipos de Emergencia Durante el Ejercicio (Camillas, Botiquín, Extintores, Megáfono)',
      'Fortalezas Observadas Durante el Simulacro',
      'Fallos, Cuellos de Botella u Oportunidades de Mejora Detectadas',
      'Plan de Acción Post-Simulacro, Responsables y Fechas de Cierre',
      'Acta Oficial del Simulacro Firmada y Registro Fotográfico (Art. 2.2.4.6.25 Num. 10)',
    ],
    quickCombos: [
      {
        label: '⚡ Escenario + Evacuados + Tiempo de Respuesta + Oportunidades de Mejora',
        description: 'Síntesis del informe anual de simulacro (Art. 2.2.4.6.25 Num. 10)',
        fields: [
          'Código / Consecutivo del Simulacro y Fecha / Hora de Ejecución',
          'Escenario de Amenaza Simulado (Sismo, Incendio, Fuga Química, Explosión, Atención de Lesionado)',
          'Sede, Edificio y Áreas Participantes',
          'Total de Personas Evacuadas (Trabajadores, Contratistas y Visitantes)',
          'Tiempo Total de Llegada y Conteo en el Punto de Encuentro (Minutos y Segundos)',
          'Fallos, Cuellos de Botella u Oportunidades de Mejora Detectadas',
        ],
      },
      {
        label: '⚡ Tiempos de Evacuación, Alarma, Rutas y Desempeño de la Brigada',
        description: 'Métricas operativas de respuesta y tiempos por fase del ejercicio',
        fields: [
          'Tiempo de Detección y Activación de la Alarma',
          'Tiempo de Salida del Primer y Último Evacuado',
          'Tiempo Total de Llegada y Conteo en el Punto de Encuentro (Minutos y Segundos)',
          'Evaluación del Sistema de Alarma, Señalización e Iluminación de Emergencia',
          'Evaluación del Desempeño de la Brigada, Líderes de Evacuación y Comité de Crisis (SCI)',
        ],
      },
      {
        label: '⚡ Plan de Acción Post-Simulacro y Acta Oficial Firmada',
        description: 'Compromisos de mejora continua del Plan de Emergencias tras el simulacro',
        fields: [
          'Escenario de Amenaza Simulado (Sismo, Incendio, Fuga Química, Explosión, Atención de Lesionado)',
          'Fortalezas Observadas Durante el Simulacro',
          'Fallos, Cuellos de Botella u Oportunidades de Mejora Detectadas',
          'Plan de Acción Post-Simulacro, Responsables y Fechas de Cierre',
          'Acta Oficial del Simulacro Firmada y Registro Fotográfico (Art. 2.2.4.6.25 Num. 10)',
        ],
      },
    ],
    reportTags: ['sgsst-simulacros-emergencia'],
  },

  hito6_app_builder: {
    moduleTitle: 'Hito 6 · Creador de Aplicativos y Formularios SST (App Builder)',
    moduleBadge: 'Hito 6 · App Builder',
    fieldsLabel: 'Campos del Micro-Aplicativo Personalizado SST',
    fields: [
      'Código / ID del Micro-Aplicativo o Formulario Personalizado',
      'Nombre del Micro-Aplicativo / Inspección Digital Creada',
      'Categoría Operativa (Inspección Locativa, Maquinaria, Herramientas, Orden y Aseo 5S, Pausas Activas, Encuesta SST)',
      'Sede y Proceso al que Aplica',
      'Estructura de Campos y Preguntas Configuradas en el Formulario',
      'Criterios de Calificación y Ponderación de Cumplimiento (%)',
      'Enlace Público / Código QR de Captura en Terreno',
      'Total de Registros e Inspecciones Recibidas',
      'Fecha y Usuario / Trabajador del Último Registro (Cédula y Nombre)',
      'Tabulación de Respuestas y Puntaje Promedio de Cumplimiento (%)',
      'Ítems Calificados como No Conformes o Deficientes',
      'Hallazgos Críticos y Alertas Automáticas Generadas',
      'Evidencias Fotográficas y Firmas Capturadas en el Aplicativo',
      'Acciones Correctivas Derivadas hacia ACPM',
      'Responsable de Seguimiento y Fecha de Cierre',
      'Estado del Micro-Aplicativo (Activo en Producción / En Diseño / Cerrado)',
    ],
    quickCombos: [
      {
        label: '⚡ Aplicativo Personalizado + Registros Recibidos + Hallazgos Críticos',
        description: 'Extrae los resultados y hallazgos de las inspecciones personalizadas creadas',
        fields: [
          'Nombre del Micro-Aplicativo / Inspección Digital Creada',
          'Categoría Operativa (Inspección Locativa, Maquinaria, Herramientas, Orden y Aseo 5S, Pausas Activas, Encuesta SST)',
          'Total de Registros e Inspecciones Recibidas',
          'Tabulación de Respuestas y Puntaje Promedio de Cumplimiento (%)',
          'Hallazgos Críticos y Alertas Automáticas Generadas',
        ],
      },
      {
        label: '⚡ Ítems No Conformes, Evidencias y Acciones Correctivas hacia ACPM',
        description: 'Conecta los formularios personalizados con planes de acción correctiva',
        fields: [
          'Nombre del Micro-Aplicativo / Inspección Digital Creada',
          'Ítems Calificados como No Conformes o Deficientes',
          'Evidencias Fotográficas y Firmas Capturadas en el Aplicativo',
          'Acciones Correctivas Derivadas hacia ACPM',
          'Responsable de Seguimiento y Fecha de Cierre',
        ],
      },
      {
        label: '⚡ Diseño del Formulario, Campos Capturados y Últimos Reportantes',
        description: 'Detalle de estructura y trazabilidad de usuarios que diligencian la app',
        fields: [
          'Nombre del Micro-Aplicativo / Inspección Digital Creada',
          'Estructura de Campos y Preguntas Configuradas en el Formulario',
          'Fecha y Usuario / Trabajador del Último Registro (Cédula y Nombre)',
          'Estado del Micro-Aplicativo (Activo en Producción / En Diseño / Cerrado)',
        ],
      },
    ],
    reportTags: ['sgsst-live-editor'],
  },

  // ═══ HITO 7: AUDITORÍA, CAUSALIDAD Y MEJORA CONTINUA (6 APLICATIVOS) ═══
  hito7_estadisticas_atel: {
    moduleTitle: 'Hito 7 · Gestión Integral de Ausentismo e Indicadores ATEL (Res. 0312 Art. 30)',
    moduleBadge: 'Hito 7 · Ausentismo & ATEL',
    fieldsLabel: 'Indicadores Oficiales Res. 0312 Art. 30 y Registros de Ausentismo',
    fields: [
      'Período / Mes y Año Analizado',
      'Número Promedio de Trabajadores en el Período y Horas Hombre Trabajadas (HHT)',
      'Número de Accidentes de Trabajo (AT) en el Período y Acumulado Anual',
      'Días de Incapacidad por Accidente de Trabajo + Días Cargados',
      'Frecuencia de Accidentalidad (N° AT en el mes / N° Trabajadores x 100)',
      'Severidad de Accidentalidad (Días de incapacidad por AT + días cargados / N° Trabajadores x 100)',
      'Proporción de Accidentes de Trabajo Mortales (%)',
      'Prevalencia de la Enfermedad Laboral (Casos nuevos y antiguos EL / Trabajadores x 100.000)',
      'Incidencia de la Enfermedad Laboral (Casos nuevos EL / Trabajadores x 100.000)',
      'Ausentismo por Causa Médica (Días de ausencia por incapacidad laboral o común / Días programados x 100)',
      'Índice de Lesiones Incapacitantes (ILI) y Tasa de Accidentalidad',
      'Cédula y Nombre Completo del Trabajador con Incapacidad / Ausentismo',
      'Cargo, Área y Entidad Emisora (EPS / ARL)',
      'Tipo de Ausentismo (Accidente de Trabajo AT / Enfermedad Laboral EL / Enfermedad General EG / Licencia)',
      'Código Diagnóstico CIE-10, Sistema Corporal Afectado y Descripción',
      'Fecha Inicio, Fecha Fin, Total Días Perdidos e Indicador de Prórroga (>90 / >180 días)',
      'Análisis de Tendencia, Costos Directos/Indirectos y Plan de Control de Ausentismo',
    ],
    quickCombos: [
      {
        label: '⚡ Los 6 Indicadores Mínimos Obligatorios Res. 0312 Art. 30',
        description: 'Frecuencia, Severidad, Mortalidad, Prevalencia, Incidencia y Ausentismo',
        fields: [
          'Período / Mes y Año Analizado',
          'Frecuencia de Accidentalidad (N° AT en el mes / N° Trabajadores x 100)',
          'Severidad de Accidentalidad (Días de incapacidad por AT + días cargados / N° Trabajadores x 100)',
          'Proporción de Accidentes de Trabajo Mortales (%)',
          'Prevalencia de la Enfermedad Laboral (Casos nuevos y antiguos EL / Trabajadores x 100.000)',
          'Incidencia de la Enfermedad Laboral (Casos nuevos EL / Trabajadores x 100.000)',
          'Ausentismo por Causa Médica (Días de ausencia por incapacidad laboral o común / Días programados x 100)',
        ],
      },
      {
        label: '⚡ Cédula + Nombre + Diagnóstico CIE-10 + Días de Incapacidad y Prórrogas',
        description: 'Listado nominal de trabajadores con incapacidades o ausentismo prolongado',
        fields: [
          'Cédula y Nombre Completo del Trabajador con Incapacidad / Ausentismo',
          'Cargo, Área y Entidad Emisora (EPS / ARL)',
          'Tipo de Ausentismo (Accidente de Trabajo AT / Enfermedad Laboral EL / Enfermedad General EG / Licencia)',
          'Código Diagnóstico CIE-10, Sistema Corporal Afectado y Descripción',
          'Fecha Inicio, Fecha Fin, Total Días Perdidos e Indicador de Prórroga (>90 / >180 días)',
        ],
      },
      {
        label: '⚡ Análisis Epidemiológico, HHT, ILI y Plan de Control de Ausentismo',
        description: 'Tendencias por sistema corporal, costos y acciones preventivas',
        fields: [
          'Número Promedio de Trabajadores en el Período y Horas Hombre Trabajadas (HHT)',
          'Número de Accidentes de Trabajo (AT) en el Período y Acumulado Anual',
          'Días de Incapacidad por Accidente de Trabajo + Días Cargados',
          'Índice de Lesiones Incapacitantes (ILI) y Tasa de Accidentalidad',
          'Análisis de Tendencia, Costos Directos/Indirectos y Plan de Control de Ausentismo',
        ],
      },
    ],
    reportTags: ['sgsst-estadisticas-atel'],
  },

  hito7_investigacion_atel: {
    moduleTitle: 'Hito 7 · Investigación de Accidentes e Incidentes de Trabajo (Res. 1401 de 2007)',
    moduleBadge: 'Hito 7 · Investigación ATEL',
    fieldsLabel: 'Campos, Causalidad y Plan de Acción Propios de Investigación ATEL',
    fields: [
      'Código / ID del Caso y Número de Radicado FURAT / FUREL',
      'Clasificación del Evento (Incidente / Accidente Leve / Accidente Grave Res. 1401 / Mortal)',
      'Fecha del Evento,Fecha de Investigación (Plazo Legal ≤ 15 Días Calendario)',
      'Cédula / Documento del Trabajador Accidentado',
      'Nombre Completo, Edad, Cargo, Antigüedad, EPS y ARL del Trabajador',
      'Sede, Área, Turno, Hora Exacta y Lugar del Evento',
      'Descripción Detallada y Relato Cronológico del Evento',
      'Naturaleza de la Lesión y Parte del Cuerpo Afectada (Codificación ANSI Z16.2)',
      'Agente del Accidente y Mecanismo o Forma del Accidente',
      'Días de Incapacidad Iniciales y Prórrogas Generadas',
      'Versión del Trabajador y Declaraciones de Testigos Presenciales',
      'Metodología de Análisis Causal Utilizada (Árbol de Causas / 5 Porqués / Espina de Pescado Ishikawa / NTC 3701)',
      'Causas Inmediatas: Actos Subestándar (Inseguros) y Condiciones Subestándar (Ambientales)',
      'Causas Básicas: Factores Personales y Factores del Trabajo',
      'Medidas de Intervención en la Fuente, en el Medio y en el Trabajador (con Responsables y Fechas)',
      'Equipo Investigador (Jefe Inmediato, Representante COPASST, Responsable SST y Profesional con Licencia SST en AT Grave)',
      'Remisión a ARL dentro de los 15 días y Lección Aprendida Socializada',
      'Estado del Caso ATEL (En Investigación / Plan de Acción Abierto / Cerrado con Eficacia)',
    ],
    quickCombos: [
      {
        label: '⚡ Trabajador (Cédula/Nombre) + Evento + Causas Básicas/Inmediatas + Plan de Acción',
        description: 'Síntesis completa de la investigación conforme a la Resolución 1401 de 2007',
        fields: [
          'Cédula / Documento del Trabajador Accidentado',
          'Nombre Completo, Edad, Cargo, Antigüedad, EPS y ARL del Trabajador',
          'Clasificación del Evento (Incidente / Accidente Leve / Accidente Grave Res. 1401 / Mortal)',
          'Causas Inmediatas: Actos Subestándar (Inseguros) y Condiciones Subestándar (Ambientales)',
          'Causas Básicas: Factores Personales y Factores del Trabajo',
          'Medidas de Intervención en la Fuente, en el Medio y en el Trabajador (con Responsables y Fechas)',
        ],
      },
      {
        label: '⚡ Caracterización Técnica ANSI Z16.2 (Lesión, Parte Afectada, Agente y Mecanismo)',
        description: 'Variables clínicas y operativas del FURAT e incapacidades generadas',
        fields: [
          'Código / ID del Caso y Número de Radicado FURAT / FUREL',
          'Nombre Completo, Edad, Cargo, Antigüedad, EPS y ARL del Trabajador',
          'Sede, Área, Turno, Hora Exacta y Lugar del Evento',
          'Naturaleza de la Lesión y Parte del Cuerpo Afectada (Codificación ANSI Z16.2)',
          'Agente del Accidente y Mecanismo o Forma del Accidente',
          'Días de Incapacidad Iniciales y Prórrogas Generadas',
        ],
      },
      {
        label: '⚡ Cumplimiento Legal Res. 1401 (Plazo 15 Días, Equipo Investigador y Lección Aprendida)',
        description: 'Audita la firma del equipo investigador, remisión a ARL y cierre de medidas',
        fields: [
          'Código / ID del Caso y Número de Radicado FURAT / FUREL',
          'Fecha del Evento,Fecha de Investigación (Plazo Legal ≤ 15 Días Calendario)',
          'Equipo Investigador (Jefe Inmediato, Representante COPASST, Responsable SST y Profesional con Licencia SST en AT Grave)',
          'Remisión a ARL dentro de los 15 días y Lección Aprendida Socializada',
          'Estado del Caso ATEL (En Investigación / Plan de Acción Abierto / Cerrado con Eficacia)',
        ],
      },
    ],
    reportTags: ['sgsst-investigacion-atel'],
  },

  hito7_acpm: {
    moduleTitle: 'Hito 7 · Tablero Kanban de Acciones Correctivas, Preventivas y de Mejora (ACPM)',
    moduleBadge: 'Hito 7 · Kanban ACPM',
    fieldsLabel: 'Campos Propios del Centro de Control Kanban ACPM',
    fields: [
      'Código / ID de la Acción ACPM y Fecha de Apertura',
      'Fuente del Hallazgo (Auditoría Anual, Diagnóstico 0312, Investigación ATEL, COPASST, Inspección de Campo, Revisión Alta Dirección, PVE)',
      'Hito y Aplicativo de Origen Vinculado',
      'Tipo de Acción (Acción Correctiva / Acción Preventiva / Acción de Mejora)',
      'Prioridad / Criticidad del Hallazgo (Crítica / Alta / Media / Baja)',
      'Descripción Detallada del Hallazgo o No Conformidad Detectada',
      'Metodología y Análisis de Causa Raíz (5 Porqués / Ishikawa)',
      'Descripción del Plan de Acción y Actividades Específicas a Ejecutar',
      'Responsable de Ejecución (Nombre y Cargo)',
      'Recursos Humanos, Técnicos y Financieros Asignados',
      'Fecha de Inicio y Fecha Límite de Compromiso / Vencimiento',
      'Días Restantes o Días de Retraso frente a la Fecha Límite',
      'Estado en Tablero Kanban (Pendiente / En Proceso / En Verificación / Cerrada / Vencida)',
      'Porcentaje de Avance de la Acción (%)',
      'Evidencia Documental o Fotográfica del Cierre',
      'Fecha de Verificación y Concepto de Eficacia de la Acción (Eficaz / No Eficaz - Reabierta)',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Acciones ACPM Abiertas o Vencidas + Responsable + Fecha Límite',
        description: 'Ideal para recordatorios automáticos de tareas pendientes por correo',
        fields: [
          'Código / ID de la Acción ACPM y Fecha de Apertura',
          'Fuente del Hallazgo (Auditoría Anual, Diagnóstico 0312, Investigación ATEL, COPASST, Inspección de Campo, Revisión Alta Dirección, PVE)',
          'Prioridad / Criticidad del Hallazgo (Crítica / Alta / Media / Baja)',
          'Descripción del Plan de Acción y Actividades Específicas a Ejecutar',
          'Responsable de Ejecución (Nombre y Cargo)',
          'Fecha de Inicio y Fecha Límite de Compromiso / Vencimiento',
          'Estado en Tablero Kanban (Pendiente / En Proceso / En Verificación / Cerrada / Vencida)',
        ],
      },
      {
        label: '⚡ Análisis de Causa Raíz, Tipo de Acción (AC/AP/AM) y Recursos',
        description: 'Detalle metodológico del artículo 2.2.4.6.33 y 2.2.4.6.34 del Decreto 1072',
        fields: [
          'Código / ID de la Acción ACPM y Fecha de Apertura',
          'Tipo de Acción (Acción Correctiva / Acción Preventiva / Acción de Mejora)',
          'Descripción Detallada del Hallazgo o No Conformidad Detectada',
          'Metodología y Análisis de Causa Raíz (5 Porqués / Ishikawa)',
          'Descripción del Plan de Acción y Actividades Específicas a Ejecutar',
          'Recursos Humanos, Técnicos y Financieros Asignados',
        ],
      },
      {
        label: '⚡ Verificación de Cierre, Evidencias y Eficacia de Acciones ACPM',
        description: 'Audita las acciones cerradas y su efectividad real en el SG-SST',
        fields: [
          'Código / ID de la Acción ACPM y Fecha de Apertura',
          'Descripción del Plan de Acción y Actividades Específicas a Ejecutar',
          'Estado en Tablero Kanban (Pendiente / En Proceso / En Verificación / Cerrada / Vencida)',
          'Porcentaje de Avance de la Acción (%)',
          'Evidencia Documental o Fotográfica del Cierre',
          'Fecha de Verificación y Concepto de Eficacia de la Acción (Eficaz / No Eficaz - Reabierta)',
        ],
      },
    ],
    reportTags: ['sgsst-diagnostico', 'sgsst-auditoria'],
  },

  hito7_auditoria: {
    moduleTitle: 'Hito 7 · Informe de Auditoría Anual del SG-SST (Art. 2.2.4.6.29 y 2.2.4.6.30)',
    moduleBadge: 'Hito 7 · Auditoría Anual',
    fieldsLabel: 'Campos, Hallazgos y No Conformidades del Informe de Auditoría SG-SST',
    fields: [
      'Código / Ciclo Anual de Auditoría y Fecha de Ejecución',
      'Programa y Plan de Auditoría Anual Aprobado',
      'Equipo Auditor (Auditor Líder, Idoneidad/Licencia y Participación Obligatoria del COPASST / Vigía)',
      'Alcance de la Auditoría: Evaluación de los 22 Numerales del Art. 2.2.4.6.30 (Decreto 1072)',
      'Verificación de Cumplimiento de la Política de SST y Objetivos',
      'Resultado de los Indicadores de Estructura, Proceso y Resultado',
      'Evaluación de la Participación de los Trabajadores y Funcionamiento del COPASST / CCL',
      'Evaluación de la Gestión de Peligros, Riesgos y Medidas de Prevención y Control',
      'Evaluación del Plan de Emergencias, Capacitación, Contratistas y Gestión del Cambio',
      'Evaluación de Investigaciones ATEL y Cierre de Auditorías Anteriores',
      'Conformidades y Fortalezas Destacadas del SG-SST',
      'No Conformidades Mayores Detectadas (Numeral Legal, Requisito Incumplido y Evidencia Objetiva)',
      'No Conformidades Menores Detectadas (Numeral Legal y Evidencia Objetiva)',
      'Observaciones y Oportunidades de Mejora Identificadas',
      'Porcentaje de Conformidad Global de la Auditoría (%)',
      'Conclusiones de Eficacia del SG-SST y Comunicación de Resultados a las Partes Interesadas',
      'Plan de Cierre de No Conformidades Vinculado al Tablero ACPM',
    ],
    quickCombos: [
      {
        label: '⚡ No Conformidades (Mayores/Menores) + Observaciones + Plan de Cierre ACPM',
        description: 'Extrae únicamente los hallazgos abiertos de la auditoría anual',
        fields: [
          'Código / Ciclo Anual de Auditoría y Fecha de Ejecución',
          'No Conformidades Mayores Detectadas (Numeral Legal, Requisito Incumplido y Evidencia Objetiva)',
          'No Conformidades Menores Detectadas (Numeral Legal y Evidencia Objetiva)',
          'Observaciones y Oportunidades de Mejora Identificadas',
          'Plan de Cierre de No Conformidades Vinculado al Tablero ACPM',
        ],
      },
      {
        label: '⚡ Evaluación de los 22 Puntos de Alcance Legal (Art. 2.2.4.6.30 Dec. 1072)',
        description: 'Revisión sistemática de todos los elementos obligatorios de auditoría',
        fields: [
          'Alcance de la Auditoría: Evaluación de los 22 Numerales del Art. 2.2.4.6.30 (Decreto 1072)',
          'Verificación de Cumplimiento de la Política de SST y Objetivos',
          'Resultado de los Indicadores de Estructura, Proceso y Resultado',
          'Evaluación de la Gestión de Peligros, Riesgos y Medidas de Prevención y Control',
          'Evaluación de Investigaciones ATEL y Cierre de Auditorías Anteriores',
        ],
      },
      {
        label: '⚡ Resumen Ejecutivo de Auditoría, Equipo Auditor, COPASST y % Conformidad',
        description: 'Síntesis del dictamen de auditoría para la Revisión por la Alta Dirección',
        fields: [
          'Equipo Auditor (Auditor Líder, Idoneidad/Licencia y Participación Obligatoria del COPASST / Vigía)',
          'Conformidades y Fortalezas Destacadas del SG-SST',
          'Porcentaje de Conformidad Global de la Auditoría (%)',
          'Conclusiones de Eficacia del SG-SST y Comunicación de Resultados a las Partes Interesadas',
        ],
      },
    ],
    reportTags: ['sgsst-auditoria'],
  },

  hito7_alta_direccion: {
    moduleTitle: 'Hito 7 · Revisión por la Alta Dirección (24 Ítems Dec. 1072 Art. 2.2.4.6.31)',
    moduleBadge: 'Hito 7 · Alta Dirección',
    fieldsLabel: 'Campos y Decisiones Gerenciales de la Revisión por la Alta Dirección',
    fields: [
      'Fecha de la Revisión Anual y Período Evaluado',
      'Representante Legal y Directivos Participantes en la Revisión',
      'Verificación de los 24 Aspectos Obligatorios del Art. 2.2.4.6.31 (Decreto 1072 de 2015)',
      'Cumplimiento de la Política y los Objetivos del SG-SST',
      'Cumplimiento del Plan de Trabajo Anual en SST y su Cronograma (%)',
      'Ejecución del Presupuesto y Suficiencia de Recursos Financieros, Técnicos y Humanos',
      'Resultado de los Indicadores de Estructura, Proceso y Resultado (Art. 30 Res. 0312)',
      'Adecuación de la Identificación de Peligros, Evaluación de Riesgos y Controles (IPEVR)',
      'Gestiones y Resultados del COPASST / Vigía y del Comité de Convivencia Laboral (CCL)',
      'Investigación de Incidentes, Accidentes de Trabajo y Enfermedades Laborales (ATEL)',
      'Ausentismo Laboral por Causa Médica y Programas de Vigilancia Epidemiológica (PVE)',
      'Resultados de Auditorías Internas, Inspecciones y Revisiones Gerenciales Anteriores',
      'Cambios Normativos, Organizacionales o de Procesos (Gestión del Cambio MOC)',
      'Estado de Acciones Correctivas, Preventivas y de Mejora (ACPM)',
      'Decisiones Estratégicas de la Alta Dirección, Nuevas Metas y Reasignación de Recursos',
      'Comunicación Oficial de los Resultados al COPASST y al Responsable del SG-SST',
      'Firma Digital del Representante Legal y del Responsable del SG-SST',
    ],
    quickCombos: [
      {
        label: '⚡ Evaluación de los 24 Ítems + Decisiones Gerenciales + Presupuesto Aprobado',
        description: 'Resumen gerencial para el Representante Legal y COPASST (Art. 2.2.4.6.31)',
        fields: [
          'Fecha de la Revisión Anual y Período Evaluado',
          'Verificación de los 24 Aspectos Obligatorios del Art. 2.2.4.6.31 (Decreto 1072 de 2015)',
          'Cumplimiento del Plan de Trabajo Anual en SST y su Cronograma (%)',
          'Ejecución del Presupuesto y Suficiencia de Recursos Financieros, Técnicos y Humanos',
          'Decisiones Estratégicas de la Alta Dirección, Nuevas Metas y Reasignación de Recursos',
        ],
      },
      {
        label: '⚡ Balance de Indicadores ATEL, Ausentismo, PVE, Auditorías y ACPM',
        description: 'Desempeño técnico y epidemiológico presentado a la gerencia',
        fields: [
          'Resultado de los Indicadores de Estructura, Proceso y Resultado (Art. 30 Res. 0312)',
          'Investigación de Incidentes, Accidentes de Trabajo y Enfermedades Laborales (ATEL)',
          'Ausentismo Laboral por Causa Médica y Programas de Vigilancia Epidemiológica (PVE)',
          'Resultados de Auditorías Internas, Inspecciones y Revisiones Gerenciales Anteriores',
          'Estado de Acciones Correctivas, Preventivas y de Mejora (ACPM)',
        ],
      },
      {
        label: '⚡ Acta Firmada por Representante Legal y Comunicación al COPASST',
        description: 'Soporte documental de cierre del ciclo PHVA (Estándar 1.1.1 / 3.1.1)',
        fields: [
          'Representante Legal y Directivos Participantes en la Revisión',
          'Decisiones Estratégicas de la Alta Dirección, Nuevas Metas y Reasignación de Recursos',
          'Comunicación Oficial de los Resultados al COPASST y al Responsable del SG-SST',
          'Firma Digital del Representante Legal y del Responsable del SG-SST',
        ],
      },
    ],
    reportTags: ['sgsst-alta-direccion'],
  },

  hito7_investigacion_profunda: {
    moduleTitle: 'Hito 7 · Investigación Profunda de Doctrina y Jurisprudencia SST',
    moduleBadge: 'Hito 7 · Doctrina SST',
    fieldsLabel: 'Campos Propios de Investigación Jurídica y Técnica Profunda SST',
    fields: [
      'Código / ID del Expediente o Consulta Jurídico-Técnica',
      'Título y Problema Jurídico / Técnico Investigado en SST',
      'Contexto Fáctico del Caso en la Empresa (Trabajador, Cargo, Evento o Hallazgo)',
      'Normativa Colombiana Vigente Aplicable (Leyes, Decretos, Resoluciones y Circulares MinTrabajo)',
      'Jurisprudencia de la Corte Constitucional (Estabilidad Laboral Reforzada, Debilidad Manifiesta, Reubicación)',
      'Jurisprudencia de la Corte Suprema de Justicia — Sala Laboral (Culpa Patronal Art. 216 CST, Carga de la Prueba)',
      'Conceptos Técnicos y Doctrina Oficial del Ministerio del Trabajo y ARL',
      'Estándares Técnicos Internacionales de Referencia (OIT, ISO 45001, NIOSH, OSHA, NFPA)',
      'Análisis de Responsabilidad Laboral (Prestaciones Tarifadas ARL)',
      'Análisis de Responsabilidad Civil y Culpa Patronal (Indemnización Total y Ordinaria de Perjuicios)',
      'Análisis de Responsabilidad Administrativa (Multas MinTrabajo Dec. 1072 / Ley 1562)',
      'Análisis de Responsabilidad Penal (Dolo o Culpa por Omisión de Controles)',
      'Valoración Probatoria de los Soportes Existentes en la Empresa',
      'Brechas Probatorias o Riesgos de Sanción / Demanda Detectados',
      'Dictamen Jurídico-Técnico Final y Concepto de Blindaje Legal',
      'Plan de Acción Preventivo y Documental Recomendado',
    ],
    quickCombos: [
      {
        label: '⚡ Caso Investigado + Normativa y Sentencias (Corte Constitucional/CSJ) + Dictamen',
        description: 'Concepto jurídico-técnico fundamentado en jurisprudencia colombiana',
        fields: [
          'Título y Problema Jurídico / Técnico Investigado en SST',
          'Normativa Colombiana Vigente Aplicable (Leyes, Decretos, Resoluciones y Circulares MinTrabajo)',
          'Jurisprudencia de la Corte Constitucional (Estabilidad Laboral Reforzada, Debilidad Manifiesta, Reubicación)',
          'Jurisprudencia de la Corte Suprema de Justicia — Sala Laboral (Culpa Patronal Art. 216 CST, Carga de la Prueba)',
          'Dictamen Jurídico-Técnico Final y Concepto de Blindaje Legal',
        ],
      },
      {
        label: '⚡ Matriz deLas 4 Responsabilidades en SST (Laboral, Civil, Administrativa y Penal)',
        description: 'Evaluación del nivel de exposición legal del empleador y representante legal',
        fields: [
          'Contexto Fáctico del Caso en la Empresa (Trabajador, Cargo, Evento o Hallazgo)',
          'Análisis de Responsabilidad Laboral (Prestaciones Tarifadas ARL)',
          'Análisis de Responsabilidad Civil y Culpa Patronal (Indemnización Total y Ordinaria de Perjuicios)',
          'Análisis de Responsabilidad Administrativa (Multas MinTrabajo Dec. 1072 / Ley 1562)',
          'Análisis de Responsabilidad Penal (Dolo o Culpa por Omisión de Controles)',
        ],
      },
      {
        label: '⚡ Auditoría Probatoria, Brechas de Defensa y Plan de Blindaje Documental',
        description: 'Identifica qué soportes faltan para defender a la empresa ante MinTrabajo o jueces',
        fields: [
          'Valoración Probatoria de los Soportes Existentes en la Empresa',
          'Brechas Probatorias o Riesgos de Sanción / Demanda Detectados',
          'Dictamen Jurídico-Técnico Final y Concepto de Blindaje Legal',
          'Plan de Acción Preventivo y Documental Recomendado',
        ],
      },
    ],
    reportTags: ['sgsst-investigacion-profunda'],
  },

  // ═══ HITO 8: INTELIGENCIA ARTIFICIAL & ORÁCULO PREDICTIVO (1 APLICATIVO) ═══
  hito8_predictivo: {
    moduleTitle: 'Hito 8 · Centro de Inteligencia Predictiva y Gemelo Digital SST',
    moduleBadge: 'Hito 8 · IA Predictiva',
    fieldsLabel: 'Indicadores, Gemelo Digital, Radares y Alertas del Centro de Inteligencia Predictiva',
    fields: [
      'Score Global de Salud y Blindaje Predictivo del SG-SST (0-100%)',
      'Estado del Gemelo Digital SST en Vivo y Nivel de Madurez Global (Óptimo / Preventivo / Alerta / Crítico)',
      'Radar de los 9 Dominios del SG-SST (Gobernanza 0312, Salud/EMO, Ergonómico, Psicosocial, Seguridad Vial PESV, Químico SGA, Trabajo en Alturas, Emergencias, Auditoría/ACPM)',
      'Dominios con Mayor Vulnerabilidad o Deterioro Detectado',
      'Cédula y Nombre Completo de Trabajadores en Alerta Predictiva',
      'Cargo, Área y Puntaje FIT Biocéntrico del Trabajador en Alerta (%)',
      'Alertas de Riesgo Letal / Crítico por Cruce Clínico-Operativo (Ej. Vértigo/HTA en Alturas o Conducción)',
      'Alertas de Choque Osteomuscular por Cruce entre Restricciones Médicas, OWAS y Demandas del Cargo',
      'Índice de Fatiga Laboral, Riesgo Cardiovascular y Metabólico (IMC)',
      'Alertas de Riesgo Psicosocial y Probabilidad de Ausentismo Recurrente',
      'Predicción de Vencimientos Críticos a 30/15/0 Días (Exámenes EMO, Cursos Alturas, Licencias, SOAT, RTM, Extintores, FDS)',
      'Predicción de Siniestralidad ATEL por Proceso Operativo y Cargo',
      'Brechas Normativas Críticas con Riesgo de Multa (Res. 0312 y Dec. 1072)',
      'Top 5 Recomendaciones Preventivas Priorizadas por el Oráculo IA',
      'Simulación de Impacto de Controles en la Reducción del Riesgo Global (%)',
      'Plan de Intervención Inmediata hacia Tablero Kanban ACPM',
    ],
    quickCombos: [
      {
        label: '⚡ Alertas Letales y Clínicas por Trabajador (Cédula + Nombre + Cargo + Cruce)',
        description: 'Extrae los cruces predictivos de alto riesgo individual en toda la empresa',
        fields: [
          'Cédula y Nombre Completo de Trabajadores en Alerta Predictiva',
          'Cargo, Área y Puntaje FIT Biocéntrico del Trabajador en Alerta (%)',
          'Alertas de Riesgo Letal / Crítico por Cruce Clínico-Operativo (Ej. Vértigo/HTA en Alturas o Conducción)',
          'Alertas de Choque Osteomuscular por Cruce entre Restricciones Médicas, OWAS y Demandas del Cargo',
          'Top 5 Recomendaciones Preventivas Priorizadas por el Oráculo IA',
        ],
      },
      {
        label: '⚡ Gemelo Digital + Score Global % + Radar de 9 Dominios + Brechas Críticas',
        description: 'Diagnóstico ejecutivo 360° del Gemelo Digital SST',
        fields: [
          'Score Global de Salud y Blindaje Predictivo del SG-SST (0-100%)',
          'Estado del Gemelo Digital SST en Vivo y Nivel de Madurez Global (Óptimo / Preventivo / Alerta / Crítico)',
          'Radar de los 9 Dominios del SG-SST (Gobernanza 0312, Salud/EMO, Ergonómico, Psicosocial, Seguridad Vial PESV, Químico SGA, Trabajo en Alturas, Emergencias, Auditoría/ACPM)',
          'Dominios con Mayor Vulnerabilidad o Deterioro Detectado',
          'Brechas Normativas Críticas con Riesgo de Multa (Res. 0312 y Dec. 1072)',
        ],
      },
      {
        label: '⚡ Índice de Fatiga, Predicción de Siniestralidad y Vencimientos Críticos',
        description: 'Consolidado predictivo de fatiga, siniestralidad ATEL y vencimientos de los 8 Hitos',
        fields: [
          'Índice de Fatiga Laboral, Riesgo Cardiovascular y Metabólico (IMC)',
          'Predicción de Vencimientos Críticos a 30/15/0 Días (Exámenes EMO, Cursos Alturas, Licencias, SOAT, RTM, Extintores, FDS)',
          'Predicción de Siniestralidad ATEL por Proceso Operativo y Cargo',
          'Plan de Intervención Inmediata hacia Tablero Kanban ACPM',
        ],
      },
    ],
    reportTags: ['sgsst-predictivo-ia'],
  },

  // ═══ EQUIPO 1: DISPARADORES (8 NODOS TRIGGER_NODES) ═══
  schedule_cron: {
    moduleTitle: '⚡ Disparador · Reloj / Cron Programado (Por Horario)',
    moduleBadge: 'Disparador · Cron',
    fieldsLabel: 'Parámetros y Condiciones del Disparador por Horario (Cron)',
    fields: [
      'Frecuencia de Ejecución (Diaria / Semanal / Quincenal / Mensual)',
      'Hora Exacta de Disparo y Zona Horaria (America/Bogota)',
      'Ventana Horaria Laboral Permitida (Lunes a Sábado)',
      'Horizonte de Barrido Preventivo (Vencimientos a 30, 15 y 7 Días)',
      'Filtro de Novedades desde la Última Corrida Exitosa',
      'Omitir Ejecución si No Hay Cambios ni Alertas Nuevas',
      'Reintento Automático en Caso de Timeout de Red',
      'Registro de Marca de Tiempo en Bitácora de Auditoría',
      'Contexto de Empresa Activa Vinculada al Cron',
    ],
    quickCombos: [
      {
        label: '⚡ Barrido Preventivo de Vencimientos (30/15/7 Días) + Solo Novedades',
        description: 'Configuración ideal para vigilancia periódica sin correos repetidos',
        fields: [
          'Frecuencia de Ejecución (Diaria / Semanal / Quincenal / Mensual)',
          'Horizonte de Barrido Preventivo (Vencimientos a 30, 15 y 7 Días)',
          'Filtro de Novedades desde la Última Corrida Exitosa',
          'Omitir Ejecución si No Hay Cambios ni Alertas Nuevas',
        ],
      },
      {
        label: '⚡ Corte Ejecutivo Programado + Bitácora de Auditoría',
        description: 'Ejecución puntual en horario Bogotá con trazabilidad completa',
        fields: [
          'Hora Exacta de Disparo y Zona Horaria (America/Bogota)',
          'Ventana Horaria Laboral Permitida (Lunes a Sábado)',
          'Registro de Marca de Tiempo en Bitácora de Auditoría',
          'Contexto de Empresa Activa Vinculada al Cron',
        ],
      },
    ],
    reportTags: [],
  },
  trigger_tenshi: {
    moduleTitle: '⚡ Disparador · Tenshi IA (Orden por Voz o Chat)',
    moduleBadge: 'Disparador · Tenshi Voz/Chat',
    fieldsLabel: 'Parámetros de Disparo por Voz o Chat desde Tenshi IA',
    fields: [
      'Comando de Voz o Instrucción en Lenguaje Natural del Usuario',
      'Transcripción Verificada de Gemini Live Voice',
      'Parámetros Extraídos de la Orden (Cédula, Trabajador, Sede o Hito)',
      'Identidad del Usuario Solicitante y Rol en Somos SST',
      'Empresa Activa en la Sesión de Tenshi IA',
      'Continuidad del Hilo de Conversación Actual',
      'Confirmación Acústica y Visual en el Chat al Finalizar',
      'Prioridad de Ejecución Inmediata en Tiempo Real',
      'Adjuntos o Documentos Enviados en el Chat',
    ],
    quickCombos: [
      {
        label: '⚡ Comando de Voz/Chat + Parámetros Extraídos (Cédula/Hito) + Respuesta en Vivo',
        description: 'Captura la orden hablada o escrita a Tenshi y responde en el mismo chat',
        fields: [
          'Comando de Voz o Instrucción en Lenguaje Natural del Usuario',
          'Parámetros Extraídos de la Orden (Cédula, Trabajador, Sede o Hito)',
          'Empresa Activa en la Sesión de Tenshi IA',
          'Continuidad del Hilo de Conversación Actual',
          'Confirmación Acústica y Visual en el Chat al Finalizar',
        ],
      },
      {
        label: '⚡ Ejecución con Adjuntos del Chat + Prioridad Tiempo Real',
        description: 'Procesa archivos o reportes subidos directamente a Tenshi IA',
        fields: [
          'Comando de Voz o Instrucción en Lenguaje Natural del Usuario',
          'Adjuntos o Documentos Enviados en el Chat',
          'Prioridad de Ejecución Inmediata en Tiempo Real',
        ],
      },
    ],
    reportTags: [],
  },
  trigger_antigravity: {
    moduleTitle: '⚡ Disparador · Google Antigravity Local (Puente MCP Mac / PC)',
    moduleBadge: 'Disparador · Antigravity Local',
    fieldsLabel: 'Parámetros del Disparador desde Google Antigravity Local (Mac/PC)',
    fields: [
      'Orden Delegada vía Puente Reactivo Push SSE (wappy-push-daemon.js)',
      'Herramienta MCP Invocada desde el IDE Local (110+ Tools WAPPY)',
      'Ruta de Carpeta o Archivos Locales Adjuntos desde Mac/PC',
      'Clave Personal de Autenticación (wpy_live_... Verificada)',
      'Contexto de Empresa Activa Sincronizado',
      'Retorno de Bitácora en Vivo hacia la Consola Local de Antigravity',
      'Fallback Automático a WAPPY Cloud si el PC Entra en Reposo',
      'Variables y Argumentos JSON del Comando MCP',
    ],
    quickCombos: [
      {
        label: '⚡ Orden Push SSE + Carpeta Local Mac/PC + Retorno de Bitácora',
        description: 'Ejecuta órdenes lanzadas desde Antigravity en tu Mac/PC con lectura local',
        fields: [
          'Orden Delegada vía Puente Reactivo Push SSE (wappy-push-daemon.js)',
          'Ruta de Carpeta o Archivos Locales Adjuntos desde Mac/PC',
          'Contexto de Empresa Activa Sincronizado',
          'Retorno de Bitácora en Vivo hacia la Consola Local de Antigravity',
        ],
      },
      {
        label: '⚡ Invocación MCP 110+ Tools + Fallback Cloud Automático',
        description: 'Garantiza continuidad del flujo aunque el equipo local se desconecte',
        fields: [
          'Herramienta MCP Invocada desde el IDE Local (110+ Tools WAPPY)',
          'Variables y Argumentos JSON del Comando MCP',
          'Fallback Automático a WAPPY Cloud si el PC Entra en Reposo',
        ],
      },
    ],
    reportTags: [],
  },
  trigger_antigravity_cloud: {
    moduleTitle: '⚡ Disparador · Google Antigravity Cloud 24/7 (antigravity.google.com)',
    moduleBadge: 'Disparador · Antigravity Cloud',
    fieldsLabel: 'Parámetros del Disparador desde Google Antigravity Cloud 24/7',
    fields: [
      'Evento / Orden Disparada desde Instancia Cloud 24/7 (antigravity.google.com)',
      'Ejecución Autónoma sin Necesidad de Computador Encendido',
      'Conexión Directa al Servidor MCP WAPPY Cloud',
      'Workspace y Proyecto Cloud Vinculado',
      'Parámetros de Entrada y Objetivo del Agente Cloud',
      'Sincronización con Empresa Activa en Somos SST',
      'Entrega de Bitácora Final en Antigravity Cloud + WAPPY',
      'Control de Cuota y Reintentos Cloud 24/7',
    ],
    quickCombos: [
      {
        label: '⚡ Disparo Cloud 24/7 + MCP WAPPY + Sincronización Somos SST',
        description: 'Orquestación 100% en la nube desde antigravity.google.com sin PC prendido',
        fields: [
          'Evento / Orden Disparada desde Instancia Cloud 24/7 (antigravity.google.com)',
          'Ejecución Autónoma sin Necesidad de Computador Encendido',
          'Conexión Directa al Servidor MCP WAPPY Cloud',
          'Sincronización con Empresa Activa en Somos SST',
        ],
      },
      {
        label: '⚡ Parámetros del Agente Cloud + Bitácora Dual (Cloud + WAPPY)',
        description: 'Reporta resultados tanto en la instancia Cloud como en Somos SST',
        fields: [
          'Parámetros de Entrada y Objetivo del Agente Cloud',
          'Entrega de Bitácora Final en Antigravity Cloud + WAPPY',
          'Control de Cuota y Reintentos Cloud 24/7',
        ],
      },
    ],
    reportTags: [],
  },
  trigger_email: {
    moduleTitle: '⚡ Disparador · Correo Electrónico Entrante (Gmail)',
    moduleBadge: 'Disparador · Email Entrante',
    fieldsLabel: 'Filtros y Campos del Disparador por Recepción de Correo en Gmail',
    fields: [
      'Filtro por Palabras Clave en el Asunto (Incapacidad, FURAT, ARL, EMO, Citación, MinTrabajo)',
      'Filtro por Remitente o Dominio Autorizado (ARL, EPS, IPS Ocupacional, Trabajadores)',
      'Detección Obligatoria de Archivos Adjuntos (PDF, Excel, Word, Imágenes)',
      'Extracción de Cédula y Nombre del Trabajador en el Cuerpo o Asunto',
      'Procesar Únicamente Correos No Leídos Nuevos',
      'Clasificación Automática de Prioridad / Urgencia Legal',
      'Verificación Anti-Duplicados por Message-ID del Correo',
      'Fecha y Hora Exacta de Recepción del Mensaje',
      'Etiquetado / Marcado como Procesado en la Bandeja de Entrada',
    ],
    quickCombos: [
      {
        label: '⚡ Filtro de Asunto (Incapacidad/FURAT/EMO) + Adjuntos PDF + Cédula/Nombre',
        description: 'Dispara el flujo al recibir soportes médicos o reportes de accidentes por email',
        fields: [
          'Filtro por Palabras Clave en el Asunto (Incapacidad, FURAT, ARL, EMO, Citación, MinTrabajo)',
          'Detección Obligatoria de Archivos Adjuntos (PDF, Excel, Word, Imágenes)',
          'Extracción de Cédula y Nombre del Trabajador en el Cuerpo o Asunto',
          'Procesar Únicamente Correos No Leídos Nuevos',
        ],
      },
      {
        label: '⚡ Requerimientos de ARL / MinTrabajo + Prioridad Legal + Anti-Duplicados',
        description: 'Ideal para vigilancia de notificaciones oficiales y jurídicas entrantes',
        fields: [
          'Filtro por Remitente o Dominio Autorizado (ARL, EPS, IPS Ocupacional, Trabajadores)',
          'Clasificación Automática de Prioridad / Urgencia Legal',
          'Verificación Anti-Duplicados por Message-ID del Correo',
          'Fecha y Hora Exacta de Recepción del Mensaje',
        ],
      },
    ],
    reportTags: [],
  },
  trigger_agent: {
    moduleTitle: '⚡ Disparador · Otro Agente Especialista IA (Por Delegación)',
    moduleBadge: 'Disparador · Delegación IA',
    fieldsLabel: 'Parámetros de Invocación y Contexto entre Agentes Especialistas',
    fields: [
      'Nombre y Rol del Agente Especialista Emisor (Orquestador / Auditor / Médico / Ergonómico)',
      'Motivo del Escalamiento o Hallazgo Crítico Detectado',
      'Payload Estructurado de Datos Heredados del Flujo Anterior',
      'Listado de Cédulas y Trabajadores Afectados en el Hallazgo',
      'Hito y Aplicativo de Somos SST Relacionado',
      'Nivel de Severidad del Evento Delegado (Crítico / Alto / Moderado)',
      'Instrucción Específica de Continuación para este Agente',
      'Trazabilidad de Cadena Multi-Agente en Bitácora',
    ],
    quickCombos: [
      {
        label: '⚡ Agente Emisor + Hallazgo Crítico + Cédulas Afectadas + Payload Heredado',
        description: 'Recibe el contexto exacto filtrado por otro agente especialista de WAPPY',
        fields: [
          'Nombre y Rol del Agente Especialista Emisor (Orquestador / Auditor / Médico / Ergonómico)',
          'Motivo del Escalamiento o Hallazgo Crítico Detectado',
          'Payload Estructurado de Datos Heredados del Flujo Anterior',
          'Listado de Cédulas y Trabajadores Afectados en el Hallazgo',
        ],
      },
      {
        label: '⚡ Hito SST Relacionado + Nivel de Severidad + Trazabilidad Multi-Agente',
        description: 'Encadena acciones correctivas entre módulos de los 8 Hitos',
        fields: [
          'Hito y Aplicativo de Somos SST Relacionado',
          'Nivel de Severidad del Evento Delegado (Crítico / Alto / Moderado)',
          'Instrucción Específica de Continuación para este Agente',
          'Trazabilidad de Cadena Multi-Agente en Bitácora',
        ],
      },
    ],
    reportTags: [],
  },
  trigger_qr_worker: {
    moduleTitle: '⚡ Disparador · Reporte QR de Trabajador en Campo',
    moduleBadge: 'Disparador · QR en Terreno',
    fieldsLabel: 'Campos Capturados al Instante desde el Formulario QR del Trabajador',
    fields: [
      'Cédula / Documento y Nombre Completo del Trabajador Reportante',
      'Cargo, Área / Proceso y Sede o Frente de Obra',
      'Tipo de Reporte QR (Acto Inseguro, Condición Insegura, Inspección Preoperacional, Síntoma/Fatiga, Participación IPEVR)',
      'Descripción del Hallazgo o Novedad Reportada en Terreno',
      'Nivel de Gravedad Percibida por el Trabajador (Bajo / Medio / Alto / Peligro Inminente)',
      'Evidencia Fotográfica Adjunta desde el Celular',
      'Ubicación / Zona Exacta del Hallazgo',
      'Fecha y Hora Exacta del Escaneo QR',
      'Validación de Identidad contra Nómina Activa de Somos SST',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula/Nombre + Tipo de Reporte QR + Gravedad + Foto en Campo',
        description: 'Procesa al instante reportes de actos/condiciones inseguras enviados por QR',
        fields: [
          'Cédula / Documento y Nombre Completo del Trabajador Reportante',
          'Tipo de Reporte QR (Acto Inseguro, Condición Insegura, Inspección Preoperacional, Síntoma/Fatiga, Participación IPEVR)',
          'Descripción del Hallazgo o Novedad Reportada en Terreno',
          'Nivel de Gravedad Percibida por el Trabajador (Bajo / Medio / Alto / Peligro Inminente)',
          'Evidencia Fotográfica Adjunta desde el Celular',
        ],
      },
      {
        label: '⚡ Ubicación en Obra + Validación de Nómina SST + Hora del Escaneo',
        description: 'Cruza quién reportó con su cargo y sede en Somos SST',
        fields: [
          'Cédula / Documento y Nombre Completo del Trabajador Reportante',
          'Cargo, Área / Proceso y Sede o Frente de Obra',
          'Ubicación / Zona Exacta del Hallazgo',
          'Validación de Identidad contra Nómina Activa de Somos SST',
        ],
      },
    ],
    reportTags: ['sgsst-reporte-actos', 'sgsst-participacion-ipevar'],
  },
  trigger_webhook: {
    moduleTitle: '⚡ Disparador · Webhook / Evento Externo API (Buk RRHH / ERP)',
    moduleBadge: 'Disparador · Webhook API',
    fieldsLabel: 'Campos del Payload JSON y Eventos del Webhook Externo',
    fields: [
      'Tipo de Evento Recibido (Nuevo Ingreso, Retiro, Cambio de Cargo, Incapacidad, Siniestro Vial)',
      'Sistema de Origen (Buk RRHH, SAP, Siigo, Nómina Electrónica, Formulario Web)',
      'Cédula / Documento y Nombre Completo del Colaborador en el Payload',
      'Cargo, Centro de Costos, Sede y Fecha de Ingreso/Novedad',
      'Datos de Seguridad Social en el Payload (EPS, ARL, AFP, Caja de Compensación)',
      'Validación de Firma HMAC / Token de Seguridad del Webhook',
      'Mapeo Automático de Campos JSON hacia Somos SST',
      'Código de Respuesta HTTP 200 y Registro de Auditoría API',
    ],
    quickCombos: [
      {
        label: '⚡ Novedad de Personal (Ingreso/Retiro/Cargo) + Cédula/Nombre + EPS/ARL/AFP',
        description: 'Sincroniza altas, bajas o cambios de cargo desde Buk RRHH o Nómina',
        fields: [
          'Tipo de Evento Recibido (Nuevo Ingreso, Retiro, Cambio de Cargo, Incapacidad, Siniestro Vial)',
          'Cédula / Documento y Nombre Completo del Colaborador en el Payload',
          'Cargo, Centro de Costos, Sede y Fecha de Ingreso/Novedad',
          'Datos de Seguridad Social en el Payload (EPS, ARL, AFP, Caja de Compensación)',
        ],
      },
      {
        label: '⚡ Validación de Seguridad Webhook + Mapeo JSON a Somos SST',
        description: 'Asegura integridad del payload externo antes de escribir en base de datos',
        fields: [
          'Sistema de Origen (Buk RRHH, SAP, Siigo, Nómina Electrónica, Formulario Web)',
          'Validación de Firma HMAC / Token de Seguridad del Webhook',
          'Mapeo Automático de Campos JSON hacia Somos SST',
          'Código de Respuesta HTTP 200 y Registro de Auditoría API',
        ],
      },
    ],
    reportTags: ['sgsst-perfil-sociodemografico'],
  },

  // ═══ EQUIPO 2: EXTRAER DATOS (8 NODOS EXTRACTOR_NODES) ═══
  extract_gmail: {
    moduleTitle: '📥 Extractor · Leer Bandeja de Gmail (Extraer Correos y Reportes)',
    moduleBadge: 'Extractor · Gmail',
    fieldsLabel: 'Datos y Adjuntos a Extraer de la Bandeja de Entrada de Gmail',
    fields: [
      'Asunto del Correo y Etiqueta de Clasificación',
      'Remitente, Dirección de Correo y Entidad (ARL, EPS, IPS, Trabajador)',
      'Fecha y Hora de Recepción del Correo',
      'Cédula / Documento y Nombre Completo del Trabajador Mencionado',
      'Archivos Adjuntos PDF / Excel (Incapacidades, Certificados EPS/ARL/AFP, Conceptos EMO, FURAT)',
      'Código Diagnóstico CIE-10 y Días de Incapacidad en el Adjunto',
      'Requerimientos Oficiales, Plazos Legales y Citaciones de ARL / MinTrabajo',
      'Cuerpo del Mensaje Limpio y Tablas HTML Extraídas',
      'Filtro de Correos No Leídos de las Últimas 24 / 72 Horas',
      'ID Único del Mensaje (Anti-Duplicados)',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Correos No Leídos + Cédula/Nombre + Adjuntos PDF (EMO/EPS/ARL)',
        description: 'Extrae soportes de trabajadores recibidos por correo sin saturar el flujo',
        fields: [
          'Asunto del Correo y Etiqueta de Clasificación',
          'Cédula / Documento y Nombre Completo del Trabajador Mencionado',
          'Archivos Adjuntos PDF / Excel (Incapacidades, Certificados EPS/ARL/AFP, Conceptos EMO, FURAT)',
          'Filtro de Correos No Leídos de las Últimas 24 / 72 Horas',
        ],
      },
      {
        label: '⚡ Incapacidades Médicas (CIE-10 + Días) y Reportes FURAT por Email',
        description: 'Para alimentar Ausentismo e Investigación ATEL en el Hito 7',
        fields: [
          'Cédula / Documento y Nombre Completo del Trabajador Mencionado',
          'Archivos Adjuntos PDF / Excel (Incapacidades, Certificados EPS/ARL/AFP, Conceptos EMO, FURAT)',
          'Código Diagnóstico CIE-10 y Días de Incapacidad en el Adjunto',
          'Fecha y Hora de Recepción del Correo',
        ],
      },
      {
        label: '⚡ Notificaciones Oficiales de ARL / MinTrabajo y Plazos de Respuesta',
        description: 'Prioriza comunicaciones jurídicas o auditorías externas entrantes',
        fields: [
          'Remitente, Dirección de Correo y Entidad (ARL, EPS, IPS, Trabajador)',
          'Requerimientos Oficiales, Plazos Legales y Citaciones de ARL / MinTrabajo',
          'Cuerpo del Mensaje Limpio y Tablas HTML Extraídas',
        ],
      },
    ],
    reportTags: [],
  },
  extract_drive: {
    moduleTitle: '📥 Extractor · Extraer de Google Drive (Carpetas / Excel / PDF)',
    moduleBadge: 'Extractor · Google Drive',
    fieldsLabel: 'Qué Datos o Soportes Extraer de las Carpetas de Google Drive',
    fields: [
      'Cédula / Identificación y Nombre del Trabajador en el Documento',
      'Certificados de Afiliación a Seguridad Social (EPS, ARL, AFP, CCF y Planilla PILA)',
      'Concepto de Aptitud Médica Ocupacional (EMO), Restricciones y Fecha de Examen',
      'Certificados Vigentes de Trabajo en Alturas y Capacitaciones',
      'Incapacidades Médicas, Diagnóstico CIE-10 y Días Otorgados',
      'Reportes FURAT / Investigación de Accidentes en PDF',
      'Fichas de Datos de Seguridad (FDS 16 Secciones) y Certificados de Equipos',
      'Tablas y Filas de Hojas de Cálculo (.xlsx / Google Sheets / CSV)',
      'Documentos Normativos del Hito 1 (Política, RHS, RIT, Matriz Legal, Actas)',
      'Nombre del Archivo, Ruta de Carpeta y Fecha de Última Modificación',
      'Verificación de Firmas y Vigencia del Soporte Documental',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Cédula + Nombre + Certificados de Afiliación (EPS/ARL/AFP)',
        description: 'Audita carpetas de seguridad social por número de cédula sin saturar',
        fields: [
          'Cédula / Identificación y Nombre del Trabajador en el Documento',
          'Certificados de Afiliación a Seguridad Social (EPS, ARL, AFP, CCF y Planilla PILA)',
          'Nombre del Archivo, Ruta de Carpeta y Fecha de Última Modificación',
        ],
      },
      {
        label: '⚡ Cédula + Nombre + Concepto Médico EMO + Curso de Alturas',
        description: 'Valida soportes clínicos y de trabajo en alturas en carpetas de Drive',
        fields: [
          'Cédula / Identificación y Nombre del Trabajador en el Documento',
          'Concepto de Aptitud Médica Ocupacional (EMO), Restricciones y Fecha de Examen',
          'Certificados Vigentes de Trabajo en Alturas y Capacitaciones',
          'Verificación de Firmas y Vigencia del Soporte Documental',
        ],
      },
      {
        label: '⚡ Hojas de Cálculo Excel/Sheets + Soportes del Hito 1 y FDS',
        description: 'Lee matrices en Excel y documentos del sistema alojados en Drive',
        fields: [
          'Tablas y Filas de Hojas de Cálculo (.xlsx / Google Sheets / CSV)',
          'Documentos Normativos del Hito 1 (Política, RHS, RIT, Matriz Legal, Actas)',
          'Fichas de Datos de Seguridad (FDS 16 Secciones) y Certificados de Equipos',
        ],
      },
    ],
    reportTags: [],
  },
  extract_onedrive: {
    moduleTitle: '📥 Extractor · Extraer de Microsoft OneDrive / SharePoint',
    moduleBadge: 'Extractor · OneDrive',
    fieldsLabel: 'Qué Datos Extraer de Carpetas Corporativas en Microsoft OneDrive / SharePoint',
    fields: [
      'Cédula / Identificación y Nombre Completo del Colaborador',
      'Certificados de Afiliación (EPS, ARL, AFP, Caja de Compensación y PILA)',
      'Conceptos de Aptitud Médica (EMO), Recomendaciones y Restricciones',
      'Libros de Excel Corporativos (.xlsx) de Nómina, Ausentismo e Indicadores',
      'Documentos Word (.docx) y PDFs de Procedimientos, Políticas y Actas',
      'Certificados de Trabajo en Alturas, Conducción PESV y Brigadas',
      'Soportes de Contratistas y Proveedores en SharePoint',
      'Ruta de Biblioteca SharePoint / OneDrive y Fecha de Modificación',
      'Estado de Vigencia y Firmas del Documento',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + Certificados EPS/ARL/AFP y EMO en OneDrive',
        description: 'Verifica expedientes laborales alojados en Microsoft 365',
        fields: [
          'Cédula / Identificación y Nombre Completo del Colaborador',
          'Certificados de Afiliación (EPS, ARL, AFP, Caja de Compensación y PILA)',
          'Conceptos de Aptitud Médica (EMO), Recomendaciones y Restricciones',
        ],
      },
      {
        label: '⚡ Libros Excel (.xlsx) de Nómina/Ausentismo + Soportes de Contratistas',
        description: 'Extrae tablas operativas desde bibliotecas corporativas de SharePoint',
        fields: [
          'Libros de Excel Corporativos (.xlsx) de Nómina, Ausentismo e Indicadores',
          'Soportes de Contratistas y Proveedores en SharePoint',
          'Ruta de Biblioteca SharePoint / OneDrive y Fecha de Modificación',
        ],
      },
    ],
    reportTags: [],
  },
  extract_pc_folder: {
    moduleTitle: '📥 Extractor · Extraer de Carpeta en mi Computador (vía Antigravity Local)',
    moduleBadge: 'Extractor · Disco Local PC',
    fieldsLabel: 'Archivos y Datos a Extraer de tu Carpeta Local en Mac/PC',
    fields: [
      'Ruta de la Carpeta Local en Mac / Windows Inspeccionada',
      'Cédula / Documento y Nombre del Trabajador en Archivos Locales',
      'Certificados PDF de Afiliación (EPS, ARL, AFP y Planilla PILA)',
      'Certificados de Aptitud Médica (EMO) y Cursos de Alturas en PDF',
      'Hojas de Cálculo Excel (.xlsx / .csv) Guardadas en el Computador',
      'Documentos Word (.docx) de Actas, Informes e Inspecciones',
      'Fichas de Seguridad Química (FDS) y Manuales Técnicos en Disco',
      'Evidencias Fotográficas de Inspecciones de Campo en Carpeta Local',
      'Fecha de Creación/Modificación y Tamaño del Archivo Local',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + PDFs de Afiliación (EPS/ARL/AFP) y EMO en mi PC',
        description: 'Cruza carpetas de trabajadores en tu disco duro contra Somos SST',
        fields: [
          'Ruta de la Carpeta Local en Mac / Windows Inspeccionada',
          'Cédula / Documento y Nombre del Trabajador en Archivos Locales',
          'Certificados PDF de Afiliación (EPS, ARL, AFP y Planilla PILA)',
          'Certificados de Aptitud Médica (EMO) y Cursos de Alturas en PDF',
        ],
      },
      {
        label: '⚡ Archivos Excel (.xlsx) + Documentos Word (.docx) en Carpeta Local',
        description: 'Importa matrices y actas desde el computador vía Antigravity Local',
        fields: [
          'Ruta de la Carpeta Local en Mac / Windows Inspeccionada',
          'Hojas de Cálculo Excel (.xlsx / .csv) Guardadas en el Computador',
          'Documentos Word (.docx) de Actas, Informes e Inspecciones',
          'Fecha de Creación/Modificación y Tamaño del Archivo Local',
        ],
      },
    ],
    reportTags: [],
  },
  extract_sst_workers: {
    moduleTitle: '📥 Extractor · Extraer Trabajadores y Expedientes (Somos SST)',
    moduleBadge: 'Extractor · Expedientes SST',
    fieldsLabel: 'Campos de Trabajadores y Expedientes a Extraer desde Somos SST',
    fields: [
      'Cédula / Documento',
      'Nombre Completo',
      'Cargo',
      'Área / Proceso y Sede',
      'Estado Laboral (Activo / Retirado)',
      'Fecha de Ingreso y Antigüedad',
      'EPS, ARL, AFP y Caja de Compensación',
      'Grupo Sanguíneo RH y Contacto de Emergencia',
      'Concepto de Aptitud Médica (EMO) y Fecha de Próximo Examen',
      'Diagnósticos Clínicos CIE-10, Restricciones y Recomendaciones',
      'Vigencia de Curso de Trabajo en Alturas y Certificaciones',
      'Kardex de Entrega de EPP y Dotación',
      'Puntaje FIT Biocéntrico (%) y Tarjetas Preventivas',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Cédula, Nombre, Cargo y Seguridad Social (EPS/ARL/AFP)',
        description: 'Extracción rápida de nómina y afiliaciones sin saturar',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'EPS, ARL, AFP y Caja de Compensación',
        ],
      },
      {
        label: '⚡ Cédula + Nombre + Concepto EMO + Curso Alturas + EPP',
        description: 'Audita vencimientos operativos de cada colaborador activo',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'Concepto de Aptitud Médica (EMO) y Fecha de Próximo Examen',
          'Vigencia de Curso de Trabajo en Alturas y Certificaciones',
          'Kardex de Entrega de EPP y Dotación',
        ],
      },
      {
        label: '⚡ Restricciones Médicas, Patologías CIE-10 y Tarjetas Preventivas FIT',
        description: 'Cruza salud ocupacional con compatibilidad cargo-persona',
        fields: [
          'Cédula / Documento',
          'Nombre Completo',
          'Cargo',
          'Diagnósticos Clínicos CIE-10, Restricciones y Recomendaciones',
          'Puntaje FIT Biocéntrico (%) y Tarjetas Preventivas',
        ],
      },
    ],
    reportTags: ['sgsst-perfil-sociodemografico', 'sgsst-condiciones-salud', 'sgsst-bio-ipevar'],
  },
  extract_sst_app: {
    moduleTitle: '📥 Extractor · Extraer Datos de Aplicativo / Matriz (Somos SST)',
    moduleBadge: 'Extractor · 8 Hitos SST',
    fieldsLabel: 'Datos y Resultados a Extraer de los Aplicativos de Somos SST',
    fields: [
      'Puntaje Diagnóstico Res. 0312 (%) y Brechas No Cumple',
      'Listado de Trabajadores (Cédula, Nombre Completo y Cargo)',
      'Certificados de Afiliación (EPS, ARL, AFP y Planilla PILA)',
      'Vencimiento de Exámenes Médicos (EMO) y Restricciones Activas',
      'Tarjetas Preventivas y FIT Score de Compatibilidad Cargo-Persona',
      'Peligros Críticos (Nivel I y II) de Matriz IPEVR GTC-45',
      'Hallazgos Viales PESV y Documentos Vehiculares (SOAT/RTM)',
      'Inventario Químico e Incompatibilidades SGA',
      'Actas y Compromisos Pendientes del COPASST / Convivencia',
      'Equipos de Alturas y Extintores Próximos a Vencer',
      'Cobertura de Capacitaciones Anuales y Certificados LMS',
      'Reportes Abiertos de Actos y Condiciones Inseguras',
      'Indicadores Mínimos ATEL y Ausentismo (Res. 0312 Art. 30)',
      'Investigaciones de Accidentes Abiertas (Res. 1401)',
      'Acciones Abiertas o Vencidas en Tablero Kanban ACPM',
      'Alertas Letales y Clínicas del Oráculo Predictivo IA (Hito 8)',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Cédula + Nombre + Certificados Afiliación (EPS/ARL/AFP)',
        description: 'Extracción ligera de trabajadores y seguridad social',
        fields: [
          'Listado de Trabajadores (Cédula, Nombre Completo y Cargo)',
          'Certificados de Afiliación (EPS, ARL, AFP y Planilla PILA)',
        ],
      },
      {
        label: '⚡ Resumen de Vencimientos Críticos (EMO + SOAT/RTM + Extintores + ACPM)',
        description: 'Solo alertas próximas a vencer en la empresa',
        fields: [
          'Vencimiento de Exámenes Médicos (EMO) y Restricciones Activas',
          'Hallazgos Viales PESV y Documentos Vehiculares (SOAT/RTM)',
          'Equipos de Alturas y Extintores Próximos a Vencer',
          'Acciones Abiertas o Vencidas en Tablero Kanban ACPM',
        ],
      },
      {
        label: '⚡ Diagnóstico 360° de Brechas (0312 + IPEVR + ATEL + Oráculo IA)',
        description: 'Panorama gerencial de riesgos prioritarios y cumplimiento',
        fields: [
          'Puntaje Diagnóstico Res. 0312 (%) y Brechas No Cumple',
          'Peligros Críticos (Nivel I y II) de Matriz IPEVR GTC-45',
          'Indicadores Mínimos ATEL y Ausentismo (Res. 0312 Art. 30)',
          'Alertas Letales y Clínicas del Oráculo Predictivo IA (Hito 8)',
        ],
      },
    ],
    reportTags: ['sgsst-diagnostico', 'sgsst-perfil-sociodemografico', 'sgsst-matriz-ipevar'],
  },
  extract_web_scraping_agy: {
    moduleTitle: '📥 Extractor · Web Scraping con Antigravity (Script Python / Node / Playwright)',
    moduleBadge: 'Extractor · Script AGY',
    fieldsLabel: 'Qué Elementos Estructurados Extraer de la Página Web con tu Script',
    fields: [
      'Tablas de Datos HTML Convertidas a Markdown / JSON',
      'Enlaces Directos a Documentos PDF, Resoluciones y Anexos',
      'Títulos, Encabezados (H1/H2/H3) y Epígrafes Normativos',
      'Número de Norma, Fecha de Expedición y Estado de Vigencia',
      'Consulta de Estado por Número de Cédula / NIT / Placa',
      'Indicadores, Tarifas, UVT o SMLMV Actualizados',
      'Texto Principal Limpio (Sin Menús ni Publicidad)',
      'Selectores CSS / XPath Personalizados del Script',
      'Captura de Pantalla de Evidencia (Chrome DevTools MCP)',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Tablas de Datos + Enlaces PDF + Fecha de Vigencia',
        description: 'Extrae datos tabulares limpios y documentos oficiales descargables',
        fields: [
          'Tablas de Datos HTML Convertidas a Markdown / JSON',
          'Enlaces Directos a Documentos PDF, Resoluciones y Anexos',
          'Número de Norma, Fecha de Expedición y Estado de Vigencia',
        ],
      },
      {
        label: '⚡ Verificación por Cédula / NIT / Placa + Evidencia Captura',
        description: 'Consulta estructurada de registros en portales externos con soporte',
        fields: [
          'Consulta de Estado por Número de Cédula / NIT / Placa',
          'Tablas de Datos HTML Convertidas a Markdown / JSON',
          'Captura de Pantalla de Evidencia (Chrome DevTools MCP)',
        ],
      },
      {
        label: '⚡ Monitoreo de Nuevas Resoluciones y Textos Normativos',
        description: 'Extrae articulado limpio y encabezados de portales jurídicos',
        fields: [
          'Títulos, Encabezados (H1/H2/H3) y Epígrafes Normativos',
          'Número de Norma, Fecha de Expedición y Estado de Vigencia',
          'Texto Principal Limpio (Sin Menús ni Publicidad)',
        ],
      },
    ],
    reportTags: [],
  },
  extract_web_search: {
    moduleTitle: '📥 Extractor · Búsqueda en la Web en Tiempo Real (MinTrabajo / SUIN / ARL)',
    moduleBadge: 'Extractor · Búsqueda Web',
    fieldsLabel: 'Criterios y Hallazgos a Extraer de la Búsqueda en Internet',
    fields: [
      'Portales Oficiales del Estado Colombiano (.gov.co / MinTrabajo / MinSalud / SUIN-Juriscol)',
      'Últimas Resoluciones, Decretos y Circulares SST Vigentes',
      'Sentencias de Corte Constitucional y Corte Suprema (Sala Laboral)',
      'Guías Técnicas Colombianas (GTC / NTC) y Protocolos ARL',
      'Alertas Sanitarias, Epidemiológicas o Climáticas Recientes',
      'Citas Textuales Verificadas con URL y Fecha de Publicación',
      'Tabla Comparativa de Requisitos Legales Encontrados',
      'Verificación de Vigencia (Vigente vs. Derogada)',
    ],
    quickCombos: [
      {
        label: '⚡ Normativa Vigente (.gov.co / MinTrabajo) + URL Verificada + Tabla Resumen',
        description: 'Busca únicamente en fuentes oficiales colombianas con cita verificable',
        fields: [
          'Portales Oficiales del Estado Colombiano (.gov.co / MinTrabajo / MinSalud / SUIN-Juriscol)',
          'Últimas Resoluciones, Decretos y Circulares SST Vigentes',
          'Citas Textuales Verificadas con URL y Fecha de Publicación',
          'Tabla Comparativa de Requisitos Legales Encontrados',
        ],
      },
      {
        label: '⚡ Jurisprudencia Laboral (Corte Constitucional / CSJ) y Doctrina ARL',
        description: 'Fundamentación jurídica para casos complejos de estabilidad o ATEL',
        fields: [
          'Sentencias de Corte Constitucional y Corte Suprema (Sala Laboral)',
          'Guías Técnicas Colombianas (GTC / NTC) y Protocolos ARL',
          'Verificación de Vigencia (Vigente vs. Derogada)',
        ],
      },
    ],
    reportTags: ['sgsst-matriz-legal', 'sgsst-investigacion-profunda'],
  },

  // ═══ EQUIPO 3: MOTOR IA & AGENTES (AI_ENGINE_MODELS + AGENT_ROOT) ═══
  wappy_gemini_3_6_flash: {
    moduleTitle: '🧠 Motor IA · WAPPY IA · Gemini 3.6 Flash (Key Rotation)',
    moduleBadge: 'Motor IA · Gemini 3.6 Flash',
    fieldsLabel: 'Directivas de Razonamiento, Herramientas MCP y Formato de Salida del Motor IA',
    fields: [
      'Rotación Automática de Claves API en la Nube WAPPY 24/7',
      'Razonamiento Estructurado Paso a Paso (Chain-of-Thought SST)',
      'Invocación Automática de Herramientas Nativas Somos SST',
      'Cruce Estricto por Número de Cédula y Nombre Completo',
      'Veracidad Estricta (Prohibido Inventar o Simular Registros)',
      'Salida en Tablas Markdown Limpias + Tarjeta Ejecutiva wappy-card',
      'Citación de Artículos Exactos (Dec. 1072, Res. 0312, GTC-45)',
      'Priorización de Hallazgos por Criticidad (Nivel I Crítico a Nivel IV)',
      'Generación de Plan de Acción con Responsables y Fechas',
    ],
    quickCombos: [
      {
        label: '⚡ Razonamiento SST + Cruce por Cédula + Cero Invención + Tablas Markdown',
        description: 'Configuración estándar de alta precisión para auditorías y cruces SST',
        fields: [
          'Rotación Automática de Claves API en la Nube WAPPY 24/7',
          'Cruce Estricto por Número de Cédula y Nombre Completo',
          'Veracidad Estricta (Prohibido Inventar o Simular Registros)',
          'Salida en Tablas Markdown Limpias + Tarjeta Ejecutiva wappy-card',
        ],
      },
      {
        label: '⚡ Invocación de Herramientas SST + Cita Legal + Plan de Acción',
        description: 'Ejecuta herramientas en Somos SST y fundamenta cada recomendación',
        fields: [
          'Invocación Automática de Herramientas Nativas Somos SST',
          'Citación de Artículos Exactos (Dec. 1072, Res. 0312, GTC-45)',
          'Priorización de Hallazgos por Criticidad (Nivel I Crítico a Nivel IV)',
          'Generación de Plan de Acción con Responsables y Fechas',
        ],
      },
    ],
    reportTags: [],
  },
  wappy_gemini_3_5_flash_lite: {
    moduleTitle: '🧠 Motor IA · WAPPY IA · Gemini 3.5 Flash Lite (Ultra Rápido)',
    moduleBadge: 'Motor IA · Gemini 3.5 Lite',
    fieldsLabel: 'Directivas de Velocidad, Barrido Ligero y Formato del Motor Flash Lite',
    fields: [
      'Modo Ultra Rápido de Baja Latencia con Rotación de Claves WAPPY',
      'Barrido Ágil de Vencimientos (EMO, Alturas, SOAT, RTM, Extintores)',
      'Extracción Quirúrgica de Campos Seleccionados (Ahorro de Tokens)',
      'Cruce Rápido de Nómina por Cédula y Estado de Afiliación',
      'Filtro Directo de Solo Registros Vencidos o Próximos a Vencer',
      'Síntesis Ejecutiva en Tabla Compacta de Alertas',
      'Veracidad Estricta sin Alucinaciones',
      'Despacho Inmediato a Notificaciones WAPPY y Correo',
    ],
    quickCombos: [
      {
        label: '⚡ Barrido Rápido de Vencimientos + Solo Alertas + Tabla Compacta',
        description: 'Ideal para ejecuciones diarias o frecuentes de monitoreo SST',
        fields: [
          'Modo Ultra Rápido de Baja Latencia con Rotación de Claves WAPPY',
          'Barrido Ágil de Vencimientos (EMO, Alturas, SOAT, RTM, Extintores)',
          'Filtro Directo de Solo Registros Vencidos o Próximos a Vencer',
          'Síntesis Ejecutiva en Tabla Compacta de Alertas',
        ],
      },
      {
        label: '⚡ Cruce Ágil por Cédula + Ahorro de Tokens + Cero Invención',
        description: 'Optimiza velocidad en validaciones masivas de Drive o trabajadores',
        fields: [
          'Extracción Quirúrgica de Campos Seleccionados (Ahorro de Tokens)',
          'Cruce Rápido de Nómina por Cédula y Estado de Afiliación',
          'Veracidad Estricta sin Alucinaciones',
        ],
      },
    ],
    reportTags: [],
  },
  wappy_gemini_3_8_flash: {
    moduleTitle: '🧠 Motor IA · WAPPY IA · Gemini 3.8 Flash (Análisis Profundo)',
    moduleBadge: 'Motor IA · Gemini 3.8 Flash',
    fieldsLabel: 'Directivas de Análisis Profundo, Causalidad y Auditoría Jurídico-Técnica',
    fields: [
      'Análisis Profundo Multi-Documento y Razonamiento Extendido',
      'Auditoría Exhaustiva de los 60 Estándares Mínimos (Res. 0312)',
      'Análisis Causal Profundo ATEL (Árbol de Causas, 5 Porqués, Ishikawa)',
      'Valoración Cuantitativa Completa GTC-45, PESV Res. 40595 y SGA Dec. 1496',
      'Correlación Epidemiológica y Biocéntrica (Salud, OWAS, EPT y Psicosocial)',
      'Fundamentación Jurídica (Dec. 1072, Sentencias Corte Constitucional y CSJ)',
      'Redacción de Informes Técnicos Formales Listos para Firma y Exportación',
      'Veracidad Estricta y Trazabilidad de Evidencias',
    ],
    quickCombos: [
      {
        label: '⚡ Auditoría Profunda 0312 + Causalidad ATEL + Fundamentación Jurídica',
        description: 'Máxima profundidad analítica para informes gerenciales y legales',
        fields: [
          'Análisis Profundo Multi-Documento y Razonamiento Extendido',
          'Auditoría Exhaustiva de los 60 Estándares Mínimos (Res. 0312)',
          'Análisis Causal Profundo ATEL (Árbol de Causas, 5 Porqués, Ishikawa)',
          'Fundamentación Jurídica (Dec. 1072, Sentencias Corte Constitucional y CSJ)',
        ],
      },
      {
        label: '⚡ Cruce Epidemiológico Biocéntrico + GTC-45/PESV/SGA + Informe Formal',
        description: 'Integra múltiples matrices técnicas en un dictamen especializado',
        fields: [
          'Valoración Cuantitativa Completa GTC-45, PESV Res. 40595 y SGA Dec. 1496',
          'Correlación Epidemiológica y Biocéntrica (Salud, OWAS, EPT y Psicosocial)',
          'Redacción de Informes Técnicos Formales Listos para Firma y Exportación',
        ],
      },
    ],
    reportTags: [],
  },
  antigravity_mcp_engine: {
    moduleTitle: '🧠 Motor IA · Google Antigravity Local (Mac/PC) + Servidor MCP WAPPY (110+ Tools)',
    moduleBadge: 'Motor IA · Antigravity Local + MCP',
    fieldsLabel: 'Capacidades del Motor Google Antigravity Local en tu Mac/PC vía Push SSE',
    fields: [
      'Delegación Reactiva por Puente Push SSE hacia tu Mac/PC',
      'Acceso Completo a las 110+ Herramientas del Servidor MCP WAPPY',
      'Lectura y Escritura Directa en Carpetas Locales del Computador',
      'Ejecución de Scripts Locales (Python, Node.js, Playwright, Chrome MCP)',
      'Sincronización Bidireccional en Vivo con los 8 Hitos de Somos SST',
      'Respaldo Automático en WAPPY Cloud si el Computador está Apagado',
      'Cero Invención de Datos (Validación contra Base de Datos Real)',
      'Entrega de Bitácora Detallada en Consola Antigravity y WAPPY',
    ],
    quickCombos: [
      {
        label: '⚡ Puente Push SSE + 110+ Tools MCP + Lectura de Carpeta Local PC',
        description: 'Aprovecha toda la potencia de Antigravity en tu equipo local',
        fields: [
          'Delegación Reactiva por Puente Push SSE hacia tu Mac/PC',
          'Acceso Completo a las 110+ Herramientas del Servidor MCP WAPPY',
          'Lectura y Escritura Directa en Carpetas Locales del Computador',
          'Sincronización Bidireccional en Vivo con los 8 Hitos de Somos SST',
        ],
      },
      {
        label: '⚡ Ejecución de Scripts (Python/Playwright) + Respaldo Cloud Automático',
        description: 'Ideal para flujos con Web Scraping o automatización avanzada',
        fields: [
          'Ejecución de Scripts Locales (Python, Node.js, Playwright, Chrome MCP)',
          'Respaldo Automático en WAPPY Cloud si el Computador está Apagado',
          'Entrega de Bitácora Detallada en Consola Antigravity y WAPPY',
        ],
      },
    ],
    reportTags: [],
  },
  antigravity_cloud_mcp_engine: {
    moduleTitle: '🧠 Motor IA · Google Antigravity Cloud 24/7 (antigravity.google.com) + MCP WAPPY',
    moduleBadge: 'Motor IA · Antigravity Cloud 24/7',
    fieldsLabel: 'Capacidades del Motor Google Antigravity Cloud 24/7 + Servidor MCP',
    fields: [
      'Ejecución Autónoma 24/7 en Google Antigravity Cloud (Sin PC Prendido)',
      'Conexión Permanente al Servidor MCP WAPPY (110+ Herramientas SST)',
      'Ejecución de Scripts y Sandbox en la Nube de Antigravity',
      'Orquestación de Conectores Google Workspace, Drive, Gmail y NotebookLM',
      'Actualización Directa de Matrices y Expedientes en Somos SST',
      'Veracidad Estricta y Control Anti-Duplicados',
      'Reporte Consolidado en Antigravity Cloud y Campana WAPPY',
      'Alta Disponibilidad para Tareas Programadas Nocturnas o Semanales',
    ],
    quickCombos: [
      {
        label: '⚡ Cloud 24/7 sin PC Prendido + 110+ Tools MCP + Actualización Somos SST',
        description: 'Ejecución continua en antigravity.google.com conectada a tu empresa',
        fields: [
          'Ejecución Autónoma 24/7 en Google Antigravity Cloud (Sin PC Prendido)',
          'Conexión Permanente al Servidor MCP WAPPY (110+ Herramientas SST)',
          'Actualización Directa de Matrices y Expedientes en Somos SST',
          'Alta Disponibilidad para Tareas Programadas Nocturnas o Semanales',
        ],
      },
      {
        label: '⚡ Sandbox de Scripts Cloud + Conectores Google + Bitácora Consolidada',
        description: 'Combina herramientas de Google Workspace y scripts en la nube',
        fields: [
          'Ejecución de Scripts y Sandbox en la Nube de Antigravity',
          'Orquestación de Conectores Google Workspace, Drive, Gmail y NotebookLM',
          'Reporte Consolidado en Antigravity Cloud y Campana WAPPY',
        ],
      },
    ],
    reportTags: [],
  },
  agent_root: {
    moduleTitle: '🧠 Agente IA Principal del Flujo (Orquestador SG-SST)',
    moduleBadge: 'Motor IA · Agente Principal',
    fieldsLabel: 'Directivas Operativas, Cruces y Formato del Agente IA Principal',
    fields: [
      'Cruzar Datos Estrictamente por Número de Cédula y Nombre Completo',
      'Procesar Únicamente los Campos Seleccionados en los Nodos de Entrada',
      'Prohibido Inventar o Simular Trabajadores, Soportes o Fechas',
      'Clasificar Hallazgos por Prioridad (Crítico / Alto / Medio / Bajo)',
      'Citar Artículos Exactos de la Normativa Colombiana (Dec. 1072 / Res. 0312)',
      'Actualizar Registros Reales en los Aplicativos Conectados de Somos SST',
      'Incluir Tabla Comparativa en Markdown (Estado Actual vs. Brecha Detectada)',
      'Generar Recomendaciones Técnicas con Responsable y Plazo de Cierre',
      'Emitir Resumen Ejecutivo en Tarjeta wappy-card',
    ],
    quickCombos: [
      {
        label: '⚡ Cruce por Cédula + Cero Invención + Tabla de Brechas + wappy-card',
        description: 'Directiva quirúrgica para cruces de trabajadores, Drive y vencimientos',
        fields: [
          'Cruzar Datos Estrictamente por Número de Cédula y Nombre Completo',
          'Procesar Únicamente los Campos Seleccionados en los Nodos de Entrada',
          'Prohibido Inventar o Simular Trabajadores, Soportes o Fechas',
          'Incluir Tabla Comparativa en Markdown (Estado Actual vs. Brecha Detectada)',
          'Emitir Resumen Ejecutivo en Tarjeta wappy-card',
        ],
      },
      {
        label: '⚡ Auditoría Normativa (Dec. 1072 / 0312) + Actualizar Somos SST + Plan de Acción',
        description: 'Directiva completa de auditoría, alimentación de Hitos y recomendaciones',
        fields: [
          'Clasificar Hallazgos por Prioridad (Crítico / Alto / Medio / Bajo)',
          'Citar Artículos Exactos de la Normativa Colombiana (Dec. 1072 / Res. 0312)',
          'Actualizar Registros Reales en los Aplicativos Conectados de Somos SST',
          'Generar Recomendaciones Técnicas con Responsable y Plazo de Cierre',
        ],
      },
    ],
    reportTags: [],
  },

  // ═══ EQUIPO 4: MEMORIAS DEL AGENTE (4 NODOS MEMORY_NODES) ═══
  wappy_memory_company: {
    moduleTitle: '💾 Memoria · Contexto de la Empresa Activa (Somos SST)',
    moduleBadge: 'Memoria · Empresa Activa',
    fieldsLabel: 'Campos Propios de la Memoria de Empresa Activa a Inyectar al Agente',
    fields: [
      'Razón Social y NIT de la Empresa Activa',
      'Código CIIU y Descripción de la Actividad Económica',
      'Clase de Riesgo ARL (Nivel I a V) y Nombre de la ARL Afiliada',
      'Número Total de Trabajadores y Distribución por Sede',
      'Sedes / Centros de Trabajo, Dirección, Ciudad y Departamento',
      'Nombre Completo y Cédula del Representante Legal',
      'Nombre, Cédula y Licencia Vigente del Responsable del SG-SST',
      'Tamaño de Empresa y Capítulo Aplicable Res. 0312 (7, 21 o 60 Estándares)',
      'Puntaje Actual de Autoevaluación Res. 0312 (%)',
      'Peligros Prioritarios y Resumen Ejecutivo de los 8 Hitos',
    ],
    quickCombos: [
      {
        label: '⚡ Razón Social + NIT + CIIU + Riesgo ARL + Total Trabajadores',
        description: 'Contexto corporativo esencial para encabezados e informes SST',
        fields: [
          'Razón Social y NIT de la Empresa Activa',
          'Código CIIU y Descripción de la Actividad Económica',
          'Clase de Riesgo ARL (Nivel I a V) y Nombre de la ARL Afiliada',
          'Número Total de Trabajadores y Distribución por Sede',
        ],
      },
      {
        label: '⚡ Representante Legal + Responsable SST con Licencia + Sedes',
        description: 'Datos oficiales de firma para políticas, reglamentos y actas',
        fields: [
          'Razón Social y NIT de la Empresa Activa',
          'Sedes / Centros de Trabajo, Dirección, Ciudad y Departamento',
          'Nombre Completo y Cédula del Representante Legal',
          'Nombre, Cédula y Licencia Vigente del Responsable del SG-SST',
        ],
      },
      {
        label: '⚡ Capítulo Aplicable Res. 0312 (7/21/60) + Puntaje % + Peligros Prioritarios',
        description: 'Enfoca al agente en el estándar legal exacto según tamaño y riesgo',
        fields: [
          'Tamaño de Empresa y Capítulo Aplicable Res. 0312 (7, 21 o 60 Estándares)',
          'Puntaje Actual de Autoevaluación Res. 0312 (%)',
          'Peligros Prioritarios y Resumen Ejecutivo de los 8 Hitos',
        ],
      },
    ],
    reportTags: ['sgsst-diagnostico'],
  },
  wappy_memory_antiduplicate: {
    moduleTitle: '💾 Memoria · Bitácora Previa Anti-Duplicados (AutomationLog)',
    moduleBadge: 'Memoria · Anti-Duplicados',
    fieldsLabel: 'Reglas y Campos de Control de Historial de Ejecuciones Previas',
    fields: [
      'IDs y Fechas de las Últimas Ejecuciones Exitosas de esta Tarea',
      'Hash / ID de Correos de Gmail ya Procesados en Corridas Anteriores',
      'IDs y Nombres de Archivos de Google Drive / OneDrive ya Analizados',
      'Cédulas de Trabajadores ya Notificados por el Mismo Vencimiento',
      'IDs de Acciones ACPM o Casos ATEL ya Creados Previamente',
      'Detectar Únicamente Diferencias / Delta (Nuevos Hallazgos o Cambios de Estado)',
      'Evitar Reenvío de Alertas Idénticas dentro de la Misma Semana',
      'Trazabilidad Comparativa (Corrida Anterior vs. Corrida Actual)',
    ],
    quickCombos: [
      {
        label: '⚡ Omitir Correos, Archivos Drive y Cédulas ya Procesados (Solo Novedades)',
        description: 'Garantiza que el flujo procese únicamente registros nuevos sin duplicar',
        fields: [
          'Hash / ID de Correos de Gmail ya Procesados en Corridas Anteriores',
          'IDs y Nombres de Archivos de Google Drive / OneDrive ya Analizados',
          'Cédulas de Trabajadores ya Notificados por el Mismo Vencimiento',
          'Detectar Únicamente Diferencias / Delta (Nuevos Hallazgos o Cambios de Estado)',
        ],
      },
      {
        label: '⚡ No Duplicar Tareas ACPM + Comparativa Corrida Anterior vs. Actual',
        description: 'Evita abrir tareas repetidas en el Kanban ACPM y muestra evolución',
        fields: [
          'IDs de Acciones ACPM o Casos ATEL ya Creados Previamente',
          'Evitar Reenvío de Alertas Idénticas dentro de la Misma Semana',
          'Trazabilidad Comparativa (Corrida Anterior vs. Corrida Actual)',
        ],
      },
    ],
    reportTags: [],
  },
  wappy_rag_documental: {
    moduleTitle: '💾 Memoria · RAG Documental (Google NotebookLM + Documentos Vivo)',
    moduleBadge: 'Memoria · RAG Documental',
    fieldsLabel: 'Fuentes Documentales y Cuadernos RAG a Consultar por el Agente',
    fields: [
      'Cuadernos Activos de Google NotebookLM Vinculados a la Empresa',
      'Documentos Vivo Guardados en el Editor Oficial de Somos SST',
      'Manuales, Procedimientos Operativos Estándar (POE) y Protocolos Internos',
      'Reglamento Interno de Trabajo (RIT) y Reglamento de Higiene (RHS) Vigentes',
      'Programas de Vigilancia Epidemiológica (PVE) y Planes de Emergencia',
      'Citas Textuales con Fuente Documental y Página / Sección Exacta',
      'Cruce entre Procedimiento Documentado y Realidad Operativa',
      'Detección de Documentos Desactualizados o sin Firma',
    ],
    quickCombos: [
      {
        label: '⚡ Consultar Cuadernos NotebookLM + Documentos Vivo + Citas Exactas',
        description: 'Fundamenta el análisis en la biblioteca documental propia de la empresa',
        fields: [
          'Cuadernos Activos de Google NotebookLM Vinculados a la Empresa',
          'Documentos Vivo Guardados en el Editor Oficial de Somos SST',
          'Citas Textuales con Fuente Documental y Página / Sección Exacta',
        ],
      },
      {
        label: '⚡ Cruzar Manuales/POE/PVE contra Hallazgos Operativos',
        description: 'Verifica si se están cumpliendo los protocolos internos de la empresa',
        fields: [
          'Manuales, Procedimientos Operativos Estándar (POE) y Protocolos Internos',
          'Programas de Vigilancia Epidemiológica (PVE) y Planes de Emergencia',
          'Cruce entre Procedimiento Documentado y Realidad Operativa',
        ],
      },
    ],
    reportTags: ['sgsst-live-editor'],
  },
  wappy_memory_procedural: {
    moduleTitle: '💾 Memoria · Normativa del Especialista SG-SST Colombia',
    moduleBadge: 'Memoria · Reglas SST Colombia',
    fieldsLabel: 'Marco Legal y Metodologías Oficiales que el Agente Debe Aplicar',
    fields: [
      'Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST)',
      'Resolución 0312 de 2019 (Estándares Mínimos según Tamaño y Riesgo ARL)',
      'Guía Técnica Colombiana GTC-45 (Metodología ND x NE = NP; NP x NC = NR)',
      'Resolución 2764 de 2022 y Ley 1010 de 2006 (Riesgo Psicosocial y Convivencia)',
      'Resolución 20223040040595 de 2022 (Metodología de 24 Pasos del PESV)',
      'Decreto 1496 de 2018 y Resolución 773 de 2021 (Químicos SGA y FDS)',
      'Resolución 4272 de 2021 (Trabajo Seguro en Alturas) y Res. 1401 de 2007 (ATEL)',
      'Resolución 2346 de 2007 y Ley 1581 de 2012 (Reserva de Historia Clínica y Habeas Data)',
    ],
    quickCombos: [
      {
        label: '⚡ Núcleo Legal SST (Dec. 1072 + Res. 0312 + GTC-45 + Res. 1401 ATEL)',
        description: 'Inyecta las normas troncales de auditoría y riesgos laborales en Colombia',
        fields: [
          'Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4, Capítulo 6 — SG-SST)',
          'Resolución 0312 de 2019 (Estándares Mínimos según Tamaño y Riesgo ARL)',
          'Guía Técnica Colombiana GTC-45 (Metodología ND x NE = NP; NP x NC = NR)',
          'Resolución 4272 de 2021 (Trabajo Seguro en Alturas) y Res. 1401 de 2007 (ATEL)',
        ],
      },
      {
        label: '⚡ Normas Especiales (PESV Res. 40595 + Químicos SGA + Psicosocial + Reserva Médica)',
        description: 'Ideal para flujos viales, químicos, psicosociales o de exámenes médicos',
        fields: [
          'Resolución 2764 de 2022 y Ley 1010 de 2006 (Riesgo Psicosocial y Convivencia)',
          'Resolución 20223040040595 de 2022 (Metodología de 24 Pasos del PESV)',
          'Decreto 1496 de 2018 y Resolución 773 de 2021 (Químicos SGA y FDS)',
          'Resolución 2346 de 2007 y Ley 1581 de 2012 (Reserva de Historia Clínica y Habeas Data)',
        ],
      },
    ],
    reportTags: ['sgsst-matriz-legal'],
  },

  // ═══ EQUIPO 5: HERRAMIENTAS DEL AGENTE (INPUT_CONNECTOR_NODES) ═══
  notebooklm: {
    moduleTitle: '🔧 Herramienta · Google NotebookLM (Cuadernos RAG Documentales)',
    moduleBadge: 'Herramienta · NotebookLM',
    fieldsLabel: 'Consultas, Fuentes y Síntesis a Ejecutar en Google NotebookLM',
    fields: [
      'Listado de Cuadernos Activos en Google NotebookLM',
      'Fuentes Documentales Cargadas en el Cuaderno (PDFs, Normas, Manuales, URLs)',
      'Consulta Semántica con Citas Exactas del Documento Origen',
      'Extracción de Tablas Comparativas desde las Fuentes del Cuaderno',
      'Guía de Estudio / Resumen Ejecutivo del Cuaderno',
      'Preguntas Frecuentes (FAQ) y Glosario Técnico Generado',
      'Guion de Audio / Podcast Educativo SST Basado en el Cuaderno',
      'Verificación de Brechas entre el Cuaderno y Somos SST',
    ],
    quickCombos: [
      {
        label: '⚡ Consulta RAG con Citas Exactas + Tablas Comparativas',
        description: 'Interroga los cuadernos de NotebookLM citando cada fuente oficial',
        fields: [
          'Listado de Cuadernos Activos en Google NotebookLM',
          'Fuentes Documentales Cargadas en el Cuaderno (PDFs, Normas, Manuales, URLs)',
          'Consulta Semántica con Citas Exactas del Documento Origen',
          'Extracción de Tablas Comparativas desde las Fuentes del Cuaderno',
        ],
      },
      {
        label: '⚡ Guía de Estudio + FAQ + Cruce de Brechas con Somos SST',
        description: 'Convierte cuadernos documentales en material de capacitación o auditoría',
        fields: [
          'Guía de Estudio / Resumen Ejecutivo del Cuaderno',
          'Preguntas Frecuentes (FAQ) y Glosario Técnico Generado',
          'Verificación de Brechas entre el Cuaderno y Somos SST',
        ],
      },
    ],
    reportTags: [],
  },
  google_flow: {
    moduleTitle: '🔧 Herramienta · Google Flow Studio (Generación Visual Veo / Imagen SST)',
    moduleBadge: 'Herramienta · Google Flow',
    fieldsLabel: 'Piezas Visuales y Audiovisuales SST a Generar con Google Flow',
    fields: [
      'Afiche / Póster Preventivo de Seguridad y Salud en el Trabajo',
      'Infografía Visual de Uso Correcto de EPP por Cargo',
      'Señalización e Ilustración de Peligros Críticos y Rutas de Evacuación',
      'Pieza Gráfica para Campaña de Convivencia Laboral o Seguridad Vial PESV',
      'Escena de Video Educativo / Reel SST (Google Veo 9:16 o 16:9)',
      'Tarjeta Visual de Lección Aprendida ATEL (Antes vs. Práctica Segura)',
      'Portada Ilustrada para Curso de Academia WAPPY LMS',
      'Prompt Visual Técnico Optimizado y Enlace de Descarga HD',
    ],
    quickCombos: [
      {
        label: '⚡ Afiche Preventivo SST + Infografía de EPP + Lección Aprendida Visual',
        description: 'Genera piezas gráficas listas para publicar en carteleras o enviar por correo',
        fields: [
          'Afiche / Póster Preventivo de Seguridad y Salud en el Trabajo',
          'Infografía Visual de Uso Correcto de EPP por Cargo',
          'Tarjeta Visual de Lección Aprendida ATEL (Antes vs. Práctica Segura)',
          'Prompt Visual Técnico Optimizado y Enlace de Descarga HD',
        ],
      },
      {
        label: '⚡ Video Educativo SST (Google Veo) + Campaña Vial/Convivencia',
        description: 'Produce material audiovisual para capacitaciones y sensibilización',
        fields: [
          'Pieza Gráfica para Campaña de Convivencia Laboral o Seguridad Vial PESV',
          'Escena de Video Educativo / Reel SST (Google Veo 9:16 o 16:9)',
          'Portada Ilustrada para Curso de Academia WAPPY LMS',
        ],
      },
    ],
    reportTags: [],
  },
  pronostico_clima_sst: {
    moduleTitle: '🔧 Herramienta · OpenWeather API (Clima, UV y Alertas SST en Terreno)',
    moduleBadge: 'API Científica · OpenWeather',
    fieldsLabel: 'Variables Meteorológicas y Alertas Operativas SST a Consultar',
    fields: [
      'Ciudad, Coordenadas y Sede / Frente de Obra Consultado',
      'Temperatura Actual (°C), Sensación Térmica e Índice de Calor (Estrés Térmico)',
      'Probabilidad de Lluvia, Precipitación (mm) y Tormenta Eléctrica',
      'Velocidad del Viento (km/h) y Ráfagas Máximas (Crítico para Trabajo en Alturas e Izajes)',
      'Índice de Radiación Ultravioleta (UV) y Recomendación de Protección Solar',
      'Humedad Relativa (%) y Visibilidad en Ruta (Crítico para Seguridad Vial PESV)',
      'Pronóstico Extendido por Horas para la Jornada Laboral',
      'Concepto Operativo Automático (Autorizar o Suspender Trabajo en Alturas / Intemperie)',
    ],
    quickCombos: [
      {
        label: '⚡ Viento (km/h) + Tormenta Eléctrica + Lluvia (Suspensión Trabajo en Alturas)',
        description: 'Verifica condiciones atmosféricas antes de autorizar permisos de alturas o izajes',
        fields: [
          'Ciudad, Coordenadas y Sede / Frente de Obra Consultado',
          'Probabilidad de Lluvia, Precipitación (mm) y Tormenta Eléctrica',
          'Velocidad del Viento (km/h) y Ráfagas Máximas (Crítico para Trabajo en Alturas e Izajes)',
          'Concepto Operativo Automático (Autorizar o Suspender Trabajo en Alturas / Intemperie)',
        ],
      },
      {
        label: '⚡ Estrés Térmico + Radiación UV + Visibilidad Vial PESV',
        description: 'Recomendaciones de hidratación, protección solar y conducción segura bajo lluvia',
        fields: [
          'Temperatura Actual (°C), Sensación Térmica e Índice de Calor (Estrés Térmico)',
          'Índice de Radiación Ultravioleta (UV) y Recomendación de Protección Solar',
          'Humedad Relativa (%) y Visibilidad en Ruta (Crítico para Seguridad Vial PESV)',
          'Pronóstico Extendido por Horas para la Jornada Laboral',
        ],
      },
    ],
    reportTags: ['sgsst-permiso-alturas', 'sgsst-matriz-pesv'],
  },
  consultar_pubchem_quimico: {
    moduleTitle: '🔧 Herramienta · PubChem NIH (Fichas Químicas, CAS y Clasificación GHS/SGA)',
    moduleBadge: 'API Científica · PubChem NIH',
    fieldsLabel: 'Datos Toxicológicos y SGA a Consultar en la Base Oficial PubChem (NIH)',
    fields: [
      'Nombre Químico Oficial IUPAC, Sinónimos y Fórmula Molecular',
      'Número CAS Verificado y CID de PubChem NIH',
      'Clasificación Oficial del Sistema Globalmente Armonizado (Pictogramas GHS01 a GHS09)',
      'Palabra de Advertencia Oficial (Peligro / Atención)',
      'Indicaciones de Peligro Estandarizadas (Códigos y Frases H)',
      'Consejos de Prudencia Estandarizados (Códigos y Frases P)',
      'Propiedades Fisicoquímicas (Punto de Inflamación, pH, Presión de Vapor, Solubilidad)',
      'Incompatibilidades Químicas Reactivas y Productos de Descomposición Peligrosos',
      'Límites de Exposición Ocupacional (TLV / PEL / NIOSH REL) y Toxicidad Aguda',
      'Medidas de Primeros Auxilios, Control de Derrames y Agente Extintor',
    ],
    quickCombos: [
      {
        label: '⚡ Número CAS + Pictogramas GHS/SGA + Frases H y P Oficiales',
        description: 'Completa automáticamente el rótulo SGA Decreto 1496 y el inventario químico',
        fields: [
          'Nombre Químico Oficial IUPAC, Sinónimos y Fórmula Molecular',
          'Número CAS Verificado y CID de PubChem NIH',
          'Clasificación Oficial del Sistema Globalmente Armonizado (Pictogramas GHS01 a GHS09)',
          'Palabra de Advertencia Oficial (Peligro / Atención)',
          'Indicaciones de Peligro Estandarizadas (Códigos y Frases H)',
          'Consejos de Prudencia Estandarizados (Códigos y Frases P)',
        ],
      },
      {
        label: '⚡ Incompatibilidades Reactivas + Límites TLV/NIOSH + Primeros Auxilios',
        description: 'Cruza compatibilidad de almacenamiento y emergencia química',
        fields: [
          'Propiedades Fisicoquímicas (Punto de Inflamación, pH, Presión de Vapor, Solubilidad)',
          'Incompatibilidades Químicas Reactivas y Productos de Descomposición Peligrosos',
          'Límites de Exposición Ocupacional (TLV / PEL / NIOSH REL) y Toxicidad Aguda',
          'Medidas de Primeros Auxilios, Control de Derrames y Agente Extintor',
        ],
      },
    ],
    reportTags: ['sgsst-chemicals', 'sgsst-matriz-compatibilidad'],
  },
  consultar_medlineplus_rehabilitacion: {
    moduleTitle: '🔧 Herramienta · MedlinePlus NIH (Guías Clínicas CIE-10 y Rehabilitación Laboral)',
    moduleBadge: 'API Científica · MedlinePlus NIH',
    fieldsLabel: 'Información Médica Basada en Evidencia (NIH) por Diagnóstico CIE-10',
    fields: [
      'Código Diagnóstico CIE-10 y Nombre Clínico de la Patología',
      'Definición Médica Oficial y Sistema Anatómico Comprometido (MedlinePlus NIH)',
      'Factores de Riesgo Ocupacionales y Biomecánicos que Agravan la Patología',
      'Sintomatología de Alerta Temprana y Signos de Bandera Roja',
      'Pautas de Rehabilitación Funcional, Higiene Postural y Autocuidado',
      'Recomendaciones de Restricción o Adaptación Temporal de Tareas',
      'Criterios de Inclusión en Programa de Vigilancia Epidemiológica (PVE)',
      'Referencias Clínicas Oficiales (National Library of Medicine — NIH)',
    ],
    quickCombos: [
      {
        label: '⚡ Código CIE-10 + Factores que Agravan + Adaptación de Puesto y PVE',
        description: 'Traduce diagnósticos médicos de incapacidades o EMO en controles preventivos SST',
        fields: [
          'Código Diagnóstico CIE-10 y Nombre Clínico de la Patología',
          'Factores de Riesgo Ocupacionales y Biomecánicos que Agravan la Patología',
          'Recomendaciones de Restricción o Adaptación Temporal de Tareas',
          'Criterios de Inclusión en Programa de Vigilancia Epidemiológica (PVE)',
        ],
      },
      {
        label: '⚡ Guía de Rehabilitación Funcional + Signos de Alerta + Fuente NIH',
        description: 'Soporte clínico para Estudios de Puesto de Trabajo (EPT) y reintegro laboral',
        fields: [
          'Definición Médica Oficial y Sistema Anatómico Comprometido (MedlinePlus NIH)',
          'Sintomatología de Alerta Temprana y Signos de Bandera Roja',
          'Pautas de Rehabilitación Funcional, Higiene Postural y Autocuidado',
          'Referencias Clínicas Oficiales (National Library of Medicine — NIH)',
        ],
      },
    ],
    reportTags: ['sgsst-condiciones-salud', 'sgsst-owas'],
  },
  buscar_centros_emergencia: {
    moduleTitle: '🔧 Herramienta · OpenStreetMap (Hospitales, Clínicas ARL y Bomberos Cercanos)',
    moduleBadge: 'API Geoespacial · OpenStreetMap',
    fieldsLabel: 'Datos Geoespaciales de Socorro y Red Asistencial para el MEDEVAC',
    fields: [
      'Dirección y Coordenadas GPS de la Sede o Frente de Obra',
      'Hospitales, Clínicas de Trauma y Centros de Urgencias en Radio de 5 a 10 km',
      'Nivel de Complejidad Hospitalaria y Atención de Urgencias ARL',
      'Estaciones de Cuerpo Oficial de Bomberos y Defensa Civil Cercanas',
      'Comandos de Policía Nacional y Centros de Atención Inmediata (CAI)',
      'Distancia en Kilómetros y Tiempo Estimado de Traslado en Ambulancia',
      'Dirección Exacta, Teléfonos de Urgencias y Coordenadas del Centro Médico',
      'Ruta Principal y Ruta Alterna para el Plan de Evacuación Médica (MEDEVAC)',
    ],
    quickCombos: [
      {
        label: '⚡ Clínicas/Hospitales Cercanos + Distancia/Tiempo + Ruta MEDEVAC',
        description: 'Actualiza el directorio médico de urgencias y MEDEVAC del Plan de Emergencias',
        fields: [
          'Dirección y Coordenadas GPS de la Sede o Frente de Obra',
          'Hospitales, Clínicas de Trauma y Centros de Urgencias en Radio de 5 a 10 km',
          'Distancia en Kilómetros y Tiempo Estimado de Traslado en Ambulancia',
          'Dirección Exacta, Teléfonos de Urgencias y Coordenadas del Centro Médico',
          'Ruta Principal y Ruta Alterna para el Plan de Evacuación Médica (MEDEVAC)',
        ],
      },
      {
        label: '⚡ Estaciones de Bomberos + Defensa Civil + Policía Cercana a la Sede',
        description: 'Directorio completo de entidades de socorro externo por sede',
        fields: [
          'Estaciones de Cuerpo Oficial de Bomberos y Defensa Civil Cercanas',
          'Comandos de Policía Nacional y Centros de Atención Inmediata (CAI)',
          'Dirección Exacta, Teléfonos de Urgencias y Coordenadas del Centro Médico',
        ],
      },
    ],
    reportTags: ['sgsst-plan-emergencias', 'sgsst-vulnerabilidad'],
  },
  webhook_api: {
    moduleTitle: '🔧 Herramienta · Webhook API / Integración Buk RRHH & ERP',
    moduleBadge: 'Herramienta · API / Buk RRHH',
    fieldsLabel: 'Datos de Nómina, Altas/Bajas y Novedades a Consultar vía API / Buk RRHH',
    fields: [
      'Listado de Trabajadores Activos y Nuevos Ingresos en Buk RRHH / ERP',
      'Retiros y Liquidaciones de Personal en el Período',
      'Cédula / Documento, Nombre Completo, Cargo y Centro de Costos',
      'Afiliaciones Vigentes a EPS, ARL, Fondo de Pensiones (AFP) y Caja',
      'Novedades de Ausentismo, Licencias e Incapacidades Reportadas en Nómina',
      'Cambios de Cargo, Salario o Traslados de Sede',
      'Sincronización Bidireccional con el Perfil Sociodemográfico de Somos SST',
      'Estado de Respuesta del Endpoint REST y Fecha de Corte',
    ],
    quickCombos: [
      {
        label: '⚡ Altas y Retiros en Buk RRHH + Cédula/Nombre/Cargo + EPS/ARL/AFP',
        description: 'Cruza la nómina de Recursos Humanos contra los expedientes de Somos SST',
        fields: [
          'Listado de Trabajadores Activos y Nuevos Ingresos en Buk RRHH / ERP',
          'Retiros y Liquidaciones de Personal en el Período',
          'Cédula / Documento, Nombre Completo, Cargo y Centro de Costos',
          'Afiliaciones Vigentes a EPS, ARL, Fondo de Pensiones (AFP) y Caja',
        ],
      },
      {
        label: '⚡ Novedades de Ausentismo/Incapacidades y Cambios de Cargo en Nómina',
        description: 'Detecta incapacidades registradas en RRHH que falten en el Hito 7',
        fields: [
          'Cédula / Documento, Nombre Completo, Cargo y Centro de Costos',
          'Novedades de Ausentismo, Licencias e Incapacidades Reportadas en Nómina',
          'Cambios de Cargo, Salario o Traslados de Sede',
          'Sincronización Bidireccional con el Perfil Sociodemográfico de Somos SST',
        ],
      },
    ],
    reportTags: ['sgsst-perfil-sociodemografico', 'sgsst-estadisticas-atel'],
  },
  google_calendar: {
    moduleTitle: '🔧📤 Conector · Google Calendar (Agenda, Vencimientos y Auditorías SST)',
    moduleBadge: 'Conector · Google Calendar',
    fieldsLabel: 'Eventos, Recordatorios y Citaciones SST en Google Calendar',
    fields: [
      'Título del Evento SST (Vencimiento EMO, Reunión COPASST/CCL, Simulacro, Auditoría, Recarga Extintor)',
      'Fecha y Hora de Inicio y Finalización del Evento',
      'Descripción Técnica con Listado de Cédulas, Nombres o Placas en Alerta',
      'Invitados y Correos de Responsables Convocados',
      'Recordatorios Automáticos Previos (7 días, 1 día y 1 hora antes)',
      'Ubicación / Sede o Enlace de Reunión Virtual (Google Meet)',
      'Frecuencia de Recurrencia (Mensual COPASST / Trimestral CCL y PESV / Anual)',
      'Verificación de Conflictos en Agenda y Confirmación del Evento Creado',
    ],
    quickCombos: [
      {
        label: '⚡ Agendar Alerta de Vencimientos (EMO / Alturas / SOAT / Extintores)',
        description: 'Crea eventos de recordatorio en Google Calendar para que ningún soporte venza',
        fields: [
          'Título del Evento SST (Vencimiento EMO, Reunión COPASST/CCL, Simulacro, Auditoría, Recarga Extintor)',
          'Fecha y Hora de Inicio y Finalización del Evento',
          'Descripción Técnica con Listado de Cédulas, Nombres o Placas en Alerta',
          'Recordatorios Automáticos Previos (7 días, 1 día y 1 hora antes)',
        ],
      },
      {
        label: '⚡ Programar Reunión de Comité (COPASST / CCL / PESV) o Auditoría con Invitados',
        description: 'Agenda sesiones obligatorias de comités e invita a los integrantes',
        fields: [
          'Título del Evento SST (Vencimiento EMO, Reunión COPASST/CCL, Simulacro, Auditoría, Recarga Extintor)',
          'Invitados y Correos de Responsables Convocados',
          'Ubicación / Sede o Enlace de Reunión Virtual (Google Meet)',
          'Frecuencia de Recurrencia (Mensual COPASST / Trimestral CCL y PESV / Anual)',
        ],
      },
    ],
    reportTags: [],
  },

  // ═══ EQUIPO 7: BITÁCORA & SALIDA (OUTPUT_ACTION_NODES) ═══
  email_report: {
    moduleTitle: '📤 Salida · Enviar Bitácora Completa a Gmail / Correo Electrónico',
    moduleBadge: 'Salida · Informe Email',
    fieldsLabel: 'Secciones y Tablas a Incluir en la Bitácora Enviada por Correo Electrónico',
    fields: [
      'Asunto Ejecutivo con Razón Social, NIT y Nivel de Alerta',
      'Resumen Gerencial de Hallazgos y KPIs Procesados',
      'Tabla Nominal de Trabajadores (Cédula, Nombre, Cargo y Novedad)',
      'Tabla de Certificados o Soportes Vencidos / Faltantes',
      'Detalle de Cambios Guardados en los Aplicativos de Somos SST',
      'Fundamentación Normativa Aplicada (Dec. 1072 / Res. 0312)',
      'Plan de Acción Recomendado con Responsables y Fechas Límite',
      'Destinatarios (Responsable SST, Representante Legal, COPASST o RRHH)',
      'Formato HTML Corporativo WAPPY con Tablas Estilizadas',
    ],
    quickCombos: [
      {
        label: '⚡ Resumen Ejecutivo + Tabla por Cédula/Nombre + Plan de Acción',
        description: 'Correo gerencial limpio con hallazgos puntuales y responsables',
        fields: [
          'Asunto Ejecutivo con Razón Social, NIT y Nivel de Alerta',
          'Resumen Gerencial de Hallazgos y KPIs Procesados',
          'Tabla Nominal de Trabajadores (Cédula, Nombre, Cargo y Novedad)',
          'Plan de Acción Recomendado con Responsables y Fechas Límite',
        ],
      },
      {
        label: '⚡ Bitácora de Auditoría Completa + Cambios en Somos SST + Base Legal',
        description: 'Informe exhaustivo de todo lo leído y actualizado en la corrida',
        fields: [
          'Tabla de Certificados o Soportes Vencidos / Faltantes',
          'Detalle de Cambios Guardados en los Aplicativos de Somos SST',
          'Fundamentación Normativa Aplicada (Dec. 1072 / Res. 0312)',
          'Formato HTML Corporativo WAPPY con Tablas Estilizadas',
        ],
      },
    ],
    reportTags: [],
  },
  wappy_notification: {
    moduleTitle: '📤 Salida · Notificación Directa en WAPPY + Chat de Tenshi IA',
    moduleBadge: 'Salida · Alerta WAPPY',
    fieldsLabel: 'Elementos a Entregar en la Campana de WAPPY y en el Chat de Tenshi',
    fields: [
      'Alerta Instantánea en la Campana de Notificaciones de WAPPY',
      'Mensaje Ejecutivo en el Chat de Tenshi IA con Tarjeta Interactiva wappy-card',
      'Contador de Hallazgos Críticos, Altos y Moderados Detectados',
      'Listado Rápido de Cédulas y Trabajadores en Alerta',
      'Resumen de Registros Actualizados en Somos SST',
      'Botones de Acción Rápida hacia el Aplicativo o Hito Correspondiente',
      'Nivel de Prioridad Visual (Crítica Roja / Preventiva Ámbar / Informativa Verde)',
      'Registro Permanente en el Historial de Ejecuciones de la Tarea',
    ],
    quickCombos: [
      {
        label: '⚡ Alerta en Campana WAPPY + Tarjeta wappy-card en Tenshi + Cédulas Críticas',
        description: 'Notificación visual inmediata dentro de la plataforma WAPPY',
        fields: [
          'Alerta Instantánea en la Campana de Notificaciones de WAPPY',
          'Mensaje Ejecutivo en el Chat de Tenshi IA con Tarjeta Interactiva wappy-card',
          'Contador de Hallazgos Críticos, Altos y Moderados Detectados',
          'Listado Rápido de Cédulas y Trabajadores en Alerta',
        ],
      },
      {
        label: '⚡ Resumen de Cambios en Somos SST + Enlace Directo al Hito',
        description: 'Confirma qué módulos se alimentaron y permite abrirlos en 1 clic',
        fields: [
          'Resumen de Registros Actualizados en Somos SST',
          'Botones de Acción Rápida hacia el Aplicativo o Hito Correspondiente',
          'Registro Permanente en el Historial de Ejecuciones de la Tarea',
        ],
      },
    ],
    reportTags: [],
  },
  antigravity_local_report: {
    moduleTitle: '📤 Salida · Enviar Resultado / Bitácora a Google Antigravity (Mi PC)',
    moduleBadge: 'Salida · Antigravity PC',
    fieldsLabel: 'Datos y Artefactos a Entregar en tu Instancia Local de Google Antigravity',
    fields: [
      'Bitácora Completa en Markdown Enviada por Puente Push SSE a tu Mac/PC',
      'Tablas Estructuradas y JSON de Hallazgos para Procesamiento Local',
      'Guardado Automático de Reporte en Carpeta Local del Computador',
      'Listado de Trabajadores, Cédulas y Brechas Detectadas',
      'Estado de Sincronización con los 8 Hitos de Somos SST',
      'Logs de Herramientas MCP Invocadas Durante la Corrida',
      'Notificación en Vivo en la Terminal del Daemon Local',
      'Recomendaciones Técnicas Siguientes para el Especialista',
    ],
    quickCombos: [
      {
        label: '⚡ Bitácora Markdown por Push SSE + Guardado en Carpeta Local PC',
        description: 'Recibe el informe directamente en tu computador conectado con Antigravity',
        fields: [
          'Bitácora Completa en Markdown Enviada por Puente Push SSE a tu Mac/PC',
          'Guardado Automático de Reporte en Carpeta Local del Computador',
          'Listado de Trabajadores, Cédulas y Brechas Detectadas',
          'Estado de Sincronización con los 8 Hitos de Somos SST',
        ],
      },
      {
        label: '⚡ Payload JSON + Logs MCP + Terminal en Vivo',
        description: 'Entrega técnica detallada para flujos de ingeniería y automatización local',
        fields: [
          'Tablas Estructuradas y JSON de Hallazgos para Procesamiento Local',
          'Logs de Herramientas MCP Invocadas Durante la Corrida',
          'Notificación en Vivo en la Terminal del Daemon Local',
        ],
      },
    ],
    reportTags: [],
  },
  antigravity_cloud_report: {
    moduleTitle: '📤 Salida · Enviar Resultado / Bitácora a Google Antigravity Cloud 24/7',
    moduleBadge: 'Salida · Antigravity Cloud',
    fieldsLabel: 'Datos y Artefactos a Entregar en Google Antigravity Cloud (antigravity.google.com)',
    fields: [
      'Bitácora Ejecutiva en tu Workspace de Google Antigravity Cloud 24/7',
      ' Artefacto Markdown con Tablas de Cumplimiento y Brechas SST',
      'Listado Nominal de Cédulas, Trabajadores y Vencimientos Procesados',
      'Confirmación de Escritura en Base de Datos de Somos SST vía MCP',
      'Resumen de Indicadores y Score Predictivo Actualizado',
      'Trazabilidad de Ejecución Cloud 24/7 (Sin Dependencia de PC Local)',
      'Sincronización con Historial de Automatizaciones WAPPY',
      'Plan de Seguimiento para la Próxima Ejecución Programada',
    ],
    quickCombos: [
      {
        label: '⚡ Artefacto Markdown en AGY Cloud + Confirmación MCP Somos SST',
        description: 'Centraliza el reporte en tu instancia de antigravity.google.com y en WAPPY',
        fields: [
          'Bitácora Ejecutiva en tu Workspace de Google Antigravity Cloud 24/7',
          ' Artefacto Markdown con Tablas de Cumplimiento y Brechas SST',
          'Confirmación de Escritura en Base de Datos de Somos SST vía MCP',
          'Sincronización con Historial de Automatizaciones WAPPY',
        ],
      },
      {
        label: '⚡ Cédulas Procesadas + Indicadores + Plan de Seguimiento Cloud',
        description: 'Resumen operativo de trabajadores e indicadores auditados en la nube',
        fields: [
          'Listado Nominal de Cédulas, Trabajadores y Vencimientos Procesados',
          'Resumen de Indicadores y Score Predictivo Actualizado',
          'Plan de Seguimiento para la Próxima Ejecución Programada',
        ],
      },
    ],
    reportTags: [],
  },
  somos_sst_update: {
    moduleTitle: '📤 Salida · Alimentar / Guardar Cambios en Aplicativo Somos SST',
    moduleBadge: 'Salida · Actualiza BD SST',
    fieldsLabel: 'Operaciones de Escritura y Sincronización en Base de Datos de Somos SST',
    fields: [
      'Crear o Actualizar Expedientes de Trabajadores por Cédula (No Duplicar)',
      'Actualizar Fechas y Conceptos de Exámenes Médicos Ocupacionales (EMO)',
      'Actualizar Certificados de Afiliación (EPS, ARL, AFP) y Cursos de Alturas',
      'Alimentar Peligros y Controles en Matriz IPEVR GTC-45 o Bio-IPEVR',
      'Alimentar Riesgos Viales PESV, Parque Automotor o Inventario Químico SGA',
      'Actualizar Calificaciones y Evidencias del Diagnóstico Res. 0312',
      'Registrar Actas, Compromisos o Reportes de Actos y Condiciones Inseguras',
      'Validación Estricta de Datos Reales Antes de Guardar en MongoDB',
      'Resumen de Registros Creados vs. Registros Actualizados',
    ],
    quickCombos: [
      {
        label: '⚡ Actualizar Trabajadores por Cédula (EMO + EPS/ARL/AFP + Alturas)',
        description: 'Sincroniza expedientes de colaboradores sin duplicar cédulas existentes',
        fields: [
          'Crear o Actualizar Expedientes de Trabajadores por Cédula (No Duplicar)',
          'Actualizar Fechas y Conceptos de Exámenes Médicos Ocupacionales (EMO)',
          'Actualizar Certificados de Afiliación (EPS, ARL, AFP) y Cursos de Alturas',
          'Resumen de Registros Creados vs. Registros Actualizados',
        ],
      },
      {
        label: '⚡ Alimentar Matrices e Indicadores (0312 + GTC-45 + PESV + Químicos)',
        description: 'Guarda los hallazgos analizados directamente en los aplicativos de los 8 Hitos',
        fields: [
          'Alimentar Peligros y Controles en Matriz IPEVR GTC-45 o Bio-IPEVR',
          'Alimentar Riesgos Viales PESV, Parque Automotor o Inventario Químico SGA',
          'Actualizar Calificaciones y Evidencias del Diagnóstico Res. 0312',
          'Validación Estricta de Datos Reales Antes de Guardar en MongoDB',
        ],
      },
    ],
    reportTags: ['sgsst-diagnostico', 'sgsst-perfil-sociodemografico'],
  },
  canvas_doc: {
    moduleTitle: '📤 Salida · Crear Documento Formal en Editor en Vivo WAPPY (LiveEditor)',
    moduleBadge: 'Salida · Documento LiveEditor',
    fieldsLabel: 'Estructura del Documento Formal Exportable a Word/PDF en LiveEditor',
    fields: [
      'Cabezote Oficial de Control Documental (Logo, Razón Social, NIT, Código, Versión y Fecha)',
      'Título Oficial del Informe, Acta, Procedimiento o Programa SST',
      'Marco Normativo y Alcance Aplicable a la Empresa',
      'Tablas Comparativas con Bordes Sólidos Exportables a Word (.docx) y PDF',
      'Listado Nominal de Trabajadores, Cédulas y Hallazgos Evaluados',
      'Análisis Técnico, Conclusiones y Recomendaciones del Especialista',
      'Plan de Acción con Responsables y Fechas de Cumplimiento',
      'Bloque de Firmas Oficiales (Representante Legal y Responsable SG-SST con Licencia)',
      'Guardado Automático en el Historial de Informes del Aplicativo',
    ],
    quickCombos: [
      {
        label: '⚡ Cabezote Oficial + Tablas Exportables Word/PDF + Bloque de Firmas',
        description: 'Genera un documento listo para imprimir o descargar en Word/PDF con 1 clic',
        fields: [
          'Cabezote Oficial de Control Documental (Logo, Razón Social, NIT, Código, Versión y Fecha)',
          'Tablas Comparativas con Bordes Sólidos Exportables a Word (.docx) y PDF',
          'Bloque de Firmas Oficiales (Representante Legal y Responsable SG-SST con Licencia)',
          'Guardado Automático en el Historial de Informes del Aplicativo',
        ],
      },
      {
        label: '⚡ Informe Técnico Completo (Marco Legal + Cédulas + Plan de Acción)',
        description: 'Estructura formal de auditoría o inspección para presentar a gerencia o ARL',
        fields: [
          'Título Oficial del Informe, Acta, Procedimiento o Programa SST',
          'Marco Normativo y Alcance Aplicable a la Empresa',
          'Listado Nominal de Trabajadores, Cédulas y Hallazgos Evaluados',
          'Plan de Acción con Responsables y Fechas de Cumplimiento',
        ],
      },
    ],
    reportTags: ['sgsst-live-editor'],
  },
  google_docs: {
    moduleTitle: '🔧📤 Conector · Crear / Leer Informe Formal en Google Docs',
    moduleBadge: 'Conector · Google Docs',
    fieldsLabel: 'Elementos del Documento en Google Docs a Leer o Generar',
    fields: [
      'Título del Documento en Google Docs con Fecha y Razón Social',
      'Encabezado Normativo (NIT, CIIU, Nivel de Riesgo ARL y Responsable SST)',
      'Resumen Ejecutivo de Hallazgos y Cumplimiento Legal',
      'Tablas Estructuradas de Trabajadores (Cédula, Nombre, Cargo y Estado)',
      'Desarrollo de Capítulos, Actas o Procedimientos Técnicos SST',
      'Conclusiones, Plan de Acción ACPM y Bloque de Firmas',
      'Carpeta de Destino en Google Drive y Enlace Compartible',
      'Preservar Historial de Versiones en Google Workspace',
    ],
    quickCombos: [
      {
        label: '⚡ Crear Informe en Google Docs + Tablas por Cédula + Enlace Drive',
        description: 'Exporta el dictamen formal directamente a la cuenta de Google Docs vinculada',
        fields: [
          'Título del Documento en Google Docs con Fecha y Razón Social',
          'Encabezado Normativo (NIT, CIIU, Nivel de Riesgo ARL y Responsable SST)',
          'Tablas Estructuradas de Trabajadores (Cédula, Nombre, Cargo y Estado)',
          'Carpeta de Destino en Google Drive y Enlace Compartible',
        ],
      },
      {
        label: '⚡ Acta / Procedimiento SST + Plan de Acción + Bloque de Firmas',
        description: 'Ideal para actas de COPASST, CCL, PESV o informes de auditoría',
        fields: [
          'Resumen Ejecutivo de Hallazgos y Cumplimiento Legal',
          'Desarrollo de Capítulos, Actas o Procedimientos Técnicos SST',
          'Conclusiones, Plan de Acción ACPM y Bloque de Firmas',
        ],
      },
    ],
    reportTags: [],
  },
  google_sheets: {
    moduleTitle: '🔧📤 Conector · Registrar / Leer Filas en Google Sheets (Hojas de Cálculo)',
    moduleBadge: 'Conector · Google Sheets',
    fieldsLabel: 'Columnas y Hojas de Cálculo a Leer o Actualizar en Google Sheets',
    fields: [
      'ID o Nombre del Libro de Google Sheets y Pestaña Objetivo',
      'Columnas de Identificación: Cédula / Documento, Nombre Completo y Cargo',
      'Columnas de Seguridad Social: EPS, ARL, AFP y Estado PILA',
      'Columnas de Vencimientos: Fecha EMO, Curso Alturas, SOAT, RTM o Extintores',
      'Columnas de Valoración de Riesgos: Peligro, ND, NE, NP, NC, NR y Controles',
      'Columnas de Seguimiento ACPM: Hallazgo, Responsable, Fecha Límite y Estado',
      'Actualizar Filas Existentes por Cédula / Código sin Duplicar',
      'Fecha y Hora de Sincronización Automática desde WAPPY',
    ],
    quickCombos: [
      {
        label: '⚡ Registrar Cédula + Nombre + Cargo + Vencimientos (EMO/Alturas/EPS/ARL)',
        description: 'Mantiene sincronizada tu matriz de control de personal en Google Sheets',
        fields: [
          'ID o Nombre del Libro de Google Sheets y Pestaña Objetivo',
          'Columnas de Identificación: Cédula / Documento, Nombre Completo y Cargo',
          'Columnas de Seguridad Social: EPS, ARL, AFP y Estado PILA',
          'Columnas de Vencimientos: Fecha EMO, Curso Alturas, SOAT, RTM o Extintores',
          'Actualizar Filas Existentes por Cédula / Código sin Duplicar',
        ],
      },
      {
        label: '⚡ Sincronizar Matriz de Riesgos (GTC-45/PESV) y Seguimiento ACPM en Sheets',
        description: 'Exporta peligros valorados y acciones abiertas hacia hojas de cálculo',
        fields: [
          'Columnas de Valoración de Riesgos: Peligro, ND, NE, NP, NC, NR y Controles',
          'Columnas de Seguimiento ACPM: Hallazgo, Responsable, Fecha Límite y Estado',
          'Fecha y Hora de Sincronización Automática desde WAPPY',
        ],
      },
    ],
    reportTags: [],
  },
  google_slides: {
    moduleTitle: '📤 Salida · Generar Presentación Ejecutiva en Google Slides',
    moduleBadge: 'Salida · Google Slides',
    fieldsLabel: 'Diapositivas y Gráficos Ejecutivos a Estructurar en Google Slides',
    fields: [
      'Diapositiva 1: Portada Corporativa (Razón Social, NIT, Período y Responsable SST)',
      'Diapositiva 2: Cuadro de Mando de Cumplimiento Res. 0312 (%) y Ciclo PHVA',
      'Diapositiva 3: Indicadores Mínimos ATEL y Ausentismo (Art. 30 Res. 0312)',
      'Diapositiva 4: Top Peligros Críticos (GTC-45, PESV y Químicos SGA)',
      'Diapositiva 5: Estado de Exámenes Médicos (EMO), Alturas y Capacitaciones',
      'Diapositiva 6: Alertas del Oráculo Predictivo IA y Gemelo Digital SST',
      'Diapositiva 7: Avance del Tablero Kanban ACPM y Compromisos de Comités',
      'Diapositiva 8: Decisiones y Presupuesto para Revisión por la Alta Dirección',
    ],
    quickCombos: [
      {
        label: '⚡ Presentación para Alta Dirección (0312 + Indicadores ATEL + Presupuesto)',
        description: 'Genera la presentación gerencial de rendición de cuentas del SG-SST',
        fields: [
          'Diapositiva 1: Portada Corporativa (Razón Social, NIT, Período y Responsable SST)',
          'Diapositiva 2: Cuadro de Mando de Cumplimiento Res. 0312 (%) y Ciclo PHVA',
          'Diapositiva 3: Indicadores Mínimos ATEL y Ausentismo (Art. 30 Res. 0312)',
          'Diapositiva 8: Decisiones y Presupuesto para Revisión por la Alta Dirección',
        ],
      },
      {
        label: '⚡ Presentación Técnica (Peligros Críticos + EMO/Alturas + Oráculo IA + ACPM)',
        description: 'Ideal para reuniones mensuales del COPASST, Comité Vial o capacitaciones',
        fields: [
          'Diapositiva 4: Top Peligros Críticos (GTC-45, PESV y Químicos SGA)',
          'Diapositiva 5: Estado de Exámenes Médicos (EMO), Alturas y Capacitaciones',
          'Diapositiva 6: Alertas del Oráculo Predictivo IA y Gemelo Digital SST',
          'Diapositiva 7: Avance del Tablero Kanban ACPM y Compromisos de Comités',
        ],
      },
    ],
    reportTags: ['sgsst-alta-direccion'],
  },

  // ═══ EQUIPO 8: SKILLS, SUB-AGENTES, REGLAS & SCRAPING (SKILL_RULE_SUBAGENT_NODES) ═══
  skill_sgsst_tools: {
    moduleTitle: '🧩 Skill · Herramientas Operativas SG-SST (GTC-45, PESV y SGA)',
    moduleBadge: 'Skill · Motores SST',
    fieldsLabel: 'Metodologías y Fórmulas de la Skill a Ejecutar por el Agente',
    fields: [
      'Cálculo Matemático GTC-45: ND x NE = NP; NP x NC = NR (Niveles I a IV)',
      'Jerarquía de Controles SST: Eliminación, Sustitución, Ingeniería, Administrativos y EPP',
      'Metodología PESV Res. 20223040040595: Probabilidad x Severidad por Actor Vial',
      'Matriz de Compatibilidad Química SGA Dec. 1496 (Clases ONU 1 a 9 y Ácido vs. Base)',
      'Validación de Vigencia de FDS (< 5 Años) y Etiquetado de Trasvase',
      'Cruce de Peligros del Cargo con Profesiograma y Exámenes EMO',
      'Activación Automática de Acciones en Tablero Kanban ACPM',
      'Plantilla de Tablas Técnicas Exportables a Word/PDF',
    ],
    quickCombos: [
      {
        label: '⚡ Cálculo GTC-45 (ND, NE, NP, NC, NR) + Jerarquía de Controles',
        description: 'Aplica rigor matemático en la valoración de peligros IPEVR',
        fields: [
          'Cálculo Matemático GTC-45: ND x NE = NP; NP x NC = NR (Niveles I a IV)',
          'Jerarquía de Controles SST: Eliminación, Sustitución, Ingeniería, Administrativos y EPP',
          'Cruce de Peligros del Cargo con Profesiograma y Exámenes EMO',
        ],
      },
      {
        label: '⚡ Motor Vial PESV (Res. 40595) + Compatibilidad Química SGA (Dec. 1496)',
        description: 'Activa reglas especializadas para seguridad vial y riesgo químico',
        fields: [
          'Metodología PESV Res. 20223040040595: Probabilidad x Severidad por Actor Vial',
          'Matriz de Compatibilidad Química SGA Dec. 1496 (Clases ONU 1 a 9 y Ácido vs. Base)',
          'Validación de Vigencia de FDS (< 5 Años) y Etiquetado de Trasvase',
        ],
      },
    ],
    reportTags: ['sgsst-matriz-ipevar', 'sgsst-matriz-pesv', 'sgsst-matriz-compatibilidad'],
  },
  skill_google_connectors: {
    moduleTitle: '🧩 Skill · Conectores Google Workspace, NotebookLM & Antigravity',
    moduleBadge: 'Skill · Google & AGY',
    fieldsLabel: 'Protocolos de Orquestación entre Google Workspace, NotebookLM y Antigravity',
    fields: [
      'Exploración Recursiva de Carpetas de Trabajadores en Google Drive',
      'Lectura de Certificados PDF/Excel por Número de Cédula',
      'Sincronización Bidireccional con Hojas de Google Sheets',
      'Consulta RAG con Citas Verificadas en Cuadernos de Google NotebookLM',
      'Delegación al Puente Reactivo Push SSE de Google Antigravity (Mac/PC o Cloud)',
      'Generación de Informes en Google Docs y Eventos en Google Calendar',
      'Control Anti-Duplicados al Importar desde Drive o Gmail',
      'Manejo Transparente de Permisos y Cuentas Vinculadas',
    ],
    quickCombos: [
      {
        label: '⚡ Auditar Carpetas de Drive por Cédula + Actualizar Google Sheets',
        description: 'Orquesta lectura de soportes en Drive y registro en hojas de cálculo',
        fields: [
          'Exploración Recursiva de Carpetas de Trabajadores en Google Drive',
          'Lectura de Certificados PDF/Excel por Número de Cédula',
          'Sincronización Bidireccional con Hojas de Google Sheets',
          'Control Anti-Duplicados al Importar desde Drive o Gmail',
        ],
      },
      {
        label: '⚡ Consultar NotebookLM + Puente Antigravity + Exportar a Google Docs',
        description: 'Combina investigación RAG con ejecución MCP y documento formal',
        fields: [
          'Consulta RAG con Citas Verificadas en Cuadernos de Google NotebookLM',
          'Delegación al Puente Reactivo Push SSE de Google Antigravity (Mac/PC o Cloud)',
          'Generación de Informes en Google Docs y Eventos en Google Calendar',
        ],
      },
    ],
    reportTags: [],
  },
  skill_web_scraper_script: {
    moduleTitle: '🧩 Skill · Web Scraping & Extracción Estructurada (Antigravity)',
    moduleBadge: 'Skill · Script & Tablas',
    fieldsLabel: 'Directivas de Construcción y Limpieza de Scripts de Web Scraping',
    fields: [
      'Ejecución en Instancia de Google Antigravity (Python BS4/Playwright o Node Cheerio)',
      'Extracción Limpia de Tablas HTML hacia Formato Markdown y JSON',
      'Captura de Enlaces a Resoluciones, Decretos y Documentos PDF Oficiales',
      'Limpieza de DOM (Eliminar Menús, Scripts, Banners y Ruido Visual)',
      'Manejo de Paginación y Espera de Renderizado Dinámico (Playwright / Chrome MCP)',
      'Validación de Estructura de Columnas Antes de Entregar al Agente',
      'Respeto de Tiempos de Respuesta y Reporte Transparente de Errores HTTP',
      'Cruce de Datos Extraídos con la Matriz Legal o Expedientes SST',
    ],
    quickCombos: [
      {
        label: '⚡ Extraer Tablas HTML a Markdown/JSON + Enlaces PDF Oficiales',
        description: 'Convierte cualquier página web normativa o técnica en tablas estructuradas',
        fields: [
          'Ejecución en Instancia de Google Antigravity (Python BS4/Playwright o Node Cheerio)',
          'Extracción Limpia de Tablas HTML hacia Formato Markdown y JSON',
          'Captura de Enlaces a Resoluciones, Decretos y Documentos PDF Oficiales',
          'Limpieza de DOM (Eliminar Menús, Scripts, Banners y Ruido Visual)',
        ],
      },
      {
        label: '⚡ Renderizado Dinámico Playwright/Chrome MCP + Cruce con Somos SST',
        description: 'Ideal para portales interactivos que requieren navegador real',
        fields: [
          'Manejo de Paginación y Espera de Renderizado Dinámico (Playwright / Chrome MCP)',
          'Validación de Estructura de Columnas Antes de Entregar al Agente',
          'Cruce de Datos Extraídos con la Matriz Legal o Expedientes SST',
        ],
      },
    ],
    reportTags: [],
  },
  skill_auditoria_normativa: {
    moduleTitle: '🧩 Skill · Auditoría Jurídica SST Colombia (Dec. 1072 / Res. 0312)',
    moduleBadge: 'Skill · Ley Colombiana',
    fieldsLabel: 'Criterios de Auditoría Jurídica y Verificación de Soportes Legales',
    fields: [
      'Verificación de los Estándares Mínimos Res. 0312 según Tamaño y Riesgo ARL',
      'Auditoría de los 22 Numerales de Alcance Legal (Art. 2.2.4.6.30 Dec. 1072)',
      'Revisión de los 24 Aspectos de Revisión por la Alta Dirección (Art. 2.2.4.6.31)',
      'Auditoría de Investigación de Accidentes dentro de los 15 Días (Res. 1401 de 2007)',
      'Verificación de Licencia SST Vigente, Curso 50h/20h y Actas COPASST/CCL',
      'Evaluación de Riesgo de Multas MinTrabajo (Ley 1562 de 2012 y Dec. 1072)',
      'Análisis de Culpa Patronal (Art. 216 CST) y Carga Probatoria Documental',
      'Redacción de No Conformidades con Evidencia Objetiva y Numeral Exacto',
    ],
    quickCombos: [
      {
        label: '⚡ Auditar Estándares Res. 0312 + No Conformidades + Riesgo de Multa',
        description: 'Revisión legal rigurosa con cita de artículos e impacto sancionatorio',
        fields: [
          'Verificación de los Estándares Mínimos Res. 0312 según Tamaño y Riesgo ARL',
          'Verificación de Licencia SST Vigente, Curso 50h/20h y Actas COPASST/CCL',
          'Evaluación de Riesgo de Multas MinTrabajo (Ley 1562 de 2012 y Dec. 1072)',
          'Redacción de No Conformidades con Evidencia Objetiva y Numeral Exacto',
        ],
      },
      {
        label: '⚡ Alcance Legal Dec. 1072 (Art. 30 y 31) + Res. 1401 ATEL + Culpa Patronal',
        description: 'Blindaje probatorio para auditorías anuales e investigaciones de accidentes',
        fields: [
          'Auditoría de los 22 Numerales de Alcance Legal (Art. 2.2.4.6.30 Dec. 1072)',
          'Auditoría de Investigación de Accidentes dentro de los 15 Días (Res. 1401 de 2007)',
          'Análisis de Culpa Patronal (Art. 216 CST) y Carga Probatoria Documental',
        ],
      },
    ],
    reportTags: ['sgsst-diagnostico', 'sgsst-auditoria', 'sgsst-matriz-legal'],
  },
  subagent_researcher: {
    moduleTitle: '🤖 Sub-Agente · Investigador Web & Documental SST',
    moduleBadge: 'Sub-Agente · Investigador',
    fieldsLabel: 'Entregables y Fuentes del Sub-Agente Investigador',
    fields: [
      'Exploración Profunda de Fuentes Documentales y Portales Oficiales',
      'Verificación de Vigencia de Leyes, Decretos y Resoluciones en Colombia',
      'Extracción de Datos Científicos (PubChem NIH, MedlinePlus CIE-10, INS, OIT)',
      'Síntesis de Dossier Técnico con Citas y Enlaces Verificados',
      'Tabla Resumen de Hallazgos Documentales por Cédula o Proceso',
      'Detección de Documentos Faltantes o Vencidos en el Expediente',
      'Entrega de Contexto Depurado al Agente Principal sin Ruido',
      'Validación Cruzada entre Fuentes Externas y Base de Datos Somos SST',
    ],
    quickCombos: [
      {
        label: '⚡ Dossier Normativo Verificado + Tabla de Hallazgos + Citas Oficiales',
        description: 'Investiga y entrega un resumen verificado listo para el Agente Principal',
        fields: [
          'Exploración Profunda de Fuentes Documentales y Portales Oficiales',
          'Verificación de Vigencia de Leyes, Decretos y Resoluciones en Colombia',
          'Síntesis de Dossier Técnico con Citas y Enlaces Verificados',
          'Tabla Resumen de Hallazgos Documentales por Cédula o Proceso',
        ],
      },
      {
        label: '⚡ Investigación Científica (NIH/CIE-10/Químicos) + Cruce con Somos SST',
        description: 'Ideal para enriquecer matrices químicas, médicas o ergonómicas',
        fields: [
          'Extracción de Datos Científicos (PubChem NIH, MedlinePlus CIE-10, INS, OIT)',
          'Detección de Documentos Faltantes o Vencidos en el Expediente',
          'Validación Cruzada entre Fuentes Externas y Base de Datos Somos SST',
        ],
      },
    ],
    reportTags: [],
  },
  subagent_scraper_agy: {
    moduleTitle: '🤖 Sub-Agente · Ingeniero de Web Scraping (Google Antigravity)',
    moduleBadge: 'Sub-Agente · Scraper AGY',
    fieldsLabel: 'Tareas de Extracción y Scripts del Sub-Agente Ingeniero de Scraping',
    fields: [
      'Ejecución de Script Python (BeautifulSoup / Playwright) o Node.js (Cheerio)',
      'Navegación e Inspección DOM en Vivo con Chrome DevTools MCP',
      'Extracción de Tablas Completas y Conversión a Markdown / JSON',
      'Descarga y Listado de Documentos PDF, Circulares y Anexos',
      'Consulta Automatizada de Registros por Cédula, NIT o Placa',
      'Limpieza de HTML y Normalización de Fechas y Campos',
      'Captura de Evidencia Visual de la Página Consultada',
      'Entrega de Payload Estructurado al Agente Principal',
    ],
    quickCombos: [
      {
        label: '⚡ Script Python/Playwright + Tablas a Markdown/JSON + Enlaces PDF',
        description: 'Delega la extracción técnica web en tu instancia de Antigravity',
        fields: [
          'Ejecución de Script Python (BeautifulSoup / Playwright) o Node.js (Cheerio)',
          'Extracción de Tablas Completas y Conversión a Markdown / JSON',
          'Descarga y Listado de Documentos PDF, Circulares y Anexos',
          'Entrega de Payload Estructurado al Agente Principal',
        ],
      },
      {
        label: '⚡ Consulta por Cédula/NIT/Placa + Chrome MCP + Captura de Evidencia',
        description: 'Inspección automatizada de portales con navegador real',
        fields: [
          'Navegación e Inspección DOM en Vivo con Chrome DevTools MCP',
          'Consulta Automatizada de Registros por Cédula, NIT o Placa',
          'Captura de Evidencia Visual de la Página Consultada',
        ],
      },
    ],
    reportTags: [],
  },
  subagent_auditor_calidad: {
    moduleTitle: '🤖 Sub-Agente · Auditor de Calidad y Cumplimiento Res. 0312',
    moduleBadge: 'Sub-Agente · Auditor SST',
    fieldsLabel: 'Controles de Calidad y Validaciones Previas a la Salida Final',
    fields: [
      'Verificación de Exactitud de Cédulas, Nombres y Fechas antes de Guardar',
      'Revisión de Fórmulas Matemáticas (GTC-45, Indicadores Art. 30 Res. 0312, PESV)',
      'Auditoría de Citas Legales (Confirmar que el Artículo Exista y Esté Vigente)',
      'Bloqueo de Datos Simulados, Inventados o Incompletos',
      'Verificación de Coherencia entre Hallazgo Detectado y Acción ACPM Propuesta',
      'Validación de Formato de Tablas Markdown y Tarjeta wappy-card',
      'Revisión de Protección de Datos Sensibles (Reserva Médica Res. 2346)',
      'Sello de Aprobación de Calidad antes de Enviar Correo o Actualizar BD',
    ],
    quickCombos: [
      {
        label: '⚡ Validar Cédulas/Fechas + Cero Datos Inventados + Aprobar Salida',
        description: 'Doble filtro de calidad antes de actualizar Somos SST o enviar email',
        fields: [
          'Verificación de Exactitud de Cédulas, Nombres y Fechas antes de Guardar',
          'Bloqueo de Datos Simulados, Inventados o Incompletos',
          'Validación de Formato de Tablas Markdown y Tarjeta wappy-card',
          'Sello de Aprobación de Calidad antes de Enviar Correo o Actualizar BD',
        ],
      },
      {
        label: '⚡ Auditar Cálculos (GTC-45 / 0312) + Citas Legales + Coherencia ACPM',
        description: 'Revisión técnica de ingeniería y derecho laboral sobre el informe',
        fields: [
          'Revisión de Fórmulas Matemáticas (GTC-45, Indicadores Art. 30 Res. 0312, PESV)',
          'Auditoría de Citas Legales (Confirmar que el Artículo Exista y Esté Vigente)',
          'Verificación de Coherencia entre Hallazgo Detectado y Acción ACPM Propuesta',
        ],
      },
    ],
    reportTags: ['sgsst-auditoria', 'sgsst-diagnostico'],
  },
  rule_veracidad_estricta: {
    moduleTitle: '📏 Regla Obligatoria · Veracidad Estricta (Prohibido Inventar Datos)',
    moduleBadge: 'Regla · Integridad de Datos',
    fieldsLabel: 'Restricciones Inquebrantables de Veracidad e Integridad de Datos',
    fields: [
      'Prohibido Inventar o Simular Trabajadores, Cédulas, Nombres o Cargos',
      'Prohibido Asumir Certificados, Exámenes EMO o Afiliaciones No Encontradas',
      'Si una Carpeta de Drive o Correo está Vacío, Reportarlo con Transparencia',
      'Cruzar Registros Únicamente contra la Base de Datos Real de la Empresa Activa',
      'Incluir el Origen Exacto de Cada Dato (Archivo, Correo o Aplicativo SST)',
      'Separar Claramente Datos Reales Verificados de Recomendaciones Preventivas',
      'Bloquear Escritura en Base de Datos si el Dato de Origen es Ambiguo',
      'Trazabilidad Auditable al 100% en la Bitácora Final',
    ],
    quickCombos: [
      {
        label: '⚡ Cero Invención de Cédulas/Soportes + Transparencia si Falta Información',
        description: 'Blindaje absoluto contra alucinaciones en auditorías SST',
        fields: [
          'Prohibido Inventar o Simular Trabajadores, Cédulas, Nombres o Cargos',
          'Prohibido Asumir Certificados, Exámenes EMO o Afiliaciones No Encontradas',
          'Si una Carpeta de Drive o Correo está Vacío, Reportarlo con Transparencia',
          'Cruzar Registros Únicamente contra la Base de Datos Real de la Empresa Activa',
        ],
      },
      {
        label: '⚡ Citar Origen de Cada Dato + Bloquear Escritura Ambigua',
        description: 'Garantiza que solo datos verificables alimenten Somos SST',
        fields: [
          'Incluir el Origen Exacto de Cada Dato (Archivo, Correo o Aplicativo SST)',
          'Bloquear Escritura en Base de Datos si el Dato de Origen es Ambiguo',
          'Trazabilidad Auditable al 100% en la Bitácora Final',
        ],
      },
    ],
    reportTags: [],
  },
  rule_solo_criticos: {
    moduleTitle: '📏 Regla Obligatoria · Filtrar Solo Hallazgos Críticos o Próximos a Vencer',
    moduleBadge: 'Regla · Filtro de Prioridad',
    fieldsLabel: 'Criterios de Filtrado Quirúrgico de Prioridad y Vencimientos',
    fields: [
      'Incluir Únicamente Peligros Nivel I (Crítico) y Nivel II (Alto) en GTC-45 / PESV',
      'Incluir Únicamente Estándares en Brecha (No Cumple) en Resolución 0312',
      'Incluir Únicamente Exámenes EMO, Cursos de Alturas y EPP Vencidos o a ≤ 30 Días',
      'Incluir Únicamente Vehículos con SOAT, RTM o Preoperacional Vencido / Con Fallas',
      'Incluir Únicamente Extintores Vencidos y Químicos con Choque SGA Incompatible',
      'Omitir del Reporte los Registros que Están 100% Al Día y Cumplidos',
      'Priorizar Trabajadores con Alertas Letales o Restricciones Médicas Activas',
      'Resumir en 1 Sola Línea el Total de Registros Conformes Omitidos',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Vencidos o a ≤ 30 Días (EMO, Alturas, SOAT, Extintores) + Omitir Al Día',
        description: 'Evita reportes extensos mostrando únicamente lo que requiere acción urgente',
        fields: [
          'Incluir Únicamente Exámenes EMO, Cursos de Alturas y EPP Vencidos o a ≤ 30 Días',
          'Incluir Únicamente Vehículos con SOAT, RTM o Preoperacional Vencido / Con Fallas',
          'Incluir Únicamente Extintores Vencidos y Químicos con Choque SGA Incompatible',
          'Omitir del Reporte los Registros que Están 100% Al Día y Cumplidos',
        ],
      },
      {
        label: '⚡ Solo Riesgos Nivel I/II (GTC-45) + Estándares No Cumple (0312) + Alertas Letales',
        description: 'Enfoca el flujo exclusivamente en brechas normativas y peligros críticos',
        fields: [
          'Incluir Únicamente Peligros Nivel I (Crítico) y Nivel II (Alto) en GTC-45 / PESV',
          'Incluir Únicamente Estándares en Brecha (No Cumple) en Resolución 0312',
          'Priorizar Trabajadores con Alertas Letales o Restricciones Médicas Activas',
        ],
      },
    ],
    reportTags: [],
  },
  rule_reserva_legal: {
    moduleTitle: '📏 Regla Obligatoria · Reserva de Historia Clínica y Habeas Data (Res. 2346 / Ley 1581)',
    moduleBadge: 'Regla · Reserva Médica',
    fieldsLabel: 'Controles de Confidencialidad Médica y Protección de Datos Personales',
    fields: [
      'Cumplimiento Estricto de la Resolución 2346 de 2007 (Custodia de Historia Clínica Ocupacional)',
      'Cumplimiento de la Ley 1581 de 2012 (Protección de Datos Personales Sensibles)',
      'Reportar a Jefes o Comités Únicamente el Concepto de Aptitud, Restricciones y Recomendaciones',
      'No Divulgar Historias Clínicas Completas ni Resultados Crudos de Laboratorio en Correos Masivos',
      'Anonimizar Resultados Individuales de Batería Psicosocial (Res. 2764 de 2022)',
      'Reserva Estricta de Quejas de Acoso Laboral en Comité de Convivencia (Ley 1010 de 2006)',
      'Incluir Leyenda Legal de Confidencialidad en el Pie del Documento o Correo',
      'Autorizar Acceso Clínico Detallado Solo al Médico Laboral y Responsable SST con Licencia',
    ],
    quickCombos: [
      {
        label: '⚡ Mostrar Solo Concepto de Aptitud y Restricciones (Proteger Historia Clínica Res. 2346)',
        description: 'Permite gestionar reubicaciones y EMO sin violar la reserva médica legal',
        fields: [
          'Cumplimiento Estricto de la Resolución 2346 de 2007 (Custodia de Historia Clínica Ocupacional)',
          'Reportar a Jefes o Comités Únicamente el Concepto de Aptitud, Restricciones y Recomendaciones',
          'No Divulgar Historias Clínicas Completas ni Resultados Crudos de Laboratorio en Correos Masivos',
          'Incluir Leyenda Legal de Confidencialidad en el Pie del Documento o Correo',
        ],
      },
      {
        label: '⚡ Reserva en Riesgo Psicosocial (Res. 2764) y Casos Ley 1010 (Convivencia)',
        description: 'Garantiza manejo estadístico y confidencial en flujos psicosociales y CCL',
        fields: [
          'Cumplimiento de la Ley 1581 de 2012 (Protección de Datos Personales Sensibles)',
          'Anonimizar Resultados Individuales de Batería Psicosocial (Res. 2764 de 2022)',
          'Reserva Estricta de Quejas de Acoso Laboral en Comité de Convivencia (Ley 1010 de 2006)',
        ],
      },
    ],
    reportTags: [],
  },
  // ═══ 6 NODOS ESPECIALIZADOS DE CONSULTA OFICIAL POR CÉDULA Y PLACA VÍA GOOGLE ANTIGRAVITY (SIN RUAF) ═══
  scraper_agy_alto_riesgo: {
    moduleTitle: '🪖 Scraper Antigravity · Certificados de Alto Riesgo (MinTrabajo Alturas/Confinados) y SENA por Cédula',
    moduleBadge: 'AGY · Alto Riesgo & SENA',
    fieldsLabel: 'Portales y Certificados Oficiales a Extraer por Cédula vía Google Antigravity',
    fields: [
      'MinTrabajo — Centros de Entrenamiento (Trabajo en Alturas Res. 4272/2021 y Espacios Confinados Res. 0491/2020): https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx',
      'MinTrabajo — Descarga de Constancia Oficial en PDF (Último Reentrenamiento Vigente y Coordinador)',
      'MinTrabajo — Nivel del Curso (Trabajador Autorizado, Reentrenamiento Sectorial, Coordinador, Administrativo)',
      'MinTrabajo — Nombre del Centro de Entrenamiento, NIT, Entrenador y Fechas de Inicio/Finalización',
      'SENA — Sofia Plus / Certificados Digitales por Cédula: https://certificados.sena.edu.co/CertificadoDigital/com.sena.consultacer',
      'SENA — Títulos Técnicos/Tecnólogos, Curso de 50 Horas / 20 Horas SG-SST y Competencias Laborales',
      'Alerta Automática si el Reentrenamiento de Alturas supera los 12 meses o no registra curso',
    ],
    quickCombos: [
      {
        label: '⚡ MinTrabajo Alturas/Confinados (Tabla Completa + Descarga PDF Vigente) + SENA',
        description: 'Consulta ambos portales oficiales por Cédula y descarga las constancias en PDF',
        fields: [
          'MinTrabajo — Centros de Entrenamiento (Trabajo en Alturas Res. 4272/2021 y Espacios Confinados Res. 0491/2020): https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx',
          'MinTrabajo — Descarga de Constancia Oficial en PDF (Último Reentrenamiento Vigente y Coordinador)',
          'MinTrabajo — Nivel del Curso (Trabajador Autorizado, Reentrenamiento Sectorial, Coordinador, Administrativo)',
          'SENA — Sofia Plus / Certificados Digitales por Cédula: https://certificados.sena.edu.co/CertificadoDigital/com.sena.consultacer',
          'Alerta Automática si el Reentrenamiento de Alturas supera los 12 meses o no registra curso',
        ],
      },
      {
        label: '⚡ Solo MinTrabajo Centros de Entrenamiento (Alturas Res. 4272 y Confinados Res. 0491)',
        description: 'Consulta directa sin CAPTCHA en app2.mintrabajo.gov.co',
        fields: [
          'MinTrabajo — Centros de Entrenamiento (Trabajo en Alturas Res. 4272/2021 y Espacios Confinados Res. 0491/2020): https://app2.mintrabajo.gov.co/CentrosEntrenamiento/consulta_ext.aspx',
          'MinTrabajo — Descarga de Constancia Oficial en PDF (Último Reentrenamiento Vigente y Coordinador)',
          'MinTrabajo — Nombre del Centro de Entrenamiento, NIT, Entrenador y Fechas de Inicio/Finalización',
        ],
      },
    ],
    reportTags: ['sgsst-tareas-alto-riesgo', 'sgsst-equipo-alturas'],
  },
  scraper_agy_arl_directo: {
    moduleTitle: '🛡️ Scraper Antigravity · Certificados de ARL Directos por Cédula (Sin RUAF)',
    moduleBadge: 'AGY · 5 ARL Directas',
    fieldsLabel: 'Portales Directos de ARL a Consultar por Cédula vía Google Antigravity',
    fields: [
      'ARL SURA (Verificación de Afiliación y Certificado): https://www.arlsura.com/afiliacion/verificar.php',
      'ARL Positiva (Certificado de Afiliación en Línea): https://www.positivaenlinea.gov.co/nuevo/',
      'ARL Colmena Seguros (Consulta de Afiliación ARL): https://afiliacionarl.colmenaseguros.com/',
      'ARL AXA Colpatria (Certificados ESST): https://asesoriavirtual.axacolpatria.co/prod_esst/certificados/',
      'ARL Seguros Bolívar (Certificado de Afiliación ARL): https://www.segurosbolivar.com/arl',
      'Identificación de Estado Activo/Inactivo, Clase de Riesgo (I a V) y Razón Social del Empleador',
      'Descarga del Certificado Oficial de Afiliación ARL en PDF',
    ],
    quickCombos: [
      {
        label: '⚡ Barrido Completo en las 5 ARL Directas (SURA, Positiva, Colmena, AXA y Bolívar)',
        description: 'Verifica en cuál ARL está activo el trabajador o contratista y descarga el PDF',
        fields: [
          'ARL SURA (Verificación de Afiliación y Certificado): https://www.arlsura.com/afiliacion/verificar.php',
          'ARL Positiva (Certificado de Afiliación en Línea): https://www.positivaenlinea.gov.co/nuevo/',
          'ARL Colmena Seguros (Consulta de Afiliación ARL): https://afiliacionarl.colmenaseguros.com/',
          'ARL AXA Colpatria (Certificados ESST): https://asesoriavirtual.axacolpatria.co/prod_esst/certificados/',
          'ARL Seguros Bolívar (Certificado de Afiliación ARL): https://www.segurosbolivar.com/arl',
          'Identificación de Estado Activo/Inactivo, Clase de Riesgo (I a V) y Razón Social del Empleador',
          'Descarga del Certificado Oficial de Afiliación ARL en PDF',
        ],
      },
      {
        label: '⚡ Solo ARL SURA + ARL Positiva + ARL Colmena',
        description: 'Consulta rápida en las 3 ARL de mayor volumen de afiliados',
        fields: [
          'ARL SURA (Verificación de Afiliación y Certificado): https://www.arlsura.com/afiliacion/verificar.php',
          'ARL Positiva (Certificado de Afiliación en Línea): https://www.positivaenlinea.gov.co/nuevo/',
          'ARL Colmena Seguros (Consulta de Afiliación ARL): https://afiliacionarl.colmenaseguros.com/',
          'Descarga del Certificado Oficial de Afiliación ARL en PDF',
        ],
      },
    ],
    reportTags: ['sgsst-seguridad-social'],
  },
  scraper_agy_pensiones_directo: {
    moduleTitle: '🏦 Scraper Antigravity · Fondos de Pensiones Directos por Cédula — Sin RUAF',
    moduleBadge: 'AGY · 5 Fondos Pensión',
    fieldsLabel: 'Páginas Oficiales Directas de Fondos de Pensiones (Sin RUAF) a Consultar por Cédula',
    fields: [
      'Porvenir (Certificado de Afiliación Directo): https://www.porvenir.com.co/web/certificados-y-extractos/certificado-de-afiliacion',
      'Protección — Certifácil (Pensión y Cesantías por Cédula): https://www.proteccion.com/portalafiliados/certifacil',
      'Colfondos (Certificado de Afiliación Pensión Obligatoria): https://www.colfondos.com.co/dxp/personas/pensiones-obligatorias/certificado-afiliacion',
      'Skandia (Consulta de Certificados de Afiliación): https://www.skandia.co/consulta-extractos-y-certificados',
      'Colpensiones (Certificado de Afiliación / No Pensión RPM): https://sede.colpensiones.gov.co/tramite/updInfo/72/',
      'Detección Exacta del Fondo Activo (RAIS vs. Colpensiones RPM) y Fecha de Afiliación',
      'Descarga del Certificado Oficial de Pensión en PDF',
    ],
    quickCombos: [
      {
        label: '⚡ Barrido en los 5 Fondos Directos Sin RUAF (Porvenir, Protección, Colfondos, Skandia y Colpensiones)',
        description: 'Recorre los 5 portales oficiales hasta hallar el fondo activo y descargar su PDF',
        fields: [
          'Porvenir (Certificado de Afiliación Directo): https://www.porvenir.com.co/web/certificados-y-extractos/certificado-de-afiliacion',
          'Protección — Certifácil (Pensión y Cesantías por Cédula): https://www.proteccion.com/portalafiliados/certifacil',
          'Colfondos (Certificado de Afiliación Pensión Obligatoria): https://www.colfondos.com.co/dxp/personas/pensiones-obligatorias/certificado-afiliacion',
          'Skandia (Consulta de Certificados de Afiliación): https://www.skandia.co/consulta-extractos-y-certificados',
          'Colpensiones (Certificado de Afiliación / No Pensión RPM): https://sede.colpensiones.gov.co/tramite/updInfo/72/',
          'Detección Exacta del Fondo Activo (RAIS vs. Colpensiones RPM) y Fecha de Afiliación',
          'Descarga del Certificado Oficial de Pensión en PDF',
        ],
      },
      {
        label: '⚡ Solo Fondos Privados RAIS (Porvenir + Protección + Colfondos + Skandia)',
        description: 'Verifica afiliación en los 4 fondos privados de pensiones y cesantías',
        fields: [
          'Porvenir (Certificado de Afiliación Directo): https://www.porvenir.com.co/web/certificados-y-extractos/certificado-de-afiliacion',
          'Protección — Certifácil (Pensión y Cesantías por Cédula): https://www.proteccion.com/portalafiliados/certifacil',
          'Colfondos (Certificado de Afiliación Pensión Obligatoria): https://www.colfondos.com.co/dxp/personas/pensiones-obligatorias/certificado-afiliacion',
          'Skandia (Consulta de Certificados de Afiliación): https://www.skandia.co/consulta-extractos-y-certificados',
        ],
      },
    ],
    reportTags: ['sgsst-seguridad-social'],
  },
  scraper_agy_salud_rethus: {
    moduleTitle: '🏥 Scraper Antigravity · Salud EPS (ADRES) y Talento Humano en Salud (ReTHUS SISPRO)',
    moduleBadge: 'AGY · ADRES & ReTHUS',
    fieldsLabel: 'Portales de Salud y Registro Profesional a Consultar por Cédula vía Google Antigravity',
    fields: [
      'ADRES — BDUA (Consulta de EPS Activa por Cédula): https://www.adres.gov.co/consulte-su-eps',
      'ADRES — Entidad EPS, Régimen (Contributivo / Subsidiado), Estado de Afiliación y Tipo de Afiliado',
      'ReTHUS — SISPRO MinSalud (Talento Humano en Salud): https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx',
      'ReTHUS — Profesión/Ocupación Autorizada (Médico, Enfermero, Psicólogo, Fisioterapeuta, Profesional SST en Salud)',
      'ReTHUS — Acto Administrativo / Autorización de Ejercicio, Entidad Reportadora y Estado Vigente',
    ],
    quickCombos: [
      {
        label: '⚡ Consulta Completa: EPS en ADRES (BDUA) + Registro Profesional en ReTHUS (SISPRO)',
        description: 'Verifica afiliación a salud e idoneidad profesional en salud/SST',
        fields: [
          'ADRES — BDUA (Consulta de EPS Activa por Cédula): https://www.adres.gov.co/consulte-su-eps',
          'ADRES — Entidad EPS, Régimen (Contributivo / Subsidiado), Estado de Afiliación y Tipo de Afiliado',
          'ReTHUS — SISPRO MinSalud (Talento Humano en Salud): https://web.sispro.gov.co/THS/Cliente/ConsultasPublicas/ConsultaPublicaDeTHxIdentificacion.aspx',
          'ReTHUS — Profesión/Ocupación Autorizada (Médico, Enfermero, Psicólogo, Fisioterapeuta, Profesional SST en Salud)',
          'ReTHUS — Acto Administrativo / Autorización de Ejercicio, Entidad Reportadora y Estado Vigente',
        ],
      },
    ],
    reportTags: ['sgsst-seguridad-social', 'sgsst-condiciones-salud'],
  },
  scraper_agy_vial_pesv: {
    moduleTitle: '🚗 Scraper Antigravity · Seguridad Vial PESV: SIMIT y RUNT por Cédula o Placa',
    moduleBadge: 'AGY · SIMIT & RUNT',
    fieldsLabel: 'Consultas Viales PESV por Cédula (Conductor) y por Placa (Vehículo) vía Google Antigravity',
    fields: [
      'SIMIT por Cédula o Placa (Comparendos, Multas y Acuerdos de Pago): https://www.fcm.org.co/simit/#/home-public',
      'RUNT por Cédula (Conductor — Vigencia y Categoría de Licencia A2, B1, C1, C2, C3): https://www.runt.gov.co/consultaCiudadana/#/consultaPersona',
      'RUNT por Placa (Vehículo — Vigencia de SOAT y Revisión Técnico-Mecánica RTM): https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo',
      'Alerta de Licencia de Conducción Vencida o Suspendida y Comparendos Pendientes de Pago',
      'Alerta de Vehículo con SOAT o Revisión Técnico-Mecánica Vencida o Próxima a Vencer (≤ 30 días)',
    ],
    quickCombos: [
      {
        label: '⚡ Auditoría PESV Completa: SIMIT (Cédula/Placa) + RUNT Conductor (Cédula) + RUNT Vehículo (Placa)',
        description: 'Cruza conductor y vehículo para el Plan Estratégico de Seguridad Vial Res. 20223040040595',
        fields: [
          'SIMIT por Cédula o Placa (Comparendos, Multas y Acuerdos de Pago): https://www.fcm.org.co/simit/#/home-public',
          'RUNT por Cédula (Conductor — Vigencia y Categoría de Licencia A2, B1, C1, C2, C3): https://www.runt.gov.co/consultaCiudadana/#/consultaPersona',
          'RUNT por Placa (Vehículo — Vigencia de SOAT y Revisión Técnico-Mecánica RTM): https://www.runt.gov.co/consultaCiudadana/#/consultaVehiculo',
          'Alerta de Licencia de Conducción Vencida o Suspendida y Comparendos Pendientes de Pago',
          'Alerta de Vehículo con SOAT o Revisión Técnico-Mecánica Vencida o Próxima a Vencer (≤ 30 días)',
        ],
      },
      {
        label: '⚡ Solo Conductor por Cédula (RUNT Licencia de Conducción + SIMIT Comparendos)',
        description: 'Verificación de conductores antes de ingreso o asignación de vehículo',
        fields: [
          'SIMIT por Cédula o Placa (Comparendos, Multas y Acuerdos de Pago): https://www.fcm.org.co/simit/#/home-public',
          'RUNT por Cédula (Conductor — Vigencia y Categoría de Licencia A2, B1, C1, C2, C3): https://www.runt.gov.co/consultaCiudadana/#/consultaPersona',
          'Alerta de Licencia de Conducción Vencida o Suspendida y Comparendos Pendientes de Pago',
        ],
      },
    ],
    reportTags: ['sgsst-matriz-pesv'],
  },
  scraper_agy_antecedentes: {
    moduleTitle: '⚖️ Scraper Antigravity · Antecedentes y Procesos Judiciales por Cédula (6 Entes Oficiales)',
    moduleBadge: 'AGY · 6 Antecedentes',
    fieldsLabel: 'Portales Judiciales, Disciplinarios, Fiscales y Policiales a Consultar por Cédula',
    fields: [
      'Rama Judicial — Consulta Nacional Unificada de Procesos Judiciales: https://consultaprocesos.ramajudicial.gov.co/Procesos/Index',
      'Contraloría General de la República — Certificado de Antecedentes Fiscales (SIBOR): https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx',
      'Procuraduría General de la Nación — Certificado de Antecedentes Disciplinarios (SIRI): https://apps.procuraduria.gov.co/webcert/Certificado.aspx',
      'Policía Nacional — Antecedentes Judiciales: https://antecedentes.policia.gov.co:7005/WebJudicial/',
      'Policía Nacional — RNMC (Registro Nacional de Medidas Correctivas Código de Policía): https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx',
      'Policía Nacional — Consulta de Inhabilidades por Delitos Sexuales (Ley 1918 de 2018): https://inhabilidades.policia.gov.co:8080/',
      'Consolidado de Hallazgos (Sin Antecedentes vs. Alertas Activas) y Descarga de Certificados PDF',
    ],
    quickCombos: [
      {
        label: '⚡ Barrido Completo en los 6 Entes Oficiales (Rama Judicial, Contraloría, Procuraduría y 3 Policía)',
        description: 'Debida diligencia integral de ingreso y contratación por Cédula vía Antigravity',
        fields: [
          'Rama Judicial — Consulta Nacional Unificada de Procesos Judiciales: https://consultaprocesos.ramajudicial.gov.co/Procesos/Index',
          'Contraloría General de la República — Certificado de Antecedentes Fiscales (SIBOR): https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx',
          'Procuraduría General de la Nación — Certificado de Antecedentes Disciplinarios (SIRI): https://apps.procuraduria.gov.co/webcert/Certificado.aspx',
          'Policía Nacional — Antecedentes Judiciales: https://antecedentes.policia.gov.co:7005/WebJudicial/',
          'Policía Nacional — RNMC (Registro Nacional de Medidas Correctivas Código de Policía): https://srvcnpc.policia.gov.co/PSC/frm_cnp_consulta.aspx',
          'Policía Nacional — Consulta de Inhabilidades por Delitos Sexuales (Ley 1918 de 2018): https://inhabilidades.policia.gov.co:8080/',
          'Consolidado de Hallazgos (Sin Antecedentes vs. Alertas Activas) y Descarga de Certificados PDF',
        ],
      },
      {
        label: '⚡ Certificados Básicos de Contratación (Policía Antecedentes + Procuraduría SIRI + Contraloría SIBOR)',
        description: 'Los 3 certificados de antecedentes estándar exigidos en contratación',
        fields: [
          'Contraloría General de la República — Certificado de Antecedentes Fiscales (SIBOR): https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx',
          'Procuraduría General de la Nación — Certificado de Antecedentes Disciplinarios (SIRI): https://apps.procuraduria.gov.co/webcert/Certificado.aspx',
          'Policía Nacional — Antecedentes Judiciales: https://antecedentes.policia.gov.co:7005/WebJudicial/',
        ],
      },
    ],
    reportTags: [],
  },
};

/**
 * Resuelve los metadatos completos (campos reales, combos quirúrgicos 1 clic e historial de informes)
 * para cualquier nodo del lienzo (aplicativos de los 8 Hitos, extractores, conectores, memorias o salidas).
 */
export function getNodeModuleMetadata(nodeId: string, shape?: string): NodeModuleMetadata {
  const raw = (nodeId || '').trim();

  // 0. Coincidencia directa inmediata en MODULE_METADATA_MAP (sin recortar prefijos válidos como trigger_tenshi)
  if (MODULE_METADATA_MAP[raw]) {
    return MODULE_METADATA_MAP[raw];
  }

  const cleanId = raw.replace(
    /^(trigger_|extractor_|ext_|hito_|out_|tool_inputs_|tool_hitos_|sub_memory_|custom_)/,
    '',
  );

  // 1. Coincidencia por cleanId o con prefijo trigger_ restaurado
  if (MODULE_METADATA_MAP[cleanId]) {
    return MODULE_METADATA_MAP[cleanId];
  }
  if (MODULE_METADATA_MAP[`trigger_${cleanId}`]) {
    return MODULE_METADATA_MAP[`trigger_${cleanId}`];
  }

  // 2. Coincidencia en los 50 aplicativos de los 8 Hitos (por id o por sgsstAppId) + alias históricos
  const matchedHitoDef = HITO_APP_NODES.find(
    (h) => h.id === cleanId || h.sgsstAppId === cleanId || h.id === raw || h.sgsstAppId === raw,
  );
  if (matchedHitoDef && MODULE_METADATA_MAP[matchedHitoDef.id]) {
    return MODULE_METADATA_MAP[matchedHitoDef.id];
  }
  if (cleanId === 'hito2_cronograma' || cleanId === 'cronograma' || cleanId === 'acpm_task') {
    return MODULE_METADATA_MAP.hito7_acpm;
  }
  if (cleanId === 'hito1_politica' || cleanId === 'politica_objetivos') {
    return MODULE_METADATA_MAP.hito1_politica_objetivos;
  }
  if (cleanId === 'hito6_emergencias' || cleanId === 'emergencias') {
    return MODULE_METADATA_MAP.hito1_plan_emergencias;
  }

  // 3. Nodos raíz del lienzo y alias de Equipos 1, 2, 3, 4, 5, 7 y 8
  if (raw === 'trigger_root' || cleanId === 'root' || cleanId === 'gmail_inbox_watch' || cleanId === 'gmail_watch') {
    return cleanId.includes('gmail') ? MODULE_METADATA_MAP.trigger_email : MODULE_METADATA_MAP.schedule_cron;
  }
  if (raw === 'sub_memory' || cleanId === 'memory' || cleanId === 'somos_sst_empresa') {
    return MODULE_METADATA_MAP.wappy_memory_company;
  }
  if (raw.startsWith('agent_extra') || cleanId.startsWith('agent_extra') || cleanId.includes('subagent')) {
    return MODULE_METADATA_MAP[cleanId] || MODULE_METADATA_MAP.subagent_auditor_calidad;
  }
  if (cleanId === 'somos_sst_trabajadores' || cleanId === 'extract_sst_workers') {
    return MODULE_METADATA_MAP.extract_sst_workers;
  }
  if (cleanId === 'matriz_ipevar') {
    return MODULE_METADATA_MAP.hito2_matriz_ipevar;
  }
  if (cleanId === 'matriz_pesv') {
    return MODULE_METADATA_MAP.hito3_matriz_pesv;
  }
  if (cleanId === 'matriz_compatibilidad') {
    return MODULE_METADATA_MAP.hito3_quimicos_sga;
  }
  if (cleanId === 'consultar_analitica_psicosocial') {
    return MODULE_METADATA_MAP.hito4_psicosocial;
  }
  if (cleanId === 'consultar_analitica_actos_condiciones') {
    return MODULE_METADATA_MAP.hito4_actos_condiciones;
  }
  if (cleanId === 'cursos_lms') {
    return MODULE_METADATA_MAP.hito6_ruta_aprendizaje;
  }
  if (cleanId === 'google_drive') {
    return {
      ...MODULE_METADATA_MAP.extract_drive,
      moduleTitle: '🔧 Conector · Google Drive (Carpetas, PDF y Hojas de Cálculo)',
      moduleBadge: 'Conector · Google Drive',
    };
  }
  if (cleanId === 'one_drive') {
    return {
      ...MODULE_METADATA_MAP.extract_onedrive,
      moduleTitle: '🔧 Conector · Microsoft OneDrive / SharePoint Corporativo',
      moduleBadge: 'Conector · OneDrive',
    };
  }
  if (cleanId === 'google_gmail') {
    return {
      ...MODULE_METADATA_MAP.extract_gmail,
      moduleTitle: '🔧 Conector · Google Gmail (Bandeja de Correo y Adjuntos SST)',
      moduleBadge: 'Conector · Gmail',
    };
  }
  if (cleanId === 'google_antigravity') {
    return MODULE_METADATA_MAP.antigravity_mcp_engine;
  }
  if (cleanId === 'google_antigravity_cloud') {
    return MODULE_METADATA_MAP.antigravity_cloud_mcp_engine;
  }
  if (cleanId === 'scraper_node_antigravity' || cleanId === 'tool_web_scraping_agy' || cleanId.includes('scraping') || cleanId.includes('web_scraper')) {
    return MODULE_METADATA_MAP.extract_web_scraping_agy;
  }
  if (cleanId === 'search_node_live_web' || cleanId === 'web_search' || cleanId.includes('web_search') || cleanId.includes('search_node')) {
    return MODULE_METADATA_MAP.extract_web_search;
  }

  // 3. Empresa Activa / Memoria de Empresa
  if (cleanId.includes('empresa') || cleanId === 'wappy_memory_company' || cleanId === 'tool_sst_company') {
    return {
      moduleTitle: 'Datos y Contexto de la Empresa Activa (Somos SST)',
      moduleBadge: 'Empresa Activa SST',
      fieldsLabel: 'Campos Propios del Perfil de la Empresa Activa',
      fields: [
        'Razón Social y NIT',
        'Código CIIU y Actividad Económica',
        'Clase de Riesgo ARL (Nivel I a V) y Nombre de la ARL',
        'Número Total de Trabajadores y Distribución por Sede',
        'Sedes / Centros de Trabajo, Dirección y Ciudad',
        'Nombre y Cédula del Representante Legal',
        'Nombre, Cédula y Licencia del Responsable del SG-SST',
        'Tamaño de Empresa y Artículo Aplicable Res. 0312 (7, 21 o 60 Estándares)',
        'Puntaje Actual de Autoevaluación Res. 0312 (%)',
        'Peligros Prioritarios y Resumen de los 8 Hitos',
      ],
      quickCombos: [
        {
          label: '⚡ Razón Social + NIT + Riesgo ARL + Total Trabajadores',
          description: 'Datos esenciales de encabezado normativo',
          fields: [
            'Razón Social y NIT',
            'Código CIIU y Actividad Económica',
            'Clase de Riesgo ARL (Nivel I a V) y Nombre de la ARL',
            'Número Total de Trabajadores y Distribución por Sede',
          ],
        },
        {
          label: '⚡ Representante Legal + Responsable SST con Licencia + Sedes',
          description: 'Datos de firma oficial para políticas, actas y reglamentos',
          fields: [
            'Razón Social y NIT',
            'Sedes / Centros de Trabajo, Dirección y Ciudad',
            'Nombre y Cédula del Representante Legal',
            'Nombre, Cédula y Licencia del Responsable del SG-SST',
          ],
        },
        {
          label: '⚡ Estándares Aplicables Res. 0312 + Puntaje % + Resumen 8 Hitos',
          description: 'Contexto ejecutivo del estado actual del SG-SST de la empresa',
          fields: [
            'Tamaño de Empresa y Artículo Aplicable Res. 0312 (7, 21 o 60 Estándares)',
            'Puntaje Actual de Autoevaluación Res. 0312 (%)',
            'Peligros Prioritarios y Resumen de los 8 Hitos',
          ],
        },
      ],
      reportTags: ['sgsst-diagnostico'],
    };
  }

  // 4. Google Drive / OneDrive / Carpeta Local en PC / Google Sheets / Google Docs
  if (
    cleanId.includes('drive') ||
    cleanId.includes('onedrive') ||
    cleanId.includes('pc_folder') ||
    cleanId.includes('sheets') ||
    cleanId.includes('docs')
  ) {
    return {
      moduleTitle: 'Extracción de Archivos y Documentos (Drive / OneDrive / Carpeta PC)',
      moduleBadge: 'Conector Documental',
      fieldsLabel: 'Qué Datos o Soportes Extraer de los Archivos sin Saturar el Flujo',
      fields: [
        'Cédula / Identificación y Nombre del Trabajador en el Documento',
        'Certificados de Afiliación (EPS, ARL, AFP, CCF y Planilla PILA)',
        'Concepto de Aptitud Médica (EMO), Restricciones y Fecha de Examen',
        'Certificados de Trabajo en Alturas y Capacitaciones',
        'Incapacidades Médicas, Diagnóstico CIE-10 y Días Otorgados',
        'Reportes FURAT / Investigación de Accidentes',
        'Fichas de Datos de Seguridad (FDS) y Certificados de Equipos',
        'Tablas y Filas de Hojas de Cálculo (.xlsx / Google Sheets / CSV)',
        'Nombre del Archivo, Carpeta y Fecha de Modificación',
        'Firmas y Validez del Soporte Documental',
      ],
      quickCombos: [
        {
          label: '⚡ Solo Cédula + Nombre + Certificados de Afiliación (EPS/ARL/AFP)',
          description: 'Verifica certificados de afiliación por cédula sin leer texto innecesario',
          fields: [
            'Cédula / Identificación y Nombre del Trabajador en el Documento',
            'Certificados de Afiliación (EPS, ARL, AFP, CCF y Planilla PILA)',
            'Nombre del Archivo, Carpeta y Fecha de Modificación',
          ],
        },
        {
          label: '⚡ Cédula + Nombre + Concepto EMO + Curso Alturas',
          description: 'Valida soportes médicos y de alturas en carpetas de trabajadores',
          fields: [
            'Cédula / Identificación y Nombre del Trabajador en el Documento',
            'Concepto de Aptitud Médica (EMO), Restricciones y Fecha de Examen',
            'Certificados de Trabajo en Alturas y Capacitaciones',
          ],
        },
        {
          label: '⚡ Incapacidades CIE-10 y Reportes FURAT en Carpetas',
          description: 'Extrae datos de ausentismo y accidentes desde soportes PDF/Excel',
          fields: [
            'Cédula / Identificación y Nombre del Trabajador en el Documento',
            'Incapacidades Médicas, Diagnóstico CIE-10 y Días Otorgados',
            'Reportes FURAT / Investigación de Accidentes',
          ],
        },
      ],
      reportTags: [],
    };
  }

  // 5. Gmail / Correo Electrónico
  if (cleanId.includes('gmail') || cleanId.includes('email')) {
    return {
      moduleTitle: 'Conector de Correo Electrónico (Gmail)',
      moduleBadge: 'Conector Email',
      fieldsLabel: 'Campos del Correo Electrónico a Procesar o Incluir',
      fields: [
        'Asunto del Correo',
        'Remitente y Correo de Origen',
        'Fecha y Hora de Recepción',
        'Cédula y Nombre del Trabajador Mencionado',
        'Archivos Adjuntos (Incapacidades, Certificados EPS/ARL, FURAT, Actas PDF)',
        'Resumen Ejecutivo en Tablas HTML',
        'Solo Correos No Leídos de las Últimas 24 Horas',
      ],
      quickCombos: [
        {
          label: '⚡ Solo Correos No Leídos + Cédula/Nombre + Adjuntos PDF',
          description: 'Ideal para procesar incapacidades o certificados recibidos por correo',
          fields: [
            'Asunto del Correo',
            'Cédula y Nombre del Trabajador Mencionado',
            'Archivos Adjuntos (Incapacidades, Certificados EPS/ARL, FURAT, Actas PDF)',
            'Solo Correos No Leídos de las Últimas 24 Horas',
          ],
        },
      ],
      reportTags: [],
    };
  }

  // 6. Web Scraping con Antigravity (Script)
  if (cleanId.includes('scraping') || cleanId.includes('web_scraper')) {
    return {
      moduleTitle: 'Web Scraping con Antigravity (Script Python / Node / Playwright)',
      moduleBadge: 'Script Antigravity',
      fieldsLabel: 'Qué Elementos Extraer de la Página Web',
      fields: [
        'Títulos y Encabezados (H1/H2)',
        'Tablas de Datos Extraídas',
        'Enlaces y Documentos PDF',
        'Resoluciones / Normas Nuevas',
        'Estado de Afiliación / Consulta por Cédula',
        'Precios / Tarifas / Indicadores',
        'Texto Completo Limpio (Markdown)',
        'Capturas de Pantalla (Chrome MCP)',
      ],
      quickCombos: [
        {
          label: '⚡ Solo Tablas de Datos + Enlaces PDF',
          description: 'Extrae únicamente datos tabulares y documentos descargables',
          fields: ['Tablas de Datos Extraídas', 'Enlaces y Documentos PDF'],
        },
      ],
      reportTags: [],
    };
  }

  // 7. Búsqueda en la Web en Vivo
  if (cleanId.includes('web_search') || cleanId.includes('busqueda') || cleanId.includes('search_node')) {
    return {
      moduleTitle: 'Búsqueda en la Web en Tiempo Real',
      moduleBadge: 'Motor Web en Vivo',
      fieldsLabel: 'Criterios y Campos a Extraer de la Búsqueda Web',
      fields: [
        'Fuentes Oficiales (.gov.co / MinTrabajo / INS / ARL)',
        'Últimas Resoluciones, Decretos y Circulares Vigentes',
        'Citas con URL Verificada y Fecha de Publicación',
        'Resumen Comparativo en Tabla Markdown',
        'Jurisprudencia y Conceptos Técnicos Aplicables',
      ],
      quickCombos: [],
      reportTags: [],
    };
  }

  // 8. Skills, Reglas, Sub-Agentes, Nodos Lógicos y Memorias Personalizadas
  if (cleanId.includes('skill') || shape === 'custom_skill') {
    return MODULE_METADATA_MAP.skill_sgsst_tools;
  }

  if (cleanId.includes('rule') || cleanId.includes('regla') || shape === 'custom_rule') {
    return MODULE_METADATA_MAP.rule_veracidad_estricta;
  }

  if (cleanId.includes('subagent') || shape === 'custom_subagent') {
    return MODULE_METADATA_MAP.subagent_researcher;
  }

  if (
    raw === 'if_router' ||
    cleanId.includes('switch') ||
    cleanId.includes('loop') ||
    cleanId.includes('merge') ||
    cleanId.includes('filter') ||
    cleanId.includes('approval') ||
    shape === 'diamond_if'
  ) {
    return {
      moduleTitle: '🔀 Nodo Lógico · Enrutador Condicional / Filtro de Decisión SST',
      moduleBadge: 'Lógica · Condición Si / No',
      fieldsLabel: 'Criterios de Evaluación Condicional y Enrutamiento del Flujo',
      fields: [
        'Evaluar Si Existen Hallazgos Críticos o Brechas Abiertas (> 0)',
        'Evaluar Si Existen Trabajadores con EMO, Curso Alturas o EPP Vencidos',
        'Evaluar Si Faltan Certificados de Afiliación (EPS, ARL o AFP) por Cédula',
        'Evaluar Si el Puntaje Res. 0312 es Menor al 85% (Crítico o Moderado)',
        'Evaluar Si Existen Vehículos con SOAT/RTM Vencido o Falla Preoperacional',
        'Rama VERDADERO (Sí Hay Alerta): Escalar a Correo, Notificación y Tarea ACPM',
        'Rama FALSO (100% Cumplido): Registrar Bitácora Silenciosa sin Enviar Alertas',
        'Agrupar Resultados por Nivel de Criticidad antes de Enrutar',
      ],
      quickCombos: [
        {
          label: '⚡ Si Hay Brechas o Vencimientos ➔ Notificar y Crear ACPM',
          description: 'Enruta alertas reales hacia correo/ACPM y silencia cuando todo está al día',
          fields: [
            'Evaluar Si Existen Hallazgos Críticos o Brechas Abiertas (> 0)',
            'Evaluar Si Existen Trabajadores con EMO, Curso Alturas o EPP Vencidos',
            'Rama VERDADERO (Sí Hay Alerta): Escalar a Correo, Notificación y Tarea ACPM',
            'Rama FALSO (100% Cumplido): Registrar Bitácora Silenciosa sin Enviar Alertas',
          ],
        },
        {
          label: '⚡ Si Faltan Certificados (EPS/ARL/AFP) o Puntaje 0312 < 85% ➔ Escalar',
          description: 'Condición de control legal y seguridad social por trabajador',
          fields: [
            'Evaluar Si Faltan Certificados de Afiliación (EPS, ARL o AFP) por Cédula',
            'Evaluar Si el Puntaje Res. 0312 es Menor al 85% (Crítico o Moderado)',
            'Agrupar Resultados por Nivel de Criticidad antes de Enrutar',
          ],
        },
      ],
      reportTags: [],
    };
  }

  if (shape === 'circle_memory' || cleanId.startsWith('wappy_memory') || cleanId.startsWith('wappy_rag')) {
    return MODULE_METADATA_MAP.wappy_memory_company;
  }

  const fallbackDef = getNodeDefById(raw) || getNodeDefById(cleanId);
  return {
    moduleTitle: fallbackDef?.label || 'Configuración Quirúrgica del Nodo SST',
    moduleBadge: fallbackDef?.badge || 'Nodo del Flujo SST',
    fieldsLabel: 'Campos, Criterios y Resultados a Procesar en este Nodo',
    fields: [
      'Cédula / Documento y Nombre Completo de Trabajadores Relacionados',
      'Cargo, Área / Proceso y Sede Evaluada',
      'Resumen Ejecutivo de Hallazgos y Cumplimiento Normativo',
      'Tabla Comparativa de Brechas Detectadas (Estado Actual vs. Requisito Legal)',
      'Alertas Críticas y Vencimientos Próximos (≤ 30 Días)',
      'Certificados de Afiliación (EPS, ARL, AFP) y Soportes Verificados',
      'Fundamentación Legal (Decreto 1072 de 2015 y Resolución 0312 de 2019)',
      'Recomendaciones Técnicas y Plan de Acción ACPM con Responsables',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + Alertas Críticas + Plan de Acción SST',
        description: 'Extrae datos clave de trabajadores y acciones correctivas sin saturar',
        fields: [
          'Cédula / Documento y Nombre Completo de Trabajadores Relacionados',
          'Cargo, Área / Proceso y Sede Evaluada',
          'Alertas Críticas y Vencimientos Próximos (≤ 30 Días)',
          'Recomendaciones Técnicas y Plan de Acción ACPM con Responsables',
        ],
      },
      {
        label: '⚡ Resumen Ejecutivo + Tabla de Brechas + Fundamentación Legal',
        description: 'Síntesis gerencial y normativa lista para bitácora o correo',
        fields: [
          'Resumen Ejecutivo de Hallazgos y Cumplimiento Normativo',
          'Tabla Comparativa de Brechas Detectadas (Estado Actual vs. Requisito Legal)',
          'Fundamentación Legal (Decreto 1072 de 2015 y Resolución 0312 de 2019)',
        ],
      },
    ],
    reportTags: [],
  };
}

/**
 * Campos rápidos seleccionables con 1 clic al pulsar sobre cualquier nodo del lienzo.
 */
export function getPresetFieldsForNode(nodeId: string, shape?: string): string[] {
  return getNodeModuleMetadata(nodeId, shape).fields;
}

/**
 * Construye una síntesis visual compacta de la configuración quirúrgica de un nodo
 * (filtro de registros en vivo, campos seleccionados e informes adjuntos).
 */
export function buildNodeConfigSummary(cfg?: CanvasNodeConfig): string {
  if (!cfg) return '';
  const badges: string[] = [];

  if (cfg.recordFilterMode === 'critical_only') {
    badges.push('🚨 Solo Críticos/En Brecha');
  } else if (cfg.recordFilterMode === 'selected') {
    const count = cfg.selectedRecordIds?.length || 0;
    if (count > 0) {
      badges.push(`🎯 ${count} reg. esp.`);
    }
  } else if (cfg.recordFilterMode === 'all') {
    badges.push('📋 Todos los reg.');
  }

  if (Array.isArray(cfg.fields) && cfg.fields.length > 0) {
    badges.push(
      `🎯 ${cfg.fields.length} campo(s): ${cfg.fields.slice(0, 2).join(', ')}${
        cfg.fields.length > 2 ? ` +${cfg.fields.length - 2}` : ''
      }`,
    );
  }

  const reportsCount =
    (cfg.selectedReportIds?.length || 0) + (cfg.includeLatestReport ? 1 : 0);
  if (reportsCount > 0) {
    badges.push(`📜 ${reportsCount} informe(s)`);
  }

  if (cfg.targetUrl?.trim()) {
    badges.push('🔗 URL');
  }
  if (cfg.hitoOperationMode === 'extract_only') {
    badges.push('🔍 Solo Extraer');
  } else if (cfg.hitoOperationMode === 'write_register') {
    badges.push('✍️ Registrar/Actualizar');
  } else if (cfg.hitoOperationMode === 'audit_and_update') {
    badges.push('🔄 Auditar + Actualizar');
  }
  if (cfg.voiceCommand?.trim()) {
    badges.push(`🎙️ "${cfg.voiceCommand.trim()}"`);
  }
  if (cfg.emailSenderFilter?.trim() || cfg.emailSubjectFilter?.trim()) {
    badges.push('📧 Filtro Gmail');
  }
  if (cfg.driveFolderName?.trim()) {
    badges.push(`📁 ${cfg.driveFolderName.trim()}`);
  }
  if (cfg.watchFolderPath?.trim()) {
    badges.push(`💻 ${cfg.watchFolderPath.trim()}`);
  }
  if (cfg.dedupWindow) {
    badges.push(`🛡️ Anti-dup ${cfg.dedupWindow}`);
  }
  if (cfg.legalStandards && cfg.legalStandards.length > 0) {
    badges.push(`⚖️ ${cfg.legalStandards.length} normas`);
  }
  if (cfg.ifRuleExpression?.trim()) {
    badges.push('🔀 Regla Si/No');
  }
  if (cfg.customInstruction?.trim()) {
    badges.push('⚙️ Instrucción');
  }

  return badges.join(' · ');
}

/**
 * Autogenera un prompt técnico estructurado de 5 etapas para WAPPY a partir de los nodos conectados y sus configuraciones individuales.
 */
export function buildPromptFromWorkflowNodes(
  taskName: string,
  agentName: string,
  nodes: WorkflowNodesConfig,
): string {
  const triggerIds = normalizeTriggersList(nodes);
  const triggerDefs = triggerIds
    .map((tid) => TRIGGER_NODES.find((t) => t.id === tid))
    .filter(Boolean) as WorkflowNodeDef[];
  const extractorIds = normalizeExtractorsList(nodes);
  const extractorDefs = extractorIds
    .map((eid) => EXTRACTOR_NODES.find((e) => e.id === eid) || HITO_APP_NODES.find((h) => h.id === eid))
    .filter(Boolean) as WorkflowNodeDef[];
  const memoryIds = normalizeMemoriesList(nodes);
  const memoryDefs = memoryIds
    .map((mid) => MEMORY_NODES.find((m) => m.id === mid))
    .filter(Boolean) as WorkflowNodeDef[];
  const engineMode = nodes.aiEngine || 'wappy';
  const modelId = nodes.aiModel || 'gemini-3.6-flash';
  const inputDefs = (nodes.inputs || [])
    .map(
      (id) =>
        INPUT_CONNECTOR_NODES.find((n) => n.id === id) ||
        HITO_APP_NODES.find((h) => h.id === id) ||
        SKILL_RULE_SUBAGENT_NODES.find((s) => s.id === id),
    )
    .filter(Boolean) as WorkflowNodeDef[];
  const hitoDefs = (nodes.hitos || [])
    .map((id) => getNodeDefById(id))
    .filter(Boolean) as WorkflowNodeDef[];
  const outputDefs = (nodes.outputs || [])
    .map((id) => OUTPUT_ACTION_NODES.find((n) => n.id === id))
    .filter(Boolean) as WorkflowNodeDef[];
  const nodeConfigs = nodes.canvasLayout?.nodeConfigs || {};

  const resolveConfigByCandidates = (candidateKeys: string[]): CanvasNodeConfig | undefined => {
    for (const k of candidateKeys) {
      if (nodeConfigs[k]) return nodeConfigs[k];
    }
    return undefined;
  };

  const formatNodeConfigDetail = (candidateKeys: string | string[]): string => {
    const keys = Array.isArray(candidateKeys) ? candidateKeys : [candidateKeys];
    const cfg = resolveConfigByCandidates(keys);
    if (!cfg) return '';
    const parts: string[] = [];

    if (cfg.recordFilterMode === 'critical_only') {
      parts.push(
        `🚨 FILTRO DE REGISTROS EN VIVO: Procesar ÚNICAMENTE los registros Críticos / En Brecha / Con Alerta activa`,
      );
    } else if (cfg.recordFilterMode === 'selected') {
      const selectedLabels =
        Array.isArray(cfg.selectedRecordLabels) && cfg.selectedRecordLabels.length > 0
          ? cfg.selectedRecordLabels
          : Array.isArray(cfg.selectedRecordIds)
            ? cfg.selectedRecordIds
            : [];
      if (selectedLabels.length > 0) {
        parts.push(
          `🎯 REGISTROS ESPECÍFICOS SELECCIONADOS (${selectedLabels.length}): [${selectedLabels.join(' ; ')}]`,
        );
      }
    } else if (cfg.recordFilterMode === 'all') {
      parts.push(`📋 Alcance de registros: Todos los registros activos del aplicativo`);
    }

    if (cfg.fields && cfg.fields.length > 0) {
      const isStrict = cfg.strictFieldFilter !== false;
      parts.push(
        isStrict
          ? `🎯 EXTRACCIÓN QUIRÚRGICA (leer y pasar ÚNICAMENTE estos campos sin saturar el flujo): [${cfg.fields.join(', ')}]`
          : `Campos requeridos: [${cfg.fields.join(', ')}]`,
      );
    }
    if (cfg.includeLatestReport) {
      parts.push(`📜 Incluir Último Informe del Historial del Aplicativo`);
    }
    if (cfg.selectedReportTitles && cfg.selectedReportTitles.length > 0) {
      parts.push(`📜 Informes del Historial Seleccionados: [${cfg.selectedReportTitles.join(' ; ')}]`);
    }
    if (cfg.targetUrl?.trim()) {
      parts.push(`URL(s) Objetivo: "${cfg.targetUrl.trim()}"`);
    }
    if (cfg.scriptEngine) {
      parts.push(`Motor de Script Antigravity: ${cfg.scriptEngine}`);
    }
    if (cfg.scriptCode?.trim()) {
      parts.push(`Script/Selector de Extracción: "${cfg.scriptCode.trim()}"`);
    }
    if (cfg.skillContent?.trim()) {
      parts.push(`Skill (SKILL.md): "${cfg.skillContent.trim()}"`);
    }
    if (cfg.ruleText?.trim()) {
      parts.push(`Regla Obligatoria: "${cfg.ruleText.trim()}"`);
    }
    if (cfg.inputContext?.trim()) {
      parts.push(`Contexto de entrada: "${cfg.inputContext.trim()}"`);
    }
    if (cfg.outputContext?.trim()) {
      parts.push(`Formato/Contexto de salida: "${cfg.outputContext.trim()}"`);
    }
    if (cfg.hitoOperationMode === 'extract_only') {
      parts.push(`Modo en Aplicativo SST: SOLO LEER / EXTRAER DATOS PUNTUALES`);
    } else if (cfg.hitoOperationMode === 'write_register') {
      parts.push(`Modo en Aplicativo SST: CREAR / ACTUALIZAR REGISTROS`);
    } else if (cfg.hitoOperationMode === 'audit_and_update') {
      parts.push(`Modo en Aplicativo SST: AUDITAR BRECHAS Y ACTUALIZAR`);
    }
    if (cfg.voiceCommand?.trim()) {
      parts.push(`Comando de Voz/Chat: "${cfg.voiceCommand.trim()}"`);
    }
    if (cfg.emailSenderFilter?.trim()) {
      parts.push(`Filtro Remitente Gmail: "${cfg.emailSenderFilter.trim()}"`);
    }
    if (cfg.emailSubjectFilter?.trim()) {
      parts.push(`Filtro Asunto Gmail: "${cfg.emailSubjectFilter.trim()}"`);
    }
    if (cfg.onlyWithAttachments) {
      parts.push(`Solo correos con archivos adjuntos (PDF/Excel/Word)`);
    }
    if (cfg.qrPortalTarget?.trim()) {
      parts.push(`Portal QR Vigilado: ${cfg.qrPortalTarget.trim()} (${cfg.qrSeverityFilter === 'critical_only' ? 'Solo críticos' : 'Todos'})`);
    }
    if (cfg.driveFolderName?.trim()) {
      parts.push(`Carpeta/Archivo Drive: "${cfg.driveFolderName.trim()}" (${cfg.fileTypeFilter || 'Todos los formatos'}${cfg.onlyNewFiles ? ', solo nuevos/modificados' : ''})`);
    }
    if (cfg.watchFolderPath?.trim()) {
      parts.push(`Ruta Local Mac/PC (Antigravity): "${cfg.watchFolderPath.trim()}"`);
    }
    if (cfg.workerStatusFilter) {
      parts.push(`Filtro Trabajadores: ${cfg.workerStatusFilter}`);
    }
    if (cfg.dedupWindow) {
      parts.push(`Ventana Anti-Duplicados: ${cfg.dedupWindow} (clave: ${cfg.dedupKey || 'cedula'})`);
    }
    if (cfg.legalStandards && cfg.legalStandards.length > 0) {
      parts.push(`Normas Obligatorias a Citar: [${cfg.legalStandards.join(', ')}]`);
    }
    if (cfg.emailSubject?.trim()) {
      parts.push(`Asunto del Correo: "${cfg.emailSubject.trim()}"`);
    }
    if (cfg.onlyOnCriticalAlerts) {
      parts.push(`Enviar notificación SOLO si existen alertas críticas o vencimientos`);
    }
    if (cfg.whatsappNumbers?.trim()) {
      parts.push(`Destinatarios WhatsApp: ${cfg.whatsappNumbers.trim()}`);
    }
    if (cfg.calendarEventTitle?.trim()) {
      parts.push(`Agendar Evento: "${cfg.calendarEventTitle.trim()}" (${cfg.calendarDurationMinutes || 60} min)`);
    }
    if (cfg.documentTitle?.trim()) {
      parts.push(`Documento Vivo: "${cfg.documentTitle.trim()}" (${cfg.documentTemplate || 'Informe'})`);
    }
    if (cfg.kanbanPriority || cfg.kanbanDueDays) {
      parts.push(`Tarea ACPM Kanban: Prioridad ${cfg.kanbanPriority || 'high'}, Plazo ${cfg.kanbanDueDays || 7} días${cfg.kanbanAssignee ? `, Responsable: ${cfg.kanbanAssignee}` : ''}`);
    }
    if (cfg.ifRuleExpression?.trim()) {
      parts.push(`Condición Si/No: "${cfg.ifRuleExpression.trim()}" | Si CUMPLE (Sí): "${cfg.conditionTrueLabel || 'Continuar a Hito/Alerta'}" | Si NO CUMPLE (No): "${cfg.conditionFalseLabel || 'Solo registrar en bitácora'}"`);
    }
    if (cfg.customInstruction?.trim()) {
      parts.push(`Instrucción específica: "${cfg.customInstruction.trim()}"`);
    }
    return parts.length > 0 ? ` ➔ { ${parts.join(' | ')} }` : '';
  };

  const lines: string[] = [];
  lines.push(
    `Actúa como ${agentName || 'Consultor SG-SST'} ejecutando el flujo automatizado "${taskName || 'Flujo Autónomo SG-SST'}" exclusivamente para la empresa activa.`,
  );

  if (triggerDefs.length > 0) {
    lines.push(
      `\n1. DISPARADORES / ENTRADAS ACTIVAS: ${triggerDefs
        .map((t, i) =>
          `${t.shortLabel} (${t.toolHint})${formatNodeConfigDetail(
            i === 0 ? ['trigger_root', `trigger_${t.id}`, t.id] : [`trigger_${t.id}`, t.id],
          )}`,
        )
        .join(' + ')}.`,
    );
  }

  if (extractorDefs.length > 0) {
    lines.push(
      `\n2. EXTRACCIÓN E INGESTA DE DATOS (LECTURA PREVIA): Extrae primero la información desde: ${extractorDefs
        .map((e) =>
          `${e.shortLabel} (${e.toolHint})${formatNodeConfigDetail([
            `extractor_${e.id}`,
            `ext_${e.id}`,
            e.id,
          ])}`,
        )
        .join('; ')}. Si alguna fuente externa (como Google Drive o Gmail) no está vinculada o no tiene registros nuevos reales, infórmalo con total transparencia sin simular ni inventar datos.`,
    );
  }

  const engineLabel =
    engineMode === 'antigravity_cloud'
      ? `Google Antigravity Cloud 24/7 (antigravity.google.com) + Servidor MCP WAPPY con el modelo ${modelId}`
      : engineMode === 'antigravity'
        ? `Google Antigravity Local (Mac/PC) + Servidor MCP WAPPY por puente Push SSE con el modelo ${modelId}`
        : `WAPPY Cloud IA (Rotación Automática de Claves) con el modelo ${modelId}`;

  lines.push(
    `\n3. AGENTE IA PRINCIPAL, MEMORIAS Y HERRAMIENTAS:\n   - Motor IA: ${engineLabel}${formatNodeConfigDetail('agent_root')}.\n   - Memorias Conectadas: ${memoryDefs
      .map((m, i) =>
        `${m.shortLabel} (${m.toolHint})${formatNodeConfigDetail(
          i === 0 ? ['sub_memory', `sub_memory_${m.id}`, m.id] : [`sub_memory_${m.id}`, m.id],
        )}`,
      )
      .join('; ')}.\n   - Herramientas del Agente: ${
      inputDefs.length > 0
        ? inputDefs
            .map((d) => `${d.toolHint}${formatNodeConfigDetail([`tool_inputs_${d.id}`, d.id])}`)
            .join('; ')
        : 'Herramientas nativas del especialista'
    }.`,
  );

  if (hitoDefs.length > 0) {
    lines.push(
      `\n4. ACCIÓN Y MODIFICACIÓN EN HITOS / APLICATIVOS SOMOS SST: Con la información extraída y analizada, actualiza o alimenta: ${hitoDefs
        .map((h) =>
          `${h.toolHint}${formatNodeConfigDetail([`tool_hitos_${h.id}`, `hito_${h.id}`, h.id])}`,
        )
        .join('; ')}.`,
    );
  }

  if (outputDefs.length > 0) {
    lines.push(
      `\n5. BITÁCORA FINAL Y NOTIFICACIÓN DE SALIDA: Entrega una bitácora completa en Markdown con tablas de todo lo leído y modificado, y ejecuta los canales de salida: ${outputDefs
        .map((o) => `${o.shortLabel} (${o.toolHint})${formatNodeConfigDetail([`out_${o.id}`, o.id])}`)
        .join('; ')}. No crees nuevas tareas programadas durante esta ejecución.`,
    );
  } else {
    lines.push(
      `\n5. BITÁCORA FINAL: Genera una bitácora ejecutiva detallada en Markdown con tablas de los datos extraídos y las acciones realizadas.`,
    );
  }

  const extraAgents = nodes.canvasLayout?.extraAgents || [];
  if (extraAgents.length > 0) {
    const extraDescriptions = extraAgents.map((ea, idx) => {
      const cfg = nodeConfigs[ea.key] || {};
      const engMode = cfg.aiEngine || ea.aiEngine || 'wappy';
      const modName = cfg.aiModel || ea.aiModel || 'gemini-3.6-flash';
      const eng =
        engMode === 'antigravity_cloud'
          ? `Antigravity Cloud 24/7 (${modName})`
          : engMode === 'antigravity'
            ? `Antigravity Local PC (${modName})`
            : `WAPPY Cloud (${modName})`;
      const secondPrompt = (cfg.prompt || ea.prompt || '').trim();
      const inCtx = (cfg.inputContext || ea.inputContext || '').trim();
      const outCtx = (cfg.outputContext || ea.outputContext || '').trim();
      return `\n   • AGENTE IA #${idx + 2} (${ea.agentName || 'Auditor / Revisor SST'} — Motor: ${eng}): ${
        secondPrompt
          ? `PROMPT DEL AGENTE #${idx + 2}: "${secondPrompt}"`
          : 'Revisa, audita y complementa el resultado del Agente Principal antes de la salida final.'
      }${inCtx ? ` | Contexto de Entrada: "${inCtx}"` : ''}${outCtx ? ` | Contexto de Salida: "${outCtx}"` : ''}`;
    });
    lines.push(
      `\n6. ORQUESTACIÓN MULTI-AGENTE (SEGUNDO PROMPT / REVISIÓN):${extraDescriptions.join('')}`,
    );
  }

  const customNodes = nodes.canvasLayout?.customNodes || [];
  if (customNodes.length > 0) {
    const customDescriptions = customNodes.map((cn) => {
      const cfg = nodeConfigs[cn.key] || {};
      const typeLabel =
        cn.nodeType === 'skill'
          ? '🧩 SKILL (Habilidad Procedural)'
          : cn.nodeType === 'subagent'
            ? '🤖 SUB-AGENTE ESPECIALISTA'
            : cn.nodeType === 'rule'
              ? '📏 REGLA OBLIGATORIA (Guardrail)'
              : cn.nodeType === 'web_scraper'
                ? '🕷️ WEB SCRAPING CON ANTIGRAVITY (Script)'
                : '🌐 BÚSQUEDA EN LA WEB EN VIVO';
      const content = (
        cfg.skillContent ||
        cfg.ruleText ||
        cfg.prompt ||
        cn.content ||
        ''
      ).trim();
      const url = (cfg.targetUrl || cn.targetUrl || '').trim();
      const engine = cfg.scriptEngine || cn.scriptEngine || '';
      const script = (cfg.scriptCode || cn.scriptCode || '').trim();
      return `\n   • ${typeLabel} [${cn.title}]: ${content || cn.subtitle || 'Aplicar en el flujo'}${
        url ? ` | URL(s): ${url}` : ''
      }${engine ? ` | Motor Script Antigravity: ${engine}` : ''}${
        script ? ` | Script/Selector: ${script}` : ''
      }${formatNodeConfigDetail(cn.key)}`;
    });
    lines.push(
      `\n7. SKILLS, SUB-AGENTES, REGLAS Y SCRIPTS DE WEB SCRAPING ACTIVOS:${customDescriptions.join('')}`,
    );
  }

  const customEdges = nodes.canvasLayout?.edges || [];
  if (customEdges.length > 0) {
    const resolveKeyLabel = (key: string): string => {
      if (key === 'agent_root') return `Agente IA Principal (${agentName || 'Consultor SG-SST'})`;
      if (key === 'if_router') return 'Condición Si/No (Hallazgos/Alerta)';
      if (key === 'trigger_root') return triggerDefs[0]?.shortLabel || 'Disparador Principal';
      const extraAg = extraAgents.find((a) => a.key === key);
      if (extraAg) return `Agente IA (${extraAg.agentName || 'Segunda IA'})`;
      const customNd = customNodes.find((c) => c.key === key);
      if (customNd) return `${customNd.title} (${customNd.subtitle})`;
      const cleanedId = key.replace(
        /^(trigger_|extractor_|ext_|hito_|out_|tool_inputs_|tool_hitos_|sub_memory_)/,
        '',
      );
      const def = getNodeDefById(cleanedId);
      return def ? def.shortLabel : cleanedId;
    };
    const routeStrings = customEdges.map(
      (ed) => `[${resolveKeyLabel(ed.from)}] ──▶ [${resolveKeyLabel(ed.to)}]`,
    );
    lines.push(
      `\n8. SECUENCIA E INTERCONEXIONES PERSONALIZADAS DEL LIENZO: Respeta estrictamente este orden de conexión definido en el campo: ${routeStrings.join(' ; ')}.`,
    );
  }

  return lines.join('');
}

export const generatePromptFromGraph = buildPromptFromWorkflowNodes;
