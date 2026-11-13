/**
 * Catálogo Oficial Curado de 30 Flujos Maestros del Sistema WAPPY SG-SST (Estilo n8n)
 * Arquitectura DAG Causal 100 % Real (AI Agent + Tools en Herramienta +):
 * - 30 flujos atómicos, simples y coherentes 1 a 1 entre Título, Descripción, Nodos y Prompt
 * - Roles explícitos en Aplicativos Hito: `source_read` (Etapa 2 antes del IF/Agente) o `agent_tool` (conectado en `Herramienta +` del Agente IA)
 * - Cero cajas Hito post-agente (`target_write_report` eliminado) y cero Agentes IA con `Herramienta +` vacío
 * - Extracción estructurada explícita con `extract_ai_doc_ocr` (`aiExtractionSchema`) en flujos documentales Drive/Gmail/Carpeta PC
 * - Web Scraping inteligente en vivo (SHA-256 pre_agent y herramienta live), Google NotebookLM (RAG/Studio) y Google Flow Studio (Imagen/Video Veo)
 * - Compuertas deterministas `pre_agent` (0 tokens LLM cuando 0 novedades) y semántica `post_agent` (`[VEREDICTO_IF: SI|NO]`)
 * - Textos visibles en español técnico impecable (cero variables internas de código en nombres, descripciones o prompts)
 */

const SYSTEM_WORKFLOW_PRESETS_VERSION = '2026.11.12-v59-n8n-curated-30';

function buildHitoDualConfigs(hitoId, config) {
  return {
    [hitoId]: { ...config },
    [`tool_hitos_${hitoId}`]: { ...config },
  };
}

function buildExtractorDualConfigs(extractorId, config) {
  return {
    [extractorId]: { ...config },
    [`extractor_${extractorId}`]: { ...config },
  };
}

function buildInputDualConfigs(inputId, config) {
  return {
    [inputId]: { ...config },
    [`tool_inputs_${inputId}`]: { ...config },
  };
}

const EMO_OCR_SCHEMA = [
  {
    key: 'cedula',
    label: 'Cédula',
    name: 'Cédula',
    type: 'string',
    required: true,
    hint: 'Número de cédula o documento de identidad del trabajador sin puntos ni espacios',
    description: 'Número de cédula o documento de identidad del trabajador sin puntos ni espacios',
  },
  {
    key: 'nombre_completo',
    label: 'Nombre Completo',
    name: 'Nombre Completo',
    type: 'string',
    required: true,
    hint: 'Nombres y apellidos completos del colaborador evaluado en el certificado médico',
    description: 'Nombres y apellidos completos del colaborador evaluado en el certificado médico',
  },
  {
    key: 'cargo',
    label: 'Cargo',
    name: 'Cargo',
    type: 'string',
    required: true,
    hint: 'Cargo o puesto de trabajo registrado en el concepto médico ocupacional',
    description: 'Cargo o puesto de trabajo registrado en el concepto médico ocupacional',
  },
  {
    key: 'tipo_examen',
    label: 'Tipo de Examen',
    name: 'Tipo de Examen',
    type: 'string',
    required: true,
    hint: 'Modalidad de la evaluación médica: Ingreso, Periódico, Egreso, Post-incapacidad o Cambio de Ocupación',
    description: 'Modalidad de la evaluación médica: Ingreso, Periódico, Egreso, Post-incapacidad o Cambio de Ocupación',
  },
  {
    key: 'fecha_examen',
    label: 'Fecha del Examen',
    name: 'Fecha del Examen',
    type: 'date',
    required: true,
    hint: 'Fecha de expedición del concepto médico ocupacional en formato AAAA-MM-DD',
    description: 'Fecha de expedición del concepto médico ocupacional en formato AAAA-MM-DD',
  },
  {
    key: 'concepto_aptitud',
    label: 'Concepto de Aptitud',
    name: 'Concepto de Aptitud',
    type: 'string',
    required: true,
    hint: 'Concepto ocupacional emitido por el médico especialista sin exponer historia clínica reservada',
    description: 'Concepto ocupacional emitido por el médico especialista sin exponer historia clínica reservada',
  },
  {
    key: 'restricciones_recomendaciones',
    label: 'Restricciones y Recomendaciones',
    name: 'Restricciones y Recomendaciones',
    type: 'string',
    required: false,
    hint: 'Restricciones laborales, recomendaciones médico-ocupacionales e inclusión en vigilancia epidemiológica',
    description: 'Restricciones laborales, recomendaciones médico-ocupacionales e inclusión en vigilancia epidemiológica',
  },
];

const INCAPACIDADES_OCR_SCHEMA = [
  {
    key: 'cedula',
    label: 'Cédula',
    name: 'Cédula',
    type: 'string',
    required: true,
    hint: 'Número de cédula o documento de identidad del trabajador incapacitado',
    description: 'Número de cédula o documento de identidad del trabajador incapacitado',
  },
  {
    key: 'nombre_trabajador',
    label: 'Nombre del Trabajador',
    name: 'Nombre del Trabajador',
    type: 'string',
    required: true,
    hint: 'Nombres y apellidos completos del colaborador según el certificado de incapacidad',
    description: 'Nombres y apellidos completos del colaborador según el certificado de incapacidad',
  },
  {
    key: 'entidad_emisora',
    label: 'Entidad Emisora',
    name: 'Entidad Emisora',
    type: 'string',
    required: true,
    hint: 'EPS, ARL o institución prestadora de salud que expide la incapacidad o licencia',
    description: 'EPS, ARL o institución prestadora de salud que expide la incapacidad o licencia',
  },
  {
    key: 'codigo_cie10',
    label: 'Código CIE-10',
    name: 'Código CIE-10',
    type: 'string',
    required: false,
    hint: 'Código diagnóstico CIE-10 o categoría osteomuscular/general consignada bajo reserva legal',
    description: 'Código diagnóstico CIE-10 o categoría osteomuscular/general consignada bajo reserva legal',
  },
  {
    key: 'fecha_inicio',
    label: 'Fecha de Inicio',
    name: 'Fecha de Inicio',
    type: 'date',
    required: true,
    hint: 'Fecha de inicio del periodo de incapacidad o licencia en formato AAAA-MM-DD',
    description: 'Fecha de inicio del periodo de incapacidad o licencia en formato AAAA-MM-DD',
  },
  {
    key: 'dias_incapacidad',
    label: 'Días de Incapacidad',
    name: 'Días de Incapacidad',
    type: 'number',
    required: true,
    hint: 'Cantidad total de días calendario otorgados en el certificado médico',
    description: 'Cantidad total de días calendario otorgados en el certificado médico',
  },
  {
    key: 'origen',
    label: 'Origen',
    name: 'Origen',
    type: 'string',
    required: true,
    hint: 'Clasificación del origen: Enfermedad Común, Accidente o Enfermedad Laboral, Maternidad/Paternidad o Tránsito',
    description: 'Clasificación del origen: Enfermedad Común, Accidente o Enfermedad Laboral, Maternidad/Paternidad o Tránsito',
  },
];

const FURAT_OCR_SCHEMA = [
  {
    key: 'cedula_lesionado',
    label: 'Cédula del Lesionado',
    name: 'Cédula del Lesionado',
    type: 'string',
    required: true,
    hint: 'Número de cédula o documento de identidad del trabajador accidentado',
    description: 'Número de cédula o documento de identidad del trabajador accidentado',
  },
  {
    key: 'nombre_lesionado',
    label: 'Nombre del Lesionado',
    name: 'Nombre del Lesionado',
    type: 'string',
    required: true,
    hint: 'Nombre completo del colaborador accidentado registrado en el FURAT',
    description: 'Nombre completo del colaborador accidentado registrado en el FURAT',
  },
  {
    key: 'fecha_hora_evento',
    label: 'Fecha y Hora del Evento',
    name: 'Fecha y Hora del Evento',
    type: 'date',
    required: true,
    hint: 'Fecha de ocurrencia del accidente de trabajo reportado en el FURAT (AAAA-MM-DD)',
    description: 'Fecha de ocurrencia del accidente de trabajo reportado en el FURAT (AAAA-MM-DD)',
  },
  {
    key: 'lugar_evento',
    label: 'Lugar del Evento',
    name: 'Lugar del Evento',
    type: 'string',
    required: true,
    hint: 'Sede, planta, frente de obra o área exacta donde ocurrió el evento laboral',
    description: 'Sede, planta, frente de obra o área exacta donde ocurrió el evento laboral',
  },
  {
    key: 'parte_cuerpo_afectada',
    label: 'Parte del Cuerpo Afectada',
    name: 'Parte del Cuerpo Afectada',
    type: 'string',
    required: true,
    hint: 'Segmento corporal lesionado y tipo de lesión descritos en el formato oficial FURAT',
    description: 'Segmento corporal lesionado y tipo de lesión descritos en el formato oficial FURAT',
  },
  {
    key: 'agente_mecanismo',
    label: 'Agente y Mecanismo',
    name: 'Agente y Mecanismo',
    type: 'string',
    required: true,
    hint: 'Agente material del accidente y mecanismo o forma en que se produjo la lesión',
    description: 'Agente material del accidente y mecanismo o forma en que se produjo la lesión',
  },
  {
    key: 'descripcion_accidente',
    label: 'Descripción del Accidente',
    name: 'Descripción del Accidente',
    type: 'string',
    required: true,
    hint: 'Relato detallado de tiempo, modo y lugar consignado en la versión oficial del FURAT',
    description: 'Relato detallado de tiempo, modo y lugar consignado en la versión oficial del FURAT',
  },
];

