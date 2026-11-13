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

const SYSTEM_WORKFLOW_PRESETS_VERSION = '2026.11.13-v60-n8n-curated-30';

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
  // 16. [salud_vencimientos] Scraping Mensual ARL y RUAF + Sociodemográfico (Hito 2) -> ACPM (Hito 7) + Sheets
  {
    presetKey: 'preset_scraping_arl_afiliacion_ruaf',
    name: '🛡️ Verificación Mensual de Afiliación ARL y Certificados vía Web Scraping',
    presetCategory: 'salud_vencimientos',
    presetDescription:
      'Consulta automáticamente los portales oficiales de ARL y certificados de afiliación vía Web Scraping con Google Antigravity, consolida los resultados con la nómina activa del Perfil Sociodemográfico (Hito 2) y, únicamente cuando detecta trabajadores sin cobertura vigente o con novedad no reportada, invoca el Tablero Kanban ACPM (Hito 7) y Google Sheets para escalamiento operativo y Bitácora por Correo.',
    agentTargetName: 'Médico Laboral',
    agentName: 'Médico Laboral',
    scheduleType: 'monthly',
    scheduleConfig: {
      hour: 7,
      minute: 0,
      dayOfWeek: [1],
      daysOfWeek: [1],
      dayOfMonth: 3,
      intervalHours: 24,
    },
    cronExpression: '0 7 3 * *',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_antigravity'],
      extractors: ['scraper_agy_arl_directo'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['google_sheets'],
      includeIfNode: true,
      hitos: ['hito2_perfil_socio', 'hito7_acpm'],
      outputs: ['acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '30d' },
          ...buildExtractorDualConfigs('scraper_agy_arl_directo', {
            antigravityMode: 'auto',
            scriptEngine: 'chrome_mcp',
            customInstruction:
              'Consulta en línea las constancias de afiliación y estado de cobertura en los portales ARL oficiales para las cédulas activas de la empresa.',
          }),
          ...buildHitoDualConfigs('hito2_perfil_socio', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae únicamente los trabajadores activos con cédula, cargo y ARL declarada desde Perfil Sociodemográfico (Hito 2).',
          }),
          ...buildHitoDualConfigs('hito7_acpm', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra acciones correctivas y preventivas en Control de ACPM (Hito 7) para cada trabajador sin cobertura ARL vigente.',
          }),
          ...buildInputDualConfigs('google_sheets', {
            customInstruction:
              'Consolida en Google Sheets la sábana mensual auditable con cédula, cargo, ARL consultada y estado de afiliación verificado.',
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
              '¿Existen trabajadores activos sin afiliación ARL vigente o novedades nuevas?',
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
      'Actúa como Médico Laboral SG-SST bajo la Ley 1562 de 2012 y el Decreto 1072 de 2015. Analiza únicamente las constancias reales extraídas de los portales ARL cruzadas contra la nómina activa del Perfil Sociodemográfico (Hito 2).\n\n1) Presenta una tabla ejecutiva con Trabajador, Cédula, Cargo, ARL consultada, Estado de Cobertura y Novedad Detectada sin inventar datos.\n2) Invoca la herramienta de Control de ACPM (Hito 7) para crear acciones correctivas urgentes ante cualquier cobertura inactiva o inconsistencia.\n3) Registra el consolidado mensual en Google Sheets y resume las acciones prioritarias para la Bitácora por Correo.',
  },
  // 17. [salud_vencimientos] Campaña Preventiva Osteomuscular: Condiciones Salud (Hito 2) + OWAS (Hito 4) -> Estudio Puesto (Hito 4) + NotebookLM + Google Flow
  {
    presetKey: 'preset_campana_ergonomia_condiciones_salud_flow',
    name: '🎬 Campaña Preventiva Osteomuscular desde Condiciones de Salud con NotebookLM y Google Flow',
    presetCategory: 'salud_vencimientos',
    presetDescription:
      'Consolida los hallazgos reales de Condiciones de Salud (Hito 2) y las evaluaciones posturales OWAS (Hito 4) mediante la unión de ramas en Etapa 2. Si existen hallazgos osteomusculares críticos sin campaña reciente, el Fisioterapeuta Laboral consulta guías en Google NotebookLM, actualiza recomendaciones en Estudios de Puesto de Trabajo (Hito 4), genera una pieza visual preventiva 9:16 en Google Flow Studio y la entrega en el Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Fisioterapeuta Laboral',
    agentName: 'Fisioterapeuta Laboral',
    scheduleType: 'monthly',
    scheduleConfig: {
      hour: 8,
      minute: 0,
      dayOfWeek: [1],
      daysOfWeek: [1],
      dayOfMonth: 5,
      intervalHours: 24,
    },
    cronExpression: '0 8 5 * *',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['notebooklm', 'google_flow'],
      includeIfNode: true,
      hitos: ['hito2_condiciones_salud', 'hito3_owas', 'hito3_estudio_puesto'],
      outputs: ['canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '30d' },
          ...buildHitoDualConfigs('hito2_condiciones_salud', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae morbilidad osteomuscular sentida, diagnósticos ergonómicos y alertas activas desde Condiciones de Salud (Hito 2).',
          }),
          ...buildHitoDualConfigs('hito3_owas', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae puestos y tareas con categorías de acción OWAS críticas desde Evaluación Ergonómica OWAS (Hito 4).',
          }),
          ...buildHitoDualConfigs('hito3_estudio_puesto', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Actualiza medidas de control ergonómico, rediseño postural y seguimiento en Estudios de Puesto de Trabajo (Hito 4).',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'consultar',
            notebookPrompt:
              'Consulta recomendaciones técnicas de higiene postural, pausas activas y prevención de desórdenes musculoesqueléticos en GATISO para los cargos afectados.',
          }),
          ...buildInputDualConfigs('google_flow', {
            flowAction: 'generar_imagen',
            flowAspectRatio: '9:16',
            flowStyle: 'infografia_editorial',
            flowPrompt:
              'Infografía vertical preventiva de ergonomía laboral e higiene postural en oficina y planta industrial, estética editorial corporativa limpia, alta legibilidad visual',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Unifica los hallazgos de Condiciones de Salud (Hito 2) y las evaluaciones posturales OWAS (Hito 4) antes de evaluar el umbral.',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Existen alertas osteomusculares críticas en Hito 2 o Hito 4 sin campaña reciente?',
          },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'Salud + OWAS',
          },
        ],
      },
    },
    prompt:
      'Actúa como Fisioterapeuta Laboral especialista en ergonomía y vigilancia epidemiológica osteomuscular. Analiza los hallazgos unificados de Condiciones de Salud (Hito 2) y Evaluación Ergonómica OWAS (Hito 4).\n\n1) Consulta Google NotebookLM para fundamentar ejercicios compensatorios y controles biomecánicos según las áreas críticas detectadas.\n2) Actualiza los controles prioritarios en Estudios de Puesto de Trabajo (Hito 4).\n3) Invoca Google Flow Studio en formato vertical 9:16 estilo infografía editorial para generar la pieza visual de campaña preventiva y redacta la guía de despliegue para el Editor en Vivo WAPPY y Bitácora por Correo.',
  },
  // 18. [drive_sincronizacion] Carpeta PC Local -> Extractor IA Docs -> NotebookLM + ACPM (Hito 7)
  {
    presetKey: 'preset_carpeta_pc_actas_notebooklm_acpm',
    name: '💻 Indexación de Actas SST desde Carpeta PC Local a Google NotebookLM y Tablero ACPM',
    presetCategory: 'drive_sincronizacion',
    presetDescription:
      'Vigila diariamente la carpeta local del equipo donde el responsable SST archiva actas de inspección, comités o auditorías internas. Cuando aparecen archivos nuevos sin indexar, el Extractor IA de Documentos captura sus campos clave por OCR, el Consultor SG-SST agrega las actas como fuente en Google NotebookLM, crea los compromisos pendientes en Control de ACPM (Hito 7) y entrega el resumen en el Tablero Kanban ACPM, Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Consultor SG-SST',
    agentName: 'Consultor SG-SST',
    scheduleType: 'daily',
    scheduleConfig: {
      hour: 18,
      minute: 30,
      dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      dayOfMonth: 1,
      intervalHours: 24,
    },
    cronExpression: '30 18 * * *',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_antigravity'],
      extractors: ['extract_pc_folder', 'extract_ai_doc_ocr'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['notebooklm'],
      includeIfNode: true,
      hitos: ['hito7_acpm'],
      outputs: ['acpm_task', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '7d' },
          ...buildExtractorDualConfigs('extract_pc_folder', {
            antigravityMode: 'local',
            includeSubfolders: true,
            fileTypeFilter: 'pdf,docx',
            maxItems: 10,
            customInstruction:
              'Vigila la carpeta local de actas de comités, inspecciones y hallazgos SST para detectar documentos nuevos pendientes de indexación.',
          }),
          ...buildExtractorDualConfigs('extract_ai_doc_ocr', {
            aiModel: 'gemini-3.6-flash',
            upstreamSourceType: 'pc',
            aiExtractionRowMode: 'single_row',
            aiExtractionSchema: [
              {
                key: 'codigo_acta',
                label: 'Código o Consecutivo del Acta',
                name: 'Código o Consecutivo del Acta',
                type: 'string',
                required: true,
                hint: 'Identificador numérico o consecutivo oficial del acta SST',
                description: 'Identificador numérico o consecutivo oficial del acta SST',
              },
              {
                key: 'fecha_acta',
                label: 'Fecha del Acta',
                name: 'Fecha del Acta',
                type: 'date',
                required: true,
                hint: 'Fecha de suscripción o reunión registrada en el acta (AAAA-MM-DD)',
                description: 'Fecha de suscripción o reunión registrada en el acta (AAAA-MM-DD)',
              },
              {
                key: 'comite_o_proceso',
                label: 'Comité o Proceso Origen',
                name: 'Comité o Proceso Origen',
                type: 'string',
                required: true,
                hint: 'Origen del documento: COPASST, CCL, Inspección de Seguridad o Auditoría Interna',
                description: 'Origen del documento: COPASST, CCL, Inspección de Seguridad o Auditoría Interna',
              },
              {
                key: 'compromiso_hallazgo',
                label: 'Compromiso o Hallazgo Principal',
                name: 'Compromiso o Hallazgo Principal',
                type: 'string',
                required: true,
                hint: 'Descripción concreta del compromiso o hallazgo que requiere plan de acción',
                description: 'Descripción concreta del compromiso o hallazgo que requiere plan de acción',
              },
              {
                key: 'responsable_cierre',
                label: 'Responsable de Cierre',
                name: 'Responsable de Cierre',
                type: 'string',
                required: true,
                hint: 'Cargo o persona asignada para ejecutar el compromiso',
                description: 'Cargo o persona asignada para ejecutar el compromiso',
              },
              {
                key: 'fecha_limite',
                label: 'Fecha Límite de Cierre',
                name: 'Fecha Límite de Cierre',
                type: 'date',
                required: false,
                hint: 'Fecha comprometida para el cierre efectivo del hallazgo (AAAA-MM-DD)',
                description: 'Fecha comprometida para el cierre efectivo del hallazgo (AAAA-MM-DD)',
              },
            ],
            customInstruction:
              'Extrae por OCR el consecutivo del acta, fecha, proceso origen, compromiso principal, responsable y fecha límite desde cada archivo nuevo.',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'agregar_fuente',
            notebookPrompt:
              'Agrega el contenido y resumen estructurado de las nuevas actas SST al cuaderno corporativo para mantener la base documental de auditoría actualizada.',
          }),
          ...buildHitoDualConfigs('hito7_acpm', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra cada compromiso abierto identificado en las actas nuevas dentro de Control de ACPM (Hito 7).',
          }),
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'new_external_items',
            ifConditionLabel:
              '¿Existen actas SST nuevas en la carpeta local sin indexar aún?',
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
      'Actúa como Consultor SG-SST responsable del control documental bajo el Decreto 1072 de 2015 (Art. 2.2.4.6.12). Analiza únicamente los datos estructurados extraídos por el Extractor IA de Documentos desde las actas nuevas detectadas en la carpeta local.\n\n1) Agrega los hallazgos y acuerdos relevantes como fuente consolidada en Google NotebookLM.\n2) Invoca Control de ACPM (Hito 7) para registrar los compromisos pendientes con responsable y fecha límite.\n3) Consolida la tabla ejecutiva de actas indexadas y tareas asignadas para el Editor en Vivo WAPPY y Bitácora por Correo.',
  },
  // 19. [drive_sincronizacion] Drive Procedimientos -> Extractor IA Docs -> NotebookLM + Google Flow + Rutas LMS (Hito 6)
  {
    presetKey: 'preset_drive_procedimientos_notebooklm_lms',
    name: '📚 Sincronización de Procedimientos Seguros (Drive) a NotebookLM, Afiche Flow y Rutas LMS',
    presetCategory: 'drive_sincronizacion',
    presetDescription:
      'Monitorea diariamente la carpeta de procedimientos y estándares seguros en Google Drive. Cuando detecta documentos nuevos, el Extractor IA de Documentos captura código, alcance, riesgos y requisitos por OCR; el Coordinador de Capacitaciones genera una infografía de estudio en Google NotebookLM, produce un afiche cuadrado 1:1 en Google Flow Studio, actualiza Rutas de Aprendizaje y Cronograma de Capacitaciones (Hito 6) y publica el material en Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Coordinador de Capacitaciones',
    agentName: 'Coordinador de Capacitaciones',
    scheduleType: 'daily',
    scheduleConfig: {
      hour: 17,
      minute: 30,
      dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      dayOfMonth: 1,
      intervalHours: 24,
    },
    cronExpression: '30 17 * * *',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_drive', 'extract_ai_doc_ocr'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['notebooklm', 'google_flow'],
      includeIfNode: true,
      hitos: ['hito6_ruta_aprendizaje', 'hito5_capacitaciones'],
      outputs: ['canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '7d' },
          ...buildExtractorDualConfigs('extract_drive', {
            driveFolderQuery: 'Procedimientos Seguros SST',
            driveFolderName: 'Procedimientos Seguros SST',
            fileTypeFilter: 'pdf',
            onlyNewFiles: true,
            maxItems: 10,
            customInstruction:
              'Inspecciona la carpeta de Procedimientos Seguros SST en Google Drive e identifica únicamente documentos recién cargados o actualizados.',
          }),
          ...buildExtractorDualConfigs('extract_ai_doc_ocr', {
            aiModel: 'gemini-3.6-flash',
            upstreamSourceType: 'drive',
            aiExtractionRowMode: 'single_row',
            aiExtractionSchema: [
              {
                key: 'codigo_procedimiento',
                label: 'Código del Procedimiento',
                name: 'Código del Procedimiento',
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
                hint: 'Nombre oficial de la tarea crítica o estándar de trabajo seguro',
                description: 'Nombre oficial de la tarea crítica o estándar de trabajo seguro',
              },
              {
                key: 'cargos_objetivo',
                label: 'Cargos Objetivo',
                name: 'Cargos Objetivo',
                type: 'string',
                required: true,
                hint: 'Perfiles o áreas operativas obligadas a entrenarse en este procedimiento',
                description: 'Perfiles o áreas operativas obligadas a entrenarse en este procedimiento',
              },
              {
                key: 'peligros_criticos',
                label: 'Peligros Críticos Asociados',
                name: 'Peligros Críticos Asociados',
                type: 'string',
                required: true,
                hint: 'Principales peligros mecánicos, eléctricos, químicos, locativos o de alturas',
                description: 'Principales peligros mecánicos, eléctricos, químicos, locativos o de alturas',
              },
              {
                key: 'epp_obligatorios',
                label: 'EPP y Controles Clave',
                name: 'EPP y Controles Clave',
                type: 'string',
                required: true,
                hint: 'Elementos de protección personal y barreras críticas exigidas durante la labor',
                description: 'Elementos de protección personal y barreras críticas exigidas durante la labor',
              },
              {
                key: 'fecha_vigencia',
                label: 'Fecha de Vigencia',
                name: 'Fecha de Vigencia',
                type: 'date',
                required: false,
                hint: 'Fecha de aprobación o actualización del estándar (AAAA-MM-DD)',
                description: 'Fecha de aprobación o actualización del estándar (AAAA-MM-DD)',
              },
            ],
            customInstruction:
              'Extrae por OCR el código, título, cargos objetivo, peligros críticos, EPP obligatorios y fecha de vigencia de cada procedimiento nuevo.',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'generar_estudio',
            notebookArtifactType: 'infographic',
            notebookPrompt:
              'Genera una guía de estudio e infografía instruccional paso a paso sobre los procedimientos seguros actualizados para formación rápida del personal operativo.',
          }),
          ...buildInputDualConfigs('google_flow', {
            flowAction: 'generar_imagen',
            flowAspectRatio: '1:1',
            flowStyle: 'infografia_editorial',
            flowPrompt:
              'Afiche cuadrado corporativo SST de trabajo seguro paso a paso con equipo de protección personal obligatorio, diagramación limpia estilo editorial',
          }),
          ...buildHitoDualConfigs('hito6_ruta_aprendizaje', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Actualiza la malla formativa y módulos obligatorios por cargo en Rutas de Aprendizaje LMS (Hito 6).',
          }),
          ...buildHitoDualConfigs('hito5_capacitaciones', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Programa la divulgación y evaluación de entendimiento del procedimiento en Cronograma de Capacitaciones (Hito 6).',
          }),
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'new_external_items',
            ifConditionLabel:
              '¿Existen procedimientos seguros nuevos en Google Drive sin sincronizar?',
          },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Coordinador de Capacitaciones SG-SST conforme al artículo 2.2.4.6.11 del Decreto 1072 de 2015. Procesa únicamente los procedimientos nuevos extraídos por el Extractor IA de Documentos.\n\n1) Invoca Google NotebookLM para generar el recurso de estudio tipo infografía dirigido a los cargos objetivo.\n2) Invoca Google Flow Studio en relación 1:1 para diseñar el afiche visual de divulgación operativa.\n3) Actualiza los contenidos y sesiones en Rutas de Aprendizaje LMS y Cronograma de Capacitaciones (Hito 6) y entrega el paquete didáctico en Editor en Vivo WAPPY y Bitácora por Correo.',
  },
  // 20. [atel_inspecciones] Scraping Alturas/SENA + Equipos Alturas (Hito 5) -> Bloqueo ATS (Hito 5)
  {
    presetKey: 'preset_scraping_alturas_sena_equipos',
    name: '🪜 Validación de Certificados de Alturas y SENA con Equipos de Alturas y Bloqueo ATS',
    presetCategory: 'atel_inspecciones',
    presetDescription:
      'Verifica semanalmente certificados de trabajo seguro en alturas y formación SENA mediante Web Scraping con Google Antigravity, los consolida con el Inventario y Vigencia de Equipos de Alturas (Hito 5) y, cuando detecta certificados o equipos próximos a vencer o en estado no apto, actualiza controles preventivos en Análisis de Trabajo Seguro ATS (Hito 5), crea tareas en Tablero Kanban ACPM, agenda recertificaciones en Google Calendar y notifica por Correo.',
    agentTargetName: 'Coordinador de Tareas Críticas',
    agentName: 'Coordinador de Tareas Críticas',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 6,
      minute: 30,
      dayOfWeek: [1],
      daysOfWeek: [1],
      dayOfMonth: 1,
      intervalHours: 24,
    },
    cronExpression: '30 6 * * 1',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_antigravity'],
      extractors: ['scraper_agy_alto_riesgo'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito5_equipos_alturas', 'hito3_ats'],
      outputs: ['acpm_task', 'google_calendar', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '7d' },
          ...buildExtractorDualConfigs('scraper_agy_alto_riesgo', {
            antigravityMode: 'auto',
            scriptEngine: 'chrome_mcp',
            customInstruction:
              'Consulta los registros de certificación SENA y validaciones de trabajo en alturas en portales oficiales para el personal expuesto.',
          }),
          ...buildHitoDualConfigs('hito5_equipos_alturas', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae únicamente arneses, eslingas, líneas de vida y conectores con inspección anual vencida o defecto estructural desde Equipos de Alturas (Hito 5).',
          }),
          ...buildHitoDualConfigs('hito3_ats', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_report',
            generateAppReport: true,
            customInstruction:
              'Registra restricciones de bloqueo preventivo para tareas críticas y emite el reporte de seguridad en Análisis de Trabajo Seguro ATS (Hito 5).',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Unifica los resultados de certificados de alturas SENA consultados vía Web Scraping con el inventario de Equipos de Alturas (Hito 5).',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Existen certificados SENA de alturas vencidos o equipos contra caídas no aptos en Hito 5?',
          },
          out_acpm_task: { ifBranch: 'yes' },
          out_google_calendar: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'SENA Alturas + Equipos',
          },
        ],
      },
    },
    prompt:
      'Actúa como Coordinador de Tareas Críticas bajo la Resolución 4272 de 2021. Analiza exclusivamente los resultados consolidados de certificados de alturas SENA y el estado de los sistemas de protección contra caídas en Equipos de Alturas (Hito 5).\n\n1) Invoca Análisis de Trabajo Seguro ATS (Hito 5) para registrar el bloqueo preventivo de autorización en campo sobre equipos no aptos o personal sin reentrenamiento vigente y generar el informe oficial de seguridad.\n2) Crea acciones inmediatas de recertificación o reemplazo en Tablero Kanban ACPM.\n3) Agenda fechas de inspección o recertificación en Google Calendar y consolida la alerta para Bitácora por Correo.',
  },
  // 21. [atel_inspecciones] Scraping Antecedentes + Sociodemográfico (Hito 2) -> ACPM (Hito 7)
  {
    presetKey: 'preset_scraping_antecedentes_personal_critico',
    name: '⚖️ Verificación de Antecedentes y Procesos Judiciales de Personal Crítico vía Web Scraping',
    presetCategory: 'atel_inspecciones',
    presetDescription:
      'Verifica semanalmente antecedentes, inhabilidades o medidas disciplinarias públicas de conductores, escoltas y personal en roles críticos mediante Google Antigravity, consolida la información con el Perfil Sociodemográfico (Hito 2) y, solo cuando halla novedades nuevas sin auditar, registra acciones de control en Control de ACPM (Hito 7), emite soporte documental en Google Docs, abre seguimiento en Tablero Kanban ACPM y reporta por Correo.',
    agentTargetName: 'Abogado Laboral',
    agentName: 'Abogado Laboral',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 7,
      minute: 30,
      dayOfWeek: [3],
      daysOfWeek: [3],
      dayOfMonth: 1,
      intervalHours: 24,
    },
    cronExpression: '30 7 * * 3',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_antigravity'],
      extractors: ['scraper_agy_antecedentes'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: [],
      includeIfNode: true,
      hitos: ['hito2_perfil_socio', 'hito7_acpm'],
      outputs: ['google_docs', 'acpm_task', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '30d' },
          ...buildExtractorDualConfigs('scraper_agy_antecedentes', {
            antigravityMode: 'auto',
            scriptEngine: 'chrome_mcp',
            customInstruction:
              'Consulta en portales públicos oficiales las validaciones de antecedentes e inhabilidades aplicables a roles críticos y conducción.',
          }),
          ...buildHitoDualConfigs('hito2_perfil_socio', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae la nómina de trabajadores activos en cargos críticos o de seguridad física/vial desde Perfil Sociodemográfico (Hito 2).',
          }),
          ...buildHitoDualConfigs('hito7_acpm', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra acciones preventivas de verificación jurídica y habilitación de cargo en Control de ACPM (Hito 7).',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Unifica las validaciones consultadas en fuentes públicas oficiales con el listado de cargos críticos del Perfil Sociodemográfico (Hito 2).',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Se detectaron novedades o registros pendientes de revisión jurídica en cargos críticos?',
          },
          out_google_docs: { ifBranch: 'yes' },
          out_acpm_task: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'Antecedentes + Nómina',
          },
        ],
      },
    },
    prompt:
      'Actúa como Abogado Laboral en cumplimiento de la Ley 1581 de 2012 sobre tratamiento proporcional y confidencial de datos personales y seguridad en cargos críticos. Analiza únicamente las novedades consolidadas frente al Perfil Sociodemográfico (Hito 2).\n\n1) Documenta el concepto jurídico laboral reservado y las verificaciones pertinentes sin divulgar información sensible innecesaria.\n2) Invoca Control de ACPM (Hito 7) para abrir el seguimiento de cumplimiento documental o reasignación preventiva según corresponda.\n3) Genera el memorando formal para Google Docs, registra tareas en Tablero Kanban ACPM y resume el resultado para Bitácora por Correo.',
  },
  // 22. [atel_inspecciones] Investigación ATEL (Hito 7) -> NotebookLM + Google Flow + Actos/Condiciones (Hito 6)
  {
    presetKey: 'preset_leccion_aprendida_atel_notebooklm_flow',
    name: '🚨 Lección Aprendida de Accidentes ATEL con NotebookLM y Afiche Visual Google Flow',
    presetCategory: 'atel_inspecciones',
    presetDescription:
      'Revisa semanalmente eventos cerrados o en curso dentro de Investigación de Accidentes ATEL (Hito 7). Cuando encuentra investigaciones nuevas sin lección aprendida divulgada, el Simulador de Accidentes SST consulta análisis de causalidad en Google NotebookLM, produce un afiche vertical 9:16 en Google Flow Studio, publica la lección y reporte preventivo en Actos y Condiciones Inseguras (Hito 6) y entrega la pieza en Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Simulador de Accidentes SST',
    agentName: 'Simulador de Accidentes SST',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 9,
      minute: 0,
      dayOfWeek: [2],
      daysOfWeek: [2],
      dayOfMonth: 1,
      intervalHours: 24,
    },
    cronExpression: '0 9 * * 2',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['notebooklm', 'google_flow'],
      includeIfNode: true,
      hitos: ['hito7_investigacion_atel', 'hito4_actos_condiciones'],
      outputs: ['canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '30d' },
          ...buildHitoDualConfigs('hito7_investigacion_atel', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae únicamente eventos e investigaciones reales registradas en Investigación de Accidentes ATEL (Hito 7) pendientes de lección aprendida.',
          }),
          ...buildHitoDualConfigs('hito4_actos_condiciones', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_report',
            generateAppReport: true,
            customInstruction:
              'Registra recomendaciones de alerta temprana y genera el reporte preventivo en Actos y Condiciones Inseguras (Hito 6).',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'consultar',
            notebookPrompt:
              'Analiza causas básicas e inmediatas (NTC 3701) y barreras de ingeniería recomendadas para estructurar una lección aprendida anonimizada de alto impacto.',
          }),
          ...buildInputDualConfigs('google_flow', {
            flowAction: 'generar_imagen',
            flowAspectRatio: '9:16',
            flowStyle: 'infografia_editorial',
            flowPrompt:
              'Afiche vertical de lección aprendida en seguridad industrial sin datos sensibles, ilustrando causa raíz, barrera preventiva y conducta segura, estilo infografía editorial limpia',
          }),
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Existen investigaciones ATEL nuevas en Hito 7 pendientes de lección aprendida?',
          },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Simulador de Accidentes SST especialista en metodología causal NTC 3701 y Resolución 1401 de 2007. Trabaja únicamente con los eventos reales de Investigación de Accidentes ATEL (Hito 7) manteniendo estricto anonimato del trabajador.\n\n1) Consulta en Google NotebookLM patrones de recurrencia y controles de ingeniería aplicables al mecanismo de lesión detectado.\n2) Invoca Google Flow Studio en relación 9:16 estilo infografía editorial para crear el afiche visual de Lección Aprendida.\n3) Registra las acciones preventivas en campo y emite el reporte dentro de Actos y Condiciones Inseguras (Hito 6), preparando la ficha de divulgación para Editor en Vivo WAPPY y Bitácora por Correo.',
  },
  // 23. [legal_cumplimiento] Web Scraping MinTrabajo/SUIN (pre_agent SHA-256) -> NotebookLM + Diagnóstico 0312 (Hito 1) + ACPM (Hito 7)
  {
    presetKey: 'preset_scraping_mintrabajo_cambio_normativo_0312',
    name: '🏛️ Vigilancia Web MinTrabajo y SUIN-Juriscol con Evaluación de Estándares Mínimos (Res. 0312)',
    presetCategory: 'legal_cumplimiento',
    presetDescription:
      'Monitorea semanalmente las páginas normativas del Ministerio del Trabajo y SUIN-Juriscol mediante Web Scraping con control SHA-256 en Etapa 2. Solo cuando detecta cambios reales en normas laborales o de riesgos laborales, el Abogado Laboral agrega la novedad como fuente en Google NotebookLM, evalúa el impacto en Estándares Mínimos Res. 0312 (Hito 1) y Control de ACPM (Hito 7), generando tareas Kanban ACPM, boletín en Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Abogado Laboral',
    agentName: 'Abogado Laboral',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 7,
      minute: 0,
      dayOfWeek: [3],
      daysOfWeek: [3],
      dayOfMonth: 1,
      intervalHours: 24,
    },
    cronExpression: '0 7 * * 3',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_web_scraping_agy'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['notebooklm'],
      includeIfNode: true,
      hitos: ['hito1_diagnostico_0312', 'hito7_acpm'],
      outputs: ['acpm_task', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '30d' },
          ...buildExtractorDualConfigs('extract_web_scraping_agy', {
            targetUrl:
              'https://www.mintrabajo.gov.co/normatividad\nhttps://www.suin-juriscol.gov.co',
            scriptEngine: 'auto_chrome_dom',
            onlyOnContentChange: true,
            customInstruction:
              'Extrae publicaciones, decretos o resoluciones recientes en MinTrabajo y SUIN-Juriscol disparando únicamente cuando cambie la huella SHA-256.',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'agregar_fuente',
            notebookPrompt:
              'Incorpora el texto o síntesis normativa detectada en MinTrabajo y SUIN-Juriscol al cuaderno jurídico SG-SST para análisis histórico comparativo.',
          }),
          ...buildHitoDualConfigs('hito1_diagnostico_0312', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Evalúa e incorpora notas técnicas de adecuación sobre los ítems impactados de Estándares Mínimos Res. 0312 (Hito 1).',
          }),
          ...buildHitoDualConfigs('hito7_acpm', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra acciones preventivas de actualización documental y cumplimiento en Control de ACPM (Hito 7).',
          }),
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'new_external_items',
            ifConditionLabel:
              '¿Se detectaron cambios normativos nuevos (SHA-256 actualizado) en MinTrabajo o SUIN-Juriscol?',
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
      'Actúa como Abogado Laboral especialista en regulación colombiana de Seguridad y Salud en el Trabajo. Analiza exclusivamente los cambios normativos nuevos verificados por SHA-256 en las fuentes de MinTrabajo y SUIN-Juriscol.\n\n1) Agrega la referencia normativa como nueva fuente en Google NotebookLM.\n2) Invoca Estándares Mínimos Res. 0312 (Hito 1) para registrar el impacto técnico sobre los estándares de cumplimiento aplicables.\n3) Registra planes preventivos de adecuación en Control de ACPM (Hito 7) y entrega la nota ejecutiva para Tablero Kanban ACPM, Editor en Vivo WAPPY y Bitácora por Correo.',
  },
  // 24. [legal_cumplimiento] Web Scraping Cortes (pre_agent SHA-256) -> NotebookLM + ACPM (Hito 7)
  {
    presetKey: 'preset_scraping_jurisprudencia_sst_notebooklm',
    name: '⚖️ Monitor de Jurisprudencia Laboral en Altas Cortes vía Web Scraping y Google NotebookLM',
    presetCategory: 'legal_cumplimiento',
    presetDescription:
      'Vigila semanalmente las relatorías de la Corte Suprema de Justicia y el Consejo de Estado mediante Web Scraping inteligente con detección de cambios SHA-256. Únicamente cuando aparecen sentencias o criterios jurisprudenciales nuevos sobre culpa patronal o estabilidad reforzada, el Abogado Laboral los contrasta en Google NotebookLM, crea acciones preventivas en Control de ACPM (Hito 7) y entrega el análisis jurídico en Google Docs, Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Abogado Laboral',
    agentName: 'Abogado Laboral',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 10,
      minute: 0,
      dayOfWeek: [5],
      daysOfWeek: [5],
      dayOfMonth: 1,
      intervalHours: 24,
    },
    cronExpression: '0 10 * * 5',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_web_scraping_agy'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['notebooklm'],
      includeIfNode: true,
      hitos: ['hito7_acpm'],
      outputs: ['google_docs', 'canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '30d' },
          ...buildExtractorDualConfigs('extract_web_scraping_agy', {
            targetUrl:
              'https://www.cortesuprema.gov.co/corte/index.php/relatoria-laboral/\nhttps://www.consejodeestado.gov.co',
            scriptEngine: 'auto_chrome_dom',
            onlyOnContentChange: true,
            customInstruction:
              'Monitorea las relatorías laborales de la Corte Suprema de Justicia y Consejo de Estado disparando solo cuando cambie la huella SHA-256.',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'consultar',
            notebookPrompt:
              'Contrasta precedentes sobre culpa patronal, estabilidad laboral reforzada, fueros de salud y carga probatoria en accidentes de trabajo frente a las sentencias consultadas.',
          }),
          ...buildHitoDualConfigs('hito7_acpm', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra acciones preventivas de blindaje probatorio o actualización contractual en Control de ACPM (Hito 7).',
          }),
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'new_external_items',
            ifConditionLabel:
              '¿Se publicaron providencias nuevas relevantes (SHA-256 actualizado) en Altas Cortes?',
          },
          out_google_docs: { ifBranch: 'yes' },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Abogado Laboral litigante experto en riesgos laborales y responsabilidad civil/laboral patronal. Analiza exclusivamente los fallos o publicaciones nuevas extraídas por Web Scraping en Corte Suprema y Consejo de Estado.\n\n1) Consulta en Google NotebookLM las implicaciones probatorias frente a las prácticas internas de prevención.\n2) Invoca Control de ACPM (Hito 7) para abrir acciones preventivas de fortalecimiento probatorio cuando el criterio jurisprudencial lo amerite.\n3) Redacta el boletín jurisprudencial estructurado para Google Docs, Editor en Vivo WAPPY y Bitácora por Correo.',
  },
  // 25. [legal_cumplimiento] Auditoría Cruzada Política + Plan Emergencias (Hito 1) -> post_agent -> ACPM (Hito 7) + NotebookLM
  {
    presetKey: 'preset_auditoria_cruzada_politica_emergencias_notebooklm',
    name: '🛡️ Auditoría Documental Cruzada de Política SST y Plan de Emergencias con NotebookLM',
    presetCategory: 'legal_cumplimiento',
    presetDescription:
      'Lee en Etapa 2 la Política y Objetivos SST (Hito 1) y el Plan de Emergencias (Hito 1), unifica ambos expedientes mediante unión de ramas y solicita al Auditor SG-SST contrastar su coherencia frente a Google NotebookLM. Con compuerta semántica posterior al Agente, si emite veredicto de brecha abre acciones en Control de ACPM (Hito 7), Tablero Kanban ACPM, Editor en Vivo WAPPY y Bitácora por Correo; si todo es conforme, registra trazabilidad silenciosa.',
    agentTargetName: 'Auditor SG-SST',
    agentName: 'Auditor SG-SST',
    scheduleType: 'monthly',
    scheduleConfig: {
      hour: 8,
      minute: 0,
      dayOfWeek: [1],
      daysOfWeek: [1],
      dayOfMonth: 15,
      intervalHours: 24,
    },
    cronExpression: '0 8 15 * *',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company'],
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
              'Extrae la Política de SST vigente, compromisos firmados y vigencia anual desde Política y Objetivos SST (Hito 1).',
          }),
          ...buildHitoDualConfigs('hito1_plan_emergencias', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae análisis de vulnerabilidad, amenazas priorizadas, brigada y planes de acción desde Plan de Emergencias (Hito 1).',
          }),
          ...buildHitoDualConfigs('hito7_acpm', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra no conformidades o mejoras documentales detectadas durante la auditoría cruzada en Control de ACPM (Hito 7).',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'consultar',
            notebookPrompt:
              'Verifica criterios obligatorios del Decreto 1072 de 2015 (Arts. 2.2.4.6.5, 2.2.4.6.6 y 2.2.4.6.25) para Política de SST y Plan de Prevención, Preparación y Respuesta ante Emergencias.',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Consolida los registros de Política y Objetivos SST (Hito 1) y Plan de Emergencias (Hito 1) antes de la evaluación del Auditor SG-SST.',
          },
          if_router: {
            ifPlacement: 'post_agent',
            ifConditionType: 'ai_verdict',
            ifRuleExpression: '[VEREDICTO_IF: SI]',
            ifConditionLabel:
              '¿El Auditor SG-SST dictamina brechas documentales o vigencia vencida entre Política y Emergencias?',
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
            subtitle: 'Política + Emergencias',
          },
        ],
      },
    },
    prompt:
      'Actúa como Auditor SG-SST evaluando consistencia documental conforme al Decreto 1072 de 2015 (Arts. 2.2.4.6.5, 2.2.4.6.6 y 2.2.4.6.25). Contrasta los expedientes reales consolidados de Política SST (Hito 1) y Plan de Emergencias (Hito 1) usando Google NotebookLM.\n\n1) Revisa vigencia, firma gerencial, alcance a todas las sedes y alineación con las amenazas priorizadas.\n2) Si identificas brechas, desactualización o inconsistencias entre ambos documentos, invoca Control de ACPM (Hito 7) para abrir hallazgo formal y concluye tu informe con la etiqueta exacta [VEREDICTO_IF: SI].\n3) Si ambos documentos están vigentes, completos y plenamente coherentes sin brechas, cierra obligatoriamente con la etiqueta exacta [VEREDICTO_IF: NO].',
  },
  // 26. [riesgos_vial_quimico] Scraping SIMIT/RUNT + Vehículos (Hito 5) -> Matriz PESV (Hito 1)
  {
    presetKey: 'preset_scraping_simit_runt_flota_pesv',
    name: '🚗 Vigilancia Semanal SIMIT y RUNT de Conductores y Vehículos en Hoja de Vida PESV',
    presetCategory: 'riesgos_vial_quimico',
    presetDescription:
      'Consulta semanalmente comparendos en SIMIT y vigencias RUNT mediante Web Scraping con Google Antigravity, los unifica en Etapa 2 con la Hoja de Vida de Vehículos (Hito 5) y, solo cuando detecta multas pendientes, licencias vencidas o bloqueos documentales, actualiza controles de riesgo vial en Matriz PESV (Hito 1) y escala acciones en Tablero Kanban ACPM y Bitácora por Correo.',
    agentTargetName: 'Coordinador de Seguridad Vial',
    agentName: 'Coordinador de Seguridad Vial',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 6,
      minute: 45,
      dayOfWeek: [2],
      daysOfWeek: [2],
      dayOfMonth: 1,
      intervalHours: 24,
    },
    cronExpression: '45 6 * * 2',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_antigravity'],
      extractors: ['scraper_agy_vial_pesv'],
      aiEngine: 'wappy',
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
            scriptEngine: 'chrome_mcp',
            customInstruction:
              'Consulta en línea comparendos SIMIT y estado documental RUNT para las placas y conductores activos de la flota.',
          }),
          ...buildHitoDualConfigs('hito3_vehiculos', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae placas activas, SOAT, revisión técnico-mecánica y conductores asignados desde Hoja de Vida de Vehículos (Hito 5).',
          }),
          ...buildHitoDualConfigs('hito3_matriz_pesv', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Actualiza controles preventivos, nivel de riesgo vial y seguimiento operativo en Matriz PESV (Hito 1).',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Unifica los resultados SIMIT y RUNT extraídos por Web Scraping con la Hoja de Vida de Vehículos (Hito 5) antes de evaluar alertas.',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Existen comparendos SIMIT pendientes o documentos vehiculares vencidos en Hito 5?',
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
            subtitle: 'SIMIT/RUNT + Vehículos',
          },
        ],
      },
    },
    prompt:
      'Actúa como Coordinador de Seguridad Vial conforme a la Resolución 20223040040595 de 2022 (PESV). Analiza únicamente las novedades reales consolidadas entre SIMIT/RUNT y la Hoja de Vida de Vehículos (Hito 5).\n\n1) Presenta la tabla de vehículos y conductores con comparendos sin acuerdo de pago, licencias vencidas o SOAT/RTM por caducar.\n2) Invoca Matriz PESV (Hito 1) para registrar o reforzar los controles viales sobre el individuo y el vehículo.\n3) Genera tareas correctivas en Tablero Kanban ACPM y resume las alertas críticas de despacho para Bitácora por Correo.',
  },
  // 27. [riesgos_vial_quimico] Scraping PubChem + Inventario Químico (Hito 5) -> Matriz SGA (Hito 1) + PubChem API + Google Flow
  {
    presetKey: 'preset_scraping_fichas_sga_afiche_google_flow',
    name: '☣️ Auditoría SGA de Sustancias Químicas con Web Scraping PubChem y Afiche Visual Google Flow',
    presetCategory: 'riesgos_vial_quimico',
    presetDescription:
      'Cruza semanalmente la información técnica de PubChem obtenida por Web Scraping con el Registro e Inventario Químico (Hito 5). Cuando detecta sustancias sin FDS vigente, rótulo SGA incompleto o incompatibilidades químicas, el Ingeniero Químico SST consulta propiedades GHS en PubChem, actualiza reglas de segregación en Compatibilidad Química SGA (Hito 1), genera un afiche vertical 9:16 en Google Flow Studio y entrega resultados en Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Ingeniero Químico SST',
    agentName: 'Ingeniero Químico SST',
    scheduleType: 'weekly',
    scheduleConfig: {
      hour: 8,
      minute: 30,
      dayOfWeek: [3],
      daysOfWeek: [3],
      dayOfMonth: 1,
      intervalHours: 24,
    },
    cronExpression: '30 8 * * 3',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_web_scraping_agy'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['consultar_pubchem_quimico', 'google_flow'],
      includeIfNode: true,
      hitos: ['hito5_registro_quimico', 'hito3_quimicos_sga'],
      outputs: ['canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '30d' },
          ...buildExtractorDualConfigs('extract_web_scraping_agy', {
            targetUrl: 'https://pubchem.ncbi.nlm.nih.gov',
            scriptEngine: 'auto_chrome_dom',
            onlyOnContentChange: false,
            customInstruction:
              'Consulta información pública de fichas GHS y advertencias de almacenamiento seguro en PubChem para las sustancias priorizadas.',
          }),
          ...buildHitoDualConfigs('hito5_registro_quimico', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae sustancias almacenadas sin FDS vigente (< 5 años), sin rótulo SGA o en zonas de riesgo desde Registro Químico (Hito 5).',
          }),
          ...buildHitoDualConfigs('hito3_quimicos_sga', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Actualiza pictogramas SGA, incompatibilidades entre clases ONU y requisitos de segregación en Compatibilidad Química SGA (Hito 1).',
          }),
          ...buildInputDualConfigs('consultar_pubchem_quimico', {
            customInstruction:
              'Consulta pictogramas GHS, frases H/P y clases de peligro oficiales en PubChem para validar la clasificación química exacta.',
          }),
          ...buildInputDualConfigs('google_flow', {
            flowAction: 'generar_imagen',
            flowAspectRatio: '9:16',
            flowStyle: 'infografia_editorial',
            flowPrompt:
              'Afiche vertical de seguridad química bajo Sistema Globalmente Armonizado con segregación de sustancias corrosivas e inflamables y pictogramas claros, estilo infografía editorial',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Unifica los hallazgos de referencia consultados en PubChem con las alertas del Registro Químico (Hito 5).',
          },
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'critical_findings',
            ifConditionLabel:
              '¿Existen sustancias en Hito 5 sin FDS vigente, sin rótulo SGA o con riesgo de incompatibilidad?',
          },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: 'PubChem Web + Químicos',
          },
        ],
      },
    },
    prompt:
      'Actúa como Ingeniero Químico SST en cumplimiento del Decreto 1496 de 2018 (SGA) y la Resolución 773 de 2021. Analiza únicamente los productos químicos críticos detectados en Registro Químico (Hito 5) junto con las consultas técnicas de PubChem.\n\n1) Invoca la herramienta de consulta química PubChem para corroborar pictogramas SGA, indicaciones de peligro H y segregación requerida.\n2) Actualiza la matriz de segregación y controles de bodega en Compatibilidad Química SGA (Hito 1).\n3) Invoca Google Flow Studio en relación 9:16 estilo infografía editorial para generar el afiche visual de prevención química y entrega la síntesis en Editor en Vivo WAPPY y Bitácora por Correo.',
  },
  // 28. [riesgos_vial_quimico] Clima Vial cada 6h: Matriz PESV (Hito 1) -> post_agent -> Clima + Emergencias + Google Flow Video
  {
    presetKey: 'preset_campana_seguridad_vial_clima_flow',
    name: '⛈️ Alerta Climática Vial en Tiempo Real con Cápsula Audiovisual Google Flow Veo',
    presetCategory: 'riesgos_vial_quimico',
    presetDescription:
      'Consulta cada 6 horas las rutas, corredores y factores viales críticos registrados en Matriz PESV (Hito 1). El Especialista en Riesgo Climático evalúa el pronóstico meteorológico en ruta y ubica centros de atención cercanos; mediante compuerta semántica posterior al Agente, si detecta amenaza climática severa genera una cápsula audiovisual vertical 9:16 en Google Flow Veo y despacha alertas por Correo y Google Sheets.',
    agentTargetName: 'Especialista en Riesgo Climático',
    agentName: 'Especialista en Riesgo Climático',
    scheduleType: 'hourly',
    scheduleConfig: {
      hour: 6,
      minute: 0,
      dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      dayOfMonth: 1,
      intervalHours: 6,
    },
    cronExpression: '0 */6 * * *',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company'],
      inputs: ['pronostico_clima_sst', 'buscar_centros_emergencia', 'google_flow'],
      includeIfNode: true,
      hitos: ['hito3_matriz_pesv'],
      outputs: ['email_report', 'google_sheets', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito3_matriz_pesv', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae corredores viales, desplazamientos críticos y factores de riesgo de conducción desde Matriz PESV (Hito 1).',
          }),
          ...buildInputDualConfigs('pronostico_clima_sst', {
            customInstruction:
              'Consulta tormentas, lluvias intensas, baja visibilidad o vientos fuertes en los corredores viales activos.',
          }),
          ...buildInputDualConfigs('buscar_centros_emergencia', {
            customInstruction:
              'Ubica IPS, estaciones de bomberos y centros asistenciales cercanos a los tramos viales con alerta climática severa.',
          }),
          ...buildInputDualConfigs('google_flow', {
            flowAction: 'generar_video',
            flowAspectRatio: '9:16',
            flowStyle: 'corporativo_sst',
            flowCameraMotion: 'paneo_suave',
            flowPrompt:
              'Cápsula vertical corporativa de prevención vial ante lluvia intensa y baja visibilidad con señalización de seguridad y conducción defensiva en carretera',
          }),
          if_router: {
            ifPlacement: 'post_agent',
            ifConditionType: 'ai_verdict',
            ifRuleExpression: '[VEREDICTO_IF: SI]',
            ifConditionLabel:
              '¿Existe amenaza climática severa en los corredores viales monitoreados de Hito 1?',
          },
          out_email_report: { ifBranch: 'yes' },
          out_google_sheets: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Especialista en Riesgo Climático coordinando seguridad en desplazamientos sobre los corredores de Matriz PESV (Hito 1).\n\n1) Invoca el pronóstico climático SST sobre las zonas operativas activas para verificar lluvia torrencial, tormenta eléctrica, neblina densa o deslizamientos.\n2) Si existe amenaza climática relevante: consulta los centros de emergencia cercanos, produce una cápsula de video 9:16 con paneo suave en Google Flow Veo dirigida a los conductores, consolida los datos para Bitácora por Correo y Google Sheets, y termina obligatoriamente con [VEREDICTO_IF: SI].\n3) Si el clima en los corredores está estable y sin amenaza operacional, omite la generación audiovisual y termina obligatoriamente con [VEREDICTO_IF: NO].',
  },
  // 29. [gerencia_auditoria] Flujo Directo Mensual: 0312 (Hito 1) + ACPM (Hito 7) -> Alta Dirección (Hito 7) + NotebookLM + Google Slides
  {
    presetKey: 'preset_notebooklm_presentacion_copasst_gerencia',
    name: '📊 Presentación Gerencial Mensual SG-SST en Google NotebookLM (0312 + ACPM)',
    presetCategory: 'gerencia_auditoria',
    presetDescription:
      'Consolida el día 28 de cada mes los indicadores de Estándares Mínimos Res. 0312 (Hito 1) y el estado de cierres en Control de ACPM (Hito 7) mediante unión de ramas. El Auditor SG-SST genera una presentación ejecutiva en Google NotebookLM y Google Slides, registra las conclusiones oficiales en Revisión por la Alta Dirección (Hito 7) y distribuye el paquete en Editor en Vivo WAPPY, Google Calendar y Bitácora por Correo.',
    agentTargetName: 'Auditor SG-SST',
    agentName: 'Auditor SG-SST',
    scheduleType: 'monthly',
    scheduleConfig: {
      hour: 15,
      minute: 0,
      dayOfWeek: [1],
      daysOfWeek: [1],
      dayOfMonth: 28,
      intervalHours: 24,
    },
    cronExpression: '0 15 28 * *',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: [],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company'],
      inputs: ['notebooklm', 'google_slides'],
      includeIfNode: false,
      hitos: ['hito1_diagnostico_0312', 'hito7_acpm', 'hito7_alta_direccion'],
      outputs: ['canvas_doc', 'google_calendar', 'email_report'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          ...buildHitoDualConfigs('hito1_diagnostico_0312', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae puntaje global de Estándares Mínimos Res. 0312, brechas por ciclo PHVA y cumplimiento porcentual desde Hito 1.',
          }),
          ...buildHitoDualConfigs('hito7_acpm', {
            hitoRole: 'source_read',
            hitoOperationMode: 'read_only',
            appActionMode: 'read_only',
            customInstruction:
              'Extrae tasa de cierre oportuno, tareas vencidas y acciones preventivas activas desde Control de ACPM (Hito 7).',
          }),
          ...buildHitoDualConfigs('hito7_alta_direccion', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_report',
            generateAppReport: true,
            customInstruction:
              'Registra el balance gerencial del periodo y emite el informe oficial de Revisión por la Alta Dirección (Hito 7).',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'generar_estudio',
            notebookArtifactType: 'slide_deck',
            notebookPrompt:
              'Estructura un mazo ejecutivo mensual para comité gerencial con avance Res. 0312, eficacia de ACPM, prioridades de inversión SST y decisiones solicitadas.',
          }),
          ...buildInputDualConfigs('google_slides', {
            customInstruction:
              'Prepara la estructura de diapositivas ejecutivas con indicadores Res. 0312, cierre de ACPM y compromisos gerenciales del próximo mes.',
          }),
          logic_merge_1: {
            mergeStrategy: 'append_all',
            customInstruction:
              'Unifica las métricas de Estándares Mínimos (Hito 1) y Control de ACPM (Hito 7) antes de generar la presentación gerencial.',
          },
        },
        logicNodes: [
          {
            key: 'logic_merge_1',
            logicType: 'merge',
            title: 'Unir Ramas',
            subtitle: '0312 + ACPM',
          },
        ],
      },
    },
    prompt:
      'Actúa como Auditor SG-SST preparando la sesión ejecutiva conforme al artículo 2.2.4.6.31 del Decreto 1072 de 2015. Analiza los datos reales consolidados de Estándares Mínimos Res. 0312 (Hito 1) y Control de ACPM (Hito 7).\n\n1) Invoca Google NotebookLM para generar el guion de presentación (deck) orientado a la gerencia y prepara el esquema en Google Slides.\n2) Registra los hallazgos, decisiones requeridas y genera el informe oficial dentro de Revisión por la Alta Dirección (Hito 7).\n3) Redacta el resumen ejecutivo para Editor en Vivo WAPPY, sugiere el agendamiento de sesión en Google Calendar y despacha por Bitácora por Correo.',
  },
  // 30. [gerencia_auditoria] Monitor Quincenal MinTrabajo Riesgos / Fasecolda (SHA-256) -> NotebookLM + Oportunidades SST (Hito 1)
  {
    presetKey: 'preset_scraping_boletines_arl_oportunidades_sst',
    name: '📡 Monitor Quincenal de Circulares Técnicas ARL y Oportunidades de Mejora SG-SST',
    presetCategory: 'gerencia_auditoria',
    presetDescription:
      'Vigila quincenalmente los boletines de Riesgos Laborales del Ministerio del Trabajo y Fasecolda mediante Web Scraping con huella SHA-256 en Etapa 2. Cuando detecta circulares técnicas o guías preventivas nuevas, el Consultor SG-SST las contrasta en Google NotebookLM, registra iniciativas de mejora en Oportunidades de Mejora SST (Hito 1) y entrega el boletín en Editor en Vivo WAPPY y Bitácora por Correo.',
    agentTargetName: 'Consultor SG-SST',
    agentName: 'Consultor SG-SST',
    scheduleType: 'monthly',
    scheduleConfig: {
      hour: 7,
      minute: 45,
      dayOfWeek: [1],
      daysOfWeek: [1],
      dayOfMonth: 15,
      intervalHours: 24,
    },
    cronExpression: '45 7 1,15 * *',
    isSystemPreset: true,
    workflowNodes: {
      trigger: 'schedule_cron',
      triggers: ['schedule_cron', 'trigger_tenshi'],
      extractors: ['extract_web_scraping_agy'],
      aiEngine: 'wappy',
      aiModel: 'gemini-3.6-flash',
      memoryNode: 'wappy_memory_company',
      memories: ['wappy_memory_company', 'wappy_memory_antiduplicate'],
      inputs: ['notebooklm'],
      includeIfNode: true,
      hitos: ['hito1_oportunidades_sst'],
      outputs: ['canvas_doc', 'email_report', 'wappy_notification'],
      canvasLayout: {
        positions: {},
        edges: [],
        nodeConfigs: {
          sub_memory_wappy_memory_antiduplicate: { dedupWindow: '30d' },
          ...buildExtractorDualConfigs('extract_web_scraping_agy', {
            targetUrl:
              'https://www.mintrabajo.gov.co/web/guest/empleo-y-pensiones/riesgos-laborales\nhttps://www.fasecolda.com',
            scriptEngine: 'auto_chrome_dom',
            onlyOnContentChange: true,
            customInstruction:
              'Vigila circulares de Riesgos Laborales de MinTrabajo y boletines técnicos de Fasecolda disparando solo ante cambios reales SHA-256.',
          }),
          ...buildInputDualConfigs('notebooklm', {
            notebookAction: 'consultar',
            notebookPrompt:
              'Evalúa cómo traducir las nuevas circulares técnicas sectoriales y guías de prevención ARL en oportunidades concretas de mejora continua para el SG-SST de la empresa.',
          }),
          ...buildHitoDualConfigs('hito1_oportunidades_sst', {
            hitoRole: 'agent_tool',
            hitoOperationMode: 'audit_and_update',
            appActionMode: 'write_and_update',
            customInstruction:
              'Registra iniciativas prácticas, buenas prácticas preventivas y mejoras continuas identificadas dentro de Oportunidades de Mejora SST (Hito 1).',
          }),
          if_router: {
            ifPlacement: 'pre_agent',
            ifConditionType: 'new_external_items',
            ifConditionLabel:
              '¿Se detectaron circulares técnicas o boletines sectoriales nuevos (SHA-256 actualizado)?',
          },
          out_canvas_doc: { ifBranch: 'yes' },
          out_email_report: { ifBranch: 'yes' },
          out_wappy_notification: { ifBranch: 'no' },
        },
        logicNodes: [],
      },
    },
    prompt:
      'Actúa como Consultor SG-SST enfocado en mejora continua PHVA conforme al artículo 2.2.4.6.34 del Decreto 1072 de 2015. Analiza únicamente los boletines o circulares técnicas nuevas extraídas de MinTrabajo Riesgos Laborales y Fasecolda.\n\n1) Consulta en Google NotebookLM buenas prácticas sectoriales aplicables al contexto operativo de la empresa.\n2) Invoca Oportunidades de Mejora SST (Hito 1) para registrar las iniciativas priorizadas con beneficio preventivo y factibilidad.\n3) Consolida el boletín de innovación y mejora para Editor en Vivo WAPPY y Bitácora por Correo.',
  },
];

module.exports = {
  SYSTEM_WORKFLOW_PRESETS_VERSION,
  SYSTEM_WORKFLOW_PRESETS_CATALOG,
};
