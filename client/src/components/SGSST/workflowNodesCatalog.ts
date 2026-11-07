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
  scriptEngine?: 'python_bs4_playwright' | 'node_cheerio_puppeteer' | 'chrome_devtools_mcp' | 'custom_script';
  scriptCode?: string;
  aiEngine?: 'wappy' | 'antigravity' | 'antigravity_cloud';
  aiModel?: string;
  agentId?: string;
}

export interface CanvasNodeConfig {
  fields?: string[];
  /** Si es true (por defecto cuando hay campos elegidos), el nodo extrae ÚNICAMENTE los campos seleccionados para no saturar el flujo */
  strictFieldFilter?: boolean;
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
  scriptEngine?: 'python_bs4_playwright' | 'node_cheerio_puppeteer' | 'chrome_devtools_mcp' | 'custom_script';
  scriptCode?: string;
  skillContent?: string;
  ruleText?: string;
}

export interface NodeQuickCombo {
  label: string;
  description: string;
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
const MODULE_METADATA_MAP: Record<string, NodeModuleMetadata> = {
  // ═══ HITO 1: GOBERNANZA Y CIMIENTO LEGAL (15 APLICATIVOS) ═══
  hito1_dofa: {
    moduleTitle: 'Hito 1 · Contexto y Partes Interesadas (DOFA / Stakeholders)',
    moduleBadge: 'Hito 1 · Gobernanza',
    fieldsLabel: 'Campos y Resultados Propios del Contexto DOFA y Partes Interesadas',
    fields: [
      'Fortalezas Internas SST (F)',
      'Debilidades Internas SST (D)',
      'Oportunidades Externas SST (O)',
      'Amenazas Externas SST (A)',
      'Estrategias Cruzadas CAME (FO / DO / FA / DA)',
      'Partes Interesadas Internas y Externas (Stakeholders)',
      'Necesidades y Expectativas en SST por Parte Interesada',
      'Requisitos Legales y Contractuales Asociados',
      'Mecanismos de Comunicación y Seguimiento',
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
        label: '⚡ Partes Interesadas + Necesidades y Expectativas',
        description: 'Extrae solo la tabla de Stakeholders y sus requisitos SST',
        fields: [
          'Partes Interesadas Internas y Externas (Stakeholders)',
          'Necesidades y Expectativas en SST por Parte Interesada',
          'Requisitos Legales y Contractuales Asociados',
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
      'Puntaje Total Res. 0312 (%)',
      'Valoración Global (Crítico <60% / Moderado 60-85% / Aceptable >85%)',
      'Estándares que NO CUMPLEN (Brechas Críticas y Numeral)',
      'Estándares que CUMPLEN Totalmente (Ítem y Peso)',
      'Estándares que NO APLICAN (Justificación Normativa)',
      'Avance por Ciclo PHVA (Planear, Hacer, Verificar, Actuar)',
      'Modo de Evaluación Aplicado (7, 21 o 60 Estándares según Riesgo y Tamaño)',
      'Evidencias y Soportes Documentales por Estándar',
      'Plan de Mejoramiento Res. 0312 (Acciones, Responsables y Fechas)',
      'Observaciones Técnicas del Evaluador SST',
      'Comparativo con Autoevaluaciones Anteriores',
    ],
    quickCombos: [
      {
        label: '⚡ Puntaje Total (%) + Valoración + Estándares No Cumple',
        description: 'Solo calificación global y brechas críticas pendientes',
        fields: [
          'Puntaje Total Res. 0312 (%)',
          'Valoración Global (Crítico <60% / Moderado 60-85% / Aceptable >85%)',
          'Estándares que NO CUMPLEN (Brechas Críticas y Numeral)',
        ],
      },
      {
        label: '⚡ Brechas No Cumple + Plan de Mejoramiento 0312',
        description: 'Directo para hacer seguimiento a compromisos y cierres',
        fields: [
          'Estándares que NO CUMPLEN (Brechas Críticas y Numeral)',
          'Plan de Mejoramiento Res. 0312 (Acciones, Responsables y Fechas)',
        ],
      },
      {
        label: '⚡ Resumen Ejecutivo por Ciclo PHVA',
        description: 'Avance porcentual en Planear, Hacer, Verificar y Actuar',
        fields: [
          'Puntaje Total Res. 0312 (%)',
          'Avance por Ciclo PHVA (Planear, Hacer, Verificar, Actuar)',
          'Modo de Evaluación Aplicado (7, 21 o 60 Estándares según Riesgo y Tamaño)',
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
      'Cédula / Identificación del Responsable',
      'Número y Resolución de Licencia SST',
      'Fecha de Vencimiento de la Licencia SST',
      'Certificado Curso Virtual 50 Horas / Actualización 20 Horas',
      'Perfil Académico (Profesional / Especialista / Tecnólogo SST)',
      'Carta de Asignación Firmada por Representante Legal',
      'Funciones y Responsabilidades SST Asignadas',
    ],
    quickCombos: [
      {
        label: '⚡ Nombre + Cédula + Vigencia Licencia SST y Curso 50h',
        description: 'Verifica idoneidad legal del responsable del SG-SST',
        fields: [
          'Nombre Completo del Responsable SG-SST',
          'Cédula / Identificación del Responsable',
          'Número y Resolución de Licencia SST',
          'Fecha de Vencimiento de la Licencia SST',
          'Certificado Curso Virtual 50 Horas / Actualización 20 Horas',
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
      'Declaración Oficial y Alcance de la Política SST',
      'Compromisos de la Alta Dirección (Identificación de Peligros, Mejora Continua y Cumplimiento Legal)',
      'Peligros Prioritarios de la Empresa Incluidos',
      'Fecha de Emisión, Versión y Revisión Anual',
      'Firma del Representante Legal',
      'Evidencia de Publicación y Socialización a Trabajadores y COPASST',
    ],
    quickCombos: [
      {
        label: '⚡ Compromisos + Vigencia + Firma Representante Legal',
        description: 'Valida requisitos obligatorios de los Art. 2.2.4.6.5 y 2.2.4.6.6',
        fields: [
          'Compromisos de la Alta Dirección (Identificación de Peligros, Mejora Continua y Cumplimiento Legal)',
          'Fecha de Emisión, Versión y Revisión Anual',
          'Firma del Representante Legal',
        ],
      },
    ],
    reportTags: ['sgsst-politica'],
  },

  hito1_objetivos: {
    moduleTitle: 'Hito 1 · Objetivos e Indicadores de SST',
    moduleBadge: 'Hito 1 · Gobernanza',
    fieldsLabel: 'Campos y Resultados Propios de Objetivos e Indicadores SST',
    fields: [
      'Objetivo Estratégico del SG-SST',
      'Nombre del Indicador Asociado',
      'Tipo de Indicador (Estructura, Proceso o Resultado)',
      'Fórmula de Cálculo y Unidad de Medida',
      'Meta Anual Establecida (%)',
      'Resultado Actual Medido (%) y Semáforo',
      'Frecuencia de Medición y Responsable',
      'Plan de Acción por Desviación de Meta',
    ],
    quickCombos: [
      {
        label: '⚡ Objetivos + Meta (%) + Resultado Actual',
        description: 'Extrae solo el cuadro de mando de cumplimiento de objetivos',
        fields: [
          'Objetivo Estratégico del SG-SST',
          'Nombre del Indicador Asociado',
          'Meta Anual Establecida (%)',
          'Resultado Actual Medido (%) y Semáforo',
        ],
      },
    ],
    reportTags: ['sgsst-objetivos'],
  },

  hito1_matriz_legal: {
    moduleTitle: 'Hito 1 · Matriz Legal SG-SST',
    moduleBadge: 'Hito 1 · Normograma',
    fieldsLabel: 'Campos Propios de la Matriz Legal SG-SST',
    fields: [
      'Tipo de Norma (Ley, Decreto, Resolución, Circular)',
      'Número, Año y Entidad Emisora',
      'Artículos Aplicables a la Empresa',
      'Tema / Peligro o Proceso Regulado',
      'Descripción de la Obligación Legal Específica',
      'Evidencia de Cumplimiento Requerida / Existente',
      'Responsable del Cumplimiento',
      'Estado de Cumplimiento (Cumple / En Proceso / Pendiente)',
      'Fecha de Última Actualización Normativa',
    ],
    quickCombos: [
      {
        label: '⚡ Normas Pendientes / En Proceso + Evidencia Requerida',
        description: 'Filtra solo las obligaciones legales que aún no cumplen al 100%',
        fields: [
          'Tipo de Norma (Ley, Decreto, Resolución, Circular)',
          'Número, Año y Entidad Emisora',
          'Descripción de la Obligación Legal Específica',
          'Evidencia de Cumplimiento Requerida / Existente',
          'Estado de Cumplimiento (Cumple / En Proceso / Pendiente)',
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
      'Datos de la Empresa, NIT, Ciudad y Sedes',
      'Código CIIU, Actividad Económica y Clase de Riesgo ARL',
      'Peligros Físicos, Químicos y Biológicos Declarados',
      'Peligros Biomecánicos, Psicosociales y de Condiciones de Seguridad',
      'Fenómenos Naturales Aplicables',
      'Compromisos Legales de Prevención (Código Sustantivo Art. 349)',
      'Fecha de Emisión, Firma del Representante Legal y Publicación en Dos Lugares Visibles',
    ],
    quickCombos: [
      {
        label: '⚡ CIIU + Riesgo ARL + Peligros Declarados en RHS',
        description: 'Verifica coherencia entre el RHS y la Matriz GTC-45',
        fields: [
          'Código CIIU, Actividad Económica y Clase de Riesgo ARL',
          'Peligros Físicos, Químicos y Biológicos Declarados',
          'Peligros Biomecánicos, Psicosociales y de Condiciones de Seguridad',
        ],
      },
    ],
    reportTags: ['sgsst-rhs'],
  },

  hito1_rit: {
    moduleTitle: 'Hito 1 · Reglamento Interno de Trabajo (RIT)',
    moduleBadge: 'Hito 1 · Gobernanza',
    fieldsLabel: 'Campos Propios del Reglamento Interno de Trabajo (RIT)',
    fields: [
      'Capítulos y Articulado del RIT',
      'Condiciones de Admisión y Período de Prueba',
      'Jornada de Trabajo, Horarios, Horas Extras y Descansos',
      'Obligaciones Especiales del Empleador y de los Trabajadores en SST',
      'Escala de Faltas y Procedimiento Disciplinario (Debida Defensa)',
      'Mecanismos de Prevención de Acoso Laboral (Ley 1010 de 2006)',
      'Orden Jerárquico, Vigencia y Publicación',
    ],
    quickCombos: [
      {
        label: '⚡ Obligaciones SST + Faltas y Sanciones + Ley 1010',
        description: 'Extrae capítulos disciplinarios y de seguridad laboral del RIT',
        fields: [
          'Obligaciones Especiales del Empleador y de los Trabajadores en SST',
          'Escala de Faltas y Procedimiento Disciplinario (Debida Defensa)',
          'Mecanismos de Prevención de Acoso Laboral (Ley 1010 de 2006)',
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
      'Cédula / Identificación del Trabajador',
      'Nombre Completo del Trabajador',
      'Cargo, Área y Sede',
      'Peligros Percibidos en su Puesto de Trabajo',
      'Mapa Corporal de Dolor o Molestia Anatómica',
      'Nivel de Percepción del Riesgo (Bajo / Medio / Alto / Crítico)',
      'Controles o Mejoras Propuestas por el Trabajador',
      'Estado de Incorporación a la Matriz IPEVR Oficial',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + Peligros Percibidos + Molestia Corporal',
        description: 'Extrae solo el reporte participativo de cada colaborador',
        fields: [
          'Cédula / Identificación del Trabajador',
          'Nombre Completo del Trabajador',
          'Peligros Percibidos en su Puesto de Trabajo',
          'Mapa Corporal de Dolor o Molestia Anatómica',
        ],
      },
    ],
    reportTags: ['sgsst-participacion-ipevar'],
  },

  hito2_matriz_ipevar: {
    moduleTitle: 'Hito 1 · Matriz Oficial de Peligros IPEVR (GTC-45)',
    moduleBadge: 'Hito 1 · GTC-45',
    fieldsLabel: 'Columnas y Resultados Propios de la Matriz de Peligros IPEVR GTC-45',
    fields: [
      'Proceso / Área / Zona o Lugar',
      'Actividad y Tarea (Rutinaria / No Rutinaria)',
      'Clasificación del Peligro (Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de Seguridad, Fenómenos Naturales)',
      'Descripción del Peligro y Fuente Generadora',
      'Efectos Posibles en la Salud',
      'Controles Existentes (Fuente, Medio, Individuo)',
      'Nivel de Deficiencia (ND) y Nivel de Exposición (NE)',
      'Nivel de Probabilidad (NP = ND x NE) e Interpretación',
      'Nivel de Consecuencia (NC)',
      'Nivel de Riesgo (NR = NP x NC) e Interpretación (I, II, III, IV)',
      'Aceptabilidad del Riesgo (No Aceptable / Aceptable con Control / Aceptable)',
      'N° de Expuestos y Peor Consecuencia',
      'Requisito Legal Específico Asociado',
      'Medidas de Intervención (Eliminación, Sustitución, Control de Ingeniería, Control Administrativo, EPP)',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Peligros Críticos (Nivel I y II) + Medidas de Intervención',
        description: 'Ideal para priorizar controles sobre riesgos No Aceptables',
        fields: [
          'Proceso / Área / Zona o Lugar',
          'Clasificación del Peligro (Biológico, Físico, Químico, Psicosocial, Biomecánico, Condiciones de Seguridad, Fenómenos Naturales)',
          'Descripción del Peligro y Fuente Generadora',
          'Nivel de Riesgo (NR = NP x NC) e Interpretación (I, II, III, IV)',
          'Aceptabilidad del Riesgo (No Aceptable / Aceptable con Control / Aceptable)',
          'Medidas de Intervención (Eliminación, Sustitución, Control de Ingeniería, Control Administrativo, EPP)',
        ],
      },
      {
        label: '⚡ Proceso + Peligro + Controles Existentes + EPP',
        description: 'Resumen operativo por puesto sin las fórmulas intermedias',
        fields: [
          'Proceso / Área / Zona o Lugar',
          'Actividad y Tarea (Rutinaria / No Rutinaria)',
          'Descripción del Peligro y Fuente Generadora',
          'Controles Existentes (Fuente, Medio, Individuo)',
          'Medidas de Intervención (Eliminación, Sustitución, Control de Ingeniería, Control Administrativo, EPP)',
        ],
      },
    ],
    reportTags: ['sgsst-matriz-ipevar', 'sgsst-matriz-peligros'],
  },

  hito3_matriz_pesv: {
    moduleTitle: 'Hito 1 · Matriz de Riesgos Viales (PESV Res. 40595)',
    moduleBadge: 'Hito 1 · PESV',
    fieldsLabel: 'Columnas y Resultados Propios de la Matriz de Riesgos Viales PESV',
    fields: [
      'Actor Vial Evaluado (Conductor, Motociclista, Ciclista, Peatón, Pasajero)',
      'Factor de Riesgo Vial (Comportamiento Humano, Vehículo Seguro, Infraestructura Segura, Atención a Víctimas)',
      'Proceso / Ruta / Desplazamiento Misional o In Itinere',
      'Peligro Vial Identificado y Causa Raíz',
      'Nivel de Probabilidad Vial (Frecuencia y Exposición)',
      'Nivel de Severidad / Consecuencia Vial',
      'Valoración y Nivel de Riesgo Vial (Crítico, Alto, Medio, Bajo)',
      'Controles Preventivos y Mitigación PESV',
      'Responsable y Seguimiento en Comité PESV',
    ],
    quickCombos: [
      {
        label: '⚡ Actor Vial + Peligro Vial + Nivel de Riesgo + Controles PESV',
        description: 'Extrae la síntesis de riesgos viales críticos',
        fields: [
          'Actor Vial Evaluado (Conductor, Motociclista, Ciclista, Peatón, Pasajero)',
          'Peligro Vial Identificado y Causa Raíz',
          'Valoración y Nivel de Riesgo Vial (Crítico, Alto, Medio, Bajo)',
          'Controles Preventivos y Mitigación PESV',
        ],
      },
    ],
    reportTags: ['sgsst-matriz-pesv'],
  },

  hito3_quimicos_sga: {
    moduleTitle: 'Hito 1 · Matriz de Compatibilidad Química (SGA Dec. 1496)',
    moduleBadge: 'Hito 1 · Químicos SGA',
    fieldsLabel: 'Campos y Resultados Propios de la Matriz de Compatibilidad Química SGA',
    fields: [
      'Nombre del Producto Químico y Sustancia Activa',
      'Número CAS y Número ONU',
      'Clase de Peligro SGA y Pictogramas GHS (GHS01 a GHS09)',
      'Palabra de Advertencia (Peligro / Atención)',
      'Indicaciones de Peligro (Frases H) y Consejos de Prudencia (Frases P)',
      'Resultado de Compatibilidad Cruzada (Verde Compatible / Amarillo Precaución / Rojo Incompatible)',
      'Restricciones de Almacenamiento yDistancia de Separación',
      'EPP Específico y Kit de Atención de Derrames',
      'Vigencia de Ficha de Datos de Seguridad (FDS 16 Secciones)',
    ],
    quickCombos: [
      {
        label: '⚡ Sustancia + CAS/ONU + Pictogramas + Incompatibilidades Rojas',
        description: 'Detecta choques químicos peligrosos en bodega/almacenamiento',
        fields: [
          'Nombre del Producto Químico y Sustancia Activa',
          'Número CAS y Número ONU',
          'Clase de Peligro SGA y Pictogramas GHS (GHS01 a GHS09)',
          'Resultado de Compatibilidad Cruzada (Verde Compatible / Amarillo Precaución / Rojo Incompatible)',
          'Restricciones de Almacenamiento yDistancia de Separación',
        ],
      },
    ],
    reportTags: ['sgsst-matriz-compatibilidad'],
  },

  hito1_oportunidades_sst: {
    moduleTitle: 'Hito 1 · Riesgos del Sistema y Oportunidades SST (ISO 45001)',
    moduleBadge: 'Hito 1 · Gobernanza',
    fieldsLabel: 'Campos Propios de Riesgos Estratégicos y Oportunidades del SG-SST',
    fields: [
      'Proceso o Elemento del SG-SST Evaluado',
      'Riesgo Estratégico del Sistema (Potencial Fallo de Gestión)',
      'Oportunidad de Mejora Estratégica SST',
      'Valoración de Impacto y Factibilidad',
      'Plan de Acción para Abordar Riesgos y Oportunidades',
      'Responsable, Recursos y Fecha de Seguimiento',
    ],
    quickCombos: [
      {
        label: '⚡ Riesgos Estratégicos + Oportunidades + Plan de Acción',
        description: 'Extrae la matriz estratégica ISO 45001 Cap. 6.1',
        fields: [
          'Riesgo Estratégico del Sistema (Potencial Fallo de Gestión)',
          'Oportunidad de Mejora Estratégica SST',
          'Plan de Acción para Abordar Riesgos y Oportunidades',
        ],
      },
    ],
    reportTags: ['sgsst-oportunidades', 'sgsst-oportunidades-sst'],
  },

  hito6_vulnerabilidad: {
    moduleTitle: 'Hito 1 · Análisis de Amenazas y Vulnerabilidad (Diamante de Riesgo)',
    moduleBadge: 'Hito 1 · Emergencias',
    fieldsLabel: 'Campos y Resultados Propios del Análisis de Vulnerabilidad',
    fields: [
      'Amenaza Identificada (Natural, Tecnológica o Social)',
      'Origen de la Amenaza (Interno / Externo) y Fuente',
      'Calificación de la Amenaza (Posible / Probable / Inminente)',
      'Vulnerabilidad en Personas (Gestión Organizacional, Capacitación, Características de Seguridad)',
      'Vulnerabilidad en Recursos (Suministros, Edificación, Equipos)',
      'Vulnerabilidad en Sistemas y Procesos (Servicios, Sistemas Alternos, Recuperación)',
      'Nivel de Riesgo en Diamante de Colores (Alto, Medio, Bajo)',
      'Medidas de Intervención y Mitigación Prioritarias',
    ],
    quickCombos: [
      {
        label: '⚡ Amenaza + Calificación + Nivel de Riesgo Diamante + Mitigación',
        description: 'Extrae solo el resultado del Diamante de Riesgo por amenaza',
        fields: [
          'Amenaza Identificada (Natural, Tecnológica o Social)',
          'Calificación de la Amenaza (Posible / Probable / Inminente)',
          'Nivel de Riesgo en Diamante de Colores (Alto, Medio, Bajo)',
          'Medidas de Intervención y Mitigación Prioritarias',
        ],
      },
    ],
    reportTags: ['sgsst-vulnerabilidad'],
  },

  hito1_plan_emergencias: {
    moduleTitle: 'Hito 1 · Plan de Emergencias y Contingencias (PPRE)',
    moduleBadge: 'Hito 1 · Emergencias',
    fieldsLabel: 'Componentes Propios del Plan de Emergencias y Contingencias (PPRE)',
    fields: [
      'Georreferenciación, Carga Ocupacional e Instalaciones de la Sede',
      'Procedimientos Operativos Normalizados (PONs por Sismo, Incendio, Evacuación, Derrame)',
      'Rutas de Evacuación, Salidas de Emergencia y Puntos de Encuentro',
      'Sistema de Alerta y Alarma (Códigos de Evacuación)',
      'Plan de Evacuación Médica (MEDEVAC) y Centros Asistenciales Cercanos',
      'Plan de Ayuda Mutua y Directorio de Emergencias Externo',
      'Estructura del Comité de Emergencias y Brigada',
    ],
    quickCombos: [
      {
        label: '⚡ PONs + Rutas de Evacuación + MEDEVAC',
        description: 'Extrae los protocolos operativos de respuesta inmediata',
        fields: [
          'Procedimientos Operativos Normalizados (PONs por Sismo, Incendio, Evacuación, Derrame)',
          'Rutas de Evacuación, Salidas de Emergencia y Puntos de Encuentro',
          'Plan de Evacuación Médica (MEDEVAC) y Centros Asistenciales Cercanos',
        ],
      },
    ],
    reportTags: ['sgsst-plan-emergencias'],
  },

  // ═══ HITO 2: HUELLA BIOCÉNTRICA (4 APLICATIVOS) ═══
  hito2_perfiles_cargo: {
    moduleTitle: 'Hito 2 · Perfiles de Cargo y Profesiograma',
    moduleBadge: 'Hito 2 · Biocéntrica',
    fieldsLabel: 'Campos Propios de Perfiles de Cargo y Profesiograma',
    fields: [
      'Nombre del Cargo / Rol',
      'Área / Proceso y Jefe Inmediato',
      'Objetivo General y Funciones Esenciales del Cargo',
      'Educación, Formación, Habilidades y Experiencia Requerida',
      'Responsabilidades Específicas en el SG-SST (Dec. 1072)',
      'Profesiograma: Exámenes Médicos de Ingreso, Periódicos, Egreso y Especiales',
      'Restricciones o Contraindicaciones Médicas del Cargo',
      'Matriz de EPP Requeridos por el Cargo',
      'Peligros y Riesgos Críticos Expuestos en el Cargo',
      'Capacitaciones y Certificaciones SST Obligatorias (ej. Alturas, Vial, Manipulación)',
    ],
    quickCombos: [
      {
        label: '⚡ Nombre del Cargo + Profesiograma (Exámenes Médicos) + EPP',
        description: 'Ideal para cruzar con Condiciones de Salud y Entrega de EPP',
        fields: [
          'Nombre del Cargo / Rol',
          'Profesiograma: Exámenes Médicos de Ingreso, Periódicos, Egreso y Especiales',
          'Matriz de EPP Requeridos por el Cargo',
        ],
      },
      {
        label: '⚡ Cargo + Funciones + Responsabilidades SST + Peligros del Cargo',
        description: 'Para cartas de inducción y asignación de responsabilidades SST',
        fields: [
          'Nombre del Cargo / Rol',
          'Objetivo General y Funciones Esenciales del Cargo',
          'Responsabilidades Específicas en el SG-SST (Dec. 1072)',
          'Peligros y Riesgos Críticos Expuestos en el Cargo',
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
      'Cédula / Identificación',
      'Nombre Completo',
      'Cargo / Rol',
      'Área / Proceso',
      'Sede / Centro de Trabajo',
      'Edad',
      'Fecha de Nacimiento',
      'Género',
      'Estado Civil',
      'Nivel de Escolaridad',
      'Profesión / Oficio',
      'Tipo de Contrato',
      'Fecha de Ingreso a la Empresa',
      'Antigüedad en la Empresa',
      'Antigüedad en el Cargo Actual',
      'EPS (Entidad Promotora de Salud)',
      'ARL (Administradora de Riesgos Laborales)',
      'AFP (Fondo de Pensiones)',
      'Caja de Compensación Familiar (CCF)',
      'Certificados de Afiliación (EPS / ARL / AFP / Planilla PILA)',
      'Rango Salarial / Ingresos',
      'Turno / Jornada de Trabajo',
      'Tipo de Vivienda (Propia / Arrendada / Familiar)',
      'Estrato Socioeconómico',
      'Personas a Cargo',
      'Cabeza de Familia (Sí / No)',
      'Medio de Transporte al Trabajo',
      'Tiempo de Desplazamiento Casa-Trabajo',
      'Correo Electrónico',
      'Teléfono / Celular',
      'Contacto de Emergencia (Nombre, Parentesco y Teléfono)',
      'Grupo Sanguíneo y Factor RH',
      'Hábito de Tabaquismo y Consumo de Alcohol',
      'Práctica de Actividad Física / Deporte',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Cédula y Nombre Completo (Sin Saturar)',
        description: 'Extrae únicamente Cédula y Nombre Completo para cruces rápidos sin saturar el flujo',
        fields: ['Cédula / Identificación', 'Nombre Completo'],
      },
      {
        label: '⚡ Cédula + Nombre + Certificados de Afiliación (EPS / ARL / AFP / PILA)',
        description: 'Directo para auditar certificados de afiliación a seguridad social por número de cédula',
        fields: [
          'Cédula / Identificación',
          'Nombre Completo',
          'EPS (Entidad Promotora de Salud)',
          'ARL (Administradora de Riesgos Laborales)',
          'AFP (Fondo de Pensiones)',
          'Caja de Compensación Familiar (CCF)',
          'Certificados de Afiliación (EPS / ARL / AFP / Planilla PILA)',
        ],
      },
      {
        label: '⚡ Cédula + Nombre + Edad + Cargo + Área',
        description: 'Identificación básica operativa del trabajador',
        fields: [
          'Cédula / Identificación',
          'Nombre Completo',
          'Edad',
          'Cargo / Rol',
          'Área / Proceso',
        ],
      },
      {
        label: '⚡ Cédula + Nombre + RH + Teléfono + Contacto de Emergencia',
        description: 'Ficha rápida de emergencias y brigada',
        fields: [
          'Cédula / Identificación',
          'Nombre Completo',
          'Grupo Sanguíneo y Factor RH',
          'Teléfono / Celular',
          'Contacto de Emergencia (Nombre, Parentesco y Teléfono)',
        ],
      },
    ],
    reportTags: ['sgsst-perfil-sociodemografico'],
  },

  hito2_condiciones_salud: {
    moduleTitle: 'Hito 2 · Informe de Condiciones de Salud y Exámenes Médicos (EMO)',
    moduleBadge: 'Hito 2 · Biocéntrica',
    fieldsLabel: 'Lista Completa de Campos de Condiciones de Salud y EMO',
    fields: [
      'Cédula / Identificación',
      'Nombre Completo',
      'Cargo Evaluado y Área',
      'Tipo de Examen Médico (Ingreso / Periódico / Egreso / Post-Incapacidad / Cambio de Ocupación)',
      'Fecha de Último Examen Médico Ocupacional (EMO)',
      'Fecha de Vencimiento / Próximo EMO',
      'Concepto de Aptitud Médica (Apto / Apto con Restricciones / Aplazado)',
      'Restricciones Médicas Laborales Activas',
      'Recomendaciones Médicas Ocupacionales y Temporales',
      'Diagnósticos Clínicos (CIE-10) y Hallazgos Osteomusculares / Visuales / Auditivos',
      'Sistemas de Vigilancia Epidemiológica (SVE: Biomecánico, Conservación Auditiva, Visual, Cardiovascular, Psicosocial)',
      'Exámenes Paraclínicos / Complementarios (Audiometría, Visiometría, Espirometría, Alturas, Manipulación de Alimentos)',
      'Antecedentes Patológicos, Quirúrgicos y Traumáticos',
      'Alergias y Tratamientos Farmacológicos Activos',
      'Índice de Masa Corporal (IMC) y Clasificación Nutricional',
      'Remisión a EPS o ARL y Seguimiento al Cierre',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Cédula + Nombre + Concepto de Aptitud + Restricciones',
        description: 'Extrae solo el estado de aptitud médica y restricciones sin saturar',
        fields: [
          'Cédula / Identificación',
          'Nombre Completo',
          'Cargo Evaluado y Área',
          'Concepto de Aptitud Médica (Apto / Apto con Restricciones / Aplazado)',
          'Restricciones Médicas Laborales Activas',
        ],
      },
      {
        label: '⚡ Cédula + Nombre + Fecha y Vencimiento EMO',
        description: 'Ideal para alertas de exámenes médicos periódicos vencidos o próximos a vencer',
        fields: [
          'Cédula / Identificación',
          'Nombre Completo',
          'Cargo Evaluado y Área',
          'Fecha de Último Examen Médico Ocupacional (EMO)',
          'Fecha de Vencimiento / Próximo EMO',
        ],
      },
      {
        label: '⚡ Cédula + Nombre + Recomendaciones Médicas + SVE',
        description: 'Para seguimiento de vigilancia epidemiológica y cartas de recomendaciones',
        fields: [
          'Cédula / Identificación',
          'Nombre Completo',
          'Recomendaciones Médicas Ocupacionales y Temporales',
          'Sistemas de Vigilancia Epidemiológica (SVE: Biomecánico, Conservación Auditiva, Visual, Cardiovascular, Psicosocial)',
        ],
      },
    ],
    reportTags: ['sgsst-condiciones-salud'],
  },

  hito2_oraculo_predictivo: {
    moduleTitle: 'Hito 2 · Dictamen de Compatibilidad Trabajador-Cargo (Bio-Individuo)',
    moduleBadge: 'Hito 2 · Compatibilidad Cargo-Persona',
    fieldsLabel: 'Campos, Tarjetas Preventivas y Resultados Propios de «Compatibilidad Trabajador-Cargo»',
    fields: [
      'Cédula / Identificación',
      'Nombre Completo',
      'Cargo y Área Asignada',
      'FIT Score (% Índice Biocéntrico Integral Persona-Cargo)',
      'Tarjetas Preventivas (Todas: Recomendaciones, Limitaciones, Patologías, Tratamientos y Alergias)',
      'Tarjeta Preventiva: Recomendación Preventiva',
      'Tarjeta Preventiva: Limitación Biomecánica / Restricción',
      'Tarjeta Preventiva: Patología / Antecedente Clínico',
      'Tarjeta Preventiva: Tratamiento Médico Activo',
      'Tarjeta Preventiva: Alergias Identificadas',
      'Concepto de Compatibilidad Trabajador-Cargo (Compatible / Condicionado / Crítico)',
      'Alertas de Choque Biocéntrico (Salud del Trabajador vs. Exigencias del Cargo)',
      'Puntaje e Historial de Percepción del Riesgo del Trabajador',
      'Matriz Biocéntrica IPEVR Individual (Peligros Expuestos en el Puesto)',
      'Estado de Seguridad Social (PILA / EPS / ARL / AFP)',
      'Cursos, Alturas y Entrega de EPP del Trabajador',
      'Dictamen Técnico de Reubicación, Readaptación o Ajuste de Puesto',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + Tarjetas Preventivas',
        description: 'Extrae únicamente Cédula, Nombre y las Tarjetas Preventivas del trabajador',
        fields: [
          'Cédula / Identificación',
          'Nombre Completo',
          'Cargo y Área Asignada',
          'Tarjetas Preventivas (Todas: Recomendaciones, Limitaciones, Patologías, Tratamientos y Alergias)',
        ],
      },
      {
        label: '⚡ Cédula + Nombre + FIT Score (%) + Tarjetas Preventivas + Alertas',
        description: 'Cruza el índice FIT % con las tarjetas preventivas y choques cargo-salud',
        fields: [
          'Cédula / Identificación',
          'Nombre Completo',
          'Cargo y Área Asignada',
          'FIT Score (% Índice Biocéntrico Integral Persona-Cargo)',
          'Tarjetas Preventivas (Todas: Recomendaciones, Limitaciones, Patologías, Tratamientos y Alergias)',
          'Alertas de Choque Biocéntrico (Salud del Trabajador vs. Exigencias del Cargo)',
        ],
      },
      {
        label: '⚡ Cédula + Nombre + Compatibilidad Cargo + Dictamen Reubicación',
        description: 'Solo dictamen ejecutivo de aptitud y ajustes requeridos en el cargo',
        fields: [
          'Cédula / Identificación',
          'Nombre Completo',
          'Concepto de Compatibilidad Trabajador-Cargo (Compatible / Condicionado / Crítico)',
          'Dictamen Técnico de Reubicación, Readaptación o Ajuste de Puesto',
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
      'Integrantes del COPASST / Vigía (Representantes del Empleador y de los Trabajadores — Principales y Suplentes)',
      'Actas de Convocatoria, Votación y Conformación del COPASST',
      'Actas de Reunión Mensual Ordinaria / Extraordinaria',
      'Verificación de Quórum y Asistencia de Miembros',
      'Temas Tratados (Inspecciones, Investigación ATEL, Seguimiento Plan Anual)',
      'Compromisos del Acta, Responsables y Fechas de Cumplimiento',
      'Seguimiento al Estado de Compromisos de Actas Anteriores',
    ],
    quickCombos: [
      {
        label: '⚡ Última Acta Mensual + Compromisos Pendientes + Responsables',
        description: 'Extrae compromisos abiertos del COPASST para seguimiento o correo',
        fields: [
          'Actas de Reunión Mensual Ordinaria / Extraordinaria',
          'Compromisos del Acta, Responsables y Fechas de Cumplimiento',
          'Seguimiento al Estado de Compromisos de Actas Anteriores',
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
      'Integrantes del Comité de Convivencia Laboral (Principales y Suplentes)',
      'Actas de Conformación y Posesión del CCL',
      'Actas de Reunión Trimestral Ordinaria / Extraordinaria',
      'Seguimiento Estadístico de Quejas de Presunto Acoso Laboral (Reserva Ley 1010)',
      'Planes de Mejora de Clima y Convivencia Laboral',
      'Compromisos, Campañas de Prevención y Seguimiento Trimestral',
    ],
    quickCombos: [
      {
        label: '⚡ Actas Trimestrales CCL + Compromisos de Convivencia',
        description: 'Extrae los acuerdos y planes preventivos del Comité de Convivencia',
        fields: [
          'Actas de Reunión Trimestral Ordinaria / Extraordinaria',
          'Planes de Mejora de Clima y Convivencia Laboral',
          'Compromisos, Campañas de Prevención y Seguimiento Trimestral',
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
      'Integrantes del Comité de Seguridad Vial (CSV)',
      'Actas de Reunión Trimestral del CSV',
      'Indicadores de Siniestralidad Vial, Infracciones y Capacitación Vial',
      'Resultados de Inspecciones Preoperacionales y Mantenimiento de Flota',
      'Compromisos Viales, Responsables y Fechas Límite',
    ],
    quickCombos: [
      {
        label: '⚡ Indicadores PESV + Compromisos del Comité Vial',
        description: 'Síntesis ejecutiva de seguridad vial',
        fields: [
          'Indicadores de Siniestralidad Vial, Infracciones y Capacitación Vial',
          'Compromisos Viales, Responsables y Fechas Límite',
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
      'Listado de Brigadistas Activos (Cédula, Nombre, Cargo, Sede y Teléfono)',
      'Unidad Asignada (Primeros Auxilios, Prevención y Control de Incendios, Evacuación y Rescate)',
      'Organigrama del Sistema Comando de Incidentes (Comandante, Oficial de Seguridad, Enlace, Operaciones)',
      'Certificaciones y Entrenamientos de Brigadistas',
      'Dotación e Inventario Asignado a la Brigada',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre de Brigadistas + Unidad Asignada',
        description: 'Extrae el directorio operativo de brigadistas por sede',
        fields: [
          'Listado de Brigadistas Activos (Cédula, Nombre, Cargo, Sede y Teléfono)',
          'Unidad Asignada (Primeros Auxilios, Prevención y Control de Incendios, Evacuación y Rescate)',
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
      'Cédula y Nombre Completo del Trabajador',
      'Cargo, Proceso y Sede',
      'Peligros Expuestos en el Puesto Individual',
      'Cruces con Condiciones de Salud y Sintomatología Corporal',
      'Valoración de Riesgo Bio-Individual (NR y Aceptabilidad)',
      'Controles Personalizados (Fuente, Medio e Individuo)',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + Peligros Bio-Individuales + Controles',
        description: 'Extrae la matriz de peligros personalizada por colaborador',
        fields: [
          'Cédula y Nombre Completo del Trabajador',
          'Peligros Expuestos en el Puesto Individual',
          'Valoración de Riesgo Bio-Individual (NR y Aceptabilidad)',
          'Controles Personalizados (Fuente, Medio e Individuo)',
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
      'Trabajador Evaluado (Cédula, Nombre y Cargo)',
      'Tarea / Actividad y Fase de Trabajo Analizada',
      'Posición de Espalda (1 a 4), Brazos (1 a 3), Piernas (1 a 7) y Carga/Fuerza (1 a 3)',
      'Código Postural OWAS de 4 Dígitos',
      'Categoría de Riesgo OWAS (Nivel 1 Normal / Nivel 2 Leve / Nivel 3 Dañino / Nivel 4 Urgente)',
      'Frecuencia Relativa de Posturas por Segmento Corporal',
      'Recomendaciones Ergonómicas y Rediseño de Puesto',
    ],
    quickCombos: [
      {
        label: '⚡ Trabajador + Código OWAS + Categoría de Riesgo (1-4) + Recomendaciones',
        description: 'Extrae solo los resultados posturales críticos y acciones correctivas',
        fields: [
          'Trabajador Evaluado (Cédula, Nombre y Cargo)',
          'Código Postural OWAS de 4 Dígitos',
          'Categoría de Riesgo OWAS (Nivel 1 Normal / Nivel 2 Leve / Nivel 3 Dañino / Nivel 4 Urgente)',
          'Recomendaciones Ergonómicas y Rediseño de Puesto',
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
      'Trabajador Evaluado (Cédula, Nombre, Edad, Antigüedad)',
      'Cargo, Área y Jornada Laboral',
      'Motivo del Estudio (Calificación de Origen, Reintegro, Recomendaciones Médicas, Preventivo)',
      'Diagnóstico Médico Asociado (CIE-10)',
      'Descripción del Puesto, Mobiliario, Herramientas y Equipos',
      'Análisis de Demandas Biomecánicas (Posturas, Movimientos Repetitivos, Manipulación de Cargas)',
      'Condiciones Ambientales (Iluminación, Ruido, Temperatura, Vibración)',
      'Concepto Ergonómico y Plan de Intervención / Ajustes Razonables',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + Diagnóstico CIE-10 + Demandas Biomecánicas + Ajustes',
        description: 'Síntesis del EPT para ARL, EPS o reubicación laboral',
        fields: [
          'Trabajador Evaluado (Cédula, Nombre, Edad, Antigüedad)',
          'Diagnóstico Médico Asociado (CIE-10)',
          'Análisis de Demandas Biomecánicas (Posturas, Movimientos Repetitivos, Manipulación de Cargas)',
          'Concepto Ergonómico y Plan de Intervención / Ajustes Razonables',
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
      'Índice Global de Bienestar y Clima Emocional',
      'Distribución de Estados de Ánimo Reportados (Motivado, Tranquilo, Cansado, Estresado, Agotado)',
      'Áreas / Procesos con Mayor Nivel de Estrés o Fatiga',
      'Factores Intralaborales, Extralaborales e Individuales Detectados (Res. 2764)',
      'Alertas Tempranas de Riesgo Psicosocial / Burnout',
      'Plan de Intervención Psicosocial y Vigilancia Epidemiológica',
    ],
    quickCombos: [
      {
        label: '⚡ Índice de Bienestar + Alertas por Área + Plan de Intervención',
        description: 'Resumen psicosocial respetando la reserva legal',
        fields: [
          'Índice Global de Bienestar y Clima Emocional',
          'Áreas / Procesos con Mayor Nivel de Estrés o Fatiga',
          'Alertas Tempranas de Riesgo Psicosocial / Burnout',
          'Plan de Intervención Psicosocial y Vigilancia Epidemiológica',
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
      'Bien, Producto, Maquinaria o Servicio a Adquirir',
      'Especificaciones y Requisitos Técnicos de SST Exigidos',
      'Normas y Certificaciones Requeridas (ANSI, NIOSH, EN, RETIE, FDS)',
      'Proveedor Seleccionado y Evaluación SST',
      'Verificación de Cumplimiento SST al Recibo e Ingreso a Inventario',
    ],
    quickCombos: [
      {
        label: '⚡ Producto + Requisitos Técnicos SST + Certificación Exigida',
        description: 'Matriz de especificaciones SST de compra',
        fields: [
          'Bien, Producto, Maquinaria o Servicio a Adquirir',
          'Especificaciones y Requisitos Técnicos de SST Exigidos',
          'Normas y Certificaciones Requeridas (ANSI, NIOSH, EN, RETIE, FDS)',
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
      'Razón Social y NIT de la Empresa Contratista',
      'Representante Legal, Contacto y Objeto del Contrato',
      'Certificado de Autoevaluación Res. 0312 Emitido por ARL del Contratista',
      'Verificación de Planilla PILA Vigente (EPS, ARL y AFP de Trabajadores Destacados)',
      'Listado de Trabajadores del Contratista (Cédula, Nombre, Cargo y Curso Alturas)',
      'Constancia de Inducción SST y Entrega de EPP',
      'Evaluación de Desempeño y Cumplimiento SST del Contratista',
    ],
    quickCombos: [
      {
        label: '⚡ Contratista + NIT + Planilla PILA + Certificado 0312 ARL',
        description: 'Auditoría rápida de requisitos legales antes de autorizar ingreso',
        fields: [
          'Razón Social y NIT de la Empresa Contratista',
          'Certificado de Autoevaluación Res. 0312 Emitido por ARL del Contratista',
          'Verificación de Planilla PILA Vigente (EPS, ARL y AFP de Trabajadores Destacados)',
          'Listado de Trabajadores del Contratista (Cédula, Nombre, Cargo y Curso Alturas)',
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
      'Título y Tipo de Cambio (Infraestructura, Maquinaria, Proceso, Personal o Normativo)',
      'Descripción Detallada del Cambio Propuesto',
      'Identificación de Nuevos Peligros y Evaluación de Riesgos del Cambio',
      'Impacto en Documentos, Matriz IPEVR, Procedimientos y Capacitación',
      'Medidas de Control Previas a la Puesta en Marcha',
      'Responsable, Fecha de Implementación y Aprobación SST',
    ],
    quickCombos: [
      {
        label: '⚡ Cambio Propuesto + Nuevos Peligros + Controles Previos',
        description: 'Extrae el análisis de impacto SST antes de autorizar el cambio',
        fields: [
          'Título y Tipo de Cambio (Infraestructura, Maquinaria, Proceso, Personal o Normativo)',
          'Identificación de Nuevos Peligros y Evaluación de Riesgos del Cambio',
          'Medidas de Control Previas a la Puesta en Marcha',
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
      'Nombre de la Tarea Crítica / Trabajo a Realizar',
      'Fecha, Área, Sede y Equipos / Herramientas a Utilizar',
      'Trabajadores Ejecutores (Cédula, Nombre Completo y Cargo)',
      'Secuencia de Pasos de la Tarea (Paso a Paso)',
      'Peligros y Riesgos Potenciales por Cada Paso',
      'Controles Preventivos y Operativos en Sitio por Paso',
      'Elementos de Protección Personal (EPP) Específicos Requeridos',
      'Firmas de Trabajadores y Aprobación del Supervisor / Coordinador SST',
    ],
    quickCombos: [
      {
        label: '⚡ Tarea + Trabajadores (Cédula/Nombre) + Pasos + Peligros + Controles',
        description: 'Extrae el ATS operativo completo listo para validación en campo',
        fields: [
          'Nombre de la Tarea Crítica / Trabajo a Realizar',
          'Trabajadores Ejecutores (Cédula, Nombre Completo y Cargo)',
          'Secuencia de Pasos de la Tarea (Paso a Paso)',
          'Peligros y Riesgos Potenciales por Cada Paso',
          'Controles Preventivos y Operativos en Sitio por Paso',
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
      'Ubicación Exacta, Descripción del Trabajo y Altura Aproximada (metros)',
      'Trabajadores Autorizados (Cédula, Nombre, Vigencia Curso Alturas, Aptitud Médica y ARL)',
      'Coordinador de Trabajo en Alturas y Ayudante de Seguridad Asignado',
      'Verificación de Sistemas de Acceso (Andamio, Escalera, Plataforma, Cuerda)',
      'Inspección Preuso de Equipos (Arnés Multipropósito, Eslinga con Absorbedor, Casco con Barbuquejo, Mosquetones, Punto de Anclaje ≥5000 lb)',
      'Cálculo de Requerimiento de Claridad / Distancia Total de Caída',
      'Plan de Rescate en Alturas y Kit de Rescate Disponible en Sitio',
      'Condiciones Climáticas y Vigencia Horaria del Permiso',
    ],
    quickCombos: [
      {
        label: '⚡ Trabajadores (Cédula/Nombre) + Curso Alturas + Aptitud Médica + Equipos',
        description: 'Verifica habilitación legal de cada trabajador antes de subir a alturas',
        fields: [
          'Trabajadores Autorizados (Cédula, Nombre, Vigencia Curso Alturas, Aptitud Médica y ARL)',
          'Coordinador de Trabajo en Alturas y Ayudante de Seguridad Asignado',
          'Inspección Preuso de Equipos (Arnés Multipropósito, Eslinga con Absorbedor, Casco con Barbuquejo, Mosquetones, Punto de Anclaje ≥5000 lb)',
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
      'Código Interno y Número de Serie / Lote del Equipo',
      'Tipo de Equipo (Arnés, Eslinga de Posicionamiento/Detención, Línea de Vida, Mosquetón, Freno)',
      'Marca, Modelo y Norma Técnica de Certificación (ANSI Z359 / EN / CSA)',
      'Fecha de Fabricación y Fecha de Puesta en Servicio',
      'Fecha de Última Inspección Anual Avalada y Próxima Inspección',
      'Estado de Costuras, Reatas, Herrajes, Argollas y Etiqueta Legible',
      'Concepto del Equipo (Apto en Uso / En Cuarentena / Dado de Baja por Impacto o Deterioro)',
      'Trabajador o Cuadrilla Asignada (Cédula y Nombre)',
    ],
    quickCombos: [
      {
        label: '⚡ Serial + Tipo de Equipo + Próxima Inspección + Estado (Apto/Baja)',
        description: 'Control de vencimientos de inspección anual de equipos de alturas',
        fields: [
          'Código Interno y Número de Serie / Lote del Equipo',
          'Tipo de Equipo (Arnés, Eslinga de Posicionamiento/Detención, Línea de Vida, Mosquetón, Freno)',
          'Fecha de Última Inspección Anual Avalada y Próxima Inspección',
          'Concepto del Equipo (Apto en Uso / En Cuarentena / Dado de Baja por Impacto o Deterioro)',
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
      'Cédula / Identificación del Trabajador',
      'Nombre Completo y Cargo del Trabajador',
      'Elemento de Protección Personal (EPP) Entregado',
      'Parte del Cuerpo Protegida (Cabeza, Visual, Auditiva, Respiratoria, Manos, Pies, Caídas)',
      'Referencia, Marca y Norma Técnica de Certificación (ANSI / NIOSH / NTC)',
      'Cantidad Entregada y Talla',
      'Fecha de Entrega y Motivo (Primera Vez, Reposición por Deterioro, Cambio de Cargo)',
      'Fecha Estimada de Reposición / Vencimiento del EPP',
      'Constancia y Firma de Recibido del Trabajador',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + EPP Entregado + Fecha de Reposición',
        description: 'Audita qué trabajadores tienen EPP próximos a reposición o pendientes',
        fields: [
          'Cédula / Identificación del Trabajador',
          'Nombre Completo y Cargo del Trabajador',
          'Elemento de Protección Personal (EPP) Entregado',
          'Fecha de Entrega y Motivo (Primera Vez, Reposición por Deterioro, Cambio de Cargo)',
          'Fecha Estimada de Reposición / Vencimiento del EPP',
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
      'Nombre Comercial del Producto Químico y Fabricante',
      'Componentes Peligrosos, N° CAS y N° ONU',
      'Estado Físico (Líquido, Sólido, Gas, Aerosol) y Cantidad Almacenada',
      'Área / Proceso de Uso y Lugar de Almacenamiento',
      'Pictogramas de Peligro SGA / GHS y Palabra de Advertencia',
      'Frases H (Peligro) y Frases P (Prudencia)',
      'Disponibilidad y Vigencia de Ficha de Datos de Seguridad (FDS < 5 años)',
      'Etiquetado SGA en Envase Original y Trasvasado',
      'EPP Químico Requerido y Medidas de Primeros Auxilios / Derrames',
    ],
    quickCombos: [
      {
        label: '⚡ Producto Químico + CAS + Pictogramas SGA + Vigencia FDS + EPP',
        description: 'Revisa qué productos químicos tienen FDS vencida o faltante',
        fields: [
          'Nombre Comercial del Producto Químico y Fabricante',
          'Componentes Peligrosos, N° CAS y N° ONU',
          'Pictogramas de Peligro SGA / GHS y Palabra de Advertencia',
          'Disponibilidad y Vigencia de Ficha de Datos de Seguridad (FDS < 5 años)',
          'EPP Químico Requerido y Medidas de Primeros Auxilios / Derrames',
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
      'Placa del Vehículo',
      'Tipo de Vehículo (Camioneta, Automóvil, Motocicleta, Camión, Maquinaria)',
      'Marca, Línea, Modelo y Cilindraje',
      'Conductor Asignado (Cédula, Nombre Completo, Categoría y Vigencia de Licencia de Conducción)',
      'Fecha de Vencimiento del SOAT',
      'Fecha de Vencimiento de Revisión Técnico-Mecánica (RTM)',
      'Póliza de Responsabilidad Civil / Todo Riesgo',
      'Kilometraje Actual y Próximo Mantenimiento Preventivo (Frenos, Llantas, Luces, Fluidos)',
      'Resultado de Última Inspección Preoperacional Diaria (Apto / Con Hallazgos / Inmovilizado)',
    ],
    quickCombos: [
      {
        label: '⚡ Placa + Conductor (Cédula/Licencia) + Vencimiento SOAT y RTM',
        description: 'Alerta inmediata de documentos vehiculares o licencias vencidas',
        fields: [
          'Placa del Vehículo',
          'Conductor Asignado (Cédula, Nombre Completo, Categoría y Vigencia de Licencia de Conducción)',
          'Fecha de Vencimiento del SOAT',
          'Fecha de Vencimiento de Revisión Técnico-Mecánica (RTM)',
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
      'Categoría (Extintor, Botiquín, Camilla Rígida, DEA, Alarma, Lavaojos, Kit Derrames)',
      'Agente / Capacidad (Multipropósito ABC, Solkaflam, CO2, Agua a Presión — Libras)',
      'Sede, Piso y Ubicación Exacta',
      'Fecha de Última Recarga / Mantenimiento',
      'Fecha de Vencimiento / Próxima Recarga',
      'Estado de Inspección Física (Manómetro, Pin de Seguridad, Manguera, Señalización, Acceso Libre)',
      'Insumos del Botiquín (Vencimiento de Gasas, Suero, Inmovilizadores)',
    ],
    quickCombos: [
      {
        label: '⚡ Código + Tipo (Extintor/Botiquín) + Ubicación + Fecha Vencimiento Recarga',
        description: 'Detecta extintores o insumos de botiquín vencidos por sede',
        fields: [
          'Código / ID del Equipo de Emergencia',
          'Categoría (Extintor, Botiquín, Camilla Rígida, DEA, Alarma, Lavaojos, Kit Derrames)',
          'Sede, Piso y Ubicación Exacta',
          'Fecha de Vencimiento / Próxima Recarga',
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
      'Tema o Información SST a Comunicar',
      'Tipo de Comunicación (Interna / Externa / Autorreporte de Condiciones)',
      'Emisor y Público Objetivo (Trabajadores, Contratistas, COPASST, Visitantes, ARL)',
      'Canal y Medio Utilizado (Correo, Cartelera, Charla 5 Min, QR, WAPPY)',
      'Frecuencia y Fecha de Divulgación',
      'Evidencia y Registro de Recepción de Inquietudes / Aportes de Trabajadores',
    ],
    quickCombos: [
      {
        label: '⚡ Tema SST + Público Objetivo + Canal + Evidencia',
        description: 'Resumen del plan de comunicaciones ejecutado',
        fields: [
          'Tema o Información SST a Comunicar',
          'Emisor y Público Objetivo (Trabajadores, Contratistas, COPASST, Visitantes, ARL)',
          'Canal y Medio Utilizado (Correo, Cartelera, Charla 5 Min, QR, WAPPY)',
          'Evidencia y Registro de Recepción de Inquietudes / Aportes de Trabajadores',
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
      'Tema de la Capacitación / Inducción / Reinducción',
      'Eje Temático Asociado a Peligros Prioritarios (Alturas, Vial, Ergonomía, Químicos, Emergencias)',
      'Objetivo de Aprendizaje y Duración (Horas)',
      'Fecha Programada vs. Fecha Ejecutada',
      'Capacitador / Entidad (ARL, Profesional SST, Externo)',
      'Población Objetivo y Listado de Asistentes (Cédula, Nombre y Cargo)',
      'Indicador de Cobertura (%) y Cumplimiento del Cronograma (%)',
      'Evaluación de Eficacia y Calificación Promedio',
      'Estado de la Actividad (Ejecutada / Programada / Pendiente)',
    ],
    quickCombos: [
      {
        label: '⚡ Capacitaciones Pendientes + Cobertura (%) + Trabajadores Faltantes',
        description: 'Identifica qué capacitaciones o inducciones faltan por ejecutar',
        fields: [
          'Tema de la Capacitación / Inducción / Reinducción',
          'Fecha Programada vs. Fecha Ejecutada',
          'Población Objetivo y Listado de Asistentes (Cédula, Nombre y Cargo)',
          'Indicador de Cobertura (%) y Cumplimiento del Cronograma (%)',
          'Estado de la Actividad (Ejecutada / Programada / Pendiente)',
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
      'Curso / Ruta de Aprendizaje LMS',
      'Trabajador Inscrito (Cédula, Nombre Completo y Cargo)',
      'Porcentaje de Avance del Curso (%)',
      'Lecciones Completadas y Pendientes',
      'Calificación Obtenida en Evaluaciones / Quizzes',
      'Estado de Certificación (Certificado Emitido / En Curso / Sin Iniciar)',
    ],
    quickCombos: [
      {
        label: '⚡ Cédula + Nombre + Curso LMS + % Avance + Certificado',
        description: 'Verifica quiénes ya aprobaron sus cursos obligatorios en el LMS',
        fields: [
          'Trabajador Inscrito (Cédula, Nombre Completo y Cargo)',
          'Curso / Ruta de Aprendizaje LMS',
          'Porcentaje de Avance del Curso (%)',
          'Estado de Certificación (Certificado Emitido / En Curso / Sin Iniciar)',
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
      'ID y Fecha del Reporte',
      'Clasificación (Acto Inseguro / Condición Insegura / Casi-Accidente)',
      'Trabajador que Reporta (Cédula, Nombre y Cargo)',
      'Sede, Área o Lugar Exacto del Hallazgo',
      'Descripción Detallada del Hallazgo y Evidencia Fotográfica',
      'Nivel de Riesgo / Prioridad (Alta / Media / Baja)',
      'Acción Correctiva Inmediata Propuesta y Responsable',
      'Estado del Reporte (Abierto / En Gestión / Cerrado)',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Reportes Abiertos (Prioridad Alta/Media) + Ubicación + Acción',
        description: 'Filtra hallazgos de campo sin cerrar para gestión inmediata',
        fields: [
          'Clasificación (Acto Inseguro / Condición Insegura / Casi-Accidente)',
          'Sede, Área o Lugar Exacto del Hallazgo',
          'Descripción Detallada del Hallazgo y Evidencia Fotográfica',
          'Nivel de Riesgo / Prioridad (Alta / Media / Baja)',
          'Estado del Reporte (Abierto / En Gestión / Cerrado)',
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
      'Fecha, Hora y Escenario del Simulacro (Sismo, Incendio, Fuga, Evacuación Total)',
      'Sede Evaluada y Número Total de Personas Evacuadas',
      'Tiempo Total de Salida y Llegada al Punto de Encuentro (Minutos y Segundos)',
      'Desempeño de la Brigada, Sistema de Alarma y Rutas de Evacuación',
      'Fallos u Oportunidades de Mejora Detectadas durante el Simulacro',
      'Plan de Acción Post-Simulacro y Acta Oficial',
    ],
    quickCombos: [
      {
        label: '⚡ Escenario + Evacuados + Tiempo de Respuesta + Oportunidades de Mejora',
        description: 'Síntesis del informe anual de simulacro (Art. 2.2.4.6.25)',
        fields: [
          'Fecha, Hora y Escenario del Simulacro (Sismo, Incendio, Fuga, Evacuación Total)',
          'Sede Evaluada y Número Total de Personas Evacuadas',
          'Tiempo Total de Salida y Llegada al Punto de Encuentro (Minutos y Segundos)',
          'Fallos u Oportunidades de Mejora Detectadas durante el Simulacro',
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
      'Nombre del Micro-Aplicativo / Inspección Personalizada',
      'Campos Capturados en Formulario',
      'Registros Recibidos y Tabulación de Respuestas',
      'Hallazgos y Alertas Generadas',
    ],
    quickCombos: [],
    reportTags: ['sgsst-live-editor'],
  },

  // ═══ HITO 7: AUDITORÍA, CAUSALIDAD Y MEJORA CONTINUA (6 APLICATIVOS) ═══
  hito7_estadisticas_atel: {
    moduleTitle: 'Hito 7 · Gestión Integral de Ausentismo e Indicadores ATEL (Res. 0312 Art. 30)',
    moduleBadge: 'Hito 7 · Ausentismo & ATEL',
    fieldsLabel: 'Indicadores Oficiales Res. 0312 Art. 30 y Registros de Ausentismo',
    fields: [
      'Período / Mes y Año Analizado',
      'Frecuencia de Accidentalidad (N° AT en el mes / N° Trabajadores x 100)',
      'Severidad de Accidentalidad (Días de incapacidad por AT + días cargados / N° Trabajadores x 100)',
      'Proporción de Accidentes de Trabajo Mortales (%)',
      'Prevalencia de la Enfermedad Laboral (Casos nuevos y antiguos EL / Trabajadores x 100.000)',
      'Incidencia de la Enfermedad Laboral (Casos nuevos EL / Trabajadores x 100.000)',
      'Ausentismo por Causa Médica (Días de ausencia por incapacidad laboral o común / Días programados x 100)',
      'Registro Individual de Incapacidades (Cédula, Nombre, Cargo, Tipo AT/EL/EG, Diagnóstico CIE-10, Días Perdidos, Prórrogas)',
      'Análisis de Tendencia y Costos de Ausentismo',
    ],
    quickCombos: [
      {
        label: '⚡ Los 6 Indicadores Mínimos Res. 0312 Art. 30',
        description: 'Frecuencia, Severidad, Mortalidad, Prevalencia, Incidencia y Ausentismo',
        fields: [
          'Frecuencia de Accidentalidad (N° AT en el mes / N° Trabajadores x 100)',
          'Severidad de Accidentalidad (Días de incapacidad por AT + días cargados / N° Trabajadores x 100)',
          'Proporción de Accidentes de Trabajo Mortales (%)',
          'Prevalencia de la Enfermedad Laboral (Casos nuevos y antiguos EL / Trabajadores x 100.000)',
          'Incidencia de la Enfermedad Laboral (Casos nuevos EL / Trabajadores x 100.000)',
          'Ausentismo por Causa Médica (Días de ausencia por incapacidad laboral o común / Días programados x 100)',
        ],
      },
      {
        label: '⚡ Cédula + Nombre + Diagnóstico CIE-10 + Días de Incapacidad',
        description: 'Listado nominal de trabajadores con incapacidades o ausentismo recurrente',
        fields: [
          'Registro Individual de Incapacidades (Cédula, Nombre, Cargo, Tipo AT/EL/EG, Diagnóstico CIE-10, Días Perdidos, Prórrogas)',
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
      'Datos del Trabajador Accidentado (Cédula, Nombre Completo, Edad, Cargo, Antigüedad, EPS y ARL)',
      'Clasificación del Evento (Incidente / Accidente Leve / Accidente Grave / Mortal) y N° Radicado FURAT',
      'Fecha, Hora, Jornada, Lugar Exacto y Descripción Detallada del Evento',
      'Naturaleza de la Lesión, Parte del Cuerpo Afectada, Agente y Mecanismo del Accidente',
      'Días de Incapacidad Iniciales y Testigos Entrevistados',
      'Causas Inmediatas: Actos Subestándar (Inseguros) y Condiciones Subestándar (Ambientales)',
      'Causas Básicas: Factores Personales y Factores del Trabajo (Metodología Árbol de Causas / 5 Porqués / Ishikawa)',
      'Medidas de Intervención (En la Fuente, en el Medio y en el Trabajador) con Responsables y Fechas',
      'Equipo Investigador (Jefe Inmediato, Representante COPASST, Responsable SST y Profesional con Licencia en AT Grave)',
      'Lección Aprendida para Socialización',
    ],
    quickCombos: [
      {
        label: '⚡ Trabajador (Cédula/Nombre) + Evento + Causas Básicas/Inmediatas + Plan de Acción',
        description: 'Síntesis completa de la investigación conforme a la Resolución 1401 de 2007',
        fields: [
          'Datos del Trabajador Accidentado (Cédula, Nombre Completo, Edad, Cargo, Antigüedad, EPS y ARL)',
          'Clasificación del Evento (Incidente / Accidente Leve / Accidente Grave / Mortal) y N° Radicado FURAT',
          'Causas Inmediatas: Actos Subestándar (Inseguros) y Condiciones Subestándar (Ambientales)',
          'Causas Básicas: Factores Personales y Factores del Trabajo (Metodología Árbol de Causas / 5 Porqués / Ishikawa)',
          'Medidas de Intervención (En la Fuente, en el Medio y en el Trabajador) con Responsables y Fechas',
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
      'Código / ID de la Acción y Fecha de Apertura',
      'Fuente del Hallazgo (Auditoría Interna, Diagnóstico 0312, Investigación ATEL, COPASST, Inspección, Alta Dirección)',
      'Tipo de Acción (Correctiva / Preventiva / de Mejora)',
      'Descripción del Hallazgo o No Conformidad y Análisis de Causa Raíz',
      'Descripción del Plan de Acción Propuesto',
      'Responsable de Ejecución y Recursos Asignados',
      'Fecha Límite de Compromiso / Vencimiento',
      'Estado en Kanban (Pendiente, En Proceso, En Verificación, Cerrada, Vencida)',
      'Evidencia Documental de Cierre y Verificación de Eficacia',
    ],
    quickCombos: [
      {
        label: '⚡ Solo Acciones ACPM Abiertas o Vencidas + Responsable + Fecha Límite',
        description: 'Ideal para recordatorios automáticos de tareas pendientes por correo',
        fields: [
          'Fuente del Hallazgo (Auditoría Interna, Diagnóstico 0312, Investigación ATEL, COPASST, Inspección, Alta Dirección)',
          'Descripción del Plan de Acción Propuesto',
          'Responsable de Ejecución y Recursos Asignados',
          'Fecha Límite de Compromiso / Vencimiento',
          'Estado en Kanban (Pendiente, En Proceso, En Verificación, Cerrada, Vencida)',
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
      'Alcance de la Auditoría, Fecha y Equipo Auditor (Con Participación del COPASST)',
      'Evaluación de los 22 Puntos de Alcance Obligatorio (Dec. 1072 Art. 2.2.4.6.30)',
      'Conformidades y Fortalezas Evidenciadas en el Sistema',
      'No Conformidades Mayores y Menores Detectadas (Numeral y Evidencia Objetiva)',
      'Observaciones y Oportunidades de Mejora de Auditoría',
      'Conclusiones de Eficacia del SG-SST y Plan de Cierre hacia ACPM',
    ],
    quickCombos: [
      {
        label: '⚡ No Conformidades + Observaciones + Plan de Cierre ACPM',
        description: 'Extrae únicamente los hallazgos abiertos de la auditoría anual',
        fields: [
          'No Conformidades Mayores y Menores Detectadas (Numeral y Evidencia Objetiva)',
          'Observaciones y Oportunidades de Mejora de Auditoría',
          'Conclusiones de Eficacia del SG-SST y Plan de Cierre hacia ACPM',
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
      'Fecha de Revisión, Período Evaluado y Participantes de la Alta Dirección',
      'Verificación de los 24 Aspectos Obligatorios del Art. 2.2.4.6.31 (Dec. 1072)',
      'Cumplimiento de la Política, Objetivos, Plan de Trabajo Anual y Presupuesto SST',
      'Resultado de Indicadores de Accidentalidad, Enfermedad Laboral y Ausentismo',
      'Estado de Investigación ATEL, COPASST, Inspecciones y Auditorías Previas',
      'Decisiones Estratégicas de la Gerencia, Nuevos Recursos y Metas Aprobadas',
      'Acta Firmada por el Representante Legal y Comunicación al COPASST y Responsable SST',
    ],
    quickCombos: [
      {
        label: '⚡ Evaluación de los 24 Ítems + Decisiones Gerenciales + Presupuesto Aprobado',
        description: 'Resumen gerencial para el Representante Legal y COPASST',
        fields: [
          'Verificación de los 24 Aspectos Obligatorios del Art. 2.2.4.6.31 (Dec. 1072)',
          'Cumplimiento de la Política, Objetivos, Plan de Trabajo Anual y Presupuesto SST',
          'Decisiones Estratégicas de la Gerencia, Nuevos Recursos y Metas Aprobadas',
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
      'Pregunta / Caso Jurídico o Técnico Investigado',
      'Normativa Vigente, Sentencias (Corte Constitucional / CSJ) y Conceptos MinTrabajo',
      'Análisis de Responsabilidad Civil, Laboral, Administrativa y Penal en SST',
      'Conclusiones y Dictamen Jurídico-Técnico Aplicable a la Empresa',
    ],
    quickCombos: [],
    reportTags: ['sgsst-investigacion-profunda'],
  },

  // ═══ HITO 8: INTELIGENCIA ARTIFICIAL & ORÁCULO PREDICTIVO (1 APLICATIVO) ═══
  hito8_predictivo: {
    moduleTitle: 'Hito 8 · Centro de Inteligencia Predictiva y Gemelo Digital SST',
    moduleBadge: 'Hito 8 · IA Predictiva',
    fieldsLabel: 'Indicadores, Radares y Alertas del Centro de Inteligencia Predictiva',
    fields: [
      'Score Global de Salud y Blindaje del SG-SST (%)',
      'Radar de los 9 Dominios del SG-SST (Gobernanza, Salud, Ergonómico, Psicosocial, Vial, Químico, Alturas, Emergencias, Auditoría)',
      'Alertas de Riesgo Letal / Crítico por Trabajador (Cédula, Nombre, Cargo y Cruce Clínico-Operativo)',
      'Alertas de Choque Osteomuscular y Cardiovascular por Exigencia del Cargo',
      'Predicción de Vencimientos Críticos (Exámenes EMO, Cursos Alturas, SOAT/RTM, Extintores)',
      'Recomendaciones Preventivas Priorizadas por el Oráculo IA',
    ],
    quickCombos: [
      {
        label: '⚡ Alertas Letales y Clínicas por Trabajador (Cédula + Nombre + Cargo)',
        description: 'Extrae los cruces predictivos de alto riesgo individual',
        fields: [
          'Alertas de Riesgo Letal / Crítico por Trabajador (Cédula, Nombre, Cargo y Cruce Clínico-Operativo)',
          'Alertas de Choque Osteomuscular y Cardiovascular por Exigencia del Cargo',
          'Recomendaciones Preventivas Priorizadas por el Oráculo IA',
        ],
      },
    ],
    reportTags: ['sgsst-predictivo-ia'],
  },
};

/**
 * Resuelve los metadatos completos (campos reales, combos quirúrgicos 1 clic e historial de informes)
 * para cualquier nodo del lienzo (aplicativos de los 8 Hitos, extractores, conectores, memorias o salidas).
 */
export function getNodeModuleMetadata(nodeId: string, shape?: string): NodeModuleMetadata {
  const raw = (nodeId || '').trim();
  const cleanId = raw.replace(
    /^(trigger_|ext_|hito_|out_|tool_inputs_|tool_hitos_|sub_memory_)/,
    '',
  );

  // 1. Coincidencia directa o por sgsstAppId en los 50 aplicativos de los 8 Hitos
  if (MODULE_METADATA_MAP[cleanId]) {
    return MODULE_METADATA_MAP[cleanId];
  }
  const matchedHitoDef = HITO_APP_NODES.find(
    (h) => h.id === cleanId || h.sgsstAppId === cleanId || h.id === raw || h.sgsstAppId === raw,
  );
  if (matchedHitoDef && MODULE_METADATA_MAP[matchedHitoDef.id]) {
    return MODULE_METADATA_MAP[matchedHitoDef.id];
  }

  // 2. Alias de Extractores y Conectores de Motores Somos SST hacia sus aplicativos reales
  if (cleanId === 'extract_sst_workers' || cleanId === 'somos_sst_trabajadores') {
    return {
      ...MODULE_METADATA_MAP.hito2_perfil_socio,
      moduleTitle: 'Extraer Trabajadores, Perfil Sociodemográfico y Expedientes (Somos SST)',
      moduleBadge: 'Extractor · Expedientes SST',
      reportTags: ['sgsst-perfil-sociodemografico', 'sgsst-condiciones-salud', 'sgsst-bio-ipevar'],
    };
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
  if (cleanId === 'acpm_task') {
    return MODULE_METADATA_MAP.hito7_acpm;
  }
  if (cleanId === 'extract_sst_app') {
    return {
      moduleTitle: 'Extraer Datos de Aplicativo / Resumen 360° (Somos SST)',
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
        'Acciones Abiertas o Vencidas en Tablero Kanban ACPM',
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
          label: '⚡ Resumen de Vencimientos Críticos (EMO + SOAT/RTM + ACPM)',
          description: 'Solo alertas próximas a vencer en la empresa',
          fields: [
            'Vencimiento de Exámenes Médicos (EMO) y Restricciones Activas',
            'Hallazgos Viales PESV y Documentos Vehiculares (SOAT/RTM)',
            'Acciones Abiertas o Vencidas en Tablero Kanban ACPM',
          ],
        },
      ],
      reportTags: ['sgsst-diagnostico', 'sgsst-perfil-sociodemografico', 'sgsst-matriz-ipevar'],
    };
  }

  // 3. Empresa Activa / Memoria de Empresa
  if (cleanId.includes('empresa') || cleanId === 'wappy_memory_company') {
    return {
      moduleTitle: 'Datos y Contexto de la Empresa Activa (Somos SST)',
      moduleBadge: 'Empresa Activa SST',
      fieldsLabel: 'Campos Propios del Perfil de la Empresa Activa',
      fields: [
        'Razón Social y NIT',
        'Código CIIU y Actividad Económica',
        'Clase de Riesgo ARL (Nivel I a V) y Nombre de la ARL',
        'Número Total de Trabajadores y Distribución por Sede',
        'Sedes / Centros de Trabajo y Ciudad',
        'Nombre y Cédula del Representante Legal',
        'Nombre y Licencia del Responsable del SG-SST',
      ],
      quickCombos: [
        {
          label: '⚡ Razón Social + NIT + Riesgo ARL + Total Trabajadores',
          description: 'Datos esenciales de encabezado normativo',
          fields: [
            'Razón Social y NIT',
            'Clase de Riesgo ARL (Nivel I a V) y Nombre de la ARL',
            'Número Total de Trabajadores y Distribución por Sede',
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
        'Concepto de Aptitud Médica (EMO) y Fecha de Examen',
        'Certificados de Trabajo en Alturas y Capacitaciones',
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
          ],
        },
        {
          label: '⚡ Cédula + Nombre + Concepto EMO + Curso Alturas',
          description: 'Valida soportes médicos y de alturas en carpetas de trabajadores',
          fields: [
            'Cédula / Identificación y Nombre del Trabajador en el Documento',
            'Concepto de Aptitud Médica (EMO) y Fecha de Examen',
            'Certificados de Trabajo en Alturas y Capacitaciones',
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

  // 8. Skills, Reglas, Sub-Agentes y Memorias
  if (cleanId.includes('skill') || shape === 'custom_skill') {
    return {
      moduleTitle: 'Nodo de Skill (SKILL.md)',
      moduleBadge: 'Habilidad Procedural',
      fieldsLabel: 'Directivas de la Skill a Aplicar',
      fields: [
        'Aplicar Procedimiento Paso a Paso',
        'Validar Formato de Salida',
        'Ejecutar Checklist Técnico Normativo',
        'Incluir Plantilla Oficial WAPPY',
      ],
      quickCombos: [],
      reportTags: [],
    };
  }

  if (cleanId.includes('rule') || cleanId.includes('regla') || shape === 'custom_rule') {
    return {
      moduleTitle: 'Nodo de Regla Obligatoria (Guardrail)',
      moduleBadge: 'Regla de Control',
      fieldsLabel: 'Restricciones Activas de la Regla',
      fields: [
        'Cero Invención de Datos (Estricto)',
        'Extraer Solo los Campos Seleccionados (No Saturar)',
        'Anonimizar Datos Clínicos Sensibles (Ley 1581 / Res. 2346)',
        'Citar Numeral Exacto de la Norma Colombiana',
        'Bloquear Envío si Faltan Soportes Reales',
      ],
      quickCombos: [],
      reportTags: [],
    };
  }

  if (shape === 'circle_memory' || cleanId.startsWith('wappy_memory') || cleanId.startsWith('wappy_rag')) {
    return {
      moduleTitle: 'Memoria Conectada al Agente IA',
      moduleBadge: 'Memoria del Agente',
      fieldsLabel: 'Elementos de Memoria a Inyectar',
      fields: [
        'Datos de Empresa Activa (NIT, CIIU, Nivel de Riesgo ARL y Sedes)',
        'Bitácora de Ejecución Previa (Evitar Duplicar Registros Procesados)',
        'Marco Normativo (Decreto 1072, Res. 0312, GTC-45, Res. 2764 y PESV)',
        'Protocolos y Cuadernos Documentales en Google NotebookLM',
      ],
      quickCombos: [],
      reportTags: ['sgsst-live-editor'],
    };
  }

  return {
    moduleTitle: getNodeDefById(cleanId)?.label || 'Configuración de Datos del Nodo',
    moduleBadge: getNodeDefById(cleanId)?.badge || 'Nodo del Flujo',
    fieldsLabel: 'Campos y Resultados a Procesar en este Nodo',
    fields: [
      'Resumen Ejecutivo',
      'Tabla Detallada de Hallazgos',
      'Cédula y Nombre Completo de Trabajadores Relacionados',
      'Alertas Críticas y Vencimientos',
      'Recomendaciones y Plan de Acción SST',
    ],
    quickCombos: [],
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

  const formatNodeConfigDetail = (key: string): string => {
    const cfg = nodeConfigs[key];
    if (!cfg) return '';
    const parts: string[] = [];
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
        .map((t, i) => `${t.shortLabel} (${t.toolHint})${formatNodeConfigDetail(i === 0 ? 'trigger_root' : `trigger_${t.id}`)}`)
        .join(' + ')}.`,
    );
  }

  if (extractorDefs.length > 0) {
    lines.push(
      `\n2. EXTRACCIÓN E INGESTA DE DATOS (LECTURA PREVIA): Extrae primero la información desde: ${extractorDefs
        .map((e) => `${e.shortLabel} (${e.toolHint})${formatNodeConfigDetail(`ext_${e.id}`)}`)
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
      .map((m) => `${m.shortLabel} (${m.toolHint})${formatNodeConfigDetail(`sub_memory_${m.id}`)}`)
      .join('; ')}.\n   - Herramientas del Agente: ${
      inputDefs.length > 0
        ? inputDefs.map((d) => `${d.toolHint}${formatNodeConfigDetail(`tool_inputs_${d.id}`)}`).join('; ')
        : 'Herramientas nativas del especialista'
    }.`,
  );

  if (hitoDefs.length > 0) {
    lines.push(
      `\n4. ACCIÓN Y MODIFICACIÓN EN HITOS / APLICATIVOS SOMOS SST: Con la información extraída y analizada, actualiza o alimenta: ${hitoDefs
        .map((h) => `${h.toolHint}${formatNodeConfigDetail(`hito_${h.id}`)}`)
        .join('; ')}.`,
    );
  }

  if (outputDefs.length > 0) {
    lines.push(
      `\n5. BITÁCORA FINAL Y NOTIFICACIÓN DE SALIDA: Entrega una bitácora completa en Markdown con tablas de todo lo leído y modificado, y ejecuta los canales de salida: ${outputDefs
        .map((o) => `${o.shortLabel} (${o.toolHint})${formatNodeConfigDetail(`out_${o.id}`)}`)
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
      const cleanedId = key
        .replace(/^(trigger_|ext_|hito_|out_|tool_inputs_|tool_hitos_|sub_memory_)/, '');
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
