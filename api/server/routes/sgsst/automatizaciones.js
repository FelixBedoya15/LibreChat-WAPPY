const express = require('express');
const router = express.Router();
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const CompanyInfo = require('~/models/CompanyInfo');
const Automation = require('~/models/Automation');
const AutomationLog = require('~/models/AutomationLog');
const { Agent } = require('~/db/models');
const {
  runAutomation,
  runWorkflowSandboxSimulation,
  calculateNextRun,
  stopAutomation,
} = require('~/server/services/automationScheduler');
const { inspectNodeLiveData } = require('~/server/services/workflowNodeInspectorService');

const UserPlan = require('~/db/models/UserPlan');

router.use(requireJwtAuth);

// Bloquear acceso a sub-usuarios: las automatizaciones son exclusivas de la cuenta principal de la empresa
router.use((req, res, next) => {
  if (req.user?.isSubUser) {
    return res.status(403).json({ error: 'Los sub-usuarios no tienen permisos para gestionar o ejecutar automatizaciones.' });
  }
  next();
});

// Tareas (antes "Automatizaciones IA"): EXCLUSIVO para Administradores y cuentas Wappy Pro
router.use(async (req, res, next) => {
  try {
    const role = req.user?.role;
    if (role === 'ADMIN' || role === 'USER_PRO' || role === 'PRO') {
      return next();
    }
    const userPlanDoc = await UserPlan.findOne({ userId: req.user?.id }).select('plan').lean();
    if (['pro', 'admin'].includes(userPlanDoc?.plan)) {
      return next();
    }
    return res.status(403).json({
      error: 'La sección Tareas (automatizaciones de agentes IA) es exclusiva para Administradores y cuentas Wappy Pro.',
    });
  } catch (err) {
    console.error('[API Automatizaciones] Error verificando plan:', err);
    return res.status(500).json({ error: 'No fue posible verificar el plan del usuario.' });
  }
});

// Auxiliar para obtener el ID de la empresa activa del usuario
async function getActiveCompanyId(userId) {
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id.toString() : null;
}

