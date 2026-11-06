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

export interface WorkflowNodesConfig {
  trigger: string;
  triggers?: string[];
  aiEngine?: 'wappy' | 'antigravity';
  aiModel?: string;
  memoryNode?: string;
  includeIfNode?: boolean;
  inputs: string[];
  hitos: string[];
  outputs: string[];
  canvasLayout?: {
    positions?: Record<string, CanvasNodePosition>;
    edges?: CanvasWireEdge[];
  } | null;
}

export interface AiEngineModelDef {
  id: string;
  engine: 'wappy' | 'antigravity';
  model: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  description: string;
}

/**
 * Modelos verificados en .env (GOOGLE_MODELS=gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.8-flash)
 * + Motor Google Antigravity IDE con Servidor MCP WAPPY (110+ tools).
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
    label: 'Google Antigravity IDE + MCP WAPPY (110+ Tools)',
    shortLabel: 'Antigravity + MCP',
    subtitle: 'Puente Push SSE + MCP Directo',
    description: 'Delega el procesamiento al cerebro de Google Antigravity conectado por Push SSE con las 110+ herramientas MCP.',
  },
];

export const MEMORY_NODES: WorkflowNodeDef[] = [
  {
    id: 'wappy_memory_company',
    label: 'Memoria Procedural + Contexto Empresa Somos SST',
    shortLabel: 'Memoria + Empresa',
    category: 'memory',
    toolHint: 'Memoria Procedural WAPPY + Contexto en vivo de la Empresa Activa (Somos SST)',
    badgeColor: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  },
  {
    id: 'wappy_rag_documental',
    label: 'Buffer RAG Documental & Historial SG-SST',
    shortLabel: 'RAG Documental',
    category: 'memory',
    toolHint: 'Motor RAG Documental + Historial de hallazgos previos de la empresa',
    badgeColor: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  },
];

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
    label: 'Google Antigravity (Puente MCP / PC)',
    shortLabel: 'Antigravity',
    category: 'trigger',
    badge: 'Orden MCP / PC',
    description: 'Google Antigravity dispara esta tarea desde tu PC o mediante herramientas MCP.',
    toolHint: 'Disparo desde Google Antigravity IDE / Servidor MCP WAPPY',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800',
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
    label: 'Google Antigravity (Puente PC)',
    shortLabel: 'Antigravity',
    category: 'IA, MCP & Web',
    toolHint: 'google_antigravity (puente reactivo con el PC)',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
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
    id: 'somos_sst_update',
    label: 'Alimentar / Actualizar Aplicativo en Somos SST',
    shortLabel: 'Actualizar Somos SST',
    category: 'output',
    toolHint: 'Actualiza directamente los registros reales en el aplicativo de Somos SST correspondiente',
    badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'acpm_task',
    label: 'Crear Acción Correctiva / Preventiva en ACPM',
    shortLabel: 'Crear Tarea ACPM',
    category: 'output',
    toolHint: 'Registra automáticamente hallazgos o alertas pendientes en el Centro de Control ACPM (crear_actividad_acpm)',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'email_report',
    label: 'Enviar Informe Ejecutivo por Correo Electrónico',
    shortLabel: 'Enviar Email',
    category: 'output',
    toolHint: 'Entrega un informe ejecutivo estructurado en Markdown con tablas para despacho por correo electrónico',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'google_docs',
    label: 'Crear / Actualizar Informe en Google Docs',
    shortLabel: 'Exportar Google Docs',
    category: 'output',
    toolHint: 'Crea un documento formal en Google Docs (google_docs) si la cuenta está vinculada',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    id: 'google_sheets',
    label: 'Registrar Filas en Google Sheets',
    shortLabel: 'Exportar Google Sheets',
    category: 'output',
    toolHint: 'Añade o actualiza filas de control en Google Sheets (google_sheets)',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'google_slides',
    label: 'Generar Presentación en Google Slides',
    shortLabel: 'Crear Google Slides',
    category: 'output',
    toolHint: 'Estructura diapositivas ejecutivas en Google Slides (google_slides)',
    badgeColor: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
  {
    id: 'google_calendar',
    label: 'Agendar Recordatorio / Auditoría en Google Calendar',
    shortLabel: 'Agendar Calendar',
    category: 'output',
    toolHint: 'Programa el evento o fecha límite de seguimiento en Google Calendar (google_calendar)',
    badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  {
    id: 'canvas_doc',
    label: 'Consolidar Dictamen Técnico con Tablas y Tarjetas WAPPY',
    shortLabel: 'Dictamen Ejecutivo',
    category: 'output',
    toolHint: 'Presenta tablas comparativas en Markdown y resumen ejecutivo wappy-card',
    badgeColor: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
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
    MEMORY_NODES.find((n) => n.id === normId) ||
    INPUT_CONNECTOR_NODES.find((n) => n.id === normId) ||
    HITO_APP_NODES.find((n) => n.id === normId) ||
    OUTPUT_ACTION_NODES.find((n) => n.id === normId)
  );
}

/**
 * Autogenera un prompt técnico estructurado para WAPPY a partir de los nodos conectados en el lienzo.
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

  const lines: string[] = [];
  lines.push(
    `Actúa como ${agentName || 'Consultor SG-SST'} ejecutando el flujo automatizado "${taskName || 'Flujo Autónomo SG-SST'}" exclusivamente para la empresa activa.`,
  );

  if (engineMode === 'antigravity') {
    lines.push(
      `\n0. MOTOR IA Y ORQUESTACIÓN (NODO CHAT MODEL): Ejecuta este flujo apoyándote en Google Antigravity IDE + Servidor MCP WAPPY (herramienta google_antigravity por puente Push SSE) y el modelo ${modelId}.`,
    );
  } else {
    lines.push(
      `\n0. MOTOR IA Y ORQUESTACIÓN (NODO CHAT MODEL): Ejecuta este flujo en WAPPY Cloud IA (Rotación Automática de Claves) utilizando el modelo ${modelId}.`,
    );
  }

  if (triggerDefs.length > 0) {
    lines.push(
      `\n1. DISPARADORES / MEDIOS DE ENTRADA ACTIVOS: ${triggerDefs.map((t) => `${t.shortLabel} (${t.toolHint})`).join(' + ')}.`,
    );
  }

  if (inputDefs.length > 0) {
    lines.push(
      `\n2. SUB-NODOS DE HERRAMIENTAS Y CONECTORES: Utiliza las herramientas ${inputDefs.map((d) => d.toolHint).join(', ')}. Si alguna fuente externa (como Google Drive) no está vinculada o no tiene archivos nuevos reales, infórmalo con transparencia sin inventar ni simular datos.`,
    );
  }

  if (hitoDefs.length > 0) {
    lines.push(
      `\n3. HITOS Y APLICATIVOS DE SOMOS SST CONECTADOS: Cruza, audita o alimenta la información en: ${hitoDefs.map((h) => h.toolHint).join('; ')}.`,
    );
  }

  if (outputDefs.length > 0) {
    lines.push(
      `\n4. NODOS DE CONDICIÓN (IF) Y ACCIONES DE SALIDA: Evalúa si existen hallazgos/novedades (rama TRUE) o si todo está en regla (rama FALSE) y ejecuta: ${outputDefs.map((o) => o.toolHint).join('. ')}. No crees nuevas tareas programadas durante esta corrida.`,
    );
  } else {
    lines.push(
      `\n4. ENTREGABLE: Genera un informe ejecutivo claro en Markdown con los hallazgos reales procesados.`,
    );
  }

  return lines.join('');
}