const SYSTEM_WORKFLOW_PRESETS_CATALOG = [
  // ═════════════════════════════════════════════════════════════════════════════
  // CATEGORÍA 1: salud_vencimientos (3 flujos)
  // ═════════════════════════════════════════════════════════════════════════════
  {
    presetKey: 'preset_vencimientos_emo_alturas',
    presetCategory: 'salud_vencimientos',
    name: '🩺 Vigilancia de Exámenes Médicos (EMO) y Certificados de Alturas por Vencer',
    presetDescription:
      'Revisa de lunes a viernes en Perfil Sociodemográfico (Hito 2) los trabajadores activos con Exámenes Médicos Ocupacionales (Resolución 1843 de 2025) vencidos o próximos a vencer en 30 días o menos, así como certificados anuales de Trabajo Seguro en Alturas (Resolución 4272 de 2021) exclusivamente cuando al cargo sí le aplica. Cruza restricciones activas en Informe de Condiciones de Salud (Hito 2) y, si hay brechas nuevas, agenda seguimiento en Google Calendar, crea acción en el Centro de Control ACPM y envía Bitácora por Correo; si todo está al día, registra notificación limpia en WAPPY sin consumir tokens de IA.',
    agentTargetName: 'Médico Laboral',
    agentName: 'Médico Laboral',
    scheduleType: 'daily',
    scheduleConfig: {
      hour: 7,
      minute: 0,
      dayOfWeek: [1, 2, 3, 4, 5],
      daysOfWeek: [1, 2, 3, 4, 5],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '0 7 * * 1,2,3,4,5',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito2_perfil_socio', 'hito2_condiciones_salud'],
      outputs: ['acpm_task', 'google_calendar', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito2_perfil_socio', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'expiry_only',
            expiryAuditScope: ['emo', 'alturas'],
            includeLatestReport: false,
            selectedFields: [
              'Nombre Completo',
              'Cédula / Documento',
              'Cargo',
              'Área / Proceso',
              'EPS',
              'ARL',
              'fechaExamenMedico',
              'vencimientoExamenMedico',
              'estadoExamenMedicoEMO',
              'aplicaCursoAlturas',
              'estadoCursoAlturasAutorizado',
              'estadoCursoAlturasCoordinador',
              'motivosVencimientoDetectados',
            ],
            customInstruction:
              'Filtra en Perfil Sociodemográfico (Hito 2) únicamente colaboradores activos con Exámenes Médicos Ocupacionales vencidos, sin soporte o próximos a vencer en 30 días o menos (Resolución 1843 de 2025), y certificados anuales de Trabajo Seguro en Alturas (Resolución 4272 de 2021) vencidos o próximos a vencer exclusivamente para trabajadores a quienes sí les aplica.',
          }),
          ...buildHitoDualConfigs('hito2_condiciones_salud', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Consulta en Informe de Condiciones de Salud (Hito 2) las restricciones laborales vigentes y recomendaciones médico-ocupacionales de cada trabajador detectado con vencimiento próximo.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: '7d',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿EMO o Alturas <= 30d?',
            ifConditionType: 'critical_findings',
            ifRuleExpression: 'vencido, próximo a vencer, sin soporte',
            customInstruction:
              'Evalúa antes de invocar al Agente IA si existen trabajadores activos con Exámenes Médicos Ocupacionales o Certificados de Trabajo en Alturas vencidos o próximos a vencer en 30 días o menos que no hayan sido alertados en los últimos 7 días.',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_google_calendar: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Médico Laboral especialista en Seguridad y Salud en el Trabajo en Colombia. Analiza exclusivamente los colaboradores activos con vencimientos o brechas nuevas detectadas en Perfil Sociodemográfico (Hito 2) y utiliza tu herramienta conectada Informe de Condiciones de Salud (Hito 2) para verificar si cada trabajador presenta restricciones médicas o recomendaciones ocupacionales vigentes, protegiendo en todo momento la reserva de la historia clínica.\n\nEstructura tu dictamen ejecutivo en dos bloques exactos:\n1) Exámenes Médicos Ocupacionales (Resolución 1843 de 2025): tabla nominal con Nombre Completo, Cédula, Cargo, Área, Fecha de Último Examen, Fecha de Vencimiento, Restricciones o Recomendaciones Vigentes y fecha límite de programación con la IPS ocupacional.\n2) Certificados y Reentrenamiento Anual de Trabajo Seguro en Alturas (Resolución 4272 de 2021): tabla nominal incluyendo únicamente a los trabajadores a quienes sí les aplica trabajo en alturas (jamás reportes incumplimiento cuando la tarea en alturas no aplica al cargo), detallando nivel (Autorizado o Coordinador), vigencia y suspensión preventiva de ascenso si el certificado ya venció.\n\nCierra con el cronograma consolidado de citaciones para Google Calendar, las acciones correctivas y preventivas para el Centro de Control ACPM y el resumen gerencial para la Bitácora por Correo.',
  },

  {
    presetKey: 'preset_control_entregas_epp',
    presetCategory: 'salud_vencimientos',
    name: '🪖 Control de Entregas Vencidas, Reposición y Solicitudes Abiertas de EPP',
    presetDescription:
      'Inspecciona diariamente en Entrega y Seguimiento de EPP (Hito 5) las dotaciones vencidas, elementos fuera de servicio, inspecciones rechazadas y solicitudes abiertas de reposición. El Inspector Operativo SST cruza cada caso con Perfiles de Cargo (Hito 2) para verificar la matriz técnica de protección exigida por puesto y genera plan de reposición en el Centro de Control ACPM y Bitácora por Correo, o notificación silenciosa en WAPPY si todo el personal está al día.',
    agentTargetName: 'Inspector Operativo SST',
    agentName: 'Inspector Operativo SST',
    scheduleType: 'daily',
    scheduleConfig: {
      hour: 7,
      minute: 30,
      dayOfWeek: [1, 2, 3, 4, 5],
      daysOfWeek: [1, 2, 3, 4, 5],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '30 7 * * 1,2,3,4,5',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.5-flash-lite',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito3_epp', 'hito2_perfiles_cargo'],
      outputs: ['acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito3_epp', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            includeLatestReport: false,
            customInstruction:
              'Extrae desde Entrega y Seguimiento de EPP (Hito 5) únicamente las entregas vencidas, elementos fuera de servicio, inspecciones requeridas o rechazadas, referencias en stock mínimo crítico y solicitudes abiertas de reposición.',
          }),
          ...buildHitoDualConfigs('hito2_perfiles_cargo', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Consulta en Perfiles de Cargo (Hito 2) la matriz de Elementos de Protección Personal obligatoria y la especificación normativa (ANSI, NIOSH, EN o NTC) requerida para el cargo de cada colaborador.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: '7d',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿EPP vencidos o pendientes?',
            ifConditionType: 'critical_findings',
            ifRuleExpression: 'vencido, fuera de servicio, inspección requerida, rechazado, pendiente',
            customInstruction:
              'Verifica de forma determinista si existen entregas vencidas, elementos fuera de servicio o solicitudes pendientes en Entrega y Seguimiento de EPP (Hito 5) no alertadas durante los últimos 7 días.',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Inspector Operativo SST conforme a los artículos 122 a 124 de la Ley 9 de 1979 y el artículo 2.2.4.6.24 del Decreto 1072 de 2015. Revisa los registros con brecha detectados en Entrega y Seguimiento de EPP (Hito 5) y consulta tu herramienta Perfiles de Cargo (Hito 2) para contrastar qué Elementos de Protección Personal y normas técnicas certificadas exige el puesto de cada trabajador afectado.\n\nEntrega un informe operativo claro con:\n1) Tabla nominal de reposición e inspección inmediata: Colaborador, Cédula, Cargo, Elemento de Protección Personal afectado, Estado actual (Vencido, Fuera de Servicio, Inspección Requerida o Solicitud Abierta), Norma Técnica exigida según Perfiles de Cargo (Hito 2) y prioridad de entrega.\n2) Alertas de disponibilidad de inventario o retiro inmediato de elementos deteriorados en campo.\n3) Plan concreto de entrega firmada y capacitación de uso/mantenimiento para registrar en el Centro de Control ACPM y remitir en la Bitácora por Correo.',
  },

  {
    presetKey: 'preset_seguimiento_restricciones_medicas',
    presetCategory: 'salud_vencimientos',
    name: '🏥 Seguimiento de Restricciones Médicas, Reubicación y Casos de Salud',
    presetDescription:
      'Audita cada lunes en Informe de Condiciones de Salud (Hito 2) los casos activos con restricciones laborales, recomendaciones médicas o procesos de reubicación pendientes. Cuando existen casos por intervenir, el Médico Laboral consulta pautas clínicas en MedlinePlus NIH, actualiza las adaptaciones en Estudio de Puesto de Trabajo EPT (Hito 4) y genera seguimiento en el Centro de Control ACPM, documento técnico en el Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Médico Laboral',
    agentName: 'Médico Laboral',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 8,
      minute: 0,
      dayOfWeek: [1],
      daysOfWeek: [1],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '0 8 * * 1',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['consultar_medlineplus_rehabilitacion'],
      includeIfNode: true,
      hitos: ['hito2_condiciones_salud', 'hito3_estudio_puesto'],
      outputs: ['acpm_task', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito2_condiciones_salud', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            customInstruction:
              'Extrae desde Informe de Condiciones de Salud (Hito 2) los casos con restricciones médico-laborales vigentes, recomendaciones ocupacionales abiertas o solicitudes de reubicación y readaptación de tareas.',
          }),
          ...buildHitoDualConfigs('hito3_estudio_puesto', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'write_register',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra o actualiza en Estudio de Puesto de Trabajo EPT (Hito 4) los ajustes biomecánicos, administrativos y de reubicación laboral definidos para cada caso de salud activo.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: '7d',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿Restricciones activas >= 1?',
            ifConditionType: 'critical_findings',
            ifRuleExpression: 'restricción, reubicación, recomendación, seguimiento',
            customInstruction:
              'Evalúa antes del Agente IA si existen trabajadores con restricciones médicas vigentes, recomendaciones abiertas o reubicación pendiente en Informe de Condiciones de Salud (Hito 2).',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Médico Laboral bajo estricto cumplimiento de la Resolución 1843 de 2025 y la Ley 1581 de 2012 sobre confidencialidad y reserva de la historia clínica. Revisa los casos activos detectados en Informe de Condiciones de Salud (Hito 2) con restricciones laborales, recomendaciones médicas o reubicación pendiente.\n\nEjecuta de forma ordenada:\n1) Consulta pautas clínicas de rehabilitación y readaptación funcional basadas en evidencia mediante MedlinePlus NIH para sustentar las medidas preventivas en el entorno de trabajo sin divulgar diagnósticos sensibles.\n2) Registra o actualiza en Estudio de Puesto de Trabajo EPT (Hito 4) las modificaciones ergonómicas, pausas saludables, límites de carga y ajustes organizacionales requeridos por puesto.\n3) Elabora el acta técnica de seguimiento a restricciones y reubicación para el Editor en Vivo WAPPY, las tareas verificables para jefes de área en el Centro de Control ACPM y el resumen ejecutivo para la Bitácora por Correo.',
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // CATEGORÍA 2: drive_sincronizacion (3 flujos)
  // ═════════════════════════════════════════════════════════════════════════════
  {
    presetKey: 'preset_drive_conceptos_emo_ocr',
    presetCategory: 'drive_sincronizacion',
    name: '📂 Leer Conceptos Médicos (PDF/OCR) en Google Drive y Actualizar Sociodemográfico',
    presetDescription:
      'Revisa diariamente la carpeta «Conceptos Médicos EMO» en Google Drive. Si llegan certificados nuevos en PDF o escaneados, el Extractor IA de Documentos captura con visión OCR los 7 datos del examen (cédula, nombre, cargo, tipo de examen, fecha, concepto de aptitud y restricciones) y el Médico Laboral actualiza Perfil Sociodemográfico (Hito 2) e Informe de Condiciones de Salud (Hito 2), exportando el control a Google Sheets y Bitácora por Correo.',
    agentTargetName: 'Médico Laboral',
    agentName: 'Médico Laboral',
    scheduleType: 'daily',
    scheduleConfig: {
      hour: 18,
      minute: 0,
      dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '0 18 * * *',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_drive', 'extract_ai_doc_ocr'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito2_perfil_socio', 'hito2_condiciones_salud'],
      outputs: ['google_sheets', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildExtractorDualConfigs('extract_drive', {
            driveFolderQuery: 'Conceptos Médicos EMO',
            driveFolderName: 'Conceptos Médicos EMO',
            fileTypeFilter: 'pdf',
            onlyNewFiles: true,
            maxItems: 15,
            customInstruction:
              'Inspecciona la carpeta «Conceptos Médicos EMO» en Google Drive e identifica únicamente certificados médicos ocupacionales nuevos aún no procesados.',
          }),
          ...buildExtractorDualConfigs('extract_ai_doc_ocr', {
            aiModel: 'gemini-3.6-flash',
            upstreamSourceType: 'drive',
            aiExtractionRowMode: 'single_row',
            aiExtractionSchema: EMO_OCR_SCHEMA,
            customInstruction:
              'Lee cada certificado de aptitud médica en PDF o imagen mediante visión OCR y estructura exactamente la cédula, nombre completo, cargo, tipo de examen, fecha del examen, concepto de aptitud y restricciones o recomendaciones.',
          }),
          ...buildHitoDualConfigs('hito2_perfil_socio', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'write_register',
            appActionMode: 'write_and_update',
            customInstruction:
              'Actualiza en Perfil Sociodemográfico (Hito 2) la fecha del último Examen Médico Ocupacional, vigencia anual y estado documental del trabajador por número de cédula.',
          }),
          ...buildHitoDualConfigs('hito2_condiciones_salud', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'write_register',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra o actualiza en Informe de Condiciones de Salud (Hito 2) el concepto de aptitud médica, tipo de evaluación y restricciones o recomendaciones ocupacionales.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: 'all',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿Nuevos PDFs de EMO?',
            ifConditionType: 'new_external_items',
            ifRuleExpression: '>= 1',
            customInstruction:
              'Comprueba antes de ejecutar OCR y llamar al Agente IA si ingresaron certificados PDF nuevos en la carpeta «Conceptos Médicos EMO» de Google Drive que no hayan sido procesados antes.',
          },
          out_google_sheets: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Médico Laboral conforme a la Resolución 1843 de 2025. Procesa la tabla estructurada obtenida por el Extractor IA de Documentos desde la carpeta «Conceptos Médicos EMO» en Google Drive.\n\nPor cada concepto médico nuevo extraído:\n1) Actualiza en Perfil Sociodemográfico (Hito 2) el expediente del trabajador por número de cédula con su cargo, tipo de evaluación y fecha del examen médico ocupacional.\n2) Registra en Informe de Condiciones de Salud (Hito 2) el concepto de aptitud y las restricciones o recomendaciones médico-laborales, manteniendo la reserva legal de datos clínicos sensibles.\n3) Genera la tabla consolidada de sincronización lista para Google Sheets y el resumen de trazabilidad médica para la Bitácora por Correo.',
  },

  {
    presetKey: 'preset_gmail_incapacidades_ausentismo',
    presetCategory: 'drive_sincronizacion',
    name: '📩 Leer Incapacidades Médicas en Gmail (PDF/OCR) y Registrar Ausentismo',
    presetDescription:
      'Monitorea correos entrantes en Gmail con adjuntos de incapacidades o licencias médicas. Cuando detecta mensajes nuevos, el Extractor IA de Documentos captura por OCR cédula, nombre, entidad emisora, código CIE-10, fecha de inicio, días y origen; el Médico Laboral valida el cargo y área en Perfil Sociodemográfico (Hito 2), registra el evento en Gestión Integral de Ausentismo y ATEL (Hito 7) y escala alertas críticas al Centro de Control ACPM y Bitácora por Correo.',
    agentTargetName: 'Médico Laboral',
    agentName: 'Médico Laboral',
    scheduleType: 'daily',
    scheduleConfig: {
      hour: 9,
      minute: 0,
      dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '0 9 * * *',
    workflowNodes: {
      trigger: 'trigger_email_in',
      triggers: ['trigger_email_in', 'schedule_cron'],
      extractors: ['extract_gmail', 'extract_ai_doc_ocr'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito7_estadisticas_atel', 'hito2_perfil_socio'],
      outputs: ['acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildExtractorDualConfigs('extract_gmail', {
            gmailSearchQuery: 'subject:(incapacidad OR licencia) has:attachment',
            emailSubjectFilter: 'incapacidad',
            onlyWithAttachments: true,
            maxItems: 10,
            customInstruction:
              'Filtra en la bandeja de Gmail los correos nuevos con adjuntos cuyo asunto corresponda a incapacidades o licencias médicas.',
          }),
          ...buildExtractorDualConfigs('extract_ai_doc_ocr', {
            aiModel: 'gemini-3.6-flash',
            upstreamSourceType: 'gmail',
            aiExtractionRowMode: 'single_row',
            aiExtractionSchema: INCAPACIDADES_OCR_SCHEMA,
            customInstruction:
              'Extrae mediante visión OCR de cada soporte adjunto de incapacidad o licencia: cédula, nombre del trabajador, entidad emisora, código CIE-10, fecha de inicio, días otorgados y origen.',
          }),
          ...buildHitoDualConfigs('hito7_estadisticas_atel', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'write_register',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra la incapacidad o licencia médica en Gestión Integral de Ausentismo y ATEL (Hito 7) para actualizar los indicadores de ausentismo y severidad.',
          }),
          ...buildHitoDualConfigs('hito2_perfil_socio', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Consulta en Perfil Sociodemográfico (Hito 2) el cargo, área operativa, EPS y ARL del trabajador por cédula para validar coherencia administrativa.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: 'all',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿Incapacidades nuevas?',
            ifConditionType: 'new_external_items',
            ifRuleExpression: '>= 1',
            customInstruction:
              'Verifica antes de procesar con IA si llegaron correos nuevos de incapacidades o licencias médicas con adjuntos en Gmail no registrados previamente.',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Médico Laboral responsable del control de ausentismo conforme al artículo 30 de la Resolución 0312 de 2019 y la Resolución 1843 de 2025. Analiza las incapacidades médicas extraídas por el Extractor IA de Documentos desde la bandeja de Gmail.\n\nEjecuta en orden:\n1) Cruza cada cédula en Perfil Sociodemográfico (Hito 2) para confirmar el cargo, proceso, EPS y ARL registrados del colaborador.\n2) Registra el ausentismo en Gestión Integral de Ausentismo y ATEL (Hito 7) indicando fecha de inicio, días otorgados, entidad emisora y origen (común, laboral o licencia), resguardando la reserva del código CIE-10.\n3) Identifica si algún caso supera 15 días acumulados, corresponde a prórroga o es de origen laboral para programar valoración post-incapacidad en el Centro de Control ACPM y enviar el reporte consolidado en la Bitácora por Correo.',
  },

  {
    presetKey: 'preset_brechas_capacitacion_lms',
    presetCategory: 'drive_sincronizacion',
    name: '🎓 Cierre Automático de Brechas en Cronograma de Capacitaciones y Rutas LMS',
    presetDescription:
      'Audita todos los viernes en Programa de Capacitación SG-SST (Hito 6) las formaciones vencidas, inducciones pendientes o temas con baja cobertura de asistencia. Cuando detecta rezagos, el Coordinador de Capacitación SST consulta el catálogo de Academia WAPPY LMS, actualiza las asignaciones en Rutas de Aprendizaje LMS (Hito 6) y programa sesiones de nivelación en Google Calendar, Centro de Control ACPM y Bitácora por Correo.',
    agentTargetName: 'Coordinador de Capacitación SST',
    agentName: 'Coordinador de Capacitación SST',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 16,
      minute: 0,
      dayOfWeek: [5],
      daysOfWeek: [5],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '0 16 * * 5',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.5-flash-lite',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['cursos_lms'],
      includeIfNode: true,
      hitos: ['hito5_capacitaciones', 'hito6_ruta_aprendizaje'],
      outputs: ['acpm_task', 'google_calendar', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito5_capacitaciones', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            customInstruction:
              'Extrae desde Programa de Capacitación SG-SST (Hito 6) las capacitaciones vencidas, inducciones o reinducciones sin ejecutar y actividades con cobertura inferior a la meta.',
          }),
          ...buildHitoDualConfigs('hito6_ruta_aprendizaje', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'write_register',
            appActionMode: 'write_and_update',
            customInstruction:
              'Actualiza en Rutas de Aprendizaje LMS (Hito 6) los módulos virtuales asignados por cargo o área para cerrar las brechas del cronograma anual.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: '7d',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿Capacitaciones rezagadas?',
            ifConditionType: 'critical_findings',
            ifRuleExpression: 'vencida, pendiente, rezagada, baja cobertura',
            customInstruction:
              'Comprueba antes de llamar al Agente IA si existen capacitaciones vencidas o con cobertura deficiente en Programa de Capacitación SG-SST (Hito 6) no gestionadas en los últimos 7 días.',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_google_calendar: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Coordinador de Capacitación SST en cumplimiento del artículo 2.2.4.6.11 del Decreto 1072 de 2015 y el estándar 1.2.1 de la Resolución 0312 de 2019. Revisa las actividades formativas vencidas o con baja cobertura detectadas en Programa de Capacitación SG-SST (Hito 6).\n\nRealiza las siguientes acciones:\n1) Consulta los cursos disponibles y avances en Academia WAPPY LMS para vincular contenidos virtuales equivalentes a cada tema rezagado.\n2) Registra o actualiza las mallas formativas correspondientes en Rutas de Aprendizaje LMS (Hito 6) priorizando inducción, reinducción y riesgos críticos.\n3) Estructura el plan semanal de recuperación con fechas de convocatoria para Google Calendar, tareas de seguimiento por líder de área en el Centro de Control ACPM y resumen ejecutivo en la Bitácora por Correo.',
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // CATEGORÍA 3: atel_inspecciones (3 flujos)
  // ═════════════════════════════════════════════════════════════════════════════
  {
    presetKey: 'preset_triage_qr_actos_condiciones',
    presetCategory: 'atel_inspecciones',
    name: '📲 Triaje Inmediato de Reportes QR de Actos y Condiciones Inseguras en Campo',
    presetDescription:
      'Recibe al instante los reportes enviados por trabajadores mediante código QR en Reporte de Actos y Condiciones (Hito 6). El Inspector Operativo SST contrasta cada hallazgo contra la Matriz IPEVR GTC 45 (Hito 1) para calificar su severidad: si detecta peligro Alto o Crítico, abre intervención urgente en el Centro de Control ACPM y alerta por correo; si es de riesgo bajo o preventivo, registra trazabilidad en WAPPY.',
    agentTargetName: 'Inspector Operativo SST',
    agentName: 'Inspector Operativo SST',
    scheduleType: 'hourly',
    scheduleConfig: {
      hour: 8,
      minute: 0,
      dayOfWeek: [1, 2, 3, 4, 5, 6],
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      dayOfMonth: 1,
      intervalHours: 1,
    },
    cronExpression: '0 * * * *',
    workflowNodes: {
      trigger: 'trigger_qr_worker',
      triggers: ['trigger_qr_worker', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito4_actos_condiciones', 'hito2_matriz_ipevar'],
      outputs: ['acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito4_actos_condiciones', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            customInstruction:
              'Lee en Reporte de Actos y Condiciones (Hito 6) los reportes abiertos enviados por colaboradores desde códigos QR en campo pendientes de triaje.',
          }),
          ...buildHitoDualConfigs('hito2_matriz_ipevar', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Consulta en Matriz IPEVR GTC 45 (Hito 1) la valoración del peligro, nivel de riesgo y controles establecidos en fuente, medio e individuo para el área reportada.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: '24h',
          },
          if_router: {
            ifPlacement: 'post_agent',
            ifConditionLabel: '¿Peligro Alto o Crítico?',
            ifConditionType: 'ai_verdict',
            ifRuleExpression: 'nivel i, nivel ii, crítico, alto, peligro inminente',
            customInstruction:
              'Evalúa el veredicto técnico emitido por el Inspector Operativo SST tras contrastar el reporte QR con la Matriz IPEVR GTC 45 (Hito 1): escala por la rama SÍ los peligros Altos o Críticos y enruta por la rama NO los hallazgos menores.',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Inspector Operativo SST experto en inspección de seguridad y metodología GTC 45. Evalúa los hallazgos en campo recibidos desde Reporte de Actos y Condiciones (Hito 6) y consulta obligatoriamente tu herramienta Matriz IPEVR GTC 45 (Hito 1) para contrastar el peligro identificado, su nivel de riesgo (Nivel I Crítico, Nivel II Alto, Nivel III Medio o Nivel IV Bajo) y la jerarquía de controles aplicable.\n\n1) Clasifica cada reporte indicando Área, Tipo (Acto Inseguro o Condición Insegura), Peligro asociado en Matriz IPEVR GTC 45 (Hito 1), Nivel de Riesgo y medida inmediata en fuente, medio e individuo.\n2) Si existe al menos un reporte con peligro Crítico o Alto (Nivel I o II, riesgo de caída, atrapamiento, choque eléctrico, incendio o lesión grave), estructura la orden de intervención inmediata para el Centro de Control ACPM y Bitácora por Correo, y finaliza tu respuesta exactamente con el marcador [VEREDICTO_IF: SI].\n3) Si todos los reportes corresponden a observaciones menores o preventivas (Nivel III o IV ya controladas) o no hay hallazgos críticos pendientes, redacta una nota breve de cierre preventivo para WAPPY y finaliza exactamente con [VEREDICTO_IF: NO].',
  },

  {
    presetKey: 'preset_drive_furat_investigacion_atel',
    presetCategory: 'atel_inspecciones',
    name: '🚑 Procesar FURAT en Google Drive (PDF/OCR) y Abrir Investigación ATEL (Res. 1401)',
    presetDescription:
      'Vigila diariamente la carpeta «Reportes FURAT ATEL» en Google Drive. Al detectar un formato FURAT nuevo, el Extractor IA de Documentos captura por OCR los datos del lesionado y del evento; el Investigador ATEL localiza centros médicos cercanos, estructura el expediente e informe oficial en Investigación ATEL (Hito 7) conforme a la Resolución 1401 de 2007 y solicita Aprobación SST antes de emitir las acciones en el Centro de Control ACPM, Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Investigador ATEL',
    agentName: 'Investigador ATEL',
    scheduleType: 'daily',
    scheduleConfig: {
      hour: 8,
      minute: 30,
      dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '30 8 * * *',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_drive', 'extract_ai_doc_ocr'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.8-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['buscar_centros_emergencia'],
      includeIfNode: true,
      hitos: ['hito7_investigacion_atel'],
      outputs: ['acpm_task', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildExtractorDualConfigs('extract_drive', {
            driveFolderQuery: 'Reportes FURAT ATEL',
            driveFolderName: 'Reportes FURAT ATEL',
            fileTypeFilter: 'pdf',
            onlyNewFiles: true,
            maxItems: 10,
            customInstruction:
              'Monitorea la carpeta «Reportes FURAT ATEL» en Google Drive e identifica únicamente formatos FURAT nuevos en PDF o imagen escaneada.',
          }),
          ...buildExtractorDualConfigs('extract_ai_doc_ocr', {
            aiModel: 'gemini-3.8-flash',
            upstreamSourceType: 'drive',
            aiExtractionRowMode: 'single_row',
            aiExtractionSchema: FURAT_OCR_SCHEMA,
            customInstruction:
              'Extrae con precisión multimodal de cada FURAT: cédula del lesionado, nombre del lesionado, fecha y hora del evento, lugar del evento, parte del cuerpo afectada, agente y mecanismo, y descripción del accidente.',
          }),
          ...buildHitoDualConfigs('hito7_investigacion_atel', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'write_register',
            appActionMode: 'write_and_report',
            generateAppReport: true,
            customInstruction:
              'Abre el expediente formal en Investigación ATEL (Hito 7) con análisis causal (5 Porqués e Ishikawa) y genera el informe oficial dentro del plazo legal de 15 días calendario de la Resolución 1401 de 2007.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: 'all',
          },
          logic_approval_1: {
            customInstruction:
              'Solicita visto bueno formal del equipo investigador y Responsable SST sobre las causas básicas, causas inmediatas y plan de acción antes de distribuir el acta oficial Res. 1401 de 2007.',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿Nuevos FURAT en Drive?',
            ifConditionType: 'new_external_items',
            ifRuleExpression: '>= 1',
            customInstruction:
              'Verifica de forma determinista si existen archivos FURAT nuevos en la carpeta «Reportes FURAT ATEL» de Google Drive antes de ejecutar OCR e iniciar la investigación.',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_approval_1',
            logicType: 'human_approval',
            title: 'Aprobación SST',
            subtitle: 'Visto Bueno 1401',
          },
        ],
      },
    },
    prompt:
      'Actúa como Investigador ATEL especialista en la Resolución 1401 de 2007 y el artículo 2.2.4.6.32 del Decreto 1072 de 2015. Analiza los formatos FURAT nuevos estructurados por el Extractor IA de Documentos desde la carpeta «Reportes FURAT ATEL» en Google Drive.\n\nPor cada accidente de trabajo reportado:\n1) Utiliza Centros de Emergencia (OpenStreetMap) para referenciar la red hospitalaria y de urgencias cercana al lugar del evento en el protocolo MEDEVAC.\n2) Registra el caso y genera el informe oficial en Investigación ATEL (Hito 7), desarrollando el análisis de causalidad mediante 5 Porqués y Espina de Pescado (causas inmediatas: actos y condiciones subestándar; causas básicas: factores personales y del trabajo) y controlando el plazo legal máximo de 15 días calendario para remitir a la ARL (y aviso en 2 días hábiles si el accidente es grave o mortal según el artículo 2.2.4.1.6).\n3) Prepara el expediente para Visto Bueno del equipo investigador (Aprobación SST), junto con las medidas en fuente, medio e individuo para el Centro de Control ACPM, el acta formal en el Editor en Vivo WAPPY y la notificación en la Bitácora por Correo.',
  },

  {
    presetKey: 'preset_control_permisos_equipos_alturas',
    presetCategory: 'atel_inspecciones',
    name: '🧗 Auditoría de Permisos de Trabajo en Alturas y Equipos Contra Caídas (Res. 4272)',
    presetDescription:
      'Cruza de lunes a sábado a primera hora los registros de Permiso de Trabajo en Alturas (Hito 5) y Hoja de Vida de Equipos de Alturas (Hito 5) para detectar permisos incompletos o sin firmas y arneses, eslingas o líneas de vida rechazados o con inspección vencida. Cuando halla desviaciones, el Coordinador de Trabajo en Alturas valida el Análisis de Trabajo Seguro ATS (Hito 5) asociado y emite bloqueo preventivo en el Centro de Control ACPM y Bitácora por Correo.',
    agentTargetName: 'Coordinador de Trabajo en Alturas',
    agentName: 'Coordinador de Trabajo en Alturas',
    scheduleType: 'daily',
    scheduleConfig: {
      hour: 6,
      minute: 30,
      dayOfWeek: [1, 2, 3, 4, 5, 6],
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '30 6 * * 1,2,3,4,5,6',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito3_alturas', 'hito5_equipos_alturas', 'hito3_ats'],
      outputs: ['acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito3_alturas', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            customInstruction:
              'Extrae desde Permiso de Trabajo en Alturas (Hito 5) los permisos operativos abiertos con controles faltantes, sin firma de coordinador o con condiciones críticas en sitio.',
          }),
          ...buildHitoDualConfigs('hito5_equipos_alturas', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            customInstruction:
              'Extrae desde Hoja de Vida de Equipos de Alturas (Hito 5) los arneses, eslingas, conectores, puntos de anclaje y líneas de vida con inspección anual vencida, daño estructural o estado rechazado.',
          }),
          ...buildHitoDualConfigs('hito3_ats', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Consulta en Análisis de Trabajo Seguro ATS (Hito 5) el paso a paso de la tarea crítica, peligros periféricos y plan de rescate asociado a cada frente de trabajo en alturas.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: '24h',
          },
          logic_merge_1: {
            mergeStrategy: 'union_dedup',
            customInstruction:
              'Unifica las novedades operativas de Permiso de Trabajo en Alturas (Hito 5) con los hallazgos técnicos de Hoja de Vida de Equipos de Alturas (Hito 5).',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿Equipos o permisos en falla?',
            ifConditionType: 'critical_findings',
            ifRuleExpression: 'rechazado, fuera de servicio, sin firma, falla, crítico',
            customInstruction:
              'Comprueba antes de ejecutar el Agente IA si existen permisos de alturas con desviaciones o equipos contra caídas en falla no alertados en las últimas 24 horas.',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'Permisos + Equipos',
          },
        ],
      },
    },
    prompt:
      'Actúa como Coordinador de Trabajo en Alturas conforme a la Resolución 4272 de 2021. Analiza las desviaciones consolidadas desde Permiso de Trabajo en Alturas (Hito 5) y Hoja de Vida de Equipos de Alturas (Hito 5), y consulta tu herramienta Análisis de Trabajo Seguro ATS (Hito 5) para verificar la coherencia de los controles paso a paso y el procedimiento de rescate en cada frente activo.\n\nEstructura tu dictamen técnico en:\n1) Permisos de Trabajo en Alturas observados (Hito 5): frente de trabajo, hallazgos de verificación previa, firmas requeridas, medidas colectivas de prevención y alineación con el Análisis de Trabajo Seguro ATS (Hito 5).\n2) Equipos de Protección Contra Caídas en alerta (Hito 5): serial o identificación, tipo de equipo, causal de rechazo o inspección pendiente y orden inmediata de etiquetado fuera de servicio.\n3) Acciones correctivas inmediatas para el Centro de Control ACPM y alerta temprana para supervisión en la Bitácora por Correo.',
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // CATEGORÍA 4: legal_cumplimiento (2 flujos)
  // ═════════════════════════════════════════════════════════════════════════════
  {
    presetKey: 'preset_vigilancia_matriz_legal_sst',
    presetCategory: 'legal_cumplimiento',
    name: '⚖️ Vigilancia de Matriz Legal SG-SST y Brechas de Cumplimiento Normativo',
    presetDescription:
      'Revisa semanalmente en Matriz Legal (Hito 1) las normas aplicables en estado pendiente, vencido o sin evidencia documental registrada. Cuando detecta brechas, el Abogado Laboral y SST consulta en vivo actualizaciones regulatorias oficiales mediante Búsqueda Web Legal y entrega el dictamen jurídico y plan de cierre en el Centro de Control ACPM, Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Abogado Laboral y SST',
    agentName: 'Abogado Laboral y SST',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 7,
      minute: 30,
      dayOfWeek: [1],
      daysOfWeek: [1],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '30 7 * * 1',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['web_search'],
      includeIfNode: true,
      hitos: ['hito1_matriz_legal'],
      outputs: ['acpm_task', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito1_matriz_legal', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            customInstruction:
              'Extrae desde Matriz Legal (Hito 1) únicamente los requisitos legales aplicables que figuren en incumplimiento, pendientes o sin evidencia verificable de ejecución.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: '30d',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿Normas sin evidencia >= 1?',
            ifConditionType: 'critical_findings',
            ifRuleExpression: 'no cumple, pendiente, sin evidencia, brecha',
            customInstruction:
              'Evalúa antes de invocar al Agente IA si existen requisitos legales en incumplimiento o sin evidencia en Matriz Legal (Hito 1) no alertados en los últimos 30 días.',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Abogado Laboral y SST experto en legislación colombiana de riesgos laborales (Decreto 1072 de 2015 artículo 2.2.4.6.8 parágrafo 2 y Resolución 0312 de 2019 estándar 2.7.1). Analiza los requisitos normativos en brecha o sin evidencia detectados en Matriz Legal (Hito 1) de acuerdo con la actividad económica y nivel de riesgo de la empresa.\n\n1) Utiliza Búsqueda Web Legal en Vivo para verificar la vigencia actual, derogatorias o resoluciones modificatorias recientes expedidas por el Ministerio del Trabajo o Ministerio de Salud sobre cada norma en brecha.\n2) Construye una matriz ejecutiva con Norma y Año, Artículos Aplicables, Riesgo Jurídico o Sancionatorio ante inspección laboral y Evidencia Documental exacta requerida para demostrar cumplimiento.\n3) Emite el concepto legal formal para el Editor en Vivo WAPPY, las tareas con responsable y plazo en el Centro de Control ACPM y el resumen directivo para la Bitácora por Correo.',
  },

  {
    presetKey: 'preset_control_comites_copasst_cocolab',
    presetCategory: 'legal_cumplimiento',
    name: '🏛️ Seguimiento Mensual de Actas y Compromisos de COPASST y Convivencia (CCL)',
    presetDescription:
      'Consolida cada día 25 el estado de sesiones obligatorias, vigencia de períodos y compromisos abiertos de COPASST / Vigía de SST (Hito 3) y Comité de Convivencia Laboral (Hito 3). Si detecta actas pendientes o tareas vencidas, el Consultor SG-SST actualiza el seguimiento en Tablero Kanban ACPM (Hito 7), agenda las sesiones ordinarias en Google Calendar y remite alerta al Centro de Control ACPM y Bitácora por Correo.',
    agentTargetName: 'Consultor SG-SST',
    agentName: 'Consultor SG-SST',
    scheduleType: 'monthly',
    scheduleConfig: {
      hour: 8,
      minute: 0,
      dayOfWeek: [1],
      daysOfWeek: [1],
      dayOfMonth: 25,
      intervalHours: 4,
    },
    cronExpression: '0 8 25 * *',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.5-flash-lite',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito4_comites', 'hito3_cocolab', 'hito7_acpm'],
      outputs: ['google_calendar', 'acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito4_comites', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            customInstruction:
              'Extrae desde COPASST / Vigía de SST (Hito 3) las actas mensuales pendientes, compromisos vencidos o alertas de vigencia del período bipartito.',
          }),
          ...buildHitoDualConfigs('hito3_cocolab', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            customInstruction:
              'Extrae desde Comité de Convivencia Laboral (Hito 3) el cumplimiento de reuniones trimestrales, capacitaciones preventivas y planes de mejora agregados bajo confidencialidad.',
          }),
          ...buildHitoDualConfigs('hito7_acpm', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'write_register',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra y actualiza en Tablero Kanban ACPM (Hito 7) los compromisos pendientes derivados de las actas del COPASST y del Comité de Convivencia Laboral.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: '30d',
          },
          logic_merge_1: {
            mergeStrategy: 'union_dedup',
            customInstruction:
              'Unifica en un solo corte de gobernanza los hallazgos de COPASST / Vigía de SST (Hito 3) y del Comité de Convivencia Laboral (Hito 3).',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿Actas o tareas vencidas?',
            ifConditionType: 'critical_findings',
            ifRuleExpression: 'vencida, pendiente, sin acta, compromiso abierto',
            customInstruction:
              'Evalúa antes de ejecutar el Agente IA si existen actas faltantes, sesiones obligatorias sin realizar o compromisos vencidos en COPASST o Comité de Convivencia Laboral.',
          },
          out_google_calendar: { ifBranch: 'yes' },
          out_acpm_task: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'COPASST + CCL',
          },
        ],
      },
    },
    prompt:
      'Actúa como Consultor SG-SST especialista en órganos paritarios de gobernanza laboral en Colombia (Resolución 2013 de 1986 y Decreto 1072 de 2015 para COPASST / Vigía; Ley 1010 de 2006 y Resoluciones 652 y 1356 de 2012 para el Comité de Convivencia Laboral). Revisa las brechas consolidadas de COPASST / Vigía de SST (Hito 3) y Comité de Convivencia Laboral (Hito 3), protegiendo estrictamente la reserva de cualquier trámite individual de convivencia.\n\n1) Detalla el estado de actas mensuales del COPASST, reuniones trimestrales del Comité de Convivencia Laboral, quórum y vigencia de nombramientos.\n2) Registra o actualiza los compromisos atrasados en Tablero Kanban ACPM (Hito 7) asignando responsables verificables.\n3) Propón el orden del día y citación en Google Calendar, las acciones de cierre para el Centro de Control ACPM y el resumen mensual en la Bitácora por Correo.',
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // CATEGORÍA 5: riesgos_vial_quimico (2 flujos)
  // ═════════════════════════════════════════════════════════════════════════════
  {
    presetKey: 'preset_control_flota_pesv_documentos',
    presetCategory: 'riesgos_vial_quimico',
    name: '🚗 Control Diario de SOAT, Técnico-Mecánica e Inspección Preoperacional PESV',
    presetDescription:
      'Audita de lunes a sábado a las 6:00 a. m. en Hoja de Vida Automotores PESV (Hito 5) los vehículos y motocicletas con SOAT o Revisión Técnico-Mecánica vencidos o próximos a vencer y hallazgos críticos en inspección preoperacional diaria. Si detecta novedades, el Coordinador de Seguridad Vial cruza la severidad en el Motor Matriz Vial PESV y el clima en ruta con OpenWeather para emitir restricción de despacho en el Centro de Control ACPM y Bitácora por Correo.',
    agentTargetName: 'Coordinador de Seguridad Vial',
    agentName: 'Coordinador de Seguridad Vial',
    scheduleType: 'daily',
    scheduleConfig: {
      hour: 6,
      minute: 0,
      dayOfWeek: [1, 2, 3, 4, 5, 6],
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '0 6 * * 1,2,3,4,5,6',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['matriz_pesv', 'pronostico_clima_sst'],
      includeIfNode: true,
      hitos: ['hito3_vehiculos'],
      outputs: ['acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito3_vehiculos', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            customInstruction:
              'Extrae desde Hoja de Vida Automotores PESV (Hito 5) únicamente los vehículos propios o contratistas con SOAT o Revisión Técnico-Mecánica vencidos o próximos a vencer en 30 días o menos, mantenimientos preventivos vencidos o fallas en la inspección preoperacional.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: '7d',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿Vehículos con brechas?',
            ifConditionType: 'critical_findings',
            ifRuleExpression: 'soat vencido, tecnomecánica, falla preoperacional, fuera de servicio',
            customInstruction:
              'Verifica antes de llamar al Agente IA si existen automotores con documentos legales vencidos o fallas preoperacionales abiertas en Hoja de Vida Automotores PESV (Hito 5).',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Coordinador de Seguridad Vial conforme a la Resolución 20223040040595 de 2022 (Plan Estratégico de Seguridad Vial — PESV) y la norma ISO 39001. Analiza los vehículos con novedades documentales o mecánicas detectados en Hoja de Vida Automotores PESV (Hito 5).\n\n1) Cruza cada vehículo afectado con el Motor Matriz Vial PESV para ponderar la criticidad vial según el rol en la vía y tipo de desplazamiento.\n2) Consulta las condiciones meteorológicas operativas mediante OpenWeather Clima para reforzar recomendaciones preventivas en ruta (lluvia, baja visibilidad o piso húmedo).\n3) Entrega la tabla de control operativo por Placa (Tipo de Vehículo, Estado de SOAT, Estado de Revisión Técnico-Mecánica, Hallazgo Preoperacional y Decisión de Inmovilización Preventiva o Mantenimiento) para registrar en el Centro de Control ACPM y enviar en la Bitácora por Correo.',
  },

  {
    presetKey: 'preset_inventario_quimico_fds_sga',
    presetCategory: 'riesgos_vial_quimico',
    name: '🧪 Auditoría de Inventario Químico, Vigencia de FDS (< 5 años) y Compatibilidad SGA',
    presetDescription:
      'Revisa cada miércoles en Registro y Rótulo de Productos Químicos (Hito 5) las sustancias sin Ficha de Datos de Seguridad vigente (menor a 5 años), sin etiquetado SGA o de alta peligrosidad. El Higienista Industrial Químico consulta propiedades toxicológicas y pictogramas GHS en PubChem NIH, valida segregación segura con el Motor Químico SGA y entrega matriz e informe técnico en el Centro de Control ACPM, Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Higienista Industrial Químico',
    agentName: 'Higienista Industrial Químico',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 8,
      minute: 0,
      dayOfWeek: [3],
      daysOfWeek: [3],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '0 8 * * 3',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['consultar_pubchem_quimico', 'matriz_compatibilidad'],
      includeIfNode: true,
      hitos: ['hito5_registro_quimico'],
      outputs: ['acpm_task', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito5_registro_quimico', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            customInstruction:
              'Extrae desde Registro y Rótulo de Productos Químicos (Hito 5) las sustancias químicas sin Ficha de Datos de Seguridad vigente (menor a 5 años), sin rótulo SGA completo o con peligrosidad crítica.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: '30d',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿Químicos sin FDS o críticos?',
            ifConditionType: 'critical_findings',
            ifRuleExpression: 'sin fds, fds vencida, sin rótulo, incompatible, peligroso',
            customInstruction:
              'Comprueba antes de ejecutar el Agente IA si existen productos químicos sin FDS vigente, sin rotulado SGA o en riesgo crítico dentro de Registro y Rótulo de Productos Químicos (Hito 5).',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Higienista Industrial Químico especialista en la Ley 55 de 1993, el Decreto 1496 de 2018 (Sistema Globalmente Armonizado — SGA), la Resolución 773 de 2021 y la NTC 1692. Analiza las sustancias con brecha detectadas en Registro y Rótulo de Productos Químicos (Hito 5).\n\n1) Consulta en PubChem NIH los identificadores CAS, frases H y P, pictogramas GHS y controles de emergencia para los componentes activos de cada producto en brecha.\n2) Verifica y actualiza las reglas de segregación de almacenamiento (inflamables, comburentes, ácidos, bases y tóxicos) apoyándote en el Motor Químico SGA.\n3) Elabora el protocolo técnico de actualización de Fichas de Datos de Seguridad de 16 secciones (vigencia menor a 5 años), etiquetado SGA y almacenamiento seguro para el Editor en Vivo WAPPY, las tareas operativas en el Centro de Control ACPM y el resumen en la Bitácora por Correo.',
  },

  // ═════════════════════════════════════════════════════════════════════════════
  // CATEGORÍA 6: gerencia_auditoria (2 flujos)
  // ═════════════════════════════════════════════════════════════════════════════
  {
    presetKey: 'preset_auditoria_estandares_0312',
    presetCategory: 'gerencia_auditoria',
    name: '🛡️ Auditoría Continua de Estándares Mínimos Res. 0312/2019 y Plan de Mejora',
    presetDescription:
      'Audita cada lunes en Diagnóstico Inicial Estándares Mínimos Res. 0312 (Hito 1) los numerales calificados en no cumple o carentes de soporte documental según el tamaño y nivel de riesgo ARL de la empresa. Si existen brechas abiertas, el Auditor Líder SG-SST estructura y actualiza el Plan de Mejoramiento en Tablero Kanban ACPM (Hito 7) y entrega el informe de auditoría en el Centro de Control ACPM, Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Auditor Líder SG-SST',
    agentName: 'Auditor Líder SG-SST',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 7,
      minute: 0,
      dayOfWeek: [1],
      daysOfWeek: [1],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '0 7 * * 1',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.8-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito1_diagnostico_0312', 'hito7_acpm'],
      outputs: ['acpm_task', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito1_diagnostico_0312', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            recordFilterMode: 'critical_only',
            customInstruction:
              'Extrae desde Diagnóstico Inicial Estándares Mínimos Res. 0312 (Hito 1) los estándares evaluados en incumplimiento o sin evidencia documental soporte dentro del ciclo PHVA.',
          }),
          ...buildHitoDualConfigs('hito7_acpm', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'write_register',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra y actualiza en Tablero Kanban ACPM (Hito 7) las acciones del Plan de Mejoramiento conforme al artículo 28 de la Resolución 0312 de 2019.',
          }),
          sub_memory_wappy_memory_antiduplicate: {
            dedupWindow: '7d',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionLabel: '¿Estándares en brecha >= 1?',
            ifConditionType: 'critical_findings',
            ifRuleExpression: 'no cumple, sin evidencia, brecha, crítico',
            customInstruction:
              'Verifica antes de llamar al Agente IA si existen estándares mínimos de la Resolución 0312 de 2019 en incumplimiento o sin evidencia soporte no gestionados en los últimos 7 días.',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Auditor Líder SG-SST experto en la Resolución 0312 de 2019 (artículos 27 y 28) y el Decreto 1072 de 2015. Evalúa los numerales en incumplimiento o sin evidencia detectados en Diagnóstico Inicial Estándares Mínimos Res. 0312 (Hito 1), considerando el número de trabajadores y nivel de riesgo ARL de la empresa activa (7, 21 o 60 estándares aplicables).\n\n1) Calcula el impacto porcentual de cada numeral abierto sobre la valoración global (Crítico menor a 60 %, Moderadamente Aceptable entre 60 % y 85 %, Aceptable mayor a 85 %) y prioriza por ciclo PHVA.\n2) Registra o actualiza las actividades concretas de cierre con entregable documental verificable en Tablero Kanban ACPM (Hito 7).\n3) Redacta el informe formal de Plan de Mejoramiento para el Editor en Vivo WAPPY, las tareas priorizadas para el Centro de Control ACPM y el resumen de avance para la Bitácora por Correo.',
  },

  {
    presetKey: 'preset_informe_ejecutivo_alta_direccion',
    presetCategory: 'gerencia_auditoria',
    name: '📊 Informe Gerencial Mensual de Revisión por la Alta Dirección e Indicadores SG-SST',
    presetDescription:
      'Consolida el primer día de cada mes los resultados de Diagnóstico Inicial Estándares Mínimos Res. 0312 (Hito 1), Gestión Integral de Ausentismo y ATEL (Hito 7) y Tablero Kanban ACPM (Hito 7). El Director Ejecutivo SG-SST actualiza y genera el acta oficial en Revisión por la Alta Dirección (Hito 7), solicita Firma de Gerencia y distribuye el informe ejecutivo en el Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Director Ejecutivo SG-SST',
    agentName: 'Director Ejecutivo SG-SST',
    scheduleType: 'monthly',
    scheduleConfig: {
      hour: 7,
      minute: 30,
      dayOfWeek: [1],
      daysOfWeek: [1],
      dayOfMonth: 1,
      intervalHours: 4,
    },
    cronExpression: '30 7 1 * *',
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.8-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company'],
      inputs: [],
      includeIfNode: false,
      hitos: [
        'hito1_diagnostico_0312',
        'hito7_estadisticas_atel',
        'hito7_acpm',
        'hito7_alta_direccion',
      ],
      outputs: ['canvas_doc', 'email_report'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito1_diagnostico_0312', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae el puntaje global y avance por ciclo PHVA desde Diagnóstico Inicial Estándares Mínimos Res. 0312 (Hito 1).',
          }),
          ...buildHitoDualConfigs('hito7_estadisticas_atel', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae los indicadores mensuales de frecuencia, severidad, proporción de accidentes mortales, prevalencia, incidencia y ausentismo desde Gestión Integral de Ausentismo y ATEL (Hito 7).',
          }),
          ...buildHitoDualConfigs('hito7_acpm', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae la eficacia de cierre de acciones correctivas, preventivas y de mejora desde Tablero Kanban ACPM (Hito 7).',
          }),
          ...buildHitoDualConfigs('hito7_alta_direccion', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_report',
            generateAppReport: true,
            customInstruction:
              'Consolida los indicadores del periodo y genera el informe ejecutivo oficial en Revisión por la Alta Dirección (Hito 7) conforme al artículo 2.2.4.6.31 del Decreto 1072 de 2015.',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Consolida en un único corte gerencial los indicadores de Estándares Mínimos Res. 0312 (Hito 1), Estadísticas de Ausentismo y ATEL (Hito 7) y Tablero Kanban ACPM (Hito 7).',
          },
          logic_approval_1: {
            customInstruction:
              'Solicita visto bueno y firma del Representante Legal / Alta Dirección antes de distribuir el acta mensual ejecutiva.',
          },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: '0312 + ATEL + ACPM',
          },
          {
            key: 'logic_approval_1',
            logicType: 'human_approval',
            title: 'Firma Gerencia',
            subtitle: 'Visto Bueno Acta',
          },
        ],
      },
    },
    prompt:
      'Actúa como Director Ejecutivo SG-SST en cumplimiento del artículo 2.2.4.6.31 del Decreto 1072 de 2015 y el artículo 30 de la Resolución 0312 de 2019. Consolida los datos gerenciales del periodo extraídos desde Diagnóstico Inicial Estándares Mínimos Res. 0312 (Hito 1), Gestión Integral de Ausentismo y ATEL (Hito 7) y Tablero Kanban ACPM (Hito 7).\n\n1) Evalúa el desempeño integral en tres tableros ejecutivos: Cumplimiento de Estándares Mínimos por ciclo PHVA, Indicadores Mínimos de Siniestralidad y Ausentismo Laboral (frecuencia, severidad, lesiones incapacitantes y ausentismo por causa médica) y Tasa de Cierre Efectivo de Acciones Correctivas, Preventivas y de Mejora.\n2) Registra las conclusiones estratégicas, necesidades de recursos y genera el informe oficial en Revisión por la Alta Dirección (Hito 7).\n3) Entrega el Acta Ejecutiva Mensual lista para Visto Bueno de Gerencia, exportación formal en el Editor en Vivo WAPPY y distribución directiva en la Bitácora por Correo.',
  },
  // 16. [salud_vencimientos] ARL Scraping por Cédula -> Perfil Sociodemográfico + Contratistas
  {
    presetKey: 'preset_scraping_arl_afiliacion_cedulas',
    name: '🛡️ Verificación ARL por Cédula vía Web Scraping y Control de Afiliación',
    presetCategory: 'salud_vencimientos',
    presetDescription:
      'Consulta en línea los certificados de afiliación ARL por cédula mediante Google Antigravity, cruza la nómina del Perfil Sociodemográfico (Hito 2) y actualiza novedades en Control y Gestión de Contratistas (Hito 5), escalando tareas en el Tablero Kanban ACPM y Bitácora por Correo solo cuando existan trabajadores o contratistas sin cobertura vigente.',
    agentName: 'Auditor de Afiliación ARL y Seguridad Social',
    schedule: 'weekly_monday',
    cronExpression: '0 7 * * 1',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_antigravity'],
      extractors: ['scraper_agy_arl_directo'],
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito2_perfil_socio', 'hito5_contratistas'],
      outputs: ['acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '7d' },
          ...buildExtractorDualConfigs('scraper_agy_arl_directo', {
            antigravityMode: 'auto',
            scriptEngine: 'chrome_devtools_mcp',
            customInstruction:
              'Consulta en los portales oficiales de ARL la afiliación vigente y descarga la constancia oficial para cada cédula evaluada.',
          }),
          ...buildHitoDualConfigs('hito2_perfil_socio', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae la nómina activa con cédula, cargo y administradora de riesgos declarada en el Perfil Sociodemográfico (Hito 2).',
          }),
          ...buildHitoDualConfigs('hito5_contratistas', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Actualiza el estado de verificación ARL en Control y Gestión de Contratistas (Hito 5) cuando se detecten novedades o ingresos sin cobertura activa.',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Unifica los resultados reales del verificador ARL con la nómina activa del Perfil Sociodemográfico (Hito 2) antes de evaluar alertas.',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Existen trabajadores o contratistas sin certificado ARL activo o con cobertura vencida sin gestionar?',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'ARL Web + Sociodemográfico',
          },
        ],
      },
    },
    prompt:
      'Actúa como Auditor de Afiliaciones y Seguridad Social SG-SST bajo la Ley 1562 de 2012 y el Decreto 1072 de 2015. Analiza únicamente las constancias reales extraídas de los portales oficiales ARL cruzadas contra el Perfil Sociodemográfico (Hito 2).\n\n1) Presenta una tabla ejecutiva con Trabajador, Cédula, Cargo, ARL consultada, Estado de Cobertura y Soporte en bandeja sin incluir enlaces ni código interno.\n2) Invoca la herramienta de Control y Gestión de Contratistas (Hito 5) para actualizar el cumplimiento documental de contratistas o personal con novedad.\n3) Genera acciones correctivas en el Tablero Kanban ACPM para subsanar la afiliación antes del inicio o continuación de labores y resume los hallazgos para la Bitácora por Correo.',
  },
  // 17. [salud_vencimientos] Campaña Audiovisual Salud + Ergonomía con NotebookLM + Google Flow
  {
    presetKey: 'preset_campana_audiovisual_salud_ergonomia',
    name: '🎬 Campaña Audiovisual de Salud Ocupacional y Ergonomía con NotebookLM y Google Flow',
    presetCategory: 'salud_vencimientos',
    presetDescription:
      'Consolida los hallazgos del Informe de Condiciones de Salud (Hito 2) y evaluaciones del Método OWAS (Hito 4), genera material pedagógico en Google NotebookLM y produce un video o pieza visual preventiva en Google Flow Studio lista para el Editor en Vivo WAPPY y distribución por Correo.',
    agentName: 'Director de Promoción, Prevención y Campañas SST',
    schedule: 'monthly',
    cronExpression: '0 9 1 * *',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_rag_documental'],
      inputs: ['notebooklm', 'google_flow'],
      includeIfNode: false,
      hitos: ['hito2_condiciones_salud', 'hito3_owas'],
      outputs: ['canvas_doc', 'email_report'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito2_condiciones_salud', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Lee los diagnósticos agregados, morbilidad sentida y prioridades de vigilancia epidemiológica en el Informe de Condiciones de Salud (Hito 2).',
          }),
          ...buildHitoDualConfigs('hito3_owas', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Lee las posturas críticas y categorías de acción ergonómica registradas en el Método OWAS (Hito 4).',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'generate_infographic',
            notebookFormat: 'detailed',
            notebookPrompt:
              'Sintetiza en recomendaciones prácticas de higiene postural, pausas activas y autocuidado osteomuscular según la normativa colombiana vigente.',
          }),
          ...buildInputDualConfigs('google_flow', {
            flowAction: 'generate_video',
            flowAspectRatio: '9:16',
            flowStyle: 'Video corporativo preventivo moderno y luminoso',
            flowCameraMotion: 'Paneo suave estable',
            flowPrompt:
              'Trabajadores industriales y administrativos realizando pausas activas saludables, levantamiento seguro de cargas con espalda recta y ajuste ergonómico de estación de trabajo, estilo cinematográfico limpio y educativo',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Consolida las prioridades osteomusculares del Informe de Condiciones de Salud (Hito 2) y del Método OWAS (Hito 4) en un único guion preventivo.',
          },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'Salud + Ergonomía OWAS',
          },
        ],
      },
    },
    prompt:
      'Actúa como Especialista en Medicina del Trabajo y Ergonomía bajo la Resolución 1843 de 2025 y el Decreto 1072 de 2015. Analiza los hallazgos consolidados desde el Informe de Condiciones de Salud (Hito 2) y las evaluaciones posturales del Método OWAS (Hito 4).\n\n1) Define los 3 mensajes preventivos prioritarios para disminuir desórdenes musculoesqueléticos en los puestos críticos de la empresa.\n2) Utiliza Google NotebookLM para estructurar una guía o infografía técnica de higiene postural alineada con la documentación empresarial.\n3) Invoca Google Flow Studio en formato vertical 9:16 para producir la cápsula visual preventiva de campaña y adjunta el guion completo listo para difusión en el Editor en Vivo WAPPY y la Bitácora por Correo.',
  },
  // 18. [drive_sincronizacion] Carpeta Local PC -> Extractor OCR -> NotebookLM + Gestión del Cambio
  {
    presetKey: 'preset_carpeta_pc_notebooklm_gestion_cambio',
    name: '💻 Carpeta Local del PC hacia Cuaderno NotebookLM y Gestión del Cambio (MOC)',
    presetCategory: 'drive_sincronizacion',
    presetDescription:
      'Vigila una carpeta local del computador vía Google Antigravity, extrae cambios técnicos y procesos mediante el Extractor IA de Documentos, nutre el cuaderno RAG de Google NotebookLM y documenta los impactos en Gestión del Cambio en SST (Hito 5), activando tareas en el Tablero Kanban ACPM cuando ingresen archivos nuevos.',
    agentName: 'Ingeniero de Gestión del Cambio y Control Documental',
    schedule: 'daily',
    cronExpression: '0 8 * * 1-5',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_antigravity'],
      extractors: ['extract_pc_folder', 'extract_ai_doc_ocr'],
      aiModel: 'gemini-3.8-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate', 'wappy_rag_documental'],
      inputs: ['notebooklm'],
      includeIfNode: true,
      hitos: ['hito5_gestion_cambio'],
      outputs: ['acpm_task', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: 'all' },
          ...buildExtractorDualConfigs('extract_pc_folder', {
            antigravityMode: 'local',
            includeSubfolders: true,
            fileTypeFilter: 'pdf,docx,xlsx',
            maxItems: 10,
            customInstruction:
              'Vigila la carpeta local de cambios de ingeniería, maquinaria o procedimientos nuevos en el computador del responsable SST.',
          }),
          ...buildExtractorDualConfigs('extract_ai_doc_ocr', {
            aiModel: 'gemini-3.8-flash',
            aiExtractionRowMode: 'per_document',
            aiExtractionSchema: [
              {
                key: 'titulo_documento',
                label: 'Título del Documento o Proyecto',
                name: 'Título del Documento o Proyecto',
                type: 'string',
                required: true,
                hint: 'Nombre exacto del documento técnico, plano o ficha de cambio leído',
                description: 'Nombre exacto del documento técnico, plano o ficha de cambio leído',
              },
              {
                key: 'proceso_afectado',
                label: 'Área o Proceso Afectado',
                name: 'Área o Proceso Afectado',
                type: 'string',
                required: true,
                hint: 'Área operativa, línea productiva o cargo impactado por el cambio',
                description: 'Área operativa, línea productiva o cargo impactado por el cambio',
              },
              {
                key: 'tipo_cambio',
                label: 'Clasificación del Cambio',
                name: 'Clasificación del Cambio',
                type: 'string',
                required: true,
                hint: 'Cambio interno (tecnología, proceso, infraestructura, personal) o externo (norma, proveedor)',
                description: 'Cambio interno o externo identificado en el archivo local',
              },
              {
                key: 'peligros_asociados',
                label: 'Peligros y Riesgos Nuevos',
                name: 'Peligros y Riesgos Nuevos',
                type: 'string',
                required: true,
                hint: 'Peligros físicos, químicos, mecánicos, locativos o psicosociales derivados del cambio',
                description: 'Peligros derivados del cambio técnico o administrativo',
              },
              {
                key: 'fecha_emision',
                label: 'Fecha del Documento',
                name: 'Fecha del Documento',
                type: 'date',
                required: false,
                hint: 'Fecha registrada en el documento en formato AAAA-MM-DD',
                description: 'Fecha registrada en el documento en formato AAAA-MM-DD',
              },
            ],
            customInstruction:
              'Extrae los metadatos estructurales de cada cambio organizacional, tecnológico o locativo detectado en la carpeta local.',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'add_source',
            notebookPrompt:
              'Analiza los peligros potenciales, requisitos de capacitación y actualizaciones a la matriz de riesgos antes de implementar el cambio.',
          }),
          ...buildHitoDualConfigs('hito5_gestion_cambio', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_report',
            generateAppReport: true,
            customInstruction:
              'Registra la evaluación previa del cambio y emite el informe oficial en Gestión del Cambio en SST (Hito 5) conforme al artículo 2.2.4.6.26 del Decreto 1072 de 2015.',
          }),
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'new_external_items',
            ifConditionLabel:
              '¿Ingresaron archivos técnicos nuevos en la carpeta local del equipo pendientes de análisis?',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Líder de Ingeniería y Gestión del Cambio SG-SST conforme al artículo 2.2.4.6.26 del Decreto 1072 de 2015. Procesa únicamente los documentos recién detectados en la carpeta local y estructurados por el Extractor IA de Documentos.\n\n1) Indexa y contrasta la información técnica mediante Google NotebookLM para verificar impactos sobre peligros existentes y controles requeridos antes de autorizar la puesta en marcha.\n2) Registra cada cambio evaluado y genera el informe oficial en Gestión del Cambio en SST (Hito 5) con el detalle exacto de áreas afectadas, peligros identificados y controles previos.\n3) Crea las tareas previas obligatorias en el Tablero Kanban ACPM y entrega el documento final al Editor en Vivo WAPPY y a la Bitácora por Correo.',
  },
  // 19. [drive_sincronizacion] Manuales en Google Drive -> NotebookLM + Google Flow + Rutas LMS
  {
    presetKey: 'preset_drive_manuales_notebooklm_flow_lms',
    name: '📚 Manuales en Google Drive hacia Material Visual Google Flow y Rutas LMS',
    presetCategory: 'drive_sincronizacion',
    presetDescription:
      'Monitorea manuales y procedimientos seguros cargados en Google Drive, extrae objetivos pedagógicos mediante el Extractor IA de Documentos, sintetiza el contenido en Google NotebookLM, diseña un afiche visual en Google Flow Studio y actualiza las Rutas de Aprendizaje LMS (Hito 6).',
    agentName: 'Diseñador Instruccional y Multimedia SG-SST',
    schedule: 'daily',
    cronExpression: '0 9 * * 1-5',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_drive', 'extract_ai_doc_ocr'],
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate', 'wappy_rag_documental'],
      inputs: ['notebooklm', 'google_flow'],
      includeIfNode: true,
      hitos: ['hito6_ruta_aprendizaje'],
      outputs: ['canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: 'all' },
          ...buildExtractorDualConfigs('extract_drive', {
            driveFolderName: 'Manuales y Procedimientos Seguros SG-SST',
            fileTypeFilter: 'pdf,doc,docx',
            maxItems: 8,
          }),
          ...buildExtractorDualConfigs('extract_ai_doc_ocr', {
            aiModel: 'gemini-3.6-flash',
            aiExtractionRowMode: 'per_document',
            aiExtractionSchema: [
              {
                key: 'codigo_manual',
                label: 'Código del Manual o Instructivo',
                name: 'Código del Manual o Instructivo',
                type: 'string',
                required: true,
                hint: 'Código documental o versión del procedimiento operativo seguro',
                description: 'Código documental o versión del procedimiento operativo seguro',
              },
              {
                key: 'titulo_procedimiento',
                label: 'Título del Procedimiento',
                name: 'Título del Procedimiento',
                type: 'string',
                required: true,
                hint: 'Nombre exacto del manual, instructivo o estándar operativo leído',
                description: 'Nombre exacto del manual, instructivo o estándar operativo leído',
              },
              {
                key: 'publico_objetivo',
                label: 'Cargos o Áreas Destinatarias',
                name: 'Cargos o Áreas Destinatarias',
                type: 'string',
                required: true,
                hint: 'Cargos operativos o procesos obligados a aprobar esta formación',
                description: 'Cargos operativos o procesos obligados a aprobar esta formación',
              },
              {
                key: 'reglas_criticas',
                label: 'Reglas Críticas de Seguridad',
                name: 'Reglas Críticas de Seguridad',
                type: 'string',
                required: true,
                hint: 'Pasos obligatorios de bloqueo, EPP o prevención descritos en el manual',
                description: 'Pasos obligatorios de bloqueo, EPP o prevención descritos en el manual',
              },
            ],
            customInstruction:
              'Extrae los puntos pedagógicos y reglas críticas de seguridad desde cada manual nuevo en Google Drive.',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'generate_slides',
            notebookPrompt:
              'Convierte el procedimiento operativo extraído en una secuencia didáctica clara de 5 pasos con preguntas clave de verificación para operarios.',
          }),
          ...buildInputDualConfigs('google_flow', {
            flowAction: 'generate_image',
            flowAspectRatio: '16:9',
            flowStyle: 'Infografía técnica corporativa clara en español',
            flowCameraMotion: 'Estático',
            flowPrompt:
              'Banner educativo corporativo de seguridad industrial ilustrando procedimiento operativo seguro, señalización clara y uso obligatorio de elementos de protección personal',
          }),
          ...buildHitoDualConfigs('hito6_ruta_aprendizaje', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Crea o actualiza la lección y evaluación del manual en Rutas de Aprendizaje LMS (Hito 6) para los cargos destinatarios.',
          }),
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'new_external_items',
            ifConditionLabel:
              '¿Se detectaron manuales o instructivos nuevos en Google Drive sin convertir en material LMS?',
          },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Diseñador Instruccional Senior en Seguridad y Salud en el Trabajo bajo la Resolución 0312 de 2019. Toma los manuales recién extraídos desde Google Drive y procesados por el Extractor IA de Documentos.\n\n1) Genera el guion didáctico y presentación estructurada en Google NotebookLM destacando las reglas críticas que salvan vidas.\n2) Invoca Google Flow Studio para generar la imagen o portada pedagógica del módulo formativo.\n3) Publica y asigna la nueva cápsula formativa en Rutas de Aprendizaje LMS (Hito 6) y entrega el resumen en el Editor en Vivo WAPPY y la Bitácora por Correo.',
  },
  // 20. [atel_inspecciones] Auditoría Alturas MinTrabajo/SENA Web Scraper
  {
    presetKey: 'preset_scraping_alturas_mintrabajo_sena',
    name: '🧗 Auditoría de Certificados de Alturas en MinTrabajo y SENA vía Web Scraping',
    presetCategory: 'atel_inspecciones',
    presetDescription:
      'Consulta automáticamente los certificados de trabajo en alturas en MinTrabajo y SENA vía Google Antigravity, los cruza con el personal expuesto en el Perfil Sociodemográfico (Hito 2) y valida la disponibilidad operativa en Hoja de Vida de Equipos de Alturas (Hito 5), escalando brechas al Tablero Kanban ACPM.',
    agentName: 'Inspector Especialista en Trabajo en Alturas Res. 4272',
    schedule: 'weekly_monday',
    cronExpression: '30 6 * * 1',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_antigravity'],
      extractors: ['scraper_agy_alto_riesgo'],
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito2_perfil_socio', 'hito5_equipos_alturas'],
      outputs: ['acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '7d' },
          ...buildExtractorDualConfigs('scraper_agy_alto_riesgo', {
            antigravityMode: 'auto',
            scriptEngine: 'chrome_devtools_mcp',
            customInstruction:
              'Consulta por cédula en el registro oficial de MinTrabajo (Centros de Entrenamiento Res. 4272) y certificados digitales SENA.',
          }),
          ...buildHitoDualConfigs('hito2_perfil_socio', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Identifica los trabajadores con exposición a trabajo en alturas y sus fechas registradas en Perfil Sociodemográfico (Hito 2).',
          }),
          ...buildHitoDualConfigs('hito5_equipos_alturas', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Verifica y actualiza observaciones sobre inspección anual y restricción de asignación de arneses o eslingas en Hoja de Vida de Equipos de Alturas (Hito 5).',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Cruza en un único tablero los certificados verificados en MinTrabajo/SENA con los trabajadores expuestos del Perfil Sociodemográfico (Hito 2).',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Se detectaron trabajadores sin certificado de alturas vigente en MinTrabajo/SENA o novedades sin gestionar?',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'MinTrabajo/SENA + Nómina',
          },
        ],
      },
    },
    prompt:
      'Actúa como Coordinador de Trabajo Seguro en Alturas conforme a la Resolución 4272 de 2021. Analiza exclusivamente los resultados reales consultados en MinTrabajo y SENA frente al personal del Perfil Sociodemográfico (Hito 2).\n\n1) Presenta la tabla de cumplimiento por trabajador indicando Cédula, Cargo, Estado Oficial del Certificado de Alturas y Evidencia en bandeja (sin URLs crudas).\n2) Consulta y actualiza observaciones operativas en Hoja de Vida de Equipos de Alturas (Hito 5) para suspender la asignación de equipos a personal sin reentrenamiento vigente.\n3) Crea acciones inmediatas de reentrenamiento en el Tablero Kanban ACPM y remite el reporte ejecutivo a la Bitácora por Correo.',
  },
  // 21. [atel_inspecciones] Antecedentes Judiciales Contratistas Críticos
  {
    presetKey: 'preset_scraping_antecedentes_contratistas',
    name: '⚖️ Debida Diligencia Judicial y Antecedentes de Contratistas vía Web Scraping',
    presetCategory: 'atel_inspecciones',
    presetDescription:
      'Ejecuta consultas automatizadas en Rama Judicial, Contraloría, Procuraduría y Policía para personal contratista crítico leído en Control y Gestión de Contratistas (Hito 5), actualiza el registro de Compras y Adquisiciones en SST (Hito 5) y escala novedades al Tablero Kanban ACPM.',
    agentName: 'Auditor de Debida Diligencia y Contratistas SST',
    schedule: 'weekly_monday',
    cronExpression: '0 8 * * 1',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_antigravity'],
      extractors: ['scraper_agy_antecedentes'],
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito5_contratistas', 'hito5_compras_sst'],
      outputs: ['acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '30d' },
          ...buildExtractorDualConfigs('scraper_agy_antecedentes', {
            antigravityMode: 'auto',
            scriptEngine: 'chrome_devtools_mcp',
            customInstruction:
              'Consulta antecedentes fiscales, disciplinarios, judiciales y medidas correctivas en portales oficiales colombianos por cédula.',
          }),
          ...buildHitoDualConfigs('hito5_contratistas', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae los contratistas activos y su personal crítico asignado desde Control y Gestión de Contratistas (Hito 5).',
          }),
          ...buildHitoDualConfigs('hito5_compras_sst', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra hallazgos de habilitación y criterios de selección de proveedores en Compras y Adquisiciones en SST (Hito 5).',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Consolida las respuestas reales de los portales judiciales y fiscales con el padrón activo en Control y Gestión de Contratistas (Hito 5).',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Se detectaron procesos activos, sanciones fiscales/disciplinarias o alertas legales en contratistas sin gestionar?',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'Portales Judiciales + Contratistas',
          },
        ],
      },
    },
    prompt:
      'Actúa como Auditor de Cumplimiento y Gestión de Terceros SG-SST bajo el estándar de selección y evaluación de contratistas del Decreto 1072 de 2015 y la Resolución 0312 de 2019.\n\n1) Analiza objetivamente los hallazgos verificados en los portales oficiales consultados frente a la base de Control y Gestión de Contratistas (Hito 5), sin inferir ni inventar anotaciones no observadas.\n2) Actualiza el estado de habilitación y criterios de evaluación en Compras y Adquisiciones en SST (Hito 5) cuando exista una restricción o hallazgo confirmado.\n3) Abre las acciones de control documental en el Tablero Kanban ACPM y remite el informe confidencial a la Bitácora por Correo.',
  },
  // 22. [atel_inspecciones] Lección Aprendida Ilustrada ATEL con NotebookLM + Google Flow (post_agent)
  {
    presetKey: 'preset_leccion_aprendida_atel_notebooklm_flow',
    name: '🩹 Lección Aprendida Ilustrada ATEL con Google NotebookLM y Google Flow',
    presetCategory: 'atel_inspecciones',
    presetDescription:
      'Lee expedientes cerrados en Investigación ATEL (Hito 7), contrasta causas básicas con el historial en Google NotebookLM, diseña una lámina ilustrativa preventiva con Google Flow Studio y decide semánticamente si el caso amerita difusión general en el Editor en Vivo WAPPY y Bitácora por Correo.',
    agentName: 'Especialista en Investigación ATEL y Cultura Preventiva',
    schedule: 'daily',
    cronExpression: '0 10 * * 1-5',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['trigger_agent', 'trigger_tenshi'],
      extractors: [],
      aiModel: 'gemini-3.8-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_rag_documental'],
      inputs: ['notebooklm', 'google_flow'],
      includeIfNode: true,
      hitos: ['hito7_investigacion_atel'],
      outputs: ['canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito7_investigacion_atel', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Lee los expedientes recientes con causas inmediatas, causas básicas y plan de acción definidos en Investigación ATEL (Hito 7).',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'generate_infographic',
            notebookPrompt:
              'Redacta una Lección Aprendida clara bajo la Resolución 1401 de 2007 enfocada en causas técnicas, barreras preventivas y cero culpabilización al trabajador.',
          }),
          ...buildInputDualConfigs('google_flow', {
            flowAction: 'generate_image',
            flowAspectRatio: '1:1',
            flowStyle: 'Ilustración educativa de seguridad industrial limpia sin escenas explícitas',
            flowCameraMotion: 'Estático',
            flowPrompt:
              'Afiche preventivo de lección aprendida en seguridad laboral mostrando las medidas correctivas seguras, bloqueo de energías y señalización protectora en planta industrial',
          }),
          if_router: {
            ifPlacement: 'post_agent',
            ifConditionType: 'semantic_verdict',
            ifConditionLabel:
              '¿Existe un evento investigado con causas verificadas apto para publicar como Lección Aprendida preventiva?',
          },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Investigador Líder de Accidentes Laborales bajo la Resolución 1401 de 2007 y el artículo 2.2.4.6.32 del Decreto 1072 de 2015. Revisa los expedientes disponibles en Investigación ATEL (Hito 7).\n\n1) Si existe al menos un expediente con descripción de evento, causas básicas y controles definidos, utiliza Google NotebookLM para estructurar la Lección Aprendida educativa (sin nombres propios sensibles ni tono punitivo) y genera con Google Flow Studio una ilustración preventiva clara mostrando la práctica segura correcta.\n2) Evalúa y concluye obligatoriamente al inicio de tu veredicto con [VEREDICTO_IF: SI] si se produjo una Lección Aprendida válida lista para difusión, o con [VEREDICTO_IF: NO] si no hay expedientes completos disponibles para publicar.\n3) Cuando el veredicto sea positivo, entrega el boletín completo para el Editor en Vivo WAPPY y la Bitácora por Correo.',
  },
  // 23. [legal_cumplimiento] Monitor Web Scraping MinTrabajo/Diario Oficial SHA-256 -> Matriz Legal + NotebookLM
  {
    presetKey: 'preset_web_scraping_mintrabajo_diario_matriz_legal',
    name: '📜 Monitor Web Scraping de MinTrabajo y Diario Oficial hacia Matriz Legal',
    presetCategory: 'legal_cumplimiento',
    presetDescription:
      'Monitorea periódicamente los portales de normatividad del Ministerio del Trabajo y SUIN-Juriscol con detección de cambios SHA-256; cuando detecta contenido nuevo, contrasta obligaciones en Google NotebookLM, actualiza la Matriz Legal (Hito 1) y escala planes en el Tablero Kanban ACPM.',
    agentName: 'Abogado Laboralista y Auditor Normativo SG-SST',
    schedule: 'weekly_monday',
    cronExpression: '0 7 * * 1',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_web_scraping_agy'],
      aiModel: 'gemini-3.8-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate', 'wappy_rag_documental'],
      inputs: ['notebooklm'],
      includeIfNode: true,
      hitos: ['hito1_matriz_legal'],
      outputs: ['acpm_task', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: 'all' },
          ...buildExtractorDualConfigs('extract_web_scraping_agy', {
            targetUrl:
              'https://www.mintrabajo.gov.co/normatividad, https://www.suin-juriscol.gov.co',
            scriptEngine: 'auto',
            onlyOnContentChange: true,
            customInstruction:
              'Extrae resoluciones, decretos y circulares recientes de seguridad laboral calculando huella SHA-256 para evitar reprocesar si no hubo cambios.',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'query',
            notebookPrompt:
              'Identifica qué artículos de las nuevas normas extraídas aplican a la actividad económica y nivel de riesgo de la empresa.',
          }),
          ...buildHitoDualConfigs('hito1_matriz_legal', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_report',
            generateAppReport: true,
            customInstruction:
              'Incorpora los nuevos requisitos legales aplicables en la Matriz Legal (Hito 1) y genera su informe normativo actualizado.',
          }),
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Se detectaron cambios nuevos (SHA-256 distinto) en los portales normativos de MinTrabajo o SUIN-Juriscol?',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Abogado Especialista en Derecho Laboral y SG-SST bajo el artículo 2.2.4.6.8 numeral 5 del Decreto 1072 de 2015. Analiza los cambios normativos detectados en la extracción web del Ministerio del Trabajo y SUIN-Juriscol.\n\n1) Consulta en Google NotebookLM el alcance técnico de las disposiciones nuevas frente al sector económico y riesgo de la empresa.\n2) Registra únicamente las normas aplicables reales en la Matriz Legal (Hito 1) y genera el informe oficial del aplicativo.\n3) Crea tareas de adecuación normativa en el Tablero Kanban ACPM cuando existan plazos o requisitos inmediatos y remite el resumen al Editor en Vivo WAPPY y a la Bitácora por Correo.',
  },
  // 24. [legal_cumplimiento] Scraping Jurisprudencia SST -> NotebookLM
  {
    presetKey: 'preset_web_scraping_jurisprudencia_sst_notebooklm',
    name: '⚖️ Scraping en Vivo de Jurisprudencia SST y Análisis en Google NotebookLM',
    presetCategory: 'legal_cumplimiento',
    presetDescription:
      'Consulta las obligaciones vigentes en la Matriz Legal (Hito 1), busca jurisprudencia reciente mediante la herramienta de Web Scraping en Vivo sobre altas cortes colombianas, contrasta precedentes en Google NotebookLM y consolida un boletín jurídico en Google Docs y Editor en Vivo WAPPY.',
    agentName: 'Consultor Jurídico en Jurisprudencia Laboral y SST',
    schedule: 'monthly',
    cronExpression: '0 8 15 * *',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_antigravity_cloud'],
      extractors: [],
      aiModel: 'gemini-3.8-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_rag_documental'],
      inputs: ['tool_web_scraping_agy', 'notebooklm'],
      includeIfNode: false,
      hitos: ['hito1_matriz_legal'],
      outputs: ['google_docs', 'canvas_doc', 'email_report'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito1_matriz_legal', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae los requisitos legales y frentes críticos vigentes en la Matriz Legal (Hito 1) para enfocar la búsqueda jurisprudencial.',
          }),
          ...buildInputDualConfigs('tool_web_scraping_agy', {
            targetUrl:
              'https://www.corteconstitucional.gov.co, https://cortesuprema.gov.co',
            scriptEngine: 'auto',
            onlyOnContentChange: false,
            customInstruction:
              'Extrae comunicados y relatorías públicas recientes sobre estabilidad laboral reforzada, culpa patronal y riesgos laborales.',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'generate_report',
            notebookPrompt:
              'Elabora un memorando jurídico práctico relacionando los fallos extraídos con las medidas de prevención documental de la empresa.',
          }),
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Consultor Jurídico Senior en Riesgos Laborales en Colombia. Toma como línea base las obligaciones activas de la Matriz Legal (Hito 1).\n\n1) Invoca la herramienta de Web Scraping en Vivo para consultar los comunicados y boletines recientes de la Corte Constitucional y Corte Suprema sobre culpa patronal, fuero de salud y reubicación laboral.\n2) Contrasta los criterios extraídos en Google NotebookLM para traducirlos en recomendaciones probatorias y preventivas concretas para el empleador.\n3) Estructura el Boletín Jurisprudencial Mensual para archivarlo en Google Docs, el Editor en Vivo WAPPY y la Bitácora por Correo.',
  },
  // 25. [legal_cumplimiento] Auditoría Cruzada Política + Emergencias con NotebookLM
  {
    presetKey: 'preset_auditoria_cruzada_politica_emergencias_notebooklm',
    name: '🏛️ Auditoría Cruzada de Política SST y Plan de Emergencias con Google NotebookLM',
    presetCategory: 'legal_cumplimiento',
    presetDescription:
      'Cruza la Política de SST (Hito 1) y el Plan de Emergencias y Contingencias (Hito 1) frente al acervo documental en Google NotebookLM; si el agente detecta brechas normativas o desactualizaciones, registra planes de cierre en el Tablero Kanban ACPM (Hito 7).',
    agentName: 'Auditor Líder de Sistemas de Gestión SG-SST',
    schedule: 'monthly',
    cronExpression: '0 9 5 * *',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiModel: 'gemini-3.8-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_rag_documental', 'wappy_memory_procedural'],
      inputs: ['notebooklm'],
      includeIfNode: true,
      hitos: ['hito1_politica_objetivos', 'hito1_plan_emergencias', 'hito7_acpm'],
      outputs: ['acpm_task', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito1_politica_objetivos', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Lee el texto vigente, firma y vigencia anual de la Política de SST (Hito 1).',
          }),
          ...buildHitoDualConfigs('hito1_plan_emergencias', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Lee amenazas prioritarias, brigadas y procedimientos operativos normalizados del Plan de Emergencias y Contingencias (Hito 1).',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'query',
            notebookPrompt:
              'Verifica si la Política de SST y el Plan de Emergencias cubren las amenazas críticas reales de las sedes y cumplen el Decreto 1072 de 2015.',
          }),
          ...buildHitoDualConfigs('hito7_acpm', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra hallazgos y planes de acción cuando existan inconsistencias entre Política SST, Plan de Emergencias y el cuaderno en Tablero Kanban ACPM (Hito 7).',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Unifica los registros de Política de SST (Hito 1) y Plan de Emergencias (Hito 1) para su auditoría cruzada.',
          },
          if_router: {
            ifPlacement: 'post_agent',
            ifConditionType: 'semantic_verdict',
            ifConditionLabel:
              '¿Se identificaron vacíos, inconsistencias o desactualizaciones entre Política SST y Plan de Emergencias?',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'Política + Plan Emergencias',
          },
        ],
      },
    },
    prompt:
      'Actúa como Auditor Interno ISO 45001 y Decreto 1072 de 2015 (artículos 2.2.4.6.5 y 2.2.4.6.25). Evalúa en conjunto los documentos leídos desde Política de SST (Hito 1) y Plan de Emergencias y Contingencias (Hito 1) contrastados contra Google NotebookLM.\n\n1) Revisa vigencia anual, compromisos obligatorios de la política, cobertura de amenazas, roles de respuesta y coherencia con los documentos indexados.\n2) Inicia obligatoriamente tu conclusión con [VEREDICTO_IF: SI] si encuentras brechas documentales o inconsistencias que requieran corrección en el Tablero Kanban ACPM (Hito 7), o con [VEREDICTO_IF: NO] si ambos documentos están íntegros y coherentes.\n3) Cuando exista hallazgo, registra la acción en el Tablero Kanban ACPM (Hito 7) y entrega el informe de auditoría al Editor en Vivo WAPPY y Bitácora por Correo.',
  },
  // 26. [riesgos_vial_quimico] Scraper Vial SIMIT/RUNT PESV
  {
    presetKey: 'preset_scraping_simit_runt_conductores_pesv',
    name: '🚓 Verificación SIMIT y RUNT de Conductores y Vehículos PESV vía Web Scraping',
    presetCategory: 'riesgos_vial_quimico',
    presetDescription:
      'Consulta en línea comparendos SIMIT, licencias de conducción y vigencias SOAT/Técnico-Mecánica en RUNT mediante Google Antigravity, los consolida con la Hoja de Vida Automotores (Hito 5) y actualiza la Matriz de Riesgos Viales PESV (Hito 1), escalando infracciones o vencimientos al Tablero Kanban ACPM.',
    agentName: 'Auditor de Seguridad Vial PESV (Res. 40595)',
    schedule: 'weekly_monday',
    cronExpression: '0 6 * * 1',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_antigravity'],
      extractors: ['scraper_agy_vial_pesv'],
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito3_vehiculos', 'hito3_matriz_pesv'],
      outputs: ['acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '7d' },
          ...buildExtractorDualConfigs('scraper_agy_vial_pesv', {
            antigravityMode: 'auto',
            scriptEngine: 'chrome_devtools_mcp',
            customInstruction:
              'Consulta comparendos en SIMIT y estado de licencias/SOAT/RTM en RUNT para conductores y placas activas.',
          }),
          ...buildHitoDualConfigs('hito3_vehiculos', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae el parque automotor activo, placas y cédulas de conductores desde Hoja de Vida Automotores (Hito 5).',
          }),
          ...buildHitoDualConfigs('hito3_matriz_pesv', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra y recalifica riesgos viales críticos cuando existan comparendos o documentos vencidos en la Matriz de Riesgos Viales PESV (Hito 1).',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Consolida las consultas en tiempo real de SIMIT y RUNT junto con los registros de Hoja de Vida Automotores (Hito 5).',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Se detectaron comparendos en SIMIT, licencias suspendidas o SOAT/Técnico-Mecánica vencidos sin gestionar?',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'SIMIT/RUNT + Flota Automotores',
          },
        ],
      },
    },
    prompt:
      'Actúa como Líder del Plan Estratégico de Seguridad Vial bajo la Resolución 20223040040595 de 2022. Evalúa únicamente los resultados verificados en SIMIT y RUNT cruzados con Hoja de Vida Automotores (Hito 5).\n\n1) Detalla en tabla clara cada vehículo o conductor con novedad (Placa/Cédula, Estado SOAT/Técnico-Mecánica/Licencia y Comparendos SIMIT) dejando la columna Soporte limpia sin enlaces crudos.\n2) Actualiza los factores de riesgo y controles del conductor o vehículo en la Matriz de Riesgos Viales PESV (Hito 1).\n3) Crea órdenes inmediatas de restricción de despacho y subsanación en el Tablero Kanban ACPM y envía el reporte a la Bitácora por Correo.',
  },
  // 27. [riesgos_vial_quimico] Scraping Fichas SGA + Afiche Pictogramas Google Flow
  {
    presetKey: 'preset_scraping_fichas_sga_afiche_pictogramas_flow',
    name: '☣️ Scraping de Fichas Químicas SGA y Afiche Visual de Pictogramas con Google Flow',
    presetCategory: 'riesgos_vial_quimico',
    presetDescription:
      'Monitorea fichas internacionales de seguridad química con detección de cambios SHA-256, las cruza con el Registro y Rótulo de Productos Químicos (Hito 5), actualiza la Matriz de Compatibilidad Química SGA (Hito 1) y genera un afiche de pictogramas con Google Flow Studio.',
    agentName: 'Ingeniero Químico Especialista en SGA (Dec. 1496)',
    schedule: 'weekly_monday',
    cronExpression: '0 9 * * 3',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_web_scraping_agy'],
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['google_flow'],
      includeIfNode: true,
      hitos: ['hito5_registro_quimico', 'hito3_quimicos_sga'],
      outputs: ['acpm_task', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '30d' },
          ...buildExtractorDualConfigs('extract_web_scraping_agy', {
            targetUrl: 'https://pubchem.ncbi.nlm.nih.gov, https://www.ilo.org/dyn/icsc',
            scriptEngine: 'auto',
            onlyOnContentChange: true,
            customInstruction:
              'Verifica actualizaciones en fichas internacionales ICSC y PubChem sobre sustancias peligrosas manipuladas por la empresa.',
          }),
          ...buildHitoDualConfigs('hito5_registro_quimico', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Lee el inventario, clasificación ONU, ubicación de bodega y vigencia FDS en Registro y Rótulo de Productos Químicos (Hito 5).',
          }),
          ...buildInputDualConfigs('google_flow', {
            flowAction: 'generate_image',
            flowAspectRatio: '4:5',
            flowStyle: 'Afiche técnico industrial de señalización SGA de alta legibilidad',
            flowCameraMotion: 'Estático',
            flowPrompt:
              'Afiche de seguridad química industrial en bodega moderna mostrando pictogramas del Sistema Globalmente Armonizado (inflamable, corrosivo, tóxico), separación de ácidos y bases, ducha de emergencia y kit antiderrames',
          }),
          ...buildHitoDualConfigs('hito3_quimicos_sga', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_report',
            generateAppReport: true,
            customInstruction:
              'Actualiza reglas de incompatibilidad y emite el informe oficial de la Matriz de Compatibilidad Química SGA (Hito 1).',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Consolida las fichas extraídas de portales internacionales junto con el inventario real de Registro y Rótulo de Productos Químicos (Hito 5).',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Se detectaron cambios en fichas químicas internacionales o brechas de compatibilidad y rotulado SGA sin gestionar?',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'Fichas Web + Inventario Químico',
          },
        ],
      },
    },
    prompt:
      'Actúa como Ingeniero Químico Especialista en el Sistema Globalmente Armonizado bajo el Decreto 1496 de 2018 y la Resolución 0773 de 2021. Analiza la información consolidada entre el monitoreo de fichas web internacionales y el Registro y Rótulo de Productos Químicos (Hito 5).\n\n1) Verifica segregación de clases incompatibles (especialmente ácidos vs bases, líquidos inflamables vs comburentes) y vigencia de etiquetas y hojas de datos.\n2) Actualiza los criterios e informe oficial en la Matriz de Compatibilidad Química SGA (Hito 1).\n3) Invoca Google Flow Studio para producir un afiche visual actualizado para la bodega química, crea las tareas de reubicación o rotulado en el Tablero Kanban ACPM y distribuye en el Editor en Vivo WAPPY y la Bitácora por Correo.',
  },
  // 28. [riesgos_vial_quimico] Campaña Vial Ruta + Clima Google Flow
  {
    presetKey: 'preset_campana_seguridad_vial_clima_flow',
    name: '🌦️ Alerta Preventiva de Seguridad Vial según Clima en Ruta con Google Flow',
    presetCategory: 'riesgos_vial_quimico',
    presetDescription:
      'Lee la flota activa en Hoja de Vida Automotores (Hito 5), consulta el pronóstico meteorológico en ruta en tiempo real y, cuando detecte lluvias intensas, tormentas o baja visibilidad, produce una pieza móvil 9:16 con Google Flow Studio y alerta por Correo.',
    agentName: 'Coordinador de Despacho Seguro y Riesgo Vial',
    schedule: 'daily',
    cronExpression: '30 5 * * 1-6',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiModel: 'gemini-3.5-flash-lite',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['pronostico_clima_sst', 'google_flow'],
      includeIfNode: true,
      hitos: ['hito3_vehiculos'],
      outputs: ['email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '24h' },
          ...buildHitoDualConfigs('hito3_vehiculos', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Lee los vehículos activos, tipo de operación y zonas asignadas desde Hoja de Vida Automotores (Hito 5).',
          }),
          ...buildInputDualConfigs('pronostico_clima_sst', {
            customInstruction:
              'Consulta el pronóstico climático horario para la ciudad y corredores de operación de la flota.',
          }),
          ...buildInputDualConfigs('google_flow', {
            flowAction: 'generate_image',
            flowAspectRatio: '9:16',
            flowStyle: 'Alerta visual móvil clara para conductores de flota',
            flowCameraMotion: 'Estático',
            flowPrompt:
              'Infografía vertical preventiva para conductores profesionales bajo lluvia intensa y neblina en carretera destacando reducción de velocidad, distancia de frenado y luces encendidas',
          }),
          if_router: {
            ifPlacement: 'post_agent',
            ifConditionType: 'semantic_verdict',
            ifConditionLabel:
              '¿El pronóstico climático presenta alertas de lluvia fuerte, tormenta o visibilidad crítica para la flota activa?',
          },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Coordinador de Seguridad Vial Operativa PESV (Resolución 20223040040595). Revisa los vehículos activos en Hoja de Vida Automotores (Hito 5) y consulta inmediatamente el pronóstico meteorológico para las zonas de operación.\n\n1) Determina con datos reales si existen condiciones climáticas adversas (lluvia moderada/fuerte, tormenta eléctrica, viento intenso o neblina) que exijan protocolo de conducción segura.\n2) Inicia obligatoriamente tu respuesta con [VEREDICTO_IF: SI] cuando exista alerta climática activa, o con [VEREDICTO_IF: NO] cuando las condiciones estén despejadas sin riesgo meteorológico.\n3) Únicamente cuando el veredicto sea positivo, genera con Google Flow Studio la pieza visual móvil 9:16 con recomendaciones de distancia de frenado y remite el boletín a la Bitácora por Correo.',
  },
  // 29. [gerencia_auditoria] Consultor Gerencial NotebookLM sobre 0312 + OWAS + Psicosocial en Slides
  {
    presetKey: 'preset_consultor_gerencial_notebooklm_slides',
    name: '📊 Consultor Gerencial NotebookLM sobre 0312, Ergonomía y Psicosocial en Google Slides',
    presetCategory: 'gerencia_auditoria',
    presetDescription:
      'Unifica los resultados de Estándares Mínimos Res. 0312 (Hito 1), Método OWAS (Hito 4) y Termómetro Psicosocial (Hito 4), genera un análisis estratégico con citas en Google NotebookLM, registra hallazgos en Auditoría SG-SST (Hito 7) y entrega presentación ejecutiva en Google Slides y Correo.',
    agentName: 'Director Estratégico y Auditor Gerencial SG-SST',
    schedule: 'monthly',
    cronExpression: '0 8 28 * *',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiModel: 'gemini-3.8-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_rag_documental'],
      inputs: ['notebooklm'],
      includeIfNode: false,
      hitos: ['hito1_diagnostico_0312', 'hito3_owas', 'hito4_psicosocial', 'hito7_auditoria'],
      outputs: ['google_slides', 'canvas_doc', 'email_report'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito1_diagnostico_0312', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae la calificación consolidada y estándares pendientes desde Diagnóstico Inicial Estándares Mínimos Res. 0312 (Hito 1).',
          }),
          ...buildHitoDualConfigs('hito3_owas', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae las evaluaciones ergonómicas y puestos con nivel de riesgo postural en Método OWAS (Hito 4).',
          }),
          ...buildHitoDualConfigs('hito4_psicosocial', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae tendencias de clima organizacional y factores psicosociales agregados del Termómetro Psicosocial (Hito 4) respetando la reserva clínica.',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'generate_slides',
            notebookPrompt:
              'Genera una síntesis ejecutiva de comité gerencial correlacionando cumplimiento Res. 0312, carga ergonómica y bienestar psicosocial con presupuesto sugerido.',
          }),
          ...buildHitoDualConfigs('hito7_auditoria', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_report',
            generateAppReport: true,
            customInstruction:
              'Documenta los hallazgos transversales y genera el informe oficial en Informe de Auditoría SG-SST (Hito 7).',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Consolida en un tablero único Estándares Mínimos Res. 0312 (Hito 1), Método OWAS (Hito 4) y Termómetro Psicosocial (Hito 4).',
          },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: '0312 + OWAS + Psicosocial',
          },
        ],
      },
    },
    prompt:
      'Actúa como Director Consultor SG-SST en cumplimiento de la Resolución 0312 de 2019 y la Resolución 2764 de 2022. Analiza en conjunto los datos reales consolidados desde Diagnóstico Inicial Estándares Mínimos (Hito 1), Método OWAS (Hito 4) y Termómetro Psicosocial (Hito 4).\n\n1) Correlaciona las brechas administrativas con los riesgos ergonómicos y tendencias psicosociales de forma agregada (sin exponer datos médicos ni individuales sensibles).\n2) Utiliza Google NotebookLM para generar la estructura de presentación directiva con recomendaciones priorizadas por retorno preventivo.\n3) Registra las conclusiones de revisión y emite el informe oficial en Informe de Auditoría SG-SST (Hito 7), preparando el contenido para Google Slides, Editor en Vivo WAPPY y Bitácora por Correo.',
  },
  // 30. [gerencia_auditoria] Radar Web Scraping Licitaciones/Circulares ARL + Portada Google Flow
  {
    presetKey: 'preset_radar_licitaciones_circulares_arl_flow',
    name: '📡 Radar Web Scraping de Licitaciones y Circulares ARL con Portada Google Flow',
    presetCategory: 'gerencia_auditoria',
    presetDescription:
      'Monitorea convocatorias y circulares técnicas ARL vía Web Scraping inteligente con detección de cambios SHA-256; cuando hay novedades reales, valida requisitos en Google NotebookLM, diseña una portada ejecutiva en Google Flow Studio y actualiza Revisión por la Alta Dirección (Hito 7).',
    agentName: 'Estratega de Licitaciones y Cumplimiento ARL SST',
    schedule: 'weekly_monday',
    cronExpression: '0 8 * * 1',
    isSystemPreset: true,
    workflowNodes: {
      triggers: ['schedule_cron', 'trigger_antigravity_cloud'],
      extractors: ['extract_web_scraping_agy'],
      aiModel: 'gemini-3.8-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate', 'wappy_rag_documental'],
      inputs: ['google_flow', 'notebooklm'],
      includeIfNode: true,
      hitos: ['hito7_alta_direccion'],
      outputs: ['canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '7d' },
          ...buildExtractorDualConfigs('extract_web_scraping_agy', {
            targetUrl:
              'https://www.colombiacompra.gov.co, https://www.arlsura.com/index.php/noticias',
            scriptEngine: 'auto',
            onlyOnContentChange: true,
            customInstruction:
              'Vigila cambios SHA-256 en portales de contratación pública y circulares técnicas de ARL relevantes para requisitos habilitantes SST.',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'query',
            notebookPrompt:
              'Compara las circulares técnicas o requisitos habilitantes extraídos frente a las evidencias actuales del SG-SST de la empresa.',
          }),
          ...buildInputDualConfigs('google_flow', {
            flowAction: 'generate_image',
            flowAspectRatio: '16:9',
            flowStyle: 'Portada editorial ejecutiva de informe estratégico SST',
            flowCameraMotion: 'Estático',
            flowPrompt:
              'Portada corporativa limpia y minimalista para boletín ejecutivo de gerencia en seguridad industrial, cumplimiento normativo y licitaciones empresariales, iluminación profesional',
          }),
          ...buildHitoDualConfigs('hito7_alta_direccion', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_report',
            generateAppReport: true,
            customInstruction:
              'Registra las alertas estratégicas, oportunidades de habilitación SST y emite el informe oficial en Revisión por la Alta Dirección (Hito 7).',
          }),
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Cambiaron las publicaciones de licitaciones o circulares técnicas ARL respecto al monitoreo previo (SHA-256)?',
          },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Estratega Ejecutivo SG-SST en cumplimiento del artículo 2.2.4.6.31 del Decreto 1072 de 2015. Analiza únicamente las publicaciones o circulares nuevas detectadas en la extracción web con huella SHA-256 actualizada.\n\n1) Consulta en Google NotebookLM las brechas frente a requisitos habilitantes (puntaje 0312, licencias, seguros y certificaciones técnicas exigidas).\n2) Registra los hallazgos estratégicos y emite el informe en Revisión por la Alta Dirección (Hito 7).\n3) Invoca Google Flow Studio en relación 16:9 para generar la portada visual del boletín gerencial y prepara la entrega final para el Editor en Vivo WAPPY y la Bitácora por Correo.',
  },
];

module.exports = {
  SYSTEM_WORKFLOW_PRESETS_VERSION,
  SYSTEM_WORKFLOW_PRESETS_CATALOG,
};