// Catálogo oficial de Tareas Preestablecidas del Sistema (Flujos Autónomos de WAPPY IA)
const DEFAULT_SYSTEM_PRESETS = [
  {
    presetKey: 'preset_vencimientos_emo_epp',
    presetCategory: 'salud_vencimientos',
    name: 'Alerta Temprana de Vencimientos: Exámenes Médicos (EMO), Alturas y EPP',
    presetDescription:
      'Audita diariamente los expedientes del Hito 2 y Hito 3 para detectar Exámenes Médicos Ocupacionales, cursos de Trabajo en Alturas (Res. 4272) y entregas de EPP próximos a vencer (30, 15 y 0 días), creando tareas ACPM y enviando consolidado por correo.',
    agentTargetName: 'Médico Laboral',
    scheduleType: 'daily',
    scheduleConfig: { hour: 7, minute: 0, dayOfWeek: [1], dayOfMonth: 1, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      inputs: ['somos_sst_trabajadores', 'google_sheets'],
      hitos: ['hito2_perfil_socio', 'hito3_epp', 'hito3_alturas'],
      outputs: ['acpm_task', 'google_calendar', 'email_report'],
    },
    prompt:
      'Ejecuta una auditoría preventiva de vencimientos sobre la empresa activa usando la herramienta somos_sst (acciones listar_trabajadores y consultar_expediente_integral). Revisa en el Hito 2 (Perfil Sociodemográfico y Exámenes Médicos Ocupacionales) y en el Hito 3 (Entregas de EPP y Certificados de Trabajo en Alturas - Res. 4272) qué colaboradores tienen exámenes periódicos, reentrenamientos de alturas o dotación/EPP vencidos o próximos a vencer en los siguientes 30 días. Si existen casos reales vencidos o próximos a vencer, registra una actividad de seguimiento en el Centro de Control ACPM (crear_actividad_acpm) y entrega una tabla Markdown ejecutiva con Nombre, Cédula, Cargo, Ítem por vencer y Fecha.',
  },
  {
    presetKey: 'preset_drive_sociodemografico_emo',
    presetCategory: 'drive_sincronizacion',
    name: 'Sincronizar Carpeta Google Drive ➔ Perfil Sociodemográfico y Conceptos Médicos',
    presetDescription:
      'Vigila tu carpeta de Google Drive de Talento Humano / SST, lee hojas de cálculo o PDFs nuevos de encuestas sociodemográficas y conceptos de aptitud médica, e inyecta las actualizaciones en Somos SST (Hito 2).',
    agentTargetName: 'Médico Laboral',
    scheduleType: 'daily',
    scheduleConfig: { hour: 18, minute: 0, dayOfWeek: [1], dayOfMonth: 1, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi', 'trigger_email'],
      inputs: ['google_drive', 'google_sheets'],
      hitos: ['hito2_perfil_socio', 'hito2_perfiles_cargo'],
      outputs: ['somos_sst_update', 'email_report'],
    },
    prompt:
      'Conéctate a mi Google Drive usando la herramienta google_drive (list_files_and_folders y read_document_content) y revisa la carpeta o archivos recientes de "Perfil Sociodemográfico" y "Condiciones de Salud / Exámenes Médicos". Si Google Drive no está vinculado a esta empresa o no existen archivos nuevos reales, infórmalo de inmediato y detén el proceso sin simular ni inventar datos. Si existen documentos reales nuevos o actualizados (Excel, Google Sheets o PDF), identifica qué trabajadores tienen información nueva o modificada y ejecuta la herramienta somos_sst (acciones alimentar_sociodemografico_masivo, importar_sociodemografico_drive o actualizar_examen_medico) exclusivamente para esta empresa. Al finalizar, entrégame un resumen en Markdown de los archivos reales leídos y los trabajadores actualizados.',
  },
  {
    presetKey: 'preset_drive_atel_inspecciones',
    presetCategory: 'atel_inspecciones',
    name: 'Triaje de Reportes ATEL (FURAT), Inspecciones de Campo y Actos Inseguros',
    presetDescription:
      'Revisa reportes nuevos de accidentes/incidentes laborales (FURAT) y checklists de inspecciones en Google Drive o Gmail, los registra en el aplicativo ATEL (Hito 7) y abre acciones correctivas ACPM (Hito 4).',
    agentTargetName: 'Consultor SG-SST',
    scheduleType: 'daily',
    scheduleConfig: { hour: 7, minute: 30, dayOfWeek: [1], dayOfMonth: 1, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_email', 'trigger_qr_worker'],
      inputs: ['google_drive', 'google_gmail', 'consultar_analitica_actos_condiciones'],
      hitos: ['hito7_investigacion_atel', 'hito4_actos_condiciones', 'hito7_acpm'],
      outputs: ['somos_sst_update', 'acpm_task', 'email_report'],
    },
    prompt:
      'Revisa en Google Drive (usando google_drive: list_files_and_folders y read_document_content) los archivos o carpetas donde se suban reportes de Accidentes/Incidentes de Trabajo (FURAT/ATEL), Inspecciones de Seguridad o Reportes de Actos y Condiciones Inseguras. Si Google Drive no está vinculado a esta empresa o no existen archivos nuevos reales, infórmalo con total transparencia y detén el proceso sin simular ni inventar datos ni crear nuevas tareas programadas. Solo cuando detectes un archivo real nuevo o actualizado en Drive: 1) Si contiene un accidente o incidente laboral nuevo, extrae los datos reales del evento y regístralo en el aplicativo de Accidentes ATEL de Somos SST usando somos_sst (acción registrar_accidente_atel). 2) Si contiene actos/condiciones inseguras o hallazgos reales de inspecciones, aliméntalos en el aplicativo correspondiente de Somos SST y crea la acción correctiva en ACPM. Genera un informe en Markdown únicamente con los archivos reales procesados.',
  },
  {
    presetKey: 'preset_radar_matriz_legal',
    presetCategory: 'legal_cumplimiento',
    name: 'Radar Normativo Semanal MinTrabajo / SUIN-Juriscol ➔ Matriz Legal y RIT',
    presetDescription:
      'Busca en vivo en la web nuevas leyes, decretos, resoluciones y circulares del Ministerio del Trabajo aplicables al código CIIU y riesgos de tu empresa, actualizando la Matriz Legal (Hito 1).',
    agentTargetName: 'Abogado Laboral',
    scheduleType: 'weekly',
    scheduleConfig: { hour: 8, minute: 0, dayOfWeek: [1], dayOfMonth: 1, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      inputs: ['web_search', 'somos_sst_empresa'],
      hitos: ['hito1_matriz_legal', 'hito1_rit'],
      outputs: ['somos_sst_update', 'google_docs', 'email_report'],
    },
    prompt:
      'Consulta primero la actividad económica, CIIU y nivel de riesgo de la empresa activa con somos_sst (consultar_informacion_empresa). Luego utiliza obligatoriamente la herramienta web_search para investigar en fuentes oficiales colombianas (Ministerio del Trabajo, SUIN-Juriscol, Función Pública, Corte Constitucional) si se han expedido nuevas leyes, decretos, resoluciones o circulares recientes en materia de Seguridad y Salud en el Trabajo o derecho laboral aplicables a la empresa. Si identificas normativa aplicable que no esté registrada en la Matriz Legal del Hito 1, actualízala mediante somos_sst (editar_cualquier_aplicativo: "matriz_legal") y genera un boletín jurídico ejecutivo en Markdown con el análisis de impacto.',
  },
  {
    presetKey: 'preset_pesv_parque_automotor',
    presetCategory: 'riesgos_vial_quimico',
    name: 'Control Preoperacional PESV y Vencimientos de SOAT / Tecnomecánica / Licencias',
    presetDescription:
      'Audita la Matriz PESV (Res. 20223040040595) y el Parque Automotor (Hito 3) verificando vencimientos de SOAT, revisión técnico-mecánica, mantenimientos preventivos y riesgos viales críticos.',
    agentTargetName: 'Coordinador de Seguridad Vial',
    scheduleType: 'weekly',
    scheduleConfig: { hour: 7, minute: 0, dayOfWeek: [1, 5], dayOfMonth: 1, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_qr_worker', 'trigger_tenshi'],
      inputs: ['matriz_pesv', 'google_drive'],
      hitos: ['hito3_matriz_pesv', 'hito3_vehiculos'],
      outputs: ['somos_sst_update', 'acpm_task', 'email_report'],
    },
    prompt:
      'Consulta la Matriz PESV con la herramienta matriz_pesv (acción leer) y el aplicativo de Parque Automotor y Vehículos con somos_sst (resumen_empresa / consultar_informacion_empresa). Verifica: 1) Qué vehículos o conductores presentan SOAT, revisión técnico-mecánica o mantenimientos preventivos vencidos o próximos a vencer; 2) Qué riesgos viales en la Matriz PESV tienen calificación crítica (>= 12, NO ACEPTABLE) sin plan de acción cerrado. Si encuentras hallazgos reales, registra las tareas preventivas en el Centro de Control ACPM y entrega un reporte ejecutivo vial en Markdown.',
  },
  {
    presetKey: 'preset_quimicos_sga_pubchem',
    presetCategory: 'riesgos_vial_quimico',
    name: 'Auditoría de Inventario Químico SGA, Fichas FDS (16 Secciones) y PubChem NIH',
    presetDescription:
      'Cruza el inventario de sustancias químicas (Hito 3) con PubChem (NIH) y el Decreto 1496 SGA para detectar productos sin FDS vigente, sin etiquetado o con incompatibilidades de almacenamiento.',
    agentTargetName: 'Ingeniero Químico SST',
    scheduleType: 'monthly',
    scheduleConfig: { hour: 8, minute: 30, dayOfWeek: [1], dayOfMonth: 1, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_agent'],
      inputs: ['matriz_compatibilidad', 'consultar_pubchem_quimico'],
      hitos: ['hito3_quimicos_sga', 'hito2_matriz_ipevar'],
      outputs: ['somos_sst_update', 'acpm_task', 'email_report'],
    },
    prompt:
      'Lee el inventario actual de productos químicos de la empresa usando la herramienta matriz_compatibilidad (acción leer). Para cada sustancia registrada, verifica si cuenta con Ficha de Datos de Seguridad (FDS de 16 secciones), rótulo SGA (Decreto 1496 de 2018) y evalúa posibles incompatibilidades críticas de almacenamiento según su Clase ONU (ej. inflamables Clase 3 junto a comburentes Clase 5, o ácidos junto a bases en Clase 8). Entrega un dictamen técnico en Markdown con las alertas encontradas.',
  },
  {
    presetKey: 'preset_clima_emergencias_alturas',
    presetCategory: 'riesgos_vial_quimico',
    name: 'Pronóstico Climático SST (OpenWeather) y Alerta para Trabajo en Alturas / Campo',
    presetDescription:
      'Consulta cada mañana el clima en tiempo real (OpenWeather: lluvia, tormenta eléctrica, viento, índice UV y estrés térmico) en la sede de tu empresa y emite alertas para Trabajo en Alturas y brigadas.',
    agentTargetName: 'Especialista en Riesgo Climático',
    scheduleType: 'daily',
    scheduleConfig: { hour: 6, minute: 30, dayOfWeek: [1, 2, 3, 4, 5, 6], dayOfMonth: 1, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      inputs: ['pronostico_clima_sst', 'buscar_centros_emergencia'],
      hitos: ['hito3_alturas', 'hito3_ats', 'hito6_vulnerabilidad'],
      outputs: ['email_report', 'acpm_task'],
    },
    prompt:
      'Consulta la ciudad y dirección de la empresa activa mediante somos_sst (consultar_informacion_empresa) y obtén el pronóstico meteorológico y de alertas SST en vivo para esa ubicación. Evalúa el impacto de lluvia, vientos fuertes, tormentas eléctricas, radiación UV o temperatura extrema sobre las operaciones del día (especialmente Permisos de Trabajo en Alturas del Hito 3, Análisis de Trabajo Seguro ATS y labores a cielo abierto). Entrega un boletín matutino preventivo en Markdown con controles obligatorios para la jornada.',
  },
  {
    presetKey: 'preset_ergonomia_owas_medlineplus',
    presetCategory: 'salud_vencimientos',
    name: 'Vigilancia Osteomuscular (OWAS / Estudio de Puesto) y Guías MedlinePlus NIH',
    presetDescription:
      'Revisa las evaluaciones ergonómicas OWAS, Estudios de Puesto de Trabajo (EPT) y restricciones médicas osteomusculares, integrando guías clínicas de MedlinePlus (NIH) para pausas y readaptación.',
    agentTargetName: 'Fisioterapeuta Laboral',
    scheduleType: 'weekly',
    scheduleConfig: { hour: 9, minute: 0, dayOfWeek: [3], dayOfMonth: 1, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_agent'],
      inputs: ['consultar_medlineplus_rehabilitacion', 'somos_sst_trabajadores'],
      hitos: ['hito3_owas', 'hito3_estudio_puesto', 'hito2_perfil_socio'],
      outputs: ['somos_sst_update', 'email_report'],
    },
    prompt:
      'Consulta en somos_sst los trabajadores con restricciones o recomendaciones médicas osteomusculares, así como los hallazgos en los aplicativos de Evaluación Ergonómica OWAS y Estudio de Puesto de Trabajo (Hito 3). Elabora un informe semanal de vigilancia epidemiológica biomecánica en Markdown con recomendaciones de ingeniería, higiene postural y seguimiento por trabajador.',
  },
  {
    presetKey: 'preset_psicosocial_ccl_bienestar',
    presetCategory: 'salud_vencimientos',
    name: 'Termómetro Semanal de Riesgo Psicosocial, Clima Laboral y Alertas Burnout',
    presetDescription:
      'Analiza las métricas agregadas de estado de ánimo, fatiga y riesgo psicosocial (Res. 2764) en WAPPY y genera recomendaciones de intervención para el Comité de Convivencia Laboral (Hito 4).',
    agentTargetName: 'Psicólogo SST',
    scheduleType: 'weekly',
    scheduleConfig: { hour: 16, minute: 0, dayOfWeek: [5], dayOfMonth: 1, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      inputs: ['consultar_analitica_psicosocial', 'somos_sst_empresa'],
      hitos: ['hito4_psicosocial', 'hito4_comites'],
      outputs: ['acpm_task', 'email_report'],
    },
    prompt:
      'Ejecuta la herramienta consultar_analitica_psicosocial para evaluar el comportamiento emocional, niveles de estrés, fatiga y clima laboral reportados en la empresa activa. Con base en la Resolución 2764 de 2022 y la Ley 1016, entrega un informe ejecutivo confidencial en Markdown con tendencias detectadas y acciones preventivas sugeridas para el Comité de Convivencia Laboral (CCL) en el Hito 4.',
  },
  {
    presetKey: 'preset_capacitaciones_lms_notebooklm',
    presetCategory: 'drive_sincronizacion',
    name: 'Seguimiento del Programa Anual de Capacitaciones, Academia LMS y NotebookLM',
    presetDescription:
      'Cruza el avance del Programa Anual de Capacitaciones (Hito 5) y los cursos en Academia WAPPY LMS, apoyándose en Google NotebookLM para preparar recordatorios y material pedagógico.',
    agentTargetName: 'Coordinador de Capacitaciones',
    scheduleType: 'weekly',
    scheduleConfig: { hour: 8, minute: 0, dayOfWeek: [2], dayOfMonth: 1, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      inputs: ['notebooklm', 'cursos_lms', 'google_calendar'],
      hitos: ['hito5_capacitaciones', 'hito2_cronograma'],
      outputs: ['somos_sst_update', 'google_slides', 'email_report'],
    },
    prompt:
      'Consulta en somos_sst (resumen_empresa) el estado del Programa Anual de Capacitaciones (Hito 5) y del Cronograma Anual de Actividades (Hito 2). Identifica qué capacitaciones están pendientes o programadas para el mes en curso, calcula el indicador de cobertura y cumplimiento formativo y entrega un resumen ejecutivo en Markdown con las sesiones prioritarias a convocar.',
  },
  {
    presetKey: 'preset_auditoria_0312_alta_direccion',
    presetCategory: 'gerencia_auditoria',
    name: 'Informe Ejecutivo 360° de Cumplimiento Res. 0312, Cronograma Kanban y Alta Dirección',
    presetDescription:
      'Consolida al cierre de cada mes el puntaje de Estándares Mínimos (Res. 0312), avance de los 7 Hitos, Matriz IPEVAR GTC-45, indicadores ATEL y cierre de ACPM para Revisión por la Alta Dirección.',
    agentTargetName: 'Auditor SG-SST',
    scheduleType: 'monthly',
    scheduleConfig: { hour: 17, minute: 0, dayOfWeek: [1], dayOfMonth: 28, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi', 'trigger_agent'],
      inputs: ['somos_sst_empresa', 'matriz_ipevar', 'google_sheets'],
      hitos: ['hito1_diagnostico_0312', 'hito2_cronograma', 'hito7_auditoria', 'hito7_alta_direccion'],
      outputs: ['canvas_doc', 'google_docs', 'email_report'],
    },
    prompt:
      'Realiza una auditoría integral de cierre mensual sobre la empresa activa utilizando somos_sst (resumen_empresa y consultar_centro_control_acpm) y matriz_ipevar (leer). Consolida en un Informe Gerencial en Markdown para la Alta Dirección: 1) Puntaje actual del Diagnóstico de Estándares Mínimos (Resolución 0312 de 2019); 2) Avance del Cronograma Anual y Plan de Trabajo; 3) Peligros prioritarios en Matriz GTC-45; 4) Estado de acciones correctivas, preventivas y de mejora (ACPM); y 5) Top 5 prioridades estratégicas para el próximo mes.',
  },
  {
    presetKey: 'preset_antigravity_cloud_bridge',
    presetCategory: 'gerencia_auditoria',
    name: 'Auditoría Documental Cross-Cloud (Google Drive / OneDrive / Buk ➔ 7 Hitos Somos SST)',
    presetDescription:
      'Verifica semanalmente la trazabilidad entre tus repositorios en la nube (Google Drive / OneDrive), novedades de personal y los soportes exigidos en los 7 Hitos de Somos SST.',
    agentTargetName: 'Consultor SG-SST',
    scheduleType: 'weekly',
    scheduleConfig: { hour: 9, minute: 0, dayOfWeek: [1], dayOfMonth: 1, intervalHours: 1 },
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_antigravity_cloud', 'trigger_antigravity', 'trigger_webhook'],
      aiEngine: 'antigravity_cloud',
      aiModel: 'gemini-3.6-flash',
      inputs: ['google_drive', 'one_drive', 'google_antigravity_cloud', 'google_antigravity', 'webhook_api'],
      hitos: ['hito1_diagnostico_0312', 'hito2_perfil_socio', 'hito7_acpm'],
      outputs: ['somos_sst_update', 'google_sheets', 'email_report'],
    },
    prompt:
      'Audita el estado general de los 7 Hitos del SG-SST en la empresa activa mediante somos_sst (resumen_empresa) y verifica si existen brechas de documentación o registros pendientes en los aplicativos críticos (Política, Matriz Legal, Diagnóstico 0312, Perfil Sociodemográfico, Matriz GTC-45, PESV, Químicos, Comités, Capacitaciones y ATEL). Entrega un tablero de control en Markdown indicando el estado de completitud por Hito y las acciones inmediatas recomendadas.',
  },
];

