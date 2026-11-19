const { z } = require('zod');
const { Tool } = require('@langchain/core/tools');
const mongoose = require('mongoose');
const Automation = require('~/models/Automation');
const AutomationLog = require('~/models/AutomationLog');
const CompanyInfo = require('~/models/CompanyInfo');

let cachedWorkflowNodesDocsService = null;
function resolveWorkflowNodesDocsService() {
  if (cachedWorkflowNodesDocsService) {
    return cachedWorkflowNodesDocsService;
  }
  try {
    const mod = require('~/server/services/workflowNodesDocumentationService');
    if (mod && typeof mod.queryWorkflowNodesDocs === 'function') {
      cachedWorkflowNodesDocsService = mod;
      return cachedWorkflowNodesDocsService;
    }
  } catch (_) {
    try {
      const modRel = require('../../../../server/services/workflowNodesDocumentationService');
      if (modRel && typeof modRel.queryWorkflowNodesDocs === 'function') {
        cachedWorkflowNodesDocsService = modRel;
        return cachedWorkflowNodesDocsService;
      }
    } catch (_relErr) {}
  }
  return null;
}

const ALLOWED_WORKFLOW_AI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];

const BLOCKED_CONSTRUCTION_NODE_IDS = new Set([
  'scraper_agy_pensiones_directo',
  'scraper_agy_salud_rethus',
  'extract_onedrive',
  'trigger_whatsapp',
  'one_drive',
]);

const VALID_WORKFLOW_TRIGGERS = new Set([
  'schedule_cron',
  'trigger_tenshi',
  'trigger_antigravity',
  'trigger_antigravity_cloud',
  'trigger_email',
  'trigger_email_in',
  'trigger_agent',
  'trigger_qr_worker',
  'trigger_webhook',
]);

const VALID_WORKFLOW_HITOS = new Set([
  'hito1_dofa',
  'hito1_diagnostico_0312',
  'hito1_responsable',
  'hito1_politica_objetivos',
  'hito1_objetivos',
  'hito1_matriz_legal',
  'hito1_rhs',
  'hito1_rit',
  'hito1_participacion_ipevar',
  'hito1_oportunidades_sst',
  'hito1_plan_emergencias',
  'hito2_matriz_ipevar',
  'hito2_perfiles_cargo',
  'hito2_perfil_socio',
  'hito2_condiciones_salud',
  'hito2_oraculo_predictivo',
  'hito3_matriz_pesv',
  'hito3_quimicos_sga',
  'hito3_cocolab',
  'hito3_comite_pesv',
  'hito3_brigada_emergencias',
  'hito3_owas',
  'hito3_estudio_puesto',
  'hito3_ats',
  'hito3_alturas',
  'hito3_epp',
  'hito3_vehiculos',
  'hito4_comites',
  'hito4_bio_ipevar',
  'hito4_psicosocial',
  'hito4_actos_condiciones',
  'hito5_compras_sst',
  'hito5_contratistas',
  'hito5_gestion_cambio',
  'hito5_equipos_alturas',
  'hito5_registro_quimico',
  'hito5_equipos_emergencia',
  'hito5_capacitaciones',
  'hito6_vulnerabilidad',
  'hito6_comunicaciones_sst',
  'hito6_ruta_aprendizaje',
  'hito6_simulacros_emergencia',
  'hito6_app_builder',
  'hito7_estadisticas_atel',
  'hito7_investigacion_atel',
  'hito7_acpm',
  'hito7_auditoria',
  'hito7_alta_direccion',
  'hito7_investigacion_profunda',
  'hito8_predictivo',
]);

const VALID_WORKFLOW_EXTRACTORS = new Set([
  'extract_gmail',
  'extract_drive',
  'extract_pc_folder',
  'extract_ai_doc_ocr',
  'extract_sst_workers',
  'extract_sst_app',
  'extract_web_scraping_agy',
  'scraper_agy_alto_riesgo',
  'scraper_agy_arl_directo',
  'scraper_agy_vial_pesv',
  'scraper_agy_antecedentes',
  'forensic_doc_verifier',
  'extract_web_search',
]);

const VALID_WORKFLOW_TOOLS = new Set([
  'somos_sst_empresa',
  'somos_sst_trabajadores',
  'somos_sst_perfiles_cargo',
  'somos_sst_epp',
  'somos_sst_examenes',
  'matriz_ipevar',
  'matriz_pesv',
  'matriz_compatibilidad',
  'consultar_analitica_psicosocial',
  'consultar_analitica_actos_condiciones',
  'canvas_doc',
  'cursos_lms',
  'google_drive',
  'google_sheets',
  'google_docs',
  'google_slides',
  'google_gmail',
  'google_calendar',
  'notebooklm',
  'google_flow',
  'web_search',
  'pronostico_clima_sst',
  'consultar_pubchem_quimico',
  'consultar_medlineplus_rehabilitacion',
  'buscar_centros_emergencia',
  'webhook_api',
  'google_antigravity',
  'google_antigravity_cloud',
  'tool_web_scraping_agy',
  'extract_web_scraping_agy',
  'scraper_agy_arl_directo',
  'scraper_agy_alto_riesgo',
  'scraper_agy_vial_pesv',
  'scraper_agy_antecedentes',
  'forensic_doc_verifier',
]);

const VALID_WORKFLOW_OUTPUTS = new Set([
  'email_report',
  'wappy_notification',
  'antigravity_local_report',
  'antigravity_cloud_report',
  'somos_sst_update',
  'acpm_task',
  'canvas_doc',
  'google_docs',
  'google_sheets',
  'google_calendar',
  'google_slides',
]);

function resolveSystemWorkflowPresetsCatalog() {
  try {
    const mod = require('~/server/services/systemWorkflowPresetsCatalog');
    if (Array.isArray(mod?.SYSTEM_WORKFLOW_PRESETS_CATALOG)) {
      return mod.SYSTEM_WORKFLOW_PRESETS_CATALOG;
    }
  } catch (_) {
    try {
      const modRel = require('../../../../server/services/systemWorkflowPresetsCatalog');
      if (Array.isArray(modRel?.SYSTEM_WORKFLOW_PRESETS_CATALOG)) {
        return modRel.SYSTEM_WORKFLOW_PRESETS_CATALOG;
      }
    } catch (_relErr) {}
  }
  return [];
}

class GestorAutomatizaciones extends Tool {
  constructor(fields = {}) {
    super();
    this.name = 'gestor_automatizaciones';
    this.description =
      'Permite al agente diseñar y crear flujos DAG completos en /tareas (accion="crear", propios de empresa o Flujo Global Tenshi si es admin), ejecutar Flujos Tenshi internos al instante (accion="ejecutar_tenshi"), consultar la Enciclopedia SmartDown oficial de Nodos de Flujo de /tareas (accion="consultar_documentacion_nodos"), y listar, consultar, actualizar, activar/clonar presets oficiales, pausar, ejecutar de inmediato o eliminar TAREAS/FLUJOS en WAPPY (/tareas; historial en /tareas?tab=historial).';
    this.req = fields.req;
    this.schema = z.object({
      accion: z.string().describe('Acción a realizar: "ejecutar_tenshi", "consultar_documentacion_nodos", "crear", "listar", "actualizar", "activar", "desactivar", "pausar", "activar_todas", "desactivar_todas", "eliminar", "eliminar_todas", "ejecutar_ahora", "detener" o "ver_logs".'),
      busqueda_nodo: z.string().optional().describe('Nombre, ID técnico, categoría, Hito o palabra clave del nodo o grupo de nodos a consultar en la Enciclopedia SmartDown (ej. "forense incapacidad", "condicion si no", "alturas", "rethus", "disparadores", "todos").'),
      nombre: z.string().optional().describe('Nombre exacto o palabras clave temáticas de la tarea/automatización o flujo Tenshi (para crearla o buscarla por su título real sin inventar códigos).'),
      nuevo_nombre: z.string().optional().describe('Nuevo nombre si deseas renombrar una tarea/automatización existente.'),
      agente_objetivo: z.string().optional().describe('Nombre o ID del agente que ejecutará la tarea (ej. "Consultor SG-SST", "Médico Laboral", "Auditor SG-SST" o "yo" para el agente actual). Si no se especifica, se asigna al agente actual o al Consultor SG-SST.'),
      prompt_a_ejecutar: z.string().optional().describe('Instrucción o prompt detallado y completo que el agente ejecutará en segundo plano cada vez que se dispare la tarea. OBLIGATORIO si accion="crear".'),
      tipo_frecuencia: z.enum(['daily', 'weekly', 'monthly', 'hourly']).default('daily').optional().describe('Tipo de periodicidad: "daily" (diario), "weekly" (semanal), "monthly" (mensual) o "hourly" (cada X horas).'),
      configuracion_horario: z.object({
        hora: z.number().min(0).max(23).default(8).optional().describe('Hora del día (0-23) en hora colombiana (UTC-5). Por defecto 8 (8:00 AM).'),
        minuto: z.number().min(0).max(59).default(0).optional().describe('Minuto (0-59). Por defecto 0.'),
        dias_semana: z.array(z.number().min(0).max(6)).default([1]).optional().describe('Arreglo de días de la semana si tipo_frecuencia="weekly" (0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado). Ej: [1] para todos los lunes, o [1, 3, 5] para lunes, miércoles y viernes.'),
        dia_mes: z.number().min(1).max(31).default(1).optional().describe('Día del mes (1-31) si tipo_frecuencia="monthly".'),
        intervalo_horas: z.number().min(1).default(1).optional().describe('Intervalo en horas si tipo_frecuencia="hourly".')
      }).optional().describe('Configuración específica del horario de ejecución.'),
      correos_notificacion: z.array(z.string()).optional().describe('Lista de correos electrónicos a los que se enviará automáticamente el informe o resultado de la ejecución.'),
      automatizacion_id: z.string().optional().describe('ID de 24 caracteres, nombre/título temático exacto de la tarea en pantalla, o "todas" solo si el usuario pidió explícitamente operar sobre todas.'),
      nuevo_estado: z.string().optional().describe('Nuevo estado deseado: "active" (activada) o "inactive" (pausada/desactivada).'),
      instruccion_usuario: z.string().optional().describe('Instrucción literal, pregunta o parámetro dicho por el usuario para alimentar el flujo al ejecutarlo'),
      esperar_resultado: z.boolean().optional().describe('Si es true (por defecto en ejecutar_tenshi), espera de forma síncrona el resultado final del flujo para responder al instante en el mismo turno'),
      disparadores: z.array(z.string()).optional().describe('Lista de disparadores del flujo DAG (ej. ["trigger_tenshi", "schedule_cron"]). SIEMPRE se incluye "trigger_tenshi" por defecto.'),
      comando_tenshi: z.string().optional().describe('Frase o comando de voz/chat en Tenshi que dispara el flujo. Por defecto es el nombre limpio del flujo.'),
      hitos_fuente: z.array(z.string()).optional().describe('IDs reales de Aplicativos Hito de Somos SST en modo lectura de fuente (ej. ["hito2_perfil_socio"], ["hito3_vehiculos"], ["hito5_capacitaciones"], ["hito7_acpm"], ["hito3_epp"], ["hito4_actos_condiciones"], ["hito4_comites"], ["hito1_diagnostico_0312"], ["hito5_registro_quimico"]).'),
      herramientas_ia: z.array(z.string()).optional().describe('IDs válidos de herramientas conectadas al Agente IA en Herramienta + (ej. ["web_search", "cursos_lms", "matriz_pesv", "matriz_compatibilidad", "consultar_pubchem_quimico", "consultar_medlineplus_rehabilitacion", "notebooklm", "google_flow", "hito2_condiciones_salud", "hito2_perfiles_cargo"]).'),
      extractores: z.array(z.string()).optional().describe('IDs válidos de extractores documentales u OSINT (ej. ["extract_drive", "extract_gmail", "extract_ai_doc_ocr", "extract_pc_folder", "scraper_agy_arl_directo", "scraper_agy_alto_riesgo", "scraper_agy_vial_pesv", "scraper_agy_antecedentes"]).'),
      salidas: z.array(z.string()).optional().describe('IDs de nodos de salida/acción del flujo (ej. ["email_report", "wappy_notification", "acpm_task", "canvas_doc", "google_calendar"]). Por defecto incluye "wappy_notification" y, si hay correos o se solicita envío por correo, "email_report".'),
      incluir_condicion_if: z.boolean().optional().describe('Si es true (por defecto), incluye nodo condicional Sí/No (if_router) en el lienzo DAG.'),
      condicion_if: z.string().optional().describe('Etiqueta clara del criterio condicional Sí/No (ej. "¿Existen vencimientos o novedades críticas?").'),
      modelo_ia: z.string().optional().describe('Modelo de IA del Agente en el flujo (solo modelos válidos de .env: "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.8-flash"; por defecto "gemini-3.5-flash-lite").'),
      crear_como_flujo_tenshi: z.boolean().optional().describe('Si es true y el usuario es ADMIN, crea un Flujo Global Tenshi en TENSHI_GLOBAL activo para todos los usuarios; si no es admin, crea un flujo propio de su empresa con trigger_tenshi activo.'),
    });
  }

