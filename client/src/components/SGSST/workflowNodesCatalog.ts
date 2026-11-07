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

export interface CanvasNodeConfig {
  fields?: string[];
  inputContext?: string;
  outputContext?: string;
  customInstruction?: string;
  aiEngine?: 'wappy' | 'antigravity' | 'antigravity_cloud';
  aiModel?: string;
  prompt?: string;
  conditionTrueLabel?: string;
  conditionFalseLabel?: string;
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
    badge: 'Lee los 7 Hitos',
    description:
      'Extrae los datos actuales de cualquier aplicativo o matriz de los 7 Hitos de Somos SST (0312, GTC-45, PESV, Químicos, Comités, ATEL, ACPM).',
    category: 'extractor',
    toolHint: 'Extraer información actual de los aplicativos y matrices de Somos SST (somos_sst: resumen_empresa, consultar_informacion_empresa)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
];

export function normalizeExtractorsList(nodes?: Partial<WorkflowNodesConfig> | null): string[] {
  if (Array.isArray(nodes?.extractors) && nodes!.extractors!.length > 0) {
    const valid = nodes!.extractors!.filter((id) => EXTRACTOR_NODES.some((e) => e.id === id));
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
    shortLabel: 'Web Search Legal',
    category: 'IA, MCP & Web',
    toolHint: 'web_search (consulta en tiempo real de leyes, resoluciones y sentencias en Colombia)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
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
  // Hito 1
  {
    id: 'hito1_diagnostico_0312',
    label: 'Hito 1 · Diagnóstico Estándares Mínimos (Res. 0312)',
    shortLabel: 'H1: Diagnóstico 0312',
    category: 'Hito 1: Organización',
    toolHint: 'Diagnóstico de Estándares Mínimos Res. 0312 (somos_sst: diagnostico)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_matriz_legal',
    label: 'Hito 1 · Matriz Legal y Normativa Vigente',
    shortLabel: 'H1: Matriz Legal',
    category: 'Hito 1: Organización',
    toolHint: 'Matriz Legal SG-SST (somos_sst: matriz_legal)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_politica_objetivos',
    label: 'Hito 1 · Política y Objetivos del SG-SST',
    shortLabel: 'H1: Política y Objetivos',
    category: 'Hito 1: Organización',
    toolHint: 'Política y Objetivos SG-SST (somos_sst: politica)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_dofa',
    label: 'Hito 1 · Contexto Organizacional y Matriz DOFA',
    shortLabel: 'H1: Contexto DOFA',
    category: 'Hito 1: Organización',
    toolHint: 'Contexto Organizacional DOFA (somos_sst: contexto)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'hito1_rit',
    label: 'Hito 1 · Reglamento Interno de Trabajo (RIT)',
    shortLabel: 'H1: Editor RIT',
    category: 'Hito 1: Organización',
    toolHint: 'Reglamento Interno de Trabajo (editor_rit / somos_sst: rit)',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  // Hito 2
  {
    id: 'hito2_matriz_ipevar',
    label: 'Hito 2 · Matriz de Peligros IPEVAR (GTC-45)',
    shortLabel: 'H2: Matriz GTC-45',
    category: 'Hito 2: Planificación',
    toolHint: 'Matriz de Peligros GTC-45 (matriz_ipevar)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'hito2_perfil_socio',
    label: 'Hito 2 · Perfil Sociodemográfico y Exámenes Médicos (EMO)',
    shortLabel: 'H2: Sociodemográfico y EMO',
    category: 'Hito 2: Planificación',
    toolHint: 'Perfil Sociodemográfico y Exámenes Médicos (somos_sst: alimentar_sociodemografico_masivo / actualizar_examen_medico)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'hito2_perfiles_cargo',
    label: 'Hito 2 · Perfiles de Cargo y Profesiograma',
    shortLabel: 'H2: Perfiles de Cargo',
    category: 'Hito 2: Planificación',
    toolHint: 'Perfiles de Cargo (somos_sst: cargos)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'hito2_cronograma',
    label: 'Hito 2 · Cronograma Anual y Plan de Trabajo Kanban',
    shortLabel: 'H2: Cronograma Kanban',
    category: 'Hito 2: Planificación',
    toolHint: 'Cronograma Anual SG-SST (somos_sst: kanban)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  // Hito 3
  {
    id: 'hito3_epp',
    label: 'Hito 3 · Matriz y Control de Entrega de EPP',
    shortLabel: 'H3: Matriz EPP',
    category: 'Hito 3: Gestión del Riesgo',
    toolHint: 'Matriz y Entregas de EPP (somos_sst: epp)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hito3_quimicos_sga',
    label: 'Hito 3 · Inventario y Compatibilidad Química SGA',
    shortLabel: 'H3: Químicos SGA',
    category: 'Hito 3: Gestión del Riesgo',
    toolHint: 'Matriz de Compatibilidad Química SGA (matriz_compatibilidad)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hito3_alturas',
    label: 'Hito 3 · Equipos y Permisos de Trabajo en Alturas (Res. 4272)',
    shortLabel: 'H3: Trabajo en Alturas',
    category: 'Hito 3: Gestión del Riesgo',
    toolHint: 'Equipos y Permisos de Trabajo en Alturas (somos_sst: alturas)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hito3_ats',
    label: 'Hito 3 · Análisis de Trabajo Seguro (ATS)',
    shortLabel: 'H3: ATS',
    category: 'Hito 3: Gestión del Riesgo',
    toolHint: 'Análisis de Trabajo Seguro ATS (somos_sst: ats)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hito3_owas',
    label: 'Hito 3 · Evaluación Ergonómica Método OWAS',
    shortLabel: 'H3: Ergonomía OWAS',
    category: 'Hito 3: Gestión del Riesgo',
    toolHint: 'Evaluación Ergonómica OWAS (somos_sst: owas)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hito3_estudio_puesto',
    label: 'Hito 3 · Estudio de Puesto de Trabajo (EPT)',
    shortLabel: 'H3: Estudio Puesto',
    category: 'Hito 3: Gestión del Riesgo',
    toolHint: 'Estudio de Puesto de Trabajo EPT (somos_sst: estudio_puesto)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hito3_matriz_pesv',
    label: 'Hito 3 · Plan Estratégico de Seguridad Vial (Matriz PESV)',
    shortLabel: 'H3: Matriz PESV',
    category: 'Hito 3: Gestión del Riesgo',
    toolHint: 'Matriz de Riesgos Viales PESV (matriz_pesv)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hito3_vehiculos',
    label: 'Hito 3 · Parque Automotor e Inspección Preoperacional',
    shortLabel: 'H3: Parque Automotor',
    category: 'Hito 3: Gestión del Riesgo',
    toolHint: 'Parque Automotor y Vehículos (somos_sst: vehiculos)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  // Hito 4, 5, 6, 7
  {
    id: 'hito4_comites',
    label: 'Hito 4 · Comités COPASST y Convivencia Laboral (CCL)',
    shortLabel: 'H4: Comités COPASST/CCL',
    category: 'Hitos 4-7: Cultura, Emergencias y Mejora',
    toolHint: 'Comités COPASST y CCL (somos_sst)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'hito4_actos_condiciones',
    label: 'Hito 4 · Buzón de Actos y Condiciones Inseguras',
    shortLabel: 'H4: Actos y Condiciones',
    category: 'Hitos 4-7: Cultura, Emergencias y Mejora',
    toolHint: 'Reporte de Actos y Condiciones Inseguras (somos_sst: actos)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'hito4_psicosocial',
    label: 'Hito 4 · Vigilancia de Riesgo Psicosocial y Batería',
    shortLabel: 'H4: Riesgo Psicosocial',
    category: 'Hitos 4-7: Cultura, Emergencias y Mejora',
    toolHint: 'Programa de Vigilancia Psicosocial (consultar_analitica_psicosocial)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'hito5_capacitaciones',
    label: 'Hito 5 · Programa Anual de Capacitaciones e Inducción',
    shortLabel: 'H5: Capacitaciones',
    category: 'Hitos 4-7: Cultura, Emergencias y Mejora',
    toolHint: 'Programa Anual de Capacitaciones (somos_sst: capacitaciones)',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'hito6_vulnerabilidad',
    label: 'Hito 6 · Análisis de Vulnerabilidad y Plan de Emergencias',
    shortLabel: 'H6: Vulnerabilidad y Emergencias',
    category: 'Hitos 4-7: Cultura, Emergencias y Mejora',
    toolHint: 'Análisis de Vulnerabilidad y Plan de Emergencias (somos_sst: vulnerabilidad)',
    badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  {
    id: 'hito7_investigacion_atel',
    label: 'Hito 7 · Investigación de Accidentes e Incidentes (ATEL)',
    shortLabel: 'H7: Investigación ATEL',
    category: 'Hitos 4-7: Cultura, Emergencias y Mejora',
    toolHint: 'Investigación de Accidentes ATEL (somos_sst: registrar_accidente_atel)',
    badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800',
  },
  {
    id: 'hito7_auditoria',
    label: 'Hito 7 · Auditoría Anual del SG-SST',
    shortLabel: 'H7: Auditoría Anual',
    category: 'Hitos 4-7: Cultura, Emergencias y Mejora',
    toolHint: 'Auditoría Anual SG-SST (somos_sst: auditoria)',
    badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800',
  },
  {
    id: 'hito7_acpm',
    label: 'Hito 7 · Centro de Control ACPM (Acciones Correctivas/Preventivas)',
    shortLabel: 'H7: Plan de Acción ACPM',
    category: 'Hitos 4-7: Cultura, Emergencias y Mejora',
    toolHint: 'Centro de Control ACPM (somos_sst: crear_actividad_acpm)',
    badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800',
  },
  {
    id: 'hito7_alta_direccion',
    label: 'Hito 7 · Revisión por la Alta Dirección y Rendición de Cuentas',
    shortLabel: 'H7: Alta Dirección',
    category: 'Hitos 4-7: Cultura, Emergencias y Mejora',
    toolHint: 'Revisión por la Alta Dirección (somos_sst)',
    badgeColor: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800',
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
          : id;
  return (
    TRIGGER_NODES.find((n) => n.id === normId) ||
    EXTRACTOR_NODES.find((n) => n.id === normId) ||
    MEMORY_NODES.find((n) => n.id === normId) ||
    INPUT_CONNECTOR_NODES.find((n) => n.id === normId) ||
    HITO_APP_NODES.find((n) => n.id === normId) ||
    OUTPUT_ACTION_NODES.find((n) => n.id === normId)
  );
}

/**
 * Campos rápidos seleccionables con 1 clic al pulsar sobre cualquier nodo del lienzo (estilo editor de propiedades de nodo).
 */
export function getPresetFieldsForNode(nodeId: string, shape?: string): string[] {
  if (
    nodeId.includes('trabajadores') ||
    nodeId.includes('sociodemografico') ||
    nodeId.includes('perfiles_cargo')
  ) {
    return [
      'Nombre Completo',
      'Cédula / Documento',
      'Edad',
      'Cargo / Puesto',
      'ARL / EPS / AFP',
      'Sede / Área',
      'Vencimiento Examen Médico',
      'Restricciones Médicas',
      'Correo y Teléfono',
    ];
  }
  if (nodeId.includes('gmail') || nodeId.includes('email')) {
    return [
      'Asunto del Correo',
      'Remitente',
      'Cuerpo del Mensaje',
      'Archivos Adjuntos (PDF/Excel)',
      'Solo Correos No Leídos',
      'Fecha de Recepción',
    ];
  }
  if (nodeId.includes('drive') || nodeId.includes('onedrive') || nodeId.includes('local_folder')) {
    return [
      'Nombre del Archivo',
      'Hojas de Cálculo (.xlsx / CSV)',
      'Documentos PDF / Word',
      'Soportes y Cédulas',
      'Fecha de Modificación',
      'Contenido de Texto Extraído',
    ];
  }
  if (nodeId.includes('empresa')) {
    return [
      'Razón Social y NIT',
      'Código CIIU y Actividad Económica',
      'Nivel de Riesgo ARL (I a V)',
      'Total de Trabajadores',
      'Sedes y Centros de Trabajo',
      'Responsable del SG-SST',
    ];
  }
  if (nodeId.includes('comites') || nodeId.includes('copasst')) {
    return [
      'Generar Acta de Reunión COPASST / CCL',
      'Compromisos y Responsables',
      'Verificación de Quórum',
      'Seguimiento de Actas Anteriores',
    ];
  }
  if (shape === 'square_hito' || nodeId.startsWith('hito') || nodeId.includes('matriz')) {
    return [
      'Consultar Brechas y Pendientes',
      'Crear Nuevos Registros',
      'Actualizar Estado de Cumplimiento',
      'Generar Plan de Acción',
      'Calcular % de Avance',
    ];
  }
  if (shape === 'circle_memory' || nodeId.startsWith('wappy_memory') || nodeId.startsWith('wappy_rag')) {
    return [
      'Datos de Empresa Activa (NIT, CIIU, Riesgo)',
      'Evitar Duplicar Registros Previos',
      'Cruzar con Decreto 1072 y Res. 0312',
      'Consultar Protocolos en NotebookLM',
    ];
  }
  return [
    'Resumen Ejecutivo',
    'Tabla Detallada de Hallazgos',
    'Alertas Críticas / Vencimientos',
    'Recomendaciones Normativas SST',
  ];
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
    .map((eid) => EXTRACTOR_NODES.find((e) => e.id === eid))
    .filter(Boolean) as WorkflowNodeDef[];
  const memoryIds = normalizeMemoriesList(nodes);
  const memoryDefs = memoryIds
    .map((mid) => MEMORY_NODES.find((m) => m.id === mid))
    .filter(Boolean) as WorkflowNodeDef[];
  const engineMode = nodes.aiEngine || 'wappy';
  const modelId = nodes.aiModel || 'gemini-3.6-flash';
  const inputDefs = (nodes.inputs || [])
    .map((id) => INPUT_CONNECTOR_NODES.find((n) => n.id === id))
    .filter(Boolean) as WorkflowNodeDef[];
  const hitoDefs = (nodes.hitos || [])
    .map((id) => HITO_APP_NODES.find((n) => n.id === id))
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
      parts.push(`Campos requeridos: [${cfg.fields.join(', ')}]`);
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

  const customEdges = nodes.canvasLayout?.edges || [];
  if (customEdges.length > 0) {
    const resolveKeyLabel = (key: string): string => {
      if (key === 'agent_root') return `Agente IA Principal (${agentName || 'Consultor SG-SST'})`;
      if (key === 'if_router') return 'Condición Si/No (Hallazgos/Alerta)';
      if (key === 'trigger_root') return triggerDefs[0]?.shortLabel || 'Disparador Principal';
      const extraAg = extraAgents.find((a) => a.key === key);
      if (extraAg) return `Agente IA (${extraAg.agentName || 'Segunda IA'})`;
      const cleanedId = key
        .replace(/^(trigger_|ext_|hito_|out_|tool_inputs_|tool_hitos_|sub_memory_)/, '');
      const def = getNodeDefById(cleanedId);
      return def ? def.shortLabel : cleanedId;
    };
    const routeStrings = customEdges.map(
      (ed) => `[${resolveKeyLabel(ed.from)}] ──▶ [${resolveKeyLabel(ed.to)}]`,
    );
    lines.push(
      `\n7. SECUENCIA E INTERCONEXIONES PERSONALIZADAS DEL LIENZO: Respeta estrictamente este orden de conexión definido en el campo: ${routeStrings.join(' ; ')}.`,
    );
  }

  return lines.join('');
}