async function ensureDefaultSystemPresets() {
  try {
    const allAgents = await Agent.find({}).select('id name').lean();
    const resolveAgentForPreset = (targetName) => {
      if (!allAgents || allAgents.length === 0) {
        return { id: 'agent_consultor_sg_sst', name: targetName || 'Consultor SG-SST' };
      }
      const exact = allAgents.find((a) => a.name && a.name.toLowerCase() === String(targetName).toLowerCase());
      if (exact) return { id: exact.id, name: exact.name };
      const partial = allAgents.find((a) => a.name && a.name.toLowerCase().includes(String(targetName).toLowerCase()));
      if (partial) return { id: partial.id, name: partial.name };
      const consultor = allAgents.find((a) => /Consultor SG-SST/i.test(a.name));
      if (consultor) return { id: consultor.id, name: consultor.name };
      return { id: allAgents[0].id, name: allAgents[0].name };
    };

    for (const preset of DEFAULT_SYSTEM_PRESETS) {
      const existing = await Automation.findOne({
        isSystemPreset: true,
        presetKey: preset.presetKey,
      }).lean();

      if (!existing) {
        const ag = resolveAgentForPreset(preset.agentTargetName);
        await Automation.create({
          companyId: 'SYSTEM_PRESET',
          isSystemPreset: true,
          presetKey: preset.presetKey,
          presetCategory: preset.presetCategory,
          presetDescription: preset.presetDescription,
          name: preset.name,
          agentId: ag.id,
          agentName: ag.name,
          prompt: preset.prompt,
          scheduleType: preset.scheduleType,
          scheduleConfig: preset.scheduleConfig,
          workflowNodes: preset.workflowNodes,
          emails: [],
          status: 'inactive',
          nextRunAt: null,
        });
      } else if (
        !Array.isArray(existing.workflowNodes?.triggers) ||
        existing.workflowNodes.triggers.length === 0 ||
        existing.workflowNodes?.trigger === 'drive_folder_watch' ||
        existing.workflowNodes?.trigger === 'sgsst_db_audit'
      ) {
        await Automation.updateOne(
          { _id: existing._id },
          {
            $set: {
              'workflowNodes.trigger': preset.workflowNodes.trigger,
              'workflowNodes.triggers': preset.workflowNodes.triggers,
            },
          }
        );
      }
    }
  } catch (err) {
    console.error('[API Automatizaciones] Error asegurando Tareas Preestablecidas del Sistema:', err);
  }
}
async function ensureAdminSampleAutomations(user, companyId, force = false) {
  if (!user || user.role !== 'ADMIN' || !companyId) return;
  if (!force) {
    const existingCount = await Automation.countDocuments({ companyId });
    if (existingCount > 0) return;
  } else {
    // Si fuerza recarga desde el botón Admin, reemplazamos los ejemplos previos [Ejemplo Admin]
    const oldSamples = await Automation.find({
      companyId,
      name: /^\[Ejemplo Admin\]/i,
    }).select('_id').lean();
    if (oldSamples.length > 0) {
      const oldIds = oldSamples.map((s) => s._id);
      await AutomationLog.deleteMany({ automation: { $in: oldIds } });
      await Automation.deleteMany({ _id: { $in: oldIds } });
    }
  }

  try {
    const medicoAgent = await Agent.findOne({ name: /Médico Laboral|Consultor SG-SST/i }).select('id name').lean();
    const consultorAgent = await Agent.findOne({ name: /Consultor SG-SST/i }).select('id name').lean();

    const agent1Id = medicoAgent?.id || 'agent_medico_laboral';
    const agent1Name = medicoAgent?.name || 'Médico Laboral';
    const agent2Id = consultorAgent?.id || 'agent_consultor_sg_sst';
    const agent2Name = consultorAgent?.name || 'Consultor SG-SST';
    const adminEmail = user.email ? [user.email] : ['admin@wappy.club'];

    const sample1RunAt = new Date(Date.now() - 2 * 3600 * 1000);
    const sample2RunAt = new Date(Date.now() - 14 * 3600 * 1000);

    const sample1Result = `### 📂 Sincronización Google Drive → Perfil Sociodemográfico y Exámenes Médicos (Somos SST)

**Carpeta vigilada en Google Drive:** \`SG-SST / Perfil Sociodemográfico y EMO\`
**Herramientas ejecutadas:** \`google_drive\` (\`list_files_and_folders\`, \`read_document_content\`) → \`somos_sst\` (\`alimentar_sociodemografico_masivo\`, \`actualizar_examen_medico\`)

| Archivo Detectado en Drive | Novedad Identificada | Aplicativo Alimentado en WAPPY | Estado de Sincronización |
| :--- | :--- | :--- | :---: |
| \`Actualizacion_Sociodemografica_Octubre.xlsx\` | 4 colaboradores actualizaron dirección, EPS, turno de trabajo y contacto de emergencia | **Hito 2: Perfil Sociodemográfico y Condiciones de Salud** | ✅ Sincronizado (4 perfiles actualizados) |
| \`Concepto_Aptitud_Carlos_Ramirez.pdf\` | Examen médico periódico con recomendación ergonómica postural | **Hito 2: Seguimiento de Exámenes Médicos Ocupacionales** | ✅ Registrado + Alerta en Centro de Control |

> **Dictamen del Agente:** Se compararon las marcas de tiempo y cédulas contra la base de datos de **Somos SST**. Los 4 expedientes modificados en el archivo de Drive y el concepto médico ocupacional ya quedaron asentados automáticamente en los aplicativos correspondientes sin duplicar registros.`;

    const sample2Result = `### 🚨 Vigilancia de Carpeta Drive → Aplicativos de Accidentes (ATEL), Inspecciones y Actos Inseguros

**Carpeta vigilada en Google Drive:** \`SG-SST / Reportes de Campo, Inspecciones y ATEL\`
**Herramientas ejecutadas:** \`google_drive\` (\`list_files_and_folders\`, \`read_document_content\`) → \`somos_sst\` (\`registrar_accidente_atel\`, \`editar_cualquier_aplicativo\`, \`crear_actividad_acpm\`)

* **1. Reporte de Accidente / Incidente detectado:** \`FURAT_Preliminar_Bodega_Norte.pdf\`
  * **Acción ejecutada en WAPPY:** Se extrajo la información del suceso (lesión leve en mano derecha por manipulación de estiba, 2 días de incapacidad) y se alimentó automáticamente el **Aplicativo de Investigación de Accidentes e Incidentes (ATEL — Hito 7)** mediante \`registrar_accidente_atel\`.
* **2. Reporte de Actos y Condiciones Inseguras:** \`Inspeccion_Locativa_y_Actos_Semana42.xlsx\`
  * **Acción ejecutada en WAPPY:** Se identificaron 2 condiciones locativas (cableado expuesto en pasillo 3 y extintor multipropósito despresurizado) y se inyectaron en el **Aplicativo de Reporte de Actos y Condiciones Inseguras (Hito 4)** y **Plan de Acción ACPM (Centro de Control)**.

\`\`\`wappy-card
{
  "title": "Automatización Drive → Aplicativos WAPPY Completada",
  "subtitle": "2 archivos nuevos procesados e inyectados en Somos SST",
  "items": [
    {
      "title": "Aplicativo ATEL (Hito 7)",
      "description": "1 nuevo caso de accidente de trabajo registrado desde FURAT_Preliminar_Bodega_Norte.pdf."
    },
    {
      "title": "Aplicativo Actos y Condiciones + ACPM (Hito 4)",
      "description": "2 hallazgos locativos cargados desde Inspeccion_Locativa_y_Actos_Semana42.xlsx con tarea correctiva asignada."
    }
  ]
}
\`\`\``;

    const auto1 = await Automation.create({
      user: user.id,
      companyId,
      name: '[Ejemplo Admin] Vigilar Drive y Alimentar Perfil Sociodemográfico y Exámenes en Somos SST',
      agentId: agent1Id,
      agentName: agent1Name,
      prompt:
        'Conéctate a mi Google Drive usando la herramienta google_drive (list_files_and_folders y read_document_content) y revisa la carpeta o archivos recientes de "Perfil Sociodemográfico" y "Condiciones de Salud / Exámenes Médicos". Si Google Drive no está vinculado a esta empresa o no existen archivos nuevos reales, infórmalo de inmediato y detén el proceso sin simular ni inventar datos. Si existen documentos reales nuevos o actualizados (Excel, Google Sheets o PDF), identifica qué trabajadores tienen información nueva o modificada y ejecuta la herramienta somos_sst (acciones alimentar_sociodemografico_masivo, importar_sociodemografico_drive o actualizar_examen_medico) exclusivamente para esta empresa. Al finalizar, entrégame un resumen en Markdown de los archivos reales leídos y los trabajadores actualizados.',
      scheduleType: 'daily',
      scheduleConfig: { hour: 18, minute: 0 },
      emails: adminEmail,
      status: 'inactive',
      lastRunAt: sample1RunAt,
      lastRunStatus: 'success',
      lastRunResult: sample1Result,
      nextRunAt: null,
    });

    const auto2 = await Automation.create({
      user: user.id,
      companyId,
      name: '[Ejemplo Admin] Vigilar Drive y Registrar Accidentes ATEL, Inspecciones y Actos Inseguros',
      agentId: agent2Id,
      agentName: agent2Name,
      prompt:
        'Revisa en Google Drive (usando google_drive: list_files_and_folders y read_document_content) los archivos o carpetas donde se suban reportes de Accidentes/Incidentes de Trabajo (FURAT/ATEL), Inspecciones de Seguridad o Reportes de Actos y Condiciones Inseguras. Si Google Drive no está vinculado a esta empresa o no existen archivos nuevos reales, infórmalo con total transparencia y detén el proceso sin simular ni inventar datos ni crear nuevas tareas programadas. Solo cuando detectes un archivo real nuevo o actualizado en Drive: 1) Si contiene un accidente o incidente laboral nuevo, extrae los datos reales del evento y regístralo en el aplicativo de Accidentes ATEL de Somos SST usando somos_sst (acción registrar_accidente_atel). 2) Si contiene actos/condiciones inseguras o hallazgos reales de inspecciones, aliméntalos en el aplicativo correspondiente de Somos SST. Genera un informe en Markdown únicamente con los archivos reales procesados.',
      scheduleType: 'daily',
      scheduleConfig: { hour: 7, minute: 30 },
      emails: adminEmail,
      status: 'inactive',
      lastRunAt: sample2RunAt,
      lastRunStatus: 'success',
      lastRunResult: sample2Result,
      nextRunAt: null,
    });

    await AutomationLog.insertMany([
      {
        automation: auto1._id,
        user: user.id,
        companyId,
        agentId: agent1Id,
        agentName: agent1Name,
        prompt: auto1.prompt,
        runAt: sample1RunAt,
        status: 'success',
        result: sample1Result,
      },
      {
        automation: auto2._id,
        user: user.id,
        companyId,
        agentId: agent2Id,
        agentName: agent2Name,
        prompt: auto2.prompt,
        runAt: sample2RunAt,
        status: 'success',
        result: sample2Result,
      },
    ]);
  } catch (seedErr) {
    console.error('[API Automatizaciones] Error sembrando ejemplos para ADMIN:', seedErr);
  }
}