  _normStr(s = '') {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _isObjectId(val) {
    if (!val) return false;
    const str = String(val).trim();
    return /^[0-9a-fA-F]{24}$/.test(str) && mongoose.Types.ObjectId.isValid(str);
  }

  _normalizeActionAndStatus(rawAccion = '', rawEstado) {
    const act = this._normStr(rawAccion).replace(/\s+/g, '_');
    let accion = act;
    let forcedStatus = undefined;
    let forcedAll = false;

    if (['ejecutar_tenshi', 'tenshi', 'flujo_tenshi', 'run_tenshi'].includes(act)) {
      accion = 'ejecutar_tenshi';
    } else if (
      [
        'consultar_documentacion_nodos',
        'documentacion_nodos',
        'manual_nodos',
        'guia_nodos',
        'guia_de_nodos',
        'manual_de_nodos',
        'nodos',
        'explicar_nodo',
        'explicar_nodos',
        'catalogo_nodos',
        'catalogo_de_nodos',
        'enciclopedia_nodos',
        'consultar_nodos',
        'consultar_nodo',
      ].includes(act)
    ) {
      accion = 'consultar_documentacion_nodos';
    } else if (['crear', 'create', 'programar', 'nueva', 'agregar', 'anadir'].includes(act)) {
      accion = 'crear';
    } else if (['listar', 'list', 'consultar', 'ver', 'mostrar'].includes(act)) {
      accion = 'listar';
    } else if (['activar_todas', 'activar_todos', 'enable_all', 'encender_todas'].includes(act)) {
      accion = 'actualizar';
      forcedStatus = 'active';
      forcedAll = true;
    } else if (['desactivar_todas', 'desactivar_todos', 'pausar_todas', 'pausar_todos', 'inactivar_todas', 'disable_all', 'apagar_todas'].includes(act)) {
      accion = 'actualizar';
      forcedStatus = 'inactive';
      forcedAll = true;
    } else if (['eliminar_todas', 'eliminar_todos', 'borrar_todas', 'borrar_todos', 'delete_all'].includes(act)) {
      accion = 'eliminar';
      forcedAll = true;
    } else if (['activar', 'reactivar', 'enable', 'encender', 'prender'].includes(act)) {
      accion = 'actualizar';
      forcedStatus = 'active';
    } else if (['desactivar', 'pausar', 'inactivar', 'disable', 'pause', 'apagar'].includes(act)) {
      accion = 'actualizar';
      forcedStatus = 'inactive';
    } else if (['actualizar', 'editar', 'modificar', 'update', 'edit', 'cambiar'].includes(act)) {
      accion = 'actualizar';
    } else if (['eliminar', 'borrar', 'delete', 'remove', 'quitar'].includes(act)) {
      accion = 'eliminar';
    } else if (['ejecutar_ahora', 'ejecutar', 'correr', 'run', 'run_now', 'disparar'].includes(act)) {
      accion = 'ejecutar_ahora';
    } else if (['detener', 'parar', 'stop'].includes(act)) {
      accion = 'detener';
    } else if (['ver_logs', 'logs', 'historial', 'ver_historial'].includes(act)) {
      accion = 'ver_logs';
    }

    let nuevo_estado = forcedStatus;
    if (rawEstado !== undefined && rawEstado !== null && String(rawEstado).trim() !== '') {
      const est = this._normStr(rawEstado);
      if (['active', 'activa', 'activo', 'activar', 'activada', 'activado', 'on', 'true', 'enabled', 'habilitada', 'habilitado'].includes(est)) {
        nuevo_estado = 'active';
      } else if (['inactive', 'inactiva', 'inactivo', 'pausada', 'pausado', 'pausar', 'desactivar', 'desactivada', 'desactivado', 'off', 'false', 'disabled', 'inhabilitada'].includes(est)) {
        nuevo_estado = 'inactive';
      }
    }

    return { accion, nuevo_estado, forcedAll };
  }

  _cleanFlowDisplayName(rawName = '') {
    const cleaned = String(rawName || '')
      .replace(/^(?:[\p{Extended_Pictographic}\u2600-\u27BF\uFE0F\u200D\u20E3\s])+/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || String(rawName || '').trim();
  }

  _emitTenshiFlowEvent(eventName, payload = {}, explicitUserId = null) {
    try {
      const callerUserId = explicitUserId || this.req?.user?.id || this.req?.user?._id;
      if (!callerUserId || !eventName) {
        return 0;
      }
      let mcpBridge = null;
      try {
        mcpBridge = require('~/server/routes/mcpBridge');
      } catch (_) {
        try {
          mcpBridge = require('../../../../server/routes/mcpBridge');
        } catch (_relErr) {}
      }
      if (!mcpBridge || typeof mcpBridge.broadcastAntigravityEvent !== 'function') {
        return 0;
      }
      return mcpBridge.broadcastAntigravityEvent(String(callerUserId), eventName, payload);
    } catch (_) {
      return 0;
    }
  }

  _dispatchCompanyAutomationWithEvents({
    runAutomation,
    automation,
    runOptions,
    indicaciones = '',
    empresa = '',
    logErrorLabel = 'Error en ejecución manual background',
  }) {
    const runId =
      this.req?.__tenshiFlowRunId ||
      `tflow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const cleanFlowName = this._cleanFlowDisplayName(automation?.name || 'Flujo empresarial');
    const cleanIndicaciones = String(indicaciones || cleanFlowName || 'Ejecución de flujo')
      .trim()
      .slice(0, 260);
    const channel = this.req?.isVoiceSession ? 'voice' : 'chat';
    const callerUserId = this.req?.user?.id || this.req?.user?._id || null;
    const isVoiceManaged = Boolean(this.req?.__tenshiFlowVoiceManaged);
    const empresaName = String(empresa || '').trim();

    if (!this.req?.__tenshiFlowStartedEmitted) {
      this._emitTenshiFlowEvent(
        'tenshi_flow_started',
        {
          runId,
          flowName: cleanFlowName,
          indicaciones: cleanIndicaciones,
          empresa: empresaName,
          origenFlujo: 'flujo_propio_empresa',
          channel,
          startedAt: new Date().toISOString(),
        },
        callerUserId,
      );
    }

    Promise.resolve()
      .then(() => runAutomation(automation, runOptions))
      .then((runRes) => {
        if (!(isVoiceManaged || this.req?.__tenshiFlowVoiceManaged)) {
          const ok = runRes?.status
            ? !['failed', 'error', 'stopped'].includes(String(runRes.status))
            : true;
          const hasEvidences =
            Array.isArray(runRes?.evidenceFiles) && runRes.evidenceFiles.length > 0;
          this._emitTenshiFlowEvent(
            'tenshi_flow_completed',
            {
              runId,
              flowName: cleanFlowName,
              indicaciones: cleanIndicaciones,
              empresa: empresaName,
              origenFlujo: 'flujo_propio_empresa',
              success: ok,
              hasEvidences,
              channel,
              completedAt: new Date().toISOString(),
            },
            callerUserId,
          );
        }
      })
      .catch((err) => {
        console.error(`[GestorAutomatizaciones Tool] ${logErrorLabel}:`, err);
        if (!(isVoiceManaged || this.req?.__tenshiFlowVoiceManaged)) {
          this._emitTenshiFlowEvent(
            'tenshi_flow_completed',
            {
              runId,
              flowName: cleanFlowName,
              indicaciones: cleanIndicaciones,
              empresa: empresaName,
              origenFlujo: 'flujo_propio_empresa',
              success: false,
              hasEvidences: false,
              channel,
              completedAt: new Date().toISOString(),
            },
            callerUserId,
          );
        }
      });
  }

  _cleanFlowNameForVoiceCommand(rawName = '') {
    const cleaned = String(rawName || '')
      .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || String(rawName || '').trim();
  }

  _buildQueryCandidates(rawValues = []) {
    const out = [];
    const seen = new Set();
    const pushIfNew = (val) => {
      const s = String(val || '').trim();
      if (!s) return;
      const key = this._normStr(s);
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(s);
    };

    for (const raw of rawValues) {
      const trimmed = String(raw || '').trim();
      if (!trimmed) continue;
      pushIfNew(trimmed);

      // Si el usuario dijo "Surin, activa la automatización de vigilancia de exámenes médicos",
      // extraer también el núcleo temático sin el prefijo "automatización/flujo/tarea de".
      const strippedLead = trimmed
        .replace(
          /^(?:(?:suri[n]?|siri|sur|tenshi|wappy|por\s+favor|oye|ey)[,\s]+)*/i,
          '',
        )
        .replace(
          /^(?:(?:activar|activa|activame|actívame|desactivar|desactiva|pausar|pausa|encender|enciende|ejecutar|ejecuta|correr|corre|iniciar|inicia|disparar|dispara|detener|deten|detén|eliminar|elimina|borrar|borra)\s+)?(?:(?:el|la|los|las|un|una|mi|mis|este|esta|ese|esa)\s+)?(?:(?:automatizaci[oó]n|tarea|flujo|robot)\s+)?(?:(?:de|del)\s+)?/i,
          '',
        )
        .trim();
      if (strippedLead && strippedLead.length >= 3) {
        pushIfNew(strippedLead);
      }
    }
    return out;
  }

  _sanitizeWorkflowAiModel(rawModel) {
    const clean = String(rawModel || '').trim().replace(/^models\//, '');
    return ALLOWED_WORKFLOW_AI_MODELS.includes(clean) ? clean : 'gemini-3.5-flash-lite';
  }

  _ensureTriggerTenshiVoiceConfig(workflowNodes, flowName, customVoiceCommand = '') {
    const wn = workflowNodes && typeof workflowNodes === 'object' ? workflowNodes : {};
    const cleanFlowName = this._cleanFlowNameForVoiceCommand(flowName);
    const primaryVoiceCommand = String(customVoiceCommand || '').trim() || cleanFlowName;

    const currentTriggers = Array.isArray(wn.triggers)
      ? wn.triggers.filter(Boolean)
      : wn.trigger
        ? [wn.trigger]
        : ['trigger_tenshi'];
    if (!currentTriggers.includes('trigger_tenshi')) {
      currentTriggers.push('trigger_tenshi');
    }
    wn.triggers = Array.from(new Set(currentTriggers));
    wn.trigger = wn.trigger || wn.triggers[0] || 'trigger_tenshi';

    if (!wn.canvasLayout || typeof wn.canvasLayout !== 'object') {
      wn.canvasLayout = { positions: {}, edges: [], logicNodes: [], nodeConfigs: {} };
    }
    if (!wn.canvasLayout.nodeConfigs || typeof wn.canvasLayout.nodeConfigs !== 'object') {
      wn.canvasLayout.nodeConfigs = {};
    }

    const existingDual = {
      ...(wn.canvasLayout.nodeConfigs.trigger_tenshi || {}),
      ...(wn.canvasLayout.nodeConfigs.trigger_trigger_tenshi || {}),
    };
    const existingVoiceList = [];
    if (existingDual.voiceCommand && String(existingDual.voiceCommand).trim()) {
      existingVoiceList.push(String(existingDual.voiceCommand).trim());
    }
    if (Array.isArray(existingDual.voiceCommands)) {
      for (const vc of existingDual.voiceCommands) {
        if (vc && String(vc).trim()) existingVoiceList.push(String(vc).trim());
      }
    }
    const uniqueVoiceCommands = Array.from(
      new Set([primaryVoiceCommand, cleanFlowName, ...existingVoiceList].filter(Boolean)),
    );

    const triggerCfg = {
      ...existingDual,
      voiceCommand: primaryVoiceCommand,
      voiceCommands: uniqueVoiceCommands,
      triggerChannel: existingDual.triggerChannel || 'both',
      customInstruction:
        existingDual.customInstruction ||
        `Disparador por voz o chat en Tenshi para "${cleanFlowName}".`,
    };
    wn.canvasLayout.nodeConfigs.trigger_trigger_tenshi = { ...triggerCfg };
    wn.canvasLayout.nodeConfigs.trigger_tenshi = { ...triggerCfg };

    return {
      workflowNodes: wn,
      cleanFlowName,
      primaryVoiceCommand,
      uniqueVoiceCommands,
    };
  }

  _buildWorkflowNodesForCreation({
    name,
    prompt,
    emails = [],
    disparadores,
    comando_tenshi,
    hitos_fuente,
    herramientas_ia,
    extractores,
    salidas,
    incluir_condicion_if,
    condicion_if,
    modelo_ia,
    isCreatingGlobalTenshi = false,
  }) {
    const cleanFlowName = this._cleanFlowNameForVoiceCommand(name);
    const primaryVoiceCommand = String(comando_tenshi || '').trim() || cleanFlowName;
    const normContext = this._normStr(`${cleanFlowName} ${prompt || ''}`);
    const aiModel = this._sanitizeWorkflowAiModel(modelo_ia);
    const includeIfNode = incluir_condicion_if !== false;

    // 1. Disparadores (SIEMPRE incluye 'trigger_tenshi')
    let triggers = [];
    if (Array.isArray(disparadores) && disparadores.length > 0) {
      triggers = disparadores
        .map((t) => String(t || '').trim())
        .filter((t) => VALID_WORKFLOW_TRIGGERS.has(t) && !BLOCKED_CONSTRUCTION_NODE_IDS.has(t));
    }
    if (triggers.length === 0) {
      triggers = isCreatingGlobalTenshi ? ['trigger_tenshi'] : ['schedule_cron', 'trigger_tenshi'];
    }
    if (!triggers.includes('trigger_tenshi')) {
      triggers.push('trigger_tenshi');
    }
    triggers = Array.from(new Set(triggers));

    // 2. Sanitizar listas explícitas suministradas por el modelo
    let sourceHitos = Array.isArray(hitos_fuente)
      ? hitos_fuente
          .map((h) => String(h || '').trim())
          .filter((h) => VALID_WORKFLOW_HITOS.has(h))
      : [];

    let agentToolHitos = [];
    let inputs = [];
    if (Array.isArray(herramientas_ia)) {
      for (const rawTool of herramientas_ia) {
        const t = String(rawTool || '').trim();
        if (!t || BLOCKED_CONSTRUCTION_NODE_IDS.has(t)) continue;
        if (VALID_WORKFLOW_HITOS.has(t)) {
          agentToolHitos.push(t);
        } else if (VALID_WORKFLOW_TOOLS.has(t)) {
          inputs.push(t);
        }
      }
    }

    let extractorsList = Array.isArray(extractores)
      ? extractores
          .map((e) => String(e || '').trim())
          .filter((e) => VALID_WORKFLOW_EXTRACTORS.has(e) && !BLOCKED_CONSTRUCTION_NODE_IDS.has(e))
      : [];

    // 3. Inferencia coherente de dominio si se omitieron hitos_fuente / herramientas / extractores
    // Regla estricta: JAMÁS mezclar dominios incompatibles (ej. clima con SOAT o EMO).
    let inferredIfLabel = '';
    let inferredCategory = 'general';
    const hasExplicitWeatherRequest =
      /\b(clima|climatic[oa]s?|lluvias?|tormentas?|meteorolog[a-z]*|pronostico\s+del\s+tiempo|temperatura\s+exterior)\b/.test(
        normContext,
      );

    if (sourceHitos.length === 0) {
      if (
        /\b(emo|examen(es)?\s+medic[oa]s?|condicion(es)?\s+de\s+salud|restriccion(es)?\s+medic[a-z]*|incapacidad(es)?|ausentismo|reintegros?|vigilancia\s+epidemiologic[a-z]*|salud\s+ocupacional)\b/.test(
          normContext,
        )
      ) {
        sourceHitos.push('hito2_perfil_socio');
        inferredCategory = 'salud_vencimientos';
        if (/\b(restriccion(es)?|recomendacion(es)?|condicion(es)?\s+de\s+salud|reintegros?)\b/.test(normContext)) {
          agentToolHitos.push('hito2_condiciones_salud');
        }
        if (/\b(incapacidad(es)?|ausentismo|rehabilitacion)\b/.test(normContext)) {
          inputs.push('consultar_medlineplus_rehabilitacion');
        }
        if (/\b(forense|falsedad|autenticidad|incapacidad(es)?)\b/.test(normContext)) {
          inputs.push('forensic_doc_verifier');
        }
        inferredIfLabel = '¿Existen exámenes médicos, restricciones o novedades de salud por atender?';
      } else if (
        /\b(alturas?|trabajo\s+en\s+alturas|espacios?\s+confinados?|arnes(es)?|linea(s)?\s+de\s+vida|equipos?\s+de\s+alturas|permiso(s)?\s+de\s+alturas|4272)\b/.test(
          normContext,
        )
      ) {
        sourceHitos.push('hito2_perfil_socio', 'hito5_equipos_alturas');
        inferredCategory = 'salud_vencimientos';
        if (/\b(permisos?|trabajo\s+seguro)\b/.test(normContext)) {
          agentToolHitos.push('hito3_alturas');
        }
        if (/\b(mintrabajo|sena|certificados?|portales?|verificar|verificacion)\b/.test(normContext)) {
          extractorsList.push('scraper_agy_alto_riesgo');
        }
        inferredIfLabel = '¿Existen certificados o equipos de trabajo en alturas vencidos o no conformes?';
      } else if (
        /\b(soat|tecnomecanic[a-z]*|vehicul[a-z]*|flotas?|pesv|conductor(es)?|licencia(s)?\s+de\s+conduc[a-z]*|simit|runt|comparendos?|multas?\s+vial(es)?|seguridad\s+vial)\b/.test(
          normContext,
        )
      ) {
        sourceHitos.push('hito3_vehiculos');
        inferredCategory = 'pesv_flota';
        if (/\b(pesv|riesgo\s+vial|matriz\s+pesv)\b/.test(normContext)) {
          inputs.push('matriz_pesv');
        }
        if (/\b(simit|runt|comparendos?|multas?)\b/.test(normContext)) {
          extractorsList.push('scraper_agy_vial_pesv');
        }
        inferredIfLabel = '¿Existen vehículos o conductores con documentos vencidos o hallazgos PESV?';
      } else if (/\b(epps?|proteccion\s+personal|dotacion(es)?|reposicion\s+de\s+epp)\b/.test(normContext)) {
        sourceHitos.push('hito3_epp');
        agentToolHitos.push('hito2_perfiles_cargo');
        inferredCategory = 'salud_vencimientos';
        inferredIfLabel = '¿Existen entregas de EPP vencidas o solicitudes de reposición pendientes?';
      } else if (
        /\b(capacitacion(es)?|induccion(es)?|reinduccion(es)?|formacion|entrenamientos?|curso(s)?\s+lms|ruta\s+de\s+aprendizaje)\b/.test(
          normContext,
        )
      ) {
        sourceHitos.push('hito5_capacitaciones');
        inputs.push('cursos_lms');
        inferredCategory = 'capacitacion_lms';
        inferredIfLabel = '¿Existen brechas de capacitación o cursos obligatorios pendientes?';
      } else if (
        /\b(acpm|accion(es)?\s+(correctivas?|preventivas?|de\s+mejora)|centro\s+de\s+control|0312|estandares?\s+minimos|diagnostico\s+0312|auditorias?\s+internas?|plan\s+de\s+mejoramiento)\b/.test(
          normContext,
        )
      ) {
        sourceHitos.push('hito1_diagnostico_0312', 'hito7_acpm');
        inferredCategory = 'auditoria_gerencia';
        inferredIfLabel = '¿Existen brechas 0312 o acciones ACPM abiertas o vencidas?';
      } else if (
        /\b(actos?\s+y?\s+condiciones|condicion(es)?\s+inseguras?|reporte(s)?\s+qr)\b/.test(normContext)
      ) {
        sourceHitos.push('hito4_actos_condiciones');
        agentToolHitos.push('hito2_matriz_ipevar');
        inferredCategory = 'atel_inspecciones';
        inferredIfLabel = '¿Existen reportes críticos o condiciones inseguras sin intervención?';
      } else if (/\b(gtc\s*45|ipevr|matriz\s+de\s+peligros|peligros?\s+y\s+riesgos)\b/.test(normContext)) {
        sourceHitos.push('hito2_matriz_ipevar');
        inputs.push('matriz_ipevar');
        inferredCategory = 'atel_inspecciones';
        inferredIfLabel = '¿Existen peligros no aceptables o controles pendientes en GTC 45?';
      } else if (
        /\b(copasst|comite(s)?|convivencia\s+laboral|cocolab|vigias?\s+sst|brigadas?\s+de\s+emergencias?)\b/.test(
          normContext,
        )
      ) {
        sourceHitos.push('hito4_comites');
        if (/\b(convivencia|cocolab)\b/.test(normContext)) {
          sourceHitos.push('hito3_cocolab');
        }
        inferredCategory = 'legal_comites';
        inferredIfLabel = '¿Existen actas, reuniones o compromisos de comités vencidos o pendientes?';
      } else if (
        /\b(quimic[oa]s?|sustancia(s)?\s+peligrosas?|fds|hoja(s)?\s+de\s+seguridad|sga|compatibilidad\s+quimic[a-z]*|1496)\b/.test(
          normContext,
        )
      ) {
        sourceHitos.push('hito5_registro_quimico');
        inputs.push('matriz_compatibilidad', 'consultar_pubchem_quimico');
        inferredCategory = 'quimicos_sga';
        inferredIfLabel = '¿Existen productos químicos sin FDS vigente, rótulo SGA o con incompatibilidad?';
      } else if (
        /\b(atel|furat|furel|accidente(s)?\s+de\s+trabajo|enfermedad(es)?\s+laboral(es)?|investigacion(es)?\s+de\s+accidentes?|1401)\b/.test(
          normContext,
        )
      ) {
        sourceHitos.push('hito7_investigacion_atel', 'hito7_estadisticas_atel');
        inferredCategory = 'atel_inspecciones';
        inferredIfLabel = '¿Existen casos ATEL abiertos o investigaciones pendientes de cierre?';
      } else if (/\b(matriz\s+legal|requisito(s)?\s+legales?|normativ[a-z]*|resolucion(es)?|decretos?|ley(es)?\s+sst)\b/.test(normContext)) {
        sourceHitos.push('hito1_matriz_legal');
        inputs.push('web_search');
        inferredCategory = 'legal_comites';
        inferredIfLabel = '¿Existen requisitos legales incumplidos o actualizaciones normativas?';
      } else if (/\b(arl|afiliacion(es)?\s+arl|certificados?\s+arl|sura|positiva|bolivar|colmena|axa)\b/.test(normContext)) {
        sourceHitos.push('hito2_perfil_socio');
        inputs.push('scraper_agy_arl_directo');
        inferredCategory = 'salud_vencimientos';
        inferredIfLabel = '¿Se detectan novedades o trabajadores sin certificado ARL vigente?';
      } else if (/\b(antecedentes?|judiciales?|fiscales?|contraloria|rama\s+judicial)\b/.test(normContext)) {
        sourceHitos.push('hito2_perfil_socio');
        extractorsList.push('scraper_agy_antecedentes');
        inferredCategory = 'legal_comites';
        inferredIfLabel = '¿Se detectan novedades en antecedentes judiciales o fiscales?';
      } else if (/\b(ergonomi[a-z]*|owas|estudios?\s+de\s+puesto|biomecanic[a-z]*)\b/.test(normContext)) {
        sourceHitos.push('hito3_owas', 'hito3_estudio_puesto');
        inferredCategory = 'salud_vencimientos';
        inferredIfLabel = '¿Existen puestos con riesgo biomecánico alto o intervenciones pendientes?';
      } else if (/\b(psicosocial(es)?|estres\s+laboral|2764|bateria\s+psicosocial)\b/.test(normContext)) {
        sourceHitos.push('hito4_psicosocial');
        inputs.push('consultar_analitica_psicosocial');
        inferredCategory = 'salud_vencimientos';
        inferredIfLabel = '¿Existen alertas psicosociales o planes de intervención pendientes?';
      } else if (/\b(emergencias?|simulacros?|vulnerabilidad|evacuacion|botiquin(es)?|extintor(es)?)\b/.test(normContext)) {
        sourceHitos.push('hito1_plan_emergencias', 'hito5_equipos_emergencia');
        inputs.push('buscar_centros_emergencia');
        inferredCategory = 'atel_inspecciones';
        inferredIfLabel = '¿Existen equipos de emergencia vencidos o brechas de preparación?';
      }
    }

    // Extractores documentales explícitos solo cuando el usuario los menciona en nombre o prompt
    if (extractorsList.length === 0) {
      if (/\b(google\s+drive|carpeta\s+de\s+drive|en\s+drive)\b/.test(normContext)) {
        extractorsList.push('extract_drive');
        if (/\b(ocr|pdfs?|documentos?|certificados?|conceptos?|furat|facturas?|leer\s+archivos?)\b/.test(normContext)) {
          extractorsList.push('extract_ai_doc_ocr');
        }
      }
      if (/\b(gmail|bandeja\s+de\s+entrada|correos?\s+entrantes?|correos?\s+recibidos?)\b/.test(normContext)) {
        extractorsList.push('extract_gmail');
        if (/\b(ocr|pdfs?|adjuntos?|incapacidad(es)?|certificados?)\b/.test(normContext)) {
          extractorsList.push('extract_ai_doc_ocr');
        }
      }
      if (/\b(carpeta\s+(del\s+)?pc|carpeta\s+local|disco\s+local)\b/.test(normContext)) {
        extractorsList.push('extract_pc_folder');
      }
    }

    // Herramientas complementarias explícitas solicitadas
    if (/\bnotebooklm\b/.test(normContext) && !inputs.includes('notebooklm')) {
      inputs.push('notebooklm');
    }
    if (/\b(google\s+flow|afiches?|infografias?|videos?\s+veo|campanas?\s+visuales?)\b/.test(normContext) && !inputs.includes('google_flow')) {
      inputs.push('google_flow');
    }
    if (hasExplicitWeatherRequest && !inputs.includes('pronostico_clima_sst')) {
      inputs.push('pronostico_clima_sst');
    }

    // Guardia estricta anti-mezcla: jamás incluir clima si no se pidió explícitamente
    if (!hasExplicitWeatherRequest) {
      inputs = inputs.filter((id) => id !== 'pronostico_clima_sst');
    }

    // Si aún no hay ninguna fuente ni herramienta, asignar diagnóstico 0312 + somos_sst_empresa como base SG-SST
    if (sourceHitos.length === 0 && extractorsList.length === 0 && inputs.length === 0 && agentToolHitos.length === 0) {
      sourceHitos.push('hito1_diagnostico_0312');
      inputs.push('somos_sst_empresa');
    }

    sourceHitos = Array.from(new Set(sourceHitos));
    const sourceHitoSet = new Set(sourceHitos);
    agentToolHitos = Array.from(new Set(agentToolHitos.filter((h) => !sourceHitoSet.has(h))));
    const allHitos = [...sourceHitos, ...agentToolHitos];
    extractorsList = Array.from(new Set(extractorsList));
    inputs = Array.from(new Set(inputs));

    // 4. Salidas (SIEMPRE incluye 'wappy_notification' para reportar de vuelta a Tenshi)
    let outputs = [];
    if (Array.isArray(salidas) && salidas.length > 0) {
      outputs = salidas
        .map((o) => String(o || '').trim())
        .filter((o) => VALID_WORKFLOW_OUTPUTS.has(o));
    } else {
      const wantsEmail =
        (Array.isArray(emails) && emails.length > 0) ||
        /\b(correo|email|mail|bitacora\s+por\s+correo|enviar\s+informe)\b/.test(normContext);
      if (wantsEmail) outputs.push('email_report');
      if (/\b(acpm|accion(es)?\s+(correctiva|preventiva)|plan\s+de\s+accion|centro\s+de\s+control)\b/.test(normContext)) {
        outputs.push('acpm_task');
      }
      if (/\b(documento|canvas|informe\s+en\s+vivo|live\s+editor|acta)\b/.test(normContext)) {
        outputs.push('canvas_doc');
      }
      if (/\b(calendar|calendario|agendar|citacion)\b/.test(normContext)) {
        outputs.push('google_calendar');
      }
    }
    if (!outputs.includes('wappy_notification')) {
      outputs.push('wappy_notification');
    }
    outputs = Array.from(new Set(outputs));

    // 5. Configurar nodeConfigs completos para renderizado y ejecución inmediata en /tareas
    const finalIfLabel =
      String(condicion_if || '').trim() ||
      inferredIfLabel ||
      `¿Existen novedades o hallazgos relevantes en ${cleanFlowName}?`;

    const nodeConfigs = {};
    for (const hitoId of sourceHitos) {
      const hCfg = {
        hitoRole: 'source_read',
        dataRole: 'source_read',
        hitoOperationMode: 'read_only',
        appActionMode: 'read_only',
        includeLatestReport: false,
        customInstruction: `Consulta en modo solo lectura los registros vigentes de ${hitoId} para "${cleanFlowName}".`,
      };
      nodeConfigs[hitoId] = { ...hCfg };
      nodeConfigs[`tool_hitos_${hitoId}`] = { ...hCfg };
    }
    for (const hitoId of agentToolHitos) {
      const hCfg = {
        hitoRole: 'agent_tool',
        hitoOperationMode: 'read_only',
        appActionMode: 'read_only',
        customInstruction: `Herramienta de cruce en modo solo lectura (${hitoId}) conectada al Agente IA para "${cleanFlowName}".`,
      };
      nodeConfigs[hitoId] = { ...hCfg };
      nodeConfigs[`tool_hitos_${hitoId}`] = { ...hCfg };
    }

    if (includeIfNode) {
      const ifCfg = {
        ifPlacement: 'pre_agent',
        ifConditionType: 'critical_findings',
        ifConditionLabel: finalIfLabel,
        conditionTrueLabel: 'Sí — Ejecutar análisis IA y activar salidas prioritarias',
        conditionFalseLabel: 'No — Registrar estado conforme en notificación WAPPY',
        customInstruction: `Evalúa antes del análisis de alertas si existen hallazgos, vencimientos o novedades relevantes para "${cleanFlowName}".`,
      };
      nodeConfigs.if_router = { ...ifCfg };
      nodeConfigs.if_condition = { ...ifCfg };

      const hasOtherOutputs = outputs.some((o) => o !== 'wappy_notification');
      for (const outId of outputs) {
        if (outId === 'wappy_notification') {
          nodeConfigs.out_wappy_notification = hasOtherOutputs
            ? { ifBranch: 'no', customInstruction: `Notifica el estado y resultado de "${cleanFlowName}" en WAPPY / Tenshi.` }
            : { customInstruction: `Notifica el resultado de "${cleanFlowName}" en WAPPY / Tenshi.` };
        } else {
          nodeConfigs[`out_${outId}`] = { ifBranch: 'yes' };
        }
      }
    }

    const rawWorkflowNodes = {
      trigger: triggers[0] || 'trigger_tenshi',
      triggers,
      extractors: extractorsList,
      aiEngine: 'wappy',
      aiModel,
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      includeIfNode,
      inputs,
      hitos: allHitos,
      outputs,
      canvasLayout: {
        positions: {},
        edges: [],
        logicNodes: [],
        nodeConfigs,
      },
    };

    const ensured = this._ensureTriggerTenshiVoiceConfig(
      rawWorkflowNodes,
      cleanFlowName,
      primaryVoiceCommand,
    );

    return {
      workflowNodes: ensured.workflowNodes,
      cleanFlowName: ensured.cleanFlowName,
      primaryVoiceCommand: ensured.primaryVoiceCommand,
      inferredCategory,
      sourceHitos,
      agentToolHitos,
      extractors: extractorsList,
      inputs,
      outputs,
      aiModel,
      includeIfNode,
      finalIfLabel,
    };
  }

  _formatCompanyAutomationsForError(companyAutos = []) {
    const list = Array.isArray(companyAutos) ? companyAutos : [];
    const flujosDisponiblesEmpresa = list.map((a) => ({
      id: a._id.toString(),
      nombre: a.name,
      estado: a.status,
    }));
    const summaryText =
      list.length > 0
        ? ` Flujos existentes en tu empresa: ${list
            .map((a) => `"${a.name}" (${a.status === 'active' ? 'Activa' : 'Inactiva'})`)
            .join(', ')}.`
        : ' Tu empresa aún no tiene flujos instalados en /tareas.';
    return { flujosDisponiblesEmpresa, summaryText };
  }

  async _cloneAndActivateSystemPreset({
    query,
    companyId,
    companyName = '',
    userId,
    emails,
    currentAgentId,
    executeImmediately = false,
    commandText = '',
    existingCompanyAutos = [],
  }) {
    const rawQuery = String(query || '').trim();
    if (!rawQuery) {
      return { handled: false };
    }

    const catalog = resolveSystemWorkflowPresetsCatalog();
    if (!Array.isArray(catalog) || catalog.length === 0) {
      return { handled: false };
    }

    const {
      resolveAutomationByVoiceOrQuery,
      calculateNextRun,
      hasCronTrigger,
      runAutomation,
    } = require('~/server/services/automationScheduler');

    const candidates = this._buildQueryCandidates([rawQuery]);
    let bestPreset = null;
    let bestScore = 0;

    for (const cand of candidates) {
      const resolved = resolveAutomationByVoiceOrQuery(catalog, cand);
      const sc = Number(resolved?.score || 0);
      if (resolved?.matches && resolved.matches.length > 0 && sc > bestScore) {
        bestPreset = resolved.matches[0];
        bestScore = sc;
      }
    }

    // Exigir score >= 60 contra el catálogo oficial de 30 presets para evitar falsos positivos
    if (!bestPreset || bestScore < 60) {
      return { handled: false };
    }

    // Evitar duplicar si el preset ya estaba instalado en la empresa con el mismo presetKey o nombre exacto
    const presetNormName = this._normStr(bestPreset.name);
    const alreadyInCompany = (existingCompanyAutos || []).find(
      (a) =>
        (bestPreset.presetKey && a.presetKey === bestPreset.presetKey) ||
        this._normStr(a.name) === presetNormName,
    );

    const { limit: effectiveLimit, plan: userPlanName } = await this._getEffectiveAutomationLimit(userId);
    if (effectiveLimit <= 0) {
      return {
        handled: true,
        response: JSON.stringify({
          error:
            '🔒 Función Exclusiva de Plan PRO: Las automatizaciones están disponibles únicamente en el Plan Wappy Pro. Actualiza tu suscripción para activar flujos en /tareas.',
          bloqueadoPorPlan: true,
          planActual: userPlanName,
        }),
      };
    }

    const currentActiveCount = await Automation.countDocuments({
      user: userId,
      status: 'active',
      isTenshiFlow: { $ne: true },
      isSystemPreset: { $ne: true },
    });

    if (alreadyInCompany) {
      if (alreadyInCompany.status !== 'active' && currentActiveCount >= effectiveLimit) {
        return {
          handled: true,
          response: JSON.stringify({
            error: `🔒 No se puede activar "${alreadyInCompany.name}": Has alcanzado tu límite de ${effectiveLimit} automatización(es) activa(s). Pausa otra tarea primero.`,
            limiteAlcanzado: true,
            limiteActual: effectiveLimit,
            activas: currentActiveCount,
          }),
        };
      }
      const cleanName = this._cleanFlowNameForVoiceCommand(alreadyInCompany.name);
      alreadyInCompany.status = 'active';
      const hasCron = hasCronTrigger(alreadyInCompany);
      alreadyInCompany.nextRunAt = hasCron
        ? calculateNextRun(alreadyInCompany.scheduleType || 'daily', alreadyInCompany.scheduleConfig || {})
        : null;
      if (executeImmediately && alreadyInCompany.lastRunStatus !== 'running') {
        alreadyInCompany.lastRunStatus = 'running';
      }
      await alreadyInCompany.save();

      if (executeImmediately) {
        this._dispatchCompanyAutomationWithEvents({
          runAutomation,
          automation: alreadyInCompany,
          runOptions: {
            triggerSource: 'tenshi_voice',
            eventPayload: {
              commandText: commandText || rawQuery,
              matchedVoiceCommand: cleanName,
              invokedVia: 'gestor_automatizaciones',
              invokedAt: new Date().toISOString(),
            },
          },
          indicaciones: commandText || rawQuery || alreadyInCompany.name,
          empresa: companyName,
          logErrorLabel: 'Error ejecutando flujo ya instalado',
        });
      }

      return {
        handled: true,
        response: JSON.stringify({
          success: true,
          origenFlujo: 'flujo_propio_empresa',
          clonadoDesdePreset: false,
          triggeredNow: Boolean(executeImmediately),
          id: alreadyInCompany._id.toString(),
          nombre: alreadyInCompany.name,
          estado: alreadyInCompany.status,
          proximaEjecucion: alreadyInCompany.nextRunAt
            ? new Date(alreadyInCompany.nextRunAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
            : 'Por evento / Comando Tenshi',
          mensaje: executeImmediately
            ? `Flujo "${alreadyInCompany.name}" activado y ejecutado inmediatamente en segundo plano.`
            : `Flujo "${alreadyInCompany.name}" activado correctamente en tu empresa.`,
        }),
      };
    }

    if (currentActiveCount >= effectiveLimit) {
      return {
        handled: true,
        response: JSON.stringify({
          error: `🔒 No se puede instalar y activar el flujo preestablecido "${bestPreset.name}": Has alcanzado tu límite de ${effectiveLimit} automatización(es) activa(s) (${currentActiveCount}/${effectiveLimit}). Pausa otra tarea primero.`,
          limiteAlcanzado: true,
          limiteActual: effectiveLimit,
          activas: currentActiveCount,
        }),
      };
    }

    const agentInfo = await this._resolveAgent(
      bestPreset.agentTargetName || bestPreset.agentName,
      currentAgentId,
    );
    const clonedWorkflowNodes = JSON.parse(JSON.stringify(bestPreset.workflowNodes || {}));
    const ensured = this._ensureTriggerTenshiVoiceConfig(clonedWorkflowNodes, bestPreset.name);

    const scheduleType = bestPreset.scheduleType || 'daily';
    const scheduleConfig = bestPreset.scheduleConfig || {
      hour: 8,
      minute: 0,
      dayOfWeek: [1],
      dayOfMonth: 1,
      intervalHours: 1,
    };
    const hasCron = hasCronTrigger({ workflowNodes: ensured.workflowNodes });
    const nextRunAt = hasCron ? calculateNextRun(scheduleType, scheduleConfig) : null;
    const defaultEmails =
      Array.isArray(emails) && emails.length > 0
        ? emails
        : this.req?.user?.email
          ? [this.req.user.email]
          : [];

    const clonedAutomation = await Automation.create({
      user: userId,
      companyId: String(companyId),
      isSystemPreset: false,
      isTenshiFlow: false,
      presetKey: bestPreset.presetKey || undefined,
      presetCategory: bestPreset.presetCategory || 'general',
      presetDescription: bestPreset.presetDescription || '',
      name: bestPreset.name,
      agentId: agentInfo.id,
      agentName: agentInfo.name,
      prompt: bestPreset.prompt,
      scheduleType,
      scheduleConfig,
      workflowNodes: ensured.workflowNodes,
      emails: defaultEmails,
      status: 'active',
      ...(executeImmediately ? { lastRunStatus: 'running' } : {}),
      nextRunAt,
    });

    if (executeImmediately) {
      this._dispatchCompanyAutomationWithEvents({
        runAutomation,
        automation: clonedAutomation,
        runOptions: {
          triggerSource: 'tenshi_voice',
          eventPayload: {
            commandText: commandText || rawQuery,
            matchedVoiceCommand: ensured.primaryVoiceCommand,
            invokedVia: 'gestor_automatizaciones_preset_clone',
            invokedAt: new Date().toISOString(),
          },
        },
        indicaciones: commandText || rawQuery || clonedAutomation.name,
        empresa: companyName,
        logErrorLabel: 'Error ejecutando preset clonado',
      });
    }

    return {
      handled: true,
      response: JSON.stringify({
        success: true,
        origenFlujo: 'flujo_propio_empresa',
        clonadoDesdePreset: true,
        presetKey: bestPreset.presetKey || null,
        triggeredNow: Boolean(executeImmediately),
        id: clonedAutomation._id.toString(),
        nombre: clonedAutomation.name,
        comandoTenshi: ensured.primaryVoiceCommand,
        estado: clonedAutomation.status,
        agente: agentInfo.name,
        proximaEjecucion: clonedAutomation.nextRunAt
          ? new Date(clonedAutomation.nextRunAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
          : 'Por evento / Comando Tenshi',
        mensaje: executeImmediately
          ? `Flujo preestablecido "${clonedAutomation.name}" clonado, activado y puesto en marcha en tu empresa (comando Tenshi: "${ensured.primaryVoiceCommand}").`
          : `Flujo preestablecido "${clonedAutomation.name}" clonado, instalado y activado automáticamente en tu empresa (comando Tenshi: "${ensured.primaryVoiceCommand}").`,
      }),
    };
  }

  _buildSafeCompanyFilter(companyId) {
    return {
      companyId: { $eq: String(companyId), $nin: ['SYSTEM_PRESET', 'TENSHI_GLOBAL'] },
      isSystemPreset: { $ne: true },
      isTenshiFlow: { $ne: true },
    };
  }

  async _findCompanyAutomations(companyId, _userId) {
    if (!companyId) return [];
    const list = await Automation.find(this._buildSafeCompanyFilter(companyId)).sort({ createdAt: -1 });
    return list || [];
  }

  async _resolveTargetAutomations(companyId, userId, { automatizacion_id, nombre, forcedAll = false }) {
    const { resolveAutomationByVoiceOrQuery } = require('~/server/services/automationScheduler');
    const allAutos = await this._findCompanyAutomations(companyId, userId);

    const rawId = String(automatizacion_id || '').trim();
    const rawName = String(nombre || '').trim();
    const queryStr = rawId || rawName;
    const normQuery = this._normStr(queryStr);

    if (!forcedAll && !rawId && !rawName) {
      return {
        matches: [],
        isBulk: false,
        usedNameAsQuery: false,
        matchSource: null,
        matchedVoiceCommand: null,
        score: 0,
        missingTarget: true,
        companyAutomations: allAutos,
      };
    }

    const isAllKeyword =
      forcedAll ||
      /^(todas?|todos?|all|\*|todas\s+las\s+(tareas|automatizaciones|activas|inactivas))$/i.test(normQuery);

    if (isAllKeyword) {
      return {
        matches: allAutos,
        isBulk: true,
        usedNameAsQuery: false,
        matchSource: 'bulk',
        matchedVoiceCommand: null,
        score: 100,
        missingTarget: false,
        companyAutomations: allAutos,
      };
    }

    if (allAutos.length === 0) {
      return {
        matches: [],
        isBulk: false,
        usedNameAsQuery: false,
        matchSource: null,
        matchedVoiceCommand: null,
        score: 0,
        missingTarget: false,
        companyAutomations: allAutos,
      };
    }

    // 1. Si automatizacion_id es un ObjectId válido de 24 caracteres hexadecimales
    if (this._isObjectId(rawId)) {
      const byId = allAutos.find((a) => String(a._id) === rawId);
      if (byId) {
        return {
          matches: [byId],
          isBulk: false,
          usedNameAsQuery: false,
          matchSource: 'id',
          matchedVoiceCommand: null,
          score: 100,
          missingTarget: false,
          companyAutomations: allAutos,
        };
      }
      const directById = await Automation.findOne({ _id: rawId, ...this._buildSafeCompanyFilter(companyId) });
      if (directById) {
        return {
          matches: [directById],
          isBulk: false,
          usedNameAsQuery: false,
          matchSource: 'id',
          matchedVoiceCommand: null,
          score: 100,
          missingTarget: false,
          companyAutomations: allAutos,
        };
      }
    }

    // 2. Resolver estricto por FRASE/COMANDO TENSHI (`voiceCommand`) o Título real exigiendo score >= 55
    const searchCandidates = this._buildQueryCandidates([rawId, rawName]);
    let bestResolved = null;
    for (const candidate of searchCandidates) {
      const resolved = resolveAutomationByVoiceOrQuery(allAutos, candidate);
      const sc = Number(resolved?.score || 0);
      if (resolved?.matches && resolved.matches.length > 0 && sc >= 55) {
        if (!bestResolved || sc > bestResolved.score) {
          bestResolved = {
            matches: [resolved.matches[0]],
            isBulk: false,
            usedNameAsQuery: !rawId,
            matchSource: resolved.matchSource,
            matchedVoiceCommand: resolved.matchedVoiceCommand,
            score: sc,
            missingTarget: false,
            companyAutomations: allAutos,
          };
        }
      }
    }

    if (bestResolved) {
      return bestResolved;
    }

    return {
      matches: [],
      isBulk: false,
      usedNameAsQuery: false,
      matchSource: null,
      matchedVoiceCommand: null,
      score: 0,
      missingTarget: false,
      companyAutomations: allAutos,
    };
  }

  async _getActiveCompanyId(userId) {
    if (!userId && !this.req?.user) return null;
    const { resolveStrictExecutionContext } = require('~/server/services/tenshiFlowService');
    const reqUser = this.req?.user || { id: userId, _id: userId };
    const ctx = await resolveStrictExecutionContext({ reqUser, reqObj: this.req });
    return ctx?.companyId || null;
  }

  async _executeMatchedTenshiFlow({
    flow,
    strictCtx,
    userInstruction = '',
    esperar_resultado = true,
    attachedMedia = null,
    fallbackFromOwnFlow = false,
  }) {
    const { executeTenshiFlowInstant } = require('~/server/services/tenshiFlowService');
    const isVoice = Boolean(this.req?.isVoiceSession);
    const channel = isVoice ? 'voice' : 'chat';
    const waitTimeoutMs = esperar_resultado === false ? 0 : (isVoice ? 35000 : 60000);
    const triggerSource = isVoice ? 'tenshi_voice' : 'tenshi_flow_instant';
    const resolvedAttachedMedia = attachedMedia || this.req?.__tenshiAttachedMedia || null;
    const runId =
      this.req?.__tenshiFlowRunId ||
      `tflow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const cleanFlowName = this._cleanFlowDisplayName(flow?.name || 'Flujo Tenshi');
    const indicaciones = String(userInstruction || flow?.name || 'Consulta solicitada')
      .trim()
      .slice(0, 260);
    const empresa = strictCtx?.companyName || '';
    const callerUserId = this.req?.user?.id || this.req?.user?._id || null;
    const isVoiceManaged = Boolean(this.req?.__tenshiFlowVoiceManaged);

    if (!this.req?.__tenshiFlowStartedEmitted) {
      this._emitTenshiFlowEvent(
        'tenshi_flow_started',
        {
          runId,
          flowName: cleanFlowName,
          indicaciones,
          empresa,
          origenFlujo: 'flujo_global_tenshi',
          channel,
          startedAt: new Date().toISOString(),
        },
        callerUserId,
      );
    }

    let completedOk = false;
    let evidenciasCount = 0;

    try {
      const execRes = await executeTenshiFlowInstant({
        flow,
        context: strictCtx,
        userInstruction: String(userInstruction || '').trim(),
        waitTimeoutMs,
        triggerSource,
        attachedMedia: resolvedAttachedMedia,
      });

      if (execRes?.completedInTurn === false || execRes?.status === 'running_background') {
        completedOk = true;
        return JSON.stringify({
          success: true,
          origenFlujo: 'flujo_global_tenshi',
          ...(fallbackFromOwnFlow ? { fallbackDesdeEjecutarAhora: true } : {}),
          mode: 'background_continued',
          flujo: execRes?.flowName || flow?.name || 'Flujo Tenshi',
          empresa: strictCtx.companyName,
          companyId: strictCtx.companyId,
          logId: execRes?.logId || null,
          mensaje:
            'El flujo sigue procesando en segundo plano y quedará guardado en Historial de Ejecuciones de la empresa.',
        });
      }

      if (execRes?.status === 'success') {
        const evidencias = Array.isArray(execRes.evidenceFiles) ? execRes.evidenceFiles : [];
        completedOk = true;
        evidenciasCount = evidencias.length;
        let mensaje;
        if (evidencias.length === 1) {
          mensaje =
            'Flujo ejecutado al instante y 1 certificado oficial fue emitido y entregado directamente en tu chat de Tenshi. Usa el campo "resultado" e indícale explícitamente al usuario que el certificado fue emitido, que ya lo recibió aquí en el chat y que ya puede abrirlo o descargarlo (NO pegues rutas /api/... crudas en el texto porque la tarjeta interactiva del certificado ya se adjunta automáticamente en la burbuja del chat).';
        } else if (evidencias.length > 1) {
          mensaje =
            `Flujo ejecutado al instante y ${evidencias.length} certificados oficiales fueron emitidos y entregados directamente en tu chat de Tenshi. Usa el campo "resultado" e indícale explícitamente al usuario que los certificados fueron emitidos, que ya los recibió aquí en el chat y que ya puede abrirlos o descargarlos (NO pegues rutas /api/... crudas en el texto porque las tarjetas interactivas de los certificados ya se adjuntan automáticamente en la burbuja del chat).`;
        } else {
          mensaje =
            'Flujo ejecutado al instante. Usa el campo "resultado" fielmente para responderle directamente al usuario; si el resultado indica que no aparece afiliado activo en otras ARLs sin fecha de nacimiento, avísale al usuario que si la consulta es en una ARL que exige fecha de nacimiento (como ARL Seguros Bolívar) te solicite o indique la fecha de nacimiento para consultarla.';
        }

        return JSON.stringify({
          success: true,
          origenFlujo: 'flujo_global_tenshi',
          ...(fallbackFromOwnFlow ? { fallbackDesdeEjecutarAhora: true } : {}),
          mode: 'instant',
          flujo: execRes.flowName || flow?.name || 'Flujo Tenshi',
          empresa: strictCtx.companyName,
          companyId: strictCtx.companyId,
          logId: execRes.logId || null,
          rama: execRes.branchTaken || null,
          enlacesWorkspace: execRes.workspaceLinks || [],
          evidencias,
          evidenceFiles: evidencias,
          resultado: execRes.resultText || '',
          mensaje,
        });
      }

      completedOk = false;
      return JSON.stringify({
        error: execRes?.error || 'Error ejecutando el flujo interno.',
        origenFlujo: 'flujo_global_tenshi',
        ...(fallbackFromOwnFlow ? { fallbackDesdeEjecutarAhora: true } : {}),
        flujo: execRes?.flowName || flow?.name || 'Flujo Tenshi',
        logId: execRes?.logId || null,
      });
    } catch (flowErr) {
      completedOk = false;
      return JSON.stringify({
        error: flowErr?.message || 'Error ejecutando el flujo interno.',
        origenFlujo: 'flujo_global_tenshi',
        ...(fallbackFromOwnFlow ? { fallbackDesdeEjecutarAhora: true } : {}),
        flujo: flow?.name || 'Flujo Tenshi',
      });
    } finally {
      if (!(isVoiceManaged || this.req?.__tenshiFlowVoiceManaged)) {
        this._emitTenshiFlowEvent(
          'tenshi_flow_completed',
          {
            runId,
            flowName: cleanFlowName,
            indicaciones,
            empresa,
            origenFlujo: 'flujo_global_tenshi',
            success: completedOk,
            hasEvidences: evidenciasCount > 0,
            channel,
            completedAt: new Date().toISOString(),
          },
          callerUserId,
        );
      }
    }
  }

  async _executeCompanyAutomation({
    automation,
    companyId,
    companyName = '',
    userId,
    matchSource = 'id',
    matchedVoiceCommand = null,
    automatizacion_id = '',
    nombre = '',
    instruccion_usuario = '',
    redirectedFromTenshi = false,
  }) {
    const {
      runAutomation,
      calculateNextRun,
      hasCronTrigger,
    } = require('~/server/services/automationScheduler');

    if (automation.lastRunStatus === 'running') {
      return JSON.stringify({
        origenFlujo: 'flujo_propio_empresa',
        ...(redirectedFromTenshi ? { redirigidoDesdeEjecutarTenshi: true } : {}),
        id: automation._id.toString(),
        nombre: automation.name,
        advertencia: `La automatización "${automation.name}" ya se encuentra ejecutándose en segundo plano en este momento.`,
      });
    }

    // Si estaba inactiva y fue invocada por comando Tenshi, activarla también respetando límite de plan
    const updateSet = { lastRunStatus: 'running' };
    if (automation.status !== 'active' && matchSource === 'voiceCommand') {
      const { limit: effectiveLimit } = await this._getEffectiveAutomationLimit(userId);
      const currentActive = await Automation.countDocuments({
        user: userId,
        status: 'active',
        isTenshiFlow: { $ne: true },
        isSystemPreset: { $ne: true },
      });
      if (currentActive < effectiveLimit) {
        updateSet.status = 'active';
        updateSet.nextRunAt = hasCronTrigger(automation)
          ? calculateNextRun(automation.scheduleType, automation.scheduleConfig)
          : null;
      }
    }

    await Automation.updateOne(
      { _id: automation._id, ...this._buildSafeCompanyFilter(companyId) },
      { $set: updateSet },
    );

    const cleanInstruction = String(instruccion_usuario || '').trim();
    const attachedMedia = this.req?.__tenshiAttachedMedia || null;
    const runOptions =
      matchSource === 'voiceCommand' || redirectedFromTenshi || cleanInstruction || attachedMedia
        ? {
            isManual: true,
            triggerSource:
              matchSource === 'voiceCommand' || redirectedFromTenshi
                ? 'tenshi_voice'
                : 'manual',
            ...(cleanInstruction ? { userInstruction: cleanInstruction } : {}),
            ...(attachedMedia ? { attachedMedia } : {}),
            eventPayload: {
              commandText:
                cleanInstruction || automatizacion_id || nombre || matchedVoiceCommand || '',
              ...(cleanInstruction ? { userMessage: cleanInstruction } : {}),
              matchedVoiceCommand: matchedVoiceCommand || null,
              invokedVia: redirectedFromTenshi
                ? 'gestor_automatizaciones_redirect_own_flow'
                : 'gestor_automatizaciones',
              ...(attachedMedia ? { attachedMedia } : {}),
            },
          }
        : true;

    const rawIndicaciones =
      cleanInstruction ||
      (!this._isObjectId(nombre) ? String(nombre || '').trim() : '') ||
      matchedVoiceCommand ||
      (!this._isObjectId(automatizacion_id) ? String(automatizacion_id || '').trim() : '') ||
      automation?.name ||
      'Ejecución de flujo';

    this._dispatchCompanyAutomationWithEvents({
      runAutomation,
      automation,
      runOptions,
      indicaciones: rawIndicaciones,
      empresa: companyName,
      logErrorLabel: 'Error en ejecución manual background',
    });

    return JSON.stringify({
      success: true,
      origenFlujo: 'flujo_propio_empresa',
      ...(redirectedFromTenshi ? { redirigidoDesdeEjecutarTenshi: true } : {}),
      id: automation._id.toString(),
      nombre: automation.name,
      matchedVoiceCommand: matchedVoiceCommand || null,
      mensaje: redirectedFromTenshi
        ? `El ID corresponde al flujo propio de tu empresa "${automation.name}". Ejecución iniciada inmediatamente en segundo plano.`
        : matchedVoiceCommand
          ? `Ejecución iniciada inmediatamente en segundo plano para el flujo propio de tu empresa "${automation.name}" (comando "${matchedVoiceCommand}").`
          : `Ejecución iniciada inmediatamente en segundo plano para la tarea propia de tu empresa "${automation.name}".`,
    });
  }

  async _getEffectiveAutomationLimit(userId) {
    if (!userId) return { limit: 0, plan: 'free' };
    const UserPlan = require('~/db/models/UserPlan');
    const userPlanDoc = await UserPlan.findOne({ userId }).lean();
    let plan = userPlanDoc?.plan;
    if (!plan || plan === 'free') {
      const role = this.req?.user?.role;
      if (role === 'ADMIN') plan = 'admin';
      else if (role === 'USER_PRO') plan = 'pro';
      else if (role === 'USER_PLUS') plan = 'plus';
      else if (role === 'USER_GO') plan = 'go';
      else if (role === 'USER_CUSTOM') plan = 'custom';
      else if (role === 'USER_IPEVAR') plan = 'ipevar';
      else plan = 'free';
    }

    if (userPlanDoc?.automationLimit !== undefined && userPlanDoc?.automationLimit !== null) {
      return { limit: userPlanDoc.automationLimit, plan };
    }

    if (['admin', 'custom'].includes(plan)) {
      return { limit: 999, plan };
    }
    if (plan === 'pro') {
      return { limit: 1, plan };
    }
    return { limit: 0, plan };
  }

  async _resolveAgent(agentTarget, currentAgentId) {
    const AgentModel = mongoose.models.Agent || (mongoose.modelNames().includes('Agent') ? mongoose.model('Agent') : null);
    
    // Si viene "yo" o vacío, intentar usar el agente actual
    if (!agentTarget || agentTarget.trim().toLowerCase() === 'yo' || agentTarget.trim() === '') {
      if (currentAgentId && AgentModel) {
        const ag = await AgentModel.findOne({ id: currentAgentId }).lean();
        if (ag) return { id: ag.id, name: ag.name };
      }
    }

    if (!AgentModel) {
      return { id: currentAgentId || 'default-agent', name: agentTarget || 'Agente Experto' };
    }

    // Buscar por ID exacto
    if (agentTarget) {
      const byId = await AgentModel.findOne({ id: agentTarget }).lean();
      if (byId) return { id: byId.id, name: byId.name };

      // Buscar por nombre con regex insensible a mayúsculas
      const byName = await AgentModel.findOne({ name: { $regex: new RegExp(`^${agentTarget.trim()}$`, 'i') } }).lean();
      if (byName) return { id: byName.id, name: byName.name };

      // Búsqueda parcial por nombre
      const byPartialName = await AgentModel.findOne({ name: { $regex: new RegExp(agentTarget.trim(), 'i') } }).lean();
      if (byPartialName) return { id: byPartialName.id, name: byPartialName.name };
    }

    // Fallback: Consultor SG-SST o primer agente disponible
    const fallbackAgent = await AgentModel.findOne({ name: 'Consultor SG-SST' }).lean() || await AgentModel.findOne({}).lean();
    if (fallbackAgent) {
      return { id: fallbackAgent.id, name: fallbackAgent.name };
    }

    return { id: currentAgentId || 'default-agent', name: agentTarget || 'Agente' };
  }

  async _call(input) {
    try {
      const earlyNormalized = this._normalizeActionAndStatus(input?.accion, input?.nuevo_estado);
      if (earlyNormalized.accion === 'consultar_documentacion_nodos') {
        const docsSvc = resolveWorkflowNodesDocsService();
        if (!docsSvc || typeof docsSvc.queryWorkflowNodesDocs !== 'function') {
          return JSON.stringify({
            status: 'error',
            accion: 'consultar_documentacion_nodos',
            error: 'La Enciclopedia SmartDown de Nodos de Flujo no está disponible temporalmente.',
          });
        }
        const query = String(
          input?.busqueda_nodo || input?.nombre || input?.instruccion_usuario || ''
        ).trim();
        const result =
          (await Promise.resolve(docsSvc.queryWorkflowNodesDocs({ query, limit: 10 }))) || {};
        return JSON.stringify({
          status: 'success',
          accion: 'consultar_documentacion_nodos',
          totalNodes: result.totalNodes ?? 0,
          matchedCount: result.matchedCount ?? 0,
          guia_smartdown: result.markdown || '',
          categorias: result.categoriesSummary || [],
        });
      }

      const {
        runAutomation,
        calculateNextRun,
        stopAutomation,
        hasCronTrigger,
        extractAutomationTriggerConfigs,
      } = require('~/server/services/automationScheduler');
      const {
        resolveStrictExecutionContext,
        listActiveTenshiFlows,
        matchTenshiFlowByQuery,
      } = require('~/server/services/tenshiFlowService');

      const callerUserId = this.req?.user?.id || this.req?.user?._id;
      if (!callerUserId) {
        return JSON.stringify({
          error: 'No se encontró un usuario autenticado para gestionar las automatizaciones.'
        });
      }

      const strictCtx = await resolveStrictExecutionContext({
        reqUser: this.req?.user,
        reqObj: this.req,
      });
      if (strictCtx?.error || !strictCtx?.companyId) {
        return JSON.stringify({
          error: strictCtx?.error || 'No se encontró una empresa asociada a tu usuario. Por favor registra los datos de tu empresa en WAPPY primero.'
        });
      }

      const companyId = strictCtx.companyId;
      const userId = strictCtx.tenantOwnerUserId || String(callerUserId);
      const isAdminUser = String(this.req?.user?.role || '').toUpperCase() === 'ADMIN';

      const {
        accion: rawAccion,
        nombre,
        nuevo_nombre,
        agente_objetivo,
        prompt_a_ejecutar,
        instruccion_usuario,
        esperar_resultado,
        tipo_frecuencia,
        configuracion_horario = {},
        correos_notificacion,
        automatizacion_id,
        nuevo_estado: rawEstado,
        disparadores,
        comando_tenshi,
        hitos_fuente,
        herramientas_ia,
        extractores,
        salidas,
        incluir_condicion_if,
        condicion_if,
        modelo_ia,
        crear_como_flujo_tenshi,
      } = input || {};

      const { accion, nuevo_estado, forcedAll } = this._normalizeActionAndStatus(rawAccion, rawEstado);
      const currentAgentId = this.req?.body?.endpointOption?.agent_id;

      // ── ACCIÓN: EJECUTAR FLUJO TENSHI INTERNO INSTANTÁNEO ───────────
      if (accion === 'ejecutar_tenshi') {
        const query = String(automatizacion_id || nombre || instruccion_usuario || '').trim();
        if (!query) {
          return JSON.stringify({
            error: 'Debes indicar el nombre, código o comando del Flujo Tenshi a ejecutar.',
            origenFlujo: 'flujo_global_tenshi',
          });
        }

        // Si el usuario (o modelo) pasó el _id exacto de un flujo propio de su empresa, redirigir limpiamente sin error
        const rawOwnIdCandidate = this._isObjectId(automatizacion_id)
          ? String(automatizacion_id).trim()
          : this._isObjectId(nombre)
            ? String(nombre).trim()
            : this._isObjectId(query)
              ? query
              : '';
        if (rawOwnIdCandidate) {
          const ownCompanyFlowById = await Automation.findOne({
            _id: rawOwnIdCandidate,
            ...this._buildSafeCompanyFilter(companyId),
          });
          if (ownCompanyFlowById) {
            return await this._executeCompanyAutomation({
              automation: ownCompanyFlowById,
              companyId,
              companyName: strictCtx?.companyName || '',
              userId,
              matchSource: 'id',
              matchedVoiceCommand: null,
              automatizacion_id,
              nombre,
              instruccion_usuario,
              redirectedFromTenshi: true,
            });
          }
        }

        const activeFlows = await listActiveTenshiFlows();
        if (!activeFlows || activeFlows.length === 0) {
          return JSON.stringify({
            error: 'No hay Flujos Tenshi activos disponibles en el sistema en este momento.',
            origenFlujo: 'flujo_global_tenshi',
          });
        }
        const matchRes = await matchTenshiFlowByQuery(query, activeFlows);
        if (!matchRes?.flow) {
          return JSON.stringify({
            error: `No se encontró ningún Flujo Tenshi activo que coincida con "${query}".`,
            origenFlujo: 'flujo_global_tenshi',
          });
        }
        const attachedMedia = this.req?.__tenshiAttachedMedia || null;
        return await this._executeMatchedTenshiFlow({
          flow: matchRes.flow,
          strictCtx,
          userInstruction: instruccion_usuario || nombre || automatizacion_id || '',
          esperar_resultado: esperar_resultado !== false,
          attachedMedia,
        });
      }

      // ── ACCIÓN: LISTAR ──────────────────────────────────────────────
      if (accion === 'listar') {
        const automations = await this._findCompanyAutomations(companyId, userId);
        if (!automations || automations.length === 0) {
          return JSON.stringify({
            mensaje: 'No hay tareas/automatizaciones programadas para tu empresa en este momento.',
            total: 0,
            automatizaciones: []
          });
        }

        const formatted = automations.map(a => {
          const trigInfo = extractAutomationTriggerConfigs(a);
          return {
            id: a._id.toString(),
            nombre: a.name,
            agenteAsignado: a.agentName || a.agentId,
            disparadores: trigInfo.triggers,
            comandosVozTenshi: trigInfo.voiceCommands,
            frecuencia: a.scheduleType,
            horario: a.scheduleConfig,
            estado: a.status,
            destinatarios: a.emails || [],
            proximaEjecucion: a.nextRunAt ? new Date(a.nextRunAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : (trigInfo.triggers.includes('schedule_cron') ? 'No programada' : 'Por evento / Comando Tenshi'),
            ultimoEstado: a.lastRunStatus || 'Sin ejecuciones',
            ultimoResultado: a.lastRunResult ? a.lastRunResult.substring(0, 150) + '...' : 'Ninguno'
          };
        });

        return JSON.stringify({
          mensaje: `Se encontraron ${automations.length} tareas/automatizaciones configuradas.`,
          total: automations.length,
          automatizaciones: formatted
        });
      }

      // ── ACCIÓN: CREAR (CONSTRUCCIÓN REAL DE FLUJO DAG /tareas O FLUJO GLOBAL TENSHI) ─
      if (accion === 'crear') {
        if (this.req?.isAutomation || this.req?.body?.isAutomation) {
          return JSON.stringify({
            error: 'Operación bloqueada: No se permite crear nuevas automatizaciones desde dentro de la ejecución en segundo plano de una automatización existente.'
          });
        }
        const finalName = (nombre || nuevo_nombre || '').trim();
        const finalPrompt = (prompt_a_ejecutar || finalName).trim();
        if (!finalName) {
          return JSON.stringify({
            error: 'Para crear una tarea/automatización debes proporcionar "nombre".'
          });
        }

        const isCreatingGlobalTenshi = Boolean(crear_como_flujo_tenshi && isAdminUser);
        const normFinalName = this._normStr(finalName);
        const stopWords = new Set(['para', 'con', 'del', 'las', 'los', 'una', 'por', 'que', 'tarea', 'automatizacion', 'automatica', 'automatico', 'monitoreo', 'vigilancia', 'vigilar', 'revisar', 'revision', 'sincronizacion', 'diaria', 'diario', 'semanal', 'mensual', 'ejemplo', 'admin']);
        const newTokens = normFinalName.split(' ').filter((w) => w.length >= 3 && !stopWords.has(w));

        // Idempotencia: evitar duplicar un flujo con el mismo nombre o propósito idéntico en el mismo ámbito
        const existingAutos = isCreatingGlobalTenshi
          ? await Automation.find({ isTenshiFlow: true, companyId: 'TENSHI_GLOBAL' })
          : await Automation.find({
              user: userId,
              ...this._buildSafeCompanyFilter(companyId),
            });

        const duplicateAuto = existingAutos.find((a) => {
          const aNorm = this._normStr(a.name);
          if (aNorm === normFinalName) return true;
          if (newTokens.length >= 2) {
            const hits = newTokens.filter((t) => aNorm.includes(t)).length;
            if (hits / newTokens.length >= 0.75) return true;
          }
          return false;
        });
        if (duplicateAuto) {
          return JSON.stringify({
            success: true,
            yaExistia: true,
            esFlujoTenshiGlobal: Boolean(duplicateAuto.isTenshiFlow),
            mensaje: `El flujo "${duplicateAuto.name}" ya existe (ID: ${duplicateAuto._id.toString()}). No se creó un duplicado.`,
            id: duplicateAuto._id.toString(),
            nombre: duplicateAuto.name,
            estado: duplicateAuto.status
          });
        }

        let effectiveLimit = 999;
        let userPlanName = 'admin';
        let activeCount = 0;

        if (!isCreatingGlobalTenshi) {
          // Validar Plan y Límite de Automatizaciones para flujos de empresa
          const limitInfo = await this._getEffectiveAutomationLimit(userId);
          effectiveLimit = limitInfo.limit;
          userPlanName = limitInfo.plan;
          if (effectiveLimit <= 0) {
            return JSON.stringify({
              error: '🔒 Función Exclusiva de Plan PRO: Las automatizaciones de tareas periódicas e informes autónomos están disponibles únicamente en el Plan Wappy Pro. Actualiza tu suscripción a Wappy Pro para activar automatizaciones con tus agentes.',
              bloqueadoPorPlan: true,
              planActual: userPlanName
            });
          }

          activeCount = await Automation.countDocuments({
            user: userId,
            status: 'active',
            isTenshiFlow: { $ne: true },
            isSystemPreset: { $ne: true },
          });
          if (activeCount >= effectiveLimit && nuevo_estado !== 'inactive') {
            return JSON.stringify({
              error: `🔒 Límite de Automatizaciones Alcanzado: Tu plan actual (${userPlanName === 'pro' ? 'Wappy Pro' : userPlanName}) permite hasta ${effectiveLimit} automatización(es) activa(s) y ya tienes ${activeCount} configurada(s). Para habilitar más tareas periódicas en segundo plano, puedes adquirir un paquete de 5 automatizaciones adicionales por solo $25.000 COP/mes comunicándote con soporte de WAPPY.`,
              limiteAlcanzado: true,
              limiteActual: effectiveLimit,
              activas: activeCount
            });
          }
        }

        const agentInfo = isCreatingGlobalTenshi
          ? { id: 'tenshi_avatar_orchestrator', name: 'Tenshi' }
          : await this._resolveAgent(agente_objetivo, currentAgentId);

        const freq = tipo_frecuencia || 'daily';
        const scheduleConfig = {
          hour: configuracion_horario.hora !== undefined ? Number(configuracion_horario.hora) : 8,
          minute: configuracion_horario.minuto !== undefined ? Number(configuracion_horario.minuto) : 0,
          dayOfWeek: configuracion_horario.dias_semana || [1],
          dayOfMonth: configuracion_horario.dia_mes !== undefined ? Number(configuracion_horario.dia_mes) : 1,
          intervalHours: configuracion_horario.intervalo_horas !== undefined ? Number(configuracion_horario.intervalo_horas) : 1
        };

        const rawEmails = Array.isArray(correos_notificacion) ? correos_notificacion.filter(Boolean) : [];
        const dagBuilt = this._buildWorkflowNodesForCreation({
          name: finalName,
          prompt: finalPrompt,
          emails: rawEmails,
          disparadores,
          comando_tenshi,
          hitos_fuente,
          herramientas_ia,
          extractores,
          salidas,
          incluir_condicion_if,
          condicion_if,
          modelo_ia,
          isCreatingGlobalTenshi,
        });

        const finalEmails =
          rawEmails.length > 0
            ? rawEmails
            : dagBuilt.outputs.includes('email_report') && this.req?.user?.email
              ? [this.req.user.email]
              : [];

        const finalStatus = isCreatingGlobalTenshi
          ? 'active'
          : nuevo_estado === 'inactive'
            ? 'inactive'
            : 'active';

        const hasCron =
          !isCreatingGlobalTenshi &&
          hasCronTrigger({ workflowNodes: dagBuilt.workflowNodes });
        const nextRunAt =
          finalStatus === 'active' && hasCron
            ? calculateNextRun(freq, scheduleConfig)
            : null;

        const createPayload = {
          user: userId,
          companyId: isCreatingGlobalTenshi ? 'TENSHI_GLOBAL' : String(companyId),
          isSystemPreset: false,
          isTenshiFlow: isCreatingGlobalTenshi,
          adminOnly: isCreatingGlobalTenshi,
          ...(isCreatingGlobalTenshi
            ? {
                presetKey: `tenshi_flow_custom_${Date.now()}`,
                presetCategory: dagBuilt.inferredCategory || 'general',
                presetDescription: finalPrompt.substring(0, 400),
              }
            : {
                presetCategory: dagBuilt.inferredCategory || 'general',
                presetDescription: finalPrompt.substring(0, 400),
              }),
          name: finalName,
          agentId: agentInfo.id,
          agentName: agentInfo.name,
          prompt: finalPrompt,
          scheduleType: freq,
          scheduleConfig,
          workflowNodes: dagBuilt.workflowNodes,
          emails: finalEmails,
          status: finalStatus,
          nextRunAt,
        };

        const newAutomation = await Automation.create(createPayload);

        return JSON.stringify({
          success: true,
          esFlujoTenshiGlobal: isCreatingGlobalTenshi,
          mensaje: isCreatingGlobalTenshi
            ? `Flujo Global Tenshi "${newAutomation.name}" creado y activado para todos los usuarios en /tareas (comando Tenshi: "${dagBuilt.primaryVoiceCommand}").`
            : `Flujo DAG "${newAutomation.name}" creado exitosamente en /tareas (${newAutomation.status === 'active' ? 'Activo' : 'Inactivo'}, comando Tenshi: "${dagBuilt.primaryVoiceCommand}").`,
          id: newAutomation._id.toString(),
          nombre: newAutomation.name,
          estado: newAutomation.status,
          agente: agentInfo.name,
          modeloIA: dagBuilt.aiModel,
          comandoTenshi: dagBuilt.primaryVoiceCommand,
          disparadores: dagBuilt.workflowNodes.triggers,
          hitosFuente: dagBuilt.sourceHitos,
          herramientasIA: [...dagBuilt.inputs, ...dagBuilt.agentToolHitos],
          extractores: dagBuilt.extractors,
          salidas: dagBuilt.outputs,
          condicionIf: dagBuilt.includeIfNode ? dagBuilt.finalIfLabel : null,
          proximaEjecucion: newAutomation.nextRunAt
            ? new Date(newAutomation.nextRunAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
            : (finalStatus === 'active' ? 'Por comando Tenshi / evento' : 'Pausada'),
          frecuencia: freq,
          destinatarios: newAutomation.emails,
          ...(isCreatingGlobalTenshi
            ? {}
            : {
                limiteUso: `${activeCount + (newAutomation.status === 'active' ? 1 : 0)} de ${effectiveLimit} automatizaciones activas usadas.`,
              }),
        });
      }

      // ── ACCIÓN: ACTUALIZAR / ACTIVAR / DESACTIVAR / EDITAR ──────────
      if (accion === 'actualizar') {
        const hasTargetQuery = Boolean(String(automatizacion_id || '').trim() || String(nombre || '').trim());
        if (!forcedAll && !hasTargetQuery) {
          const companyAutos = await this._findCompanyAutomations(companyId, userId);
          const { flujosDisponiblesEmpresa, summaryText } = this._formatCompanyAutomationsForError(companyAutos);
          return JSON.stringify({
            error: `Debes indicar el nombre exacto o ID del flujo/automatización que deseas actualizar o activar (o indicar explícitamente "todas").${summaryText}`,
            flujosDisponiblesEmpresa,
          });
        }

        const {
          matches,
          isBulk,
          usedNameAsQuery,
          matchSource,
          matchedVoiceCommand,
          companyAutomations,
        } = await this._resolveTargetAutomations(companyId, userId, {
          automatizacion_id,
          nombre,
          forcedAll,
        });

        if (!matches || matches.length === 0) {
          const targetQuery = String(automatizacion_id || nombre || '').trim();
          // Si pidieron ACTIVAR un flujo que todavía no está en la empresa, buscar en el catálogo oficial de 30 presets y clonarlo automáticamente
          if (!forcedAll && nuevo_estado === 'active' && targetQuery) {
            const presetResult = await this._cloneAndActivateSystemPreset({
              query: targetQuery,
              companyId,
              companyName: strictCtx?.companyName || '',
              userId,
              emails: correos_notificacion,
              currentAgentId,
              executeImmediately: false,
              commandText: targetQuery,
              existingCompanyAutos: companyAutomations,
            });
            if (presetResult?.handled) {
              return presetResult.response;
            }
          }

          const { flujosDisponiblesEmpresa, summaryText } = this._formatCompanyAutomationsForError(companyAutomations);
          return JSON.stringify({
            error: `No se encontró ningún flujo/automatización que coincida con "${targetQuery || 'la solicitud'}" ni en tu empresa ni en el catálogo de 30 flujos preestablecidos.${summaryText}`,
            flujosDisponiblesEmpresa,
          });
        }

        const { limit: effectiveLimit } = await this._getEffectiveAutomationLimit(userId);
        let currentActiveCount = await Automation.countDocuments({
          user: userId,
          status: 'active',
          isTenshiFlow: { $ne: true },
          isSystemPreset: { $ne: true },
        });

        const updatedItems = [];
        for (const automation of matches) {
          if (nuevo_estado === 'active' && automation.status !== 'active') {
            if (currentActiveCount >= effectiveLimit) {
              if (!isBulk) {
                return JSON.stringify({
                  error: `🔒 No se puede activar "${automation.name}": Has alcanzado tu límite de ${effectiveLimit} automatización(es) activa(s). Pausa otra tarea primero.`,
                  limiteAlcanzado: true,
                  limiteActual: effectiveLimit,
                  activas: currentActiveCount
                });
              }
              continue;
            }
            currentActiveCount++;
          } else if (nuevo_estado === 'inactive' && automation.status === 'active') {
            currentActiveCount = Math.max(0, currentActiveCount - 1);
          }

          // Renombrar solo si se envió nuevo_nombre, o si automatizacion_id era un ObjectId real y se envió nombre distinto
          if (!isBulk) {
            if (nuevo_nombre && nuevo_nombre.trim()) {
              automation.name = nuevo_nombre.trim();
            } else if (
              nombre &&
              nombre.trim() &&
              !usedNameAsQuery &&
              this._isObjectId(automatizacion_id) &&
              this._normStr(nombre) !== this._normStr(automation.name)
            ) {
              automation.name = nombre.trim();
            }
          }

          if (prompt_a_ejecutar !== undefined && String(prompt_a_ejecutar).trim()) {
            automation.prompt = String(prompt_a_ejecutar).trim();
          }
          if (agente_objetivo !== undefined && String(agente_objetivo).trim()) {
            const agentInfo = await this._resolveAgent(agente_objetivo, currentAgentId);
            automation.agentId = agentInfo.id;
            automation.agentName = agentInfo.name;
          }
          if (tipo_frecuencia !== undefined && String(tipo_frecuencia).trim()) {
            automation.scheduleType = tipo_frecuencia;
          }
          if (configuracion_horario && Object.keys(configuracion_horario).length > 0) {
            const prevCfg = automation.scheduleConfig || {};
            automation.scheduleConfig = {
              hour: configuracion_horario.hora !== undefined ? Number(configuracion_horario.hora) : (prevCfg.hour ?? 8),
              minute: configuracion_horario.minuto !== undefined ? Number(configuracion_horario.minuto) : (prevCfg.minute ?? 0),
              dayOfWeek: configuracion_horario.dias_semana !== undefined ? configuracion_horario.dias_semana : (prevCfg.dayOfWeek ?? [1]),
              dayOfMonth: configuracion_horario.dia_mes !== undefined ? Number(configuracion_horario.dia_mes) : (prevCfg.dayOfMonth ?? 1),
              intervalHours: configuracion_horario.intervalo_horas !== undefined ? Number(configuracion_horario.intervalo_horas) : (prevCfg.intervalHours ?? 1)
            };
          }
          if (Array.isArray(correos_notificacion)) {
            automation.emails = correos_notificacion;
          }
          if (!isBulk && comando_tenshi && String(comando_tenshi).trim()) {
            const updatedNodes = automation.workflowNodes
              ? JSON.parse(JSON.stringify(automation.workflowNodes))
              : {};
            const ensured = this._ensureTriggerTenshiVoiceConfig(
              updatedNodes,
              automation.name,
              String(comando_tenshi).trim(),
            );
            automation.workflowNodes = ensured.workflowNodes;
            automation.markModified('workflowNodes');
          }
          if (nuevo_estado !== undefined) {
            automation.status = nuevo_estado;
          }

          const hasCron = hasCronTrigger(automation);
          if (automation.status === 'active' && hasCron) {
            automation.nextRunAt = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
          } else {
            automation.nextRunAt = null;
          }

          // Si se invocó mediante frase/comando de Tenshi (`matchSource === 'voiceCommand'`) y el usuario pidió activar,
          // además de dejarla Activa, poner el flujo en marcha inmediatamente en segundo plano.
          let triggeredNow = false;
          const autoTriggers = extractAutomationTriggerConfigs(automation).triggers;
          const shouldAutoDispatchTenshi =
            !isBulk &&
            nuevo_estado === 'active' &&
            matchSource === 'voiceCommand' &&
            autoTriggers.includes('trigger_tenshi') &&
            automation.lastRunStatus !== 'running';

          if (shouldAutoDispatchTenshi) {
            automation.lastRunStatus = 'running';
          }

          await automation.save();

          if (shouldAutoDispatchTenshi) {
            triggeredNow = true;
            const rawIndicaciones =
              String(instruccion_usuario || '').trim() ||
              (!this._isObjectId(nombre) ? String(nombre || '').trim() : '') ||
              matchedVoiceCommand ||
              (!this._isObjectId(automatizacion_id) ? String(automatizacion_id || '').trim() : '') ||
              automation?.name ||
              'Ejecución de flujo';
            this._dispatchCompanyAutomationWithEvents({
              runAutomation,
              automation,
              runOptions: {
                triggerSource: 'tenshi_voice',
                eventPayload: {
                  commandText: automatizacion_id || nombre || matchedVoiceCommand || '',
                  matchedVoiceCommand,
                  invokedVia: 'gestor_automatizaciones',
                  invokedAt: new Date().toISOString(),
                },
              },
              indicaciones: rawIndicaciones,
              empresa: strictCtx?.companyName || '',
              logErrorLabel: 'Error disparando flujo por voiceCommand',
            });
          }

          updatedItems.push({
            id: automation._id.toString(),
            nombre: automation.name,
            estado: automation.status,
            triggeredNow,
            matchedVoiceCommand,
            proximaEjecucion: automation.nextRunAt
              ? new Date(automation.nextRunAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
              : (hasCron ? 'Pausada / Inactiva' : 'Por evento / Comando Tenshi')
          });
        }

        if (updatedItems.length === 1) {
          const item = updatedItems[0];
          return JSON.stringify({
            success: true,
            triggeredNow: Boolean(item.triggeredNow),
            matchedVoiceCommand: item.matchedVoiceCommand || null,
            mensaje: item.triggeredNow
              ? `Flujo "${item.nombre}" activado y puesto en marcha inmediatamente por comando Tenshi ("${item.matchedVoiceCommand}").`
              : `Tarea "${item.nombre}" actualizada correctamente (Estado: ${item.estado === 'active' ? 'Activa' : 'Inactiva'}).`,
            id: item.id,
            nombre: item.nombre,
            estado: item.estado,
            proximaEjecucion: item.proximaEjecucion
          });
        }

        return JSON.stringify({
          success: true,
          mensaje: `Se actualizaron ${updatedItems.length} tareas/automatizaciones correctamente.`,
          totalActualizadas: updatedItems.length,
          automatizaciones: updatedItems
        });
      }

      // ── ACCIÓN: EJECUTAR AHORA (TEST RUN / TENSHI VOICE TRIGGER) ────
      if (accion === 'ejecutar_ahora') {
        const hasExecQuery = Boolean(
          String(automatizacion_id || '').trim() ||
            String(nombre || '').trim() ||
            String(instruccion_usuario || '').trim(),
        );
        if (!hasExecQuery) {
          const companyAutos = await this._findCompanyAutomations(companyId, userId);
          const { flujosDisponiblesEmpresa, summaryText } = this._formatCompanyAutomationsForError(companyAutos);
          return JSON.stringify({
            error: `Debes indicar el nombre exacto o ID del flujo/automatización que deseas ejecutar.${summaryText}`,
            origenFlujo: 'flujo_propio_empresa',
            flujosDisponiblesEmpresa,
          });
        }

        const {
          matches,
          matchSource,
          matchedVoiceCommand,
          companyAutomations,
        } = await this._resolveTargetAutomations(companyId, userId, {
          automatizacion_id,
          nombre: nombre || (!automatizacion_id ? instruccion_usuario : ''),
        });
        const automation = matches[0];
        if (!automation) {
          const fallbackQuery = String(automatizacion_id || nombre || instruccion_usuario || '').trim();
          if (fallbackQuery) {
            // Fallback transparente a Flujos Globales Tenshi si la empresa no tiene un flujo propio que coincida con score >= 55
            const activeFlows = await listActiveTenshiFlows();
            const matchRes = await matchTenshiFlowByQuery(fallbackQuery, activeFlows);
            if (matchRes?.flow) {
              return await this._executeMatchedTenshiFlow({
                flow: matchRes.flow,
                strictCtx,
                userInstruction: instruccion_usuario || nombre || automatizacion_id || '',
                esperar_resultado: esperar_resultado !== false,
                attachedMedia: this.req?.__tenshiAttachedMedia || null,
                fallbackFromOwnFlow: true,
              });
            }

            // Si no es un Flujo Tenshi global ni existe aún en la empresa, intentar clonar y ejecutar desde los 30 presets oficiales
            const presetResult = await this._cloneAndActivateSystemPreset({
              query: fallbackQuery,
              companyId,
              companyName: strictCtx?.companyName || '',
              userId,
              emails: correos_notificacion,
              currentAgentId,
              executeImmediately: true,
              commandText: fallbackQuery,
              existingCompanyAutos: companyAutomations,
            });
            if (presetResult?.handled) {
              return presetResult.response;
            }
          }

          const { flujosDisponiblesEmpresa, summaryText } = this._formatCompanyAutomationsForError(companyAutomations);
          return JSON.stringify({
            error: `No se encontró la tarea/automatización "${automatizacion_id || nombre || ''}" ni en tu empresa ni en los 30 flujos preestablecidos para ejecutar.${summaryText}`,
            origenFlujo: 'flujo_propio_empresa',
            flujosDisponiblesEmpresa,
          });
        }

        return await this._executeCompanyAutomation({
          automation,
          companyId,
          companyName: strictCtx?.companyName || '',
          userId,
          matchSource,
          matchedVoiceCommand,
          automatizacion_id,
          nombre,
          instruccion_usuario,
          redirectedFromTenshi: false,
        });
      }

      // ── ACCIÓN: DETENER ─────────────────────────────────────────────
      if (accion === 'detener') {
        const { matches, missingTarget, companyAutomations } = await this._resolveTargetAutomations(companyId, userId, {
          automatizacion_id,
          nombre
        });
        const automation = matches[0];
        if (!automation) {
          const { flujosDisponiblesEmpresa, summaryText } = this._formatCompanyAutomationsForError(companyAutomations);
          return JSON.stringify({
            error: missingTarget
              ? `Debes indicar el nombre exacto o ID de la tarea/automatización a detener.${summaryText}`
              : `No se encontró la tarea/automatización "${automatizacion_id || nombre || ''}" para detener.${summaryText}`,
            flujosDisponiblesEmpresa,
          });
        }
        if (typeof stopAutomation === 'function') {
          await stopAutomation(automation._id.toString());
        } else {
          await Automation.updateOne({ _id: automation._id, ...this._buildSafeCompanyFilter(companyId) }, { $set: { lastRunStatus: 'stopped' } });
        }
        return JSON.stringify({
          success: true,
          id: automation._id.toString(),
          nombre: automation.name,
          mensaje: `Ejecución de la tarea "${automation.name}" detenida correctamente.`
        });
      }

      // ── ACCIÓN: ELIMINAR / ELIMINAR TODAS ───────────────────────────
      if (accion === 'eliminar') {
        const { matches, missingTarget, companyAutomations } = await this._resolveTargetAutomations(companyId, userId, {
          automatizacion_id,
          nombre,
          forcedAll
        });

        if (!matches || matches.length === 0) {
          const { flujosDisponiblesEmpresa, summaryText } = this._formatCompanyAutomationsForError(companyAutomations);
          return JSON.stringify({
            error: missingTarget
              ? `Debes indicar el nombre exacto o ID de la tarea/automatización a eliminar (o indicar explícitamente "todas").${summaryText}`
              : `No se encontró ninguna tarea/automatización que coincida con "${automatizacion_id || nombre || ''}" para eliminar.${summaryText}`,
            flujosDisponiblesEmpresa,
          });
        }

        const ids = matches.map((m) => m._id);
        const names = matches.map((m) => m.name);

        await Automation.deleteMany({ _id: { $in: ids }, ...this._buildSafeCompanyFilter(companyId) });
        await AutomationLog.deleteMany({ automation: { $in: ids }, companyId: String(companyId) });

        return JSON.stringify({
          success: true,
          totalEliminadas: ids.length,
          eliminadas: names,
          mensaje:
            ids.length === 1
              ? `Tarea automatizada "${names[0]}" eliminada exitosamente junto con su historial.`
              : `Se eliminaron ${ids.length} tareas/automatizaciones exitosamente: ${names.join(', ')}.`
        });
      }

      // ── ACCIÓN: VER LOGS / HISTORIAL ────────────────────────────────
      if (accion === 'ver_logs') {
        const query = { companyId: String(companyId) };
        if (automatizacion_id || nombre) {
          const { matches } = await this._resolveTargetAutomations(companyId, userId, {
            automatizacion_id,
            nombre
          });
          if (matches.length > 0) {
            query.automation = matches[0]._id;
          }
        }

        const logs = await AutomationLog.find(query)
          .sort({ runAt: -1 })
          .limit(10)
          .lean();

        if (!logs || logs.length === 0) {
          return JSON.stringify({
            mensaje: 'No hay registros de ejecuciones previas para mostrar.',
            logs: []
          });
        }

        const formattedLogs = logs.map((l) => {
          const isMaskedTenshi = l.isTenshiFlow === true && !isAdminUser;
          const displayFlow = isMaskedTenshi
            ? (l.userInstruction || l.tenshiFlowName || 'Flujo ejecutado con Tenshi')
            : (l.tenshiFlowName || l.agentName || 'Automatización');
          return {
            id: l._id.toString(),
            flujo: displayFlow,
            agente: l.agentName,
            esFlujoTenshi: Boolean(l.isTenshiFlow),
            fechaEjecucion: new Date(l.runAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
            estado: l.status,
            resultadoResumido: l.result ? l.result.substring(0, 200) + '...' : (l.error || 'Sin detalles'),
            conversacionId: l.conversationId || null,
          };
        });

        return JSON.stringify({
          mensaje: `Se recuperaron ${logs.length} ejecuciones recientes.`,
          logs: formattedLogs
        });
      }

      return JSON.stringify({
        error: `Acción no reconocida "${rawAccion}". Las acciones válidas son: ejecutar_tenshi, consultar_documentacion_nodos, crear, listar, actualizar, activar, desactivar, eliminar, ejecutar_ahora, detener, ver_logs.`
      });

    } catch (error) {
      console.error('[GestorAutomatizaciones Tool] Error general:', error);
      return JSON.stringify({
        error: 'Ocurrió un error al procesar la solicitud de automatización.',
        detalle: error.message
      });
    }
  }
}

module.exports = GestorAutomatizaciones;