// Auxiliar para obtener el límite efectivo de automatizaciones del usuario
async function getEffectiveAutomationLimit(userId, userRole) {
  if (!userId) return { limit: 0, plan: 'free' };
  const userPlanDoc = await UserPlan.findOne({ userId }).lean();
  let plan = userPlanDoc?.plan;
  if (!plan || plan === 'free') {
    if (userRole === 'ADMIN') plan = 'admin';
    else if (userRole === 'USER_PRO') plan = 'pro';
    else if (userRole === 'USER_PLUS') plan = 'plus';
    else if (userRole === 'USER_GO') plan = 'go';
    else if (userRole === 'USER_CUSTOM') plan = 'custom';
    else if (userRole === 'USER_IPEVAR') plan = 'ipevar';
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

/**
 * GET /api/sgsst/automatizaciones/node-live-inspector
 * Inspecciona en tiempo real los registros, KPIs, brechas e informes de cualquiera de los 50 aplicativos de los 8 Hitos.
 */
router.get('/node-live-inspector', async (req, res) => {
  try {
    const nodeId = String(req.query.nodeId || '').trim();
    if (!nodeId) {
      return res.status(400).json({ error: 'El parámetro nodeId es obligatorio.' });
    }
    const explicitCompanyId = req.query.companyId ? String(req.query.companyId).trim() : null;
    const companyId = explicitCompanyId || (await getActiveCompanyId(req.user.id));
    const data = await inspectNodeLiveData({
      userId: req.user.id,
      companyId,
      nodeId,
    });
    return res.json({ success: true, ...data });
  } catch (error) {
    console.error('[API Automatizaciones] Error en node-live-inspector:', error);
    return res.status(500).json({ error: 'Error al consultar datos en vivo del nodo.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/test-sandbox
 * Ejecuta el flujo actual del Lienzo WAPPY en Modo Desarrollo (Sandbox / Dry-Run):
 * procesa los nodos, extrae datos quirúrgicos reales, ejecuta el/los Agentes IA y devuelve
 * la respuesta final y la traza nodo por nodo SIN enviar correos ni disparar salidas externas.
 */
router.post('/test-sandbox', async (req, res) => {
  try {
    const {
      automationId,
      companyId: explicitCompanyId,
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      emails,
      workflowNodes,
      mockTriggerInput,
    } = req.body || {};

    const resolvedCompanyId =
      explicitCompanyId && explicitCompanyId !== 'SYSTEM_PRESET'
        ? String(explicitCompanyId).trim()
        : await getActiveCompanyId(req.user.id);

    // Si se pasa un automationId opcional, usarlo como base de respaldo para campos no enviados en el body
    let existingDoc = null;
    if (automationId) {
      try {
        existingDoc = await Automation.findById(automationId).lean();
      } catch (_) {}
    }

    const simulationResult = await runWorkflowSandboxSimulation({
      user: req.user,
      companyId: resolvedCompanyId || existingDoc?.companyId || null,
      name: name ?? existingDoc?.name ?? 'Prueba en Escenario de Desarrollo',
      agentId: agentId ?? existingDoc?.agentId ?? 'tenshi_avatar_3d',
      agentName: agentName ?? existingDoc?.agentName ?? 'Tenshi (Avatar 3D)',
      prompt: prompt ?? existingDoc?.prompt ?? '',
      scheduleType: scheduleType ?? existingDoc?.scheduleType ?? 'daily',
      scheduleConfig: scheduleConfig ?? existingDoc?.scheduleConfig ?? { hour: 8, minute: 0 },
      emails: Array.isArray(emails)
        ? emails
        : Array.isArray(existingDoc?.emails) && existingDoc.emails.length > 0
          ? existingDoc.emails
          : req.user?.email
            ? [req.user.email]
            : [],
      workflowNodes: workflowNodes ?? existingDoc?.workflowNodes ?? {},
      mockTriggerInput: typeof mockTriggerInput === 'string' ? mockTriggerInput : '',
    });

    return res.json(simulationResult);
  } catch (error) {
    console.error('[API Automatizaciones] Error en test-sandbox:', error);
    return res.status(500).json({
      error: error?.message || 'Error al ejecutar la simulación en el Escenario de Desarrollo.',
    });
  }
});

/**
 * GET /api/sgsst/automatizaciones/presets
 * Lista todas las Tareas Preestablecidas del Sistema (plantillas de flujo disponibles para todos los usuarios).
 */
router.get('/presets', async (req, res) => {
  try {
    await ensureDefaultSystemPresets();
    const presets = await Automation.find({ isSystemPreset: true })
      .sort({ createdAt: 1 })
      .lean();
    res.json(presets);
  } catch (error) {
    console.error('[API Automatizaciones Presets] Error listing presets:', error);
    res.status(500).json({ error: 'Error al obtener las tareas preestablecidas del sistema.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/presets
 * Exclusivo ADMIN: Crea una nueva Tarea Preestablecida en el sistema para TODOS los usuarios.
 */
router.post('/presets', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo los administradores pueden crear tareas preestablecidas globales.' });
    }
    const {
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      presetCategory,
      presetDescription,
      workflowNodes,
    } = req.body;

    if (!name || !agentId || !prompt) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: name, agentId y prompt.' });
    }

    const preset = await Automation.create({
      user: req.user.id,
      companyId: 'SYSTEM_PRESET',
      isSystemPreset: true,
      presetKey: `custom_preset_${Date.now()}`,
      presetCategory: presetCategory || 'general',
      presetDescription: presetDescription || '',
      name: name.trim(),
      agentId,
      agentName: agentName || 'Consultor SG-SST',
      prompt: prompt.trim(),
      scheduleType: scheduleType || 'daily',
      scheduleConfig: scheduleConfig || { hour: 8, minute: 0 },
      workflowNodes: workflowNodes || {
        trigger: 'schedule_cron',
        inputs: [],
        hitos: [],
        outputs: ['email_report'],
      },
      emails: [],
      status: 'inactive',
      nextRunAt: null,
    });

    res.status(201).json(preset);
  } catch (error) {
    console.error('[API Automatizaciones Presets] Error creating preset:', error);
    res.status(500).json({ error: 'Error al crear la tarea preestablecida.' });
  }
});

/**
 * PUT /api/sgsst/automatizaciones/presets/:id
 * Exclusivo ADMIN: Actualiza una Tarea Preestablecida global del sistema.
 */
router.put('/presets/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo los administradores pueden editar tareas preestablecidas globales.' });
    }
    const { id } = req.params;
    const {
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      presetCategory,
      presetDescription,
      workflowNodes,
    } = req.body;

    const preset = await Automation.findOne({ _id: id, isSystemPreset: true });
    if (!preset) {
      return res.status(404).json({ error: 'No se encontró la tarea preestablecida.' });
    }

    if (name !== undefined) preset.name = name.trim();
    if (agentId !== undefined) preset.agentId = agentId;
    if (agentName !== undefined) preset.agentName = agentName;
    if (prompt !== undefined) preset.prompt = prompt.trim();
    if (scheduleType !== undefined) preset.scheduleType = scheduleType;
    if (scheduleConfig !== undefined) preset.scheduleConfig = scheduleConfig;
    if (presetCategory !== undefined) preset.presetCategory = presetCategory;
    if (presetDescription !== undefined) preset.presetDescription = presetDescription;
    if (workflowNodes !== undefined) preset.workflowNodes = workflowNodes;

    await preset.save();
    res.json(preset);
  } catch (error) {
    console.error('[API Automatizaciones Presets] Error updating preset:', error);
    res.status(500).json({ error: 'Error al actualizar la tarea preestablecida.' });
  }
});

/**
 * DELETE /api/sgsst/automatizaciones/presets/:id
 * Exclusivo ADMIN: Elimina una Tarea Preestablecida global del sistema.
 */
router.delete('/presets/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo los administradores pueden eliminar tareas preestablecidas globales.' });
    }
    const { id } = req.params;
    const result = await Automation.deleteOne({ _id: id, isSystemPreset: true });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No se encontró la tarea preestablecida para eliminar.' });
    }
    res.json({ success: true, message: 'Tarea preestablecida eliminada del catálogo global.' });
  } catch (error) {
    console.error('[API Automatizaciones Presets] Error deleting preset:', error);
    res.status(500).json({ error: 'Error al eliminar la tarea preestablecida.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/presets/:id/install
 * Instala/Clona una Tarea Preestablecida del catálogo en la empresa activa del usuario.
 */
router.post('/presets/:id/install', async (req, res) => {
  try {
    const { id } = req.params;
    const { activateImmediately = false, emails } = req.body || {};

    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró una empresa asociada para su usuario. Registre su empresa primero.' });
    }

    const preset = await Automation.findOne({ _id: id, isSystemPreset: true }).lean();
    if (!preset) {
      return res.status(404).json({ error: 'No se encontró la plantilla de tarea preestablecida.' });
    }

    const { limit: effectiveLimit } = await getEffectiveAutomationLimit(req.user.id, req.user.role);
    const activeCount = await Automation.countDocuments({
      user: req.user.id,
      isSystemPreset: { $ne: true },
      status: 'active',
    });

    const canActivate = activateImmediately && effectiveLimit > 0 && activeCount < effectiveLimit;
    const finalStatus = canActivate ? 'active' : 'inactive';
    const nextRunAt = canActivate ? calculateNextRun(preset.scheduleType || 'daily', preset.scheduleConfig || {}) : null;

    const defaultEmails =
      Array.isArray(emails) && emails.length > 0
        ? emails
        : req.user?.email
          ? [req.user.email]
          : [];

    const created = await Automation.create({
      user: req.user.id,
      companyId,
      isSystemPreset: false,
      presetCategory: preset.presetCategory || 'general',
      presetDescription: preset.presetDescription || '',
      name: preset.name,
      agentId: preset.agentId,
      agentName: preset.agentName,
      prompt: preset.prompt,
      scheduleType: preset.scheduleType || 'daily',
      scheduleConfig: preset.scheduleConfig || { hour: 8, minute: 0 },
      workflowNodes: preset.workflowNodes || {
        trigger: 'schedule_cron',
        inputs: [],
        hitos: [],
        outputs: ['email_report'],
      },
      emails: defaultEmails,
      status: finalStatus,
      nextRunAt,
    });

    res.status(201).json({
      automation: created,
      installedAsActive: canActivate,
      message: canActivate
        ? `Flujo "${created.name}" instalado y activado en tu empresa.`
        : `Flujo "${created.name}" agregado a Mis Tareas (en modo Inactivo para que ajustes horario/correos cuando desees).`,
    });
  } catch (error) {
    console.error('[API Automatizaciones Presets] Error installing preset:', error);
    res.status(500).json({ error: 'Error al instalar la tarea preestablecida en tu empresa.' });
  }
});

/**
 * GET /api/sgsst/automatizaciones
 * Lista todas las automatizaciones configuradas para la empresa activa del usuario.
 */
router.get('/', async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.json([]);
    }

    // Auto-recuperar tareas bloqueadas en 'running' por más de 10 minutos
    const staleRunningCutoff = new Date(Date.now() - 10 * 60 * 1000);
    await Automation.updateMany(
      { companyId, isSystemPreset: { $ne: true }, lastRunStatus: 'running', updatedAt: { $lt: staleRunningCutoff } },
      { $set: { lastRunStatus: 'failed', lastRunResult: 'Tiempo de ejecución límite agotado.' } }
    );

    const automations = await Automation.find({ companyId, isSystemPreset: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(automations);
  } catch (error) {
    console.error('[API Automatizaciones] Error listing:', error);
    res.status(500).json({ error: 'Error al obtener la lista de automatizaciones.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones
 * Crea una nueva automatización y calcula su primera fecha de ejecución.
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      emails,
      presetCategory,
      presetDescription,
      workflowNodes,
      saveAsSystemPreset,
    } = req.body;

    if (!name || !agentId || !prompt) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: name, agentId y prompt son necesarios.' });
    }

    const { limit: effectiveLimit, plan: userPlanName } = await getEffectiveAutomationLimit(req.user.id, req.user.role);
    if (effectiveLimit <= 0) {
      return res.status(403).json({
        error: 'Las automatizaciones de tareas periódicas son exclusivas del Plan Wappy Pro. Actualiza tu suscripción para habilitar tareas autónomas.'
      });
    }

    const activeCount = await Automation.countDocuments({
      user: req.user.id,
      isSystemPreset: { $ne: true },
      status: 'active',
    });
    if (activeCount >= effectiveLimit) {
      return res.status(400).json({
        error: `Límite de ${effectiveLimit} automatización(es) activa(s) alcanzado para tu plan actual (${userPlanName === 'pro' ? 'Wappy Pro' : userPlanName}). Para activar más tareas, puedes adquirir un paquete de 5 automatizaciones adicionales por solo $25.000 COP/mes.`
      });
    }

    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró una empresa asociada para su usuario. Registre su empresa primero.' });
    }

    const nextRunAt = calculateNextRun(scheduleType || 'daily', scheduleConfig || {});

    const automation = await Automation.create({
      user: req.user.id,
      companyId,
      isSystemPreset: false,
      presetCategory: presetCategory || 'general',
      presetDescription: presetDescription || '',
      name,
      agentId,
      agentName,
      prompt,
      scheduleType: scheduleType || 'daily',
      scheduleConfig: scheduleConfig || { hour: 8, minute: 0 },
      workflowNodes: workflowNodes || {
        trigger: 'schedule_cron',
        inputs: [],
        hitos: [],
        outputs: ['email_report'],
      },
      emails: emails || [],
      status: 'active',
      nextRunAt
    });

    // Si es ADMIN y marcó "Publicar también como Tarea Preestablecida para todos los usuarios"
    if (req.user?.role === 'ADMIN' && saveAsSystemPreset) {
      await Automation.create({
        user: req.user.id,
        companyId: 'SYSTEM_PRESET',
        isSystemPreset: true,
        presetKey: `custom_preset_${Date.now()}`,
        presetCategory: presetCategory || 'general',
        presetDescription: presetDescription || '',
        name: name.trim(),
        agentId,
        agentName,
        prompt: prompt.trim(),
        scheduleType: scheduleType || 'daily',
        scheduleConfig: scheduleConfig || { hour: 8, minute: 0 },
        workflowNodes: workflowNodes || {
          trigger: 'schedule_cron',
          inputs: [],
          hitos: [],
          outputs: ['email_report'],
        },
        emails: [],
        status: 'inactive',
        nextRunAt: null,
      });
    }

    res.status(201).json(automation);
  } catch (error) {
    console.error('[API Automatizaciones] Error creating:', error);
    res.status(500).json({ error: 'Error al crear la automatización.' });
  }
});

/**
 * PUT /api/sgsst/automatizaciones/:id
 * Actualiza una automatización existente.
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      agentId,
      agentName,
      prompt,
      scheduleType,
      scheduleConfig,
      emails,
      status,
      presetCategory,
      presetDescription,
      workflowNodes,
      saveAsSystemPreset,
    } = req.body;

    const companyId = await getActiveCompanyId(req.user.id);
    const automation = await Automation.findOne({ _id: id, companyId, isSystemPreset: { $ne: true } });

    if (!automation) {
      return res.status(404).json({ error: 'No se encontró la automatización.' });
    }

    // Actualizar campos si vienen en el body
    if (name !== undefined) automation.name = name;
    if (agentId !== undefined) automation.agentId = agentId;
    if (agentName !== undefined) automation.agentName = agentName;
    if (prompt !== undefined) automation.prompt = prompt;
    if (scheduleType !== undefined) automation.scheduleType = scheduleType;
    if (scheduleConfig !== undefined) automation.scheduleConfig = scheduleConfig;
    if (emails !== undefined) automation.emails = emails;
    if (presetCategory !== undefined) automation.presetCategory = presetCategory;
    if (presetDescription !== undefined) automation.presetDescription = presetDescription;
    if (workflowNodes !== undefined) automation.workflowNodes = workflowNodes;
    
    // Si cambia el estado, o cambia la configuración del schedule, recalculamos nextRunAt
    if (status !== undefined) {
      if (status === 'active' && automation.status !== 'active') {
        const { limit: effectiveLimit, plan: userPlanName } = await getEffectiveAutomationLimit(req.user.id, req.user.role);
        const activeCount = await Automation.countDocuments({
          user: req.user.id,
          isSystemPreset: { $ne: true },
          status: 'active',
        });
        if (activeCount >= effectiveLimit) {
          return res.status(400).json({
            error: `No se puede activar: Límite de ${effectiveLimit} automatización(es) activa(s) alcanzado para tu plan actual (${userPlanName === 'pro' ? 'Wappy Pro' : userPlanName}). Adquiere 5 adicionales por $25.000 COP/mes.`
          });
        }
      }
      automation.status = status;
    }

    if (automation.status === 'active') {
      if (scheduleType !== undefined || scheduleConfig !== undefined || status === 'active' || !automation.nextRunAt) {
        automation.nextRunAt = calculateNextRun(automation.scheduleType, automation.scheduleConfig);
      }
    } else {
      automation.nextRunAt = null;
    }

    await automation.save();

    if (req.user?.role === 'ADMIN' && saveAsSystemPreset) {
      await Automation.create({
        user: req.user.id,
        companyId: 'SYSTEM_PRESET',
        isSystemPreset: true,
        presetKey: `custom_preset_${Date.now()}`,
        presetCategory: automation.presetCategory || 'general',
        presetDescription: automation.presetDescription || '',
        name: automation.name,
        agentId: automation.agentId,
        agentName: automation.agentName,
        prompt: automation.prompt,
        scheduleType: automation.scheduleType,
        scheduleConfig: automation.scheduleConfig,
        workflowNodes: automation.workflowNodes,
        emails: [],
        status: 'inactive',
        nextRunAt: null,
      });
    }

    res.json(automation);
  } catch (error) {
    console.error('[API Automatizaciones] Error updating:', error);
    res.status(500).json({ error: 'Error al actualizar la automatización.' });
  }
});

/**
 * DELETE /api/sgsst/automatizaciones/:id
 * Elimina una automatización.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = await getActiveCompanyId(req.user.id);

    const result = await Automation.deleteOne({ _id: id, companyId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No se encontró la automatización para eliminar.' });
    }

    // Opcionalmente eliminar los logs asociados
    await AutomationLog.deleteMany({ automation: id });

    res.json({ success: true, message: 'Automatización eliminada correctamente.' });
  } catch (error) {
    console.error('[API Automatizaciones] Error deleting:', error);
    res.status(500).json({ error: 'Error al eliminar la automatización.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/:id/run
 * Ejecuta manualmente de inmediato una automatización (test run).
 */
router.post('/:id/run', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = await getActiveCompanyId(req.user.id);

    const automation = await Automation.findOne({ _id: id, companyId });
    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada.' });
    }

    if (automation.lastRunStatus === 'running') {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (automation.updatedAt && automation.updatedAt > twoMinAgo) {
        return res.status(400).json({ error: 'Esta automatización ya se encuentra ejecutándose en segundo plano.' });
      }
      console.log(`[API Run Manual] Forzando ejecución para "${automation.name}" tras detectar estado previo no concluido.`);
    }

    // Marcar como corriendo
    await Automation.updateOne({ _id: automation._id }, { $set: { lastRunStatus: 'running' } });

    // Ejecutar en background de forma inmediata
    runAutomation(automation, true).catch(err => {
      console.error('[API Run Manual] Error en corrida background:', err);
    });

    res.json({ success: true, message: 'Ejecución iniciada correctamente en segundo plano.' });
  } catch (error) {
    console.error('[API Automatizaciones] Error triggering run:', error);
    res.status(500).json({ error: 'Error al iniciar la ejecución manual.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/:id/stop
 * Detiene inmediatamente una automatización en ejecución.
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = await getActiveCompanyId(req.user.id);

    const automation = await Automation.findOne({ _id: id, companyId });
    if (!automation) {
      return res.status(404).json({ error: 'Automatización no encontrada.' });
    }

    const result = await stopAutomation(id);
    res.json(result);
  } catch (error) {
    console.error('[API Automatizaciones] Error stopping run:', error);
    res.status(500).json({ error: 'Error al detener la automatización.' });
  }
});

/**
 * POST /api/sgsst/automatizaciones/seed-admin-examples
 * Permite a un usuario ADMIN generar/restaurar las 2 automatizaciones de ejemplo en su empresa activa.
 */
router.post('/seed-admin-examples', async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acción exclusiva para administradores.' });
    }
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.status(400).json({ error: 'No se encontró una empresa asociada para su usuario.' });
    }
    await ensureAdminSampleAutomations(req.user, companyId, true);
    const automations = await Automation.find({ companyId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, automations });
  } catch (error) {
    console.error('[API Automatizaciones] Error seeding admin examples:', error);
    res.status(500).json({ error: 'Error al generar las automatizaciones de ejemplo.' });
  }
});

/**
 * GET /api/sgsst/automatizaciones/logs
 * Obtiene el historial completo de ejecuciones para la empresa activa.
 */
router.get('/logs', async (req, res) => {
  try {
    const companyId = await getActiveCompanyId(req.user.id);
    if (!companyId) {
      return res.json([]);
    }

    // Auto-recuperar logs bloqueados en 'running' por más de 10 minutos
    const staleRunningCutoff = new Date(Date.now() - 10 * 60 * 1000);
    await AutomationLog.updateMany(
      { companyId, status: 'running', createdAt: { $lt: staleRunningCutoff } },
      { $set: { status: 'failed', error: 'Tiempo de ejecución límite superado.' } }
    );

    const logs = await AutomationLog.find({ companyId })
      .sort({ runAt: -1 })
      .limit(50) // Capped a las últimas 50 corridas
      .lean();
    res.json(logs);
  } catch (error) {
    console.error('[API Automatizaciones Logs] Error listing logs:', error);
    res.status(500).json({ error: 'Error al obtener el historial de ejecuciones.' });
  }
});

module.exports = router;
